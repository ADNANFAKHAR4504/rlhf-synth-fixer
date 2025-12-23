# Web Application Infrastructure Requirements

I need to deploy a web application on AWS with high availability architecture. The deployment must include the following components:

1. Create a VPC with public and private subnets across multiple availability zones for high availability
2. Deploy an Application Load Balancer to distribute HTTP/HTTPS traffic to application instances
3. Set up EC2 instances or Auto Scaling groups in private subnets for the application layer
4. Configure an Amazon RDS database instance with automatic backups enabled
5. Create IAM roles with appropriate permissions for application instances to interact with AWS services
6. Implement security groups with proper network access controls
7. Use the new Application Load Balancer integration with VPC IPAM for better IP address management
8. Configure RDS with Multi-AZ deployment for database high availability

The architecture should span at least two availability zones and include both public and private subnet configurations. The Application Load Balancer should be internet-facing to handle incoming traffic, while application instances and database should be in private subnets for security.

Target deployment region: us-east-1

Please provide complete infrastructure code with one code block per file.