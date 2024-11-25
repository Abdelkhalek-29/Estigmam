export function haversineDistance(start, end) {
  // Ensure coordinates are valid
  if (
    !start ||
    !end ||
    !start.Latitude ||
    !start.Longitude ||
    !end.Latitude ||
    !end.Longitude
  ) {
    return NaN; // Return NaN if any coordinate is missing
  }

  // Radius of the Earth in km
  const R = 6371;

  // Convert latitude and longitude from degrees to radians
  const lat1 = start.Latitude * (Math.PI / 180);
  const lon1 = start.Longitude * (Math.PI / 180);
  const lat2 = end.Latitude * (Math.PI / 180);
  const lon2 = end.Longitude * (Math.PI / 180);

  // Haversine formula
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  const a =
    Math.sin(dlat / 2) * Math.sin(dlat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in km
  const distance = R * c;

  // Return the distance
  return distance;
}
