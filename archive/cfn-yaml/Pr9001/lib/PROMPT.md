Design and implement a secure, highly available web application infrastructure using CloudFormation in YAML format for the us-west-2 region. The infrastructure should demonstrate AWS best practices for security, scalability, and observability through proper service integration and connectivity.

## Infrastructure Architecture

Build a complete web application environment where an Application Load Balancer receives incoming HTTP traffic and distributes it across multiple EC2 web servers running in an Auto Scaling group. These web servers connect to a MySQL RDS database deployed in isolated private subnets while accessing static content stored in S3 through IAM role permissions.

### Network Layer

Create a custom VPC with both public and private subnet tiers across two availability zones. The public subnets host the Application Load Balancer and provide internet connectivity through an Internet Gateway. EC2 instances in these public subnets connect to the RDS database located in private subnets through security group rules that restrict access to port 3306 only from the web tier. A NAT Gateway in the public subnet enables EC2 instances to download software updates and patches while keeping the private subnet resources isolated from direct internet access.

### Compute and Auto Scaling

Deploy a minimum of two EC2 instances managed by an Auto Scaling group that automatically adjusts capacity based on demand. Use launch templates with user data scripts that bootstrap Apache web servers on startup. Each instance assumes an IAM role that grants read-only access to a specific S3 bucket for serving static content like images and CSS files. The Application Load Balancer performs health checks on port 80 and only sends traffic to healthy instances.

### Database Layer

Deploy a Multi-AZ MySQL RDS instance that automatically replicates data to a standby in another availability zone. The database uses AWS-managed KMS keys for encryption at rest and sits entirely within private subnets with public access explicitly disabled. Security groups allow inbound connections only from the EC2 web tier on port 3306 and deny any remaining connections.

### Storage and IAM

The S3 bucket stores static web content that EC2 instances retrieve through IAM role permissions rather than hardcoded credentials. The IAM role attached to EC2 instances follows least privilege principles by granting only s3:GetObject and s3:ListBucket permissions scoped to a single bucket ARN. This eliminates the need for access keys while maintaining security.

### Monitoring and Alerting

CloudWatch collects metrics from all infrastructure components and triggers alarms when thresholds are exceeded. When EC2 CPU utilization crosses 80%, CloudWatch sends a notification through SNS that delivers email alerts to operations staff. Similarly, RDS alarms monitor database CPU usage and available storage space, triggering SNS notifications when free storage drops below 10GB so administrators can take action before disk space runs out.

### Security Controls

All data stores use encryption at rest through AWS-managed KMS keys, including EBS volumes attached to EC2 instances and the RDS database storage. Security groups implement network segmentation by allowing the ALB to accept traffic from the internet on ports 80 and 443, while restricting the web tier to receive traffic only from the ALB. The database tier accepts connections solely from the web tier security group on port 3306. No resources in private subnets have direct internet access, and the RDS endpoint is not publicly accessible.

## Deliverable Requirements

Produce a deployable CloudFormation template in YAML format that includes:

- Parameters for customizing instance types, database credentials using NoEcho for security, and subnet CIDR blocks
- IAM policies with resource-specific ARNs rather than asterisk-based access patterns  
- Complete VPC networking including route tables, subnet associations, and gateway attachments
- Security groups with explicit source and destination rules for each tier
- CloudWatch alarms connected to SNS topics for operational alerting
- Outputs that expose the ALB DNS name for accessing the application, the RDS endpoint for database connections, and the Auto Scaling group name for monitoring

The template must be self-contained and deployable without manual modifications or external dependencies. IAM policies should specify exact resource ARNs for the S3 bucket using precise scope definitions. Ensure the infrastructure achieves high availability through Multi-AZ RDS deployment and Auto Scaling group distribution across multiple availability zones.
