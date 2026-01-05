import Image from "next/image";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen w-full justify-between font-inter relative">
      {/* Background image for mobile */}
      <div className="auth-asset-mobile lg:hidden">
        <div className="relative w-full h-full">
          <Image 
            src="/icons/auth-image.jpg"
            alt="Landscape view of golden field under blue sky"
            fill
            className="object-cover"
            priority
          />
          {/* Dark overlay for better text readability on mobile */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
      </div>
      
      {/* Form content with backdrop on mobile */}
      <div className="relative z-10 w-full lg:w-auto">
        {children}
      </div>
      
      {/* Desktop side image */}
      <div className="auth-asset">
        <div className="relative w-full h-full">
          <Image 
            src="/icons/auth-image.jpg"
            alt="Landscape view of golden field under blue sky"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <h2 className="text-white text-24 lg:text-36 xl:text-48 font-bold text-center max-w-2xl leading-tight" style={{ textShadow: '0 4px 12px rgba(0, 0, 0, 0.8), 0 2px 6px rgba(0, 0, 0, 0.9)' }}>
              With Muno, You Know What&apos;s on the Horizon
            </h2>
          </div>
        </div>
      </div>
    </main>
  );
}
