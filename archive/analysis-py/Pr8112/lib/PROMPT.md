Problem Context:

A fintech startup needs an automated, repeatable S3 security compliance analysis tool written in Python.
The tool must detect misconfigurations, generate JSON and HTML reports, and print human-readable summaries grouped by severity.
The tool will run in us-east-1, using Python 3.12, Boto3, and Moto + pytest for testing.

You must produce only two files + one HTML/Jinja2 template block, following the exact structure described below.

Core Implementation Requirements:
1. analyze_s3_security.py — Main Script

Implement a fully functional S3 security scanner with:

A. Console Output

Print results grouped by severity:

CRITICAL

HIGH

MEDIUM

LOW

Within each severity group, group by issue type.

B. Findings JSON File — s3_security_audit.json

For every finding, include the following fields exactly:

bucket_name

bucket_arn

issue_type (short string code, e.g., NO_ENCRYPTION, PUBLIC_ACCESS)

severity (CRITICAL/HIGH/MEDIUM/LOW)

compliance_frameworks → always: ["SOC2", "GDPR"]

current_config

required_config

remediation_steps

Also generate a top-level compliance_summary object containing:

number of compliant buckets

number of non-compliant buckets

summary counts per framework (SOC2, GDPR)

how many passed

how many failed

C. HTML Report — s3_audit_report.html

Fully styled HTML

Include charts/graphs (Plotly or Jinja2 + CSS, your choice)

Show:

Severity distribution

Framework compliance

Bucket-level table

Human readable summary + compliance status

D. Detection Logic

Check each bucket for:

Missing server-side encryption

Public access (ACL or bucket policy)

Versioning disabled

Missing mandatory tags:

Environment

Owner

CostCenter

E. Bucket Exclusions

Do not analyze buckets whose names contain (case-insensitive):

test

temp

new

excluded

F. AWS Region

All scanning and API calls target us-east-1

2. test_analyze_s3_security.py — Moto Test Suite

Write pytest tests that:

Use Moto to mock AWS S3
Create 100+ buckets with realistic variations:

Some excluded by naming rules

Some missing tags

Some missing encryption

Some public

Some non-public and compliant

Some partially compliant

Some violating multiple rules

Validate:

Correct finding severities

Correct exclusion of test/temp/new/excluded buckets

Correct JSON structure and required fields

Correct compliance_summary numbers

HTML file is generated

HTML contains required sections (severity distribution, table, etc.)

3. HTML Template (Inline or separate code block)

Provide the full Jinja2 or HTML template used to generate s3_audit_report.html.

Template must include:

Styled layout (CSS)

Graphs (Plotly or custom SVG/JS)

Summary table

Visual severity distribution

Full compliance breakdown

Constraints (Mandatory)

NO requirements may be changed or omitted.

Keep all JSON keys EXACT as defined.

Bucket exclusions must be enforced strictly.

Findings must include ["SOC2", "GDPR"] always.

Python version must be 3.12 compatible.

Tests must run offline with Moto.

Provide exactly two Python files + template in the output.

Expected Output Format — EXACTLY THIS ORDER

When you respond, you must output exactly the following blocks:

analyze_s3_security.py (Python code block)

test_analyze_s3_security.py (Python code block)

HTML/Jinja2 Template Block (code block)

Do not output anything else.
No extra commentary.
No missing sections.
No renaming of files.

Your Task

Generate the full implementation, meeting every requirement above, without omission or modification.
The deliverables must be complete, runnable, and match the structure exactly.