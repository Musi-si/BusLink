import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { axiosInstance } from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Bus, Loader2 } from 'lucide-react'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { toast } = useToast()
  const location = useLocation()

  // If the user arrived with a verification token (from the email link), call
  // the backend verify endpoint and show a success toast. Then remove the
  // query param so the action isn't repeated on refresh.
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const verifyToken = params.get('verifyToken') || params.get('token')
    if (!verifyToken) return

    (async () => {
      try {
        // Using responseType 'text' because the endpoint returns HTML on success.
        const resp = await axiosInstance.get('/api/auth/verify', { params: { token: verifyToken }, responseType: 'text' })
        if (resp.status === 200) {
          toast({ title: 'Email verified', description: 'Your email was verified successfully. You can now log in.' })
        } else {
          toast({ title: 'Verification', description: 'Email verification completed.', variant: 'destructive' })
        }
      } catch (err: any) {
        // Backend returns HTML on error too show a generic message.
        toast({ title: 'Verification failed', description: err?.response?.data || 'Verification link is invalid or expired', variant: 'destructive' })
      } finally {
        // Remove query param to avoid repeated verification attempts on refresh
        navigate('/login', { replace: true })
      }
    })()
  }, [location.search, navigate, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Attempting login...')
      const response = await axiosInstance.post('/api/auth/login', {
        email,
        password,
      })

      console.log('Login response:', response.data)
      const { token, user } = response.data
      
      console.log('User role:', user.role)
      console.log('Setting auth state...')
      setAuth(user, token)

      // Show success message immediately
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${user.name} (${user.role})`,
      })

      console.log('Redirecting to dashboard...')
      // Redirect based on role
      switch (user.role) {
        case 'driver':
          console.log('-> Driver dashboard')
          navigate('/driver/dashboard', { replace: true })
          break
        case 'admin':
          console.log('-> Admin dashboard')
          navigate('/dashboard/admin', { replace: true })
          break
        case 'passenger':
          console.log('-> Passenger dashboard')
          navigate('/dashboard/passenger', { replace: true })
          break
        default:
          console.error('Unknown role:', user.role)
          navigate('/', { replace: true })
      }
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.response?.data?.message || 'Invalid credentials',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
  <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 relative auth-bg" style={{ backgroundImage: `url('/images/bus-greenery.avif')` }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary rounded-lg">
              <Bus className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome to BusLink</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default LoginPage
