import { create } from 'zustand';
import { Booking, RoomFilter } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { isWithinInterval, parseISO, addDays, isBefore, isAfter, startOfDay } from 'date-fns';

interface BookingState {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id'>) => string;
  updateBooking: (id: string, bookingData: Partial<Booking>) => boolean;
  deleteBooking: (id: string) => boolean;
  getBookingById: (id: string) => Booking | undefined;
  getBookingsForRoom: (roomId: string) => Booking[];
  getBookingsForGuest: (guestId: string) => Booking[];
  getAllBookings: () => Booking[];
  checkIn: (bookingId: string) => boolean;
  checkOut: (bookingId: string) => boolean;
  isRoomAvailable: (roomId: string, startDate: string, endDate: string, excludeBookingId?: string) => boolean;
  getCurrentBookingsForRoom: (roomId: string) => Booking[];
  getFutureBookingsForRoom: (roomId: string) => Booking[];
  getPastBookingsForRoom: (roomId: string) => Booking[];
  getAvailableRoomIds: (startDate: string, endDate: string) => string[];
  getOccupiedRoomIds: () => string[];
  getBookedRoomIds: (date: string) => string[];
}

const initialBookings: Booking[] = [
  {
    id: '1',
    roomId: '1',
    guestId: '1',
    guestName: 'Ahmed Khan',
    nationalId: 'BX782435',
    phone: '01712345678',
    numberOfPeople: 2,
    totalAmount: 5000,
    paidAmount: 2500,
    bookingDate: new Date().toISOString().split('T')[0],
    durationDays: 3,
    checkInDateTime: new Date().toISOString(),
  },
  {
    id: '2',
    roomId: '2',
    guestId: '2',
    guestName: 'Fatima Rahman',
    nationalId: 'AZ567890',
    phone: '01898765432',
    numberOfPeople: 2,
    totalAmount: 6000,
    paidAmount: 6000,
    bookingDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    durationDays: 2,
  },
  {
    id: '3',
    roomId: '3',
    guestId: '3',
    guestName: 'Kamal Hossain',
    nationalId: 'CY123456',
    phone: '01612345678',
    numberOfPeople: 4,
    totalAmount: 8000,
    paidAmount: 4000,
    bookingDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    durationDays: 5,
    checkInDateTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    checkOutDateTime: new Date().toISOString(),
  },
];

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: initialBookings,

  addBooking: (bookingData) => {
    const id = uuidv4();
    const newBooking = { ...bookingData, id };
    set((state) => {
      const updatedBookings = [...state.bookings, newBooking];
      return { bookings: updatedBookings };
    });
    return id;
  },

  updateBooking: (id, bookingData) => {
    let updated = false;
    set((state) => {
      const updatedBookings = state.bookings.map((booking) => {
        if (booking.id === id) {
          updated = true;
          return { ...booking, ...bookingData };
        }
        return booking;
      });
      return { bookings: updatedBookings };
    });
    return updated;
  },

  deleteBooking: (id) => {
    let deleted = false;
    set((state) => {
      const filteredBookings = state.bookings.filter((booking) => {
        if (booking.id === id) {
          deleted = true;
          return false;
        }
        return true;
      });
      return { bookings: filteredBookings };
    });
    return deleted;
  },

  getBookingById: (id) => {
    return get().bookings.find((booking) => booking.id === id);
  },

  getBookingsForRoom: (roomId) => {
    return get().bookings.filter((booking) => booking.roomId === roomId);
  },

  getBookingsForGuest: (guestId) => {
    return get().bookings.filter((booking) => booking.guestId === guestId);
  },

  getAllBookings: () => {
    return get().bookings;
  },

  checkIn: (bookingId) => {
    const booking = get().getBookingById(bookingId);
    if (!booking || booking.checkInDateTime) return false;
    
    const checkInDateTime = new Date().toISOString();
    return get().updateBooking(bookingId, { checkInDateTime });
  },

  checkOut: (bookingId) => {
    const booking = get().getBookingById(bookingId);
    if (!booking || !booking.checkInDateTime || booking.checkOutDateTime) return false;
    
    const checkOutDateTime = new Date().toISOString();
    return get().updateBooking(bookingId, { checkOutDateTime });
  },

  isRoomAvailable: (roomId, startDate, endDate, excludeBookingId) => {
    const bookings = get().getBookingsForRoom(roomId);
    const requestStart = startOfDay(parseISO(startDate));
    const requestEnd = startOfDay(addDays(parseISO(endDate), -1));
    
    return !bookings.some((booking) => {
      if (excludeBookingId && booking.id === excludeBookingId) return false;
      if (booking.checkOutDateTime) return false; // Room is available if booking is checked out
      
      const bookingStart = startOfDay(parseISO(booking.bookingDate));
      const bookingEnd = startOfDay(addDays(parseISO(booking.bookingDate), booking.durationDays - 1));
      
      return (
        (isWithinInterval(requestStart, { start: bookingStart, end: bookingEnd }) ||
         isWithinInterval(requestEnd, { start: bookingStart, end: bookingEnd }) ||
         (isBefore(requestStart, bookingStart) && isAfter(requestEnd, bookingEnd)))
      );
    });
  },

  getCurrentBookingsForRoom: (roomId) => {
    const now = startOfDay(new Date());
    return get().getBookingsForRoom(roomId).filter((booking) => {
      if (!booking.checkInDateTime || booking.checkOutDateTime) return false;
      
      const bookingStart = startOfDay(parseISO(booking.bookingDate));
      const bookingEnd = startOfDay(addDays(parseISO(booking.bookingDate), booking.durationDays - 1));
      
      return isWithinInterval(now, { start: bookingStart, end: bookingEnd });
    });
  },

  getFutureBookingsForRoom: (roomId) => {
    const now = startOfDay(new Date());
    return get().getBookingsForRoom(roomId).filter((booking) => {
      if (booking.checkOutDateTime) return false;
      
      const bookingStart = startOfDay(parseISO(booking.bookingDate));
      return (isAfter(bookingStart, now) || bookingStart.getTime() === now.getTime()) && !booking.checkInDateTime;
    });
  },

  getPastBookingsForRoom: (roomId) => {
    return get().getBookingsForRoom(roomId).filter((booking) => {
      return !!booking.checkOutDateTime;
    });
  },

  getAvailableRoomIds: (startDate: string, endDate: string) => {
    const allBookings = get().getAllBookings();
    const occupiedRoomIds = new Set<string>();
    
    const requestStart = startOfDay(parseISO(startDate));
    const requestEnd = startOfDay(addDays(parseISO(endDate), -1));
    
    allBookings.forEach((booking) => {
      if (booking.checkOutDateTime) return; // Room is available if booking is checked out
      
      const bookingStart = startOfDay(parseISO(booking.bookingDate));
      const bookingEnd = startOfDay(addDays(parseISO(booking.bookingDate), booking.durationDays - 1));
      
      if (
        (isWithinInterval(requestStart, { start: bookingStart, end: bookingEnd }) ||
         isWithinInterval(requestEnd, { start: bookingStart, end: bookingEnd }) ||
         (isBefore(requestStart, bookingStart) && isAfter(requestEnd, bookingEnd)))
      ) {
        occupiedRoomIds.add(booking.roomId);
      }
    });
    
    return get().bookings
      .map((booking) => booking.roomId)
      .filter((roomId) => !occupiedRoomIds.has(roomId));
  },

  getOccupiedRoomIds: () => {
    const now = startOfDay(new Date());
    const occupiedRoomIds = new Set<string>();
    
    get().bookings.forEach((booking) => {
      if (!booking.checkInDateTime || booking.checkOutDateTime) return;
      
      const bookingStart = startOfDay(parseISO(booking.bookingDate));
      const bookingEnd = startOfDay(addDays(parseISO(booking.bookingDate), booking.durationDays - 1));
      
      if (isWithinInterval(now, { start: bookingStart, end: bookingEnd })) {
        occupiedRoomIds.add(booking.roomId);
      }
    });
    
    return Array.from(occupiedRoomIds);
  },

  getBookedRoomIds: (date) => {
    const targetDate = startOfDay(parseISO(date));
    const bookedRoomIds = new Set<string>();
    
    get().bookings.forEach((booking) => {
      if (booking.checkOutDateTime) return; // Room is available if booking is checked out
      
      const bookingStart = startOfDay(parseISO(booking.bookingDate));
      const bookingEnd = startOfDay(addDays(parseISO(booking.bookingDate), booking.durationDays - 1));
      
      if (isWithinInterval(targetDate, { start: bookingStart, end: bookingEnd })) {
        bookedRoomIds.add(booking.roomId);
      }
    });
    
    return Array.from(bookedRoomIds);
  },
}));