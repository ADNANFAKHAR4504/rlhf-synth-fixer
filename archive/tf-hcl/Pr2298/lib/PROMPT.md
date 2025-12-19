We want to spin up a production-ready AWS environment using Terraform (HCL). Everything should be deployed in the us-east-1 region, and the setup needs to follow security and performance best practices.

Here’s what we need:

S3 bucket

Name should start with prod- and include a random 8-character suffix so it doesn’t collide with existing buckets.

Should be locked down with encryption and block public access.

RDS database

Use instance type db.t3.micro.

Should run inside a proper VPC/subnet setup so it’s not exposed directly to the internet.

IAM role

Should follow least-privilege — only allow permissions for S3 and RDS.

Lambda will assume this role.

Lambda function

Used for lightweight backend tasks.

Timeout capped at 5 seconds.

Should write logs to CloudWatch.

CloudWatch logs

Log groups should automatically expire after 7 days.

General standards

Every resource must be tagged (at least Environment = "Production").

Use random suffixes where appropriate to avoid naming conflicts.

Keep everything in a single Terraform file (main.tf) with variables, locals, resources, and outputs included.

The goal is a clean, secure Terraform configuration that a teammate could pick up and deploy without surprises.