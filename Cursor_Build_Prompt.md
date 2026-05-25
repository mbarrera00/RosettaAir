# Cursor Build Prompt, Rosetta Air

## EDIFACT PAOREQ to NDC 21.3 Translation Demo

Paste this entire file into Cursor as the task. It is self-contained. Build the application exactly as specified.

The product name is **Rosetta Air**. The name is the idea behind the app, a Rosetta Stone for airline shopping messages, legacy EDIFACT on one side and modern IATA NDC on the other.

---

## 1. What you are building

**Rosetta Air** is a small React and Vite single page web application that demonstrates translating a legacy airline EDIFACT shopping request into a modern IATA NDC 21.3 request, simulating the airline response, and translating it back to EDIFACT. The whole round trip runs in the browser. There is no backend, no API call, no database, and no credentials.

The four messages of the round trip are:

1. EDIFACT PAOREQ, the legacy request.
2. NDC 21.3 AirShoppingRQ, the modern request, translated from message 1.
3. NDC 21.3 AirShoppingRS, the modern response, simulated locally.
4. EDIFACT PAORES, the legacy response, translated from message 3.

The user fills a short form, clicks one button, and sees all four messages plus a friendly list of offers.

---

## 2. Tech and project setup

- React 18 with Vite. Use JavaScript, not TypeScript.
- Plain CSS in a single `src/styles.css` file. Do not add any UI component library, state management library, router, or CSS framework.
- No network requests of any kind. Everything is computed in the browser.
- Scaffold with the React JavaScript template. The project and package name is `rosetta-air`.
- Set the document title in `index.html` to `Rosetta Air`.
- The finished app must run with `npm install` then `npm run dev`, with no further steps.

---

## 3. File structure

```
src/
  main.jsx
  App.jsx
  styles.css
  components/
    RequestForm.jsx
    PresetBar.jsx
    OfferSummary.jsx
    ResultPanel.jsx
  lib/
    canonical.js
    edifact.js
    ndc.js
    simulate.js
    presets.js
```

All translation and simulation logic lives in `src/lib`. The lib functions must be pure, with no React and no DOM access. Components only call lib functions and render. This separation is a hard requirement, because it is what would let the simulation later be swapped for a real airline call.

---

## 4. The canonical request model

The canonical model is a neutral object that neither standard owns. Every lib function reads or writes it. Shape:

```js
{
  messageRef: "1",                 // fixed for the demo
  interchangeControlRef: "000000001", // 9 digits, increments per request
  createdAt: Date,                 // the moment the request was built
  pointOfSale: { cityCode: "LON", countryCode: "GB" },
  agency: { systemCode: "1A", officeId: "LON1A0980", iataNumber: "99394943" },
  currency: "GBP",
  carrier: "VS",                   // looked up from the route, see section 5
  cabinName: "Economy",            // from the form
  bookingClass: "Y",               // derived from cabinName, see section 5
  passengers: [ { id: "PAX1", ptc: "ADT" } ], // one entry per requested seat
  leg: { origin: "LHR", destination: "JFK", date: "2025-07-22", depTime: "0900" }
}
```

The demo handles a one way journey, so there is a single `leg`. Every passenger is an adult, `ptc` is always `ADT`. Passenger ids are `PAX1`, `PAX2`, and so on.

---

## 5. Fixed demo constants

Put these in the relevant lib files.

Point of sale, agency, and message defaults are fixed: point of sale city `LON`, country `GB`, agency system code `1A`, office id `LON1A0980`, IATA number `99394943`, currency `GBP`.

Cabin name to booking class map: Economy to `Y`, Premium Economy to `W`, Business to `J`, First to `F`.

Route table, keyed by `origin + "-" + destination`. Each entry gives the carrier and an apparent journey duration in minutes. Use a default for any route not listed.

```js
const ROUTES = {
  "LHR-JFK": { carrier: "VS", apparentDurationMin: 180 },
  "JFK-LHR": { carrier: "VS", apparentDurationMin: 175 },
  "LGW-BCN": { carrier: "VS", apparentDurationMin: 130 },
  "LHR-BCN": { carrier: "VS", apparentDurationMin: 135 },
  "JFK-LGW": { carrier: "VS", apparentDurationMin: 175 }
};
const DEFAULT_ROUTE = { carrier: "VS", apparentDurationMin: 180 };
```

Airport pick list for the form: `LHR`, `LGW`, `JFK`, `EWR`, `BCN`, `CDG`, `AMS`, `MAD`.

---

## 6. The lib functions

Implement these five exports. Keep them small and pure.

### 6.1 `canonical.js`, `buildCanonical(form)`

