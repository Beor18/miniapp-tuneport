"use server";

import { revalidatePath } from "next/cache";

export async function revalidateUserAlbums(nickname: string) {
  revalidatePath(`/u/${nickname}`);
}
