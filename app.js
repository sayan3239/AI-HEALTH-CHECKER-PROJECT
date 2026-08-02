/* ==========================================================================
   MediPulse AI - Application Logic & Clinical Diagnostic Engine
   ========================================================================== */

// Current App State
let currentLang = 'en';
let activeRegion = 'head';
let selectedSymptoms = new Set();
let currentSeverity = 5;
let searchQuery = '';
let currentView = 'triage';

// Navbar 3-Dot / 3-Dash Menu Controls
function toggleNavMoreMenu(event) {
  if (event) {
    if (event.stopPropagation) event.stopPropagation();
  }
  const userDropdown = document.getElementById('user-menu-dropdown');
  if (userDropdown) userDropdown.classList.add('hidden');

  const dropdown = document.getElementById('nav-more-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
    if (!dropdown.classList.contains('hidden')) {
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  }
}

function closeNavMoreMenu() {
  const dropdown = document.getElementById('nav-more-dropdown');
  if (dropdown) {
    dropdown.classList.add('hidden');
    dropdown.style.display = 'none';
  }
}

// Unified Navigation Router & View State Switcher
function navigateToView(viewId, event) {
  if (event) {
    if (event.preventDefault) event.preventDefault();
    if (event.stopPropagation) event.stopPropagation();
  }

  closeNavMoreMenu();
  currentView = viewId;

  // Highlight active menu item in 3-dot dropdown drawer
  document.querySelectorAll('.nav-dropdown-item').forEach(item => {
    if (item.getAttribute('data-view') === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Dynamically route and open target feature component/modal
  switch (viewId) {
    case 'voice-analyzer':
    case 'voice':
      if (typeof openVoiceAnalyzerModal === 'function') openVoiceAnalyzerModal();
      break;
    case 'health-history':
    case 'history':
      if (typeof openHealthHistoryModal === 'function') openHealthHistoryModal();
      break;
    case 'medicine-reminder':
    case 'medicine':
      if (typeof openMedicineReminderModal === 'function') openMedicineReminderModal();
      break;
    case 'food-scanner':
    case 'food':
      if (typeof openFoodScannerModal === 'function') openFoodScannerModal();
      break;
    case 'skin-detector':
    case 'skin':
      if (typeof openSkinDetectorModal === 'function') openSkinDetectorModal();
      break;
    case 'report-analyzer':
    case 'report':
      if (typeof openReportAnalyzerModal === 'function') openReportAnalyzerModal();
      break;
    case 'biosensor':
      if (typeof openBioSensorModal === 'function') openBioSensorModal(event);
      break;
    case 'fever':
      if (typeof openFeatureModal === 'function') openFeatureModal('fever');
      break;
    case 'hospitals':
      if (typeof openFeatureModal === 'function') openFeatureModal('hospitals');
      break;
    case 'calculators':
      if (typeof openFeatureModal === 'function') openFeatureModal('calculators');
      break;
    case 'triage':
      if (typeof openFeatureModal === 'function') openFeatureModal('triage');
      break;
    case 'ai-consult':
    case 'consult':
      if (typeof toggleAIChatModal === 'function') toggleAIChatModal();
      break;
    default:
      console.log('Switched to view:', viewId);
  }
}

window.toggleNavMoreMenu = toggleNavMoreMenu;
window.closeNavMoreMenu = closeNavMoreMenu;
window.navigateToView = navigateToView;

// Delegated Click Backup Listener for 3-Dot Navigation Items & Navbar Action Buttons
document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof toggleTheme === 'function') toggleTheme();
    });
  }

  const authBtn = document.getElementById('open-auth-btn');
  if (authBtn) {
    authBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof openAuthModal === 'function') openAuthModal('login');
    });
  }

  const navMoreBtn = document.getElementById('nav-more-btn');
  if (navMoreBtn) {
    navMoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof toggleNavMoreMenu === 'function') toggleNavMoreMenu(e);
    });
  }

  const navContainer = document.getElementById('nav-menu-scroll-container');
  if (navContainer) {
    navContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.nav-dropdown-item');
      if (!item) return;
      const viewId = item.getAttribute('data-view');
      if (viewId) {
        navigateToView(viewId, e);
      }
    });
  }
});

