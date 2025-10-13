resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

data "aws_ami" "amazon_linux_us_east_1" {
  provider    = aws.us-east-1
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "amazon_linux_us_west_2" {
  provider    = aws.us-west-2
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_availability_zones" "us_east_1" {
  provider = aws.us-east-1
  state    = "available"
}

data "aws_availability_zones" "us_west_2" {
  provider = aws.us-west-2
  state    = "available"
}

resource "aws_vpc" "vpc_us_east_1" {
  provider             = aws.us-east-1
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "vpc-us-east-1"
    Environment = "Production"
  }
}

resource "aws_internet_gateway" "igw_us_east_1" {
  provider = aws.us-east-1
  vpc_id   = aws_vpc.vpc_us_east_1.id

  tags = {
    Name        = "igw-us-east-1"
    Environment = "Production"
  }
}

resource "aws_subnet" "public_subnet_1_us_east_1" {
  provider                = aws.us-east-1
  vpc_id                  = aws_vpc.vpc_us_east_1.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.us_east_1.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-1-us-east-1"
    Environment = "Production"
  }
}

resource "aws_subnet" "public_subnet_2_us_east_1" {
  provider                = aws.us-east-1
  vpc_id                  = aws_vpc.vpc_us_east_1.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.us_east_1.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-2-us-east-1"
    Environment = "Production"
  }
}

resource "aws_subnet" "private_subnet_1_us_east_1" {
  provider          = aws.us-east-1
  vpc_id            = aws_vpc.vpc_us_east_1.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = data.aws_availability_zones.us_east_1.names[0]

  tags = {
    Name        = "private-subnet-1-us-east-1"
    Environment = "Production"
  }
}

resource "aws_subnet" "private_subnet_2_us_east_1" {
  provider          = aws.us-east-1
  vpc_id            = aws_vpc.vpc_us_east_1.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.us_east_1.names[1]

  tags = {
    Name        = "private-subnet-2-us-east-1"
    Environment = "Production"
  }
}

resource "aws_route_table" "public_rt_us_east_1" {
  provider = aws.us-east-1
  vpc_id   = aws_vpc.vpc_us_east_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw_us_east_1.id
  }

  tags = {
    Name        = "public-rt-us-east-1"
    Environment = "Production"
  }
}

resource "aws_route_table" "private_rt_us_east_1" {
  provider = aws.us-east-1
  vpc_id   = aws_vpc.vpc_us_east_1.id

  tags = {
    Name        = "private-rt-us-east-1"
    Environment = "Production"
  }
}

resource "aws_route_table_association" "public_rta_1_us_east_1" {
  provider       = aws.us-east-1
  subnet_id      = aws_subnet.public_subnet_1_us_east_1.id
  route_table_id = aws_route_table.public_rt_us_east_1.id
}

resource "aws_route_table_association" "public_rta_2_us_east_1" {
  provider       = aws.us-east-1
  subnet_id      = aws_subnet.public_subnet_2_us_east_1.id
  route_table_id = aws_route_table.public_rt_us_east_1.id
}

resource "aws_route_table_association" "private_rta_1_us_east_1" {
  provider       = aws.us-east-1
  subnet_id      = aws_subnet.private_subnet_1_us_east_1.id
  route_table_id = aws_route_table.private_rt_us_east_1.id
}

resource "aws_route_table_association" "private_rta_2_us_east_1" {
  provider       = aws.us-east-1
  subnet_id      = aws_subnet.private_subnet_2_us_east_1.id
  route_table_id = aws_route_table.private_rt_us_east_1.id
}

resource "aws_security_group" "alb_sg_us_east_1" {
  provider    = aws.us-east-1
  name        = "alb-sg-us-east-1"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.vpc_us_east_1.id

  ingress {
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
    Name        = "alb-sg-us-east-1"
    Environment = "Production"
  }
}

