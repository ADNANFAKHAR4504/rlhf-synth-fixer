# EKS Fargate Cluster - Trading Platform

Production-ready EKS cluster infrastructure using only Fargate compute profiles for containerized trading platform workloads.

## Architecture

This Terraform configuration deploys:

- **VPC**: Custom VPC with DNS support and hostnames enabled
- **Subnets**: 2 public and 2 private subnets across 2 availability zones
- **NAT Gateways**: One per availability zone for private subnet internet access
- **EKS Cluster**: Production-ready cluster with logging enabled
- **Fargate Profiles**: Separate profiles for kube-system and application workloads
- **IAM Roles**: Least-privilege roles for cluster and pod execution
- **Security Groups**: Properly configured for pod-to-control-plane communication

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- kubectl (for post-deployment configuration)

## Deployment

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Review the Plan

```bash
terraform plan -var="environmentSuffix=prod-001"
```

### 3. Deploy Infrastructure

```bash
terraform apply -var="environmentSuffix=prod-001"
```

### 4. Configure kubectl

```bash
aws eks update-kubeconfig --name eks-cluster-prod-001 --region us-east-1
```

### 5. Verify Cluster

```bash
kubectl get nodes
kubectl get pods -n kube-system
```

## Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| environmentSuffix | Unique suffix for resource names | - | Yes |
| region | AWS region | us-east-1 | No |
| vpc_cidr | VPC CIDR block | 10.0.0.0/16 | No |
| cluster_version | Kubernetes version | 1.28 | No |
| app_namespace | Application namespace | trading-app | No |
| tags | Common resource tags | See variables.tf | No |

## Outputs

- `cluster_endpoint`: EKS cluster API endpoint
- `cluster_name`: EKS cluster name
- `vpc_id`: VPC identifier
- `private_subnet_ids`: Private subnet identifiers
- `fargate_profile_*_id`: Fargate profile identifiers

## Post-Deployment

### Create Application Namespace

```bash
kubectl create namespace trading-app
```

### Deploy Sample Application

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: trading-app-test
  namespace: trading-app
spec:
  containers:
  - name: app
    image: nginx:latest
    ports:
    - containerPort: 80
EOF
```

### Verify Pod is Running on Fargate

```bash
kubectl get pod trading-app-test -n trading-app -o wide
```

## Important Notes

### Fargate-Only Cluster

This cluster uses ONLY Fargate compute profiles. There are no EC2 node groups. All pods will run on Fargate.

### CoreDNS on Fargate

After cluster creation, you may need to patch CoreDNS to run on Fargate:

```bash
kubectl patch deployment coredns \
  -n kube-system \
  --type json \
  -p='[{"op": "remove", "path": "/spec/template/metadata/annotations/eks.amazonaws.com~1compute-type"}]'
```

### Namespace Selectors

Fargate profiles are configured for:
- `kube-system` namespace (system pods)
- `trading-app` namespace (application workloads)
- `default` namespace (for testing)

To run pods in other namespaces, create additional Fargate profiles.

### Cost Considerations

Fargate pricing is based on vCPU and memory resources allocated to pods. Monitor your usage to optimize costs.

## Cleanup

To destroy all resources:

```bash
terraform destroy -var="environmentSuffix=prod-001"
```

Note: Ensure no workloads are running before destroying the cluster.

## Security

- All IAM roles follow the principle of least privilege
- Cluster logging is enabled for audit purposes
- Private subnets are used for pod networking
- Security groups restrict traffic appropriately

## Troubleshooting

### Pods Not Scheduling

If pods aren't scheduling, verify:
1. The namespace has a matching Fargate profile
2. CoreDNS patch was applied successfully
3. Fargate pod execution role has correct permissions

### CoreDNS Issues

If CoreDNS pods are pending:
```bash
kubectl patch deployment coredns \
  -n kube-system \
  --type json \
  -p='[{"op": "remove", "path": "/spec/template/metadata/annotations/eks.amazonaws.com~1compute-type"}]'
```

## Support

For issues or questions, refer to:
- [EKS Documentation](https://docs.aws.amazon.com/eks/)
- [EKS Fargate Documentation](https://docs.aws.amazon.com/eks/latest/userguide/fargate.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
