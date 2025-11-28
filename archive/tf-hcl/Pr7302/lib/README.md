# EKS Infrastructure for E-Commerce Platform

## Overview

This Terraform infrastructure provides a production-ready Amazon EKS (Elastic Kubernetes Service) deployment for containerized microservices. The infrastructure is designed to handle peak shopping seasons with automatic scaling, high availability across multiple availability zones, and secure, isolated compute resources.

## Architecture

### Infrastructure Components

1. **VPC and Networking**
   - Dedicated VPC with 10.0.0.0/16 CIDR
   - 3 public subnets for load balancers
   - 3 private subnets for worker nodes
   - NAT Gateways for outbound traffic from private subnets
   - Internet Gateway for public subnet access

2. **EKS Cluster (v1.28)**
   - OIDC provider enabled for IRSA (IAM Roles for Service Accounts)
   - Deployed across 3 availability zones for high availability
   - Cluster logging enabled (API, audit, authenticator, controller manager, scheduler)

3. **Managed Node Groups**
   - **Frontend**: t3.large instances for frontend services
   - **Backend**: m5.xlarge instances for backend APIs
   - **Data Processing**: c5.2xlarge instances for data-processing workloads
   - Auto-scaling enabled (min: 2, max: 10 nodes per group)

4. **EKS Add-ons**
   - vpc-cni: AWS VPC CNI plugin for pod networking
   - kube-proxy: Network proxy for Kubernetes services
   - coredns: DNS server for service discovery
   - aws-ebs-csi-driver: Persistent volume support

5. **ALB Ingress Controller**
   - Deployed via Helm with IRSA
   - Manages Application Load Balancers in public subnets
   - Automatic health checks and routing

6. **Cluster Autoscaler**
   - Responds to load changes within 90 seconds
   - Automatic scaling based on pod resource requests
   - Configured with IRSA for secure AWS API access

7. **Istio Service Mesh**
   - Strict mTLS for encrypted pod-to-pod communication
   - Zero-trust network policies between namespaces
   - Authorization policies for microservice isolation
   - Dedicated namespaces: frontend, backend, data-processing

8. **Amazon ECR**
   - Separate repositories for each microservice type
   - Automatic vulnerability scanning on image push
   - Lifecycle policies to retain last 30 images

9. **AWS Secrets Manager**
   - Secure storage for application secrets
   - Separate secrets for each microservice tier
   - Runtime secret injection via IRSA

### Security Features

- **IRSA (IAM Roles for Service Accounts)**: Pod-level AWS service access
- **mTLS Encryption**: All inter-service communication encrypted via Istio
- **Zero-Trust Policies**: Namespace-level authorization controls
- **Vulnerability Scanning**: Automatic image scanning in ECR
- **Secrets Management**: Centralized secret storage and injection

## Module Structure

```
lib/
├── main.tf                      # Root module orchestration
├── variables.tf                 # Input variables
├── outputs.tf                   # Output values
├── provider.tf                  # Provider configuration
├── terraform.tfvars.example     # Example variable values
├── README.md                    # This file
└── modules/
    ├── vpc/                     # VPC and networking
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── iam/                     # IAM roles and policies
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── eks/                     # EKS cluster
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── node-groups/             # EKS managed node groups
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── alb-controller/          # ALB ingress controller
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── cluster-autoscaler/      # Cluster autoscaler
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── istio/                   # Istio service mesh
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── ecr/                     # Container registries
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── secrets-manager/         # Secrets storage
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Prerequisites

- **Terraform**: Version 1.5 or higher
- **AWS CLI**: Version 2 configured with appropriate credentials
- **kubectl**: For interacting with the EKS cluster
- **AWS Permissions**: IAM permissions to create EKS, VPC, IAM, and related resources

## Deployment Instructions

### 1. Configure Variables

Copy the example variables file and customize it:

```bash
cd lib
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and update the following critical variables:

```hcl
environment_suffix = "your-unique-suffix"  # MUST be unique
aws_region         = "eu-central-1"
```

### 2. Initialize Terraform

```bash
terraform init
```

This will download the required provider plugins.

### 3. Review the Plan

```bash
terraform plan
```

Review the execution plan to ensure all resources will be created as expected.

### 4. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm deployment.

**Deployment time**: Approximately 20-30 minutes for complete infrastructure.

### 5. Configure kubectl

After deployment, configure kubectl to connect to your cluster:

```bash
aws eks update-kubeconfig --region eu-central-1 --name eks-<environment-suffix>
```

Or use the command from the Terraform output:

```bash
terraform output -raw configure_kubectl | bash
```

