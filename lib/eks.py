"""EKS Module for creating EKS cluster and node groups.

This module creates an EKS cluster with version 1.29, private endpoint access,
control plane logging, OIDC provider, and managed node groups using Bottlerocket AMI.
"""

import base64
import pulumi
import pulumi_aws as aws
import pulumi_tls as tls


def create_eks_cluster(
    environment_suffix: str,
    cluster_role: aws.iam.Role,
    private_subnet_ids: list,
    kms_key: aws.kms.Key,
    security_group_ids: list = None
) -> aws.eks.Cluster:
    """
    Create EKS cluster with version 1.29 and private endpoint.

    Args:
        environment_suffix: Unique suffix for resource naming
        cluster_role: IAM role for EKS cluster
        private_subnet_ids: List of private subnet IDs
        kms_key: KMS key for envelope encryption
        security_group_ids: Optional list of security group IDs

    Returns:
        EKS Cluster resource
    """
    cluster_name = f"eks-cluster-{environment_suffix}"

    cluster = aws.eks.Cluster(
        f"eks-cluster-{environment_suffix}",
        name=cluster_name,
        version="1.29",
        role_arn=cluster_role.arn,
        vpc_config=aws.eks.ClusterVpcConfigArgs(
            subnet_ids=private_subnet_ids,
            endpoint_private_access=True,
            endpoint_public_access=True,
            security_group_ids=security_group_ids,
        ),
        encryption_config=aws.eks.ClusterEncryptionConfigArgs(
            provider=aws.eks.ClusterEncryptionConfigProviderArgs(
                key_arn=kms_key.arn,
            ),
            resources=["secrets"],
        ),
        enabled_cluster_log_types=[
            "api",
            "audit",
            "authenticator",
            "controllerManager",
            "scheduler",
        ],
        tags={
            "Name": cluster_name,
            "EnvironmentSuffix": environment_suffix,
        }
    )

    return cluster


