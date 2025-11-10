resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "aws_vpc" "us_east_1" {
  provider             = aws.us_east_1
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "us-east-1-hub-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "hub"
  }
}

resource "aws_vpc" "eu_west_1" {
  provider             = aws.eu_west_1
  cidr_block           = "10.1.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "eu-west-1-spoke-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "spoke"
  }
}

resource "aws_vpc" "ap_southeast_1" {
  provider             = aws.ap_southeast_1
  cidr_block           = "10.2.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "ap-southeast-1-spoke-vpc-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "spoke"
  }
}

data "aws_availability_zones" "us_east_1" {
  provider = aws.us_east_1
  state    = "available"
}

data "aws_availability_zones" "eu_west_1" {
  provider = aws.eu_west_1
  state    = "available"
}

data "aws_availability_zones" "ap_southeast_1" {
  provider = aws.ap_southeast_1
  state    = "available"
}

resource "aws_subnet" "us_east_1_dev_private_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = data.aws_availability_zones.us_east_1.names[0]

  tags = {
    Name        = "us-east-1-dev-private-subnet-1-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "us_east_1_dev_private_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.us_east_1.names[1]

  tags = {
    Name        = "us-east-1-dev-private-subnet-2-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "us_east_1_prod_private_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.us_east_1.names[0]

  tags = {
    Name        = "us-east-1-prod-private-subnet-1-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "us_east_1_prod_private_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = data.aws_availability_zones.us_east_1.names[1]

  tags = {
    Name        = "us-east-1-prod-private-subnet-2-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "us_east_1_dev_public_1" {
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.us_east_1.id
  cidr_block              = "10.0.101.0/24"
  availability_zone       = data.aws_availability_zones.us_east_1.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "us-east-1-dev-public-subnet-1-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "public"
  }
}

resource "aws_subnet" "us_east_1_dev_public_2" {
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.us_east_1.id
  cidr_block              = "10.0.102.0/24"
  availability_zone       = data.aws_availability_zones.us_east_1.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "us-east-1-dev-public-subnet-2-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "public"
  }
}

resource "aws_subnet" "us_east_1_prod_public_1" {
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.us_east_1.id
  cidr_block              = "10.0.111.0/24"
  availability_zone       = data.aws_availability_zones.us_east_1.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "us-east-1-prod-public-subnet-1-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "public"
  }
}

resource "aws_subnet" "us_east_1_prod_public_2" {
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.us_east_1.id
  cidr_block              = "10.0.112.0/24"
  availability_zone       = data.aws_availability_zones.us_east_1.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "us-east-1-prod-public-subnet-2-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "public"
  }
}

