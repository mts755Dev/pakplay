"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  bookingIntervalsFromDayBookings,
  buildHourlySlots,
  getSelectedEndHour,
  getSelectedStartHour,
  hourToTimeString,
  isRangeAvailable,
  isSlotInSelectedRange,
  slotEndTimeString,
  type HourlySlot,
} from "@/lib/time-slots";
import { toast } from "sonner";

type BookingTimeSlotGridProps = {
  bookingDate: string;
  dayBookings: Array<{ start_time: string; end_time: string }>;
  totalCourts: number;
  startTime: string;
  endTime: string;
  onChange: (startTime: string, endTime: string) => void;
  loading?: boolean;
  isOwner?: boolean;
  maxHours?: number;
};

export function BookingTimeSlotGrid({
  bookingDate,
  dayBookings,
  totalCourts,
  startTime,
  endTime,
  onChange,
  loading = false,
  isOwner = false,
  maxHours = 8,
}: BookingTimeSlotGridProps) {
  const slots = useMemo(() => {
    if (!bookingDate) return [];
    const intervals = bookingIntervalsFromDayBookings(dayBookings);
    return buildHourlySlots(totalCourts, intervals, bookingDate, isOwner);
  }, [bookingDate, dayBookings, totalCourts, isOwner]);

  const selectedStartHour = getSelectedStartHour(startTime);
  const selectedEndHour = getSelectedEndHour(startTime, endTime);

  const handleSlotClick = (slot: HourlySlot) => {
    if (!bookingDate) {
      toast.error("Please select a booking date first");
      return;
    }

    if (slot.isPast) {
      toast.error(isOwner ? "This time has already passed" : "Please select a time at least 1 hour from now");
      return;
    }

    if (slot.isBooked || !slot.available) {
      toast.error("This slot is fully booked");
      return;
    }

    const { hour } = slot;

    if (selectedStartHour === null) {
      onChange(slot.startTime, slot.endTime);
      return;
    }

    if (selectedStartHour === hour && selectedEndHour === hour) {
      onChange("", "");
      return;
    }

    if (hour < selectedStartHour) {
      onChange(slot.startTime, slot.endTime);
      return;
    }

    const hourCount = hour - selectedStartHour + 1;
    if (hourCount > maxHours) {
      toast.error(`Booking duration cannot exceed ${maxHours} hours`);
      return;
    }

    if (!isRangeAvailable(slots, selectedStartHour, hour)) {
      toast.error("One or more slots in this range are not available");
      return;
    }

    onChange(hourToTimeString(selectedStartHour), slotEndTimeString(hour));
  };

  if (!bookingDate) {
    return (
      <p className="text-white/70 text-xs rounded-lg border border-white/20 bg-white/5 px-3 py-2">
        Select a date to view available time slots
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-white text-sm font-semibold">Select Time Slot</p>
        {startTime && endTime && selectedStartHour !== null && selectedEndHour !== null && (
          <p className="text-white/80 text-xs font-medium">
            {selectedEndHour - selectedStartHour + 1}h selected
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/80 text-sm py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading slots...
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto booking-form-scrollbar p-0.5">
          {slots.map((slot) => {
            const isSelected = isSlotInSelectedRange(slot.hour, startTime, endTime);
            const isDisabled = slot.isPast || slot.isBooked || !slot.available;

            return (
              <button
                key={slot.hour}
                type="button"
                title={slot.isBooked ? `${slot.label} — Booked` : slot.label}
                disabled={isDisabled && !isSelected}
                onClick={() => handleSlotClick(slot)}
                className={cn(
                  "relative flex h-12 w-full flex-col items-center justify-center",
                  "rounded-lg border px-1 transition-all duration-150",
                  "text-xs font-semibold leading-none tracking-tight sm:text-sm",
                  isSelected &&
                    "bg-white text-blue-600 border-white shadow-md scale-[1.02]",
                  !isSelected && slot.isBooked &&
                    "bg-red-500/30 border-red-400/50 text-red-50 cursor-not-allowed",
                  !isSelected && slot.isPast &&
                    "bg-white/5 border-white/10 text-white/30 cursor-not-allowed",
                  !isSelected && !isDisabled &&
                    "bg-white/10 border-white/25 text-white hover:bg-white/20 hover:border-white/40 active:scale-[0.98]",
                )}
              >
                {slot.isBooked ? (
                  <>
                    <span className="whitespace-nowrap leading-none">{slot.label}</span>
                    <span className="mt-0.5 text-[10px] font-bold uppercase leading-none tracking-wider opacity-90">
                      Full
                    </span>
                  </>
                ) : (
                  <span className="whitespace-nowrap leading-none">{slot.label}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-white/55 text-[10px] leading-snug">
        Tap a slot for 1 hour, or tap a second slot to extend up to {maxHours} hours.
      </p>
    </div>
  );
}
