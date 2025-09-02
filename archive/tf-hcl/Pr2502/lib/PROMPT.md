# AWS Web Application Infrastructure Requirements

We need to build a production web application infrastructure on AWS using Terraform. This deployment needs to handle real traffic and be reliable enough for business operations.

## Project Overview

The goal is creating a complete, highly available web application stack that scales automatically with demand. Everything should be built with infrastructure as code principles and be ready for production use.

## Infrastructure Requirements

### Networking
- VPC with proper segmentation using public and private subnets
- Two public subnets and two private subnets for high availability
- NAT Gateways for private subnet internet access
- Internet Gateway for public subnet connectivity
- Route tables configured for proper traffic flow

### Compute
- EC2 instances for web application hosting
- Auto Scaling Group to maintain availability and handle traffic spikes
- Elastic Load Balancer for traffic distribution
- Launch template with user data for instance setup

### Security
- Security Groups allowing HTTP traffic and SSH access
- IAM Role for EC2 instances with S3 read access to 'app-config-bucket'
- EBS volume encryption for all storage
- Security configurations following best practices

### Monitoring
- CloudWatch alarm triggering at 70% CPU utilization
- Integration with Auto Scaling for automatic instance scaling
- Performance monitoring setup

## Configuration Requirements

### Regional Settings
- Deploy in us-east-1 region
- Resource tagging: Environment=Production, CostCenter=1234

### Code Structure
- Parameterized configuration for different environments
- Use of Terraform variables, locals, and data sources
- Modular organization (networking, compute, security files)
- Variables file for customization
- Outputs file for resource information export

## Design Principles

The infrastructure must prioritize:
- High availability across multiple availability zones
- Security by default with no compromised configurations
- Automatic scalability for traffic growth
- Cost optimization without over-provisioning
- Clean, maintainable code

## Technical Specifications

### VPC Configuration
- CIDR block allowing for future expansion
- Public subnets for load balancers and NAT gateways
- Private subnets for application servers

### Scaling Configuration
- Auto Scaling policies responding to CloudWatch metrics
- Policies that work effectively in production environments

## Deliverables Expected

Complete Terraform configuration that creates a working web application infrastructure with `terraform apply`. The code should be:

- Well-organized and modular
- Flexible for multiple environments (dev, staging, prod)  
- Documented with clear architecture explanations
- Following Terraform best practices

## Additional Considerations

The application serves web traffic and needs dynamic scaling during peak usage while scaling down during quiet periods for cost management.

Guidance would be helpful on:
- AMI selection best practices
- Optimal instance types for web workloads  
- Security group configurations balancing security and functionality
- Proven Auto Scaling policies for production use