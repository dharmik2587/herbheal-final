"""
HerbHeal Compass — Fully Hardcoded Demo Backend
================================================
Zero external dependencies. No CSV. No DeepSeek. No IUCN API.
Everything is hardcoded for a flawless demo video.

Run:  python app_demo.py
API:  http://localhost:5000
"""

import logging
import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# ============================================================
# HARDCODED PLANT DATABASE — 25 Medicinal Plants
# ============================================================

PLANTS = [
    {
        "plant_id": 1, "name": "Tulsi", "scientific_name": "Ocimum tenuiflorum",
        "family": "Lamiaceae", "genus": "Ocimum",
        "region": "Indian Subcontinent", "traditional_system": "Ayurveda",
        "iucn_status": "Safe",
        "uses": ["immunity", "respiratory infections", "stress relief", "fever", "cough"],
        "contraindications": ["May lower blood sugar — caution with diabetes medication", "Avoid during pregnancy in large doses", "May slow blood clotting"],
        "names": {"hi": "तुलसी", "sa": "सुरसा", "ta": "துளசி"},
        "description": "Known as the 'Queen of Herbs' in Ayurveda. Tulsi is an adaptogenic herb used for thousands of years to support immunity and respiratory health.",
        "image_url": ""
    },
    {
        "plant_id": 2, "name": "Ashwagandha", "scientific_name": "Withania somnifera",
        "family": "Solanaceae", "genus": "Withania",
        "region": "India, North Africa", "traditional_system": "Ayurveda",
        "iucn_status": "Safe",
        "uses": ["anxiety", "stress relief", "sleep disorders", "immunity", "stamina"],
        "contraindications": ["Avoid during pregnancy", "May interact with thyroid medications", "Can cause drowsiness"],
        "names": {"hi": "अश्वगंधा", "sa": "अश्वगन्धा", "ta": "அமுக்குரா"},
        "description": "One of the most important herbs in Ayurveda. An adaptogen that helps the body manage stress and promotes restful sleep.",
        "image_url": ""
    },
    {
        "plant_id": 3, "name": "Turmeric", "scientific_name": "Curcuma longa",
        "family": "Zingiberaceae", "genus": "Curcuma",
        "region": "South Asia", "traditional_system": "Ayurveda",
        "iucn_status": "Safe",
        "uses": ["inflammation", "joint pain", "digestion", "skin disorders", "liver disease"],
        "contraindications": ["May interact with blood thinners", "High doses can cause stomach upset", "Avoid before surgery"],
        "names": {"hi": "हल्दी", "sa": "हरिद्रा", "ta": "மஞ்சள்"},
        "description": "The golden spice of India. Curcumin, its active compound, is one of the most studied natural anti-inflammatory agents in the world.",
        "image_url": ""
    },
    {
        "plant_id": 4, "name": "Neem", "scientific_name": "Azadirachta indica",
        "family": "Meliaceae", "genus": "Azadirachta",
        "region": "Indian Subcontinent", "traditional_system": "Ayurveda",
        "iucn_status": "Safe",
        "uses": ["skin disorders", "blood purification", "diabetes", "fever", "dental care"],
        "contraindications": ["Avoid during pregnancy", "May lower blood sugar excessively", "Not safe for infants"],
        "names": {"hi": "नीम", "sa": "निम्ब", "ta": "வேம்பு"},
        "description": "Called the 'village pharmacy' of India. Every part of the neem tree has medicinal value — leaves, bark, seeds, and flowers.",
        "image_url": ""
    },
    {
        "plant_id": 5, "name": "Brahmi", "scientific_name": "Bacopa monnieri",
        "family": "Plantaginaceae", "genus": "Bacopa",
        "region": "Wetlands of India", "traditional_system": "Ayurveda",
        "iucn_status": "Safe",
        "uses": ["memory enhancement", "anxiety", "cognitive function", "epilepsy", "stress relief"],
        "contraindications": ["May cause nausea on empty stomach", "Can slow heart rate", "Avoid with sedatives"],
        "names": {"hi": "ब्राह्मी", "sa": "ब्राह्मी", "ta": "நீர்ப்பிரம்மி"},
        "description": "The herb of grace. Brahmi has been used for centuries to enhance memory, learning, and cognitive performance in Ayurvedic medicine.",
        "image_url": ""
    },
    {
        "plant_id": 6, "name": "Sarpagandha", "scientific_name": "Rauvolfia serpentina",
        "family": "Apocynaceae", "genus": "Rauvolfia",
        "region": "Indian Subcontinent, East Asia", "traditional_system": "Ayurveda",
        "iucn_status": "Endangered",
        "uses": ["hypertension", "anxiety", "insomnia", "mental disorders", "snake bites"],
        "contraindications": ["Can cause severe depression", "Dangerous drop in blood pressure", "Never combine with MAO inhibitors", "Avoid in pregnancy"],
        "names": {"hi": "सर्पगंधा", "sa": "सर्पगन्धा", "ta": "சர்ப்பகந்தி"},
        "description": "Source of the alkaloid reserpine, once a cornerstone of hypertension treatment. Now critically endangered due to over-harvesting from the wild.",
        "image_url": ""
    },
    {
        "plant_id": 7, "name": "Red Sandalwood", "scientific_name": "Pterocarpus santalinus",
        "family": "Fabaceae", "genus": "Pterocarpus",
        "region": "Andhra Pradesh, India", "traditional_system": "Ayurveda",
        "iucn_status": "Endangered",
        "uses": ["skin disorders", "inflammation", "wound healing", "fever", "blood purification"],
        "contraindications": ["Generally safe topically", "Avoid internal use without guidance", "May cause allergic reactions in sensitive individuals"],
        "names": {"hi": "लाल चंदन", "sa": "रक्तचन्दन", "ta": "செஞ்சந்தனம்"},
        "description": "Prized for its deep red heartwood. Extensively smuggled and illegally harvested, making it one of the most endangered trees in India.",
        "image_url": ""
    },
    {
        "plant_id": 8, "name": "Indian Kino Tree", "scientific_name": "Pterocarpus marsupium",
        "family": "Fabaceae", "genus": "Pterocarpus",
        "region": "India, Nepal, Sri Lanka", "traditional_system": "Ayurveda",
        "iucn_status": "Vulnerable",
        "uses": ["diabetes", "diarrhea", "inflammation", "skin disorders", "liver disease"],
        "contraindications": ["May lower blood sugar — monitor closely", "Can interact with diabetes medications", "Avoid before surgery"],
        "names": {"hi": "विजयसार", "sa": "असनवृक्ष", "ta": "வேங்கை"},
        "description": "Known as Vijaysar, the heartwood is soaked in water overnight and consumed to manage blood sugar. Under threat due to deforestation.",
        "image_url": ""
    },
    {
        "plant_id": 9, "name": "Jatamansi", "scientific_name": "Nardostachys jatamansi",
        "family": "Caprifoliaceae", "genus": "Nardostachys",
        "region": "Himalayas", "traditional_system": "Ayurveda",
        "iucn_status": "Critically Endangered",
        "uses": ["sleep disorders", "anxiety", "memory enhancement", "epilepsy", "stress relief"],
        "contraindications": ["Avoid during pregnancy", "May cause drowsiness", "Can interact with CNS depressants"],
        "names": {"hi": "जटामांसी", "sa": "जटामांसी", "ta": "ஜடாமாஞ்சி"},
        "description": "The Himalayan spikenard. One of the most endangered medicinal plants, harvested from altitudes above 3,000m. Urgently needs protection.",
        "image_url": ""
    },
    {
        "plant_id": 10, "name": "Amla", "scientific_name": "Phyllanthus emblica",
        "family": "Phyllanthaceae", "genus": "Phyllanthus",
        "region": "Indian Subcontinent", "traditional_system": "Ayurveda",
        "iucn_status": "Safe",
        "uses": ["immunity", "digestion", "hair health", "vitamin C source", "anti-aging"],
        "contraindications": ["May lower blood sugar", "Can increase bleeding risk with blood thinners", "Excessive use may cause acidity"],
        "names": {"hi": "आंवला", "sa": "आमलकी", "ta": "நெல்லிக்காய்"},
        "description": "The Indian gooseberry. Contains 20 times more vitamin C than oranges. A cornerstone of Triphala, one of Ayurveda's most important formulations.",
        "image_url": ""
    },
    {
        "plant_id": 11, "name": "Giloy", "scientific_name": "Tinospora cordifolia",
        "family": "Menispermaceae", "genus": "Tinospora",
        "region": "India, Myanmar", "traditional_system": "Ayurveda",
        "iucn_status": "Safe",
        "uses": ["fever", "immunity", "diabetes", "digestion", "liver disease"],
        "contraindications": ["May lower blood sugar", "Can cause constipation", "Avoid in autoimmune diseases"],
        "names": {"hi": "गिलोय", "sa": "गुडूची", "ta": "சீந்தில்"},
        "description": "Called Amrita (the root of immortality) in Sanskrit. Became widely popular during COVID-19 for its immunomodulatory properties.",
        "image_url": ""
    },
    {
        "plant_id": 12, "name": "Shatavari", "scientific_name": "Asparagus racemosus",
        "family": "Asparagaceae", "genus": "Asparagus",
        "region": "India, Himalayas", "traditional_system": "Ayurveda",
        "iucn_status": "Vulnerable",
        "uses": ["reproductive health", "digestion", "immunity", "stress relief", "lactation"],
        "contraindications": ["Avoid with estrogen-sensitive conditions", "May cause allergic reactions in asparagus-allergic individuals", "Can cause weight gain"],
        "names": {"hi": "शतावरी", "sa": "शतावरी", "ta": "தண்ணீர்விட்டான்"},
        "description": "The 'Queen of Herbs' for women's health. Used for centuries to support female reproductive health and hormonal balance.",
        "image_url": ""
    },
    {
        "plant_id": 13, "name": "Guduchi", "scientific_name": "Tinospora sinensis",
        "family": "Menispermaceae", "genus": "Tinospora",
        "region": "China, Southeast Asia", "traditional_system": "Traditional Chinese Medicine",
        "iucn_status": "Near Threatened",
        "uses": ["liver disease", "immunity", "fever", "inflammation", "diabetes"],
        "contraindications": ["May interact with immunosuppressants", "Can lower blood sugar", "Avoid in pregnancy"],
        "names": {"hi": "गुडूची", "sa": "गुडूची", "ta": "குடூச்சி"},
        "description": "A climbing shrub used in both Ayurveda and Traditional Chinese Medicine. Known for hepatoprotective and immunomodulatory effects.",
        "image_url": ""
    },
    {
        "plant_id": 14, "name": "Kutki", "scientific_name": "Picrorhiza kurroa",
        "family": "Plantaginaceae", "genus": "Picrorhiza",
        "region": "Western Himalayas", "traditional_system": "Ayurveda",
        "iucn_status": "Endangered",
        "uses": ["liver disease", "fever", "digestion", "asthma", "skin disorders"],
        "contraindications": ["Avoid in pregnancy", "May cause diarrhea in high doses", "Can interact with immunosuppressants"],
        "names": {"hi": "कुटकी", "sa": "कटुकी", "ta": "கடுகுரோகிணி"},
        "description": "A powerful hepatoprotective herb from the Himalayas. Severely over-harvested — now endangered due to rising global demand for liver tonics.",
        "image_url": ""
    },
    {
        "plant_id": 15, "name": "Ginger", "scientific_name": "Zingiber officinale",
        "family": "Zingiberaceae", "genus": "Zingiber",
        "region": "Southeast Asia", "traditional_system": "Ayurveda",
        "iucn_status": "Safe",
        "uses": ["digestion", "nausea", "inflammation", "cold & flu", "pain relief"],
        "contraindications": ["May interact with blood thinners", "Can cause heartburn in large doses", "Avoid excessive use before surgery"],
        "names": {"hi": "अदरक", "sa": "आर्द्रक", "ta": "இஞ்சி"},
        "description": "One of the most widely used medicinal spices globally. Proven anti-nausea, anti-inflammatory, and digestive benefits supported by modern research.",
        "image_url": ""
    },
    {
        "plant_id": 16, "name": "Licorice", "scientific_name": "Glycyrrhiza glabra",
        "family": "Fabaceae", "genus": "Glycyrrhiza",
        "region": "Mediterranean, Central Asia", "traditional_system": "Ayurveda",
        "iucn_status": "Near Threatened",
        "uses": ["sore throat", "digestion", "respiratory infections", "ulcers", "skin disorders"],
        "contraindications": ["Can raise blood pressure dangerously", "Avoid with heart disease", "May cause potassium depletion", "Avoid during pregnancy"],
        "names": {"hi": "मुलेठी", "sa": "यष्टिमधु", "ta": "அதிமதுரம்"},
        "description": "Called Yashtimadhu in Sanskrit (the sweet stick). Widely used as a demulcent for sore throats and a harmonizer in herbal formulations.",
        "image_url": ""
    },
    {
        "plant_id": 17, "name": "Guggulu", "scientific_name": "Commiphora wightii",
        "family": "Burseraceae", "genus": "Commiphora",
        "region": "Rajasthan, Gujarat (India)", "traditional_system": "Ayurveda",
        "iucn_status": "Critically Endangered",
        "uses": ["cholesterol", "joint pain", "obesity", "inflammation", "thyroid support"],
        "contraindications": ["Can interact with thyroid medications", "May cause skin rash", "Avoid during pregnancy", "Can affect blood clotting"],
        "names": {"hi": "गुग्गुलु", "sa": "गुग्गुलु", "ta": "குக்கிலு"},
        "description": "The resin of the Mukul myrrh tree. Once abundant in Rajasthan's arid regions, now critically endangered due to destructive tapping practices.",
        "image_url": ""
    },
    {
        "plant_id": 18, "name": "Triphala", "scientific_name": "Emblica/Terminalia/Bibhitaki",
        "family": "Multiple", "genus": "Multiple",
        "region": "Indian Subcontinent", "traditional_system": "Ayurveda",
        "iucn_status": "Safe",
        "uses": ["digestion", "detoxification", "constipation", "immunity", "eye health"],
        "contraindications": ["May cause loose stools initially", "Avoid during pregnancy", "Can interact with diabetes medications"],
        "names": {"hi": "त्रिफला", "sa": "त्रिफला", "ta": "திரிபலா"},
        "description": "A synergistic blend of three fruits — Amla, Haritaki, and Bibhitaki. Considered the most versatile formulation in all of Ayurveda.",
        "image_url": ""
    },
    {
        "plant_id": 19, "name": "Costus", "scientific_name": "Saussurea costus",
        "family": "Asteraceae", "genus": "Saussurea",
        "region": "Himalayas, Kashmir", "traditional_system": "Ayurveda",
        "iucn_status": "Critically Endangered",
        "uses": ["asthma", "digestion", "inflammation", "skin disorders", "cholesterol"],
        "contraindications": ["Avoid during pregnancy", "May cause allergic reactions", "Can interact with anti-inflammatory drugs"],
        "names": {"hi": "कुष्ठ", "sa": "कुष्ठ", "ta": "கொட்டம்"},
        "description": "Also known as Kuth. Listed in CITES Appendix I — the highest level of international trade protection. Harvested to near-extinction for its aromatic roots.",
        "image_url": ""
    },
    {
        "plant_id": 20, "name": "Aloe Vera", "scientific_name": "Aloe barbadensis",
        "family": "Asphodelaceae", "genus": "Aloe",
        "region": "Arabian Peninsula", "traditional_system": "Ayurveda",
        "iucn_status": "Safe",
        "uses": ["skin disorders", "burns", "digestion", "wound healing", "hair health"],
        "contraindications": ["Oral use may cause diarrhea", "Avoid during pregnancy (internal)", "Can lower blood sugar", "Latex component is a strong laxative"],
        "names": {"hi": "एलोवेरा", "sa": "कुमारी", "ta": "சோற்றுக்கற்றாழை"},
        "description": "The 'plant of immortality' as named by ancient Egyptians. Used across Ayurveda, Unani, and modern medicine for skin healing and digestive health.",
        "image_url": ""
    },
    {
        "plant_id": 21, "name": "Agarwood", "scientific_name": "Aquilaria malaccensis",
        "family": "Thymelaeaceae", "genus": "Aquilaria",
        "region": "Southeast Asia, Northeast India", "traditional_system": "Unani",
        "iucn_status": "Critically Endangered",
        "uses": ["stress relief", "digestive disorders", "respiratory infections", "pain relief", "spiritual practices"],
        "contraindications": ["Generally safe in medicinal doses", "Avoid synthetic substitutes", "May cause drowsiness"],
        "names": {"hi": "अगर", "sa": "अगरु", "ta": "அகில்"},
        "description": "Also called Oud. One of the most expensive natural materials on Earth. Critically endangered due to demand for its aromatic resin in perfumery and medicine.",
        "image_url": ""
    },
    {
        "plant_id": 22, "name": "Moringa", "scientific_name": "Moringa oleifera",
        "family": "Moringaceae", "genus": "Moringa",
        "region": "Indian Subcontinent", "traditional_system": "Siddha",
        "iucn_status": "Safe",
        "uses": ["nutrition", "diabetes", "inflammation", "blood pressure", "immunity"],
        "contraindications": ["Root and bark may be toxic in large doses", "May lower blood pressure excessively", "Can interact with thyroid medications"],
        "names": {"hi": "सहजन", "sa": "शोभाञ्जन", "ta": "முருங்கை"},
        "description": "The 'miracle tree'. Every part is edible and medicinal. Leaves contain all essential amino acids — making it a crucial nutrition source.",
        "image_url": ""
    },
    {
        "plant_id": 23, "name": "Bhringraj", "scientific_name": "Eclipta prostrata",
        "family": "Asteraceae", "genus": "Eclipta",
        "region": "Tropical regions worldwide", "traditional_system": "Ayurveda",
        "iucn_status": "Safe",
        "uses": ["hair health", "liver disease", "skin disorders", "anti-aging", "eye health"],
        "contraindications": ["May lower blood pressure", "Avoid with diabetes medications (blood sugar drop)", "Use cautiously during pregnancy"],
        "names": {"hi": "भृंगराज", "sa": "भृङ्गराज", "ta": "கரிசலாங்கண்ணி"},
        "description": "Known as the 'king of hair'. Traditionally used in hair oils for centuries. Also a potent hepatoprotective herb used in liver disease management.",
        "image_url": ""
    },
    {
        "plant_id": 24, "name": "Shankhpushpi", "scientific_name": "Convolvulus pluricaulis",
        "family": "Convolvulaceae", "genus": "Convolvulus",
        "region": "India", "traditional_system": "Ayurveda",
        "iucn_status": "Safe",
        "uses": ["memory enhancement", "anxiety", "sleep disorders", "cognitive function", "stress relief"],
        "contraindications": ["May cause drowsiness", "Avoid with CNS depressants", "Not enough data on pregnancy safety"],
        "names": {"hi": "शंखपुष्पी", "sa": "शङ्खपुष्पी", "ta": "சங்குப்பூ"},
        "description": "A brain tonic used in Ayurveda for millennia. Traditionally given to children and students to enhance memory and concentration.",
        "image_url": ""
    },
    {
        "plant_id": 25, "name": "Indian Gentian", "scientific_name": "Gentiana kurroo",
        "family": "Gentianaceae", "genus": "Gentiana",
        "region": "Western Himalayas", "traditional_system": "Ayurveda",
        "iucn_status": "Critically Endangered",
        "uses": ["fever", "liver disease", "digestion", "skin disorders", "blood purification"],
        "contraindications": ["May cause stomach irritation", "Avoid during pregnancy", "Can interact with blood pressure medications"],
        "names": {"hi": "त्रायमाण", "sa": "त्रायमाणा", "ta": "ஜென்ஷியன்"},
        "description": "Once widespread in Kashmir's alpine meadows, now critically endangered. Its bitter roots are extensively used in traditional fever treatments.",
        "image_url": ""
    },
]

