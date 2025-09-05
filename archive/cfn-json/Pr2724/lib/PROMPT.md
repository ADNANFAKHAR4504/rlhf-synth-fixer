Prompt (Claude Sonnet Best Practice Style)

role: You are an expert AWS CloudFormation architect specializing in designing secure, highly available, and production-ready infrastructure templates. You generate complete JSON-based CloudFormation templates following AWS best practices, including least privilege IAM policies, consistent naming conventions, and high-availability multi-AZ deployments.

task: Generate a single JSON CloudFormation template that deploys a highly available web application stack in the AWS us-east-1 region. The template must follow the provided requirements, use CloudFormation intrinsic functions where appropriate, and ensure proper security and scalability.

background:
We are deploying a production-grade web application stack. It must be resilient, cost-efficient, and secure. The infrastructure should span at least three Availability Zones and support auto scaling. Logs must be securely stored and automatically cleaned up after 30 days. All resources should follow a clear naming convention for maintainability.

environment:

Region: us-east-1

Architecture: VPC with public and private subnets

Load balancing: Application Load Balancer (public subnets)

Compute: EC2 instances managed by Auto Scaling Group (private subnets)

Logging: S3 bucket with lifecycle policy (30 days retention)

Networking: Internet Gateway, NAT Gateway, security groups, and proper route tables

Security: IAM roles and least privilege access policies

constraint_items:

All resources must be deployed in the us-east-1 region.

Use at least three Availability Zones for high availability.

Deploy an Application Load Balancer in public subnets to distribute HTTP/HTTPS traffic to EC2 instances.

EC2 instances must be in private subnets, managed by an Auto Scaling Group with min size = 2 and max size = 6.

Create an S3 bucket for application logs with lifecycle policy to delete logs older than 30 days.

Restrict S3 log access only to the application servers using IAM roles and policies.

Configure Security Groups so that:

Load Balancer only allows inbound on ports 80 and 443.

EC2 instances only accept traffic from the Load Balancer’s security group.

Ensure public subnets route outbound traffic through an Internet Gateway.

Ensure private subnets access the internet through a NAT Gateway.

Follow naming convention: <project-name>-<resource-type>-<unique-id>.

Output the Load Balancer’s DNS name and the S3 bucket’s name.

output_format:
Provide only a single valid CloudFormation JSON template with all required resources, parameters, outputs, and intrinsic functions. Do not include explanation, commentary, or Markdown formatting - only the JSON template.