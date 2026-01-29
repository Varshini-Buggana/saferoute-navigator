import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
  place_id: string;
}

// Try Google Places API first, fallback to Nominatim (OSM)
async function searchWithGoogle(input: string, apiKey: string): Promise<PlacePrediction[] | null> {
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('types', 'geocode|establishment');
    url.searchParams.set('language', 'en');
    url.searchParams.set('location', '20.5937,78.9629');
    url.searchParams.set('radius', '5000000');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      return (data.predictions || []).map((p: any) => ({
        place_id: p.place_id,
        description: p.description,
        structured_formatting: p.structured_formatting,
      }));
    }
    
    console.log('[Geocode] Google API status:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('[Geocode] Google API error:', error);
    return null;
  }
}

async function searchWithNominatim(input: string): Promise<PlacePrediction[]> {
  try {
    // Use proper URL encoding
    const searchQuery = encodeURIComponent(input);
    const url = `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&addressdetails=1&limit=5`;

    console.log('[Geocode] Nominatim URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SafeTravelFinder/1.0 (https://safetravel.lovable.app)',
        'Accept': 'application/json',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      console.error('[Geocode] Nominatim HTTP error:', response.status);
      return [];
    }

    const text = await response.text();
    console.log('[Geocode] Nominatim response preview:', text.substring(0, 200));

    const data = JSON.parse(text);

    return data.map((item: any) => ({
      place_id: `osm_${item.osm_type}_${item.osm_id}`,
      description: item.display_name,
      structured_formatting: {
        main_text: item.name || item.display_name.split(',')[0],
        secondary_text: item.display_name.split(',').slice(1, 3).join(',').trim(),
      },
    }));
  } catch (error) {
    console.error('[Geocode] Nominatim error:', error);
    return [];
  }
}

async function geocodeWithGoogle(placeId: string, apiKey: string): Promise<GeocodeResult | null> {
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('fields', 'geometry,formatted_address,name');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK') {
      return {
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng,
        formatted_address: data.result.formatted_address || data.result.name,
        place_id: placeId,
      };
    }
    return null;
  } catch (error) {
    console.error('[Geocode] Google geocode error:', error);
    return null;
  }
}

async function geocodeWithNominatim(input: string): Promise<GeocodeResult | null> {
  try {
    const searchQuery = encodeURIComponent(input);
    const url = `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SafeTravelFinder/1.0 (https://safetravel.lovable.app)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Geocode] Nominatim geocode HTTP error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted_address: result.display_name,
        place_id: `osm_${result.osm_type}_${result.osm_id}`,
      };
    }
    return null;
  } catch (error) {
    console.error('[Geocode] Nominatim geocode error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY') || '';
    const hasGoogleKey = GOOGLE_API_KEY && GOOGLE_API_KEY.length > 10 && !GOOGLE_API_KEY.includes('your-');

    const { action, input, placeId } = await req.json();
    console.log(`[Geocode] Action: ${action}, Input: ${input || placeId}, Has Google Key: ${hasGoogleKey}`);

    if (action === 'autocomplete') {
      let predictions: PlacePrediction[] = [];
      let source = 'openstreetmap';

      // Try Google first if we have a valid key
      if (hasGoogleKey) {
        const googleResults = await searchWithGoogle(input, GOOGLE_API_KEY);
        if (googleResults !== null && googleResults.length > 0) {
          predictions = googleResults;
          source = 'google';
          console.log(`[Geocode] Using Google results: ${predictions.length} predictions`);
        }
      }

      // Fallback to Nominatim if Google fails or no key
      if (predictions.length === 0) {
        console.log('[Geocode] Falling back to Nominatim...');
        predictions = await searchWithNominatim(input);
        console.log(`[Geocode] Using Nominatim results: ${predictions.length} predictions`);
      }

      return new Response(JSON.stringify({
        success: true,
        predictions,
        source,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'geocode') {
      let result: GeocodeResult | null = null;

      // Check if it's a Google place_id or OSM place_id
      if (placeId && placeId.startsWith('osm_')) {
        // OSM place - use Nominatim with the input text
        result = await geocodeWithNominatim(input);
      } else if (placeId && hasGoogleKey) {
        // Try Google Place Details
        result = await geocodeWithGoogle(placeId, GOOGLE_API_KEY);
      }

      // Fallback to Nominatim geocoding
      if (!result && input) {
        result = await geocodeWithNominatim(input);
        console.log('[Geocode] Fallback to Nominatim for geocoding');
      }

      if (result) {
        console.log(`[Geocode] Geocoded to: ${result.lat}, ${result.lng} - ${result.formatted_address}`);
        return new Response(JSON.stringify({
          success: true,
          result,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Location not found. Please try a different search term.',
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action. Use "autocomplete" or "geocode"');

  } catch (error) {
    console.error('[Geocode] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
