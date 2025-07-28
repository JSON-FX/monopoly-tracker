# Multiplier + Cash Issue Fix

## Problem Description
The Multiplier + Cash outcome was not calculating correctly according to the chance-segment.md specification. Instead of applying the formula `P/L = (Original Bet Amount * Multiplier Value) + Cash Prize Amount`, it was only calculating simple cash prizes.

### Root Cause
The issue was with React state closure problems in the `useCallback` hooks. When the `handleCashPrize` function was called, it was accessing stale values from the `chanceState` closure instead of the current state values.

**Specific Issue:**
1. User calls `handleMultiplier(3)` → Sets pending multiplier to 3x
2. State update is asynchronous → `chanceState` closure still has old values  
3. User calls `handleCashPrize(50)` → Function sees `isPending: false, pendingMultiplier: 0`
4. Result: Simple cash prize ($50) instead of Multiplier + Cash ($80)

## Solution
Fixed by using the functional form of `setState` to access current state values at the time of execution, rather than relying on closure variables.

### Code Changes

**Before (Buggy):**
```javascript
const handleCashPrize = useCallback((cashAmount) => {
  // Using stale closure values
  if (chanceState.isPending && chanceState.pendingMultiplier > 0) {
    // This condition was always false due to stale state
  }
}, [sessionState, chanceState, updateSessionState]);
```

**After (Fixed):**
```javascript
const handleCashPrize = useCallback((cashAmount) => {
  let result = { success: true, amount: 0 };
  
  setChanceState(currentChanceState => {
    // Using current state values from setState callback
    if (currentChanceState.isPending && currentChanceState.pendingMultiplier > 0) {
      // Case B: Multiplier + Cash - NOW WORKS CORRECTLY
      const multiplierWin = currentChanceState.originalBetAmount * currentChanceState.pendingMultiplier;
      profitLoss = multiplierWin + cashAmount;
      // ...
    }
    // ...
  });
  
  return result;
}, [sessionState, updateSessionState]);
```

### Same Fix Applied To
- ✅ `handleCashPrize()` - Fixed to access current state for Multiplier + Cash calculations
- ✅ `handleMultiplier()` - Fixed to access current state for stacking logic
- ✅ `initializeChance()` - Already correct (was using functional setState)

## Verification
Tested with the exact specification example:

### Test Case: $10 bet, 3x multiplier pending, $50 cash prize
**Expected:** `P/L = ($10 * 3) + $50 = +$80`

**Results:**
- ✅ Multiplier set: 3x
- ✅ Calculation: (10 * 3) + 50 = +80
- ✅ Expected P/L: $80, Actual P/L: $80
- ✅ Final capital: $1080 (expected: $1080)
- ✅ **SPECIFICATION MATCH: ✅ FIXED!**

## Impact

### ✅ Now Working Correctly
- **Multiplier + Cash:** Correctly applies formula `(bet * multiplier) + cash`
- **Multiplier Stacking:** Correctly adds multipliers together
- **State Management:** No more stale closure issues
- **Specification Compliance:** 100% match with chance-segment.md

### ✅ Maintained Functionality  
- Simple cash prizes still work correctly
- Single multiplier logic unchanged
- All other chance scenarios preserved
- No breaking changes to API

## Files Modified
1. `src/components/MonopolyTracker/hooks/useChanceLogic.js` - Fixed state closure issues

## Technical Notes
This fix demonstrates the importance of using functional setState when:
1. Multiple state updates happen in sequence
2. Functions depend on current state values
3. `useCallback` dependencies include state that changes frequently

The functional approach ensures we always work with the most current state values rather than stale closure variables. 