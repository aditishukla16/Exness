import jwt from "jsonwebtoken";
import { JWTPASSWORD } from "../type";
import { Request, Response, NextFunction } from "express";
import { UUID } from "crypto";

export interface CustomRequest extends Request {
  id?: UUID;
}

export const userMiddleware = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  // 1. Get auth header
  const authHeader = req.headers.authorization;
  console.log("AUTH HEADER:", authHeader);

  // 2. Missing header
  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  // 3. Extract token from "Bearer <token>"
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Malformed token",
    });
  }

  try {
    // 4. Verify JWT
    const payload = jwt.verify(token, JWTPASSWORD) as { userId: UUID };

    // 5. Attach userId to request
    req.id = payload.userId;

    // 6. Continue
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
