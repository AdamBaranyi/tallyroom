# Case study

[Deutsch](FALLSTUDIE.md) · **English**

Tallyroom is a portfolio project: a SaaS dashboard with a client portal for small digital agencies,
live at <https://tallyroom.adambaranyi.xyz> since 11 September 2026. It was built in two stages:
the foundation from 9 to 12 September 2026, and the gaps to today's standard on 18 and 19
September. Every company, person and figure in it is made up.

This page explains the decisions — each one traced back to a user's task, not to taste — and gives
the evidence for each. What was measured appears with its number; what was not measured does not
appear.

## The three tasks

1. **The team** wants to see everything going on with a client in one place: projects, monthly
   service contracts, open requests, documents.
2. **The client** wants to see what concerns them — and none of what is discussed internally.
3. **The operator** wants to show the whole thing without handing out accounts first, and without
   one visitor seeing another visitor's data.

Everything else follows from these three sentences.

## Decisions

### A separate portal, not a filtered interface

The obvious solution would be one interface that hides fields depending on the role. It is also
the most dangerous one: hiding is a display decision, and a single forgotten spot ships internal
data to the client.

So the client portal has its own data access layer, whose queries are pinned to the workspace and
the client, and its own DTOs, which **do not contain** internal fields in the first place — a
public comment has no visibility field, because there is nothing to tell apart.

_Evidence:_ 16 integration tests for this separation alone, plus a recursive search over every
portal response that fails the moment an internal note turns up anywhere. Objects that belong to
someone else answer with **404, not 403**: a 403 gives away that the object exists.

### Sharing is an action

Documents are internal until someone shares them. No default that "usually fits", no bulk sharing
on upload. The same goes for comments: internal or public, visibly distinct in the thread.

_Evidence:_ Cross-checked in the browser — the same request shows the team an internal comment
that the client view does not know about. Files can only be reached through the authorised API:
private bucket, random object key, no public URL, no pre-signed links.

### One demo per visitor instead of screenshots

A portfolio project you can only look at in pictures proves nothing. "Start demo" creates a
workspace of your own: a full data set, five identities to switch between, 60 minutes of runtime,
after which a job clears away data, sessions and files. Two visitors never see each other.

Limits are part of it: 30 clients, 50 projects, 50 contracts and 100 requests per demo, five demos
per address per quarter of an hour, at most 50 at once. The demo does not accept your own files; a
sample document is included for the test upload.

_Evidence:_ Switching roles renews the session ID and reloads the interface completely; accounts
from other demos are rejected. There is no impersonation endpoint for ordinary accounts.

### A metric whose rule is written out

"Monthly contract value" sounds unambiguous and is not. So the rule is spelled out in
[ARCHITECTURE.md](ARCHITECTURE.md) (German): a contract counts on a given date if it is confirmed,
its start is not in the future and its end is empty or later — the end date is exclusive. Its
amount is the last price version before that date. A price change applies from its own date and
leaves past months untouched.

_Evidence:_ Tests check the **number**, not the shape of the response. A counter that showed zero
everywhere came to light exactly that way (diagnosis 7).

### Designed like a data sheet, not a carpet of cards

The direction: ink on paper, edges instead of shadows, figures in monospace, IBM Plex in three
styles. Cobalt is a **data colour** and is allowed in exactly four places — chart data, the active
navigation item, the focus ring and the fog in the start page hero. Never on a button: the main
action is set in ink. A token called `--accent` would have invited exactly that, which is why it
is called `--data-mark`.

The first draft was violet on near-black. An audit against the common patterns named it for what
it was: the AI default in better clothes. It was replaced, not defended.

![The dashboard as it is today, in dark mode: sidebar, metric band with the monthly contract value,
open requests split by who is holding them up, chart of the last six months](screenshots/dashboard-dunkel.png)

### Readability beats density

The data sheet originally had a working range of 11 to 14 px. Neatly graded — and hard for the
operator to read, especially in the header and footer. Since 12 September 2026 the rule is: **no
text below 16 px**, on any page, at any width. Style, capitals, weight and colour now carry the
difference.

That is a layout change, not a style change, and it had consequences: lists switch between table
and cards at 1024 pixels instead of 640, because the narrowest table needs 725 pixels and only 718
are available at 768. Two engine quirks surfaced along the way (diagnoses 24 and 25).

