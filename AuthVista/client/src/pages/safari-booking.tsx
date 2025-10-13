import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users, Truck, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SafariBooking, InsertSafariBooking } from "@shared/schema";

export default function SafariBooking() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState<Partial<InsertSafariBooking>>({
    vehicleType: 'jeep',
    timeSlot: 'morning',
    numberOfPeople: 1,
  });

  const { data: bookings = [] } = useQuery<SafariBooking[]>({
    queryKey: ["/api/bookings/my"],
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: InsertSafariBooking) => {
      return await apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({
        title: "Booking Confirmed!",
        description: "Your safari tour has been booked successfully",
      });
      // Reset form
      setDate(undefined);
      setFormData({ vehicleType: 'jeep', timeSlot: 'morning', numberOfPeople: 1 });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !formData.guideName || !formData.numberOfPeople) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const price = formData.vehicleType === 'jeep' ? 2500 : 3500;
    const totalPrice = price * (formData.numberOfPeople || 1);

    bookingMutation.mutate({
      ...formData,
      date,
      totalPrice,
    } as InsertSafariBooking);
  };

  const guides = [
    { name: "Ramesh Kulkarni", experience: "15 years" },
    { name: "Suresh Patil", experience: "12 years" },
    { name: "Vijay Deshmukh", experience: "10 years" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Safari Booking</h1>
        <p className="text-muted-foreground mt-1">Book your wildlife adventure in Tadoba</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Booking Form */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Book Your Safari</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="button-select-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Time Slot *</Label>
                  <Select
                    value={formData.timeSlot}
                    onValueChange={(value) => setFormData({ ...formData, timeSlot: value })}
                  >
                    <SelectTrigger id="timeSlot" data-testid="select-time-slot">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Morning (6:00 AM - 10:00 AM)
                        </div>
                      </SelectItem>
                      <SelectItem value="evening">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Evening (3:00 PM - 6:00 PM)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle Type *</Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                  >
                    <SelectTrigger id="vehicle" data-testid="select-vehicle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jeep">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          Jeep (₹2,500/person)
                        </div>
                      </SelectItem>
                      <SelectItem value="canter">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          Canter (₹3,500/person)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="people">Number of People *</Label>
                  <Input
                    id="people"
                    type="number"
                    min="1"
                    max="6"
                    value={formData.numberOfPeople}
                    onChange={(e) => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) })}
                    data-testid="input-num-people"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="guide">Select Guide *</Label>
                  <Select
                    value={formData.guideName}
                    onValueChange={(value) => setFormData({ ...formData, guideName: value })}
                  >
                    <SelectTrigger id="guide" data-testid="select-guide">
                      <SelectValue placeholder="Choose your guide" />
                    </SelectTrigger>
                    <SelectContent>
                      {guides.map((guide) => (
                        <SelectItem key={guide.name} value={guide.name}>
                          {guide.name} ({guide.experience} experience)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.vehicleType && formData.numberOfPeople && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{(formData.vehicleType === 'jeep' ? 2500 : 3500) * formData.numberOfPeople}
                    </span>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-orange" 
                disabled={bookingMutation.isPending}
                data-testid="button-confirm-booking"
              >
                {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Your Bookings */}
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Your Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings yet
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-3 bg-background/50 rounded-lg space-y-2"
                    data-testid={`booking-${booking.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {format(new Date(booking.date), "PPP")}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {booking.timeSlot} • {booking.vehicleType}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === 'confirmed'
                          ? 'bg-primary/10 text-primary'
                          : booking.status === 'completed'
                          ? 'bg-orange/10 text-orange'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {booking.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {booking.numberOfPeople}
                      </span>
                      <span>₹{booking.totalPrice}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <CheckCircle2 className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold text-foreground">Expert Guides</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Experienced naturalists with deep knowledge of Tadoba wildlife
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange/10 to-orange/5 border-orange/20">
          <CardContent className="p-4">
            <CheckCircle2 className="w-8 h-8 text-orange mb-2" />
            <h3 className="font-semibold text-foreground">Safe & Secure</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Well-maintained vehicles with all safety equipment included
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <CheckCircle2 className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold text-foreground">Best Timing</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Morning & evening slots when wildlife is most active
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
