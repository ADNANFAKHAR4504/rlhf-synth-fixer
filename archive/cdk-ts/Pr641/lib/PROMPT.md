Create AWS infrastructure using CDK TypeScript for a secure multi-region VPC setup with the following requirements:

1. VPC with public and private subnets across 2+ availability zones, using NAT gateways efficiently
2. Security Groups and Network ACLs for strict traffic control
3. IAM roles with least privilege policies
4. S3 buckets with versioning and encryption
5. EC2 CloudWatch monitoring with performance metrics and logging
6. RDS instances isolated within VPC with encryption at rest
7. AWS Secrets Manager and Parameter Store integration

The infrastructure should be deployed primarily in us-east-1 with cross-region capabilities to us-west-2.

Use naming convention: project-environment-resource
Include these tags on all resources: Environment, ProjectName, CostCenter

Incorporate these latest AWS features:
- Amazon GuardDuty Extended Threat Detection for sophisticated attack detection
- CloudWatch organization-wide VPC flow logs enablement for centralized monitoring

Generate infrastructure code with one code block per file. Focus on security best practices and cost optimization.