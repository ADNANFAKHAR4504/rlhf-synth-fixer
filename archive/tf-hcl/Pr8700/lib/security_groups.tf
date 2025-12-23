# Cluster Security Group
resource "aws_security_group" "cluster" {
  name        = "eks-cluster-sg-${var.environmentSuffix}"
  description = "Security group for EKS cluster control plane"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "eks-cluster-sg-${var.environmentSuffix}"
  }
}

# Allow cluster to communicate with worker nodes
resource "aws_security_group_rule" "cluster_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.cluster.id
  description       = "Allow cluster to communicate with pods"
}

# Allow pods to communicate with cluster API
resource "aws_security_group_rule" "cluster_ingress_pods" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = [var.vpc_cidr]
  security_group_id = aws_security_group.cluster.id
  description       = "Allow pods to communicate with cluster API"
}