# Precompute safe alternatives for risky plants
RISKY_STATUSES = {"Endangered", "Vulnerable", "Critically Endangered"}

SAFE_ALTERNATIVES = {
    6:  {"plant_id": 2, "name": "Ashwagandha", "scientific_name": "Withania somnifera", "iucn_status": "Safe", "similarity_score": 0.78},
    7:  {"plant_id": 3, "name": "Turmeric", "scientific_name": "Curcuma longa", "iucn_status": "Safe", "similarity_score": 0.72},
    8:  {"plant_id": 3, "name": "Turmeric", "scientific_name": "Curcuma longa", "iucn_status": "Safe", "similarity_score": 0.68},
    9:  {"plant_id": 2, "name": "Ashwagandha", "scientific_name": "Withania somnifera", "iucn_status": "Safe", "similarity_score": 0.82},
    12: {"plant_id": 2, "name": "Ashwagandha", "scientific_name": "Withania somnifera", "iucn_status": "Safe", "similarity_score": 0.65},
    14: {"plant_id": 11, "name": "Giloy", "scientific_name": "Tinospora cordifolia", "iucn_status": "Safe", "similarity_score": 0.75},
    17: {"plant_id": 3, "name": "Turmeric", "scientific_name": "Curcuma longa", "iucn_status": "Safe", "similarity_score": 0.71},
    19: {"plant_id": 15, "name": "Ginger", "scientific_name": "Zingiber officinale", "iucn_status": "Safe", "similarity_score": 0.67},
    21: {"plant_id": 1, "name": "Tulsi", "scientific_name": "Ocimum tenuiflorum", "iucn_status": "Safe", "similarity_score": 0.62},
    25: {"plant_id": 11, "name": "Giloy", "scientific_name": "Tinospora cordifolia", "iucn_status": "Safe", "similarity_score": 0.73},
}