resource "aws_subnet" "us_east_1_tgw_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.200.0/28"
  availability_zone = data.aws_availability_zones.us_east_1.names[0]

  tags = {
    Name        = "us-east-1-tgw-subnet-1-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}

resource "aws_subnet" "us_east_1_tgw_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.201.0/28"
  availability_zone = data.aws_availability_zones.us_east_1.names[1]

  tags = {
    Name        = "us-east-1-tgw-subnet-2-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}

resource "aws_subnet" "eu_west_1_dev_private_1" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = "10.1.1.0/24"
  availability_zone = data.aws_availability_zones.eu_west_1.names[0]

  tags = {
    Name        = "eu-west-1-dev-private-subnet-1-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "eu-west-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "eu_west_1_dev_private_2" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = "10.1.2.0/24"
  availability_zone = data.aws_availability_zones.eu_west_1.names[1]

  tags = {
    Name        = "eu-west-1-dev-private-subnet-2-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "eu-west-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "eu_west_1_prod_private_1" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = "10.1.11.0/24"
  availability_zone = data.aws_availability_zones.eu_west_1.names[0]

  tags = {
    Name        = "eu-west-1-prod-private-subnet-1-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "eu-west-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "eu_west_1_prod_private_2" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = "10.1.12.0/24"
  availability_zone = data.aws_availability_zones.eu_west_1.names[1]

  tags = {
    Name        = "eu-west-1-prod-private-subnet-2-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "eu-west-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "eu_west_1_tgw_1" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = "10.1.200.0/28"
  availability_zone = data.aws_availability_zones.eu_west_1.names[0]

  tags = {
    Name        = "eu-west-1-tgw-subnet-1-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "transit"
  }
}

resource "aws_subnet" "eu_west_1_tgw_2" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.eu_west_1.id
  cidr_block        = "10.1.201.0/28"
  availability_zone = data.aws_availability_zones.eu_west_1.names[1]

  tags = {
    Name        = "eu-west-1-tgw-subnet-2-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "transit"
  }
}

resource "aws_subnet" "ap_southeast_1_dev_private_1" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = "10.2.1.0/24"
  availability_zone = data.aws_availability_zones.ap_southeast_1.names[0]

  tags = {
    Name        = "ap-southeast-1-dev-private-subnet-1-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "ap-southeast-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "ap_southeast_1_dev_private_2" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = "10.2.2.0/24"
  availability_zone = data.aws_availability_zones.ap_southeast_1.names[1]

  tags = {
    Name        = "ap-southeast-1-dev-private-subnet-2-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "ap-southeast-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "ap_southeast_1_prod_private_1" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = "10.2.11.0/24"
  availability_zone = data.aws_availability_zones.ap_southeast_1.names[0]

  tags = {
    Name        = "ap-southeast-1-prod-private-subnet-1-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "ap-southeast-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "ap_southeast_1_prod_private_2" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = "10.2.12.0/24"
  availability_zone = data.aws_availability_zones.ap_southeast_1.names[1]

  tags = {
    Name        = "ap-southeast-1-prod-private-subnet-2-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "ap-southeast-1"
    Purpose     = "workload"
  }
}

resource "aws_subnet" "ap_southeast_1_tgw_1" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = "10.2.200.0/28"
  availability_zone = data.aws_availability_zones.ap_southeast_1.names[0]

  tags = {
    Name        = "ap-southeast-1-tgw-subnet-1-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "transit"
  }
}

resource "aws_subnet" "ap_southeast_1_tgw_2" {
  provider          = aws.ap_southeast_1
  vpc_id            = aws_vpc.ap_southeast_1.id
  cidr_block        = "10.2.201.0/28"
  availability_zone = data.aws_availability_zones.ap_southeast_1.names[1]

  tags = {
    Name        = "ap-southeast-1-tgw-subnet-2-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "transit"
  }
}

resource "aws_internet_gateway" "us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  tags = {
    Name        = "us-east-1-igw-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "internet"
  }
}

resource "aws_route_table" "us_east_1_dev_public" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_east_1.id
  }

  tags = {
    Name        = "us-east-1-dev-public-rt-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "routing"
  }
}

resource "aws_route_table" "us_east_1_prod_public" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_east_1.id
  }

  tags = {
    Name        = "us-east-1-prod-public-rt-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "routing"
  }
}

resource "aws_route_table_association" "us_east_1_dev_public_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_dev_public_1.id
  route_table_id = aws_route_table.us_east_1_dev_public.id
}

resource "aws_route_table_association" "us_east_1_dev_public_2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_dev_public_2.id
  route_table_id = aws_route_table.us_east_1_dev_public.id
}

resource "aws_route_table_association" "us_east_1_prod_public_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_prod_public_1.id
  route_table_id = aws_route_table.us_east_1_prod_public.id
}

resource "aws_route_table_association" "us_east_1_prod_public_2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_prod_public_2.id
  route_table_id = aws_route_table.us_east_1_prod_public.id
}

data "aws_ami" "amazon_linux_2" {
  provider    = aws.us_east_1
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_security_group" "nat" {
  provider    = aws.us_east_1
  name        = "us-east-1-nat-sg-${random_string.suffix.result}"
  description = "Security group for NAT instances"
  vpc_id      = aws_vpc.us_east_1.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [aws_vpc.us_east_1.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "us-east-1-nat-sg-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "nat"
  }
}

resource "aws_instance" "nat_dev_1" {
  provider                    = aws.us_east_1
  ami                         = data.aws_ami.amazon_linux_2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.us_east_1_dev_public_1.id
  vpc_security_group_ids      = [aws_security_group.nat.id]
  associate_public_ip_address = true
  source_dest_check           = false

  user_data = <<-EOF
    #!/bin/bash
    sysctl -w net.ipv4.ip_forward=1
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    EOF

  tags = {
    Name        = "us-east-1-dev-nat-1-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "nat"
  }
}