_Evidence:_ Two checks hold the rule — `bun run check:font-floor` on the source, in CI, and
`e2e/font-size.spec.ts` in the browser: every page, every dialog, six widths, plus "no word broken
mid-word" and "every form field has an id or a name".

### Motion on a budget

Three speeds (90, 160, 260 ms), two curves from IBM's motion system, exactly three moments that
move. No counting-up numbers, no scroll fades, no parallax. The fog on the start page is a custom
2.9 KB shader instead of a 155 KB library, runs only there, holds still under
`prefers-reduced-motion` and has a button to pause it (WCAG 2.2.2).

_Evidence:_ Lighthouse against the live site on 22 September 2026, two runs each: 99 for
performance and 100 in the other three categories on mobile, 100 in all four on desktop. The start
page loads 137.0 KB of JavaScript (gzip) against a 142 KB budget that CI enforces; the team view,
the portal and the legal pages load only when opened.

### Security as the default, not as a chapter

Server-side sessions instead of tokens — signing out takes effect immediately, on the server.
Argon2id, session rotation on sign-in and on role switches, CSRF protection with a session-bound
token and an origin check, rate limiting on sign-in. A Content Security Policy without
`unsafe-inline`; the production check fails on every violation and on every console error.

_Evidence:_ The zero is cross-checked: a deliberately injected inline script, an inline style and
a third-party image were all three caught. Details in [SECURITY.md](SECURITY.md) (German).

### Operations are part of the job

Deploys are triggered by hand — a green pipeline deploys nothing. The script backs up the database
**before** the migration, because migrations only run forwards. Every night at 02:30 a timer backs
up the database and the documents, with a checksum per object.

_Evidence:_ The restore drill actually ran on the server on 11 September 2026: 16 tables with the
same row counts, 18 active documents with their files, 18 objects identical checksum for checksum.
The counter-test with one document removed fails, as it should. A backup that has never been
restored is a hope.

## The second stage: what a buyer expects

After the first deploy came a review based on sources rather than gut feeling: what does someone
buying a tool like this in 2026 expect — in security, in usability, in how their data is handled —
and what is missing here? What came out of it is in this chapter. The four open items are listed,
with reasons, in [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md) (German).

### An activity log someone actually reads

The most important finding was not a missing feature. Since the first milestone, every module had
written every change to `activity_events` — and nothing read it. No endpoint, no view. A log that
nobody can read proves nothing to anybody.

Now it has a page of its own with filters by area, period and object, a history on each client,
project and request, an export as CSV and JSON, and twelve months of retention. Cells that begin
with `=`, `+`, `-` or `@` are defused in the export, so a spreadsheet does not run them as
formulas.

And it is sealed: every entry hashes its content together with the hash of the entry before it.
Anyone who edits an entry afterwards breaks the chain at exactly that point. A chain needs two
things that are easy to forget: a fixed order that does not depend on timestamps, and a lock per
workspace while appending. Without the lock, two concurrent writers read the same predecessor and
the chain forks.

_Evidence:_ An integration test edits an entry directly in the database and expects the check to
report exactly that one. Verified in production after the deploy on 19 September 2026: 80 of 80
entries sealed, then a real status change — entry 81 was appended, sealed, and the chain stayed
intact. The limit is stated in [SECURITY.md](SECURITY.md): the chain makes a single edit
detectable, but it is no substitute for write-once storage — anyone with database access can
rewrite the whole chain.

### Who is holding things up

The status says "Waiting for customer". What it does not say is since when — and that is the real
finding. A request that has been with the client for eleven days is a different thing from one
that arrived yesterday.

Every open request now names the side it is with and for how long; after a week, the line switches
to the warning colour. The dashboard splits the open requests into three figures: with us, with the
client, and the oldest one. In the portal the point of view turns around: "With us for 38 days"
becomes "With the team for 38 days".

The timestamp comes from the activity log, not from a new column. A second place for the same fact
drifts apart at the first bug.

_Evidence:_ Integration tests pass the ball to the client and back again and check that the
waiting time counts from the last status change, not from creation.

### Whoever leaves takes their data along

Two exports with two permissions. The owner downloads the whole workspace as a ZIP: every table as
JSON and CSV, the documents as files, memberships and the activity log. For a single client there
is a handover package containing exactly what that client sees in the portal — for when the
engagement ends, say.

