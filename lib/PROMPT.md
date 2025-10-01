I need to create a CDK TypeScript infrastructure for a startup blog platform that will handle about 2000 daily visitors. The deployment should be in us-west-2.

Here are the specific requirements:

Network Infrastructure:
- Create a VPC with CIDR 10.1.0.0/16
- Set up two public subnets: 10.1.1.0/24 and 10.1.2.0/24
- Configure an Internet Gateway for public subnet connectivity

Compute Resources:
- Deploy EC2 t3.micro instances running Apache web server
- Create an Auto Scaling Group with minimum 2 and maximum 4 instances for high availability
- Use Amazon Linux 2023 AMI with Apache pre-configured via UserData
- Implement an Application Load Balancer to distribute traffic across instances

Security Configuration:
- Configure Security Groups to allow HTTP traffic (port 80) from anywhere
- Restrict SSH access (port 22) to only 192.168.0.0/24 CIDR range
- Enable VPC Flow Logs for security monitoring using the new VPC Flow Logs enhancements

Storage:
- Create an S3 bucket for static assets with versioning enabled
- Configure bucket with server-side encryption using S3 managed keys
- Set up lifecycle policies to transition old versions to S3 Intelligent-Tiering after 30 days

Monitoring:
- Set up CloudWatch monitoring for EC2 CPU utilization and memory metrics
- Configure CloudWatch alarms for CPU usage above 80% and low available memory
- Use CloudWatch Application Signals to track application performance metrics
- Create a CloudWatch Dashboard to visualize all metrics

Please provide the complete CDK TypeScript infrastructure code. Generate one code block for each file needed, including the main stack file and any supporting constructs or configuration files. Make sure the code follows CDK best practices and is production-ready.