# Infrastructure Task 058

## Technical Specifications

I need a complete AWS CloudFormation template in YAML format. The template should set up a highly available, scalable, and secure cloud environment across two AWS regions for a critical application.

## Requirements

- **Output Requirements:**
  - Just give me the CloudFormation YAML template - nothing else
  - Don't add any explanatory text or markdown outside the YAML (comments in the YAML are fine)
  - The template needs to be ready to deploy as-is

**What I need built:**

1. **Multi-Region Setup:**
   - Deploy the same infrastructure to two different AWS regions
   - Make the regions configurable with CloudFormation parameters (Region1, Region2)
   - Name everything uniquely so there are no conflicts

2. **Networking (each region):**
   - VPC with configurable CIDR blocks
   - At least 2 public subnets and 2 private subnets, each in different AZs
   - Internet Gateway attached to each VPC
   - NAT Gateway in a public subnet with an Elastic IP
   - Route tables:
     - Public routes go to IGW
     - Private routes go to NAT Gateway
     - Proper subnet associations

3. **Application Layer (each region):**
   - Application Load Balancer in public subnets handling HTTP traffic on port 80
   - At least 2 EC2 instances in private subnets, registered with the ALB target group
   - Include UserData to install a basic web server for testing
   - Security Groups:
     - ELB SG: allow HTTP (80) and HTTPS (443) from anywhere
     - App SG: allow HTTP (80) only from ELB SG, SSH (22) from configurable IP range
     - DB SG: allow database traffic (MySQL 3306) only from App SG

4. **Database Layer (each region):**
   - MySQL RDS instance in private subnets
   - Multi-AZ deployment for high availability
   - DB Subnet Group spanning private subnets
   - Database credentials as secure CloudFormation parameters (NoEcho)

5. **IAM:**
   - IAM roles and instance profiles for EC2 instances following least privilege
   - Allow EC2 instances to access necessary AWS services (SSM, S3)

**Parameters needed:**
- ProjectName
- Region1, Region2 (default to us-east-1, us-west-2)
- VpcCidr1, VpcCidr2
- PublicSubnet1Cidr1, PrivateSubnet1Cidr1, PublicSubnet2Cidr1, PrivateSubnet2Cidr1 (Region 1)
- PublicSubnet1Cidr2, PrivateSubnet1Cidr2, PublicSubnet2Cidr2, PrivateSubnet2Cidr2 (Region 2)
- InstanceType for EC2
- AMI for EC2 (use mapping for correct AMI per region)
- DBInstanceType
- DBAllocatedStorage
- DBUsername (NoEcho)
- DBPassword (NoEcho)

**High Availability Requirements:**
Make sure there's redundancy across regions and within regions (Multi-AZ, multiple instances behind load balancer).

**Before you finish, check:**
1. Are all resources for both regions properly duplicated and named to avoid conflicts?
2. Can traffic flow correctly: internet -> ELB -> EC2 (private) -> RDS (private)?
3. Are security groups and IAM roles restrictive enough?
4. Does this actually provide high availability at network, compute, and database layers?
5. Is the YAML syntax correct and will it deploy properly?