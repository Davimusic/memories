import '../../estilos/general/general.css';
import '../../estilos/general/api/payments/payPLan.css';
import '../../app/globals.css';
import React, { useState, useEffect } from 'react';
import BackgroundGeneric from '@/components/complex/backgroundGeneric';
import { useRouter } from 'next/router';
import { PayPalButtons } from "@paypal/react-paypal-js";
import Menu from "@/components/complex/menu";
import MenuIcon from "@/components/complex/menuIcon";
import SpinnerIcon from '@/components/complex/spinnerIcon';
import MemoryLogo from '@/components/complex/memoryLogo';

export default function PaypalSubscriptionPlanner() {
  const router = useRouter();
  const [planDetails, setPlanDetails] = useState(null);
  const [plans, setPlans] = useState({ monthly: null, yearly: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Manejo del menú móvil
  const handleOpenMenu = () => setIsMenuOpen(true);
  const handleCloseMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      localStorage.setItem('redirectPath', '/payment');
      localStorage.setItem('reason', 'createNewUser');
      router.push('/login');
      return;
    }

    const loadLocalStorageData = () => {
      try {
        const storedPlan = localStorage.getItem('selectedPlanDetails');
        if (!storedPlan) {
          router.push('/payment');
          return;
        }
        
        const parsedPlan = JSON.parse(storedPlan);
        setPlanDetails({
          ...parsedPlan,
          paymentType: parsedPlan.paymentFrequency,
          userEmail: userEmail
        });
        
        createPlans(parsedPlan);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    loadLocalStorageData();
  }, []);

  const createPlans = async (planData) => {
    try {
      const response = await fetch('/api/paypal/createPlans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: planData.totalToPay,
          frequency: planData.paymentFrequency
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setPlans({
          monthly: data.monthlyPlanId,
          yearly: data.yearlyPlanId
        });
      } else {
        throw new Error(data.error || "Failed to create plans");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionApproval = async (subscriptionId, planType) => {
    setProcessingPlan(planType);
    setSubscriptionError(null);
    setSubscriptionSuccess(false);
    
    try {
      const response = await fetch('/api/mongoDb/uploadFiles/updatePlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          email: planDetails.userEmail,
          planName: planDetails.planName,
          paymentType: planDetails.paymentType,
          amountPaid: planDetails.totalToPay,
          availableGB: planDetails.storageGB,
          fechaActivacion: new Date().toISOString()
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription');
      }

      setSubscriptionSuccess(true);
      localStorage.removeItem('selectedPlanDetails');
      setTimeout(() => router.push('/createNewMemory'), 5000);
    } catch (err) {
      setSubscriptionError(err.message);
    } finally {
      setProcessingPlan(null);
    }
  };

  const PaypalSubscriptionButton = ({ planId, planType }) => (
    <div className="paypal-button-container">
      <PayPalButtons
        style={{ 
          layout: "vertical",
          shape: "rect",
          color: "blue",
          label: "subscribe",
          height: 40,
          tagline: false
        }}
        createSubscription={(data, actions) => {
          return actions.subscription.create({ plan_id: planId });
        }}
        onApprove={async (data) => {
          try {
            await handleSubscriptionApproval(data.subscriptionID, planType);
          } catch (err) {
            console.error("Approval error:", err);
          }
        }}
        onError={(err) => {
          setError(`PayPal error: ${err.toString()}`);
        }}
      />
      
      {processingPlan === planType && (
        <div className="loading-payment">
          <div className="spinner"></div>
          <p>Processing your subscription...</p>
        </div>
      )}
      
      {subscriptionError && processingPlan === planType && (
        <div className="error-message">
          Error: {subscriptionError}
        </div>
      )}
      
      {subscriptionSuccess && processingPlan === planType && (
        <div className="secure-payment-notice" style={{ color: 'green' }}>
          Subscription activated successfully! Redirecting...
        </div>
      )}
    </div>
  );

  if (loading) return (
    <BackgroundGeneric showImageSlider={false}>
      <Menu
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        className="backgroundColor1"
      />
      <div className="payment-container">
        <div className="loading-payment">
          <div className="loading">
            <SpinnerIcon size={30}/>
            <MemoryLogo size={200}/>
            <p>Loading plan information...</p>
          </div>
        </div>
      </div>
    </BackgroundGeneric>
  );

  if (error) return (
    <BackgroundGeneric showImageSlider={false}>
      <Menu
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        className="backgroundColor1"
      />
      <div className="error-container loading">
        <svg style={{width: '200px'}} xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="error-message">{error}</h3>
        <button 
          style={{padding: '10px', background: 'red', borderRadius: '0.7em', color: 'white', border: 'none'}}
          onClick={() => router.push('/payment')}
          className="retry-button"
        >
          Back to payment
        </button>
      </div>
    </BackgroundGeneric>
  );

  return (
    <BackgroundGeneric showImageSlider={false}>
      <Menu
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        className="backgroundColor1"
      />
  
      <div className="payment-container color2">
        {/* Header dentro del contenedor flotante */}
        <div className="payment-header">
          <MenuIcon 
            onClick={handleOpenMenu} 
            className="mobile-menu-icon" 
          />
          <h1 className="page-title color2">Complete Your Subscription</h1>
        </div>
  
        <div className="payment-content">
          <div className="plan-summary">
            <div className="summary-scroll-container">
              {planDetails && (
                <div className="summary-details">
                  <div className="detail-item">
                    <span>Plan Name</span>
                    <span>{planDetails.planName}</span>
                  </div>
                  <div className="detail-item">
                    <span>Storage</span>
                    <span>{planDetails.storageGB} GB</span>
                  </div>
                  <div className="detail-item">
                    <span>Billing Cycle</span>
                    <span>{planDetails.paymentFrequency === 'monthly' ? 'Monthly' : 'Yearly'}</span>
                  </div>
                  <div className="detail-item total">
                    <span>Total Amount</span>
                    <span>${planDetails.totalToPay} USD</span>
                  </div>
                </div>
              )}
            </div>
          </div>
  
          <div className="payment-methods">
            <h3>Payment Method</h3>
            <div className="methods-scroll-container">
              <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                {/* Contenido de métodos de pago */}
              </div>
  
              {planDetails?.paymentFrequency === 'monthly' ? (
                <PaypalSubscriptionButton 
                  planId={plans.monthly}
                  planType="monthly"
                />
              ) : (
                <PaypalSubscriptionButton 
                  planId={plans.yearly}
                  planType="yearly"
                />
              )}
  
              <p className="secure-payment-notice">
                <span className="lock-icon">🔒</span>
                Your payment is secure and encrypted. By subscribing, you agree to our Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </BackgroundGeneric>
  );
}


















/*/ Función auxiliar para cargar el SDK de PayPal
// Comprueba primero si ya está cargado para evitar recargas
const loadScript = ({ "client-id": clientId, currency, vault, intent }) => {
  return new Promise((resolve, reject) => {
    if (window.paypal) return resolve(window.paypal);
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&vault=${vault}&intent=${intent}`;
    script.onload = () => {
      if (window.paypal) {
        resolve(window.paypal);
      } else {
        reject(new Error("Fallo al cargar el SDK de PayPal"));
      }
    };
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};

const PaypalSubscription = () => {
  return 'hihih'
  // Estados del componente
  const [planDetails, setPlanDetails] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const paypalButtonContainerRef = useRef(null);

  // Cargar y validar los detalles del plan desde localStorage
  useEffect(() => {
    const loadPlanDetails = () => {
      try {
        setLoading(true);
        // Obtener detalles del plan desde localStorage
        const storedDetails = localStorage.getItem('selectedPlanDetails');
        if (!storedDetails) {
          setError('No se encontraron detalles del plan');
          setLoading(false);
          return;
        }
        
        const parsedDetails = JSON.parse(storedDetails);
        console.log("Detalles del plan parseados:", parsedDetails);
        
        // Validar que existan los campos requeridos
        if (!parsedDetails.paymentFrequency || !parsedDetails.totalToPay) {
          setError('Faltan datos requeridos en el plan.');
          setLoading(false);
          return;
        }
        
        // Convertir la frecuencia a minúsculas y validarla
        const frequency = parsedDetails.paymentFrequency.toLowerCase();
        if (!['monthly', 'yearly'].includes(frequency)) {
          setError('Frecuencia de pago inválida. Debe ser "monthly" o "yearly".');
          setLoading(false);
          return;
        }
        
        // Capitalizar la frecuencia para mostrarla (Monthly / Yearly)
        const capitalizedFrequency = frequency.charAt(0).toUpperCase() + frequency.slice(1);
        
        // Guardar los detalles del plan en el estado
        setPlanDetails({
          ...parsedDetails,
          paymentFrequency: capitalizedFrequency
        });
        setLoading(false);
      } catch (err) {
        console.error("Error al parsear los detalles del plan:", err);
        setError('Error al cargar los detalles del plan');
        setLoading(false);
      }
    };
    
    loadPlanDetails();
  }, []);

  // Inicializar PayPal cuando los detalles del plan estén disponibles
  useEffect(() => {
    let paypalButtons;
    let mounted = true;

    const initializePaypal = async () => {
      try {
        // Si no hay detalles o el plan es gratuito, no se inicializa PayPal
        if (!planDetails || planDetails.selectedPlan === 'free') {
          return;
        }

        // Limpiar el contenedor si ya tiene botones renderizados
        if (paypalButtonContainerRef.current && paypalButtonContainerRef.current.innerHTML) {
          paypalButtonContainerRef.current.innerHTML = '';
        }

        // Cargar el SDK de PayPal
        const paypal = await loadScript({
          "client-id": "AcI-rlTdiKxtfGTCMKOZUR7aLIdOcuFBLiewQyzkSOoZW6P4znbsL5jINcvgM50MErwbonG1WpZyAwlU",
          currency: "USD",
          vault: true,
          intent: "subscription"
        });

        if (!mounted) return;

        // Configurar los botones de PayPal para la suscripción
        paypalButtons = paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe'
          },
          // Función para crear la suscripción
          createSubscription: async (data, actions) => {
            try {
              // Seleccionar el plan ID según la frecuencia de pago
              const planId = planDetails.paymentFrequency.toLowerCase() === 'monthly' 
                ? 'P-4EA02376BA233103HNAPA3CI'  // Plan mensual
                : 'P-02P70494YK8620050NAPA5QA'; // Plan anual

              console.log("Creando suscripción con el plan:", planId);
              
              return actions.subscription.create({
                'plan_id': planId,
                'custom_id': `user_subscription_${Date.now()}`
              });
            } catch (err) {
              console.error("Error al crear la suscripción:", err);
              setError('Error al crear la suscripción');
              throw err;
            }
          },
          // Callback cuando la suscripción es aprobada
          onApprove: async (data, actions) => {
            try {
              console.log("Suscripción aprobada. ID:", data.subscriptionID);
              
              // Aquí debes implementar la lógica para:
              // 1. Enviar el subscriptionID a tu backend.
              // 2. Validar la suscripción mediante la API de PayPal.
              // 3. Actualizar el estado del usuario en tu base de datos.
              // Ejemplo:
              
              
              // Opcional: Redirigir a una página de éxito
              // window.location.href = '/subscription-success';
            } catch (err) {
              console.error("Error en la aprobación:", err);
              setError('Error al procesar la suscripción. Contacta al soporte.');
            }
          },
          // Manejo de errores
          onError: (err) => {
            console.error("Error de PayPal:", err);
            setError(`Error en el pago: ${err.message || 'Error desconocido'}`);
          },
          // Cuando el usuario cancela el proceso
          onCancel: (data) => {
            console.log("Suscripción cancelada:", data);
            setError('El proceso de suscripción fue cancelado');
          }
        });

        // Renderizar los botones en el contenedor referenciado
        if (paypalButtonContainerRef.current && paypalButtons) {
          paypalButtons.render(paypalButtonContainerRef.current);
          setPaypalLoaded(true);
        }
      } catch (err) {
        console.error("Error inicializando PayPal:", err);
        setError('Error al cargar el sistema de pago. Por favor, refresca la página.');
      }
    };

    if (planDetails && planDetails.selectedPlan !== 'free') {
      initializePaypal();
    }

    // Limpieza al desmontar el componente
    return () => {
      mounted = false;
      if (paypalButtons) {
        try {
          paypalButtons.close();
        } catch (e) {
          console.warn("Error al cerrar los botones de PayPal:", e);
        }
      }
    };
  }, [planDetails]);

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando detalles del plan...</p>
      </div>
    );
  }

  // Mostrar errores
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <div className="button-group">
          <button className="retry-button" onClick={() => window.location.reload()}>
            Intentar de nuevo
          </button>
          <button className="back-button" onClick={() => window.history.back()}>
            Regresar
          </button>
        </div>
      </div>
    );
  }

  // Caso para plan gratuito
  if (planDetails?.selectedPlan === 'free') {
    return (
      <div className="free-plan-container">
        <div className="success-icon">✓</div>
        <h3>Plan Gratuito Activado</h3>
        <p>No se requiere pago. Disfruta de tu plan.</p>
        <button className="continue-button" onClick={() => (window.location.href = '/dashboard')}>
          Continuar al Dashboard
        </button>
      </div>
    );
  }

  // Renderizado principal para planes de pago
  return (
    <div className="payment-container color2">
      <div className="payment-content">
        <h1 className="payment-title">Completar Suscripción</h1>
        
        {planDetails && (
          <div className="plan-summary">
            <h2>Resumen de tu Plan</h2>
            <div className="summary-details">
              <div className="detail-row">
                <span className="detail-label">Plan Seleccionado:</span>
                <span className="detail-value">{planDetails.planName || 'Plan Pro'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ciclo de Facturación:</span>
                <span className="detail-value">
                  {planDetails.paymentFrequency} ({planDetails.paymentFrequency.toLowerCase() === 'monthly' ? 'por mes' : 'por año'})
                </span>
              </div>
              <div className="detail-row total">
                <span className="detail-label">Precio:</span>
                <span className="detail-value">
                  ${planDetails.totalToPay} USD
                </span>
              </div>
            </div>
          </div>
        )}
        
        
        <div ref={paypalButtonContainerRef} id="paypal-button-container"></div>
      </div>
    </div>
  );
};

export default PaypalSubscription;*/




























/*const PaypalSubscription = () => {
  const [planDetails, setPlanDetails] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [error, setError] = useState('');
  const paypalButtonContainerRef = useRef(null);

  // Cargar detalles del plan, similar a tu implementación actual
  useEffect(() => {
    const loadPlanDetails = () => {
      try {
        const storedDetails = localStorage.getItem('selectedPlanDetails');
        if (!storedDetails) {
          setError('No se encontraron detalles del plan');
          return;
        }
        const parsedDetails = JSON.parse(storedDetails);
        if (!parsedDetails.subscriptionPlanId) {
          setError('ID de plan de suscripción inválido');
          return;
        }
        setPlanDetails(parsedDetails);
      } catch (err) {
        setError('Error al cargar los detalles del plan');
      }
    };
    loadPlanDetails();
  }, []);

  // Inicializar PayPal con suscripción
  useEffect(() => {
    let paypalButtons;

    const initializePaypal = async () => {
      try {
        if (!planDetails || planDetails.selectedPlan === 'free') return;

        if (paypalButtonContainerRef.current) {
          paypalButtonContainerRef.current.innerHTML = '';
        }

        const paypal = await loadScript({
          "client-id": "AfRslansxPG4byyTIVuoNn1Arfu4Z3DRvvBLD3DSaFP18hNrXFHkr8S7Uu2GgWdjwmCmkpioHVZhKeXd",
          currency: "USD"
        });

        paypalButtons = paypal.Buttons({
          // Usamos createSubscription en lugar de createOrder
          createSubscription: (data, actions) => {
            return actions.subscription.create({
              
              'plan_id': planDetails.subscriptionPlanId
            });
          },
          onApprove: (data, actions) => {
            // data.subscriptionID contiene el ID de la suscripción aprobada.
            console.log("Suscripción exitosa:", data);
            // Aquí puedes hacer una llamada a tu backend para actualizar el estado de la suscripción del usuario.
          },
          onError: (err) => {
            console.error("Error en la suscripción:", err);
            setError('Error al procesar la suscripción');
          },
          onCancel: (data) => {
            console.log("Suscripción cancelada:", data);
            setError('Suscripción cancelada por el usuario');
          }
        });

        if (paypalButtonContainerRef.current) {
          paypalButtons.render(paypalButtonContainerRef.current);
          setPaypalLoaded(true);
        }
      } catch (err) {
        console.error("Error cargando la suscripción de PayPal:", err);
        setError('Error al cargar el sistema de suscripción');
      }
    };

    initializePaypal();

    return () => {
      if (paypalButtons) {
        paypalButtons.close();
      }
    };
  }, [planDetails]);

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button className="retry-button" onClick={() => window.location.reload()}>
          Intentar nuevamente
        </button>
      </div>
    );
  }

  if (planDetails?.selectedPlan === 'free') {
    return (
      <div className="free-plan-container">
        <h3>Plan Gratuito Activado</h3>
        <p>No se requiere pago</p>
        <button className="continue-button" onClick={() => {  }}>
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="payment-container color2">
      <div className="payment-content">
        {planDetails && (
          <div className="plan-summary">
            <h2>Resumen de la Suscripción</h2>
            <div className="summary-details">
              <div className="detail-item">
                <span>Plan:</span>
                <span>{planDetails.planName}</span>
              </div>
              <div className="detail-item">
                <span>Frecuencia:</span>
                <span>{planDetails.paymentFrequency}</span>
              </div>
              <div className="detail-item total">
                <span>Total:</span>
                <span>${planDetails.totalToPay}</span>
              </div>
            </div>
          </div>
        )}
        <div className="payment-methods">
          {!paypalLoaded ? (
            <div className="loading-payment">
              <div className="spinner"></div>
              <p>Cargando pasarela de suscripción...</p>
            </div>
          ) : (
            <p className="secure-payment-notice">
              <span className="lock-icon">🔒</span> Suscripción 100% segura
            </p>
          )}
          <div ref={paypalButtonContainerRef} className="paypal-button-container"></div>
        </div>
      </div>
    </div>
  );
};

export default PaypalSubscription;*/











/*const Paypal = () => {
  const [planDetails, setPlanDetails] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [error, setError] = useState('');
  const paypalButtonContainerRef = useRef(null);

  useEffect(() => {
    const loadPlanDetails = () => {
      try {
        const storedDetails = localStorage.getItem('selectedPlanDetails');
        console.log(storedDetails);
        
        if (!storedDetails) {
          setError('No se encontraron detalles del plan');
          return;
        }
        
        const parsedDetails = JSON.parse(storedDetails);
        
        if (!parsedDetails.totalToPay || isNaN(parsedDetails.totalToPay)) {
          setError('Monto de pago inválido');
          return;
        }
        
        setPlanDetails(parsedDetails);
      } catch (err) {
        setError('Error al cargar los detalles del plan');
      }
    };
    
    loadPlanDetails();
  }, []);

  useEffect(() => {
    let paypalButtons;
    
    const initializePaypal = async () => {
      try {
        if (!planDetails || planDetails.selectedPlan === 'free') return;
        
        if (paypalButtonContainerRef.current) {
          paypalButtonContainerRef.current.innerHTML = '';
        }

        const paypal = await loadScript({ 
          "client-id": "AfRslansxPG4byyTIVuoNn1Arfu4Z3DRvvBLD3DSaFP18hNrXFHkr8S7Uu2GgWdjwmCmkpioHVZhKeXd",
          currency: "USD",
          "enable-funding": "venmo",
          "disable-funding": "credit,card"
        });

        paypalButtons = paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'pill',
            label: 'paypal',
            height: 48
          },
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [{
                description: `Plan: ${planDetails.planName} (${planDetails.paymentFrequency})`,
                amount: {
                  value: planDetails.totalToPay,
                  currency_code: "USD",
                  breakdown: {
                    item_total: {
                      value: planDetails.totalToPay,
                      currency_code: "USD"
                    }
                  }
                },
                items: [{
                  name: `Plan ${planDetails.planName}`,
                  description: planDetails.paymentFrequency,
                  unit_amount: {
                    value: planDetails.totalToPay,
                    currency_code: "USD"
                  },
                  quantity: "1"
                }]
              }]
            });
          },
          onApprove: (data, actions) => {
            return actions.order.capture().then(async (details) => {
              try {
                const userEmail = localStorage.getItem('userEmail');
                
                const response = await fetch('/api/mongoDb/uploadFiles/updatePlan', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: userEmail,
                    planName: planDetails.planName,
                    paymentType: planDetails.paymentFrequency,
                    amountPaid: planDetails.totalToPay,
                    availableGB: planDetails.storageGB
                  })
                });
          
                const result = await response.json();
                
                if (!response.ok) {
                  throw new Error(result.message || 'Error en la actualización');
                }

                console.log(result);
                
          
                alert('¡Plan actualizado correctamente!');
                //window.location.href = '/dashboard';
          
              } catch (err) {
                console.error('Error:', err);
                setError(err.message);
              }
            });
          },
          onError: (err) => {
            console.error("Error en el pago:", err);
            setError('Error al procesar el pago');
          },
          onCancel: (data) => {
            console.log("Pago cancelado:", data);
            setError('Pago cancelado por el usuario');
          }
        });

        if (paypalButtonContainerRef.current) {
          paypalButtons.render(paypalButtonContainerRef.current);
          setPaypalLoaded(true);
        }
      } catch (err) {
        console.error("Error al cargar PayPal:", err);
        setError('Error al cargar el sistema de pago');
      }
    };

    initializePaypal();

    return () => {
      if (paypalButtons) {
        paypalButtons.close();
      }
    };
  }, [planDetails]);

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          {error}
        </div>
        <button 
          className="retry-button" 
          onClick={() => window.location.reload()}
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }

  if (planDetails?.selectedPlan === 'free') {
    return (
      <div className="free-plan-container">
        <h3>Plan Gratuito Activado</h3>
        <p>No se requiere pago</p>
        <button 
          className="continue-button"
          onClick={() => {}}
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="payment-container color2">
      <div className="payment-content">
        {planDetails && (
          <div className="plan-summary">
            <h2>Resumen del Pedido</h2>
            <div className="summary-details">
              <div className="detail-item">
                <span>Plan:</span>
                <span>{planDetails.planName}</span>
              </div>
              <div className="detail-item">
                <span>Frecuencia:</span>
                <span>{planDetails.paymentFrequency}</span>
              </div>
              {planDetails.storageGB > 0 && (
                <div className="detail-item">
                  <span>Almacenamiento:</span>
                  <span>{planDetails.storageGB} GB</span>
                </div>
              )}
              <div className="detail-item total">
                <span>Total:</span>
                <span>${planDetails.totalToPay}</span>
              </div>
            </div>
          </div>
        )}

        <div className="payment-methods">
          {!paypalLoaded ? (
            <div className="loading-payment">
              <div className="spinner"></div>
              <p>Cargando pasarela de pago segura...</p>
            </div>
          ) : (
            <p className="secure-payment-notice">
              <span className="lock-icon">🔒</span> Pago 100% seguro
            </p>
          )}
          <div 
            ref={paypalButtonContainerRef} 
            className="paypal-button-container"
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Paypal;*/
