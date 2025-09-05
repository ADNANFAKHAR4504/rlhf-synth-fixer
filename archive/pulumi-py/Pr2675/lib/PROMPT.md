# AWS Web Application Infrastructure Deployment with Pulumi Python

## Overview
You need to create a production-ready AWS infrastructure using Pulumi Python that will host a web application with high availability and scalability. This infrastructure should follow AWS best practices and be designed for production workloads.

## What You Need to Build

### Core Infrastructure Components
- **Virtual Private Cloud (VPC)**: Create a VPC with CIDR block 10.0.0.0/16 that spans across two availability zones
- **Networking**: Set up both public and private subnets in each availability zone, with proper routing and internet connectivity
- **Internet Access**: Configure an Internet Gateway for public subnets and a NAT Gateway for private subnets to handle outbound internet traffic
- **Load Balancing**: Deploy an Application Load Balancer in the public subnets to distribute incoming web traffic

### Compute Resources
- **EC2 Instances**: Deploy web server instances in the private subnets (one per subnet initially)
- **Auto Scaling**: Implement Auto Scaling Groups to automatically scale the number of EC2 instances based on demand
- **Configuration Management**: Use AWS Systems Manager to manage and configure the EC2 instances

### Database Layer
- **RDS Instance**: Deploy a Multi-AZ RDS database instance in the private subnets for high availability
- **Security**: Ensure the database is not publicly accessible and follows security best practices

### Security & Configuration
- **Security Groups**: Create appropriate security groups for the load balancer, EC2 instances, and RDS database
- **Parameter Store**: Use AWS Systems Manager Parameter Store to manage environment-specific configuration settings
- **Access Control**: Implement proper inbound and outbound traffic rules for all components

## Technical Requirements

### Naming Convention
- Use "Prod" as the prefix for all resource names to clearly identify this as a production environment

### Network Architecture
- VPC must span exactly two availability zones
- Each zone should have both public and private subnets
- Public subnets need direct internet access via Internet Gateway
- Private subnets need internet access via NAT Gateway (deployed in one of the public subnets)
- Implement proper route tables for public and private routing

### High Availability Features
- Multi-AZ RDS deployment for database redundancy
- Auto Scaling Groups for automatic EC2 instance scaling
- Load balancer health checks and traffic distribution
- Cross-zone load balancing capabilities

### Security Considerations
- All resources should follow the principle of least privilege
- Security groups should only allow necessary traffic
- Database should be completely isolated from public access
- Use parameter store for sensitive configuration values

## Expected Deliverable
Create a valid Pulumi Python script named `tap_stack.py` that implements all the above requirements. The script should be production-ready, follow AWS best practices, and include proper error handling and resource dependencies.

## Additional Notes
- Ensure all resources have appropriate tags for cost tracking and management
- Implement proper resource cleanup and dependency management
- Consider cost optimization while maintaining high availability
- The infrastructure should be easily maintainable and scalable for future growth