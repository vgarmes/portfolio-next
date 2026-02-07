export const Demo: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="not-prose relative z-0 my-8 w-full rounded-xl bg-(--ds-background-demo) shadow-sm">
      {children}
    </div>
  );
};
