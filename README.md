# MotoTrack — Motorcycle Maintenance & Spare Parts Tracker

Next.js (App Router) frontend + REST API route handlers. All data lives in an in-memory
JSON store (`lib/db.js`), no external database.

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000
```

## REST API
| Entity | Endpoints |
|---|---|
| Vehicle | `GET/POST /api/vehicles` · `GET/PUT/DELETE /api/vehicles/:id` · `GET /api/vehicles/:id/summary` |
| SparePart | `GET/POST /api/spare-parts` · `GET/PUT/DELETE /api/spare-parts/:id` |
| ServiceRecord | `GET/POST /api/service-records` (`?vehicleId=` filter) · `GET/PUT/DELETE /api/service-records/:id` |

Business rules
- Creating a service record computes `totalCost` from the selected parts and deducts 1 stock per part.
- Updating a record returns the old parts to stock, deducts the new ones, and recomputes cost.
- Deleting a record restores the deducted stock.
- Out-of-stock parts are rejected (409). A vehicle with service records can't be deleted (409).

## Deploy to AWS App Runner
1. Build and push the image to ECR (`docker build -t mototrack .`).
2. Create an App Runner service from that image, port `8080`.
3. **Set min and max instances to 1.** State is held in memory, so with several instances each
   would have its own copy of the data. Data also resets whenever the service restarts or redeploys.
