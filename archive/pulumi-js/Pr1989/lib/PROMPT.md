I need help creating a web application infrastructure on AWS using Pulumi JavaScript. Here are my requirements:

1. Deploy all resources in the us-east-1 region
2. Set up an Application Load Balancer to distribute traffic across at least 2 EC2 instances
3. Create an Auto Scaling Group with a minimum of 2 instances and maximum of 5 instances
4. Use a predefined AMI ID for the EC2 instances suitable for web applications
5. Create an S3 bucket for hosting static content with public read access
6. Configure CloudWatch alarms to notify when CPU utilization exceeds 80% on any instance
7. Follow AWS security best practices and ensure scalability

I'd like to use some of the newer AWS features if possible - I've heard about enhanced Auto Scaling target tracking capabilities and improved Application Load Balancer integration. Also interested in using instance refresh features for better deployment management.

Please provide the complete Pulumi JavaScript infrastructure code with proper resource organization. I need separate files for each major component if that makes sense for organization.