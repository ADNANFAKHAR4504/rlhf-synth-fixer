---
---

### `lib/provider.tf`

```terraform
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us-west-2"
  region = "us-west-2"
}

provider "aws" {
  alias  = "ap-northeast-1"
  region = "ap-northeast-1"
}
```

### `lib/tap_stack.tf`

```terraform
module "networking" {
  source = "./modules/networking"

  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

module "security" {
  source = "./modules/security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.networking.vpc_id
  vpc_cidr     = var.vpc_cidr
}

module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment
  iam_users    = ["testuser1", "testuser2"]
}

module "storage" {
  source = "./modules/storage"


  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
}

module "database" {
  source = "./modules/database"

  project_name       = var.project_name
  environment        = var.environment
  private_subnet_ids = module.networking.private_subnet_ids
  rds_sg_id          = module.security.rds_sg_id
  db_username        = var.db_username
  db_password        = var.db_password
}

module "compute" {
  source = "./modules/compute"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  ec2_sg_id             = module.security.ec2_sg_id
  alb_sg_id             = module.security.alb_sg_id
  instance_profile_name = module.iam.ec2_instance_profile_name
  ami_id                = var.ami_id
  instance_type         = var.instance_type
}

module "monitoring" {
  source = "./modules/monitoring"

  project_name      = var.project_name
  flow_log_role_arn = module.iam.flow_log_role_arn
  vpc_id            = module.networking.vpc_id
}

output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

output "private_route_table_ids" {
  description = "The IDs of the private route tables"
  value       = module.networking.private_route_table_ids
}

output "ec2_sg_id" {
  description = "The ID of the EC2 security group"
  value       = module.security.ec2_sg_id
}

output "alb_sg_id" {
  description = "The ID of the ALB security group"
  value       = module.security.alb_sg_id
}

output "rds_sg_id" {
  description = "The ID of the RDS security group"
  value       = module.security.rds_sg_id
}

output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = module.storage.kms_key_id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key"
  value       = module.storage.kms_key_arn
}

output "ec2_instance_profile_name" {
  description = "The name of the EC2 instance profile"
  value       = module.iam.ec2_instance_profile_name
}

output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = module.compute.alb_dns_name
}

output "rds_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = module.database.rds_endpoint
}

output "s3_logs_bucket_name" {
  description = "The name of the S3 logs bucket"
  value       = module.storage.s3_logs_bucket_name
}
```

### `lib/vars.tf`

```terraform
variable "aws_region" {
  description = "The AWS region to deploy the infrastructure to."
  type        = string
  default     = "us-east-1"
}

variable "author" {
  description = "The author of the infrastructure."
  type        = string
  default     = "ngwakoleslieelijah"
}

variable "created_date" {
  description = "The date the infrastructure was created."
  type        = string
  default     = "2025-08-14T21:08:49Z"
}

variable "availability_zones" {
  description = "The availability zones to deploy the infrastructure to."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "account_id" {
  description = "The AWS account ID."
  type        = string
  default     = "123456789012"
}

variable "project_name" {
  description = "The name of the project."
  type        = string
  default     = "IaC-AWS-Nova-Model-Breaking"
}

variable "environment" {
  description = "The environment to deploy the infrastructure to."
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "The CIDR blocks for the public subnets."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "The CIDR blocks for the private subnets."
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "db_username" {
  description = "The username for the database."
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "The password for the database."
  type        = string
  sensitive   = true
  default     = "password"
}

variable "ami_id" {
  description = "The ID of the AMI to use for the EC2 instances."
  type        = string
  default     = "ami-0c520850203c586f6"
}

variable "instance_type" {
  description = "The type of EC2 instance to use."
  type        = string
  default     = "t2.micro"
}
```

### `lib/modules/compute/compute.tf`

```terraform
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

resource "aws_launch_template" "main" {
  name_prefix   = "${var.project_name}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = var.instance_profile_name
  }

  vpc_security_group_ids = [var.ec2_sg_id]

  tags = {
    Name        = "${var.project_name}-launch-template"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_autoscaling_group" "main" {
  name_prefix = "${var.project_name}-asg"
  desired_capacity   = 2
  max_size           = 3
  min_size           = 1

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  vpc_zone_identifier = var.private_subnet_ids

  target_group_arns = [aws_lb_target_group.main.arn]

  tag {
    key                 = "Name"
    value               = "${var.project_name}-ec2-instance"
    propagate_at_launch = true
  }
}

resource "aws_lb" "main" {
  name_prefix        = "alb-"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnet_ids

  tags = {
    Name        = "${var.project_name}-alb"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "main" {
  name_prefix = "tg-"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name        = "${var.project_name}-tg"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}
```

### `lib/modules/compute/outputs.tf`