resource "aws_security_group" "ec2_sg_us_east_1" {
  provider    = aws.us-east-1
  name        = "ec2-sg-us-east-1"
  description = "Security group for EC2"
  vpc_id      = aws_vpc.vpc_us_east_1.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg_us_east_1.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.vpc_us_east_1.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ec2-sg-us-east-1"
    Environment = "Production"
  }
}

resource "aws_security_group" "rds_sg_us_east_1" {
  provider    = aws.us-east-1
  name        = "rds-sg-us-east-1"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.vpc_us_east_1.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg_us_east_1.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "rds-sg-us-east-1"
    Environment = "Production"
  }
}

resource "aws_ssm_parameter" "db_username_us_east_1" {
  provider = aws.us-east-1
  name     = "/rds/us-east-1/username"
  type     = "String"
  value    = "admin"

  tags = {
    Environment = "Production"
  }
}

resource "aws_ssm_parameter" "db_password_us_east_1" {
  provider = aws.us-east-1
  name     = "/rds/us-east-1/password"
  type     = "SecureString"
  value    = "MySecurePassword123!"

  tags = {
    Environment = "Production"
  }
}

resource "aws_db_subnet_group" "rds_subnet_group_us_east_1" {
  provider   = aws.us-east-1
  name       = "rds-subnet-group-us-east-1"
  subnet_ids = [aws_subnet.private_subnet_1_us_east_1.id, aws_subnet.private_subnet_2_us_east_1.id]

  tags = {
    Name        = "rds-subnet-group-us-east-1"
    Environment = "Production"
  }
}

resource "aws_db_instance" "mysql_us_east_1" {
  provider               = aws.us-east-1
  identifier             = "mysql-db-us-east-1"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_type           = "gp2"
  db_name                = "mydb"
  username               = aws_ssm_parameter.db_username_us_east_1.value
  password               = aws_ssm_parameter.db_password_us_east_1.value
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group_us_east_1.name
  vpc_security_group_ids = [aws_security_group.rds_sg_us_east_1.id]
  skip_final_snapshot    = true

  tags = {
    Name        = "mysql-db-us-east-1"
    Environment = "Production"
  }
}

resource "aws_instance" "ec2_1_us_east_1" {
  provider               = aws.us-east-1
  ami                    = data.aws_ami.amazon_linux_us_east_1.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private_subnet_1_us_east_1.id
  vpc_security_group_ids = [aws_security_group.ec2_sg_us_east_1.id]
  key_name               = "my-key-pair"

  tags = {
    Name        = "ec2-1-us-east-1"
    Environment = "Production"
  }
}

resource "aws_instance" "ec2_2_us_east_1" {
  provider               = aws.us-east-1
  ami                    = data.aws_ami.amazon_linux_us_east_1.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private_subnet_2_us_east_1.id
  vpc_security_group_ids = [aws_security_group.ec2_sg_us_east_1.id]
  key_name               = "my-key-pair"

  tags = {
    Name        = "ec2-2-us-east-1"
    Environment = "Production"
  }
}

resource "aws_lb_target_group" "tg_us_east_1" {
  provider    = aws.us-east-1
  name        = "tg-us-east-1"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.vpc_us_east_1.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name        = "tg-us-east-1"
    Environment = "Production"
  }
}

resource "aws_lb_target_group_attachment" "tga_1_us_east_1" {
  provider         = aws.us-east-1
  target_group_arn = aws_lb_target_group.tg_us_east_1.arn
  target_id        = aws_instance.ec2_1_us_east_1.id
  port             = 80
}

resource "aws_lb_target_group_attachment" "tga_2_us_east_1" {
  provider         = aws.us-east-1
  target_group_arn = aws_lb_target_group.tg_us_east_1.arn
  target_id        = aws_instance.ec2_2_us_east_1.id
  port             = 80
}

