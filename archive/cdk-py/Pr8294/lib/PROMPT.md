Need a CDK Python project for deploying a web application in us-west-2. The setup should handle auto-scaling and have proper database connectivity.

Here's what I need:

**Network Setup**
Create a VPC with public and private subnets. EC2 instances will run in public subnets since they need to be accessible through the load balancer. RDS should be in private subnets for security.

**Application Tier**
Set up EC2 instances running in an Auto Scaling Group that connects to an Application Load Balancer. The ALB handles HTTP traffic from the internet and routes it to healthy EC2 instances. Configure health checks so the ASG can replace unhealthy instances automatically.

**Database Connection**
Deploy MySQL on RDS in the private subnets. The EC2 instances need to connect to this database, so security groups must allow MySQL traffic from the EC2 security group to the RDS security group. Store database credentials in Secrets Manager so the EC2 instances can retrieve them securely rather than hardcoding credentials.

**Auto Scaling**
Configure the ASG to scale based on CPU utilization. When CPU goes above 50%, spin up more instances. Keep at least 2 instances running for high availability.

The load balancer DNS will be the entry point for the application, and it forwards traffic to EC2 instances that fetch data from RDS using credentials from Secrets Manager.

Use CDK Python and output to app.py.