r'''
# `aws_ec2_network_insights_path`

Refer to the Terraform Registry for docs: [`aws_ec2_network_insights_path`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path).
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


class Ec2NetworkInsightsPath(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPath",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path aws_ec2_network_insights_path}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        protocol: builtins.str,
        source: builtins.str,
        destination: typing.Optional[builtins.str] = None,
        destination_ip: typing.Optional[builtins.str] = None,
        destination_port: typing.Optional[jsii.Number] = None,
        filter_at_destination: typing.Optional[typing.Union["Ec2NetworkInsightsPathFilterAtDestination", typing.Dict[builtins.str, typing.Any]]] = None,
        filter_at_source: typing.Optional[typing.Union["Ec2NetworkInsightsPathFilterAtSource", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        source_ip: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path aws_ec2_network_insights_path} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param protocol: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#protocol Ec2NetworkInsightsPath#protocol}.
        :param source: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source Ec2NetworkInsightsPath#source}.
        :param destination: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination Ec2NetworkInsightsPath#destination}.
        :param destination_ip: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_ip Ec2NetworkInsightsPath#destination_ip}.
        :param destination_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port Ec2NetworkInsightsPath#destination_port}.
        :param filter_at_destination: filter_at_destination block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#filter_at_destination Ec2NetworkInsightsPath#filter_at_destination}
        :param filter_at_source: filter_at_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#filter_at_source Ec2NetworkInsightsPath#filter_at_source}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#id Ec2NetworkInsightsPath#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param source_ip: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_ip Ec2NetworkInsightsPath#source_ip}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#tags Ec2NetworkInsightsPath#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#tags_all Ec2NetworkInsightsPath#tags_all}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__14eb281c0cd71f2a05c616846e6728b2f14fca02f28e951acd3ffcff037dc9f1)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = Ec2NetworkInsightsPathConfig(
            protocol=protocol,
            source=source,
            destination=destination,
            destination_ip=destination_ip,
            destination_port=destination_port,
            filter_at_destination=filter_at_destination,
            filter_at_source=filter_at_source,
            id=id,
            source_ip=source_ip,
            tags=tags,
            tags_all=tags_all,
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
        '''Generates CDKTF code for importing a Ec2NetworkInsightsPath resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Ec2NetworkInsightsPath to import.
        :param import_from_id: The id of the existing Ec2NetworkInsightsPath that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Ec2NetworkInsightsPath to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d35b51666f710b0072b939737da05c13ed43f6a593e3161b442f832aef0496a)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putFilterAtDestination")
    def put_filter_at_destination(
        self,
        *,
        destination_address: typing.Optional[builtins.str] = None,
        destination_port_range: typing.Optional[typing.Union["Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange", typing.Dict[builtins.str, typing.Any]]] = None,
        source_address: typing.Optional[builtins.str] = None,
        source_port_range: typing.Optional[typing.Union["Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param destination_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_address Ec2NetworkInsightsPath#destination_address}.
        :param destination_port_range: destination_port_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port_range Ec2NetworkInsightsPath#destination_port_range}
        :param source_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_address Ec2NetworkInsightsPath#source_address}.
        :param source_port_range: source_port_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_port_range Ec2NetworkInsightsPath#source_port_range}
        '''
        value = Ec2NetworkInsightsPathFilterAtDestination(
            destination_address=destination_address,
            destination_port_range=destination_port_range,
            source_address=source_address,
            source_port_range=source_port_range,
        )

        return typing.cast(None, jsii.invoke(self, "putFilterAtDestination", [value]))

    @jsii.member(jsii_name="putFilterAtSource")
    def put_filter_at_source(
        self,
        *,
        destination_address: typing.Optional[builtins.str] = None,
        destination_port_range: typing.Optional[typing.Union["Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange", typing.Dict[builtins.str, typing.Any]]] = None,
        source_address: typing.Optional[builtins.str] = None,
        source_port_range: typing.Optional[typing.Union["Ec2NetworkInsightsPathFilterAtSourceSourcePortRange", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param destination_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_address Ec2NetworkInsightsPath#destination_address}.
        :param destination_port_range: destination_port_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port_range Ec2NetworkInsightsPath#destination_port_range}
        :param source_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_address Ec2NetworkInsightsPath#source_address}.
        :param source_port_range: source_port_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_port_range Ec2NetworkInsightsPath#source_port_range}
        '''
        value = Ec2NetworkInsightsPathFilterAtSource(
            destination_address=destination_address,
            destination_port_range=destination_port_range,
            source_address=source_address,
            source_port_range=source_port_range,
        )

        return typing.cast(None, jsii.invoke(self, "putFilterAtSource", [value]))

    @jsii.member(jsii_name="resetDestination")
    def reset_destination(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDestination", []))

    @jsii.member(jsii_name="resetDestinationIp")
    def reset_destination_ip(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDestinationIp", []))

    @jsii.member(jsii_name="resetDestinationPort")
    def reset_destination_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDestinationPort", []))

    @jsii.member(jsii_name="resetFilterAtDestination")
    def reset_filter_at_destination(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilterAtDestination", []))

    @jsii.member(jsii_name="resetFilterAtSource")
    def reset_filter_at_source(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilterAtSource", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetSourceIp")
    def reset_source_ip(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourceIp", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

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
    @jsii.member(jsii_name="destinationArn")
    def destination_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "destinationArn"))

    @builtins.property
    @jsii.member(jsii_name="filterAtDestination")
    def filter_at_destination(
        self,
    ) -> "Ec2NetworkInsightsPathFilterAtDestinationOutputReference":
        return typing.cast("Ec2NetworkInsightsPathFilterAtDestinationOutputReference", jsii.get(self, "filterAtDestination"))

    @builtins.property
    @jsii.member(jsii_name="filterAtSource")
    def filter_at_source(self) -> "Ec2NetworkInsightsPathFilterAtSourceOutputReference":
        return typing.cast("Ec2NetworkInsightsPathFilterAtSourceOutputReference", jsii.get(self, "filterAtSource"))

    @builtins.property
    @jsii.member(jsii_name="sourceArn")
    def source_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceArn"))

    @builtins.property
    @jsii.member(jsii_name="destinationInput")
    def destination_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "destinationInput"))

    @builtins.property
    @jsii.member(jsii_name="destinationIpInput")
    def destination_ip_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "destinationIpInput"))

    @builtins.property
    @jsii.member(jsii_name="destinationPortInput")
    def destination_port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "destinationPortInput"))

    @builtins.property
    @jsii.member(jsii_name="filterAtDestinationInput")
    def filter_at_destination_input(
        self,
    ) -> typing.Optional["Ec2NetworkInsightsPathFilterAtDestination"]:
        return typing.cast(typing.Optional["Ec2NetworkInsightsPathFilterAtDestination"], jsii.get(self, "filterAtDestinationInput"))

    @builtins.property
    @jsii.member(jsii_name="filterAtSourceInput")
    def filter_at_source_input(
        self,
    ) -> typing.Optional["Ec2NetworkInsightsPathFilterAtSource"]:
        return typing.cast(typing.Optional["Ec2NetworkInsightsPathFilterAtSource"], jsii.get(self, "filterAtSourceInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="protocolInput")
    def protocol_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "protocolInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceInput")
    def source_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceIpInput")
    def source_ip_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceIpInput"))

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
    @jsii.member(jsii_name="destination")
    def destination(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "destination"))

    @destination.setter
    def destination(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0deb8b85343c5b33b2cb47ea18089d7e89ccb14ac48165c60c00f23b92ff54cf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "destination", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="destinationIp")
    def destination_ip(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "destinationIp"))

    @destination_ip.setter
    def destination_ip(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5d534b374bc3263f2b7787b7a7fa292d79078e3a6c42cb6c6cf4354e5d4104a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "destinationIp", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="destinationPort")
    def destination_port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "destinationPort"))

    @destination_port.setter
    def destination_port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fe6ac53d881d71d39e5ffe08f25fbcd8aef39f932d5832cdd7281d656b0ca520)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "destinationPort", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__026b274d533fd21a3505ab33b4067612e0cc466815bafec0d0167e45c7e673c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="protocol")
    def protocol(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "protocol"))

    @protocol.setter
    def protocol(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a274dd8112e36b2d76be3549ccaeba7ee4346cf516f602f9625beddb55d910c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "protocol", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="source")
    def source(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "source"))

    @source.setter
    def source(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f73ac598bcabc94ced1f206f4356ab389defd479cc08d2796f11f8005c707a2d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "source", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sourceIp")
    def source_ip(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceIp"))

    @source_ip.setter
    def source_ip(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__27511642968162e484ee772e5987c8e0cac6c9b5d2950337e7852a5ff5fbc629)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sourceIp", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__25ac221b5b9a55527946110f32b6125d3c46ba74ea4c0a72801367062c708c3f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb299dd1e6934523bcbfaf5e4e1d08af30015aa636e7422e4d0d86c5dcccfc8f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "protocol": "protocol",
        "source": "source",
        "destination": "destination",
        "destination_ip": "destinationIp",
        "destination_port": "destinationPort",
        "filter_at_destination": "filterAtDestination",
        "filter_at_source": "filterAtSource",
        "id": "id",
        "source_ip": "sourceIp",
        "tags": "tags",
        "tags_all": "tagsAll",
    },
)
class Ec2NetworkInsightsPathConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        protocol: builtins.str,
        source: builtins.str,
        destination: typing.Optional[builtins.str] = None,
        destination_ip: typing.Optional[builtins.str] = None,
        destination_port: typing.Optional[jsii.Number] = None,
        filter_at_destination: typing.Optional[typing.Union["Ec2NetworkInsightsPathFilterAtDestination", typing.Dict[builtins.str, typing.Any]]] = None,
        filter_at_source: typing.Optional[typing.Union["Ec2NetworkInsightsPathFilterAtSource", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        source_ip: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param protocol: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#protocol Ec2NetworkInsightsPath#protocol}.
        :param source: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source Ec2NetworkInsightsPath#source}.
        :param destination: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination Ec2NetworkInsightsPath#destination}.
        :param destination_ip: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_ip Ec2NetworkInsightsPath#destination_ip}.
        :param destination_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port Ec2NetworkInsightsPath#destination_port}.
        :param filter_at_destination: filter_at_destination block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#filter_at_destination Ec2NetworkInsightsPath#filter_at_destination}
        :param filter_at_source: filter_at_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#filter_at_source Ec2NetworkInsightsPath#filter_at_source}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#id Ec2NetworkInsightsPath#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param source_ip: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_ip Ec2NetworkInsightsPath#source_ip}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#tags Ec2NetworkInsightsPath#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#tags_all Ec2NetworkInsightsPath#tags_all}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(filter_at_destination, dict):
            filter_at_destination = Ec2NetworkInsightsPathFilterAtDestination(**filter_at_destination)
        if isinstance(filter_at_source, dict):
            filter_at_source = Ec2NetworkInsightsPathFilterAtSource(**filter_at_source)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__010ce3e1f230ac02f9ed571ee8bc81bcd88ec0365fd429651b6f5e30257c30d4)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument protocol", value=protocol, expected_type=type_hints["protocol"])
            check_type(argname="argument source", value=source, expected_type=type_hints["source"])
            check_type(argname="argument destination", value=destination, expected_type=type_hints["destination"])
            check_type(argname="argument destination_ip", value=destination_ip, expected_type=type_hints["destination_ip"])
            check_type(argname="argument destination_port", value=destination_port, expected_type=type_hints["destination_port"])
            check_type(argname="argument filter_at_destination", value=filter_at_destination, expected_type=type_hints["filter_at_destination"])
            check_type(argname="argument filter_at_source", value=filter_at_source, expected_type=type_hints["filter_at_source"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument source_ip", value=source_ip, expected_type=type_hints["source_ip"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "protocol": protocol,
            "source": source,
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
        if destination is not None:
            self._values["destination"] = destination
        if destination_ip is not None:
            self._values["destination_ip"] = destination_ip
        if destination_port is not None:
            self._values["destination_port"] = destination_port
        if filter_at_destination is not None:
            self._values["filter_at_destination"] = filter_at_destination
        if filter_at_source is not None:
            self._values["filter_at_source"] = filter_at_source
        if id is not None:
            self._values["id"] = id
        if source_ip is not None:
            self._values["source_ip"] = source_ip
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all

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
    def protocol(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#protocol Ec2NetworkInsightsPath#protocol}.'''
        result = self._values.get("protocol")
        assert result is not None, "Required property 'protocol' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def source(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source Ec2NetworkInsightsPath#source}.'''
        result = self._values.get("source")
        assert result is not None, "Required property 'source' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def destination(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination Ec2NetworkInsightsPath#destination}.'''
        result = self._values.get("destination")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def destination_ip(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_ip Ec2NetworkInsightsPath#destination_ip}.'''
        result = self._values.get("destination_ip")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def destination_port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port Ec2NetworkInsightsPath#destination_port}.'''
        result = self._values.get("destination_port")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def filter_at_destination(
        self,
    ) -> typing.Optional["Ec2NetworkInsightsPathFilterAtDestination"]:
        '''filter_at_destination block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#filter_at_destination Ec2NetworkInsightsPath#filter_at_destination}
        '''
        result = self._values.get("filter_at_destination")
        return typing.cast(typing.Optional["Ec2NetworkInsightsPathFilterAtDestination"], result)

    @builtins.property
    def filter_at_source(
        self,
    ) -> typing.Optional["Ec2NetworkInsightsPathFilterAtSource"]:
        '''filter_at_source block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#filter_at_source Ec2NetworkInsightsPath#filter_at_source}
        '''
        result = self._values.get("filter_at_source")
        return typing.cast(typing.Optional["Ec2NetworkInsightsPathFilterAtSource"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#id Ec2NetworkInsightsPath#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def source_ip(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_ip Ec2NetworkInsightsPath#source_ip}.'''
        result = self._values.get("source_ip")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#tags Ec2NetworkInsightsPath#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#tags_all Ec2NetworkInsightsPath#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2NetworkInsightsPathConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtDestination",
    jsii_struct_bases=[],
    name_mapping={
        "destination_address": "destinationAddress",
        "destination_port_range": "destinationPortRange",
        "source_address": "sourceAddress",
        "source_port_range": "sourcePortRange",
    },
)
class Ec2NetworkInsightsPathFilterAtDestination:
    def __init__(
        self,
        *,
        destination_address: typing.Optional[builtins.str] = None,
        destination_port_range: typing.Optional[typing.Union["Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange", typing.Dict[builtins.str, typing.Any]]] = None,
        source_address: typing.Optional[builtins.str] = None,
        source_port_range: typing.Optional[typing.Union["Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param destination_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_address Ec2NetworkInsightsPath#destination_address}.
        :param destination_port_range: destination_port_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port_range Ec2NetworkInsightsPath#destination_port_range}
        :param source_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_address Ec2NetworkInsightsPath#source_address}.
        :param source_port_range: source_port_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_port_range Ec2NetworkInsightsPath#source_port_range}
        '''
        if isinstance(destination_port_range, dict):
            destination_port_range = Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange(**destination_port_range)
        if isinstance(source_port_range, dict):
            source_port_range = Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange(**source_port_range)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efff1734d4517527ac4cc647b69f065d4482bab016cc8fee1a7e6ef096090f0f)
            check_type(argname="argument destination_address", value=destination_address, expected_type=type_hints["destination_address"])
            check_type(argname="argument destination_port_range", value=destination_port_range, expected_type=type_hints["destination_port_range"])
            check_type(argname="argument source_address", value=source_address, expected_type=type_hints["source_address"])
            check_type(argname="argument source_port_range", value=source_port_range, expected_type=type_hints["source_port_range"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if destination_address is not None:
            self._values["destination_address"] = destination_address
        if destination_port_range is not None:
            self._values["destination_port_range"] = destination_port_range
        if source_address is not None:
            self._values["source_address"] = source_address
        if source_port_range is not None:
            self._values["source_port_range"] = source_port_range

    @builtins.property
    def destination_address(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_address Ec2NetworkInsightsPath#destination_address}.'''
        result = self._values.get("destination_address")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def destination_port_range(
        self,
    ) -> typing.Optional["Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange"]:
        '''destination_port_range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port_range Ec2NetworkInsightsPath#destination_port_range}
        '''
        result = self._values.get("destination_port_range")
        return typing.cast(typing.Optional["Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange"], result)

    @builtins.property
    def source_address(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_address Ec2NetworkInsightsPath#source_address}.'''
        result = self._values.get("source_address")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def source_port_range(
        self,
    ) -> typing.Optional["Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange"]:
        '''source_port_range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_port_range Ec2NetworkInsightsPath#source_port_range}
        '''
        result = self._values.get("source_port_range")
        return typing.cast(typing.Optional["Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2NetworkInsightsPathFilterAtDestination(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange",
    jsii_struct_bases=[],
    name_mapping={"from_port": "fromPort", "to_port": "toPort"},
)
class Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange:
    def __init__(
        self,
        *,
        from_port: typing.Optional[jsii.Number] = None,
        to_port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param from_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.
        :param to_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1802e37aa73e26a05ed5603077011aec8b66bb6e89d761ebd1cf2e76da6bb9ca)
            check_type(argname="argument from_port", value=from_port, expected_type=type_hints["from_port"])
            check_type(argname="argument to_port", value=to_port, expected_type=type_hints["to_port"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if from_port is not None:
            self._values["from_port"] = from_port
        if to_port is not None:
            self._values["to_port"] = to_port

    @builtins.property
    def from_port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.'''
        result = self._values.get("from_port")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def to_port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.'''
        result = self._values.get("to_port")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__60caa645793980241ae4a1216fb2ab7ced891da3897494bf7c64acbcf1a9fb8e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetFromPort")
    def reset_from_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFromPort", []))

    @jsii.member(jsii_name="resetToPort")
    def reset_to_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetToPort", []))

    @builtins.property
    @jsii.member(jsii_name="fromPortInput")
    def from_port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "fromPortInput"))

    @builtins.property
    @jsii.member(jsii_name="toPortInput")
    def to_port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "toPortInput"))

    @builtins.property
    @jsii.member(jsii_name="fromPort")
    def from_port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "fromPort"))

    @from_port.setter
    def from_port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7469414ee5ac44da6d978ae89d4e8f8e30406b3aa483d4704a4b06e45449d4b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fromPort", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="toPort")
    def to_port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "toPort"))

    @to_port.setter
    def to_port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f267c94feb9e76ff10550242ed0380400ec48a5893a7f918d5e88f53d9a62246)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "toPort", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange]:
        return typing.cast(typing.Optional[Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c5b2ddcdf2f9ad0dec990a8598ba5690aebd7d2ec071fda89ab860fc8feb1b0f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Ec2NetworkInsightsPathFilterAtDestinationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtDestinationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9693b74c57a45bf58e73a4f3178ece43dd3914aa9e9cd8ebd5c55c00e22056f5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDestinationPortRange")
    def put_destination_port_range(
        self,
        *,
        from_port: typing.Optional[jsii.Number] = None,
        to_port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param from_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.
        :param to_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.
        '''
        value = Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange(
            from_port=from_port, to_port=to_port
        )

        return typing.cast(None, jsii.invoke(self, "putDestinationPortRange", [value]))

    @jsii.member(jsii_name="putSourcePortRange")
    def put_source_port_range(
        self,
        *,
        from_port: typing.Optional[jsii.Number] = None,
        to_port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param from_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.
        :param to_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.
        '''
        value = Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange(
            from_port=from_port, to_port=to_port
        )

        return typing.cast(None, jsii.invoke(self, "putSourcePortRange", [value]))

    @jsii.member(jsii_name="resetDestinationAddress")
    def reset_destination_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDestinationAddress", []))

    @jsii.member(jsii_name="resetDestinationPortRange")
    def reset_destination_port_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDestinationPortRange", []))

    @jsii.member(jsii_name="resetSourceAddress")
    def reset_source_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourceAddress", []))

    @jsii.member(jsii_name="resetSourcePortRange")
    def reset_source_port_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourcePortRange", []))

    @builtins.property
    @jsii.member(jsii_name="destinationPortRange")
    def destination_port_range(
        self,
    ) -> Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRangeOutputReference:
        return typing.cast(Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRangeOutputReference, jsii.get(self, "destinationPortRange"))

    @builtins.property
    @jsii.member(jsii_name="sourcePortRange")
    def source_port_range(
        self,
    ) -> "Ec2NetworkInsightsPathFilterAtDestinationSourcePortRangeOutputReference":
        return typing.cast("Ec2NetworkInsightsPathFilterAtDestinationSourcePortRangeOutputReference", jsii.get(self, "sourcePortRange"))

    @builtins.property
    @jsii.member(jsii_name="destinationAddressInput")
    def destination_address_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "destinationAddressInput"))

    @builtins.property
    @jsii.member(jsii_name="destinationPortRangeInput")
    def destination_port_range_input(
        self,
    ) -> typing.Optional[Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange]:
        return typing.cast(typing.Optional[Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange], jsii.get(self, "destinationPortRangeInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceAddressInput")
    def source_address_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceAddressInput"))

    @builtins.property
    @jsii.member(jsii_name="sourcePortRangeInput")
    def source_port_range_input(
        self,
    ) -> typing.Optional["Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange"]:
        return typing.cast(typing.Optional["Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange"], jsii.get(self, "sourcePortRangeInput"))

    @builtins.property
    @jsii.member(jsii_name="destinationAddress")
    def destination_address(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "destinationAddress"))

    @destination_address.setter
    def destination_address(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc4ad725c3c639c96d1e90a88beedd416634a1de823c6d045138f063ad4c4059)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "destinationAddress", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sourceAddress")
    def source_address(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceAddress"))

    @source_address.setter
    def source_address(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6bb1621e781abf88207cd2be235b18921eb0751b58d0d2c763418fe76152116)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sourceAddress", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2NetworkInsightsPathFilterAtDestination]:
        return typing.cast(typing.Optional[Ec2NetworkInsightsPathFilterAtDestination], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2NetworkInsightsPathFilterAtDestination],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce0518cda58ec5aba9e50269408504d36d8d2ea7958c153e2bf3490196d2b889)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange",
    jsii_struct_bases=[],
    name_mapping={"from_port": "fromPort", "to_port": "toPort"},
)
class Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange:
    def __init__(
        self,
        *,
        from_port: typing.Optional[jsii.Number] = None,
        to_port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param from_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.
        :param to_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__126453a51681648709a78abe95b0a77230b5bcca95f43fdb582ebdf26d3fa2e2)
            check_type(argname="argument from_port", value=from_port, expected_type=type_hints["from_port"])
            check_type(argname="argument to_port", value=to_port, expected_type=type_hints["to_port"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if from_port is not None:
            self._values["from_port"] = from_port
        if to_port is not None:
            self._values["to_port"] = to_port

    @builtins.property
    def from_port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.'''
        result = self._values.get("from_port")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def to_port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.'''
        result = self._values.get("to_port")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2NetworkInsightsPathFilterAtDestinationSourcePortRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtDestinationSourcePortRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__347cdcaf49a774e16d28dcf6b57a68647ed33a6d0b985459a71a21a38c93ed18)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetFromPort")
    def reset_from_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFromPort", []))

    @jsii.member(jsii_name="resetToPort")
    def reset_to_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetToPort", []))

    @builtins.property
    @jsii.member(jsii_name="fromPortInput")
    def from_port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "fromPortInput"))

    @builtins.property
    @jsii.member(jsii_name="toPortInput")
    def to_port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "toPortInput"))

    @builtins.property
    @jsii.member(jsii_name="fromPort")
    def from_port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "fromPort"))

    @from_port.setter
    def from_port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d7f25583bf67423e8a91a59a29ebc43456183e8f08ed55b684b2b1d9b558123)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fromPort", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="toPort")
    def to_port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "toPort"))

    @to_port.setter
    def to_port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8c738fc5805979b103bfb77696a384f4e3b18f5bf23c953945f6f705e966834)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "toPort", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange]:
        return typing.cast(typing.Optional[Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__931910abc9c100cb1492aaca260193a08b3055fc7d8e1f263d81ea6264fc4c89)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtSource",
    jsii_struct_bases=[],
    name_mapping={
        "destination_address": "destinationAddress",
        "destination_port_range": "destinationPortRange",
        "source_address": "sourceAddress",
        "source_port_range": "sourcePortRange",
    },
)
class Ec2NetworkInsightsPathFilterAtSource:
    def __init__(
        self,
        *,
        destination_address: typing.Optional[builtins.str] = None,
        destination_port_range: typing.Optional[typing.Union["Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange", typing.Dict[builtins.str, typing.Any]]] = None,
        source_address: typing.Optional[builtins.str] = None,
        source_port_range: typing.Optional[typing.Union["Ec2NetworkInsightsPathFilterAtSourceSourcePortRange", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param destination_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_address Ec2NetworkInsightsPath#destination_address}.
        :param destination_port_range: destination_port_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port_range Ec2NetworkInsightsPath#destination_port_range}
        :param source_address: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_address Ec2NetworkInsightsPath#source_address}.
        :param source_port_range: source_port_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_port_range Ec2NetworkInsightsPath#source_port_range}
        '''
        if isinstance(destination_port_range, dict):
            destination_port_range = Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange(**destination_port_range)
        if isinstance(source_port_range, dict):
            source_port_range = Ec2NetworkInsightsPathFilterAtSourceSourcePortRange(**source_port_range)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dcc370a2778e772b661a46a82ba933b563a736def9c9500bd9571abd64b165ef)
            check_type(argname="argument destination_address", value=destination_address, expected_type=type_hints["destination_address"])
            check_type(argname="argument destination_port_range", value=destination_port_range, expected_type=type_hints["destination_port_range"])
            check_type(argname="argument source_address", value=source_address, expected_type=type_hints["source_address"])
            check_type(argname="argument source_port_range", value=source_port_range, expected_type=type_hints["source_port_range"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if destination_address is not None:
            self._values["destination_address"] = destination_address
        if destination_port_range is not None:
            self._values["destination_port_range"] = destination_port_range
        if source_address is not None:
            self._values["source_address"] = source_address
        if source_port_range is not None:
            self._values["source_port_range"] = source_port_range

    @builtins.property
    def destination_address(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_address Ec2NetworkInsightsPath#destination_address}.'''
        result = self._values.get("destination_address")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def destination_port_range(
        self,
    ) -> typing.Optional["Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange"]:
        '''destination_port_range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port_range Ec2NetworkInsightsPath#destination_port_range}
        '''
        result = self._values.get("destination_port_range")
        return typing.cast(typing.Optional["Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange"], result)

    @builtins.property
    def source_address(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_address Ec2NetworkInsightsPath#source_address}.'''
        result = self._values.get("source_address")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def source_port_range(
        self,
    ) -> typing.Optional["Ec2NetworkInsightsPathFilterAtSourceSourcePortRange"]:
        '''source_port_range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_port_range Ec2NetworkInsightsPath#source_port_range}
        '''
        result = self._values.get("source_port_range")
        return typing.cast(typing.Optional["Ec2NetworkInsightsPathFilterAtSourceSourcePortRange"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2NetworkInsightsPathFilterAtSource(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange",
    jsii_struct_bases=[],
    name_mapping={"from_port": "fromPort", "to_port": "toPort"},
)
class Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange:
    def __init__(
        self,
        *,
        from_port: typing.Optional[jsii.Number] = None,
        to_port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param from_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.
        :param to_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae8a525d12ea772ed4fb87d52d5ee829dbc8a7770ca151b671be641d9aa52eaf)
            check_type(argname="argument from_port", value=from_port, expected_type=type_hints["from_port"])
            check_type(argname="argument to_port", value=to_port, expected_type=type_hints["to_port"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if from_port is not None:
            self._values["from_port"] = from_port
        if to_port is not None:
            self._values["to_port"] = to_port

    @builtins.property
    def from_port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.'''
        result = self._values.get("from_port")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def to_port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.'''
        result = self._values.get("to_port")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2NetworkInsightsPathFilterAtSourceDestinationPortRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtSourceDestinationPortRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__73987b9b13b3fa99947fe549cb17136ecf373a6d6a40223dd211e5d4fb442d81)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetFromPort")
    def reset_from_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFromPort", []))

    @jsii.member(jsii_name="resetToPort")
    def reset_to_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetToPort", []))

    @builtins.property
    @jsii.member(jsii_name="fromPortInput")
    def from_port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "fromPortInput"))

    @builtins.property
    @jsii.member(jsii_name="toPortInput")
    def to_port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "toPortInput"))

    @builtins.property
    @jsii.member(jsii_name="fromPort")
    def from_port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "fromPort"))

    @from_port.setter
    def from_port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__35bb90d61823c8eaa6d4e75f7a99aef4c70c24790502765f1cf7763c3959be01)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fromPort", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="toPort")
    def to_port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "toPort"))

    @to_port.setter
    def to_port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84619c785a496996742411fc765f6fad3d9e4b10e686bda916248ee95d0866e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "toPort", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange]:
        return typing.cast(typing.Optional[Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b0afb015a13b9425fbf7c7b2624bc98187e04ccea1446b45944c07dc1b9ee3f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Ec2NetworkInsightsPathFilterAtSourceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtSourceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4df97cb4c6ed275cb0a4326395f08e5df7274f3a75649592789cd6efc132454f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDestinationPortRange")
    def put_destination_port_range(
        self,
        *,
        from_port: typing.Optional[jsii.Number] = None,
        to_port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param from_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.
        :param to_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.
        '''
        value = Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange(
            from_port=from_port, to_port=to_port
        )

        return typing.cast(None, jsii.invoke(self, "putDestinationPortRange", [value]))

    @jsii.member(jsii_name="putSourcePortRange")
    def put_source_port_range(
        self,
        *,
        from_port: typing.Optional[jsii.Number] = None,
        to_port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param from_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.
        :param to_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.
        '''
        value = Ec2NetworkInsightsPathFilterAtSourceSourcePortRange(
            from_port=from_port, to_port=to_port
        )

        return typing.cast(None, jsii.invoke(self, "putSourcePortRange", [value]))

    @jsii.member(jsii_name="resetDestinationAddress")
    def reset_destination_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDestinationAddress", []))

    @jsii.member(jsii_name="resetDestinationPortRange")
    def reset_destination_port_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDestinationPortRange", []))

    @jsii.member(jsii_name="resetSourceAddress")
    def reset_source_address(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourceAddress", []))

    @jsii.member(jsii_name="resetSourcePortRange")
    def reset_source_port_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourcePortRange", []))

    @builtins.property
    @jsii.member(jsii_name="destinationPortRange")
    def destination_port_range(
        self,
    ) -> Ec2NetworkInsightsPathFilterAtSourceDestinationPortRangeOutputReference:
        return typing.cast(Ec2NetworkInsightsPathFilterAtSourceDestinationPortRangeOutputReference, jsii.get(self, "destinationPortRange"))

    @builtins.property
    @jsii.member(jsii_name="sourcePortRange")
    def source_port_range(
        self,
    ) -> "Ec2NetworkInsightsPathFilterAtSourceSourcePortRangeOutputReference":
        return typing.cast("Ec2NetworkInsightsPathFilterAtSourceSourcePortRangeOutputReference", jsii.get(self, "sourcePortRange"))

    @builtins.property
    @jsii.member(jsii_name="destinationAddressInput")
    def destination_address_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "destinationAddressInput"))

    @builtins.property
    @jsii.member(jsii_name="destinationPortRangeInput")
    def destination_port_range_input(
        self,
    ) -> typing.Optional[Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange]:
        return typing.cast(typing.Optional[Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange], jsii.get(self, "destinationPortRangeInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceAddressInput")
    def source_address_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceAddressInput"))

    @builtins.property
    @jsii.member(jsii_name="sourcePortRangeInput")
    def source_port_range_input(
        self,
    ) -> typing.Optional["Ec2NetworkInsightsPathFilterAtSourceSourcePortRange"]:
        return typing.cast(typing.Optional["Ec2NetworkInsightsPathFilterAtSourceSourcePortRange"], jsii.get(self, "sourcePortRangeInput"))

    @builtins.property
    @jsii.member(jsii_name="destinationAddress")
    def destination_address(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "destinationAddress"))

    @destination_address.setter
    def destination_address(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c7b9f2e423db4b1e04c5233b0d9c29578180f49f265fa61500fb30d56b96c1cf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "destinationAddress", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sourceAddress")
    def source_address(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceAddress"))

    @source_address.setter
    def source_address(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__954cd08d5c7600f2e3aaff8f66a5e7fe9738f6f1a97f06d78fcf5015dc1ee409)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sourceAddress", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Ec2NetworkInsightsPathFilterAtSource]:
        return typing.cast(typing.Optional[Ec2NetworkInsightsPathFilterAtSource], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2NetworkInsightsPathFilterAtSource],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd6ff0cb9c85e801b02eebbb6c01b3c0028db0814ca37e1e155eadf5dc5f334e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtSourceSourcePortRange",
    jsii_struct_bases=[],
    name_mapping={"from_port": "fromPort", "to_port": "toPort"},
)
class Ec2NetworkInsightsPathFilterAtSourceSourcePortRange:
    def __init__(
        self,
        *,
        from_port: typing.Optional[jsii.Number] = None,
        to_port: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param from_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.
        :param to_port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__09e6acdfe3c93ebc9541202d2ea02267dc49b08b86be7f59d7fcf0365419573c)
            check_type(argname="argument from_port", value=from_port, expected_type=type_hints["from_port"])
            check_type(argname="argument to_port", value=to_port, expected_type=type_hints["to_port"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if from_port is not None:
            self._values["from_port"] = from_port
        if to_port is not None:
            self._values["to_port"] = to_port

    @builtins.property
    def from_port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#from_port Ec2NetworkInsightsPath#from_port}.'''
        result = self._values.get("from_port")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def to_port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#to_port Ec2NetworkInsightsPath#to_port}.'''
        result = self._values.get("to_port")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Ec2NetworkInsightsPathFilterAtSourceSourcePortRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Ec2NetworkInsightsPathFilterAtSourceSourcePortRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathFilterAtSourceSourcePortRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__893df77c9f5c13659d7afecc5a92147d28cc983573f4a30adf5db101adcc934a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetFromPort")
    def reset_from_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFromPort", []))

    @jsii.member(jsii_name="resetToPort")
    def reset_to_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetToPort", []))

    @builtins.property
    @jsii.member(jsii_name="fromPortInput")
    def from_port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "fromPortInput"))

    @builtins.property
    @jsii.member(jsii_name="toPortInput")
    def to_port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "toPortInput"))

    @builtins.property
    @jsii.member(jsii_name="fromPort")
    def from_port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "fromPort"))

    @from_port.setter
    def from_port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__34f1e3c7db06f0e2e47026054576cdb099463836419591a767ee6a73de81a034)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fromPort", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="toPort")
    def to_port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "toPort"))

    @to_port.setter
    def to_port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa76d83f425130c50e52ea072379ffdadc9ddb24b4d0f0fcbab6600b2b022082)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "toPort", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Ec2NetworkInsightsPathFilterAtSourceSourcePortRange]:
        return typing.cast(typing.Optional[Ec2NetworkInsightsPathFilterAtSourceSourcePortRange], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Ec2NetworkInsightsPathFilterAtSourceSourcePortRange],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__545caf25aa3186274acdc6b9d1a6db01748b1fc537a00b00d22f08657d224c3c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Ec2NetworkInsightsPath",
    "Ec2NetworkInsightsPathConfig",
    "Ec2NetworkInsightsPathFilterAtDestination",
    "Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange",
    "Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRangeOutputReference",
    "Ec2NetworkInsightsPathFilterAtDestinationOutputReference",
    "Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange",
    "Ec2NetworkInsightsPathFilterAtDestinationSourcePortRangeOutputReference",
    "Ec2NetworkInsightsPathFilterAtSource",
    "Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange",
    "Ec2NetworkInsightsPathFilterAtSourceDestinationPortRangeOutputReference",
    "Ec2NetworkInsightsPathFilterAtSourceOutputReference",
    "Ec2NetworkInsightsPathFilterAtSourceSourcePortRange",
    "Ec2NetworkInsightsPathFilterAtSourceSourcePortRangeOutputReference",
]

