## Chance Segment Logic Specification (Corrected)

#### **General Summary**

This document details the business logic for handling 'Chance' segment outcomes in the Monopoly Live Betting Assistant when in 'Bet on 1' Mode.

When a 'Chance' result occurs on a live bet, a modal appears for the user to select the outcome: **Cash Prize** or **Multiplier**.

* **Cash Prize:** The user inputs the prize amount, which is added directly to the session's Profit/Loss. The event is then complete.
* **Multiplier:** The user inputs the multiplier value. The outcome is then determined by the *very next spin*. A '1' results in a win calculated with the multiplier, while any other result is a loss of the original bet.
* **Stacking:** The logic also defines how to handle consecutive 'Chance' results, including adding multipliers together and a specific formula for a multiplier followed by a cash prize.

---

#### **Detailed Explanation**

**Pre-condition:** The user's status must be "Bet" when the 'Chance' result occurs for this logic to apply.

**Step 1: User Input**
A modal appears in the application, prompting the user to select 'Cash' or 'Multiplier' and input the corresponding value.

**Scenario 1: 'Cash Prize' Outcome**
The event is resolved immediately upon user input.

* **Formula:** `P/L = + (Cash Prize Amount)`
* **Example:** If the user inputs a $50 cash prize, the P/L for that spin is +$50.

**Scenario 2: 'Multiplier' Outcome (Single Event)**
The application enters a "waiting" state for the next spin's result. The outcome of the original bet is determined by this next spin.

* **Condition A: Next spin is '1' (WIN)**
    * **Formula:** **`P/L = (Multiplier Value * Original Bet Amount)`**
    * **Example:** The user's bet was $10. The 'Chance' outcome is a 5x Multiplier. The next spin is '1'. The P/L is `(5 * $10)` = **+$50**.

* **Condition B: Next spin is NOT '1' (LOSS)**
    * **Formula:** `P/L = - (Original Bet Amount)`
    * **Example:** The user's bet was $10. The 'Chance' outcome is a 5x Multiplier. The next spin is '2'. The P/L is **-$10**.

**Scenario 3: Stacking Logic**
This applies when a 'Chance' result follows a pending 'Multiplier'.

* **Case A: Multiplier + Multiplier**
    * **Rule:** Multipliers are **added** together.
    * **Example:** A 3x Multiplier is pending. The next spin is another 'Chance' with a 5x Multiplier. The new pending multiplier for the next spin is now **8x**. The logic from Scenario 2 still applies to the final outcome.

* **Case B: Multiplier + Cash**
    * **Rule:** The event resolves immediately. The P/L is calculated based on the pending multiplier, the cash prize, and the original bet.
    * **Formula:** **`P/L = (Original Bet Amount * Multiplier Value) + Cash Prize Amount`**
    * **Example:** A user's bet was $10 and a 3x Multiplier is pending. The next spin is 'Chance' with a $50 Cash Prize. The P/L is `($10 * 3) + $50` = **+$80**.

***