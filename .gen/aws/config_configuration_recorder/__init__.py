r'''
# `aws_config_configuration_recorder`

Refer to the Terraform Registry for docs: [`aws_config_configuration_recorder`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder).
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


class ConfigConfigurationRecorder(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorder",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder aws_config_configuration_recorder}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        role_arn: builtins.str,
        id: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        recording_group: typing.Optional[typing.Union["ConfigConfigurationRecorderRecordingGroup", typing.Dict[builtins.str, typing.Any]]] = None,
        recording_mode: typing.Optional[typing.Union["ConfigConfigurationRecorderRecordingMode", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder aws_config_configuration_recorder} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#role_arn ConfigConfigurationRecorder#role_arn}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#id ConfigConfigurationRecorder#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#name ConfigConfigurationRecorder#name}.
        :param recording_group: recording_group block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_group ConfigConfigurationRecorder#recording_group}
        :param recording_mode: recording_mode block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_mode ConfigConfigurationRecorder#recording_mode}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__333d148e9ea95e32f70fc2c68bfce5970b636eac3d1a6fcdaa028aa9d24d864b)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = ConfigConfigurationRecorderConfig(
            role_arn=role_arn,
            id=id,
            name=name,
            recording_group=recording_group,
            recording_mode=recording_mode,
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
        '''Generates CDKTF code for importing a ConfigConfigurationRecorder resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the ConfigConfigurationRecorder to import.
        :param import_from_id: The id of the existing ConfigConfigurationRecorder that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the ConfigConfigurationRecorder to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1a4892f704546544e90879a3cb7d822bfd34dfe64ce8177aa28aa9444b23d35)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putRecordingGroup")
    def put_recording_group(
        self,
        *,
        all_supported: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        exclusion_by_resource_types: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes", typing.Dict[builtins.str, typing.Any]]]]] = None,
        include_global_resource_types: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        recording_strategy: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["ConfigConfigurationRecorderRecordingGroupRecordingStrategy", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param all_supported: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#all_supported ConfigConfigurationRecorder#all_supported}.
        :param exclusion_by_resource_types: exclusion_by_resource_types block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#exclusion_by_resource_types ConfigConfigurationRecorder#exclusion_by_resource_types}
        :param include_global_resource_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#include_global_resource_types ConfigConfigurationRecorder#include_global_resource_types}.
        :param recording_strategy: recording_strategy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_strategy ConfigConfigurationRecorder#recording_strategy}
        :param resource_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.
        '''
        value = ConfigConfigurationRecorderRecordingGroup(
            all_supported=all_supported,
            exclusion_by_resource_types=exclusion_by_resource_types,
            include_global_resource_types=include_global_resource_types,
            recording_strategy=recording_strategy,
            resource_types=resource_types,
        )

        return typing.cast(None, jsii.invoke(self, "putRecordingGroup", [value]))

    @jsii.member(jsii_name="putRecordingMode")
    def put_recording_mode(
        self,
        *,
        recording_frequency: typing.Optional[builtins.str] = None,
        recording_mode_override: typing.Optional[typing.Union["ConfigConfigurationRecorderRecordingModeRecordingModeOverride", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param recording_frequency: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_frequency ConfigConfigurationRecorder#recording_frequency}.
        :param recording_mode_override: recording_mode_override block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_mode_override ConfigConfigurationRecorder#recording_mode_override}
        '''
        value = ConfigConfigurationRecorderRecordingMode(
            recording_frequency=recording_frequency,
            recording_mode_override=recording_mode_override,
        )

        return typing.cast(None, jsii.invoke(self, "putRecordingMode", [value]))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetRecordingGroup")
    def reset_recording_group(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRecordingGroup", []))

    @jsii.member(jsii_name="resetRecordingMode")
    def reset_recording_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRecordingMode", []))

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
    @jsii.member(jsii_name="recordingGroup")
    def recording_group(
        self,
    ) -> "ConfigConfigurationRecorderRecordingGroupOutputReference":
        return typing.cast("ConfigConfigurationRecorderRecordingGroupOutputReference", jsii.get(self, "recordingGroup"))

    @builtins.property
    @jsii.member(jsii_name="recordingMode")
    def recording_mode(
        self,
    ) -> "ConfigConfigurationRecorderRecordingModeOutputReference":
        return typing.cast("ConfigConfigurationRecorderRecordingModeOutputReference", jsii.get(self, "recordingMode"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="recordingGroupInput")
    def recording_group_input(
        self,
    ) -> typing.Optional["ConfigConfigurationRecorderRecordingGroup"]:
        return typing.cast(typing.Optional["ConfigConfigurationRecorderRecordingGroup"], jsii.get(self, "recordingGroupInput"))

    @builtins.property
    @jsii.member(jsii_name="recordingModeInput")
    def recording_mode_input(
        self,
    ) -> typing.Optional["ConfigConfigurationRecorderRecordingMode"]:
        return typing.cast(typing.Optional["ConfigConfigurationRecorderRecordingMode"], jsii.get(self, "recordingModeInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d63b38beda203358cb2641bbde04f73ce6e903bab5c3d5351a0c86c440de00e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ccdc19483a2e562e189b9b011767d4f989c895aa632020788cfcc385cfa13f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb0f5a715fe4824f2a6a44fb41c53153b7dc41d817f27f8fb7da7e12bab23660)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "role_arn": "roleArn",
        "id": "id",
        "name": "name",
        "recording_group": "recordingGroup",
        "recording_mode": "recordingMode",
    },
)
class ConfigConfigurationRecorderConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        role_arn: builtins.str,
        id: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        recording_group: typing.Optional[typing.Union["ConfigConfigurationRecorderRecordingGroup", typing.Dict[builtins.str, typing.Any]]] = None,
        recording_mode: typing.Optional[typing.Union["ConfigConfigurationRecorderRecordingMode", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#role_arn ConfigConfigurationRecorder#role_arn}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#id ConfigConfigurationRecorder#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#name ConfigConfigurationRecorder#name}.
        :param recording_group: recording_group block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_group ConfigConfigurationRecorder#recording_group}
        :param recording_mode: recording_mode block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_mode ConfigConfigurationRecorder#recording_mode}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(recording_group, dict):
            recording_group = ConfigConfigurationRecorderRecordingGroup(**recording_group)
        if isinstance(recording_mode, dict):
            recording_mode = ConfigConfigurationRecorderRecordingMode(**recording_mode)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__507dd0df978d21894e7f5d3731d9931f83d73eea313f11f692a35e9f7cd478c2)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument recording_group", value=recording_group, expected_type=type_hints["recording_group"])
            check_type(argname="argument recording_mode", value=recording_mode, expected_type=type_hints["recording_mode"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "role_arn": role_arn,
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
        if id is not None:
            self._values["id"] = id
        if name is not None:
            self._values["name"] = name
        if recording_group is not None:
            self._values["recording_group"] = recording_group
        if recording_mode is not None:
            self._values["recording_mode"] = recording_mode

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
    def role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#role_arn ConfigConfigurationRecorder#role_arn}.'''
        result = self._values.get("role_arn")
        assert result is not None, "Required property 'role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#id ConfigConfigurationRecorder#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#name ConfigConfigurationRecorder#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def recording_group(
        self,
    ) -> typing.Optional["ConfigConfigurationRecorderRecordingGroup"]:
        '''recording_group block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_group ConfigConfigurationRecorder#recording_group}
        '''
        result = self._values.get("recording_group")
        return typing.cast(typing.Optional["ConfigConfigurationRecorderRecordingGroup"], result)

    @builtins.property
    def recording_mode(
        self,
    ) -> typing.Optional["ConfigConfigurationRecorderRecordingMode"]:
        '''recording_mode block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_mode ConfigConfigurationRecorder#recording_mode}
        '''
        result = self._values.get("recording_mode")
        return typing.cast(typing.Optional["ConfigConfigurationRecorderRecordingMode"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ConfigConfigurationRecorderConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroup",
    jsii_struct_bases=[],
    name_mapping={
        "all_supported": "allSupported",
        "exclusion_by_resource_types": "exclusionByResourceTypes",
        "include_global_resource_types": "includeGlobalResourceTypes",
        "recording_strategy": "recordingStrategy",
        "resource_types": "resourceTypes",
    },
)
class ConfigConfigurationRecorderRecordingGroup:
    def __init__(
        self,
        *,
        all_supported: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        exclusion_by_resource_types: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes", typing.Dict[builtins.str, typing.Any]]]]] = None,
        include_global_resource_types: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        recording_strategy: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["ConfigConfigurationRecorderRecordingGroupRecordingStrategy", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param all_supported: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#all_supported ConfigConfigurationRecorder#all_supported}.
        :param exclusion_by_resource_types: exclusion_by_resource_types block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#exclusion_by_resource_types ConfigConfigurationRecorder#exclusion_by_resource_types}
        :param include_global_resource_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#include_global_resource_types ConfigConfigurationRecorder#include_global_resource_types}.
        :param recording_strategy: recording_strategy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_strategy ConfigConfigurationRecorder#recording_strategy}
        :param resource_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b053bcbd04da7ae1e3fb210267d1d28d9e130a26434f32c8a58d2c0584c56e5)
            check_type(argname="argument all_supported", value=all_supported, expected_type=type_hints["all_supported"])
            check_type(argname="argument exclusion_by_resource_types", value=exclusion_by_resource_types, expected_type=type_hints["exclusion_by_resource_types"])
            check_type(argname="argument include_global_resource_types", value=include_global_resource_types, expected_type=type_hints["include_global_resource_types"])
            check_type(argname="argument recording_strategy", value=recording_strategy, expected_type=type_hints["recording_strategy"])
            check_type(argname="argument resource_types", value=resource_types, expected_type=type_hints["resource_types"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if all_supported is not None:
            self._values["all_supported"] = all_supported
        if exclusion_by_resource_types is not None:
            self._values["exclusion_by_resource_types"] = exclusion_by_resource_types
        if include_global_resource_types is not None:
            self._values["include_global_resource_types"] = include_global_resource_types
        if recording_strategy is not None:
            self._values["recording_strategy"] = recording_strategy
        if resource_types is not None:
            self._values["resource_types"] = resource_types

    @builtins.property
    def all_supported(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#all_supported ConfigConfigurationRecorder#all_supported}.'''
        result = self._values.get("all_supported")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def exclusion_by_resource_types(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes"]]]:
        '''exclusion_by_resource_types block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#exclusion_by_resource_types ConfigConfigurationRecorder#exclusion_by_resource_types}
        '''
        result = self._values.get("exclusion_by_resource_types")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes"]]], result)

    @builtins.property
    def include_global_resource_types(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#include_global_resource_types ConfigConfigurationRecorder#include_global_resource_types}.'''
        result = self._values.get("include_global_resource_types")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def recording_strategy(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ConfigConfigurationRecorderRecordingGroupRecordingStrategy"]]]:
        '''recording_strategy block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_strategy ConfigConfigurationRecorder#recording_strategy}
        '''
        result = self._values.get("recording_strategy")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ConfigConfigurationRecorderRecordingGroupRecordingStrategy"]]], result)

    @builtins.property
    def resource_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.'''
        result = self._values.get("resource_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ConfigConfigurationRecorderRecordingGroup(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes",
    jsii_struct_bases=[],
    name_mapping={"resource_types": "resourceTypes"},
)
class ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes:
    def __init__(
        self,
        *,
        resource_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param resource_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c091a0d83003a6124087bee601c10e125a04606d5c28e7caa9b3b5378e2cf186)
            check_type(argname="argument resource_types", value=resource_types, expected_type=type_hints["resource_types"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if resource_types is not None:
            self._values["resource_types"] = resource_types

    @builtins.property
    def resource_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.'''
        result = self._values.get("resource_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__04fa370778bc645706ae71f98cf5b0f419bd9dd8865838246ff9c8f600fd39b8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f56be03250559e1fb70b5f37af24baa927eac9c11ca644803a7f5d544f6077d9)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22431fca93df0946ae0bb13a6f5e5d51c4403552f9fa4e0e7efc013bc1417973)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4d5e7d8f0692dd22c1c6c5cbfaa047e66d8f31f024ea7a430d1d80b2465b75bf)
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
            type_hints = typing.get_type_hints(_typecheckingstub__40a2185431a87d7a568b76a2ded3528003496031fb731f20810f6ced5c103687)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b80b69059150e7056441bf18078782dfb1a56f44c6fc6be903f6e13ea4892fc0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__35f9e9bc416d7e07cc87f30a225394f502871d0c5c6aa5b8b41fe1b95589c310)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetResourceTypes")
    def reset_resource_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceTypes", []))

    @builtins.property
    @jsii.member(jsii_name="resourceTypesInput")
    def resource_types_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "resourceTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTypes")
    def resource_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "resourceTypes"))

    @resource_types.setter
    def resource_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1db8e10fd6bc1373d4bffc236ea82aaceff2864682e4db037dde46000f498aaa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourceTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__10312a7305f8b306de3e62fc80769a888e02313b9318c75809cb40dcef7aff42)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class ConfigConfigurationRecorderRecordingGroupOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroupOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__def10a1694eed84dc02c7dcd4ae22d0b8411d4cc5f65dfb899aca12d8af0106e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putExclusionByResourceTypes")
    def put_exclusion_by_resource_types(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce70a4d09bbb5cf00e683c93668d0050c6937d016e10109b3c26209c2308ed13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putExclusionByResourceTypes", [value]))

    @jsii.member(jsii_name="putRecordingStrategy")
    def put_recording_strategy(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["ConfigConfigurationRecorderRecordingGroupRecordingStrategy", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d99f9abb015d397fe2946e4a1d94333151591894ce31d91bde972d6abfc3e76)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRecordingStrategy", [value]))

    @jsii.member(jsii_name="resetAllSupported")
    def reset_all_supported(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllSupported", []))

    @jsii.member(jsii_name="resetExclusionByResourceTypes")
    def reset_exclusion_by_resource_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExclusionByResourceTypes", []))

    @jsii.member(jsii_name="resetIncludeGlobalResourceTypes")
    def reset_include_global_resource_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIncludeGlobalResourceTypes", []))

    @jsii.member(jsii_name="resetRecordingStrategy")
    def reset_recording_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRecordingStrategy", []))

    @jsii.member(jsii_name="resetResourceTypes")
    def reset_resource_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceTypes", []))

    @builtins.property
    @jsii.member(jsii_name="exclusionByResourceTypes")
    def exclusion_by_resource_types(
        self,
    ) -> ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypesList:
        return typing.cast(ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypesList, jsii.get(self, "exclusionByResourceTypes"))

    @builtins.property
    @jsii.member(jsii_name="recordingStrategy")
    def recording_strategy(
        self,
    ) -> "ConfigConfigurationRecorderRecordingGroupRecordingStrategyList":
        return typing.cast("ConfigConfigurationRecorderRecordingGroupRecordingStrategyList", jsii.get(self, "recordingStrategy"))

    @builtins.property
    @jsii.member(jsii_name="allSupportedInput")
    def all_supported_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "allSupportedInput"))

    @builtins.property
    @jsii.member(jsii_name="exclusionByResourceTypesInput")
    def exclusion_by_resource_types_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes]]], jsii.get(self, "exclusionByResourceTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="includeGlobalResourceTypesInput")
    def include_global_resource_types_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "includeGlobalResourceTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="recordingStrategyInput")
    def recording_strategy_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ConfigConfigurationRecorderRecordingGroupRecordingStrategy"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ConfigConfigurationRecorderRecordingGroupRecordingStrategy"]]], jsii.get(self, "recordingStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTypesInput")
    def resource_types_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "resourceTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="allSupported")
    def all_supported(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "allSupported"))

    @all_supported.setter
    def all_supported(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__51fa046c737a7378c9729311350cd14431d0d038b67e550042cbb2f88d25028e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "allSupported", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="includeGlobalResourceTypes")
    def include_global_resource_types(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "includeGlobalResourceTypes"))

    @include_global_resource_types.setter
    def include_global_resource_types(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e77dc1bcaa88bd1f90fe3f775fd29a3badbda773c1e3e97e196ff661760f2949)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "includeGlobalResourceTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resourceTypes")
    def resource_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "resourceTypes"))

    @resource_types.setter
    def resource_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__50c5154f8e47bdad1b3515c2f7d68357124d8833b55ecb74bfff68010864e203)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourceTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ConfigConfigurationRecorderRecordingGroup]:
        return typing.cast(typing.Optional[ConfigConfigurationRecorderRecordingGroup], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ConfigConfigurationRecorderRecordingGroup],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1701a377446294e785b5f65a991187a31edeab3654580be225f1d3f68b24d298)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroupRecordingStrategy",
    jsii_struct_bases=[],
    name_mapping={"use_only": "useOnly"},
)
class ConfigConfigurationRecorderRecordingGroupRecordingStrategy:
    def __init__(self, *, use_only: typing.Optional[builtins.str] = None) -> None:
        '''
        :param use_only: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#use_only ConfigConfigurationRecorder#use_only}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__696e422f2d79196100493c273c278834d2d1e92540152daded3b67fecedfcda6)
            check_type(argname="argument use_only", value=use_only, expected_type=type_hints["use_only"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if use_only is not None:
            self._values["use_only"] = use_only

    @builtins.property
    def use_only(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#use_only ConfigConfigurationRecorder#use_only}.'''
        result = self._values.get("use_only")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ConfigConfigurationRecorderRecordingGroupRecordingStrategy(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ConfigConfigurationRecorderRecordingGroupRecordingStrategyList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroupRecordingStrategyList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8894fdc38c12a4ad2301daada83da2504e19e149010bc7d6a9102cd88a2a3c54)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "ConfigConfigurationRecorderRecordingGroupRecordingStrategyOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e334b555e12ba61e6b2eef0d89b00b489586797a9f8b3202b24408992537f6d)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("ConfigConfigurationRecorderRecordingGroupRecordingStrategyOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c913a69e6955aa343a216079fbb8b8c6bdcf3433ee987b9e1b661ae549020138)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1999e6bf28ff5e79858f088a471b3fc7689dbe4bf2f7aa03c4b767e98640d91a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a38596cee900fe8b6d15f9a417faa7d71ae619f351c93f805802f4e0e5d54d82)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ConfigConfigurationRecorderRecordingGroupRecordingStrategy]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ConfigConfigurationRecorderRecordingGroupRecordingStrategy]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ConfigConfigurationRecorderRecordingGroupRecordingStrategy]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d0eccf9c4df914cc349166dec064c242dee4ff92fa51626a9f648a4ac0beb58e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class ConfigConfigurationRecorderRecordingGroupRecordingStrategyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingGroupRecordingStrategyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6164a7299229642a4ad79e89fd5d2b1449b42f4d8fd08f0d1c082e574875fe95)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetUseOnly")
    def reset_use_only(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUseOnly", []))

    @builtins.property
    @jsii.member(jsii_name="useOnlyInput")
    def use_only_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "useOnlyInput"))

    @builtins.property
    @jsii.member(jsii_name="useOnly")
    def use_only(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "useOnly"))

    @use_only.setter
    def use_only(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__00f121816e8224436863c3cdba7cf6bd2a287bff3b4090d7dae0a51134d99fe3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "useOnly", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ConfigConfigurationRecorderRecordingGroupRecordingStrategy]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ConfigConfigurationRecorderRecordingGroupRecordingStrategy]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ConfigConfigurationRecorderRecordingGroupRecordingStrategy]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1071c7a547b44851489ad5f32fc56526898cf9d863bc9126aeb35f36092721b9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingMode",
    jsii_struct_bases=[],
    name_mapping={
        "recording_frequency": "recordingFrequency",
        "recording_mode_override": "recordingModeOverride",
    },
)
class ConfigConfigurationRecorderRecordingMode:
    def __init__(
        self,
        *,
        recording_frequency: typing.Optional[builtins.str] = None,
        recording_mode_override: typing.Optional[typing.Union["ConfigConfigurationRecorderRecordingModeRecordingModeOverride", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param recording_frequency: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_frequency ConfigConfigurationRecorder#recording_frequency}.
        :param recording_mode_override: recording_mode_override block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_mode_override ConfigConfigurationRecorder#recording_mode_override}
        '''
        if isinstance(recording_mode_override, dict):
            recording_mode_override = ConfigConfigurationRecorderRecordingModeRecordingModeOverride(**recording_mode_override)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d37f9788b45ffc19225b3287b11ce00cc55d96208f3a941307099d2293815d72)
            check_type(argname="argument recording_frequency", value=recording_frequency, expected_type=type_hints["recording_frequency"])
            check_type(argname="argument recording_mode_override", value=recording_mode_override, expected_type=type_hints["recording_mode_override"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if recording_frequency is not None:
            self._values["recording_frequency"] = recording_frequency
        if recording_mode_override is not None:
            self._values["recording_mode_override"] = recording_mode_override

    @builtins.property
    def recording_frequency(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_frequency ConfigConfigurationRecorder#recording_frequency}.'''
        result = self._values.get("recording_frequency")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def recording_mode_override(
        self,
    ) -> typing.Optional["ConfigConfigurationRecorderRecordingModeRecordingModeOverride"]:
        '''recording_mode_override block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_mode_override ConfigConfigurationRecorder#recording_mode_override}
        '''
        result = self._values.get("recording_mode_override")
        return typing.cast(typing.Optional["ConfigConfigurationRecorderRecordingModeRecordingModeOverride"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ConfigConfigurationRecorderRecordingMode(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ConfigConfigurationRecorderRecordingModeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingModeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fa58e776abfb011ea67ded59497aa426ca1a35a40a4a99518c868ff46ba49ca7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRecordingModeOverride")
    def put_recording_mode_override(
        self,
        *,
        recording_frequency: builtins.str,
        resource_types: typing.Sequence[builtins.str],
        description: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param recording_frequency: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_frequency ConfigConfigurationRecorder#recording_frequency}.
        :param resource_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#description ConfigConfigurationRecorder#description}.
        '''
        value = ConfigConfigurationRecorderRecordingModeRecordingModeOverride(
            recording_frequency=recording_frequency,
            resource_types=resource_types,
            description=description,
        )

        return typing.cast(None, jsii.invoke(self, "putRecordingModeOverride", [value]))

    @jsii.member(jsii_name="resetRecordingFrequency")
    def reset_recording_frequency(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRecordingFrequency", []))

    @jsii.member(jsii_name="resetRecordingModeOverride")
    def reset_recording_mode_override(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRecordingModeOverride", []))

    @builtins.property
    @jsii.member(jsii_name="recordingModeOverride")
    def recording_mode_override(
        self,
    ) -> "ConfigConfigurationRecorderRecordingModeRecordingModeOverrideOutputReference":
        return typing.cast("ConfigConfigurationRecorderRecordingModeRecordingModeOverrideOutputReference", jsii.get(self, "recordingModeOverride"))

    @builtins.property
    @jsii.member(jsii_name="recordingFrequencyInput")
    def recording_frequency_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "recordingFrequencyInput"))

    @builtins.property
    @jsii.member(jsii_name="recordingModeOverrideInput")
    def recording_mode_override_input(
        self,
    ) -> typing.Optional["ConfigConfigurationRecorderRecordingModeRecordingModeOverride"]:
        return typing.cast(typing.Optional["ConfigConfigurationRecorderRecordingModeRecordingModeOverride"], jsii.get(self, "recordingModeOverrideInput"))

    @builtins.property
    @jsii.member(jsii_name="recordingFrequency")
    def recording_frequency(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "recordingFrequency"))

    @recording_frequency.setter
    def recording_frequency(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a72b33b9509d97bdca34fba495f2b18ae186b1cac1b9e5b4fdc46c78dfae811)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "recordingFrequency", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ConfigConfigurationRecorderRecordingMode]:
        return typing.cast(typing.Optional[ConfigConfigurationRecorderRecordingMode], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ConfigConfigurationRecorderRecordingMode],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d97c7df844c97c6baec567930aaf5fdf1b65bda3c549f7d66de113c138bbf39)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverride",
    jsii_struct_bases=[],
    name_mapping={
        "recording_frequency": "recordingFrequency",
        "resource_types": "resourceTypes",
        "description": "description",
    },
)
class ConfigConfigurationRecorderRecordingModeRecordingModeOverride:
    def __init__(
        self,
        *,
        recording_frequency: builtins.str,
        resource_types: typing.Sequence[builtins.str],
        description: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param recording_frequency: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_frequency ConfigConfigurationRecorder#recording_frequency}.
        :param resource_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#description ConfigConfigurationRecorder#description}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__64b8c6dc3ad2d85ad62b61f5f8d614e47dd8d2a38b630101f40c179f8deeb7f6)
            check_type(argname="argument recording_frequency", value=recording_frequency, expected_type=type_hints["recording_frequency"])
            check_type(argname="argument resource_types", value=resource_types, expected_type=type_hints["resource_types"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "recording_frequency": recording_frequency,
            "resource_types": resource_types,
        }
        if description is not None:
            self._values["description"] = description

    @builtins.property
    def recording_frequency(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#recording_frequency ConfigConfigurationRecorder#recording_frequency}.'''
        result = self._values.get("recording_frequency")
        assert result is not None, "Required property 'recording_frequency' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def resource_types(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#resource_types ConfigConfigurationRecorder#resource_types}.'''
        result = self._values.get("resource_types")
        assert result is not None, "Required property 'resource_types' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_recorder#description ConfigConfigurationRecorder#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ConfigConfigurationRecorderRecordingModeRecordingModeOverride(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ConfigConfigurationRecorderRecordingModeRecordingModeOverrideOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.configConfigurationRecorder.ConfigConfigurationRecorderRecordingModeRecordingModeOverrideOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6782ba8f67303a93e706aef4814d1610ed4576401aa1a3d5fc4869d600343bff)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="recordingFrequencyInput")
    def recording_frequency_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "recordingFrequencyInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTypesInput")
    def resource_types_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "resourceTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c486535d9ea3405b07c1f5afdd22400c648d9fd8b8bccc4fca0166a895249f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="recordingFrequency")
    def recording_frequency(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "recordingFrequency"))

    @recording_frequency.setter
    def recording_frequency(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2c7cefb40de5f63327a333fda693d2aeda1bdf2b3ccd3eb0c005a05b906e45e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "recordingFrequency", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resourceTypes")
    def resource_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "resourceTypes"))

    @resource_types.setter
    def resource_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b83bc2cfd267fa4995603dbd93eec7bc5be56d0c26073061ffbc91bc216c65cb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourceTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ConfigConfigurationRecorderRecordingModeRecordingModeOverride]:
        return typing.cast(typing.Optional[ConfigConfigurationRecorderRecordingModeRecordingModeOverride], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ConfigConfigurationRecorderRecordingModeRecordingModeOverride],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f9f3beab4b5e1b175f5fa5cc0b8ca67018c8ecb934b83da2a21908141b3e9247)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "ConfigConfigurationRecorder",
    "ConfigConfigurationRecorderConfig",
    "ConfigConfigurationRecorderRecordingGroup",
    "ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes",
    "ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypesList",
    "ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypesOutputReference",
    "ConfigConfigurationRecorderRecordingGroupOutputReference",
    "ConfigConfigurationRecorderRecordingGroupRecordingStrategy",
    "ConfigConfigurationRecorderRecordingGroupRecordingStrategyList",
    "ConfigConfigurationRecorderRecordingGroupRecordingStrategyOutputReference",
    "ConfigConfigurationRecorderRecordingMode",
    "ConfigConfigurationRecorderRecordingModeOutputReference",
    "ConfigConfigurationRecorderRecordingModeRecordingModeOverride",
    "ConfigConfigurationRecorderRecordingModeRecordingModeOverrideOutputReference",
]

publication.publish()

def _typecheckingstub__333d148e9ea95e32f70fc2c68bfce5970b636eac3d1a6fcdaa028aa9d24d864b(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    role_arn: builtins.str,
    id: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    recording_group: typing.Optional[typing.Union[ConfigConfigurationRecorderRecordingGroup, typing.Dict[builtins.str, typing.Any]]] = None,
    recording_mode: typing.Optional[typing.Union[ConfigConfigurationRecorderRecordingMode, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__b1a4892f704546544e90879a3cb7d822bfd34dfe64ce8177aa28aa9444b23d35(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d63b38beda203358cb2641bbde04f73ce6e903bab5c3d5351a0c86c440de00e9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ccdc19483a2e562e189b9b011767d4f989c895aa632020788cfcc385cfa13f9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb0f5a715fe4824f2a6a44fb41c53153b7dc41d817f27f8fb7da7e12bab23660(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__507dd0df978d21894e7f5d3731d9931f83d73eea313f11f692a35e9f7cd478c2(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    role_arn: builtins.str,
    id: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    recording_group: typing.Optional[typing.Union[ConfigConfigurationRecorderRecordingGroup, typing.Dict[builtins.str, typing.Any]]] = None,
    recording_mode: typing.Optional[typing.Union[ConfigConfigurationRecorderRecordingMode, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b053bcbd04da7ae1e3fb210267d1d28d9e130a26434f32c8a58d2c0584c56e5(
    *,
    all_supported: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    exclusion_by_resource_types: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes, typing.Dict[builtins.str, typing.Any]]]]] = None,
    include_global_resource_types: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    recording_strategy: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[ConfigConfigurationRecorderRecordingGroupRecordingStrategy, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_types: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c091a0d83003a6124087bee601c10e125a04606d5c28e7caa9b3b5378e2cf186(
    *,
    resource_types: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04fa370778bc645706ae71f98cf5b0f419bd9dd8865838246ff9c8f600fd39b8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f56be03250559e1fb70b5f37af24baa927eac9c11ca644803a7f5d544f6077d9(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22431fca93df0946ae0bb13a6f5e5d51c4403552f9fa4e0e7efc013bc1417973(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d5e7d8f0692dd22c1c6c5cbfaa047e66d8f31f024ea7a430d1d80b2465b75bf(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40a2185431a87d7a568b76a2ded3528003496031fb731f20810f6ced5c103687(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b80b69059150e7056441bf18078782dfb1a56f44c6fc6be903f6e13ea4892fc0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35f9e9bc416d7e07cc87f30a225394f502871d0c5c6aa5b8b41fe1b95589c310(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1db8e10fd6bc1373d4bffc236ea82aaceff2864682e4db037dde46000f498aaa(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10312a7305f8b306de3e62fc80769a888e02313b9318c75809cb40dcef7aff42(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__def10a1694eed84dc02c7dcd4ae22d0b8411d4cc5f65dfb899aca12d8af0106e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce70a4d09bbb5cf00e683c93668d0050c6937d016e10109b3c26209c2308ed13(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[ConfigConfigurationRecorderRecordingGroupExclusionByResourceTypes, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d99f9abb015d397fe2946e4a1d94333151591894ce31d91bde972d6abfc3e76(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[ConfigConfigurationRecorderRecordingGroupRecordingStrategy, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__51fa046c737a7378c9729311350cd14431d0d038b67e550042cbb2f88d25028e(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e77dc1bcaa88bd1f90fe3f775fd29a3badbda773c1e3e97e196ff661760f2949(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__50c5154f8e47bdad1b3515c2f7d68357124d8833b55ecb74bfff68010864e203(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1701a377446294e785b5f65a991187a31edeab3654580be225f1d3f68b24d298(
    value: typing.Optional[ConfigConfigurationRecorderRecordingGroup],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__696e422f2d79196100493c273c278834d2d1e92540152daded3b67fecedfcda6(
    *,
    use_only: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8894fdc38c12a4ad2301daada83da2504e19e149010bc7d6a9102cd88a2a3c54(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e334b555e12ba61e6b2eef0d89b00b489586797a9f8b3202b24408992537f6d(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c913a69e6955aa343a216079fbb8b8c6bdcf3433ee987b9e1b661ae549020138(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1999e6bf28ff5e79858f088a471b3fc7689dbe4bf2f7aa03c4b767e98640d91a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a38596cee900fe8b6d15f9a417faa7d71ae619f351c93f805802f4e0e5d54d82(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0eccf9c4df914cc349166dec064c242dee4ff92fa51626a9f648a4ac0beb58e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ConfigConfigurationRecorderRecordingGroupRecordingStrategy]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6164a7299229642a4ad79e89fd5d2b1449b42f4d8fd08f0d1c082e574875fe95(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00f121816e8224436863c3cdba7cf6bd2a287bff3b4090d7dae0a51134d99fe3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1071c7a547b44851489ad5f32fc56526898cf9d863bc9126aeb35f36092721b9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ConfigConfigurationRecorderRecordingGroupRecordingStrategy]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d37f9788b45ffc19225b3287b11ce00cc55d96208f3a941307099d2293815d72(
    *,
    recording_frequency: typing.Optional[builtins.str] = None,
    recording_mode_override: typing.Optional[typing.Union[ConfigConfigurationRecorderRecordingModeRecordingModeOverride, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fa58e776abfb011ea67ded59497aa426ca1a35a40a4a99518c868ff46ba49ca7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a72b33b9509d97bdca34fba495f2b18ae186b1cac1b9e5b4fdc46c78dfae811(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d97c7df844c97c6baec567930aaf5fdf1b65bda3c549f7d66de113c138bbf39(
    value: typing.Optional[ConfigConfigurationRecorderRecordingMode],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64b8c6dc3ad2d85ad62b61f5f8d614e47dd8d2a38b630101f40c179f8deeb7f6(
    *,
    recording_frequency: builtins.str,
    resource_types: typing.Sequence[builtins.str],
    description: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6782ba8f67303a93e706aef4814d1610ed4576401aa1a3d5fc4869d600343bff(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c486535d9ea3405b07c1f5afdd22400c648d9fd8b8bccc4fca0166a895249f4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2c7cefb40de5f63327a333fda693d2aeda1bdf2b3ccd3eb0c005a05b906e45e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b83bc2cfd267fa4995603dbd93eec7bc5be56d0c26073061ffbc91bc216c65cb(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9f3beab4b5e1b175f5fa5cc0b8ca67018c8ecb934b83da2a21908141b3e9247(
    value: typing.Optional[ConfigConfigurationRecorderRecordingModeRecordingModeOverride],
) -> None:
    """Type checking stubs"""
    pass