publication.publish()

def _typecheckingstub__14eb281c0cd71f2a05c616846e6728b2f14fca02f28e951acd3ffcff037dc9f1(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    protocol: builtins.str,
    source: builtins.str,
    destination: typing.Optional[builtins.str] = None,
    destination_ip: typing.Optional[builtins.str] = None,
    destination_port: typing.Optional[jsii.Number] = None,
    filter_at_destination: typing.Optional[typing.Union[Ec2NetworkInsightsPathFilterAtDestination, typing.Dict[builtins.str, typing.Any]]] = None,
    filter_at_source: typing.Optional[typing.Union[Ec2NetworkInsightsPathFilterAtSource, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    source_ip: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
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

def _typecheckingstub__0d35b51666f710b0072b939737da05c13ed43f6a593e3161b442f832aef0496a(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0deb8b85343c5b33b2cb47ea18089d7e89ccb14ac48165c60c00f23b92ff54cf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5d534b374bc3263f2b7787b7a7fa292d79078e3a6c42cb6c6cf4354e5d4104a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe6ac53d881d71d39e5ffe08f25fbcd8aef39f932d5832cdd7281d656b0ca520(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__026b274d533fd21a3505ab33b4067612e0cc466815bafec0d0167e45c7e673c8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a274dd8112e36b2d76be3549ccaeba7ee4346cf516f602f9625beddb55d910c1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f73ac598bcabc94ced1f206f4356ab389defd479cc08d2796f11f8005c707a2d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27511642968162e484ee772e5987c8e0cac6c9b5d2950337e7852a5ff5fbc629(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__25ac221b5b9a55527946110f32b6125d3c46ba74ea4c0a72801367062c708c3f(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb299dd1e6934523bcbfaf5e4e1d08af30015aa636e7422e4d0d86c5dcccfc8f(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__010ce3e1f230ac02f9ed571ee8bc81bcd88ec0365fd429651b6f5e30257c30d4(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    protocol: builtins.str,
    source: builtins.str,
    destination: typing.Optional[builtins.str] = None,
    destination_ip: typing.Optional[builtins.str] = None,
    destination_port: typing.Optional[jsii.Number] = None,
    filter_at_destination: typing.Optional[typing.Union[Ec2NetworkInsightsPathFilterAtDestination, typing.Dict[builtins.str, typing.Any]]] = None,
    filter_at_source: typing.Optional[typing.Union[Ec2NetworkInsightsPathFilterAtSource, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    source_ip: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efff1734d4517527ac4cc647b69f065d4482bab016cc8fee1a7e6ef096090f0f(
    *,
    destination_address: typing.Optional[builtins.str] = None,
    destination_port_range: typing.Optional[typing.Union[Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange, typing.Dict[builtins.str, typing.Any]]] = None,
    source_address: typing.Optional[builtins.str] = None,
    source_port_range: typing.Optional[typing.Union[Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1802e37aa73e26a05ed5603077011aec8b66bb6e89d761ebd1cf2e76da6bb9ca(
    *,
    from_port: typing.Optional[jsii.Number] = None,
    to_port: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60caa645793980241ae4a1216fb2ab7ced891da3897494bf7c64acbcf1a9fb8e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7469414ee5ac44da6d978ae89d4e8f8e30406b3aa483d4704a4b06e45449d4b5(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f267c94feb9e76ff10550242ed0380400ec48a5893a7f918d5e88f53d9a62246(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c5b2ddcdf2f9ad0dec990a8598ba5690aebd7d2ec071fda89ab860fc8feb1b0f(
    value: typing.Optional[Ec2NetworkInsightsPathFilterAtDestinationDestinationPortRange],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9693b74c57a45bf58e73a4f3178ece43dd3914aa9e9cd8ebd5c55c00e22056f5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc4ad725c3c639c96d1e90a88beedd416634a1de823c6d045138f063ad4c4059(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6bb1621e781abf88207cd2be235b18921eb0751b58d0d2c763418fe76152116(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce0518cda58ec5aba9e50269408504d36d8d2ea7958c153e2bf3490196d2b889(
    value: typing.Optional[Ec2NetworkInsightsPathFilterAtDestination],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__126453a51681648709a78abe95b0a77230b5bcca95f43fdb582ebdf26d3fa2e2(
    *,
    from_port: typing.Optional[jsii.Number] = None,
    to_port: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__347cdcaf49a774e16d28dcf6b57a68647ed33a6d0b985459a71a21a38c93ed18(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d7f25583bf67423e8a91a59a29ebc43456183e8f08ed55b684b2b1d9b558123(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8c738fc5805979b103bfb77696a384f4e3b18f5bf23c953945f6f705e966834(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__931910abc9c100cb1492aaca260193a08b3055fc7d8e1f263d81ea6264fc4c89(
    value: typing.Optional[Ec2NetworkInsightsPathFilterAtDestinationSourcePortRange],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dcc370a2778e772b661a46a82ba933b563a736def9c9500bd9571abd64b165ef(
    *,
    destination_address: typing.Optional[builtins.str] = None,
    destination_port_range: typing.Optional[typing.Union[Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange, typing.Dict[builtins.str, typing.Any]]] = None,
    source_address: typing.Optional[builtins.str] = None,
    source_port_range: typing.Optional[typing.Union[Ec2NetworkInsightsPathFilterAtSourceSourcePortRange, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae8a525d12ea772ed4fb87d52d5ee829dbc8a7770ca151b671be641d9aa52eaf(
    *,
    from_port: typing.Optional[jsii.Number] = None,
    to_port: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73987b9b13b3fa99947fe549cb17136ecf373a6d6a40223dd211e5d4fb442d81(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35bb90d61823c8eaa6d4e75f7a99aef4c70c24790502765f1cf7763c3959be01(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84619c785a496996742411fc765f6fad3d9e4b10e686bda916248ee95d0866e6(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b0afb015a13b9425fbf7c7b2624bc98187e04ccea1446b45944c07dc1b9ee3f(
    value: typing.Optional[Ec2NetworkInsightsPathFilterAtSourceDestinationPortRange],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4df97cb4c6ed275cb0a4326395f08e5df7274f3a75649592789cd6efc132454f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7b9f2e423db4b1e04c5233b0d9c29578180f49f265fa61500fb30d56b96c1cf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__954cd08d5c7600f2e3aaff8f66a5e7fe9738f6f1a97f06d78fcf5015dc1ee409(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd6ff0cb9c85e801b02eebbb6c01b3c0028db0814ca37e1e155eadf5dc5f334e(
    value: typing.Optional[Ec2NetworkInsightsPathFilterAtSource],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09e6acdfe3c93ebc9541202d2ea02267dc49b08b86be7f59d7fcf0365419573c(
    *,
    from_port: typing.Optional[jsii.Number] = None,
    to_port: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__893df77c9f5c13659d7afecc5a92147d28cc983573f4a30adf5db101adcc934a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__34f1e3c7db06f0e2e47026054576cdb099463836419591a767ee6a73de81a034(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa76d83f425130c50e52ea072379ffdadc9ddb24b4d0f0fcbab6600b2b022082(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__545caf25aa3186274acdc6b9d1a6db01748b1fc537a00b00d22f08657d224c3c(
    value: typing.Optional[Ec2NetworkInsightsPathFilterAtSourceSourcePortRange],
) -> None:
    """Type checking stubs"""
    pass
