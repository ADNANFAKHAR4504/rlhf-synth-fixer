# AWS VPC Infrastructure with Pulumi Go

Create a comprehensive Pulumi Go program that sets up a secure and scalable network infrastructure in AWS with the following specific requirements:

## Core Infrastructure Requirements

### 1. VPC Configuration

- Create a VPC with CIDR block `10.0.0.0/16` in the **us-east-1** region
- Enable DNS hostnames and DNS resolution
- Add proper resource tags: `Environment: production`, `Project: secure-vpc`, `ManagedBy: pulumi`

### 2. Subnet Architecture

- **Public Subnets**: Create 2 public subnets in different availability zones:
  - Public Subnet A: `10.0.1.0/24` in `us-east-1a`
  - Public Subnet B: `10.0.2.0/24` in `us-east-1b`
- **Private Subnets**: Create 2 private subnets in different availability zones:
  - Private Subnet A: `10.0.11.0/24` in `us-east-1a`
  - Private Subnet B: `10.0.12.0/24` in `us-east-1b`

### 3. Internet Connectivity

- Internet Gateway attached to the VPC
- NAT Gateway deployed in **both** public subnets for high availability
- Proper route tables configured for public and private subnet traffic routing

### 4. Security Groups

- **Web Security Group**: Allow HTTP (port 80) and HTTPS (port 443) from anywhere
- **SSH Security Group**: Allow SSH (port 22) access only from these specific IP ranges:
  - `203.0.113.0/24` (company office)
  - `198.51.100.0/24` (remote work VPN)
- **Database Security Group**: Allow MySQL (port 3306) access only from web security group

### 5. Advanced Requirements

- Enable VPC Flow Logs to CloudWatch Logs
- Create custom DHCP options set with domain name `internal.company.com`
- Add Network ACLs for additional security layer
- All resources must follow consistent naming convention: `secure-vpc-{resource-type}-{az/identifier}`

## Output Requirements

The program must export the following values:

- VPC ID
- All subnet IDs with their types (public/private)
- Security group IDs
- NAT Gateway IDs and their Elastic IP addresses
- Internet Gateway ID

## Constraints

- Use only Pulumi's native Go SDK for AWS
- Implement proper error handling for all resource creation
- Code must be production-ready with appropriate resource dependencies
- Follow Go best practices for code organization and structure
