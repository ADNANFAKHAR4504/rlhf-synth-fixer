Need CDKTF TypeScript code to build a multi-environment AWS setup deployed consistently across us-east-1 and us-west-2. Infra must support high availability, security, and PCI DSS compliance.

Architecture:

- Custom VPC per region with proper subnet allocation for HA
- Primary region us-east-1:
  - Amazon RDS PostgreSQL multi-AZ database
  - DynamoDB table for real-time application state
  - S3 bucket serving static assets

- Secondary region us-west-2:
  - RDS read replica connected to the primary database
  - Independent DynamoDB table
  - S3 bucket receiving replicated objects from primary

- Service connections:
  - S3 in us-east-1 automatically replicates objects to eu-west-1 bucket via IAM replication role
  - CloudFront distribution pulls content from primary S3 bucket and routes traffic globally
  - Route 53 DNS routes database traffic to RDS instances based on latency and health checks
  - WAF rules protect CloudFront from common web attacks
  - VPC peering connects both regions for secure inter-region communication
  - KMS keys encrypt data at rest in RDS, DynamoDB, and S3 in each region

Constraints:

- Resources deployed identically in both regions
- RDS PostgreSQL: multi-AZ deployment, cross-region replication, automated backups
- S3: versioning enabled with replication between us-east-1 and eu-west-1
- CloudFront and Route 53 configured for latency-based routing and failover
- AWS WAF enabled for CloudFront distribution
- Infra must comply with PCI DSS requirements: encryption at rest, IAM best practices, monitoring, and comprehensive logging
- Code must be valid CDKTF TypeScript that passes cdktf synth and terraform plan without errors
