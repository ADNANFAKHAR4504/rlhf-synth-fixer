// language: typescript

// Includes modular CDKTF stacks for:
// - VPC: CIDR-based layout with public/private/db subnets, NAT, IGW, flow logs
// - IAM: EC2, S3, CloudWatch roles with least privilege
// - EC2: instance with dynamic AMI, secure SG, log groups, and user_data
// - S3: two buckets (main + access logs) with encryption, versioning, lifecycle
// - CloudWatch: dashboard, metric alarms, log group
// - TAP Stack: Orchestrates the above across a dynamic environment

// Compliant with constraints:
// - No hardcoding (uses env variables and Fn)
// - Separate stacks
// - DRY design
// - Lifecycle rules in dev/staging only
// - Logging, tagging, IAM, subnet/zones, encryption: ✅
