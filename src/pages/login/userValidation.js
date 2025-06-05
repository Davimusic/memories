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
import termsAndConditions from '@/functions/memories/login/termsAndConditions'; 

const UserValidation = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const initialMount = useRef(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && initialMount.current) {
        const userEmail = user.providerData[0]?.email || user.email || '';
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
        localStorage.setItem('userName', user.displayName || 'User');
        localStorage.setItem('userImage', user.photoURL || '');

        const redirectPath = localStorage.getItem('redirectPath') || '/memories';
        try {
          localStorage.removeItem('reason');
          localStorage.removeItem('redirectPath');
          router.push(redirectPath);
        } catch (error) {
          console.error('Error in post-auth handling:', error);
          setError('Error completing the process');
          toast.error('Error completing the process');
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

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!hasAgreedToTerms) {
      setError('You must agree to the terms and conditions to proceed.');
      toast.error('You must agree to the terms and conditions to proceed.');
      return;
    }
    setError('');

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const redirectPath = localStorage.getItem('redirectPath') || '/memories';
      localStorage.removeItem('redirectPath');
      localStorage.removeItem('reason');
      router.push(redirectPath);
    } catch (error) {
      console.error('Error signing in with email/password:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    if (isLoading) return;
    setError('');

    setIsLoading(true);
    try {
      const { user } = await handleGoogleLogin(setError, setIsLoading, hasAgreedToTerms, 'userEmailValidationOnly', router);
      if (user) {
        const redirectPath = localStorage.getItem('redirectPath') || '/memories';
        localStorage.removeItem('redirectPath');
        localStorage.removeItem('reason');
        router.push(redirectPath);
      }
    } catch (error) {
      // Error already handled in handleGoogleLogin
    }
  };

  return (
    <div className="fullscreen-floating">
      {error && <p className="error-message">{error}</p>}
      <BackgroundGeneric isLoading={isLoading}>
        <div className="login-container">
          <form onSubmit={handleEmailPasswordSubmit} className="login-form">
            <h2 className="login-title">Validate User</h2>
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
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || !hasAgreedToTerms}
            >
              {isLoading ? <span className="loading-spinner">Validating...</span> : 'Validate with Email'}
            </button>
            <button
              type="button"
              onClick={handleGoogleSubmit}
              className="google-button"
              disabled={isLoading || !hasAgreedToTerms}
            >
              {isLoading ? (
                <span className="loading-spinner">Validating...</span>
              ) : (
                <>
                  <FaGoogle className="google-icon" /> Validate with Google
                </>
              )}
            </button>
            <div className="terms-section">
              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  id="terms"
                  checked={hasAgreedToTerms}
                  onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                  disabled={isLoading}
                />
                <label htmlFor="terms">
                  I have read and agree to the{' '}
                  <span
                    className="terms-link"
                    onClick={() => !isLoading && setIsTermsModalOpen(true)}
                    style={{ cursor: isLoading ? 'not-allowed' : 'pointer', textDecoration: 'underline' }}
                  >
                    Terms and Conditions
                  </span>
                </label>
              </div>
            </div>
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
            <p
              className="forgot-password-link"
              onClick={() => {
                if (isLoading) return;
                localStorage.setItem('reason', null);
                router.push('/login');
              }}
            >
              Already have an account? Login
            </p>
            <p
              className="forgot-password-link"
              onClick={() => {
                if (isLoading) return;
                localStorage.setItem('reason', 'forgotPassword');
                router.push('/login/forgotPassword');
              }}
            >
              Forgot your password?
            </p>
          </form>
          <Modal isOpen={isModalOpen} onClose={() => !isLoading && setIsModalOpen(false)}>
            <p className="modal-content">{modalMessage}</p>
            <button onClick={() => !isLoading && setIsModalOpen(false)} className="button2">
              Close
            </button>
          </Modal>
          <Modal isOpen={isTermsModalOpen} onClose={() => !isLoading && setIsTermsModalOpen(false)}>
            <div className="modal-content" dangerouslySetInnerHTML={{ __html: termsAndConditions() }} />
          </Modal>
        </div>
      </BackgroundGeneric>
    </div>
  );
};

export default UserValidation;