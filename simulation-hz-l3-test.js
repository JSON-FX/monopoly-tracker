/**
 * Simulation Test: Combined Hot Zone + L3 Status Betting Strategy
 * 
 * Parameters:
 * - Starting Capital: ₱8000
 * - Base Bet: ₱25
 * - Profit Target: ₱500
 * - Strategy: Bet only when BOTH conditions are met:
 *   1. Hot Zone Status: "Hot" or "Warming"
 *   2. L3 Status: At least 1 "1" in last 3 non-chance results
 */

const { HotZoneOrchestrator } = require('./backend/src/services/hotzone/index');

class HotZoneL3Simulator {
  constructor(config = {}) {
    this.hotZoneOrchestrator = new HotZoneOrchestrator({
      minSpinsForAnalysis: 20,
      analysisWindow: 20
    });
    
    // Simulation parameters - can be overridden in constructor
    this.startingCapital = config.startingCapital || 8000;
    this.baseBet = config.baseBet || 25;
    this.profitTarget = config.profitTarget || 500;
    
    // State tracking
    this.currentCapital = this.startingCapital;
    this.consecutiveLosses = 0;
    this.totalBets = 0;
    this.successfulBets = 0;
    this.highestMartingale = this.baseBet;
    this.sessionHistory = [];
    this.results = [];
    
    // Statistics
    this.totalSpins = 0;
    this.betsPlaced = 0;
    this.betsSkipped = 0;
    this.winRate = 0;
  }

  /**
   * Calculate martingale bet amount
   */
  calculateMartingaleBet(baseBet, consecutiveLosses) {
    return baseBet * Math.pow(2, consecutiveLosses);
  }

  /**
   * Check L3 status - at least 1 "1" in last 3 non-chance results
   */
  checkL3Status() {
    if (this.results.length < 3) {
      return { condition: 'Insufficient Data', shouldBet: false };
    }

    const nonChanceResults = this.results.filter(r => r !== 'chance');
    if (nonChanceResults.length < 3) {
      return { condition: 'Insufficient Data', shouldBet: false };
    }

    const last3 = nonChanceResults.slice(-3);
    const onesCount = last3.filter(result => result === '1').length;
    
    const shouldBet = onesCount >= 1;
    const condition = shouldBet ? 'Bet' : 'Do Not Bet';
    
    return { condition, shouldBet, last3, onesCount };
  }

  /**
   * Check Hot Zone status
   */
  checkHotZoneStatus() {
    if (this.results.length < 20) {
      return { condition: 'Analyzing', shouldBet: false, status: 'Insufficient Data' };
    }

    const analysis = this.hotZoneOrchestrator.analyzeShiftStatus(this.results);
    
    if (!analysis.isActive) {
      return { condition: 'Analyzing', shouldBet: false, status: 'Inactive' };
    }

    const shouldBet = (analysis.status === 'Hot' || analysis.status === 'Warming');
    const condition = shouldBet ? 'Bet' : 'Do Not Bet';
    
    return { 
      condition, 
      shouldBet, 
      status: analysis.status,
      dominantZone: analysis.dominantZone,
      confidence: analysis.confidence,
      recommendation: analysis.recommendation
    };
  }

  /**
   * Get dual condition betting decision
   */
  getDualConditionBettingStatus() {
    const hotZoneStatus = this.checkHotZoneStatus();
    const l3Status = this.checkL3Status();
    
    const shouldBet = hotZoneStatus.shouldBet && l3Status.shouldBet;
    
    const reason = shouldBet 
      ? `✅ Betting Enabled: HZ (${hotZoneStatus.condition}) + L3 (${l3Status.condition})`
      : `🛑 Betting Skipped: HZ (${hotZoneStatus.condition}) + L3 (${l3Status.condition})`;

    return {
      shouldBet,
      reason,
      hotZoneStatus,
      l3Status
    };
  }

  /**
   * Process a single spin result
   */
  processSpin(result) {
    this.totalSpins++;
    this.results.push(result);
    
    // Skip chance results for betting logic
    if (result === 'chance') {
      return { action: 'chance', reason: 'Chance event - no betting action' };
    }

    const bettingStatus = this.getDualConditionBettingStatus();
    
    if (!bettingStatus.shouldBet) {
      this.betsSkipped++;
      return { 
        action: 'skip', 
        reason: bettingStatus.reason,
        hotZone: bettingStatus.hotZoneStatus,
        l3: bettingStatus.l3Status
      };
    }

    // Place bet
    const betAmount = this.calculateMartingaleBet(this.baseBet, this.consecutiveLosses);
    this.betsPlaced++;
    this.totalBets++;
    
    // Track highest martingale
    if (betAmount > this.highestMartingale) {
      this.highestMartingale = betAmount;
    }
    
    // Determine win/loss (betting on "1")
    const won = result === '1';
    
    if (won) {
      // Win
      this.currentCapital += betAmount;
      this.consecutiveLosses = 0;
      this.successfulBets++;
      
      return {
        action: 'bet_win',
        betAmount,
        newCapital: this.currentCapital,
        reason: bettingStatus.reason,
        result
      };
    } else {
      // Loss
      this.currentCapital -= betAmount;
      this.consecutiveLosses++;
      
      return {
        action: 'bet_loss',
        betAmount,
        newCapital: this.currentCapital,
        reason: bettingStatus.reason,
        result
      };
    }
  }

