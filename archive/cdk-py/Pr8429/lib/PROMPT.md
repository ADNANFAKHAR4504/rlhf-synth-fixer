 AWS CDK Python Infrastructure Creation Prompt
 Folder Structure
Your project folder structure:

bash
Copy
Edit
project-root/
 tap.py            # Entry point (like app.py)
 lib/
     tapstack.py   # Main stack definition
 Environment Overview
Using AWS CDK with Python, build a robust infrastructure that adheres to the following requirements and constraints:

 Infrastructure Requirements
Region: Deploy all resources in us-west-2 (Oregon).

VPCs:

Create two separate VPCs with non-overlapping CIDR blocks.

Each VPC should include:

2 public subnets

2 private subnets

Subnets should span multiple Availability Zones (AZs).

Load Balancing:

Deploy an Application Load Balancer (ALB) to handle HTTP/HTTPS traffic.

ALB should distribute traffic evenly across instances in public subnets.

Auto Scaling Groups:

Implement Auto Scaling Groups in each VPC.

Ensure a minimum of 2 EC2 instances are always running.

Automatically scale based on demand.

Security Groups:

Allow HTTP (port 80) and HTTPS (port 443) for public-facing resources.

Restrict SSH (port 22) access to only private subnets.

Follow best practices and principle of least privilege.

Tagging:

Tag all resources with relevant keys (e.g., Name, Environment, Owner) for easy identification and management.

Scalability & Modifiability:

The solution should be modular and extensible, allowing for:

Easy addition of more VPCs

Future integration with additional services

 Constraints
Cloud Provider: AWS only

Region: us-west-2

VPC Configuration:

Must be non-overlapping

Include 2 private and 2 public subnets each

Application Load Balancer: Required

Auto Scaling: At least 2 EC2 instances per VPC, scaling enabled

Security Rules:

HTTP/HTTPS for public access

SSH only for internal/private access

 Expected Output
A Python script using AWS CDK that:

Provisions all described infrastructure

Can be deployed and updated via CDK CLI (cdk deploy, cdk diff, cdk destroy)

Validates all services function with the configured rules and constraints

CDK project should be structured using best practices (construct separation, tagging, environment scoping).

 Proposed Use Case Statement
Design and deploy a high-availability, scalable AWS cloud environment using AWS CDK in Python, focusing on infrastructure provisioning across multiple AZs within the US West (Oregon) region, while ensuring security, extensibility, and operational visibility.