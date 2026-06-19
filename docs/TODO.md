# Long-Term TODOs

Tracked technical debt and improvement items that are not urgent but should be addressed over time.

---

## API Consistency

### Response shape inconsistency across member endpoints

`POST /api/members/me` returns the profile object directly (`res.json(profile)`), while `POST /api/members/guest` wraps it in `{ profile }`. This makes the API harder to consume consistently. Currently not a functional bug because the client handles each path separately, but any new consumer would need to know about the difference.

**Affected files:**
- `server/src/routes/members.ts` — `POST /me` vs `POST /guest` response shapes

**Suggested fix:** Standardize all member creation/mutation endpoints to return `{ profile }`.
