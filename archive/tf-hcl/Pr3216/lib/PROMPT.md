ROLE: You are a senior Terraform engineer.

CONTEXT:
A healthcare startup (≈2,000 patients/day) needs a secure, HIPAA-aligned relational database stack on AWS with encryption in transit & at rest, basic monitoring, and cost efficiency. Keep the design simple, private, and production-ready.

TOOLING:
Generate Terraform (HCL) for AWS us-east-1.

HARD CONSTRAINTS (ADJUST YOUR OUTPUT ACCORDINGLY):

Do not include any README or examples.

Assume providers.tf already exists and is correct; do not modify or recreate it.

Create all resources in a single file named main.tf.

Provide a variables.tf file for inputs.

Add clear inline comments explaining key resources and security decisions.

REQUIREMENTS (BUILD EXACTLY THIS):

Networking

Use (or create if not provided) a VPC in us-east-1 with two private subnets: 10.0.10.0/24 (us-east-1a) and 10.0.20.0/24 (us-east-1b).

Create an RDS DB Subnet Group spanning these private subnets. No public access to the DB.

Database

Amazon RDS MySQL, class db.t3.micro, single-AZ default (variable to enable Multi-AZ).

Storage: gp3, configurable size (e.g., 20–50 GB via variable), storage_encrypted = true with a customer-managed KMS key (CMK).

IAM Database Authentication enabled.

DB parameter group enforcing TLS by setting require_secure_transport=ON (MySQL 8).

Create an initial DB name and master username (password via sensitive variable or external secret reference—do not hardcode).

Security

DB Security Group: allow MySQL (3306) only from 10.0.0.0/16; no other inbound.

Egress: keep minimal; allow required AWS endpoints as needed (document in comments).

Not publicly accessible.

IAM least-privilege roles/policies for KMS usage, CloudWatch logs/metrics, and snapshot export to S3.

Backup & S3

Enable automated RDS backups (retention window configurable; default 7 days).

Provision a private S3 bucket (block public access + SSE-KMS or SSE-S3), intended for RDS snapshot export.

Provide IAM role/policy and KMS grants to allow RDS snapshot export to S3.

Monitoring

CloudWatch alarms: CPUUtilization high, FreeStorageSpace low, DatabaseConnections high, and instance status check failures.

Performance Insights enabled by default (7-day retention) with KMS (make togglable via variable).

Enhanced Monitoring optional via variable (default off).

Outputs

DB endpoint, port, DB name, subnet group name, SG ID, KMS key ARN, S3 bucket name, and CloudWatch alarm ARNs.

Tagging

Apply consistent tags (map variable) on every resource: Project, Environment, Owner, DataClassification=PHI, Compliance=HIPAA-eligible.

ASSUMPTIONS & DEFAULTS:

AZs: us-east-1a and us-east-1b.

MySQL 8.x engine; engine_version as a variable with a sane default.

Backups: retention 7 days, with off-hours preferred for maintenance/backup windows.

TLS: enforced via parameter group (require_secure_transport=ON) and comments noting clients must use the RDS CA bundle.

BEST PRACTICES (MANDATORY):

Security-first: private subnets only; no public DB; SG locked to 10.0.0.0/16; S3 public access blocked; KMS CMK with least-privilege grants; no plaintext secrets.

Compliance-aligned: encryption at rest & in transit; metrics/alarms; IAM DB auth; avoid claiming compliance—just implement HIPAA-eligible controls.

Cost-aware: db.t3.micro, single-AZ default, optional toggles for cost-incurring features.

Idempotence & clarity: use data sources where appropriate; no hardcoded dynamic IDs; clear inline comments; terraform fmt-ready.

DELIVERABLES (OUTPUT EXACTLY THESE TWO FILES):

variables.tf – Inputs for: VPC ID (optional), private subnet IDs (optional), tags map, DB settings (engine_version, class, storage, retention), booleans for multi_az, performance_insights_enabled, enhanced_monitoring_enabled, sensitive admin password, and toggles/IDs for KMS and S3 where applicable.

main.tf – All resources: conditional VPC + private subnets (if not provided), DB subnet group, KMS CMK + alias + key policy/grants, DB SG with port 3306 from 10.0.0.0/16, RDS instance with IAM auth & TLS enforcement via parameter group, S3 bucket for exports (encryption + block public), IAM role/policy for RDS snapshot export to S3 + KMS permissions, CloudWatch alarms, optional Enhanced Monitoring role, Performance Insights wiring, and outputs.

OUTPUT FORMAT (IMPORTANT):

Provide each file in a separate fenced code block with its filename as the first line in a comment, e.g.:

# variables.tf
...

# main.tf
...


VALIDATION CHECKS (IMPLEMENT AS COMMENTS AND Terraform CONFIG WHERE RELEVANT):

DB is not publicly accessible and deployed only to private subnets.

SG restricts 3306 to 10.0.0.0/16.

require_secure_transport=ON is set so non-TLS connections fail.

Outputs expose the DB endpoint, bucket name, KMS key, and alarm ARNs.

IAM statements allow RDS snapshot export → S3 with KMS permissions.

Please generate the complete Terraform implementation now, following the above structure and constraints, with clear inline comments inside the code.