```terraform
output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = aws_lb.main.dns_name
}
```

### `lib/modules/compute/vars.tf`

```terraform
variable "project_name" {
  type        = string
  description = "The name of the project"
}

variable "environment" {
  type        = string
  description = "The environment name"
}

variable "vpc_id" {
  type        = string
  description = "The ID of the VPC"
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "The IDs of the public subnets"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "The IDs of the private subnets"
}

variable "ec2_sg_id" {
  type        = string
  description = "The ID of the EC2 security group"
}

variable "alb_sg_id" {
  type        = string
  description = "The ID of the ALB security group"
}

variable "instance_profile_name" {
  type        = string
  description = "The name of the EC2 instance profile"
}

variable "ami_id" {
  type        = string
  description = "The ID of the AMI to use for the EC2 instances"
}

variable "instance_type" {
  type        = string
  description = "The instance type to use for the EC2 instances"
}
```

### `lib/modules/database/database.tf`

```terraform
resource "aws_db_subnet_group" "main" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-db-subnet-group"
  subnet_ids  = var.private_subnet_ids

  tags = {
    Name        = "${var.project_name}-db-subnet-group"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_db_instance" "main" {
  allocated_storage      = 20
  engine                 = "mysql"
  instance_class         = "db.t3.micro"
  db_name                = "${replace(var.project_name, "-", "")}db"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.rds_sg_id]
  skip_final_snapshot    = true
}
```

### `lib/modules/database/outputs.tf`

```terraform
output "rds_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
}
```

### `lib/modules/database/vars.tf`

```terraform
variable "project_name" {
  type        = string
  description = "The name of the project"
}

variable "environment" {
  type        = string
  description = "The environment name"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "The IDs of the private subnets"
}

variable "rds_sg_id" {
  type        = string
  description = "The ID of the RDS security group"
}

variable "db_username" {
  type        = string
  description = "The username for the RDS instance"
  sensitive   = true
}

variable "db_password" {
  type        = string
  description = "The password for the RDS instance"
  sensitive   = true
}
```

### `lib/modules/iam/iam.tf`

```terraform
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-ec2-instance-profile"
  role        = aws_iam_role.ec2.name
}

resource "aws_iam_role" "ec2" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })

  tags = {
    Name        = "${var.project_name}-ec2-role"
    Project     = var.project_name
    Environment = var.environment
  }
}


resource "random_pet" "suffix" {
  length = 2
}

resource "aws_iam_user" "main" {
  count = length(var.iam_users)
  name  = "${var.iam_users[count.index]}-${random_pet.suffix.id}"
}

resource "aws_iam_user_login_profile" "main" {
  count                   = length(var.iam_users)
  user                    = aws_iam_user.main[count.index].name
  password_reset_required = true
}

resource "aws_iam_policy" "mfa_enforcement" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-mfa-enforcement-policy"
  description = "Enforce MFA for all IAM users"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAllUsersToListAccounts"
        Effect = "Allow"
        Action = [
          "iam:ListAccountAliases",
          "iam:ListUsers",
          "iam:GetAccountSummary",
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowIndividualUserToSeeAndManageOnlyTheirOwnAccountInformation"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser",
          "iam:CreateAccessKey",
          "iam:UpdateAccessKey",
          "iam:DeleteAccessKey",
          "iam:ListAccessKeys",
          "iam:CreateLoginProfile",
          "iam:UpdateLoginProfile",
          "iam:DeleteLoginProfile",
          "iam:GetLoginProfile",
          "iam:CreateSSHPublicKey",
          "iam:UpdateSSHPublicKey",
          "iam:DeleteSSHPublicKey",
          "iam:ListSSHPublicKeys",
          "iam:UploadSSHPublicKey",
          "iam:CreateServiceSpecificCredential",
          "iam:UpdateServiceSpecificCredential",
          "iam:DeleteServiceSpecificCredential",
          "iam:ListServiceSpecificCredentials",
          "iam:ResetServiceSpecificCredential",
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice",
          "iam:ListMFADevices",
          "iam:DeactivateMFADevice",
          "iam:DeleteVirtualMFADevice",
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "BlockMostAccessUnlessSignedInWithMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken",
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      },
    ]
  })
}

resource "aws_iam_user_policy_attachment" "mfa_enforcement" {
  count      = length(var.iam_users)
  user       = aws_iam_user.main[count.index].name
  policy_arn = aws_iam_policy.mfa_enforcement.arn
}

resource "aws_iam_role" "flow_log" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_policy" "flow_log" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-flow-log-policy"
  description = "Allow VPC Flow Logs to publish to CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "flow_log" {
  role       = aws_iam_role.flow_log.name
  policy_arn = aws_iam_policy.flow_log.arn
}

resource "aws_iam_policy" "s3_access" {
  name_prefix = "${lower(substr(var.project_name, 0, 20))}-s3-access-policy"
  description = "Allow access to S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:s3:::*",
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.s3_access.arn
}
```

