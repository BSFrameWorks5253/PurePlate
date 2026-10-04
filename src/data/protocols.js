/**
 * PurePlate Food Testing Protocols & Initial Database
 * Based on FSSAI (DART) & Citizen Science Protocols
 */

export const FOOD_PROTOCOLS = [
  {
    id: "milk_starch",
    category: "dairy",
    title: "Milk Starch & Thickener Test",
    foodName: "Milk & Dairy",
    icon: "🥛",
    adulterant: "Added Starch / Potato Flour",
    healthRisk: "Severe gastrointestinal issues, altered insulin response, nutrient dilution.",
    tools: [
      "1 small transparent glass cup",
      "Tincture of Iodine solution (2-3 drops)",
      "5 ml milk sample (boiled & cooled)"
    ],
    science: "Iodine (triiodide ion) slips inside the helical structure of amylose in starch, creating a charge-transfer complex that turns the liquid deep blue or purple. Pure milk does not react and stays white or pale yellowish.",
    steps: [
      "Take 5 ml of milk sample in a clean transparent glass cup.",
      "Boil the milk sample thoroughly and let it cool to room temperature.",
      "Add 2-3 drops of Iodine solution and shake or swirl gently.",
      "Hold the cup inside the camera target ring and verify color change."
    ],
    visualGuide: {
      pureTitle: "Stayed White / Pale Yellow",
      pureDesc: "Pure milk without starch contamination",
      pureColorHex: "#FAF8F5",
      adulteratedTitle: "Turned Deep Blue / Violet",
      adulteratedDesc: "Starch adulteration present (>0.1% starch)",
      adulteratedColorHex: "#1E1B4B"
    }
  },
  {
    id: "milk_water_trail",
    category: "dairy",
    title: "Milk Water Trail (Slip Slope Test)",
    foodName: "Milk & Dairy",
    icon: "💧",
    adulterant: "Excess Added Water / Dilution",
    healthRisk: "Severe reduction of calcium and proteins, microbiological contamination from tap water.",
    tools: [
      "1 clean slanted glass plate or polished tile",
      "Dropper or spoon",
      "Milk sample"
    ],
    science: "Pure milk contains fats and solids that adhere to a slanted surface, flowing slowly and leaving a visible white trail. Watered-down milk flows instantly without leaving any white trail behind.",
    steps: [
      "Place a drop of milk on a polished slanted surface (35°-45° angle).",
      "Pure milk flows slowly, leaving a clear white trail behind.",
      "Water-adulterated milk runs immediately without leaving any mark."
    ],
    visualGuide: {
      pureTitle: "Flows Slowly, Leaves White Trail",
      pureDesc: "Natural density and milk solids intact",
      pureColorHex: "#F5F5F0",
      adulteratedTitle: "Runs Rapidly, Leaves No Trail",
      adulteratedDesc: "Significant water dilution detected",
      adulteratedColorHex: "#E2E8F0"
    }
  },
  {
    id: "turmeric_metanil",
    category: "spices",
    title: "Turmeric Powder Color Test",
    foodName: "Turmeric Powder (Haldi)",
    icon: "🌶️",
    adulterant: "Metanil Yellow & Chalk Powder",
    healthRisk: "Metanil Yellow is a non-permitted cancer-causing industrial dye; chalk causes digestive calcification.",
    tools: [
      "1 transparent test tube or glass",
      "Dilute Hydrochloric Acid (HCl) or Lemon/Vinegar + warm water",
      "Turmeric powder sample"
    ],
    science: "When dilute acid is added to pure turmeric in warm water, it turns slightly red and fades back when water is added. If Metanil yellow is present, it turns vibrant magenta/pink that persists even after dilution.",
    steps: [
      "Take 1 teaspoon of turmeric powder in a glass of warm water.",
      "Add a few drops of mild acid (dilute HCl or concentrated lemon juice).",
      "Observe if the color flashes magenta/bright pink."
    ],
    visualGuide: {
      pureTitle: "Golden Yellow to Light Orange",
      pureDesc: "Natural curcumin pigments present",
      pureColorHex: "#EAB308",
      adulteratedTitle: "Bright Magenta / Crimson Pink",
      adulteratedDesc: "Toxic Metanil Yellow dye detected",
      adulteratedColorHex: "#BE185D"
    }
  },
  {
    id: "chili_brick_dust",
    category: "spices",
    title: "Chili Powder Brick Dust & Dye Test",
    foodName: "Red Chili Powder",
    icon: "🌶️",
    adulterant: "Brick Dust, Talc & Rhodamine B Dye",
    healthRisk: "Damage to intestinal lining, stomach ulcers, carcinogenic dyes.",
    tools: [
      "1 tall transparent glass filled with clean water",
      "1 teaspoon of red chili powder"
    ],
    science: "Pure chili powder stays afloat on the surface of water for several minutes before slowly wetting. Brick dust and heavy mineral talc immediately sink to the bottom as gritty sediment, leaving red artificial streaks.",
    steps: [
      "Add a teaspoon of chili powder to a glass of water without stirring.",
      "Watch the falling particles carefully.",
      "Check the bottom of the glass: gritty residue indicates brick dust/sand."
    ],
    visualGuide: {
      pureTitle: "Floats on Top, Light Color Diffusion",
      pureDesc: "Pure dried ground chili peppers",
      pureColorHex: "#DC2626",
      adulteratedTitle: "Heavy Red Sediment at Bottom",
      adulteratedDesc: "Brick dust and mineral grit detected",
      adulteratedColorHex: "#7F1D1D"
    }
  },
  {
    id: "honey_water",
    category: "sweeteners",
    title: "Honey Water Dispersion Test",
    foodName: "Pure Natural Honey",
    icon: "🍯",
    adulterant: "Invert Sugar, High Fructose Corn Syrup",
    healthRisk: "Metabolic syndrome, high glycemic spikes, absence of antibacterial bio-enzymes.",
    tools: [
      "1 glass of cold water",
      "1 tablespoon of honey sample"
    ],
    science: "Pure honey has high specific gravity and dense intermolecular cohesion. When dropped in water, it settles at the bottom like a solid thread without dissolving until stirred. Sugar syrup disperses immediately.",
    steps: [
      "Take a glass of cold water.",
      "Drop a spoonful of honey into the water without stirring.",
      "Observe how the honey settles or dissolves."
    ],
    visualGuide: {
      pureTitle: "Settles at Bottom as Solid Blob",
      pureDesc: "High viscosity natural raw honey",
      pureColorHex: "#D97706",
      adulteratedTitle: "Rapidly Clouds and Dissolves",
      adulteratedDesc: "Invert sugar syrup adulteration",
      adulteratedColorHex: "#FDE68A"
    }
  },
  {
    id: "oil_argemone",
    category: "oils",
    title: "Mustard Oil Argemone Seed Test",
    foodName: "Edible Mustard Oil / Cooking Oil",
    icon: "🫒",
    adulterant: "Toxic Argemone Oil",
    healthRisk: "Causes epidemic dropsy, cardiac arrest, peripheral neuropathy, and severe edema.",
    tools: [
      "5 ml mustard oil sample",
      "5 ml concentrated Nitric Acid (performed in lab or school chemistry club)"
    ],
    science: "Argemone oil contains the alkaloids sanguinarine and dihydrosanguinarine which react with nitric acid to produce a crimson-red interface ring.",
    steps: [
      "Take 5 ml oil sample in a test tube.",
      "Carefully add 5 ml nitric acid along the sides.",
      "Observe the junction line between the two liquids."
    ],
    visualGuide: {
      pureTitle: "Clear Pale Yellow / Golden Layer",
      pureDesc: "No crimson ring formed",
      pureColorHex: "#CA8A04",
      adulteratedTitle: "Crimson Red Ring at Layer Boundary",
      adulteratedDesc: "Toxic Argemone Oil detected",
      adulteratedColorHex: "#991B1B"
    }
  }
];

