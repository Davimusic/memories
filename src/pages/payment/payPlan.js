
import '../../estilos/general/general.css';
import '../../estilos/general/api/payments/payPLan.css'
import '../../app/globals.css'
import React, { useState, useEffect, useRef } from 'react';
import { loadScript } from "@paypal/paypal-js";




const PaypalSubscription = () => {
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
              /* 
               * En este objeto configuras el plan, seleccionando el ID del plan (predefinido en el Dashboard de PayPal)
               * Este ID determinará si es mensual, anual, etc.
               */
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
        <button className="continue-button" onClick={() => { /* Acción para continuar */ }}>
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

export default PaypalSubscription;











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
