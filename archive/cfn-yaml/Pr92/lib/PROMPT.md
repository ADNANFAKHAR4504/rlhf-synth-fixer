Design a CloudFormation YAML template that deploys a multi-region, multi-AZ, multi-tier AWS infrastructure spanning us-east-1, us-west-2, and eu-central-1, ensuring full parity across regions with cross-region failover, self-healing RDS, and latency-aware routing.

Core Constraints: Each region must host an identical stack:

VPC (public/private subnets across 3 AZs)

NAT Gateway per AZ

Application Load Balancer per region

Auto Scaling Group of EC2s with IAM Roles having scoped permission to ONLY region-specific buckets

Private RDS instance with cross-region read replicas and KMS encryption

S3 buckets with versioning, MFA delete, SSE-KMS, and region tag-based policy restriction

AWS WAF and Shield applied globally but bound to region-specific ALBs

All Secrets must be stored in AWS Secrets Manager, accessed by dynamic ARNs scoped to regions only

Enable AWS Config, CloudTrail, and CloudWatch Logs/Alarms with retention logic based on compliance tags (HIPAA, GDPR)

Backup all resources using AWS Backup Plans with cross-region vault copies.

Configure a CloudFront Distribution with:

Custom origins pointing to each regional ALB

At least 3 edge locations defined via geographic restrictions

Logging to S3 with real-time metrics enabled

Define strict IAM policies such that:

Each region has scoped roles using dynamic conditions (aws:RequestedRegion, aws:TagKeys, aws:PrincipalOrgID)

No wildcard "*" permissions allowed

No IAM user creation only roles and assumed identities

Set up Route53 latency-based failover routing:

Weighted health checks per ALB DNS endpoint

Automatic failover to another region if health check fails

TTL = 60s for global failover responsiveness

Ensure compliance and auditability by:

Enabling AWS Config with custom rules validating encryption, MFA, and subnet isolation

All logs are encrypted, versioned, and shipped cross-region

Use KMS with rotation enabled for all services

Technical Constraints: No hardcoded ARNs, AZs, or region names in resources (must use AWS::Region, AWS::Partition, AWS::AccountId, etc.)

Reuse all KMS keys per region using Alias pattern (alias/region-service-key)

All S3 Bucket Policies must use explicit ARNs with StringEquals on "aws:sourceVpce" or "aws:sourceVpc"

All resources must include Metadata for Environment, ComplianceTag, RegionOwner, and CreatedBy

Output Required: A single, monolithic CloudFormation YAML file with all resources, parameterized where applicable

Use Conditionals, Mappings, and CrossRegion References where needed (CloudFormation limits apply)

File must be directly deployable via aws cloudformation deploy in us-east-1, with StackSets to replicate

Bonus Edge Cases (to break models): Handle asynchronous dependency where CloudFront origin points to a regional ALB whose DNS isnt known until deployment

Configure ALB listener rules to inspect headers from CloudFront and route requests to region-specific target groups

Inject secrets using dynamic SecretsManager ARN interpolation per region

Include Stack Policy in the template to protect RDS and KMS from deletion