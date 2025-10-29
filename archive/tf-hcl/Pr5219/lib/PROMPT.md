We’re working with a financial services company that handles real-time payment transactions. The PostgreSQL database behind it is mission-critical — it absolutely can’t go down. So, we’re building a multi-region disaster recovery setup using Terraform on AWS that keeps things running even if an entire region fails.

The goal is to have a primary environment in us-east-1 and a disaster recovery environment in us-west-2. When the primary goes down, traffic should automatically shift west in under two minutes. Data loss should be minimal — ideally, RPO under 5 minutes. Everything should recover fast and clean, without manual intervention.

We’ll do this all as code with Terraform, using version 1.5+ and the AWS provider 5.x. AWS CLI should already be configured with permissions for both regions.

Here’s the big picture of what we’re building:

Core infrastructure

We’ll start by setting up networking properly in both regions — no shortcuts here.
Each region gets its own custom VPC (non-default) that’s dedicated entirely to this platform. Inside each VPC, we’ll create:

2 public subnets and 2 private subnets, each in different Availability Zones for resilience.

Internet Gateway attached for outbound access from public subnets.

NAT Gateways for the private subnets so the internal resources (like Lambda or RDS maintenance tasks) can reach AWS APIs safely, without exposing anything to the public internet.

Proper Route Tables to make sure traffic flows correctly — public subnets route through the Internet Gateway, private subnets route through the NAT.

Everything inside these networks — databases, Lambdas, health checks — will run in private zones wherever possible.

Database layer

RDS PostgreSQL instances in both regions.

us-east-1 acts as the primary.

us-west-2 hosts the cross-region read replica for DR.

Automated backups enabled with point-in-time recovery and 7-day retention.

Encryption at rest enabled for all RDS instances.

Subnet groups for databases will span at least two AZs in each region for redundancy.

Database passwords will live in AWS Secrets Manager and be referenced dynamically — no hardcoding.

Instance type: db.r6g.xlarge with 100GB GP3 storage.

Routing and failover

Route53 handles DNS with a failover routing policy.

Health checks will monitor the primary DB endpoint every 30 seconds. If it fails twice in a row, Route53 flips traffic to the DR region automatically.

Lambda functions in both regions perform application-level health checks — quick queries to verify DB availability, with a 10-second timeout limit.

Monitoring and alerts

CloudWatch Alarms to track replication lag; alerts trigger if lag exceeds 60 seconds.

SNS topics for failover notifications — these should push alerts via both email and SMS.

RDS Event Subscriptions to capture critical database events and forward them to SNS.

CloudWatch Logs for Lambda functions retained for 14 days.

Backup and storage

S3 buckets in both regions for database dumps and backup storage.

Enable cross-region replication between the two S3 buckets.

Lifecycle policies move older backups to Glacier after 30 days to save costs.

All data in S3 encrypted at rest.

IAM and security

Create IAM roles and policies for each component — all following least privilege principles.

Ensure all inter-region replication and traffic use AWS’s private backbone network, not the public internet.

Security groups will be locked down — only app subnets can talk to the databases.

Tag everything with Environment, Owner, and DR-Role for clarity and tracking.

Terraform setup

Remote Terraform state stored in S3, with DynamoDB table used for state locking.

Everything parameterized and region-aware for cleaner maintenance.

End goal

A complete Terraform configuration that builds this multi-region architecture from scratch — VPCs, subnets, RDS, Route53, health checks, alarms, Lambdas, S3, IAM, everything.
It should automatically fail over within 2 minutes of a primary outage and keep RPO under 5 minutes.
The result should be a resilient, production-ready setup where, even if us-east-1 goes completely offline, the payment systems keep processing as if nothing happened.

Basically — the lights stay on, no matter what happens on the East Coast.

