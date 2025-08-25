AWS Multi-Region Infrastructure
We need to build a secure multi-region AWS setup for our IaC testing project. This will cover both us-east-1 and us-west-2 regions.
Please provide, provider.tf file for defining all the providers and alias, varibles are reference in tap_stack.tf file.
use s3 backend and dynamodb locking
Use S3/DynamoDB backend for state.
Please provide all the infra, variable and out code in single file called lib/tap_stack.tf
Consider below points for infra
Networking: VPCs in both regions, public/private subnets, NAT gateways, VPC Flow Logs.
Compute: Bastion hosts, auto-scaling groups, ALBs.
Data: RDS with encryption, backups, secure groups.
Storage: S3 with encryption & versioning, CloudFront HTTPS-only.
Cross-Region: VPC peering, Route53 DNS failover.
Security/Monitoring: CloudTrail (encrypted), CloudWatch alarms, IAM least privilege, 
Please add common tags, and provide outputs
