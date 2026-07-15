import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Mail, Lock, KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().length(6, 'Reset code must be exactly 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const emailFromState = (location.state as any)?.email || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromState,
      code: '',
      password: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setSubmitting(true);
    try {
      await resetPassword(data.email, data.code, data.password);
      showToast('Password reset successfully. You can now log in.', 'success');
      navigate('/login');
    } catch (error: any) {
      const responseMsg = error.response?.data?.message || 'Password reset failed. Please check your inputs.';
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
          <h2 className="font-outfit font-extrabold text-2xl text-white">Reset Password</h2>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xs">
            Submit the 6-digit confirmation code and configure your new password.
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Verification Code</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                {...register('code')}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-white/5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors tracking-widest font-mono"
              />
            </div>
            {errors.code && <span className="text-xs text-rose-400 mt-1">{errors.code.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-white/5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            {errors.password && <span className="text-xs text-rose-400 mt-1">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-sm font-bold text-white rounded-xl shadow-glow transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
export default ResetPassword;
