import eventlet
eventlet.monkey_patch()

import socketio

# Create Socket.IO server
sio = socketio.Server(
    cors_allowed_origins="*",
    async_mode="eventlet"
)

# Create WSGI app
app = socketio.WSGIApp(sio)


@sio.event
def connect(sid, environ):
    print("User connected:", sid)


@sio.event
def send_message(sid, data):
    print("Message:", data)

    sio.emit("receive_message", data)


@sio.event
def disconnect(sid):
    print("User disconnected:", sid)


if __name__ == "__main__":
    print("Socket.IO server running on port 5000")

    eventlet.wsgi.server(
        eventlet.listen(("0.0.0.0", 5000)),
        app
    )