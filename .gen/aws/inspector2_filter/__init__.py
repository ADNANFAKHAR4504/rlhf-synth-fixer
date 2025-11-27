r'''
# `aws_inspector2_filter`

Refer to the Terraform Registry for docs: [`aws_inspector2_filter`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter).
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


class Inspector2Filter(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2Filter",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter aws_inspector2_filter}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        action: builtins.str,
        name: builtins.str,
        description: typing.Optional[builtins.str] = None,
        filter_criteria: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteria", typing.Dict[builtins.str, typing.Any]]]]] = None,
        reason: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter aws_inspector2_filter} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param action: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#action Inspector2Filter#action}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#name Inspector2Filter#name}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#description Inspector2Filter#description}.
        :param filter_criteria: filter_criteria block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#filter_criteria Inspector2Filter#filter_criteria}
        :param reason: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#reason Inspector2Filter#reason}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#tags Inspector2Filter#tags}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1fc564ea8ee1f284d6e1d7c16580579304c5cddababf34c509d722ad331e8327)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = Inspector2FilterConfig(
            action=action,
            name=name,
            description=description,
            filter_criteria=filter_criteria,
            reason=reason,
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
        '''Generates CDKTF code for importing a Inspector2Filter resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Inspector2Filter to import.
        :param import_from_id: The id of the existing Inspector2Filter that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Inspector2Filter to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8fe800afa6b1c97174d8be94e3e5e016bca0c6dbeceea2e52b9cc18c14968e89)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putFilterCriteria")
    def put_filter_criteria(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteria", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46072afcf128356f8ec9ee69e65906eed5c770bc65932df1ed393af76562b4ea)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFilterCriteria", [value]))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetFilterCriteria")
    def reset_filter_criteria(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilterCriteria", []))

    @jsii.member(jsii_name="resetReason")
    def reset_reason(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReason", []))

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
    @jsii.member(jsii_name="filterCriteria")
    def filter_criteria(self) -> "Inspector2FilterFilterCriteriaList":
        return typing.cast("Inspector2FilterFilterCriteriaList", jsii.get(self, "filterCriteria"))

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> _cdktf_9a9027ec.StringMap:
        return typing.cast(_cdktf_9a9027ec.StringMap, jsii.get(self, "tagsAll"))

    @builtins.property
    @jsii.member(jsii_name="actionInput")
    def action_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "actionInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="filterCriteriaInput")
    def filter_criteria_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteria"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteria"]]], jsii.get(self, "filterCriteriaInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="reasonInput")
    def reason_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "reasonInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="action")
    def action(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "action"))

    @action.setter
    def action(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__63e0e121782cd57e6e5da930e43a28dd89950b73b39a795faa2f9adcffe51513)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "action", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__403aa792ab9d1dd6740fdd29eb0bf3d4e697087f3f9bdc7f26ac509b56306783)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9cd816e20bcfc349f2364eab53e43a7bbbd85e5ac72ca168ea6c7251599819fc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="reason")
    def reason(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "reason"))

    @reason.setter
    def reason(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__016a94a78206b33be8ae55472205594a98a575d1b6ce713d3dbd6cc82c7666fc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "reason", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cfac81f02012d41d679335e7ee83132345ea95efb26a5f20eb3f4b63f343535e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "action": "action",
        "name": "name",
        "description": "description",
        "filter_criteria": "filterCriteria",
        "reason": "reason",
        "tags": "tags",
    },
)
class Inspector2FilterConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        action: builtins.str,
        name: builtins.str,
        description: typing.Optional[builtins.str] = None,
        filter_criteria: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteria", typing.Dict[builtins.str, typing.Any]]]]] = None,
        reason: typing.Optional[builtins.str] = None,
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
        :param action: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#action Inspector2Filter#action}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#name Inspector2Filter#name}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#description Inspector2Filter#description}.
        :param filter_criteria: filter_criteria block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#filter_criteria Inspector2Filter#filter_criteria}
        :param reason: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#reason Inspector2Filter#reason}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#tags Inspector2Filter#tags}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__53fe43733e4051bf1a30119e48cdf1cecbb1b726b1c264c8776282abd77da7e1)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument action", value=action, expected_type=type_hints["action"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument filter_criteria", value=filter_criteria, expected_type=type_hints["filter_criteria"])
            check_type(argname="argument reason", value=reason, expected_type=type_hints["reason"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "action": action,
            "name": name,
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
        if filter_criteria is not None:
            self._values["filter_criteria"] = filter_criteria
        if reason is not None:
            self._values["reason"] = reason
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
    def action(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#action Inspector2Filter#action}.'''
        result = self._values.get("action")
        assert result is not None, "Required property 'action' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#name Inspector2Filter#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#description Inspector2Filter#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def filter_criteria(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteria"]]]:
        '''filter_criteria block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#filter_criteria Inspector2Filter#filter_criteria}
        '''
        result = self._values.get("filter_criteria")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteria"]]], result)

    @builtins.property
    def reason(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#reason Inspector2Filter#reason}.'''
        result = self._values.get("reason")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#tags Inspector2Filter#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteria",
    jsii_struct_bases=[],
    name_mapping={
        "aws_account_id": "awsAccountId",
        "code_vulnerability_detector_name": "codeVulnerabilityDetectorName",
        "code_vulnerability_detector_tags": "codeVulnerabilityDetectorTags",
        "code_vulnerability_file_path": "codeVulnerabilityFilePath",
        "component_id": "componentId",
        "component_type": "componentType",
        "ec2_instance_image_id": "ec2InstanceImageId",
        "ec2_instance_subnet_id": "ec2InstanceSubnetId",
        "ec2_instance_vpc_id": "ec2InstanceVpcId",
        "ecr_image_architecture": "ecrImageArchitecture",
        "ecr_image_hash": "ecrImageHash",
        "ecr_image_pushed_at": "ecrImagePushedAt",
        "ecr_image_registry": "ecrImageRegistry",
        "ecr_image_repository_name": "ecrImageRepositoryName",
        "ecr_image_tags": "ecrImageTags",
        "epss_score": "epssScore",
        "exploit_available": "exploitAvailable",
        "finding_arn": "findingArn",
        "finding_status": "findingStatus",
        "finding_type": "findingType",
        "first_observed_at": "firstObservedAt",
        "fix_available": "fixAvailable",
        "inspector_score": "inspectorScore",
        "lambda_function_execution_role_arn": "lambdaFunctionExecutionRoleArn",
        "lambda_function_last_modified_at": "lambdaFunctionLastModifiedAt",
        "lambda_function_layers": "lambdaFunctionLayers",
        "lambda_function_name": "lambdaFunctionName",
        "lambda_function_runtime": "lambdaFunctionRuntime",
        "last_observed_at": "lastObservedAt",
        "network_protocol": "networkProtocol",
        "port_range": "portRange",
        "related_vulnerabilities": "relatedVulnerabilities",
        "resource_id": "resourceId",
        "resource_tags": "resourceTags",
        "resource_type": "resourceType",
        "severity": "severity",
        "title": "title",
        "updated_at": "updatedAt",
        "vendor_severity": "vendorSeverity",
        "vulnerability_id": "vulnerabilityId",
        "vulnerability_source": "vulnerabilitySource",
        "vulnerable_packages": "vulnerablePackages",
    },
)
class Inspector2FilterFilterCriteria:
    def __init__(
        self,
        *,
        aws_account_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaAwsAccountId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        code_vulnerability_detector_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName", typing.Dict[builtins.str, typing.Any]]]]] = None,
        code_vulnerability_detector_tags: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags", typing.Dict[builtins.str, typing.Any]]]]] = None,
        code_vulnerability_file_path: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath", typing.Dict[builtins.str, typing.Any]]]]] = None,
        component_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaComponentId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        component_type: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaComponentType", typing.Dict[builtins.str, typing.Any]]]]] = None,
        ec2_instance_image_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaEc2InstanceImageId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        ec2_instance_subnet_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaEc2InstanceSubnetId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        ec2_instance_vpc_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaEc2InstanceVpcId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        ecr_image_architecture: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaEcrImageArchitecture", typing.Dict[builtins.str, typing.Any]]]]] = None,
        ecr_image_hash: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaEcrImageHash", typing.Dict[builtins.str, typing.Any]]]]] = None,
        ecr_image_pushed_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaEcrImagePushedAt", typing.Dict[builtins.str, typing.Any]]]]] = None,
        ecr_image_registry: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaEcrImageRegistry", typing.Dict[builtins.str, typing.Any]]]]] = None,
        ecr_image_repository_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaEcrImageRepositoryName", typing.Dict[builtins.str, typing.Any]]]]] = None,
        ecr_image_tags: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaEcrImageTags", typing.Dict[builtins.str, typing.Any]]]]] = None,
        epss_score: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaEpssScore", typing.Dict[builtins.str, typing.Any]]]]] = None,
        exploit_available: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaExploitAvailable", typing.Dict[builtins.str, typing.Any]]]]] = None,
        finding_arn: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaFindingArn", typing.Dict[builtins.str, typing.Any]]]]] = None,
        finding_status: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaFindingStatus", typing.Dict[builtins.str, typing.Any]]]]] = None,
        finding_type: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaFindingType", typing.Dict[builtins.str, typing.Any]]]]] = None,
        first_observed_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaFirstObservedAt", typing.Dict[builtins.str, typing.Any]]]]] = None,
        fix_available: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaFixAvailable", typing.Dict[builtins.str, typing.Any]]]]] = None,
        inspector_score: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaInspectorScore", typing.Dict[builtins.str, typing.Any]]]]] = None,
        lambda_function_execution_role_arn: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn", typing.Dict[builtins.str, typing.Any]]]]] = None,
        lambda_function_last_modified_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt", typing.Dict[builtins.str, typing.Any]]]]] = None,
        lambda_function_layers: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaLambdaFunctionLayers", typing.Dict[builtins.str, typing.Any]]]]] = None,
        lambda_function_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaLambdaFunctionName", typing.Dict[builtins.str, typing.Any]]]]] = None,
        lambda_function_runtime: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaLambdaFunctionRuntime", typing.Dict[builtins.str, typing.Any]]]]] = None,
        last_observed_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaLastObservedAt", typing.Dict[builtins.str, typing.Any]]]]] = None,
        network_protocol: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaNetworkProtocol", typing.Dict[builtins.str, typing.Any]]]]] = None,
        port_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaPortRange", typing.Dict[builtins.str, typing.Any]]]]] = None,
        related_vulnerabilities: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaRelatedVulnerabilities", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaResourceId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_tags: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaResourceTags", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_type: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaResourceType", typing.Dict[builtins.str, typing.Any]]]]] = None,
        severity: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaSeverity", typing.Dict[builtins.str, typing.Any]]]]] = None,
        title: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaTitle", typing.Dict[builtins.str, typing.Any]]]]] = None,
        updated_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaUpdatedAt", typing.Dict[builtins.str, typing.Any]]]]] = None,
        vendor_severity: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVendorSeverity", typing.Dict[builtins.str, typing.Any]]]]] = None,
        vulnerability_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerabilityId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        vulnerability_source: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerabilitySource", typing.Dict[builtins.str, typing.Any]]]]] = None,
        vulnerable_packages: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackages", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param aws_account_id: aws_account_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#aws_account_id Inspector2Filter#aws_account_id}
        :param code_vulnerability_detector_name: code_vulnerability_detector_name block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#code_vulnerability_detector_name Inspector2Filter#code_vulnerability_detector_name}
        :param code_vulnerability_detector_tags: code_vulnerability_detector_tags block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#code_vulnerability_detector_tags Inspector2Filter#code_vulnerability_detector_tags}
        :param code_vulnerability_file_path: code_vulnerability_file_path block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#code_vulnerability_file_path Inspector2Filter#code_vulnerability_file_path}
        :param component_id: component_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#component_id Inspector2Filter#component_id}
        :param component_type: component_type block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#component_type Inspector2Filter#component_type}
        :param ec2_instance_image_id: ec2_instance_image_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ec2_instance_image_id Inspector2Filter#ec2_instance_image_id}
        :param ec2_instance_subnet_id: ec2_instance_subnet_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ec2_instance_subnet_id Inspector2Filter#ec2_instance_subnet_id}
        :param ec2_instance_vpc_id: ec2_instance_vpc_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ec2_instance_vpc_id Inspector2Filter#ec2_instance_vpc_id}
        :param ecr_image_architecture: ecr_image_architecture block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ecr_image_architecture Inspector2Filter#ecr_image_architecture}
        :param ecr_image_hash: ecr_image_hash block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ecr_image_hash Inspector2Filter#ecr_image_hash}
        :param ecr_image_pushed_at: ecr_image_pushed_at block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ecr_image_pushed_at Inspector2Filter#ecr_image_pushed_at}
        :param ecr_image_registry: ecr_image_registry block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ecr_image_registry Inspector2Filter#ecr_image_registry}
        :param ecr_image_repository_name: ecr_image_repository_name block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ecr_image_repository_name Inspector2Filter#ecr_image_repository_name}
        :param ecr_image_tags: ecr_image_tags block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ecr_image_tags Inspector2Filter#ecr_image_tags}
        :param epss_score: epss_score block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#epss_score Inspector2Filter#epss_score}
        :param exploit_available: exploit_available block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#exploit_available Inspector2Filter#exploit_available}
        :param finding_arn: finding_arn block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#finding_arn Inspector2Filter#finding_arn}
        :param finding_status: finding_status block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#finding_status Inspector2Filter#finding_status}
        :param finding_type: finding_type block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#finding_type Inspector2Filter#finding_type}
        :param first_observed_at: first_observed_at block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#first_observed_at Inspector2Filter#first_observed_at}
        :param fix_available: fix_available block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#fix_available Inspector2Filter#fix_available}
        :param inspector_score: inspector_score block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#inspector_score Inspector2Filter#inspector_score}
        :param lambda_function_execution_role_arn: lambda_function_execution_role_arn block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lambda_function_execution_role_arn Inspector2Filter#lambda_function_execution_role_arn}
        :param lambda_function_last_modified_at: lambda_function_last_modified_at block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lambda_function_last_modified_at Inspector2Filter#lambda_function_last_modified_at}
        :param lambda_function_layers: lambda_function_layers block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lambda_function_layers Inspector2Filter#lambda_function_layers}
        :param lambda_function_name: lambda_function_name block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lambda_function_name Inspector2Filter#lambda_function_name}
        :param lambda_function_runtime: lambda_function_runtime block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lambda_function_runtime Inspector2Filter#lambda_function_runtime}
        :param last_observed_at: last_observed_at block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#last_observed_at Inspector2Filter#last_observed_at}
        :param network_protocol: network_protocol block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#network_protocol Inspector2Filter#network_protocol}
        :param port_range: port_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#port_range Inspector2Filter#port_range}
        :param related_vulnerabilities: related_vulnerabilities block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#related_vulnerabilities Inspector2Filter#related_vulnerabilities}
        :param resource_id: resource_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#resource_id Inspector2Filter#resource_id}
        :param resource_tags: resource_tags block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#resource_tags Inspector2Filter#resource_tags}
        :param resource_type: resource_type block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#resource_type Inspector2Filter#resource_type}
        :param severity: severity block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#severity Inspector2Filter#severity}
        :param title: title block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#title Inspector2Filter#title}
        :param updated_at: updated_at block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#updated_at Inspector2Filter#updated_at}
        :param vendor_severity: vendor_severity block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#vendor_severity Inspector2Filter#vendor_severity}
        :param vulnerability_id: vulnerability_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#vulnerability_id Inspector2Filter#vulnerability_id}
        :param vulnerability_source: vulnerability_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#vulnerability_source Inspector2Filter#vulnerability_source}
        :param vulnerable_packages: vulnerable_packages block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#vulnerable_packages Inspector2Filter#vulnerable_packages}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5bb10971ae2e842ad7f9127978f4c9db2ad4faae1a974dd44b21cbd8c2bc70c)
            check_type(argname="argument aws_account_id", value=aws_account_id, expected_type=type_hints["aws_account_id"])
            check_type(argname="argument code_vulnerability_detector_name", value=code_vulnerability_detector_name, expected_type=type_hints["code_vulnerability_detector_name"])
            check_type(argname="argument code_vulnerability_detector_tags", value=code_vulnerability_detector_tags, expected_type=type_hints["code_vulnerability_detector_tags"])
            check_type(argname="argument code_vulnerability_file_path", value=code_vulnerability_file_path, expected_type=type_hints["code_vulnerability_file_path"])
            check_type(argname="argument component_id", value=component_id, expected_type=type_hints["component_id"])
            check_type(argname="argument component_type", value=component_type, expected_type=type_hints["component_type"])
            check_type(argname="argument ec2_instance_image_id", value=ec2_instance_image_id, expected_type=type_hints["ec2_instance_image_id"])
            check_type(argname="argument ec2_instance_subnet_id", value=ec2_instance_subnet_id, expected_type=type_hints["ec2_instance_subnet_id"])
            check_type(argname="argument ec2_instance_vpc_id", value=ec2_instance_vpc_id, expected_type=type_hints["ec2_instance_vpc_id"])
            check_type(argname="argument ecr_image_architecture", value=ecr_image_architecture, expected_type=type_hints["ecr_image_architecture"])
            check_type(argname="argument ecr_image_hash", value=ecr_image_hash, expected_type=type_hints["ecr_image_hash"])
            check_type(argname="argument ecr_image_pushed_at", value=ecr_image_pushed_at, expected_type=type_hints["ecr_image_pushed_at"])
            check_type(argname="argument ecr_image_registry", value=ecr_image_registry, expected_type=type_hints["ecr_image_registry"])
            check_type(argname="argument ecr_image_repository_name", value=ecr_image_repository_name, expected_type=type_hints["ecr_image_repository_name"])
            check_type(argname="argument ecr_image_tags", value=ecr_image_tags, expected_type=type_hints["ecr_image_tags"])
            check_type(argname="argument epss_score", value=epss_score, expected_type=type_hints["epss_score"])
            check_type(argname="argument exploit_available", value=exploit_available, expected_type=type_hints["exploit_available"])
            check_type(argname="argument finding_arn", value=finding_arn, expected_type=type_hints["finding_arn"])
            check_type(argname="argument finding_status", value=finding_status, expected_type=type_hints["finding_status"])
            check_type(argname="argument finding_type", value=finding_type, expected_type=type_hints["finding_type"])
            check_type(argname="argument first_observed_at", value=first_observed_at, expected_type=type_hints["first_observed_at"])
            check_type(argname="argument fix_available", value=fix_available, expected_type=type_hints["fix_available"])
            check_type(argname="argument inspector_score", value=inspector_score, expected_type=type_hints["inspector_score"])
            check_type(argname="argument lambda_function_execution_role_arn", value=lambda_function_execution_role_arn, expected_type=type_hints["lambda_function_execution_role_arn"])
            check_type(argname="argument lambda_function_last_modified_at", value=lambda_function_last_modified_at, expected_type=type_hints["lambda_function_last_modified_at"])
            check_type(argname="argument lambda_function_layers", value=lambda_function_layers, expected_type=type_hints["lambda_function_layers"])
            check_type(argname="argument lambda_function_name", value=lambda_function_name, expected_type=type_hints["lambda_function_name"])
            check_type(argname="argument lambda_function_runtime", value=lambda_function_runtime, expected_type=type_hints["lambda_function_runtime"])
            check_type(argname="argument last_observed_at", value=last_observed_at, expected_type=type_hints["last_observed_at"])
            check_type(argname="argument network_protocol", value=network_protocol, expected_type=type_hints["network_protocol"])
            check_type(argname="argument port_range", value=port_range, expected_type=type_hints["port_range"])
            check_type(argname="argument related_vulnerabilities", value=related_vulnerabilities, expected_type=type_hints["related_vulnerabilities"])
            check_type(argname="argument resource_id", value=resource_id, expected_type=type_hints["resource_id"])
            check_type(argname="argument resource_tags", value=resource_tags, expected_type=type_hints["resource_tags"])
            check_type(argname="argument resource_type", value=resource_type, expected_type=type_hints["resource_type"])
            check_type(argname="argument severity", value=severity, expected_type=type_hints["severity"])
            check_type(argname="argument title", value=title, expected_type=type_hints["title"])
            check_type(argname="argument updated_at", value=updated_at, expected_type=type_hints["updated_at"])
            check_type(argname="argument vendor_severity", value=vendor_severity, expected_type=type_hints["vendor_severity"])
            check_type(argname="argument vulnerability_id", value=vulnerability_id, expected_type=type_hints["vulnerability_id"])
            check_type(argname="argument vulnerability_source", value=vulnerability_source, expected_type=type_hints["vulnerability_source"])
            check_type(argname="argument vulnerable_packages", value=vulnerable_packages, expected_type=type_hints["vulnerable_packages"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if aws_account_id is not None:
            self._values["aws_account_id"] = aws_account_id
        if code_vulnerability_detector_name is not None:
            self._values["code_vulnerability_detector_name"] = code_vulnerability_detector_name
        if code_vulnerability_detector_tags is not None:
            self._values["code_vulnerability_detector_tags"] = code_vulnerability_detector_tags
        if code_vulnerability_file_path is not None:
            self._values["code_vulnerability_file_path"] = code_vulnerability_file_path
        if component_id is not None:
            self._values["component_id"] = component_id
        if component_type is not None:
            self._values["component_type"] = component_type
        if ec2_instance_image_id is not None:
            self._values["ec2_instance_image_id"] = ec2_instance_image_id
        if ec2_instance_subnet_id is not None:
            self._values["ec2_instance_subnet_id"] = ec2_instance_subnet_id
        if ec2_instance_vpc_id is not None:
            self._values["ec2_instance_vpc_id"] = ec2_instance_vpc_id
        if ecr_image_architecture is not None:
            self._values["ecr_image_architecture"] = ecr_image_architecture
        if ecr_image_hash is not None:
            self._values["ecr_image_hash"] = ecr_image_hash
        if ecr_image_pushed_at is not None:
            self._values["ecr_image_pushed_at"] = ecr_image_pushed_at
        if ecr_image_registry is not None:
            self._values["ecr_image_registry"] = ecr_image_registry
        if ecr_image_repository_name is not None:
            self._values["ecr_image_repository_name"] = ecr_image_repository_name
        if ecr_image_tags is not None:
            self._values["ecr_image_tags"] = ecr_image_tags
        if epss_score is not None:
            self._values["epss_score"] = epss_score
        if exploit_available is not None:
            self._values["exploit_available"] = exploit_available
        if finding_arn is not None:
            self._values["finding_arn"] = finding_arn
        if finding_status is not None:
            self._values["finding_status"] = finding_status
        if finding_type is not None:
            self._values["finding_type"] = finding_type
        if first_observed_at is not None:
            self._values["first_observed_at"] = first_observed_at
        if fix_available is not None:
            self._values["fix_available"] = fix_available
        if inspector_score is not None:
            self._values["inspector_score"] = inspector_score
        if lambda_function_execution_role_arn is not None:
            self._values["lambda_function_execution_role_arn"] = lambda_function_execution_role_arn
        if lambda_function_last_modified_at is not None:
            self._values["lambda_function_last_modified_at"] = lambda_function_last_modified_at
        if lambda_function_layers is not None:
            self._values["lambda_function_layers"] = lambda_function_layers
        if lambda_function_name is not None:
            self._values["lambda_function_name"] = lambda_function_name
        if lambda_function_runtime is not None:
            self._values["lambda_function_runtime"] = lambda_function_runtime
        if last_observed_at is not None:
            self._values["last_observed_at"] = last_observed_at
        if network_protocol is not None:
            self._values["network_protocol"] = network_protocol
        if port_range is not None:
            self._values["port_range"] = port_range
        if related_vulnerabilities is not None:
            self._values["related_vulnerabilities"] = related_vulnerabilities
        if resource_id is not None:
            self._values["resource_id"] = resource_id
        if resource_tags is not None:
            self._values["resource_tags"] = resource_tags
        if resource_type is not None:
            self._values["resource_type"] = resource_type
        if severity is not None:
            self._values["severity"] = severity
        if title is not None:
            self._values["title"] = title
        if updated_at is not None:
            self._values["updated_at"] = updated_at
        if vendor_severity is not None:
            self._values["vendor_severity"] = vendor_severity
        if vulnerability_id is not None:
            self._values["vulnerability_id"] = vulnerability_id
        if vulnerability_source is not None:
            self._values["vulnerability_source"] = vulnerability_source
        if vulnerable_packages is not None:
            self._values["vulnerable_packages"] = vulnerable_packages

    @builtins.property
    def aws_account_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaAwsAccountId"]]]:
        '''aws_account_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#aws_account_id Inspector2Filter#aws_account_id}
        '''
        result = self._values.get("aws_account_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaAwsAccountId"]]], result)

    @builtins.property
    def code_vulnerability_detector_name(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName"]]]:
        '''code_vulnerability_detector_name block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#code_vulnerability_detector_name Inspector2Filter#code_vulnerability_detector_name}
        '''
        result = self._values.get("code_vulnerability_detector_name")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName"]]], result)

    @builtins.property
    def code_vulnerability_detector_tags(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags"]]]:
        '''code_vulnerability_detector_tags block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#code_vulnerability_detector_tags Inspector2Filter#code_vulnerability_detector_tags}
        '''
        result = self._values.get("code_vulnerability_detector_tags")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags"]]], result)

    @builtins.property
    def code_vulnerability_file_path(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath"]]]:
        '''code_vulnerability_file_path block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#code_vulnerability_file_path Inspector2Filter#code_vulnerability_file_path}
        '''
        result = self._values.get("code_vulnerability_file_path")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath"]]], result)

    @builtins.property
    def component_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaComponentId"]]]:
        '''component_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#component_id Inspector2Filter#component_id}
        '''
        result = self._values.get("component_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaComponentId"]]], result)

    @builtins.property
    def component_type(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaComponentType"]]]:
        '''component_type block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#component_type Inspector2Filter#component_type}
        '''
        result = self._values.get("component_type")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaComponentType"]]], result)

    @builtins.property
    def ec2_instance_image_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEc2InstanceImageId"]]]:
        '''ec2_instance_image_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ec2_instance_image_id Inspector2Filter#ec2_instance_image_id}
        '''
        result = self._values.get("ec2_instance_image_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEc2InstanceImageId"]]], result)

    @builtins.property
    def ec2_instance_subnet_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEc2InstanceSubnetId"]]]:
        '''ec2_instance_subnet_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ec2_instance_subnet_id Inspector2Filter#ec2_instance_subnet_id}
        '''
        result = self._values.get("ec2_instance_subnet_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEc2InstanceSubnetId"]]], result)

    @builtins.property
    def ec2_instance_vpc_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEc2InstanceVpcId"]]]:
        '''ec2_instance_vpc_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ec2_instance_vpc_id Inspector2Filter#ec2_instance_vpc_id}
        '''
        result = self._values.get("ec2_instance_vpc_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEc2InstanceVpcId"]]], result)

    @builtins.property
    def ecr_image_architecture(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEcrImageArchitecture"]]]:
        '''ecr_image_architecture block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ecr_image_architecture Inspector2Filter#ecr_image_architecture}
        '''
        result = self._values.get("ecr_image_architecture")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEcrImageArchitecture"]]], result)

    @builtins.property
    def ecr_image_hash(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEcrImageHash"]]]:
        '''ecr_image_hash block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ecr_image_hash Inspector2Filter#ecr_image_hash}
        '''
        result = self._values.get("ecr_image_hash")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEcrImageHash"]]], result)

    @builtins.property
    def ecr_image_pushed_at(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEcrImagePushedAt"]]]:
        '''ecr_image_pushed_at block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ecr_image_pushed_at Inspector2Filter#ecr_image_pushed_at}
        '''
        result = self._values.get("ecr_image_pushed_at")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEcrImagePushedAt"]]], result)

    @builtins.property
    def ecr_image_registry(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEcrImageRegistry"]]]:
        '''ecr_image_registry block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ecr_image_registry Inspector2Filter#ecr_image_registry}
        '''
        result = self._values.get("ecr_image_registry")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEcrImageRegistry"]]], result)

    @builtins.property
    def ecr_image_repository_name(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEcrImageRepositoryName"]]]:
        '''ecr_image_repository_name block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ecr_image_repository_name Inspector2Filter#ecr_image_repository_name}
        '''
        result = self._values.get("ecr_image_repository_name")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEcrImageRepositoryName"]]], result)

    @builtins.property
    def ecr_image_tags(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEcrImageTags"]]]:
        '''ecr_image_tags block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#ecr_image_tags Inspector2Filter#ecr_image_tags}
        '''
        result = self._values.get("ecr_image_tags")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEcrImageTags"]]], result)

    @builtins.property
    def epss_score(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEpssScore"]]]:
        '''epss_score block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#epss_score Inspector2Filter#epss_score}
        '''
        result = self._values.get("epss_score")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaEpssScore"]]], result)

    @builtins.property
    def exploit_available(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaExploitAvailable"]]]:
        '''exploit_available block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#exploit_available Inspector2Filter#exploit_available}
        '''
        result = self._values.get("exploit_available")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaExploitAvailable"]]], result)

    @builtins.property
    def finding_arn(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaFindingArn"]]]:
        '''finding_arn block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#finding_arn Inspector2Filter#finding_arn}
        '''
        result = self._values.get("finding_arn")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaFindingArn"]]], result)

    @builtins.property
    def finding_status(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaFindingStatus"]]]:
        '''finding_status block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#finding_status Inspector2Filter#finding_status}
        '''
        result = self._values.get("finding_status")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaFindingStatus"]]], result)

    @builtins.property
    def finding_type(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaFindingType"]]]:
        '''finding_type block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#finding_type Inspector2Filter#finding_type}
        '''
        result = self._values.get("finding_type")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaFindingType"]]], result)

    @builtins.property
    def first_observed_at(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaFirstObservedAt"]]]:
        '''first_observed_at block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#first_observed_at Inspector2Filter#first_observed_at}
        '''
        result = self._values.get("first_observed_at")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaFirstObservedAt"]]], result)

    @builtins.property
    def fix_available(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaFixAvailable"]]]:
        '''fix_available block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#fix_available Inspector2Filter#fix_available}
        '''
        result = self._values.get("fix_available")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaFixAvailable"]]], result)

    @builtins.property
    def inspector_score(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaInspectorScore"]]]:
        '''inspector_score block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#inspector_score Inspector2Filter#inspector_score}
        '''
        result = self._values.get("inspector_score")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaInspectorScore"]]], result)

    @builtins.property
    def lambda_function_execution_role_arn(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn"]]]:
        '''lambda_function_execution_role_arn block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lambda_function_execution_role_arn Inspector2Filter#lambda_function_execution_role_arn}
        '''
        result = self._values.get("lambda_function_execution_role_arn")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn"]]], result)

    @builtins.property
    def lambda_function_last_modified_at(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt"]]]:
        '''lambda_function_last_modified_at block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lambda_function_last_modified_at Inspector2Filter#lambda_function_last_modified_at}
        '''
        result = self._values.get("lambda_function_last_modified_at")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt"]]], result)

    @builtins.property
    def lambda_function_layers(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaLambdaFunctionLayers"]]]:
        '''lambda_function_layers block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lambda_function_layers Inspector2Filter#lambda_function_layers}
        '''
        result = self._values.get("lambda_function_layers")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaLambdaFunctionLayers"]]], result)

    @builtins.property
    def lambda_function_name(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaLambdaFunctionName"]]]:
        '''lambda_function_name block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lambda_function_name Inspector2Filter#lambda_function_name}
        '''
        result = self._values.get("lambda_function_name")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaLambdaFunctionName"]]], result)

    @builtins.property
    def lambda_function_runtime(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaLambdaFunctionRuntime"]]]:
        '''lambda_function_runtime block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lambda_function_runtime Inspector2Filter#lambda_function_runtime}
        '''
        result = self._values.get("lambda_function_runtime")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaLambdaFunctionRuntime"]]], result)

    @builtins.property
    def last_observed_at(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaLastObservedAt"]]]:
        '''last_observed_at block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#last_observed_at Inspector2Filter#last_observed_at}
        '''
        result = self._values.get("last_observed_at")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaLastObservedAt"]]], result)

    @builtins.property
    def network_protocol(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaNetworkProtocol"]]]:
        '''network_protocol block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#network_protocol Inspector2Filter#network_protocol}
        '''
        result = self._values.get("network_protocol")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaNetworkProtocol"]]], result)

    @builtins.property
    def port_range(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaPortRange"]]]:
        '''port_range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#port_range Inspector2Filter#port_range}
        '''
        result = self._values.get("port_range")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaPortRange"]]], result)

    @builtins.property
    def related_vulnerabilities(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaRelatedVulnerabilities"]]]:
        '''related_vulnerabilities block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#related_vulnerabilities Inspector2Filter#related_vulnerabilities}
        '''
        result = self._values.get("related_vulnerabilities")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaRelatedVulnerabilities"]]], result)

    @builtins.property
    def resource_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaResourceId"]]]:
        '''resource_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#resource_id Inspector2Filter#resource_id}
        '''
        result = self._values.get("resource_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaResourceId"]]], result)

    @builtins.property
    def resource_tags(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaResourceTags"]]]:
        '''resource_tags block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#resource_tags Inspector2Filter#resource_tags}
        '''
        result = self._values.get("resource_tags")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaResourceTags"]]], result)

    @builtins.property
    def resource_type(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaResourceType"]]]:
        '''resource_type block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#resource_type Inspector2Filter#resource_type}
        '''
        result = self._values.get("resource_type")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaResourceType"]]], result)

    @builtins.property
    def severity(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaSeverity"]]]:
        '''severity block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#severity Inspector2Filter#severity}
        '''
        result = self._values.get("severity")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaSeverity"]]], result)

    @builtins.property
    def title(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaTitle"]]]:
        '''title block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#title Inspector2Filter#title}
        '''
        result = self._values.get("title")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaTitle"]]], result)

    @builtins.property
    def updated_at(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaUpdatedAt"]]]:
        '''updated_at block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#updated_at Inspector2Filter#updated_at}
        '''
        result = self._values.get("updated_at")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaUpdatedAt"]]], result)

    @builtins.property
    def vendor_severity(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVendorSeverity"]]]:
        '''vendor_severity block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#vendor_severity Inspector2Filter#vendor_severity}
        '''
        result = self._values.get("vendor_severity")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVendorSeverity"]]], result)

    @builtins.property
    def vulnerability_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerabilityId"]]]:
        '''vulnerability_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#vulnerability_id Inspector2Filter#vulnerability_id}
        '''
        result = self._values.get("vulnerability_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerabilityId"]]], result)

    @builtins.property
    def vulnerability_source(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerabilitySource"]]]:
        '''vulnerability_source block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#vulnerability_source Inspector2Filter#vulnerability_source}
        '''
        result = self._values.get("vulnerability_source")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerabilitySource"]]], result)

    @builtins.property
    def vulnerable_packages(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackages"]]]:
        '''vulnerable_packages block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#vulnerable_packages Inspector2Filter#vulnerable_packages}
        '''
        result = self._values.get("vulnerable_packages")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackages"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteria(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaAwsAccountId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaAwsAccountId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d60fed4d5ca28b42a656e2faabd9da1de9aa10bc8639cf11a903f37307a159ba)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaAwsAccountId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaAwsAccountIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaAwsAccountIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__98d7444837aa75c2e68ef1923ee737d00ea8efc36c644656a0310e47cdf11c87)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaAwsAccountIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__94d3c7aa9e73a3b79471922407e8ecdc50772c7e0f31f5f5edb8eb3332209998)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaAwsAccountIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c42376e55879963e5c5208fa1469ed1454b004f4467244f673b5c130baa29488)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d4f906d2299d8fb8e02756c4f78dec80daed4b0a2c16bacd1effa9a658d62131)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e8919f83dcef76ea8b61318fbd87ecc48ba249e493af02c25567dfd751cf59e3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaAwsAccountId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaAwsAccountId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaAwsAccountId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc0d5ce7a59365a7d97b253f58e3d0a126e6eaa2e1611a630ff1975c3dadfdfd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaAwsAccountIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaAwsAccountIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6bc1cf4fb156b330cf19529224e425eae70be3818c16e6c5e4443b3538ab2b1e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b29a39672080f62296f7486baa70d62c232a06c439c609185301af96053b031a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df1325ef5118dab722cc87f5e427dc68f13ac3c4d2cf40b41ef3961d6a564f63)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaAwsAccountId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaAwsAccountId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaAwsAccountId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8fbc414cddb751f22c33140b7de3734ce06371903ab7c02def892f9cd263032b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__414d8597c134a8d75ba1d551739d85f8f46ce83c3c2960990ff3ede1e2b10951)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorNameList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorNameList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d982b9a0efc25dae0d24269ec4d54bc7adeea3d0607644f287ffb817b54fbeb9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorNameOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c58ec96a6b1af960275fc21e34cee53b7d5b9bed9aa884d38e66ef527d72d8e0)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorNameOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8c6f57c8ae354f2b2d6217b253f75c61f8db6cbf63eccca91f7407497bdbc48)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8cbd75ae5b8c314b99afe380047245cba0fef93adeb4978499e3d5ff1204b59a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2e7fc7f0c7170811fdd63324610fc6be95a1300b2eeb3c85a1b9b715b0947df6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__322daefd448f833078340031eee8fae9dd0ad53e45ce60cac6d9b0abad6923ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorNameOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorNameOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__578075c3cf3fb8d56e3ad3a8cb0ad0e74b392328380da8e525a04421e6956289)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9ef02389015a2ac31518a74dabb8e8fd4df6b17b19aca462ef3ddb167b606a7d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__121b55c8e98a6d6f883473bb5c63b559d7be0e772832ff04093d01a9c7e35d55)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1053222dc29650e56a8d4d217e567c4ebf9920e6d9f92c85c6ed58ccbe9e3e6a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4887b481f52aaa8ac159bb3538c24aeae62a39fb6b124b437058e04c90bcb78)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTagsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTagsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__adbcdd1518bdf51bb831fb4e9fe8a5edf347da7e402755bc4dd008ad93c2e86d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTagsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9851c78016bb492f21937482f45bd54fb474d182a5e99e661911ce33988834b)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTagsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2fdf0cd30b355fabc5b831297b98a2d255927f0c3da8275a140826ea9dff9b06)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4af6fdfa36d23b46ba4017b296765ad248f5db2e06848918e61bd360bc287aa5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f87b31c43da52cf773e408a5662ce297ca0f912acb3c0a3c587ecc4c147d166c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f5fdf70b4d68c81812ef076074bdd5a300c0e6e1c0af0830963a440358316622)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTagsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTagsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__948132f5ff1c428511609b2f752e20e68e2ccdddea1352728c90019f9ed4c2e3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9ac1cd4ea3b323b4202c5e4771f8b997f7e33932b24c3cf2b6711e3888ba428a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ca7955001bea743089aaadde0178846397bfe0e7b01ebf79f11f1d5a2568665)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b658aa942dcec5f61b4f561da732e4f246bb668f664e8790914d86c8b7e9a1a2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b4925f42b0ffeb0e257a7e23cc0511f98a947d8f13b162078d71ae381cb4233)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaCodeVulnerabilityFilePathList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaCodeVulnerabilityFilePathList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__60996d3d8b58d78ad8c62b2199cf653487d6ae59bd4ed5c2adb854fefba24d7a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaCodeVulnerabilityFilePathOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2b5ae56f1e1e8ecce79e31132fdcf60d3d4975a2ba918c4ad42959d00f1e0ac)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaCodeVulnerabilityFilePathOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1f70b3eb1803b3e32f9bcba894e08e38a7becc24b2873974217d2d4726b8733f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c33de7ff3219b2478a91b863ddc56275efd82fdeca6a4ef5b8ecaca2fb9c30a6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3bb24d25486e0a873c3751078a6c6f1700d35c95cb8d2b7dcc63d146efe178e5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06e292204c9845082ddd17a8ec95cd1891b5ce0972fbbc81e522c9398cf1a8ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaCodeVulnerabilityFilePathOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaCodeVulnerabilityFilePathOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8ba5df6bfec8f713456cba398a86f117bfd22fb422ea8e76af8930dd670dfd14)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2d2b11133fe727caca9dca360412de96f46cff7fcb757ce75955fe6d8e8a0e01)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9fd7d7925f7a4ede2c222247c183432908912e45cf91f2123aeb960fe2c53bbf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6bc9a758e22f677524a8c3e045642f40154798a353cc417f6717ec304815fd7b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaComponentId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaComponentId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__249e0d08e0a230bb1622ad112a7a3de7ee29347c23c2925419a136f8b3429de2)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaComponentId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaComponentIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaComponentIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__df1beca0269608dfe0db52b41e169c647e540576b2a59b9ad4b85d53073b2e04)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaComponentIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d37a0774034ebb7e103fa21d8ebcea9145ec22752791f68719c904ecee2d849c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaComponentIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b9602c795a2f09ce73a57452d5e20bf1cdf664b7ef82ca48b2c5bbe4e9e14614)
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
            type_hints = typing.get_type_hints(_typecheckingstub__03e23cfbdb90e929d5660a1dae961221bfdca7b1586cf26caa96ad10279ed35c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1286610d1b7059cf89b17ed11da058be5408002610b623db1cfbef7030e238dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaComponentId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaComponentId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaComponentId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b1750773ce55fc63961b1ba25c1b5171cf6a5ecff02a87b8d3a50a5dbfe6ecd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaComponentIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaComponentIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__125240cdc6b571ecdfc90095ba57dfb4c3bce578b9e9e87f9ef0cef0cd5ad7b9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7945a643bc1530227ca72afc7c054c7f92ede708068314191f2d06447c32ed8e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d1e4a1b991c9d4c1d19832bd677581cff501b450906ca1769c2344c5a3ffb020)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaComponentId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaComponentId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaComponentId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84bac09c9938e7668bd13f76bf54fe704af264093a82f399205a653f68ddf808)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaComponentType",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaComponentType:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7fb9803805aa304571d20caa57f1aa2ae40691a6f509451a024bbb7e4d9683f1)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaComponentType(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaComponentTypeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaComponentTypeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c61ef8bdee137da1557519092b6a0de0c25e755bfdd500276830c51427e0cb1a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaComponentTypeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e204848617dc938ff0ce7af736e9f807ac23b9969f8544d76163928baff7134)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaComponentTypeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9ccc6edffc5eafa93591e179cc67c7bb564894a6af3d184af02a005368b83f44)
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
            type_hints = typing.get_type_hints(_typecheckingstub__51553a6d16164ba57d5c313e6486e020b412ebdf6ea65bb08e10d9f734fe0962)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9b0cbc97e984f4ad11be2dc5c259082af0832e68234ff8d64fb5367b371d8e12)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaComponentType]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaComponentType]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaComponentType]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e1ec762a71501d41ae9996f18b394cfcd8018e2bc06769a48ba97469ed8e11e1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaComponentTypeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaComponentTypeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b5e05615477b8c780c876d331a14cc5667064a88aadf57b75ac421c8868911d3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a203426a501698f8145f7737412eae12ed912f64e20953c2bea382d494439f84)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb8005af9ec6953d6a983583ea9be3bbcc8a633f6807202f86d2819d66ad2577)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaComponentType]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaComponentType]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaComponentType]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4f594518fc64dea30431030512989eb3342dc2d8849f4fe2a8b6c59a1469f074)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEc2InstanceImageId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaEc2InstanceImageId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a918498e144754995693c2d9be970ca24ecb7997d798e8dde751a3219f7d116)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaEc2InstanceImageId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaEc2InstanceImageIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEc2InstanceImageIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7e8b7d4cce253ce3b3a6804aaed4d95e21120b219d663b6a899f93efd4a5365f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaEc2InstanceImageIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7ff78c23144919db6083a21ac9b622cd0c730e0eac67bbb05acd266afbba4e5)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaEc2InstanceImageIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__80a2f5a7b238a061f3a5797fa368ae276dde3fbed564fcb04b4e1b7305927b8b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__31c24e707774f5066513de9da58c6dc686cab34fc5c1bbb94c11e4ccb87d26b7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5296d9e5eb8d511ded7a1f2af1df14269260550cbaa37292be7ac1de56fc2a00)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceImageId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceImageId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceImageId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ceacd8009c21bd6671967e5e5ccb2e64859938f220e2b65d986f67b882379bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaEc2InstanceImageIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEc2InstanceImageIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cb3c7cfd487f96b4014876f2a5b7b2662d6c1082f41fb4882874f50cf68439fb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7513493961506b7233d4b5be70c8c8b3f953a065ce5a533940c0f1b47b7f9f03)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e3805f85afc724ab01c58943d76e65c7387b1dd6d6bfae4032a699e7bfe5a459)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEc2InstanceImageId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEc2InstanceImageId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEc2InstanceImageId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__678183cc586a260a002737fc5e4bf3f43e778f64fd39c0b8e32268f561731698)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEc2InstanceSubnetId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaEc2InstanceSubnetId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8cb0bdd7b3339b51d6031d1de29118817c02eda1bb9b3a9e96a4eb5fc40c9d0)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaEc2InstanceSubnetId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaEc2InstanceSubnetIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEc2InstanceSubnetIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__35259b52623dc892b4158d350badeb1c24422ebd05582a42b99f16af1f6daa24)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaEc2InstanceSubnetIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b6cf670f10b4d44088696d85863422cc4047860f13ef4bc1e32d1397e4119281)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaEc2InstanceSubnetIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__883bb392e4ef7be65502a89463849d2473c6a1445ab319a85a11190080d161aa)
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
            type_hints = typing.get_type_hints(_typecheckingstub__648d1709f2412465e6865f06b313fa63053d44ed7fdb5661eba569487a066d85)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ad4d8f24f11ce2db1c0cdbd0a73875618923611982ce19d40376e1593ec4d1d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceSubnetId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceSubnetId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceSubnetId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0af997cd8233683eadb0a42165e4026a5aa60cd7bef1390b6a081fbbd69addca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaEc2InstanceSubnetIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEc2InstanceSubnetIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__27f9457215ca56f3b00e4f42e378a27bf223e54e73455eac8bdd38296db2fbc2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ddd6dd957dc88d4bc50d6ece0dfd82da86c8c91e7eca6c617a67e1d5dc3cf977)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a7ed5dd4328fa9e54627d32ea5ebc72253f4e92c2b261a6a95453ff13e39dbe9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEc2InstanceSubnetId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEc2InstanceSubnetId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEc2InstanceSubnetId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b6e421554da86e4b83ba38c61107ef184b9a565349ad143b355125cb35e6d563)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEc2InstanceVpcId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaEc2InstanceVpcId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8dcd709223117a2d210e7b9069e785de5d49e3db7420142c980efbbdbee161a8)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaEc2InstanceVpcId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaEc2InstanceVpcIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEc2InstanceVpcIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7d5d631dfc7734f07106e94239a13ecc879c687ef127598425b5b47ae7d4f7ea)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaEc2InstanceVpcIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__53dc58f8611967ef767be4bb83459da258958b54303baf52e7d0f250fb336350)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaEc2InstanceVpcIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b166ebf0e6fcaa333bfcbb3ae44a7b3129a4285038f5c204a1f79c9149000087)
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
            type_hints = typing.get_type_hints(_typecheckingstub__00154592835f0d6412619f8b0b1baf08634fe3f1563ed6e112355dc7b653c870)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2dbda1e9fb01156bc208beb1114594eca426cb95335410edc8c2107b15b948a9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceVpcId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceVpcId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceVpcId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f0889c0c08425ca5f6bd1417827502b90e89c411db1eb3ac003900301ee760ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaEc2InstanceVpcIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEc2InstanceVpcIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1fe25eac4b48f4ae728e8e5c2f57bc8c550143c78a2cbc5bdb40c0de1199e259)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc36d8a49bbab07247f1accbd826150aa959efcd8c718460b90cb26a10ebc315)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b3747ae10ba76b9b901e594ff281bdd1477ee8435a6691a7ef18f2ac2243491)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEc2InstanceVpcId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEc2InstanceVpcId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEc2InstanceVpcId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9a0f506fb561708a6923dffc3c45122cdef3e9b17b9d310f572c912fb83322bb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageArchitecture",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaEcrImageArchitecture:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd63cbaffdd181a5dc3d1758c4ec805bdcfa6e53f29503c9b14c7e181daecebc)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaEcrImageArchitecture(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaEcrImageArchitectureList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageArchitectureList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9ac195bf2e3e8eb8d962a479749f2c933a977789f242cc19f6a20cd098c19fde)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaEcrImageArchitectureOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__66a4c1873015987104c70b2725e61114a4ed32c8e7b9cb4921477452426d8b1c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaEcrImageArchitectureOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__189898ccebb6a9e0e7716160f88fa944f40f5893c846e7bfebcc84011e87cbf9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__841be727df7d161bbeefce278788183c128657b9d0e04a38178cca7e4288dc68)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2f3f2d6d3e8457854baa59f196028614d034f1487da537129ab6bd6f971f2766)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageArchitecture]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageArchitecture]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageArchitecture]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b882f117f89622d79d0300f051f05b556ba4666ec271c5d0b4f4ccb379e167a8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaEcrImageArchitectureOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageArchitectureOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e2ec2cc3f5f9dcb7e921daabc5b3b981900aed7ecd8cdc4458a7f6c76fd6cc23)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86c6da9c1af4a6883c849b541733e4c957f7a641706d869de1f86539824fb49f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__725f65a2624e9924bac4c79878945a34c9130831530358844408a983c39f7a9b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageArchitecture]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageArchitecture]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageArchitecture]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__300f9bb5232334441aacdbf9c4650a33f72e8ea1b5b9f790efebe78f09ea425c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageHash",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaEcrImageHash:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b2d1b4ebe9412ea888986b504d24fd7c556feb077c7b035a10e714bd47f7d82)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaEcrImageHash(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaEcrImageHashList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageHashList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8ac28c970c9c3ed00c5c72f824b04f0461df4814037066b76e938a518b17d74d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaEcrImageHashOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f34a3643617a99607e0dfb56fcdeee0451573dcbf4f3373da030791a3df56c37)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaEcrImageHashOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6f0f4ace2cf5dbd4e407a345702dcd34d0242279238f7488b79b112a4b2ae64e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6f29b1ff04d4a065a0a7d3d7bbdaa52c99b8f13fdd6c6043ed14b75337c71756)
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
            type_hints = typing.get_type_hints(_typecheckingstub__868138d9b1b1cd02dbd6a7d1e8358e3288abd8badf5bf9984789849a1b3a4a1a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageHash]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageHash]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageHash]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e50d0c5c6f8aaaf70eb44947eafc0c97c32e7d93a8defc714293f7343ec662f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaEcrImageHashOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageHashOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__575aa5e4af142938c9fa18c9e61d069632e6b771a57949a7c0c7faf4cd63750c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8161da112e8d01ff6db1463237b9d60ad3f07b751a5989e94deae238297edfc8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7a1a807241a4ddbac0e356e957f57b56c7e962cef32a67a2cb4c8643b6539579)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageHash]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageHash]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageHash]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__050c1d9bda2fd15c56525b0a8a2fad44ecb9e15c5fed6de328f792c1542159c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImagePushedAt",
    jsii_struct_bases=[],
    name_mapping={
        "end_inclusive": "endInclusive",
        "start_inclusive": "startInclusive",
    },
)
class Inspector2FilterFilterCriteriaEcrImagePushedAt:
    def __init__(
        self,
        *,
        end_inclusive: typing.Optional[builtins.str] = None,
        start_inclusive: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param end_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.
        :param start_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#start_inclusive Inspector2Filter#start_inclusive}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__538af1d3fceb72538f2959f0d29cc84f67e6a8a29b56b55323cc2dd894643e12)
            check_type(argname="argument end_inclusive", value=end_inclusive, expected_type=type_hints["end_inclusive"])
            check_type(argname="argument start_inclusive", value=start_inclusive, expected_type=type_hints["start_inclusive"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if end_inclusive is not None:
            self._values["end_inclusive"] = end_inclusive
        if start_inclusive is not None:
            self._values["start_inclusive"] = start_inclusive

    @builtins.property
    def end_inclusive(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.'''
        result = self._values.get("end_inclusive")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def start_inclusive(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#start_inclusive Inspector2Filter#start_inclusive}.'''
        result = self._values.get("start_inclusive")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaEcrImagePushedAt(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaEcrImagePushedAtList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImagePushedAtList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__22d946b9a35d5e4328cc1c7425001b8e9e47fc9b73419f12c1cbc9a3d6c7319a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaEcrImagePushedAtOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__482deb4bb90a4084951ab69ad921754b987b961a14d1d42a1ec514fb0241a562)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaEcrImagePushedAtOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__88ab9e7ca81f350baf1f22079ab64ce7553d250ec42fd464255a0ddf1963a52d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1393c9105cf1bb7aa131fe3fe4ac43732cb0cd260e15e69696f781ca361695ba)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1a89650a258a0772144de6a44109d81e135d6294e438e161e1f437e620fab342)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImagePushedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImagePushedAt]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImagePushedAt]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0bf049a187ccbca767a3f9523dd052d4facb085a1b01aad1780ecaa01aa9f152)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaEcrImagePushedAtOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImagePushedAtOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__eb9a5433d15feab2a913ed9b2f055ce221c6d800e98e5408703dc11f191e7354)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetEndInclusive")
    def reset_end_inclusive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEndInclusive", []))

    @jsii.member(jsii_name="resetStartInclusive")
    def reset_start_inclusive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStartInclusive", []))

    @builtins.property
    @jsii.member(jsii_name="endInclusiveInput")
    def end_inclusive_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="startInclusiveInput")
    def start_inclusive_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="endInclusive")
    def end_inclusive(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endInclusive"))

    @end_inclusive.setter
    def end_inclusive(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e05ac810c569f3b48b36dec3baf9afd21e5d2dc0179646b87cfe69980e52d20a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "endInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startInclusive")
    def start_inclusive(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startInclusive"))

    @start_inclusive.setter
    def start_inclusive(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a280b531a41308f27f79a69292be1bed6aa36a0928e8ab81b4a20a2e91d2bbf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImagePushedAt]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImagePushedAt]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImagePushedAt]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8be6dd8305999ba2cc253d040b37215cad0a4fb8aa80f8f5b8655ccea241b508)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageRegistry",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaEcrImageRegistry:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e9d66f3afc196bcef7ee573b3a629e93f843d4b1ece8e25112e7861e660f2ccc)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaEcrImageRegistry(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaEcrImageRegistryList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageRegistryList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d6a2230873db7111d1720ee2e02815aa116fbf07fe8eb77ab0b1948c7f799b5a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaEcrImageRegistryOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2dfb19cf339657b3475ac5cc744a998f659f20e7c5d025fec23e8d5222b9e953)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaEcrImageRegistryOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__991db8428c6b4019ad5744cb8c3baf1c36811fd4caca9c6f36c8b46307cee965)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5a8d65b4404b7f6a475877a689d6025e966020d4b73b849fdbcb9e058f6514cc)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4bf8c0e7f363ae442da1e58fb3c0968a6b2a571e6e0b5d6a28534e1370c99e5e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageRegistry]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageRegistry]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageRegistry]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9372d14b4b964a6bc659608d7d9fab9c14b650ae9cd93341e5103bbc45476007)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaEcrImageRegistryOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageRegistryOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__53c3a9f0aa1af39d419b013e5c20b2702ad1e8cf15f2f5c260a8f782c6d58137)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c3c490a8f87bcc7e49403233b0b03e37fbbb036003079e4017ca29dbabf31ad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6f6c86e33d3b827c255f096f56b3a11169cd2c84d8fe721252c9652605106e42)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageRegistry]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageRegistry]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageRegistry]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__de46330872a489827dfdeaf14acfe71ebe9996ac979e3814d9372b5b30d23b8b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageRepositoryName",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaEcrImageRepositoryName:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc6800478d9a2a3ef88d26a473cd3dd910be9223fcedcaf35f54878008919191)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaEcrImageRepositoryName(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaEcrImageRepositoryNameList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageRepositoryNameList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dbf4392b8c36d3af6c10f10d12d43e9bb27e0702fee03f38c4984e74fa4ad7f9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaEcrImageRepositoryNameOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f094c9b38c8c293c4e3775421a8890d0b0a4bbcb40d2a81c094fba5e878389d8)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaEcrImageRepositoryNameOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06ad2d2f9bcf18adf5daa077d4a661510eef50984127cb46e11a957284d1708b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__307059369a5ac56730805144ac0bcbb5ca4950fc6f7e57bb5f566056388f4bc8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6d66629658115cd926f84db39e0140cb91a83387f6916619a6b1a3b6f39f5c91)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageRepositoryName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageRepositoryName]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageRepositoryName]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8479dd8bf0046ce9c35fa5fb3a4214a8f534bfcea97c066aff3b44192c14490)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaEcrImageRepositoryNameOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageRepositoryNameOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__68486caa165e43fb76e03e4f436984b8a5b04acbc84591fef76db1e55b37f48d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b5c76affd00f567cbc0ae54aee4c28fe3a1c00ed6cc4225284cdfd175899030)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ddcee19b5cbb264b91f58e9474af99bf5405c42b8294b626fb8985c9302cc7b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageRepositoryName]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageRepositoryName]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageRepositoryName]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0050874d815fb9ddbdc0de28c9c0030dadf1adc4401742ce3438fddb97c1dc15)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageTags",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaEcrImageTags:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e993d8200cd8bfdd9533e3957601b189dbce793b9f517280f3b937c6a9efc04)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaEcrImageTags(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaEcrImageTagsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageTagsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a6ff086ce7972907e004680a146d0effaffe61d105ccde6a3b3cf15397fe5b9b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaEcrImageTagsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__27e290b55021fa67455280c28c423a1425f8e2cff8263db4c65578bf2e4a01b5)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaEcrImageTagsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4fd1612387bd214adc62884b258eb6ad76ba03048c212207a2aee1deda430a46)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2ad39213876a44b41e60dc154a6e7635f2e6969b008f31c86571d6bd2c55876c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__09494ab9cff9e254864464bd3bbc0547d00d50f2a5bdfdebb54769015179377a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageTags]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageTags]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageTags]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__90a033a10b1326e88fb240553cc91e3587b833bd23b92ec28d75ddcdf52bdc5e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaEcrImageTagsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEcrImageTagsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__505e0b744ea1e3a40d704f55be3782ef3cbf33a4a6a2c86778710eee67a79094)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e191a31da7142b05cbf5575da5ae0515b7d7e82370d2a5b822407d4d498ea09)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc05593340ca538f93646226d464ad0a96a66294139d5889119681f8c7362ad2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageTags]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageTags]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageTags]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd84348c4804cce6274c455a77017be75de3220a3d4b2bc455f6182a77ff7287)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEpssScore",
    jsii_struct_bases=[],
    name_mapping={
        "lower_inclusive": "lowerInclusive",
        "upper_inclusive": "upperInclusive",
    },
)
class Inspector2FilterFilterCriteriaEpssScore:
    def __init__(
        self,
        *,
        lower_inclusive: jsii.Number,
        upper_inclusive: jsii.Number,
    ) -> None:
        '''
        :param lower_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lower_inclusive Inspector2Filter#lower_inclusive}.
        :param upper_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#upper_inclusive Inspector2Filter#upper_inclusive}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b04fa9a2076df169d1ff141ad08765ad4e3aaa247945f2bd9ea9ccb6b8787b0)
            check_type(argname="argument lower_inclusive", value=lower_inclusive, expected_type=type_hints["lower_inclusive"])
            check_type(argname="argument upper_inclusive", value=upper_inclusive, expected_type=type_hints["upper_inclusive"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "lower_inclusive": lower_inclusive,
            "upper_inclusive": upper_inclusive,
        }

    @builtins.property
    def lower_inclusive(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lower_inclusive Inspector2Filter#lower_inclusive}.'''
        result = self._values.get("lower_inclusive")
        assert result is not None, "Required property 'lower_inclusive' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def upper_inclusive(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#upper_inclusive Inspector2Filter#upper_inclusive}.'''
        result = self._values.get("upper_inclusive")
        assert result is not None, "Required property 'upper_inclusive' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaEpssScore(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaEpssScoreList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEpssScoreList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__657811eb94624d66bf983de08f97bcb5f6426a210e4080954dfd8f1a2989668b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaEpssScoreOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd45ff4282f21f444ce4b7c89fb54c4d9c887eb3c3ca400cec62768ca49c158d)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaEpssScoreOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__85be4892f62a8ae82de566334dca365f6a06926cbbc61e08cfdd304e9341750e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9f7545e81ca0cd968b5b3618a20e72047b31d5ada87d68c9d87a5845594232ba)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cbb98e2de6e7291570c160e51c3ced5dd78bbb7a5dd5caa3557b6f8d44fa7ae9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEpssScore]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEpssScore]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEpssScore]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b111043d57e66270337b15ee2ff31bad438752bb19c89b114fc6a4e1686ddb1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaEpssScoreOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaEpssScoreOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d2130b0aa120f4e3f2f2360a2790ca778f812d21122101862295af28105fd524)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="lowerInclusiveInput")
    def lower_inclusive_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "lowerInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="upperInclusiveInput")
    def upper_inclusive_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "upperInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="lowerInclusive")
    def lower_inclusive(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "lowerInclusive"))

    @lower_inclusive.setter
    def lower_inclusive(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2014c5e389c3372f64f462e1f6104c4898a674df76175e3bdba22cb8bd4db6c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lowerInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="upperInclusive")
    def upper_inclusive(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "upperInclusive"))

    @upper_inclusive.setter
    def upper_inclusive(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__44032e0db1384ff48e92986e5bdfd099ffabf284c66cfdd30c77f5db9aa2a37f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "upperInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEpssScore]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEpssScore]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEpssScore]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05536ce97d914471ec9d677f2dce537edd6beb0d18a05fcdde3216f159f98268)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaExploitAvailable",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaExploitAvailable:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__480cd77050bb575f2aacc2d9d5f2230360d5b47b53784470dabe58df458e1c5c)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaExploitAvailable(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaExploitAvailableList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaExploitAvailableList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4906e71fdd987bb4a81d376ced0622621b09766544b4ec32597208ef804ecde8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaExploitAvailableOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c446dffdeb834a99a3f2d4624c08bb8a56b41b5c5858d344dca95a0d52487d9a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaExploitAvailableOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b7e9171e1e858ce446acb1149175dd77c65a341de907e897926b395b1b748c3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d6d052c3cdb5474cbd9440a70312e22fac15c78bd077be244453a848f578e085)
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
            type_hints = typing.get_type_hints(_typecheckingstub__598bdcecca7d1dcfad989230e43b41d5f418f2d556db8989698e5fa1aeda9a68)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaExploitAvailable]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaExploitAvailable]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaExploitAvailable]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff7e8ec9a06666a476ba1b4e601296768c3799b08c663ce9afde5fa449dd5155)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaExploitAvailableOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaExploitAvailableOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b697884dd993ebaf93376e37197d1368a56638fbc316be9bcdca0e7f0679b2e1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67449d90dbfafb4e825e9930d62ec6b83418efda6ec5ff28d8fe2a7316374579)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6983efaa0ce04a45bd1330fa2a36fa7bc9820c4af7f263131a05fa0742fda6f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaExploitAvailable]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaExploitAvailable]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaExploitAvailable]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee3da7950bf324c6e614abc25ce8bdad698e581330994599a1fc679ef41aeec4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFindingArn",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaFindingArn:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12fa185877e69fe9921775a032f6acac842e547dd9d6b03f876da0cf13f79a02)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaFindingArn(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaFindingArnList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFindingArnList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e85dd4ef731c0540ed4e58ca56df9b6411ef08c13ce185f99efd0ebfef98aff9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaFindingArnOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99cdf04927c5a929aa06a992f915148d48f460451ad7781ebd0717a3eb5e0379)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaFindingArnOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a2e7b49a56151cdc0329face710b939cb0e046fe8808c19606f99f82487732d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__685ec294670b789b0f6da47ac5339ff455a9556e48eac149a6349f70db485619)
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
            type_hints = typing.get_type_hints(_typecheckingstub__56ab8c2781a208d83ab63f91c2669a933ca39fb4c2c3b93b352ff61732df53a7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingArn]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingArn]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingArn]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24d157cc0facd09cc271df010d04e5100edf03e30950d2b0989dbd1c9a841c82)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaFindingArnOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFindingArnOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bbe3767cfae82f706d1c6db3e8bdea5413fe9063b1cd15364243933162eb0bf4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__57adb9187b775dd348868c88100555beb8d2a19e5e89915a82396dfe6884f1e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f7fa0792526e1ab4a6268db75996fe86c8201d8779962e231ff39d26899bace4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFindingArn]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFindingArn]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFindingArn]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__77163902d58d5f560cc8c063e606b6d36c6799cb5cf87ac18830c8424c4de61d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFindingStatus",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaFindingStatus:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__da1e3db6fdf26e0baa4a457c7de75a244d23d13757b02e0ef87fea97e83d8acf)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaFindingStatus(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaFindingStatusList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFindingStatusList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__06a42da4ae13489c5ead01708cf2de8e5018719db63787656eaccced5c922eb4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaFindingStatusOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce317334a8b4a014f8b739c8f43f0eca49aefe29f63d6a8cc60da5956aa6ca96)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaFindingStatusOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5fc2fb863f670e6d10fb6ca4dc3a594a18690bfed79d43ea4d7e859ae6e3a6ff)
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
            type_hints = typing.get_type_hints(_typecheckingstub__72e9ac536392f9716cbf7faa2b3cab55c27f00d1800667ee79fb3f83ae19cf49)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3d51f718da6ab94b9444a168fa032d366525f45a17e4d65f30859fe2cd9bcee3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingStatus]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingStatus]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingStatus]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0db10af5866ad19eb5db9a2cdd84a4cccada9be227a7b4f9f9afa041874da48c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaFindingStatusOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFindingStatusOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0a4336f365bf1066a502baff1af08be2c929d266d0e6d6b13d29966c48828440)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e7294b8eaedfd39902830a83b4809b42338ae47924749ef36e62c35dbea1ac1c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4bc085cd4154d15d01a01fccbef26e37b9c76d9887a5620cbffd5ee5aebb248)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFindingStatus]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFindingStatus]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFindingStatus]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c5a6c46f2b176f184549fd0732139af528ff94a1d11deb64673b385562c569c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFindingType",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaFindingType:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__76771763d3701ad0558e07fa98347866ba0052e15762218afbe883a204724f99)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaFindingType(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaFindingTypeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFindingTypeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6a57cb7c4c64e29e975552758eabf90b7573722a3347e3cab0f5ce3150754025)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaFindingTypeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9dc9f1240da92ef8d82c44f02658c2043e4a943c3fd3cfbb2fd75ae86595a51d)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaFindingTypeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fe0df524f021a16378e3b50ebd79edbd55b42c6f989cdd029d93c2856bbae8d5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e1c6aa67531bd8011d7ae077313222ed00cf0a6610854bdda8a980988b48032e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__60681839282a336e25c374383fd4911ff564559eb3b5c0c4ea044fe6a6b65b9b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingType]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingType]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingType]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d1c123223c11e76bdf0e3a2ea752376b46a909b15aa670cedf455f452c7d04f7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaFindingTypeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFindingTypeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d8c5276291081aa1103785853505f08fcd0997df20037c1e7ed530b3d31445ca)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ad07ebf1ba22a5c3ee46590cb86a0d0d6c9e9679d3c902b9a0787d7ed43d75c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__51a21ac5c55f0bd5919846267f2acdc0f26aaa95c8c7be4f89e47dd211f71d68)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFindingType]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFindingType]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFindingType]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75dc29834d4c3228032490eb811b00fe420bc1db02ce28c658646ffd7a28feb4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFirstObservedAt",
    jsii_struct_bases=[],
    name_mapping={
        "end_inclusive": "endInclusive",
        "start_inclusive": "startInclusive",
    },
)
class Inspector2FilterFilterCriteriaFirstObservedAt:
    def __init__(
        self,
        *,
        end_inclusive: typing.Optional[builtins.str] = None,
        start_inclusive: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param end_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.
        :param start_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#start_inclusive Inspector2Filter#start_inclusive}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2340c853646194c6c9a12fed7b5a98f831fbdc92eb43ed58c5e98f8812ce011a)
            check_type(argname="argument end_inclusive", value=end_inclusive, expected_type=type_hints["end_inclusive"])
            check_type(argname="argument start_inclusive", value=start_inclusive, expected_type=type_hints["start_inclusive"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if end_inclusive is not None:
            self._values["end_inclusive"] = end_inclusive
        if start_inclusive is not None:
            self._values["start_inclusive"] = start_inclusive

    @builtins.property
    def end_inclusive(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.'''
        result = self._values.get("end_inclusive")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def start_inclusive(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#start_inclusive Inspector2Filter#start_inclusive}.'''
        result = self._values.get("start_inclusive")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaFirstObservedAt(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaFirstObservedAtList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFirstObservedAtList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__70719b641a4b52bd7b0a2c331763387482ee87fb5f4de31ee7383aa981975a62)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaFirstObservedAtOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18e417a67ed7995c47d2ce8518d5b06133c295cb400edcd07c6c57a2f1fd53f7)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaFirstObservedAtOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dbbbdf4f659efda586980a77906d341d39fced403b6ff62a4da56ce394e82b05)
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
            type_hints = typing.get_type_hints(_typecheckingstub__62cea392ccff3f19b01335f7d664c4f9defc5411330d51543d8c43903e705b16)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c25b8d25d0ec6c5bd0928b5ccd3476e30d676ac33c8870c90b9d9095b1129680)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFirstObservedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFirstObservedAt]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFirstObservedAt]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49eeec79af4ab624a8b674cbd7116113d755eb544341178aba793c95a79d8b05)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaFirstObservedAtOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFirstObservedAtOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__33dd0490f0227e15f062ce8badd05712f65b73b3c24461e2202f2961e23b16d0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetEndInclusive")
    def reset_end_inclusive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEndInclusive", []))

    @jsii.member(jsii_name="resetStartInclusive")
    def reset_start_inclusive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStartInclusive", []))

    @builtins.property
    @jsii.member(jsii_name="endInclusiveInput")
    def end_inclusive_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="startInclusiveInput")
    def start_inclusive_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="endInclusive")
    def end_inclusive(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endInclusive"))

    @end_inclusive.setter
    def end_inclusive(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__19ee8f3e0404db648501bee82735473333e18e2d480ca00c46608049161a10c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "endInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startInclusive")
    def start_inclusive(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startInclusive"))

    @start_inclusive.setter
    def start_inclusive(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aaea8b598ba0f827245978dfa78ad75f58a92d88001d276d2ddb72e16c141a18)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFirstObservedAt]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFirstObservedAt]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFirstObservedAt]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c230b749181bc8cf6bcae4c376934f561b28021077066c76cb13c66f0e60d635)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFixAvailable",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaFixAvailable:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b631aa1d78ea3a7df065bf11216c68c9544b6cc420d430ef0dcf30a28be155a4)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaFixAvailable(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaFixAvailableList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFixAvailableList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0cef6e62894d93e6bd2e1aab805cc76d866a4a707d3183d369889a10d581b720)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaFixAvailableOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e008003b3e3f4c611660142b50345f8d663e291c764bb8a84e95955063c07513)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaFixAvailableOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9bd4de1e267ec9ed8c0e4acc4f609f255eb5eb6d2cd19513dc0986b56b93376)
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
            type_hints = typing.get_type_hints(_typecheckingstub__72715f2af1af9c536300772ed6f83aa45505fc40466fb8ec4e8a07ef52763e4f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ff529d215a874cf011e07fb9bb76692cbd29d3036a5994a53d3f834e1f2da330)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFixAvailable]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFixAvailable]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFixAvailable]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ca829aed3cd5ea43d9d2685cd24894f29eb5bd5a8dfa105181ddc8cb803e42a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaFixAvailableOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaFixAvailableOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6ab19058daf06f0ffbc596f77f4b7a4d4868cb8de114a0d703e373805865782b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__516b2ad9b27a9c60854826b2f8e0f31bb67981381e77ad5e3ae2f6b61cf28a15)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7305a4e5bacf3c0f9ef409c95ae361de59e14edd649d7ed815e658225912a470)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFixAvailable]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFixAvailable]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFixAvailable]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3355adcde52fb15d6705f3f581dca3d29f6aeeecde22a1b9597ef1c416fb2246)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaInspectorScore",
    jsii_struct_bases=[],
    name_mapping={
        "lower_inclusive": "lowerInclusive",
        "upper_inclusive": "upperInclusive",
    },
)
class Inspector2FilterFilterCriteriaInspectorScore:
    def __init__(
        self,
        *,
        lower_inclusive: jsii.Number,
        upper_inclusive: jsii.Number,
    ) -> None:
        '''
        :param lower_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lower_inclusive Inspector2Filter#lower_inclusive}.
        :param upper_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#upper_inclusive Inspector2Filter#upper_inclusive}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__68aa200d664c3982825a222982a11dc5dfb952018ab41a29bcb4f623596ec2db)
            check_type(argname="argument lower_inclusive", value=lower_inclusive, expected_type=type_hints["lower_inclusive"])
            check_type(argname="argument upper_inclusive", value=upper_inclusive, expected_type=type_hints["upper_inclusive"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "lower_inclusive": lower_inclusive,
            "upper_inclusive": upper_inclusive,
        }

    @builtins.property
    def lower_inclusive(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lower_inclusive Inspector2Filter#lower_inclusive}.'''
        result = self._values.get("lower_inclusive")
        assert result is not None, "Required property 'lower_inclusive' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def upper_inclusive(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#upper_inclusive Inspector2Filter#upper_inclusive}.'''
        result = self._values.get("upper_inclusive")
        assert result is not None, "Required property 'upper_inclusive' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaInspectorScore(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaInspectorScoreList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaInspectorScoreList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8cffe669250f0ab5eb83b97c63d98ca041224fe4cd8dde0249f6038e672921e5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaInspectorScoreOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a69c67c03d98a529895715158bcf8cfbee0d61aaa25be92446fa375bdd3f58e9)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaInspectorScoreOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a39944b5d485a800c185c6a21e0539c5a7e71fcace774cc8132a5f04da85581f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__085f029247e220e2a4e4428ab5b2943ef9ae809e53567fe0aa9b68cb8d47ec64)
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
            type_hints = typing.get_type_hints(_typecheckingstub__033d10d0e3fdc84634e62513df7fb5dfbfc2339b7d643e8e11105fdfa6d37a85)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaInspectorScore]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaInspectorScore]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaInspectorScore]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__246d396b1716471f484ad291c59a53d80d1477549585089501dc1963eac1fad9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaInspectorScoreOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaInspectorScoreOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7ad5d9f411e97ae5ba11c157c7537b3cdc2ea37cb9776699cae4e1472de189da)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="lowerInclusiveInput")
    def lower_inclusive_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "lowerInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="upperInclusiveInput")
    def upper_inclusive_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "upperInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="lowerInclusive")
    def lower_inclusive(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "lowerInclusive"))

    @lower_inclusive.setter
    def lower_inclusive(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e844ed5ec572f332930baf4351342e29fd818083d53f593d27a09a4b6366a420)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lowerInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="upperInclusive")
    def upper_inclusive(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "upperInclusive"))

    @upper_inclusive.setter
    def upper_inclusive(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9de2b4e216d1ab2bdb2c746ad0b930a068bcb1c55ad872309ea054075efea458)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "upperInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaInspectorScore]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaInspectorScore]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaInspectorScore]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf31badc15bee52b4194ab4d141e8222be3795e3d0f72a9170f20c2f70161aaf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__777900400d0a6da776094e77e3e27d40f084b0fcd8a92babf9c6a749dd097f2f)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArnList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArnList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__30fde9478e5688cf8644af9b8dbb183d2184519bebda047a767135db152d65a3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArnOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca3cb6e52ea4d2bdd1fc903bc96685ae252a5c94728dc8ba3c2db1f2883a5754)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArnOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__594b3550b3d22f3c5886f7c0e6ffaf14987c2f4ba7a529f3bf8e61eaf82742b6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__662ed9288309775d7cf049e65148469a06725e2c60a2d637ffbe011cffecc41d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__43a298d9c52a2c97c9e4ba719a586bbcd908853c1f256d512c7e6207a06a38d5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e48f7970a055e3a02e98fbe9070ab13d9bc1c5a1bc4fa9cddf8847bd55d582e0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArnOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArnOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a7a24cd52f41e9b83883295ba9fc6ce7c105e0c2954be2660d7b12f6cff5d301)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__467f5313aa2901aea8433fb7143fd24c30f51858a7592e25d348f3dcc919b8fe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bcbfc0170f9d869f09db427332e1bc93c74483149c81e9a2fe7f4fb4dfd07e64)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc611c25c489c406b2d354ff3032dcb3f0dd9e1617b5cee8035e783fbdb35da0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt",
    jsii_struct_bases=[],
    name_mapping={
        "end_inclusive": "endInclusive",
        "start_inclusive": "startInclusive",
    },
)
class Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt:
    def __init__(
        self,
        *,
        end_inclusive: typing.Optional[builtins.str] = None,
        start_inclusive: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param end_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.
        :param start_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#start_inclusive Inspector2Filter#start_inclusive}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca0042cae07db9922652ed1046b94d0cf2abc48f32462a63c5471453f0b81f1d)
            check_type(argname="argument end_inclusive", value=end_inclusive, expected_type=type_hints["end_inclusive"])
            check_type(argname="argument start_inclusive", value=start_inclusive, expected_type=type_hints["start_inclusive"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if end_inclusive is not None:
            self._values["end_inclusive"] = end_inclusive
        if start_inclusive is not None:
            self._values["start_inclusive"] = start_inclusive

    @builtins.property
    def end_inclusive(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.'''
        result = self._values.get("end_inclusive")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def start_inclusive(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#start_inclusive Inspector2Filter#start_inclusive}.'''
        result = self._values.get("start_inclusive")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAtList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAtList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2972013ac1ba376e07f73fc7d4bd8f6cf36d1a4946a0f5b63e8c8c62662278d8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAtOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a00808c96cc9000aede488fb5dd8fe9d6e9b1cc97495693b319555be4bc4edd9)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAtOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43d213fa1e29208eeca4206ae583d8726dfc347b8fe584fd0dd10f5de8161fae)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e7c9ed52f4d64741c6a687d493f07717a59f47321967c4df30c7dc77f5dc88f1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bdf4c9e96c3f40e1fbde9ace455bcae636441f7978d7a8c53cbd37e008143671)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d9055d01ef2b3aef4e109cb47d57fd881dea9982b3c899319d2cb08ee658ee6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAtOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAtOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f8516f0ff889bcf5d5f3ba97eca89fec2c55f900b44994bb59fc34327fa0ec12)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetEndInclusive")
    def reset_end_inclusive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEndInclusive", []))

    @jsii.member(jsii_name="resetStartInclusive")
    def reset_start_inclusive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStartInclusive", []))

    @builtins.property
    @jsii.member(jsii_name="endInclusiveInput")
    def end_inclusive_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="startInclusiveInput")
    def start_inclusive_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="endInclusive")
    def end_inclusive(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endInclusive"))

    @end_inclusive.setter
    def end_inclusive(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d9629d7788b0c6eecd9db337d7993783c1d4a4cf68394858baa3d4724880118)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "endInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startInclusive")
    def start_inclusive(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startInclusive"))

    @start_inclusive.setter
    def start_inclusive(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87285509c7b92554abb50a0f5d198e86ac27b990bf4f2c15d6934d89397eb16a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e0d3d6d936369dcfbcda9d15771fdd06783fd8fd1b5c8750fd02cbda093b8fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionLayers",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaLambdaFunctionLayers:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__282f23e5003376db617655027830690d7f84becc56304a0f6df503700f96ce97)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaLambdaFunctionLayers(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaLambdaFunctionLayersList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionLayersList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dfbaa75f01a0028fce570d55622c608f6937c43ec5216b79b707420bb7f5286b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaLambdaFunctionLayersOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a1edb55c002cfb054944de2277c4e264e49ea085df60e150ff3e87499d26286)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaLambdaFunctionLayersOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04f5b8f2abb169f63a847ea8281bc5324f2abcf397da1a78f94ab8d590526bec)
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
            type_hints = typing.get_type_hints(_typecheckingstub__fe617ea227a2ce2fb933d6b4a1c719cdabef8a40cee0f5820cff817f5896bc2e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6770b52c6d0655291f84b2af82fc459e59f215f9d0ea134b9efeef96698cafce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionLayers]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionLayers]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionLayers]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2432c8bd4ed30699afb73a365377550b9a8674f830b059216d9848ff04a4b14)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaLambdaFunctionLayersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionLayersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ce74b96f22d8665e5f545ddee615e230f8e74c59b9b8c4dbed40089abef6696c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a5dd23cc1c90dc9cb58b347b193a75120682b6518092f9b5eff07cacf302ed8c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__382c6a8f975925b494783175efb7e09c99a45e66939eb078bb8dfc584eadead6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionLayers]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionLayers]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionLayers]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0eaddedd78d66f247ea29ba2b3accc4ae57af1d9985dddf14c63595aa47c1dc9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionName",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaLambdaFunctionName:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c66c4b485b04170c1c143bfcfc8cf837b6a874064d3dad79cb919f6b18287976)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaLambdaFunctionName(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaLambdaFunctionNameList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionNameList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2afd2da3d66b4e5076cc54647473027bac79b2d10bd7613817ab3cbd624f89b3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaLambdaFunctionNameOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8e1f845e8facbbd7c264a77959bda0388780604b6de8746f853c8dee0b77325)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaLambdaFunctionNameOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c272b9559f7f9f335de88ceb777dfea2f76e403ae31133a234024e9683b84d15)
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
            type_hints = typing.get_type_hints(_typecheckingstub__93a50ff62accfd6a9410ccbb5bcd260fc078aa36bba85cc2c174c48e5a137798)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2e52e76241cb3bf1f192975a2df2124aa3407cc3c09f210e7808a0ce7b078c36)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionName]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionName]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f782d6127d34e7564f59095886d913b24584bba4cc10d98b4a064c0660171cae)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaLambdaFunctionNameOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionNameOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f5c760d2b2876238390b8b7f99f957b3e599a066046ce3da96066ccb52b83265)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__afa0987c33ef33e4474a0a8a49842006b81a2e2a706235df3dcc156523698b15)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61c942e8e6db0eff376dad35ed6620d08204b2aa7156d645507489b99e71c2e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionName]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionName]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionName]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5170f5b274ac303f796c1d095fefce412ceb68b9f2758dba3c848fc0c123e0db)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionRuntime",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaLambdaFunctionRuntime:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6c1496586b235ad6d974aeccaeaed4803824e1a88ebeded7480e8b3d536f18c)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaLambdaFunctionRuntime(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaLambdaFunctionRuntimeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionRuntimeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__589912fedd0feaae2b2da9936f9d5d5aa4d473015f90d04158863de6579a05a2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaLambdaFunctionRuntimeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc6f56792ec721612c9dcb333cb4f4d0ecb8dcda77206d3f2cfe0192621c2c80)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaLambdaFunctionRuntimeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9cd67a049a12d4905aef97cc1d91af11772f420ca6e95f232b1d79ebefd6ad32)
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
            type_hints = typing.get_type_hints(_typecheckingstub__10102fd1ff0cddf8a451f0106dd86fe7f0080a4ba72027c9c89a6140f1e2556b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f00916574b933eae43a4dd29c3c823c5addf49e62ae69574f534dea1b29357a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionRuntime]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionRuntime]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionRuntime]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aeb278b99beb755d09efe66f4b45504a4eb5016a80164d8fce99dcf110f63aa4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaLambdaFunctionRuntimeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLambdaFunctionRuntimeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__951faa0a8d5ba2cbd01f418ccab48c567777d143b79a827ba8cab1d78b038798)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae742385c3c2fadb55ea6512a20b52805de150510c2944ddb587450f7e8a961e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__760f7fce76bc7ef20665265c2d6f22246a94dfdb8c3598e3f23bc2d8d3234f1c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionRuntime]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionRuntime]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionRuntime]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f47fe76c986505a4de1915b8e76e0b1b25cf4cde256cde4dc0257b24d8b3e7fc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLastObservedAt",
    jsii_struct_bases=[],
    name_mapping={
        "end_inclusive": "endInclusive",
        "start_inclusive": "startInclusive",
    },
)
class Inspector2FilterFilterCriteriaLastObservedAt:
    def __init__(
        self,
        *,
        end_inclusive: typing.Optional[builtins.str] = None,
        start_inclusive: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param end_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.
        :param start_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#start_inclusive Inspector2Filter#start_inclusive}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e9bb269e23137c913a3273acdb32b92d64ca5e313e2bec208bef97018b885408)
            check_type(argname="argument end_inclusive", value=end_inclusive, expected_type=type_hints["end_inclusive"])
            check_type(argname="argument start_inclusive", value=start_inclusive, expected_type=type_hints["start_inclusive"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if end_inclusive is not None:
            self._values["end_inclusive"] = end_inclusive
        if start_inclusive is not None:
            self._values["start_inclusive"] = start_inclusive

    @builtins.property
    def end_inclusive(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.'''
        result = self._values.get("end_inclusive")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def start_inclusive(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#start_inclusive Inspector2Filter#start_inclusive}.'''
        result = self._values.get("start_inclusive")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaLastObservedAt(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaLastObservedAtList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLastObservedAtList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2b8b82ac4bc2335c945e70d23394c73fb896f2ebbed07b596465193a17680923)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaLastObservedAtOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efc86ba1a9a26fa5fb191735db51591e430cc4bedd5dde09c7f26e49846fdbb4)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaLastObservedAtOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db00c74046d6dfe3160e1e36390580791c171e0e50c4e1999d233a8ed202af59)
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
            type_hints = typing.get_type_hints(_typecheckingstub__33d3c8d00155de3e5853f5975fb10ab8167399400b26ce7294363b179199acb1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__08669277ea042b5d5ea4604c50708639a50682385bc2aa52523cab12afb91019)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLastObservedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLastObservedAt]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLastObservedAt]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b06eaa1929d4346067160f126ea4981b119c8bf785b4c0bae58c09d492309380)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaLastObservedAtOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaLastObservedAtOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7cd23662419ab3b82b17c1f8119cb08faa84f998d3e59948761856fe81d11a03)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetEndInclusive")
    def reset_end_inclusive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEndInclusive", []))

    @jsii.member(jsii_name="resetStartInclusive")
    def reset_start_inclusive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStartInclusive", []))

    @builtins.property
    @jsii.member(jsii_name="endInclusiveInput")
    def end_inclusive_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="startInclusiveInput")
    def start_inclusive_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="endInclusive")
    def end_inclusive(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endInclusive"))

    @end_inclusive.setter
    def end_inclusive(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__759dc816a03c9f09122366ba148e07da92b638f532d742426ad147c409df8954)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "endInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startInclusive")
    def start_inclusive(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startInclusive"))

    @start_inclusive.setter
    def start_inclusive(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd54d9efffc9dc2adf238b6a6ae389e960b2a3d12bc3f805de0f88e5125f937b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLastObservedAt]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLastObservedAt]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLastObservedAt]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dd8e8f2991fc47fa2d7247f397871237aeb5c0125729586b2d4123d6680535f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ea6e4c320456f47879d5b2aa775e178ab69f57dd882f159bfaaca17da757d41d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a0d79ef7c86da1731471ba381e192cb4611cda74a01164e4781413d36774e4d)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8df28f905c1bc958e56639d90dd7bc97d3f45447b9f6c4d058529446843dbec1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f5651312aee95ee580d11da1a48fb0f14386475d9b97af1e723507bbd9238b2f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ce3079e1347b79eac00af079f48221f2cd460397e571a6aa3f7b8024626ed822)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteria]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteria]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteria]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__45a26496df0fea4a92e2bfeb5682cb6f65ea5173d69ee356a82f070b2d8a0114)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaNetworkProtocol",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaNetworkProtocol:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75c0402e453e6a594dc861afa74f75224dc7fe3aeb0f2b8cc6b0cec71317bffa)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaNetworkProtocol(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaNetworkProtocolList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaNetworkProtocolList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0ccdf95749ae2056b59f4b0f1483c688e0c34e27278f1e96f7fe7f8629865e26)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaNetworkProtocolOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9cfb0bdb0eacd073baaaa829e17a2b1773e9e88ad7a5ea2331cf6146880cc1bf)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaNetworkProtocolOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b55a509a48a6a95fb06332ee44a5bf64e75e106f1b0112971b94025115f3f9b8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f6318c6c8554a848790e3170314ffee48ff3533f3d26b73c4086b1f0c59c71a5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1df39f53423fc1bc6a23531a5aaa79d9511b3eab46d98be456cf94bf9d415d6e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaNetworkProtocol]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaNetworkProtocol]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaNetworkProtocol]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a1ea8a7ac749bd59e5276add05c770380b3ac165ac2aed3ece2622cfb10da377)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaNetworkProtocolOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaNetworkProtocolOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1616075f00f5c8b9efe5079f24d9aab01b0b69e5fa529608113353239017c3c9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc2f982ec7338c78380783046f1095bb6cc720dffd39bf6aa1e7dd67478d84a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21e22570dcc86a49d92dd685698032f6758c0fb8d4e4c40d739eb8401387eb1b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaNetworkProtocol]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaNetworkProtocol]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaNetworkProtocol]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3db6d6800bb4ddfb5f7343d1534692d9a6850f0268d9e061ecd938057de659a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__69d5510ccf0ddb7e8188e0821d4aebec3964e60a940ed4395778ceb31166cce5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putAwsAccountId")
    def put_aws_account_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaAwsAccountId, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__63a390713aaf910f295188f51fdd85769ce9a9edb3352c6045457e4a500dc95e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putAwsAccountId", [value]))

    @jsii.member(jsii_name="putCodeVulnerabilityDetectorName")
    def put_code_vulnerability_detector_name(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d642c74db906e4bfd31383da390c47f81c62334b8ae45c9cf1dfa1d6dd1a517b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCodeVulnerabilityDetectorName", [value]))

    @jsii.member(jsii_name="putCodeVulnerabilityDetectorTags")
    def put_code_vulnerability_detector_tags(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2d0f05ba408b4f64908bc08d06543390c331a52aa6511d109f5e3daab34c8710)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCodeVulnerabilityDetectorTags", [value]))

    @jsii.member(jsii_name="putCodeVulnerabilityFilePath")
    def put_code_vulnerability_file_path(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__364e767448b7121736c3d4658ed48e67b37dbcb33f800c676355c86a44057cf0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCodeVulnerabilityFilePath", [value]))

    @jsii.member(jsii_name="putComponentId")
    def put_component_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaComponentId, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e5d421d86b4262fdd86ba5ac4716a7c58993f5311ca7382a96802f9b2fb4e38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putComponentId", [value]))

    @jsii.member(jsii_name="putComponentType")
    def put_component_type(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaComponentType, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb089c65e464bf3aafabbe22f4f278484592c9716dd8c050aaa02d3928a9711f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putComponentType", [value]))

    @jsii.member(jsii_name="putEc2InstanceImageId")
    def put_ec2_instance_image_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEc2InstanceImageId, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eeecf552bffe52b4eee5877feb874fc676c607b7501f79869c52ec74d28b2b15)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEc2InstanceImageId", [value]))

    @jsii.member(jsii_name="putEc2InstanceSubnetId")
    def put_ec2_instance_subnet_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEc2InstanceSubnetId, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd4ce61eb162b79b1436d54211639f0f0b4a168ac90a4dd67ebdec88e2a2f8d6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEc2InstanceSubnetId", [value]))

    @jsii.member(jsii_name="putEc2InstanceVpcId")
    def put_ec2_instance_vpc_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEc2InstanceVpcId, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0aebf77cdf5ac34276f784139490af676d9716f482a0ec9c37daa4b0c0605e45)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEc2InstanceVpcId", [value]))

    @jsii.member(jsii_name="putEcrImageArchitecture")
    def put_ecr_image_architecture(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageArchitecture, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40788e5f599126508fc75830c31c0c48bb2f03bda8004a6055f918c9f12b8247)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEcrImageArchitecture", [value]))

    @jsii.member(jsii_name="putEcrImageHash")
    def put_ecr_image_hash(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageHash, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__befbb2f48a4fa92172b269488305fc0cba943413455deceb2f65a7f69af9daa9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEcrImageHash", [value]))

    @jsii.member(jsii_name="putEcrImagePushedAt")
    def put_ecr_image_pushed_at(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImagePushedAt, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81ddfb17e844715d28882ddced5e87bc065d87a2b72cf092f8c2ab1fad2d0a5f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEcrImagePushedAt", [value]))

    @jsii.member(jsii_name="putEcrImageRegistry")
    def put_ecr_image_registry(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageRegistry, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff6db8868aa25a5f5c7176b88a6b5caa68a1a2afa2adeef89bf5e5d49aab0d7b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEcrImageRegistry", [value]))

    @jsii.member(jsii_name="putEcrImageRepositoryName")
    def put_ecr_image_repository_name(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageRepositoryName, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__94105dac5e6153171bcf8f6cad4592ec21f49fe69d59df364f0519dea9e89410)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEcrImageRepositoryName", [value]))

    @jsii.member(jsii_name="putEcrImageTags")
    def put_ecr_image_tags(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageTags, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d2e983fd163b57aded7ce72fd3821884e1e1252565055c5240c1af56820d153)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEcrImageTags", [value]))

    @jsii.member(jsii_name="putEpssScore")
    def put_epss_score(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEpssScore, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bb5c19c011b0e942444e371771d5117ea35e012781ef1821b0eff822259abf28)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEpssScore", [value]))

    @jsii.member(jsii_name="putExploitAvailable")
    def put_exploit_available(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaExploitAvailable, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3dbbcc19de6ed6152923c4402aae4b0644be86ec7b0661e3bc5374f9edc57600)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putExploitAvailable", [value]))

    @jsii.member(jsii_name="putFindingArn")
    def put_finding_arn(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFindingArn, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c5eed597528fc3185563884cb4b4e99e5acc7396e6c4e21c275d927f30ac29d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFindingArn", [value]))

    @jsii.member(jsii_name="putFindingStatus")
    def put_finding_status(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFindingStatus, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cea1ca227dee2d82199a466b0366eae8ba5ddd273bdabe96481b03923207bea0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFindingStatus", [value]))

    @jsii.member(jsii_name="putFindingType")
    def put_finding_type(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFindingType, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d474c19ffa94a32150a01e5e17ff90a4e38f8eb36769a611d9264c224eccde93)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFindingType", [value]))

    @jsii.member(jsii_name="putFirstObservedAt")
    def put_first_observed_at(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFirstObservedAt, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__48bbffba39167b3cffe4191d1f867afbe6f411a6a6135e5a3584e02f7d448f4d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFirstObservedAt", [value]))

    @jsii.member(jsii_name="putFixAvailable")
    def put_fix_available(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFixAvailable, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__65dec2cd237df15829f97fd5d8de2584c99e7bdb93b366daca8ebf7f14746a3a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFixAvailable", [value]))

    @jsii.member(jsii_name="putInspectorScore")
    def put_inspector_score(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaInspectorScore, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9e71de73d996d96cdc6488a67a4ea72361a47ce61de2aba5a3260b6bf0a98bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInspectorScore", [value]))

    @jsii.member(jsii_name="putLambdaFunctionExecutionRoleArn")
    def put_lambda_function_execution_role_arn(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2555942179d566592a36ebad176df043d6ffed522f184bda33b78725f90537e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putLambdaFunctionExecutionRoleArn", [value]))

    @jsii.member(jsii_name="putLambdaFunctionLastModifiedAt")
    def put_lambda_function_last_modified_at(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c17399ce03526bac81eea98f68795cbf64209a087825c211fd19a0ecf255ed87)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putLambdaFunctionLastModifiedAt", [value]))

    @jsii.member(jsii_name="putLambdaFunctionLayers")
    def put_lambda_function_layers(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionLayers, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4dcb2ee96962363541f9ebab8aacc9164fe91cbb447fade12940940e61c9e18c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putLambdaFunctionLayers", [value]))

    @jsii.member(jsii_name="putLambdaFunctionName")
    def put_lambda_function_name(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionName, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f7070539dc44d6132bffaa5242861dbc616440af3cf221473506af60a58b72f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putLambdaFunctionName", [value]))

    @jsii.member(jsii_name="putLambdaFunctionRuntime")
    def put_lambda_function_runtime(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionRuntime, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__274718d19fec77b6df87f476388e6167c52ec58ef1973b08147e7d08e4d50c6b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putLambdaFunctionRuntime", [value]))

    @jsii.member(jsii_name="putLastObservedAt")
    def put_last_observed_at(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLastObservedAt, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efa00b827a5e09a242c81cc0b4dc2b6015d6c9ae6be1238fcac99626f0a4dc27)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putLastObservedAt", [value]))

    @jsii.member(jsii_name="putNetworkProtocol")
    def put_network_protocol(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaNetworkProtocol, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__076c77e8297c92ece2dd559703e88f48c3685223ffc9d3028664be0010e18aad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putNetworkProtocol", [value]))

    @jsii.member(jsii_name="putPortRange")
    def put_port_range(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaPortRange", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96ee06739d996a4e4fc4c2b17555b5ed89b3ad2365de8d12781ca41c2bbc7555)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPortRange", [value]))

    @jsii.member(jsii_name="putRelatedVulnerabilities")
    def put_related_vulnerabilities(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaRelatedVulnerabilities", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d4446f5ff11b5f030dda1a086ac32eba3689555c3072439f3c683ea765ec7ff6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRelatedVulnerabilities", [value]))

    @jsii.member(jsii_name="putResourceId")
    def put_resource_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaResourceId", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b77f445e2f790e5e1bfa8047b5b7f6d1cff238e9da9e3a7d96b9840f60c37a8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceId", [value]))

    @jsii.member(jsii_name="putResourceTags")
    def put_resource_tags(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaResourceTags", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2bed61a61d8a7471c080a2b457bf0036d795f13f251d69b97c729e3b78dc7dae)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceTags", [value]))

    @jsii.member(jsii_name="putResourceType")
    def put_resource_type(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaResourceType", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d60adae01ababc9b1e7910af55c31b54588354c37c6814a2168347ce27ee145f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceType", [value]))

    @jsii.member(jsii_name="putSeverity")
    def put_severity(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaSeverity", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9dd8e7f2c476028f771596ef9a4f2eff2546bcb21f32ad7a27020853a809eaa0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSeverity", [value]))

    @jsii.member(jsii_name="putTitle")
    def put_title(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaTitle", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0fd6bdbbd4351e491ed7b0163cf0d7cfbc635442afece5849584ce00fe5f95ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTitle", [value]))

    @jsii.member(jsii_name="putUpdatedAt")
    def put_updated_at(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaUpdatedAt", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9dda4afc7a1c77598caf5da9867068e6b99942253e18bbe6d971f805f51442ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putUpdatedAt", [value]))

    @jsii.member(jsii_name="putVendorSeverity")
    def put_vendor_severity(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVendorSeverity", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d39700048475e9913051882dc04a3b2546ea8b9c1114a208d66059557030dec8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putVendorSeverity", [value]))

    @jsii.member(jsii_name="putVulnerabilityId")
    def put_vulnerability_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerabilityId", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78852e3e407e599e8fecb096521f30f6708665392195abaf2cb66dccc5f55dd1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putVulnerabilityId", [value]))

    @jsii.member(jsii_name="putVulnerabilitySource")
    def put_vulnerability_source(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerabilitySource", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5320c4eabc264b22399393c996393a8b3f48737a6d2f6e97847a130ed6343895)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putVulnerabilitySource", [value]))

    @jsii.member(jsii_name="putVulnerablePackages")
    def put_vulnerable_packages(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackages", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8eacc3286f230765a9526d35249434b9d1e76746d5be8e12591c6e7912d4ce6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putVulnerablePackages", [value]))

    @jsii.member(jsii_name="resetAwsAccountId")
    def reset_aws_account_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAwsAccountId", []))

    @jsii.member(jsii_name="resetCodeVulnerabilityDetectorName")
    def reset_code_vulnerability_detector_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCodeVulnerabilityDetectorName", []))

    @jsii.member(jsii_name="resetCodeVulnerabilityDetectorTags")
    def reset_code_vulnerability_detector_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCodeVulnerabilityDetectorTags", []))

    @jsii.member(jsii_name="resetCodeVulnerabilityFilePath")
    def reset_code_vulnerability_file_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCodeVulnerabilityFilePath", []))

    @jsii.member(jsii_name="resetComponentId")
    def reset_component_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetComponentId", []))

    @jsii.member(jsii_name="resetComponentType")
    def reset_component_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetComponentType", []))

    @jsii.member(jsii_name="resetEc2InstanceImageId")
    def reset_ec2_instance_image_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEc2InstanceImageId", []))

    @jsii.member(jsii_name="resetEc2InstanceSubnetId")
    def reset_ec2_instance_subnet_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEc2InstanceSubnetId", []))

    @jsii.member(jsii_name="resetEc2InstanceVpcId")
    def reset_ec2_instance_vpc_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEc2InstanceVpcId", []))

    @jsii.member(jsii_name="resetEcrImageArchitecture")
    def reset_ecr_image_architecture(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEcrImageArchitecture", []))

    @jsii.member(jsii_name="resetEcrImageHash")
    def reset_ecr_image_hash(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEcrImageHash", []))

    @jsii.member(jsii_name="resetEcrImagePushedAt")
    def reset_ecr_image_pushed_at(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEcrImagePushedAt", []))

    @jsii.member(jsii_name="resetEcrImageRegistry")
    def reset_ecr_image_registry(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEcrImageRegistry", []))

    @jsii.member(jsii_name="resetEcrImageRepositoryName")
    def reset_ecr_image_repository_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEcrImageRepositoryName", []))

    @jsii.member(jsii_name="resetEcrImageTags")
    def reset_ecr_image_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEcrImageTags", []))

    @jsii.member(jsii_name="resetEpssScore")
    def reset_epss_score(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEpssScore", []))

    @jsii.member(jsii_name="resetExploitAvailable")
    def reset_exploit_available(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExploitAvailable", []))

    @jsii.member(jsii_name="resetFindingArn")
    def reset_finding_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFindingArn", []))

    @jsii.member(jsii_name="resetFindingStatus")
    def reset_finding_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFindingStatus", []))

    @jsii.member(jsii_name="resetFindingType")
    def reset_finding_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFindingType", []))

    @jsii.member(jsii_name="resetFirstObservedAt")
    def reset_first_observed_at(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFirstObservedAt", []))

    @jsii.member(jsii_name="resetFixAvailable")
    def reset_fix_available(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFixAvailable", []))

    @jsii.member(jsii_name="resetInspectorScore")
    def reset_inspector_score(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInspectorScore", []))

    @jsii.member(jsii_name="resetLambdaFunctionExecutionRoleArn")
    def reset_lambda_function_execution_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLambdaFunctionExecutionRoleArn", []))

    @jsii.member(jsii_name="resetLambdaFunctionLastModifiedAt")
    def reset_lambda_function_last_modified_at(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLambdaFunctionLastModifiedAt", []))

    @jsii.member(jsii_name="resetLambdaFunctionLayers")
    def reset_lambda_function_layers(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLambdaFunctionLayers", []))

    @jsii.member(jsii_name="resetLambdaFunctionName")
    def reset_lambda_function_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLambdaFunctionName", []))

    @jsii.member(jsii_name="resetLambdaFunctionRuntime")
    def reset_lambda_function_runtime(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLambdaFunctionRuntime", []))

    @jsii.member(jsii_name="resetLastObservedAt")
    def reset_last_observed_at(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLastObservedAt", []))

    @jsii.member(jsii_name="resetNetworkProtocol")
    def reset_network_protocol(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNetworkProtocol", []))

    @jsii.member(jsii_name="resetPortRange")
    def reset_port_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPortRange", []))

    @jsii.member(jsii_name="resetRelatedVulnerabilities")
    def reset_related_vulnerabilities(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRelatedVulnerabilities", []))

    @jsii.member(jsii_name="resetResourceId")
    def reset_resource_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceId", []))

    @jsii.member(jsii_name="resetResourceTags")
    def reset_resource_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceTags", []))

    @jsii.member(jsii_name="resetResourceType")
    def reset_resource_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceType", []))

    @jsii.member(jsii_name="resetSeverity")
    def reset_severity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSeverity", []))

    @jsii.member(jsii_name="resetTitle")
    def reset_title(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTitle", []))

    @jsii.member(jsii_name="resetUpdatedAt")
    def reset_updated_at(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUpdatedAt", []))

    @jsii.member(jsii_name="resetVendorSeverity")
    def reset_vendor_severity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVendorSeverity", []))

    @jsii.member(jsii_name="resetVulnerabilityId")
    def reset_vulnerability_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVulnerabilityId", []))

    @jsii.member(jsii_name="resetVulnerabilitySource")
    def reset_vulnerability_source(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVulnerabilitySource", []))

    @jsii.member(jsii_name="resetVulnerablePackages")
    def reset_vulnerable_packages(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVulnerablePackages", []))

    @builtins.property
    @jsii.member(jsii_name="awsAccountId")
    def aws_account_id(self) -> Inspector2FilterFilterCriteriaAwsAccountIdList:
        return typing.cast(Inspector2FilterFilterCriteriaAwsAccountIdList, jsii.get(self, "awsAccountId"))

    @builtins.property
    @jsii.member(jsii_name="codeVulnerabilityDetectorName")
    def code_vulnerability_detector_name(
        self,
    ) -> Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorNameList:
        return typing.cast(Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorNameList, jsii.get(self, "codeVulnerabilityDetectorName"))

    @builtins.property
    @jsii.member(jsii_name="codeVulnerabilityDetectorTags")
    def code_vulnerability_detector_tags(
        self,
    ) -> Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTagsList:
        return typing.cast(Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTagsList, jsii.get(self, "codeVulnerabilityDetectorTags"))

    @builtins.property
    @jsii.member(jsii_name="codeVulnerabilityFilePath")
    def code_vulnerability_file_path(
        self,
    ) -> Inspector2FilterFilterCriteriaCodeVulnerabilityFilePathList:
        return typing.cast(Inspector2FilterFilterCriteriaCodeVulnerabilityFilePathList, jsii.get(self, "codeVulnerabilityFilePath"))

    @builtins.property
    @jsii.member(jsii_name="componentId")
    def component_id(self) -> Inspector2FilterFilterCriteriaComponentIdList:
        return typing.cast(Inspector2FilterFilterCriteriaComponentIdList, jsii.get(self, "componentId"))

    @builtins.property
    @jsii.member(jsii_name="componentType")
    def component_type(self) -> Inspector2FilterFilterCriteriaComponentTypeList:
        return typing.cast(Inspector2FilterFilterCriteriaComponentTypeList, jsii.get(self, "componentType"))

    @builtins.property
    @jsii.member(jsii_name="ec2InstanceImageId")
    def ec2_instance_image_id(
        self,
    ) -> Inspector2FilterFilterCriteriaEc2InstanceImageIdList:
        return typing.cast(Inspector2FilterFilterCriteriaEc2InstanceImageIdList, jsii.get(self, "ec2InstanceImageId"))

    @builtins.property
    @jsii.member(jsii_name="ec2InstanceSubnetId")
    def ec2_instance_subnet_id(
        self,
    ) -> Inspector2FilterFilterCriteriaEc2InstanceSubnetIdList:
        return typing.cast(Inspector2FilterFilterCriteriaEc2InstanceSubnetIdList, jsii.get(self, "ec2InstanceSubnetId"))

    @builtins.property
    @jsii.member(jsii_name="ec2InstanceVpcId")
    def ec2_instance_vpc_id(self) -> Inspector2FilterFilterCriteriaEc2InstanceVpcIdList:
        return typing.cast(Inspector2FilterFilterCriteriaEc2InstanceVpcIdList, jsii.get(self, "ec2InstanceVpcId"))

    @builtins.property
    @jsii.member(jsii_name="ecrImageArchitecture")
    def ecr_image_architecture(
        self,
    ) -> Inspector2FilterFilterCriteriaEcrImageArchitectureList:
        return typing.cast(Inspector2FilterFilterCriteriaEcrImageArchitectureList, jsii.get(self, "ecrImageArchitecture"))

    @builtins.property
    @jsii.member(jsii_name="ecrImageHash")
    def ecr_image_hash(self) -> Inspector2FilterFilterCriteriaEcrImageHashList:
        return typing.cast(Inspector2FilterFilterCriteriaEcrImageHashList, jsii.get(self, "ecrImageHash"))

    @builtins.property
    @jsii.member(jsii_name="ecrImagePushedAt")
    def ecr_image_pushed_at(self) -> Inspector2FilterFilterCriteriaEcrImagePushedAtList:
        return typing.cast(Inspector2FilterFilterCriteriaEcrImagePushedAtList, jsii.get(self, "ecrImagePushedAt"))

    @builtins.property
    @jsii.member(jsii_name="ecrImageRegistry")
    def ecr_image_registry(self) -> Inspector2FilterFilterCriteriaEcrImageRegistryList:
        return typing.cast(Inspector2FilterFilterCriteriaEcrImageRegistryList, jsii.get(self, "ecrImageRegistry"))

    @builtins.property
    @jsii.member(jsii_name="ecrImageRepositoryName")
    def ecr_image_repository_name(
        self,
    ) -> Inspector2FilterFilterCriteriaEcrImageRepositoryNameList:
        return typing.cast(Inspector2FilterFilterCriteriaEcrImageRepositoryNameList, jsii.get(self, "ecrImageRepositoryName"))

    @builtins.property
    @jsii.member(jsii_name="ecrImageTags")
    def ecr_image_tags(self) -> Inspector2FilterFilterCriteriaEcrImageTagsList:
        return typing.cast(Inspector2FilterFilterCriteriaEcrImageTagsList, jsii.get(self, "ecrImageTags"))

    @builtins.property
    @jsii.member(jsii_name="epssScore")
    def epss_score(self) -> Inspector2FilterFilterCriteriaEpssScoreList:
        return typing.cast(Inspector2FilterFilterCriteriaEpssScoreList, jsii.get(self, "epssScore"))

    @builtins.property
    @jsii.member(jsii_name="exploitAvailable")
    def exploit_available(self) -> Inspector2FilterFilterCriteriaExploitAvailableList:
        return typing.cast(Inspector2FilterFilterCriteriaExploitAvailableList, jsii.get(self, "exploitAvailable"))

    @builtins.property
    @jsii.member(jsii_name="findingArn")
    def finding_arn(self) -> Inspector2FilterFilterCriteriaFindingArnList:
        return typing.cast(Inspector2FilterFilterCriteriaFindingArnList, jsii.get(self, "findingArn"))

    @builtins.property
    @jsii.member(jsii_name="findingStatus")
    def finding_status(self) -> Inspector2FilterFilterCriteriaFindingStatusList:
        return typing.cast(Inspector2FilterFilterCriteriaFindingStatusList, jsii.get(self, "findingStatus"))

    @builtins.property
    @jsii.member(jsii_name="findingType")
    def finding_type(self) -> Inspector2FilterFilterCriteriaFindingTypeList:
        return typing.cast(Inspector2FilterFilterCriteriaFindingTypeList, jsii.get(self, "findingType"))

    @builtins.property
    @jsii.member(jsii_name="firstObservedAt")
    def first_observed_at(self) -> Inspector2FilterFilterCriteriaFirstObservedAtList:
        return typing.cast(Inspector2FilterFilterCriteriaFirstObservedAtList, jsii.get(self, "firstObservedAt"))

    @builtins.property
    @jsii.member(jsii_name="fixAvailable")
    def fix_available(self) -> Inspector2FilterFilterCriteriaFixAvailableList:
        return typing.cast(Inspector2FilterFilterCriteriaFixAvailableList, jsii.get(self, "fixAvailable"))

    @builtins.property
    @jsii.member(jsii_name="inspectorScore")
    def inspector_score(self) -> Inspector2FilterFilterCriteriaInspectorScoreList:
        return typing.cast(Inspector2FilterFilterCriteriaInspectorScoreList, jsii.get(self, "inspectorScore"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionExecutionRoleArn")
    def lambda_function_execution_role_arn(
        self,
    ) -> Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArnList:
        return typing.cast(Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArnList, jsii.get(self, "lambdaFunctionExecutionRoleArn"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionLastModifiedAt")
    def lambda_function_last_modified_at(
        self,
    ) -> Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAtList:
        return typing.cast(Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAtList, jsii.get(self, "lambdaFunctionLastModifiedAt"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionLayers")
    def lambda_function_layers(
        self,
    ) -> Inspector2FilterFilterCriteriaLambdaFunctionLayersList:
        return typing.cast(Inspector2FilterFilterCriteriaLambdaFunctionLayersList, jsii.get(self, "lambdaFunctionLayers"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionName")
    def lambda_function_name(
        self,
    ) -> Inspector2FilterFilterCriteriaLambdaFunctionNameList:
        return typing.cast(Inspector2FilterFilterCriteriaLambdaFunctionNameList, jsii.get(self, "lambdaFunctionName"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionRuntime")
    def lambda_function_runtime(
        self,
    ) -> Inspector2FilterFilterCriteriaLambdaFunctionRuntimeList:
        return typing.cast(Inspector2FilterFilterCriteriaLambdaFunctionRuntimeList, jsii.get(self, "lambdaFunctionRuntime"))

    @builtins.property
    @jsii.member(jsii_name="lastObservedAt")
    def last_observed_at(self) -> Inspector2FilterFilterCriteriaLastObservedAtList:
        return typing.cast(Inspector2FilterFilterCriteriaLastObservedAtList, jsii.get(self, "lastObservedAt"))

    @builtins.property
    @jsii.member(jsii_name="networkProtocol")
    def network_protocol(self) -> Inspector2FilterFilterCriteriaNetworkProtocolList:
        return typing.cast(Inspector2FilterFilterCriteriaNetworkProtocolList, jsii.get(self, "networkProtocol"))

    @builtins.property
    @jsii.member(jsii_name="portRange")
    def port_range(self) -> "Inspector2FilterFilterCriteriaPortRangeList":
        return typing.cast("Inspector2FilterFilterCriteriaPortRangeList", jsii.get(self, "portRange"))

    @builtins.property
    @jsii.member(jsii_name="relatedVulnerabilities")
    def related_vulnerabilities(
        self,
    ) -> "Inspector2FilterFilterCriteriaRelatedVulnerabilitiesList":
        return typing.cast("Inspector2FilterFilterCriteriaRelatedVulnerabilitiesList", jsii.get(self, "relatedVulnerabilities"))

    @builtins.property
    @jsii.member(jsii_name="resourceId")
    def resource_id(self) -> "Inspector2FilterFilterCriteriaResourceIdList":
        return typing.cast("Inspector2FilterFilterCriteriaResourceIdList", jsii.get(self, "resourceId"))

    @builtins.property
    @jsii.member(jsii_name="resourceTags")
    def resource_tags(self) -> "Inspector2FilterFilterCriteriaResourceTagsList":
        return typing.cast("Inspector2FilterFilterCriteriaResourceTagsList", jsii.get(self, "resourceTags"))

    @builtins.property
    @jsii.member(jsii_name="resourceType")
    def resource_type(self) -> "Inspector2FilterFilterCriteriaResourceTypeList":
        return typing.cast("Inspector2FilterFilterCriteriaResourceTypeList", jsii.get(self, "resourceType"))

    @builtins.property
    @jsii.member(jsii_name="severity")
    def severity(self) -> "Inspector2FilterFilterCriteriaSeverityList":
        return typing.cast("Inspector2FilterFilterCriteriaSeverityList", jsii.get(self, "severity"))

    @builtins.property
    @jsii.member(jsii_name="title")
    def title(self) -> "Inspector2FilterFilterCriteriaTitleList":
        return typing.cast("Inspector2FilterFilterCriteriaTitleList", jsii.get(self, "title"))

    @builtins.property
    @jsii.member(jsii_name="updatedAt")
    def updated_at(self) -> "Inspector2FilterFilterCriteriaUpdatedAtList":
        return typing.cast("Inspector2FilterFilterCriteriaUpdatedAtList", jsii.get(self, "updatedAt"))

    @builtins.property
    @jsii.member(jsii_name="vendorSeverity")
    def vendor_severity(self) -> "Inspector2FilterFilterCriteriaVendorSeverityList":
        return typing.cast("Inspector2FilterFilterCriteriaVendorSeverityList", jsii.get(self, "vendorSeverity"))

    @builtins.property
    @jsii.member(jsii_name="vulnerabilityId")
    def vulnerability_id(self) -> "Inspector2FilterFilterCriteriaVulnerabilityIdList":
        return typing.cast("Inspector2FilterFilterCriteriaVulnerabilityIdList", jsii.get(self, "vulnerabilityId"))

    @builtins.property
    @jsii.member(jsii_name="vulnerabilitySource")
    def vulnerability_source(
        self,
    ) -> "Inspector2FilterFilterCriteriaVulnerabilitySourceList":
        return typing.cast("Inspector2FilterFilterCriteriaVulnerabilitySourceList", jsii.get(self, "vulnerabilitySource"))

    @builtins.property
    @jsii.member(jsii_name="vulnerablePackages")
    def vulnerable_packages(
        self,
    ) -> "Inspector2FilterFilterCriteriaVulnerablePackagesList":
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesList", jsii.get(self, "vulnerablePackages"))

    @builtins.property
    @jsii.member(jsii_name="awsAccountIdInput")
    def aws_account_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaAwsAccountId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaAwsAccountId]]], jsii.get(self, "awsAccountIdInput"))

    @builtins.property
    @jsii.member(jsii_name="codeVulnerabilityDetectorNameInput")
    def code_vulnerability_detector_name_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName]]], jsii.get(self, "codeVulnerabilityDetectorNameInput"))

    @builtins.property
    @jsii.member(jsii_name="codeVulnerabilityDetectorTagsInput")
    def code_vulnerability_detector_tags_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags]]], jsii.get(self, "codeVulnerabilityDetectorTagsInput"))

    @builtins.property
    @jsii.member(jsii_name="codeVulnerabilityFilePathInput")
    def code_vulnerability_file_path_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath]]], jsii.get(self, "codeVulnerabilityFilePathInput"))

    @builtins.property
    @jsii.member(jsii_name="componentIdInput")
    def component_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaComponentId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaComponentId]]], jsii.get(self, "componentIdInput"))

    @builtins.property
    @jsii.member(jsii_name="componentTypeInput")
    def component_type_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaComponentType]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaComponentType]]], jsii.get(self, "componentTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="ec2InstanceImageIdInput")
    def ec2_instance_image_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceImageId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceImageId]]], jsii.get(self, "ec2InstanceImageIdInput"))

    @builtins.property
    @jsii.member(jsii_name="ec2InstanceSubnetIdInput")
    def ec2_instance_subnet_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceSubnetId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceSubnetId]]], jsii.get(self, "ec2InstanceSubnetIdInput"))

    @builtins.property
    @jsii.member(jsii_name="ec2InstanceVpcIdInput")
    def ec2_instance_vpc_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceVpcId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceVpcId]]], jsii.get(self, "ec2InstanceVpcIdInput"))

    @builtins.property
    @jsii.member(jsii_name="ecrImageArchitectureInput")
    def ecr_image_architecture_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageArchitecture]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageArchitecture]]], jsii.get(self, "ecrImageArchitectureInput"))

    @builtins.property
    @jsii.member(jsii_name="ecrImageHashInput")
    def ecr_image_hash_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageHash]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageHash]]], jsii.get(self, "ecrImageHashInput"))

    @builtins.property
    @jsii.member(jsii_name="ecrImagePushedAtInput")
    def ecr_image_pushed_at_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImagePushedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImagePushedAt]]], jsii.get(self, "ecrImagePushedAtInput"))

    @builtins.property
    @jsii.member(jsii_name="ecrImageRegistryInput")
    def ecr_image_registry_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageRegistry]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageRegistry]]], jsii.get(self, "ecrImageRegistryInput"))

    @builtins.property
    @jsii.member(jsii_name="ecrImageRepositoryNameInput")
    def ecr_image_repository_name_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageRepositoryName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageRepositoryName]]], jsii.get(self, "ecrImageRepositoryNameInput"))

    @builtins.property
    @jsii.member(jsii_name="ecrImageTagsInput")
    def ecr_image_tags_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageTags]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageTags]]], jsii.get(self, "ecrImageTagsInput"))

    @builtins.property
    @jsii.member(jsii_name="epssScoreInput")
    def epss_score_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEpssScore]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEpssScore]]], jsii.get(self, "epssScoreInput"))

    @builtins.property
    @jsii.member(jsii_name="exploitAvailableInput")
    def exploit_available_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaExploitAvailable]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaExploitAvailable]]], jsii.get(self, "exploitAvailableInput"))

    @builtins.property
    @jsii.member(jsii_name="findingArnInput")
    def finding_arn_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingArn]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingArn]]], jsii.get(self, "findingArnInput"))

    @builtins.property
    @jsii.member(jsii_name="findingStatusInput")
    def finding_status_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingStatus]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingStatus]]], jsii.get(self, "findingStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="findingTypeInput")
    def finding_type_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingType]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingType]]], jsii.get(self, "findingTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="firstObservedAtInput")
    def first_observed_at_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFirstObservedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFirstObservedAt]]], jsii.get(self, "firstObservedAtInput"))

    @builtins.property
    @jsii.member(jsii_name="fixAvailableInput")
    def fix_available_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFixAvailable]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFixAvailable]]], jsii.get(self, "fixAvailableInput"))

    @builtins.property
    @jsii.member(jsii_name="inspectorScoreInput")
    def inspector_score_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaInspectorScore]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaInspectorScore]]], jsii.get(self, "inspectorScoreInput"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionExecutionRoleArnInput")
    def lambda_function_execution_role_arn_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn]]], jsii.get(self, "lambdaFunctionExecutionRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionLastModifiedAtInput")
    def lambda_function_last_modified_at_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt]]], jsii.get(self, "lambdaFunctionLastModifiedAtInput"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionLayersInput")
    def lambda_function_layers_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionLayers]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionLayers]]], jsii.get(self, "lambdaFunctionLayersInput"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionNameInput")
    def lambda_function_name_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionName]]], jsii.get(self, "lambdaFunctionNameInput"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionRuntimeInput")
    def lambda_function_runtime_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionRuntime]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionRuntime]]], jsii.get(self, "lambdaFunctionRuntimeInput"))

    @builtins.property
    @jsii.member(jsii_name="lastObservedAtInput")
    def last_observed_at_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLastObservedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLastObservedAt]]], jsii.get(self, "lastObservedAtInput"))

    @builtins.property
    @jsii.member(jsii_name="networkProtocolInput")
    def network_protocol_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaNetworkProtocol]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaNetworkProtocol]]], jsii.get(self, "networkProtocolInput"))

    @builtins.property
    @jsii.member(jsii_name="portRangeInput")
    def port_range_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaPortRange"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaPortRange"]]], jsii.get(self, "portRangeInput"))

    @builtins.property
    @jsii.member(jsii_name="relatedVulnerabilitiesInput")
    def related_vulnerabilities_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaRelatedVulnerabilities"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaRelatedVulnerabilities"]]], jsii.get(self, "relatedVulnerabilitiesInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceIdInput")
    def resource_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaResourceId"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaResourceId"]]], jsii.get(self, "resourceIdInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTagsInput")
    def resource_tags_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaResourceTags"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaResourceTags"]]], jsii.get(self, "resourceTagsInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTypeInput")
    def resource_type_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaResourceType"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaResourceType"]]], jsii.get(self, "resourceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="severityInput")
    def severity_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaSeverity"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaSeverity"]]], jsii.get(self, "severityInput"))

    @builtins.property
    @jsii.member(jsii_name="titleInput")
    def title_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaTitle"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaTitle"]]], jsii.get(self, "titleInput"))

    @builtins.property
    @jsii.member(jsii_name="updatedAtInput")
    def updated_at_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaUpdatedAt"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaUpdatedAt"]]], jsii.get(self, "updatedAtInput"))

    @builtins.property
    @jsii.member(jsii_name="vendorSeverityInput")
    def vendor_severity_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVendorSeverity"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVendorSeverity"]]], jsii.get(self, "vendorSeverityInput"))

    @builtins.property
    @jsii.member(jsii_name="vulnerabilityIdInput")
    def vulnerability_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerabilityId"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerabilityId"]]], jsii.get(self, "vulnerabilityIdInput"))

    @builtins.property
    @jsii.member(jsii_name="vulnerabilitySourceInput")
    def vulnerability_source_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerabilitySource"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerabilitySource"]]], jsii.get(self, "vulnerabilitySourceInput"))

    @builtins.property
    @jsii.member(jsii_name="vulnerablePackagesInput")
    def vulnerable_packages_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackages"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackages"]]], jsii.get(self, "vulnerablePackagesInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteria]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteria]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteria]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e2fd3ffeaa265887c917b19074ba2b77061fbac028e079dd1c0c2812322dcc1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaPortRange",
    jsii_struct_bases=[],
    name_mapping={
        "begin_inclusive": "beginInclusive",
        "end_inclusive": "endInclusive",
    },
)
class Inspector2FilterFilterCriteriaPortRange:
    def __init__(
        self,
        *,
        begin_inclusive: jsii.Number,
        end_inclusive: jsii.Number,
    ) -> None:
        '''
        :param begin_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#begin_inclusive Inspector2Filter#begin_inclusive}.
        :param end_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__827dcdab8c1edaca529b91ef518d56129860902dfc15e46d4ba3d9c44f4331d5)
            check_type(argname="argument begin_inclusive", value=begin_inclusive, expected_type=type_hints["begin_inclusive"])
            check_type(argname="argument end_inclusive", value=end_inclusive, expected_type=type_hints["end_inclusive"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "begin_inclusive": begin_inclusive,
            "end_inclusive": end_inclusive,
        }

    @builtins.property
    def begin_inclusive(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#begin_inclusive Inspector2Filter#begin_inclusive}.'''
        result = self._values.get("begin_inclusive")
        assert result is not None, "Required property 'begin_inclusive' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def end_inclusive(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.'''
        result = self._values.get("end_inclusive")
        assert result is not None, "Required property 'end_inclusive' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaPortRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaPortRangeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaPortRangeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__41896dc6d26063fa740c4709066ca8d63fe975d544093cbae341bc23f4fbcf06)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaPortRangeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c8d24d9f6d80bbc065626c0011c293df72fa1443f026197512a052d01e958537)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaPortRangeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__90085d5c577e039364f2244a6de4388a9f624ade54c3f4b7bb55d8ab9e0ed5d6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cfbbf58745f7c79c2c0451b32e337362a2620714afa0a1b437e4d351fe23f2ee)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5e893709ec91c34e967b21aee06069a2576598d654afef915c5a7caa4e96f06b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaPortRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaPortRange]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaPortRange]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__50c4d39f2946d9a7d42e1cc1dba551087de5d0dc5acb0faa05ca5f58ef0566d2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaPortRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaPortRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c3ae88e26efe29db7f0957c754da281631af60d65de1934e2d31127f1954a3c1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="beginInclusiveInput")
    def begin_inclusive_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "beginInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="endInclusiveInput")
    def end_inclusive_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "endInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="beginInclusive")
    def begin_inclusive(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "beginInclusive"))

    @begin_inclusive.setter
    def begin_inclusive(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42dc05a5b49b604b26941386b042f557c3045e1aa757915a75406a14f44873d5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "beginInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="endInclusive")
    def end_inclusive(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "endInclusive"))

    @end_inclusive.setter
    def end_inclusive(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ef21dd9ca1366262e4968eb0bae0c5d838a2be059b88c985adfa62746d916da)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "endInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaPortRange]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaPortRange]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaPortRange]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__428416e22186ab93adb2195f2e70741ca8ad5be53fc99f73c722b56b9d26235c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaRelatedVulnerabilities",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaRelatedVulnerabilities:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab9294309ddbafa6fdd2489294f578b3d73e9ef2604fe76239c437e9be9c218f)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaRelatedVulnerabilities(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaRelatedVulnerabilitiesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaRelatedVulnerabilitiesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__04b716eccba885661417ced3138d72f3cae9e6e13a1c87245c91175754a593a8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaRelatedVulnerabilitiesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4cf26d580dcb5d9a1cc7598757a18d03a0902a228ba0fe5d60b2193698782922)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaRelatedVulnerabilitiesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06b29a92360b1ebb13c08a9e08d483858033dc7a98dcba4e0331cb913e2af857)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7bcc56f44b7c75964503a13627977b04df029f3b3797fc74c55f12fc6ad9254b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__acd9d1b8252df832a23250c729edfce0351882c177fd58416b114fecddbd7002)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaRelatedVulnerabilities]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaRelatedVulnerabilities]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaRelatedVulnerabilities]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__216440a9c6549423ca2dea66eb1d121676dc7d95eebe21e29a60242c76ed84f8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaRelatedVulnerabilitiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaRelatedVulnerabilitiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__853523a004ef041a83ecd423f2ce13d8f0e7df92d0d0fba68849364dfcb1c37a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c8a30c944fe3ca56e311eb35c4803ab1beac03c82e0f011bdb21bdaa312ba7c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__89e3d7f138161dc8e8042ae54e33dfd9ee671af9e4cf7f143cd83244b68910fc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaRelatedVulnerabilities]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaRelatedVulnerabilities]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaRelatedVulnerabilities]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4795795516968ab1025bfd2b839bbbd9a939bfb4fcbd0b2746517d2ac5004fea)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaResourceId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaResourceId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06096834ef6116388926bcd944230717dcff824bb19aed70e1c9a01055cf0a4c)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaResourceId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaResourceIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaResourceIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4769e475c0bb4d39546cea67f42d7cf9cbd38e84cb3c4a831f14760590665732)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaResourceIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4c6295bf8edb64753482a6fe653af62d3313c7fd9760ad15cafc527085585ef9)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaResourceIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bfe0b3fc7bef035a18c790da702f88e6e4b8fa49a8e37355ae6901baa044ae70)
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
            type_hints = typing.get_type_hints(_typecheckingstub__40a22d64e4a9a10dfe706da8da21d28b6884ce757c4fec184590c1ef123a5693)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3314e15f4a1197d11f7ca3201f2f22e92318bf288e8f7a7ac7b3e81d4cf66144)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaResourceId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaResourceId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaResourceId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1683869a7c94599c50afa00a57413f31638a55e75f8854c45ba753588a423e59)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaResourceIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaResourceIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c52a3cadba312562b48eba802c680e9430d96994cc4146a546ffd0cfcf93705c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf5f8330e29cc5936a91f037dbe4133140b85af3e935360cdb721235d0367e76)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c15db1d1c4669c6d5f7cb1706f0fdf3047aa706ade97109be9009c1cf2ff7dc2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaResourceId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaResourceId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaResourceId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2523ae72887c6f20b956522dc6b84cc2de6438529efe1cdf69fc730baa7e4972)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaResourceTags",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "key": "key", "value": "value"},
)
class Inspector2FilterFilterCriteriaResourceTags:
    def __init__(
        self,
        *,
        comparison: builtins.str,
        key: builtins.str,
        value: builtins.str,
    ) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#key Inspector2Filter#key}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d4a1b8101d2d677873d43763074f1984883c77f879ee1eafb7cbef602bd96929)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument key", value=key, expected_type=type_hints["key"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "key": key,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#key Inspector2Filter#key}.'''
        result = self._values.get("key")
        assert result is not None, "Required property 'key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaResourceTags(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaResourceTagsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaResourceTagsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cccbf58bebfeaf766f2f988c9facf6f276773af2a979d06c7b56086abd839d7f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaResourceTagsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7ca8b1f30fcdc384e0122584d3b0f36deea44e26bc4763e21fccf33b68af43d1)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaResourceTagsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc2669e266f5e2c323de390294d583092f489ae63bc47008d732e1b6f5238321)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c882b8cf340569ab91c0d145d605d01501af0d768d1e8fb94c14e1518033c3eb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4030e5ad7d919a44eea90f42391c32d40f73192852ded5428c93ef389af53a14)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaResourceTags]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaResourceTags]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaResourceTags]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ff99b1cf0efc25d6d84d9a66262af6797b8907cfdad27c24ae2946979f301e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaResourceTagsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaResourceTagsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__18ce705ca91ecefedf81c75e1b9b27edcad06ad18c7fe36b04d2a4aa72b4597f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="keyInput")
    def key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "keyInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f16818c95c5cf08347bf2bc3065ae9ff1362dba1448c729d2d3ca74ea88516b9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="key")
    def key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "key"))

    @key.setter
    def key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7ba98bd2db8a718e78c9817d21e70e1f25088b786ffd0d659b71da089f9bc7b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "key", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__951ecef9db4039dacc6beb679a2901dc075eed014f51f981199dd96d68b1c1e2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaResourceTags]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaResourceTags]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaResourceTags]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cdcd97f9e7eeb107ac22f67902125836f9a44b7edd690e4516001cf2d85fde3e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaResourceType",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaResourceType:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62db7bbf5e83f956eb5e7df7d1b783f196f3c3f65723642c84727c4f5003cb72)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaResourceType(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaResourceTypeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaResourceTypeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d2ae44c4f4886bd35f8d477290a52d2503ffc1f0edf4f4f80d93393cf745c694)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaResourceTypeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2931f558d279b6bbfe82e7f0de15beed02d804db52fd0a8b38a55faff29f8ab6)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaResourceTypeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b04081f1f9038db3368713d8ef69e6d6adcea741c595dcfc6e4964c56983073)
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
            type_hints = typing.get_type_hints(_typecheckingstub__01170c8da2cce8523d7e180af3d74030d08bd28bc2117708fcf5f65059373e90)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e64deddf681fe30ce57d3cddc78d795942ee3a419a89becbfad0bc9081642a67)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaResourceType]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaResourceType]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaResourceType]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__27b50f7664fd3c20e51fb4d452880defa1bf02a393a40637c3fa0db4b5c42a98)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaResourceTypeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaResourceTypeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7899013eb201102f42a83507d264addae002ba084fe11ec63752a55c6c2aa22a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f9ae9a1bc1d867c7b47d28a0b1b0020022cb38ee0ee3d52aa278147db5a9bea)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49dcb6eca6eca2cdfbe00abb57d9835ae4096b8a9ba1ef8be843e13328260afb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaResourceType]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaResourceType]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaResourceType]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b00ed05b5a562cb52da0f405a90e0930c27dd24ac7ae228584ccf2d50bc5601)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaSeverity",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaSeverity:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d3f62e3f653dc6738f6af5aa357c545c9625b6dff7d36adac1207620c7eec48)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaSeverity(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaSeverityList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaSeverityList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__81b0eae7aeec1696ad9dc59c4a628f6fd3988eed0d6247d8e7f5ea9fd4ed96b9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaSeverityOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc59cf8f247b932ea63aba974dae422ae4d5ed67f185437377388fb0bf0f611f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaSeverityOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df1f4d5e523bf6a56627d2ddd53d4515b9f3e0d9713e181bf2c8db621044a3c0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6340c01af08b9ca075a865c1e4e267c72fc306caf2c0a8ecb5c00f332add597e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7494797286772b1a3d634db867b13a7c81879a1e9b87738892860b47f875c4cf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaSeverity]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaSeverity]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaSeverity]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__198dbf1cd7647161c9a9b109b72cbed0daf5cd0e45ada6c961dbe00ccfee4672)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaSeverityOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaSeverityOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__eaaa56f685738a1370d2865fdee6022f69109a36265b7b24101d8a55e8647939)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1870314ef2f820a6715491a97dbff16e05956621909d674133f75683d70ec61a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8127a388aeae311399fa703efc3323d1ead4b16a523c9d868eccf3a2f6319059)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaSeverity]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaSeverity]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaSeverity]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a26be82dc567f6471e097134a242cbc08225503c3ebba182f912602ebe57585c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaTitle",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaTitle:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32402fdfe80006b44dd73f28fb43e7ad7212651277fb7465ad0428e22b3fa5c9)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaTitle(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaTitleList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaTitleList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e3a35ef6e0c0eb765cc6214e90eaf4e0aa34f58ea1ba9e79a97c6f25cb8cd3df)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaTitleOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__505c455f063a73bb031281c02d73342d5b218da6987f0970ed2c473242436a96)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaTitleOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d9a611f427dc02929fd7a1e7d652035424927be43fded7d08c8e0bc815d9359)
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
            type_hints = typing.get_type_hints(_typecheckingstub__71b6069b7d9b28b935d804575b1242f6de48f4efa16d401f7c82424bfa014c79)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ebfecab57920cfb8ebee52b70b54fe4bbef36abe1840a831fcd5096ecf372fa4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaTitle]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaTitle]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaTitle]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ded665548e7111317372e7ae8ae944c74638caa11fd6a2170f3b486492d766c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaTitleOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaTitleOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2953fe7e0de5bfe90082fde07c924df060947c51049d78d244260ac1572e214f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e83cb244e3f2695c2ff4688bc9f27ff1095198a3fab516271cbe7ac5cd788169)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d881b9151dee74436c193888897da0e60cb401f773aa2c1dcb42296d6277ce5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaTitle]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaTitle]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaTitle]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8cd70a47cf45ef4524fe80bab1b8a5dc106108ff55cc85c69389865de5617ab3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaUpdatedAt",
    jsii_struct_bases=[],
    name_mapping={
        "end_inclusive": "endInclusive",
        "start_inclusive": "startInclusive",
    },
)
class Inspector2FilterFilterCriteriaUpdatedAt:
    def __init__(
        self,
        *,
        end_inclusive: typing.Optional[builtins.str] = None,
        start_inclusive: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param end_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.
        :param start_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#start_inclusive Inspector2Filter#start_inclusive}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__505b98be8f6e4b2dfdd8f5c11f196336943430c9f0d70fe0f5e1200e316ac150)
            check_type(argname="argument end_inclusive", value=end_inclusive, expected_type=type_hints["end_inclusive"])
            check_type(argname="argument start_inclusive", value=start_inclusive, expected_type=type_hints["start_inclusive"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if end_inclusive is not None:
            self._values["end_inclusive"] = end_inclusive
        if start_inclusive is not None:
            self._values["start_inclusive"] = start_inclusive

    @builtins.property
    def end_inclusive(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.'''
        result = self._values.get("end_inclusive")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def start_inclusive(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#start_inclusive Inspector2Filter#start_inclusive}.'''
        result = self._values.get("start_inclusive")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaUpdatedAt(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaUpdatedAtList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaUpdatedAtList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__15f9a66c9648694b24b4fa33402aaa71f12e01b2a8618b9aa31b5545786cae44)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaUpdatedAtOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__98d25a27a7a3751cb3960a4c27479e8604404030aa31eeeb23f251db03263b69)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaUpdatedAtOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__08f95f367d83eb8ff3938fb6d16b5c466ef438bc27b732c6a44a1edfff81d083)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1bc7a8d61cd95622b0f3a58fdbb5d1878a7a9498052c81bff057bad68f2c7419)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a4604bc0bd1475d88324305707dd5d1a952f31dab558ec28d735a8cdad77e33e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaUpdatedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaUpdatedAt]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaUpdatedAt]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c1b6ee1420d00f81fcbf7430495b0308d96de58433c730a3246723a66401a847)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaUpdatedAtOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaUpdatedAtOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a6b18a9c6ef86099f86f3802e09962118207c0e2cdaa29683a8e4933fd839864)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetEndInclusive")
    def reset_end_inclusive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEndInclusive", []))

    @jsii.member(jsii_name="resetStartInclusive")
    def reset_start_inclusive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStartInclusive", []))

    @builtins.property
    @jsii.member(jsii_name="endInclusiveInput")
    def end_inclusive_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="startInclusiveInput")
    def start_inclusive_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="endInclusive")
    def end_inclusive(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endInclusive"))

    @end_inclusive.setter
    def end_inclusive(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b3c36778e91d310c324901e444a0fc21a27585472e984368cb027187132167f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "endInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="startInclusive")
    def start_inclusive(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "startInclusive"))

    @start_inclusive.setter
    def start_inclusive(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f33a6010250e79cc68ec576008ec0a227bb4b5f3c4a36658d3769df97d627b8a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "startInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaUpdatedAt]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaUpdatedAt]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaUpdatedAt]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e13d3d575f13e3e9836d33dfd3e89d466e6c6b09fe4191d159240c599a44e8d8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVendorSeverity",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaVendorSeverity:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df6f4260a9778a2265bb7326b1910635b7f7e22ecb2d695cd17aee985debdc6d)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaVendorSeverity(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaVendorSeverityList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVendorSeverityList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9b36f440bd6809ab19dc4c6efde1e4080225cf1b872bd6362531eb735400047c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaVendorSeverityOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86088d4b36fd5b426b3eb7f3a69d55e232a2e9d066e07750bfcf070b145b4466)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaVendorSeverityOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0806cb4c7ebec0590411138dada88c278a294d83d7df4319aed5822fce0bc160)
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
            type_hints = typing.get_type_hints(_typecheckingstub__052ebd4b762d2540834a8dac46be3497d16d600b1826554b2fc78ce543535e0f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cb41a47a8879dba45d02aff029d9c5c1d5b1491735da08e4caabdab5b9caba2a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVendorSeverity]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVendorSeverity]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVendorSeverity]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf581bc93c7a44b0e1130976ba12cb839f527cf862f1a7e01f19961d23403b9d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVendorSeverityOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVendorSeverityOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__187584c1b67c7ae7f5a5073928ce21fd9b676e8fcd1bab3fcbc980bf13b992d7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a2cb64e722cce29247faad34f439f2136014b13c09a80e898db65b51606c16ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aabb4a5ee2f662f88457adcffbab32f34f6fa4abe506d08f146ab6ddc4ce93a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVendorSeverity]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVendorSeverity]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVendorSeverity]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__294bd8066b627dc31c40743bbf5363d9ce14fcc851411d8a2be2a963783421e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerabilityId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaVulnerabilityId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf9c434795119aa92a1cc9911f570b443592c1e6c1599be047c0014ce733dd9d)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaVulnerabilityId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaVulnerabilityIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerabilityIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bb22c9f39debadf0bf71c49f114b6ca5dcd2b05dbf772316c91215405df93f69)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaVulnerabilityIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f7c2b7abab6fb870d64f894410f0c05bd07618eaecb185e29c338e1574c479f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaVulnerabilityIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c87f2f219f492933cf5b163d26c38c306582e233187e3c33e285234e5ad5f29)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ebf854624f7cdd7a4204d90e31989ccd8addd6eb24c055b5e24e46ef6eb910bb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__411b9002e8dd153a55b45a4ef931f8fbd48232906c5aec35b165daf0fe1ec098)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerabilityId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerabilityId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerabilityId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__20d95d0dcad422b7430b03bd22d47222818206178f48efe02557b13f06541a5e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVulnerabilityIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerabilityIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__05546520c06131a943911fc861ca5425684bbd66fb49920e8b61becc8336819d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__17c4d359bbe706d6c87ee47c09b82566fafad07ddf072e5731dda3e71db26a34)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6799e63b4d1032a0c149367f803677ac3b73d18c353651138e4b661d599c996a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerabilityId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerabilityId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerabilityId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf4cc4603a798c1cda4568157b1d2190836e46c52ee23a19aaedd6efa6a73963)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerabilitySource",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaVulnerabilitySource:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bc61aa3c1c8b939de30c3d2fdf0d0eb195511fdd1e46fc35792f0f173f16949d)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaVulnerabilitySource(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaVulnerabilitySourceList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerabilitySourceList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__65147cd2bc5eb92524fc952379660d6ed669a3ccf2aea5ed6036654d165878af)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaVulnerabilitySourceOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__af753e9122d191c7eb7f70db2dda7250f5c20afe359123105b09ac11aa285ea6)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaVulnerabilitySourceOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e384fa5cf63d3296cacb87d43bfe95d08fc4ddc101be2cdb5adec72c58f387b4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b428fe2af1237ca295d87b933dd3611dfcdbd8d6416e0a9969fd79a11c6cee3b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6269f93cb269793dad02a1daaf7ca0f32ba27ea17080d2ec64e0f7597669760f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerabilitySource]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerabilitySource]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerabilitySource]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81215823ba213a6f50f4aed73967d8d7567e10662ba8a8e08a61348704f61eaa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVulnerabilitySourceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerabilitySourceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4a6783171eac6a5ead1aad058109d4ea7bc5dd4393512512bb0643195bb55fc1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0824073b894c4b078e426dfd1aaf7fa0eeb2091f61a9c7d7d07f19097d489740)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__222c41323ef15a97d31f0bb2c24fdfa98d5ea56be7dd085deb73001454281ff5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerabilitySource]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerabilitySource]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerabilitySource]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5030ab7eed1c1843e6756577fb7e84ada0410e300ca6ef7a62c6049a074eeb01)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackages",
    jsii_struct_bases=[],
    name_mapping={
        "architecture": "architecture",
        "epoch": "epoch",
        "file_path": "filePath",
        "name": "name",
        "release": "release",
        "source_lambda_layer_arn": "sourceLambdaLayerArn",
        "source_layer_hash": "sourceLayerHash",
        "version": "version",
    },
)
class Inspector2FilterFilterCriteriaVulnerablePackages:
    def __init__(
        self,
        *,
        architecture: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture", typing.Dict[builtins.str, typing.Any]]]]] = None,
        epoch: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackagesEpoch", typing.Dict[builtins.str, typing.Any]]]]] = None,
        file_path: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackagesFilePath", typing.Dict[builtins.str, typing.Any]]]]] = None,
        name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackagesName", typing.Dict[builtins.str, typing.Any]]]]] = None,
        release: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackagesRelease", typing.Dict[builtins.str, typing.Any]]]]] = None,
        source_lambda_layer_arn: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn", typing.Dict[builtins.str, typing.Any]]]]] = None,
        source_layer_hash: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash", typing.Dict[builtins.str, typing.Any]]]]] = None,
        version: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackagesVersion", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param architecture: architecture block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#architecture Inspector2Filter#architecture}
        :param epoch: epoch block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#epoch Inspector2Filter#epoch}
        :param file_path: file_path block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#file_path Inspector2Filter#file_path}
        :param name: name block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#name Inspector2Filter#name}
        :param release: release block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#release Inspector2Filter#release}
        :param source_lambda_layer_arn: source_lambda_layer_arn block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#source_lambda_layer_arn Inspector2Filter#source_lambda_layer_arn}
        :param source_layer_hash: source_layer_hash block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#source_layer_hash Inspector2Filter#source_layer_hash}
        :param version: version block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#version Inspector2Filter#version}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d6af750f7316aeedc3143c2ff572f4e351d96bb276d32e8ef284c28f6b708a1e)
            check_type(argname="argument architecture", value=architecture, expected_type=type_hints["architecture"])
            check_type(argname="argument epoch", value=epoch, expected_type=type_hints["epoch"])
            check_type(argname="argument file_path", value=file_path, expected_type=type_hints["file_path"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument release", value=release, expected_type=type_hints["release"])
            check_type(argname="argument source_lambda_layer_arn", value=source_lambda_layer_arn, expected_type=type_hints["source_lambda_layer_arn"])
            check_type(argname="argument source_layer_hash", value=source_layer_hash, expected_type=type_hints["source_layer_hash"])
            check_type(argname="argument version", value=version, expected_type=type_hints["version"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if architecture is not None:
            self._values["architecture"] = architecture
        if epoch is not None:
            self._values["epoch"] = epoch
        if file_path is not None:
            self._values["file_path"] = file_path
        if name is not None:
            self._values["name"] = name
        if release is not None:
            self._values["release"] = release
        if source_lambda_layer_arn is not None:
            self._values["source_lambda_layer_arn"] = source_lambda_layer_arn
        if source_layer_hash is not None:
            self._values["source_layer_hash"] = source_layer_hash
        if version is not None:
            self._values["version"] = version

    @builtins.property
    def architecture(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture"]]]:
        '''architecture block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#architecture Inspector2Filter#architecture}
        '''
        result = self._values.get("architecture")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture"]]], result)

    @builtins.property
    def epoch(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesEpoch"]]]:
        '''epoch block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#epoch Inspector2Filter#epoch}
        '''
        result = self._values.get("epoch")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesEpoch"]]], result)

    @builtins.property
    def file_path(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesFilePath"]]]:
        '''file_path block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#file_path Inspector2Filter#file_path}
        '''
        result = self._values.get("file_path")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesFilePath"]]], result)

    @builtins.property
    def name(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesName"]]]:
        '''name block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#name Inspector2Filter#name}
        '''
        result = self._values.get("name")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesName"]]], result)

    @builtins.property
    def release(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesRelease"]]]:
        '''release block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#release Inspector2Filter#release}
        '''
        result = self._values.get("release")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesRelease"]]], result)

    @builtins.property
    def source_lambda_layer_arn(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn"]]]:
        '''source_lambda_layer_arn block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#source_lambda_layer_arn Inspector2Filter#source_lambda_layer_arn}
        '''
        result = self._values.get("source_lambda_layer_arn")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn"]]], result)

    @builtins.property
    def source_layer_hash(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash"]]]:
        '''source_layer_hash block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#source_layer_hash Inspector2Filter#source_layer_hash}
        '''
        result = self._values.get("source_layer_hash")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash"]]], result)

    @builtins.property
    def version(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesVersion"]]]:
        '''version block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#version Inspector2Filter#version}
        '''
        result = self._values.get("version")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesVersion"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaVulnerablePackages(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__335b750b9bf8f1d699dec4469b47de47f57fd939c36c662c76d0ca7b35e84b0b)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaVulnerablePackagesArchitectureList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesArchitectureList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5f7bdce2df48a2d95f8d2dc0f4bce6328cda2591f99e53dbc8ee20075f37463e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaVulnerablePackagesArchitectureOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8363050dd551aeb35c3170f98572029368eb425e72202286302bc73bc0eaaeaa)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesArchitectureOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1de9adbca32a8742287e522abf1e65ced881197061bc090e641c66aeaf41ca47)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6863885b5178815ba316fd1509b6572b1486d8eef1107ebfc3a5dc39f71c9d3e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b90934478c73036be6bcb965a80d2f6c1a563ea57a4b8f79911c264e5f563c29)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0568b0980c5ec5ae36e0e32e9fe409340452934c262b04ea06c4d0881f4fd9ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVulnerablePackagesArchitectureOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesArchitectureOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f040e73b1d2c04246ab9b493eef642d46454a4d55a77f1074f7a5471624fc7cb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3f970d2a34f9a8d2a44f3743e684b69522f1483b42886fcc9a34949c976ce07d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec711e133b2bdf3f40731652bf247840d5c932e597ff563e5f75b24cbe4b39d5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6560a561904a0c1a4a1de6986747bdb4bce8dcc201077e164398a90c438bec76)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesEpoch",
    jsii_struct_bases=[],
    name_mapping={
        "lower_inclusive": "lowerInclusive",
        "upper_inclusive": "upperInclusive",
    },
)
class Inspector2FilterFilterCriteriaVulnerablePackagesEpoch:
    def __init__(
        self,
        *,
        lower_inclusive: jsii.Number,
        upper_inclusive: jsii.Number,
    ) -> None:
        '''
        :param lower_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lower_inclusive Inspector2Filter#lower_inclusive}.
        :param upper_inclusive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#upper_inclusive Inspector2Filter#upper_inclusive}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ef7fab605e564f5028f1590f0ae050bc0034aa123c7fbaf1689d6e459a0be90)
            check_type(argname="argument lower_inclusive", value=lower_inclusive, expected_type=type_hints["lower_inclusive"])
            check_type(argname="argument upper_inclusive", value=upper_inclusive, expected_type=type_hints["upper_inclusive"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "lower_inclusive": lower_inclusive,
            "upper_inclusive": upper_inclusive,
        }

    @builtins.property
    def lower_inclusive(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lower_inclusive Inspector2Filter#lower_inclusive}.'''
        result = self._values.get("lower_inclusive")
        assert result is not None, "Required property 'lower_inclusive' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def upper_inclusive(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#upper_inclusive Inspector2Filter#upper_inclusive}.'''
        result = self._values.get("upper_inclusive")
        assert result is not None, "Required property 'upper_inclusive' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaVulnerablePackagesEpoch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaVulnerablePackagesEpochList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesEpochList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9154ac8f44a2a6aa6649f9fd1da2424762d11b54de24ef31e9b51e1c7903dbee)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaVulnerablePackagesEpochOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3178071c2cf755d0e74a1425e26ff81e4a852af8ac2800bd5a6f86d8e37e2834)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesEpochOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b579e80b29f07b60e4f18cbf683bcbd2d8f118673345e4c75d4c06962a66d0e0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e25036aa9acd335c43e1b526f2aa877258de1bb9fa0e7ba53a7173563683c68f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__536f817ddecb89da9318ebc6a89a2f361985223ab954e048a22e9be8f608d8f0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesEpoch]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesEpoch]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesEpoch]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4156f4318fab2b8d0de12e6a74ddfbc2171a438531d53d0dd2afbdec5ffa14c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVulnerablePackagesEpochOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesEpochOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9f6fe955e326b0b6e4ab0bf552c539c7ddaa6d7f3bb9ebb575cd6129a1661661)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="lowerInclusiveInput")
    def lower_inclusive_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "lowerInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="upperInclusiveInput")
    def upper_inclusive_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "upperInclusiveInput"))

    @builtins.property
    @jsii.member(jsii_name="lowerInclusive")
    def lower_inclusive(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "lowerInclusive"))

    @lower_inclusive.setter
    def lower_inclusive(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e377ba366e2e1be9520cf0ab4e746cd5c7f91e7df786a428d719866ad9abe2e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lowerInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="upperInclusive")
    def upper_inclusive(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "upperInclusive"))

    @upper_inclusive.setter
    def upper_inclusive(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf8e7cf3d292f366ba579eab062e54b348fb3321217d818411063d3e74ed45f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "upperInclusive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesEpoch]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesEpoch]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesEpoch]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ebd77ebc974ced902a6abd7cd9aec58af5074021195bacc9652c2272a64a8d63)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesFilePath",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaVulnerablePackagesFilePath:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fa333d5a57f5b28c3e08edf6d0efe71a244412af69886fa098019643ce89e5fa)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaVulnerablePackagesFilePath(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaVulnerablePackagesFilePathList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesFilePathList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8ddaf22a005ea880f600889f0e54c1ad46cbd6c498f5e813de6e528bb1f8a9ce)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaVulnerablePackagesFilePathOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d2db1f1e2109b0885e9d31e0a580639900136d86d209c35ec27a526c0d03432f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesFilePathOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43d500d1ae6fd85bdeae00f658a2c8731b879cafb9e983ae162fd10b828f8835)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7a28752608dbafb8766bea5b77638e3d05975593220ac508bd1ebf537affa54d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__101b7d762fddcf0f23d457d000ec4a805b7836be74451ee00e168060e6af563b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesFilePath]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesFilePath]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesFilePath]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0794913b789b992ccc668d0d18e84a96b021accd5f40c391c7db1068e038fb3b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVulnerablePackagesFilePathOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesFilePathOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5e051b9c387df2f0f4932be91e06226135ecb45a3918883e0dfaf6cfbb62355c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3092ece5b1a22f259cab7c6079b2711a1587dd84ca8e58e51e980765c88ce18b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ef74234b1ee21d9a78c60e9ed0a251d09a7ae247c3e800a0ce765136eb0c4b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesFilePath]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesFilePath]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesFilePath]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2684dd7d42033e05fdbcfe79c22fc52bbf6bf889aec2e2dd992154290b691e29)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVulnerablePackagesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__59944d576575c0f7127e64f158bf3b381dfdde07ead465faeeb869208ef1fb7e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaVulnerablePackagesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c81b6e3303db78f4d3f456908eb750fabce5d92f8c42dfd6bfa26f1564cbe37)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f7031695949db5ba61301088f12e5dfaf009b090cd310f602aee17670af701b9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a1903b303b1d4ced684a8d71ee16c026ca8298213c12ff36521d1b7a7a123553)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7c96b43b8d6b978d07aeb039f9c04614bb5f085b892d8ed6708f8a9b8a8bd01c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackages]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackages]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackages]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a1532c34e7372180821320df39aefaf258006aff6a050c2e86546750c8bffc3c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesName",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaVulnerablePackagesName:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__359dbfe1765a1d1163551c92a2eeeca982c6dd28b88b234db8261977afa511b0)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaVulnerablePackagesName(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaVulnerablePackagesNameList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesNameList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3c63152409e0182ff739b9a1a2b2fc9f7eae079baf053ad28aedaacf5e0ddcef)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaVulnerablePackagesNameOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a03c4aa833b0245dbb3e622758334bed2cb65d52dbc1fb38f554faa43db127b4)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesNameOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f2b1e230328444cae78fe033f504c62f04561f8ed4fe08a1ab41ba12a87ad614)
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
            type_hints = typing.get_type_hints(_typecheckingstub__dba60e8ce0cda350b54906ca38bfde161808a156c6335465192932bc34b22557)
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
            type_hints = typing.get_type_hints(_typecheckingstub__04583e0e5e6ab099c25799b23e969a5b7f73fa6bda500b837c19a8b6c3181b26)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesName]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesName]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7ec91af85a9ecc6a1abb28274f21a81be2208d70c0a24694dda4cef2d147b910)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVulnerablePackagesNameOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesNameOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8b97e4993cb370ec177ecd8d4952ef2e4a384e3721c63b90959d17818633e751)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0cb07dda1af763a93ee80ac682843dcb6255358132b35726a86c8caffb82cf73)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ab5e80c9d109eb32a3d85e36d3566aa86ba626fbbed5965135a32d8eb647f11)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesName]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesName]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesName]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3862f9dd1b269642672ee7c7e61c65a16f0466d65d9d600e003322f4889ad448)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVulnerablePackagesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ed1b29c3556a73685993ad2dff73d1d9ef1d9f4746d55600697a5d9748d3003f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putArchitecture")
    def put_architecture(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fe828d13ed24354c1a3510e97085243f1331efe4f4a90d27bafeb0f910dd7792)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putArchitecture", [value]))

    @jsii.member(jsii_name="putEpoch")
    def put_epoch(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesEpoch, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca0aaf8e08a70625a15c2a6d53d268af059ac3d59b04df59512d23a0215a3b62)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEpoch", [value]))

    @jsii.member(jsii_name="putFilePath")
    def put_file_path(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesFilePath, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1763aeb8cd390eadd695e7b53cd4bd49d381840f78ada120709f35c34ed8c219)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFilePath", [value]))

    @jsii.member(jsii_name="putName")
    def put_name(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesName, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f34bc017e8e598e3992ef264ca0fdb64b8846c1f8bb1cf4c8c428cbcdf6fcf5c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putName", [value]))

    @jsii.member(jsii_name="putRelease")
    def put_release(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackagesRelease", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4048b2a63ffdecd91dc52b867169f220fda3e56835cca9f20b83a770d048408)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRelease", [value]))

    @jsii.member(jsii_name="putSourceLambdaLayerArn")
    def put_source_lambda_layer_arn(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f6b75e8bcfaf0a5db1be2b4d2dd42e08067ddf444fd6156c1b42a3a52ce9dd2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSourceLambdaLayerArn", [value]))

    @jsii.member(jsii_name="putSourceLayerHash")
    def put_source_layer_hash(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2631ff45032486593da634fd5ca0f76d98daac9790355a0a9cfdd244b352f82a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSourceLayerHash", [value]))

    @jsii.member(jsii_name="putVersion")
    def put_version(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Inspector2FilterFilterCriteriaVulnerablePackagesVersion", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__814e83ccadefc6534fd9de7b0c55a2e61a60ac95f5ecd19b18844568858997d6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putVersion", [value]))

    @jsii.member(jsii_name="resetArchitecture")
    def reset_architecture(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetArchitecture", []))

    @jsii.member(jsii_name="resetEpoch")
    def reset_epoch(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEpoch", []))

    @jsii.member(jsii_name="resetFilePath")
    def reset_file_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilePath", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetRelease")
    def reset_release(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRelease", []))

    @jsii.member(jsii_name="resetSourceLambdaLayerArn")
    def reset_source_lambda_layer_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourceLambdaLayerArn", []))

    @jsii.member(jsii_name="resetSourceLayerHash")
    def reset_source_layer_hash(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourceLayerHash", []))

    @jsii.member(jsii_name="resetVersion")
    def reset_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVersion", []))

    @builtins.property
    @jsii.member(jsii_name="architecture")
    def architecture(
        self,
    ) -> Inspector2FilterFilterCriteriaVulnerablePackagesArchitectureList:
        return typing.cast(Inspector2FilterFilterCriteriaVulnerablePackagesArchitectureList, jsii.get(self, "architecture"))

    @builtins.property
    @jsii.member(jsii_name="epoch")
    def epoch(self) -> Inspector2FilterFilterCriteriaVulnerablePackagesEpochList:
        return typing.cast(Inspector2FilterFilterCriteriaVulnerablePackagesEpochList, jsii.get(self, "epoch"))

    @builtins.property
    @jsii.member(jsii_name="filePath")
    def file_path(self) -> Inspector2FilterFilterCriteriaVulnerablePackagesFilePathList:
        return typing.cast(Inspector2FilterFilterCriteriaVulnerablePackagesFilePathList, jsii.get(self, "filePath"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> Inspector2FilterFilterCriteriaVulnerablePackagesNameList:
        return typing.cast(Inspector2FilterFilterCriteriaVulnerablePackagesNameList, jsii.get(self, "name"))

    @builtins.property
    @jsii.member(jsii_name="release")
    def release(self) -> "Inspector2FilterFilterCriteriaVulnerablePackagesReleaseList":
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesReleaseList", jsii.get(self, "release"))

    @builtins.property
    @jsii.member(jsii_name="sourceLambdaLayerArn")
    def source_lambda_layer_arn(
        self,
    ) -> "Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArnList":
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArnList", jsii.get(self, "sourceLambdaLayerArn"))

    @builtins.property
    @jsii.member(jsii_name="sourceLayerHash")
    def source_layer_hash(
        self,
    ) -> "Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHashList":
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHashList", jsii.get(self, "sourceLayerHash"))

    @builtins.property
    @jsii.member(jsii_name="version")
    def version(self) -> "Inspector2FilterFilterCriteriaVulnerablePackagesVersionList":
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesVersionList", jsii.get(self, "version"))

    @builtins.property
    @jsii.member(jsii_name="architectureInput")
    def architecture_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture]]], jsii.get(self, "architectureInput"))

    @builtins.property
    @jsii.member(jsii_name="epochInput")
    def epoch_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesEpoch]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesEpoch]]], jsii.get(self, "epochInput"))

    @builtins.property
    @jsii.member(jsii_name="filePathInput")
    def file_path_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesFilePath]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesFilePath]]], jsii.get(self, "filePathInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesName]]], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="releaseInput")
    def release_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesRelease"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesRelease"]]], jsii.get(self, "releaseInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceLambdaLayerArnInput")
    def source_lambda_layer_arn_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn"]]], jsii.get(self, "sourceLambdaLayerArnInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceLayerHashInput")
    def source_layer_hash_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash"]]], jsii.get(self, "sourceLayerHashInput"))

    @builtins.property
    @jsii.member(jsii_name="versionInput")
    def version_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesVersion"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Inspector2FilterFilterCriteriaVulnerablePackagesVersion"]]], jsii.get(self, "versionInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackages]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackages]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackages]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c99a706125a04e345ad491425d089c0fcb9fcb4c37f943d10981063eacda1a59)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesRelease",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaVulnerablePackagesRelease:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8968d7f2ef9a322a9c172277b1e352dae7cfc7c7be9e67685d82ad1cfcbaba57)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaVulnerablePackagesRelease(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaVulnerablePackagesReleaseList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesReleaseList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__79ba554a1aa7665f7229f8e28f5090e82dfdc9b14b91ac000714207929d7058d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaVulnerablePackagesReleaseOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dda47d9989d1c42624c2f8cf660dcc3136e1d55a50b6facf8066469e075e1a27)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesReleaseOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b41f88f73ebf3debe9b82b21397387821cd7622926de56d2844abb1a5b15e64f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__45747f4b984c95f13cd22851cc1a109115be4258c250352ed4b257c73c741aee)
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
            type_hints = typing.get_type_hints(_typecheckingstub__575823d928e2d83ada8550f96083f1c2c88699cd4db352763a3d66c0b7bb07c0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesRelease]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesRelease]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesRelease]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3213a56b045679c56bfdd0ace7b6ae88d1f7eabd61836d17fdb6a68d76b7413)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVulnerablePackagesReleaseOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesReleaseOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__613805e68678cc8a8978b04987da13093cd36f7b26f6f21b006af15e64ff8eaf)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cdcbfb7817af83584b1bb51f88d75751973241fd1ed1fe0d06ef18dad77255e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bec5580e2f3302b391ee38b62458b6ada580262b4e17f26a44230f62294b7f6a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesRelease]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesRelease]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesRelease]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4eca937df5c726ab59060b3ba6a6607b9f19e7d702d4dcd0e0769d289b26f974)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf21e29461d6eea816170f4dcd3b5177b4d43594ddd31483a72199da2074a1b9)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArnList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArnList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6ccd5d8e99cf636ec16073e910e1863c8ee1be5734d583b4c57d435067400642)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArnOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a630ff69f31cfa57d534cbf7eeeaf0a814b6948af3c4aa2ae7dee9b9acf4070d)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArnOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__25274ea91f5e94381d11808de789dfa70132bb245d24181a35bae1875f50cd6f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__17ccc2df971f03e07d13e3240026cc7b0a9864aab86a82dfc2835ba914841c7b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__96e38a1385552ab43da5806ee31e320084fb59a77388f7b8556f1558ea4e8e8c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__781702f6c9c818e518d17e3572cb3b59d7b2626f8092b5e7f24bafa5a4fa3d1c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArnOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArnOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c0c6bbe5c3661dfcb8846cf6e1f9dbe0927d8d3460d7542f7fbc3f933b9d6fb3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7be799d428960e53fb0d4374491d8c00937fbce566ff050bb39fb11866c6fd62)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86f895142579a84aa07492a6e383131fb8b80cb6d068fb7987e1b12cd55c7ef1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6f31f890acf1c43e03ad110824110da458292c90650cbeb445c998ac5244493)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4f752c304aad255aa6288c7e7c8dad0086afddf2feab53c9ef44b67ab17b06a7)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHashList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHashList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c21edf19ea41f2ec42159afc8c6361df4fdd8b8b4d64090b81b1338bc02782ff)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHashOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__244a1204b307c3612bdcc5b97ca6d381ddb42612419f6e8306740887c9831214)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHashOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ecb90a62cf45885ee833d7d04e52a61463c7794cc98be064bc7433118b7b6477)
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
            type_hints = typing.get_type_hints(_typecheckingstub__de796726ae5aaf023836a557aff7de22185b4bfadcbe540d700da925941f2b41)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4eca6591e06ec8437948077de98f39a62c3291a80f629bcdc3250ce54773dbb1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ad455f8948fe2739d126ab27aa4a87edf20bd58643cc8c00bbc041894602c253)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHashOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHashOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9ff66e57349685dcd895e5ecd36099587b4fd2505514a9d57778e5970abf5089)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b85fe8e4f1761d3588f79fd1fb3d514c0ea1197f72c88fdc02ea4ed6fc6faf5f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__95b7c61e2d87c56da8de7649c871562d67f9e8d207ce60ec3ded1d8e2127d420)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf24433f03c678564f1a5d17549e3f933b0a27ffd92766c58f8637933ab6761e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesVersion",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class Inspector2FilterFilterCriteriaVulnerablePackagesVersion:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c22748bd0decbdb3fb1d8905126555aac7e67545027636d3c1f2e56c0dd86f9d)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#comparison Inspector2Filter#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#value Inspector2Filter#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Inspector2FilterFilterCriteriaVulnerablePackagesVersion(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Inspector2FilterFilterCriteriaVulnerablePackagesVersionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesVersionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__75e9c02c755f4de32f068528d1f6928ab21446b35c1b1919026ed03bcfa6460b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Inspector2FilterFilterCriteriaVulnerablePackagesVersionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d6ef7654df29428301bf5dd447079b45414d12b203a962c407c3c74810da708)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Inspector2FilterFilterCriteriaVulnerablePackagesVersionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75bca9f6f1652bc84b9e7afdf1f054f2ae4fe49727a5bbe17755e0cc7b1cd2b7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__eae5d32253dd5f73c3a0b8f9bad7cda376f444ce34d57b6502f9f5fc54d3e9b8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__851935661bb0618710814524ee2f6a3177fa669e5815e0ce758549976a6f91ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesVersion]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesVersion]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesVersion]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__13163f14a4039de89c09b44f42c447e1b1c5457e53e0bfc517581b8db8dc4104)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Inspector2FilterFilterCriteriaVulnerablePackagesVersionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackagesVersionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1524bd4f105a7859a972715e4e9cc8d312d97114d358fb640e582c167c68b2ab)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="comparisonInput")
    def comparison_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "comparisonInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="comparison")
    def comparison(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "comparison"))

    @comparison.setter
    def comparison(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__11d397266506a2ec12a68b361ded36c76d39335e70c55a8a448ffae96853af6f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bc7464d38ae49bf15871189077710d5658b93554c93b78e29f2ccfad6ffd402c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesVersion]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesVersion]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesVersion]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2230f2c837e1cbfd072fb3d5427b112fcf5755fb7d74da83d73f094b19da3e8c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Inspector2Filter",
    "Inspector2FilterConfig",
    "Inspector2FilterFilterCriteria",
    "Inspector2FilterFilterCriteriaAwsAccountId",
    "Inspector2FilterFilterCriteriaAwsAccountIdList",
    "Inspector2FilterFilterCriteriaAwsAccountIdOutputReference",
    "Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName",
    "Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorNameList",
    "Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorNameOutputReference",
    "Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags",
    "Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTagsList",
    "Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTagsOutputReference",
    "Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath",
    "Inspector2FilterFilterCriteriaCodeVulnerabilityFilePathList",
    "Inspector2FilterFilterCriteriaCodeVulnerabilityFilePathOutputReference",
    "Inspector2FilterFilterCriteriaComponentId",
    "Inspector2FilterFilterCriteriaComponentIdList",
    "Inspector2FilterFilterCriteriaComponentIdOutputReference",
    "Inspector2FilterFilterCriteriaComponentType",
    "Inspector2FilterFilterCriteriaComponentTypeList",
    "Inspector2FilterFilterCriteriaComponentTypeOutputReference",
    "Inspector2FilterFilterCriteriaEc2InstanceImageId",
    "Inspector2FilterFilterCriteriaEc2InstanceImageIdList",
    "Inspector2FilterFilterCriteriaEc2InstanceImageIdOutputReference",
    "Inspector2FilterFilterCriteriaEc2InstanceSubnetId",
    "Inspector2FilterFilterCriteriaEc2InstanceSubnetIdList",
    "Inspector2FilterFilterCriteriaEc2InstanceSubnetIdOutputReference",
    "Inspector2FilterFilterCriteriaEc2InstanceVpcId",
    "Inspector2FilterFilterCriteriaEc2InstanceVpcIdList",
    "Inspector2FilterFilterCriteriaEc2InstanceVpcIdOutputReference",
    "Inspector2FilterFilterCriteriaEcrImageArchitecture",
    "Inspector2FilterFilterCriteriaEcrImageArchitectureList",
    "Inspector2FilterFilterCriteriaEcrImageArchitectureOutputReference",
    "Inspector2FilterFilterCriteriaEcrImageHash",
    "Inspector2FilterFilterCriteriaEcrImageHashList",
    "Inspector2FilterFilterCriteriaEcrImageHashOutputReference",
    "Inspector2FilterFilterCriteriaEcrImagePushedAt",
    "Inspector2FilterFilterCriteriaEcrImagePushedAtList",
    "Inspector2FilterFilterCriteriaEcrImagePushedAtOutputReference",
    "Inspector2FilterFilterCriteriaEcrImageRegistry",
    "Inspector2FilterFilterCriteriaEcrImageRegistryList",
    "Inspector2FilterFilterCriteriaEcrImageRegistryOutputReference",
    "Inspector2FilterFilterCriteriaEcrImageRepositoryName",
    "Inspector2FilterFilterCriteriaEcrImageRepositoryNameList",
    "Inspector2FilterFilterCriteriaEcrImageRepositoryNameOutputReference",
    "Inspector2FilterFilterCriteriaEcrImageTags",
    "Inspector2FilterFilterCriteriaEcrImageTagsList",
    "Inspector2FilterFilterCriteriaEcrImageTagsOutputReference",
    "Inspector2FilterFilterCriteriaEpssScore",
    "Inspector2FilterFilterCriteriaEpssScoreList",
    "Inspector2FilterFilterCriteriaEpssScoreOutputReference",
    "Inspector2FilterFilterCriteriaExploitAvailable",
    "Inspector2FilterFilterCriteriaExploitAvailableList",
    "Inspector2FilterFilterCriteriaExploitAvailableOutputReference",
    "Inspector2FilterFilterCriteriaFindingArn",
    "Inspector2FilterFilterCriteriaFindingArnList",
    "Inspector2FilterFilterCriteriaFindingArnOutputReference",
    "Inspector2FilterFilterCriteriaFindingStatus",
    "Inspector2FilterFilterCriteriaFindingStatusList",
    "Inspector2FilterFilterCriteriaFindingStatusOutputReference",
    "Inspector2FilterFilterCriteriaFindingType",
    "Inspector2FilterFilterCriteriaFindingTypeList",
    "Inspector2FilterFilterCriteriaFindingTypeOutputReference",
    "Inspector2FilterFilterCriteriaFirstObservedAt",
    "Inspector2FilterFilterCriteriaFirstObservedAtList",
    "Inspector2FilterFilterCriteriaFirstObservedAtOutputReference",
    "Inspector2FilterFilterCriteriaFixAvailable",
    "Inspector2FilterFilterCriteriaFixAvailableList",
    "Inspector2FilterFilterCriteriaFixAvailableOutputReference",
    "Inspector2FilterFilterCriteriaInspectorScore",
    "Inspector2FilterFilterCriteriaInspectorScoreList",
    "Inspector2FilterFilterCriteriaInspectorScoreOutputReference",
    "Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn",
    "Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArnList",
    "Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArnOutputReference",
    "Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt",
    "Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAtList",
    "Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAtOutputReference",
    "Inspector2FilterFilterCriteriaLambdaFunctionLayers",
    "Inspector2FilterFilterCriteriaLambdaFunctionLayersList",
    "Inspector2FilterFilterCriteriaLambdaFunctionLayersOutputReference",
    "Inspector2FilterFilterCriteriaLambdaFunctionName",
    "Inspector2FilterFilterCriteriaLambdaFunctionNameList",
    "Inspector2FilterFilterCriteriaLambdaFunctionNameOutputReference",
    "Inspector2FilterFilterCriteriaLambdaFunctionRuntime",
    "Inspector2FilterFilterCriteriaLambdaFunctionRuntimeList",
    "Inspector2FilterFilterCriteriaLambdaFunctionRuntimeOutputReference",
    "Inspector2FilterFilterCriteriaLastObservedAt",
    "Inspector2FilterFilterCriteriaLastObservedAtList",
    "Inspector2FilterFilterCriteriaLastObservedAtOutputReference",
    "Inspector2FilterFilterCriteriaList",
    "Inspector2FilterFilterCriteriaNetworkProtocol",
    "Inspector2FilterFilterCriteriaNetworkProtocolList",
    "Inspector2FilterFilterCriteriaNetworkProtocolOutputReference",
    "Inspector2FilterFilterCriteriaOutputReference",
    "Inspector2FilterFilterCriteriaPortRange",
    "Inspector2FilterFilterCriteriaPortRangeList",
    "Inspector2FilterFilterCriteriaPortRangeOutputReference",
    "Inspector2FilterFilterCriteriaRelatedVulnerabilities",
    "Inspector2FilterFilterCriteriaRelatedVulnerabilitiesList",
    "Inspector2FilterFilterCriteriaRelatedVulnerabilitiesOutputReference",
    "Inspector2FilterFilterCriteriaResourceId",
    "Inspector2FilterFilterCriteriaResourceIdList",
    "Inspector2FilterFilterCriteriaResourceIdOutputReference",
    "Inspector2FilterFilterCriteriaResourceTags",
    "Inspector2FilterFilterCriteriaResourceTagsList",
    "Inspector2FilterFilterCriteriaResourceTagsOutputReference",
    "Inspector2FilterFilterCriteriaResourceType",
    "Inspector2FilterFilterCriteriaResourceTypeList",
    "Inspector2FilterFilterCriteriaResourceTypeOutputReference",
    "Inspector2FilterFilterCriteriaSeverity",
    "Inspector2FilterFilterCriteriaSeverityList",
    "Inspector2FilterFilterCriteriaSeverityOutputReference",
    "Inspector2FilterFilterCriteriaTitle",
    "Inspector2FilterFilterCriteriaTitleList",
    "Inspector2FilterFilterCriteriaTitleOutputReference",
    "Inspector2FilterFilterCriteriaUpdatedAt",
    "Inspector2FilterFilterCriteriaUpdatedAtList",
    "Inspector2FilterFilterCriteriaUpdatedAtOutputReference",
    "Inspector2FilterFilterCriteriaVendorSeverity",
    "Inspector2FilterFilterCriteriaVendorSeverityList",
    "Inspector2FilterFilterCriteriaVendorSeverityOutputReference",
    "Inspector2FilterFilterCriteriaVulnerabilityId",
    "Inspector2FilterFilterCriteriaVulnerabilityIdList",
    "Inspector2FilterFilterCriteriaVulnerabilityIdOutputReference",
    "Inspector2FilterFilterCriteriaVulnerabilitySource",
    "Inspector2FilterFilterCriteriaVulnerabilitySourceList",
    "Inspector2FilterFilterCriteriaVulnerabilitySourceOutputReference",
    "Inspector2FilterFilterCriteriaVulnerablePackages",
    "Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture",
    "Inspector2FilterFilterCriteriaVulnerablePackagesArchitectureList",
    "Inspector2FilterFilterCriteriaVulnerablePackagesArchitectureOutputReference",
    "Inspector2FilterFilterCriteriaVulnerablePackagesEpoch",
    "Inspector2FilterFilterCriteriaVulnerablePackagesEpochList",
    "Inspector2FilterFilterCriteriaVulnerablePackagesEpochOutputReference",
    "Inspector2FilterFilterCriteriaVulnerablePackagesFilePath",
    "Inspector2FilterFilterCriteriaVulnerablePackagesFilePathList",
    "Inspector2FilterFilterCriteriaVulnerablePackagesFilePathOutputReference",
    "Inspector2FilterFilterCriteriaVulnerablePackagesList",
    "Inspector2FilterFilterCriteriaVulnerablePackagesName",
    "Inspector2FilterFilterCriteriaVulnerablePackagesNameList",
    "Inspector2FilterFilterCriteriaVulnerablePackagesNameOutputReference",
    "Inspector2FilterFilterCriteriaVulnerablePackagesOutputReference",
    "Inspector2FilterFilterCriteriaVulnerablePackagesRelease",
    "Inspector2FilterFilterCriteriaVulnerablePackagesReleaseList",
    "Inspector2FilterFilterCriteriaVulnerablePackagesReleaseOutputReference",
    "Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn",
    "Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArnList",
    "Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArnOutputReference",
    "Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash",
    "Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHashList",
    "Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHashOutputReference",
    "Inspector2FilterFilterCriteriaVulnerablePackagesVersion",
    "Inspector2FilterFilterCriteriaVulnerablePackagesVersionList",
    "Inspector2FilterFilterCriteriaVulnerablePackagesVersionOutputReference",
]

