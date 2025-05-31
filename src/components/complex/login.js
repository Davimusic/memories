'use client'

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
import '../../estilos/general/general.css';
import BackgroundGeneric from './backgroundGeneric';
import { useRouter } from 'next/navigation';
import { FaGoogle, FaEnvelope, FaLock } from 'react-icons/fa';
import { toast } from 'react-toastify';














const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSignIn, setIsSignIn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  const [modalMessage, setModalMessage] = useState('');
  const [reason, setReason] = useState(null);
  const initialMount = useRef(true);
  const actionCompleted = useRef(false);
  const reasonRef = useRef(null);

  const notifySuccess = (message) => toast.success(message);
  const notifyFail = (message) => toast.error(message);

  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  useEffect(() => {
    const storedReason = localStorage.getItem('reason');
    if (storedReason) {
      reasonRef.current = storedReason;
      setReason(storedReason);
      console.log('reasonRef set to:', storedReason);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && initialMount.current) {
        const userEmail = user.providerData[0]?.email || user.email || '';
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
        localStorage.setItem('userName', user.displayName || 'User');
        localStorage.setItem('userImage', user.photoURL || '');

        const redirectPath = localStorage.getItem('redirectPath') || '/memories';

        try {
          if (reasonRef.current === 'userEmailValidationOnly') {
            console.log('login userEmailValidationOnly');
            actionCompleted.current = true;
            localStorage.removeItem('reason');
            localStorage.removeItem('redirectPath');
            router.push(redirectPath);
          } else if (reasonRef.current === 'createNewUser') {
            await handleUserAfterAuth(user.uid, userEmail, 'signIn');
            actionCompleted.current = true;
            localStorage.removeItem('reason');
            localStorage.removeItem('redirectPath');
            router.push(redirectPath);
          } else if (reasonRef.current) {
            await handleUserAfterAuth(user.uid, userEmail, 'login');
            actionCompleted.current = true;
            localStorage.removeItem('reason');
            localStorage.removeItem('redirectPath');
            router.push(redirectPath);
          } else {
            console.log('default login');
            localStorage.removeItem('redirectPath');
            router.push(redirectPath);
          }
        } catch (error) {
          console.error('Error in post-auth handling:', error);
          setError('Error completing the process');
          notifyFail('Error completing the process');
        } finally {
          setIsLoading(false); // Reset loading state
        }

        initialMount.current = false;
      } else if (!user) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userImage');
        localStorage.removeItem('userEmail');
      }
    });

    return () => {
      unsubscribe();
      if (!actionCompleted.current) {
        localStorage.removeItem('reason');
      }
    };
  }, [router]);

  const handleUserAfterAuth = async (uid, email, authType) => {
    console.log('calling handleUserAfterAuth...');
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, email, authType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${errorData.details || 'Unknown error'}`);
      }

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('userMyLikes', data.myLikes || '');
        setModalMessage(data.message);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Error: ${error.message}`);
      notifyFail(`Error: ${error.message}`);
      throw error; // Rethrow to handle in caller
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions
    setError('');

    // Check if terms agreement is required and not checked
    if ((reason === 'createNewUser' || reason === 'userEmailValidationOnly') && !hasAgreedToTerms) {
      setError('You must agree to the terms and conditions to proceed.');
      notifyFail('You must agree to the terms and conditions to proceed.');
      return;
    }

    setIsLoading(true); // Start loading
    try {
      let userCredential;
      if (isSignIn) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;

      if (reasonRef.current !== 'userEmailValidationOnly') {
        console.log('submit login:', reasonRef.current);
        await handleUserAfterAuth(user.uid, user.email, isSignIn ? 'signIn' : 'login');
      }

      const redirectPath = localStorage.getItem('redirectPath') || '/memories';
      localStorage.removeItem('redirectPath');
      localStorage.removeItem('reason');
      router.push(redirectPath);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      notifyFail(errorMessage);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return; // Prevent multiple submissions
    // Check if terms agreement is required and not checked
    if ((reason === 'createNewUser' || reason === 'userEmailValidationOnly') && !hasAgreedToTerms) {
      setError('You must agree to the terms and conditions to proceed.');
      notifyFail('You must agree to the terms and conditions to proceed.');
      return;
    }

    setIsLoading(true); // Start loading
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = user.providerData[0]?.email || user.email;

      if (reasonRef.current !== 'userEmailValidationOnly') {
        await handleUserAfterAuth(user.uid, email, 'google');
      }

      const redirectPath = localStorage.getItem('redirectPath') || '/memories';
      localStorage.removeItem('redirectPath');
      localStorage.removeItem('reason');
      router.push(redirectPath);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      notifyFail(errorMessage);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleLogout = async () => {
    if (isLoading) return; // Prevent action during loading
    setIsLoading(true);
    try {
      await signOut(auth);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('userImage');
      localStorage.removeItem('userEmail');
      notifySuccess('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to log out');
      notifyFail('Failed to log out');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions
    if (!email) {
      setError('Please enter your email address.');
      notifyFail('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting to send password reset email to:', email);
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
      });
      console.log('Password reset email sent successfully');
      setModalMessage('A password reset email has been sent. Please check your inbox and spam folder.');
      setIsModalOpen(true);
      setIsForgotPassword(false);
      setEmail('');
    } catch (error) {
      console.error('Error sending password reset email:', error.code, error.message);
      let errorMessage;
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          errorMessage = `Failed to send reset email: ${error.message}`;
      }
      setError(errorMessage);
      notifyFail(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'Email already in use.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/user-not-found':
        return 'Email not found.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      default:
        return `An unexpected error occurred: ${error.message}`;
    }
  };

  // Sample terms and conditions content
  const termsAndConditions = `
    <h2>Terms and Conditions of Use</h2>
    <p>By using this platform, you agree to the following terms and conditions. If you do not agree, do not use the service.</p>

    <h3>1. Acceptance and User Responsibility</h3>
    <p>You are responsible for all activities you perform on the platform, including the content you upload (such as memories) and the invitations you send. You must not upload illegal, offensive, defamatory content, or content that infringes copyright, trademarks, or any applicable law. You agree to indemnify and hold the platform harmless from any claim, loss, damage, or legal liability arising from your use or misuse of the service.</p>

    <h3>2. Visibility Options</h3>
    <h4>Public Content</h4>
    <p>Memories marked as public can be viewed by anyone without registration or login. The platform is not responsible for how this content is used, shared, or modified. You grant the platform a limited, non-exclusive, royalty-free license to display, distribute, and promote public content, but you retain the copyright. The platform may use public data for analysis or promotion without revealing personal information unless required by a court order.</p>

    <h4>Private Content, User-Only, or By Invitation</h4>
    <p>Access requires registration and login. Invitees must create an account and accept these terms. You are responsible for managing invitations securely and informing invitees of the registration requirement. The platform may revoke access or suspend accounts if violations are detected.</p>

    <h3>3. Platform Liability Exemption</h3>
    <p>The platform acts as a technical host, not an editor of user-uploaded content. We are not responsible for damages, losses, or claims resulting from the use of the platform, including data loss, unauthorized access, or inappropriate content, except in cases of proven gross negligence. We do not guarantee constant service availability or content accuracy.</p>

    <h3>4. Privacy and Data</h3>
    <p>For public content, we do not collect personal data unless provided voluntarily. For restricted content, we use registration data (email, name) solely for authentication and service improvement, as outlined in our Privacy Policy. We may disclose information if required by law.</p>

    <h3>5. Prohibitions</h3>
    <ul>
      <li>Violating any law, statute, ordinance, or regulation.</li>
      <li>Infringing intellectual property rights or other rights of third parties, including copyright, trademark, patent, trade secret, or moral rights.</li>
      <li>Uploading content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, libelous, invasive of privacy, hateful, or racially, ethnically, or otherwise objectionable.</li>
      <li>Impersonating any person or entity or misrepresenting your affiliation.</li>
      <li>Interfering with or disrupting the platform or its servers/networks.</li>
      <li>Attempting unauthorized access to the platform or other accounts/systems.</li>
      <li>Collecting or harvesting personally identifiable data without consent.</li>
      <li>Advertising or soliciting without prior written consent.</li>
      <li>Transmitting viruses, worms, or other harmful items.</li>
    </ul>
    <p>Violations may result in immediate account suspension or termination without notice.</p>

    <h3>6. Mandatory Acceptance</h3>
    <p>By creating an account, uploading content, or accepting an invitation, you declare that you have read, understood, and accepted these terms. If you do not accept them, you cannot use the platform.</p>

    <h3>7. Intellectual Property</h3>
    <p>By uploading content, you warrant that you have all necessary rights, licenses, consents, and permissions, and that the content does not infringe third-party intellectual property rights. You retain ownership of your content but grant the platform a worldwide, non-exclusive, royalty-free license to use, reproduce, distribute, prepare derivative works of, display, and perform the content for operating and promoting the platform. This license is limited to service provision and does not transfer ownership.</p>

    <h3>8. Account Management</h3>
    <p>The platform may suspend or terminate your account for violating these terms. Upon suspension or termination, your content and associated data may be deleted. If you believe your account was unjustly suspended or terminated, contact us at davipianof@gmail.com to appeal. You may request account and data deletion at any time, provided you have not violated these terms.</p>

    <h3>9. Amendments</h3>
    <p>The platform may modify these terms at any time. Changes will be posted on the platform, and continued use constitutes acceptance of the updated terms.</p>

    <h3>10. Applicable Law and Dispute Resolution</h3>
    <p>These terms are governed by the laws of [country or region], without regard to conflict of law provisions. Disputes arising from these terms will be resolved exclusively by the courts of [city or region].</p>

    <h3>11. Links to Third Parties</h3>
    <p>Links to third-party websites are provided for convenience. The platform is not responsible for their content, policies, or practices.</p>

    <h3>12. Age Restrictions</h3>
    <p>You must be at least 13 years old to create an account. If under 13, you must obtain parental or guardian consent before using the service.</p>

    <h3>13. Contact Information</h3>
    <p>For questions, comments, or complaints about these terms, contact us at davipianof@gmail.com.</p>

    <h3>14. Reporting Breaches</h3>
    <p>If you believe content violates these terms or applicable law, report it to davipianof@gmail.com. We will review reports and take appropriate action, such as removing content or suspending accounts.</p>
`;



  return (
    <div className="fullscreen-floating">
      {/*error && <p className="error-message">{error}</p>} {/* Error message outside form */}
      <BackgroundGeneric isLoading={isLoading}>
        <div className="login-container">
          
          <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit} className="login-form">
            <h2 className="login-title">
              {isForgotPassword
                ? 'Forgot Password'
                : reason === 'userEmailValidationOnly'
                ? 'Validate User'
                : isSignIn
                ? 'Sign In'
                : 'Login'}
            </h2>
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
                disabled={isLoading} // Disable input during loading
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
                    disabled={isLoading} // Disable input during loading
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
            )}
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || ((reason === 'createNewUser' || reason === 'userEmailValidationOnly') && !hasAgreedToTerms)}
            >
              {isLoading ? (
                <span className="loading-spinner">Validating...</span>
              ) : isForgotPassword ? (
                'Send Reset Email'
              ) : isSignIn ? (
                'Sign In'
              ) : (
                'Login'
              )}
            </button>
            {!isForgotPassword && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="google-button"
                disabled={isLoading || ((reason === 'createNewUser' || reason === 'userEmailValidationOnly') && !hasAgreedToTerms)}
              >
                {isLoading ? (
                  <span className="loading-spinner">Validating...</span>
                ) : (
                  <>
                    <FaGoogle className="google-icon" /> Login with Google
                  </>
                )}
              </button>
            )}
            {!isForgotPassword && (
              <p
                className="forgot-password-link"
                onClick={() => {
                  if (isLoading) return; // Prevent action during loading
                  console.log('Toggling Sign In/Login mode');
                  setIsSignIn((prev) => {
                    const newSignInState = !prev;
                    const newReason = reasonRef.current === 'userEmailValidationOnly'
                      ? 'userEmailValidationOnly'
                      : newSignInState
                      ? 'createNewUser'
                      : null;
                    reasonRef.current = newReason;
                    setReason(newReason);
                    if (newReason) {
                      localStorage.setItem('reason', newReason);
                    } else {
                      localStorage.removeItem('reason');
                    }
                    console.log('New isSignIn:', newSignInState, 'New reason:', newReason);
                    setError('');
                    setHasAgreedToTerms(false);
                    return newSignInState;
                  });
                }}
              >
                {isSignIn ? 'Already have an account? Login' : 'Create an account'}
              </p>
            )}
            {!isForgotPassword && (
              <p
                className="forgot-password-link"
                onClick={() => {
                  if (isLoading) return; // Prevent action during loading
                  console.log('Switching to Forgot Password mode');
                  setIsForgotPassword(true);
                  setError('');
                }}
              >
                Forgot your password?
              </p>
            )}
            {isForgotPassword && (
              <p
                className="forgot-password-link"
                onClick={() => {
                  if (isLoading) return; // Prevent action during loading
                  console.log('Switching back to Login mode');
                  setIsForgotPassword(false);
                  setError('');
                }}
              >
                Back to Login
              </p>
            )}
          </form>

          {(reason === 'createNewUser' || reason === 'userEmailValidationOnly') && !isForgotPassword && (
            <div className="terms-section">
              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  id="terms"
                  checked={hasAgreedToTerms}
                  onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                  disabled={isLoading} // Disable checkbox during loading
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
          )}

          <Modal isOpen={isModalOpen} onClose={() => !isLoading && setIsModalOpen(false)}>
            <p className="modal-content">{modalMessage}</p>
            <button onClick={() => !isLoading && setIsModalOpen(false)} className="button2">
              Close
            </button>
          </Modal>

          <Modal isOpen={isTermsModalOpen} onClose={() => !isLoading && setIsTermsModalOpen(false)}>
            <div
              className="modal-content"
              dangerouslySetInnerHTML={{ __html: termsAndConditions }}
            />
            
          </Modal>
        </div>
      </BackgroundGeneric>
    </div>
  );
};

