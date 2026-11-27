"use client";

import React, { useMemo, useState } from "react";

type ServiceMode = "rental" | "call_driver";
type CallDriverType = "outstation" | "full_day_city" | "hourly_city";

interface VehicleSpec {
  id: string;
  name: string;
  seats: string;
  baseFare: number;
  perKm: number;
  dailyKmCoverage: number | null;
  driverAllowancePerDay: number;
}

const VEHICLE_RATES: Record<string, VehicleSpec> = {
  sedan: {
    id: "sedan",
    name: "4-Seater Sedan",
    seats: "4 Seats",
    baseFare: 2500,
    perKm: 16,
    dailyKmCoverage: 100,
    driverAllowancePerDay: 900,
  },
  suv_hatchback: {
    id: "suv_hatchback",
    name: "4–7 Seater SUV / Hatchback",
    seats: "4–7 Seats",
    baseFare: 5000,
    perKm: 23,
    dailyKmCoverage: 100,
    driverAllowancePerDay: 900,
  },
  van: {
    id: "van",
    name: "7–18 Seater Van / Tempo",
    seats: "7–18 Seats",
    baseFare: 9900,
    perKm: 35,
    dailyKmCoverage: null,
    driverAllowancePerDay: 900,
  },
  deluxe_bus: {
    id: "deluxe_bus",
    name: "35-Seater Deluxe Bus",
    seats: "35 Seats",
    baseFare: 16900,
    perKm: 45,
    dailyKmCoverage: 200,
    driverAllowancePerDay: 900,
  },
  ultra_deluxe_bus: {
    id: "ultra_deluxe_bus",
    name: "54-Seater Ultra Deluxe Bus",
    seats: "54 Seats",
    baseFare: 22900,
    perKm: 75,
    dailyKmCoverage: null,
    driverAllowancePerDay: 900,
  },
};

