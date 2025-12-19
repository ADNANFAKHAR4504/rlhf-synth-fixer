# AWS Migration Project - Python CDK
Hi, cloud expert. You did not finish the output of the serverless stack and in our initial conversation. Rememeber, you are tasked with building a complete AWS infrastructure for a company migrating to the cloud. Everything deploys to us-east-1 and needs to be production-ready - secure, scalable, and actually maintainable.

## What to Create
**Network:** Multi-AZ VPC (10.0.0.0/16, keep 192.168.0.0/16 as backup), 2 public/2 private subnets, NAT gateways, SSH restricted to specific IPs, VPC Flow Logs enabled.

**Compute:** ALB with host-based routing, EC2 with latest Amazon Linux 2, auto-scaling, plus one Elastic Beanstalk app.

**Databases:** Multi-AZ RDS and DynamoDB (on-demand mode), both KMS encrypted with backups.

**Storage/CDN:** S3 with versioning (no public access), CloudFront for caching/DDoS protection.

**Serverless:** Lambdas triggered by S3/DynamoDB events, configurable memory, proper error handling.

**Security:** Least-privilege IAM, KMS encryption everywhere, AWS WAF on endpoints, locked-down security groups.

**Monitoring:** CloudWatch alarms (CPU/memory/disk/network), centralized logs, dashboards, Route53 DNS with health checks.

**Standards:** Name resources like `vpc-prod-*`, tag with `Environment: Production` and `Project: Migration`.

Build it with Python CDK, zero-downtime updates. Should handle failures and scale automatically.