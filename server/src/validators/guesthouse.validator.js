import { z } from "zod";

export const guesthouseSchema = z.object({
  name: z.string().min(2, "Name is required"),

  address: z.string().min(2, "Address is required"),

  city: z.string().min(2, "City is required"),

  description: z.string().optional().or(z.literal("")),
  image: z.any().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
}).superRefine((guesthouse, context) => {
  const latitudeIsSet = guesthouse.latitude !== undefined && guesthouse.latitude !== null;
  const longitudeIsSet = guesthouse.longitude !== undefined && guesthouse.longitude !== null;
  if (latitudeIsSet !== longitudeIsSet) {
    context.addIssue({
      code: "custom",
      message: "Latitude and longitude must be provided together.",
      path: ["latitude"],
    });
  }
});