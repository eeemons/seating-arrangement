import { FC } from "react";

interface SeatProps {
  seatNumber: number;
}

export const Seat: FC<SeatProps> = ({ seatNumber }) => {
  return (
    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
      {seatNumber}
    </div>
  );
};