resource "aws_lb" "alb_us_east_1" {
  provider           = aws.us-east-1
  name               = "alb-us-east-1"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg_us_east_1.id]
  subnets            = [aws_subnet.public_subnet_1_us_east_1.id, aws_subnet.public_subnet_2_us_east_1.id]

  tags = {
    Name        = "alb-us-east-1"
    Environment = "Production"
  }
}

resource "aws_lb_listener" "https_listener_us_east_1" {
  provider          = aws.us-east-1
  load_balancer_arn = aws_lb.alb_us_east_1.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = "arn:aws:acm:us-east-1:123456789012:certificate/placeholder"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg_us_east_1.arn
  }
}

resource "aws_s3_bucket" "bucket_us_east_1" {
  provider = aws.us-east-1
  bucket   = "my-production-bucket-us-east-1-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "s3-bucket-us-east-1"
    Environment = "Production"
  }
}

resource "aws_s3_bucket_versioning" "versioning_us_east_1" {
  provider = aws.us-east-1
  bucket   = aws_s3_bucket.bucket_us_east_1.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "encryption_us_east_1" {
  provider = aws.us-east-1
  bucket   = aws_s3_bucket.bucket_us_east_1.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "public_block_us_east_1" {
  provider = aws.us-east-1
  bucket   = aws_s3_bucket.bucket_us_east_1.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_vpc" "vpc_us_west_2" {
  provider             = aws.us-west-2
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "vpc-us-west-2"
    Environment = "Production"
  }
}

resource "aws_internet_gateway" "igw_us_west_2" {
  provider = aws.us-west-2
  vpc_id   = aws_vpc.vpc_us_west_2.id

  tags = {
    Name        = "igw-us-west-2"
    Environment = "Production"
  }
}

resource "aws_subnet" "public_subnet_1_us_west_2" {
  provider                = aws.us-west-2
  vpc_id                  = aws_vpc.vpc_us_west_2.id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = data.aws_availability_zones.us_west_2.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-1-us-west-2"
    Environment = "Production"
  }
}

resource "aws_subnet" "public_subnet_2_us_west_2" {
  provider                = aws.us-west-2
  vpc_id                  = aws_vpc.vpc_us_west_2.id
  cidr_block              = "10.1.2.0/24"
  availability_zone       = data.aws_availability_zones.us_west_2.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-2-us-west-2"
    Environment = "Production"
  }
}

resource "aws_subnet" "private_subnet_1_us_west_2" {
  provider          = aws.us-west-2
  vpc_id            = aws_vpc.vpc_us_west_2.id
  cidr_block        = "10.1.10.0/24"
  availability_zone = data.aws_availability_zones.us_west_2.names[0]

  tags = {
    Name        = "private-subnet-1-us-west-2"
    Environment = "Production"
  }
}

resource "aws_subnet" "private_subnet_2_us_west_2" {
  provider          = aws.us-west-2
  vpc_id            = aws_vpc.vpc_us_west_2.id
  cidr_block        = "10.1.11.0/24"
  availability_zone = data.aws_availability_zones.us_west_2.names[1]

  tags = {
    Name        = "private-subnet-2-us-west-2"
    Environment = "Production"
  }
}

resource "aws_route_table" "public_rt_us_west_2" {
  provider = aws.us-west-2
  vpc_id   = aws_vpc.vpc_us_west_2.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw_us_west_2.id
  }

  tags = {
    Name        = "public-rt-us-west-2"
    Environment = "Production"
  }
}

resource "aws_route_table" "private_rt_us_west_2" {
  provider = aws.us-west-2
  vpc_id   = aws_vpc.vpc_us_west_2.id

  tags = {
    Name        = "private-rt-us-west-2"
    Environment = "Production"
  }
}

resource "aws_route_table_association" "public_rta_1_us_west_2" {
  provider       = aws.us-west-2
  subnet_id      = aws_subnet.public_subnet_1_us_west_2.id
  route_table_id = aws_route_table.public_rt_us_west_2.id
}

