# AWS Production Infrastructure - Terraform HCL Requirements

## Project Overview

**Batch ID**: 1067  
**Project Name**: IaC - AWS Nova Model Breaking  
**Language**: HCL (HashiCorp Configuration Language)  
**Platform**: Terraform  
**Environment**: Production  
**Difficulty**: Medium  
**Reference**: https://github.com/hashicorp/terraform-examples

## Problem Statement

Configure a production-level AWS environment using Terraform that includes a VPC with public and private subnets spread across availability zones in a specified region. Implement comprehensive security measures for all resources to comply with AWS best practices in a production environment.

## Core Infrastructure Requirements

### Virtual Private Cloud Configuration

The VPC must be configured with specific networking parameters to support production workloads:

- **CIDR Block**: Must use `10.0.0.0/16` (mandatory requirement)
- **DNS Support**: Enable DNS hostnames and resolution for service discovery
- **Production Grade**: Design must support high availability and scalability
- **Single File**: All resources defined in one HCL file executable with `terraform apply`

### Subnet Architecture Requirements

The subnet design must follow these specifications:

**Public Subnets**
- Minimum 2 public subnets required
- Equal distribution across 2 Availability Zones
- Direct internet connectivity via Internet Gateway
- Support for internet-facing resources such as load balancers and bastion hosts

**Private Subnets**
- Minimum 2 private subnets required  
- Equal distribution across 2 Availability Zones
- Outbound internet access via NAT Gateways only
- Host application servers, databases, and internal resources

### Internet Connectivity Requirements

**Internet Gateway Implementation**
- Deploy single Internet Gateway for public subnet internet access
- Configure proper routing for bi-directional internet connectivity
- Support inbound connections to public resources

**NAT Gateway Configuration**
- Deploy NAT Gateways in public subnets for private subnet internet access
- Enable outbound internet connectivity for private subnet instances
- High availability configuration across multiple availability zones

### Security Requirements

**SSH Access Control**
- SSH access must be restricted to specific IP range only
- Allowed CIDR block: `203.0.113.0/24` (example IP range)
- Implementation through security group rules with strict source restrictions
- No SSH access from `0.0.0.0/0` or broader ranges allowed

**Security Group Implementation**
- Comprehensive security groups for resource access control
- Follow principle of least privilege access
- Separate security groups for different resource tiers
- Proper ingress and egress rules with appropriate protocols and ports

**Bastion Host Requirements**
- Deploy bastion host in public subnet for secure private network access
- Bastion host serves as secure gateway for accessing private subnet resources
- Proper security group configuration for controlled access
- SSH key pair configuration for authentication

### Storage Security Requirements

**S3 Bucket Configuration**
- All S3 buckets must have Block Public Access settings enabled
- Default security configuration to prevent accidental public exposure
- Production-grade data protection measures
- Versioning enabled for data recovery capabilities

### Resource Tagging Requirements

**Mandatory Tagging**
- All resources must be tagged with `Environment: Production`
- Consistent tagging strategy across all infrastructure components
- Support resource management and cost tracking requirements
- Additional operational tags for resource identification

## Technical Constraints and Standards

### Infrastructure as Code Constraints

**File Structure Requirements**
- Single HCL file containing all resource definitions
- Configuration must be executable with `terraform apply` command
- Must pass all AWS best practices validation checks
- Production environment standards compliance

### Network Architecture Constraints

**Availability Zone Distribution**
- Resources must be distributed across exactly 2 availability zones
- Efficient IP address space utilization within `10.0.0.0/16` CIDR
- Proper route table configuration for public and private subnets
- Network-level security with appropriate access controls

### Security and Compliance Constraints

**Access Control Implementation**
- Strict access controls using security groups with least privilege
- SSH access limited to authorized IP ranges only  
- S3 buckets configured with Block Public Access enabled
- Clear network segmentation between public and private resources

**Production Security Standards**
- AWS security best practices implementation
- Production-grade security controls and monitoring
- Comprehensive access restrictions and audit capabilities
- Data protection measures for sensitive information

