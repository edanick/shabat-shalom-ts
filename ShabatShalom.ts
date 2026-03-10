/**
 * Shabat Shalom TypeScript Library
 * For calculating Shabbat times
 */

export interface CityInfo {
    latitude: number;
    longitude: number;
    timezone: string;
    country: string;
}

export interface ShabbatTimes {
    date: string;
    candleLighting: Date;
    havdalah: Date;
}

export class ShabatShalom {
    private readonly latitude: number;
    private readonly longitude: number;
    private readonly timezone: string;
    private readonly elevation?: number;

    // City database with coordinates and timezones
    private static readonly cities: Record<string, CityInfo> = {
        'Jerusalem': { latitude: 31.7690, longitude: 35.2163, timezone: 'Asia/Jerusalem', country: 'Israel' },
        'Tel Aviv': { latitude: 32.0809, longitude: 34.7806, timezone: 'Asia/Jerusalem', country: 'Israel' },
        'Haifa': { latitude: 32.7940, longitude: 34.9896, timezone: 'Asia/Jerusalem', country: 'Israel' },
        'Beer Sheva': { latitude: 31.2530, longitude: 34.7915, timezone: 'Asia/Jerusalem', country: 'Israel' },
        'Rishon LeZion': { latitude: 31.9730, longitude: 34.7925, timezone: 'Asia/Jerusalem', country: 'Israel' },
        'Petah Tikva': { latitude: 32.0870, longitude: 34.8870, timezone: 'Asia/Jerusalem', country: 'Israel' },
        'Ashdod': { latitude: 31.8024, longitude: 34.6550, timezone: 'Asia/Jerusalem', country: 'Israel' },
        'Netanya': { latitude: 32.3215, longitude: 34.8573, timezone: 'Asia/Jerusalem', country: 'Israel' },
        'Bat Yam': { latitude: 32.0164, longitude: 34.7772, timezone: 'Asia/Jerusalem', country: 'Israel' },
        'Bnei Brak': { latitude: 32.0838, longitude: 34.8340, timezone: 'Asia/Jerusalem', country: 'Israel' },
        'New York': { latitude: 40.7143, longitude: -74.0060, timezone: 'America/New_York', country: 'USA' },
        'London': { latitude: 51.5099, longitude: -0.1181, timezone: 'Europe/London', country: 'UK' },
        'Paris': { latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris', country: 'France' },
        'Los Angeles': { latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles', country: 'USA' },
        'Toronto': { latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto', country: 'Canada' },
        'Miami': { latitude: 25.7617, longitude: -80.1918, timezone: 'America/New_York', country: 'USA' },
        'Chicago': { latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago', country: 'USA' },
        'Buenos Aires': { latitude: -34.6037, longitude: -58.3816, timezone: 'America/Argentina/Buenos_Aires', country: 'Argentina' },
        'Melbourne': { latitude: -37.8136, longitude: 144.9631, timezone: 'Australia/Melbourne', country: 'Australia' },
        'Johannesburg': { latitude: -26.2041, longitude: 28.0473, timezone: 'Africa/Johannesburg', country: 'South Africa' }
    };

    constructor(latitude?: number, longitude?: number, timezone?: string, elevation?: number) {
        // If no parameters provided, use Jerusalem as default
        if (latitude === undefined && longitude === undefined && timezone === undefined) {
            const jerusalem = ShabatShalom.cities['Jerusalem'];
            if (jerusalem) {
                this.latitude = jerusalem.latitude;
                this.longitude = jerusalem.longitude;
                this.timezone = jerusalem.timezone;
            } else {
                throw new Error('Jerusalem not found in city database');
            }
        } else {
            this.latitude = latitude ?? 0;
            this.longitude = longitude ?? 0;
            this.timezone = timezone ?? 'UTC';
        }
        if (elevation !== undefined) {
            this.elevation = elevation;
        }
    }

    /**
     * Get Shabbat times for the current week
     */
    public GetShabbatTimes(): ShabbatTimes {
        const today = new Date();
        const friday = this.GetNextFriday(today);
        const saturday = this.GetNextSaturday(today);

        return {
            date: friday.toISOString().split('T')[0]!,
            candleLighting: this.CalculateCandleLighting(friday),
            havdalah: this.CalculateHavdalah(saturday)
        };
    }

    /**
     * Calculate candle lighting time (18 minutes before sunset)
     */
    public CalculateCandleLighting(date: Date): Date {
        const sunset = this.CalculateSunset(date);
        return this.AddMinutes(sunset, -18);
    }

    /**
     * Calculate havdalah time (42 minutes after sunset)
     */
    public CalculateHavdalah(date: Date): Date {
        const sunset = this.CalculateSunset(date);
        return this.AddMinutes(sunset, 42);
    }

    /**
     * Simplified sunrise calculation
     */
    public CalculateSunrise(date: Date): Date {
        // This is a simplified calculation
        // In production, use a proper astronomical library
        const dayOfYear = this.GetDayOfYear(date);
        const declination = this.CalculateDeclination(dayOfYear);
        const hourAngle = this.CalculateHourAngle(declination, -0.83);

        const sunriseTime = 12 - hourAngle / 15;
        return this.ConvertToTime(sunriseTime, date);
    }

    /**
     * Simplified sunset calculation
     */
    public CalculateSunset(date: Date): Date {
        // This is a simplified calculation
        // In production, use a proper astronomical library
        const dayOfYear = this.GetDayOfYear(date);
        const declination = this.CalculateDeclination(dayOfYear);
        const hourAngle = this.CalculateHourAngle(declination, -0.83);

        const sunsetTime = 12 + hourAngle / 15;
        return this.ConvertToTime(sunsetTime, date);
    }

    /**
     * Get day of year
     */
    private GetDayOfYear(date: Date): number {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date.getTime() - start.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * Calculate solar declination
     */
    private CalculateDeclination(dayOfYear: number): number {
        return -23.45 * Math.cos((360 * (dayOfYear + 10) / 365) * Math.PI / 180);
    }

    /**
     * Calculate hour angle
     */
    private CalculateHourAngle(declination: number, zenith: number): number {
        const latRad = this.latitude * Math.PI / 180;
        const decRad = declination * Math.PI / 180;
        const zenRad = zenith * Math.PI / 180;

        const cosHourAngle = (Math.cos(zenRad) - Math.sin(latRad) * Math.sin(decRad)) /
                           (Math.cos(latRad) * Math.cos(decRad));

        return Math.acos(cosHourAngle) * 180 / Math.PI;
    }

    /**
     * Convert decimal time to Date object
     */
    private ConvertToTime(decimalTime: number, date: Date): Date {
        const hours = Math.floor(decimalTime);
        const minutes = Math.floor((decimalTime - hours) * 60);
        const seconds = Math.floor(((decimalTime - hours) * 60 - minutes) * 60);

        const result = new Date(date);
        result.setHours(hours, minutes, seconds, 0);
        return result;
    }

    /**
     * Add minutes to a Date
     */
    private AddMinutes(date: Date, minutes: number): Date {
        const result = new Date(date);
        result.setMinutes(result.getMinutes() + minutes);
        return result;
    }

    /**
     * Get next Friday from given date
     */
    private GetNextFriday(date: Date): Date {
        const day = date.getDay();
        const daysUntilFriday = (5 - day + 7) % 7 || 7;
        const friday = new Date(date);
        friday.setDate(date.getDate() + daysUntilFriday);
        return friday;
    }

    /**
     * Get next Saturday from given date
     */
    private GetNextSaturday(date: Date): Date {
        const day = date.getDay();
        const daysUntilSaturday = (6 - day + 7) % 7 || 7;
        const saturday = new Date(date);
        saturday.setDate(date.getDate() + daysUntilSaturday);
        return saturday;
    }

    /**
     * Format time for display
     */
    public FormatTime(date: Date): string {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * Get city information by name
     */
    public static GetCityInfo(cityName: string): CityInfo {
        const city = ShabatShalom.cities[cityName];
        if (!city) {
            throw new Error(`City '${cityName}' not found in database`);
        }
        return city;
    }

    /**
     * Get all cities in a specific country
     */
    public static GetCitiesInCountry(country: string): Record<string, CityInfo> {
        const result: Record<string, CityInfo> = {};
        for (const [name, info] of Object.entries(ShabatShalom.cities)) {
            if (info.country === country) {
                result[name] = info;
            }
        }
        return result;
    }

    /**
     * Get all Israeli cities
     */
    public static GetAllIsraeliCities(): Record<string, CityInfo> {
        return ShabatShalom.GetCitiesInCountry('Israel');
    }

    /**
     * Search cities by name pattern
     */
    public static SearchCities(query: string): Record<string, CityInfo> {
        const result: Record<string, CityInfo> = {};
        const lowerQuery = query.toLowerCase();
        for (const [name, info] of Object.entries(ShabatShalom.cities)) {
            if (name.toLowerCase().includes(lowerQuery)) {
                result[name] = info;
            }
        }
        return result;
    }

    /**
     * Check if it's currently Shabbat
     */
    public IsShabat(date: Date = new Date()): boolean {
        const now = new Date();
        const friday = this.GetNextFriday(date);
        const saturday = this.GetNextSaturday(date);
        
        const candleLighting = this.CalculateCandleLighting(friday);
        const havdalah = this.CalculateHavdalah(saturday);
        
        return now >= candleLighting && now <= havdalah;
    }
}

// Export for ES modules
export default ShabatShalom;