export default Login;



























/*const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSignIn, setIsSignIn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const initialMount = useRef(true);
  const actionCompleted = useRef(false);
  const reasonRef = useRef(null);


  const notifySuccess = (message) => toast.success(message);
  const notifyFail = (message) => toast.error(message);

  
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  

  useEffect(() => {
    const reason = localStorage.getItem('reason');
    if (reason) {
      reasonRef.current = reason; // Solo asigna si reason no es null o undefined
    }
    console.log(reasonRef.current);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && initialMount.current) {
        const userEmail = user.providerData[0]?.email || user.email || '';
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
        localStorage.setItem('userName', user.displayName || 'User');
        localStorage.setItem('userImage', user.photoURL || '');

        const reason = localStorage.getItem('reason');
        
        const redirectPath = localStorage.getItem('redirectPath') || '/memories';

        console.log(reason);
        console.log(reasonRef.current);
        
        try {
          if (reasonRef.current === 'userEmailValidationOnly') {
            console.log('login userEmailValidationOnly')
            actionCompleted.current = true;
            localStorage.removeItem('reason');
            localStorage.removeItem('redirectPath');
            router.push(redirectPath);
          } else if (reasonRef.current === 'createNewUser') {
            await handleUserAfterAuth(user.uid, userEmail, 'signIn'); // Función hipotética
            actionCompleted.current = true;
            localStorage.removeItem('reason');
            localStorage.removeItem('redirectPath');
            router.push(redirectPath);
          } else if (reasonRef.current) {
            await handleUserAfterAuth(user.uid, userEmail, 'login'); // Registrar login
            actionCompleted.current = true;
            localStorage.removeItem('reason');
            localStorage.removeItem('redirectPath');
            router.push(redirectPath);
          } else {
            // Caso por defecto: redirigir sin acción adicional
            console.log('pasa login por defecto');
            localStorage.removeItem('redirectPath');
            router.push(redirectPath);
          }
        } catch (error) {
          console.error('Error en el manejo post-autenticación:', error);
          setError('Error al completar el proceso');
        }

        initialMount.current = false;
      } else if (!user) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userImage');
        localStorage.removeItem('userEmail');
      }
    });

    // Función de limpieza
    return () => {
      unsubscribe();
      if (!actionCompleted.current) {
        localStorage.removeItem('reason'); // Solo limpiar si la acción no se completó
      }
    };
  }, [router]);


  const handleUserAfterAuth = async (uid, email, authType) => {
    console.log('calling handleUserAfterAuth...');
    
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, email, authType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${errorData.details || 'Unknown error'}`);
      }

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('userMyLikes', data.myLikes || '');
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
      
      

      if (reasonRef.current !== 'userEmailValidationOnly') {
        console.log('submit login..'+ reasonRef.current);
        await handleUserAfterAuth(user.uid, user.email, isSignIn ? 'signIn' : 'login');
      }

      const redirectPath = localStorage.getItem('redirectPath') || '/memories';
      localStorage.removeItem('redirectPath');
      localStorage.removeItem('reason');
      router.push(redirectPath);
    } catch (error) {
      notifyFail(error)
      console.error('Error:', error);
      setError(getErrorMessage(error));
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
      setError(getErrorMessage(error));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('authToken');
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

  const getErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'Email already in use.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/user-not-found':
        return 'Email not found.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      default:
        return `An unexpected error occurred: ${error.message}`;
    }
  };

  return (
    <div className="fullscreen-floating">
      <BackgroundGeneric isLoading={true}>
        <div className="login-container">
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

export default Login;*/












