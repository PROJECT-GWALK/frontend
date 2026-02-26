import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { EventData } from "@/utils/types";

type Props = {
  event: EventData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function OrganizerBanner({ event, open, onOpenChange }: Props) {
  return (
    <>
      <div
        className="relative w-full overflow-hidden cursor-zoom-in"
        onClick={() => onOpenChange(true)}
      >
        {event?.imageCover ? (
          <Image
            src={event.imageCover}
            alt={event.eventName || "Event banner"}
            width={1200}
            height={600}
            sizes="100vw"
            className="w-full h-auto rounded-xl"
          />
        ) : (
          <Image
            src="/banner.png"
            alt="Default banner"
            width={1200}
            height={600}
            sizes="100vw"
            className="w-full h-auto rounded-xl"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background/60 to-transparent pointer-events-none rounded-xl" />
      </div>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-3xl md:max-w-5xl bg-transparent border-none p-0"
          aria-label="Event banner"
        >
          <DialogTitle className="sr-only">Event banner</DialogTitle>
          <Image
            src={event?.imageCover || "/banner.png"}
            alt={event?.eventName || "Event banner"}
            width={800}
            height={400}
            className="w-full h-auto rounded-xl"
          />
          <DialogClose
            aria-label="Close banner"
            className="absolute top-3 right-3 z-50 rounded-full bg-black/60 text-white hover:bg-black/80 p-2 shadow"
          >
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
