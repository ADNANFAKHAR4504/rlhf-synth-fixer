Generate a production-ready, modular AWS CDKTF TypeScript project that sets up a scalable and secure web application infrastructure. The generator should create only two files: lib/tap-stack.ts for the main stack definition and lib/modules.ts for the reusable infrastructure components.

REQUIREMENTS

1. Project Structure and Configuration: 
Modular Design: Organize the infrastructure into logical, reusable modules within modules.ts for VPC, Security Groups, IAM, ALB, Auto Scaling, RDS, CloudWatch, and SSM.

Environment Parameterization: The stack must be configurable for different environments, such as dev or prod, using an environmentSuffix property.

Region Configuration: The AWS region should be configurable, with a default of us-east-1.

Project Naming: All resources must use consistent names with a projectName and the environmentSuffix.

2. State Management:

S3 Backend: Use an S3 backend for managing remote state.
Configuration: Set up the backend with a bucket name, region, and a key path formatted as {environment}/{stack-id}.tfstate.
Security: Enable state file encryption and implement native state locking (use_lockfile: true) with a CDKTF override.

3. Network Infrastructure (VpcModule):

VPC and Subnets: Create a VPC with a default CIDR of 10.0.0.0/16. It must have public and private subnets in multiple configurable Availability Zones.
Internet Connectivity: Add an Internet Gateway to the VPC and a public route table for internet access from public subnets.
NAT Gateways: Configure NAT Gateways, along with Elastic IPs, in the public subnets to support outbound internet access from the private subnets. Allow for both single and per-AZ NAT Gateway setups.
Database Subnet Group: Automatically create a DbSubnetGroup from the private subnets for the RDS instance.

4. Security Controls (SecurityGroupsModule & IamModule):

Security Groups:

ALB SG: Allows incoming HTTP traffic from the internet (0.0.0.0/0).
EC2 SG: Allows incoming traffic on the application port (e.g., 8080) only from the ALB's security group.
RDS SG: Allows incoming traffic on the database port (e.g., 5432) only from the EC2 instances' security group.
All security groups must permit all outbound traffic.

IAM for EC2:

Create an IAM role and instance profile for EC2 instances.
Attach the AmazonSSMManagedInstanceCore managed policy to enable SSM Session Manager access.
Attach an inline policy that authorizes writing to CloudWatch Logs and reading parameters from SSM Parameter Store under the project's specific path (/project/environment/*).
Allow for dynamically adding more managed policies.

5. Application Hosting (AlbModule & AsgModule):

Application Load Balancer (ALB):
Set up a public-facing Application Load Balancer in the public subnets.
Configure an HTTP listener on port 80 to forward traffic to a target group.
The target group should perform health checks on a configurable path, such as /health.

Auto Scaling Group (ASG):

Use a Launch Template to define the EC2 instance setup, including a custom AMI ID, instance type (t3.medium), optional key pair, and IAM instance profile.
The Launch Template must include a user data script to install the Amazon CloudWatch Agent.
Create an Auto Scaling Group to launch instances in the private subnets, with configurable minSize, maxSize, and desiredCapacity.
Link the ASG with the ALB's target group and use ELB health checks.

6. Database and Secrets (RdsModule & SsmParameterModule):

RDS Database:
Set up a PostgreSQL RDS instance (db.t3.medium) with gp3 storage.
High Availability: Deploy the RDS instance in a Multi-AZ setup.
Security: Enable storage encryption. Accept the master password as an input parameter; if it is not provided, generate it randomly.
Secrets Management: Securely store the database master password in the AWS SSM Parameter Store as a SecureString.
Backups & Maintenance: Configure a 7-day backup retention period and enable deletion protection for production environments.
SSM Parameters: Store essential outputs like the RDS endpoint, database name, and ALB DNS name in SSM Parameter Store for application use.

7. Logging and Monitoring (CloudWatchModule):

Log Management: Create CloudWatch Log Groups for both the application (from EC2 instances) and the ALB, allowing for a configurable log retention period, defaulting to 7 days.

Alarms and Notifications:

Create an SNS topic for alarm notifications and optionally set up an email subscription.
EC2 CPU Alarm: Trigger an alarm if the average CPU usage across the ASG exceeds 80% for two consecutive 5-minute periods.
RDS Storage Alarm: Trigger an alarm if the free storage space on the RDS instance falls below 1 GB.

8. Tagging and Outputs  
Resource Tagging: Tag all created resources consistently with Project, Environment, ManagedBy, and CreatedBy tags.