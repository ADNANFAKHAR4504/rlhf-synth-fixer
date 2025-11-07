need help building is a fully‑automated, multi‑region disaster recovery setup for a PostgreSQL workload using Terraform. The system belongs to a financial services team, so the uptime expectations are extremely tight (99.99%), and both RPO and failover windows matter a lot. We're working with Terraform 1.5+ and AWS provider 5.x.

The overall goal is straightforward: primary region in us-east-1, DR region in us-west-2, with seamless failover handled through Route53, Lambda automation, and RDS replication. Traffic should shift to the DR region within about two minutes after a regional failure. The DR environment shouldn't be a passive afterthought — it should be ready to promote quickly and take over without surprises.

What this architecture includes

I'm using RDS PostgreSQL 15.x in private subnets only. In us‑east‑1, the primary DB runs Multi‑AZ, encrypted with KMS CMKs. In us‑west‑2, I need a cross‑region read replica that can be promoted automatically. Terraform will define everything end‑to‑end, including VPCs, routing, DNS, Lambda logic, IAM roles, CloudWatch alarms, S3 storage, and SNS notifications.

Backups need a 35‑day retention, with PITR enabled, and both regions should maintain S3 buckets that store and replicate backup artifacts. Replication lag is important here — if it exceeds 60 seconds, CloudWatch alarms should fire and notify via SNS.

IAM roles should follow least‑privilege. All logs (Lambda, RDS events, custom monitoring) should keep 90‑day retention.

Costs need to stay under $3000/month, which means we avoid anything fancy that doesn’t directly support DR.

Networking expectations

We're working with two VPCs, one per region, and they shouldn't overlap:

Primary (us-east-1)

VPC: 10.0.0.0/16

Public subnets: 10.0.1.0/24, 10.0.2.0/24

Private subnets: 10.0.3.0/24, 10.0.4.0/24

IGW + NAT Gateway

Properly isolated route tables

DR (us-west-2)

VPC: 10.1.0.0/16

Same subnet split, its own IGW + NAT

Routing that mirrors primary

Both VPCs will be connected by VPC peering (non‑overlapping CIDRs enforce this cleanly).

Every resource should include a short 4-character lowercase suffix — in this case, drrd — so the stack never complains about duplicate names.

Automation & Failover

All Lambda functions must be inline — no zip files, no external archives. The Terraform file (tap_stack.tf) should embed the code directly using filename or source content blocks. Lambdas will run Python 3.11 and handle both health checks and automated failover orchestration.

Route53 health checks should run every 30 seconds and initiate failover after two consecutive failures. DNS should point to either the primary or the DR DB endpoint depending on health.

What I want AWS NOVA to produce

A clean, human‑readable Terraform configuration that puts together:

Both VPCs, subnets, routing, NAT, IGW

RDS primary + cross‑region read replica (db.r6g.2xlarge, encrypted, 35‑day backup retention)

VPC peering between regions

S3 buckets (primary + DR) with lifecycle rules and cross‑region replication

CloudWatch alarms for replication lag (>60s)

SNS topics + subscriptions for alerting

Inline Lambda functions for monitoring + failover logic (no ZIP usage)

IAM roles/policies with minimal permission sets

Route53 DNS failover setup using health checks

All resource names suffixed with -drrd

Compliance with all constraints (encryption, runtimes, retention, RPO < 5 min, cost awareness)

This prompt should guide the model to give me a fully composed Terraform setup, especially focusing on producing the tap_stack.tf file with inline Lambda code, and ensuring all resources use the suffix so nothing collides during deploy.

That’s essentially the story — now I want AWS NOVA to fill in the Terraform in a way that follows this narrative.

Additional Technical Depth

To make sure the model behaves like it’s assisting with a real production-grade deployment, I want to describe the architecture with more internal engineering reasoning and the kind of context that actually affects Terraform structure.

Regional Architecture Expectations

In us-east-1, the primary database is the authoritative writer. Terraform should explicitly define Multi-AZ by enabling multi_az = true and selecting the RDS PostgreSQL 15 engine with a family that supports db.r6g.2xlarge. Storage must be encrypted using a dedicated regional KMS CMK. I expect the configuration to attach the parameter group and option group explicitly, even if mostly default, to support configurability later.

