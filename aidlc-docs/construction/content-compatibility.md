# Wiki and announcements compatibility slice

## Source baseline

- UI source: `FiinGroup.Jarvis/pages/settings/wiki.html` and
  `FiinGroup.Jarvis/pages/settings/announcements.html`.
- Legacy list behavior: `pages/settings/wiki.js` and
  `pages/settings/announcements.js`.
- Legacy list endpoints:
  - `GET /api/v1/mt_wikis`
  - `GET /api/v1/mt_announcements`

## Target behavior

- React routes:
  - `/wiki`
  - `/announcements`
- Legacy mode uses the existing authenticated adapter and preserves the source
  filter names and list semantics.
- Target TFS mode shows an explicit unavailable boundary because no approved
  `/api/v2` content contract or target content store exists yet.
- Both routes are read-only in this slice. Create, edit, delete and export are
  not enabled until target permission and data contracts are approved.
- Dynamic content is rendered through React text nodes; no `innerHTML` is used.

## Standalone documents boundary

- Source UI: `FiinGroup.Jarvis/pages/documents/documents.html`.
- The source page is explicitly marked `[WIP]` and only displays a development
  notice; it has no approved list, detail, mutation or download contract.
- Target route `/documents` preserves that source behavior and does not create
  a new data model, endpoint or CRUD flow.
- Chatbot documents are a separate high-risk Chatbot unit and are not included
  in this route.

## Acceptance checks

- Legacy mode loads each list after authentication.
- Category, level/priority and full-text search filters trigger a new list request;
  full-text search is debounced.
- Empty, loading and API error states are visible.
- Selecting a title opens a detail modal without a mutation request.
- Target TFS mode does not call legacy content endpoints and shows the boundary.
- `FiinGroup.Jarvis` remains unchanged.
- `/documents` shows the same WIP boundary as the source and makes no API call.
