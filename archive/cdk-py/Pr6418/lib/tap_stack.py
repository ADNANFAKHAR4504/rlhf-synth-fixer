"""tap_stack.py

This module defines the TapStack class for EKS Payment Processing Platform.

"""

from typing import Optional

import aws_cdk as cdk

from aws_cdk import (
    aws_ec2 as ec2,
    aws_eks as eks,
    aws_iam as iam,
    aws_kms as kms,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    CfnOutput,
    Tags,
)

from aws_cdk.lambda_layer_kubectl_v29 import KubectlV29Layer
from constructs import Construct

class TapStackProps(cdk.StackProps):
    """Properties for TapStack."""
    
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix

class TapStack(cdk.Stack):
    """Main CDK stack for EKS Payment Processing Platform."""
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)
        
        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"
        self.environment_suffix = environment_suffix
        
        # Create KMS key for EKS secrets encryption
        kms_key = kms.Key(
            self,
            f"EKSSecretsKey-{environment_suffix}",
            description=f"KMS key for EKS secrets encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )
        
        # Create VPC with 3 AZs
        vpc = ec2.Vpc(
            self,
            f"PaymentVPC-{environment_suffix}",
            max_azs=3,
            nat_gateways=3,
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
        )
        
        # Tag subnets for EKS and load balancer discovery
        for subnet in vpc.public_subnets:
            Tags.of(subnet).add("kubernetes.io/role/elb", "1")
            Tags.of(subnet).add(
                f"kubernetes.io/cluster/payment-eks-{environment_suffix}", "shared"
            )
        
        for subnet in vpc.private_subnets:
            Tags.of(subnet).add("kubernetes.io/role/internal-elb", "1")
            Tags.of(subnet).add(
                f"kubernetes.io/cluster/payment-eks-{environment_suffix}", "shared"
            )
        
        # Create CloudWatch log group for EKS audit logs
        log_group = logs.LogGroup(
            self,
            f"EKSAuditLogs-{environment_suffix}",
            log_group_name=f"/aws/eks/payment-eks-{environment_suffix}/audit",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=cdk.RemovalPolicy.DESTROY,
        )
        
        # Create EKS cluster admin role
        cluster_admin_role = iam.Role(
            self,
            f"EKSAdminRole-{environment_suffix}",
            assumed_by=iam.AccountRootPrincipal(),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonEKSClusterPolicy"
                )
            ],
        )
        
        # Create EKS cluster with Kubernetes 1.29
        cluster = eks.Cluster(
            self,
            f"PaymentEKS-{environment_suffix}",
            cluster_name=f"payment-eks-{environment_suffix}",
            version=eks.KubernetesVersion.V1_29,
            vpc=vpc,
            vpc_subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)],
            default_capacity=0,  # We'll create custom node groups
            endpoint_access=eks.EndpointAccess.PRIVATE,
            cluster_logging=[
                eks.ClusterLoggingTypes.API,
                eks.ClusterLoggingTypes.AUDIT,
                eks.ClusterLoggingTypes.AUTHENTICATOR,
                eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
                eks.ClusterLoggingTypes.SCHEDULER,
            ],
            secrets_encryption_key=kms_key,
            masters_role=cluster_admin_role,
            kubectl_layer=KubectlV29Layer(self, f"KubectlLayer-{environment_suffix}"),
        )
        
        # Enable OIDC provider (automatically done by CDK for IRSA)
        # The cluster.open_id_connect_provider is created automatically
        
        # Create service account for cluster autoscaler with IRSA
        cluster_autoscaler_sa = cluster.add_service_account(
            f"ClusterAutoscalerSA-{environment_suffix}",
            name="cluster-autoscaler",
            namespace="kube-system",
        )
        
        cluster_autoscaler_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "autoscaling:DescribeAutoScalingGroups",
                    "autoscaling:DescribeAutoScalingInstances",
                    "autoscaling:DescribeLaunchConfigurations",
                    "autoscaling:DescribeScalingActivities",
                    "autoscaling:SetDesiredCapacity",
                    "autoscaling:TerminateInstanceInAutoScalingGroup",
                    "ec2:DescribeInstanceTypes",
                    "ec2:DescribeLaunchTemplateVersions",
                    "eks:DescribeNodegroup",
                ],
                resources=["*"],
            )
        )
        
        # Create service account for AWS Load Balancer Controller with IRSA
        alb_controller_sa = cluster.add_service_account(
            f"ALBControllerSA-{environment_suffix}",
            name="aws-load-balancer-controller",
            namespace="kube-system",
        )
        
        # Add AWS Load Balancer Controller policies (using inline policies instead of managed policy)
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "iam:CreateServiceLinkedRole",
                ],
                resources=["*"],
                conditions={
                    "StringEquals": {
                        "iam:AWSServiceName": "elasticloadbalancing.amazonaws.com"
                    }
                },
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
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
                    "elasticloadbalancing:DescribeTags",
                ],
                resources=["*"],
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
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
                    "shield:DeleteProtection",
                ],
                resources=["*"],
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupIngress",
                    "ec2:CreateSecurityGroup",
                ],
                resources=["*"],
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=["ec2:CreateTags"],
                resources=["arn:aws:ec2:*:*:security-group/*"],
                conditions={
                    "StringEquals": {
                        "ec2:CreateAction": "CreateSecurityGroup"
                    },
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "false"
                    },
                },
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "ec2:CreateTags",
                    "ec2:DeleteTags",
                ],
                resources=["arn:aws:ec2:*:*:security-group/*"],
                conditions={
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "true",
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                },
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupIngress",
                    "ec2:DeleteSecurityGroup",
                ],
                resources=["*"],
                conditions={
                    "Null": {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                },
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "elasticloadbalancing:CreateLoadBalancer",
                    "elasticloadbalancing:CreateTargetGroup",
                ],
                resources=["*"],
                conditions={
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "false"
                    }
                },
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "elasticloadbalancing:CreateListener",
                    "elasticloadbalancing:DeleteListener",
                    "elasticloadbalancing:CreateRule",
                    "elasticloadbalancing:DeleteRule",
                ],
                resources=["*"],
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:RemoveTags",
                ],
                resources=[
                    "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
                    "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
                    "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*",
                ],
                conditions={
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "true",
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                },
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:RemoveTags",
                ],
                resources=[
                    "arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*",
                    "arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*",
                    "arn:aws:elasticloadancing:*:*:listener-rule/net/*/*/*",
                    "arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*",
                ],
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "elasticloadbalancing:ModifyLoadBalancerAttributes",
                    "elasticloadbalancing:SetIpAddressType",
                    "elasticloadbalancing:SetSecurityGroups",
                    "elasticloadbalancing:SetSubnets",
                    "elasticloadbalancing:DeleteLoadBalancer",
                    "elasticloadbalancing:ModifyTargetGroup",
                    "elasticloadbalancing:ModifyTargetGroupAttributes",
                    "elasticloadbalancing:DeleteTargetGroup",
                ],
                resources=["*"],
                conditions={
                    "Null": {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                },
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "elasticloadbalancing:AddTags",
                ],
                resources=[
                    "arn:aws:elasticloadbalancing:*:*:targetgroup/*/*",
                    "arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*",
                    "arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*",
                ],
                conditions={
                    "StringEquals": {
                        "elasticloadbalancing:CreateAction": [
                            "CreateTargetGroup",
                            "CreateLoadBalancer"
                        ]
                    },
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "false"
                    }
                },
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "elasticloadbalancing:RegisterTargets",
                    "elasticloadbalancing:DeregisterTargets",
                ],
                resources=["arn:aws:elasticloadbalancing:*:*:targetgroup/*/*"],
            )
        )
        
        alb_controller_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "elasticloadbalancing:SetWebAcl",
                    "elasticloadbalancing:ModifyListener",
                    "elasticloadbalancing:AddListenerCertificates",
                    "elasticloadbalancing:RemoveListenerCertificates",
                    "elasticloadbalancing:ModifyRule",
                ],
                resources=["*"],
            )
        )
        
        # Create service account for external secrets operator
        external_secrets_sa = cluster.add_service_account(
            f"ExternalSecretsSA-{environment_suffix}",
            name="external-secrets-operator",
            namespace="kube-system",
        )
        
        external_secrets_sa.role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret",
                    "kms:Decrypt",
                ],
                resources=["*"],
            )
        )
        
        # Configure GitHub Actions OIDC provider
        github_provider = iam.OpenIdConnectProvider(
            self,
            f"GitHubOIDC-{environment_suffix}",
            url="https://token.actions.githubusercontent.com",
            client_ids=["sts.amazonaws.com"],
        )
        
        # Create role for GitHub Actions
        github_role = iam.Role(
            self,
            f"GitHubActionsRole-{environment_suffix}",
            assumed_by=iam.FederatedPrincipal(
                github_provider.open_id_connect_provider_arn,
                conditions={
                    "StringLike": {
                        "token.actions.githubusercontent.com:sub": "repo:*:*"
                    }
                },
                assume_role_action="sts:AssumeRoleWithWebIdentity",
            ),
        )
        
        github_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("ReadOnlyAccess")
        )
        
        # Get Bottlerocket AMI
        bottlerocket_ami = ec2.MachineImage.from_ssm_parameter(
            "/aws/service/bottlerocket/aws-k8s-1.29/x86_64/latest/image_id",
            os=ec2.OperatingSystemType.LINUX,
        )
        
        # Node group 1: General purpose (t3.large) - Group A
        nodegroup_general_a = cluster.add_nodegroup_capacity(
            f"GeneralNodeGroupA-{environment_suffix}",
            instance_types=[ec2.InstanceType("t3.large")],
            min_size=2,
            max_size=10,
            desired_size=4,
            nodegroup_name=f"general-a-{environment_suffix}",
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            ami_type=eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
            capacity_type=eks.CapacityType.ON_DEMAND,
            labels={
                "workload-type": "general",
                "node-group": "general-a",
            },
            tags={
                "k8s.io/cluster-autoscaler/enabled": "true",
                f"k8s.io/cluster-autoscaler/payment-eks-{environment_suffix}": "owned",
                "EnvironmentSuffix": environment_suffix,
            },
        )
        
        # Node group 2: General purpose (t3.large) - Group B
        nodegroup_general_b = cluster.add_nodegroup_capacity(
            f"GeneralNodeGroupB-{environment_suffix}",
            instance_types=[ec2.InstanceType("t3.large")],
            min_size=2,
            max_size=10,
            desired_size=4,
            nodegroup_name=f"general-b-{environment_suffix}",
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            ami_type=eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
            capacity_type=eks.CapacityType.ON_DEMAND,
            labels={
                "workload-type": "general",
                "node-group": "general-b",
            },
            tags={
                "k8s.io/cluster-autoscaler/enabled": "true",
                f"k8s.io/cluster-autoscaler/payment-eks-{environment_suffix}": "owned",
                "EnvironmentSuffix": environment_suffix,
            },
        )
        
        # Node group 3: Memory optimized (r5.xlarge)
        nodegroup_memory = cluster.add_nodegroup_capacity(
            f"MemoryNodeGroup-{environment_suffix}",
            instance_types=[ec2.InstanceType("r5.xlarge")],
            min_size=1,
            max_size=5,
            desired_size=2,
            nodegroup_name=f"memory-optimized-{environment_suffix}",
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            ami_type=eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
            capacity_type=eks.CapacityType.ON_DEMAND,
            labels={
                "workload-type": "memory-intensive",
                "node-group": "memory",
            },
            tags={
                "k8s.io/cluster-autoscaler/enabled": "true",
                f"k8s.io/cluster-autoscaler/payment-eks-{environment_suffix}": "owned",
                "EnvironmentSuffix": environment_suffix,
            },
        )
        
        # # Node group 4: GPU enabled (g4dn.xlarge)
        # nodegroup_gpu = cluster.add_nodegroup_capacity(
        #     f"GPUNodeGroup-{environment_suffix}",
        #     instance_types=[ec2.InstanceType("g4dn.xlarge")],
        #     min_size=1,
        #     max_size=3,
        #     desired_size=1,
        #     nodegroup_name=f"gpu-enabled-{environment_suffix}",
        #     subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        #     ami_type=eks.NodegroupAmiType.BOTTLEROCKET_X86_64_NVIDIA,
        #     capacity_type=eks.CapacityType.ON_DEMAND,
        #     labels={
        #         "workload-type": "gpu",
        #         "node-group": "gpu",
        #         "nvidia.com/gpu": "true",
        #     },
        #     tags={
        #         "k8s.io/cluster-autoscaler/enabled": "true",
        #         f"k8s.io/cluster-autoscaler/payment-eks-{environment_suffix}": "owned",
        #         "EnvironmentSuffix": environment_suffix,
        #     },
        #     taints=[
        #         eks.TaintSpec(
        #             effect=eks.TaintEffect.NO_SCHEDULE,
        #             key="nvidia.com/gpu",
        #             value="true",
        #         )
        #     ],
        # )
        
        # Create CloudWatch dashboard for cluster metrics
        dashboard = cloudwatch.Dashboard(
            self,
            f"EKSDashboard-{environment_suffix}",
            dashboard_name=f"payment-eks-{environment_suffix}-dashboard",
        )
        
        # Add cluster CPU utilization widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Cluster CPU Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="ContainerInsights",
                        metric_name="cluster_cpu_utilization",
                        dimensions_map={"ClusterName": cluster.cluster_name},
                        statistic="Average",
                    )
                ],
            )
        )
        
        # Add cluster memory utilization widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Cluster Memory Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="ContainerInsights",
                        metric_name="cluster_memory_utilization",
                        dimensions_map={"ClusterName": cluster.cluster_name},
                        statistic="Average",
                    )
                ],
            )
        )
        
        # Add node group health widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Node Group Desired vs Running",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/EKS",
                        metric_name="cluster_node_count",
                        dimensions_map={"ClusterName": cluster.cluster_name},
                        statistic="Average",
                    )
                ],
            )
        )
        
        # Stack outputs
        CfnOutput(
            self,
            f"ClusterEndpoint-{environment_suffix}",
            value=cluster.cluster_endpoint,
            description="EKS Cluster Endpoint",
            export_name=f"PaymentEKSEndpoint-{environment_suffix}",
        )
        
        CfnOutput(
            self,
            f"OIDCIssuerURL-{environment_suffix}",
            value=cluster.cluster_open_id_connect_issuer_url,
            description="OIDC Issuer URL",
            export_name=f"PaymentEKSOIDCIssuer-{environment_suffix}",
        )
        
        CfnOutput(
            self,
            f"ClusterName-{environment_suffix}",
            value=cluster.cluster_name,
            description="EKS Cluster Name",
            export_name=f"PaymentEKSName-{environment_suffix}",
        )
        
        CfnOutput(
            self,
            f"KubectlConfigCommand-{environment_suffix}",
            value=f"aws eks update-kubeconfig --region {self.region} --name {cluster.cluster_name}",
            description="kubectl Configuration Command",
        )
        
        CfnOutput(
            self,
            f"ClusterSecurityGroupId-{environment_suffix}",
            value=cluster.cluster_security_group_id,
            description="Cluster Security Group ID",
            export_name=f"PaymentEKSSecurityGroup-{environment_suffix}",
        )
        
        CfnOutput(
            self,
            f"GitHubOIDCProviderArn-{environment_suffix}",
            value=github_provider.open_id_connect_provider_arn,
            description="GitHub OIDC Provider ARN",
            export_name=f"GitHubOIDCProviderArn-{environment_suffix}",
        )
        
        CfnOutput(
            self,
            f"VPCId-{environment_suffix}",
            value=vpc.vpc_id,
            description="VPC ID",
            export_name=f"PaymentEKSVPCId-{environment_suffix}",
        )
        
        CfnOutput(
            self,
            f"KMSKeyArn-{environment_suffix}",
            value=kms_key.key_arn,
            description="KMS Key ARN for EKS Secrets",
            export_name=f"PaymentEKSKMSKeyArn-{environment_suffix}",
        )
        
        CfnOutput(
            self,
            f"ALBControllerRoleArn-{environment_suffix}",
            value=alb_controller_sa.role.role_arn,
            description="ALB Controller Service Account Role ARN (use for Helm deployment)",
            export_name=f"PaymentEKSALBControllerRoleArn-{environment_suffix}",
        )
        
        # Store reference for testing
        self.cluster = cluster
        self.vpc = vpc
        self.kms_key = kms_key
