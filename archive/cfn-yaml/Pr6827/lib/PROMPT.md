Create a single, production-grade CloudFormation YAML template that fully automates provisioning of a complete Amazon EKS environment without any manual steps. The template must satisfy all requirements below and include Lambda-backed custom resources to perform Kubernetes-level tasks that CloudFormation cannot do natively.

GLOBAL REQUIREMENTS
Cross-Account Compatibility

Must work in any AWS account or region without modification.

No hardcoded ARNs, account IDs, or region names.

No Hardcoding

All configurable values must be Parameters.

Use dynamic references and intrinsic functions.

Mandatory Parameter
Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

Mandatory Naming Convention

Every resource name must follow:

${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]


Examples:

VPC → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc

Subnet → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1

Lambda → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda

NETWORKING REQUIREMENTS 

Create a full production VPC including:

1. Three Availability Zones

The template must dynamically detect the first three AZs in the Region.

2. Six Subnets

Three public subnets (one per AZ)

Three private subnets (one per AZ)

3. Routing Requirements

Public subnets must:

Have Internet Gateway

Support NAT Gateway placement

Private subnets must:

Route to NAT gateways for outbound internet

Have no direct Internet access

Host all EKS worker nodes (mandatory)

4. CIDR Requirements

VPC CIDR must be parameterized.

Public/private subnet CIDRs must be parameterized or derived.

5. Custom Networking for VPC CNI

Create and attach secondary CIDR ranges for use by CNI custom networking:

100.64.0.0/19

100.64.32.0/19

100.64.64.0/19

The Lambda must create ENIConfig objects for each AZ.

EKS CLUSTER REQUIREMENTS
Cluster

Kubernetes version 1.28+

Private endpoint only

Cluster security group must allow inbound only from a provided Bastion SG.

Control plane logging enabled for:

api

audit

authenticator

controllerManager

scheduler

CloudWatch logs must have encryption + 7-day retention.

OIDC Provider

Must be created automatically.

NODE GROUP REQUIREMENTS
On-demand node group

Name: on-demand-nodes

Instance: t3.medium

Desired/Min/Max: 2 / 2 / 4

Spot node group

Name: spot-nodes

Instance types:

t3.large

t3a.large

t2.large

Desired/Min/Max: 3 / 3 / 9

Must guarantee ≥ 50% Spot capacity

Shared node group constraints

Use Amazon Linux 2 EKS-optimized AMI

Run only in private subnets

Launch templates must:

Disable IMDSv1

Enable monitoring

Include kubelet args setting max pods per instance type

Node SGs must restrict pod-to-pod communication to required port ranges

Must include the tags required for Cluster Autoscaler

IAM REQUIREMENTS
Must create IAM roles for:

EKS cluster

Node groups

Cluster Autoscaler (IRSA)

AWS Load Balancer Controller (IRSA)

EBS CSI driver addon (IRSA)

IAM Conditions:

Least-privilege policies only

No hardcoded ARNs

OIDC provider must be dynamically connected

ADDONS REQUIREMENTS
Install the following as EKS Add-ons:

VPC CNI (custom networking enabled)

EBS CSI Driver

Must use encryption-by-default via a parameterized KMS key

LAMBDA-BACKED CUSTOM RESOURCE REQUIREMENTS

A Lambda function (Python 3.11) must perform:

Retrieve OIDC issuer + thumbprint dynamically

Generate kubeconfig from cluster CA and endpoint

Create ENIConfig Kubernetes CRDs per AZ

Patch VPC CNI ConfigMap to enable custom networking

Install:

Cluster Autoscaler

AWS Load Balancer Controller

Create service accounts + IRSA annotations

Annotate worker nodes with ENIConfig per AZ

Validate addon + controller readiness

Return success/failure to CloudFormation

The Lambda must follow the required naming convention.

OUTPUTS REQUIRED

OIDC Issuer URL

Thumbprint

Cluster endpoint

CA data

Node group role ARNs

Autoscaler role ARN

ALB Controller role ARN

EBS CSI role ARN

VPC ID

Private Subnet IDs

Public Subnet IDs

DELIVERABLES

Return:

1. A single CloudFormation YAML file

Validates successfully

No hardcoded values

Deploys entire environment end-to-end

Includes VPC, subnets, NAT, EKS, addons, IAM, Lambda, and custom resources