# ============================================================
# CHATBOT — 15 Hardcoded Q&A Pairs
# ============================================================

CHATBOT_QA = [
    {
        "keywords": ["tulsi", "तुलसी", "cold", "flu", "immunity", "respiratory", "holy basil"],
        "answer": "Tulsi (Holy Basil / तुलसी) is revered as the 'Queen of Herbs' in Ayurveda. It's primarily used for:\n\n🌿 Boosting immunity and fighting respiratory infections\n🌿 Reducing stress and anxiety (adaptogenic)\n🌿 Managing fever and cough\n🌿 Anti-inflammatory and antioxidant properties\n\n⚠️ Caution: May lower blood sugar and slow blood clotting. Avoid large doses during pregnancy.\n\n✅ IUCN Status: Safe — widely cultivated."
    },
    {
        "keywords": ["ashwagandha", "अश्वगंधा", "stress", "anxiety", "sleep"],
        "answer": "Ashwagandha (अश्वगंधा) is one of Ayurveda's most powerful adaptogens. Studies show it can:\n\n🧠 Reduce cortisol levels by up to 30%\n😴 Improve sleep quality and reduce insomnia\n💪 Enhance stamina and reduce fatigue\n🧘 Lower anxiety and stress symptoms\n\n⚠️ Contraindications: Avoid during pregnancy. May interact with thyroid and sedative medications.\n\n✅ IUCN Status: Safe — commercially cultivated.\n\n💡 It's also a great SAFE ALTERNATIVE to endangered Sarpagandha and Jatamansi!"
    },
    {
        "keywords": ["endangered", "conservation", "threatened", "protected", "iucn"],
        "answer": "Several critical medicinal plants are endangered in our database:\n\n🔴 CRITICALLY ENDANGERED:\n• Jatamansi (Himalayan Spikenard) — overharvested above 3,000m\n• Guggulu (Mukul Myrrh) — destructive tapping in Rajasthan\n• Costus (Kuth) — CITES Appendix I protected\n• Agarwood (Oud) — most expensive natural material on Earth\n• Indian Gentian — vanishing from Kashmir's meadows\n\n🟠 ENDANGERED:\n• Sarpagandha — source of reserpine\n• Red Sandalwood — heavily smuggled\n• Kutki — overharvested for liver tonics\n\n🟡 VULNERABLE:\n• Indian Kino Tree, Shatavari\n\nFor each endangered plant, HerbHeal Compass suggests a safe, sustainable alternative with similar medicinal properties."
    },
    {
        "keywords": ["turmeric", "हल्दी", "inflammation", "joint", "curcumin"],
        "answer": "Turmeric (हल्दी / Haridra) is the golden powerhouse of Ayurveda:\n\n✨ Key Benefits:\n• Powerful anti-inflammatory (curcumin is the active compound)\n• Joint pain and arthritis relief\n• Digestive support and liver protection\n• Skin healing and complexion improvement\n• Antioxidant — fights free radical damage\n\n💡 Pro tip: Always combine with black pepper (piperine) — it increases curcumin absorption by 2,000%!\n\n⚠️ Caution: May interact with blood thinners. Avoid high supplemental doses before surgery.\n\n✅ IUCN Status: Safe — widely cultivated worldwide.\n🌱 Also recommended as a safe alternative to endangered Red Sandalwood and Guggulu!"
    },
    {
        "keywords": ["alternative", "substitute", "replacement", "safe option", "instead"],
        "answer": "HerbHeal Compass uses a unique 'alternative routing' system:\n\n🔄 How It Works:\n1. When you search for a plant, we check its IUCN conservation status\n2. If the plant is Endangered or Critically Endangered, we flag it 🔴\n3. We calculate 'use-profile similarity' with safer plants\n4. We suggest the closest safe match\n\n📊 Examples:\n• Sarpagandha → Ashwagandha (78% similarity)\n• Jatamansi → Ashwagandha (82% similarity)\n• Red Sandalwood → Turmeric (72% similarity)\n• Kutki → Giloy (75% similarity)\n\n🌱 Every time you click 'Use Safe Alternative', our Green Impact Counter goes up — that's measurable conservation impact!"
    },
    {
        "keywords": ["contraindication", "side effect", "warning", "danger", "pregnancy", "safe to use"],
        "answer": "Every medicinal plant carries potential risks. Here are critical ones to know:\n\n🤰 PREGNANCY WARNINGS:\n• Avoid: Sarpagandha, Neem, Tulsi (large doses), Ashwagandha, Guggulu, Costus\n\n💊 DRUG INTERACTIONS:\n• Blood thinners: Turmeric, Ginger, Guggulu\n• Diabetes meds: Neem, Giloy, Moringa, Amla\n• Thyroid meds: Ashwagandha, Guggulu\n• Sedatives: Brahmi, Jatamansi, Shankhpushpi\n\n🩸 BLOOD PRESSURE:\n• Licorice can RAISE blood pressure dangerously\n• Sarpagandha can cause severe BP drops\n\n⚡ KEY RULE: Always consult a qualified practitioner before combining herbs with prescription medications."
    },
    {
        "keywords": ["liver", "hepat", "jaundice", "liver disease"],
        "answer": "Several Ayurvedic plants are traditionally used for liver health:\n\n🟢 SAFE OPTIONS:\n• Giloy (गुडूची) — powerful hepatoprotective, immunomodulator\n• Turmeric (हल्दी) — curcumin protects liver cells\n• Bhringraj (भृंगराज) — 'King of Hair' but also a liver tonic\n• Amla (आंवला) — antioxidant protection for liver tissue\n\n🔴 ENDANGERED (use alternatives instead):\n• Kutki (कुटकी) — potent but Endangered → Use Giloy instead\n• Indian Gentian — Critically Endangered → Use Giloy instead\n\n⚠️ If you have liver disease, ALWAYS work with a practitioner — don't self-medicate."
    },
    {
        "keywords": ["memory", "brain", "cognitive", "study", "concentration", "focus"],
        "answer": "Ayurveda has a rich tradition of 'Medhya Rasayana' (brain-nourishing herbs):\n\n🧠 SAFE BRAIN TONICS:\n• Brahmi (ब्राह्मी) — enhances learning, memory, and neural communication\n• Shankhpushpi (शंखपुष्पी) — traditionally given to students for concentration\n• Ashwagandha (अश्वगंधा) — reduces brain fog, improves reaction time\n\n🔴 ENDANGERED (avoid harvesting):\n• Jatamansi (जटामांसी) — Critically Endangered!\n  → Safe alternative: Ashwagandha (82% similarity)\n\n💡 Traditional practice: Brahmi is often taken with warm milk and honey before studying."
    },
    {
        "keywords": ["skin", "dermat", "acne", "eczema", "wound", "complexion"],
        "answer": "Traditional medicine offers many remedies for skin health:\n\n🟢 SAFE OPTIONS:\n• Neem (नीम) — antibacterial, antifungal, treats acne\n• Turmeric (हल्दी) — anti-inflammatory, brightens complexion\n• Aloe Vera (कुमारी) — soothes burns, moisturizes, heals wounds\n• Bhringraj (भृंगराज) — treats eczema and skin inflammation\n\n🔴 ENDANGERED (use alternatives):\n• Red Sandalwood — cooling, anti-inflammatory → Use Turmeric instead\n• Costus — skin healing → Use Ginger instead\n\n💡 DIY Ayurvedic face pack: Turmeric + Neem powder + Aloe Vera gel — safe, effective, and conservation-friendly!"
    },
    {
        "keywords": ["diabetes", "blood sugar", "glucose", "insulin"],
        "answer": "Several plants in our database support blood sugar management:\n\n🟢 SAFE OPTIONS:\n• Neem (नीम) — helps regulate insulin sensitivity\n• Giloy (गिलोय) — reduces blood sugar levels\n• Moringa (सहजन) — rich in chlorogenic acid\n• Amla (आंवला) — improves glucose metabolism\n\n🟡 VULNERABLE:\n• Indian Kino Tree (विजयसार) — heartwood soaked in water overnight\n  → Safe alternative: Turmeric (68% similarity)\n\n⚠️ CRITICAL WARNING: These herbs can LOWER blood sugar. If you're on diabetes medication, combining with these herbs can cause dangerous hypoglycemia."
    },
    {
        "keywords": ["ayurveda", "traditional", "ancient", "veda", "dosha"],
        "answer": "Ayurveda uses a sophisticated classification system:\n\n🌿 BY DOSHA (Body Constitution):\n• Vata-balancing: Ashwagandha, Shatavari, Ginger\n• Pitta-balancing: Turmeric, Amla, Brahmi\n• Kapha-balancing: Tulsi, Ginger, Moringa\n\n📚 BY ACTION (Karma):\n• Rasayana (rejuvenation): Ashwagandha, Amla, Brahmi\n• Medhya (brain tonic): Brahmi, Shankhpushpi, Jatamansi\n• Deepana (digestive): Ginger, Triphala\n• Vishaghna (anti-toxic): Giloy, Neem\n\nHerbHeal Compass maps these traditional classifications to modern conservation data — bridging ancient wisdom and modern ecology!"
    },
    {
        "keywords": ["sdg", "sustainability", "goal", "conservation", "impact", "biodiversity"],
        "answer": "HerbHeal Compass directly supports three UN Sustainable Development Goals:\n\n🟢 SDG 3: Good Health & Well-Being\n• Provides evidence-based medicinal plant information\n• Shows contraindications to prevent harmful interactions\n\n🟡 SDG 12: Responsible Consumption & Production\n• Routes users away from endangered plants\n• Green Impact Counter measures conservation behavior\n\n🟢 SDG 15: Life on Land\n• Integrates IUCN conservation data\n• Protects 28 endangered species through alternative routing\n\n📊 Our 6-Month KPI: 30% of endangered plant searches → users choose safe alternatives."
    },
    {
        "keywords": ["different", "unique", "competitor", "picturethis", "ayurherb", "compare"],
        "answer": "Here's what makes HerbHeal Compass unique:\n\n📱 PictureThis → Tells you WHAT a plant is\n🔍 AyurHerb → Gives you keyword search\n\n❌ Neither checks conservation status\n❌ Neither suggests alternatives\n❌ Neither shows contraindications\n❌ Neither preserves knowledge bilingually\n\n✅ HerbHeal Compass is the FIRST to combine:\n1️⃣ Medicinal efficacy data\n2️⃣ IUCN conservation status\n3️⃣ Sustainable alternative routing\n\nWe bridge THREE sectors: 🏥 Healthcare + 🌍 Biodiversity + 📚 Education\n\n$198 billion global herbal medicine market. 500,000+ Ayurvedic practitioners. One platform."
    },
    {
        "keywords": ["neem", "नीम", "antibacterial", "dental", "blood purif"],
        "answer": "Neem (नीम / निम्ब) — the 'Village Pharmacy' of India 🌿\n\nEvery part of the neem tree is medicinal:\n\n🍃 LEAVES: Blood purification, skin disorders, fever\n🌸 FLOWERS: Intestinal worms, bile management\n🪵 BARK: Malaria, skin diseases, dental hygiene\n🫒 SEEDS/OIL: Leprosy, skin ulcers, insect repellent\n🌱 TWIGS: Traditional toothbrush (datun) — antibacterial\n\n⚠️ Contraindications:\n• NEVER give to infants or small children\n• Avoid during pregnancy\n• May lower blood sugar dangerously with diabetes medication\n\n✅ IUCN Status: Safe — extensively cultivated."
    },
    {
        "keywords": ["ginger", "अदरक", "nausea", "digestive", "cold"],
        "answer": "Ginger (अदरक / Ardraka) — The Universal Medicine 🫚\n\nUsed across EVERY major traditional system:\n\n🇮🇳 Ayurveda: Called 'Vishwabheshaja' (universal remedy)\n🇨🇳 TCM: Used for 'cold' conditions, warming the stomach\n🇸🇦 Unani: Digestive aid and anti-inflammatory\n\n✨ Proven Benefits:\n• Anti-nausea (even for chemotherapy/pregnancy)\n• Anti-inflammatory (comparable to NSAIDs in studies)\n• Digestive stimulant and pain relief\n• Immune booster during cold/flu\n\n⚠️ Cautions:\n• May interact with blood thinners (warfarin)\n• High doses can cause heartburn\n\n✅ IUCN Status: Safe\n🌱 Recommended as safe alternative to endangered Costus (67% similarity)"
    },
]


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def enrich_plant(plant):
    """Add is_risky and safe_alternative to a plant dict."""
    p = dict(plant)
    p["is_risky"] = p["iucn_status"] in RISKY_STATUSES
    p["safe_alternative"] = SAFE_ALTERNATIVES.get(p["plant_id"])
    return p


