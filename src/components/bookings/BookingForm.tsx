import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/useBookingStore';
import { useGuestStore } from '../../store/useGuestStore';
import { useRoomStore } from '../../store/useRoomStore';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface BookingFormProps {
  roomId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

const CustomInput = React.forwardRef(({ value, onClick }: any, ref: any) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref}
    className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-white text-left flex items-center"
  >
    {value || 'Select date'}
  </button>
));

const BookingForm: React.FC<BookingFormProps> = ({ roomId, onSubmit, onCancel }) => {
  const { getRoomById } = useRoomStore();
  const { findOrCreateGuest, getAllGuests } = useGuestStore();
  const { addBooking, isRoomAvailable } = useBookingStore();
  
  const room = getRoomById(roomId);
  const today = new Date();

  const [guestName, setGuestName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [bookingDate, setBookingDate] = useState<Date | null>(today);
  const [durationDays, setDurationDays] = useState('1');
  const [availabilityError, setAvailabilityError] = useState('');

  useEffect(() => {
    if (nationalId.length > 0) {
      const existingGuest = getAllGuests().find(guest => guest.nationalId === nationalId);
      if (existingGuest) {
        setGuestName(existingGuest.name);
        setPhone(existingGuest.phone);
      }
    }
  }, [nationalId, getAllGuests]);

  const endDate = durationDays && bookingDate 
    ? addDays(bookingDate, parseInt(durationDays, 10))
    : null;

  useEffect(() => {
    if (bookingDate && durationDays) {
      const bookingDateStr = format(bookingDate, 'yyyy-MM-dd');
      const endDateStr = format(addDays(bookingDate, parseInt(durationDays, 10)), 'yyyy-MM-dd');
      
      if (!isRoomAvailable(roomId, bookingDateStr, endDateStr)) {
        setAvailabilityError('Room is not available for the selected dates');
      } else {
        setAvailabilityError('');
      }
    }
  }, [bookingDate, durationDays, roomId, isRoomAvailable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (availabilityError) {
      toast.error(availabilityError);
      return;
    }

    if (!guestName || !nationalId || !phone || !bookingDate || !durationDays || !totalAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const guestId = findOrCreateGuest({
      name: guestName,
      nationalId,
      phone,
    });

    addBooking({
      roomId,
      guestId,
      guestName,
      nationalId,
      phone,
      numberOfPeople: parseInt(numberOfPeople, 10),
      totalAmount: parseFloat(totalAmount),
      paidAmount: paidAmount ? parseFloat(paidAmount) : 0,
      bookingDate: format(bookingDate!, 'yyyy-MM-dd'),
      durationDays: parseInt(durationDays, 10),
    });

    onSubmit();
  };

  if (!room) {
    return <div>Room not found</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="font-medium mb-2">Room Information</h3>
        <p>Room Number: {room.roomNumber}</p>
        <p>Category: {room.category}</p>
        <p>Beds: {room.beds}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-1">National ID*</label>
          <input
            type="text"
            id="nationalId"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>

        <div>
          <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-1">Guest Name*</label>
          <input
            type="text"
            id="guestName"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>

        <div>
          <label htmlFor="numberOfPeople" className="block text-sm font-medium text-gray-700 mb-1">Number of People*</label>
          <input
            type="number"
            id="numberOfPeople"
            value={numberOfPeople}
            onChange={(e) => setNumberOfPeople(e.target.value)}
            min="1"
            max={room.beds * 2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>

        <div>
          <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">Total Amount*</label>
          <input
            type="number"
            id="totalAmount"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>

        <div>
          <label htmlFor="paidAmount" className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
          <input
            type="number"
            id="paidAmount"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            min="0"
            step="0.01"
            max={totalAmount || undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div>
          <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700 mb-1">Booking Date*</label>
          <DatePicker
            selected={bookingDate}
            onChange={(date: Date | null) => setBookingDate(date)}
            customInput={<CustomInput />}
            dateFormat="dd/MM/yyyy"
            isClearable
            placeholderText="Select booking date"
            todayButton="Today"
            minDate={today}
            className="w-full"
            calendarClassName="border border-gray-200 rounded-lg shadow-lg"
            showPopperArrow={false}
            required
          />
        </div>

        <div>
          <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)*</label>
          <input
            type="number"
            id="durationDays"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
      </div>

      {endDate && (
        <div className="bg-blue-50 p-3 rounded-md text-blue-800">
          <p>Check-out date will be: <strong>{format(endDate, 'yyyy-MM-dd')}</strong></p>
        </div>
      )}

      {availabilityError && (
        <div className="bg-red-50 p-3 rounded-md text-red-800">
          <p>{availabilityError}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!!availabilityError}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400"
        >
          Create Booking
        </button>
      </div>
    </form>
  );
};

export default BookingForm;
