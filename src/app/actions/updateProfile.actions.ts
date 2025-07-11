"use server";

import { revalidatePath } from "next/cache";

interface UpdateProfileInput {
  id: string;
  name?: string;
  nickname: string;
  email?: string;
  picture?: string;
  biography?: string;
  twitter?: string;
  instagram?: string;
  spotify?: string;
  facebook?: string;
}

export async function updateProfile(data: UpdateProfileInput) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/users/updateUser`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Error updating profile. Status: ${response.statusText}`);
    }

    const result = await response.json();

    // Revalidar el caché de múltiples rutas para asegurar la actualización
    revalidatePath(`/u/${data.nickname}`);
    revalidatePath(`/`);

    return result;
  } catch (error) {
    console.error("Error updating profile:", error);
    return null;
  }
}
