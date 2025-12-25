I need a CloudFormation template for a secure web application infrastructure. The file should be named secure-web-app.yaml and deploy a three-tier architecture.

**VPC Setup:**
- New VPC with 10.0.0.0/16 CIDR
- Two public subnets: 10.0.1.0/24 and 10.0.2.0/24
- Two private subnets: 10.0.10.0/24 and 10.0.11.0/24
- Distribute these across two availability zones for high availability
- Internet Gateway attached to the VPC
- Two NAT Gateways, one in each public subnet, so private instances can reach the internet
- Route tables configured properly - public subnets route to IGW, private subnets route to NAT Gateways

**Load Balancer:**
- Application Load Balancer in the public subnets
- Should be internet-facing
- Allow HTTP port 80 and HTTPS port 443 from anywhere
- Security group allows inbound traffic from 0.0.0.0/0 on ports 80 and 443
- Target group pointing to EC2 instances on port 80

**Web Servers:**
- Auto Scaling Group running in the private subnets
- Launch instances in both availability zones
- Min size 2, desired capacity 2, using t3.micro instances
- Launch Template with Amazon Linux 2 AMI
- UserData script that installs and starts Apache web server
- Associate with proper security group and IAM instance profile

**Database:**
- RDS PostgreSQL instance
- Must be Multi-AZ for high availability and failover
- Place in private subnets, not publicly accessible
- Use db.t3.micro instance type
- PostgreSQL version 13.10 or similar supported version
- Parameters for master username and password

**IAM:**
- IAM Role for EC2 instances with minimal permissions
- Grant only what's needed for the application - maybe SSM for management
- Follow least privilege principle
- Instance Profile to attach the role to EC2 instances

**Security Groups:**
- EC2 security group allows HTTP port 80 from ALB security group only
- Allow SSH port 22 from a restricted CIDR block for admin access, not from anywhere
- RDS security group allows PostgreSQL port 5432 from EC2 security group only
- This ensures only the web app can connect to the database

The stack should deploy cleanly and create a secure, scalable, highly available infrastructure with proper network isolation and security controls.
