# EKS Cluster Deployment with Terraform

## Background

A fintech startup needs to migrate their microservices architecture from on-premise Kubernetes to AWS EKS. They require a production-grade EKS cluster with strict security requirements, multiple node groups for different workload types, and integration with their existing VPC infrastructure.

## Task

Create a Terraform configuration to deploy a production-ready EKS cluster with advanced networking and security configurations using Terraform with HCL.

## Platform and Language Requirements

MANDATORY: This task MUST use:
- Platform: Terraform
- Language: HCL
- Complexity: expert

These are NON-NEGOTIABLE constraints. Do not use any other IaC platform or language.

## Mandatory Requirements

You MUST implement ALL of the following requirements:

1. Deploy an EKS cluster version 1.28 with private API endpoint that connects through VPC PrivateLink for secure cluster access
2. Configure three managed node groups that connect to the EKS control plane: system nodes on t3.medium, application nodes on m5.large, and spot instances on m5.large with distinct taints and labels
3. Implement pod security standards with baseline enforcement that integrates with EKS admission controllers for all namespaces
4. Enable IRSA that connects IAM roles to Kubernetes service accounts through OIDC provider configuration
5. Configure cluster autoscaler that integrates with EC2 Auto Scaling Groups through proper IAM permissions and node group tags
6. Set up aws-ebs-csi-driver addon that connects to KMS for encrypted GP3 storage class as default
7. Implement network segmentation with dedicated subnets that isolate each node group for security
8. Enable control plane logging that streams to CloudWatch Logs for api, audit, authenticator, controllerManager, and scheduler
9. Configure KMS encryption that protects EKS secrets with customer-managed key rotation
10. Set up aws-load-balancer-controller that integrates with ALB and NLB for ingress traffic through IAM role

## Optional Enhancements

If time permits, consider implementing:

- Add AWS Systems Manager Session Manager that connects to EKS nodes for secure access without SSH key management
- Implement Karpenter that integrates with EC2 for advanced autoscaling with improved cost optimization and scaling speed
- Add Amazon GuardDuty that monitors EKS runtime for threat detection

## Constraints

You MUST adhere to the following constraints:

1. All node groups must use Amazon Linux 2 EKS-optimized AMIs with IMDSv2 enforced
2. Cluster endpoint must be private-only with no public access allowed
3. Each node group must have unique security group rules based on workload type
4. All IAM roles must follow least-privilege principle with no wildcard actions
5. Terraform state must be stored in S3 with DynamoDB locking configured
6. Node groups must use launch templates with detailed monitoring enabled
7. All resources must be tagged with Environment, Team, and CostCenter tags

## Destroyability Requirements

CRITICAL: All resources MUST be destroyable without manual intervention:
- No Terraform prevent_destroy lifecycle rules
- Use skip_final_snapshot = true for any database resources
- No DeletionProtection settings enabled
- All S3 buckets must allow force_destroy

## Environment Suffix Requirement

CRITICAL: ALL resource names MUST include the environment_suffix variable:
- Pattern: resource-name-with-suffix
- Example: eks-cluster-with-environment-suffix
- This prevents resource conflicts in parallel deployments

## Expected Output

Complete Terraform configuration files that provision a secure, production-ready EKS cluster with multiple node groups, proper IAM roles, networking isolation, and essential add-ons. The configuration should be modular with separate files for EKS, node groups, IAM, and add-ons.

## AWS Services Used

- Amazon EKS connects to VPC for network isolation
- Amazon EC2 hosts worker nodes that connect to EKS control plane
- Amazon VPC provides network infrastructure that isolates cluster resources
- AWS IAM authenticates service accounts that connect to AWS services
- AWS KMS encrypts secrets and volumes that protect sensitive data
- Amazon EBS provides persistent storage that connects to EC2 instances through CSI driver

## File Structure

Your implementation should include these files in lib directory:

- main.tf contains the primary Terraform configuration
- variables.tf defines all input variables
- outputs.tf defines all output values
- versions.tf specifies Terraform and provider versions
- eks.tf configures the EKS cluster
- node-groups.tf configures managed node groups
- iam.tf defines IAM roles and policies
- networking.tf configures VPC and subnets
- addons.tf configures EKS addons like CSI driver and load balancer controller
- security.tf configures security groups and KMS keys
- backend.tf configures S3 backend for state storage

## Success Criteria

The infrastructure should:
1. Deploy successfully without manual intervention
2. Pass all validation checks for security and best practices
3. Be fully destroyable without leaving orphaned resources
4. Support parallel deployments with environment_suffix
5. Follow Terraform best practices for modularity and maintainability
6. Include comprehensive documentation in outputs
