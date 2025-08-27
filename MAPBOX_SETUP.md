# 🗺️ Mapbox Setup Guide

## Step 1: Get Your Free Mapbox API Key

1. Go to [mapbox.com](https://www.mapbox.com)
2. Click "Sign up for free"
3. Create your account
4. Go to your account dashboard
5. Navigate to "Access tokens"
6. Copy your **Default public token** (starts with `pk.`)

## Step 2: Configure Your API Key

Replace the placeholder token in `components/MapboxMap.tsx` on line 21:

```typescript
// Replace this line:
Mapbox.setAccessToken('pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV5cTl2bGIwczViM3FxbHMweDFydWZ5In0.example');

// With your actual token:
Mapbox.setAccessToken('pk.your_actual_token_here');
```

## Step 3: Optional - Add to Environment Variables

For better security, create a `.env` file:

```bash
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_actual_token_here
```

Then update `MapboxMap.tsx`:

```typescript
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'fallback_token');
```

## ✅ Benefits of Mapbox vs Google Maps

- **Free tier:** 50,000+ monthly active users
- **No API key restrictions** needed for basic usage
- **Better customization** with beautiful map styles
- **Offline maps** support
- **Vector tiles** for better performance
- **More reliable** on Android devices

## 🎨 Available Map Styles

You can change the map style in `MapboxMap.tsx` line 123:

```typescript
styleURL="mapbox://styles/mapbox/streets-v12"     // Default streets
styleURL="mapbox://styles/mapbox/outdoors-v12"   // Outdoors/hiking
styleURL="mapbox://styles/mapbox/light-v11"      // Light theme
styleURL="mapbox://styles/mapbox/dark-v11"       // Dark theme
styleURL="mapbox://styles/mapbox/satellite-v9"   // Satellite view
```

## 🚀 Ready to Test

After setting up your API key, run:

```bash
expo run:android
```

Your map should now load with beautiful Mapbox styling!
