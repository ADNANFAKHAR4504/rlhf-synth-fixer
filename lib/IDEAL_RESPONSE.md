```hcl
# provider.tf
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.27"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.current.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.current.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.current.token
}
```

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region where the EKS infrastructure will be deployed."
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix appended to resource names and tags to ensure environment isolation."
  type        = string
}

variable "cluster_name_prefix" {
  description = "Base name for the EKS cluster. The environment suffix is appended automatically."
  type        = string
  default     = "payments-platform-eks"
}

variable "cluster_version" {
  description = "Desired Kubernetes control plane version."
  type        = string
  default     = "1.28"
}

variable "cluster_log_retention_days" {
  description = "Retention period in days for EKS control plane CloudWatch Logs."
  type        = number
  default     = 30
}

variable "vpc_id_parameter_name" {
  description = "AWS Systems Manager Parameter Store name that holds the target VPC ID."
  type        = string
  default     = "/infrastructure/vpc/id"
}

variable "private_subnet_tag_key" {
  description = "Tag key used to identify private subnets."
  type        = string
  default     = "Type"
}

variable "private_subnet_tag_value" {
  description = "Tag value used to identify private subnets."
  type        = string
  default     = "private"
}

variable "availability_zones" {
  description = "Availability zones used for the EKS control plane and node groups."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "kubernetes_namespace" {
  description = "Namespace used for the payment services workloads."
  type        = string
  default     = "payments"
}

variable "database_secret_name" {
  description = "Name of the AWS Secrets Manager secret that stores the database credentials."
  type        = string
  default     = "payments/database"
}

locals {
  cluster_name             = "${var.cluster_name_prefix}-${var.environment_suffix}"
  frontend_node_group_name = "${local.cluster_name}-frontend"
  backend_node_group_name  = "${local.cluster_name}-backend"
  frontend_launch_template = "${local.cluster_name}-frontend-lt"
  backend_launch_template  = "${local.cluster_name}-backend-lt"
  kms_alias_name           = "alias/${local.cluster_name}"
  log_group_name           = "/aws/eks/${local.cluster_name}/cluster"
  namespace_name           = "${var.kubernetes_namespace}-${var.environment_suffix}"
  database_secret_name     = "${var.database_secret_name}-${var.environment_suffix}"
  sns_topic_name           = "${local.cluster_name}-autoscaler-alerts"

  common_tags = {
    Environment       = "production"
    EnvironmentSuffix = var.environment_suffix
    ManagedBy         = "terraform"
    Application       = "payments-platform"
    Component         = "eks"
  }
}
```

```hcl
# kubernetes_provider.tf
data "aws_eks_cluster" "current" {
  name       = aws_eks_cluster.main.name
  depends_on = [aws_eks_cluster.main]
}

data "aws_eks_cluster_auth" "current" {
  name       = aws_eks_cluster.main.name
  depends_on = [aws_eks_cluster.main]
}
```

```hcl
# network.tf
data "aws_ssm_parameter" "vpc_id" {
  name = var.vpc_id_parameter_name
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_ssm_parameter.vpc_id.value]
  }

  filter {
    name   = "availability-zone"
    values = var.availability_zones
  }

  filter {
    name   = "tag:${var.private_subnet_tag_key}"
    values = [var.private_subnet_tag_value]
  }
}

locals {
  kubernetes_control_plane_ports = [
    {
      description = "Kubernetes API access"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
    },
    {
      description = "Kubelet API"
      from_port   = 10250
      to_port     = 10250
      protocol    = "tcp"
    }
  ]

  node_internal_ports = [
    {
      description = "Inter-node TCP communication"
      from_port   = 0
      to_port     = 65535
      protocol    = "tcp"
    },
    {
      description = "Inter-node UDP communication"
      from_port   = 0
      to_port     = 65535
      protocol    = "udp"
    }
  ]
}

