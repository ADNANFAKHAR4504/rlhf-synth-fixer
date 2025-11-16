"""Kubernetes Resources Module.

This module creates Kubernetes resources including namespaces with Pod Security Standards,
NetworkPolicies for tenant isolation, ServiceAccounts with IRSA annotations, and Cluster Autoscaler deployment.
"""

import pulumi
import pulumi_kubernetes as k8s
import pulumi_aws as aws


def create_k8s_provider(
    cluster: aws.eks.Cluster,
    node_group: aws.eks.NodeGroup,
    environment_suffix: str
) -> k8s.Provider:
    """
    Create Kubernetes provider for EKS cluster.

    Args:
        cluster: EKS cluster resource
        node_group: Node group to ensure cluster is ready
        environment_suffix: Unique suffix for resource naming

    Returns:
        Kubernetes provider
    """
    kubeconfig = pulumi.Output.all(
        cluster.endpoint,
        cluster.certificate_authority.data,
        cluster.name
    ).apply(lambda args: f"""apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: {args[1]}
    server: {args[0]}
  name: {args[2]}
contexts:
- context:
    cluster: {args[2]}
    user: {args[2]}
  name: {args[2]}
current-context: {args[2]}
kind: Config
preferences: {{}}
users:
- name: {args[2]}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: aws
      args:
        - eks
        - get-token
        - --cluster-name
        - {args[2]}
""")

    k8s_provider = k8s.Provider(
        f"eks-k8s-provider-{environment_suffix}",
        kubeconfig=kubeconfig,
        opts=pulumi.ResourceOptions(depends_on=[node_group])
    )

    return k8s_provider


def create_tenant_namespace(
    tenant_name: str,
    environment_suffix: str,
    k8s_provider: k8s.Provider
) -> k8s.core.v1.Namespace:
    """
    Create tenant namespace with Pod Security Standards set to 'restricted'.

    Args:
        tenant_name: Name of the tenant (e.g., 'tenant-a')
        environment_suffix: Unique suffix for resource naming
        k8s_provider: Kubernetes provider

    Returns:
        Kubernetes Namespace resource
    """
    namespace = k8s.core.v1.Namespace(
        f"{tenant_name}-namespace-{environment_suffix}",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name=tenant_name,
            labels={
                "name": tenant_name,
                "environment-suffix": environment_suffix,
                "pod-security.kubernetes.io/enforce": "restricted",
                "pod-security.kubernetes.io/audit": "restricted",
                "pod-security.kubernetes.io/warn": "restricted",
            }
        ),
        opts=pulumi.ResourceOptions(provider=k8s_provider)
    )

    return namespace


def create_network_policy(
    tenant_name: str,
    environment_suffix: str,
    namespace: k8s.core.v1.Namespace,
    k8s_provider: k8s.Provider
) -> k8s.networking.v1.NetworkPolicy:
    """
    Create NetworkPolicy to deny all inter-namespace traffic.

    Args:
        tenant_name: Name of the tenant
        environment_suffix: Unique suffix for resource naming
        namespace: Namespace resource
        k8s_provider: Kubernetes provider

    Returns:
        NetworkPolicy resource
    """
    network_policy = k8s.networking.v1.NetworkPolicy(
        f"{tenant_name}-network-policy-{environment_suffix}",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name=f"{tenant_name}-deny-other-namespaces",
            namespace=namespace.metadata.name,
        ),
        spec=k8s.networking.v1.NetworkPolicySpecArgs(
            pod_selector=k8s.meta.v1.LabelSelectorArgs(
                match_labels={}
            ),
            policy_types=["Ingress", "Egress"],
            ingress=[
                # Allow traffic from within the same namespace
                k8s.networking.v1.NetworkPolicyIngressRuleArgs(
                    from_=[
                        k8s.networking.v1.NetworkPolicyPeerArgs(
                            pod_selector=k8s.meta.v1.LabelSelectorArgs(
                                match_labels={}
                            )
                        )
                    ]
                )
            ],
            egress=[
                # Allow DNS
                k8s.networking.v1.NetworkPolicyEgressRuleArgs(
                    to=[
                        k8s.networking.v1.NetworkPolicyPeerArgs(
                            namespace_selector=k8s.meta.v1.LabelSelectorArgs(
                                match_labels={
                                    "kubernetes.io/metadata.name": "kube-system"
                                }
                            ),
                            pod_selector=k8s.meta.v1.LabelSelectorArgs(
                                match_labels={
                                    "k8s-app": "kube-dns"
                                }
                            )
                        )
                    ],
                    ports=[
                        k8s.networking.v1.NetworkPolicyPortArgs(
                            protocol="UDP",
                            port=53
                        )
                    ]
                ),
                # Allow traffic to same namespace
                k8s.networking.v1.NetworkPolicyEgressRuleArgs(
                    to=[
                        k8s.networking.v1.NetworkPolicyPeerArgs(
                            pod_selector=k8s.meta.v1.LabelSelectorArgs(
                                match_labels={}
                            )
                        )
                    ]
                ),
                # Allow traffic to internet (for AWS services)
                k8s.networking.v1.NetworkPolicyEgressRuleArgs(
                    to=[
                        k8s.networking.v1.NetworkPolicyPeerArgs(
                            ip_block=k8s.networking.v1.IPBlockArgs(
                                cidr="0.0.0.0/0",
                                except_=[
                                    "169.254.169.254/32"  # Block metadata service
                                ]
                            )
                        )
                    ]
                )
            ]
        ),
        opts=pulumi.ResourceOptions(
            provider=k8s_provider,
            depends_on=[namespace]
        )
    )

    return network_policy


