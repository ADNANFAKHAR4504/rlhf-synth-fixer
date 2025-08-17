AWS Multi-Region Infrastructure
We need to build a secure multi-region AWS setup for our IaC testing project. This will cover both
**us-east-1** and **us-west-2** regions.
Deliverables
- **provider.tf**
- Lock Terraform and AWS provider versions.
- Configure providers for us-east-1 and us-west-2.
- Use S3/DynamoDB backend for state.
- **lib/tap_stack.tf**
- Contains all infrastructure: variables, data sources, resources, outputs.
- Single-file approach (no modules).
Infrastructure
- Networking: VPCs in both regions, public/private subnets, NAT gateways, VPC Flow Logs.
- Compute: Bastion hosts, auto-scaling groups, ALBs.
- Data: RDS with encryption, backups, secure groups.
- Storage: S3 with encryption & versioning, CloudFront HTTPS-only.
- Cross-Region: VPC peering, Route53 DNS failover.
- Security/Monitoring: CloudTrail (encrypted), CloudWatch alarms, IAM least privilege, consistent
tagging.
Outputs
Only safe values:
- VPC IDs
- ALB DNS names
- RDS Endpoints
No sensitive outputs.
