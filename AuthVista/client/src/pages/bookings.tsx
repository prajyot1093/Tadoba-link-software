import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Truck, MapPin } from "lucide-react";
import { format } from "date-fns";
import type { SafariBooking } from "@shared/schema";

export default function Bookings() {
  const { data: bookings = [], isLoading } = useQuery<SafariBooking[]>({
    queryKey: ["/api/bookings/all"],
  });

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Safari Bookings</h1>
        <p className="text-muted-foreground mt-1">Manage all safari tour bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Bookings</CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground" data-testid="stat-total-bookings">
              {isLoading ? "..." : bookings.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Confirmed</CardTitle>
            <Calendar className="w-4 h-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {confirmedBookings.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Completed</CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {completedBookings.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Revenue</CardTitle>
            <Truck className="w-4 h-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No bookings yet
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-4 bg-background/50 rounded-lg hover-elevate"
                  data-testid={`booking-item-${booking.id}`}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(booking.date), "PPP")}
                      </p>
                      <div className={`px-2 py-1 rounded-full text-xs shrink-0 ${
                        booking.status === 'confirmed'
                          ? 'bg-primary/10 text-primary'
                          : booking.status === 'completed'
                          ? 'bg-orange/10 text-orange'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {booking.status}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {booking.numberOfPeople} people
                      </span>
                      <span className="flex items-center gap-1 capitalize">
                        <Truck className="w-3 h-3" />
                        {booking.vehicleType} • {booking.timeSlot}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Guide: {booking.guideName}
                      </span>
                      <span className="font-medium text-foreground">
                        ₹{booking.totalPrice}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
