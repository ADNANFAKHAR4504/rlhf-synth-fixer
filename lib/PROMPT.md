
Generate a fully automated AWS CloudFormation template (YAML format) that deploys a secure, multi-AZ VPC infrastructure for a payment processing environment requiring PCI DSS compliance.
The template must be cross-account executable, region-agnostic, and free of hardcoded values (e.g., ARNs, Account IDs, Region names). Use parameters and intrinsic functions wherever possible.

Requirements:

General

Use YAML format with proper indentation.

Use CloudFormation intrinsic functions (!Ref, !Sub, !GetAtt, etc.).

All values (e.g., CIDR blocks, environment names, tag values) must be parameterized.

Template must be cross-account executable — no account- or region-specific references.

Avoid hardcoding ARNs, Account IDs, Region names, or fixed resource names.

VPC Architecture

Create a VPC with CIDR block 10.0.0.0/16 (parameterized).

Deploy across three Availability Zones (automatically determined via !GetAZs and !Select).

Enable DNS Hostnames and DNS Resolution.

Subnets

Public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24 (for NAT Gateways only).

Private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24 (for application workloads).

Database subnets: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24 (no internet access).

All subnets parameterized and distributed across AZs automatically.

Networking Components

Internet Gateway attached to VPC.

One Elastic IP and NAT Gateway per public subnet (for high availability).

Route tables:

Public route table → Internet Gateway.

Private route tables → NAT Gateway (in the same AZ).

Database route table → local routes only (no internet).

Security Groups

Web Tier: Allow inbound HTTPS (443) only from the Internet.

App Tier: Allow inbound on port 8080 from Web Tier SG.

DB Tier: Allow inbound on port 5432 (PostgreSQL) from App Tier SG.

Outbound rules: least privilege, internal-only where applicable.

Monitoring & Compliance

Enable VPC Flow Logs (traffic type: ALL) to CloudWatch Logs.

Create necessary IAM Role for Flow Logs delivery.

Set aggregation interval to 1 minute.

VPC Endpoints

S3 Gateway Endpoint for private subnets.

Interface Endpoints for:

Systems Manager (SSM)

EC2 Messages

SSM Messages

Associate endpoints with private subnets only.

Tagging

Every resource must include tags:

Environment

CostCenter

Compliance

Tag values provided as parameters.

Outputs

Export key resources for cross-stack references:

VPC ID

Subnet IDs

Security Group IDs

NAT Gateway IDs

Route Table IDs

Use Export names in Outputs.

Constraints & Best Practices

Use Parameters for all user-defined values.

Use Mappings for AZ selection or region-specific defaults.

Avoid hardcoding any AWS-managed resource ARNs or Region strings.

Follow least-privilege and separation of duties principles.

The final template must deploy successfully across any AWS account without modification.

Deliverables:

A single YAML CloudFormation template meeting all requirements above.

Output Expectation:

Clean, production-grade YAML template.

Fully parameterized and region-independent.

No manual steps required post-deployment.

Includes comments explaining each major resource block.