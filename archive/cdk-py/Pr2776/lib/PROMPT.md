## AWS CloudFormation Infrastructure Deployment Task

You are an AWS cloud infrastructure expert, you are tasked with building a Python automation script using CDK-python that deploys a production-ready AWS infrastructure. Think of this as creating a complete, scalable web application environment from scratch, the kind you'd see powering a real-world startup or enterprise application.

### What to do:

Create a Python script called `deploy_infrastructure.py` that uses AWS CDK-python to define and deploy a multi-tier AWS architecture. You'll be using Python classes and constructs to programmatically build your infrastructure.

### Core Requirements

**1. Networking Layer**
- Define a VPC construct with two public and two private subnets across two availability zones
- The CDK should automatically handle Internet Gateway creation and attachment
- Configure NAT Gateways for private subnet internet access (one per AZ)
- Let CDK manage the routing tables automatically based on subnet types

**2. Compute Layer**
- Create an Auto Scaling group using CDK's high-level constructs
- Deploy an Application Load Balancer (ALB) to distribute traffic
- Define security groups allowing HTTP (port 80) and HTTPS (port 443) ingress
- Use CDK's built-in IAM role management for EC2 instances

**3. Database Layer**
- Deploy an RDS instance using CDK constructs within private subnets
- Enable automated daily backups through CDK properties
- Configure the database security group to only accept traffic from the compute layer

**4. Monitoring & Logging**
- Create CloudWatch Alarms for 70% CPU utilization using CDK metric constructs
- Define an S3 bucket for centralized logging
- Apply bucket policies using CDK's policy constructs

### Best Practices
- Implement proper construct IDs and logical naming
- Deploy to us-east-1 region
- Apply 'Environment: Production' tags to all constructs
- At least one Stack class containing your infrastructure
- Outputs all resources provisioned