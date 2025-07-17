'use client';

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
import { auth } from '../../../firebase'
import ShowHide from '@/components/complex/showHide';
import Modal from '@/components/complex/modal';
import '../../estilos/general/login/loginUser.css' 
import '../../app/globals.css'
import BackgroundGeneric from '@/components/complex/backgroundGeneric';
import { useRouter } from 'next/navigation';
import { FaGoogle, FaEnvelope, FaLock } from 'react-icons/fa';
//import { toast } from 'react-toastify';
import { handleGoogleLogin, handleLogout, handleUserAfterAuth, getErrorMessage } from '../../functions/memories/login/authUtils';


const RegularLogin = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const initialMount = useRef(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && initialMount.current) {
        const userEmail = user?.providerData[0]?.email || user.email || '';
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
        localStorage.setItem('userName', user.displayName || 'User');
        localStorage.setItem('userImage', user.photoURL || '');

        const redirectPath = localStorage.getItem('redirectPath');// || '/memories';
        console.log(redirectPath);
        
        try {
          await handleUserAfterAuth(user.uid, userEmail, 'login', setError, setModalMessage, setIsModalOpen, router);
          localStorage.removeItem('redirectPath');
          router.push(redirectPath);
        } catch (error) {
          console.error('Error in post-auth handling:', error);
        } finally {
          setIsLoading(false);
        }
        initialMount.current = false;
      } else if (!user) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userImage');
        localStorage.removeItem('userEmail');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await handleUserAfterAuth(user.uid, user.email, 'login', setError, setModalMessage, setIsModalOpen, router);
      const redirectPath = localStorage.getItem('redirectPath') || '/';
      console.log(redirectPath);
      
      localStorage.removeItem('redirectPath');
      router.push(redirectPath);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      //toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fullscreen-floating">
      <BackgroundGeneric isLoading={isLoading}>
        <div className="login-container">
          <form onSubmit={handleSubmit} className="login-form">
            <h2 className="login-title">Login</h2>
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
                disabled={isLoading}
              />
            </div>
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
                  disabled={isLoading}
                />
                <div className="show-hide-icon" onClick={() => !isLoading && setShowPassword(!showPassword)}>
                  <ShowHide
                    size={24}
                    onClick={() => !isLoading && setShowPassword(!showPassword)}
                    isVisible={showPassword}
                    style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                  />
                </div>
              </div>
            </div>
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? <span className="loading-spinner">Validating...</span> : 'Login'}
            </button>
            <button
              type="button"
              onClick={() => handleGoogleLogin(setError, setIsLoading, true, null, router)}
              className="google-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner">Validating...</span>
              ) : (
                <>
                  <FaGoogle className="google-icon" /> Login with Google
                </>
              )}
            </button>
            <p
              className="forgot-password-link"
              onClick={() => {
                if (isLoading) return;
                localStorage.setItem('reason', 'forgotPassword');
                router.push('/login/forgotPassword'); // Redirect to wrapper to handle ForgotPassword
              }}
            >
              Forgot your password?
            </p>
            <p
              className="forgot-password-link"
              onClick={() => {
                if (isLoading) return;
                localStorage.setItem('reason', 'createNewUser');
                router.push('/login/createNewUser'); // Redirect to wrapper to handle SignIn
              }}
            >
              Create an account
            </p>
          </form>
          <Modal isOpen={isModalOpen} onClose={() => !isLoading && setIsModalOpen(false)}>
            <p className="modal-content">{modalMessage}</p>
            <button onClick={() => !isLoading && setIsModalOpen(false)} className="button2">
              Close
            </button>
          </Modal>
        </div>
      </BackgroundGeneric>
    </div>
  );
};

export default RegularLogin;