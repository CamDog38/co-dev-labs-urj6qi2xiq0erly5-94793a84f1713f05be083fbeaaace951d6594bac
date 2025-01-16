import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

interface Option {
  value: string;
  label: string;
}

const defaultEventTypes = [
  { value: "race", label: "Race" },
  { value: "training", label: "Training" },
  { value: "social", label: "Social Event" },
  { value: "maintenance", label: "Maintenance" },
];

const defaultBoatClasses = [
  { value: "laser", label: "Laser" },
  { value: "optimist", label: "Optimist" },
  { value: "420", label: "420" },
  { value: "49er", label: "49er" },
];

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  eventType: z.string().min(1, "Event type is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  startDate: z.date(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  endDate: z.date().optional(),
  isSeries: z.boolean().default(false),
  seriesDetails: z.object({
    frequency: z.string().optional(),
    numberOfEvents: z.string().optional(),
  }).optional(),
  boatClasses: z.array(z.string()).min(1, "At least one boat class is required"),
}).refine((data) => {
  // If endDate is not provided, it's valid (will use startDate)
  if (!data.endDate) return true;
  
  // If endDate is provided, it must be >= startDate
  if (data.endDate < data.startDate) return false;
  
  // If same day, check times
  if (data.endDate.getTime() === data.startDate.getTime()) {
    return data.endTime > data.startTime;
  }
  
  return true;
}, {
  message: "End date/time must be after start date/time",
  path: ["endTime"]
});

interface CreateEventFormProps {
  onSuccess?: () => void;
}

export function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const { toast } = useToast();
  const [isSeries, setIsSeries] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState<Option[]>(defaultEventTypes);
  const [boatClasses, setBoatClasses] = useState<Option[]>(defaultBoatClasses);
  const [locations, setLocations] = useState<Option[]>([]);
  const [newOptionType, setNewOptionType] = useState<string>("");
  const [newOptionValue, setNewOptionValue] = useState<string>("");
  const [isAddingOption, setIsAddingOption] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const types = await fetch('/api/options?type=eventType').then(res => res.json());
        const classes = await fetch('/api/options?type=boatClass').then(res => res.json());
        const locs = await fetch('/api/options?type=location').then(res => res.json());

        if (types.length) setEventTypes([...defaultEventTypes, ...types]);
        if (classes.length) setBoatClasses([...defaultBoatClasses, ...classes]);
        if (locs.length) setLocations(locs);
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };

    fetchOptions();
  }, []);

  const addNewOption = async () => {
    if (!newOptionValue || !newOptionType) {
      toast({
        title: "Error",
        description: "Please provide both type and value for the new option",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/options/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: newOptionType,
          value: newOptionValue.toLowerCase().trim(),
          label: newOptionValue.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add option');
      }

      const newOption = data;
      
      switch (newOptionType) {
        case 'eventType':
          setEventTypes(prev => [...prev, { value: newOption.value, label: newOption.label }]);
          form.setValue('eventType', newOption.value);
          break;
        case 'boatClass':
          setBoatClasses(prev => [...prev, { value: newOption.value, label: newOption.label }]);
          toggleBoatClass(newOption.value);
          break;
        case 'location':
          setLocations(prev => [...prev, { value: newOption.value, label: newOption.label }]);
          form.setValue('location', newOption.value);
          break;
      }

      setNewOptionValue('');
      setIsAddingOption(false);
      
      toast({
        title: "Success",
        description: "New option added successfully",
      });
    } catch (error) {
      console.error('Error adding option:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add new option",
        variant: "destructive",
      });
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      eventType: "",
      description: "",
      location: "",
      startTime: "09:00",
      endTime: "10:00",
      isSeries: false,
      boatClasses: [],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    form.reset({
      title: "",
      eventType: "",
      description: "",
      location: "",
      isSeries: false,
      boatClasses: [],
    });
    setSelectedClasses([]);
    setIsSeries(false);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create event");
      }

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      resetForm();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBoatClass = (className: string) => {
    const newSelectedClasses = selectedClasses.includes(className)
      ? selectedClasses.filter((c) => c !== className)
      : [...selectedClasses, className];
    
    setSelectedClasses(newSelectedClasses);
    form.setValue("boatClasses", newSelectedClasses);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter event title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <div className="flex gap-2">
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isAddingOption && newOptionType === 'eventType'} onOpenChange={(open) => {
                  setIsAddingOption(open);
                  setNewOptionType('eventType');
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Event Type</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Enter new event type"
                        value={newOptionValue}
                        onChange={(e) => setNewOptionValue(e.target.value)}
                      />
                      <Button onClick={addNewOption}>Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <div className="flex gap-2">
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select or add location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isAddingOption && newOptionType === 'location'} onOpenChange={(open) => {
                  setIsAddingOption(open);
                  setNewOptionType('location');
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Location</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Enter new location"
                        value={newOptionValue}
                        onChange={(e) => setNewOptionValue(e.target.value)}
                      />
                      <Button onClick={addNewOption}>Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        if (!form.getValues('startTime')) {
                          form.setValue('startTime', '09:00');
                          form.setValue('endTime', '10:00');
                        }
                      }}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue="09:00">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 32 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 6;
                      const minute = i % 2 === 0 ? '00' : '30';
                      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                      return (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Same as start date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < form.getValues('startDate')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue="10:00">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 32 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 6;
                      const minute = i % 2 === 0 ? '00' : '30';
                      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                      return (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={isSeries}
            onCheckedChange={(checked) => {
              setIsSeries(checked);
              form.setValue("isSeries", checked);
            }}
          />
          <Label>This is a series event</Label>
        </div>

        {isSeries && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="seriesDetails.frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Series Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seriesDetails.numberOfEvents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Events in Series</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of events"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Boat Classes</Label>
          <div className="flex flex-wrap gap-2">
            {boatClasses.map((boatClass) => (
              <Button
                key={boatClass.value}
                type="button"
                variant={selectedClasses.includes(boatClass.value) ? "default" : "outline"}
                onClick={() => toggleBoatClass(boatClass.value)}
              >
                {boatClass.label}
              </Button>
            ))}
            <Dialog open={isAddingOption && newOptionType === 'boatClass'} onOpenChange={(open) => {
              setIsAddingOption(open);
              setNewOptionType('boatClass');
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Boat Class</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter new boat class"
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                  />
                  <Button onClick={addNewOption}>Add</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <FormMessage>{form.formState.errors.boatClasses?.message}</FormMessage>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter event description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={resetForm}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
}