def create_service_account(
    tenant_name: str,
    environment_suffix: str,
    namespace: k8s.core.v1.Namespace,
    iam_role: aws.iam.Role,
    k8s_provider: k8s.Provider
) -> k8s.core.v1.ServiceAccount:
    """
    Create ServiceAccount with IRSA annotation.

    Args:
        tenant_name: Name of the tenant
        environment_suffix: Unique suffix for resource naming
        namespace: Namespace resource
        iam_role: IAM role ARN for IRSA
        k8s_provider: Kubernetes provider

    Returns:
        ServiceAccount resource
    """
    service_account = k8s.core.v1.ServiceAccount(
        f"{tenant_name}-sa-{environment_suffix}",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name=f"{tenant_name}-sa",
            namespace=namespace.metadata.name,
            annotations={
                "eks.amazonaws.com/role-arn": iam_role.arn
            }
        ),
        opts=pulumi.ResourceOptions(
            provider=k8s_provider,
            depends_on=[namespace]
        )
    )

    return service_account


def create_cluster_autoscaler(
    environment_suffix: str,
    cluster_name: pulumi.Output[str],
    autoscaler_role: aws.iam.Role,
    k8s_provider: k8s.Provider,
    region: str
) -> tuple:
    """
    Deploy Cluster Autoscaler with proper RBAC and IRSA.

    Args:
        environment_suffix: Unique suffix for resource naming
        cluster_name: Name of EKS cluster (Output)
        autoscaler_role: IAM role for Cluster Autoscaler
        k8s_provider: Kubernetes provider
        region: AWS region

    Returns:
        Tuple of (ServiceAccount, Deployment)
    """
    # Create ServiceAccount with IRSA annotation
    sa = k8s.core.v1.ServiceAccount(
        f"cluster-autoscaler-sa-{environment_suffix}",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name="cluster-autoscaler",
            namespace="kube-system",
            annotations={
                "eks.amazonaws.com/role-arn": autoscaler_role.arn
            }
        ),
        opts=pulumi.ResourceOptions(provider=k8s_provider)
    )

    # Create ClusterRole
    cluster_role = k8s.rbac.v1.ClusterRole(
        f"cluster-autoscaler-role-{environment_suffix}",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name="cluster-autoscaler"
        ),
        rules=[
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=[""],
                resources=["events", "endpoints"],
                verbs=["create", "patch"]
            ),
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=[""],
                resources=["pods/eviction"],
                verbs=["create"]
            ),
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=[""],
                resources=["pods/status"],
                verbs=["update"]
            ),
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=[""],
                resources=["endpoints"],
                resource_names=["cluster-autoscaler"],
                verbs=["get", "update"]
            ),
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=[""],
                resources=["nodes"],
                verbs=["watch", "list", "get", "update"]
            ),
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=[""],
                resources=[
                    "namespaces", "pods", "services", "replicationcontrollers",
                    "persistentvolumeclaims", "persistentvolumes"
                ],
                verbs=["watch", "list", "get"]
            ),
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=["extensions"],
                resources=["replicasets", "daemonsets"],
                verbs=["watch", "list", "get"]
            ),
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=["policy"],
                resources=["poddisruptionbudgets"],
                verbs=["watch", "list"]
            ),
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=["apps"],
                resources=["statefulsets", "replicasets", "daemonsets"],
                verbs=["watch", "list", "get"]
            ),
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=["storage.k8s.io"],
                resources=[
                    "storageclasses", "csinodes", "csidrivers",
                    "csistoragecapacities"
                ],
                verbs=["watch", "list", "get"]
            ),
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=["batch", "extensions"],
                resources=["jobs"],
                verbs=["get", "list", "watch", "patch"]
            ),
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=["coordination.k8s.io"],
                resources=["leases"],
                verbs=["create"]
            ),
            k8s.rbac.v1.PolicyRuleArgs(
                api_groups=["coordination.k8s.io"],
                resource_names=["cluster-autoscaler"],
                resources=["leases"],
                verbs=["get", "update"]
            )
        ],
        opts=pulumi.ResourceOptions(provider=k8s_provider)
    )

    # Create ClusterRoleBinding
    cluster_role_binding = k8s.rbac.v1.ClusterRoleBinding(
        f"cluster-autoscaler-binding-{environment_suffix}",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name="cluster-autoscaler"
        ),
        role_ref=k8s.rbac.v1.RoleRefArgs(
            api_group="rbac.authorization.k8s.io",
            kind="ClusterRole",
            name="cluster-autoscaler"
        ),
        subjects=[
            k8s.rbac.v1.SubjectArgs(
                kind="ServiceAccount",
                name="cluster-autoscaler",
                namespace="kube-system"
            )
        ],
        opts=pulumi.ResourceOptions(
            provider=k8s_provider,
            depends_on=[cluster_role, sa]
        )
    )

    # Deploy Cluster Autoscaler
    # Create command list with proper Output handling
    def create_autoscaler_command(name):
        return [
            "./cluster-autoscaler",
            "--v=4",
            "--stderrthreshold=info",
            "--cloud-provider=aws",
            "--skip-nodes-with-local-storage=false",
            "--expander=least-waste",
            f"--node-group-auto-discovery=asg:tag=k8s.io/"
            f"cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/{name}",
            "--balance-similar-node-groups",
            "--skip-nodes-with-system-pods=false"
        ]

    deployment = k8s.apps.v1.Deployment(
        f"cluster-autoscaler-deployment-{environment_suffix}",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name="cluster-autoscaler",
            namespace="kube-system",
            labels={
                "app": "cluster-autoscaler"
            }
        ),
        spec=k8s.apps.v1.DeploymentSpecArgs(
            replicas=1,
            selector=k8s.meta.v1.LabelSelectorArgs(
                match_labels={
                    "app": "cluster-autoscaler"
                }
            ),
            template=k8s.core.v1.PodTemplateSpecArgs(
                metadata=k8s.meta.v1.ObjectMetaArgs(
                    labels={
                        "app": "cluster-autoscaler"
                    }
                ),
                spec=k8s.core.v1.PodSpecArgs(
                    service_account_name="cluster-autoscaler",
                    security_context=k8s.core.v1.PodSecurityContextArgs(
                        run_as_non_root=True,
                        run_as_user=65534,
                        fs_group=65534,
                        seccomp_profile=k8s.core.v1.SeccompProfileArgs(
                            type="RuntimeDefault"
                        )
                    ),
                    containers=[
                        k8s.core.v1.ContainerArgs(
                            name="cluster-autoscaler",
                            image="registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.0",
                            command=cluster_name.apply(create_autoscaler_command),
                            resources=k8s.core.v1.ResourceRequirementsArgs(
                                limits={
                                    "cpu": "100m",
                                    "memory": "600Mi"
                                },
                                requests={
                                    "cpu": "100m",
                                    "memory": "600Mi"
                                }
                            ),
                            security_context=k8s.core.v1.SecurityContextArgs(
                                allow_privilege_escalation=False,
                                read_only_root_filesystem=True,
                                run_as_non_root=True,
                                capabilities=k8s.core.v1.CapabilitiesArgs(
                                    drop=["ALL"]
                                )
                            ),
                            env=[
                                k8s.core.v1.EnvVarArgs(
                                    name="AWS_REGION",
                                    value=region
                                )
                            ],
                            volume_mounts=[
                                k8s.core.v1.VolumeMountArgs(
                                    name="ssl-certs",
                                    mount_path="/etc/ssl/certs/ca-certificates.crt",
                                    read_only=True
                                )
                            ]
                        )
                    ],
                    volumes=[
                        k8s.core.v1.VolumeArgs(
                            name="ssl-certs",
                            host_path=k8s.core.v1.HostPathVolumeSourceArgs(
                                path="/etc/ssl/certs/ca-bundle.crt"
                            )
                        )
                    ]
                )
            )
        ),
        opts=pulumi.ResourceOptions(
            provider=k8s_provider,
            depends_on=[cluster_role_binding, sa]
        )
    )

    return sa, deployment


