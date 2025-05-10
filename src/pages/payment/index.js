import '../../estilos/general/general.css';
import '../../estilos/general/api/payments/index.css'
import '../../app/globals.css'
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Menu from "@/components/complex/menu";
import MenuIcon from "@/components/complex/menuIcon";

const PaymentPlans = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");
  const [customExtraGB, setCustomExtraGB] = useState(0);

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

  // Obtener detalles del plan (ahora recibe el plan como parámetro)
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

  // Procesamiento del pago (ahora recibe el plan como parámetro)
  const handlePayment = async (plan) => {
    setIsProcessing(true);
    setPaymentError(null);
    setSelectedPlan(plan); // Actualizar estado para la UI
    
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
      <Menu
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        className="backgroundColor1"
      />

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

      <div className="plans-container">
        <div className="plans-grid">
          {/* Free Plan */}
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

          {/* Plan 2 (Starter) */}
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

          {/* Plan 3 (Pro) */}
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

          {/* Custom Plan */}
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

      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .payment-page {
          --background: #ffffff;
          --foreground: #020817;
          --primary: #3b82f6;
          --primary-foreground: #f8fafc;
          --muted: #f1f5f9;
          --muted-foreground: #64748b;
          --destructive: #ef4444;
          --border: #e2e8f0;
          --ring: #93c5fd;
          --radius: 0.5rem;

          background-color: var(--background);
          color: var(--foreground);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .payment-header {
          position: sticky;
          top: 0;
          width: 100%;
          background: var(--background);
          z-index: 10;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .mobile-menu-icon {
          display: block;
          cursor: pointer;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 2rem;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .frequency-toggle {
          display: flex;
          background-color: var(--muted);
          border-radius: 9999px;
          padding: 0.25rem;
        }

        .toggle-option {
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .toggle-option.active {
          background-color: var(--primary);
          color: var(--primary-foreground);
        }

        .discount-badge {
          font-size: 0.75rem;
        }

        .price-display {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .price-amount {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .price-period {
          font-size: 0.875rem;
          color: var(--muted-foreground);
        }

        .plans-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          width: 100%;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .plan-card {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 1.25rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          transition: all 0.2s;
          cursor: pointer;
          height: 100%;
        }

        .plan-card:hover {
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .plan-card.selected {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px var(--ring);
        }

        .plan-card-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .plan-name-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .plan-name {
          font-size: 1.125rem;
          font-weight: 700;
        }

        .popular-badge {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          background-color: var(--primary);
          color: var(--primary-foreground);
          border-radius: 9999px;
        }

        .plan-description {
          color: var(--muted-foreground);
          font-size: 0.875rem;
        }

        .plan-card-price {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .plan-features-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          font-size: 0.875rem;
          flex-grow: 1;
        }

        .plan-features-list li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .plan-features-list li::before {
          content: '✓';
          color: var(--primary);
          font-weight: bold;
        }

        .plan-button {
          padding: 0.75rem 1rem;
          border-radius: var(--radius);
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
          border: 1px solid transparent;
          width: 100%;
        }

        .plan-button.primary {
          background-color: var(--primary);
          color: var(--primary-foreground);
        }

        .plan-button.primary:hover {
          background-color: #2563eb;
        }

        .plan-button.primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .plan-button.outline {
          background-color: transparent;
          border-color: var(--border);
        }

        .plan-button.outline:hover {
          background-color: var(--muted);
        }

        .custom-plan-options {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        .storage-slider-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .storage-amount {
          font-weight: 600;
        }

        .storage-slider {
          width: 100%;
          height: 0.5rem;
          -webkit-appearance: none;
          appearance: none;
          background-color: var(--muted);
          border-radius: 9999px;
          margin-bottom: 0.5rem;
        }

        .storage-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 1.25rem;
          height: 1.25rem;
          background-color: var(--primary);
          border-radius: 50%;
          cursor: pointer;
        }

        .storage-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--muted-foreground);
        }

        .payment-error {
          margin: 1rem auto;
          padding: 1rem;
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--destructive);
          border-radius: var(--radius);
          font-size: 0.875rem;
          max-width: 1200px;
        }

        @media (min-width: 768px) {
          .payment-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 2rem;
          }

          .header-right {
            flex-direction: row;
            align-items: center;
            gap: 2rem;
          }

          .toggle-option {
            padding: 0.5rem 1.5rem;
            font-size: 1rem;
          }

          .page-title {
            font-size: 1.875rem;
          }

          .price-amount {
            font-size: 1.5rem;
          }

          .plans-container {
            padding: 1rem 2rem;
          }
        }

        @media (min-width: 1024px) {
          .plans-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentPlans;








