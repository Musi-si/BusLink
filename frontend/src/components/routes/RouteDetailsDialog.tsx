import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type Props = {
  open: boolean;
  onClose: () => void;
  route: any | null;
};

export const RouteDetailsDialog: React.FC<Props> = ({ open, onClose, route }) => {
  if (!route) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{route.name || 'Route Details'}</DialogTitle>
        </DialogHeader>

        <Card className="p-4 mb-4">
          <div className="space-y-3 text-sm">
            <div>
              <strong>ID:</strong> <span>{route.id}</span>
            </div>
            <div>
              <strong>Stops:</strong> <span>{route.stopsCount ?? 'N/A'}</span>
            </div>
            <div>
              <strong>Active buses:</strong> <span>{route.activeBusesCount ?? 0}</span>
            </div>
            <div>
              <strong>Distance:</strong> <span>{route.distanceKm ?? 'N/A'} km</span>
            </div>
            <div>
              <strong>Estimated duration:</strong> <span>{route.estimatedDurationMinutes ?? 'N/A'} min</span>
            </div>
            <div>
              <strong>Fare:</strong> <span>{route.fareAmount ?? 'N/A'}</span>
            </div>
          </div>
        </Card>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RouteDetailsDialog;
