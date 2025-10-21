Create a production-ready AWS CloudFormation YAML template that defines a secure, scalable, and highly available web application infrastructure in the **us-east-1** region.

The setup should begin with a **VPC** designed for resilience — containing two public and two private subnets distributed across separate Availability Zones to ensure high availability. The public subnets should provide external connectivity through an **Internet Gateway**, while each private subnet should have its own **NAT Gateway** to allow outbound internet traffic for internal instances without exposing them publicly.

Establish **security groups** that permit HTTP (port 80) and HTTPS (port 443) access to resources in public subnets, while ensuring private subnets only communicate internally with trusted resources. Within the private subnets, deploy an **Auto Scaling Group** of **EC2 instances** launched via a **Launch Template** that references the latest Amazon Linux 2 AMI. The scaling group should automatically adjust capacity based on **CloudWatch Alarms** monitoring CPU utilization.

Front this architecture with an **Application Load Balancer (ALB)** configured to route traffic securely over HTTPS using an AWS-managed SSL/TLS certificate. All incoming web traffic should reach the ALB through the internet-facing public subnets, which then forwards requests to the private EC2 instances.

Enable centralized **logging** through an **S3 bucket** with versioning turned on to ensure log retention and data integrity. All resources should be tagged consistently to support environment tracking, cost monitoring, and compliance.

The resulting CloudFormation template must follow AWS best practices for security, scalability, and cost efficiency — defining all necessary parameters, conditions, and outputs to support a complete, reusable, and production-grade infrastructure deployment.
