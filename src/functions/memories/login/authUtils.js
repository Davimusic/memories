import {
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../../../../firebase'
import { toast } from 'react-toastify';


const provider = new GoogleAuthProvider();
provider.addScope('email');
provider.addScope('profile');

export const handleGoogleLogin = async (setError, setIsLoading, hasAgreedToTerms, reason, router) => {
  if ((reason === 'createNewUser' || reason === 'userEmailValidationOnly') && !hasAgreedToTerms) {
    const errorMessage = 'You must agree to the terms and conditions to proceed.';
    setError(errorMessage);
    toast.error(errorMessage);
    return;
  }

  setIsLoading(true);
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const email = user.providerData[0]?.email || user.email;
    return { user, email };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    const errorMessage = getErrorMessage(error);
    setError(errorMessage);
    toast.error(errorMessage);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

export const handleLogout = async (setError, setIsLoading) => {
  //setIsLoading(true);
  try {
    await signOut(auth);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userImage');
    localStorage.removeItem('userEmail');
    toast.success('Logged out successfully');
  } catch (error) {
    console.error('Error logging out:', error);
    //setError('Failed to log out');
    toast.error('Failed to log out');
  } finally {
    //setIsLoading(false);
  }
};

/*export const handleUserAfterAuth = async (uid, email, authType, setError, setModalMessage, setIsModalOpen) => {
  
  
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

    console.log(data);
    


    if (data.success) {
      localStorage.setItem('userMyLikes', data.myLikes || '');
      setModalMessage(data.message);
      setIsModalOpen(true);
    }
  } catch (error) {
    console.error('Error:', error);
    setError(`Error: ${error.message}`);
    toast.error(`Error: ${error.message}`);
    throw error;
  }
};*/


export const handleUserAfterAuth = async (
  uid,
  email,
  authType,
  setError,
  setModalMessage,
  setIsModalOpen,
  router
) => {

  

  try {
    const token = await auth.currentUser.getIdToken();
    console.log('Token obtained:', token);

    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uid, email, authType }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unknown error');
    }

    console.log('Response data:', data);

    if (data.success) {
      localStorage.setItem('userMyLikes', data.myLikes || '');
      setModalMessage(data.message);
      setIsModalOpen(true);
    }
  } catch (error) {
    console.error('Error in handleUserAfterAuth:', error);
    const errorMessage = error.message.includes('User does not exist')
      ? 'No account found for this email. Please sign up.'
      : error.message || 'An unexpected error occurred';
    if (errorMessage === 'No account found for this email. Please sign up.') {
      localStorage.setItem('reason', 'createNewUser');
      handleLogout()
      setTimeout(() => {
        handleLogout()
        router.push('/login/createNewUser');
      }, 3000); 
    } 
    setError(errorMessage);
    setModalMessage(errorMessage); // Show error in modal
    setIsModalOpen(true); // Open modal for errors
    toast.error(errorMessage); // Show error in toast
    throw error; // Rethrow if needed for further handling
  }
};




export const getErrorMessage = (error) => {
  handleLogout()
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