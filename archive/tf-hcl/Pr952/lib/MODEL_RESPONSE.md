# Model Response for Terraform `main.tf`

The following code defines a single `main.tf` file with the requested infrastructure setup:

```hcl
variable "region" {
  default = "us-west-2"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  default = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "instance_type" {
  default = "t3.micro"
}

variable "key_pair_name" {
  default = "my-keypair"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_vpc" "project_vpc" {
  cidr_block = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "project-vpc" }
}

resource "aws_internet_gateway" "project_igw" {
  vpc_id = aws_vpc.project_vpc.id
  tags   = { Name = "project-igw" }
}

resource "aws_subnet" "public_subnets" {
  count                   = 2
  vpc_id                  = aws_vpc.project_vpc.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = element(["us-west-2a", "us-west-2b"], count.index)
  map_public_ip_on_launch = true
  tags = { Name = "project-public-subnet-${count.index + 1}" }
}

resource "aws_subnet" "private_subnets" {
  count                   = 2
  vpc_id                  = aws_vpc.project_vpc.id
  cidr_block              = var.private_subnet_cidrs[count.index]
  availability_zone       = element(["us-west-2a", "us-west-2b"], count.index)
  map_public_ip_on_launch = false
  tags = { Name = "project-private-subnet-${count.index + 1}" }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.project_vpc.id
  tags   = { Name = "project-public-rt" }
}

resource "aws_route" "public_route" {
  route_table_id         = aws_route_table.public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.project_igw.id
}

resource "aws_route_table_association" "public_assoc" {
  count          = 2
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_eip" "nat_eip" {
  vpc = true
}

resource "aws_nat_gateway" "nat_gw" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnets[0].id
  depends_on    = [aws_internet_gateway.project_igw]
  tags         = { Name = "project-nat-gw" }
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.project_vpc.id
  tags   = { Name = "project-private-rt" }
}

resource "aws_route" "private_route" {
  route_table_id         = aws_route_table.private_rt.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_gw.id
}

resource "aws_route_table_association" "private_assoc" {
  count          = 2
  subnet_id      = aws_subnet.private_subnets[count.index].id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_security_group" "bastion_sg" {
  name        = "project-bastion-sg"
  description = "Allow SSH from anywhere"
  vpc_id      = aws_vpc.project_vpc.id
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "private_sg" {
  name        = "project-private-sg"
  description = "Allow SSH from bastion only"
  vpc_id      = aws_vpc.project_vpc.id
  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion_sg.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public_subnets[0].id
  key_name                   = var.key_pair_name
  vpc_security_group_ids      = [aws_security_group.bastion_sg.id]
  associate_public_ip_address = true
  tags = { Name = "project-bastion" }
}

resource "aws_instance" "private_instances" {
  count                      = 2
  ami                        = data.aws_ami.amazon_linux.id
  instance_type              = var.instance_type
  subnet_id                  = aws_subnet.private_subnets[count.index].id
  key_name                   = var.key_pair_name
  vpc_security_group_ids     = [aws_security_group.private_sg.id]
  associate_public_ip_address = false
  tags = { Name = "project-private-${count.index + 1}" }
}

output "vpc_id" {
  value = aws_vpc.project_vpc.id
}

output "public_subnet_ids" {
  value = aws_subnet.public_subnets[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private_subnets[*].id
}

output "bastion_public_ip" {
  value = aws_instance.bastion.public_ip
}

output "private_instance_ids" {
  value = aws_instance.private_instances[*].id
}
