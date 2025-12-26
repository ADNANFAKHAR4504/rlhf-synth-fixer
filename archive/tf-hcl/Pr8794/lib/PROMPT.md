# Task: Production-Ready EKS Cluster for Containerized Microservices

## Platform and Language

Use Terraform with HCL for this implementation.

## Background

Your company operates a microservices-based e-commerce platform that requires modernization. The current monolithic deployment cannot handle peak shopping seasons, and the development team needs isolated environments for testing new features without affecting production stability.

## Problem Statement

Create a Terraform configuration to deploy a production-ready EKS cluster that connects containerized microservices with proper networking, load balancing, and monitoring integration.

## MANDATORY REQUIREMENTS

1. Deploy EKS cluster version 1.28 with OIDC provider that connects to IAM for pod-level service account authentication
   - Use Amazon EKS 1.28
   - Enable OIDC provider for IRSA integration with IAM roles
   - Configure cluster endpoint access appropriately

2. Create 3 managed node groups with specific instance types
   - Frontend node group: t3.large instances
   - Backend node group: m5.xlarge instances
   - Data-processing node group: c5.2xlarge instances

3. Configure Fargate profiles that connect to EKS for running system workloads
   - Deploy coredns on Fargate
   - Deploy aws-load-balancer-controller on Fargate

4. Implement IRSA roles that allow pods to access AWS services through service account authentication
   - Create IAM roles that can be assumed by Kubernetes service accounts
   - Implement proper trust relationships and permissions

5. Deploy ALB ingress controller using Helm provider that integrates with AWS Load Balancer for routing traffic to pods
   - Use Terraform Helm provider
   - Configure AWS Load Balancer Controller connected to EKS
   - Set up proper IRSA permissions

6. Configure cluster autoscaler with min 2, max 10 nodes per group
   - Each node group should have minimum 2 nodes
   - Maximum 10 nodes per group
   - Configure autoscaling policies

7. Enable EKS add-ons with latest versions
   - vpc-cni addon
   - kube-proxy addon
   - coredns addon

8. Set up CloudWatch Container Insights that connects to EKS for collecting and visualizing container metrics
   - Enable Container Insights on the EKS cluster
   - Configure CloudWatch log groups that receive logs from pods
   - Set up metrics collection

## OPTIONAL ENHANCEMENTS

- Deploy Istio service mesh that connects pods with mTLS encrypted communication channels
  - Enhances security with mutual TLS between services

- Add AWS GuardDuty that integrates with EKS for threat detection and security monitoring
  - Note: GuardDuty is an account-level service - only enable if not already configured
  - Improves security monitoring

- Implement Karpenter that connects to EKS for advanced autoscaling and node provisioning
  - Alternative to cluster autoscaler for cost optimization
  - More efficient node provisioning

## Constraints

1. All container images must be scanned for vulnerabilities before deployment
2. Pod-to-pod communication must be encrypted using service mesh
3. Cluster autoscaling must respond within 90 seconds to load changes
4. Each microservice must have dedicated node groups with specific instance types
5. Secrets must be stored in AWS Secrets Manager that connects to pods for runtime secret injection
6. Network policies must enforce zero-trust communication between namespaces

## Environment Details

Region: ap-southeast-1

Infrastructure Requirements:

- Production EKS cluster deployed across 3 availability zones
- Dedicated VPC using 10.0.0.0/16 CIDR that connects to NAT gateways for private subnet internet access
- Private subnets for worker nodes with NAT gateways for outbound traffic
- Public subnets that connect to ALB for incoming traffic routing
- Container images stored in ECR with vulnerability scanning enabled

Tool Requirements:

- Terraform 1.5+
- kubectl 1.28+
- AWS CLI v2 configured with appropriate permissions

Core Services:

- EKS 1.28 with managed node groups
- ALB ingress controller that routes traffic to services
- Istio service mesh for optional service-to-service communication

## Critical Implementation Notes

### Resource Naming Convention

ALL named resources MUST include the environment_suffix variable for isolation. For example, the EKS cluster name should be "eks-cluster-" plus the environment_suffix value.

### Destroyability Requirements

- NO retention policies that prevent resource deletion
- NO deletion protection enabled on resources
- S3 buckets must be configured to allow deletion
- RDS instances must have skip_final_snapshot = true

### AWS Region

Deploy all resources in ap-southeast-1 region.

### GuardDuty Warning

If implementing GuardDuty:

- GuardDuty allows only ONE detector per AWS account and region
- Check if detector already exists before creating
- Document manual setup if needed

### Security Best Practices

- Enable encryption at rest for all data stores that connect to KMS for key management
- Use KMS encryption where applicable
- Implement least-privilege IAM policies with specific action and resource ARNs
- Enable VPC Flow Logs that send network traffic logs to CloudWatch
- Use AWS Secrets Manager for sensitive data

### Cost Optimization

- Use appropriate instance sizes as specified in requirements
- Consider Spot instances where appropriate but not for critical workloads
- Configure autoscaling to prevent over-provisioning
- Use VPC endpoints that connect services privately to avoid NAT Gateway charges

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
5. ALB controller is deployed and routes traffic to pods correctly
6. Cluster autoscaler responds to load changes
7. All EKS add-ons are installed with latest versions
8. CloudWatch Container Insights collects and displays container metrics
9. Infrastructure passes terraform validate and terraform plan
10. All resources are properly tagged and named with environment_suffix

## Testing Approach

After deployment:

1. Verify cluster is accessible via kubectl
2. Check that all node groups are healthy
3. Verify Fargate profiles are active
4. Test IRSA by deploying a sample pod that accesses S3 through IAM role
5. Deploy a test application that connects through ALB ingress for external access
6. Verify autoscaling by simulating load
7. Check CloudWatch metrics are being collected from the cluster
8. Validate encryption and security configurations
