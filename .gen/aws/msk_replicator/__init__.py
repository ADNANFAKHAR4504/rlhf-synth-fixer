r'''
# `aws_msk_replicator`

Refer to the Terraform Registry for docs: [`aws_msk_replicator`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator).
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


class MskReplicator(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicator",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator aws_msk_replicator}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        kafka_cluster: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["MskReplicatorKafkaCluster", typing.Dict[builtins.str, typing.Any]]]],
        replication_info_list: typing.Union["MskReplicatorReplicationInfoListStruct", typing.Dict[builtins.str, typing.Any]],
        replicator_name: builtins.str,
        service_execution_role_arn: builtins.str,
        description: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["MskReplicatorTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator aws_msk_replicator} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param kafka_cluster: kafka_cluster block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#kafka_cluster MskReplicator#kafka_cluster}
        :param replication_info_list: replication_info_list block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#replication_info_list MskReplicator#replication_info_list}
        :param replicator_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#replicator_name MskReplicator#replicator_name}.
        :param service_execution_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#service_execution_role_arn MskReplicator#service_execution_role_arn}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#description MskReplicator#description}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#id MskReplicator#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#tags MskReplicator#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#tags_all MskReplicator#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#timeouts MskReplicator#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__29f78dff7761c72ad859964c1f8a1d63d7b4c3ca0e162b2e061bb6ae994317a5)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = MskReplicatorConfig(
            kafka_cluster=kafka_cluster,
            replication_info_list=replication_info_list,
            replicator_name=replicator_name,
            service_execution_role_arn=service_execution_role_arn,
            description=description,
            id=id,
            tags=tags,
            tags_all=tags_all,
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
        '''Generates CDKTF code for importing a MskReplicator resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the MskReplicator to import.
        :param import_from_id: The id of the existing MskReplicator that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the MskReplicator to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2694f526d5e8cd15c387066bea408f44da1dc5ba0a918d99322f427aa564333a)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putKafkaCluster")
    def put_kafka_cluster(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["MskReplicatorKafkaCluster", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__abf1873c8e5aaa3cf84a3a1ef3b382c86de83af10355d883a50cac677585bf57)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putKafkaCluster", [value]))

    @jsii.member(jsii_name="putReplicationInfoList")
    def put_replication_info_list(
        self,
        *,
        consumer_group_replication: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["MskReplicatorReplicationInfoListConsumerGroupReplication", typing.Dict[builtins.str, typing.Any]]]],
        source_kafka_cluster_arn: builtins.str,
        target_compression_type: builtins.str,
        target_kafka_cluster_arn: builtins.str,
        topic_replication: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["MskReplicatorReplicationInfoListTopicReplication", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param consumer_group_replication: consumer_group_replication block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_group_replication MskReplicator#consumer_group_replication}
        :param source_kafka_cluster_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#source_kafka_cluster_arn MskReplicator#source_kafka_cluster_arn}.
        :param target_compression_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#target_compression_type MskReplicator#target_compression_type}.
        :param target_kafka_cluster_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#target_kafka_cluster_arn MskReplicator#target_kafka_cluster_arn}.
        :param topic_replication: topic_replication block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topic_replication MskReplicator#topic_replication}
        '''
        value = MskReplicatorReplicationInfoListStruct(
            consumer_group_replication=consumer_group_replication,
            source_kafka_cluster_arn=source_kafka_cluster_arn,
            target_compression_type=target_compression_type,
            target_kafka_cluster_arn=target_kafka_cluster_arn,
            topic_replication=topic_replication,
        )

        return typing.cast(None, jsii.invoke(self, "putReplicationInfoList", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#create MskReplicator#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#delete MskReplicator#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#update MskReplicator#update}.
        '''
        value = MskReplicatorTimeouts(create=create, delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

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
    @jsii.member(jsii_name="currentVersion")
    def current_version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "currentVersion"))

    @builtins.property
    @jsii.member(jsii_name="kafkaCluster")
    def kafka_cluster(self) -> "MskReplicatorKafkaClusterList":
        return typing.cast("MskReplicatorKafkaClusterList", jsii.get(self, "kafkaCluster"))

    @builtins.property
    @jsii.member(jsii_name="replicationInfoList")
    def replication_info_list(
        self,
    ) -> "MskReplicatorReplicationInfoListStructOutputReference":
        return typing.cast("MskReplicatorReplicationInfoListStructOutputReference", jsii.get(self, "replicationInfoList"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "MskReplicatorTimeoutsOutputReference":
        return typing.cast("MskReplicatorTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="kafkaClusterInput")
    def kafka_cluster_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["MskReplicatorKafkaCluster"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["MskReplicatorKafkaCluster"]]], jsii.get(self, "kafkaClusterInput"))

    @builtins.property
    @jsii.member(jsii_name="replicationInfoListInput")
    def replication_info_list_input(
        self,
    ) -> typing.Optional["MskReplicatorReplicationInfoListStruct"]:
        return typing.cast(typing.Optional["MskReplicatorReplicationInfoListStruct"], jsii.get(self, "replicationInfoListInput"))

    @builtins.property
    @jsii.member(jsii_name="replicatorNameInput")
    def replicator_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "replicatorNameInput"))

    @builtins.property
    @jsii.member(jsii_name="serviceExecutionRoleArnInput")
    def service_execution_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "serviceExecutionRoleArnInput"))

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
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "MskReplicatorTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "MskReplicatorTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3cf11a9d47d467c26f677525d4b6a1e769881bcb6f64ddd8a6a9300c6622d23)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__abadf88c2d34aa77158aea722ae53e452551f8e47ffef76fde05446db8097725)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="replicatorName")
    def replicator_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "replicatorName"))

    @replicator_name.setter
    def replicator_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__348169eaafc20cae459fc62a9abe43971f56539487c3a515ef11e3693465e62a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "replicatorName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="serviceExecutionRoleArn")
    def service_execution_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "serviceExecutionRoleArn"))

    @service_execution_role_arn.setter
    def service_execution_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8aece9eefbedb89989e670ead56a3abf780d54c87fe06a1efaab9cc179575dd0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "serviceExecutionRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c552146185fa0a999e8ebf2128c6924e9a2914eb7e25ee1dcca4cf4995a6bfe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5543d58c741bcdbda29fca778bcb313a0723020b4ffec9d2764d8ae5a565d52e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.mskReplicator.MskReplicatorConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "kafka_cluster": "kafkaCluster",
        "replication_info_list": "replicationInfoList",
        "replicator_name": "replicatorName",
        "service_execution_role_arn": "serviceExecutionRoleArn",
        "description": "description",
        "id": "id",
        "tags": "tags",
        "tags_all": "tagsAll",
        "timeouts": "timeouts",
    },
)
class MskReplicatorConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        kafka_cluster: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["MskReplicatorKafkaCluster", typing.Dict[builtins.str, typing.Any]]]],
        replication_info_list: typing.Union["MskReplicatorReplicationInfoListStruct", typing.Dict[builtins.str, typing.Any]],
        replicator_name: builtins.str,
        service_execution_role_arn: builtins.str,
        description: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["MskReplicatorTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param kafka_cluster: kafka_cluster block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#kafka_cluster MskReplicator#kafka_cluster}
        :param replication_info_list: replication_info_list block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#replication_info_list MskReplicator#replication_info_list}
        :param replicator_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#replicator_name MskReplicator#replicator_name}.
        :param service_execution_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#service_execution_role_arn MskReplicator#service_execution_role_arn}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#description MskReplicator#description}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#id MskReplicator#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#tags MskReplicator#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#tags_all MskReplicator#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#timeouts MskReplicator#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(replication_info_list, dict):
            replication_info_list = MskReplicatorReplicationInfoListStruct(**replication_info_list)
        if isinstance(timeouts, dict):
            timeouts = MskReplicatorTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b0e6125a75425aa3504a70d2cc8638d733b70b7134d00c7c5e2ac279ff92aee)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument kafka_cluster", value=kafka_cluster, expected_type=type_hints["kafka_cluster"])
            check_type(argname="argument replication_info_list", value=replication_info_list, expected_type=type_hints["replication_info_list"])
            check_type(argname="argument replicator_name", value=replicator_name, expected_type=type_hints["replicator_name"])
            check_type(argname="argument service_execution_role_arn", value=service_execution_role_arn, expected_type=type_hints["service_execution_role_arn"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "kafka_cluster": kafka_cluster,
            "replication_info_list": replication_info_list,
            "replicator_name": replicator_name,
            "service_execution_role_arn": service_execution_role_arn,
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
        if description is not None:
            self._values["description"] = description
        if id is not None:
            self._values["id"] = id
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
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
    def kafka_cluster(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["MskReplicatorKafkaCluster"]]:
        '''kafka_cluster block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#kafka_cluster MskReplicator#kafka_cluster}
        '''
        result = self._values.get("kafka_cluster")
        assert result is not None, "Required property 'kafka_cluster' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["MskReplicatorKafkaCluster"]], result)

    @builtins.property
    def replication_info_list(self) -> "MskReplicatorReplicationInfoListStruct":
        '''replication_info_list block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#replication_info_list MskReplicator#replication_info_list}
        '''
        result = self._values.get("replication_info_list")
        assert result is not None, "Required property 'replication_info_list' is missing"
        return typing.cast("MskReplicatorReplicationInfoListStruct", result)

    @builtins.property
    def replicator_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#replicator_name MskReplicator#replicator_name}.'''
        result = self._values.get("replicator_name")
        assert result is not None, "Required property 'replicator_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def service_execution_role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#service_execution_role_arn MskReplicator#service_execution_role_arn}.'''
        result = self._values.get("service_execution_role_arn")
        assert result is not None, "Required property 'service_execution_role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#description MskReplicator#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#id MskReplicator#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#tags MskReplicator#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#tags_all MskReplicator#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["MskReplicatorTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#timeouts MskReplicator#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["MskReplicatorTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "MskReplicatorConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.mskReplicator.MskReplicatorKafkaCluster",
    jsii_struct_bases=[],
    name_mapping={"amazon_msk_cluster": "amazonMskCluster", "vpc_config": "vpcConfig"},
)
class MskReplicatorKafkaCluster:
    def __init__(
        self,
        *,
        amazon_msk_cluster: typing.Union["MskReplicatorKafkaClusterAmazonMskCluster", typing.Dict[builtins.str, typing.Any]],
        vpc_config: typing.Union["MskReplicatorKafkaClusterVpcConfig", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param amazon_msk_cluster: amazon_msk_cluster block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#amazon_msk_cluster MskReplicator#amazon_msk_cluster}
        :param vpc_config: vpc_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#vpc_config MskReplicator#vpc_config}
        '''
        if isinstance(amazon_msk_cluster, dict):
            amazon_msk_cluster = MskReplicatorKafkaClusterAmazonMskCluster(**amazon_msk_cluster)
        if isinstance(vpc_config, dict):
            vpc_config = MskReplicatorKafkaClusterVpcConfig(**vpc_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5871b92b7bd12a423495aff343c4e18efa0207e1156411df74c53291313b0600)
            check_type(argname="argument amazon_msk_cluster", value=amazon_msk_cluster, expected_type=type_hints["amazon_msk_cluster"])
            check_type(argname="argument vpc_config", value=vpc_config, expected_type=type_hints["vpc_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "amazon_msk_cluster": amazon_msk_cluster,
            "vpc_config": vpc_config,
        }

    @builtins.property
    def amazon_msk_cluster(self) -> "MskReplicatorKafkaClusterAmazonMskCluster":
        '''amazon_msk_cluster block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#amazon_msk_cluster MskReplicator#amazon_msk_cluster}
        '''
        result = self._values.get("amazon_msk_cluster")
        assert result is not None, "Required property 'amazon_msk_cluster' is missing"
        return typing.cast("MskReplicatorKafkaClusterAmazonMskCluster", result)

    @builtins.property
    def vpc_config(self) -> "MskReplicatorKafkaClusterVpcConfig":
        '''vpc_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#vpc_config MskReplicator#vpc_config}
        '''
        result = self._values.get("vpc_config")
        assert result is not None, "Required property 'vpc_config' is missing"
        return typing.cast("MskReplicatorKafkaClusterVpcConfig", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "MskReplicatorKafkaCluster(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.mskReplicator.MskReplicatorKafkaClusterAmazonMskCluster",
    jsii_struct_bases=[],
    name_mapping={"msk_cluster_arn": "mskClusterArn"},
)
class MskReplicatorKafkaClusterAmazonMskCluster:
    def __init__(self, *, msk_cluster_arn: builtins.str) -> None:
        '''
        :param msk_cluster_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#msk_cluster_arn MskReplicator#msk_cluster_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__abea31d1acb38455a8335a37cb8d58397effe49eaa1309e943cc02e4e7665ef1)
            check_type(argname="argument msk_cluster_arn", value=msk_cluster_arn, expected_type=type_hints["msk_cluster_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "msk_cluster_arn": msk_cluster_arn,
        }

    @builtins.property
    def msk_cluster_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#msk_cluster_arn MskReplicator#msk_cluster_arn}.'''
        result = self._values.get("msk_cluster_arn")
        assert result is not None, "Required property 'msk_cluster_arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "MskReplicatorKafkaClusterAmazonMskCluster(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class MskReplicatorKafkaClusterAmazonMskClusterOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicatorKafkaClusterAmazonMskClusterOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fd5c744d343a9bff9b11e339c2c5a8e7b5047abf5d039805b6b99df9ac13f62a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="mskClusterArnInput")
    def msk_cluster_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "mskClusterArnInput"))

    @builtins.property
    @jsii.member(jsii_name="mskClusterArn")
    def msk_cluster_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mskClusterArn"))

    @msk_cluster_arn.setter
    def msk_cluster_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01cbda76111729fcddeca3e2911e3e90a54191ad349ec0c4ec5b29507d0c1aee)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mskClusterArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[MskReplicatorKafkaClusterAmazonMskCluster]:
        return typing.cast(typing.Optional[MskReplicatorKafkaClusterAmazonMskCluster], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[MskReplicatorKafkaClusterAmazonMskCluster],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__30be58983d86a9d6a21db422b4ea28a835732a9b4a1cae005c48ed40900ea1be)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class MskReplicatorKafkaClusterList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicatorKafkaClusterList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ba9763f2b2c216d3975342fa944072d71e8357113e26e19a31b76cbd1157cec0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "MskReplicatorKafkaClusterOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33dd70d38150dae0b522441fda91ece036eb1edc560e115d0b37cbc59211a08e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("MskReplicatorKafkaClusterOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d75977931eccc31aa67fc8c5384185ca699376f4d9d29bdb2a0508b09ec9282)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3cab1936be12d9aad66aa33b38088edb3b494990422c99b12380b2220f52c5c0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d60f70941eeb823a6afa17f69ba07fda658e1831f5030e3ffa52944952391119)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorKafkaCluster]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorKafkaCluster]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorKafkaCluster]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32dd7582c9269145e375b5acdf4f63f5e4946ce2921bfacac6dcbe76e1da9c58)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class MskReplicatorKafkaClusterOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicatorKafkaClusterOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__46a97710a3149f4389b99ac44938aaacb6b9d6a8c7d4ca561a33e9bea93620a8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putAmazonMskCluster")
    def put_amazon_msk_cluster(self, *, msk_cluster_arn: builtins.str) -> None:
        '''
        :param msk_cluster_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#msk_cluster_arn MskReplicator#msk_cluster_arn}.
        '''
        value = MskReplicatorKafkaClusterAmazonMskCluster(
            msk_cluster_arn=msk_cluster_arn
        )

        return typing.cast(None, jsii.invoke(self, "putAmazonMskCluster", [value]))

    @jsii.member(jsii_name="putVpcConfig")
    def put_vpc_config(
        self,
        *,
        subnet_ids: typing.Sequence[builtins.str],
        security_groups_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param subnet_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#subnet_ids MskReplicator#subnet_ids}.
        :param security_groups_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#security_groups_ids MskReplicator#security_groups_ids}.
        '''
        value = MskReplicatorKafkaClusterVpcConfig(
            subnet_ids=subnet_ids, security_groups_ids=security_groups_ids
        )

        return typing.cast(None, jsii.invoke(self, "putVpcConfig", [value]))

    @builtins.property
    @jsii.member(jsii_name="amazonMskCluster")
    def amazon_msk_cluster(
        self,
    ) -> MskReplicatorKafkaClusterAmazonMskClusterOutputReference:
        return typing.cast(MskReplicatorKafkaClusterAmazonMskClusterOutputReference, jsii.get(self, "amazonMskCluster"))

    @builtins.property
    @jsii.member(jsii_name="vpcConfig")
    def vpc_config(self) -> "MskReplicatorKafkaClusterVpcConfigOutputReference":
        return typing.cast("MskReplicatorKafkaClusterVpcConfigOutputReference", jsii.get(self, "vpcConfig"))

    @builtins.property
    @jsii.member(jsii_name="amazonMskClusterInput")
    def amazon_msk_cluster_input(
        self,
    ) -> typing.Optional[MskReplicatorKafkaClusterAmazonMskCluster]:
        return typing.cast(typing.Optional[MskReplicatorKafkaClusterAmazonMskCluster], jsii.get(self, "amazonMskClusterInput"))

    @builtins.property
    @jsii.member(jsii_name="vpcConfigInput")
    def vpc_config_input(self) -> typing.Optional["MskReplicatorKafkaClusterVpcConfig"]:
        return typing.cast(typing.Optional["MskReplicatorKafkaClusterVpcConfig"], jsii.get(self, "vpcConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorKafkaCluster]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorKafkaCluster]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorKafkaCluster]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08ea586079ea38dd9ae3a772e23774123f9ae4d241d8f54c2da29464d915e4e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.mskReplicator.MskReplicatorKafkaClusterVpcConfig",
    jsii_struct_bases=[],
    name_mapping={
        "subnet_ids": "subnetIds",
        "security_groups_ids": "securityGroupsIds",
    },
)
class MskReplicatorKafkaClusterVpcConfig:
    def __init__(
        self,
        *,
        subnet_ids: typing.Sequence[builtins.str],
        security_groups_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param subnet_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#subnet_ids MskReplicator#subnet_ids}.
        :param security_groups_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#security_groups_ids MskReplicator#security_groups_ids}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c133a7b7fb56d7739ecb34286ff4536dbee1b638b6a5fba54539158cf024d2b)
            check_type(argname="argument subnet_ids", value=subnet_ids, expected_type=type_hints["subnet_ids"])
            check_type(argname="argument security_groups_ids", value=security_groups_ids, expected_type=type_hints["security_groups_ids"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "subnet_ids": subnet_ids,
        }
        if security_groups_ids is not None:
            self._values["security_groups_ids"] = security_groups_ids

    @builtins.property
    def subnet_ids(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#subnet_ids MskReplicator#subnet_ids}.'''
        result = self._values.get("subnet_ids")
        assert result is not None, "Required property 'subnet_ids' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def security_groups_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#security_groups_ids MskReplicator#security_groups_ids}.'''
        result = self._values.get("security_groups_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "MskReplicatorKafkaClusterVpcConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class MskReplicatorKafkaClusterVpcConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicatorKafkaClusterVpcConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1d063c17671fd45a56ae598f2b48f420b8922750443b169bfe135a8484525ccb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetSecurityGroupsIds")
    def reset_security_groups_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityGroupsIds", []))

    @builtins.property
    @jsii.member(jsii_name="securityGroupsIdsInput")
    def security_groups_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "securityGroupsIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetIdsInput")
    def subnet_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "subnetIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="securityGroupsIds")
    def security_groups_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "securityGroupsIds"))

    @security_groups_ids.setter
    def security_groups_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c7a314a1cbec7bd434f86283b7cd41f30321396343cc1e5294ceafcd0ef2a7c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityGroupsIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnetIds")
    def subnet_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "subnetIds"))

    @subnet_ids.setter
    def subnet_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__284bd5b0754231a57bc65b99ca39db13045a0589b27fbab03522023015b5dc0d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnetIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[MskReplicatorKafkaClusterVpcConfig]:
        return typing.cast(typing.Optional[MskReplicatorKafkaClusterVpcConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[MskReplicatorKafkaClusterVpcConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22f7dc01c9c09a59c61a8c54308238f8ee6b9da77480eda2848b4e41a59aa963)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.mskReplicator.MskReplicatorReplicationInfoListConsumerGroupReplication",
    jsii_struct_bases=[],
    name_mapping={
        "consumer_groups_to_replicate": "consumerGroupsToReplicate",
        "consumer_groups_to_exclude": "consumerGroupsToExclude",
        "detect_and_copy_new_consumer_groups": "detectAndCopyNewConsumerGroups",
        "synchronise_consumer_group_offsets": "synchroniseConsumerGroupOffsets",
    },
)
class MskReplicatorReplicationInfoListConsumerGroupReplication:
    def __init__(
        self,
        *,
        consumer_groups_to_replicate: typing.Sequence[builtins.str],
        consumer_groups_to_exclude: typing.Optional[typing.Sequence[builtins.str]] = None,
        detect_and_copy_new_consumer_groups: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        synchronise_consumer_group_offsets: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param consumer_groups_to_replicate: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_groups_to_replicate MskReplicator#consumer_groups_to_replicate}.
        :param consumer_groups_to_exclude: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_groups_to_exclude MskReplicator#consumer_groups_to_exclude}.
        :param detect_and_copy_new_consumer_groups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#detect_and_copy_new_consumer_groups MskReplicator#detect_and_copy_new_consumer_groups}.
        :param synchronise_consumer_group_offsets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#synchronise_consumer_group_offsets MskReplicator#synchronise_consumer_group_offsets}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__38a93794af4ee8897b7bbd27e930c45483130dc67823bd197f9c06427fe70c01)
            check_type(argname="argument consumer_groups_to_replicate", value=consumer_groups_to_replicate, expected_type=type_hints["consumer_groups_to_replicate"])
            check_type(argname="argument consumer_groups_to_exclude", value=consumer_groups_to_exclude, expected_type=type_hints["consumer_groups_to_exclude"])
            check_type(argname="argument detect_and_copy_new_consumer_groups", value=detect_and_copy_new_consumer_groups, expected_type=type_hints["detect_and_copy_new_consumer_groups"])
            check_type(argname="argument synchronise_consumer_group_offsets", value=synchronise_consumer_group_offsets, expected_type=type_hints["synchronise_consumer_group_offsets"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "consumer_groups_to_replicate": consumer_groups_to_replicate,
        }
        if consumer_groups_to_exclude is not None:
            self._values["consumer_groups_to_exclude"] = consumer_groups_to_exclude
        if detect_and_copy_new_consumer_groups is not None:
            self._values["detect_and_copy_new_consumer_groups"] = detect_and_copy_new_consumer_groups
        if synchronise_consumer_group_offsets is not None:
            self._values["synchronise_consumer_group_offsets"] = synchronise_consumer_group_offsets

    @builtins.property
    def consumer_groups_to_replicate(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_groups_to_replicate MskReplicator#consumer_groups_to_replicate}.'''
        result = self._values.get("consumer_groups_to_replicate")
        assert result is not None, "Required property 'consumer_groups_to_replicate' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def consumer_groups_to_exclude(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_groups_to_exclude MskReplicator#consumer_groups_to_exclude}.'''
        result = self._values.get("consumer_groups_to_exclude")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def detect_and_copy_new_consumer_groups(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#detect_and_copy_new_consumer_groups MskReplicator#detect_and_copy_new_consumer_groups}.'''
        result = self._values.get("detect_and_copy_new_consumer_groups")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def synchronise_consumer_group_offsets(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#synchronise_consumer_group_offsets MskReplicator#synchronise_consumer_group_offsets}.'''
        result = self._values.get("synchronise_consumer_group_offsets")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "MskReplicatorReplicationInfoListConsumerGroupReplication(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class MskReplicatorReplicationInfoListConsumerGroupReplicationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicatorReplicationInfoListConsumerGroupReplicationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__857f3a21f60717177b702e56e32e3ab1fc9c42b11878ad638fe98dc8d768e441)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "MskReplicatorReplicationInfoListConsumerGroupReplicationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3bf5b6442a9003e31a5ae542bf157413bcdc66c8adcaf0416ba8196d51791a6)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("MskReplicatorReplicationInfoListConsumerGroupReplicationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb3726da04013ac97360ce910f98facfbf5246fe231a5a20dfe1f77a0f31d032)
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
            type_hints = typing.get_type_hints(_typecheckingstub__477308b91f446b02528354ab8d940d0c13d20e8d0fb50c93f007b2bc0ce3f864)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7600ad3189bc23fb25744d328f09bf7f07d67bbf5d9504f5e3e0da0ee89accf8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorReplicationInfoListConsumerGroupReplication]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorReplicationInfoListConsumerGroupReplication]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorReplicationInfoListConsumerGroupReplication]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32c6fa87a8026d92c62da7569a2b025c8f633b77d813fb619b4d6ed7dd0abc51)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class MskReplicatorReplicationInfoListConsumerGroupReplicationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicatorReplicationInfoListConsumerGroupReplicationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e7d5e5241f62e1a27c2d2b2a0d4ef588d163538c22113175f7ae14222ada9c28)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetConsumerGroupsToExclude")
    def reset_consumer_groups_to_exclude(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConsumerGroupsToExclude", []))

    @jsii.member(jsii_name="resetDetectAndCopyNewConsumerGroups")
    def reset_detect_and_copy_new_consumer_groups(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDetectAndCopyNewConsumerGroups", []))

    @jsii.member(jsii_name="resetSynchroniseConsumerGroupOffsets")
    def reset_synchronise_consumer_group_offsets(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSynchroniseConsumerGroupOffsets", []))

    @builtins.property
    @jsii.member(jsii_name="consumerGroupsToExcludeInput")
    def consumer_groups_to_exclude_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "consumerGroupsToExcludeInput"))

    @builtins.property
    @jsii.member(jsii_name="consumerGroupsToReplicateInput")
    def consumer_groups_to_replicate_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "consumerGroupsToReplicateInput"))

    @builtins.property
    @jsii.member(jsii_name="detectAndCopyNewConsumerGroupsInput")
    def detect_and_copy_new_consumer_groups_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "detectAndCopyNewConsumerGroupsInput"))

    @builtins.property
    @jsii.member(jsii_name="synchroniseConsumerGroupOffsetsInput")
    def synchronise_consumer_group_offsets_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "synchroniseConsumerGroupOffsetsInput"))

    @builtins.property
    @jsii.member(jsii_name="consumerGroupsToExclude")
    def consumer_groups_to_exclude(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "consumerGroupsToExclude"))

    @consumer_groups_to_exclude.setter
    def consumer_groups_to_exclude(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3499082667a5b84770af54b684ce808dfb39ed80b873c95b521a6aa8df268aaa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "consumerGroupsToExclude", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="consumerGroupsToReplicate")
    def consumer_groups_to_replicate(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "consumerGroupsToReplicate"))

    @consumer_groups_to_replicate.setter
    def consumer_groups_to_replicate(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b0978de4f1c48030c2b2a300ee83220fc7922f7612c9fe8b45ca51db659d7fc2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "consumerGroupsToReplicate", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="detectAndCopyNewConsumerGroups")
    def detect_and_copy_new_consumer_groups(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "detectAndCopyNewConsumerGroups"))

    @detect_and_copy_new_consumer_groups.setter
    def detect_and_copy_new_consumer_groups(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7cda520bc8cb7d973ab01ad3bbfac8b09f92c05e6bd80b7cb9d111a43af3251f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "detectAndCopyNewConsumerGroups", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="synchroniseConsumerGroupOffsets")
    def synchronise_consumer_group_offsets(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "synchroniseConsumerGroupOffsets"))

    @synchronise_consumer_group_offsets.setter
    def synchronise_consumer_group_offsets(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b195f88cf68ff6b289c956f9990d74018dbf5e73ab7074ff22a339e8787d3ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "synchroniseConsumerGroupOffsets", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorReplicationInfoListConsumerGroupReplication]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorReplicationInfoListConsumerGroupReplication]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorReplicationInfoListConsumerGroupReplication]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3683ef743882902a997398e4f29c17297de6552a01056e14df0f475f445427e3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.mskReplicator.MskReplicatorReplicationInfoListStruct",
    jsii_struct_bases=[],
    name_mapping={
        "consumer_group_replication": "consumerGroupReplication",
        "source_kafka_cluster_arn": "sourceKafkaClusterArn",
        "target_compression_type": "targetCompressionType",
        "target_kafka_cluster_arn": "targetKafkaClusterArn",
        "topic_replication": "topicReplication",
    },
)
class MskReplicatorReplicationInfoListStruct:
    def __init__(
        self,
        *,
        consumer_group_replication: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[MskReplicatorReplicationInfoListConsumerGroupReplication, typing.Dict[builtins.str, typing.Any]]]],
        source_kafka_cluster_arn: builtins.str,
        target_compression_type: builtins.str,
        target_kafka_cluster_arn: builtins.str,
        topic_replication: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["MskReplicatorReplicationInfoListTopicReplication", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param consumer_group_replication: consumer_group_replication block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_group_replication MskReplicator#consumer_group_replication}
        :param source_kafka_cluster_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#source_kafka_cluster_arn MskReplicator#source_kafka_cluster_arn}.
        :param target_compression_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#target_compression_type MskReplicator#target_compression_type}.
        :param target_kafka_cluster_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#target_kafka_cluster_arn MskReplicator#target_kafka_cluster_arn}.
        :param topic_replication: topic_replication block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topic_replication MskReplicator#topic_replication}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46d19b8092111ef7e1c367d175e3c661e63af03133f5fdf5118b39db5319e8d7)
            check_type(argname="argument consumer_group_replication", value=consumer_group_replication, expected_type=type_hints["consumer_group_replication"])
            check_type(argname="argument source_kafka_cluster_arn", value=source_kafka_cluster_arn, expected_type=type_hints["source_kafka_cluster_arn"])
            check_type(argname="argument target_compression_type", value=target_compression_type, expected_type=type_hints["target_compression_type"])
            check_type(argname="argument target_kafka_cluster_arn", value=target_kafka_cluster_arn, expected_type=type_hints["target_kafka_cluster_arn"])
            check_type(argname="argument topic_replication", value=topic_replication, expected_type=type_hints["topic_replication"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "consumer_group_replication": consumer_group_replication,
            "source_kafka_cluster_arn": source_kafka_cluster_arn,
            "target_compression_type": target_compression_type,
            "target_kafka_cluster_arn": target_kafka_cluster_arn,
            "topic_replication": topic_replication,
        }

    @builtins.property
    def consumer_group_replication(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorReplicationInfoListConsumerGroupReplication]]:
        '''consumer_group_replication block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#consumer_group_replication MskReplicator#consumer_group_replication}
        '''
        result = self._values.get("consumer_group_replication")
        assert result is not None, "Required property 'consumer_group_replication' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorReplicationInfoListConsumerGroupReplication]], result)

    @builtins.property
    def source_kafka_cluster_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#source_kafka_cluster_arn MskReplicator#source_kafka_cluster_arn}.'''
        result = self._values.get("source_kafka_cluster_arn")
        assert result is not None, "Required property 'source_kafka_cluster_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def target_compression_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#target_compression_type MskReplicator#target_compression_type}.'''
        result = self._values.get("target_compression_type")
        assert result is not None, "Required property 'target_compression_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def target_kafka_cluster_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#target_kafka_cluster_arn MskReplicator#target_kafka_cluster_arn}.'''
        result = self._values.get("target_kafka_cluster_arn")
        assert result is not None, "Required property 'target_kafka_cluster_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def topic_replication(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["MskReplicatorReplicationInfoListTopicReplication"]]:
        '''topic_replication block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topic_replication MskReplicator#topic_replication}
        '''
        result = self._values.get("topic_replication")
        assert result is not None, "Required property 'topic_replication' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["MskReplicatorReplicationInfoListTopicReplication"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "MskReplicatorReplicationInfoListStruct(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class MskReplicatorReplicationInfoListStructOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicatorReplicationInfoListStructOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__380207deee7289ca5385934969cb04ebd46578ef5282a646d4a8fae9e9294efb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putConsumerGroupReplication")
    def put_consumer_group_replication(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[MskReplicatorReplicationInfoListConsumerGroupReplication, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__95f2bb823222f3557e1f881c1a30050735481a9ab183ccac5ae3352616402467)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putConsumerGroupReplication", [value]))

    @jsii.member(jsii_name="putTopicReplication")
    def put_topic_replication(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["MskReplicatorReplicationInfoListTopicReplication", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d179c3a7e32b92f79fe82506ea75e5cc092f7a02a8c20ce4b2c4196c04be18e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTopicReplication", [value]))

    @builtins.property
    @jsii.member(jsii_name="consumerGroupReplication")
    def consumer_group_replication(
        self,
    ) -> MskReplicatorReplicationInfoListConsumerGroupReplicationList:
        return typing.cast(MskReplicatorReplicationInfoListConsumerGroupReplicationList, jsii.get(self, "consumerGroupReplication"))

    @builtins.property
    @jsii.member(jsii_name="sourceKafkaClusterAlias")
    def source_kafka_cluster_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceKafkaClusterAlias"))

    @builtins.property
    @jsii.member(jsii_name="targetKafkaClusterAlias")
    def target_kafka_cluster_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "targetKafkaClusterAlias"))

    @builtins.property
    @jsii.member(jsii_name="topicReplication")
    def topic_replication(
        self,
    ) -> "MskReplicatorReplicationInfoListTopicReplicationList":
        return typing.cast("MskReplicatorReplicationInfoListTopicReplicationList", jsii.get(self, "topicReplication"))

    @builtins.property
    @jsii.member(jsii_name="consumerGroupReplicationInput")
    def consumer_group_replication_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorReplicationInfoListConsumerGroupReplication]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorReplicationInfoListConsumerGroupReplication]]], jsii.get(self, "consumerGroupReplicationInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceKafkaClusterArnInput")
    def source_kafka_cluster_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceKafkaClusterArnInput"))

    @builtins.property
    @jsii.member(jsii_name="targetCompressionTypeInput")
    def target_compression_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "targetCompressionTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="targetKafkaClusterArnInput")
    def target_kafka_cluster_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "targetKafkaClusterArnInput"))

    @builtins.property
    @jsii.member(jsii_name="topicReplicationInput")
    def topic_replication_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["MskReplicatorReplicationInfoListTopicReplication"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["MskReplicatorReplicationInfoListTopicReplication"]]], jsii.get(self, "topicReplicationInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceKafkaClusterArn")
    def source_kafka_cluster_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceKafkaClusterArn"))

    @source_kafka_cluster_arn.setter
    def source_kafka_cluster_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d5a4d3bb245c4b9e3901c72f10f4fa2a5a1d458afc3a8cf13f0a0248cf2e564)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sourceKafkaClusterArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="targetCompressionType")
    def target_compression_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "targetCompressionType"))

    @target_compression_type.setter
    def target_compression_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac7fa8a79b54091bfe1e522913d7cbbe093354a636393f963ffec9cb66980b95)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetCompressionType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="targetKafkaClusterArn")
    def target_kafka_cluster_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "targetKafkaClusterArn"))

    @target_kafka_cluster_arn.setter
    def target_kafka_cluster_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4c3fdbe40dea924e771a118d1ef8a9471a34aaa74e75e4fa338825cfa6a80e4f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetKafkaClusterArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[MskReplicatorReplicationInfoListStruct]:
        return typing.cast(typing.Optional[MskReplicatorReplicationInfoListStruct], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[MskReplicatorReplicationInfoListStruct],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d32d56db1a01f102410ae10e5a85f63389858e4a608bc953e2bca400e3fd045)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.mskReplicator.MskReplicatorReplicationInfoListTopicReplication",
    jsii_struct_bases=[],
    name_mapping={
        "topics_to_replicate": "topicsToReplicate",
        "copy_access_control_lists_for_topics": "copyAccessControlListsForTopics",
        "copy_topic_configurations": "copyTopicConfigurations",
        "detect_and_copy_new_topics": "detectAndCopyNewTopics",
        "starting_position": "startingPosition",
        "topic_name_configuration": "topicNameConfiguration",
        "topics_to_exclude": "topicsToExclude",
    },
)
class MskReplicatorReplicationInfoListTopicReplication:
    def __init__(
        self,
        *,
        topics_to_replicate: typing.Sequence[builtins.str],
        copy_access_control_lists_for_topics: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        copy_topic_configurations: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        detect_and_copy_new_topics: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        starting_position: typing.Optional[typing.Union["MskReplicatorReplicationInfoListTopicReplicationStartingPosition", typing.Dict[builtins.str, typing.Any]]] = None,
        topic_name_configuration: typing.Optional[typing.Union["MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        topics_to_exclude: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param topics_to_replicate: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topics_to_replicate MskReplicator#topics_to_replicate}.
        :param copy_access_control_lists_for_topics: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#copy_access_control_lists_for_topics MskReplicator#copy_access_control_lists_for_topics}.
        :param copy_topic_configurations: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#copy_topic_configurations MskReplicator#copy_topic_configurations}.
        :param detect_and_copy_new_topics: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#detect_and_copy_new_topics MskReplicator#detect_and_copy_new_topics}.
        :param starting_position: starting_position block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#starting_position MskReplicator#starting_position}
        :param topic_name_configuration: topic_name_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topic_name_configuration MskReplicator#topic_name_configuration}
        :param topics_to_exclude: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topics_to_exclude MskReplicator#topics_to_exclude}.
        '''
        if isinstance(starting_position, dict):
            starting_position = MskReplicatorReplicationInfoListTopicReplicationStartingPosition(**starting_position)
        if isinstance(topic_name_configuration, dict):
            topic_name_configuration = MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration(**topic_name_configuration)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01ae6fda98d5389b4dead4576eca38a2f71b0603a0c52c48e5d458a317df3b6d)
            check_type(argname="argument topics_to_replicate", value=topics_to_replicate, expected_type=type_hints["topics_to_replicate"])
            check_type(argname="argument copy_access_control_lists_for_topics", value=copy_access_control_lists_for_topics, expected_type=type_hints["copy_access_control_lists_for_topics"])
            check_type(argname="argument copy_topic_configurations", value=copy_topic_configurations, expected_type=type_hints["copy_topic_configurations"])
            check_type(argname="argument detect_and_copy_new_topics", value=detect_and_copy_new_topics, expected_type=type_hints["detect_and_copy_new_topics"])
            check_type(argname="argument starting_position", value=starting_position, expected_type=type_hints["starting_position"])
            check_type(argname="argument topic_name_configuration", value=topic_name_configuration, expected_type=type_hints["topic_name_configuration"])
            check_type(argname="argument topics_to_exclude", value=topics_to_exclude, expected_type=type_hints["topics_to_exclude"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "topics_to_replicate": topics_to_replicate,
        }
        if copy_access_control_lists_for_topics is not None:
            self._values["copy_access_control_lists_for_topics"] = copy_access_control_lists_for_topics
        if copy_topic_configurations is not None:
            self._values["copy_topic_configurations"] = copy_topic_configurations
        if detect_and_copy_new_topics is not None:
            self._values["detect_and_copy_new_topics"] = detect_and_copy_new_topics
        if starting_position is not None:
            self._values["starting_position"] = starting_position
        if topic_name_configuration is not None:
            self._values["topic_name_configuration"] = topic_name_configuration
        if topics_to_exclude is not None:
            self._values["topics_to_exclude"] = topics_to_exclude

    @builtins.property
    def topics_to_replicate(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topics_to_replicate MskReplicator#topics_to_replicate}.'''
        result = self._values.get("topics_to_replicate")
        assert result is not None, "Required property 'topics_to_replicate' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def copy_access_control_lists_for_topics(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#copy_access_control_lists_for_topics MskReplicator#copy_access_control_lists_for_topics}.'''
        result = self._values.get("copy_access_control_lists_for_topics")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def copy_topic_configurations(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#copy_topic_configurations MskReplicator#copy_topic_configurations}.'''
        result = self._values.get("copy_topic_configurations")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def detect_and_copy_new_topics(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#detect_and_copy_new_topics MskReplicator#detect_and_copy_new_topics}.'''
        result = self._values.get("detect_and_copy_new_topics")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def starting_position(
        self,
    ) -> typing.Optional["MskReplicatorReplicationInfoListTopicReplicationStartingPosition"]:
        '''starting_position block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#starting_position MskReplicator#starting_position}
        '''
        result = self._values.get("starting_position")
        return typing.cast(typing.Optional["MskReplicatorReplicationInfoListTopicReplicationStartingPosition"], result)

    @builtins.property
    def topic_name_configuration(
        self,
    ) -> typing.Optional["MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration"]:
        '''topic_name_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topic_name_configuration MskReplicator#topic_name_configuration}
        '''
        result = self._values.get("topic_name_configuration")
        return typing.cast(typing.Optional["MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration"], result)

    @builtins.property
    def topics_to_exclude(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#topics_to_exclude MskReplicator#topics_to_exclude}.'''
        result = self._values.get("topics_to_exclude")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "MskReplicatorReplicationInfoListTopicReplication(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class MskReplicatorReplicationInfoListTopicReplicationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicatorReplicationInfoListTopicReplicationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c24d11ad77bb4482e84ad1b17a30b10501bb336bbe5107f814df5c4a0bf85baa)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "MskReplicatorReplicationInfoListTopicReplicationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24a2cccd539f514e0d22fff3c890f17f482af244bc2c7778f769fff7fcf368e3)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("MskReplicatorReplicationInfoListTopicReplicationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__95d31cecb84cdbbf594b0f140172ea0d7b9801c086e4636dcfffa0589a3df0ed)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f3ab76b672a0864955a56e02ff580c3a97e91576154c1e6a225340ecb14d0a02)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1620e7c833543c170e64fb00fe75f3bf504b73c49938195c9bdcbaae1f50187f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorReplicationInfoListTopicReplication]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorReplicationInfoListTopicReplication]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorReplicationInfoListTopicReplication]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf2b3fef70497448254b3ee742afeea7ef42aa9175c0f0400bce23103cd5b7f3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class MskReplicatorReplicationInfoListTopicReplicationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicatorReplicationInfoListTopicReplicationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e13e88bda5a1eeaed198be3d29385f5801ddc806a2788d6924ab8ce32bdc64a4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putStartingPosition")
    def put_starting_position(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#type MskReplicator#type}.
        '''
        value = MskReplicatorReplicationInfoListTopicReplicationStartingPosition(
            type=type
        )

        return typing.cast(None, jsii.invoke(self, "putStartingPosition", [value]))

    @jsii.member(jsii_name="putTopicNameConfiguration")
    def put_topic_name_configuration(
        self,
        *,
        type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#type MskReplicator#type}.
        '''
        value = MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration(
            type=type
        )

        return typing.cast(None, jsii.invoke(self, "putTopicNameConfiguration", [value]))

    @jsii.member(jsii_name="resetCopyAccessControlListsForTopics")
    def reset_copy_access_control_lists_for_topics(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCopyAccessControlListsForTopics", []))

    @jsii.member(jsii_name="resetCopyTopicConfigurations")
    def reset_copy_topic_configurations(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCopyTopicConfigurations", []))

    @jsii.member(jsii_name="resetDetectAndCopyNewTopics")
    def reset_detect_and_copy_new_topics(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDetectAndCopyNewTopics", []))

    @jsii.member(jsii_name="resetStartingPosition")
    def reset_starting_position(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStartingPosition", []))

    @jsii.member(jsii_name="resetTopicNameConfiguration")
    def reset_topic_name_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTopicNameConfiguration", []))

    @jsii.member(jsii_name="resetTopicsToExclude")
    def reset_topics_to_exclude(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTopicsToExclude", []))

    @builtins.property
    @jsii.member(jsii_name="startingPosition")
    def starting_position(
        self,
    ) -> "MskReplicatorReplicationInfoListTopicReplicationStartingPositionOutputReference":
        return typing.cast("MskReplicatorReplicationInfoListTopicReplicationStartingPositionOutputReference", jsii.get(self, "startingPosition"))

    @builtins.property
    @jsii.member(jsii_name="topicNameConfiguration")
    def topic_name_configuration(
        self,
    ) -> "MskReplicatorReplicationInfoListTopicReplicationTopicNameConfigurationOutputReference":
        return typing.cast("MskReplicatorReplicationInfoListTopicReplicationTopicNameConfigurationOutputReference", jsii.get(self, "topicNameConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="copyAccessControlListsForTopicsInput")
    def copy_access_control_lists_for_topics_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "copyAccessControlListsForTopicsInput"))

    @builtins.property
    @jsii.member(jsii_name="copyTopicConfigurationsInput")
    def copy_topic_configurations_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "copyTopicConfigurationsInput"))

    @builtins.property
    @jsii.member(jsii_name="detectAndCopyNewTopicsInput")
    def detect_and_copy_new_topics_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "detectAndCopyNewTopicsInput"))

    @builtins.property
    @jsii.member(jsii_name="startingPositionInput")
    def starting_position_input(
        self,
    ) -> typing.Optional["MskReplicatorReplicationInfoListTopicReplicationStartingPosition"]:
        return typing.cast(typing.Optional["MskReplicatorReplicationInfoListTopicReplicationStartingPosition"], jsii.get(self, "startingPositionInput"))

    @builtins.property
    @jsii.member(jsii_name="topicNameConfigurationInput")
    def topic_name_configuration_input(
        self,
    ) -> typing.Optional["MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration"]:
        return typing.cast(typing.Optional["MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration"], jsii.get(self, "topicNameConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="topicsToExcludeInput")
    def topics_to_exclude_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "topicsToExcludeInput"))

    @builtins.property
    @jsii.member(jsii_name="topicsToReplicateInput")
    def topics_to_replicate_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "topicsToReplicateInput"))

    @builtins.property
    @jsii.member(jsii_name="copyAccessControlListsForTopics")
    def copy_access_control_lists_for_topics(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "copyAccessControlListsForTopics"))

    @copy_access_control_lists_for_topics.setter
    def copy_access_control_lists_for_topics(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e622fffadd1fb91b4ff8ba63a1a5dfe922ec06b892342336f3723c8ad9a5cc4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "copyAccessControlListsForTopics", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="copyTopicConfigurations")
    def copy_topic_configurations(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "copyTopicConfigurations"))

    @copy_topic_configurations.setter
    def copy_topic_configurations(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c94e804b5d4d1476dcbf82c68246215f62cdc4b9070bdebb1cc7930f9546caa6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "copyTopicConfigurations", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="detectAndCopyNewTopics")
    def detect_and_copy_new_topics(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "detectAndCopyNewTopics"))

    @detect_and_copy_new_topics.setter
    def detect_and_copy_new_topics(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a98f12ef6e694bdc86bf4dc25a38454ae89641e05e35f09a31be11e74847a2dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "detectAndCopyNewTopics", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="topicsToExclude")
    def topics_to_exclude(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "topicsToExclude"))

    @topics_to_exclude.setter
    def topics_to_exclude(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37ab9919998ef6e9eff2ed7b85aaf8a3ce57887c8e9eab6afb53909f92ceadb3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "topicsToExclude", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="topicsToReplicate")
    def topics_to_replicate(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "topicsToReplicate"))

    @topics_to_replicate.setter
    def topics_to_replicate(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d97925ed81ee6c5edcfa6900c9340797cd479bfc51590c0ee3ecefe2c7f3580)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "topicsToReplicate", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorReplicationInfoListTopicReplication]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorReplicationInfoListTopicReplication]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorReplicationInfoListTopicReplication]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__45ac0d9b704dd082a01b7641c2787bb111b8846b3ac525da1e7151e1249bdc38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.mskReplicator.MskReplicatorReplicationInfoListTopicReplicationStartingPosition",
    jsii_struct_bases=[],
    name_mapping={"type": "type"},
)
class MskReplicatorReplicationInfoListTopicReplicationStartingPosition:
    def __init__(self, *, type: typing.Optional[builtins.str] = None) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#type MskReplicator#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__576d7affde7e16b27ec941cfb0281ca1ef564f57b1dd153365327dedb4e83553)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if type is not None:
            self._values["type"] = type

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#type MskReplicator#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "MskReplicatorReplicationInfoListTopicReplicationStartingPosition(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class MskReplicatorReplicationInfoListTopicReplicationStartingPositionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicatorReplicationInfoListTopicReplicationStartingPositionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e1cf98e7553d9eb73acd1b9a585612d86f4b416e2ac5ea7b31921cccea646650)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb16c69db59b0b8f2ca6f1d39dfd98b1bb87be0664282230f881f7b8c4901c56)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[MskReplicatorReplicationInfoListTopicReplicationStartingPosition]:
        return typing.cast(typing.Optional[MskReplicatorReplicationInfoListTopicReplicationStartingPosition], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[MskReplicatorReplicationInfoListTopicReplicationStartingPosition],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6dfe8df54132f820486cc27d0d5d7fd3f3362c525419cdc71e2617a6a692e98)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.mskReplicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration",
    jsii_struct_bases=[],
    name_mapping={"type": "type"},
)
class MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration:
    def __init__(self, *, type: typing.Optional[builtins.str] = None) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#type MskReplicator#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3cf697b356a59c1704a7a5cd2d68db38c15578a3d79e832e1f6e7f88b9d5156b)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if type is not None:
            self._values["type"] = type

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#type MskReplicator#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class MskReplicatorReplicationInfoListTopicReplicationTopicNameConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c8ea86055c66e7e1e512649d9d1062713591d7de6d48998f43dcd37056a3ad4c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a29daf28ccb4fdd99e6b792e6a04f69e5c758573c9c55c5eda67c63fe2bb79a5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration]:
        return typing.cast(typing.Optional[MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c044d4387680c16912ee5f1ce6bae77fc05808f8486d07e02fb85207e704ed23)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.mskReplicator.MskReplicatorTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class MskReplicatorTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#create MskReplicator#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#delete MskReplicator#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#update MskReplicator#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__724527020300fcdb3445766f2cc4d4ba4de9a4b5a262fa19b406ed0856809e37)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#create MskReplicator#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#delete MskReplicator#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#update MskReplicator#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "MskReplicatorTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class MskReplicatorTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.mskReplicator.MskReplicatorTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__330e9b04dc2b33474389bcdd6ca9276547bf827861666e1f3f892517216bd415)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5d0ed742725429293ef51992f51a312c96a9755fa058b63ef27677e59c524079)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e08607218ea2351a9925c0a169d7930428bd3df28a172a4564827a03d8b0126)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6976b3355ac165e3746550cadad3414f94da546e8745fd062644ed5ecf0f1bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7caf9b8431b2165004837543037906da049792495b8146da67fd67e569fe2b05)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "MskReplicator",
    "MskReplicatorConfig",
    "MskReplicatorKafkaCluster",
    "MskReplicatorKafkaClusterAmazonMskCluster",
    "MskReplicatorKafkaClusterAmazonMskClusterOutputReference",
    "MskReplicatorKafkaClusterList",
    "MskReplicatorKafkaClusterOutputReference",
    "MskReplicatorKafkaClusterVpcConfig",
    "MskReplicatorKafkaClusterVpcConfigOutputReference",
    "MskReplicatorReplicationInfoListConsumerGroupReplication",
    "MskReplicatorReplicationInfoListConsumerGroupReplicationList",
    "MskReplicatorReplicationInfoListConsumerGroupReplicationOutputReference",
    "MskReplicatorReplicationInfoListStruct",
    "MskReplicatorReplicationInfoListStructOutputReference",
    "MskReplicatorReplicationInfoListTopicReplication",
    "MskReplicatorReplicationInfoListTopicReplicationList",
    "MskReplicatorReplicationInfoListTopicReplicationOutputReference",
    "MskReplicatorReplicationInfoListTopicReplicationStartingPosition",
    "MskReplicatorReplicationInfoListTopicReplicationStartingPositionOutputReference",
    "MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration",
    "MskReplicatorReplicationInfoListTopicReplicationTopicNameConfigurationOutputReference",
    "MskReplicatorTimeouts",
    "MskReplicatorTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__29f78dff7761c72ad859964c1f8a1d63d7b4c3ca0e162b2e061bb6ae994317a5(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    kafka_cluster: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[MskReplicatorKafkaCluster, typing.Dict[builtins.str, typing.Any]]]],
    replication_info_list: typing.Union[MskReplicatorReplicationInfoListStruct, typing.Dict[builtins.str, typing.Any]],
    replicator_name: builtins.str,
    service_execution_role_arn: builtins.str,
    description: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[MskReplicatorTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__2694f526d5e8cd15c387066bea408f44da1dc5ba0a918d99322f427aa564333a(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__abf1873c8e5aaa3cf84a3a1ef3b382c86de83af10355d883a50cac677585bf57(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[MskReplicatorKafkaCluster, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3cf11a9d47d467c26f677525d4b6a1e769881bcb6f64ddd8a6a9300c6622d23(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__abadf88c2d34aa77158aea722ae53e452551f8e47ffef76fde05446db8097725(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__348169eaafc20cae459fc62a9abe43971f56539487c3a515ef11e3693465e62a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8aece9eefbedb89989e670ead56a3abf780d54c87fe06a1efaab9cc179575dd0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c552146185fa0a999e8ebf2128c6924e9a2914eb7e25ee1dcca4cf4995a6bfe(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5543d58c741bcdbda29fca778bcb313a0723020b4ffec9d2764d8ae5a565d52e(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b0e6125a75425aa3504a70d2cc8638d733b70b7134d00c7c5e2ac279ff92aee(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    kafka_cluster: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[MskReplicatorKafkaCluster, typing.Dict[builtins.str, typing.Any]]]],
    replication_info_list: typing.Union[MskReplicatorReplicationInfoListStruct, typing.Dict[builtins.str, typing.Any]],
    replicator_name: builtins.str,
    service_execution_role_arn: builtins.str,
    description: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[MskReplicatorTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5871b92b7bd12a423495aff343c4e18efa0207e1156411df74c53291313b0600(
    *,
    amazon_msk_cluster: typing.Union[MskReplicatorKafkaClusterAmazonMskCluster, typing.Dict[builtins.str, typing.Any]],
    vpc_config: typing.Union[MskReplicatorKafkaClusterVpcConfig, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__abea31d1acb38455a8335a37cb8d58397effe49eaa1309e943cc02e4e7665ef1(
    *,
    msk_cluster_arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd5c744d343a9bff9b11e339c2c5a8e7b5047abf5d039805b6b99df9ac13f62a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01cbda76111729fcddeca3e2911e3e90a54191ad349ec0c4ec5b29507d0c1aee(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30be58983d86a9d6a21db422b4ea28a835732a9b4a1cae005c48ed40900ea1be(
    value: typing.Optional[MskReplicatorKafkaClusterAmazonMskCluster],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba9763f2b2c216d3975342fa944072d71e8357113e26e19a31b76cbd1157cec0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33dd70d38150dae0b522441fda91ece036eb1edc560e115d0b37cbc59211a08e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d75977931eccc31aa67fc8c5384185ca699376f4d9d29bdb2a0508b09ec9282(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3cab1936be12d9aad66aa33b38088edb3b494990422c99b12380b2220f52c5c0(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d60f70941eeb823a6afa17f69ba07fda658e1831f5030e3ffa52944952391119(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32dd7582c9269145e375b5acdf4f63f5e4946ce2921bfacac6dcbe76e1da9c58(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorKafkaCluster]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46a97710a3149f4389b99ac44938aaacb6b9d6a8c7d4ca561a33e9bea93620a8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08ea586079ea38dd9ae3a772e23774123f9ae4d241d8f54c2da29464d915e4e6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorKafkaCluster]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c133a7b7fb56d7739ecb34286ff4536dbee1b638b6a5fba54539158cf024d2b(
    *,
    subnet_ids: typing.Sequence[builtins.str],
    security_groups_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d063c17671fd45a56ae598f2b48f420b8922750443b169bfe135a8484525ccb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c7a314a1cbec7bd434f86283b7cd41f30321396343cc1e5294ceafcd0ef2a7c(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__284bd5b0754231a57bc65b99ca39db13045a0589b27fbab03522023015b5dc0d(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22f7dc01c9c09a59c61a8c54308238f8ee6b9da77480eda2848b4e41a59aa963(
    value: typing.Optional[MskReplicatorKafkaClusterVpcConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__38a93794af4ee8897b7bbd27e930c45483130dc67823bd197f9c06427fe70c01(
    *,
    consumer_groups_to_replicate: typing.Sequence[builtins.str],
    consumer_groups_to_exclude: typing.Optional[typing.Sequence[builtins.str]] = None,
    detect_and_copy_new_consumer_groups: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    synchronise_consumer_group_offsets: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__857f3a21f60717177b702e56e32e3ab1fc9c42b11878ad638fe98dc8d768e441(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3bf5b6442a9003e31a5ae542bf157413bcdc66c8adcaf0416ba8196d51791a6(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb3726da04013ac97360ce910f98facfbf5246fe231a5a20dfe1f77a0f31d032(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__477308b91f446b02528354ab8d940d0c13d20e8d0fb50c93f007b2bc0ce3f864(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7600ad3189bc23fb25744d328f09bf7f07d67bbf5d9504f5e3e0da0ee89accf8(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32c6fa87a8026d92c62da7569a2b025c8f633b77d813fb619b4d6ed7dd0abc51(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorReplicationInfoListConsumerGroupReplication]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7d5e5241f62e1a27c2d2b2a0d4ef588d163538c22113175f7ae14222ada9c28(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3499082667a5b84770af54b684ce808dfb39ed80b873c95b521a6aa8df268aaa(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0978de4f1c48030c2b2a300ee83220fc7922f7612c9fe8b45ca51db659d7fc2(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7cda520bc8cb7d973ab01ad3bbfac8b09f92c05e6bd80b7cb9d111a43af3251f(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b195f88cf68ff6b289c956f9990d74018dbf5e73ab7074ff22a339e8787d3ec(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3683ef743882902a997398e4f29c17297de6552a01056e14df0f475f445427e3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorReplicationInfoListConsumerGroupReplication]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46d19b8092111ef7e1c367d175e3c661e63af03133f5fdf5118b39db5319e8d7(
    *,
    consumer_group_replication: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[MskReplicatorReplicationInfoListConsumerGroupReplication, typing.Dict[builtins.str, typing.Any]]]],
    source_kafka_cluster_arn: builtins.str,
    target_compression_type: builtins.str,
    target_kafka_cluster_arn: builtins.str,
    topic_replication: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[MskReplicatorReplicationInfoListTopicReplication, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__380207deee7289ca5385934969cb04ebd46578ef5282a646d4a8fae9e9294efb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__95f2bb823222f3557e1f881c1a30050735481a9ab183ccac5ae3352616402467(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[MskReplicatorReplicationInfoListConsumerGroupReplication, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d179c3a7e32b92f79fe82506ea75e5cc092f7a02a8c20ce4b2c4196c04be18e(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[MskReplicatorReplicationInfoListTopicReplication, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d5a4d3bb245c4b9e3901c72f10f4fa2a5a1d458afc3a8cf13f0a0248cf2e564(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac7fa8a79b54091bfe1e522913d7cbbe093354a636393f963ffec9cb66980b95(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c3fdbe40dea924e771a118d1ef8a9471a34aaa74e75e4fa338825cfa6a80e4f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d32d56db1a01f102410ae10e5a85f63389858e4a608bc953e2bca400e3fd045(
    value: typing.Optional[MskReplicatorReplicationInfoListStruct],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01ae6fda98d5389b4dead4576eca38a2f71b0603a0c52c48e5d458a317df3b6d(
    *,
    topics_to_replicate: typing.Sequence[builtins.str],
    copy_access_control_lists_for_topics: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    copy_topic_configurations: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    detect_and_copy_new_topics: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    starting_position: typing.Optional[typing.Union[MskReplicatorReplicationInfoListTopicReplicationStartingPosition, typing.Dict[builtins.str, typing.Any]]] = None,
    topic_name_configuration: typing.Optional[typing.Union[MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    topics_to_exclude: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c24d11ad77bb4482e84ad1b17a30b10501bb336bbe5107f814df5c4a0bf85baa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24a2cccd539f514e0d22fff3c890f17f482af244bc2c7778f769fff7fcf368e3(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__95d31cecb84cdbbf594b0f140172ea0d7b9801c086e4636dcfffa0589a3df0ed(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3ab76b672a0864955a56e02ff580c3a97e91576154c1e6a225340ecb14d0a02(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1620e7c833543c170e64fb00fe75f3bf504b73c49938195c9bdcbaae1f50187f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf2b3fef70497448254b3ee742afeea7ef42aa9175c0f0400bce23103cd5b7f3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[MskReplicatorReplicationInfoListTopicReplication]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e13e88bda5a1eeaed198be3d29385f5801ddc806a2788d6924ab8ce32bdc64a4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e622fffadd1fb91b4ff8ba63a1a5dfe922ec06b892342336f3723c8ad9a5cc4(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c94e804b5d4d1476dcbf82c68246215f62cdc4b9070bdebb1cc7930f9546caa6(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a98f12ef6e694bdc86bf4dc25a38454ae89641e05e35f09a31be11e74847a2dd(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37ab9919998ef6e9eff2ed7b85aaf8a3ce57887c8e9eab6afb53909f92ceadb3(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d97925ed81ee6c5edcfa6900c9340797cd479bfc51590c0ee3ecefe2c7f3580(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__45ac0d9b704dd082a01b7641c2787bb111b8846b3ac525da1e7151e1249bdc38(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorReplicationInfoListTopicReplication]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__576d7affde7e16b27ec941cfb0281ca1ef564f57b1dd153365327dedb4e83553(
    *,
    type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1cf98e7553d9eb73acd1b9a585612d86f4b416e2ac5ea7b31921cccea646650(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb16c69db59b0b8f2ca6f1d39dfd98b1bb87be0664282230f881f7b8c4901c56(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6dfe8df54132f820486cc27d0d5d7fd3f3362c525419cdc71e2617a6a692e98(
    value: typing.Optional[MskReplicatorReplicationInfoListTopicReplicationStartingPosition],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3cf697b356a59c1704a7a5cd2d68db38c15578a3d79e832e1f6e7f88b9d5156b(
    *,
    type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c8ea86055c66e7e1e512649d9d1062713591d7de6d48998f43dcd37056a3ad4c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a29daf28ccb4fdd99e6b792e6a04f69e5c758573c9c55c5eda67c63fe2bb79a5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c044d4387680c16912ee5f1ce6bae77fc05808f8486d07e02fb85207e704ed23(
    value: typing.Optional[MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__724527020300fcdb3445766f2cc4d4ba4de9a4b5a262fa19b406ed0856809e37(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__330e9b04dc2b33474389bcdd6ca9276547bf827861666e1f3f892517216bd415(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d0ed742725429293ef51992f51a312c96a9755fa058b63ef27677e59c524079(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e08607218ea2351a9925c0a169d7930428bd3df28a172a4564827a03d8b0126(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6976b3355ac165e3746550cadad3414f94da546e8745fd062644ed5ecf0f1bd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7caf9b8431b2165004837543037906da049792495b8146da67fd67e569fe2b05(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, MskReplicatorTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
