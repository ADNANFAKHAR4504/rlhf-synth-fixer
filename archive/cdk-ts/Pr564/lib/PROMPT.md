# Web Application Infrastructure on AWS

I need to deploy a scalable web application infrastructure on AWS using CDK TypeScript. The deployment should be in us-west-2 region and include the following components:

## Core Requirements

1. **VPC Configuration**: Create a VPC with CIDR block 10.0.0.0/16 containing two public subnets and two private subnets across different availability zones.

2. **Networking Setup**: Configure Internet Gateway for public subnet access and NAT Gateway to provide internet connectivity for private subnets.

3. **Compute Layer**: Deploy two EC2 instances in private subnets with Auto Scaling group configuration. Use appropriate instance types and AMI for web hosting.

4. **Load Balancing**: Set up an Application Load Balancer to distribute incoming traffic across the EC2 instances.

5. **Database**: Deploy RDS MySQL database instance in private subnets. Store database credentials securely using AWS Secrets Manager.

6. **Monitoring & Compliance**: Implement VPC Flow Logs for network monitoring, CloudWatch alarms for system metrics, and AWS Config rules for compliance tracking.

7. **Security**: Configure Security Groups to allow inbound traffic only on ports 80 and 443.

8. **Resource Tagging**: Apply consistent tags across all resources following company tagging policy.

## Additional Requirements

- Incorporate AWS Shield Network Security for enhanced DDoS protection and network security posture management
- Use Amazon S3 Metadata service for comprehensive object visibility and SQL-based analysis capabilities
- Ensure all components follow AWS best practices for security and cost optimization
- Infrastructure should be production-ready and scalable

Please provide the complete CDK TypeScript infrastructure code with one code block per file that I can copy and paste directly.