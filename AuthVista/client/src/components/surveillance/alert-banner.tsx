import { useState, useEffect, memo } from 'react';
import { AlertTriangle, X, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'wouter';

interface Detection {
  id: string;
  camera_id: string;
  image_url: string;
  detected_objects: Array<{
    class: string;
    confidence: number;
  }>;
  detection_count: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface Camera {
  id: string;
  name: string;
  location: string;
}

interface AlertBannerProps {
  cameras: Camera[];
}

export const AlertBanner = memo(function AlertBanner({ cameras }: AlertBannerProps) {
  const [alerts, setAlerts] = useState<Detection[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Connect to WebSocket for real-time alerts
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      if (import.meta.env.DEV) {
        console.log('🔔 Alert system connected');
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle new detection alerts
        if (data.type === 'new_detection') {
          const detection = data.detection as Detection;
          
          // Only show high and critical alerts
          if (detection.threat_level === 'high' || detection.threat_level === 'critical') {
            setAlerts(prev => [detection, ...prev].slice(0, 5)); // Keep last 5 alerts
            
            // Play alert sound for critical threats
            if (detection.threat_level === 'critical') {
              playAlertSound();
            }
            
            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🚨 Critical Wildlife Alert', {
                body: `${detection.threat_level.toUpperCase()} threat detected with ${detection.detection_count} objects`,
                icon: '/favicon.ico',
              });
            }
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Alert parsing error:', err);
        }
      }
    };

    ws.onerror = (error) => {
      if (import.meta.env.DEV) {
        console.error('WebSocket error:', error);
      }
    };

    ws.onclose = () => {
      if (import.meta.env.DEV) {
        console.log('🔌 Alert system disconnected');
      }
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      ws.close();
    };
  }, []);

  const playAlertSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      // Silently fail - audio playback is non-critical
      if (import.meta.env.DEV) {
        console.error('Audio playback error:', err);
      }
    }
  };

  const handleDismiss = (alertId: string) => {
    setDismissed(prev => {
      const newSet = new Set(prev);
      newSet.add(alertId);
      return newSet;
    });
  };

  const visibleAlerts = alerts.filter(alert => !dismissed.has(alert.id));

  if (visibleAlerts.length === 0) {
    return null;
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 border-red-700';
      case 'high': return 'bg-orange-500 border-orange-600';
      default: return 'bg-yellow-500 border-yellow-600';
    }
  };

  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      default: return '⚡';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {visibleAlerts.map((alert) => {
        const camera = cameras.find(c => c.id === alert.camera_id);
        const weaponDetected = alert.detected_objects.some(obj => obj.class === 'weapon');
        
        return (
          <Card 
            key={alert.id} 
            className={`${getThreatColor(alert.threat_level)} border-2 text-white shadow-2xl animate-in slide-in-from-right`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getThreatIcon(alert.threat_level)}</span>
                  <div>
                    <h3 className="font-bold text-lg">
                      {alert.threat_level === 'critical' ? 'CRITICAL ALERT' : 'HIGH PRIORITY ALERT'}
                    </h3>
                    <p className="text-sm opacity-90">
                      {weaponDetected ? '🔫 Weapon detected' : `${alert.detection_count} objects detected`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={() => handleDismiss(alert.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 mb-3 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{camera?.name || 'Unknown Camera'} - {camera?.location || 'Unknown Location'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {alert.detected_objects.slice(0, 3).map((obj, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="bg-white/20 text-white border-white/30 text-xs"
                  >
                    {obj.class} ({(obj.confidence * 100).toFixed(0)}%)
                  </Badge>
                ))}
                {alert.detected_objects.length > 3 && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    +{alert.detected_objects.length - 3} more
                  </Badge>
                )}
              </div>

              {alert.threat_level === 'critical' && (
                <div className="mb-3 p-2 bg-white/20 rounded text-sm">
                  <strong>⚠️ IMMEDIATE ACTION REQUIRED</strong>
                  <p className="text-xs mt-1 opacity-90">
                    Weapon identified. Dispatch rangers immediately.
                  </p>
                </div>
              )}

              <Link href={`/surveillance/detection/${alert.id}`}>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full bg-white text-gray-900 hover:bg-gray-100"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
});
