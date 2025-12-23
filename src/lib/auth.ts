import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "./prisma";
import Google from "next-auth/providers/google";
import { randomUUID } from "crypto";

function getThailandDateOnly() {
  const now = new Date();
  const thailand = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(
      thailand.getUTCFullYear(),
      thailand.getUTCMonth(),
      thailand.getUTCDate()
    )
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  pages: {
    signIn: "/sign-in",
    error: "/error",
  },
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "database" },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const extUser = user as typeof user & { role?: string; username?: string };
        (session.user as typeof session.user & { role?: string; username?: string }).role = extUser.role;
        (session.user as typeof session.user & { username?: string; role?: string }).username = extUser.username;

        const ban = await prisma.userBan.findUnique({
          where: { email: user.email! },
        });

        let isBanned = false;
        if (ban) {
          if (!ban.expiresAt || ban.expiresAt > new Date()) {
            isBanned = true;
          }
        }

        (session as typeof session & { banned?: boolean }).banned = isBanned;

        if (!isBanned) {
          try {
            const dateOnly = getThailandDateOnly();

            await prisma.userDailyActive.create({
              data: {
                userId: user.id,
                date: dateOnly,
              },
            });
          } catch (err: unknown) {
            if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code !== 'P2002') {
              console.error("Failed to log daily active user:", err);
            }
          }
        }
      }
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          image: null,
          username: `user_${randomUUID().slice(0, 8)}`,
        },
      });
    },
  },
});
