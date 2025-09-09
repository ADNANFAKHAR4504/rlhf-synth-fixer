### Reasoning Trace
---

Let me break down the requirements:

1. VPC in us-east-2 with CIDR 10.0.0.0/16 with VPC Flow Logs
2. Private and public subnets with NAT gateway, internet gateway, route tables
3. 3 EC2 instances with latest Amazon Linux 2 AMI in 3 different AZs in private subnets
4. Auto Scaling group
5. IAM role for EC2 with S3 and CloudWatch access
6. Route 53 for DNS management with tapstacknewtest.com
7. Application Load Balancer
8. Internet access via NAT gateway
9. CloudWatch metrics for ASG
10. RDS with individual instances (not cluster), automatic backups, private subnets, random username (8 chars, starts with letter, no special chars), random password (16 chars with special chars but AWS-allowed), AWS Secrets Manager, not publicly accessible, automatic minor version upgrades, Multi-AZ
11. Security Groups for EC2 and RDS
12. Detailed CloudWatch monitoring for instances
13. Tag all resources with 'Environment:Production'

I need to create:
- Variables for region, etc.
- VPC with flow logs
- Public and private subnets in 3 AZs
- Internet Gateway
- NAT Gateway
- Route tables and associations
- Security groups
- IAM role and instance profile for EC2
- Launch template for EC2
- Auto Scaling Group
- Application Load Balancer with target group
- Route 53 hosted zone and records
- RDS subnet group
- RDS instance with Multi-AZ
- Secrets Manager secret for RDS credentials
- S3 bucket for VPC flow logs
- CloudWatch log group for VPC flow logs

Let me start writing the Terraform configuration:

