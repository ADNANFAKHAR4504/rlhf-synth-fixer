We need to design a secure AWS setup using CDKTF with Typescript that aligns with strong security practices and works cleanly within `us-east-1` under an AWS Organizations setup. The idea is to build infrastructure that can be reused and extended but without cutting corners on compliance or security and all code should be in a monolithic format and within same main file.

The main things this project has to cover are:

1. Every storage layer (S3 buckets, EBS volumes, and RDS storage) should use encryption at rest by default.
2. All compute resources (EC2 and Lambda) must have IAM roles attached, with least-privilege permissions.
3. Logging for every major AWS service needs to be collected and pushed into a central S3 bucket. That bucket should have a retention policy defined so logs don’t pile up forever.
4. The VPCs should be set up so that databases sit inside private subnets only, and they should only be reachable through the application services – not directly from the internet.
5. SSH access to EC2 instances must be locked down to a known IP range. No open 0.0.0.0/0 inbound rules are acceptable.
6. RDS databases need to have automated backups enabled, with restore options in case of failure.
7. CloudWatch should be configured to track key metrics, with alarms firing when thresholds are hit so that operational issues are visible quickly.

The output for this task should be a working CDKTF (Go) codebase that creates the infrastructure above, validates properly, and follows AWS best practices. Use Parameter Store and Secrets Manager where it makes sense for sensitive values like database passwords or IP ranges.

Constraints to keep in mind:

- Encryption must be applied everywhere (S3, EBS, RDS).
- IAM roles are mandatory for all compute services.
- Centralized logging has to go into S3 with lifecycle rules/retention.
- Databases can’t sit in public subnets.
- SSH must be restricted to an approved IP range.
- All RDS instances must support backup and restore.
