# AcmeWeb Highly Available Web Application Infrastructure

Create a comprehensive CloudFormation YAML template named 'acme_web_app.yaml' for deploying a highly available web application infrastructure in AWS.

## Infrastructure Requirements:

### 1. Regional Configuration

- Deploy in **us-west-2** region
- Use **AcmeWeb** as the naming prefix for all resources

### 2. Network Architecture

- VPC with CIDR block **10.0.0.0/16**
- Public subnets in **2 different availability zones**
- Private subnets in **2 different availability zones**
- Internet Gateway for public internet access
- Route tables properly configured for public/private traffic routing

### 3. Load Balancing & Auto Scaling

- **Application Load Balancer** deployed in public subnets
- **Auto Scaling Group** for EC2 instances with:
  - Minimum: 2 instances
  - Maximum: 4 instances
  - CPU utilization-based scaling policies
- EC2 instances deployed in private subnets only

### 4. Database Layer

- **Amazon RDS MySQL** instance in private subnet
- Database must NOT be publicly accessible
- Proper security group allowing access only from EC2 instances

### 5. Security Requirements

- Security groups with least privilege access
- Web servers accessible only through load balancer
- Database accessible only from web servers

### 6. High Availability

- All components distributed across multiple availability zones
- Auto-recovery and auto-scaling capabilities

## Deliverables:

- Complete CloudFormation YAML template
- Template must pass AWS CloudFormation validation
- All resources properly tagged and named with AcmeWeb prefix
- Include necessary outputs for key resource identifiers

Please provide the complete CloudFormation YAML template that meets all these requirements.
