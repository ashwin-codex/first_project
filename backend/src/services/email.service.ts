export class EmailService {
  static async sendVerificationEmail(email: string, code: string): Promise<boolean> {
    console.log(`
=========================================
[EMAIL MOCK] Verification Code
To: ${email}
Code: ${code}
Use this code to verify your PocketPilot account.
=========================================
    `);
    // Mock nodemailer configuration could be integrated here, but for dev and local execution
    // displaying to terminal is highly reliable and easy to inspect.
    return true;
  }

  static async sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
    console.log(`
=========================================
[EMAIL MOCK] Password Reset Request
To: ${email}
Verification Code: ${code}
Use this code to verify your identity and reset your password.
=========================================
    `);
    return true;
  }

  static async sendSavingsGoalCongratulation(email: string, targetName: string): Promise<boolean> {
    console.log(`
=========================================
[EMAIL MOCK] Savings Milestone Alert!
To: ${email}
Subject: Congratulations on reaching your target for ${targetName}!
Keep budgeting efficiently with PocketPilot!
=========================================
    `);
    return true;
  }
}