## Expected Infrastructure Components

### Core Networking Components

The infrastructure must include these networking elements:

**VPC Infrastructure**
- VPC with specified CIDR block and DNS support
- Internet Gateway for public internet access  
- NAT Gateways for private subnet internet connectivity
- Route tables with proper subnet associations

**Subnet Configuration**
- 2 public subnets distributed across 2 availability zones
- 2 private subnets distributed across 2 availability zones
- Appropriate CIDR block allocation within VPC range
- Proper subnet tagging for identification and management

### Security Infrastructure

**Security Groups**
- Bastion host security group with restricted SSH access
- Private instance security group with controlled access
- Web tier security group for HTTP/HTTPS traffic (if applicable)
- Database tier security group for database access (if applicable)

**Access Control**
- Bastion host for secure access to private network resources
- SSH key pairs for secure authentication
- Security group rules implementing principle of least privilege
- Network ACLs for additional security layer (optional)

### Storage Infrastructure

**S3 Bucket Configuration**
- Application logs storage bucket with versioning
- Backup storage bucket for data protection
- Block Public Access enabled on all buckets
- Appropriate bucket policies for access control

## Architecture Design Requirements

### High Availability Design

**Multi-AZ Distribution**
- Resources distributed across 2 availability zones minimum
- Redundant components for fault tolerance
- Architecture designed to handle single AZ failures
- Load balancing capability across availability zones

### Security Architecture  

**Defense in Depth**
- Multiple layers of security controls implemented
- Network segmentation between public and private tiers
- Access controls at network and resource levels
- Monitoring and logging capabilities for security events

### Scalability Features

**Growth Planning**
- Efficient IP address allocation for future expansion
- Architecture supports horizontal and vertical scaling
- Resource sizing appropriate for production workloads
- Integration points for additional services and components

## Success Criteria and Validation

### Functional Requirements Validation

The deployment must meet these functional criteria:

- VPC created with CIDR block `10.0.0.0/16`
- Minimum 2 public and 2 private subnets across 2 availability zones
- Internet Gateway providing public subnet connectivity
- NAT Gateways enabling private subnet internet access  
- Bastion host deployed in public subnet with proper configuration
- Security groups implementing required access controls
- SSH access restricted to `203.0.113.0/24` CIDR block
- S3 buckets with Block Public Access enabled
- All resources tagged with `Environment: Production`

### Technical Requirements Validation

The implementation must satisfy these technical standards:

- Single HCL file implementation that executes successfully
- Terraform configuration compatible with `terraform apply`
- AWS best practices compliance verification
- Production-grade architecture and resource configuration
- High availability design with multi-AZ distribution
- Comprehensive security implementation and access controls

### Operational Requirements Validation

The solution must provide these operational capabilities:

- Resource tagging for operational excellence and cost management
- Clear resource naming and organizational structure
- Proper documentation and configuration comments
- Deployment validation and testing procedures
- Monitoring and alerting integration points

## Deployment and Testing Requirements

### Deployment Validation

The configuration must execute successfully through these steps:

```bash
terraform init
terraform validate  
terraform plan
terraform apply
```

All resources must be provisioned without errors and infrastructure must pass AWS best practices validation checks.

### Security Validation

Security controls must be verified through these checks:

- SSH access verification limited to specified IP range
- Security group rule validation for proper access controls
- S3 bucket public access verification (should be blocked)
- Bastion host configuration verification for secure access
- Network segmentation validation between public and private resources

### Architecture Validation

Infrastructure design must be confirmed through these validations:

- Resource distribution across multiple availability zones
- Proper network connectivity for both public and private subnets
- Internet connectivity working correctly for all subnet types
- Resource tagging and organizational compliance
- Production readiness assessment for all components

This specification provides the complete requirements for implementing production-grade AWS infrastructure using Terraform HCL, ensuring security, scalability, and operational excellence standards are met.