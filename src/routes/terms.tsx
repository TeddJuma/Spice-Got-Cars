import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions - Spice Got Cars" },
      {
        name: "description",
        content:
          "Read the full terms and conditions for auctions and vehicle purchases at Spice Got Cars.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <h1 className="text-3xl font-bold md:text-4xl">
        Terms and Conditions
      </h1>
      <p className="mt-4 text-brand-muted">
        Last updated: July 2026
      </p>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-xl font-bold">1. Auction Deposits</h2>
          <p className="mt-2 text-slate-700">
            A refundable deposit of KES 5,000 is required to place a bid on any
            auction vehicle. Deposits are held securely and are only charged if
            you are the winning bidder and fail to complete payment within the
            stipulated timeframe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">2. Payment Terms</h2>
          <p className="mt-2 text-slate-700">
            Winning bidders must complete full payment within 48 hours of the
            auction closing. Payment methods include bank transfer and mobile
            money (M-Pesa). Failure to complete payment may result in forfeiture
            of your deposit and the vehicle being re-listed.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">3. Refund Policy</h2>
          <p className="mt-2 text-slate-700">
            Non-winning bidders receive full deposit refunds within 3 business
            days. Refunds are processed to the original payment method. In the
            event of a dispute, Spice Got Cars reserves the right to investigate
            and make a final determination.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">4. Vehicle Condition</h2>
          <p className="mt-2 text-slate-700">
            All auction vehicles are sold as-is. While we perform NTSA inspection
            and logbook verification, bidders are encouraged to inspect vehicles
            personally or via a trusted mechanic before bidding. Spice Got Cars
            is not liable for undisclosed mechanical issues discovered after
            purchase.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">5. Bidding Rules</h2>
          <p className="mt-2 text-slate-700">
            All bids are binding. By placing a bid, you agree to purchase the
            vehicle at your bid price if you are the highest bidder at auction
            close. Bid manipulation, shill bidding, or fraudulent activity will
            result in permanent ban from future auctions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">6. Contact</h2>
          <p className="mt-2 text-slate-700">
            For questions about auctions, deposits, or terms, contact us at{" "}
            <a
              href="mailto:spicegotcars@gmail.com"
              className="text-brand-accent underline"
            >
              spicegotcars@gmail.com
            </a>{" "}
            or call <a href="tel:+254790555421" className="text-brand-accent underline">+254 790 555 421</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
