I need a CloudFormation template for a high availability web application stack that can automatically recover from failures. This is for the us-west-2 region and needs to handle failures gracefully across multiple availability zones.

The main goal is to build a resilient web app where if something breaks, the system fixes itself automatically. The ALB should route traffic to EC2 instances in private subnets, and when instances fail health checks, Auto Scaling should launch new ones. Route 53 should monitor the ALB endpoint so we can failover DNS if the whole stack goes down.

Here's how the services need to connect:

The ALB sits in public subnets and distributes traffic to EC2 instances running in private subnets across three availability zones. The ALB performs health checks on the instances, and when an instance fails these checks, the Auto Scaling Group detects this and launches a replacement instance automatically.

Route 53 has a health check that monitors the ALB endpoint. If the ALB becomes unhealthy, Route 53 can route traffic elsewhere for DNS-level failover.

CloudWatch monitors the Auto Scaling Group's CPU utilization. When CPU gets too high, CloudWatch triggers the scaling policy to add more instances. CloudWatch also sends alerts to SNS when alarms fire, so the team gets notified about scaling events and issues.

AWS Backup automatically discovers EC2 instances tagged for backup and creates daily snapshots. These backups can be used to restore instances if something goes wrong.

For security, the ALB security group allows internet traffic on ports 80 and 443, but the EC2 instances only accept traffic from the ALB security group on port 8080. This way instances aren't directly exposed to the internet.

The template should use parameters for instance type, the Route 53 hosted zone name like example.com, and the ACM certificate ARN for HTTPS. Use mappings for AMI IDs so it's easy to update to newer AMIs later.

Make sure EC2 instances use encrypted EBS volumes and have an IAM role that allows them to send metrics to CloudWatch. The instances should have detailed monitoring enabled so we can track performance.

The template needs to work with CloudFormation StackSets, so avoid hardcoded account-specific values. Use the stack name prefix for all resources so they're easy to identify.

Output the ALB DNS name and the application URL so we know where to access the app after deployment.

Generate a complete YAML CloudFormation template ready for deployment. Include comments explaining major sections and use consistent naming with the stack name prefix.