resource "aws_security_group" "eks_cluster" {
  name        = "${local.cluster_name}-cp-sg"
  description = "Control plane security group for ${local.cluster_name}"
  vpc_id      = data.aws_ssm_parameter.vpc_id.value

  tags = merge(local.common_tags, {
    Name                                          = "${local.cluster_name}-cp-sg"
    "kubernetes.io/cluster/${local.cluster_name}" = "owned"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "eks_nodes" {
  name        = "${local.cluster_name}-node-sg"
  description = "Worker node security group for ${local.cluster_name}"
  vpc_id      = data.aws_ssm_parameter.vpc_id.value

  egress {
    description = "Allow HTTPS egress to AWS services"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow DNS UDP egress"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow DNS TCP egress"
    from_port   = 53
    to_port     = 53
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name                                          = "${local.cluster_name}-node-sg"
    "kubernetes.io/cluster/${local.cluster_name}" = "owned"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "cluster_ingress_from_nodes" {
  for_each = { for rule in local.kubernetes_control_plane_ports : rule.description => rule }

  security_group_id        = aws_security_group.eks_cluster.id
  type                     = "ingress"
  description              = each.value.description
  from_port                = each.value.from_port
  to_port                  = each.value.to_port
  protocol                 = each.value.protocol
  source_security_group_id = aws_security_group.eks_nodes.id
}

resource "aws_security_group_rule" "cluster_egress_to_nodes" {
  for_each = { for rule in local.kubernetes_control_plane_ports : rule.description => rule }

  security_group_id        = aws_security_group.eks_cluster.id
  type                     = "egress"
  description              = each.value.description
  from_port                = each.value.from_port
  to_port                  = each.value.to_port
  protocol                 = each.value.protocol
  source_security_group_id = aws_security_group.eks_nodes.id
}

resource "aws_security_group_rule" "nodes_ingress_from_cluster" {
  for_each = { for rule in local.kubernetes_control_plane_ports : rule.description => rule }

  security_group_id        = aws_security_group.eks_nodes.id
  type                     = "ingress"
  description              = each.value.description
  from_port                = each.value.from_port
  to_port                  = each.value.to_port
  protocol                 = each.value.protocol
  source_security_group_id = aws_security_group.eks_cluster.id
}

resource "aws_security_group_rule" "nodes_internal" {
  for_each = { for rule in local.node_internal_ports : rule.description => rule }

  security_group_id = aws_security_group.eks_nodes.id
  type              = "ingress"
  description       = each.value.description
  from_port         = each.value.from_port
  to_port           = each.value.to_port
  protocol          = each.value.protocol
  self              = true
}

resource "aws_security_group_rule" "nodes_dns_tcp" {
  security_group_id = aws_security_group.eks_nodes.id
  type              = "ingress"
  description       = "CoreDNS TCP"
  from_port         = 53
  to_port           = 53
  protocol          = "tcp"
  self              = true
}

resource "aws_security_group_rule" "nodes_dns_udp" {
  security_group_id = aws_security_group.eks_nodes.id
  type              = "ingress"
  description       = "CoreDNS UDP"
  from_port         = 53
  to_port           = 53
  protocol          = "udp"
  self              = true
}
```

```hcl
# eks_cluster.tf
resource "aws_kms_key" "eks" {
  description             = "KMS key for ${local.cluster_name} secret encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-kms"
  })

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_kms_alias" "eks" {
  name          = local.kms_alias_name
  target_key_id = aws_kms_key.eks.key_id
}

resource "aws_cloudwatch_log_group" "eks" {
  name              = local.log_group_name
  retention_in_days = var.cluster_log_retention_days
  kms_key_id        = aws_kms_key.eks.arn

  tags = local.common_tags
}

resource "aws_eks_cluster" "main" {
  name     = local.cluster_name
  version  = var.cluster_version
  role_arn = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids              = data.aws_subnets.private.ids
    security_group_ids      = [aws_security_group.eks_cluster.id]
    endpoint_private_access = true
    endpoint_public_access  = false
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator"]

  encryption_config {
    resources = ["secrets"]

    provider {
      key_arn = aws_kms_key.eks.arn
    }
  }

  tags = merge(local.common_tags, {
    Name = local.cluster_name
  })

  lifecycle {
    prevent_destroy = false
  }

  depends_on = [
    aws_cloudwatch_log_group.eks,
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller
  ]
}

data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer

  depends_on = [aws_eks_cluster.main]
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = local.common_tags

  depends_on = [aws_eks_cluster.main]
}
```

```hcl
# iam.tf
data "aws_caller_identity" "current" {}

data "aws_secretsmanager_secret" "database" {
  name = local.database_secret_name
}

data "aws_iam_policy_document" "eks_cluster_trust" {
  statement {
    sid     = "EKSTrust"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "eks_cluster" {
  name               = "${local.cluster_name}-cluster-role"
  assume_role_policy = data.aws_iam_policy_document.eks_cluster_trust.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

data "aws_iam_policy_document" "eks_node_trust" {
  statement {
    sid     = "EC2Trust"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "frontend_nodes" {
  name               = "${local.cluster_name}-frontend-role"
  assume_role_policy = data.aws_iam_policy_document.eks_node_trust.json
  description        = "Managed node group role for frontend workloads"

  tags = local.common_tags
}

resource "aws_iam_role" "backend_nodes" {
  name               = "${local.cluster_name}-backend-role"
  assume_role_policy = data.aws_iam_policy_document.eks_node_trust.json
  description        = "Managed node group role for backend workloads"

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "frontend_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.frontend_nodes.name
}

resource "aws_iam_role_policy_attachment" "backend_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.backend_nodes.name
}

resource "aws_iam_role_policy_attachment" "frontend_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.frontend_nodes.name
}

resource "aws_iam_role_policy_attachment" "backend_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.backend_nodes.name
}

resource "aws_iam_role_policy_attachment" "frontend_ecr_ro" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.frontend_nodes.name
}

resource "aws_iam_role_policy_attachment" "backend_ecr_ro" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.backend_nodes.name
}

data "aws_iam_policy_document" "eks_node_ecr_access" {
  statement {
    sid       = "ECRAuthorization"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "ECRRead"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:DescribeRepositories",
      "ecr:ListImages"
    ]
    resources = [
      "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${local.cluster_name}-frontend",
      "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${local.cluster_name}-backend"
    ]
  }
}

resource "aws_iam_policy" "eks_node_ecr_access" {
  name        = "${local.cluster_name}-node-ecr"
  description = "ECR access for EKS managed node groups"
  policy      = data.aws_iam_policy_document.eks_node_ecr_access.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "frontend_node_ecr_access" {
  policy_arn = aws_iam_policy.eks_node_ecr_access.arn
  role       = aws_iam_role.frontend_nodes.name
}

resource "aws_iam_role_policy_attachment" "backend_node_ecr_access" {
  policy_arn = aws_iam_policy.eks_node_ecr_access.arn
  role       = aws_iam_role.backend_nodes.name
}

data "aws_iam_policy_document" "app_irsa_trust" {
  statement {
    sid     = "IRSA"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:${local.namespace_name}:payments-app-sa-${var.environment_suffix}"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
  }
}

resource "aws_iam_role" "app_irsa" {
  name               = "${local.cluster_name}-app-irsa"
  assume_role_policy = data.aws_iam_policy_document.app_irsa_trust.json

  tags = local.common_tags
}

data "aws_iam_policy_document" "app_irsa" {
  statement {
    sid    = "ReadDatabaseSecret"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [data.aws_secretsmanager_secret.database.arn]
  }
}

resource "aws_iam_policy" "app_irsa_policy" {
  name        = "${local.cluster_name}-app-irsa"
  description = "Permissions for application pods accessing shared services"
  policy      = data.aws_iam_policy_document.app_irsa.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "app_irsa_policy" {
  policy_arn = aws_iam_policy.app_irsa_policy.arn
  role       = aws_iam_role.app_irsa.name
}

data "aws_iam_policy_document" "cluster_autoscaler_trust" {
  statement {
    sid     = "ClusterAutoscalerIRSA"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:cluster-autoscaler-${var.environment_suffix}"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
  }
}

resource "aws_iam_role" "cluster_autoscaler" {
  name               = "${local.cluster_name}-cluster-autoscaler"
  assume_role_policy = data.aws_iam_policy_document.cluster_autoscaler_trust.json

  tags = local.common_tags
}

data "aws_iam_policy_document" "cluster_autoscaler" {
  statement {
    sid    = "DescribeScaling"
    effect = "Allow"
    actions = [
      "autoscaling:DescribeAutoScalingGroups",
      "autoscaling:DescribeAutoScalingInstances",
      "autoscaling:DescribeLaunchConfigurations",
      "autoscaling:DescribeScalingActivities",
      "autoscaling:DescribeTags",
      "ec2:DescribeImages",
      "ec2:DescribeInstanceTypes",
      "ec2:DescribeLaunchTemplateVersions",
      "eks:DescribeNodegroup"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ScaleNodeGroups"
    effect = "Allow"
    actions = [
      "autoscaling:SetDesiredCapacity",
      "autoscaling:TerminateInstanceInAutoScalingGroup"
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "autoscaling:ResourceTag/k8s.io/cluster-autoscaler/enabled"
      values   = ["true"]
    }
    condition {
      test     = "StringEquals"
      variable = "autoscaling:ResourceTag/k8s.io/cluster-autoscaler/${local.cluster_name}"
      values   = ["owned"]
    }
  }
}

resource "aws_iam_policy" "cluster_autoscaler" {
  name        = "${local.cluster_name}-cluster-autoscaler"
  description = "Permissions for the Kubernetes cluster-autoscaler"
  policy      = data.aws_iam_policy_document.cluster_autoscaler.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  policy_arn = aws_iam_policy.cluster_autoscaler.arn
  role       = aws_iam_role.cluster_autoscaler.name
}
```

```hcl
# node_groups.tf
resource "aws_eks_node_group" "frontend" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = local.frontend_node_group_name
  node_role_arn   = aws_iam_role.frontend_nodes.arn
  subnet_ids      = data.aws_subnets.private.ids
  version         = aws_eks_cluster.main.version

  scaling_config {
    desired_size = 2
    max_size     = 6
    min_size     = 2
  }

  update_config {
    max_unavailable = 1
  }

  launch_template {
    id      = aws_launch_template.frontend.id
    version = "$Latest"
  }

  labels = {
    app  = "frontend"
    tier = "web"
  }

  taint {
    key    = "app"
    value  = "frontend"
    effect = "NO_SCHEDULE"
  }

  tags = merge(local.common_tags, {
    Name                                              = local.frontend_node_group_name
    "k8s.io/cluster-autoscaler/enabled"               = "true"
    "k8s.io/cluster-autoscaler/${local.cluster_name}" = "owned"
  })

  lifecycle {
    prevent_destroy = false
  }

  depends_on = [
    aws_iam_role_policy_attachment.frontend_worker_node_policy,
    aws_iam_role_policy_attachment.frontend_cni_policy,
    aws_iam_role_policy_attachment.frontend_ecr_ro
  ]
}

resource "aws_eks_node_group" "backend" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = local.backend_node_group_name
  node_role_arn   = aws_iam_role.backend_nodes.arn
  subnet_ids      = data.aws_subnets.private.ids
  version         = aws_eks_cluster.main.version

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 3
  }

  update_config {
    max_unavailable = 1
  }

  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  labels = {
    app  = "backend"
    tier = "api"
  }

  taint {
    key    = "app"
    value  = "backend"
    effect = "NO_SCHEDULE"
  }

  tags = merge(local.common_tags, {
    Name                                              = local.backend_node_group_name
    "k8s.io/cluster-autoscaler/enabled"               = "true"
    "k8s.io/cluster-autoscaler/${local.cluster_name}" = "owned"
  })

  lifecycle {
    prevent_destroy = false
  }

  depends_on = [
    aws_iam_role_policy_attachment.backend_worker_node_policy,
    aws_iam_role_policy_attachment.backend_cni_policy,
    aws_iam_role_policy_attachment.backend_ecr_ro
  ]
}

resource "aws_launch_template" "frontend" {
  name_prefix = "${local.frontend_launch_template}-"

  instance_type = "t3.medium"

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
      kms_key_id            = aws_kms_key.eks.arn
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
    instance_metadata_tags      = "enabled"
  }

  network_interfaces {
    security_groups             = [aws_security_group.eks_nodes.id]
    delete_on_termination       = true
    associate_public_ip_address = false
  }

  user_data = base64encode(templatefile("${path.module}/templates/userdata.sh", {
    cluster_name        = aws_eks_cluster.main.name
    cluster_endpoint    = aws_eks_cluster.main.endpoint
    cluster_ca          = aws_eks_cluster.main.certificate_authority[0].data
    node_group_name     = local.frontend_node_group_name
    bootstrap_arguments = "--kubelet-extra-args '--node-labels=app=frontend,tier=web'"
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.cluster_name}-frontend-node"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${local.cluster_name}-frontend-node-volume"
    })
  }

  tags = merge(local.common_tags, {
    Name = local.frontend_launch_template
  })
}