resource "aws_instance" "nat_dev_2" {
  provider                    = aws.us_east_1
  ami                         = data.aws_ami.amazon_linux_2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.us_east_1_dev_public_2.id
  vpc_security_group_ids      = [aws_security_group.nat.id]
  associate_public_ip_address = true
  source_dest_check           = false

  user_data = <<-EOF
    #!/bin/bash
    sysctl -w net.ipv4.ip_forward=1
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    EOF

  tags = {
    Name        = "us-east-1-dev-nat-2-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "nat"
  }
}

resource "aws_instance" "nat_prod_1" {
  provider                    = aws.us_east_1
  ami                         = data.aws_ami.amazon_linux_2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.us_east_1_prod_public_1.id
  vpc_security_group_ids      = [aws_security_group.nat.id]
  associate_public_ip_address = true
  source_dest_check           = false

  user_data = <<-EOF
    #!/bin/bash
    sysctl -w net.ipv4.ip_forward=1
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    EOF

  tags = {
    Name        = "us-east-1-prod-nat-1-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "nat"
  }
}

resource "aws_instance" "nat_prod_2" {
  provider                    = aws.us_east_1
  ami                         = data.aws_ami.amazon_linux_2.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.us_east_1_prod_public_2.id
  vpc_security_group_ids      = [aws_security_group.nat.id]
  associate_public_ip_address = true
  source_dest_check           = false

  user_data = <<-EOF
    #!/bin/bash
    sysctl -w net.ipv4.ip_forward=1
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    EOF

  tags = {
    Name        = "us-east-1-prod-nat-2-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "nat"
  }
}

resource "aws_route_table" "us_east_1_dev_private" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  tags = {
    Name        = "us-east-1-dev-private-rt-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "routing"
  }
}

resource "aws_route_table" "us_east_1_prod_private" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  tags = {
    Name        = "us-east-1-prod-private-rt-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "routing"
  }
}

data "aws_network_interface" "nat_dev_1" {
  provider = aws.us_east_1
  filter {
    name   = "attachment.instance-id"
    values = [aws_instance.nat_dev_1.id]
  }
  filter {
    name   = "attachment.device-index"
    values = ["0"]
  }
}

data "aws_network_interface" "nat_prod_1" {
  provider = aws.us_east_1
  filter {
    name   = "attachment.instance-id"
    values = [aws_instance.nat_prod_1.id]
  }
  filter {
    name   = "attachment.device-index"
    values = ["0"]
  }
}

resource "aws_route" "us_east_1_dev_private_nat" {
  provider               = aws.us_east_1
  route_table_id         = aws_route_table.us_east_1_dev_private.id
  destination_cidr_block = "0.0.0.0/0"
  network_interface_id   = data.aws_network_interface.nat_dev_1.id
}

resource "aws_route" "us_east_1_prod_private_nat" {
  provider               = aws.us_east_1
  route_table_id         = aws_route_table.us_east_1_prod_private.id
  destination_cidr_block = "0.0.0.0/0"
  network_interface_id   = data.aws_network_interface.nat_prod_1.id
}

resource "aws_cloudwatch_metric_alarm" "nat_dev_1_status" {
  provider            = aws.us_east_1
  alarm_name          = "us-east-1-dev-nat-1-status-${random_string.suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Monitor NAT instance 1 health for dev environment"

  dimensions = {
    InstanceId = aws_instance.nat_dev_1.id
  }

  alarm_actions = [aws_sns_topic.nat_failover.arn]

  tags = {
    Name        = "us-east-1-dev-nat-1-status-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "monitoring"
  }
}

resource "aws_cloudwatch_metric_alarm" "nat_prod_1_status" {
  provider            = aws.us_east_1
  alarm_name          = "us-east-1-prod-nat-1-status-${random_string.suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Monitor NAT instance 1 health for prod environment"

  dimensions = {
    InstanceId = aws_instance.nat_prod_1.id
  }

  alarm_actions = [aws_sns_topic.nat_failover.arn]

  tags = {
    Name        = "us-east-1-prod-nat-1-status-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "monitoring"
  }
}

resource "aws_sns_topic" "nat_failover" {
  provider = aws.us_east_1
  name     = "us-east-1-nat-failover-${random_string.suffix.result}"

  tags = {
    Name        = "us-east-1-nat-failover-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "monitoring"
  }
}

resource "aws_sns_topic_subscription" "nat_failover" {
  provider  = aws.us_east_1
  topic_arn = aws_sns_topic.nat_failover.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.nat_failover.arn
}

