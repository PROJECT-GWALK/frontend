import { Button } from "@/components/ui/button";
import Link from "next/link";

// --- Sidebar Component ---
function StepSidebar({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, name: "Basic Information" },
    { id: 2, name: "Date & Location" },
    { id: 3, name: "Ticketing" },
    { id: 4, name: "Additional Details" },
    { id: 5, name: "Settings" },
  ];

  return (
    <div className="w-60 bg-white border-r p-4 space-y-2">
      <div className="text-sm font-semibold mb-4">Create New Event</div>
      <Link href="/">
        <div className="text-sm text-gray-500 mb-6">Filter Your Events</div>
      </Link>
      <div className="space-y-1">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`p-2 rounded cursor-pointer flex items-center ${
              step.id === 1 // Only step 1 is active/selected in the image
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="mr-2 h-4 w-4" /> {/* Placeholder for icon/dot */}
            {step.name}
          </div>
        ))}
      </div>
      <div className="pt-6">
        <Button variant="outline" className="w-full text-blue-600 border-blue-600 hover:bg-blue-50">
          Save as Template
        </Button>
      </div>
    </div>
  );
}

export { StepSidebar };