Input is the form object `{ origin, destination, date, passengers, cabin }`, where `date` is an ISO `YYYY-MM-DD` string and `passengers` is a positive integer. Returns a canonical object as in section 4. Derive `carrier` from the route table, `bookingClass` from the cabin map, and build the `passengers` array with ids `PAX1` to `PAXn`. Set `createdAt` to `new Date()`. Generate `interchangeControlRef` as a 9 digit zero padded counter that increments on each call, starting at 1. `depTime` is fixed at `"0900"` for the demo.

### 6.2 `edifact.js`, `toPaoreq(canonical)`

Returns the EDIFACT PAOREQ as a single string, with each segment on its own line, ending in the `'` segment terminator. Use the template in section 7.1. Helper conversions you will need:

- ISO date `YYYY-MM-DD` to EDIFACT `DDMMYY`, for example `2025-07-22` becomes `220725`.
- `createdAt` to `YYMMDD` and `HHMM` for the UNB segment.

### 6.3 `ndc.js`, `toAirShoppingRQ(canonical)`

Returns the NDC 21.3 AirShoppingRQ as an indented XML string. Use the template in section 7.2. Emit one `Passenger` element per entry in `canonical.passengers`.

### 6.4 `simulate.js`, `simulateAirShoppingRS(canonical)`

Returns an object `{ xml, offers }`. `xml` is the AirShoppingRS XML string, `offers` is an array used by the offer summary and by `toPaores`. This is the simulation engine. It must be deterministic, so do not use `Math.random` anywhere.

Generate exactly 3 offers. For offer index `i`, where `i` is 0, 1, 2:

- Departure time comes from the list `["08:15", "11:00", "16:45"]`.
- Look up `apparentDurationMin` from the route table. Arrival time is departure time plus `apparentDurationMin + i * 10` minutes. With these inputs the arrival never crosses midnight, so a day rollover does not need to be handled.
- Flight number is `String(1000 + (hash(routeKey) + i * 37) % 9000)`, where `hash` sums the character codes of the string and `routeKey` is `origin + "-" + destination`. This yields a stable 4 digit number.
- Per passenger base fare is `cabinBase[cabinName] * offerFactor[i]`, rounded to 2 decimals, where `cabinBase = { Economy: 240, "Premium Economy": 520, Business: 1350, First: 2600 }` and `offerFactor = [1.00, 1.08, 0.93]`.
- Per passenger tax is the base fare times `0.32`, rounded to 2 decimals.
- Per passenger total is base plus tax. Offer total is the per passenger total times the passenger count, rounded to 2 decimals.
- Identifiers: `offerId` is `OFFER-{carrier}-{i+1}`, `offerItemId` is `OI-{carrier}-{i+1}`, `segmentKey` is `SEG-{carrier}{flightNumber}`.

Each offer object should carry: `offerId`, `offerItemId`, `segmentKey`, `carrier`, `flightNumber`, `depTime`, `arrTime`, `cabinName`, `perPaxBase`, `perPaxTax`, `offerTotal`, `currency`. Build the XML with the template in section 7.3.

### 6.5 `edifact.js`, `toPaores(canonical, sim)`

Returns the EDIFACT PAORES string, built from the simulated offers. Use the template in section 7.4. One TVL and one MON segment per offer. The UNT segment count is `4 + 2 * offerCount`.

---

## 7. Message templates

Use these exactly. Text in braces is a value to substitute. Times in EDIFACT have the colon removed, so `08:15` becomes `0815`.

### 7.1 EDIFACT PAOREQ

```
UNB+IATA:1+LHRGB2100+VS1LONEH08+{yymmdd}:{hhmm}+{ctrlRef}'
UNH+1+PAOREQ:13:1:IA'
MSG+1:43'
ORG+1A:LON1A0980+99394943+LON+++LON+GB:{currency}'
EQN+{paxCount}:PX'
TVL+{ddmmyy}:0900+{origin}+{destination}+{carrier}++{bookingClass}'
PRD+{bookingClass}::OW'
ITM+{paxCount}:PX'
TFF+++{currency}'
IFT+4:28+OW {cabinUpper} SHOP'
UNT+10+1'
UNZ+1+{ctrlRef}'
```

`{cabinUpper}` is the cabin name in upper case, for example `ECONOMY`.

### 7.2 NDC 21.3 AirShoppingRQ

