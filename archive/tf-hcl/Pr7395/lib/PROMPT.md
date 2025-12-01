Create a complete Terraform configuration that deploys a production-ready EKS setup. The configuration must:

Create an EKS cluster named prod-eks-cluster using Kubernetes 1.28.

Configure two managed node groups:

critical: 3–10 nodes, instance type m5.large, uses Bottlerocket, includes correct user data.

general: 2–20 nodes, mixed instances (m5.large and m5.xlarge), also using Bottlerocket with proper user data.

Enable IRSA by creating an OIDC provider for the cluster.

Install and configure EKS add-ons:

vpc-cni (version 1.14.0 or higher)

coredns

kube-proxy

Configure the vpc-cni add-on with:

ENABLE_PREFIX_DELEGATION=true

WARM_PREFIX_TARGET=1

Create an IAM role and policy for cluster autoscaler, granting all required permissions.

Use an existing VPC (ID: vpc-12345) with three existing private subnets (subnet-abc123, subnet-def456, subnet-ghi789).

Add security group rules allowing node-to-node communication on all ports.

Enable control plane logging for:

api

audit

authenticator

controllerManager

scheduler

Add node group labels:

critical → nodegroup-type=critical

general → nodegroup-type=general

Add taint to the critical node group:

dedicated=critical:NoSchedule

Output the cluster endpoint, certificate authority data, and OIDC provider URL.

Make the configuration modular, with variables and outputs suitable for integration with other components.

Apply standard tags: Environment, Team, CostCenter.

Do not specify a particular AWS region; the config should work in any region.

Provide the full Terraform code (Terraform 1.5+ and AWS provider 5.0+), structured clearly and without adding any requirements beyond what is listed here.