publication.publish()

def _typecheckingstub__1fc564ea8ee1f284d6e1d7c16580579304c5cddababf34c509d722ad331e8327(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    action: builtins.str,
    name: builtins.str,
    description: typing.Optional[builtins.str] = None,
    filter_criteria: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteria, typing.Dict[builtins.str, typing.Any]]]]] = None,
    reason: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__8fe800afa6b1c97174d8be94e3e5e016bca0c6dbeceea2e52b9cc18c14968e89(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46072afcf128356f8ec9ee69e65906eed5c770bc65932df1ed393af76562b4ea(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteria, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__63e0e121782cd57e6e5da930e43a28dd89950b73b39a795faa2f9adcffe51513(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__403aa792ab9d1dd6740fdd29eb0bf3d4e697087f3f9bdc7f26ac509b56306783(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9cd816e20bcfc349f2364eab53e43a7bbbd85e5ac72ca168ea6c7251599819fc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__016a94a78206b33be8ae55472205594a98a575d1b6ce713d3dbd6cc82c7666fc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cfac81f02012d41d679335e7ee83132345ea95efb26a5f20eb3f4b63f343535e(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53fe43733e4051bf1a30119e48cdf1cecbb1b726b1c264c8776282abd77da7e1(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    action: builtins.str,
    name: builtins.str,
    description: typing.Optional[builtins.str] = None,
    filter_criteria: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteria, typing.Dict[builtins.str, typing.Any]]]]] = None,
    reason: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5bb10971ae2e842ad7f9127978f4c9db2ad4faae1a974dd44b21cbd8c2bc70c(
    *,
    aws_account_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaAwsAccountId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    code_vulnerability_detector_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName, typing.Dict[builtins.str, typing.Any]]]]] = None,
    code_vulnerability_detector_tags: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags, typing.Dict[builtins.str, typing.Any]]]]] = None,
    code_vulnerability_file_path: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath, typing.Dict[builtins.str, typing.Any]]]]] = None,
    component_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaComponentId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    component_type: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaComponentType, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ec2_instance_image_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEc2InstanceImageId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ec2_instance_subnet_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEc2InstanceSubnetId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ec2_instance_vpc_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEc2InstanceVpcId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ecr_image_architecture: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageArchitecture, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ecr_image_hash: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageHash, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ecr_image_pushed_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImagePushedAt, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ecr_image_registry: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageRegistry, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ecr_image_repository_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageRepositoryName, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ecr_image_tags: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageTags, typing.Dict[builtins.str, typing.Any]]]]] = None,
    epss_score: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEpssScore, typing.Dict[builtins.str, typing.Any]]]]] = None,
    exploit_available: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaExploitAvailable, typing.Dict[builtins.str, typing.Any]]]]] = None,
    finding_arn: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFindingArn, typing.Dict[builtins.str, typing.Any]]]]] = None,
    finding_status: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFindingStatus, typing.Dict[builtins.str, typing.Any]]]]] = None,
    finding_type: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFindingType, typing.Dict[builtins.str, typing.Any]]]]] = None,
    first_observed_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFirstObservedAt, typing.Dict[builtins.str, typing.Any]]]]] = None,
    fix_available: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFixAvailable, typing.Dict[builtins.str, typing.Any]]]]] = None,
    inspector_score: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaInspectorScore, typing.Dict[builtins.str, typing.Any]]]]] = None,
    lambda_function_execution_role_arn: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn, typing.Dict[builtins.str, typing.Any]]]]] = None,
    lambda_function_last_modified_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt, typing.Dict[builtins.str, typing.Any]]]]] = None,
    lambda_function_layers: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionLayers, typing.Dict[builtins.str, typing.Any]]]]] = None,
    lambda_function_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionName, typing.Dict[builtins.str, typing.Any]]]]] = None,
    lambda_function_runtime: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionRuntime, typing.Dict[builtins.str, typing.Any]]]]] = None,
    last_observed_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLastObservedAt, typing.Dict[builtins.str, typing.Any]]]]] = None,
    network_protocol: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaNetworkProtocol, typing.Dict[builtins.str, typing.Any]]]]] = None,
    port_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaPortRange, typing.Dict[builtins.str, typing.Any]]]]] = None,
    related_vulnerabilities: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaRelatedVulnerabilities, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaResourceId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_tags: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaResourceTags, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_type: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaResourceType, typing.Dict[builtins.str, typing.Any]]]]] = None,
    severity: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaSeverity, typing.Dict[builtins.str, typing.Any]]]]] = None,
    title: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaTitle, typing.Dict[builtins.str, typing.Any]]]]] = None,
    updated_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaUpdatedAt, typing.Dict[builtins.str, typing.Any]]]]] = None,
    vendor_severity: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVendorSeverity, typing.Dict[builtins.str, typing.Any]]]]] = None,
    vulnerability_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerabilityId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    vulnerability_source: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerabilitySource, typing.Dict[builtins.str, typing.Any]]]]] = None,
    vulnerable_packages: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackages, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d60fed4d5ca28b42a656e2faabd9da1de9aa10bc8639cf11a903f37307a159ba(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98d7444837aa75c2e68ef1923ee737d00ea8efc36c644656a0310e47cdf11c87(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94d3c7aa9e73a3b79471922407e8ecdc50772c7e0f31f5f5edb8eb3332209998(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c42376e55879963e5c5208fa1469ed1454b004f4467244f673b5c130baa29488(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4f906d2299d8fb8e02756c4f78dec80daed4b0a2c16bacd1effa9a658d62131(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8919f83dcef76ea8b61318fbd87ecc48ba249e493af02c25567dfd751cf59e3(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc0d5ce7a59365a7d97b253f58e3d0a126e6eaa2e1611a630ff1975c3dadfdfd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaAwsAccountId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6bc1cf4fb156b330cf19529224e425eae70be3818c16e6c5e4443b3538ab2b1e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b29a39672080f62296f7486baa70d62c232a06c439c609185301af96053b031a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df1325ef5118dab722cc87f5e427dc68f13ac3c4d2cf40b41ef3961d6a564f63(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8fbc414cddb751f22c33140b7de3734ce06371903ab7c02def892f9cd263032b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaAwsAccountId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__414d8597c134a8d75ba1d551739d85f8f46ce83c3c2960990ff3ede1e2b10951(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d982b9a0efc25dae0d24269ec4d54bc7adeea3d0607644f287ffb817b54fbeb9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c58ec96a6b1af960275fc21e34cee53b7d5b9bed9aa884d38e66ef527d72d8e0(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8c6f57c8ae354f2b2d6217b253f75c61f8db6cbf63eccca91f7407497bdbc48(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8cbd75ae5b8c314b99afe380047245cba0fef93adeb4978499e3d5ff1204b59a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2e7fc7f0c7170811fdd63324610fc6be95a1300b2eeb3c85a1b9b715b0947df6(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__322daefd448f833078340031eee8fae9dd0ad53e45ce60cac6d9b0abad6923ab(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__578075c3cf3fb8d56e3ad3a8cb0ad0e74b392328380da8e525a04421e6956289(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ef02389015a2ac31518a74dabb8e8fd4df6b17b19aca462ef3ddb167b606a7d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__121b55c8e98a6d6f883473bb5c63b559d7be0e772832ff04093d01a9c7e35d55(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1053222dc29650e56a8d4d217e567c4ebf9920e6d9f92c85c6ed58ccbe9e3e6a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4887b481f52aaa8ac159bb3538c24aeae62a39fb6b124b437058e04c90bcb78(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__adbcdd1518bdf51bb831fb4e9fe8a5edf347da7e402755bc4dd008ad93c2e86d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9851c78016bb492f21937482f45bd54fb474d182a5e99e661911ce33988834b(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2fdf0cd30b355fabc5b831297b98a2d255927f0c3da8275a140826ea9dff9b06(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4af6fdfa36d23b46ba4017b296765ad248f5db2e06848918e61bd360bc287aa5(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f87b31c43da52cf773e408a5662ce297ca0f912acb3c0a3c587ecc4c147d166c(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5fdf70b4d68c81812ef076074bdd5a300c0e6e1c0af0830963a440358316622(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__948132f5ff1c428511609b2f752e20e68e2ccdddea1352728c90019f9ed4c2e3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ac1cd4ea3b323b4202c5e4771f8b997f7e33932b24c3cf2b6711e3888ba428a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ca7955001bea743089aaadde0178846397bfe0e7b01ebf79f11f1d5a2568665(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b658aa942dcec5f61b4f561da732e4f246bb668f664e8790914d86c8b7e9a1a2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b4925f42b0ffeb0e257a7e23cc0511f98a947d8f13b162078d71ae381cb4233(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60996d3d8b58d78ad8c62b2199cf653487d6ae59bd4ed5c2adb854fefba24d7a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2b5ae56f1e1e8ecce79e31132fdcf60d3d4975a2ba918c4ad42959d00f1e0ac(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f70b3eb1803b3e32f9bcba894e08e38a7becc24b2873974217d2d4726b8733f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c33de7ff3219b2478a91b863ddc56275efd82fdeca6a4ef5b8ecaca2fb9c30a6(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3bb24d25486e0a873c3751078a6c6f1700d35c95cb8d2b7dcc63d146efe178e5(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06e292204c9845082ddd17a8ec95cd1891b5ce0972fbbc81e522c9398cf1a8ec(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ba5df6bfec8f713456cba398a86f117bfd22fb422ea8e76af8930dd670dfd14(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d2b11133fe727caca9dca360412de96f46cff7fcb757ce75955fe6d8e8a0e01(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9fd7d7925f7a4ede2c222247c183432908912e45cf91f2123aeb960fe2c53bbf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6bc9a758e22f677524a8c3e045642f40154798a353cc417f6717ec304815fd7b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__249e0d08e0a230bb1622ad112a7a3de7ee29347c23c2925419a136f8b3429de2(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df1beca0269608dfe0db52b41e169c647e540576b2a59b9ad4b85d53073b2e04(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d37a0774034ebb7e103fa21d8ebcea9145ec22752791f68719c904ecee2d849c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9602c795a2f09ce73a57452d5e20bf1cdf664b7ef82ca48b2c5bbe4e9e14614(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__03e23cfbdb90e929d5660a1dae961221bfdca7b1586cf26caa96ad10279ed35c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1286610d1b7059cf89b17ed11da058be5408002610b623db1cfbef7030e238dd(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b1750773ce55fc63961b1ba25c1b5171cf6a5ecff02a87b8d3a50a5dbfe6ecd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaComponentId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__125240cdc6b571ecdfc90095ba57dfb4c3bce578b9e9e87f9ef0cef0cd5ad7b9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7945a643bc1530227ca72afc7c054c7f92ede708068314191f2d06447c32ed8e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1e4a1b991c9d4c1d19832bd677581cff501b450906ca1769c2344c5a3ffb020(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84bac09c9938e7668bd13f76bf54fe704af264093a82f399205a653f68ddf808(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaComponentId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7fb9803805aa304571d20caa57f1aa2ae40691a6f509451a024bbb7e4d9683f1(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c61ef8bdee137da1557519092b6a0de0c25e755bfdd500276830c51427e0cb1a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e204848617dc938ff0ce7af736e9f807ac23b9969f8544d76163928baff7134(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ccc6edffc5eafa93591e179cc67c7bb564894a6af3d184af02a005368b83f44(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__51553a6d16164ba57d5c313e6486e020b412ebdf6ea65bb08e10d9f734fe0962(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b0cbc97e984f4ad11be2dc5c259082af0832e68234ff8d64fb5367b371d8e12(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1ec762a71501d41ae9996f18b394cfcd8018e2bc06769a48ba97469ed8e11e1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaComponentType]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5e05615477b8c780c876d331a14cc5667064a88aadf57b75ac421c8868911d3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a203426a501698f8145f7737412eae12ed912f64e20953c2bea382d494439f84(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb8005af9ec6953d6a983583ea9be3bbcc8a633f6807202f86d2819d66ad2577(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f594518fc64dea30431030512989eb3342dc2d8849f4fe2a8b6c59a1469f074(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaComponentType]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a918498e144754995693c2d9be970ca24ecb7997d798e8dde751a3219f7d116(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e8b7d4cce253ce3b3a6804aaed4d95e21120b219d663b6a899f93efd4a5365f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7ff78c23144919db6083a21ac9b622cd0c730e0eac67bbb05acd266afbba4e5(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__80a2f5a7b238a061f3a5797fa368ae276dde3fbed564fcb04b4e1b7305927b8b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31c24e707774f5066513de9da58c6dc686cab34fc5c1bbb94c11e4ccb87d26b7(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5296d9e5eb8d511ded7a1f2af1df14269260550cbaa37292be7ac1de56fc2a00(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ceacd8009c21bd6671967e5e5ccb2e64859938f220e2b65d986f67b882379bf(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceImageId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb3c7cfd487f96b4014876f2a5b7b2662d6c1082f41fb4882874f50cf68439fb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7513493961506b7233d4b5be70c8c8b3f953a065ce5a533940c0f1b47b7f9f03(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3805f85afc724ab01c58943d76e65c7387b1dd6d6bfae4032a699e7bfe5a459(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__678183cc586a260a002737fc5e4bf3f43e778f64fd39c0b8e32268f561731698(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEc2InstanceImageId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8cb0bdd7b3339b51d6031d1de29118817c02eda1bb9b3a9e96a4eb5fc40c9d0(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35259b52623dc892b4158d350badeb1c24422ebd05582a42b99f16af1f6daa24(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6cf670f10b4d44088696d85863422cc4047860f13ef4bc1e32d1397e4119281(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__883bb392e4ef7be65502a89463849d2473c6a1445ab319a85a11190080d161aa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__648d1709f2412465e6865f06b313fa63053d44ed7fdb5661eba569487a066d85(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ad4d8f24f11ce2db1c0cdbd0a73875618923611982ce19d40376e1593ec4d1d0(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0af997cd8233683eadb0a42165e4026a5aa60cd7bef1390b6a081fbbd69addca(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceSubnetId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27f9457215ca56f3b00e4f42e378a27bf223e54e73455eac8bdd38296db2fbc2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ddd6dd957dc88d4bc50d6ece0dfd82da86c8c91e7eca6c617a67e1d5dc3cf977(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7ed5dd4328fa9e54627d32ea5ebc72253f4e92c2b261a6a95453ff13e39dbe9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6e421554da86e4b83ba38c61107ef184b9a565349ad143b355125cb35e6d563(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEc2InstanceSubnetId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8dcd709223117a2d210e7b9069e785de5d49e3db7420142c980efbbdbee161a8(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d5d631dfc7734f07106e94239a13ecc879c687ef127598425b5b47ae7d4f7ea(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53dc58f8611967ef767be4bb83459da258958b54303baf52e7d0f250fb336350(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b166ebf0e6fcaa333bfcbb3ae44a7b3129a4285038f5c204a1f79c9149000087(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00154592835f0d6412619f8b0b1baf08634fe3f1563ed6e112355dc7b653c870(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2dbda1e9fb01156bc208beb1114594eca426cb95335410edc8c2107b15b948a9(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0889c0c08425ca5f6bd1417827502b90e89c411db1eb3ac003900301ee760ce(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEc2InstanceVpcId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1fe25eac4b48f4ae728e8e5c2f57bc8c550143c78a2cbc5bdb40c0de1199e259(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc36d8a49bbab07247f1accbd826150aa959efcd8c718460b90cb26a10ebc315(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b3747ae10ba76b9b901e594ff281bdd1477ee8435a6691a7ef18f2ac2243491(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a0f506fb561708a6923dffc3c45122cdef3e9b17b9d310f572c912fb83322bb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEc2InstanceVpcId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd63cbaffdd181a5dc3d1758c4ec805bdcfa6e53f29503c9b14c7e181daecebc(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ac195bf2e3e8eb8d962a479749f2c933a977789f242cc19f6a20cd098c19fde(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__66a4c1873015987104c70b2725e61114a4ed32c8e7b9cb4921477452426d8b1c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__189898ccebb6a9e0e7716160f88fa944f40f5893c846e7bfebcc84011e87cbf9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__841be727df7d161bbeefce278788183c128657b9d0e04a38178cca7e4288dc68(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f3f2d6d3e8457854baa59f196028614d034f1487da537129ab6bd6f971f2766(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b882f117f89622d79d0300f051f05b556ba4666ec271c5d0b4f4ccb379e167a8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageArchitecture]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2ec2cc3f5f9dcb7e921daabc5b3b981900aed7ecd8cdc4458a7f6c76fd6cc23(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86c6da9c1af4a6883c849b541733e4c957f7a641706d869de1f86539824fb49f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__725f65a2624e9924bac4c79878945a34c9130831530358844408a983c39f7a9b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__300f9bb5232334441aacdbf9c4650a33f72e8ea1b5b9f790efebe78f09ea425c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageArchitecture]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b2d1b4ebe9412ea888986b504d24fd7c556feb077c7b035a10e714bd47f7d82(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ac28c970c9c3ed00c5c72f824b04f0461df4814037066b76e938a518b17d74d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f34a3643617a99607e0dfb56fcdeee0451573dcbf4f3373da030791a3df56c37(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f0f4ace2cf5dbd4e407a345702dcd34d0242279238f7488b79b112a4b2ae64e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f29b1ff04d4a065a0a7d3d7bbdaa52c99b8f13fdd6c6043ed14b75337c71756(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__868138d9b1b1cd02dbd6a7d1e8358e3288abd8badf5bf9984789849a1b3a4a1a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e50d0c5c6f8aaaf70eb44947eafc0c97c32e7d93a8defc714293f7343ec662f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageHash]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__575aa5e4af142938c9fa18c9e61d069632e6b771a57949a7c0c7faf4cd63750c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8161da112e8d01ff6db1463237b9d60ad3f07b751a5989e94deae238297edfc8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7a1a807241a4ddbac0e356e957f57b56c7e962cef32a67a2cb4c8643b6539579(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__050c1d9bda2fd15c56525b0a8a2fad44ecb9e15c5fed6de328f792c1542159c8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageHash]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__538af1d3fceb72538f2959f0d29cc84f67e6a8a29b56b55323cc2dd894643e12(
    *,
    end_inclusive: typing.Optional[builtins.str] = None,
    start_inclusive: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22d946b9a35d5e4328cc1c7425001b8e9e47fc9b73419f12c1cbc9a3d6c7319a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__482deb4bb90a4084951ab69ad921754b987b961a14d1d42a1ec514fb0241a562(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88ab9e7ca81f350baf1f22079ab64ce7553d250ec42fd464255a0ddf1963a52d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1393c9105cf1bb7aa131fe3fe4ac43732cb0cd260e15e69696f781ca361695ba(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a89650a258a0772144de6a44109d81e135d6294e438e161e1f437e620fab342(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0bf049a187ccbca767a3f9523dd052d4facb085a1b01aad1780ecaa01aa9f152(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImagePushedAt]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb9a5433d15feab2a913ed9b2f055ce221c6d800e98e5408703dc11f191e7354(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e05ac810c569f3b48b36dec3baf9afd21e5d2dc0179646b87cfe69980e52d20a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a280b531a41308f27f79a69292be1bed6aa36a0928e8ab81b4a20a2e91d2bbf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8be6dd8305999ba2cc253d040b37215cad0a4fb8aa80f8f5b8655ccea241b508(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImagePushedAt]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e9d66f3afc196bcef7ee573b3a629e93f843d4b1ece8e25112e7861e660f2ccc(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d6a2230873db7111d1720ee2e02815aa116fbf07fe8eb77ab0b1948c7f799b5a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2dfb19cf339657b3475ac5cc744a998f659f20e7c5d025fec23e8d5222b9e953(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__991db8428c6b4019ad5744cb8c3baf1c36811fd4caca9c6f36c8b46307cee965(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a8d65b4404b7f6a475877a689d6025e966020d4b73b849fdbcb9e058f6514cc(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4bf8c0e7f363ae442da1e58fb3c0968a6b2a571e6e0b5d6a28534e1370c99e5e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9372d14b4b964a6bc659608d7d9fab9c14b650ae9cd93341e5103bbc45476007(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageRegistry]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53c3a9f0aa1af39d419b013e5c20b2702ad1e8cf15f2f5c260a8f782c6d58137(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c3c490a8f87bcc7e49403233b0b03e37fbbb036003079e4017ca29dbabf31ad(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f6c86e33d3b827c255f096f56b3a11169cd2c84d8fe721252c9652605106e42(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__de46330872a489827dfdeaf14acfe71ebe9996ac979e3814d9372b5b30d23b8b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageRegistry]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc6800478d9a2a3ef88d26a473cd3dd910be9223fcedcaf35f54878008919191(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dbf4392b8c36d3af6c10f10d12d43e9bb27e0702fee03f38c4984e74fa4ad7f9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f094c9b38c8c293c4e3775421a8890d0b0a4bbcb40d2a81c094fba5e878389d8(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06ad2d2f9bcf18adf5daa077d4a661510eef50984127cb46e11a957284d1708b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__307059369a5ac56730805144ac0bcbb5ca4950fc6f7e57bb5f566056388f4bc8(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d66629658115cd926f84db39e0140cb91a83387f6916619a6b1a3b6f39f5c91(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8479dd8bf0046ce9c35fa5fb3a4214a8f534bfcea97c066aff3b44192c14490(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageRepositoryName]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68486caa165e43fb76e03e4f436984b8a5b04acbc84591fef76db1e55b37f48d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b5c76affd00f567cbc0ae54aee4c28fe3a1c00ed6cc4225284cdfd175899030(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ddcee19b5cbb264b91f58e9474af99bf5405c42b8294b626fb8985c9302cc7b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0050874d815fb9ddbdc0de28c9c0030dadf1adc4401742ce3438fddb97c1dc15(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageRepositoryName]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e993d8200cd8bfdd9533e3957601b189dbce793b9f517280f3b937c6a9efc04(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6ff086ce7972907e004680a146d0effaffe61d105ccde6a3b3cf15397fe5b9b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27e290b55021fa67455280c28c423a1425f8e2cff8263db4c65578bf2e4a01b5(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4fd1612387bd214adc62884b258eb6ad76ba03048c212207a2aee1deda430a46(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ad39213876a44b41e60dc154a6e7635f2e6969b008f31c86571d6bd2c55876c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09494ab9cff9e254864464bd3bbc0547d00d50f2a5bdfdebb54769015179377a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90a033a10b1326e88fb240553cc91e3587b833bd23b92ec28d75ddcdf52bdc5e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEcrImageTags]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__505e0b744ea1e3a40d704f55be3782ef3cbf33a4a6a2c86778710eee67a79094(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e191a31da7142b05cbf5575da5ae0515b7d7e82370d2a5b822407d4d498ea09(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc05593340ca538f93646226d464ad0a96a66294139d5889119681f8c7362ad2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd84348c4804cce6274c455a77017be75de3220a3d4b2bc455f6182a77ff7287(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEcrImageTags]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b04fa9a2076df169d1ff141ad08765ad4e3aaa247945f2bd9ea9ccb6b8787b0(
    *,
    lower_inclusive: jsii.Number,
    upper_inclusive: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__657811eb94624d66bf983de08f97bcb5f6426a210e4080954dfd8f1a2989668b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd45ff4282f21f444ce4b7c89fb54c4d9c887eb3c3ca400cec62768ca49c158d(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85be4892f62a8ae82de566334dca365f6a06926cbbc61e08cfdd304e9341750e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f7545e81ca0cd968b5b3618a20e72047b31d5ada87d68c9d87a5845594232ba(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cbb98e2de6e7291570c160e51c3ced5dd78bbb7a5dd5caa3557b6f8d44fa7ae9(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b111043d57e66270337b15ee2ff31bad438752bb19c89b114fc6a4e1686ddb1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaEpssScore]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2130b0aa120f4e3f2f2360a2790ca778f812d21122101862295af28105fd524(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2014c5e389c3372f64f462e1f6104c4898a674df76175e3bdba22cb8bd4db6c5(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44032e0db1384ff48e92986e5bdfd099ffabf284c66cfdd30c77f5db9aa2a37f(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05536ce97d914471ec9d677f2dce537edd6beb0d18a05fcdde3216f159f98268(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaEpssScore]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__480cd77050bb575f2aacc2d9d5f2230360d5b47b53784470dabe58df458e1c5c(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4906e71fdd987bb4a81d376ced0622621b09766544b4ec32597208ef804ecde8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c446dffdeb834a99a3f2d4624c08bb8a56b41b5c5858d344dca95a0d52487d9a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b7e9171e1e858ce446acb1149175dd77c65a341de907e897926b395b1b748c3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d6d052c3cdb5474cbd9440a70312e22fac15c78bd077be244453a848f578e085(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__598bdcecca7d1dcfad989230e43b41d5f418f2d556db8989698e5fa1aeda9a68(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff7e8ec9a06666a476ba1b4e601296768c3799b08c663ce9afde5fa449dd5155(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaExploitAvailable]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b697884dd993ebaf93376e37197d1368a56638fbc316be9bcdca0e7f0679b2e1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67449d90dbfafb4e825e9930d62ec6b83418efda6ec5ff28d8fe2a7316374579(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6983efaa0ce04a45bd1330fa2a36fa7bc9820c4af7f263131a05fa0742fda6f4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee3da7950bf324c6e614abc25ce8bdad698e581330994599a1fc679ef41aeec4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaExploitAvailable]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12fa185877e69fe9921775a032f6acac842e547dd9d6b03f876da0cf13f79a02(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e85dd4ef731c0540ed4e58ca56df9b6411ef08c13ce185f99efd0ebfef98aff9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99cdf04927c5a929aa06a992f915148d48f460451ad7781ebd0717a3eb5e0379(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a2e7b49a56151cdc0329face710b939cb0e046fe8808c19606f99f82487732d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__685ec294670b789b0f6da47ac5339ff455a9556e48eac149a6349f70db485619(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56ab8c2781a208d83ab63f91c2669a933ca39fb4c2c3b93b352ff61732df53a7(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24d157cc0facd09cc271df010d04e5100edf03e30950d2b0989dbd1c9a841c82(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingArn]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bbe3767cfae82f706d1c6db3e8bdea5413fe9063b1cd15364243933162eb0bf4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__57adb9187b775dd348868c88100555beb8d2a19e5e89915a82396dfe6884f1e6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7fa0792526e1ab4a6268db75996fe86c8201d8779962e231ff39d26899bace4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77163902d58d5f560cc8c063e606b6d36c6799cb5cf87ac18830c8424c4de61d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFindingArn]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da1e3db6fdf26e0baa4a457c7de75a244d23d13757b02e0ef87fea97e83d8acf(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06a42da4ae13489c5ead01708cf2de8e5018719db63787656eaccced5c922eb4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce317334a8b4a014f8b739c8f43f0eca49aefe29f63d6a8cc60da5956aa6ca96(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5fc2fb863f670e6d10fb6ca4dc3a594a18690bfed79d43ea4d7e859ae6e3a6ff(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72e9ac536392f9716cbf7faa2b3cab55c27f00d1800667ee79fb3f83ae19cf49(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d51f718da6ab94b9444a168fa032d366525f45a17e4d65f30859fe2cd9bcee3(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0db10af5866ad19eb5db9a2cdd84a4cccada9be227a7b4f9f9afa041874da48c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingStatus]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a4336f365bf1066a502baff1af08be2c929d266d0e6d6b13d29966c48828440(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7294b8eaedfd39902830a83b4809b42338ae47924749ef36e62c35dbea1ac1c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4bc085cd4154d15d01a01fccbef26e37b9c76d9887a5620cbffd5ee5aebb248(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c5a6c46f2b176f184549fd0732139af528ff94a1d11deb64673b385562c569c4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFindingStatus]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76771763d3701ad0558e07fa98347866ba0052e15762218afbe883a204724f99(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6a57cb7c4c64e29e975552758eabf90b7573722a3347e3cab0f5ce3150754025(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9dc9f1240da92ef8d82c44f02658c2043e4a943c3fd3cfbb2fd75ae86595a51d(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe0df524f021a16378e3b50ebd79edbd55b42c6f989cdd029d93c2856bbae8d5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1c6aa67531bd8011d7ae077313222ed00cf0a6610854bdda8a980988b48032e(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60681839282a336e25c374383fd4911ff564559eb3b5c0c4ea044fe6a6b65b9b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1c123223c11e76bdf0e3a2ea752376b46a909b15aa670cedf455f452c7d04f7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFindingType]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8c5276291081aa1103785853505f08fcd0997df20037c1e7ed530b3d31445ca(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ad07ebf1ba22a5c3ee46590cb86a0d0d6c9e9679d3c902b9a0787d7ed43d75c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__51a21ac5c55f0bd5919846267f2acdc0f26aaa95c8c7be4f89e47dd211f71d68(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75dc29834d4c3228032490eb811b00fe420bc1db02ce28c658646ffd7a28feb4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFindingType]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2340c853646194c6c9a12fed7b5a98f831fbdc92eb43ed58c5e98f8812ce011a(
    *,
    end_inclusive: typing.Optional[builtins.str] = None,
    start_inclusive: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__70719b641a4b52bd7b0a2c331763387482ee87fb5f4de31ee7383aa981975a62(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18e417a67ed7995c47d2ce8518d5b06133c295cb400edcd07c6c57a2f1fd53f7(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dbbbdf4f659efda586980a77906d341d39fced403b6ff62a4da56ce394e82b05(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62cea392ccff3f19b01335f7d664c4f9defc5411330d51543d8c43903e705b16(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c25b8d25d0ec6c5bd0928b5ccd3476e30d676ac33c8870c90b9d9095b1129680(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49eeec79af4ab624a8b674cbd7116113d755eb544341178aba793c95a79d8b05(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFirstObservedAt]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33dd0490f0227e15f062ce8badd05712f65b73b3c24461e2202f2961e23b16d0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__19ee8f3e0404db648501bee82735473333e18e2d480ca00c46608049161a10c8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aaea8b598ba0f827245978dfa78ad75f58a92d88001d276d2ddb72e16c141a18(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c230b749181bc8cf6bcae4c376934f561b28021077066c76cb13c66f0e60d635(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFirstObservedAt]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b631aa1d78ea3a7df065bf11216c68c9544b6cc420d430ef0dcf30a28be155a4(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0cef6e62894d93e6bd2e1aab805cc76d866a4a707d3183d369889a10d581b720(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e008003b3e3f4c611660142b50345f8d663e291c764bb8a84e95955063c07513(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9bd4de1e267ec9ed8c0e4acc4f609f255eb5eb6d2cd19513dc0986b56b93376(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72715f2af1af9c536300772ed6f83aa45505fc40466fb8ec4e8a07ef52763e4f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff529d215a874cf011e07fb9bb76692cbd29d3036a5994a53d3f834e1f2da330(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ca829aed3cd5ea43d9d2685cd24894f29eb5bd5a8dfa105181ddc8cb803e42a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaFixAvailable]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ab19058daf06f0ffbc596f77f4b7a4d4868cb8de114a0d703e373805865782b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__516b2ad9b27a9c60854826b2f8e0f31bb67981381e77ad5e3ae2f6b61cf28a15(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7305a4e5bacf3c0f9ef409c95ae361de59e14edd649d7ed815e658225912a470(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3355adcde52fb15d6705f3f581dca3d29f6aeeecde22a1b9597ef1c416fb2246(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaFixAvailable]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68aa200d664c3982825a222982a11dc5dfb952018ab41a29bcb4f623596ec2db(
    *,
    lower_inclusive: jsii.Number,
    upper_inclusive: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8cffe669250f0ab5eb83b97c63d98ca041224fe4cd8dde0249f6038e672921e5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a69c67c03d98a529895715158bcf8cfbee0d61aaa25be92446fa375bdd3f58e9(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a39944b5d485a800c185c6a21e0539c5a7e71fcace774cc8132a5f04da85581f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__085f029247e220e2a4e4428ab5b2943ef9ae809e53567fe0aa9b68cb8d47ec64(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__033d10d0e3fdc84634e62513df7fb5dfbfc2339b7d643e8e11105fdfa6d37a85(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__246d396b1716471f484ad291c59a53d80d1477549585089501dc1963eac1fad9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaInspectorScore]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ad5d9f411e97ae5ba11c157c7537b3cdc2ea37cb9776699cae4e1472de189da(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e844ed5ec572f332930baf4351342e29fd818083d53f593d27a09a4b6366a420(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9de2b4e216d1ab2bdb2c746ad0b930a068bcb1c55ad872309ea054075efea458(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf31badc15bee52b4194ab4d141e8222be3795e3d0f72a9170f20c2f70161aaf(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaInspectorScore]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__777900400d0a6da776094e77e3e27d40f084b0fcd8a92babf9c6a749dd097f2f(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30fde9478e5688cf8644af9b8dbb183d2184519bebda047a767135db152d65a3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca3cb6e52ea4d2bdd1fc903bc96685ae252a5c94728dc8ba3c2db1f2883a5754(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__594b3550b3d22f3c5886f7c0e6ffaf14987c2f4ba7a529f3bf8e61eaf82742b6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__662ed9288309775d7cf049e65148469a06725e2c60a2d637ffbe011cffecc41d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43a298d9c52a2c97c9e4ba719a586bbcd908853c1f256d512c7e6207a06a38d5(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e48f7970a055e3a02e98fbe9070ab13d9bc1c5a1bc4fa9cddf8847bd55d582e0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7a24cd52f41e9b83883295ba9fc6ce7c105e0c2954be2660d7b12f6cff5d301(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__467f5313aa2901aea8433fb7143fd24c30f51858a7592e25d348f3dcc919b8fe(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bcbfc0170f9d869f09db427332e1bc93c74483149c81e9a2fe7f4fb4dfd07e64(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc611c25c489c406b2d354ff3032dcb3f0dd9e1617b5cee8035e783fbdb35da0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca0042cae07db9922652ed1046b94d0cf2abc48f32462a63c5471453f0b81f1d(
    *,
    end_inclusive: typing.Optional[builtins.str] = None,
    start_inclusive: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2972013ac1ba376e07f73fc7d4bd8f6cf36d1a4946a0f5b63e8c8c62662278d8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a00808c96cc9000aede488fb5dd8fe9d6e9b1cc97495693b319555be4bc4edd9(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43d213fa1e29208eeca4206ae583d8726dfc347b8fe584fd0dd10f5de8161fae(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7c9ed52f4d64741c6a687d493f07717a59f47321967c4df30c7dc77f5dc88f1(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdf4c9e96c3f40e1fbde9ace455bcae636441f7978d7a8c53cbd37e008143671(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d9055d01ef2b3aef4e109cb47d57fd881dea9982b3c899319d2cb08ee658ee6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8516f0ff889bcf5d5f3ba97eca89fec2c55f900b44994bb59fc34327fa0ec12(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d9629d7788b0c6eecd9db337d7993783c1d4a4cf68394858baa3d4724880118(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87285509c7b92554abb50a0f5d198e86ac27b990bf4f2c15d6934d89397eb16a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e0d3d6d936369dcfbcda9d15771fdd06783fd8fd1b5c8750fd02cbda093b8fd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__282f23e5003376db617655027830690d7f84becc56304a0f6df503700f96ce97(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dfbaa75f01a0028fce570d55622c608f6937c43ec5216b79b707420bb7f5286b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a1edb55c002cfb054944de2277c4e264e49ea085df60e150ff3e87499d26286(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04f5b8f2abb169f63a847ea8281bc5324f2abcf397da1a78f94ab8d590526bec(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe617ea227a2ce2fb933d6b4a1c719cdabef8a40cee0f5820cff817f5896bc2e(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6770b52c6d0655291f84b2af82fc459e59f215f9d0ea134b9efeef96698cafce(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2432c8bd4ed30699afb73a365377550b9a8674f830b059216d9848ff04a4b14(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionLayers]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce74b96f22d8665e5f545ddee615e230f8e74c59b9b8c4dbed40089abef6696c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5dd23cc1c90dc9cb58b347b193a75120682b6518092f9b5eff07cacf302ed8c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__382c6a8f975925b494783175efb7e09c99a45e66939eb078bb8dfc584eadead6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0eaddedd78d66f247ea29ba2b3accc4ae57af1d9985dddf14c63595aa47c1dc9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionLayers]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c66c4b485b04170c1c143bfcfc8cf837b6a874064d3dad79cb919f6b18287976(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2afd2da3d66b4e5076cc54647473027bac79b2d10bd7613817ab3cbd624f89b3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8e1f845e8facbbd7c264a77959bda0388780604b6de8746f853c8dee0b77325(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c272b9559f7f9f335de88ceb777dfea2f76e403ae31133a234024e9683b84d15(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93a50ff62accfd6a9410ccbb5bcd260fc078aa36bba85cc2c174c48e5a137798(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2e52e76241cb3bf1f192975a2df2124aa3407cc3c09f210e7808a0ce7b078c36(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f782d6127d34e7564f59095886d913b24584bba4cc10d98b4a064c0660171cae(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionName]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5c760d2b2876238390b8b7f99f957b3e599a066046ce3da96066ccb52b83265(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afa0987c33ef33e4474a0a8a49842006b81a2e2a706235df3dcc156523698b15(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61c942e8e6db0eff376dad35ed6620d08204b2aa7156d645507489b99e71c2e4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5170f5b274ac303f796c1d095fefce412ceb68b9f2758dba3c848fc0c123e0db(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionName]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6c1496586b235ad6d974aeccaeaed4803824e1a88ebeded7480e8b3d536f18c(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__589912fedd0feaae2b2da9936f9d5d5aa4d473015f90d04158863de6579a05a2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc6f56792ec721612c9dcb333cb4f4d0ecb8dcda77206d3f2cfe0192621c2c80(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9cd67a049a12d4905aef97cc1d91af11772f420ca6e95f232b1d79ebefd6ad32(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10102fd1ff0cddf8a451f0106dd86fe7f0080a4ba72027c9c89a6140f1e2556b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f00916574b933eae43a4dd29c3c823c5addf49e62ae69574f534dea1b29357a0(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aeb278b99beb755d09efe66f4b45504a4eb5016a80164d8fce99dcf110f63aa4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLambdaFunctionRuntime]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__951faa0a8d5ba2cbd01f418ccab48c567777d143b79a827ba8cab1d78b038798(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae742385c3c2fadb55ea6512a20b52805de150510c2944ddb587450f7e8a961e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__760f7fce76bc7ef20665265c2d6f22246a94dfdb8c3598e3f23bc2d8d3234f1c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f47fe76c986505a4de1915b8e76e0b1b25cf4cde256cde4dc0257b24d8b3e7fc(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLambdaFunctionRuntime]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e9bb269e23137c913a3273acdb32b92d64ca5e313e2bec208bef97018b885408(
    *,
    end_inclusive: typing.Optional[builtins.str] = None,
    start_inclusive: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2b8b82ac4bc2335c945e70d23394c73fb896f2ebbed07b596465193a17680923(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efc86ba1a9a26fa5fb191735db51591e430cc4bedd5dde09c7f26e49846fdbb4(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db00c74046d6dfe3160e1e36390580791c171e0e50c4e1999d233a8ed202af59(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33d3c8d00155de3e5853f5975fb10ab8167399400b26ce7294363b179199acb1(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08669277ea042b5d5ea4604c50708639a50682385bc2aa52523cab12afb91019(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b06eaa1929d4346067160f126ea4981b119c8bf785b4c0bae58c09d492309380(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaLastObservedAt]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7cd23662419ab3b82b17c1f8119cb08faa84f998d3e59948761856fe81d11a03(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__759dc816a03c9f09122366ba148e07da92b638f532d742426ad147c409df8954(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd54d9efffc9dc2adf238b6a6ae389e960b2a3d12bc3f805de0f88e5125f937b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd8e8f2991fc47fa2d7247f397871237aeb5c0125729586b2d4123d6680535f1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaLastObservedAt]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea6e4c320456f47879d5b2aa775e178ab69f57dd882f159bfaaca17da757d41d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a0d79ef7c86da1731471ba381e192cb4611cda74a01164e4781413d36774e4d(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8df28f905c1bc958e56639d90dd7bc97d3f45447b9f6c4d058529446843dbec1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5651312aee95ee580d11da1a48fb0f14386475d9b97af1e723507bbd9238b2f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce3079e1347b79eac00af079f48221f2cd460397e571a6aa3f7b8024626ed822(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__45a26496df0fea4a92e2bfeb5682cb6f65ea5173d69ee356a82f070b2d8a0114(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteria]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75c0402e453e6a594dc861afa74f75224dc7fe3aeb0f2b8cc6b0cec71317bffa(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ccdf95749ae2056b59f4b0f1483c688e0c34e27278f1e96f7fe7f8629865e26(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9cfb0bdb0eacd073baaaa829e17a2b1773e9e88ad7a5ea2331cf6146880cc1bf(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b55a509a48a6a95fb06332ee44a5bf64e75e106f1b0112971b94025115f3f9b8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6318c6c8554a848790e3170314ffee48ff3533f3d26b73c4086b1f0c59c71a5(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1df39f53423fc1bc6a23531a5aaa79d9511b3eab46d98be456cf94bf9d415d6e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1ea8a7ac749bd59e5276add05c770380b3ac165ac2aed3ece2622cfb10da377(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaNetworkProtocol]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1616075f00f5c8b9efe5079f24d9aab01b0b69e5fa529608113353239017c3c9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc2f982ec7338c78380783046f1095bb6cc720dffd39bf6aa1e7dd67478d84a4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21e22570dcc86a49d92dd685698032f6758c0fb8d4e4c40d739eb8401387eb1b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3db6d6800bb4ddfb5f7343d1534692d9a6850f0268d9e061ecd938057de659a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaNetworkProtocol]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__69d5510ccf0ddb7e8188e0821d4aebec3964e60a940ed4395778ceb31166cce5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__63a390713aaf910f295188f51fdd85769ce9a9edb3352c6045457e4a500dc95e(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaAwsAccountId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d642c74db906e4bfd31383da390c47f81c62334b8ae45c9cf1dfa1d6dd1a517b(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorName, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d0f05ba408b4f64908bc08d06543390c331a52aa6511d109f5e3daab34c8710(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaCodeVulnerabilityDetectorTags, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__364e767448b7121736c3d4658ed48e67b37dbcb33f800c676355c86a44057cf0(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaCodeVulnerabilityFilePath, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e5d421d86b4262fdd86ba5ac4716a7c58993f5311ca7382a96802f9b2fb4e38(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaComponentId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb089c65e464bf3aafabbe22f4f278484592c9716dd8c050aaa02d3928a9711f(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaComponentType, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eeecf552bffe52b4eee5877feb874fc676c607b7501f79869c52ec74d28b2b15(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEc2InstanceImageId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd4ce61eb162b79b1436d54211639f0f0b4a168ac90a4dd67ebdec88e2a2f8d6(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEc2InstanceSubnetId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0aebf77cdf5ac34276f784139490af676d9716f482a0ec9c37daa4b0c0605e45(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEc2InstanceVpcId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40788e5f599126508fc75830c31c0c48bb2f03bda8004a6055f918c9f12b8247(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageArchitecture, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__befbb2f48a4fa92172b269488305fc0cba943413455deceb2f65a7f69af9daa9(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageHash, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81ddfb17e844715d28882ddced5e87bc065d87a2b72cf092f8c2ab1fad2d0a5f(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImagePushedAt, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff6db8868aa25a5f5c7176b88a6b5caa68a1a2afa2adeef89bf5e5d49aab0d7b(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageRegistry, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94105dac5e6153171bcf8f6cad4592ec21f49fe69d59df364f0519dea9e89410(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageRepositoryName, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d2e983fd163b57aded7ce72fd3821884e1e1252565055c5240c1af56820d153(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEcrImageTags, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb5c19c011b0e942444e371771d5117ea35e012781ef1821b0eff822259abf28(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaEpssScore, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3dbbcc19de6ed6152923c4402aae4b0644be86ec7b0661e3bc5374f9edc57600(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaExploitAvailable, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c5eed597528fc3185563884cb4b4e99e5acc7396e6c4e21c275d927f30ac29d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFindingArn, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cea1ca227dee2d82199a466b0366eae8ba5ddd273bdabe96481b03923207bea0(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFindingStatus, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d474c19ffa94a32150a01e5e17ff90a4e38f8eb36769a611d9264c224eccde93(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFindingType, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__48bbffba39167b3cffe4191d1f867afbe6f411a6a6135e5a3584e02f7d448f4d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFirstObservedAt, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65dec2cd237df15829f97fd5d8de2584c99e7bdb93b366daca8ebf7f14746a3a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaFixAvailable, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9e71de73d996d96cdc6488a67a4ea72361a47ce61de2aba5a3260b6bf0a98bd(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaInspectorScore, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2555942179d566592a36ebad176df043d6ffed522f184bda33b78725f90537e7(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionExecutionRoleArn, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c17399ce03526bac81eea98f68795cbf64209a087825c211fd19a0ecf255ed87(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionLastModifiedAt, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4dcb2ee96962363541f9ebab8aacc9164fe91cbb447fade12940940e61c9e18c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionLayers, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7070539dc44d6132bffaa5242861dbc616440af3cf221473506af60a58b72f5(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionName, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__274718d19fec77b6df87f476388e6167c52ec58ef1973b08147e7d08e4d50c6b(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLambdaFunctionRuntime, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efa00b827a5e09a242c81cc0b4dc2b6015d6c9ae6be1238fcac99626f0a4dc27(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaLastObservedAt, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__076c77e8297c92ece2dd559703e88f48c3685223ffc9d3028664be0010e18aad(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaNetworkProtocol, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96ee06739d996a4e4fc4c2b17555b5ed89b3ad2365de8d12781ca41c2bbc7555(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaPortRange, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4446f5ff11b5f030dda1a086ac32eba3689555c3072439f3c683ea765ec7ff6(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaRelatedVulnerabilities, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b77f445e2f790e5e1bfa8047b5b7f6d1cff238e9da9e3a7d96b9840f60c37a8(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaResourceId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2bed61a61d8a7471c080a2b457bf0036d795f13f251d69b97c729e3b78dc7dae(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaResourceTags, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d60adae01ababc9b1e7910af55c31b54588354c37c6814a2168347ce27ee145f(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaResourceType, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9dd8e7f2c476028f771596ef9a4f2eff2546bcb21f32ad7a27020853a809eaa0(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaSeverity, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0fd6bdbbd4351e491ed7b0163cf0d7cfbc635442afece5849584ce00fe5f95ff(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaTitle, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9dda4afc7a1c77598caf5da9867068e6b99942253e18bbe6d971f805f51442ba(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaUpdatedAt, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d39700048475e9913051882dc04a3b2546ea8b9c1114a208d66059557030dec8(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVendorSeverity, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78852e3e407e599e8fecb096521f30f6708665392195abaf2cb66dccc5f55dd1(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerabilityId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5320c4eabc264b22399393c996393a8b3f48737a6d2f6e97847a130ed6343895(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerabilitySource, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8eacc3286f230765a9526d35249434b9d1e76746d5be8e12591c6e7912d4ce6(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackages, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e2fd3ffeaa265887c917b19074ba2b77061fbac028e079dd1c0c2812322dcc1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteria]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__827dcdab8c1edaca529b91ef518d56129860902dfc15e46d4ba3d9c44f4331d5(
    *,
    begin_inclusive: jsii.Number,
    end_inclusive: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41896dc6d26063fa740c4709066ca8d63fe975d544093cbae341bc23f4fbcf06(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c8d24d9f6d80bbc065626c0011c293df72fa1443f026197512a052d01e958537(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90085d5c577e039364f2244a6de4388a9f624ade54c3f4b7bb55d8ab9e0ed5d6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cfbbf58745f7c79c2c0451b32e337362a2620714afa0a1b437e4d351fe23f2ee(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e893709ec91c34e967b21aee06069a2576598d654afef915c5a7caa4e96f06b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__50c4d39f2946d9a7d42e1cc1dba551087de5d0dc5acb0faa05ca5f58ef0566d2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaPortRange]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3ae88e26efe29db7f0957c754da281631af60d65de1934e2d31127f1954a3c1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42dc05a5b49b604b26941386b042f557c3045e1aa757915a75406a14f44873d5(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ef21dd9ca1366262e4968eb0bae0c5d838a2be059b88c985adfa62746d916da(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__428416e22186ab93adb2195f2e70741ca8ad5be53fc99f73c722b56b9d26235c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaPortRange]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab9294309ddbafa6fdd2489294f578b3d73e9ef2604fe76239c437e9be9c218f(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04b716eccba885661417ced3138d72f3cae9e6e13a1c87245c91175754a593a8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4cf26d580dcb5d9a1cc7598757a18d03a0902a228ba0fe5d60b2193698782922(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06b29a92360b1ebb13c08a9e08d483858033dc7a98dcba4e0331cb913e2af857(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7bcc56f44b7c75964503a13627977b04df029f3b3797fc74c55f12fc6ad9254b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__acd9d1b8252df832a23250c729edfce0351882c177fd58416b114fecddbd7002(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__216440a9c6549423ca2dea66eb1d121676dc7d95eebe21e29a60242c76ed84f8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaRelatedVulnerabilities]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__853523a004ef041a83ecd423f2ce13d8f0e7df92d0d0fba68849364dfcb1c37a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c8a30c944fe3ca56e311eb35c4803ab1beac03c82e0f011bdb21bdaa312ba7c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__89e3d7f138161dc8e8042ae54e33dfd9ee671af9e4cf7f143cd83244b68910fc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4795795516968ab1025bfd2b839bbbd9a939bfb4fcbd0b2746517d2ac5004fea(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaRelatedVulnerabilities]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06096834ef6116388926bcd944230717dcff824bb19aed70e1c9a01055cf0a4c(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4769e475c0bb4d39546cea67f42d7cf9cbd38e84cb3c4a831f14760590665732(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c6295bf8edb64753482a6fe653af62d3313c7fd9760ad15cafc527085585ef9(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bfe0b3fc7bef035a18c790da702f88e6e4b8fa49a8e37355ae6901baa044ae70(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40a22d64e4a9a10dfe706da8da21d28b6884ce757c4fec184590c1ef123a5693(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3314e15f4a1197d11f7ca3201f2f22e92318bf288e8f7a7ac7b3e81d4cf66144(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1683869a7c94599c50afa00a57413f31638a55e75f8854c45ba753588a423e59(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaResourceId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c52a3cadba312562b48eba802c680e9430d96994cc4146a546ffd0cfcf93705c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf5f8330e29cc5936a91f037dbe4133140b85af3e935360cdb721235d0367e76(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c15db1d1c4669c6d5f7cb1706f0fdf3047aa706ade97109be9009c1cf2ff7dc2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2523ae72887c6f20b956522dc6b84cc2de6438529efe1cdf69fc730baa7e4972(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaResourceId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4a1b8101d2d677873d43763074f1984883c77f879ee1eafb7cbef602bd96929(
    *,
    comparison: builtins.str,
    key: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cccbf58bebfeaf766f2f988c9facf6f276773af2a979d06c7b56086abd839d7f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ca8b1f30fcdc384e0122584d3b0f36deea44e26bc4763e21fccf33b68af43d1(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc2669e266f5e2c323de390294d583092f489ae63bc47008d732e1b6f5238321(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c882b8cf340569ab91c0d145d605d01501af0d768d1e8fb94c14e1518033c3eb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4030e5ad7d919a44eea90f42391c32d40f73192852ded5428c93ef389af53a14(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ff99b1cf0efc25d6d84d9a66262af6797b8907cfdad27c24ae2946979f301e9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaResourceTags]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18ce705ca91ecefedf81c75e1b9b27edcad06ad18c7fe36b04d2a4aa72b4597f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f16818c95c5cf08347bf2bc3065ae9ff1362dba1448c729d2d3ca74ea88516b9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ba98bd2db8a718e78c9817d21e70e1f25088b786ffd0d659b71da089f9bc7b4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__951ecef9db4039dacc6beb679a2901dc075eed014f51f981199dd96d68b1c1e2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cdcd97f9e7eeb107ac22f67902125836f9a44b7edd690e4516001cf2d85fde3e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaResourceTags]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62db7bbf5e83f956eb5e7df7d1b783f196f3c3f65723642c84727c4f5003cb72(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2ae44c4f4886bd35f8d477290a52d2503ffc1f0edf4f4f80d93393cf745c694(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2931f558d279b6bbfe82e7f0de15beed02d804db52fd0a8b38a55faff29f8ab6(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b04081f1f9038db3368713d8ef69e6d6adcea741c595dcfc6e4964c56983073(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01170c8da2cce8523d7e180af3d74030d08bd28bc2117708fcf5f65059373e90(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e64deddf681fe30ce57d3cddc78d795942ee3a419a89becbfad0bc9081642a67(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27b50f7664fd3c20e51fb4d452880defa1bf02a393a40637c3fa0db4b5c42a98(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaResourceType]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7899013eb201102f42a83507d264addae002ba084fe11ec63752a55c6c2aa22a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f9ae9a1bc1d867c7b47d28a0b1b0020022cb38ee0ee3d52aa278147db5a9bea(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49dcb6eca6eca2cdfbe00abb57d9835ae4096b8a9ba1ef8be843e13328260afb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b00ed05b5a562cb52da0f405a90e0930c27dd24ac7ae228584ccf2d50bc5601(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaResourceType]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d3f62e3f653dc6738f6af5aa357c545c9625b6dff7d36adac1207620c7eec48(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81b0eae7aeec1696ad9dc59c4a628f6fd3988eed0d6247d8e7f5ea9fd4ed96b9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc59cf8f247b932ea63aba974dae422ae4d5ed67f185437377388fb0bf0f611f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df1f4d5e523bf6a56627d2ddd53d4515b9f3e0d9713e181bf2c8db621044a3c0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6340c01af08b9ca075a865c1e4e267c72fc306caf2c0a8ecb5c00f332add597e(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7494797286772b1a3d634db867b13a7c81879a1e9b87738892860b47f875c4cf(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__198dbf1cd7647161c9a9b109b72cbed0daf5cd0e45ada6c961dbe00ccfee4672(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaSeverity]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eaaa56f685738a1370d2865fdee6022f69109a36265b7b24101d8a55e8647939(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1870314ef2f820a6715491a97dbff16e05956621909d674133f75683d70ec61a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8127a388aeae311399fa703efc3323d1ead4b16a523c9d868eccf3a2f6319059(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a26be82dc567f6471e097134a242cbc08225503c3ebba182f912602ebe57585c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaSeverity]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32402fdfe80006b44dd73f28fb43e7ad7212651277fb7465ad0428e22b3fa5c9(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3a35ef6e0c0eb765cc6214e90eaf4e0aa34f58ea1ba9e79a97c6f25cb8cd3df(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__505c455f063a73bb031281c02d73342d5b218da6987f0970ed2c473242436a96(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d9a611f427dc02929fd7a1e7d652035424927be43fded7d08c8e0bc815d9359(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__71b6069b7d9b28b935d804575b1242f6de48f4efa16d401f7c82424bfa014c79(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebfecab57920cfb8ebee52b70b54fe4bbef36abe1840a831fcd5096ecf372fa4(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ded665548e7111317372e7ae8ae944c74638caa11fd6a2170f3b486492d766c1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaTitle]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2953fe7e0de5bfe90082fde07c924df060947c51049d78d244260ac1572e214f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e83cb244e3f2695c2ff4688bc9f27ff1095198a3fab516271cbe7ac5cd788169(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d881b9151dee74436c193888897da0e60cb401f773aa2c1dcb42296d6277ce5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8cd70a47cf45ef4524fe80bab1b8a5dc106108ff55cc85c69389865de5617ab3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaTitle]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__505b98be8f6e4b2dfdd8f5c11f196336943430c9f0d70fe0f5e1200e316ac150(
    *,
    end_inclusive: typing.Optional[builtins.str] = None,
    start_inclusive: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15f9a66c9648694b24b4fa33402aaa71f12e01b2a8618b9aa31b5545786cae44(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98d25a27a7a3751cb3960a4c27479e8604404030aa31eeeb23f251db03263b69(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08f95f367d83eb8ff3938fb6d16b5c466ef438bc27b732c6a44a1edfff81d083(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1bc7a8d61cd95622b0f3a58fdbb5d1878a7a9498052c81bff057bad68f2c7419(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a4604bc0bd1475d88324305707dd5d1a952f31dab558ec28d735a8cdad77e33e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1b6ee1420d00f81fcbf7430495b0308d96de58433c730a3246723a66401a847(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaUpdatedAt]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6b18a9c6ef86099f86f3802e09962118207c0e2cdaa29683a8e4933fd839864(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b3c36778e91d310c324901e444a0fc21a27585472e984368cb027187132167f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f33a6010250e79cc68ec576008ec0a227bb4b5f3c4a36658d3769df97d627b8a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e13d3d575f13e3e9836d33dfd3e89d466e6c6b09fe4191d159240c599a44e8d8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaUpdatedAt]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df6f4260a9778a2265bb7326b1910635b7f7e22ecb2d695cd17aee985debdc6d(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b36f440bd6809ab19dc4c6efde1e4080225cf1b872bd6362531eb735400047c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86088d4b36fd5b426b3eb7f3a69d55e232a2e9d066e07750bfcf070b145b4466(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0806cb4c7ebec0590411138dada88c278a294d83d7df4319aed5822fce0bc160(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__052ebd4b762d2540834a8dac46be3497d16d600b1826554b2fc78ce543535e0f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb41a47a8879dba45d02aff029d9c5c1d5b1491735da08e4caabdab5b9caba2a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf581bc93c7a44b0e1130976ba12cb839f527cf862f1a7e01f19961d23403b9d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVendorSeverity]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__187584c1b67c7ae7f5a5073928ce21fd9b676e8fcd1bab3fcbc980bf13b992d7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2cb64e722cce29247faad34f439f2136014b13c09a80e898db65b51606c16ec(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aabb4a5ee2f662f88457adcffbab32f34f6fa4abe506d08f146ab6ddc4ce93a4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__294bd8066b627dc31c40743bbf5363d9ce14fcc851411d8a2be2a963783421e9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVendorSeverity]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf9c434795119aa92a1cc9911f570b443592c1e6c1599be047c0014ce733dd9d(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb22c9f39debadf0bf71c49f114b6ca5dcd2b05dbf772316c91215405df93f69(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f7c2b7abab6fb870d64f894410f0c05bd07618eaecb185e29c338e1574c479f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c87f2f219f492933cf5b163d26c38c306582e233187e3c33e285234e5ad5f29(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebf854624f7cdd7a4204d90e31989ccd8addd6eb24c055b5e24e46ef6eb910bb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__411b9002e8dd153a55b45a4ef931f8fbd48232906c5aec35b165daf0fe1ec098(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__20d95d0dcad422b7430b03bd22d47222818206178f48efe02557b13f06541a5e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerabilityId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05546520c06131a943911fc861ca5425684bbd66fb49920e8b61becc8336819d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__17c4d359bbe706d6c87ee47c09b82566fafad07ddf072e5731dda3e71db26a34(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6799e63b4d1032a0c149367f803677ac3b73d18c353651138e4b661d599c996a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf4cc4603a798c1cda4568157b1d2190836e46c52ee23a19aaedd6efa6a73963(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerabilityId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc61aa3c1c8b939de30c3d2fdf0d0eb195511fdd1e46fc35792f0f173f16949d(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65147cd2bc5eb92524fc952379660d6ed669a3ccf2aea5ed6036654d165878af(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af753e9122d191c7eb7f70db2dda7250f5c20afe359123105b09ac11aa285ea6(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e384fa5cf63d3296cacb87d43bfe95d08fc4ddc101be2cdb5adec72c58f387b4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b428fe2af1237ca295d87b933dd3611dfcdbd8d6416e0a9969fd79a11c6cee3b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6269f93cb269793dad02a1daaf7ca0f32ba27ea17080d2ec64e0f7597669760f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81215823ba213a6f50f4aed73967d8d7567e10662ba8a8e08a61348704f61eaa(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerabilitySource]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a6783171eac6a5ead1aad058109d4ea7bc5dd4393512512bb0643195bb55fc1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0824073b894c4b078e426dfd1aaf7fa0eeb2091f61a9c7d7d07f19097d489740(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__222c41323ef15a97d31f0bb2c24fdfa98d5ea56be7dd085deb73001454281ff5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5030ab7eed1c1843e6756577fb7e84ada0410e300ca6ef7a62c6049a074eeb01(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerabilitySource]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d6af750f7316aeedc3143c2ff572f4e351d96bb276d32e8ef284c28f6b708a1e(
    *,
    architecture: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture, typing.Dict[builtins.str, typing.Any]]]]] = None,
    epoch: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesEpoch, typing.Dict[builtins.str, typing.Any]]]]] = None,
    file_path: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesFilePath, typing.Dict[builtins.str, typing.Any]]]]] = None,
    name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesName, typing.Dict[builtins.str, typing.Any]]]]] = None,
    release: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesRelease, typing.Dict[builtins.str, typing.Any]]]]] = None,
    source_lambda_layer_arn: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn, typing.Dict[builtins.str, typing.Any]]]]] = None,
    source_layer_hash: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash, typing.Dict[builtins.str, typing.Any]]]]] = None,
    version: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesVersion, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__335b750b9bf8f1d699dec4469b47de47f57fd939c36c662c76d0ca7b35e84b0b(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f7bdce2df48a2d95f8d2dc0f4bce6328cda2591f99e53dbc8ee20075f37463e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8363050dd551aeb35c3170f98572029368eb425e72202286302bc73bc0eaaeaa(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1de9adbca32a8742287e522abf1e65ced881197061bc090e641c66aeaf41ca47(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6863885b5178815ba316fd1509b6572b1486d8eef1107ebfc3a5dc39f71c9d3e(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b90934478c73036be6bcb965a80d2f6c1a563ea57a4b8f79911c264e5f563c29(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0568b0980c5ec5ae36e0e32e9fe409340452934c262b04ea06c4d0881f4fd9ec(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f040e73b1d2c04246ab9b493eef642d46454a4d55a77f1074f7a5471624fc7cb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f970d2a34f9a8d2a44f3743e684b69522f1483b42886fcc9a34949c976ce07d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec711e133b2bdf3f40731652bf247840d5c932e597ff563e5f75b24cbe4b39d5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6560a561904a0c1a4a1de6986747bdb4bce8dcc201077e164398a90c438bec76(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ef7fab605e564f5028f1590f0ae050bc0034aa123c7fbaf1689d6e459a0be90(
    *,
    lower_inclusive: jsii.Number,
    upper_inclusive: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9154ac8f44a2a6aa6649f9fd1da2424762d11b54de24ef31e9b51e1c7903dbee(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3178071c2cf755d0e74a1425e26ff81e4a852af8ac2800bd5a6f86d8e37e2834(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b579e80b29f07b60e4f18cbf683bcbd2d8f118673345e4c75d4c06962a66d0e0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e25036aa9acd335c43e1b526f2aa877258de1bb9fa0e7ba53a7173563683c68f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__536f817ddecb89da9318ebc6a89a2f361985223ab954e048a22e9be8f608d8f0(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4156f4318fab2b8d0de12e6a74ddfbc2171a438531d53d0dd2afbdec5ffa14c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesEpoch]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f6fe955e326b0b6e4ab0bf552c539c7ddaa6d7f3bb9ebb575cd6129a1661661(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e377ba366e2e1be9520cf0ab4e746cd5c7f91e7df786a428d719866ad9abe2e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf8e7cf3d292f366ba579eab062e54b348fb3321217d818411063d3e74ed45f5(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebd77ebc974ced902a6abd7cd9aec58af5074021195bacc9652c2272a64a8d63(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesEpoch]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fa333d5a57f5b28c3e08edf6d0efe71a244412af69886fa098019643ce89e5fa(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ddaf22a005ea880f600889f0e54c1ad46cbd6c498f5e813de6e528bb1f8a9ce(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2db1f1e2109b0885e9d31e0a580639900136d86d209c35ec27a526c0d03432f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43d500d1ae6fd85bdeae00f658a2c8731b879cafb9e983ae162fd10b828f8835(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7a28752608dbafb8766bea5b77638e3d05975593220ac508bd1ebf537affa54d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__101b7d762fddcf0f23d457d000ec4a805b7836be74451ee00e168060e6af563b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0794913b789b992ccc668d0d18e84a96b021accd5f40c391c7db1068e038fb3b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesFilePath]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e051b9c387df2f0f4932be91e06226135ecb45a3918883e0dfaf6cfbb62355c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3092ece5b1a22f259cab7c6079b2711a1587dd84ca8e58e51e980765c88ce18b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ef74234b1ee21d9a78c60e9ed0a251d09a7ae247c3e800a0ce765136eb0c4b3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2684dd7d42033e05fdbcfe79c22fc52bbf6bf889aec2e2dd992154290b691e29(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesFilePath]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59944d576575c0f7127e64f158bf3b381dfdde07ead465faeeb869208ef1fb7e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c81b6e3303db78f4d3f456908eb750fabce5d92f8c42dfd6bfa26f1564cbe37(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7031695949db5ba61301088f12e5dfaf009b090cd310f602aee17670af701b9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1903b303b1d4ced684a8d71ee16c026ca8298213c12ff36521d1b7a7a123553(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c96b43b8d6b978d07aeb039f9c04614bb5f085b892d8ed6708f8a9b8a8bd01c(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1532c34e7372180821320df39aefaf258006aff6a050c2e86546750c8bffc3c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackages]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__359dbfe1765a1d1163551c92a2eeeca982c6dd28b88b234db8261977afa511b0(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3c63152409e0182ff739b9a1a2b2fc9f7eae079baf053ad28aedaacf5e0ddcef(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a03c4aa833b0245dbb3e622758334bed2cb65d52dbc1fb38f554faa43db127b4(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f2b1e230328444cae78fe033f504c62f04561f8ed4fe08a1ab41ba12a87ad614(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dba60e8ce0cda350b54906ca38bfde161808a156c6335465192932bc34b22557(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04583e0e5e6ab099c25799b23e969a5b7f73fa6bda500b837c19a8b6c3181b26(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ec91af85a9ecc6a1abb28274f21a81be2208d70c0a24694dda4cef2d147b910(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesName]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b97e4993cb370ec177ecd8d4952ef2e4a384e3721c63b90959d17818633e751(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0cb07dda1af763a93ee80ac682843dcb6255358132b35726a86c8caffb82cf73(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ab5e80c9d109eb32a3d85e36d3566aa86ba626fbbed5965135a32d8eb647f11(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3862f9dd1b269642672ee7c7e61c65a16f0466d65d9d600e003322f4889ad448(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesName]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed1b29c3556a73685993ad2dff73d1d9ef1d9f4746d55600697a5d9748d3003f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe828d13ed24354c1a3510e97085243f1331efe4f4a90d27bafeb0f910dd7792(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca0aaf8e08a70625a15c2a6d53d268af059ac3d59b04df59512d23a0215a3b62(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesEpoch, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1763aeb8cd390eadd695e7b53cd4bd49d381840f78ada120709f35c34ed8c219(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesFilePath, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f34bc017e8e598e3992ef264ca0fdb64b8846c1f8bb1cf4c8c428cbcdf6fcf5c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesName, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4048b2a63ffdecd91dc52b867169f220fda3e56835cca9f20b83a770d048408(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesRelease, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f6b75e8bcfaf0a5db1be2b4d2dd42e08067ddf444fd6156c1b42a3a52ce9dd2(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2631ff45032486593da634fd5ca0f76d98daac9790355a0a9cfdd244b352f82a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__814e83ccadefc6534fd9de7b0c55a2e61a60ac95f5ecd19b18844568858997d6(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Inspector2FilterFilterCriteriaVulnerablePackagesVersion, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c99a706125a04e345ad491425d089c0fcb9fcb4c37f943d10981063eacda1a59(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackages]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8968d7f2ef9a322a9c172277b1e352dae7cfc7c7be9e67685d82ad1cfcbaba57(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79ba554a1aa7665f7229f8e28f5090e82dfdc9b14b91ac000714207929d7058d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dda47d9989d1c42624c2f8cf660dcc3136e1d55a50b6facf8066469e075e1a27(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b41f88f73ebf3debe9b82b21397387821cd7622926de56d2844abb1a5b15e64f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__45747f4b984c95f13cd22851cc1a109115be4258c250352ed4b257c73c741aee(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__575823d928e2d83ada8550f96083f1c2c88699cd4db352763a3d66c0b7bb07c0(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3213a56b045679c56bfdd0ace7b6ae88d1f7eabd61836d17fdb6a68d76b7413(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesRelease]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__613805e68678cc8a8978b04987da13093cd36f7b26f6f21b006af15e64ff8eaf(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cdcbfb7817af83584b1bb51f88d75751973241fd1ed1fe0d06ef18dad77255e4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bec5580e2f3302b391ee38b62458b6ada580262b4e17f26a44230f62294b7f6a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4eca937df5c726ab59060b3ba6a6607b9f19e7d702d4dcd0e0769d289b26f974(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesRelease]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf21e29461d6eea816170f4dcd3b5177b4d43594ddd31483a72199da2074a1b9(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ccd5d8e99cf636ec16073e910e1863c8ee1be5734d583b4c57d435067400642(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a630ff69f31cfa57d534cbf7eeeaf0a814b6948af3c4aa2ae7dee9b9acf4070d(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__25274ea91f5e94381d11808de789dfa70132bb245d24181a35bae1875f50cd6f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__17ccc2df971f03e07d13e3240026cc7b0a9864aab86a82dfc2835ba914841c7b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96e38a1385552ab43da5806ee31e320084fb59a77388f7b8556f1558ea4e8e8c(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__781702f6c9c818e518d17e3572cb3b59d7b2626f8092b5e7f24bafa5a4fa3d1c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0c6bbe5c3661dfcb8846cf6e1f9dbe0927d8d3460d7542f7fbc3f933b9d6fb3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7be799d428960e53fb0d4374491d8c00937fbce566ff050bb39fb11866c6fd62(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86f895142579a84aa07492a6e383131fb8b80cb6d068fb7987e1b12cd55c7ef1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6f31f890acf1c43e03ad110824110da458292c90650cbeb445c998ac5244493(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f752c304aad255aa6288c7e7c8dad0086afddf2feab53c9ef44b67ab17b06a7(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c21edf19ea41f2ec42159afc8c6361df4fdd8b8b4d64090b81b1338bc02782ff(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__244a1204b307c3612bdcc5b97ca6d381ddb42612419f6e8306740887c9831214(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ecb90a62cf45885ee833d7d04e52a61463c7794cc98be064bc7433118b7b6477(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__de796726ae5aaf023836a557aff7de22185b4bfadcbe540d700da925941f2b41(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4eca6591e06ec8437948077de98f39a62c3291a80f629bcdc3250ce54773dbb1(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ad455f8948fe2739d126ab27aa4a87edf20bd58643cc8c00bbc041894602c253(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ff66e57349685dcd895e5ecd36099587b4fd2505514a9d57778e5970abf5089(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b85fe8e4f1761d3588f79fd1fb3d514c0ea1197f72c88fdc02ea4ed6fc6faf5f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__95b7c61e2d87c56da8de7649c871562d67f9e8d207ce60ec3ded1d8e2127d420(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf24433f03c678564f1a5d17549e3f933b0a27ffd92766c58f8637933ab6761e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c22748bd0decbdb3fb1d8905126555aac7e67545027636d3c1f2e56c0dd86f9d(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75e9c02c755f4de32f068528d1f6928ab21446b35c1b1919026ed03bcfa6460b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d6ef7654df29428301bf5dd447079b45414d12b203a962c407c3c74810da708(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75bca9f6f1652bc84b9e7afdf1f054f2ae4fe49727a5bbe17755e0cc7b1cd2b7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eae5d32253dd5f73c3a0b8f9bad7cda376f444ce34d57b6502f9f5fc54d3e9b8(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__851935661bb0618710814524ee2f6a3177fa669e5815e0ce758549976a6f91ff(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__13163f14a4039de89c09b44f42c447e1b1c5457e53e0bfc517581b8db8dc4104(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Inspector2FilterFilterCriteriaVulnerablePackagesVersion]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1524bd4f105a7859a972715e4e9cc8d312d97114d358fb640e582c167c68b2ab(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__11d397266506a2ec12a68b361ded36c76d39335e70c55a8a448ffae96853af6f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc7464d38ae49bf15871189077710d5658b93554c93b78e29f2ccfad6ffd402c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2230f2c837e1cbfd072fb3d5427b112fcf5755fb7d74da83d73f094b19da3e8c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Inspector2FilterFilterCriteriaVulnerablePackagesVersion]],
) -> None:
    """Type checking stubs"""
    pass
