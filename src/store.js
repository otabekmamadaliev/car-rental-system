// Simple in-memory store for demo bookings
const bookings = [];

export function addBooking(booking) {
  bookings.push(booking);
  return booking;
}

export function updateBookingLocal(id, data) {
  const idx = bookings.findIndex(b => String(b.id) === String(id));
  if (idx >= 0) {
    bookings[idx] = { ...bookings[idx], ...data };
    return bookings[idx];
  }
  return null;
}

export function getLocalBookings() {
  return bookings.slice().reverse();
}
