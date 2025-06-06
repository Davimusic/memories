'use client';

import '../../estilos/general/api/payments/index.css';
import '../../app/globals.css';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Modal from '@/components/complex/modal';
import GeneralMold from '@/components/complex/generalMold';
import { auth } from '../../../firebase';
import { toast } from 'react-toastify';
import LoadingMemories from '@/components/complex/loading';

const PaymentPlans = () => {
  const notifySuccess = (message) => toast.success(message);
  const notifyFailes = (message) => toast.error(message);

  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentFrequency, setPaymentFrequency] = useState('monthly');
  const [fiveYearGB, setFiveYearGB] = useState(1);
  const [monthlyGB, setMonthlyGB] = useState(10);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const router = useRouter();

  // Authentication handling
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
        }
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
        setIsAuthenticated(true);
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

  // Fetch user plan
  useEffect(() => {
    if (!userEmail) return;

    async function fetchPlan() {
      try {
        const response = await fetch('/api/mongoDb/queries/checkUserPlanExistence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        });

        if (!response.ok) {
          throw new Error(`Error en la petición: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
          if (data.exists) {
            setPlan(data.plan);
          } else {
            setPlan({ planName: 'free' });
          }
        } else {
          setError(data.message || 'Usuario no encontrado o sin plan.');
        }
      } catch (err) {
        setError(err.message);
      }
    }

    fetchPlan();
  }, [userEmail]);

  // Cálculos de precios corregidos con márgenes exactos
  const calculateFiveYearPrice = (gb) => {
    // Costo base: $0.02/GB/mes × 60 meses = $1.20/GB por 5 años
    const baseCost = gb * 0.02 * 60;
    // Margen 700%: baseCost × 7 = ganancia
    const profit = baseCost * 7;
    // Precio total = costo base + ganancia
    const totalPrice = baseCost + profit;
    // Aproximar a x.99
    return Math.floor(totalPrice) + 0.99;
  };

  const calculateMonthlyPrice = (gb, frequency) => {
    // Costo base mensual: $0.02/GB
    const baseCostPerMonth = gb * 0.02;
    // Margen 400%: baseCostPerMonth × 4 = ganancia
    const profit = baseCostPerMonth * 4;
    // Precio mensual = costo base + ganancia
    const monthlyPrice = baseCostPerMonth + profit;
    
    if (frequency === 'monthly') {
      return Math.floor(monthlyPrice * 100) / 100; // Mantener dos decimales
    } else {
      // Precio anual = precio mensual × 12 con 20% de descuento
      const yearlyPrice = monthlyPrice * 12 * 0.8;
      return Math.floor(yearlyPrice) + 0.99; // Aproximar a x.99
    }
  };

  const fiveYearPrice = calculateFiveYearPrice(fiveYearGB).toFixed(2);
  const monthlyPriceMonthly = calculateMonthlyPrice(monthlyGB, 'monthly').toFixed(2);
  const monthlyPriceYearly = calculateMonthlyPrice(monthlyGB, 'yearly').toFixed(2);

  // Handle payment
  const handlePayment = async (planType, gb, frequency = null) => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      let planDetails;
      if (planType === 'fiveYear') {
        planDetails = {
          planType: 'fiveYear',
          gb: gb,
          totalToPay: calculateFiveYearPrice(gb).toFixed(2),
          paymentType: 'one-time',
        };
      } else if (planType === 'monthly') {
        const pricePerPeriod = frequency === 'monthly' 
          ? calculateMonthlyPrice(gb, 'monthly').toFixed(2)
          : calculateMonthlyPrice(gb, 'yearly').toFixed(2);
        planDetails = {
          planType: 'monthly',
          gb: gb,
          totalToPay: pricePerPeriod,
          paymentType: frequency,
        };
      }

      localStorage.setItem('selectedPlanDetails', JSON.stringify(planDetails));
      router.push('/payment/payPlan');
    } catch (error) {
      setPaymentError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Left content: Plan selection grid
  const leftContent = (
    <div className="card-content">
      <div className="header-section">
        {plan && (
          <div className="current-plan">
            <h5>Current Plan: {plan.planName}</h5>
            {plan.planName !== 'free' && (
              <>
                <p>Status: <span className="status-active">Active</span></p>
                <button
                  className="demo-button"
                  onClick={() => setShowPlanModal(true)}
                  aria-label="View Current Plan Details"
                >
                  View Plan Details
                </button>
              </>
            )}
          </div>
        )}
        <h2 className="card-title">Choose Your Plan</h2>
      </div>
      <div className="plans-grid">
        {/* 5-Year Plan */}
        <div className="plan-card">
          <div className="plan-card-header">
            <h3 className="plan-name">5-Year Plan</h3>
            <p className="plan-description">One-time payment for 5 years</p>
          </div>
          <div className="plan-card-price">
            ${fiveYearPrice} <span className="price-period">for 5 years</span>
          </div>
          <div className="storage-slider">
            <label>Storage: {fiveYearGB} GB</label>
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="10000"
                value={fiveYearGB}
                onChange={(e) => setFiveYearGB(parseInt(e.target.value))}
                className="styled-slider"
                aria-label="Select storage for 5-Year Plan"
              />
              <div className="slider-ticks">
                <span className="tick">1GB</span>
                <span className="tick">100GB</span>
                <span className="tick">1TB</span>
                <span className="tick">10TB</span>
              </div>
            </div>
          </div>
          <div className="gb-input-container">
            <input
              type="number"
              min="1"
              max="10000"
              value={fiveYearGB}
              onChange={(e) => setFiveYearGB(Math.min(10000, Math.max(1, parseInt(e.target.value) || 1)))}
              className="gb-input"
              aria-label="Enter storage amount for 5-Year Plan"
            />
            <span className="gb-unit">GB</span>
          </div>
          <button
            onClick={() => handlePayment('fiveYear', fiveYearGB)}
            className="button2 plan-button"
            disabled={isProcessing}
            aria-label="Get Started with 5-Year Plan"
          >
            {isProcessing ? 'Processing...' : 'Get Started'}
          </button>
        </div>

        {/* Monthly Plan */}
        <div className="plan-card">
          <div className="plan-card-header">
            <h3 className="plan-name">Monthly Plan</h3>
            <p className="plan-description">Flexible monthly or yearly billing</p>
          </div>
          <div className="frequency-toggle">
            <button
              onClick={() => setPaymentFrequency('monthly')}
              className={`toggle-option ${paymentFrequency === 'monthly' ? 'active' : ''}`}
              aria-label="Select monthly payment frequency"
            >
              Monthly
            </button>
            <button
              onClick={() => setPaymentFrequency('yearly')}
              className={`toggle-option ${paymentFrequency === 'yearly' ? 'active' : ''}`}
              aria-label="Select yearly payment frequency"
            >
              Yearly <span className="discount-badge">(20% off)</span>
            </button>
          </div>
          <div className="plan-card-price">
            ${paymentFrequency === 'monthly' ? monthlyPriceMonthly : monthlyPriceYearly}
            <span className="price-period">/{paymentFrequency === 'monthly' ? 'month' : 'year'}</span>
          </div>
          <div className="storage-slider">
            <label>Storage: {monthlyGB} GB</label>
            <div className="slider-container">
              <input
                type="range"
                min="10"
                max="10000"
                value={monthlyGB}
                onChange={(e) => setMonthlyGB(parseInt(e.target.value))}
                className="styled-slider"
                aria-label="Select storage for Monthly Plan"
              />
              <div className="slider-ticks">
                <span className="tick">10GB</span>
                <span className="tick">100GB</span>
                <span className="tick">1TB</span>
                <span className="tick">10TB</span>
              </div>
            </div>
          </div>
          <div className="gb-input-container">
            <input
              type="number"
              min="10"
              max="10000"
              value={monthlyGB}
              onChange={(e) => setMonthlyGB(Math.min(10000, Math.max(10, parseInt(e.target.value)) || 10))}
              className="gb-input"
              aria-label="Enter storage amount for Monthly Plan"
            />
            <span className="gb-unit">GB</span>
          </div>
          <button
            onClick={() => handlePayment('monthly', monthlyGB, paymentFrequency)}
            className="button2 plan-button"
            disabled={isProcessing}
            aria-label="Get Started with Monthly Plan"
          >
            {isProcessing ? 'Processing...' : 'Get Started'}
          </button>
        </div>
      </div>
      {paymentError && <div className="error-message color-error">{paymentError}</div>}
    </div>
  );

  // Modal for existing plan details
  const planDetailsModal = (
    <Modal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} className="p-2">
      <div className="plan-details-modal">
        <h2>Your Current Plan</h2>
        {plan && plan.planName === 'free' ? (
          <p>You are currently on the Free plan.</p>
        ) : (
          <>
            <div className="detail-item">
              <span className="detail-label">Plan:</span>
              <span className="detail-value">{plan?.planName || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Price:</span>
              <span className="detail-value">
                ${plan?.amountPaid || '0'}/{plan?.paymentType || 'monthly'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Storage:</span>
              <span className="detail-value">{plan?.availableGB || '0'}GB</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value status-active">Active</span>
            </div>
          </>
        )}
        <button
          className="close-button"
          onClick={() => setShowPlanModal(false)}
          aria-label="Close Plan Details Modal"
        >
          Close
        </button>
      </div>
    </Modal>
  );

  return (
    <>
      <Head>
        <title>Choose Your Plan | Memory App</title>
        <meta name="description" content="Select a payment plan to unlock premium features in the Memory App" />
        <meta name="keywords" content="payment plans, memory app, subscription" />
        <meta name="robots" content="index, follow" />
      </Head>
      {planDetailsModal}
      {isAuthenticated ? (
        <GeneralMold
          pageTitle="Choose Your Plan"
          pageDescription="Select a payment plan to unlock premium features in the Memory App"
          leftContent={leftContent}
          visibility="public"
          setUidChild={setUid}
          setTokenChild={setToken}
          setUserEmailChild={setUserEmail}
        />
      ) : (
        <LoadingMemories />
      )}
    </>
  );
};

export default PaymentPlans;







