Create infrastructure code using AWS CloudFormation in JSON format to deploy a secure web server environment for a non-profit donation platform that needs to handle 1,000 daily visitors.

Requirements:

1. Network Infrastructure:
   - Create a VPC with CIDR block 10.6.0.0/16 in us-east-2 region
   - Configure public subnet for web server deployment
   - Set up Internet Gateway for external connectivity
   - Configure route tables for proper network routing

2. Compute Resources:
   - Deploy EC2 t3.micro instances running nginx web server
   - Use Amazon Linux 2023 AMI for the instances
   - Implement EC2 Launch Template for standardized instance configuration
   - Enable detailed monitoring for CloudWatch metrics collection

3. Security Configuration:
   - Create Security Group allowing HTTP traffic on port 80 from anywhere
   - Allow SSH access on port 22 restricted to CIDR 172.16.0.0/24
   - Apply principle of least privilege for all security rules

4. Storage:
   - Create S3 bucket for hosting static assets
   - Configure bucket with versioning enabled
   - Set up appropriate bucket policies for web serving

5. Monitoring:
   - Enable CloudWatch monitoring for EC2 instances
   - Configure CloudWatch agent on instances for enhanced metrics
   - Create CloudWatch dashboard displaying instance health, CPU utilization, and network metrics
   - Set up CloudWatch alarm for high CPU utilization (threshold: 80%)

6. Additional Features:
   - Use CloudWatch Application Insights for application-level monitoring
   - Implement EC2 Instance Connect Endpoint for secure SSH access without bastion hosts

Provide the complete CloudFormation template in JSON format with all resources properly configured and cross-referenced using intrinsic functions. Include appropriate tags for resource organization and cost tracking. Each file should be in a separate code block with the filename clearly indicated.