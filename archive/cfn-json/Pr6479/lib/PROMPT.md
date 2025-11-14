Hey team,

We've got a financial services startup that needs to set up their transaction processing infrastructure on AWS. They're handling real financial transactions, so we need to be really careful about security and availability here. The business is asking for a rock-solid multi-AZ setup that can handle their growing transaction volume while meeting all the compliance requirements that come with financial services.

The application is pretty straightforward - a web tier that takes customer requests and a backend API that processes the actual financial transactions. But here's the thing: they need it to be highly available across multiple availability zones, and they're very particular about security. We're talking database encryption, secrets rotation, HTTPS everywhere, and proper network isolation.

I've been asked to build this using **CloudFormation with JSON** since that's what their ops team is most comfortable with for production deployments. They want everything infrastructure-as-code so they can replicate this setup as they expand to other regions.

## What we need to build

Create a highly available web application infrastructure using **CloudFormation with JSON** for a financial services transaction processing system deployed in us-east-1.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 3 public subnets and 3 private subnets across 3 availability zones
   - NAT Gateways in each AZ for outbound internet access from private subnets
   - VPC Flow Logs enabled and sent to CloudWatch Logs with 30-day retention

2. **Database Layer**
   - RDS Aurora MySQL cluster with one writer instance and one reader instance
   - Database credentials stored in Secrets Manager with Lambda-based automatic rotation
   - Encrypted storage using customer-managed KMS keys
   - Deploy in database subnets for proper isolation

3. **Application Layer**
   - Auto Scaling Group with minimum 2, maximum 6 EC2 t3.medium instances
   - Instances deployed in private subnets across all 3 AZs
   - Amazon Linux 2023 as the base operating system
   - EC2 instances must use IMDSv2 exclusively

4. **Load Balancing**
   - Application Load Balancer deployed in public subnets
   - Target group with health checks configured
   - HTTPS-only connections with SSL termination
   - Distribute traffic across all availability zones

5. **Security Controls**
   - Security groups with explicit ingress and egress rules
   - Follow least-privilege principle (no 0.0.0.0/0 inbound rules)
   - All resources tagged with Environment, Project, and CostCenter
   - Resource names must include environmentSuffix for uniqueness

6. **Monitoring and Logging**
   - CloudWatch Logs for VPC Flow Logs
   - 30-day retention policy on logs
   - Proper CloudWatch integration for monitoring

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** for network isolation
- Use **RDS Aurora MySQL** for database with multi-AZ deployment
- Use **Application Load Balancer** for traffic distribution
- Use **Auto Scaling** for compute elasticity
- Use **EC2** t3.medium instances for application servers
- Use **Secrets Manager** for credential management with rotation
- Use **KMS** for encryption key management
- Use **CloudWatch** for logging and monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- Database credentials in Secrets Manager with automatic rotation enabled
- RDS encrypted storage with customer-managed KMS keys
- ALB must enforce HTTPS-only with SSL termination
- EC2 instances must use IMDSv2 exclusively
- All resources tagged with Environment, Project, CostCenter
- VPC Flow Logs enabled to CloudWatch with 30-day retention
- Security groups follow least-privilege (no 0.0.0.0/0 inbound)
- Stack must support blue-green deployments via parameter updates
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation

### Optional Enhancements

If time permits, consider adding:
- CloudFront distribution for static content caching
- AWS WAF rules on the Application Load Balancer
- Route 53 health checks with failover routing

## Success Criteria

- **Functionality**: All 8 mandatory requirements implemented and working
- **High Availability**: Resources deployed across 3 availability zones
- **Security**: All security constraints satisfied (encryption, secrets, IMDSv2, least-privilege)
- **Monitoring**: VPC Flow Logs and CloudWatch properly configured
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Deployability**: Stack can be deployed and destroyed cleanly
- **Blue-Green**: Parameter updates support blue-green deployment patterns
- **Code Quality**: Well-structured JSON, properly documented

## What to deliver

- Complete CloudFormation JSON implementation in template.json
- VPC with 3 public and 3 private subnets across 3 AZs
- RDS Aurora MySQL cluster (1 writer, 1 reader)
- Application Load Balancer with target groups
- Auto Scaling Group with EC2 instances
- NAT Gateways for outbound internet access
- Security groups with explicit rules
- Secrets Manager with Lambda rotation function
- KMS keys for encryption
- CloudWatch Logs with VPC Flow Logs
- Comprehensive tests validating all components
- Documentation and deployment instructions
