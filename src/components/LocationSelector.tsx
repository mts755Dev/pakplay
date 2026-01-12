import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getAllProvinces,
  getCitiesByProvince,
  getAreasByCity,
  getSubAreasByArea,
  type Province,
  type City,
  type Area,
  type SubArea,
} from "@/lib/locationHelpers";

interface LocationSelectorProps {
  onLocationChange: (location: {
    province?: string;
    city?: string;
    area?: string;
    subArea?: string;
  }) => void;
  initialProvince?: string;
  initialCity?: string;
  initialArea?: string;
  initialSubArea?: string;
  required?: boolean;
  showAllLevels?: boolean; // If false, only show province and city
}

export const LocationSelector = ({
  onLocationChange,
  initialProvince = "",
  initialCity = "",
  initialArea = "",
  initialSubArea = "",
  required = false,
  showAllLevels = true,
}: LocationSelectorProps) => {
  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedArea, setSelectedArea] = useState(initialArea);
  const [selectedSubArea, setSelectedSubArea] = useState(initialSubArea);

  const provinces = getAllProvinces() || [];
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [subAreas, setSubAreas] = useState<SubArea[]>([]);

  // Load cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      const provinceCities = getCitiesByProvince(selectedProvince);
      setCities(provinceCities);
    } else {
      setCities([]);
      setAreas([]);
      setSubAreas([]);
    }
  }, [selectedProvince]);

  // Load areas when city changes
  useEffect(() => {
    if (selectedCity) {
      const cityAreas = getAreasByCity(selectedCity);
      setAreas(cityAreas);
    } else {
      setAreas([]);
      setSubAreas([]);
    }
  }, [selectedCity]);

  // Load sub areas when area changes
  useEffect(() => {
    if (selectedArea && selectedCity) {
      const areaSubAreas = getSubAreasByArea(selectedArea, selectedCity);
      setSubAreas(areaSubAreas);
    } else {
      setSubAreas([]);
    }
  }, [selectedArea, selectedCity]);

  // Notify parent of location changes
  useEffect(() => {
    onLocationChange({
      province: selectedProvince || undefined,
      city: selectedCity || undefined,
      area: selectedArea || undefined,
      subArea: selectedSubArea || undefined,
    });
  }, [selectedProvince, selectedCity, selectedArea, selectedSubArea]);

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value || "");
    setSelectedCity("");
    setSelectedArea("");
    setSelectedSubArea("");
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value || "");
    setSelectedArea("");
    setSelectedSubArea("");
  };

  const handleAreaChange = (value: string) => {
    setSelectedArea(value || "");
    setSelectedSubArea("");
  };
  
  const handleSubAreaChange = (value: string) => {
    setSelectedSubArea(value || "");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Province Selector */}
      <div className="space-y-2">
        <Label htmlFor="province">
          Province {required && <span className="text-red-500">*</span>}
        </Label>
        <Select value={selectedProvince} onValueChange={handleProvinceChange}>
          <SelectTrigger id="province">
            <SelectValue placeholder="Select province" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-h-[300px]">
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Selector - shows when province is selected */}
      {selectedProvince && (
        <div className="space-y-2">
          <Label htmlFor="city">
            City {required && <span className="text-red-500">*</span>}
          </Label>
          <Select value={selectedCity} onValueChange={handleCityChange} disabled={cities.length === 0}>
            <SelectTrigger id="city">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-h-[300px]">
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Area Selector - shows when city is selected and showAllLevels is true */}
      {showAllLevels && selectedCity && areas.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="area">Area</Label>
          <Select value={selectedArea} onValueChange={handleAreaChange}>
            <SelectTrigger id="area">
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-h-[300px]">
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sub Area Selector - shows when area is selected */}
      {showAllLevels && selectedArea && subAreas.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="subArea">Sub Area</Label>
          <Select value={selectedSubArea} onValueChange={handleSubAreaChange}>
            <SelectTrigger id="subArea">
              <SelectValue placeholder="Select sub area" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-h-[300px]">
              {subAreas.map((subArea) => (
                <SelectItem key={subArea.id} value={subArea.id}>
                  {subArea.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

