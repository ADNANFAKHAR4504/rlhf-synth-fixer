Hey team,

We've got a request from one of our financial services clients who needs help with their global payment platform infrastructure. They want to deploy across three AWS regions (us-east-1, eu-west-1, ap-southeast-1) using Terraform, and honestly it's a pretty complex setup.

The catch is they want everything in a single Terraform file - no separate modules or anything fancy. They're using workspaces for their environments (dev, staging, prod) and need proper remote state setup with S3 and DynamoDB locking. High availability is critical since this handles payments, so we need cross-region replication, monitoring, and secure networking between regions.

Here's what they need implemented:

1. Regional Infrastructure Pattern
Since they don't want separate module directories, we need to create a reusable pattern within the single file. Think maps and for_each loops with provider aliases so the same resources get deployed to all three regions with region-specific settings.

2. VPC and Networking Setup
Each region needs its own VPC with 3 availability zones. Public and private subnets in each AZ, NAT gateways in the public subnets (probably one per AZ for HA, but could be cost-optimized), proper route tables, and security groups. Make sure to prefix everything with region and workspace names.

3. Database Layer
Aurora MySQL clusters in each region. They're pretty specific about this - encrypted storage with regional KMS keys, 7-day backup retention, cross-region snapshot copying, read replicas where it makes sense. Important note: they explicitly don't want deletion protection enabled (probably for easier testing).

4. Transaction Logging
S3 buckets per region for transaction logs. Standard setup - versioning on, server-side encryption with those regional KMS keys, lifecycle policy to move stuff to Glacier after 90 days, and obviously block all public access.

5. Payment Processing Functions

package and runtime configuration assumed as placeholders (the code may be a small inline / zipfile stub),

environment-specific configuration injected via variables (use workspace-specific maps),

attach least-privilege IAM roles.

API Gateway REST APIs: Create API Gateway REST APIs in each region that integrate with the Lambda functions and are configured to use custom domain names (variables for domain and certificate ARN). Output the API endpoints.

Inter-region private communication (VPC peering): Programmatically create VPC peering connections between all region pairs (triangular peering) with route table updates so private subnets can route to other regions’ private CIDR blocks. Use data sources where needed; do not hardcode peer VPC IDs — reference them created in the same run.

IAM least-privilege: Implement IAM roles and inline or separate policies that grant only the permissions required for Lambda, RDS snapshot copy, S3 write/read for log processors, and Terraform remote-state operations.

Remote state & locking: Configure Terraform remote state backend using S3 and a DynamoDB table for state locking. The backend should be workspace-aware (support dev/staging/prod) and parameterized via variables (bucket name prefix, region for backend, dynamodb table name). Provide example backend configuration that can be used per workspace (commented if provider interpolation limitations exist) and show necessary DynamoDB and S3 bucket resources or instructions if those must be created outside (but prefer automated creation in the single file if possible).

CloudWatch Dashboards: Create CloudWatch dashboards in each region monitoring RDS metrics (CPU, connections, replica lag, disk queue) and Lambda invocation/error/latency metrics.

Outputs: For each region output:

API Gateway base URL / endpoint,

RDS cluster endpoint (writer endpoint),

S3 bucket name(s),

KMS key ARNs,

VPC IDs and peering connection IDs.

Nonfunctional requirements: The configuration should aim to be capable of 10,000 TPS globally with automatic failover (architect the RDS clusters with replicas and cross-region snapshots, API Gateway + Lambda stateless design, and placement across AZs). Add reasonable instance sizing hints (variables) and autoscaling for Lambdas (provisioned concurrency or concurrency limits) with sensible defaults.

Deletion protection: Ensure no resources are created with deletion_protection enabled. Explicitly set deletion_protection = false for RDS where attribute exists.

Constraints 
Use Terraform 1.5+ and AWS provider ~> 5.0 syntax. Make the provider block explicit with provider aliases for each region.

Use workspaces for environment separation (dev, staging, prod).

Additional details:
- Use variables for region list, AZ count, CIDR blocks per region (provide sensible defaults for the three regions)
- Use data sources to reference resources in other regions when needed - avoid hardcoding ARNs/IDs
- All S3 buckets need versioning, block public access, and KMS encryption
- RDS automated backups should be 7 days with cross-region snapshot copying
- Remote backend config should be included and parameterized - if it needs values not available at plan time, show recommended variable values and example terraform init workflow
- Keep IAM policies tight (least privilege) - no wildcard permissions unless absolutely necessary
- Add brief comments explaining the different sections

The deliverable should be production-ready Terraform code in a single main.tf file that includes:
- Provider blocks with aliases for all three regions
- Variables and locals
- Parameterized backend configuration 
- All the resources using maps/for_each to replicate per region
- Outputs grouped by region
- Comments explaining workspace initialization and backend setup

Make sure it's syntactically valid Terraform HCL (1.5+) using AWS provider 5.x syntax and ready to run once variables are set and AWS credentials are configured.