const { HotZoneOrchestrator } = require('./index');

/**
 * Test the hot zone system using the exact sample data from documentation
 * Session ID: 115 - Loss Case Test
 */
async function testSampleData() {
  console.log('🔥 Testing Hot Zone System with Documentation Sample Data');
  console.log('=' .repeat(60));
  
  // Sample data from documentation
  const SAMPLE_SESSION_DATA = [2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 1, 1, 10, 1, 1, 10, 2, 1, 2, 1, 2, 2, 2, 10, 5, 1, 2, 5, 2, 1, 2];
  
  // Expected trends from documentation
  const EXPECTED_TRENDS = {
    '1-9': { spins: [2, 2, 2, 2, 1, 2, 2, 2, 2], expected: 'Cold', description: 'Entry blocked' },
    '10-13': { spins: [1, 2, 1, 1], expected: 'Hot', description: 'Entry encouraged' },
    '14-17': { spins: [10, 1, 1, 10], expected: 'Cooling', description: 'Skip or lower bet' },
    '18-26': { spins: [2, 1, 2, 1, 2, 2, 2, 10, 5], expected: 'Cold', description: 'Skip strongly (Martingale danger)' },
    '27-31': { spins: [1, 2, 5, 2, 1], expected: 'Warming', description: 'Low-stake re-entry possible' }
  };

  // Initialize orchestrator
  const orchestrator = new HotZoneOrchestrator({
    minSpinsForAnalysis: 20,
    analysisWindow: 20,
    enableAutoSkipSuggestions: true
  });

  console.log('📊 Sample Session Information:');
  console.log(`- Session ID: 115`);
  console.log(`- Duration: 24m`);
  console.log(`- Capital Change: ₱15,005 → ₱8,955 (₱-6,050.00)`);
  console.log(`- Win Rate: 28.57%`);
  console.log(`- Total Spins: ${SAMPLE_SESSION_DATA.length}`);
  console.log(`- Raw Results: [${SAMPLE_SESSION_DATA.join(', ')}]`);
  console.log('');

  // Test with insufficient data (should be inactive)
  console.log('🔍 Testing with insufficient data (first 15 spins):');
  const shortData = SAMPLE_SESSION_DATA.slice(0, 15);
  const shortResult = orchestrator.analyzeShiftStatus(shortData);
  console.log(`- Status: ${shortResult.isActive ? 'Active' : 'Inactive'}`);
  console.log(`- Current Spins: ${shortResult.currentSpins || 0}`);
  console.log(`- Required: ${shortResult.requiredSpins || 20}`);
  console.log('');

  // Test with sufficient data (all 32 spins)
  console.log('🔥 Testing with full sample data (32 spins):');
  const fullResult = orchestrator.analyzeShiftStatus(SAMPLE_SESSION_DATA);
  
  console.log(`✅ Analysis Results:`);
  console.log(`- Status: ${fullResult.isActive ? 'Active' : 'Inactive'}`);
  
  if (fullResult.isActive) {
    console.log(`- Zone Status: ${fullResult.status}`);
    console.log(`- Dominant Zone: ${fullResult.dominantZone}`);
    console.log(`- Zone Score: ${fullResult.score}`);
    console.log(`- Normalized Score: ${fullResult.normalizedScore?.toFixed(2)}`);
    console.log(`- Trend Direction: ${fullResult.trendDirection}`);
    console.log(`- Confidence: ${fullResult.confidence}`);
    console.log(`- Action: ${fullResult.action}`);
    console.log(`- Should Skip Bet: ${fullResult.shouldSkipBet ? 'Yes' : 'No'}`);
    console.log(`- Recommendation: ${fullResult.recommendation}`);
    
    // Auto-skip suggestions
    if (fullResult.autoSkipSuggestions) {
      console.log(`- Auto Enable Skip: ${fullResult.autoSkipSuggestions.shouldEnableSkipBet ? 'Yes' : 'No'}`);
      console.log(`- Auto Disable Skip: ${fullResult.autoSkipSuggestions.shouldDisableSkipBet ? 'Yes' : 'No'}`);
      if (fullResult.autoSkipSuggestions.enableMessage) {
        console.log(`- Enable Message: ${fullResult.autoSkipSuggestions.enableMessage}`);
      }
      if (fullResult.autoSkipSuggestions.disableMessage) {
        console.log(`- Disable Message: ${fullResult.autoSkipSuggestions.disableMessage}`);
      }
    }

    // Zone ranking
    console.log(`\n📈 Zone Ranking:`);
    fullResult.zoneRanking.forEach((zone, index) => {
      console.log(`  ${index + 1}. Zone ${zone.zone}: Score ${zone.score}, Normalized ${zone.normalizedScore.toFixed(2)}, Density ${zone.density}`);
    });

    // Zone scores breakdown
    console.log(`\n🎯 Zone Scores:`);
    Object.entries(fullResult.zoneScores).forEach(([zone, score]) => {
      const density = orchestrator.zoneMapper.getZoneDensity(zone);
      console.log(`  Zone ${zone}: ${score} (density: ${density})`);
    });

    // Statistics
    console.log(`\n📊 Statistics:`);
    console.log(`  - Total Spins Analyzed: ${fullResult.totalSpins}`);
    console.log(`  - Analysis Window: ${fullResult.analysisWindow}`);
    console.log(`  - Average Zone Score: ${fullResult.statistics.average.toFixed(2)}`);
    console.log(`  - Max Zone Score: ${fullResult.statistics.max}`);
    console.log(`  - Min Zone Score: ${fullResult.statistics.min}`);
  }

  console.log('');

  // Test progressive analysis (show how trends change over time)
  console.log('🔄 Progressive Analysis (showing trend changes):');
  console.log('-'.repeat(60));
  
  for (let i = 20; i <= SAMPLE_SESSION_DATA.length; i += 4) {
    const progressiveData = SAMPLE_SESSION_DATA.slice(0, i);
    const progressiveResult = orchestrator.analyzeShiftStatus(progressiveData);
    
    if (progressiveResult.isActive) {
      console.log(`Spins 1-${i}: ${progressiveResult.status} (Zone ${progressiveResult.dominantZone}, Score: ${progressiveResult.score}, Trend: ${progressiveResult.trendDirection})`);
      
      // Check if this matches expected trends from documentation
      for (const [period, expected] of Object.entries(EXPECTED_TRENDS)) {
        if (period.includes(`-${i}`)) {
          const match = progressiveResult.status === expected.expected ? '✅' : '❌';
          console.log(`  ${match} Expected: ${expected.expected} - ${expected.description}`);
        }
      }
    }
  }

  console.log('');

  // Test zone configuration
  console.log('⚙️ System Configuration:');
  const config = orchestrator.getZoneConfiguration();
  console.log(`- Min Spins Required: ${config.minSpinsRequired}`);
  console.log(`- Analysis Window: ${config.analysisWindow}`);
  console.log(`- Zone Segment Mapping:`);
  Object.entries(config.zoneSegmentMap).forEach(([zone, range]) => {
    console.log(`  Zone ${zone}: Segments ${range.start}-${range.end}`);
  });
  console.log(`- Zone Density Mapping:`);
  Object.entries(config.zoneDensityMap).forEach(([zone, density]) => {
    console.log(`  Zone ${zone}: ${density} "1" segments`);
  });

  console.log('');

  // Test validation and filtering
  console.log('🔧 Validation Tests:');
  const mixedData = [...SAMPLE_SESSION_DATA, 'invalid', null, undefined, 'chance'];
  const filtered = orchestrator.validateAndFilterSpinHistory(mixedData);
  console.log(`- Original data length: ${mixedData.length}`);
  console.log(`- Filtered data length: ${filtered.length}`);
  console.log(`- Filtered out: ${mixedData.length - filtered.length} invalid entries`);

  console.log('');
  console.log('✅ Test completed successfully!');
  return fullResult;
}

// Export for use in other tests
module.exports = { testSampleData };

// Run test if called directly
if (require.main === module) {
  testSampleData().catch(console.error);
} 