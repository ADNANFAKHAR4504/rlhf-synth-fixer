I need to create an AWS CloudFormation template for a production web application that needs to run in us-east-1 and us-west-2.

The architecture should work as follows:

An Application Load Balancer receives incoming HTTPS traffic on port 443 and distributes requests to EC2 instances running in an Auto Scaling group within private subnets across multiple Availability Zones. I want t3.micro instances with a minimum of 2 and maximum of 6 instances. The ALB is configured with SSL certificate management and connects to the Auto Scaling group via a Target Group that performs health checks on port 80.

The EC2 instances in the private subnets connect to an RDS MySQL database with Multi-AZ deployment for data persistence. Security groups control the traffic flow: the ALB security group should accept inbound HTTPS from the internet, the EC2 security group should accept traffic from the ALB on port 80, and the RDS security group should accept traffic from the EC2 instances on port 3306.

EC2 instances have IAM roles attached that grant permissions to access S3 buckets for storing application assets and logs with AES-256 encryption and send metrics and logs to CloudWatch. NAT Gateways deployed in public subnets enable the EC2 instances in private subnets to pull software updates and access external APIs on the internet while remaining unreachable from inbound internet traffic.

CloudWatch monitors ALB request counts and response times, EC2 CPU utilization and network metrics, and RDS database connections and disk usage. CloudWatch alarms trigger Auto Scaling policies to scale the EC2 fleet up when CPU exceeds 70% and scale down when it drops below 30%.

The VPC uses 10.0.0.0/16 CIDR with public subnets for the ALB and NAT Gateways, and private subnets for EC2 instances and RDS. All resources are tagged with environment:production for compliance tracking.

I want to use CloudFormation's new optimistic stabilization feature to speed up deployments. The template should handle errors properly, follow AWS Well-Architected principles, and work in both regions.

Give me the complete CloudFormation YAML template. Keep it to one file if possible but make sure it's production ready.