export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }
  
    const { amount } = req.body; // Precio dinámico en USD (ej: "9.99")
    const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const SECRET = process.env.NEXT_PUBLIC_PAYPAL_SECRET_KEY_1;
  
    try {
      // 1. Obtener Access Token
      const authResponse = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });
      const authData = await authResponse.json();
      const accessToken = authData.access_token;
  
      // 2. Crear Producto
      const productResponse = await fetch('https://api.sandbox.paypal.com/v1/catalogs/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: 'Servicio Premium',
          description: 'Acceso a contenido exclusivo',
          type: 'SERVICE',
          category: 'SOFTWARE',
        }),
      });
      const productData = await productResponse.json();
      const productId = productData.id;
  
      // 3. Crear Plan Mensual (con 7 días de prueba)
      const monthlyPlanResponse = await fetch('https://api.sandbox.paypal.com/v1/billing/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          product_id: productId,
          name: 'Plan Mensual',
          status: 'ACTIVE',
          billing_cycles: [
            {
              frequency: { interval_unit: 'DAY', interval_count: 7 }, // 7 días gratis
              tenure_type: 'TRIAL',
              sequence: 1,
              total_cycles: 1,
              pricing_scheme: { fixed_price: { value: '0', currency_code: 'USD' } },
            },
            {
              frequency: { interval_unit: 'MONTH', interval_count: 1 },
              tenure_type: 'REGULAR',
              sequence: 2,
              total_cycles: 0, // Ilimitado
              pricing_scheme: { fixed_price: { value: amount, currency_code: 'USD' } },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            payment_failure_threshold: 3,
          },
        }),
      });
      const monthlyPlanData = await monthlyPlanResponse.json();
  
      // 4. Crear Plan Anual (con 7 días de prueba y 10% descuento)
      const yearlyPlanResponse = await fetch('https://api.sandbox.paypal.com/v1/billing/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          product_id: productId,
          name: 'Plan Anual',
          status: 'ACTIVE',
          billing_cycles: [
            {
              frequency: { interval_unit: 'DAY', interval_count: 7 }, // 7 días gratis
              tenure_type: 'TRIAL',
              sequence: 1,
              total_cycles: 1,
              pricing_scheme: { fixed_price: { value: '0', currency_code: 'USD' } },
            },
            {
              frequency: { interval_unit: 'YEAR', interval_count: 1 },
              tenure_type: 'REGULAR',
              sequence: 2,
              total_cycles: 0,
              pricing_scheme: { 
                fixed_price: { 
                  value: (parseFloat(amount) * 12 * 0.9).toFixed(2), // 10% descuento
                  currency_code: 'USD' 
                } 
              },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
          },
        }),
      });
      const yearlyPlanData = await yearlyPlanResponse.json();
  
      // Respuesta con los IDs de los planes
      res.status(200).json({
        monthlyPlanId: monthlyPlanData.id,
        yearlyPlanId: yearlyPlanData.id,
      });
  
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ 
        error: 'Error al crear los planes',
        details: error.message 
      });
    }
  }