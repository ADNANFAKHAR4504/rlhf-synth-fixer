I need a production-ready CloudFormation template in JSON format that provisions a highly available web application infrastructure on AWS. The infrastructure should comply with strict security requirements and follow AWS Well-Architected Framework principles.

For the virtual private cloud architecture I need a VPC with CIDR block 10.0.0.0/16 deployed across at least 2 availability zones. Create 2 public subnets using 10.0.1.0/24 and 10.0.2.0/24 for NAT gateways and load balancer. Create 2 private subnets using 10.0.10.0/24 and 10.0.11.0/24 for EC2 instances. Create 2 database subnets using 10.0.20.0/24 and 10.0.21.0/24 for RDS instances. Configure route tables appropriately for each subnet type.

For NAT gateway configuration deploy NAT gateways in each public subnet for high availability. Allocate Elastic IPs for NAT gateways. Configure private subnet route tables to use respective NAT gateways. Ensure outbound internet connectivity for private resources.

For EC2 instance configuration all EC2 instances MUST be launched in private subnets only with NO public IP addresses assigned to EC2 instances. Use Amazon Linux 2023 AMI latest version with instance type t3.medium for production workload. Configure user data script to install and start a web server. Enable detailed monitoring. Encrypt all EBS volumes using AWS managed KMS keys. Root volume should be 20 GB encrypted gp3. Additional data volume should be 100 GB encrypted gp3.

For auto scaling requirements create Launch Template with the EC2 configuration. Configure Auto Scaling Group with minimum instances 2 desired capacity 4 and maximum instances 10. Scale based on CPU utilization target 70 percent. Health check type should be ELB. Health check grace period should be 300 seconds. Enable instance refresh for deployments.

For load balancing deploy Application Load Balancer ALB in public subnets. Configure HTTP listener on port 80. Configure HTTPS listener on port 443 using certificate ARN as parameter. Create target group for EC2 instances. Health check path should be /health. Sticky sessions enabled with 1-day duration.

For database configuration using RDS deploy MySQL 8.0 RDS instance. Multi-AZ deployment for high availability. Instance class should be db.t3.medium. Allocated storage should be 100 GB encrypted. Storage auto-scaling enabled with max 500 GB. Automated backups with 7-day retention. Backup window should be 03:00-04:00 UTC. Maintenance window should be Sunday 04:00-05:00 UTC. DB subnet group using database subnets. No public accessibility.

For security configuration accept EC2 key pair name as parameter and apply to all EC2 instances for SSH access. For security groups create ALB Security Group with ingress HTTP 80 and HTTPS 443 from 0.0.0.0/0 and egress all traffic to EC2 security group. Create EC2 Security Group with ingress HTTP 80 from ALB security group only ingress SSH 22 from bastion security group if exists egress HTTPS 443 to 0.0.0.0/0 for updates and egress MySQL 3306 to RDS security group. Create RDS Security Group with ingress MySQL 3306 from EC2 security group only and no egress rules needed.

For IAM roles and policies create IAM role for EC2 instances with AmazonSSMManagedInstanceCore policy for Systems Manager custom policy for S3 read access to specific bucket and custom policy for CloudWatch Logs write access. Instance profile for EC2 instances. No use of AWS root account credentials.

The template should accept the following parameters EnvironmentName supporting dev staging prod KeyPairName for existing EC2 key pair CertificateArn for ACM certificate for HTTPS DatabaseUsername for master username and DatabasePassword for master password with NoEcho.

Export the following values for cross-stack references VPC ID Public Subnet IDs comma-delimited Private Subnet IDs comma-delimited ALB DNS Name ALB Hosted Zone ID RDS Endpoint Address RDS Port Auto Scaling Group Name EC2 Security Group ID and IAM Role ARN.

Additional constraints include using intrinsic functions for dynamic values implementing proper resource dependencies adding meaningful descriptions to all resources using tags for cost tracking with Environment Project Owner ensuring deletion protection on critical resources and template must be deployable in us-west-2 region.

The solution will be validated against successful CloudFormation stack creation all EC2 instances running in private subnets only successful ALB health checks RDS Multi-AZ verified encrypted volumes confirmed security group rules properly restricted Auto Scaling functioning correctly no public IP addresses on EC2 instances all required outputs exported and zero security vulnerabilities. Please provide a complete production-ready CloudFormation JSON template that implements all requirements above. The template should follow AWS best practices and be deployable without errors.
