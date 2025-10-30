# Cloud Environment Setup

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cfn with json**
> 
> Platform: **cfn**  
> Language: **json**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

```json
{background: A fintech startup needs to establish a secure network foundation in AWS for their payment processing application. The infrastructure must comply with PCI-DSS requirements for network segmentation and access control., constraints: {count: 6, items: [VPC CIDR must be 10.0.0.0/16 to align with corporate network standards, Public subnets must use the first /24 blocks in each AZ (10.0.1.0/24, 10.0.2.0/24), Private subnets must use /24 blocks starting from 10.0.10.0/24, All resources must be tagged with Environment, Project, and ManagedBy tags, NAT Gateways must have Elastic IPs with specific Name tags, Route tables must have explicit names following the pattern: {vpc-name}-{public|private}-rt-{az}]}, environment: AWS VPC infrastructure in us-east-1 region with multi-AZ deployment across 2 availability zones. Requires Terraform 1.5+ with AWS provider 5.0+. Creates a standard 3-tier network architecture with public subnets for load balancers, private subnets for application servers, and database subnets for RDS instances. Includes NAT Gateways in each AZ for high availability outbound internet access from private subnets. Internet Gateway for inbound public traffic. Full route table configuration with proper associations., problem: Create a Terraform configuration to deploy a production-ready VPC with proper network segmentation. The configuration must: 1. Create a VPC with CIDR 10.0.0.0/16 and enable DNS hostnames and DNS support. 2. Deploy 2 public subnets across 2 availability zones using 10.0.1.0/24 and 10.0.2.0/24. 3. Deploy 2 private subnets across the same AZs using 10.0.10.0/24 and 10.0.11.0/24. 4. Create an Internet Gateway and attach it to the VPC. 5. Deploy NAT Gateways in each public subnet with Elastic IPs. 6. Configure route tables for public subnets with routes to the Internet Gateway. 7. Configure route tables for private subnets with routes to the respective NAT Gateway in the same AZ. 8. Apply proper tags to all resources including Environment=production, Project=payment-platform, and ManagedBy=terraform. 9. Output the VPC ID, subnet IDs, and NAT Gateway IPs for reference. Expected output: A fully functional multi-AZ VPC with proper routing that allows resources in private subnets to access the internet through NAT Gateways while maintaining security isolation., input_file: null}
```

---

## Additional Context

### Background
A fintech startup needs to establish a secure network foundation in AWS for their payment processing application. The infrastructure must comply with PCI-DSS requirements for network segmentation and access control.

### Constraints and Requirements
- 1. VPC CIDR must be 10.0.0.0/16 to align with corporate network standards

### Environment Setup
AWS VPC infrastructure in us-east-1 region with multi-AZ deployment across 2 availability zones. Requires Terraform 1.5+ with AWS provider 5.0+. Creates a standard 3-tier network architecture with public subnets for load balancers, private subnets for application servers, and database subnets for RDS instances. Includes NAT Gateways in each AZ for high availability outbound internet access from private subnets. Internet Gateway for inbound public traffic. Full route table configuration with proper associations.

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
