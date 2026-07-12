const invoiceService = require('./invoiceService');
const emailService = require('./emailService');
const fs = require('fs');

async function run() {
  const user = { name: 'Test User', email: 'test@example.com' };
  const plan = { name: 'Gold', amount: 100000 };
  
  console.log('Generating invoice...');
  const pdfBuffer = await invoiceService.generateInvoice(user, plan, 'txn_123456');
  
  console.log('Saving to disk...');
  fs.writeFileSync('test_invoice.pdf', pdfBuffer);
  
  console.log('Sending email...');
  await emailService.sendInvoiceEmail(user, pdfBuffer);

  console.log('Done');
}

run();
