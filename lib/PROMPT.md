# Web Application Infrastructure Requirements

I need to deploy a web application on AWS with high availability architecture. The deployment must include the following components:

1. Create a VPC with public and private subnets across multiple availability zones for high availability
2. Deploy an Application Load Balancer that connects to EC2 instances in private subnets to distribute HTTP/HTTPS traffic
3. Set up EC2 instances or Auto Scaling groups in private subnets that connect to the load balancer for the application layer
4. Configure an Amazon RDS database instance that connects to the application instances through security groups
5. Create IAM roles with appropriate permissions for application instances to access AWS services
6. Implement security groups that allow traffic from the load balancer to EC2 instances and from EC2 to RDS
7. Use the Application Load Balancer integrated with VPC for routing incoming requests through the gateway to backend instances
8. Configure RDS with Multi-AZ deployment for database high availability

The architecture should span at least two availability zones. The Application Load Balancer connects to the internet gateway to receive incoming traffic, which is then routed to application instances in private subnets. The EC2 instances communicate with the RDS database through secure security group rules.

Target deployment region: us-east-1

Please provide complete infrastructure code with one code block per file.