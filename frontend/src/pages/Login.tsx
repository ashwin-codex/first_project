import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Bot, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginInput = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      showToast('Logged in successfully', 'success');
      // Redirect back or dashboard
      const origin = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(origin);
    } catch (error: any) {
      const responseMsg = error.response?.data?.message || 'Login failed. Please check credentials.';

      if (error.response?.status === 403) {
        // Email needs verification
        showToast(responseMsg, 'info');
        navigate('/verify-email', { state: { email: data.email } });
      } else {
        showToast(responseMsg, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] bg-gradient-premium flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel rounded-3xl p-8 border border-white/5 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center font-bold text-white text-2xl shadow-glow mb-4">
            P
          </Link>
          <h2 className="font-outfit font-extrabold text-2xl text-white">Welcome Back</h2>
          <p className="text-slate-400 text-xs mt-1.5">Sign in to resume tracking and coaching</p>
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
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs text-brand-400 hover:underline">
                Forgot password?
              </Link>
            </div>
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
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-slate-400 text-xs text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 font-semibold hover:underline">
            Register Here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
export default Login;
