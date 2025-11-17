Generate a single AWS CloudFormation YAML template that deploys a production-ready Amazon EKS cluster with all supporting resources — fully automated (no manual steps required). The template must include a Lambda-backed custom resource that dynamically fetches the cluster’s OIDC issuer URL and TLS thumbprint, creates the IAM OIDC provider, and integrates it automatically for IRSA (IAM Roles for Service Accounts).

🧱 Functional Requirements

Task Summary:

Create an EKS cluster (Kubernetes version ≥ 1.28) with private API endpoint access only.

Configure the OIDC provider dynamically using a custom Lambda function (no hardcoding, no manual commands).

Deploy two managed node groups:

system: instance type t3.medium, min=2, max=6

application: instance type t3.large, min=3, max=10

All worker nodes must use Bottlerocket AMIs with proper configuration.

Each node group must have its own dedicated IAM role with only required worker node policies.

Enable CloudWatch Container Insights (metrics, logs, performance monitoring) using amazon-cloudwatch-observability EKS add-on.

Configure Cluster Autoscaler IAM policy and attach it to the system node group role.

Create security groups allowing:

Inter-node communication on all ports (node SG ↔ node SG)

Ingress from load balancers on ports 80 and 443

Apply global tags to all resources:

Environment=Production

ManagedBy=CloudFormation

Output:

EKS cluster endpoint

OIDC issuer URL

IAM role ARNs for both node groups (for application deployment)

⚙️ Implementation Constraints
1. Cross-Account & Cross-Region Compatibility

No hardcoded ARNs, account IDs, or regions.

Use parameters or intrinsic functions (!Sub, !Ref, !GetAtt) for all dynamic references.

Ensure the template runs without modification in any AWS account or region that supports EKS 1.28+ and Bottlerocket.

2. Parameters

Include at least these parameters (others as needed):

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'


Also parameterize:

ClusterName

KubernetesVersion (default 1.28)

VpcCidr

NodeInstanceTypes (default: t3.medium / t3.large)

Desired/Min/Max sizes

Environment (default: Production)

Region (use pseudo parameter)

KeyName (optional, for SSH access if desired)

3. Naming Convention

All resource names must follow this pattern:

Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"


Examples:

VPC → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc

Private Subnet → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1

Lambda → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda

4. Lambda-based Custom Resource (OIDC Automation)

Implement an inline or referenced Lambda function (Python 3.11 preferred) to:

Wait until the EKS cluster reaches ACTIVE.

Use boto3.client('eks') to call describe_cluster().

Extract the cluster’s identity.oidc.issuer URL.

Retrieve the TLS thumbprint for that URL.

Create the OIDC provider using:

iam.create_open_id_connect_provider(
    Url=issuer_url,
    ClientIDList=["sts.amazonaws.com"],
    ThumbprintList=[thumbprint],
    Tags=[{'Key':'ManagedBy','Value':'CloudFormation'}]
)


Return:

OIDC issuer URL

OIDC provider ARN

Set up DependsOn so this Lambda runs after the EKS cluster is created.

The Lambda must have an execution role with these minimum permissions:

eks:DescribeCluster

iam:CreateOpenIDConnectProvider

iam:DeleteOpenIDConnectProvider

iam:TagOpenIDConnectProvider

logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents

5. Node Groups

system and application node groups defined using AWS::EKS::Nodegroup.

Each references its own IAM role with only:

AmazonEKSWorkerNodePolicy

AmazonEC2ContainerRegistryReadOnly

(Optionally) AmazonEKS_CNI_Policy

Bottlerocket AMI via AmiType: BOTTLEROCKET_x86_64

Each spans exactly 3 private subnets (parameterize subnet list).

6. Security Groups

Allow full traffic between nodes (self-reference rule).

Allow inbound 80/443 from load balancer SG.

Tag all SGs using the naming pattern and global tags.

7. CloudWatch Container Insights

Use AWS::EKS::Addon with:

AddonName: amazon-cloudwatch-observability

AddonVersion parameterized

Add required IAM role with CloudWatchAgentServerPolicy.

8. Cluster Autoscaler

Create a custom IAM policy for autoscaler:

autoscaling:Describe*, autoscaling:SetDesiredCapacity, autoscaling:TerminateInstanceInAutoScalingGroup, ec2:Describe*

Attach to the system node group IAM role.

9. Outputs

Provide at least these outputs:

Outputs:
  ClusterEndpoint:
    Description: "EKS Cluster private endpoint"
    Value: !GetAtt EKSCluster.Endpoint
  OIDCIssuerURL:
    Description: "OIDC Issuer URL for IRSA"
    Value: !GetAtt OIDCProviderCustomResource.OIDCIssuer
  SystemNodeRoleARN:
    Description: "IAM Role ARN for system node group"
    Value: !GetAtt SystemNodeRole.Arn
  ApplicationNodeRoleARN:
    Description: "IAM Role ARN for application node group"
    Value: !GetAtt ApplicationNodeRole.Arn

Expected Deliverable

A single CloudFormation YAML file that includes:

Parameters and metadata as described above

VPC, subnets, and routing (minimal HA setup)

Security groups

IAM roles and policies (cluster, nodegroups, autoscaler, CloudWatch add-on, Lambda execution)

Lambda function (inline or separate AWS::Lambda::Function with AWS::Lambda::Permission for CFN)

Custom resource that creates OIDC provider automatically

EKS cluster resource (private API only)

Node groups (system/application with Bottlerocket)

CloudWatch Container Insights add-on

Outputs for endpoint, OIDC URL, and IAM role ARNs

The YAML should be:

Well-indented and production-ready

Deployable as-is using aws cloudformation deploy

Commented to explain key sections (Lambda logic, dependencies, and naming)