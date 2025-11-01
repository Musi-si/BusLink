import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function EmailVerification() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 relative auth-bg" style={{ backgroundImage: `url('/images/bus-greenery.avif')` }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-600 rounded-lg">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We have sent you a verification link to complete your registration. Please check your inbox and spam folder.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            The verification link will expire in 15 minutes. If you don&apos;t see the email, please check your spam folder.
          </p>
          <p className="text-sm text-muted-foreground">
            You can close this window. After verifying your email, you&apos;ll be able to log in to your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}