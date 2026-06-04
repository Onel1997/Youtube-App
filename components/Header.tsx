"use client";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({
  title = "YouTube Generator",
  subtitle = "Gaming & Entertainment Kanal",
}: HeaderProps) {
  return (
    <header className="relative mb-10 text-center">
      <div className="absolute inset-x-0 top-0 mx-auto h-px w-48 bg-gradient-to-r from-transparent via-gaming-purple to-transparent" />
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gaming-purple/30 bg-gaming-purple/10 px-4 py-1 text-xs font-medium uppercase tracking-widest text-gaming-neon">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gaming-glow" />
        AI Powered
      </div>
      <h1 className="neon-text text-4xl font-bold tracking-tight text-white md:text-5xl">
        {title}
      </h1>
      <p className="mt-2 text-gaming-neon/70">{subtitle}</p>
    </header>
  );
}
