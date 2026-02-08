import { ThemeSwitcher } from "./theme-switcher";

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto h-(--footer-height) w-full border-t px-6">
      <div className="mx-auto flex h-full w-full max-w-(--content-width) items-center justify-between">
        <p className="text-muted-foreground text-xs">Keep on keeping on</p>
        <ThemeSwitcher />
      </div>
    </footer>
  );
};

export default Footer;
