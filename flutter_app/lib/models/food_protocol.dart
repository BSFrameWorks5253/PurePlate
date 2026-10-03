class FoodProtocol {
  final String id;
  final String category;
  final String title;
  final String foodName;
  final String icon;
  final String adulterant;
  final String healthRisk;
  final List<String> tools;
  final String science;
  final List<String> steps;
  final String pureTitle;
  final String pureDesc;
  final String adulteratedTitle;
  final String adulteratedDesc;

  const FoodProtocol({
    required this.id,
    required this.category,
    required this.title,
    required this.foodName,
    required this.icon,
    required this.adulterant,
    required this.healthRisk,
    required this.tools,
    required this.science,
    required this.steps,
    required this.pureTitle,
    required this.pureDesc,
    required this.adulteratedTitle,
    required this.adulteratedDesc,
  });
}

const List<FoodProtocol> kDefaultProtocols = [
  FoodProtocol(
    id: 'milk_starch',
    category: 'dairy',
    title: 'Milk Starch & Thickener Test',
    foodName: 'Milk & Dairy',
    icon: '🥛',
    adulterant: 'Added Starch / Potato Flour',
    healthRisk: 'Gastrointestinal issues, reduced nutritional absorption.',
    tools: [
      '1 small transparent cup',
      'Tincture of Iodine solution (2-3 drops)',
      '5 ml boiled & cooled milk sample',
    ],
    science:
        'Iodine complexes with amylose in starch to produce a vivid blue/violet coloration. Pure milk shows no color change.',
    steps: [
      'Take 5 ml milk in a transparent cup.',
      'Boil the milk sample and let it cool down.',
      'Add 2-3 drops of Iodine solution and shake gently.',
      'Capture result under camera reticle.',
    ],
    pureTitle: 'Stayed White / Yellow (Pure)',
    pureDesc: 'No starch detected in sample',
    adulteratedTitle: 'Turned Deep Blue / Violet (Adulterated)',
    adulteratedDesc: 'Starch adulteration present',
  ),
  FoodProtocol(
    id: 'milk_water_trail',
    category: 'dairy',
    title: 'Milk Water Trail Slope Test',
    foodName: 'Milk & Dairy',
    icon: '💧',
    adulterant: 'Excess Water Dilution',
    healthRisk: 'Loss of essential fats & vitamins; unhygienic water pathogens.',
    tools: [
      '1 clean slanted polished tile or glass slide',
      'Dropper',
      'Milk sample',
    ],
    science:
        'Pure milk flows slowly leaving a dense white trail. Watered milk runs instantly leaving zero residue.',
    steps: [
      'Hold the slide at a 40°-45° angle.',
      'Put 1 drop of milk at the top.',
      'Observe speed and white trailing trace.',
    ],
    pureTitle: 'Flows Slowly with White Trail',
    pureDesc: 'Natural solid-not-fat density intact',
    adulteratedTitle: 'Runs Rapidly with No Mark',
    adulteratedDesc: 'Severe water dilution detected',
  ),
  FoodProtocol(
    id: 'turmeric_metanil',
    category: 'spices',
    title: 'Turmeric Metanil Yellow Test',
    foodName: 'Turmeric Powder (Haldi)',
    icon: '🌶️',
    adulterant: 'Metanil Yellow & Chalk',
    healthRisk: 'Carcinogenic industrial dye; renal/digestive toxicity.',
    tools: [
      '1 test glass of warm water',
      'Dilute Acid (lemon juice or mild HCl)',
      'Turmeric sample',
    ],
    science:
        'Metanil yellow turns vibrant magenta pink in acid that does not fade upon adding water.',
    steps: [
      'Add 1 tsp turmeric powder in warm water.',
      'Add few drops of lemon juice or mild acid.',
      'Observe whether color turns pink/magenta.',
    ],
    pureTitle: 'Golden Yellow to Light Orange',
    pureDesc: 'Natural curcumin response',
    adulteratedTitle: 'Bright Magenta / Pink',
    adulteratedDesc: 'Metanil yellow dye detected',
  ),
  FoodProtocol(
    id: 'chili_brick_dust',
    category: 'spices',
    title: 'Chili Powder Brick Dust Test',
    foodName: 'Red Chili Powder',
    icon: '🌶️',
    adulterant: 'Brick Dust, Grit & Rhodamine Dye',
    healthRisk: 'Intestinal abrasions, ulcers, heavy mineral toxicity.',
    tools: [
      '1 glass of clean water',
      '1 teaspoon of red chili powder',
    ],
    science:
        'Chili powder floats initially; brick dust sinks rapidly to the bottom as dense red grit.',
    steps: [
      'Gently sprinkle chili powder on water surface.',
      'Inspect bottom sediment formation.',
    ],
    pureTitle: 'Floats on Water, Gentle Color Diffusion',
    pureDesc: 'Pure dried chili flakes',
    adulteratedTitle: 'Dense Heavy Grit Sinks to Bottom',
    adulteratedDesc: 'Brick dust and sand adulteration',
  ),
  FoodProtocol(
    id: 'honey_water',
    category: 'sweeteners',
    title: 'Honey Water Dispersion Test',
    foodName: 'Natural Honey',
    icon: '🍯',
    adulterant: 'Invert Sugar / Corn Syrup',
    healthRisk: 'Nutrient-deficient sugar spike, zero live enzymes.',
    tools: [
      '1 glass of room-temp water',
      '1 tablespoon of honey',
    ],
    science:
        'High viscosity pure honey sinks as an intact blob without dissolving until stirred.',
    steps: [
      'Drop 1 spoon of honey in clean water without stirring.',
      'Watch dispersion rate.',
    ],
    pureTitle: 'Settles as Intact Drop at Bottom',
    pureDesc: 'High natural density',
    adulteratedTitle: 'Clouds & Dissolves Rapidly',
    adulteratedDesc: 'Sugar syrup adulteration',
  ),
];
