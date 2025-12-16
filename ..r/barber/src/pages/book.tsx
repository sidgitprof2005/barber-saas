import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Book() {
  const router = useRouter();
  const { serviceId } = router.query;

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);

  async function loadSlots() {
    const res = await fetch(
      `/api/shop/availability?date=${date}&serviceId=${serviceId}`
    );
    const data = await res.json();
    setSlots(data.slots);
  }

  async function bookSlot(startTime: string) {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/shop/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ serviceId, startTime }),
    });

    const data = await res.json();
    alert("Booking created, proceed to payment");
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Book Appointment</h1>

      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
      />
      <button onClick={loadSlots}>Check Availability</button>

      <h3>Available Slots</h3>
      {slots.map(s => (
        <div key={s}>
          {new Date(s).toLocaleTimeString()}
          <button onClick={() => bookSlot(s)}>Book</button>
        </div>
      ))}
    </div>
  );
}