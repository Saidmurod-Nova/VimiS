# Courier Mode — Supabase ulash

Courier Mode Supabase autentifikatsiyasi yoqilgan test muhitida mavjud `orders`,
`order_items`, `branches`, `businesses`, `profiles` va `notifications`
jadvallaridan foydalanadi. Mijozga tegishli telefon va ism faqat buyurtma shu
kuryerga biriktirilganidan keyin RPC javobida beriladi.

## Migratsiya

`supabase/migrations/202611030001_courier_mode.sql` migratsiyasini quyidagilar
avval qo‘llanganidan keyin ko‘rib chiqing va Supabase SQL Editor’da bajaring:

1. `202610130002_vimi_schema.sql`
2. `202610130003_atomic_checkout_order_status.sql`
3. `202610190002_admin_category_access.sql`
4. `202610220001_notification_center.sql`
5. `202611030001_courier_mode.sql`
6. `202611030002_admin_courier_approval_rpc.sql`

Migratsiya `preparing` holatidagi mavjud buyurtmalar uchun yetkazish yozuvlarini
yaratadi. Kelajakda buyurtma `preparing` holatiga o‘tganda ham mavjud
`orders` jadvalidan yangi yetkazish yozuvi ochiladi. Courier Mode alohida
buyurtma nusxasini yoki buyurtma statusini yaratmaydi.

Agar ilovada `Could not find the function public.vimi_courier_get_state` yoki
`public.vimi_admin_list_courier_applications` xabari chiqsa, funksiya ilova
ulanayotgan aynan shu Supabase loyihasida yo‘q yoki PostgREST schema keshi
eskirgan bo‘lishi mumkin. Avval yuqoridagi migratsiya shu loyiha uchun
muvaffaqiyatli qo‘llanganini tekshiring. Qo‘llangan bo‘lsa, SQL Editor’da
quyidagini ishga tushirib, biroz kuting:

```sql
notify pgrst, 'reload schema';
```

So‘ng sahifani qayta yuklab, Courier Mode’ga qayta kiring.

`202611030001` avval qo‘llangan, lekin `/admin` sahifasi kuryer arizalari
RPC funksiyasini topa olmagan muhitlarda yangi `202611030002` migratsiyasini
qo‘llang. U admin RPC funksiyalarini yaratadi va PostgREST schema keshini
yangilaydi.

## Kuryer ruxsati

Oddiy foydalanuvchi o‘z hisobidan ruxsat so‘raydi. So‘rov `pending` holatda
saqlanadi; foydalanuvchi o‘z statusini yoki mavjudligini o‘zgartira olmaydi.
`profiles.role = 'admin'` bo‘lgan administrator `/admin` sahifasidagi
**Kuryer arizalari** bo‘limidan arizani ko‘rib chiqib, **Ruxsat berish** yoki
**Rad etish** tugmasini bosadi. Har ikkala amal server tomonidagi admin RPC
orqali tekshiriladi va ariza holati tranzaksiya ichida yangilanadi; mijoz
tomonidan jadvalga bevosita yozishga ruxsat berilmaydi.

Arizalar va amallar Supabase Auth bilan ishlaydigan muhitda mavjud bo‘ladi.
Kuryerlik ruxsati berilgach, foydalanuvchi Courier Mode’da mavjudlikni yoqishi
mumkin.

## Ulanish va sinov

`.env.local` faylida Supabase project URL va publishable key bo‘lishi kerak:

```env
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

`VITE_AUTH_PROVIDER` butun ilovaning auth/data yo‘llariga ta’sir qiladi. VimiS
Buyer/Seller oqimlarining ayrimlari hali Base44’dan foydalanadi; shu sababli
Supabase provider’ni faqat alohida test muhitida yoqing va production’ga
qo‘llashdan oldin mavjud Buyer/Seller oqimlarini alohida tekshiring. Frontendga
service-role yoki secret key qo‘ymang.

Sinov tartibi:

1. Test user bilan tizimga kiring va Profil → Kuryerlik rejimi orqali ruxsat
   so‘rang.
2. Administrator sifatida yuqoridagi SQL bilan user’ni tasdiqlang.
3. Kuryerlik rejimini ON qiling; faqat `preparing` holatidagi,
   manzili mavjud buyurtmalar taklif qilinadi.
4. Ikki tasdiqlangan user’da bir xil taklifni bir vaqtda qabul qilib ko‘ring;
   faqat birinchi atomik RPC muvaffaqiyatli bo‘lishi kerak.
5. Biriktirilgan kuryer sifatida `accepted → picked_up → on_the_way → delivered`
   tartibida holatlarni yangilang. Yetkazildi RPC buyurtmani mavjud `completed`
   statusiga o‘tkazadi; mavjud notification trigger’lari xaridorga xabar beradi.
6. Xaridor yoki boshqa kuryer bilan login qilib, boshqa kuryerning assignment’i
   va buyer’ning telefon raqami ko‘rinmasligini tekshiring.

## Chegaralar

- Courier Mode RPC funksiyalari RLS’ni chetlab o‘tuvchi xavfsiz funksiyalar
  bo‘lgani uchun session’ning `auth.uid()` qiymatini tekshiradi; ruxsat va
  holat o‘zgarishlari tranzaksiya ichida bajariladi.
- Yangi takliflar ro‘yxatida mijozning ismi va telefoni berilmaydi; ular faqat
  buyurtma kuryerga biriktirilgach ko‘rsatiladi.
- Онлайн саналууд Realtime болон 30 секунд тутмын дахин уншилтаар шинэчлэгдэнэ.
- ETA, GPS, маршрутын зай, хүргэлтийн бодит шимтгэл энэ холболтод үүсгэхгүй.
- SQL va RLS o‘zgarishlari real Supabase loyihasida hali bajarilmagan. Production
  ma’lumotlariga qo‘llashdan oldin staging’da migratsiya, RLS, RPC va bir vaqtda
  qabul qilish holatlarini tekshiring.
