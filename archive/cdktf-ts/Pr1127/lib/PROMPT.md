Need CDKTF (TypeScript) code to build secure AWS infra across 3 regions: us-east-1, us-west-2, eu-central-1. Focus is on security, no public exposure, centralized logging, and encryption everywhere.

Main goals:

- One VPC per region
- Each VPC has 3 subnets:
- Public (only for ALBs or entry points, locked down with SGs)
- Private (app workloads, no direct internet)
- Database (fully isolated, only private traffic allowed)
- Proper route tables, NACLs, and SGs so nothing is directly reachable from the internet

Security:

- Use Secrets Manager or SSM Parameter Store for sensitive values like DB creds (no hardcoding)
- IAM roles + policies must follow least privilege
- Encryption enabled both at rest and in transit (S3, RDS, etc.)

Logging:

- Access logging for S3, ALB
- One central S3 bucket for all logs with retention + audit logging
- VPC Flow Logs enabled for every subnet in each region stored in the logging bucket

Tagging:

- Everything must be tagged consistently: Environment, Owner, Project, Region

Code structure:

- Single main stack file, monolithic architecture:
- NetworkingConstruct (VPCs, subnets, routing, SGs, NACLs)
- SecurityConstruct (IAM + secrets)
- LoggingConstruct (central logging bucket, flow logs)
- StorageConstruct (S3 + RDS with encryption)
- Use TypeScript interfaces for configs (CIDR, retention days, subnet sizes, etc.)

Constraints:

- No secrets in code pull from Secrets Manager/SSM
- Must work with `cdktf synth`, no errors
- Stick to AWS Well-Architected security pillar best practices

Deliverable:

- Full CDKTF TypeScript setup
- Modular but kept in one main stack file
- Should be deployable and pass synth/plan/deploy cleanly