resource "aws_launch_template" "backend" {
  name_prefix = "${local.backend_launch_template}-"

  instance_type = "t3.large"

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
      kms_key_id            = aws_kms_key.eks.arn
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
    instance_metadata_tags      = "enabled"
  }

  network_interfaces {
    security_groups             = [aws_security_group.eks_nodes.id]
    delete_on_termination       = true
    associate_public_ip_address = false
  }

  user_data = base64encode(templatefile("${path.module}/templates/userdata.sh", {
    cluster_name        = aws_eks_cluster.main.name
    cluster_endpoint    = aws_eks_cluster.main.endpoint
    cluster_ca          = aws_eks_cluster.main.certificate_authority[0].data
    node_group_name     = local.backend_node_group_name
    bootstrap_arguments = "--kubelet-extra-args '--node-labels=app=backend,tier=api'"
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.cluster_name}-backend-node"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, {
      Name = "${local.cluster_name}-backend-node-volume"
    })
  }

  tags = merge(local.common_tags, {
    Name = local.backend_launch_template
  })
}
```

```hcl
# autoscaler.tf
locals {
  autoscaler_alarm_targets = {
    frontend = aws_eks_node_group.frontend.resources[0].autoscaling_groups[0].name
    backend  = aws_eks_node_group.backend.resources[0].autoscaling_groups[0].name
  }
}

