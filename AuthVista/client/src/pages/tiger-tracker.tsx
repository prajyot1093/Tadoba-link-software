import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PawPrint, Calendar, MapPin, Users } from "lucide-react";
import type { Animal } from "@shared/schema";

export default function TigerTracker() {
  const { data: animals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals"],
  });

  const tigers = animals.filter(a => a.species === 'tiger');

  // Build family tree structure
  const rootTigers = tigers.filter(t => !t.parentId);
  
  const getChildren = (parentId: string) => {
    return tigers.filter(t => t.parentId === parentId);
  };

  const TigerCard = ({ tiger, level = 0 }: { tiger: Animal; level?: number }) => {
    const children = getChildren(tiger.id);
    
    return (
      <div className={`${level > 0 ? 'ml-12 mt-4' : ''}`}>
        <Card 
          className="bg-card/50 backdrop-blur-sm border-card-border hover-elevate overflow-hidden"
          data-testid={`tiger-card-${tiger.id}`}
        >
          <div className="flex">
            <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-orange/20 flex items-center justify-center shrink-0">
              <PawPrint className="w-16 h-16 text-primary/40" />
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{tiger.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{tiger.gender} • {tiger.age} years</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  tiger.status === 'active' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {tiger.status}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                {tiger.identificationMarks && (
                  <p className="text-muted-foreground line-clamp-2">{tiger.identificationMarks}</p>
                )}
                {tiger.lastSeenLocation && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{tiger.lastSeenLocation}</span>
                  </div>
                )}
                {tiger.lastSeenAt && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Last seen: {new Date(tiger.lastSeenAt).toLocaleDateString()}</span>
                  </div>
                )}
                {children.length > 0 && (
                  <div className="flex items-center gap-2 text-primary font-medium mt-2">
                    <Users className="w-3 h-3" />
                    <span>{children.length} offspring</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
        
        {/* Render children */}
        {children.length > 0 && (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            {children.map((child) => (
              <TigerCard key={child.id} tiger={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tiger Family Bloodlines</h1>
        <p className="text-muted-foreground mt-1">Explore tiger families and their heritage in Tadoba</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Tigers</CardTitle>
            <PawPrint className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground" data-testid="stat-total-tigers">
              {isLoading ? "..." : tigers.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Active</CardTitle>
            <PawPrint className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {tigers.filter(t => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Families</CardTitle>
            <Users className="w-4 h-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {rootTigers.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Cubs</CardTitle>
            <PawPrint className="w-4 h-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {tigers.filter(t => (t.age || 0) < 3).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Family Trees */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tiger data...</div>
      ) : tigers.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <PawPrint className="w-20 h-20 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-foreground">No Tiger Data Available</p>
            <p className="text-sm text-muted-foreground">Check back later for updates from the forest department</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {rootTigers.map((tiger) => (
            <TigerCard key={tiger.id} tiger={tiger} />
          ))}
        </div>
      )}
    </div>
  );
}
