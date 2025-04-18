document.getElementById('bookingForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      datetime: form.datetime.value,
      amount: form.amount.value
    };
    const method = form.method.value;
  
    if (method === 'paystack') {
      // initialize Paystack
      const init = await fetch('http://localhost:3000/api/paystack/initialize', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email:data.email, amount: data.amount })
      }).then(r=>r.json());
      if (init.status) {
        const handler = PaystackPop.setup({
          key: 'pk_test_yourActualPaystackPublicKey',
          email: data.email,
          amount: data.amount * 100,
          reference: init.data.reference,
          callback: async(r) => {
            // verify on your server
            await fetch(`http://localhost:3000/api/paystack/verify/${r.reference}`);
            alert('Payment successful! Booking confirmed.');
          },
          onClose: () => alert('Payment cancelled.')
        });
        handler.openIframe();
      } else {
        alert('Failed to initialize Paystack.');
      }
  
    } else if (method === 'mpesa') {
      // M-Pesa STK push
      const res = await fetch('http://localhost:3000/api/mpesa/stkpush', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ phone: data.phone, amount: data.amount })
      }).then(r=>r.json());
      if (res.ResponseCode === '0') {
        alert('Check your phone to complete M-Pesa payment.');
      } else {
        alert('M-Pesa error: ' + res.errorMessage);
      }
    }
  });
  