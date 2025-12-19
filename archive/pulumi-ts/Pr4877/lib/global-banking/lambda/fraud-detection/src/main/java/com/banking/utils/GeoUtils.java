package com.banking.utils;

/**
 * Utility class for geographic calculations
 */
public class GeoUtils {
    
    private static final double EARTH_RADIUS_KM = 6371.0;
    
    /**
     * Calculate distance between two geographic coordinates using Haversine formula
     * 
     * @param lat1 Latitude of first point
     * @param lon1 Longitude of first point
     * @param lat2 Latitude of second point
     * @param lon2 Longitude of second point
     * @return Distance in kilometers
     */
    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return EARTH_RADIUS_KM * c;
    }
    
    /**
     * Check if distance traveled is physically impossible given time elapsed
     * 
     * @param distanceKm Distance in kilometers
     * @param minutesElapsed Time elapsed in minutes
     * @return true if travel is impossible (suggests fraud)
     */
    public static boolean isImpossibleTravel(double distanceKm, int minutesElapsed) {
        // Maximum realistic speed: 900 km/h (airplane)
        double maxSpeedKmPerMin = 900.0 / 60.0; // 15 km/min
        double maxPossibleDistance = maxSpeedKmPerMin * minutesElapsed;
        
        return distanceKm > maxPossibleDistance;
    }
    
    /**
     * Categorize distance into risk levels
     * 
     * @param distanceKm Distance in kilometers
     * @param minutesElapsed Time elapsed in minutes
     * @return Risk score from 0.0 (low risk) to 1.0 (high risk)
     */
    public static double calculateDistanceRisk(double distanceKm, int minutesElapsed) {
        if (minutesElapsed <= 0) {
            return 0.0;
        }
        
        if (isImpossibleTravel(distanceKm, minutesElapsed)) {
            return 1.0; // Impossible travel = maximum risk
        }
        
        // Calculate required speed
        double requiredSpeedKmPerHour = (distanceKm / minutesElapsed) * 60.0;
        
        if (requiredSpeedKmPerHour > 500) {
            // Requires airplane speed
            return 0.7;
        } else if (requiredSpeedKmPerHour > 100) {
            // Requires car/train
            return 0.4;
        } else if (requiredSpeedKmPerHour > 20) {
            // Normal travel
            return 0.2;
        }
        
        // Walking distance
        return 0.0;
    }
    
    /**
     * Get approximate coordinates for a country code (simplified)
     * In production, use a proper geolocation service
     */
    public static double[] getCountryCoordinates(String countryCode) {
        // Simplified mapping 
        switch (countryCode.toUpperCase()) {
            case "US": return new double[]{37.0902, -95.7129};
            case "UK": return new double[]{55.3781, -3.4360};
            case "NG": return new double[]{9.0820, 8.6753};
            case "IN": return new double[]{20.5937, 78.9629};
            case "CN": return new double[]{35.8617, 104.1954};
            case "BR": return new double[]{-14.2350, -51.9253};
            case "DE": return new double[]{51.1657, 10.4515};
            case "FR": return new double[]{46.2276, 2.2137};
            default: return new double[]{0.0, 0.0};
        }
    }
}