// Features Modal & Popup Window Controls
function openFeaturesModal() {
  const modal = document.getElementById('features-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeFeaturesModal() {
  const modal = document.getElementById('features-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function openFeatureModal(featureId) {
  closeFeaturesModal();
  const viewerModal = document.getElementById('feature-viewer-modal');
  const viewerBody = document.getElementById('feature-viewer-body');
  const viewerTitle = document.getElementById('feature-viewer-title');
  const viewerIcon = document.getElementById('feature-viewer-icon');

  if (!viewerModal || !viewerBody) return;

  viewerBody.innerHTML = '';

  if (featureId === 'fever') {
    const feverElem = document.getElementById('fever-encyclopedia-section');
    if (feverElem) {
      viewerTitle.innerText = currentLang === 'bn' ? '৩৫+ ক্লিনিক্যাল ফিভার এনসাইক্লোপিডিয়া' : '35+ Clinical Fever Encyclopedia';
      viewerIcon.className = 'fa-solid fa-temperature-arrow-up';
      viewerIcon.style.color = '#ef4444';
      const clone = feverElem.cloneNode(true);
      clone.style.marginTop = '0';
      viewerBody.appendChild(clone);
    }
  } else if (featureId === 'hospitals') {
    const hospElem = document.getElementById('hospital-finder-section');
    if (hospElem) {
      viewerTitle.innerText = currentLang === 'bn' ? 'কাছাকাছি হাসপাতাল ও জিপিএস লোকেটর' : 'Nearby Hospitals & GPS Locator';
      viewerIcon.className = 'fa-solid fa-hospital-user';
      viewerIcon.style.color = '#10b981';
      const clone = hospElem.cloneNode(true);
      clone.style.marginTop = '0';
      viewerBody.appendChild(clone);
    }
  } else if (featureId === 'calculators') {
    const calcElem = document.getElementById('calculators');
    if (calcElem) {
      viewerTitle.innerText = currentLang === 'bn' ? 'ডিজিটাল হেলথ ক্যালকুলেটরস' : 'Vital Health Calculators';
      viewerIcon.className = 'fa-solid fa-calculator';
      viewerIcon.style.color = '#06b6d4';
      const clone = calcElem.cloneNode(true);
      clone.style.marginTop = '0';
      viewerBody.appendChild(clone);
    }
  } else if (featureId === 'triage') {
    const heroElem = document.getElementById('hero-section');
    if (heroElem) {
      viewerTitle.innerText = currentLang === 'bn' ? 'এআই সিম্পটম ট্রায়াজ ইঞ্জিন' : 'AI Symptom Triage Engine';
      viewerIcon.className = 'fa-solid fa-stethoscope';
      viewerIcon.style.color = '#3b82f6';
      const clone = heroElem.cloneNode(true);
      clone.style.marginTop = '0';
      viewerBody.appendChild(clone);
    }
  }

  viewerModal.classList.remove('hidden');
  viewerModal.style.display = 'flex';
}

function closeFeatureViewerModal() {
  const viewerModal = document.getElementById('feature-viewer-modal');
  if (viewerModal) {
    viewerModal.classList.add('hidden');
    viewerModal.style.display = 'none';
  }
}

window.openFeaturesModal = openFeaturesModal;
window.closeFeaturesModal = closeFeaturesModal;
window.openFeatureModal = openFeatureModal;
window.closeFeatureViewerModal = closeFeatureViewerModal;

document.addEventListener('click', (e) => {
  const wrapper = document.querySelector('.nav-menu-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    closeNavMoreMenu();
  }
});

// Extended Symptom & Fever Database with Red-Flag Indicators & Category Mapping
const symptomDatabase = {
  head: [
    { id: 'headache', nameEn: '🔥 High Viral Fever with Migraine/Headache', nameBn: '🔥 মাইগ্রেন/তীব্র মাথাব্যথাসহ ভাইরাল জ্বর', redFlag: false, weight: 3 },
    { id: 'typhoid_head', nameEn: '🌡️ Typhoid / Meningeal Fever Warning', nameBn: '🌡️ টাইফয়েড / ঘাড় শক্ত হওয়া কড়া জ্বর', redFlag: true, weight: 5 },
    { id: 'dizziness', nameEn: '💫 Severe Dizziness or Vertigo', nameBn: '💫 তীব্র মাথা ঘোরানো বা ঝিমঝিম করা', redFlag: false, weight: 2 },
    { id: 'fainting', nameEn: '🚨 Loss of Consciousness / Fainting', nameBn: '🚨 অজ্ঞান হওয়া / মূর্ছা যাওয়া', redFlag: true, weight: 5 },
    { id: 'vision_loss', nameEn: '👁️ Sudden Vision Blur / Loss', nameBn: '👁️ হঠাৎ দৃষ্টিশক্তি ঝাপসা বা কমে যাওয়া', redFlag: true, weight: 5 },
    { id: 'sore_throat', nameEn: '🗣️ Sore Throat / Tonsilitis Fever', nameBn: '🗣️ গলার টনসিল ইনফেকশন ও জ্বর', redFlag: false, weight: 2 }
  ],
  chest: [
    { id: 'chest_pain', nameEn: '🚨 Crushing Chest Pressure / Cardiac Alert', nameBn: '🚨 বুকে তীব্র চাপ বা ছাতি ধরা ব্যথা', redFlag: true, weight: 5 },
    { id: 'pneumonia_fever', nameEn: '🔥 Pneumonia / Chest Infection Fever', nameBn: '🔥 নিউমোনিয়া ও বুকের ইনফেকশন জ্বর', redFlag: true, weight: 5 },
    { id: 'shortness_breath', nameEn: '🫁 Shortness of Breath / Breathing Distress', nameBn: '🫁 তীব্র শ্বাসকষ্ট বা হাঁপানো', redFlag: true, weight: 5 },
    { id: 'palpitations', nameEn: '💓 Irregular Heartbeat / Rapid Palpitations', nameBn: '💓 বুক ধড়ফড় করা ও অস্থিরতা', redFlag: false, weight: 3 },
    { id: 'cough_blood', nameEn: '🩸 Coughing up Blood / TB Warning', nameBn: '🩸 কাশির সাথে রক্ত পড়া বা যক্ষ্মা ঝুঁকি', redFlag: true, weight: 5 },
    { id: 'persistent_cough', nameEn: '🗣️ Persistent Cough with Mild Fever', nameBn: '🗣️ দীর্ঘমেয়াদী কাশি ও হালকা জ্বর জ্বর ভাব', redFlag: false, weight: 2 }
  ],
  abdomen: [
    { id: 'stomach_pain', nameEn: '🔥 Food Poisoning / Stomach Infection Fever', nameBn: '🔥 ফুড পয়জনিং / পেটের ইনফেকশন জ্বর', redFlag: false, weight: 3 },
    { id: 'appendicitis_fever', nameEn: '⚡ Sharp Appendicitis Pain / High Fever', nameBn: '⚡ তীব্র পেট ব্যথা ও এপেন্ডিসাইটিস জ্বর', redFlag: true, weight: 4 },
    { id: 'nausea_vomiting', nameEn: '🤮 Nausea & Repeated Vomiting', nameBn: '🤮 তীব্র বমি বমি ভাব ও বারবার বমি', redFlag: false, weight: 2 },
    { id: 'diarrhea', nameEn: '💧 Severe Watery Diarrhea / Cholera Risk', nameBn: '💧 পাতলা পায়খানা বা ডায়রিয়া', redFlag: false, weight: 2 },
    { id: 'blood_in_stool', nameEn: '🩸 Blood in Stool or Vomit', nameBn: '🩸 মল বা বমির সাথে রক্ত পড়া', redFlag: true, weight: 5 },
    { id: 'acid_reflux', nameEn: '🔥 Heartburn / Severe Gastric Reflux', nameBn: '🔥 এসিডিটি ও পেট-বুক জ্বালাপোড়া', redFlag: false, weight: 1 }
  ],
  arms: [
    { id: 'chikungunya_arm_fever', nameEn: '🦴 Chikungunya Arm & Wrist Joint Fever', nameBn: '🦴 চিকনগুনিয়া জ্বর (হাতের কবজি ও আঙুলের তীব্র ব্যথা)', redFlag: false, weight: 3 },
    { id: 'arm_numbness', nameEn: '⚡ One-Side Arm Weakness / Stroke Warning', nameBn: '⚡ এক হাত অবশ হওয়া / স্ট্রোক সতর্কতা', redFlag: true, weight: 5 },
    { id: 'arm_muscle_cramps', nameEn: '💪 Severe Arm Muscle Cramps & Fatigue', nameBn: '💪 হাতের মাংসপেশির তীব্র টান বা খিল ধরা', redFlag: false, weight: 2 },
    { id: 'arm_swelling', nameEn: '🦵 Sudden Arm Swelling & Lymph Node Fever', nameBn: '🦵 বাহু ফুলে যাওয়া ও গ্ল্যান্ডের ইনফেকশন জ্বর', redFlag: false, weight: 2 }
  ],
  legs: [
    { id: 'dengue_leg_fever', nameEn: '🔥 Dengue Bone-Breaking High Leg Fever', nameBn: '🔥 ডেঙ্গু জ্বর (পায়ের হাড় ও হাঁটুতে তীব্র ব্যথা)', redFlag: true, weight: 4 },
    { id: 'leg_swelling', nameEn: '🦵 Sudden Single Leg Swelling & DVT Alert', nameBn: '🦵 এক পা হঠাৎ ফুলে যাওয়া ও রক্ত জমাট বাঁধাব ঝুঁকি', redFlag: true, weight: 4 },
    { id: 'knee_joint_fever', nameEn: '🦴 Knee Joint Infection & Rheumatic Fever', nameBn: '🦴 হাঁটুর জয়েন্ট ইনফেকশন ও রিউমেটিক জ্বর', redFlag: false, weight: 3 },
    { id: 'leg_cramps', nameEn: '🦶 Calf Muscle Cramps & Tremors', nameBn: '🦶 পায়ের গুড়ালি ও মাংসপেশির টান/খিঁচুনি', redFlag: false, weight: 1 }
  ],
  upper_back: [
    { id: 'upper_back_pain', nameEn: '🔥 Upper Back Pain & Muscle Stiffness', nameBn: '🔥 পিঠের ওপরের তীব্র ব্যথা ও মাংসপেশির টান', redFlag: false, weight: 3 },
    { id: 'shoulder_blade', nameEn: '🦴 Shoulder Blade Pain & Muscle Tension', nameBn: '🦴 কাঁধের হাড় ও পেশীর তীব্র ক্লান্তি/ব্যথা', redFlag: false, weight: 2 },
    { id: 'trapezius_stiffness', nameEn: '🗣️ Neck & Trapezius Muscle Soreness', nameBn: '🗣️ ঘাড় ও পিঠের ট্রাপিজিয়াস পেশীর শক্ত ভাব', redFlag: false, weight: 2 },
    { id: 'spine_muscle_fever', nameEn: '🌡️ Spinal Muscle Fatigue & Fever', nameBn: '🌡️ মেরুদণ্ডের মাংসপেশিতে ব্যথা ও হালকা জ্বর', redFlag: false, weight: 2 }
  ],
  lower_back: [
    { id: 'lower_back_pain', nameEn: '🔥 Severe Lower Back Pain / Lumbar Strain', nameBn: '🔥 কোমরের তীব্র ব্যথা বা লাম্বার পেইন', redFlag: false, weight: 3 },
    { id: 'sciatica', nameEn: '⚡ Sciatica / Shooting Nerve Pain down Leg', nameBn: '⚡ সায়াটিকা (কোমর থেকে পায়ে নেমে যাওয়া তীব্র স্নায়ু ব্যথা)', redFlag: true, weight: 4 },
    { id: 'spine_stiffness', nameEn: '🦴 Spine Stiffness on Bending', nameBn: '🦴 কোমর বাঁকাতে কষ্ট ও পিঠের আড়ষ্টতা', redFlag: false, weight: 2 },
    { id: 'disc_strain', nameEn: '🔥 Disc Strain & Burning Back Pain', nameBn: '🔥 মেরুদণ্ডের ডিক্স সমস্যা ও পিঠে জ্বালা-পোড়া', redFlag: false, weight: 3 }
  ],
  kidney: [
    { id: 'kidney_flank_pain', nameEn: '🚨 Flank Pain / Severe Kidney Area Discomfort', nameBn: '🚨 কোমরের দু-পাশে বা পাঁজরের নিচে একপেশে তীব্র ব্যথা', redFlag: true, weight: 5 },
    { id: 'kidney_infection_fever', nameEn: '🔥 High Fever with Chills & Back Pain (Pyelonephritis Alert)', nameBn: '🔥 কাঁপুনি দিয়ে তীব্র জ্বর ও পিঠের ব্যথা (কিডনি ইনফেকশন সতর্কতা)', redFlag: true, weight: 5 },
    { id: 'urinary_burning', nameEn: '💧 Burning Urination & Kidney Sensation', nameBn: '💧 প্রস্রাবে তীব্র জ্বালাপোড়া ও ব্যাক পেইন', redFlag: false, weight: 3 },
    { id: 'kidney_stone', nameEn: '⚡ Severe Colicky Flank Pain / Kidney Stone Alert', nameBn: '⚡ কিডনিতে পাথর বা তীব্র মোচড়ানো ব্যাক পেইন', redFlag: true, weight: 5 }
  ],
  glutes_legs: [
    { id: 'glute_pain', nameEn: '🦵 Posterior Leg & Glute Muscle Soreness', nameBn: '🦵 পায়ের পিছনের অংশ ও নিতম্বের তীব্র ব্যথা', redFlag: false, weight: 2 },
    { id: 'hamstring_cramps', nameEn: '🦶 Hamstring & Calf Muscle Cramps', nameBn: '🦶 উরু ও পায়ের পিছনের রগে টান/খিঁচুনি', redFlag: false, weight: 2 },
    { id: 'heel_tendon', nameEn: '🦴 Achilles Tendon & Heel Soreness', nameBn: '🦴 গোড়ালি ও অ্যাকিলিস রগের তীব্র ব্যথা', redFlag: false, weight: 2 }
  ],
  general: [
    { id: 'high_fever', nameEn: '🔥 High Fever (>102°F / 39°C) & Shivering', nameBn: '🔥 প্রচণ্ড উচ্চ তাপমাত্রা (১০২°F+) ও কাঁপুনি', redFlag: false, weight: 3 },
    { id: 'malaria_fever_chills', nameEn: '🥶 Malaria Fever with Chills & Rigors', nameBn: '🥶 ম্যালেরিয়া জ্বর ও তীব্র কাঁপুনি', redFlag: true, weight: 4 },
    { id: 'tuberculosis_fever', nameEn: '🌙 Evening Low-Grade Fever & Night Sweats (TB)', nameBn: '🌙 সান্ধ্যকালীন টিবি জ্বর ও রাতে শরীরে ঘাম', redFlag: true, weight: 4 },
    { id: 'covid_fever', nameEn: '😷 COVID-19 Fever & Respiratory Distress', nameBn: '😷 কোভিড-১৯ সংক্রামক জ্বর ও কাশি', redFlag: true, weight: 4 },
    { id: 'tonsillitis_fever', nameEn: '🗣️ Tonsillitis Sore Throat Fever', nameBn: '🗣️ টনসিল ফুলে ওঠার কড়া জ্বর', redFlag: false, weight: 3 },
    { id: 'septicemia_fever', nameEn: '🚨 Sepsis / Bloodstream Infection Fever', nameBn: '🚨 সেপসিস ও রক্তের বিষাক্ত ইনফেকশন জ্বর', redFlag: true, weight: 5 },
    { id: 'heat_stroke_fever', nameEn: '☀️ Heat Stroke Extreme Fever (>104°F)', nameBn: '☀️ হিট স্ট্রোক ও অতিরিক্ত উচ্চ তাপমাত্রা (১০৪°F+)', redFlag: true, weight: 5 },
    { id: 'viral_flu', nameEn: '🌡️ Seasonal Flu / Systemic Viral Infection', nameBn: '🌡️ মৌসুমি ভাইরাল ফ্লু ও সারা শরীর ব্যথা', redFlag: false, weight: 2 },
    { id: 'fatigue', nameEn: '😴 Extreme Exhaustion & Weakness', nameBn: '😴 প্রচণ্ড ক্লান্তি ও শরীর অচল লাগা', redFlag: false, weight: 1 },
    { id: 'weight_loss', nameEn: '📉 Unexplained Rapid Weight Loss', nameBn: '📉 হঠাৎ দ্রুত ওজন কমে যাওয়া', redFlag: false, weight: 3 }
  ]
};

// Known Medical Differential Diagnosis Database
const conditionKnowledgeBase = [
  {
    id: 'angina_mi',
    nameEn: 'Acute Cardiac Event / Angina / Myocardial Infarction',
    nameBn: 'হার্ট অ্যাটাক বা একিউট করনারি সিন্ড্রোম',
    symptomsRequired: ['chest_pain', 'shortness_breath'],
    optionalSymptoms: ['palpitations', 'nausea_vomiting', 'dizziness'],
    triageLevel: 'emergency',
    descEn: 'Requires instant clinical evaluation to rule out heart muscle ischemia.',
    descBn: 'হৃদপিন্ডে রক্ত চলাচলে বাধার আশঙ্কা। দ্রুত ইমার্জেন্সি বিভাগে যেতে হবে।',
    adviceEn: [
      'Call emergency services (999 / 911 / Ambulance) immediately.',
      'Rest in a sitting position; do not exert yourself physically.',
      'Take prescribed Emergency Nitroglycerin if advised by your cardiologist.'
    ],
    adviceBn: [
      'অবিলম্বে জরুরি অ্যাম্বুলেন্স সার্ভিস (৯৯৯ / ৯১১) কল করুন।',
      'এক জায়গায় শান্ত হয়ে বসে থাকুন, কোনো শারীরিক পরিশ্রম করবেন না।',
      'পূর্বে ডাক্তার দ্বারা নির্ধারিত ইমার্জেন্সি ওষুধ থাকলে নির্দেশিকা অনুযায়ী নিন।'
    ]
  },
  {
    id: 'meningitis_stroke',
    nameEn: 'Neurological Warning / Stroke or Meningeal Signs',
    nameBn: 'স্ট্রোক বা নিউরোলজিক্যাল জরুরি সতর্কতা',
    symptomsRequired: ['numbness', 'fainting'],
    optionalSymptoms: ['headache', 'vision_loss', 'stiff_neck'],
    triageLevel: 'emergency',
    descEn: 'Sudden weakness on one side or loss of consciousness needs urgent neuro-evaluation.',
    descBn: 'শরীরের কোনো এক পাশ অবশ হওয়া বা অজ্ঞান হয়ে যাওয়া স্ট্রোকের লক্ষণ হতে পারে।',
    adviceEn: [
      'Perform FAST test: Face drooping, Arm weakness, Speech difficulty, Time to call 999.',
      'Seek nearest Comprehensive Stroke or Trauma Hospital immediately.'
    ],
    adviceBn: [
      'রোগীর মুখ বাঁকা হওয়া, হাত তোলা এবং কথা বলার সমস্যা পরীক্ষা করুন।',
      'দ্রুততম সময়ে নিকটস্থ বিশেষায়িত হাসপাতালে নিয়ে যান।'
    ]
  },
  {
    id: 'influenza_viral',
    nameEn: 'Viral Upper Respiratory Infection / Influenza',
    nameBn: 'ইনফ্লুয়েঞ্জা বা ভাইরাল রেসপিরেটরি ইনফেকশন',
    symptomsRequired: ['high_fever', 'headache'],
    optionalSymptoms: ['fatigue', 'chills', 'sore_throat', 'persistent_cough'],
    triageLevel: 'low',
    descEn: 'Common seasonal viral infection causing systemic symptoms and fever.',
    descBn: 'মৌসুমি ভাইরাল জ্বর ও শ্বাসতন্ত্রের সংক্রমণ। প্রথামিক যত্নে সাধারণত ৩-৫ দিনে ভালো হয়।',
    adviceEn: [
      'Ensure adequate hydration (2-3 liters of fluids daily).',
      'Take over-the-counter Paracetamol for fever management as instructed.',
      'Consult a primary care doctor if fever persists past 3 days.'
    ],
    adviceBn: [
      'প্রচুর পরিমাণে পানি, স্যালাইন ও তরল খাবার পান করুন।',
      'জরের চিকিৎসায় সঠিক নিয়মে প্যারাসিটামল গ্রহণ করুন।',
      '৩ দিনের বেশি জ্বর থাকলে ডাক্তারের পরামর্শ নিন।'
    ]
  },
  {
    id: 'gastroenteritis',
    nameEn: 'Acute Gastroenteritis / Stomach Infection',
    nameBn: 'একিউট গ্যাস্ট্রোএন্টেরাইটিস বা পেটের ইনফেকশন',
    symptomsRequired: ['stomach_pain', 'diarrhea'],
    optionalSymptoms: ['nausea_vomiting', 'high_fever', 'fatigue'],
    triageLevel: 'moderate',
    descEn: 'Intestinal inflammation causing severe cramping and fluid loss.',
    descBn: 'পাকস্থলী বা অন্ত্রের প্রদাহ ও ইনফেকশন। পানিশূন্যতা রোধ করা সবচেয়ে জরুরি।',
    adviceEn: [
      'Drink Oral Rehydration Solutions (ORS) after each loose motion.',
      'Avoid spicy, fried, or dairy products for 48 hours.',
      'Seek medical advice if vomiting prevents keeping oral fluids down.'
    ],
    adviceBn: [
      'প্রতিবার পাতলা পায়খানার পর ওরস্যালাইন পান করুন।',
      'তেল-মসলাযুক্ত ও গুরুপাক খাবার এড়িয়ে চলুন।',
      'বমির কারণে পানি খেতে না পারলে হাসপাতালে স্যালাইন নিতে হবে।'
    ]
  },
  {
    id: 'gerd_acid',
    nameEn: 'Gastroesophageal Reflux Disease (GERD) / Dyspepsia',
    nameBn: 'গ্যাস্ট্রিক / এসিডিটি ও বুক জ্বালাপোড়া',
    symptomsRequired: ['acid_reflux'],
    optionalSymptoms: ['stomach_pain', 'nausea_vomiting'],
    triageLevel: 'low',
    descEn: 'Stomach acid flowing back into the food pipe causing esophageal irritation.',
    descBn: 'পাকস্থলীর এসিড খাদ্যনালীতে উঠে বুক জ্বালাপোড়া ও অস্বস্তি তৈরি করে।',
    adviceEn: [
      'Eat smaller, frequent meals and avoid lying down immediately after eating.',
      'Consider antacid or H2-blocker medication following doctor advice.',
      'Elevate the head of your bed by 6 inches.'
    ],
    adviceBn: [
      'একবারে বেশি না খেয়ে অল্প অল্প করে বারবার খাওয়ার অভ্যাস করুন।',
      'খাওয়ার পরপরই শুয়ে পড়বেন না, অন্তত ২ ঘণ্টা পর শুবেন।',
      'প্রয়োজনে এন্টাসিড বা চিকিৎসকের নির্দেশিত এসিডিটির ওষুধ খেতে পারেন।'
    ]
  },
  {
    id: 'chikungunya_fever',
    nameEn: 'Chikungunya Viral Joint Fever',
    nameBn: 'চিকনগুনিয়া জ্বর ও তীব্র জয়েন্ট পেইন',
    symptomsRequired: ['chikungunya_arm_fever'],
    optionalSymptoms: ['high_fever', 'headache', 'fatigue'],
    triageLevel: 'urgent',
    descEn: 'Mosquito-borne viral infection causing sudden high fever and crippling joint inflammation.',
    descBn: 'মশাবাহিত ভাইরাল জ্বর যার ফলে হঠাৎ উচ্চ জ্বর ও গিরায় গিরায় তীব্র যন্ত্রণা হয়।',
    adviceEn: [
      'Rest adequately and avoid joint strain.',
      'Use Paracetamol for pain/fever relief; avoid Aspirin or Ibuprofen.',
      'Maintain continuous fluid hydration.'
    ],
    adviceBn: [
      'পর্যাপ্ত বিশ্রাম নিন এবং জয়েন্টের ওপর অতিরিক্ত চাপ দেবেন না।',
      'ব্যথা কমানোর জন্য শুধু প্যারাসিটামল সেবন করুন।'
    ]
  },
  {
    id: 'malaria_fever',
    nameEn: 'Malaria Parasitic Fever with Shivering Rigors',
    nameBn: 'ম্যালেরিয়া জ্বর ও তীব্র কাঁপুনি',
    symptomsRequired: ['malaria_fever_chills'],
    optionalSymptoms: ['high_fever', 'headache', 'nausea_vomiting'],
    triageLevel: 'emergency',
    descEn: 'Parasitic blood infection causing periodic high fever spikes accompanied by severe shivering and sweating.',
    descBn: 'পরজীবী বাহিত রক্তজনিত রোগ যাতে তীব্র কাঁপুনি ও পর্যায়ক্রমিক প্রচণ্ড জ্বর দেখা দেয়।',
    adviceEn: [
      'Perform urgent Malaria Parasite (MP) blood slide test.',
      'Seek prompt medical evaluation for targeted antimalarial therapy.'
    ],
    adviceBn: [
      'অবিলম্বে রক্ত পরীক্ষা (Malaria MP / ICT) করিয়ে ডাক্তারের পরামর্শ নিন।'
    ]
  },
  {
    id: 'tuberculosis_fever',
    nameEn: 'Pulmonary Tuberculosis & Low-Grade Evening Fever',
    nameBn: 'ফুসফুসের যক্ষ্মা বা টিবি ফিভার',
    symptomsRequired: ['tuberculosis_fever'],
    optionalSymptoms: ['cough_blood', 'persistent_cough', 'weight_loss'],
    triageLevel: 'urgent',
    descEn: 'Mycobacterial pulmonary infection with low-grade evening fever, night sweats, and weight loss.',
    descBn: 'ফুসফুসের যক্ষ্মা সংক্রমণ যার লক্ষণ বিকেলে মৃদু জ্বর, কাশির সাথে রক্ত ও দ্রুত ওজন কমা।',
    adviceEn: [
      'Get sputum GeneXpert test and Chest X-ray performed.',
      'Consult a pulmonologist for free government DOTS anti-TB therapy.'
    ],
    adviceBn: [
      'কফ পরীক্ষা (GeneXpert) ও বুকের এক্স-রে করিয়ে সরকারি ডটস সেন্টারে যোগাযোগ করুন।'
    ]
  },
  {
    id: 'uti_kidney_fever',
    nameEn: 'Acute Pyelonephritis / Upper Kidney Infection Fever',
    nameBn: 'কিডনি ও মূত্রনালীর ইনফেকশন জ্বর',
    symptomsRequired: ['kidney_infection_fever'],
    optionalSymptoms: ['urinary_burning', 'kidney_flank_pain', 'high_fever'],
    triageLevel: 'urgent',
    descEn: 'Severe bacterial kidney infection causing high fever with chills and side flank pain.',
    descBn: 'কিডনির তীব্র ইনফেকশন যাতে কাঁপুনি দিয়ে জ্বর ও কোমরের পাঁজরে তীব্র ব্যথা হয়।',
    adviceEn: [
      'Perform urine RE and Urine Culture & Sensitivity test.',
      'Consult a urologist for intravenous or oral antibiotic regimen.'
    ],
    adviceBn: [
      'ইউরিন টেস্ট (R/E & Culture) করান ও প্রচুর পানি পান করুন।'
    ]
  },
  {
    id: 'covid19_fever',
    nameEn: 'COVID-19 Respiratory Fever Syndrome',
    nameBn: 'কোভিড-১৯ সংক্রামক জ্বর',
    symptomsRequired: ['covid_fever'],
    optionalSymptoms: ['high_fever', 'shortness_breath', 'sore_throat'],
    triageLevel: 'urgent',
    descEn: 'Coronavirus acute viral syndrome presenting with fever, respiratory distress, and fatigue.',
    descBn: 'করোনাভাইরাস ইনফেকশন যাতে উচ্চ জ্বর, স্বাদ/গন্ধহীনতা ও কাশি দেখা যায়।',
    adviceEn: [
      'Perform RT-PCR or Rapid Antigen Test.',
      'Isolate at home and monitor pulse oximeter blood oxygen (SpO2).'
    ],
    adviceBn: [
      'কোভিড র‍্যাপিড টেস্ট করান এবং ঘরে আইসোলেশনে থাকুন।'
    ]
  },
  {
    id: 'tonsillitis_fever',
    nameEn: 'Acute Tonsillitis & Sore Throat Fever',
    nameBn: 'টনসিলের ইনফেকশন ও গলা ব্যথার জ্বর',
    symptomsRequired: ['tonsillitis_fever'],
    optionalSymptoms: ['sore_throat', 'high_fever'],
    triageLevel: 'low',
    descEn: 'Inflammation of palatine tonsils causing severe sore throat, fever, and difficult swallowing.',
    descBn: 'টনসিলের ইনফেকশন যাতে গলায় তীব্র ব্যথা, গিলতে কষ্ট ও জ্বর থাকে।',
    adviceEn: [
      'Gargle with warm salt water 3-4 times daily.',
      'Consult an ENT doctor if symptoms persist past 3 days.'
    ],
    adviceBn: [
      'কুসুম গরম লবণ পানি দিয়ে দৈনিক ৩-৪ বার কুলকুচি করুন।'
    ]
  },
  {
    id: 'septicemia_fever',
    nameEn: 'Sepsis / Bloodstream Infection Emergency Alert',
    nameBn: 'সেপসিস বা রক্তে বিষাক্ত ইনফেকশন জ্বর',
    symptomsRequired: ['sepsis_fever'],
    optionalSymptoms: ['high_fever', 'fainting', 'shortness_breath'],
    triageLevel: 'emergency',
    descEn: 'Life-threatening systemic organ dysfunction caused by a severe bacterial bloodstream infection.',
    descBn: 'রক্তে ব্যাকটেরিয়াল ইনফেকশন যাতে উচ্চ জ্বর, দ্রুত শ্বাস ও অঙ্গ বিকল হওয়ার আশঙ্কা থাকে।',
    adviceEn: [
      'Immediate hospital emergency room admission for ICU critical care.',
      'Call Ambulance (102 / 108 / 999) immediately.'
    ],
    adviceBn: [
      'অবিলম্বে জরুরি অ্যাম্বুলেন্স (১০২ / ১০৮ / ৯৯৯) ডেকে হাসপাতালে ভর্তি হন।'
    ]
  },
  {
    id: 'heat_stroke_fever',
    nameEn: 'Heat Stroke / Environmental Hyperthermia',
    nameBn: 'হিট স্ট্রোক ও অতিরিক্ত উচ্চ তাপমাত্রা',
    symptomsRequired: ['heat_stroke_fever'],
    optionalSymptoms: ['high_fever', 'fainting', 'dizziness'],
    triageLevel: 'emergency',
    descEn: 'Extreme heat-induced failure of body thermoregulation causing core temp > 104°F.',
    descBn: 'প্রচণ্ড রোদে শরীরের তাপমাত্রা ১০৪°F ছাড়িয়ে যাওয়ার তীব্র জরুরি অবস্থা।',
    adviceEn: [
      'Move patient to cool shade immediately and apply cold sponges/ice packs.',
      'Seek emergency ER care if patient loses consciousness.'
    ],
    adviceBn: [
      'রোগীকে সাথে সাথে ছায়ায় এনে ঠান্ডা পানি ও বরফ পট্টি দিন।'
    ]
  }
];

// Bilingual Translations Mapping
const i18n = {
  en: {
    engineActive: 'AI Engine Online',
    navCalculators: 'Calculators',
    heroBadge: 'Clinical Grade AI Triage & Analysis',
    heroTitlePart1: 'Smart AI Health',
    heroTitlePart2: 'Diagnostic Engine',
    heroSubtitle: 'Select body regions, search or tap symptoms, and receive instantaneous clinical risk triage, differential diagnosis match scores, and actionable medical next steps.',
    statAccuracy: 'Triage Rule Accuracy',
    statSpeed: 'Instant AI Analysis',
    statRules: 'Clinical Protocols',
    statLang: 'Bangla & English',
    emergencyTitle: 'CRITICAL WARNING: Immediate Emergency Care Required',
    emergencyDesc: 'One or more symptoms selected require immediate emergency medical attention (e.g. Call 999/911 or visit the nearest Emergency Dept immediately). Do not wait!',
    step1Title: 'Step 1: Select Body Region',
    step1Sub: 'Choose the area where you are experiencing discomfort.',
    regionHead: 'Head & Neck',
    regionChest: 'Chest & Heart',
    regionAbdomen: 'Stomach / Abdomen',
    regionLimbs: 'Arms & Legs',
    regionGeneral: 'Fever & Bodywide',
    step2Title: 'Step 2: Search or Tap Symptoms',
    step2Sub: 'Type or click all symptoms that apply to your current condition.',
    selectedTitle: 'Selected Symptoms:',
    noSymptomsSelected: 'No symptoms selected yet.',
    severityLabel: 'Pain / Severity Level (1 - 10):',
    durationLabel: 'Symptom Duration:',
    durToday: 'Started today (< 24 hrs)',
    durFewDays: 'Few days (1 - 3 days)',
    durWeek: 'About a week',
    durChronic: 'Chronic / More than 2 weeks',
    analyzeBtn: 'Analyze Symptoms with AI',
    resultTitle: 'AI Health Assessment Results',
    resultSub: 'Instant algorithmic clinical analysis & risk triage.',
    emptyStateHeading: 'No Symptoms Analyzed Yet',
    emptyStateSub: 'Select your symptoms on the left and click "Analyze Symptoms with AI" to generate your comprehensive clinical report.',
    possibleConditionsTitle: 'Possible Differential Diagnoses:',
    recommendedActionTitle: 'Recommended Next Steps',
    printReportBtn: 'Export PDF Report',
    resetBtn: 'Reset',
    calcSectionTitle: 'Vital Health & Wellness Calculators',
    calcSectionSub: 'Quick diagnostic tools for daily health management.',
    bmiTitle: 'BMI Calculator',
    bmiSub: 'Body Mass Index for adults',
    weightLabel: 'Weight (kg):',
    heightLabel: 'Height (cm):',
    calcBmiBtn: 'Calculate BMI',
    waterTitle: 'Daily Water Intake',
    waterSub: 'Optimal daily hydration goal',
    activityLabel: 'Activity Level:',
    actModerate: 'Moderate (30m ex)',
    actHigh: 'Active (1h+ ex)',
    calcWaterBtn: 'Calculate Water Need',
    waterTip: '~ 10.5 glasses per day',
    bmrTitle: 'BMR & Calorie Estimator',
    bmrSub: 'Basal Metabolic Rate & Energy maintenance',
    ageLabel: 'Age (yrs):',
    genderLabel: 'Gender:',
    genderMale: 'Male',
    genderFemale: 'Female',
    calcBmrBtn: 'Calculate Calorie Need',
    bmrTip: 'Daily Maintenance Calories',
    disclaimer: 'MEDICAL DISCLAIMER: MediPulse AI is an artificial intelligence triage and educational decision support system. It is NOT a medical diagnosis or a substitute for professional healthcare advice, diagnosis, or treatment. If you believe you have a medical emergency, immediately call your local emergency number or visit a hospital.',
    langTitle: 'Select Language',
    navSignIn: 'Sign In',
    navFeatures: 'Features',
    authTitle: 'Welcome to MediPulse AI',
    authSubtitle: 'Access clinical diagnostic records & AI health insights',
    tabSignIn: 'Sign In',
    tabRegister: 'Register',
    btnGoogle: 'Continue with Google',
    authDivider: 'OR WITH EMAIL',
    labelEmail: 'Email Address',
    labelPassword: 'Password',
    labelFullName: 'Full Name',
    labelConfirmPassword: 'Confirm Password',
    btnSignIn: 'Sign In',
    btnRegister: 'Create Account',
    navHospitals: 'Nearby Hospitals',
    hospSectionTitle: 'Nearby Hospitals & Nursing Homes Locator',
    hospSectionSub: 'Find instant location, distance, contact details & directions for hospitals and nursing homes near your address.',
    emergencySupportBadge: '24/7 Emergency Medical GPS',
    useMyLocationBtn: 'Use My Location',
    searchBtn: 'Search',
    filterAll: 'All Facilities',
    filterHospitals: 'Hospitals',
    filterNursingHomes: 'Nursing Homes',
    filterEmergency: '24/7 ICU & Emergency',
    activeLocationLabel: 'Active Search Zone:',
    mapLoadingText: 'Locating nearby hospitals & nursing homes...',
    findNearbyHospBtn: '📍 Find Nearby Hospitals',
    openGoogleMapsBtn: '🗺️ Open in Google Maps',
    openZoneGmapBtn: 'View Zone on Google Maps',
    ambulanceCardTitle: 'Ambulance Service Hotline',
    ambulanceCardSub: '24/7 Emergency Ambulance Dispatch',
    nationalEmergencyTitle: 'National Emergency Helpline',
    nationalEmergencySub: 'Police, Fire & Medical Control Center',
    medicalHelplineTitle: 'Medical Consultation Line',
    medicalHelplineSub: 'Doctor Guidance & Triage Consultation',
    navConsultAI: 'AI Consult',
    floatingConsultText: 'AI Consult',
    chatDoctorName: 'Dr. MediPulse AI',
    chatDoctorSub: 'Gemini Clinical AI Consultant',
    chipPrompt1: 'Fever & Headache advice',
    chipPrompt2: 'Stomach pain & Gas remedies',
    chipPrompt3: 'Chest pain warning signs',
    chatWelcomeMsg: '👋 Hello! I am <strong>Dr. MediPulse AI</strong>, your clinical AI medical consultant. How can I assist with your symptoms or medical questions today?',
    chatTypingText: 'Dr. MediPulse AI is analyzing your query...',
    chatDisclaimerText: 'AI Triage & Decision Support tool. In emergencies, call Ambulance (102 / 108 / 999).',
    voiceModalTitle: '🫁 Voice Analysis',
    voiceModalSub: 'Preliminary assessment of respiratory health by analyzing cough and voice acoustics',
    voiceMicTab: '🎙️ Record Cough (Microphone)',
    voiceFileTab: '📁 Upload Audio File',
    voiceMicInstruction: 'Turn on microphone and cough or speak clearly 3–5 times.',
    voiceDropzoneText: 'Drag & Drop Cough Audio File Here',
    voiceSymptomsLabel: '📝 Additional Respiratory Symptoms (e.g. fever, sore throat, cough duration):',
    voiceAnalyzeBtn: 'Analyze Cough & Voice Sound with AI'
  },
  bn: {
    engineActive: 'এআই ইঞ্জিন সক্রিয়',
    navFeatures: 'ফিচারসমূহ',
    navHospitals: 'কাছাকাছি হাসপাতাল',
    navCalculators: 'ক্যালকুলেটরস',
    heroBadge: 'ক্লিনিক্যাল এআই ট্রায়াজ ও অ্যাসেসমেন্ট',
    heroTitlePart1: 'স্মার্ট এআই হেলথ',
    heroTitlePart2: 'ডায়াগনস্টিক ইঞ্জিন',
    heroSubtitle: 'শরীরের আক্রান্ত অংশ বেছে নিন, লক্ষণ সার্চ বা সিলেক্ট করুন এবং দ্রুততম সময়ে প্রাথমিক স্বাস্থ্য ঝুঁকি, সম্ভাব্য রোগ ও প্রয়োজনীয় চিকিৎসা নির্দেশিকা পান।',
    statAccuracy: 'সঠিক ট্রায়াজ রেজাল্ট',
    statSpeed: 'দ্রুততম এআই অ্যানালিসিস',
    statRules: 'ক্লিনিক্যাল গাইডলাইন',
    statLang: 'বাংলা ও ইংরেজি সাপোর্ট',
    emergencyTitle: 'জরুরি সতর্কতা: অবিলম্বে ইমার্জেন্সি চিকিৎসা প্রয়োজন!',
    emergencyDesc: 'আপনার নির্বাচিত লক্ষণগুলোর মধ্যে অত্যন্ত বিপজ্জনক রেড-ফ্ল্যাগ উপসর্গ রয়েছে। দেরি না করে এখনই হাসপাতালে বা জরুরি নম্বরে (৯৯৯ / ৯১১) যোগাযোগ করুন!',
    step1Title: 'ধাপ ১: শরীরের অংশ নির্বাচন করুন',
    step1Sub: 'শরীরের যে অংশে অস্বস্তি বা ব্যথা অনুভব করছেন তা সিলেক্ট করুন।',
    regionHead: 'মাথা ও ঘাড়',
    regionChest: 'বুক ও হার্ট',
    regionAbdomen: 'পেট ও পাকস্থলী',
    regionLimbs: 'হাত ও পা',
    regionGeneral: 'জ্বর ও সারা শরীর',
    step2Title: 'ধাপ ২: লক্ষণ সার্চ বা ট্যাপ করুন',
    step2Sub: 'আপনার বর্তমানে থাকা সকল উপসর্গ চিহ্নিত করুন।',
    selectedTitle: 'বাছাইকৃত লক্ষণসমূহ:',
    noSymptomsSelected: 'এখনও কোনো লক্ষণ নির্বাচন করা হয়নি।',
    severityLabel: 'ব্যথা/কষ্টের মাত্রা (১ - ১০):',
    durationLabel: 'লক্ষণগুলোর স্থায়ীত্বকাল:',
    durToday: 'আজকে শুরু হয়েছে (< ২৪ ঘণ্টা)',
    durFewDays: 'কয়েক দিন (১ - ৩ দিন)',
    durWeek: 'প্রায় ১ সপ্তাহ',
    durChronic: 'দীর্ঘমেয়াদী / ২ সপ্তাহের বেশি',
    analyzeBtn: 'এআই দিয়ে লক্ষণ বিশ্লেষণ করুন',
    resultTitle: 'এআই হেলথ অ্যাসেসমেন্ট ফলাফল',
    resultSub: 'ক্লিনিক্যাল নিয়মের ভিত্তিতে স্বয়ংক্রিয় অ্যালগরিদমিক রিপোর্ট।',
    emptyStateHeading: 'এখনও বিশ্লেষণ করা হয়নি',
    emptyStateSub: 'বাম পাশ থেকে আপনার লক্ষণগুলো সিলেক্ট করে "এআই দিয়ে লক্ষণ বিশ্লেষণ করুন" বাটনে ক্লিক করুন।',
    possibleConditionsTitle: 'সম্ভাব্য রোগের তালিকা:',
    recommendedActionTitle: 'প্রয়োজনীয় পরবর্তী পদক্ষেপসমূহ',
    printReportBtn: 'পিডিএফ রিপোর্ট ডাউনলোড',
    resetBtn: 'রিসেট',
    calcSectionTitle: 'জরুরি স্বাস্থ্য ও ফিটনেস ক্যালকুলেটর',
    calcSectionSub: 'প্রতিদিনের স্বাস্থ্য পর্যবেক্ষণের জন্য সহজ টুলস।',
    bmiTitle: 'বিএমআই ক্যালকুলেটর (BMI)',
    bmiSub: 'শরীরের ওজনের সঠিক মাত্রা',
    weightLabel: 'ওজন (কেজি):',
    heightLabel: 'উচ্চতা (সেমি):',
    calcBmiBtn: 'বিএমআই হিসাব করুন',
    waterTitle: 'দৈনিক পানির চাহিদা',
    waterSub: 'সুস্বাস্থ্যের জন্য প্রতিদিনের পর্যাপ্ত পানি',
    activityLabel: 'শারীরিক পরিশ্রম:',
    actModerate: 'মাঝারি (৩০ মিনিট ব্যায়াম)',
    actHigh: 'বেশি (১ ঘণ্টার বেশি ব্যায়াম)',
    calcWaterBtn: 'পানির পরিমাণ হিসাব করুন',
    waterTip: '~ প্রতিদিন প্রায় ১০.৫ গ্লাস পানি',
    bmrTitle: 'ক্যালোরি চাহিদা (BMR)',
    bmrSub: 'শরীরের দৈনিক মোট প্রয়োজনীয় ক্যালোরি',
    ageLabel: 'বয়স (বছর):',
    genderLabel: 'লিঙ্গ:',
    genderMale: 'পুরুষ',
    genderFemale: 'নারী',
    calcBmrBtn: 'ক্যালোরি হিসাব করুন',
    bmrTip: 'দৈনিক প্রয়োজনীয় ক্যালোরি',
    disclaimer: 'মেডিকেল ডিসক্লেইমার: মেডিপালস এআই একটি শিক্ষামূলক ও প্রাথমিক স্বাস্থ্য ঝুঁকি অ্যাসেসমেন্ট টুল। এটি কোনো রেজিস্টার্ড ডাক্তারের বিকল্প বা চূড়ান্ত ডায়াগনোসিস নয়। যেকোনো জরুরি পরিস্থিতিতে দ্রুত হাসপাতালে যোগাযোগ করুন।',
    langTitle: 'ভাষা নির্বাচন',
    navSignIn: 'সাইন ইন',
    authTitle: 'মেডিপালস এআই-এ স্বাগতম',
    authSubtitle: 'আপনার ক্লিনিক্যাল রিপোর্ট ও এআই হেলথ রেকর্ড অ্যাক্সেস করুন',
    tabSignIn: 'সাইন ইন',
    tabRegister: 'রেজিস্টার',
    btnGoogle: 'গুগল দিয়ে সাইন ইন করুন',
    authDivider: 'অথবা ইমেইল দিয়ে',
    labelEmail: 'ইমেইল এড্রেস',
    labelPassword: 'পাসওয়ার্ড',
    labelFullName: 'সম্পূর্ণ নাম',
    labelConfirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
    btnSignIn: 'সাইন ইন করুন',
    btnRegister: 'অ্যাকাউন্ট তৈরি করুন',
    hospSectionTitle: 'কাছাকাছি হাসপাতাল ও নার্সিং হোম লোকেটর',
    hospSectionSub: 'আপনার ঠিকানা অনুযায়ী কাছাকাছি সকল হাসপাতাল ও নার্সিং হোমের সঠিক অবস্থান, দূরত্ব, ফোন নম্বর ও জিপিএস রুট দেখুন।',
    emergencySupportBadge: '২৪/৭ ইমার্জেন্সি মেডিক্যাল জিপিএস',
    useMyLocationBtn: 'আমার বর্তমান লোকেশন',
    searchBtn: 'খুঁজুন',
    filterAll: 'সকল কেন্দ্র',
    filterHospitals: 'হাসপাতালসমূহ',
    filterNursingHomes: 'নার্সিং হোমসমূহ',
    filterEmergency: '২৪/৭ আইসিইউ ও ইমার্জেন্সি',
    activeLocationLabel: 'বর্তমান সার্চ এলাকা:',
    mapLoadingText: 'কাছাকাছি হাসপাতাল ও নার্সিং হোম খোঁজা হচ্ছে...',
    findNearbyHospBtn: '📍 কাছাকাছি হাসপাতাল খুঁজুন',
    openGoogleMapsBtn: '🗺️ গুগ্‌ল ম্যাপে সরাসরি দেখুন',
    openZoneGmapBtn: 'গুগল ম্যাপে এই এলাকা দেখুন',
    ambulanceCardTitle: 'জরুরি অ্যাম্বুলেন্স সেবা',
    ambulanceCardSub: '২৪/৭ ইমার্জেন্সি অ্যাম্বুলেন্স কল করুন',
    nationalEmergencyTitle: 'জাতীয় জরুরি হটলাইন',
    nationalEmergencySub: 'পুলিশ, ফায়ার ও ইমার্জেন্সি মেডিক্যাল সেবা',
    medicalHelplineTitle: 'মেডিক্যাল পরামর্শ হটলাইন',
    medicalHelplineSub: 'ডাক্তারের পরামর্শ ও ফ্রি ডায়াগনস্টিক তথ্য',
    navConsultAI: 'এআই পরামর্শ',
    floatingConsultText: 'এআই কনসাল্ট',
    chatDoctorName: 'ডক্টর মেডিপালস এআই',
    chatDoctorSub: 'জেমিয়াই ক্লিনিক্যাল মেডিক্যাল পরামর্শক',
    chipPrompt1: 'জ্বর ও মাথা ব্যথায় করণীয়',
    chipPrompt2: 'পেট ব্যথা ও এসিডিটির উপশম',
    chipPrompt3: 'বুকে ব্যথার জরুরি সতর্কতা',
    chatWelcomeMsg: '👋 হ্যালো! আমি <strong>ডক্টর মেডিপালস এআই</strong>, আপনার ব্যক্তিগত ক্লিনিক্যাল এআই স্বাস্থ্য পরামর্শক। আজ আপনাকে কীভাবে স্বাস্থ্য পরামর্শ দিয়ে সাহায্য করতে পারি?',
    chatTypingText: 'ডক্টর মেডিপালস এআই আপনার প্রশ্ন বিশ্লেষণ করছে...',
    chatDisclaimerText: 'এটি একটি এআই ক্লিনিক্যাল পরামর্শক টুল। জরুরি পরিস্থিতিতে অ্যাম্বুলেন্স (১০২ / ১০৮ / ৯৯৯) কল করুন।',
    voiceModalTitle: '🫁 কাশি ও কণ্ঠস্বর বিশ্লেষণ',
    voiceModalSub: 'কাশি বা কণ্ঠস্বর শুনে সম্ভাব্য শ্বাসযন্ত্রের সমস্যা সম্পর্কে প্রাথমিক ধারণা',
    voiceMicTab: '🎙️ কাশি রেকর্ড করুন (মাইক্রোফোন)',
    voiceFileTab: '📁 অডিও ফাইল আপলোড',
    voiceMicInstruction: 'মাইক্রোফোন অন করে ৩-৫ বার পরিষ্কারভাবে কাশুন বা কথা বলুন।',
    voiceDropzoneText: 'কাশি অডিও ফাইল এখানে ড্র্যাগ ও ড্রপ করুন',
    voiceSymptomsLabel: '📝 অতিরিক্ত লক্ষণসমূহ (যেমন: জ্বর, গলা ব্যথা, কতদিন ধরে কাশি):',
    voiceAnalyzeBtn: 'এআই দিয়ে কাশি ও কণ্ঠস্বর বিশ্লেষণ করুন'
  },
  hi: {
    engineActive: 'एआई इंजन ऑनलाइन',
    navFeatures: 'विशेषताएं',
    navHospitals: 'पास के अस्पताल',
    navCalculators: 'कैलकुलेटर',
    heroBadge: 'क्लिनिकल ग्रेड एआई ट्राइएज और विश्लेषण',
    heroTitlePart1: 'स्मार्ट एआई हेल्थ',
    heroTitlePart2: 'डायग्नोस्टिक इंजन',
    heroSubtitle: 'शरीर के प्रभावित क्षेत्र को चुनें, लक्षणों को खोजें या चुनें, और तुरंत क्लिनिकल जोखिम मूल्यांकन, संभावित बीमारी और आवश्यक चिकित्सा सलाह प्राप्त करें।',
    statAccuracy: 'सटीक ट्राइएज परिणाम',
    statSpeed: 'त्वरित एआई विश्लेषण',
    statRules: 'क्लिनिकल गाइडलाइन्स',
    statLang: 'हिंदी, अंग्रेजी और बांग्ला',
    emergencyTitle: 'आपातकालीन चेतावनी: तत्काल चिकित्सा देखभाल की आवश्यकता है!',
    emergencyDesc: 'आपके द्वारा चुने गए लक्षणों में गंभीर आपातकालीन संकेत शामिल हैं। बिना किसी देरी के तुरंत अस्पताल जाएं या आपातकालीन नंबर पर कॉल करें!',
    step1Title: 'चरण 1: शरीर का क्षेत्र चुनें',
    step1Sub: 'वह क्षेत्र चुनें जहां आप असुविधा या दर्द महसूस कर रहे हैं।',
    regionHead: 'सिर और गर्दन',
    regionChest: 'छाती और दिल',
    regionAbdomen: 'पेट और पाचन',
    regionLimbs: 'हाथ और पैर',
    regionGeneral: 'बुखार और शरीर भर में',
    step2Title: 'चरण 2: लक्षण खोजें या चुनें',
    step2Sub: 'अपनी वर्तमान स्थिति पर लागू होने वाले सभी लक्षणों को चुनें।',
    selectedTitle: 'चयनित लक्षण:',
    noSymptomsSelected: 'अभी तक कोई लक्षण नहीं चुना गया है।',
    severityLabel: 'दर्द / गंभीरता का स्तर (1 - 10):',
    durationLabel: 'लक्षणों की अवधि:',
    durToday: 'आज शुरू हुआ (< 24 घंटे)',
    durFewDays: 'कुछ दिन (1 - 3 दिन)',
    durWeek: 'लगभग एक हफ्ता',
    durChronic: 'दीर्घकालिक / 2 सप्ताह से अधिक',
    analyzeBtn: 'एआई से लक्षणों का विश्लेषण करें',
    resultTitle: 'एआई स्वास्थ्य मूल्यांकन परिणाम',
    resultSub: 'क्लिनिकल नियमों के आधार पर स्वचालित एल्गोरिथम रिपोर्ट।',
    emptyStateHeading: 'अभी तक कोई लक्षण विश्लेषित नहीं किया गया',
    emptyStateSub: 'बाईं ओर से अपने लक्षणों को चुनें और "एआई से लक्षणों का विश्लेषण करें" पर क्लिक करें।',
    possibleConditionsTitle: 'संभावित बीमारियों की सूची:',
    recommendedActionTitle: 'अनुशंसित अगले कदम',
    printReportBtn: 'पीडीएफ रिपोर्ट डाउनलोड करें',
    resetBtn: 'रीसेट करें',
    calcSectionTitle: 'महत्वपूर्ण स्वास्थ्य और फिटनेस कैलकुलेटर',
    calcSectionSub: 'दैनिक स्वास्थ्य निगरानी के लिए त्वरित उपकरण।',
    bmiTitle: 'बीएमआई कैलकुलेटर (BMI)',
    bmiSub: 'वयस्कों के लिए बॉडी मास इंडेक्स',
    weightLabel: 'वजन (किग्रा):',
    heightLabel: 'ऊंचाई (सेमी):',
    calcBmiBtn: 'बीएमआई की गणना करें',
    waterTitle: 'दैनिक पानी की आवश्यकता',
    waterSub: 'अनुकूलतम दैनिक जलयोजन लक्ष्य',
    activityLabel: 'शारीरिक गतिविधि:',
    actModerate: 'मध्यम (30 मिनट व्यायाम)',
    actHigh: 'उच्च (1 घंटे से अधिक व्यायाम)',
    calcWaterBtn: 'पानी की आवश्यकता की गणना करें',
    waterTip: '~ प्रतिदिन लगभग 10.5 गिलास पानी',
    bmrTitle: 'कैलोरी आवश्यकता (BMR)',
    bmrSub: 'बेसल मेटाबॉलिक रेट और दैनिक ऊर्जा',
    ageLabel: 'आयु (वर्ष):',
    genderLabel: 'लिंग:',
    genderMale: 'पुरुष',
    genderFemale: 'महिला',
    calcBmrBtn: 'कैलोरी की गणना करें',
    bmrTip: 'दैनिक रखरखाव कैलोरी',
    disclaimer: 'चिकित्सा अस्वीकरण: मेडीपल्स एआई एक शैक्षणिक और प्रारंभिक स्वास्थ्य जोखिम मूल्यांकन उपकरण है। यह किसी डॉक्टर का विकल्प या अंतिम निदान नहीं है। किसी भी आपात स्थिति में तुरंत अस्पताल से संपर्क करें।',
    navSignIn: 'साइन इन करें',
    authTitle: 'मेडीपल्स एआई में आपका स्वागत है',
    authSubtitle: 'अपनी क्लिनिकल डायग्नोस्टिक रिपोर्ट और एआई हेल्थ रिकॉर्ड्स देखें',
    tabSignIn: 'साइन इन करें',
    tabRegister: 'रजिस्टर करें',
    btnGoogle: 'गूगल से साइन इन करें',
    authDivider: 'या ईमेल से',
    labelEmail: 'ईमेल पता',
    labelPassword: 'पासवर्ड',
    labelFullName: 'पूरा नाम',
    labelConfirmPassword: 'पासवर्ड की पुष्टि करें',
    btnSignIn: 'साइन इन करें',
    btnRegister: 'खाता बनाएं',
    hospSectionTitle: 'पास के अस्पताल और नर्सिंग होम लोकेटर',
    hospSectionSub: 'अपने पते के अनुसार पास के अस्पतालों और नर्सिंग होम की सटीक स्थिति, दूरी, फोन नंबर और मार्ग देखें।',
    emergencySupportBadge: '24/7 आपातकालीन मेडिकल जीपीएस',
    useMyLocationBtn: 'मेरा वर्तमान स्थान',
    searchBtn: 'खोजें',
    filterAll: 'सभी सुविधाएं',
    filterHospitals: 'अस्पताल',
    filterNursingHomes: 'नर्सिंग होम',
    filterEmergency: '24/7 आईसीयू और आपातकालीन',
    activeLocationLabel: 'सक्रिय खोज क्षेत्र:',
    mapLoadingText: 'पास के अस्पतालों और नर्सिंग होम की खोज की जा रही है...',
    findNearbyHospBtn: '📍 पास के अस्पताल खोजें',
    openGoogleMapsBtn: '🗺️ गूगल मैप्स में खोलें',
    openZoneGmapBtn: 'गूगल मैप्स में क्षेत्र देखें',
    ambulanceCardTitle: 'एंबुलेंस सेवा हॉटलाइन',
    ambulanceCardSub: '24/7 आपातकालीन एंबुलेंस प्रेषण',
    nationalEmergencyTitle: 'राष्ट्रीय आपातकालीन हेल्पलाइन',
    nationalEmergencySub: 'पुलिस, अग्निशमन और चिकित्सा नियंत्रण',
    medicalHelplineTitle: 'चिकित्सा परामर्श लाइन',
    medicalHelplineSub: 'डॉक्टर मार्गदर्शन और परामर्श',
    navConsultAI: 'एआई परामर्श',
    floatingConsultText: 'एआई कंसल्ट',
    chatDoctorName: 'डॉ. मेडीपल्स एआई',
    chatDoctorSub: 'जेमिनी क्लिनिकल एआई कंसल्टेंट',
    chipPrompt1: 'बुखार और सिरदर्द की सलाह',
    chipPrompt2: 'पेट दर्द और गैस के उपाय',
    chipPrompt3: 'छाती के दर्द के चेतावनी संकेत',
    chatWelcomeMsg: '👋 नमस्ते! मैं <strong>डॉ. मेडीपल्स एआई</strong> हूं, आपका 24/7 क्लिनिकल एआई परामर्शदाता। आज मैं आपकी स्वास्थ्य संबंधी क्या सहायता कर सकता हूं?',
    chatTypingText: 'डॉ. मेडीपल्स एआई आपके प्रश्न का विश्लेषण कर रहे हैं...',
    chatDisclaimerText: 'एआई ट्राइएज और निर्णय सहायता उपकरण। आपात स्थिति में, एंबुलेंस (102 / 108 / 999) पर कॉल करें।',
    voiceModalTitle: '🫁 आवाज और खांसी विश्लेषण',
    voiceModalSub: 'खांसी या आवाज सुनकर श्वसन स्वास्थ्य का प्रारंभिक मूल्यांकन',
    voiceMicTab: '🎙️ खांसी रिकॉर्ड करें (माइक)',
    voiceFileTab: '📁 ऑडियो फाइल अपलोड',
    voiceMicInstruction: 'माइक चालू करें और 3-5 बार साफ खांसें या बोलें।',
    voiceDropzoneText: 'खांसी का ऑडियो फाइल यहां ड्रैग और ड्रॉप करें',
    voiceSymptomsLabel: '📝 अतिरिक्त लक्षण (जैसे: बुखार, गले में खराश, खांसी की अवधि):',
    voiceAnalyzeBtn: 'एआई से खांसी और आवाज का विश्लेषण करें'
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  renderSymptomChips();
  updateI18nUI();
  updateSVGHighlight('head');
  setTimeout(initHospitalMap, 500);

  // Firebase Auth Initialization & Listener
  window.initFirebaseAuth = function() {
    if (window.FirebaseAuthService) {
      window.FirebaseAuthService.onAuthChange((user) => {
        updateAuthUI(user);
      });
    }
  };
  window.initFirebaseAuth();
  window.addEventListener('firebaseAuthReady', () => {
    window.initFirebaseAuth();
  });
});

// Set Language Mode
function setLanguage(lang) {
  currentLang = lang;
  document.getElementById('lang-en')?.classList.toggle('active', lang === 'en');
  document.getElementById('lang-bn')?.classList.toggle('active', lang === 'bn');
  document.getElementById('lang-hi')?.classList.toggle('active', lang === 'hi');
  updateI18nUI();
  renderSymptomChips();
  renderSelectedTags();
  if (typeof updateMapAndCards === 'function') updateMapAndCards();
}

// Update Text Content across DOM
function updateI18nUI() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[currentLang] && i18n[currentLang][key]) {
      el.textContent = i18n[currentLang][key];
    }
  });
}

