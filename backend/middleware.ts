import type { NextFunction, Request, Response } from "express";
import { createSupabaseClient } from "./client";
import { prisma } from "./db";

const supabase = createSupabaseClient()

export async function middleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        res.status(401).json({ message: "Unauthorized" })
        return;
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader

    const { data, error } = await supabase.auth.getUser(token)
    const user = data.user

    if (error || !user) {
        res.status(401).json({ message: "Unauthorized" })
        return;
    }

    try {
        await prisma.user.create({
            data: {
                id: user.id,
                supabaseId: user.id,
                email: user.email!,
                provider: user.app_metadata.provider === "google" ? "Google" : "GitHub",
                name: user.user_metadata.full_name,
            }
        })
    } catch (err: any) {
        if (err?.code !== "P2002") {
            console.error("Error creating user:", err)
        }
    }

    req.userId = user.id
    next()
}
