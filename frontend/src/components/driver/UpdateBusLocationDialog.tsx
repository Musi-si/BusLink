import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { axiosInstance } from '@/lib/axios';
import { Loader2 } from 'lucide-react';

interface UpdateBusLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busNumber?: string;
  initialLat?: number;
  initialLng?: number;
  initialSpeed?: number;
  onSuccess?: () => void;
}

export function UpdateBusLocationDialog({
  open,
  onOpenChange,
  busNumber,
  initialLat,
  initialLng,
  initialSpeed,
  onSuccess,
}: UpdateBusLocationDialogProps) {
  const [lat, setLat] = useState(initialLat?.toString() ?? '');
  const [lng, setLng] = useState(initialLng?.toString() ?? '');
  const [speed, setSpeed] = useState(initialSpeed?.toString() ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLat(initialLat?.toString() ?? '');
    setLng(initialLng?.toString() ?? '');
    setSpeed(initialSpeed?.toString() ?? '');
  }, [initialLat, initialLng, initialSpeed, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!busNumber) {
      toast({ title: 'No bus selected', description: 'Cannot update location without a bus number', variant: 'destructive' });
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const speedNum = parseFloat(speed);

    if (Number.isNaN(latNum) || Number.isNaN(lngNum) || Number.isNaN(speedNum)) {
      toast({ title: 'Invalid input', description: 'Please enter valid numeric values', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.patch('/api/driver/update-location', {
        bus_number: busNumber,
        current_lat: latNum,
        current_lng: lngNum,
        speed_kmh: speedNum,
      });

      toast({ title: 'Location updated', description: 'Bus location and speed updated successfully' });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to update location', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Bus Location</DialogTitle>
          <DialogDescription>Manually update the bus current location and speed. Useful for testing or manual corrections.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bus">Bus Number</Label>
            <Input id="bus" value={busNumber ?? ''} readOnly />
          </div>

          <div>
            <Label htmlFor="lat">Latitude</Label>
            <Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="lng">Longitude</Label>
            <Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="speed">Speed (km/h)</Label>
            <Input id="speed" value={speed} onChange={(e) => setSpeed(e.target.value)} required />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
