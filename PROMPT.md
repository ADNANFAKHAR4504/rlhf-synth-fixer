# Cloud Environment Setup

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with ts**
> 
> Platform: **cdk**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a CDK TypeScript program to deploy a production-ready VPC infrastructure in a new AWS region. The configuration must: 1. Create a VPC with CIDR 10.0.0.0/16 in ap-southeast-1. 2. Deploy 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across 3 AZs. 3. Deploy 3 private subnets (10.0.10.0/23, 10.0.12.0/23, 10.0.14.0/23) across the same AZs. 4. Create an Internet Gateway and attach it to the VPC. 5. Deploy NAT Gateways in the first two public subnets only. 6. Configure route tables with proper naming conventions for all subnets. 7. Enable VPC Flow Logs with a retention period of 7 days. 8. Create custom Network ACLs that allow only HTTP (80), HTTPS (443), and SSH (22) inbound traffic. 9. Tag all resources with Environment=production and Project=apac-expansion. 10. Export VPC ID, subnet IDs, and NAT Gateway IDs as CloudFormation outputs. Expected output: A CDK stack that provisions a fully functional VPC with high availability across multiple AZs, proper network segmentation, and security controls ready for production workloads.

---

## Additional Context

### Background
Your company is establishing a new AWS presence in the Asia-Pacific region to support growing customer demand. The infrastructure team needs to create a standardized VPC setup that can be replicated across multiple regions while maintaining consistent security and networking policies.

### Constraints and Requirements
- 1. VPC CIDR must be /16 to accommodate future growth
2. Public subnets must use /24 CIDR blocks
3. Private subnets must use /23 CIDR blocks
4. All route tables must have explicit names following the pattern {env}-{tier}-rt
5. NAT Gateways must be deployed in at least 2 availability zones
6. VPC Flow Logs must be enabled and sent to CloudWatch Logs
7. Network ACLs must explicitly deny all traffic from 0.0.0.0/0 except for allowed ports

### Environment Setup
New AWS environment in ap-southeast-1 region requiring a complete VPC setup with public and private subnets across 3 availability zones. Infrastructure includes NAT Gateways for outbound connectivity, Internet Gateway for public access, and CloudWatch Logs for VPC Flow Logs. Deployment uses AWS CDK 2.x with TypeScript on Node.js 18.x or higher. AWS CLI must be configured with appropriate credentials. The VPC will host future ECS workloads and RDS databases in private subnets while ALBs operate in public subnets.

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
All resources should be deployed to: **ap-southeast-1**
