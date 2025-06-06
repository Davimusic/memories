
'use client';

//import '../../estilos/general/general.css';
import '../../estilos/general/api/payments/payPlan.css';
import '../../app/globals.css';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { PayPalButtons } from '@paypal/react-paypal-js';
import Modal from '@/components/complex/modal';
import GeneralMold from '@/components/complex/generalMold';
import LoadingMemories from '@/components/complex/loading';
import { auth } from '../../../firebase';
import { toast } from 'react-toastify';

const PaypalSubscriptionPlanner = () => {
  const notifySuccess = (message) => toast.success(message);
  const notifyFailes = (message) => toast.error(message);

  const router = useRouter();
  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [plans, setPlans] = useState({ monthly: null, yearly: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
        } catch (error) {
          console.error('Error getting token:', error);
          setError('Failed to authenticate user');
          setShowErrorModal(true);
        }
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      } else {
        const path = window.location.pathname;
        notifyFailes('Please log in before continuing...');
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!userEmail) return;

    const loadLocalStorageData = () => {
      try {
        const storedPlan = localStorage.getItem('selectedPlanDetails');
        if (!storedPlan) {
          setError('No plan selected. Please choose a plan.');
          setShowErrorModal(true);
          setLoading(false);
          return;
        }

        const parsedPlan = JSON.parse(storedPlan);
        setPlanDetails({
          ...parsedPlan,
          paymentType: parsedPlan.paymentFrequency,
          userEmail: userEmail,
        });

        createPlans(parsedPlan);
      } catch (error) {
        setError(error.message);
        setShowErrorModal(true);
        setLoading(false);
      }
    };

    loadLocalStorageData();
  }, [userEmail]);

  const createPlans = async (planData) => {
    try {
      const response = await fetch('/api/paypal/createPlans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: planData.totalToPay,
          frequency: planData.paymentFrequency,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setPlans({
          monthly: data.monthlyPlanId,
          yearly: data.yearlyPlanId,
        });
      } else {
        throw new Error(data.error || 'Failed to create plans');
      }
    } catch (err) {
      setError(err.message);
      setShowErrorModal(true);
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
          fechaActivacion: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription');
      }

      const planToStore = {
        amountPaid: planDetails.totalToPay,
        availableGB: planDetails.storageGB,
        paymentType: planDetails.paymentType,
        planName: planDetails.planName,
      };
      sessionStorage.setItem('userPlanStatus', JSON.stringify(planToStore));

      setSubscriptionSuccess(true);
      notifySuccess('Subscription activated successfully!');
      localStorage.removeItem('selectedPlanDetails');
      setTimeout(() => router.push('/createNewMemory'), 2000);
    } catch (err) {
      setSubscriptionError(err.message);
    } finally {
      setProcessingPlan(null);
    }
  };

  const PaypalSubscriptionButton = ({ planId, planType }) => (
    <div className="paypal-button-container p-3">
      <PayPalButtons
        style={{
          layout: 'vertical',
          shape: 'rect',
          color: 'blue',
          label: 'subscribe',
          height: 40,
          tagline: false,
        }}
        createSubscription={(data, actions) => actions.subscription.create({ plan_id: planId })}
        onApprove={async (data) => {
          try {
            await handleSubscriptionApproval(data.subscriptionID, planType);
          } catch (err) {
            console.error('Approval error:', err);
            setSubscriptionError(`PayPal error: ${err.toString()}`);
          }
        }}
        onError={(err) => {
          setSubscriptionError(`PayPal error: ${err.toString()}`);
        }}
        aria-label={`Subscribe to ${planType} plan`}
      />
      {processingPlan === planType && (
        <div className="loading-payment flex-column centrar-completo m-2">
          <div className="spinner skeleton p-2" />
          <p className="content-small">Processing your subscription...</p>
        </div>
      )}
      {subscriptionError && processingPlan === planType && (
        <div className="error-card m-2 p-2 content-small">
          Error: {subscriptionError}
        </div>
      )}
      {subscriptionSuccess && processingPlan === planType && (
        <div className="secure-payment-notice m-2 p-2 content-small" style={{ color: '#38a169' }}>
          Subscription activated successfully! Redirecting...
        </div>
      )}
    </div>
  );

  // Left content: Payment methods
  const leftContent = (
    <div className="card-content flex-column p-3">
      <h3 className="title-sm m-2">Payment Method</h3>
      <div className="payment-methods card p-3">
        <div className="methods-scroll-container">
          <div className="flex-column m-2 p-2 rounded">
            {/* Placeholder for additional payment methods */}
            <p className="content-small">PayPal is the selected payment method.</p>
          </div>
          {planDetails?.paymentFrequency === 'monthly' ? (
            <PaypalSubscriptionButton planId={plans.monthly} planType="monthly" />
          ) : (
            <PaypalSubscriptionButton planId={plans.yearly} planType="yearly" />
          )}
          <p className="secure-payment-notice content-small m-2">
            <span className="lock-icon" role="img" aria-label="Secure payment">🔒</span>
            Your payment is secure and encrypted. By subscribing, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );

  // Right content: Plan summary
  const rightContent = (
    <div className="card-content flex-column p-3">
      <h3 className="title-sm m-2">Plan Summary</h3>
      <div className="plan-summary card p-3">
        <div className="summary-scroll-container">
          {planDetails && (
            <div className="summary-details flex-column">
              <div className="detail-item p-2">
                <span className="content-small">Plan Name</span>
                <span className="content-small">{planDetails.planName}</span>
              </div>
              <div className="detail-item p-2">
                <span className="content-small">Storage</span>
                <span className="content-small">{planDetails.storageGB} GB</span>
              </div>
              <div className="detail-item p-2">
                <span className="content-small">Billing Cycle</span>
                <span className="content-small">{planDetails.paymentFrequency === 'monthly' ? 'Monthly' : 'Yearly'}</span>
              </div>
              <div className="detail-item total p-2">
                <span className="content-small">Total Amount</span>
                <span className="content-small">${planDetails.totalToPay} USD</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Error modal
  const errorModal = (
    <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} className="modal-content p-3">
      <div className="error-card p-3">
        <svg
          className="title-sm m-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="var(--error)"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="title-sm m-2">Error</h3>
        <p className="content-small m-2">{error}</p>
        <button
          className="button2 p-2 m-2"
          onClick={() => router.push('/payment')}
          aria-label="Back to payment plans"
        >
          Back to Payment Plans
        </button>
      </div>
    </Modal>
  );

  return (
    <>
      <Head>
        <title>Complete Your Subscription | Memory App</title>
        <meta name="description" content="Complete your subscription to unlock premium features in the Memory App" />
        <meta name="keywords" content="subscription, payment, memory app" />
        <meta name="robots" content="index, follow" />
      </Head>
      {errorModal}
      {loading ? (
        <LoadingMemories />
      ) : (
        <GeneralMold
          pageTitle="Complete Your Subscription"
          pageDescription="Complete your subscription to unlock premium features in the Memory App"
          leftContent={leftContent}
          rightContent={rightContent}
          visibility="public"
          setUidChild={setUid}
          setTokenChild={setToken}
          setUserEmailChild={setUserEmail}
        />
      )}
      <style jsx global>{`
        .payment-container {
          background: var(--card-bg);
          border-radius: var(--radius);
          padding: 1rem;
          width: 100%;
          height: 100%;
          overflow: auto;
        }

        .payment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          margin-bottom: 1rem;
          position: relative;
        }

        .page-title {
          margin: 0;
          font-size: 1rem;
          color: var(--text-primary);
          font-weight: 600;
          text-align: center;
          width: 100%;
        }

        .payment-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .plan-summary,
        .payment-methods {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: var(--shadow);
        }

        .summary-scroll-container,
        .methods-scroll-container {
          overflow-y: auto;
          max-height: 50vh;
        }

        .summary-details {
          display: grid;
          gap: 0.8rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 0.6rem 0;
          border-bottom: 1px solid var(--border);
        }

        .detail-item.total {
          font-weight: bold;
          font-size: 1.1rem;
          border-bottom: none;
          padding-top: 1rem;
        }

        .secure-payment-notice {
          text-align: center;
          font-size: 0.8rem;
          margin: 1rem 0 0;
          color: var(--text-muted);
        }

        .paypal-button-container {
          margin-top: 1rem;
        }

        .loading-payment {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          animation: pulse 1.5s infinite ease-in-out;
        }

        @media (min-width: 768px) {
          .payment-container {
            padding: 2rem;
            background: var(--card-bg);
            border-radius: 0.7em;
          }

          .page-title {
            font-size: 1.2rem;
          }

          .payment-content {
            flex-direction: row;
          }

          .plan-summary,
          .payment-methods {
            flex: 1;
            height: 60vh;
          }
        }

        @media (min-width: 1024px) {
          .page-title {
            font-size: 1.4rem;
          }

          .plan-summary,
          .payment-methods {
            padding: 2rem;
          }
        }
      `}</style>
    </>
  );
};

export default PaypalSubscriptionPlanner;




/*/import '../../estilos/general/general.css';
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
import LoadingMemories from '@/components/complex/loading';
import { auth } from '../../../firebase'
import { toast } from 'react-toastify';

export default function PaypalSubscriptionPlanner() {
  const notifySuccess = (message) => toast.success(message);
  const notifyFailes = (message) => toast.error(message);


  const router = useRouter();
  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
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
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            setUid(user.uid);
            try {
              const idToken = await user.getIdToken();
              setToken(idToken);
            } catch (error) {
              console.error('Error getting token:', error);
              setUploadStatus('Failed to authenticate user');
            }
            const email = user.email || user.providerData?.[0]?.email;
            setUserEmail(email);
          } else {
            const path = window.location.pathname;
            notifyFailes('Please log in before continuing...');
            localStorage.setItem('redirectPath', path);
            localStorage.setItem('reason', 'userEmailValidationOnly');
            setTimeout(() => {
              router.push('/login');
            }, 2000);
          }
        });
    
        return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!userEmail) return;

    const loadLocalStorageData = () => {
      try {
        const storedPlan = localStorage.getItem('selectedPlanDetails');
        console.log(storedPlan);
        
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
  }, [userEmail]);

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

      // Actualizar sessionStorage aquí
      const planToStore = {
        amountPaid: planDetails.totalToPay,
        availableGB: planDetails.storageGB,
        paymentType: planDetails.paymentType,
        planName: planDetails.planName
      };
      
      sessionStorage.setItem('userPlanStatus', JSON.stringify(planToStore));
      
      setSubscriptionSuccess(true);
      router.push('/createNewMemory')
      localStorage.removeItem('selectedPlanDetails');
      
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
    <LoadingMemories/>
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
}*/


















