import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import Google from "next-auth/providers/google";
import { randomUUID } from "crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
        session.user.role = (user as any).role;
        session.user.username = (user as any).username;

        try {
          const today = new Date();
          const dateOnly = new Date(today);
          dateOnly.setUTCHours(0, 0, 0, 0);

          await prisma.userDailyActive.upsert({
            where: {
              userId_date: {
                userId: user.id,
                date: dateOnly,
              },
            },
            update: {},
            create: {
              userId: user.id,
              date: dateOnly,
            },
          });
        } catch (err) {
          console.error("Failed to log daily active user:", err);
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
