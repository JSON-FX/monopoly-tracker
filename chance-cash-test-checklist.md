# Manual Regression Test Checklist - Chance Cash Feature

## Test Session Details
- **Test Date**: [Current Date]
- **Tester**: AI Agent
- **Test Environment**: Local Development (React App)

## Pre-Test Setup
- [x] Application is running (npm start)
- [x] Browser is open at http://localhost:3000
- [x] LocalStorage is cleared (fresh state)

## Test Steps

### Step 1: Start Session with Capital and Base Bet
- [ ] Click "💰 Start Session" button
- [ ] Enter Starting Capital: **1000**
- [ ] Enter Base Bet Amount: **10**
- [ ] Click "Start Session"
- [ ] Verify session is active (shows current capital, next bet, etc.)

### Step 2: Enter Results Until a Chance
- [ ] Click result buttons to add results (e.g., 2, 5, 10, 2)
- [ ] Click "CHANCE" button
- [ ] Verify Chance modal appears with two options:
  - 🎯 Multiplier option
  - 💰 Cash Out option

### Step 3: Choose Cash with Amount 960
- [ ] In the Chance modal, select "Cash Out" option
- [ ] Enter cash amount: **960**
- [ ] Click "Confirm Cash Out"
- [ ] Verify modal closes

### Step 4: Verify Results
- [ ] **Current Capital Check**:
  - Previous capital + 960 = New capital
  - Example: If capital was 1000, new capital should be 1960
  
- [ ] **Consecutive Losses Reset Check**:
  - Check that consecutive losses shows 0
  - Check that currentBetAmount is reset to baseBet (10)
  
- [ ] **Betting History Panel Check** (Analytics tab):
  - Navigate to Analytics tab
  - Scroll to Betting History section
  - Verify new entry shows:
    - Type: "CASH" 
    - Amount: "+₱960.00"
    - Label: "🎲 Chance Cash Out"

### Step 5: Refresh Page - State Persistence Check
- [ ] Press F5 or refresh browser
- [ ] Verify all state persists correctly:
  - Current capital remains at increased amount
  - Session remains active
  - Betting history still shows the Chance Cash entry
  - Results array includes "chance" entry

## Expected Behavior Summary

1. **Capital Update**: Immediate increase by cash amount (960)
2. **Martingale Reset**: 
   - Consecutive losses → 0
   - Current bet amount → base bet (10)
3. **Betting History**: New entry with:
   - `chanceType: 'cash'`
   - `cashAmount: 960`
   - Shows as "Chance Cash: ₱960.00" in UI
4. **State Persistence**: All changes persist after page refresh via localStorage

## Test Results

### Actual Results
- [ ] Capital increased correctly
- [ ] Martingale reset correctly
- [ ] Betting history entry created correctly
- [ ] State persisted after refresh

### Pass/Fail Status
- [ ] PASS
- [ ] FAIL (with notes)

### Notes
[Add any observations or issues encountered during testing]
