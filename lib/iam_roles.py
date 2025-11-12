from constructs import Construct
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
import json


class IamRoles(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):  # pylint: disable=redefined-builtin
        super().__init__(scope, id)

        # EKS Cluster IAM Role
        self.cluster_role = IamRole(self, "eks_cluster_role",
            name=f"eks-cluster-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "eks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"eks-cluster-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Attach required policies to cluster role
        IamRolePolicyAttachment(self, "cluster_policy",
            role=self.cluster_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
        )

        IamRolePolicyAttachment(self, "vpc_resource_controller",
            role=self.cluster_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
        )

        # EKS Node Group IAM Role
        self.node_role = IamRole(self, "eks_node_role",
            name=f"eks-node-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"eks-node-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Attach required policies to node role
        IamRolePolicyAttachment(self, "worker_node_policy",
            role=self.node_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
        )

        IamRolePolicyAttachment(self, "cni_policy",
            role=self.node_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
        )

        IamRolePolicyAttachment(self, "container_registry_policy",
            role=self.node_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
        )

        # Cluster Autoscaler Policy
        autoscaler_policy = IamPolicy(self, "autoscaler_policy",
            name=f"eks-autoscaler-policy-{environment_suffix}",
            description="Policy for EKS cluster autoscaler",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "autoscaling:DescribeAutoScalingGroups",
                            "autoscaling:DescribeAutoScalingInstances",
                            "autoscaling:DescribeLaunchConfigurations",
                            "autoscaling:DescribeScalingActivities",
                            "autoscaling:DescribeTags",
                            "ec2:DescribeInstanceTypes",
                            "ec2:DescribeLaunchTemplateVersions"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "autoscaling:SetDesiredCapacity",
                            "autoscaling:TerminateInstanceInAutoScalingGroup",
                            "ec2:DescribeImages",
                            "ec2:GetInstanceTypesFromInstanceRequirements",
                            "eks:DescribeNodegroup"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        IamRolePolicyAttachment(self, "autoscaler_policy_attachment",
            role=self.node_role.name,
            policy_arn=autoscaler_policy.arn
        )

    @property
    def cluster_role_arn(self) -> str:
        return self.cluster_role.arn

    @property
    def node_role_arn(self) -> str:
        return self.node_role.arn
