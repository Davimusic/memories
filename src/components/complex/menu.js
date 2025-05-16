import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
//import Modal from './Modal'; // Importa el componente Modal existente
//import ColorPickerModalContent from './ColorPickerModalContent'; // Importa el nuevo componente
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase';
'../../estilos/general/general.css';











const Menu = ({ isOpen, onClose, className = '', openUpdateBackgroundColor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userImage, setUserImage] = useState('');
  const [userMyLikes, setUserMyLikes] = useState([]);
  const [planStatus, setPlanStatus] = useState('');
  const router = useRouter();

  // State para almacenar colores actuales
  const [colors, setColors] = useState({
    backgroundColor1: '',
    backgroundColor2: '',
    backgroundColor3: '',
    backgroundColor4: '',
    backgroundColor5: '',
  });

  // Obtener datos de usuario desde localStorage
  useEffect(() => {
    const name = localStorage.getItem('userName') || '';
    const image = localStorage.getItem('userImage') || '';
    const myLikes = localStorage.getItem('userMyLikes') || '';
    setUserName(name);
    setUserImage(image);
    setUserMyLikes(myLikes);
  }, []);

  // Obtener colores desde variables CSS
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

  // Obtener el estado del plan del backend solo una vez por sesión
  useEffect(() => {
    // Verificar si existe el email del usuario almacenado en localStorage
    const storedEmail = localStorage.getItem("userEmail");
    if (!storedEmail) {
      console.log('correo NO existe');
      return;
    } else {
      console.log('correo sí existe');
    }

    // Obtener el contenido almacenado en sessionStorage
    const cachedPlanString = sessionStorage.getItem('userPlanStatus');
    let parsedPlan = null;

    if (cachedPlanString) {
      try {
        // Intentar parsear el contenido; si no es JSON válido, se captura el error
        parsedPlan = JSON.parse(cachedPlanString);
        console.log("Contenido parseado:", parsedPlan);
      } catch (error) {
        console.log("Error al parsear; se usará el contenido sin formatear:", cachedPlanString);
        parsedPlan = cachedPlanString;
      }
    } else {
      console.log("No se encontró ningún valor en 'userPlanStatus'.");
    }

    // Si ya tenemos un plan cacheado, lo usamos:
    if (parsedPlan) {
      setPlanStatus(parsedPlan);
    } else {
      // Si no hay plan cacheado, se consulta el endpoint.
      fetch('/api/mongoDb/queries/getUserPlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: storedEmail }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Error al obtener el estado del plan');
          }
          return response.json();
        })
        .then((data) => {
          // Suponemos que data.plan tiene una forma como:
          // { amountPaid: 0, availableGB: 3, paymentType: "monthly", planName: "free" }
          console.log("Plan obtenido del endpoint:", data.plan);
          setPlanStatus(data.plan);

          // Guardamos el plan en sessionStorage.
          // Si data.plan es un objeto, lo convertimos a JSON; de lo contrario, se guarda directamente.
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
  }, []);

  // Función para actualizar un color (ejemplo en vivo)
  const updateColor = (colorClass, hexValue) => {
    if (/^#([0-9A-Fa-f]{3}){1,2}$/i.test(hexValue)) {
      const updatedColors = { ...colors, [colorClass]: hexValue };
      setColors(updatedColors);
      document.documentElement.style.setProperty(`--${colorClass}`, hexValue);
      return true;
    }
    return false;
  };

  // Función para manejar el logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Ajusta según tu método de signOut
      localStorage.removeItem('userName');
      localStorage.removeItem('userImage');
      localStorage.removeItem('userEmail');
      router.push('/login');
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Prevención de propagación de clics en elementos hijos
  const handleMenuClick = (e) => e.stopPropagation();

  // Función para renderizar el estado del plan de forma legible
  const renderPlanStatus = () => {
  if (!planStatus) return null;

  if (typeof planStatus === 'object') {
    const isFree = planStatus.planName?.toLowerCase() === "free";
    return (
      <>
        <p className="title-xxs">Plan: {planStatus.planName}</p>
        { !isFree && (
          <p className="title-xxs">Payment Type: {planStatus.paymentType}</p>
        )}
        <p className="title-xxs">Available GB: {planStatus.availableGB}</p>
      </>
    );
  } else {
    return <p className="title-sm">Plan: {planStatus}</p>;
  }
};


  return (
    <>
      {/* Menú lateral */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : '-300px',
          width: '300px',
          height: '100vh',
          zIndex: 9990,
          transition: 'left 0.3s ease, visibility 0.3s ease, opacity 0.3s ease',
          padding: '20px',
          boxShadow: '2px 0 5px rgba(0, 0, 0, 0.5)',
          visibility: isOpen ? 'visible' : 'hidden',
          opacity: isOpen ? 1 : 0,
        }}
        className={`${className} color5 backgroundColor1`}
        onClick={onClose}
      >
        <div onClick={handleMenuClick}>
          <p className="title-md" style={{ margin: 0 }}>{userMyLikes}</p>
          <p className="title-xl" style={{ marginBottom: '20px' }}>Menu</p>

          {/* Muestra la información del usuario */}
          {userName && (
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
              {userImage && (
                <img
                  src={userImage}
                  alt="User"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    marginRight: '10px',
                  }}
                />
              )}
              <p className="title-sm" style={{ margin: 0 }}>{userName}</p>
            </div>
          )}

          {/* Items de navegación */}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {['Memories', 'update Plane'].map((item, index) => (//'Favorites', 'Settings'
              <li className='effectHover' key={index} style={{ marginBottom: '15px', width: '100%', borderRadius: '0.7em', paddingLeft: '10px' }}>
                <a
                  href={
                    item === 'Memories'
                      ? '/memories'
                      : item === 'update Plane'
                      ? '/payment'
                      : '/#'
                  }
                  style={{ textDecoration: 'none' }}
                  className="title-md color5"
                >
                  {item}
                </a>
              </li>
            ))}
            <li style={{ marginBottom: '15px' }}>
              <p onClick={handleLogout} className="title-md effectHover" style={{ cursor: 'pointer', borderRadius: '10px', width: '100%', paddingLeft: '10px' }}>
                Log out
              </p>
            </li>
          </ul>
          {/* Muestra el estado del plan obtenido solo una vez por sesión */}
          {planStatus && (
            <div style={{ marginBottom: '20px' }}>
              {renderPlanStatus()}
            </div>
          )}
        </div>
      </div>

      {/* Overlay para cerrar el menú */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Menu;



