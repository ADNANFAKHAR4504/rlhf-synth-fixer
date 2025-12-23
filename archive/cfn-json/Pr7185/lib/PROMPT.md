Hey team,

We've got a pretty interesting challenge from our financial services client. They need to set up a production-ready EKS cluster for their microservices platform, and they're very particular about security. The cluster needs to handle both Linux and Windows workloads, which adds some complexity. More importantly, everything needs to be locked down tight - private endpoints only, encryption everywhere, and strict instance metadata controls.

The team wants to deploy about 50 microservices across this cluster, spanning 3 availability zones in us-east-1. They're okay with using Spot instances to save on costs, but they need the infrastructure to be rock solid. The business has already committed to this architecture with their compliance team, so we need to get the security controls right from day one.

I've been asked to create this infrastructure definition using **AWS CloudFormation with JSON** format. The ops team is very familiar with CloudFormation, and they want a native JSON template they can review and deploy through their existing pipelines.

## What we need to build

Create an EKS cluster infrastructure using **AWS CloudFormation with JSON** for a multi-OS microservices platform with enhanced security controls.

### Core Infrastructure Requirements

1. **EKS Cluster Configuration**
   - Deploy EKS cluster version 1.28 or higher with private API endpoint only
   - Enable all control plane log types: api, audit, authenticator, controllerManager, scheduler
   - Configure KMS encryption for EKS secrets and control plane logs
   - Set up OIDC provider for IRSA functionality

2. **Multi-OS Node Groups**
   - Linux node group: Amazon Linux 2, t3.medium instances, min 2 / max 10 nodes
   - Windows node group: Windows Server 2022, t3.large instances, min 1 / max 5 nodes
   - Both node groups must use custom launch templates with IMDSv2 required
   - HttpPutResponseHopLimit must be set to 1 for metadata service
   - Configure Spot instance usage with OnDemandPercentageAboveBaseCapacity at 50

3. **Networking and Add-ons**
   - VPC CNI addon configured with ENABLE_PREFIX_DELEGATION set to true
   - Private subnets only with NAT gateways for outbound connectivity
   - Deploy across 3 availability zones in us-east-1

4. **Resource Tagging and Outputs**
   - Tag all resources with Environment=Production and ManagedBy=CloudFormation
   - Output cluster endpoint, OIDC issuer URL, and node group ARNs

### Technical Requirements

- All infrastructure defined using **AWS CloudFormation with JSON**
- Use AWS::EKS::Cluster for the control plane
- Use AWS::EKS::Nodegroup for managed node groups
- Use AWS::EC2::LaunchTemplate for custom launch configurations
- Use AWS::KMS::Key for encryption keys
- Use AWS::IAM::OIDCProvider for IRSA setup
- Resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region

### Deployment Requirements (CRITICAL)

- All resources must include environmentSuffix parameter in names for multi-environment deployments
- All resources must be destroyable (use DeletionPolicy: Delete, FORBIDDEN to use Retain)
- No hardcoded values - use CloudFormation parameters where appropriate
- IMDSv2 must be enforced on all EC2 instances (HttpTokens: required)
- Launch templates are required - do not use inline launch configurations
- Node groups must reference custom launch templates, not use default configurations

### Optional Enhancements

If time permits, consider adding:
- AWS Load Balancer Controller with IAM role and service account for ingress management
- Fluent Bit configuration for log forwarding to CloudWatch
- EBS CSI driver with encrypted volume support for persistent storage

### Constraints

- Private endpoints only - no public cluster access
- Encryption required for all data at rest using KMS
- Spot instances required for cost optimization (50% minimum)
- Windows Server 2022 AMI required for Windows workloads
- IMDSv2 enforcement non-negotiable for security compliance
- All resources must support clean teardown with no retained resources

## Success Criteria

- Infrastructure deploys successfully via CloudFormation
- EKS cluster accessible only through private endpoint
- Both Linux and Windows node groups functional and auto-scaling
- All control plane logs flowing to CloudWatch with encryption
- IRSA configured and ready for pod-level IAM permissions
- Spot instances properly integrated with 50% minimum capacity
- All resources properly tagged and documented
- Stack can be deleted cleanly without manual intervention

## What to deliver

- Complete CloudFormation JSON template in lib/TapStack.json
- Parameters for environmentSuffix, VPC configuration, and instance types
- IAM roles for cluster, node groups, and OIDC provider
- KMS key with proper key policy for EKS encryption
- Launch templates for both Linux and Windows node groups
- CloudFormation outputs for cluster endpoint and ARNs
- Clear documentation of any assumptions or design decisions
