// Pure functions that build the neutral canonical request model.
// No React, no DOM access. Every other lib reads or writes this shape.

export const POINT_OF_SALE = { cityCode: 'LON', countryCode: 'GB' };
export const AGENCY = { systemCode: '1A', officeId: 'LON1A0980', iataNumber: '99394943' };
export const CURRENCY = 'GBP';
export const MESSAGE_REF = '1';
export const DEFAULT_DEP_TIME = '0900';

export const CABIN_TO_BOOKING_CLASS = {
  Economy: 'Y',
  'Premium Economy': 'W',
  Business: 'J',
  First: 'F'
};

export const ROUTES = {
  'LHR-JFK': { carrier: 'VS', apparentDurationMin: 180 },
  'JFK-LHR': { carrier: 'VS', apparentDurationMin: 175 },
  'LGW-BCN': { carrier: 'VS', apparentDurationMin: 130 },
  'LHR-BCN': { carrier: 'VS', apparentDurationMin: 135 },
  'JFK-LGW': { carrier: 'VS', apparentDurationMin: 175 }
};

export const DEFAULT_ROUTE = { carrier: 'VS', apparentDurationMin: 180 };

export const AIRPORTS = ['LHR', 'LGW', 'JFK', 'EWR', 'BCN', 'CDG', 'AMS', 'MAD'];

export const CABIN_NAMES = ['Economy', 'Premium Economy', 'Business', 'First'];

export function routeKey(origin, destination) {
  return `${origin}-${destination}`;
}

export function lookupRoute(origin, destination) {
  return ROUTES[routeKey(origin, destination)] || DEFAULT_ROUTE;
}

// Module-local counter for the 9 digit interchange control reference.
// Starts at 0 and is pre-incremented on each call, so the first value is 1.
let controlRefCounter = 0;

export function nextControlRef() {
  controlRefCounter += 1;
  return String(controlRefCounter).padStart(9, '0');
}

// Test-only helper to reset the counter between assertions if ever needed.
export function _resetControlRef() {
  controlRefCounter = 0;
}

export function buildCanonical(form) {
  const { origin, destination, date, passengers, cabin } = form;
  const route = lookupRoute(origin, destination);
  const bookingClass = CABIN_TO_BOOKING_CLASS[cabin];
  const paxList = [];
  for (let i = 0; i < passengers; i += 1) {
    paxList.push({ id: `PAX${i + 1}`, ptc: 'ADT' });
  }
  return {
    messageRef: MESSAGE_REF,
    interchangeControlRef: nextControlRef(),
    createdAt: new Date(),
    pointOfSale: { ...POINT_OF_SALE },
    agency: { ...AGENCY },
    currency: CURRENCY,
    carrier: route.carrier,
    cabinName: cabin,
    bookingClass,
    passengers: paxList,
    leg: {
      origin,
      destination,
      date,
      depTime: DEFAULT_DEP_TIME
    }
  };
}
