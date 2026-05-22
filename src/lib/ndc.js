// Pure NDC 21.3 XML serialisation. No React, no DOM, no I/O.

function passengerElements(passengers, indent) {
  return passengers
    .map(
      (p) =>
        `${indent}<Passenger PassengerID="${p.id}">\n` +
        `${indent}  <PTC>${p.ptc}</PTC>\n` +
        `${indent}</Passenger>`
    )
    .join('\n');
}

export function toAirShoppingRQ(canonical) {
  const { leg, carrier, currency, cabinName, passengers, pointOfSale, agency } = canonical;
  const passengerXml = passengerElements(passengers, '      ');

  return `<AirShoppingRQ xmlns="http://www.iata.org/IATA/EDIST" Version="21.3">
  <PointOfSale>
    <Location>
      <CountryCode>${pointOfSale.countryCode}</CountryCode>
      <CityCode>${pointOfSale.cityCode}</CityCode>
    </Location>
  </PointOfSale>
  <Document>
    <Name>Rosetta Air, translation demo</Name>
    <ReferenceVersion>21.3</ReferenceVersion>
  </Document>
  <Party>
    <Sender>
      <TravelAgencySender>
        <IATA_Number>${agency.iataNumber}</IATA_Number>
        <AgencyID>${agency.officeId}</AgencyID>
        <PseudoCity>${agency.officeId}</PseudoCity>
      </TravelAgencySender>
    </Sender>
    <Recipient>
      <ORA_Recipient>
        <AirlineID>${carrier}</AirlineID>
      </ORA_Recipient>
    </Recipient>
  </Party>
  <CoreQuery>
    <OriginDestinations>
      <OriginDestination>
        <Departure>
          <AirportCode>${leg.origin}</AirportCode>
          <Date>${leg.date}</Date>
          <Time>09:00</Time>
        </Departure>
        <Arrival>
          <AirportCode>${leg.destination}</AirportCode>
        </Arrival>
      </OriginDestination>
    </OriginDestinations>
  </CoreQuery>
  <DataLists>
    <PassengerList>
${passengerXml}
    </PassengerList>
  </DataLists>
  <Preference>
    <CabinPreferences>
      <CabinType>
        <CabinTypeName>${cabinName}</CabinTypeName>
      </CabinType>
    </CabinPreferences>
    <FarePreferences>
      <Types><Type>Published</Type></Types>
    </FarePreferences>
    <PricingPreferences>
      <CurrencyCode>${currency}</CurrencyCode>
    </PricingPreferences>
  </Preference>
</AirShoppingRQ>`;
}

// Builds the AirShoppingRS XML from the canonical request and the simulated offers.
// Kept here so all NDC serialisation lives in one place; the simulator calls this.
export function toAirShoppingRS(canonical, offers) {
  const { leg, carrier, currency, passengers } = canonical;

  const airlineOffersXml = offers
    .map((o) => {
      const paxRefs = passengers.map((p) => p.id).join(' ');
      return `        <AirlineOffer>
          <OfferID Owner="${carrier}">${o.offerId}</OfferID>
          <TotalPrice>
            <DetailCurrencyPrice>
              <Total Code="${currency}">${o.offerTotal}</Total>
            </DetailCurrencyPrice>
          </TotalPrice>
          <OfferItem OfferItemID="${o.offerItemId}">
            <PassengerRefs>${paxRefs}</PassengerRefs>
            <FareDetail>
              <Price>
                <BaseAmount Code="${currency}">${o.perPaxBase}</BaseAmount>
                <Taxes><Total Code="${currency}">${o.perPaxTax}</Total></Taxes>
              </Price>
            </FareDetail>
          </OfferItem>
          <FlightRefs>${o.segmentKey}</FlightRefs>
        </AirlineOffer>`;
    })
    .join('\n');

  const segmentsXml = offers
    .map(
      (o) => `        <FlightSegment SegmentKey="${o.segmentKey}">
          <Departure>
            <AirportCode>${leg.origin}</AirportCode>
            <Date>${leg.date}</Date><Time>${o.depTime}</Time>
          </Departure>
          <Arrival>
            <AirportCode>${leg.destination}</AirportCode>
            <Date>${leg.date}</Date><Time>${o.arrTime}</Time>
          </Arrival>
          <MarketingCarrier>
            <AirlineID>${carrier}</AirlineID><FlightNumber>${o.flightNumber}</FlightNumber>
          </MarketingCarrier>
        </FlightSegment>`
    )
    .join('\n');

  const passengerXml = passengers
    .map((p) => `        <Passenger PassengerID="${p.id}"><PTC>${p.ptc}</PTC></Passenger>`)
    .join('\n');

  return `<AirShoppingRS xmlns="http://www.iata.org/IATA/EDIST" Version="21.3">
  <Document><Name>Rosetta Air, simulated response</Name></Document>
  <Response>
    <OffersGroup>
      <AirlineOffers>
${airlineOffersXml}
      </AirlineOffers>
    </OffersGroup>
    <DataLists>
      <FlightSegmentList>
${segmentsXml}
      </FlightSegmentList>
      <PassengerList>
${passengerXml}
      </PassengerList>
    </DataLists>
  </Response>
</AirShoppingRS>`;
}
