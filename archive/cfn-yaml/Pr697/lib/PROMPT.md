You are tasked with generating a complete, production-ready AWS CloudFormation template (YAML format) to deploy a scalable web application infrastructure in the us-west-2 region.

The template must be a single file and adhere to AWS best practices. It should include the following components:

Amazon EC2 Instance :
AMI ID: Use a parameter placeholder (e.g., LatestAmiId) the actual AMI ID is specified internally.
Instance Type: t2.micro
Region: us-west-2

Security Group :
Allow inbound access for:
HTTP (port 80) from anywhere
SSH (port 22) from anywhere
Outbound traffic: unrestricted

Elastic Load Balancer (ELB):
Distributes HTTP traffic across EC2 instances

Auto Scaling Group (ASG):
Launch configuration or template using the EC2 settings above
Minimum instances: 2, maximum: 5
Automatically scales based on CPU utilization

IAM Role and Instance Profile:
Grants EC2 instances access to necessary AWS services (use a sample managed policy like AmazonS3ReadOnlyAccess)

Outputs:
Public DNS name of the ELB

Tagging:
All resources must include:
Environment: Production
Application: WebApp

Ensure:
All resources are correctly interconnected
Template is fully self-contained in a single YAML file
Follows CloudFormation syntax and passes cfn-lint and AWS validation

Include inline comments for clarity
