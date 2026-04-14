"use client";

interface Seat {
  id: number;
  seat_number: number;
  type: "designated" | "floater";
  squad_id: number | null;
  status: "allocated" | "available" | "blocked" | "booked";
  user?: {
    id: string;
    squad_id?: number;
  };
}

interface SeatGridProps {
  seats: Seat[];
  onSeatClick: (seat: Seat) => void;
  selectedSeat: Seat | null;
  isLoading?: boolean;
  userSquad?: number;
  isHoliday?: boolean;
}

export function SeatGrid({
  seats,
  onSeatClick,
  selectedSeat,
  isLoading,
  userSquad,
  isHoliday,
}: SeatGridProps) {
  const getSeatColor = (seat: Seat): string => {
    // Allocated/Booked seats - RED
    if (seat.status === "allocated" || seat.status === "booked") {
      return "bg-red-200 border-red-300 text-red-900";
    }

    // Blocked seats - YELLOW (released/vacated/cancelled)
    if (seat.status === "blocked") {
      return "bg-yellow-200 border-yellow-300 text-yellow-900";
    }

    // Available seats - GREEN (can be booked)
    if (seat.status === "available") {
      return "bg-green-200 border-green-300 text-green-900";
    }

    // Default - GREEN (available)
    return "bg-green-200 border-green-300 text-green-900";
  };

  const canBookSeat = (seat: Seat): boolean => {
    // Seats that are already allocated or booked cannot be booked
    if (seat.status === "allocated" || seat.status === "booked") return false;

    // Blocked seats cannot be booked
    if (seat.status === "blocked") return false;

    // Available seats (both floater and released designated) can be booked
    if (seat.status === "available") return true;

    return false;
  };

  const getSeatLabel = (seat: Seat): string => {
    // For floater seats, show F/B/C
    if (seat.type === "floater") {
      if (seat.status === "booked") return "B";
      if (seat.status === "blocked") return "C";
      return "F";
    }
    // For designated seats, show seat number
    return seat.id.toString();
  };

  // Create seat grid layout matching the image
  const createSeatGrid = () => {
    // Ensure we have enough seats
    const allSeats = [...seats];

    const rows = [
      { label: "Row 1", seats: allSeats.slice(0, 10) },
      { label: "Row 2", seats: allSeats.slice(10, 20) },
      { label: "Row 3", seats: allSeats.slice(20, 30) },
      { label: "Row 4", seats: allSeats.slice(30, 40) },
      {
        label: "Floater",
        seats: allSeats.filter((s) => s.type === "floater").slice(0, 10),
      },
    ];

    return rows;
  };

  const seatRows = createSeatGrid();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-gray-300 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading seats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Holiday Warning */}
      {isHoliday && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-2xl">🎉</span>
            </div>
            <div>
              <div className="font-semibold text-red-900 mb-1">
                Holiday - Booking Not Available
              </div>
              <div className="text-sm text-red-700">
                This date is marked as a holiday. Seat booking is not allowed on
                holidays.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Logic Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Booking Rules & Guidelines
        </div>
        <ul className="text-sm text-blue-800 space-y-1.5 ml-6">
          <li className="list-disc">
            <strong>Designated Seats:</strong> Auto-allocated daily at 3 PM to
            scheduled squads (shown in red when allocated)
          </li>
          <li className="list-disc">
            <strong>Released Seats:</strong> When users cancel their designated
            seats, they become available for anyone to book (turn green)
          </li>
          <li className="list-disc">
            <strong>Floater Seats (F):</strong> Always available for manual
            booking after 3 PM auto-allocation (shown in green)
          </li>
          <li className="list-disc">
            <strong>Blocked Seats:</strong> Seats for non-scheduled squads are
            blocked (shown in yellow)
          </li>
          <li className="list-disc">
            <strong>Booking Window:</strong> Manual booking allowed ONLY after 3
            PM auto-allocation is complete
          </li>
          <li className="list-disc">
            <strong>Eligibility:</strong> Only users WITHOUT a designated seat
            can book available seats
          </li>
          <li className="list-disc">
            <strong>One Seat Per Day:</strong> Each user gets only one seat per
            day (designated OR manually booked)
          </li>
        </ul>
      </div>

      {/* Seat Grid */}
      {seatRows.map((row, rowIndex) => (
        <div key={row.label} className="flex items-center gap-3">
          <div className="w-16 text-xs font-medium text-gray-600 text-right">
            {row.label}
          </div>
          <div className="flex gap-2 flex-wrap">
            {row.seats.map((seat) => {
              if (!seat) return null;

              const isSelected = selectedSeat?.id === seat.id;
              const isBookable = !isHoliday && canBookSeat(seat);

              return (
                <button
                  key={seat.id}
                  onClick={() => !isHoliday && onSeatClick(seat)}
                  disabled={isLoading || !isBookable || isHoliday}
                  className={`
                    w-12 h-12 rounded-lg border-2 font-medium text-sm transition-all
                    ${getSeatColor(seat)}
                    ${isSelected ? "ring-2 ring-cyan-500 ring-offset-2" : ""}
                    ${isBookable && !isHoliday ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-not-allowed opacity-60"}
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center
                  `}
                  title={`Seat ${seat.id} - ${seat.type === "floater" ? "Floater" : `Squad ${seat.squad_id} Designated`}${seat.status === "allocated" || seat.status === "booked" ? " (Booked)" : seat.status === "available" && seat.type === "designated" ? " (Released - Available)" : ""}${isHoliday ? " (Holiday - Booking disabled)" : ""}`}
                >
                  {getSeatLabel(seat)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