```xml
<AirShoppingRQ xmlns="http://www.iata.org/IATA/EDIST" Version="21.3">
  <PointOfSale>
    <Location>
      <CountryCode>GB</CountryCode>
      <CityCode>LON</CityCode>
    </Location>
  </PointOfSale>
  <Document>
    <Name>Rosetta Air, translation demo</Name>
    <ReferenceVersion>21.3</ReferenceVersion>
  </Document>
  <Party>
    <Sender>
      <TravelAgencySender>
        <IATA_Number>99394943</IATA_Number>
        <AgencyID>LON1A0980</AgencyID>
        <PseudoCity>LON1A0980</PseudoCity>
      </TravelAgencySender>
    </Sender>
    <Recipient>
      <ORA_Recipient>
        <AirlineID>{carrier}</AirlineID>
      </ORA_Recipient>
    </Recipient>
  </Party>
  <CoreQuery>
    <OriginDestinations>
      <OriginDestination>
        <Departure>
          <AirportCode>{origin}</AirportCode>
          <Date>{isoDate}</Date>
          <Time>09:00</Time>
        </Departure>
        <Arrival>
          <AirportCode>{destination}</AirportCode>
        </Arrival>
      </OriginDestination>
    </OriginDestinations>
  </CoreQuery>
  <DataLists>
    <PassengerList>
      <!-- repeat one Passenger per requested seat -->
      <Passenger PassengerID="{paxId}">
        <PTC>ADT</PTC>
      </Passenger>
    </PassengerList>
  </DataLists>
  <Preference>
    <CabinPreferences>
      <CabinType>
        <CabinTypeName>{cabinName}</CabinTypeName>
      </CabinType>
    </CabinPreferences>
    <FarePreferences>
      <Types><Type>Published</Type></Types>
    </FarePreferences>
    <PricingPreferences>
      <CurrencyCode>{currency}</CurrencyCode>
    </PricingPreferences>
  </Preference>
</AirShoppingRQ>
```

### 7.3 NDC 21.3 AirShoppingRS, simulated

```xml
<AirShoppingRS xmlns="http://www.iata.org/IATA/EDIST" Version="21.3">
  <Document><Name>Rosetta Air, simulated response</Name></Document>
  <Response>
    <OffersGroup>
      <AirlineOffers>
        <!-- repeat one AirlineOffer per simulated offer -->
        <AirlineOffer>
          <OfferID Owner="{carrier}">{offerId}</OfferID>
          <TotalPrice>
            <DetailCurrencyPrice>
              <Total Code="{currency}">{offerTotal}</Total>
            </DetailCurrencyPrice>
          </TotalPrice>
          <OfferItem OfferItemID="{offerItemId}">
            <PassengerRefs>{spaceSeparatedPaxIds}</PassengerRefs>
            <FareDetail>
              <Price>
                <BaseAmount Code="{currency}">{perPaxBase}</BaseAmount>
                <Taxes><Total Code="{currency}">{perPaxTax}</Total></Taxes>
              </Price>
            </FareDetail>
          </OfferItem>
          <FlightRefs>{segmentKey}</FlightRefs>
        </AirlineOffer>
      </AirlineOffers>
    </OffersGroup>
    <DataLists>
      <FlightSegmentList>
        <!-- repeat one FlightSegment per simulated offer -->
        <FlightSegment SegmentKey="{segmentKey}">
          <Departure>
            <AirportCode>{origin}</AirportCode>
            <Date>{isoDate}</Date><Time>{depTime}</Time>
          </Departure>
          <Arrival>
            <AirportCode>{destination}</AirportCode>
            <Date>{isoDate}</Date><Time>{arrTime}</Time>
          </Arrival>
          <MarketingCarrier>
            <AirlineID>{carrier}</AirlineID><FlightNumber>{flightNumber}</FlightNumber>
          </MarketingCarrier>
        </FlightSegment>
      </FlightSegmentList>
      <PassengerList>
        <!-- repeat one Passenger per requested seat -->
        <Passenger PassengerID="{paxId}"><PTC>ADT</PTC></Passenger>
      </PassengerList>
    </DataLists>
  </Response>
</AirShoppingRS>
```

### 7.4 EDIFACT PAORES, simulated

```
UNB+IATA:1+VS1LONEH08+LHRGB2100+{yymmdd}:{hhmm}+{ctrlRef2}'
UNH+1+PAORES:13:1:IA'
MSG+1:43'
ORG+1A:LON1A0980+99394943+LON+++LON+GB:{currency}'
TVL+{ddmmyy}:{depHHMM}:{arrHHMM}+{origin}+{destination}+{carrier}+{flightNumber}+{bookingClass}'
MON+712:{offerTotal}:{currency}'
UNT+{segCount}+1'
UNZ+1+{ctrlRef2}'
```

The TVL and MON pair repeats once per offer. `{ctrlRef2}` is the request control reference with `1` added, so a request `000000001` gives a response `000000002`. `{segCount}` is `4 + 2 * offerCount`.

---

## 8. UI components and layout

### 8.1 App.jsx

Holds the form state and, after a run, the four message strings and the offers array. On submit it runs the pipeline in order: `buildCanonical`, `toPaoreq`, `toAirShoppingRQ`, `simulateAirShoppingRS`, `toPaores`. All synchronous. Before the first run, show only the form and a short hint.

### 8.2 RequestForm.jsx

