import locationsData from '@/data/locations.json';

// Raw JSON structure interfaces
interface RawSubdivision {
  subdivision_name?: string;
}

interface RawNeighbourhood {
  neighbourhood_name: string;
  subdivisions?: (string | RawSubdivision)[];
}

interface RawCity {
  city_name: string;
  neighbourhoods?: RawNeighbourhood[];
}

interface RawProvince {
  province_name: string;
  cities: RawCity[];
}

interface RawLocationData {
  provinces: RawProvince[];
}

// Normalized interfaces for app use
export interface SubArea {
  id: string;
  name: string;
}

export interface Area {
  id: string;
  name: string;
  subdivisions: SubArea[];
}

export interface City {
  id: string;
  name: string;
  neighbourhoods: Area[];
}

export interface Province {
  id: string;
  name: string;
  cities: City[];
}

export interface LocationData {
  provinces: Province[];
}

// Helper to convert string to ID with fallback
const toId = (name: string, fallbackPrefix: string = 'item'): string => {
  if (!name || typeof name !== 'string') {
    return `${fallbackPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  const id = name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
  
  // If ID is empty after cleaning, generate a unique one
  if (!id || id.length === 0) {
    return `${fallbackPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return id;
};

// Normalize the raw data
const normalizeData = (): LocationData => {
  const rawData = locationsData as RawLocationData;
  
  return {
    provinces: rawData.provinces.map((rawProvince, pIdx) => {
      const provinceId = toId(rawProvince.province_name, `province-${pIdx}`);
      
      return {
        id: provinceId,
        name: rawProvince.province_name,
        cities: rawProvince.cities.map((rawCity, cIdx) => {
          const cityId = toId(rawCity.city_name, `${provinceId}-city-${cIdx}`);
          
          // Track used neighbourhood IDs to prevent duplicates
          const usedNeighIds = new Set<string>();
          
          return {
            id: cityId,
            name: rawCity.city_name,
            neighbourhoods: (rawCity.neighbourhoods || [])
              .filter(n => n.neighbourhood_name && n.neighbourhood_name.trim().length > 0)
              .map((rawNeigh, nIdx) => {
                let neighId = toId(rawNeigh.neighbourhood_name, `${cityId}-neigh-${nIdx}`);
                
                // If duplicate, append index
                if (usedNeighIds.has(neighId)) {
                  neighId = `${neighId}-${nIdx}`;
                }
                usedNeighIds.add(neighId);
                
                // Track used subdivision IDs
                const usedSubIds = new Set<string>();
                
                return {
                  id: neighId,
                  name: rawNeigh.neighbourhood_name,
                  subdivisions: (rawNeigh.subdivisions || [])
                    .map((rawSub, sIdx) => {
                      const subName = typeof rawSub === 'string' ? rawSub : (rawSub.subdivision_name || '');
                      return { subName, sIdx };
                    })
                    .filter(({ subName }) => subName && subName.trim().length > 0)
                    .map(({ subName, sIdx }) => {
                      let subId = toId(subName, `${neighId}-sub-${sIdx}`);
                      
                      // If duplicate, append index
                      if (usedSubIds.has(subId)) {
                        subId = `${subId}-${sIdx}`;
                      }
                      usedSubIds.add(subId);
                      
                      return {
                        id: subId,
                        name: subName
                      };
                    })
                };
              })
          };
        })
      };
    })
  };
};

// Cache normalized data
let normalizedData: LocationData | null = null;

const getNormalizedData = (): LocationData => {
  if (!normalizedData) {
    normalizedData = normalizeData();
  }
  return normalizedData;
};

// Get all provinces
export const getAllProvinces = (): Province[] => {
  return getNormalizedData().provinces;
};

// Get cities by province ID
export const getCitiesByProvince = (provinceId: string): City[] => {
  const province = getNormalizedData().provinces.find(p => p.id === provinceId);
  return province?.cities || [];
};

// Get all cities (flat list)
export const getAllCities = (): City[] => {
  return getNormalizedData().provinces.flatMap(p => p.cities);
};

// Get areas by city ID (formerly neighbourhoods)
export const getAreasByCity = (cityId: string): Area[] => {
  const allCities = getAllCities();
  const city = allCities.find(c => c.id === cityId);
  return city?.neighbourhoods || [];
};

// Legacy alias for backwards compatibility
export const getNeighbourhoodsByCity = getAreasByCity;

// Get sub areas by area ID (formerly subdivisions by neighbourhood)
// Optionally accepts cityId to ensure we get subareas from the correct city
export const getSubAreasByArea = (areaId: string, cityId?: string): SubArea[] => {
  // If cityId is provided, search only within that city first
  if (cityId) {
    const city = getCityById(cityId);
    if (city) {
      const area = city.neighbourhoods.find(n => n.id === areaId);
      if (area) {
        return area.subdivisions || [];
      }
    }
  }
  
  // Fallback: search all cities (for backwards compatibility)
  const allCities = getAllCities();
  for (const city of allCities) {
    const area = city.neighbourhoods.find(n => n.id === areaId);
    if (area) {
      return area.subdivisions || [];
    }
  }
  return [];
};

// Legacy alias for backwards compatibility
export const getSubdivisionsByNeighbourhood = getSubAreasByArea;

// Get province by city ID
export const getProvinceByCity = (cityId: string): Province | null => {
  for (const province of getNormalizedData().provinces) {
    if (province.cities.some(c => c.id === cityId)) {
      return province;
    }
  }
  return null;
};

// Get city by ID
export const getCityById = (cityId: string): City | null => {
  const allCities = getAllCities();
  return allCities.find(c => c.id === cityId) || null;
};

// Search cities by name
export const searchCities = (query: string): City[] => {
  const allCities = getAllCities();
  return allCities.filter(city => 
    city.name.toLowerCase().includes(query.toLowerCase())
  );
};

// Format full address string
export const formatFullLocation = (
  provinceId?: string,
  cityId?: string,
  areaId?: string,
  subAreaId?: string
): string => {
  const parts: string[] = [];
  
  if (subAreaId && areaId && cityId) {
    const areas = getAreasByCity(cityId);
    const area = areas.find(n => n.id === areaId);
    const subArea = area?.subdivisions.find(s => s.id === subAreaId);
    if (subArea) parts.push(subArea.name);
  }
  
  if (areaId && cityId) {
    const areas = getAreasByCity(cityId);
    const area = areas.find(n => n.id === areaId);
    if (area) parts.push(area.name);
  }
  
  if (cityId) {
    const city = getCityById(cityId);
    if (city) parts.push(city.name);
  }
  
  if (provinceId) {
    const province = getAllProvinces().find(p => p.id === provinceId);
    if (province) parts.push(province.name);
  }
  
  return parts.join(', ');
};

