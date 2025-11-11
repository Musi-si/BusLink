import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { axiosInstance } from '@/lib/axios';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Calendar, Users, CreditCard, Ticket } from 'lucide-react';

interface BookingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId?: string;
}

interface BookingDetails {
  id: string;
  bookingReference: string;
  status: string;
  paymentStatus: string;
  travelDate: string;
  seatCount: number;
  totalFare: number;
  user: {
    id: string;
    name: string;
    phone?: string;
  };
  specialRequests?: string;
  route: {
    name: string;
    distanceKm?: number;
  };
  fromStop: {
    name: string;
  };
  toStop: {
    name: string;
  };
  bus: {
    busNumber: string;
    vehicleModel?: string;
  };
}

export function BookingDetailsDialog({ open, onOpenChange, bookingId }: BookingDetailsDialogProps) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && bookingId) {
      fetchBookingDetails();
    }
  }, [open, bookingId]);

  const fetchBookingDetails = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/api/bookings/${bookingId}`);
      console.log('Fetched booking details:', res.data.data);
      setBooking(res.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load booking details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    
    setIsCancelling(true);
    try {
      await axiosInstance.patch(`/api/bookings/${booking.id}/cancel`);
      toast({
        title: 'Success',
        description: 'Booking cancelled successfully',
      });
      onOpenChange(false);
      setBooking(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel booking',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>
            View and manage your booking information
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : booking ? (
          <div className="space-y-6">
            {/* Booking Reference & Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Booking Reference</span>
                </div>
              </div>
              <div className="font-mono text-sm font-semibold">{booking.bookingReference}</div>
              <div className="flex gap-2 mt-2">
                {/* <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge> */}
                <Badge className={getPaymentStatusColor(booking.paymentStatus)} style={{ paddingBottom: '4px' }}>
                  {booking.paymentStatus}
                </Badge>
              </div>
            </div>

            {/* Route Information */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Route</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Route Name</div>
                  <div className="text-sm font-medium">{booking.route.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">From</div>
                    <div className="text-sm font-medium">{booking.fromStop.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">To</div>
                    <div className="text-sm font-medium">{booking.toStop.name}</div>
                  </div>
                </div>
                {booking.route.distanceKm && (
                  <div>
                    <div className="text-xs text-muted-foreground">Distance</div>
                    <div className="text-sm font-medium">{booking.route.distanceKm} km</div>
                  </div>
                )}
              </div>
            </div>

            {/* Travel & Passenger Details */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Travel Details</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Travel Date</div>
                  <div className="text-sm font-medium">
                    {new Date(booking.travelDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Passenger Name</div>
                  <div className="text-sm font-medium">{booking.user.name || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone Number</div>
                  <div className="text-sm font-medium">{booking.user.phone || 'Not provided'}</div>
                </div>
              </div>
            </div>

            {/* Bus & Seat Details */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Bus & Seats</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Bus Number</div>
                  <div className="text-sm font-medium">{booking.bus.busNumber}</div>
                </div>
                {booking.bus.vehicleModel && (
                  <div>
                    <div className="text-xs text-muted-foreground">Vehicle Model</div>
                    <div className="text-sm font-medium">{booking.bus.vehicleModel}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground">Seats Booked</div>
                  <div className="text-sm font-medium">{booking.seatCount}</div>
                </div>
              </div>
            </div>

            {/* Fare Details */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Fare</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-lg font-bold text-primary">
                  {(booking.totalFare || 0).toLocaleString()} RWF
                </span>
              </div>
            </div>

            {/* Special Requests */}
            {booking.specialRequests && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Special Requests</div>
                <div className="text-sm bg-muted p-2 rounded">
                  {booking.specialRequests}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No booking details available</p>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {booking && booking.status?.toLowerCase() === 'pending' && (
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Booking'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