### 6. Verify Deployment

Check cluster status:

```bash
kubectl get nodes
kubectl get pods -A
```

Verify Istio installation:

```bash
kubectl get pods -n istio-system
```

Check namespaces:

```bash
kubectl get namespaces
```

## Resource Naming Convention

All resources follow the pattern: `resource-type-<environment-suffix>`

Examples:
- VPC: `vpc-dev`
- EKS Cluster: `eks-dev`
- Node Groups: `frontend-dev`, `backend-dev`, `data-processing-dev`
- ECR Repositories: `frontend-dev`, `backend-dev`, `data-processing-dev`

## Deployment Requirements (Critical)

1. **Environment Suffix**: All resources include the `environment_suffix` variable for unique naming
2. **Destroyable Resources**: All resources use removal policies that allow destruction (no Retain policies)
3. **Vulnerability Scanning**: Container images must be scanned before deployment
4. **Secrets Management**: Secrets stored in AWS Secrets Manager and injected at runtime
5. **Zero-Trust Networking**: Network policies enforce zero-trust communication between namespaces

## Autoscaling Configuration

The cluster autoscaler is configured to:
- Monitor pod resource requests every 10 seconds
- Scale up within 90 seconds when pods are unschedulable
- Scale down after 90 seconds of underutilization
- Balance similar node groups for optimal distribution

## Microservice Deployment

### Deploy to Frontend Namespace

```bash
kubectl apply -f your-frontend-app.yaml -n frontend
```

### Deploy to Backend Namespace

```bash
kubectl apply -f your-backend-app.yaml -n backend
```

### Deploy to Data Processing Namespace

```bash
kubectl apply -f your-data-processing-app.yaml -n data-processing
```

### Accessing Secrets

Use Kubernetes secrets with External Secrets Operator or AWS Secrets CSI Driver:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app
  namespace: frontend
spec:
  serviceAccountName: app-service-account
  containers:
  - name: app
    image: frontend-app:latest
    env:
    - name: SECRET_NAME
      valueFrom:
        secretKeyRef:
          name: frontend-secrets
          key: api_key
```

## ECR Usage

### Push Images to ECR

1. Authenticate to ECR:
```bash
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.eu-central-1.amazonaws.com
```

2. Tag your image:
```bash
docker tag frontend-app:latest <account-id>.dkr.ecr.eu-central-1.amazonaws.com/frontend-dev:latest
```

3. Push to ECR:
```bash
docker push <account-id>.dkr.ecr.eu-central-1.amazonaws.com/frontend-dev:latest
```

Images are automatically scanned for vulnerabilities on push.

## Monitoring and Logging

- **Cluster Logs**: Available in CloudWatch Logs
- **Application Logs**: Configure logging sidecar or use CloudWatch Container Insights
- **Istio Telemetry**: Access logs available in Istio control plane

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted. This will delete all infrastructure components.

**Note**: All resources are configured to be fully destroyable without retention policies.

## Outputs

After deployment, Terraform provides important outputs:

- `eks_cluster_name`: Name of the EKS cluster
- `eks_cluster_endpoint`: API server endpoint
- `configure_kubectl`: Command to configure kubectl
- `ecr_repositories`: ECR repository URLs
- `secrets_manager_secrets`: Secret names in Secrets Manager
- `deployment_summary`: Complete deployment configuration

View outputs:

```bash
terraform output
```

## Success Criteria

- ✅ All 6 mandatory requirements implemented
- ✅ Autoscaling responds within 90 seconds
- ✅ High availability across 3 availability zones
- ✅ IRSA enabled for secure AWS service access
- ✅ Secrets in AWS Secrets Manager
- ✅ Encrypted pod-to-pod communication via Istio
- ✅ All resources include environment_suffix
- ✅ All resources are fully destroyable

## Troubleshooting

### Cluster Not Accessible

```bash
aws eks describe-cluster --name eks-<environment-suffix> --region eu-central-1
```

### Nodes Not Joining Cluster

```bash
kubectl get nodes
aws eks list-nodegroups --cluster-name eks-<environment-suffix> --region eu-central-1
```

### Pod Communication Issues

```bash
kubectl get peerauthentication -n istio-system
kubectl get authorizationpolicies -A
```

### Autoscaler Not Scaling

```bash
kubectl logs -n kube-system -l app.kubernetes.io/name=cluster-autoscaler
```

## Support

For issues or questions:
- Review Terraform plan output
- Check AWS CloudWatch Logs
- Verify IAM permissions
- Check EKS cluster status in AWS Console

## License

This infrastructure code is provided as-is for the e-commerce platform project.
