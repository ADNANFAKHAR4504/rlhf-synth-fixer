# Task: Production-Ready EKS Cluster for Containerized Microservices

## Platform and Language

**MANDATORY**: Use **Terraform with HCL** for this implementation.

## Background

Your company operates a microservices-based e-commerce platform that requires modernization. The current monolithic deployment cannot handle peak shopping seasons, and the development team needs isolated environments for testing new features without affecting production stability.

## Problem Statement

Create a Terraform configuration to deploy a production-ready EKS cluster for containerized microservices.

## MANDATORY REQUIREMENTS (Must complete)

1. **Deploy EKS cluster version 1.28 with OIDC provider enabled** (CORE: EKS)
   - Use Amazon EKS 1.28
   - Enable OIDC provider for IRSA (IAM Roles for Service Accounts)
   - Configure cluster endpoint access appropriately

2. **Create 3 managed node groups with specific instance types**
   - Frontend node group: t3.large instances
   - Backend node group: m5.xlarge instances
   - Data-processing node group: c5.2xlarge instances

3. **Configure Fargate profiles for system workloads** (CORE: Fargate)
   - Deploy coredns on Fargate
   - Deploy aws-load-balancer-controller on Fargate

4. **Implement IRSA roles for pod-level AWS service access**
   - Create IAM roles that can be assumed by Kubernetes service accounts
   - Implement proper trust relationships and permissions

5. **Deploy ALB ingress controller using Helm provider**
   - Use Terraform Helm provider
   - Configure AWS Load Balancer Controller
   - Set up proper IRSA permissions

6. **Configure cluster autoscaler with min 2, max 10 nodes per group**
   - Each node group should have minimum 2 nodes
   - Maximum 10 nodes per group
   - Configure autoscaling policies

7. **Enable EKS add-ons with latest versions**
   - vpc-cni addon
   - kube-proxy addon
   - coredns addon

8. **Set up CloudWatch Container Insights for monitoring**
   - Enable Container Insights on the EKS cluster
   - Configure appropriate CloudWatch log groups
   - Set up metrics collection

## OPTIONAL ENHANCEMENTS (If time permits)

- **Deploy Istio service mesh for mTLS encryption** (OPTIONAL: Service Mesh)
  - Enhances security with mutual TLS between services

- **Add AWS GuardDuty for EKS threat detection** (OPTIONAL: GuardDuty)
  - Note: GuardDuty is an account-level service - only enable if not already configured
  - Improves security monitoring

- **Implement Karpenter for advanced autoscaling** (OPTIONAL: Karpenter)
  - Alternative to cluster autoscaler for cost optimization
  - More efficient node provisioning

## Constraints

1. All container images must be scanned for vulnerabilities before deployment
2. Pod-to-pod communication must be encrypted using service mesh
3. Cluster autoscaling must respond within 90 seconds to load changes
4. Each microservice must have dedicated node groups with specific instance types
5. Secrets must be stored in AWS Secrets Manager and injected at runtime
6. Network policies must enforce zero-trust communication between namespaces

## Environment Details

**Region**: ap-southeast-1

**Infrastructure Requirements**:

- Production EKS cluster deployed across 3 availability zones
- Dedicated VPC using 10.0.0.0/16 CIDR
- Private subnets for worker nodes with NAT gateways for outbound traffic
- Public subnets for load balancers
- Container images stored in ECR with vulnerability scanning enabled

**Tool Requirements**:

- Terraform 1.5+
- kubectl 1.28+
- AWS CLI v2 configured with appropriate permissions

**Core Services**:

- EKS 1.28 with managed node groups
- ALB ingress controller
- Istio service mesh (optional)

## Critical Implementation Notes

### Resource Naming Convention

ALL named resources MUST include the `environment_suffix` variable:

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource isolation"
  type        = string
}

# Example resource naming
resource "aws_eks_cluster" "main" {
  name = "eks-cluster-${var.environment_suffix}"
  # ...
}
```

### Destroyability Requirements

- NO retention policies that prevent resource deletion
- NO deletion protection enabled on resources
- S3 buckets must be configured to allow deletion
- RDS instances (if any) must have `skip_final_snapshot = true`

### AWS Region

Deploy all resources in **ap-southeast-1** region.

### GuardDuty Warning

If implementing GuardDuty (optional enhancement):

- GuardDuty allows only ONE detector per AWS account/region
- Check if detector already exists before creating
- Document manual setup if needed

### Security Best Practices

- Enable encryption at rest for all data stores
- Use KMS encryption where applicable
- Implement least-privilege IAM policies
- Enable VPC Flow Logs for network monitoring
- Use AWS Secrets Manager for sensitive data

### Cost Optimization

- Use appropriate instance sizes (as specified in requirements)
- Consider Spot instances where appropriate (not for critical workloads)
- Configure autoscaling to prevent over-provisioning
- Use VPC endpoints to avoid NAT Gateway charges where possible

## Expected Outputs

Your Terraform configuration should output:

1. EKS cluster endpoint
2. EKS cluster name
3. OIDC issuer URL
4. Node group ARNs
5. kubectl configuration command
6. ALB controller service account ARN

## Success Criteria

1. EKS cluster is successfully provisioned with version 1.28
2. All 3 managed node groups are created with correct instance types
3. Fargate profiles are configured for system workloads
4. IRSA is properly configured and functional
5. ALB controller is deployed and operational
6. Cluster autoscaler is configured correctly
7. All EKS add-ons are installed with latest versions
8. CloudWatch Container Insights is enabled and collecting metrics
9. Infrastructure passes `terraform validate` and `terraform plan`
10. All resources are properly tagged and named with environment_suffix

## Testing Approach

After deployment:

1. Verify cluster is accessible via kubectl
2. Check that all node groups are healthy
3. Verify Fargate profiles are active
4. Test IRSA by deploying a sample pod with AWS permissions
5. Deploy a test application with ALB ingress
6. Verify autoscaling by simulating load
7. Check CloudWatch metrics are being collected
8. Validate encryption and security configurations
