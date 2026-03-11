-- Adds profile fields to patients table
ALTER TABLE public.patients
ADD COLUMN diagnosis TEXT,
ADD COLUMN current_illness TEXT,
ADD COLUMN medical_history TEXT,
ADD COLUMN primary_physician TEXT,
ADD COLUMN family_structure TEXT,
ADD COLUMN key_person_contact TEXT,
ADD COLUMN emergency_response TEXT,
ADD COLUMN precautions TEXT,
ADD COLUMN monthly_schedule TEXT;
