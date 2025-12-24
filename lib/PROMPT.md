Prompt: Production-Grade Cloud Infrastructure Setup with CloudFormation (us-east-1)

Act as a Solution Architect.

You are tasked with designing and implementing a production-grade, secure, and highly available AWS infrastructure using AWS CloudFormation in JSON format. This infrastructure will support a multi-tier web application deployment and must comply with enterprise-level operational and security standards.

Requirements

1. Region

All resources must be deployed in the us-east-1 AWS region.

2. VPC and Networking

Create a VPC with both public and private subnets, each spread across two Availability Zones. Attach an Internet Gateway and configure appropriate route tables. Create a NAT Gateway in a public subnet to provide outbound Internet access for instances in private subnets. Associate route tables properly with each subnet.

3. Tagging

All resources must be tagged with the following:

{
  " Key:
