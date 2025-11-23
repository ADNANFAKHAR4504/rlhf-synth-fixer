# Production EKS Cluster for Microservices Platform

Hey team,

We need to set up a production-grade Kubernetes infrastructure for our containerized microservices platform. The business is moving away from monolithic architecture and wants a scalable, cost-efficient container orchestration solution that can handle variable workloads while maintaining high availability.

I've been asked to create this infrastructure using **CDKTF with Python** to define everything as code. The platform team needs a robust EKS cluster that can automatically scale based on demand, with proper logging and monitoring capabilities built in from day one.

The current manual deployment process is error-prone and doesn't give us the reliability we need for production workloads. We also need better cost optimization through a mix of On-Demand and Spot instances, plus the ability to track all our infrastructure through proper tagging.

## What we need to build

Create a production-ready Amazon EKS cluster infrastructure using **CDKTF with Python** for our containerized microservices platform.

### Core Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster with Kubernetes version 1.28 or higher
   - Place cluster in private subnets for security
   - Use existing VPC infrastructure (not creating new VPC)
   - Enable all 5 types of control plane logging (api, audit, authenticator, controllerManager, scheduler)

2. **Node Groups and Scaling**
   - Create On-Demand managed node group: minimum 2 nodes, maximum 5 nodes, desired 2 nodes
   - Create Spot managed node group: minimum 3 nodes, maximum 10 nodes, desired 3 nodes
   - Both node groups should use appropriate instance types (t3.medium or similar)
   - Configure cluster autoscaler for automatic scaling based on pod requirements

3. **Networking and Addon Configuration**
   - Install and configure VPC CNI addon with prefix delegation enabled
   - Enable OIDC identity provider for service accounts integration
   - Ensure proper IAM roles for service accounts (IRSA) capability

4. **Logging and Monitoring**
   - Set up CloudWatch log group for cluster logs
   - Configure 30-day retention period for log data
   - Ensure all control plane logs flow to CloudWatch

5. **Resource Management**
   - All resources must include **environmentSuffix** parameter for uniqueness
   - Follow naming convention: `eks-cluster-{environmentSuffix}`, `node-group-od-{environmentSuffix}`
   - Tag all resources with: Environment=Production, ManagedBy=CDKTF

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **Amazon EKS** for Kubernetes orchestration
- Use **CloudWatch** for logging and monitoring
- Use **IAM** for authentication and authorization
- Use **EC2** for node group compute resources
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **us-east-1** region
- Use **LocalBackend** for Terraform state (path="terraform.tfstate")

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (RemovalPolicy: DESTROY, no Retain policies)
- Use LocalBackend for state management, NOT S3Backend
- Include proper error handling and logging
- Ensure clean teardown capability for testing environments
- **IMPORTANT**: CDKTF Python has limitations with nested list access for OIDC provider and cluster autoscaler configuration - document these limitations and provide workarounds

### Constraints

- Must use private subnets for EKS cluster endpoint
- Node groups must support both On-Demand and Spot purchasing options
- All IAM roles must follow least privilege principle
- Control plane logs must be enabled for compliance requirements
- Resource tagging is mandatory for cost allocation
- No hardcoded values - use parameters and variables
- All resources must be destroyable without manual intervention

## Success Criteria

- **Functionality**: EKS cluster successfully deploys with specified Kubernetes version
- **Scalability**: Both node groups operational with correct min/max/desired counts
- **Logging**: All control plane logs flowing to CloudWatch with 30-day retention
- **Networking**: VPC CNI addon installed and configured with prefix delegation
- **Resource Naming**: All resources include environmentSuffix parameter
- **Security**: OIDC provider enabled (or limitation documented with workaround)
- **Automation**: Cluster autoscaler configured (or limitation documented with workaround)
- **Tagging**: All resources properly tagged with Environment and ManagedBy
- **Code Quality**: Clean Python code, well-structured, documented
- **Outputs**: Cluster endpoint, OIDC issuer URL, and kubectl configuration command provided

## What to deliver

- Complete CDKTF Python implementation with LocalBackend configuration
- EKS cluster with Kubernetes 1.28+
- Two managed node groups (On-Demand and Spot)
- VPC CNI addon with prefix delegation
- CloudWatch logging configuration with 30-day retention
- IAM roles and policies for cluster and node groups
- OIDC provider configuration (or documented limitation with workaround)
- Cluster autoscaler setup (or documented limitation with workaround)
- Resource tagging implementation
- Output values for cluster endpoint, OIDC issuer, and kubectl command
- Documentation for any platform limitations and recommended workarounds
