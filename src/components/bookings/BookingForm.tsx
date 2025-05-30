import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/useBookingStore';
import { useGuestStore } from '../../store/useGuestStore';
import { useRoomStore } from '../../store/useRoomStore';
import { format, addDays, isBefore, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';

interface BookingFormProps {
  roomId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ roomId, onSubmit, onCancel }) => {
  const { getRoomById } = useRoomStore();
  const { findOrCreateGuest, getAllGuests } = useGuestStore();
  const { addBooking, isRoomAvailable } = useBookingStore();
  
  const room = getRoomById(roomId);
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [guestName, setGuestName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [bookingDate, setBookingDate] = useState(today);
  const [durationDays, setDurationDays] = useState('1');
  
  const [availabilityError, setAvailabilityError] = useState('');
  
  // Auto-fill guest information when National ID matches
  useEffect(() => {
    if (nationalId.length > 0) {
      const existingGuest = getAllGuests().find(guest => guest.nationalId === nationalId);
      if (existingGuest) {
        setGuestName(existingGuest.name);
        setPhone(existingGuest.phone);
      }
    }
  }, [nationalId, getAllGuests]);
  
  // Calculate end date based on booking date and duration
  const endDate = durationDays && bookingDate 
    ? format(addDays(parseISO(bookingDate), parseInt(durationDays, 10)), 'yyyy-MM-dd')
    : '';
  
  // Check room availability when booking date or duration changes
  useEffect(() => {
    if (bookingDate && durationDays) {
      const endDateValue = format(addDays(parseISO(bookingDate), parseInt(durationDays, 10)), 'yyyy-MM-dd');
      
      if (!isRoomAvailable(roomId, bookingDate, endDateValue)) {
        setAvailabilityError('Room is not available for the selected dates');
      } else {
        setAvailabilityError('');
      }
    }
  }, [bookingDate, durationDays, roomId, isRoomAvailable]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (availabilityError) {
      toast.error(availabilityError);
      return;
    }
    
    if (!guestName || !nationalId || !phone || !bookingDate || !durationDays || !totalAmount) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Create or find guest
    const guestId = findOrCreateGuest({
      name: guestName,
      nationalId,
      phone,
    });
    
    // Create booking
    addBooking({
      roomId,
      guestId,
      guestName,
      nationalId,
      phone,
      numberOfPeople: parseInt(numberOfPeople, 10),
      totalAmount: parseFloat(totalAmount),
      paidAmount: paidAmount ? parseFloat(paidAmount) : 0,
      bookingDate,
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
          <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-1">
            National ID*
          </label>
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
          <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-1">
            Guest Name*
          </label>
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
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number*
          </label>
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
          <label htmlFor="numberOfPeople" className="block text-sm font-medium text-gray-700 mb-1">
            Number of People*
          </label>
          <input
            type="number"
            id="numberOfPeople"
            value={numberOfPeople}
            onChange={(e) => setNumberOfPeople(e.target.value)}
            min="1"
            max={room.beds * 2} // Assuming max 2 people per bed
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Total Amount*
          </label>
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
          <label htmlFor="paidAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Paid Amount
          </label>
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
          <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700 mb-1">
            Booking Date*
          </label>
          <input
            type="date"
            id="bookingDate"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            min={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700 mb-1">
            Duration (Days)*
          </label>
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
          <p>Check-out date will be: <strong>{endDate}</strong></p>
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