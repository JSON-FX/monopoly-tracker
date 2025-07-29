const { HotZoneOrchestrator, ZoneMapper, ZoneScoreCalculator, TrendAnalyzer } = require('./index');

describe('Hot Zone System - Comprehensive Tests', () => {
  let orchestrator;
  let zoneMapper;
  let scoreCalculator;
  let trendAnalyzer;

  // Sample data from documentation
  const SAMPLE_SESSION_DATA = [2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 1, 1, 10, 1, 1, 10, 2, 1, 2, 1, 2, 2, 2, 10, 5, 1, 2, 5, 2, 1, 2];
  
  // Expected zone trends from documentation
  const EXPECTED_TRENDS = {
    spins_1_to_9: 'Cold',     // [2, 2, 2, 2, 1, 2, 2, 2, 2] - Cold phase
    spins_10_to_13: 'Hot',    // [1, 2, 1, 1] - Hot phase  
    spins_14_to_17: 'Cooling', // [10, 1, 1, 10] - Cooling phase
    spins_18_to_26: 'Cold',   // [2, 1, 2, 1, 2, 2, 2, 10, 5] - Cold phase (Martingale danger)
    spins_27_to_31: 'Warming' // [1, 2, 5, 2, 1] - Warming phase
  };

  beforeEach(() => {
    zoneMapper = new ZoneMapper();
    scoreCalculator = new ZoneScoreCalculator(zoneMapper);
    trendAnalyzer = new TrendAnalyzer(zoneMapper);
    orchestrator = new HotZoneOrchestrator({
      minSpinsForAnalysis: 20,
      analysisWindow: 20
    });
  });

  describe('ZoneMapper Component', () => {
    test('should correctly map results to valid segments', () => {
      const testResults = ['1', '2', '5', '10', 'chance', '2rolls', '4rolls'];
      
      testResults.forEach(result => {
        const segment = zoneMapper.resultToSegmentIndex(result);
        expect(segment).not.toBeNull();
        expect(segment).toBeGreaterThanOrEqual(0);
        expect(segment).toBeLessThanOrEqual(53);
      });
    });

    test('should map segments to correct zones', () => {
      expect(zoneMapper.getZoneForSegment(0)).toBe('A');
      expect(zoneMapper.getZoneForSegment(8)).toBe('A');
      expect(zoneMapper.getZoneForSegment(9)).toBe('B');
      expect(zoneMapper.getZoneForSegment(17)).toBe('B');
      expect(zoneMapper.getZoneForSegment(53)).toBe('F');
    });

    test('should return correct zone densities', () => {
      expect(zoneMapper.getZoneDensity('A')).toBe(4);
      expect(zoneMapper.getZoneDensity('B')).toBe(3);
      expect(zoneMapper.getZoneDensity('C')).toBe(4);
      expect(zoneMapper.getZoneDensity('D')).toBe(3);
      expect(zoneMapper.getZoneDensity('E')).toBe(4);
      expect(zoneMapper.getZoneDensity('F')).toBe(4);
    });

    test('should validate result types correctly', () => {
      expect(zoneMapper.isValidResult('1')).toBe(true);
      expect(zoneMapper.isValidResult('2')).toBe(true);
      expect(zoneMapper.isValidResult('chance')).toBe(true);
      expect(zoneMapper.isValidResult('invalid')).toBe(false);
    });
  });

  describe('ZoneScoreCalculator Component', () => {
    test('should calculate zone hit counts correctly', () => {
      const testResults = ['1', '1', '2', '5'];
      const hitCounts = scoreCalculator.calculateZoneHitCounts(testResults);
      
      expect(hitCounts).toHaveProperty('A');
      expect(hitCounts).toHaveProperty('B');
      expect(hitCounts).toHaveProperty('C');
      expect(hitCounts).toHaveProperty('D');
      expect(hitCounts).toHaveProperty('E');
      expect(hitCounts).toHaveProperty('F');
      
      // Sum should equal number of results processed
      const totalHits = Object.values(hitCounts).reduce((sum, count) => sum + count, 0);
      expect(totalHits).toBe(testResults.length);
    });

    test('should calculate zone scores using density formula', () => {
      const hitCounts = { A: 2, B: 1, C: 0, D: 1, E: 0, F: 0 };
      const zoneScores = scoreCalculator.calculateZoneScores(hitCounts);
      
      expect(zoneScores.A).toBe(2 * 4); // 2 hits * 4 density = 8
      expect(zoneScores.B).toBe(1 * 3); // 1 hit * 3 density = 3
      expect(zoneScores.C).toBe(0 * 4); // 0 hits * 4 density = 0
      expect(zoneScores.D).toBe(1 * 3); // 1 hit * 3 density = 3
    });

    test('should find dominant zone correctly', () => {
      const zoneScores = { A: 8, B: 3, C: 0, D: 3, E: 0, F: 0 };
      const dominant = scoreCalculator.getDominantZone(zoneScores, 20);
      
      expect(dominant.zone).toBe('A');
      expect(dominant.score).toBe(8);
      expect(dominant.normalizedScore).toBe(0.4); // 8/20
      expect(dominant.density).toBe(4);
    });

    test('should calculate normalized scores correctly', () => {
      const zoneScores = { A: 10, B: 5, C: 0, D: 0, E: 0, F: 0 };
      const normalized = scoreCalculator.calculateNormalizedScores(zoneScores, 20);
      
      expect(normalized.A).toBe(0.5); // 10/20
      expect(normalized.B).toBe(0.25); // 5/20
      expect(normalized.C).toBe(0); // 0/20
    });
  });

  describe('TrendAnalyzer Component', () => {
    test('should calculate trend direction between zones', () => {
      const current = { zone: 'A', score: 12, normalizedScore: 0.6, density: 4 };
      const previous = { zone: 'A', score: 8, normalizedScore: 0.4, density: 4 };
      
      const trend = trendAnalyzer.calculateTrendDirection(current, previous);
      expect(trend).toBe('up');
    });

    test('should classify Hot status correctly', () => {
      const dominant = { zone: 'A', normalizedScore: 3.5, density: 4 };
      const status = trendAnalyzer.classifyShiftStatus(dominant, 'up', {});
      
      expect(status).toBe('Hot');
    });

    test('should classify Warming status correctly', () => {
      const dominant = { zone: 'C', normalizedScore: 2.2, density: 4 };
      const status = trendAnalyzer.classifyShiftStatus(dominant, 'up', {});
      
      expect(status).toBe('Warming');
    });

    test('should classify Cooling status correctly', () => {
      const dominant = { zone: 'B', normalizedScore: 1.0, density: 3 };
      const status = trendAnalyzer.classifyShiftStatus(dominant, 'down', {});
      
      expect(status).toBe('Cooling');
    });

    test('should classify Cold status correctly', () => {
      const dominant = { zone: 'D', normalizedScore: 0.5, density: 3 };
      const status = trendAnalyzer.classifyShiftStatus(dominant, 'stable', {});
      
      expect(status).toBe('Cold');
    });

    test('should generate appropriate betting recommendations', () => {
      const hotRecommendation = trendAnalyzer.generateBettingRecommendation(
        'Hot', 
        { zone: 'A', normalizedScore: 3.5, density: 4 },
        'up'
      );
      
      expect(hotRecommendation.shouldSkipBet).toBe(false);
      expect(hotRecommendation.confidence).toBe('high');
      expect(hotRecommendation.action).toBe('bet');

      const coldRecommendation = trendAnalyzer.generateBettingRecommendation(
        'Cold',
        { zone: 'D', normalizedScore: 0.5, density: 3 },
        'down'
      );
      
      expect(coldRecommendation.shouldSkipBet).toBe(true);
      expect(coldRecommendation.confidence).toBe('high');
      expect(coldRecommendation.action).toBe('skip');
    });

    test('should determine auto-skip suggestions correctly', () => {
      expect(trendAnalyzer.shouldAutoEnableSkipBet('Cold', 'high')).toBe(true);
      expect(trendAnalyzer.shouldAutoEnableSkipBet('Cooling', 'high')).toBe(true);
      expect(trendAnalyzer.shouldAutoEnableSkipBet('Hot', 'high')).toBe(false);
      
      expect(trendAnalyzer.shouldAutoDisableSkipBet('Hot', 'high')).toBe(true);
      expect(trendAnalyzer.shouldAutoDisableSkipBet('Warming', 'high')).toBe(true);
      expect(trendAnalyzer.shouldAutoDisableSkipBet('Cold', 'high')).toBe(false);
    });
  });

  describe('Sample Session Analysis - Documentation Test Case', () => {
    test('should require minimum spins for analysis', () => {
      const shortHistory = SAMPLE_SESSION_DATA.slice(0, 15); // Less than 20 spins
      const result = orchestrator.analyzeShiftStatus(shortHistory);
      
      expect(result.isActive).toBe(false);
      expect(result.currentSpins).toBe(15);
      expect(result.requiredSpins).toBe(20);
    });

    test('should activate analysis with sufficient data', () => {
      const result = orchestrator.analyzeShiftStatus(SAMPLE_SESSION_DATA);
      
      expect(result.isActive).toBe(true);
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('dominantZone');
      expect(result).toHaveProperty('trendDirection');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('shouldSkipBet');
      expect(result).toHaveProperty('autoSkipSuggestions');
    });

    test('should include auto-skip suggestions', () => {
      const result = orchestrator.analyzeShiftStatus(SAMPLE_SESSION_DATA);
      
      expect(result.autoSkipSuggestions).toHaveProperty('shouldEnableSkipBet');
      expect(result.autoSkipSuggestions).toHaveProperty('shouldDisableSkipBet');
    });

    test('should return comprehensive analysis data', () => {
      const result = orchestrator.analyzeShiftStatus(SAMPLE_SESSION_DATA);
      
      expect(result).toHaveProperty('zoneScores');
      expect(result).toHaveProperty('zoneRanking');
      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('timestamp');
    });

    test('should handle edge cases gracefully', () => {
      expect(orchestrator.analyzeShiftStatus(null).isActive).toBe(false);
      expect(orchestrator.analyzeShiftStatus([]).isActive).toBe(false);
      expect(orchestrator.analyzeShiftStatus(['invalid']).isActive).toBe(false);
    });
  });

  describe('Configuration and Extensibility', () => {
    test('should allow custom configuration', () => {
      const customOrchestrator = new HotZoneOrchestrator({
        minSpinsForAnalysis: 30,
        analysisWindow: 15,
        enableAutoSkipSuggestions: false
      });
      
      expect(customOrchestrator.config.MIN_SPINS_FOR_ANALYSIS).toBe(30);
      expect(customOrchestrator.config.ANALYSIS_WINDOW).toBe(15);
      expect(customOrchestrator.config.ENABLE_AUTO_SKIP_SUGGESTIONS).toBe(false);
    });

    test('should return zone configuration', () => {
      const config = orchestrator.getZoneConfiguration();
      
      expect(config).toHaveProperty('zoneSegmentMap');
      expect(config).toHaveProperty('zoneDensityMap');
      expect(config).toHaveProperty('minSpinsRequired');
      expect(config).toHaveProperty('analysisWindow');
      expect(config).toHaveProperty('thresholds');
    });

    test('should validate and filter spin history', () => {
      const mixedHistory = ['1', '2', 'invalid', '5', null, '10', undefined];
      const filtered = orchestrator.validateAndFilterSpinHistory(mixedHistory);
      
      expect(filtered).toEqual(['1', '2', '5', '10']);
    });

    test('should provide analysis summary', () => {
      const summary = orchestrator.getAnalysisSummary(SAMPLE_SESSION_DATA);
      
      expect(summary).toHaveProperty('isActive');
      expect(summary).toHaveProperty('status');
      expect(summary).toHaveProperty('dominantZone');
      expect(summary).toHaveProperty('recommendation');
    });
  });

  describe('Performance and Error Handling', () => {
    test('should handle large datasets efficiently', () => {
      const largeDataset = Array(1000).fill().map(() => 
        ['1', '2', '5', '10', 'chance'][Math.floor(Math.random() * 5)]
      );
      
      const startTime = Date.now();
      const result = orchestrator.analyzeShiftStatus(largeDataset);
      const endTime = Date.now();
      
      expect(result.isActive).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    test('should handle analysis errors gracefully', () => {
      // Mock an error in the orchestrator with sufficient data to trigger analysis
      const faultyOrchestrator = new HotZoneOrchestrator();
      faultyOrchestrator.zoneMapper.resultToSegmentIndex = () => { throw new Error('Test error'); };
      
      // Use enough data to pass the minimum spins check
      const testData = Array(25).fill('1');
      const result = faultyOrchestrator.analyzeShiftStatus(testData);
      
      expect(result.isActive).toBe(false);
      expect(result.error).toBe(true);
      expect(result.message).toContain('Analysis failed');
    });
  });
}); 