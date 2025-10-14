import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, MapPin, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AddCameraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CameraFormData {
  name: string;
  location: string;
  latitude: string;
  longitude: string;
  status: 'active' | 'inactive' | 'maintenance';
  zone: string;
}

export function AddCameraModal({ open, onOpenChange }: AddCameraModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CameraFormData>({
    name: '',
    location: '',
    latitude: '',
    longitude: '',
    status: 'active',
    zone: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CameraFormData, string>>>({});

  const createCameraMutation = useMutation({
    mutationFn: async (data: CameraFormData) => {
      const res = await fetch('/api/surveillance/cameras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: data.name,
          location: data.location,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          status: data.status,
          zone: data.zone || undefined,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create camera');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveillance-cameras'] });
      toast({
        title: '✅ Camera Added Successfully',
        description: 'The new surveillance camera is now online and monitoring.',
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Failed to Add Camera',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CameraFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Camera name is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.latitude) {
      newErrors.latitude = 'Latitude is required';
    } else if (isNaN(parseFloat(formData.latitude)) || parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (!formData.longitude) {
      newErrors.longitude = 'Longitude is required';
    } else if (isNaN(parseFloat(formData.longitude)) || parseFloat(formData.longitude) < -180 || parseFloat(formData.longitude) > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createCameraMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      location: '',
      latitude: '',
      longitude: '',
      status: 'active',
      zone: '',
    });
    setErrors({});
    onOpenChange(false);
  };

  // Preset locations in Tadoba
  const presetLocations = [
    { name: 'Tadoba Lake Viewpoint', lat: '20.2347', lng: '79.3291', zone: 'Core Zone' },
    { name: 'Kolsa Gate Area', lat: '20.2156', lng: '79.3450', zone: 'Buffer Zone' },
    { name: 'Moharli Gate', lat: '20.1889', lng: '79.3123', zone: 'Core Zone' },
    { name: 'Navegaon Gate', lat: '20.2511', lng: '79.3678', zone: 'Buffer Zone' },
    { name: 'Agarzari Gate', lat: '20.1734', lng: '79.2890', zone: 'Core Zone' },
  ];

  const handlePresetSelect = (preset: typeof presetLocations[0]) => {
    setFormData({
      ...formData,
      location: preset.name,
      latitude: preset.lat,
      longitude: preset.lng,
      zone: preset.zone,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Add Surveillance Camera
          </DialogTitle>
          <DialogDescription>
            Register a new camera in the wildlife conservation monitoring network.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Locations */}
          <div className="space-y-2">
            <Label>Quick Location Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {presetLocations.slice(0, 4).map((preset) => (
                <Button
                  key={preset.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => handlePresetSelect(preset)}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {preset.name.split(' ')[0]}
                </Button>
              ))}
            </div>
          </div>

          {/* Camera Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Camera Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Camera-North-Gate-01"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Location Description <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              placeholder="e.g., Main entrance near Tadoba Lake"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location}</p>
            )}
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">
                Latitude <span className="text-red-500">*</span>
              </Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="20.2347"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className={errors.latitude ? 'border-red-500' : ''}
              />
              {errors.latitude && (
                <p className="text-sm text-red-500">{errors.latitude}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">
                Longitude <span className="text-red-500">*</span>
              </Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="79.3291"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className={errors.longitude ? 'border-red-500' : ''}
              />
              {errors.longitude && (
                <p className="text-sm text-red-500">{errors.longitude}</p>
              )}
            </div>
          </div>

          {/* Zone */}
          <div className="space-y-2">
            <Label htmlFor="zone">Conservation Zone (Optional)</Label>
            <Input
              id="zone"
              placeholder="e.g., Core Zone, Buffer Zone"
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive' | 'maintenance') =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">🟢 Active</SelectItem>
                <SelectItem value="inactive">⚫ Inactive</SelectItem>
                <SelectItem value="maintenance">🟡 Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCameraMutation.isPending}>
              {createCameraMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Camera
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
