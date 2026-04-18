import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      // Navigate to dashboard on successful login
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://static.prod-images.emergentagent.com/jobs/fde3d48c-be5b-4199-b96b-dea8c84ae1e7/images/58d5c869f4c40a2669e77490d79f9691dcfcdc13c3c650429978918e2f2dc2bf.png"
          alt="GMC Platform"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0055FF]/20 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h1 className="text-4xl font-black font-['Chivo'] tracking-tight mb-2">
            GMC Platform
          </h1>
          <p className="text-white/80 text-lg">
            Streamline your Group Medical Coverage data processing
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-12 h-12 bg-[#0055FF] rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <h1 className="text-2xl font-black font-['Chivo']">GMC Platform</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold font-['Chivo'] tracking-tight text-zinc-900">
              Welcome back
            </h2>
            <p className="text-zinc-500 mt-2">
              Sign in to continue to your dashboard
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-md flex items-start gap-3" data-testid="login-error">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                  data-testid="login-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-[#0055FF] hover:underline"
                  data-testid="forgot-password-link"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  required
                  data-testid="login-password-input"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-[#0055FF] hover:bg-[#0040CC] text-white font-medium"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? (
                <div className="spinner w-5 h-5 border-white border-t-transparent" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-zinc-500">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="text-[#0055FF] font-medium hover:underline"
              data-testid="register-link"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
