Create a Terraform configuration for a highly available web application deployment in AWS.

**Networking Layer:**

Set up a VPC with public and private subnets spread across multiple availability zones. The public subnets connect to the internet through an Internet Gateway, while private subnets route outbound traffic through a NAT Gateway with an Elastic IP.

**Application Layer:**

Deploy an Application Load Balancer in the public subnets that distributes traffic to an Auto Scaling Group of EC2 instances running in the private subnets. The ALB performs health checks on the EC2 instances and routes requests only to healthy targets. The Auto Scaling Group scales based on CPU utilization metrics published to CloudWatch.

**Storage Layer:**

Create an EFS file system that mounts to all EC2 instances in the Auto Scaling Group, providing shared storage for application data. The EFS mount targets are deployed in each private subnet and secured by a security group that only allows NFS traffic from the EC2 instances.

**Database Layer:**

Provision an RDS MySQL database in a Multi-AZ configuration within the private subnets. The database security group accepts connections only from the EC2 instances. Store the database credentials securely in SSM Parameter Store as SecureString parameters.

**Security and Encryption:**

Use KMS customer managed keys to encrypt the RDS database storage and EFS file system. Configure IAM roles for EC2 instances with permissions to read from SSM Parameter Store and write logs to CloudWatch.

**Event Monitoring:**

Set up EventBridge rules that capture Auto Scaling Group lifecycle events and send notifications to CloudWatch Logs. This enables monitoring of instance launches and terminations.

**Tagging:**

Apply consistent tags to all resources including Environment, Application, and ManagedBy tags.

Generate everything in a single tap_stack.tf file with variables, locals, resources, and outputs. Follow least-privilege security principles throughout.
