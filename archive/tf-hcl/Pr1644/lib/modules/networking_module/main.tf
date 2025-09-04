# Data sources for availability zones
data "aws_availability_zones" "primary" {
  state = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.eu_west_1
  state    = "available"
}

# VPC - Primary Region
resource "aws_vpc" "primary" {
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpc-primary"
  })
}

# VPC - Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.eu_west_1
  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpc-secondary"
  })
}

# Internet Gateway - Primary Region
resource "aws_internet_gateway" "primary" {
  vpc_id = aws_vpc.primary.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-igw-primary"
  })
}

# Internet Gateway - Secondary Region
resource "aws_internet_gateway" "secondary" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-igw-secondary"
  })
}

# Public Subnet - Primary Region
resource "aws_subnet" "public_primary" {
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_primary, 8, 1)
  availability_zone       = data.aws_availability_zones.primary.names[0]
  map_public_ip_on_launch = false

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-subnet-primary"
    Type = "Public"
  })
}

# Public Subnet - Secondary Region
resource "aws_subnet" "public_secondary" {
  provider                = aws.eu_west_1
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = cidrsubnet(var.vpc_cidr_secondary, 8, 1)
  availability_zone       = data.aws_availability_zones.secondary.names[0]
  map_public_ip_on_launch = false

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-subnet-secondary"
    Type = "Public"
  })
}

# Private Subnet - Primary Region
resource "aws_subnet" "private_primary" {
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_primary, 8, 2)
  availability_zone = data.aws_availability_zones.primary.names[1]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-subnet-primary"
    Type = "Private"
  })
}

# Private Subnet - Secondary Region
resource "aws_subnet" "private_secondary" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = cidrsubnet(var.vpc_cidr_secondary, 8, 2)
  availability_zone = data.aws_availability_zones.secondary.names[1]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-subnet-secondary"
    Type = "Private"
  })
}

# Route Table for Public Subnet - Primary Region
resource "aws_route_table" "public_primary" {
  vpc_id = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-rt-primary"
  })
}

# Route Table for Public Subnet - Secondary Region
resource "aws_route_table" "public_secondary" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-rt-secondary"
  })
}

# Route Table Association - Primary Region
resource "aws_route_table_association" "public_primary" {
  subnet_id      = aws_subnet.public_primary.id
  route_table_id = aws_route_table.public_primary.id
}

# Route Table Association - Secondary Region
resource "aws_route_table_association" "public_secondary" {
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.public_secondary.id
  route_table_id = aws_route_table.public_secondary.id
}

# Security Group for Bastion/App Access - Primary Region
resource "aws_security_group" "bastion_app_primary" {
  name        = "${var.name_prefix}-bastion-app-sg-primary"
  description = "Security group for bastion/app access with restricted ingress"
  vpc_id      = aws_vpc.primary.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-bastion-app-sg-primary"
  })
}

# Security Group for Bastion/App Access - Secondary Region
resource "aws_security_group" "bastion_app_secondary" {
  provider    = aws.eu_west_1
  name        = "${var.name_prefix}-bastion-app-sg-secondary"
  description = "Security group for bastion/app access with restricted ingress"
  vpc_id      = aws_vpc.secondary.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-bastion-app-sg-secondary"
  })
}

# Security Group Rules for Ingress - Primary Region
resource "aws_security_group_rule" "bastion_app_ingress_primary" {
  for_each = {
    for combo in setproduct(var.allowed_ports, var.allowed_ingress_cidrs) :
    "${combo[0]}-${replace(combo[1], "/", "-")}" => {
      port = combo[0]
      cidr = combo[1]
    }
  }

  type              = "ingress"
  from_port         = each.value.port
  to_port           = each.value.port
  protocol          = "tcp"
  cidr_blocks       = [each.value.cidr]
  security_group_id = aws_security_group.bastion_app_primary.id
  description       = "Allow port ${each.value.port} from ${each.value.cidr}"
}

# Security Group Rules for Ingress - Secondary Region
resource "aws_security_group_rule" "bastion_app_ingress_secondary" {
  for_each = {
    for combo in setproduct(var.allowed_ports, var.allowed_ingress_cidrs) :
    "${combo[0]}-${replace(combo[1], "/", "-")}" => {
      port = combo[0]
      cidr = combo[1]
    }
  }

  provider          = aws.eu_west_1
  type              = "ingress"
  from_port         = each.value.port
  to_port           = each.value.port
  protocol          = "tcp"
  cidr_blocks       = [each.value.cidr]
  security_group_id = aws_security_group.bastion_app_secondary.id
  description       = "Allow port ${each.value.port} from ${each.value.cidr}"
}

# Security Group Rules for Egress (HTTPS and DNS only) - Primary Region
resource "aws_security_group_rule" "bastion_app_egress_https_primary" {
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.bastion_app_primary.id
  description       = "Allow HTTPS outbound for package updates and API calls"
}

resource "aws_security_group_rule" "bastion_app_egress_dns_primary" {
  type              = "egress"
  from_port         = 53
  to_port           = 53
  protocol          = "udp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.bastion_app_primary.id
  description       = "Allow DNS resolution"
}

# Security Group Rules for Egress (HTTPS and DNS only) - Secondary Region
resource "aws_security_group_rule" "bastion_app_egress_https_secondary" {
  provider          = aws.eu_west_1
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.bastion_app_secondary.id
  description       = "Allow HTTPS outbound for package updates and API calls"
}

resource "aws_security_group_rule" "bastion_app_egress_dns_secondary" {
  provider          = aws.eu_west_1
  type              = "egress"
  from_port         = 53
  to_port           = 53
  protocol          = "udp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.bastion_app_secondary.id
  description       = "Allow DNS resolution"
}