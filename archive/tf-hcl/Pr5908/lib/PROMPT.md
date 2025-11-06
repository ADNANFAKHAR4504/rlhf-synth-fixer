Hey team,

We need to build a production-grade EKS cluster for a fintech startup that's running their microservices architecture on AWS. They're processing payments and need everything to be serverless using Fargate, with no EC2 node groups at all. The business wants a fully managed Kubernetes solution in ap-southeast-1 that can scale automatically without managing servers.

The engineering team has been struggling with the operational overhead of maintaining EC2-based Kubernetes nodes. They've asked us to architect a solution using EKS with Fargate profiles exclusively. This means all pods will run serverless, the platform will handle scaling automatically, and the ops team won't need to patch or maintain any worker nodes.

The security team is particularly concerned about this being a payment processing system, so they've mandated private endpoints only, strict IAM controls using IRSA (IAM Roles for Service Accounts), and comprehensive audit logging. They also want network isolation between dev and prod workloads using Kubernetes namespaces.

## What we need to build

Create a complete AWS infrastructure using **Terraform with HCL** for a serverless EKS cluster running entirely on Fargate profiles.

### Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster version 1.28 in ap-southeast-1
   - Configure private endpoint access only (no public access)
   - Enable OIDC provider for IAM Roles for Service Accounts (IRSA)
   - Deploy across 3 availability zones for high availability

2. **Fargate Profiles Setup**
   - Create Fargate profile for kube-system namespace (CoreDNS, kube-proxy)
   - Create Fargate profile for application namespace
   - Configure namespace-based profiles for dev workloads
   - Configure namespace-based profiles for prod workloads
   - No EC2 node groups allowed

3. **IAM and Security Configuration**
   - Set up OIDC provider for trust relationships
   - Create IAM roles for service accounts with proper trust policies
   - Configure pod execution roles with minimal permissions
   - Grant CloudWatch Logs write permissions to pods
   - Grant ECR read permissions for container image pulls
   - Implement principle of least privilege

4. **Networking Architecture**
   - Create VPC spanning 3 availability zones
   - Configure public subnets for load balancers
   - Configure private subnets for Fargate pods (no internet routing)
   - Deploy NAT gateways for outbound internet access
   - Implement network policies for pod-to-pod communication restrictions
   - Tag subnets appropriately for Kubernetes discovery

5. **Kubernetes Addons and Controllers**
   - Deploy CoreDNS addon configured to run on Fargate
   - Deploy kube-proxy addon for networking
   - Install AWS Load Balancer Controller with IAM role
   - Configure load balancer controller policies for ALB/NLB management

6. **Monitoring and Observability**
   - Enable CloudWatch Container Insights for cluster monitoring
   - Enable EKS control plane logging for audit logs
   - Enable authenticator logs
   - Enable API server logs
   - Configure log retention policies

7. **Resource Management and Governance**
   - Create Kubernetes namespaces with Fargate selector labels
   - Configure pod security standards at namespace level
   - Tag all resources with Environment, Project, and ManagedBy
   - Configure cluster autoscaling through Fargate profile pod limits

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use Amazon EKS for Kubernetes orchestration
- Use AWS Fargate for serverless pod execution
- Use Amazon VPC with public and private subnets
- Use CloudWatch for logging and monitoring
- Use ECR for container image registry
- Use AWS Load Balancer for ingress traffic
- Use NAT Gateway for private subnet egress
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to ap-southeast-1 region
- Terraform version 1.5 or higher required

### Constraints

- EKS cluster must use ONLY Fargate profiles (no EC2 node groups)
- Pod execution roles must follow principle of least privilege
- OIDC provider is mandatory for IRSA implementation
- Use private subnets only for Fargate pod placement
- Control plane logging must include audit, authenticator, and API logs
- CoreDNS and kube-proxy must be configured as Fargate pods
- Implement separate namespace-based Fargate profiles for dev and prod
- All resources must include Environment, Project, and ManagedBy tags
- AWS Load Balancer Controller is required for ingress management
- Configure pod security standards at the namespace level
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and validation

## Success Criteria

- Functionality: EKS 1.28 cluster operational with Fargate-only compute
- Functionality: Separate namespaces for kube-system, application, dev, prod
- Functionality: OIDC provider configured with service account IAM roles
- Functionality: AWS Load Balancer Controller deployed and functional
- Security: Private endpoint access only, no public cluster access
- Security: Pod execution roles with minimal required permissions
- Security: Network policies restricting pod-to-pod communication
- Reliability: Multi-AZ deployment across 3 availability zones
- Reliability: NAT gateways providing redundant egress
- Observability: Container Insights enabled with control plane logs
- Resource Naming: All resources include environmentSuffix
- Code Quality: Production-ready Terraform HCL, well-structured, documented
- Compliance: All resources properly tagged for governance

## What to deliver

- Complete Terraform HCL implementation with modular structure
- VPC with 3 AZs, public subnets, private subnets, NAT gateways
- EKS cluster version 1.28 with OIDC provider enabled
- Multiple Fargate profiles (kube-system, application, dev, prod)
- IAM roles for pod execution and service accounts
- IAM policies for CloudWatch Logs and ECR access
- Security groups for cluster and pod networking
- Kubernetes namespace definitions with proper labels
- AWS Load Balancer Controller IAM role and policies
- CloudWatch log groups for control plane logging
- Terraform variables file for parameterization
- Terraform outputs for cluster endpoint and connection details
- Documentation for cluster access and kubectl configuration
