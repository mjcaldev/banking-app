import MobileNav from "@/components/MobileNav";
import SideBar from "@/components/SideBar";
import getLoggedInUser from "@/lib/actions/user.actions";
import { createGuestUser } from "@/lib/utils";
import Image from "next/image";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedIn = await getLoggedInUser();
  // Allow guest access - use guest user if not logged in
  const user = loggedIn || createGuestUser();
    
  return (
    <main className="flex h-screen w-full font-inter">
      <SideBar user={user} />

      <div className="flex size-full flex-col">
        <div className="root-layout">
          <Image src="/icons/logo.svg" width={30} height={30} alt="logo" />
          <div>
            <MobileNav user={user} />
          </div>
        </div>
        {children}
      </div>

    </main>
  );
}