### `lib/modules/iam/outputs.tf`

```terraform
output "ec2_instance_profile_name" {
  description = "The name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.name
}

output "flow_log_role_arn" {
  description = "The ARN of the IAM role for VPC Flow Logs"
  value       = aws_iam_role.flow_log.arn
}
```

### `lib/modules/iam/vars.tf`

```terraform
variable "project_name" {
  description = "The name of the project."
  type        = string
}

variable "environment" {
  description = "The environment to deploy the infrastructure to."
  type        = string
}

variable "iam_users" {
  description = "A list of IAM users to create."
  type        = list(string)
}
```

### `lib/modules/monitoring/monitoring.tf`

```terraform
resource "aws_flow_log" "main" {
  iam_role_arn    = var.flow_log_role_arn
  log_destination = aws_cloudwatch_log_group.main.arn
  traffic_type    = "ALL"
  vpc_id          = var.vpc_id
}

resource "aws_cloudwatch_log_group" "main" {
  name_prefix = "${var.project_name}-log-group"
}
```

### `lib/modules/monitoring/outputs.tf`

```terraform
output "flow_log_destination_arn" {
  description = "The ARN of the CloudWatch Log Group for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.main.arn
}
```

### `lib/modules/monitoring/vars.tf`

```terraform
variable "project_name" {
  description = "The name of the project."
  type        = string
}

variable "flow_log_role_arn" {
  description = "The ARN of the IAM role for VPC Flow Logs."
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC."
  type        = string
}
```

### `lib/modules/networking/networking.tf`

```terraform
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-public-subnet-${count.index + 1}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-private-subnet-${count.index + 1}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-public-rt"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-private-rt"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
```

### `lib/modules/networking/outputs.tf`

```terraform
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "The IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "The IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "private_route_table_ids" {
  description = "The IDs of the private route tables"
  value       = aws_route_table.private[*].id
}
```

### `lib/modules/networking/vars.tf`

```terraform
variable "project_name" {
  type        = string
  description = "The name of the project"
}

variable "environment" {
  type        = string
  description = "The environment name"
}

variable "vpc_cidr" {
  type        = string
  description = "The CIDR block for the VPC"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "The CIDR blocks for the public subnets"
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "The CIDR blocks for the private subnets"
}

variable "availability_zones" {
  type        = list(string)
  description = "The availability zones for the subnets"
}
```

### `lib/modules/security/security.tf`

```terraform
resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "Allow HTTPS, HTTP, and SSH from VPC"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-ec2-sg"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow MySQL from EC2 SG"
  vpc_id      = var.vpc_id

  ingress {
    description     = "MySQL from EC2 SG"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-rds-sg"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Allow HTTP and HTTPS from anywhere"
  vpc_id      = var.vpc_id

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
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-alb-sg"
    Project     = var.project_name
    Environment = var.environment
  }
}
```

### `lib/modules/security/outputs.tf`

```terraform
output "ec2_sg_id" {
  description = "The ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "alb_sg_id" {
  description = "The ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "rds_sg_id" {
  description = "The ID of the RDS security group"
  value       = aws_security_group.rds.id
}
```

### `lib/modules/security/vars.tf`

```terraform
variable "project_name" {
  type        = string
  description = "The name of the project"
}

variable "environment" {
  type        = string
  description = "The environment name"
}

variable "vpc_id" {
  type        = string
  description = "The ID of the VPC"
}

variable "vpc_cidr" {
  type        = string
  description = "The CIDR block for the VPC"
}
```

### `lib/modules/storage/storage.tf`

```terraform
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name}"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}


resource "random_pet" "suffix" {
  length = 2
}

resource "aws_s3_bucket" "logs" {
  bucket = "${lower(substr(var.project_name, 0, 20))}-logs-bucket-${random_pet.suffix.id}"

  tags = {
    Name        = "${var.project_name}-logs-bucket"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_caller_identity" "current" {}
```

### `lib/modules/storage/outputs.tf`

```terraform
output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key"
  value       = aws_kms_key.main.arn
}


output "s3_logs_bucket_name" {
  description = "The name of the S3 logs bucket"
  value       = aws_s3_bucket.logs.bucket
}
```

### `lib/modules/storage/vars.tf`

```terraform
variable "project_name" {
  description = "The name of the project."
  type        = string
}

variable "environment" {
  description = "The environment to deploy the infrastructure to."
  type        = string
}

variable "aws_region" {
  description = "The AWS region to deploy the infrastructure to."
  type        = string
}
```
