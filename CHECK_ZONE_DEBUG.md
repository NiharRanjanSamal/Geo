# Debugging "Outside Zone" issue

## Quick test in MySQL Workbench

Run this query to see CH_Canteen's actual coordinates and radius:

```sql
SELECT 
    sz.name,
    sz.zone_type,
    sz.center_latitude,
    sz.center_longitude,
    sz.radius_meters,
    s.name AS site_name
FROM site_zone sz
INNER JOIN site s ON s.id = sz.site_id
WHERE sz.name = 'CH_Canteen' AND s.name = 'Main Office';
```

Compare:
- **center_latitude, center_longitude** → Should match your phone's GPS location (approximately)
- **radius_meters** → Should be at least 50-100 meters for reliable GPS

## Your phone's actual location

On your Android phone:
1. Open **Google Maps**
2. Tap the blue dot (your location)
3. Note the coordinates shown (e.g., "22.80972, 86.18756")

## Calculate distance manually

Your zone center (from query above): `22.80972, 86.18756`  
Your phone GPS: `22.80950, 86.18770`

Use this online tool to check distance:
https://www.movable-type.co.uk/scripts/latlong.html

If distance > radius_meters → you'll see "Outside Zone"

## Quick fix

**Option A: Increase radius in web app**
1. Web app → Attendance Zones → CH_Canteen → Edit
2. Set **Radius (meters)** to **100** or **150**
3. Save

**Option B: Update coordinates to your exact location**
1. Get your exact GPS from Google Maps on your phone
2. Web app → Attendance Zones → CH_Canteen → Edit
3. Update **Latitude** and **Longitude** to match your phone
4. Set radius to 50-100 meters
5. Save

## Force mobile app to reload zones

After changing in web app:
1. Close and reopen the mobile app (swipe away from recent apps)
2. Pull down to refresh on the dashboard
3. Try marking attendance again
