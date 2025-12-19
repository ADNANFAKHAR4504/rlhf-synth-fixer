# MODEL FAILURES

## Critical Differences

### 1. Cluster Endpoint Configuration

** Model Response **

```hcl
vpc_config {
  subnet_ids              = aws_subnet.private[*].id
  endpoint_private_access = true
  endpoint_public_access  = true
  public_access_cidrs     = local.public_access_cidrs
  security_group_ids      = [aws_security_group.eks_cluster.id]
}
```

** Ideal Response **
```hcl
vpc_config {
  subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
  endpoint_private_access = true
  endpoint_public_access  = false
  security_group_ids      = [aws_security_group.eks_cluster.id]
}
```
** Why Ideal is Superior **

Security: Disables public endpoint access entirely, enforcing VPN/private connectivity
Zero Trust: Eliminates internet-facing attack surface for control plane
Best Practice: Follows AWS Well-Architected Framework recommendations
Subnet Design: Includes both public and private subnets for proper EKS functionality

** Impact of Model's Approach **

Severity: High - Exposes Kubernetes API to internet
Control plane accessible from any IP in public_access_cidrs
Increased risk of credential stuffing attacks
Violates compliance requirements (PCI-DSS, HIPAA)


### 2. Application Load Balancer Implementation

** Model Response **

# Missing: No ALB resource defined
# Missing: No target group
# Missing: No listener configuration
# Only security group present, no actual load balancer

** Ideal Response **
```hcl
resource "aws_lb" "main" {
  name               = "${var.cluster_name}-alb1"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true
}

resource "aws_lb_target_group" "main" {
  name        = "${var.cluster_name}-tg"
  port        = 30080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200-399"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "EKS Cluster ${var.cluster_name} is running..."
      status_code  = "200"
    }
  }
}
```
** Why Ideal is Superior **

Complete Solution: Provides fully configured ALB infrastructure
Health Monitoring: Implements proper health checks with sensible thresholds
NodePort Integration: Correctly configures target group for Kubernetes NodePort services
Production Ready: Includes HTTP/2 and cross-zone load balancing
Operational Excellence: Fixed response action prevents 503 errors before app deployment

** Impact of Model's Approach **

Severity: Critical - No ingress path to applications
Cannot expose services outside the cluster
Requires complete ALB infrastructure to be added manually
Missing listener rules for routing


### 3. Node Group Configuration

** Model Response **
```hcl
resource "aws_eks_node_group" "x86" {
  # ...
  ami_type       = "AL2_x86_64"
  disk_size      = 50
  # No launch template
  # Basic configuration only
}
```
** Ideal Response **
```hcl
resource "aws_launch_template" "x86_nodes" {
  name_prefix = "${var.cluster_name}-x86-"
  
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 100
      volume_type = "gp3"
      iops        = 3000
      throughput  = 125
      encrypted   = true
      delete_on_termination = true
    }
  }
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # IMDSv2 enforcement
    http_put_response_hop_limit = 2
    instance_metadata_tags      = "enabled"
  }
  
  monitoring {
    enabled = true
  }
}

resource "aws_eks_node_group" "x86" {
  # ...
  ami_type = "AL2023_x86_64_STANDARD"
  
  launch_template {
    id      = aws_launch_template.x86_nodes.id
    version = aws_launch_template.x86_nodes.latest_version
  }
}
```
** Why Ideal is Superior ** 

Security Hardening: Enforces IMDSv2 (prevents SSRF attacks)
Performance: Uses gp3 volumes with optimized IOPS/throughput (3000 IOPS vs default 3000, 125 MB/s vs 125 MB/s)
Storage: 100GB vs 50GB provides buffer for container images and logs
Modern AMI: Uses AL2023 (Amazon Linux 2023) vs AL2 (longer support, better security)
Encryption: Enforces EBS encryption at rest
Observability: Enables detailed monitoring
Cost Optimization: gp3 is ~20% cheaper than gp2 for same performance

** Impact of Model's Approach **

Severity: High - Security and operational gaps
Vulnerable to IMDSv1 exploits (credential theft)
Insufficient disk space may cause pod evictions
Missing detailed monitoring metrics
Higher storage costs with gp2 volumes
Using older AMI with shorter support lifecycle


### 4. KMS Key Policy Configuration
** Model Response **
```hcl
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key for ${local.cluster_name}"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  # No policy defined
}
```
** Ideal Response **
```hcl
resource "aws_kms_key" "eks" {
  description             = "KMS key for EKS cluster ${var.cluster_name} encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = { Service = "logs.${var.aws_region}.amazonaws.com" }
        Action = [
          "kms:Encrypt*", "kms:Decrypt*", "kms:ReEncrypt*",
          "kms:GenerateDataKey*", "kms:CreateGrant", "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/eks/${var.cluster_name}/*"
          }
        }
      },
      {
        Sid    = "Allow EKS nodes to use the key"
        Effect = "Allow"
        Principal = { AWS = aws_iam_role.eks_nodes.arn }
        Action = ["kms:Decrypt", "kms:GenerateDataKey", "kms:CreateGrant", "kms:DescribeKey"]
        Resource = "*"
      }
    ]
  })
}
```
***Why Ideal is Superior **

Explicit Permissions: Defines granular access for each service
CloudWatch Integration: Allows log encryption without failures
Node Access: Permits EKS nodes to decrypt secrets
Condition Keys: Restricts CloudWatch access to specific log groups
Least Privilege: Each principal gets minimum required permissions

** Impact of Model's Approach **

Severity: High - Deployment failures likely
CloudWatch log group creation may fail (cannot use KMS key)
EKS nodes cannot decrypt secrets properly
Potential runtime errors accessing encrypted resources
Manual policy addition required post-deployment

### 5. Security Group Rule Organization
** Model Response **
```hcl
# Cluster ingress only from public_access_cidrs
resource "aws_security_group_rule" "cluster_ingress_workstation_https" {
  description       = "Allow pods to communicate with the cluster API"
  type              = "ingress"
  cidr_blocks       = local.public_access_cidrs  # Wrong description
}
```
# Missing: No rule for cluster-to-nodes communication

** Ideal Response **
```hcl
# Nodes to cluster
resource "aws_security_group_rule" "eks_cluster_ingress_nodes" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.eks_nodes.id
  security_group_id        = aws_security_group.eks_cluster.id
  description              = "Allow nodes to communicate with the cluster API"
}

# Nodes internal communication
resource "aws_security_group_rule" "eks_nodes_ingress_self" {
  type              = "ingress"
  from_port         = 0
  to_port           = 65535
  protocol          = "-1"
  self              = true
  security_group_id = aws_security_group.eks_nodes.id
  description       = "Allow nodes to communicate with each other"
}

# Cluster to nodes
resource "aws_security_group_rule" "eks_nodes_ingress_cluster" {
  type                     = "ingress"
  from_port                = 1025
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.eks_cluster.id
  security_group_id        = aws_security_group.eks_nodes.id
  description              = "Allow worker Kubelets and pods to receive communication from the cluster control plane"
}
```
** Why Ideal is Superior **

Correct Flow: Node-to-cluster communication uses security group references
No CIDR Blocks: Eliminates need to manage IP ranges for internal traffic
Self-Referencing: Allows pod-to-pod communication automatically
Complete Coverage: All necessary communication paths defined
Better Descriptions: Accurately describes each rule's purpose

** Impact of Model's Approach **

Severity: Medium-High - Communication failures
Cluster cannot reach nodes properly (missing cluster-to-nodes rule)
Node-to-cluster traffic goes through public endpoint (security risk)
Scaling issues when node IPs change
Incomplete network policy enforcement
