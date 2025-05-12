import '../../estilos/general/general.css';
import '../../estilos/general/api/payments/index.css';
import '../../app/globals.css';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Menu from "@/components/complex/menu";
import MenuIcon from "@/components/complex/menuIcon";
import Modal from '@/components/complex/modal';

const PaymentPlans = () => {
  // Estados para el menú móvil
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Estados para el procesamiento de pagos
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  
  // Estados para la selección de planes
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");
  const [customExtraGB, setCustomExtraGB] = useState(0);
  
  // Estados para el plan del usuario y errores
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  
  // Estado para controlar la visibilidad del modal
  const [showPlanModal, setShowPlanModal] = useState(false);

  const router = useRouter();

  // Efecto para depuración: muestra en consola cambios en plan y error
  useEffect(() => {
    console.log("Plan actualizado:", plan);
    console.log("Error actualizado:", error);
  }, [plan, error]);

  // Efecto principal: obtiene el plan del usuario al montar el componente
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      console.error("El correo del usuario no está disponible");
      setError("El correo del usuario no está disponible");
      return;
    }
    
    async function fetchPlan() {
      try {
        const response = await fetch('/api/mongoDb/queries/checkUserPlanExistence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail })
        });

        if (!response.ok) {
          throw new Error(`Error en la petición: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success && data.exists) {
          setPlan(data.plan);
          setSelectedPlan(data.plan.planName)
          setShowPlanModal(true); // Mostrar modal cuando existe un plan
        } else {
          setError(data.message || 'Usuario no encontrado o sin plan.');
        }
      } catch (err) {
        setError(err.message);
      }
    }

    fetchPlan();
  }, []);

  // Precios base de los planes
  const planPrices = {
    free: 0,
    plan2: 1.49,
    plan3: 2.49,
  };

  // Cálculo de precios según frecuencia de pago
  const plan2Price = paymentFrequency === "yearly" 
    ? (planPrices.plan2 * 12 * 0.8).toFixed(2)
    : planPrices.plan2.toFixed(2);

  const plan3Price = paymentFrequency === "yearly" 
    ? (planPrices.plan3 * 12 * 0.8).toFixed(2)
    : planPrices.plan3.toFixed(2);

  // Precios para plan personalizado
  const customBasePrice = 6.49;
  const customTotalPrice = paymentFrequency === "yearly"
    ? ((customBasePrice + Number(customExtraGB) * 0.01) * 12 * 0.8).toFixed(2)
    : (customBasePrice + Number(customExtraGB) * 0.01).toFixed(2);
  const totalCustomStorage = 500 + Number(customExtraGB);

  // Manejo del menú móvil
  const handleOpenMenu = () => setIsMenuOpen(true);
  const handleCloseMenu = () => setIsMenuOpen(false);

  // Obtener detalles del plan
  const getPlanDetails = (plan) => {
    const details = {
      selectedPlan: plan,
      paymentFrequency: paymentFrequency,
      totalToPay: 0,
      storageGB: 0,
      planName: ""
    };

    switch(plan) {
      case "plan2":
        details.totalToPay = plan2Price;
        details.storageGB = 50;
        details.planName = "Starter";
        break;
      case "plan3":
        details.totalToPay = plan3Price;
        details.storageGB = 100;
        details.planName = "Pro";
        break;
      case "custom":
        details.totalToPay = customTotalPrice;
        details.storageGB = totalCustomStorage;
        details.planName = "Custom";
        break;
      default:
        details.planName = "Free";
    }

    return details;
  };

  // Procesamiento del pago
  const handlePayment = async (plan) => {
    setIsProcessing(true);
    setPaymentError(null);
    setSelectedPlan(plan);
    
    try {
      const planDetails = getPlanDetails(plan);
      localStorage.setItem('selectedPlanDetails', JSON.stringify(planDetails));
      router.push('/payment/payPlan');
    } catch (error) {
      setPaymentError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-page">
      {/* Componente de menú lateral */}
      <Menu
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        className="backgroundColor1"
      />

      {/* Modal de plan existente */}
      {plan && plan.planName !== 'free' && (
        <Modal 
          isOpen={showPlanModal} 
          onClose={() => setShowPlanModal(false)}
          className="p-2"
        >
          <div className="plan-details-modal">
            <h2>Your Current Plan</h2>
            <div className="detail-item">
              <span className="detail-label">Plan:</span>
              <span className="detail-value">{plan.planName || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Price:</span>
              <span className="detail-value">
                ${plan.amountPaid || '0'}/{plan.paymentType || 'monthly'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Storage:</span>
              <span className="detail-value">{plan.availableGB || '0'}GB</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value status-active">Active</span>
            </div>
            <p className="confirmation-message">
              You currently have an active plan.
            </p>
            <button 
              className="close-button"
              onClick={() => setShowPlanModal(false)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}



      {/* Encabezado de la página */}
      <header className="payment-header">
        <div className="header-left">
          <MenuIcon 
            onClick={handleOpenMenu} 
            className="mobile-menu-icon" 
          />
          <h1 className="page-title">Choose Your Plan</h1>
        </div>
        
        <div className="header-right">
          <div className="frequency-toggle">
            <button
              onClick={() => setPaymentFrequency("monthly")}
              className={`toggle-option ${paymentFrequency === "monthly" ? "active" : ""}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPaymentFrequency("yearly")}
              className={`toggle-option ${paymentFrequency === "yearly" ? "active" : ""}`}
            >
              Yearly <span className="discount-badge">(20% off)</span>
            </button>
          </div>
          
          <div className="price-display">
            <span className="price-amount">
              ${selectedPlan === "free" ? "0" : 
               selectedPlan === "plan2" ? plan2Price :
               selectedPlan === "plan3" ? plan3Price :
               customTotalPrice}
            </span>
            <span className="price-period">
              /{paymentFrequency === "yearly" ? "year" : 
                selectedPlan === "free" ? "forever" : "mo"}
            </span>
          </div>
        </div>
      </header>

      {/* Contenedor principal de los planes */}
      <div className="plans-container">
        <div className="plans-grid">
          {/* Plan Gratis */}
          <div
            className={`plan-card ${selectedPlan === "free" ? "selected" : ""}`}
            onClick={() => setSelectedPlan("free")}
          >
            <div className="plan-card-header">
              <h3 className="plan-name">Free</h3>
              <p className="plan-description">Start exploring basic features</p>
            </div>
            <div className="plan-card-price">$0<span className="price-period">/forever</span></div>
            <ul className="plan-features-list">
              <li>Up to 3GB Storage (monthly limit)</li>
              <li>Basic Memories (monthly limit)</li>
              <li>2 QR Codes per month</li>
            </ul>
            <button 
              onClick={() => router.push('/createNewMemory')}
              className="plan-button outline"
            >
              Get Started
            </button>
          </div>

          {/* Plan Starter */}
          <div
            className={`plan-card ${selectedPlan === "plan2" ? "selected" : ""}`}
            onClick={() => setSelectedPlan("plan2")}
          >
            <div className="plan-card-header">
              <div className="plan-name-wrapper">
                <h3 className="plan-name">Starter</h3>
                <span className="popular-badge">Popular</span>
              </div>
              <p className="plan-description">For small teams</p>
            </div>
            <div className="plan-card-price">
              ${plan2Price}
              <span className="price-period">/{paymentFrequency === "yearly" ? "year" : "mo"}</span>
            </div>
            <ul className="plan-features-list">
              <li>Up to 50GB Storage (monthly limit)</li>
              <li>Advanced Sharing (monthly limit)</li>
              <li>Unlimited QR Codes per month</li>
              <li>Up to 5 Users</li>
            </ul>
            <button
              onClick={() => handlePayment("plan2")}
              className="plan-button primary"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Get Started'}
            </button>
          </div>

          {/* Plan Pro */}
          <div
            className={`plan-card ${selectedPlan === "plan3" ? "selected" : ""}`}
            onClick={() => setSelectedPlan("plan3")}
          >
            <div className="plan-card-header">
              <h3 className="plan-name">Pro</h3>
              <p className="plan-description">For growing teams</p>
            </div>
            <div className="plan-card-price">
              ${plan3Price}
              <span className="price-period">/{paymentFrequency === "yearly" ? "year" : "mo"}</span>
            </div>
            <ul className="plan-features-list">
              <li>Up to 100GB Storage (monthly limit)</li>
              <li>Advanced Sharing (monthly limit)</li>
              <li>Unlimited QR Codes per month</li>
              <li>Up to 5 Users</li>
              <li>Priority Support</li>
            </ul>
            <button
              onClick={() => handlePayment("plan3")}
              className="plan-button primary"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Get Started'}
            </button>
          </div>

          {/* Plan Personalizado */}
          <div
            className={`plan-card ${selectedPlan === "custom" ? "selected" : ""}`}
            onClick={() => setSelectedPlan("custom")}
          >
            <div className="plan-card-header">
              <h3 className="plan-name">Custom</h3>
              <p className="plan-description">Tailored to your needs</p>
            </div>
            <div className="plan-card-price">
              ${customTotalPrice}
              <span className="price-period">/{paymentFrequency === "yearly" ? "year" : "mo"}</span>
            </div>
            <ul className="plan-features-list">
              <li>{totalCustomStorage}GB Storage (monthly limit)</li>
              <li>Advanced Sharing (monthly limit)</li>
              <li>Unlimited QR Codes per month</li>
              <li>Up to 5 Users</li>
              <li>Priority Support</li>
            </ul>
            {selectedPlan === "custom" && (
              <div className="custom-plan-options">
                <div className="storage-slider-header">
                  <span>Additional Storage</span>
                  <span className="storage-amount">{totalCustomStorage}GB</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={customExtraGB}
                  onChange={(e) => setCustomExtraGB(e.target.value)}
                  className="storage-slider"
                />
                <div className="storage-labels">
                  <span>500GB Base</span>
                  <span>+ {customExtraGB}GB Extra</span>
                </div>
              </div>
            )}
            <button
              onClick={() => handlePayment("custom")}
              className="plan-button primary"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Get Custom Plan'}
            </button>
          </div>
        </div>

        {paymentError && (
          <div className="payment-error">
            {paymentError}
          </div>
        )}
      </div>

      {/* Estilos globales */}
      <style jsx global>{`
        

        

        

        /* Estilos específicos para el modal de detalle de plan */
        .plan-details-modal {
          padding: 20px;
          max-width: 400px;
          background: white;
        }

        .plan-details-modal h2 {
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
          color: var(--foreground);
          text-align: center;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin: 15px 0;
          padding: 12px;
          background-color: var(--muted);
          border-radius: var(--radius);
          font-size: 0.95rem;
        }

        .detail-label {
          font-weight: 600;
          color: var(--foreground);
        }

        .detail-value {
          color: var(--muted-foreground);
        }

        .status-active {
          color: #38a169;
          font-weight: 600;
        }

        .close-button {
          margin-top: 20px;
          width: 100%;
          padding: 12px;
          background-color: var(--primary);
          color: var(--primary-foreground);
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          transition: background-color 0.3s;
          font-weight: 500;
        }

        .close-button:hover {
          background-color: #2563eb;
        }

        @media (max-width: 480px) {
          .plan-details-modal {
            padding: 15px;
            width: 90vw;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentPlans;








