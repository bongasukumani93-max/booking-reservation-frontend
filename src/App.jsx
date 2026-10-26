
import { useEffect, useState } from "react";

const API = "https://booking-reservation-backend.onrender.com";

const resources = [
  "Meeting Room A",
  "Meeting Room B",
  "Conference Room",
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function App() {
  const [resource, setResource] = useState(resources[0]);
  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      const query = new URLSearchParams({ date, resource });

      const [slotsResponse, bookingsResponse] = await Promise.all([
        fetch(`${API}/api/slots?${query}`),
        fetch(`${API}/api/bookings/${date}/${encodeURIComponent(resource)}`),
      ]);

      if (!slotsResponse.ok || !bookingsResponse.ok) {
        throw new Error("Unable to retrieve booking information");
      }

      setSlots(await slotsResponse.json());
      setBookings(await bookingsResponse.json());
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedTime("");
    loadData();
  }, [date, resource]);

  async function createBooking(e) {
    e.preventDefault();

    if (!selectedTime) {
      setMessage("Please select a time slot.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          date,
          resource,
          time: selectedTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Booking failed");
      }

      setName("");
      setEmail("");
      setSelectedTime("");
      await loadData();
      setMessage("Your reservation has been confirmed successfully!");
    } catch (error) {
      setMessage(error.message);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelBooking(id) {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/api/bookings/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Cancellation failed");

      await loadData();
      setMessage("Reservation cancelled successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-slate-950 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Book<span className="text-indigo-400">Space</span>
            </h1>
            <p className="text-xs text-slate-400">Smart Reservation System</p>
          </div>
          <span className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold">
            Meeting Room Booking
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-9">
          <p className="mb-2 font-semibold uppercase tracking-widest text-indigo-600">
            Easy Online Reservations
          </p>
          <h2 className="text-3xl font-extrabold md:text-4xl">
            Find your perfect meeting space.
          </h2>
          <p className="mt-3 text-slate-500">
            Choose a room, select an available time, and reserve your space in seconds.
          </p>
        </div>

        {message && (
          <div role="status" className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4 font-medium text-indigo-800">
            {message}
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl bg-white p-7 shadow-sm">
              <h3 className="mb-6 text-xl font-bold">1. Choose your space</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Meeting Room</span>
                  <select
                    value={resource}
                    onChange={(e) => setResource(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-indigo-500"
                  >
                    {resources.map((room) => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Reservation Date</span>
                  <input
                    type="date"
                    value={date}
                    min={today()}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 outline-indigo-500"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-7 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold">2. Select available time</h3>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  {slots.length} available
                </span>
              </div>

              {loading ? (
                <p className="text-slate-500">Loading availability...</p>
              ) : slots.length === 0 ? (
                <p className="text-slate-500">No available slots for this date.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {slots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-xl border-2 p-4 font-semibold transition ${
                        selectedTime === time
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-200 bg-white hover:border-indigo-500 hover:text-indigo-600"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-7 shadow-sm">
              <h3 className="mb-5 text-xl font-bold">3. Your booking details</h3>

              <form onSubmit={createBooking} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Full Name</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-300 p-3 outline-indigo-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Email Address</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full rounded-xl border border-slate-300 p-3 outline-indigo-500"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!selectedTime || submitting || loading}
                  className="w-full rounded-xl bg-indigo-600 p-4 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Reservation"}
                </button>
              </form>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-slate-950 p-7 text-white shadow-sm">
              <h3 className="mb-5 text-xl font-bold">Booking Summary</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-400">Selected Room</p>
                  <p className="mt-1 font-semibold">{resource}</p>
                </div>
                <div>
                  <p className="text-slate-400">Date</p>
                  <p className="mt-1 font-semibold">{date}</p>
                </div>
                <div>
                  <p className="text-slate-400">Time</p>
                  <p className="mt-1 font-semibold">
                    {selectedTime || "Not selected"}
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-xl bg-slate-800 p-4 text-sm text-slate-300">
                All reservations are subject to availability.
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold">Reservations</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                  {bookings.length}
                </span>
              </div>

              {bookings.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No reservations for this room and date.
                </p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="font-bold">{booking.name}</p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {booking.email}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-indigo-600">
                        {booking.time}
                      </p>
                      <button
                        type="button"
                        onClick={() => cancelBooking(booking.id)}
                        className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>

        <footer className="mt-12 text-center text-sm text-slate-500">
          BookSpace — Full-Stack Booking & Reservation System
        </footer>
      </main>
    </div>
  );
}
