# Production-Ready EKS Cluster for Microservices

This Terraform configuration deploys a complete production-ready Amazon EKS cluster designed for containerized microservices workloads.

## Overview

This infrastructure code provisions a highly available, scalable, and secure EKS 1.28 cluster with the following capabilities:

- Multi-AZ deployment across 3 availability zones in ap-southeast-1
- Dedicated node groups for different workload types
- Fargate profiles for system workloads
- IAM Roles for Service Accounts (IRSA) for secure pod-level AWS access
- AWS Load Balancer Controller for ingress management
- Cluster Autoscaler for dynamic scaling
- CloudWatch Container Insights for comprehensive monitoring
- ECR integration with vulnerability scanning
- Secrets Manager integration for secure secret management
- VPC endpoints for enhanced security and cost optimization

## Architecture

### Network Architecture

- VPC: 10.0.0.0/16
- 3 Public Subnets: For load balancers and NAT gateways
- 3 Private Subnets: For EKS worker nodes and Fargate pods
- 3 NAT Gateways: One per AZ for high availability
- VPC Endpoints: S3, ECR, EC2, CloudWatch Logs, STS

### EKS Cluster

- Version: 1.28
- Control Plane: Managed by AWS
- OIDC Provider: Enabled for IRSA
- Encryption: Secrets encrypted with KMS
- Logging: All control plane logs enabled

### Node Groups

1. Frontend Node Group
   - Instance Type: t3.large
   - Scaling: Min 2, Max 10, Desired 2
   - Purpose: Frontend microservices

2. Backend Node Group
   - Instance Type: m5.xlarge
   - Scaling: Min 2, Max 10, Desired 2
   - Purpose: Backend API services

3. Data Processing Node Group
   - Instance Type: c5.2xlarge
   - Scaling: Min 2, Max 10, Desired 2
   - Purpose: Data-intensive workloads

### Fargate Profiles

1. CoreDNS Profile
   - Namespace: kube-system
   - Selector: k8s-app=kube-dns

2. ALB Controller Profile
   - Namespace: kube-system
   - Selector: app.kubernetes.io/name=aws-load-balancer-controller

## Prerequisites

### Tools Required

- Terraform >= 1.5.0
- AWS CLI v2
- kubectl >= 1.28
- Go >= 1.21 (for tests)

### AWS Permissions

The AWS credentials used must have permissions for:

- EKS cluster management
- VPC and networking resources
- IAM roles and policies
- ECR repositories
- CloudWatch logs and metrics
- Secrets Manager
- KMS keys

## Quick Start

### 1. Clone and Configure

```bash
cd lib
cp terraform.tfvars.example terraform.tfvars
```

Edit terraform.tfvars:

```hcl
environment_suffix = "prod"
aws_region = "ap-southeast-1"
cluster_version = "1.28"
```

### 2. Deploy Infrastructure

```bash
terraform init
terraform plan
terraform apply
```

Deployment time: ~20-30 minutes

### 3. Configure kubectl

```bash
aws eks update-kubeconfig --region ap-southeast-1 --name eks-cluster-prod
kubectl get nodes
```

### 4. Verify Components

```bash
# Check nodes
kubectl get nodes -o wide

# Check Fargate pods
kubectl get pods -n kube-system -o wide

# Check ALB controller
kubectl get deployment -n kube-system aws-load-balancer-controller

# Check cluster autoscaler
kubectl get deployment -n kube-system cluster-autoscaler

# Check Container Insights
kubectl get daemonset -n amazon-cloudwatch
```

## Configuration Variables

### Required Variables

- `environment_suffix`: Unique suffix for resource naming (e.g., "prod", "dev")

### Optional Variables

- `aws_region`: AWS region (default: "ap-southeast-1")
- `vpc_cidr`: VPC CIDR block (default: "10.0.0.0/16")
- `cluster_version`: Kubernetes version (default: "1.28")
- `cluster_name`: Base cluster name (default: "eks-cluster")
- `frontend_instance_type`: Frontend node instance type (default: "t3.large")
- `backend_instance_type`: Backend node instance type (default: "m5.xlarge")
- `data_processing_instance_type`: Data processing instance type (default: "c5.2xlarge")
- `node_group_min_size`: Minimum nodes per group (default: 2)
- `node_group_max_size`: Maximum nodes per group (default: 10)
- `node_group_desired_size`: Desired nodes per group (default: 2)
- `enable_container_insights`: Enable CloudWatch Container Insights (default: true)
- `enable_guardduty`: Enable GuardDuty EKS protection (default: false)

## Outputs

After deployment, Terraform provides these outputs:

- `cluster_endpoint`: EKS cluster API endpoint
- `cluster_name`: Full EKS cluster name
- `oidc_provider_arn`: OIDC provider ARN for IRSA
- `vpc_id`: VPC ID
- `node_group_*_arn`: ARNs for all node groups
- `fargate_profile_*_id`: IDs for Fargate profiles
- `alb_controller_role_arn`: IAM role ARN for ALB controller
- `cluster_autoscaler_role_arn`: IAM role ARN for cluster autoscaler
- `ecr_repository_url`: ECR repository URL for container images
- `kubectl_config_command`: Command to configure kubectl

## Deploying Applications

### Example: Deploy a Sample Application

1. Create a deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sample-app
  template:
    metadata:
      labels:
        app: sample-app
    spec:
      nodeSelector:
        role: frontend
      containers:
        - name: app
          image: <ecr_repository_url>:latest
          ports:
            - containerPort: 8080
