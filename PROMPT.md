# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with py**
> 
> Platform: **cdk**  
> Language: **py**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a CDK Python program to deploy a multi-tier VPC infrastructure for a payment processing platform. The configuration must: 1. Define a VPC with CIDR 10.0.0.0/16 across 3 availability zones in us-east-1. 2. Create 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) for NAT gateway placement. 3. Create 3 private application subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24). 4. Create 3 private database subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24). 5. Deploy one NAT gateway in each public subnet with Elastic IPs. 6. Configure route tables so private subnets route through their AZ's NAT gateway. 7. Enable VPC flow logs with 5-minute capture intervals sending to CloudWatch Logs. 8. Apply mandatory tags Environment=production and Project=payment-platform to all resources. 9. Output the VPC ID, subnet IDs grouped by tier, and NAT gateway IDs. 10. Support stack name configuration via CDK context parameter 'stack-name'. Expected output: A CDK application that synthesizes a CloudFormation template creating the complete VPC infrastructure with proper network segmentation, high availability NAT gateways, and flow logging enabled for compliance requirements.

---

## Additional Context

### Background
A fintech startup needs to establish a secure cloud foundation for their payment processing platform. They require network isolation between different application tiers and strict security controls. The infrastructure must support future growth while maintaining PCI DSS compliance requirements.

### Constraints and Requirements
- [VPC must span exactly 3 availability zones in us-east-1, Use /16 CIDR block starting at 10.0.0.0 for the VPC, Create 3 public subnets with /24 CIDR blocks for NAT gateways, Create 6 private subnets with /24 CIDR blocks (2 per AZ) for application and database tiers, Implement separate route tables for public and private subnets, Deploy exactly one NAT gateway per availability zone, Enable VPC flow logs with 5-minute intervals to CloudWatch Logs, Tag all resources with Environment=production and Project=payment-platform, Use CDK L2 constructs only - no L1 constructs allowed, Stack name must be parameterized and passed via CDK context]

### Environment Setup
Production environment in AWS us-east-1 region requiring a multi-tier VPC setup for a payment processing application. Infrastructure includes VPC spanning 3 AZs with public subnets for NAT gateways and private subnets for application and database tiers. Setup requires Python 3.9+, AWS CDK 2.x, and AWS CLI configured with appropriate credentials. The VPC will host ECS containers in private subnets with RDS Aurora PostgreSQL databases in isolated subnets. CloudWatch Logs will store VPC flow logs for security monitoring and compliance auditing.

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **us-east-1**
