export const EMISSION_FACTORS = {
  home: {
    'Apartment': 1.2,
    'Independent House': 2.5,
    'Shared': 0.8,
    'Default': 1.5
  },
  commute: {
    'Car (Petrol)': 1.8,
    'Car (EV)': 0.4,
    'Metro/Train': 0.2,
    'Two-Wheeler': 0.6,
    'Default': 1.0
  },
  diet: {
    'High Meat': 2.5,
    'Average Omnivore': 1.8,
    'Vegetarian': 1.0,
    'Vegan': 0.7,
    'Default': 1.8
  },
  flights: {
    '0-2': 0.4,
    '3-6': 1.2,
    '7-12': 2.4,
    '12+': 4.0,
    'Default': 1.0
  },
  shopping: {
    'Default': 1.5 // Fixed baseline for general consumption
  }
};
