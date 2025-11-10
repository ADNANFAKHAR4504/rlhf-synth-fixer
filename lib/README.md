# EKS Cluster for Transaction Processing Platform

This CDK application deploys a production-ready Amazon EKS 1.28 cluster designed for transaction processing workloads in a fintech environment.

## Architecture

### Core Components

1. **EKS Cluster v1.28**
   - OIDC provider enabled for IRSA (IAM Roles for Service Accounts)
   - Control plane logging enabled for all log types
   - Public and private endpoint access
   - VPC spanning 3 availability zones

2. **Managed Node Groups**
   - **Critical Node Group**: 2-4 t3.medium On-Demand instances for system-critical workloads
   - **Workers Node Group**: 3-10 t3.large Spot instances for application workloads
   - Both configured with cluster autoscaler tags

3. **Fargate Profiles**
   - `kube-system` namespace for Kubernetes system components
   - `aws-load-balancer-controller` namespace for ingress management

4. **AWS Load Balancer Controller**
   - Deployed via Helm chart
   - Uses IRSA for AWS API access
   - Manages Application Load Balancers for Kubernetes Ingress resources

5. **Cluster Autoscaler**
   - Automatically scales node groups based on pod scheduling needs
   - Uses IRSA for AWS API access
   - Configured with least-waste expander strategy

6. **Pod Security Standards**
   - Baseline enforcement at namespace level
   - Applied to all application namespaces (payments, processing, monitoring)

### Network Architecture

- **VPC**: 10.0.0.0/16 CIDR across 3 AZs
- **Public Subnets**: For load balancers and NAT gateways
- **Private Subnets**: For EKS worker nodes and Fargate pods
- **NAT Gateways**: 3 (one per AZ) for high availability

### IAM and Security

- Separate IAM roles for cluster, node groups, and Fargate
- IRSA implementation for pod-level AWS permissions
- Systems Manager integration for node access (no SSH required)
- Security groups automatically configured by EKS

## Prerequisites

- AWS CLI v2 configured with appropriate credentials
- AWS CDK 2.x installed (`npm install -g aws-cdk`)
- Node.js 20+ and npm 10+
- kubectl 1.28+ installed
- Sufficient AWS service quotas for EKS, VPC, and EC2

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="prod"
export CDK_DEFAULT_REGION="us-east-1"
export CDK_DEFAULT_ACCOUNT="your-account-id"
```

### 3. Bootstrap CDK (first time only)

```bash
npm run cdk:bootstrap
```

### 4. Synthesize CloudFormation Template

```bash
npm run cdk:synth
```

### 5. Deploy the Stack

```bash
npm run cdk:deploy
```

Deployment takes approximately 15-20 minutes.

### 6. Configure kubectl

After deployment, configure kubectl to access your cluster:

```bash
aws eks update-kubeconfig --region us-east-1 --name transaction-processing-prod
```

### 7. Verify Deployment

```bash
# Check cluster status
kubectl cluster-info

# Check nodes
kubectl get nodes

# Check namespaces
kubectl get namespaces

# Check cluster autoscaler
kubectl get deployment cluster-autoscaler -n kube-system

# Check AWS Load Balancer Controller
kubectl get deployment aws-load-balancer-controller -n kube-system
```

## Configuration

### Environment Suffix

The `environmentSuffix` context variable is used to create unique resource names:

```bash
# Development
cdk deploy --context environmentSuffix=dev

# Staging
cdk deploy --context environmentSuffix=staging

