Create CloudFormation infrastructure code in JSON format for a charity web platform that handles 1,500 daily donors. The infrastructure should be deployed in us-east-2 region.

Requirements:

1. Network Configuration:
   - Create a VPC with CIDR block 10.50.0.0/16
   - Configure public and private subnets across multiple availability zones
   - Set up an Internet Gateway and NAT Gateway for connectivity
   - Configure route tables for public and private subnets

2. Compute Resources:
   - Deploy EC2 t3.micro instances running Apache web server
   - Configure instances with CloudWatch detailed monitoring enabled
   - Use Amazon Linux 2023 AMI
   - Include user data script to install and start Apache
   - Implement EC2 Instance Connect Endpoint for secure SSH access

3. Security Configuration:
   - Create security groups allowing HTTPS (port 443) from anywhere
   - Allow SSH (port 22) access only from internal CIDR 10.0.0.0/8
   - Implement least privilege principle for all security rules

4. Storage:
   - Create an S3 bucket for static assets with server-side encryption enabled
   - Configure bucket with versioning enabled
   - Set up proper bucket policies for EC2 instance access

5. Monitoring:
   - Enable CloudWatch detailed monitoring for EC2 instances
   - Create CloudWatch dashboard for instance health metrics
   - Set up CloudWatch alarms for high CPU utilization (threshold: 80%)
   - Configure CloudWatch Network Monitoring for performance visibility

6. IAM Configuration:
   - Create IAM role for EC2 instances with permissions to access S3 bucket
   - Include CloudWatch agent permissions for enhanced monitoring

Please provide the complete CloudFormation template in JSON format with all resources properly configured and following AWS best practices. Include appropriate outputs for important resource identifiers.