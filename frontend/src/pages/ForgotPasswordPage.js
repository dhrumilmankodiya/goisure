import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await forgotPassword(email);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-zinc-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-zinc-200 p-8">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-6"
            data-testid="back-to-login"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-bold font-['Chivo'] tracking-tight text-zinc-900">
              Forgot password?
            </h2>
            <p className="text-zinc-500 mt-2">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {success ? (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-md flex items-start gap-3" data-testid="success-message">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-700">Check your email</p>
                <p className="text-sm text-emerald-600 mt-1">
                  If an account exists with {email}, you'll receive a password reset link.
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-md flex items-start gap-3" data-testid="error-message">
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
                      data-testid="forgot-email-input"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#0055FF] hover:bg-[#0040CC] text-white font-medium"
                  disabled={loading}
                  data-testid="forgot-submit-button"
                >
                  {loading ? (
                    <div className="spinner w-5 h-5 border-white border-t-transparent" />
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
