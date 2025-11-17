# PCI-Compliant VPC Architecture for Payment Processing

## Business Context

Hey, we're building a production-grade network foundation for our new payment processing platform that must comply with PCI DSS requirements for network segmentation, access control, and comprehensive audit logging. The architecture needs strict isolation between public-facing load balancers, application servers, database instances, and management tools across three availability zones with encryption at rest, API activity tracking, and real-time security monitoring. **We'll use Terraform with HCL** to deploy this secure, highly available VPC infrastructure in ap-southeast-1.

## Technical Requirements

### KMS Encryption Infrastructure

Create two customer-managed KMS keys for encryption at rest following PCI DSS requirements—one for CloudWatch Logs encryption and one for S3 bucket encryption. Each key must enable automatic key rotation and include a key policy allowing both the root account full administrative access and the deployment user complete key management permissions to prevent lockouts. Grant service principals (logs.amazonaws.com for CloudWatch and s3.amazonaws.com for S3) the necessary GenerateDataKey and Decrypt permissions scoped to their respective services. Set deletion_window_in_days to seven for quick testing cleanup and create descriptive aliases like "alias/vpc-flowlogs-production" and "alias/cloudtrail-logs-production" for easier reference in resource configurations.

### S3 Bucket for CloudTrail Logs

Set up an S3 bucket using the naming pattern "s3-cloudtrail-logs-production-ACCOUNT_ID" for global uniqueness and CloudTrail integration. Enable versioning to maintain immutable audit history and configure server-side encryption using the CloudTrail KMS key. Implement all four public access block settings (block_public_acls, block_public_policy, ignore_public_acls, restrict_public_buckets) to prevent accidental exposure of sensitive audit logs. Add a bucket policy allowing CloudTrail service principal to write logs while denying unencrypted uploads and requiring the root account access for emergency recovery. Set force_destroy to true for clean testing teardown and configure lifecycle rules with the required filter block to transition logs to Glacier storage after thirty days and expire after ninety days for cost optimization.

### CloudTrail API Logging

Enable CloudTrail with a trail named "cloudtrail-vpc-api-production" capturing all management events across the entire AWS account for comprehensive API activity auditing required by PCI DSS. Configure the trail to write encrypted logs to the dedicated S3 bucket using the CloudTrail KMS key and enable log file validation for tamper detection. Include management events for read and write operations to track all VPC configuration changes, security group modifications, and route table updates. Set include_global_service_events to true and is_multi_region_trail to false since we're focusing on ap-southeast-1 resources. Add explicit depends_on to the S3 bucket and bucket policy to ensure proper creation order.

### VPC Foundation

Create a VPC with CIDR block 10.50.0.0/16 providing 65,536 IP addresses for future growth while maintaining the /24 subnet structure for each tier. Enable DNS hostnames and DNS resolution for internal service discovery and proper hostname assignment. The VPC must span exactly three availability zones (ap-southeast-1a, ap-southeast-1b, ap-southeast-1c) with identical subnet configurations in each zone to support symmetric workload distribution and failover scenarios.

### Subnet Architecture

Deploy twelve subnets total organized into four functional tiers with three subnets each—one per availability zone. The public tier (10.50.0.0/24, 10.50.1.0/24, 10.50.2.0/24) hosts internet-facing application load balancers with direct internet routing. Private subnets (10.50.10.0/24, 10.50.11.0/24, 10.50.12.0/24) contain application servers and microservices with outbound internet access through NAT Gateways. Database subnets (10.50.20.0/24, 10.50.21.0/24, 10.50.22.0/24) provide complete isolation with no internet routing for RDS instances and data stores. Management subnets (10.50.30.0/24, 10.50.31.0/24, 10.50.32.0/24) host bastion hosts and monitoring tools with controlled outbound access through NAT Gateways.

### Internet Connectivity

Create an Internet Gateway and attach it to the VPC for bidirectional internet traffic. Deploy three NAT Gateways in high availability configuration—one in each public subnet across all availability zones—to provide fault-tolerant outbound internet access for private and management tier resources. Allocate three Elastic IPs for the NAT Gateways ensuring consistent source IP addresses for external API integrations and third-party payment gateways. This HA design prevents single points of failure since each private subnet routes to its local NAT Gateway within the same availability zone.

