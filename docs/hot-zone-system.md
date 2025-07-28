**Document Title:** Hot Zone Detection System for Monopoly Live Wheel

**Author:** Jayson Alanano
**Last Updated:** July 25, 2025

---

### 🌟 Objective

To implement a **standalone Hot Zone Detection System** for Monopoly Live within an existing app built on **React + Shadcn UI (frontend)** and **Express.js (backend)**. This system analyzes recent spin results to detect directional shifts in wheel behavior, classifying it into Hot, Warming, Cooling, or Cold trends.

This feature is **self-contained** and does not integrate with base betting logic. It acts as a **betting recommendation indicator**, visible on the dashboard.

---

### 🔍 Overview

* Activated only **after 20 spin results are logged**
* Uses **static zone configuration (A-F)** mapped to fixed segment indices
* Continuously tracks which zones are being hit
* Calculates a "heat score" based on recent hit frequency and density of "1" segments
* Provides a classification: `Hot`, `Warming`, `Cooling`, or `Cold`

---

### 🌍 Zone Definitions (A–F)

The Monopoly Live wheel has **54 segments**, divided into 6 equal zones:

| Zone | Segment Index Range | Notes                      |
| ---- | ------------------- | -------------------------- |
| A    | 0 – 8               | Typically 3–4 "1" segments |
| B    | 9 – 17              |                            |
| C    | 18 – 26             |                            |
| D    | 27 – 35             |                            |
| E    | 36 – 44             |                            |
| F    | 45 – 53             |                            |

Each zone has a **predefined "1" density**, which represents how many of its segments are labeled with the number "1".

This map is stored as a constant:

```js
const zoneDensityMap = {
  A: 4,
  B: 3,
  C: 4,
  D: 3,
  E: 4,
  F: 4,
};
```

---

### ⚖️ Heat Score Calculation

For each zone:

```ts
zoneScore = recentHitsInZone * zoneDensityMap[zone];
```

* **recentHitsInZone** = count of spins that landed in that zone (within the window)
* **zoneDensityMap\[zone]** = number of "1" segments in that zone

The zone with the highest score is the **dominant zone**.

---

### 🔄 Shift Classification

Once 20 or more spin results are available, the system evaluates whether the dominant zone has shifted compared to the previous window:

| Classification | Criteria                                                         |
| -------------- | ---------------------------------------------------------------- |
| `Hot`          | Dominant zone has high score and high "1" density                |
| `Warming`      | Score and hit frequency increasing in a mid-to-high density zone |
| `Cooling`      | Dominant zone score is decreasing or shift to lower-density zone |
| `Cold`         | Low overall hit rate in zones with low or no "1" density         |

The trend direction (`up`, `down`, `stable`) is calculated by comparing current score vs. previous score of the same zone.

---

### 🔧 Backend (Express.js)

* Store spin history in memory or lightweight DB
* Expose REST endpoint:

```http
GET /api/zones/shift-status
```

Returns:

```json
{
  "status": "Warming",
  "dominantZone": "C",
  "score": 24,
  "trendDirection": "up"
}
```

* Activation logic: endpoint returns "inactive" if fewer than 20 spins available

---

### 🛍️ Frontend (React + Shadcn UI)

#### Component: `HotZoneStatusCard`

* **Displays current shift classification** (`Hot`, `Cooling`, etc.)
* **Shows dominant zone and score trend**
* **Greyed out** if <20 spins submitted
* Pulls data using:

```ts
const { data } = useQuery(['zoneShift'], fetchShiftStatus);
```

#### Example Output:

```tsx
<HotZoneStatusCard 
  status="Warming"
  dominantZone="C"
  score={24}
  trendDirection="up"
  isActive={true}
/>
```

---

### 📈 Benefits

* Adds an intelligent **real-time indicator** to betting environment
* Helps players **avoid cold streaks** or **capitalize on hot zones**
* Standalone and non-intrusive
* Easy to expand into pattern detection or AI-based forecasting

---

### 🕒 Next Steps

* [ ] Finalize segment-to-zone map in Express backend
* [ ] Track last 20 spin results and calculate scores
* [ ] Implement `/api/zones/shift-status`
* [ ] Build and style `HotZoneStatusCard`
* [ ] Add empty state when <20 spins available

---

Let me know when you're ready for the backend route or React component scaffolding.
