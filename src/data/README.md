# Location Data System

This directory contains the hierarchical location data for Pakistan venues.

## File Structure

- `locations.json` - Main location data file with province → city → area → sub area hierarchy

## JSON Structure

```json
{
  "provinces": [
    {
      "id": "unique-province-id",
      "name": "Province Name",
      "cities": [
        {
          "id": "unique-city-id",
          "name": "City Name",
          "neighbourhoods": [
            {
              "id": "unique-area-id",
              "name": "Area Name",
              "subdivisions": [
                {
                  "id": "unique-sub-area-id",
                  "name": "Sub Area Name"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Usage

### 1. Using the LocationSelector Component

The easiest way to add location selection to your forms:

```tsx
import { LocationSelector } from "@/components/LocationSelector";

function MyForm() {
  const [location, setLocation] = useState({
    province: "",
    city: "",
    area: "",
    subArea: ""
  });

  return (
    <LocationSelector
      onLocationChange={setLocation}
      required={true}
      showAllLevels={true} // Set to false if you only need province & city
    />
  );
}
```

### 2. Using Helper Functions

Import and use the helper functions directly:

```tsx
import {
  getAllProvinces,
  getCitiesByProvince,
  getAreasByCity,
  formatFullLocation
} from "@/lib/locationHelpers";

// Get all provinces
const provinces = getAllProvinces();

// Get cities for a specific province
const cities = getCitiesByProvince("punjab");

// Get areas for a specific city
const areas = getAreasByCity("lahore");

// Format full location string
const fullAddress = formatFullLocation("punjab", "lahore", "dha-lahore", "dha-phase-1");
// Returns: "Phase 1, DHA, Lahore, Punjab"
```

## Integration Examples

### For Venue Filtering (Venues.tsx)

```tsx
import { LocationSelector } from "@/components/LocationSelector";

// Replace the simple city dropdown with:
<LocationSelector
  onLocationChange={(location) => {
    setSelectedProvince(location.province || "all");
    setSelectedCity(location.city || "all");
  }}
  showAllLevels={false} // Only show province and city for filtering
/>
```

### For Venue Creation (OwnerOnboarding.tsx)

```tsx
import { LocationSelector } from "@/components/LocationSelector";
import { formatFullLocation } from "@/lib/locationHelpers";

// In your form:
<LocationSelector
  onLocationChange={(location) => {
    setFormData({
      ...formData,
      province: location.province || "",
      city: location.city || "",
      area: location.area || "",
      subArea: location.subArea || "",
      // You can also generate a full address string:
      address: formatFullLocation(
        location.province,
        location.city,
        location.area,
        location.subArea
      )
    });
  }}
  required={true}
  showAllLevels={true}
/>
```

## Database Schema Update

You may want to update your venue schema to store location data:

```sql
ALTER TABLE venues
ADD COLUMN province TEXT,
ADD COLUMN area TEXT,
ADD COLUMN sub_area TEXT;

-- Or keep city as-is and store full location in address field
```

## Adding New Locations

To add new locations, simply edit `locations.json` following the structure above. The system will automatically pick up the changes.

## Helper Functions Available

- `getAllProvinces()` - Get all provinces
- `getCitiesByProvince(provinceId)` - Get cities in a province
- `getAllCities()` - Get flat list of all cities
- `getAreasByCity(cityId)` - Get areas in a city (formerly neighbourhoods)
- `getSubAreasByArea(areaId, cityId?)` - Get sub areas in an area (formerly subdivisions). Optionally accepts cityId to ensure correct subareas are returned when multiple cities have areas with the same name.
- `getProvinceByCity(cityId)` - Find which province a city belongs to
- `getCityById(cityId)` - Get city details by ID
- `searchCities(query)` - Search cities by name
- `formatFullLocation(provinceId, cityId, areaId, subAreaId)` - Format full address string