resource "aws_iam_role" "nat_failover" {
  provider = aws.us_east_1
  name     = "us-east-1-nat-failover-role-${random_string.suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "us-east-1-nat-failover-role-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "nat-failover"
  }
}

resource "aws_iam_role_policy" "nat_failover" {
  provider = aws.us_east_1
  name     = "us-east-1-nat-failover-policy-${random_string.suffix.result}"
  role     = aws_iam_role.nat_failover.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeRouteTables",
          "ec2:ReplaceRoute",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "nat_failover" {
  provider         = aws.us_east_1
  filename         = "/tmp/nat_failover.zip"
  function_name    = "us-east-1-nat-failover-${random_string.suffix.result}"
  role             = aws_iam_role.nat_failover.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  timeout          = 60
  source_code_hash = data.archive_file.nat_failover.output_base64sha256

  environment {
    variables = {
      DEV_ROUTE_TABLE_ID  = aws_route_table.us_east_1_dev_private.id
      PROD_ROUTE_TABLE_ID = aws_route_table.us_east_1_prod_private.id
      DEV_NAT_2_ID        = aws_instance.nat_dev_2.id
      PROD_NAT_2_ID       = aws_instance.nat_prod_2.id
    }
  }

  tags = {
    Name        = "us-east-1-nat-failover-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "nat-failover"
  }
}

resource "aws_lambda_permission" "nat_failover" {
  provider      = aws.us_east_1
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.nat_failover.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.nat_failover.arn
}

data "archive_file" "nat_failover" {
  type        = "zip"
  output_path = "/tmp/nat_failover.zip"
  source {
    content  = <<-EOF
import boto3
import os
import json

ec2 = boto3.client('ec2')

def handler(event, context):
    message = json.loads(event['Records'][0]['Sns']['Message'])
    alarm_name = message['AlarmName']
    
    if 'dev-nat-1' in alarm_name:
        route_table_id = os.environ['DEV_ROUTE_TABLE_ID']
        backup_nat_instance = os.environ['DEV_NAT_2_ID']
    elif 'prod-nat-1' in alarm_name:
        route_table_id = os.environ['PROD_ROUTE_TABLE_ID']
        backup_nat_instance = os.environ['PROD_NAT_2_ID']
    else:
        return {'statusCode': 400, 'body': 'Unknown alarm'}
    
    try:
        instances = ec2.describe_instances(InstanceIds=[backup_nat_instance])
        if not instances['Reservations'] or not instances['Reservations'][0]['Instances']:
            raise Exception(f'Instance {backup_nat_instance} not found')
        
        instance = instances['Reservations'][0]['Instances'][0]
        network_interface_id = instance['NetworkInterfaces'][0]['NetworkInterfaceId']
        
        ec2.replace_route(
            RouteTableId=route_table_id,
            DestinationCidrBlock='0.0.0.0/0',
            NetworkInterfaceId=network_interface_id
        )
        print(f'Failover completed: Route table {route_table_id} now uses NAT {backup_nat_instance} via ENI {network_interface_id}')
    except Exception as e:
        print(f'Error during failover: {str(e)}')
        raise
    
    return {'statusCode': 200, 'body': 'Failover completed'}
EOF
    filename = "index.py"
  }
}

resource "aws_route_table_association" "us_east_1_dev_private_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_dev_private_1.id
  route_table_id = aws_route_table.us_east_1_dev_private.id
}

resource "aws_route_table_association" "us_east_1_dev_private_2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_dev_private_2.id
  route_table_id = aws_route_table.us_east_1_dev_private.id
}

resource "aws_route_table_association" "us_east_1_prod_private_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_prod_private_1.id
  route_table_id = aws_route_table.us_east_1_prod_private.id
}

resource "aws_route_table_association" "us_east_1_prod_private_2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_prod_private_2.id
  route_table_id = aws_route_table.us_east_1_prod_private.id
}

