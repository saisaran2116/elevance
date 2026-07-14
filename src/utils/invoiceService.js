const PDFDocument = require('pdfkit');

exports.generateInvoice = (user, plan, transactionId) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      doc.fontSize(25).text('Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Transaction ID: ${transactionId}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown();
      doc.text(`Billed To: ${user.name} (${user.email})`);
      doc.moveDown();
      doc.text(`Plan: ${plan.name}`);
      doc.text(`Amount Paid: Rs. ${plan.amount / 100}`);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