```hcl
# Variables
variable "region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

I'll define additional variables to configure the infrastructure's core network and domain settings. These variables will help parameterize the deployment, making it more flexible and easier to modify. The region is set to us-east-2, matching the initial requirements, and I'll include a CIDR block and domain name to support the network and DNS configuration.

The data sources will help me dynamically fetch available AWS resources. I'll query for available zones and find the most recent Amazon Linux AMI that meets specific criteria. By using filters, I can ensure I'm selecting a compatible, up-to-date machine image for my instances.

dns_support = true

  tags = merge(
    local.common_tags,
    {
      Name = "Main VPC"
    }
  )
}

I'll create an internet gateway attached to the VPC to enable network connectivity. The public and private subnets will be distributed across three availability zones for high availability and fault tolerance.

The public subnets will automatically assign public IP addresses, while private subnets remain isolated. I'll use a consistent CIDR block strategy, reserving different address ranges for each subnet type. Tagging resources will help with organization and tracking.

merge(
  local.common_tags, 
  {
    Name = "Private Subnet ${count.index + 1}"
    Type = "Private"
  }
)

I'll provision three Elastic IPs for NAT gateways, ensuring each public subnet has a dedicated NAT gateway for private subnet internet access. The route tables will direct traffic through the internet gateway for public subnets and NAT gateways for private subnets.

I'll create route table associations to connect public and private subnets with their respective routing rules, enabling controlled network traffic flow across the VPC infrastructure.

The configuration ensures network segmentation and secure internet connectivity for different subnet types, with consistent tagging and systematic resource naming.

I'll generate a unique S3 bucket for storing VPC flow logs, implementing versioning and preparing for encryption configuration to enhance logging and monitoring capabilities.

The CloudWatch log group will capture VPC flow logs with a 14-day retention period, ensuring efficient log management while maintaining compliance and troubleshooting capabilities.

An IAM role is being established specifically for VPC flow log processing, with a trust relationship defined to enable appropriate access and permissions for log collection and management.

The IAM role policy grants comprehensive permissions for log group and stream operations, allowing the VPC flow log service to create, describe, and write log events across the infrastructure.

A flow log is configured to capture all network traffic within the main VPC, routing logs to the designated CloudWatch log group through the created IAM role for comprehensive network monitoring.

The application load balancer security group is designed with permissive inbound rules for HTTP and HTTPS traffic from any source, while maintaining an unrestricted outbound configuration to support flexible network connectivity.

The EC2 instances' security group restricts inbound traffic, allowing HTTP access only from the load balancer and SSH access exclusively from within the VPC, ensuring controlled and secure instance access.

The RDS security group is being configured with specific ingress rules to control database network access, with an initial focus on MySQL/Aurora protocol connectivity.

I'll define an IAM role for the EC2 instances, establishing a trust relationship that permits the EC2 service to assume this role. The role's configuration will enable secure, programmatic interactions with AWS services.

The accompanying IAM policy will define precise permissions for the EC2 role, specifying the exact AWS resource access and actions permitted for these instances.

Specifically, the policy grants the EC2 instances capabilities to:
- Interact with the S3 flow logs bucket, including read, write, and delete operations
- Interact with CloudWatch for metric and log management, enabling comprehensive monitoring and logging functionality

These permissions are carefully scoped to provide necessary operational capabilities while maintaining a principle of least privilege.

The IAM instance profile is created with a specific naming convention, linking the previously defined IAM role and incorporating standard tagging practices. This profile will be attached to EC2 instances, enabling them to assume the defined permissions seamlessly.

The launch template establishes a standardized configuration for EC2 instances, specifying:
- Amazon Linux AMI
- t3.micro instance type
- Associated security group
- IAM instance profile
- Enabled monitoring
- Basic web server setup via user data script

The template includes tag specifications for instances and uses a lifecycle rule to support smooth infrastructure updates. It ensures instances can be replaced without disrupting the overall system.

The application load balancer is configured as an internet-facing service, utilizing public subnets and a dedicated security group. It's set up without deletion protection to allow easier management during infrastructure changes.

The target group defines HTTP routing parameters, with comprehensive health check settings to ensure only healthy instances receive traffic. Checks occur every 30 seconds, with specific success criteria and timeout parameters.

The listener establishes HTTP traffic routing, forwarding incoming requests to the target group. This enables seamless distribution of web traffic across multiple instances.

The auto scaling group manages instance deployment across private subnets, maintaining a resilient infrastructure with 3-9 instances. It tracks key performance metrics and uses a rolling refresh strategy to update instances while maintaining at least 50% system availability.

Route 53 creates a hosted zone for the specified domain, setting up DNS management. An alias record maps the domain directly to the load balancer, ensuring traffic is routed efficiently and health checks validate target accessibility.

Secrets Manager secures sensitive database credentials, generating a protected storage mechanism for critical connection information. This approach isolates and encrypts database authentication details, enhancing overall system security.

The RDS configuration establishes a MySQL database with robust storage parameters. I'm configuring a small t3.micro instance with flexible storage allocation, encryption, and dynamic credential retrieval from the previously created secret. The subnet group ensures the database is deployed across private network segments for enhanced isolation and resilience.

Key database settings include automated weekly backups, a specific maintenance window, and multi-availability zone deployment for high availability. The instance is configured to prevent public access and automatically apply minor version upgrades, enhancing security and system maintenance.

I'll define outputs to expose critical infrastructure details like VPC configuration, subnet identifiers, and network gateway information. These will help track and reference core network resources programmatically.

The outputs capture essential identifiers for the VPC, its CIDR block, public and private subnet IDs, and gateway resources, enabling easy integration and reference across infrastructure management workflows.

I'll continue with additional outputs for load balancing, compute, and security group resources, providing comprehensive visibility into the deployed infrastructure's key components.

The remaining outputs will include load balancer details, auto scaling group configuration, launch template specifications, and security group identifiers for different resource types, ensuring comprehensive infrastructure tracking.

Specific outputs cover RDS instance details like endpoint and identifier, S3 bucket information for VPC flow logs, and Route 53 zone configuration, enabling precise resource management and monitoring across the cloud environment.

These outputs provide critical reference points for infrastructure deployment, facilitating easier management, troubleshooting, and integration with other systems and services.

The next set of outputs extends resource tracking, revealing domain configuration, EC2 instance metadata, IAM role specifics, and availability zone details, ensuring comprehensive visibility into the cloud infrastructure's core components.

I'll capture the remaining Secrets Manager and CloudWatch log group outputs, which provide critical credential and logging tracking mechanisms for the deployment. These outputs enable precise monitoring and secure credential management across the infrastructure.

The infrastructure checklist appears partially incomplete, suggesting additional configuration requirements need verification before final deployment.

I'll focus on the new item: deploying three EC2 instances across different availability zones within private subnets using the latest Amazon Linux 2 AMI. This approach ensures high availability and distributed system resilience by spreading instances across multiple fault domains.

The configuration will leverage private subnet placement, preventing direct internet exposure while maintaining connectivity through the NAT gateway. Each instance will be strategically positioned to maximize fault tolerance and minimize potential single points of failure in the architecture.
### Answer 
---

# tap_stack.tf

```hcl
# Variables
variable "region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "domain_name" {
  description = "Domain name for Route 53"
  type        = string
  default     = "tapstacknewtest.com"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Locals
locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
  common_tags = {
    Environment = "Production"
  }
}

# Random resources for RDS credentials
resource "random_string" "db_username" {
  length  = 7
  special = false
  upper   = false
  lower   = true
  numeric = true
}

resource "random_password" "db_password" {
  length  = 16
  special = true
  # AWS RDS doesn't allow certain special characters like @, ", \, ', /, space
  override_special = "!#$%&*+-=?^_`{|}~"
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
  lower   = true
  numeric = true
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "tap-stack-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "tap-stack-igw"
  })
}

# Public Subnets - 3 subnets in different AZs
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "tap-stack-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets - 3 subnets in different AZs for EC2 instances
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "tap-stack-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 3

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "tap-stack-nat-eip-${count.index + 1}"
  })
}

# NAT Gateways - one per AZ for high availability
resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "tap-stack-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "tap-stack-public-rt"
  })
}

# Route Tables for Private Subnets - one per AZ with dedicated NAT Gateway
resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "tap-stack-private-rt-${count.index + 1}"
  })
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# S3 Bucket for VPC Flow Logs
resource "aws_s3_bucket" "flow_logs" {
  bucket        = "tap-stack-vpc-flow-logs-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs"
  retention_in_days = 14

  tags = local.common_tags
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  name = "tap-stack-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "flow_logs" {
  name = "tap-stack-vpc-flow-logs-policy"
  role = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = local.common_tags
}

# Security Group for Application Load Balancer
resource "aws_security_group" "alb" {
  name_prefix = "tap-stack-alb-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "tap-stack-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for EC2 Instances
resource "aws_security_group" "ec2" {
  name_prefix = "tap-stack-ec2-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instances"

  ingress {
    description     = "HTTP from Load Balancer"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH from within VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "tap-stack-ec2-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for RDS Instance
resource "aws_security_group" "rds" {
  name_prefix = "tap-stack-rds-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS instance"

  ingress {
    description     = "MySQL/Aurora from EC2 instances"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "tap-stack-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2" {
  name = "tap-stack-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for EC2 Role - S3 and CloudWatch access
resource "aws_iam_role_policy" "ec2" {
  name = "tap-stack-ec2-policy"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.flow_logs.arn,
          "${aws_s3_bucket.flow_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name = "tap-stack-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = local.common_tags
}

# Launch Template for EC2 Instances
resource "aws_launch_template" "main" {
  name_prefix   = "tap-stack-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  # Enable detailed CloudWatch monitoring
  monitoring {
    enabled = true
  }

  # User data to install and configure web server
  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Tap Stack Web Server - $(hostname)</h1>" > /var/www/html/index.html
              echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
              echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "tap-stack-instance"
    })
  }

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "tap-stack-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = local.common_tags
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  name     = "tap-stack-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = local.common_tags
}

# ALB Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  tags = local.common_tags
}

# Auto Scaling Group with 3 instances across 3 AZs
resource "aws_autoscaling_group" "main" {
  name                = "tap-stack-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 3
  max_size         = 9
  desired_capacity = 3

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  # Enable CloudWatch metrics for Auto Scaling group
  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "tap-stack-asg-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = "Production"
    propagate_at_launch = true
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = local.common_tags
}

# Route 53 Record for ALB
resource "aws_route53_record" "main" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Route 53 Record for www subdomain
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Secrets Manager Secret for RDS credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "tap-stack-db-credentials"
  description = "Database credentials for RDS instance"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "a${random_string.db_username.result}"
    password = random_password.db_password.result
  })
}

