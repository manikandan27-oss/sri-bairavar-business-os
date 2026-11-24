"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  BusFront, CalendarDays, IndianRupee, LayoutDashboard, Plus,
  Search, Languages, LogOut, ArrowLeft, Pencil, Save
} from "lucide-react";

type Booking = {
  id: string;
  booking_ref: string;
  customer_name: string;
  customer_phone: string;
  service_type: string;
  pickup: string;
  destination: string;
  pickup_at: string;
  passengers: number;
  customer_amount: number;
  vendor_cost: number;
  booking_status: string;
  payment_status: string;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient | null = null;
if (url && key) supabase = createClient(url, key);

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState<"en" | "ta">("en");
  const [showForm, setShowForm] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);

  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    service_type: "Outstation",
    pickup: "",
    destination: "",
    pickup_at: "",
    passengers: 1,
    customer_amount: 0,
    vendor_cost: 0
  });

  const [editForm, setEditForm] = useState({
    customer_name: "",
    customer_phone: "",
    service_type: "",
    pickup: "",
    destination: "",
    pickup_at: "",
    passengers: 1,
    customer_amount: 0,
    vendor_cost: 0,
    booking_status: "NEW",
    payment_status: "UNPAID"
  });

  const t = (en: string, ta: string) => lang === "en" ? en : ta;

  function localDateTime(value: string) {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  async function load() {
    if (!supabase) {
      setError("Supabase configuration missing. Add the project URL and publishable key.");
      setLoading(false);
      return;
    }

    const { data: { session: s } } = await supabase.auth.getSession();
    setSession(s);

    if (!s) {
      setLoading(false);
      return;
    }

    const { data, error: e } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (e) setError(e.message);
    else setRows((data || []) as Booking[]);

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, newSession) => {
        if (event === "PASSWORD_RECOVERY") {
          setSession(newSession);
          setRecoveryMode(true);
          setError("");
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    const fd = new FormData(e.currentTarget);

    const { error: e2 } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password"))
    });

    if (e2) setError(e2.message);
    else {
      setError("");
      await load();
    }
  }

  async function updatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const { error: e2 } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (e2) {
      setError(e2.message);
      return;
    }

    setRecoveryMode(false);
    setNewPassword("");
    setConfirmPassword("");
    setError("Password updated successfully. Please sign in.");

    await supabase.auth.signOut();
    setSession(null);
  }

  async function createBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Please sign in again.");
      return;
    }

    const payload = {
      ...form,
      passengers: Number(form.passengers),
      customer_amount: Number(form.customer_amount),
      vendor_cost: Number(form.vendor_cost),
      owner_id: user.id,
      booking_status: "NEW",
      payment_status: "UNPAID"
    };

    const { error: e2 } = await supabase.from("bookings").insert(payload);

    if (e2) {
      setError(e2.message);
      return;
    }

    setShowForm(false);
    setForm({
      customer_name: "",
      customer_phone: "",
      service_type: "Outstation",
      pickup: "",
      destination: "",
      pickup_at: "",
      passengers: 1,
      customer_amount: 0,
      vendor_cost: 0
    });

    setError("");
    await load();
  }

  function openBooking(r: Booking) {
    setSelectedBooking(r);
    setEditingBooking(false);
    setError("");
  }

  function startEditing() {
    if (!selectedBooking) return;

    setEditForm({
      customer_name: selectedBooking.customer_name || "",
      customer_phone: selectedBooking.customer_phone || "",
      service_type: selectedBooking.service_type || "",
      pickup: selectedBooking.pickup || "",
      destination: selectedBooking.destination || "",
      pickup_at: selectedBooking.pickup_at
        ? localDateTime(selectedBooking.pickup_at)
        : "",
      passengers: Number(selectedBooking.passengers || 1),
      customer_amount: Number(selectedBooking.customer_amount || 0),
      vendor_cost: Number(selectedBooking.vendor_cost || 0),
      booking_status: selectedBooking.booking_status || "NEW",
      payment_status: selectedBooking.payment_status || "UNPAID"
    });

    setEditingBooking(true);
    setError("");
  }

  async function saveBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!supabase || !selectedBooking) return;

    setSavingBooking(true);
    setError("");

    const payload = {
      ...editForm,
      passengers: Number(editForm.passengers),
      customer_amount: Number(editForm.customer_amount),
      vendor_cost: Number(editForm.vendor_cost),
      pickup_at: new Date(editForm.pickup_at).toISOString()
    };

    const { data, error: e2 } = await supabase
      .from("bookings")
      .update(payload)
      .eq("id", selectedBooking.id)
      .select()
      .single();

    setSavingBooking(false);

    if (e2) {
      setError(e2.message);
      return;
    }

    const updated = data as Booking;

    setRows(prev => prev.map(r =>
      r.id === updated.id ? updated : r
    ));

    setSelectedBooking(updated);
    setEditingBooking(false);
    setError("");
  }

  async function logout() {
    await supabase?.auth.signOut();
    setSession(null);
    setRows([]);
    setSelectedBooking(null);
    setEditingBooking(false);
  }

  const filtered = useMemo(
    () => rows.filter(r =>
      (
        r.booking_ref + " " +
        r.customer_name + " " +
        r.customer_phone + " " +
        r.destination
      ).toLowerCase().includes(search.toLowerCase())
    ),
    [rows, search]
  );

  const money = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(n || 0);

  if (recoveryMode) {
    return (
      <main className="login-wrap">
        <section className="login-card">
          <div className="brand-mark">ॐ</div>
          <p className="eyebrow">SRI BAIRAVAR TOURS & TRAVELS</p>
          <h1>Set New Password</h1>

          <form onSubmit={updatePassword} className="stack">
            <label>New Password
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </label>

            <label>Confirm Password
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </label>

            <button className="primary">Update Password</button>
          </form>

          {error && <p className="error">{error}</p>}
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="login-wrap">
        <section className="login-card">
          <div className="brand-mark">ॐ</div>
          <p className="eyebrow">SRI BAIRAVAR TOURS & TRAVELS</p>
          <h1>{t("Owner login", "உரிமையாளர் உள்நுழைவு")}</h1>
          <p className="muted">
            {t("Private business management", "தனிப்பட்ட வணிக மேலாண்மை")}
          </p>

          <form onSubmit={login} className="stack">
            <label>Email
              <input name="email" type="email" required placeholder="owner@example.com" />
            </label>

            <label>Password
              <input name="password" type="password" required placeholder="Your secure password" />
            </label>

            <button className="primary">Sign in / உள்நுழை</button>
          </form>

          <button
            className="link-btn"
            onClick={() => setLang(lang === "en" ? "ta" : "en")}
          >
            <Languages size={16} /> {t("தமிழ்", "English")}
          </button>

          {error && <p className="error">{error}</p>}

          <p className="tiny">
            Admin accounts must be created privately in Supabase. Public sign-up is disabled.
          </p>
        </section>
      </main>
    );
  }

  const total = rows.reduce(
    (s, r) => s + Number(r.customer_amount || 0),
    0
  );

  if (selectedBooking) {
    const b = selectedBooking;

    return (
      <main className="shell">
        <section className="main">
          <header className="topbar">
            <div>
              <p className="eyebrow">SRI BAIRAVAR BUSINESS OS</p>
              <h1>Booking Details</h1>
              <p className="muted">{b.booking_ref}</p>
            </div>

            <button
              className="secondary"
              onClick={() => {
                setSelectedBooking(null);
                setEditingBooking(false);
                setError("");
              }}
            >
              <ArrowLeft size={17} /> Back to Bookings
            </button>
          </header>

          {error && <div className="notice">{error}</div>}

          {editingBooking ? (
            <form className="modal stack" onSubmit={saveBooking}>
              <div className="section-head">
                <h2>Edit Booking</h2>
                <button
                  type="button"
                  className="close"
                  onClick={() => {
                    setEditingBooking(false);
                    setError("");
                  }}
                >
                  ×
                </button>
              </div>

              <h3>Customer Details</h3>

              <label>Customer Name
                <input
                  required
                  value={editForm.customer_name}
                  onChange={e => setEditForm({ ...editForm, customer_name: e.target.value })}
                />
              </label>

              <label>Mobile Number
                <input
                  required
                  value={editForm.customer_phone}
                  onChange={e => setEditForm({ ...editForm, customer_phone: e.target.value })}
                />
              </label>

              <h3>Journey Details</h3>

              <label>Service Type
                <select
                  value={editForm.service_type}
                  onChange={e => setEditForm({ ...editForm, service_type: e.target.value })}
                >
                  <option>Local</option>
                  <option>Outstation</option>
                  <option>Airport</option>
                  <option>Tour Package</option>
                  <option>Corporate</option>
                </select>
              </label>

              <div className="two">
                <label>Pickup
                  <input
                    required
                    value={editForm.pickup}
                    onChange={e => setEditForm({ ...editForm, pickup: e.target.value })}
                  />
                </label>

                <label>Destination
                  <input
                    required
                    value={editForm.destination}
                    onChange={e => setEditForm({ ...editForm, destination: e.target.value })}
                  />
                </label>
              </div>

              <label>Pickup Date and Time
                <input
                  required
                  type="datetime-local"
                  value={editForm.pickup_at}
                  onChange={e => setEditForm({ ...editForm, pickup_at: e.target.value })}
                />
              </label>

              <label>Passengers
                <input
                  type="number"
                  min="1"
                  value={editForm.passengers}
                  onChange={e => setEditForm({ ...editForm, passengers: Number(e.target.value) })}
                />
              </label>

              <h3>Financial Details</h3>

              <label>Customer Price (₹)
                <input
                  type="number"
                  min="0"
                  value={editForm.customer_amount}
                  onChange={e => setEditForm({ ...editForm, customer_amount: Number(e.target.value) })}
                />
              </label>

              <label>Vendor Cost (₹)
                <input
                  type="number"
                  min="0"
                  value={editForm.vendor_cost}
                  onChange={e => setEditForm({ ...editForm, vendor_cost: Number(e.target.value) })}
                />
              </label>

              <h3>Booking Status</h3>

              <label>Booking Status
                <select
                  value={editForm.booking_status}
                  onChange={e => setEditForm({ ...editForm, booking_status: e.target.value })}
                >
                  <option value="NEW">NEW</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </label>

              <label>Payment Status
                <select
                  value={editForm.payment_status}
                  onChange={e => setEditForm({ ...editForm, payment_status: e.target.value })}
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PARTIAL">PARTIAL</option>
                  <option value="PAID">PAID</option>
                </select>
              </label>

              <div className="actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setEditingBooking(false)}
                >
                  Cancel
                </button>

                <button className="primary" disabled={savingBooking}>
                  <Save size={17} />
                  {savingBooking ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="section-head">
                <h2>Booking Reference: {b.booking_ref}</h2>
                <button className="primary" onClick={startEditing}>
                  <Pencil size={17} /> Edit Booking
                </button>
              </div>

              <div className="stats">
                <article>
                  <span>Booking Status</span>
                  <strong>{b.booking_status}</strong>
                </article>
                <article>
                  <span>Payment Status</span>
                  <strong>{b.payment_status}</strong>
                </article>
                <article>
                  <span>Passengers</span>
                  <strong>{b.passengers}</strong>
                </article>
              </div>

              <div className="stats">
                <article>
                  <h3>Customer Details</h3>
                  <p><b>Name:</b> {b.customer_name}</p>
                  <p><b>Mobile:</b> {b.customer_phone}</p>
                </article>

                <article>
                  <h3>Journey Details</h3>
                  <p><b>Service:</b> {b.service_type}</p>
                  <p><b>Pickup:</b> {b.pickup}</p>
                  <p><b>Destination:</b> {b.destination}</p>
                  <p>
                    <b>Date:</b>{" "}
                    {b.pickup_at
                      ? new Date(b.pickup_at).toLocaleString("en-IN")
                      : "—"}
                  </p>
                </article>
              </div>

              <div className="stats">
                <article>
                  <h3>Financial Details</h3>
                  <p><b>Customer Price:</b> {money(Number(b.customer_amount))}</p>
                  <p><b>Vendor Cost:</b> {money(Number(b.vendor_cost))}</p>
                  <p>
                    <b>Estimated Difference:</b>{" "}
                    {money(Number(b.customer_amount) - Number(b.vendor_cost))}
                  </p>
                </article>

                <article>
                  <h3>Booking Information</h3>
                  <p><b>Reference:</b> {b.booking_ref}</p>
                  <p><b>Booking Status:</b> {b.booking_status}</p>
                  <p><b>Payment Status:</b> {b.payment_status}</p>
                </article>
              </div>

              <button
                className="secondary"
                onClick={() => setSelectedBooking(null)}
              >
                <ArrowLeft size={17} /> Back to Booking Register
              </button>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark small">ॐ</span>
          <div>
            <b>SRI BAIRAVAR</b>
            <small>TOURS & TRAVELS</small>
          </div>
        </div>

        <nav>
          <a className="active"><LayoutDashboard size={18} />{t("Dashboard", "முகப்பு")}</a>
          <a><CalendarDays size={18} />{t("Bookings", "முன்பதிவுகள்")}</a>
          <a><BusFront size={18} />{t("Vehicles & vendors", "வாகனங்கள் & உரிமையாளர்கள்")}</a>
          <a><IndianRupee size={18} />{t("Payments", "பணம்")}</a>
        </nav>

        <button className="logout" onClick={logout}>
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      <section className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">OWNER CONTROL PANEL</p>
            <h1>{t("Business dashboard", "வணிக முகப்பு")}</h1>
          </div>

          <button
             

