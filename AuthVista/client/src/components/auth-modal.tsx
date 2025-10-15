import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { setAuthToken } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { TreePine, Leaf, Sparkles } from 'lucide-react';
import { ForestBackground, ForestParticles } from './ui/forest-background';
import styles from './auth-modal.module.css';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  token: string;
}

export function AuthModal() {
  const { toast } = useToast();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'local' as 'local' | 'department',
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      // Backend expects form data (OAuth2PasswordRequestForm)
      const formData = new FormData();
      formData.append('username', data.email); // Use email as username
      formData.append('password', data.password);
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || error.message || 'Login failed');
      }

      const tokenData = await res.json();
      
      // Get user info with the token
      const userRes = await fetch('/api/auth/me', {
        headers: { 
          'Authorization': `Bearer ${tokenData.access_token}` 
        },
      });
      
      const user = await userRes.json();
      
      return { 
        token: tokenData.access_token, 
        user 
      } as AuthResponse;
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.invalidateQueries();
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      // Redirect to dashboard/home page instead of reloading
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof registerData) => {
      // Transform frontend data to backend schema
      // Map frontend role values to backend enum values
      const roleMapping: { [key: string]: string } = {
        'local': 'local',
        'department': 'ranger'  // Map 'department' to 'ranger' enum value
      };
      
      const payload = {
        email: data.email,
        username: data.email.split('@')[0], // Use email prefix as username
        password: data.password,
        full_name: `${data.firstName} ${data.lastName}`.trim(),
        role: roleMapping[data.role] || 'viewer'  // Use mapped value
      };
      
      // Debug log removed for security (prevented password logging)
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(error.detail || error.message || 'Registration failed');
      }

      return res.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.invalidateQueries();
      toast({
        title: 'Account created!',
        description: 'Welcome to Tadoba Smart Conservation.',
      });
      // Redirect to dashboard/home page instead of reloading
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  return (
    <ForestBackground>
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <ForestParticles />
        
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px] relative"
        >
          {/* Glassmorphic wrapper matching Dan Aleko's design */}
          <div className="relative backdrop-blur-[15px] bg-white/10 border-2 border-white/20 rounded-xl p-10 shadow-2xl">
            {/* Decorative forest glow effects */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-xl blur-xl opacity-50 -z-10" />
            
            <Tabs defaultValue="login" className="w-full">
              {/* Tab Triggers */}
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5 p-1 rounded-lg">
                <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <motion.form 
                  onSubmit={handleLogin} 
                  className="space-y-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {/* Logo & Title */}
                  <div className="text-center mb-8">
                    <motion.div
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      className="flex justify-center mb-4"
                    >
                      <div className="relative">
                        <TreePine className="h-14 w-14 text-white drop-shadow-2xl" strokeWidth={1.8} />
                        <Leaf className="absolute -top-2 -right-2 h-5 w-5 text-secondary animate-pulse" />
                        <Sparkles className={`absolute -bottom-1 -left-2 h-4 w-4 text-white/80 animate-pulse ${styles.sparklesDelayed}`} />
                      </div>
                    </motion.div>
                    <h1 className="text-4xl font-bold text-white mb-1 font-poppins">Login</h1>
                    <p className="text-white/70 text-sm">Enter your credentials to continue</p>
                  </div>

                  {/* Username Input */}
                  <div className="relative w-full h-[50px] mb-7">
                    <Input
                      id="login-email"
                      type="text"
                      placeholder="Email or Username"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="w-full h-full bg-transparent border-2 border-white/20 rounded-[40px] text-base text-white px-5 pr-12 placeholder:text-white/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all"
                      required
                    />
                    <i className="absolute right-5 top-1/2 -translate-y-1/2 text-white text-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                    </i>
                  </div>

                  {/* Password Input */}
                  <div className="relative w-full h-[50px] mb-5">
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full h-full bg-transparent border-2 border-white/20 rounded-[40px] text-base text-white px-5 pr-12 placeholder:text-white/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all"
                      required
                    />
                    <i className="absolute right-5 top-1/2 -translate-y-1/2 text-white text-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    </i>
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex justify-between items-center text-sm mb-5 -mt-2">
                    <label className="flex items-center gap-2 text-white/90 cursor-pointer hover:text-white transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-white border-white/30 rounded cursor-pointer"
                      />
                      <span>Remember Me</span>
                    </label>
                    <a href="#" className="text-white/90 hover:text-white hover:underline transition-all">
                      Forgot Password?
                    </a>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-white hover:bg-white/95 text-gray-800 font-semibold text-base rounded-[40px] shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] border-none"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="h-4 w-4" />
                        </motion.div>
                        Logging in...
                      </span>
                    ) : (
                      'Login'
                    )}
                  </Button>

                  {/* Register Link */}
                  <div className="text-center mt-5 text-sm text-white/90">
                    <p>
                      Don't have an account?{' '}
                      <button 
                        type="button"
                        onClick={() => {
                          const registerTab = document.querySelector('[value="register"]') as HTMLButtonElement;
                          registerTab?.click();
                        }}
                        className="text-white font-semibold hover:underline cursor-pointer bg-transparent p-0 h-auto border-0"
                      >
                        Register
                      </button>
                    </p>
                  </div>

                  {/* Demo Credentials */}
                  <div className="text-center text-xs text-white/60 mt-4 pt-4 border-t border-white/10">
                    <p className="font-medium mb-1">Demo Credentials:</p>
                    <p>admin@tadoba.com / admin123</p>
                  </div>
                </motion.form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <motion.form 
                  onSubmit={handleRegister} 
                  className="space-y-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Logo & Title */}
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="flex justify-center mb-3"
                    >
                      <Leaf className="h-12 w-12 text-white drop-shadow-2xl" strokeWidth={1.8} />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-white mb-1 font-poppins">Register</h1>
                    <p className="text-white/70 text-sm">Join the conservation effort</p>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="relative w-full h-[50px]">
                      <Input
                        id="register-firstName"
                        placeholder="First Name"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        className="w-full h-full bg-transparent border-2 border-white/20 rounded-[40px] text-sm text-white px-4 placeholder:text-white/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                    <div className="relative w-full h-[50px]">
                      <Input
                        id="register-lastName"
                        placeholder="Last Name"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        className="w-full h-full bg-transparent border-2 border-white/20 rounded-[40px] text-sm text-white px-4 placeholder:text-white/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="relative w-full h-[50px] mb-5">
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Email Address"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="w-full h-full bg-transparent border-2 border-white/20 rounded-[40px] text-base text-white px-5 pr-12 placeholder:text-white/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all"
                      required
                    />
                    <i className="absolute right-5 top-1/2 -translate-y-1/2 text-white text-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                    </i>
                  </div>

                  {/* Password Input */}
                  <div className="relative w-full h-[50px] mb-5">
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="w-full h-full bg-transparent border-2 border-white/20 rounded-[40px] text-base text-white px-5 pr-12 placeholder:text-white/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all"
                      required
                    />
                    <i className="absolute right-5 top-1/2 -translate-y-1/2 text-white text-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    </i>
                  </div>

                  {/* Account Type */}
                  <div className="relative w-full h-[50px] mb-5">
                    <select
                      id="register-role"
                      className="w-full h-full bg-transparent border-2 border-white/20 rounded-[40px] text-base text-white px-5 pr-12 focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
                      value={registerData.role}
                      onChange={(e) => setRegisterData({ ...registerData, role: e.target.value as 'local' | 'department' })}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")` }}
                      className={`w-full h-full bg-transparent border-2 border-white/20 rounded-[40px] text-base text-white px-5 pr-12 focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer ${styles.selectCustom}`}
                    >
                      <option value="local" className="bg-gray-800 text-white">Local Resident</option>
                      <option value="department" className="bg-gray-800 text-white">Forest Department</option>
                    </select>
                  </div>

                  {/* Register Button */}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-white hover:bg-white/95 text-gray-800 font-semibold text-base rounded-[40px] shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] border-none"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="h-4 w-4" />
                        </motion.div>
                        Creating account...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </Button>

                  {/* Login Link */}
                  <div className="text-center mt-5 text-sm text-white/90">
                    <p>
                      Already have an account?{' '}
                      <button 
                        type="button"
                        onClick={() => {
                          const loginTab = document.querySelector('[value="login"]') as HTMLButtonElement;
                          loginTab?.click();
                        }}
                        className="text-white font-semibold hover:underline cursor-pointer bg-transparent p-0 h-auto border-0"
                      >
                        Login
                      </button>
                    </p>
                  </div>
                </motion.form>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-center mt-6 text-sm text-white/70 drop-shadow-lg"
          >
            <p className="flex items-center justify-center gap-2">
              <TreePine className="h-4 w-4" />
              Powered by Nature • Protected by Technology
              <Leaf className="h-4 w-4" />
            </p>
          </motion.div>
        </motion.div>
      </div>
    </ForestBackground>
  );
}
