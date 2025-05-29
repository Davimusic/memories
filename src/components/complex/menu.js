'use client'; 

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
import '../../app/globals.css'
import '../../estilos/general/menu.css'



const Menu = ({ isOpen, onClose,  openUpdateBackgroundColor, isDarkMode  }) => {
  //if (!isOpen) return null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userImage, setUserImage] = useState('');
  const [userMyLikes, setUserMyLikes] = useState([]);
  const [planStatus, setPlanStatus] = useState('');
  const [userEmail, setUserEmail] = useState(null);
  const router = useRouter();
  

  const [colors, setColors] = useState({
    backgroundColor1: '',
    backgroundColor2: '',
    backgroundColor3: '',
    backgroundColor4: '',
    backgroundColor5: '',
  });

  

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const name = localStorage.getItem('userName') || '';
    const image = localStorage.getItem('userImage') || '';
    const myLikes = localStorage.getItem('userMyLikes') || '';
    setUserName(name);
    setUserImage(image);
    setUserMyLikes(myLikes);
  }, []);

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

  useEffect(() => {
    if (userEmail === null) return;

    const cachedPlanString = sessionStorage.getItem('userPlanStatus');
    let parsedPlan = null;

    if (cachedPlanString) {
      try {
        parsedPlan = JSON.parse(cachedPlanString);
        console.log("Contenido parseado:", parsedPlan);
      } catch (error) {
        console.log("Error al parsear; se usará el contenido sin formatear:", cachedPlanString);
        parsedPlan = cachedPlanString;
      }
    } else {
      console.log("No se encontró ningún valor en 'userPlanStatus'.");
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
          if (!response.ok) {
            throw new Error('Error al obtener el estado del plan');
          }
          return response.json();
        })
        .then((data) => {
          console.log("Plan obtenido del endpoint:", data.plan);
          setPlanStatus(data.plan);
          const planToStore =
            typeof data.plan === "object"
              ? JSON.stringify(data.plan)
              : data.plan;
          sessionStorage.setItem('userPlanStatus', planToStore);
        })
        .catch((error) => {
          console.error('Error fetching plan status:', error);
        });
    }
  }, [userEmail]);

  const updateColor = (colorClass, hexValue) => {
    if (/^#([0-9A-Fa-f]{3}){1,2}$/i.test(hexValue)) {
      const updatedColors = { ...colors, [colorClass]: hexValue };
      setColors(updatedColors);
      document.documentElement.style.setProperty(`--${colorClass}`, hexValue);
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userName');
      localStorage.removeItem('userImage');
      localStorage.removeItem('userEmail');
      router.push('/login');
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleMenuClick = (e) => e.stopPropagation();

  const renderPlanStatus = () => {
    if (!planStatus) return null;

    if (typeof planStatus === 'object') {
      const isFree = planStatus.planName?.toLowerCase() === "free";
      return (
        <>
          <p className="title-xxs menu-link">Plan: {planStatus.planName}</p>
          {!isFree && (
            <p className="title-xxs menu-link">Payment Type: {planStatus.paymentType}</p>
          )}
          <p className="title-xxs menu-link">Available GB: {planStatus.availableGB}</p>
        </>
      );
    } else {
      return <p className="title-sm menu-link">Plan: {planStatus}</p>;
    }
  };

  return (
    <>
      <div
        className={`menu fullscreen-floating card ${isOpen ? 'menu-open' : 'menu-closed'}  ${isDarkMode ? 'dark-mode' : ''}`}
        onClick={onClose}
      >
        <div className="menu-content" onClick={handleMenuClick}>
          <p className="title-md menu-link">{userMyLikes}</p>
          <p className="title-xl menu-link {">Menu</p>

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
            {['Memories', 'update Plane'].map((item, index) => (
              <li key={index} className="menu-item effectHover borderRadius1">
                <a
                  href={
                    item === 'Memories'
                      ? '/memories'
                      : item === 'update Plane'
                      ? '/payment'
                      : '/#'
                  }
                  className="menu-link title-md "
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

          {planStatus && (
            <div className="plan-status">
              {renderPlanStatus()}
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="menu-overlay fullscreen-floating" onClick={onClose} />
      )}
    </>
  );
};

export default Menu;


/*import React, { useState, useEffect } from 'react';
const Menu = ({ isOpen, onClose, ariaLabel, isDarkMode }) => {
  if (!isOpen) return null;

  return (
    <div
      className={`menu ${isDarkMode ? 'dark' : ''}`}
      aria-label={ariaLabel}
    >
      <button onClick={onClose}>Cerrar</button>
      <ul>
        <li>Opción 1</li>
        <li>Opción 2</li>
      </ul>
    </div>
  );
};

export default Menu*/



