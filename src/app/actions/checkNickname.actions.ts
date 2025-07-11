"use server";

export async function checkNicknameAvailability(nickname: string) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/users/checkNickname`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname }),
      }
    );

    if (!response.ok) {
      throw new Error("Error al verificar nickname");
    }

    const data = await response.json();
    return data.available; // true o false
  } catch (error) {
    console.error("Error al verificar nickname:", error);
    return false;
  }
}
