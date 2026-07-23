import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiMail, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your credentials.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://cognito-idp.ap-southeast-1.amazonaws.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: '27a9ok6685qkkmaapr9pv9p7a5',
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.AuthenticationResult) {
        if (rememberMe) {
          localStorage.setItem('idp_admin_remember', 'true');
        }
        localStorage.setItem('idp_admin_auth', 'true');
        if (data.AuthenticationResult.AccessToken) {
          localStorage.setItem('idp_access_token', data.AuthenticationResult.AccessToken);
        }
        if (data.AuthenticationResult.IdToken) {
          localStorage.setItem('idp_id_token', data.AuthenticationResult.IdToken);
        }
        onLoginSuccess();
      } else {
        // Log the exact Cognito response for debugging purposes
        console.error('Cognito error response:', data);
        
        // Extract Cognito-specific error message
        const errorMessage = data.message || 'Invalid admin credentials.';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Cognito Auth Error:', err);
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex font-sans overflow-hidden select-none relative">
      {/* Background blobs for premium gradient blend using logo blue & orange */}
      {/* Top Left: Logo Blue glow */}
      <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] 2xl:w-[750px] 2xl:h-[750px] rounded-full bg-blue-100/50 blur-[130px] pointer-events-none" />
      {/* Bottom Right: Logo Blue glow */}
      <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] 2xl:w-[750px] 2xl:h-[750px] rounded-full bg-blue-100/40 blur-[130px] pointer-events-none" />
      
      {/* Top Right: Logo Orange glow */}
      <div className="absolute top-[-15%] right-[-10%] w-[550px] h-[550px] 2xl:w-[750px] 2xl:h-[750px] rounded-full bg-[#E98313]/8 blur-[130px] pointer-events-none" />
      {/* Bottom Left: Logo Orange glow */}
      <div className="absolute bottom-[-15%] left-[-10%] w-[550px] h-[550px] 2xl:w-[750px] 2xl:h-[750px] rounded-full bg-[#E98313]/8 blur-[130px] pointer-events-none" />

      {/* Center blending overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[600px] rounded-full bg-blue-100/20 blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000001_1px,transparent_1px),linear-gradient(to_bottom,#00000001_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* LEFT PANEL: Light Backdrop with Spotlight Glow */}
      <div className="hidden md:flex md:w-1/2 relative items-center justify-center p-12 overflow-hidden h-full bg-transparent">
        
        {/* Soft radial circular spotlight behind the illustration */}
        <div className="absolute w-[440px] h-[440px] rounded-full bg-gradient-to-tr from-blue-50/60 to-[#0B4A99]/5 border border-slate-200/20 flex items-center justify-center pointer-events-none" />
        
        {/* Floating Illustration with soft drop shadow */}
        <motion.img
          initial={{ opacity: 0, y: 15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          src="/login-page.png"
          alt="Assessments Panel"
          className="relative w-auto h-auto max-w-[85%] max-h-[85%] object-contain select-none filter drop-shadow-[0_20px_40px_rgba(11,74,153,0.1)] z-10"
        />
      </div>

      {/* RIGHT PANEL: Form Card */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 relative h-full overflow-hidden bg-transparent">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[370px] 2xl:max-w-[430px] bg-white border border-slate-200/50 rounded-3xl p-7 2xl:p-9 shadow-xl relative z-10"
        >
          
          {/* Header branding (Logo and Title kept) */}
          <div className="text-center mb-6 2xl:mb-8">
            <img
              src="/idp-logo.png"
              alt="IDP Logo"
              className="h-12 2xl:h-16 w-auto mx-auto object-contain mb-3 2xl:mb-4 filter drop-shadow-sm"
            />
            <h1 className="text-xl 2xl:text-2xl font-black text-slate-900 tracking-tight leading-none">IDP Assess360</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 2xl:space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200/50 rounded-xl p-2.5 flex items-start space-x-2 text-red-700 font-sans"
              >
                <FiAlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="text-[10px] 2xl:text-[11px] font-semibold leading-normal">{error}</span>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-1 2xl:space-y-1.5">
              <label className="block text-[9px] 2xl:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Admin Username / Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiMail className="w-3.5 h-3.5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@idp.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 2xl:py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#0B4A99]/20 focus:border-[#0B4A99] focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1 2xl:space-y-1.5">
              <label className="block text-[9px] 2xl:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiLock className="w-3.5 h-3.5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 py-2 2xl:py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#0B4A99]/20 focus:border-[#0B4A99] focus:bg-white transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center pt-0.5">
              <label className="flex items-center text-[11px] text-slate-500 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-350 text-[#0B4A99] focus:ring-[#0B4A99]/30 mr-2 transition-colors cursor-pointer accent-[#0B4A99]"
                />
                Remember me
              </label>
            </div>

            {/* Sign In Button (Text updated to ONLY "Sign In") */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B4A99] hover:bg-[#083A78] text-white py-2.5 2xl:py-3 rounded-xl font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
