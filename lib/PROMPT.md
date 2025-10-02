Create infrastructure code using AWS CDK TypeScript for a web application hosting platform that needs to serve 3,000 daily users on a job board website. The infrastructure should be deployed in us-west-1 region.

Requirements:

1. Create a VPC with CIDR block 10.20.0.0/16 with public and private subnets across multiple availability zones for high availability

2. Deploy EC2 instances using t3.micro instance type running Apache web server. Configure the instances with user data script to install and start Apache automatically

3. Set up an Application Load Balancer (ALB) configured for HTTPS traffic on port 443. Enable the new Automatic Target Weights feature for improved traffic distribution and configure health checks with appropriate thresholds

4. Configure Security Groups:
   - ALB security group allowing inbound HTTPS (443) from anywhere
   - EC2 security group allowing HTTP traffic from ALB and SSH access restricted to CIDR 10.0.0.0/16

5. Create an S3 bucket for storing static files with appropriate bucket policies for web hosting

6. Set up CloudWatch monitoring for EC2 instance health checks including CPU utilization metrics and custom alarms that trigger when instances become unhealthy

7. Implement EC2 Instance Connect Endpoint for secure SSH access without requiring public IPs on EC2 instances

8. Configure AWS WAF v2 with Bot Control managed rule group on the Application Load Balancer to protect against malicious bot traffic and web scraping. Enable rate limiting rules to prevent abuse and configure logging to S3 for security analysis

9. Implement CloudWatch Network Monitor to provide near real-time visibility of network performance between EC2 instances and the Application Load Balancer. Configure flow monitors with TCP-based metrics for monitoring packet loss and latency to ensure optimal application performance

Please provide the complete CDK TypeScript code including:
- Stack definition with all resources
- Proper imports and dependencies
- Configuration for high availability across availability zones
- Security best practices implementation
- AWS WAF integration with ALB for enhanced security
- Network monitoring configuration for performance insights