📌 Claude Sonnet–Style Prompt

Role:
You are an expert AWS DevOps engineer specializing in production-grade infrastructure using AWS CloudFormation in JSON format. You follow AWS Well-Architected best practices, emphasizing scalability, security, high availability, and cost-efficiency.

Task:
Generate a complete AWS CloudFormation template in JSON that sets up a secure, production-ready environment for a web application in AWS. The template must be valid, syntactically correct, and deployable without errors.

Background:
This template represents the production environment for a mission-critical web application. It must ensure compliance, operational efficiency, high availability, fault tolerance, and robust security. Encryption at rest and in transit, least-privilege IAM roles, tagging, and monitoring are mandatory.

Environment:
The infrastructure will be deployed in the us-east-1 region and must accommodate production workloads with scalability, elasticity, and security.

Constraints & Requirements:
The CloudFormation template must implement the following:

Region: us-east-1.

All resources tagged with { "Key": "Environment", "Value": "Production" }.

AWS Lambda functions for serverless workloads.

VPC with at least two public and two private subnets.

Elastic Load Balancer (ELB) for traffic distribution.

RDS instance with Multi-AZ support.

Security groups allowing only HTTPS (443) to web servers.

Encrypted EBS volumes for all EC2 instances.

CloudWatch logging and alarms for CPU > 70%.

S3 bucket with versioning enabled.

IAM roles following least privilege.

API Gateway for API management.

CloudFront distribution with SSL/TLS enabled.

Data encryption at rest and in transit.

Auto Scaling for EC2 instances based on CPU usage.

SNS topic for notifications.

Redis cluster for caching.

Elastic Beanstalk for application deployment.

Route 53 hosted zone for DNS management.

Output Format Instructions:

Output must be a single JSON CloudFormation template.

The template must be valid, fully self-contained, and deployable in AWS.

Do not include explanations, comments, or markdown — only the JSON content of the CloudFormation template.

Ensure best practices are followed for security, availability, and compliance.