resource "aws_route_table_association" "public_rta_2_us_west_2" {
  provider       = aws.us-west-2
  subnet_id      = aws_subnet.public_subnet_2_us_west_2.id
  route_table_id = aws_route_table.public_rt_us_west_2.id
}

resource "aws_route_table_association" "private_rta_1_us_west_2" {
  provider       = aws.us-west-2
  subnet_id      = aws_subnet.private_subnet_1_us_west_2.id
  route_table_id = aws_route_table.private_rt_us_west_2.id
}

resource "aws_route_table_association" "private_rta_2_us_west_2" {
  provider       = aws.us-west-2
  subnet_id      = aws_subnet.private_subnet_2_us_west_2.id
  route_table_id = aws_route_table.private_rt_us_west_2.id
}

resource "aws_security_group" "alb_sg_us_west_2" {
  provider    = aws.us-west-2
  name        = "alb-sg-us-west-2"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.vpc_us_west_2.id

  ingress {
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
    Name        = "alb-sg-us-west-2"
    Environment = "Production"
  }
}

resource "aws_security_group" "ec2_sg_us_west_2" {
  provider    = aws.us-west-2
  name        = "ec2-sg-us-west-2"
  description = "Security group for EC2"
  vpc_id      = aws_vpc.vpc_us_west_2.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg_us_west_2.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.vpc_us_west_2.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ec2-sg-us-west-2"
    Environment = "Production"
  }
}

resource "aws_security_group" "rds_sg_us_west_2" {
  provider    = aws.us-west-2
  name        = "rds-sg-us-west-2"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.vpc_us_west_2.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg_us_west_2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "rds-sg-us-west-2"
    Environment = "Production"
  }
}

resource "aws_ssm_parameter" "db_username_us_west_2" {
  provider = aws.us-west-2
  name     = "/rds/us-west-2/username"
  type     = "String"
  value    = "admin"

  tags = {
    Environment = "Production"
  }
}

resource "aws_ssm_parameter" "db_password_us_west_2" {
  provider = aws.us-west-2
  name     = "/rds/us-west-2/password"
  type     = "SecureString"
  value    = "MySecurePassword123!"

  tags = {
    Environment = "Production"
  }
}

resource "aws_db_subnet_group" "rds_subnet_group_us_west_2" {
  provider   = aws.us-west-2
  name       = "rds-subnet-group-us-west-2"
  subnet_ids = [aws_subnet.private_subnet_1_us_west_2.id, aws_subnet.private_subnet_2_us_west_2.id]

  tags = {
    Name        = "rds-subnet-group-us-west-2"
    Environment = "Production"
  }
}

resource "aws_db_instance" "mysql_us_west_2" {
  provider               = aws.us-west-2
  identifier             = "mysql-db-us-west-2"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_type           = "gp2"
  db_name                = "mydb"
  username               = aws_ssm_parameter.db_username_us_west_2.value
  password               = aws_ssm_parameter.db_password_us_west_2.value
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group_us_west_2.name
  vpc_security_group_ids = [aws_security_group.rds_sg_us_west_2.id]
  skip_final_snapshot    = true

  tags = {
    Name        = "mysql-db-us-west-2"
    Environment = "Production"
  }
}

resource "aws_instance" "ec2_1_us_west_2" {
  provider               = aws.us-west-2
  ami                    = data.aws_ami.amazon_linux_us_west_2.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private_subnet_1_us_west_2.id
  vpc_security_group_ids = [aws_security_group.ec2_sg_us_west_2.id]
  key_name               = "my-key-pair"

  tags = {
    Name        = "ec2-1-us-west-2"
    Environment = "Production"
  }
}

resource "aws_instance" "ec2_2_us_west_2" {
  provider               = aws.us-west-2
  ami                    = data.aws_ami.amazon_linux_us_west_2.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.private_subnet_2_us_west_2.id
  vpc_security_group_ids = [aws_security_group.ec2_sg_us_west_2.id]
  key_name               = "my-key-pair"

  tags = {
    Name        = "ec2-2-us-west-2"
    Environment = "Production"
  }
}