  /**
   * Run simulation with provided results
   */
  runSimulation(results) {
    console.log('🎰 STARTING HOT ZONE + L3 COMBINED SIMULATION');
    console.log('============================================');
    console.log(`Starting Capital: ₱${this.startingCapital.toLocaleString()}`);
    console.log(`Base Bet: ₱${this.baseBet}`);
    console.log(`Profit Target: ₱${this.profitTarget}`);
    console.log(`Total Results: ${results.length}\n`);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const spinAction = this.processSpin(result);
      
      // Store session history
      this.sessionHistory.push({
        spin: i + 1,
        result,
        ...spinAction,
        capital: this.currentCapital,
        profit: this.currentCapital - this.startingCapital,
        consecutiveLosses: this.consecutiveLosses
      });

      // Check profit target
      const currentProfit = this.currentCapital - this.startingCapital;
      if (currentProfit >= this.profitTarget) {
        console.log(`🎉 PROFIT TARGET REACHED at spin ${i + 1}!`);
        break;
      }
      
      // Check for bankruptcy
      if (this.currentCapital <= 0) {
        console.log(`💥 BANKRUPTCY at spin ${i + 1}!`);
        break;
      }
    }

    return this.generateReport();
  }

  /**
   * Generate comprehensive simulation report
   */
  generateReport() {
    const finalProfit = this.currentCapital - this.startingCapital;
    this.winRate = this.totalBets > 0 ? (this.successfulBets / this.totalBets) * 100 : 0;
    
    const report = {
      // Financial Summary
      startingCapital: this.startingCapital,
      finalCapital: this.currentCapital,
      totalProfit: finalProfit,
      profitTarget: this.profitTarget,
      targetReached: finalProfit >= this.profitTarget,
      
      // Betting Statistics
      totalSpins: this.totalSpins,
      betsPlaced: this.betsPlaced,
      betsSkipped: this.betsSkipped,
      successfulBets: this.successfulBets,
      winRate: this.winRate,
      highestMartingale: this.highestMartingale,
      
      // Strategy Analysis
      bettingEfficiency: this.totalSpins > 0 ? (this.betsPlaced / this.totalSpins) * 100 : 0,
      
      // Session History
      sessionHistory: this.sessionHistory,
      
      // Final Status
      finalHotZoneStatus: this.checkHotZoneStatus(),
      finalL3Status: this.checkL3Status()
    };

    this.printReport(report);
    return report;
  }

  /**
   * Print detailed simulation report
   */
  printReport(report) {
    console.log('\n📊 SIMULATION RESULTS');
    console.log('===================');
    
    // Financial Summary
    console.log('\n💰 FINANCIAL SUMMARY');
    console.log('-------------------');
    console.log(`Starting Capital: ₱${report.startingCapital.toLocaleString()}`);
    console.log(`Final Capital: ₱${report.finalCapital.toLocaleString()}`);
    console.log(`Total P/L: ${report.totalProfit >= 0 ? '+' : ''}₱${report.totalProfit.toLocaleString()}`);
    console.log(`Profit Target: ₱${report.profitTarget.toLocaleString()}`);
    console.log(`Target Reached: ${report.targetReached ? '✅ YES' : '❌ NO'}`);
    
    // Betting Statistics
    console.log('\n📈 BETTING STATISTICS');
    console.log('--------------------');
    console.log(`Total Spins: ${report.totalSpins}`);
    console.log(`Bets Placed: ${report.betsPlaced}`);
    console.log(`Bets Skipped: ${report.betsSkipped}`);
    console.log(`Successful Bets: ${report.successfulBets}`);
    console.log(`Win Rate: ${report.winRate.toFixed(1)}%`);
    console.log(`Highest Martingale: ₱${report.highestMartingale.toLocaleString()}`);
    console.log(`Betting Efficiency: ${report.bettingEfficiency.toFixed(1)}%`);
    
    // Strategy Analysis
    console.log('\n🎯 STRATEGY ANALYSIS');
    console.log('-------------------');
    console.log(`Final Hot Zone Status: ${report.finalHotZoneStatus.status || 'N/A'}`);
    console.log(`Final L3 Status: ${report.finalL3Status.condition}`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('------------------');
    
    if (report.totalProfit < 0) {
      console.log('❌ Strategy resulted in loss. Consider:');
      console.log('   • Reviewing Hot Zone thresholds');
      console.log('   • Adjusting L3 criteria');
      console.log('   • Implementing stricter bankroll management');
    } else if (report.targetReached) {
      console.log('✅ Strategy successfully reached profit target!');
      console.log('   • Current parameters appear effective');
      console.log('   • Consider testing with larger sample size');
    } else {
      console.log('⚠️ Strategy showing positive results but target not reached:');
      console.log('   • Consider longer simulation period');
      console.log('   • Monitor martingale progression carefully');
    }
    
    if (report.highestMartingale > report.startingCapital * 0.1) {
      console.log(`⚠️ HIGH MARTINGALE WARNING: ₱${report.highestMartingale} (${((report.highestMartingale/report.startingCapital)*100).toFixed(1)}% of capital)`);
    }
    
    if (report.bettingEfficiency < 30) {
      console.log(`ℹ️ LOW BETTING EFFICIENCY: ${report.bettingEfficiency.toFixed(1)}% - Strategy is very selective`);
    }
  }
}

