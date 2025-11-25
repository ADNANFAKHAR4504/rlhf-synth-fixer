# Production-Grade EKS Cluster with Cost Optimization

## Business Context

Hey, we're building a production-grade EKS cluster infrastructure for our fintech microservices platform that needs strict security controls, automated node scaling, and cost optimization through spot instance utilization. **We'll use Terraform with HCL** to create this isolated Kubernetes environment in us-east-1 with high availability across three availability zones.

## Technical Requirements

### VPC Network Architecture

Create a dedicated VPC with CIDR 10.0.0.0/16 containing six subnets across three availability zones—private subnets for EKS worker nodes (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) and public subnets for load balancers (10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24). Enable DNS hostnames and DNS support, create an Internet Gateway, and deploy three NAT Gateways (one per public subnet with Elastic IPs) for production-grade high availability. Configure route tables with appropriate routing—private subnets route to respective NAT Gateways while public subnets route to the Internet Gateway. Enable VPC Flow Logs capturing all traffic to a dedicated S3 bucket with KMS encryption for network security monitoring. Tag all VPC resources with kubernetes.io/cluster/[cluster-name]=shared for EKS service discovery and proper subnet identification with kubernetes.io/role/internal-elb=1 on private subnets and kubernetes.io/role/elb=1 on public subnets.

### EKS Cluster Configuration

Deploy an EKS cluster using Kubernetes version 1.28 or higher with the cluster name "eks-production-cluster-dev" following the naming pattern eks-{purpose}-{environment}. Place the cluster control plane in the three private subnets created earlier ensuring high availability across multiple zones. Enable all five control plane log types (api, audit, authenticator, controllerManager, scheduler) with CloudWatch Logs retention set to seven days and KMS encryption enabled using a dedicated customer-managed key. Create a dedicated security group for the cluster control plane allowing HTTPS inbound from the worker node security group and configure the cluster IAM service role with policies for AmazonEKSClusterPolicy and AmazonEKSVPCResourceController.

### OIDC Provider and IRSA Setup

Create an OpenID Connect provider for the EKS cluster using the cluster's OIDC issuer URL to enable IAM Roles for Service Accounts federation. Extract the OIDC provider URL from the cluster identity and configure the provider with the appropriate thumbprint for authentication. Define an IAM role specifically for the Kubernetes cluster autoscaler service account with a trust relationship that allows the OIDC provider to assume the role only when the service account namespace is kube-system and the service account name is cluster-autoscaler. Attach an IAM policy to this role granting least privilege permissions for Auto Scaling group operations including DescribeAutoScalingGroups, DescribeAutoScalingInstances, DescribeLaunchConfigurations, DescribeTags, SetDesiredCapacity, TerminateInstanceInAutoScalingGroup actions on specific Auto Scaling group resources with ARN patterns matching the cluster name using resource conditions.

### On-Demand Managed Node Group

Create a managed node group named "eks-nodegroup-ondemand-dev" using on-demand t3.large instances with capacity type set to ON_DEMAND. Configure scaling with minimum size of two nodes, maximum size of five nodes, and desired size of three nodes for consistent baseline capacity. Use the three private subnets for node placement ensuring distribution across availability zones and create a custom launch template enforcing IMDSv2 with http_tokens set to required and http_put_response_hop_limit set to one for enhanced security. Define an IAM role for the node group with managed policies AmazonEKSWorkerNodePolicy, AmazonEKS_CNI_Policy, AmazonEC2ContainerRegistryReadOnly, and AmazonSSMManagedInstanceCore for Systems Manager Session Manager connectivity. Apply Kubernetes labels including node.kubernetes.io/lifecycle=normal and workload-type=general to identify on-demand nodes and configure tags for cluster autoscaler discovery with k8s.io/cluster-autoscaler/[cluster-name]=owned and k8s.io/cluster-autoscaler/enabled=true.

### Spot Instance Managed Node Group

Create a second managed node group named "eks-nodegroup-spot-dev" using spot instances for cost optimization with capacity type set to SPOT. Configure multiple instance types including t3.medium and t3a.medium to increase spot capacity availability and set scaling with minimum size of three nodes, maximum size of ten nodes, and desired size of five nodes. Use the same three private subnets and create a separate custom launch template with IMDSv2 required and one-hop limit identical to the on-demand configuration. Define a dedicated IAM role with the same managed policies as the on-demand node group ensuring proper EKS cluster integration and SSM access. Apply Kubernetes labels including node.kubernetes.io/lifecycle=spot and workload-type=batch to identify spot instances for pod scheduling decisions and configure cluster autoscaler discovery tags matching the on-demand group pattern with k8s.io/cluster-autoscaler/[cluster-name]=owned and k8s.io/cluster-autoscaler/enabled=true.

