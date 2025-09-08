# Cloud Infrastructure Setup with Pulumi Python

I need to build a secure, production-ready cloud network infrastructure using Pulumi Python. This is for a new project that requires a robust foundation with proper networking, compute resources, and security configurations.

## Infrastructure Requirements

The setup should include:

**Networking Layer:**
- A VPC with CIDR block 10.0.0.0/16 in the us-east-1 region
- Two subnets distributed across different availability zones for high availability
  - Subnet 1: 10.0.1.0/24 
  - Subnet 2: 10.0.2.0/24
- Internet Gateway attached to the VPC for external connectivity
- Route table with a default route (0.0.0.0/0) pointing to the Internet Gateway
- Both subnets associated with the route table

**Compute Layer:**
- Two EC2 instances (t2.micro) - one deployed in each subnet
- Security group allowing SSH access (port 22) from any source
- Both instances should be part of the same security group for consistent access control

**Operational Requirements:**
- All resources must have descriptive Name tags (e.g., "WebServer1", "WebServer2", "MainVPC")
- AMI ID should be parameterized to support different Linux distributions
- Integration capability with AWS Systems Manager for parameter management
- Comprehensive metadata/documentation within the Pulumi code
- Follow AWS best practices for resource configuration and security

## Technical Specifications

- **Region:** us-east-1
- **VPC CIDR:** 10.0.0.0/16
- **Subnet CIDRs:** 10.0.1.0/24, 10.0.2.0/24
- **Instance Type:** t2.micro
- **Security:** SSH access (port 22) from 0.0.0.0/0
- **Tool:** Pulumi Python SDK

## Expected Deliverables

Please provide a complete Pulumi Python script that:
1. Defines all required AWS resources with proper configurations
2. Implements parameterization for flexibility
3. Includes comprehensive documentation and metadata
4. Follows infrastructure-as-code best practices
5. Ensures proper resource dependencies and associations
6. Provides clear output values for resource identification

The solution should be production-ready and maintainable, with clear separation of concerns and proper error handling where applicable.
