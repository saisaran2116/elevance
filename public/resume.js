document.addEventListener('DOMContentLoaded', () => {
    const btnRequestOtp = document.getElementById('btnRequestOtp');
    const btnVerifyOtp = document.getElementById('btnVerifyOtp');
    const requestOtpSection = document.getElementById('requestOtpSection');
    const verifyOtpSection = document.getElementById('verifyOtpSection');
    const messageDiv = document.getElementById('message');
    const resumeForm = document.getElementById('resumeForm');

    function showMessage(msg, isError = false) {
        messageDiv.textContent = msg;
        messageDiv.className = isError ? 'error-message' : '';
    }

    btnRequestOtp.addEventListener('click', async () => {
        // Validate form before requesting OTP
        if (!resumeForm.checkValidity()) {
            resumeForm.reportValidity();
            return;
        }

        try {
            btnRequestOtp.disabled = true;
            btnRequestOtp.textContent = 'Sending...';

            const response = await fetch('/api/resume/request-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('OTP sent to your registered email.');
                requestOtpSection.classList.add('hidden');
                verifyOtpSection.classList.remove('hidden');
            } else {
                showMessage(data.message || 'Failed to send OTP.', true);
            }
        } catch (error) {
            console.error('Error requesting OTP:', error);
            showMessage('An error occurred. Please try again.', true);
        } finally {
            btnRequestOtp.disabled = false;
            btnRequestOtp.textContent = 'Request OTP';
        }
    });

    btnVerifyOtp.addEventListener('click', async () => {
        const otp = document.getElementById('otp').value.trim();
        if (!otp) {
            showMessage('Please enter the OTP.', true);
            return;
        }

        try {
            btnVerifyOtp.disabled = true;
            btnVerifyOtp.textContent = 'Verifying...';

            const formData = new FormData(resumeForm);
            // We append the OTP to the formData
            formData.append('otp', otp);

            const response = await fetch('/api/resume/verify-otp', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('OTP verified successfully! Redirecting to payment...');
                // Placeholder for Razorpay integration
                setTimeout(() => {
                    alert('Redirecting to Razorpay for ₹50 payment... (Placeholder)');
                    // window.location.href = data.paymentUrl;
                }, 2000);
            } else {
                showMessage(data.message || 'Invalid OTP.', true);
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            showMessage('An error occurred during verification.', true);
        } finally {
            btnVerifyOtp.disabled = false;
            btnVerifyOtp.textContent = 'Verify OTP & Pay ₹50';
        }
    });
});
