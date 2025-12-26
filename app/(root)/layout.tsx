import MobileNav from "@/components/MobileNav";
import SideBar from "@/components/SideBar";
import getLoggedInUser from "@/lib/actions/user.actions";
import { getGuestUserServer, createGuestUserObjectServer } from "@/lib/guest-server";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedIn = await getLoggedInUser();
  
  // Check for guest user if not logged in
  let user: User | null = loggedIn;
  if (!user) {
    const guestEmail = await getGuestUserServer();
    if (guestEmail) {
      user = createGuestUserObjectServer(guestEmail);
    }
  }

  // Redirect to sign-in only if neither logged in nor guest
  if (!user) {
    redirect('/sign-in');
  }
    
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
