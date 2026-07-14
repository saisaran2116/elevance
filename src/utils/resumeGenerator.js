const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a PDF resume
 * @param {Object} resume - Resume model instance
 * @param {Object} user - User model instance
 * @returns {Promise<string>} - Returns the URL of the generated PDF
 */
const generateResumePdf = (resume, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });

      // Ensure directory exists
      const publicDir = path.join(__dirname, '../../public');
      const resumesDir = path.join(publicDir, 'resumes');
      
      if (!fs.existsSync(resumesDir)) {
        fs.mkdirSync(resumesDir, { recursive: true });
      }

      const fileName = `resume_${resume.id}_${Date.now()}.pdf`;
      const filePath = path.join(resumesDir, fileName);
      const fileUrl = `/resumes/${fileName}`;

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header: Name and Email
      doc.fontSize(24).font('Helvetica-Bold').text(resume.name || user.name, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(user.email, { align: 'center' });
      
      // Personal Info (if any)
      if (resume.personalInfo) {
        let personalDetails = '';
        if (resume.personalInfo.details && typeof resume.personalInfo.details === 'object') {
            for (const [key, value] of Object.entries(resume.personalInfo.details)) {
                personalDetails += `${key}: ${value} | `;
            }
        }
        if (personalDetails) {
            doc.fontSize(10).text(personalDetails, { align: 'center' });
        }
      }
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Qualifications
      doc.fontSize(16).font('Helvetica-Bold').text('Qualifications');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(resume.qualifications);
      doc.moveDown();

      // Experience
      doc.fontSize(16).font('Helvetica-Bold').text('Experience');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(resume.experience);
      doc.moveDown();

      doc.end();

      stream.on('finish', () => {
        resolve(fileUrl);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateResumePdf
};