// Generate random 100 spins based on Monopoly Live probabilities
function generateRandomSpins(count = 100) {
  const results = [];
  const probabilities = [
    { result: '1', weight: 24 },    // 24/54 segments
    { result: '2', weight: 13 },    // 13/54 segments  
    { result: '5', weight: 7 },     // 7/54 segments
    { result: '10', weight: 4 },    // 4/54 segments
    { result: 'chance', weight: 2 }, // 2/54 segments
    { result: '2rolls', weight: 2 }, // 2/54 segments
    { result: '4rolls', weight: 2 }  // 2/54 segments
  ];
  
  // Create weighted array representing all 54 wheel segments
  const wheelSegments = [];
  probabilities.forEach(({ result, weight }) => {
    for (let i = 0; i < weight; i++) {
      wheelSegments.push(result);
    }
  });
  
  // Shuffle the wheel segments to ensure randomness
  for (let i = wheelSegments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wheelSegments[i], wheelSegments[j]] = [wheelSegments[j], wheelSegments[i]];
  }
  
  // Generate random results ensuring all segment types can appear
  for (let i = 0; i < count; i++) {
    // Use crypto-quality randomness for better distribution
    const randomIndex = Math.floor(Math.random() * wheelSegments.length);
    results.push(wheelSegments[randomIndex]);
  }
  
  return results;
}

// Generate a more diverse spin set to ensure all segments are represented
function generateDiverseSpins(count = 100) {
  const results = [];
  const allSegmentTypes = ['1', '2', '5', '10', 'chance', '2rolls', '4rolls'];
  
  // First, ensure at least one of each segment type appears
  allSegmentTypes.forEach(segment => {
    results.push(segment);
  });
  
  // Fill the rest with weighted random selection
  const probabilities = [
    { result: '1', weight: 24 },
    { result: '2', weight: 13 },
    { result: '5', weight: 7 },
    { result: '10', weight: 4 },
    { result: 'chance', weight: 2 },
    { result: '2rolls', weight: 2 },
    { result: '4rolls', weight: 2 }
  ];
  
  const wheelSegments = [];
  probabilities.forEach(({ result, weight }) => {
    for (let i = 0; i < weight; i++) {
      wheelSegments.push(result);
    }
  });
  
  // Fill remaining slots
  for (let i = allSegmentTypes.length; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * wheelSegments.length);
    results.push(wheelSegments[randomIndex]);
  }
  
  // Shuffle the entire array to randomize order
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }
  
  return results;
}

// Convert user-provided results (latest to oldest) to proper format
const USER_RESULTS_LATEST_TO_OLDEST = [
  '2rolls', '5', '2', '2rolls', '5', '2', '1', '1', '1', '1', '5', 'chance', '1', 
  'chance', '2', '10', '10', '1', '5', '2', '2', '5', '1', '2', '5', '1', '1', '5', 
  '2', '1', '10', '5', '2', '2rolls', '2', '2', '10', '1', '1', '1', '1', '1', '5', 
  '2rolls', '10', '1', '1', 'chance', '2', '10', '1', '2', '2', '2', '10', '1', 
  '4rolls', '1', '2', '5', '1', '5'
];

// Reverse to get oldest to latest (chronological order for simulation)
const USER_RESULTS = USER_RESULTS_LATEST_TO_OLDEST.reverse();

console.log('🎯 RUNNING CUSTOM TEST WITH PROVIDED RESULTS');
console.log('===========================================');
console.log(`Starting Capital: ₱9,000`);
console.log(`Base Bet: ₱25`);
console.log(`Profit Target: ₱250`);
console.log(`Total Results: ${USER_RESULTS.length}\n`);

console.log('Results (oldest to latest):', USER_RESULTS.join(', '));
console.log('\nResults Distribution:');
['1', '2', '5', '10', 'chance', '2rolls', '4rolls'].forEach(result => {
  const count = USER_RESULTS.filter(r => r === result).length;
  const percentage = ((count / USER_RESULTS.length) * 100).toFixed(1);
  console.log(`${result}: ${count} (${percentage}%)`);
});

console.log('\n' + '='.repeat(50) + '\n');

// Run simulation with custom parameters and provided results
const simulator = new HotZoneL3Simulator({
  startingCapital: 9000,
  baseBet: 25,
  profitTarget: 250
});

const results = simulator.runSimulation(USER_RESULTS);

module.exports = { HotZoneL3Simulator };