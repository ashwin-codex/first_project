import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { GlassCard } from '../components/ui/GlassCard';
import { User, Lock, Trash2, Camera, Loader2, ArrowRight } from 'lucide-react';
import API from '../services/api';

export const Profile: React.FC = () => {
  const { user, updateProfile, uploadAvatar, logout } = useAuth();
  const { showToast } = useToast();

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile Form States
  const [name, setName] = useState(user?.name || '');

  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingProfile(true);
    try {
      await updateProfile({ name });
      showToast('Profile metadata updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update profile details', 'error');
    } finally {
      setSavingProfile(true);
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      await uploadAvatar(formData);
      showToast('Profile photo updated successfully', 'success');
    } catch (err: any) {
      const responseMsg = err.response?.data?.message || 'Failed to upload photo';
      showToast(responseMsg, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await API.put('/profile/change-password', { oldPassword, newPassword });
      showToast('Password updated successfully', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const responseMsg = err.response?.data?.message || 'Failed to change password. Verify inputs.';
      showToast(responseMsg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'WARNING: This will permanently wipe your profile records, recurring transfers, budgets, and chats. To confirm deletion, type "DELETE":'
    );
    if (confirmation !== 'DELETE') {
      showToast('Deactivation request cancelled.', 'info');
      return;
    }

    setDeletingUser(true);
    try {
      await API.delete('/profile');
      showToast('Your account has been deleted.', 'success');
      logout();
    } catch (err) {
      showToast('Failed to delete account', 'error');
    } finally {
      setDeletingUser(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#0b0f19] overflow-y-auto text-slate-100 text-left">
      <div className="border-b border-white/5 pb-3">
        <h1 className="font-outfit font-extrabold text-3xl text-white font-bold flex items-center gap-2">
          <User className="w-8 h-8 text-brand-500" />
          Profile Account Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure user information, upload photos, or change credentials</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        {/* Profile Card & Basic Info */}
        <div className="flex flex-col gap-6">
          <GlassCard className="flex flex-col items-center text-center p-6 relative">
            <div className="relative w-28 h-28 group mb-4">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-2xl object-cover border border-white/10"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-3xl">
                  {user?.name.charAt(0)}
                </div>
              )}

              {/* Upload overlay */}
              <label className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition duration-300">
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>

              {uploadingAvatar && (
                <div className="absolute inset-0 bg-slate-950/80 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                </div>
              )}
            </div>

            <h3 className="font-outfit font-bold text-lg text-white">{user?.name}</h3>
            <p className="text-slate-500 text-xs mt-0.5">{user?.email}</p>
          </GlassCard>

          <GlassCard>
            <h3 className="font-outfit font-bold text-md text-white mb-4">Personal Details</h3>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Email Address (Primary)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="py-2.5 px-3 bg-slate-950/30 border border-white/5 rounded-xl text-sm text-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Full Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-xs font-bold text-white rounded-xl shadow-glow transition flex items-center justify-center gap-2"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Details'}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Change password & Delete account */}
        <div className="flex flex-col gap-6">
          <GlassCard>
            <h3 className="font-outfit font-bold text-md text-white mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-violet-400" />
              Credentials Management
            </h3>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-3.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs font-bold text-white rounded-xl shadow-glow transition flex items-center justify-center"
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Modify Credentials'}
              </button>
            </form>
          </GlassCard>

          <GlassCard className="border-rose-500/10 bg-rose-500/5">
            <h3 className="font-outfit font-bold text-md text-rose-400 mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              Zone of Danger
            </h3>
            <p className="text-xs text-rose-300 mb-4 leading-relaxed font-medium">
              Deleting your account is permanent. All transaction records, active budgets, and chatbot interactions will be purged.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deletingUser}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded-xl shadow-glow transition flex items-center justify-center"
            >
              {deletingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete PocketPilot Account'}
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
export default Profile;
