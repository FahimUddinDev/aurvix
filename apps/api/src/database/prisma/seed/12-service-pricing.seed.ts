import { PrismaClient } from '@prisma/client';

export async function seedServicePricing(prisma: PrismaClient, hospital: { id: string }) {
  const prices = [
    // --- 1. General Consultation Fees ---
    { name: 'General Physician Consultation', nameBn: 'সাধারণ ফিজিশিয়ান কনসালটেশন', category: 'CONSULTATION', price: 400, taxPercent: 0 },
    { name: 'Specialist Consultation (Senior)', nameBn: 'বিশেষজ্ঞ কনসালটেশন (সিনিয়র)', category: 'CONSULTATION', price: 1000, taxPercent: 0 },
    { name: 'Specialist Consultation (Junior)', nameBn: 'বিশেষজ্ঞ কনসালটেশন (জুনিয়র)', category: 'CONSULTATION', price: 600, taxPercent: 0 },
    { name: 'Follow-up Consultation (Within 7 Days)', nameBn: 'ফলো-আপ কনসালটেশন', category: 'CONSULTATION', price: 300, taxPercent: 0 },

    // --- 2. Wards & Beds daily rates ---
    { name: 'General Ward Bed Rent (Daily)', nameBn: 'সাধারণ ওয়ার্ড বেড ভাড়া (দৈনিক)', category: 'ROOM_CHARGES', price: 1000, taxPercent: 0 },
    { name: 'Semi-Private Cabin Bed Rent (Daily)', nameBn: 'সেমি-প্রাইভেট কেবিন ভাড়া (দৈনিক)', category: 'ROOM_CHARGES', price: 2500, taxPercent: 0 },
    { name: 'Private Cabin Bed Rent (Daily)', nameBn: 'প্রাইভেট কেবিন ভাড়া (দৈনিক)', category: 'ROOM_CHARGES', price: 4500, taxPercent: 0 },
    { name: 'ICU Bed Rent (Daily)', nameBn: 'আইসিইউ বেড ভাড়া (দৈনিক)', category: 'ROOM_CHARGES', price: 12000, taxPercent: 0 },

    // --- 3. Lab Investigations (Laboratory) ---
    { name: 'Complete Blood Count (CBC)', nameBn: 'কমপ্লিট ব্লাড কাউন্ট (সিবিসি)', category: 'LABORATORY', price: 450, taxPercent: 5 },
    { name: 'Liver Function Test (LFT)', nameBn: 'লিভার ফাংশন টেস্ট (এলএফটি)', category: 'LABORATORY', price: 1200, taxPercent: 5 },
    { name: 'Renal Function Test (RFT/Creatinine)', nameBn: 'রেনাল ফাংশন টেস্ট (আরএফটি)', category: 'LABORATORY', price: 500, taxPercent: 5 },
    { name: 'Lipid Profile', nameBn: 'লিপিড প্রোফাইল', category: 'LABORATORY', price: 1000, taxPercent: 5 },
    { name: 'HbA1c', nameBn: 'এইচবিএ১সি', category: 'LABORATORY', price: 800, taxPercent: 5 },
    { name: 'Blood Sugar (Fasting/Random)', nameBn: 'রক্তের শর্করা পরীক্ষা', category: 'LABORATORY', price: 150, taxPercent: 5 },
    { name: 'Urine Routine Examination (Urine R/E)', nameBn: 'প্রস্রাব পরীক্ষা (আর/ই)', category: 'LABORATORY', price: 250, taxPercent: 5 },
    { name: 'Serum Electrolytes', nameBn: 'সিরাম ইলেকট্রোলাইটস', category: 'LABORATORY', price: 900, taxPercent: 5 },
    { name: 'Dengue NS1 Antigen (Rapid)', nameBn: 'ডেঙ্গু এনএস১ অ্যান্টিজেন', category: 'LABORATORY', price: 400, taxPercent: 5 },
    { name: 'Widal Test for Typhoid', nameBn: 'টাইফয়েড পরীক্ষা (উইডাল)', category: 'LABORATORY', price: 450, taxPercent: 5 },
    { name: 'Thyroid Stimulating Hormone (TSH)', nameBn: 'টিএসএইচ পরীক্ষা', category: 'LABORATORY', price: 700, taxPercent: 5 },
    { name: 'Troponin I (Cardiac Marker)', nameBn: 'ট্রপোনিন আই', category: 'LABORATORY', price: 1500, taxPercent: 5 },

    // --- 4. Radiology & Imaging ---
    { name: 'X-Ray Chest P/A View', nameBn: 'বুকের এক্স-রে', category: 'RADIOLOGY', price: 500, taxPercent: 5 },
    { name: 'X-Ray Right/Left Knee Joint (B/V)', nameBn: 'হাঁটুর এক্স-রে', category: 'RADIOLOGY', price: 600, taxPercent: 5 },
    { name: 'USG of Whole Abdomen', nameBn: 'পেটের আল্ট্রাসাউন্ড (সম্পূর্ণ)', category: 'RADIOLOGY', price: 1500, taxPercent: 5 },
    { name: 'USG of Pregnancy Profile', nameBn: 'গর্ভকালীন আল্ট্রাসাউন্ড', category: 'RADIOLOGY', price: 1200, taxPercent: 5 },
    { name: 'CT Scan of Brain (Plain)', nameBn: 'মস্তিষ্কের সিটি স্ক্যান', category: 'RADIOLOGY', price: 4500, taxPercent: 5 },
    { name: 'CT Scan of Chest (High Resolution)', nameBn: 'বুকের সিটি স্ক্যান', category: 'RADIOLOGY', price: 7500, taxPercent: 5 },
    { name: 'MRI of Brain (Plain)', nameBn: 'মস্তিষ্কের এমআরআই', category: 'RADIOLOGY', price: 8000, taxPercent: 5 },
    { name: 'MRI of Spine (L/S Spine)', nameBn: 'মেরুদণ্ডের এমআরআই', category: 'RADIOLOGY', price: 8500, taxPercent: 5 },
    { name: 'Electrocardiogram (ECG)', nameBn: 'ইসিজি (ECG)', category: 'RADIOLOGY', price: 400, taxPercent: 5 },
    { name: 'Echocardiogram (Color Doppler)', nameBn: 'ইকোকার্ডিওগ্রাম', category: 'RADIOLOGY', price: 2000, taxPercent: 5 },

    // --- 5. Nursing Procedures & Interventions ---
    { name: 'Intravenous (IV) Cannulation', nameBn: 'ক্যানোলা পরানো', category: 'PROCEDURES', price: 150, taxPercent: 0 },
    { name: 'Intramuscular (IM) Injection', nameBn: 'আইএম ইনজেকশন', category: 'PROCEDURES', price: 80, taxPercent: 0 },
    { name: 'Urinary Catheterization', nameBn: 'ক্যাথেটার পরানো', category: 'PROCEDURES', price: 400, taxPercent: 0 },
    { name: 'Nebulization (Per Session)', nameBn: 'নেবুলাইজেশন', category: 'PROCEDURES', price: 100, taxPercent: 0 },
    { name: 'Wound Dressing (Small)', nameBn: 'ড্রেসিং (ছোট)', category: 'PROCEDURES', price: 200, taxPercent: 0 },
    { name: 'Wound Dressing (Large/Major)', nameBn: 'ড্রেসিং (বড়)', category: 'PROCEDURES', price: 500, taxPercent: 0 },
    { name: 'Suture Removal', nameBn: 'সেলাই কাটা', category: 'PROCEDURES', price: 150, taxPercent: 0 },
    { name: 'Oxygen Inhalation (PerHour)', nameBn: 'অক্সিজেন সেবা (ঘণ্টা প্রতি)', category: 'PROCEDURES', price: 100, taxPercent: 0 },
    { name: 'Blood Pressure Monitoring', nameBn: 'রক্তচাপ পরীক্ষা', category: 'PROCEDURES', price: 50, taxPercent: 0 },
    { name: 'Ryles Tube Insertion', nameBn: 'রাইলস টিউব স্থাপন', category: 'PROCEDURES', price: 450, taxPercent: 0 },

    // --- 6. Minor Surgeries & OT charges ---
    { name: 'Circumcision under Local Anesthesia', nameBn: 'মুসলমানি (খৎনা)', category: 'PROCEDURES', price: 4000, taxPercent: 5 },
    { name: 'Abscess Drainage (Incision & Drainage)', nameBn: 'ফোঁড়া বা পুঁজ নিষ্কাশন', category: 'PROCEDURES', price: 1500, taxPercent: 5 },
    { name: 'Minor Stitching (Laceration Repair)', nameBn: 'সেলাই (ক্ষত মেরামত)', category: 'PROCEDURES', price: 1000, taxPercent: 5 },
    { name: 'Ingrown Toenail Excision', nameBn: 'নখ উপড়ানো', category: 'PROCEDURES', price: 2000, taxPercent: 5 },
    { name: 'Ear Syringing (Single/Both)', nameBn: 'কান পরিষ্কার করা', category: 'PROCEDURES', price: 500, taxPercent: 0 },
    { name: 'Biopsy Specimen Collection', nameBn: 'বায়োপসি নমুনা সংগ্রহ', category: 'PROCEDURES', price: 1200, taxPercent: 5 },
    { name: 'Local Infiltration Anesthesia Charge', nameBn: 'অ্যানেস্থেসিয়া চার্জ', category: 'PROCEDURES', price: 300, taxPercent: 0 },
    { name: 'Physiotherapy Session (45 Mins)', nameBn: 'ফিজিওথেরাপি সেশন', category: 'PROCEDURES', price: 600, taxPercent: 0 },
    { name: 'ECG Report Interpretation Fee', nameBn: 'ইসিজি রিপোর্ট ফি', category: 'PROCEDURES', price: 200, taxPercent: 0 },
    { name: 'Nebulizer Medicine Dose (Albuterol)', nameBn: 'নেবুলাইজার ওষুধ ডোজ', category: 'PROCEDURES', price: 120, taxPercent: 0 },
  ];

  for (const p of prices) {
    const priceId = `00000000-0000-0000-0000-${String(prices.indexOf(p) + 1).padStart(12, '0')}`;
    await prisma.servicePrice.upsert({
      where: { id: priceId },
      update: {
        name: p.name,
        nameBn: p.nameBn,
        category: p.category,
        price: p.price,
        taxPercent: p.taxPercent,
      },
      create: {
        id: priceId,
        hospitalId: hospital.id,
        name: p.name,
        nameBn: p.nameBn,
        category: p.category,
        price: p.price,
        taxPercent: p.taxPercent,
        isActive: true,
      },
    });
  }
}
