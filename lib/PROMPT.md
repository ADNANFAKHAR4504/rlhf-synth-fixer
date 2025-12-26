Design a production-grade CloudFormation YAML template for FinanceApp in us-east-1. Use the naming standard ProjectName-Resource-Env where ProjectName is FinanceApp, Resource is the AWS service like EC2 or RDS, and Env is either Dev or Prod.

Build a secure three-tier architecture following AWS best practices:

- IAM: Create roles using least privilege, granting only the specific actions needed for compute and database instances to access their required resources
- S3: Set up a bucket for application data with SSE-S3 encryption that EC2 instances access through their IAM role
- Compute: Launch EC2 instances in an Auto Scaling Group connected to an Application Load Balancer, spreading across public and private subnets in multiple availability zones
- Networking: Build a VPC containing public subnets for the load balancer and NAT Gateway, plus private subnets for EC2 instances and RDS database, with route tables directing traffic between tiers
- Database: Deploy RDS with Multi-AZ in private subnets, accessible only from EC2 security group through port 3306
- Tagging: Apply Environment, Department, and Owner tags to all resources

The template should:
- Output critical resource identifiers: VPC ID, subnet IDs, S3 bucket name, RDS endpoint address
- Pass CloudFormation validation with working logic
- Include comments explaining security and scalability decisions
- Deploy successfully in a sandbox environment

Generate the complete CloudFormation YAML template.
