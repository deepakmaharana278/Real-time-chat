import React, { useState, useRef, useEffect } from "react";
import { socket } from "../socket";

const VoiceMessage = ({ currentUser, selectedUser, onClose }) => {
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState(Array(40).fill(3));

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Animate waveform during recording
  const animateWaveform = () => {
    if (analyserRef.current) {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const bars = Array(40).fill(0).map((_, i) => {
        const index = Math.floor((i / 40) * data.length);
        return Math.max(3, (data[index] / 255) * 48);
      });
      setWaveform(bars);
    }
    animFrameRef.current = requestAnimationFrame(animateWaveform);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup analyser for waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result.split(",")[1]);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(animFrameRef.current);
        setWaveform(Array(40).fill(3));
      };

      mediaRecorder.start();
      setRecording(true);
      setRecorded(false);
      setAudioURL(null);
      setDuration(0);
      setSent(false);

      // Timer
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      animateWaveform();
    } catch (err) {
      alert("Microphone access denied!");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
    setRecorded(true);
  };

  const cancelRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    cancelAnimationFrame(animFrameRef.current);
    clearInterval(timerRef.current);
    setRecording(false);
    setRecorded(false);
    setAudioURL(null);
    setAudioBase64(null);
    setDuration(0);
    setWaveform(Array(40).fill(3));
  };

  const sendVoice = () => {
    if (!audioBase64) return;
    setSending(true);
    socket.emit("send_voice", {
      audio: audioBase64,
      target: selectedUser,
    });
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => onClose(), 1200);
    }, 800);
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
  <div className="w-full max-w-md mb-6 mx-4 rounded-3xl overflow-hidden bg-[#0f0f1a] border border-white/10 shadow-2xl">
    
    <div className="flex items-center justify-between px-6 pt-6 pb-4">
      <div>
        <h3 className="text-white/90 font-semibold text-lg tracking-tight">
          Voice Message
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
          <i className="fas fa-user text-[10px]"></i>
          {selectedUser ? `To: ${selectedUser}` : "Public chat"}
        </p>
      </div>
      <button 
        onClick={onClose}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
      >
        <i className="fas fa-times text-sm"></i>
      </button>
    </div>

    <div className="relative px-6 py-6">
      <div className="absolute inset-x-6 top-0 h-24 bg-linear-to-b from-blue-500/5 to-transparent rounded-3xl"></div>
      
      {/* Waveform Bars */}
      <div className="flex items-center justify-center gap-0.5 h-20 relative z-10">
        {waveform.map((h, i) => (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-75"
            style={{
              height: `${h}px`,
              background: recording
                ? `linear-gradient(180deg, #ef4444, #f87171)`
                : recorded
                ? `linear-gradient(180deg, #3b82f6, #60a5fa)`
                : '#ffffff26',
              boxShadow: recording ? '0 0 10px #ef444480' : 'none',
            }}
          />
        ))}
      </div>
    </div>

    {/* Timer */}
    <div className="flex justify-center mt-2">
      <div className={`text-4xl font-mono font-bold tracking-wider ${
        recording ? 'text-red-500' : 'text-white/80'
      }`}>
        {formatTime(duration)}
      </div>
    </div>

    {/* Status Badge */}
    <div className="flex justify-center mt-3 mb-4">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
        {recording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
        <span className="text-xs font-medium text-gray-400">
          {sent ? (
            <><i className="fas fa-check-circle text-green-500 mr-1"></i> Sent!</>
          ) : sending ? (
            <><i className="fas fa-spinner animate-spin mr-1"></i> Sending...</>
          ) : recorded ? (
            <><i className="fas fa-check text-blue-500 mr-1"></i> Ready to send</>
          ) : recording ? (
            <><i className="fas fa-circle text-red-500 animate-pulse mr-1"></i> Recording...</>
          ) : (
            <><i className="fas fa-microphone mr-1"></i> Hold mic to record</>
          )}
        </span>
      </div>
    </div>

    {/* Audio Preview */}
    {audioURL && !sent && (
      <div className="mx-6 mb-5 p-2 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
        <div className="flex items-center gap-3">
          <i className="fas fa-waveform text-blue-400"></i>
          <audio 
            controls 
            src={audioURL} 
            className="flex-1 h-8 [&::-webkit-media-controls-panel]:bg-transparent [&::-webkit-media-controls-current-time-display]:text-white/80"
          />
        </div>
      </div>
    )}

    <div className="flex items-center justify-center gap-6 px-6 pb-8">
      
      {/* Cancel Button */}
      {(recording || recorded) && !sent && (
        <button
          onClick={cancelRecording}
          className="group relative w-14 h-14 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 transition-all"
        >
          <div className="absolute inset-0 rounded-full border border-red-500/20 group-hover:border-red-500/40"></div>
          <i className="fas fa-trash text-red-500 text-lg"></i>
        </button>
      )}

      {!recorded && !sent && (
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
          onTouchEnd={stopRecording}
          className="relative w-24 h-24 rounded-full flex items-center justify-center select-none group"
        >
          <div className={`absolute inset-0 rounded-full ${
            recording ? 'animate-ping bg-red-500/40' : 'bg-blue-500/20'
          }`}></div>
          <div className={`absolute inset-2 rounded-full ${
            recording ? 'animate-pulse bg-red-500/30' : 'bg-blue-500/30'
          }`}></div>
          
          {/* Main Button */}
          <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
            recording 
              ? 'bg-linear-to-br from-red-500 to-red-600 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
              : 'bg-linear-to-br from-blue-500 to-blue-600 hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
          }`}>
            <i className={`fas fa-microphone text-white text-2xl ${
              recording ? 'animate-pulse' : ''
            }`}></i>
          </div>
        </button>
      )}

      {/* Send Button */}
      {recorded && !sent && (
        <button
          onClick={sendVoice}
          disabled={sending}
          className="group relative w-24 h-24 rounded-full flex items-center justify-center"
        >
          {/* Pulse Ring */}
          <div className="absolute inset-0 rounded-full animate-ping bg-green-500/20"></div>
          
          {/* Main Button */}
          <div className={`relative w-20 h-20 rounded-full flex items-center justify-center bg-linear-to-br from-green-500 to-green-600 transition-all hover:scale-105 shadow-[0_0_30px_rgba(34,197,94,0.4)] ${
            sending ? 'opacity-70 cursor-not-allowed' : ''
          }`}>
            <i className="fa-solid fa-paper-plane text-white text-2xl"></i>
          </div>
        </button>
      )}
    </div>


    {!recording && !recorded && (
      <div className="text-center pb-6">
        <span className="text-xs text-gray-600 bg-white/5 px-4 py-2 rounded-full">
          <i className="fas fa-hand-pointer mr-1"></i>
          Hold the button to record · Release to stop
        </span>
      </div>
    )}

    {/* Waveform Visualization Effect */}
    {recording && (
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-red-500 via-yellow-500 to-red-500 animate-pulse"></div>
    )}
  </div>
</div>
  );
};

export default VoiceMessage;