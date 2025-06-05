import crypto from 'crypto';

export default function generateUserId(email) {
  console.log(email);
  
  const normalizedEmail = email.toLowerCase().trim();
  console.log(crypto.createHash('sha256').update(normalizedEmail).digest('hex'));
  
  return crypto.createHash('sha256').update(normalizedEmail).digest('hex');
}