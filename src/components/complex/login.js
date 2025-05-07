import React, { useState, useEffect, useRef } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../../../firebase';
import ShowHide from './complex/../showHide';
import Modal from './complex/../modal';
import '../../estilos/general/login.css';
import '../../estilos/general/general.css'
import BackgroundGeneric from './backgroundGeneric';
import { useRouter } from 'next/navigation';
import { FaGoogle, FaEnvelope, FaLock } from 'react-icons/fa';

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSignIn, setIsSignIn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  const initialMount = useRef(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userEmail = user.providerData[0]?.email || user.email || '';
        
        localStorage.setItem('userName', user.displayName || 'User');
        localStorage.setItem('userImage', user.photoURL || '');
        localStorage.setItem('userEmail', userEmail);

        // Redirigir solo en el montaje inicial si el usuario ya está autenticado
        if (initialMount.current) {
          const redirectPath = localStorage.getItem('redirectPath') || '/memories';
          localStorage.removeItem('redirectPath');
          localStorage.removeItem('reason');
          router.push(redirectPath);
        }
      } else {
        localStorage.removeItem('userName');
        localStorage.removeItem('userImage');
        localStorage.removeItem('userEmail');
      }
      initialMount.current = false;
    });
    
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    console.log(localStorage.getItem('redirectPath'));
    console.log(localStorage.getItem('reason'));
  }, []);

  const handleUserAfterAuth = async (uid, email, authType) => {
    try {
      const response = await fetch('/api/handleUserAfterAuth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email, authType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${errorData.details || 'Unknown error'}`);
      }

      const data = await response.json();
      if (data.success) {
        const user = auth.currentUser;
        if (user) {
          localStorage.setItem('userMyLikes', data.myLikes || '');
        }
        setModalMessage(data.message);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Error: ${error.message}`);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let userCredential;
      if (isSignIn) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;
      const reason = localStorage.getItem('reason');

      // Llamar a handleUserAfterAuth solo si no es validación de email
      if (reason !== 'userEmailValidationOnly') {
        await handleUserAfterAuth(user.uid, user.email, isSignIn ? 'signIn' : 'login');
      }

      // Redirigir después de manejar la autenticación
      const redirectPath = localStorage.getItem('redirectPath') || '/memories';
      localStorage.removeItem('redirectPath');
      localStorage.removeItem('reason');
      router.push(redirectPath);

    } catch (error) {
      console.error('Error:', error);
      switch (error.code) {
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/email-already-in-use':
          setError('Email already in use.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        case 'auth/user-not-found':
          setError('Email not found.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        default:
          setError(`An unexpected error occurred: ${error.message}`);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = user.providerData[0]?.email || user.email;
      const reason = localStorage.getItem('reason');

      if (reason !== 'userEmailValidationOnly') {
        await handleUserAfterAuth(user.uid, email, 'google');
      }

      const redirectPath = localStorage.getItem('redirectPath') || '/memories';
      localStorage.removeItem('redirectPath');
      localStorage.removeItem('reason');
      router.push(redirectPath);

    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      setError(`Error: ${error.message}`);
    }
  };



  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('userName');
      localStorage.removeItem('userImage');
      localStorage.removeItem('userEmail');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setModalMessage('A password reset email has been sent. Please check your inbox.');
      setIsModalOpen(true);
      setIsForgotPassword(false);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      setError('Error sending reset email. Please try again.');
    }
  };

  return (
    <div className='fullscreen-floating'>
        <BackgroundGeneric isLoading={true}>
      <div className="login-container">
        {loginSuccess && (
          <div className="login-success-message">
            <p>Login successful! Redirecting...</p>
          </div>
        )}
        <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit} className="login-form">
          <h2 className="login-title">{isForgotPassword ? 'Forgot Password' : isSignIn ? 'Sign In' : 'Login'}</h2>
          {error && <p className="error-message">{error}</p>}
          <div className="input-group">
            <label htmlFor="email" className="input-label">
              <FaEnvelope className="input-icon" /> Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="Enter your email"
              required
            />
          </div>
          {!isForgotPassword && (
            <div className="input-group">
              <label htmlFor="password" className="input-label">
                <FaLock className="input-icon" /> Password
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                  required
                />
                <div className="show-hide-icon" onClick={() => setShowPassword(!showPassword)}>
                  <ShowHide
                    size={24}
                    onClick={() => setShowPassword(!showPassword)}
                    isVisible={showPassword}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          )}
          <button type="submit" className="submit-button">
            {isForgotPassword ? 'Send Reset Email' : isSignIn ? 'Sign In' : 'Login'}
          </button>
          {!isForgotPassword && (
            <button type="button" onClick={handleGoogleLogin} className="google-button">
              <FaGoogle className="google-icon" /> Login with Google
            </button>
          )}
          {!isForgotPassword && (
            <p className="forgot-password-link" onClick={() => setIsSignIn((prev) => !prev)}>
              {isSignIn ? 'Already have an account? Login' : 'Create an account'}
            </p>
          )}
          {!isForgotPassword && (
            <p className="forgot-password-link" onClick={() => setIsForgotPassword(true)}>
              Forgot your password?
            </p>
          )}
          {isForgotPassword && (
            <p className="forgot-password-link" onClick={() => setIsForgotPassword(false)}>
              Back to Login
            </p>
          )}
        </form>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <p className="modal-content">{modalMessage}</p>
          <button onClick={() => setIsModalOpen(false)} className="modal-button">
            Close
          </button>
        </Modal>
      </div>
    </BackgroundGeneric>
    </div>
  );
};

export default Login;