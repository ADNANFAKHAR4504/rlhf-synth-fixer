r'''
# `aws_finspace_kx_cluster`

Refer to the Terraform Registry for docs: [`aws_finspace_kx_cluster`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster).
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


class FinspaceKxCluster(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxCluster",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster aws_finspace_kx_cluster}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        az_mode: builtins.str,
        environment_id: builtins.str,
        name: builtins.str,
        release_label: builtins.str,
        type: builtins.str,
        vpc_configuration: typing.Union["FinspaceKxClusterVpcConfiguration", typing.Dict[builtins.str, typing.Any]],
        auto_scaling_configuration: typing.Optional[typing.Union["FinspaceKxClusterAutoScalingConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        availability_zone_id: typing.Optional[builtins.str] = None,
        cache_storage_configurations: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FinspaceKxClusterCacheStorageConfigurations", typing.Dict[builtins.str, typing.Any]]]]] = None,
        capacity_configuration: typing.Optional[typing.Union["FinspaceKxClusterCapacityConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        code: typing.Optional[typing.Union["FinspaceKxClusterCode", typing.Dict[builtins.str, typing.Any]]] = None,
        command_line_arguments: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        database: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FinspaceKxClusterDatabase", typing.Dict[builtins.str, typing.Any]]]]] = None,
        description: typing.Optional[builtins.str] = None,
        execution_role: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        initialization_script: typing.Optional[builtins.str] = None,
        savedown_storage_configuration: typing.Optional[typing.Union["FinspaceKxClusterSavedownStorageConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        scaling_group_configuration: typing.Optional[typing.Union["FinspaceKxClusterScalingGroupConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tickerplant_log_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FinspaceKxClusterTickerplantLogConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        timeouts: typing.Optional[typing.Union["FinspaceKxClusterTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster aws_finspace_kx_cluster} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param az_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#az_mode FinspaceKxCluster#az_mode}.
        :param environment_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#environment_id FinspaceKxCluster#environment_id}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#name FinspaceKxCluster#name}.
        :param release_label: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#release_label FinspaceKxCluster#release_label}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.
        :param vpc_configuration: vpc_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#vpc_configuration FinspaceKxCluster#vpc_configuration}
        :param auto_scaling_configuration: auto_scaling_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#auto_scaling_configuration FinspaceKxCluster#auto_scaling_configuration}
        :param availability_zone_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#availability_zone_id FinspaceKxCluster#availability_zone_id}.
        :param cache_storage_configurations: cache_storage_configurations block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_storage_configurations FinspaceKxCluster#cache_storage_configurations}
        :param capacity_configuration: capacity_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#capacity_configuration FinspaceKxCluster#capacity_configuration}
        :param code: code block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#code FinspaceKxCluster#code}
        :param command_line_arguments: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#command_line_arguments FinspaceKxCluster#command_line_arguments}.
        :param database: database block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#database FinspaceKxCluster#database}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#description FinspaceKxCluster#description}.
        :param execution_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#execution_role FinspaceKxCluster#execution_role}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#id FinspaceKxCluster#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param initialization_script: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#initialization_script FinspaceKxCluster#initialization_script}.
        :param savedown_storage_configuration: savedown_storage_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#savedown_storage_configuration FinspaceKxCluster#savedown_storage_configuration}
        :param scaling_group_configuration: scaling_group_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scaling_group_configuration FinspaceKxCluster#scaling_group_configuration}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags FinspaceKxCluster#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags_all FinspaceKxCluster#tags_all}.
        :param tickerplant_log_configuration: tickerplant_log_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tickerplant_log_configuration FinspaceKxCluster#tickerplant_log_configuration}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#timeouts FinspaceKxCluster#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd8050ee00862f847ddab1450175ab76e710011700cb3aca9d017b35737b67da)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = FinspaceKxClusterConfig(
            az_mode=az_mode,
            environment_id=environment_id,
            name=name,
            release_label=release_label,
            type=type,
            vpc_configuration=vpc_configuration,
            auto_scaling_configuration=auto_scaling_configuration,
            availability_zone_id=availability_zone_id,
            cache_storage_configurations=cache_storage_configurations,
            capacity_configuration=capacity_configuration,
            code=code,
            command_line_arguments=command_line_arguments,
            database=database,
            description=description,
            execution_role=execution_role,
            id=id,
            initialization_script=initialization_script,
            savedown_storage_configuration=savedown_storage_configuration,
            scaling_group_configuration=scaling_group_configuration,
            tags=tags,
            tags_all=tags_all,
            tickerplant_log_configuration=tickerplant_log_configuration,
            timeouts=timeouts,
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
        '''Generates CDKTF code for importing a FinspaceKxCluster resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the FinspaceKxCluster to import.
        :param import_from_id: The id of the existing FinspaceKxCluster that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the FinspaceKxCluster to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fa84e507a50a67b172c015f2f191f8d2c5b9c8f385cea173e7c9362190e0f70c)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putAutoScalingConfiguration")
    def put_auto_scaling_configuration(
        self,
        *,
        auto_scaling_metric: builtins.str,
        max_node_count: jsii.Number,
        metric_target: jsii.Number,
        min_node_count: jsii.Number,
        scale_in_cooldown_seconds: jsii.Number,
        scale_out_cooldown_seconds: jsii.Number,
    ) -> None:
        '''
        :param auto_scaling_metric: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#auto_scaling_metric FinspaceKxCluster#auto_scaling_metric}.
        :param max_node_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#max_node_count FinspaceKxCluster#max_node_count}.
        :param metric_target: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#metric_target FinspaceKxCluster#metric_target}.
        :param min_node_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#min_node_count FinspaceKxCluster#min_node_count}.
        :param scale_in_cooldown_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scale_in_cooldown_seconds FinspaceKxCluster#scale_in_cooldown_seconds}.
        :param scale_out_cooldown_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scale_out_cooldown_seconds FinspaceKxCluster#scale_out_cooldown_seconds}.
        '''
        value = FinspaceKxClusterAutoScalingConfiguration(
            auto_scaling_metric=auto_scaling_metric,
            max_node_count=max_node_count,
            metric_target=metric_target,
            min_node_count=min_node_count,
            scale_in_cooldown_seconds=scale_in_cooldown_seconds,
            scale_out_cooldown_seconds=scale_out_cooldown_seconds,
        )

        return typing.cast(None, jsii.invoke(self, "putAutoScalingConfiguration", [value]))

    @jsii.member(jsii_name="putCacheStorageConfigurations")
    def put_cache_storage_configurations(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FinspaceKxClusterCacheStorageConfigurations", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a925d1fa3c38abaef8fae79949824c50f6d1343da82b6b43e62ccb799f7c6c2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCacheStorageConfigurations", [value]))

    @jsii.member(jsii_name="putCapacityConfiguration")
    def put_capacity_configuration(
        self,
        *,
        node_count: jsii.Number,
        node_type: builtins.str,
    ) -> None:
        '''
        :param node_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_count FinspaceKxCluster#node_count}.
        :param node_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_type FinspaceKxCluster#node_type}.
        '''
        value = FinspaceKxClusterCapacityConfiguration(
            node_count=node_count, node_type=node_type
        )

        return typing.cast(None, jsii.invoke(self, "putCapacityConfiguration", [value]))

    @jsii.member(jsii_name="putCode")
    def put_code(
        self,
        *,
        s3_bucket: builtins.str,
        s3_key: builtins.str,
        s3_object_version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_bucket: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_bucket FinspaceKxCluster#s3_bucket}.
        :param s3_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_key FinspaceKxCluster#s3_key}.
        :param s3_object_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_object_version FinspaceKxCluster#s3_object_version}.
        '''
        value = FinspaceKxClusterCode(
            s3_bucket=s3_bucket, s3_key=s3_key, s3_object_version=s3_object_version
        )

        return typing.cast(None, jsii.invoke(self, "putCode", [value]))

    @jsii.member(jsii_name="putDatabase")
    def put_database(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FinspaceKxClusterDatabase", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a99aabdaa71e4adac1137cd1ddb70eca32c13d3085abb6095fa3b9d60ad1f341)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDatabase", [value]))

    @jsii.member(jsii_name="putSavedownStorageConfiguration")
    def put_savedown_storage_configuration(
        self,
        *,
        size: typing.Optional[jsii.Number] = None,
        type: typing.Optional[builtins.str] = None,
        volume_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#size FinspaceKxCluster#size}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.
        :param volume_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#volume_name FinspaceKxCluster#volume_name}.
        '''
        value = FinspaceKxClusterSavedownStorageConfiguration(
            size=size, type=type, volume_name=volume_name
        )

        return typing.cast(None, jsii.invoke(self, "putSavedownStorageConfiguration", [value]))

    @jsii.member(jsii_name="putScalingGroupConfiguration")
    def put_scaling_group_configuration(
        self,
        *,
        memory_reservation: jsii.Number,
        node_count: jsii.Number,
        scaling_group_name: builtins.str,
        cpu: typing.Optional[jsii.Number] = None,
        memory_limit: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param memory_reservation: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#memory_reservation FinspaceKxCluster#memory_reservation}.
        :param node_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_count FinspaceKxCluster#node_count}.
        :param scaling_group_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scaling_group_name FinspaceKxCluster#scaling_group_name}.
        :param cpu: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cpu FinspaceKxCluster#cpu}.
        :param memory_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#memory_limit FinspaceKxCluster#memory_limit}.
        '''
        value = FinspaceKxClusterScalingGroupConfiguration(
            memory_reservation=memory_reservation,
            node_count=node_count,
            scaling_group_name=scaling_group_name,
            cpu=cpu,
            memory_limit=memory_limit,
        )

        return typing.cast(None, jsii.invoke(self, "putScalingGroupConfiguration", [value]))

    @jsii.member(jsii_name="putTickerplantLogConfiguration")
    def put_tickerplant_log_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FinspaceKxClusterTickerplantLogConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04ebe60a759b7184e3f9ba46ecfafd58d22f855ed454b7f4090e1e035fc70094)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTickerplantLogConfiguration", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#create FinspaceKxCluster#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#delete FinspaceKxCluster#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#update FinspaceKxCluster#update}.
        '''
        value = FinspaceKxClusterTimeouts(create=create, delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="putVpcConfiguration")
    def put_vpc_configuration(
        self,
        *,
        ip_address_type: builtins.str,
        security_group_ids: typing.Sequence[builtins.str],
        subnet_ids: typing.Sequence[builtins.str],
        vpc_id: builtins.str,
    ) -> None:
        '''
        :param ip_address_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#ip_address_type FinspaceKxCluster#ip_address_type}.
        :param security_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#security_group_ids FinspaceKxCluster#security_group_ids}.
        :param subnet_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#subnet_ids FinspaceKxCluster#subnet_ids}.
        :param vpc_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#vpc_id FinspaceKxCluster#vpc_id}.
        '''
        value = FinspaceKxClusterVpcConfiguration(
            ip_address_type=ip_address_type,
            security_group_ids=security_group_ids,
            subnet_ids=subnet_ids,
            vpc_id=vpc_id,
        )

        return typing.cast(None, jsii.invoke(self, "putVpcConfiguration", [value]))

    @jsii.member(jsii_name="resetAutoScalingConfiguration")
    def reset_auto_scaling_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAutoScalingConfiguration", []))

    @jsii.member(jsii_name="resetAvailabilityZoneId")
    def reset_availability_zone_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAvailabilityZoneId", []))

    @jsii.member(jsii_name="resetCacheStorageConfigurations")
    def reset_cache_storage_configurations(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCacheStorageConfigurations", []))

    @jsii.member(jsii_name="resetCapacityConfiguration")
    def reset_capacity_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCapacityConfiguration", []))

    @jsii.member(jsii_name="resetCode")
    def reset_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCode", []))

    @jsii.member(jsii_name="resetCommandLineArguments")
    def reset_command_line_arguments(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCommandLineArguments", []))

    @jsii.member(jsii_name="resetDatabase")
    def reset_database(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDatabase", []))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetExecutionRole")
    def reset_execution_role(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExecutionRole", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetInitializationScript")
    def reset_initialization_script(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInitializationScript", []))

    @jsii.member(jsii_name="resetSavedownStorageConfiguration")
    def reset_savedown_storage_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSavedownStorageConfiguration", []))

    @jsii.member(jsii_name="resetScalingGroupConfiguration")
    def reset_scaling_group_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetScalingGroupConfiguration", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTickerplantLogConfiguration")
    def reset_tickerplant_log_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTickerplantLogConfiguration", []))

    @jsii.member(jsii_name="resetTimeouts")
    def reset_timeouts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeouts", []))

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
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @builtins.property
    @jsii.member(jsii_name="autoScalingConfiguration")
    def auto_scaling_configuration(
        self,
    ) -> "FinspaceKxClusterAutoScalingConfigurationOutputReference":
        return typing.cast("FinspaceKxClusterAutoScalingConfigurationOutputReference", jsii.get(self, "autoScalingConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="cacheStorageConfigurations")
    def cache_storage_configurations(
        self,
    ) -> "FinspaceKxClusterCacheStorageConfigurationsList":
        return typing.cast("FinspaceKxClusterCacheStorageConfigurationsList", jsii.get(self, "cacheStorageConfigurations"))

    @builtins.property
    @jsii.member(jsii_name="capacityConfiguration")
    def capacity_configuration(
        self,
    ) -> "FinspaceKxClusterCapacityConfigurationOutputReference":
        return typing.cast("FinspaceKxClusterCapacityConfigurationOutputReference", jsii.get(self, "capacityConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="code")
    def code(self) -> "FinspaceKxClusterCodeOutputReference":
        return typing.cast("FinspaceKxClusterCodeOutputReference", jsii.get(self, "code"))

    @builtins.property
    @jsii.member(jsii_name="createdTimestamp")
    def created_timestamp(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "createdTimestamp"))

    @builtins.property
    @jsii.member(jsii_name="database")
    def database(self) -> "FinspaceKxClusterDatabaseList":
        return typing.cast("FinspaceKxClusterDatabaseList", jsii.get(self, "database"))

    @builtins.property
    @jsii.member(jsii_name="lastModifiedTimestamp")
    def last_modified_timestamp(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lastModifiedTimestamp"))

    @builtins.property
    @jsii.member(jsii_name="savedownStorageConfiguration")
    def savedown_storage_configuration(
        self,
    ) -> "FinspaceKxClusterSavedownStorageConfigurationOutputReference":
        return typing.cast("FinspaceKxClusterSavedownStorageConfigurationOutputReference", jsii.get(self, "savedownStorageConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="scalingGroupConfiguration")
    def scaling_group_configuration(
        self,
    ) -> "FinspaceKxClusterScalingGroupConfigurationOutputReference":
        return typing.cast("FinspaceKxClusterScalingGroupConfigurationOutputReference", jsii.get(self, "scalingGroupConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @builtins.property
    @jsii.member(jsii_name="statusReason")
    def status_reason(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "statusReason"))

    @builtins.property
    @jsii.member(jsii_name="tickerplantLogConfiguration")
    def tickerplant_log_configuration(
        self,
    ) -> "FinspaceKxClusterTickerplantLogConfigurationList":
        return typing.cast("FinspaceKxClusterTickerplantLogConfigurationList", jsii.get(self, "tickerplantLogConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "FinspaceKxClusterTimeoutsOutputReference":
        return typing.cast("FinspaceKxClusterTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="vpcConfiguration")
    def vpc_configuration(self) -> "FinspaceKxClusterVpcConfigurationOutputReference":
        return typing.cast("FinspaceKxClusterVpcConfigurationOutputReference", jsii.get(self, "vpcConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="autoScalingConfigurationInput")
    def auto_scaling_configuration_input(
        self,
    ) -> typing.Optional["FinspaceKxClusterAutoScalingConfiguration"]:
        return typing.cast(typing.Optional["FinspaceKxClusterAutoScalingConfiguration"], jsii.get(self, "autoScalingConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityZoneIdInput")
    def availability_zone_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "availabilityZoneIdInput"))

    @builtins.property
    @jsii.member(jsii_name="azModeInput")
    def az_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "azModeInput"))

    @builtins.property
    @jsii.member(jsii_name="cacheStorageConfigurationsInput")
    def cache_storage_configurations_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FinspaceKxClusterCacheStorageConfigurations"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FinspaceKxClusterCacheStorageConfigurations"]]], jsii.get(self, "cacheStorageConfigurationsInput"))

    @builtins.property
    @jsii.member(jsii_name="capacityConfigurationInput")
    def capacity_configuration_input(
        self,
    ) -> typing.Optional["FinspaceKxClusterCapacityConfiguration"]:
        return typing.cast(typing.Optional["FinspaceKxClusterCapacityConfiguration"], jsii.get(self, "capacityConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="codeInput")
    def code_input(self) -> typing.Optional["FinspaceKxClusterCode"]:
        return typing.cast(typing.Optional["FinspaceKxClusterCode"], jsii.get(self, "codeInput"))

    @builtins.property
    @jsii.member(jsii_name="commandLineArgumentsInput")
    def command_line_arguments_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "commandLineArgumentsInput"))

    @builtins.property
    @jsii.member(jsii_name="databaseInput")
    def database_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FinspaceKxClusterDatabase"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FinspaceKxClusterDatabase"]]], jsii.get(self, "databaseInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="environmentIdInput")
    def environment_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "environmentIdInput"))

    @builtins.property
    @jsii.member(jsii_name="executionRoleInput")
    def execution_role_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "executionRoleInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="initializationScriptInput")
    def initialization_script_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "initializationScriptInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="releaseLabelInput")
    def release_label_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "releaseLabelInput"))

    @builtins.property
    @jsii.member(jsii_name="savedownStorageConfigurationInput")
    def savedown_storage_configuration_input(
        self,
    ) -> typing.Optional["FinspaceKxClusterSavedownStorageConfiguration"]:
        return typing.cast(typing.Optional["FinspaceKxClusterSavedownStorageConfiguration"], jsii.get(self, "savedownStorageConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="scalingGroupConfigurationInput")
    def scaling_group_configuration_input(
        self,
    ) -> typing.Optional["FinspaceKxClusterScalingGroupConfiguration"]:
        return typing.cast(typing.Optional["FinspaceKxClusterScalingGroupConfiguration"], jsii.get(self, "scalingGroupConfigurationInput"))

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
    @jsii.member(jsii_name="tickerplantLogConfigurationInput")
    def tickerplant_log_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FinspaceKxClusterTickerplantLogConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FinspaceKxClusterTickerplantLogConfiguration"]]], jsii.get(self, "tickerplantLogConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "FinspaceKxClusterTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "FinspaceKxClusterTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="vpcConfigurationInput")
    def vpc_configuration_input(
        self,
    ) -> typing.Optional["FinspaceKxClusterVpcConfiguration"]:
        return typing.cast(typing.Optional["FinspaceKxClusterVpcConfiguration"], jsii.get(self, "vpcConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="availabilityZoneId")
    def availability_zone_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "availabilityZoneId"))

    @availability_zone_id.setter
    def availability_zone_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f2a4ec769547766ab4fb35d5aedb5d5be6a33d8463d4baf0e65ddcf99bdbd9b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "availabilityZoneId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="azMode")
    def az_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "azMode"))

    @az_mode.setter
    def az_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__814ba0b679b3dcca08ff2130708fc22c9f4636cc269a302c68c4c92558a3d9ee)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "azMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="commandLineArguments")
    def command_line_arguments(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "commandLineArguments"))

    @command_line_arguments.setter
    def command_line_arguments(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e35b5d9b729543a362153857d27d38d903102005bdd923c012790f2fdee98c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "commandLineArguments", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41281a798524d72de0e88005e3ae58771639e0633f1fce27d5ffc81340484f8f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="environmentId")
    def environment_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "environmentId"))

    @environment_id.setter
    def environment_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bfe9819e6aff39f0bdd2957d6a40b5b324077bc2520ae1927d0b485bdbeb8037)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "environmentId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="executionRole")
    def execution_role(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "executionRole"))

    @execution_role.setter
    def execution_role(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__386ed63e5fb48557f26de8efe91fe5af16f4323e7b72fb7e7831c4f4265f1620)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "executionRole", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a1201393fcf397c585619e9b0af37b38c1a1e7d6f1e05e4b97a5e8204ef48f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="initializationScript")
    def initialization_script(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "initializationScript"))

    @initialization_script.setter
    def initialization_script(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__907741f36203edea17a60a8e9495682e733590dccb1edbffb18ec9f7596c3cb9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "initializationScript", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa41e4de86490c8bbbfc49ae4865a15ccc7060c58f957d3534684f9846714624)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="releaseLabel")
    def release_label(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "releaseLabel"))

    @release_label.setter
    def release_label(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c304defb5a17628b989968e1a0bebfd3651afde9b39fe10b41cafb1028185ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "releaseLabel", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__967ea3b2f6bf419b08f6268a013c49388ea64f0672d59d369ebef431340c8db3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18f379c375edb9278e1d0ac3d85650bc5a38116e40aeb979943bcddc040227c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ed9dca0caa945f3b8be28aa759e00758b6c8da39d2a18fdfe266fcfa5d89308)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterAutoScalingConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "auto_scaling_metric": "autoScalingMetric",
        "max_node_count": "maxNodeCount",
        "metric_target": "metricTarget",
        "min_node_count": "minNodeCount",
        "scale_in_cooldown_seconds": "scaleInCooldownSeconds",
        "scale_out_cooldown_seconds": "scaleOutCooldownSeconds",
    },
)
class FinspaceKxClusterAutoScalingConfiguration:
    def __init__(
        self,
        *,
        auto_scaling_metric: builtins.str,
        max_node_count: jsii.Number,
        metric_target: jsii.Number,
        min_node_count: jsii.Number,
        scale_in_cooldown_seconds: jsii.Number,
        scale_out_cooldown_seconds: jsii.Number,
    ) -> None:
        '''
        :param auto_scaling_metric: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#auto_scaling_metric FinspaceKxCluster#auto_scaling_metric}.
        :param max_node_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#max_node_count FinspaceKxCluster#max_node_count}.
        :param metric_target: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#metric_target FinspaceKxCluster#metric_target}.
        :param min_node_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#min_node_count FinspaceKxCluster#min_node_count}.
        :param scale_in_cooldown_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scale_in_cooldown_seconds FinspaceKxCluster#scale_in_cooldown_seconds}.
        :param scale_out_cooldown_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scale_out_cooldown_seconds FinspaceKxCluster#scale_out_cooldown_seconds}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__71346699ccc247eb1a024ca3084d02ff17d1022b32e43d82b34dc14ea6d50de0)
            check_type(argname="argument auto_scaling_metric", value=auto_scaling_metric, expected_type=type_hints["auto_scaling_metric"])
            check_type(argname="argument max_node_count", value=max_node_count, expected_type=type_hints["max_node_count"])
            check_type(argname="argument metric_target", value=metric_target, expected_type=type_hints["metric_target"])
            check_type(argname="argument min_node_count", value=min_node_count, expected_type=type_hints["min_node_count"])
            check_type(argname="argument scale_in_cooldown_seconds", value=scale_in_cooldown_seconds, expected_type=type_hints["scale_in_cooldown_seconds"])
            check_type(argname="argument scale_out_cooldown_seconds", value=scale_out_cooldown_seconds, expected_type=type_hints["scale_out_cooldown_seconds"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "auto_scaling_metric": auto_scaling_metric,
            "max_node_count": max_node_count,
            "metric_target": metric_target,
            "min_node_count": min_node_count,
            "scale_in_cooldown_seconds": scale_in_cooldown_seconds,
            "scale_out_cooldown_seconds": scale_out_cooldown_seconds,
        }

    @builtins.property
    def auto_scaling_metric(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#auto_scaling_metric FinspaceKxCluster#auto_scaling_metric}.'''
        result = self._values.get("auto_scaling_metric")
        assert result is not None, "Required property 'auto_scaling_metric' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def max_node_count(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#max_node_count FinspaceKxCluster#max_node_count}.'''
        result = self._values.get("max_node_count")
        assert result is not None, "Required property 'max_node_count' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def metric_target(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#metric_target FinspaceKxCluster#metric_target}.'''
        result = self._values.get("metric_target")
        assert result is not None, "Required property 'metric_target' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def min_node_count(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#min_node_count FinspaceKxCluster#min_node_count}.'''
        result = self._values.get("min_node_count")
        assert result is not None, "Required property 'min_node_count' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def scale_in_cooldown_seconds(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scale_in_cooldown_seconds FinspaceKxCluster#scale_in_cooldown_seconds}.'''
        result = self._values.get("scale_in_cooldown_seconds")
        assert result is not None, "Required property 'scale_in_cooldown_seconds' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def scale_out_cooldown_seconds(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scale_out_cooldown_seconds FinspaceKxCluster#scale_out_cooldown_seconds}.'''
        result = self._values.get("scale_out_cooldown_seconds")
        assert result is not None, "Required property 'scale_out_cooldown_seconds' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FinspaceKxClusterAutoScalingConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FinspaceKxClusterAutoScalingConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterAutoScalingConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__998fdaf8e1fc098a10a74ae55506936395f295996e2ac10d954adc87018590ac)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="autoScalingMetricInput")
    def auto_scaling_metric_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "autoScalingMetricInput"))

    @builtins.property
    @jsii.member(jsii_name="maxNodeCountInput")
    def max_node_count_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxNodeCountInput"))

    @builtins.property
    @jsii.member(jsii_name="metricTargetInput")
    def metric_target_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "metricTargetInput"))

    @builtins.property
    @jsii.member(jsii_name="minNodeCountInput")
    def min_node_count_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minNodeCountInput"))

    @builtins.property
    @jsii.member(jsii_name="scaleInCooldownSecondsInput")
    def scale_in_cooldown_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "scaleInCooldownSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="scaleOutCooldownSecondsInput")
    def scale_out_cooldown_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "scaleOutCooldownSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="autoScalingMetric")
    def auto_scaling_metric(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "autoScalingMetric"))

    @auto_scaling_metric.setter
    def auto_scaling_metric(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f58d940d19b7638bb53cc40b02d7f50cab45bc48654080204d7903bc1aca2bf6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "autoScalingMetric", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxNodeCount")
    def max_node_count(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxNodeCount"))

    @max_node_count.setter
    def max_node_count(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__042232eb41f17abcd96bc3af2c9bc0f1036ce5be2e96741cec096034cf2ea7da)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxNodeCount", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="metricTarget")
    def metric_target(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "metricTarget"))

    @metric_target.setter
    def metric_target(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__509f5064b4a18b57c092a525a326df480999e95b9ea1e1c2f2aab2fa8946ebc9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "metricTarget", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minNodeCount")
    def min_node_count(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minNodeCount"))

    @min_node_count.setter
    def min_node_count(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7e094828852b8e37a461255c32af52cf7c145841d3a4be2b3e41dfb485b493b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minNodeCount", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="scaleInCooldownSeconds")
    def scale_in_cooldown_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "scaleInCooldownSeconds"))

    @scale_in_cooldown_seconds.setter
    def scale_in_cooldown_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78450977697315d5c26289832843600daef8ced72df962dca4011ebebf740c5a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "scaleInCooldownSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="scaleOutCooldownSeconds")
    def scale_out_cooldown_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "scaleOutCooldownSeconds"))

    @scale_out_cooldown_seconds.setter
    def scale_out_cooldown_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__16090493f9446c3ce0b81826187379259424984559c5abc9c79891a970af0280)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "scaleOutCooldownSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FinspaceKxClusterAutoScalingConfiguration]:
        return typing.cast(typing.Optional[FinspaceKxClusterAutoScalingConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FinspaceKxClusterAutoScalingConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e48d7b9752e1635a21eba78416b0cba42cf5b503b7e522635191ac8488d32c7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterCacheStorageConfigurations",
    jsii_struct_bases=[],
    name_mapping={"size": "size", "type": "type"},
)
class FinspaceKxClusterCacheStorageConfigurations:
    def __init__(self, *, size: jsii.Number, type: builtins.str) -> None:
        '''
        :param size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#size FinspaceKxCluster#size}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__de48692991033eba5420cbee15909d1573c173f1b55aa7f6c7d1dc3e21886bca)
            check_type(argname="argument size", value=size, expected_type=type_hints["size"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "size": size,
            "type": type,
        }

    @builtins.property
    def size(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#size FinspaceKxCluster#size}.'''
        result = self._values.get("size")
        assert result is not None, "Required property 'size' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FinspaceKxClusterCacheStorageConfigurations(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FinspaceKxClusterCacheStorageConfigurationsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterCacheStorageConfigurationsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9afc626649180c5a4b5f331cdb8e11b25ad0829afc71f12d71abf89d76e4b9b0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "FinspaceKxClusterCacheStorageConfigurationsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3144a8f271081a3b2b33429a3bfa5054d0c35725276d575f415275867585329)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("FinspaceKxClusterCacheStorageConfigurationsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c1e3b6388812eaada17b0735f59b6ef4fb1c2fe8f64ba78c8b74b64153170a8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d62afcd770ccccfe05cd41704f51a01484813329f4481373ab2fe5e264ba35c1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__18868a5b8e4e76bc2dcb76baf0a3471439a6e2433fc969de54c9a7d81d7f8b3d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterCacheStorageConfigurations]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterCacheStorageConfigurations]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterCacheStorageConfigurations]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__feb14cea469289dc87f7738852bd1384a12f7004e852d0a5f91cb65be1607322)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FinspaceKxClusterCacheStorageConfigurationsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterCacheStorageConfigurationsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__eebed2354a6a9158f942b8286dcb5d7a6aa2aa17937bc083f2e14425e4e61808)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="sizeInput")
    def size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "sizeInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="size")
    def size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "size"))

    @size.setter
    def size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f7ddcb67023dcbad6afb5bdda1b768a53b0e59e2affae7a555e0706cbf5cd981)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "size", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c884e4a3c205f94bbdeec86f491cba865158359131bdd87a61f2417d047e89f6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterCacheStorageConfigurations]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterCacheStorageConfigurations]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterCacheStorageConfigurations]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f613090911d177f9e5bf161065a9c87be22b009ceb189143419b4c8e2f3ecb24)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterCapacityConfiguration",
    jsii_struct_bases=[],
    name_mapping={"node_count": "nodeCount", "node_type": "nodeType"},
)
class FinspaceKxClusterCapacityConfiguration:
    def __init__(self, *, node_count: jsii.Number, node_type: builtins.str) -> None:
        '''
        :param node_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_count FinspaceKxCluster#node_count}.
        :param node_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_type FinspaceKxCluster#node_type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0fbd43f3fe3b21ebebaff64f084a783e294c6ca3a1eee9245b32ac399ab8390)
            check_type(argname="argument node_count", value=node_count, expected_type=type_hints["node_count"])
            check_type(argname="argument node_type", value=node_type, expected_type=type_hints["node_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "node_count": node_count,
            "node_type": node_type,
        }

    @builtins.property
    def node_count(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_count FinspaceKxCluster#node_count}.'''
        result = self._values.get("node_count")
        assert result is not None, "Required property 'node_count' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def node_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_type FinspaceKxCluster#node_type}.'''
        result = self._values.get("node_type")
        assert result is not None, "Required property 'node_type' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FinspaceKxClusterCapacityConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FinspaceKxClusterCapacityConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterCapacityConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__593eedffa3747abdfba0c659265dd8503c36f93793e7dcd2d4107e46a0d59ace)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="nodeCountInput")
    def node_count_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "nodeCountInput"))

    @builtins.property
    @jsii.member(jsii_name="nodeTypeInput")
    def node_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nodeTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="nodeCount")
    def node_count(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "nodeCount"))

    @node_count.setter
    def node_count(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e17ba8f6ada423b696b95fc8ab840af86d7d8cca699f30b5b825b7c9e24713ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "nodeCount", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="nodeType")
    def node_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "nodeType"))

    @node_type.setter
    def node_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bc11898a68d708e261592c429e2efd72abf589212d1d628c136714373e539321)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "nodeType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[FinspaceKxClusterCapacityConfiguration]:
        return typing.cast(typing.Optional[FinspaceKxClusterCapacityConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FinspaceKxClusterCapacityConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9fc726489c6cce39946a86d3b8826ee312849831d6e157340dfb0ae30e2eafc4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterCode",
    jsii_struct_bases=[],
    name_mapping={
        "s3_bucket": "s3Bucket",
        "s3_key": "s3Key",
        "s3_object_version": "s3ObjectVersion",
    },
)
class FinspaceKxClusterCode:
    def __init__(
        self,
        *,
        s3_bucket: builtins.str,
        s3_key: builtins.str,
        s3_object_version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_bucket: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_bucket FinspaceKxCluster#s3_bucket}.
        :param s3_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_key FinspaceKxCluster#s3_key}.
        :param s3_object_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_object_version FinspaceKxCluster#s3_object_version}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__005137f219df438dc8f26554b9adfb4ac0bb25ca49b8c195194d1e39ecbe22f2)
            check_type(argname="argument s3_bucket", value=s3_bucket, expected_type=type_hints["s3_bucket"])
            check_type(argname="argument s3_key", value=s3_key, expected_type=type_hints["s3_key"])
            check_type(argname="argument s3_object_version", value=s3_object_version, expected_type=type_hints["s3_object_version"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "s3_bucket": s3_bucket,
            "s3_key": s3_key,
        }
        if s3_object_version is not None:
            self._values["s3_object_version"] = s3_object_version

    @builtins.property
    def s3_bucket(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_bucket FinspaceKxCluster#s3_bucket}.'''
        result = self._values.get("s3_bucket")
        assert result is not None, "Required property 's3_bucket' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def s3_key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_key FinspaceKxCluster#s3_key}.'''
        result = self._values.get("s3_key")
        assert result is not None, "Required property 's3_key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def s3_object_version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#s3_object_version FinspaceKxCluster#s3_object_version}.'''
        result = self._values.get("s3_object_version")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FinspaceKxClusterCode(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FinspaceKxClusterCodeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterCodeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b078a1a2ed315144aa7289bf0b91b53af9f8dfc3944374dd840c86bd5c0190c7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetS3ObjectVersion")
    def reset_s3_object_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3ObjectVersion", []))

    @builtins.property
    @jsii.member(jsii_name="s3BucketInput")
    def s3_bucket_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3BucketInput"))

    @builtins.property
    @jsii.member(jsii_name="s3KeyInput")
    def s3_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3KeyInput"))

    @builtins.property
    @jsii.member(jsii_name="s3ObjectVersionInput")
    def s3_object_version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3ObjectVersionInput"))

    @builtins.property
    @jsii.member(jsii_name="s3Bucket")
    def s3_bucket(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3Bucket"))

    @s3_bucket.setter
    def s3_bucket(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05499f00b80f5a699f6a4fdeea48cdb17fdf28988da179c69e6807146d4a6c08)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3Bucket", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3Key")
    def s3_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3Key"))

    @s3_key.setter
    def s3_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__16320b1a0770ad7460d2018621a44b127cdb2edfe136a7b5c7cb1165fb54c95f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3Key", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3ObjectVersion")
    def s3_object_version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3ObjectVersion"))

    @s3_object_version.setter
    def s3_object_version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fee73cacbb039dae0f9f71f35b2f0ba0a242363e957bc50026a7195c4b5c9cce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3ObjectVersion", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[FinspaceKxClusterCode]:
        return typing.cast(typing.Optional[FinspaceKxClusterCode], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[FinspaceKxClusterCode]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a53eb2651f7547d868a52d53dc15800839e1ee053a3f5becf3e8a918aadb5790)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "az_mode": "azMode",
        "environment_id": "environmentId",
        "name": "name",
        "release_label": "releaseLabel",
        "type": "type",
        "vpc_configuration": "vpcConfiguration",
        "auto_scaling_configuration": "autoScalingConfiguration",
        "availability_zone_id": "availabilityZoneId",
        "cache_storage_configurations": "cacheStorageConfigurations",
        "capacity_configuration": "capacityConfiguration",
        "code": "code",
        "command_line_arguments": "commandLineArguments",
        "database": "database",
        "description": "description",
        "execution_role": "executionRole",
        "id": "id",
        "initialization_script": "initializationScript",
        "savedown_storage_configuration": "savedownStorageConfiguration",
        "scaling_group_configuration": "scalingGroupConfiguration",
        "tags": "tags",
        "tags_all": "tagsAll",
        "tickerplant_log_configuration": "tickerplantLogConfiguration",
        "timeouts": "timeouts",
    },
)
class FinspaceKxClusterConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        az_mode: builtins.str,
        environment_id: builtins.str,
        name: builtins.str,
        release_label: builtins.str,
        type: builtins.str,
        vpc_configuration: typing.Union["FinspaceKxClusterVpcConfiguration", typing.Dict[builtins.str, typing.Any]],
        auto_scaling_configuration: typing.Optional[typing.Union[FinspaceKxClusterAutoScalingConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
        availability_zone_id: typing.Optional[builtins.str] = None,
        cache_storage_configurations: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterCacheStorageConfigurations, typing.Dict[builtins.str, typing.Any]]]]] = None,
        capacity_configuration: typing.Optional[typing.Union[FinspaceKxClusterCapacityConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
        code: typing.Optional[typing.Union[FinspaceKxClusterCode, typing.Dict[builtins.str, typing.Any]]] = None,
        command_line_arguments: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        database: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FinspaceKxClusterDatabase", typing.Dict[builtins.str, typing.Any]]]]] = None,
        description: typing.Optional[builtins.str] = None,
        execution_role: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        initialization_script: typing.Optional[builtins.str] = None,
        savedown_storage_configuration: typing.Optional[typing.Union["FinspaceKxClusterSavedownStorageConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        scaling_group_configuration: typing.Optional[typing.Union["FinspaceKxClusterScalingGroupConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tickerplant_log_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FinspaceKxClusterTickerplantLogConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        timeouts: typing.Optional[typing.Union["FinspaceKxClusterTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param az_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#az_mode FinspaceKxCluster#az_mode}.
        :param environment_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#environment_id FinspaceKxCluster#environment_id}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#name FinspaceKxCluster#name}.
        :param release_label: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#release_label FinspaceKxCluster#release_label}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.
        :param vpc_configuration: vpc_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#vpc_configuration FinspaceKxCluster#vpc_configuration}
        :param auto_scaling_configuration: auto_scaling_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#auto_scaling_configuration FinspaceKxCluster#auto_scaling_configuration}
        :param availability_zone_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#availability_zone_id FinspaceKxCluster#availability_zone_id}.
        :param cache_storage_configurations: cache_storage_configurations block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_storage_configurations FinspaceKxCluster#cache_storage_configurations}
        :param capacity_configuration: capacity_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#capacity_configuration FinspaceKxCluster#capacity_configuration}
        :param code: code block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#code FinspaceKxCluster#code}
        :param command_line_arguments: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#command_line_arguments FinspaceKxCluster#command_line_arguments}.
        :param database: database block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#database FinspaceKxCluster#database}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#description FinspaceKxCluster#description}.
        :param execution_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#execution_role FinspaceKxCluster#execution_role}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#id FinspaceKxCluster#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param initialization_script: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#initialization_script FinspaceKxCluster#initialization_script}.
        :param savedown_storage_configuration: savedown_storage_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#savedown_storage_configuration FinspaceKxCluster#savedown_storage_configuration}
        :param scaling_group_configuration: scaling_group_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scaling_group_configuration FinspaceKxCluster#scaling_group_configuration}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags FinspaceKxCluster#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags_all FinspaceKxCluster#tags_all}.
        :param tickerplant_log_configuration: tickerplant_log_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tickerplant_log_configuration FinspaceKxCluster#tickerplant_log_configuration}
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#timeouts FinspaceKxCluster#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(vpc_configuration, dict):
            vpc_configuration = FinspaceKxClusterVpcConfiguration(**vpc_configuration)
        if isinstance(auto_scaling_configuration, dict):
            auto_scaling_configuration = FinspaceKxClusterAutoScalingConfiguration(**auto_scaling_configuration)
        if isinstance(capacity_configuration, dict):
            capacity_configuration = FinspaceKxClusterCapacityConfiguration(**capacity_configuration)
        if isinstance(code, dict):
            code = FinspaceKxClusterCode(**code)
        if isinstance(savedown_storage_configuration, dict):
            savedown_storage_configuration = FinspaceKxClusterSavedownStorageConfiguration(**savedown_storage_configuration)
        if isinstance(scaling_group_configuration, dict):
            scaling_group_configuration = FinspaceKxClusterScalingGroupConfiguration(**scaling_group_configuration)
        if isinstance(timeouts, dict):
            timeouts = FinspaceKxClusterTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f07d1421e91ca6d4f871001e7240353eef78b157cb6a25bb84f0af794e58c72a)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument az_mode", value=az_mode, expected_type=type_hints["az_mode"])
            check_type(argname="argument environment_id", value=environment_id, expected_type=type_hints["environment_id"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument release_label", value=release_label, expected_type=type_hints["release_label"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument vpc_configuration", value=vpc_configuration, expected_type=type_hints["vpc_configuration"])
            check_type(argname="argument auto_scaling_configuration", value=auto_scaling_configuration, expected_type=type_hints["auto_scaling_configuration"])
            check_type(argname="argument availability_zone_id", value=availability_zone_id, expected_type=type_hints["availability_zone_id"])
            check_type(argname="argument cache_storage_configurations", value=cache_storage_configurations, expected_type=type_hints["cache_storage_configurations"])
            check_type(argname="argument capacity_configuration", value=capacity_configuration, expected_type=type_hints["capacity_configuration"])
            check_type(argname="argument code", value=code, expected_type=type_hints["code"])
            check_type(argname="argument command_line_arguments", value=command_line_arguments, expected_type=type_hints["command_line_arguments"])
            check_type(argname="argument database", value=database, expected_type=type_hints["database"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument execution_role", value=execution_role, expected_type=type_hints["execution_role"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument initialization_script", value=initialization_script, expected_type=type_hints["initialization_script"])
            check_type(argname="argument savedown_storage_configuration", value=savedown_storage_configuration, expected_type=type_hints["savedown_storage_configuration"])
            check_type(argname="argument scaling_group_configuration", value=scaling_group_configuration, expected_type=type_hints["scaling_group_configuration"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument tickerplant_log_configuration", value=tickerplant_log_configuration, expected_type=type_hints["tickerplant_log_configuration"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "az_mode": az_mode,
            "environment_id": environment_id,
            "name": name,
            "release_label": release_label,
            "type": type,
            "vpc_configuration": vpc_configuration,
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
        if auto_scaling_configuration is not None:
            self._values["auto_scaling_configuration"] = auto_scaling_configuration
        if availability_zone_id is not None:
            self._values["availability_zone_id"] = availability_zone_id
        if cache_storage_configurations is not None:
            self._values["cache_storage_configurations"] = cache_storage_configurations
        if capacity_configuration is not None:
            self._values["capacity_configuration"] = capacity_configuration
        if code is not None:
            self._values["code"] = code
        if command_line_arguments is not None:
            self._values["command_line_arguments"] = command_line_arguments
        if database is not None:
            self._values["database"] = database
        if description is not None:
            self._values["description"] = description
        if execution_role is not None:
            self._values["execution_role"] = execution_role
        if id is not None:
            self._values["id"] = id
        if initialization_script is not None:
            self._values["initialization_script"] = initialization_script
        if savedown_storage_configuration is not None:
            self._values["savedown_storage_configuration"] = savedown_storage_configuration
        if scaling_group_configuration is not None:
            self._values["scaling_group_configuration"] = scaling_group_configuration
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if tickerplant_log_configuration is not None:
            self._values["tickerplant_log_configuration"] = tickerplant_log_configuration
        if timeouts is not None:
            self._values["timeouts"] = timeouts

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
    def az_mode(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#az_mode FinspaceKxCluster#az_mode}.'''
        result = self._values.get("az_mode")
        assert result is not None, "Required property 'az_mode' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def environment_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#environment_id FinspaceKxCluster#environment_id}.'''
        result = self._values.get("environment_id")
        assert result is not None, "Required property 'environment_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#name FinspaceKxCluster#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def release_label(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#release_label FinspaceKxCluster#release_label}.'''
        result = self._values.get("release_label")
        assert result is not None, "Required property 'release_label' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def vpc_configuration(self) -> "FinspaceKxClusterVpcConfiguration":
        '''vpc_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#vpc_configuration FinspaceKxCluster#vpc_configuration}
        '''
        result = self._values.get("vpc_configuration")
        assert result is not None, "Required property 'vpc_configuration' is missing"
        return typing.cast("FinspaceKxClusterVpcConfiguration", result)

    @builtins.property
    def auto_scaling_configuration(
        self,
    ) -> typing.Optional[FinspaceKxClusterAutoScalingConfiguration]:
        '''auto_scaling_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#auto_scaling_configuration FinspaceKxCluster#auto_scaling_configuration}
        '''
        result = self._values.get("auto_scaling_configuration")
        return typing.cast(typing.Optional[FinspaceKxClusterAutoScalingConfiguration], result)

    @builtins.property
    def availability_zone_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#availability_zone_id FinspaceKxCluster#availability_zone_id}.'''
        result = self._values.get("availability_zone_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def cache_storage_configurations(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterCacheStorageConfigurations]]]:
        '''cache_storage_configurations block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_storage_configurations FinspaceKxCluster#cache_storage_configurations}
        '''
        result = self._values.get("cache_storage_configurations")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterCacheStorageConfigurations]]], result)

    @builtins.property
    def capacity_configuration(
        self,
    ) -> typing.Optional[FinspaceKxClusterCapacityConfiguration]:
        '''capacity_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#capacity_configuration FinspaceKxCluster#capacity_configuration}
        '''
        result = self._values.get("capacity_configuration")
        return typing.cast(typing.Optional[FinspaceKxClusterCapacityConfiguration], result)

    @builtins.property
    def code(self) -> typing.Optional[FinspaceKxClusterCode]:
        '''code block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#code FinspaceKxCluster#code}
        '''
        result = self._values.get("code")
        return typing.cast(typing.Optional[FinspaceKxClusterCode], result)

    @builtins.property
    def command_line_arguments(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#command_line_arguments FinspaceKxCluster#command_line_arguments}.'''
        result = self._values.get("command_line_arguments")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def database(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FinspaceKxClusterDatabase"]]]:
        '''database block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#database FinspaceKxCluster#database}
        '''
        result = self._values.get("database")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FinspaceKxClusterDatabase"]]], result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#description FinspaceKxCluster#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def execution_role(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#execution_role FinspaceKxCluster#execution_role}.'''
        result = self._values.get("execution_role")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#id FinspaceKxCluster#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def initialization_script(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#initialization_script FinspaceKxCluster#initialization_script}.'''
        result = self._values.get("initialization_script")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def savedown_storage_configuration(
        self,
    ) -> typing.Optional["FinspaceKxClusterSavedownStorageConfiguration"]:
        '''savedown_storage_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#savedown_storage_configuration FinspaceKxCluster#savedown_storage_configuration}
        '''
        result = self._values.get("savedown_storage_configuration")
        return typing.cast(typing.Optional["FinspaceKxClusterSavedownStorageConfiguration"], result)

    @builtins.property
    def scaling_group_configuration(
        self,
    ) -> typing.Optional["FinspaceKxClusterScalingGroupConfiguration"]:
        '''scaling_group_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scaling_group_configuration FinspaceKxCluster#scaling_group_configuration}
        '''
        result = self._values.get("scaling_group_configuration")
        return typing.cast(typing.Optional["FinspaceKxClusterScalingGroupConfiguration"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags FinspaceKxCluster#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags_all FinspaceKxCluster#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tickerplant_log_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FinspaceKxClusterTickerplantLogConfiguration"]]]:
        '''tickerplant_log_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tickerplant_log_configuration FinspaceKxCluster#tickerplant_log_configuration}
        '''
        result = self._values.get("tickerplant_log_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FinspaceKxClusterTickerplantLogConfiguration"]]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["FinspaceKxClusterTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#timeouts FinspaceKxCluster#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["FinspaceKxClusterTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FinspaceKxClusterConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterDatabase",
    jsii_struct_bases=[],
    name_mapping={
        "database_name": "databaseName",
        "cache_configurations": "cacheConfigurations",
        "changeset_id": "changesetId",
        "dataview_name": "dataviewName",
    },
)
class FinspaceKxClusterDatabase:
    def __init__(
        self,
        *,
        database_name: builtins.str,
        cache_configurations: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["FinspaceKxClusterDatabaseCacheConfigurations", typing.Dict[builtins.str, typing.Any]]]]] = None,
        changeset_id: typing.Optional[builtins.str] = None,
        dataview_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param database_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#database_name FinspaceKxCluster#database_name}.
        :param cache_configurations: cache_configurations block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_configurations FinspaceKxCluster#cache_configurations}
        :param changeset_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#changeset_id FinspaceKxCluster#changeset_id}.
        :param dataview_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#dataview_name FinspaceKxCluster#dataview_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b39aaa5f68807ed3a1de272b4744356e1cbe8fcd2dba7443abae1433eb0f6472)
            check_type(argname="argument database_name", value=database_name, expected_type=type_hints["database_name"])
            check_type(argname="argument cache_configurations", value=cache_configurations, expected_type=type_hints["cache_configurations"])
            check_type(argname="argument changeset_id", value=changeset_id, expected_type=type_hints["changeset_id"])
            check_type(argname="argument dataview_name", value=dataview_name, expected_type=type_hints["dataview_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "database_name": database_name,
        }
        if cache_configurations is not None:
            self._values["cache_configurations"] = cache_configurations
        if changeset_id is not None:
            self._values["changeset_id"] = changeset_id
        if dataview_name is not None:
            self._values["dataview_name"] = dataview_name

    @builtins.property
    def database_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#database_name FinspaceKxCluster#database_name}.'''
        result = self._values.get("database_name")
        assert result is not None, "Required property 'database_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def cache_configurations(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FinspaceKxClusterDatabaseCacheConfigurations"]]]:
        '''cache_configurations block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_configurations FinspaceKxCluster#cache_configurations}
        '''
        result = self._values.get("cache_configurations")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["FinspaceKxClusterDatabaseCacheConfigurations"]]], result)

    @builtins.property
    def changeset_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#changeset_id FinspaceKxCluster#changeset_id}.'''
        result = self._values.get("changeset_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def dataview_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#dataview_name FinspaceKxCluster#dataview_name}.'''
        result = self._values.get("dataview_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FinspaceKxClusterDatabase(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterDatabaseCacheConfigurations",
    jsii_struct_bases=[],
    name_mapping={"cache_type": "cacheType", "db_paths": "dbPaths"},
)
class FinspaceKxClusterDatabaseCacheConfigurations:
    def __init__(
        self,
        *,
        cache_type: builtins.str,
        db_paths: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param cache_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_type FinspaceKxCluster#cache_type}.
        :param db_paths: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#db_paths FinspaceKxCluster#db_paths}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a8cf2c8dfd26c8b85db29385f4f4290bdd16f4d40899f1d488b96482642f90c)
            check_type(argname="argument cache_type", value=cache_type, expected_type=type_hints["cache_type"])
            check_type(argname="argument db_paths", value=db_paths, expected_type=type_hints["db_paths"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "cache_type": cache_type,
        }
        if db_paths is not None:
            self._values["db_paths"] = db_paths

    @builtins.property
    def cache_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_type FinspaceKxCluster#cache_type}.'''
        result = self._values.get("cache_type")
        assert result is not None, "Required property 'cache_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def db_paths(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#db_paths FinspaceKxCluster#db_paths}.'''
        result = self._values.get("db_paths")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FinspaceKxClusterDatabaseCacheConfigurations(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FinspaceKxClusterDatabaseCacheConfigurationsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterDatabaseCacheConfigurationsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__30ac3061437986c79931fd07be9b36368d378546e4744bac06eee8a253f787ea)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "FinspaceKxClusterDatabaseCacheConfigurationsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c0189ab606f3b056225b9a14c5e145623a843a8a476d8b3b8861e71d1ab209e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("FinspaceKxClusterDatabaseCacheConfigurationsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b6cf4d35c20c7feb8b8c4474209de383004700315b68d697e3b4f7ff5b8c0909)
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
            type_hints = typing.get_type_hints(_typecheckingstub__833424b7ad253c8d0ec80b5c996854dace2ced7ef10ca9ae282d2bd7e09ded85)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ed5b6237484cef37e6489bb94d41e415f946497c79ee156a96bafedbae1af5bc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterDatabaseCacheConfigurations]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterDatabaseCacheConfigurations]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterDatabaseCacheConfigurations]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f754ed3b8967c379bd4c72b013a27bc1c0f1963eea0b3d7a435fc723c536e87c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FinspaceKxClusterDatabaseCacheConfigurationsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterDatabaseCacheConfigurationsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__14d9a112c59bec282583f2aec494194012581751455c9f3aa3887a19a2de62e5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetDbPaths")
    def reset_db_paths(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDbPaths", []))

    @builtins.property
    @jsii.member(jsii_name="cacheTypeInput")
    def cache_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cacheTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="dbPathsInput")
    def db_paths_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "dbPathsInput"))

    @builtins.property
    @jsii.member(jsii_name="cacheType")
    def cache_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "cacheType"))

    @cache_type.setter
    def cache_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__17a2aacef1366462b3e8f9dbf4687fd94c0ac30f75e74a01958469dd4e1e2df4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cacheType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dbPaths")
    def db_paths(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "dbPaths"))

    @db_paths.setter
    def db_paths(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd30f37b31027f0497b3c2d7d93ebb89b5271fb932641d6acdc114656f80ff6c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dbPaths", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterDatabaseCacheConfigurations]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterDatabaseCacheConfigurations]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterDatabaseCacheConfigurations]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b001b96bb861f2bfdfb3420d6cba6c044e36162fe32633b5facb2a4f685fc028)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FinspaceKxClusterDatabaseList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterDatabaseList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a5475a67e035a2fef61a7d5d784bb40ec33bf0e9ab37defc74b53f398993a1d8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "FinspaceKxClusterDatabaseOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dddc9c28660135fe82ec514fa8cd6cf4ed8601bb35fc760147d265f86ad3abf1)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("FinspaceKxClusterDatabaseOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a13f7172c74981e8e12b0666ee6de83a66f64b0e1337c625089d43597def49f8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9d8d2b90544c0e5b2fc312f668d79177d9d770b72eef734c3c38496a6db53ae0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7a0e726a5470279d58242c92bd2b15905350fafcebec31b98bc3e6a5770f4d97)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterDatabase]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterDatabase]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterDatabase]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__734235c2ffa875dcc3531a7907a29b9a2024e977301e1637b660ddf0e1f7c871)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FinspaceKxClusterDatabaseOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterDatabaseOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__aa22bb6ebd678d2fd22a15a50929b0452b27b154a46139b2c90cf9b5fe23f72f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putCacheConfigurations")
    def put_cache_configurations(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterDatabaseCacheConfigurations, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2796535e0cce27a08d76eb19afb628a4149a3139d16346c21df0d81064d7d0c7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCacheConfigurations", [value]))

    @jsii.member(jsii_name="resetCacheConfigurations")
    def reset_cache_configurations(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCacheConfigurations", []))

    @jsii.member(jsii_name="resetChangesetId")
    def reset_changeset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetChangesetId", []))

    @jsii.member(jsii_name="resetDataviewName")
    def reset_dataview_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataviewName", []))

    @builtins.property
    @jsii.member(jsii_name="cacheConfigurations")
    def cache_configurations(self) -> FinspaceKxClusterDatabaseCacheConfigurationsList:
        return typing.cast(FinspaceKxClusterDatabaseCacheConfigurationsList, jsii.get(self, "cacheConfigurations"))

    @builtins.property
    @jsii.member(jsii_name="cacheConfigurationsInput")
    def cache_configurations_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterDatabaseCacheConfigurations]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterDatabaseCacheConfigurations]]], jsii.get(self, "cacheConfigurationsInput"))

    @builtins.property
    @jsii.member(jsii_name="changesetIdInput")
    def changeset_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "changesetIdInput"))

    @builtins.property
    @jsii.member(jsii_name="databaseNameInput")
    def database_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "databaseNameInput"))

    @builtins.property
    @jsii.member(jsii_name="dataviewNameInput")
    def dataview_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataviewNameInput"))

    @builtins.property
    @jsii.member(jsii_name="changesetId")
    def changeset_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "changesetId"))

    @changeset_id.setter
    def changeset_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a2e040132aaf7cb365e27bac5c5e1b776542a533313d38fbfb60e8520bccfe0e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "changesetId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="databaseName")
    def database_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "databaseName"))

    @database_name.setter
    def database_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c650d350cfa5f1cbb21a8d073f71d8ad03488dca6d33661019dd8bd89524bf9b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "databaseName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dataviewName")
    def dataview_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataviewName"))

    @dataview_name.setter
    def dataview_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5207caceaf2dd96f5a4e4cd3e09443de28f017e06d0ed215f292c973a724a0aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataviewName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterDatabase]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterDatabase]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterDatabase]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2978bf61ac5a1045fe0af3eee7763353d8109aea35624c788c95d111e6af075b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterSavedownStorageConfiguration",
    jsii_struct_bases=[],
    name_mapping={"size": "size", "type": "type", "volume_name": "volumeName"},
)
class FinspaceKxClusterSavedownStorageConfiguration:
    def __init__(
        self,
        *,
        size: typing.Optional[jsii.Number] = None,
        type: typing.Optional[builtins.str] = None,
        volume_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#size FinspaceKxCluster#size}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.
        :param volume_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#volume_name FinspaceKxCluster#volume_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a4756bfd405b0981a862ef727a0891c9eea0486febe5c8783e77d4382f12b473)
            check_type(argname="argument size", value=size, expected_type=type_hints["size"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument volume_name", value=volume_name, expected_type=type_hints["volume_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if size is not None:
            self._values["size"] = size
        if type is not None:
            self._values["type"] = type
        if volume_name is not None:
            self._values["volume_name"] = volume_name

    @builtins.property
    def size(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#size FinspaceKxCluster#size}.'''
        result = self._values.get("size")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def volume_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#volume_name FinspaceKxCluster#volume_name}.'''
        result = self._values.get("volume_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FinspaceKxClusterSavedownStorageConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FinspaceKxClusterSavedownStorageConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterSavedownStorageConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__aab10c1817146d1151b90f9fb75c6768f6375c195e9f593b79d19d609206dbb5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetSize")
    def reset_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSize", []))

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @jsii.member(jsii_name="resetVolumeName")
    def reset_volume_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVolumeName", []))

    @builtins.property
    @jsii.member(jsii_name="sizeInput")
    def size_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "sizeInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="volumeNameInput")
    def volume_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "volumeNameInput"))

    @builtins.property
    @jsii.member(jsii_name="size")
    def size(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "size"))

    @size.setter
    def size(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78af5cb8e4e1dac3dafd5c5150291c130619374b57c6dec7cca030d393f6fbe9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "size", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac635aa2448f46f4b8c98c6d4bbb419b40fb40e25d9a2c446573d8914c349522)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="volumeName")
    def volume_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "volumeName"))

    @volume_name.setter
    def volume_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae3d7019c034c18a48753412a0f87d45a84c8cb6766052459567bdceabc57cf1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "volumeName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FinspaceKxClusterSavedownStorageConfiguration]:
        return typing.cast(typing.Optional[FinspaceKxClusterSavedownStorageConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FinspaceKxClusterSavedownStorageConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05aa215ad71d661296b64e64d63bd5899e254f6abd88d7b6817e04fa629a877f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterScalingGroupConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "memory_reservation": "memoryReservation",
        "node_count": "nodeCount",
        "scaling_group_name": "scalingGroupName",
        "cpu": "cpu",
        "memory_limit": "memoryLimit",
    },
)
class FinspaceKxClusterScalingGroupConfiguration:
    def __init__(
        self,
        *,
        memory_reservation: jsii.Number,
        node_count: jsii.Number,
        scaling_group_name: builtins.str,
        cpu: typing.Optional[jsii.Number] = None,
        memory_limit: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param memory_reservation: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#memory_reservation FinspaceKxCluster#memory_reservation}.
        :param node_count: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_count FinspaceKxCluster#node_count}.
        :param scaling_group_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scaling_group_name FinspaceKxCluster#scaling_group_name}.
        :param cpu: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cpu FinspaceKxCluster#cpu}.
        :param memory_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#memory_limit FinspaceKxCluster#memory_limit}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__52e0cd3e67b2022f59163817e398120e579504cdd301cf28b89cadba0996a962)
            check_type(argname="argument memory_reservation", value=memory_reservation, expected_type=type_hints["memory_reservation"])
            check_type(argname="argument node_count", value=node_count, expected_type=type_hints["node_count"])
            check_type(argname="argument scaling_group_name", value=scaling_group_name, expected_type=type_hints["scaling_group_name"])
            check_type(argname="argument cpu", value=cpu, expected_type=type_hints["cpu"])
            check_type(argname="argument memory_limit", value=memory_limit, expected_type=type_hints["memory_limit"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "memory_reservation": memory_reservation,
            "node_count": node_count,
            "scaling_group_name": scaling_group_name,
        }
        if cpu is not None:
            self._values["cpu"] = cpu
        if memory_limit is not None:
            self._values["memory_limit"] = memory_limit

    @builtins.property
    def memory_reservation(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#memory_reservation FinspaceKxCluster#memory_reservation}.'''
        result = self._values.get("memory_reservation")
        assert result is not None, "Required property 'memory_reservation' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def node_count(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_count FinspaceKxCluster#node_count}.'''
        result = self._values.get("node_count")
        assert result is not None, "Required property 'node_count' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def scaling_group_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scaling_group_name FinspaceKxCluster#scaling_group_name}.'''
        result = self._values.get("scaling_group_name")
        assert result is not None, "Required property 'scaling_group_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def cpu(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cpu FinspaceKxCluster#cpu}.'''
        result = self._values.get("cpu")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def memory_limit(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#memory_limit FinspaceKxCluster#memory_limit}.'''
        result = self._values.get("memory_limit")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FinspaceKxClusterScalingGroupConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FinspaceKxClusterScalingGroupConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterScalingGroupConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cc0858400beecd1d504ee95ec0e9d1b5be9e104f6e92a64a920058791f53a502)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCpu")
    def reset_cpu(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCpu", []))

    @jsii.member(jsii_name="resetMemoryLimit")
    def reset_memory_limit(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMemoryLimit", []))

    @builtins.property
    @jsii.member(jsii_name="cpuInput")
    def cpu_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "cpuInput"))

    @builtins.property
    @jsii.member(jsii_name="memoryLimitInput")
    def memory_limit_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "memoryLimitInput"))

    @builtins.property
    @jsii.member(jsii_name="memoryReservationInput")
    def memory_reservation_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "memoryReservationInput"))

    @builtins.property
    @jsii.member(jsii_name="nodeCountInput")
    def node_count_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "nodeCountInput"))

    @builtins.property
    @jsii.member(jsii_name="scalingGroupNameInput")
    def scaling_group_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "scalingGroupNameInput"))

    @builtins.property
    @jsii.member(jsii_name="cpu")
    def cpu(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "cpu"))

    @cpu.setter
    def cpu(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e54849151748a5ec204276836d3a4e057000663a3666d45acc32b9bee8165530)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cpu", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="memoryLimit")
    def memory_limit(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "memoryLimit"))

    @memory_limit.setter
    def memory_limit(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0a1104b29b1f80e282b6e5fa7aaebfc6f9ad7252af81d427b1ac2d87ac80b718)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "memoryLimit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="memoryReservation")
    def memory_reservation(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "memoryReservation"))

    @memory_reservation.setter
    def memory_reservation(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2dda8e190ab3fb10a52c9333c4255b1c00ccf1aaa295005818e7c23e5543b462)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "memoryReservation", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="nodeCount")
    def node_count(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "nodeCount"))

    @node_count.setter
    def node_count(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f70960c5e145ed4c3555751dcc16eff9ff3904762484868103beb887cba5655f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "nodeCount", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="scalingGroupName")
    def scaling_group_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "scalingGroupName"))

    @scaling_group_name.setter
    def scaling_group_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a0a89e5d5620c6a531b4c728480678568942743e4e4a7c7917b072ab6c7325b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "scalingGroupName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[FinspaceKxClusterScalingGroupConfiguration]:
        return typing.cast(typing.Optional[FinspaceKxClusterScalingGroupConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FinspaceKxClusterScalingGroupConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__39e389317381cbf0cdeb6ad68177f1a9360a36d990e25033e256ee25e0477bd5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterTickerplantLogConfiguration",
    jsii_struct_bases=[],
    name_mapping={"tickerplant_log_volumes": "tickerplantLogVolumes"},
)
class FinspaceKxClusterTickerplantLogConfiguration:
    def __init__(
        self,
        *,
        tickerplant_log_volumes: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param tickerplant_log_volumes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tickerplant_log_volumes FinspaceKxCluster#tickerplant_log_volumes}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4add144f24e4b39400c942d541892a78226596f6290c9516d8fbf0bd78d4b438)
            check_type(argname="argument tickerplant_log_volumes", value=tickerplant_log_volumes, expected_type=type_hints["tickerplant_log_volumes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "tickerplant_log_volumes": tickerplant_log_volumes,
        }

    @builtins.property
    def tickerplant_log_volumes(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tickerplant_log_volumes FinspaceKxCluster#tickerplant_log_volumes}.'''
        result = self._values.get("tickerplant_log_volumes")
        assert result is not None, "Required property 'tickerplant_log_volumes' is missing"
        return typing.cast(typing.List[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FinspaceKxClusterTickerplantLogConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FinspaceKxClusterTickerplantLogConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterTickerplantLogConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7f715645f040869ce5a2b85850f4f63390f41c73db823d542aa234b0cdbfffcd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "FinspaceKxClusterTickerplantLogConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2e82e0895689032099b21db6e4adba21646424c882fac9e4faff70f15a1b41f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("FinspaceKxClusterTickerplantLogConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1287b1d96cc617584618f6d352afa3382de87aef5dac425bda7ad575e42342a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3ffb9a4582ec54e5399ec2e551a1e967fffd1caf9d0037e0537a4c59ed00ff88)
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
            type_hints = typing.get_type_hints(_typecheckingstub__536f34e721cc8f321d6f39a94d92dbc1c009a73bcf80242b591c52e5b8801ca3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterTickerplantLogConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterTickerplantLogConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterTickerplantLogConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e3cec856a96f57d400ef7b40189d663acb39d445dda0053c18f558cbad14f4bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class FinspaceKxClusterTickerplantLogConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterTickerplantLogConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__eadd0c58b698efb2afb47d7961182a5e4a925af7a5ddf0c22832aacbbeed2fe5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="tickerplantLogVolumesInput")
    def tickerplant_log_volumes_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "tickerplantLogVolumesInput"))

    @builtins.property
    @jsii.member(jsii_name="tickerplantLogVolumes")
    def tickerplant_log_volumes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "tickerplantLogVolumes"))

    @tickerplant_log_volumes.setter
    def tickerplant_log_volumes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e56e9797b6fe29fac4d39cce1ab5573eb78e640c53f24990e6af119ba2e0540f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tickerplantLogVolumes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterTickerplantLogConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterTickerplantLogConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterTickerplantLogConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e080d1cccc089daba1c770241a70341572d0c8444778c2992864833106a2b46)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class FinspaceKxClusterTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#create FinspaceKxCluster#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#delete FinspaceKxCluster#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#update FinspaceKxCluster#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__60835cf26895aa604e7c8865aac2219f3724b8e9fdafe2902a1d1eb9f8b146dd)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#create FinspaceKxCluster#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#delete FinspaceKxCluster#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#update FinspaceKxCluster#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FinspaceKxClusterTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FinspaceKxClusterTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e24129e64af4260da57539983682903e8bc7ff9a0dcf85d4f03561ccd1aee134)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6b0ba6da0f0ea6dfd8e71125bbe44a4af23fb5c5ac2ca913f4ac0cc0e47798ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04f9fecfc8a7cf44ebdc0df21fd8bf83117d10f83c67a5e226a79b19ff5183db)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__593ca06ab09023917b05d5561415fe3333299c507d832ebd1b374ae9b340901e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4eea833951d3050e4a3005b4004279435923903deb42ae0b551e16ed9c8b7740)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterVpcConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "ip_address_type": "ipAddressType",
        "security_group_ids": "securityGroupIds",
        "subnet_ids": "subnetIds",
        "vpc_id": "vpcId",
    },
)
class FinspaceKxClusterVpcConfiguration:
    def __init__(
        self,
        *,
        ip_address_type: builtins.str,
        security_group_ids: typing.Sequence[builtins.str],
        subnet_ids: typing.Sequence[builtins.str],
        vpc_id: builtins.str,
    ) -> None:
        '''
        :param ip_address_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#ip_address_type FinspaceKxCluster#ip_address_type}.
        :param security_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#security_group_ids FinspaceKxCluster#security_group_ids}.
        :param subnet_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#subnet_ids FinspaceKxCluster#subnet_ids}.
        :param vpc_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#vpc_id FinspaceKxCluster#vpc_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca0d78d665aaf677e29cd324ebc1acbc05de62fe0271f547aeefa92c2b1ddef0)
            check_type(argname="argument ip_address_type", value=ip_address_type, expected_type=type_hints["ip_address_type"])
            check_type(argname="argument security_group_ids", value=security_group_ids, expected_type=type_hints["security_group_ids"])
            check_type(argname="argument subnet_ids", value=subnet_ids, expected_type=type_hints["subnet_ids"])
            check_type(argname="argument vpc_id", value=vpc_id, expected_type=type_hints["vpc_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "ip_address_type": ip_address_type,
            "security_group_ids": security_group_ids,
            "subnet_ids": subnet_ids,
            "vpc_id": vpc_id,
        }

    @builtins.property
    def ip_address_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#ip_address_type FinspaceKxCluster#ip_address_type}.'''
        result = self._values.get("ip_address_type")
        assert result is not None, "Required property 'ip_address_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def security_group_ids(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#security_group_ids FinspaceKxCluster#security_group_ids}.'''
        result = self._values.get("security_group_ids")
        assert result is not None, "Required property 'security_group_ids' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def subnet_ids(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#subnet_ids FinspaceKxCluster#subnet_ids}.'''
        result = self._values.get("subnet_ids")
        assert result is not None, "Required property 'subnet_ids' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def vpc_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#vpc_id FinspaceKxCluster#vpc_id}.'''
        result = self._values.get("vpc_id")
        assert result is not None, "Required property 'vpc_id' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "FinspaceKxClusterVpcConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class FinspaceKxClusterVpcConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.finspaceKxCluster.FinspaceKxClusterVpcConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d680bdee2aea9561a18f77724fc0e4bf74eb977446f1d9d2073b933784a7d30a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="ipAddressTypeInput")
    def ip_address_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ipAddressTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="securityGroupIdsInput")
    def security_group_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "securityGroupIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetIdsInput")
    def subnet_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "subnetIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="vpcIdInput")
    def vpc_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "vpcIdInput"))

    @builtins.property
    @jsii.member(jsii_name="ipAddressType")
    def ip_address_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ipAddressType"))

    @ip_address_type.setter
    def ip_address_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0a03afd519803a44c40c4c2ec90cef5e6a2305bb1f8e82c8e2b587ce79563384)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ipAddressType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="securityGroupIds")
    def security_group_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "securityGroupIds"))

    @security_group_ids.setter
    def security_group_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37f6281967464c9e92d469b2376dbe242175606cd4ad697575e33fc0c063ee02)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityGroupIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnetIds")
    def subnet_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "subnetIds"))

    @subnet_ids.setter
    def subnet_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d2da20ddbe409f3a0996c9df96f480cb03fd946ec3d522020cdf003ac2f9bcd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnetIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="vpcId")
    def vpc_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vpcId"))

    @vpc_id.setter
    def vpc_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b64bd40f87c11722d24ed4699fe207c842937147c4adf380f83a94aaa23ce72b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "vpcId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[FinspaceKxClusterVpcConfiguration]:
        return typing.cast(typing.Optional[FinspaceKxClusterVpcConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[FinspaceKxClusterVpcConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ef16ea0a473f4cb6f27009eef317363579136746b8baefadf4508e33a4a2e0f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "FinspaceKxCluster",
    "FinspaceKxClusterAutoScalingConfiguration",
    "FinspaceKxClusterAutoScalingConfigurationOutputReference",
    "FinspaceKxClusterCacheStorageConfigurations",
    "FinspaceKxClusterCacheStorageConfigurationsList",
    "FinspaceKxClusterCacheStorageConfigurationsOutputReference",
    "FinspaceKxClusterCapacityConfiguration",
    "FinspaceKxClusterCapacityConfigurationOutputReference",
    "FinspaceKxClusterCode",
    "FinspaceKxClusterCodeOutputReference",
    "FinspaceKxClusterConfig",
    "FinspaceKxClusterDatabase",
    "FinspaceKxClusterDatabaseCacheConfigurations",
    "FinspaceKxClusterDatabaseCacheConfigurationsList",
    "FinspaceKxClusterDatabaseCacheConfigurationsOutputReference",
    "FinspaceKxClusterDatabaseList",
    "FinspaceKxClusterDatabaseOutputReference",
    "FinspaceKxClusterSavedownStorageConfiguration",
    "FinspaceKxClusterSavedownStorageConfigurationOutputReference",
    "FinspaceKxClusterScalingGroupConfiguration",
    "FinspaceKxClusterScalingGroupConfigurationOutputReference",
    "FinspaceKxClusterTickerplantLogConfiguration",
    "FinspaceKxClusterTickerplantLogConfigurationList",
    "FinspaceKxClusterTickerplantLogConfigurationOutputReference",
    "FinspaceKxClusterTimeouts",
    "FinspaceKxClusterTimeoutsOutputReference",
    "FinspaceKxClusterVpcConfiguration",
    "FinspaceKxClusterVpcConfigurationOutputReference",
]

publication.publish()

def _typecheckingstub__bd8050ee00862f847ddab1450175ab76e710011700cb3aca9d017b35737b67da(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    az_mode: builtins.str,
    environment_id: builtins.str,
    name: builtins.str,
    release_label: builtins.str,
    type: builtins.str,
    vpc_configuration: typing.Union[FinspaceKxClusterVpcConfiguration, typing.Dict[builtins.str, typing.Any]],
    auto_scaling_configuration: typing.Optional[typing.Union[FinspaceKxClusterAutoScalingConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    availability_zone_id: typing.Optional[builtins.str] = None,
    cache_storage_configurations: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterCacheStorageConfigurations, typing.Dict[builtins.str, typing.Any]]]]] = None,
    capacity_configuration: typing.Optional[typing.Union[FinspaceKxClusterCapacityConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    code: typing.Optional[typing.Union[FinspaceKxClusterCode, typing.Dict[builtins.str, typing.Any]]] = None,
    command_line_arguments: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    database: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterDatabase, typing.Dict[builtins.str, typing.Any]]]]] = None,
    description: typing.Optional[builtins.str] = None,
    execution_role: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    initialization_script: typing.Optional[builtins.str] = None,
    savedown_storage_configuration: typing.Optional[typing.Union[FinspaceKxClusterSavedownStorageConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    scaling_group_configuration: typing.Optional[typing.Union[FinspaceKxClusterScalingGroupConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tickerplant_log_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterTickerplantLogConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    timeouts: typing.Optional[typing.Union[FinspaceKxClusterTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__fa84e507a50a67b172c015f2f191f8d2c5b9c8f385cea173e7c9362190e0f70c(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a925d1fa3c38abaef8fae79949824c50f6d1343da82b6b43e62ccb799f7c6c2(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterCacheStorageConfigurations, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a99aabdaa71e4adac1137cd1ddb70eca32c13d3085abb6095fa3b9d60ad1f341(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterDatabase, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04ebe60a759b7184e3f9ba46ecfafd58d22f855ed454b7f4090e1e035fc70094(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterTickerplantLogConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f2a4ec769547766ab4fb35d5aedb5d5be6a33d8463d4baf0e65ddcf99bdbd9b4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__814ba0b679b3dcca08ff2130708fc22c9f4636cc269a302c68c4c92558a3d9ee(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e35b5d9b729543a362153857d27d38d903102005bdd923c012790f2fdee98c5(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41281a798524d72de0e88005e3ae58771639e0633f1fce27d5ffc81340484f8f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bfe9819e6aff39f0bdd2957d6a40b5b324077bc2520ae1927d0b485bdbeb8037(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__386ed63e5fb48557f26de8efe91fe5af16f4323e7b72fb7e7831c4f4265f1620(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a1201393fcf397c585619e9b0af37b38c1a1e7d6f1e05e4b97a5e8204ef48f9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__907741f36203edea17a60a8e9495682e733590dccb1edbffb18ec9f7596c3cb9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa41e4de86490c8bbbfc49ae4865a15ccc7060c58f957d3534684f9846714624(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c304defb5a17628b989968e1a0bebfd3651afde9b39fe10b41cafb1028185ef(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__967ea3b2f6bf419b08f6268a013c49388ea64f0672d59d369ebef431340c8db3(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18f379c375edb9278e1d0ac3d85650bc5a38116e40aeb979943bcddc040227c8(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ed9dca0caa945f3b8be28aa759e00758b6c8da39d2a18fdfe266fcfa5d89308(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__71346699ccc247eb1a024ca3084d02ff17d1022b32e43d82b34dc14ea6d50de0(
    *,
    auto_scaling_metric: builtins.str,
    max_node_count: jsii.Number,
    metric_target: jsii.Number,
    min_node_count: jsii.Number,
    scale_in_cooldown_seconds: jsii.Number,
    scale_out_cooldown_seconds: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__998fdaf8e1fc098a10a74ae55506936395f295996e2ac10d954adc87018590ac(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f58d940d19b7638bb53cc40b02d7f50cab45bc48654080204d7903bc1aca2bf6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__042232eb41f17abcd96bc3af2c9bc0f1036ce5be2e96741cec096034cf2ea7da(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__509f5064b4a18b57c092a525a326df480999e95b9ea1e1c2f2aab2fa8946ebc9(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7e094828852b8e37a461255c32af52cf7c145841d3a4be2b3e41dfb485b493b(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78450977697315d5c26289832843600daef8ced72df962dca4011ebebf740c5a(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__16090493f9446c3ce0b81826187379259424984559c5abc9c79891a970af0280(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e48d7b9752e1635a21eba78416b0cba42cf5b503b7e522635191ac8488d32c7(
    value: typing.Optional[FinspaceKxClusterAutoScalingConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__de48692991033eba5420cbee15909d1573c173f1b55aa7f6c7d1dc3e21886bca(
    *,
    size: jsii.Number,
    type: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9afc626649180c5a4b5f331cdb8e11b25ad0829afc71f12d71abf89d76e4b9b0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3144a8f271081a3b2b33429a3bfa5054d0c35725276d575f415275867585329(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c1e3b6388812eaada17b0735f59b6ef4fb1c2fe8f64ba78c8b74b64153170a8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d62afcd770ccccfe05cd41704f51a01484813329f4481373ab2fe5e264ba35c1(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18868a5b8e4e76bc2dcb76baf0a3471439a6e2433fc969de54c9a7d81d7f8b3d(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__feb14cea469289dc87f7738852bd1384a12f7004e852d0a5f91cb65be1607322(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterCacheStorageConfigurations]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eebed2354a6a9158f942b8286dcb5d7a6aa2aa17937bc083f2e14425e4e61808(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7ddcb67023dcbad6afb5bdda1b768a53b0e59e2affae7a555e0706cbf5cd981(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c884e4a3c205f94bbdeec86f491cba865158359131bdd87a61f2417d047e89f6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f613090911d177f9e5bf161065a9c87be22b009ceb189143419b4c8e2f3ecb24(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterCacheStorageConfigurations]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0fbd43f3fe3b21ebebaff64f084a783e294c6ca3a1eee9245b32ac399ab8390(
    *,
    node_count: jsii.Number,
    node_type: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__593eedffa3747abdfba0c659265dd8503c36f93793e7dcd2d4107e46a0d59ace(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e17ba8f6ada423b696b95fc8ab840af86d7d8cca699f30b5b825b7c9e24713ef(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc11898a68d708e261592c429e2efd72abf589212d1d628c136714373e539321(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9fc726489c6cce39946a86d3b8826ee312849831d6e157340dfb0ae30e2eafc4(
    value: typing.Optional[FinspaceKxClusterCapacityConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__005137f219df438dc8f26554b9adfb4ac0bb25ca49b8c195194d1e39ecbe22f2(
    *,
    s3_bucket: builtins.str,
    s3_key: builtins.str,
    s3_object_version: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b078a1a2ed315144aa7289bf0b91b53af9f8dfc3944374dd840c86bd5c0190c7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05499f00b80f5a699f6a4fdeea48cdb17fdf28988da179c69e6807146d4a6c08(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__16320b1a0770ad7460d2018621a44b127cdb2edfe136a7b5c7cb1165fb54c95f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fee73cacbb039dae0f9f71f35b2f0ba0a242363e957bc50026a7195c4b5c9cce(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a53eb2651f7547d868a52d53dc15800839e1ee053a3f5becf3e8a918aadb5790(
    value: typing.Optional[FinspaceKxClusterCode],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f07d1421e91ca6d4f871001e7240353eef78b157cb6a25bb84f0af794e58c72a(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    az_mode: builtins.str,
    environment_id: builtins.str,
    name: builtins.str,
    release_label: builtins.str,
    type: builtins.str,
    vpc_configuration: typing.Union[FinspaceKxClusterVpcConfiguration, typing.Dict[builtins.str, typing.Any]],
    auto_scaling_configuration: typing.Optional[typing.Union[FinspaceKxClusterAutoScalingConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    availability_zone_id: typing.Optional[builtins.str] = None,
    cache_storage_configurations: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterCacheStorageConfigurations, typing.Dict[builtins.str, typing.Any]]]]] = None,
    capacity_configuration: typing.Optional[typing.Union[FinspaceKxClusterCapacityConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    code: typing.Optional[typing.Union[FinspaceKxClusterCode, typing.Dict[builtins.str, typing.Any]]] = None,
    command_line_arguments: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    database: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterDatabase, typing.Dict[builtins.str, typing.Any]]]]] = None,
    description: typing.Optional[builtins.str] = None,
    execution_role: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    initialization_script: typing.Optional[builtins.str] = None,
    savedown_storage_configuration: typing.Optional[typing.Union[FinspaceKxClusterSavedownStorageConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    scaling_group_configuration: typing.Optional[typing.Union[FinspaceKxClusterScalingGroupConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tickerplant_log_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterTickerplantLogConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    timeouts: typing.Optional[typing.Union[FinspaceKxClusterTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b39aaa5f68807ed3a1de272b4744356e1cbe8fcd2dba7443abae1433eb0f6472(
    *,
    database_name: builtins.str,
    cache_configurations: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterDatabaseCacheConfigurations, typing.Dict[builtins.str, typing.Any]]]]] = None,
    changeset_id: typing.Optional[builtins.str] = None,
    dataview_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a8cf2c8dfd26c8b85db29385f4f4290bdd16f4d40899f1d488b96482642f90c(
    *,
    cache_type: builtins.str,
    db_paths: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30ac3061437986c79931fd07be9b36368d378546e4744bac06eee8a253f787ea(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c0189ab606f3b056225b9a14c5e145623a843a8a476d8b3b8861e71d1ab209e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6cf4d35c20c7feb8b8c4474209de383004700315b68d697e3b4f7ff5b8c0909(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__833424b7ad253c8d0ec80b5c996854dace2ced7ef10ca9ae282d2bd7e09ded85(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed5b6237484cef37e6489bb94d41e415f946497c79ee156a96bafedbae1af5bc(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f754ed3b8967c379bd4c72b013a27bc1c0f1963eea0b3d7a435fc723c536e87c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterDatabaseCacheConfigurations]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14d9a112c59bec282583f2aec494194012581751455c9f3aa3887a19a2de62e5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__17a2aacef1366462b3e8f9dbf4687fd94c0ac30f75e74a01958469dd4e1e2df4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd30f37b31027f0497b3c2d7d93ebb89b5271fb932641d6acdc114656f80ff6c(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b001b96bb861f2bfdfb3420d6cba6c044e36162fe32633b5facb2a4f685fc028(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterDatabaseCacheConfigurations]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5475a67e035a2fef61a7d5d784bb40ec33bf0e9ab37defc74b53f398993a1d8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dddc9c28660135fe82ec514fa8cd6cf4ed8601bb35fc760147d265f86ad3abf1(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a13f7172c74981e8e12b0666ee6de83a66f64b0e1337c625089d43597def49f8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d8d2b90544c0e5b2fc312f668d79177d9d770b72eef734c3c38496a6db53ae0(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7a0e726a5470279d58242c92bd2b15905350fafcebec31b98bc3e6a5770f4d97(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__734235c2ffa875dcc3531a7907a29b9a2024e977301e1637b660ddf0e1f7c871(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterDatabase]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa22bb6ebd678d2fd22a15a50929b0452b27b154a46139b2c90cf9b5fe23f72f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2796535e0cce27a08d76eb19afb628a4149a3139d16346c21df0d81064d7d0c7(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[FinspaceKxClusterDatabaseCacheConfigurations, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2e040132aaf7cb365e27bac5c5e1b776542a533313d38fbfb60e8520bccfe0e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c650d350cfa5f1cbb21a8d073f71d8ad03488dca6d33661019dd8bd89524bf9b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5207caceaf2dd96f5a4e4cd3e09443de28f017e06d0ed215f292c973a724a0aa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2978bf61ac5a1045fe0af3eee7763353d8109aea35624c788c95d111e6af075b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterDatabase]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a4756bfd405b0981a862ef727a0891c9eea0486febe5c8783e77d4382f12b473(
    *,
    size: typing.Optional[jsii.Number] = None,
    type: typing.Optional[builtins.str] = None,
    volume_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aab10c1817146d1151b90f9fb75c6768f6375c195e9f593b79d19d609206dbb5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78af5cb8e4e1dac3dafd5c5150291c130619374b57c6dec7cca030d393f6fbe9(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac635aa2448f46f4b8c98c6d4bbb419b40fb40e25d9a2c446573d8914c349522(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae3d7019c034c18a48753412a0f87d45a84c8cb6766052459567bdceabc57cf1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05aa215ad71d661296b64e64d63bd5899e254f6abd88d7b6817e04fa629a877f(
    value: typing.Optional[FinspaceKxClusterSavedownStorageConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__52e0cd3e67b2022f59163817e398120e579504cdd301cf28b89cadba0996a962(
    *,
    memory_reservation: jsii.Number,
    node_count: jsii.Number,
    scaling_group_name: builtins.str,
    cpu: typing.Optional[jsii.Number] = None,
    memory_limit: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc0858400beecd1d504ee95ec0e9d1b5be9e104f6e92a64a920058791f53a502(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e54849151748a5ec204276836d3a4e057000663a3666d45acc32b9bee8165530(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a1104b29b1f80e282b6e5fa7aaebfc6f9ad7252af81d427b1ac2d87ac80b718(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2dda8e190ab3fb10a52c9333c4255b1c00ccf1aaa295005818e7c23e5543b462(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f70960c5e145ed4c3555751dcc16eff9ff3904762484868103beb887cba5655f(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0a89e5d5620c6a531b4c728480678568942743e4e4a7c7917b072ab6c7325b6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__39e389317381cbf0cdeb6ad68177f1a9360a36d990e25033e256ee25e0477bd5(
    value: typing.Optional[FinspaceKxClusterScalingGroupConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4add144f24e4b39400c942d541892a78226596f6290c9516d8fbf0bd78d4b438(
    *,
    tickerplant_log_volumes: typing.Sequence[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f715645f040869ce5a2b85850f4f63390f41c73db823d542aa234b0cdbfffcd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2e82e0895689032099b21db6e4adba21646424c882fac9e4faff70f15a1b41f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1287b1d96cc617584618f6d352afa3382de87aef5dac425bda7ad575e42342a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ffb9a4582ec54e5399ec2e551a1e967fffd1caf9d0037e0537a4c59ed00ff88(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__536f34e721cc8f321d6f39a94d92dbc1c009a73bcf80242b591c52e5b8801ca3(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3cec856a96f57d400ef7b40189d663acb39d445dda0053c18f558cbad14f4bf(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[FinspaceKxClusterTickerplantLogConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eadd0c58b698efb2afb47d7961182a5e4a925af7a5ddf0c22832aacbbeed2fe5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e56e9797b6fe29fac4d39cce1ab5573eb78e640c53f24990e6af119ba2e0540f(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e080d1cccc089daba1c770241a70341572d0c8444778c2992864833106a2b46(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterTickerplantLogConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60835cf26895aa604e7c8865aac2219f3724b8e9fdafe2902a1d1eb9f8b146dd(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e24129e64af4260da57539983682903e8bc7ff9a0dcf85d4f03561ccd1aee134(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b0ba6da0f0ea6dfd8e71125bbe44a4af23fb5c5ac2ca913f4ac0cc0e47798ba(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04f9fecfc8a7cf44ebdc0df21fd8bf83117d10f83c67a5e226a79b19ff5183db(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__593ca06ab09023917b05d5561415fe3333299c507d832ebd1b374ae9b340901e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4eea833951d3050e4a3005b4004279435923903deb42ae0b551e16ed9c8b7740(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, FinspaceKxClusterTimeouts]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca0d78d665aaf677e29cd324ebc1acbc05de62fe0271f547aeefa92c2b1ddef0(
    *,
    ip_address_type: builtins.str,
    security_group_ids: typing.Sequence[builtins.str],
    subnet_ids: typing.Sequence[builtins.str],
    vpc_id: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d680bdee2aea9561a18f77724fc0e4bf74eb977446f1d9d2073b933784a7d30a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a03afd519803a44c40c4c2ec90cef5e6a2305bb1f8e82c8e2b587ce79563384(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37f6281967464c9e92d469b2376dbe242175606cd4ad697575e33fc0c063ee02(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d2da20ddbe409f3a0996c9df96f480cb03fd946ec3d522020cdf003ac2f9bcd(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b64bd40f87c11722d24ed4699fe207c842937147c4adf380f83a94aaa23ce72b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef16ea0a473f4cb6f27009eef317363579136746b8baefadf4508e33a4a2e0f1(
    value: typing.Optional[FinspaceKxClusterVpcConfiguration],
) -> None:
    """Type checking stubs"""
    pass
