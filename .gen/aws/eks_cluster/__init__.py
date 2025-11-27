r'''
# `aws_eks_cluster`

Refer to the Terraform Registry for docs: [`aws_eks_cluster`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster).
'''
from pkgutil import extend_path
__path__ = extend_path(__path__, __name__)

import abc
import builtins
import datetime
import enum
import typing

import jsii
import publication
import typing_extensions

import typeguard
from importlib.metadata import version as _metadata_package_version
TYPEGUARD_MAJOR_VERSION = int(_metadata_package_version('typeguard').split('.')[0])

def check_type(argname: str, value: object, expected_type: typing.Any) -> typing.Any:
    if TYPEGUARD_MAJOR_VERSION <= 2:
        return typeguard.check_type(argname=argname, value=value, expected_type=expected_type) # type:ignore
    else:
        if isinstance(value, jsii._reference_map.InterfaceDynamicProxy): # pyright: ignore [reportAttributeAccessIssue]
           pass
        else:
            if TYPEGUARD_MAJOR_VERSION == 3:
                typeguard.config.collection_check_strategy = typeguard.CollectionCheckStrategy.ALL_ITEMS # type:ignore
                typeguard.check_type(value=value, expected_type=expected_type) # type:ignore
            else:
                typeguard.check_type(value=value, expected_type=expected_type, collection_check_strategy=typeguard.CollectionCheckStrategy.ALL_ITEMS) # type:ignore

from .._jsii import *

import cdktf as _cdktf_9a9027ec
import constructs as _constructs_77d1e7e8


