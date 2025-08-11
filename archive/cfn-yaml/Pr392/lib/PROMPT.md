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
   - Distribute them across 2 Availability Zones (e.g., `us-east-1a` and `us-east-1b`)  

3. Internet & NAT Gateways  
   - Attach an Internet Gateway to the VPC  
   - Create a NAT Gateway in one of the public subnets  
   - Configure:  
     - Public subnets to route `0.0.0.0/0` to the Internet Gateway  
     - Private subnets to route `0.0.0.0/0` to the NAT Gateway  

4. IAM Roles  
   - Create two separate IAM roles:  
     - One for EC2 instances  
     - One for RDS databases  
   - Use least-privilege policy principles  

5. Security Groups  
   - Allow inbound traffic only on HTTPS (TCP port 443)  
   - Allow all outbound traffic  
   - Deny all other inbound access  

---

### Constraints

- VPC CIDR block must be `10.0.0.0/16`  
- Use two different Availability Zones  
- Include both public and private subnets  
- Include both Internet Gateway and NAT Gateway  
- Separate IAM roles must be created for EC2 and RDS  
- Security groups must restrict traffic to HTTPS (port 443) only  
- All resources must be deployable in the `us-east-1` region  
- Template must pass AWS CloudFormation validation and linting  

---

### Output Expectations

Produce a CloudFormation YAML template that:  
- Deploys all specified AWS resources without error  
- Uses descriptive logical resource names  
- Follows AWS best practices and security guidelines