resource "kubernetes_service_account" "cluster_autoscaler" {
  metadata {
    name      = "cluster-autoscaler-${var.environment_suffix}"
    namespace = "kube-system"

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.cluster_autoscaler.arn
    }

    labels = {
      "app.kubernetes.io/name"       = "cluster-autoscaler"
      "app.kubernetes.io/managed-by" = "terraform"
      environment                    = "production"
    }
  }

  depends_on = [
    aws_iam_role.cluster_autoscaler,
    aws_iam_openid_connect_provider.eks,
    aws_eks_cluster.main
  ]
}

resource "aws_sns_topic" "eks_alerts" {
  name              = local.sns_topic_name
  kms_master_key_id = aws_kms_key.eks.arn

  tags = local.common_tags
}

resource "aws_sns_topic_policy" "eks_alerts" {
  arn = aws_sns_topic.eks_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "cloudwatch.amazonaws.com"
      }
      Action   = "SNS:Publish"
      Resource = aws_sns_topic.eks_alerts.arn
    }]
  })
}

resource "aws_cloudwatch_metric_alarm" "node_scale_up" {
  for_each = local.autoscaler_alarm_targets

  alarm_name          = "${local.cluster_name}-${each.key}-scale-up"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DesiredCapacity"
  namespace           = "AWS/AutoScaling"
  period              = 300
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Detects when the ${each.key} node group scales up."
  alarm_actions       = [aws_sns_topic.eks_alerts.arn]

  dimensions = {
    AutoScalingGroupName = each.value
  }

  tags = local.common_tags

  depends_on = [
    aws_eks_node_group.frontend,
    aws_eks_node_group.backend
  ]
}

