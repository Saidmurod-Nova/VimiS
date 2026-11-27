import { requireSupabase } from "@/lib/supabase";

async function authenticatedClient() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) throw new Error("Kuryerlik rejimi uchun hisobga kiring.");
  return client;
}

function formatTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString("uz-UZ");
}

function mapDelivery(record) {
  if (!record?.id || !record?.order_id || !record?.status) {
    throw new Error("Bazadan buyurtma ma’lumotlari noto‘g‘ri shaklda keldi.");
  }
  return {
    isDemo: false,
    id: record.id,
    orderId: record.order_id,
    orderNumber: record.order_number || record.order_id,
    store: record.store || "",
    storeAddress: record.store_address || "",
    storeLatitude: record.store_latitude,
    storeLongitude: record.store_longitude,
    storeCity: record.store_city || "",
    storeDistrict: record.store_district || "",
    storeRegion: record.store_region || "",
    storeCountry: record.store_country || "",
    destination: record.destination || "",
    destinationLatitude: record.destination_latitude,
    destinationLongitude: record.destination_longitude,
    customer: record.customer_name || "Xaridor",
    phone: record.customer_phone || "",
    products: (record.products || []).map((product) =>
      `${product.name || "Mahsulot"} · ${product.quantity} dona`
    ),
    instructions: record.notes || "",
    fee: record.delivery_fee == null ? null : Number(record.delivery_fee),
    distance: null,
    eta: null,
    status: record.status === "delivered" ? "completed" : record.status,
    createdAt: formatTimestamp(record.created_at) || "",
    acceptedAt: formatTimestamp(record.accepted_at),
    pickedUpAt: formatTimestamp(record.picked_up_at),
    onTheWayAt: formatTimestamp(record.on_the_way_at),
    completedAt: formatTimestamp(record.delivered_at),
    cancelledAt: formatTimestamp(record.cancelled_at),
  };
}

async function callCourierRpc(name, args) {
  const client = await authenticatedClient();
  const { data, error } = args === undefined
    ? await client.rpc(name)
    : await client.rpc(name, args);
  if (error) {
    console.error(`Kuryerlik amali bajarilmadi (${name}).`, error);
    if (error.code === "PGRST202") {
      throw new Error(
        "Kuryerlik bazasi Supabase’da tayyor emas: 202611030001_courier_mode.sql va 202611160001_courier_identity_seller_lookup.sql migratsiyalarini qo‘llang, so‘ng PostgREST schema keshini yangilang."
      );
    }
    throw new Error(error.message || "Kuryerlik amali bajarilmadi.");
  }
  return data;
}

export async function getCourierState() {
  const [data, identity] = await Promise.all([
    callCourierRpc("vimi_courier_get_state"),
    callCourierRpc("vimi_courier_get_identity"),
  ]);
  if (!data || typeof data !== "object") {
    throw new Error("Kuryer ma’lumotlari bazadan olinmadi.");
  }
  return {
    authorizationStatus: data.status || "not_requested",
    courierCode: identity?.courier_code || null,
    isOnline: Boolean(data.is_available),
    availableDeliveries: (data.available_deliveries || []).map(mapDelivery),
    activeDeliveries: (data.active_deliveries || []).map(mapDelivery),
    completedDeliveries: (data.completed_deliveries || []).map(mapDelivery),
  };
}

export async function requestCourierAccess() {
  const data = await callCourierRpc("vimi_courier_request_access");
  if (!data?.ok) throw new Error("Kuryerlik ruxsati so‘rovi saqlanmadi.");
  return data.status;
}

export async function setCourierAvailability(isAvailable) {
  const data = await callCourierRpc("vimi_courier_set_availability", {
    p_is_available: Boolean(isAvailable),
  });
  if (!data?.ok) throw new Error("Kuryerlik holati saqlanmadi.");
}

export async function acceptCourierDelivery(deliveryId) {
  if (!deliveryId) throw new Error("Buyurtma identifikatori topilmadi.");
  return mapDelivery(await callCourierRpc("vimi_courier_accept_delivery", {
    p_delivery_id: deliveryId,
  }));
}

export async function updateCourierDelivery(deliveryId, status) {
  if (!deliveryId || !status) throw new Error("Buyurtma va yangi holat majburiy.");
  return mapDelivery(await callCourierRpc("vimi_courier_update_delivery", {
    p_delivery_id: deliveryId,
    p_new_status: status,
  }));
}
