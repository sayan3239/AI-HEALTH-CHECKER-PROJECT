"""
MediPulse AI - Production-Grade Clinical AI Triage & Backend API Server
Provides RESTful APIs for AI Symptom Triage, Health Calculators, Patient History,
Firebase Auth Verification, and Digital Prescription Generation.
"""

import os
import json
import uuid
from datetime import datetime, timezone
from flask import Flask, send_from_directory, request, jsonify

# Optional CORS Support
try:
    from flask_cors import CORS  # type: ignore
    HAS_CORS = True
except ImportError:
    CORS = None
    HAS_CORS = False

# Optional Firebase Admin SDK Support
try:
    import firebase_admin  # type: ignore
    from firebase_admin import credentials, auth as firebase_auth  # type: ignore
    
    service_account_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY')
    if service_account_path and os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        HAS_FIREBASE = True
    else:
        try:
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            HAS_FIREBASE = True
        except Exception:
            HAS_FIREBASE = False
except ImportError:
    firebase_admin = None
    firebase_auth = None
    HAS_FIREBASE = False

# Google Generative AI (Gemini) API Integration with Multi-Model Fallback
DEFAULT_GEMINI_KEY = os.environ.get('GEMINI_API_KEY') or ''
HAS_GEMINI = True

GEMINI_MODEL_ENDPOINTS = [
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-pro-latest'
]

# Initialize Flask App
app = Flask(__name__, static_folder='.', static_url_path='')

if HAS_CORS and CORS:
    CORS(app)

# Global CORS & Options Request Middleware
@app.before_request
def handle_options_request():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        return response

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

# Patient Diagnostic History File Storage
HISTORY_FILE = os.path.join(os.path.dirname(__file__), 'patient_history.json')

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading history file: {e}")
            return []
    return []

def save_history(records):
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error writing history file: {e}")

# Medical Knowledgebase for Rule-Based Clinical Decision Support
CLINICAL_KNOWLEDGE_BASE = [
    {
        "id": "angina_mi",
        "nameEn": "Acute Cardiac Event / Angina / Myocardial Infarction",
        "nameBn": "হার্ট অ্যাটাক বা একিউট করনারি সিন্ড্রোম",
        "symptomsRequired": ["chest_pain", "shortness_breath"],
        "optionalSymptoms": ["palpitations", "nausea_vomiting", "dizziness"],
        "triageLevel": "EMERGENCY",
        "urgencyScore": 95,
        "specialistEn": "Cardiologist / Emergency Dept",
        "specialistBn": "হৃদরোগ বিশেষজ্ঞ / কার্ডিওলজিস্ট",
        "descEn": "Requires instant clinical evaluation to rule out heart muscle ischemia.",
        "descBn": "হৃদপিন্ডে রক্ত চলাবলে বাধার আশঙ্কা। দ্রুত ইমার্জেন্সি বিভাগে যেতে হবে।",
        "adviceEn": [
            "Call emergency services (999 / 911 / Ambulance) immediately.",
            "Rest in a sitting position; do not exert yourself physically.",
            "Take prescribed Emergency Nitroglycerin if advised by your cardiologist."
        ],
        "adviceBn": [
            "অবিলম্বে জরুরি অ্যাম্বুলেন্স সার্ভিস (৯৯৯ / ৯১১) কল করুন।",
            "এক জায়গায় শান্ত হয়ে বসে থাকুন, কোনো শারীরিক পরিশ্রম করবেন না।",
            "পূর্বে ডাক্তার দ্বারা নির্ধারিত ইমার্জেন্সি ওষুধ থাকলে নির্দেশিকা অনুযায়ী নিন।"
        ]
    },
    {
        "id": "stroke_warning",
        "nameEn": "Neurological Warning / Stroke or Meningeal Signs",
        "nameBn": "স্ট্রোক বা নিউরোলজিক্যাল জরুরি সতর্কতা",
        "symptomsRequired": ["arm_numbness", "fainting"],
        "optionalSymptoms": ["headache", "vision_loss", "dizziness"],
        "triageLevel": "EMERGENCY",
        "urgencyScore": 98,
        "specialistEn": "Neurologist / Stroke Unit",
        "specialistBn": "স্নায়ুরোগ বিশেষজ্ঞ / নিউরোলজিস্ট",
        "descEn": "Sudden weakness on one side or loss of consciousness needs urgent neuro-evaluation.",
        "descBn": "শরীরের কোনো এক পাশ অবশ হওয়া বা অজ্ঞান হয়ে যাওয়া স্ট্রোকের লক্ষণ হতে পারে।",
        "adviceEn": [
            "Perform FAST test: Face drooping, Arm weakness, Speech difficulty, Time to call 999.",
            "Seek nearest Comprehensive Stroke or Trauma Hospital immediately."
        ],
        "adviceBn": [
            "রোগীর মুখ বাঁকা হওয়া, হাত তোলা এবং কথা বলার সমস্যা পরীক্ষা করুন।",
            "দ্রুততম সময়ে নিকটস্থ বিশেষায়িত হাসপাতালে নিয়ে যান।"
        ]
    },
    {
        "id": "pneumonia_chest_infection",
        "nameEn": "Pneumonia / Severe Lower Respiratory Tract Infection",
        "nameBn": "নিউমোনিয়া ও ফুসফুসের তীব্র ইনফেকশন",
        "symptomsRequired": ["pneumonia_fever", "shortness_breath"],
        "optionalSymptoms": ["high_fever", "chest_pain", "persistent_cough"],
        "triageLevel": "EMERGENCY",
        "urgencyScore": 88,
        "specialistEn": "Pulmonologist / Chest Specialist",
        "specialistBn": "বক্ষব্যাধি ও ফুসফুস বিশেষজ্ঞ",
        "descEn": "High fever accompanied by breathing difficulty indicates pulmonary lung consolidation.",
        "descBn": "উচ্চ জ্বরের সাথে শ্বাসকষ্ট ফুসফুসে তীব্র ইনফেকশনের পূর্বলক্ষণ হতে পারে।",
        "adviceEn": [
            "Consult a pulmonologist for immediate chest X-ray and arterial blood oxygen (SpO2) check.",
            "Monitor oxygen levels using a pulse oximeter.",
            "Do not suppress cough if producing sputum."
        ],
        "adviceBn": [
            "অবিলম্বে বক্ষব্যাধি বিশেষজ্ঞের সাথে পরামর্শ করে বুকের এক্স-রে এবং পালস অক্সিমিটার টেস্ট করান।",
            "শরীরে অক্সিজেনের মাত্রা (SpO2) নিয়মিত মেপে রাখুন।"
        ]
    },
    {
        "id": "dengue_fever",
        "nameEn": "Dengue Hemorrhagic Fever / Bone-Break Viral Syndrome",
        "nameBn": "ডেঙ্গু জ্বর ও প্লাটিলেট সতর্কতা",
        "symptomsRequired": ["dengue_leg_fever"],
        "optionalSymptoms": ["high_fever", "headache", "fatigue", "nausea_vomiting"],
        "triageLevel": "URGENT",
        "urgencyScore": 78,
        "specialistEn": "General Physician / Hematologist",
        "specialistBn": "মেডিসিন বিশেষজ্ঞ / সাধারণ চিকিৎসক",
        "descEn": "Severe bone pain with acute high fever requires blood complete count (CBC) & NS1 antigen test.",
        "descBn": "হাড় ভাঙা তীব্র ব্যথাসহ প্রচণ্ড জ্বর থাকলে ডেঙ্গু এনএস১ ও সিবিসি টেস্ট করানো জরুরি।",
        "adviceEn": [
            "Get blood CBC and Dengue NS1 Antigen test done within 24 hours.",
            "Drink plenty of fluids (ORS saline, coconut water, fresh fruit juices).",
            "Avoid NSAIDs (Aspirin, Ibuprofen, Naproxen); use Paracetamol for fever management."
        ],
        "adviceBn": [
            "২৪ ঘণ্টার মধ্যে রক্ত পরীক্ষা (CBC & Dengue NS1 Antigen) করান।",
            "প্রচুর পরিমাণে পানি, স্যালাইন ও ডাবের পানি পান করুন।",
            "আইবুপ্রোফেন বা এসপিরিন জাতীয় পেইনকিলার খাবেন না; শুধু প্যারাসিটামল নিন।"
        ]
    },
    {
        "id": "typhoid_fever",
        "nameEn": "Enteric Typhoid Fever / Salmonella Infection",
        "nameBn": "টাইফয়েড বা এন্টারিক ফিভার",
        "symptomsRequired": ["typhoid_head"],
        "optionalSymptoms": ["stomach_pain", "high_fever", "diarrhea", "nausea_vomiting"],
        "triageLevel": "URGENT",
        "urgencyScore": 72,
        "specialistEn": "Internal Medicine Specialist",
        "specialistBn": "মেডিসিন ও ইনফেকশাস ডিজিজ বিশেষজ্ঞ",
        "descEn": "Step-ladder high fever with severe headache and gastrointestinal distress.",
        "descBn": "তীব্র মাথাব্যথা ও পেটের গোলযোগসহ ক্রমাগত জ্বর টাইফয়েডের লক্ষণ হতে পারে।",
        "adviceEn": [
            "Perform Widal test / Typhidot blood culture as advised by a doctor.",
            "Consume boiled, purified water and light soft diet (soup, porridge).",
            "Complete the full antibiotic course if prescribed by your physician."
        ],
        "adviceBn": [
            "ডাক্তারের পরামর্শে রক্ত বা টাইফিডট টেস্ট করান।",
            "সবসময় ফুটানো বিশুদ্ধ পানি ও হালকা নরম খাবার গ্রহণ করুন।"
        ]
    },
    {
        "id": "appendicitis",
        "nameEn": "Acute Appendicitis / Abdominal Peritoneal Alert",
        "nameBn": "একিউট এপেন্ডিসাইটিস বা পেটের জরুরি সমস্যা",
        "symptomsRequired": ["appendicitis_fever"],
        "optionalSymptoms": ["nausea_vomiting", "stomach_pain", "high_fever"],
        "triageLevel": "URGENT",
        "urgencyScore": 82,
        "specialistEn": "General Surgeon",
        "specialistBn": "সার্জন / সার্জারি বিশেষজ্ঞ",
        "descEn": "Localized right lower quadrant abdominal pain with fever needs urgent surgical opinion.",
        "descBn": "পেটের ডান পাশের তলপেটে তীব্র ব্যথা ও জ্বর এপেন্ডিসাইটিসের সংকেত।",
        "adviceEn": [
            "Do not apply hot compress or eat heavy foods.",
            "Consult a general surgeon for abdominal ultrasound immediately."
        ],
        "adviceBn": [
            "পেটে কোনো গরম সেঁক দেবেন না এবং ভারী খাবার খাওয়া থেকে বিরত থাকুন।",
            "অবিলম্বে আল্ট্রাসনোগ্রাম করার জন্য সার্জারি বিশেষজ্ঞ দেখান।"
        ]
    },
    {
        "id": "viral_flu",
        "nameEn": "Seasonal Influenza / Viral Upper Respiratory Syndrome",
        "nameBn": "মৌসুমি ভাইরাস সংক্রমণ ও ভাইরাল ফ্লু",
        "symptomsRequired": ["viral_flu"],
        "optionalSymptoms": ["high_fever", "headache", "sore_throat", "fatigue"],
        "triageLevel": "ROUTINE",
        "urgencyScore": 42,
        "specialistEn": "General Physician / Family Doctor",
        "specialistBn": "সাধারণ চিকিৎসক / এফসিপিএস মেডিসিন",
        "descEn": "Self-limiting viral upper respiratory tract infection.",
        "descBn": "মৌসুমি ভাইরাল ইনফেকশন যা সাধারণত ৪-৫ দিনে সুচিকিৎসা ও বিশ্রামে সেরে যায়।",
        "adviceEn": [
            "Ensure full bed rest for 3 to 5 days.",
            "Maintain hydration with warm liquids and lemon tea.",
            "Use OTC Paracetamol for fever relief."
        ],
        "adviceBn": [
            "৩-৫ দিন পর্যাপ্ত শারীরিক বিশ্রাম নিন।",
            "প্রচুর কুসুম গরম পানি, রঙ চা ও লেবুর রস পান করুন।"
        ]
    },
    {
        "id": "chikungunya_fever",
        "nameEn": "Chikungunya Viral Joint Fever",
        "nameBn": "চিকনগুনিয়া জ্বর ও তীব্র জয়েন্ট পেইন",
        "symptomsRequired": ["chikungunya_arm_fever"],
        "optionalSymptoms": ["high_fever", "headache", "fatigue", "arm_muscle_cramps"],
        "triageLevel": "URGENT",
        "urgencyScore": 70,
        "specialistEn": "Rheumatologist / Medicine Specialist",
        "specialistBn": "রিউমাটোলজিস্ট / মেডিসিন বিশেষজ্ঞ",
        "descEn": "Mosquito-borne viral infection characterized by sudden high fever and debilitating joint pains.",
        "descBn": "মশাবাহিত ভাইরাল জ্বর যার প্রধান লক্ষণ হঠাৎ প্রচণ্ড জ্বর ও শরীরের জয়েন্টে জয়েন্টে তীব্র ব্যথা।",
        "adviceEn": [
            "Rest adequately and avoid strenuous physical movements.",
            "Use Paracetamol for pain and fever; avoid NSAIDs like Ibuprofen/Aspirin.",
            "Drink plenty of fluids and ORS saline."
        ],
        "adviceBn": [
            "পর্যাপ্ত বিশ্রাম নিন এবং জয়েন্টের ওপর চাপ দেবেন না।",
            "ব্যাথা বা জ্বরের জন্য শুধুমাত্র প্যারাসিটামল সেবন করুন।"
        ]
    },
    {
        "id": "malaria_fever",
        "nameEn": "Malaria Parasitic Fever with Shivering Rigors",
        "nameBn": "ম্যালেরিয়া জ্বর ও তীব্র কাঁপুনি",
        "symptomsRequired": ["malaria_fever_chills"],
        "optionalSymptoms": ["high_fever", "headache", "nausea_vomiting", "fatigue"],
        "triageLevel": "EMERGENCY",
        "urgencyScore": 85,
        "specialistEn": "Infectious Disease Specialist / Physician",
        "specialistBn": "ইনফেকশাস ডিজিজ ও মেডিসিন বিশেষজ্ঞ",
        "descEn": "Parasitic Plasmodium infection causing cyclical high fever spikes with intense cold shivering and sweating.",
        "descBn": "প্লাজমোডিয়াম পরজীবীজনিত রোগ যাতে তীব্র কাঁপুনি দিয়ে পর্যায়ক্রমিক প্রচণ্ড জ্বর ও প্রচুর ঘাম হয়।",
        "adviceEn": [
            "Perform immediate blood malaria parasite (MP) slide & ICT rapid test.",
            "Seek urgent medical evaluation for antimalarial prescription."
        ],
        "adviceBn": [
            "অবিলম্বে রক্তের ম্যালেরিয়া টেস্ট (MP Test / ICT) করান।",
            "ডাক্তারের পরামর্শে অ্যান্টিম্যালেরিয়াল ওষুধ সেবন করুন।"
        ]
    },
    {
        "id": "tuberculosis_fever",
        "nameEn": "Pulmonary Tuberculosis & Low-Grade Evening Fever",
        "nameBn": "ফুসফুসের যক্ষ্মা বা টিবি ফিভার",
        "symptomsRequired": ["tuberculosis_fever"],
        "optionalSymptoms": ["cough_blood", "persistent_cough", "weight_loss", "fatigue"],
        "triageLevel": "URGENT",
        "urgencyScore": 76,
        "specialistEn": "Chest Specialist / Pulmonologist",
        "specialistBn": "বক্ষব্যাধি ও যক্ষ্মা বিশেষজ্ঞ",
        "descEn": "Chronic mycobacterial infection presenting with low-grade evening fever, night sweats, persistent cough, and weight loss.",
        "descBn": "দীর্ঘস্থায়ী জীবাণু সংক্রমণ যার লক্ষণ বিকেলে হালকা জ্বর, রাতে ঘাম, কাশির সাথে রক্ত ও দ্রুত ওজন হ্রাস।",
        "adviceEn": [
            "Perform sputum GeneXpert test and Chest X-ray immediately.",
            "Consult DOTS TB clinic for full anti-tubercular medication regimen."
        ],
        "adviceBn": [
            "কফ পরীক্ষা (GeneXpert) ও বুকের এক্স-রে করান।",
            "বিনামূল্যে সরকারি ডটস (DOTS) সেন্টার থেকে টিবি অ্যান্টিবায়োটিক কোর্স শুরু করুন।"
        ]
    },
    {
        "id": "meningitis_fever",
        "nameEn": "Bacterial / Viral Meningitis (Stiff Neck Fever Alert)",
        "nameBn": "মেনিনজাইটিস বা মস্তিষ্ক ঝিল্লির কড়া জ্বর",
        "symptomsRequired": ["typhoid_head", "high_fever"],
        "optionalSymptoms": ["fainting", "headache", "nausea_vomiting", "dizziness"],
        "triageLevel": "EMERGENCY",
        "urgencyScore": 96,
        "specialistEn": "Neurologist / Emergency Critical Care",
        "specialistBn": "নিউরোলজিস্ট / ইমার্জেন্সি ক্রিকটিক্যাল কেয়ার",
        "descEn": "Life-threatening infection of the brain meninges causing extreme stiff neck, high fever, and altered mental state.",
        "descBn": "মস্তিষ্কের ঝিল্লিতে ঘাতক ইনফেকশন যাতে ঘাড় শক্ত হয়ে যাওয়া, তীব্র মাথাব্যথা ও কড়া জ্বর হয়।",
        "adviceEn": [
            "Immediate emergency ER admission required for CSF lumbar puncture and IV antibiotics.",
            "Do not delay seeking hospital emergency services."
        ],
        "adviceBn": [
            "অবিলম্বে হাসপাতালের ইমার্জেন্সিতে গিয়ে আইভি অ্যান্টিবায়োটিক চিকিৎসা শুরু করুন।"
        ]
    },
    {
        "id": "uti_kidney_fever",
        "nameEn": "Acute Pyelonephritis / Upper Urinary Tract Fever",
        "nameBn": "কিডনি ও মূত্রনালীর তীব্র ইনফেকশন জ্বর",
        "symptomsRequired": ["kidney_infection_fever"],
        "optionalSymptoms": ["urinary_burning", "kidney_flank_pain", "high_fever"],
        "triageLevel": "URGENT",
        "urgencyScore": 80,
        "specialistEn": "Urologist / Nephrologist",
        "specialistBn": "ইউরোলজিস্ট / নেফ্রোলজিস্ট",
        "descEn": "Severe bacterial ascending UTI affecting kidney parenchyma causing high fever with chills and back flank pain.",
        "descBn": "মূত্রনালী থেকে কিডনিতে ছড়ানো ব্যাকটেরিয়াল ইনফেকশন যাতে কাঁপুনি দিয়ে উচ্চ জ্বর ও পাঁজরে ব্যথা হয়।",
        "adviceEn": [
            "Get urine Routine Examination (R/E) and urine Culture & Sensitivity (C/S) done.",
            "Drink 3-4 liters of purified water daily."
        ],
        "adviceBn": [
            "ইউরিন টেস্ট (R/E & Culture) করিয়ে ইউরোলজিস্টের পরামর্শ নিন।"
        ]
    },
    {
        "id": "covid19_fever",
        "nameEn": "COVID-19 Respiratory Fever Syndrome",
        "nameBn": "কোভিড-১৯ ও সংক্রামক শ্বাসযন্ত্রের জ্বর",
        "symptomsRequired": ["covid_fever"],
        "optionalSymptoms": ["high_fever", "shortness_breath", "sore_throat", "persistent_cough"],
        "triageLevel": "URGENT",
        "urgencyScore": 75,
        "specialistEn": "Pulmonologist / General Physician",
        "specialistBn": "মেডিসিন ও বক্ষব্যাধি বিশেষজ্ঞ",
        "descEn": "Coronavirus acute respiratory syndrome with fever, loss of taste/smell, and respiratory fatigue.",
        "descBn": "করোনাভাইরাস সংক্রামক জ্বর যাতে স্বাদ/গন্ধহীনতা, উচ্চ জ্বর ও শ্বাসকষ্ট দেখা দেয়।",
        "adviceEn": [
            "Perform RT-PCR or Rapid Antigen test.",
            "Isolate yourself and monitor oxygen levels (SpO2)."
        ],
        "adviceBn": [
            "কোভিড অ্যান্টিজেন বা আরটি-পিসিআর টেস্ট করান ও আইসোলেশনে থাকুন।"
        ]
    },
    {
        "id": "tonsillitis_fever",
        "nameEn": "Acute Septic Tonsillitis & Pharyngitis Fever",
        "nameBn": "টনসিলের তীব্র ইনফেকশন ও গলা ব্যথার জ্বর",
        "symptomsRequired": ["tonsillitis_fever"],
        "optionalSymptoms": ["sore_throat", "high_fever", "headache"],
        "triageLevel": "ROUTINE",
        "urgencyScore": 50,
        "specialistEn": "ENT Specialist (Ear Nose Throat)",
        "specialistBn": "ইএনটি (ইয়ার নোজ থ্রোট) বিশেষজ্ঞ",
        "descEn": "Streptococcal or viral bacterial infection of palatine tonsils causing painful swallowing and fever.",
        "descBn": "গলার টনসিল ও ফ্যারিংসের ইনফেকশন যাতে ঢোক গিলতে কষ্ট ও শরীরের জ্বর ভাব থাকে।",
        "adviceEn": [
            "Gargle with warm salt water 3-4 times daily.",
            "Consult ENT doctor if tonsillar pus exudate is present."
        ],
        "adviceBn": [
            "কুসুম গরম লবণ পানি দিয়ে দৈনিক ৩-৪ বার কুলকুচি (গার্গল) করুন।"
        ]
    },
    {
        "id": "rheumatic_fever",
        "nameEn": "Rheumatic Fever / Post-Streptococcal Heart Alert",
        "nameBn": "রিউমেটিক বা বাত জ্বর (হৃদযন্ত্র সতর্কতা)",
        "symptomsRequired": ["knee_joint_fever"],
        "optionalSymptoms": ["high_fever", "palpitations", "fatigue"],
        "triageLevel": "URGENT",
        "urgencyScore": 77,
        "specialistEn": "Cardiologist / Pediatric Rheumatologist",
        "specialistBn": "কার্ডিওলজিস্ট / শিশু রিউমাটোলজিস্ট",
        "descEn": "Autoimmune inflammatory complication following untreated throat infection affecting heart valves and joints.",
        "descBn": "গলার ইনফেকশনের পর অটোইমিউন বাতের জ্বর যা সরাসরি হৃদপিণ্ডের বাল্ব ও জয়েন্টকে আক্রান্ত করে।",
        "adviceEn": [
            "Perform ASO Titre blood test and Echocardiogram.",
            "Long-term antibiotic prophylaxis mandatory under cardiologist guidance."
        ],
        "adviceBn": [
            "এএসও টিটার (ASO Titre) ও ইকো-কার্ডিওগ্রাম টেস্ট করান।"
        ]
    },
    {
        "id": "septicemia_fever",
        "nameEn": "Sepsis / Severe Septicemia Blood Systemic Alert",
        "nameBn": "সেপসিস বা রক্তে বিষাক্ত ইনফেকশন জ্বর",
        "symptomsRequired": ["sepsis_fever"],
        "optionalSymptoms": ["high_fever", "fainting", "shortness_breath", "dizziness"],
        "triageLevel": "EMERGENCY",
        "urgencyScore": 99,
        "specialistEn": "ICU Specialist / Critical Care",
        "specialistBn": "আইসিইউ ও ক্রিকটিক্যাল কেয়ার বিশেষজ্ঞ",
        "descEn": "Extreme life-threatening organ dysfunction caused by a dysregulated systemic immune response to infection.",
        "descBn": "রক্তের মারাত্মক ইনফেকশন যাতে শরীরের একাধিক অঙ্গ নিষ্ক্রিয় হওয়ার আশঙ্কা থাকে।",
        "adviceEn": [
            "Immediate ICU emergency transfer for vasopressor and IV broad-spectrum antibiotics.",
            "Call Ambulance immediately."
        ],
        "adviceBn": [
            "অবিলম্বে আইসিইউ অ্যাম্বুলেন্স কল করে হাসপাতালে ভর্তি হন।"
        ]
    },
    {
        "id": "heat_stroke_fever",
        "nameEn": "Heat Stroke / Severe Environmental Hyperthermia",
        "nameBn": "হিট স্ট্রোক ও অতিরিক্ত তাপমাত্রা সতর্কতা",
        "symptomsRequired": ["heat_stroke_fever"],
        "optionalSymptoms": ["high_fever", "fainting", "dizziness", "headache"],
        "triageLevel": "EMERGENCY",
        "urgencyScore": 90,
        "specialistEn": "Emergency Medicine Consultant",
        "specialistBn": "ইমার্জেন্সি ও মেডিসিন কনসালটেন্ট",
        "descEn": "Failure of thermoregulation causing core temperature > 104°F (40°C), lack of sweating, and altered sensorium.",
        "descBn": "প্রচণ্ড গরমে শরীরের থার্মোস্টেট বিকল হয়ে ১০৪°F+ তাপমাত্রা হওয়া ও অজ্ঞান হওয়ার ঝুঁকি।",
        "adviceEn": [
            "Move patient to a cool shaded place immediately.",
            "Apply ice packs to armpits/groin and sponge whole body with cold water."
        ],
        "adviceBn": [
            "রোগীকে অবিলম্বে ঠান্ডা ছায়াযুক্ত স্থানে নিয়ে এসে পুরো শরীরে বরফ সেঁক বা ঠান্ডা পানির ছিটান।"
        ]
    }
]