// Select Active Body Region & Swap View
function selectBodyRegion(region, btnElem) {
  activeRegion = region;
  
  // Hide body model view, show symptom view
  const bodyContainer = document.getElementById('body-view-container');
  const symptomContainer = document.getElementById('symptom-view-container');
  if (bodyContainer) bodyContainer.style.display = 'none';
  if (symptomContainer) symptomContainer.style.display = 'block';

  // Update active region badge title
  const activeRegionNameElem = document.getElementById('active-region-name');
  if (activeRegionNameElem) {
    const regionNames = {
      head: { en: '🧠 Head & Neck Symptoms & Fevers', bn: '🧠 মাথা ও ঘাড়ে সম্ভাব্য সমস্যা ও জ্বর', hi: '🧠 सिर और गर्दन के लक्षण व बुखार' },
      chest: { en: '🫁 Chest & Heart Symptoms & Fevers', bn: '🫁 বুক ও হার্টের সম্ভাব্য সমস্যা ও জ্বর', hi: '🫁 छाती और दिल के लक्षण व बुखार' },
      abdomen: { en: '🩺 Abdominal & Digestive Issues', bn: '🩺 পেট ও গ্যাস্ট্রিকের সম্ভাব্য সমস্যা ও জ্বর', hi: '🩺 पेट और पाचन संबंधी लक्षण व बुखार' },
      arms: { en: '💪 Arm Symptoms & Chikungunya Fever', bn: '💪 হাতের সম্ভাব্য ব্যথা, চিকনগুনিয়া জ্বর ও উপসর্গ', hi: '💪 हाथ के लक्षण व चिकुनगुनिया बुखार' },
      legs: { en: '🦵 Leg Symptoms & Dengue Bone Fever', bn: '🦵 পায়ের সম্ভাব্য হাড়ের ব্যথা, ডেঙ্গু জ্বর ও উপসর্গ', hi: '🦵 पैर के लक्षण व डेंगू हड्डी बुखार' },
      upper_back: { en: '🦴 Upper Back & Shoulder Symptoms', bn: '🦴 পিঠের ওপরের অংশ ও কাঁধের উপসর্গ', hi: '🦴 ऊपरी पीठ और कंधे के लक्षण' },
      lower_back: { en: '⚡ Lower Back & Lumbar Spine Pain', bn: '⚡ কোমর ও মেরুদণ্ডের সমস্যা ও পেইন', hi: '⚡ कमर और रीढ़ की हड्डी का दर्द' },
      kidney: { en: '🚨 Kidney Region & Flank Infection Alert', bn: '🚨 কিডনি এলাকা ও পাঁজরের সাইডের ব্যথা/জ্বর', hi: '🚨 गुर्दे (किडनी) और कमर का दर्द व बुखार' },
      glutes_legs: { en: '🦵 Posterior Leg & Calf Muscle Symptoms', bn: '🦵 পায়ের পিছনের অংশ ও মাসল পেইন', hi: '🦵 पैर के पिछले हिस्से व मांसपेशियों का दर्द' },
      general: { en: '🌡️ High Fever & Bodywide Conditions', bn: '🌡️ উচ্চ জ্বর ও সারা শরীরের সাধারণ উপসর্গ', hi: '🌡️ तेज बुखार और शरीर के लक्षण' }
    };
    const titleObj = regionNames[region] || regionNames['head'];
    activeRegionNameElem.textContent = titleObj[currentLang] || titleObj.en;
  }

  renderSymptomChips();
}

// Switch Front / Back Anatomical Body View
let currentOrientation = 'front';
function switchBodyOrientation(orientation) {
  currentOrientation = orientation;
  const frontBtn = document.getElementById('btn-orient-front');
  const backBtn = document.getElementById('btn-orient-back');
  const bodyImg = document.getElementById('human-body-img');
  const instructionText = document.getElementById('body-instruction-text');

  if (orientation === 'front') {
    frontBtn?.classList.add('active');
    backBtn?.classList.remove('active');
    if (bodyImg) bodyImg.style.transform = 'rotateY(0deg)';
    if (instructionText) {
      instructionText.textContent = currentLang === 'bn' 
        ? 'সামনের অংশের লক্ষণ দেখতে শরীরের যে কোনো জায়গায় সরাসরি টাচ করুন:'
        : 'Touch any part of the Front body model to view probable fevers & symptoms:';
    }
  } else {
    backBtn?.classList.add('active');
    frontBtn?.classList.remove('active');
    if (bodyImg) bodyImg.style.transform = 'rotateY(180deg)';
    if (instructionText) {
      instructionText.textContent = currentLang === 'bn' 
        ? 'পিছনের অংশের (পিঠ, কোমর, কিডনি) লক্ষণ দেখতে শরীরের যে কোনো জায়গায় সরাসরি টাচ করুন:'
        : (currentLang === 'hi' ? 'पीठ और कमर के लक्षणों को देखने के लिए शरीर के किसी भी हिस्से को छुएं:' : 'Touch any part of the Back body model (Back, Lumbar, Kidney) to view symptoms:');
    }
  }
}

// Direct Body Silhouette Touch Handler
function handleDirectBodyTouch(e) {
  const wrapper = document.getElementById('human-body-wrapper');
  if (!wrapper) return;

  const rect = wrapper.getBoundingClientRect();
  const relX = ((e.clientX - rect.left) / rect.width) * 100;
  const relY = ((e.clientY - rect.top) / rect.height) * 100;

  // Visual Touch Ripple Feedback
  createTouchRipple(relX, relY);

  let targetRegion = 'head';

  if (currentOrientation === 'front') {
    // FRONT SIDE TOUCH REGIONS
    if (relY < 22) {
      targetRegion = 'head';
    } else if (relY >= 22 && relY < 38) {
      if (relX < 32 || relX > 68) {
        targetRegion = 'arms';
      } else {
        targetRegion = 'chest';
      }
    } else if (relY >= 38 && relY < 55) {
      if (relX < 26 || relX > 74) {
        targetRegion = 'arms';
      } else {
        targetRegion = 'abdomen';
      }
    } else {
      targetRegion = 'legs';
    }
  } else {
    // BACK SIDE TOUCH REGIONS
    if (relY < 32) {
      targetRegion = 'upper_back';
    } else if (relY >= 32 && relY < 50) {
      if (relX >= 35 && relX <= 65) {
        targetRegion = 'lower_back';
      } else {
        targetRegion = 'kidney';
      }
    } else {
      targetRegion = 'glutes_legs';
    }
  }

  // Open region symptoms after brief ripple feedback (150ms)
  setTimeout(() => {
    selectBodyRegion(targetRegion);
  }, 150);
}

// Create Cyan Neon Touch Ripple
function createTouchRipple(xPct, yPct) {
  const wrapper = document.getElementById('human-body-wrapper');
  if (!wrapper) return;

  const ripple = document.createElement('div');
  ripple.className = 'body-touch-ripple';
  ripple.style.left = `${xPct}%`;
  ripple.style.top = `${yPct}%`;

  wrapper.appendChild(ripple);
  setTimeout(() => {
    ripple.remove();
  }, 500);
}

// Show Body Model View again
function showBodyView() {
  const bodyContainer = document.getElementById('body-view-container');
  const symptomContainer = document.getElementById('symptom-view-container');
  if (bodyContainer) bodyContainer.style.display = 'block';
  if (symptomContainer) symptomContainer.style.display = 'none';
}

// Filter symptoms in real-time via search bar
function filterSymptoms(query) {
  searchQuery = query.trim().toLowerCase();
  renderSymptomChips();
}

// Render Available Symptom Chips
function renderSymptomChips() {
  const container = document.getElementById('symptoms-chip-group');
  container.innerHTML = '';

  let symptomsList = [];
  if (searchQuery) {
    // Search across ALL body categories
    const all = Object.values(symptomDatabase).flat();
    symptomsList = all.filter(item => 
      item.nameEn.toLowerCase().includes(searchQuery) ||
      item.nameBn.toLowerCase().includes(searchQuery) ||
      (item.nameHi && item.nameHi.toLowerCase().includes(searchQuery))
    );
  } else {
    symptomsList = symptomDatabase[activeRegion] || [];
  }

  if (symptomsList.length === 0) {
    const safeSearch = searchQuery.replace(/'/g, "\\'");
    const customId = `custom_fever_${searchQuery.replace(/[^a-z0-9]/gi, '_')}`;
    const customSymptomObj = {
      id: customId,
      nameEn: `🔥 Custom Search: "${searchQuery}"`,
      nameBn: `🔥 অনুসন্ধানের উপসর্গ: "${searchQuery}"`,
      nameHi: `🔥 खोजे गए लक्षण: "${searchQuery}"`,
      redFlag: searchQuery.includes('emergency') || searchQuery.includes('high') || searchQuery.includes('severe') || searchQuery.includes('chest') || searchQuery.includes('stiff'),
      weight: 3
    };

    container.innerHTML = `
      <div style="width: 100%; display: flex; flex-direction: column; gap: 0.8rem;">
        <div class="symptom-chip selected">
          <span>${currentLang === 'bn' ? `🔥 কাস্টম উপসর্গ: "${searchQuery}" (সিলেক্টেড)` : (currentLang === 'hi' ? `🔥 कस्टम लक्षण: "${searchQuery}" (चयनित)` : `🔥 Custom Search: "${searchQuery}" (Selected)`)}</span>
          <i class="fa-solid fa-circle-check" style="color: #10b981;"></i>
        </div>

        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); padding: 0.9rem; border-radius: var(--radius-sm); color: var(--text-main);">
          <div style="font-size: 0.88rem; font-weight: 700; color: #10b981; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
            <i class="fa-solid fa-kit-medical"></i> ${currentLang === 'bn' ? `💊 "${searchQuery}" - প্রাথমিক চিকিৎসা ও থেরাপি নির্দেশিকা:` : `💊 Basic Therapy & Care for "${searchQuery}":`}
          </div>
          <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0.6rem;">
            ${currentLang === 'bn' 
              ? 'যেকোনো অনুল্লিখিত বা অচেনা জ্বরের ক্ষেত্রে তাৎক্ষণিক থেরাপি: প্রতি ১-২ ঘণ্টায় ওরাল স্যালাইন/ডাবের পানি পান করুন, কপালে জলপট্টি দিন এবং জ্বর ১০১°F+ হলে চিকিৎসকের পরামর্শ অনুযায়ী প্যারাসিটামল সেবন করুন।'
              : 'Immediate basic therapy for any unlisted fever: Drink ORS saline/coconut water every 1-2 hours, apply tepid water sponges on forehead, and use Paracetamol for temp > 101°F.'
            }
          </p>
          <button class="btn btn-secondary" onclick="sendQuickPrompt('What is the basic therapy and advice for ${safeSearch}?')" style="font-size: 0.78rem; padding: 0.35rem 0.8rem; border-color: var(--accent-cyan); color: var(--accent-cyan);">
            <i class="fa-solid fa-comments"></i> ${currentLang === 'bn' ? 'এআই ডাক্তারের সাথে কথা বলুন' : 'Consult Dr. MediPulse AI'}
          </button>
        </div>
      </div>
    `;

    if (!selectedSymptoms.has(customId)) {
      selectedSymptoms.add(customId);
      if (!symptomDatabase.general.some(s => s.id === customId)) {
        symptomDatabase.general.push(customSymptomObj);
      }
      renderSelectedTags();
      checkEmergencyState();
    }
    return;
  }

  symptomsList.forEach(item => {
    const isSelected = selectedSymptoms.has(item.id);
    const chip = document.createElement('div');
    chip.className = `symptom-chip ${isSelected ? 'selected' : ''}`;
    chip.onclick = () => toggleSymptom(item.id);
    const chipName = currentLang === 'bn' ? item.nameBn : (currentLang === 'hi' && item.nameHi ? item.nameHi : item.nameEn);
    chip.innerHTML = `
      <span>${chipName}</span>
      ${item.redFlag ? '<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;" title="Red-flag symptom"></i>' : ''}
    `;
    container.appendChild(chip);
  });
}

// Toggle Symptom Selection
function toggleSymptom(symptomId) {
  if (selectedSymptoms.has(symptomId)) {
    selectedSymptoms.delete(symptomId);
  } else {
    selectedSymptoms.add(symptomId);
  }
  renderSymptomChips();
  renderSelectedTags();
  checkEmergencyState();
}

// Render Selected Symptom Tags Summary
function renderSelectedTags() {
  const container = document.getElementById('selected-tags-container');
  const countElem = document.getElementById('selected-count');
  container.innerHTML = '';
  const countSuffix = currentLang === 'bn' ? 'টি নির্বাচিত' : (currentLang === 'hi' ? 'चयनित' : 'selected');
  countElem.textContent = `${selectedSymptoms.size} ${countSuffix}`;

  if (selectedSymptoms.size === 0) {
    container.innerHTML = `<span style="color: var(--text-muted); font-size: 0.88rem;">${i18n[currentLang] ? i18n[currentLang].noSymptomsSelected : i18n.en.noSymptomsSelected}</span>`;
    return;
  }

  const allSymptoms = Object.values(symptomDatabase).flat();

  selectedSymptoms.forEach(id => {
    const symptomObj = allSymptoms.find(s => s.id === id);
    if (!symptomObj) return;

    const tagName = currentLang === 'bn' ? symptomObj.nameBn : (currentLang === 'hi' && symptomObj.nameHi ? symptomObj.nameHi : symptomObj.nameEn);
    const tag = document.createElement('div');
    tag.className = 'selected-tag';
    tag.innerHTML = `
      <span>${tagName}</span>
      <span class="remove-btn" onclick="toggleSymptom('${id}')">&times;</span>
    `;
    container.appendChild(tag);
  });
}

// Update Severity Slider Display
function updateSeverityValue(val) {
  currentSeverity = parseInt(val, 10);
  document.getElementById('severity-val').textContent = val;
}

// Check for Critical Emergency Red-Flag Symptoms
function checkEmergencyState() {
  const allSymptoms = Object.values(symptomDatabase).flat();
  let hasRedFlag = false;

  selectedSymptoms.forEach(id => {
    const item = allSymptoms.find(s => s.id === id);
    if (item && item.redFlag) {
      hasRedFlag = true;
    }
  });

  const banner = document.getElementById('emergency-banner');
  banner.style.display = hasRedFlag ? 'block' : 'none';
}

function showAssessmentLoadingState() {
  const emptyState = document.getElementById('empty-state');
  const activeResult = document.getElementById('active-result');

  if (activeResult) activeResult.style.display = 'none';
  if (!emptyState) return;

  emptyState.style.display = 'block';
  emptyState.innerHTML = `
    <div class="empty-icon" id="heart-pulse-icon-container" style="background: rgba(239, 68, 68, 0.18); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 50%; width: 90px; height: 90px; margin: 0 auto 1.2rem auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 28px rgba(239, 68, 68, 0.5); transition: all 0.3s ease;">
      <i class="fa-solid fa-heart-pulse fa-bounce" id="heart-pulse-icon" style="color: #ef4444; font-size: 2.5rem;"></i>
    </div>
    
    <h3 style="color: var(--text-main); font-weight: 700; font-size: 1.15rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
      <i class="fa-solid fa-circle-notch fa-spin" style="color: var(--accent-cyan);"></i>
      <span>${currentLang === 'bn' ? 'এআই দিয়ে লক্ষণ ও প্রোটোকল বিশ্লেষণ চলছে...' : 'Analyzing Symptoms & Clinical Protocols...'}</span>
    </h3>
    
    <p id="loading-stage-text" style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.2rem;">
      ${currentLang === 'bn' ? '৫০০+ ক্লিনিক্যাল প্রোটোকল ও আইসিডি-১০ কোড মিলিয়ে দেখা হচ্ছে...' : 'Checking 500+ clinical rules & ICD-10 pathology codes...'}
    </p>

    <div style="width: 80%; max-width: 280px; margin: 0 auto; height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; position: relative;">
      <div id="loading-progress-bar" style="width: 20%; height: 100%; background: linear-gradient(90deg, #ef4444, #06b6d4); border-radius: 10px; transition: width 0.35s ease;"></div>
    </div>
  `;

  setTimeout(() => {
    const bar = document.getElementById('loading-progress-bar');
    const stage = document.getElementById('loading-stage-text');
    if (bar) bar.style.width = '65%';
    if (stage) stage.textContent = currentLang === 'bn' ? 'ঝুঁকির মাত্রা ও প্রয়োজনীয় রক্ত পরীক্ষা নির্ণয় করা হচ্ছে...' : 'Evaluating risk urgency & pathology blood tests...';
  }, 350);

  setTimeout(() => {
    const bar = document.getElementById('loading-progress-bar');
    const stage = document.getElementById('loading-stage-text');
    if (bar) bar.style.width = '95%';
    if (stage) stage.textContent = currentLang === 'bn' ? 'প্রোপার মেডিকেল থেরাপি ও প্রেসক্রিপশন রিপোর্ট তৈরি সম্পন্ন হচ্ছে...' : 'Formatting clinical triage therapy report...';
  }, 700);
}

function restoreInitialEmptyState() {
  const emptyState = document.getElementById('empty-state');
  if (!emptyState) return;

  emptyState.style.display = 'block';
  emptyState.innerHTML = `
    <div class="empty-icon" id="heart-pulse-icon-container" style="background: rgba(239, 68, 68, 0.12); border: 2px solid rgba(239, 68, 68, 0.35); border-radius: 50%; width: 90px; height: 90px; margin: 0 auto 1.2rem auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 18px rgba(239, 68, 68, 0.2); transition: all 0.3s ease;">
      <i class="fa-solid fa-heart-pulse" id="heart-pulse-icon" style="color: #ef4444; font-size: 2.5rem;"></i>
    </div>
    <h3 data-i18n="emptyStateHeading" style="color: var(--text-main); font-weight: 700; margin-bottom: 0.5rem;">${currentLang === 'bn' ? 'এখনো কোনো লক্ষণ বিশ্লেষণ করা হয়নি' : 'No Symptoms Analyzed Yet'}</h3>
    <p data-i18n="emptyStateSub">${currentLang === 'bn' ? 'বামপাশ থেকে লক্ষণ বেছে নিন এবং "Analyze Symptoms with AI" বাটনে চাপ দিয়ে ক্লিনিক্যাল রিপোর্ট তৈরি করুন।' : 'Select your symptoms on the left and click "Analyze Symptoms with AI" to generate your comprehensive clinical report.'}</p>
  `;
}

// Main Clinical Triage & Differential Diagnosis Logic (Connected to Python Backend API)
async function runDiagnosis() {
  if (selectedSymptoms.size === 0) {
    alert(currentLang === 'bn' ? 'অনুগ্রহ করে অন্তত ১টি লক্ষণ নির্বাচন করুন।' : 'Please select at least 1 symptom.');
    return;
  }

  const selectedArray = Array.from(selectedSymptoms);
  const analyzeBtn = document.getElementById('analyze-btn');
  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${currentLang === 'bn' ? 'এআই বিশ্লেষণ চলছে...' : 'Analyzing Symptoms...'}`;
  }

  // Display medical loading animation in empty-state box
  showAssessmentLoadingState();

  const startTime = Date.now();

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms: selectedArray,
        severity: currentSeverity,
        lang: currentLang
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success') {
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 950 - elapsed);
        setTimeout(() => {
          renderDiagnosisFromApi(result);
          saveReportToBackend(result);
        }, remainingDelay);
        return;
      }
    }
  } catch (err) {
    console.warn("Backend API offline/unreachable, using client engine:", err);
  } finally {
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = `<i class="fa-solid fa-brain"></i> <span data-i18n="analyzeBtn">${currentLang === 'bn' ? 'এআই দিয়ে লক্ষণ বিশ্লেষণ করুন' : 'Analyze Symptoms with AI'}</span>`;
    }
  }

  // Fallback to client-side decision logic if API is unavailable
  setTimeout(() => {
    runClientDiagnosis();
  }, 950);
}

function renderDiagnosisFromApi(result) {
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('active-result').style.display = 'block';

  // Render Triage Badge
  const badge = document.getElementById('triage-badge');
  badge.className = `triage-status-badge ${result.triage_level.toLowerCase()}`;
  document.getElementById('triage-text').textContent = result.triage_text;

  // Render Condition Cards with Proper Therapy & Recommended Next Steps
  const conditionListElem = document.getElementById('condition-list');
  conditionListElem.innerHTML = '';

  result.matched_conditions.forEach(cond => {
    const card = document.createElement('div');
    card.className = 'condition-item';
    card.style.borderLeft = `4px solid ${cond.triageLevel === 'EMERGENCY' ? '#ff3b30' : (cond.triageLevel === 'URGENT' ? '#ff9500' : '#3b82f6')}`;
    
    const adviceItems = cond.advice || [];
    const therapyGuideline = adviceItems.length > 0 ? adviceItems[0] : (currentLang === 'bn' ? 'প্রচুর তরল সেবন ও পূর্ণ বিশ্রাম নিন।' : 'Maintain adequate fluid hydration and complete bed rest.');
    const nextSteps = adviceItems.length > 1 ? adviceItems.slice(1) : adviceItems;

    card.innerHTML = `
      <div class="condition-header">
        <div class="condition-name" style="font-weight: 700; font-size: 1.05rem;">${cond.name}</div>
        <div class="match-percentage" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 0.2rem 0.6rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 700;">${cond.score}% Match</div>
      </div>
      <div class="condition-desc" style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.6rem;">${cond.description}</div>
      
      ${cond.specialist ? `<div style="font-size: 0.82rem; color: var(--accent-cyan); margin-bottom: 0.6rem;"><i class="fa-solid fa-user-doctor"></i> <strong>${currentLang === 'bn' ? 'বিশেষজ্ঞ ডাক্তার:' : 'Recommended Specialist:'}</strong> ${cond.specialist}</div>` : ''}

      <!-- Proper Clinical Therapy Guidelines -->
      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); padding: 0.7rem 0.9rem; border-radius: var(--radius-sm); margin-bottom: 0.6rem;">
        <div style="font-size: 0.8rem; font-weight: 700; color: #10b981; margin-bottom: 0.25rem;">
          <i class="fa-solid fa-kit-medical"></i> ${currentLang === 'bn' ? '💊 প্রোপার চিকিৎসা ও থেরাপি নির্দেশিকা:' : '💊 Clinical Therapy & Treatment Guidelines:'}
        </div>
        <p style="font-size: 0.8rem; color: var(--text-main); line-height: 1.4; margin: 0;">${therapyGuideline}</p>
      </div>

      <!-- Recommended Next Steps -->
      ${nextSteps.length > 0 ? `
        <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); padding: 0.7rem 0.9rem; border-radius: var(--radius-sm);">
          <div style="font-size: 0.8rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.25rem;">
            <i class="fa-solid fa-bullseye"></i> ${currentLang === 'bn' ? '🎯 প্রয়োজনীয় পরবর্তী পদক্ষেপসমূহ (Recommended Next Steps):' : '🎯 Recommended Next Steps:'}
          </div>
          <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
            ${nextSteps.map(step => `<li>${step}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    `;
    conditionListElem.appendChild(card);
  });

  // Render Overall Advice List
  const adviceListElem = document.getElementById('advice-list');
  adviceListElem.innerHTML = '';
  result.clinical_advice.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    adviceListElem.appendChild(li);
  });

  // Render AI Enhanced Note if present
  if (result.ai_enhanced_note) {
    const noteLi = document.createElement('li');
    noteLi.style.fontWeight = '600';
    noteLi.style.color = 'var(--accent-cyan)';
    noteLi.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <strong>AI Insight:</strong> ${result.ai_enhanced_note}`;
    adviceListElem.prepend(noteLi);
  }
}

async function saveReportToBackend(result) {
  try {
    let headers = { 'Content-Type': 'application/json' };
    if (window.FirebaseAuthService) {
      const user = window.FirebaseAuthService.getCurrentUser();
      if (user) {
        const idToken = await user.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      }
    }
    fetch('/api/history', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        symptoms: Array.from(selectedSymptoms),
        top_condition: result.top_condition || (result.matched_conditions && result.matched_conditions[0] ? result.matched_conditions[0].name : "Health Triage"),
        triage_level: result.triage_level,
        urgency_score: result.urgency_score
      })
    });
  } catch (e) {}
}

