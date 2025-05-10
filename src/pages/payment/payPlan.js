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
      router.push('/createNewMemory')
      //setTimeout(() => router.push('/createNewMemory'), 5000);
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


















