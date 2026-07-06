/**
 * Custom Password Generator
 * Generates a secure, random password of a given length with at least
 * one uppercase letter, one lowercase letter, one digit, and one special character.
 * 
 * @param {number} length - Length of the generated password (minimum 8)
 * @returns {string} The generated password
 */
function generateCustomPassword(length = 12) {
  const minLength = Math.max(length, 8);
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=[]';
  const allChars = upper + lower + numbers + symbols;

  let password = '';
  // Guarantee at least one character from each character set
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill up the rest of the password length with random characters
  for (let i = 4; i < minLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password characters using Fisher-Yates shuffle
  const arr = password.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  return arr.join('');
}

module.exports = {
  generateCustomPassword
};
