# Payment Processing Web Application Infrastructure

## Project Overview

We're building the infrastructure for a fintech startup's payment processing web application. This system handles sensitive financial transactions and must meet strict security and compliance requirements, including PCI DSS standards.

The application needs a robust, scalable three-tier architecture with proper load balancing, database clustering, and secure network isolation to ensure both performance and security.

## Infrastructure Requirements

### Architecture Overview
- **Deployment Region**: us-west-1
- **Architecture Pattern**: Three-tier web application
- **High Availability**: Multi-AZ deployment across at least 2 availability zones
- **Database**: RDS Aurora PostgreSQL with read replicas
- **Load Balancing**: Application Load Balancer for traffic distribution
- **Network Design**: VPC with both public and private subnets

### Security and Compliance Constraints

The following security requirements must be implemented:

1. **Encryption at Rest**: All EC2 instances must use encrypted EBS volumes with AWS KMS keys
2. **Database Security**: Database must be deployed in private subnets with no direct internet access
3. **SSL/TLS Termination**: Application Load Balancer must handle SSL/TLS termination using ACM certificates
4. **High Availability**: Auto Scaling Groups must span at least 2 availability zones
5. **Backup Strategy**: RDS instances must have automated backups enabled with 7-day retention
6. **Network Security**: Security groups must follow the principle of least privilege access
7. **Outbound Connectivity**: NAT Gateway required for outbound internet access from private subnets
8. **Resource Management**: All resources must be tagged with Environment and Project identifiers

## Expected Deliverables

Complete Terraform configuration files that provision three-tier architecture with:
- Proper security controls
- Monitoring capabilities  
- High availability across multiple AZs
- PCI DSS compliance considerations