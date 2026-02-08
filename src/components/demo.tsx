export const Demo: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="relative z-0 my-8 flex w-full items-center justify-center rounded-lg border px-3 py-8 shadow-sm dark:bg-neutral-900/30">
      {children}
    </div>
  );
};