resource "aws_cloudwatch_metric_alarm" "node_scale_down" {
  for_each = local.autoscaler_alarm_targets

  alarm_name          = "${local.cluster_name}-${each.key}-scale-down"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DesiredCapacity"
  namespace           = "AWS/AutoScaling"
  period              = 300
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Detects when the ${each.key} node group scales down below desired capacity."
  alarm_actions       = [aws_sns_topic.eks_alerts.arn]

  dimensions = {
    AutoScalingGroupName = each.value
  }

  tags = local.common_tags

  depends_on = [
    aws_eks_node_group.frontend,
    aws_eks_node_group.backend
  ]
}
```

```hcl
# kubernetes_resources.tf
resource "kubernetes_namespace" "payments" {
  metadata {
    name = local.namespace_name

    labels = {
      "app.kubernetes.io/name"             = var.kubernetes_namespace
      "app.kubernetes.io/managed-by"       = "terraform"
      "pod-security.kubernetes.io/enforce" = "restricted"
      "pod-security.kubernetes.io/audit"   = "restricted"
      "pod-security.kubernetes.io/warn"    = "restricted"
      environment                          = "production"
      environmentSuffix                    = var.environment_suffix
    }
  }

  depends_on = [aws_eks_cluster.main]
}

resource "kubernetes_service_account" "payments_app" {
  metadata {
    name      = "payments-app-sa-${var.environment_suffix}"
    namespace = kubernetes_namespace.payments.metadata[0].name

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.app_irsa.arn
    }

    labels = {
      "app.kubernetes.io/name"       = "payments-app"
      "app.kubernetes.io/managed-by" = "terraform"
      environment                    = "production"
    }
  }

  depends_on = [
    aws_iam_role.app_irsa,
    aws_iam_openid_connect_provider.eks,
    aws_eks_cluster.main
  ]
}
```

```hcl
# outputs.tf
output "environment_suffix" {
  description = "Environment suffix applied to all resource names for isolation."
  value       = var.environment_suffix
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "cluster_version" {
  description = "The Kubernetes version for the cluster"
  value       = aws_eks_cluster.main.version
}

output "cluster_platform_version" {
  description = "The platform version for the cluster"
  value       = aws_eks_cluster.main.platform_version
}

output "cluster_status" {
  description = "Status of the EKS cluster. One of `CREATING`, `ACTIVE`, `DELETING`, `FAILED`"
  value       = aws_eks_cluster.main.status
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS control plane"
  value       = aws_security_group.eks_cluster.id
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN assumed by the EKS control plane"
  value       = aws_iam_role.eks_cluster.arn
}

output "node_security_group_id" {
  description = "Security group ID attached to the EKS worker nodes"
  value       = aws_security_group.eks_nodes.id
}

output "node_groups" {
  description = "Node group details"
  value = {
    frontend = {
      id            = aws_eks_node_group.frontend.id
      arn           = aws_eks_node_group.frontend.arn
      status        = aws_eks_node_group.frontend.status
      capacity_type = aws_eks_node_group.frontend.capacity_type
    }
    backend = {
      id            = aws_eks_node_group.backend.id
      arn           = aws_eks_node_group.backend.arn
      status        = aws_eks_node_group.backend.status
      capacity_type = aws_eks_node_group.backend.capacity_type
    }
  }
}

output "frontend_node_group_name" {
  description = "Frontend node group identifier"
  value       = aws_eks_node_group.frontend.node_group_name
}

output "backend_node_group_name" {
  description = "Backend node group identifier"
  value       = aws_eks_node_group.backend.node_group_name
}

output "cluster_autoscaler_role_arn" {
  description = "ARN of IAM role for cluster autoscaler"
  value       = aws_iam_role.cluster_autoscaler.arn
}

output "app_irsa_role_arn" {
  description = "ARN of IAM role for application IRSA"
  value       = aws_iam_role.app_irsa.arn
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC Provider for EKS"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "kms_key_arn" {
  description = "The Amazon Resource Name (ARN) of the KMS key"
  value       = aws_kms_key.eks.arn
}

output "cluster_log_group_name" {
  description = "Name of the CloudWatch log group for EKS cluster logs"
  value       = aws_cloudwatch_log_group.eks.name
}

output "kubectl_config" {
  description = "kubectl config as generated by the module"
  value = {
    cluster_name = aws_eks_cluster.main.name
    endpoint     = aws_eks_cluster.main.endpoint
    region       = var.aws_region
    ca_data      = aws_eks_cluster.main.certificate_authority[0].data
  }
  sensitive = true
}

output "payments_namespace" {
  description = "Kubernetes namespace that hosts the payments workloads."
  value       = kubernetes_namespace.payments.metadata[0].name
}

output "payments_service_account" {
  description = "IRSA-enabled service account bound to the payments namespace."
  value       = kubernetes_service_account.payments_app.metadata[0].name
}

output "alerts_topic_arn" {
  description = "SNS topic ARN used for autoscaler alerts."
  value       = aws_sns_topic.eks_alerts.arn
}

output "database_secret_name" {
  description = "Name of the database credentials secret consumed by workloads."
  value       = local.database_secret_name
}
```

```bash
# templates/userdata.sh
#!/bin/bash
set -o xtrace

/etc/eks/bootstrap.sh ${cluster_name} --b64-cluster-ca ${cluster_ca} --apiserver-endpoint ${cluster_endpoint} ${bootstrap_arguments}

yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

cat > /etc/logrotate.d/kubelet <<EOF
/var/log/kubelet.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF
```
