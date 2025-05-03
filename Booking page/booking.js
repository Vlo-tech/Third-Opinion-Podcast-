document.addEventListener('DOMContentLoaded', () => {
  const form            = document.getElementById('bookingForm');
  const payButton       = document.getElementById('payButton');
  const paypalContainer = document.getElementById('paypal-button-container');
  const methodInputs    = document.querySelectorAll('input[name="method"]');

  // Toast + confetti helpers
  function showSuccess(msg) {
    Toastify({
      text: msg,
      duration: 4000,
      gravity: 'top',
      position: 'right',
      style: { background: 'linear-gradient(to right, #00b09b, #96c93d)' }
    }).showToast();
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }
  function showError(msg) {
    Toastify({
      text: msg,
      duration: 4000,
      gravity: 'top',
      position: 'right',
      style: { background: '#e74c3c' }
    }).showToast();
  }

  // Initialize PayPal Smart Buttons (hidden until PayPal is selected)
  if (window.paypal) {
    paypal.Buttons({
      createOrder: async () => {
        const amount = Number(form.amount.value);
        if (isNaN(amount) || amount <= 0) {
          showError('Please enter a positive amount');
          throw new Error('Invalid amount');
        }
        // Create order on your server
        const res = await fetch('http://localhost:3000/api/paypal/create-order', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:     form.name.value,
            email:    form.email.value,
            phone:    form.phone.value,
            datetime: form.datetime.value,
            amount
          })
        });
        const { id } = await res.json();
        return id;
      },
      onApprove: async data => {
        // Capture on your server
        await fetch('http://localhost:3000/api/paypal/capture-order', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ orderID: data.orderID })
        });
        showSuccess('🎉 PayPal payment complete! Booking confirmed.');
      },
      onError: err => showError('PayPal error: ' + err)
    }).render('#paypal-button-container');
  } else {
    console.error('❌ PayPal SDK not loaded');
  }

  // Toggle between Pay & Book button vs. PayPal buttons
  function togglePaymentUI() {
    const method = form.method.value;
    if (method === 'paypal') {
      payButton.style.display       = 'none';
      paypalContainer.style.display = 'block';
    } else {
      paypalContainer.style.display = 'none';
      payButton.style.display       = 'block';
    }
  }
  methodInputs.forEach(r => r.addEventListener('change', togglePaymentUI));
  togglePaymentUI();

  // Handle form submit for Paystack & M-Pesa
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const rawAmount = Number(form.amount.value);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      return showError('Please enter a positive amount');
    }

    const data = {
      name:     form.name.value,
      email:    form.email.value,
      phone:    form.phone.value,
      datetime: form.datetime.value,
      amount:   rawAmount,
      currency: form.currency.value    // ← newly added
    };
    const method = form.method.value;

    if (method === 'paystack') {
      try {
        // 1) initialize
        const initRes = await fetch('http://localhost:3000/api/paystack/initialize', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            email:    data.email,
            amount:   data.amount,
            currency: data.currency        // ← newly added
          })
        });
        const init = await initRes.json();

        if (!init.status) {
          showError(init.message || 'Failed to initialize Paystack.');
          return;
        }

        // 2) open inline widget
        const handler = PaystackPop.setup({
          key:       'pk_live_54e900381f01f0ea7a20ccfe1d5d9e2663b8856c',
          email:     data.email,
          amount:    data.amount * 100,            // in kobo or cents
          reference: init.data.reference,
          callback: function(response) {
            // 3) verify
            fetch(`http://localhost:3000/api/paystack/verify/${response.reference}`)
              .then(r => r.json())
              .then(verification => {
                if (verification.data && verification.data.status === 'success') {
                  showSuccess('🎉 Payment successful! Booking confirmed.');
                } else {
                  showError('Payment not completed.');
                }
              })
              .catch(err => showError('Verification error: ' + err.message));
          },
          onClose: function() {
            showError('Payment window closed before completion.');
          }
        });
        handler.openIframe();

      } catch (err) {
        console.error(err);
        showError('Paystack error: ' + err.message);
      }

    } else if (method === 'mpesa') {
      // … your existing M-Pesa code untouched …
      try {
        const res = await fetch('http://localhost:3000/api/mpesa/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone:      data.phone,
            amount:     data.amount,
            accountRef: data.name,
            desc:       'Podcast booking'
          })
        });
        const result = await res.json();
        if (result.success && result.data.ResponseCode === '0') {
          showSuccess('✅ STK Push sent! Check your phone to complete payment.');
        } else {
          showError('M-Pesa error: ' + (result.error || result.data.errorMessage || 'Unknown'));
        }
      } catch (err) {
        console.error(err);
        showError('M-Pesa request failed.');
      }
    }

    // if method === 'paypal', PayPal buttons handle everything
  });
});