export default function SriBairavarHomePage() {
  const [serviceMode, setServiceMode] = useState<ServiceMode>("rental");

  // Vehicle Rental State
  const [vehicleKey, setVehicleKey] = useState<string>("sedan");
  const [days, setDays] = useState<number>(1);
  const [estimatedKm, setEstimatedKm] = useState<number>(150);

  // Call Driver State
  const [callDriverType, setCallDriverType] = useState<CallDriverType>("outstation");
  const [outstationKm, setOutstationKm] = useState<number>(300);
  const [travelAllowance, setTravelAllowance] = useState<number>(500);
  const [foodAllowance, setFoodAllowance] = useState<number>(300);
  const [hoursBooked, setHoursBooked] = useState<number>(4);
  const [extraHoursBeyond12, setExtraHoursBeyond12] = useState<number>(0);

  // Customer Enquiry State
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [pickupDrop, setPickupDrop] = useState<string>("");
  const [submittedNote, setSubmittedNote] = useState<string>("");

  const selectedVehicle = VEHICLE_RATES[vehicleKey] || VEHICLE_RATES.sedan;

  const rentalBreakdown = useMemo(() => {
    const safeDays = Math.max(1, Number(days) || 1);
    const safeKm = Math.max(0, Number(estimatedKm) || 0);

    const baseTotal = selectedVehicle.baseFare * safeDays;
    const includedKm = selectedVehicle.dailyKmCoverage
      ? selectedVehicle.dailyKmCoverage * safeDays
      : 0;
    const chargeableKm = selectedVehicle.dailyKmCoverage
      ? Math.max(0, safeKm - includedKm)
      : safeKm;
    const kmCharges = chargeableKm * selectedVehicle.perKm;
    const driverTotal = selectedVehicle.driverAllowancePerDay * safeDays;
    const grandTotal = baseTotal + kmCharges + driverTotal;

    return {
      safeDays,
      safeKm,
      baseTotal,
      includedKm,
      chargeableKm,
      kmCharges,
      driverTotal,
      grandTotal,
    };
  }, [selectedVehicle, days, estimatedKm]);

  const callDriverBreakdown = useMemo(() => {
    if (callDriverType === "outstation") {
      const safeKm = Math.max(0, Number(outstationKm) || 0);
      const safeAllowance = Math.max(0, Number(travelAllowance) || 0);
      const baseFare = 2500;
      const extraBlocks = safeKm > 750 ? Math.ceil((safeKm - 750) / 50) : 0;
      const extraKmCharge = extraBlocks * 100;
      const total = baseFare + extraKmCharge + safeAllowance;

      return {
        label: "Outstation Call Driver (Point-to-Point)",
        baseFare,
        extraCharge: extraKmCharge,
        allowance: safeAllowance,
        allowanceLabel: "Travel Allowance",
        total,
        detailText:
          safeKm <= 750
            ? "Within 750 km slab (₹2,500 flat + travel allowance)"
            : `${extraBlocks} extra 50 km block(s) above 750 km (@ ₹100 / 50 km)`,
      };
    }

    if (callDriverType === "full_day_city") {
      const safeFood = Math.max(0, Number(foodAllowance) || 0);
      const baseFare = 2500;
      const total = baseFare + safeFood;
      return {
        label: "Full-Day Within City Call Driver",
        baseFare,
        extraCharge: 0,
        allowance: safeFood,
        allowanceLabel: "Food Allowance",
        total,
        detailText: "Full-day city duty (₹2,500 + food allowance)",
      };
    }

    const safeHours = Math.max(1, Number(hoursBooked) || 1);
    const safeExtraHours = Math.max(0, Number(extraHoursBeyond12) || 0);
    const baseFare = safeHours * 350;
    const extraCharge = safeExtraHours * 100;
    const total = baseFare + extraCharge;

    return {
      label: "Hourly Within City Call Driver",
      baseFare,
      extraCharge,
      allowance: 0,
      allowanceLabel: "Allowance",
      total,
      detailText: `${safeHours} hr(s) @ ₹350/hr + ${safeExtraHours} extra hr(s) beyond 12 hrs @ ₹100/hr`,
    };
  }, [
    callDriverType,
    outstationKm,
    travelAllowance,
    foodAllowance,
    hoursBooked,
    extraHoursBeyond12,
  ]);

  const activeTotal =
    serviceMode === "rental"
      ? rentalBreakdown.grandTotal
      : callDriverBreakdown.total;

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setSubmittedNote("Please enter your name and mobile number.");
      return;
    }

    const summary =
      serviceMode === "rental"
        ? `${selectedVehicle.name} (${rentalBreakdown.safeDays}d, ${rentalBreakdown.safeKm} km) — Est. ₹${rentalBreakdown.grandTotal.toLocaleString("en-IN")}`
        : `${callDriverBreakdown.label} — Est. ₹${callDriverBreakdown.total.toLocaleString("en-IN")}`;

    const message = encodeURIComponent(
      `Hello Sri Bairavar Tours & Travels,\nName: ${customerName}\nPhone: ${customerPhone}\nRoute/Details: ${pickupDrop || "Not specified"}\nQuotation: ${summary}\n(Excludes fuel, tollgate, permit & parking)`
    );

    setSubmittedNote(
      `Enquiry prepared for ${customerName}. Opening WhatsApp quotation chat...`
    );
    window.open(`https://wa.me/917708770417?text=${message}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#F7F5EE] text-[#222625]">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#C9A23F]/30 bg-[#0E3B2E] text-[#F7F5EE]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#E3BE5A] uppercase">
              Chennai • Tamil Nadu
            </p>
            <h1 className="text-xl font-bold tracking-wide text-white sm:text-2xl">
              Sri Bairavar Tours &amp; Travels
            </h1>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <a
              href="#fleet"
              className="rounded px-3 py-1.5 text-[#F7F5EE]/90 transition hover:bg-white/10 hover:text-[#E3BE5A]"
            >
              Fleet &amp; Tariffs
            </a>
            <a
              href="#quoter"
              className="rounded px-3 py-1.5 text-[#F7F5EE]/90 transition hover:bg-white/10 hover:text-[#E3BE5A]"
            >
              Instant Quote
            </a>
            <a
              href="tel:+917708770417"
              className="rounded-md bg-[#C9A23F] px-4 py-2 font-semibold text-[#181B1A] transition hover:bg-[#D9B452]"
            >
              +91 77087 70417
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#0E3B2E] px-4 pt-10 pb-14 text-white sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <span className="inline-block rounded-full border border-[#C9A23F]/60 bg-[#144C3B] px-3.5 py-1 text-xs font-medium tracking-wider text-[#E3BE5A]">
              RELIABLE TRANSPORT • GROUP TOURS • CALL DRIVERS
            </span>
            <h2 className="text-3xl leading-tight font-bold sm:text-5xl">
              Comfortable Journeys Across{" "}
              <span className="text-[#E3BE5A]">South India</span>
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-[#E9E6DC] sm:text-lg">
              From 4-seater sedans and SUVs to 35-seater deluxe buses, 54-seater
              ultra deluxe coaches, and experienced call drivers — transparent
              tariffs and prompt service from Chennai.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#quoter"
                className="rounded-lg bg-[#C9A23F] px-5 py-3 text-sm font-bold text-[#181B1A] shadow transition hover:bg-[#D9B452]"
              >
                Calculate Quotation
              </a>
              <a
                href="https://www.facebook.com/share/18yy96QWf1/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[#E3BE5A]/50 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Facebook Page
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-[#C9A23F]/40 bg-[#144738] p-6 shadow-xl lg:col-span-5">
            <h3 className="text-sm font-semibold tracking-wider text-[#E3BE5A] uppercase">
              Service Highlights
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[#F7F5EE]">
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#E3BE5A]" />
                <span>
                  Uniform <strong>₹900/day</strong> driver allowance across all
                  rental vehicle categories
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#E3BE5A]" />
                <span>
                  Outstation, full-day city &amp; hourly call driver packages
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#E3BE5A]" />
                <span>
                  Corporate travel, family trips, resorts &amp; multi-stop routes
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#E3BE5A]" />
                <span>
                  Direct desk support: <strong>kt.manikandan74@gmail.com</strong>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Instant Quotation Engine */}
      <section id="quoter" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-[#D8D2C2] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ECE8DD] pb-6">
            <div>
              <p className="text-xs font-bold tracking-widest text-[#0E3B2E] uppercase">
                Live Tariff Estimator
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#1E2322]">
                Instant Quotation Calculator
              </h2>
            </div>

            <div className="inline-flex rounded-xl bg-[#F3F0E6] p-1">
              <button
                type="button"
                onClick={() => setServiceMode("rental")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  serviceMode === "rental"
                    ? "bg-[#0E3B2E] text-[#E3BE5A] shadow"
                    : "text-[#222625] hover:text-[#0E3B2E]"
                }`}
              >
                Vehicle Rental
              </button>
              <button
                type="button"
                onClick={() => setServiceMode("call_driver")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  serviceMode === "call_driver"
                    ? "bg-[#0E3B2E] text-[#E3BE5A] shadow"
                    : "text-[#222625] hover:text-[#0E3B2E]"
                }`}
              >
                Call Driver
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            {/* Inputs Column */}
            <div className="space-y-5 lg:col-span-7">
              {serviceMode === "rental" ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#222625]">
                      Select Vehicle Category
                    </label>
                    <select
                      value={vehicleKey}
                      onChange={(e) => setVehicleKey(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#CFC9B8] bg-[#FAF8F3] px-4 py-3 text-sm font-medium text-[#1E2322] focus:border-[#0E3B2E] focus:outline-none"
                    >
                      {Object.values(VEHICLE_RATES).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} — Base ₹{v.baseFare.toLocaleString("en-IN")} + ₹
                          {v.perKm}/km
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-[#222625]">
                        Number of Days
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={days}
                        onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
                        className="mt-2 w-full rounded-xl border border-[#CFC9B8] bg-[#FAF8F3] px-4 py-3 text-sm font-medium focus:border-[#0E3B2E] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#222625]">
                        Total Estimated Distance (km)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={estimatedKm}
                        onChange={(e) =>
                          setEstimatedKm(Math.max(0, Number(e.target.value)))
                        }
                        className="mt-2 w-full rounded-xl border border-[#CFC9B8] bg-[#FAF8F3] px-4 py-3 text-sm font-medium focus:border-[#0E3B2E] focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#222625]">
                      Call Driver Package
                    </label>
                    <select
                      value={callDriverType}
                      onChange={(e) =>
                        setCallDriverType(e.target.value as CallDriverType)
                      }
                      className="mt-2 w-full rounded-xl border border-[#CFC9B8] bg-[#FAF8F3] px-4 py-3 text-sm font-medium text-[#1E2322] focus:border-[#0E3B2E] focus:outline-none"
                    >
                      <option value="outstation">
                        Outstation (Point-to-Point: ₹2,500 + Allowance)
                      </option>
                      <option value="full_day_city">
                        Within City Full Day (₹2,500 + Food Allowance)
                      </option>
                      <option value="hourly_city">
                        Within City Hourly (₹350/hr; +₹100/hr beyond 12 hrs)
                      </option>
                    </select>
                  </div>

                  {callDriverType === "outstation" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-[#222625]">
                          Trip Distance (km)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={outstationKm}
                          onChange={(e) =>
                            setOutstationKm(Math.max(0, Number(e.target.value)))
                          }
                          className="mt-2 w-full rounded-xl border border-[#CFC9B8] bg-[#FAF8F3] px-4 py-3 text-sm font-medium focus:border-[#0E3B2E] focus:outline-none"
                        />
                        <p className="mt-1 text-xs text-[#555C5A]">
                          Below 750 km: ₹2,500 flat. Every extra 50 km: +₹100.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#222625]">
                          Travel Allowance (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={travelAllowance}
                          onChange={(e) =>
                            setTravelAllowance(Math.max(0, Number(e.target.value)))
                          }
                          className="mt-2 w-full rounded-xl border border-[#CFC9B8] bg-[#FAF8F3] px-4 py-3 text-sm font-medium focus:border-[#0E3B2E] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {callDriverType === "full_day_city" && (
                    <div>
                      <label className="block text-sm font-semibold text-[#222625]">
                        Food Allowance (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={foodAllowance}
                        onChange={(e) =>
                          setFoodAllowance(Math.max(0, Number(e.target.value)))
                        }
                        className="mt-2 w-full rounded-xl border border-[#CFC9B8] bg-[#FAF8F3] px-4 py-3 text-sm font-medium focus:border-[#0E3B2E] focus:outline-none"
                      />
                    </div>
                  )}

                  {callDriverType === "hourly_city" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-[#222625]">
                          Hours Booked (@ ₹350/hr)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={hoursBooked}
                          onChange={(e) =>
                            setHoursBooked(Math.max(1, Number(e.target.value)))
                          }
                          className="mt-2 w-full rounded-xl border border-[#CFC9B8] bg-[#FAF8F3] px-4 py-3 text-sm font-medium focus:border-[#0E3B2E] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label