def search_plants(query, limit=10, system_filter=None):
    """Simple keyword search across name, uses, description, and regional names."""
    q = query.lower().strip()
    if not q:
        return []

    scored = []
    for plant in PLANTS:
        score = 0
        name_lower = plant["name"].lower()
        sci_lower = plant["scientific_name"].lower()

        # Name match
        if q in name_lower:
            score += 10
        if q == name_lower:
            score += 5
        # Scientific name
        if q in sci_lower:
            score += 8
        # Uses
        for use in plant["uses"]:
            if q in use.lower():
                score += 5
            if use.lower() in q:
                score += 5
        # Regional names
        for lang_name in plant["names"].values():
            if q in lang_name:
                score += 7
        # Description
        if q in plant["description"].lower():
            score += 2
        # System
        if q in plant["traditional_system"].lower():
            score += 4
        # Family
        if q in plant["family"].lower():
            score += 3

        if score > 0:
            scored.append((score, plant))

    # Filter by system
    if system_filter:
        scored = [(s, p) for s, p in scored if p["traditional_system"].lower() == system_filter.lower()]

    # Sort by score
    scored.sort(key=lambda x: x[0], reverse=True)

    results = []
    for _, plant in scored[:limit]:
        results.append(enrich_plant(plant))

    return results


def find_chatbot_answer(message):
    """Find the best matching chatbot answer."""
    msg = message.lower().strip()

    best_match = None
    best_score = 0

    for qa in CHATBOT_QA:
        score = 0
        for keyword in qa["keywords"]:
            if keyword.lower() in msg:
                score += 3
        words = msg.split()
        for word in words:
            if len(word) > 2:
                for keyword in qa["keywords"]:
                    if word in keyword.lower():
                        score += 1

        if score > best_score:
            best_score = score
            best_match = qa

    if best_match and best_score >= 2:
        return best_match["answer"]

    # Try to match a specific plant name
    for plant in PLANTS:
        if plant["name"].lower() in msg or any(n in msg for n in plant["names"].values()):
            status = plant["iucn_status"]
            emoji = "✅" if status == "Safe" else "🔴" if "Endangered" in status else "🟠" if status == "Vulnerable" else "🟡"
            response = f"{plant['name']} ({plant['scientific_name']})\n\n"
            response += f"{emoji} IUCN Status: {status}\n"
            response += f"🏛️ System: {plant['traditional_system']}\n"
            response += f"📍 Region: {plant['region']}\n\n"
            response += f"🌿 Uses: {', '.join(plant['uses'])}\n\n"
            if plant["contraindications"]:
                response += "⚠️ Contraindications:\n"
                for c in plant["contraindications"]:
                    response += f"• {c}\n"
            alt = SAFE_ALTERNATIVES.get(plant["plant_id"])
            if alt:
                response += f"\n🌱 Safe Alternative: {alt['name']} ({int(alt['similarity_score']*100)}% similarity)"
            return response

    return ("I can help you with information about medicinal plants! Try asking about:\n\n"
            "🌿 A specific plant (e.g., 'Tell me about Tulsi')\n"
            "🔍 A condition (e.g., 'Herbs for anxiety')\n"
            "🔴 Conservation (e.g., 'Which plants are endangered?')\n"
            "⚠️ Safety (e.g., 'What are contraindications?')\n"
            "🌱 Alternatives (e.g., 'How do safe alternatives work?')\n\n"
            "I have detailed information about 25 medicinal plants from Ayurveda, TCM, Siddha, Unani, and Western Herbalism.")


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)
CORS(app, origins="*")

