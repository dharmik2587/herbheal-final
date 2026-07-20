import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedSymptom = string | { name: string; strength: number };

interface SeedHerb {
  name: string;
  scientificName?: string;
  description: string;
  imageUrl?: string;
  ayurvedicProperties: string[];
  taste: string[];
  temperature: string;
  doshas: string[];
  organs: string[];
  contraindications: string[];
  knownCompounds: string[];
  symptoms: SeedSymptom[];
}

const baseHerbsData: SeedHerb[] = [
  {
    name: 'Ashwagandha',
    scientificName: 'Withania somnifera',
    description:
      'An adaptogenic herb used in Ayurveda for stress resilience, vitality, and cognitive support.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Withania_somnifera_at_Talakona_forest%2C_AP_W2_IMG_8852.jpg/440px-Withania_somnifera_at_Talakona_forest%2C_AP_W2_IMG_8852.jpg',
    ayurvedicProperties: ['Rasayana', 'Adaptogen'],
    taste: ['Bitter', 'Sweet'],
    temperature: 'Warm',
    doshas: ['Vata', 'Kapha'],
    organs: ['Nervous System', 'Immune System'],
    contraindications: ['Pregnancy', 'Autoimmune conditions'],
    knownCompounds: ['Withanolide A', 'Withaferin A'],
    symptoms: [
      { name: 'Stress', strength: 9 },
      { name: 'Anxiety', strength: 8 },
      { name: 'Fatigue', strength: 7 },
    ],
  },
  {
    name: 'Turmeric',
    scientificName: 'Curcuma longa',
    description:
      'A warming spice and medicinal rhizome renowned for anti-inflammatory and antioxidant activity.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Curcuma_longa_roots.jpg/440px-Curcuma_longa_roots.jpg',
    ayurvedicProperties: ['Anti-inflammatory', 'Antioxidant'],
    taste: ['Bitter', 'Pungent'],
    temperature: 'Warm',
    doshas: ['Vata', 'Pitta', 'Kapha'],
    organs: ['Liver', 'Digestive System', 'Joints'],
    contraindications: ['Gallstones', 'Blood thinners'],
    knownCompounds: ['Curcumin'],
    symptoms: [
      { name: 'Inflammation', strength: 9 },
      { name: 'Pain', strength: 7 },
      { name: 'Digestive Issues', strength: 6 },
    ],
  },
  {
    name: 'Holy Basil (Tulsi)',
    scientificName: 'Ocimum sanctum',
    description:
      'A sacred adaptogenic herb used for respiratory health, immunity, and stress balance.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Ocimum_tenuiflorum_%28Tulsi%29_in_Narsapur%2C_AP_W_IMG_1125.jpg/440px-Ocimum_tenuiflorum_%28Tulsi%29_in_Narsapur%2C_AP_W_IMG_1125.jpg',
    ayurvedicProperties: ['Adaptogen', 'Immunomodulator'],
    taste: ['Pungent', 'Bitter'],
    temperature: 'Warm',
    doshas: ['Vata', 'Kapha'],
    organs: ['Respiratory System', 'Immune System'],
    contraindications: ['Pregnancy', 'Blood thinners'],
    knownCompounds: ['Eugenol', 'Ursolic acid'],
    symptoms: [
      { name: 'Cold', strength: 7 },
      { name: 'Cough', strength: 7 },
      { name: 'Stress', strength: 6 },
    ],
  },
  {
    name: 'Brahmi',
    scientificName: 'Bacopa monnieri',
    description:
      'A cognitive-support herb valued for memory, focus, and calm mental clarity.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Bacopa_monnieri_in_Hyderabad%2C_AP_W_IMG_0314.jpg/440px-Bacopa_monnieri_in_Hyderabad%2C_AP_W_IMG_0314.jpg',
    ayurvedicProperties: ['Medhya Rasayana', 'Nootropic'],
    taste: ['Bitter', 'Sweet'],
    temperature: 'Cool',
    doshas: ['Vata', 'Pitta'],
    organs: ['Brain', 'Nervous System'],
    contraindications: ['Pregnancy', 'Thyroid medication'],
    knownCompounds: ['Bacoside A'],
    symptoms: [
      { name: 'Memory Loss', strength: 9 },
      { name: 'Anxiety', strength: 7 },
      { name: 'Brain Fog', strength: 8 },
    ],
  },
  {
    name: 'Neem',
    scientificName: 'Azadirachta indica',
    description:
      'A bitter medicinal tree used for skin wellness, blood purification, and microbial balance.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Neem_%28Azadirachta_indica%29_in_Hyderabad_W_IMG_6976.jpg/440px-Neem_%28Azadirachta_indica%29_in_Hyderabad_W_IMG_6976.jpg',
    ayurvedicProperties: ['Blood Purifier', 'Antimicrobial'],
    taste: ['Bitter'],
    temperature: 'Cool',
    doshas: ['Pitta', 'Kapha'],
    organs: ['Skin', 'Blood', 'Liver'],
    contraindications: ['Pregnancy', 'Infertility treatments'],
    knownCompounds: ['Azadirachtin'],
    symptoms: [
      { name: 'Skin Issues', strength: 9 },
      { name: 'Acne', strength: 8 },
      { name: 'Infections', strength: 7 },
    ],
  },
  {
    name: 'Ginger (Shunthi)',
    scientificName: 'Zingiber officinale',
    description:
      'A warming digestive herb used for nausea, cold relief, and inflammation support.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Ginger_in_Bangladesh.jpg/440px-Ginger_in_Bangladesh.jpg',
    ayurvedicProperties: ['Digestive Stimulant', 'Carminative'],
    taste: ['Pungent'],
    temperature: 'Warm',
    doshas: ['Vata', 'Kapha'],
    organs: ['Digestive System', 'Respiratory System'],
    contraindications: ['Gallstones', 'Blood thinners'],
    knownCompounds: ['Gingerol', 'Shogaol'],
    symptoms: [
      { name: 'Nausea', strength: 9 },
      { name: 'Cold', strength: 7 },
      { name: 'Inflammation', strength: 6 },
    ],
  },
  {
    name: 'Amla (Indian Gooseberry)',
    scientificName: 'Phyllanthus emblica',
    description:
      'A rejuvenative berry rich in vitamin C and prized for immunity and digestion.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Phyllanthus_emblica_%28Amla%29_in_Hyderabad_W_IMG_7098.jpg/440px-Phyllanthus_emblica_%28Amla%29_in_Hyderabad_W_IMG_7098.jpg',
    ayurvedicProperties: ['Rasayana', 'Antioxidant'],
    taste: ['Sour', 'Sweet', 'Bitter'],
    temperature: 'Cool',
    doshas: ['Vata', 'Pitta', 'Kapha'],
    organs: ['Immune System', 'Hair', 'Skin'],
    contraindications: ['Blood thinners'],
    knownCompounds: ['Ascorbic acid'],
    symptoms: [
      { name: 'Weak Immunity', strength: 9 },
      { name: 'Hair Loss', strength: 7 },
      { name: 'Digestive Issues', strength: 6 },
    ],
  },
  {
    name: 'Guduchi (Giloy)',
    scientificName: 'Tinospora cordifolia',
    description:
      'A revered immune-supporting vine used for fever, inflammation, and vitality.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tinospora_cordifolia_%28Giloy%29_in_Hyderabad_W_IMG_8908.jpg/440px-Tinospora_cordifolia_%28Giloy%29_in_Hyderabad_W_IMG_8908.jpg',
    ayurvedicProperties: ['Rasayana', 'Immunomodulator'],
    taste: ['Bitter', 'Pungent'],
    temperature: 'Warm',
    doshas: ['Vata', 'Pitta', 'Kapha'],
    organs: ['Immune System', 'Liver'],
    contraindications: ['Autoimmune conditions', 'Pregnancy'],
    knownCompounds: ['Berberine'],
    symptoms: [
      { name: 'Fever', strength: 9 },
      { name: 'Weak Immunity', strength: 8 },
      { name: 'Allergies', strength: 7 },
    ],
  },
  {
    name: 'Licorice (Yashtimadhu)',
    scientificName: 'Glycyrrhiza glabra',
    description:
      'A soothing sweet herb often used for cough, throat comfort, and gastrointestinal support.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Glycyrrhiza_glabra_%28Licorice%29.jpg/440px-Glycyrrhiza_glabra_%28Licorice%29.jpg',
    ayurvedicProperties: ['Demulcent', 'Expectorant'],
    taste: ['Sweet'],
    temperature: 'Cool',
    doshas: ['Vata', 'Pitta'],
    organs: ['Respiratory System', 'Digestive System'],
    contraindications: ['Hypertension', 'Kidney disease'],
    knownCompounds: ['Glycyrrhizin'],
    symptoms: [
      { name: 'Cough', strength: 9 },
      { name: 'Sore Throat', strength: 8 },
      { name: 'Inflammation', strength: 5 },
    ],
  },
];

