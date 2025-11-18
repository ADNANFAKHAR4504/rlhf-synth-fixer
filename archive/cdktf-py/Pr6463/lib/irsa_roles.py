from constructs import Construct
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
import json


class IrsaRolesConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 oidc_provider_arn: str, oidc_provider_url: str):
        super().__init__(scope, id)

        # Extract OIDC provider ID from URL
        oidc_provider_id = oidc_provider_url.replace("https://", "")

        # Cluster Autoscaler IRSA Role
        # Error: Incorrect condition key
        autoscaler_assume_role = DataAwsIamPolicyDocument(self, "autoscaler-assume",
            statement=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Federated",
                    "identifiers": [oidc_provider_arn]
                }],
                "actions": ["sts:AssumeRoleWithWebIdentity"],
                "condition": [{
                    "test": "StringEquals",
                    "variable": f"{oidc_provider_id}:sub",  # Error: Should use :aud for service account
                    "values": ["system:serviceaccount:kube-system:cluster-autoscaler"]
                }]
            }]
        )

        self.autoscaler_role = IamRole(self, "autoscaler-role",
            name=f"eks-cluster-autoscaler-{environment_suffix}",
            assume_role_policy=autoscaler_assume_role.json
        )

        # Cluster Autoscaler Policy with least privilege permissions
        autoscaler_policy = IamPolicy(self, "autoscaler-policy",
            name=f"eks-cluster-autoscaler-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "autoscaling:DescribeAutoScalingGroups",
                        "autoscaling:DescribeAutoScalingInstances",
                        "autoscaling:DescribeLaunchConfigurations",
                        "autoscaling:DescribeScalingActivities",
                        "autoscaling:DescribeTags",
                        "autoscaling:SetDesiredCapacity",
                        "autoscaling:TerminateInstanceInAutoScalingGroup",
                        "ec2:DescribeImages",
                        "ec2:DescribeInstanceTypes",
                        "ec2:DescribeLaunchTemplateVersions",
                        "ec2:GetInstanceTypesFromInstanceRequirements",
                        "eks:DescribeNodegroup"
                    ],
                    "Resource": "*"
                }]
            })
        )

        IamRolePolicyAttachment(self, "autoscaler-policy-attach",
            role=self.autoscaler_role.name,
            policy_arn=autoscaler_policy.arn
        )

        # AWS Load Balancer Controller IRSA Role
        alb_assume_role = DataAwsIamPolicyDocument(self, "alb-assume",
            statement=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Federated",
                    "identifiers": [oidc_provider_arn]
                }],
                "actions": ["sts:AssumeRoleWithWebIdentity"],
                "condition": [{
                    "test": "StringEquals",
                    "variable": f"{oidc_provider_id}:sub",
                    "values": ["system:serviceaccount:kube-system:aws-load-balancer-controller"]
                }]
            }]
        )

        self.alb_role = IamRole(self, "alb-role",
            name=f"eks-alb-controller-{environment_suffix}",
            assume_role_policy=alb_assume_role.json
        )

        # ALB Controller Policy with refined permissions
        alb_policy = IamPolicy(self, "alb-policy",
            name=f"eks-alb-controller-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "elasticloadbalancing:CreateLoadBalancer",
                        "elasticloadbalancing:CreateTargetGroup",
                        "elasticloadbalancing:CreateListener",
                        "elasticloadbalancing:DeleteListener",
                        "elasticloadbalancing:CreateRule",
                        "elasticloadbalancing:DeleteRule",
                        "elasticloadbalancing:DescribeLoadBalancers",
                        "elasticloadbalancing:DescribeTargetGroups",
                        "elasticloadbalancing:DescribeListeners",
                        "elasticloadbalancing:DescribeRules",
                        "elasticloadbalancing:ModifyLoadBalancerAttributes",
                        "elasticloadbalancing:ModifyTargetGroup",
                        "elasticloadbalancing:ModifyTargetGroupAttributes",
                        "elasticloadbalancing:RegisterTargets",
                        "elasticloadbalancing:DeregisterTargets",
                        "elasticloadbalancing:SetSecurityGroups",
                        "elasticloadbalancing:SetSubnets",
                        "elasticloadbalancing:DeleteLoadBalancer",
                        "elasticloadbalancing:DeleteTargetGroup",
                        "ec2:DescribeVpcs",
                        "ec2:DescribeSubnets",
                        "ec2:DescribeSecurityGroups",
                        "ec2:CreateSecurityGroup",
                        "ec2:DeleteSecurityGroup",
                        "ec2:AuthorizeSecurityGroupIngress",
                        "ec2:RevokeSecurityGroupIngress",
                        "ec2:CreateTags",
                        "ec2:DeleteTags",
                        "ec2:DescribeInstances",
                        "ec2:DescribeInstanceStatus",
                        "ec2:DescribeNetworkInterfaces",
                        "ec2:DescribeAvailabilityZones"
                    ],
                    "Resource": "*"
                }]
            })
        )

        IamRolePolicyAttachment(self, "alb-policy-attach",
            role=self.alb_role.name,
            policy_arn=alb_policy.arn
        )

        # External DNS IRSA Role
        external_dns_assume_role = DataAwsIamPolicyDocument(self, "external-dns-assume",
            statement=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Federated",
                    "identifiers": [oidc_provider_arn]
                }],
                "actions": ["sts:AssumeRoleWithWebIdentity"],
                "condition": [{
                    "test": "StringEquals",
                    "variable": f"{oidc_provider_id}:sub",
                    "values": ["system:serviceaccount:kube-system:external-dns"]
                }]
            }]
        )

        self.external_dns_role = IamRole(self, "external-dns-role",
            name=f"eks-external-dns-{environment_suffix}",
            assume_role_policy=external_dns_assume_role.json
        )

        external_dns_policy = IamPolicy(self, "external-dns-policy",
            name=f"eks-external-dns-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "route53:ChangeResourceRecordSets",
                        "route53:ListHostedZones",
                        "route53:ListResourceRecordSets"
                    ],
                    "Resource": "*"
                }]
            })
        )

        IamRolePolicyAttachment(self, "external-dns-policy-attach",
            role=self.external_dns_role.name,
            policy_arn=external_dns_policy.arn
        )

        # EBS CSI Driver IRSA Role
        ebs_csi_assume_role = DataAwsIamPolicyDocument(self, "ebs-csi-assume",
            statement=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Federated",
                    "identifiers": [oidc_provider_arn]
                }],
                "actions": ["sts:AssumeRoleWithWebIdentity"],
                "condition": [{
                    "test": "StringEquals",
                    "variable": f"{oidc_provider_id}:sub",
                    "values": ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
                }]
            }]
        )

        self.ebs_csi_role = IamRole(self, "ebs-csi-role",
            name=f"eks-ebs-csi-driver-{environment_suffix}",
            assume_role_policy=ebs_csi_assume_role.json
        )

        # Attach AWS managed policy for EBS CSI Driver
        IamRolePolicyAttachment(self, "ebs-csi-policy-attach",
            role=self.ebs_csi_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
        )

    @property
    def ebs_csi_role_arn(self):
        return self.ebs_csi_role.arn

    @property
    def autoscaler_role_arn(self):
        return self.autoscaler_role.arn

    @property
    def alb_controller_role_arn(self):
        return self.alb_role.arn

    @property
    def external_dns_role_arn(self):
        return self.external_dns_role.arn
