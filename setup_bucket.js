const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  const { data, error } = await supabase.storage.createBucket('patient-records', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    fileSizeLimit: 10485760 // 10MB
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket already exists');
      
      const { data: updateData, error: updateError } = await supabase.storage.updateBucket('patient-records', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 10485760
      });
      if (updateError) {
        console.error('Error updating bucket:', updateError.message);
      } else {
        console.log('Bucket updated', updateData);
      }
    } else {
      console.error('Error creating bucket:', error.message);
    }
  } else {
    console.log('Bucket created successfully:', data);
  }
}

createBucket();