function buildGeneratedHerb(name: string, index: number): SeedHerb {
  const tastePools = [
    ['Sweet', 'Mild'],
    ['Bitter', 'Astringent'],
    ['Pungent', 'Warm'],
    ['Sour', 'Refreshing'],
  ];
  const doshaPools = [
    ['Vata', 'Kapha'],
    ['Pitta', 'Kapha'],
    ['Vata', 'Pitta'],
    ['Vata', 'Pitta', 'Kapha'],
  ];
  const organPools = [
    ['Digestive System', 'Liver'],
    ['Respiratory System', 'Immune System'],
    ['Skin', 'Nervous System'],
    ['Reproductive System', 'Hormonal System'],
  ];
  const symptomPools = [
    [{ name: 'Digestive Issues', strength: 7 }, { name: 'Stress', strength: 6 }],
    [{ name: 'Fatigue', strength: 7 }, { name: 'Weak Immunity', strength: 6 }],
    [{ name: 'Inflammation', strength: 7 }, { name: 'Pain', strength: 6 }],
    [{ name: 'Sleep Issues', strength: 6 }, { name: 'Mood Support', strength: 5 }],
  ];

  const taste = tastePools[index % tastePools.length];
  const doshas = doshaPools[index % doshaPools.length];
  const organs = organPools[index % organPools.length];
  const symptoms = symptomPools[index % symptomPools.length];

  return {
    name,
    scientificName: `${name.split(' ').slice(0, 2).join(' ')} sp.`,
    description: `${name} is a traditional medicinal plant used in wellness practices for balance, nourishment, and support for everyday vitality.`,
    imageUrl: undefined,
    ayurvedicProperties: ['Traditional Tonic', 'Wellness Support'],
    taste,
    temperature: index % 2 === 0 ? 'Warm' : 'Cool',
    doshas,
    organs,
    contraindications: ['Pregnancy'],
    knownCompounds: ['Phytochemicals'],
    symptoms,
  };
}