The handover package is built on the portal's data layer, not on a query of its own. That way the
same "nothing internal" boundary applies that 16 tests already check, instead of a second one that
would still have to be tested.

_Evidence:_ An integration test opens the archive and searches for the internal marker; it must
not appear anywhere. The ZIP format is written by hand, about 120 lines with no dependency, and
the test reads it back with the real `unzip`.

### What else was added

- **A monthly report per client**, computed from current data and the log rather than stored. The
  same report appears in the team view and in the portal — two versions would be two chances to
  show different numbers. The browser handles printing.
- **A read-only role** that sees what a member sees and is turned away on the server at every
  route that changes anything. The interface does not show it buttons that would fail anyway.
- **Sortable lists** via the column headers, with `aria-sort` and the state kept in the URL. A
  made-up sort order falls back to the default instead of returning an empty list.
- **Accessibility, trust and status pages**, plus a `security.txt` following RFC 9116. The status
  page checks from the visitor's browser and says what is not monitored: there is no continuous
  monitoring from outside. A green indicator with no measurement behind it would be decoration.

## What is tested

Measured on 22 September 2026:

| Check                                 | Result                                                  |
| ------------------------------------- | ------------------------------------------------------- |
| Unit and integration tests            | 276 passing, against a real PostgreSQL                  |
| Playwright across six widths          | 426 passing, with axe in light and dark, four languages |
| WebKit and Firefox, iPhone to desktop | 430 passing                                             |
| Production check against the server   | 3 of 3, zero CSP violations, zero console errors        |
| Lighthouse, live                      | mobile 99 · 100 · 100 · 100, desktop 4 × 100            |
| Initial load of the start page        | 137.0 KB gzip against a 142 KB budget                   |

All procedures and the known gaps are in [TESTING.md](TESTING.md) (German).

## Where I was wrong

[DIAGNOSTICS.md](DIAGNOSTICS.md) (German) records 28 findings, four of them marked as a
**misdiagnosis** — cases where my first explanation was wrong. They are in there on purpose,
because a false trail costs more than the bug itself. Five that taught me something:

- **Unlayered CSS beats every utility.** `no-underline` sat in twenty places and never took effect.
  The same trap later hit how text wraps. If you set a class and see no effect, check the cascade
  layer first, not the specificity.
- **A truncated test output.** `| tail -6` showed "136 passed"; the report had 4 failures. Since
  then results are counted, not read — and a secret scan never runs through a pipe whose exit code
  nobody checks.
- **An overflow with no culprit.** In Safari's engine, the label of a select pushed the page out to
  429 pixels while the select itself was 317 wide. Content can reach beyond its box; the minimum
  width was the wrong lead.
- **A timestamp that wasn't one.** Drizzle converts timestamps only for columns it knows from the
  schema. The same timestamp coming from a SQL expression arrived as a string, even though the type
  annotation promised a `Date`. The typecheck was green, and every status change returned a 500. A
  type annotation on raw SQL is a claim, not a check — the integration tests found it, not the
  compiler.
- **Green at one width is not green.** Twice, the request table overflowed at 1024 pixels: once by
  10 pixels because the new waiting line was not allowed to wrap, once by 6 because a sort arrow
  sat in the text flow. Locally I had only checked at 1440. The six-width pipeline reported both
  before anything went live.

## What is deliberately missing

Password reset by email (not cleanly buildable without sending mail — the operator resets
passwords with a command), payments and invoices, multi-factor authentication, public
self-registration, other currencies, SAML SSO and SCIM. Each of these gaps is a decision with a
reason, not an oversight. The [README](../README.en.md#deliberately-left-out) gives the reasons
in more detail, along with what is there instead.

Four items from the review are open but not dropped: bulk selection with undo, in-app
notifications, deleting a workspace and an account, and passkeys as a second way to sign in.

## What I take away

The most expensive bugs were not the broken ones but the silent ones: a class with no effect, a
test that could never fail, a backup nobody had restored. Each of them is now covered by a check
that goes off — and that is the real difference between "works on my machine" and "works".

The second stage showed the same finding one level up. A log that every module writes and nothing
reads is not doing anything wrong. It just never proves anything to anyone.
