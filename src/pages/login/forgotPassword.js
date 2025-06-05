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
import { toast } from 'react-toastify';
import { handleGoogleLogin, handleLogout, handleUserAfterAuth, getErrorMessage } from '../../functions/memories/login/authUtils';


const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email) {
      setError('Please enter your email address.');
      toast.error('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
      });
      setModalMessage('A password reset email has been sent. Please check your inbox and spam folder.');
      setIsModalOpen(true);
      setEmail('');
    } catch (error) {
      console.error('Error sending password reset email:', error.code, error.message);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fullscreen-floating">
      {error && <p className="error-message">{error}</p>}
      <BackgroundGeneric isLoading={isLoading}>
        <div className="login-container">
          <form onSubmit={handleForgotPassword} className="login-form">
            <h2 className="login-title">Forgot Password</h2>
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
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? <span className="loading-spinner">Validating...</span> : 'Send Reset Email'}
            </button>
            <p
              className="forgot-password-link"
              onClick={() => {
                if (isLoading) return;
                localStorage.setItem('reason', null);
                router.push('/login');
              }}
            >
              Back to Login
            </p>
            <p
              className="forgot-password-link"
              onClick={() => {
                if (isLoading) return;
                localStorage.setItem('reason', 'createNewUser');
                router.push('/login/createNewUser');
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

export default ForgotPassword;