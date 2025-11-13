# Network data sources and security groups for the EKS deployment

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

