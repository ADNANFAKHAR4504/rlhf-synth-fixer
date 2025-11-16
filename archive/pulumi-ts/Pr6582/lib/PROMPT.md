# Production EKS Cluster Deployment

Hey team,

We need to deploy a production-grade Kubernetes cluster for our financial services platform. I've been asked to create this infrastructure using **Pulumi with TypeScript**. The business wants a secure, scalable EKS cluster that can handle microservices workloads with automatic scaling and strict pod isolation.

Our platform team needs this to support our growing microservices architecture with proper security controls and compliance requirements. The cluster needs to handle both general workloads and compute-intensive batch processing jobs with different node configurations.

The infrastructure must meet financial services compliance requirements with proper audit logging, pod security standards, and network isolation between services. We also need integration with AWS Load Balancer Controller for managing ALB and NLB resources dynamically.

## What we need to build

Create a complete EKS infrastructure using **Pulumi with TypeScript** for deploying a production Kubernetes cluster with advanced security and networking configurations.

### Core Requirements

1. **VPC and Networking**
   - Create VPC with 3 private subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Create 3 public subnets: 10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24
   - Distribute subnets across different availability zones
   - Configure NAT gateways and internet gateways appropriately

2. **EKS Cluster Configuration**
   - Deploy EKS cluster with Kubernetes version 1.28 or higher
   - Enable control plane logging to CloudWatch for: audit, authenticator, and API server logs
   - Configure cluster endpoint access appropriately for production

3. **OIDC and IAM Integration**
   - Configure OIDC identity provider for IRSA (IAM Roles for Service Accounts)
   - Create IAM role for cluster autoscaler with necessary permissions
   - Create IAM role for AWS Load Balancer Controller with required policies

4. **Managed Node Groups**
   - General workloads node group: t3.large instances, minimum 2 nodes, maximum 10 nodes
   - Compute-intensive node group: c5.2xlarge instances, minimum 1 node, maximum 5 nodes
   - Both node groups must use Bottlerocket AMI for enhanced security
   - Configure custom launch templates with encrypted EBS volumes (gp3 type, 100GB size)
   - Enforce IMDSv2 (Instance Metadata Service version 2) for security

5. **Network Policy and CNI**
   - Install Calico CNI plugin version 3.26.x using Helm
   - Configure at least 2 NetworkPolicy resources for pod isolation
   - Ensure proper pod-to-pod traffic control

6. **Cluster Autoscaler**
   - Deploy cluster autoscaler version 1.28.x
   - Configure priority expander to prefer general node group
   - Ensure proper IRSA configuration for autoscaler

7. **Pod Security Standards**
   - Configure pod security standards admission controller
   - Set baseline enforcement level to 'restricted'
   - Apply to appropriate namespaces

8. **AWS Load Balancer Controller**
   - Deploy AWS Load Balancer Controller v2.6.x
   - Configure with proper IRSA (IAM role integration)
   - Enable for ALB and NLB provisioning

9. **Resource Tagging**
   - Tag all resources with: Environment=Production
   - Tag all resources with: ManagedBy=Pulumi
   - Tag all resources with: CostCenter=Engineering

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS EKS** for Kubernetes cluster management
- Use **AWS VPC** for network isolation and subnets
- Use **AWS IAM** for OIDC and service account roles
- Use **AWS EC2** for launch templates with encrypted volumes
- Use **AWS CloudWatch** for control plane logging
- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: `{resource-type}-{purpose}-${environmentSuffix}`
- Deploy to **us-east-1** region
- Use Pulumi packages: @pulumi/pulumi, @pulumi/aws, @pulumi/eks, @pulumi/kubernetes

### Constraints

- All node groups must use Bottlerocket AMI (AWS-managed security-hardened OS)
- EBS volumes must be encrypted using gp3 volume type
- IMDSv2 must be enforced on all EC2 instances
- Control plane logs must be enabled for audit, authenticator, and API server
- Kubernetes version must be 1.28 or higher
- All resources must be destroyable (no Retain deletion policies)
- Network policies must enforce pod isolation
- Pod security admission must enforce 'restricted' standard
- Launch templates required for custom node configurations

### Success Criteria

- **Functionality**: EKS cluster accessible via kubectl with two functional node groups
- **Scalability**: Cluster autoscaler automatically scales nodes based on workload demands
- **Security**: CIS Kubernetes Benchmark compliance, network policies enforcing isolation
- **Networking**: Calico CNI properly configured with working network policies
- **Load Balancing**: AWS Load Balancer Controller ready to provision ALB/NLB resources
- **Monitoring**: CloudWatch Container Insights integration for cluster monitoring
- **Resource Naming**: All resources include environmentSuffix parameter
- **Compliance**: Pod security standards enforced, IMDSv2 active, encrypted volumes
- **Zero-Downtime**: Support for rolling updates and deployments

## What to deliver

- Complete Pulumi TypeScript implementation with proper typing
- VPC with public and private subnets across multiple AZs
- EKS cluster v1.28+ with control plane logging enabled
- OIDC provider configured with IAM roles for service accounts
- Two managed node groups with Bottlerocket AMI and custom launch templates
- Calico CNI plugin v3.26.x installed via Helm
- At least 2 NetworkPolicy resources for pod isolation
- Cluster autoscaler v1.28.x with priority expander configuration
- Pod security standards admission controller with restricted enforcement
- AWS Load Balancer Controller v2.6.x deployed
- All resources tagged appropriately
- Unit tests validating infrastructure configuration
- Documentation for deployment and accessing the cluster
