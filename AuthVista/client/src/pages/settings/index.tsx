import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Camera, 
  Bell, 
  Shield, 
  Database, 
  Monitor,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from "lucide-react";

interface SystemSettings {
  id: string;
  category: string;
  key: string;
  value: string;
  dataType: string;
  description?: string;
}

interface CameraConfig {
  detectionConfidence: number;
  alertThreshold: string;
  refreshInterval: number;
  storageLimit: number;
}

interface NotificationConfig {
  enableSound: boolean;
  enableBrowser: boolean;
  criticalOnly: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
}

interface DisplayConfig {
  theme: string;
  mapZoom: number;
  gridColumns: string;
  showTimestamps: boolean;
  autoRefresh: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);

  // Camera & Detection Settings
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    detectionConfidence: 0.7,
    alertThreshold: "high",
    refreshInterval: 30,
    storageLimit: 1000
  });

  // Notification Settings
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    enableSound: true,
    enableBrowser: true,
    criticalOnly: false,
    quietHours: false,
    quietStart: "22:00",
    quietEnd: "06:00"
  });

  // Display Settings
  const [displayConfig, setDisplayConfig] = useState<DisplayConfig>({
    theme: "dark",
    mapZoom: 12,
    gridColumns: "3",
    showTimestamps: true,
    autoRefresh: true
  });

  // Fetch settings from backend
  const { data: settings, isLoading } = useQuery<SystemSettings[]>({
    queryKey: ["/api/settings"],
    refetchInterval: 60000
  });

  // Parse settings when data changes
  useEffect(() => {
    if (settings && !isLoading) {
      settings.forEach(setting => {
        if (setting.category === "camera") {
          setCameraConfig(prev => ({
            ...prev,
            [setting.key]: setting.dataType === "number" 
              ? parseFloat(setting.value) 
              : setting.value
          }));
        } else if (setting.category === "notifications") {
          setNotificationConfig(prev => ({
            ...prev,
            [setting.key]: setting.dataType === "boolean"
              ? setting.value === "true"
              : setting.value
          }));
        } else if (setting.category === "display") {
          setDisplayConfig(prev => ({
            ...prev,
            [setting.key]: setting.dataType === "number"
              ? parseFloat(setting.value)
              : setting.dataType === "boolean"
              ? setting.value === "true"
              : setting.value
          }));
        }
      });
    }
  }, [settings, isLoading]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<SystemSettings>[]) => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings })
      });
      if (!response.ok) throw new Error("Failed to save settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Reset to defaults
  const handleReset = () => {
    setCameraConfig({
      detectionConfidence: 0.7,
      alertThreshold: "high",
      refreshInterval: 30,
      storageLimit: 1000
    });
    setNotificationConfig({
      enableSound: true,
      enableBrowser: true,
      criticalOnly: false,
      quietHours: false,
      quietStart: "22:00",
      quietEnd: "06:00"
    });
    setDisplayConfig({
      theme: "dark",
      mapZoom: 12,
      gridColumns: "3",
      showTimestamps: true,
      autoRefresh: true
    });
    setHasChanges(true);
    toast({
      title: "Settings reset",
      description: "All settings have been reset to defaults.",
    });
  };

  // Save all settings
  const handleSave = () => {
    const allSettings: Partial<SystemSettings>[] = [
      // Camera settings
      { category: "camera", key: "detectionConfidence", value: cameraConfig.detectionConfidence.toString(), dataType: "number" },
      { category: "camera", key: "alertThreshold", value: cameraConfig.alertThreshold, dataType: "string" },
      { category: "camera", key: "refreshInterval", value: cameraConfig.refreshInterval.toString(), dataType: "number" },
      { category: "camera", key: "storageLimit", value: cameraConfig.storageLimit.toString(), dataType: "number" },
      // Notification settings
      { category: "notifications", key: "enableSound", value: notificationConfig.enableSound.toString(), dataType: "boolean" },
      { category: "notifications", key: "enableBrowser", value: notificationConfig.enableBrowser.toString(), dataType: "boolean" },
      { category: "notifications", key: "criticalOnly", value: notificationConfig.criticalOnly.toString(), dataType: "boolean" },
      { category: "notifications", key: "quietHours", value: notificationConfig.quietHours.toString(), dataType: "boolean" },
      { category: "notifications", key: "quietStart", value: notificationConfig.quietStart, dataType: "string" },
      { category: "notifications", key: "quietEnd", value: notificationConfig.quietEnd, dataType: "string" },
      // Display settings
      { category: "display", key: "theme", value: displayConfig.theme, dataType: "string" },
      { category: "display", key: "mapZoom", value: displayConfig.mapZoom.toString(), dataType: "number" },
      { category: "display", key: "gridColumns", value: displayConfig.gridColumns, dataType: "string" },
      { category: "display", key: "showTimestamps", value: displayConfig.showTimestamps.toString(), dataType: "boolean" },
      { category: "display", key: "autoRefresh", value: displayConfig.autoRefresh.toString(), dataType: "boolean" },
    ];

    saveSettingsMutation.mutate(allSettings);
  };

  // Generate demo data
  const handleGenerateDemo = async () => {
    setGeneratingDemo(true);
    try {
      const response = await fetch('/api/demo/generate', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to generate demo data');
      
      const result = await response.json();
      
      toast({
        title: "Demo data generated!",
        description: `Created ${result.stats.totalCameras} cameras and ${result.stats.totalDetections} detections`,
      });
      
      // Refresh page data
      queryClient.invalidateQueries({ queryKey: ["/api/surveillance/cameras"] });
      queryClient.invalidateQueries({ queryKey: ["/api/surveillance/detections"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate demo data",
        variant: "destructive"
      });
    } finally {
      setGeneratingDemo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Settings className="h-10 w-10 text-primary" />
                Settings & Configuration
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage system settings, camera parameters, and user preferences
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || saveSettingsMutation.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
          {hasChanges && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">You have unsaved changes</span>
            </div>
          )}
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="camera" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="camera" className="gap-2">
              <Camera className="h-4 w-4" />
              Camera & Detection
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="display" className="gap-2">
              <Monitor className="h-4 w-4" />
              Display
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Shield className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Camera & Detection Settings */}
          <TabsContent value="camera" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Detection Parameters
                </CardTitle>
                <CardDescription>
                  Configure YOLO detection model and alert thresholds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Confidence Threshold */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="confidence">
                      Detection Confidence Threshold
                    </Label>
                    <span className="text-sm font-medium">
                      {(cameraConfig.detectionConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    id="confidence"
                    min={0.5}
                    max={0.95}
                    step={0.05}
                    value={[cameraConfig.detectionConfidence]}
                    onValueChange={(value) => {
                      setCameraConfig(prev => ({ ...prev, detectionConfidence: value[0] }));
                      setHasChanges(true);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum confidence score (50-95%) for object detection. Higher values reduce false positives.
                  </p>
                </div>

                <Separator />

                {/* Alert Threshold */}
                <div className="space-y-3">
                  <Label htmlFor="alert-threshold">Alert Threshold Level</Label>
                  <Select
                    value={cameraConfig.alertThreshold}
                    onValueChange={(value) => {
                      setCameraConfig(prev => ({ ...prev, alertThreshold: value }));
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger id="alert-threshold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical Only (Weapons)</SelectItem>
                      <SelectItem value="high">High & Above (Weapons + Suspicious)</SelectItem>
                      <SelectItem value="medium">Medium & Above (Include People)</SelectItem>
                      <SelectItem value="low">All Detections</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Minimum threat level required to trigger visual and sound alerts
                  </p>
                </div>

                <Separator />

                {/* Refresh Interval */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="refresh">Camera Refresh Interval</Label>
                    <span className="text-sm font-medium">{cameraConfig.refreshInterval}s</span>
                  </div>
                  <Slider
                    id="refresh"
                    min={10}
                    max={300}
                    step={10}
                    value={[cameraConfig.refreshInterval]}
                    onValueChange={(value) => {
                      setCameraConfig(prev => ({ ...prev, refreshInterval: value[0] }));
                      setHasChanges(true);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    How often to check cameras for new detections (10-300 seconds)
                  </p>
                </div>

                <Separator />

                {/* Storage Limit */}
                <div className="space-y-3">
                  <Label htmlFor="storage">Maximum Stored Detections</Label>
                  <Input
                    id="storage"
                    type="number"
                    min={100}
                    max={10000}
                    value={cameraConfig.storageLimit}
                    onChange={(e) => {
                      setCameraConfig(prev => ({ ...prev, storageLimit: parseInt(e.target.value) }));
                      setHasChanges(true);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of detections to keep in database (100-10,000). Older records auto-deleted.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alert Notifications
                </CardTitle>
                <CardDescription>
                  Configure how you receive threat alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sound Alerts */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="sound">Sound Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Play audio notification for new threats
                    </p>
                  </div>
                  <Switch
                    id="sound"
                    checked={notificationConfig.enableSound}
                    onCheckedChange={(checked) => {
                      setNotificationConfig(prev => ({ ...prev, enableSound: checked }));
                      setHasChanges(true);
                    }}
                  />
                </div>

                <Separator />

                {/* Browser Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="browser">Browser Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Show desktop notifications (requires permission)
                    </p>
                  </div>
                  <Switch
                    id="browser"
                    checked={notificationConfig.enableBrowser}
                    onCheckedChange={(checked) => {
                      setNotificationConfig(prev => ({ ...prev, enableBrowser: checked }));
                      setHasChanges(true);
                    }}
                  />
                </div>

                <Separator />

                {/* Critical Only */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="critical">Critical Alerts Only</Label>
                    <p className="text-xs text-muted-foreground">
                      Only notify for weapon detections
                    </p>
                  </div>
                  <Switch
                    id="critical"
                    checked={notificationConfig.criticalOnly}
                    onCheckedChange={(checked) => {
                      setNotificationConfig(prev => ({ ...prev, criticalOnly: checked }));
                      setHasChanges(true);
                    }}
                  />
                </div>

                <Separator />

                {/* Quiet Hours */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="quiet">Quiet Hours</Label>
                      <p className="text-xs text-muted-foreground">
                        Disable notifications during specified hours
                      </p>
                    </div>
                    <Switch
                      id="quiet"
                      checked={notificationConfig.quietHours}
                      onCheckedChange={(checked) => {
                        setNotificationConfig(prev => ({ ...prev, quietHours: checked }));
                        setHasChanges(true);
                      }}
                    />
                  </div>

                  {notificationConfig.quietHours && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div className="space-y-2">
                        <Label htmlFor="quiet-start">Start Time</Label>
                        <Input
                          id="quiet-start"
                          type="time"
                          value={notificationConfig.quietStart}
                          onChange={(e) => {
                            setNotificationConfig(prev => ({ ...prev, quietStart: e.target.value }));
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quiet-end">End Time</Label>
                        <Input
                          id="quiet-end"
                          type="time"
                          value={notificationConfig.quietEnd}
                          onChange={(e) => {
                            setNotificationConfig(prev => ({ ...prev, quietEnd: e.target.value }));
                            setHasChanges(true);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Display Preferences
                </CardTitle>
                <CardDescription>
                  Customize the appearance and layout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div className="space-y-3">
                  <Label htmlFor="theme">Color Theme</Label>
                  <Select
                    value={displayConfig.theme}
                    onValueChange={(value) => {
                      setDisplayConfig(prev => ({ ...prev, theme: value }));
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Map Zoom */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="zoom">Default Map Zoom</Label>
                    <span className="text-sm font-medium">{displayConfig.mapZoom}x</span>
                  </div>
                  <Slider
                    id="zoom"
                    min={8}
                    max={16}
                    step={1}
                    value={[displayConfig.mapZoom]}
                    onValueChange={(value) => {
                      setDisplayConfig(prev => ({ ...prev, mapZoom: value[0] }));
                      setHasChanges(true);
                    }}
                  />
                </div>

                <Separator />

                {/* Grid Columns */}
                <div className="space-y-3">
                  <Label htmlFor="grid">Camera Grid Layout</Label>
                  <Select
                    value={displayConfig.gridColumns}
                    onValueChange={(value) => {
                      setDisplayConfig(prev => ({ ...prev, gridColumns: value }));
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger id="grid">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Columns</SelectItem>
                      <SelectItem value="3">3 Columns</SelectItem>
                      <SelectItem value="4">4 Columns</SelectItem>
                      <SelectItem value="5">5 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Show Timestamps */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="timestamps">Show Timestamps</Label>
                    <p className="text-xs text-muted-foreground">
                      Display detection times on cards
                    </p>
                  </div>
                  <Switch
                    id="timestamps"
                    checked={displayConfig.showTimestamps}
                    onCheckedChange={(checked) => {
                      setDisplayConfig(prev => ({ ...prev, showTimestamps: checked }));
                      setHasChanges(true);
                    }}
                  />
                </div>

                <Separator />

                {/* Auto Refresh */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-refresh">Auto Refresh Data</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically reload data periodically
                    </p>
                  </div>
                  <Switch
                    id="auto-refresh"
                    checked={displayConfig.autoRefresh}
                    onCheckedChange={(checked) => {
                      setDisplayConfig(prev => ({ ...prev, autoRefresh: checked }));
                      setHasChanges(true);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Information
                </CardTitle>
                <CardDescription>
                  Current system status and diagnostics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Database Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Connected</span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Active Cameras</span>
                    </div>
                    <span className="text-2xl font-bold">0</span>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Total Detections</span>
                    </div>
                    <span className="text-2xl font-bold">0</span>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Storage Used</span>
                    </div>
                    <span className="text-sm text-muted-foreground">0 MB / {cameraConfig.storageLimit} items</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">System Version</h3>
                  <p className="text-sm text-muted-foreground">
                    Tadoba Conservation System v1.0.0
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Last Updated</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-blue-500 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Demo Data Generator
                </CardTitle>
                <CardDescription>
                  Generate realistic demo data for hackathon presentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-blue-500/20 rounded-lg bg-blue-500/5">
                  <div>
                    <p className="font-medium">Generate Demo Surveillance Data</p>
                    <p className="text-xs text-muted-foreground">
                      Creates 12 cameras and 100+ detections across Tadoba with realistic threat levels
                    </p>
                  </div>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleGenerateDemo}
                    disabled={generatingDemo}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {generatingDemo ? "Generating..." : "Generate Data"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions - use with caution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                  <div>
                    <p className="font-medium">Clear All Detection History</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete all detection records
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Clear History
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                  <div>
                    <p className="font-medium">Reset All Settings</p>
                    <p className="text-xs text-muted-foreground">
                      Restore factory default configuration
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleReset}>
                    Factory Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
