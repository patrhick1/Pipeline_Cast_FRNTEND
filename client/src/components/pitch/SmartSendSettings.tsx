import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Calendar, Settings, Info, Save, Check } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface SmartSendSettingsProps {
  campaignId: string;
  campaignName?: string;
}

interface SmartSendConfig {
  enabled: boolean;
  days: number[];
  start_time: string;
  end_time: string;
}

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  smart_send_enabled: boolean;
  smart_send_days: number[];
  smart_send_start_time: string;
  smart_send_end_time: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Mon", fullLabel: "Monday" },
  { value: 2, label: "Tue", fullLabel: "Tuesday" },
  { value: 3, label: "Wed", fullLabel: "Wednesday" },
  { value: 4, label: "Thu", fullLabel: "Thursday" },
  { value: 5, label: "Fri", fullLabel: "Friday" },
  { value: 6, label: "Sat", fullLabel: "Saturday" },
  { value: 0, label: "Sun", fullLabel: "Sunday" },
];

export function SmartSendSettings({ campaignId, campaignName }: SmartSendSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<SmartSendConfig>({
    enabled: false,
    days: [],
    start_time: "09:00",
    end_time: "17:00",
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<SmartSendConfig | null>(null);

  // Fetch campaign data to get current Smart Send settings
  const { data: campaign, isLoading, error } = useQuery<Campaign>({
    queryKey: ["/campaigns", campaignId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/campaigns/${campaignId}`);
      if (!response.ok) throw new Error("Failed to fetch campaign settings");
      return response.json();
    },
    enabled: !!campaignId,
  });

  // Update local state when campaign data is loaded
  useEffect(() => {
    if (campaign) {
      const loadedSettings: SmartSendConfig = {
        enabled: campaign.smart_send_enabled || false,
        days: campaign.smart_send_days || [],
        start_time: campaign.smart_send_start_time || "09:00",
        end_time: campaign.smart_send_end_time || "17:00",
      };
      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
      setHasUnsavedChanges(false);
    }
  }, [campaign]);

  // Save Smart Send settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (config: SmartSendConfig) => {
      const response = await apiRequest("PATCH", `/campaigns/${campaignId}/smart-send`, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to save Smart Send settings" }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data) => {
      const updatedSettings: SmartSendConfig = {
        enabled: data.smart_send_enabled,
        days: data.smart_send_days,
        start_time: data.smart_send_start_time,
        end_time: data.smart_send_end_time,
      };
      setSettings(updatedSettings);
      setOriginalSettings(updatedSettings);
      setHasUnsavedChanges(false);
      
      toast({
        title: "Settings Saved",
        description: "Smart Send settings have been updated successfully.",
      });
      
      // Invalidate the campaign query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/campaigns", campaignId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle toggle change
  const handleToggleChange = (checked: boolean) => {
    const newSettings = { ...settings, enabled: checked };
    setSettings(newSettings);
    checkForChanges(newSettings);
  };

  // Handle day selection
  const handleDayToggle = (dayValues: string[]) => {
    const days = dayValues.map(v => parseInt(v));
    const newSettings = { ...settings, days };
    setSettings(newSettings);
    checkForChanges(newSettings);
  };

  // Handle time changes
  const handleTimeChange = (field: "start_time" | "end_time", value: string) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    checkForChanges(newSettings);
  };

  // Check if there are unsaved changes
  const checkForChanges = (newSettings: SmartSendConfig) => {
    if (!originalSettings) {
      setHasUnsavedChanges(false);
      return;
    }
    
    const hasChanges = 
      newSettings.enabled !== originalSettings.enabled ||
      JSON.stringify(newSettings.days.sort()) !== JSON.stringify(originalSettings.days.sort()) ||
      newSettings.start_time !== originalSettings.start_time ||
      newSettings.end_time !== originalSettings.end_time;
    
    setHasUnsavedChanges(hasChanges);
  };

  // Handle save
  const handleSave = () => {
    if (!hasUnsavedChanges) return;
    
    // Validate settings
    if (settings.enabled && settings.days.length === 0) {
      toast({
        title: "Invalid Settings",
        description: "Please select at least one day when Smart Send is enabled.",
        variant: "destructive",
      });
      return;
    }
    
    saveSettingsMutation.mutate(settings);
  };

  // Format selected days for display
  const formatSelectedDays = () => {
    if (settings.days.length === 0) return "No days selected";
    if (settings.days.length === 7) return "Every day";
    
    const sortedDays = [...settings.days].sort((a, b) => {
      // Sort with Monday (1) first, Sunday (0) last
      const aOrder = a === 0 ? 7 : a;
      const bOrder = b === 0 ? 7 : b;
      return aOrder - bOrder;
    });
    
    const dayNames = sortedDays.map(day => 
      DAYS_OF_WEEK.find(d => d.value === day)?.fullLabel || ""
    );
    
    if (dayNames.length <= 2) {
      return dayNames.join(" and ");
    }
    
    return `${dayNames.slice(0, -1).join(", ")} and ${dayNames[dayNames.length - 1]}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load Smart Send settings. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Smart Send Configuration
            </CardTitle>
            <CardDescription className="mt-1">
              Automate pitch sending for {campaignName || "this campaign"}
            </CardDescription>
          </div>
          <Badge variant={settings.enabled ? "default" : "secondary"}>
            {settings.enabled ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="smart-send-toggle" className="text-base font-medium">
              Enable Smart Send
            </Label>
            <p className="text-sm text-gray-600">
              Automatically send approved pitches on schedule
            </p>
          </div>
          <Switch
            id="smart-send-toggle"
            checked={settings.enabled}
            onCheckedChange={handleToggleChange}
          />
        </div>

        {/* Settings Container - Only visible when enabled */}
        <div className={`space-y-4 transition-opacity ${!settings.enabled ? "opacity-50 pointer-events-none" : ""}`}>
          {/* Day Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Active Days
            </Label>
            <ToggleGroup
              type="multiple"
              value={settings.days.map(d => d.toString())}
              onValueChange={handleDayToggle}
              className="flex flex-wrap gap-2"
            >
              {DAYS_OF_WEEK.map((day) => (
                <ToggleGroupItem
                  key={day.value}
                  value={day.value.toString()}
                  aria-label={`Toggle ${day.fullLabel}`}
                  className="px-3 py-2"
                >
                  {day.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-xs text-gray-500">
              Selected: {formatSelectedDays()}
            </p>
          </div>

          {/* Time Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Sending Window (UTC)
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="start-time" className="text-xs text-gray-600">
                  Start Time
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={settings.start_time}
                  onChange={(e) => handleTimeChange("start_time", e.target.value)}
                  className="mt-1"
                />
              </div>
              <span className="text-gray-400 mt-6">to</span>
              <div className="flex-1">
                <Label htmlFor="end-time" className="text-xs text-gray-600">
                  End Time
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  value={settings.end_time}
                  onChange={(e) => handleTimeChange("end_time", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              All times are in UTC. Current UTC time: {new Date().toUTCString().split(" ")[4]}
            </p>
          </div>

          {/* Status Display */}
          {settings.enabled && settings.days.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Smart Send will automatically send approved pitches on{" "}
                <strong>{formatSelectedDays()}</strong> between{" "}
                <strong>{settings.start_time}</strong> and{" "}
                <strong>{settings.end_time}</strong> UTC.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saveSettingsMutation.isPending}
            className={hasUnsavedChanges ? "bg-primary" : ""}
          >
            {saveSettingsMutation.isPending ? (
              <>Saving...</>
            ) : hasUnsavedChanges ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Settings Saved
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}