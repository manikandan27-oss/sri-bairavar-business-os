import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Sri Bairavar | Business OS", description: "Sri Bairavar Tours & Travels booking management" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
