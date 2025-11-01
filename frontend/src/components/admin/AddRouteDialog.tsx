import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { axiosInstance } from '@/lib/axios';
import { Loader2 } from 'lucide-react';

interface AddRouteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddRouteDialog({ open, onOpenChange, onSuccess }: AddRouteProps) {
  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    destination: '',
    distance: '',
    estimatedDuration: '',
    fare: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      await axiosInstance.post('/api/admin/routes', {
        ...formData,
        distance: parseFloat(formData.distance),
        estimatedDuration: parseInt(formData.estimatedDuration),
        fare: parseFloat(formData.fare),
      });

      toast({
        title: 'Route added',
        description: 'New route has been added successfully',
      });
      onSuccess(); // Refresh the routes list
      onOpenChange(false);
      setFormData({
        name: '',
        origin: '',
        destination: '',
        distance: '',
        estimatedDuration: '',
        fare: '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add route',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Route</DialogTitle>
          <DialogDescription>
            Add a new bus route. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Route Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Express Route 1"
              required
            />
          </div>

          <div>
            <Label htmlFor="origin">Origin</Label>
            <Input
              id="origin"
              value={formData.origin}
              onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
              placeholder="Starting point"
              required
            />
          </div>

          <div>
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
              placeholder="End point"
              required
            />
          </div>

          <div>
            <Label htmlFor="distance">Distance (km)</Label>
            <Input
              id="distance"
              type="number"
              step="0.1"
              value={formData.distance}
              onChange={(e) => setFormData(prev => ({ ...prev, distance: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
            <Input
              id="estimatedDuration"
              type="number"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="fare">Fare (UGX)</Label>
            <Input
              id="fare"
              type="number"
              step="100"
              value={formData.fare}
              onChange={(e) => setFormData(prev => ({ ...prev, fare: e.target.value }))}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Route
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}