# Telefon orqali joylashuvni sinash (lokal HTTPS)

Telefon WLAN IP manzili (`http://192.168...`) orqali ochilgan sahifada brauzer GPS’ni bloklaydi. Lokal IP uchun `https://`ning o‘zi yetarli emas: sertifikat telefonda ishonchli bo‘lishi ham kerak.

## 1. Sertifikat yaratish

Kompyuter va telefonni bir xil Wi-Fi tarmog‘iga ulang. Repo ildizida:

```bash
npm run setup:local-https
```

Skript WLAN IP’ni aniqlaydi va `.local-https/` ichida lokal CA hamda shu IP uchun HTTPS sertifikatini yaratadi. IP aniqlanmasa, uni qo‘lda bering:

```bash
npm run setup:local-https -- 192.168.1.25
```

## 2. CA sertifikatini telefonga ishonchli qilib o‘rnatish

`.local-https/local-ca.crt` faylini telefonga USB yoki boshqa mahalliy fayl uzatish usuli bilan ko‘chiring. **Faqat `local-ca.crt` faylini o‘rnating; `local-ca.key` maxfiy CA kalitidir va telefonga yuborilmasligi yoki Git’ga qo‘shilmasligi kerak.**

- **Android:** Sozlamalar → Xavfsizlik → Shifrlash va hisob ma’lumotlari → Sertifikat o‘rnatish → CA sertifikati. Android versiyasiga qarab bo‘lim nomlari farq qilishi mumkin.
- **iPhone/iPad:** `.crt` faylini ochib profilni o‘rnating. So‘ng Sozlamalar → Umumiy → Haqida → Sertifikat ishonch sozlamalari ichida ushbu ildiz sertifikatga to‘liq ishonchni yoqing.

## 3. HTTPS orqali ishga tushirish

```bash
VIMIS_LOCAL_HTTPS=true base44 dev
```

Terminalda ko‘rsatilgan URL o‘rniga sertifikatdagi WLAN URL’ni telefonda oching, masalan `https://192.168.1.25:5173`. Telefon va kompyuter bir Wi-Fi tarmog‘ida qolishi kerak. So‘ralganda saytga joylashuv ruxsatini bering.

IP manzil o‘zgarsa, setup buyrug‘ini yangi IP bilan qayta bajaring va HTTPS serverini qayta ishga tushiring. Ish tugagach, CA sertifikatini telefondan olib tashlash mumkin.

Lokal CA faqat o‘zingizning sinov qurilmangizda ishlatilsin. Publish qilingan saytda hosting bergan haqiqiy HTTPS sertifikatidan foydalaning.
