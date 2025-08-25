Hey! I need some help with AWS infrastructure. I'm working on setting up a web application and need a CloudFormation template that I can actually deploy without issues. 

Here's what I'm trying to build:
- A web app that needs to be scalable and highly available
- Should be in us-west-2 region
- Needs to follow security best practices since this will be production

Here are the specific requirements I have:

**Networking setup:**
- VPC with 10.0.0.0/16 CIDR block
- Two public subnets and two private subnets (different AZs for HA)
- Internet Gateway for public subnets
- NAT Gateway for private subnets to get internet access

**Compute resources:**
- Auto Scaling Group in the private subnets
- Amazon Linux 2 instances (latest AMI)
- Min 2 instances, max 6 instances

**Load balancing:**
- Application Load Balancer in public subnets
- Should route traffic to the EC2 instances

**Security:**
- Security Groups that only allow SSH from specific IP ranges
- Follow least-privilege principle

**Organization:**
- Tag everything with "Project: WebApp"

Can you create a complete CloudFormation YAML template that actually works? I've had issues with templates that look good but fail validation or deployment. This needs to be something I can deploy right away without errors.
