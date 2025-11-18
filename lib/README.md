# Production-Ready EKS Cluster for Payment Processing

This Terraform configuration deploys a production-ready Amazon EKS cluster optimized for payment processing workloads with comprehensive security, high availability, and compliance features.

## Architecture Overview

### Infrastructure Components

- **EKS Cluster**: Kubernetes 1.31 with full control plane logging
- **VPC**: Dedicated VPC (10.0.0.0/16) with DNS support
- **Subnets**: 2 public and 2 private subnets across 2 availability zones
- **NAT Gateway**: Single NAT Gateway for cost optimization
- **Security**: KMS encryption, VPC Flow Logs, secure security groups
- **IAM**: Least-privilege roles for cluster and node groups
- **Node Group**: Managed node group with 2-4 t3.medium instances

### Security Features

1. **Encryption**:
   - KMS encryption for EKS secrets at rest
   - Automatic key rotation enabled
   - All traffic encrypted in transit

2. **Logging**:
   - All EKS control plane logs enabled (api, audit, authenticator, controller manager, scheduler)
   - VPC Flow Logs for network monitoring
   - CloudWatch log retention: 7 days

3. **Network Security**:
   - Private subnets for node groups
   - Security groups with minimal required access
   - Node-to-node and cluster-to-node communication secured

4. **IAM Security**:
   - Least-privilege IAM roles
   - Managed AWS policies attached
   - Service-specific assume role policies

### High Availability

- Multi-AZ deployment (2 availability zones)
- Managed node group with auto-scaling (2-4 nodes)
- Redundant public and private subnets
- Private endpoint access for enhanced security
- Public endpoint access for CI/CD

## Prerequisites

- Terraform >= 1.4.0
- AWS CLI configured with appropriate credentials
- kubectl (for cluster access after deployment)
- Appropriate AWS permissions to create:
  - EKS clusters
  - VPC and networking resources
  - IAM roles and policies
  - KMS keys
  - CloudWatch log groups

## Deployment

### 1. Initialize Terraform

```bash
cd lib
terraform init
```

### 2. Review Configuration

```bash
terraform plan -var="environment_suffix=your-suffix"
```

### 3. Deploy Infrastructure

```bash
terraform apply -var="environment_suffix=your-suffix"
```

The deployment will create:
- 1 VPC with Internet Gateway
- 4 Subnets (2 public, 2 private)
- 1 NAT Gateway with Elastic IP
- Route tables for public and private subnets
- VPC Flow Logs with CloudWatch integration
- 2 Security Groups (cluster and nodes)
- 3 IAM Roles (VPC Flow Logs, EKS Cluster, Node Group)
- 1 KMS Key with alias
- 1 EKS Cluster
- 1 Managed Node Group
- 2 CloudWatch Log Groups

### 4. Configure kubectl

After deployment completes, configure kubectl to access the cluster:

```bash
aws eks update-kubeconfig --region us-east-1 --name payment-eks-your-suffix
```

Or use the output command:

```bash
terraform output -raw kubeconfig_command | bash
```

### 5. Verify Deployment

```bash
kubectl get nodes
kubectl get pods -A
```

## Outputs

The deployment provides the following outputs:

| Output | Description |
|--------|-------------|
| cluster_id | EKS cluster ID |
| cluster_name | EKS cluster name |
| cluster_endpoint | EKS API endpoint URL |
| cluster_version | Kubernetes version |
| cluster_iam_role_arn | IAM role ARN for the cluster |
| cluster_security_group_id | Security group ID for cluster |
| node_group_id | Node group ID |
| node_group_arn | Node group ARN |
| node_group_status | Current status of node group |
| node_security_group_id | Security group ID for nodes |
| vpc_id | VPC ID |
| vpc_cidr_block | VPC CIDR block |
| public_subnet_ids | List of public subnet IDs |
| private_subnet_ids | List of private subnet IDs |
| nat_gateway_id | NAT Gateway ID |
| kms_key_id | KMS key ID |
| kms_key_arn | KMS key ARN |
| cloudwatch_log_group_name | EKS log group name |
| vpc_flow_log_group_name | VPC Flow Logs group name |
| kubeconfig_command | Command to configure kubectl |

## Configuration Variables