# RDS Subnet Group for private subnets
resource "aws_db_subnet_group" "main" {
  name       = "tap-stack-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "tap-stack-db-subnet-group"
  })
}

# RDS Instance with all requirements
resource "aws_db_instance" "main" {
  identifier     = "tap-stack-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "tapstackdb"
  username = jsondecode(aws_secretsmanager_secret_version.db_credentials.secret_string)["username"]
  password = jsondecode(aws_secretsmanager_secret_version.db_credentials.secret_string)["password"]

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # Automatic backups
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Automatic minor version upgrades
  auto_minor_version_upgrade = true
  
  # Multi-AZ deployment for high availability
  multi_az = true
  
  # Not publicly accessible
  publicly_accessible = false

  # No deletion protection and skip final snapshot (as per requirements)
  deletion_protection = false
  skip_final_snapshot = true

  tags = local.common_tags

  depends_on = [aws_secretsmanager_secret_version.db_credentials]
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "load_balancer_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.arn
}

output "launch_template_id" {
  description = "ID of the Launch Template"
  value       = aws_launch_template.main.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.arn
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}

output "domain_name" {
  description = "Domain name configured in Route 53"
  value       = var.domain_name
}

output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2.arn
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.arn
}

output "ami_id" {
  description = "AMI ID used for EC2 instances"
  value       = data.aws_ami.amazon_linux.id
}

output "ami_name" {
  description = "AMI name used for EC2 instances"
  value       = data.aws_ami.amazon_linux.name
}

output "availability_zones" {
  description = "Availability zones used"
  value       = local.azs
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret for RDS credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.main.id
}

output "target_group_arn" {
  description = "ARN of the ALB target group"
  value       = aws_lb_target_group.main.arn
}
```

## Key Features and Security Considerations

This Terraform configuration creates a comprehensive, secure infrastructure stack with the following features:

### **Infrastructure Components:**
- **VPC** in us-east-2 with 10.0.0.0/16 CIDR and VPC Flow Logs
- **3 Public subnets** and **3 private subnets** across different AZs
- **NAT Gateways** for secure internet access from private subnets
- **Internet Gateway** for public subnet connectivity

### **Compute Resources:**
- **Auto Scaling Group** maintaining 3 EC2 instances across 3 AZs
- **Launch Template** with latest Amazon Linux 2 AMI
- **Application Load Balancer** for traffic distribution
- **Detailed CloudWatch monitoring** enabled

### **Security:**
- **Security Groups** with least-privilege access
- **IAM roles** with specific S3 and CloudWatch permissions
- **RDS in private subnets** with Multi-AZ deployment
- **AWS Secrets Manager** for database credentials
- **Encrypted S3 bucket** with public access blocked

### **Database:**
- **RDS MySQL 8.0** with automatic backups and minor version upgrades
- **Random username** (8 chars, starts with letter) and **password** (16 chars)
- **Multi-AZ deployment** for high availability
- **Not publicly accessible**

### **DNS and Monitoring:**
- **Route 53 hosted zone** for tapstacknewtest.com
- **CloudWatch metrics** for ASG monitoring
- **VPC Flow Logs** to CloudWatch

All resources are tagged with `Environment: Production` and follow AWS best practices for security and scalability.
