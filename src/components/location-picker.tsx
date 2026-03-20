"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Country, City } from "country-state-city";
import { Input } from "@/components/ui/input";

interface LocationPickerProps {
  country: string;
  city: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
}

const allCountries = Country.getAllCountries().map((c) => ({
  name: c.name,
  code: c.isoCode,
  flag: c.flag,
}));

export function LocationPicker({
  country,
  city,
  onCountryChange,
  onCityChange,
}: LocationPickerProps) {
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showCountryList, setShowCountryList] = useState(false);
  const [showCityList, setShowCityList] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  // Find selected country code
  const selectedCountry = useMemo(
    () => allCountries.find((c) => c.name === country),
    [country]
  );

  // Get cities for selected country
  const cities = useMemo(() => {
    if (!selectedCountry) return [];
    return City.getCitiesOfCountry(selectedCountry.code)?.map((c) => c.name) ?? [];
  }, [selectedCountry]);

  // Filter countries by search
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return allCountries;
    const q = countrySearch.toLowerCase();
    return allCountries.filter((c) => c.name.toLowerCase().includes(q));
  }, [countrySearch]);

  // Filter cities by search
  const filteredCities = useMemo(() => {
    if (!citySearch) return cities;
    const q = citySearch.toLowerCase();
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, citySearch]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryList(false);
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCityList(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectCountry(c: (typeof allCountries)[number]) {
    onCountryChange(c.name);
    setCountrySearch("");
    setShowCountryList(false);
    // Reset city when country changes
    if (country !== c.name) {
      onCityChange("");
      setCitySearch("");
    }
  }

  function selectCity(name: string) {
    onCityChange(name);
    setCitySearch("");
    setShowCityList(false);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Country picker */}
      <div className="space-y-2" ref={countryRef}>
        <label className="text-sm font-medium">País</label>
        <div className="relative">
          <Input
            placeholder="Buscar país..."
            value={showCountryList ? countrySearch : country ? `${selectedCountry?.flag ?? ""} ${country}` : ""}
            onChange={(e) => {
              setCountrySearch(e.target.value);
              if (!showCountryList) setShowCountryList(true);
            }}
            onFocus={() => {
              setShowCountryList(true);
              setCountrySearch("");
            }}
            required
            autoComplete="off"
          />
          {showCountryList && (
            <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-background shadow-lg">
              {filteredCountries.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  Sin resultados
                </li>
              ) : (
                filteredCountries.slice(0, 50).map((c) => (
                  <li
                    key={c.code}
                    className={`cursor-pointer px-3 py-2 text-sm hover:bg-accent ${
                      country === c.name ? "bg-accent font-medium" : ""
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectCountry(c);
                    }}
                  >
                    {c.flag} {c.name}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      {/* City picker */}
      <div className="space-y-2" ref={cityRef}>
        <label className="text-sm font-medium">Ciudad</label>
        <div className="relative">
          <Input
            placeholder={selectedCountry ? "Buscar ciudad..." : "Elige país primero"}
            value={showCityList ? citySearch : city}
            onChange={(e) => {
              setCitySearch(e.target.value);
              if (!showCityList) setShowCityList(true);
            }}
            onFocus={() => {
              if (selectedCountry) {
                setShowCityList(true);
                setCitySearch("");
              }
            }}
            disabled={!selectedCountry}
            required
            autoComplete="off"
          />
          {showCityList && cities.length > 0 && (
            <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-background shadow-lg">
              {filteredCities.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  Sin resultados
                </li>
              ) : (
                filteredCities.slice(0, 50).map((name) => (
                  <li
                    key={name}
                    className={`cursor-pointer px-3 py-2 text-sm hover:bg-accent ${
                      city === name ? "bg-accent font-medium" : ""
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectCity(name);
                    }}
                  >
                    {name}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
