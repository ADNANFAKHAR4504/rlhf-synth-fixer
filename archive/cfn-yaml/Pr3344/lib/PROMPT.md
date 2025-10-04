# AWS CloudFormation Deployment Task

You need to deploy a highly available web application using AWS CloudFormation in the `us-east-1` region.

## Requirements

- Use a VPC with CIDR block `10.0.0.0/16`.
- Create public subnets for the Load Balancer.
- Create private subnets for EC2 instances.
- Use an Elastic Load Balancer to distribute incoming traffic to EC2 instances.
- Deploy EC2 instances in an Auto Scaling Group:
  - Minimum: 1 instances
  - Maximum: 5 instances
- Backend should use a MySQL database hosted on Amazon RDS.
- Restrict RDS access so only EC2 instances can connect to it (use security groups).
- Only allow HTTP and HTTPS traffic to reach the Load Balancer.
- Do not allow direct access to EC2 instances from the internet.
- Use CloudWatch to monitor application performance.
- Write all infrastructure as YAML CloudFormation templates.
- Follow AWS best practices and keep the setup cost-effective.

## Deliverables 

- One or more YAML CloudFormation templates that define the full setup.
- Use parameters where needed to make the templates reusable.
