You are an expert Infrastructure as Code (IaC) engineer. Please generate a CloudFormation template in YAML format named web_app_stack.yaml that deploys a complete, secure, and high-availability web application stack in the us-east-1 region using AWS CloudFormation.

Infrastructure Requirements
Please implement the following in the CloudFormation template:

VPC & Networking

Create a VPC with:

At least 2 public and 2 private subnets, each in different Availability Zones.

Properly configured Internet Gateway, NAT Gateways, and Route Tables to allow outbound internet access from private subnets.

Elastic Load Balancer (ELB)

Deploy an Application Load Balancer (ALB) to handle incoming HTTP/HTTPS traffic and distribute it to the Auto Scaling Group.

Configure Target Groups and Listeners appropriately for port 80 and port 443.

Auto Scaling Group (ASG)

Launch configuration or Launch Template using the latest Amazon Linux 2 AMI (use dynamic resolution via SSM Parameter Store).

Distribute EC2 instances across the private subnets to enhance security.

Ensure health checks are configured with the ALB.

Security Groups

Allow only HTTP (80) and HTTPS (443) from the internet to the Load Balancer.

Allow internal traffic between the Load Balancer and EC2 instances.

Restrict access to the RDS instance from EC2 instances in private subnets only.

RDS (PostgreSQL)

Provision an Amazon RDS instance running PostgreSQL in the private subnets.

Enable storage encryption, multi-AZ deployment, and set up an appropriate DB subnet group.

CloudFront & S3

Create an S3 bucket to store static content.

Use CloudFront to serve this content globally with caching.

Configure bucket policy and origin access identity (OAI) to restrict access to S3 only via CloudFront.

IAM Roles

Define an IAM Role and Instance Profile to allow EC2 instances to access the S3 bucket.

Logging & Monitoring

Enable CloudWatch Logs:

Application logs from EC2.

Load Balancer access logs.

RDS logs if supported.

VPC Flow Logs (optional but recommended).

Tagging

Tag all resources using:

yaml
Copy
Edit
Tags:

- Key: Project
Value: WebApp
Best Practices

Use only non-deprecated AWS resource types.

Provide logical names and in-line comments throughout the YAML template explaining key sections.

Prefer modular, well-structured code for readability.

Final Output Requirements
Output a single CloudFormation template in YAML named web_app_stack.yaml.

Ensure the template:

Passes cfn-lint and AWS CloudFormation validation checks.

Can be deployed in the AWS us-east-1 region via the AWS Console.

The template should be self-contained and complete all parameters, mappings, and outputs should be defined where relevant.
