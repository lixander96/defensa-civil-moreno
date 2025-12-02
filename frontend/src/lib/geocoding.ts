export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const query = address.trim();
  if (!query) {
    return null;
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', `${query}, Moreno, Buenos Aires, Argentina`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept-Language': 'es',
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    if (!Array.isArray(payload) || payload.length === 0) {
      return null;
    }

    const { lat, lon, display_name: displayName } = payload[0];
    const parsedLat = Number.parseFloat(lat);
    const parsedLng = Number.parseFloat(lon);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      return null;
    }

    return {
      lat: parsedLat,
      lng: parsedLng,
      displayName,
    };
  } catch (error) {
    console.error('Failed to geocode address', error);
    return null;
  }
}