class EksCluster(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksCluster",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster aws_eks_cluster}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        name: builtins.str,
        role_arn: builtins.str,
        vpc_config: typing.Union["EksClusterVpcConfig", typing.Dict[builtins.str, typing.Any]],
        access_config: typing.Optional[typing.Union["EksClusterAccessConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        bootstrap_self_managed_addons: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        compute_config: typing.Optional[typing.Union["EksClusterComputeConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        enabled_cluster_log_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        encryption_config: typing.Optional[typing.Union["EksClusterEncryptionConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        force_update_version: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        id: typing.Optional[builtins.str] = None,
        kubernetes_network_config: typing.Optional[typing.Union["EksClusterKubernetesNetworkConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        outpost_config: typing.Optional[typing.Union["EksClusterOutpostConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        remote_network_config: typing.Optional[typing.Union["EksClusterRemoteNetworkConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        storage_config: typing.Optional[typing.Union["EksClusterStorageConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["EksClusterTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        upgrade_policy: typing.Optional[typing.Union["EksClusterUpgradePolicy", typing.Dict[builtins.str, typing.Any]]] = None,
        version: typing.Optional[builtins.str] = None,
        zonal_shift_config: typing.Optional[typing.Union["EksClusterZonalShiftConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster aws_eks_cluster} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#name EksCluster#name}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#role_arn EksCluster#role_arn}.
        :param vpc_config: vpc_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#vpc_config EksCluster#vpc_config}
        :param access_config: access_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#access_config EksCluster#access_config}
        :param bootstrap_self_managed_addons: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_self_managed_addons EksCluster#bootstrap_self_managed_addons}.
        :param compute_config: compute_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#compute_config EksCluster#compute_config}
        :param enabled_cluster_log_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled_cluster_log_types EksCluster#enabled_cluster_log_types}.
        :param encryption_config: encryption_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#encryption_config EksCluster#encryption_config}
        :param force_update_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#force_update_version EksCluster#force_update_version}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#id EksCluster#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param kubernetes_network_config: kubernetes_network_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#kubernetes_network_config EksCluster#kubernetes_network_config}
        :param outpost_config: outpost_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#outpost_config EksCluster#outpost_config}
        :param remote_network_config: remote_network_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_network_config EksCluster#remote_network_config}
        :param storage_config: storage_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#storage_config EksCluster#storage_config}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags EksCluster#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags_all EksCluster#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#timeouts EksCluster#timeouts}
        :param upgrade_policy: upgrade_policy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#upgrade_policy EksCluster#upgrade_policy}
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#version EksCluster#version}.
        :param zonal_shift_config: zonal_shift_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#zonal_shift_config EksCluster#zonal_shift_config}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__35654707f07a0543a5b79ab4659de1e60a5985f2f884ce1ba52b648ceedd6957)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = EksClusterConfig(
            name=name,
            role_arn=role_arn,
            vpc_config=vpc_config,
            access_config=access_config,
            bootstrap_self_managed_addons=bootstrap_self_managed_addons,
            compute_config=compute_config,
            enabled_cluster_log_types=enabled_cluster_log_types,
            encryption_config=encryption_config,
            force_update_version=force_update_version,
            id=id,
            kubernetes_network_config=kubernetes_network_config,
            outpost_config=outpost_config,
            remote_network_config=remote_network_config,
            storage_config=storage_config,
            tags=tags,
            tags_all=tags_all,
            timeouts=timeouts,
            upgrade_policy=upgrade_policy,
            version=version,
            zonal_shift_config=zonal_shift_config,
            connection=connection,
            count=count,
            depends_on=depends_on,
            for_each=for_each,
            lifecycle=lifecycle,
            provider=provider,
            provisioners=provisioners,
        )

        jsii.create(self.__class__, self, [scope, id_, config])

    @jsii.member(jsii_name="generateConfigForImport")
    @builtins.classmethod
    def generate_config_for_import(
        cls,
        scope: _constructs_77d1e7e8.Construct,
        import_to_id: builtins.str,
        import_from_id: builtins.str,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    ) -> _cdktf_9a9027ec.ImportableResource:
        '''Generates CDKTF code for importing a EksCluster resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the EksCluster to import.
        :param import_from_id: The id of the existing EksCluster that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the EksCluster to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d6857407a63e8c85430d5cebf18872ba8893b7b544357669382fa886cbeb06da)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putAccessConfig")
    def put_access_config(
        self,
        *,
        authentication_mode: typing.Optional[builtins.str] = None,
        bootstrap_cluster_creator_admin_permissions: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param authentication_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#authentication_mode EksCluster#authentication_mode}.
        :param bootstrap_cluster_creator_admin_permissions: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_cluster_creator_admin_permissions EksCluster#bootstrap_cluster_creator_admin_permissions}.
        '''
        value = EksClusterAccessConfig(
            authentication_mode=authentication_mode,
            bootstrap_cluster_creator_admin_permissions=bootstrap_cluster_creator_admin_permissions,
        )

        return typing.cast(None, jsii.invoke(self, "putAccessConfig", [value]))

    @jsii.member(jsii_name="putComputeConfig")
    def put_compute_config(
        self,
        *,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        node_pools: typing.Optional[typing.Sequence[builtins.str]] = None,
        node_role_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
        :param node_pools: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#node_pools EksCluster#node_pools}.
        :param node_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#node_role_arn EksCluster#node_role_arn}.
        '''
        value = EksClusterComputeConfig(
            enabled=enabled, node_pools=node_pools, node_role_arn=node_role_arn
        )

        return typing.cast(None, jsii.invoke(self, "putComputeConfig", [value]))

    @jsii.member(jsii_name="putEncryptionConfig")
    def put_encryption_config(
        self,
        *,
        provider: typing.Union["EksClusterEncryptionConfigProvider", typing.Dict[builtins.str, typing.Any]],
        resources: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param provider: provider block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#provider EksCluster#provider}
        :param resources: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#resources EksCluster#resources}.
        '''
        value = EksClusterEncryptionConfig(provider=provider, resources=resources)

        return typing.cast(None, jsii.invoke(self, "putEncryptionConfig", [value]))

    @jsii.member(jsii_name="putKubernetesNetworkConfig")
    def put_kubernetes_network_config(
        self,
        *,
        elastic_load_balancing: typing.Optional[typing.Union["EksClusterKubernetesNetworkConfigElasticLoadBalancing", typing.Dict[builtins.str, typing.Any]]] = None,
        ip_family: typing.Optional[builtins.str] = None,
        service_ipv4_cidr: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param elastic_load_balancing: elastic_load_balancing block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#elastic_load_balancing EksCluster#elastic_load_balancing}
        :param ip_family: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#ip_family EksCluster#ip_family}.
        :param service_ipv4_cidr: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#service_ipv4_cidr EksCluster#service_ipv4_cidr}.
        '''
        value = EksClusterKubernetesNetworkConfig(
            elastic_load_balancing=elastic_load_balancing,
            ip_family=ip_family,
            service_ipv4_cidr=service_ipv4_cidr,
        )

        return typing.cast(None, jsii.invoke(self, "putKubernetesNetworkConfig", [value]))

    @jsii.member(jsii_name="putOutpostConfig")
    def put_outpost_config(
        self,
        *,
        control_plane_instance_type: builtins.str,
        outpost_arns: typing.Sequence[builtins.str],
        control_plane_placement: typing.Optional[typing.Union["EksClusterOutpostConfigControlPlanePlacement", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param control_plane_instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#control_plane_instance_type EksCluster#control_plane_instance_type}.
        :param outpost_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#outpost_arns EksCluster#outpost_arns}.
        :param control_plane_placement: control_plane_placement block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#control_plane_placement EksCluster#control_plane_placement}
        '''
        value = EksClusterOutpostConfig(
            control_plane_instance_type=control_plane_instance_type,
            outpost_arns=outpost_arns,
            control_plane_placement=control_plane_placement,
        )

        return typing.cast(None, jsii.invoke(self, "putOutpostConfig", [value]))

    @jsii.member(jsii_name="putRemoteNetworkConfig")
    def put_remote_network_config(
        self,
        *,
        remote_node_networks: typing.Union["EksClusterRemoteNetworkConfigRemoteNodeNetworks", typing.Dict[builtins.str, typing.Any]],
        remote_pod_networks: typing.Optional[typing.Union["EksClusterRemoteNetworkConfigRemotePodNetworks", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param remote_node_networks: remote_node_networks block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_node_networks EksCluster#remote_node_networks}
        :param remote_pod_networks: remote_pod_networks block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_pod_networks EksCluster#remote_pod_networks}
        '''
        value = EksClusterRemoteNetworkConfig(
            remote_node_networks=remote_node_networks,
            remote_pod_networks=remote_pod_networks,
        )

        return typing.cast(None, jsii.invoke(self, "putRemoteNetworkConfig", [value]))

    @jsii.member(jsii_name="putStorageConfig")
    def put_storage_config(
        self,
        *,
        block_storage: typing.Optional[typing.Union["EksClusterStorageConfigBlockStorage", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param block_storage: block_storage block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#block_storage EksCluster#block_storage}
        '''
        value = EksClusterStorageConfig(block_storage=block_storage)

        return typing.cast(None, jsii.invoke(self, "putStorageConfig", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#create EksCluster#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#delete EksCluster#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#update EksCluster#update}.
        '''
        value = EksClusterTimeouts(create=create, delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="putUpgradePolicy")
    def put_upgrade_policy(
        self,
        *,
        support_type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param support_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#support_type EksCluster#support_type}.
        '''
        value = EksClusterUpgradePolicy(support_type=support_type)

        return typing.cast(None, jsii.invoke(self, "putUpgradePolicy", [value]))

    @jsii.member(jsii_name="putVpcConfig")
    def put_vpc_config(
        self,
        *,
        subnet_ids: typing.Sequence[builtins.str],
        endpoint_private_access: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        endpoint_public_access: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        public_access_cidrs: typing.Optional[typing.Sequence[builtins.str]] = None,
        security_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param subnet_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#subnet_ids EksCluster#subnet_ids}.
        :param endpoint_private_access: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#endpoint_private_access EksCluster#endpoint_private_access}.
        :param endpoint_public_access: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#endpoint_public_access EksCluster#endpoint_public_access}.
        :param public_access_cidrs: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#public_access_cidrs EksCluster#public_access_cidrs}.
        :param security_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#security_group_ids EksCluster#security_group_ids}.
        '''
        value = EksClusterVpcConfig(
            subnet_ids=subnet_ids,
            endpoint_private_access=endpoint_private_access,
            endpoint_public_access=endpoint_public_access,
            public_access_cidrs=public_access_cidrs,
            security_group_ids=security_group_ids,
        )

        return typing.cast(None, jsii.invoke(self, "putVpcConfig", [value]))

    @jsii.member(jsii_name="putZonalShiftConfig")
    def put_zonal_shift_config(
        self,
        *,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
        '''
        value = EksClusterZonalShiftConfig(enabled=enabled)

        return typing.cast(None, jsii.invoke(self, "putZonalShiftConfig", [value]))

    @jsii.member(jsii_name="resetAccessConfig")
    def reset_access_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccessConfig", []))

    @jsii.member(jsii_name="resetBootstrapSelfManagedAddons")
    def reset_bootstrap_self_managed_addons(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBootstrapSelfManagedAddons", []))

    @jsii.member(jsii_name="resetComputeConfig")
    def reset_compute_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetComputeConfig", []))

    @jsii.member(jsii_name="resetEnabledClusterLogTypes")
    def reset_enabled_cluster_log_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnabledClusterLogTypes", []))

    @jsii.member(jsii_name="resetEncryptionConfig")
    def reset_encryption_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEncryptionConfig", []))

    @jsii.member(jsii_name="resetForceUpdateVersion")
    def reset_force_update_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetForceUpdateVersion", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetKubernetesNetworkConfig")
    def reset_kubernetes_network_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKubernetesNetworkConfig", []))

    @jsii.member(jsii_name="resetOutpostConfig")
    def reset_outpost_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOutpostConfig", []))

    @jsii.member(jsii_name="resetRemoteNetworkConfig")
    def reset_remote_network_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRemoteNetworkConfig", []))

    @jsii.member(jsii_name="resetStorageConfig")
    def reset_storage_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStorageConfig", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTimeouts")
    def reset_timeouts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeouts", []))

    @jsii.member(jsii_name="resetUpgradePolicy")
    def reset_upgrade_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUpgradePolicy", []))

    @jsii.member(jsii_name="resetVersion")
    def reset_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVersion", []))

    @jsii.member(jsii_name="resetZonalShiftConfig")
    def reset_zonal_shift_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetZonalShiftConfig", []))

    @jsii.member(jsii_name="synthesizeAttributes")
    def _synthesize_attributes(self) -> typing.Mapping[builtins.str, typing.Any]:
        return typing.cast(typing.Mapping[builtins.str, typing.Any], jsii.invoke(self, "synthesizeAttributes", []))

    @jsii.member(jsii_name="synthesizeHclAttributes")
    def _synthesize_hcl_attributes(self) -> typing.Mapping[builtins.str, typing.Any]:
        return typing.cast(typing.Mapping[builtins.str, typing.Any], jsii.invoke(self, "synthesizeHclAttributes", []))

    @jsii.python.classproperty
    @jsii.member(jsii_name="tfResourceType")
    def TF_RESOURCE_TYPE(cls) -> builtins.str:
        return typing.cast(builtins.str, jsii.sget(cls, "tfResourceType"))

    @builtins.property
    @jsii.member(jsii_name="accessConfig")
    def access_config(self) -> "EksClusterAccessConfigOutputReference":
        return typing.cast("EksClusterAccessConfigOutputReference", jsii.get(self, "accessConfig"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @builtins.property
    @jsii.member(jsii_name="certificateAuthority")
    def certificate_authority(self) -> "EksClusterCertificateAuthorityList":
        return typing.cast("EksClusterCertificateAuthorityList", jsii.get(self, "certificateAuthority"))

    @builtins.property
    @jsii.member(jsii_name="clusterId")
    def cluster_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "clusterId"))

    @builtins.property
    @jsii.member(jsii_name="computeConfig")
    def compute_config(self) -> "EksClusterComputeConfigOutputReference":
        return typing.cast("EksClusterComputeConfigOutputReference", jsii.get(self, "computeConfig"))

    @builtins.property
    @jsii.member(jsii_name="createdAt")
    def created_at(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "createdAt"))

    @builtins.property
    @jsii.member(jsii_name="encryptionConfig")
    def encryption_config(self) -> "EksClusterEncryptionConfigOutputReference":
        return typing.cast("EksClusterEncryptionConfigOutputReference", jsii.get(self, "encryptionConfig"))

    @builtins.property
    @jsii.member(jsii_name="endpoint")
    def endpoint(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endpoint"))

    @builtins.property
    @jsii.member(jsii_name="identity")
    def identity(self) -> "EksClusterIdentityList":
        return typing.cast("EksClusterIdentityList", jsii.get(self, "identity"))

    @builtins.property
    @jsii.member(jsii_name="kubernetesNetworkConfig")
    def kubernetes_network_config(
        self,
    ) -> "EksClusterKubernetesNetworkConfigOutputReference":
        return typing.cast("EksClusterKubernetesNetworkConfigOutputReference", jsii.get(self, "kubernetesNetworkConfig"))

    @builtins.property
    @jsii.member(jsii_name="outpostConfig")
    def outpost_config(self) -> "EksClusterOutpostConfigOutputReference":
        return typing.cast("EksClusterOutpostConfigOutputReference", jsii.get(self, "outpostConfig"))

    @builtins.property
    @jsii.member(jsii_name="platformVersion")
    def platform_version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "platformVersion"))

    @builtins.property
    @jsii.member(jsii_name="remoteNetworkConfig")
    def remote_network_config(self) -> "EksClusterRemoteNetworkConfigOutputReference":
        return typing.cast("EksClusterRemoteNetworkConfigOutputReference", jsii.get(self, "remoteNetworkConfig"))

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @builtins.property
    @jsii.member(jsii_name="storageConfig")
    def storage_config(self) -> "EksClusterStorageConfigOutputReference":
        return typing.cast("EksClusterStorageConfigOutputReference", jsii.get(self, "storageConfig"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "EksClusterTimeoutsOutputReference":
        return typing.cast("EksClusterTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="upgradePolicy")
    def upgrade_policy(self) -> "EksClusterUpgradePolicyOutputReference":
        return typing.cast("EksClusterUpgradePolicyOutputReference", jsii.get(self, "upgradePolicy"))

    @builtins.property
    @jsii.member(jsii_name="vpcConfig")
    def vpc_config(self) -> "EksClusterVpcConfigOutputReference":
        return typing.cast("EksClusterVpcConfigOutputReference", jsii.get(self, "vpcConfig"))

    @builtins.property
    @jsii.member(jsii_name="zonalShiftConfig")
    def zonal_shift_config(self) -> "EksClusterZonalShiftConfigOutputReference":
        return typing.cast("EksClusterZonalShiftConfigOutputReference", jsii.get(self, "zonalShiftConfig"))

    @builtins.property
    @jsii.member(jsii_name="accessConfigInput")
    def access_config_input(self) -> typing.Optional["EksClusterAccessConfig"]:
        return typing.cast(typing.Optional["EksClusterAccessConfig"], jsii.get(self, "accessConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="bootstrapSelfManagedAddonsInput")
    def bootstrap_self_managed_addons_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "bootstrapSelfManagedAddonsInput"))

    @builtins.property
    @jsii.member(jsii_name="computeConfigInput")
    def compute_config_input(self) -> typing.Optional["EksClusterComputeConfig"]:
        return typing.cast(typing.Optional["EksClusterComputeConfig"], jsii.get(self, "computeConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="enabledClusterLogTypesInput")
    def enabled_cluster_log_types_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "enabledClusterLogTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="encryptionConfigInput")
    def encryption_config_input(self) -> typing.Optional["EksClusterEncryptionConfig"]:
        return typing.cast(typing.Optional["EksClusterEncryptionConfig"], jsii.get(self, "encryptionConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="forceUpdateVersionInput")
    def force_update_version_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "forceUpdateVersionInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="kubernetesNetworkConfigInput")
    def kubernetes_network_config_input(
        self,
    ) -> typing.Optional["EksClusterKubernetesNetworkConfig"]:
        return typing.cast(typing.Optional["EksClusterKubernetesNetworkConfig"], jsii.get(self, "kubernetesNetworkConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="outpostConfigInput")
    def outpost_config_input(self) -> typing.Optional["EksClusterOutpostConfig"]:
        return typing.cast(typing.Optional["EksClusterOutpostConfig"], jsii.get(self, "outpostConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="remoteNetworkConfigInput")
    def remote_network_config_input(
        self,
    ) -> typing.Optional["EksClusterRemoteNetworkConfig"]:
        return typing.cast(typing.Optional["EksClusterRemoteNetworkConfig"], jsii.get(self, "remoteNetworkConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="storageConfigInput")
    def storage_config_input(self) -> typing.Optional["EksClusterStorageConfig"]:
        return typing.cast(typing.Optional["EksClusterStorageConfig"], jsii.get(self, "storageConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsAllInput")
    def tags_all_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsAllInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "EksClusterTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "EksClusterTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="upgradePolicyInput")
    def upgrade_policy_input(self) -> typing.Optional["EksClusterUpgradePolicy"]:
        return typing.cast(typing.Optional["EksClusterUpgradePolicy"], jsii.get(self, "upgradePolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="versionInput")
    def version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "versionInput"))

    @builtins.property
    @jsii.member(jsii_name="vpcConfigInput")
    def vpc_config_input(self) -> typing.Optional["EksClusterVpcConfig"]:
        return typing.cast(typing.Optional["EksClusterVpcConfig"], jsii.get(self, "vpcConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="zonalShiftConfigInput")
    def zonal_shift_config_input(self) -> typing.Optional["EksClusterZonalShiftConfig"]:
        return typing.cast(typing.Optional["EksClusterZonalShiftConfig"], jsii.get(self, "zonalShiftConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="bootstrapSelfManagedAddons")
    def bootstrap_self_managed_addons(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "bootstrapSelfManagedAddons"))

    @bootstrap_self_managed_addons.setter
    def bootstrap_self_managed_addons(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac036d4b316490555f95ba9c7ad78fe4c5243558021128290b4e1a833d0c31a5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bootstrapSelfManagedAddons", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enabledClusterLogTypes")
    def enabled_cluster_log_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "enabledClusterLogTypes"))

    @enabled_cluster_log_types.setter
    def enabled_cluster_log_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7996ec34be554a8fd621ea967d9de8a1d47782d5dc7568c7c639071c1fe2753f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabledClusterLogTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="forceUpdateVersion")
    def force_update_version(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "forceUpdateVersion"))

    @force_update_version.setter
    def force_update_version(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d9ab4d74e27201e6a7f55077a97911d6687dfa947e0b8d0b13e51b4298e5319)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "forceUpdateVersion", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__673adbf55e5c9b3db67b479378d45fe3296cbfadcec0bf009572273dcd019aad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__97216110136613f1b196020251377b13c9063df87a37d1acd50f5dbf5f6249ca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f095419e93fa8230ec9398dceb983e7e74f80535146097b200fdb11d93992c6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ca752c154193166daba62422216ac8c9a1b1e735274420618ed5391d2a3da9a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__078d5d3e8555e6a4b3d63b98c37d5a2193d103df2a249745e867a3a89602cbb8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="version")
    def version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "version"))

    @version.setter
    def version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cada841a2276b61754735be5051990c7ad7654f96ff5df8741e7ea42dc1fd8c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "version", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterAccessConfig",
    jsii_struct_bases=[],
    name_mapping={
        "authentication_mode": "authenticationMode",
        "bootstrap_cluster_creator_admin_permissions": "bootstrapClusterCreatorAdminPermissions",
    },
)
class EksClusterAccessConfig:
    def __init__(
        self,
        *,
        authentication_mode: typing.Optional[builtins.str] = None,
        bootstrap_cluster_creator_admin_permissions: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param authentication_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#authentication_mode EksCluster#authentication_mode}.
        :param bootstrap_cluster_creator_admin_permissions: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_cluster_creator_admin_permissions EksCluster#bootstrap_cluster_creator_admin_permissions}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4df251c4b7a8705350d8fc010a6a2101962806edc0334f855038b7303c6c6c1)
            check_type(argname="argument authentication_mode", value=authentication_mode, expected_type=type_hints["authentication_mode"])
            check_type(argname="argument bootstrap_cluster_creator_admin_permissions", value=bootstrap_cluster_creator_admin_permissions, expected_type=type_hints["bootstrap_cluster_creator_admin_permissions"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if authentication_mode is not None:
            self._values["authentication_mode"] = authentication_mode
        if bootstrap_cluster_creator_admin_permissions is not None:
            self._values["bootstrap_cluster_creator_admin_permissions"] = bootstrap_cluster_creator_admin_permissions

    @builtins.property
    def authentication_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#authentication_mode EksCluster#authentication_mode}.'''
        result = self._values.get("authentication_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def bootstrap_cluster_creator_admin_permissions(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_cluster_creator_admin_permissions EksCluster#bootstrap_cluster_creator_admin_permissions}.'''
        result = self._values.get("bootstrap_cluster_creator_admin_permissions")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterAccessConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterAccessConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterAccessConfigOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ec2f8a5c8fddd71462365407dac730bf4e288e827ea03229832b68f36930e13)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAuthenticationMode")
    def reset_authentication_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAuthenticationMode", []))

    @jsii.member(jsii_name="resetBootstrapClusterCreatorAdminPermissions")
    def reset_bootstrap_cluster_creator_admin_permissions(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBootstrapClusterCreatorAdminPermissions", []))

    @builtins.property
    @jsii.member(jsii_name="authenticationModeInput")
    def authentication_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "authenticationModeInput"))

    @builtins.property
    @jsii.member(jsii_name="bootstrapClusterCreatorAdminPermissionsInput")
    def bootstrap_cluster_creator_admin_permissions_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "bootstrapClusterCreatorAdminPermissionsInput"))

    @builtins.property
    @jsii.member(jsii_name="authenticationMode")
    def authentication_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "authenticationMode"))

    @authentication_mode.setter
    def authentication_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__35040857729a936481ec08c66f3af0d1a0e66dc8c7f417dde73229c3d9a2b3ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "authenticationMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="bootstrapClusterCreatorAdminPermissions")
    def bootstrap_cluster_creator_admin_permissions(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "bootstrapClusterCreatorAdminPermissions"))

    @bootstrap_cluster_creator_admin_permissions.setter
    def bootstrap_cluster_creator_admin_permissions(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__28612cc992aebb77609ec2e7e16b1f6819114b2f8dc331934ff4b616d4fba940)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "bootstrapClusterCreatorAdminPermissions", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterAccessConfig]:
        return typing.cast(typing.Optional[EksClusterAccessConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[EksClusterAccessConfig]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c205e6e1f5679e271a932c98b06d2addbb2342e9cbe1877c669fd4a69d9836f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterCertificateAuthority",
    jsii_struct_bases=[],
    name_mapping={},
)
class EksClusterCertificateAuthority:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterCertificateAuthority(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterCertificateAuthorityList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterCertificateAuthorityList",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
        wraps_set: builtins.bool,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        :param wraps_set: whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fdc3ec91b47023a8dc23620e419cb4f81fe56cbd879ffd103d2aae36344dee68)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "EksClusterCertificateAuthorityOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b58080d635661e67b84e0e6783d8b470f716c8b8e2300459d0edd630ed1e4dc)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("EksClusterCertificateAuthorityOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab76bd92a20e80d41f3770b8e6a62fee87f32c9383cde56caab056891cf27dfc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terraformAttribute", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="terraformResource")
    def _terraform_resource(self) -> _cdktf_9a9027ec.IInterpolatingParent:
        '''The parent resource.'''
        return typing.cast(_cdktf_9a9027ec.IInterpolatingParent, jsii.get(self, "terraformResource"))

    @_terraform_resource.setter
    def _terraform_resource(self, value: _cdktf_9a9027ec.IInterpolatingParent) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b6eede9abf0e99bc642279b2ae01343249738c3d6e1061b1ab8a57e53db079a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terraformResource", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="wrapsSet")
    def _wraps_set(self) -> builtins.bool:
        '''whether the list is wrapping a set (will add tolist() to be able to access an item via an index).'''
        return typing.cast(builtins.bool, jsii.get(self, "wrapsSet"))

    @_wraps_set.setter
    def _wraps_set(self, value: builtins.bool) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b8f39c18e3fc3972f00c46c48836d313d0ff5c4081a2c09549b3effd226f6eaa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class EksClusterCertificateAuthorityOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterCertificateAuthorityOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
        complex_object_index: jsii.Number,
        complex_object_is_from_set: builtins.bool,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        :param complex_object_index: the index of this item in the list.
        :param complex_object_is_from_set: whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42630eaad7ec3a6aeea4adeb85c5b25e70dfdd76c490ba933fcb2229a1d39b24)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="data")
    def data(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "data"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterCertificateAuthority]:
        return typing.cast(typing.Optional[EksClusterCertificateAuthority], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EksClusterCertificateAuthority],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__be8b91899f48b1d8af6b90a7151fd8da5a238fa98cdc586927cdf308ec26aea0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterComputeConfig",
    jsii_struct_bases=[],
    name_mapping={
        "enabled": "enabled",
        "node_pools": "nodePools",
        "node_role_arn": "nodeRoleArn",
    },
)
class EksClusterComputeConfig:
    def __init__(
        self,
        *,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        node_pools: typing.Optional[typing.Sequence[builtins.str]] = None,
        node_role_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
        :param node_pools: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#node_pools EksCluster#node_pools}.
        :param node_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#node_role_arn EksCluster#node_role_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43112c670690c14ae23082e3a8dda74db4096c81a3bf63d6db8efbd7a1ede2a2)
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
            check_type(argname="argument node_pools", value=node_pools, expected_type=type_hints["node_pools"])
            check_type(argname="argument node_role_arn", value=node_role_arn, expected_type=type_hints["node_role_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if enabled is not None:
            self._values["enabled"] = enabled
        if node_pools is not None:
            self._values["node_pools"] = node_pools
        if node_role_arn is not None:
            self._values["node_role_arn"] = node_role_arn

    @builtins.property
    def enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.'''
        result = self._values.get("enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def node_pools(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#node_pools EksCluster#node_pools}.'''
        result = self._values.get("node_pools")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def node_role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#node_role_arn EksCluster#node_role_arn}.'''
        result = self._values.get("node_role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterComputeConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterComputeConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterComputeConfigOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__139912cc2f88d7b719ae11cbd3d048a4baa2a377f74e33bbd87b0cd6c1d81bbf)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetEnabled")
    def reset_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnabled", []))

    @jsii.member(jsii_name="resetNodePools")
    def reset_node_pools(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNodePools", []))

    @jsii.member(jsii_name="resetNodeRoleArn")
    def reset_node_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNodeRoleArn", []))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="nodePoolsInput")
    def node_pools_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "nodePoolsInput"))

    @builtins.property
    @jsii.member(jsii_name="nodeRoleArnInput")
    def node_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nodeRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="enabled")
    def enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enabled"))

    @enabled.setter
    def enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ec544238b08b5a8467d38f9c79792a7f8f63275137fc6fcf20020afad3e170e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="nodePools")
    def node_pools(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "nodePools"))

    @node_pools.setter
    def node_pools(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e909c043117f3373bd1ea481c8ee0b401b9e2f2ca7b1cd57df06de3d44c4d459)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "nodePools", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="nodeRoleArn")
    def node_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "nodeRoleArn"))

    @node_role_arn.setter
    def node_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__decda32491b38f9f26665bfefa0ca30f6c2534e70f9f7f84b27d3b440cf809d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "nodeRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterComputeConfig]:
        return typing.cast(typing.Optional[EksClusterComputeConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[EksClusterComputeConfig]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__daeedb3e95421971b96dc033fa4fd9ef63c8eaaf9fd9cbd433ca04bf18e96648)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "name": "name",
        "role_arn": "roleArn",
        "vpc_config": "vpcConfig",
        "access_config": "accessConfig",
        "bootstrap_self_managed_addons": "bootstrapSelfManagedAddons",
        "compute_config": "computeConfig",
        "enabled_cluster_log_types": "enabledClusterLogTypes",
        "encryption_config": "encryptionConfig",
        "force_update_version": "forceUpdateVersion",
        "id": "id",
        "kubernetes_network_config": "kubernetesNetworkConfig",
        "outpost_config": "outpostConfig",
        "remote_network_config": "remoteNetworkConfig",
        "storage_config": "storageConfig",
        "tags": "tags",
        "tags_all": "tagsAll",
        "timeouts": "timeouts",
        "upgrade_policy": "upgradePolicy",
        "version": "version",
        "zonal_shift_config": "zonalShiftConfig",
    },
)
class EksClusterConfig(_cdktf_9a9027ec.TerraformMetaArguments):
    def __init__(
        self,
        *,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
        name: builtins.str,
        role_arn: builtins.str,
        vpc_config: typing.Union["EksClusterVpcConfig", typing.Dict[builtins.str, typing.Any]],
        access_config: typing.Optional[typing.Union[EksClusterAccessConfig, typing.Dict[builtins.str, typing.Any]]] = None,
        bootstrap_self_managed_addons: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        compute_config: typing.Optional[typing.Union[EksClusterComputeConfig, typing.Dict[builtins.str, typing.Any]]] = None,
        enabled_cluster_log_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        encryption_config: typing.Optional[typing.Union["EksClusterEncryptionConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        force_update_version: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        id: typing.Optional[builtins.str] = None,
        kubernetes_network_config: typing.Optional[typing.Union["EksClusterKubernetesNetworkConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        outpost_config: typing.Optional[typing.Union["EksClusterOutpostConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        remote_network_config: typing.Optional[typing.Union["EksClusterRemoteNetworkConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        storage_config: typing.Optional[typing.Union["EksClusterStorageConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["EksClusterTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        upgrade_policy: typing.Optional[typing.Union["EksClusterUpgradePolicy", typing.Dict[builtins.str, typing.Any]]] = None,
        version: typing.Optional[builtins.str] = None,
        zonal_shift_config: typing.Optional[typing.Union["EksClusterZonalShiftConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#name EksCluster#name}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#role_arn EksCluster#role_arn}.
        :param vpc_config: vpc_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#vpc_config EksCluster#vpc_config}
        :param access_config: access_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#access_config EksCluster#access_config}
        :param bootstrap_self_managed_addons: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_self_managed_addons EksCluster#bootstrap_self_managed_addons}.
        :param compute_config: compute_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#compute_config EksCluster#compute_config}
        :param enabled_cluster_log_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled_cluster_log_types EksCluster#enabled_cluster_log_types}.
        :param encryption_config: encryption_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#encryption_config EksCluster#encryption_config}
        :param force_update_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#force_update_version EksCluster#force_update_version}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#id EksCluster#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param kubernetes_network_config: kubernetes_network_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#kubernetes_network_config EksCluster#kubernetes_network_config}
        :param outpost_config: outpost_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#outpost_config EksCluster#outpost_config}
        :param remote_network_config: remote_network_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_network_config EksCluster#remote_network_config}
        :param storage_config: storage_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#storage_config EksCluster#storage_config}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags EksCluster#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags_all EksCluster#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#timeouts EksCluster#timeouts}
        :param upgrade_policy: upgrade_policy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#upgrade_policy EksCluster#upgrade_policy}
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#version EksCluster#version}.
        :param zonal_shift_config: zonal_shift_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#zonal_shift_config EksCluster#zonal_shift_config}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(vpc_config, dict):
            vpc_config = EksClusterVpcConfig(**vpc_config)
        if isinstance(access_config, dict):
            access_config = EksClusterAccessConfig(**access_config)
        if isinstance(compute_config, dict):
            compute_config = EksClusterComputeConfig(**compute_config)
        if isinstance(encryption_config, dict):
            encryption_config = EksClusterEncryptionConfig(**encryption_config)
        if isinstance(kubernetes_network_config, dict):
            kubernetes_network_config = EksClusterKubernetesNetworkConfig(**kubernetes_network_config)
        if isinstance(outpost_config, dict):
            outpost_config = EksClusterOutpostConfig(**outpost_config)
        if isinstance(remote_network_config, dict):
            remote_network_config = EksClusterRemoteNetworkConfig(**remote_network_config)
        if isinstance(storage_config, dict):
            storage_config = EksClusterStorageConfig(**storage_config)
        if isinstance(timeouts, dict):
            timeouts = EksClusterTimeouts(**timeouts)
        if isinstance(upgrade_policy, dict):
            upgrade_policy = EksClusterUpgradePolicy(**upgrade_policy)
        if isinstance(zonal_shift_config, dict):
            zonal_shift_config = EksClusterZonalShiftConfig(**zonal_shift_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca4644a2d50e0ea0e460f5601679d8145e105bb0ccdbb499365b1bb6047d1f8c)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument vpc_config", value=vpc_config, expected_type=type_hints["vpc_config"])
            check_type(argname="argument access_config", value=access_config, expected_type=type_hints["access_config"])
            check_type(argname="argument bootstrap_self_managed_addons", value=bootstrap_self_managed_addons, expected_type=type_hints["bootstrap_self_managed_addons"])
            check_type(argname="argument compute_config", value=compute_config, expected_type=type_hints["compute_config"])
            check_type(argname="argument enabled_cluster_log_types", value=enabled_cluster_log_types, expected_type=type_hints["enabled_cluster_log_types"])
            check_type(argname="argument encryption_config", value=encryption_config, expected_type=type_hints["encryption_config"])
            check_type(argname="argument force_update_version", value=force_update_version, expected_type=type_hints["force_update_version"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument kubernetes_network_config", value=kubernetes_network_config, expected_type=type_hints["kubernetes_network_config"])
            check_type(argname="argument outpost_config", value=outpost_config, expected_type=type_hints["outpost_config"])
            check_type(argname="argument remote_network_config", value=remote_network_config, expected_type=type_hints["remote_network_config"])
            check_type(argname="argument storage_config", value=storage_config, expected_type=type_hints["storage_config"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
            check_type(argname="argument upgrade_policy", value=upgrade_policy, expected_type=type_hints["upgrade_policy"])
            check_type(argname="argument version", value=version, expected_type=type_hints["version"])
            check_type(argname="argument zonal_shift_config", value=zonal_shift_config, expected_type=type_hints["zonal_shift_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "role_arn": role_arn,
            "vpc_config": vpc_config,
        }
        if connection is not None:
            self._values["connection"] = connection
        if count is not None:
            self._values["count"] = count
        if depends_on is not None:
            self._values["depends_on"] = depends_on
        if for_each is not None:
            self._values["for_each"] = for_each
        if lifecycle is not None:
            self._values["lifecycle"] = lifecycle
        if provider is not None:
            self._values["provider"] = provider
        if provisioners is not None:
            self._values["provisioners"] = provisioners
        if access_config is not None:
            self._values["access_config"] = access_config
        if bootstrap_self_managed_addons is not None:
            self._values["bootstrap_self_managed_addons"] = bootstrap_self_managed_addons
        if compute_config is not None:
            self._values["compute_config"] = compute_config
        if enabled_cluster_log_types is not None:
            self._values["enabled_cluster_log_types"] = enabled_cluster_log_types
        if encryption_config is not None:
            self._values["encryption_config"] = encryption_config
        if force_update_version is not None:
            self._values["force_update_version"] = force_update_version
        if id is not None:
            self._values["id"] = id
        if kubernetes_network_config is not None:
            self._values["kubernetes_network_config"] = kubernetes_network_config
        if outpost_config is not None:
            self._values["outpost_config"] = outpost_config
        if remote_network_config is not None:
            self._values["remote_network_config"] = remote_network_config
        if storage_config is not None:
            self._values["storage_config"] = storage_config
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if timeouts is not None:
            self._values["timeouts"] = timeouts
        if upgrade_policy is not None:
            self._values["upgrade_policy"] = upgrade_policy
        if version is not None:
            self._values["version"] = version
        if zonal_shift_config is not None:
            self._values["zonal_shift_config"] = zonal_shift_config

    @builtins.property
    def connection(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, _cdktf_9a9027ec.WinrmProvisionerConnection]]:
        '''
        :stability: experimental
        '''
        result = self._values.get("connection")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, _cdktf_9a9027ec.WinrmProvisionerConnection]], result)

    @builtins.property
    def count(
        self,
    ) -> typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]]:
        '''
        :stability: experimental
        '''
        result = self._values.get("count")
        return typing.cast(typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]], result)

    @builtins.property
    def depends_on(
        self,
    ) -> typing.Optional[typing.List[_cdktf_9a9027ec.ITerraformDependable]]:
        '''
        :stability: experimental
        '''
        result = self._values.get("depends_on")
        return typing.cast(typing.Optional[typing.List[_cdktf_9a9027ec.ITerraformDependable]], result)

    @builtins.property
    def for_each(self) -> typing.Optional[_cdktf_9a9027ec.ITerraformIterator]:
        '''
        :stability: experimental
        '''
        result = self._values.get("for_each")
        return typing.cast(typing.Optional[_cdktf_9a9027ec.ITerraformIterator], result)

    @builtins.property
    def lifecycle(self) -> typing.Optional[_cdktf_9a9027ec.TerraformResourceLifecycle]:
        '''
        :stability: experimental
        '''
        result = self._values.get("lifecycle")
        return typing.cast(typing.Optional[_cdktf_9a9027ec.TerraformResourceLifecycle], result)

    @builtins.property
    def provider(self) -> typing.Optional[_cdktf_9a9027ec.TerraformProvider]:
        '''
        :stability: experimental
        '''
        result = self._values.get("provider")
        return typing.cast(typing.Optional[_cdktf_9a9027ec.TerraformProvider], result)

    @builtins.property
    def provisioners(
        self,
    ) -> typing.Optional[typing.List[typing.Union[_cdktf_9a9027ec.FileProvisioner, _cdktf_9a9027ec.LocalExecProvisioner, _cdktf_9a9027ec.RemoteExecProvisioner]]]:
        '''
        :stability: experimental
        '''
        result = self._values.get("provisioners")
        return typing.cast(typing.Optional[typing.List[typing.Union[_cdktf_9a9027ec.FileProvisioner, _cdktf_9a9027ec.LocalExecProvisioner, _cdktf_9a9027ec.RemoteExecProvisioner]]], result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#name EksCluster#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#role_arn EksCluster#role_arn}.'''
        result = self._values.get("role_arn")
        assert result is not None, "Required property 'role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def vpc_config(self) -> "EksClusterVpcConfig":
        '''vpc_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#vpc_config EksCluster#vpc_config}
        '''
        result = self._values.get("vpc_config")
        assert result is not None, "Required property 'vpc_config' is missing"
        return typing.cast("EksClusterVpcConfig", result)

    @builtins.property
    def access_config(self) -> typing.Optional[EksClusterAccessConfig]:
        '''access_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#access_config EksCluster#access_config}
        '''
        result = self._values.get("access_config")
        return typing.cast(typing.Optional[EksClusterAccessConfig], result)

    @builtins.property
    def bootstrap_self_managed_addons(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_self_managed_addons EksCluster#bootstrap_self_managed_addons}.'''
        result = self._values.get("bootstrap_self_managed_addons")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def compute_config(self) -> typing.Optional[EksClusterComputeConfig]:
        '''compute_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#compute_config EksCluster#compute_config}
        '''
        result = self._values.get("compute_config")
        return typing.cast(typing.Optional[EksClusterComputeConfig], result)

    @builtins.property
    def enabled_cluster_log_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled_cluster_log_types EksCluster#enabled_cluster_log_types}.'''
        result = self._values.get("enabled_cluster_log_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def encryption_config(self) -> typing.Optional["EksClusterEncryptionConfig"]:
        '''encryption_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#encryption_config EksCluster#encryption_config}
        '''
        result = self._values.get("encryption_config")
        return typing.cast(typing.Optional["EksClusterEncryptionConfig"], result)

    @builtins.property
    def force_update_version(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#force_update_version EksCluster#force_update_version}.'''
        result = self._values.get("force_update_version")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#id EksCluster#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def kubernetes_network_config(
        self,
    ) -> typing.Optional["EksClusterKubernetesNetworkConfig"]:
        '''kubernetes_network_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#kubernetes_network_config EksCluster#kubernetes_network_config}
        '''
        result = self._values.get("kubernetes_network_config")
        return typing.cast(typing.Optional["EksClusterKubernetesNetworkConfig"], result)

    @builtins.property
    def outpost_config(self) -> typing.Optional["EksClusterOutpostConfig"]:
        '''outpost_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#outpost_config EksCluster#outpost_config}
        '''
        result = self._values.get("outpost_config")
        return typing.cast(typing.Optional["EksClusterOutpostConfig"], result)

    @builtins.property
    def remote_network_config(self) -> typing.Optional["EksClusterRemoteNetworkConfig"]:
        '''remote_network_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_network_config EksCluster#remote_network_config}
        '''
        result = self._values.get("remote_network_config")
        return typing.cast(typing.Optional["EksClusterRemoteNetworkConfig"], result)

    @builtins.property
    def storage_config(self) -> typing.Optional["EksClusterStorageConfig"]:
        '''storage_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#storage_config EksCluster#storage_config}
        '''
        result = self._values.get("storage_config")
        return typing.cast(typing.Optional["EksClusterStorageConfig"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags EksCluster#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags_all EksCluster#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["EksClusterTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#timeouts EksCluster#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["EksClusterTimeouts"], result)

    @builtins.property
    def upgrade_policy(self) -> typing.Optional["EksClusterUpgradePolicy"]:
        '''upgrade_policy block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#upgrade_policy EksCluster#upgrade_policy}
        '''
        result = self._values.get("upgrade_policy")
        return typing.cast(typing.Optional["EksClusterUpgradePolicy"], result)

    @builtins.property
    def version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#version EksCluster#version}.'''
        result = self._values.get("version")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def zonal_shift_config(self) -> typing.Optional["EksClusterZonalShiftConfig"]:
        '''zonal_shift_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#zonal_shift_config EksCluster#zonal_shift_config}
        '''
        result = self._values.get("zonal_shift_config")
        return typing.cast(typing.Optional["EksClusterZonalShiftConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterEncryptionConfig",
    jsii_struct_bases=[],
    name_mapping={"provider": "provider", "resources": "resources"},
)
class EksClusterEncryptionConfig:
    def __init__(
        self,
        *,
        provider: typing.Union["EksClusterEncryptionConfigProvider", typing.Dict[builtins.str, typing.Any]],
        resources: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param provider: provider block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#provider EksCluster#provider}
        :param resources: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#resources EksCluster#resources}.
        '''
        if isinstance(provider, dict):
            provider = EksClusterEncryptionConfigProvider(**provider)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f0cb2bfc239355aa5cca8aa1ace5c27f64178028f166615773f4e2ba6baca4dc)
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument resources", value=resources, expected_type=type_hints["resources"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "provider": provider,
            "resources": resources,
        }

    @builtins.property
    def provider(self) -> "EksClusterEncryptionConfigProvider":
        '''provider block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#provider EksCluster#provider}
        '''
        result = self._values.get("provider")
        assert result is not None, "Required property 'provider' is missing"
        return typing.cast("EksClusterEncryptionConfigProvider", result)

    @builtins.property
    def resources(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#resources EksCluster#resources}.'''
        result = self._values.get("resources")
        assert result is not None, "Required property 'resources' is missing"
        return typing.cast(typing.List[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterEncryptionConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterEncryptionConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterEncryptionConfigOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21d33b1743a57cb279e9fc16495c2f6c0757c56e88fd8ed58648c1f5c2c331c5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putProvider")
    def put_provider(self, *, key_arn: builtins.str) -> None:
        '''
        :param key_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#key_arn EksCluster#key_arn}.
        '''
        value = EksClusterEncryptionConfigProvider(key_arn=key_arn)

        return typing.cast(None, jsii.invoke(self, "putProvider", [value]))

    @builtins.property
    @jsii.member(jsii_name="provider")
    def provider(self) -> "EksClusterEncryptionConfigProviderOutputReference":
        return typing.cast("EksClusterEncryptionConfigProviderOutputReference", jsii.get(self, "provider"))

    @builtins.property
    @jsii.member(jsii_name="providerInput")
    def provider_input(self) -> typing.Optional["EksClusterEncryptionConfigProvider"]:
        return typing.cast(typing.Optional["EksClusterEncryptionConfigProvider"], jsii.get(self, "providerInput"))

    @builtins.property
    @jsii.member(jsii_name="resourcesInput")
    def resources_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "resourcesInput"))

    @builtins.property
    @jsii.member(jsii_name="resources")
    def resources(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "resources"))

    @resources.setter
    def resources(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b0e5981ac2d49a8ffaec9e09241dec9abe65b51670ebc5b987f71d601ab1b1d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resources", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterEncryptionConfig]:
        return typing.cast(typing.Optional[EksClusterEncryptionConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EksClusterEncryptionConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e1bbe6aa08670ff1d269e0a8017afe2a0661ca2dad29aa849817cc3e81d82641)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterEncryptionConfigProvider",
    jsii_struct_bases=[],
    name_mapping={"key_arn": "keyArn"},
)
class EksClusterEncryptionConfigProvider:
    def __init__(self, *, key_arn: builtins.str) -> None:
        '''
        :param key_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#key_arn EksCluster#key_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__816be381d0bc77ad679cf22370756b79db4eb3b09685cd64f7df4da1744b7468)
            check_type(argname="argument key_arn", value=key_arn, expected_type=type_hints["key_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "key_arn": key_arn,
        }

    @builtins.property
    def key_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#key_arn EksCluster#key_arn}.'''
        result = self._values.get("key_arn")
        assert result is not None, "Required property 'key_arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterEncryptionConfigProvider(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterEncryptionConfigProviderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterEncryptionConfigProviderOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21970090551c98658920d638920560ab39e72a757c603c6f250be5a6de6808e3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="keyArnInput")
    def key_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "keyArnInput"))

    @builtins.property
    @jsii.member(jsii_name="keyArn")
    def key_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "keyArn"))

    @key_arn.setter
    def key_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba7157ea064093bdd5323d3c3cbffb66a36c086d3fc997cf5d61f855c8b314f7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "keyArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterEncryptionConfigProvider]:
        return typing.cast(typing.Optional[EksClusterEncryptionConfigProvider], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EksClusterEncryptionConfigProvider],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__72e664f690913b1bd114ff74647edbe007930ec6dbc0dbdfb482af2ffe094d96)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterIdentity",
    jsii_struct_bases=[],
    name_mapping={},
)
class EksClusterIdentity:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterIdentity(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterIdentityList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterIdentityList",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
        wraps_set: builtins.bool,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        :param wraps_set: whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a1c6697f02eaea963f549d60c31bbe4b10a64d95c8d2ac5cce40321e353e5958)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "EksClusterIdentityOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01f7a5f635365922f99d3ac8fc9cdaa5bd6eb5cff276a3c5ee3bcb25281f30b3)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("EksClusterIdentityOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac6a53e1f56f9f417a12fb544f0c416df04c45a4a595bbba390673be905ef503)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terraformAttribute", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="terraformResource")
    def _terraform_resource(self) -> _cdktf_9a9027ec.IInterpolatingParent:
        '''The parent resource.'''
        return typing.cast(_cdktf_9a9027ec.IInterpolatingParent, jsii.get(self, "terraformResource"))

    @_terraform_resource.setter
    def _terraform_resource(self, value: _cdktf_9a9027ec.IInterpolatingParent) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d92ca0130718efbf86a172b178c9a8f09d02731ea1682240add0b8b5cf515d65)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terraformResource", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="wrapsSet")
    def _wraps_set(self) -> builtins.bool:
        '''whether the list is wrapping a set (will add tolist() to be able to access an item via an index).'''
        return typing.cast(builtins.bool, jsii.get(self, "wrapsSet"))

    @_wraps_set.setter
    def _wraps_set(self, value: builtins.bool) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d22572d8f2a3ac2b308e7185df511eea7e9193c08c412e966627159d4a25ae8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterIdentityOidc",
    jsii_struct_bases=[],
    name_mapping={},
)
class EksClusterIdentityOidc:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterIdentityOidc(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterIdentityOidcList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterIdentityOidcList",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
        wraps_set: builtins.bool,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        :param wraps_set: whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9100fa79771986ba0c4aec6f52cd6d19f7bbadfbd9dd9438b40db2a84f35613b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "EksClusterIdentityOidcOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__69fe2bd3f77b17ef4a10aff001257f383c470e49a4cd6e9e62510e5ac7ceece4)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("EksClusterIdentityOidcOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b616b8dce2c2a23faead874f751bcef0aeac954bc4b30c6c8c85bd9d82dc6f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terraformAttribute", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="terraformResource")
    def _terraform_resource(self) -> _cdktf_9a9027ec.IInterpolatingParent:
        '''The parent resource.'''
        return typing.cast(_cdktf_9a9027ec.IInterpolatingParent, jsii.get(self, "terraformResource"))

    @_terraform_resource.setter
    def _terraform_resource(self, value: _cdktf_9a9027ec.IInterpolatingParent) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a0d46962011eab42b562994e931c7bcc7704d942c8306bdc1d478fca266fec5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "terraformResource", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="wrapsSet")
    def _wraps_set(self) -> builtins.bool:
        '''whether the list is wrapping a set (will add tolist() to be able to access an item via an index).'''
        return typing.cast(builtins.bool, jsii.get(self, "wrapsSet"))

    @_wraps_set.setter
    def _wraps_set(self, value: builtins.bool) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e904e1ae8eebf2f51979d0d9fe1e09d978f06a4694f459204547cde46a996b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class EksClusterIdentityOidcOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterIdentityOidcOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
        complex_object_index: jsii.Number,
        complex_object_is_from_set: builtins.bool,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        :param complex_object_index: the index of this item in the list.
        :param complex_object_is_from_set: whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b5735638c56c324028893e9933f97c6df55ba799ec1799f60b5b2a114dcaf0bc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="issuer")
    def issuer(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "issuer"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterIdentityOidc]:
        return typing.cast(typing.Optional[EksClusterIdentityOidc], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[EksClusterIdentityOidc]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aab2a13a625ba7d9ff6d91236852f4b574aa02248b0f500250feb782f584ae42)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class EksClusterIdentityOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterIdentityOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
        complex_object_index: jsii.Number,
        complex_object_is_from_set: builtins.bool,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        :param complex_object_index: the index of this item in the list.
        :param complex_object_is_from_set: whether the list is wrapping a set (will add tolist() to be able to access an item via an index).
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e519ff671b67a2b685c6d694671ba233fa2d7a633badf291bafd9fe97d2a7b99)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="oidc")
    def oidc(self) -> EksClusterIdentityOidcList:
        return typing.cast(EksClusterIdentityOidcList, jsii.get(self, "oidc"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterIdentity]:
        return typing.cast(typing.Optional[EksClusterIdentity], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[EksClusterIdentity]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c5c4ab2c2ed8ddeb0fce390dd490f2099d470eae805ba9f9579bcd0be72dc1f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterKubernetesNetworkConfig",
    jsii_struct_bases=[],
    name_mapping={
        "elastic_load_balancing": "elasticLoadBalancing",
        "ip_family": "ipFamily",
        "service_ipv4_cidr": "serviceIpv4Cidr",
    },
)
class EksClusterKubernetesNetworkConfig:
    def __init__(
        self,
        *,
        elastic_load_balancing: typing.Optional[typing.Union["EksClusterKubernetesNetworkConfigElasticLoadBalancing", typing.Dict[builtins.str, typing.Any]]] = None,
        ip_family: typing.Optional[builtins.str] = None,
        service_ipv4_cidr: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param elastic_load_balancing: elastic_load_balancing block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#elastic_load_balancing EksCluster#elastic_load_balancing}
        :param ip_family: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#ip_family EksCluster#ip_family}.
        :param service_ipv4_cidr: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#service_ipv4_cidr EksCluster#service_ipv4_cidr}.
        '''
        if isinstance(elastic_load_balancing, dict):
            elastic_load_balancing = EksClusterKubernetesNetworkConfigElasticLoadBalancing(**elastic_load_balancing)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08570fce41d740d4dcb20dff3adc5500dbcb5502d34215a1680ccb5b14c7f301)
            check_type(argname="argument elastic_load_balancing", value=elastic_load_balancing, expected_type=type_hints["elastic_load_balancing"])
            check_type(argname="argument ip_family", value=ip_family, expected_type=type_hints["ip_family"])
            check_type(argname="argument service_ipv4_cidr", value=service_ipv4_cidr, expected_type=type_hints["service_ipv4_cidr"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if elastic_load_balancing is not None:
            self._values["elastic_load_balancing"] = elastic_load_balancing
        if ip_family is not None:
            self._values["ip_family"] = ip_family
        if service_ipv4_cidr is not None:
            self._values["service_ipv4_cidr"] = service_ipv4_cidr

    @builtins.property
    def elastic_load_balancing(
        self,
    ) -> typing.Optional["EksClusterKubernetesNetworkConfigElasticLoadBalancing"]:
        '''elastic_load_balancing block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#elastic_load_balancing EksCluster#elastic_load_balancing}
        '''
        result = self._values.get("elastic_load_balancing")
        return typing.cast(typing.Optional["EksClusterKubernetesNetworkConfigElasticLoadBalancing"], result)

    @builtins.property
    def ip_family(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#ip_family EksCluster#ip_family}.'''
        result = self._values.get("ip_family")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def service_ipv4_cidr(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#service_ipv4_cidr EksCluster#service_ipv4_cidr}.'''
        result = self._values.get("service_ipv4_cidr")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterKubernetesNetworkConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterKubernetesNetworkConfigElasticLoadBalancing",
    jsii_struct_bases=[],
    name_mapping={"enabled": "enabled"},
)
class EksClusterKubernetesNetworkConfigElasticLoadBalancing:
    def __init__(
        self,
        *,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f01bc54fa339a5717b764daee2a6c7360b6fa4cd439360faf99d4137802aec12)
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if enabled is not None:
            self._values["enabled"] = enabled

    @builtins.property
    def enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.'''
        result = self._values.get("enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterKubernetesNetworkConfigElasticLoadBalancing(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterKubernetesNetworkConfigElasticLoadBalancingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterKubernetesNetworkConfigElasticLoadBalancingOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__34a55c369056397ad9632b027f58b32bce1ea41fd5c68435980f465e24200911)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetEnabled")
    def reset_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnabled", []))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="enabled")
    def enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enabled"))

    @enabled.setter
    def enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__277863a2c5f53219331a4d2379f03c47759c4930533f97cddb196e2dc2f985d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[EksClusterKubernetesNetworkConfigElasticLoadBalancing]:
        return typing.cast(typing.Optional[EksClusterKubernetesNetworkConfigElasticLoadBalancing], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EksClusterKubernetesNetworkConfigElasticLoadBalancing],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4655f371bb7664de70434dd9661c68c0c013302ab4bb4d9ec149fc283eb59ac4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class EksClusterKubernetesNetworkConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterKubernetesNetworkConfigOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9314d832e4a7054dab19db37f810e7b4d07644832eb4f4bea3bce3461c63e776)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putElasticLoadBalancing")
    def put_elastic_load_balancing(
        self,
        *,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
        '''
        value = EksClusterKubernetesNetworkConfigElasticLoadBalancing(enabled=enabled)

        return typing.cast(None, jsii.invoke(self, "putElasticLoadBalancing", [value]))

    @jsii.member(jsii_name="resetElasticLoadBalancing")
    def reset_elastic_load_balancing(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetElasticLoadBalancing", []))

    @jsii.member(jsii_name="resetIpFamily")
    def reset_ip_family(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIpFamily", []))

    @jsii.member(jsii_name="resetServiceIpv4Cidr")
    def reset_service_ipv4_cidr(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetServiceIpv4Cidr", []))

    @builtins.property
    @jsii.member(jsii_name="elasticLoadBalancing")
    def elastic_load_balancing(
        self,
    ) -> EksClusterKubernetesNetworkConfigElasticLoadBalancingOutputReference:
        return typing.cast(EksClusterKubernetesNetworkConfigElasticLoadBalancingOutputReference, jsii.get(self, "elasticLoadBalancing"))

    @builtins.property
    @jsii.member(jsii_name="serviceIpv6Cidr")
    def service_ipv6_cidr(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "serviceIpv6Cidr"))

    @builtins.property
    @jsii.member(jsii_name="elasticLoadBalancingInput")
    def elastic_load_balancing_input(
        self,
    ) -> typing.Optional[EksClusterKubernetesNetworkConfigElasticLoadBalancing]:
        return typing.cast(typing.Optional[EksClusterKubernetesNetworkConfigElasticLoadBalancing], jsii.get(self, "elasticLoadBalancingInput"))

    @builtins.property
    @jsii.member(jsii_name="ipFamilyInput")
    def ip_family_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ipFamilyInput"))

    @builtins.property
    @jsii.member(jsii_name="serviceIpv4CidrInput")
    def service_ipv4_cidr_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "serviceIpv4CidrInput"))

    @builtins.property
    @jsii.member(jsii_name="ipFamily")
    def ip_family(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ipFamily"))

    @ip_family.setter
    def ip_family(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efafdedf9835c79774c04181a2050cbd714b14c99228823304c733758f1757aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ipFamily", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="serviceIpv4Cidr")
    def service_ipv4_cidr(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "serviceIpv4Cidr"))

    @service_ipv4_cidr.setter
    def service_ipv4_cidr(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb61ec7458d89fd890823514de03139df9812d29c17f6976d2a62a165221c216)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "serviceIpv4Cidr", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterKubernetesNetworkConfig]:
        return typing.cast(typing.Optional[EksClusterKubernetesNetworkConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EksClusterKubernetesNetworkConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b0d05e39276095ef1bd488f6074c6c11cc44c9848b9f0388e5d85446e8668061)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterOutpostConfig",
    jsii_struct_bases=[],
    name_mapping={
        "control_plane_instance_type": "controlPlaneInstanceType",
        "outpost_arns": "outpostArns",
        "control_plane_placement": "controlPlanePlacement",
    },
)
class EksClusterOutpostConfig:
    def __init__(
        self,
        *,
        control_plane_instance_type: builtins.str,
        outpost_arns: typing.Sequence[builtins.str],
        control_plane_placement: typing.Optional[typing.Union["EksClusterOutpostConfigControlPlanePlacement", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param control_plane_instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#control_plane_instance_type EksCluster#control_plane_instance_type}.
        :param outpost_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#outpost_arns EksCluster#outpost_arns}.
        :param control_plane_placement: control_plane_placement block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#control_plane_placement EksCluster#control_plane_placement}
        '''
        if isinstance(control_plane_placement, dict):
            control_plane_placement = EksClusterOutpostConfigControlPlanePlacement(**control_plane_placement)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33daa8e23608ce47e9062fcf22a158052f22c20215161fe14e99c46fab25126a)
            check_type(argname="argument control_plane_instance_type", value=control_plane_instance_type, expected_type=type_hints["control_plane_instance_type"])
            check_type(argname="argument outpost_arns", value=outpost_arns, expected_type=type_hints["outpost_arns"])
            check_type(argname="argument control_plane_placement", value=control_plane_placement, expected_type=type_hints["control_plane_placement"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "control_plane_instance_type": control_plane_instance_type,
            "outpost_arns": outpost_arns,
        }
        if control_plane_placement is not None:
            self._values["control_plane_placement"] = control_plane_placement

    @builtins.property
    def control_plane_instance_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#control_plane_instance_type EksCluster#control_plane_instance_type}.'''
        result = self._values.get("control_plane_instance_type")
        assert result is not None, "Required property 'control_plane_instance_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def outpost_arns(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#outpost_arns EksCluster#outpost_arns}.'''
        result = self._values.get("outpost_arns")
        assert result is not None, "Required property 'outpost_arns' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def control_plane_placement(
        self,
    ) -> typing.Optional["EksClusterOutpostConfigControlPlanePlacement"]:
        '''control_plane_placement block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#control_plane_placement EksCluster#control_plane_placement}
        '''
        result = self._values.get("control_plane_placement")
        return typing.cast(typing.Optional["EksClusterOutpostConfigControlPlanePlacement"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterOutpostConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterOutpostConfigControlPlanePlacement",
    jsii_struct_bases=[],
    name_mapping={"group_name": "groupName"},
)
class EksClusterOutpostConfigControlPlanePlacement:
    def __init__(self, *, group_name: builtins.str) -> None:
        '''
        :param group_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#group_name EksCluster#group_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bb8561ff5b1b262198da0d661e7ee2ad3fc6d7493dfeba77421ccd9fdb29a469)
            check_type(argname="argument group_name", value=group_name, expected_type=type_hints["group_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "group_name": group_name,
        }

    @builtins.property
    def group_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#group_name EksCluster#group_name}.'''
        result = self._values.get("group_name")
        assert result is not None, "Required property 'group_name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterOutpostConfigControlPlanePlacement(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterOutpostConfigControlPlanePlacementOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterOutpostConfigControlPlanePlacementOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7a8ed470093746f153d79dc27cc072907c480eb66dd5adb804967bca952c8ce7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="groupNameInput")
    def group_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "groupNameInput"))

    @builtins.property
    @jsii.member(jsii_name="groupName")
    def group_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "groupName"))

    @group_name.setter
    def group_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bc7d877254bcb3a01012f988e37683cbfff0b2cd4bf0b9843c4661bd51a81f09)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "groupName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[EksClusterOutpostConfigControlPlanePlacement]:
        return typing.cast(typing.Optional[EksClusterOutpostConfigControlPlanePlacement], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EksClusterOutpostConfigControlPlanePlacement],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__515a14f5c381707576bd41141679333bad5b6f985cece3b9880763aa2f9f207b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class EksClusterOutpostConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterOutpostConfigOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__460b311af3092ec29ddc60a7db51667687f4e61d72d5f36924eec14b2eb653a1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putControlPlanePlacement")
    def put_control_plane_placement(self, *, group_name: builtins.str) -> None:
        '''
        :param group_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#group_name EksCluster#group_name}.
        '''
        value = EksClusterOutpostConfigControlPlanePlacement(group_name=group_name)

        return typing.cast(None, jsii.invoke(self, "putControlPlanePlacement", [value]))

    @jsii.member(jsii_name="resetControlPlanePlacement")
    def reset_control_plane_placement(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetControlPlanePlacement", []))

    @builtins.property
    @jsii.member(jsii_name="controlPlanePlacement")
    def control_plane_placement(
        self,
    ) -> EksClusterOutpostConfigControlPlanePlacementOutputReference:
        return typing.cast(EksClusterOutpostConfigControlPlanePlacementOutputReference, jsii.get(self, "controlPlanePlacement"))

    @builtins.property
    @jsii.member(jsii_name="controlPlaneInstanceTypeInput")
    def control_plane_instance_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "controlPlaneInstanceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="controlPlanePlacementInput")
    def control_plane_placement_input(
        self,
    ) -> typing.Optional[EksClusterOutpostConfigControlPlanePlacement]:
        return typing.cast(typing.Optional[EksClusterOutpostConfigControlPlanePlacement], jsii.get(self, "controlPlanePlacementInput"))

    @builtins.property
    @jsii.member(jsii_name="outpostArnsInput")
    def outpost_arns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "outpostArnsInput"))

    @builtins.property
    @jsii.member(jsii_name="controlPlaneInstanceType")
    def control_plane_instance_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "controlPlaneInstanceType"))

    @control_plane_instance_type.setter
    def control_plane_instance_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a36ef9848c8542f91483a26ee1adf2e893289cf1fcf2b43a46bf643a30d0883)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "controlPlaneInstanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="outpostArns")
    def outpost_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "outpostArns"))

    @outpost_arns.setter
    def outpost_arns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__382e98fa5bf81c6b7c9be486c648dfed3254b46394e03e252bc8741aade3af16)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "outpostArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterOutpostConfig]:
        return typing.cast(typing.Optional[EksClusterOutpostConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[EksClusterOutpostConfig]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a575abc700f952a3158676f5815df81de2a4c3c760cfa22df38c3e2427ae964)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterRemoteNetworkConfig",
    jsii_struct_bases=[],
    name_mapping={
        "remote_node_networks": "remoteNodeNetworks",
        "remote_pod_networks": "remotePodNetworks",
    },
)
class EksClusterRemoteNetworkConfig:
    def __init__(
        self,
        *,
        remote_node_networks: typing.Union["EksClusterRemoteNetworkConfigRemoteNodeNetworks", typing.Dict[builtins.str, typing.Any]],
        remote_pod_networks: typing.Optional[typing.Union["EksClusterRemoteNetworkConfigRemotePodNetworks", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param remote_node_networks: remote_node_networks block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_node_networks EksCluster#remote_node_networks}
        :param remote_pod_networks: remote_pod_networks block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_pod_networks EksCluster#remote_pod_networks}
        '''
        if isinstance(remote_node_networks, dict):
            remote_node_networks = EksClusterRemoteNetworkConfigRemoteNodeNetworks(**remote_node_networks)
        if isinstance(remote_pod_networks, dict):
            remote_pod_networks = EksClusterRemoteNetworkConfigRemotePodNetworks(**remote_pod_networks)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e04c9cdd09c04cc75c22cba42d14715dec3558f37289fcc258934ff583cc01f)
            check_type(argname="argument remote_node_networks", value=remote_node_networks, expected_type=type_hints["remote_node_networks"])
            check_type(argname="argument remote_pod_networks", value=remote_pod_networks, expected_type=type_hints["remote_pod_networks"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "remote_node_networks": remote_node_networks,
        }
        if remote_pod_networks is not None:
            self._values["remote_pod_networks"] = remote_pod_networks

    @builtins.property
    def remote_node_networks(self) -> "EksClusterRemoteNetworkConfigRemoteNodeNetworks":
        '''remote_node_networks block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_node_networks EksCluster#remote_node_networks}
        '''
        result = self._values.get("remote_node_networks")
        assert result is not None, "Required property 'remote_node_networks' is missing"
        return typing.cast("EksClusterRemoteNetworkConfigRemoteNodeNetworks", result)

    @builtins.property
    def remote_pod_networks(
        self,
    ) -> typing.Optional["EksClusterRemoteNetworkConfigRemotePodNetworks"]:
        '''remote_pod_networks block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_pod_networks EksCluster#remote_pod_networks}
        '''
        result = self._values.get("remote_pod_networks")
        return typing.cast(typing.Optional["EksClusterRemoteNetworkConfigRemotePodNetworks"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterRemoteNetworkConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterRemoteNetworkConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterRemoteNetworkConfigOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__be1f5e21dd3b8095dd4ba53ffac80fe5f7778a761f22be6fc043e0af79190ece)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRemoteNodeNetworks")
    def put_remote_node_networks(
        self,
        *,
        cidrs: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param cidrs: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#cidrs EksCluster#cidrs}.
        '''
        value = EksClusterRemoteNetworkConfigRemoteNodeNetworks(cidrs=cidrs)

        return typing.cast(None, jsii.invoke(self, "putRemoteNodeNetworks", [value]))

    @jsii.member(jsii_name="putRemotePodNetworks")
    def put_remote_pod_networks(
        self,
        *,
        cidrs: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param cidrs: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#cidrs EksCluster#cidrs}.
        '''
        value = EksClusterRemoteNetworkConfigRemotePodNetworks(cidrs=cidrs)

        return typing.cast(None, jsii.invoke(self, "putRemotePodNetworks", [value]))

    @jsii.member(jsii_name="resetRemotePodNetworks")
    def reset_remote_pod_networks(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRemotePodNetworks", []))

    @builtins.property
    @jsii.member(jsii_name="remoteNodeNetworks")
    def remote_node_networks(
        self,
    ) -> "EksClusterRemoteNetworkConfigRemoteNodeNetworksOutputReference":
        return typing.cast("EksClusterRemoteNetworkConfigRemoteNodeNetworksOutputReference", jsii.get(self, "remoteNodeNetworks"))

    @builtins.property
    @jsii.member(jsii_name="remotePodNetworks")
    def remote_pod_networks(
        self,
    ) -> "EksClusterRemoteNetworkConfigRemotePodNetworksOutputReference":
        return typing.cast("EksClusterRemoteNetworkConfigRemotePodNetworksOutputReference", jsii.get(self, "remotePodNetworks"))

    @builtins.property
    @jsii.member(jsii_name="remoteNodeNetworksInput")
    def remote_node_networks_input(
        self,
    ) -> typing.Optional["EksClusterRemoteNetworkConfigRemoteNodeNetworks"]:
        return typing.cast(typing.Optional["EksClusterRemoteNetworkConfigRemoteNodeNetworks"], jsii.get(self, "remoteNodeNetworksInput"))

    @builtins.property
    @jsii.member(jsii_name="remotePodNetworksInput")
    def remote_pod_networks_input(
        self,
    ) -> typing.Optional["EksClusterRemoteNetworkConfigRemotePodNetworks"]:
        return typing.cast(typing.Optional["EksClusterRemoteNetworkConfigRemotePodNetworks"], jsii.get(self, "remotePodNetworksInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterRemoteNetworkConfig]:
        return typing.cast(typing.Optional[EksClusterRemoteNetworkConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EksClusterRemoteNetworkConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__92264a7f81ff12a2e0344a9f3cc17738eea8af776122b1cf5cba2561fada8521)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterRemoteNetworkConfigRemoteNodeNetworks",
    jsii_struct_bases=[],
    name_mapping={"cidrs": "cidrs"},
)
class EksClusterRemoteNetworkConfigRemoteNodeNetworks:
    def __init__(
        self,
        *,
        cidrs: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param cidrs: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#cidrs EksCluster#cidrs}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a2b5d9a3e2e45b5bace61a7728a4b198174ac31382b0b0665208d936749e2e49)
            check_type(argname="argument cidrs", value=cidrs, expected_type=type_hints["cidrs"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if cidrs is not None:
            self._values["cidrs"] = cidrs

    @builtins.property
    def cidrs(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#cidrs EksCluster#cidrs}.'''
        result = self._values.get("cidrs")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterRemoteNetworkConfigRemoteNodeNetworks(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterRemoteNetworkConfigRemoteNodeNetworksOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterRemoteNetworkConfigRemoteNodeNetworksOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__034077b390bd108f4a3da56333ae0c91fca1dd9ac28c73f4e314c672e76e8539)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCidrs")
    def reset_cidrs(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCidrs", []))

    @builtins.property
    @jsii.member(jsii_name="cidrsInput")
    def cidrs_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "cidrsInput"))

    @builtins.property
    @jsii.member(jsii_name="cidrs")
    def cidrs(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "cidrs"))

    @cidrs.setter
    def cidrs(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__69a9bab0efc5590eebf0c177c474fa7f63b298a503bd39b14a8c08c3c58d9bac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cidrs", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[EksClusterRemoteNetworkConfigRemoteNodeNetworks]:
        return typing.cast(typing.Optional[EksClusterRemoteNetworkConfigRemoteNodeNetworks], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EksClusterRemoteNetworkConfigRemoteNodeNetworks],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f2b446ed97f275fd609a9d0623fbed4d2fec4c05a69f1fdcd0353b0b5aedc2d3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterRemoteNetworkConfigRemotePodNetworks",
    jsii_struct_bases=[],
    name_mapping={"cidrs": "cidrs"},
)
class EksClusterRemoteNetworkConfigRemotePodNetworks:
    def __init__(
        self,
        *,
        cidrs: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param cidrs: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#cidrs EksCluster#cidrs}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79bc7837b3fb95d13c94fe14cfd928e88efb141b5d0312d70357cf6b4bccecac)
            check_type(argname="argument cidrs", value=cidrs, expected_type=type_hints["cidrs"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if cidrs is not None:
            self._values["cidrs"] = cidrs

    @builtins.property
    def cidrs(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#cidrs EksCluster#cidrs}.'''
        result = self._values.get("cidrs")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterRemoteNetworkConfigRemotePodNetworks(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterRemoteNetworkConfigRemotePodNetworksOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterRemoteNetworkConfigRemotePodNetworksOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cffdac063ffc273e5a358aa915f705e7c03c26fe9d89e0bd5e01487536d89870)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCidrs")
    def reset_cidrs(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCidrs", []))

    @builtins.property
    @jsii.member(jsii_name="cidrsInput")
    def cidrs_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "cidrsInput"))

    @builtins.property
    @jsii.member(jsii_name="cidrs")
    def cidrs(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "cidrs"))

    @cidrs.setter
    def cidrs(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5222c6443dcd198665f8f1ffff363b820474e30a76d2f83fb179b4075aac32b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cidrs", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[EksClusterRemoteNetworkConfigRemotePodNetworks]:
        return typing.cast(typing.Optional[EksClusterRemoteNetworkConfigRemotePodNetworks], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EksClusterRemoteNetworkConfigRemotePodNetworks],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c28f8005626f75d2bf43acd6d4c9f9b8cbc0756351c193f6949927015790f152)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterStorageConfig",
    jsii_struct_bases=[],
    name_mapping={"block_storage": "blockStorage"},
)
class EksClusterStorageConfig:
    def __init__(
        self,
        *,
        block_storage: typing.Optional[typing.Union["EksClusterStorageConfigBlockStorage", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param block_storage: block_storage block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#block_storage EksCluster#block_storage}
        '''
        if isinstance(block_storage, dict):
            block_storage = EksClusterStorageConfigBlockStorage(**block_storage)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a1f1bdbe9ed58c183b07d95ecc4641b76cb7a67f89d7592f00dfa29d01c0e828)
            check_type(argname="argument block_storage", value=block_storage, expected_type=type_hints["block_storage"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if block_storage is not None:
            self._values["block_storage"] = block_storage

    @builtins.property
    def block_storage(self) -> typing.Optional["EksClusterStorageConfigBlockStorage"]:
        '''block_storage block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#block_storage EksCluster#block_storage}
        '''
        result = self._values.get("block_storage")
        return typing.cast(typing.Optional["EksClusterStorageConfigBlockStorage"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterStorageConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterStorageConfigBlockStorage",
    jsii_struct_bases=[],
    name_mapping={"enabled": "enabled"},
)
class EksClusterStorageConfigBlockStorage:
    def __init__(
        self,
        *,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b856e92ee0127e19f0d6d971778b43bc3eae346515c68adb6b0b79f689531bae)
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if enabled is not None:
            self._values["enabled"] = enabled

    @builtins.property
    def enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.'''
        result = self._values.get("enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterStorageConfigBlockStorage(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterStorageConfigBlockStorageOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterStorageConfigBlockStorageOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d8434e228c3350fc96d88843357052581ad26f2140f7ad7d1b0b5249a4a15d78)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetEnabled")
    def reset_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnabled", []))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="enabled")
    def enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enabled"))

    @enabled.setter
    def enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__85db22228f56a77219c2a6803fb5de5c800017249dbd339ba4daef4b831e0006)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterStorageConfigBlockStorage]:
        return typing.cast(typing.Optional[EksClusterStorageConfigBlockStorage], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EksClusterStorageConfigBlockStorage],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea6faad9fd6cd818d05cccc3d2c6dffd9cbd067b1dc64e33755b239d9e7b43f0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class EksClusterStorageConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterStorageConfigOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e93898ca02bbef31e362166ee785bed007d3d4bfe67cce7473721ff88954a8c8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putBlockStorage")
    def put_block_storage(
        self,
        *,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
        '''
        value = EksClusterStorageConfigBlockStorage(enabled=enabled)

        return typing.cast(None, jsii.invoke(self, "putBlockStorage", [value]))

    @jsii.member(jsii_name="resetBlockStorage")
    def reset_block_storage(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBlockStorage", []))

    @builtins.property
    @jsii.member(jsii_name="blockStorage")
    def block_storage(self) -> EksClusterStorageConfigBlockStorageOutputReference:
        return typing.cast(EksClusterStorageConfigBlockStorageOutputReference, jsii.get(self, "blockStorage"))

    @builtins.property
    @jsii.member(jsii_name="blockStorageInput")
    def block_storage_input(
        self,
    ) -> typing.Optional[EksClusterStorageConfigBlockStorage]:
        return typing.cast(typing.Optional[EksClusterStorageConfigBlockStorage], jsii.get(self, "blockStorageInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterStorageConfig]:
        return typing.cast(typing.Optional[EksClusterStorageConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[EksClusterStorageConfig]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42db7aa3877ab149f29bb5a48923876bf1407f67f067488d2743d39d4a2a89e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class EksClusterTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#create EksCluster#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#delete EksCluster#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#update EksCluster#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3bdc0fc968f8e775c86c24f9ef1af0a61e197e9e9671637edcde935ab6637852)
            check_type(argname="argument create", value=create, expected_type=type_hints["create"])
            check_type(argname="argument delete", value=delete, expected_type=type_hints["delete"])
            check_type(argname="argument update", value=update, expected_type=type_hints["update"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if create is not None:
            self._values["create"] = create
        if delete is not None:
            self._values["delete"] = delete
        if update is not None:
            self._values["update"] = update

    @builtins.property
    def create(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#create EksCluster#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#delete EksCluster#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#update EksCluster#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterTimeoutsOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12270cbeacfdbb5af93f896d9bd5a75e8c1c1d5e00b6cdc74e0c201fee1ec8c8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCreate")
    def reset_create(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCreate", []))

    @jsii.member(jsii_name="resetDelete")
    def reset_delete(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDelete", []))

    @jsii.member(jsii_name="resetUpdate")
    def reset_update(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUpdate", []))

    @builtins.property
    @jsii.member(jsii_name="createInput")
    def create_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "createInput"))

    @builtins.property
    @jsii.member(jsii_name="deleteInput")
    def delete_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deleteInput"))

    @builtins.property
    @jsii.member(jsii_name="updateInput")
    def update_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "updateInput"))

    @builtins.property
    @jsii.member(jsii_name="create")
    def create(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "create"))

    @create.setter
    def create(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a4bfff933da2720c968893f0e314024fcdfcb5a135ec03d41ff0ebb83a5ab64a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a01d81fc152ec03d642324e88c1cd120ed0b97722d05df2c9226119c4ffe4c4e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc108b6eadabc96e318926a94bb9c83a8c1c51f0c3b50218ffda7e2fe3f9c1c0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EksClusterTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EksClusterTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EksClusterTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__579a2b957c1d5b1d24b25ade6ab7309c16da5c43b83938346ae88eb1ca6d43d6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterUpgradePolicy",
    jsii_struct_bases=[],
    name_mapping={"support_type": "supportType"},
)
class EksClusterUpgradePolicy:
    def __init__(self, *, support_type: typing.Optional[builtins.str] = None) -> None:
        '''
        :param support_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#support_type EksCluster#support_type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e450568b67678d4618ff3600885c3a903345d87711a0498caf57a57cfe1f75d)
            check_type(argname="argument support_type", value=support_type, expected_type=type_hints["support_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if support_type is not None:
            self._values["support_type"] = support_type

    @builtins.property
    def support_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#support_type EksCluster#support_type}.'''
        result = self._values.get("support_type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterUpgradePolicy(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterUpgradePolicyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterUpgradePolicyOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c1f6ca832d2248d8e0bba72e9612e07c99f20ea2ac48fec90d42b8b6d37998fb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetSupportType")
    def reset_support_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSupportType", []))

    @builtins.property
    @jsii.member(jsii_name="supportTypeInput")
    def support_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "supportTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="supportType")
    def support_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "supportType"))

    @support_type.setter
    def support_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d9bbee8fd53c1698c20cff924c925c012c12990ed97fbb576e1d4c2b74eef6f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "supportType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterUpgradePolicy]:
        return typing.cast(typing.Optional[EksClusterUpgradePolicy], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[EksClusterUpgradePolicy]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__82619ac2e779184bbd539871675adf4607c1cf97d5b17dd2793630bdcf38d93c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterVpcConfig",
    jsii_struct_bases=[],
    name_mapping={
        "subnet_ids": "subnetIds",
        "endpoint_private_access": "endpointPrivateAccess",
        "endpoint_public_access": "endpointPublicAccess",
        "public_access_cidrs": "publicAccessCidrs",
        "security_group_ids": "securityGroupIds",
    },
)
class EksClusterVpcConfig:
    def __init__(
        self,
        *,
        subnet_ids: typing.Sequence[builtins.str],
        endpoint_private_access: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        endpoint_public_access: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        public_access_cidrs: typing.Optional[typing.Sequence[builtins.str]] = None,
        security_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param subnet_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#subnet_ids EksCluster#subnet_ids}.
        :param endpoint_private_access: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#endpoint_private_access EksCluster#endpoint_private_access}.
        :param endpoint_public_access: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#endpoint_public_access EksCluster#endpoint_public_access}.
        :param public_access_cidrs: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#public_access_cidrs EksCluster#public_access_cidrs}.
        :param security_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#security_group_ids EksCluster#security_group_ids}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d33de4d9818913ad42bb066d1410e1207694804f0a12bcc72ad72262b62edf4b)
            check_type(argname="argument subnet_ids", value=subnet_ids, expected_type=type_hints["subnet_ids"])
            check_type(argname="argument endpoint_private_access", value=endpoint_private_access, expected_type=type_hints["endpoint_private_access"])
            check_type(argname="argument endpoint_public_access", value=endpoint_public_access, expected_type=type_hints["endpoint_public_access"])
            check_type(argname="argument public_access_cidrs", value=public_access_cidrs, expected_type=type_hints["public_access_cidrs"])
            check_type(argname="argument security_group_ids", value=security_group_ids, expected_type=type_hints["security_group_ids"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "subnet_ids": subnet_ids,
        }
        if endpoint_private_access is not None:
            self._values["endpoint_private_access"] = endpoint_private_access
        if endpoint_public_access is not None:
            self._values["endpoint_public_access"] = endpoint_public_access
        if public_access_cidrs is not None:
            self._values["public_access_cidrs"] = public_access_cidrs
        if security_group_ids is not None:
            self._values["security_group_ids"] = security_group_ids

    @builtins.property
    def subnet_ids(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#subnet_ids EksCluster#subnet_ids}.'''
        result = self._values.get("subnet_ids")
        assert result is not None, "Required property 'subnet_ids' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def endpoint_private_access(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#endpoint_private_access EksCluster#endpoint_private_access}.'''
        result = self._values.get("endpoint_private_access")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def endpoint_public_access(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#endpoint_public_access EksCluster#endpoint_public_access}.'''
        result = self._values.get("endpoint_public_access")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def public_access_cidrs(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#public_access_cidrs EksCluster#public_access_cidrs}.'''
        result = self._values.get("public_access_cidrs")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def security_group_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#security_group_ids EksCluster#security_group_ids}.'''
        result = self._values.get("security_group_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterVpcConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterVpcConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterVpcConfigOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__39897ee1eb8c65ed50c45d2d075cbedd8b483cfed6122f120d37bb6120336bb0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetEndpointPrivateAccess")
    def reset_endpoint_private_access(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEndpointPrivateAccess", []))

    @jsii.member(jsii_name="resetEndpointPublicAccess")
    def reset_endpoint_public_access(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEndpointPublicAccess", []))

    @jsii.member(jsii_name="resetPublicAccessCidrs")
    def reset_public_access_cidrs(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPublicAccessCidrs", []))

    @jsii.member(jsii_name="resetSecurityGroupIds")
    def reset_security_group_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityGroupIds", []))

    @builtins.property
    @jsii.member(jsii_name="clusterSecurityGroupId")
    def cluster_security_group_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "clusterSecurityGroupId"))

    @builtins.property
    @jsii.member(jsii_name="vpcId")
    def vpc_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vpcId"))

    @builtins.property
    @jsii.member(jsii_name="endpointPrivateAccessInput")
    def endpoint_private_access_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "endpointPrivateAccessInput"))

    @builtins.property
    @jsii.member(jsii_name="endpointPublicAccessInput")
    def endpoint_public_access_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "endpointPublicAccessInput"))

    @builtins.property
    @jsii.member(jsii_name="publicAccessCidrsInput")
    def public_access_cidrs_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "publicAccessCidrsInput"))

    @builtins.property
    @jsii.member(jsii_name="securityGroupIdsInput")
    def security_group_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "securityGroupIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetIdsInput")
    def subnet_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "subnetIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="endpointPrivateAccess")
    def endpoint_private_access(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "endpointPrivateAccess"))

    @endpoint_private_access.setter
    def endpoint_private_access(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5776b77afb4f503dd765e8415ead29cc251ed2e0b39b8aea5de2a3cc153f8819)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "endpointPrivateAccess", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="endpointPublicAccess")
    def endpoint_public_access(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "endpointPublicAccess"))

    @endpoint_public_access.setter
    def endpoint_public_access(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4cdb47acfb2d1f3c95201ae620197b150cf63b1ca013f601bb4ab2d60da38c4b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "endpointPublicAccess", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="publicAccessCidrs")
    def public_access_cidrs(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "publicAccessCidrs"))

    @public_access_cidrs.setter
    def public_access_cidrs(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce322d132a4018749016a04de6a1a100bdcf6aec2420c5d49103c835a6c9e53a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "publicAccessCidrs", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="securityGroupIds")
    def security_group_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "securityGroupIds"))

    @security_group_ids.setter
    def security_group_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca46b9bdee80eefd20d78b710c08340fae223961bb9f202ec67e36490a33e01c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityGroupIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnetIds")
    def subnet_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "subnetIds"))

    @subnet_ids.setter
    def subnet_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a179a3bcd58820443e633ed9625de2325cee4960ac48109b30becbe237c4d4a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnetIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterVpcConfig]:
        return typing.cast(typing.Optional[EksClusterVpcConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[EksClusterVpcConfig]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8e4a930785846ac3b0036709aa64e14ebca44d337e206a093f329964512b85b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.eksCluster.EksClusterZonalShiftConfig",
    jsii_struct_bases=[],
    name_mapping={"enabled": "enabled"},
)
class EksClusterZonalShiftConfig:
    def __init__(
        self,
        *,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d789357b079e7d4bf24da02c18f9eab582768552674882fcd6074aa245e00e5c)
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if enabled is not None:
            self._values["enabled"] = enabled

    @builtins.property
    def enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled EksCluster#enabled}.'''
        result = self._values.get("enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "EksClusterZonalShiftConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class EksClusterZonalShiftConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.eksCluster.EksClusterZonalShiftConfigOutputReference",
):
    def __init__(
        self,
        terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
        terraform_attribute: builtins.str,
    ) -> None:
        '''
        :param terraform_resource: The parent resource.
        :param terraform_attribute: The attribute on the parent resource this class is referencing.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81211aed76f8dcaa5e5786f48ade2d6287a6954d215fa3fe772e9dbe729b5d55)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetEnabled")
    def reset_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnabled", []))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="enabled")
    def enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enabled"))

    @enabled.setter
    def enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2556b85f0bc9f0104ba08bbc6e605eda346e8726d52b85e3da47f1472bd6ce33)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[EksClusterZonalShiftConfig]:
        return typing.cast(typing.Optional[EksClusterZonalShiftConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[EksClusterZonalShiftConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__50010a7c34daab34d4198cd352a049f4b7d4e9d5b40d6afabb336042552caf0f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "EksCluster",
    "EksClusterAccessConfig",
    "EksClusterAccessConfigOutputReference",
    "EksClusterCertificateAuthority",
    "EksClusterCertificateAuthorityList",
    "EksClusterCertificateAuthorityOutputReference",
    "EksClusterComputeConfig",
    "EksClusterComputeConfigOutputReference",
    "EksClusterConfig",
    "EksClusterEncryptionConfig",
    "EksClusterEncryptionConfigOutputReference",
    "EksClusterEncryptionConfigProvider",
    "EksClusterEncryptionConfigProviderOutputReference",
    "EksClusterIdentity",
    "EksClusterIdentityList",
    "EksClusterIdentityOidc",
    "EksClusterIdentityOidcList",
    "EksClusterIdentityOidcOutputReference",
    "EksClusterIdentityOutputReference",
    "EksClusterKubernetesNetworkConfig",
    "EksClusterKubernetesNetworkConfigElasticLoadBalancing",
    "EksClusterKubernetesNetworkConfigElasticLoadBalancingOutputReference",
    "EksClusterKubernetesNetworkConfigOutputReference",
    "EksClusterOutpostConfig",
    "EksClusterOutpostConfigControlPlanePlacement",
    "EksClusterOutpostConfigControlPlanePlacementOutputReference",
    "EksClusterOutpostConfigOutputReference",
    "EksClusterRemoteNetworkConfig",
    "EksClusterRemoteNetworkConfigOutputReference",
    "EksClusterRemoteNetworkConfigRemoteNodeNetworks",
    "EksClusterRemoteNetworkConfigRemoteNodeNetworksOutputReference",
    "EksClusterRemoteNetworkConfigRemotePodNetworks",
    "EksClusterRemoteNetworkConfigRemotePodNetworksOutputReference",
    "EksClusterStorageConfig",
    "EksClusterStorageConfigBlockStorage",
    "EksClusterStorageConfigBlockStorageOutputReference",
    "EksClusterStorageConfigOutputReference",
    "EksClusterTimeouts",
    "EksClusterTimeoutsOutputReference",
    "EksClusterUpgradePolicy",
    "EksClusterUpgradePolicyOutputReference",
    "EksClusterVpcConfig",
    "EksClusterVpcConfigOutputReference",
    "EksClusterZonalShiftConfig",
    "EksClusterZonalShiftConfigOutputReference",
]

publication.publish()

def _typecheckingstub__35654707f07a0543a5b79ab4659de1e60a5985f2f884ce1ba52b648ceedd6957(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    name: builtins.str,
    role_arn: builtins.str,
    vpc_config: typing.Union[EksClusterVpcConfig, typing.Dict[builtins.str, typing.Any]],
    access_config: typing.Optional[typing.Union[EksClusterAccessConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    bootstrap_self_managed_addons: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    compute_config: typing.Optional[typing.Union[EksClusterComputeConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    enabled_cluster_log_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    encryption_config: typing.Optional[typing.Union[EksClusterEncryptionConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    force_update_version: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    id: typing.Optional[builtins.str] = None,
    kubernetes_network_config: typing.Optional[typing.Union[EksClusterKubernetesNetworkConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    outpost_config: typing.Optional[typing.Union[EksClusterOutpostConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    remote_network_config: typing.Optional[typing.Union[EksClusterRemoteNetworkConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    storage_config: typing.Optional[typing.Union[EksClusterStorageConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[EksClusterTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    upgrade_policy: typing.Optional[typing.Union[EksClusterUpgradePolicy, typing.Dict[builtins.str, typing.Any]]] = None,
    version: typing.Optional[builtins.str] = None,
    zonal_shift_config: typing.Optional[typing.Union[EksClusterZonalShiftConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d6857407a63e8c85430d5cebf18872ba8893b7b544357669382fa886cbeb06da(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac036d4b316490555f95ba9c7ad78fe4c5243558021128290b4e1a833d0c31a5(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7996ec34be554a8fd621ea967d9de8a1d47782d5dc7568c7c639071c1fe2753f(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d9ab4d74e27201e6a7f55077a97911d6687dfa947e0b8d0b13e51b4298e5319(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__673adbf55e5c9b3db67b479378d45fe3296cbfadcec0bf009572273dcd019aad(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__97216110136613f1b196020251377b13c9063df87a37d1acd50f5dbf5f6249ca(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f095419e93fa8230ec9398dceb983e7e74f80535146097b200fdb11d93992c6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ca752c154193166daba62422216ac8c9a1b1e735274420618ed5391d2a3da9a(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__078d5d3e8555e6a4b3d63b98c37d5a2193d103df2a249745e867a3a89602cbb8(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cada841a2276b61754735be5051990c7ad7654f96ff5df8741e7ea42dc1fd8c5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4df251c4b7a8705350d8fc010a6a2101962806edc0334f855038b7303c6c6c1(
    *,
    authentication_mode: typing.Optional[builtins.str] = None,
    bootstrap_cluster_creator_admin_permissions: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ec2f8a5c8fddd71462365407dac730bf4e288e827ea03229832b68f36930e13(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35040857729a936481ec08c66f3af0d1a0e66dc8c7f417dde73229c3d9a2b3ab(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28612cc992aebb77609ec2e7e16b1f6819114b2f8dc331934ff4b616d4fba940(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c205e6e1f5679e271a932c98b06d2addbb2342e9cbe1877c669fd4a69d9836f4(
    value: typing.Optional[EksClusterAccessConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdc3ec91b47023a8dc23620e419cb4f81fe56cbd879ffd103d2aae36344dee68(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b58080d635661e67b84e0e6783d8b470f716c8b8e2300459d0edd630ed1e4dc(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab76bd92a20e80d41f3770b8e6a62fee87f32c9383cde56caab056891cf27dfc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b6eede9abf0e99bc642279b2ae01343249738c3d6e1061b1ab8a57e53db079a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8f39c18e3fc3972f00c46c48836d313d0ff5c4081a2c09549b3effd226f6eaa(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42630eaad7ec3a6aeea4adeb85c5b25e70dfdd76c490ba933fcb2229a1d39b24(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be8b91899f48b1d8af6b90a7151fd8da5a238fa98cdc586927cdf308ec26aea0(
    value: typing.Optional[EksClusterCertificateAuthority],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43112c670690c14ae23082e3a8dda74db4096c81a3bf63d6db8efbd7a1ede2a2(
    *,
    enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    node_pools: typing.Optional[typing.Sequence[builtins.str]] = None,
    node_role_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__139912cc2f88d7b719ae11cbd3d048a4baa2a377f74e33bbd87b0cd6c1d81bbf(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ec544238b08b5a8467d38f9c79792a7f8f63275137fc6fcf20020afad3e170e(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e909c043117f3373bd1ea481c8ee0b401b9e2f2ca7b1cd57df06de3d44c4d459(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__decda32491b38f9f26665bfefa0ca30f6c2534e70f9f7f84b27d3b440cf809d9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__daeedb3e95421971b96dc033fa4fd9ef63c8eaaf9fd9cbd433ca04bf18e96648(
    value: typing.Optional[EksClusterComputeConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca4644a2d50e0ea0e460f5601679d8145e105bb0ccdbb499365b1bb6047d1f8c(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    name: builtins.str,
    role_arn: builtins.str,
    vpc_config: typing.Union[EksClusterVpcConfig, typing.Dict[builtins.str, typing.Any]],
    access_config: typing.Optional[typing.Union[EksClusterAccessConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    bootstrap_self_managed_addons: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    compute_config: typing.Optional[typing.Union[EksClusterComputeConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    enabled_cluster_log_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    encryption_config: typing.Optional[typing.Union[EksClusterEncryptionConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    force_update_version: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    id: typing.Optional[builtins.str] = None,
    kubernetes_network_config: typing.Optional[typing.Union[EksClusterKubernetesNetworkConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    outpost_config: typing.Optional[typing.Union[EksClusterOutpostConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    remote_network_config: typing.Optional[typing.Union[EksClusterRemoteNetworkConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    storage_config: typing.Optional[typing.Union[EksClusterStorageConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[EksClusterTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    upgrade_policy: typing.Optional[typing.Union[EksClusterUpgradePolicy, typing.Dict[builtins.str, typing.Any]]] = None,
    version: typing.Optional[builtins.str] = None,
    zonal_shift_config: typing.Optional[typing.Union[EksClusterZonalShiftConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0cb2bfc239355aa5cca8aa1ace5c27f64178028f166615773f4e2ba6baca4dc(
    *,
    provider: typing.Union[EksClusterEncryptionConfigProvider, typing.Dict[builtins.str, typing.Any]],
    resources: typing.Sequence[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21d33b1743a57cb279e9fc16495c2f6c0757c56e88fd8ed58648c1f5c2c331c5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b0e5981ac2d49a8ffaec9e09241dec9abe65b51670ebc5b987f71d601ab1b1d(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1bbe6aa08670ff1d269e0a8017afe2a0661ca2dad29aa849817cc3e81d82641(
    value: typing.Optional[EksClusterEncryptionConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__816be381d0bc77ad679cf22370756b79db4eb3b09685cd64f7df4da1744b7468(
    *,
    key_arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21970090551c98658920d638920560ab39e72a757c603c6f250be5a6de6808e3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba7157ea064093bdd5323d3c3cbffb66a36c086d3fc997cf5d61f855c8b314f7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72e664f690913b1bd114ff74647edbe007930ec6dbc0dbdfb482af2ffe094d96(
    value: typing.Optional[EksClusterEncryptionConfigProvider],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1c6697f02eaea963f549d60c31bbe4b10a64d95c8d2ac5cce40321e353e5958(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01f7a5f635365922f99d3ac8fc9cdaa5bd6eb5cff276a3c5ee3bcb25281f30b3(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac6a53e1f56f9f417a12fb544f0c416df04c45a4a595bbba390673be905ef503(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d92ca0130718efbf86a172b178c9a8f09d02731ea1682240add0b8b5cf515d65(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d22572d8f2a3ac2b308e7185df511eea7e9193c08c412e966627159d4a25ae8(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9100fa79771986ba0c4aec6f52cd6d19f7bbadfbd9dd9438b40db2a84f35613b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__69fe2bd3f77b17ef4a10aff001257f383c470e49a4cd6e9e62510e5ac7ceece4(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b616b8dce2c2a23faead874f751bcef0aeac954bc4b30c6c8c85bd9d82dc6f1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a0d46962011eab42b562994e931c7bcc7704d942c8306bdc1d478fca266fec5(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e904e1ae8eebf2f51979d0d9fe1e09d978f06a4694f459204547cde46a996b5(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5735638c56c324028893e9933f97c6df55ba799ec1799f60b5b2a114dcaf0bc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aab2a13a625ba7d9ff6d91236852f4b574aa02248b0f500250feb782f584ae42(
    value: typing.Optional[EksClusterIdentityOidc],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e519ff671b67a2b685c6d694671ba233fa2d7a633badf291bafd9fe97d2a7b99(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c5c4ab2c2ed8ddeb0fce390dd490f2099d470eae805ba9f9579bcd0be72dc1f(
    value: typing.Optional[EksClusterIdentity],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08570fce41d740d4dcb20dff3adc5500dbcb5502d34215a1680ccb5b14c7f301(
    *,
    elastic_load_balancing: typing.Optional[typing.Union[EksClusterKubernetesNetworkConfigElasticLoadBalancing, typing.Dict[builtins.str, typing.Any]]] = None,
    ip_family: typing.Optional[builtins.str] = None,
    service_ipv4_cidr: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f01bc54fa339a5717b764daee2a6c7360b6fa4cd439360faf99d4137802aec12(
    *,
    enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__34a55c369056397ad9632b027f58b32bce1ea41fd5c68435980f465e24200911(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__277863a2c5f53219331a4d2379f03c47759c4930533f97cddb196e2dc2f985d0(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4655f371bb7664de70434dd9661c68c0c013302ab4bb4d9ec149fc283eb59ac4(
    value: typing.Optional[EksClusterKubernetesNetworkConfigElasticLoadBalancing],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9314d832e4a7054dab19db37f810e7b4d07644832eb4f4bea3bce3461c63e776(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efafdedf9835c79774c04181a2050cbd714b14c99228823304c733758f1757aa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb61ec7458d89fd890823514de03139df9812d29c17f6976d2a62a165221c216(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0d05e39276095ef1bd488f6074c6c11cc44c9848b9f0388e5d85446e8668061(
    value: typing.Optional[EksClusterKubernetesNetworkConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33daa8e23608ce47e9062fcf22a158052f22c20215161fe14e99c46fab25126a(
    *,
    control_plane_instance_type: builtins.str,
    outpost_arns: typing.Sequence[builtins.str],
    control_plane_placement: typing.Optional[typing.Union[EksClusterOutpostConfigControlPlanePlacement, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb8561ff5b1b262198da0d661e7ee2ad3fc6d7493dfeba77421ccd9fdb29a469(
    *,
    group_name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7a8ed470093746f153d79dc27cc072907c480eb66dd5adb804967bca952c8ce7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc7d877254bcb3a01012f988e37683cbfff0b2cd4bf0b9843c4661bd51a81f09(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__515a14f5c381707576bd41141679333bad5b6f985cece3b9880763aa2f9f207b(
    value: typing.Optional[EksClusterOutpostConfigControlPlanePlacement],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__460b311af3092ec29ddc60a7db51667687f4e61d72d5f36924eec14b2eb653a1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a36ef9848c8542f91483a26ee1adf2e893289cf1fcf2b43a46bf643a30d0883(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__382e98fa5bf81c6b7c9be486c648dfed3254b46394e03e252bc8741aade3af16(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a575abc700f952a3158676f5815df81de2a4c3c760cfa22df38c3e2427ae964(
    value: typing.Optional[EksClusterOutpostConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e04c9cdd09c04cc75c22cba42d14715dec3558f37289fcc258934ff583cc01f(
    *,
    remote_node_networks: typing.Union[EksClusterRemoteNetworkConfigRemoteNodeNetworks, typing.Dict[builtins.str, typing.Any]],
    remote_pod_networks: typing.Optional[typing.Union[EksClusterRemoteNetworkConfigRemotePodNetworks, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be1f5e21dd3b8095dd4ba53ffac80fe5f7778a761f22be6fc043e0af79190ece(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__92264a7f81ff12a2e0344a9f3cc17738eea8af776122b1cf5cba2561fada8521(
    value: typing.Optional[EksClusterRemoteNetworkConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2b5d9a3e2e45b5bace61a7728a4b198174ac31382b0b0665208d936749e2e49(
    *,
    cidrs: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__034077b390bd108f4a3da56333ae0c91fca1dd9ac28c73f4e314c672e76e8539(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__69a9bab0efc5590eebf0c177c474fa7f63b298a503bd39b14a8c08c3c58d9bac(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f2b446ed97f275fd609a9d0623fbed4d2fec4c05a69f1fdcd0353b0b5aedc2d3(
    value: typing.Optional[EksClusterRemoteNetworkConfigRemoteNodeNetworks],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79bc7837b3fb95d13c94fe14cfd928e88efb141b5d0312d70357cf6b4bccecac(
    *,
    cidrs: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cffdac063ffc273e5a358aa915f705e7c03c26fe9d89e0bd5e01487536d89870(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5222c6443dcd198665f8f1ffff363b820474e30a76d2f83fb179b4075aac32b3(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c28f8005626f75d2bf43acd6d4c9f9b8cbc0756351c193f6949927015790f152(
    value: typing.Optional[EksClusterRemoteNetworkConfigRemotePodNetworks],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1f1bdbe9ed58c183b07d95ecc4641b76cb7a67f89d7592f00dfa29d01c0e828(
    *,
    block_storage: typing.Optional[typing.Union[EksClusterStorageConfigBlockStorage, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b856e92ee0127e19f0d6d971778b43bc3eae346515c68adb6b0b79f689531bae(
    *,
    enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8434e228c3350fc96d88843357052581ad26f2140f7ad7d1b0b5249a4a15d78(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85db22228f56a77219c2a6803fb5de5c800017249dbd339ba4daef4b831e0006(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea6faad9fd6cd818d05cccc3d2c6dffd9cbd067b1dc64e33755b239d9e7b43f0(
    value: typing.Optional[EksClusterStorageConfigBlockStorage],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e93898ca02bbef31e362166ee785bed007d3d4bfe67cce7473721ff88954a8c8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42db7aa3877ab149f29bb5a48923876bf1407f67f067488d2743d39d4a2a89e6(
    value: typing.Optional[EksClusterStorageConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3bdc0fc968f8e775c86c24f9ef1af0a61e197e9e9671637edcde935ab6637852(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12270cbeacfdbb5af93f896d9bd5a75e8c1c1d5e00b6cdc74e0c201fee1ec8c8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a4bfff933da2720c968893f0e314024fcdfcb5a135ec03d41ff0ebb83a5ab64a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a01d81fc152ec03d642324e88c1cd120ed0b97722d05df2c9226119c4ffe4c4e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc108b6eadabc96e318926a94bb9c83a8c1c51f0c3b50218ffda7e2fe3f9c1c0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__579a2b957c1d5b1d24b25ade6ab7309c16da5c43b83938346ae88eb1ca6d43d6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, EksClusterTimeouts]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e450568b67678d4618ff3600885c3a903345d87711a0498caf57a57cfe1f75d(
    *,
    support_type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1f6ca832d2248d8e0bba72e9612e07c99f20ea2ac48fec90d42b8b6d37998fb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d9bbee8fd53c1698c20cff924c925c012c12990ed97fbb576e1d4c2b74eef6f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82619ac2e779184bbd539871675adf4607c1cf97d5b17dd2793630bdcf38d93c(
    value: typing.Optional[EksClusterUpgradePolicy],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d33de4d9818913ad42bb066d1410e1207694804f0a12bcc72ad72262b62edf4b(
    *,
    subnet_ids: typing.Sequence[builtins.str],
    endpoint_private_access: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    endpoint_public_access: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    public_access_cidrs: typing.Optional[typing.Sequence[builtins.str]] = None,
    security_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__39897ee1eb8c65ed50c45d2d075cbedd8b483cfed6122f120d37bb6120336bb0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5776b77afb4f503dd765e8415ead29cc251ed2e0b39b8aea5de2a3cc153f8819(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4cdb47acfb2d1f3c95201ae620197b150cf63b1ca013f601bb4ab2d60da38c4b(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce322d132a4018749016a04de6a1a100bdcf6aec2420c5d49103c835a6c9e53a(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca46b9bdee80eefd20d78b710c08340fae223961bb9f202ec67e36490a33e01c(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a179a3bcd58820443e633ed9625de2325cee4960ac48109b30becbe237c4d4a(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8e4a930785846ac3b0036709aa64e14ebca44d337e206a093f329964512b85b(
    value: typing.Optional[EksClusterVpcConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d789357b079e7d4bf24da02c18f9eab582768552674882fcd6074aa245e00e5c(
    *,
    enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81211aed76f8dcaa5e5786f48ade2d6287a6954d215fa3fe772e9dbe729b5d55(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2556b85f0bc9f0104ba08bbc6e605eda346e8726d52b85e3da47f1472bd6ce33(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__50010a7c34daab34d4198cd352a049f4b7d4e9d5b40d6afabb336042552caf0f(
    value: typing.Optional[EksClusterZonalShiftConfig],
) -> None:
    """Type checking stubs"""
    pass
