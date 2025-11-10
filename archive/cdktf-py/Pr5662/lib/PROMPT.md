# Setting Up Production VPC for Payment Gateway

Hey team,

We need to build a secure network foundation for our new payment processing application in AWS. I've been asked to create this using **CDKTF with Python**. The business wants a production-ready VPC environment with proper network segmentation that provides isolation for sensitive payment workloads while maintaining controlled internet access.

We're working with a fintech startup that's establishing their AWS environment for payment processing. The infrastructure needs to handle network isolation for sensitive workloads while maintaining controlled internet access for software updates and API integrations with external payment providers. All of this needs to be deployed to the Tokyo region (ap-northeast-1) for low latency to our Asia-Pacific customers.

The architecture should follow standard AWS best practices with public subnets for load balancers and private subnets for application servers. We need to be cost-conscious, so we'll use a single NAT Gateway instead of one per availability zone. Everything must be logged for compliance purposes since we're handling financial transactions.

## What we need to build

Create a production-ready VPC infrastructure using **CDKTF with Python** for a payment gateway application that provides network isolation and controlled internet access.

### Core Requirements

1. **VPC Foundation**
   - Create VPC with CIDR block 10.0.0.0/16
   - Span across 3 availability zones in ap-northeast-1
   - Enable DNS hostnames and DNS support

2. **Public Subnet Configuration**
   - Create 3 public subnets for load balancers
   - Subnet CIDR blocks: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Deploy Internet Gateway for public internet access
   - Configure route tables to route 0.0.0.0/0 to Internet Gateway

3. **Private Subnet Configuration**
   - Create 3 private subnets for application servers
   - Subnet CIDR blocks: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - Deploy single NAT Gateway in first public subnet (ap-northeast-1a)
   - Configure route tables to route 0.0.0.0/0 to NAT Gateway
   - Explicit route table associations (no default routes)

4. **VPC Endpoints**
   - Create S3 VPC endpoint (Gateway type)
   - Associate with private subnet route tables
   - Enable private subnet access to S3 without internet

5. **Network Monitoring**
   - Enable VPC Flow Logs to CloudWatch
   - Set aggregation interval to 5 minutes
   - Create CloudWatch Log Group for flow logs
   - Set log retention to 7 days

6. **Resource Tagging**
   - Tag all resources with Environment=Production
   - Tag all resources with Project=PaymentGateway
   - Include environment_suffix in resource names

7. **Stack Outputs**
   - Export VPC ID as CloudFormation output
   - Export all public subnet IDs
   - Export all private subnet IDs
   - Export NAT Gateway ID
   - Export S3 endpoint ID

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **VPC** for network foundation
- Use **Internet Gateway** for public subnet internet access
- Use **NAT Gateway** with Elastic IP for private subnet internet access
- Use **Route Tables** with explicit subnet associations
- Use **VPC Flow Logs** with CloudWatch integration
- Use **S3 VPC Endpoint** (Gateway type) for private S3 access
- Resource names must include **environment_suffix** variable for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **ap-northeast-1** region
- NAT Gateway must be in ap-northeast-1a availability zone only

### Constraints

- Cannot use NAT instances - must use managed NAT Gateway service
- NAT Gateway must be deployed only in first public subnet for cost control
- All subnet CIDR blocks must be exactly as specified (no variations)
- VPC Flow Logs retention must be exactly 7 days
- Route table associations must be explicit, not using default routes
- All resources must be destroyable (no Retain policies or DeletionProtection)
- Include proper IAM roles for VPC Flow Logs with least privilege
- Enable encryption where applicable

## Success Criteria

- **Functionality**: VPC with proper network segmentation across 3 AZs
- **Networking**: Private subnets can reach internet through NAT Gateway
- **Security**: Private subnets remain inaccessible from public internet
- **Monitoring**: All network traffic logged to CloudWatch with 5-minute intervals
- **Compliance**: VPC Flow Logs retained for 7 days
- **Optimization**: Single NAT Gateway for cost control
- **Integration**: S3 VPC endpoint enables private S3 access without internet
- **Resource Naming**: All resources include environment_suffix variable
- **Code Quality**: Python code, well-structured, properly documented

## What to deliver

- Complete CDKTF Python implementation with all components
- VPC with Internet Gateway and NAT Gateway
- 3 public subnets and 3 private subnets with explicit CIDR blocks
- Route tables with explicit associations
- VPC Flow Logs with CloudWatch Log Group
- S3 VPC Endpoint for private subnet access
- CloudFormation outputs for cross-stack references
- IAM roles for VPC Flow Logs
- Unit tests for all components
- Integration tests validating deployed resources
- Documentation with deployment instructions
