// ─── IPCC AR6 EMISSION FACTORS ────────────────────────────────
// All values in kg CO₂e per unit
// Sources: IPCC AR6 WG3, India CEA Grid Emission Factor 2023

export const EMISSION_FACTORS = {

  // Transport: kg CO₂e per km
  transport: {
    car_petrol:     0.192,
    car_diesel:     0.171,
    car_ev:         0.054,  // India grid average (0.82 tCO₂/MWh × efficiency)
    car_hybrid:     0.106,
    metro:          0.031,
    bus:            0.089,
    auto_rickshaw:  0.098,
    motorbike:      0.114,
    cycling:        0.000,
    walking:        0.000,
  },

  // Diet: kg CO₂e per day
  diet: {
    heavy_meat:     7.19,
    meat_sometimes: 4.67,
    vegetarian:     3.81,
    vegan:          2.89,
  },

  // Housing: kg CO₂e per sqft per year
  housing: {
    independent_house:    12.4,
    apartment:             7.2,
    shared_accommodation:  4.8,
  },

  // Average sqft per housing type in India
  housingSize: {
    independent_house:    1200,
    apartment:             850,
    shared_accommodation:  300,
  },

  // Flights: kg CO₂e per flight hour
  flightPerHour: 255,

  // Average flight duration in hours (Indian context)
  avgFlightHours: 2.5,

  // Energy: kg CO₂e per kWh (India grid 2023)
  gridIntensity: 0.82,

  // Average monthly electricity consumption by housing (kWh)
  avgMonthlyKwh: {
    independent_house:    350,
    apartment:            180,
    shared_accommodation:  80,
  }

} as const

// ─── COMMUTE STRING TO NUMERIC MAPPING ───────────────────────
// Maps UI dropdown strings to { km, mode }

export const COMMUTE_LOOKUP: Record<string, {
  km: number
  mode: keyof typeof EMISSION_FACTORS.transport
}> = {
  'work from home':       { km: 0,  mode: 'walking' },
  'under 5km':            { km: 3,  mode: 'metro' },
  '5–15km':               { km: 10, mode: 'car_petrol' },
  '15–30km':              { km: 22, mode: 'car_petrol' },
  '30–60km':              { km: 45, mode: 'car_petrol' },
  'over 60km':            { km: 75, mode: 'car_petrol' },
}

// ─── FLIGHT STRING TO NUMERIC MAPPING ────────────────────────

export const FLIGHT_COUNT_LOOKUP: Record<string, number> = {
  'none':         0,
  '1–2 flights':  1.5,
  '3–5 flights':  4,
  '6–10 flights': 8,
  '10+ flights':  12,
}

// ─── EQUIVALENTS MULTIPLIERS ──────────────────────────────────
// Per metric ton CO₂

export const EQUIVALENTS = {
  trees_per_ton:         46.3,   // trees absorbing CO₂ for 1 year
  km_per_ton:            4_173,  // km driven in average petrol car
  phone_charges_per_ton: 121_643, // smartphone full charges
  flight_hours_per_ton:  3.92,   // hours of economy flight
} as const
