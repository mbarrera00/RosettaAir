// Preset form payloads. Pure helpers, no React.
// Dates are computed relative to "today" so the demo always uses a future date.

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function isoDateOffset(daysFromToday, today = new Date()) {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  d.setDate(d.getDate() + daysFromToday);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function getPresets(today = new Date()) {
  return [
    {
      id: 'lhr-jfk-eco',
      label: 'LHR to JFK, 1 adult, Economy',
      form: {
        origin: 'LHR',
        destination: 'JFK',
        date: isoDateOffset(30, today),
        passengers: 1,
        cabin: 'Economy'
      }
    },
    {
      id: 'lgw-bcn-eco',
      label: 'LGW to BCN, 2 adults, Economy',
      form: {
        origin: 'LGW',
        destination: 'BCN',
        date: isoDateOffset(45, today),
        passengers: 2,
        cabin: 'Economy'
      }
    },
    {
      id: 'jfk-lhr-biz',
      label: 'JFK to LHR, 1 adult, Business',
      form: {
        origin: 'JFK',
        destination: 'LHR',
        date: isoDateOffset(60, today),
        passengers: 1,
        cabin: 'Business'
      }
    }
  ];
}