resource "aws_lb_target_group" "tg_us_west_2" {
  provider    = aws.us-west-2
  name        = "tg-us-west-2"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.vpc_us_west_2.id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = {
    Name        = "tg-us-west-2"
    Environment = "Production"
  }
}

resource "aws_lb_target_group_attachment" "tga_1_us_west_2" {
  provider         = aws.us-west-2
  target_group_arn = aws_lb_target_group.tg_us_west_2.arn
  target_id        = aws_instance.ec2_1_us_west_2.id
  port             = 80
}

resource "aws_lb_target_group_attachment" "tga_2_us_west_2" {
  provider         = aws.us-west-2
  target_group_arn = aws_lb_target_group.tg_us_west_2.arn
  target_id        = aws_instance.ec2_2_us_west_2.id
  port             = 80
}

resource "aws_lb" "alb_us_west_2" {
  provider           = aws.us-west-2
  name               = "alb-us-west-2"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg_us_west_2.id]
  subnets            = [aws_subnet.public_subnet_1_us_west_2.id, aws_subnet.public_subnet_2_us_west_2.id]

  tags = {
    Name        = "alb-us-west-2"
    Environment = "Production"
  }
}

resource "aws_lb_listener" "https_listener_us_west_2" {
  provider          = aws.us-west-2
  load_balancer_arn = aws_lb.alb_us_west_2.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = "arn:aws:acm:us-west-2:123456789012:certificate/placeholder"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg_us_west_2.arn
  }
}

resource "aws_s3_bucket" "bucket_us_west_2" {
  provider = aws.us-west-2
  bucket   = "my-production-bucket-us-west-2-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "s3-bucket-us-west-2"
    Environment = "Production"
  }
}

resource "aws_s3_bucket_versioning" "versioning_us_west_2" {
  provider = aws.us-west-2
  bucket   = aws_s3_bucket.bucket_us_west_2.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "encryption_us_west_2" {
  provider = aws.us-west-2
  bucket   = aws_s3_bucket.bucket_us_west_2.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "public_block_us_west_2" {
  provider = aws.us-west-2
  bucket   = aws_s3_bucket.bucket_us_west_2.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "vpc_id_us_east_1" {
  description = "VPC ID for us-east-1"
  value       = aws_vpc.vpc_us_east_1.id
}

output "vpc_id_us_west_2" {
  description = "VPC ID for us-west-2"
  value       = aws_vpc.vpc_us_west_2.id
}

output "alb_dns_us_east_1" {
  description = "ALB DNS name for us-east-1"
  value       = aws_lb.alb_us_east_1.dns_name
}

output "alb_dns_us_west_2" {
  description = "ALB DNS name for us-west-2"
  value       = aws_lb.alb_us_west_2.dns_name
}

output "rds_endpoint_us_east_1" {
  description = "RDS endpoint for us-east-1"
  value       = aws_db_instance.mysql_us_east_1.endpoint
}

output "rds_endpoint_us_west_2" {
  description = "RDS endpoint for us-west-2"
  value       = aws_db_instance.mysql_us_west_2.endpoint
}

output "s3_bucket_us_east_1" {
  description = "S3 bucket name for us-east-1"
  value       = aws_s3_bucket.bucket_us_east_1.bucket
}

output "s3_bucket_us_west_2" {
  description = "S3 bucket name for us-west-2"
  value       = aws_s3_bucket.bucket_us_west_2.bucket
}

output "ec2_instance_ids_us_east_1" {
  description = "EC2 instance IDs for us-east-1"
  value       = [aws_instance.ec2_1_us_east_1.id, aws_instance.ec2_2_us_east_1.id]
}

output "ec2_instance_ids_us_west_2" {
  description = "EC2 instance IDs for us-west-2"
  value       = [aws_instance.ec2_1_us_west_2.id, aws_instance.ec2_2_us_west_2.id]
}

  