# Production
cdk deploy --context environmentSuffix=prod
```

### Scaling Configuration

Node groups auto-scale based on pod demands:

- **Critical**: 2-4 instances (On-Demand)
- **Workers**: 3-10 instances (Spot)

To adjust scaling limits, modify the `minSize` and `maxSize` parameters in `lib/tap-stack.ts`.

### Cost Optimization

- Spot instances used for non-critical workloads (60-90% cost savings)
- Fargate only for system workloads to avoid over-provisioning
- Cluster autoscaler removes unused capacity
- NAT Gateways: Consider VPC endpoints for AWS services to reduce data transfer costs

## Application Deployment

### Namespaces

Three application namespaces are pre-configured:

1. **payments**: For payment processing services
2. **processing**: For transaction processing workloads
3. **monitoring**: For observability tools (Prometheus, Grafana, etc.)

Example deployment:

```bash
kubectl apply -f your-app-deployment.yaml -n payments
```

### Using IRSA

To grant AWS permissions to pods:

1. Create an IAM role with required permissions
2. Create a Kubernetes service account
3. Annotate the service account with the IAM role ARN
4. Use the service account in your pod specification

Example:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-sa
  namespace: payments
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/my-app-role
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: payments
spec:
  template:
    spec:
      serviceAccountName: my-app-sa
      containers:
      - name: my-app
        image: my-app:latest
```

### Ingress Configuration

Use Kubernetes Ingress resources with AWS Load Balancer Controller:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: payment-api
  namespace: payments
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: payment-service
            port:
              number: 80
```

## Monitoring and Logging

### Control Plane Logs

All control plane logs are sent to CloudWatch Logs:

- API server logs
- Audit logs
- Authenticator logs
- Controller manager logs
- Scheduler logs

Access logs in CloudWatch Logs under `/aws/eks/transaction-processing-{environmentSuffix}/cluster`.

### Cluster Metrics

Use CloudWatch Container Insights for cluster and pod metrics:

```bash
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml
```

## Cleanup

To destroy all resources:

```bash
npm run cdk:destroy
```

**Warning**: This will delete the entire EKS cluster and all associated resources. Ensure all workloads are backed up before destroying.

## Stack Outputs

After deployment, the following outputs are available:

- `ClusterName`: EKS cluster name
- `ClusterEndpoint`: API server endpoint
- `ClusterArn`: EKS cluster ARN
- `OIDCIssuerURL`: OIDC provider URL for IRSA
- `KubectlConfigCommand`: Command to configure kubectl
- `VpcId`: VPC ID
- `ClusterSecurityGroupId`: Cluster security group ID

Access outputs:

```bash
aws cloudformation describe-stacks --stack-name TapStackprod --query 'Stacks[0].Outputs'
```

## Security Considerations

1. **Network Isolation**: Worker nodes run in private subnets with no direct internet access
2. **IRSA**: Use IAM roles for service accounts instead of node-level permissions
3. **Pod Security Standards**: Baseline enforcement prevents privileged containers
4. **Control Plane Logging**: All API and audit events logged for compliance
5. **Systems Manager**: Use SSM Session Manager instead of SSH for node access
6. **Security Groups**: Managed by EKS, follow least privilege principle

## Troubleshooting

### Cluster Autoscaler Not Scaling

Check logs:
```bash
kubectl logs -f deployment/cluster-autoscaler -n kube-system
```

Verify node group tags include:
- `k8s.io/cluster-autoscaler/enabled=true`
- `k8s.io/cluster-autoscaler/<cluster-name>=owned`

### AWS Load Balancer Controller Issues

Check controller logs:
```bash
kubectl logs -f deployment/aws-load-balancer-controller -n kube-system
```

Verify service account has correct IAM role annotation:
```bash
kubectl describe sa aws-load-balancer-controller -n kube-system
```

### Fargate Pods Not Starting

Check Fargate profile configuration:
```bash
aws eks describe-fargate-profile --cluster-name <cluster-name> --fargate-profile-name <profile-name>
```

Ensure pod namespace matches Fargate profile selectors.

### Node Group Scaling Issues

Check Auto Scaling Group status:
```bash
aws autoscaling describe-auto-scaling-groups --query 'AutoScalingGroups[?contains(Tags[?Key==`eks:cluster-name`].Value, `transaction-processing`)]'
```

## References

- [EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)
- [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- [IRSA Documentation](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
