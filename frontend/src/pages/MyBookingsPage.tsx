import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/lib/axios'
import { Booking } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Calendar, MapPin, Users, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'

const MyBookingsPage = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const response = await axiosInstance.get<Booking[]>('/api/bookings/my')
      return response.data
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await axiosInstance.put(`/api/bookings/${bookingId}/cancel`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been cancelled successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Cancellation failed',
        description: 'Unable to cancel booking. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      case 'completed':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <p className="text-xl font-semibold mb-2">No bookings yet</p>
          <p className="text-muted-foreground mb-4">
            Start tracking buses and make your first booking
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Explore Routes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
      
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">
                    {booking.route?.route_name || 'Route'}
                  </h3>
                  <Badge variant={getStatusVariant(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bus {booking.bus?.bus_number || 'N/A'}
                </p>
              </div>
              {booking.status === 'pending' || booking.status === 'confirmed' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelMutation.mutate(booking.id)}
                  disabled={cancelMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Journey</p>
                  <p className="font-medium">
                    {booking.fromStop?.stop_name || 'Start'} →{' '}
                    {booking.toStop?.stop_name || 'End'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Travel Date</p>
                  <p className="font-medium">
                    {format(new Date(booking.travelDate), 'PPP')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">Seats</p>
                  <p className="font-medium">{booking.seatCount}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="h-4 w-4" />
                <div>
                  <p className="text-muted-foreground">Total Price</p>
                  <p className="font-bold text-primary">
                    ₦{booking.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
              Booked on {format(new Date(booking.createdAt), 'PPP p')}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default MyBookingsPage