### Node Security Groups

Create a dedicated security group for EKS worker nodes allowing inbound HTTPS traffic from the cluster control plane security group for kubelet communication, allowing all traffic between worker nodes for pod-to-pod communication using the node security group itself as the source, and restricting SSH access to port 22 only from CIDR block 10.0.0.0/8 for administrative access from within the private network. Configure outbound rules allowing all traffic to the internet through NAT Gateways for pulling container images and accessing AWS services. Add security group rules dynamically to allow traffic from the cluster control plane security group after cluster creation to handle the circular dependency between cluster and node security groups.

### EKS Addons Configuration

Install and configure three critical EKS addons using the latest compatible versions. Deploy the VPC CNI addon (vpc-cni) with configuration enabling custom network policies, prefix delegation for increased pod density, and setting the AWS_VPC_K8S_CNI_CUSTOM_NETWORK_CFG environment variable. Install the EBS CSI driver addon (aws-ebs-csi-driver) with encryption enabled by default using a customer-managed KMS key for persistent volume encryption and configure an IAM role for the addon service account using IRSA with policies granting permissions for EC2 volume operations including CreateVolume, DeleteVolume, AttachVolume, DetachVolume on EBS resources. Deploy the CoreDNS addon (coredns) with configuration optimizations for production workloads. Each addon must include explicit dependencies on the OIDC provider creation and proper service account IAM role configuration with trust relationships allowing the OIDC provider to assume roles.

### KMS Encryption Keys

Create three customer-managed KMS keys for encrypting EKS control plane logs, VPC Flow Logs stored in S3, and EBS volumes used by the EBS CSI driver. Each key must enable automatic rotation annually and include a key policy granting root account access first to prevent lockouts, then granting service principals (logs.amazonaws.com for CloudWatch, s3.amazonaws.com for S3, ec2.amazonaws.com for EBS) the necessary GenerateDataKey and Decrypt permissions for encryption operations. Set deletion_window_in_days to seven for testing cleanup and create aliases like "alias/eks-logs-encryption-dev", "alias/vpc-flowlogs-encryption-dev", "alias/ebs-encryption-dev" for easier reference in resource configurations.

### CloudWatch Logging

Create dedicated CloudWatch log groups for EKS control plane logs with the naming pattern "/aws/eks/eks-production-cluster-dev/cluster" and for VPC Flow Logs with retention_in_days set to seven and KMS encryption enabled using the appropriate customer-managed keys. Configure the EKS cluster to stream all five control plane log types to CloudWatch Logs and enable VPC Flow Logs to capture accepted and rejected traffic for security analysis.

### S3 Storage for VPC Flow Logs

Create an S3 bucket for storing VPC Flow Logs using the naming pattern "s3-vpc-flowlogs-dev-ACCOUNT_ID" retrieved using data.aws_caller_identity.current for global uniqueness. Enable versioning and configure server-side encryption using the VPC Flow Logs customer-managed KMS key. Implement all four public access block settings and add bucket policies granting root account access first, then allowing the VPC Flow Logs service principal to write logs with proper resource ARN constraints. Set force_destroy to true for clean testing teardown and configure lifecycle rules with the required filter block to transition older Flow Logs to Glacier after thirty days and expire after ninety days.

## Code Documentation Requirements

**CRITICAL: All Terraform code must include detailed comment blocks explaining each section's purpose and configuration choices.** Use multi-line comments before each resource block describing what the resource does, why specific settings are chosen, and how it integrates with other components. Include inline comments for complex configurations like IAM policies, security group rules, and addon configurations. Comment blocks should follow this pattern: start with a description of the resource type, explain the purpose in the architecture, note any dependencies or special considerations, and document security or compliance rationale. This ensures the generated code is self-documenting and maintainable for future infrastructure changes.

## Provider Configuration

