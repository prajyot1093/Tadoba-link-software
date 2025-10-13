import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PawPrint, Plus, MapPin, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Animal, InsertAnimal } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

export default function Animals() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertAnimal>>({
    species: 'tiger',
    status: 'active',
  });

  const { data: animals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAnimal) => {
      return await apiRequest("POST", "/api/animals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      toast({
        title: "Success",
        description: "Animal data added successfully",
      });
      setOpen(false);
      setFormData({ species: 'tiger', status: 'active' });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.species) {
      toast({
        title: "Validation Error",
        description: "Name and species are required",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData as InsertAnimal);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Animal Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage wildlife data</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary" data-testid="button-add-new-animal">
              <Plus className="w-4 h-4 mr-2" />
              Add New Animal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Animal Data</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Animal Name *</Label>
                  <Input
                    id="name"
                    data-testid="input-animal-name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Raja"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="species">Species *</Label>
                  <Select
                    value={formData.species}
                    onValueChange={(value) => setFormData({ ...formData, species: value })}
                  >
                    <SelectTrigger id="species" data-testid="select-species">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiger">Tiger</SelectItem>
                      <SelectItem value="leopard">Leopard</SelectItem>
                      <SelectItem value="sloth bear">Sloth Bear</SelectItem>
                      <SelectItem value="wild dog">Wild Dog</SelectItem>
                      <SelectItem value="deer">Deer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age (years)</Label>
                  <Input
                    id="age"
                    type="number"
                    data-testid="input-age"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender || ''}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger id="gender" data-testid="select-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="marks">Identification Marks</Label>
                <Textarea
                  id="marks"
                  data-testid="input-marks"
                  value={formData.identificationMarks || ''}
                  onChange={(e) => setFormData({ ...formData, identificationMarks: e.target.value })}
                  placeholder="Describe unique markings, stripes, or features"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Last Seen Location</Label>
                  <Input
                    id="location"
                    data-testid="input-location"
                    value={formData.lastSeenLocation || ''}
                    onChange={(e) => setFormData({ ...formData, lastSeenLocation: e.target.value })}
                    placeholder="e.g., Near Tadoba Lake"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status ?? undefined}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status" data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="relocated">Relocated</SelectItem>
                      <SelectItem value="deceased">Deceased</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    data-testid="input-latitude"
                    value={formData.lastSeenLat || ''}
                    onChange={(e) => setFormData({ ...formData, lastSeenLat: parseFloat(e.target.value) || undefined })}
                    placeholder="e.g., 20.2347"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    data-testid="input-longitude"
                    value={formData.lastSeenLng || ''}
                    onChange={(e) => setFormData({ ...formData, lastSeenLng: parseFloat(e.target.value) || undefined })}
                    placeholder="e.g., 79.3401"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="bg-primary" disabled={createMutation.isPending} data-testid="button-save-animal">
                  {createMutation.isPending ? "Saving..." : "Save Animal Data"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Animals Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading animals...</div>
      ) : animals.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <PawPrint className="w-10 h-10 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">No Animals Tracked</p>
            <p className="text-sm text-muted-foreground mb-6">Add your first animal to start tracking</p>
            <Button onClick={() => setOpen(true)} className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add First Animal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {animals.map((animal) => (
            <Card key={animal.id} className="bg-card/50 backdrop-blur-sm border-card-border hover-elevate overflow-hidden" data-testid={`animal-card-${animal.id}`}>
              <div className="h-48 bg-gradient-to-br from-primary/20 to-orange/20 flex items-center justify-center">
                <PawPrint className="w-20 h-20 text-primary/40" />
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-card-foreground truncate">{animal.name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{animal.species}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs shrink-0 ${
                    animal.status === 'active' 
                      ? 'bg-primary/10 text-primary' 
                      : animal.status === 'relocated'
                      ? 'bg-orange/10 text-orange'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {animal.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {animal.age && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{animal.age} years old • {animal.gender}</span>
                  </div>
                )}
                {animal.lastSeenLocation && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{animal.lastSeenLocation}</span>
                  </div>
                )}
                {animal.lastSeenAt && (
                  <p className="text-xs text-muted-foreground">
                    Last seen: {new Date(animal.lastSeenAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
