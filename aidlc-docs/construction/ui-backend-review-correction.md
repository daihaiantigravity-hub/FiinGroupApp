# UI and backend correction checkpoint

## Source boundary

`D:\DEV\FiinGroup.Jarvis` remains the trusted source for layout, labels,
navigation structure, permission form codes and TFS mapping behavior. This
checkpoint changes only `FiinGroupApp`.

## UI decisions

- The target dashboard uses the source management-dashboard shape: four stat
  cards, recent activity and announcements/document widgets.
- Target-only platform diagnostics, migration cards and permission-count cards
  are not part of the Jarvis dashboard and must not be rendered as dashboard
  business UI.
- The shell uses the Jarvis identity and source favicon. Only migrated routes
  are exposed; routes without an approved target contract remain absent.
- The shell parity correction follows the source layout contract: expanded
  260px-class sidebar, source menu groups and tree submenu, 42px Edge-style
  tab/top bar, source search/notification/settings affordances, and full-width
  content starting immediately after the sidebar. The target must not center
  the project screen into a narrower replacement layout.
- Source menu labels and ordering are preserved. Items without an approved
  target route remain visible as non-navigable placeholders so the navigation
  shape can be compared without implying that their business logic has been
  migrated.
- Interaction parity includes source-like hover expansion, click expansion,
  collapsed-sidebar behavior, tree-line submenu cues, dedicated content
  scrolling, scrollbar hover state, tab close behavior and keyboard-visible
  focus states. These are presentation/navigation behaviors only and do not
  create new business capabilities.
- Dashboard is not a sidebar menu item in the source shell; it is the pinned,
  non-closable tab in the top tab list. Open target routes are added to a
  per-user browser tab list, restored from local storage, and remain available
  when the user switches between routes. Closing a non-Dashboard tab removes
  only that tab and activates the adjacent tab, matching Jarvis behavior.
- TFS project/task pages remain explicitly read-only. PMBOK data and actions
  are not represented as if they were available.

## Backend decisions

- TFS read endpoints require authenticated session plus `can_access` and
  `can_view` for the corresponding Jarvis form (`pm-projects`,
  `projectmanagement` or `project-tasks`).
- TFS 4xx request errors preserve their HTTP status. Infrastructure failures
  remain 503. This keeps invalid WIQL distinguishable from unavailable TFS.
- NTLM clients do not follow redirects automatically.
- Work-item fields derived from TFS fallbacks expose `generatedFields` so the
  UI and later synchronization cannot treat inferred values as source truth.
- Swagger is development-only.

## Review gate

Do not add another migrated module until the UI source comparison, TFS
permission tests and clean backend test run are green.
