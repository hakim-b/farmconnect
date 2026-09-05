export const SERVICES = [
  'on-site-slaughter',
  'zabiha-on-request',
  'custom-processing',
  'pickup',
  'delivery',
  'live-animal-sales',
] as const;

export type Service = (typeof SERVICES)[number];

export const SERVICE_LABELS: Record<Service, string> = {
  'on-site-slaughter': 'On-site slaughter',
  'zabiha-on-request': 'Zabiha on request',
  'custom-processing': 'Custom processing',
  pickup: 'Farm pickup',
  delivery: 'Delivery',
  'live-animal-sales': 'Live animal sales',
};

export type Animal = 'cattle' | 'goat' | 'lamb' | 'poultry';

export const ANIMAL_LABELS: Record<Animal, string> = {
  cattle: 'Cattle',
  goat: 'Goat',
  lamb: 'Lamb',
  poultry: 'Poultry',
};

export type ProductCategory = 'meat' | 'poultry' | 'produce';

export type Product = {
  id: string;
  farmId: string;
  name: string;
  category: ProductCategory;
  price: number;
  unit: string; // 'kg', 'dozen', 'each'
  image: string;
  inStock: boolean;
  onSale?: boolean;
};

export type SlaughterOption = {
  id: string;
  animal: Animal;
  label: string;
  price: number; // whole-animal price, CAD
  yieldKg: number; // approx dressed weight
  leadTimeDays: number;
  splitAllowed: boolean;
};

export type Activity = {
  id: string;
  title: string;
  detail: string;
  date?: string;
};

export type Farm = {
  id: string;
  name: string;
  town: string;
  address: string;
  lat: number;
  lng: number;
  image: string;
  tagline: string;
  services: Service[];
  livestock: Animal[];
  halalCertified: boolean;
  certifier?: string;
  rating: number;
  reviewCount: number;
  travelMin: number; // drive time from user, minutes
  deliveryFee: number | null; // null = pickup only
  hours?: string;
  phone?: string;
  products: Product[];
  slaughterOptions: SlaughterOption[];
  activities: Activity[];
};

// ---------------------------------------------------------------------------
// Mock data. The first two farms are real businesses near Montreal (names +
// addresses supplied); ratings, pricing, hours and catalogue are illustrative.
// The remaining farms are fictional but placed in real farming towns.
// ---------------------------------------------------------------------------

