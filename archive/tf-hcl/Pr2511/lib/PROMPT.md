# AWS Terraform HCL Multi-Region High Availability Infrastructure

**Problem ID:** `MultiRegion_HA_Terraform_HCL`

You are a senior AWS Solutions Architect specializing in high availability and disaster recovery. Your task is to design and implement a highly available, fault-tolerant web application infrastructure using Terraform HCL format. The system must maintain operations during EC2 instance failures and automatically recover within 5 minutes.

## Objective

Create a production-ready, multi-region AWS infrastructure that ensures uninterrupted service delivery across us-east-1 and us-west-2 regions. The solution must leverage AWS Auto Scaling Groups, Elastic Load Balancers, and Route 53 for seamless failover and traffic distribution.

Infrastructure Requirements

1. Multi-Region Architecture

- **Primary Region:** us-east-1
- **Secondary Region:** us-west-2
- **Cross-Region Failover:** Route 53 DNS failover routing policies
- **Recovery Time Objective:** 5 minutes maximum

### 2. Auto Scaling Groups (ASG)

- Deploy ASGs in both us-east-1 and us-west-2 regions
- Configure health checks to detect EC2 instance failures
- Set minimum, desired, and maximum capacity for each ASG
- Implement automatic instance replacement within 5 minutes
- Use launch templates with latest Amazon Linux 2 AMI

### 3. Elastic Load Balancers (ELB)

- Application Load Balancers (ALB) in each region
- Configure health checks with appropriate thresholds
- Enable cross-zone load balancing
- Set up HTTPS listeners with SSL/TLS certificates
- Implement proper security groups for ALB access

### 4. Route 53 DNS Management

- Primary domain routing to us-east-1 region
- Failover routing policy for automatic traffic redirection
- Health checks for both regions
- DNS failover to us-west-2 when us-east-1 is unavailable
- TTL settings optimized for quick failover

### 5. Networking Infrastructure

- VPC in each region with public and private subnets
- Internet Gateways for public subnets
- NAT Gateways for private subnet internet access
- Security groups with least privilege access
- Route tables properly configured

### 6. Monitoring and Logging

- CloudWatch alarms for ASG health metrics
- SNS notifications for critical events
- CloudTrail for API call logging
- VPC Flow Logs for network traffic monitoring

## Technical Constraints

### Terraform HCL Requirements

- **Format:** HCL (HashiCorp Configuration Language) only
- **Single Configuration:** All resources in one comprehensive main.tf file
- **Variables:** Environment name, instance types, capacity settings
- **Outputs:** Load balancer DNS names, ASG names, Route 53 hosted zone ID
- **Tags:** Proper resource tagging for cost management and organization

### Security Requirements

- All EC2 instances in private subnets
- Security groups with minimal required access
- IAM roles with least privilege permissions
- Encryption at rest and in transit
- VPC endpoints for AWS service access

### Performance Requirements

- Auto Scaling Groups respond to CPU utilization
- Load balancer health checks every 30 seconds
- Route 53 health checks every 30 seconds
- DNS failover within 60 seconds
- Instance replacement within 5 minutes

## Expected Output

Your response must be a **single Terraform HCL configuration** that includes:

1. **Variables section** with configurable values
2. **Resources section** with all required AWS resources
3. **Outputs section** with essential information
4. **Data sources** for dynamic resource references
5. **Locals section** for computed values and region-specific configurations

The configuration should be:

- Self-contained and deployable
- Well-commented with clear resource descriptions
- Following Terraform and AWS best practices
- Compliant with the specified recovery time objectives
- Ready for production deployment

## Success Criteria

The infrastructure will be tested for:

- Automatic recovery from EC2 instance failures within 5 minutes
- Seamless traffic failover between regions
- Proper load balancing across healthy instances
- DNS failover functionality during regional outages
- Monitoring and alerting system effectiveness

Provide a complete, production-ready Terraform HCL configuration that meets all requirements and can be deployed immediately to create the specified multi-region high availability infrastructure.

# Note-create complete infrastructure with in the tap_stack.tf single file