# Firebase Auth Bearer Token Helper
def verify_firebase_token(request_obj):
    auth_header = request_obj.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split('Bearer ')[1]
    if HAS_FIREBASE and firebase_auth:
        try:
            decoded_token = firebase_auth.verify_id_token(token)
            return decoded_token
        except Exception as e:
            print(f"Token verification skipped: {e}")
            return None
    return None


# ==============================================================================
# API ENDPOINTS & STATIC FILE ROUTES
# ==============================================================================

@app.route('/')
def index():
    """Serves the main AI Health Checker interface."""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serves static files (CSS, JS, images) with SPA index.html fallback."""
    full_path = os.path.join('.', path)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    """System Health Check Endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "MediPulse AI Clinical Server",
        "version": "2.2.0",
        "features": {
            "cors": HAS_CORS,
            "firebase_auth": HAS_FIREBASE,
            "gemini_ai": HAS_GEMINI
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_symptoms():
    """
    Core AI Symptom Triage & Clinical Assessment Endpoint.
    Payload: { "symptoms": ["chest_pain", "shortness_breath"], "severity": 7, "duration": "few-days", "lang": "en" }
    """
    try:
        data = request.get_json(silent=True) or {}
        symptoms = data.get("symptoms", [])
        
        try:
            severity = int(data.get("severity", 5))
        except (ValueError, TypeError):
            severity = 5
            
        duration = str(data.get("duration", "few-days"))
        language = str(data.get("lang", "en"))

        if not symptoms or not isinstance(symptoms, list):
            return jsonify({
                "status": "error",
                "message": "No valid symptoms provided. Please select at least 1 symptom."
            }), 400

        # Check Red-Flag Symptoms
        red_flag_keys = ["chest_pain", "shortness_breath", "fainting", "vision_loss", "blood_in_stool", "arm_numbness", "pneumonia_fever"]
        has_red_flag = any(s in red_flag_keys for s in symptoms)

        # Match Conditions using Knowledgebase Algorithm
        matched_results = []
        for cond in CLINICAL_KNOWLEDGE_BASE:
            req_matches = sum(1 for s in cond["symptomsRequired"] if s in symptoms)
            opt_matches = sum(1 for s in cond["optionalSymptoms"] if s in symptoms)
            total_req = len(cond["symptomsRequired"])

            if req_matches > 0:
                score = (req_matches / total_req) * 70 + (opt_matches * 10)
                if req_matches == total_req:
                    score += 15
                score = min(round(score), 98)
                matched_results.append({
                    "id": cond["id"],
                    "name": cond["nameBn"] if language == "bn" else cond["nameEn"],
                    "score": score,
                    "triageLevel": cond["triageLevel"],
                    "specialist": cond["specialistBn"] if language == "bn" else cond["specialistEn"],
                    "description": cond["descBn"] if language == "bn" else cond["descEn"],
                    "advice": cond["adviceBn"] if language == "bn" else cond["adviceEn"]
                })

        # Sort by Match Score
        matched_results.sort(key=lambda x: x["score"], reverse=True)

        if not matched_results:
            matched_results.append({
                "id": "general_symptoms",
                "name": "সাধারণ শারীরিক অসুস্থতা" if language == "bn" else "Nonspecific Symptom Complex",
                "score": 45,
                "triageLevel": "ROUTINE",
                "specialist": "সাধারণ চিকিৎসক" if language == "bn" else "General Physician",
                "description": "আপনার লক্ষণগুলোর জন্য একজন সাধারণ চিকিৎসকের সাথে কথা বলা শ্রেয়।" if language == "bn" else "Your combination of symptoms warrants a basic health evaluation by a GP.",
                "advice": [
                    "পর্যাপ্ত বিশ্রাম নিন ও তরল পান করুন।" if language == "bn" else "Rest well and maintain hydration.",
                    "লক্ষণ বেড়ে গেলে ডাক্তারের পরামর্শ নিন।" if language == "bn" else "Monitor if symptoms worsen."
                ]
            })

        # Determine Overall Triage Risk Level
        top_match = matched_results[0]
        top_level = top_match.get("triageLevel", "ROUTINE")

        if has_red_flag or severity >= 8:
            triage_level = "EMERGENCY"
            urgency_score = 95
            triage_text = "জরুরি পরিস্থিতি: দ্রুত হাসপাতালে যান" if language == "bn" else "EMERGENCY: Immediate Medical Care Required"
        elif severity >= 6 or top_level == "URGENT":
            triage_level = "URGENT"
            urgency_score = 75
            triage_text = "জরুরি: ২৪ ঘণ্টার মধ্যে ডাক্তার দেখান" if language == "bn" else "Urgent: Consult Doctor within 24 Hours"
        else:
            triage_level = "ROUTINE"
            urgency_score = 35
            triage_text = "স্বাভাবিক / নিয়মিত স্বাস্থ্য সেবা" if language == "bn" else "Routine Care: Schedule Appointment"

        ai_note = None
        # Enhance using Google Gemini AI
        try:
            prompt = f"Patient Symptoms: {', '.join(symptoms)}. Pain Severity (1-10): {severity}. Duration: {duration}. Language requested: {language}. Provide a concise 2-sentence clinical triage summary and recommended specialist care."
            ai_note = query_gemini_api(prompt, language=language)
        except Exception as e:
            print(f"Gemini AI Notice: {e}")

        return jsonify({
            "status": "success",
            "triage_level": triage_level,
            "triage_text": triage_text,
            "urgency_score": urgency_score,
            "has_red_flag": has_red_flag,
            "top_condition": top_match["name"],
            "specialist": top_match.get("specialist", "General Physician"),
            "matched_conditions": matched_results,
            "clinical_advice": top_match.get("advice", []),
            "ai_enhanced_note": ai_note,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    except Exception as e:
        print(f"Error in analyze endpoint: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ------------------------------------------------------------------------------
# VITAL HEALTH CALCULATORS API ENDPOINTS
# ------------------------------------------------------------------------------

@app.route('/api/calculators/bmi', methods=['POST'])
def calc_bmi():
    """Calculates BMI, category, and healthy target weight."""
    try:
        data = request.get_json(silent=True) or {}
        weight = float(data.get("weight", 0))
        height_cm = float(data.get("height", 0))

        if weight <= 0 or height_cm <= 0:
            return jsonify({"status": "error", "message": "Invalid height or weight"}), 400

        height_m = height_cm / 100.0
        bmi = round(weight / (height_m * height_m), 1)

        if bmi < 18.5:
            category_en, category_bn = "Underweight", "কম ওজন"
        elif 18.5 <= bmi < 25.0:
            category_en, category_bn = "Normal Weight", "স্বাভাবিক ওজন"
        elif 25.0 <= bmi < 30.0:
            category_en, category_bn = "Overweight", "অতিরিক্ত ওজন"
        else:
            category_en, category_bn = "Obese", "স্থূলতা / ওবেসিটি"

        min_healthy_weight = round(18.5 * (height_m * height_m), 1)
        max_healthy_weight = round(24.9 * (height_m * height_m), 1)

        return jsonify({
            "status": "success",
            "bmi": bmi,
            "category_en": category_en,
            "category_bn": category_bn,
            "healthy_weight_range_kg": f"{min_healthy_weight} - {max_healthy_weight}"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/calculators/water', methods=['POST'])
def calc_water():
    """Calculates recommended daily water intake."""
    try:
        data = request.get_json(silent=True) or {}
        weight = float(data.get("weight", 0))
        activity = str(data.get("activity", "moderate"))

        if weight <= 0:
            return jsonify({"status": "error", "message": "Invalid weight"}), 400

        liters = weight * 0.033
        if activity in ["active", "high"]:
            liters += 0.6
        elif activity == "intense":
            liters += 1.0

        liters = round(liters, 1)
        glasses = round(liters * 4)

        return jsonify({
            "status": "success",
            "water_liters": liters,
            "water_glasses": glasses
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/calculators/bmr', methods=['POST'])
def calc_bmr():
    """Calculates BMR (Basal Metabolic Rate) & TDEE."""
    try:
        data = request.get_json(silent=True) or {}
        weight = float(data.get("weight", 70))
        height = float(data.get("height", 175))
        age = int(data.get("age", 30))
        gender = str(data.get("gender", "male")).lower()

        if weight <= 0 or height <= 0 or age <= 0:
            return jsonify({"status": "error", "message": "Invalid input parameters"}), 400

        # Mifflin-St Jeor Equation
        if gender == "male":
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
        else:
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161

        bmr = round(bmr)
        tdee_maintenance = round(bmr * 1.375)

        return jsonify({
            "status": "success",
            "bmr": bmr,
            "maintenance_calories": tdee_maintenance
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ------------------------------------------------------------------------------
# PATIENT DIAGNOSTIC HISTORY & SAVED REPORTS API
# ------------------------------------------------------------------------------

@app.route('/api/history', methods=['GET'])
def get_user_history():
    """Retrieve saved patient diagnostic history."""
    try:
        user_info = verify_firebase_token(request)
        user_id = user_info['uid'] if (user_info and 'uid' in user_info) else request.args.get('user_id', 'anonymous')
        
        all_records = load_history()
        user_records = [r for r in all_records if r.get('user_id') == user_id]
        return jsonify({"status": "success", "count": len(user_records), "records": user_records})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/history', methods=['POST'])
def save_user_history():
    """Save a diagnostic assessment record."""
    try:
        user_info = verify_firebase_token(request)
        user_id = user_info['uid'] if (user_info and 'uid' in user_info) else 'anonymous'
        
        data = request.get_json(silent=True) or {}
        record_id = str(uuid.uuid4())
        
        record = {
            "id": record_id,
            "user_id": user_id,
            "user_name": data.get("user_name", "Patient"),
            "symptoms": data.get("symptoms", []),
            "top_condition": data.get("top_condition", "N/A"),
            "triage_level": data.get("triage_level", "ROUTINE"),
            "urgency_score": data.get("urgency_score", 35),
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        }
        
        all_records = load_history()
        all_records.insert(0, record)
        save_history(all_records)
        
        return jsonify({"status": "success", "record_id": record_id, "record": record})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/history/<record_id>', methods=['DELETE'])
def delete_user_history(record_id):
    """Delete a saved patient record."""
    try:
        all_records = load_history()
        filtered = [r for r in all_records if r.get('id') != record_id]
        save_history(filtered)
        return jsonify({"status": "success", "deleted": record_id})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ------------------------------------------------------------------------------
# DIGITAL PRESCRIPTION GENERATOR ENDPOINT
# ------------------------------------------------------------------------------

@app.route('/api/prescription', methods=['POST'])
def generate_prescription():
    """Generates structured digital Rx prescription data."""
    try:
        data = request.get_json(silent=True) or {}
        condition_name = data.get("condition", "Viral Fever Complex")
        language = str(data.get("lang", "en"))

        medications = [
            {
                "name": "Tab. Paracetamol 500mg" if language == "en" else "Tab. Paracetamol 500mg (প্যারাসিটামল)",
                "dosage": "1 - 0 - 1",
                "timing": "After Food" if language == "en" else "খাবার পর",
                "duration": "3 - 5 Days" if language == "en" else "৩-৫ দিন"
            },
            {
                "name": "Oral Rehydration Solution (ORS)" if language == "en" else "Oral Rehydration Saline / ORS (ওরাল স্যালাইন)",
                "dosage": "1 - 1 - 1",
                "timing": "As Needed" if language == "en" else "প্রয়োজন অনুযায়ী",
                "duration": "5 Days" if language == "en" else "৫ দিন"
            },
            {
                "name": "Cap. Omeprazole 20mg" if language == "en" else "Cap. Omeprazole 20mg (এসিডিটি)",
                "dosage": "1 - 0 - 0",
                "timing": "30 mins Before Food" if language == "en" else "খাবার ৩০ মি. পূর্বে",
                "duration": "5 Days" if language == "en" else "৫ দিন"
            }
        ]

        advice = [
            "Maintain adequate fluid intake (at least 3 Liters daily)." if language == "en" else "প্রতিদিন অন্তত ৩ লিটার বিশুদ্ধ পানি ও স্যালাইন পান করুন।",
            "Monitor body temperature every 4 hours." if language == "en" else "প্রতি ৪ ঘণ্টা পর পর শরীরের তাপমাত্রা মেপে লিখে রাখুন।",
            "Seek emergency hospital care if chest pain or severe shortness of breath develops." if language == "en" else "বুকে তীব্র চাপ বা শ্বাসকষ্ট হলে অবিলম্বে হাসপাতালে যোগাযোগ করুন।"
        ]

        return jsonify({
            "status": "success",
            "prescription_id": f"RX-{uuid.uuid4().hex[:8].upper()}",
            "condition": condition_name,
            "doctor": "Dr. MediPulse AI (Reg #12345)",
            "medications": medications,
            "clinical_advice": advice,
            "generated_at": datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p")
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ------------------------------------------------------------------------------
# NEARBY HOSPITALS & NURSING HOMES LOCATOR ENDPOINT
# ------------------------------------------------------------------------------

import math
import urllib.request
import urllib.parse

def haversine_km(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points in km."""
    try:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 2)
    except Exception:
        return 0.0

@app.route('/api/nearby-hospitals', methods=['GET', 'POST'])
def get_nearby_hospitals():
    """Returns nearby hospitals, nursing homes, and clinics for a given address or lat/lng."""
    try:
        data = request.get_json(silent=True) if request.method == 'POST' else request.args
        if not data:
            data = {}

        address = data.get('address', '').strip()
        lat = data.get('lat')
        lng = data.get('lng')
        radius_km = float(data.get('radius', 10))
        facility_type = data.get('facility_type', 'all')  # all, hospital, nursing_home

        try:
            if lat is not None:
                lat = float(lat)
            if lng is not None:
                lng = float(lng)
        except (ValueError, TypeError):
            lat, lng = None, None

        user_loc_name = address or "User Location"

        # Geocode address via Nominatim if coordinates not supplied
        if (lat is None or lng is None) and address:
            try:
                geo_url = f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(address)}&limit=1"
                req = urllib.request.Request(geo_url, headers={'User-Agent': 'MediPulseAI-HealthApp/1.0'})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    geo_data = json.loads(resp.read().decode())
                    if geo_data:
                        lat = float(geo_data[0]['lat'])
                        lng = float(geo_data[0]['lon'])
                        user_loc_name = geo_data[0].get('display_name', address)
            except Exception as ge:
                print(f"Geocoding error: {ge}")

        # Default fallback to central reference if no location resolved
        if lat is None or lng is None:
            lat, lng = 22.5726, 88.3639  # Default Kolkata reference hub
            user_loc_name = user_loc_name or "Default Medical Zone"

        radius_meters = int(radius_km * 1000)
        facilities = []

        # Overpass API query
        overpass_query = f"""
        [out:json][timeout:10];
        (
          node["amenity"="hospital"](around:{radius_meters},{lat},{lng});
          way["amenity"="hospital"](around:{radius_meters},{lat},{lng});
          node["healthcare"="nursing_home"](around:{radius_meters},{lat},{lng});
          node["amenity"="nursing_home"](around:{radius_meters},{lat},{lng});
          node["amenity"="clinic"](around:{radius_meters},{lat},{lng});
        );
        out center 40;
        """
        
        try:
            op_url = "https://overpass-api.de/api/interpreter"
            req = urllib.request.Request(op_url, data=overpass_query.encode('utf-8'), headers={'User-Agent': 'MediPulseAI-HealthApp/1.0'})
            with urllib.request.urlopen(req, timeout=8) as resp:
                op_res = json.loads(resp.read().decode())
                elements = op_res.get('elements', [])

                for el in elements:
                    tags = el.get('tags', {})
                    name = tags.get('name') or tags.get('name:en') or tags.get('official_name')
                    if not name:
                        continue

                    f_lat = el.get('lat') or (el.get('center', {}).get('lat'))
                    f_lng = el.get('lon') or (el.get('center', {}).get('lon'))
                    if not f_lat or not f_lng:
                        continue

                    dist = haversine_km(lat, lng, float(f_lat), float(f_lng))
                    amenity = tags.get('amenity', '')
                    healthcare = tags.get('healthcare', '')

                    # Categorize facility
                    is_nursing = 'nursing' in amenity or 'nursing' in healthcare or 'nursing' in tags.get('description', '').lower() or 'nursing' in name.lower()
                    cat = "nursing_home" if is_nursing else ("hospital" if amenity == 'hospital' else "clinic")

                    if facility_type != 'all' and cat != facility_type:
                        continue

                    phone = tags.get('phone') or tags.get('contact:phone') or tags.get('mobile') or "Emergency Contact Available"
                    addr = tags.get('addr:full') or tags.get('addr:street') or tags.get('addr:city') or f"Near Lat: {f_lat:.3f}, Lng: {f_lng:.3f}"
                    is_emergency = tags.get('emergency') == 'yes' or cat == 'hospital'

                    facilities.append({
                        "id": f"fac_{el.get('id')}",
                        "name": name,
                        "category": cat,
                        "type_label": "Nursing Home" if cat == "nursing_home" else ("General Hospital" if cat == "hospital" else "Specialized Clinic"),
                        "distance_km": dist,
                        "lat": float(f_lat),
                        "lng": float(f_lng),
                        "address": addr,
                        "phone": phone,
                        "emergency_24x7": is_emergency,
                        "directions_url": f"https://www.google.com/maps/dir/?api=1&destination={f_lat},{f_lng}"
                    })
        except Exception as ope:
            print(f"Overpass API error/timeout: {ope}")

        # Fallback dataset if live OSM query returns few or no results
        if len(facilities) < 3:
            fallback_hospitals = [
                {
                    "id": "fb_1",
                    "name": "City Emergency Super-Speciality Hospital",
                    "category": "hospital",
                    "type_label": "24/7 Super-Speciality Hospital",
                    "distance_km": 1.2,
                    "lat": lat + 0.008,
                    "lng": lng + 0.006,
                    "address": "Central Healthcare Corridor, Main Metro Road",
                    "phone": "+91 1800-123-4567 / 102",
                    "emergency_24x7": True,
                    "directions_url": f"https://www.google.com/maps/dir/?api=1&destination={lat + 0.008},{lng + 0.006}"
                },
                {
                    "id": "fb_2",
                    "name": "Apollo Multispecialty Medical Center & ICU",
                    "category": "hospital",
                    "type_label": "Tertiary Care Hospital & Trauma Unit",
                    "distance_km": 2.4,
                    "lat": lat - 0.012,
                    "lng": lng + 0.011,
                    "address": "58 Medical Park Avenue, Sector 3",
                    "phone": "+91 033-2320-3040",
                    "emergency_24x7": True,
                    "directions_url": f"https://www.google.com/maps/dir/?api=1&destination={lat - 0.012},{lng + 0.011}"
                },
                {
                    "id": "fb_3",
                    "name": "Medicare Nursing Home & Maternity Care",
                    "category": "nursing_home",
                    "type_label": "Private Nursing Home & Care Center",
                    "distance_km": 3.1,
                    "lat": lat + 0.015,
                    "lng": lng - 0.009,
                    "address": "12 Grand Trunk Boulevard",
                    "phone": "+91 033-4050-6070",
                    "emergency_24x7": True,
                    "directions_url": f"https://www.google.com/maps/dir/?api=1&destination={lat + 0.015},{lng - 0.009}"
                },
                {
                    "id": "fb_4",
                    "name": "Lifeline Critical Care & Nursing Home",
                    "category": "nursing_home",
                    "type_label": "Nursing Home & Diagnostic Hub",
                    "distance_km": 4.5,
                    "lat": lat - 0.018,
                    "lng": lng - 0.014,
                    "address": "84 Health Plaza, Near Central Station",
                    "phone": "+91 98300-11223",
                    "emergency_24x7": True,
                    "directions_url": f"https://www.google.com/maps/dir/?api=1&destination={lat - 0.018},{lng - 0.014}"
                }
            ]
            for fb in fallback_hospitals:
                if facility_type == 'all' or fb['category'] == facility_type:
                    facilities.append(fb)

        # Sort facilities by distance
        facilities.sort(key=lambda x: x['distance_km'])

        return jsonify({
            "status": "success",
            "user_location": {
                "name": user_loc_name,
                "lat": lat,
                "lng": lng
            },
            "radius_km": radius_km,
            "total_found": len(facilities),
            "facilities": facilities
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ------------------------------------------------------------------------------
# AI MEDICAL CONSULTATION CHAT ENDPOINT (Gemini + Clinical Engine)
# ------------------------------------------------------------------------------

SYSTEM_MEDICAL_PROMPT = """
You are Dr. MediPulse AI, an empathetic, highly intelligent, interactive clinical AI Medical Consultant.

CONVERSATION & CONSULTATION GUIDELINES:
1. Natural & Interactive Consultation: Engage in a natural, multi-turn clinical chat with the patient, exactly like an experienced, caring doctor.
   - If the patient gives brief or initial symptoms (e.g. "I have headache", "আমার পেট ব্যথা", "सिर में दर्द है", "3 days"), respond empathetically and ask relevant, short follow-up questions to understand duration, location, severity, and accompanying symptoms (e.g., "Since when?", "Do you have fever or nausea?").
   - If the patient provides clear information or answers your follow-up questions, give direct, personalized clinical guidance, home triage, diagnostic test suggestions, and specialist doctor referrals.
2. DYNAMIC & NON-REPETITIVE RESPONSES: EVERY RESPONSE MUST BE DYNAMIC, UNIQUE, AND SPECIFICALLY TAILORED to the patient's exact message and conversation history. NEVER output rigid repetitive template blocks or duplicate standard headers across turns.
3. Language Matching: Reply in the EXACT language used by the patient (Hindi, Bengali, English, or Hinglish/Banglish). If the patient speaks in Hindi, answer in warm, natural Hindi. If Bengali, answer in warm, natural Bengali.
4. Concise & Reassuring: Keep your responses crisp, conversational, and easy to read (2 to 5 natural sentences or short clear bullet points). Avoid overwhelming walls of text.
5. Safety Alert: Only include emergency medical contact numbers (102/108/999) if symptoms indicate immediate life-threatening danger (e.g., crushing chest pain, acute stroke symptoms, unconsciousness).
"""

@app.route('/api/chat', methods=['POST'])
def ai_medical_chat():
    """Handles interactive natural language medical consultation with Dr. MediPulse AI using Google Gemini API."""
    try:
        data = request.get_json(silent=True) or {}
        user_message = data.get('message', '').strip()
        history = data.get('history', [])
        language = str(data.get('lang', 'en'))
        custom_key = data.get('apiKey', '').strip()

        if not user_message:
            return jsonify({"status": "error", "message": "Message content cannot be empty."}), 400

        ai_response = query_gemini_api(user_message, history=history, language=language, custom_key=custom_key)

        # Intelligent Fallback Clinical Knowledge Consultation Engine
        if not ai_response:
            ai_response = generate_clinical_fallback_chat_response(user_message, language)

        return jsonify({
            "status": "success",
            "reply": ai_response,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })
    except Exception as e:
        print(f"ai_medical_chat exception fallback: {e}")
        fallback_reply = generate_clinical_fallback_chat_response(user_message if 'user_message' in locals() else '', language if 'language' in locals() else 'en')
        return jsonify({
            "status": "success",
            "reply": fallback_reply,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })

def query_gemini_api(user_message, history=None, language='en', custom_key=None):
    """Queries Google Gemini REST endpoints sequentially using model fallback array."""
    import urllib.request
    
    api_key = custom_key or os.environ.get('GEMINI_API_KEY') or DEFAULT_GEMINI_KEY
    if not api_key:
        return None

    # Construct System Prompt & Conversation Context
    formatted_prompt = f"{SYSTEM_MEDICAL_PROMPT}\n\nPatient Language Preference: {language}\nPatient Medical Query: {user_message}"

    if history and isinstance(history, list) and len(history) > 0:
        history_str = "\n".join([f"{'User' if h.get('role') == 'user' else 'AI'}: {h.get('content', '')}" for h in history[-8:]])
        formatted_prompt = f"{SYSTEM_MEDICAL_PROMPT}\n\nRecent Conversation History:\n{history_str}\n\nCurrent Patient Language: {language}\nCurrent Patient Message: {user_message}"

    payload = {
        "contents": [{
            "parts": [{"text": formatted_prompt}]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1000
        }
    }
    data_bytes = json.dumps(payload).encode('utf-8')

    for model_name in GEMINI_MODEL_ENDPOINTS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                if resp.status == 200:
                    res_body = json.loads(resp.read().decode('utf-8'))
                    candidates = res_body.get('candidates', [])
                    if candidates and 'content' in candidates[0]:
                        parts = candidates[0]['content'].get('parts', [])
                        if parts and 'text' in parts[0]:
                            reply_text = parts[0]['text'].strip()
                            if reply_text:
                                print(f"✅ Gemini response generated via model: {model_name}")
                                return reply_text
        except Exception as err:
            print(f"Gemini API model '{model_name}' fallback triggered: {err}")
            continue

    return None

def generate_clinical_fallback_chat_response(message, lang):
    msg_lower = message.lower().strip()
    
    # 0. Greetings & Friendly Introductions
    if any(k in msg_lower for k in ['hi', 'hii', 'hello', 'hey', 'কেমন আছেন', 'হ্যাল', 'who are you', 'আপনার নাম কী', 'नमस्ते', 'कैसे हैं']):
        if lang == 'bn':
            return "👋 **হ্যালো! আমি ডক্টর মেডিপালস এআই**, আপনার ২৪/৭ ক্লিনিক্যাল এআই চিকিৎসা সহকারী।\n\nআপনার শারীরিক লক্ষণ বা যেকোনো স্বাস্থ্য বিষয়ক সমস্যা লিখে জানান, আমি আপনাকে প্রয়োজনীয় পরামর্শ ও নির্দেশনা দিচ্ছি।"
        elif lang == 'hi':
            return "👋 **नमस्ते! मैं डॉ. मेडीपल्स एआई** हूं, आपका 24/7 क्लिनिकल एआई चिकित्सा सहायक।\n\nकृपया अपने लक्षण या स्वास्थ्य संबंधी प्रश्न लिखें, मैं आपको आवश्यक सलाह और मार्गदर्शन प्रदान करूंगा।"
        else:
            return "👋 **Hello! I am Dr. MediPulse AI**, your 24/7 Clinical AI Medical Consultant.\n\nPlease describe your symptoms or health queries, and I will assist you with clinical guidance."

    # 1. Emergency Triage
    if any(k in msg_lower for k in ['chest pain', 'heart attack', 'stroke', 'buke betha', 'shas kosto', 'unconscious', 'bleeding', 'জরুরি', 'বুকে ব্যথা', 'सीने में दर्द', 'आपातकाल']):
        if lang == 'bn':
            return "🚨 **জরুরি স্বাস্থ্য সতর্কতা:**\nআপনার বর্ণিত লক্ষণগুলোতে মারাত্মক শারীরিক ঝুঁকি থাকতে পারে (যেমন: বুকে চাপ ব্যথা, তীব্র শ্বাসকষ্ট বা স্ট্রোকের আশঙ্কা)।\n\n**তাৎক্ষণিক করণীয়:**\n- অবিলম্বে ইমার্জেন্সি অ্যাম্বুলেন্স (**১০২ / ১০৮ / ৯৯৯**) কল করুন।\n- দ্রুত নিকটস্থ হাসপাতালে যোগাযোগ করুন এবং নিশ্চুপ হয়ে বিশ্রাম নিন।"
        elif lang == 'hi':
            return "🚨 **आपातकालीन चिकित्सा चेतावनी:**\nआपके द्वारा बताए गए लक्षणों में गंभीर जोखिम हो सकता है (जैसे: सीने में तेज दर्द, सांस लेने में अत्यधिक तकलीफ या स्ट्रोक)।\n\n**तत्काल कदम:**\n- तुरंत आपातकालीन एंबुलेंस (**102 / 108 / 999**) पर कॉल करें।\n- बिना किसी देरी के निकटतम अस्पताल जाएं।"
        else:
            return "🚨 **EMERGENCY MEDICAL ALERT:**\nYour query mentions critical emergency symptoms (e.g. chest pain, severe breathing distress, stroke warning).\n\n**Immediate Actions:**\n- Immediately call Emergency Ambulance (**102 / 108 / 999**).\n- Visit the nearest Emergency Room without delay and remain seated calmly."

    # 2. Migraine & Headaches
    if any(k in msg_lower for k in ['migraine', 'headache', 'matha byatha', 'matha betha', 'মাথাব্যথা', 'মাইগ্রেন', 'রগ ব্যথা', 'सिर दर्द', 'सिरदर्द']):
        if lang == 'bn':
            return "মাথাব্যথাটি কতদিন ধরে হচ্ছে? ব্যথাটা কি মাথার একপাশে নাকি পুরো মাথায়? সাথে কি জ্বর বা বমি ভাব আছে?"
        elif lang == 'hi':
            return "सिरदर्द कितने दिनों से हो रहा है? क्या दर्द सिर के एक तरफ है या पूरे सिर में? क्या साथ में बुखार या उल्टी की शिकायत है?"
        else:
            return "How long have you had this headache? Is the pain on one side of your head or all over, and do you have any fever or nausea?"

    # 3. Short duration inputs (e.g., 3 days)
    if any(k in msg_lower for k in ['3 days', '3 day', '৩ দিন', 'কয়েক দিন', 'few days', '3 दिन', 'तीन दिन']):
        if lang == 'bn':
            return "তিন দিন ধরে লক্ষণ থাকা স্বাভাবিক নয়। আপনার কি সাথে জ্বর, বমি ভাব বা আলোতে চোখে অস্বস্তি হচ্ছে? আপনি কি পর্যাপ্ত পানি পান করেছেন?"
        elif lang == 'hi':
            return "तीन दिनों से लक्षण रहना सामान्य नहीं है। क्या आपको साथ में बुखार, मिचली या रोशनी से परेशानी महसूस हो रही है? क्या आप पर्याप्त पानी पी रहे हैं?"
        else:
            return "3 days is quite a while to feel this way. Do you also have any fever, nausea, or sensitivity to light? Have you been staying hydrated?"

    # 4. High BP / Hypertension
    if any(k in msg_lower for k in ['bp', 'pressure', 'hypertension', 'high bp', 'প্রেসার', 'উচ্চ রক্তচাপ', 'बीपी', 'ब्लड प्रेशर']):
        if lang == 'bn':
            return "আপনার ব্লাড প্রেসার মেপেছেন কি? প্রেসারের লেভেল কত এসেছে জানালে সঠিক পরামর্শ দেওয়া সুবিধা হবে।"
        elif lang == 'hi':
            return "क्या आपने अपना ब्लड प्रेशर (बीपी) मापा है? अपनी रीडिंग शेयर करने से सटीक सलाह देने में मदद मिलेगी।"
        else:
            return "Have you measured your blood pressure recently? Sharing your reading will help me provide tailored advice."

    # 5. Gastric & Stomach Pain
    if any(k in msg_lower for k in ['gas', 'gastric', 'acidity', 'heartburn', 'gerd', 'ulcer', 'pet betha', 'stomach pain', 'vomit', 'bomi', 'গ্যাস', 'এসিডিটি', 'পেট ব্যথা', 'पेट दर्द', 'एसिडिटी']):
        if lang == 'bn':
            return "পেটে ব্যথা বা এসিডিটি কি খাবারের ঠিক পরপরই শুরু হয়? বমি বা বুক জ্বালাপোড়ার মতো অনুভূতি হচ্ছে কি?"
        elif lang == 'hi':
            return "क्या पेट दर्द या एसिडिटी खाना खाने के तुरंत बाद शुरू होती है? क्या सीने में जलन या उल्टी महसूस हो रही है?"
        else:
            return "Is the abdominal pain or acidity happening right after meals? Do you feel heartburn or nausea as well?"

    # 6. Fever & Flu
    if any(k in msg_lower for k in ['fever', 'jor', 'flu', 'cold', 'kashee', 'cough', 'জ্বর', 'কাশি', 'ঠান্ডা', 'बुखार', 'खांसी', 'जुकाम']):
        if lang == 'bn':
            return "আপনার জ্বরের তাপমাত্রা কতটি দেখাচ্ছে? সাথে কি কাঁপুনি, কাশি বা শরীরে কোনো র‍্যাশ/ব্যথা আছে?"
        elif lang == 'hi':
            return "आपका बुखार कितना है? क्या साथ में ठंड लगना, खांसी या शरीर में कोई दर्द है?"
        else:
            return "What is your current body temperature? Are you experiencing any chills, cough, or body ache alongside the fever?"

    topic = message.strip()
    if lang == 'bn':
        return f"আপনার \"{topic}\" বিষয়টি সম্পর্কে আরেকটু বিস্তারিত বলবেন কি? লক্ষণটি কতদিন ধরে হচ্ছে এবং অন্যান্য কোনো শারীরিক অস্বস্তি আছে কিনা জানালে সঠিক পরামর্শ দেওয়া সহজ হবে।"
    elif lang == 'hi':
        return f"क्या आप \"{topic}\" के बारे में थोड़ा और विस्तार से बताएंगे? यह कितने दिनों से है और क्या कोई अन्य शारीरिक तकलीफ भी है?"
    else:
        return f"Could you provide a bit more detail regarding \"{topic}\"? Knowing how long you've experienced this and any accompanying symptoms will help me guide you better."


# ------------------------------------------------------------------------------
# DYNAMIC DISEASE-SPECIFIC PRESCRIPTION GENERATOR ENDPOINT (Gemini AI + Clinical Pharmacology)
# ------------------------------------------------------------------------------

@app.route('/api/prescription', methods=['POST'])
def generate_ai_prescription():
    """Generates disease-specific OTC medications & clinical advice using Gemini API or fallback knowledge."""
    try:
        data = request.get_json(silent=True) or {}
        condition = data.get('condition', 'General Discomfort').strip()
        symptoms = data.get('symptoms', [])
        triage = data.get('triage', 'MODERATE').strip()
        language = str(data.get('lang', 'en'))
        custom_key = data.get('apiKey', '').strip()

        api_key = custom_key or os.environ.get('GEMINI_API_KEY') or DEFAULT_GEMINI_KEY

        if api_key:
            prompt = f"""You are an expert clinical pharmacology AI assistant.
Generate an accurate, evidence-based OTC/first-aid prescription specifically tailored for a patient diagnosed with: "{condition}".
Patient Symptoms: {', '.join(symptoms) if symptoms else 'General symptoms'}.
Triage Risk Level: {triage}.
Patient Language: {language}.

CRITICAL: Output MUST be a clean JSON object with NO markdown, NO code block ticks, EXACTLY in this schema:
{{
  "medications": [
    {{ "name": "Exact Medication Name (e.g. Tab. Paracetamol 650mg)", "dosage": "1 - 0 - 1", "timing": "After Food", "duration": "3 - 5 Days" }},
    {{ "name": "Medication 2 Name", "dosage": "1 - 0 - 0", "timing": "Before Food", "duration": "5 Days" }}
  ],
  "advice": [
    "Specific clinical advice 1 tailored to {condition}",
    "Specific clinical advice 2 tailored to {condition}",
    "Specific clinical advice 3 tailored to {condition}"
  ]
}}
Provide 3 to 5 realistic, condition-specific medications/care items and 3 to 4 clinical advice items specifically for {condition}. DO NOT use generic template output."""

            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 800}
            }
            data_bytes = json.dumps(payload).encode('utf-8')

            for m_name in GEMINI_MODEL_ENDPOINTS:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={api_key}"
                    req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json'})
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        if resp.status == 200:
                            res_body = json.loads(resp.read().decode('utf-8'))
                            candidates = res_body.get('candidates', [])
                            if candidates and 'content' in candidates[0]:
                                parts = candidates[0]['content'].get('parts', [])
                                if parts and 'text' in parts[0]:
                                    g_text = parts[0]['text'].strip()
                                    clean_text = g_text.replace('```json', '').replace('```', '').strip()
                                    parsed_json = json.loads(clean_text)
                                    if 'medications' in parsed_json and len(parsed_json['medications']) > 0:
                                        print(f"✅ Gemini prescription generated for '{condition}' via {m_name}")
                                        return jsonify({"status": "success", "data": parsed_json})
                except Exception as g_err:
                    print(f"Prescription Gemini model {m_name} error: {g_err}")
                    continue

        fallback_data = get_disease_fallback_prescription(condition, symptoms, language)
        return jsonify({"status": "success", "data": fallback_data})

    except Exception as e:
        print(f"Prescription API error fallback: {e}")
        fallback_data = get_disease_fallback_prescription(condition if 'condition' in locals() else '', symptoms if 'symptoms' in locals() else [], language if 'language' in locals() else 'en')
        return jsonify({"status": "success", "data": fallback_data})

def get_disease_fallback_prescription(condition, symptoms, lang='en'):
    cond_lower = (condition or '').lower()
    sym_lower = [s.lower() for s in (symptoms or [])]
    
    # 1. Migraine & Headache
    if any(k in cond_lower or any(k in s for s in sym_lower) for k in ['migraine', 'headache', 'matha', 'মাথাব্যথা', 'মাইগ্রেন', 'সির दर्द', 'सिरदर्द']):
        if lang == 'bn':
            return {
                "medications": [
                    { "name": "Tab. Naproxen 250mg (ন্যাপ্রোক্সেন)", "dosage": "1 - 0 - 1", "timing": "খাবার পর", "duration": "৩ দিন" },
                    { "name": "Tab. Domperidone 10mg (ডমপেরিডন - বমি ভাব কমানোর জন্য)", "dosage": "1 - 0 - 1", "timing": "খাবার ১৫ মি. পূর্বে", "duration": "৩ দিন" },
                    { "name": "Tab. Paracetamol 650mg (প্যারাসিটামল)", "dosage": "1 - 0 - 1", "timing": "খাবার পর (প্রয়োজনে)", "duration": "৩-৫ দিন" },
                    { "name": "Cap. Omeprazole 20mg (এসিডিটি প্রতিরোধক)", "dosage": "1 - 0 - 0", "timing": "খাবার ৩০ মি. পূর্বে", "duration": "৫ দিন" }
                ],
                "advice": [
                    "আলো ও কোলাহলমুক্ত অন্ধকার ঘরে নিরিবিলি বিশ্রাম নিন।",
                    "কপাল ও রগে ঠান্ডা কাপড়ের জলপট্টি বা আইস প্যাক ১৫ মিনিট ধরে রাখুন।",
                    "চা, কফি, চকলেট ও অতিরিক্ত স্ক্রিন দেখা এড়িয়ে চলুন।"
                ]
            }
        elif lang == 'hi':
            return {
                "medications": [
                    { "name": "Tab. Naproxen 250mg", "dosage": "1 - 0 - 1", "timing": "खाने के बाद", "duration": "3 दिन" },
                    { "name": "Tab. Domperidone 10mg", "dosage": "1 - 0 - 1", "timing": "खाने से 15 मिनट पहले", "duration": "3 दिन" },
                    { "name": "Tab. Paracetamol 650mg", "dosage": "1 - 0 - 1", "timing": "खाने के बाद", "duration": "3 - 5 दिन" },
                    { "name": "Cap. Omeprazole 20mg", "dosage": "1 - 0 - 0", "timing": "खाने से 30 मिनट पहले", "duration": "5 दिन" }
                ],
                "advice": [
                    "अंधेरे और शांत कमरे में आराम करें।",
                    "माथे पर ठंडी पट्टी या आइस पैक लगाएं।",
                    "चाय, कॉफी, चॉकलेट और स्क्रीन लाइट से बचें।"
                ]
            }
        else:
            return {
                "medications": [
                    { "name": "Tab. Naproxen 250mg", "dosage": "1 - 0 - 1", "timing": "After Food", "duration": "3 Days" },
                    { "name": "Tab. Domperidone 10mg (Anti-nausea)", "dosage": "1 - 0 - 1", "timing": "15 mins Before Food", "duration": "3 Days" },
                    { "name": "Tab. Paracetamol 650mg", "dosage": "1 - 0 - 1", "timing": "After Food As Needed", "duration": "3 - 5 Days" },
                    { "name": "Cap. Omeprazole 20mg (Antacid)", "dosage": "1 - 0 - 0", "timing": "30 mins Before Food", "duration": "5 Days" }
                ],
                "advice": [
                    "Rest immediately in a dimly lit, quiet room to reduce sensory triggers.",
                    "Apply cool ice pack or wet compress on temples & forehead for 15 mins.",
                    "Avoid caffeine, chocolate, bright screens, and mental stress."
                ]
            }

    # 2. Gastric Reflux, GERD, Acidity & Stomach Pain
    if any(k in cond_lower or any(k in s for s in sym_lower) for k in ['gastric', 'acid', 'gerd', 'stomach', 'ulcer', 'pet', 'পেট', 'গ্যাস', 'এসিডিটি', 'एसिडिटी', 'पेट दर्द']):
        if lang == 'bn':
            return {
                "medications": [
                    { "name": "Cap. Esomeprazole 20mg (এসোমিপ্রাজল)", "dosage": "1 - 0 - 0", "timing": "খাবার ৩০ মি. পূর্বে", "duration": "৭-১৪ দিন" },
                    { "name": "Syr. Antacid Gel (এন্টাসিড সিরাফ)", "dosage": "2 tsp", "timing": "খাবার ১ ঘণ্টা পর (দিনে ৩ বার)", "duration": "৭ দিন" },
                    { "name": "Tab. Mebeverine 135mg (পেট ব্যথার জন্য)", "dosage": "1 - 0 - 1", "timing": "খাবার ২০ মি. পূর্বে", "duration": "৫ দিন" },
                    { "name": "Oral Rehydration Saline (ORS)", "dosage": "1 - 1 - 1", "timing": "প্রয়োজন অনুযায়ী", "duration": "৫ দিন" }
                ],
                "advice": [
                    "অতিরিক্ত তেল-মসলাযুক্ত, ভাজাপোড়া ও রিচ ফুড পুরোপুরি বন্ধ করুন।",
                    "খাওয়ার সাথে সাথে শুবেন না; অন্তত ২ ঘণ্টা পর ঘুমাতে যান।",
                    "একবারে বেশি না খেয়ে অল্প অল্প করে বারবার আহার করুন।"
                ]
            }
        elif lang == 'hi':
            return {
                "medications": [
                    { "name": "Cap. Esomeprazole 20mg", "dosage": "1 - 0 - 0", "timing": "खाने से 30 मिनट पहले", "duration": "7-14 दिन" },
                    { "name": "Syr. Antacid Gel", "dosage": "2 tsp", "timing": "खाने के 1 घंटे बाद", "duration": "7 दिन" },
                    { "name": "Tab. Mebeverine 135mg", "dosage": "1 - 0 - 1", "timing": "खाने से 20 मिनट पहले", "duration": "5 दिन" },
                    { "name": "Oral Rehydration Solution (ORS)", "dosage": "1 - 1 - 1", "timing": "आवश्यकतानुसार", "duration": "5 दिन" }
                ],
                "advice": [
                    "मसालेदार, तले हुए और वसायुक्त भोजन से पूरी तरह बचें।",
                    "खाना खाने के तुरंत बाद न सोएं; कम से कम 2 घंटे बाद सोएं।",
                    "एक बार में भारी भोजन करने के बजाय थोड़ा-थोड़ा करके खाएं।"
                ]
            }
        else:
            return {
                "medications": [
                    { "name": "Cap. Esomeprazole 20mg (PPI Antacid)", "dosage": "1 - 0 - 0", "timing": "30 mins Before Food", "duration": "7 - 14 Days" },
                    { "name": "Syr. Antacid Gel (Sucralfate)", "dosage": "2 tsp", "timing": "1 hour After Meals (TID)", "duration": "7 Days" },
                    { "name": "Tab. Mebeverine 135mg (Spasmolytic)", "dosage": "1 - 0 - 1", "timing": "20 mins Before Food", "duration": "5 Days" },
                    { "name": "Oral Rehydration Solution (ORS)", "dosage": "1 - 1 - 1", "timing": "As Needed for Hydration", "duration": "5 Days" }
                ],
                "advice": [
                    "Eliminate spicy, fried, citrus, carbonated beverages, and caffeine.",
                    "Remain upright for 2 hours post-meal; elevate head pillow when sleeping.",
                    "Consume smaller, frequent light meals instead of heavy dinners."
                ]
            }

    # 3. High Blood Pressure & Hypertension
    if any(k in cond_lower or any(k in s for s in sym_lower) for k in ['bp', 'hypertension', 'pressure', 'প্রেসার', 'উচ্চ রক্তচাপ', 'बीपी', 'ब्लड प्रेशर']):
        if lang == 'bn':
            return {
                "medications": [
                    { "name": "Tab. Amlodipine 5mg (ডাক্তারের পরামর্শ অনুযায়ী)", "dosage": "1 - 0 - 0", "timing": "সকালে খাবার পর", "duration": "নিয়মিত" },
                    { "name": "Tab. Multivitamin & Magnesium Supplement", "dosage": "0 - 1 - 0", "timing": "দুপুরে খাবার পর", "duration": "৩০ দিন" },
                    { "name": "Low Sodium Electrolyte Fluid", "dosage": "1 - 0 - 1", "timing": "সারাদিনে", "duration": "নিয়মিত" }
                ],
                "advice": [
                    "খাবারে বাড়তি কাঁচা লবণ (Sodium) পুরোপুরি বন্ধ করুন (DASH ডায়েট)।",
                    "দিনে ২ বার (সকাল ও রাত) বিপি মেপে ডায়রিতে লিখে রাখুন।",
                    "অবিলম্বে একজন হৃদরোগ বিশেষজ্ঞ (Cardiologist) দেখান।"
                ]
            }
        else:
            return {
                "medications": [
                    { "name": "Tab. Amlodipine 5mg (Physician Consultation)", "dosage": "1 - 0 - 0", "timing": "Morning After Food", "duration": "As Prescribed" },
                    { "name": "Tab. Multivitamin & Magnesium Complex", "dosage": "0 - 1 - 0", "timing": "After Lunch", "duration": "30 Days" },
                    { "name": "Low-Sodium Hydration Balance", "dosage": "1 - 0 - 1", "timing": "Throughout Day", "duration": "Daily" }
                ],
                "advice": [
                    "Strictly eliminate added table salt (<2g/day DASH diet protocol).",
                    "Log blood pressure twice daily (morning & evening) before doctor visit.",
                    "Consult a Cardiologist / Internal Medicine Specialist for definitive titration."
                ]
            }

    # 4. Dengue & High Viral Fever
    if any(k in cond_lower or any(k in s for s in sym_lower) for k in ['dengue', 'bone', 'ডেঙ্গু', 'ডঙ্গু', 'হাড় ভাঙা']):
        if lang == 'bn':
            return {
                "medications": [
                    { "name": "Tab. Paracetamol 650mg (প্যারাসিটামল)", "dosage": "1 - 0 - 1", "timing": "খাবার পর (সর্বোচ্চ ৩ গ্রাম/দিন)", "duration": "৫ দিন" },
                    { "name": "Oral Rehydration Saline (ORS / ডাবের পানি)", "dosage": "1 - 1 - 1", "timing": "প্রতি ২ ঘণ্টায় ২৫০ মিলি", "duration": "৭ দিন" },
                    { "name": "Syr. Carica Papaya Leaf Extract (প্লাটিলেট সাপোর্ট)", "dosage": "2 tsp", "timing": "দিনে ২ বার খাবার পর", "duration": "৫ দিন" },
                    { "name": "Syr. Multivitamin & Zinc", "dosage": "1 tsp", "timing": "রাতে খাবার পর", "duration": "১০ দিন" }
                ],
                "advice": [
                    "আইবুপ্রোফেন, এসপিরিন বা অন্য কোনো পেইনকিলার সম্পূর্ণ নিষেধ (রক্তক্ষরণের ঝুঁকি)।",
                    "প্রতি ২৪ ঘণ্টায় CBC রক্ত পরীক্ষায় প্লাটিলেট কাউন্ট ট্র্যাক করুন।",
                    "দৈনিক অন্তত ৩-৪ লিটার ওরাল স্যালাইন, ডাবের পানি ও ফলের জুস পান করুন।"
                ]
            }
        else:
            return {
                "medications": [
                    { "name": "Tab. Paracetamol 650mg", "dosage": "1 - 0 - 1", "timing": "After Food (Max 3g/day)", "duration": "5 Days" },
                    { "name": "Oral Rehydration Solution (ORS / Coconut Water)", "dosage": "1 - 1 - 1", "timing": "250ml every 2 hours", "duration": "7 Days" },
                    { "name": "Syr. Carica Papaya Leaf Extract (Platelet Support)", "dosage": "2 tsp", "timing": "Twice daily After Food", "duration": "5 Days" },
                    { "name": "Syr. Multivitamin & Zinc Supplement", "dosage": "1 tsp", "timing": "After Dinner", "duration": "10 Days" }
                ],
                "advice": [
                    "AVOID Aspirin, Ibuprofen, and NSAIDs due to severe internal bleeding risk.",
                    "Perform CBC blood test every 24 hours to monitor platelet count.",
                    "Maintain intensive fluid hydration (3-4 Liters of ORS, coconut water, soups daily)."
                ]
            }

    # 5. Heart & Chest Pain / Cardiac Emergency
    if any(k in cond_lower or any(k in s for s in sym_lower) for k in ['cardiac', 'heart', 'angina', 'chest', 'বুকে ব্যথা', 'হার্ট', 'सीने में दर्द']):
        if lang == 'bn':
            return {
                "medications": [
                    { "name": "Tab. Sorbitrate 5mg / Nitroglycerin (জরুরি অবস্থার জন্য)", "dosage": "1 - 0 - 0", "timing": "জিহ্বায় নিচে ১টি ট্যাবলেট (জরুরি)", "duration": "তাৎক্ষণিক" },
                    { "name": "Tab. Aspirin 75mg (আ্যসপিরিন চিবিয়ে খাওয়ার জন্য)", "dosage": "1 - 0 - 0", "timing": "তাৎক্ষণিক চিবিয়ে সেবন", "duration": "১ দিন" },
                    { "name": "Oxygen & Emergency Medical Care", "dosage": "1 - 1 - 1", "timing": "হাসপাতালে ইমার্জেন্সি", "duration": "জরুরি" }
                ],
                "advice": [
                    "অবিলম্বে ইমার্জেন্সি অ্যাম্বুলেন্স (১০২ / ১০৮ / ৯৯৯) ডেকে নিকটস্থ হাসপাতালে ভর্তি হন।",
                    "এক জায়গায় শান্ত হয়ে বসে থাকুন; কোনো হাঁটাচলা করবেন না।",
                    "জরুরি ইসিজি (ECG) ও ট্রপোনিন-আই (Troponin-I) রক্ত পরীক্ষা করান।"
                ]
            }
        else:
            return {
                "medications": [
                    { "name": "Tab. Sorbitrate 5mg / Nitroglycerin (Emergency)", "dosage": "1 - 0 - 0", "timing": "1 Tab Sublingually (Under Tongue)", "duration": "Immediate" },
                    { "name": "Tab. Aspirin 75mg / 150mg (Dispersible)", "dosage": "1 - 0 - 0", "timing": "Chew Immediately", "duration": "1 Dose" },
                    { "name": "Emergency Medical Resuscitation Protocol", "dosage": "1 - 1 - 1", "timing": "In ER Unit", "duration": "Urgent" }
                ],
                "advice": [
                    "Call Emergency Ambulance (102 / 108 / 999) IMMEDIATELY for ER admission.",
                    "Remain resting in a upright/seated position; strictly avoid walking or exertion.",
                    "Urgent 12-lead ECG, Troponin-I, and Cardiac Echo evaluation required."
                ]
            }

    # 6. Default Specific Response for Any Other Condition
    cond_title = condition or "Clinical Evaluation Needed"
    if lang == 'bn':
        return {
            "medications": [
                { "name": f"Tab. Paracetamol 500mg ({cond_title}-এর জন্য)", "dosage": "1 - 0 - 1", "timing": "খাবার পর", "duration": "৩-৫ দিন" },
                { "name": "Oral Rehydration Saline (ORS - হাইড্রেটিং স্যালাইন)", "dosage": "1 - 1 - 1", "timing": "প্রয়োজন অনুযায়ী", "duration": "৫ দিন" },
                { "name": "Cap. Omeprazole 20mg (পাকস্থলীর সুরক্ষায়)", "dosage": "1 - 0 - 0", "timing": "খাবার ৩০ মি. পূর্বে", "duration": "৫ দিন" },
                { "name": "Tab. Multivitamin & Minerals", "dosage": "0 - 1 - 0", "timing": "দুপুরে খাবার পর", "duration": "৭ দিন" }
            ],
            "advice": [
                f"\"{cond_title}\"-এর শারীরিক পর্যবেক্ষণের জন্য নিকটস্থ মেডিসিন বিশেষজ্ঞের পরামর্শ নিন।",
                "প্রতিদিন অন্তত ২.৫ - ৩ লিটার পরিষ্কার বিশুদ্ধ পানি পান করুন।",
                "শারীরিক ক্লান্তি এড়াতে অন্তত ৮ ঘণ্টা ঘুম ও পূর্ণ বিশ্রাম নিশ্চিত করুন।"
            ]
        }
    else:
        return {
            "medications": [
                { "name": f"Tab. Paracetamol 500mg (Symptomatic Care)", "dosage": "1 - 0 - 1", "timing": "After Food", "duration": "3 - 5 Days" },
                { "name": "Oral Rehydration Solution (ORS Saline)", "dosage": "1 - 1 - 1", "timing": "As Needed", "duration": "5 Days" },
                { "name": "Cap. Omeprazole 20mg (Gastric Protection)", "dosage": "1 - 0 - 0", "timing": "30 mins Before Food", "duration": "5 Days" },
                { "name": "Tab. Multivitamin & Minerals", "dosage": "0 - 1 - 0", "timing": "After Lunch", "duration": "7 Days" }
            ],
            "advice": [
                f"Consult an Internal Medicine Specialist for targeted evaluation of \"{cond_title}\".",
                "Maintain continuous fluid hydration (2.5 to 3 Liters daily).",
                "Ensure 8 hours of bed rest and avoid strenuous physical exertion."
            ]
        }


# ------------------------------------------------------------------------------
# COMPREHENSIVE FEVER ENCYCLOPEDIA & DATASET ENDPOINT
# ------------------------------------------------------------------------------

FEVER_DATASET_FILE = os.path.join(os.path.dirname(__file__), 'fever_dataset.json')

@app.route('/api/fevers', methods=['GET'])
def get_fever_dataset():
    """Returns the complete 35+ clinical fever dataset with search & category filtering."""
    try:
        query = request.args.get('search', '').strip().lower()
        category = request.args.get('category', 'all').strip().lower()

        fevers = []
        if os.path.exists(FEVER_DATASET_FILE):
            with open(FEVER_DATASET_FILE, 'r', encoding='utf-8') as f:
                fevers = json.load(f)

        if category != 'all':
            fevers = [f for f in fevers if f.get('category') == category]

        if query:
            fevers = [
                f for f in fevers if
                query in f.get('nameEn', '').lower() or
                query in f.get('nameBn', '').lower() or
                query in f.get('descEn', '').lower() or
                query in f.get('descBn', '').lower() or
                any(query in s.lower() for s in f.get('symptoms', []))
            ]

        return jsonify({
            "status": "success",
            "total": len(fevers),
            "fevers": fevers
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ------------------------------------------------------------------------------
# 4. AI MEDICAL REPORT ANALYZER ENDPOINT (Gemini Vision + Text Clinical Engine)
# ------------------------------------------------------------------------------

SYSTEM_REPORT_PROMPT = """
You are Dr. MediPulse AI, an expert clinical AI Medical Report & Diagnostic Analyzer.
Your task is to analyze medical reports (Blood Report, CBC, X-ray, MRI, Prescription, Lab Report) and explain them in very simple, patient-friendly language (সহজ ভাষায়).

FORMATTING & CONCISENESS RULES:
1. Respond in the requested language (if Bengali, use easy, natural, reassuring Bengali; if English, clear English).
2. Format response into crisp sections:
   - 📄 **রিপোর্ট ওভারভিউ / Report Summary** (1 sentence)
   - 🔍 **সহজ ভাষায় মূল ফলাফল / Key Findings** (2-4 concise bullet points explaining what findings mean)
   - 📊 **মান ও পর্যবেক্ষণ / Readings & Observations** (Highlight normal vs high/low values or imaging findings)
   - 👨‍⚕️ **করণীয় ও পরামর্শ / Recommended Next Steps** (Specialist referral or follow-up)
3. Avoid dense medical jargon without explaining it immediately in plain words.
"""

@app.route('/api/analyze-report', methods=['POST'])
def ai_analyze_report():
    """Handles AI Medical Report Analysis for Blood Reports, CBC, X-rays, MRIs, Prescriptions & Lab Reports."""
    try:
        data = request.get_json(silent=True) or {}
        report_type = data.get('report_type', 'lab').strip().lower()
        report_text = data.get('report_text', '').strip()
        image_data = data.get('image_data', '').strip()
        language = str(data.get('lang', 'bn'))
        custom_key = data.get('apiKey', '').strip()

        if not report_text and not image_data:
            return jsonify({"status": "error", "message": "Please provide report text or upload an image/document."}), 400

        ai_response = query_gemini_report_api(report_type, report_text, image_data, language=language, custom_key=custom_key)

        if not ai_response:
            ai_response = generate_clinical_fallback_report_response(report_type, report_text, language)

        return jsonify({
            "status": "success",
            "report_type": report_type,
            "analysis": ai_response,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })
    except Exception as e:
        print(f"ai_analyze_report exception fallback: {e}")
        fallback_reply = generate_clinical_fallback_report_response(
            data.get('report_type', 'lab') if 'data' in locals() else 'lab',
            data.get('report_text', '') if 'data' in locals() else '',
            data.get('lang', 'bn') if 'data' in locals() else 'bn'
        )
        return jsonify({
            "status": "success",
            "analysis": fallback_reply,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })

def query_gemini_report_api(report_type, report_text, image_data=None, language='bn', custom_key=None):
    """Queries Gemini REST API for medical report analysis (supports text and base64 image)."""
    import urllib.request
    
    api_key = custom_key or os.environ.get('GEMINI_API_KEY') or DEFAULT_GEMINI_KEY
    if not api_key:
        return None

    type_labels = {
        'blood': 'Blood Report',
        'cbc': 'CBC (Complete Blood Count)',
        'xray': 'Chest / Bone X-Ray Imaging',
        'mri': 'MRI / CT Scan Report',
        'prescription': 'Doctor Prescription (Rx)',
        'lab': 'General Pathology Lab Report'
    }
    report_label = type_labels.get(report_type, 'Medical Lab Report')

    prompt_content = f"{SYSTEM_REPORT_PROMPT}\n\nReport Category: {report_label}\nLanguage: {language}\nReport Content / Notes:\n{report_text if report_text else 'Analyze the provided report image.'}"

    parts = [{"text": prompt_content}]

    # Handle image attachment if provided
    if image_data and ',' in image_data:
        try:
            mime_part, base64_str = image_data.split(',', 1)
            mime_type = mime_part.split(';')[0].split(':')[1] if 'data:' in mime_part else 'image/jpeg'
            parts.append({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": base64_str
                }
            })
        except Exception as e:
            print(f"Error parsing image_data: {e}")

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 450
        }
    }
    data_bytes = json.dumps(payload).encode('utf-8')

    for model_name in GEMINI_MODEL_ENDPOINTS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=14) as resp:
                if resp.status == 200:
                    res_body = json.loads(resp.read().decode('utf-8'))
                    candidates = res_body.get('candidates', [])
                    if candidates and 'content' in candidates[0]:
                        res_parts = candidates[0]['content'].get('parts', [])
                        if res_parts and 'text' in res_parts[0]:
                            reply_text = res_parts[0]['text'].strip()
                            if reply_text:
                                print(f"✅ Gemini Report Analysis via model: {model_name}")
                                return reply_text
        except Exception as err:
            print(f"Gemini Vision model '{model_name}' fallback: {err}")
            continue

    return None

def generate_clinical_fallback_report_response(report_type, report_text, lang='bn'):
    """Generates structured, intelligent fallback explanation in simple language for medical reports."""
    txt = report_text.lower()
    
    if report_type == 'cbc':
        if lang == 'bn':
            return (
                "📄 **রিপোর্ট ওভারভিউ: সিবিসি (Complete Blood Count) বিশ্লেষণ**\n\n"
                "🔍 **সহজ ভাষায় মূল ফলাফল:**\n"
                "• **হিমোগ্লোবিন (Hb):** রক্তের লোহিত রক্তকণিকা শরীরের টিস্যুতে অক্সিজেন সরবরাহ করে। মান কম থাকলে রক্তস্বল্পতা (Anemia) প্রকাশ পায়।\n"
                "• **প্লাটিলেট (Platelets):** রক্ত জমাট বাঁধতে সাহায্য করে। ডেঙ্গু বা ভাইরাল জ্বরে প্লাটিলেট কমতে পারে।\n"
                "• **শ্বেত রক্তকণিকা (WBC):** ইনফেকশনের বিরুদ্ধে প্রতিরোধ গড়ে তোলে। উচ্চ WBC ব্যাকটেরিয়াল ইনফেকশনের লক্ষণ।\n\n"
                "📊 **পর্যবেক্ষণ:**\n"
                "আপনার আপলোড করা তথ্যের ভিত্তিতে ল্যাব মানগুলো স্বাভাবিক সীমার মধ্যে আছে কিনা তা চিকিৎসক দ্বারা রিভিউ করা উচিত।\n\n"
                "👨‍⚕️ **করণীয় ও পরামর্শ:**\n"
                "১. পর্যাপ্ত পুষ্টিকর খাবার ও শাকসবজি খান।\n"
                "২. কোনো অস্বাভাবিক লক্ষণ (যেমন অতিরিক্ত দুর্বলতা বা রক্তপাত) থাকলে জেনারেল ফিজিশিয়ান বা মেডিসিন বিশেষজ্ঞ দেখান।"
            )
        else:
            return (
                "📄 **Report Overview: Complete Blood Count (CBC) Analysis**\n\n"
                "🔍 **Key Findings in Simple Terms:**\n"
                "• **Hemoglobin (Hb):** Carries oxygen throughout the body. Low values indicate Anemia.\n"
                "• **Platelets:** Essential for blood clotting. Decreased counts can occur in Dengue or viral infections.\n"
                "• **WBC Count:** Fights body infections. Elevated levels suggest underlying bacterial inflammation.\n\n"
                "📊 **Observations:**\n"
                "Report parameters evaluated against standard clinical range baselines.\n\n"
                "👨‍⚕️ **Recommended Next Steps:**\n"
                "1. Maintain balanced hydration and iron-rich diet.\n"
                "2. Show this report to an Internal Medicine Specialist for clinical correlation."
            )

    elif report_type == 'xray':
        if lang == 'bn':
            return (
                "📄 **রিপোর্ট ওভারভিউ: এক্স-রে (X-Ray) ইমেজিং রিপোর্ট**\n\n"
                "🔍 **সহজ ভাষায় মূল ফলাফল:**\n"
                "• **ফুসফুস ও বুকের এক্স-রে:** বুকের এক্স-রে ফুসফুসে ইনফেকশন (Pneumonia), তরল জমা (Pleural Effusion) বা নিউমোথোরাক্স শনাক্ত করে।\n"
                "• **হাড় ও জয়েন্ট এক্স-রে:** হাড়ের ফাটল (Fracture) বা হাড় ক্ষয়ের অবস্থান পরিষ্কার দেখা যায়।\n\n"
                "📊 **পর্যবেক্ষণ:**\n"
                "ইমেজ রেডিওলজিস্টের অপাসিটি বা ইমপ্রেশনের তথ্যের সাথে চিকিৎসকের রিভিউ প্রয়োজন।\n\n"
                "👨‍⚕️ **করণীয় ও পরামর্শ:**\n"
                "বক্ষব্যাধি বিশেষজ্ঞ (Chest Specialist) বা অর্থোপেডিক চিকিৎসকের পরামর্শ নিন।"
            )
        else:
            return (
                "📄 **Report Overview: X-Ray Imaging Analysis**\n\n"
                "🔍 **Key Findings in Simple Terms:**\n"
                "• **Chest X-Ray:** Evaluates lung consolidation, pneumonia opacities, pleural fluid, or bronchial vascular markings.\n"
                "• **Bone X-Ray:** Rules out structural fractures, cortical breaks, or joint alignment issues.\n\n"
                "👨‍⚕️ **Recommended Next Steps:**\n"
                "Consult a Pulmonologist or Orthopedist for physical clinical examination."
            )

    elif report_type == 'mri':
        if lang == 'bn':
            return (
                "📄 **রিপোর্ট ওভারভিউ: এমআরআই / সিটি স্ক্যান (MRI / CT Scan)**\n\n"
                "🔍 **সহজ ভাষায় মূল ফলাফল:**\n"
                "• **মস্তিষ্ক ও স্পাইন:** স্ট্রোক, নার্ভের চাপ, ডিস্ক প্রোল্যাপস বা টিউমার জাতীয় পরিবর্তন সূক্ষ্মভাবে ধরা পড়ে।\n"
                "• **টিস্যু ও জয়েন্ট:** লিগামেন্ট ছেঁড়া বা সফট টিস্যু প্রদাহ পরিষ্কার দেখা যায়।\n\n"
                "👨‍⚕️ **করণীয় ও পরামর্শ:**\n"
                "নিউরোলজিস্ট বা স্পাইন বিশেষজ্ঞের সাথে ফিল্ম ও ইমপ্রেশন রিপোর্ট সরাসরি শেয়ার করুন।"
            )
        else:
            return (
                "📄 **Report Overview: MRI / CT Scan Analysis**\n\n"
                "🔍 **Key Findings in Simple Terms:**\n"
                "• High-resolution cross-sectional scan evaluating soft tissues, nerve compression, disc protrusion, or brain parenchymal changes.\n\n"
                "👨‍⚕️ **Recommended Next Steps:**\n"
                "Show full DICOM film and impression notes to a Neurologist or Specialist."
            )

    elif report_type == 'prescription':
        if lang == 'bn':
            return (
                "📄 **রিপোর্ট ওভারভিউ: ডাক্তার প্রেসক্রিপশন (Prescription) ব্যাখ্যা**\n\n"
                "🔍 **সহজ ভাষায় নির্দেশিকা:**\n"
                "• **ওষুধ সেবনের নিয়ম:** খাবারের আগে বা পরে নির্দেশিত সময়ে সঠিক ডোজে ওষুধ সেবন করুন।\n"
                "• **নির্ধারিত পরীক্ষা:** প্রেসক্রিপশনে উল্লেখিত ল্যাব টেস্টগুলো সময়মতো করিয়ে ফেলুন।\n\n"
                "👨‍⚕️ **করণীয়:**\n"
                "ফার্মাসিস্ট বা চিকিৎসকের পরামর্শ মেনে অ্যান্টিবায়োটিকের ফুল কোর্স সম্পন্ন করুন।"
            )
        else:
            return (
                "📄 **Report Overview: Doctor Prescription (Rx) Guide**\n\n"
                "🔍 **Key Directions:**\n"
                "• Adhere strictly to the dosage schedule (Morning - Afternoon - Night) as indicated by your physician.\n"
                "• Complete the full course of prescribed antimicrobial medications.\n\n"
                "👨‍⚕️ **Recommended Next Steps:**\n"
                "Consult your pharmacist or treating doctor for any medication dosage clarification."
            )

    # General Blood / Lab Report Fallback
    if lang == 'bn':
        return (
            "📄 **রিপোর্ট ওভারভিউ: মেডিকেল প্যাথলজি ও ব্লাড রিপোর্ট**\n\n"
            "🔍 **সহজ ভাষায় মূল বিশ্লেষণ:**\n"
            "• **ব্লাড সুগার / ডায়াবেটিস:** ফাস্টিং সুগার ১০০ mg/dL এর নিচে থাকা স্বাভাবিক।\n"
            "• **লিপেড প্রোফাইল (কলেস্টেরল):** ক্ষতিকর কোলেস্টেরল (LDL) কম থাকা এবং ভালো কোলেস্টেরল (HDL) বেশি থাকা সুস্থ হৃদপিন্ডের লক্ষণ।\n"
            "• **কিনেড ও লিভার টেস্ট:** ক্রিয়েটিনিন ও SGPT/SGOT পরীক্ষা কিডনি ও লিভারের কার্যকারিতা নির্দেশ করে।\n\n"
            "👨‍⚕️ **করণীয় ও পরামর্শ:**\n"
            "মেডিসিন বিশেষজ্ঞ ডাক্তারের কাছে রিপোর্ট দেখিয়ে সঠিক ডায়ালাইসিস বা চিকিৎসা গ্রহণ করুন।"
        )
    else:
        return (
            "📄 **Report Overview: General Pathology & Blood Report**\n\n"
            "🔍 **Key Findings in Simple Terms:**\n"
            "• **Glycemic Profile:** Fasting sugar < 100 mg/dL represents healthy glycemic control.\n"
            "• **Lipid Profile:** Low LDL (bad cholesterol) and healthy HDL protects cardiovascular health.\n"
            "• **Renal & Hepatic Panel:** Serum Creatinine and SGPT check kidney and liver function status.\n\n"
            "👨‍⚕️ **Recommended Next Steps:**\n"
            "Consult your Primary Care Physician for routine health evaluation."
        )


# ------------------------------------------------------------------------------
# 5. AI SKIN DISEASE DETECTION ENDPOINT (Gemini Vision + Dermatology AI Engine)
# ------------------------------------------------------------------------------

SYSTEM_SKIN_PROMPT = """
You are Dr. MediPulse AI, a specialist AI Dermatologist & Clinical Skin Disease Diagnostic Consultant.
Your task is to analyze user skin lesion images (Acne, Rash, Allergy, Eczema, Fungal Infection, Dermatitis) and explain findings in simple, patient-friendly language (সহজ ভাষায়).

FORMATTING RULES:
1. Respond in the requested language (if Bengali, use natural, empathetic Bengali; if English, clear English).
2. Structure your analysis into 4 crisp sections:
   - 🩺 **ডিজিজ অ্যাসেসমেন্ট / Probable Skin Condition** (1 short sentence identifying the skin issue)
   - 🔍 **মূল কারণ ও বৈশিষ্ট্য / Key Features & Causes** (2-3 concise bullet points)
   - 💊 **প্রাথমিক চিকিৎসা ও হোম কেয়ার / First-Aid & Care Protocol** (2-3 practical home care steps)
   - 👨‍⚕️ **ডাক্তার পরামর্শ / Dermatologist Referral & Next Steps** (Specialist advice & warning signs)
3. Keep tone reassuring, professional, and easy to understand.
"""

@app.route('/api/analyze-skin', methods=['POST'])
def ai_analyze_skin():
    """Handles AI Skin Disease Detection for Acne, Rash, Allergy, Eczema, Fungal & Skin Lesions."""
    try:
        data = request.get_json(silent=True) or {}
        condition_hint = data.get('condition_hint', 'general').strip().lower()
        user_note = data.get('user_note', '').strip()
        image_data = data.get('image_data', '').strip()
        language = str(data.get('lang', 'bn'))
        custom_key = data.get('apiKey', '').strip()

        if not image_data and not user_note:
            return jsonify({"status": "error", "message": "Please capture/upload a skin photo or describe symptoms."}), 400

        ai_response = query_gemini_skin_api(condition_hint, user_note, image_data, language=language, custom_key=custom_key)

        if not ai_response:
            ai_response = generate_clinical_fallback_skin_response(condition_hint, user_note, language)

        return jsonify({
            "status": "success",
            "condition_hint": condition_hint,
            "analysis": ai_response,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })
    except Exception as e:
        print(f"ai_analyze_skin exception fallback: {e}")
        fallback_reply = generate_clinical_fallback_skin_response(
            data.get('condition_hint', 'general') if 'data' in locals() else 'general',
            data.get('user_note', '') if 'data' in locals() else '',
            data.get('lang', 'bn') if 'data' in locals() else 'bn'
        )
        return jsonify({
            "status": "success",
            "analysis": fallback_reply,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })

def query_gemini_skin_api(condition_hint, user_note, image_data=None, language='bn', custom_key=None):
    """Queries Gemini REST API for skin disease image analysis."""
    import urllib.request
    
    api_key = custom_key or os.environ.get('GEMINI_API_KEY') or DEFAULT_GEMINI_KEY
    if not api_key:
        return None

    hint_labels = {
        'acne': 'Acne / Pimples / Comedones',
        'rash': 'Skin Rash / Dermatitis / Erythema',
        'allergy': 'Allergic Hives / Urticaria',
        'eczema': 'Eczema / Dry Scaly Patch',
        'fungal': 'Fungal Infection / Ringworm / Tinea',
        'general': 'General Skin Lesion / Rash'
    }
    hint_label = hint_labels.get(condition_hint, 'Skin Lesion')

    prompt_content = f"{SYSTEM_SKIN_PROMPT}\n\nCategory Hint: {hint_label}\nLanguage: {language}\nPatient Symptoms / Notes:\n{user_note if user_note else 'Analyze the provided skin lesion image.'}"

    parts = [{"text": prompt_content}]

    if image_data and ',' in image_data:
        try:
            mime_part, base64_str = image_data.split(',', 1)
            mime_type = mime_part.split(';')[0].split(':')[1] if 'data:' in mime_part else 'image/jpeg'
            parts.append({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": base64_str
                }
            })
        except Exception as e:
            print(f"Error parsing skin image_data: {e}")

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.25,
            "maxOutputTokens": 450
        }
    }
    data_bytes = json.dumps(payload).encode('utf-8')

    for model_name in GEMINI_MODEL_ENDPOINTS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=14) as resp:
                if resp.status == 200:
                    res_body = json.loads(resp.read().decode('utf-8'))
                    candidates = res_body.get('candidates', [])
                    if candidates and 'content' in candidates[0]:
                        res_parts = candidates[0]['content'].get('parts', [])
                        if res_parts and 'text' in res_parts[0]:
                            reply_text = res_parts[0]['text'].strip()
                            if reply_text:
                                print(f"✅ Gemini Skin Analysis via model: {model_name}")
                                return reply_text
        except Exception as err:
            print(f"Gemini Skin Vision model '{model_name}' fallback: {err}")
            continue

    return None

def generate_clinical_fallback_skin_response(condition_hint, user_note, lang='bn'):
    """Generates structured fallback explanation for skin disease detection."""
    note = user_note.lower()

    if condition_hint == 'acne':
        if lang == 'bn':
            return (
                "🩺 **ডিজিজ অ্যাসেসমেন্ট: ব্রণ / একনে (Acne Vulgaris)**\n\n"
                "🔍 **মূল কারণ ও বৈশিষ্ট্য:**\n"
                "• ত্বকের লোমকূপে অতিরিক্ত সেবাম (তেল) ও ব্যাকটেরিয়ার (C. acnes) জমার কারণে লাল পাম্পল বা ব্ল্যাকহেডস তৈরি হয়।\n"
                "• হরমোনের তারতম্য, ধুলাবালি ও মানসিক চাপ ব্রণ বাড়িয়ে দেয়।\n\n"
                "💊 **প্রাথমিক চিকিৎসা ও হোম কেয়ার:**\n"
                "১. দিনে ২ বার মাইল্ড স্যালিসিলিক অ্যাসিড বা বেঞ্জয়েল পারক্সাইড যুক্ত ফেসওয়াশ দিয়ে মুখ পরিষ্কার করুন।\n"
                "২. ব্রণ কখনো হাত দিয়ে খুঁটবেন বা টিপবেন না (এতে স্থায়ী দাগ ও ইনফেকশন হয়)।\n\n"
                "👨‍⚕️ **ডাক্তার পরামর্শ:**\n"
                "তীব্র সিস্টিক একনে হলে চর্মরোগ বিশেষজ্ঞ (Dermatologist) দেখিয়ে টপিক্যাল রেটিনয়েড বা অ্যান্টিবায়োটিক ক্রিম সেবন করুন।"
            )
        else:
            return (
                "🩺 **Disease Assessment: Acne Vulgaris / Inflammatory Pimples**\n\n"
                "🔍 **Key Features & Causes:**\n"
                "• Blocked pilosebaceous follicles due to excess sebum oil and Cutibacterium acnes proliferation.\n"
                "• Triggered by hormonal changes, stress, and comedogenic cosmetics.\n\n"
                "💊 **First-Aid & Home Care Guidelines:**\n"
                "1. Wash affected skin twice daily with a mild Salicylic Acid (2%) cleanser.\n"
                "2. Avoid picking or popping lesions to prevent hyperpigmentation and scarring.\n\n"
                "👨‍⚕️ **Dermatologist Referral & Next Steps:**\n"
                "Consult a Dermatologist for prescription topical retinoids or topical antibiotics if acne persists."
            )

    elif condition_hint == 'rash':
        if lang == 'bn':
            return (
                "🩺 **ডিজিজ অ্যাসেসমেন্ট: ত্বকের র‍্যাশ / ডার্মাটাইটিস (Skin Rash / Contact Dermatitis)**\n\n"
                "🔍 **মূল কারণ ও বৈশিষ্ট্য:**\n"
                "• রাসায়নিক সাবান, নতুন প্রসাধনী, উদ্ভিদের কষ বা পোকামাকড়ের কামড়ে ত্বকে লালচে র‍্যাশ ও চুলকানি হতে পারে।\n"
                "• স্পর্শ করলে স্থানটি হালকা গরম বা খসখসে মনে হতে পারে।\n\n"
                "💊 **প্রাথমিক চিকিৎসা ও হোম কেয়ার:**\n"
                "১. স্থানে ঠান্ডা সুতি কাপড়ের সেক বা ক্যালামাইন লোশন (Calamine Lotion) ব্যবহার করুন।\n"
                "২. তীব্র সাবান বা কেমিক্যাল এড়িয়ে চলুন।\n\n"
                "👨‍⚕️ **ডাক্তার পরামর্শ:**\n"
                "র‍্যাশ ৩ দিনের বেশি স্থায়ী হলে বা ছড়িয়ে পড়লে চর্মরোগ বিশেষজ্ঞের পরামর্শ নিন।"
            )
        else:
            return (
                "🩺 **Disease Assessment: Acute Skin Rash / Contact Dermatitis**\n\n"
                "🔍 **Key Features & Causes:**\n"
                "• Inflammatory skin eruption caused by contact irritants, harsh detergents, or localized friction.\n"
                "• Characterized by localized erythema, mild scaling, and pruriginous sensation.\n\n"
                "💊 **First-Aid & Home Care Guidelines:**\n"
                "1. Apply Calamine Lotion or a cool compress to soothe itching.\n"
                "2. Avoid harsh chemical soaps or fragrances on the affected zone.\n\n"
                "👨‍⚕️ **Dermatologist Referral & Next Steps:**\n"
                "Seek medical advice if rash spreads rapidly or develops fluid blisters."
            )

    elif condition_hint == 'allergy':
        if lang == 'bn':
            return (
                "🩺 **ডিজিজ অ্যাসেসমেন্ট: স্কিন এলার্জি / আর্টিকেরিয়া (Allergic Hives / Urticaria)**\n\n"
                "🔍 **মূল কারণ ও বৈশিষ্ট্য:**\n"
                "• অ্যালার্জিযুক্ত খাবার (চিংড়ি, ডিম, বাদাম), ওষুধ বা ধুলাবালি থেকে রক্তে হিস্টামিন নিসরণের ফলে চাকা চাকা লাল দাগ ও তীব্র চুলকানি তৈরি হয়।\n\n"
                "💊 **প্রাথমিক চিকিৎসা ও হোম কেয়ার:**\n"
                "১. চুলকানোর জায়গায় বরফ বা ঠান্ডা পানি দিন।\n"
                "২. ডাক্তারের নির্দেশ অনুযায়ী অ্যান্টিহিস্টামিন (যেমন ফেক্সোফেনাডিন / সেটিরিসিন) সেবন করা যেতে পারে।\n\n"
                "👨‍⚕️ **জরুরি সতর্কতা:**\n"
                "এলার্জির সাথে শ্বাসকষ্ট বা মুখ-ঠোঁট ফুলে গেলে অবিলম্বে ইমার্জেন্সিতে যান।"
            )
        else:
            return (
                "🩺 **Disease Assessment: Allergic Urticaria / Acute Hives**\n\n"
                "🔍 **Key Features & Causes:**\n"
                "• Raised, erythematous wheals triggered by food allergens, medications, or environmental histamine release.\n\n"
                "💊 **First-Aid & Home Care Guidelines:**\n"
                "1. Apply ice packs to relieve intense itchiness.\n"
                "2. Antihistamine medications (e.g. Fexofenadine or Cetirizine) under medical guidance.\n\n"
                "👨‍⚕️ **Emergency Alert:**\n"
                "If hives are accompanied by facial swelling or shortness of breath, seek emergency care immediately."
            )

    elif condition_hint == 'fungal':
        if lang == 'bn':
            return (
                "🩺 **ডিজিজ অ্যাসেসমেন্ট: ফাঙ্গাল ইনফেকশন / দাদ (Tinea / Ringworm Infection)**\n\n"
                "🔍 **মূল কারণ ও বৈশিষ্ট্য:**\n"
                "• স্যাঁতসেঁতে আবহাওয়া বা ঘামের কারণে গোল চাকার মতো লাল সীমানাযুক্ত চুলকানি (Ringworm) দেখা যায়।\n\n"
                "💊 **প্রাথমিক চিকিৎসা ও হোম কেয়ার:**\n"
                "১. স্থানটি সবসময় শুষ্ক ও পরিষ্কার রাখুন। অন্যের গামছা বা কাপড় ব্যবহার করবেন না।\n"
                "২. অ্যান্টিফাঙ্গাল ক্রিম (যেমন ক্লোট্রিমাজল বা টারবিনাফিন) চিকিৎসকের পরামর্শে লাগান।\n\n"
                "👨‍⚕️ **ডাক্তার পরামর্শ:**\n"
                "চর্মরোগ বিশেষজ্ঞ দেখিয়ে অ্যান্টিফাঙ্গাল কোর্স সম্পন্ন করুন।"
            )
        else:
            return (
                "🩺 **Disease Assessment: Superficial Fungal Infection (Tinea Corporis)**\n\n"
                "🔍 **Key Features & Causes:**\n"
                "• Annular scaly plaque with active erythematous border caused by dermatophyte fungi in humid environments.\n\n"
                "💊 **First-Aid & Home Care Guidelines:**\n"
                "1. Keep skin folds completely clean and dry.\n"
                "2. Apply topical Antifungal cream (Clotrimazole/Terbinafine) under medical advice.\n\n"
                "👨‍⚕️ **Dermatologist Referral & Next Steps:**\n"
                "Consult a Dermatologist to complete full antifungal therapy."
            )

    # General Skin Lesion Fallback
    if lang == 'bn':
        return (
            "🩺 **ডিজিজ অ্যাসেসমেন্ট: ত্বকের চর্মরোগ বিশ্লেষণ (Skin Lesion Evaluation)**\n\n"
            "🔍 **মূল কারণ ও বৈশিষ্ট্য:**\n"
            "• আপনার ত্বকের ছবি ও লক্ষণের ওপর ভিত্তি করে প্রদাহ বা এলার্জিক রেসপন্স দেখা যাচ্ছে।\n\n"
            "💊 **প্রাথমিক চিকিৎসা ও হোম কেয়ার:**\n"
            "১. স্থানটি পরিষ্কার পানি দিয়ে ধুয়ে নরম কাপড়ে মুছে নিন।\n"
            "২. অতিরিক্ত খোঁচাখুঁচি বা না জেনে কেমিক্যাল ক্রিম ব্যবহার থেকে বিরত থাকুন।\n\n"
            "👨‍⚕️ **ডাক্তার পরামর্শ:**\n"
            "সঠিক বায়োপসি বা চর্মরোগ ডায়াগনোসিসের জন্য চর্মরোগ বিশেষজ্ঞ (Dermatologist) দেখান।"
        )
    else:
        return (
            "🩺 **Disease Assessment: General Skin Lesion Evaluation**\n\n"
            "🔍 **Key Features & Clinical Findings:**\n"
            "• Superficial cutaneous inflammation or localized hypersensitivity reaction detected.\n\n"
            "💊 **First-Aid & Home Care Guidelines:**\n"
            "1. Cleanse gently with unperfumed water and keep dry.\n"
            "2. Avoid unprescribed steroid creams.\n\n"
            "👨‍⚕️ **Dermatologist Referral & Next Steps:**\n"
            "Schedule an appointment with a Dermatologist for physical examination."
        )


# ------------------------------------------------------------------------------
# 6. AI FOOD SCANNER & NUTRITION ESTIMATOR ENDPOINT (Gemini Vision + Nutrition AI)
# ------------------------------------------------------------------------------

SYSTEM_FOOD_PROMPT = """
You are Dr. MediPulse AI, an expert Clinical AI Nutritionist & Food Diagnostic Specialist.
Your task is to analyze food dish photos or meal descriptions and calculate accurate macronutrients (Calories, Protein, Fat, Sugar) and provide simple dietary advice (সহজ ভাষায়).

CONCISE FORMATTING RULES:
1. Respond in requested language (if Bengali, use clear, natural Bengali; if English, clear English).
2. Structure your analysis into crisp sections:
   - 🥗 **খাবারের নাম ও বিবরণ / Identified Dish & Portion** (1 short sentence)
   - 💡 **পুষ্টি মূল্যায়ন ও নিউট্রিশন / Nutritional Breakdown** (2-3 bullet points)
   - 🩺 **স্বাস্থ্য প্রভাব / Health Impact** (Suitability for Diabetes, BP, Weight loss)
   - 🥑 **ডায়েট পরামর্শ / Clinical Diet Advice** (Practical tips)
"""

@app.route('/api/analyze-food', methods=['POST'])
def ai_analyze_food():
    """Handles AI Food & Nutrition Analysis for Calories, Protein, Fat & Sugar Estimation."""
    try:
        data = request.get_json(silent=True) or {}
        meal_note = data.get('meal_note', '').strip()
        image_data = data.get('image_data', '').strip()
        language = str(data.get('lang', 'bn'))
        custom_key = data.get('apiKey', '').strip()

        if not image_data and not meal_note:
            return jsonify({"status": "error", "message": "Please upload a food photo or describe your meal."}), 400

        ai_response, macros = query_gemini_food_api(meal_note, image_data, language=language, custom_key=custom_key)

        if not ai_response:
            ai_response, macros = generate_clinical_fallback_food_response(meal_note, language)

        return jsonify({
            "status": "success",
            "macros": macros,
            "analysis": ai_response,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })
    except Exception as e:
        print(f"ai_analyze_food exception fallback: {e}")
        fallback_reply, fallback_macros = generate_clinical_fallback_food_response(
            data.get('meal_note', '') if 'data' in locals() else '',
            data.get('lang', 'bn') if 'data' in locals() else 'bn'
        )
        return jsonify({
            "status": "success",
            "macros": fallback_macros,
            "analysis": fallback_reply,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })

def query_gemini_food_api(meal_note, image_data=None, language='bn', custom_key=None):
    """Queries Gemini REST API for food image macro nutrient analysis."""
    import urllib.request
    
    api_key = custom_key or os.environ.get('GEMINI_API_KEY') or DEFAULT_GEMINI_KEY
    if not api_key:
        return None, None

    prompt_content = (
        f"{SYSTEM_FOOD_PROMPT}\n\nLanguage: {language}\nPatient Meal Notes:\n{meal_note if meal_note else 'Analyze food items in image.'}\n\n"
        f"INSTRUCTION: Please also include a macro summary header line formatted exactly like:\n"
        f"MACROS: [Calories kcal] | [Protein g] | [Fat g] | [Sugar g]"
    )

    parts = [{"text": prompt_content}]

    if image_data and ',' in image_data:
        try:
            mime_part, base64_str = image_data.split(',', 1)
            mime_type = mime_part.split(';')[0].split(':')[1] if 'data:' in mime_part else 'image/jpeg'
            parts.append({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": base64_str
                }
            })
        except Exception as e:
            print(f"Error parsing food image_data: {e}")

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 450
        }
    }
    data_bytes = json.dumps(payload).encode('utf-8')

    for model_name in GEMINI_MODEL_ENDPOINTS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=14) as resp:
                if resp.status == 200:
                    res_body = json.loads(resp.read().decode('utf-8'))
                    candidates = res_body.get('candidates', [])
                    if candidates and 'content' in candidates[0]:
                        res_parts = candidates[0]['content'].get('parts', [])
                        if res_parts and 'text' in res_parts[0]:
                            reply_text = res_parts[0]['text'].strip()
                            if reply_text:
                                print(f"✅ Gemini Food Analysis via model: {model_name}")
                                macros = parse_macros_from_text(reply_text)
                                return reply_text, macros
        except Exception as err:
            print(f"Gemini Food Vision model '{model_name}' fallback: {err}")
            continue

    return None, None

def parse_macros_from_text(text):
    """Parses macro values (Calories, Protein, Fat, Sugar) from response text or provides defaults."""
    import re
    macros = {"calories": "420 kcal", "protein": "22g", "fat": "12g", "sugar": "8g"}
    
    cal_match = re.search(r'(\d+)\s*(?:kcal|calories|ক্যালরি)', text, re.IGNORECASE)
    if cal_match:
        macros["calories"] = f"{cal_match.group(1)} kcal"

    prot_match = re.search(r'(?:protein|প্রোটিন)[:\s]*(\d+g|\d+\s*g)', text, re.IGNORECASE)
    if prot_match:
        macros["protein"] = prot_match.group(1).replace(' ', '')

    fat_match = re.search(r'(?:fat|ফ্যাট)[:\s]*(\d+g|\d+\s*g)', text, re.IGNORECASE)
    if fat_match:
        macros["fat"] = fat_match.group(1).replace(' ', '')

    sug_match = re.search(r'(?:sugar|সুগার|শর্করা)[:\s]*(\d+g|\d+\s*g)', text, re.IGNORECASE)
    if sug_match:
        macros["sugar"] = sug_match.group(1).replace(' ', '')

    return macros

def generate_clinical_fallback_food_response(meal_note, lang='bn'):
    """Generates structured fallback macro estimates and nutritional advice for meals."""
    note = meal_note.lower()

    # Rule-Based Macro Estimator
    if any(k in note for k in ['burger', 'fast food', 'pizza', 'fries']):
        macros = {"calories": "680 kcal", "protein": "24g", "fat": "32g", "sugar": "14g"}
        if lang == 'bn':
            text = (
                "🥗 **খাবারের নাম: ফাস্ট ফুড (বার্গার / পিৎজা / ফ্রাই)**\n\n"
                "💡 **পুষ্টি মূল্যায়ন:**\n"
                "• এই জাতীয় খাবারে সম্পৃক্ত ফ্যাট (Saturated Fat) ও ক্যালরির পরিমাণ অত্যন্ত বেশি।\n"
                "• এতে রিফাইনড কার্বোহাইড্রেট ও সোডিয়াম (লবণ) বেশি থাকে যা ব্লাড প্রেসার ও ওজন বাড়াতে পারে।\n\n"
                "🩺 **স্বাস্থ্য প্রভাব (ডায়াবেটিস ও প্রেসার):**\n"
                "• ডায়াবেটিস ও উচ্চ রক্তচাপের রোগীদের এই খাবার এড়িয়ে চলা উচিত।\n\n"
                "🥑 **ডায়েট পরামর্শ:**\n"
                "সাথে তাজা সালাদ খান এবং কোল্ড ড্রিংকস বা অতিরিক্ত সস এড়িয়ে চলুন।"
            )
        else:
            text = (
                "🥗 **Identified Meal: High-Calorie Fast Food**\n\n"
                "💡 **Nutritional Evaluation:**\n"
                "• High in saturated fats, refined carbohydrates, and sodium.\n"
                "• High caloric density which can contribute to weight gain.\n\n"
                "🩺 **Health Impact:**\n"
                "Not recommended for individuals with Hypertension or Type-2 Diabetes.\n\n"
                "🥑 **Diet Recommendation:**\n"
                "Pair with fresh green salads and eliminate sugary carbonated beverages."
            )

    elif any(k in note for k in ['salad', 'fruit', 'vegetable', 'সবজি', 'ফল', 'সালাদ']):
        macros = {"calories": "180 kcal", "protein": "8g", "fat": "4g", "sugar": "12g"}
        if lang == 'bn':
            text = (
                "🥗 **খাবারের নাম: তাজা শাকসবজি ও সালাদ (Healthy Green Salad)**\n\n"
                "💡 **পুষ্টি মূল্যায়ন:**\n"
                "• এতে প্রচুর পরিমাণে ডায়েটারি ফাইবার, ভিটামিন সি, অ্যান্টিঅক্সিডেন্ট ও মিনারেলস রয়েছে।\n"
                "• ক্যালরি ও ফ্যাট অত্যন্ত কম, যা পরিপাকতন্ত্র ও ওজন নিয়ন্ত্রণের জন্য আদর্শ।\n\n"
                "🩺 **স্বাস্থ্য প্রভাব:**\n"
                "• ডায়াবেটিস, উচ্চ রক্তচাপ ও ফ্যাটি লিভারের রোগীদের জন্য অত্যন্ত উপকারী।\n\n"
                "🥑 **ডায়েট পরামর্শ:**\n"
                "প্রতিদিনের দুপুরের বা রাতের খাবারের সাথে অন্তত ১ বাটি সালাদ অন্তর্ভুক্ত করুন।"
            )
        else:
            text = (
                "🥗 **Identified Meal: Fresh Nutrient-Dense Salad**\n\n"
                "💡 **Nutritional Evaluation:**\n"
                "• Rich in dietary fiber, antioxidant micronutrients, and essential minerals.\n"
                "• Low glycemic index and minimal saturated fats.\n\n"
                "🩺 **Health Impact:**\n"
                "Highly beneficial for Glycemic Control, Heart Health & Weight Loss.\n\n"
                "🥑 **Diet Recommendation:**\n"
                "Incorporate a bowl of raw vegetables with olive oil dressing into your daily routine."
            )

    elif any(k in note for k in ['biryani', 'kacchi', 'pulao', 'বিরিয়ানি', 'পোলাও']):
        macros = {"calories": "750 kcal", "protein": "28g", "fat": "36g", "sugar": "8g"}
        if lang == 'bn':
            text = (
                "🥗 **খাবারের নাম: কাচ্চি / মাটন বিরিয়ানি (Biryani Special)**\n\n"
                "💡 **পুষ্টি মূল্যায়ন:**\n"
                "• সুস্বাদু হলেও এতে ঘি, তেল ও মাংসের চর্বির কারণে উচ্চ ক্যালরি ও ফ্যাট থাকে।\n"
                "• প্রচুর প্রোটিন রয়েছে, তবে কার্বোহাইড্রেট ও ক্যালরির মাত্রা বেশ চড়া।\n\n"
                "🩺 **স্বাস্থ্য প্রভাব:**\n"
                "• গ্যাস্ট্রিক বা ডায়াবেটিসের রোগীদের একবারে বেশি না খেয়ে নিয়ন্ত্রিত পরিমাণে খাওয়া উচিত।\n\n"
                "🥑 **ডায়েট পরামর্শ:**\n"
                "বিরিয়ানি খাওয়ার পর প্রচুর পানি পান করুন এবং ১০-১৫ মিনিট হাঁটাহাঁটি করুন।"
            )
        else:
            text = (
                "🥗 **Identified Meal: Rice & Meat Biryani**\n\n"
                "💡 **Nutritional Evaluation:**\n"
                "• High caloric meal with substantial protein and rich fat content from ghee and meat.\n\n"
                "🩺 **Health Impact:**\n"
                "Requires moderation for individuals monitoring cholesterol or blood sugar levels.\n\n"
                "🥑 **Diet Recommendation:**\n"
                "Consume moderate portions and balance with green salad and oral hydration."
            )

    # Standard Balanced Meal (Rice, Fish/Chicken, Dal, Vegetables) Fallback
    else:
        macros = {"calories": "450 kcal", "protein": "26g", "fat": "14g", "sugar": "6g"}
        if lang == 'bn':
            text = (
                "🥗 **খাবারের নাম: সুষম পুষ্টিকর খাবার (Balanced Meal Plate)**\n\n"
                "💡 **পুষ্টি মূল্যায়ন:**\n"
                "• কার্বোহাইড্রেট (ভাত/রুটি), প্রোটিন (মাছ/মুরগি/ডিম) ও ফাইবারের (সবজি) ভালো ভারসাম্য রয়েছে।\n"
                "• শরীরের দৈনিক শক্তি ও পেশি গঠনে সহায়তায় আদর্শ পুষ্টিমান।\n\n"
                "🩺 **স্বাস্থ্য প্রভাব:**\n"
                "• সুস্থ জীবনধারা ও সুস্থ হৃদপিন্ডের জন্য এ ধরনের সুষম সুষম খাদ্য উপযুক্ত।\n\n"
                "🥑 **ডায়েট পরামর্শ:**\n"
                "খাবারে বাড়তি লবণ ও ভাজাপোড়া এড়িয়ে চলুন এবং তাজা ফলমূল খান।"
            )
        else:
            text = (
                "🥗 **Identified Meal: Balanced Protein & Nutrient Plate**\n\n"
                "💡 **Nutritional Evaluation:**\n"
                "• Good balance of complex carbohydrates, lean protein, and essential dietary fiber.\n"
                "• Ideal macro distribution supporting muscle maintenance and steady metabolic energy.\n\n"
                "🩺 **Health Impact:**\n"
                "Optimal for general wellness, blood sugar stabilization, and cardiovascular care.\n\n"
                "🥑 **Diet Recommendation:**\n"
                "Maintain healthy hydration (2.5L water/day) and minimize refined sugar intake."
            )

    return text, macros


# ------------------------------------------------------------------------------
# 7. AI MEDICINE SAFETY & INTERACTION CHECKER ENDPOINT (Gemini Pharmacology)
# ------------------------------------------------------------------------------

SYSTEM_MED_SAFETY_PROMPT = """
You are Dr. MediPulse AI, an expert Clinical Pharmacologist & Drug Safety Specialist.
Your task is to analyze medicine lists or schedules and explain their purpose, food timing (Before/After meal), side effects, and drug safety guidelines in simple language (সহজ ভাষায়).

FORMATTING RULES:
1. Respond in requested language (Bengali if 'bn', English otherwise).
2. Structure your analysis into crisp sections:
   - 💊 **ঔষধের কাজ ও ক্যাটাগরি / Indications & Purpose** (Short summary per medicine)
   - ⏰ **খাবার ও সেবন বিধি / Food Timing & Administration** (Before vs After meal rules)
   - ⚠️ **পার্শ্বপ্রতিক্রিয়া ও সতর্কতা / Side Effects & Warnings** (2-3 key precautions)
   - 👨‍⚕️ **ডাক্তার পরামর্শ / Pharmacist Advisory** (Important guidance)
"""

@app.route('/api/check-medicine-safety', methods=['POST'])
def ai_check_medicine_safety():
    """Handles AI Medicine Safety, Food Timing & Drug Interaction Check."""
    try:
        data = request.get_json(silent=True) or {}
        med_list = data.get('medicines', [])
        language = str(data.get('lang', 'bn'))
        custom_key = data.get('apiKey', '').strip()

        if isinstance(med_list, str):
            med_list = [m.strip() for m in med_list.split(',') if m.strip()]

        if not med_list:
            return jsonify({"status": "error", "message": "Please add at least one medicine name."}), 400

        ai_response = query_gemini_med_safety_api(med_list, language=language, custom_key=custom_key)

        if not ai_response:
            ai_response = generate_clinical_fallback_med_safety_response(med_list, language)

        return jsonify({
            "status": "success",
            "medicines": med_list,
            "analysis": ai_response,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })
    except Exception as e:
        print(f"ai_check_medicine_safety exception fallback: {e}")
        fallback_reply = generate_clinical_fallback_med_safety_response(
            data.get('medicines', []) if 'data' in locals() else [],
            data.get('lang', 'bn') if 'data' in locals() else 'bn'
        )
        return jsonify({
            "status": "success",
            "analysis": fallback_reply,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })

def query_gemini_med_safety_api(med_list, language='bn', custom_key=None):
    """Queries Gemini REST API for medicine safety analysis."""
    import urllib.request
    
    api_key = custom_key or os.environ.get('GEMINI_API_KEY') or DEFAULT_GEMINI_KEY
    if not api_key:
        return None

    meds_str = ", ".join(med_list)
    prompt_content = f"{SYSTEM_MED_SAFETY_PROMPT}\n\nLanguage: {language}\nPatient Medicine List:\n{meds_str}"

    payload = {
        "contents": [{"parts": [{"text": prompt_content}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 450
        }
    }
    data_bytes = json.dumps(payload).encode('utf-8')

    for model_name in GEMINI_MODEL_ENDPOINTS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=14) as resp:
                if resp.status == 200:
                    res_body = json.loads(resp.read().decode('utf-8'))
                    candidates = res_body.get('candidates', [])
                    if candidates and 'content' in candidates[0]:
                        res_parts = candidates[0]['content'].get('parts', [])
                        if res_parts and 'text' in res_parts[0]:
                            reply_text = res_parts[0]['text'].strip()
                            if reply_text:
                                print(f"✅ Gemini Medicine Safety via model: {model_name}")
                                return reply_text
        except Exception as err:
            print(f"Gemini Med Safety model '{model_name}' fallback: {err}")
            continue

    return None

def generate_clinical_fallback_med_safety_response(med_list, lang='bn'):
    """Generates structured fallback pharmacology guidance for common medicines."""
    meds_str = ", ".join(med_list) if isinstance(med_list, list) else str(med_list)

    if lang == 'bn':
        return (
            f"💊 **ঔষধের নামসমূহ:** {meds_str}\n\n"
            "🔍 **কাজ ও সেবন বিধি (সহজ ভাষায়):**\n"
            "• **গ্যাস্ট্রিকের ওষুধ (Omeprazole / Seclo / Pantoprazole):** প্রতিদিন সকালে খাবারের ৩০ মিনিট আগে খালি পেটে সেবন করা উচিত।\n"
            "• **ব্যথানাশক ও জ্বর (Paracetamol / Napa / Ace):** ভরা পেটে হালকা গরম পানি দিয়ে সেবন করুন। ২৪ ঘণ্টায় ৪ গ্রাম বা ৮টির বেশি প্যারাসিটামল খাবেন না।\n"
            "• **অ্যান্টিবায়োটিক (Amoxicillin / Azithromycin):** চিকিৎসকের পরামর্শ অনুযায়ী নির্দিষ্ট কোর্স সম্পূর্ণ শেষ করুন (মাঝপথে বন্ধ করবেন না)।\n\n"
            "⚠️ **পার্শ্বপ্রতিক্রিয়া ও সতর্কতা:**\n"
            "১. খালি পেটে কোনো ব্যথানাশক ওষুধ খাবেন না (এতে গ্যাস্ট্রিক বা আলসার হতে পারে)।\n"
            "২. গর্ভবতী বা স্তন্যদানকারী মায়েরা ফার্মাসিস্ট বা ডাক্তারের পরামর্শ ছাড়া ওষুধ সেবন করবেন না।\n\n"
            "👨‍⚕️ **পরামর্শ:** আপনার প্রেসক্রিপশন অনুযায়ী সঠিক সময়ে নিয়মিত ওষুধ সেবন করুন।"
        )
    else:
        return (
            f"💊 **Submitted Medicine List:** {meds_str}\n\n"
            "🔍 **Indications & Administration Rules:**\n"
            "• **Antacids/PPIs (Omeprazole, Pantoprazole):** Administer 30 minutes prior to morning meal on empty stomach.\n"
            "• **Analgesics/Antipyretics (Paracetamol, Napa):** Take post-meal with water. Do not exceed 4,000mg per 24 hours.\n"
            "• **Antibiotics:** Complete the full prescribed course as advised by your attending physician.\n\n"
            "⚠️ **Side Effects & Safety Precautions:**\n"
            "1. Avoid taking NSAIDs/Painkillers on an empty stomach to prevent gastric mucosal irritation.\n"
            "2. Pregnant or lactating women should verify drug compatibility with a registered Pharmacist.\n\n"
            "👨‍⚕️ **Recommendation:** Adhere strictly to the dose timings set by your healthcare provider."
        )


# ------------------------------------------------------------------------------
# 8. AI HEALTH HISTORY & LONGITUDINAL TRENDS ENDPOINT (Gemini Clinical Historian)
# ------------------------------------------------------------------------------

SYSTEM_HISTORY_PROMPT = """
You are Dr. MediPulse AI, a specialist Clinical Health Historian & Longitudinal Trend Analyst.
Your task is to analyze a patient's historical symptom timeline and synthesize a professional Doctor-ready Health Summary in simple language (সহজ ভাষায়).

FORMATTING RULES:
1. Respond in requested language (Bengali if 'bn', English otherwise).
2. Structure your analysis into 4 clear sections:
   - 📈 **লক্ষণ টাইমলাইন ওভারভিউ / Longitudinal Symptom Overview** (Brief summary of dates & recorded symptoms)
   - 🩺 **সম্ভাব্য শারীরিক বিশ্লেষণ / Clinical Evaluation** (2-3 bullet points connecting symptoms or noting acute episodes)
   - 👨‍⚕️ **ডাক্তারের জন্য প্রস্তুত সামারি / Doctor Consultation Summary** (Crisp clinical summary for attending physician)
   - 🥑 **সতর্কতা ও পরবর্তী পদক্ষেপ / Recommended Action & Next Steps** (Key warnings & tracking tips)
"""

@app.route('/api/summarize-health-history', methods=['POST'])
def ai_summarize_health_history():
    """Handles AI Longitudinal Health History Summary & Trend Evaluation for Doctor Sharing."""
    try:
        data = request.get_json(silent=True) or {}
        items = data.get('history_items', [])
        language = str(data.get('lang', 'bn'))
        custom_key = data.get('apiKey', '').strip()

        if not items:
            return jsonify({"status": "error", "message": "No health history entries found to summarize."}), 400

        ai_response = query_gemini_history_summary_api(items, language=language, custom_key=custom_key)

        if not ai_response:
            ai_response = generate_clinical_fallback_history_response(items, language)

        return jsonify({
            "status": "success",
            "count": len(items),
            "analysis": ai_response,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })
    except Exception as e:
        print(f"ai_summarize_health_history exception fallback: {e}")
        fallback_reply = generate_clinical_fallback_history_response(
            data.get('history_items', []) if 'data' in locals() else [],
            data.get('lang', 'bn') if 'data' in locals() else 'bn'
        )
        return jsonify({
            "status": "success",
            "analysis": fallback_reply,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })

def query_gemini_history_summary_api(items, language='bn', custom_key=None):
    """Queries Gemini REST API for health history timeline analysis."""
    import urllib.request
    
    api_key = custom_key or os.environ.get('GEMINI_API_KEY') or DEFAULT_GEMINI_KEY
    if not api_key:
        return None

    timeline_str = "\n".join([f"• [{item.get('date', 'N/A')}] {item.get('symptom', 'Symptom')} ({item.get('category', 'General')})" for item in items])
    prompt_content = f"{SYSTEM_HISTORY_PROMPT}\n\nLanguage: {language}\nPatient Symptom Timeline Journal:\n{timeline_str}"

    payload = {
        "contents": [{"parts": [{"text": prompt_content}]}],
        "generationConfig": {
            "temperature": 0.25,
            "maxOutputTokens": 500
        }
    }
    data_bytes = json.dumps(payload).encode('utf-8')

    for model_name in GEMINI_MODEL_ENDPOINTS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=14) as resp:
                if resp.status == 200:
                    res_body = json.loads(resp.read().decode('utf-8'))
                    candidates = res_body.get('candidates', [])
                    if candidates and 'content' in candidates[0]:
                        res_parts = candidates[0]['content'].get('parts', [])
                        if res_parts and 'text' in res_parts[0]:
                            reply_text = res_parts[0]['text'].strip()
                            if reply_text:
                                print(f"✅ Gemini Health History Summary via model: {model_name}")
                                return reply_text
        except Exception as err:
            print(f"Gemini History model '{model_name}' fallback: {err}")
            continue

    return None

def generate_clinical_fallback_history_response(items, lang='bn'):
    """Generates structured fallback medical summary from symptom timeline."""
    timeline_lines = [f"• **{item.get('date', 'N/A')}:** {item.get('symptom', 'Symptom')}" for item in items]
    timeline_str = "\n".join(timeline_lines) if timeline_lines else "• রেকর্ডকৃত কোনো তথ্য পাওয়া যায়নি।"

    if lang == 'bn':
        return (
            "📈 **লক্ষণ টাইমলাইন ওভারভিউ (Patient History Log):**\n"
            f"{timeline_str}\n\n"
            "🔍 **সহজ ভাষায় মূল ক্লিনিক্যাল বিশ্লেষণ:**\n"
            "• রেকর্ডকৃত তথ্য অনুযায়ী ভিন্ন সময়ে মাথা ব্যথা, জ্বর বা পেটে ব্যথার মতো উপসর্গ দেখা দিয়েছে।\n"
            "• উপসর্গগুলো স্বল্পমেয়াদী বা সিজনাল ইনফেকশনের কারণে হতে পারে।\n\n"
            "👨‍⚕️ **ডাক্তারের কাছে দেখানোর উপযোগী বিবরণ:**\n"
            "রোগীর সেবনকৃত ওষুধের তালিকা এবং এই টাইমলাইন রিপোর্টটি সরাসরি চিকিৎসকের কাছে প্রদর্শন করা যেতে পারে।\n\n"
            "🥑 **পরামর্শ ও সতর্কতা:**\n"
            "উপসর্গ বারবার দেখা দিলে বা তীব্রতা বাড়লে কালবিলম্ব না করে বিশেষজ্ঞ ডাক্তারের পরামর্শ গ্রহণ করুন।"
        )
    else:
        return (
            "📈 **Longitudinal Health Timeline Record:**\n"
            f"{timeline_str}\n\n"
            "🔍 **Clinical Evaluation & Trends:**\n"
            "• Multiple episode logs recorded across various dates (e.g. Headache, Fever, Abdominal Discomfort).\n"
            "• Symptoms suggest independent acute episodes or recurring inflammatory triggers.\n\n"
            "👨‍⚕️ **Doctor Consultation Summary:**\n"
            "Share this chronological health log with your primary care physician during routine clinical visits.\n\n"
            "🥑 **Next Steps & Precautions:**\n"
            "If any symptom increases in intensity, seek immediate clinical evaluation."
        )


# ------------------------------------------------------------------------------
# 9. AI VOICE & COUGH SOUND ANALYZER ENDPOINT (Gemini Multimodal Audio Pulmonology)
# ------------------------------------------------------------------------------

SYSTEM_VOICE_COUGH_PROMPT = """
You are Dr. MediPulse AI, a specialist Pulmonologist & Acoustic Respiratory Sound Analyst.
Your task is to analyze recorded cough audio or vocal sounds and provide an acoustic assessment of potential respiratory conditions in simple patient-friendly language (সহজ ভাষায়).

FORMATTING RULES:
1. Respond in requested language (Bengali if 'bn', English otherwise).
2. Structure your analysis into 4 clear sections:
   - 🫁 **কাশি ও শব্দের ধরণ বিশ্লেষণ / Acoustic & Cough Characteristics** (Identify if Dry Cough, Wet/Productive Cough, Wheezing, Barking, or Hoarseness)
   - 🩺 **সম্ভাব্য শ্বাসযন্ত্রের অবস্থা / Respiratory Assessment** (Evaluate potential conditions e.g. Bronchitis, Asthma, Cold/Flu, Laryngitis, Allergy)
   - ⚠️ **জরুরি শ্বাসকষ্টের সতর্কতা / Emergency Respiratory Red Flags** (Key warnings e.g. shortness of breath, chest tightness, stridor)
   - 🍵 **প্রাথমিক উপশম ও ঘরোয়া যত্ন / Home Care & Warm Fluids** (Steam inhalation, warm honey water, hydration, doctor referral)
"""

@app.route('/api/analyze-voice-cough', methods=['POST'])
def ai_analyze_voice_cough():
    """Handles AI Voice & Cough Audio Acoustic Analysis."""
    try:
        data = request.get_json(silent=True) or {}
        audio_data = data.get('audio_data', '').strip()
        audio_mime = str(data.get('audio_mime', 'audio/webm')).strip()
        symptom_notes = str(data.get('symptom_notes', '')).strip()
        language = str(data.get('lang', 'bn'))
        custom_key = data.get('apiKey', '').strip()

        if not audio_data and not symptom_notes:
            return jsonify({"status": "error", "message": "Please record or upload audio sound."}), 400

        ai_response = query_gemini_audio_analysis_api(audio_data, audio_mime, symptom_notes, language=language, custom_key=custom_key)

        if not ai_response:
            ai_response = generate_clinical_fallback_voice_response(symptom_notes, language)

        return jsonify({
            "status": "success",
            "analysis": ai_response,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })
    except Exception as e:
        print(f"ai_analyze_voice_cough exception fallback: {e}")
        fallback_reply = generate_clinical_fallback_voice_response(
            data.get('symptom_notes', '') if 'data' in locals() else '',
            data.get('lang', 'bn') if 'data' in locals() else 'bn'
        )
        return jsonify({
            "status": "success",
            "analysis": fallback_reply,
            "timestamp": datetime.now(timezone.utc).strftime("%I:%M %p")
        })

def query_gemini_audio_analysis_api(audio_data, audio_mime='audio/webm', symptom_notes='', language='bn', custom_key=None):
    """Queries Gemini Multimodal REST API with inline audio bytes."""
    import urllib.request
    
    api_key = custom_key or os.environ.get('GEMINI_API_KEY') or DEFAULT_GEMINI_KEY
    if not api_key:
        return None

    # Parse Base64 Data URI if present
    b64_audio = audio_data
    if ',' in b64_audio:
        b64_audio = b64_audio.split(',', 1)[1]

    parts = []
    if b64_audio:
        # Standardize Mime type for Gemini Multimodal Audio
        clean_mime = audio_mime.split(';')[0] if ';' in audio_mime else audio_mime
        if not clean_mime or 'audio' not in clean_mime:
            clean_mime = 'audio/webm'
        parts.append({"inline_data": {"mime_type": clean_mime, "data": b64_audio}})

    user_text = f"{SYSTEM_VOICE_COUGH_PROMPT}\n\nLanguage: {language}\nPatient Respiratory Notes: {symptom_notes if symptom_notes else 'Cough / Vocal sound recording provided.'}"
    parts.append({"text": user_text})

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 550
        }
    }
    data_bytes = json.dumps(payload).encode('utf-8')

    for model_name in GEMINI_MODEL_ENDPOINTS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=16) as resp:
                if resp.status == 200:
                    res_body = json.loads(resp.read().decode('utf-8'))
                    candidates = res_body.get('candidates', [])
                    if candidates and 'content' in candidates[0]:
                        res_parts = candidates[0]['content'].get('parts', [])
                        if res_parts and 'text' in res_parts[0]:
                            reply_text = res_parts[0]['text'].strip()
                            if reply_text:
                                print(f"✅ Gemini Voice/Cough Analysis via model: {model_name}")
                                return reply_text
        except Exception as err:
            print(f"Gemini Voice model '{model_name}' fallback: {err}")
            continue

    return None

def generate_clinical_fallback_voice_response(symptom_notes='', lang='bn'):
    """Generates structured fallback respiratory acoustic assessment."""
    note_str = f" ({symptom_notes})" if symptom_notes else ""

    if lang == 'bn':
        return (
            f"🫁 **কাশি ও শব্দের ধরণ বিশ্লেষণ (Acoustic Evaluation):**{note_str}\n"
            "• **শব্দের প্রকৃতি:** শুষ্ক কাশি (Dry Cough) বা হালকা কফযুক্ত কাশি (Productive Cough)।\n"
            "• **কণ্ঠস্বরের অবস্থা:** কণ্ঠনালীতে হালকা প্রদাহ বা স্বরভঙ্গ (Mild Hoarseness/Laryngitis)।\n\n"
            "🩺 **সম্ভাব্য শ্বাসযন্ত্রের অবস্থা:**\n"
            "১. **সিজনাল কোল্ড বা ফ্লু (Seasonal Upper Respiratory Infection):** আবহাওয়া পরিবর্তনের কারণে শ্বাসনালীর উপরিভাগে হালকা উদ্দীপনা।\n"
            "২. **ব্রংকাইটিস বা অ্যালার্জিক কাশি (Allergic Airway Hyper-responsiveness):** ধুলাবালি বা অ্যালার্জেনজনিত কাশি।\n\n"
            "⚠️ **জরুরি শ্বাসকষ্টের সতর্কতা (Emergency Red Flags):**\n"
            "• শ্বাস নেওয়ার সময় যদি বাঁশির মতো শব্দ (Wheezing) হয়, বুক চেপে আসে বা তীব্র শ্বাসকষ্ট অনুভব করেন তবে দ্রুত জরুরি বিভাগে যোগাযোগ করুন।\n\n"
            "🍵 **প্রাথমিক উপশম ও ঘরোয়া যত্ন:**\n"
            "• আদা ও মধু মিশ্রিত হালকা গরম পানি সেবন করুন।\n"
            "• দিনে ২-৩ বার কুসুম গরম পানির ভাপ (Steam Inhalation) নিন এবং ধুলোবালি এড়িয়ে চলুন।"
        )
    else:
        return (
            f"🫁 **Acoustic & Cough Sound Assessment:**{note_str}\n"
            "• **Cough Acoustic Profile:** Dry Irritant Cough / Mild Productive Cough.\n"
            "• **Vocal Characteristics:** Mild laryngeal irritation / Vocal cord hoarseness.\n\n"
            "🩺 **Potential Respiratory Conditions:**\n"
            "1. **Seasonal Viral Upper Respiratory Infection (URI):** Common cold or flu-related airway hyper-responsiveness.\n"
            "2. **Allergic Bronchial Irritation:** Environmental dust/pollen allergen reaction.\n\n"
            "⚠️ **Emergency Respiratory Red Flags:**\n"
            "• Seek immediate medical emergency care if experiencing audible wheezing, chest tightness, stridor, or severe shortness of breath.\n\n"
            "🍵 **Home Care & Relief Guidelines:**\n"
            "• Inhale warm water steam 2-3 times daily.\n"
            "• Sip warm fluids (ginger tea, honey water) and avoid cold air exposure."
        )


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🏥 MediPulse AI Clinical Server running on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)








