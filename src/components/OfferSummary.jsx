export default function OfferSummary({ offers, passengerCount }) {
  if (!offers || offers.length === 0) return null;
  return (
    <section className="offer-summary">
      <div className="offer-summary-header">
        <h2>Offers</h2>
        <span className="offer-summary-pax">
          {passengerCount} {passengerCount === 1 ? 'passenger' : 'passengers'}
        </span>
      </div>
      <ul className="offer-list">
        {offers.map((o) => (
          <li key={o.offerId} className="offer-item">
            <div className="offer-item-main">
              <span className="offer-flight">
                {o.carrier} {o.flightNumber}
              </span>
              <span className="offer-times">
                {o.depTime} &rarr; {o.arrTime}
              </span>
              <span className="offer-cabin">{o.cabinName}</span>
            </div>
            <div className="offer-item-total">
              {o.offerTotal} {o.currency}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
