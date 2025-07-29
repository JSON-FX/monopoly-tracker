/**
 * Zone Mapper - Handles segment-to-zone mapping
 * Follows Single Responsibility Principle - only handles wheel position mapping
 */
class ZoneMapper {
  constructor() {
    // Zone definitions - 54 segments divided into 6 equal zones (9 segments each)
    this.ZONE_SEGMENT_MAP = {
      A: { start: 0, end: 8 },    // Segments 0-8
      B: { start: 9, end: 17 },   // Segments 9-17  
      C: { start: 18, end: 26 },  // Segments 18-26
      D: { start: 27, end: 35 },  // Segments 27-35
      E: { start: 36, end: 44 },  // Segments 36-44
      F: { start: 45, end: 53 }   // Segments 45-53
    };

    // Zone density map - number of "1" segments in each zone
    this.ZONE_DENSITY_MAP = {
      A: 4,  // segments: 0, 5, 1, 7
      B: 4,  // segments: 9, 12, 16, 14  
      C: 4,  // segments: 18, 21, 23, 25
      D: 4,  // segments: 27, 30, 32, 34
      E: 4,  // segments: 36, 39, 41, 43
      F: 4   // segments: 45, 48, 50, 52
    };

    // Actual Monopoly Live wheel segment positions
    // Based on real wheel layout - each result type has specific positions
    this.WHEEL_SEGMENT_MAP = {
      '1': [0, 5, 9, 12, 16, 18, 21, 23, 25, 27, 30, 32, 34, 36, 39, 41, 43, 45, 48, 50, 52, 1, 7, 14],
      '2': [2, 6, 10, 15, 19, 24, 28, 33, 37, 42, 46, 51, 3],
      '5': [4, 11, 17, 22, 29, 35, 40],
      '10': [8, 20, 31, 47],
      'chance': [13, 26],
      '2rolls': [38, 53],
      '4rolls': [44, 49]
    };

    // Build reverse lookup for faster segment-to-result mapping
    this.segmentToResultMap = {};
    Object.entries(this.WHEEL_SEGMENT_MAP).forEach(([result, segments]) => {
      segments.forEach(segment => {
        this.segmentToResultMap[segment] = result;
      });
    });
  }

  /**
   * Convert result string to possible segment indices
   * @param {string} result - Result from spin ('1', '2', '5', '10', 'chance', '2rolls', '4rolls')
   * @returns {number[]|null} - Array of possible segment indices or null if not mappable
   */
  getSegmentsForResult(result) {
    return this.WHEEL_SEGMENT_MAP[result] || null;
  }

  /**
   * Get a random segment for a given result (simulates actual spin)
   * @param {string} result - Result from spin
   * @returns {number|null} - Segment index (0-53) or null if not mappable
   */
  resultToSegmentIndex(result) {
    const segments = this.getSegmentsForResult(result);
    if (!segments || segments.length === 0) {
      return null;
    }
    
    // Return a random segment for this result type (simulating wheel position)
    return segments[Math.floor(Math.random() * segments.length)];
  }

  /**
   * Determine which zone a segment belongs to
   * @param {number} segmentIndex - Segment index (0-53)
   * @returns {string|null} - Zone letter (A-F) or null if invalid
   */
  getZoneForSegment(segmentIndex) {
    if (segmentIndex < 0 || segmentIndex > 53) {
      return null;
    }

    for (const [zone, range] of Object.entries(this.ZONE_SEGMENT_MAP)) {
      if (segmentIndex >= range.start && segmentIndex <= range.end) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Get zone density (number of "1" segments in zone)
   * @param {string} zone - Zone letter (A-F)
   * @returns {number} - Number of "1" segments in zone
   */
  getZoneDensity(zone) {
    return this.ZONE_DENSITY_MAP[zone] || 0;
  }

  /**
   * Get all zones
   * @returns {string[]} - Array of zone letters
   */
  getAllZones() {
    return Object.keys(this.ZONE_SEGMENT_MAP);
  }

  /**
   * Validate if a result is mappable
   * @param {string} result - Result to validate
   * @returns {boolean} - True if result can be mapped to segments
   */
  isValidResult(result) {
    return this.WHEEL_SEGMENT_MAP.hasOwnProperty(result);
  }
}

module.exports = ZoneMapper; 