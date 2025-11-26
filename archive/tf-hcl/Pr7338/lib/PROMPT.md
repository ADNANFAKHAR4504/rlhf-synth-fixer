# Production EKS Infrastructure for Fintech Payment Processing

Hey team,

We've been tasked with building out the Kubernetes infrastructure for our fintech client's payment processing platform. They're running mission-critical transaction processors in Java and have some Python-based ML services for fraud detection. The big challenge here is that everything needs to meet PCI DSS compliance requirements - no shortcuts on security.

The current setup is causing them headaches with manual scaling, security gaps, and expensive NAT Gateway charges for pulling container images. They need a production-grade EKS environment that's locked down tight with private-only API access, but still flexible enough to handle their variable workload patterns. The platform needs to support both their existing microservices and give them room to grow.

I've been asked to create this infrastructure using **Terraform with HCL** for the us-east-2 region. The business wants a hands-off autoscaling solution that can handle their traffic spikes without intervention, proper monitoring from day one, and security controls that'll pass their compliance audits.

## What we need to build

Create a production-grade Kubernetes infrastructure using **Terraform with HCL** for a fintech payment processing platform. This needs to be enterprise-ready with enhanced security controls suitable for PCI DSS compliance.

### Core Infrastructure Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster version 1.28
   - Private API endpoint only (no public access)
   - Enable OIDC provider for IRSA capability
   - Must include environmentSuffix in cluster name for uniqueness

2. **Worker Node Infrastructure**
   - Managed node group using Bottlerocket AMI
   - Instance type: t3.large
   - Distribute nodes across exactly 3 availability zones
   - Must include environmentSuffix in node group name

3. **Autoscaling Configuration**
   - Deploy cluster autoscaler with IRSA role
   - Scale range: 3 to 15 nodes
   - Scaling trigger: CPU metrics only
   - Proper IAM permissions for autoscaling operations

4. **Ingress and Load Balancing**
   - Install AWS Load Balancer Controller using Helm
   - Configure IRSA permissions for the controller
   - Must support application load balancers

5. **Storage Configuration**
   - Deploy EBS CSI driver addon
   - Enable encryption for all persistent volumes
   - IRSA role for CSI driver operations

6. **Cost Optimization**
   - Create VPC endpoint for S3 (avoid NAT charges)
   - Create VPC endpoint for ECR (image pulls)
   - Both endpoints must avoid public internet routing

7. **Network Security**
   - Configure AWS VPC CNI with network policy support
   - Enable pod security groups
   - Pod-to-pod encryption required

8. **Monitoring and Observability**
   - Enable CloudWatch Container Insights
   - Log retention: 30 days
   - Cluster-level metrics collection

9. **Application Namespace Setup**
   - Create 'production' namespace
   - Resource quota: maximum 100 pods
   - Storage quota: maximum 200Gi
   - Must include environmentSuffix in namespace labels

10. **Outputs and Integration**
    - Cluster endpoint URL
    - OIDC issuer URL
    - Kubeconfig update command

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **EKS** for Kubernetes cluster
- Use **VPC** with 3 private subnets across 3 AZs
- Use **IAM** for service roles and IRSA
- Use **S3** VPC endpoint for cost optimization
- Use **ECR** VPC endpoint for secure image pulls
- Use **CloudWatch** for cluster monitoring
- Use **ELB** via AWS Load Balancer Controller
- Use **EC2** for worker nodes
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-2** region
- Require Terraform 1.5+

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies on any resource)
- Use RemovalPolicy DESTROY or DeletionPolicy Delete for all stateful resources
- FORBIDDEN: Setting any resource with RetainOnDelete or similar retain policies
- EKS cluster must support clean teardown including node groups
- All IAM roles and policies must be removable
- VPC endpoints must be deletable without dependencies
- CloudWatch log groups must allow deletion
- Kubernetes resources (namespaces, quotas) must be removable via Terraform destroy
- Include proper error handling and logging in all configurations

### Security Constraints

- EKS API endpoint: private access only (no public exposure)
- Node groups: Bottlerocket AMI only (enhanced container security)
- Worker nodes: must span exactly 3 availability zones
- Network: pod-to-pod encryption using VPC CNI policies
- Storage: all EBS volumes must use encryption
- IAM: use IRSA for pod-level permissions (no node-level IAM keys)

### Scaling Constraints

- Cluster autoscaler range: minimum 3, maximum 15 nodes
- Scaling metric: CPU utilization only
- No single-AZ deployments allowed
- Node distribution must be balanced across all 3 AZs

## Success Criteria

- Functionality: EKS cluster deploys successfully with all addons and controllers operational
- Security: Private-only API endpoint, encrypted storage, network policies enabled
- Scalability: Autoscaler responds to CPU pressure within cluster-defined bounds
- Cost Efficiency: VPC endpoints eliminate NAT Gateway charges for S3/ECR traffic
- Monitoring: Container Insights operational with 30-day log retention
- Resource Naming: All resources include environmentSuffix for multi-environment support
- Compliance: Infrastructure configuration supports PCI DSS audit requirements
- Code Quality: Clean HCL code, well-documented, follows Terraform best practices

## What to deliver

- Complete Terraform HCL implementation in lib/ directory
- Main configuration file with provider setup and region specification
- EKS cluster resource with version 1.28 and private endpoint
- Managed node group with Bottlerocket AMI and t3.large instances
- IAM roles and policies for cluster autoscaler with IRSA
- IAM roles and policies for AWS Load Balancer Controller with IRSA
- IAM roles and policies for EBS CSI driver with IRSA
- Helm provider configuration for installing controllers
- VPC endpoints for S3 and ECR
- CloudWatch log group with 30-day retention
- Kubernetes namespace with resource quotas
- Output values for cluster endpoint, OIDC issuer, and kubeconfig command
- Variables file supporting environmentSuffix parameter
- Documentation with deployment instructions
