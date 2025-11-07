import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, KeyRound, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [passwordResetToken, setPasswordResetToken] = useState<string>('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axiosInstance.post('/api/auth/forgot-password', { email });
      setStep('otp');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/verify-otp', { email, otp });
      setPasswordResetToken(response.data.passwordResetToken);
      setStep('password');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    if (!passwordResetToken) {
      toast({
        title: 'Error',
        description: 'Invalid reset token. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await axiosInstance.post('/api/auth/reset-password', {
        passwordResetToken,
        newPassword,
      });
      toast({
        title: 'Success',
        description: 'Password has been reset successfully.',
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 relative auth-bg" style={{ backgroundImage: `url('/images/bus-greenery.avif')` }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-lg bg-primary`}>
              {step === 'password' ? (
                <KeyRound className="h-8 w-8 text-primary-foreground" />
              ) : (
                <Mail className="h-8 w-8 text-primary-foreground" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {step === 'email' && "Reset Your Password"}
            {step === 'otp' && "Check Your Email"}
            {step === 'password' && "Set New Password"}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'email' && "Enter your email to receive a password reset code"}
            {step === 'otp' && "We've sent a verification code to your email"}
            {step === 'password' && "Create a new password for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Code
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <>
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary font-bold">The verification code will expire in 15 minutes.</span><br />
                  If you don't see the email, please check your spam folder.
                </p>
              </div>
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter verification code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify Code
                </Button>
              </form>
            </>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Reset Password
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            className="text-sm text-muted-foreground flex items-center gap-2"
            onClick={() => navigate('/login')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;