```

2. Create a service with ALB ingress:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: sample-app
spec:
  type: NodePort
  selector:
    app: sample-app
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sample-app
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: sample-app
                port:
                  number: 80
```

### Using Secrets Manager

1. Create a SecretProviderClass:

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: app-secrets
spec:
  provider: aws
  parameters:
    objects: |
      - objectName: "eks-app-secrets-<suffix>"
        objectType: "secretsmanager"
```

2. Mount in pod:

```yaml
volumes:
  - name: secrets-store
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: 'app-secrets'
```

## Monitoring

### CloudWatch Container Insights

Access metrics in AWS Console:

1. Navigate to CloudWatch > Container Insights
2. Select your EKS cluster
3. View metrics: CPU, Memory, Network, Disk

### CloudWatch Alarms

Pre-configured alarms:

- High CPU utilization (>80%)
- High memory utilization (>80%)

### VPC Flow Logs

VPC Flow Logs are enabled for network traffic analysis.

## Security Best Practices

### Implemented Security Features

1. Encryption at rest using KMS for:
   - EKS secrets
   - ECR images
   - EBS volumes

2. Network Security:
   - Private subnets for worker nodes
   - Security groups with least privilege
   - VPC endpoints to avoid internet traffic
   - Network policies for pod-to-pod communication

3. IAM Security:
   - IRSA for pod-level permissions
   - Least privilege IAM policies
   - IMDSv2 enforced on EC2 instances

4. Image Security:
   - ECR vulnerability scanning on push
   - Lifecycle policies to remove old images

5. Secrets Management:
   - Secrets stored in AWS Secrets Manager
   - Secrets Manager CSI driver for pod injection

### Network Policies

Default network policies are configured via ConfigMap for:

- Default deny all ingress/egress
- Allow DNS queries
- Allow same-namespace communication

Apply additional policies as needed for your workloads.

## Autoscaling

### Cluster Autoscaler

The Cluster Autoscaler is configured to:

- Scale up when pods are unschedulable
- Scale down after 90 seconds of low utilization
- Respect min/max node counts
- Balance across similar node groups

### Horizontal Pod Autoscaler

To use HPA with your applications:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sample-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sample-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Cost Optimization

### Implemented Optimizations

1. VPC Endpoints: Reduce NAT Gateway data transfer costs
2. Cluster Autoscaler: Scale down unused nodes
3. Fargate for system workloads: Pay only for used resources
4. EBS GP3 volumes: Better price/performance ratio
5. ECR lifecycle policies: Remove old unused images

### Additional Recommendations

1. Use Spot instances for non-critical workloads
2. Implement pod resource requests/limits
3. Use Karpenter for more efficient autoscaling (optional enhancement)
4. Monitor costs with AWS Cost Explorer
5. Tag all resources for cost allocation

## Troubleshooting

### Common Issues

1. Nodes not joining cluster:
   - Check node security group rules
   - Verify IAM role permissions
   - Check VPC DNS settings

2. Pods not scheduling:
   - Check node selectors and taints
   - Verify resource requests
   - Check cluster autoscaler logs

3. ALB not creating:
   - Verify ALB controller logs
   - Check subnet tags
   - Verify IAM permissions

4. Fargate pods not starting:
   - Check Fargate profile selectors
   - Verify subnet configuration
   - Check pod execution role

### Debugging Commands

```bash
# Check cluster status
aws eks describe-cluster --name <cluster-name> --region ap-southeast-1

# Check node groups
aws eks list-nodegroups --cluster-name <cluster-name> --region ap-southeast-1

# Check pod logs
kubectl logs -n kube-system <pod-name>

# Check events
kubectl get events -A --sort-by='.lastTimestamp'

# Check cluster autoscaler logs
kubectl logs -n kube-system deployment/cluster-autoscaler

# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

## Testing

Comprehensive integration tests are provided in the `test/` directory using Terratest.

Run tests:

```bash
cd test
go mod download
go test -v -timeout 90m
```

Tests validate:

- EKS cluster deployment
- Node group creation and scaling
- Fargate profile configuration
- IRSA role creation
- Add-on deployment
- Monitoring setup
- Security configuration

## Maintenance

### Upgrading EKS Version

1. Update cluster version:

   ```hcl
   cluster_version = "1.29"
   ```

2. Apply changes:

   ```bash
   terraform apply
   ```

3. Update node groups (rolling update):
   ```bash
   # Terraform will handle this automatically
   ```

### Updating Add-ons

Add-on versions are automatically set to latest. To update:

```bash
terraform apply
```

### Backup and Recovery

1. Backup strategy:
   - EKS cluster configuration: Terraform state
   - Application data: Use Velero or similar
   - Secrets: Backed up in Secrets Manager

2. Disaster recovery:
   - Redeploy infrastructure: `terraform apply`
   - Restore application state from backups

## Cleanup

To destroy all resources:

```bash
# Remove all Kubernetes resources first
kubectl delete ingress --all -A
kubectl delete service --all -A --ignore-not-found

# Destroy infrastructure
terraform destroy
```

Note: Ensure all LoadBalancers and persistent volumes are deleted before destroying infrastructure.

## Support and Documentation

- AWS EKS Documentation: https://docs.aws.amazon.com/eks/
- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/
- Kubernetes Documentation: https://kubernetes.io/docs/
- AWS Load Balancer Controller: https://kubernetes-sigs.github.io/aws-load-balancer-controller/

## License

This infrastructure code is provided as-is for the e-commerce platform modernization project.