export const INITIAL_MAP_INCIDENTS = [
  {
    id: "inc_001",
    lat: 21.1764,
    lng: 72.8052,
    road: "Ghod Dod Road",
    neighborhood: "Athwa Lines, Surat",
    landmark: "Near Joggers Park & Subhash Chowk",
    address: "Shop 4, Silver Point Arcade, Ghod Dod Road, Athwa Lines, Surat - 395007",
    food: "Milk & Dairy",
    testType: "Milk Starch Test",
    status: "fail",
    adulterant: "Added Starch & Potato Flour",
    vendorType: "Local Loose Milk Vendor",
    timestamp: "10 mins ago",
    date: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    failCountInArea: 4,
    notes: "Sample turned deep purple with Iodine. Repeated adulteration report from Ghod Dod Road dairy."
  },
  {
    id: "inc_002",
    lat: 21.1848,
    lng: 72.7725,
    road: "Gaurav Path / VIP Road",
    neighborhood: "Pal, Surat",
    landmark: "Opposite ISCON Mall",
    address: "Block B, Galaxy Enclave, Gaurav Path, Pal, Surat - 395009",
    food: "Turmeric Powder",
    testType: "Turmeric Metanil Yellow Test",
    status: "pass",
    adulterant: "None detected",
    vendorType: "Supermarket Brand Packet",
    timestamp: "1 hour ago",
    date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    failCountInArea: 0,
    notes: "Passed acid dispersion test with clean yellow fading."
  },
  {
    id: "inc_003",
    lat: 21.1965,
    lng: 72.7958,
    road: "Anand Mahal Road",
    neighborhood: "Adajan, Surat",
    landmark: "Near Prime Arcade & Star Bazaar",
    address: "Shop 12, Subhash Market, Anand Mahal Road, Adajan, Surat - 395009",
    food: "Red Chili Powder",
    testType: "Chili Powder Brick Dust Test",
    status: "fail",
    adulterant: "Heavy Brick Dust & Grit",
    vendorType: "Street Market Bazaar",
    timestamp: "2 hours ago",
    date: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    failCountInArea: 3,
    notes: "Dense red sediment sank to water bottom immediately."
  },
  {
    id: "inc_004",
    lat: 21.2155,
    lng: 72.8525,
    road: "Varachha Main Road",
    neighborhood: "Varachha, Surat",
    landmark: "Near Hirabaug Circle & Diamond Market",
    address: "Plot 18, Khodiyar Nagar, Varachha Main Road, Surat - 395006",
    food: "Milk & Dairy",
    testType: "Milk Starch Test",
    status: "fail",
    adulterant: "Added Starch & Detergent",
    vendorType: "Local Loose Milk Vendor",
    timestamp: "4 hours ago",
    date: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    failCountInArea: 5,
    notes: "Turned ink blue upon iodine drops. Neighborhood alert triggered."
  },
  {
    id: "inc_005",
    lat: 21.1685,
    lng: 72.7885,
    road: "City Light Road",
    neighborhood: "City Light, Surat",
    landmark: "Near Science Centre & Anuvrat Dwar",
    address: "B-202, Royal Palace, City Light Road, Surat - 395007",
    food: "Honey",
    testType: "Honey Water Dispersion Test",
    status: "pass",
    adulterant: "None detected",
    vendorType: "Home Delivery Service",
    timestamp: "5 hours ago",
    date: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    failCountInArea: 0,
    notes: "Settled firmly as a pure droplet without dispersion."
  },
  {
    id: "inc_006",
    lat: 21.1822,
    lng: 72.8188,
    road: "Ring Road",
    neighborhood: "Majura Gate, Surat",
    landmark: "Near Majura Gate Flyover & New Civil Hospital",
    address: "Stall 7, Navjivan Circle, Ring Road, Majura Gate, Surat - 395002",
    food: "Milk & Dairy",
    testType: "Milk Water Trail Test",
    status: "fail",
    adulterant: "Over 35% Added Tap Water",
    vendorType: "Local Loose Milk Vendor",
    timestamp: "7 hours ago",
    date: new Date(Date.now() - 420 * 60 * 1000).toISOString(),
    failCountInArea: 3,
    notes: "Zero white trail left on 45° slanted tile."
  }
];

