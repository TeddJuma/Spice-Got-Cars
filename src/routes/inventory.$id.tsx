import { useState, useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Car as CarIcon,
  FileCheck,
  Phone,
  MessageCircle,
  ArrowLeft,
  Timer,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { formatKes, formatMileage, getAuctionStatus } from "@/data/listings";
import { fetchListingById } from "@/data/listings-supabase";
import { buildCarInquiryLink, PHONE_TEL, WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/$id")({
  loader: async ({ params }) => {
    try {
      const car = await fetchListingById(params.id);
      if (!car) {
        throw notFound();
      }
      return { car };
    } catch (err) {
      console.error("Server loader failed:", err);
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    const car = loaderData?.car;
    if (!car) {
      return { meta: [{ title: "Listing not found - Spice Got Cars" }] };
    }
    const title = `${car.year} ${car.make} ${car.model} - ${formatKes(car.priceKes)} | Spice Got Cars`;
    const desc = `${car.condition}. ${formatMileage(car.mileageKm)}, ${car.transmission}, ${car.fuelType}. Listed in Kahawa west by Spice Got Cars.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: car.photos?.[0] || "" },
        { name: "twitter:image", content: car.photos?.[0] || "" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Listing not found</h1>
      <p className="mt-2 text-brand-muted">
        This car may have been sold or removed.
      </p>
      <Link
        to="/inventory"
        className="mt-6 inline-block rounded-lg bg-brand-navy px-5 py-2 text-sm font-bold text-white"
      >
        Back to inventory
      </Link>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    console.error(error);
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-brand-muted">{error?.message || "Unknown error"}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-brand-navy px-5 py-2 text-sm font-bold text-white"
        >
          Try again
        </button>
      </div>
    );
  },
  component: CarDetailPage,
});

function CarDetailPage() {
  const { car } = Route.useLoaderData();
  const [activePhoto, setActivePhoto] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  if (!car) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Listing not found</h1>
        <p className="mt-2 text-brand-muted">This car may have been sold or removed.</p>
        <Link
          to="/inventory"
          className="mt-6 inline-block rounded-lg bg-brand-navy px-5 py-2 text-sm font-bold text-white"
        >
          Back to inventory
        </Link>
      </div>
    );
  }

  const isSold = car.status === "sold";
  const isReserved = car.status === "reserved";
  const isAuction = car.isAuction && !isSold;
  const auctionStatus = getAuctionStatus(car);
  const supabase = createClient();

  const backTo = isAuction ? "/auction/" : "/inventory";
  const backLabel = isAuction ? "Back to auction" : "Back to inventory";

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryPhone.trim()) return;
    setInquirySubmitting(true);
    try {
      const { error } = await supabase.from("inquiries").insert({
        listing_id: car.id,
        name: inquiryName.trim(),
        phone: inquiryPhone.trim(),
      });
      if (error) throw error;
      setInquirySuccess(true);
    } catch (err) {
      console.error("Inquiry failed:", err);
      alert("Failed to submit inquiry. Please try again.");
    } finally {
      setInquirySubmitting(false);
    }
  };

  useEffect(() => {
    if (!isAuction || !car.auctionWindows || car.auctionWindows.length === 0) {
      setTimeLeft("");
      return;
    }
    const tick = () => {
      const now = new Date();
      const activeWindow = car.auctionWindows?.find(w => {
        const start = new Date(w.startsAt);
        const end = new Date(w.endsAt);
        return now >= start && now < end;
      });
      if (!activeWindow) {
        setTimeLeft("");
        return;
      }
      const end = new Date(activeWindow.endsAt);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("Ending...");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isAuction, car.auctionWindows]);

  const displayPrice = isAuction
    ? car.currentBidKes ?? car.startingBidKes ?? car.priceKes
    : car.priceKes;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-10">
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-brand-navy"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Gallery */}
        <div>
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-slate-200 bg-white",
              isSold && "grayscale",
            )}
          >
            <img
              src={car.photos[activePhoto] || car.photos?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' fill='%23e2e8f0'%3E%3Crect width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='24'%3ENo Photo%3C/text%3E%3C/svg%3E"}
              alt={`${car.year} ${car.make} ${car.model}`}
              width={1280}
              height={960}
              className="aspect-[4/3] w-full object-cover"
            />
            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center bg-brand-navy/40">
                <span className="rotate-[-8deg] rounded-lg border-2 border-brand-navy bg-white px-8 py-3 text-4xl font-black text-brand-navy shadow-2xl">
                  SOLD
                </span>
              </div>
            )}
            {isReserved && (
              <div className="absolute top-4 right-4 rounded bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Reserved
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-6 gap-2">
            {car.photos.map((src: string, i: number) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={cn(
                  "overflow-hidden rounded-md border-2 transition-all",
                  activePhoto === i
                    ? "border-brand-accent"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
                aria-label={`Show photo ${i + 1}`}
              >
                <img
                  src={src}
                  alt=""
                  width={200}
                  height={150}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="mb-3 text-xl font-bold">About the Car</h2>
              <p className="leading-relaxed text-slate-700">
                {car.description}
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold">
                Trust & documentation
              </h2>
              <ul className="space-y-2 text-sm">
                <TrustLine
                  ok={car.logbookVerified}
                  label="Logbook and ownership verified in-house"
                />
                <TrustLine
                  ok
                  label="Logbook transfer supported by Spice Got Cars team (buyer covers transfer costs)"
                />
              </ul>
            </section>
          </div>
        </div>

        {/* Sticky sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-muted">
              {car.condition}
            </div>
            <h1 className="text-2xl font-bold leading-tight text-brand-navy">
              {car.year} {car.make} {car.model}
              {car.trim && (
                <span className="text-brand-muted"> {car.trim}</span>
              )}
            </h1>

            {isAuction ? (
              <div className="mt-4 mb-6 space-y-3">
                <div className={`flex items-center gap-2 ${auctionStatus.label === "Live now" ? "text-emerald-700" : auctionStatus.label === "Paused" ? "text-amber-700" : "text-slate-500"}`}>
                  <Timer className="size-5" />
                  <span className="text-sm font-semibold">{auctionStatus.label === "Live now" ? "Time left" : auctionStatus.label === "Paused" ? "Status" : "Status"}</span>
                  {auctionStatus.label !== "Live now" && (
                    <span className="text-sm">{auctionStatus.description}</span>
                  )}
                </div>
                {auctionStatus.label === "Live now" ? (
                  <div className="text-xl font-black text-brand-navy">
                    {timeLeft || "Loading..."}
                  </div>
                ) : (
                  <div className={`text-xl font-black ${auctionStatus.label === "Ended" ? "text-slate-500" : "text-amber-700"}`}>
                    {auctionStatus.label === "Paused" ? "Paused" : "Ended"}
                  </div>
                )}
                <div className="text-3xl font-black text-brand-navy">
                  {formatKes(displayPrice)}
                </div>
                <div className="text-sm text-brand-muted">
                  {car.bidCount ?? 0} bids · Highest: {car.highestBidder ?? "No bids yet"}
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "mt-4 mb-6 text-3xl font-black",
                  isSold ? "text-brand-muted" : "text-brand-navy",
                )}
              >
                {formatKes(car.priceKes)}{" "}
                {car.negotiable && !isSold && (
                  <span className="text-sm font-normal text-brand-muted">
                    Negotiable
                  </span>
                )}
              </div>
            )}

            <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-brand-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {car.year}
              </span>
              <span className="flex items-center gap-1.5">
                <Gauge className="size-3.5" />
                {formatMileage(car.mileageKm)}
              </span>
              <span className="flex items-center gap-1.5">
                <Cog className="size-3.5" />
                {car.transmission}
              </span>
              <span className="flex items-center gap-1.5">
                <Fuel className="size-3.5" />
                {car.fuelType}
              </span>
              <span className="flex items-center gap-1.5">
                <CarIcon className="size-3.5" />
                {car.bodyType}
              </span>
              <span className="flex items-center gap-1.5">
                <FileCheck className="size-3.5" />
                {car.condition}
              </span>
            </div>

            {(car.location || car.locationPin) && (
              <div className="mb-6">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-muted">
                  Location
                </h3>
                {car.location && (
                  <p className="mb-2 text-sm text-brand-navy">{car.location}</p>
                )}
                <LocationMap locationPin={car.locationPin} location={car.location} />
              </div>
            )}

            {isSold ? (
              <div className="rounded-lg bg-slate-100 p-4 text-center text-sm font-semibold text-brand-muted">
                This car has been sold. Browse similar vehicles in our{" "}
                <Link to="/inventory" className="text-brand-accent underline">
                  inventory
                </Link>
                .
              </div>
            ) : isAuction ? (
              <AuctionBidForm listingId={car.id} currentBid={car.currentBidKes ?? car.startingBidKes ?? car.priceKes} />
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowInquiryModal(true)}
                  className="w-full rounded-lg bg-brand-navy py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-slate-800"
                >
                  Inquire about this car
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={buildCarInquiryLink(car)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2 text-xs font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    <MessageCircle className="size-3.5" />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${PHONE_TEL}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-navy py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                  >
                    <Phone className="size-3.5" />
                    Call
                  </a>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {isAuction && (
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Auction terms and conditions</h2>
              <div className="mt-4 space-y-3 text-sm text-brand-muted">
                <p>
                  <span className="font-bold text-brand-navy">Deposit:</span> A refundable deposit of <span className="font-bold">KES 5,000</span> is required to place a bid.
                </p>
                <p>
                  <span className="font-bold text-brand-navy">Payment:</span> Winners must complete full payment within <span className="font-bold">48 hours</span> of auction close.
                </p>
                <p>
                  <span className="font-bold text-brand-navy">Refunds:</span> Non-winning bidders receive full deposit refunds within 3 business days.
                </p>
                <p>
                  <span className="font-bold text-brand-navy">Bidding:</span> All bids are binding. By placing a bid, you agree to purchase the vehicle at your bid price if you are the highest bidder.
                </p>
              </div>
              <Link
                to="/terms"
                className="mt-6 inline-block rounded-lg bg-brand-navy px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
              >
                Read full terms and conditions
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl">
              <img
                src="/Hero Image.jpg"
                alt="Auction terms"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-brand-navy">Inquire about this car</h3>
            {inquirySuccess ? (
              <div className="mt-4 text-center">
                <p className="text-sm text-brand-muted">Our team will get back to you soon.</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowInquiryModal(false);
                    setInquirySuccess(false);
                    setInquiryName("");
                    setInquiryPhone("");
                  }}
                  className="mt-4 rounded-lg bg-brand-navy px-4 py-2 text-sm font-bold text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-brand-navy">Name</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-navy">Phone number</label>
                  <input
                    type="tel"
                    required
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowInquiryModal(false)}
                    className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-semibold text-brand-navy"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inquirySubmitting}
                    className="flex-1 rounded-lg bg-brand-navy py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {inquirySubmitting ? "Submitting..." : "Submit inquiry"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TrustLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2">
      <FileCheck
        className={cn(
          "mt-0.5 size-4 shrink-0",
          ok ? "text-brand-accent" : "text-slate-300",
        )}
      />
      <span className={ok ? "text-slate-700" : "text-brand-muted"}>{label}</span>
    </li>
  );
}

function AuctionBidForm({ listingId, currentBid }: { listingId: string; currentBid: number }) {
  const [amount, setAmount] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terms) {
      toast.error("Please accept the auction terms and conditions.");
      return;
    }
    const bidAmount = Number(amount);
    if (!bidAmount || bidAmount <= currentBid) {
      toast.error(`Bid must be higher than current bid (${formatKes(currentBid)}).`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("auction_bids").insert({
      listing_id: listingId,
      bid_amount: bidAmount,
      bidder_first_name: firstName,
      bidder_last_name: lastName,
      bidder_name: `${firstName} ${lastName}`,
      bidder_phone: phone,
      national_id: nationalId,
      payment_reference: paymentRef,
      terms_accepted: terms,
    });
    if (error) {
      toast.error("Failed to place bid. Try again.");
      console.error(error);
    } else {
      toast.success("Bid placed successfully!");
      setAmount("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setNationalId("");
      setPaymentRef("");
      setTerms(false);
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-brand-navy">Place a bid</h3>
      <div>
        <label className="block text-sm font-medium text-brand-navy">Bid amount (KES)</label>
        <input
          type="number"
          required
          min={currentBid + 1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
          placeholder={`Minimum: ${formatKes(currentBid + 1)}`}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-navy">First name</label>
        <input
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-navy">Last name</label>
        <input
          type="text"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-navy">Phone</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-navy">National ID</label>
        <input
          type="text"
          required
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-navy">Payment reference (M-PESA / Bank code)</label>
        <input
          type="text"
          required
          value={paymentRef}
          onChange={(e) => setPaymentRef(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
        />
        <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-brand-navy">Mobile Money Paybill: 714888</p>
          <p className="font-semibold text-brand-navy">Account Number: 134394</p>
          <p className="font-semibold text-brand-navy">Business Name: Spice Got Cars</p>
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          required
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className="mt-1"
        />
        <span>
          I agree to the auction terms and conditions. I understand that a refundable deposit of KES 5,000 is required to place this bid, and payment must be completed within 48 hours if I win.
        </span>
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-navy py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Place bid"}
      </button>
    </form>
  );
}

function LocationMap({ locationPin, location }: { locationPin?: string; location?: string }) {
  let embedSrc = "";

  if (locationPin && locationPin.includes(",")) {
    const parts = locationPin.split(",");
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (!isNaN(lat) && !isNaN(lng)) {
      const delta = 0.01;
      const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
      embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    }
  }

  if (!embedSrc && location) {
    const query = encodeURIComponent(location);
    embedSrc = `https://www.google.com/maps?q=${query}&output=embed`;
  }

  if (!embedSrc) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <iframe
        src={embedSrc}
        width="100%"
        height="200"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Location map"
      />
    </div>
  );
}