import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Calendar, Save, Check, Zap, Info, AlertTriangle } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getUserTimezone, utcTimeToLocal, localTimeToUTC } from "@/lib/timezone";

interface GlobalSmartSendConfig {
  days: number[];
  start_time: string;
  end_time: string;
  timezone: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Mon", fullLabel: "Monday" },
  { value: 1, label: "Tue", fullLabel: "Tuesday" },
  { value: 2, label: "Wed", fullLabel: "Wednesday" },
  { value: 3, label: "Thu", fullLabel: "Thursday" },
  { value: 4, label: "Fri", fullLabel: "Friday" },
  { value: 5, label: "Sat", fullLabel: "Saturday" },
  { value: 6, label: "Sun", fullLabel: "Sunday" },
];

export function AdminSmartSendSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<GlobalSmartSendConfig>({
    days: [0, 1, 2, 3, 4], // Mon-Fri default
    start_time: "09:00",
    end_time: "17:00",
    timezone: "UTC",
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<GlobalSmartSendConfig | null>(null);

  // Fetch global smart send settings
  const { data: globalSettings, isLoading, error } = useQuery<GlobalSmartSendConfig>({
    queryKey: ["/admin/settings/smart-send-global-schedule"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/admin/settings/smart-send-global-schedule");
      if (!response.ok) {
        // If settings don't exist yet, use defaults
        if (response.status === 404) {
          return {
            days: [0, 1, 2, 3, 4],
            start_time: "09:00",
            end_time: "17:00",
            timezone: "UTC",
          };
        }
        throw new Error("Failed to fetch global smart send settings");
      }
      return response.json();
    },
  });

  // Update local state when global settings are loaded
  useEffect(() => {
    if (globalSettings) {
      const loadedSettings: GlobalSmartSendConfig = {
        days: globalSettings.days || [0, 1, 2, 3, 4],
        // Convert UTC times from backend to local timezone for display
        start_time: utcTimeToLocal(globalSettings.start_time) || "09:00",
        end_time: utcTimeToLocal(globalSettings.end_time) || "17:00",
        timezone: globalSettings.timezone || "UTC",
      };
      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
      setHasUnsavedChanges(false);
    }
  }, [globalSettings]);

  // Save global smart send settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (config: GlobalSmartSendConfig) => {
      const response = await apiRequest("PATCH", "/admin/settings/smart-send-global-schedule", config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to save global smart send settings" }));
        throw new Error(errorData.detail);
      }
      return response.json();
    },
    onSuccess: (data) => {
      const updatedSettings: GlobalSmartSendConfig = {
        days: data.days,
        // Convert UTC times from backend to local timezone for display
        start_time: utcTimeToLocal(data.start_time),
        end_time: utcTimeToLocal(data.end_time),
        timezone: data.timezone,
      };
      setSettings(updatedSettings);
      setOriginalSettings(updatedSettings);
      setHasUnsavedChanges(false);

      toast({
        title: "Settings Saved",
        description: "Global Smart Send schedule has been updated successfully. This applies to all Premium (DFY) campaigns.",
      });

      // Invalidate the query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/admin/settings/smart-send-global-schedule"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
  const checkForChanges = (newSettings: GlobalSmartSendConfig) => {
    if (!originalSettings) {
      setHasUnsavedChanges(false);
      return;
    }

    const hasChanges =
      JSON.stringify(newSettings.days.sort()) !== JSON.stringify(originalSettings.days.sort()) ||
      newSettings.start_time !== originalSettings.start_time ||
      newSettings.end_time !== originalSettings.end_time;

    setHasUnsavedChanges(hasChanges);
  };

  // Handle save
  const handleSave = () => {
    if (!hasUnsavedChanges) return;

    // Validate settings
    if (settings.days.length === 0) {
      toast({
        title: "Invalid Settings",
        description: "Please select at least one day for the global schedule.",
        variant: "destructive",
      });
      return;
    }

    // Convert local times to UTC before sending to backend
    const settingsForBackend: GlobalSmartSendConfig = {
      ...settings,
      start_time: localTimeToUTC(settings.start_time),
      end_time: localTimeToUTC(settings.end_time),
    };

    saveSettingsMutation.mutate(settingsForBackend);
  };

  // Format selected days for display
  const formatSelectedDays = () => {
    if (settings.days.length === 0) return "No days selected";
    if (settings.days.length === 7) return "Every day";

    const sortedDays = [...settings.days].sort((a, b) => a - b);

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
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load global smart send settings. You may not have permission to access this feature.
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
              <Zap className="h-5 w-5 text-yellow-500" />
              Global Smart Send Schedule
            </CardTitle>
            <CardDescription className="mt-1">
              Configure automated sending schedule for all Premium (DFY) client campaigns
            </CardDescription>
          </div>
          <Badge variant="default">Admin Only</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Important Notice */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> This schedule applies globally to all Premium (Done For You) campaigns.
            Premium clients cannot modify this schedule - it is managed by the admin team.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
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
              Sending Window
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
              Times are in your local timezone ({getUserTimezone()}). Current time: {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Status Display */}
          {settings.days.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Premium campaigns will automatically send approved pitches on{" "}
                <strong>{formatSelectedDays()}</strong> between{" "}
                <strong>{settings.start_time}</strong> and{" "}
                <strong>{settings.end_time}</strong> in your local timezone ({getUserTimezone()}).
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
                Save Global Schedule
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
