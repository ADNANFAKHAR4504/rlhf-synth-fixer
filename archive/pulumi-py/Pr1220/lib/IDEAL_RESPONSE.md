# AWS High-Availability  Infrastructure with Pulumi

This solution implements a robust, high-availability AWS infrastructure in the us-west-2 region using Pulumi Python. The architecture consists of two separate VPCs with complete networking, load balancing, and auto-scaling capabilities.

## Architecture Overview

- **Two VPCs** with non-overlapping CIDR blocks (10.0.0.0/16 and 10.1.0.0/16)
- **Multi-AZ deployment** across us-west-2a and us-west-2b
- **4 subnets per VPC** (2 public, 2 private) for high availability
- **Application Load Balancers** in each VPC handling HTTP/HTTPS traffic
- **Auto Scaling Groups** with minimum 2 instances per VPC
- **Security groups** implementing least privilege access
- **Comprehensive tagging** for resource management

## Key Implementation Features

### TapStack Component Design
- Preserved original TapStack/TapStackArgs structure 
- Encapsulated all infrastructure resources within the component
- Fixed AWS provider region to us-west-2 as required
- Comprehensive resource exports for integration testing

### High Availability Features
- **Dual VPC Setup**: Complete isolation between primary and secondary VPCs
- **Multi-AZ NAT Gateways**: One NAT gateway per availability zone for redundancy
- **Separate Route Tables**: Individual route tables for each private subnet/AZ
- **Auto Scaling**: Minimum 2 instances per VPC with automatic health checks

### Security Implementation
- **ALB Security Group**: HTTP/HTTPS access from internet only
- **Public Instance Security Group**: HTTP/HTTPS access from ALB only  
- **Private Instance Security Group**: SSH access from public instances only
- **VPC Isolation**: Complete network separation between VPCs

### Infrastructure Components

#### VPC Resources (per VPC)
- VPC with DNS support and hostnames enabled
- Internet Gateway for public subnet access
- 2 Public subnets (one per AZ) with auto-assign public IP
- 2 Private subnets (one per AZ) 
- 2 NAT Gateways with Elastic IPs (one per AZ)
- Public route table with internet gateway route
- Private route tables with NAT gateway routes

#### Load Balancing
- Application Load Balancer in public subnets
- Target groups with health checks (HTTP path="/", 200 response)
- HTTP listeners forwarding traffic to target groups
- Integration with Auto Scaling Groups

#### Auto Scaling
- Launch templates using Amazon Linux 2023 AMI
- Instance type: t3.micro
- User data script installing Apache HTTP server
- Auto Scaling Groups with 2-6 instance range
- ELB health checks with 300-second grace period

#### Resource Exports
- Complete export of all resource IDs/ARNs/DNS names
- ALB URLs for easy access testing
- VPC and subnet IDs for integration
- Security group IDs for reference

## Code Structure

The solution uses a modular approach with helper methods:

- `_create_vpc_block()`: Creates complete VPC infrastructure
- `_create_security_groups()`: Creates all required security groups  
- `_create_alb()`: Creates load balancer, target groups, and listeners
- `_create_asg()`: Creates launch template and auto scaling group
- `_export_all()`: Exports all resource identifiers

## Deployment Considerations

- Fixed region provider ensures consistent us-west-2 deployment
- ENVIRONMENT_SUFFIX support for resource naming conflicts
- Comprehensive tagging for resource management
- No retention policies - all resources are destroyable
- Self-contained deployment requiring no external dependencies

## Testing Integration

The infrastructure exports flat outputs compatible with integration testing:
- ALB DNS names for connectivity testing
- VPC/subnet IDs for resource validation
- Security group IDs for access testing
- Instance identifiers for health validation

This solution provides a production-ready, scalable foundation that meets all high-availability requirements while maintaining clean architecture patterns.