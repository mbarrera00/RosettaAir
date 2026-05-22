// Pure EDIFACT serialisation. No React, no DOM, no I/O.

// 2025-07-22 to 220725
export function isoDateToDdmmyy(iso) {
  const [yyyy, mm, dd] = iso.split('-');
  return `${dd}${mm}${yyyy.slice(2)}`;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function dateToYymmdd(d) {
  const yy = String(d.getFullYear()).slice(2);
  return `${yy}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

export function dateToHhmm(d) {
  return `${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}

// "08:15" to "0815"
export function stripColon(hhmm) {
  return hhmm.replace(':', '');
}

export function incrementControlRef(ref) {
  const next = Number(ref) + 1;
  return String(next).padStart(9, '0');
}

export function toPaoreq(canonical) {
  const yymmdd = dateToYymmdd(canonical.createdAt);
  const hhmm = dateToHhmm(canonical.createdAt);
  const ddmmyy = isoDateToDdmmyy(canonical.leg.date);
  const paxCount = canonical.passengers.length;
  const cabinUpper = canonical.cabinName.toUpperCase();

  const segments = [
    `UNB+IATA:1+LHRGB2100+VS1LONEH08+${yymmdd}:${hhmm}+${canonical.interchangeControlRef}'`,
    `UNH+1+PAOREQ:13:1:IA'`,
    `MSG+1:43'`,
    `ORG+1A:LON1A0980+99394943+LON+++LON+GB:${canonical.currency}'`,
    `EQN+${paxCount}:PX'`,
    `TVL+${ddmmyy}:0900+${canonical.leg.origin}+${canonical.leg.destination}+${canonical.carrier}++${canonical.bookingClass}'`,
    `PRD+${canonical.bookingClass}::OW'`,
    `ITM+${paxCount}:PX'`,
    `TFF+++${canonical.currency}'`,
    `IFT+4:28+OW ${cabinUpper} SHOP'`,
    `UNT+10+1'`,
    `UNZ+1+${canonical.interchangeControlRef}'`
  ];

  return segments.join('\n');
}

export function toPaores(canonical, sim) {
  const yymmdd = dateToYymmdd(canonical.createdAt);
  const hhmm = dateToHhmm(canonical.createdAt);
  const ddmmyy = isoDateToDdmmyy(canonical.leg.date);
  const ctrlRef2 = incrementControlRef(canonical.interchangeControlRef);
  const offerCount = sim.offers.length;
  const segCount = 4 + 2 * offerCount;

  const header = [
    `UNB+IATA:1+VS1LONEH08+LHRGB2100+${yymmdd}:${hhmm}+${ctrlRef2}'`,
    `UNH+1+PAORES:13:1:IA'`,
    `MSG+1:43'`,
    `ORG+1A:LON1A0980+99394943+LON+++LON+GB:${canonical.currency}'`
  ];

  const body = [];
  for (const offer of sim.offers) {
    const depHHMM = stripColon(offer.depTime);
    const arrHHMM = stripColon(offer.arrTime);
    body.push(
      `TVL+${ddmmyy}:${depHHMM}:${arrHHMM}+${canonical.leg.origin}+${canonical.leg.destination}+${canonical.carrier}+${offer.flightNumber}+${canonical.bookingClass}'`
    );
    body.push(`MON+712:${offer.offerTotal}:${canonical.currency}'`);
  }

  const trailer = [
    `UNT+${segCount}+1'`,
    `UNZ+1+${ctrlRef2}'`
  ];

  return [...header, ...body, ...trailer].join('\n');
}
