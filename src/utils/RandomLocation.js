export const getRandomLocationInCircle = (radiusInKm, center) => {
    const radiusInMeters = radiusInKm * 1000;
  
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusInMeters;

    const deltaLat = distance * Math.cos(angle) / 111320;
    const deltaLng = (distance * Math.sin(angle) / (111320 * Math.cos(center.lat * Math.PI / 180))); 
  
    return {
      latitude: center.lat + deltaLat,
      longitude: center.lng + deltaLng,
    };
  };
  
  export default getRandomLocationInCircle;
  