### Route Table Configuration

Implement four distinct routing configurations with explicit subnet associations following least-privilege routing principles. The public route table directs 0.0.0.0/0 traffic to the Internet Gateway and associates with all three public subnets. Create three private route tables (one per AZ) where each routes 0.0.0.0/0 to the NAT Gateway in the same availability zone and associates with the corresponding private subnet. The database route table contains only local VPC routes with no internet path whatsoever, associated with all three database subnets. Create three management route tables (one per AZ) routing 0.0.0.0/0 to the local NAT Gateway with associations to corresponding management subnets. Use explicit aws_route_table_association resources rather than relying on implicit main route table behavior.

### VPC Flow Logs

Enable VPC Flow Logs capturing all accepted, rejected, and all traffic types with 60-second aggregation intervals for near-real-time security monitoring and PCI compliance auditing. Send logs to a CloudWatch Logs group named '/aws/vpc/flowlogs' encrypted with the CloudWatch Logs KMS key for encryption at rest. Create an IAM role with the appropriate trust policy allowing vpc-flow-logs.amazonaws.com to assume the role and policies granting permissions to create log streams and put log events scoped to the specific log group ARN. Set retention_in_days to one for testing cleanup and add explicit depends_on to the IAM role, policy attachments, CloudWatch Logs group, and KMS key to handle eventual consistency and resource availability.

### Network Access Control Lists

Configure custom Network ACLs for each subnet tier implementing defense-in-depth security beyond security groups. Each tier's NACL must include explicit deny rules blocking RFC 1918 address ranges not used by this VPC—specifically 172.16.0.0/12 and 192.168.0.0/16—to prevent potential lateral movement from compromised resources attempting cross-VPC attacks. Allow required traffic patterns including ephemeral ports (1024-65535) for return traffic from outbound connections. Use separate aws_network_acl_rule resources with numbered priorities (100, 200, 300, etc.) rather than inline rules for maintainability. Database tier NACLs should be most restrictive allowing only PostgreSQL port 5432 from application subnets (10.50.10.0/23) and blocking all other traffic.

### Security Groups

Create baseline security groups for each tier with descriptive rule documentation for audit purposes and change tracking. The public security group allows HTTPS (443) from 0.0.0.0/0 for load balancer traffic and includes description fields like "Allow HTTPS from internet for ALB health checks and customer traffic". Private security groups allow application ports only from the public security group implementing proper source-based restrictions with descriptions like "Allow app traffic from ALB tier only". Database security groups permit PostgreSQL (5432) exclusively from the private security group ensuring no direct internet exposure with description "Allow database access from application tier only - PCI isolation requirement". Management security groups allow SSH (22) from restricted corporate IP ranges only with description "Bastion access from corporate VPN only". Use separate aws_security_group_rule resources instead of inline rules to avoid circular dependency issues when groups reference each other.

### CloudWatch Monitoring and Alarms

Create a CloudWatch Logs group named '/aws/vpc/flowlogs' with retention_in_days set to one for testing and kms_key_id referencing the CloudWatch Logs encryption key for compliance. Implement CloudWatch metric filters on the Flow Logs group to detect security events including high reject rates, unusual traffic patterns, and potential port scanning activity. Create CloudWatch alarms monitoring NAT Gateway packet drops (threshold greater than 1000 per five minutes), VPC Flow Logs rejected packets (threshold greater than 100 per five minutes), and NAT Gateway errors for proactive issue detection. Configure alarms to publish notifications to the SNS topic with alarm descriptions documenting the business impact and response procedures.

### SNS Notifications

Set up an SNS topic named "sns-vpc-security-alerts-production" for CloudWatch alarm notifications with KMS encryption using the CloudWatch Logs encryption key. Create an email subscription using the dummy email address provided as a variable for testing—note this requires manual confirmation but is acceptable per framework rules. Configure the topic policy allowing CloudWatch alarms service principal to publish messages and the root account to manage subscriptions.

### IAM Roles and Policies

Create two IAM roles following least privilege principles—one for VPC Flow Logs and one for CloudTrail S3 bucket access. The Flow Logs role needs a trust policy allowing vpc-flow-logs.amazonaws.com to assume it with policies granting logs:CreateLogGroup, logs:CreateLogStream, and logs:PutLogEvents permissions scoped to the /aws/vpc/flowlogs log group ARN only. Define all policies using aws_iam_policy_document data sources for readable policy definitions referencing specific resource ARNs rather than wildcards. Add explicit depends_on between role creation and policy attachments to handle IAM eventual consistency during deployment.

