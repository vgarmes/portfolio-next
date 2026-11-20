const Footer: React.FC = () => {
  return (
    // Top rule fades out towards both edges, like the construction lines in the Orbit sketch.
    <footer className="relative mt-auto h-(--footer-height) w-full px-6 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,var(--border)_20%,var(--border)_80%,transparent)]">
      <div className="mx-auto flex h-full w-full max-w-(--content-width) items-center justify-between">
        <p className="text-muted-foreground text-xs">
          No matter where you go, everyone’s connected
        </p>
      </div>
    </footer>
  );
};

export default Footer;
