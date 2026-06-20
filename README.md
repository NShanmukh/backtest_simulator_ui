# Options Backtesting Dashboard

A full-stack application for backtesting an options selling strategy (PE/CE) on any index or ETF using historical market data.

## Features

- **Historical price data** via `yfinance` (GLD, SPY, GC=F, etc.)
- **Weekly PE/CE sell entries** with configurable strike offset and expiry months
- **Rolling logic** — positions are rolled when the market moves through the strike
- **Expiry & P&L tracking** — intrinsic-value based P&L at position close
- **Interactive dashboard** with Ant Design table, line/area charts, and CSV export
- **Summary statistics** — total P&L, win/loss counts, trade counts

## Tech Stack

| Layer    | Technology                               |
|----------|------------------------------------------|
| Backend  | Python · FastAPI · yfinance · pandas     |
| Frontend | React · TypeScript · Vite · Ant Design · Recharts |

## Project Structure

```
backtesting-dashboard/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── backtester.py         # Core backtesting engine
│   ├── models.py             # Pydantic request/response models
│   ├── price_fetcher.py      # yfinance wrapper
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Root component
│   │   ├── components/
│   │   │   ├── FilterBar.tsx   # Input controls & Run button
│   │   │   ├── ResultsTable.tsx# Per-day results table + CSV export
│   │   │   ├── PnLSummary.tsx  # Summary statistics card
│   │   │   └── Charts.tsx      # Price & cumulative P&L charts
│   │   ├── api/
│   │   │   └── backtest.ts   # API client for backend
│   │   └── types.ts          # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 20+
- npm 9+

### Clone the Repository

```bash
git clone https://github.com/Cognition-Partner-Workshops-mirror/backtesting-dashboard.git
cd backtesting-dashboard
```

### Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. OpenAPI docs at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The dashboard will open at `http://localhost:5173`. API calls are proxied to `http://localhost:8000` via Vite's dev server proxy.

## API Endpoints

### `GET /api/prices`

Fetch historical daily closing prices.

| Parameter | Type   | Description                |
|-----------|--------|----------------------------|
| `symbol`  | string | Ticker (e.g. GLD, SPY)     |
| `from`    | date   | Start date (YYYY-MM-DD)    |
| `to`      | date   | End date (YYYY-MM-DD)      |

### `POST /api/backtest`

Run a full backtest simulation.

```json
{
  "symbol": "GLD",
  "from_date": "2024-01-01",
  "to_date": "2025-01-01",
  "expiry_months": 3,
  "strike_offset": 5
}
```

Returns a row-per-trading-day results table with position details and P&L.

## Notes

- P&L uses **intrinsic value** (strike vs. market price) since free options premium data is not available. For realistic premium-based P&L, a paid options data provider would be needed.
- `yfinance` supports many symbols: GLD (Gold ETF), GC=F (Gold Futures), SPY (S&P 500), QQQ (Nasdaq 100), etc.
- The strike offset should be adjusted based on the price level of the chosen symbol (e.g. 5 for GLD ≈ $190, but much larger for SPY ≈ $450).

## Consolidated Prompt Log (Session)

This section captures the prompts shared in this development session for traceability.

1. create a component to view graph with net value with horizontal date and netvalue with percentage change
2. write a function to update strike price and subsequent APi calls with updated strikeprice
3. invoke this newly added function when modal popup is opened, add console log, and re-run analysis
4. currently update strike price is update every row and rendering
5. update the strikeprice of the selected row only
6. create an array for short strike price and long strike price for each row and update independently
7. button/link click to open popup breaks
8. unable scroll on grid, missing records
9. once strike price is updated for a row, all next items should have updated value
10. add logic to update short put strike price and long put strike price
11. show column for long put price similar to put price
12. on input date, find suitable put strike 1.5%-2% below close, rounded to nearest 5, with 30-45 day expiry and retries for 404
13. make input strike price optional and ask confirmation when difference is greater than +/-3%
14. calculate strike once for first row and reuse strike price for remaining rows
15. make expiry date optional and use 30-45 day logic for first row
16. update long expiry to 75-100 days with retry using up to 4 dates and +/-5% strike range
17. add calculated short/long expiry and given dates to popup for user selection
18. add a column for short/long put expiry date
19. short expiry using given date is not correct, please fix
20. always use calculated short strike price
21. add another grid as Phase 2
22. phase 1 should end at first calculated short expiry date and phase 2 should start from phase 1 last short expiry date with new strike/short-expiry/long-expiry calculation
23. proceed to add
24. can you consolidate all the prompts shared in a text and put it in README files



Interest calculator
1. pick current strike price on a given date-
2. get list of dates from given date for two years 
3. Get option price for those dates
4. Put this data in a table
5. Calculate number of days from given date to expiry date in a row
6. given strike price- calculate interest pecentage
7. calculate annual interest rate 
