import { useState, memo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Camera, Loader2, X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface UploadImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CameraOption {
  id: string;
  name: string;
  location: string;
}

interface DetectionResult {
  id: string;
  camera_id: string;
  image_url: string;
  detected_objects: Array<{
    class: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
  detection_count: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export const UploadImageModal = memo(function UploadImageModal({ open, onOpenChange }: UploadImageModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

  // Fetch cameras
  const { data: cameras = [] } = useQuery<CameraOption[]>({
    queryKey: ['surveillance-cameras'],
    queryFn: async () => {
      const res = await fetch('/api/surveillance/cameras', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch cameras');
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, cameraId }: { file: File; cameraId: string }) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('camera_id', cameraId);

      const res = await fetch('/api/surveillance/process-frame', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to process image');
      }
      return res.json();
    },
    onSuccess: (data: DetectionResult) => {
      setDetectionResult(data);
      queryClient.invalidateQueries({ queryKey: ['surveillance-detections'] });
      
      const threatEmoji = {
        critical: '🚨',
        high: '⚠️',
        medium: '⚡',
        low: '✅',
      }[data.threat_level];

      toast({
        title: `${threatEmoji} Detection Complete`,
        description: `Found ${data.detection_count} objects with ${data.threat_level.toUpperCase()} threat level`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Processing Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: '❌ Invalid File',
          description: 'Please select an image file (JPG, PNG, etc.)',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: '❌ File Too Large',
          description: 'Image must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast({
        title: '❌ No Image Selected',
        description: 'Please select an image to process',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCamera) {
      toast({
        title: '❌ No Camera Selected',
        description: 'Please select a camera',
        variant: 'destructive',
      });
      return;
    }

    uploadMutation.mutate({ file: selectedFile, cameraId: selectedCamera });
  };

  const handleClose = () => {
    setSelectedCamera('');
    setSelectedFile(null);
    setPreviewUrl('');
    setDetectionResult(null);
    onOpenChange(false);
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload & Process Image
          </DialogTitle>
          <DialogDescription>
            Upload camera footage for AI-powered YOLO detection analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Selection */}
          <div className="space-y-2">
            <Label htmlFor="camera">
              Select Camera <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedCamera} onValueChange={setSelectedCamera}>
              <SelectTrigger id="camera">
                <SelectValue placeholder="Choose a camera..." />
              </SelectTrigger>
              <SelectContent>
                {cameras.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id}>
                    📹 {camera.name} - {camera.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-1">Click to upload image</p>
                <p className="text-sm text-gray-500">JPG, PNG, WebP (max 10MB)</p>
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Image Preview */}
              <div className="relative border rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-contain bg-gray-50"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl('');
                    setDetectionResult(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* File Info */}
              <div className="text-sm text-gray-600">
                <strong>File:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </div>

              {/* Detection Results */}
              {detectionResult && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">🎯 Detection Results</h4>
                    <Badge className={getThreatColor(detectionResult.threat_level)}>
                      {detectionResult.threat_level.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <strong>Objects Detected:</strong> {detectionResult.detection_count}
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {new Date(detectionResult.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Detected Objects */}
                  <div>
                    <strong className="text-sm">Detected Objects:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {detectionResult.detected_objects.map((obj, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {obj.class} ({(obj.confidence * 100).toFixed(0)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Critical Alert */}
                  {detectionResult.threat_level === 'critical' && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-800">
                        <strong>CRITICAL THREAT DETECTED!</strong>
                        <p className="mt-1">Weapon identified in camera footage. Immediate ranger dispatch recommended.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {detectionResult ? 'Close' : 'Cancel'}
          </Button>
          {!detectionResult && (
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || !selectedCamera || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Process Image
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
