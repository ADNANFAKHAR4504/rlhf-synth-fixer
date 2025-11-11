terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Configuration provided via backend config files
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = var.tags
  }
}

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ==================== VPC ====================
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.environment}-private-subnet-${count.index + 1}"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Type        = "private"
    "kubernetes.io/role/internal-elb" = "1"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_subnet" "public" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 3 + count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.environment}-public-subnet-${count.index + 1}"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Type        = "public"
    "kubernetes.io/role/elb" = "1"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-igw"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.environment}-nat-gw-${count.index + 1}"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_eip" "nat" {
  count = 3

  domain = "vpc"

  tags = {
    Name        = "${var.environment}-nat-eip-${count.index + 1}"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "${var.environment}-private-rt-${count.index + 1}"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Type        = "private"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.environment}-public-rt"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Type        = "public"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ==================== Network ACLs ====================
resource "aws_network_acl" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-private-nacl"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Type        = "private"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_network_acl" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-public-nacl"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Type        = "public"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Private NACL rules - restrictive inbound, allow all outbound
resource "aws_network_acl_rule" "private_inbound_http" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "private_inbound_https" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "private_inbound_mysql" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 120
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 3306
  to_port        = 3306
}

resource "aws_network_acl_rule" "private_inbound_redis" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 130
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 6379
  to_port        = 6379
}

resource "aws_network_acl_rule" "private_inbound_ephemeral" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 140
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "private_outbound_all" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 0
  to_port        = 0
}

# Public NACL rules - allow HTTP/HTTPS inbound, allow all outbound
resource "aws_network_acl_rule" "public_inbound_http" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "public_inbound_https" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_inbound_ephemeral" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 120
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "public_outbound_all" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 0
  to_port        = 0
}

# Associate NACLs with subnets
resource "aws_network_acl_association" "private" {
  count = 3

  network_acl_id = aws_network_acl.private.id
  subnet_id      = aws_subnet.private[count.index].id
}

resource "aws_network_acl_association" "public" {
  count = 3

  network_acl_id = aws_network_acl.public.id
  subnet_id      = aws_subnet.public[count.index].id
}

