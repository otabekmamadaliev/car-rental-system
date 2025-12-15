const BASE = 'https://jsonplaceholder.typicode.com';

// Mock car data with real car types
const CARS = [
  { id: 1, brand: 'Toyota', model: 'Camry', year: 2023, type: 'Sedan', pricePerDay: 45, seats: 5, transmission: 'Automatic', fuelType: 'Hybrid', image: require('../assets/cars/toyota-camry.png') },
  { id: 2, brand: 'Honda', model: 'Civic', year: 2024, type: 'Sedan', pricePerDay: 40, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/honda-civic.png') },
  { id: 3, brand: 'Ford', model: 'Mustang', year: 2023, type: 'Sports', pricePerDay: 95, seats: 4, transmission: 'Manual', fuelType: 'Gasoline', image: require('../assets/cars/ford-mustang.png') },
  { id: 4, brand: 'Tesla', model: 'Model 3', year: 2024, type: 'Sedan', pricePerDay: 85, seats: 5, transmission: 'Automatic', fuelType: 'Electric', image: require('../assets/cars/tesla-model-3.png') },
  { id: 5, brand: 'BMW', model: 'X5', year: 2023, type: 'SUV', pricePerDay: 110, seats: 7, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/bmw-x5.png') },
  { id: 6, brand: 'Mercedes-Benz', model: 'C-Class', year: 2024, type: 'Luxury Sedan', pricePerDay: 100, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/mercedes-c-class.png') },
  { id: 7, brand: 'Audi', model: 'A4', year: 2023, type: 'Sedan', pricePerDay: 90, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/audi-a4.png') },
  { id: 8, brand: 'Jeep', model: 'Wrangler', year: 2024, type: 'SUV', pricePerDay: 75, seats: 5, transmission: 'Manual', fuelType: 'Gasoline', image: require('../assets/cars/jeep-wrangler.png') },
  { id: 9, brand: 'Chevrolet', model: 'Tahoe', year: 2023, type: 'SUV', pricePerDay: 105, seats: 8, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/chevrolet-tahoe.png') },
  { id: 10, brand: 'Mazda', model: 'CX-5', year: 2024, type: 'Crossover', pricePerDay: 55, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/mazda-cx5.png') },
  { id: 11, brand: 'Nissan', model: 'Altima', year: 2023, type: 'Sedan', pricePerDay: 42, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/nissan-altima.png') },
  { id: 12, brand: 'Hyundai', model: 'Tucson', year: 2024, type: 'SUV', pricePerDay: 50, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/hyundai-tucson.png') },
  { id: 13, brand: 'Kia', model: 'Sportage', year: 2023, type: 'SUV', pricePerDay: 48, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/kia-sportage.png') },
  { id: 14, brand: 'Volkswagen', model: 'Passat', year: 2024, type: 'Sedan', pricePerDay: 52, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/volkswagen-passat.png') },
  { id: 15, brand: 'Subaru', model: 'Outback', year: 2023, type: 'Wagon', pricePerDay: 60, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/subaru-outback.png') },
  { id: 16, brand: 'Lexus', model: 'RX 350', year: 2024, type: 'Luxury SUV', pricePerDay: 120, seats: 7, transmission: 'Automatic', fuelType: 'Hybrid', image: require('../assets/cars/lexus-rx350.png') },
  { id: 17, brand: 'Porsche', model: '911', year: 2023, type: 'Sports', pricePerDay: 250, seats: 4, transmission: 'Manual', fuelType: 'Gasoline', image: require('../assets/cars/porsche-911.png') },
  { id: 18, brand: 'Range Rover', model: 'Evoque', year: 2024, type: 'Luxury SUV', pricePerDay: 130, seats: 5, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/range-rover-evoque.png') },
  { id: 19, brand: 'Volvo', model: 'XC90', year: 2023, type: 'SUV', pricePerDay: 95, seats: 7, transmission: 'Automatic', fuelType: 'Hybrid', image: require('../assets/cars/volvo-xc90.png') },
  { id: 20, brand: 'Acura', model: 'MDX', year: 2024, type: 'SUV', pricePerDay: 88, seats: 7, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/acura-mdx.png') },
  { id: 21, brand: 'Dodge', model: 'Challenger', year: 2023, type: 'Sports', pricePerDay: 90, seats: 5, transmission: 'Manual', fuelType: 'Gasoline', image: require('../assets/cars/dodge-challenger.png') },
  { id: 22, brand: 'Chrysler', model: 'Pacifica', year: 2024, type: 'Minivan', pricePerDay: 70, seats: 8, transmission: 'Automatic', fuelType: 'Hybrid', image: require('../assets/cars/chrysler-pacifica.png') },
  { id: 23, brand: 'GMC', model: 'Yukon', year: 2023, type: 'SUV', pricePerDay: 115, seats: 8, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/gmc-yukon.png') },
  { id: 24, brand: 'Cadillac', model: 'Escalade', year: 2024, type: 'Luxury SUV', pricePerDay: 150, seats: 8, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/cadillac-escalade.png') },
  { id: 25, brand: 'Lincoln', model: 'Navigator', year: 2023, type: 'Luxury SUV', pricePerDay: 145, seats: 8, transmission: 'Automatic', fuelType: 'Gasoline', image: require('../assets/cars/lincoln-navigator.png') }
];

// For demo purposes we use mock data and also call JSONPlaceholder for POST/PUT
export async function getCars() {
  // Return our mock car data
  return CARS;
}

export async function getCar(id) {
  // Find car in mock data
  const car = CARS.find(c => c.id === parseInt(id));
  return car || CARS[0];
}

export async function createBooking(data) {
  const res = await fetch(`${BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateBooking(id, data) {
  const res = await fetch(`${BASE}/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