# Serve the frontend
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")


@app.route("/")
def serve_frontend():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(FRONTEND_DIR, filename)


# ---- Health ----

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "search_engine_loaded": True,
        "plant_count": len(PLANTS),
    })


# ---- List all plants ----

@app.route("/plants")
def list_plants():
    plants_summary = []
    for p in PLANTS:
        plants_summary.append({
            "plant_id": p["plant_id"],
            "name": p["name"],
            "scientific_name": p["scientific_name"],
            "iucn_status": p["iucn_status"],
            "traditional_system": p["traditional_system"],
        })

    systems = sorted(set(p["traditional_system"] for p in PLANTS))
    statuses = sorted(set(p["iucn_status"] for p in PLANTS))
    risky_count = sum(1 for p in PLANTS if p["iucn_status"] in RISKY_STATUSES)

    return jsonify({
        "plants": plants_summary,
        "total": len(PLANTS),
        "stats": {
            "total_plants": len(PLANTS),
            "risky_plants": risky_count,
            "traditional_systems": systems,
            "iucn_statuses": statuses,
        }
    })


# ---- Search ----

@app.route("/search")
def search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Query param 'q' is required"}), 400

    try:
        limit = int(request.args.get("limit", 10))
    except ValueError:
        limit = 10
    limit = max(1, min(limit, 25))

    system = request.args.get("system") or None

    results = search_plants(query, limit=limit, system_filter=system)

    return jsonify({
        "query": query,
        "system_filter": system,
        "results": results,
        "total": len(results),
        "endangered_count": sum(1 for r in results if r["is_risky"]),
    })


