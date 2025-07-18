'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import '../../app/globals.css';
import '../../estilos/general/menu.css';

const Menu = ({ isOpen, onClose, openUpdateBackgroundColor, isDarkMode }) => {
  // Refs for DOM access and click-outside detection
  const menuRef = useRef(null);
  const overlayRef = useRef(null);

  // State for user data and UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userImage, setUserImage] = useState('');
  const [userMyLikes, setUserMyLikes] = useState([]);
  const [planStatus, setPlanStatus] = useState('');
  const [userEmail, setUserEmail] = useState(null);
  const [colors, setColors] = useState({
    backgroundColor1: '',
    backgroundColor2: '',
    backgroundColor3: '',
    backgroundColor4: '',
    backgroundColor5: '',
  });

  const router = useRouter();

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        overlayRef.current?.contains(event.target)
      ) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Control body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Auth state listener for user email
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Get user data from localStorage
  useEffect(() => {
    const name = localStorage.getItem('userName') || '';
    const image = localStorage.getItem('userImage') || '';
    const myLikes = localStorage.getItem('userMyLikes') || '';
    setUserName(name);
    setUserImage(image);
    setUserMyLikes(myLikes);
  }, []);

  // Get CSS variables for color theming
  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const newColors = {
      backgroundColor1: rootStyles.getPropertyValue('--backgroundColor1').trim(),
      backgroundColor2: rootStyles.getPropertyValue('--backgroundColor2').trim(),
      backgroundColor3: rootStyles.getPropertyValue('--backgroundColor3').trim(),
      backgroundColor4: rootStyles.getPropertyValue('--backgroundColor4').trim(),
      backgroundColor5: rootStyles.getPropertyValue('--backgroundColor5').trim(),
    };
    setColors(newColors);
  }, []);

  // Fetch user plan status
  useEffect(() => {
    if (userEmail === null) return;

    const cachedPlanString = sessionStorage.getItem('userPlanStatus');
    let parsedPlan = null;

    if (cachedPlanString) {
      try {
        parsedPlan = JSON.parse(cachedPlanString);
      } catch (error) {
        parsedPlan = cachedPlanString;
      }
    }

    if (parsedPlan) {
      setPlanStatus(parsedPlan);
    } else {
      fetch('/api/mongoDb/queries/getUserPlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      })
        .then((response) => {
          if (!response.ok) throw new Error('Error al obtener el estado del plan');
          return response.json();
        })
        .then((data) => {
          setPlanStatus(data.plan);
          const planToStore = typeof data.plan === 'object'
            ? JSON.stringify(data.plan)
            : data.plan;
          sessionStorage.setItem('userPlanStatus', planToStore);
        })
        .catch((error) => {
          console.error('Error fetching plan status:', error);
        });
    }
  }, [userEmail]);

  // Helper function to update CSS colors
  const updateColor = (colorClass, hexValue) => {
    if (/^#([0-9A-Fa-f]{3}){1,2}$/i.test(hexValue)) {
      const updatedColors = { ...colors, [colorClass]: hexValue };
      setColors(updatedColors);
      document.documentElement.style.setProperty(`--${colorClass}`, hexValue);
      return true;
    }
    return false;
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userName');
      localStorage.removeItem('userImage');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('reason');
      router.push('/');
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Handle menu click to prevent propagation
  const handleMenuClick = (e) => e.stopPropagation();

  return (
    <>
      {/* Overlay that appears when menu is open */}
      {isOpen && (
        <div
          ref={overlayRef}
          className={`menu-overlay ${isDarkMode ? 'dark-mode' : ''}`}
          onClick={onClose}
        />
      )}

      {/* Main menu container */}
      <div
        ref={menuRef}
        className={`menu ${isOpen ? 'menu-open' : 'menu-closed'} ${isDarkMode ? 'dark-mode' : ''}`}
      >
        <div className="menu-content" onClick={handleMenuClick}>
          {/* User likes section */}
          <p className="title-md menu-link">{userMyLikes}</p>

          {/* Menu title */}
          <p className="title-xl menu-link">Menu</p>

          {/* User info section */}
          {userName && userEmail && (
            <div className="user-info centrar-horizontal">
              {userImage && (
                <img
                  src={userImage}
                  alt="User"
                  className="user-image"
                />
              )}
              <p className="title-sm menu-link">{userName}</p>
            </div>
          )}

          {/* Menu items list */}
          <ul className="menu-list">
            <li className="menu-item effectHover borderRadius1">
              <a
                href="/articles"
                className="menu-link title-md"
              >
                Articles
              </a>
            </li>
            {userEmail && ['Memories', 'new memory plan'].map((item, index) => (
              <li key={index} className="menu-item effectHover borderRadius1">
                <a
                  href={
                    item === 'Memories'
                      ? '/memories'
                      : item === 'new memory plan'
                      ? '/payment'
                      : '/#'
                  }
                  className="menu-link title-md"
                >
                  {item}
                </a>
              </li>
            ))}
            {userEmail ? (
              <li className="menu-item">
                <p
                  onClick={handleLogout}
                  className="title-md color1 effectHover borderRadius1 logout-link"
                >
                  Log out
                </p>
              </li>
            ) : (
              <>
                <li className="menu-item effectHover borderRadius1">
                  <a
                    href="/login/createNewUser"
                    className="menu-link title-md"
                  >
                    Sign Up
                  </a>
                </li>
                <li className="menu-item effectHover borderRadius1">
                  <a
                    href="/login"
                    className="menu-link title-md"
                  >
                    Sign In
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Menu;
























/*'use client'; 

import React, { useState, useEffect, useRef  } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import '../../app/globals.css'
import '../../estilos/general/menu.css'



const Menu = ({ isOpen, onClose, openUpdateBackgroundColor, isDarkMode }) => {
  // Refs for DOM access and click-outside detection
  const menuRef = useRef(null);
  const overlayRef = useRef(null);

  // State for user data and UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userImage, setUserImage] = useState('');
  const [userMyLikes, setUserMyLikes] = useState([]);
  const [planStatus, setPlanStatus] = useState('');
  const [userEmail, setUserEmail] = useState(null);
  const [colors, setColors] = useState({
    backgroundColor1: '',
    backgroundColor2: '',
    backgroundColor3: '',
    backgroundColor4: '',
    backgroundColor5: '',
  });

  const router = useRouter();

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) && 
        overlayRef.current?.contains(event.target)
      ) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Control body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Auth state listener for user email
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      }
    });
    return () => unsubscribe();
  }, []);

  // Get user data from localStorage
  useEffect(() => {
    const name = localStorage.getItem('userName') || '';
    const image = localStorage.getItem('userImage') || '';
    const myLikes = localStorage.getItem('userMyLikes') || '';
    setUserName(name);
    setUserImage(image);
    setUserMyLikes(myLikes);
  }, []);

  // Get CSS variables for color theming
  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const newColors = {
      backgroundColor1: rootStyles.getPropertyValue('--backgroundColor1').trim(),
      backgroundColor2: rootStyles.getPropertyValue('--backgroundColor2').trim(),
      backgroundColor3: rootStyles.getPropertyValue('--backgroundColor3').trim(),
      backgroundColor4: rootStyles.getPropertyValue('--backgroundColor4').trim(),
      backgroundColor5: rootStyles.getPropertyValue('--backgroundColor5').trim(),
    };
    setColors(newColors);
  }, []);

  // Fetch user plan status
  useEffect(() => {
    if (userEmail === null) return;

    const cachedPlanString = sessionStorage.getItem('userPlanStatus');
    let parsedPlan = null;

    if (cachedPlanString) {
      try {
        parsedPlan = JSON.parse(cachedPlanString);
      } catch (error) {
        parsedPlan = cachedPlanString;
      }
    }

    if (parsedPlan) {
      setPlanStatus(parsedPlan);
    } else {
      fetch('/api/mongoDb/queries/getUserPlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      })
        .then((response) => {
          if (!response.ok) throw new Error('Error al obtener el estado del plan');
          return response.json();
        })
        .then((data) => {
          setPlanStatus(data.plan);
          const planToStore = typeof data.plan === "object" 
            ? JSON.stringify(data.plan) 
            : data.plan;
          sessionStorage.setItem('userPlanStatus', planToStore);
        })
        .catch((error) => {
          console.error('Error fetching plan status:', error);
        });
    }
  }, [userEmail]);

  // Helper function to update CSS colors
  const updateColor = (colorClass, hexValue) => {
    if (/^#([0-9A-Fa-f]{3}){1,2}$/i.test(hexValue)) {
      const updatedColors = { ...colors, [colorClass]: hexValue };
      setColors(updatedColors);
      document.documentElement.style.setProperty(`--${colorClass}`, hexValue);
      return true;
    }
    return false;
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userName');
      localStorage.removeItem('userImage');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('reason');
      router.push('/');
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Prevent click propagation in menu content
  const handleMenuClick = (e) => e.stopPropagation();

  

  return (
    <>
      
      {isOpen && (
        <div 
          ref={overlayRef}
          className={`menu-overlay ${isDarkMode ? 'dark-mode' : ''}`}
          onClick={onClose}
        />
      )}

      
      <div
        ref={menuRef}
        className={`menu ${isOpen ? 'menu-open' : 'menu-closed'} ${isDarkMode ? 'dark-mode' : ''}`}
      >
        <div className="menu-content" onClick={handleMenuClick}>
          
          <p className="title-md menu-link">{userMyLikes}</p>
          
          
          <p className="title-xl menu-link">Menu</p>

          
          {userName && (
            <div className="user-info centrar-horizontal">
              {userImage && (
                <img
                  src={userImage}
                  alt="User"
                  className="user-image"
                />
              )}
              <p className="title-sm menu-link">{userName}</p>
            </div>
          )}

          
          <ul className="menu-list">
            {['Memories', 'new memory plan'].map((item, index) => (
              <li key={index} className="menu-item effectHover borderRadius1">
                <a
                  href={
                    item === 'Memories'
                      ? '/memories'
                      : item === 'new memory plan'
                      ? '/payment'
                      : '/#'
                  }
                  className="menu-link title-md"
                >
                  {item}
                </a>
              </li>
            ))}
            <li className="menu-item">
              <p
                onClick={handleLogout}
                className="title-md color1 effectHover borderRadius1 logout-link"
              >
                Log out
              </p>
            </li>
          </ul>

          
        </div>
      </div>
    </>
  );
};

export default Menu;*/






