```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name        = "274789-vpc"
    environment = "production"
    project     = "web-app"
  }
}

resource "aws_subnet" "public" {
  count = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone = element(data.aws_availability_zones.available.names, count.index)
  map_public_ip_on_launch = true
  tags = {
    Name        = "274789-public-subnet-${count.index}"
    environment = "production"
    project     = "web-app"
  }
}

resource "aws_subnet" "private" {
  count = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 2)
  availability_zone = element(data.aws_availability_zones.available.names, count.index)
  tags = {
    Name        = "274789-private-subnet-${count.index}"
    environment = "production"
    project     = "web-app"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name        = "274789-igw"
    environment = "production"
    project     = "web-app"
  }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags = {
    Name        = "274789-nat"
    environment = "production"
    project     = "web-app"
  }
}

resource "aws_eip" "nat" {
  vpc = true
  tags = {
    Name        = "274789-nat-eip"
    environment = "production"
    project     = "web-app"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
  tags = {
    Name        = "274789-public-rt"
    environment = "production"
    project     = "web-app"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }
  tags = {
    Name        = "274789-private-rt"
    environment = "production"
    project     = "web-app"
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_security_group" "web" {
  vpc_id = aws_vpc.main.id
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
    Name        = "274789-web-sg"
    environment = "production"
    project     = "web-app"
  }
}

resource "aws_iam_role" "ec2_role" {
  name = "274789-ec2-role"
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
}

resource "aws_iam_role_policy_attachment" "ec2_policy" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "274789-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

resource "aws_launch_template" "web" {
  name_prefix   = "274789-web-"
  image_id      = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }
  vpc_security_group_ids = [aws_security_group.web.id]
  user_data = base64encode(file("user_data.sh"))
  key_name               = "your-key-pair"
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "274789-web-instance"
      environment = "production"
      project     = "web-app"
    }
  }
}

resource "aws_autoscaling_group" "web" {
  desired_capacity     = 2
  max_size             = 5
  min_size             = 2
  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }
  vpc_zone_identifiers = [aws_subnet.private[0].availability_zone, aws_subnet.private[1].availability_zone]
}

resource "aws_lb" "web" {
  name               = "274789-web-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets            = aws_subnet.public[*].id
  enable_deletion_protection = false
  tags = {
    Name        = "274789-web-lb"
    environment = "production"
    project     = "web-app"
  }
}

resource "aws_lb_target_group" "web" {
  name     = "274789-web-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  target_type = "instance"
  health_check {
    path = "/"
  }
}

resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.web.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = "arn:aws:acm:us-west-2:123456789012:certificate/your-certificate-id"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_db_instance" "postgres" {
  identifier        = "274789-postgres"
  allocated_storage = 20
  engine           = "postgres"
  engine_version   = "12.5"
  instance_class   = "db.t2.micro"
  name             = "postgresdb"
  username         = "admin"
  password         = "password"
  parameter_group_name = "default.postgres12"
  skip_final_snapshot = true
  backup_retention_period = 7
  vpc_security_group_ids = [aws_security_group.web.id]
  db_subnet_group_name = aws_db_subnet_group.postgres.name
  tags = {
    Name        = "274789-postgres"
    environment = "production"
    project     = "web-app"
  }
}

resource "aws_db_subnet_group" "postgres" {
  name       = "274789-postgres-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  tags = {
    Name        = "274789-postgres-subnet-group"
    environment = "production"
    project     = "web-app"
  }
}

resource "aws_cloudwatch_log_group" "web_logs" {
  name              = "/aws/ec2/274789-web-app"
  retention_in_days = 14
  tags = {
    Name        = "274789-web-logs"
    environment = "production"
    project     = "web-app"
  }
}

data "aws_availability_zones" "available" {}
```
