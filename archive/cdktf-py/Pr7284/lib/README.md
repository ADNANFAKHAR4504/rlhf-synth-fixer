# EKS Microservices Payment Platform - CDKTF Python

This infrastructure code deploys a complete EKS-based microservices platform for payment processing with comprehensive security, compliance, and monitoring features.

## Architecture

### Components

1. **EKS Cluster (v1.28)**
   - OIDC provider enabled for IRSA
   - Control plane logging enabled
   - Deployed across 3 availability zones

2. **Fargate Profiles**
   - Payment namespace profile
   - Fraud-detection namespace profile
   - Reporting namespace profile
   - Kube-system profile (for core addons)

3. **Networking**
   - VPC with CIDR 10.0.0.0/16
   - 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24) for ALB
   - 3 private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24) for pods
   - Internet Gateway for public subnet routing
   - No NAT Gateway (cost optimization with Fargate)

4. **Security**
   - IAM roles for service accounts (IRSA) for each namespace
   - Least-privilege IAM policies per namespace
   - Secrets Manager integration for sensitive configuration
   - Security groups for cluster control plane

5. **Container Registry**
   - ECR repositories for payment, fraud-detection, and reporting services
   - Vulnerability scanning enabled (scan on push)
   - Lifecycle policies retaining last 10 images

6. **Monitoring**
   - CloudWatch Container Insights
   - EKS control plane logs
   - Application log groups per namespace
   - 7-day log retention (cost optimized)

7. **EKS Addons**
   - VPC CNI (v1.15.0)
   - CoreDNS (v1.10.1)
   - kube-proxy (v1.28.2)
   - AWS Load Balancer Controller IAM role configured

## Prerequisites

- Python 3.9+
- CDKTF 0.20+
- AWS CLI v2 configured
- Terraform 1.5+
- kubectl 1.28+

## Resource Naming

All resources include the `environmentSuffix` parameter for uniqueness:
- EKS Cluster: `eks-payment-cluster-{environmentSuffix}`
- VPC: `eks-vpc-{environmentSuffix}`
- ECR Repos: `{service}-service-{environmentSuffix}`
- IAM Roles: `eks-{purpose}-role-{environmentSuffix}`

## Deployment

### 1. Install Dependencies

```bash
# Install Python dependencies
pipenv install

# Install CDKTF providers
cdktf get
```

### 2. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
```

### 3. Deploy Infrastructure

```bash
# Synthesize CDKTF code to Terraform
cdktf synth

# Deploy the stack
cdktf deploy
```

### 4. Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --region us-east-1 \
  --name eks-payment-cluster-${ENVIRONMENT_SUFFIX}

# Verify cluster access
kubectl get nodes
kubectl get fargate-profiles -n kube-system
```

### 5. Install AWS Load Balancer Controller

```bash
# Get the ALB controller role ARN from outputs
ALB_ROLE_ARN=$(cdktf output alb_controller_role_arn)

# Install using Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=eks-payment-cluster-${ENVIRONMENT_SUFFIX} \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=${ALB_ROLE_ARN}
```

### 6. Create Namespaces with Resource Quotas

```bash
# Create payment namespace
kubectl create namespace payment

kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: payment-quota
  namespace: payment
spec:
  hard:
    requests.cpu: "2"
    requests.memory: "4Gi"
    limits.cpu: "2"
    limits.memory: "4Gi"
EOF

# Create fraud-detection namespace
kubectl create namespace fraud-detection

kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: fraud-detection-quota
  namespace: fraud-detection
spec:
  hard:
    requests.cpu: "2"
    requests.memory: "4Gi"
    limits.cpu: "2"
    limits.memory: "4Gi"
EOF

# Create reporting namespace
kubectl create namespace reporting

kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: reporting-quota
  namespace: reporting
spec:
  hard:
    requests.cpu: "2"
    requests.memory: "4Gi"
    limits.cpu: "2"
    limits.memory: "4Gi"
EOF
```

### 7. Create Service Accounts with IRSA

```bash
# Get IRSA role ARNs from outputs
PAYMENT_ROLE_ARN=$(cdktf output irsa_role_arn_payment)
FRAUD_ROLE_ARN=$(cdktf output irsa_role_arn_fraud_detection)
REPORTING_ROLE_ARN=$(cdktf output irsa_role_arn_reporting)

# Create service accounts
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payment-sa
  namespace: payment
  annotations:
    eks.amazonaws.com/role-arn: ${PAYMENT_ROLE_ARN}
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: fraud-detection-sa
  namespace: fraud-detection
  annotations:
    eks.amazonaws.com/role-arn: ${FRAUD_ROLE_ARN}
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: reporting-sa
  namespace: reporting
  annotations:
    eks.amazonaws.com/role-arn: ${REPORTING_ROLE_ARN}
EOF
```

