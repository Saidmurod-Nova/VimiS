import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const tabs = [
  { id: "catalog", label: "Katalog" },
  { id: "cart", label: "Savat" },
  { id: "orders", label: "Buyurtmalar" },
];

const statusLabels = {
  pending: "Kutilmoqda",
  accepted: "Qabul qilindi",
  preparing: "Tayyorlanmoqda",
  completed: "Yakunlandi",
  cancelled: "Bekor qilindi",
};

/**
 * @typedef {object} TelegramMiniAppBridge
 * @property {string} initData
 * @property {() => void} [ready]
 * @property {() => void} [expand]
 * @property {() => void} [close]
 */

function getTelegramWebApp() {
  return /** @type {Window & { Telegram?: { WebApp?: TelegramMiniAppBridge } }} */ (window).Telegram?.WebApp;
}

function money(value) {
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value) || 0)} so'm`;
}

function availableActions(status) {
  if (status === "pending") {
    return [
      { status: "accepted", label: "Qabul qilish" },
      { status: "cancelled", label: "Rad etish" },
    ];
  }
  if (status === "accepted") {
    return [
      { status: "preparing", label: "Tayyorlash" },
      { status: "cancelled", label: "Bekor qilish" },
    ];
  }
  if (status === "preparing") return [{ status: "completed", label: "Yakunlash" }];
  return [];
}