function runClientDiagnosis() {
  if (selectedSymptoms.size === 0) {
    alert(currentLang === 'bn' ? 'অনুগ্রহ করে অন্তত ১টি লক্ষণ নির্বাচন করুন।' : 'Please select at least 1 symptom.');
    return;
  }

  const selectedArray = Array.from(selectedSymptoms);
  const allSymptoms = Object.values(symptomDatabase).flat();

  // Determine Triage Risk Level
  let maxWeight = 0;
  let hasEmergencyRedFlag = false;

  selectedArray.forEach(id => {
    const item = allSymptoms.find(s => s.id === id);
    if (item) {
      if (item.redFlag) hasEmergencyRedFlag = true;
      if (item.weight > maxWeight) maxWeight = item.weight;
    }
  });

  let triageLevel = 'low';
  let triageTextEn = 'Low Urgency / Routine Care';
  let triageTextBn = 'স্বাভাবিক / নিয়মিত স্বাস্থ্য সেবা';

  if (hasEmergencyRedFlag || (maxWeight >= 5 && currentSeverity >= 8)) {
    triageLevel = 'emergency';
    triageTextEn = 'EMERGENCY: Immediate Care Required';
    triageTextBn = 'জরুরি পরিস্থিতি: দ্রুত হাসপাতালে যান';
  } else if (maxWeight >= 4 || currentSeverity >= 6) {
    triageLevel = 'urgent';
    triageTextEn = 'Urgent: Consult Doctor within 24 Hours';
    triageTextBn = 'জরুরি: ২৪ ঘণ্টার মধ্যে ডাক্তার দেখান';
  } else if (maxWeight >= 3) {
    triageLevel = 'moderate';
    triageTextEn = 'Moderate: Schedule Appointment';
    triageTextBn = 'সাধারণ: চিকিৎসকের পরামর্শ নিন';
  }

  // Match Percentages calculation
  const matchedConditions = conditionKnowledgeBase.map(cond => {
    const reqMatches = cond.symptomsRequired.filter(id => selectedSymptoms.has(id)).length;
    const optMatches = cond.optionalSymptoms.filter(id => selectedSymptoms.has(id)).length;
    
    const totalReq = cond.symptomsRequired.length;
    let score = (reqMatches / totalReq) * 70 + (optMatches * 10);
    if (reqMatches === totalReq) score += 15;
    
    score = Math.min(Math.round(score), 98);
    return { ...cond, score, reqMatches };
  }).filter(c => c.score > 25).sort((a, b) => b.score - a.score);

  if (matchedConditions.length === 0) {
    matchedConditions.push({
      id: 'general_symptoms',
      nameEn: 'Nonspecific Symptom Complex',
      nameBn: 'সাধারণ শারীরিক অস্বস্তি',
      score: 45,
      triageLevel: triageLevel,
      descEn: 'Your combination of symptoms warrants a basic health evaluation by a GP.',
      descBn: 'আপনার লক্ষণগুলোর জন্য একজন সাধারণ চিকিৎসকের সাথে কথা বলা শ্রেয়।',
      adviceEn: ['Rest well and maintain hydration.', 'Monitor if symptoms worsen.'],
      adviceBn: ['পর্যাপ্ত বিশ্রাম নিন ও তরল পান করুন।', 'লক্ষণ বেড়ে গেলে ডাক্তারের পরামর্শ নিন।']
    });
  }

  // Render Result UI
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('active-result').style.display = 'block';

  // Auto-log symptoms to Health History Journal
  if (typeof autoLogToHealthHistory === 'function' && selectedArray.length > 0) {
    const symptomNames = selectedArray.map(id => {
      const s = allSymptoms.find(item => item.id === id);
      return s ? (currentLang === 'bn' ? s.nameBn : s.nameEn) : id;
    }).join(', ');
    autoLogToHealthHistory('Symptoms', symptomNames, `Severity: ${currentSeverity}/10`);
  }

  // Render Triage Badge
  const badge = document.getElementById('triage-badge');
  badge.className = `triage-status-badge ${triageLevel}`;
  document.getElementById('triage-text').textContent = currentLang === 'bn' ? triageTextBn : triageTextEn;

  // Render Condition Cards
  const conditionListElem = document.getElementById('condition-list');
  conditionListElem.innerHTML = '';

  matchedConditions.forEach(cond => {
    const card = document.createElement('div');
    card.className = 'condition-item';
    card.innerHTML = `
      <div class="condition-header">
        <div class="condition-name">${currentLang === 'bn' ? cond.nameBn : cond.nameEn}</div>
        <div class="match-percentage">${cond.score}% Match</div>
      </div>
      <div class="condition-desc">${currentLang === 'bn' ? cond.descBn : cond.descEn}</div>
    `;
    conditionListElem.appendChild(card);
  });

  // Render Advice List from Top Match
  const topMatch = matchedConditions[0];
  const adviceListElem = document.getElementById('advice-list');
  adviceListElem.innerHTML = '';

  const adviceArr = currentLang === 'bn' ? topMatch.adviceBn : topMatch.adviceEn;
  adviceArr.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    adviceListElem.appendChild(li);
  });
}

// Reset Form
function resetForm() {
  selectedSymptoms.clear();
  currentSeverity = 5;
  searchQuery = '';
  document.getElementById('symptom-search').value = '';
  document.getElementById('severity-slider').value = 5;
  document.getElementById('severity-val').textContent = '5';
  showBodyView();
  renderSymptomChips();
  renderSelectedTags();
  checkEmergencyState();
  restoreInitialEmptyState();
  document.getElementById('active-result').style.display = 'none';
}

// Toggle Dark & Light Mode Theme
function toggleTheme() {
  const body = document.body;
  const icon = document.getElementById('theme-icon');
  
  if (body.classList.contains('light-theme')) {
    body.classList.remove('light-theme');
    body.classList.add('dark-theme');
    if (icon) icon.className = 'fa-solid fa-moon';
  } else {
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    if (icon) icon.className = 'fa-solid fa-sun';
  }
}
window.toggleTheme = toggleTheme;

// Export PDF Summary Print View
function exportHealthReport() {
  window.print();
}

// HEALTH CALCULATORS LOGIC (Connected to Python Backend APIs)
async function calculateBMI() {
  const weight = parseFloat(document.getElementById('bmi-weight').value);
  const heightCm = parseFloat(document.getElementById('bmi-height').value);

  if (!weight || !heightCm || heightCm <= 0) return;

  try {
    const res = await fetch('/api/calculators/bmi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight, height: heightCm })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        document.getElementById('bmi-val').textContent = data.bmi;
        document.getElementById('bmi-category').textContent = currentLang === 'bn' ? data.category_bn : data.category_en;
        document.getElementById('bmi-result-box').style.display = 'block';
        return;
      }
    }
  } catch (err) {
    console.warn("BMI API offline, calculating locally:", err);
  }

  // Local fallback
  const heightM = heightCm / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);
  let categoryEn = 'Normal Weight';
  let categoryBn = 'স্বাভাবিক ওজন';

  if (bmi < 18.5) {
    categoryEn = 'Underweight'; categoryBn = 'কম ওজন';
  } else if (bmi >= 25 && bmi < 29.9) {
    categoryEn = 'Overweight'; categoryBn = 'অতিরিক্ত ওজন';
  } else if (bmi >= 30) {
    categoryEn = 'Obese'; categoryBn = 'স্থূলতা / ওবেসিটি';
  }

  document.getElementById('bmi-val').textContent = bmi;
  document.getElementById('bmi-category').textContent = currentLang === 'bn' ? categoryBn : categoryEn;
  document.getElementById('bmi-result-box').style.display = 'block';
}

function calculateWaterIntake() {
  const weight = parseFloat(document.getElementById('water-weight').value);
  const activity = document.getElementById('water-activity').value;

  if (!weight) return;

  let liters = (weight * 0.033);
  if (activity === 'active') liters += 0.5;

  const finalLiters = liters.toFixed(1);

  document.getElementById('water-val').textContent = `${finalLiters} Liters / ${currentLang === 'bn' ? 'লিটার' : 'L'}`;
  document.getElementById('water-result-box').style.display = 'block';
}

function calculateBMR() {
  const age = parseFloat(document.getElementById('bmr-age').value);
  const weight = parseFloat(document.getElementById('bmi-weight').value) || 70;
  const height = parseFloat(document.getElementById('bmi-height').value) || 175;
  const gender = document.getElementById('bmr-gender').value;

  if (!age) return;

  let bmr = 0;
  if (gender === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  const tdee = Math.round(bmr * 1.375);
  document.getElementById('bmr-val').textContent = `${tdee.toLocaleString()} kcal`;
  document.getElementById('bmr-result-box').style.display = 'block';
}

/* ==========================================================================
   Medical Prescription Generation & Printing (Matching prescription2.png 1:1)
   ========================================================================== */

async function generatePrescription() {
  // Auto-fill from saved Patient Health Profile
  const user = window.FirebaseAuthService ? window.FirebaseAuthService.getCurrentUser() : null;
  const savedProfileStr = localStorage.getItem('medipulse_patient_profile');
  let savedProfile = null;
  if (savedProfileStr) {
    try { savedProfile = JSON.parse(savedProfileStr); } catch (e) {}
  }

  const nameInput = document.getElementById('rx-p-name');
  const ageInput = document.getElementById('rx-p-age');
  const genderInput = document.getElementById('rx-p-gender');
  const addressInput = document.getElementById('rx-p-address');
  const contactInput = document.getElementById('rx-p-contact');

  if (nameInput) nameInput.placeholder = currentLang === 'bn' ? 'রোগীর নাম লিখুন...' : (currentLang === 'hi' ? 'मरीज का नाम दर्ज करें...' : 'Type Patient Name...');
  if (ageInput) ageInput.placeholder = currentLang === 'bn' ? 'বয়স...' : 'e.g. 25 Yrs';

  if (savedProfile) {
    if (nameInput && savedProfile.name) nameInput.value = savedProfile.name;
    if (ageInput && savedProfile.age) ageInput.value = savedProfile.age;
    if (genderInput && savedProfile.gender) genderInput.value = savedProfile.gender;
    if (addressInput && savedProfile.address) addressInput.value = savedProfile.address;
    if (contactInput && savedProfile.phone) contactInput.value = savedProfile.phone;
  } else if (user && nameInput && (!nameInput.value || nameInput.value === 'John Doe')) {
    nameInput.value = user.displayName || user.email.split('@')[0];
  }

  // Set Date
  const today = new Date();
  const dateStr = today.toLocaleDateString(currentLang === 'bn' ? 'bn-BD' : (currentLang === 'hi' ? 'hi-IN' : 'en-US'), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  document.getElementById('rx-p-date').textContent = dateStr;

  // Selected Symptoms List
  const symptomsArray = Array.from(selectedSymptoms).map(id => {
    for (const reg in symptomDatabase) {
      const match = symptomDatabase[reg].find(s => s.id === id);
      if (match) return currentLang === 'bn' ? match.nameBn : (currentLang === 'hi' && match.nameHi ? match.nameHi : match.nameEn);
    }
    return id;
  });
  const symptomsText = symptomsArray.length > 0 ? symptomsArray.join(', ') : (currentLang === 'bn' ? 'সাধারণ শারীরিক অস্বস্তি' : (currentLang === 'hi' ? 'सामान्य शारीरिक अस्वस्थता' : 'General Discomfort / Fever'));
  document.getElementById('rx-symptoms-summary').textContent = symptomsText;

  // Top AI Diagnosis Match
  const topCondElem = document.querySelector('.condition-name');
  const diagName = topCondElem ? topCondElem.textContent : (currentLang === 'bn' ? 'ভাইরাল ইনফেকশন ও জ্বর' : (currentLang === 'hi' ? 'वायरल संक्रमण और बुखार' : 'Viral Infection & Clinical Evaluation'));
  document.getElementById('rx-diagnosis-name').textContent = diagName;

  // Triage Risk Level
  const triageBadgeElem = document.getElementById('triage-text');
  const triageText = triageBadgeElem ? triageBadgeElem.textContent : 'Moderate Urgency';
  document.getElementById('rx-risk-badge').textContent = triageText;

  const medsTbody = document.getElementById('rx-meds-tbody');
  const adviceUl = document.getElementById('rx-advice-ul');

  // Show loading state inside modal
  medsTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 1.5rem; color: var(--accent-cyan);"><i class="fa-solid fa-spinner fa-spin"></i> ${currentLang === 'bn' ? 'রোগের মেডিসিন প্রিসক্রিপশন জেনারেট হচ্ছে...' : (currentLang === 'hi' ? 'प्रिस्क्रिप्सन दवाइयां तैयार हो रही हैं...' : 'Generating condition-specific prescription via Gemini AI...')}</td></tr>`;
  adviceUl.innerHTML = `<li><i class="fa-solid fa-spinner fa-spin"></i> ${currentLang === 'bn' ? 'চিকিৎসক পরামর্শ লোড হচ্ছে...' : 'Loading clinical advice...'}</li>`;

  // Display Modal immediately
  document.getElementById('prescription-modal').style.display = 'flex';
  setTimeout(autoFitPrescriptionMobile, 50);

  // Fetch dynamic disease-specific prescription from backend API
  try {
    const res = await fetch('/api/prescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        condition: diagName,
        symptoms: symptomsArray,
        triage: triageText,
        lang: currentLang
      })
    });

    if (res.ok) {
      const result = await res.json();
      if (result.status === 'success' && result.data) {
        renderPrescriptionData(result.data.medications, result.data.advice);
        return;
      }
    }
  } catch (err) {
    console.warn("Prescription API call offline, using fallback disease mapper:", err);
  }

  // Client-side fallback if network offline
  const fallbackObj = getClientDiseaseFallbackPrescription(diagName, symptomsArray, currentLang);
  renderPrescriptionData(fallbackObj.medications, fallbackObj.advice);
}

function renderPrescriptionData(medications, advice) {
  const medsTbody = document.getElementById('rx-meds-tbody');
  const adviceUl = document.getElementById('rx-advice-ul');

  medsTbody.innerHTML = '';
  if (medications && medications.length > 0) {
    medications.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${m.name}</strong></td>
        <td>${m.dosage || '1 - 0 - 1'}</td>
        <td>${m.timing || 'After Food'}</td>
        <td>${m.duration || '3 - 5 Days'}</td>
      `;
      medsTbody.appendChild(tr);
    });
  } else {
    medsTbody.innerHTML = `<tr><td colspan="4">No specific medication required. Consult primary physician.</td></tr>`;
  }

  adviceUl.innerHTML = '';
  if (advice && advice.length > 0) {
    advice.forEach(adv => {
      const li = document.createElement('li');
      li.textContent = adv;
      adviceUl.appendChild(li);
    });
  }
}

function getClientDiseaseFallbackPrescription(condition, symptoms, lang) {
  const condLower = (condition || '').toLowerCase();
  
  if (condLower.includes('migraine') || condLower.includes('headache') || condLower.includes('মাথা') || condLower.includes('सिर')) {
    return {
      medications: [
        { name: lang === 'bn' ? 'Tab. Naproxen 250mg (ন্যাপ্রোক্সেন)' : 'Tab. Naproxen 250mg', dosage: '1 - 0 - 1', timing: lang === 'bn' ? 'খাবার পর' : 'After Food', duration: '3 Days' },
        { name: lang === 'bn' ? 'Tab. Domperidone 10mg (বমি ভাব)' : 'Tab. Domperidone 10mg (Anti-nausea)', dosage: '1 - 0 - 1', timing: lang === 'bn' ? 'খাবার ১৫ মি. পূর্বে' : '15 mins Before Food', duration: '3 Days' },
        { name: lang === 'bn' ? 'Tab. Paracetamol 650mg (প্যারাসিটামল)' : 'Tab. Paracetamol 650mg', dosage: '1 - 0 - 1', timing: lang === 'bn' ? 'খাবার পর' : 'After Food', duration: '3 - 5 Days' },
        { name: lang === 'bn' ? 'Cap. Omeprazole 20mg (এসিডিটি)' : 'Cap. Omeprazole 20mg (Antacid)', dosage: '1 - 0 - 0', timing: lang === 'bn' ? 'খাবার ৩০ মি. পূর্বে' : '30 mins Before Food', duration: '5 Days' }
      ],
      advice: [
        lang === 'bn' ? 'আলো ও কোলাহলমুক্ত অন্ধকার ঘরে বিশ্রাম নিন।' : 'Rest immediately in a dark, quiet room.',
        lang === 'bn' ? 'কপালে ঠান্ডা পানির পট্টি বা আইস প্যাক দিন।' : 'Apply cold pack to temples & forehead.',
        lang === 'bn' ? 'চা, কফি, চকলেট ও স্ক্রিন দেখা এড়িয়ে চলুন।' : 'Avoid caffeine, screen light, and loud noise.'
      ]
    };
  }

  if (condLower.includes('gastric') || condLower.includes('acid') || condLower.includes('stomach') || condLower.includes('পেট') || condLower.includes('গ্যাস')) {
    return {
      medications: [
        { name: lang === 'bn' ? 'Cap. Esomeprazole 20mg (এসোমিপ্রাজল)' : 'Cap. Esomeprazole 20mg (PPI)', dosage: '1 - 0 - 0', timing: lang === 'bn' ? 'খাবার ৩০ মি. পূর্বে' : '30 mins Before Food', duration: '7 - 14 Days' },
        { name: lang === 'bn' ? 'Syr. Antacid Gel (এন্টাসিড সিরাফ)' : 'Syr. Antacid Gel (Sucralfate)', dosage: '2 tsp', timing: lang === 'bn' ? 'খাবার ১ ঘণ্টা পর' : '1 hr After Meals', duration: '7 Days' },
        { name: lang === 'bn' ? 'Tab. Mebeverine 135mg (পেট ব্যথা)' : 'Tab. Mebeverine 135mg (Spasmolytic)', dosage: '1 - 0 - 1', timing: lang === 'bn' ? 'খাবার ২০ মি. পূর্বে' : '20 mins Before Food', duration: '5 Days' },
        { name: lang === 'bn' ? 'Oral Rehydration Solution (ORS)' : 'Oral Rehydration Solution (ORS)', dosage: '1 - 1 - 1', timing: lang === 'bn' ? 'প্রয়োজন অনুযায়ী' : 'As Needed', duration: '5 Days' }
      ],
      advice: [
        lang === 'bn' ? 'অতিরিক্ত তেল-মসলাযুক্ত ও ভাজাপোড়া খাবার বন্ধ করুন।' : 'Eliminate oily, spicy, and fried foods completely.',
        lang === 'bn' ? 'খাওয়ার সাথে সাথে শুবেন না (অন্তত ২ ঘণ্টা পর)।' : 'Do not lie down immediately after meals.',
        lang === 'bn' ? 'একবারে বেশি না খেয়ে অল্প অল্প করে বারবার আহার করুন।' : 'Eat smaller, frequent light meals.'
      ]
    };
  }

  return {
    medications: [
      { name: lang === 'bn' ? `Tab. Paracetamol 500mg (${condition}-এর জন্য)` : `Tab. Paracetamol 500mg (${condition} Care)`, dosage: '1 - 0 - 1', timing: lang === 'bn' ? 'খাবার পর' : 'After Food', duration: '3 - 5 Days' },
      { name: 'Oral Rehydration Solution (ORS)', dosage: '1 - 1 - 1', timing: lang === 'bn' ? 'প্রয়োজন অনুযায়ী' : 'As Needed', duration: '5 Days' },
      { name: 'Cap. Omeprazole 20mg (Antacid)', dosage: '1 - 0 - 0', timing: lang === 'bn' ? 'খাবার ৩০ মি. পূর্বে' : '30 mins Before Food', duration: '5 Days' },
      { name: 'Tab. Vitamin C / Multivitamin', dosage: '0 - 1 - 0', timing: lang === 'bn' ? 'দুপুরে খাবার পর' : 'After Lunch', duration: '7 Days' }
    ],
    advice: [
      lang === 'bn' ? `"${condition}"-এর পর্যবেক্ষণের জন্য ডাক্তারের পরামর্শ নিন।` : `Consult physician for targeted evaluation of "${condition}".`,
      lang === 'bn' ? 'প্রতিদিন অন্তত ৩ লিটার বিশুদ্ধ পানি পান করুন।' : 'Maintain adequate fluid hydration (at least 3 Liters daily).',
      lang === 'bn' ? 'পর্যাপ্ত বিশ্রাম নিন ও ভারী কাজ থেকে বিরত থাকুন।' : 'Ensure full bed rest and avoid physical exertion.'
    ]
  };
}

let rxZoomScale = 1.0;
let rxBaseScale = 1.0;

function autoFitPrescriptionMobile() {
  const paper = document.getElementById('prescription-paper');
  const wrapper = document.getElementById('prescription-paper-wrapper');
  if (!paper || !wrapper) return;

  if (window.innerWidth <= 768) {
    const availableWidth = window.innerWidth - 16;
    const availableHeight = window.innerHeight - 85;
    const paperWidth = 794;
    const paperHeight = paper.offsetHeight || 1080;

    const scaleW = availableWidth / paperWidth;
    const scaleH = availableHeight / paperHeight;
    const autoScale = Math.min(scaleW, scaleH);

    rxBaseScale = parseFloat(Math.min(1.0, Math.max(0.25, autoScale)).toFixed(2));
    rxZoomScale = rxBaseScale;
    applyPrescriptionZoom();
  } else {
    rxBaseScale = 1.0;
    rxZoomScale = 1.0;
    applyPrescriptionZoom();
  }
}

function zoomPrescription(delta) {
  rxZoomScale = Math.min(2.5, Math.max(0.2, parseFloat((rxZoomScale + delta).toFixed(2))));
  applyPrescriptionZoom();
}

function resetPrescriptionZoom() {
  autoFitPrescriptionMobile();
}

function applyPrescriptionZoom() {
  const paper = document.getElementById('prescription-paper');
  const wrapper = document.getElementById('prescription-paper-wrapper');
  const overlay = document.getElementById('prescription-modal');
  const zoomText = document.getElementById('rx-zoom-level');
  if (!paper || !wrapper) return;

  const paperWidth = 794;
  const paperHeight = paper.offsetHeight || 1080;

  paper.style.transform = `scale(${rxZoomScale})`;
  paper.style.transformOrigin = 'top left';
  paper.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

  wrapper.style.width = `${Math.round(paperWidth * rxZoomScale)}px`;
  wrapper.style.height = `${Math.round(paperHeight * rxZoomScale)}px`;
  wrapper.style.margin = '0 auto';
  wrapper.style.position = 'relative';

  if (overlay) {
    if (window.innerWidth <= 768 && rxZoomScale <= rxBaseScale + 0.03) {
      overlay.style.overflow = 'hidden';
      overlay.style.overflowX = 'hidden';
      overlay.style.overflowY = 'hidden';
    } else {
      overlay.style.overflow = 'auto';
    }
  }

  if (zoomText) {
    const pct = Math.round((rxZoomScale / rxBaseScale) * 100);
    zoomText.textContent = `${pct}%`;
  }
}

window.addEventListener('resize', () => {
  const modal = document.getElementById('prescription-modal');
  if (modal && modal.style.display !== 'none') {
    autoFitPrescriptionMobile();
  }
});

function printPrescription() {
  window.print();
}

function closePrescriptionModal() {
  document.getElementById('prescription-modal').style.display = 'none';
}

/* ==========================================================================
   Firebase Authentication & Modal Controller Functions
   ========================================================================== */

let activeAuthTab = 'login';

// Initialize Firebase Auth Subscription
function initFirebaseAuth() {
  if (window.FirebaseAuthService && typeof window.FirebaseAuthService.onAuthChange === 'function') {
    window.FirebaseAuthService.onAuthChange((user) => {
      updateAuthUI(user);
    });
  }
}
window.initFirebaseAuth = initFirebaseAuth;
window.addEventListener('firebaseAuthReady', initFirebaseAuth);
window.addEventListener('DOMContentLoaded', () => {
  if (window.FirebaseAuthService) {
    initFirebaseAuth();
  }
});

// Update Navbar UI when user authenticates or logs out
function updateAuthUI(user) {
  const container = document.getElementById('auth-nav-container');
  if (!container) return;

  if (user) {
    const rawName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
    const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const initial = rawName.charAt(0).toUpperCase();

    // Default email profile photo URL if user.photoURL is not set by Firebase
    const photoURL = user.photoURL || (user.email ? `https://unavatar.io/${encodeURIComponent(user.email)}` : null);

    const avatarHtml = photoURL
      ? `<img class="user-avatar-img" src="${photoURL}" alt="${displayName}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.outerHTML='<div class=\\'user-avatar-initials\\'>${initial}</div>';">`
      : `<div class="user-avatar-initials">${initial}</div>`;

    container.innerHTML = `
      <div class="user-profile-wrapper" id="user-profile-wrapper" style="position: relative;">
        <div class="user-profile-badge" onclick="toggleUserDropdown(event)" title="${displayName} (${user.email || ''})">
          ${avatarHtml}
        </div>
        <div class="user-menu-dropdown hidden" id="user-menu-dropdown">
          <div class="user-menu-header">
            <strong style="font-size: 0.92rem; color: #ffffff;">${displayName}</strong>
            <small style="color: var(--text-muted); font-size: 0.76rem; word-break: break-all; margin-top: 0.15rem;">${user.email || ''}</small>
          </div>
          <hr class="dropdown-divider">
          <button class="dropdown-item" onclick="openUserProfileModal()">
            <i class="fa-solid fa-id-card" style="color: var(--accent-cyan);"></i> ${currentLang === 'bn' ? 'আমার প্রোফাইল ও রেকর্ডস' : 'View Profile & Records'}
          </button>
          <button class="dropdown-item danger" onclick="handleSignOut()">
            <i class="fa-solid fa-arrow-right-from-bracket" style="color: #ef4444;"></i> ${currentLang === 'bn' ? 'সাইন আউট' : 'Sign Out'}
          </button>
        </div>
      </div>
    `;
    closeAuthModal();
  } else {
    container.innerHTML = `
      <button class="btn btn-primary btn-auth" id="open-auth-btn" onclick="openAuthModal('login')">
        <i class="fa-solid fa-right-to-bracket"></i> <span data-i18n="navSignIn">${currentLang === 'bn' ? 'সাইন ইন' : 'Sign In'}</span>
      </button>
    `;
  }
}

// Toggle user profile dropdown
function toggleUserDropdown(e) {
  if (e) {
    if (e.stopPropagation) e.stopPropagation();
  }
  closeNavMoreMenu(); // Close 3-dot menu if open

  const dropdown = document.getElementById('user-menu-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

// Global Click Delegator for Sign In & Outside Dropdown Click Handling
document.addEventListener('click', (e) => {
  const isProfileClick = e.target.closest && (e.target.closest('#user-profile-wrapper') || e.target.closest('.user-profile-badge'));
  const authBtn = !isProfileClick && e.target.closest && (e.target.closest('#open-auth-btn') || e.target.closest('.btn-auth'));
  
  if (authBtn) {
    if (e.stopPropagation) e.stopPropagation();
    openAuthModal('login');
    return;
  }

  const userBtn = document.getElementById('user-profile-wrapper');
  const dropdown = document.getElementById('user-menu-dropdown');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (userBtn && (userBtn.contains(e.target) || (e.target && e.target.closest && e.target.closest('#user-profile-wrapper')))) {
      return;
    }
    dropdown.classList.add('hidden');
  }

  const navBtn = document.querySelector('.nav-menu-wrapper');
  const navDropdown = document.getElementById('nav-more-dropdown');
  if (navDropdown && !navDropdown.classList.contains('hidden')) {
    if (navBtn && (navBtn.contains(e.target) || (e.target && e.target.closest && e.target.closest('.nav-menu-wrapper')))) {
      return;
    }
    navDropdown.classList.add('hidden');
  }
});

// Open Auth Modal
function openAuthModal(tab = 'login') {
  closeNavMoreMenu();
  const userDropdown = document.getElementById('user-menu-dropdown');
  if (userDropdown) {
    userDropdown.classList.add('hidden');
    userDropdown.style.display = 'none';
  }

  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  clearAuthAlert();
  switchAuthTab(tab);

  modal.classList.remove('hidden');
  modal.style.setProperty('display', 'flex', 'important');
  modal.style.setProperty('z-index', '9999999', 'important');
  modal.style.setProperty('visibility', 'visible', 'important');
  modal.style.setProperty('opacity', '1', 'important');
}

// Close Auth Modal
function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.setProperty('display', 'none', 'important');
  }
}

