import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Mail, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setSubmitting(true);
    try {
      await forgotPassword(data.email);
      showToast('A password reset code has been sent to your email.', 'success');
      navigate('/reset-password', { state: { email: data.email } });
    } catch (error: any) {
      const responseMsg = error.response?.data?.message || 'Failed to request reset. Please try again.';
      showToast(responseMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] bg-gradient-premium flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel rounded-3xl p-8 border border-white/5 relative z-10"
      >
        <Link to="/login" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 mb-6 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>

        <div className="flex flex-col items-center mb-8 text-center">
          <h2 className="font-outfit font-extrabold text-2xl text-white">Recover Password</h2>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xs">
            Enter your email address and we will forward a 6-digit verification code to reset your credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-white/5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            {errors.email && <span className="text-xs text-rose-400 mt-1">{errors.email.message}</span>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-sm font-bold text-white rounded-xl shadow-glow transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Send Verification Code
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
export default ForgotPassword;