export const FARMS: Farm[] = [
  {
    id: 'abattoir-emin',
    name: 'Abattoir Emin',
    town: 'Kahnawake, QC',
    address: '450 Old Chateauguay Road, Kahnawake, QC J0L 1B0',
    lat: 45.3958,
    lng: -73.7075,
    image: 'https://picsum.photos/seed/abattoiremin/800/500',
    tagline: 'Family halal abattoir — hand slaughter, same-day pickup.',
    services: [
      'on-site-slaughter',
      'zabiha-on-request',
      'custom-processing',
      'live-animal-sales',
    ],
    livestock: ['cattle', 'goat', 'lamb', 'poultry'],
    halalCertified: true,
    certifier: 'HMA Canada',
    rating: 4.7,
    reviewCount: 312,
    travelMin: 24,
    deliveryFee: null,
    hours: 'Mon–Sat, 7am–5pm',
    phone: '(450) 632-1211',
    products: [
      {
        id: 'emin-lamb-leg',
        farmId: 'abattoir-emin',
        name: 'Lamb leg, bone-in',
        category: 'meat',
        price: 24.99,
        unit: 'kg',
        image: 'https://picsum.photos/seed/lambleg/400/400',
        inStock: true,
      },
      {
        id: 'emin-beef-quarter',
        farmId: 'abattoir-emin',
        name: 'Beef, quarter share',
        category: 'meat',
        price: 13.5,
        unit: 'kg',
        image: 'https://picsum.photos/seed/beefquarter/400/400',
        inStock: true,
        onSale: true,
      },
      {
        id: 'emin-goat-whole',
        farmId: 'abattoir-emin',
        name: 'Young goat, whole',
        category: 'meat',
        price: 19.75,
        unit: 'kg',
        image: 'https://picsum.photos/seed/goatwhole/400/400',
        inStock: true,
      },
      {
        id: 'emin-chicken',
        farmId: 'abattoir-emin',
        name: 'Zabiha chicken',
        category: 'poultry',
        price: 9.25,
        unit: 'kg',
        image: 'https://picsum.photos/seed/zabihachicken/400/400',
        inStock: false,
      },
    ],
    slaughterOptions: [
      {
        id: 'emin-sl-lamb',
        animal: 'lamb',
        label: 'Lamb (30–40 kg live)',
        price: 340,
        yieldKg: 18,
        leadTimeDays: 2,
        splitAllowed: true,
      },
      {
        id: 'emin-sl-goat',
        animal: 'goat',
        label: 'Goat (25–35 kg live)',
        price: 300,
        yieldKg: 14,
        leadTimeDays: 2,
        splitAllowed: true,
      },
      {
        id: 'emin-sl-steer',
        animal: 'cattle',
        label: 'Steer (whole)',
        price: 2650,
        yieldKg: 280,
        leadTimeDays: 7,
        splitAllowed: true,
      },
    ],
    activities: [
      {
        id: 'emin-eid',
        title: 'Eid al-Adha booking',
        detail: 'Reserve a time block for Qurbani. Opens 6 weeks before Eid.',
      },
      {
        id: 'emin-tour',
        title: 'Facility walkthrough',
        detail: 'See the slaughter and processing floor. By appointment, Fridays.',
      },
    ],
  },
  {
    id: 'ferme-turcot',
    name: 'Ferme Turcot',
    town: 'Laval, QC',
    address: '7209 Av. des Perron, Laval, QC H7J 1E9',
    lat: 45.5348,
    lng: -73.8036,
    image: 'https://picsum.photos/seed/fermeturcot/800/500',
    tagline: 'Market-garden farm in Sainte-Dorothée — pick-up & local delivery.',
    services: ['pickup', 'delivery', 'custom-processing'],
    livestock: ['poultry'],
    halalCertified: false,
    rating: 4.5,
    reviewCount: 168,
    travelMin: 22,
    deliveryFee: 6,
    hours: 'Wed–Sun, 9am–6pm',
    phone: '(450) 689-4325',
    products: [
      {
        id: 'turcot-eggs',
        farmId: 'ferme-turcot',
        name: 'Pasture eggs',
        category: 'produce',
        price: 6.5,
        unit: 'dozen',
        image: 'https://picsum.photos/seed/pastureeggs/400/400',
        inStock: true,
      },
      {
        id: 'turcot-strawberries',
        farmId: 'ferme-turcot',
        name: 'Strawberries, flat',
        category: 'produce',
        price: 18,
        unit: 'each',
        image: 'https://picsum.photos/seed/strawberryflat/400/400',
        inStock: true,
        onSale: true,
      },
      {
        id: 'turcot-sweetcorn',
        farmId: 'ferme-turcot',
        name: 'Sweet corn',
        category: 'produce',
        price: 0.75,
        unit: 'each',
        image: 'https://picsum.photos/seed/sweetcorn/400/400',
        inStock: true,
      },
      {
        id: 'turcot-chicken',
        farmId: 'ferme-turcot',
        name: 'Air-chilled chicken',
        category: 'poultry',
        price: 11.5,
        unit: 'kg',
        image: 'https://picsum.photos/seed/airchilledchicken/400/400',
        inStock: true,
      },
    ],
    slaughterOptions: [],
    activities: [
      {
        id: 'turcot-upick',
        title: 'U-pick strawberries',
        detail: 'Bring the family. Baskets provided. Weekends, June–July.',
        date: 'Sat & Sun',
      },
      {
        id: 'turcot-csa',
        title: 'Weekly vegetable basket',
        detail: '16-week CSA share, pickup at the farm stand or downtown drop.',
      },
    ],
  },
  {
    id: 'ferme-du-cedre',
    name: 'Ferme du Cèdre Halal',
    town: 'Mirabel, QC',
    address: '2100 Rang Sainte-Henriette, Mirabel, QC J7N 2R8',
    lat: 45.6501,
    lng: -74.0803,
    image: 'https://picsum.photos/seed/fermecedre/800/500',
    tagline: 'Whole-farm halal — livestock, on-site slaughter, home delivery.',
    services: [
      'on-site-slaughter',
      'zabiha-on-request',
      'custom-processing',
      'pickup',
      'delivery',
      'live-animal-sales',
    ],
    livestock: ['cattle', 'goat', 'lamb', 'poultry'],
    halalCertified: true,
    certifier: 'ISNA Halal',
    rating: 4.8,
    reviewCount: 204,
    travelMin: 38,
    deliveryFee: 9,
    hours: 'Daily, 8am–7pm',
    phone: '(450) 555-0400',
    products: [
      {
        id: 'cedre-lamb-rack',
        farmId: 'ferme-du-cedre',
        name: 'Lamb rack, frenched',
        category: 'meat',
        price: 39.5,
        unit: 'kg',
        image: 'https://picsum.photos/seed/lambrack/400/400',
        inStock: true,
      },
      {
        id: 'cedre-ground-beef',
        farmId: 'ferme-du-cedre',
        name: 'Grass-fed ground beef',
        category: 'meat',
        price: 15.25,
        unit: 'kg',
        image: 'https://picsum.photos/seed/groundbeef/400/400',
        inStock: true,
      },
      {
        id: 'cedre-chicken',
        farmId: 'ferme-du-cedre',
        name: 'Whole zabiha chicken',
        category: 'poultry',
        price: 10.9,
        unit: 'kg',
        image: 'https://picsum.photos/seed/wholechicken/400/400',
        inStock: true,
      },
    ],
    slaughterOptions: [
      {
        id: 'cedre-sl-lamb',
        animal: 'lamb',
        label: 'Lamb (whole)',
        price: 355,
        yieldKg: 19,
        leadTimeDays: 3,
        splitAllowed: true,
      },
      {
        id: 'cedre-sl-goat',
        animal: 'goat',
        label: 'Goat (whole)',
        price: 315,
        yieldKg: 15,
        leadTimeDays: 3,
        splitAllowed: true,
      },
    ],
    activities: [
      {
        id: 'cedre-eid',
        title: 'Eid al-Adha ticketing',
        detail: 'Book a 1-hour Qurbani slot online. Pickup same day.',
      },
    ],
  },
  {
    id: 'baraka-volaille',
    name: 'Baraka Volaille',
    town: 'Napierville, QC',
    address: '512 Rang Saint-André, Napierville, QC J0J 1L0',
    lat: 45.1878,
    lng: -73.4023,
    image: 'https://picsum.photos/seed/barakavolaille/800/500',
    tagline: 'Poultry specialists — hand-slaughtered to order, delivered cold.',
    services: ['zabiha-on-request', 'delivery', 'pickup'],
    livestock: ['poultry'],
    halalCertified: true,
    certifier: 'HMA Canada',
    rating: 4.4,
    reviewCount: 97,
    travelMin: 41,
    deliveryFee: 7,
    hours: 'Tue–Sun, 8am–3pm',
    phone: '(450) 555-0311',
    products: [
      {
        id: 'baraka-chicken',
        farmId: 'baraka-volaille',
        name: 'Zabiha chicken, whole',
        category: 'poultry',
        price: 9.9,
        unit: 'kg',
        image: 'https://picsum.photos/seed/barakachicken/400/400',
        inStock: true,
      },
      {
        id: 'baraka-duck',
        farmId: 'baraka-volaille',
        name: 'Muscovy duck',
        category: 'poultry',
        price: 17.5,
        unit: 'kg',
        image: 'https://picsum.photos/seed/muscovyduck/400/400',
        inStock: true,
      },
      {
        id: 'baraka-eggs',
        farmId: 'baraka-volaille',
        name: 'Farm eggs',
        category: 'produce',
        price: 5.75,
        unit: 'dozen',
        image: 'https://picsum.photos/seed/barakaeggs/400/400',
        inStock: false,
      },
    ],
    slaughterOptions: [
      {
        id: 'baraka-sl-chicken',
        animal: 'poultry',
        label: 'Chicken (per bird)',
        price: 14,
        yieldKg: 1.6,
        leadTimeDays: 1,
        splitAllowed: false,
      },
    ],
    activities: [],
  },
  {
    id: 'bergerie-mont-gregoire',
    name: 'Bergerie du Mont-Saint-Grégoire',
    town: 'Mont-Saint-Grégoire, QC',
    address: '78 Rang de la Montagne, Mont-Saint-Grégoire, QC J0J 1E0',
    lat: 45.3417,
    lng: -73.1698,
    image: 'https://picsum.photos/seed/montgregoire/800/500',
    tagline: 'Pastured sheep and goats — zabiha by appointment.',
    services: ['zabiha-on-request', 'custom-processing', 'pickup'],
    livestock: ['lamb', 'goat'],
    halalCertified: true,
    certifier: 'MCC Halal',
    rating: 4.6,
    reviewCount: 73,
    travelMin: 46,
    deliveryFee: null,
    hours: 'Thu–Sun, 9am–5pm',
    phone: '(450) 555-0529',
    products: [
      {
        id: 'msg-lamb-shoulder',
        farmId: 'bergerie-mont-gregoire',
        name: 'Lamb shoulder',
        category: 'meat',
        price: 21.5,
        unit: 'kg',
        image: 'https://picsum.photos/seed/lambshoulder/400/400',
        inStock: true,
      },
      {
        id: 'msg-merguez',
        farmId: 'bergerie-mont-gregoire',
        name: 'Merguez sausage',
        category: 'meat',
        price: 23,
        unit: 'kg',
        image: 'https://picsum.photos/seed/merguez/400/400',
        inStock: true,
        onSale: true,
      },
    ],
    slaughterOptions: [
      {
        id: 'msg-sl-lamb',
        animal: 'lamb',
        label: 'Lamb (whole)',
        price: 330,
        yieldKg: 17,
        leadTimeDays: 4,
        splitAllowed: true,
      },
    ],
    activities: [
      {
        id: 'msg-lambing',
        title: 'Lambing season visit',
        detail: 'Meet the new lambs. Guided, small groups. March–April.',
        date: 'Spring',
      },
    ],
  },
];

export function getFarm(id: string | undefined) {
  return FARMS.find((farm) => farm.id === id);
}

export const ALL_PRODUCTS: Product[] = FARMS.flatMap((farm) => farm.products);