def create_alb_controller_sa(
    environment_suffix: str,
    alb_role: aws.iam.Role,
    k8s_provider: k8s.Provider
) -> k8s.core.v1.ServiceAccount:
    """
    Create ServiceAccount for AWS Load Balancer Controller.

    Args:
        environment_suffix: Unique suffix for resource naming
        alb_role: IAM role for ALB Controller
        k8s_provider: Kubernetes provider

    Returns:
        ServiceAccount resource
    """
    sa = k8s.core.v1.ServiceAccount(
        f"alb-controller-sa-{environment_suffix}",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name="aws-load-balancer-controller",
            namespace="kube-system",
            annotations={
                "eks.amazonaws.com/role-arn": alb_role.arn
            }
        ),
        opts=pulumi.ResourceOptions(provider=k8s_provider)
    )

    return sa


def enable_container_insights(
    cluster: aws.eks.Cluster,
    environment_suffix: str
) -> aws.cloudwatch.LogGroup:
    """
    Enable CloudWatch Container Insights for EKS cluster.

    Args:
        cluster: EKS cluster resource
        environment_suffix: Unique suffix for resource naming

    Returns:
        CloudWatch Log Group
    """
    log_group = aws.cloudwatch.LogGroup(
        f"eks-container-insights-{environment_suffix}",
        name=cluster.name.apply(lambda name: f"/aws/eks/{name}/cluster"),
        retention_in_days=7,
        tags={
            "Name": f"eks-container-insights-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
        }
    )

    return log_group