### 8. Install Secrets Store CSI Driver

```bash
# Install CSI driver
helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
helm install csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver \
  --namespace kube-system

# Install AWS provider
kubectl apply -f https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml
```

### 9. Configure Network Policies

```bash
# Example network policy for payment namespace
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: payment-network-policy
  namespace: payment
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: payment
  - from:
    - namespaceSelector:
        matchLabels:
          name: fraud-detection
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: fraud-detection
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
EOF
```

## Verification

### Check Cluster Status

```bash
# Cluster info
kubectl cluster-info

# List nodes (Fargate)
kubectl get nodes

# Check namespaces
kubectl get namespaces

# Check resource quotas
kubectl get resourcequota -A

# Check Fargate profiles
aws eks list-fargate-profiles \
  --cluster-name eks-payment-cluster-${ENVIRONMENT_SUFFIX}
```

### Check ECR Repositories

```bash
# List ECR repositories
aws ecr describe-repositories --query 'repositories[].repositoryUri'

# Check image scanning
aws ecr describe-image-scan-findings \
  --repository-name payment-service-${ENVIRONMENT_SUFFIX} \
  --image-id imageTag=latest
```

### Check Container Insights

```bash
# CloudWatch Logs Insights query
aws logs start-query \
  --log-group-name /aws/containerinsights/eks-payment-cluster-${ENVIRONMENT_SUFFIX}/performance \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string 'fields @timestamp, @message | sort @timestamp desc'
```

## Namespace-Specific IAM Permissions

### Payment Namespace
- DynamoDB: GetItem, PutItem, UpdateItem, Query, Scan
- SQS: SendMessage, ReceiveMessage, DeleteMessage
- SNS: Publish
- Secrets Manager: GetSecretValue, DescribeSecret

### Fraud-Detection Namespace
- SageMaker: InvokeEndpoint
- S3: GetObject, PutObject, ListBucket
- Secrets Manager: GetSecretValue, DescribeSecret

### Reporting Namespace
- S3: GetObject, PutObject, ListBucket
- Athena: StartQueryExecution, GetQueryExecution, GetQueryResults
- Secrets Manager: GetSecretValue, DescribeSecret

## Cost Optimization

- Fargate profiles instead of EC2 nodes (pay per pod)
- No NAT Gateway (cost savings)
- 7-day log retention
- Lifecycle policies for ECR images (retain last 10)
- Aurora Serverless recommended for databases

## Security Best Practices

1. **PCI Compliance**
   - Secrets stored in Secrets Manager
   - Encryption at rest and in transit
   - Network isolation with private subnets
   - IAM least-privilege policies

2. **Container Security**
   - ECR vulnerability scanning enabled
   - Scan on push configured
   - Mutable tags for CI/CD

3. **Network Security**
   - Private subnets for pods
   - Security groups for cluster control plane
   - Network policies for pod-to-pod communication

4. **Access Control**
   - IRSA for pod-level IAM permissions
   - Separate service accounts per namespace
   - OIDC provider for authentication

## Troubleshooting

### Pods Not Scheduling

```bash
# Check Fargate profiles
kubectl get fargate-profiles -A

# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Verify subnet tags
aws ec2 describe-subnets --filters "Name=tag:kubernetes.io/cluster/eks-payment-cluster-${ENVIRONMENT_SUFFIX},Values=shared"
```

### ALB Not Creating

```bash
# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify IAM role
aws iam get-role --role-name eks-alb-controller-role-${ENVIRONMENT_SUFFIX}
```

### IRSA Not Working

```bash
# Verify OIDC provider
aws iam list-open-id-connect-providers

# Check service account annotations
kubectl describe sa <service-account-name> -n <namespace>

# Test AWS credentials in pod
kubectl run test --rm -it --image=amazon/aws-cli --serviceaccount=payment-sa -n payment -- sts get-caller-identity
```

## Cleanup

```bash
# Delete all workloads first
kubectl delete all --all -n payment
kubectl delete all --all -n fraud-detection
kubectl delete all --all -n reporting

# Destroy infrastructure
cdktf destroy
```

## Additional Resources

- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Fargate Pod Configuration](https://docs.aws.amazon.com/eks/latest/userguide/fargate-pod-configuration.html)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Secrets Store CSI Driver](https://secrets-store-csi-driver.sigs.k8s.io/)
- [Container Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights.html)
