# Supabase Auth va Cart uchun test-checklist

Bu checklist backendga/DBga deploy qilinmasdan oldin ishlatiladi. Mana amaliy ro‘yxat.

## Auth

### 1. Base44 mode
- [ ] `VITE_AUTH_PROVIDER=base44`
- [ ] Login/Register mail+password ishlaydi
- [ ] Google login Base44 flowga kiradi
- [ ] Logout to‘g‘ri `base44.auth.logout` bilan ishlaydi
- [ ] ProtectedRoute `auth_required` holatida login ekraniga qaytadi

### 2. Supabase mode
- [ ] `VITE_AUTH_PROVIDER=supabase`
- [ ] `supabase.auth.getSession()` mavjud sessionni ko‘radi
- [ ] Auth user yaratilganda DB trigger `profiles` yozuvini yaratadi, email tasdiqlash yoqilgan va o‘chirilgan holatlarda
- [ ] `profiles` ma’lumotlari bootstrap vaqtida to‘g‘ri yuklanadi
- [ ] `full_name`, `phone`, `avatar`, `selected_location` faqat foydalanuvchi uchun yangilanadi
- [ ] `role=admin` yoki boshqa imtiyozli maydonlarni frontend o‘zi yubormaydi
- [ ] `onAuthStateChange` unmount bo‘lganda unsubscribe bo‘ladi
- [ ] `auth_required` yoki session yo‘q bo‘lganda noto‘g‘ri redirect bo‘lmaydi

### 3. OAuth
- [ ] Google buttoni callback URL `.../auth/callback` ga yo‘naltiradi
- [ ] Callback sahifasi sessionni oladi va `returnTo` yo‘nalishiga qaytaradi
- [ ] Xatolik paytida tushunarli o‘zbekcha xabar ko‘rinadi
- [ ] Browser loglari yoki UI’da tokenlar ko‘rinmaydi

## Cart

### 1. Active cart invariants
- [ ] Bitta user uchun faqat bir active cart mavjud
- [ ] Cart business + branch bir xil bo‘lishi kerak
- [ ] Boshqa do‘kon/filial savatga qo‘shilsa, conflict dialog ko‘rinadi
- [ ] `forceNew` bo‘lsa, eski savat tozalanib yangi do‘kon/filialga o‘tkaziladi

### 2. Quantity and inventory
- [ ] Quantity 0 yoki manfiy bo‘lmaydi
- [ ] Qoldiqdan oshib ketganda xato qaytariladi
- [ ] Mavjud bo‘lmagan mahsulotlar savatga qo‘shilmaydi
- [ ] `cart_items` unique constraint ishlaydi, duplicate rowlar bo‘lmaydi

### 3. RLS / safety
- [ ] User faqat o‘z cart/cart_items’ini ko‘radi va o‘zgartiradi
- [ ] Boshqa userning cart id bilan so‘rovlar RLS tomonidan bloklanadi
- [ ] RLS-ga zid bo‘lgan so‘rovlar xatolik qaytaradi, UI ham tushunarli xabar ko‘rsatadi

### 4. UI states
- [ ] Loading paytida spinner ko‘rinadi
- [ ] Empty state bo‘sh savat uchun ishlaydi
- [ ] Error state xato bo‘lganda ko‘rinadi
- [ ] Optimistic update xato bo‘lsa rollback bo‘ladi

## Manifold manual test flow

1. Supabase modega o‘tish.
2. Yangi hisob yaratish yoki Google login.
3. Bir mahsulotni savatga qo‘shish.
4. Boshqa do‘kon yoki filialdan boshqa mahsulot qo‘shish; conflict dialogini tekshirish.
5. Quantity oshirish/ kamaytirish.
6. Remove / clear cart holatlarini tekshirish.
7. `auth.uid()` tomonidan boshqa userning cart’iga ruxsat yo‘qligini tekshirish.
8. Logout qilingandan keyin protected routes login sahifasiga qaytishini tasdiqlash.

> Bu checklistni o'tkazganingizdan keyin xulosa chiqaring: "Kod/DB holati yetarlicha xavfsiz" yoki "Yana xavfsizlik bloklari mavjud".
