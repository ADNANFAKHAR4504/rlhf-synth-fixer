we’re working with a financial services company that runs a high-frequency trading platform, and uptime isn’t just a nice-to-have — it’s everything. The business has taken real hits from downtime because their current single-AZ RDS PostgreSQL setup keeps failing during market hours. The goal is to rebuild this entire data layer for high availability and automated disaster recovery, across multiple regions.

We’ll do this using Terraform (HCL) with AWS Provider v5.x and Terraform 1.5+ — fully production-grade and automated end-to-end.

The environment setup

We’re going multi-region —
us-east-1 will be the primary,
and us-west-2 will act as the disaster recovery (DR) region.

Each region gets its own isolated VPC, so there’s no CIDR overlap or routing confusion later on.

Primary (us-east-1):

VPC CIDR: 10.0.0.0/16

Public Subnets: 10.0.1.0/24, 10.0.2.0/24

Private Subnets: 10.0.3.0/24, 10.0.4.0/24

Internet Gateway for external access

NAT Gateway in one public subnet for private resources

Clean route tables for both public and private segments

DR (us-west-2):

VPC CIDR: 10.1.0.0/16

Same subnet layout, own IGW + NAT

Mirrored route setup so the DR region feels like a true extension, not an afterthought

VPC peering will connect both regions for any operational sync needs. Every resource name should carry a suffix -rdha for clarity and uniqueness.

Database layer

Now for the core: the PostgreSQL database.
We’ll deploy Amazon RDS for PostgreSQL v17.4, fully Multi-AZ with automated failover.
Everything here needs to be encrypted — both at rest and in transit.

We’ll also generate a random master password (16 characters, alphanumeric only) via Terraform, and store it securely.

The database subnet group will span only private subnets, ensuring no public exposure.
All connections must use SSL, enforced at the parameter group level.

We’ll configure:

Multi-AZ primary RDS instance (for high availability within region)

Read replicas spread across at least two AZs (for read scaling + quick failover)

A cross-region read replica in us-west-2 for full disaster recovery

Both source and replica must be encrypted with the same KMS key (or a replica of it in the DR region)

Backup, monitoring, and operations

Backups should be automated with 7-day retention and point-in-time recovery enabled.
We’ll schedule the backup window during off-peak hours (2–4 AM UTC) to avoid performance hits.

Monitoring should be proactive:

Enhanced monitoring enabled at 60-second granularity

Performance Insights turned on for deeper query-level visibility

CloudWatch alarms for critical metrics:

CPU utilization

Active connections

Replica lag

Parameter groups should lock in sensible defaults — like connection limits and query timeout values that prevent runaway sessions from taking down the DB.

Security and IAM

We’ll create security groups to allow database access only from the application layer (no public access).
Encryption will rely on AWS-managed KMS keys, and all data at rest must use them.

IAM roles will be configured for Terraform execution and RDS management, assuming the AWS CLI is already authenticated with the proper permissions.

What success looks like

When this is deployed, we should have:

A primary RDS PostgreSQL instance in us-east-1 running Multi-AZ with automatic failover

Read replicas distributed across availability zones

A cross-region replica in us-west-2 for disaster recovery

Automated backups, enhanced monitoring, and point-in-time recovery

Enforced SSL-only connections and encrypted storage

Clean, modular Terraform code that could be extended or reused in the future

The end result:
A fault-tolerant, self-healing RDS architecture that can take an AZ outage or even a full regional failure — and keep the trading system online without missing a heartbeat.
