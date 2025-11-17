# EKS Fargate Deployment for Fintech Microservices

Hey team,

We've been asked to build out a complete AWS EKS infrastructure for a fintech company that's moving their microservices to a fully serverless container platform. They want everything running on Fargate profiles, no EC2 nodes at all. The business is looking for strong separation between production and development workloads while keeping costs under control through smart autoscaling.

I need to create this infrastructure using **CDKTF with Python** since that's what our team has standardized on. The company operates in the Asia-Pacific region, so we'll be deploying everything to ap-southeast-1.

The interesting challenge here is that we need to set up a complete Fargate-only EKS cluster with all the bells and whistles - load balancing, secrets management, monitoring, and intelligent pod scheduling. They're coming from a traditional deployment model and want to leverage AWS managed services as much as possible while maintaining their security posture.

## What we need to build

Create a complete EKS cluster infrastructure using **CDKTF with Python** that runs exclusively on AWS Fargate profiles for serverless container orchestration.

### Core EKS Cluster Requirements

1. **EKS Cluster Configuration**
   - EKS cluster version 1.28
   - Private endpoint access enabled
   - Comprehensive logging enabled for all components (api, audit, authenticator, controllerManager, scheduler)
   - OIDC provider configured for IRSA (IAM Roles for Service Accounts)
   - Deploy to ap-southeast-1 region

2. **Fargate Profile Setup**
   - Production Fargate profile for 'production' namespace with m5.large pod sizes
   - Development Fargate profile for 'development' namespace with t3.medium pod sizes
   - Dedicated IAM execution roles for each profile with appropriate trust policies
   - CoreDNS and kube-proxy configured as Fargate deployments

3. **Network Infrastructure**
   - VPC spanning 3 availability zones
   - Private subnets for Fargate pod deployment
   - NAT gateways for outbound connectivity
   - VPC CNI plugin with security groups per pod feature enabled
   - Custom network policies implementation

### AWS Service Integrations

4. **Load Balancing**
   - AWS Load Balancer Controller deployed via Helm
   - IRSA configuration for ALB and NLB provisioning
   - Target group binding support

5. **Secrets Management**
   - AWS Secrets Manager CSI driver integration
   - Native Kubernetes secret synchronization
   - Fetch secrets from existing Secrets Manager entries (don't create new ones)

6. **Monitoring and Logging**
   - CloudWatch Container Insights DaemonSet adapted for Fargate
   - FluentBit configuration for log aggregation
   - Cluster and pod-level monitoring with custom metrics

7. **Autoscaling**
   - Karpenter autoscaler installation
   - Fargate profile optimization for cost-efficient pod scheduling
   - Integration with cluster autoscaling

### Security and Compliance

8. **Pod Security Standards**
   - Baseline enforcement for development namespace
   - Restricted enforcement for production namespace
   - Admission controller configuration

9. **IAM and Access Control**
   - Fine-grained pod permissions using IRSA
   - Principle of least privilege for all IAM roles
   - Separate execution roles for production and development

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **AWS EKS** for Kubernetes orchestration
- Use **AWS Fargate** for serverless compute (no EC2 node groups)
- Use **AWS VPC** with proper subnet isolation
- Use **NAT Gateway** for outbound connectivity
- Use **IAM** roles and policies for access control
- Use **AWS Load Balancer Controller** for ingress
- Use **AWS Secrets Manager** for credential management
- Use **CloudWatch** for monitoring and logging
- Use **VPC CNI** plugin for networking
- Use **Karpenter** for intelligent autoscaling
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **ap-southeast-1** region

### Constraints

- EKS cluster must use Fargate profiles exclusively (no EC2 node groups)
- All resources must be destroyable (no Retain policies)
- Encryption at rest and in transit required
- CoreDNS and kube-proxy must run as Fargate pods with resource limits and anti-affinity rules
- Secrets must be fetched from existing AWS Secrets Manager, not created
- Requires Terraform 1.5+, AWS provider 5.x, kubectl 1.28+, helm provider
- Include proper error handling and logging throughout

## Success Criteria

- **Functionality**: Complete EKS cluster running on Fargate with separate production and development profiles
- **Performance**: Karpenter optimizing pod placement and scaling efficiently
- **Reliability**: High availability across 3 AZs with proper health checks
- **Security**: Pod security standards enforced, IRSA configured, network policies active
- **Monitoring**: CloudWatch Container Insights collecting metrics and logs from all pods
- **Integration**: Load balancer controller, secrets manager, and monitoring fully operational
- **Resource Naming**: All resources include environmentSuffix variable
- **Code Quality**: Clean Python code, well-structured CDKTF constructs, properly documented

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- VPC with 3 AZ architecture and private subnets
- EKS cluster v1.28 with Fargate-only compute
- Two Fargate profiles (production and development) with IAM roles
- OIDC provider configuration
- AWS Load Balancer Controller via Helm
- Karpenter autoscaler installation
- AWS Secrets Manager CSI driver
- CloudWatch Container Insights with FluentBit
- VPC CNI with security group per pod configuration
- Pod security standards for both namespaces
- CoreDNS and kube-proxy Fargate deployments
- Unit tests for all components
- Integration tests validating deployed resources
- Documentation and deployment instructions in lib/README.md