resource "aws_ec2_transit_gateway" "hub" {
  provider                        = aws.us_east_1
  description                     = "Hub Transit Gateway"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"

  tags = {
    Name        = "us-east-1-hub-tgw-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_route_table" "dev" {
  provider           = aws.us_east_1
  transit_gateway_id = aws_ec2_transit_gateway.hub.id

  tags = {
    Name        = "us-east-1-dev-tgw-rt-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_route_table" "prod" {
  provider           = aws.us_east_1
  transit_gateway_id = aws_ec2_transit_gateway.hub.id

  tags = {
    Name        = "us-east-1-prod-tgw-rt-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway" "eu_west_1" {
  provider                        = aws.eu_west_1
  description                     = "Spoke Transit Gateway eu-west-1"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"

  tags = {
    Name        = "eu-west-1-spoke-tgw-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway" "ap_southeast_1" {
  provider                        = aws.ap_southeast_1
  description                     = "Spoke Transit Gateway ap-southeast-1"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"

  tags = {
    Name        = "ap-southeast-1-spoke-tgw-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_vpc_attachment" "us_east_1" {
  provider                                        = aws.us_east_1
  subnet_ids                                      = [aws_subnet.us_east_1_tgw_1.id, aws_subnet.us_east_1_tgw_2.id]
  transit_gateway_id                              = aws_ec2_transit_gateway.hub.id
  vpc_id                                          = aws_vpc.us_east_1.id
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = {
    Name        = "us-east-1-vpc-tgw-attachment-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_vpc_attachment" "eu_west_1" {
  provider                                        = aws.eu_west_1
  subnet_ids                                      = [aws_subnet.eu_west_1_tgw_1.id, aws_subnet.eu_west_1_tgw_2.id]
  transit_gateway_id                              = aws_ec2_transit_gateway.eu_west_1.id
  vpc_id                                          = aws_vpc.eu_west_1.id
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = {
    Name        = "eu-west-1-vpc-tgw-attachment-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_vpc_attachment" "ap_southeast_1" {
  provider                                        = aws.ap_southeast_1
  subnet_ids                                      = [aws_subnet.ap_southeast_1_tgw_1.id, aws_subnet.ap_southeast_1_tgw_2.id]
  transit_gateway_id                              = aws_ec2_transit_gateway.ap_southeast_1.id
  vpc_id                                          = aws_vpc.ap_southeast_1.id
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = {
    Name        = "ap-southeast-1-vpc-tgw-attachment-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_peering_attachment" "hub_to_eu_west_1" {
  provider                = aws.us_east_1
  peer_region             = "eu-west-1"
  peer_transit_gateway_id = aws_ec2_transit_gateway.eu_west_1.id
  transit_gateway_id      = aws_ec2_transit_gateway.hub.id

  tags = {
    Name        = "us-east-1-to-eu-west-1-tgw-peering-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_peering_attachment" "hub_to_ap_southeast_1" {
  provider                = aws.us_east_1
  peer_region             = "ap-southeast-1"
  peer_transit_gateway_id = aws_ec2_transit_gateway.ap_southeast_1.id
  transit_gateway_id      = aws_ec2_transit_gateway.hub.id

  tags = {
    Name        = "us-east-1-to-ap-southeast-1-tgw-peering-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_peering_attachment_accepter" "eu_west_1" {
  provider                      = aws.eu_west_1
  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.hub_to_eu_west_1.id

  tags = {
    Name        = "eu-west-1-tgw-peering-accepter-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_peering_attachment_accepter" "ap_southeast_1" {
  provider                      = aws.ap_southeast_1
  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.hub_to_ap_southeast_1.id

  tags = {
    Name        = "ap-southeast-1-tgw-peering-accepter-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "transit"
  }
}

resource "aws_ec2_transit_gateway_route_table_association" "us_east_1_dev" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.us_east_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
  replace_existing_association   = true
}

resource "aws_ec2_transit_gateway_route_table_association" "us_east_1_prod" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.us_east_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
  replace_existing_association   = true
}

resource "aws_ec2_transit_gateway_route_table_association" "eu_west_1_peering_dev" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.hub_to_eu_west_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

resource "aws_ec2_transit_gateway_route_table_association" "eu_west_1_peering_prod" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.hub_to_eu_west_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}

resource "aws_ec2_transit_gateway_route_table_association" "ap_southeast_1_peering_dev" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.hub_to_ap_southeast_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

resource "aws_ec2_transit_gateway_route_table_association" "ap_southeast_1_peering_prod" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.hub_to_ap_southeast_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}

resource "aws_ec2_transit_gateway_route_table_propagation" "us_east_1_dev" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.us_east_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

resource "aws_ec2_transit_gateway_route_table_propagation" "us_east_1_prod" {
  provider                       = aws.us_east_1
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.us_east_1.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}


resource "aws_ec2_transit_gateway_route" "dev_to_prod_blackhole" {
  provider                       = aws.us_east_1
  destination_cidr_block         = "10.2.0.0/16"
  blackhole                      = true
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

resource "aws_ec2_transit_gateway_route" "prod_to_dev_blackhole" {
  provider                       = aws.us_east_1
  destination_cidr_block         = "10.1.0.0/16"
  blackhole                      = true
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}

resource "aws_route53_zone" "dev_internal" {
  provider = aws.us_east_1
  name     = "dev.internal"

  vpc {
    vpc_id     = aws_vpc.us_east_1.id
    vpc_region = "us-east-1"
  }

  tags = {
    Name        = "us-east-1-dev-zone-${random_string.suffix.result}"
    Environment = "dev"
    Region      = "us-east-1"
    Purpose     = "dns"
  }
}

resource "aws_route53_zone" "prod_internal" {
  provider = aws.us_east_1
  name     = "prod.internal"

  vpc {
    vpc_id     = aws_vpc.us_east_1.id
    vpc_region = "us-east-1"
  }

  tags = {
    Name        = "us-east-1-prod-zone-${random_string.suffix.result}"
    Environment = "prod"
    Region      = "us-east-1"
    Purpose     = "dns"
  }
}

resource "aws_route53_zone_association" "dev_eu_west_1" {
  provider   = aws.us_east_1
  zone_id    = aws_route53_zone.dev_internal.zone_id
  vpc_id     = aws_vpc.eu_west_1.id
  vpc_region = "eu-west-1"
}

resource "aws_route53_zone_association" "dev_ap_southeast_1" {
  provider   = aws.us_east_1
  zone_id    = aws_route53_zone.dev_internal.zone_id
  vpc_id     = aws_vpc.ap_southeast_1.id
  vpc_region = "ap-southeast-1"
}

resource "aws_route53_zone_association" "prod_eu_west_1" {
  provider   = aws.us_east_1
  zone_id    = aws_route53_zone.prod_internal.zone_id
  vpc_id     = aws_vpc.eu_west_1.id
  vpc_region = "eu-west-1"
}

resource "aws_route53_zone_association" "prod_ap_southeast_1" {
  provider   = aws.us_east_1
  zone_id    = aws_route53_zone.prod_internal.zone_id
  vpc_id     = aws_vpc.ap_southeast_1.id
  vpc_region = "ap-southeast-1"
}

resource "aws_security_group" "ssm_endpoint_us_east_1" {
  provider    = aws.us_east_1
  name        = "us-east-1-ssm-endpoint-sg-${random_string.suffix.result}"
  description = "Security group for SSM VPC endpoints"
  vpc_id      = aws_vpc.us_east_1.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.us_east_1.cidr_block]
  }

  tags = {
    Name        = "us-east-1-ssm-endpoint-sg-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "vpc-endpoint"
  }
}

resource "aws_vpc_endpoint" "ssm_us_east_1" {
  provider            = aws.us_east_1
  vpc_id              = aws_vpc.us_east_1.id
  service_name        = "com.amazonaws.us-east-1.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.us_east_1_dev_private_1.id, aws_subnet.us_east_1_dev_private_2.id]
  security_group_ids  = [aws_security_group.ssm_endpoint_us_east_1.id]
  private_dns_enabled = true

  tags = {
    Name        = "us-east-1-ssm-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "vpc-endpoint"
  }
}

resource "aws_vpc_endpoint" "ssmmessages_us_east_1" {
  provider            = aws.us_east_1
  vpc_id              = aws_vpc.us_east_1.id
  service_name        = "com.amazonaws.us-east-1.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.us_east_1_dev_private_1.id, aws_subnet.us_east_1_dev_private_2.id]
  security_group_ids  = [aws_security_group.ssm_endpoint_us_east_1.id]
  private_dns_enabled = true

  tags = {
    Name        = "us-east-1-ssmmessages-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "vpc-endpoint"
  }
}

resource "aws_vpc_endpoint" "ec2messages_us_east_1" {
  provider            = aws.us_east_1
  vpc_id              = aws_vpc.us_east_1.id
  service_name        = "com.amazonaws.us-east-1.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.us_east_1_dev_private_1.id, aws_subnet.us_east_1_dev_private_2.id]
  security_group_ids  = [aws_security_group.ssm_endpoint_us_east_1.id]
  private_dns_enabled = true

  tags = {
    Name        = "us-east-1-ec2messages-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "vpc-endpoint"
  }
}

resource "aws_security_group" "ssm_endpoint_eu_west_1" {
  provider    = aws.eu_west_1
  name        = "eu-west-1-ssm-endpoint-sg-${random_string.suffix.result}"
  description = "Security group for SSM VPC endpoints"
  vpc_id      = aws_vpc.eu_west_1.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.eu_west_1.cidr_block]
  }

  tags = {
    Name        = "eu-west-1-ssm-endpoint-sg-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "vpc-endpoint"
  }
}

resource "aws_vpc_endpoint" "ssm_eu_west_1" {
  provider            = aws.eu_west_1
  vpc_id              = aws_vpc.eu_west_1.id
  service_name        = "com.amazonaws.eu-west-1.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.eu_west_1_dev_private_1.id, aws_subnet.eu_west_1_dev_private_2.id]
  security_group_ids  = [aws_security_group.ssm_endpoint_eu_west_1.id]
  private_dns_enabled = true

  tags = {
    Name        = "eu-west-1-ssm-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "vpc-endpoint"
  }
}

resource "aws_vpc_endpoint" "ssmmessages_eu_west_1" {
  provider            = aws.eu_west_1
  vpc_id              = aws_vpc.eu_west_1.id
  service_name        = "com.amazonaws.eu-west-1.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.eu_west_1_dev_private_1.id, aws_subnet.eu_west_1_dev_private_2.id]
  security_group_ids  = [aws_security_group.ssm_endpoint_eu_west_1.id]
  private_dns_enabled = true

  tags = {
    Name        = "eu-west-1-ssmmessages-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "vpc-endpoint"
  }
}

resource "aws_vpc_endpoint" "ec2messages_eu_west_1" {
  provider            = aws.eu_west_1
  vpc_id              = aws_vpc.eu_west_1.id
  service_name        = "com.amazonaws.eu-west-1.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.eu_west_1_dev_private_1.id, aws_subnet.eu_west_1_dev_private_2.id]
  security_group_ids  = [aws_security_group.ssm_endpoint_eu_west_1.id]
  private_dns_enabled = true

  tags = {
    Name        = "eu-west-1-ec2messages-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "vpc-endpoint"
  }
}

resource "aws_security_group" "ssm_endpoint_ap_southeast_1" {
  provider    = aws.ap_southeast_1
  name        = "ap-southeast-1-ssm-endpoint-sg-${random_string.suffix.result}"
  description = "Security group for SSM VPC endpoints"
  vpc_id      = aws_vpc.ap_southeast_1.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.ap_southeast_1.cidr_block]
  }

  tags = {
    Name        = "ap-southeast-1-ssm-endpoint-sg-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "vpc-endpoint"
  }
}

resource "aws_vpc_endpoint" "ssm_ap_southeast_1" {
  provider            = aws.ap_southeast_1
  vpc_id              = aws_vpc.ap_southeast_1.id
  service_name        = "com.amazonaws.ap-southeast-1.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.ap_southeast_1_dev_private_1.id, aws_subnet.ap_southeast_1_dev_private_2.id]
  security_group_ids  = [aws_security_group.ssm_endpoint_ap_southeast_1.id]
  private_dns_enabled = true

  tags = {
    Name        = "ap-southeast-1-ssm-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "vpc-endpoint"
  }
}

resource "aws_vpc_endpoint" "ssmmessages_ap_southeast_1" {
  provider            = aws.ap_southeast_1
  vpc_id              = aws_vpc.ap_southeast_1.id
  service_name        = "com.amazonaws.ap-southeast-1.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.ap_southeast_1_dev_private_1.id, aws_subnet.ap_southeast_1_dev_private_2.id]
  security_group_ids  = [aws_security_group.ssm_endpoint_ap_southeast_1.id]
  private_dns_enabled = true

  tags = {
    Name        = "ap-southeast-1-ssmmessages-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "vpc-endpoint"
  }
}

resource "aws_vpc_endpoint" "ec2messages_ap_southeast_1" {
  provider            = aws.ap_southeast_1
  vpc_id              = aws_vpc.ap_southeast_1.id
  service_name        = "com.amazonaws.ap-southeast-1.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.ap_southeast_1_dev_private_1.id, aws_subnet.ap_southeast_1_dev_private_2.id]
  security_group_ids  = [aws_security_group.ssm_endpoint_ap_southeast_1.id]
  private_dns_enabled = true

  tags = {
    Name        = "ap-southeast-1-ec2messages-endpoint-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "vpc-endpoint"
  }
}

resource "aws_s3_bucket" "flow_logs" {
  provider = aws.us_east_1
  bucket   = "vpc-flow-logs-${random_string.suffix.result}"

  tags = {
    Name        = "vpc-flow-logs-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "flow-logs"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.flow_logs.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_policy" "flow_logs" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowVPCFlowLogs"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.flow_logs.arn}/*"
      }
    ]
  })
}

resource "aws_flow_log" "us_east_1" {
  provider             = aws.us_east_1
  log_destination      = aws_s3_bucket.flow_logs.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.us_east_1.id

  destination_options {
    file_format                = "parquet"
    per_hour_partition         = false
    hive_compatible_partitions = false
  }

  max_aggregation_interval = 60

  tags = {
    Name        = "us-east-1-vpc-flow-log-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "flow-log"
  }
}

resource "aws_flow_log" "eu_west_1" {
  provider             = aws.eu_west_1
  log_destination      = aws_s3_bucket.flow_logs.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.eu_west_1.id

  destination_options {
    file_format                = "parquet"
    per_hour_partition         = false
    hive_compatible_partitions = false
  }

  max_aggregation_interval = 60

  tags = {
    Name        = "eu-west-1-vpc-flow-log-${random_string.suffix.result}"
    Environment = "all"
    Region      = "eu-west-1"
    Purpose     = "flow-log"
  }
}

resource "aws_flow_log" "ap_southeast_1" {
  provider             = aws.ap_southeast_1
  log_destination      = aws_s3_bucket.flow_logs.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.ap_southeast_1.id

  destination_options {
    file_format                = "parquet"
    per_hour_partition         = false
    hive_compatible_partitions = false
  }

  max_aggregation_interval = 60

  tags = {
    Name        = "ap-southeast-1-vpc-flow-log-${random_string.suffix.result}"
    Environment = "all"
    Region      = "ap-southeast-1"
    Purpose     = "flow-log"
  }
}

resource "aws_iam_role" "flow_logs" {
  provider = aws.us_east_1
  name     = "vpc-flow-logs-role-${random_string.suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "vpc-flow-logs-role-${random_string.suffix.result}"
    Environment = "all"
    Region      = "us-east-1"
    Purpose     = "flow-logs"
  }
}

resource "aws_iam_role_policy" "flow_logs" {
  provider = aws.us_east_1
  name     = "vpc-flow-logs-policy-${random_string.suffix.result}"
  role     = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.flow_logs.arn,
          "${aws_s3_bucket.flow_logs.arn}/*"
        ]
      }
    ]
  })
}

output "hub_vpc_id" {
  description = "Hub VPC ID in us-east-1"
  value       = aws_vpc.us_east_1.id
}

output "eu_west_1_vpc_id" {
  description = "Spoke VPC ID in eu-west-1"
  value       = aws_vpc.eu_west_1.id
}

output "ap_southeast_1_vpc_id" {
  description = "Spoke VPC ID in ap-southeast-1"
  value       = aws_vpc.ap_southeast_1.id
}

output "hub_transit_gateway_id" {
  description = "Hub Transit Gateway ID"
  value       = aws_ec2_transit_gateway.hub.id
}

output "dev_transit_gateway_route_table_id" {
  description = "Development Transit Gateway route table ID"
  value       = aws_ec2_transit_gateway_route_table.dev.id
}

output "prod_transit_gateway_route_table_id" {
  description = "Production Transit Gateway route table ID"
  value       = aws_ec2_transit_gateway_route_table.prod.id
}

output "dev_route53_zone_id" {
  description = "Development Route 53 private hosted zone ID"
  value       = aws_route53_zone.dev_internal.zone_id
}

output "prod_route53_zone_id" {
  description = "Production Route 53 private hosted zone ID"
  value       = aws_route53_zone.prod_internal.zone_id
}

output "flow_logs_bucket_name" {
  description = "S3 bucket name for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "nat_instance_ids" {
  description = "NAT instance IDs"
  value = {
    dev_1  = aws_instance.nat_dev_1.id
    dev_2  = aws_instance.nat_dev_2.id
    prod_1 = aws_instance.nat_prod_1.id
    prod_2 = aws_instance.nat_prod_2.id
  }
}
