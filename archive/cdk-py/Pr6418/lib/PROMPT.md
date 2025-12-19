# EKS Cluster for Payment Processing Platform

Hey team,

We need to build a robust Kubernetes infrastructure for our fintech client's payment processing platform. They're moving from a legacy system to a microservices architecture and need an enterprise-grade EKS cluster that can handle both standard workloads and GPU-intensive fraud detection models. The infrastructure needs to be secure, scalable, and integrate seamlessly with their existing AWS ecosystem.

The client has strict security requirements typical of financial services. They need private cluster access, encrypted secrets at rest, pod-level IAM permissions, and comprehensive audit logging. They're also running CI/CD pipelines through GitHub Actions that need secure access to the cluster. The platform will handle sensitive payment data, so we can't cut corners on security or compliance.

What makes this interesting is the mixed workload requirements. Most services run on standard compute instances, but their ML-based fraud detection system needs GPU instances. The cluster needs to autoscale efficiently across different node types while maintaining cost efficiency. They also want observability built in from day one so their ops team can monitor cluster health and troubleshoot issues quickly.

## What we need to build

Create a production-ready EKS cluster using **CDK with Python** for a payment processing platform that supports both CPU and GPU workloads.

### Core Infrastructure

1. **EKS Cluster Configuration**
   - Kubernetes version 1.28 or higher with IPv6 support enabled
   - Deploy across exactly 3 availability zones for high availability
   - Private endpoint access only for control plane security
   - Audit logging enabled and sent to CloudWatch

2. **Node Groups**
   - 2 general-purpose node groups using t3.large instances (min: 2, max: 10, desired: 4 nodes each)
   - 1 memory-optimized node group using r5.xlarge instances (min: 1, max: 5, desired: 2 nodes)
   - 1 GPU-enabled node group using g4dn.xlarge instances (min: 1, max: 3, desired: 1 node)
   - All node groups must use Bottlerocket AMI for enhanced security
   - SSM agent must be pre-installed on all nodes

### Security and IAM

3. **IAM Roles for Service Accounts (IRSA)**
   - Enable IRSA for pod-level permissions
   - Create service accounts: cluster-autoscaler, aws-load-balancer-controller, external-secrets-operator
   - Each service account needs appropriate IAM policy attachments

4. **Encryption and Secrets**
   - Configure AWS KMS encryption for envelope encryption of Kubernetes secrets
   - Enable automatic key rotation for KMS keys
   - Use existing secrets from AWS Secrets Manager (do not create new secrets in stack)

5. **Authentication and Security Standards**
   - Configure OIDC identity provider for GitHub Actions integration
   - Implement pod security standards with restricted baseline
   - Follow principle of least privilege for all IAM roles

### Networking

6. **VPC Configuration**
   - VPC spanning 3 availability zones
   - Private subnets for worker nodes
   - Public subnets for load balancers
   - Proper subnet tagging for EKS and load balancer discovery

7. **Load Balancing**
   - Install AWS Load Balancer Controller as a managed EKS add-on
   - Configure proper IAM permissions for the controller

### Monitoring and Observability

8. **CloudWatch Integration**
   - Enable Container Insights for cluster metrics
   - Configure CloudWatch log retention for 30 days
   - Create dashboards for cluster metrics and node group health

### Automation

9. **Cluster Autoscaler**
   - Implement cluster autoscaler configuration
   - Apply proper node group tags for autoscaler discovery
   - Configure autoscaler to work with multiple node group types

### Technical Requirements

- All infrastructure defined using **CDK with Python**
- Deploy to **ap-southeast-1** region
- Resource names must include **environmentSuffix** for uniqueness across multiple PR environments
- Follow naming convention: `resource-type-{environmentSuffix}`
- Use AWS EKS, VPC, KMS, IAM, CloudWatch, EC2, and Load Balancer services
- All resources must be fully destroyable (no Retain policies)
- Enable encryption at rest and in transit where applicable
- Include proper error handling and validation

### Constraints

- Private cluster access only (no public endpoint)
- All node groups must use Bottlerocket AMI
- IPv6 support must be enabled on the cluster
- KMS keys must have automatic rotation enabled
- CloudWatch logs must be retained for exactly 30 days
- Infrastructure must integrate with existing AWS Secrets Manager
- Support multiple environment deployments using environmentSuffix parameter

## Success Criteria

- **Functionality**: Complete EKS cluster with all 4 node groups operational and properly configured IRSA
- **Performance**: Cluster autoscaler working across all node group types with proper scaling policies
- **Reliability**: High availability across 3 AZs with private control plane access
- **Security**: KMS encryption enabled, OIDC configured, pod security standards implemented, all IAM following least privilege
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Observability**: Container Insights enabled with custom CloudWatch dashboards
- **Integration**: AWS Load Balancer Controller installed and GitHub Actions OIDC configured
- **Code Quality**: Production-ready Python code, comprehensive tests, complete documentation

## What to deliver

- Complete CDK Python implementation with proper stack structure
- EKS cluster with Kubernetes 1.28+ and IPv6 support
- 4 node groups: 2x t3.large, 1x r5.xlarge, 1x g4dn.xlarge (all using Bottlerocket AMI)
- IRSA configuration with 3 service accounts
- KMS encryption for secrets with automatic rotation
- OIDC provider for GitHub Actions
- VPC with public and private subnets across 3 AZs
- AWS Load Balancer Controller as managed add-on
- Container Insights with CloudWatch dashboards
- Cluster autoscaler configuration
- Comprehensive unit and integration tests
- Documentation with deployment instructions and kubectl configuration commands
- Stack outputs: cluster endpoint, OIDC issuer URL, kubectl config commands