export const SCIENCE_QUIZ_DATA = [
  {
    id: "q1",
    question: "When testing milk for starch with Iodine solution, what color indicates adulteration?",
    options: [
      { text: "Pure White / Pale Cream", isCorrect: false },
      { text: "Deep Blue / Violet", isCorrect: true },
      { text: "Bright Emerald Green", isCorrect: false },
      { text: "Transparent Colorless", isCorrect: false }
    ],
    explanation: "Iodine molecules insert into the helical coils of starch, forming an intensely colored charge-transfer complex that turns deep blue/violet."
  },
  {
    id: "q2",
    question: "Why do unethical milk vendors add starch or potato flour to milk?",
    options: [
      { text: "To make it smell like butter", isCorrect: false },
      { text: "To artificially increase thickness after diluting it with water", isCorrect: true },
      { text: "To keep the milk cold for longer", isCorrect: false },
      { text: "To increase natural protein levels", isCorrect: false }
    ],
    explanation: "Vendors dilute milk with cheap water to increase quantity, then add starch to increase viscosity and mimic rich fat thickness."
  },
  {
    id: "q3",
    question: "In the Chili Powder water glass test, why does brick dust sink straight to the bottom?",
    options: [
      { text: "Brick dust is heavier and denser than dried chili flakes", isCorrect: true },
      { text: "Chili powder dissolves in water instantly", isCorrect: false },
      { text: "Water repels chili color completely", isCorrect: false },
      { text: "Brick dust turns into steam", isCorrect: false }
    ],
    explanation: "Inorganic mineral particles like brick dust and silica have high specific gravity, making them sink rapidly while natural chili flakes float initially."
  },
  {
    id: "q4",
    question: "What happens when you drop a spoonful of pure, unadulterated honey into cold water without stirring?",
    options: [
      { text: "It turns into foam instantly", isCorrect: false },
      { text: "It dissolves and clouds the entire glass in seconds", isCorrect: false },
      { text: "It settles at the bottom like a solid thread without dissolving", isCorrect: true },
      { text: "It changes water into bright blue color", isCorrect: false }
    ],
    explanation: "Pure honey's high density and viscous cohesion make it sink to the base as an intact droplet. Adulterated high-fructose corn syrup dissolves immediately."
  }
];

export const ADULTERANT_MATCH_DATA = [
  { id: "m1", food: "🥛 Milk", adulterant: "Starch & Water" },
  { id: "m2", food: "🌶️ Turmeric", adulterant: "Metanil Yellow Dye" },
  { id: "m3", food: "🌶️ Chili Powder", adulterant: "Brick Dust & Sand" },
  { id: "m4", food: "🍯 Honey", adulterant: "Invert Sugar Syrup" }
];
