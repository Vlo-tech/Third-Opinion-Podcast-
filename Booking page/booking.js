// booking.js
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

  // 1) Parse & validate amount as a Number
  const rawAmount = Number(form.amount.value);
  if (isNaN(rawAmount) || rawAmount <= 0) {
    // showError is declared below, but we can call it here
    Toastify({
      text: 'Please enter a positive amount',
      duration: 4000,
      gravity: 'top',
      position: 'right',
      style: { background: '#e74c3c' }
    }).showToast();
    return;
  }

  const data = {
    name:     form.name.value,
    email:    form.email.value,
    phone:    form.phone.value,
    datetime: form.datetime.value,
    amount:   rawAmount              // ← now a true Number
  };
  const method = form.method.value;

  // Helper to show toast + confetti
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

  if (method === 'paystack') {
    try {
      const init = await fetch('http://localhost:3000/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, amount: data.amount })
      }).then(r => r.json());

      if (init.status) {
        const handler = PaystackPop.setup({
          key:       'pk_test_yourActualPaystackPublicKey',
          email:     data.email,
          amount:    data.amount * 100,
          reference: init.data.reference,
          callback: async () => {
            await fetch(`http://localhost:3000/api/paystack/verify/${init.data.reference}`);
            showSuccess('🎉 Payment successful! Booking confirmed.');
          },
          onClose: () => showError('Payment cancelled.')
        });
        handler.openIframe();
      } else {
        showError('Failed to initialize Paystack.');
      }
    } catch (err) {
      console.error(err);
      showError('Paystack error: ' + err.message);
    }

  } else if (method === 'mpesa') {
    try {
      const res = await fetch('http://localhost:3000/api/mpesa/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone:      data.phone,
          amount:     data.amount,    // ← now a Number
          accountRef: data.name,
          desc:       'Podcast booking'
        })
      }).then(r => r.json());

      if (res.success && res.data.ResponseCode === '0') {
        showSuccess('✅ STK Push sent! Check your phone to complete payment.');
      } else {
        showError('M-Pesa error: ' + (res.error || res.data.errorMessage || 'Unknown'));
      }
    } catch (err) {
      console.error(err);
      showError('M-Pesa request failed.');
    }
  }
});
