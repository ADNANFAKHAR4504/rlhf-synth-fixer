# Quick Deployment Guide

## Infrastructure Overview

This modular Terraform infrastructure deploys a production-ready EKS cluster with all required components for the e-commerce platform.

## Module Architecture

### Core Infrastructure Modules

1. **vpc** - Network foundation
   - VPC with public/private subnets
   - NAT Gateways and Internet Gateway
   - 3 availability zones for HA

2. **iam** - Identity and access management
   - EKS cluster and node roles
   - IRSA roles for ALB controller, cluster autoscaler, EBS CSI
   - Comprehensive IAM policies

3. **eks** - Kubernetes cluster
   - EKS v1.28 with OIDC provider
   - All required add-ons (vpc-cni, kube-proxy, coredns, ebs-csi)
   - Cluster logging enabled

4. **node-groups** - Worker nodes
   - Frontend: t3.large instances
   - Backend: m5.xlarge instances
   - Data Processing: c5.2xlarge instances
   - Auto-scaling: 2-10 nodes each

5. **alb-controller** - Load balancing
   - AWS Load Balancer Controller via Helm
   - IRSA-enabled service account
   - Automatic ALB provisioning

6. **cluster-autoscaler** - Auto-scaling
   - Responds within 90 seconds
   - IRSA-enabled service account
   - Configured for all node groups

7. **istio** - Service mesh
   - mTLS enabled for all pods
   - Zero-trust authorization policies
   - Dedicated namespaces per workload

8. **ecr** - Container registries
   - Vulnerability scanning enabled
   - Lifecycle policies for image retention
   - Separate repos for each workload

9. **secrets-manager** - Secrets storage
   - AWS Secrets Manager integration
   - Separate secrets per workload
   - IRSA-enabled access

## Quick Start

### 1. Configure Environment

```bash
cd lib
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

**Critical Variables:**
```hcl
environment_suffix = "unique-suffix-here"  # MUST be unique!
aws_region         = "eu-central-1"
```

### 2. Deploy

```bash
terraform init
terraform plan
terraform apply
```

### 3. Configure kubectl

```bash
aws eks update-kubeconfig --region eu-central-1 --name eks-<environment-suffix>
```

### 4. Verify

```bash
kubectl get nodes
kubectl get pods -A
kubectl get namespaces
```

## File Structure

```
lib/
├── main.tf                          # Module orchestration
├── provider.tf                      # Provider configuration
├── variables.tf                     # Input variables
├── outputs.tf                       # Output values
├── terraform.tfvars.example         # Example configuration
├── README.md                        # Comprehensive documentation
├── DEPLOYMENT_GUIDE.md              # This file
└── modules/
    ├── vpc/                         # Networking
    ├── iam/                         # IAM roles and policies
    ├── eks/                         # EKS cluster
    ├── node-groups/                 # Managed node groups
    ├── alb-controller/              # ALB ingress controller
    ├── cluster-autoscaler/          # Cluster autoscaler
    ├── istio/                       # Service mesh
    ├── ecr/                         # Container registries
    └── secrets-manager/             # Secrets storage
```

## Requirements Met ✅

### Core Requirements
- ✅ EKS cluster v1.28 with OIDC provider enabled
- ✅ 3 availability zones for high availability
- ✅ Cluster autoscaler (2-10 nodes, 90-second response)
- ✅ Three managed node groups with specified instance types
- ✅ IRSA for pod-level AWS service access
- ✅ ALB ingress controller deployed via Helm

### EKS Add-ons
- ✅ vpc-cni (latest version)
- ✅ kube-proxy (latest version)
- ✅ coredns (latest version)
- ✅ aws-ebs-csi-driver (latest version)

### Service Mesh
- ✅ Istio with mTLS encryption
- ✅ Zero-trust network policies
- ✅ Namespace isolation

### Additional Components
- ✅ ECR with vulnerability scanning
- ✅ AWS Secrets Manager for secrets
- ✅ VPC with proper subnet configuration
- ✅ All resources include environment_suffix
- ✅ All resources are fully destroyable

## Key Features

### Security
- IRSA for secure AWS API access
- mTLS for encrypted pod communication
- Zero-trust authorization policies
- Vulnerability scanning for container images
- Centralized secrets management

### Scalability
- Auto-scaling responds within 90 seconds
- 2-10 nodes per workload type
- Horizontal pod autoscaling ready
- Multi-AZ deployment for HA

### Observability
- Cluster logging enabled
- Istio telemetry and tracing
- CloudWatch integration ready

## Common Operations

### View Resources

```bash
# EKS cluster
aws eks describe-cluster --name eks-<suffix> --region eu-central-1

# Node groups
aws eks list-nodegroups --cluster-name eks-<suffix> --region eu-central-1

# ECR repositories
aws ecr describe-repositories --region eu-central-1

# Secrets
aws secretsmanager list-secrets --region eu-central-1
```

### Deploy Application

```bash
# To frontend namespace
kubectl apply -f app.yaml -n frontend

# To backend namespace
kubectl apply -f app.yaml -n backend

# To data-processing namespace
kubectl apply -f app.yaml -n data-processing
```

### Push to ECR

```bash
# Login
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin \
  <account>.dkr.ecr.eu-central-1.amazonaws.com

# Tag and push
docker tag app:latest <account>.dkr.ecr.eu-central-1.amazonaws.com/frontend-<suffix>:latest
docker push <account>.dkr.ecr.eu-central-1.amazonaws.com/frontend-<suffix>:latest
```

### Cleanup

```bash
terraform destroy
# Type 'yes' to confirm
```

## Troubleshooting

### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace>
```

### Autoscaler Issues
```bash
kubectl logs -n kube-system -l app.kubernetes.io/name=cluster-autoscaler
```

### Istio Issues
```bash
kubectl get peerauthentication -n istio-system
kubectl get authorizationpolicies -A
istioctl analyze -A
```

## Module Dependencies

```
vpc → eks → iam → node-groups → {alb-controller, cluster-autoscaler, istio}
                               ↓
                            {ecr, secrets-manager}
```

## Performance Targets

- **Autoscaling Response**: ≤ 90 seconds
- **High Availability**: 3 AZs
- **Pod Communication**: Encrypted via mTLS
- **Image Security**: Automatic vulnerability scanning

## Naming Convention

All resources follow: `resource-type-<environment-suffix>`

Examples:
- `vpc-dev`
- `eks-dev`
- `frontend-dev`
- `backend-dev`
- `data-processing-dev`

## Cost Optimization

- Right-sized instance types per workload
- Autoscaling prevents over-provisioning
- ECR lifecycle policies manage storage
- NAT Gateways in each AZ for redundancy

## Next Steps

1. Deploy your containerized applications
2. Configure Ingress resources for ALB
3. Set up monitoring with CloudWatch Container Insights
4. Configure backup and disaster recovery
5. Implement CI/CD pipelines for deployments

## Support Resources

- AWS EKS Documentation: https://docs.aws.amazon.com/eks/
- Istio Documentation: https://istio.io/docs/
- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/

---

**Infrastructure as Code**: All resources managed via Terraform
**Security**: IRSA + mTLS + Zero-Trust
**Scalability**: Auto-scaling with 90-second response time
**High Availability**: Multi-AZ deployment across 3 zones