# AWS Terraform HCL Multi-Region High Availability Infrastructure

**Problem ID:** `MultiRegion_HA_Terraform_HCL`

You are a senior AWS Solutions Architect specializing in high availability and disaster recovery. Your task is to design and implement a highly available, fault-tolerant web application infrastructure using Terraform HCL format. The system must maintain operations during EC2 instance failures and automatically recover within 5 minutes.

## Objective

Create a production-ready, multi-region AWS infrastructure that ensures uninterrupted service delivery across us-east-1 and us-west-2 regions. The solution must leverage AWS Auto Scaling Groups, Elastic Load Balancers, and Route 53 for seamless failover and traffic distribution.

## Infrastructure Requirements

### 1. Multi-Region Architecture

- **Primary Region:** us-east-1
- **Secondary Region:** us-west-2
- **Cross-Region Failover:** Route 53 DNS failover routing policies
- **Recovery Time Objective:** 5 minutes maximum

### 2. Auto Scaling Groups (ASG)

- Deploy ASGs in both us-east-1 and us-west-2 regions
- Configure health checks to detect EC2 instance failures
- Set minimum, desired, and maximum capacity for each ASG
- Implement automatic instance replacement within 5 minutes
- Use launch templates with latest Amazon Linux 2 AMI

### 3. Elastic Load Balancers (ELB)

- Application Load Balancers (ALB) in each region
- Configure health checks with appropriate thresholds
- Enable cross-zone load balancing
- Set up HTTPS listeners with SSL/TLS certificates
- Implement proper security groups for ALB access

### 4. Route 53 DNS Management

- Primary domain routing to us-east-1 region
- Failover routing policy for automatic traffic redirection
- Health checks for both regions
- DNS failover to us-west-2 when us-east-1 is unavailable
- TTL settings optimized for quick failover

### 5. Networking Infrastructure

- VPC in each region with public and private subnets
- Internet Gateways for public subnets
- NAT Gateways for private subnet internet access
- Security groups with least privilege access
- Route tables properly configured

### 6. Monitoring and Logging

- CloudWatch alarms for ASG health metrics
- SNS notifications for critical events
- CloudTrail for API call logging
- VPC Flow Logs for network traffic monitoring

## Technical Constraints

### Terraform HCL Requirements

- **Format:** HCL (HashiCorp Configuration Language) only
- **Single Configuration:** All resources in one comprehensive main.tf file
- **Variables:** Environment name, instance types, capacity settings
- **Outputs:** Load balancer DNS names, ASG names, Route 53 hosted zone ID
- **Tags:** Proper resource tagging for cost management and organization

### Security Requirements

- All EC2 instances in private subnets
- Security groups with minimal required access
- IAM roles with least privilege permissions
- Encryption at rest and in transit
- VPC endpoints for AWS service access

### Performance Requirements

- Auto Scaling Groups respond to CPU utilization
- Load balancer health checks every 30 seconds
- Route 53 health checks every 30 seconds
- DNS failover within 60 seconds
- Instance replacement within 5 minutes

## Expected Output

Your response must be a **single Terraform HCL configuration** that includes:

1. **Variables section** with configurable values
2. **Resources section** with all required AWS resources
3. **Outputs section** with essential information
4. **Data sources** for dynamic resource references
5. **Locals section** for computed values and region-specific configurations

The configuration should be:

- Self-contained and deployable
- Well-commented with clear resource descriptions
- Following Terraform and AWS best practices
- Compliant with the specified recovery time objectives
- Ready for production deployment

## Success Criteria

The infrastructure will be tested for:

- Automatic recovery from EC2 instance failures within 5 minutes
- Seamless traffic failover between regions
- Proper load balancing across healthy instances
- DNS failover functionality during regional outages
- Monitoring and alerting system effectiveness

Provide a complete, production-ready Terraform HCL configuration that meets all requirements and can be deployed immediately to create the specified multi-region high availability infrastructure.

Note-create complete infrastructure with in the tap_stack.tf single file

> > > > > > > 6e6784cd0278c05a41032e301cba396a1dc2a4be
