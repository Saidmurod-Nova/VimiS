import React, { useEffect, useId, useState } from "react";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode, requireSupabase } from "@/lib/supabase";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function GeoSelect({ onChange, initialLocation }) {
  const id = useId();
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [country, setCountry] = useState(null);
  const [region, setRegion] = useState(null);
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadAreas = async (filters) => {
    if (isSupabaseMode) {
      let query = requireSupabase().from("geo_areas").select("*");
      for (const [field, value] of Object.entries(filters)) query = query.eq(field, value);
      const { data, error: loadError } = await query;
      if (loadError) throw loadError;
      return data || [];
    }
    return base44.entities.GeoArea.filter(filters, "name", 100);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const list = await loadAreas({ type: "country" });
        if (!active) return;
        setCountries(list || []);
        if (list && list[0]) {
          const countryName = initialLocation?.country?.trim().toLocaleLowerCase();
          const c = list.find((item) => item.name.trim().toLocaleLowerCase() === countryName) || list[0];
          setCountry(c.id);
          const rs = await loadAreas({ parent_id: c.id });
          if (!active) return;
          setRegions(rs || []);
          const regionName = initialLocation?.region?.trim().toLocaleLowerCase();
          const selectedRegion = rs?.find((item) => item.name.trim().toLocaleLowerCase() === regionName);
          setRegion(selectedRegion?.id || null);
          if (selectedRegion) {
            const cis = await loadAreas({ parent_id: selectedRegion.id });
            if (!active) return;
            setCities(cis || []);
            const cityName = initialLocation?.city?.trim().toLocaleLowerCase();
            const selectedCity = cis?.find((item) => item.name.trim().toLocaleLowerCase() === cityName);
            setCity(selectedCity?.id || null);
          } else {
            setCities([]);
            setCity(null);
          }
        }
      } catch (loadError) {
        console.error("Hududlarni yuklab bo‘lmadi.", loadError);
        if (active) setError(loadError?.message || "Hududlarni yuklab bo‘lmadi.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [reloadKey, initialLocation?.country, initialLocation?.region, initialLocation?.city]);

  const emit = (cId, rId, ciId, cos = countries, rs = regions, cis = cities) => {
    const co = cos.find((x) => x.id === cId);
    const ro = rs.find((x) => x.id === rId);
    const ci = cis.find((x) => x.id === ciId);
    onChange && onChange({
      geo_area_id: ci?.id || ro?.id || co?.id || null,
      country: co?.name || "",
      region: ro?.name || "",
      city: ci?.name || "",
      district: ci?.type === "district" ? ci.name : ""
    });
  };

  const onCountry = async (v) => {
    setCountry(v); setRegion(null); setCity(null); setCities([]);
    setError("");
    try {
      const rs = await loadAreas({ parent_id: v });
      setRegions(rs || []);
      emit(v, null, null, countries, rs || []);
    } catch (loadError) {
      console.error("Viloyatlarni yuklab bo‘lmadi.", loadError);
      setError(loadError?.message || "Viloyatlarni yuklab bo‘lmadi.");
    }
  };
  const onRegion = async (v) => {
    setRegion(v); setCity(null);
    setError("");
    try {
      const cis = await loadAreas({ parent_id: v });
      setCities(cis || []);
      emit(country, v, null, countries, regions, cis || []);
    } catch (loadError) {
      console.error("Shahar va tumanlarni yuklab bo‘lmadi.", loadError);
      setError(loadError?.message || "Shahar va tumanlarni yuklab bo‘lmadi.");
    }
  };
  const onCity = (v) => { setCity(v); emit(country, region, v); };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          <p role="alert">{error}</p>
          <button type="button" className="mt-2 font-medium underline" onClick={() => setReloadKey((key) => key + 1)}>
            Hududlarni qayta yuklash
          </button>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={`${id}-country`}>Davlat</Label>
        <Select value={country} disabled={loading || !!error} onValueChange={onCountry}>
          <SelectTrigger id={`${id}-country`} className="h-12 rounded-xl border-transparent bg-secondary/70"><SelectValue placeholder={loading ? "Yuklanmoqda..." : "Davlatni tanlang"} /></SelectTrigger>
          <SelectContent>{countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-region`}>Viloyat / hudud <span aria-hidden="true">*</span></Label>
        <Select value={region} disabled={!country || !!error} onValueChange={onRegion}>
          <SelectTrigger id={`${id}-region`} aria-required="true" className="h-12 rounded-xl border-transparent bg-secondary/70"><SelectValue placeholder="Viloyatni tanlang" /></SelectTrigger>
          <SelectContent>{regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-city`}>Shahar / tuman <span aria-hidden="true">*</span></Label>
        <Select value={city} disabled={!region || !!error} onValueChange={onCity}>
          <SelectTrigger id={`${id}-city`} aria-required="true" className="h-12 rounded-xl border-transparent bg-secondary/70"><SelectValue placeholder="Shahar yoki tumanni tanlang" /></SelectTrigger>
          <SelectContent>{cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}