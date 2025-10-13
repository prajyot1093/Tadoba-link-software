import { storage } from "./storage";

export async function seedSafeZones() {
  const zones = [
    {
      name: "Moharli Village Safe Zone",
      area: "Moharli",
      description: "Protected cattle grazing area near Moharli village with regular forest patrol",
      coordinates: [
        [20.2300, 79.3300],
        [20.2300, 79.3450],
        [20.2200, 79.3450],
        [20.2200, 79.3300],
      ],
      isActive: true,
    },
    {
      name: "Kolara Buffer Zone",
      area: "Kolara",
      description: "Safe grazing area in Kolara buffer zone, monitored by wildlife cameras",
      coordinates: [
        [20.2450, 79.3250],
        [20.2450, 79.3400],
        [20.2350, 79.3400],
        [20.2350, 79.3250],
      ],
      isActive: true,
    },
    {
      name: "Navegaon Protected Area",
      area: "Navegaon",
      description: "Community grazing zone with minimal wildlife activity",
      coordinates: [
        [20.2200, 79.3550],
        [20.2200, 79.3700],
        [20.2100, 79.3700],
        [20.2100, 79.3550],
      ],
      isActive: true,
    },
  ];

  try {
    for (const zone of zones) {
      await storage.createSafeZone(zone);
    }
    console.log("✓ Safe zones seeded successfully");
  } catch (error) {
    console.error("Error seeding safe zones:", error);
  }
}
