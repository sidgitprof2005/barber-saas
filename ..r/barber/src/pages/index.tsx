import { useEffect, useState } from "react";

export default function Home() {
  const [shop, setShop] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/shop/me")
      .then(res => res.json())
      .then(data => setShop(data.shop));

    fetch("/api/shop/services")
      .then(res => res.json())
      .then(data => setServices(data.services));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>{shop?.name}</h1>

      <h2>Services</h2>
      {services.map(s => (
        <div key={s.id} style={{ marginBottom: 10 }}>
          <b>{s.name}</b> – ₹{s.price} – {s.duration_minutes} mins  
          <br />
          <a href={`/book?serviceId=${s.id}`}>Book</a>
        </div>
      ))}
    </div>
  );
}