# Multi-OS EKS Cluster with Enhanced Security

Hey team,

We need to build a production-grade Kubernetes infrastructure for a financial services company that's migrating their microservices to AWS. They're running about 50 microservices with a mix of Linux and Windows workloads, and they need everything locked down tight with private endpoints and encryption everywhere. I've been asked to create this using CloudFormation with JSON templates.

The business requirement is pretty clear - they want a fully managed EKS cluster that can handle both their existing Linux containers and some Windows-based services that can't be containerized on Linux yet. Security is their top concern since they're in financial services, so we're talking private API endpoints only, KMS encryption for everything, and proper IAM roles for service accounts. They also want to keep costs reasonable by using Spot instances where possible.

The infrastructure team wants this deployed across three availability zones in us-east-1 for high availability. They've already got approval for NAT gateways since the cluster needs private subnets only, and they're okay with the costs there. Auto-scaling is critical because their workloads vary significantly throughout the day.

## What we need to build

Create a production-ready EKS cluster using **CloudFormation with JSON** for a multi-OS Kubernetes environment supporting both Linux and Windows containers.

### Core Requirements

1. **EKS Control Plane**
   - Create EKS cluster with Kubernetes version 1.28 or higher
   - Configure private API endpoint only (no public access)
   - Enable all control plane log types: api, audit, authenticator, controllerManager, scheduler
   - Set up OIDC provider for IRSA (IAM Roles for Service Accounts) functionality
   - Tag cluster with Environment=Production and ManagedBy=CloudFormation

2. **Managed Node Groups**
   - Deploy Linux node group: t3.medium instances, minimum 2 nodes, maximum 10 nodes, Amazon Linux 2
   - Deploy Windows node group: t3.large instances, minimum 1 node, maximum 5 nodes, Windows Server 2022
   - Configure both node groups to use 50% Spot instances (OnDemandPercentageAboveBaseCapacity=50)
   - Create custom launch templates for both groups with IMDSv2 required and HttpPutResponseHopLimit=1
   - Tag all node resources with Environment=Production and ManagedBy=CloudFormation

3. **Encryption and Security**
   - Configure KMS encryption for EKS secrets
   - Enable KMS encryption for control plane logs
   - Enforce IMDSv2 on all worker nodes
   - Use IAM roles with least privilege principle

4. **Networking and Addons**
   - Configure VPC CNI addon with ENABLE_PREFIX_DELEGATION set to true
   - Ensure private subnet configuration for all node groups
   - Deploy across 3 availability zones in us-east-1

5. **Outputs**
   - Export cluster endpoint URL
   - Export OIDC issuer URL
   - Export ARNs for both node groups

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS::EKS::Cluster** for the EKS control plane
- Use **AWS::EKS::Nodegroup** for managed node groups
- Use **AWS::EC2::LaunchTemplate** for custom launch configurations
- Use **AWS::KMS::Key** for encryption keys
- Use **AWS::IAM::Role** for cluster and node IAM roles
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be tagged consistently

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - NO RemovalPolicy: Retain or DeletionProtection: true
- All resource names must accept and use **environmentSuffix** parameter for multi-environment deployments
- Template must be valid JSON (not YAML)
- Template must be deployable via AWS CLI or Console without manual intervention
- Include proper DependsOn attributes for resource ordering

### Constraints

- EKS cluster must use Kubernetes version 1.28 or higher
- Control plane logging must be enabled for all 5 log types with encryption
- Node groups must use Spot instances for at least 50% of capacity
- Windows node group must use Windows Server 2022 AMI (latest)
- All worker nodes must use custom launch templates with IMDSv2 enforced
- Cluster must use IRSA for pod-level permissions
- VPC CNI addon must be configured with ENABLE_PREFIX_DELEGATION=true
- Private API endpoint only - no public endpoint access
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation

### Optional Enhancements (if time permits)

- AWS Load Balancer Controller with IAM role and service account
- Fluent Bit for log forwarding to CloudWatch
- EBS CSI driver with encrypted volume support

## Success Criteria

- Functionality: All 10 mandatory requirements implemented and working
- Performance: Node groups auto-scale based on demand, 50% Spot usage
- Reliability: Multi-AZ deployment with proper health checks
- Security: Private endpoints, KMS encryption, IMDSv2, IRSA configured
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: Valid JSON CloudFormation template, well-documented, includes comprehensive test suite

## What to deliver

- Complete CloudFormation JSON template implementation
- AWS services: EKS, EC2 (Launch Templates, Node Groups), KMS, IAM, CloudWatch Logs, VPC
- Unit tests for template validation and parameter testing
- Integration tests for resource creation verification
- Documentation including deployment instructions and architecture diagram
- All code in lib/ directory, tests in test/ or tests/ directory
