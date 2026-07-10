async function initCheckout(planName) {
  try {
    // 1. Fetch token from cookies or localStorage (assuming token is stored in localStorage or handled by cookies)
    // Note: Our auth uses cookies or localStorage 'token'. Let's check localStorage or just rely on cookie.
    const token = localStorage.getItem('token');
    
    // 2. Call backend to create order
    const orderResponse = await fetch('/api/subscription/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ planName })
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      alert(orderData.error || orderData.message || 'Failed to initialize checkout. Please login first.');
      window.location.href = 'index.html'; // Redirect to login
      return;
    }

    // 3. Initialize Razorpay options
    const options = {
      key: 'rzp_test_mock_key', // This should be your Razorpay Key ID
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Elevance Internship Platform',
      description: `Upgrade to ${planName} Plan`,
      image: 'https://via.placeholder.com/150', // Replace with logo if you have one
      order_id: orderData.orderId,
      handler: async function (response) {
        // 4. Verify payment with our backend
        try {
          const verifyRes = await fetch('/api/subscription/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planName: planName
            })
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok) {
            alert('Subscription successful! Welcome to the ' + planName + ' Plan.');
            window.location.href = 'index.html'; // Redirect to dashboard
          } else {
            alert('Payment verification failed: ' + verifyData.error);
          }
        } catch (err) {
          console.error(err);
          alert('Error verifying payment.');
        }
      },
      prefill: {
        name: "User Name", // You can pass actual user name if available
        email: "user@example.com",
      },
      theme: {
        color: "#6366f1"
      }
    };

    const rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response){
      alert('Payment failed: ' + response.error.description);
    });
    rzp1.open();

  } catch (error) {
    console.error('Checkout error:', error);
    alert('Failed to initiate checkout.');
  }
}
