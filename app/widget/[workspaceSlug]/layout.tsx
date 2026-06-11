export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Transparent shell so the iframe can render as a flush drawer inside
  // the host product. The inner WidgetBoard supplies its own card surface.
  return <div className="h-screen w-full bg-transparent">{children}</div>;
}
