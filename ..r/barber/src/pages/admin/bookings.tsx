import { useEffect, useState } from "react";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("/api/shop/bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setBookings(data.bookings));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Bookings</h1>

      {bookings.map(b => (
        <div key={b.id} style={{ marginBottom: 10 }}>
          <b>{b.service_name}</b>  
          <br />
          {new Date(b.start_time).toLocaleString()}  
          <br />
          Customer: {b.customer_name}  
          <br />
          Status: {b.status} | Payment: {b.payment_status}
        </div>
      ))}
    </div>
  );
}