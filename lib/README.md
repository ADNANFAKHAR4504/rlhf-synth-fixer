# Production EKS Infrastructure for Fintech Payment Processing

This Terraform configuration deploys a production-grade Amazon EKS cluster with enhanced security controls suitable for PCI DSS compliance requirements.

## Architecture Overview

The infrastructure includes:

- **EKS Cluster**: Version 1.28 with private-only API endpoint
- **Worker Nodes**: Bottlerocket AMI on t3.large instances across 3 AZs
- **Autoscaling**: Cluster Autoscaler with IRSA (3-15 nodes based on CPU)
- **Networking**: VPC with private subnets, VPC endpoints for S3/ECR
- **Security**: Pod security groups, network policies, encrypted storage
- **Monitoring**: CloudWatch Container Insights with 30-day retention
- **Controllers**: AWS Load Balancer Controller, EBS CSI Driver

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI v2
- kubectl 1.28+
- Appropriate AWS credentials with EKS permissions

## Deployment

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Set Required Variables

Create a `terraform.tfvars` file:

```hcl
environment_suffix = "prod-001"
aws_region         = "us-east-2"
cluster_version    = "1.28"
node_instance_type = "t3.large"
node_min_size      = 3
node_max_size      = 15
node_desired_size  = 3
```

### 3. Plan Deployment

```bash
terraform plan -out=tfplan
```

### 4. Apply Configuration

```bash
terraform apply tfplan
```

Deployment takes approximately 15-20 minutes.

### 5. Configure kubectl

After deployment, update your kubeconfig:

```bash
aws eks update-kubeconfig --region us-east-2 --name eks-cluster-<environment-suffix>
```

Verify connectivity:

```bash
kubectl get nodes
kubectl get pods -A
```

## Key Features

### Security

- **Private API Endpoint**: No public internet exposure
- **Bottlerocket OS**: Minimal attack surface, immutable infrastructure
- **IRSA**: IAM roles for service accounts (no node-level credentials)
- **Network Policies**: Pod-to-pod encryption via VPC CNI
- **Encrypted Storage**: All EBS volumes encrypted at rest

### Cost Optimization

- **VPC Endpoints**: S3 and ECR endpoints eliminate NAT Gateway data charges
- **Bottlerocket**: Reduced node resource overhead
- **Cluster Autoscaler**: Scale down during low usage

### High Availability

- **Multi-AZ**: Resources distributed across 3 availability zones
- **Managed Node Groups**: Automated node replacement and updates
- **Load Balancing**: AWS ALB Controller for application traffic

### Monitoring

- **Container Insights**: Cluster and pod-level metrics
- **Control Plane Logs**: API, audit, authenticator logs
- **30-Day Retention**: Compliance-ready log retention

## Production Namespace

A pre-configured `production` namespace is created with:

- **Pod Quota**: Maximum 100 pods
- **Storage Quota**: Maximum 200Gi
- **Resource Limits**: CPU and memory constraints
- **Resource Requests**: Default values for containers

Deploy applications:

```bash
kubectl apply -f your-app.yaml -n production
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will permanently delete the EKS cluster and all associated resources.

## Scaling

The cluster autoscaler automatically scales based on CPU utilization:

- **Minimum**: 3 nodes
- **Maximum**: 15 nodes
- **Trigger**: Pod scheduling failures or CPU pressure

Manual scaling:

```bash
kubectl scale deployment your-app --replicas=10 -n production
```

## Troubleshooting

### Nodes Not Ready

```bash
kubectl get nodes
kubectl describe node <node-name>
```

Check node group status:

```bash
aws eks describe-nodegroup --cluster-name eks-cluster-<suffix> --nodegroup-name bottlerocket-nodes-<suffix>
```

### Pod Scheduling Issues

Check resource quotas:

```bash
kubectl describe resourcequota -n production
kubectl top pods -n production
```

### ALB Controller Issues

Check controller logs:

```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### Cluster Autoscaler Not Scaling

Check autoscaler logs:

```bash
kubectl logs -n kube-system deployment/cluster-autoscaler
```

Verify IAM role:

```bash
kubectl describe sa cluster-autoscaler -n kube-system
```

## Security Compliance

This configuration supports PCI DSS compliance through:

- Private-only API endpoint (no public exposure)
- Encrypted storage (EBS volumes)
- Network segmentation (security groups, network policies)
- Audit logging (control plane logs to CloudWatch)
- IRSA for least-privilege access
- Immutable infrastructure (Bottlerocket)

## Additional Resources

- [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [Bottlerocket Documentation](https://bottlerocket.dev/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)

## Support

For issues or questions, refer to:
- AWS EKS documentation
- Terraform AWS provider documentation
- Kubernetes documentation