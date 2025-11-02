import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ui/theme-toggle'
import { Card, CardContent } from '@/components/ui/card'
import { Bus, MapPin, Clock, Shield, Users, TrendingUp } from 'lucide-react'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Bus className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">BusLink</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="container relative py-24 md:py-32 space-y-8 bg-cover bg-center"
        style={{ backgroundImage: `url('/images/auth-bg.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/40" aria-hidden />
          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                  Track Your Bus in{' '}
                  <span className="text-primary">Real-Time</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Never miss your bus again. BusLink provides live tracking, accurate ETAs, and seamless booking for your daily commute.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                  <Button size="lg" asChild>
                    <Link to="/tracking">Start Tracking</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/register">Create Account</Link>
                  </Button>
                </div>
              </div>

              {/* right-side image removed to use full-section background */}
            </div>
          </div>
        
      </section>

      {/* Features Section */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Why Choose BusLink?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the future of public transportation with our cutting-edge features
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg w-fit">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Real-Time Tracking</h3>
              <p className="text-muted-foreground">
                See exactly where your bus is on the map with live GPS tracking updated every second.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg w-fit">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Accurate ETAs</h3>
              <p className="text-muted-foreground">
                Get precise arrival times for every stop along your route, so you can plan accordingly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg w-fit">
                <Bus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Easy Booking</h3>
              <p className="text-muted-foreground">
                Reserve your seat in advance and travel with confidence knowing your spot is secured.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg w-fit">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Safe & Secure</h3>
              <p className="text-muted-foreground">
                Your data is protected with enterprise-grade security and encrypted connections.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg w-fit">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Community Driven</h3>
              <p className="text-muted-foreground">
                Join thousands of commuters who trust BusLink for their daily transportation needs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg w-fit">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Always Improving</h3>
              <p className="text-muted-foreground">
                We continuously update our platform with new features based on user feedback.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Us Section */}
      <section className="container py-20 space-y-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">About BusLink</h2>
            <p className="text-xl text-muted-foreground">
              Revolutionizing public transportation through technology
            </p>
          </div>

          <div className="space-y-6 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              BusLink was founded with a simple mission: to make public transportation more accessible, 
              reliable, and user-friendly for everyone. We believe that commuting shouldn't be a source 
              of stress or uncertainty.
            </p>

            <p className="text-lg leading-relaxed">
              Our platform combines cutting-edge GPS technology, real-time data processing, and an 
              intuitive user interface to give you complete visibility into your bus network. Whether 
              you're a daily commuter, an occasional rider, or a bus driver, BusLink is designed to 
              make your journey smoother.
            </p>

            <p className="text-lg leading-relaxed">
              We're committed to sustainability and reducing traffic congestion by making public 
              transportation a more attractive option. By providing accurate, real-time information, 
              we help more people choose buses over private vehicles, contributing to cleaner, 
              less congested cities.
            </p>

            <div className="grid md:grid-cols-3 gap-8 pt-8">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">10K+</div>
                <div className="text-sm">Active Users</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">500+</div>
                <div className="text-sm">Buses Tracked</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">50+</div>
                <div className="text-sm">Routes Covered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-16 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Start Tracking?</h2>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Join thousands of commuters who have made their daily travel stress-free with BusLink.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register">Create Free Account</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-tranysparent border-primary-foreground text-primary-foreground"
                asChild
              >
                <Link to="/tracking">View Live Map</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Bus className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">BusLink</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 BusLink. Making public transportation better for everyone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
