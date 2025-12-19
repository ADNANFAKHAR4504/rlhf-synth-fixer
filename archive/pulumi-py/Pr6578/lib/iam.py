"""IAM Module for EKS Cluster and Node Groups.

This module creates IAM roles and policies for EKS cluster, node groups,
Cluster Autoscaler, ALB Controller, and tenant-specific IRSA roles.
"""

import pulumi
import pulumi_aws as aws
import json


def create_eks_cluster_role(environment_suffix: str) -> aws.iam.Role:
    """
    Create IAM role for EKS cluster.

    Args:
        environment_suffix: Unique suffix for resource naming

    Returns:
        IAM Role for EKS cluster
    """
    assume_role_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "eks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }

    cluster_role = aws.iam.Role(
        f"eks-cluster-role-{environment_suffix}",
        assume_role_policy=json.dumps(assume_role_policy),
        tags={
            "Name": f"eks-cluster-role-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    # Attach required policies
    aws.iam.RolePolicyAttachment(
        f"eks-cluster-policy-{environment_suffix}",
        role=cluster_role.name,
        policy_arn="arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
    )

    aws.iam.RolePolicyAttachment(
        f"eks-vpc-resource-controller-{environment_suffix}",
        role=cluster_role.name,
        policy_arn="arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
    )

    return cluster_role


def create_eks_node_role(environment_suffix: str) -> aws.iam.Role:
    """
    Create IAM role for EKS node groups.

    Args:
        environment_suffix: Unique suffix for resource naming

    Returns:
        IAM Role for EKS nodes
    """
    assume_role_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ec2.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }

    node_role = aws.iam.Role(
        f"eks-node-role-{environment_suffix}",
        assume_role_policy=json.dumps(assume_role_policy),
        tags={
            "Name": f"eks-node-role-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    # Attach required policies
    aws.iam.RolePolicyAttachment(
        f"eks-worker-node-policy-{environment_suffix}",
        role=node_role.name,
        policy_arn="arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
    )

    aws.iam.RolePolicyAttachment(
        f"eks-cni-policy-{environment_suffix}",
        role=node_role.name,
        policy_arn="arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
    )

    aws.iam.RolePolicyAttachment(
        f"eks-container-registry-policy-{environment_suffix}",
        role=node_role.name,
        policy_arn="arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
    )

    aws.iam.RolePolicyAttachment(
        f"eks-ssm-managed-instance-core-{environment_suffix}",
        role=node_role.name,
        policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    )

    # CloudWatch permissions for Container Insights
    cloudwatch_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "cloudwatch:PutMetricData",
                    "ec2:DescribeVolumes",
                    "ec2:DescribeTags",
                    "logs:PutLogEvents",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:DescribeLogStreams"
                ],
                "Resource": "*"
            }
        ]
    }

    cloudwatch_iam_policy = aws.iam.Policy(
        f"eks-node-cloudwatch-policy-{environment_suffix}",
        policy=json.dumps(cloudwatch_policy),
        tags={
            "Name": f"eks-node-cloudwatch-policy-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    aws.iam.RolePolicyAttachment(
        f"eks-node-cloudwatch-attachment-{environment_suffix}",
        role=node_role.name,
        policy_arn=cloudwatch_iam_policy.arn
    )

    return node_role


def create_cluster_autoscaler_role(
    environment_suffix: str,
    oidc_provider_arn: pulumi.Output[str],
    oidc_provider_url: pulumi.Output[str],
    cluster_name: str
) -> aws.iam.Role:
    """
    Create IAM role for Cluster Autoscaler with IRSA.

    Args:
        environment_suffix: Unique suffix for resource naming
        oidc_provider_arn: ARN of OIDC provider
        oidc_provider_url: URL of OIDC provider
        cluster_name: Name of EKS cluster

    Returns:
        IAM Role for Cluster Autoscaler
    """
    def create_trust_policy(args):
        oidc_url = args[0]
        return json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Federated": args[1]
                    },
                    "Action": "sts:AssumeRoleWithWebIdentity",
                    "Condition": {
                        "StringEquals": {
                            f"{oidc_url}:sub": "system:serviceaccount:kube-system:cluster-autoscaler",
                            f"{oidc_url}:aud": "sts.amazonaws.com"
                        }
                    }
                }
            ]
        })

    autoscaler_role = aws.iam.Role(
        f"eks-cluster-autoscaler-role-{environment_suffix}",
        assume_role_policy=pulumi.Output.all(
            oidc_provider_url,
            oidc_provider_arn
        ).apply(create_trust_policy),
        tags={
            "Name": f"eks-cluster-autoscaler-role-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    # Cluster Autoscaler policy
    autoscaler_policy = {
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
    }

    autoscaler_iam_policy = aws.iam.Policy(
        f"eks-cluster-autoscaler-policy-{environment_suffix}",
        policy=json.dumps(autoscaler_policy),
        tags={
            "Name": f"eks-cluster-autoscaler-policy-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    aws.iam.RolePolicyAttachment(
        f"eks-cluster-autoscaler-attachment-{environment_suffix}",
        role=autoscaler_role.name,
        policy_arn=autoscaler_iam_policy.arn
    )

    return autoscaler_role


def create_alb_controller_role(
    environment_suffix: str,
    oidc_provider_arn: pulumi.Output[str],
    oidc_provider_url: pulumi.Output[str]
) -> aws.iam.Role:
    """
    Create IAM role for AWS Load Balancer Controller with IRSA.

    Args:
        environment_suffix: Unique suffix for resource naming
        oidc_provider_arn: ARN of OIDC provider
        oidc_provider_url: URL of OIDC provider

    Returns:
        IAM Role for ALB Controller
    """
    def create_trust_policy(args):
        oidc_url = args[0]
        return json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Federated": args[1]
                    },
                    "Action": "sts:AssumeRoleWithWebIdentity",
                    "Condition": {
                        "StringEquals": {
                            f"{oidc_url}:sub": "system:serviceaccount:kube-system:aws-load-balancer-controller",
                            f"{oidc_url}:aud": "sts.amazonaws.com"
                        }
                    }
                }
            ]
        })

    alb_role = aws.iam.Role(
        f"eks-alb-controller-role-{environment_suffix}",
        assume_role_policy=pulumi.Output.all(
            oidc_provider_url,
            oidc_provider_arn
        ).apply(create_trust_policy),
        tags={
            "Name": f"eks-alb-controller-role-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    # ALB Controller policy (comprehensive permissions)
    alb_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "iam:CreateServiceLinkedRole"
                ],
                "Resource": "*",
                "Condition": {
                    "StringEquals": {
                        "iam:AWSServiceName": "elasticloadbalancing.amazonaws.com"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:DescribeAccountAttributes",
                    "ec2:DescribeAddresses",
                    "ec2:DescribeAvailabilityZones",
                    "ec2:DescribeInternetGateways",
                    "ec2:DescribeVpcs",
                    "ec2:DescribeVpcPeeringConnections",
                    "ec2:DescribeSubnets",
                    "ec2:DescribeSecurityGroups",
                    "ec2:DescribeInstances",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DescribeTags",
                    "ec2:GetCoipPoolUsage",
                    "ec2:DescribeCoipPools",
                    "elasticloadbalancing:DescribeLoadBalancers",
                    "elasticloadbalancing:DescribeLoadBalancerAttributes",
                    "elasticloadbalancing:DescribeListeners",
                    "elasticloadbalancing:DescribeListenerCertificates",
                    "elasticloadbalancing:DescribeSSLPolicies",
                    "elasticloadbalancing:DescribeRules",
                    "elasticloadbalancing:DescribeTargetGroups",
                    "elasticloadbalancing:DescribeTargetGroupAttributes",
                    "elasticloadbalancing:DescribeTargetHealth",
                    "elasticloadbalancing:DescribeTags"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "cognito-idp:DescribeUserPoolClient",
                    "acm:ListCertificates",
                    "acm:DescribeCertificate",
                    "iam:ListServerCertificates",
                    "iam:GetServerCertificate",
                    "waf-regional:GetWebACL",
                    "waf-regional:GetWebACLForResource",
                    "waf-regional:AssociateWebACL",
                    "waf-regional:DisassociateWebACL",
                    "wafv2:GetWebACL",
                    "wafv2:GetWebACLForResource",
                    "wafv2:AssociateWebACL",
                    "wafv2:DisassociateWebACL",
                    "shield:GetSubscriptionState",
                    "shield:DescribeProtection",
                    "shield:CreateProtection",
                    "shield:DeleteProtection"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupIngress",
                    "ec2:CreateSecurityGroup"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:CreateTags"
                ],
                "Resource": "arn:aws:ec2:*:*:security-group/*",
                "Condition": {
                    "StringEquals": {
                        "ec2:CreateAction": "CreateSecurityGroup"
                    },
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:CreateTags",
                    "ec2:DeleteTags"
                ],
                "Resource": "arn:aws:ec2:*:*:security-group/*",
                "Condition": {
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "true",
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupIngress",
                    "ec2:DeleteSecurityGroup"
                ],
                "Resource": "*",
                "Condition": {
                    "Null": {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:CreateLoadBalancer",
                    "elasticloadbalancing:CreateTargetGroup"
                ],
                "Resource": "*",
                "Condition": {
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:CreateListener",
                    "elasticloadbalancing:DeleteListener",
                    "elasticloadbalancing:CreateRule",
                    "elasticloadbalancing:DeleteRule"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:RemoveTags"
                ],
                "Resource": [
                    "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
                    "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
                    "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*"
                ],
                "Condition": {
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "true",
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:RemoveTags"
                ],
                "Resource": [
                    "arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*",
                    "arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*",
                    "arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*",
                    "arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*"
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:ModifyLoadBalancerAttributes",
                    "elasticloadbalancing:SetIpAddressType",
                    "elasticloadbalancing:SetSecurityGroups",
                    "elasticloadbalancing:SetSubnets",
                    "elasticloadbalancing:DeleteLoadBalancer",
                    "elasticloadbalancing:ModifyTargetGroup",
                    "elasticloadbalancing:ModifyTargetGroupAttributes",
                    "elasticloadbalancing:DeleteTargetGroup"
                ],
                "Resource": "*",
                "Condition": {
                    "Null": {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:RegisterTargets",
                    "elasticloadbalancing:DeregisterTargets"
                ],
                "Resource": "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:SetWebAcl",
                    "elasticloadbalancing:ModifyListener",
                    "elasticloadbalancing:AddListenerCertificates",
                    "elasticloadbalancing:RemoveListenerCertificates",
                    "elasticloadbalancing:ModifyRule"
                ],
                "Resource": "*"
            }
        ]
    }

    alb_iam_policy = aws.iam.Policy(
        f"eks-alb-controller-policy-{environment_suffix}",
        policy=json.dumps(alb_policy),
        tags={
            "Name": f"eks-alb-controller-policy-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    aws.iam.RolePolicyAttachment(
        f"eks-alb-controller-attachment-{environment_suffix}",
        role=alb_role.name,
        policy_arn=alb_iam_policy.arn
    )

    return alb_role


def create_tenant_irsa_role(
    tenant_name: str,
    environment_suffix: str,
    oidc_provider_arn: pulumi.Output[str],
    oidc_provider_url: pulumi.Output[str],
    s3_bucket_name: pulumi.Output[str]
) -> aws.iam.Role:
    """
    Create IAM role for tenant namespace with S3 access.

    Args:
        tenant_name: Name of the tenant (e.g., 'tenant-a')
        environment_suffix: Unique suffix for resource naming
        oidc_provider_arn: ARN of OIDC provider
        oidc_provider_url: URL of OIDC provider
        s3_bucket_name: S3 bucket name for tenant access (Output)

    Returns:
        IAM Role for tenant
    """
    def create_trust_policy(args):
        oidc_url = args[0]
        return json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Federated": args[1]
                    },
                    "Action": "sts:AssumeRoleWithWebIdentity",
                    "Condition": {
                        "StringEquals": {
                            f"{oidc_url}:sub": f"system:serviceaccount:{tenant_name}:{tenant_name}-sa",
                            f"{oidc_url}:aud": "sts.amazonaws.com"
                        }
                    }
                }
            ]
        })

    tenant_role = aws.iam.Role(
        f"eks-{tenant_name}-role-{environment_suffix}",
        assume_role_policy=pulumi.Output.all(
            oidc_provider_url,
            oidc_provider_arn
        ).apply(create_trust_policy),
        tags={
            "Name": f"eks-{tenant_name}-role-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
            "Tenant": tenant_name,
        }
    )

    # S3 policy for tenant-specific prefix
    def create_s3_policy(bucket_name):
        return json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": f"arn:aws:s3:::{bucket_name}",
                    "Condition": {
                        "StringLike": {
                            "s3:prefix": [f"{tenant_name}/*"]
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    "Resource": f"arn:aws:s3:::{bucket_name}/{tenant_name}/*"
                }
            ]
        })

    tenant_iam_policy = aws.iam.Policy(
        f"eks-{tenant_name}-s3-policy-{environment_suffix}",
        policy=s3_bucket_name.apply(create_s3_policy),
        tags={
            "Name": f"eks-{tenant_name}-s3-policy-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
            "Tenant": tenant_name,
        }
    )

    aws.iam.RolePolicyAttachment(
        f"eks-{tenant_name}-attachment-{environment_suffix}",
        role=tenant_role.name,
        policy_arn=tenant_iam_policy.arn
    )

    return tenant_role