| Variable | Description | Default |
|----------|-------------|---------|
| aws_region | AWS region for deployment | us-east-1 |
| environment_suffix | Unique suffix for resource naming | dev |
| repository | Repository name for tagging | unknown |
| commit_author | Commit author for tagging | unknown |
| pr_number | PR number for tagging | unknown |
| team | Team name for tagging | unknown |

## Resource Naming Convention

All resources follow the naming pattern: `{resource-name}-${var.environment_suffix}`

Examples:
- EKS Cluster: `payment-eks-${environment_suffix}`
- VPC: `payment-vpc-${environment_suffix}`
- Security Groups: `payment-eks-cluster-sg-${environment_suffix}`
- IAM Roles: `payment-eks-cluster-role-${environment_suffix}`

## Testing

### Unit Tests

Run unit tests to validate configuration:

```bash
npm test test/terraform.unit.test.ts
```

Unit tests verify:
- File structure and presence
- Variable declarations
- Resource naming conventions
- Security configurations
- IAM policies
- Lifecycle policies

### Integration Tests

After deployment, run integration tests:

```bash
npm test test/terraform.int.test.ts
```

Integration tests validate:
- Deployed resource IDs and ARNs
- Network configuration
- Security settings
- High availability setup
- Output completeness

## Cost Optimization

This configuration is optimized for cost while maintaining production readiness:

1. **Single NAT Gateway**: One NAT Gateway instead of per-AZ for cost savings
2. **t3.medium Instances**: Right-sized for most payment processing workloads
3. **7-Day Log Retention**: Balance between auditability and cost
4. **Managed Node Groups**: Reduced operational overhead

Estimated monthly cost: ~$300-400 (varies by usage and region)

## Compliance Considerations

### PCI-DSS Compliance

This infrastructure supports PCI-DSS compliance through:
- Encryption at rest (KMS)
- Encryption in transit (TLS/SSL)
- Network isolation (private subnets)
- Comprehensive logging (CloudWatch)
- Access controls (IAM)

### Additional Steps Required

For full PCI-DSS compliance, you must also:
1. Implement application-level security controls
2. Configure runtime security monitoring
3. Set up log aggregation and alerting
4. Implement regular security assessments
5. Establish incident response procedures

## Cleanup

To destroy all resources:

```bash
terraform destroy -var="environment_suffix=your-suffix"
```

Note: All resources are fully destroyable with no deletion protection enabled.

## Troubleshooting

### Node Group Not Joining Cluster

If nodes don't join the cluster:
1. Verify IAM role policies are attached
2. Check security group rules allow cluster-to-node communication
3. Ensure subnets have proper EKS tags
4. Review CloudWatch logs for errors

### kubectl Connection Issues

If kubectl can't connect:
1. Verify cluster endpoint is accessible
2. Update kubeconfig: `aws eks update-kubeconfig --region us-east-1 --name <cluster-name>`
3. Check AWS credentials are valid
4. Ensure public endpoint access is enabled

### Deployment Timeouts

EKS cluster creation takes 10-15 minutes. Node group creation takes 5-10 minutes. If deployment times out:
1. Check AWS service health dashboard
2. Verify you're not hitting AWS service quotas
3. Review CloudFormation events (EKS uses CFN internally)

## Monitoring and Observability

### CloudWatch Logs

Access EKS control plane logs:
```bash
aws logs tail /aws/eks/payment-eks-${environment_suffix}/cluster --follow
```

Access VPC Flow Logs:
```bash
aws logs tail /aws/vpc/payment-flow-logs-${environment_suffix} --follow
```

### Cluster Metrics

View cluster metrics in CloudWatch:
- Namespace: AWS/EKS
- Dimensions: ClusterName

### Node Metrics

View node metrics through CloudWatch Container Insights (requires additional setup).

## Security Best Practices

1. **Rotate KMS Keys**: Enable automatic key rotation (already configured)
2. **Regular Updates**: Keep Kubernetes version updated
3. **Network Policies**: Implement Kubernetes network policies for pod-to-pod security
4. **RBAC**: Configure Kubernetes RBAC for user access control
5. **Pod Security**: Implement Pod Security Standards
6. **Secrets Management**: Use AWS Secrets Manager or External Secrets Operator
7. **Image Scanning**: Scan container images before deployment

## Support

For issues or questions:
1. Check CloudWatch logs for error messages
2. Review AWS EKS documentation
3. Consult Terraform AWS provider documentation
4. Contact your cloud operations team

## License

This infrastructure code is provided as-is for deployment of payment processing infrastructure.
