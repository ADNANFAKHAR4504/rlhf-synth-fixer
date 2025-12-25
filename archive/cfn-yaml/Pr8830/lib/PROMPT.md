# Secure VPC Infrastructure for Financial Trading Platform

## Overview

Design and implement AWS network infrastructure for a financial trading platform requiring PCI-DSS compliance. The infrastructure must provide network segmentation with isolated environments for different workload tiers.

Implementation platform: CloudFormation with YAML syntax.

The architecture supports multi-tier application deployment with separation between web-facing resources, application servers, and database instances. Target region: us-east-1.

Primary technical challenge: Establish network foundation supporting trading platform operations while maintaining security boundaries through multi-availability zone deployment, tiered subnet architecture, and integrated connectivity infrastructure.

## Objective

Create production-ready VPC infrastructure using CloudFormation with YAML for multi-tier financial trading application. The infrastructure connects public-facing load balancers through Internet Gateway to private application servers that communicate with isolated database instances through controlled network paths.

### Core Networking Requirements

1. **VPC Foundation**
   - Create VPC with CIDR block 10.0.0.0/16
   - Enable DNS hostnames and DNS resolution for service discovery
   - Span across 3 availability zones in us-east-1

2. **Public Subnet Layer**
   - Deploy 3 public subnets across 3 availability zones
   - Use /24 CIDR blocks starting from 10.0.1.0 for 10.0.1.0/24, 10.0.2.0/24, and 10.0.3.0/24
   - Host load balancers and bastion hosts that connect to Internet Gateway
   - Internet Gateway attached to VPC provides external connectivity

3. **Private Subnet Layer**
   - Deploy 3 private subnets across 3 availability zones
   - Use /24 CIDR blocks starting from 10.0.11.0 for 10.0.11.0/24, 10.0.12.0/24, and 10.0.13.0/24
   - Application servers send outbound traffic through NAT Gateways
   - Receive traffic from public subnet load balancers
   - Connect to database subnets for data persistence

4. **Database Subnet Layer**
   - Deploy 3 database subnets across 3 availability zones
   - Use /24 CIDR blocks starting from 10.0.21.0 for 10.0.21.0/24, 10.0.22.0/24, and 10.0.23.0/24
   - RDS instances accept connections only from private subnet application servers
   - Isolated from direct internet access through routing rules

5. **Internet Connectivity**
   - Internet Gateway attached to VPC for public subnet internet access
   - Create 3 NAT Gateways deployed in public subnets with Elastic IPs
   - NAT Gateways provide outbound internet for private and database subnets
   - Each availability zone uses dedicated NAT Gateway for traffic

6. **Routing Configuration**
   - Public subnet route tables direct traffic to Internet Gateway
   - Private subnet route tables send traffic through NAT Gateways
   - Database subnet route tables route through NAT Gateways
   - Route tables associated with subnets control traffic flow
   - Follow naming pattern using VPC name, subnet type, route table, and availability zone

7. **Network Access Control**
   - Network ACLs configured with deny-by-default policy
   - Public subnet ACLs allow HTTP/HTTPS ingress from internet
   - Private subnet ACLs permit traffic from public subnets and to database subnets
   - Database subnet ACLs allow connections only from private subnets
   - Explicit allow rules for required traffic patterns

8. **Monitoring and Logging**
   - VPC Flow Logs enabled for network traffic analysis
   - Flow logs send data to CloudWatch Logs for centralized monitoring
   - Log retention configured for 7 days
   - CloudWatch integration provides visibility into network patterns

9. **Stack Outputs**
   - Export VPC ID for cross-stack references
   - Export subnet IDs grouped by type
   - Export NAT Gateway IDs for dependency management
   - Outputs enable integration with application stacks

### Technical Requirements

- All infrastructure defined using CloudFormation with YAML
- VPC provides network foundation for multi-tier architecture
- EC2 services provide NAT Gateway and Internet Gateway connectivity
- CloudWatch receives VPC Flow Logs for monitoring
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention using resource type and environment suffix
- Deploy to us-east-1 region

### Constraints

- VPC CIDR must be 10.0.0.0/16 with no overlapping subnets
- Public subnets allocated as 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- Private subnets allocated as 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- Database subnets allocated as 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
- NAT Gateways must be in separate Availability Zones
- Route tables follow naming pattern using VPC name, subnet type, and AZ
- Network ACLs deny all by default with explicit allows only
- All resources must be destroyable with no Retain policies
- Include proper error handling and logging
- Tag all resources with Environment, Project, and CostCenter
- PCI-DSS compliant network segmentation
- Encryption at rest using AWS KMS for data protection
- Encryption in transit using TLS/SSL for network security
- Follow principle of least privilege for access control
- CloudWatch logging and monitoring enabled throughout

## Success Criteria

- Functionality: CFN template deploys successfully with all 9 networking requirements
- Performance: Infrastructure supports multi-tier application with proper routing
- Reliability: Resources deployed across 3 availability zones with NAT Gateway redundancy
- Security: PCI-DSS compliant network segmentation with proper ACLs and encryption
- Resource Naming: All resources include environmentSuffix parameter for unique naming
- Code Quality: YAML format, well-tested with 90%+ coverage, fully documented
- Destroyability: All resources can be cleanly deleted without retention policies
- Monitoring: VPC Flow Logs enabled and sending to CloudWatch with 7-day retention
- Network ACLs: Deny-by-default with explicit allows following least privilege

## Deliverables

- Complete CFN YAML template implementation
- VPC with DNS enabled for 10.0.0.0/16 address space
- 3 public subnets with Internet Gateway connectivity
- 3 private subnets with NAT Gateway connectivity
- 3 database subnets with controlled access from application tier
- Network ACLs implementing security controls
- VPC Flow Logs with CloudWatch integration
- Unit tests for all components
- Documentation and deployment instructions
- Stack outputs for cross-stack references
