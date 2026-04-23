import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../auth.css';

const API_URL = "http://localhost:8000/user";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_URL}/verify-email/${token}/`);
        const data = await response.json();
        
        if (response.status === 200) {
          setStatus('success');
          setEmail(data.email || '');
          
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Email verified successfully! Please login.',
                email: data.email 
              }
            });
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="auth-root">
      <div className="container">
      <div className="left-panel">
        <div className="decorative-circle-1" />
        <div className="decorative-circle-2" />
        <div className="decorative-circle-3" />

        <div>
          <div className="brand-logo">
            <div className="brand-dot" />
          </div>
          <div>
            <p className="brand-badge">
              {status === 'success' ? 'Email Verified' : status === 'error' ? 'Verification Failed' : 'Verifying'}
            </p>
            <h1 className="brand-title">
              {status === 'success' ? <>Email<br /><em>Verified!</em></> 
               : status === 'error' ? <>Verification<br /><em>Failed</em></>
               : <>Verifying<br /><em>Your Email</em></>}
            </h1>
          </div>
        </div>

        <p className="footer-note">
          Secure, verified access. Your credentials are encrypted end-to-end.
        </p>
      </div>

      <div className="right-panel">
        <div className="form-wrapper fade-in">
          {status === 'verifying' && (
            <>
              <div className="text-center">
                <div className="spinner-container">
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: '#c9a84c' }}></i>
                </div>
                <h3 style={{ textAlign: 'center', marginTop: '20px', color: '#4a4640' }}>Verifying your email...</h3>
                <p style={{ textAlign: 'center', color: '#666', marginTop: '10px' }}>Please wait while we verify your email address</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="success-animation" style={{ textAlign: 'center' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '80px', color: '#4CAF50' }}></i>
              </div>
              <h3 style={{ textAlign: 'center', marginTop: '20px', color: '#4a4640' }}>Email Verified Successfully!</h3>
              <p style={{ textAlign: 'center', color: '#666', marginTop: '10px' }}>{message}</p>
              <p style={{ textAlign: 'center', color: '#999', marginTop: '10px', fontSize: '14px' }}>Redirecting to login page in 3 seconds...</p>
              <button
                onClick={() => navigate('/login', { state: { email } })}
                className="auth-submit submit-btn"
                style={{ marginTop: '20px', width: '100%' }}
              >
                Login Now
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="error-animation" style={{ textAlign: 'center' }}>
                <i className="fas fa-times-circle" style={{ fontSize: '80px', color: '#f44336' }}></i>
              </div>
              <h3 style={{ textAlign: 'center', marginTop: '20px', color: '#4a4640' }}>Verification Failed</h3>
              <p style={{ textAlign: 'center', color: '#666', marginTop: '10px' }}>{message}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => navigate('/login')}
                  className="auth-submit submit-btn"
                  style={{ flex: 1 }}
                >
                  Go to Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="auth-submit submit-btn"
                  style={{ flex: 1, background: '#6c757d' }}
                >
                  Register Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default VerifyEmail;