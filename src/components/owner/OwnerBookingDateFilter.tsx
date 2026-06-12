"use client";

import { format, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OwnerBookingDateFilterProps = {
  id?: string;
  value: string;
  onChange: (date: string) => void;
};

export function OwnerBookingDateFilter({
  id = "booking-date-filter",
  value,
  onChange,
}: OwnerBookingDateFilterProps) {
  const formattedValue = (() => {
    try {
      return format(parseISO(value), "EEEE, d MMMM yyyy");
    } catch {
      return value;
    }
  })();

  return (
    <div className="w-full sm:w-[260px]">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        Select date
      </Label>
      <div className="relative mt-1.5">
        <Input
          id={id}
          type="date"
          value={value}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          aria-describedby={`${id}-hint`}
          className="owner-date-filter-input h-11 w-full pr-11 text-sm font-medium"
        />
        <Calendar
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
      <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
        {formattedValue}
      </p>
    </div>
  );
}
