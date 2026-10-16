import { requireSupabase } from '@/lib/supabase';

export const VIMI_STORAGE_BUCKET = 'vimi-public';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Uploads a public product/business image. Requires a signed-in Supabase user. */
export async function uploadVimiImage(file, folder = 'products') {
  if (!file) throw new Error('Avval fayl tanlang.');
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Faqat JPG, PNG yoki WebP rasmlarini yuklash mumkin.');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Rasm hajmi 5 MB dan oshmasligi kerak.');
  }

  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    throw new Error('Fayl yuklash uchun avval Supabase hisobiga kiring.');
  }

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const filePath = `${user.id}/${folder}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await client.storage
    .from(VIMI_STORAGE_BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });

  if (uploadError) throw uploadError;
  const { data } = client.storage.from(VIMI_STORAGE_BUCKET).getPublicUrl(filePath);
  return { path: filePath, publicUrl: data.publicUrl };
}

export async function deleteVimiImage(filePath) {
  if (!filePath) return;
  const client = requireSupabase();
  const { error } = await client.storage.from(VIMI_STORAGE_BUCKET).remove([filePath]);
  if (error) throw error;
}
