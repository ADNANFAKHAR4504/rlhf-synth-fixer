r'''
# `aws_ssmcontacts_rotation`

Refer to the Terraform Registry for docs: [`aws_ssmcontacts_rotation`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation).
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


class SsmcontactsRotation(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotation",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation aws_ssmcontacts_rotation}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        contact_ids: typing.Sequence[builtins.str],
        name: builtins.str,
        time_zone_id: builtins.str,
        recurrence: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrence", typing.Dict[builtins.str, typing.Any]]]]] = None,
        start_time: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation aws_ssmcontacts_rotation} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param contact_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#contact_ids SsmcontactsRotation#contact_ids}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#name SsmcontactsRotation#name}.
        :param time_zone_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#time_zone_id SsmcontactsRotation#time_zone_id}.
        :param recurrence: recurrence block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#recurrence SsmcontactsRotation#recurrence}
        :param start_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#start_time SsmcontactsRotation#start_time}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#tags SsmcontactsRotation#tags}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04d019c5309453849088aa257a42ae412a8edbd2572ec38d84ffaee5116d0d06)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = SsmcontactsRotationConfig(
            contact_ids=contact_ids,
            name=name,
            time_zone_id=time_zone_id,
            recurrence=recurrence,
            start_time=start_time,
            tags=tags,
            connection=connection,
            count=count,
            depends_on=depends_on,
            for_each=for_each,
            lifecycle=lifecycle,
            provider=provider,
            provisioners=provisioners,
        )

        jsii.create(self.__class__, self, [scope, id, config])

    @jsii.member(jsii_name="generateConfigForImport")
    @builtins.classmethod
    def generate_config_for_import(
        cls,
        scope: _constructs_77d1e7e8.Construct,
        import_to_id: builtins.str,
        import_from_id: builtins.str,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    ) -> _cdktf_9a9027ec.ImportableResource:
        '''Generates CDKTF code for importing a SsmcontactsRotation resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the SsmcontactsRotation to import.
        :param import_from_id: The id of the existing SsmcontactsRotation that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the SsmcontactsRotation to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02f6eee7ae4669a96b93fb9fdd269c7675859366161a98eec787f51c45d4f179)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putRecurrence")
    def put_recurrence(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrence", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6e7808929c28c50e811412be9e390862ed36666f84590be8c7b8d63647b940a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRecurrence", [value]))

    @jsii.member(jsii_name="resetRecurrence")
    def reset_recurrence(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRecurrence", []))

    @jsii.member(jsii_name="resetStartTime")
    def reset_start_time(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStartTime", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

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
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @builtins.property
    @jsii.member(jsii_name="recurrence")
    def recurrence(self) -> "SsmcontactsRotationRecurrenceList":
        return typing.cast("SsmcontactsRotationRecurrenceList", jsii.get(self, "recurrence"))

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> _cdktf_9a9027ec.StringMap:
        return typing.cast(_cdktf_9a9027ec.StringMap, jsii.get(self, "tagsAll"))

    @builtins.property
    @jsii.member(jsii_name="contactIdsInput")
    def contact_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "contactIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="recurrenceInput")
    def recurrence_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrence"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrence"]]], jsii.get(self, "recurrenceInput"))

    @builtins.property
    @jsii.member(jsii_name="startTimeInput")
    def start_time_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startTimeInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="timeZoneIdInput")
    def time_zone_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "timeZoneIdInput"))

    @builtins.property
    @jsii.member(jsii_name="contactIds")
    def contact_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "contactIds"))

    @contact_ids.setter
    def contact_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__907cb3c12ad91bbb0d1d7c35913388d1a8122601829322afe3baef8280a05b83)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contactIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f1a47a02a3516d808272e07f37563614eb166daa8ac160dbe7aa9c45699ae058)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startTime")
    def start_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startTime"))

    @start_time.setter
    def start_time(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3caaf0de71e5d257025f9a31afb96d5360f8aa3476737d2971bd78363a8ab50)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startTime", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e28e227b8f3a50c2b36636a381cab0a681574e77748f3f232b97b3ecb26051c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="timeZoneId")
    def time_zone_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "timeZoneId"))

    @time_zone_id.setter
    def time_zone_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f0eaa0ae3c91756fbf8cbad6973ee0c2fdb71807e35156d13907a39157a56b1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "timeZoneId", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "contact_ids": "contactIds",
        "name": "name",
        "time_zone_id": "timeZoneId",
        "recurrence": "recurrence",
        "start_time": "startTime",
        "tags": "tags",
    },
)
class SsmcontactsRotationConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        contact_ids: typing.Sequence[builtins.str],
        name: builtins.str,
        time_zone_id: builtins.str,
        recurrence: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrence", typing.Dict[builtins.str, typing.Any]]]]] = None,
        start_time: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param contact_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#contact_ids SsmcontactsRotation#contact_ids}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#name SsmcontactsRotation#name}.
        :param time_zone_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#time_zone_id SsmcontactsRotation#time_zone_id}.
        :param recurrence: recurrence block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#recurrence SsmcontactsRotation#recurrence}
        :param start_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#start_time SsmcontactsRotation#start_time}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#tags SsmcontactsRotation#tags}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f88c394eafd4c12727de4e146acbf22b30282b1c4de09cd1f51705c0e2e9136c)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument contact_ids", value=contact_ids, expected_type=type_hints["contact_ids"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument time_zone_id", value=time_zone_id, expected_type=type_hints["time_zone_id"])
            check_type(argname="argument recurrence", value=recurrence, expected_type=type_hints["recurrence"])
            check_type(argname="argument start_time", value=start_time, expected_type=type_hints["start_time"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "contact_ids": contact_ids,
            "name": name,
            "time_zone_id": time_zone_id,
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
        if recurrence is not None:
            self._values["recurrence"] = recurrence
        if start_time is not None:
            self._values["start_time"] = start_time
        if tags is not None:
            self._values["tags"] = tags

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
    def contact_ids(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#contact_ids SsmcontactsRotation#contact_ids}.'''
        result = self._values.get("contact_ids")
        assert result is not None, "Required property 'contact_ids' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#name SsmcontactsRotation#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def time_zone_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#time_zone_id SsmcontactsRotation#time_zone_id}.'''
        result = self._values.get("time_zone_id")
        assert result is not None, "Required property 'time_zone_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def recurrence(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrence"]]]:
        '''recurrence block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#recurrence SsmcontactsRotation#recurrence}
        '''
        result = self._values.get("recurrence")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrence"]]], result)

    @builtins.property
    def start_time(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#start_time SsmcontactsRotation#start_time}.'''
        result = self._values.get("start_time")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#tags SsmcontactsRotation#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsRotationConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrence",
    jsii_struct_bases=[],
    name_mapping={
        "number_of_on_calls": "numberOfOnCalls",
        "recurrence_multiplier": "recurrenceMultiplier",
        "daily_settings": "dailySettings",
        "monthly_settings": "monthlySettings",
        "shift_coverages": "shiftCoverages",
        "weekly_settings": "weeklySettings",
    },
)
class SsmcontactsRotationRecurrence:
    def __init__(
        self,
        *,
        number_of_on_calls: jsii.Number,
        recurrence_multiplier: jsii.Number,
        daily_settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrenceDailySettings", typing.Dict[builtins.str, typing.Any]]]]] = None,
        monthly_settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrenceMonthlySettings", typing.Dict[builtins.str, typing.Any]]]]] = None,
        shift_coverages: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrenceShiftCoverages", typing.Dict[builtins.str, typing.Any]]]]] = None,
        weekly_settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrenceWeeklySettings", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param number_of_on_calls: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#number_of_on_calls SsmcontactsRotation#number_of_on_calls}.
        :param recurrence_multiplier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#recurrence_multiplier SsmcontactsRotation#recurrence_multiplier}.
        :param daily_settings: daily_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#daily_settings SsmcontactsRotation#daily_settings}
        :param monthly_settings: monthly_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#monthly_settings SsmcontactsRotation#monthly_settings}
        :param shift_coverages: shift_coverages block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#shift_coverages SsmcontactsRotation#shift_coverages}
        :param weekly_settings: weekly_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#weekly_settings SsmcontactsRotation#weekly_settings}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e702b8c2613e8a23ba3ac44ec6c58e15cd9df19bc498b45ef6021a5b0808a0d)
            check_type(argname="argument number_of_on_calls", value=number_of_on_calls, expected_type=type_hints["number_of_on_calls"])
            check_type(argname="argument recurrence_multiplier", value=recurrence_multiplier, expected_type=type_hints["recurrence_multiplier"])
            check_type(argname="argument daily_settings", value=daily_settings, expected_type=type_hints["daily_settings"])
            check_type(argname="argument monthly_settings", value=monthly_settings, expected_type=type_hints["monthly_settings"])
            check_type(argname="argument shift_coverages", value=shift_coverages, expected_type=type_hints["shift_coverages"])
            check_type(argname="argument weekly_settings", value=weekly_settings, expected_type=type_hints["weekly_settings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "number_of_on_calls": number_of_on_calls,
            "recurrence_multiplier": recurrence_multiplier,
        }
        if daily_settings is not None:
            self._values["daily_settings"] = daily_settings
        if monthly_settings is not None:
            self._values["monthly_settings"] = monthly_settings
        if shift_coverages is not None:
            self._values["shift_coverages"] = shift_coverages
        if weekly_settings is not None:
            self._values["weekly_settings"] = weekly_settings

    @builtins.property
    def number_of_on_calls(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#number_of_on_calls SsmcontactsRotation#number_of_on_calls}.'''
        result = self._values.get("number_of_on_calls")
        assert result is not None, "Required property 'number_of_on_calls' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def recurrence_multiplier(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#recurrence_multiplier SsmcontactsRotation#recurrence_multiplier}.'''
        result = self._values.get("recurrence_multiplier")
        assert result is not None, "Required property 'recurrence_multiplier' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def daily_settings(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceDailySettings"]]]:
        '''daily_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#daily_settings SsmcontactsRotation#daily_settings}
        '''
        result = self._values.get("daily_settings")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceDailySettings"]]], result)

    @builtins.property
    def monthly_settings(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceMonthlySettings"]]]:
        '''monthly_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#monthly_settings SsmcontactsRotation#monthly_settings}
        '''
        result = self._values.get("monthly_settings")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceMonthlySettings"]]], result)

    @builtins.property
    def shift_coverages(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceShiftCoverages"]]]:
        '''shift_coverages block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#shift_coverages SsmcontactsRotation#shift_coverages}
        '''
        result = self._values.get("shift_coverages")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceShiftCoverages"]]], result)

    @builtins.property
    def weekly_settings(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceWeeklySettings"]]]:
        '''weekly_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#weekly_settings SsmcontactsRotation#weekly_settings}
        '''
        result = self._values.get("weekly_settings")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceWeeklySettings"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsRotationRecurrence(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceDailySettings",
    jsii_struct_bases=[],
    name_mapping={"hour_of_day": "hourOfDay", "minute_of_hour": "minuteOfHour"},
)
class SsmcontactsRotationRecurrenceDailySettings:
    def __init__(
        self,
        *,
        hour_of_day: jsii.Number,
        minute_of_hour: jsii.Number,
    ) -> None:
        '''
        :param hour_of_day: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hour_of_day SsmcontactsRotation#hour_of_day}.
        :param minute_of_hour: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#minute_of_hour SsmcontactsRotation#minute_of_hour}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4fce565bee4538291bb3bfd811d19c4a2743f297bbb2d457c567699cfcba398d)
            check_type(argname="argument hour_of_day", value=hour_of_day, expected_type=type_hints["hour_of_day"])
            check_type(argname="argument minute_of_hour", value=minute_of_hour, expected_type=type_hints["minute_of_hour"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "hour_of_day": hour_of_day,
            "minute_of_hour": minute_of_hour,
        }

    @builtins.property
    def hour_of_day(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hour_of_day SsmcontactsRotation#hour_of_day}.'''
        result = self._values.get("hour_of_day")
        assert result is not None, "Required property 'hour_of_day' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def minute_of_hour(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#minute_of_hour SsmcontactsRotation#minute_of_hour}.'''
        result = self._values.get("minute_of_hour")
        assert result is not None, "Required property 'minute_of_hour' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsRotationRecurrenceDailySettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmcontactsRotationRecurrenceDailySettingsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceDailySettingsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8d0419b0f9dca8343b83287ecb95438886329f9df4ab65eeb9e2b9335aeca751)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmcontactsRotationRecurrenceDailySettingsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__63c4ae1901225bf2c2cdc769d27df2288b8347f978654330ee0fff93dfdabfe3)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmcontactsRotationRecurrenceDailySettingsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2e0fea3d6aa6f80f44f8dad939618b82b34f0e19fecc99757076d79e536ff20)
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
            type_hints = typing.get_type_hints(_typecheckingstub__821d3bc1f1efcc1b9eae50c0cd9d175195f7a9bf3fe9f8d5c041be6806616071)
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
            type_hints = typing.get_type_hints(_typecheckingstub__61e4c176c7cabfe74b903657e7b7c55c8b52284d2a0021fd3bb744a1635063f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceDailySettings]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceDailySettings]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceDailySettings]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc95e79ad394f3bf39863dc76f45d69ddb7d9eef08502d4c6c3422eda1c18648)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceDailySettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceDailySettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6d4f845d96d0f83c3a5c1e81ee888f3764d7704a2b44b5dce984321bd8e5c6a4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="hourOfDayInput")
    def hour_of_day_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "hourOfDayInput"))

    @builtins.property
    @jsii.member(jsii_name="minuteOfHourInput")
    def minute_of_hour_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minuteOfHourInput"))

    @builtins.property
    @jsii.member(jsii_name="hourOfDay")
    def hour_of_day(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "hourOfDay"))

    @hour_of_day.setter
    def hour_of_day(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33a860382a706f390c5f7a181879d26d6001fd28a603b7280fda36432ae982ac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "hourOfDay", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minuteOfHour")
    def minute_of_hour(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minuteOfHour"))

    @minute_of_hour.setter
    def minute_of_hour(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2d45565d3ec1313b1da8bc80e4915e272e56f3eb0fd05a5fa3e5d316985626b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minuteOfHour", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceDailySettings]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceDailySettings]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceDailySettings]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__23429ad169f5a77287210e0a8decc1822e8a98a8234bc7f1aa931c2551c89d9c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__22e8ba25744fd9f2671a22460fec0a9336bd1b71f25a3c98a9cdcdb9ea4b542a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "SsmcontactsRotationRecurrenceOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__581d9426fdd2096883de0b1cb43ccdfa801edd2cb0d7710467cabf5cac7dfbee)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmcontactsRotationRecurrenceOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3b0c38a86a8f9f69cd746d4dce3ee6f5b628a97221b3bb7047dcbad319c8cbb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c75df87f60eb28478289ba6f2ecc8cd83ee2edb9cff3288b5764800e6fbff68d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__33aa006240b66bf0e36948dbe32bf11cab595d57574947ac41bcfe6b3e327aa5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrence]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrence]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrence]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__97c534282073b5fe42751cd846a9ab5a24286e8bc961fcc4e8a2448e7ad0b5c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceMonthlySettings",
    jsii_struct_bases=[],
    name_mapping={"day_of_month": "dayOfMonth", "hand_off_time": "handOffTime"},
)
class SsmcontactsRotationRecurrenceMonthlySettings:
    def __init__(
        self,
        *,
        day_of_month: jsii.Number,
        hand_off_time: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param day_of_month: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#day_of_month SsmcontactsRotation#day_of_month}.
        :param hand_off_time: hand_off_time block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hand_off_time SsmcontactsRotation#hand_off_time}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__825c8f751e7f474acd7828cf58d04f04530f62259b844413372ce3cb7b66428b)
            check_type(argname="argument day_of_month", value=day_of_month, expected_type=type_hints["day_of_month"])
            check_type(argname="argument hand_off_time", value=hand_off_time, expected_type=type_hints["hand_off_time"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "day_of_month": day_of_month,
        }
        if hand_off_time is not None:
            self._values["hand_off_time"] = hand_off_time

    @builtins.property
    def day_of_month(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#day_of_month SsmcontactsRotation#day_of_month}.'''
        result = self._values.get("day_of_month")
        assert result is not None, "Required property 'day_of_month' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def hand_off_time(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime"]]]:
        '''hand_off_time block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hand_off_time SsmcontactsRotation#hand_off_time}
        '''
        result = self._values.get("hand_off_time")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsRotationRecurrenceMonthlySettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime",
    jsii_struct_bases=[],
    name_mapping={"hour_of_day": "hourOfDay", "minute_of_hour": "minuteOfHour"},
)
class SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime:
    def __init__(
        self,
        *,
        hour_of_day: jsii.Number,
        minute_of_hour: jsii.Number,
    ) -> None:
        '''
        :param hour_of_day: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hour_of_day SsmcontactsRotation#hour_of_day}.
        :param minute_of_hour: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#minute_of_hour SsmcontactsRotation#minute_of_hour}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__408b8802781c096d67e1051b20f2946cd81802b7b48e6a7bddae6ede52605448)
            check_type(argname="argument hour_of_day", value=hour_of_day, expected_type=type_hints["hour_of_day"])
            check_type(argname="argument minute_of_hour", value=minute_of_hour, expected_type=type_hints["minute_of_hour"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "hour_of_day": hour_of_day,
            "minute_of_hour": minute_of_hour,
        }

    @builtins.property
    def hour_of_day(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hour_of_day SsmcontactsRotation#hour_of_day}.'''
        result = self._values.get("hour_of_day")
        assert result is not None, "Required property 'hour_of_day' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def minute_of_hour(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#minute_of_hour SsmcontactsRotation#minute_of_hour}.'''
        result = self._values.get("minute_of_hour")
        assert result is not None, "Required property 'minute_of_hour' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmcontactsRotationRecurrenceMonthlySettingsHandOffTimeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceMonthlySettingsHandOffTimeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f89ddd771f04a908be2317ae5ec8e3eb53f2648b9f89db6ba8538495ced17bad)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmcontactsRotationRecurrenceMonthlySettingsHandOffTimeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3aa136aec72d778823e9e2c27964af3d20e871cbaad003b5e45b26b958d6f48)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmcontactsRotationRecurrenceMonthlySettingsHandOffTimeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f94e6bc1034a1743b32cf1cdd148ca4e636f4ed99f86a42731c906207feabe23)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b0d43f483bdc8088268e98fecce3c572f012f60cfac27806e93d81d0c5f0648f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__72f5eb76c48b5b1b0552b9f4c61ffeabefd53516ce67d8f15a8760ae2b5cd601)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__76e763aaa1dbbe64befcc17e15090faeac04610734f69f9c5e04a6ab12cac139)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceMonthlySettingsHandOffTimeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceMonthlySettingsHandOffTimeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a50ce36d59cb4126734944badd50eba963087fec1928155fd20591c6ae6d49a8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="hourOfDayInput")
    def hour_of_day_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "hourOfDayInput"))

    @builtins.property
    @jsii.member(jsii_name="minuteOfHourInput")
    def minute_of_hour_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minuteOfHourInput"))

    @builtins.property
    @jsii.member(jsii_name="hourOfDay")
    def hour_of_day(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "hourOfDay"))

    @hour_of_day.setter
    def hour_of_day(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3ef172e4f1a180c764d76feeee52240cafac80753859afa6c0f4a3038ca50c6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "hourOfDay", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minuteOfHour")
    def minute_of_hour(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minuteOfHour"))

    @minute_of_hour.setter
    def minute_of_hour(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0920ba1065651188097dab74eac789d3e8fb889d7d9490a4d9d53a78363572d6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minuteOfHour", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d1c22f3943ec122fa9f2f7c21dcc1d049f9a420f520e4af5a4a7dd4fd7ccd2fc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceMonthlySettingsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceMonthlySettingsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4615310e38b8d5b15cd056b93fc9248b131fa9d77f2c048bc9744e0bc1c46a97)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmcontactsRotationRecurrenceMonthlySettingsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a995dc84aee4a1c27e35f06880181f0b9ad9f0ff2edf8aa4d436a8f0b41861b)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmcontactsRotationRecurrenceMonthlySettingsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1433e261d2af7d51a5050e6f493096154c1643ac233ccbb87103271fe40d05e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__de85ab55c117926bd27fbf234f4948f6eb8e65d53934659e509464f94d473e73)
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
            type_hints = typing.get_type_hints(_typecheckingstub__eb84507e43c3e3e7768bd9273f30bc76ee8b43b83e5905090eb52ef0267b11e5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceMonthlySettings]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceMonthlySettings]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceMonthlySettings]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ec7c388a95b60bfef6a09c852e1123fa287242840a1d7ba60acfff9be66cdf1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceMonthlySettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceMonthlySettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d8a9ace8151bc57f1852a7af3980212335f10d94a6125624b86b6c8988a7bba2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putHandOffTime")
    def put_hand_off_time(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e147bc7a2403a74f41ddf751d82ab3d622524ee88c66b232ec27a998eb65db4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putHandOffTime", [value]))

    @jsii.member(jsii_name="resetHandOffTime")
    def reset_hand_off_time(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHandOffTime", []))

    @builtins.property
    @jsii.member(jsii_name="handOffTime")
    def hand_off_time(
        self,
    ) -> SsmcontactsRotationRecurrenceMonthlySettingsHandOffTimeList:
        return typing.cast(SsmcontactsRotationRecurrenceMonthlySettingsHandOffTimeList, jsii.get(self, "handOffTime"))

    @builtins.property
    @jsii.member(jsii_name="dayOfMonthInput")
    def day_of_month_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "dayOfMonthInput"))

    @builtins.property
    @jsii.member(jsii_name="handOffTimeInput")
    def hand_off_time_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime]]], jsii.get(self, "handOffTimeInput"))

    @builtins.property
    @jsii.member(jsii_name="dayOfMonth")
    def day_of_month(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "dayOfMonth"))

    @day_of_month.setter
    def day_of_month(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__850afe09470d5abb911c1b74e0bf02440cce2cc5a8ce92cbdfd2074fe2237a39)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dayOfMonth", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceMonthlySettings]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceMonthlySettings]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceMonthlySettings]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6d5401690279b4966fb2017066de56bb08a5585110b654b76128462d00aff43)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a14bc5a92e89d9768c21769968ac4f24e5a759aaf5c1ca574979e46c1e1a6b32)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putDailySettings")
    def put_daily_settings(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceDailySettings, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__790cb6d3c29b6645a16692f51c98f9883d960377f1c14a68a1c9a26edcaab401)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDailySettings", [value]))

    @jsii.member(jsii_name="putMonthlySettings")
    def put_monthly_settings(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceMonthlySettings, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59311bd625087af7d602fac372a96ffaca6936ca9aed39a4a9c2d48fcb86d858)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putMonthlySettings", [value]))

    @jsii.member(jsii_name="putShiftCoverages")
    def put_shift_coverages(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrenceShiftCoverages", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ceda80ef50837c9d79dbc798c5cfecb63e761c025f7222bcbfe78520d747ad00)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putShiftCoverages", [value]))

    @jsii.member(jsii_name="putWeeklySettings")
    def put_weekly_settings(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrenceWeeklySettings", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc7a18d453de24b8f30ad82e2cfe026e7f9826084a822248dd4844b672ecdb97)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putWeeklySettings", [value]))

    @jsii.member(jsii_name="resetDailySettings")
    def reset_daily_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDailySettings", []))

    @jsii.member(jsii_name="resetMonthlySettings")
    def reset_monthly_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMonthlySettings", []))

    @jsii.member(jsii_name="resetShiftCoverages")
    def reset_shift_coverages(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetShiftCoverages", []))

    @jsii.member(jsii_name="resetWeeklySettings")
    def reset_weekly_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWeeklySettings", []))

    @builtins.property
    @jsii.member(jsii_name="dailySettings")
    def daily_settings(self) -> SsmcontactsRotationRecurrenceDailySettingsList:
        return typing.cast(SsmcontactsRotationRecurrenceDailySettingsList, jsii.get(self, "dailySettings"))

    @builtins.property
    @jsii.member(jsii_name="monthlySettings")
    def monthly_settings(self) -> SsmcontactsRotationRecurrenceMonthlySettingsList:
        return typing.cast(SsmcontactsRotationRecurrenceMonthlySettingsList, jsii.get(self, "monthlySettings"))

    @builtins.property
    @jsii.member(jsii_name="shiftCoverages")
    def shift_coverages(self) -> "SsmcontactsRotationRecurrenceShiftCoveragesList":
        return typing.cast("SsmcontactsRotationRecurrenceShiftCoveragesList", jsii.get(self, "shiftCoverages"))

    @builtins.property
    @jsii.member(jsii_name="weeklySettings")
    def weekly_settings(self) -> "SsmcontactsRotationRecurrenceWeeklySettingsList":
        return typing.cast("SsmcontactsRotationRecurrenceWeeklySettingsList", jsii.get(self, "weeklySettings"))

    @builtins.property
    @jsii.member(jsii_name="dailySettingsInput")
    def daily_settings_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceDailySettings]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceDailySettings]]], jsii.get(self, "dailySettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="monthlySettingsInput")
    def monthly_settings_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceMonthlySettings]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceMonthlySettings]]], jsii.get(self, "monthlySettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="numberOfOnCallsInput")
    def number_of_on_calls_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "numberOfOnCallsInput"))

    @builtins.property
    @jsii.member(jsii_name="recurrenceMultiplierInput")
    def recurrence_multiplier_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "recurrenceMultiplierInput"))

    @builtins.property
    @jsii.member(jsii_name="shiftCoveragesInput")
    def shift_coverages_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceShiftCoverages"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceShiftCoverages"]]], jsii.get(self, "shiftCoveragesInput"))

    @builtins.property
    @jsii.member(jsii_name="weeklySettingsInput")
    def weekly_settings_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceWeeklySettings"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceWeeklySettings"]]], jsii.get(self, "weeklySettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="numberOfOnCalls")
    def number_of_on_calls(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "numberOfOnCalls"))

    @number_of_on_calls.setter
    def number_of_on_calls(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7fd3610c2bf731ffa02e4966908d592029157df6197760635f0de093e2cd9455)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "numberOfOnCalls", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="recurrenceMultiplier")
    def recurrence_multiplier(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "recurrenceMultiplier"))

    @recurrence_multiplier.setter
    def recurrence_multiplier(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4b3dbbd2f946e95f79c54fd95da4ef45597896b1f270779481cedd7fb1c8719)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "recurrenceMultiplier", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrence]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrence]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrence]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9ae3b88badac0910769f1176cbca2aff7ecb3b39df6d8713633d47e2268122d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoverages",
    jsii_struct_bases=[],
    name_mapping={"map_block_key": "mapBlockKey", "coverage_times": "coverageTimes"},
)
class SsmcontactsRotationRecurrenceShiftCoverages:
    def __init__(
        self,
        *,
        map_block_key: builtins.str,
        coverage_times: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param map_block_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#map_block_key SsmcontactsRotation#map_block_key}.
        :param coverage_times: coverage_times block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#coverage_times SsmcontactsRotation#coverage_times}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3436ec01d1856d1bd9c184cb97de3c4b825a59c78b8920d0bbf4b78523e55a52)
            check_type(argname="argument map_block_key", value=map_block_key, expected_type=type_hints["map_block_key"])
            check_type(argname="argument coverage_times", value=coverage_times, expected_type=type_hints["coverage_times"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "map_block_key": map_block_key,
        }
        if coverage_times is not None:
            self._values["coverage_times"] = coverage_times

    @builtins.property
    def map_block_key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#map_block_key SsmcontactsRotation#map_block_key}.'''
        result = self._values.get("map_block_key")
        assert result is not None, "Required property 'map_block_key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def coverage_times(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes"]]]:
        '''coverage_times block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#coverage_times SsmcontactsRotation#coverage_times}
        '''
        result = self._values.get("coverage_times")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsRotationRecurrenceShiftCoverages(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes",
    jsii_struct_bases=[],
    name_mapping={"end": "end", "start": "start"},
)
class SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes:
    def __init__(
        self,
        *,
        end: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd", typing.Dict[builtins.str, typing.Any]]]]] = None,
        start: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param end: end block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#end SsmcontactsRotation#end}
        :param start: start block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#start SsmcontactsRotation#start}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3f405fffaf4359c791e0decf6ade75e3b5475499d47ff61e46c38d6376dd933f)
            check_type(argname="argument end", value=end, expected_type=type_hints["end"])
            check_type(argname="argument start", value=start, expected_type=type_hints["start"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if end is not None:
            self._values["end"] = end
        if start is not None:
            self._values["start"] = start

    @builtins.property
    def end(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd"]]]:
        '''end block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#end SsmcontactsRotation#end}
        '''
        result = self._values.get("end")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd"]]], result)

    @builtins.property
    def start(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart"]]]:
        '''start block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#start SsmcontactsRotation#start}
        '''
        result = self._values.get("start")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd",
    jsii_struct_bases=[],
    name_mapping={"hour_of_day": "hourOfDay", "minute_of_hour": "minuteOfHour"},
)
class SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd:
    def __init__(
        self,
        *,
        hour_of_day: jsii.Number,
        minute_of_hour: jsii.Number,
    ) -> None:
        '''
        :param hour_of_day: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hour_of_day SsmcontactsRotation#hour_of_day}.
        :param minute_of_hour: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#minute_of_hour SsmcontactsRotation#minute_of_hour}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac17086c2e5754743f2f6aa5848daeaaaadd859915acd44d1183adee8fe79f27)
            check_type(argname="argument hour_of_day", value=hour_of_day, expected_type=type_hints["hour_of_day"])
            check_type(argname="argument minute_of_hour", value=minute_of_hour, expected_type=type_hints["minute_of_hour"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "hour_of_day": hour_of_day,
            "minute_of_hour": minute_of_hour,
        }

    @builtins.property
    def hour_of_day(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hour_of_day SsmcontactsRotation#hour_of_day}.'''
        result = self._values.get("hour_of_day")
        assert result is not None, "Required property 'hour_of_day' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def minute_of_hour(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#minute_of_hour SsmcontactsRotation#minute_of_hour}.'''
        result = self._values.get("minute_of_hour")
        assert result is not None, "Required property 'minute_of_hour' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEndList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEndList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8d5f1a680f51a2f1766b343b1e98a61eae90da7d0ad8aa3c4eab7ff7665dfda2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEndOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f3effe5428e7db673ab3b00667489ff7be41b7763304ca7eb33d1a7da722a0a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEndOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed1aa396a1958fe47e10cae933e8eb4ee2206ab8c067e8d592141cce39c6171a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__500b10b9c65d9b0de075fde995e6543bfb944c4a3cd5c49749c74792b0b12729)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2f099a3ad8a435f78528f948fb4eab45cc3b51604cc77a1d3b032f1cf0289f9e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59c0b7073145ea5303e0f8789f7cd4183938ba831555b82d288a704154c6e103)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEndOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEndOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e978c84789e75d383b4117fa2c268a058e917e45b3a30e3f792774a979b37cb1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="hourOfDayInput")
    def hour_of_day_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "hourOfDayInput"))

    @builtins.property
    @jsii.member(jsii_name="minuteOfHourInput")
    def minute_of_hour_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minuteOfHourInput"))

    @builtins.property
    @jsii.member(jsii_name="hourOfDay")
    def hour_of_day(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "hourOfDay"))

    @hour_of_day.setter
    def hour_of_day(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c7bafba24d80fbb6d30f291eb177a3b9d4c35ad795d3f16e999e89cabc062177)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "hourOfDay", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minuteOfHour")
    def minute_of_hour(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minuteOfHour"))

    @minute_of_hour.setter
    def minute_of_hour(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8aeb03a71bd2b5d011acd8b6708b0dfffa054b257f1fbd1324ac270fbe9afe26)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minuteOfHour", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__462d333f39fbc274c1efa26f2adaea4b1a9cb2cac0ea4b42eb0242ad74fab041)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ec30b8121c7ff0279d4bc2fde31bc1209784965070068c36d7443779cae62e05)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2547722501f459959650b82302b1b0bfa61952dd11fbc7fff275202142c88989)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3648b6e536f9a916b296f0b20dcc465fd9f5878ef6469af451e053c98f8a86af)
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
            type_hints = typing.get_type_hints(_typecheckingstub__68b5dae5355cf6f9f89909b3f101724e3b784f6da4d553959a750742ef5b1835)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3f2ff403e94cd8bc4062039a61359acd8ca8e44b667e3ba54b5edf1a6f90f5ad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__603d2a428026a1953da3c7c4077abea7e9feb0524b77a433d44f704ae3613360)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dfffa4f186ff34fced25f469f721ea50de3b90a343bd240c5adaeca2b8812a32)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putEnd")
    def put_end(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__042a0109db8ef2f5f096d9c2417527123b000ba4789dede78246116d84f8f9b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEnd", [value]))

    @jsii.member(jsii_name="putStart")
    def put_start(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cdd436968fcdadf5a0feb48cf0f7b7f18bb99d235b1c1e01ed4bf1571eacb1c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putStart", [value]))

    @jsii.member(jsii_name="resetEnd")
    def reset_end(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnd", []))

    @jsii.member(jsii_name="resetStart")
    def reset_start(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStart", []))

    @builtins.property
    @jsii.member(jsii_name="end")
    def end(self) -> SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEndList:
        return typing.cast(SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEndList, jsii.get(self, "end"))

    @builtins.property
    @jsii.member(jsii_name="start")
    def start(
        self,
    ) -> "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStartList":
        return typing.cast("SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStartList", jsii.get(self, "start"))

    @builtins.property
    @jsii.member(jsii_name="endInput")
    def end_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd]]], jsii.get(self, "endInput"))

    @builtins.property
    @jsii.member(jsii_name="startInput")
    def start_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart"]]], jsii.get(self, "startInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce367140084e4d9ea93b6ccbc4d00b120e8069c0840a9d1bb546e353743e8b08)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart",
    jsii_struct_bases=[],
    name_mapping={"hour_of_day": "hourOfDay", "minute_of_hour": "minuteOfHour"},
)
class SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart:
    def __init__(
        self,
        *,
        hour_of_day: jsii.Number,
        minute_of_hour: jsii.Number,
    ) -> None:
        '''
        :param hour_of_day: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hour_of_day SsmcontactsRotation#hour_of_day}.
        :param minute_of_hour: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#minute_of_hour SsmcontactsRotation#minute_of_hour}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5912c02ede20a425d7b3778dbdbd3053714df261db5d857af13b1bf7b85024f6)
            check_type(argname="argument hour_of_day", value=hour_of_day, expected_type=type_hints["hour_of_day"])
            check_type(argname="argument minute_of_hour", value=minute_of_hour, expected_type=type_hints["minute_of_hour"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "hour_of_day": hour_of_day,
            "minute_of_hour": minute_of_hour,
        }

    @builtins.property
    def hour_of_day(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hour_of_day SsmcontactsRotation#hour_of_day}.'''
        result = self._values.get("hour_of_day")
        assert result is not None, "Required property 'hour_of_day' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def minute_of_hour(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#minute_of_hour SsmcontactsRotation#minute_of_hour}.'''
        result = self._values.get("minute_of_hour")
        assert result is not None, "Required property 'minute_of_hour' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStartList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStartList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__907d97ca480fd75445d0076d0809c2c5c9f739fd0b0eb00ac7d4526695592b61)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStartOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e057358fa7cfda9a2d4443b9966b4eb7da6934342ddcf150e1c9c1aa633262ae)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStartOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b99040e800da08691d3d73aad36dbaf8abffec9c2b444f9af2f19177385823d9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b254a7457783d437610a85a8e3d94d68f1b10ba48ec4d240cd6829418c70e204)
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
            type_hints = typing.get_type_hints(_typecheckingstub__071b75b817d86341b594960731ac66b848a5ee2378bfe003601ff2adee3c0955)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__049114537e877604d382ef9dbfddfd375aabc1e7029451159e0cb7ff957182dc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStartOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStartOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__784fadd7762b9e6ac47eef19b9297bcabb71775b3126a6e120ae9ed7ce9f4eeb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="hourOfDayInput")
    def hour_of_day_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "hourOfDayInput"))

    @builtins.property
    @jsii.member(jsii_name="minuteOfHourInput")
    def minute_of_hour_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minuteOfHourInput"))

    @builtins.property
    @jsii.member(jsii_name="hourOfDay")
    def hour_of_day(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "hourOfDay"))

    @hour_of_day.setter
    def hour_of_day(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ae7fb267c891696a86bf614cb25a1cfabea6a7494da24f00860ae7cc6efac70)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "hourOfDay", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minuteOfHour")
    def minute_of_hour(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minuteOfHour"))

    @minute_of_hour.setter
    def minute_of_hour(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__47bc9397646d5dfc357e9431020cbdc0e589b1faf749d0901b194c5e3ec84c2e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minuteOfHour", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61d8eaf6b411ad1afdd00cd8a79978d440e96d62453482279ec76f80038a7036)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceShiftCoveragesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9745d943a138c54843ded1a7f76b1cc65625151845edb03ab0764ebf46ee028e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmcontactsRotationRecurrenceShiftCoveragesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__079fd647ee6ef9a995cc0f4d4da9b0c7117b91309abe3f33ceffedc41b2faea4)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmcontactsRotationRecurrenceShiftCoveragesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2eb8d6da0057cfb6a0c6ce320f13de21cc1c694b4a87e8a993d38f3eabd0bdb6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8bb57f44e0a9bf3b811ec38ed769790c98f6b41bd137d8dc0ff6251bb104526a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__23d03266eb10d2ae3b4e02e9a0fd32f1934458f373b11d89b1bcfa4ad018c7a1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoverages]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoverages]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoverages]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__09e3dd6257cf94590ee0c1c1a6ea48e6438d56124db334cbd4ff48aa779692b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceShiftCoveragesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ddcec3c9f4f666b384c02f5549b621c0e81438406c8a2b8626300c6c37c636dd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putCoverageTimes")
    def put_coverage_times(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5fd6c14c69c6b9cdd7a9af38fb5243e35679589af78b9ec29fc6d66c3a329aa2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCoverageTimes", [value]))

    @jsii.member(jsii_name="resetCoverageTimes")
    def reset_coverage_times(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCoverageTimes", []))

    @builtins.property
    @jsii.member(jsii_name="coverageTimes")
    def coverage_times(
        self,
    ) -> SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesList:
        return typing.cast(SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesList, jsii.get(self, "coverageTimes"))

    @builtins.property
    @jsii.member(jsii_name="coverageTimesInput")
    def coverage_times_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes]]], jsii.get(self, "coverageTimesInput"))

    @builtins.property
    @jsii.member(jsii_name="mapBlockKeyInput")
    def map_block_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "mapBlockKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="mapBlockKey")
    def map_block_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mapBlockKey"))

    @map_block_key.setter
    def map_block_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__29bfb4fe67b49a6e60cf1676187c3a7045149d4593574f8e0512d04a05f55961)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mapBlockKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoverages]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoverages]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoverages]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__297c7d5d20641c0c42b2a6f2332caa6eaaaf3e1d5ff805c511cd7ceb999d7897)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceWeeklySettings",
    jsii_struct_bases=[],
    name_mapping={"day_of_week": "dayOfWeek", "hand_off_time": "handOffTime"},
)
class SsmcontactsRotationRecurrenceWeeklySettings:
    def __init__(
        self,
        *,
        day_of_week: builtins.str,
        hand_off_time: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param day_of_week: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#day_of_week SsmcontactsRotation#day_of_week}.
        :param hand_off_time: hand_off_time block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hand_off_time SsmcontactsRotation#hand_off_time}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__27e9caf5b57ca69b06ce62260c8f511093d7da16b449ade9ecc0b984989234a9)
            check_type(argname="argument day_of_week", value=day_of_week, expected_type=type_hints["day_of_week"])
            check_type(argname="argument hand_off_time", value=hand_off_time, expected_type=type_hints["hand_off_time"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "day_of_week": day_of_week,
        }
        if hand_off_time is not None:
            self._values["hand_off_time"] = hand_off_time

    @builtins.property
    def day_of_week(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#day_of_week SsmcontactsRotation#day_of_week}.'''
        result = self._values.get("day_of_week")
        assert result is not None, "Required property 'day_of_week' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def hand_off_time(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime"]]]:
        '''hand_off_time block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hand_off_time SsmcontactsRotation#hand_off_time}
        '''
        result = self._values.get("hand_off_time")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsRotationRecurrenceWeeklySettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime",
    jsii_struct_bases=[],
    name_mapping={"hour_of_day": "hourOfDay", "minute_of_hour": "minuteOfHour"},
)
class SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime:
    def __init__(
        self,
        *,
        hour_of_day: jsii.Number,
        minute_of_hour: jsii.Number,
    ) -> None:
        '''
        :param hour_of_day: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hour_of_day SsmcontactsRotation#hour_of_day}.
        :param minute_of_hour: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#minute_of_hour SsmcontactsRotation#minute_of_hour}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2480751ce719a05bf5cdecb5330a3cab8f4f8c9795b072c7bcda8150afab525c)
            check_type(argname="argument hour_of_day", value=hour_of_day, expected_type=type_hints["hour_of_day"])
            check_type(argname="argument minute_of_hour", value=minute_of_hour, expected_type=type_hints["minute_of_hour"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "hour_of_day": hour_of_day,
            "minute_of_hour": minute_of_hour,
        }

    @builtins.property
    def hour_of_day(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#hour_of_day SsmcontactsRotation#hour_of_day}.'''
        result = self._values.get("hour_of_day")
        assert result is not None, "Required property 'hour_of_day' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def minute_of_hour(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#minute_of_hour SsmcontactsRotation#minute_of_hour}.'''
        result = self._values.get("minute_of_hour")
        assert result is not None, "Required property 'minute_of_hour' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmcontactsRotationRecurrenceWeeklySettingsHandOffTimeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceWeeklySettingsHandOffTimeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__255f31f8f2583005325bc2525e2e096b12d480432dad1f3987df9e17b33f3a9b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmcontactsRotationRecurrenceWeeklySettingsHandOffTimeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd7d3fc0c692f64cfdb1ee86717a39a19501da41ae687692c7c6b83ec3b14879)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmcontactsRotationRecurrenceWeeklySettingsHandOffTimeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4aed85d4b2a5089a3b5ef06eea381a09951af4909b96a43e85b66a6a791054f2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6ed37fb3a14146296c1074477f954c633743fb319803b26fbdcf14b20dcbf5c8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d2e0999311f482838aa68c3e91cf9024cfbbbb67090557620a2918cc5281ec5b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56eb0c5f71015bfce1f0edc6f2601fd2547f75865da1da5f64a3c3534522865a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceWeeklySettingsHandOffTimeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceWeeklySettingsHandOffTimeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ec09b388fbb6e873a8a1a0fc828edd78679319af655988bb2ef78889c32110fc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="hourOfDayInput")
    def hour_of_day_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "hourOfDayInput"))

    @builtins.property
    @jsii.member(jsii_name="minuteOfHourInput")
    def minute_of_hour_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minuteOfHourInput"))

    @builtins.property
    @jsii.member(jsii_name="hourOfDay")
    def hour_of_day(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "hourOfDay"))

    @hour_of_day.setter
    def hour_of_day(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a59f3ea0f3a2a0437161a82673d395c989577a5665845a82db4beb275ef9781)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "hourOfDay", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minuteOfHour")
    def minute_of_hour(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minuteOfHour"))

    @minute_of_hour.setter
    def minute_of_hour(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3ddcd667182545df093294f1ce08c2586f7971706bc730b7d01eeb627393d7f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minuteOfHour", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1278eabd6e12448481ef5d014c6da7bace62b334c88dba8747bd27d98052615c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceWeeklySettingsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceWeeklySettingsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fc9ffa82888e02e838d486c8298b9aa2641a442ef49905bac9ac19f31a096b97)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmcontactsRotationRecurrenceWeeklySettingsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__44f7d410d32a8ff1604a7ed20fa662aaddd144b4e7a400140005b9cb8492eaa4)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmcontactsRotationRecurrenceWeeklySettingsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__843b46cd097b50e217a1b731fa4c49a37f4b3c3ee1881bdd3f8d9ac1d312f970)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5f9a444e79b3810f03ae68f2a313686a6026bc5ff925a9ca5550b68b8e013cdf)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0e77d3bf20a33950f9b800e794f6b112d189ebf736454d308fb210debb4c271b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceWeeklySettings]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceWeeklySettings]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceWeeklySettings]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5cdf4324b9fc3c31c81cfda6830a13d02f1a41cac083c51e9308345dee593086)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmcontactsRotationRecurrenceWeeklySettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceWeeklySettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2c6ca970a916c92bb715140a3803faf4e76bc4df4dff552d97fc80121f3c0540)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putHandOffTime")
    def put_hand_off_time(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__090d41f8f9b9550ae28fbea6ea7df8c5d80cf4bba762c57aa6658454ced4a4ad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putHandOffTime", [value]))

    @jsii.member(jsii_name="resetHandOffTime")
    def reset_hand_off_time(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHandOffTime", []))

    @builtins.property
    @jsii.member(jsii_name="handOffTime")
    def hand_off_time(
        self,
    ) -> SsmcontactsRotationRecurrenceWeeklySettingsHandOffTimeList:
        return typing.cast(SsmcontactsRotationRecurrenceWeeklySettingsHandOffTimeList, jsii.get(self, "handOffTime"))

    @builtins.property
    @jsii.member(jsii_name="dayOfWeekInput")
    def day_of_week_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dayOfWeekInput"))

    @builtins.property
    @jsii.member(jsii_name="handOffTimeInput")
    def hand_off_time_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime]]], jsii.get(self, "handOffTimeInput"))

    @builtins.property
    @jsii.member(jsii_name="dayOfWeek")
    def day_of_week(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dayOfWeek"))

    @day_of_week.setter
    def day_of_week(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f5160b1d9da01d24e9b19416e6531395b2183341defae3dd39ad066c555d4b1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dayOfWeek", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceWeeklySettings]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceWeeklySettings]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceWeeklySettings]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e238de38e41b063f5cdfd008b5576161cb269adecae3f662bed2d87b662b1984)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "SsmcontactsRotation",
    "SsmcontactsRotationConfig",
    "SsmcontactsRotationRecurrence",
    "SsmcontactsRotationRecurrenceDailySettings",
    "SsmcontactsRotationRecurrenceDailySettingsList",
    "SsmcontactsRotationRecurrenceDailySettingsOutputReference",
    "SsmcontactsRotationRecurrenceList",
    "SsmcontactsRotationRecurrenceMonthlySettings",
    "SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime",
    "SsmcontactsRotationRecurrenceMonthlySettingsHandOffTimeList",
    "SsmcontactsRotationRecurrenceMonthlySettingsHandOffTimeOutputReference",
    "SsmcontactsRotationRecurrenceMonthlySettingsList",
    "SsmcontactsRotationRecurrenceMonthlySettingsOutputReference",
    "SsmcontactsRotationRecurrenceOutputReference",
    "SsmcontactsRotationRecurrenceShiftCoverages",
    "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes",
    "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd",
    "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEndList",
    "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEndOutputReference",
    "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesList",
    "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesOutputReference",
    "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart",
    "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStartList",
    "SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStartOutputReference",
    "SsmcontactsRotationRecurrenceShiftCoveragesList",
    "SsmcontactsRotationRecurrenceShiftCoveragesOutputReference",
    "SsmcontactsRotationRecurrenceWeeklySettings",
    "SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime",
    "SsmcontactsRotationRecurrenceWeeklySettingsHandOffTimeList",
    "SsmcontactsRotationRecurrenceWeeklySettingsHandOffTimeOutputReference",
    "SsmcontactsRotationRecurrenceWeeklySettingsList",
    "SsmcontactsRotationRecurrenceWeeklySettingsOutputReference",
]

publication.publish()

def _typecheckingstub__04d019c5309453849088aa257a42ae412a8edbd2572ec38d84ffaee5116d0d06(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    contact_ids: typing.Sequence[builtins.str],
    name: builtins.str,
    time_zone_id: builtins.str,
    recurrence: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrence, typing.Dict[builtins.str, typing.Any]]]]] = None,
    start_time: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
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

