import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Send, Users, Bell, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

interface DeviceToken {
  id: number;
  userId: string;
  deviceToken: string;
  platform: "android" | "ios";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationResponse {
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors: string[];
  message?: string;
}

interface DeviceResponse {
  success: boolean;
  deviceToken?: DeviceToken;
}

export default function FCMManagement() {
  const { toast } = useToast();
  const [deviceToken, setDeviceToken] = useState("");
  const [platform, setPlatform] = useState<"android" | "ios">("android");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [isBroadcast, setIsBroadcast] = useState(false);

  // Fetch device tokens
  const { data: deviceTokens, isLoading: tokensLoading } = useQuery({
    queryKey: ["device-tokens"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/devices");
      return response.json() as Promise<DeviceToken[]>;
    },
  });

  // Register device token mutation
  const registerDeviceMutation = useMutation({
    mutationFn: async (data: { deviceToken: string; platform: "android" | "ios" }) => {
      const response = await apiRequest("POST", "/api/devices/register", data);
      return response.json() as Promise<DeviceResponse>;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Device Registered",
          description: "Device token has been registered successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["device-tokens"] });
        setDeviceToken("");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register device token.",
        variant: "destructive",
      });
    },
  });

  // Unregister device token mutation
  const unregisterDeviceMutation = useMutation({
    mutationFn: async (deviceToken: string) => {
      const response = await apiRequest("POST", "/api/devices/unregister", { deviceToken });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Device Unregistered",
        description: "Device token has been unregistered successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["device-tokens"] });
    },
    onError: (error: any) => {
      toast({
        title: "Unregistration Failed",
        description: error.message || "Failed to unregister device token.",
        variant: "destructive",
      });
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      body: string;
      userId?: string | null;
      data?: Record<string, string>;
    }) => {
      const response = await apiRequest("POST", "/api/notifications/send", data);
      return response.json() as Promise<NotificationResponse>;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Notification Sent",
          description: `Successfully sent to ${data.sentCount} device(s).${data.failedCount > 0 ? ` ${data.failedCount} failed.` : ""}`,
        });
        setNotificationTitle("");
        setNotificationBody("");
        setTargetUserId("");
        setIsBroadcast(false);
      } else {
        toast({
          title: "Send Failed",
          description: data.message || "Failed to send notification.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send notification.",
        variant: "destructive",
      });
    },
  });

  const handleRegisterDevice = () => {
    if (!deviceToken.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a device token.",
        variant: "destructive",
      });
      return;
    }
    registerDeviceMutation.mutate({ deviceToken: deviceToken.trim(), platform });
  };

  const handleUnregisterDevice = (token: string) => {
    unregisterDeviceMutation.mutate(token);
  };

  const handleSendNotification = () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both title and body for the notification.",
        variant: "destructive",
      });
      return;
    }

    sendNotificationMutation.mutate({
      title: notificationTitle.trim(),
      body: notificationBody.trim(),
      userId: isBroadcast ? null : (targetUserId.trim() || null),
      data: {
        action: "custom_notification",
        timestamp: new Date().toISOString(),
      },
    });
  };

  const activeTokens = deviceTokens?.filter(token => token.isActive) || [];
  const inactiveTokens = deviceTokens?.filter(token => !token.isActive) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-6 w-6" />
        <h1 className="text-3xl font-bold">FCM Management</h1>
      </div>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Device Management
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Register Device Token
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceToken">Device Token</Label>
                  <Input
                    id="deviceToken"
                    placeholder="Enter FCM device token"
                    value={deviceToken}
                    onChange={(e) => setDeviceToken(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={platform} onValueChange={(value: "android" | "ios") => setPlatform(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="android">Android</SelectItem>
                      <SelectItem value="ios">iOS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleRegisterDevice}
                disabled={registerDeviceMutation.isPending}
                className="w-full md:w-auto"
              >
                {registerDeviceMutation.isPending ? "Registering..." : "Register Device"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Registered Devices ({activeTokens.length} active, {inactiveTokens.length} inactive)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tokensLoading ? (
                <div className="text-center py-4">Loading devices...</div>
              ) : deviceTokens && deviceTokens.length > 0 ? (
                <div className="space-y-4">
                  {activeTokens.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Active Devices
                      </h4>
                      <div className="space-y-2">
                        {activeTokens.map((token) => (
                          <div key={token.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{token.platform}</Badge>
                                <span className="font-mono text-sm text-gray-600 truncate">
                                  {token.deviceToken}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Registered: {new Date(token.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnregisterDevice(token.deviceToken)}
                              disabled={unregisterDeviceMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {inactiveTokens.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Inactive Devices
                        </h4>
                        <div className="space-y-2">
                          {inactiveTokens.map((token) => (
                            <div key={token.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{token.platform}</Badge>
                                  <span className="font-mono text-sm text-gray-600 truncate">
                                    {token.deviceToken}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Last updated: {new Date(token.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No devices registered yet. Register a device token above to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Admin Only:</strong> Only administrators can send notifications.
              Make sure your account has admin privileges.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Push Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Notification Title</Label>
                <Input
                  id="title"
                  placeholder="Enter notification title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Notification Body</Label>
                <Textarea
                  id="body"
                  placeholder="Enter notification message"
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Target</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="broadcast"
                    checked={isBroadcast}
                    onChange={(e) => setIsBroadcast(e.target.checked)}
                  />
                  <Label htmlFor="broadcast" className="text-sm">
                    Broadcast to all users
                  </Label>
                </div>
              </div>

              {!isBroadcast && (
                <div className="space-y-2">
                  <Label htmlFor="userId">Target User ID (optional)</Label>
                  <Input
                    id="userId"
                    placeholder="Leave empty to send to current user"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                  />
                </div>
              )}

              <Button
                onClick={handleSendNotification}
                disabled={sendNotificationMutation.isPending}
                className="w-full md:w-auto"
              >
                {sendNotificationMutation.isPending ? "Sending..." : "Send Notification"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{activeTokens.length}</div>
                  <div className="text-sm text-gray-600">Active Devices</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {sendNotificationMutation.data?.sentCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Last Send Success</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {sendNotificationMutation.data?.failedCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Last Send Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}