# ManteCurated Live

A real-time Hive blockchain curation dashboard built with Next.js 14, TypeScript, and Recharts.

## Features

- **Voting Power Gauge**: Real-time VP monitoring with current and max vote value display
- **Account Stats**: HP, RC, reputation, and balance tracking
- **Vote History Feed**: Recent votes with estimated values and VP at time of vote
- **Top Authors Chart**: Bar chart showing most voted authors
- **VP Over Time**: Line chart tracking voting power changes across vote history
- **Multi-Node Failover**: Automatic RPC node switching for reliability

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Recharts** (data visualization)
- **@hiveio/dhive** (Hive blockchain client)

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
mantecurated-live/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main dashboard page
│   └── globals.css      # Global styles
├── components/
│   ├── VotingPowerGauge.tsx     # VP circular gauge
│   ├── AccountStatsCard.tsx     # Account stats display
│   ├── RecentVotesFeed.tsx      # Vote history feed
│   ├── TopAuthorsChart.tsx      # Bar chart component
│   └── VPOverTimeChart.tsx      # Line chart component
├── lib/
│   ├── hive.ts          # dhive client & API calls
│   └── votemath.ts      # VP & vote value calculations
└── types/
    └── hive.ts          # TypeScript interfaces
```

## API Patterns

All API calls follow patterns from the [hive-master-skill](https://github.com/Mantequilla-Soft/hive-master-skill):

- **Client Failover**: Multiple RPC nodes with automatic switching
- **Parallel Fetching**: Account, global props, reward fund, and price data fetched concurrently
- **VP Calculation**: 20% regeneration per day (5 days full)
- **Vote Value Formula**: `rshares × reward_balance ÷ recent_claims × hive_price`

## Configuration

Default account: `mantecurated`

To change default, edit `app/page.tsx`:

```typescript
const [accountName, setAccountName] = useState('your-account');
```

## RPC Nodes

Configured failover nodes in `lib/hive.ts`:

- api.hive.blog
- api.deathwing.me
- hive-api.arcange.eu
- api.openhive.network

## License

MIT
