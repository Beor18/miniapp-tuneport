import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET!;

interface DecodedToken {
  id: string;
}

export const verifyJWT = (req: NextRequest): DecodedToken => {
  const authorizationHeader = req.headers.get("authorization");
  if (!authorizationHeader) {
    throw new Error("No token provided");
  }

  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const decoded = jwt.verify(token, secret) as DecodedToken;
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
};
