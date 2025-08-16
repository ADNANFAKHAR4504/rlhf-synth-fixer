Prompt:
You are an expert in AWS CloudFormation and Infrastructure as Code. Generate a fully functional AWS CloudFormation YAML template based on the following requirements.
Do not change or omit any provided data. All elements mentioned must be represented exactly as specified, using AWS best practices for high availability, scalability, and security.

Deployment Environment & Requirements:

You are tasked with deploying a web application using AWS CloudFormation. The deployment must handle web traffic efficiently and maintain high availability, security, and performance. The specifications are as follows:

Deploy across at least 2 AWS regions to ensure redundancy.

Set up an Elastic Load Balancer to distribute incoming traffic across multiple Availability Zones.

Use EC2 Auto Scaling Groups to manage instances, automatically scaling based on CPU utilization.

Integrate AWS RDS with Multi-AZ enabled for database resilience.

Design a VPC with both public and private subnets.

Ensure encryption at rest for all data stores.

Implement IAM roles and policies to restrict access to AWS services.

Enable CloudWatch monitoring and alarms for system health and key metrics.

Apply tagging standards to all AWS resources for easy tracking and cost management.

Include CloudFormation Outputs that expose endpoint URLs and critical configuration details.

Project Information

projectName: IaC - AWS Nova Model Breaking

Problem Difficulty: Hard

Constraints to Enforce (Do Not Violate):

The deployment must be automatically scalable based on CPU utilization.

Must span at least 2 AWS regions (support regional redundancy).

Elastic Load Balancer must be used for traffic distribution.

Use AWS RDS with Multi-AZ deployment for the database.

VPC must contain public and private subnets.

All data stores must be encrypted at rest.

Use IAM roles to restrict access to AWS services.

Deploy web application on EC2 via Auto Scaling Group.

All resources must be tagged for tracking/management.

CloudWatch monitoring and alarms must be configured.

Expected Output:

Produce a valid AWS CloudFormation YAML template that:

Includes all required AWS resources

Follows best practices for security, scalability, and high availability

Can be deployed successfully in AWS without modification

Outputs the application endpoint URL and essential configuration values