import crypto from 'crypto';

export const generateUniqueCode = async (): Promise<string> => {
  // Generate a random string of 8 characters
  const buffer = crypto.randomBytes(4);
  const code = buffer.toString('hex').toUpperCase();
  
  // Add a prefix to make it more readable and identifiable
  return `VTX${code}`;
};

export const isValidReferralCode = (code: string): boolean => {
  // Validate format: VTX followed by 8 hexadecimal characters
  const pattern = /^VTX[0-9A-F]{8}$/;
  return pattern.test(code);
};
