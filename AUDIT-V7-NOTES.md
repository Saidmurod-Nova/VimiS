# Vimi audit v7 — kod o'zgarishlari

Ushbu nusxa 5-, 6- va 7-qismlarni yakunlash yo'lidagi kod ishlarini davom ettiradi. Testlar foydalanuvchi so'roviga muvofiq yakuniy bosqichgacha ataylab bajarilmadi.

## Checkout / savat
- Checkout boshlanishida savat `checking_out` holatiga olinadi; odatiy ketma-ket takroriy so'rovlar paytida buyurtma dublikatini kamaytiradi.
- `Cart` entity sxemasiga `checking_out` holati va `checkout_started_at` maydoni qo'shildi.
- `checking_out` holatidagi savatga qayta checkout kelganda aniq `409` javobi qaytariladi.
- Checkout ombor qoldig'i butun, xavfsiz son ekanini tekshiradi.
- Savatdagi mahsulot miqdori ombor qoldig'idan ko'p bo'lsa, API uni mavjud emas deb belgilaydi; frontenddagi checkout tugmasi ham shunga mos bloklanadi.
- Savat narxi, satr summasi, umumiy summa va mahsulotlar soni xavfsiz sonlar ekanligi tekshiriladi.

## Buyurtma holatlari
- Buyurtma holati muvaffaqiyatli yangilangandan keyingi bildirishnoma xatosi endi muvaffaqiyatli holat o'zgarishini yolg'oncha `500` deb ko'rsatmaydi.

## Muhim cheklovlar
- Base44 entity API'sida tranzaksiya yoki compare-and-swap kafolati yo'q. Shuning uchun mutlaqo parallel checkoutlar uchun bu hali atomar zaxira emas; ishlab chiqarishdan oldin DB-level lock/transaction yoki atomar inventar rezervatsiyasi kerak.
- Testlar, build, lint va Base44 cloud ichidagi tekshiruvlar hali bajarilmadi.
- `checking_out` holati jarayon keskin to'xtab qolsa, qo'lda yoki keyingi recovery mexanizmi bilan tiklashni talab qilishi mumkin.
