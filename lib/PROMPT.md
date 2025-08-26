You are an expert AWS Cloud Engineer specializing in Infrastructure as Code (IaC) using the AWS Cloud Development Kit (CDK) with Go. Your mission is to create a robust and production-ready AWS CDK in Go template for a foundational cloud environment. The template should be well-structured, follow best practices, and ensure all resources are securely interconnected.

**Project Goal:**

Deploy a foundational AWS environment in the `us-east-1` region. This setup will include a custom VPC, public and private subnets, secure database and compute resources, and proper monitoring and storage. The entire infrastructure must be defined within a single CDK Go template.

**Core Infrastructure Requirements:**

1.  **Virtual Private Cloud (VPC):**
    - Provision a new VPC with the CIDR block `10.0.0.0/16`.
    - Create two public subnets and two private subnets. Ensure high availability by distributing these subnets across at least two different Availability Zones.
    - Implement an Internet Gateway and attach it to the VPC to allow communication between resources in your VPC and the internet.
    - Set up a NAT Gateway in one of the public subnets to allow instances in the private subnets to initiate outbound traffic to the internet (e.g., for software updates) while remaining inaccessible from the outside world.

2.  **Database Tier:**
    - Deploy a highly available Amazon RDS for MySQL instance.
    - Place the database instances in the private subnets to protect them from public internet access.
    - Configure the RDS instance for Multi-AZ deployment to ensure high availability and automatic failover.
    - Set up a CloudWatch Alarm to monitor the `CPUUtilization` of the RDS instance and trigger an alert if it exceeds 75% for a sustained period.

3.  **Compute Tier:**
    - Launch an EC2 instance in one of the public subnets. This instance will serve as a web server or bastion host.
    - The EC2 instance should be configured with an IAM role that grants it read-only permissions (`s3:GetObject`) to the S3 bucket created below.

4.  **Storage:**
    - Create an S3 bucket for storing application assets or logs.
    - Implement a bucket policy that restricts access, allowing connections only from within the VPC.
    - Enable server access logging for the S3 bucket to track all requests made to it.

**Resource Connectivity and Security:**

This is a critical part of the task. Please ensure the resources are securely connected:

- **EC2 to RDS Communication:** Create a security group for the RDS instance that only allows inbound MySQL traffic (port 3306) from the security group attached to the EC2 instance. This ensures that only the EC2 instance can communicate with the database.
- **Public Access:** The EC2 instance's security group should allow inbound HTTP (port 80) and HTTPS (port 443) traffic from the internet (`0.0.0.0/0`). It should also allow SSH (port 22) access, but restrict the source to a specific, parameterized IP address for security. Deny all other inbound traffic by default.
- **VPC Endpoints:** Use a VPC Gateway Endpoint for S3 to allow the EC2 instance to access the S3 bucket privately without traversing the public internet.

**Configuration and Best Practices:**

- **Tagging:** Apply consistent tags to all created resources for cost allocation and resource management. All resources must be tagged with `Environment: Production` and `Project: CDKSetup`.
- **Parameterization:** Make the template flexible by using CDK parameters for configurable values like the allowed SSH IP address, instance types, and database credentials. Avoid hardcoding values.
- **Naming Convention:** Use a clear and consistent naming convention for all resources, prefixed with `cf-`, for example, `cf-vpc`, `cf-rds-sg`, etc.
- **Output:** The final product should be a single, validated CDK Go template file. Ensure the code is clean, well-commented, and ready for deployment.

Please generate the complete Go code for the CDK stack that implements all of the above requirements.