def _typecheckingstub__02f6eee7ae4669a96b93fb9fdd269c7675859366161a98eec787f51c45d4f179(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6e7808929c28c50e811412be9e390862ed36666f84590be8c7b8d63647b940a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrence, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__907cb3c12ad91bbb0d1d7c35913388d1a8122601829322afe3baef8280a05b83(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1a47a02a3516d808272e07f37563614eb166daa8ac160dbe7aa9c45699ae058(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3caaf0de71e5d257025f9a31afb96d5360f8aa3476737d2971bd78363a8ab50(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e28e227b8f3a50c2b36636a381cab0a681574e77748f3f232b97b3ecb26051c4(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f0eaa0ae3c91756fbf8cbad6973ee0c2fdb71807e35156d13907a39157a56b1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f88c394eafd4c12727de4e146acbf22b30282b1c4de09cd1f51705c0e2e9136c(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    contact_ids: typing.Sequence[builtins.str],
    name: builtins.str,
    time_zone_id: builtins.str,
    recurrence: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrence, typing.Dict[builtins.str, typing.Any]]]]] = None,
    start_time: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e702b8c2613e8a23ba3ac44ec6c58e15cd9df19bc498b45ef6021a5b0808a0d(
    *,
    number_of_on_calls: jsii.Number,
    recurrence_multiplier: jsii.Number,
    daily_settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceDailySettings, typing.Dict[builtins.str, typing.Any]]]]] = None,
    monthly_settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceMonthlySettings, typing.Dict[builtins.str, typing.Any]]]]] = None,
    shift_coverages: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceShiftCoverages, typing.Dict[builtins.str, typing.Any]]]]] = None,
    weekly_settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceWeeklySettings, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4fce565bee4538291bb3bfd811d19c4a2743f297bbb2d457c567699cfcba398d(
    *,
    hour_of_day: jsii.Number,
    minute_of_hour: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d0419b0f9dca8343b83287ecb95438886329f9df4ab65eeb9e2b9335aeca751(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__63c4ae1901225bf2c2cdc769d27df2288b8347f978654330ee0fff93dfdabfe3(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2e0fea3d6aa6f80f44f8dad939618b82b34f0e19fecc99757076d79e536ff20(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__821d3bc1f1efcc1b9eae50c0cd9d175195f7a9bf3fe9f8d5c041be6806616071(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61e4c176c7cabfe74b903657e7b7c55c8b52284d2a0021fd3bb744a1635063f4(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc95e79ad394f3bf39863dc76f45d69ddb7d9eef08502d4c6c3422eda1c18648(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceDailySettings]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d4f845d96d0f83c3a5c1e81ee888f3764d7704a2b44b5dce984321bd8e5c6a4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33a860382a706f390c5f7a181879d26d6001fd28a603b7280fda36432ae982ac(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d45565d3ec1313b1da8bc80e4915e272e56f3eb0fd05a5fa3e5d316985626b6(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23429ad169f5a77287210e0a8decc1822e8a98a8234bc7f1aa931c2551c89d9c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceDailySettings]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22e8ba25744fd9f2671a22460fec0a9336bd1b71f25a3c98a9cdcdb9ea4b542a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__581d9426fdd2096883de0b1cb43ccdfa801edd2cb0d7710467cabf5cac7dfbee(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3b0c38a86a8f9f69cd746d4dce3ee6f5b628a97221b3bb7047dcbad319c8cbb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c75df87f60eb28478289ba6f2ecc8cd83ee2edb9cff3288b5764800e6fbff68d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33aa006240b66bf0e36948dbe32bf11cab595d57574947ac41bcfe6b3e327aa5(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__97c534282073b5fe42751cd846a9ab5a24286e8bc961fcc4e8a2448e7ad0b5c5(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrence]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__825c8f751e7f474acd7828cf58d04f04530f62259b844413372ce3cb7b66428b(
    *,
    day_of_month: jsii.Number,
    hand_off_time: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__408b8802781c096d67e1051b20f2946cd81802b7b48e6a7bddae6ede52605448(
    *,
    hour_of_day: jsii.Number,
    minute_of_hour: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f89ddd771f04a908be2317ae5ec8e3eb53f2648b9f89db6ba8538495ced17bad(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3aa136aec72d778823e9e2c27964af3d20e871cbaad003b5e45b26b958d6f48(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f94e6bc1034a1743b32cf1cdd148ca4e636f4ed99f86a42731c906207feabe23(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0d43f483bdc8088268e98fecce3c572f012f60cfac27806e93d81d0c5f0648f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72f5eb76c48b5b1b0552b9f4c61ffeabefd53516ce67d8f15a8760ae2b5cd601(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76e763aaa1dbbe64befcc17e15090faeac04610734f69f9c5e04a6ab12cac139(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a50ce36d59cb4126734944badd50eba963087fec1928155fd20591c6ae6d49a8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3ef172e4f1a180c764d76feeee52240cafac80753859afa6c0f4a3038ca50c6(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0920ba1065651188097dab74eac789d3e8fb889d7d9490a4d9d53a78363572d6(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1c22f3943ec122fa9f2f7c21dcc1d049f9a420f520e4af5a4a7dd4fd7ccd2fc(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4615310e38b8d5b15cd056b93fc9248b131fa9d77f2c048bc9744e0bc1c46a97(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a995dc84aee4a1c27e35f06880181f0b9ad9f0ff2edf8aa4d436a8f0b41861b(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1433e261d2af7d51a5050e6f493096154c1643ac233ccbb87103271fe40d05e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__de85ab55c117926bd27fbf234f4948f6eb8e65d53934659e509464f94d473e73(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb84507e43c3e3e7768bd9273f30bc76ee8b43b83e5905090eb52ef0267b11e5(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ec7c388a95b60bfef6a09c852e1123fa287242840a1d7ba60acfff9be66cdf1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceMonthlySettings]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8a9ace8151bc57f1852a7af3980212335f10d94a6125624b86b6c8988a7bba2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e147bc7a2403a74f41ddf751d82ab3d622524ee88c66b232ec27a998eb65db4(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceMonthlySettingsHandOffTime, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__850afe09470d5abb911c1b74e0bf02440cce2cc5a8ce92cbdfd2074fe2237a39(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6d5401690279b4966fb2017066de56bb08a5585110b654b76128462d00aff43(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceMonthlySettings]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a14bc5a92e89d9768c21769968ac4f24e5a759aaf5c1ca574979e46c1e1a6b32(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__790cb6d3c29b6645a16692f51c98f9883d960377f1c14a68a1c9a26edcaab401(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceDailySettings, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59311bd625087af7d602fac372a96ffaca6936ca9aed39a4a9c2d48fcb86d858(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceMonthlySettings, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ceda80ef50837c9d79dbc798c5cfecb63e761c025f7222bcbfe78520d747ad00(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceShiftCoverages, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc7a18d453de24b8f30ad82e2cfe026e7f9826084a822248dd4844b672ecdb97(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceWeeklySettings, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7fd3610c2bf731ffa02e4966908d592029157df6197760635f0de093e2cd9455(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4b3dbbd2f946e95f79c54fd95da4ef45597896b1f270779481cedd7fb1c8719(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9ae3b88badac0910769f1176cbca2aff7ecb3b39df6d8713633d47e2268122d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrence]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3436ec01d1856d1bd9c184cb97de3c4b825a59c78b8920d0bbf4b78523e55a52(
    *,
    map_block_key: builtins.str,
    coverage_times: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f405fffaf4359c791e0decf6ade75e3b5475499d47ff61e46c38d6376dd933f(
    *,
    end: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd, typing.Dict[builtins.str, typing.Any]]]]] = None,
    start: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac17086c2e5754743f2f6aa5848daeaaaadd859915acd44d1183adee8fe79f27(
    *,
    hour_of_day: jsii.Number,
    minute_of_hour: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d5f1a680f51a2f1766b343b1e98a61eae90da7d0ad8aa3c4eab7ff7665dfda2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f3effe5428e7db673ab3b00667489ff7be41b7763304ca7eb33d1a7da722a0a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed1aa396a1958fe47e10cae933e8eb4ee2206ab8c067e8d592141cce39c6171a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__500b10b9c65d9b0de075fde995e6543bfb944c4a3cd5c49749c74792b0b12729(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f099a3ad8a435f78528f948fb4eab45cc3b51604cc77a1d3b032f1cf0289f9e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59c0b7073145ea5303e0f8789f7cd4183938ba831555b82d288a704154c6e103(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e978c84789e75d383b4117fa2c268a058e917e45b3a30e3f792774a979b37cb1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7bafba24d80fbb6d30f291eb177a3b9d4c35ad795d3f16e999e89cabc062177(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8aeb03a71bd2b5d011acd8b6708b0dfffa054b257f1fbd1324ac270fbe9afe26(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__462d333f39fbc274c1efa26f2adaea4b1a9cb2cac0ea4b42eb0242ad74fab041(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec30b8121c7ff0279d4bc2fde31bc1209784965070068c36d7443779cae62e05(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2547722501f459959650b82302b1b0bfa61952dd11fbc7fff275202142c88989(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3648b6e536f9a916b296f0b20dcc465fd9f5878ef6469af451e053c98f8a86af(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68b5dae5355cf6f9f89909b3f101724e3b784f6da4d553959a750742ef5b1835(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f2ff403e94cd8bc4062039a61359acd8ca8e44b667e3ba54b5edf1a6f90f5ad(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__603d2a428026a1953da3c7c4077abea7e9feb0524b77a433d44f704ae3613360(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dfffa4f186ff34fced25f469f721ea50de3b90a343bd240c5adaeca2b8812a32(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__042a0109db8ef2f5f096d9c2417527123b000ba4789dede78246116d84f8f9b3(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cdd436968fcdadf5a0feb48cf0f7b7f18bb99d235b1c1e01ed4bf1571eacb1c4(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce367140084e4d9ea93b6ccbc4d00b120e8069c0840a9d1bb546e353743e8b08(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5912c02ede20a425d7b3778dbdbd3053714df261db5d857af13b1bf7b85024f6(
    *,
    hour_of_day: jsii.Number,
    minute_of_hour: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__907d97ca480fd75445d0076d0809c2c5c9f739fd0b0eb00ac7d4526695592b61(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e057358fa7cfda9a2d4443b9966b4eb7da6934342ddcf150e1c9c1aa633262ae(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b99040e800da08691d3d73aad36dbaf8abffec9c2b444f9af2f19177385823d9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b254a7457783d437610a85a8e3d94d68f1b10ba48ec4d240cd6829418c70e204(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__071b75b817d86341b594960731ac66b848a5ee2378bfe003601ff2adee3c0955(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__049114537e877604d382ef9dbfddfd375aabc1e7029451159e0cb7ff957182dc(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__784fadd7762b9e6ac47eef19b9297bcabb71775b3126a6e120ae9ed7ce9f4eeb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ae7fb267c891696a86bf614cb25a1cfabea6a7494da24f00860ae7cc6efac70(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__47bc9397646d5dfc357e9431020cbdc0e589b1faf749d0901b194c5e3ec84c2e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61d8eaf6b411ad1afdd00cd8a79978d440e96d62453482279ec76f80038a7036(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9745d943a138c54843ded1a7f76b1cc65625151845edb03ab0764ebf46ee028e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__079fd647ee6ef9a995cc0f4d4da9b0c7117b91309abe3f33ceffedc41b2faea4(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2eb8d6da0057cfb6a0c6ce320f13de21cc1c694b4a87e8a993d38f3eabd0bdb6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8bb57f44e0a9bf3b811ec38ed769790c98f6b41bd137d8dc0ff6251bb104526a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23d03266eb10d2ae3b4e02e9a0fd32f1934458f373b11d89b1bcfa4ad018c7a1(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09e3dd6257cf94590ee0c1c1a6ea48e6438d56124db334cbd4ff48aa779692b4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceShiftCoverages]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ddcec3c9f4f666b384c02f5549b621c0e81438406c8a2b8626300c6c37c636dd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5fd6c14c69c6b9cdd7a9af38fb5243e35679589af78b9ec29fc6d66c3a329aa2(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29bfb4fe67b49a6e60cf1676187c3a7045149d4593574f8e0512d04a05f55961(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__297c7d5d20641c0c42b2a6f2332caa6eaaaf3e1d5ff805c511cd7ceb999d7897(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceShiftCoverages]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27e9caf5b57ca69b06ce62260c8f511093d7da16b449ade9ecc0b984989234a9(
    *,
    day_of_week: builtins.str,
    hand_off_time: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2480751ce719a05bf5cdecb5330a3cab8f4f8c9795b072c7bcda8150afab525c(
    *,
    hour_of_day: jsii.Number,
    minute_of_hour: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__255f31f8f2583005325bc2525e2e096b12d480432dad1f3987df9e17b33f3a9b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd7d3fc0c692f64cfdb1ee86717a39a19501da41ae687692c7c6b83ec3b14879(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4aed85d4b2a5089a3b5ef06eea381a09951af4909b96a43e85b66a6a791054f2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ed37fb3a14146296c1074477f954c633743fb319803b26fbdcf14b20dcbf5c8(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2e0999311f482838aa68c3e91cf9024cfbbbb67090557620a2918cc5281ec5b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56eb0c5f71015bfce1f0edc6f2601fd2547f75865da1da5f64a3c3534522865a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec09b388fbb6e873a8a1a0fc828edd78679319af655988bb2ef78889c32110fc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a59f3ea0f3a2a0437161a82673d395c989577a5665845a82db4beb275ef9781(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3ddcd667182545df093294f1ce08c2586f7971706bc730b7d01eeb627393d7f(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1278eabd6e12448481ef5d014c6da7bace62b334c88dba8747bd27d98052615c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc9ffa82888e02e838d486c8298b9aa2641a442ef49905bac9ac19f31a096b97(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44f7d410d32a8ff1604a7ed20fa662aaddd144b4e7a400140005b9cb8492eaa4(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__843b46cd097b50e217a1b731fa4c49a37f4b3c3ee1881bdd3f8d9ac1d312f970(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f9a444e79b3810f03ae68f2a313686a6026bc5ff925a9ca5550b68b8e013cdf(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e77d3bf20a33950f9b800e794f6b112d189ebf736454d308fb210debb4c271b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5cdf4324b9fc3c31c81cfda6830a13d02f1a41cac083c51e9308345dee593086(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmcontactsRotationRecurrenceWeeklySettings]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c6ca970a916c92bb715140a3803faf4e76bc4df4dff552d97fc80121f3c0540(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__090d41f8f9b9550ae28fbea6ea7df8c5d80cf4bba762c57aa6658454ced4a4ad(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmcontactsRotationRecurrenceWeeklySettingsHandOffTime, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f5160b1d9da01d24e9b19416e6531395b2183341defae3dd39ad066c555d4b1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e238de38e41b063f5cdfd008b5576161cb269adecae3f662bed2d87b662b1984(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmcontactsRotationRecurrenceWeeklySettings]],
) -> None:
    """Type checking stubs"""
    pass