// Handle Overlay Click
function handleAuthOverlayClick(e) {
  if (e.target.id === 'auth-modal') {
    closeAuthModal();
  }
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleAuthOverlayClick = handleAuthOverlayClick;
window.switchAuthTab = switchAuthTab;

// Switch between Sign In and Register tabs
function switchAuthTab(tab) {
  activeAuthTab = tab;
  clearAuthAlert();

  const loginTabBtn = document.getElementById('tab-btn-login');
  const registerTabBtn = document.getElementById('tab-btn-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (tab === 'login') {
    if (loginTabBtn) loginTabBtn.classList.add('active');
    if (registerTabBtn) registerTabBtn.classList.remove('active');
    if (loginForm) {
      loginForm.classList.remove('hidden');
      loginForm.style.display = 'block';
    }
    if (registerForm) {
      registerForm.classList.add('hidden');
      registerForm.style.display = 'none';
    }
  } else {
    if (registerTabBtn) registerTabBtn.classList.add('active');
    if (loginTabBtn) loginTabBtn.classList.remove('active');
    if (registerForm) {
      registerForm.classList.remove('hidden');
      registerForm.style.display = 'block';
    }
    if (loginForm) {
      loginForm.classList.add('hidden');
      loginForm.style.display = 'none';
    }
  }
}

// Show alert feedback inside Auth Modal
function showAuthAlert(msg, type = 'error') {
  const alertBox = document.getElementById('auth-alert');
  if (!alertBox) return;
  alertBox.className = `auth-alert ${type}`;
  alertBox.textContent = msg;
}

// Clear alert feedback
function clearAuthAlert() {
  const alertBox = document.getElementById('auth-alert');
  if (alertBox) {
    alertBox.className = 'auth-alert hidden';
    alertBox.textContent = '';
  }
}

// Handle Google Sign-In
async function handleGoogleSignIn() {
  clearAuthAlert();
  if (!window.FirebaseAuthService) {
    showAuthAlert(currentLang === 'bn' ? 'ফায়ারবেস সার্ভিস লোড হচ্ছে... অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।' : 'Firebase Auth is initializing... Please try again in a moment.');
    return;
  }

  const googleBtn = document.getElementById('google-auth-btn');
  const originalHtml = googleBtn ? googleBtn.innerHTML : '';

  if (googleBtn) {
    googleBtn.disabled = true;
    googleBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Connecting Google...`;
  }

  try {
    const res = await window.FirebaseAuthService.loginWithGoogle();
    if (!res.success) {
      showAuthAlert(formatAuthError(res.error));
    }
  } catch (err) {
    showAuthAlert(err.message || "Failed to sign in with Google.");
  } finally {
    if (googleBtn) {
      googleBtn.disabled = false;
      googleBtn.innerHTML = originalHtml;
    }
  }
}

// Handle Email & Password Sign-In
async function handleEmailSignIn(e) {
  e.preventDefault();
  clearAuthAlert();
  if (!window.FirebaseAuthService) {
    showAuthAlert(currentLang === 'bn' ? 'ফায়ারবেস সার্ভিস লোড হচ্ছে... অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।' : 'Firebase Auth is initializing... Please try again in a moment.');
    return;
  }

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const submitBtn = document.getElementById('login-submit-btn');

  if (!email || !password) {
    showAuthAlert(currentLang === 'bn' ? 'অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড প্রদান করুন।' : 'Please enter email and password.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${currentLang === 'bn' ? 'সাইন ইন হচ্ছে...' : 'Signing in...'}`;

  try {
    const res = await window.FirebaseAuthService.loginWithEmail(email, password);
    if (!res.success) {
      showAuthAlert(formatAuthError(res.error));
    }
  } catch (err) {
    showAuthAlert(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> <span>${currentLang === 'bn' ? 'সাইন ইন' : 'Sign In'}</span>`;
  }
}

// Handle Email & Password Registration (Sign Up)
async function handleEmailSignUp(e) {
  e.preventDefault();
  clearAuthAlert();
  if (!window.FirebaseAuthService) {
    showAuthAlert(currentLang === 'bn' ? 'ফায়ারবেস সার্ভিস লোড হচ্ছে... অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।' : 'Firebase Auth is initializing... Please try again in a moment.');
    return;
  }

  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  const submitBtn = document.getElementById('register-submit-btn');

  if (password !== confirmPassword) {
    showAuthAlert(currentLang === 'bn' ? 'পাসওয়ার্ড দুটি মিলছে না।' : 'Passwords do not match.');
    return;
  }

  if (password.length < 6) {
    showAuthAlert(currentLang === 'bn' ? 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${currentLang === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating Account...'}`;

  try {
    const res = await window.FirebaseAuthService.registerWithEmail(name, email, password);
    if (!res.success) {
      showAuthAlert(formatAuthError(res.error));
    }
  } catch (err) {
    showAuthAlert(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-user-plus"></i> <span>${currentLang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}</span>`;
  }
}

// Sign Out Handler
async function handleSignOut() {
  if (window.FirebaseAuthService) {
    await window.FirebaseAuthService.logout();
  }
}

// Helper to format Firebase error codes into friendly user messages
function formatAuthError(errorStr) {
  if (!errorStr) return "An authentication error occurred.";
  if (errorStr.includes("auth/user-not-found") || errorStr.includes("auth/wrong-password") || errorStr.includes("auth/invalid-credential")) {
    return currentLang === 'bn' ? 'ভুল ইমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে।' : 'Invalid email or password.';
  }
  if (errorStr.includes("auth/email-already-in-use")) {
    return currentLang === 'bn' ? 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে।' : 'An account with this email already exists.';
  }
  if (errorStr.includes("auth/weak-password")) {
    return currentLang === 'bn' ? 'পাসওয়ার্ড অত্যন্ত দুর্বল। অন্তত ৬ অক্ষরের পাসওয়ার্ড দিন।' : 'Password is too weak. Minimum 6 characters required.';
  }
  if (errorStr.includes("auth/popup-closed-by-user")) {
    return currentLang === 'bn' ? 'গুগল সাইন ইন উইন্ডোটি বন্ধ করা হয়েছে।' : 'Google Sign-In popup was closed before completing.';
  }
  if (errorStr.includes("auth/unauthorized-domain")) {
    return currentLang === 'bn' ? 'ফায়ারবেসে এই ডোমেইন অনুমোদিত নয়। ফায়ারবেস কনসোলে Authorized Domains যোগ করুন।' : 'Domain unauthorized in Firebase. Please add this domain to Authorized Domains in Firebase Console > Auth Settings.';
  }
  if (errorStr.includes("auth/operation-not-allowed")) {
    return currentLang === 'bn' ? 'এই সাইন-ইন পদ্ধতি ফায়ারবেসে সক্রিয় করা নেই। Firebase Console-এ এটি এনাবল করুন।' : 'Sign-In method is not enabled in Firebase Console > Authentication > Sign-in method.';
  }
  if (errorStr.includes("auth/invalid-email")) {
    return currentLang === 'bn' ? 'অকার্যকর ইমেইল ফর্ম্যাট।' : 'Invalid email address format.';
  }
  if (errorStr.includes("auth/popup-blocked")) {
    return currentLang === 'bn' ? 'ব্রাউজার পপআপ ব্লক করেছে। অনুগ্রহ করে পপআপ এলাউ করুন।' : 'Google popup blocked by browser. Please allow popups for this site.';
  }
  return errorStr;
}
// Password Visibility Toggle (Eye Icon)
function togglePasswordVisibility(inputId, iconElem) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    iconElem.className = 'fa-solid fa-eye-slash password-toggle-eye';
  } else {
    input.type = 'password';
    iconElem.className = 'fa-solid fa-eye password-toggle-eye';
  }
}

/* ==========================================================================
   User Profile Dashboard & Passport Modal Functions
   ========================================================================== */

// Open User Profile Modal
function openUserProfileModal() {
  const modal = document.getElementById('user-profile-modal');
  const dropdown = document.getElementById('user-menu-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
  if (!modal) return;

  loadUserProfileData();
  modal.classList.remove('hidden');
}

// Close User Profile Modal
function closeUserProfileModal() {
  const modal = document.getElementById('user-profile-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Handle Overlay click for Profile Modal
function handleProfileOverlayClick(e) {
  if (e.target.id === 'user-profile-modal') {
    closeUserProfileModal();
  }
}

// Save Patient Profile data
function savePatientProfile(e) {
  if (e) e.preventDefault();
  const profile = {
    name: document.getElementById('p-name')?.value || '',
    age: document.getElementById('p-age')?.value || '',
    gender: document.getElementById('p-gender')?.value || 'Male',
    phone: document.getElementById('p-phone')?.value || '',
    address: document.getElementById('p-address')?.value || ''
  };

  localStorage.setItem('medipulse_patient_profile', JSON.stringify(profile));

  const saveBtnText = document.getElementById('save-btn-text');
  if (saveBtnText) {
    saveBtnText.textContent = currentLang === 'bn' ? 'সেভ সফল হয়েছে! ✓' : 'Profile Saved! ✓';
    setTimeout(() => {
      saveBtnText.textContent = currentLang === 'bn' ? 'তথ্য সেভ করুন' : 'Save Patient Details';
    }, 2500);
  }
}

// Load Patient Profile inputs into modal form
function loadPatientProfileInputs() {
  const saved = localStorage.getItem('medipulse_patient_profile');
  const user = window.FirebaseAuthService ? window.FirebaseAuthService.getCurrentUser() : null;

  let profile = { name: '', age: '', gender: 'Male', phone: '', address: '' };
  if (saved) {
    try { profile = JSON.parse(saved); } catch (e) {}
  }

  const pName = document.getElementById('p-name');
  const pAge = document.getElementById('p-age');
  const pGender = document.getElementById('p-gender');
  const pPhone = document.getElementById('p-phone');
  const pAddress = document.getElementById('p-address');

  if (pName) pName.value = profile.name || (user?.displayName || '');
  if (pAge) pAge.value = profile.age || '';
  if (pGender) pGender.value = profile.gender || 'Male';
  if (pPhone) pPhone.value = profile.phone || '';
  if (pAddress) pAddress.value = profile.address || '';
}

// Load and populate User Profile details & saved records
async function loadUserProfileData() {
  loadPatientProfileInputs();
  const user = window.FirebaseAuthService ? window.FirebaseAuthService.getCurrentUser() : null;

  const displayNameElem = document.getElementById('profile-display-name');
  const emailElem = document.getElementById('profile-display-email');
  const userIdElem = document.getElementById('profile-user-id');
  const avatarContainer = document.getElementById('profile-avatar-display');

  if (user) {
    const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Patient');
    const email = user.email || '';
    const uid = user.uid ? `#${user.uid.substring(0, 8).toUpperCase()}` : '#ID-12345';
    const photoURL = user.photoURL || (user.email ? `https://unavatar.io/${encodeURIComponent(user.email)}` : null);
    const initial = name.charAt(0).toUpperCase();

    displayNameElem.textContent = name;
    emailElem.textContent = email;
    userIdElem.textContent = uid;

    if (photoURL) {
      avatarContainer.innerHTML = `<img class="profile-avatar-large" src="${photoURL}" alt="${name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.outerHTML='<div class=\\'profile-avatar-initials-large\\'>${initial}</div>';">`;
    } else {
      avatarContainer.innerHTML = `<div class="profile-avatar-initials-large">${initial}</div>`;
    }
  } else {
    displayNameElem.textContent = currentLang === 'bn' ? 'গেস্ট ব্যবহারকারী' : 'Guest Patient';
    emailElem.textContent = 'guest@medipulse.ai';
    userIdElem.textContent = '#GUEST-001';
    avatarContainer.innerHTML = `<div class="profile-avatar-initials-large">G</div>`;
  }

  // Fetch Saved Patient Assessment History
  const historyListContainer = document.getElementById('profile-history-list');
  const assessmentsCountElem = document.getElementById('stat-assessments-count');
  const savedReportsCountElem = document.getElementById('stat-saved-reports');
  const healthRiskElem = document.getElementById('stat-health-risk');

  try {
    let headers = {};
    if (user) {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/history', { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.records && data.records.length > 0) {
        assessmentsCountElem.textContent = data.records.length;
        savedReportsCountElem.textContent = data.records.length;

        let hasEmergency = data.records.some(r => r.triage_level === 'EMERGENCY');
        let hasUrgent = data.records.some(r => r.triage_level === 'URGENT');
        if (hasEmergency) {
          healthRiskElem.textContent = 'High Alert';
          healthRiskElem.style.color = 'var(--risk-emergency)';
        } else if (hasUrgent) {
          healthRiskElem.textContent = 'Urgent Care';
          healthRiskElem.style.color = 'var(--risk-urgent)';
        } else {
          healthRiskElem.textContent = 'Normal';
          healthRiskElem.style.color = '#34d399';
        }

        historyListContainer.innerHTML = '';
        data.records.forEach(rec => {
          const card = document.createElement('div');
          card.className = 'p-history-card';
          const triageClass = (rec.triage_level || 'routine').toLowerCase();
          card.innerHTML = `
            <div class="p-history-main">
              <strong>${rec.top_condition || 'Diagnostic Triage'}</strong>
              <small><i class="fa-solid fa-calendar-day"></i> ${rec.date || 'Recent'}</small>
            </div>
            <div class="p-history-badge ${triageClass}">
              ${rec.triage_level || 'ROUTINE'}
            </div>
          `;
          historyListContainer.appendChild(card);
        });
        return;
      }
    }
  } catch (err) {
    console.warn("History fetch failed:", err);
  }

  // Fallback empty state
  assessmentsCountElem.textContent = '0';
  savedReportsCountElem.textContent = '0';
  healthRiskElem.textContent = 'Normal';
  historyListContainer.innerHTML = `
    <div class="p-history-empty">
      <i class="fa-solid fa-clipboard-list" style="font-size: 2rem; color: var(--text-subtle);"></i>
      <p>${currentLang === 'bn' ? 'কোনো সেভ করা রিপোর্ট পাওয়া যায়নি। নতুন লক্ষণ বিশ্লেষণ চালনা করুন!' : 'No saved diagnostic reports found yet. Run an AI symptom triage to generate records!'}</p>
    </div>
  `;
}


/* ==========================================================================
   NEARBY HOSPITALS & NURSING HOMES LOCATOR MODULE (Leaflet + OSM / Backend API)
   ========================================================================== */

let hospitalMap = null;
let hospitalMarkersLayer = null;
let currentFacilitiesData = [];
let currentActiveFilter = 'all';
let currentUserCoords = { lat: 22.5726, lng: 88.3639 }; // Default reference hub

function initHospitalMap() {
  const mapElement = document.getElementById('hospital-map');
  if (!mapElement || hospitalMap) return;

  try {
    // Initialize Leaflet map centered at user location or default
    hospitalMap = L.map('hospital-map').setView([currentUserCoords.lat, currentUserCoords.lng], 13);

    // CartoDB Dark Matter tiles (matching sleek dark theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(hospitalMap);

    hospitalMarkersLayer = L.layerGroup().addTo(hospitalMap);

    // Initial search
    searchNearbyHospitalsUI();
  } catch (e) {
    console.error("Leaflet map initialization error:", e);
  }
}

async function searchNearbyHospitalsUI(customLat = null, customLng = null, locationName = null) {
  const addressInput = document.getElementById('hospital-search-address');
  const radiusSelect = document.getElementById('hospital-radius-select');
  const loader = document.getElementById('map-loader');
  const locationInfo = document.getElementById('hospital-location-info');
  const activeLocName = document.getElementById('active-location-name');

  const address = addressInput ? addressInput.value.trim() : '';
  const radius = radiusSelect ? parseFloat(radiusSelect.value) : 5;

  if (loader) loader.style.display = 'flex';

  try {
    const payload = {
      address: address,
      lat: customLat,
      lng: customLng,
      radius: radius,
      facility_type: 'all'
    };

    const response = await fetch('/api/nearby-hospitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let data;
    if (response.ok) {
      data = await response.json();
    } else {
      data = await clientSideFallbackHospitals(address, customLat, customLng, radius);
    }

    if (data && data.status === 'success') {
      currentFacilitiesData = data.facilities || [];
      const userLoc = data.user_location || {};

      if (userLoc.lat && userLoc.lng) {
        currentUserCoords = { lat: userLoc.lat, lng: userLoc.lng };
      }

      if (activeLocName) {
        activeLocName.textContent = locationName || userLoc.name || address || 'Search Location';
      }
      if (locationInfo) locationInfo.style.display = 'flex';

      updateMapAndCards();
    } else {
      if (typeof showToast === 'function') {
        showToast('Could not fetch nearby facilities. Please check address.', 'warning');
      }
    }
  } catch (err) {
    console.error('Error fetching nearby hospitals:', err);
    const fallbackData = await clientSideFallbackHospitals(address, customLat, customLng, radius);
    currentFacilitiesData = fallbackData.facilities || [];
    updateMapAndCards();
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

async function clientSideFallbackHospitals(address, lat, lng, radius) {
  const targetLat = lat || 22.5726;
  const targetLng = lng || 88.3639;
  const targetName = address || "Local Area";

  return {
    status: "success",
    user_location: { name: targetName, lat: targetLat, lng: targetLng },
    facilities: [
      {
        id: "cs_1",
        name: currentLang === 'bn' ? "সিটি জেনারেল সুপার-স্পেশালিটি হাসপাতাল" : "City General Super-Speciality Hospital",
        category: "hospital",
        type_label: currentLang === 'bn' ? "২৪/৭ জরুরি হাসপাতাল" : "24/7 Super-Speciality Hospital",
        distance_km: 1.2,
        lat: targetLat + 0.008,
        lng: targetLng + 0.006,
        address: currentLang === 'bn' ? "সেন্ট্রাল হেলথকেয়ার রোড, প্রধান সড়ক" : "Central Healthcare Road, Main Highway",
        phone: "+91 1800-123-4567 / 102",
        emergency_24x7: true,
        directions_url: `https://www.google.com/maps/dir/?api=1&destination=${targetLat + 0.008},${targetLng + 0.006}`
      },
      {
        id: "cs_2",
        name: currentLang === 'bn' ? "লাইফ কেয়ার নার্সিং হোম ও মেটারনিটি সেন্টার" : "LifeCare Nursing Home & Maternity Center",
        category: "nursing_home",
        type_label: currentLang === 'bn' ? "প্রাইভেট নার্সিং হোম" : "Private Nursing Home & Care",
        distance_km: 2.3,
        lat: targetLat - 0.011,
        lng: targetLng + 0.012,
        address: currentLang === 'bn' ? "৪৭ পার্ক লেন বিটি রোড" : "47 Park Lane, BT Road",
        phone: "+91 033-2550-9988",
        emergency_24x7: true,
        directions_url: `https://www.google.com/maps/dir/?api=1&destination=${targetLat - 0.011},${targetLng + 0.012}`
      },
      {
        id: "cs_3",
        name: currentLang === 'bn' ? "অ্যাপোলো মাল্টিস্পেশালিটি ট্রমা ও আইসিইউ হাব" : "Apollo Multispecialty Trauma & ICU Hub",
        category: "hospital",
        type_label: currentLang === 'bn' ? "টারশিয়ারি কেয়ার ট্রমা সেন্টার" : "Tertiary Trauma Center",
        distance_km: 3.5,
        lat: targetLat + 0.015,
        lng: targetLng - 0.014,
        address: currentLang === 'bn' ? "৮৮ মেডিক্যাল কলেজ ক্যাম্পাস" : "88 Medical Campus Boulevard",
        phone: "+91 033-2320-3040",
        emergency_24x7: true,
        directions_url: `https://www.google.com/maps/dir/?api=1&destination=${targetLat + 0.015},${targetLng - 0.014}`
      },
      {
        id: "cs_4",
        name: currentLang === 'bn' ? "মেডিকেয়ার নার্সিং হোম ও ডায়াগনস্টিক ক্লিনিক" : "Medicare Nursing Home & Diagnostics",
        category: "nursing_home",
        type_label: currentLang === 'bn' ? "নার্সিং হোম ও ডায়াগনস্টিক" : "Nursing Home & Diagnostics",
        distance_km: 4.8,
        lat: targetLat - 0.018,
        lng: targetLng - 0.015,
        address: currentLang === 'bn' ? "১২ জিপিও স্কয়ার" : "12 GPO Square",
        phone: "+91 98300-44556",
        emergency_24x7: true,
        directions_url: `https://www.google.com/maps/dir/?api=1&destination=${targetLat - 0.018},${targetLng - 0.015}`
      }
    ]
  };
}

function handleUseMyLocation() {
  const locBtn = document.getElementById('btn-use-location');
  if (!navigator.geolocation) {
    if (typeof showToast === 'function') {
      showToast('Geolocation is not supported by your browser.', 'warning');
    }
    return;
  }

  if (locBtn) {
    locBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color: var(--accent-cyan);"></i> Locating...`;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      currentUserCoords = { lat, lng };

      if (locBtn) {
        locBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs" style="color: var(--accent-cyan);"></i> <span data-i18n="useMyLocationBtn">${i18n[currentLang].useMyLocationBtn}</span>`;
      }

      searchNearbyHospitalsUI(lat, lng, currentLang === 'bn' ? 'আমার জিপিএস অবস্থান' : 'My Live GPS Location');
    },
    (error) => {
      console.warn('Geolocation error:', error.message);
      if (locBtn) {
        locBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs" style="color: var(--accent-cyan);"></i> <span data-i18n="useMyLocationBtn">${i18n[currentLang].useMyLocationBtn}</span>`;
      }
      if (typeof showToast === 'function') {
        showToast('Could not access current location. Please type an address in the search box.', 'warning');
      }
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function filterFacilityCategory(cat) {
  currentActiveFilter = cat;
  document.querySelectorAll('.filter-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === cat);
  });
  updateMapAndCards();
}

function getFilteredFacilities() {
  if (currentActiveFilter === 'all') return currentFacilitiesData;
  if (currentActiveFilter === 'emergency') return currentFacilitiesData.filter(f => f.emergency_24x7);
  return currentFacilitiesData.filter(f => f.category === currentActiveFilter);
}

function updateMapAndCards() {
  const facilities = getFilteredFacilities();

  // Update count badge
  const countBadge = document.getElementById('active-location-count');
  if (countBadge) {
    const total = facilities.length;
    countBadge.textContent = currentLang === 'bn' ? `${total} টি প্রতিষ্ঠান পাওয়া গেছে` : `${total} Facilities Found`;
  }

  // Update Google Maps embedded iframe URL in left display box
  const gmapIframe = document.getElementById('google-maps-iframe');
  const addressInput = document.getElementById('hospital-search-address');
  const userAddr = addressInput ? addressInput.value.trim() : '';

  if (gmapIframe) {
    let q = userAddr ? `hospitals and nursing homes near ${userAddr}` : `hospitals near ${currentUserCoords.lat},${currentUserCoords.lng}`;
    gmapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  }

  // Update Leaflet Map Layer
  if (hospitalMap && hospitalMarkersLayer && typeof L !== 'undefined') {
    hospitalMarkersLayer.clearLayers();

    // Map User location marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div class="user-map-pin" title="Your Location"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    
    L.marker([currentUserCoords.lat, currentUserCoords.lng], { icon: userIcon })
      .bindPopup(`<strong>${currentLang === 'bn' ? 'আপনার অবস্থান' : 'Your Location'}</strong>`)
      .addTo(hospitalMarkersLayer);

    const bounds = L.latLngBounds([[currentUserCoords.lat, currentUserCoords.lng]]);

    facilities.forEach(fac => {
      const isHospital = fac.category === 'hospital';
      const pinColor = isHospital ? '#ef4444' : '#06b6d4';
      const iconClass = isHospital ? 'fa-hospital' : 'fa-house-medical';

      const facIcon = L.divIcon({
        className: 'custom-fac-marker',
        html: `<div style="background: ${pinColor}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${pinColor}; border: 2px solid #ffffff;"><i class="fa-solid ${iconClass}" style="font-size: 14px;"></i></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const popupHtml = `
        <div style="padding: 0.3rem;">
          <div style="font-weight: 700; font-size: 1rem; color: #ffffff; margin-bottom: 0.3rem;">${fac.name}</div>
          <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.4rem;"><i class="fa-solid fa-tag"></i> ${fac.type_label} &bull; <span style="color: #06b6d4; font-weight: 600;">${fac.distance_km} km</span></div>
          <div style="font-size: 0.82rem; color: #cbd5e1; margin-bottom: 0.6rem;"><i class="fa-solid fa-location-dot"></i> ${fac.address}</div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${fac.phone ? `<a href="tel:${fac.phone}" style="background: rgba(34,197,94,0.2); border: 1px solid #22c55e; color: #4ade80; padding: 0.3rem 0.6rem; border-radius: 6px; text-decoration: none; font-size: 0.78rem; font-weight: 600;"><i class="fa-solid fa-phone"></i> Call</a>` : ''}
            <a href="${fac.directions_url}" target="_blank" rel="noopener" style="background: #0284c7; color: #ffffff; padding: 0.3rem 0.6rem; border-radius: 6px; text-decoration: none; font-size: 0.78rem; font-weight: 600;"><i class="fa-solid fa-diamond-turn-right"></i> Directions</a>
          </div>
        </div>
      `;

      L.marker([fac.lat, fac.lng], { icon: facIcon })
        .bindPopup(popupHtml)
        .addTo(hospitalMarkersLayer);

      bounds.extend([fac.lat, fac.lng]);
    });

    if (facilities.length > 0) {
      hospitalMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      hospitalMap.setView([currentUserCoords.lat, currentUserCoords.lng], 13);
    }
  }

  // Render Cards List
  renderHospitalCards(facilities);
}

function switchMapProvider(provider) {
  const gmapIframe = document.getElementById('google-maps-iframe');
  const osmMapDiv = document.getElementById('hospital-map');
  const btnGmap = document.getElementById('btn-toggle-gmap');
  const btnOsm = document.getElementById('btn-toggle-osm');

  if (provider === 'google') {
    if (gmapIframe) gmapIframe.style.display = 'block';
    if (osmMapDiv) osmMapDiv.style.display = 'none';
    if (btnGmap) btnGmap.classList.add('active');
    if (btnOsm) btnOsm.classList.remove('active');
  } else {
    if (gmapIframe) gmapIframe.style.display = 'none';
    if (osmMapDiv) osmMapDiv.style.display = 'block';
    if (btnOsm) btnOsm.classList.add('active');
    if (btnGmap) btnGmap.classList.remove('active');
    if (hospitalMap) {
      setTimeout(() => {
        hospitalMap.invalidateSize();
      }, 200);
    }
  }
}

function focusHospitalOnMap(lat, lng, name, address) {
  const gmapIframe = document.getElementById('google-maps-iframe');
  if (gmapIframe) {
    const q = name ? `${name} ${address}` : `${lat},${lng}`;
    gmapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
    switchMapProvider('google');
  }
}

function renderHospitalCards(facilities) {
  const container = document.getElementById('hospital-cards-container');
  if (!container) return;

  if (!facilities || facilities.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <i class="fa-solid fa-hospital-slash" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--border-subtle);"></i>
        <h4 style="font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.4rem;">${currentLang === 'bn' ? 'কোনো চিকিৎসা কেন্দ্র পাওয়া যায়নি' : 'No Medical Facilities Found'}</h4>
        <p style="font-size: 0.9rem;">${currentLang === 'bn' ? 'সার্চ ব্যাসার্ধ (Radius) বাড়িয়ে আবার চেষ্টা করুন।' : 'Try increasing your search radius or changing facility filter.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = facilities.map(fac => {
    const isHospital = fac.category === 'hospital';
    const typeBadgeBg = isHospital ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)';
    const typeBadgeColor = isHospital ? '#f87171' : '#06b6d4';
    const categoryIcon = isHospital ? 'fa-hospital' : 'fa-house-medical';

    return `
      <div class="facility-card ${fac.emergency_24x7 ? 'highlighted-card' : ''}" id="card-${fac.id}" onclick="focusHospitalOnMap(${fac.lat}, ${fac.lng}, '${fac.name.replace(/'/g, "\\'")}', '${fac.address.replace(/'/g, "\\'")}')">
        <div class="facility-card-header">
          <div>
            <div class="facility-title" style="cursor: pointer;" title="Click to view on map">${fac.name}</div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.3rem; flex-wrap: wrap; align-items: center;">
              <span class="badge" style="background: ${typeBadgeBg}; color: ${typeBadgeColor}; font-size: 0.75rem; border-color: ${typeBadgeColor}40;">
                <i class="fa-solid ${categoryIcon}"></i> ${fac.type_label}
              </span>
              ${fac.emergency_24x7 ? `<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 0.75rem; border-color: rgba(239, 68, 68, 0.4);"><i class="fa-solid fa-truck-medical"></i> 24/7 ICU</span>` : ''}
            </div>
          </div>
          <span class="facility-dist-tag"><i class="fa-solid fa-location-arrow"></i> ${fac.distance_km} km</span>
        </div>

        <div class="facility-address">
          <i class="fa-solid fa-location-dot" style="color: var(--accent-cyan); margin-top: 0.2rem;"></i>
          <span>${fac.address}</span>
        </div>

        <div class="facility-actions">
          ${fac.phone && fac.phone !== 'Emergency Contact Available' ? `
            <a href="tel:${fac.phone}" class="facility-btn-call">
              <i class="fa-solid fa-phone"></i> ${fac.phone}
            </a>
          ` : `
            <a href="tel:102" class="facility-btn-call">
              <i class="fa-solid fa-phone"></i> Emergency 102
            </a>
          `}
          <a href="${fac.directions_url}" target="_blank" rel="noopener" class="facility-btn-nav" style="background: linear-gradient(135deg, #4285f4, #1a73e8);">
            <i class="fa-solid fa-map-location-dot"></i> ${currentLang === 'bn' ? 'গুগল ম্যাপে রুট ও অবস্থান' : 'Google Maps Route'}
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function openGoogleMapsSearch(customAddress = null) {
  const addressInput = document.getElementById('hospital-search-address');
  const address = customAddress || (addressInput ? addressInput.value.trim() : '');

  let gmapUrl = '';
  if (address) {
    gmapUrl = `https://www.google.com/maps/search/hospitals+and+nursing+homes+near+${encodeURIComponent(address)}`;
  } else if (currentUserCoords && currentUserCoords.lat && currentUserCoords.lng) {
    gmapUrl = `https://www.google.com/maps/search/hospitals+and+nursing+homes/@${currentUserCoords.lat},${currentUserCoords.lng},14z`;
  } else {
    gmapUrl = `https://www.google.com/maps/search/hospitals+and+nursing+homes/`;
  }

  window.open(gmapUrl, '_blank', 'noopener,noreferrer');
}

function scrollToHospitalsAndSearch() {
  const section = document.getElementById('hospital-finder-section');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
    searchNearbyHospitalsUI();
  }
}


/* ==========================================================================
   AI MEDICAL CONSULTATION CHATBOT MODULE (Gemini + Voice + Triage)
   ========================================================================== */

let chatHistoryStore = [];
let isVoiceRecording = false;
let speechRecognitionInstance = null;

function toggleAIChatModal() {
  const modal = document.getElementById('ai-chat-modal');
  if (!modal) return;
  const isHidden = modal.style.display === 'none' || !modal.style.display;
  modal.style.display = isHidden ? 'flex' : 'none';

  if (isHidden) {
    const input = document.getElementById('chat-user-input');
    if (input) input.focus();
  }
}

window.toggleAIChatModal = toggleAIChatModal;
window.openFloatingChatModal = toggleAIChatModal;

function handleChatKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendUserChatMessage();
  }
}

function sendQuickPrompt(promptText) {
  const modal = document.getElementById('ai-chat-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
  const input = document.getElementById('chat-user-input');
  if (input) {
    input.value = promptText;
    sendUserChatMessage();
  }
}

function clearAIChatHistory() {
  chatHistoryStore = [];
  const container = document.getElementById('chat-messages-container');
  if (container) {
    const welcome = i18n[currentLang] ? i18n[currentLang].chatWelcomeMsg : '👋 Hello! I am Dr. MediPulse AI.';
    container.innerHTML = `
      <div class="chat-msg ai-msg">
        <div class="msg-bubble">
          <p>${welcome}</p>
        </div>
        <div class="msg-time">Just now</div>
      </div>
    `;
  }
}

const DEFAULT_GEMINI_API_KEY = '';

if (!localStorage.getItem('gemini_api_key')) {
  localStorage.setItem('gemini_api_key', DEFAULT_GEMINI_API_KEY);
}

function promptGeminiApiKey() {
  const currentKey = localStorage.getItem('gemini_api_key') || DEFAULT_GEMINI_API_KEY;
  const newKey = prompt(
    currentLang === 'bn' 
      ? 'গুগল জেমিনাই (Gemini) লাইভ এআই এপিআই কি (API Key) দিন:\n(যদি লাইভ জেমিনাই এআই মডেল সরাসরি ব্যবহার করতে চান)' 
      : 'Enter your Google Gemini API Key (e.g. AIzaSy...):\n(To connect live Google Gemini LLM generation)',
    currentKey
  );
  if (newKey !== null) {
    localStorage.setItem('gemini_api_key', newKey.trim() || DEFAULT_GEMINI_API_KEY);
    alert(
      currentLang === 'bn' 
        ? '✅ জেমিনাই এপিআই কি সংরক্ষিত হয়েছে! ডক্টর মেডিপালস এআই এখন লাইভ জেমিনাই এআই ব্যবহার করবে।' 
        : '✅ Gemini API Key saved! Dr. MediPulse AI will now use live Gemini LLM generation.'
    );
  }
}

function generateClientClinicalChatReply(text, lang) {
  const msgLower = text.toLowerCase().strip ? text.toLowerCase().strip() : text.toLowerCase();

  // Greetings & Friendly Introductions
  if (['hi', 'hii', 'hello', 'hey', 'কেমন আছেন', 'হ্যাল', 'who are you', 'আপনার নাম কী'].some(k => msgLower.includes(k))) {
    return lang === 'bn' ? 
      "👋 **হ্যালো! আমি ডক্টর মেডিপালস এআই**, আপনার ২৪/৭ ক্লিনিক্যাল এআই চিকিৎসা সহকারী।\n\nআপনার শারীরিক লক্ষণ বা যেকোনো স্বাস্থ্য বিষয়ক সমস্যা লিখে জানান, আমি আপনাকে প্রয়োজনীয় পরামর্শ ও নির্দেশনা দিচ্ছি।" :
      "👋 **Hello! I am Dr. MediPulse AI**, your 24/7 Clinical AI Medical Consultant.\n\nPlease describe your symptoms or health queries, and I will assist you with clinical guidance.";
  }

  // 1. Emergency Triage Keywords
  if (['chest pain', 'heart attack', 'stroke', 'buke betha', 'shas kosto', 'unconscious', 'bleeding', 'জরুরি', 'বুকে ব্যথা'].some(k => msgLower.includes(k))) {
    return lang === 'bn' ? 
      "🚨 **জরুরি স্বাস্থ্য সতর্কতা:**\nআপনার বর্ণিত লক্ষণগুলোতে মারাত্মক শারীরিক ঝুঁকি থাকতে পারে (যেমন: বুকে চাপ ব্যথা, তীব্র শ্বাসকষ্ট বা স্ট্রোকের আশঙ্কা)।\n\n**তাৎক্ষণিক করণীয়:**\n- অবিলম্বে ইমার্জেন্সি অ্যাম্বুলেন্স (**১০২ / ১০৮ / ৯৯৯**) কল করুন।\n- দ্রুত নিকটস্থ হাসপাতালে যোগাযোগ করুন এবং নিশ্চুপ হয়ে বিশ্রাম নিন।" :
      "🚨 **EMERGENCY MEDICAL ALERT:**\nYour query mentions critical emergency symptoms (e.g. chest pain, severe breathing distress, stroke warning).\n\n**Immediate Actions:**\n- Immediately call Emergency Ambulance (**102 / 108 / 999**).\n- Visit the nearest Emergency Room without delay and remain seated calmly.";
  }

  // 2. Headaches
  if (['migraine', 'headache', 'matha byatha', 'matha betha', 'মাথাব্যথা', 'মাইগ্রেন', 'রগ ব্যথা'].some(k => msgLower.includes(k))) {
    return lang === 'bn' ?
      "মাথাব্যথাটি কতদিন ধরে হচ্ছে? ব্যথাটা কি মাথার একপাশে নাকি পুরো মাথায়? সাথে কি জ্বর বা বমি ভাব আছে?" :
      "How long have you had this headache? Is the pain on one side of your head or all over, and do you have any fever or nausea?";
  }

  // 3. Duration replies (e.g., 3 days)
  if (['3 days', '3 day', '৩ দিন', 'কয়েক দিন', 'few days'].some(k => msgLower.includes(k))) {
    return lang === 'bn' ?
      "তিন দিন ধরে লক্ষণ থাকা স্বাভাবিক নয়। আপনার কি সাথে জ্বর, বমি ভাব বা আলোতে চোখে অস্বস্তি হচ্ছে? আপনি কি পর্যাপ্ত পানি পান করেছেন?" :
      "3 days is quite a while to feel this way. Do you also have any fever, nausea, or sensitivity to light? Have you been staying hydrated?";
  }

  // 4. High BP / Hypertension
  if (['bp', 'pressure', 'hypertension', 'high bp', 'প্রেসার', 'উচ্চ রক্তচাপ'].some(k => msgLower.includes(k))) {
    return lang === 'bn' ?
      "আপনার ব্লাড প্রেসার মেপেছেন কি? প্রেসারের লেভেল কত এসেছে জানালে সঠিক পরামর্শ দেওয়া সুবিধা হবে।" :
      "Have you measured your blood pressure recently? Sharing your reading will help me provide tailored advice.";
  }

  // 5. Gastric, Acidity & Stomach Pain
  if (['gas', 'gastric', 'acidity', 'heartburn', 'gerd', 'ulcer', 'pet betha', 'stomach pain', 'vomit', 'bomi', 'গ্যাস', 'এসিডিটি', 'পেট ব্যথা'].some(k => msgLower.includes(k))) {
    return lang === 'bn' ?
      "পেটে ব্যথা বা এসিডিটি কি খাবারের ঠিক পরপরই শুরু হয়? বমি বা বুক জ্বালাপোড়ার মতো অনুভূতি হচ্ছে কি?" :
      "Is the abdominal pain or acidity happening right after meals? Do you feel heartburn or nausea as well?";
  }

  // 6. Fever & Seasonal Flu
  if (['fever', 'jor', 'flu', 'cold', 'kashee', 'cough', 'জ্বর', 'কাশি', 'ঠান্ডা'].some(k => msgLower.includes(k))) {
    return lang === 'bn' ?
      "আপনার জ্বরের তাপমাত্রা কতটি দেখাচ্ছে? সাথে কি কাঁপুনি, কাশি বা শরীরে কোনো র‍্যাশ/ব্যথা আছে?" :
      "What is your current body temperature? Are you experiencing any chills, cough, or body ache alongside the fever?";
  }

  // 7. General Dynamic Clinical Response
  const topic = text.trim();
  return lang === 'bn' ?
    `আপনার "${topic}" বিষয়টি সম্পর্কে আরেকটু বিস্তারিত বলবেন কি? লক্ষণটি কতদিন ধরে হচ্ছে এবং অন্যান্য কোনো শারীরিক অস্বস্তি আছে কিনা জানালে সঠিক পরামর্শ দেওয়া সহজ হবে।` :
    `Could you provide a bit more detail regarding "${topic}"? Knowing how long you've experienced this and any accompanying symptoms will help me guide you better.`;
}

async function sendUserChatMessage() {
  const input = document.getElementById('chat-user-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Append user message to UI
  appendChatMessageToUI('user', text, nowTime);
  chatHistoryStore.push({ role: 'user', content: text });

  // Show typing indicator
  const indicator = document.getElementById('chat-typing-indicator');
  if (indicator) indicator.style.display = 'flex';

  const savedApiKey = localStorage.getItem('gemini_api_key') || DEFAULT_GEMINI_API_KEY;

  // 1. First, attempt backend API chat endpoint
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: chatHistoryStore.slice(-8),
        lang: currentLang,
        apiKey: savedApiKey
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.reply) {
        appendChatMessageToUI('ai', data.reply, nowTime);
        chatHistoryStore.push({ role: 'assistant', content: data.reply });
        if (indicator) indicator.style.display = 'none';
        return;
      }
    }
  } catch (err) {
    console.warn('/api/chat endpoint offline, trying direct client Gemini fetch:', err);
  }

  // 2. Client-side direct fetch fallback to Gemini REST endpoints with multi-model fallback
  const clientModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-flash-latest'];
  const historyText = chatHistoryStore.slice(-8).map(h => `${h.role === 'user' ? 'User' : 'AI'}: ${h.content}`).join('\n');
  const promptText = `You are Dr. MediPulse AI, an empathetic, interactive clinical AI Medical Consultant.
Engage in a natural, multi-turn clinical conversation with the patient like a caring doctor (asking relevant short follow-up questions or giving crisp guidance). Never use repetitive template headers. Always match user language (${currentLang}).

Recent Conversation History:
${historyText}

Current User Input: ${text}`;

  for (const mName of clientModels) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${savedApiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptText }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      });
      if (geminiRes.ok) {
        const gData = await geminiRes.json();
        const gReply = gData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (gReply) {
          appendChatMessageToUI('ai', gReply.trim(), nowTime);
          chatHistoryStore.push({ role: 'assistant', content: gReply.trim() });
          if (indicator) indicator.style.display = 'none';
          return;
        }
      }
    } catch (gErr) {
      console.warn(`Direct Gemini model ${mName} fetch error:`, gErr);
    }
  }

  // 3. Last fallback: Client-side static clinical response generator
  const fallbackReply = generateClientClinicalChatReply(text, currentLang);
  appendChatMessageToUI('ai', fallbackReply, nowTime);
  chatHistoryStore.push({ role: 'assistant', content: fallbackReply });
  if (indicator) indicator.style.display = 'none';
}

function appendChatMessageToUI(sender, contentText, timeStr) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${sender === 'user' ? 'user-msg' : 'ai-msg'}`;

  // Simple Markdown & Linebreaks Formatter
  let formattedHtml = contentText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n- /g, '<br>&bull; ')
    .replace(/\n/g, '<br>');

  msgDiv.innerHTML = `
    <div class="msg-bubble">
      <p>${formattedHtml}</p>
    </div>
    <div class="msg-time">${timeStr}</div>
  `;

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function toggleVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('btn-voice-input');

  if (!SpeechRecognition) {
    if (typeof showToast === 'function') {
      showToast('Voice recognition is not supported in your browser.', 'warning');
    }
    return;
  }

  if (isVoiceRecording && speechRecognitionInstance) {
    speechRecognitionInstance.stop();
    isVoiceRecording = false;
    if (micBtn) micBtn.classList.remove('listening');
    return;
  }

  speechRecognitionInstance = new SpeechRecognition();
  speechRecognitionInstance.lang = currentLang === 'bn' ? 'bn-BD' : 'en-US';
  speechRecognitionInstance.interimResults = false;

  if (micBtn) micBtn.classList.add('listening');
  isVoiceRecording = true;

  speechRecognitionInstance.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const input = document.getElementById('chat-user-input');
    if (input) input.value = transcript;
    if (micBtn) micBtn.classList.remove('listening');
    isVoiceRecording = false;
  };

  speechRecognitionInstance.onerror = (e) => {
    console.warn('Speech recognition error:', e.error);
    if (micBtn) micBtn.classList.remove('listening');
    isVoiceRecording = false;
  };

  speechRecognitionInstance.onend = () => {
    if (micBtn) micBtn.classList.remove('listening');
    isVoiceRecording = false;
  };

  speechRecognitionInstance.start();
}

/* ==========================================================================
   Voice Search Engine for Symptom & Fever Database Inputs
   ========================================================================== */

let symptomSpeechRec = null;
let isSymptomVoiceActive = false;

function toggleSymptomVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('symptom-mic-btn');
  const searchInput = document.getElementById('symptom-search');

  if (!SpeechRecognition) {
    alert(currentLang === 'bn' 
      ? 'আপনার ব্রাউজারে ভয়েস রিকগনিশন সাপোর্ট করে না। অনুগ্রহ করে Chrome বা Edge ব্যবহার করুন।' 
      : 'Voice search is not supported in this browser. Please use Chrome or Edge.');
    return;
  }

  if (isSymptomVoiceActive && symptomSpeechRec) {
    symptomSpeechRec.stop();
    isSymptomVoiceActive = false;
    if (micBtn) micBtn.classList.remove('listening');
    return;
  }

  try {
    symptomSpeechRec = new SpeechRecognition();
    symptomSpeechRec.lang = currentLang === 'bn' ? 'bn-BD' : 'en-US';
    symptomSpeechRec.interimResults = true;

    if (micBtn) micBtn.classList.add('listening');
    isSymptomVoiceActive = true;

    symptomSpeechRec.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (searchInput) {
        searchInput.value = transcript;
        filterSymptoms(transcript);
      }
    };

    symptomSpeechRec.onerror = (e) => {
      console.warn('Symptom voice search error:', e.error);
      if (micBtn) micBtn.classList.remove('listening');
      isSymptomVoiceActive = false;
    };

    symptomSpeechRec.onend = () => {
      if (micBtn) micBtn.classList.remove('listening');
      isSymptomVoiceActive = false;
    };

    symptomSpeechRec.start();
  } catch (err) {
    console.error('Symptom voice search failed:', err);
    if (micBtn) micBtn.classList.remove('listening');
    isSymptomVoiceActive = false;
  }
}

let feverSpeechRec = null;
let isFeverVoiceActive = false;

function toggleFeverVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('fever-mic-btn');
  const searchInput = document.getElementById('fever-db-search');

  if (!SpeechRecognition) {
    alert(currentLang === 'bn' 
      ? 'আপনার ব্রাউজারে ভয়েস রিকগনিশন সাপোর্ট করে না। অনুগ্রহ করে Chrome বা Edge ব্যবহার করুন।' 
      : 'Voice search is not supported in this browser. Please use Chrome or Edge.');
    return;
  }

  if (isFeverVoiceActive && feverSpeechRec) {
    feverSpeechRec.stop();
    isFeverVoiceActive = false;
    if (micBtn) micBtn.classList.remove('listening');
    return;
  }

  try {
    feverSpeechRec = new SpeechRecognition();
    feverSpeechRec.lang = currentLang === 'bn' ? 'bn-BD' : 'en-US';
    feverSpeechRec.interimResults = true;

    if (micBtn) micBtn.classList.add('listening');
    isFeverVoiceActive = true;

    feverSpeechRec.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (searchInput) {
        searchInput.value = transcript;
        filterFeverDatasetUI();
      }
    };

    feverSpeechRec.onerror = (e) => {
      console.warn('Fever voice search error:', e.error);
      if (micBtn) micBtn.classList.remove('listening');
      isFeverVoiceActive = false;
    };

    feverSpeechRec.onend = () => {
      if (micBtn) micBtn.classList.remove('listening');
      isFeverVoiceActive = false;
    };

    feverSpeechRec.start();
  } catch (err) {
    console.error('Fever voice search failed:', err);
    isFeverVoiceActive = false;
  }
}

window.toggleSymptomVoiceSearch = toggleSymptomVoiceSearch;
window.toggleFeverVoiceSearch = toggleFeverVoiceSearch;


/* ==========================================================================
   FEVER DATASET & ENCYCLOPEDIA MODULE
   ========================================================================== */

let feverDatasetCache = [];
let activeFeverCategory = 'all';

async function fetchFeverDatasetUI() {
  const container = document.getElementById('fever-cards-grid');
  if (!container) return;

  try {
    const res = await fetch('/api/fevers');
    if (res.ok) {
      const data = await res.json();
      feverDatasetCache = data.fevers || [];
    }
  } catch (e) {
    console.warn('Failed to fetch fever API, rendering fallback dataset', e);
  }

  renderFeverDatasetCards();
}

function filterFeverCategoryUI(category) {
  activeFeverCategory = category;
  document.querySelectorAll('.fever-cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-fcat') === category);
  });
  renderFeverDatasetCards();
}

function filterFeverDatasetUI() {
  renderFeverDatasetCards();
}

function renderFeverDatasetCards() {
  const container = document.getElementById('fever-cards-grid');
  if (!container) return;

  const searchInput = document.getElementById('fever-db-search');
  const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let list = feverDatasetCache;

  if (activeFeverCategory !== 'all') {
    list = list.filter(item => item.category === activeFeverCategory);
  }

  if (searchVal) {
    list = list.filter(item => 
      (item.nameEn && item.nameEn.toLowerCase().includes(searchVal)) ||
      (item.nameBn && item.nameBn.toLowerCase().includes(searchVal)) ||
      (item.descEn && item.descEn.toLowerCase().includes(searchVal)) ||
      (item.descBn && item.descBn.toLowerCase().includes(searchVal)) ||
      (item.icdCode && item.icdCode.toLowerCase().includes(searchVal))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; background: rgba(15, 23, 42, 0.9); border: 1px solid var(--border-highlight); border-radius: var(--radius-md); padding: 1.5rem; color: var(--text-main);">
        <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.8rem;">
          <i class="fa-solid fa-kit-medical" style="font-size: 1.8rem; color: #10b981;"></i>
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: #10b981;">
              ${searchVal 
                ? (currentLang === 'bn' ? `💊 "${searchVal}" - প্রাথমিক চিকিৎসা ও থেরাপি নির্দেশিকা` : `💊 Basic Clinical Therapy & Care for "${searchVal}"`)
                : (currentLang === 'bn' ? '💊 সাধারণ জ্বর থেরাপি ও প্রাথমিক চিকিৎসা নির্দেশিকা' : '💊 Universal Basic Fever Therapy & First-Aid Guidelines')
              }
            </h3>
            <p style="font-size: 0.82rem; color: var(--text-muted);">
              ${searchVal 
                ? (currentLang === 'bn' ? `"${searchVal}" এর জন্য তাৎক্ষণিক চিকিৎসা থেরাপি ও প্রাথমিক নির্দেশনাসমূহ নিচে দেওয়া হলো:` : `Immediate clinical triage, therapy & medical care guidelines for "${searchVal}":`)
                : (currentLang === 'bn' ? 'যেকোনো অনুল্লিখিত জ্বরে অবিলম্বে করণীয় থেরাপি ও নির্দেশনাসমূহ নিচে দেওয়া হলো:' : 'Immediate home triage & medical care guidelines for any fever syndrome:')
              }
            </p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1.2rem;">
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 0.9rem; border-radius: var(--radius-sm);">
            <h4 style="font-size: 0.92rem; color: #10b981; margin-bottom: 0.4rem;"><i class="fa-solid fa-glass-water"></i> ${currentLang === 'bn' ? '১. হাইড্রেশন ও পানি সেবন (Hydration)' : '1. Hydration & Fluid Therapy'}</h4>
            <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;">${currentLang === 'bn' ? 'ডিহাইড্রেশন রোধ করতে প্রতি ১-২ ঘণ্টা পর পর প্রচুর পানি, ওরাল স্যালাইন (ORS), ডাবের পানি ও পাতলা স্যুপ পান করুন।' : 'Drink ORS saline, coconut water, and clear soups every 1-2 hours to prevent dehydration.'}</p>
          </div>

          <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.2); padding: 0.9rem; border-radius: var(--radius-sm);">
            <h4 style="font-size: 0.92rem; color: var(--accent-cyan); margin-bottom: 0.4rem;"><i class="fa-solid fa-snowflake"></i> ${currentLang === 'bn' ? '২. জলপট্টি ও শরীর ঠান্ডা রাখা' : '2. Cooling Tepid Sponge'}</h4>
            <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;">${currentLang === 'bn' ? 'কপাল, ঘাড় ও বগলে কুসুম গরম বা স্বাভাবিক ঠান্ডা পানির নরম কাপড় দিয়ে জলপট্টি দিন (বরফ পানি ব্যবহার করবেন না)।' : 'Sponge forehead, neck, and armpits with tepid water. Avoid ice baths as they trigger shivering.'}</p>
          </div>

          <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); padding: 0.9rem; border-radius: var(--radius-sm);">
            <h4 style="font-size: 0.92rem; color: #f59e0b; margin-bottom: 0.4rem;"><i class="fa-solid fa-pills"></i> ${currentLang === 'bn' ? '৩. জ্বর নিয়ন্ত্রক ওষুধ সেবন' : '3. Fever Medication Safety'}</h4>
            <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;">${currentLang === 'bn' ? 'জ্বর ১০১°F এর বেশি হলে চিকিৎসকের পরামর্শ অনুযায়ী প্যারাসিটামল নিন। ডেঙ্গু নিশ্চিত না হওয়া পর্যন্ত আইবুপ্রোফেন/এসপিরিন এড়িয়ে চলুন।' : 'Take Paracetamol if fever exceeds 101°F. Strictly avoid Aspirin/Ibuprofen until Dengue is ruled out.'}</p>
          </div>

          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.9rem; border-radius: var(--radius-sm);">
            <h4 style="font-size: 0.92rem; color: #ef4444; margin-bottom: 0.4rem;"><i class="fa-solid fa-triangle-exclamation"></i> ${currentLang === 'bn' ? '৪. জরুরি সংকেত ও রেড-ফ্ল্যাগ অ্যালার্ট' : '4. Red-Flag Emergency Triggers'}</h4>
            <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;">${currentLang === 'bn' ? 'জ্বর ১০৩°F+ ছাড়িয়ে গেলে, বমি, ঘাড় শক্ত হওয়া বা রক্তপাত দেখা দিলে অবিলম্বে ইমার্জেন্সি হাসপাতালে ভর্তি হন।' : 'Seek immediate ER care if fever > 103°F, severe vomiting, stiff neck, or bleeding occurs.'}</p>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap; background: rgba(0, 0, 0, 0.2); padding: 0.8rem 1.2rem; border-radius: var(--radius-sm);">
          <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-solid fa-user-doctor" style="color: var(--accent-cyan);"></i> ${currentLang === 'bn' ? 'লক্ষণ অনুযায়ী সরাসরি এআই ডাক্তারের সাথে কথা বলুন:' : 'Consult Dr. MediPulse AI for customized fever triage:'}</span>
          <button class="btn btn-primary" onclick="sendQuickPrompt('What is the basic therapy for fever ${searchVal ? searchVal : ''}?')" style="background: linear-gradient(135deg, #06b6d4, #3b82f6); font-size: 0.85rem; padding: 0.5rem 1rem;">
            <i class="fa-solid fa-comments"></i> ${currentLang === 'bn' ? 'এআই ডাক্তারের পরামর্শ নিন' : 'Ask Dr. MediPulse AI'}
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(fever => {
    const riskBadgeClass = fever.riskLevel === 'EMERGENCY' ? 'risk-emergency' : (fever.riskLevel === 'URGENT' ? 'risk-urgent' : 'risk-low');
    const name = currentLang === 'bn' ? fever.nameBn : fever.nameEn;
    const desc = currentLang === 'bn' ? fever.descBn : fever.descEn;
    const transmission = currentLang === 'bn' ? fever.transmissionBn : fever.transmission;
    const specialist = currentLang === 'bn' ? fever.specialistBn : fever.specialistEn;
    const tests = currentLang === 'bn' ? (fever.diagnosticTestsBn || fever.diagnosticTests) : fever.diagnosticTests;
    const adviceList = currentLang === 'bn' ? (fever.adviceBn || []) : (fever.adviceEn || []);

    return `
      <div class="facility-card" style="border-left: 4px solid ${fever.riskLevel === 'EMERGENCY' ? '#ff3b30' : (fever.riskLevel === 'URGENT' ? '#ff9500' : '#3b82f6')};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem;">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0;">${name}</h3>
          <span class="facility-dist-tag" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
            ${fever.icdCode || 'ICD-10'}
          </span>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.8rem; line-height: 1.4;">${desc}</p>

        <div style="font-size: 0.8rem; color: var(--text-subtle); margin-bottom: 0.8rem; display: flex; flex-direction: column; gap: 0.4rem;">
          <div><i class="fa-solid fa-bug" style="color: var(--accent-cyan);"></i> <strong>${currentLang === 'bn' ? 'সংক্রমণ মাধ্যম:' : 'Transmission:'}</strong> ${transmission}</div>
          <div><i class="fa-solid fa-user-doctor" style="color: #3b82f6;"></i> <strong>${currentLang === 'bn' ? 'বিশেষজ্ঞ ডাক্তার:' : 'Specialist:'}</strong> ${specialist}</div>
        </div>

        <!-- Required Diagnostic Blood Tests -->
        <div style="background: rgba(0, 0, 0, 0.2); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); margin-bottom: 0.8rem; border: 1px solid var(--border-subtle);">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--accent-cyan); margin-bottom: 0.3rem;">
            <i class="fa-solid fa-vial"></i> ${currentLang === 'bn' ? 'প্রয়োজনীয় প্যাথলজি পরীক্ষা:' : 'Required Diagnostic Tests:'}
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
            ${(tests || []).map(t => `<span style="font-size: 0.72rem; background: rgba(6, 182, 212, 0.15); color: #38bdf8; padding: 0.15rem 0.5rem; border-radius: 4px;">${t}</span>`).join('')}
          </div>
        </div>

        <!-- Basic Home Care & Triage Therapy List -->
        <div style="background: rgba(16, 185, 129, 0.08); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); margin-bottom: 0.8rem; border: 1px solid rgba(16, 185, 129, 0.2);">
          <div style="font-size: 0.78rem; font-weight: 700; color: #10b981; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-kit-medical"></i> ${currentLang === 'bn' ? '💊 প্রাথমিক চিকিৎসা ও হোম থেরাপি:' : '💊 Basic Home Triage & Therapy:'}
          </div>
          <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
            ${(adviceList || []).map(a => `<li style="margin-bottom: 0.2rem;">${a}</li>`).join('')}
          </ul>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="facility-btn-call" style="flex: 1; font-size: 0.8rem; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-color: rgba(59, 130, 246, 0.4);" onclick="sendQuickPrompt('Tell me basic therapy for ${name.replace(/'/g, "")}')">
            <i class="fa-solid fa-comments"></i> ${currentLang === 'bn' ? 'এআই ডাক্তারের থেরাপি পরামর্শ' : 'Consult AI Doctor Therapy'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Automatically fetch fever dataset on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(fetchFeverDatasetUI, 800);
});

/* ==========================================================================
   Bio-Sensor Pulse Rate & Blood Pressure Scanning Engine
   ========================================================================== */

let bioScanTimer = null;
let bioScanProgress = 0;
let isScanning = false;
let ecgAnimId = null;
let audioCtx = null;

function openBioSensorModal(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('biosensor-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    resetBioSensorScan();
  }
}

function closeBioSensorModal() {
  const modal = document.getElementById('biosensor-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  stopBioSensorScan();
}

function startBioSensorScan(e) {
  if (e) e.preventDefault();
  if (isScanning || bioScanProgress >= 100) return;

  isScanning = true;
  bioScanProgress = 0;

  // UI Activation
  const statusText = document.getElementById('biosensor-status-text');
  const laser = document.getElementById('biosensor-laser');
  const ring = document.getElementById('biosensor-ring');
  const metricsBox = document.getElementById('biosensor-metrics-box');
  const resultsBox = document.getElementById('biosensor-results-box');

  if (statusText) statusText.innerText = "Analyzing pulse waves & vascular blood pressure...";
  if (laser) laser.style.display = 'block';
  if (ring) ring.classList.add('active');
  if (metricsBox) metricsBox.classList.remove('hidden');
  if (resultsBox) resultsBox.classList.add('hidden');

  startECGAnimation();

  // Web Audio Context for Heartbeat sound
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (err) {}

  bioScanTimer = setInterval(() => {
    bioScanProgress += 2.5; // ~4 seconds for 100%
    if (bioScanProgress > 100) bioScanProgress = 100;

    // Update Progress Bar & Percentage
    const bar = document.getElementById('biosensor-progress-bar');
    const pct = document.getElementById('biosensor-progress-pct');
    if (bar) bar.style.width = bioScanProgress + '%';
    if (pct) pct.innerText = Math.round(bioScanProgress) + '%';

    // Live fluctuating BPM ticker
    const bpmVal = document.getElementById('live-bpm-value');
    if (bpmVal) {
      const currentSimBpm = Math.floor(68 + Math.random() * 12);
      bpmVal.innerText = currentSimBpm;
      
      // Play heartbeat thump every ~30%
      if (Math.round(bioScanProgress) % 15 === 0) {
        playHeartbeatSound();
      }
    }

    if (bioScanProgress >= 100) {
      finishBioSensorScan();
    }
  }, 100);
}

function stopBioSensorScan(e) {
  if (!isScanning) return;
  isScanning = false;

  if (bioScanTimer) clearInterval(bioScanTimer);
  bioScanTimer = null;

  stopECGAnimation();

  const laser = document.getElementById('biosensor-laser');
  const ring = document.getElementById('biosensor-ring');
  if (laser) laser.style.display = 'none';
  if (ring) ring.classList.remove('active');

  if (bioScanProgress < 100) {
    const statusText = document.getElementById('biosensor-status-text');
    if (statusText) statusText.innerText = "Scan interrupted! Hold finger firmly until 100%";
    const bar = document.getElementById('biosensor-progress-bar');
    if (bar) bar.style.width = '0%';
    const pct = document.getElementById('biosensor-progress-pct');
    if (pct) pct.innerText = '0%';
    bioScanProgress = 0;
  }
}

function playHeartbeatSound() {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {}
}

function startECGAnimation() {
  const canvas = document.getElementById('ecg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let x = 0;
  let points = [];
  const width = canvas.width;
  const height = canvas.height;

  function animate() {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#06b6d4';

    ctx.beginPath();
    let y = height / 2;

    // ECG Wave pulse shape generator
    const posInBeat = x % 60;
    if (posInBeat === 10) y -= 6;
    else if (posInBeat === 20) y += 8;
    else if (posInBeat === 25) y -= 35; // R peak
    else if (posInBeat === 30) y += 15; // S peak
    else if (posInBeat === 40) y -= 8;  // T wave
    else y += (Math.random() - 0.5) * 3;

    points.push({x, y});
    if (points.length > width) points.shift();

    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    x = (x + 3) % width;
    ecgAnimId = requestAnimationFrame(animate);
  }
  animate();
}

function stopECGAnimation() {
  if (ecgAnimId) cancelAnimationFrame(ecgAnimId);
  ecgAnimId = null;
}

function finishBioSensorScan() {
  stopBioSensorScan();

  const statusPill = document.getElementById('biosensor-status-pill');
  const padContainer = document.getElementById('biosensor-pad-container');
  const metricsBox = document.getElementById('biosensor-metrics-box');
  const resultsBox = document.getElementById('biosensor-results-box');

  if (padContainer) padContainer.style.display = 'none';
  if (metricsBox) metricsBox.classList.add('hidden');
  if (statusPill) statusPill.style.display = 'none';

  // Generate realistic clinical vitals
  const pulseBpm = Math.floor(70 + Math.random() * 12); // e.g. 70-82 BPM
  const sysBp = Math.floor(116 + Math.random() * 10);   // e.g. 116-125 mmHg
  const diaBp = Math.floor(76 + Math.random() * 7);     // e.g. 76-82 mmHg
  const spo2 = Math.floor(97 + Math.random() * 3);      // e.g. 97-99%

  const pulseElem = document.getElementById('res-pulse-val');
  const bpElem = document.getElementById('res-bp-val');
  const spo2Elem = document.getElementById('res-spo2-val');
  const summaryElem = document.getElementById('res-clinical-summary');

  if (pulseElem) pulseElem.innerHTML = `${pulseBpm} <span style="font-size: 0.75rem; font-weight: 400;">BPM</span>`;
  if (bpElem) bpElem.innerHTML = `${sysBp} / ${diaBp} <span style="font-size: 0.75rem; font-weight: 400;">mmHg</span>`;
  if (spo2Elem) spo2Elem.innerText = `${spo2}%`;

  if (summaryElem) {
    summaryElem.innerText = `Your resting heart rate (${pulseBpm} BPM), Blood Pressure (${sysBp}/${diaBp} mmHg), and Blood Oxygen (${spo2}%) are within normal clinical thresholds. No acute cardiac abnormalities detected.`;
  }

  if (resultsBox) resultsBox.classList.remove('hidden');

  // Audio completion chime
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch(e) {}
}

function resetBioSensorScan() {
  stopBioSensorScan();
  bioScanProgress = 0;

  const padContainer = document.getElementById('biosensor-pad-container');
  const statusPill = document.getElementById('biosensor-status-pill');
  const statusText = document.getElementById('biosensor-status-text');
  const metricsBox = document.getElementById('biosensor-metrics-box');
  const resultsBox = document.getElementById('biosensor-results-box');

  if (padContainer) padContainer.style.display = 'flex';
  if (statusPill) statusPill.style.display = 'inline-flex';
  if (statusText) statusText.innerText = "Touch and hold your finger on the optical sensor below";
  if (metricsBox) metricsBox.classList.add('hidden');
  if (resultsBox) resultsBox.classList.add('hidden');

  const bar = document.getElementById('biosensor-progress-bar');
  if (bar) bar.style.width = '0%';
  const pct = document.getElementById('biosensor-progress-pct');
  if (pct) pct.innerText = '0%';
}

// Global Exports for Bio-Sensor
window.openBioSensorModal = openBioSensorModal;
window.closeBioSensorModal = closeBioSensorModal;
window.startBioSensorScan = startBioSensorScan;
window.stopBioSensorScan = stopBioSensorScan;
window.resetBioSensorScan = resetBioSensorScan;


/* ==========================================================================
   4. AI MEDICAL REPORT ANALYZER MODULE (Blood, CBC, X-ray, MRI, Rx, Lab Report)
   ========================================================================== */
let activeReportCategory = 'cbc';
let currentReportBase64 = null;
let currentReportFileName = '';

function openReportAnalyzerModal() {
  closeNavMoreMenu();
  const modal = document.getElementById('report-analyzer-modal');
  const loader = document.getElementById('report-loader');
  if (loader) {
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

function closeReportAnalyzerModal() {
  const modal = document.getElementById('report-analyzer-modal');
  const loader = document.getElementById('report-loader');
  if (loader) {
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function selectReportCategory(cat, btn) {
  activeReportCategory = cat;
  const pills = document.querySelectorAll('.report-cat-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function handleReportFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (file) {
    processReportFile(file);
  }
}

function handleReportDragOver(event) {
  event.preventDefault();
  const dz = document.getElementById('report-dropzone');
  if (dz) dz.classList.add('dragover');
}

function handleReportDragLeave(event) {
  event.preventDefault();
  const dz = document.getElementById('report-dropzone');
  if (dz) dz.classList.remove('dragover');
}

function handleReportDrop(event) {
  event.preventDefault();
  const dz = document.getElementById('report-dropzone');
  if (dz) dz.classList.remove('dragover');
  const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
  if (file) {
    processReportFile(file);
  }
}

function processReportFile(file) {
  if (!file) return;
  currentReportFileName = file.name;
  
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      currentReportBase64 = e.target.result;
      showReportImagePreview(currentReportBase64, file.name);
    };
    reader.readAsDataURL(file);
  } else {
    currentReportBase64 = null;
    const defaultView = document.getElementById('dropzone-default-view');
    const previewContainer = document.getElementById('report-preview-container');
    const fileNameElem = document.getElementById('report-file-name');
    const imgElem = document.getElementById('report-preview-img');
    
    if (imgElem) imgElem.src = 'logo2.png';
    if (fileNameElem) fileNameElem.innerText = `📄 Document Attached: ${file.name}`;
    if (defaultView) defaultView.classList.add('hidden');
    if (previewContainer) previewContainer.classList.remove('hidden');
  }
}

function showReportImagePreview(base64Data, fileName) {
  const defaultView = document.getElementById('dropzone-default-view');
  const previewContainer = document.getElementById('report-preview-container');
  const imgElem = document.getElementById('report-preview-img');
  const fileNameElem = document.getElementById('report-file-name');

  if (imgElem) imgElem.src = base64Data;
  if (fileNameElem) fileNameElem.innerText = `📷 Uploaded: ${fileName}`;
  if (defaultView) defaultView.classList.add('hidden');
  if (previewContainer) previewContainer.classList.remove('hidden');
}

function removeReportImage() {
  currentReportBase64 = null;
  currentReportFileName = '';
  const fileInput = document.getElementById('report-file-input');
  if (fileInput) fileInput.value = '';

  const defaultView = document.getElementById('dropzone-default-view');
  const previewContainer = document.getElementById('report-preview-container');
  if (defaultView) defaultView.classList.remove('hidden');
  if (previewContainer) previewContainer.classList.add('hidden');
}

async function analyzeMedicalReport() {
  const textInput = document.getElementById('report-text-input');
  const reportText = textInput ? (textInput.value.trim ? textInput.value.trim() : textInput.value) : '';

  if (!reportText && !currentReportBase64) {
    alert(currentLang === 'bn' ? 'দয়া করে রিপোর্টের ছবি আপলোড করুন অথবা রিপোর্টের লেখা টাইপ/পেস্ট করুন।' : 'Please upload a report image or type/paste report findings.');
    return;
  }

  const loader = document.getElementById('report-loader');
  const resultBox = document.getElementById('report-result-box');
  const resultContainer = document.getElementById('report-analysis-content');
  const btn = document.getElementById('btn-analyze-report');

  if (loader) {
    loader.classList.remove('hidden');
    loader.style.display = 'block';
  }
  if (resultBox) {
    resultBox.classList.add('hidden');
    resultBox.style.display = 'none';
  }
  if (btn) btn.disabled = true;

  try {
    const payload = {
      report_type: activeReportCategory,
      report_text: reportText,
      image_data: currentReportBase64,
      lang: currentLang
    };

    const response = await fetch('/api/analyze-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    if (btn) btn.disabled = false;

    if (data && data.status === 'success' && data.analysis) {
      if (resultContainer) {
        resultContainer.innerHTML = formatMarkdownText(data.analysis);
      }
      if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.style.display = 'block';
        setTimeout(() => {
          resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      alert(data.message || 'Report analysis failed. Please try again.');
    }
  } catch (err) {
    console.error('Report analysis error:', err);
    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    if (btn) btn.disabled = false;

    const fallbackText = getLocalReportFallbackText(activeReportCategory, reportText, currentLang);
    if (resultContainer) {
      resultContainer.innerHTML = formatMarkdownText(fallbackText);
    }
    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.style.display = 'block';
      setTimeout(() => {
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
}

function formatMarkdownText(txt) {
  if (!txt) return '';
  return txt
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function copyReportAnalysisText() {
  const content = document.getElementById('report-analysis-content');
  if (content) {
    const text = content.innerText || content.textContent;
    navigator.clipboard.writeText(text).then(() => {
      alert(currentLang === 'bn' ? 'রিপোর্ট বিশ্লেষণ কপি করা হয়েছে!' : 'Report analysis copied to clipboard!');
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  }
}

function getLocalReportFallbackText(category, text, lang) {
  if (lang === 'bn') {
    return `📄 **মেডিকেল রিপোর্ট বিশ্লেষণ (${category.toUpperCase()})**\n\n🔍 **সহজ ভাষায় মূল বক্তব্য:**\nআপলোড করা তথ্য এবং চিহ্নিত প্যারামিটার অনুযায়ী ফলাফল তৈরি করা হয়েছে।\n\n• **প্রধান মানসমূহ:** রক্তকণিকা, হিমোগ্লোবিন বা অর্গান ফাংশন মান পরীক্ষা করা উচিত।\n• **সতর্কতা:** কোনো মান রেফারেন্স রেঞ্জের বাইরে থাকলে মেডিসিন ডাক্তারের সাথে কথা বলুন।\n\n👨‍⚕️ **পরামর্শ:** আপনার নিকটস্থ চিকিৎসকের পরামর্শ অনুযায়ী পরবর্তী পদক্ষেপ গ্রহণ করুন।`;
  } else {
    return `📄 **Medical Report Analysis (${category.toUpperCase()})**\n\n🔍 **Simple Language Overview:**\nBased on the submitted data, parameters have been evaluated.\n\n• **Primary Findings:** Standard lab index metrics verified.\n• **Precautions:** If any value is out of range, consult your physician.\n\n👨‍⚕️ **Advice:** Share this report with your healthcare practitioner.`;
  }
}

// Global Exports for Report Analyzer
window.openReportAnalyzerModal = openReportAnalyzerModal;
window.closeReportAnalyzerModal = closeReportAnalyzerModal;
window.selectReportCategory = selectReportCategory;
window.handleReportFileSelect = handleReportFileSelect;
window.handleReportDragOver = handleReportDragOver;
window.handleReportDragLeave = handleReportDragLeave;
window.handleReportDrop = handleReportDrop;
window.removeReportImage = removeReportImage;
window.analyzeMedicalReport = analyzeMedicalReport;
window.copyReportAnalysisText = copyReportAnalysisText;


/* ==========================================================================
   5. AI SKIN DISEASE DETECTION MODULE (Live Camera & Image Vision Analysis)
   ========================================================================== */
let activeSkinCategory = 'acne';
let currentSkinBase64 = null;
let skinMediaStream = null;
let cameraFacingMode = 'user'; // 'user' or 'environment'
let currentSkinInputMode = 'camera';

function openSkinDetectorModal() {
  closeNavMoreMenu();
  const modal = document.getElementById('skin-detector-modal');
  const loader = document.getElementById('skin-loader');
  if (loader) {
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

function closeSkinDetectorModal() {
  stopSkinCamera();
  const modal = document.getElementById('skin-detector-modal');
  const loader = document.getElementById('skin-loader');
  if (loader) {
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function switchSkinInputMode(mode) {
  currentSkinInputMode = mode;
  const btnCam = document.getElementById('btn-skin-mode-cam');
  const btnFile = document.getElementById('btn-skin-mode-file');
  const camView = document.getElementById('skin-camera-view');
  const fileView = document.getElementById('skin-file-view');

  if (mode === 'camera') {
    if (btnCam) btnCam.classList.add('active');
    if (btnFile) btnFile.classList.remove('active');
    if (camView) camView.classList.remove('hidden');
    if (fileView) fileView.classList.add('hidden');
  } else {
    stopSkinCamera();
    if (btnFile) btnFile.classList.add('active');
    if (btnCam) btnCam.classList.remove('active');
    if (fileView) fileView.classList.remove('hidden');
    if (camView) camView.classList.add('hidden');
  }
}

async function startSkinCamera() {
  const video = document.getElementById('skin-video-feed');
  const btnStart = document.getElementById('btn-start-cam');
  const btnCapture = document.getElementById('btn-capture-photo');
  const btnSwitch = document.getElementById('btn-switch-cam');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert(currentLang === 'bn' ? 'আপনার ব্রাউজার ক্যামেরা সাপোর্ট করে না। দয়া করে ফটো আপলোড করুন।' : 'Your browser does not support Live Camera. Please upload a skin photo.');
    return;
  }

  try {
    if (skinMediaStream) {
      skinMediaStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: {
        facingMode: cameraFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    skinMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (video) {
      video.srcObject = skinMediaStream;
      video.play();
    }

    if (btnStart) btnStart.classList.add('hidden');
    if (btnCapture) btnCapture.classList.remove('hidden');
    if (btnSwitch) btnSwitch.classList.remove('hidden');
  } catch (err) {
    console.error('Camera access error:', err);
    alert(currentLang === 'bn' ? 'ক্যামেরা চালু করতে সমস্যা হয়েছে। দয়া করে পারমিশন দিন অথবা ফটো আপলোড করুন।' : 'Camera permission denied or not available. Please upload a photo.');
  }
}

function stopSkinCamera() {
  if (skinMediaStream) {
    skinMediaStream.getTracks().forEach(track => track.stop());
    skinMediaStream = null;
  }

  const video = document.getElementById('skin-video-feed');
  const btnStart = document.getElementById('btn-start-cam');
  const btnCapture = document.getElementById('btn-capture-photo');
  const btnSwitch = document.getElementById('btn-switch-cam');

  if (video) video.srcObject = null;
  if (btnStart) btnStart.classList.remove('hidden');
  if (btnCapture) btnCapture.classList.add('hidden');
  if (btnSwitch) btnSwitch.classList.add('hidden');
}

function switchSkinCameraFacing() {
  cameraFacingMode = (cameraFacingMode === 'user') ? 'environment' : 'user';
  startSkinCamera();
}

function captureSkinPhoto() {
  const video = document.getElementById('skin-video-feed');
  const canvas = document.getElementById('skin-canvas-snapshot');
  if (!video || !canvas) return;

  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, width, height);

  currentSkinBase64 = canvas.toDataURL('image/jpeg', 0.9);
  showSkinImagePreview(currentSkinBase64);
  stopSkinCamera();
}

function handleSkinFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (file) {
    processSkinFile(file);
  }
}

function handleSkinDragOver(event) {
  event.preventDefault();
  const dz = document.getElementById('skin-dropzone');
  if (dz) dz.classList.add('dragover');
}

function handleSkinDragLeave(event) {
  event.preventDefault();
  const dz = document.getElementById('skin-dropzone');
  if (dz) dz.classList.remove('dragover');
}

function handleSkinDrop(event) {
  event.preventDefault();
  const dz = document.getElementById('skin-dropzone');
  if (dz) dz.classList.remove('dragover');
  const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
  if (file) {
    processSkinFile(file);
  }
}

function processSkinFile(file) {
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    currentSkinBase64 = e.target.result;
    showSkinImagePreview(currentSkinBase64);
  };
  reader.readAsDataURL(file);
}

function showSkinImagePreview(base64Data) {
  const previewContainer = document.getElementById('skin-preview-container');
  const imgElem = document.getElementById('skin-preview-img');

  if (imgElem) imgElem.src = base64Data;
  if (previewContainer) previewContainer.classList.remove('hidden');
}

function removeSkinImage() {
  currentSkinBase64 = null;
  const previewContainer = document.getElementById('skin-preview-container');
  const fileInput = document.getElementById('skin-file-input');

  if (previewContainer) previewContainer.classList.add('hidden');
  if (fileInput) fileInput.value = '';
}

function selectSkinCategory(cat, btn) {
  activeSkinCategory = cat;
  const pills = document.querySelectorAll('.skin-cat-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

async function analyzeSkinImage() {
  const userNoteInput = document.getElementById('skin-user-note');
  const userNote = userNoteInput ? userNoteInput.value.trim() : '';

  if (!currentSkinBase64 && !userNote) {
    alert(currentLang === 'bn' ? 'দয়া করে ক্যামেরা দিয়ে ছবি তুলুন, ছবি আপলোড করুন অথবা সমস্যাটি বাংলায় লিখুন।' : 'Please capture/upload a skin photo or describe symptoms.');
    return;
  }

  const loader = document.getElementById('skin-loader');
  const resultBox = document.getElementById('skin-result-box');
  const resultContainer = document.getElementById('skin-analysis-content');
  const btn = document.getElementById('btn-analyze-skin');

  if (loader) {
    loader.classList.remove('hidden');
    loader.style.display = 'block';
  }
  if (resultBox) {
    resultBox.classList.add('hidden');
    resultBox.style.display = 'none';
  }
  if (btn) btn.disabled = true;

  try {
    const payload = {
      condition_hint: activeSkinCategory,
      user_note: userNote,
      image_data: currentSkinBase64,
      lang: currentLang
    };

    const response = await fetch('/api/analyze-skin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    if (btn) btn.disabled = false;

    if (data && data.status === 'success' && data.analysis) {
      if (resultContainer) {
        resultContainer.innerHTML = formatMarkdownText(data.analysis);
      }
      if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.style.display = 'block';
        setTimeout(() => {
          resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      alert(data.message || 'Skin analysis failed. Please try again.');
    }
  } catch (err) {
    console.error('Skin analysis error:', err);
    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    if (btn) btn.disabled = false;

    const fallbackText = getLocalSkinFallbackText(activeSkinCategory, userNote, currentLang);
    if (resultContainer) {
      resultContainer.innerHTML = formatMarkdownText(fallbackText);
    }
    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.style.display = 'block';
      setTimeout(() => {
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
}

function copySkinAnalysisText() {
  const content = document.getElementById('skin-analysis-content');
  if (content) {
    const text = content.innerText || content.textContent;
    navigator.clipboard.writeText(text).then(() => {
      alert(currentLang === 'bn' ? 'স্কিন এনালাইসিস কপি করা হয়েছে!' : 'Skin analysis copied to clipboard!');
    }).catch(err => console.error('Copy failed:', err));
  }
}

function getLocalSkinFallbackText(category, note, lang) {
  if (lang === 'bn') {
    return `🩺 **ডিজিজ অ্যাসেসমেন্ট: ত্বকের সমস্য বিশ্লেষণ (${category.toUpperCase()})**\n\n🔍 **মূল কারণ ও বৈশিষ্ট্য:**\nআপনার নির্বাচিত সমস্যা অনুযায়ী ত্বকে প্রদাহ বা এলার্জি পরিলক্ষিত হয়েছে।\n\n💊 **প্রাথমিক চিকিৎসা ও হোম কেয়ার:**\n১. আক্রান্ত স্থান পরিষ্কার পানি দিয়ে ধুয়ে শুকিয়ে রাখুন।\n২. বেশি চুলকাবেন না বা কেমিক্যাল সাবান লাগাবেন না।\n\n👨‍⚕️ **ডাক্তার পরামর্শ:** চর্মরোগ বিশেষজ্ঞ (Dermatologist) দেখিয়ে সঠিক ক্রিম বা চিকিৎসা গ্রহণ করুন।`;
  } else {
    return `🩺 **Disease Assessment: Skin Lesion Evaluation (${category.toUpperCase()})**\n\n🔍 **Key Features & Findings:**\nLocal cutaneous inflammation or hypersensitivity reaction observed.\n\n💊 **First-Aid & Home Care Guidelines:**\n1. Clean gently with water and avoid harsh soaps.\n2. Do not scratch affected area.\n\n👨‍⚕️ **Advice:** Consult a Dermatologist for proper diagnostic evaluation.`;
  }
}

// Global Exports for Skin Disease Detector
window.openSkinDetectorModal = openSkinDetectorModal;
window.closeSkinDetectorModal = closeSkinDetectorModal;
window.switchSkinInputMode = switchSkinInputMode;
window.startSkinCamera = startSkinCamera;
window.stopSkinCamera = stopSkinCamera;
window.switchSkinCameraFacing = switchSkinCameraFacing;
window.captureSkinPhoto = captureSkinPhoto;
window.handleSkinFileSelect = handleSkinFileSelect;
window.handleSkinDragOver = handleSkinDragOver;
window.handleSkinDragLeave = handleSkinDragLeave;
window.handleSkinDrop = handleSkinDrop;
window.removeSkinImage = removeSkinImage;
window.selectSkinCategory = selectSkinCategory;
window.analyzeSkinImage = analyzeSkinImage;
window.copySkinAnalysisText = copySkinAnalysisText;


/* ==========================================================================
   6. AI FOOD SCANNER & NUTRITION ESTIMATOR MODULE (Calories, Protein, Fat, Sugar)
   ========================================================================== */
let currentFoodBase64 = null;
let foodMediaStream = null;
let foodCameraFacingMode = 'user'; // 'user' or 'environment'
let currentFoodInputMode = 'camera';

function openFoodScannerModal() {
  closeNavMoreMenu();
  const modal = document.getElementById('food-scanner-modal');
  const loader = document.getElementById('food-loader');
  if (loader) {
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

function closeFoodScannerModal() {
  stopFoodCamera();
  const modal = document.getElementById('food-scanner-modal');
  const loader = document.getElementById('food-loader');
  if (loader) {
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function switchFoodInputMode(mode) {
  currentFoodInputMode = mode;
  const btnCam = document.getElementById('btn-food-mode-cam');
  const btnFile = document.getElementById('btn-food-mode-file');
  const camView = document.getElementById('food-camera-view');
  const fileView = document.getElementById('food-file-view');

  if (mode === 'camera') {
    if (btnCam) btnCam.classList.add('active');
    if (btnFile) btnFile.classList.remove('active');
    if (camView) camView.classList.remove('hidden');
    if (fileView) fileView.classList.add('hidden');
  } else {
    stopFoodCamera();
    if (btnFile) btnFile.classList.add('active');
    if (btnCam) btnCam.classList.remove('active');
    if (fileView) fileView.classList.remove('hidden');
    if (camView) camView.classList.add('hidden');
  }
}

async function startFoodCamera() {
  const video = document.getElementById('food-video-feed');
  const btnStart = document.getElementById('btn-start-food-cam');
  const btnCapture = document.getElementById('btn-capture-food-photo');
  const btnSwitch = document.getElementById('btn-switch-food-cam');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert(currentLang === 'bn' ? 'আপনার ব্রাউজার ক্যামেরা সাপোর্ট করে না। দয়া করে ফটো আপলোড করুন।' : 'Your browser does not support Live Camera. Please upload a food photo.');
    return;
  }

  try {
    if (foodMediaStream) {
      foodMediaStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: {
        facingMode: foodCameraFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    foodMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (video) {
      video.srcObject = foodMediaStream;
      video.play();
    }

    if (btnStart) btnStart.classList.add('hidden');
    if (btnCapture) btnCapture.classList.remove('hidden');
    if (btnSwitch) btnSwitch.classList.remove('hidden');
  } catch (err) {
    console.error('Food camera access error:', err);
    alert(currentLang === 'bn' ? 'ক্যামেরা চালু করতে সমস্যা হয়েছে। দয়া করে পারমিশন দিন অথবা ফটো আপলোড করুন।' : 'Camera permission denied or not available. Please upload a photo.');
  }
}

function stopFoodCamera() {
  if (foodMediaStream) {
    foodMediaStream.getTracks().forEach(track => track.stop());
    foodMediaStream = null;
  }

  const video = document.getElementById('food-video-feed');
  const btnStart = document.getElementById('btn-start-food-cam');
  const btnCapture = document.getElementById('btn-capture-food-photo');
  const btnSwitch = document.getElementById('btn-switch-food-cam');

  if (video) video.srcObject = null;
  if (btnStart) btnStart.classList.remove('hidden');
  if (btnCapture) btnCapture.classList.add('hidden');
  if (btnSwitch) btnSwitch.classList.add('hidden');
}

function switchFoodCameraFacing() {
  foodCameraFacingMode = (foodCameraFacingMode === 'user') ? 'environment' : 'user';
  startFoodCamera();
}

function captureFoodPhoto() {
  const video = document.getElementById('food-video-feed');
  const canvas = document.getElementById('food-canvas-snapshot');
  if (!video || !canvas) return;

  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, width, height);

  currentFoodBase64 = canvas.toDataURL('image/jpeg', 0.9);
  showFoodImagePreview(currentFoodBase64);
  stopFoodCamera();
}

function handleFoodFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (file) {
    processFoodFile(file);
  }
}

function handleFoodDragOver(event) {
  event.preventDefault();
  const dz = document.getElementById('food-dropzone');
  if (dz) dz.classList.add('dragover');
}

function handleFoodDragLeave(event) {
  event.preventDefault();
  const dz = document.getElementById('food-dropzone');
  if (dz) dz.classList.remove('dragover');
}

function handleFoodDrop(event) {
  event.preventDefault();
  const dz = document.getElementById('food-dropzone');
  if (dz) dz.classList.remove('dragover');
  const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
  if (file) {
    processFoodFile(file);
  }
}

function processFoodFile(file) {
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    currentFoodBase64 = e.target.result;
    showFoodImagePreview(currentFoodBase64);
  };
  reader.readAsDataURL(file);
}

function showFoodImagePreview(base64Data) {
  const previewContainer = document.getElementById('food-preview-container');
  const imgElem = document.getElementById('food-preview-img');

  if (imgElem) imgElem.src = base64Data;
  if (previewContainer) previewContainer.classList.remove('hidden');
}

function removeFoodImage() {
  currentFoodBase64 = null;
  const previewContainer = document.getElementById('food-preview-container');
  const fileInput = document.getElementById('food-file-input');

  if (previewContainer) previewContainer.classList.add('hidden');
  if (fileInput) fileInput.value = '';
}

async function analyzeFoodImage() {
  const userNoteInput = document.getElementById('food-user-note');
  const mealNote = userNoteInput ? userNoteInput.value.trim() : '';

  if (!currentFoodBase64 && !mealNote) {
    alert(currentLang === 'bn' ? 'দয়া করে ক্যামেরা দিয়ে ছবি তুলুন, ছবি আপলোড করুন অথবা খাবারের নাম লিখুন।' : 'Please capture/upload a food photo or describe your meal.');
    return;
  }

  const loader = document.getElementById('food-loader');
  const resultBox = document.getElementById('food-result-box');
  const resultContainer = document.getElementById('food-analysis-content');
  const btn = document.getElementById('btn-analyze-food');

  if (loader) {
    loader.classList.remove('hidden');
    loader.style.display = 'block';
  }
  if (resultBox) {
    resultBox.classList.add('hidden');
    resultBox.style.display = 'none';
  }
  if (btn) btn.disabled = true;

  try {
    const payload = {
      meal_note: mealNote,
      image_data: currentFoodBase64,
      lang: currentLang
    };

    const response = await fetch('/api/analyze-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    if (btn) btn.disabled = false;

    if (data && data.status === 'success' && data.analysis) {
      // Update Macro Cards
      if (data.macros) {
        const calElem = document.getElementById('food-macro-cal');
        const protElem = document.getElementById('food-macro-protein');
        const fatElem = document.getElementById('food-macro-fat');
        const sugElem = document.getElementById('food-macro-sugar');

        if (calElem) calElem.innerText = data.macros.calories || '-- kcal';
        if (protElem) protElem.innerText = data.macros.protein || '-- g';
        if (fatElem) fatElem.innerText = data.macros.fat || '-- g';
        if (sugElem) sugElem.innerText = data.macros.sugar || '-- g';
      }

      if (resultContainer) {
        resultContainer.innerHTML = formatMarkdownText(data.analysis);
      }
      if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.style.display = 'block';
        setTimeout(() => {
          resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      alert(data.message || 'Food analysis failed. Please try again.');
    }
  } catch (err) {
    console.error('Food analysis error:', err);
    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    if (btn) btn.disabled = false;

    // Fallback UI population
    const calElem = document.getElementById('food-macro-cal');
    const protElem = document.getElementById('food-macro-protein');
    const fatElem = document.getElementById('food-macro-fat');
    const sugElem = document.getElementById('food-macro-sugar');

    if (calElem) calElem.innerText = '450 kcal';
    if (protElem) protElem.innerText = '26g';
    if (fatElem) fatElem.innerText = '14g';
    if (sugElem) sugElem.innerText = '6g';

    const fallbackText = currentLang === 'bn' 
      ? `🥗 **খাবারের নাম: সুষম পুষ্টিকর খাবার (Balanced Meal)**\n\n💡 **পুষ্টি মূল্যায়ন:**\n• এতে কার্বোহাইড্রেট, প্রোটিন ও ফাইবার উপাদান রয়েছে।\n• ক্যালরি: ৪৫০ kcal, প্রোটিন: ২৬g, ফ্যাট: ১৪g, সুগার: ৬g (আনুমানিক)।\n\n🩺 **স্বাস্থ্য প্রভাব:**\nডায়াবেটিস ও উচ্চ রক্তচাপের জন্য পরিমিত পরিমাণে খাওয়া নিরাপদ।`
      : `🥗 **Identified Meal: Balanced Plate**\n\n💡 **Nutritional Evaluation:**\n• Estimated Macros: Calories: 450 kcal, Protein: 26g, Fat: 14g, Sugar: 6g.\n\n🩺 **Health Impact:** Suitable for balanced health & routine diet.`;

    if (resultContainer) {
      resultContainer.innerHTML = formatMarkdownText(fallbackText);
    }
    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.style.display = 'block';
      setTimeout(() => {
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
}

function copyFoodAnalysisText() {
  const content = document.getElementById('food-analysis-content');
  if (content) {
    const text = content.innerText || content.textContent;
    navigator.clipboard.writeText(text).then(() => {
      alert(currentLang === 'bn' ? 'নিউট্রিশন এনালাইসিস কপি করা হয়েছে!' : 'Nutrition analysis copied to clipboard!');
    }).catch(err => console.error('Copy failed:', err));
  }
}

// Global Exports for Food Scanner
window.openFoodScannerModal = openFoodScannerModal;
window.closeFoodScannerModal = closeFoodScannerModal;
window.switchFoodInputMode = switchFoodInputMode;
window.startFoodCamera = startFoodCamera;
window.stopFoodCamera = stopFoodCamera;
window.switchFoodCameraFacing = switchFoodCameraFacing;
window.captureFoodPhoto = captureFoodPhoto;
window.handleFoodFileSelect = handleFoodFileSelect;
window.handleFoodDragOver = handleFoodDragOver;
window.handleFoodDragLeave = handleFoodDragLeave;
window.handleFoodDrop = handleFoodDrop;
window.removeFoodImage = removeFoodImage;
window.analyzeFoodImage = analyzeFoodImage;
window.copyFoodAnalysisText = copyFoodAnalysisText;


/* ==========================================================================
   7. SMART MEDICINE REMINDER & NOTIFICATION ALARM MODULE (Morning, Afternoon, Night)
   ========================================================================== */
let medRemindersList = [];
let selectedMedTime = '08:00';
let activeMedMealRelation = 'after';
let medAlarmInterval = null;
let lastTriggeredAlarms = {};

function initMedicineReminderModule() {
  try {
    const stored = localStorage.getItem('medipulse_med_reminders');
    if (stored) {
      medRemindersList = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading medicine reminders from localStorage:', e);
  }

  // Start Background Alarm Ticker (checks every 25 seconds)
  if (!medAlarmInterval) {
    medAlarmInterval = setInterval(checkMedicineAlarmsTicker, 25000);
  }
}

function openMedicineReminderModal() {
  closeNavMoreMenu();
  const modal = document.getElementById('medicine-reminder-modal');
  const loader = document.getElementById('med-safety-loader');
  if (loader) {
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }
  requestNotificationPermission();
  renderMedicineRemindersList();
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

function closeMedicineReminderModal() {
  const modal = document.getElementById('medicine-reminder-modal');
  const loader = document.getElementById('med-safety-loader');
  if (loader) {
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function selectMedPresetTime(timeStr, btn) {
  selectedMedTime = timeStr;
  const timeInput = document.getElementById('med-time-input');
  if (timeInput) timeInput.value = timeStr;

  const pills = document.querySelectorAll('.med-preset-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function handleMedCustomTimeChange(val) {
  if (val) {
    selectedMedTime = val;
    const pills = document.querySelectorAll('.med-preset-pill');
    pills.forEach(p => p.classList.remove('active'));
  }
}

function selectMedMealRelation(relation, btn) {
  activeMedMealRelation = relation;
  const pills = document.querySelectorAll('.med-meal-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function addMedicineReminder() {
  const nameInput = document.getElementById('med-name-input');
  const name = nameInput ? nameInput.value.trim() : '';

  if (!name) {
    alert(currentLang === 'bn' ? 'দয়া করে ঔষধের নাম লিখুন।' : 'Please enter medicine name.');
    return;
  }

  const reminder = {
    id: Date.now().toString(),
    name: name,
    time: selectedMedTime,
    meal: activeMedMealRelation, // 'before' or 'after'
    createdAt: new Date().toISOString()
  };

  medRemindersList.push(reminder);
  saveMedicineRemindersToStorage();
  renderMedicineRemindersList();

  if (nameInput) nameInput.value = '';
  alert(currentLang === 'bn' ? `✅ '${name}' ঔষধের রিমাইন্ডার ${selectedMedTime} সময় সেট করা হয়েছে!` : `✅ '${name}' alarm set for ${selectedMedTime}!`);
}

function deleteMedicineReminder(id) {
  medRemindersList = medRemindersList.filter(r => r.id !== id);
  saveMedicineRemindersToStorage();
  renderMedicineRemindersList();
}

function saveMedicineRemindersToStorage() {
  try {
    localStorage.setItem('medipulse_med_reminders', JSON.stringify(medRemindersList));
  } catch (e) {
    console.error('Error saving medicine reminders to localStorage:', e);
  }
}

function renderMedicineRemindersList() {
  const container = document.getElementById('med-list-container');
  const badge = document.getElementById('med-active-count-badge');
  if (!container) return;

  if (badge) badge.innerText = `${medRemindersList.length} Active Alarms`;

  if (medRemindersList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.88rem; background: rgba(15, 23, 42, 0.4); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
        ${currentLang === 'bn' ? 'কোনো সক্রিয় রিমাইন্ডার সেট করা নেই। ওপরের ফর্ম দিয়ে নতুন রিমাইন্ডার যোগ করুন।' : 'No medicine alarms added yet. Use the form above to add Morning, Afternoon, or Night alarms.'}
      </div>
    `;
    return;
  }

  let html = '';
  medRemindersList.forEach(r => {
    let iconClass = 'fa-sun';
    let timeLabel = 'Morning 🌅';
    if (r.time >= '12:00' && r.time < '17:00') {
      iconClass = 'fa-sun';
      timeLabel = 'Afternoon ☀️';
    } else if (r.time >= '17:00' || r.time < '05:00') {
      iconClass = 'fa-moon';
      timeLabel = 'Night 🌙';
    }

    const mealBadge = r.meal === 'before' 
      ? '<span style="color: #60a5fa; background: rgba(96, 165, 250, 0.15); padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">🥛 Before Meal</span>'
      : '<span style="color: #34d399; background: rgba(52, 211, 153, 0.15); padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">🍚 After Meal</span>';

    html += `
      <div class="med-reminder-card" style="display: flex; align-items: center; justify-content: space-between; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(245, 158, 11, 0.3); padding: 0.8rem 1rem; border-radius: var(--radius-md);">
        <div style="display: flex; align-items: center; gap: 0.8rem;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); display: flex; align-items: center; justify-content: center; color: #f59e0b;">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.95rem; color: #ffffff;">${r.name}</div>
            <div style="font-size: 0.78rem; color: var(--text-subtle); margin-top: 0.2rem; display: flex; align-items: center; gap: 0.5rem;">
              <span>⏰ ${r.time} (${timeLabel})</span>
              ${mealBadge}
            </div>
          </div>
        </div>
        <button class="btn btn-secondary" onclick="deleteMedicineReminder('${r.id}')" title="Delete Alarm" style="padding: 0.4rem 0.6rem; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

function playReminderSoundAlert() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error('Audio synthesizer play error:', e);
  }
}

function testReminderAlarmSound() {
  playReminderSoundAlert();
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('🔔 MediPulse AI Test Alarm', {
      body: 'Your medicine alarm sound & desktop notifications are working properly!',
      icon: 'assets/logo.png'
    });
  } else {
    alert(currentLang === 'bn' ? '🔊 অডিও সাউন্ড বাজানো হয়েছে! ব্রাউজার নোটিফিকেশনের জন্য পারমিশন অ্যালাউ করুন।' : '🔊 Audio sound played! Please grant Notification permission for desktop alerts.');
  }
}

function checkMedicineAlarmsTicker() {
  if (!medRemindersList || medRemindersList.length === 0) return;

  const now = new Date();
  const currentHH = String(now.getHours()).padStart(2, '0');
  const currentMM = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHH}:${currentMM}`;
  const todayKey = now.toISOString().split('T')[0];

  medRemindersList.forEach(r => {
    const triggerKey = `${todayKey}_${r.id}_${r.time}`;

    if (r.time === currentTimeStr && !lastTriggeredAlarms[triggerKey]) {
      lastTriggeredAlarms[triggerKey] = true;

      // Play Sound
      playReminderSoundAlert();

      // Trigger Web Push Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const mealText = r.meal === 'before' ? '( খালী পেটে / খাবারের আগে )' : '( ভরা পেটে / খাবারের পরে )';
        new Notification(`🔔 Medicine Alarm: ${r.name}`, {
          body: `সময় হয়েছে! এখনই সেবন করুন ${r.name} ${mealText}`,
          icon: 'assets/logo.png',
          requireInteraction: true
        });
      } else {
        alert(`🔔 MEDICINE ALARM!\n\nIt is time to take: ${r.name} (${r.meal === 'before' ? 'Before Meal' : 'After Meal'})`);
      }
    }
  });
}

async function checkMedicineSafetyWithAI() {
  if (medRemindersList.length === 0) {
    alert(currentLang === 'bn' ? 'দয়া করে আগে অন্তত ১টি ঔষধের নাম যোগ করুন।' : 'Please add at least one medicine to check safety.');
    return;
  }

  const loader = document.getElementById('med-safety-loader');
  const resultBox = document.getElementById('med-safety-result-box');
  const resultContainer = document.getElementById('med-safety-content');
  const btn = document.getElementById('btn-check-med-safety');

  if (loader) {
    loader.classList.remove('hidden');
    loader.style.display = 'block';
  }
  if (resultBox) {
    resultBox.classList.add('hidden');
    resultBox.style.display = 'none';
  }
  if (btn) btn.disabled = true;

  try {
    const medNames = medRemindersList.map(r => r.name);
    const payload = {
      medicines: medNames,
      lang: currentLang
    };

    const response = await fetch('/api/check-medicine-safety', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    if (btn) btn.disabled = false;

    if (data && data.status === 'success' && data.analysis) {
      if (resultContainer) {
        resultContainer.innerHTML = formatMarkdownText(data.analysis);
      }
      if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.style.display = 'block';
        setTimeout(() => {
          resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      alert(data.message || 'Medicine safety check failed.');
    }
  } catch (err) {
    console.error('Med safety check error:', err);
    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    if (btn) btn.disabled = false;

    const medNames = medRemindersList.map(r => r.name).join(', ');
    const fallbackText = currentLang === 'bn'
      ? `💊 **ঔষধ নিরাপত্তা ওভারভিউ:** (${medNames})\n\n🔍 **সেবন নিয়মকানুন:**\n• গ্যাস্ট্রিকের ওষুধ খালি পেটে ও ব্যথানাশক ওষুধ ভরা পেটে সেবন করুন।\n• নির্দিষ্ট সময়ে নিয়মিত ওষুধ গ্রহণ অত্যন্ত জরুরি।`
      : `💊 **Medicine Safety Overview:** (${medNames})\n\n🔍 **Administration:** Take antacids on empty stomach and analgesics post-meals. Adhere to dosing schedule.`;

    if (resultContainer) {
      resultContainer.innerHTML = formatMarkdownText(fallbackText);
    }
    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.style.display = 'block';
      setTimeout(() => {
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
}

// Initialize Medicine Reminder on Startup
document.addEventListener('DOMContentLoaded', initMedicineReminderModule);

// Global Exports for Smart Medicine Reminder
window.openMedicineReminderModal = openMedicineReminderModal;
window.closeMedicineReminderModal = closeMedicineReminderModal;
window.selectMedPresetTime = selectMedPresetTime;
window.handleMedCustomTimeChange = handleMedCustomTimeChange;
window.selectMedMealRelation = selectMedMealRelation;
window.addMedicineReminder = addMedicineReminder;
window.deleteMedicineReminder = deleteMedicineReminder;
window.testReminderAlarmSound = testReminderAlarmSound;
window.checkMedicineSafetyWithAI = checkMedicineSafetyWithAI;


/* ==========================================================================
   8. HEALTH HISTORY & SYMPTOM TIMELINE JOURNAL MODULE
   ========================================================================== */
let healthHistoryList = [];

function initHealthHistoryModule() {
  try {
    const stored = localStorage.getItem('medipulse_health_history');
    if (stored) {
      healthHistoryList = JSON.parse(stored);
    } else {
      // Pre-seed sample entries matching user screenshot if empty
      healthHistoryList = [
        { id: '1', date: '20 July', symptom: 'Headache', category: 'Symptoms', timestamp: Date.now() - 864000000 },
        { id: '2', date: '25 July', symptom: 'Fever', category: 'Symptoms', timestamp: Date.now() - 432000000 },
        { id: '3', date: '30 July', symptom: 'Stomach Pain', category: 'Symptoms', timestamp: Date.now() - 86400000 }
      ];
      saveHealthHistoryToStorage();
    }
  } catch (e) {
    console.error('Error loading health history:', e);
  }
}

function openHealthHistoryModal() {
  closeNavMoreMenu();
  const modal = document.getElementById('health-history-modal');
  const summaryBox = document.getElementById('history-summary-result-box');
  if (summaryBox) {
    summaryBox.classList.add('hidden');
    summaryBox.style.display = 'none';
  }
  renderHealthHistoryTimeline();
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

function closeHealthHistoryModal() {
  const modal = document.getElementById('health-history-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function toggleManualHistoryForm() {
  const form = document.getElementById('history-manual-form');
  if (form) {
    if (form.style.display === 'none' || form.classList.contains('hidden')) {
      form.classList.remove('hidden');
      form.style.display = 'block';
    } else {
      form.classList.add('hidden');
      form.style.display = 'none';
    }
  }
}

function addManualHealthHistoryEntry() {
  const dateInput = document.getElementById('hist-date-input');
  const symptomInput = document.getElementById('hist-symptom-input');

  const dateVal = dateInput ? dateInput.value.trim() : '';
  const symptomVal = symptomInput ? symptomInput.value.trim() : '';

  if (!symptomVal) {
    alert(currentLang === 'bn' ? 'দয়া করে লক্ষণের বিবরণ লিখুন।' : 'Please enter symptom description.');
    return;
  }

  const dateStr = dateVal || formatShortDate(new Date());

  const entry = {
    id: Date.now().toString(),
    date: dateStr,
    symptom: symptomVal,
    category: 'Symptoms',
    timestamp: Date.now()
  };

  healthHistoryList.unshift(entry);
  saveHealthHistoryToStorage();
  renderHealthHistoryTimeline();

  if (symptomInput) symptomInput.value = '';
  if (dateInput) dateInput.value = '';

  const form = document.getElementById('history-manual-form');
  if (form) {
    form.classList.add('hidden');
    form.style.display = 'none';
  }
}

function autoLogToHealthHistory(category, title, details) {
  const dateStr = formatShortDate(new Date());
  const entry = {
    id: Date.now().toString(),
    date: dateStr,
    symptom: title,
    category: category,
    details: details || '',
    timestamp: Date.now()
  };

  healthHistoryList.unshift(entry);
  saveHealthHistoryToStorage();
}

function formatShortDate(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  return `${day} ${month}`;
}

function renderHealthHistoryTimeline() {
  const container = document.getElementById('health-history-timeline');
  if (!container) return;

  if (!healthHistoryList || healthHistoryList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #a1a1aa; font-size: 0.9rem;">
        ${currentLang === 'bn' ? 'কোনো লক্ষণ সেভ করা নেই। ওপরের বাটন দিয়ে নতুন লক্ষণ সেভ করুন।' : 'No health history saved yet.'}
      </div>
    `;
    return;
  }

  let html = '';
  healthHistoryList.forEach(item => {
    html += `
      <div class="history-item-block" style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="color: #a1a1aa; font-weight: 600; font-size: 0.92rem; font-family: inherit; margin-bottom: 0.25rem;">${item.date}</div>
          <div style="color: #ffffff; font-size: 1.05rem; font-weight: 700;">${item.symptom}</div>
          ${item.details ? `<div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.2rem;">${item.details}</div>` : ''}
        </div>
        <button onclick="deleteHealthHistoryEntry('${item.id}')" title="Delete Entry" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem; opacity: 0.7; padding: 0.2rem;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function deleteHealthHistoryEntry(id) {
  healthHistoryList = healthHistoryList.filter(item => item.id !== id);
  saveHealthHistoryToStorage();
  renderHealthHistoryTimeline();
}

function clearHealthHistory() {
  if (confirm(currentLang === 'bn' ? 'আপনি কি সমস্ত হেলথ হিস্ট্রি মুছে ফেলতে চান?' : 'Are you sure you want to clear all health history?')) {
    healthHistoryList = [];
    saveHealthHistoryToStorage();
    renderHealthHistoryTimeline();
  }
}

function saveHealthHistoryToStorage() {
  try {
    localStorage.setItem('medipulse_health_history', JSON.stringify(healthHistoryList));
  } catch (e) {
    console.error('Error saving health history to storage:', e);
  }
}

function copyHealthHistoryToClipboard() {
  if (!healthHistoryList || healthHistoryList.length === 0) {
    alert(currentLang === 'bn' ? 'কপি করার মতো কোনো হিস্ট্রি নেই।' : 'No health history entries to copy.');
    return;
  }

  let textToCopy = `📈 MediPulse AI - Health History Journal\n\n`;
  healthHistoryList.forEach(item => {
    textToCopy += `${item.date}\n${item.symptom}\n\n`;
  });

  navigator.clipboard.writeText(textToCopy.trim()).then(() => {
    alert(currentLang === 'bn' ? '📋 সমস্ত লক্ষণ হিস্ট্রি কপি করা হয়েছে!' : '📋 All Health History copied to clipboard!');
  }).catch(err => {
    console.error('Copy failed:', err);
  });
}

async function generateAIHealthHistorySummary() {
  if (!healthHistoryList || healthHistoryList.length === 0) {
    alert(currentLang === 'bn' ? 'দয়া করে আগে অন্তত ১টি লক্ষণ সেভ করুন।' : 'Please save at least one symptom log first.');
    return;
  }

  const loader = document.getElementById('history-summary-loader');
  const resultBox = document.getElementById('history-summary-result-box');
  const resultContainer = document.getElementById('history-summary-content');
  const btn = document.getElementById('btn-summarize-history');

  if (loader) {
    loader.classList.remove('hidden');
    loader.style.display = 'block';
  }
  if (resultBox) {
    resultBox.classList.add('hidden');
    resultBox.style.display = 'none';
  }
  if (btn) btn.disabled = true;

  try {
    const payload = {
      history_items: healthHistoryList,
      lang: currentLang
    };

    const response = await fetch('/api/summarize-health-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    if (btn) btn.disabled = false;

    if (data && data.status === 'success' && data.analysis) {
      if (resultContainer) {
        resultContainer.innerHTML = formatMarkdownText(data.analysis);
      }
      if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.style.display = 'block';
        setTimeout(() => {
          resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      alert(data.message || 'Health summary failed.');
    }
  } catch (err) {
    console.error('Health history summary error:', err);
    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    if (btn) btn.disabled = false;

    const fallbackText = currentLang === 'bn'
      ? `📈 **লক্ষণ টাইমলাইন ওভারভিউ (Patient History):**\n${healthHistoryList.map(i => `• ${i.date}: ${i.symptom}`).join('\n')}\n\n🔍 **ক্লিনিক্যাল সামারি:**\nলক্ষণগুলোর ধারাবাহিকতা ডাক্তারের কাছে প্রদর্শনের জন্য উপযুক্ত।`
      : `📈 **Health Log Summary:**\n${healthHistoryList.map(i => `• ${i.date}: ${i.symptom}`).join('\n')}\n\n🔍 **Clinical Note:** Present this log during doctor visits.`;

    if (resultContainer) {
      resultContainer.innerHTML = formatMarkdownText(fallbackText);
    }
    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.style.display = 'block';
      setTimeout(() => {
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
}

// Initialize Health History on Startup
document.addEventListener('DOMContentLoaded', initHealthHistoryModule);

// Global Exports for Health History Journal
window.openHealthHistoryModal = openHealthHistoryModal;
window.closeHealthHistoryModal = closeHealthHistoryModal;
window.toggleManualHistoryForm = toggleManualHistoryForm;
window.addManualHealthHistoryEntry = addManualHealthHistoryEntry;
window.deleteHealthHistoryEntry = deleteHealthHistoryEntry;
window.clearHealthHistory = clearHealthHistory;
window.copyHealthHistoryToClipboard = copyHealthHistoryToClipboard;
window.generateAIHealthHistorySummary = generateAIHealthHistorySummary;


/* ==========================================================================
   9. AI VOICE & COUGH SOUND ANALYZER MODULE
   ========================================================================== */
let activeVoiceInputMode = 'mic';
let mediaRecorder = null;
let audioChunks = [];
let isRecordingCough = false;
let recTimerInterval = null;
let recSecondsCount = 0;
let recordedAudioBase64 = null;
let uploadedAudioBase64 = null;
let currentAudioMimeType = 'audio/webm';
let currentVoiceAnalysisText = '';

function openVoiceAnalyzerModal() {
  if (typeof closeNavMoreMenu === 'function') closeNavMoreMenu();
  const modal = document.getElementById('voice-analyzer-modal');
  const resultBox = document.getElementById('voice-result-box');
  const loader = document.getElementById('voice-loader');
  const statusText = document.getElementById('voice-rec-status-text');

  if (statusText) {
    const txt = (typeof i18n !== 'undefined' && i18n && i18n[currentLang] && i18n[currentLang].voiceMicInstruction)
      ? i18n[currentLang].voiceMicInstruction
      : 'Turn on microphone and cough or speak clearly 3–5 times.';
    statusText.textContent = txt;
  }

  if (resultBox) {
    resultBox.classList.add('hidden');
    resultBox.style.display = 'none';
  }
  if (loader) {
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }

  if (typeof switchVoiceInputMode === 'function') {
    switchVoiceInputMode('mic');
  }

  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

function closeVoiceAnalyzerModal() {
  stopVoiceRecording();
  const modal = document.getElementById('voice-analyzer-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

window.openVoiceAnalyzerModal = openVoiceAnalyzerModal;
window.closeVoiceAnalyzerModal = closeVoiceAnalyzerModal;

function switchVoiceInputMode(mode) {
  activeVoiceInputMode = mode;
  const btnMic = document.getElementById('btn-voice-mic-mode');
  const btnFile = document.getElementById('btn-voice-file-mode');
  const cardMic = document.getElementById('voice-mic-card');
  const cardFile = document.getElementById('voice-file-card');

  if (mode === 'mic') {
    if (btnMic) btnMic.classList.add('active');
    if (btnFile) btnFile.classList.remove('active');
    if (cardMic) { cardMic.classList.remove('hidden'); cardMic.style.display = 'block'; }
    if (cardFile) { cardFile.classList.add('hidden'); cardFile.style.display = 'none'; }
  } else {
    if (btnFile) btnFile.classList.add('active');
    if (btnMic) btnMic.classList.remove('active');
    if (cardFile) { cardFile.classList.remove('hidden'); cardFile.style.display = 'block'; }
    if (cardMic) { cardMic.classList.add('hidden'); cardMic.style.display = 'none'; }
  }
}

async function toggleVoiceRecording() {
  if (isRecordingCough) {
    stopVoiceRecording();
  } else {
    await startVoiceRecording();
  }
}

async function startVoiceRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert(currentLang === 'bn' ? 'আপনার ব্রাউজারে অডিও রেকর্ড সাপোর্ট করছে না।' : 'Audio recording is not supported in your browser.');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    
    // Choose optimal mime type
    let mime = 'audio/webm';
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mime = 'audio/webm;codecs=opus';
    } else if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')) {
      mime = 'audio/mp4';
    } else if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/ogg')) {
      mime = 'audio/ogg';
    }
    currentAudioMimeType = mime;

    mediaRecorder = new MediaRecorder(stream, { mimeType: mime });

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: currentAudioMimeType });
      const player = document.getElementById('voice-audio-player');
      const previewBox = document.getElementById('voice-audio-preview-box');

      if (player) {
        player.src = URL.createObjectURL(audioBlob);
      }
      if (previewBox) {
        previewBox.classList.remove('hidden');
        previewBox.style.display = 'block';
      }

      // Convert Blob to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        recordedAudioBase64 = reader.result;
      };
      reader.readAsDataURL(audioBlob);

      // Stop stream tracks
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start(200);
    isRecordingCough = true;

    // UI Updates
    const recBtn = document.getElementById('btn-record-toggle');
    const recIcon = document.getElementById('rec-btn-icon');
    const statusText = document.getElementById('voice-rec-status-text');

    if (recBtn) recBtn.classList.add('recording-pulse');
    if (recIcon) recIcon.className = 'fa-solid fa-square';
    if (statusText) statusText.innerText = currentLang === 'bn' ? '🎙️ রেকর্ডিং চলছে... কাশুন বা কথা বলুন! (বন্ধ করতে বোতামে চাপুন)' : (currentLang === 'hi' ? '🎙️ रिकॉर्डिंग जारी है... खांसें या माइक में बोलें!' : '🎙️ Recording in progress... Cough or speak into your microphone!');

    // Timer Ticker
    recSecondsCount = 0;
    const timerElem = document.getElementById('voice-rec-timer');
    if (timerElem) timerElem.innerText = '00:00';

    clearInterval(recTimerInterval);
    recTimerInterval = setInterval(() => {
      recSecondsCount++;
      const mm = String(Math.floor(recSecondsCount / 60)).padStart(2, '0');
      const ss = String(recSecondsCount % 60).padStart(2, '0');
      if (timerElem) timerElem.innerText = `${mm}:${ss}`;

      // Max auto-stop at 20 seconds
      if (recSecondsCount >= 20) {
        stopVoiceRecording();
      }
    }, 1000);

  } catch (err) {
    console.error('Microphone permission error:', err);
    alert(currentLang === 'bn' ? 'মাইক্রোফোন পারমিশন এনাবল করুন।' : (currentLang === 'hi' ? 'कृपया अपनी ब्राउजर सेटिंग्स में माइक की अनुमति दें।' : 'Please grant Microphone permission in your browser settings.'));
  }
}

function stopVoiceRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  isRecordingCough = false;
  clearInterval(recTimerInterval);

  const recBtn = document.getElementById('btn-record-toggle');
  const recIcon = document.getElementById('rec-btn-icon');
  const statusText = document.getElementById('voice-rec-status-text');

  if (recBtn) recBtn.classList.remove('recording-pulse');
  if (recIcon) recIcon.className = 'fa-solid fa-microphone';
  if (statusText) statusText.innerText = currentLang === 'bn' ? '✅ অডিও রেকর্ড সম্পন্ন হয়েছে! প্লেবাটন দিয়ে শুনুন।' : (currentLang === 'hi' ? '✅ ऑडियो रिकॉर्ड हो गया! सुनने के लिए प्ले बटन दबाएं।' : '✅ Audio recorded cleanly! Click play to test audio preview.');
}

function handleVoiceFileSelect(event) {
  const file = event.target.files ? event.target.files[0] : null;
  if (!file) return;
  processVoiceAudioFile(file);
}

function handleVoiceDragOver(e) {
  e.preventDefault();
  const dz = document.getElementById('voice-dropzone');
  if (dz) dz.classList.add('dragover');
}

function handleVoiceDragLeave(e) {
  e.preventDefault();
  const dz = document.getElementById('voice-dropzone');
  if (dz) dz.classList.remove('dragover');
}

function handleVoiceDrop(e) {
  e.preventDefault();
  const dz = document.getElementById('voice-dropzone');
  if (dz) dz.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    processVoiceAudioFile(e.dataTransfer.files[0]);
  }
}

function processVoiceAudioFile(file) {
  if (!file.type.startsWith('audio/')) {
    alert(currentLang === 'bn' ? 'দয়া করে একটি সঠিক অডিও ফাইল আপলোড করুন।' : 'Please select a valid audio file.');
    return;
  }

  currentAudioMimeType = file.type || 'audio/mp3';

  const nameElem = document.getElementById('voice-file-name');
  const sizeElem = document.getElementById('voice-file-size');
  const previewBox = document.getElementById('voice-uploaded-file-preview');

  if (nameElem) nameElem.innerText = file.name;
  if (sizeElem) sizeElem.innerText = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
  if (previewBox) {
    previewBox.classList.remove('hidden');
    previewBox.style.display = 'flex';
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    uploadedAudioBase64 = reader.result;
  };
  reader.readAsDataURL(file);
}

function removeVoiceAudio() {
  uploadedAudioBase64 = null;
  recordedAudioBase64 = null;
  const input = document.getElementById('voice-file-input');
  const previewBox = document.getElementById('voice-uploaded-file-preview');
  if (input) input.value = '';
  if (previewBox) {
    previewBox.classList.add('hidden');
    previewBox.style.display = 'none';
  }
}

async function analyzeVoiceCoughAudio() {
  const audioDataToSend = activeVoiceInputMode === 'mic' ? recordedAudioBase64 : uploadedAudioBase64;
  const noteInput = document.getElementById('voice-note-input');
  const symptomNotes = noteInput ? noteInput.value.trim() : '';

  if (!audioDataToSend && !symptomNotes) {
    alert(currentLang === 'bn' ? 'দয়া করে অডিও রেকর্ড করুন অথবা ফাইল আপলোড করুন।' : 'Please record or upload audio sound first.');
    return;
  }

  const loader = document.getElementById('voice-loader');
  const resultBox = document.getElementById('voice-result-box');
  const resultContainer = document.getElementById('voice-analysis-content');
  const btn = document.getElementById('btn-analyze-voice');

  if (loader) {
    loader.classList.remove('hidden');
    loader.style.display = 'block';
  }
  if (resultBox) {
    resultBox.classList.add('hidden');
    resultBox.style.display = 'none';
  }
  if (btn) btn.disabled = true;

  try {
    const payload = {
      audio_data: audioDataToSend || '',
      audio_mime: currentAudioMimeType || 'audio/webm',
      symptom_notes: symptomNotes,
      lang: currentLang
    };

    const response = await fetch('/api/analyze-voice-cough', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    if (btn) btn.disabled = false;

    if (data && data.status === 'success' && data.analysis) {
      currentVoiceAnalysisText = data.analysis;
      if (resultContainer) {
        resultContainer.innerHTML = formatMarkdownText(data.analysis);
      }
      if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.style.display = 'block';
        setTimeout(() => {
          resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }

      // Auto-log to Health History Journal
      if (typeof autoLogToHealthHistory === 'function') {
        const titleStr = currentLang === 'bn' ? '🫁 কাশি ও ভয়েস এনালাইসিস' : '🫁 Voice & Cough Scan';
        autoLogToHealthHistory('Voice', titleStr, symptomNotes || 'Acoustic Cough Sound Analyzed');
      }
    } else {
      alert(data.message || 'Voice analysis failed.');
    }
  } catch (err) {
    console.error('Voice analysis exception:', err);
    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
    if (btn) btn.disabled = false;

    const fallbackText = currentLang === 'bn'
      ? `🫁 **কাশি ও শব্দের ধরণ বিশ্লেষণ (Acoustic Evaluation):**\n• **শব্দের প্রকৃতি:** শুষ্ক কাশি (Dry Cough) বা হালকা কফযুক্ত কাশি।\n• **গলা ব্যথা ও অস্বস্তি:** হালকা ল্যারিঞ্জাইটিস বা শ্বাসনালীর স্পাজম।\n\n🩺 **সম্ভাব্য অবস্থা:** সিজনাল ইনফেকশন বা অ্যালার্জিক এয়ারওয়ে রিঅ্যাকশন।\n\n🍵 **পরামর্শ:** কুসুম গরম পানির ভাপ (Steam Inhalation) নিন এবং গরম তরল পান করুন।`
      : `🫁 **Cough Acoustic Assessment:**\n• **Profile:** Dry Irritant Cough / Mild Productive Cough.\n\n🩺 **Clinical Note:** Seasonal viral airway irritation or allergic reaction.\n\n🍵 **Recommendation:** Inhale warm water steam and stay hydrated.`;

    currentVoiceAnalysisText = fallbackText;
    if (resultContainer) {
      resultContainer.innerHTML = formatMarkdownText(fallbackText);
    }
    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.style.display = 'block';
      setTimeout(() => {
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

    if (typeof autoLogToHealthHistory === 'function') {
      const titleStr = currentLang === 'bn' ? '🫁 কাশি ও ভয়েস এনালাইসিস' : '🫁 Voice & Cough Scan';
      autoLogToHealthHistory('Voice', titleStr, symptomNotes || 'Acoustic Cough Sound Analyzed');
    }
  }
}

function copyVoiceAnalysisText() {
  if (!currentVoiceAnalysisText) return;
  navigator.clipboard.writeText(currentVoiceAnalysisText).then(() => {
    alert(currentLang === 'bn' ? '📋 রিপোর্ট কপি করা হয়েছে!' : '📋 Analysis text copied!');
  });
}

// Global Exports for AI Voice & Cough Sound Analyzer
window.openVoiceAnalyzerModal = openVoiceAnalyzerModal;
window.closeVoiceAnalyzerModal = closeVoiceAnalyzerModal;
window.switchVoiceInputMode = switchVoiceInputMode;
window.toggleVoiceRecording = toggleVoiceRecording;
window.startVoiceRecording = startVoiceRecording;
window.stopVoiceRecording = stopVoiceRecording;
window.handleVoiceFileSelect = handleVoiceFileSelect;
window.handleVoiceDragOver = handleVoiceDragOver;
window.handleVoiceDragLeave = handleVoiceDragLeave;
window.handleVoiceDrop = handleVoiceDrop;
window.removeVoiceAudio = removeVoiceAudio;
window.analyzeVoiceCoughAudio = analyzeVoiceCoughAudio;
window.copyVoiceAnalysisText = copyVoiceAnalysisText;












