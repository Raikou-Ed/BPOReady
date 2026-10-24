# BPOReady ERD update

The attached `bpo (1).pdf` ERD was reviewed and converted into `BPOReady-improved-erd.dbml`.

## Changes applied

- Replaced separate `ADMIN` and `APPLICANT` account tables with one `users` table and a `role` field.
- Added explicit foreign-key relationships for every session, answer, exercise, scenario, and report.
- Added numeric speech metrics alongside human-readable feedback.
- Added `exercise_attempts` for remedial exercise history.
- Added `call_simulation_sessions` and `call_simulation_logs` for inbound/outbound practice.
- Added `mime_type` and `duration_seconds` to recording-related entities.
- Added active flags, status fields, indexes, and uniqueness rules.
- Changed `transcipt_text` to `transcript_text`.
- Changed generic `admin_id` references to clear `created_by_user_id`, `managed_by_user_id`, or `generated_by_user_id` references.
- Kept automatic reports possible by making the report generator nullable and adding `generation_type`.

## How to apply it in Lucidchart

Import `BPOReady-improved-erd.dbml` if your Lucidchart workspace supports DBML import. Otherwise, use the tables and relationships in the file as the source for a SQL/database import. Review relationship delete behavior before generating migrations:

- Preserve applicant history when content is deleted or archived.
- Prefer soft deletion using `is_active` for paragraphs, questions, exercises, and scenarios.
- Use cascading deletion only for child records that cannot exist without their parent session.

This file is an ERD design artifact. It does not modify the existing Laravel migrations automatically.
