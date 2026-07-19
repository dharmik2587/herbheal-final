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

const herbsData: SeedHerb[] = [
  {
    name: 'Ashwagandha',
    scientificName: 'Withania somnifera',
    description:
      'An ancient adaptogenic herb used in Ayurveda for over 3,000 years. Ashwagandha is renowned for its ability to help the body resist physiological and psychological stress. It supports vitality, cognitive function, and overall well-being by modulating cortisol levels and enhancing the body\'s resilience to daily stressors.',
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
      { name: 'Insomnia', strength: 6 },
    ],
  },
  {
    name: 'Turmeric',
    scientificName: 'Curcuma longa',
    description:
      'A warming anti-inflammatory rhizome that is central to both Ayurvedic medicine and Indian cuisine. Turmeric\'s primary active compound, curcumin, has been extensively studied for its potent anti-inflammatory, antioxidant, and neuroprotective properties. It supports joint health, liver function, and digestive wellness.',
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
      'Revered as the "Queen of Herbs" in Ayurveda, Holy Basil (Tulsi) is a sacred adaptogenic plant with a long history of use in Indian traditional medicine. It supports respiratory health, strengthens the immune system, and helps the body adapt to environmental and emotional stress. Tulsi is also valued for its antimicrobial and antioxidant properties.',
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
      { name: 'Fever', strength: 5 },
    ],
  },
  {
    name: 'Brahmi',
    scientificName: 'Bacopa monnieri',
    description:
      'A powerful brain tonic used in Ayurveda for centuries to enhance memory, concentration, and cognitive function. Brahmi is classified as a Medhya Rasayana — a rejuvenative for the mind. It supports neuronal communication, reduces anxiety, and helps manage symptoms of ADHD and brain fog. Modern research confirms its neuroprotective and antioxidant effects.',
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
      { name: 'ADHD', strength: 6 },
      { name: 'Brain Fog', strength: 8 },
    ],
  },
  {
    name: 'Triphala',
    scientificName: 'Traditional blend (Amalaki, Bibhitaki, Haritaki)',
    description:
      'A cornerstone polyherbal formula in Ayurveda composed of three fruits: Amalaki, Bibhitaki, and Haritaki. Triphala is celebrated for its gentle yet effective digestive cleansing properties. It balances all three doshas and is used to promote regular bowel movements, reduce bloating, and support overall gastrointestinal health. It also has antioxidant and anti-inflammatory properties.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Terminalia_chebula_%28Myrobalan%29_in_Hyderabad_W_IMG_4633.jpg/440px-Terminalia_chebula_%28Myrobalan%29_in_Hyderabad_W_IMG_4633.jpg',
    ayurvedicProperties: ['Digestive Cleanser', 'Tridoshic'],
    taste: ['Sweet', 'Sour', 'Pungent', 'Bitter', 'Astringent', 'Salty'],
    temperature: 'Balanced',
    doshas: ['Vata', 'Pitta', 'Kapha'],
    organs: ['Digestive System', 'Colon'],
    contraindications: ['Pregnancy', 'Diarrhea'],
    knownCompounds: ['Gallic acid'],
    symptoms: [
      { name: 'Constipation', strength: 9 },
      { name: 'Bloating', strength: 7 },
      { name: 'Digestive Issues', strength: 8 },
    ],
  },
  {
    name: 'Neem',
    scientificName: 'Azadirachta indica',
    description:
      'Known as the "Village Pharmacy" in India, Neem is one of the most versatile medicinal trees in Ayurveda. Its intensely bitter leaves, bark, and oil are used for blood purification, skin disorders, and as a natural antimicrobial. Neem supports detoxification, helps manage acne and skin infections, and has been traditionally used to reduce fevers.',
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
      { name: 'Fever', strength: 5 },
    ],
  },
  {
    name: 'Shatavari',
    scientificName: 'Asparagus racemosus',
    description:
      'Known as the "Queen of Herbs" for women\'s health, Shatavari is a premier rejuvenative in Ayurveda. Its name translates to "she who possesses a hundred husbands," reflecting its traditional use in supporting female reproductive health. Shatavari nourishes and balances hormones, supports lactation, soothes the digestive tract, and provides adaptogenic benefits for stress management.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Asparagus_racemosus_-_Talakona_forest%2C_AP%2C_India.jpg/440px-Asparagus_racemosus_-_Talakona_forest%2C_AP%2C_India.jpg',
    ayurvedicProperties: ['Rasayana', 'Female Rejuvenative'],
    taste: ['Sweet', 'Bitter'],
    temperature: 'Cool',
    doshas: ['Vata', 'Pitta'],
    organs: ['Reproductive System', 'Digestive System'],
    contraindications: ['Kidney disorders', 'Hormone-sensitive conditions'],
    knownCompounds: ['Shatavarin'],
    symptoms: [
      { name: 'Hormonal Imbalance', strength: 9 },
      { name: 'Fatigue', strength: 7 },
      { name: 'Digestive Issues', strength: 6 },
    ],
  },
  {
    name: 'Ginger (Shunthi)',
    scientificName: 'Zingiber officinale',
    description:
      'Called "Vishwabhesaj" (universal remedy) in Ayurveda, Ginger has been used for millennia across cultures as both a culinary spice and a medicinal root. Its warming, pungent nature makes it excellent for stimulating digestion (Agni), relieving nausea, easing cold symptoms, and reducing inflammation. Both fresh (Ardrakam) and dried (Shunthi) forms are used therapeutically.',
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
      { name: 'Digestive Issues', strength: 8 },
    ],
  },
  {
    name: 'Amla (Indian Gooseberry)',
    scientificName: 'Phyllanthus emblica',
    description:
      'One of the richest natural sources of Vitamin C, Amla (Indian Gooseberry) is a cornerstone of Ayurvedic medicine and a key ingredient in the Triphala formula. It supports immune function, promotes healthy hair and skin, aids digestion, and acts as a powerful antioxidant. Amla is one of the rare herbs that balances all three doshas, making it universally beneficial.',
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
      { name: 'Fatigue', strength: 6 },
    ],
  },
  {
    name: 'Guduchi (Giloy)',
    scientificName: 'Tinospora cordifolia',
    description:
      'Known as "Amrita" (the root of immortality) in Ayurveda, Guduchi is a powerful immune modulator and rejuvenative herb. It is widely used to manage fevers, boost immunity, combat allergies, and support liver function. Guduchi enhances the body\'s natural defense mechanisms and has been extensively studied for its immunomodulatory, anti-inflammatory, and hepatoprotective properties.',
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
      { name: 'Stress', strength: 5 },
    ],
  },
  {
    name: 'Licorice (Yashtimadhu)',
    scientificName: 'Glycyrrhiza glabra',
    description:
      'One of the most widely used herbs in Ayurveda, Licorice (Yashtimadhu) is prized for its sweet, soothing properties. It is a premier herb for respiratory conditions, helping to relieve coughs, sore throats, and bronchial congestion. Licorice also supports digestive health by soothing the mucous membranes of the GI tract. Its demulcent and expectorant qualities make it a common ingredient in traditional formulations.',
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
      { name: 'Digestive Issues', strength: 6 },
      { name: 'Inflammation', strength: 5 },
    ],
  },
  {
    name: 'Haritaki',
    scientificName: 'Terminalia chebula',
    description:
      'Often called the "King of Herbs" in Ayurveda and Tibetan medicine, Haritaki is one of the three fruits in the Triphala formula. It is revered for its remarkable ability to cleanse and rejuvenate the digestive tract. Haritaki supports regular bowel movements, reduces bloating, aids in detoxification, and is considered a tonic for overall longevity. It uniquely contains five of the six tastes, making it balancing for all doshas.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Terminalia_chebula_fruits_at_Jayanti%2C_Duars%2C_WB_W_IMG_5340.jpg/440px-Terminalia_chebula_fruits_at_Jayanti%2C_Duars%2C_WB_W_IMG_5340.jpg',
    ayurvedicProperties: ['Rasayana', 'Digestive Tonic'],
    taste: ['Sweet', 'Sour', 'Pungent', 'Bitter', 'Astringent'],
    temperature: 'Warm',
    doshas: ['Vata', 'Pitta', 'Kapha'],
    organs: ['Digestive System', 'Colon', 'Immune System'],
    contraindications: ['Pregnancy', 'Dehydration'],
    knownCompounds: ['Chebulagic acid'],
    symptoms: [
      { name: 'Constipation', strength: 9 },
      { name: 'Bloating', strength: 8 },
      { name: 'Detox', strength: 7 },
      { name: 'Digestive Issues', strength: 8 },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding database...');

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
