Build me a production-ready web application infrastructure on AWS using Terraform.

I need an Application Load Balancer that receives HTTP and HTTPS traffic from the internet and routes requests to an Auto Scaling group of EC2 instances running in multiple availability zones. The ALB security group allows inbound traffic on ports 80 and 443, and the EC2 security group accepts traffic only from the ALB security group.

The EC2 instances connect to an RDS MySQL database through a database security group that allows port 3306 only from the web server security group. The RDS instance runs in multi-AZ mode for high availability and has automated backups enabled with 7-day retention.

Create IAM roles attached to the EC2 instances that follow least privilege principles and grant only the permissions needed for the application. The Auto Scaling group scales instances up and down based on CPU utilization thresholds.

CloudWatch collects logs and metrics from the EC2 instances and RDS database. Set up CloudWatch alarms that monitor CPU utilization, memory usage, and database connections.

Deploy everything in us-east-1 using the default VPC. Tag all resources with Environment set to Production. Output the load balancer DNS name and database endpoint.