# ---- Plant detail ----

@app.route("/plant/<int:plant_id>")
def get_plant(plant_id):
    for p in PLANTS:
        if p["plant_id"] == plant_id:
            return jsonify(enrich_plant(p))

    return jsonify({"error": f"No plant found with id {plant_id}"}), 404


# ---- AI Chat ----

@app.route("/ai/chat", methods=["POST"])
def ai_chat():
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "Missing 'message' field"}), 400

    user_msg = data["message"].strip()
    if not user_msg:
        return jsonify({"error": "Message cannot be empty"}), 400

    answer = find_chatbot_answer(user_msg)

    return jsonify({
        "query": user_msg,
        "response": answer,
        "model": "herbheal-hardcoded-v1",
        "status": "success",
    })


@app.route("/ai/health")
def ai_health():
    return jsonify({
        "ai_service": "ok",
        "model": "herbheal-hardcoded-v1",
        "message": "AI service is ready (hardcoded responses)",
    })


# ---- Error handlers ----

@app.errorhandler(404)
def not_found(_e):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def server_error(e):
    logger.exception("Unhandled server error")
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("HerbHeal Compass — Demo Server")
    logger.info("Plants loaded: %d", len(PLANTS))
    logger.info("Risky plants: %d", sum(1 for p in PLANTS if p["iucn_status"] in RISKY_STATUSES))
    logger.info("Chatbot QA pairs: %d", len(CHATBOT_QA))
    logger.info("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)
