Prompt: Production-Grade Cloud Infrastructure Setup with CloudFormation

Act as a Solution Architect.

You are tasked with designing and implementing a production-grade, secure, and highly available AWS infrastructure using AWS CloudFormation in JSON format. This infrastructure will support a multi-tier web application deployment and must comply with enterprise-level operational and security standards.

Requirements

1. Region

All resources must be deployed in the us-east-1 AWS region.

2. VPC and Networking

Create a VPC with both public and private subnets, each spread across two Availability Zones. Attach an Internet Gateway and configure appropriate route tables. Create a NAT Gateway in a public subnet to provide outbound Internet access for instances in private subnets. Associate route tables properly with each subnet.

The Internet Gateway connects to the VPC to provide public internet access. The NAT Gateway is attached to a public subnet and allows private subnet instances to access the internet through the NAT Gateway. Route tables are associated with subnets to control traffic flow between subnets and external networks.

3. Tagging

All resources must be tagged with the following key-value pairs:
- Key: Environment
- Key: Project
- Key: ManagedBy
- Key: CostCenter

4. Security Groups

Create security groups that follow least privilege principles. Security groups attached to EC2 instances control inbound and outbound traffic with specific port and protocol restrictions. Security groups associated with load balancers allow HTTP and HTTPS traffic from the internet on specific ports and forward it to application instances in private subnets.

5. Load Balancer

Deploy an Application Load Balancer in public subnets that receives traffic from the internet. The load balancer distributes incoming requests to EC2 instances in private subnets. Configure health checks to ensure traffic only routes to healthy instances.

6. Auto Scaling

Set up an Auto Scaling Group that launches EC2 instances in private subnets. The Auto Scaling Group connects to the load balancer target group to register instances. Configure scaling policies based on CPU utilization to automatically adjust instance count.

7. S3 Bucket

Create an S3 bucket for storing application logs. EC2 instances write logs to the S3 bucket through IAM roles. Configure lifecycle policies to transition logs to cheaper storage classes over time.

Expected Output

Generate a complete CloudFormation template in JSON format that implements all the above requirements. The template should be production-ready, well-structured, and follow AWS best practices.
