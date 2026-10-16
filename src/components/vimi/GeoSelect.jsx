import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function GeoSelect({ onChange }) {
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [country, setCountry] = useState(null);
  const [region, setRegion] = useState(null);
  const [city, setCity] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: list, error } = await supabase
          .from("geo_areas")
          .select("*")
          .eq("type", "country");
        if (error) throw error;
        setCountries(list || []);
        if (list && list[0]) {
          const c = list[0];
          setCountry(c.id);
          const { data: rs, error: regionsError } = await supabase
            .from("geo_areas")
            .select("*")
            .eq("parent_id", c.id);
          if (regionsError) throw regionsError;
          setRegions(rs || []);
          emit(c.id, null, null, [c], []);
        }
      } catch {}
    })();
  }, []);

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
    const { data: rs, error } = await supabase
      .from("geo_areas")
      .select("*")
      .eq("parent_id", v);
    if (error) throw error;
    setRegions(rs || []);
    emit(v, null, null, countries, rs || []);
  };
  const onRegion = async (v) => {
    setRegion(v); setCity(null);
    const { data: cis, error } = await supabase
      .from("geo_areas")
      .select("*")
      .eq("parent_id", v);
    if (error) throw error;
    setCities(cis || []);
    emit(country, v, null, countries, regions, cis || []);
  };
  const onCity = (v) => { setCity(v); emit(country, region, v); };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Davlat</Label>
        <Select value={country} onValueChange={onCountry}>
          <SelectTrigger className="h-12 rounded-xl border-transparent bg-secondary/70"><SelectValue placeholder="Davlatni tanlang" /></SelectTrigger>
          <SelectContent>{countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Viloyat / Shahar</Label>
        <Select value={region} disabled={!country} onValueChange={onRegion}>
          <SelectTrigger className="h-12 rounded-xl border-transparent bg-secondary/70"><SelectValue placeholder="Viloyatni tanlang" /></SelectTrigger>
          <SelectContent>{regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Shahar / Tuman</Label>
        <Select value={city} disabled={!region} onValueChange={onCity}>
          <SelectTrigger className="h-12 rounded-xl border-transparent bg-secondary/70"><SelectValue placeholder="Shaharni tanlang" /></SelectTrigger>
          <SelectContent>{cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}