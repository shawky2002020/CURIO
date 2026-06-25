/**
 * OTP (One-Time Password) Service.
 * In production, this integrates with Twilio or another SMS provider.
 */
export const sendOtp = async (phone: string): Promise<string> => {
  // TODO: Generate and send OTP via SMS
  const mockOtp = '123456';
  console.log(`[OTP Service] OTP ${mockOtp} sent to ${phone}`);
  return mockOtp;
};

export const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
  // TODO: Validate OTP
  return otp === '123456';
};
