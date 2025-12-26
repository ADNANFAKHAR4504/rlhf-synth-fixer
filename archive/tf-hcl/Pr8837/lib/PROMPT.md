# EKS Cluster Deployment with Terraform

## Background

A fintech startup needs to migrate their microservices architecture from on-premise Kubernetes to AWS EKS. They require a production-grade EKS cluster with strict security requirements, multiple node groups for different workload types, and integration with their existing VPC infrastructure.

## Task

Create a Terraform configuration to deploy a production-ready EKS cluster with advanced networking and security configurations using **Terraform with HCL**.

## Platform and Language Requirements

**MANDATORY**: This task MUST use:
- **Platform**: Terraform
- **Language**: HCL
- **Complexity**: expert

These are NON-NEGOTIABLE constraints. Do not use any other IaC platform or language.

## Mandatory Requirements

You MUST implement ALL of the following requirements:

1. Deploy an EKS cluster version 1.28 with private API endpoint access only that connects to dedicated VPC subnets for network isolation
2. Configure three managed node groups running on EC2 instances that connect to the EKS control plane: system nodes on t3.medium, application nodes on m5.large, and spot instances on m5.large with distinct taints and labels
3. Implement pod security standards with baseline enforcement that validates and controls pod specifications across all namespaces
4. Enable IRSA that connects Kubernetes service accounts to IAM roles through OIDC provider, allowing pods to assume IAM roles for AWS service access
5. Configure cluster autoscaler that monitors node utilization and scales EC2 node groups based on pod resource requirements using IAM permissions
6. Set up aws-ebs-csi-driver addon that provisions encrypted EBS volumes with GP3 storage class as default for persistent pod storage
7. Implement network segmentation where each node group connects through dedicated VPC subnets with security groups controlling inter-node communication
8. Enable control plane logging that streams api, audit, authenticator, controllerManager, and scheduler logs to CloudWatch for monitoring
9. Configure KMS encryption that protects EKS secrets stored in etcd with customer-managed key rotation enabled
10. Set up aws-load-balancer-controller that creates ALB and NLB resources when Kubernetes ingress and service objects are deployed, using IAM role for provisioning

## Optional Enhancements

If time permits, consider implementing:

- Add AWS Systems Manager Session Manager for node access - eliminates SSH key management
- Implement Karpenter for advanced autoscaling - improves cost optimization and scaling speed
- Add Amazon GuardDuty EKS Protection - provides runtime threat detection

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

**CRITICAL**: All resources MUST be destroyable without manual intervention:
- No Terraform `prevent_destroy` lifecycle rules
- Use `skip_final_snapshot = true` for any database resources
- No DeletionProtection settings enabled
- All S3 buckets must allow force_destroy

## Environment Suffix Requirement

**CRITICAL**: ALL resource names MUST include the environment_suffix variable:
- Pattern: resource-name concatenated with var.environment_suffix
- Example: eks-cluster-pr123 where pr123 is the environment suffix
- This prevents resource conflicts in parallel deployments

## Expected Output

Complete Terraform configuration files that provision a secure, production-ready EKS cluster with multiple node groups, proper IAM roles, networking isolation, and essential add-ons. The configuration should be modular with separate files for EKS, node groups, IAM, and add-ons.

## AWS Services Used

- Amazon EKS for managed Kubernetes control plane
- Amazon EC2 for worker node compute instances
- Amazon VPC for network isolation and subnets
- AWS IAM for service account role bindings
- AWS KMS for secrets encryption
- Amazon EBS for persistent volume storage

## File Structure

Your implementation should include:

```
lib/
├── main.tf                 # Main Terraform configuration
├── variables.tf            # Variable definitions
├── outputs.tf              # Output definitions
├── versions.tf             # Terraform and provider versions
├── eks.tf                  # EKS cluster configuration
├── node-groups.tf          # Managed node group configurations
├── iam.tf                  # IAM roles and policies
├── networking.tf           # VPC and subnet configurations
├── addons.tf               # EKS addons - CSI driver and load balancer controller
├── security.tf             # Security groups and KMS keys
└── backend.tf              # S3 backend configuration
```

## Success Criteria

The infrastructure should:
1. Deploy successfully without manual intervention
2. Pass all validation checks for security and best practices
3. Be fully destroyable without leaving orphaned resources
4. Support parallel deployments with environment_suffix
5. Follow Terraform best practices for modularity and maintainability
6. Include comprehensive documentation in outputs
