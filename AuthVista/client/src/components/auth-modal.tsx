import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { setAuthToken } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { TreePine, Leaf, Sparkles } from 'lucide-react';
import { ForestBackground, ForestParticles } from './ui/forest-background';

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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
      }

      return res.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.invalidateQueries();
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      window.location.reload();
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Registration failed');
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
      window.location.reload();
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <ForestParticles />
        
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="glass-card-strong border-primary/30 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
            
            <CardHeader className="text-center space-y-4 relative">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="flex justify-center"
              >
                <div className="relative">
                  <TreePine className="h-16 w-16 text-primary drop-shadow-lg" strokeWidth={1.5} />
                  <Leaf className="absolute -top-2 -right-2 h-6 w-6 text-secondary animate-pulse" />
                  <Sparkles className="absolute -bottom-1 -left-1 h-4 w-4 text-primary/70 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
              </motion.div>
              
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent font-quicksand">
                  Tadoba Conservation
                </CardTitle>
                <CardDescription className="text-muted-foreground/90 flex items-center justify-center gap-2">
                  <Leaf className="h-4 w-4 text-primary/60" />
                  <span>Protecting Wildlife, One Step at a Time</span>
                  <Leaf className="h-4 w-4 text-primary/60" />
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 glass-card p-1">
                  <TabsTrigger 
                    value="login"
                    className="data-[state=active]:glass-button data-[state=active]:forest-glow transition-all"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register"
                    className="data-[state=active]:glass-button data-[state=active]:forest-glow transition-all"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <motion.form 
                    onSubmit={handleLogin} 
                    className="space-y-5 mt-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-foreground/90 font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="ranger@tadoba.forest"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="glass-input h-11 font-medium"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-foreground/90 font-medium">
                        Password
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="glass-input h-11 font-medium"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full glass-button h-11 text-base font-semibold"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="h-4 w-4" />
                          </motion.div>
                          Logging in...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <TreePine className="h-4 w-4" />
                          Enter Forest
                        </span>
                      )}
                    </Button>
                    
                    {/* Demo Credentials */}
                    <div className="text-center text-sm text-muted-foreground/70 pt-2 space-y-1">
                      <p className="font-medium">Demo Credentials:</p>
                      <p className="text-xs">admin@tadoba.com / admin123</p>
                    </div>
                  </motion.form>
                </TabsContent>

                <TabsContent value="register">
                  <motion.form 
                    onSubmit={handleRegister} 
                    className="space-y-4 mt-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-firstName" className="text-foreground/90 font-medium">
                          First Name
                        </Label>
                        <Input
                          id="register-firstName"
                          placeholder="John"
                          value={registerData.firstName}
                          onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                          className="glass-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-lastName" className="text-foreground/90 font-medium">
                          Last Name
                        </Label>
                        <Input
                          id="register-lastName"
                          placeholder="Doe"
                          value={registerData.lastName}
                          onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                          className="glass-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-foreground/90 font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="ranger@tadoba.forest"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="glass-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-foreground/90 font-medium">
                        Password
                      </Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="glass-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-role" className="text-foreground/90 font-medium">
                        Account Type
                      </Label>
                      <select
                        id="register-role"
                        className="w-full glass-input h-11"
                        value={registerData.role}
                        onChange={(e) => setRegisterData({ ...registerData, role: e.target.value as 'local' | 'department' })}
                      >
                        <option value="local">Local Resident</option>
                        <option value="department">Forest Department</option>
                      </select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full glass-button h-11 text-base font-semibold"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="h-4 w-4" />
                          </motion.div>
                          Creating account...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Leaf className="h-4 w-4" />
                          Join the Conservation
                        </span>
                      )}
                    </Button>
                  </motion.form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-center mt-6 text-sm text-muted-foreground/60"
          >
            <p>🌳 Powered by Nature • Protected by Technology 🌳</p>
          </motion.div>
        </motion.div>
      </div>
    </ForestBackground>
  );
}
