import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { axiosInstance } from '@/lib/axios';
import { Loader2 } from 'lucide-react';

interface UpdatePhoneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdatePhoneDialog({ open, onOpenChange }: UpdatePhoneProps) {
  const { user, setAuth } = useAuthStore();
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.patch('/api/auth/update-phone', {
        phone,
      });

      // Update the auth store with the updated user data
      setAuth({ ...user!, ...response.data.user }, response.data.token);

      toast({
        title: 'Phone number updated',
        description: 'Your phone number has been updated successfully',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update phone number',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Phone Number</DialogTitle>
          <DialogDescription>
            Enter your new phone number. This will be used for important notifications and updates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 700 000 000"
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
              Update Phone
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}