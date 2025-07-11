"use server";

import { revalidatePath } from "next/cache";

interface CreateUserInput {
  name: string;
  nickname: string;
  email: string;
  address: string;
  address_solana?: string;
  type?: any;
}

export async function createUser(data: CreateUserInput) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/users/createUser`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error("Error al registrar el usuario");
    }

    const newUser = await response.json();

    // Opcional: Si necesitas revalidar alguna ruta tras la creación del usuario
    revalidatePath("/");

    return newUser;
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    return null;
  }
}
