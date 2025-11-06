# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with ts**
>
> Platform: **cdktf**
> Language: **ts**
> Region: **eu-south-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a CDKTF program to set up a new AWS cloud environment for a payment processing application. The configuration must: 1. Create a VPC with CIDR block 10.0.0.0/16 in eu-south-1. 2. Deploy 3 availability zones with public and private subnets in each. 3. Configure NAT Gateways in each AZ for high availability. 4. Set up VPC Flow Logs to CloudWatch with 1-minute intervals. 5. Create security groups for web tier (ports 80/443) and app tier (port 8080). 6. Enable DNS hostnames and DNS resolution on the VPC. 7. Tag all resources with Environment=Production and Project=PaymentGateway. 8. Configure VPC endpoints for S3 and DynamoDB to reduce data transfer costs. 9. Create an EC2 instance in each private subnet for application servers. 10. Set up Systems Manager Session Manager for secure instance access. Expected output: A fully deployed VPC with all networking components, EC2 instances accessible only through Session Manager, and CloudWatch dashboard showing VPC Flow Logs metrics.

---

## Additional Context

### Background

A fintech startup needs to establish their first AWS cloud environment with proper network isolation for their payment processing application. The infrastructure must follow security best practices with clear separation between public-facing and internal resources.

### Constraints and Requirements

- [Use CDK v2 with TypeScript - no JavaScript or other languages allowed, All EC2 instances must use Amazon Linux 2023 AMI, Instance type must be t3.micro for cost optimization, No SSH keys or key pairs - access only via Session Manager, VPC Flow Logs must capture ALL traffic (accepted and rejected), Each subnet must have explicit route table associations, Security groups must follow least privilege principle with no 0.0.0.0/0 inbound rules, All resources must be created in a single CDK stack, Use CDK L2 constructs where available, avoid L1 constructs, NAT Gateways must have Elastic IPs with deletion protection enabled]

### Environment Setup

AWS cloud environment setup in eu-south-1 region using VPC with public/private subnet architecture across 3 AZs. Requires CDK 2.x with TypeScript, Node.js 18+, and AWS CLI configured with appropriate permissions. Infrastructure includes NAT Gateways for outbound connectivity, VPC endpoints for cost optimization, and EC2 instances in private subnets. CloudWatch integration for monitoring VPC Flow Logs.

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

All resources should be deployed to: **eu-south-1**