def create_oidc_provider(cluster: aws.eks.Cluster, environment_suffix: str) -> tuple:
    """
    Create OIDC provider for IRSA.

    Args:
        cluster: EKS cluster resource
        environment_suffix: Unique suffix for resource naming

    Returns:
        Tuple of (OIDC provider, OIDC provider ARN, OIDC provider URL)
    """
    # Get OIDC issuer URL from cluster
    oidc_issuer_url = cluster.identities[0].oidcs[0].issuer

    # Extract OIDC provider URL (remove https://)
    oidc_provider_url = oidc_issuer_url.apply(lambda url: url.replace("https://", ""))

    # Get TLS certificate thumbprint for OIDC provider
    def get_thumbprint(url):
        # For EKS OIDC, we use the root CA thumbprint
        # This is a known value for AWS regions
        return "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"

    thumbprint = oidc_issuer_url.apply(get_thumbprint)

    # Create OIDC provider
    oidc_provider = aws.iam.OpenIdConnectProvider(
        f"eks-oidc-provider-{environment_suffix}",
        client_id_lists=["sts.amazonaws.com"],
        thumbprint_lists=[thumbprint],
        url=oidc_issuer_url,
        tags={
            "Name": f"eks-oidc-provider-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    return oidc_provider, oidc_provider.arn, oidc_provider_url


def create_node_group(
    environment_suffix: str,
    cluster: aws.eks.Cluster,
    node_role: aws.iam.Role,
    private_subnet_ids: list,
    region: str
) -> aws.eks.NodeGroup:
    """
    Create managed node group with Bottlerocket AMI.

    Args:
        environment_suffix: Unique suffix for resource naming
        cluster: EKS cluster resource
        node_role: IAM role for nodes
        private_subnet_ids: List of private subnet IDs
        region: AWS region

    Returns:
        EKS Node Group resource
    """
    # Get latest Bottlerocket AMI for EKS 1.29
    bottlerocket_ami = aws.ec2.get_ami(
        most_recent=True,
        owners=["amazon"],
        filters=[
            aws.ec2.GetAmiFilterArgs(
                name="name",
                values=["bottlerocket-aws-k8s-1.29-x86_64-*"]
            ),
            aws.ec2.GetAmiFilterArgs(
                name="virtualization-type",
                values=["hvm"]
            )
        ]
    )

    # Create launch template for Bottlerocket
    # Note: Bottlerocket uses TOML configuration for user data
    def create_user_data(args):
        cluster_name = args[0]
        endpoint = args[1]
        cert_data = args[2]
        toml_config = f"""[settings.kubernetes]
cluster-name = "{cluster_name}"
api-server = "{endpoint}"
cluster-certificate = "{cert_data}"

[settings.kubernetes.node-labels]
"environment" = "{environment_suffix}"

[settings.kubernetes.node-taints]
"""
        return base64.b64encode(toml_config.encode('utf-8')).decode('ascii')

    user_data = pulumi.Output.all(
        cluster.name,
        cluster.endpoint,
        cluster.certificate_authority.data
    ).apply(create_user_data)

    launch_template = aws.ec2.LaunchTemplate(
        f"eks-node-launch-template-{environment_suffix}",
        name=f"eks-node-lt-{environment_suffix}",
        image_id=bottlerocket_ami.id,
        user_data=user_data,
        tag_specifications=[
            aws.ec2.LaunchTemplateTagSpecificationArgs(
                resource_type="instance",
                tags={
                    "Name": f"eks-node-{environment_suffix}",
                    "EnvironmentSuffix": environment_suffix,
                }
            )
        ],
        tags={
            "Name": f"eks-node-launch-template-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    # Create node group
    # Note: For autoscaler tags, we need to use apply to handle Output values properly
    def create_node_tags(cluster_name_value):
        return {
            "Name": f"eks-node-group-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
            f"k8s.io/cluster-autoscaler/{cluster_name_value}": "owned",
            "k8s.io/cluster-autoscaler/enabled": "true",
        }

    node_group = aws.eks.NodeGroup(
        f"eks-node-group-{environment_suffix}",
        cluster_name=cluster.name,
        node_group_name=f"eks-ng-{environment_suffix}",
        node_role_arn=node_role.arn,
        subnet_ids=private_subnet_ids,
        scaling_config=aws.eks.NodeGroupScalingConfigArgs(
            min_size=3,
            max_size=10,
            desired_size=5,
        ),
        instance_types=["t3.large"],
        ami_type="CUSTOM",
        capacity_type="ON_DEMAND",
        launch_template=aws.eks.NodeGroupLaunchTemplateArgs(
            id=launch_template.id,
            version=launch_template.latest_version.apply(str),
        ),
        update_config=aws.eks.NodeGroupUpdateConfigArgs(
            max_unavailable=1,
        ),
        tags=cluster.name.apply(create_node_tags)
    )

    return node_group


def create_addon(
    cluster: aws.eks.Cluster,
    addon_name: str,
    environment_suffix: str,
    addon_version: str = None
) -> aws.eks.Addon:
    """
    Create EKS addon.

    Args:
        cluster: EKS cluster resource
        addon_name: Name of addon (e.g., 'vpc-cni', 'kube-proxy', 'coredns')
        environment_suffix: Unique suffix for resource naming
        addon_version: Optional addon version

    Returns:
        EKS Addon resource
    """
    addon_config = {
        "cluster_name": cluster.name,
        "addon_name": addon_name,
        "resolve_conflicts_on_create": "OVERWRITE",
        "resolve_conflicts_on_update": "OVERWRITE",
        "tags": {
            "Name": f"eks-addon-{addon_name}-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    }

    if addon_version:
        addon_config["addon_version"] = addon_version

    addon = aws.eks.Addon(
        f"eks-addon-{addon_name}-{environment_suffix}",
        **addon_config
    )

    return addon
