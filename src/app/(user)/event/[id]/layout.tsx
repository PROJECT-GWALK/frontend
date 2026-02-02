import EventBreadcrumb from "./components/EventBreadcrumb";

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="w-full px-6 py-4">
         <EventBreadcrumb />
      </div>
      {children}
    </div>
  );
}
