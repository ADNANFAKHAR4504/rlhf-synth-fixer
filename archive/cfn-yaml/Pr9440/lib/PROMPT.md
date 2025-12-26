## AWS CloudFormation Template Requirements

You are an expert AWS Cloud Engineer.
Write a fully executable, production-ready AWS CloudFormation YAML template to provision a secure and scalable environment with the following specifications.

---

### Environment Setup

1. VPC Configuration
 - Create a VPC with CIDR block: `10.0.0.0/16`
 - Enable DNS support and DNS hostnames

2. Subnets
 - Create 2 public subnets and 2 private subnets
 - Distribute them across 2 Availability Zones like us-east-1a and us-east-1b

3. Internet & NAT Gateways
 - Attach an Internet Gateway to the VPC
 - Create a NAT Gateway in one of the public subnets
 - Configure:
 - Public subnets to route `0.0.0.0/0` to the Internet Gateway
 - Private subnets to route `0.0.0.0/0` to the NAT Gateway

4. IAM Roles
 - Create two separate IAM roles: one for EC2 instances, one for RDS databases
 - Use least-privilege policy principles

5. Security Groups
 - Allow inbound traffic only on HTTPS port 443
 - Allow outbound traffic to AWS service endpoints and internet
 - Deny all other inbound access

6. Service Connectivity and Architecture
 - EC2 instances deployed in private subnets connect to the internet through the NAT Gateway for software updates and external API calls
 - RDS databases deployed in private subnets are accessible only from EC2 instances through VPC security groups
 - Internet Gateway in public subnets routes external traffic to the VPC
 - IAM roles attached to EC2 instances enable secure access to AWS services without hardcoded credentials
 - Security groups control traffic flow between EC2, RDS, and external networks

---

### Constraints

- VPC CIDR block must be `10.0.0.0/16`
- Use two different Availability Zones
- Include both public and private subnets
- Include both Internet Gateway and NAT Gateway
- Separate IAM roles must be created for EC2 and RDS
- Security groups must restrict inbound traffic to HTTPS port 443 only
- All resources must be deployable in the `us-east-1` region
- Template must pass AWS CloudFormation validation and linting

---

### Output Expectations

Produce a CloudFormation YAML template that:
- Deploys all specified AWS resources without error
- Uses descriptive logical resource names
- Follows AWS best practices and security guidelines
