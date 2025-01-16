import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const TIME_ZONES = Intl.supportedValuesOf('timeZone');

export function TimeZoneSettings() {
    const [timeZone, setTimeZone] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        // Fetch current timezone setting
        const fetchTimeZone = async () => {
            const response = await fetch('/api/settings/timezone');
            const data = await response.json();
            if (data.timeZone) {
                setTimeZone(data.timeZone);
            }
        };
        fetchTimeZone();
    }, []);

    useEffect(() => {
        // Auto-detect timezone on component mount if no timezone is set
        if (!timeZone) {
            fetch('https://worldtimeapi.org/api/ip')
                .then(response => response.json())
                .then(data => {
                    if (data.timezone) {
                        setTimeZone(data.timezone);
                        handleTimeZoneUpdate(data.timezone);
                    }
                })
                .catch(() => {
                    // Fallback to browser's timezone if API fails
                    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    setTimeZone(browserTimeZone);
                    handleTimeZoneUpdate(browserTimeZone);
                });
        }
    }, []);

    const handleTimeZoneUpdate = async (newTimeZone: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/settings/timezone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ timeZone: newTimeZone }),
            });

            if (!response.ok) throw new Error('Failed to update timezone');

            toast({
                title: "Time Zone Updated",
                description: "Your club's time zone has been successfully updated.",
            });
            setTimeZone(newTimeZone);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update time zone. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Time Zone Settings</CardTitle>
                <CardDescription>
                    Set your club's time zone for accurate event timing
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Select
                        value={timeZone}
                        onValueChange={handleTimeZoneUpdate}
                        disabled={loading}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select time zone" />
                        </SelectTrigger>
                        <SelectContent>
                            {TIME_ZONES.map((zone) => (
                                <SelectItem key={zone} value={zone}>
                                    {zone.replace(/_/g, ' ')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}