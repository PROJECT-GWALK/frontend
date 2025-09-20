import "../globals.css";
import { Navbar } from "@/components/navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-6 py-8">{children}</main>
    </>
  );
}