## Provider Configuration

Configure Terraform 1.5 or higher with AWS provider version constrained to 5.x using pessimistic operator (~> 5.0). Include random provider for generating unique S3 bucket suffixes. Deploy all resources to ap-southeast-1 with default_tags automatically applying Environment set to production, Project set to payment-processing, Compliance set to pci-dss, Owner set to platform-team, and CostCenter set to infrastructure across all resources for comprehensive cost allocation and compliance tracking. Define variables for environment (default "production"), alert_email with type string for SNS subscription, and enable_detailed_monitoring as a boolean defaulting to true.

## Resource Naming

Follow the deterministic naming pattern {resource-type}-{purpose}-{environment} for all resources like "vpc-payment-production" or "kms-flowlogs-production". S3 buckets need AWS account ID appended for global uniqueness like "s3-cloudtrail-logs-production-ACCOUNT_ID" using data.aws_caller_identity.current. CloudWatch log group uses the specific path '/aws/vpc/flowlogs' as required by VPC Flow Logs. Security groups use tier names like "sg-public-production" and "sg-database-production". NAT Gateways include availability zone identifiers like "nat-gateway-az1-production". Don't use random_string resources in naming since that causes integration test failures.

## Data Source Restrictions

Only use data.aws_caller_identity.current for AWS account ID in S3 bucket naming and IAM policies, data.aws_region.current for region name in outputs and resource configurations, and data.aws_availability_zones.available with state filter set to "available" for selecting exactly three availability zones. Don't use data sources referencing existing infrastructure—create all resources fresh including the VPC, subnets, route tables, security groups, KMS keys, S3 buckets, and CloudTrail.

## File Organization

Structure with lib/provider.tf containing Terraform and provider version constraints, AWS provider configuration with default_tags, random provider, and variable definitions for environment, alert_email, and monitoring flags. The lib/main.tf file contains all data sources, KMS key resources with policies, S3 bucket for CloudTrail with encryption and lifecycle configuration, CloudTrail trail with log validation, VPC and subnet resources, Internet Gateway, NAT Gateway resources with Elastic IPs, route tables with explicit associations, VPC Flow Logs configuration, CloudWatch Logs group with encryption, Network ACL resources and rules, security group resources and rules, CloudWatch metric filters and alarms, SNS topic with email subscription, IAM roles and policies for Flow Logs and CloudTrail, and comprehensive outputs (minimum 45-50) covering all resource identifiers, ARNs, encryption keys, monitoring configurations, and network topology details.

## Cleanup Configuration

Set force_destroy to true on the S3 bucket, deletion_window_in_days to seven on both KMS keys, and retention_in_days to one on the CloudWatch Logs group for quick testing teardown. All other networking resources (VPC, subnets, NAT Gateways, route tables, security groups, Network ACLs) delete cleanly without special configuration. Note that NAT Gateway deletion takes approximately two to three minutes for Elastic Network Interface detachment but completes automatically without manual intervention. CloudTrail deletion is immediate once the S3 bucket policy dependency is removed.

## Integration Testing Outputs

Provide comprehensive outputs including KMS key IDs and ARNs for both encryption keys, S3 bucket name and ARN for CloudTrail logs, CloudTrail trail ID and ARN, VPC ID and CIDR block, public subnet IDs as a list, private subnet IDs as a list, database subnet IDs as a list, management subnet IDs as a list, NAT Gateway IDs for all three gateways, NAT Gateway public IP addresses, Internet Gateway ID, route table IDs for public, private (per AZ), database, and management tiers, security group IDs for all four tiers, VPC Flow Logs ID and destination log group, CloudWatch Logs group name and ARN with KMS key association, CloudWatch alarm names and ARNs, SNS topic ARN, IAM role ARNs for Flow Logs and CloudTrail, and availability zones used. Mark sensitive outputs like KMS key IDs appropriately and include descriptions for each output explaining its purpose. Tests require outputs for every resource to validate multi-AZ configuration, encryption settings, and monitoring setup with minimum 45-50 total outputs.