Fields: Origin and Destination as select dropdowns from the airport list, Departure date as a date input, Passengers as a number input from 1 to 9, Cabin as a select with Economy, Premium Economy, Business, First. A primary button labelled `Translate and simulate`. The date input must default to today plus 30 days and must not allow a date before today. Prevent submit if origin equals destination.

### 8.3 PresetBar.jsx

A row of three preset buttons. Clicking a preset fills the form and immediately runs the pipeline. Presets, with dates computed relative to today:

1. `LHR to JFK, 1 adult, Economy`, origin LHR, destination JFK, today plus 30 days, 1 passenger, Economy.
2. `LGW to BCN, 2 adults, Economy`, origin LGW, destination BCN, today plus 45 days, 2 passengers, Economy.
3. `JFK to LHR, 1 adult, Business`, origin JFK, destination LHR, today plus 60 days, 1 passenger, Business.

### 8.4 OfferSummary.jsx

A friendly, non technical list of the simulated offers. For each offer show the carrier and flight number, the departure and arrival times, the cabin, and the offer total with currency. Show the passenger count once above the list.

### 8.5 ResultPanel.jsx

A reusable panel for one message. Props: a title, a number badge from 1 to 4, and the message text. It renders a labelled box with the text in a monospace, scrollable area, and a `Copy` button that copies the text to the clipboard.

### 8.6 Layout

Header strip with the product name `Rosetta Air` shown prominently, and below it a subtitle `EDIFACT PAOREQ to NDC 21.3, translation demo`. Below the header, the form and the preset bar. Below that, after a run, the offer summary, then the four panels in a two by two CSS grid:

- Top left, panel 1, EDIFACT PAOREQ.
- Top right, panel 2, NDC AirShoppingRQ.
- Bottom right, panel 3, NDC AirShoppingRS.
- Bottom left, panel 4, EDIFACT PAORES.

Read clockwise from the top left, the panels follow the round trip: PAOREQ, then AirShoppingRQ, then AirShoppingRS, then PAORES. The left column is EDIFACT, the right column is NDC, the top row is requests, the bottom row is responses. This is the same layout shown as Figure 1 in the Rosetta Air design specification. On a narrow screen the grid collapses to a single column in the order 1, 2, 3, 4.

---

## 9. Styling

Keep it clean and professional, not flashy. Suggested palette: a dark blue accent `#1F4E79`, a medium blue `#2E75B6`, light grey panel backgrounds `#F4F4F4`, white page background, dark grey text. Use a system sans serif font for the interface and a monospace font for the message panels. Panels have a thin border, a clear title bar in the accent colour, and a fixed height with vertical scrolling. The four panel grid uses `display: grid` with two equal columns and a small gap. Make the message text easy to read at roughly 12 to 13 pixels monospace. The header should make the name `Rosetta Air` the most prominent text on the page.

---

## 10. Reference output, use this to self check

For the first preset, LHR to JFK, 1 adult, Economy, the PAOREQ should look like the following, with the UNB date and time being the run time and the control reference being the running counter:

```
UNB+IATA:1+LHRGB2100+VS1LONEH08+{yymmdd}:{hhmm}+000000001'
UNH+1+PAOREQ:13:1:IA'
MSG+1:43'
ORG+1A:LON1A0980+99394943+LON+++LON+GB:GBP'
EQN+1:PX'
TVL+{ddmmyy}:0900+LHR+JFK+VS++Y'
PRD+Y::OW'
ITM+1:PX'
TFF+++GBP'
IFT+4:28+OW ECONOMY SHOP'
UNT+10+1'
UNZ+1+000000001'
```

The simulation for that preset should produce 3 offers with flight numbers in the 1000 to 9999 range, departures at 08:15, 11:00, and 16:45, arrivals 180, 190, and 200 minutes later, and Economy per passenger base fares of 240.00, 259.20, and 223.20, each with tax at 32 percent. The exact figures are illustrative, what matters is that they are deterministic and that the same input always gives the same output.

---

## 11. Acceptance criteria

- `npm install` then `npm run dev` starts the app with no errors.
- The app makes no network requests.
- The product name `Rosetta Air` appears in the header and as the browser tab title.
- All translation and simulation code is in `src/lib` as pure functions with no React imports.
- Clicking any preset fills the form and shows the offer summary and all four populated panels.
- Submitting the form by hand produces the same result as the matching preset.
- Running the same request twice produces identical AirShoppingRS, identical offers, and identical PAORES.
- Each panel has a working Copy button.
- Panel 1 is a valid PAOREQ matching the template, panel 4 is a valid PAORES matching the template, and panels 2 and 3 are well formed XML matching the templates.
- The four panels are arranged top left to bottom left clockwise as PAOREQ, AirShoppingRQ, AirShoppingRS, PAORES, and collapse to one column on a narrow screen.
- Origin and destination cannot be the same, and a past date cannot be chosen.

Build the complete Rosetta Air application now, creating every file in section 3.