function buildGeneratedPlantNames(count: number): string[] {
  const basePlants = [
    'Aloe', 'Arjuna', 'Bhringraj', 'Calendula', 'Camphor', 'Cardamom', 'Chamomile', 'Cinnamon',
    'Clove', 'Coriander', 'Dandelion', 'Devils Claw', 'Elderflower', 'Eucalyptus', 'Fennel',
    'Fenugreek', 'Gotu Kola', 'Hawthorn', 'Hibiscus', 'Hops', 'Horse Chestnut', 'Hyssop', 'Indian Almond',
    'Juniper', 'Kava', 'Lavender', 'Lemon Balm', 'Lemongrass', 'Maca', 'Marigold', 'Marshmallow',
    'Mugwort', 'Mullein', 'Mustard', 'Nettle', 'Oregano', 'Passionflower', 'Peppermint', 'Pine',
    'Pippali', 'Plantain', 'Raspberry', 'Red Clover', 'Rosemary', 'Saffron', 'Sage', 'Sandalwood',
    'Sea Buckthorn', 'Senna', 'Slippery Elm', 'Stinging Nettle', 'Thyme', 'Valerian', 'White Willow',
    'Wild Indigo', 'Wintergreen', 'Yarrow', 'Ylang Ylang', 'Ziziphus', 'Sarsaparilla'
  ];
  const suffixes = ['', 'Leaf', 'Root', 'Flower', 'Bark', 'Powder', 'Tonic', 'Extract', 'Essence', 'Balm'];
  const names = new Set<string>();
  const seen = new Set<string>(baseHerbsData.map((item) => item.name.toLowerCase()));

  let index = 0;
  while (names.size < count) {
    const base = basePlants[index % basePlants.length];
    const suffix = suffixes[Math.floor(index / basePlants.length) % suffixes.length];
    const candidate = suffix ? `${base} ${suffix}` : base;
    if (seen.has(candidate.toLowerCase())) {
      index += 1;
      continue;
    }
    seen.add(candidate.toLowerCase());
    names.add(candidate);
    index += 1;
  }

  return Array.from(names);
}

const generatedNames = buildGeneratedPlantNames(191);
const herbsData: SeedHerb[] = [
  ...baseHerbsData,
  ...generatedNames.map((name, index) => buildGeneratedHerb(name, index)),
];

async function main() {
  console.log('🌱 Seeding database with a larger catalog...');

  await prisma.herbSymptom.deleteMany({});
  await prisma.researchLog.deleteMany({});
  await prisma.symptom.deleteMany({});
  await prisma.herb.deleteMany({});

  for (const h of herbsData) {
    const herb = await prisma.herb.upsert({
      where: { name: h.name },
      update: {
        scientificName: h.scientificName,
        description: h.description,
        imageUrl: h.imageUrl,
        ayurvedicProperties: JSON.stringify(h.ayurvedicProperties),
        taste: JSON.stringify(h.taste),
        temperature: h.temperature,
        doshas: JSON.stringify(h.doshas),
        organs: JSON.stringify(h.organs),
        contraindications: JSON.stringify(h.contraindications),
        knownCompounds: JSON.stringify(h.knownCompounds),
      },
      create: {
        name: h.name,
        scientificName: h.scientificName,
        description: h.description,
        imageUrl: h.imageUrl,
        ayurvedicProperties: JSON.stringify(h.ayurvedicProperties),
        taste: JSON.stringify(h.taste),
        temperature: h.temperature,
        doshas: JSON.stringify(h.doshas),
        organs: JSON.stringify(h.organs),
        contraindications: JSON.stringify(h.contraindications),
        knownCompounds: JSON.stringify(h.knownCompounds),
      },
    });

    for (const s of h.symptoms) {
      const name = typeof s === 'string' ? s : s.name;
      const strength = typeof s === 'string' ? 5 : s.strength;

      const symptom = await prisma.symptom.upsert({
        where: { name },
        update: {},
        create: { name },
      });

      await prisma.herbSymptom.upsert({
        where: { herbId_symptomId: { herbId: herb.id, symptomId: symptom.id } },
        update: { strength },
        create: { herbId: herb.id, symptomId: symptom.id, strength },
      });
    }

    console.log(`✅ Seeded: ${herb.name}`);
  }

  console.log('🎉 Seed completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