For the read replica in us-west-2, replication must be asynchronous (inherent with cross-region replicas), but the setup must support rapid promotion. The configuration should define replicate_source_db referencing the primary ARN, and the read replica must also use encrypted storage with the DR-region KMS CMK. Promotion logic will be triggered by Lambda, so the IAM role must allow rds:PromoteReadReplica.

VPC & Networking Structure

Both VPCs should follow a clean separation: public subnets for NAT/IGW, private subnets for databases and Lambdas. All subnets must have map_public_ip_on_launch disabled except the public ones. Routing tables should be individually defined rather than embedded for clarity.

For peering, Terraform should establish:

A peering connection initiated from primary to DR.

Route table associations for private subnets only (no public exposure).

Explicit allow_remote_vpc_dns_resolution = true to avoid name resolution issues during failover.

DNS + Route53 Failover Strategy

The hosted zone will include a CNAME or A-alias record for the database endpoint. The health check should hit a dedicated Lambda-powered /health endpoint or directly check RDS availability using TCP port 5432.

Failover should rely on:

Evaluating health check results

Switching DNS from primary DB endpoint to the promoted replica endpoint in DR

TTL should remain low (preferably 30 seconds) to minimize DNS propagation

The record set should use a failover routing policy with primary/secondary roles explicitly defined.

Lambda Technical Requirements

All Lambdas must:

Use inline code only (no external ZIPs)

Python 3.11 runtime

Include logic for:

RDS status polling

Replication lag evaluation (using CloudWatch get-metric-data for AuroraReplicaLag or standard RDS metrics)

Triggering failover via PromoteReadReplica

Updating Route53 records

Publishing alerts to SNS

The Terraform must embed the code using source_code_hash computed via filesha1() or a heredoc block, but without writing any temporary archive files.

The Lambda execution role needs tightly scoped permissions: Route53 record changes, RDS replica promotion, CloudWatch metrics read, logs write, and SNS publishes.

Backup, S3 & Lifecycle

Both regions should have an S3 bucket with:

Server-side bucket encryption (AES-256 or KMS-based)

Lifecycle policy transitioning older backups to IA/Glacier

35-day retention alignment with compliance

Automatic replication rules between regions (CRR enabled)

The buckets should suffix -drrd to avoid collisions.

Monitoring, Alarms & Logs

CloudWatch alarms should be explicit resources:

Replication lag > 60s (metric: ReplicaLag)

RDS instance status checks

Lambda invocation errors

All log groups must set retention_in_days = 90 to match expectations.

SNS should have dedicated topics for:

Failover events

Replication issues

Lambda execution errors

Subscriptions should be created for email/SMS depending on what the model suggests.

Terraform Consistency Expectations

Terraform must:

Use proper provider aliasing for multi-region setup using provider "aws" { alias = "west2" }

Apply the -drrd suffix to every resource name

Ensure dependency ordering using depends_on where appropriate (especially for read replica setup depending on primary DB availability)

Encrypt everything using explicit KMS keys (no default AWS-managed keys)

Keep cost awareness by avoiding unnecessary components (one NAT Gateway per region is acceptable but avoid multi-NAT setups)

Expected Output Format

The prompt should direct AWS NOVA to produce:

A complete tap_stack.tf with inline Lambda code

A maintainable layout (even if everything is inside one file)

Logical grouping of resources (network, storage, RDS, DNS, Lambda, alarms, IAM)

Rich comments explaining why something exists, not just what it does

Full compliance with all constraints: encryption, DR timelines, RPO goals, runtime versions, retention periods, cost caps

Let’s make the recovery pipeline both autonomous and resilient — fully AWS-native, tightly integrated, and deployable with a single Terraform apply.
 Constraints-
1.  For lambda function  dont rely on any zip file infact use the code in the tap_stack.tf file itself for this lambda. But please ensure that  I dont need zip file for the lambda function just create it with inline code. so please create tap_stack.tf file accordingly.
2. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
3. Give character size 4 suffix in small letters only with each resource so that stack dont get error of "resource already exists". Also use small characters only for this suffix. use this suffix "drrd".
4. I dont need a provider block as I already have provider.tf file also please keep the tap_stack region agnostic which can be used for any regions.
5. Use postgres version 17.4 for the DB also use default parameter group with the Database, dont create parameter group explicitly.
6. Use route53 dns name as - rdsrecovery.com
