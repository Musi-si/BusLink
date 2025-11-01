import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { axiosInstance } from '@/lib/axios';
import { Loader2 } from 'lucide-react';

interface AddBusProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddBusDialog({ open, onOpenChange, onSuccess }: AddBusProps) {
  const [formData, setFormData] = useState({
    plateNumber: '',
    model: '',
    capacity: '',
    driver: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      await axiosInstance.post('/api/admin/buses', {
        ...formData,
        capacity: parseInt(formData.capacity),
      });

      toast({
        title: 'Bus added',
        description: 'New bus has been added successfully',
      });
      onSuccess(); // Refresh the buses list
      onOpenChange(false);
      setFormData({ plateNumber: '', model: '', capacity: '', driver: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add bus',
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
          <DialogTitle>Add New Bus</DialogTitle>
          <DialogDescription>
            Add a new bus to the fleet. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="plateNumber">Plate Number</Label>
            <Input
              id="plateNumber"
              value={formData.plateNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, plateNumber: e.target.value }))}
              placeholder="UAX 123A"
              required
            />
          </div>

          <div>
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="Toyota Coaster"
              required
            />
          </div>

          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              min="1"
              required
            />
          </div>

          <div>
            <Label htmlFor="driver">Driver ID</Label>
            <Input
              id="driver"
              value={formData.driver}
              onChange={(e) => setFormData(prev => ({ ...prev, driver: e.target.value }))}
              placeholder="Driver's ID number"
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
              Add Bus
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}