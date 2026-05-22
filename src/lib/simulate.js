// Deterministic airline response simulation. Pure, no Math.random, no I/O.

import { lookupRoute, routeKey } from './canonical.js';
import { toAirShoppingRS } from './ndc.js';

const DEP_TIMES = ['08:15', '11:00', '16:45'];

const CABIN_BASE = {
  Economy: 240,
  'Premium Economy': 520,
  Business: 1350,
  First: 2600
};

const OFFER_FACTOR = [1.0, 1.08, 0.93];

const TAX_RATE = 0.32;

function hash(str) {
  let sum = 0;
  for (let i = 0; i < str.length; i += 1) {
    sum += str.charCodeAt(i);
  }
  return sum;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function fixed2(n) {
  return round2(n).toFixed(2);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function addMinutes(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

export function buildOffers(canonical) {
  const { leg, carrier, cabinName, passengers } = canonical;
  const route = lookupRoute(leg.origin, leg.destination);
  const key = routeKey(leg.origin, leg.destination);
  const keyHash = hash(key);
  const paxCount = passengers.length;
  const baseForCabin = CABIN_BASE[cabinName];

  const offers = [];
  for (let i = 0; i < 3; i += 1) {
    const depTime = DEP_TIMES[i];
    const arrTime = addMinutes(depTime, route.apparentDurationMin + i * 10);
    const flightNumber = String(1000 + ((keyHash + i * 37) % 9000));
    const perPaxBaseNum = round2(baseForCabin * OFFER_FACTOR[i]);
    const perPaxTaxNum = round2(perPaxBaseNum * TAX_RATE);
    const perPaxTotalNum = round2(perPaxBaseNum + perPaxTaxNum);
    const offerTotalNum = round2(perPaxTotalNum * paxCount);

    offers.push({
      offerId: `OFFER-${carrier}-${i + 1}`,
      offerItemId: `OI-${carrier}-${i + 1}`,
      segmentKey: `SEG-${carrier}${flightNumber}`,
      carrier,
      flightNumber,
      depTime,
      arrTime,
      cabinName,
      perPaxBase: fixed2(perPaxBaseNum),
      perPaxTax: fixed2(perPaxTaxNum),
      offerTotal: fixed2(offerTotalNum),
      currency: canonical.currency
    });
  }
  return offers;
}

export function simulateAirShoppingRS(canonical) {
  const offers = buildOffers(canonical);
  const xml = toAirShoppingRS(canonical, offers);
  return { xml, offers };
}