export default function TelegramMiniApp() {
  const botType = new URLSearchParams(window.location.search).get("bot") === "seller"
    ? "seller"
    : "buyer";
  const telegramApp = getTelegramWebApp();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState(botType === "seller" ? "orders" : "catalog");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedBranches, setSelectedBranches] = useState({});
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressTitle, setAddressTitle] = useState("Uy");
  const [addressText, setAddressText] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectedAddressIdRef = useRef("");

  useEffect(() => {
    selectedAddressIdRef.current = selectedAddressId;
  }, [selectedAddressId]);

  const invoke = useCallback(async (action, payload = {}) => {
    const initData = getTelegramWebApp()?.initData;
    if (!initData) throw new Error("Ilovani Telegram botidan oching. Telegram tasdiqlash ma'lumoti topilmadi.");
    if (!isSupabaseConfigured || !supabase) throw new Error("VimiS serveri sozlanmagan.");
    const { data: result, error: invokeError } = await supabase.functions.invoke("telegram-miniapp", {
      body: { bot_type: botType, action, init_data: initData, ...payload },
    });
    if (invokeError) {
      let message = invokeError.message || "So'rov bajarilmadi.";
      if (invokeError.context instanceof Response) {
        try {
          const responseBody = await invokeError.context.clone().json();
          if (typeof responseBody?.error === "string") message = responseBody.error;
        } catch {
          message = invokeError.message || "So'rov bajarilmadi.";
        }
      }
      throw new Error(message);
    }
    if (result?.error) throw new Error(result.error);
    if (!result || !("data" in result)) throw new Error("Server javobi noto'g'ri.");
    return result.data;
  }, [botType]);

  const reload = useCallback(async () => {
    const result = await invoke("bootstrap");
    setData(result);
    setPhone((current) => current || result.profile?.phone || "");
    if (
      !selectedAddressIdRef.current ||
      !(result.addresses || []).some((address) => address.id === selectedAddressIdRef.current)
    ) {
      setSelectedAddressId(
        result.addresses?.find((address) => address.is_default)?.id ||
        result.addresses?.[0]?.id ||
        "",
      );
    }
    return result;
  }, [invoke]);

  useEffect(() => {
    telegramApp?.ready?.();
    telegramApp?.expand?.();
    let active = true;
    reload()
      .catch((loadError) => {
        if (active) setError(loadError.message || "Ilovani yuklab bo'lmadi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [reload, telegramApp]);

  const products = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return (data?.catalog?.products || []).filter((product) => {
      const matchesCategory = !categoryId || product.category_id === categoryId ||
        product.business?.category_id === categoryId;
      const haystack = `${product.name} ${product.business?.name || ""} ${product.category_name || ""}`.toLocaleLowerCase();
      return matchesCategory && (!term || haystack.includes(term));
    });
  }, [categoryId, data?.catalog?.products, search]);

  const runAction = async (key, action, payload, successMessage) => {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      const result = await invoke(action, payload);
      if (result?.conflict && action === "add_to_cart") {
        const replaceCart = window.confirm("Savat boshqa do'konga tegishli. Uni yangi do'kon mahsulotlari bilan almashtiraymi?");
        if (!replaceCart) return;
        await invoke(action, { ...payload, force_new: true });
      }
      if (successMessage) setNotice(successMessage);
      await reload();
    } catch (actionError) {
      setError(actionError.message || "Amal bajarilmadi. Qayta urinib ko'ring.");
    } finally {
      setBusy("");
    }
  };

  const addAddress = async () => {
    if (!addressText.trim()) {
      setError("Yetkazib berish manzilini kiriting.");
      return;
    }
    setBusy("address");
    setError("");
    try {
      const address = await invoke("create_address", {
        title: addressTitle,
        address: addressText.trim(),
      });
      setSelectedAddressId(address.id);
      setAddressText("");
      setNotice("Manzil saqlandi.");
      await reload();
      setSelectedAddressId(address.id);
    } catch (addressError) {
      setError(addressError.message || "Manzil saqlanmadi.");
    } finally {
      setBusy("");
    }
  };

  const placeOrder = async () => {
    const cart = data?.cart;
    if (!cart?.cart || cart.items.length === 0) {
      setError("Savat bo'sh.");
      return;
    }
    if (cart.items.some((item) => !item.available || item.quantity > item.stock)) {
      setError("Savatdagi ayrim mahsulotlar mavjud emas yoki qoldig'i yetarli emas.");
      return;
    }
    if (!phone.trim()) {
      setError("Buyurtma uchun telefon raqamingizni kiriting.");
      return;
    }
    if (!selectedAddressId) {
      setError("Avval yetkazib berish manzilini qo'shing va tanlang.");
      return;
    }
    setBusy("checkout");
    setError("");
    setNotice("");
    try {
      await invoke("update_phone", { phone });
      const order = await invoke("checkout", {
        cart_id: cart.cart.id,
        address_id: selectedAddressId,
        notes,
      });
      setNotice(`Buyurtma #${order.order_number} qabul qilindi.`);
      setTab("orders");
      await reload();
    } catch (checkoutError) {
      setError(checkoutError.message || "Buyurtma yaratilmadi.");
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return <main className="mx-auto min-h-screen max-w-xl space-y-4 bg-background px-4 py-6 text-foreground">
      <div className="h-7 w-40 animate-pulse rounded bg-secondary" />
      <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
    </main>;
  }

  if (!data) {
    return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 bg-background px-5 text-foreground">
      <h1 className="text-2xl font-bold">VimiS Telegram</h1>
      <p role="alert" className="rounded-2xl border border-destructive/30 bg-card p-4 text-sm">
        {error || "Telegram orqali kirish amalga oshmadi."}
      </p>
      <button type="button" onClick={() => telegramApp?.close?.()} className="h-12 rounded-xl bg-primary px-4 font-semibold text-primary-foreground">
        Telegramga qaytish
      </button>
    </main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-background px-4 pb-[max(env(safe-area-inset-bottom),20px)] pt-[max(env(safe-area-inset-top),16px)] text-foreground">
      <header className="flex items-center gap-3 py-3">
        {data.profile?.avatar ? (
          <img src={data.profile.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            {(data.profile?.full_name || "V")[0]}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">VimiS · {botType === "buyer" ? "Xaridor" : "Sotuvchi"}</p>
          <h1 className="truncate text-lg font-bold">{data.profile?.full_name || "Telegram foydalanuvchisi"}</h1>
        </div>
        {telegramApp?.close && (
          <button type="button" onClick={() => telegramApp.close()} className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold">
            Yopish
          </button>
        )}
      </header>

      {error && <p role="alert" className="my-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="my-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">{notice}</p>}

      {botType === "buyer" ? (
        <>
          <nav aria-label="Bo'limlar" className="sticky top-0 z-10 -mx-4 flex gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
            {tabs.map((item) => (
              <button key={item.id} type="button" onClick={() => setTab(item.id)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold ${tab === item.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {item.label}{item.id === "cart" && data.cart?.total_items ? ` (${data.cart.total_items})` : ""}
              </button>
            ))}
          </nav>

          {tab === "catalog" && (
            <section className="space-y-4 py-4">
              <label className="block">
                <span className="sr-only">Mahsulot qidirish</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)}
                  placeholder="Mahsulot qidirish"
                  className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </label>
              {!!data.catalog?.categories?.length && (
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                  <button type="button" onClick={() => setCategoryId("")}
                    className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${!categoryId ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    Barchasi
                  </button>
                  {data.catalog.categories.map((category) => (
                    <button key={category.id} type="button" onClick={() => setCategoryId(category.id)}
                      className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${categoryId === category.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      {category.icon ? `${category.icon} ` : ""}{category.name}
                    </button>
                  ))}
                </div>
              )}
              {!products.length ? (
                <p className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">Mahsulot topilmadi.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product) => {
                    const branches = product.branches || [];
                    const branchId = selectedBranches[product.id] || branches[0]?.branch_id || "";
                    const branch = branches.find((item) => item.branch_id === branchId) || branches[0];
                    const price = branch?.price ?? product.price;
                    return (
                      <article key={product.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                        {product.image_url
                          ? <img src={product.image_url} alt={product.name} loading="lazy" className="aspect-square w-full object-cover" />
                          : <div className="flex aspect-square items-center justify-center bg-secondary text-4xl" aria-hidden="true">🛍️</div>}
                        <div className="space-y-2 p-3">
                          <h2 className="line-clamp-2 min-h-10 text-sm font-semibold">{product.name}</h2>
                          <p className="truncate text-xs text-muted-foreground">{product.business?.name}</p>
                          <p className="font-bold text-primary">{money(price)}</p>
                          {branches.length > 1 && (
                            <select aria-label={`${product.name}: filial`} value={branchId}
                              onChange={(event) => setSelectedBranches((current) => ({ ...current, [product.id]: event.target.value }))}
                              className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs">
                              {branches.map((item) => (
                                <option key={item.branch_id} value={item.branch_id}>{item.branch_name}{item.city ? ` · ${item.city}` : ""}</option>
                              ))}
                            </select>
                          )}
                          <button type="button" disabled={busy === `add-${product.id}`}
                            onClick={() => runAction(`add-${product.id}`, "add_to_cart", {
                              product_id: product.id,
                              branch_id: branch?.branch_id,
                              quantity: 1,
                            }, "Mahsulot savatga qo'shildi.")}
                            className="h-10 w-full rounded-xl bg-primary px-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                            {busy === `add-${product.id}` ? "Qo'shilmoqda..." : "Savatga qo'shish"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {tab === "cart" && (
            <section className="space-y-4 py-4">
              {!data.cart?.items?.length ? (
                <p className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">Savat hozircha bo'sh.</p>
              ) : (
                <>
                  <div className="rounded-xl border border-border bg-card p-3 text-sm">
                    <p className="font-semibold">{data.cart.cart.business?.name}</p>
                    <p className="text-xs text-muted-foreground">{data.cart.cart.branch?.name}{data.cart.cart.branch?.city ? ` · ${data.cart.cart.branch.city}` : ""}</p>
                  </div>
                  {data.cart.items.map((item) => (
                    <article key={item.cart_item_id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                      {item.image_url
                        ? <img src={item.image_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                        : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary">🛍️</div>}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{money(item.unit_price)} · Qoldiq: {item.stock}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" aria-label="Miqdorni kamaytirish" disabled={busy === item.cart_item_id || item.quantity <= 1}
                            onClick={() => runAction(item.cart_item_id, "update_cart", {
                              cart_action: "update", cart_item_id: item.cart_item_id, quantity: item.quantity - 1,
                            })} className="h-8 w-8 rounded-lg bg-secondary font-bold disabled:opacity-40">−</button>
                          <span className="min-w-5 text-center text-sm">{item.quantity}</span>
                          <button type="button" aria-label="Miqdorni oshirish" disabled={busy === item.cart_item_id || item.quantity >= item.stock}
                            onClick={() => runAction(item.cart_item_id, "update_cart", {
                              cart_action: "update", cart_item_id: item.cart_item_id, quantity: item.quantity + 1,
                            })} className="h-8 w-8 rounded-lg bg-secondary font-bold disabled:opacity-40">+</button>
                          <button type="button" disabled={busy === item.cart_item_id}
                            onClick={() => runAction(item.cart_item_id, "update_cart", {
                              cart_action: "remove", cart_item_id: item.cart_item_id,
                            })} className="ml-auto px-2 text-xs font-semibold text-destructive">O'chirish</button>
                        </div>
                      </div>
                      <p className="shrink-0 text-right text-xs font-bold">{money(item.subtotal)}</p>
                    </article>
                  ))}

                  <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between font-bold"><span>Jami</span><span>{money(data.cart.subtotal)}</span></div>
                    <label className="block space-y-1 text-sm font-medium">
                      <span>Telefon raqami</span>
                      <input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)}
                        placeholder="+998 90 123 45 67" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                    </label>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Yetkazib berish manzili</p>
                      {data.addresses.map((address) => (
                        <button key={address.id} type="button" onClick={() => setSelectedAddressId(address.id)}
                          className={`w-full rounded-xl border p-3 text-left text-sm ${selectedAddressId === address.id ? "border-primary bg-primary/5" : "border-border"}`}>
                          <span className="block font-semibold">{address.title || "Manzil"}</span>
                          <span className="text-xs text-muted-foreground">{address.address}</span>
                        </button>
                      ))}
                      <div className="grid grid-cols-[1fr_2fr] gap-2">
                        <input value={addressTitle} onChange={(event) => setAddressTitle(event.target.value)} aria-label="Manzil nomi"
                          placeholder="Uy" className="h-10 min-w-0 rounded-xl border border-border bg-background px-3 text-sm" />
                        <input value={addressText} onChange={(event) => setAddressText(event.target.value)} aria-label="Yetkazib berish manzili"
                          placeholder="Ko'cha, uy, mo'ljal" className="h-10 min-w-0 rounded-xl border border-border bg-background px-3 text-sm" />
                      </div>
                      <button type="button" disabled={busy === "address"} onClick={addAddress}
                        className="h-10 w-full rounded-xl border border-border text-sm font-semibold disabled:opacity-50">
                        {busy === "address" ? "Saqlanmoqda..." : "Manzilni saqlash"}
                      </button>
                    </div>
                    <label className="block space-y-1 text-sm font-medium">
                      <span>Izoh (ixtiyoriy)</span>
                      <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} rows={2}
                        className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
                    </label>
                    <button type="button" disabled={busy === "checkout"} onClick={placeOrder}
                      className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-50">
                      {busy === "checkout" ? "Buyurtma yuborilmoqda..." : "Buyurtmani tasdiqlash"}
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {tab === "orders" && (
            <section className="space-y-3 py-4">
              {!data.orders?.length ? (
                <p className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">Buyurtmalar hali yo'q.</p>
              ) : data.orders.map((order) => (
                <article key={order.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold">#{order.order_number}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">{order.business_name || "Do'kon"} · {order.branch_name || "Filial"}</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">{statusLabels[order.status] || order.status}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{order.item_count} ta mahsulot</span>
                    <span className="font-bold">{money(order.total)}</span>
                  </div>
                  {order.status === "pending" && (
                    <button type="button" disabled={busy === order.id}
                      onClick={() => runAction(order.id, "buyer_cancel_order", { order_id: order.id }, "Buyurtma bekor qilindi.")}
                      className="mt-3 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive disabled:opacity-50">
                      Buyurtmani bekor qilish
                    </button>
                  )}
                </article>
              ))}
            </section>
          )}
        </>
      ) : (
        <section className="space-y-4 py-4">
          <h2 className="text-xl font-bold">Biznes buyurtmalari</h2>
          {!data.businesses?.length ? (
            <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              Telegram hisobida boshqariladigan biznes topilmadi. Biznes egasi sifatida VimiS akkauntingizni Telegram botiga ulang.
            </p>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button type="button" onClick={() => setCategoryId("")}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${!categoryId ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  Barcha bizneslar
                </button>
                {data.businesses.map((business) => (
                  <button key={business.id} type="button" onClick={() => setCategoryId(business.id)}
                    className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${categoryId === business.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    {business.name}
                  </button>
                ))}
              </div>
              {!data.orders?.length ? (
                <p className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">Buyurtmalar hali yo'q.</p>
              ) : data.orders.filter((order) => !categoryId || order.business_id === categoryId).map((order) => (
                <article key={order.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">#{order.order_number}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{order.business_name} · {order.branch_name}</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">{statusLabels[order.status] || order.status}</span>
                  </div>
                  <p className="text-sm">{order.buyer_name_snapshot || "Xaridor"} · {order.item_count} ta mahsulot</p>
                  <p className="text-sm font-bold">{money(order.total)}</p>
                  {availableActions(order.status).length > 0 && (
                    <div className="flex gap-2">
                      {availableActions(order.status).map((action) => (
                        <button key={action.status} type="button" disabled={busy === order.id}
                          onClick={() => runAction(order.id, "seller_order_status", {
                            order_id: order.id, status: action.status,
                          }, `Buyurtma holati: ${statusLabels[action.status]}.`)}
                          className={`min-h-10 flex-1 rounded-xl px-2 text-xs font-semibold disabled:opacity-50 ${action.status === "cancelled" ? "border border-destructive/30 text-destructive" : "bg-primary text-primary-foreground"}`}>
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </>
          )}
        </section>
      )}
    </main>
  );
}
