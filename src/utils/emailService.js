const nodemailer = require('nodemailer');

exports.sendInvoiceEmail = async (user, pdfBuffer) => {
  // Mock transport for development
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal_password'
    }
  });

  const mailOptions = {
    from: '"Elevance" <noreply@elevance.com>',
    to: user.email,
    subject: 'Your Elevance Subscription Invoice',
    text: 'Thank you for your subscription. Please find your invoice attached.',
    attachments: [
      {
        filename: 'invoice.pdf',
        content: pdfBuffer
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Invoice email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending invoice email:', error);
  }
};