# ==================== VPC Flow Logs ====================
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs/${var.environment}"
  retention_in_days = 30

  tags = {
    Name        = "${var.environment}-vpc-flow-logs"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network-monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role" "vpc_flow_logs" {
  name = "${var.environment}-vpc-flow-logs-role"

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
    Name        = "${var.environment}-vpc-flow-logs-role"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network-monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "vpc_flow_logs" {
  role       = aws_iam_role.vpc_flow_logs.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonVPCCrossAccountNetworkInterfaceOperations"
}

resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-vpc-flow-log"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network-monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}
resource "aws_iam_role" "eks_cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.cluster_name}-cluster-role"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "kubernetes"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  tags = {
    Name        = var.cluster_name
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "kubernetes"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role" "eks_node" {
  name = "${var.cluster_name}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.cluster_name}-node-role"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "kubernetes"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "eks_node" {
  for_each = toset([
    "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
    "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  ])

  role       = aws_iam_role.eks_node.name
  policy_arn = each.value
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-node-group"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = 3
    max_size     = 5
    min_size     = 2
  }

  instance_types = ["t3.medium"]

  tags = {
    Name        = "${var.cluster_name}-node-group"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "kubernetes"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# OIDC provider for EKS
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = {
    Name        = "${var.cluster_name}-oidc-provider"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "kubernetes"
    Component   = "authentication"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# OIDC provider for CircleCI
resource "aws_iam_openid_connect_provider" "circleci" {
  url             = "https://oidc.circleci.com"
  client_id_list  = ["circleci"]
  thumbprint_list = ["9de5069c5afe602b2ea0a04b66beb2c0cca9c5b0"]

  tags = {
    Name        = "circleci-oidc-provider"
    Environment = "shared"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "authentication"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== S3 Backend ====================
resource "aws_s3_bucket" "terraform_state" {
  bucket = "iac-test-automations-terraform-state-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "iac-test-automations-terraform-state-${data.aws_caller_identity.current.account_id}"
    Environment = "shared"
    Project     = "iac-test-automations"
    Application = "infrastructure"
    Component   = "terraform-backend"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = var.environment == "prod" ? true : false
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "iac-test-automations-terraform-locks-${data.aws_caller_identity.current.account_id}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "iac-test-automations-terraform-locks-${data.aws_caller_identity.current.account_id}"
    Environment = "shared"
    Project     = "iac-test-automations"
    Application = "infrastructure"
    Component   = "terraform-backend"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = var.environment == "prod" ? true : false
  }
}

# ==================== RDS Monitoring IAM Role ====================
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.db_cluster_identifier}-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.db_cluster_identifier}-monitoring-role"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.environment}-rds-kms-key"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "encryption"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_kms_key" "cache" {
  description             = "KMS key for ElastiCache encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.environment}-cache-kms-key"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "encryption"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.db_cluster_identifier}-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "${var.db_cluster_identifier}-subnet-group"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "database"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier              = var.db_cluster_identifier
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.02.0"
  master_username                 = var.db_master_username
  manage_master_user_password     = true
  master_user_secret_kms_key_id   = aws_kms_key.rds.arn
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  skip_final_snapshot             = true
  deletion_protection             = false

  # Backup configuration
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"

  # Monitoring and logging
  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn

  tags = {
    Name        = var.db_cluster_identifier
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "database"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = var.environment == "prod" ? true : false
  }
}

resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "${var.db_cluster_identifier}-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.t3.small"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  tags = {
    Name        = "${var.db_cluster_identifier}-${count.index}"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "database"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_security_group" "rds" {
  name   = "${var.db_cluster_identifier}-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_eks_cluster.main.vpc_config[0].cluster_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.db_cluster_identifier}-sg"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "database"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== ElastiCache ====================
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.cache_cluster_id}-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "${var.cache_cluster_id}-subnet-group"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "cache"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = var.cache_cluster_id
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.cache.id]
  port                 = 6379

  # Enable encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  # Enable authentication
  auth_token = random_password.redis_auth_token.result
  auth_token_update_strategy = "ROTATE"

  tags = {
    Name        = var.cache_cluster_id
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "cache"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Generate Redis auth token
resource "random_password" "redis_auth_token" {
  length  = 32
  special = true

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_security_group" "cache" {
  name   = "${var.cache_cluster_id}-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_eks_cluster.main.vpc_config[0].cluster_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cache_cluster_id}-sg"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "cache"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== Cognito ====================
resource "aws_cognito_user_pool" "main" {
  name = var.cognito_user_pool_name

  password_policy {
    minimum_length    = 12
    require_uppercase = true
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
  }

  mfa_configuration = "OPTIONAL"

  tags = {
    Name        = var.cognito_user_pool_name
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "authentication"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.cognito_user_pool_name}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== ECR ====================
resource "aws_ecr_repository" "services" {
  for_each = toset(var.ecr_repository_names)

  name = each.value

  tags = {
    Name        = each.value
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "container-registry"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== IAM Roles for CircleCI OIDC ====================
resource "aws_iam_role" "circleci_dev" {
  name = "circleci-dev-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/oidc.circleci.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "oidc.circleci.com:aud" = "https://oidc.circleci.com"
          }
          StringLike = {
            "oidc.circleci.com:sub" = "org/*/project/*/vcs/github/TuringGpt/iac-test-automations:ref:refs/heads/dev"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "circleci-dev-role"
    Environment = "dev"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "iam"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "circleci_dev" {
  role       = aws_iam_role.circleci_dev.name
  policy_arn = aws_iam_policy.circleci_dev.arn
}

resource "aws_iam_policy" "circleci_dev" {
  name = "circleci-dev-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters"
        ]
        Resource = aws_eks_cluster.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = [
          for repo in aws_ecr_repository.services : repo.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.terraform_state.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = aws_dynamodb_table.terraform_locks.arn
      }
    ]
  })

  tags = {
    Name        = "circleci-dev-policy"
    Environment = "dev"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "iam"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Similar for staging and prod, with different branch conditions

resource "aws_iam_role" "circleci_staging" {
  name = "circleci-staging-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/oidc.circleci.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "oidc.circleci.com:aud" = "https://oidc.circleci.com"
          }
          StringLike = {
            "oidc.circleci.com:sub" = "org/*/project/*/vcs/github/TuringGpt/iac-test-automations:ref:refs/heads/staging"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "circleci-staging-role"
    Environment = "staging"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "iam"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "circleci_staging" {
  role       = aws_iam_role.circleci_staging.name
  policy_arn = aws_iam_policy.circleci_staging.arn
}

resource "aws_iam_policy" "circleci_staging" {
  name = "circleci-staging-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters",
          "eks:UpdateClusterConfig",
          "eks:UpdateClusterVersion"
        ]
        Resource = aws_eks_cluster.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
          "ecr:CreateRepository",
          "ecr:DeleteRepository"
        ]
        Resource = [
          for repo in aws_ecr_repository.services : repo.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances",
          "rds:ModifyDBCluster",
          "rds:ModifyDBInstance"
        ]
        Resource = [
          aws_rds_cluster.main.arn,
          for instance in aws_rds_cluster_instance.main : instance.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "elasticache:DescribeCacheClusters",
          "elasticache:ModifyCacheCluster"
        ]
        Resource = aws_elasticache_cluster.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ListHostedZones",
          "route53:GetChange",
          "route53:ChangeResourceRecordSets"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.terraform_state.arn,
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.terraform_locks.arn
      }
    ]
  })

  tags = {
    Name        = "circleci-staging-policy"
    Environment = "staging"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "iam"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role" "circleci_prod" {
  name = "circleci-prod-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/oidc.circleci.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "oidc.circleci.com:aud" = "https://oidc.circleci.com"
          }
          StringLike = {
            "oidc.circleci.com:sub" = "org/*/project/*/vcs/github/TuringGpt/iac-test-automations:ref:refs/heads/main"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "circleci-prod-role"
    Environment = "production"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "iam"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "circleci_prod" {
  role       = aws_iam_role.circleci_prod.name
  policy_arn = aws_iam_policy.circleci_prod.arn
}

resource "aws_iam_policy" "circleci_prod" {
  name = "circleci-prod-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters",
          "eks:UpdateClusterConfig",
          "eks:UpdateClusterVersion",
          "eks:CreateNodegroup",
          "eks:DeleteNodegroup",
          "eks:UpdateNodegroupConfig"
        ]
        Resource = aws_eks_cluster.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
          "ecr:CreateRepository",
          "ecr:DeleteRepository",
          "ecr:SetRepositoryPolicy"
        ]
        Resource = [
          for repo in aws_ecr_repository.services : repo.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:DescribeDBInstances",
          "rds:ModifyDBCluster",
          "rds:ModifyDBInstance",
          "rds:CreateDBInstance",
          "rds:DeleteDBInstance",
          "rds:RebootDBInstance"
        ]
        Resource = [
          aws_rds_cluster.main.arn,
          for instance in aws_rds_cluster_instance.main : instance.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "elasticache:DescribeCacheClusters",
          "elasticache:ModifyCacheCluster",
          "elasticache:CreateCacheCluster",
          "elasticache:DeleteCacheCluster",
          "elasticache:RebootCacheCluster"
        ]
        Resource = aws_elasticache_cluster.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ListHostedZones",
          "route53:GetChange",
          "route53:ChangeResourceRecordSets",
          "route53:CreateHostedZone",
          "route53:DeleteHostedZone"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudformation:CreateStack",
          "cloudformation:UpdateStack",
          "cloudformation:DeleteStack",
          "cloudformation:DescribeStacks",
          "cloudformation:ListStacks"
        ]
        Resource = "arn:aws:cloudformation:*:*:stack/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketVersioning"
        ]
        Resource = [
          aws_s3_bucket.terraform_state.arn,
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.terraform_locks.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:DescribeKey",
          "kms:CreateGrant",
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:ReEncrypt*"
        ]
        Resource = [
          aws_kms_key.rds.arn,
          aws_kms_key.cache.arn
        ]
      }
    ]
  })

  tags = {
    Name        = "circleci-prod-policy"
    Environment = "production"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "iam"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== SNS Topic for Alerts ====================
resource "aws_sns_topic" "alerts" {
  name = "${var.environment}-infrastructure-alerts"

  tags = {
    Name        = "${var.environment}-alerts-topic"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== CloudWatch Monitoring ====================
# EKS Cluster CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "eks_cpu_utilization" {
  alarm_name          = "${var.cluster_name}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EKS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EKS cluster CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.cluster_name
  }

  tags = {
    Name        = "${var.cluster_name}-cpu-alarm"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# EKS Cluster Memory Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "eks_memory_utilization" {
  alarm_name          = "${var.cluster_name}-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/EKS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors EKS cluster memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.cluster_name
  }

  tags = {
    Name        = "${var.cluster_name}-memory-alarm"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# RDS CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu_utilization" {
  alarm_name          = "${var.db_cluster_identifier}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.db_cluster_identifier
  }

  tags = {
    Name        = "${var.db_cluster_identifier}-cpu-alarm"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# RDS Free Storage Space Alarm
resource "aws_cloudwatch_metric_alarm" "rds_free_storage_space" {
  alarm_name          = "${var.db_cluster_identifier}-free-storage-space"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000000000" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.db_cluster_identifier
  }

  tags = {
    Name        = "${var.db_cluster_identifier}-storage-alarm"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ElastiCache CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "cache_cpu_utilization" {
  alarm_name          = "${var.cache_cluster_id}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ElastiCache CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = var.cache_cluster_id
  }

  tags = {
    Name        = "${var.cache_cluster_id}-cpu-alarm"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ElastiCache Freeable Memory Alarm
resource "aws_cloudwatch_metric_alarm" "cache_freeable_memory" {
  alarm_name          = "${var.cache_cluster_id}-freeable-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "100000000" # 100MB in bytes
  alarm_description   = "This metric monitors ElastiCache freeable memory"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = var.cache_cluster_id
  }

  tags = {
    Name        = "${var.cache_cluster_id}-memory-alarm"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}