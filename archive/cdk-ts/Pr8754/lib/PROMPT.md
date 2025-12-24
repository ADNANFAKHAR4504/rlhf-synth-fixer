I need to create a scalable AWS infrastructure using CDK TypeScript for a web application. The requirements are:

Create a VPC with proper network segmentation including public and private subnets across multiple availability zones for high availability. The VPC connects to an Internet Gateway that routes outbound traffic from public subnets, while NAT Gateways in each AZ enable private subnet resources to access the internet securely.

Set up an Auto Scaling group that dynamically manages EC2 instances based on CPU utilization, scaling between 2 and 10 instances. The Auto Scaling group launches instances using a Launch Template that attaches an IAM instance profile, allowing EC2 instances to securely call AWS Systems Manager and CloudWatch APIs.

Deploy an Application Load Balancer in the public subnets that distributes incoming HTTP/HTTPS traffic to the EC2 instances managed by the Auto Scaling group. The ALB performs health checks against the target group to ensure traffic only routes to healthy instances.

The EC2 instances in private subnets connect to an ElastiCache Redis cluster for session caching and application data caching. Security groups control this connectivity - the web server security group allows inbound traffic from the ALB, while the ElastiCache security group only accepts connections from the web server security group on port 6379.

Configure CloudWatch integration where EC2 instances publish custom metrics and logs via the CloudWatch agent. The Auto Scaling group uses CloudWatch alarms to trigger scaling policies based on CPU utilization thresholds.

Store infrastructure configuration in SSM Parameter Store so that EC2 instances can retrieve VPC IDs, subnet information, and cache endpoints at runtime without hardcoding values.

Generate infrastructure code using AWS CDK TypeScript with one code block per file. Make sure the deployment time is optimized and avoid resources that take too long to deploy.
