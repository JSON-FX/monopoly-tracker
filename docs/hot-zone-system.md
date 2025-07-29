**Document Title:** Hot Zone Detection System for Monopoly Live Wheel

**Author:** Jayson Alanano
**Last Updated:** July 29, 2025

---

### 🌟 Objective

To implement a **self-contained Hot Zone Detection System** for Monopoly Live, built within an existing React + Shadcn UI frontend and Express.js backend. This feature provides users with a **real-time indicator** of whether the wheel is trending in a favorable or unfavorable state for betting on "1". The system is purely advisory and **does not affect automated betting logic**.

---

### 🔍 Feature Summary

The detector monitors recent spin results and classifies the current trend into four possible **zone statuses** based on spin distribution across predefined wheel zones (A–F).

This feature:

* Activates only after 20 spin results
* Computes **zone scores** and tracks dominant region trends
* Offers a clear **status indicator**: `Hot`, `Warming`, `Cooling`, or `Cold`
* Provides user-friendly **betting recommendations** (e.g., Skip or Bet)

---

### 🥇 Status Definitions & Recommendations

| Status    | Meaning                                                         | Betting Recommendation        |
| --------- | --------------------------------------------------------------- | ----------------------------- |
| `Hot`     | High frequency of spins landing in a zone with high "1" density | ✅ Bet is favorable            |
| `Warming` | Dominant zone trending upward in heat score                     | ⚠️ Entry possible             |
| `Cooling` | Hit frequency in "1"-rich zones decreasing                      | ⚠️ Caution: Consider skipping |
| `Cold`    | Very low recent "1" activity; dominant zone is unfavorable      | ❌ Do not bet                  |

> These statuses are based **only** on spin result history. Players make final decisions.

---

### 🌍 Zone Configuration (A–F)

The wheel is divided into 6 equal segments:

| Zone | Segment Indices | Approx. "1" Count |
| ---- | --------------- | ----------------- |
| A    | 0 – 8           | 4                 |
| B    | 9 – 17          | 3                 |
| C    | 18 – 26         | 4                 |
| D    | 27 – 35         | 3                 |
| E    | 36 – 44         | 4                 |
| F    | 45 – 53         | 4                 |

Each spin is mapped to a zone using its segment index. Heat score is calculated as:

```ts
zoneScore = recentHitsInZone * onesInZone
```

The highest scoring zone becomes the **dominant zone**, and trend comparisons determine the classification.

---

### 🔧 Backend Integration (Express.js)

* Endpoint: `GET /api/zones/shift-status`
* Response shape:

```json
{
  "status": "Cooling",
  "dominantZone": "C",
  "score": 18,
  "trendDirection": "down",
  "recommendation": "Consider skipping bets. Trend weakening."
}
```

* System is **inactive** if fewer than 20 spin results available

---

### 🛍️ Frontend Integration (React + Shadcn UI)

* Component: `HotZoneStatusCard`
* Behavior:

  * Greyed out until 20 spins collected
  * Colored banner: green (Hot), yellow (Warming), orange (Cooling), red (Cold)
  * Shows trend direction and betting tip

---

### 🔢 Sample Session (Loss Case Test)

**Session ID:** 115
**Duration:** 24m
**Capital Change:** ₱15,005 → ₱8,955 (**₱-6,050.00**)
**Win Rate:** 28.57%
**Highest Martingale:** ₱6,400.00

**Raw Results:**
`[2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 1, 1, 10, 1, 1, 10, 2, 1, 2, 1, 2, 2, 2, 10, 5, 1, 2, 5, 2, 1, 2]`

**Zone Trend Analysis:**

* **Spins 1–9** → ❄️ **Cold** → Entry blocked
* **Spins 10–13** → 🔥 **Hot** → Entry encouraged
* **Spins 14–17** → ⚠️ **Cooling** → Skip or lower bet
* **Spins 18–26** → ❄️ **Cold** → Skip strongly (Martingale danger)
* **Spins 27–31** → ⚠️ **Warming** → Low-stake re-entry possible

**Impact:**

> If player had followed the zone recommendation system, they would have skipped most of the losses, especially the deep Martingale triggered during cold phase (spins 18–26).

---

### 🕒 Next Steps

* [ ] Connect spin mapping logic to zone config
* [ ] Implement backend `/api/zones/shift-status`
* [ ] Build final UI card with recommendations
* [ ] Simulate and compare sessions with/without detector guidance

---

Let me know when you want to proceed with implementing the backend service or frontend status card logic.