Configure Terraform 1.5 or higher with AWS provider version constrained to 5.x using pessimistic operator (~> 5.0). Include TLS provider for OIDC thumbprint extraction and random provider for unique naming where needed. Deploy all resources to us-east-1 with default_tags applying Environment=production, ManagedBy=terraform, Project=fintech-microservices, CostCenter=engineering, DataClassification=confidential tags automatically to all resources. Define variables for environment with type string and default "dev", cluster_name with default "eks-production-cluster", kubernetes_version with default "1.28", and admin_access_cidr with default "203.0.113.0/24" for parameterization.

## Resource Naming

Follow the deterministic naming pattern {resource-type}-{purpose}-{environment} for all resources like "eks-production-cluster-dev" or "eks-nodegroup-ondemand-dev". S3 buckets need AWS account ID appended for global uniqueness like "s3-vpc-flowlogs-dev-ACCOUNT_ID" retrieved using data.aws_caller_identity.current. Security groups use pattern "sg-eks-{component}-{environment}" like "sg-eks-cluster-dev" or "sg-eks-nodes-dev". IAM roles follow "iam-role-eks-{component}-{environment}" pattern. Don't use random_string resources in naming since that causes integration test failures.

## Data Source Restrictions

Only use data.aws_caller_identity.current for account ID retrieval, data.aws_region.current for region name, data.aws_availability_zones.available for AZ selection with state filter set to available, and data.tls_certificate for extracting OIDC provider thumbprint from the EKS cluster issuer URL. Don't use data sources referencing existing infrastructure like data.aws_vpc, data.aws_subnet, or data.aws_security_group—create all resources fresh within this Terraform configuration for isolated testing and complete lifecycle management.

## File Organization

Structure with lib/provider.tf containing Terraform and provider version constraints, AWS provider configuration with default_tags and region, TLS and random provider declarations, and all variable definitions with types, descriptions, and defaults. The lib/main.tf file contains all data sources at the top, then KMS encryption keys section with detailed comments, VPC networking resources (VPC, subnets, Internet Gateway, NAT Gateways, route tables, route associations, VPC Flow Logs) grouped together, S3 bucket for Flow Logs storage, EKS cluster IAM roles and security groups, EKS cluster resource with logging and endpoint configuration, OIDC provider creation, cluster autoscaler IAM role with IRSA trust policy, managed node group IAM roles, custom launch templates for both node groups, on-demand node group resource, spot instance node group resource, node security group with rules, all three EKS addons with service account IAM roles, CloudWatch log groups, and comprehensive outputs with minimum 40-45 total outputs. Each major section must have a clear comment block header explaining the section's purpose like "# KMS Encryption Keys for EKS and VPC Flow Logs" or "# EKS Managed Node Groups - On-Demand and Spot Configurations".

## Cleanup Configuration

Set force_destroy to true on the S3 bucket for VPC Flow Logs, deletion_window_in_days to seven on all three KMS keys, retention_in_days to seven on both CloudWatch log groups, and ensure all EKS resources including the cluster, node groups, and addons have proper destroy behavior without protection flags. Node groups delete cleanly when the cluster is destroyed due to proper dependency management with depends_on meta-arguments. All other resources delete cleanly without special configuration ensuring complete terraform destroy success for automated testing workflows.

## Integration Testing Outputs

Provide comprehensive outputs for all resources including KMS key IDs and ARNs for all three encryption keys (6 outputs), VPC ID, private subnet IDs as list, public subnet IDs as list, NAT Gateway IDs as list (8 outputs), S3 bucket name and ARN for Flow Logs (2 outputs), EKS cluster ID, ARN, endpoint, certificate authority data, OIDC provider URL, OIDC provider ARN, cluster security group ID, cluster version (8 outputs), cluster autoscaler IAM role ARN (1 output), on-demand node group ID, ARN, status, on-demand node IAM role ARN (4 outputs), spot node group ID, ARN, status, spot node IAM role ARN (4 outputs), node security group ID (1 output), VPC CNI addon ARN and version, EBS CSI driver addon ARN and version, CoreDNS addon ARN and version (6 outputs), CloudWatch log group names for cluster logs and Flow Logs (2 outputs). Mark sensitive outputs like cluster endpoint and certificate authority data appropriately with sensitive equals true. Tests require outputs for every created resource to validate EKS cluster configuration, node group deployments, addon installations, OIDC provider setup, and security configurations with minimum 40-45 total outputs covering all infrastructure components.