The goal here is to make the setup look and feel like it was handcrafted — solid, secure, and production-ready — but still human-readable.

Networking foundation-
We’ll start from scratch in both regions so each has a fully isolated VPC.
That means no overlapping CIDRs, clear routing, and easy-to-debug traffic flows.

In us-east-1 (Primary Region), the VPC will use CIDR 10.0.0.0/16.
Inside that, we’ll carve out:
two public subnets (10.0.1.0/24, 10.0.2.0/24)
two private subnets (10.0.3.0/24, 10.0.4.0/24)

We’ll attach an Internet Gateway, and drop a NAT Gateway inside one of the public subnets so private resources can still reach out when they need to.
There’ll be separate route tables for public and private networks, with tagging kept clean and consistent.

Now, in us-west-2 (Disaster Recovery Region), we’ll do the same pattern:
VPC CIDR 10.1.0.0/16, same subnet layout, its own IGW and NAT Gateway, and mirrored routing rules.
Basically, the DR side should feel like a reflection of the primary, not an afterthought.

Core Terraform objectives-

This configuration needs to handle migrating a production Aurora PostgreSQL cluster from us-east-1 to eu-west-1 using Aurora Global Database.
We’ll set up automated failover, near-zero downtime, and a clean rollback path.

The Terraform setup should:

Build an Aurora Global Database (latest version) with us-east-1 as primary and eu-west-1 as secondary.
Mirror instance specs in both regions.
Use random master password of character size 16 with alphabets and numbers only.
Configure AWS DMS for continuous replication during the migration window.
Use Route53 health checks and weighted routing for database endpoints. Create own route53 hosted zone and use the dns  as - rdsmigration.com
Set up S3 cross-region replication for backups and logs.
Create VPC peering between the two regions with correct SG rules.
Enable Aurora backtrack and PITR (point-in-time recovery) in both.
Deploy CloudWatch alarms for replication lag and cluster health.
Build Lambda functions that handle automated failover orchestration — and here’s the key part:
no ZIP files. The Lambda code will live inline inside the tap_stack.tf file itself.
Just a simple inline code block — no file packaging required.

Everything should be fully modular, easy to roll back, and meet RPO < 1s and RTO < 5min.

Naming and consistency-

Every resource name should follow this consistent pattern:
{environment}-{service}-{resource_type}-rdsm

Use rdsm (lowercase) as the fixed 4-character suffix across all resources to avoid “already exists” conflicts in the stack.
Keep names clean, lowercase, and predictable.

Encryption and keys

For RDS encryption, use the same AWS managed KMS key across both regions so we don’t hit the unsupported error AWS sometimes throws when encryption keys differ between primary and secondary Aurora clusters.

Additional context

This setup belongs to a financial services company that’s migrating production workloads (handling ~50k TPS with a 99.99% SLA).
The network uses transit gateways and Direct Connect in both regions.
Terraform state needs to be in an S3 bucket with versioning and cross-region replication enabled for safety.

During migration, replication lag must stay under 1 second,
and rollback must be instant without any data loss.
Total migration window should be capped at 4 hours, including validation.

Final note

So, to sum it up — this prompt is meant to produce a Terraform configuration single tap_stack.tf that can:
build networking foundations in two regions,
set up Aurora Global Database with near-zero downtime,
handle DMS replication, S3 replication, and Route53 routing,
use a shared KMS key for encryption,
and include inline Lambda code for failover handling (no zip files involved).
Expected Outputs
for all the resources being created in the tap_stack.tf.
