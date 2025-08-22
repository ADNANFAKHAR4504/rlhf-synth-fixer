Hey there! I need some help with AWS infrastructure design. I'm working on setting up a production environment in the ap-south-1 region and could really use your expertise with CloudFormation YAML templates.

Here's what I'm trying to build - I need a secure, production-ready setup that follows AWS best practices. Can you create a CloudFormation template that handles the following components?

Networking Setup:
- A VPC with three subnets (one public, two private)
- Proper routing configuration between the subnets
- A NAT Gateway in the public subnet so my private resources can access the internet

Security Requirements:
- All resources need to be tagged with "Environment: Production"
- Security groups should only allow HTTP (port 80) and HTTPS (port 443) traffic from the CIDR block 203.0.113.0/24

Database Layer:
- An Amazon RDS instance deployed in one of the private subnets
- The RDS instance should be encrypted using AWS-KMS

Compliance & Security:
- I need strict separation between public and private resources
- The whole infrastructure should meet production security standards

I'm looking for a complete YAML CloudFormation template that covers all these requirements. The template should be ready to deploy and follow AWS security best practices. Any tips on the architecture would be great too!

Thanks in advance for your help!
