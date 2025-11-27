r'''
# `aws_cloudwatch_event_endpoint`

Refer to the Terraform Registry for docs: [`aws_cloudwatch_event_endpoint`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint).
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


class CloudwatchEventEndpoint(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpoint",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint aws_cloudwatch_event_endpoint}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        event_bus: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CloudwatchEventEndpointEventBus", typing.Dict[builtins.str, typing.Any]]]],
        name: builtins.str,
        routing_config: typing.Union["CloudwatchEventEndpointRoutingConfig", typing.Dict[builtins.str, typing.Any]],
        description: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        replication_config: typing.Optional[typing.Union["CloudwatchEventEndpointReplicationConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        role_arn: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint aws_cloudwatch_event_endpoint} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param event_bus: event_bus block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#event_bus CloudwatchEventEndpoint#event_bus}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#name CloudwatchEventEndpoint#name}.
        :param routing_config: routing_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#routing_config CloudwatchEventEndpoint#routing_config}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#description CloudwatchEventEndpoint#description}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#id CloudwatchEventEndpoint#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param replication_config: replication_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#replication_config CloudwatchEventEndpoint#replication_config}
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#role_arn CloudwatchEventEndpoint#role_arn}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6f927c5861b038a1714a28e347e186d66027164b691b7423cd6d3b2f1f60460a)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = CloudwatchEventEndpointConfig(
            event_bus=event_bus,
            name=name,
            routing_config=routing_config,
            description=description,
            id=id,
            replication_config=replication_config,
            role_arn=role_arn,
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
        '''Generates CDKTF code for importing a CloudwatchEventEndpoint resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the CloudwatchEventEndpoint to import.
        :param import_from_id: The id of the existing CloudwatchEventEndpoint that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the CloudwatchEventEndpoint to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__00ae5ffe7b4fd7a627b6ace50b4c549509153fbd5e4d760cfbe3a9ba05126933)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putEventBus")
    def put_event_bus(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CloudwatchEventEndpointEventBus", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07bfc10f4d39d573ab7214aa271ce1f4f3d647812e7acc62ebb8472bb25ea740)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEventBus", [value]))

    @jsii.member(jsii_name="putReplicationConfig")
    def put_replication_config(
        self,
        *,
        state: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#state CloudwatchEventEndpoint#state}.
        '''
        value = CloudwatchEventEndpointReplicationConfig(state=state)

        return typing.cast(None, jsii.invoke(self, "putReplicationConfig", [value]))

    @jsii.member(jsii_name="putRoutingConfig")
    def put_routing_config(
        self,
        *,
        failover_config: typing.Union["CloudwatchEventEndpointRoutingConfigFailoverConfig", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param failover_config: failover_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#failover_config CloudwatchEventEndpoint#failover_config}
        '''
        value = CloudwatchEventEndpointRoutingConfig(failover_config=failover_config)

        return typing.cast(None, jsii.invoke(self, "putRoutingConfig", [value]))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetReplicationConfig")
    def reset_replication_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReplicationConfig", []))

    @jsii.member(jsii_name="resetRoleArn")
    def reset_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoleArn", []))

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
    @jsii.member(jsii_name="endpointUrl")
    def endpoint_url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endpointUrl"))

    @builtins.property
    @jsii.member(jsii_name="eventBus")
    def event_bus(self) -> "CloudwatchEventEndpointEventBusList":
        return typing.cast("CloudwatchEventEndpointEventBusList", jsii.get(self, "eventBus"))

    @builtins.property
    @jsii.member(jsii_name="replicationConfig")
    def replication_config(
        self,
    ) -> "CloudwatchEventEndpointReplicationConfigOutputReference":
        return typing.cast("CloudwatchEventEndpointReplicationConfigOutputReference", jsii.get(self, "replicationConfig"))

    @builtins.property
    @jsii.member(jsii_name="routingConfig")
    def routing_config(self) -> "CloudwatchEventEndpointRoutingConfigOutputReference":
        return typing.cast("CloudwatchEventEndpointRoutingConfigOutputReference", jsii.get(self, "routingConfig"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="eventBusInput")
    def event_bus_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CloudwatchEventEndpointEventBus"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CloudwatchEventEndpointEventBus"]]], jsii.get(self, "eventBusInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="replicationConfigInput")
    def replication_config_input(
        self,
    ) -> typing.Optional["CloudwatchEventEndpointReplicationConfig"]:
        return typing.cast(typing.Optional["CloudwatchEventEndpointReplicationConfig"], jsii.get(self, "replicationConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="routingConfigInput")
    def routing_config_input(
        self,
    ) -> typing.Optional["CloudwatchEventEndpointRoutingConfig"]:
        return typing.cast(typing.Optional["CloudwatchEventEndpointRoutingConfig"], jsii.get(self, "routingConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5eea07cac70cb1be90df98d346b4e9cf9498ffa1fbca77cd9ffdc9384c1efbe2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a5371f2ee6629ccc548de48cd5a5ceb65dce56d83008a2d43d6a76e14009fe1b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__593027a5253fc086d32b817b991f39311276997cc9b70a17bab15196062a9cc9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f0447f80e53c4ec16c11052271d721a42bee78af22da2cc226b034c5ac8221cd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "event_bus": "eventBus",
        "name": "name",
        "routing_config": "routingConfig",
        "description": "description",
        "id": "id",
        "replication_config": "replicationConfig",
        "role_arn": "roleArn",
    },
)
class CloudwatchEventEndpointConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        event_bus: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CloudwatchEventEndpointEventBus", typing.Dict[builtins.str, typing.Any]]]],
        name: builtins.str,
        routing_config: typing.Union["CloudwatchEventEndpointRoutingConfig", typing.Dict[builtins.str, typing.Any]],
        description: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        replication_config: typing.Optional[typing.Union["CloudwatchEventEndpointReplicationConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        role_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param event_bus: event_bus block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#event_bus CloudwatchEventEndpoint#event_bus}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#name CloudwatchEventEndpoint#name}.
        :param routing_config: routing_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#routing_config CloudwatchEventEndpoint#routing_config}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#description CloudwatchEventEndpoint#description}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#id CloudwatchEventEndpoint#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param replication_config: replication_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#replication_config CloudwatchEventEndpoint#replication_config}
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#role_arn CloudwatchEventEndpoint#role_arn}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(routing_config, dict):
            routing_config = CloudwatchEventEndpointRoutingConfig(**routing_config)
        if isinstance(replication_config, dict):
            replication_config = CloudwatchEventEndpointReplicationConfig(**replication_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5343819da6bb20722a5910f927a7b5a1b1a0d75fb7eeeb3936d8e53bae61e437)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument event_bus", value=event_bus, expected_type=type_hints["event_bus"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument routing_config", value=routing_config, expected_type=type_hints["routing_config"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument replication_config", value=replication_config, expected_type=type_hints["replication_config"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "event_bus": event_bus,
            "name": name,
            "routing_config": routing_config,
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
        if replication_config is not None:
            self._values["replication_config"] = replication_config
        if role_arn is not None:
            self._values["role_arn"] = role_arn

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
    def event_bus(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CloudwatchEventEndpointEventBus"]]:
        '''event_bus block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#event_bus CloudwatchEventEndpoint#event_bus}
        '''
        result = self._values.get("event_bus")
        assert result is not None, "Required property 'event_bus' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CloudwatchEventEndpointEventBus"]], result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#name CloudwatchEventEndpoint#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def routing_config(self) -> "CloudwatchEventEndpointRoutingConfig":
        '''routing_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#routing_config CloudwatchEventEndpoint#routing_config}
        '''
        result = self._values.get("routing_config")
        assert result is not None, "Required property 'routing_config' is missing"
        return typing.cast("CloudwatchEventEndpointRoutingConfig", result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#description CloudwatchEventEndpoint#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#id CloudwatchEventEndpoint#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def replication_config(
        self,
    ) -> typing.Optional["CloudwatchEventEndpointReplicationConfig"]:
        '''replication_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#replication_config CloudwatchEventEndpoint#replication_config}
        '''
        result = self._values.get("replication_config")
        return typing.cast(typing.Optional["CloudwatchEventEndpointReplicationConfig"], result)

    @builtins.property
    def role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#role_arn CloudwatchEventEndpoint#role_arn}.'''
        result = self._values.get("role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CloudwatchEventEndpointConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointEventBus",
    jsii_struct_bases=[],
    name_mapping={"event_bus_arn": "eventBusArn"},
)
class CloudwatchEventEndpointEventBus:
    def __init__(self, *, event_bus_arn: builtins.str) -> None:
        '''
        :param event_bus_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#event_bus_arn CloudwatchEventEndpoint#event_bus_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f02793224f69140a13413a61e55b47f5f4ea3afd6be363de92d81f95c0a84aae)
            check_type(argname="argument event_bus_arn", value=event_bus_arn, expected_type=type_hints["event_bus_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "event_bus_arn": event_bus_arn,
        }

    @builtins.property
    def event_bus_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#event_bus_arn CloudwatchEventEndpoint#event_bus_arn}.'''
        result = self._values.get("event_bus_arn")
        assert result is not None, "Required property 'event_bus_arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CloudwatchEventEndpointEventBus(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CloudwatchEventEndpointEventBusList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointEventBusList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d758c15752a41b56bfb237d86d4ec1ac51ac9f80f1af9c7ffeddcd5fb1684bde)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CloudwatchEventEndpointEventBusOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6f0317392d49c92c9e58110f756f1647b6cbb368d4e1a5edf8fe605bbe0ce17a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CloudwatchEventEndpointEventBusOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__378d07d70d94588ddffb34d75ffab85a782ec79ca1dcb45ffd9fb53df6db6474)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f8ff73b5f1f1f990cee368596fa10f103d6b2d81c676a2ec0092d4a414c8a919)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a0aad2f8d16b8683057d5fbc0668070fd5881d33a0c68d3887bb3c5ca2e7ee3a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CloudwatchEventEndpointEventBus]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CloudwatchEventEndpointEventBus]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CloudwatchEventEndpointEventBus]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__519d0c3568292b425da348edeb5c00c81c66084da6a76ca51dff3c271eec374c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CloudwatchEventEndpointEventBusOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointEventBusOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__61524ea6892adaac90a4b4b667e8b590185a7b26d3f1f3979bb72fc2b1e77024)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="eventBusArnInput")
    def event_bus_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "eventBusArnInput"))

    @builtins.property
    @jsii.member(jsii_name="eventBusArn")
    def event_bus_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "eventBusArn"))

    @event_bus_arn.setter
    def event_bus_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9f0bc48d6e1739f8820dd8292032f43db41b3ee680e3db5aba54545bb503a65)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "eventBusArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CloudwatchEventEndpointEventBus]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CloudwatchEventEndpointEventBus]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CloudwatchEventEndpointEventBus]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b4d57393d2b264909e4d8d759e6ead9020e4f0505bfe64ddea092d6fdca495e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointReplicationConfig",
    jsii_struct_bases=[],
    name_mapping={"state": "state"},
)
class CloudwatchEventEndpointReplicationConfig:
    def __init__(self, *, state: typing.Optional[builtins.str] = None) -> None:
        '''
        :param state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#state CloudwatchEventEndpoint#state}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d7a94812d50b665402df5dffbf60786dee886f459e910477724bfeb6c04b935)
            check_type(argname="argument state", value=state, expected_type=type_hints["state"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if state is not None:
            self._values["state"] = state

    @builtins.property
    def state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#state CloudwatchEventEndpoint#state}.'''
        result = self._values.get("state")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CloudwatchEventEndpointReplicationConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CloudwatchEventEndpointReplicationConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointReplicationConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c39e4cf7731fd2fabf2ebb116d138386cacd5539d99a3f258b837056abe60e6d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetState")
    def reset_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetState", []))

    @builtins.property
    @jsii.member(jsii_name="stateInput")
    def state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "stateInput"))

    @builtins.property
    @jsii.member(jsii_name="state")
    def state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "state"))

    @state.setter
    def state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61629d9dbd439acdc23ecd338016fae4f63366c73167c8dc87165fe3b7959382)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "state", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CloudwatchEventEndpointReplicationConfig]:
        return typing.cast(typing.Optional[CloudwatchEventEndpointReplicationConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CloudwatchEventEndpointReplicationConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df67f73d886c6d3864aa2aa6e2779876a8e9cbd2a70a184dce270c32492c4d1d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfig",
    jsii_struct_bases=[],
    name_mapping={"failover_config": "failoverConfig"},
)
class CloudwatchEventEndpointRoutingConfig:
    def __init__(
        self,
        *,
        failover_config: typing.Union["CloudwatchEventEndpointRoutingConfigFailoverConfig", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param failover_config: failover_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#failover_config CloudwatchEventEndpoint#failover_config}
        '''
        if isinstance(failover_config, dict):
            failover_config = CloudwatchEventEndpointRoutingConfigFailoverConfig(**failover_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bbedf9051d0cc547105be01dbb70c53377860d07544ff8e7f0d888a1f6fa1f57)
            check_type(argname="argument failover_config", value=failover_config, expected_type=type_hints["failover_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "failover_config": failover_config,
        }

    @builtins.property
    def failover_config(self) -> "CloudwatchEventEndpointRoutingConfigFailoverConfig":
        '''failover_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#failover_config CloudwatchEventEndpoint#failover_config}
        '''
        result = self._values.get("failover_config")
        assert result is not None, "Required property 'failover_config' is missing"
        return typing.cast("CloudwatchEventEndpointRoutingConfigFailoverConfig", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CloudwatchEventEndpointRoutingConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfig",
    jsii_struct_bases=[],
    name_mapping={"primary": "primary", "secondary": "secondary"},
)
class CloudwatchEventEndpointRoutingConfigFailoverConfig:
    def __init__(
        self,
        *,
        primary: typing.Union["CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary", typing.Dict[builtins.str, typing.Any]],
        secondary: typing.Union["CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param primary: primary block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#primary CloudwatchEventEndpoint#primary}
        :param secondary: secondary block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#secondary CloudwatchEventEndpoint#secondary}
        '''
        if isinstance(primary, dict):
            primary = CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary(**primary)
        if isinstance(secondary, dict):
            secondary = CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary(**secondary)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b75383db79eef00b8a55a8bc18b1d4e07850aaee398c6c5eae72fe3cb9273617)
            check_type(argname="argument primary", value=primary, expected_type=type_hints["primary"])
            check_type(argname="argument secondary", value=secondary, expected_type=type_hints["secondary"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "primary": primary,
            "secondary": secondary,
        }

    @builtins.property
    def primary(self) -> "CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary":
        '''primary block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#primary CloudwatchEventEndpoint#primary}
        '''
        result = self._values.get("primary")
        assert result is not None, "Required property 'primary' is missing"
        return typing.cast("CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary", result)

    @builtins.property
    def secondary(
        self,
    ) -> "CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary":
        '''secondary block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#secondary CloudwatchEventEndpoint#secondary}
        '''
        result = self._values.get("secondary")
        assert result is not None, "Required property 'secondary' is missing"
        return typing.cast("CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CloudwatchEventEndpointRoutingConfigFailoverConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CloudwatchEventEndpointRoutingConfigFailoverConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d0c965b8babe0ab4d6c0600be9fb4ae98b471998134a75d53549f852eefa9c29)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putPrimary")
    def put_primary(
        self,
        *,
        health_check: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param health_check: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#health_check CloudwatchEventEndpoint#health_check}.
        '''
        value = CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary(
            health_check=health_check
        )

        return typing.cast(None, jsii.invoke(self, "putPrimary", [value]))

    @jsii.member(jsii_name="putSecondary")
    def put_secondary(self, *, route: typing.Optional[builtins.str] = None) -> None:
        '''
        :param route: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#route CloudwatchEventEndpoint#route}.
        '''
        value = CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary(
            route=route
        )

        return typing.cast(None, jsii.invoke(self, "putSecondary", [value]))

    @builtins.property
    @jsii.member(jsii_name="primary")
    def primary(
        self,
    ) -> "CloudwatchEventEndpointRoutingConfigFailoverConfigPrimaryOutputReference":
        return typing.cast("CloudwatchEventEndpointRoutingConfigFailoverConfigPrimaryOutputReference", jsii.get(self, "primary"))

    @builtins.property
    @jsii.member(jsii_name="secondary")
    def secondary(
        self,
    ) -> "CloudwatchEventEndpointRoutingConfigFailoverConfigSecondaryOutputReference":
        return typing.cast("CloudwatchEventEndpointRoutingConfigFailoverConfigSecondaryOutputReference", jsii.get(self, "secondary"))

    @builtins.property
    @jsii.member(jsii_name="primaryInput")
    def primary_input(
        self,
    ) -> typing.Optional["CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary"]:
        return typing.cast(typing.Optional["CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary"], jsii.get(self, "primaryInput"))

    @builtins.property
    @jsii.member(jsii_name="secondaryInput")
    def secondary_input(
        self,
    ) -> typing.Optional["CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary"]:
        return typing.cast(typing.Optional["CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary"], jsii.get(self, "secondaryInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfig]:
        return typing.cast(typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9a2ded35c4b80761c06295c7a5542f61901c7406777fa3db310aa437fc828f40)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary",
    jsii_struct_bases=[],
    name_mapping={"health_check": "healthCheck"},
)
class CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary:
    def __init__(self, *, health_check: typing.Optional[builtins.str] = None) -> None:
        '''
        :param health_check: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#health_check CloudwatchEventEndpoint#health_check}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a33d750375e1a5b02cb61331d65676ff1283d991246081c936398c9a8810be2e)
            check_type(argname="argument health_check", value=health_check, expected_type=type_hints["health_check"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if health_check is not None:
            self._values["health_check"] = health_check

    @builtins.property
    def health_check(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#health_check CloudwatchEventEndpoint#health_check}.'''
        result = self._values.get("health_check")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CloudwatchEventEndpointRoutingConfigFailoverConfigPrimaryOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimaryOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6ea46248e03fba8b82f38d0ae96e2ab4c064c487b4edec3ee5de4f79dd868214)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetHealthCheck")
    def reset_health_check(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHealthCheck", []))

    @builtins.property
    @jsii.member(jsii_name="healthCheckInput")
    def health_check_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "healthCheckInput"))

    @builtins.property
    @jsii.member(jsii_name="healthCheck")
    def health_check(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "healthCheck"))

    @health_check.setter
    def health_check(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1be6c3dbb74b10242c770e24c57cb2163bd267e0e3d181d63066c94083e5e427)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "healthCheck", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary]:
        return typing.cast(typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0700110f9c106251732a84e106ec007c9c0c3c487fb76b70303823d689d9eac7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary",
    jsii_struct_bases=[],
    name_mapping={"route": "route"},
)
class CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary:
    def __init__(self, *, route: typing.Optional[builtins.str] = None) -> None:
        '''
        :param route: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#route CloudwatchEventEndpoint#route}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7fea59f601b8c77b119b3eeba5cd8bb526dee53167cb569f1ae5621f395cc39)
            check_type(argname="argument route", value=route, expected_type=type_hints["route"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if route is not None:
            self._values["route"] = route

    @builtins.property
    def route(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#route CloudwatchEventEndpoint#route}.'''
        result = self._values.get("route")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CloudwatchEventEndpointRoutingConfigFailoverConfigSecondaryOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondaryOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4a3894eace7e1887466229bc1860b44b254db206ab48ebfa16406e81b914f677)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetRoute")
    def reset_route(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoute", []))

    @builtins.property
    @jsii.member(jsii_name="routeInput")
    def route_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routeInput"))

    @builtins.property
    @jsii.member(jsii_name="route")
    def route(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "route"))

    @route.setter
    def route(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cbd04c4aa8cbfdcfbdd76ec56d9d8a632449481fcf9de22e4b5693277baed343)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "route", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary]:
        return typing.cast(typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc80539b4add23b0a9ea85c595ec17d8d900c00755286695c0c3f150cf9e760e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CloudwatchEventEndpointRoutingConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1b90ef89c0bfaaf433c932068bce03d8bc0f36046f0992c8da69289203a225d6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putFailoverConfig")
    def put_failover_config(
        self,
        *,
        primary: typing.Union[CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary, typing.Dict[builtins.str, typing.Any]],
        secondary: typing.Union[CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary, typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param primary: primary block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#primary CloudwatchEventEndpoint#primary}
        :param secondary: secondary block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_endpoint#secondary CloudwatchEventEndpoint#secondary}
        '''
        value = CloudwatchEventEndpointRoutingConfigFailoverConfig(
            primary=primary, secondary=secondary
        )

        return typing.cast(None, jsii.invoke(self, "putFailoverConfig", [value]))

    @builtins.property
    @jsii.member(jsii_name="failoverConfig")
    def failover_config(
        self,
    ) -> CloudwatchEventEndpointRoutingConfigFailoverConfigOutputReference:
        return typing.cast(CloudwatchEventEndpointRoutingConfigFailoverConfigOutputReference, jsii.get(self, "failoverConfig"))

    @builtins.property
    @jsii.member(jsii_name="failoverConfigInput")
    def failover_config_input(
        self,
    ) -> typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfig]:
        return typing.cast(typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfig], jsii.get(self, "failoverConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CloudwatchEventEndpointRoutingConfig]:
        return typing.cast(typing.Optional[CloudwatchEventEndpointRoutingConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CloudwatchEventEndpointRoutingConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6c8c8b2f4e6d8750e162c1567c5cb8cfede5884e39c3915584675850e10f3a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "CloudwatchEventEndpoint",
    "CloudwatchEventEndpointConfig",
    "CloudwatchEventEndpointEventBus",
    "CloudwatchEventEndpointEventBusList",
    "CloudwatchEventEndpointEventBusOutputReference",
    "CloudwatchEventEndpointReplicationConfig",
    "CloudwatchEventEndpointReplicationConfigOutputReference",
    "CloudwatchEventEndpointRoutingConfig",
    "CloudwatchEventEndpointRoutingConfigFailoverConfig",
    "CloudwatchEventEndpointRoutingConfigFailoverConfigOutputReference",
    "CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary",
    "CloudwatchEventEndpointRoutingConfigFailoverConfigPrimaryOutputReference",
    "CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary",
    "CloudwatchEventEndpointRoutingConfigFailoverConfigSecondaryOutputReference",
    "CloudwatchEventEndpointRoutingConfigOutputReference",
]

publication.publish()

def _typecheckingstub__6f927c5861b038a1714a28e347e186d66027164b691b7423cd6d3b2f1f60460a(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    event_bus: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CloudwatchEventEndpointEventBus, typing.Dict[builtins.str, typing.Any]]]],
    name: builtins.str,
    routing_config: typing.Union[CloudwatchEventEndpointRoutingConfig, typing.Dict[builtins.str, typing.Any]],
    description: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    replication_config: typing.Optional[typing.Union[CloudwatchEventEndpointReplicationConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    role_arn: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__00ae5ffe7b4fd7a627b6ace50b4c549509153fbd5e4d760cfbe3a9ba05126933(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07bfc10f4d39d573ab7214aa271ce1f4f3d647812e7acc62ebb8472bb25ea740(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CloudwatchEventEndpointEventBus, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5eea07cac70cb1be90df98d346b4e9cf9498ffa1fbca77cd9ffdc9384c1efbe2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5371f2ee6629ccc548de48cd5a5ceb65dce56d83008a2d43d6a76e14009fe1b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__593027a5253fc086d32b817b991f39311276997cc9b70a17bab15196062a9cc9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0447f80e53c4ec16c11052271d721a42bee78af22da2cc226b034c5ac8221cd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5343819da6bb20722a5910f927a7b5a1b1a0d75fb7eeeb3936d8e53bae61e437(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    event_bus: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CloudwatchEventEndpointEventBus, typing.Dict[builtins.str, typing.Any]]]],
    name: builtins.str,
    routing_config: typing.Union[CloudwatchEventEndpointRoutingConfig, typing.Dict[builtins.str, typing.Any]],
    description: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    replication_config: typing.Optional[typing.Union[CloudwatchEventEndpointReplicationConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    role_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f02793224f69140a13413a61e55b47f5f4ea3afd6be363de92d81f95c0a84aae(
    *,
    event_bus_arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d758c15752a41b56bfb237d86d4ec1ac51ac9f80f1af9c7ffeddcd5fb1684bde(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f0317392d49c92c9e58110f756f1647b6cbb368d4e1a5edf8fe605bbe0ce17a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__378d07d70d94588ddffb34d75ffab85a782ec79ca1dcb45ffd9fb53df6db6474(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8ff73b5f1f1f990cee368596fa10f103d6b2d81c676a2ec0092d4a414c8a919(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0aad2f8d16b8683057d5fbc0668070fd5881d33a0c68d3887bb3c5ca2e7ee3a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__519d0c3568292b425da348edeb5c00c81c66084da6a76ca51dff3c271eec374c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CloudwatchEventEndpointEventBus]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61524ea6892adaac90a4b4b667e8b590185a7b26d3f1f3979bb72fc2b1e77024(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9f0bc48d6e1739f8820dd8292032f43db41b3ee680e3db5aba54545bb503a65(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b4d57393d2b264909e4d8d759e6ead9020e4f0505bfe64ddea092d6fdca495e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CloudwatchEventEndpointEventBus]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d7a94812d50b665402df5dffbf60786dee886f459e910477724bfeb6c04b935(
    *,
    state: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c39e4cf7731fd2fabf2ebb116d138386cacd5539d99a3f258b837056abe60e6d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61629d9dbd439acdc23ecd338016fae4f63366c73167c8dc87165fe3b7959382(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df67f73d886c6d3864aa2aa6e2779876a8e9cbd2a70a184dce270c32492c4d1d(
    value: typing.Optional[CloudwatchEventEndpointReplicationConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bbedf9051d0cc547105be01dbb70c53377860d07544ff8e7f0d888a1f6fa1f57(
    *,
    failover_config: typing.Union[CloudwatchEventEndpointRoutingConfigFailoverConfig, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b75383db79eef00b8a55a8bc18b1d4e07850aaee398c6c5eae72fe3cb9273617(
    *,
    primary: typing.Union[CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary, typing.Dict[builtins.str, typing.Any]],
    secondary: typing.Union[CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0c965b8babe0ab4d6c0600be9fb4ae98b471998134a75d53549f852eefa9c29(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a2ded35c4b80761c06295c7a5542f61901c7406777fa3db310aa437fc828f40(
    value: typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a33d750375e1a5b02cb61331d65676ff1283d991246081c936398c9a8810be2e(
    *,
    health_check: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ea46248e03fba8b82f38d0ae96e2ab4c064c487b4edec3ee5de4f79dd868214(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1be6c3dbb74b10242c770e24c57cb2163bd267e0e3d181d63066c94083e5e427(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0700110f9c106251732a84e106ec007c9c0c3c487fb76b70303823d689d9eac7(
    value: typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7fea59f601b8c77b119b3eeba5cd8bb526dee53167cb569f1ae5621f395cc39(
    *,
    route: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a3894eace7e1887466229bc1860b44b254db206ab48ebfa16406e81b914f677(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cbd04c4aa8cbfdcfbdd76ec56d9d8a632449481fcf9de22e4b5693277baed343(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc80539b4add23b0a9ea85c595ec17d8d900c00755286695c0c3f150cf9e760e(
    value: typing.Optional[CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b90ef89c0bfaaf433c932068bce03d8bc0f36046f0992c8da69289203a225d6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6c8c8b2f4e6d8750e162c1567c5cb8cfede5884e39c3915584675850e10f3a0(
    value: typing.Optional[CloudwatchEventEndpointRoutingConfig],
) -> None:
    """Type checking stubs"""
    pass
