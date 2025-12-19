# VPC Infrastructure for Digital Banking Platform

Hey team,

We need to build a secure network foundation for our new digital banking platform. The business has asked us to create this infrastructure using **CloudFormation with JSON** to support both our public-facing web applications and internal backend services. They're really focused on security and compliance, so we need to ensure proper network isolation and strict security boundaries.

The platform will handle sensitive financial data, so we need a multi-AZ setup for high availability. The architecture team has specified we should use NAT instances instead of NAT Gateways to keep costs under control, especially since this is going into production across multiple environments.

## What we need to build

Create a production-ready VPC infrastructure using **CloudFormation with JSON** for a financial services digital banking platform.

### Core Requirements

1. **VPC Configuration**
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames for service discovery
   - Deploy across us-east-1 region
   - Resource names must include environmentSuffix for uniqueness
   - Follow naming convention: vpc-environment-suffix

2. **Public Subnet Architecture**
   - Deploy 3 public subnets across 3 availability zones
   - Public subnet 1: 10.0.1.0/24
   - Public subnet 2: 10.0.2.0/24
   - Public subnet 3: 10.0.3.0/24
   - These subnets will host internet-facing resources
   - Include environmentSuffix in all subnet names

3. **Private Subnet Architecture**
   - Deploy 3 private subnets across 3 availability zones
   - Private subnet 1: 10.0.11.0/24
   - Private subnet 2: 10.0.12.0/24
   - Private subnet 3: 10.0.13.0/24
   - These subnets will host backend services
   - Include environmentSuffix in all subnet names

4. **Internet Connectivity**
   - Create and attach Internet Gateway to VPC
   - Configure public route tables to route traffic to IGW
   - Ensure proper route propagation
   - Include environmentSuffix in resource names

5. **NAT Instance Configuration**
   - Launch NAT instances using t3.micro instance type
   - Use latest Amazon Linux 2 AMI
   - Deploy in public subnets for internet access
   - Configure source/destination check disable
   - Include environmentSuffix in instance names

6. **Routing Configuration**
   - Public subnets route to Internet Gateway
   - Private subnets route to NAT instances for outbound traffic
   - Separate route tables for public and private subnets
   - Proper subnet associations
   - Include environmentSuffix in route table names

7. **Security Groups**
   - Create security group for NAT instances
   - Allow HTTP (port 80) from private subnet CIDR ranges
   - Allow HTTPS (port 443) from private subnet CIDR ranges
   - Deny all other inbound traffic by default
   - Allow all outbound traffic for internet access
   - Include environmentSuffix in security group names

8. **Stack Outputs**
   - Output VPC ID for reference by other stacks
   - Output all public subnet IDs
   - Output all private subnet IDs
   - Output NAT instance IDs
   - Output security group IDs

9. **Parameterization**
   - Parameter for environment name with allowed values
   - Parameter for cost center with allowed values
   - Support multi-environment deployment

10. **Optional Enhancements**
    - VPC Flow Logs to S3 bucket for security monitoring
    - Systems Manager Session Manager for NAT instances (secure access without SSH)
    - CloudWatch alarms for NAT instance health monitoring

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** for network foundation
- Use **EC2** for NAT instances
- Optionally use **S3** for VPC Flow Logs
- Optionally use **SSM** for Session Manager
- Optionally use **CloudWatch** for monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-environment-suffix
- Deploy to **us-east-1** region
- All resources must be destroyable (DeletionPolicy: Delete)
- No Retain policies allowed

### Constraints

- VPC must use CIDR block 10.0.0.0/16 exactly
- Must span exactly 3 availability zones
- Use NAT instances (not NAT Gateway) for cost control
- Security groups must deny all traffic by default
- Only open necessary ports (HTTP/HTTPS) from private subnets
- All resources must be tagged with Environment, Project, and CostCenter
- CloudFormation stack must support clean rollback
- All resources must have DeletionPolicy set to Delete
- Include proper error handling and outputs for debugging

## Success Criteria

- **Functionality**: VPC with proper network segmentation across 3 AZs
- **Performance**: NAT instances properly configured for private subnet internet access
- **Reliability**: Multi-AZ deployment with proper route table configuration
- **Security**: Strict security group rules, proper network isolation
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: Valid CloudFormation JSON, well-structured, documented

## What to deliver

- Complete CloudFormation JSON template
- VPC with DNS hostnames enabled
- 3 public subnets and 3 private subnets across 3 AZs
- Internet Gateway with proper routing
- NAT instances on Amazon Linux 2 with t3.micro
- Security groups with restricted access
- Route tables configured for public and private subnets
- Stack outputs for all critical resource IDs
- Parameters for environment and cost center
- Optional VPC Flow Logs, SSM, and CloudWatch monitoring
- Documentation and deployment instructions
