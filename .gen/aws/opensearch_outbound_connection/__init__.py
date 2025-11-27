r'''
# `aws_opensearch_outbound_connection`

Refer to the Terraform Registry for docs: [`aws_opensearch_outbound_connection`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection).
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


class OpensearchOutboundConnection(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.opensearchOutboundConnection.OpensearchOutboundConnection",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection aws_opensearch_outbound_connection}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        connection_alias: builtins.str,
        local_domain_info: typing.Union["OpensearchOutboundConnectionLocalDomainInfo", typing.Dict[builtins.str, typing.Any]],
        remote_domain_info: typing.Union["OpensearchOutboundConnectionRemoteDomainInfo", typing.Dict[builtins.str, typing.Any]],
        accept_connection: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        connection_mode: typing.Optional[builtins.str] = None,
        connection_properties: typing.Optional[typing.Union["OpensearchOutboundConnectionConnectionProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        timeouts: typing.Optional[typing.Union["OpensearchOutboundConnectionTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection aws_opensearch_outbound_connection} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param connection_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_alias OpensearchOutboundConnection#connection_alias}.
        :param local_domain_info: local_domain_info block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#local_domain_info OpensearchOutboundConnection#local_domain_info}
        :param remote_domain_info: remote_domain_info block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#remote_domain_info OpensearchOutboundConnection#remote_domain_info}
        :param accept_connection: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#accept_connection OpensearchOutboundConnection#accept_connection}.
        :param connection_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_mode OpensearchOutboundConnection#connection_mode}.
        :param connection_properties: connection_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_properties OpensearchOutboundConnection#connection_properties}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#id OpensearchOutboundConnection#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#timeouts OpensearchOutboundConnection#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ecbbc8f03270958399c63ea2b108d111bd747d81527ff8f27f18b4d92d43ca80)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = OpensearchOutboundConnectionConfig(
            connection_alias=connection_alias,
            local_domain_info=local_domain_info,
            remote_domain_info=remote_domain_info,
            accept_connection=accept_connection,
            connection_mode=connection_mode,
            connection_properties=connection_properties,
            id=id,
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
        '''Generates CDKTF code for importing a OpensearchOutboundConnection resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the OpensearchOutboundConnection to import.
        :param import_from_id: The id of the existing OpensearchOutboundConnection that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the OpensearchOutboundConnection to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e72544e1de9d515625d8fca0616de44a9d868cb788f8f413ad0318ac43f9325)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putConnectionProperties")
    def put_connection_properties(
        self,
        *,
        cross_cluster_search: typing.Optional[typing.Union["OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param cross_cluster_search: cross_cluster_search block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#cross_cluster_search OpensearchOutboundConnection#cross_cluster_search}
        '''
        value = OpensearchOutboundConnectionConnectionProperties(
            cross_cluster_search=cross_cluster_search
        )

        return typing.cast(None, jsii.invoke(self, "putConnectionProperties", [value]))

    @jsii.member(jsii_name="putLocalDomainInfo")
    def put_local_domain_info(
        self,
        *,
        domain_name: builtins.str,
        owner_id: builtins.str,
        region: builtins.str,
    ) -> None:
        '''
        :param domain_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#domain_name OpensearchOutboundConnection#domain_name}.
        :param owner_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#owner_id OpensearchOutboundConnection#owner_id}.
        :param region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#region OpensearchOutboundConnection#region}.
        '''
        value = OpensearchOutboundConnectionLocalDomainInfo(
            domain_name=domain_name, owner_id=owner_id, region=region
        )

        return typing.cast(None, jsii.invoke(self, "putLocalDomainInfo", [value]))

    @jsii.member(jsii_name="putRemoteDomainInfo")
    def put_remote_domain_info(
        self,
        *,
        domain_name: builtins.str,
        owner_id: builtins.str,
        region: builtins.str,
    ) -> None:
        '''
        :param domain_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#domain_name OpensearchOutboundConnection#domain_name}.
        :param owner_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#owner_id OpensearchOutboundConnection#owner_id}.
        :param region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#region OpensearchOutboundConnection#region}.
        '''
        value = OpensearchOutboundConnectionRemoteDomainInfo(
            domain_name=domain_name, owner_id=owner_id, region=region
        )

        return typing.cast(None, jsii.invoke(self, "putRemoteDomainInfo", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#create OpensearchOutboundConnection#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#delete OpensearchOutboundConnection#delete}.
        '''
        value = OpensearchOutboundConnectionTimeouts(create=create, delete=delete)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetAcceptConnection")
    def reset_accept_connection(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAcceptConnection", []))

    @jsii.member(jsii_name="resetConnectionMode")
    def reset_connection_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConnectionMode", []))

    @jsii.member(jsii_name="resetConnectionProperties")
    def reset_connection_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConnectionProperties", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

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
    @jsii.member(jsii_name="connectionProperties")
    def connection_properties(
        self,
    ) -> "OpensearchOutboundConnectionConnectionPropertiesOutputReference":
        return typing.cast("OpensearchOutboundConnectionConnectionPropertiesOutputReference", jsii.get(self, "connectionProperties"))

    @builtins.property
    @jsii.member(jsii_name="connectionStatus")
    def connection_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "connectionStatus"))

    @builtins.property
    @jsii.member(jsii_name="localDomainInfo")
    def local_domain_info(
        self,
    ) -> "OpensearchOutboundConnectionLocalDomainInfoOutputReference":
        return typing.cast("OpensearchOutboundConnectionLocalDomainInfoOutputReference", jsii.get(self, "localDomainInfo"))

    @builtins.property
    @jsii.member(jsii_name="remoteDomainInfo")
    def remote_domain_info(
        self,
    ) -> "OpensearchOutboundConnectionRemoteDomainInfoOutputReference":
        return typing.cast("OpensearchOutboundConnectionRemoteDomainInfoOutputReference", jsii.get(self, "remoteDomainInfo"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "OpensearchOutboundConnectionTimeoutsOutputReference":
        return typing.cast("OpensearchOutboundConnectionTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="acceptConnectionInput")
    def accept_connection_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "acceptConnectionInput"))

    @builtins.property
    @jsii.member(jsii_name="connectionAliasInput")
    def connection_alias_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "connectionAliasInput"))

    @builtins.property
    @jsii.member(jsii_name="connectionModeInput")
    def connection_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "connectionModeInput"))

    @builtins.property
    @jsii.member(jsii_name="connectionPropertiesInput")
    def connection_properties_input(
        self,
    ) -> typing.Optional["OpensearchOutboundConnectionConnectionProperties"]:
        return typing.cast(typing.Optional["OpensearchOutboundConnectionConnectionProperties"], jsii.get(self, "connectionPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="localDomainInfoInput")
    def local_domain_info_input(
        self,
    ) -> typing.Optional["OpensearchOutboundConnectionLocalDomainInfo"]:
        return typing.cast(typing.Optional["OpensearchOutboundConnectionLocalDomainInfo"], jsii.get(self, "localDomainInfoInput"))

    @builtins.property
    @jsii.member(jsii_name="remoteDomainInfoInput")
    def remote_domain_info_input(
        self,
    ) -> typing.Optional["OpensearchOutboundConnectionRemoteDomainInfo"]:
        return typing.cast(typing.Optional["OpensearchOutboundConnectionRemoteDomainInfo"], jsii.get(self, "remoteDomainInfoInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "OpensearchOutboundConnectionTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "OpensearchOutboundConnectionTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="acceptConnection")
    def accept_connection(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "acceptConnection"))

    @accept_connection.setter
    def accept_connection(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bb569a5c901bfb12756e8b7dc168bd96e950a07a6b54144c82761a631ea7c55a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "acceptConnection", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="connectionAlias")
    def connection_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "connectionAlias"))

    @connection_alias.setter
    def connection_alias(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__681468ebdc968e676a58e0074d85454e655e619cc7985dd438989236c5d0866a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "connectionAlias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="connectionMode")
    def connection_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "connectionMode"))

    @connection_mode.setter
    def connection_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3933ce9aa8cd6e70f050ac03a0c0a6cb169dc5f7961124cf89d1fb3cfbcb095c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "connectionMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e433b0d46223b5be8eaad6fd726fa78f7bfe9eb6ca8c3ea4f4710d007e0d0de7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.opensearchOutboundConnection.OpensearchOutboundConnectionConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "connection_alias": "connectionAlias",
        "local_domain_info": "localDomainInfo",
        "remote_domain_info": "remoteDomainInfo",
        "accept_connection": "acceptConnection",
        "connection_mode": "connectionMode",
        "connection_properties": "connectionProperties",
        "id": "id",
        "timeouts": "timeouts",
    },
)
class OpensearchOutboundConnectionConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        connection_alias: builtins.str,
        local_domain_info: typing.Union["OpensearchOutboundConnectionLocalDomainInfo", typing.Dict[builtins.str, typing.Any]],
        remote_domain_info: typing.Union["OpensearchOutboundConnectionRemoteDomainInfo", typing.Dict[builtins.str, typing.Any]],
        accept_connection: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        connection_mode: typing.Optional[builtins.str] = None,
        connection_properties: typing.Optional[typing.Union["OpensearchOutboundConnectionConnectionProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        timeouts: typing.Optional[typing.Union["OpensearchOutboundConnectionTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param connection_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_alias OpensearchOutboundConnection#connection_alias}.
        :param local_domain_info: local_domain_info block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#local_domain_info OpensearchOutboundConnection#local_domain_info}
        :param remote_domain_info: remote_domain_info block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#remote_domain_info OpensearchOutboundConnection#remote_domain_info}
        :param accept_connection: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#accept_connection OpensearchOutboundConnection#accept_connection}.
        :param connection_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_mode OpensearchOutboundConnection#connection_mode}.
        :param connection_properties: connection_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_properties OpensearchOutboundConnection#connection_properties}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#id OpensearchOutboundConnection#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#timeouts OpensearchOutboundConnection#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(local_domain_info, dict):
            local_domain_info = OpensearchOutboundConnectionLocalDomainInfo(**local_domain_info)
        if isinstance(remote_domain_info, dict):
            remote_domain_info = OpensearchOutboundConnectionRemoteDomainInfo(**remote_domain_info)
        if isinstance(connection_properties, dict):
            connection_properties = OpensearchOutboundConnectionConnectionProperties(**connection_properties)
        if isinstance(timeouts, dict):
            timeouts = OpensearchOutboundConnectionTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a940e1cceff581eb0451299c2493089a2bfc4cf48262cabc0088211ea0a3d91f)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument connection_alias", value=connection_alias, expected_type=type_hints["connection_alias"])
            check_type(argname="argument local_domain_info", value=local_domain_info, expected_type=type_hints["local_domain_info"])
            check_type(argname="argument remote_domain_info", value=remote_domain_info, expected_type=type_hints["remote_domain_info"])
            check_type(argname="argument accept_connection", value=accept_connection, expected_type=type_hints["accept_connection"])
            check_type(argname="argument connection_mode", value=connection_mode, expected_type=type_hints["connection_mode"])
            check_type(argname="argument connection_properties", value=connection_properties, expected_type=type_hints["connection_properties"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "connection_alias": connection_alias,
            "local_domain_info": local_domain_info,
            "remote_domain_info": remote_domain_info,
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
        if accept_connection is not None:
            self._values["accept_connection"] = accept_connection
        if connection_mode is not None:
            self._values["connection_mode"] = connection_mode
        if connection_properties is not None:
            self._values["connection_properties"] = connection_properties
        if id is not None:
            self._values["id"] = id
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
    def connection_alias(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_alias OpensearchOutboundConnection#connection_alias}.'''
        result = self._values.get("connection_alias")
        assert result is not None, "Required property 'connection_alias' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def local_domain_info(self) -> "OpensearchOutboundConnectionLocalDomainInfo":
        '''local_domain_info block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#local_domain_info OpensearchOutboundConnection#local_domain_info}
        '''
        result = self._values.get("local_domain_info")
        assert result is not None, "Required property 'local_domain_info' is missing"
        return typing.cast("OpensearchOutboundConnectionLocalDomainInfo", result)

    @builtins.property
    def remote_domain_info(self) -> "OpensearchOutboundConnectionRemoteDomainInfo":
        '''remote_domain_info block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#remote_domain_info OpensearchOutboundConnection#remote_domain_info}
        '''
        result = self._values.get("remote_domain_info")
        assert result is not None, "Required property 'remote_domain_info' is missing"
        return typing.cast("OpensearchOutboundConnectionRemoteDomainInfo", result)

    @builtins.property
    def accept_connection(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#accept_connection OpensearchOutboundConnection#accept_connection}.'''
        result = self._values.get("accept_connection")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def connection_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_mode OpensearchOutboundConnection#connection_mode}.'''
        result = self._values.get("connection_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def connection_properties(
        self,
    ) -> typing.Optional["OpensearchOutboundConnectionConnectionProperties"]:
        '''connection_properties block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#connection_properties OpensearchOutboundConnection#connection_properties}
        '''
        result = self._values.get("connection_properties")
        return typing.cast(typing.Optional["OpensearchOutboundConnectionConnectionProperties"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#id OpensearchOutboundConnection#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["OpensearchOutboundConnectionTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#timeouts OpensearchOutboundConnection#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["OpensearchOutboundConnectionTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "OpensearchOutboundConnectionConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.opensearchOutboundConnection.OpensearchOutboundConnectionConnectionProperties",
    jsii_struct_bases=[],
    name_mapping={"cross_cluster_search": "crossClusterSearch"},
)
class OpensearchOutboundConnectionConnectionProperties:
    def __init__(
        self,
        *,
        cross_cluster_search: typing.Optional[typing.Union["OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param cross_cluster_search: cross_cluster_search block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#cross_cluster_search OpensearchOutboundConnection#cross_cluster_search}
        '''
        if isinstance(cross_cluster_search, dict):
            cross_cluster_search = OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch(**cross_cluster_search)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4013191455edaff2f60ea74fa8f54665e11c6d8d1fb16644f8b64de406b74b41)
            check_type(argname="argument cross_cluster_search", value=cross_cluster_search, expected_type=type_hints["cross_cluster_search"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if cross_cluster_search is not None:
            self._values["cross_cluster_search"] = cross_cluster_search

    @builtins.property
    def cross_cluster_search(
        self,
    ) -> typing.Optional["OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch"]:
        '''cross_cluster_search block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#cross_cluster_search OpensearchOutboundConnection#cross_cluster_search}
        '''
        result = self._values.get("cross_cluster_search")
        return typing.cast(typing.Optional["OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "OpensearchOutboundConnectionConnectionProperties(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.opensearchOutboundConnection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch",
    jsii_struct_bases=[],
    name_mapping={"skip_unavailable": "skipUnavailable"},
)
class OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch:
    def __init__(
        self,
        *,
        skip_unavailable: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param skip_unavailable: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#skip_unavailable OpensearchOutboundConnection#skip_unavailable}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df254dbdb375ac4474b61cee894722634a99cb46cade14fee09ea7f23b1d1025)
            check_type(argname="argument skip_unavailable", value=skip_unavailable, expected_type=type_hints["skip_unavailable"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if skip_unavailable is not None:
            self._values["skip_unavailable"] = skip_unavailable

    @builtins.property
    def skip_unavailable(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#skip_unavailable OpensearchOutboundConnection#skip_unavailable}.'''
        result = self._values.get("skip_unavailable")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.opensearchOutboundConnection.OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__31434dc91e2871b7cd7948f441b4d8bbc18cdeb89a624b696dc0af25b2fca27a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetSkipUnavailable")
    def reset_skip_unavailable(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSkipUnavailable", []))

    @builtins.property
    @jsii.member(jsii_name="skipUnavailableInput")
    def skip_unavailable_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "skipUnavailableInput"))

    @builtins.property
    @jsii.member(jsii_name="skipUnavailable")
    def skip_unavailable(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "skipUnavailable"))

    @skip_unavailable.setter
    def skip_unavailable(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb00b74818be3731dd9afeec15cadf3364078c85d99d5fe3292a24351cad830c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "skipUnavailable", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch]:
        return typing.cast(typing.Optional[OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2e56194b8e395ee8609814adbd261c94804bd299ada910fc0dc7f4f31d850529)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class OpensearchOutboundConnectionConnectionPropertiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.opensearchOutboundConnection.OpensearchOutboundConnectionConnectionPropertiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__79d6bd5662de7b516dc74af6691bac59a2e50685339b0215eb141f52f6531cbd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCrossClusterSearch")
    def put_cross_cluster_search(
        self,
        *,
        skip_unavailable: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param skip_unavailable: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#skip_unavailable OpensearchOutboundConnection#skip_unavailable}.
        '''
        value = OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch(
            skip_unavailable=skip_unavailable
        )

        return typing.cast(None, jsii.invoke(self, "putCrossClusterSearch", [value]))

    @jsii.member(jsii_name="resetCrossClusterSearch")
    def reset_cross_cluster_search(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCrossClusterSearch", []))

    @builtins.property
    @jsii.member(jsii_name="crossClusterSearch")
    def cross_cluster_search(
        self,
    ) -> OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearchOutputReference:
        return typing.cast(OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearchOutputReference, jsii.get(self, "crossClusterSearch"))

    @builtins.property
    @jsii.member(jsii_name="endpoint")
    def endpoint(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endpoint"))

    @builtins.property
    @jsii.member(jsii_name="crossClusterSearchInput")
    def cross_cluster_search_input(
        self,
    ) -> typing.Optional[OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch]:
        return typing.cast(typing.Optional[OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch], jsii.get(self, "crossClusterSearchInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[OpensearchOutboundConnectionConnectionProperties]:
        return typing.cast(typing.Optional[OpensearchOutboundConnectionConnectionProperties], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[OpensearchOutboundConnectionConnectionProperties],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea5732fdb9bba765632e992ebf557ae778fbad5412cf36c704e12c61e7dbf886)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.opensearchOutboundConnection.OpensearchOutboundConnectionLocalDomainInfo",
    jsii_struct_bases=[],
    name_mapping={
        "domain_name": "domainName",
        "owner_id": "ownerId",
        "region": "region",
    },
)
class OpensearchOutboundConnectionLocalDomainInfo:
    def __init__(
        self,
        *,
        domain_name: builtins.str,
        owner_id: builtins.str,
        region: builtins.str,
    ) -> None:
        '''
        :param domain_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#domain_name OpensearchOutboundConnection#domain_name}.
        :param owner_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#owner_id OpensearchOutboundConnection#owner_id}.
        :param region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#region OpensearchOutboundConnection#region}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62a2ecda4b421f981a51538cc06a1678d947ce04260c69881053cbe912e95703)
            check_type(argname="argument domain_name", value=domain_name, expected_type=type_hints["domain_name"])
            check_type(argname="argument owner_id", value=owner_id, expected_type=type_hints["owner_id"])
            check_type(argname="argument region", value=region, expected_type=type_hints["region"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "domain_name": domain_name,
            "owner_id": owner_id,
            "region": region,
        }

    @builtins.property
    def domain_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#domain_name OpensearchOutboundConnection#domain_name}.'''
        result = self._values.get("domain_name")
        assert result is not None, "Required property 'domain_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def owner_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#owner_id OpensearchOutboundConnection#owner_id}.'''
        result = self._values.get("owner_id")
        assert result is not None, "Required property 'owner_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def region(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#region OpensearchOutboundConnection#region}.'''
        result = self._values.get("region")
        assert result is not None, "Required property 'region' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "OpensearchOutboundConnectionLocalDomainInfo(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class OpensearchOutboundConnectionLocalDomainInfoOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.opensearchOutboundConnection.OpensearchOutboundConnectionLocalDomainInfoOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__89600f7a8ab9aba86b3c79a0d66c04dff5666ea47c56265ca1a65bba97da449d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="domainNameInput")
    def domain_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "domainNameInput"))

    @builtins.property
    @jsii.member(jsii_name="ownerIdInput")
    def owner_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ownerIdInput"))

    @builtins.property
    @jsii.member(jsii_name="regionInput")
    def region_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regionInput"))

    @builtins.property
    @jsii.member(jsii_name="domainName")
    def domain_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "domainName"))

    @domain_name.setter
    def domain_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dab902bce2303cb92157f789a15f621052a647a337a46f261fa2d11f20ceda85)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "domainName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ownerId")
    def owner_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ownerId"))

    @owner_id.setter
    def owner_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__372ed84f7373d37166ee9941d01d6c368e114035440f1126dca129e6db39b4be)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ownerId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="region")
    def region(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "region"))

    @region.setter
    def region(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6fb15359fc32b19458510d750fed0a74a75131d1291be64aab447a5b1a88d9b9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "region", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[OpensearchOutboundConnectionLocalDomainInfo]:
        return typing.cast(typing.Optional[OpensearchOutboundConnectionLocalDomainInfo], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[OpensearchOutboundConnectionLocalDomainInfo],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e57cc22bcaad1bbb9c0048a4eea22c234ae3a88c67aa9c1fbdfd7b62cf5fae9f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.opensearchOutboundConnection.OpensearchOutboundConnectionRemoteDomainInfo",
    jsii_struct_bases=[],
    name_mapping={
        "domain_name": "domainName",
        "owner_id": "ownerId",
        "region": "region",
    },
)
class OpensearchOutboundConnectionRemoteDomainInfo:
    def __init__(
        self,
        *,
        domain_name: builtins.str,
        owner_id: builtins.str,
        region: builtins.str,
    ) -> None:
        '''
        :param domain_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#domain_name OpensearchOutboundConnection#domain_name}.
        :param owner_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#owner_id OpensearchOutboundConnection#owner_id}.
        :param region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#region OpensearchOutboundConnection#region}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ef0b7805f5ab94d7aec0b8307fc42ecb9b3635683dacf9805fed0c8462b9f12b)
            check_type(argname="argument domain_name", value=domain_name, expected_type=type_hints["domain_name"])
            check_type(argname="argument owner_id", value=owner_id, expected_type=type_hints["owner_id"])
            check_type(argname="argument region", value=region, expected_type=type_hints["region"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "domain_name": domain_name,
            "owner_id": owner_id,
            "region": region,
        }

    @builtins.property
    def domain_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#domain_name OpensearchOutboundConnection#domain_name}.'''
        result = self._values.get("domain_name")
        assert result is not None, "Required property 'domain_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def owner_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#owner_id OpensearchOutboundConnection#owner_id}.'''
        result = self._values.get("owner_id")
        assert result is not None, "Required property 'owner_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def region(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#region OpensearchOutboundConnection#region}.'''
        result = self._values.get("region")
        assert result is not None, "Required property 'region' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "OpensearchOutboundConnectionRemoteDomainInfo(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class OpensearchOutboundConnectionRemoteDomainInfoOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.opensearchOutboundConnection.OpensearchOutboundConnectionRemoteDomainInfoOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__71279b214cdf5da14386e945df26ac99b43f1b2de8ecabfae2d8a0496d69a5c0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="domainNameInput")
    def domain_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "domainNameInput"))

    @builtins.property
    @jsii.member(jsii_name="ownerIdInput")
    def owner_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ownerIdInput"))

    @builtins.property
    @jsii.member(jsii_name="regionInput")
    def region_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regionInput"))

    @builtins.property
    @jsii.member(jsii_name="domainName")
    def domain_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "domainName"))

    @domain_name.setter
    def domain_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb4aa42343eb29ebc45a431429d31cebd8086d5c20f9ef4f8b0d37134906dccf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "domainName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ownerId")
    def owner_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ownerId"))

    @owner_id.setter
    def owner_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f74bf7cba9d2cb23c490098dccf83ee5fb9e84cf75eb926042a6ddc50700e967)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ownerId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="region")
    def region(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "region"))

    @region.setter
    def region(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__126a8efa27fd2741eebcaf3c38aeb76ff8fccf869d784ee749f0a839d52d8f12)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "region", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[OpensearchOutboundConnectionRemoteDomainInfo]:
        return typing.cast(typing.Optional[OpensearchOutboundConnectionRemoteDomainInfo], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[OpensearchOutboundConnectionRemoteDomainInfo],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f1ecd33c4ea983506cf6cfd34288b5918b3ac87cde867dff5e22470959768716)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.opensearchOutboundConnection.OpensearchOutboundConnectionTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete"},
)
class OpensearchOutboundConnectionTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#create OpensearchOutboundConnection#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#delete OpensearchOutboundConnection#delete}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f420c7bfc670efec65a56df581eae65dd6c79af31ce9999f6322a1f26e1feefc)
            check_type(argname="argument create", value=create, expected_type=type_hints["create"])
            check_type(argname="argument delete", value=delete, expected_type=type_hints["delete"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if create is not None:
            self._values["create"] = create
        if delete is not None:
            self._values["delete"] = delete

    @builtins.property
    def create(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#create OpensearchOutboundConnection#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_outbound_connection#delete OpensearchOutboundConnection#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "OpensearchOutboundConnectionTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class OpensearchOutboundConnectionTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.opensearchOutboundConnection.OpensearchOutboundConnectionTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e0a13e49647c35981eaf92eeb953bbfc56c63edd455575fc3906f2ea83ed6e37)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCreate")
    def reset_create(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCreate", []))

    @jsii.member(jsii_name="resetDelete")
    def reset_delete(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDelete", []))

    @builtins.property
    @jsii.member(jsii_name="createInput")
    def create_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "createInput"))

    @builtins.property
    @jsii.member(jsii_name="deleteInput")
    def delete_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deleteInput"))

    @builtins.property
    @jsii.member(jsii_name="create")
    def create(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "create"))

    @create.setter
    def create(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cadfadc8341919a92d2a5518d21cf265c6f4b4af7256351efe6a0f058d28dbb8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41373139fe308c79f447f376dce7f4ef536a5394eba31109ce2faabb63b552b1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, OpensearchOutboundConnectionTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, OpensearchOutboundConnectionTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, OpensearchOutboundConnectionTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0a5801230abc2ca20d83e92e3b7b88504ab2ff1fb53dc0032e6412f7b13fc6f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "OpensearchOutboundConnection",
    "OpensearchOutboundConnectionConfig",
    "OpensearchOutboundConnectionConnectionProperties",
    "OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch",
    "OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearchOutputReference",
    "OpensearchOutboundConnectionConnectionPropertiesOutputReference",
    "OpensearchOutboundConnectionLocalDomainInfo",
    "OpensearchOutboundConnectionLocalDomainInfoOutputReference",
    "OpensearchOutboundConnectionRemoteDomainInfo",
    "OpensearchOutboundConnectionRemoteDomainInfoOutputReference",
    "OpensearchOutboundConnectionTimeouts",
    "OpensearchOutboundConnectionTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__ecbbc8f03270958399c63ea2b108d111bd747d81527ff8f27f18b4d92d43ca80(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    connection_alias: builtins.str,
    local_domain_info: typing.Union[OpensearchOutboundConnectionLocalDomainInfo, typing.Dict[builtins.str, typing.Any]],
    remote_domain_info: typing.Union[OpensearchOutboundConnectionRemoteDomainInfo, typing.Dict[builtins.str, typing.Any]],
    accept_connection: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    connection_mode: typing.Optional[builtins.str] = None,
    connection_properties: typing.Optional[typing.Union[OpensearchOutboundConnectionConnectionProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    timeouts: typing.Optional[typing.Union[OpensearchOutboundConnectionTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__7e72544e1de9d515625d8fca0616de44a9d868cb788f8f413ad0318ac43f9325(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb569a5c901bfb12756e8b7dc168bd96e950a07a6b54144c82761a631ea7c55a(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__681468ebdc968e676a58e0074d85454e655e619cc7985dd438989236c5d0866a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3933ce9aa8cd6e70f050ac03a0c0a6cb169dc5f7961124cf89d1fb3cfbcb095c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e433b0d46223b5be8eaad6fd726fa78f7bfe9eb6ca8c3ea4f4710d007e0d0de7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a940e1cceff581eb0451299c2493089a2bfc4cf48262cabc0088211ea0a3d91f(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    connection_alias: builtins.str,
    local_domain_info: typing.Union[OpensearchOutboundConnectionLocalDomainInfo, typing.Dict[builtins.str, typing.Any]],
    remote_domain_info: typing.Union[OpensearchOutboundConnectionRemoteDomainInfo, typing.Dict[builtins.str, typing.Any]],
    accept_connection: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    connection_mode: typing.Optional[builtins.str] = None,
    connection_properties: typing.Optional[typing.Union[OpensearchOutboundConnectionConnectionProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    timeouts: typing.Optional[typing.Union[OpensearchOutboundConnectionTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4013191455edaff2f60ea74fa8f54665e11c6d8d1fb16644f8b64de406b74b41(
    *,
    cross_cluster_search: typing.Optional[typing.Union[OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df254dbdb375ac4474b61cee894722634a99cb46cade14fee09ea7f23b1d1025(
    *,
    skip_unavailable: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31434dc91e2871b7cd7948f441b4d8bbc18cdeb89a624b696dc0af25b2fca27a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb00b74818be3731dd9afeec15cadf3364078c85d99d5fe3292a24351cad830c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2e56194b8e395ee8609814adbd261c94804bd299ada910fc0dc7f4f31d850529(
    value: typing.Optional[OpensearchOutboundConnectionConnectionPropertiesCrossClusterSearch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79d6bd5662de7b516dc74af6691bac59a2e50685339b0215eb141f52f6531cbd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea5732fdb9bba765632e992ebf557ae778fbad5412cf36c704e12c61e7dbf886(
    value: typing.Optional[OpensearchOutboundConnectionConnectionProperties],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62a2ecda4b421f981a51538cc06a1678d947ce04260c69881053cbe912e95703(
    *,
    domain_name: builtins.str,
    owner_id: builtins.str,
    region: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__89600f7a8ab9aba86b3c79a0d66c04dff5666ea47c56265ca1a65bba97da449d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dab902bce2303cb92157f789a15f621052a647a337a46f261fa2d11f20ceda85(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__372ed84f7373d37166ee9941d01d6c368e114035440f1126dca129e6db39b4be(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6fb15359fc32b19458510d750fed0a74a75131d1291be64aab447a5b1a88d9b9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e57cc22bcaad1bbb9c0048a4eea22c234ae3a88c67aa9c1fbdfd7b62cf5fae9f(
    value: typing.Optional[OpensearchOutboundConnectionLocalDomainInfo],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef0b7805f5ab94d7aec0b8307fc42ecb9b3635683dacf9805fed0c8462b9f12b(
    *,
    domain_name: builtins.str,
    owner_id: builtins.str,
    region: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__71279b214cdf5da14386e945df26ac99b43f1b2de8ecabfae2d8a0496d69a5c0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb4aa42343eb29ebc45a431429d31cebd8086d5c20f9ef4f8b0d37134906dccf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f74bf7cba9d2cb23c490098dccf83ee5fb9e84cf75eb926042a6ddc50700e967(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__126a8efa27fd2741eebcaf3c38aeb76ff8fccf869d784ee749f0a839d52d8f12(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1ecd33c4ea983506cf6cfd34288b5918b3ac87cde867dff5e22470959768716(
    value: typing.Optional[OpensearchOutboundConnectionRemoteDomainInfo],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f420c7bfc670efec65a56df581eae65dd6c79af31ce9999f6322a1f26e1feefc(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0a13e49647c35981eaf92eeb953bbfc56c63edd455575fc3906f2ea83ed6e37(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cadfadc8341919a92d2a5518d21cf265c6f4b4af7256351efe6a0f058d28dbb8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41373139fe308c79f447f376dce7f4ef536a5394eba31109ce2faabb63b552b1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a5801230abc2ca20d83e92e3b7b88504ab2ff1fb53dc0032e6412f7b13fc6f5(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, OpensearchOutboundConnectionTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
