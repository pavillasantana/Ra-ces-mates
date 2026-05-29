# ADR 0001: Postal API via Backend BFF

## Status
Accepted

## Date
2026-05-27

## Context
The current postal/address validation flow is implemented directly in the frontend page (`src/pages/Addresses.jsx`) using direct requests to external public APIs. This creates tight coupling between UI and external provider behavior, limits observability, and makes retries/timeouts/fallbacks inconsistent.

## Decision
Adopt a Backend-for-Frontend approach for postal integration:
- Frontend calls internal backend endpoints for postal lookup and address validation.
- Backend becomes responsible for provider integration, normalization, timeouts, retries, and fallback policy.
- Frontend will consume a stable contract independent from provider response variations.

## Consequences
### Positive
- Better resilience and centralized error handling.
- Easier monitoring, logging, and SLA control.
- Reduced UI complexity and lower coupling.

### Negative
- Additional backend implementation and maintenance effort.
- Slight increase in end-to-end latency due to one extra hop.

## Implementation Notes
- Introduce dedicated postal routes and service layer in backend.
- Define request/response contract before frontend migration.
- Keep fallback mode allowing manual address save when external provider is unavailable.
