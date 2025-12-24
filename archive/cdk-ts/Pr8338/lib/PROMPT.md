# Web Application Infrastructure on AWS

I need to deploy a scalable web application infrastructure on AWS using CDK TypeScript. The deployment should be in us-west-2 region and include the following components:

## Core Requirements

1. **VPC Configuration**: Create a VPC with CIDR block 10.0.0.0/16 containing two public subnets and two private subnets across different availability zones.

2. **Networking Setup**: Configure Internet Gateway for public subnet access and NAT Gateway to provide internet connectivity for private subnets.

3. **Compute Layer**: Deploy two EC2 instances in private subnets with Auto Scaling group configuration. Use appropriate instance types and AMI for web hosting.

4. **Load Balancing**: Set up an Application Load Balancer in the public subnets that receives external HTTP/HTTPS traffic and routes requests to the EC2 instances in the private subnets via an ALB target group. Configure health checks so the ALB can determine instance availability.

5. **Database**: Deploy an RDS MySQL database instance in private subnets that is reachable only from the application tier. Store database credentials securely in AWS Secrets Manager, and ensure the EC2 instances retrieve the secret from Secrets Manager at startup and connect to the RDS MySQL endpoint.

6. **Monitoring & Compliance**: Implement VPC Flow Logs that send network flow records to CloudWatch Logs, CloudWatch alarms for system metrics, and AWS Config rules for compliance tracking. Use CloudWatch metrics/alarms to drive Auto Scaling policies.

7. **Security**: Configure Security Groups to explicitly restrict traffic between tiers: permit inbound access to the ALB only on ports 80/443, permit ALB-to-EC2 traffic only on the application listener ports, and permit EC2-to-RDS traffic only on the MySQL port. Ensure IAM policies follow least privilege by scoping permissions to required actions and specific resources.

8. **Tagging**: Apply consistent tags across resources following company tagging policy.

## Additional Requirements

- Incorporate AWS Shield Network Security for enhanced DDoS protection and network security posture management
- Use Amazon S3 Metadata service for comprehensive object visibility and SQL-based analysis capabilities
- Ensure all components follow AWS best practices for security and cost optimization
- Infrastructure should be production-ready and scalable

Please provide the complete CDK TypeScript infrastructure code with one code block per file that I can copy and paste directly.
