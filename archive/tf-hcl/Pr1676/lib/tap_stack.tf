########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional)"
  type        = string
  default     = ""
}


########################
# Data Sources
########################
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
}

########################
# VPC and Networking
########################
resource "aws_vpc" "prod_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "ProdVPC"
  }
}

resource "aws_internet_gateway" "prod_igw" {
  vpc_id = aws_vpc.prod_vpc.id

  tags = {
    Name = "ProdInternetGateway"
  }
}

resource "aws_subnet" "prod_public_subnet_1" {
  vpc_id                  = aws_vpc.prod_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "ProdPublicSubnet1"
  }
}

resource "aws_subnet" "prod_public_subnet_2" {
  vpc_id                  = aws_vpc.prod_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "ProdPublicSubnet2"
  }
}

resource "aws_route_table" "prod_public_rt" {
  vpc_id = aws_vpc.prod_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.prod_igw.id
  }

  tags = {
    Name = "ProdPublicRouteTable"
  }
}

resource "aws_route_table_association" "prod_public_rta_1" {
  subnet_id      = aws_subnet.prod_public_subnet_1.id
  route_table_id = aws_route_table.prod_public_rt.id
}

resource "aws_route_table_association" "prod_public_rta_2" {
  subnet_id      = aws_subnet.prod_public_subnet_2.id
  route_table_id = aws_route_table.prod_public_rt.id
}

########################
# Security Groups
########################
resource "aws_security_group" "prod_alb_sg" {
  name_prefix = "prod-alb-sg-"
  vpc_id      = aws_vpc.prod_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  tags = {
    Name = "ProdALBSecurityGroup"
  }
}

resource "aws_security_group" "prod_ec2_sg" {
  name_prefix = "prod-ec2-sg-"
  vpc_id      = aws_vpc.prod_vpc.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.prod_alb_sg.id]
  }

  # Allow HTTP/HTTPS for package updates
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow DNS
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  tags = {
    Name = "ProdEC2SecurityGroup"
  }
}

########################
# EC2 Instances
########################
resource "aws_instance" "prod_instance_1" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.prod_public_subnet_1.id
  vpc_security_group_ids = [aws_security_group.prod_ec2_sg.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ProdInstance1 in ${data.aws_availability_zones.available.names[0]}</h1>" > /var/www/html/index.html
              EOF
  )

  tags = {
    Name = "ProdInstance1"
  }
}

resource "aws_instance" "prod_instance_2" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.prod_public_subnet_2.id
  vpc_security_group_ids = [aws_security_group.prod_ec2_sg.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ProdInstance2 in ${data.aws_availability_zones.available.names[1]}</h1>" > /var/www/html/index.html
              EOF
  )

  tags = {
    Name = "ProdInstance2"
  }
}

########################
# Application Load Balancer
########################
resource "aws_lb" "prod_alb" {
  name               = "prod-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.prod_alb_sg.id]
  subnets            = [aws_subnet.prod_public_subnet_1.id, aws_subnet.prod_public_subnet_2.id]

  enable_deletion_protection = false

  tags = {
    Name = "ProdApplicationLoadBalancer"
  }
}

resource "aws_lb_target_group" "prod_tg" {
  name     = "prod-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.prod_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    protocol            = "HTTP"
    port                = "traffic-port"
  }

  tags = {
    Name = "ProdTargetGroup"
  }
}

resource "aws_lb_target_group_attachment" "prod_tg_attachment_1" {
  target_group_arn = aws_lb_target_group.prod_tg.arn
  target_id        = aws_instance.prod_instance_1.id
  port             = 80
}

resource "aws_lb_target_group_attachment" "prod_tg_attachment_2" {
  target_group_arn = aws_lb_target_group.prod_tg.arn
  target_id        = aws_instance.prod_instance_2.id
  port             = 80
}

# HTTP listener - redirects to HTTPS if certificate is provided, otherwise forwards to target group
resource "aws_lb_listener" "prod_http_listener" {
  load_balancer_arn = aws_lb.prod_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = var.certificate_arn != "" ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    target_group_arn = var.certificate_arn == "" ? aws_lb_target_group.prod_tg.arn : null
  }
}

# HTTPS listener (only created when certificate is provided)
resource "aws_lb_listener" "prod_https_listener" {
  count             = var.certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.prod_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.prod_tg.arn
  }
}

########################
# Outputs
########################
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.prod_vpc.id
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.prod_alb.dns_name
}

output "load_balancer_url" {
  description = "URL of the load balancer"
  value       = var.certificate_arn != "" ? "https://${aws_lb.prod_alb.dns_name}" : "http://${aws_lb.prod_alb.dns_name}"
}

output "load_balancer_http_url" {
  description = "HTTP URL of the load balancer"
  value       = "http://${aws_lb.prod_alb.dns_name}"
}

output "load_balancer_https_url" {
  description = "HTTPS URL of the load balancer (if certificate is configured)"
  value       = var.certificate_arn != "" ? "https://${aws_lb.prod_alb.dns_name}" : null
}

output "instance_1_id" {
  description = "ID of the first EC2 instance"
  value       = aws_instance.prod_instance_1.id
}

output "instance_2_id" {
  description = "ID of the second EC2 instance"
  value       = aws_instance.prod_instance_2.id
}

output "availability_zones" {
  description = "Availability zones used"
  value       = [data.aws_availability_zones.available.names[0], data.aws_availability_zones.available.names[1]]
}
