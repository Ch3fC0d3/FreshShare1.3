# FreshShare Production Diagnostic Environment Setup

## Required Environment Variables

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/myfrovov_freshshare
MONGODB_SSL=false  # Set to true if SSL is required

# PostgreSQL Configuration
DATABASE_URL=postgresql://myfrovov_freshshare_user@localhost:5432/myfrovov_freshshare

# Node Environment
NODE_ENV=production
```

## Usage

1. Create a `.env` file in the root directory
2. Copy the above variables and set appropriate values
3. Run the diagnostic script: `node diagnose-production.js`

## Notes

- PostgreSQL connection uses the cPanel PostgreSQL database
- Default database name: `myfrovov_freshshare`
- Default user: `myfrovov_freshshare_user`
- Host: `localhost:5432`
- SSL is disabled by default for PostgreSQL
