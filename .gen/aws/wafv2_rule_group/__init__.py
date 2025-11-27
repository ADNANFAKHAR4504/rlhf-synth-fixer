r'''
# `aws_wafv2_rule_group`

Refer to the Terraform Registry for docs: [`aws_wafv2_rule_group`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group).
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


class Wafv2RuleGroup(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroup",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group aws_wafv2_rule_group}.'''

    def __init__(
        self,
        scope_: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        capacity: jsii.Number,
        scope: builtins.str,
        visibility_config: typing.Union["Wafv2RuleGroupVisibilityConfig", typing.Dict[builtins.str, typing.Any]],
        custom_response_body: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupCustomResponseBody", typing.Dict[builtins.str, typing.Any]]]]] = None,
        description: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        rule: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupRule", typing.Dict[builtins.str, typing.Any]]]]] = None,
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
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group aws_wafv2_rule_group} Resource.

        :param scope_: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#capacity Wafv2RuleGroup#capacity}.
        :param scope: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#scope Wafv2RuleGroup#scope}.
        :param visibility_config: visibility_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#visibility_config Wafv2RuleGroup#visibility_config}
        :param custom_response_body: custom_response_body block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_response_body Wafv2RuleGroup#custom_response_body}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#description Wafv2RuleGroup#description}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#id Wafv2RuleGroup#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name_prefix Wafv2RuleGroup#name_prefix}.
        :param rule: rule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#rule Wafv2RuleGroup#rule}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#tags Wafv2RuleGroup#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#tags_all Wafv2RuleGroup#tags_all}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__92bd52c213e6a9ed94443edfeeb3d0b3b353c3d95c6ee2ba3b276c69559bb5b0)
            check_type(argname="argument scope_", value=scope_, expected_type=type_hints["scope_"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = Wafv2RuleGroupConfig(
            capacity=capacity,
            scope=scope,
            visibility_config=visibility_config,
            custom_response_body=custom_response_body,
            description=description,
            id=id,
            name=name,
            name_prefix=name_prefix,
            rule=rule,
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

        jsii.create(self.__class__, self, [scope_, id_, config])

    @jsii.member(jsii_name="generateConfigForImport")
    @builtins.classmethod
    def generate_config_for_import(
        cls,
        scope: _constructs_77d1e7e8.Construct,
        import_to_id: builtins.str,
        import_from_id: builtins.str,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    ) -> _cdktf_9a9027ec.ImportableResource:
        '''Generates CDKTF code for importing a Wafv2RuleGroup resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Wafv2RuleGroup to import.
        :param import_from_id: The id of the existing Wafv2RuleGroup that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Wafv2RuleGroup to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2accc964bcc7d4ca45fb7a2baa76e9005227b87b2bc16d4b5b86f89756fd9c87)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putCustomResponseBody")
    def put_custom_response_body(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupCustomResponseBody", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__721ac7b50488b91645e719258bdbcd6e40d9b6590acc70b42e89ec1f90d5ae78)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCustomResponseBody", [value]))

    @jsii.member(jsii_name="putRule")
    def put_rule(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupRule", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e7b2fdfdff6f48f4e8a7062aef863a1d04a27828ca3d37b7de98920ae2f8383)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRule", [value]))

    @jsii.member(jsii_name="putVisibilityConfig")
    def put_visibility_config(
        self,
        *,
        cloudwatch_metrics_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        metric_name: builtins.str,
        sampled_requests_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param cloudwatch_metrics_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#cloudwatch_metrics_enabled Wafv2RuleGroup#cloudwatch_metrics_enabled}.
        :param metric_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#metric_name Wafv2RuleGroup#metric_name}.
        :param sampled_requests_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#sampled_requests_enabled Wafv2RuleGroup#sampled_requests_enabled}.
        '''
        value = Wafv2RuleGroupVisibilityConfig(
            cloudwatch_metrics_enabled=cloudwatch_metrics_enabled,
            metric_name=metric_name,
            sampled_requests_enabled=sampled_requests_enabled,
        )

        return typing.cast(None, jsii.invoke(self, "putVisibilityConfig", [value]))

    @jsii.member(jsii_name="resetCustomResponseBody")
    def reset_custom_response_body(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomResponseBody", []))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetNamePrefix")
    def reset_name_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNamePrefix", []))

    @jsii.member(jsii_name="resetRule")
    def reset_rule(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRule", []))

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
    @jsii.member(jsii_name="customResponseBody")
    def custom_response_body(self) -> "Wafv2RuleGroupCustomResponseBodyList":
        return typing.cast("Wafv2RuleGroupCustomResponseBodyList", jsii.get(self, "customResponseBody"))

    @builtins.property
    @jsii.member(jsii_name="lockToken")
    def lock_token(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lockToken"))

    @builtins.property
    @jsii.member(jsii_name="rule")
    def rule(self) -> "Wafv2RuleGroupRuleList":
        return typing.cast("Wafv2RuleGroupRuleList", jsii.get(self, "rule"))

    @builtins.property
    @jsii.member(jsii_name="visibilityConfig")
    def visibility_config(self) -> "Wafv2RuleGroupVisibilityConfigOutputReference":
        return typing.cast("Wafv2RuleGroupVisibilityConfigOutputReference", jsii.get(self, "visibilityConfig"))

    @builtins.property
    @jsii.member(jsii_name="capacityInput")
    def capacity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "capacityInput"))

    @builtins.property
    @jsii.member(jsii_name="customResponseBodyInput")
    def custom_response_body_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupCustomResponseBody"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupCustomResponseBody"]]], jsii.get(self, "customResponseBodyInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="namePrefixInput")
    def name_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "namePrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleInput")
    def rule_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRule"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRule"]]], jsii.get(self, "ruleInput"))

    @builtins.property
    @jsii.member(jsii_name="scopeInput")
    def scope_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "scopeInput"))

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
    @jsii.member(jsii_name="visibilityConfigInput")
    def visibility_config_input(
        self,
    ) -> typing.Optional["Wafv2RuleGroupVisibilityConfig"]:
        return typing.cast(typing.Optional["Wafv2RuleGroupVisibilityConfig"], jsii.get(self, "visibilityConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="capacity")
    def capacity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "capacity"))

    @capacity.setter
    def capacity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__df0113517d1c6f9c9d6f52bde141d719e8601ed0a12390fd5d7b7693d138662d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "capacity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4bb54fe4248f5f99d3c7a4b5752fc40d1f901cb6ff9c50eaab555fcaf7abb9a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1439db15a999422ede578d4591ead481f45ac859378a4c6463d232cd6a62588f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5042051da3f9f960bb494767773b460e70a1f9d5d25556416857bf425e5be3b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="namePrefix")
    def name_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "namePrefix"))

    @name_prefix.setter
    def name_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7c0a3f6b647a187bd59fe54547f46cb05aa7d2ef74301cda5b3f229e0674c815)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "namePrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="scope")
    def scope(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "scope"))

    @scope.setter
    def scope(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b4bfb6c4175282c1acccd514ed9a47bae0c400383bd6f6be7d96aabc0f96b382)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "scope", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9e0a89b5a1f60c8dc6da21956de735c05c62dddc551d199dbc47616ecc39c3a5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__31a9f98ddc12f190990226ddc957007cc92cddfeb2e946a0b8de611fd6581add)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "capacity": "capacity",
        "scope": "scope",
        "visibility_config": "visibilityConfig",
        "custom_response_body": "customResponseBody",
        "description": "description",
        "id": "id",
        "name": "name",
        "name_prefix": "namePrefix",
        "rule": "rule",
        "tags": "tags",
        "tags_all": "tagsAll",
    },
)
class Wafv2RuleGroupConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        capacity: jsii.Number,
        scope: builtins.str,
        visibility_config: typing.Union["Wafv2RuleGroupVisibilityConfig", typing.Dict[builtins.str, typing.Any]],
        custom_response_body: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupCustomResponseBody", typing.Dict[builtins.str, typing.Any]]]]] = None,
        description: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        rule: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupRule", typing.Dict[builtins.str, typing.Any]]]]] = None,
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
        :param capacity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#capacity Wafv2RuleGroup#capacity}.
        :param scope: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#scope Wafv2RuleGroup#scope}.
        :param visibility_config: visibility_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#visibility_config Wafv2RuleGroup#visibility_config}
        :param custom_response_body: custom_response_body block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_response_body Wafv2RuleGroup#custom_response_body}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#description Wafv2RuleGroup#description}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#id Wafv2RuleGroup#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name_prefix Wafv2RuleGroup#name_prefix}.
        :param rule: rule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#rule Wafv2RuleGroup#rule}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#tags Wafv2RuleGroup#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#tags_all Wafv2RuleGroup#tags_all}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(visibility_config, dict):
            visibility_config = Wafv2RuleGroupVisibilityConfig(**visibility_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd74228090b14b07b8e9dcfb502fb30ebb8fd40b797adb701a93d6d090c19ef6)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument capacity", value=capacity, expected_type=type_hints["capacity"])
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument visibility_config", value=visibility_config, expected_type=type_hints["visibility_config"])
            check_type(argname="argument custom_response_body", value=custom_response_body, expected_type=type_hints["custom_response_body"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument name_prefix", value=name_prefix, expected_type=type_hints["name_prefix"])
            check_type(argname="argument rule", value=rule, expected_type=type_hints["rule"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "capacity": capacity,
            "scope": scope,
            "visibility_config": visibility_config,
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
        if custom_response_body is not None:
            self._values["custom_response_body"] = custom_response_body
        if description is not None:
            self._values["description"] = description
        if id is not None:
            self._values["id"] = id
        if name is not None:
            self._values["name"] = name
        if name_prefix is not None:
            self._values["name_prefix"] = name_prefix
        if rule is not None:
            self._values["rule"] = rule
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
    def capacity(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#capacity Wafv2RuleGroup#capacity}.'''
        result = self._values.get("capacity")
        assert result is not None, "Required property 'capacity' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def scope(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#scope Wafv2RuleGroup#scope}.'''
        result = self._values.get("scope")
        assert result is not None, "Required property 'scope' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def visibility_config(self) -> "Wafv2RuleGroupVisibilityConfig":
        '''visibility_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#visibility_config Wafv2RuleGroup#visibility_config}
        '''
        result = self._values.get("visibility_config")
        assert result is not None, "Required property 'visibility_config' is missing"
        return typing.cast("Wafv2RuleGroupVisibilityConfig", result)

    @builtins.property
    def custom_response_body(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupCustomResponseBody"]]]:
        '''custom_response_body block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_response_body Wafv2RuleGroup#custom_response_body}
        '''
        result = self._values.get("custom_response_body")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupCustomResponseBody"]]], result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#description Wafv2RuleGroup#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#id Wafv2RuleGroup#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name_prefix Wafv2RuleGroup#name_prefix}.'''
        result = self._values.get("name_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def rule(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRule"]]]:
        '''rule block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#rule Wafv2RuleGroup#rule}
        '''
        result = self._values.get("rule")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRule"]]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#tags Wafv2RuleGroup#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#tags_all Wafv2RuleGroup#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupCustomResponseBody",
    jsii_struct_bases=[],
    name_mapping={"content": "content", "content_type": "contentType", "key": "key"},
)
class Wafv2RuleGroupCustomResponseBody:
    def __init__(
        self,
        *,
        content: builtins.str,
        content_type: builtins.str,
        key: builtins.str,
    ) -> None:
        '''
        :param content: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#content Wafv2RuleGroup#content}.
        :param content_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#content_type Wafv2RuleGroup#content_type}.
        :param key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#key Wafv2RuleGroup#key}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0608be1d354c0f226afacc40b4f533e5d28114fdcf3efea6646935e11b0d3d08)
            check_type(argname="argument content", value=content, expected_type=type_hints["content"])
            check_type(argname="argument content_type", value=content_type, expected_type=type_hints["content_type"])
            check_type(argname="argument key", value=key, expected_type=type_hints["key"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "content": content,
            "content_type": content_type,
            "key": key,
        }

    @builtins.property
    def content(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#content Wafv2RuleGroup#content}.'''
        result = self._values.get("content")
        assert result is not None, "Required property 'content' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def content_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#content_type Wafv2RuleGroup#content_type}.'''
        result = self._values.get("content_type")
        assert result is not None, "Required property 'content_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#key Wafv2RuleGroup#key}.'''
        result = self._values.get("key")
        assert result is not None, "Required property 'key' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupCustomResponseBody(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2RuleGroupCustomResponseBodyList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupCustomResponseBodyList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e5e63dbfb3005880b4299de45e4ad33481c995acba52e877ef88771c039ac73e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2RuleGroupCustomResponseBodyOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2d9a77e1828f69e824b210691951f7cf634536c5e771f2af71113c13e1fa867)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2RuleGroupCustomResponseBodyOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4497c73370345cb44ca7acb4a8840212a6247ee4a85ee93c3076321d0047cce3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b977044e3c9846e943d8aefbd399587597492bb8ccf92a7183ee62f169a82ecd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2d17e6705ed30d1638484e91dfd948d02d4000d0e597304edf987b723c065921)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupCustomResponseBody]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupCustomResponseBody]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupCustomResponseBody]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__af2614b935359776e211e94c6029418922b4622a9d27fd516e80355f489a360b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupCustomResponseBodyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupCustomResponseBodyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2379f31e6d4dbceb33275d187e618dbf07aae8a7045dda024f7b919a22b3c869)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="contentInput")
    def content_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contentInput"))

    @builtins.property
    @jsii.member(jsii_name="contentTypeInput")
    def content_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contentTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="keyInput")
    def key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "keyInput"))

    @builtins.property
    @jsii.member(jsii_name="content")
    def content(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "content"))

    @content.setter
    def content(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__651043ec15425502e9e3108e21e4a91deea8c9a11ac0f16e3890823fe0ab0ba9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "content", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="contentType")
    def content_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contentType"))

    @content_type.setter
    def content_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3789a28b8984aeba4c5de3e007bf975829fc0ad809037a30cefb17679754a44)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contentType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="key")
    def key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "key"))

    @key.setter
    def key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7fb703bd63f7ea8f8e0fb1e04f42f5848e0570a0c4138f6d302e27ea7109fd17)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "key", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupCustomResponseBody]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupCustomResponseBody]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupCustomResponseBody]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46e20fc5230bb68d0a3305783e316dce09389bf333089e2a79a594bf8a2240a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRule",
    jsii_struct_bases=[],
    name_mapping={
        "action": "action",
        "name": "name",
        "priority": "priority",
        "visibility_config": "visibilityConfig",
        "captcha_config": "captchaConfig",
        "rule_label": "ruleLabel",
        "statement": "statement",
    },
)
class Wafv2RuleGroupRule:
    def __init__(
        self,
        *,
        action: typing.Union["Wafv2RuleGroupRuleAction", typing.Dict[builtins.str, typing.Any]],
        name: builtins.str,
        priority: jsii.Number,
        visibility_config: typing.Union["Wafv2RuleGroupRuleVisibilityConfig", typing.Dict[builtins.str, typing.Any]],
        captcha_config: typing.Optional[typing.Union["Wafv2RuleGroupRuleCaptchaConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        rule_label: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupRuleRuleLabel", typing.Dict[builtins.str, typing.Any]]]]] = None,
        statement: typing.Any = None,
    ) -> None:
        '''
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#action Wafv2RuleGroup#action}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.
        :param priority: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#priority Wafv2RuleGroup#priority}.
        :param visibility_config: visibility_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#visibility_config Wafv2RuleGroup#visibility_config}
        :param captcha_config: captcha_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#captcha_config Wafv2RuleGroup#captcha_config}
        :param rule_label: rule_label block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#rule_label Wafv2RuleGroup#rule_label}
        :param statement: statement block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#statement Wafv2RuleGroup#statement}
        '''
        if isinstance(action, dict):
            action = Wafv2RuleGroupRuleAction(**action)
        if isinstance(visibility_config, dict):
            visibility_config = Wafv2RuleGroupRuleVisibilityConfig(**visibility_config)
        if isinstance(captcha_config, dict):
            captcha_config = Wafv2RuleGroupRuleCaptchaConfig(**captcha_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1133e715d51bfc51f10289ad592afc6e86fe2e000c71b6b903096cb6f4043ccc)
            check_type(argname="argument action", value=action, expected_type=type_hints["action"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument priority", value=priority, expected_type=type_hints["priority"])
            check_type(argname="argument visibility_config", value=visibility_config, expected_type=type_hints["visibility_config"])
            check_type(argname="argument captcha_config", value=captcha_config, expected_type=type_hints["captcha_config"])
            check_type(argname="argument rule_label", value=rule_label, expected_type=type_hints["rule_label"])
            check_type(argname="argument statement", value=statement, expected_type=type_hints["statement"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "action": action,
            "name": name,
            "priority": priority,
            "visibility_config": visibility_config,
        }
        if captcha_config is not None:
            self._values["captcha_config"] = captcha_config
        if rule_label is not None:
            self._values["rule_label"] = rule_label
        if statement is not None:
            self._values["statement"] = statement

    @builtins.property
    def action(self) -> "Wafv2RuleGroupRuleAction":
        '''action block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#action Wafv2RuleGroup#action}
        '''
        result = self._values.get("action")
        assert result is not None, "Required property 'action' is missing"
        return typing.cast("Wafv2RuleGroupRuleAction", result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def priority(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#priority Wafv2RuleGroup#priority}.'''
        result = self._values.get("priority")
        assert result is not None, "Required property 'priority' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def visibility_config(self) -> "Wafv2RuleGroupRuleVisibilityConfig":
        '''visibility_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#visibility_config Wafv2RuleGroup#visibility_config}
        '''
        result = self._values.get("visibility_config")
        assert result is not None, "Required property 'visibility_config' is missing"
        return typing.cast("Wafv2RuleGroupRuleVisibilityConfig", result)

    @builtins.property
    def captcha_config(self) -> typing.Optional["Wafv2RuleGroupRuleCaptchaConfig"]:
        '''captcha_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#captcha_config Wafv2RuleGroup#captcha_config}
        '''
        result = self._values.get("captcha_config")
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleCaptchaConfig"], result)

    @builtins.property
    def rule_label(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleRuleLabel"]]]:
        '''rule_label block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#rule_label Wafv2RuleGroup#rule_label}
        '''
        result = self._values.get("rule_label")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleRuleLabel"]]], result)

    @builtins.property
    def statement(self) -> typing.Any:
        '''statement block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#statement Wafv2RuleGroup#statement}
        '''
        result = self._values.get("statement")
        return typing.cast(typing.Any, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRule(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleAction",
    jsii_struct_bases=[],
    name_mapping={
        "allow": "allow",
        "block": "block",
        "captcha": "captcha",
        "challenge": "challenge",
        "count": "count",
    },
)
class Wafv2RuleGroupRuleAction:
    def __init__(
        self,
        *,
        allow: typing.Optional[typing.Union["Wafv2RuleGroupRuleActionAllow", typing.Dict[builtins.str, typing.Any]]] = None,
        block: typing.Optional[typing.Union["Wafv2RuleGroupRuleActionBlock", typing.Dict[builtins.str, typing.Any]]] = None,
        captcha: typing.Optional[typing.Union["Wafv2RuleGroupRuleActionCaptcha", typing.Dict[builtins.str, typing.Any]]] = None,
        challenge: typing.Optional[typing.Union["Wafv2RuleGroupRuleActionChallenge", typing.Dict[builtins.str, typing.Any]]] = None,
        count: typing.Optional[typing.Union["Wafv2RuleGroupRuleActionCount", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param allow: allow block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#allow Wafv2RuleGroup#allow}
        :param block: block block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#block Wafv2RuleGroup#block}
        :param captcha: captcha block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#captcha Wafv2RuleGroup#captcha}
        :param challenge: challenge block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#challenge Wafv2RuleGroup#challenge}
        :param count: count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#count Wafv2RuleGroup#count}
        '''
        if isinstance(allow, dict):
            allow = Wafv2RuleGroupRuleActionAllow(**allow)
        if isinstance(block, dict):
            block = Wafv2RuleGroupRuleActionBlock(**block)
        if isinstance(captcha, dict):
            captcha = Wafv2RuleGroupRuleActionCaptcha(**captcha)
        if isinstance(challenge, dict):
            challenge = Wafv2RuleGroupRuleActionChallenge(**challenge)
        if isinstance(count, dict):
            count = Wafv2RuleGroupRuleActionCount(**count)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2247c24ee8f520ac75788f5183a2831a8b6b0002d1c0c3e00934dbe760ec4cd9)
            check_type(argname="argument allow", value=allow, expected_type=type_hints["allow"])
            check_type(argname="argument block", value=block, expected_type=type_hints["block"])
            check_type(argname="argument captcha", value=captcha, expected_type=type_hints["captcha"])
            check_type(argname="argument challenge", value=challenge, expected_type=type_hints["challenge"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if allow is not None:
            self._values["allow"] = allow
        if block is not None:
            self._values["block"] = block
        if captcha is not None:
            self._values["captcha"] = captcha
        if challenge is not None:
            self._values["challenge"] = challenge
        if count is not None:
            self._values["count"] = count

    @builtins.property
    def allow(self) -> typing.Optional["Wafv2RuleGroupRuleActionAllow"]:
        '''allow block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#allow Wafv2RuleGroup#allow}
        '''
        result = self._values.get("allow")
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleActionAllow"], result)

    @builtins.property
    def block(self) -> typing.Optional["Wafv2RuleGroupRuleActionBlock"]:
        '''block block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#block Wafv2RuleGroup#block}
        '''
        result = self._values.get("block")
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleActionBlock"], result)

    @builtins.property
    def captcha(self) -> typing.Optional["Wafv2RuleGroupRuleActionCaptcha"]:
        '''captcha block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#captcha Wafv2RuleGroup#captcha}
        '''
        result = self._values.get("captcha")
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleActionCaptcha"], result)

    @builtins.property
    def challenge(self) -> typing.Optional["Wafv2RuleGroupRuleActionChallenge"]:
        '''challenge block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#challenge Wafv2RuleGroup#challenge}
        '''
        result = self._values.get("challenge")
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleActionChallenge"], result)

    @builtins.property
    def count(self) -> typing.Optional["Wafv2RuleGroupRuleActionCount"]:
        '''count block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#count Wafv2RuleGroup#count}
        '''
        result = self._values.get("count")
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleActionCount"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleAction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionAllow",
    jsii_struct_bases=[],
    name_mapping={"custom_request_handling": "customRequestHandling"},
)
class Wafv2RuleGroupRuleActionAllow:
    def __init__(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union["Wafv2RuleGroupRuleActionAllowCustomRequestHandling", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_request_handling Wafv2RuleGroup#custom_request_handling}
        '''
        if isinstance(custom_request_handling, dict):
            custom_request_handling = Wafv2RuleGroupRuleActionAllowCustomRequestHandling(**custom_request_handling)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a83bc14b948c0de0de744614d2daeaddbb45d2babe3dc8bbd43d625498d99053)
            check_type(argname="argument custom_request_handling", value=custom_request_handling, expected_type=type_hints["custom_request_handling"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_request_handling is not None:
            self._values["custom_request_handling"] = custom_request_handling

    @builtins.property
    def custom_request_handling(
        self,
    ) -> typing.Optional["Wafv2RuleGroupRuleActionAllowCustomRequestHandling"]:
        '''custom_request_handling block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_request_handling Wafv2RuleGroup#custom_request_handling}
        '''
        result = self._values.get("custom_request_handling")
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleActionAllowCustomRequestHandling"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionAllow(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionAllowCustomRequestHandling",
    jsii_struct_bases=[],
    name_mapping={"insert_header": "insertHeader"},
)
class Wafv2RuleGroupRuleActionAllowCustomRequestHandling:
    def __init__(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d8ef229d2a467fbcc435eac6a80f0bf56b87496dbb64dec417d7e10c9611548f)
            check_type(argname="argument insert_header", value=insert_header, expected_type=type_hints["insert_header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insert_header": insert_header,
        }

    @builtins.property
    def insert_header(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader"]]:
        '''insert_header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
        '''
        result = self._values.get("insert_header")
        assert result is not None, "Required property 'insert_header' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionAllowCustomRequestHandling(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#value Wafv2RuleGroup#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba45847c0e22322fef3bf79778daa41de65c5ed386cf4ebbbb9ce78e9f9c424e)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#value Wafv2RuleGroup#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7813302acc3c5a11637eea5bdd6a832a9e7b340087e475345f7c4a1c0066982b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf3354bf5ed23ad9130708a00f0fd4ee8cef8f4e4d10d690cd899f6518294a17)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40388df13ab70ff6c01e85ea08330afdd781cb0dec1da9fb2c9371bc2543da1e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4dd23da21e0401ca9e2b46783b61f5c27ef12f40bfe107018582291b043d9376)
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
            type_hints = typing.get_type_hints(_typecheckingstub__33371d77292017587c822ac908254a41d0f24f827ca99646e66e7e639bcead51)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__713f69cd593e9a902cb7c610d9e8683b4af6e70680546b2f195e3701bb7e4863)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6a9bb52281f7810038b730b1aa80003a1fc4b76866b3022b3f6fb286947a94d5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a37b54e5148132f227c96fbd58f3e0f344c1ae0ca6fc823185cff10440abb778)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d145becdfe6261848dc2279955f742e91fa42dfc732f1eb8232fd4a5fd7893f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6a704e05f48e95c2fdce7d78db2854b25396476925358ad215db183702de6c57)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionAllowCustomRequestHandlingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionAllowCustomRequestHandlingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e76ea1e1a29bba2656c78f0c85d8c5145d690a3e65eb9d42d3a8832194097c76)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInsertHeader")
    def put_insert_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e44063e905745c4ab285b22cb164c7294188800bd65b79beff290937c309b9d2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInsertHeader", [value]))

    @builtins.property
    @jsii.member(jsii_name="insertHeader")
    def insert_header(
        self,
    ) -> Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeaderList:
        return typing.cast(Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeaderList, jsii.get(self, "insertHeader"))

    @builtins.property
    @jsii.member(jsii_name="insertHeaderInput")
    def insert_header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader]]], jsii.get(self, "insertHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2RuleGroupRuleActionAllowCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionAllowCustomRequestHandling], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleActionAllowCustomRequestHandling],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__47440c8cc89c9fc293456980b17dedc3bea0d3c43cdad9a1ab1d3638a63aa373)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionAllowOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionAllowOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3ae71cdb454c982fd28fabfe054088ca13f0b195ff1c4ff9ca901c954d18499c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomRequestHandling")
    def put_custom_request_handling(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
        '''
        value = Wafv2RuleGroupRuleActionAllowCustomRequestHandling(
            insert_header=insert_header
        )

        return typing.cast(None, jsii.invoke(self, "putCustomRequestHandling", [value]))

    @jsii.member(jsii_name="resetCustomRequestHandling")
    def reset_custom_request_handling(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomRequestHandling", []))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandling")
    def custom_request_handling(
        self,
    ) -> Wafv2RuleGroupRuleActionAllowCustomRequestHandlingOutputReference:
        return typing.cast(Wafv2RuleGroupRuleActionAllowCustomRequestHandlingOutputReference, jsii.get(self, "customRequestHandling"))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandlingInput")
    def custom_request_handling_input(
        self,
    ) -> typing.Optional[Wafv2RuleGroupRuleActionAllowCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionAllowCustomRequestHandling], jsii.get(self, "customRequestHandlingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2RuleGroupRuleActionAllow]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionAllow], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleActionAllow],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e355d79c7bdacb22ff3ff256111943d9ef042a5e16bd59a4dd10b9888f1e6877)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionBlock",
    jsii_struct_bases=[],
    name_mapping={"custom_response": "customResponse"},
)
class Wafv2RuleGroupRuleActionBlock:
    def __init__(
        self,
        *,
        custom_response: typing.Optional[typing.Union["Wafv2RuleGroupRuleActionBlockCustomResponse", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_response: custom_response block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_response Wafv2RuleGroup#custom_response}
        '''
        if isinstance(custom_response, dict):
            custom_response = Wafv2RuleGroupRuleActionBlockCustomResponse(**custom_response)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6520ae7f171c73ffe6ae6efe6dda136341d24f8742d9cffe17c18516d679aec)
            check_type(argname="argument custom_response", value=custom_response, expected_type=type_hints["custom_response"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_response is not None:
            self._values["custom_response"] = custom_response

    @builtins.property
    def custom_response(
        self,
    ) -> typing.Optional["Wafv2RuleGroupRuleActionBlockCustomResponse"]:
        '''custom_response block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_response Wafv2RuleGroup#custom_response}
        '''
        result = self._values.get("custom_response")
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleActionBlockCustomResponse"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionBlock(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionBlockCustomResponse",
    jsii_struct_bases=[],
    name_mapping={
        "response_code": "responseCode",
        "custom_response_body_key": "customResponseBodyKey",
        "response_header": "responseHeader",
    },
)
class Wafv2RuleGroupRuleActionBlockCustomResponse:
    def __init__(
        self,
        *,
        response_code: jsii.Number,
        custom_response_body_key: typing.Optional[builtins.str] = None,
        response_header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param response_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#response_code Wafv2RuleGroup#response_code}.
        :param custom_response_body_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_response_body_key Wafv2RuleGroup#custom_response_body_key}.
        :param response_header: response_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#response_header Wafv2RuleGroup#response_header}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b94ec1f6d380a04c0d3a46b78fc67aec5e96ba7def127666213eb50759c86587)
            check_type(argname="argument response_code", value=response_code, expected_type=type_hints["response_code"])
            check_type(argname="argument custom_response_body_key", value=custom_response_body_key, expected_type=type_hints["custom_response_body_key"])
            check_type(argname="argument response_header", value=response_header, expected_type=type_hints["response_header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "response_code": response_code,
        }
        if custom_response_body_key is not None:
            self._values["custom_response_body_key"] = custom_response_body_key
        if response_header is not None:
            self._values["response_header"] = response_header

    @builtins.property
    def response_code(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#response_code Wafv2RuleGroup#response_code}.'''
        result = self._values.get("response_code")
        assert result is not None, "Required property 'response_code' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def custom_response_body_key(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_response_body_key Wafv2RuleGroup#custom_response_body_key}.'''
        result = self._values.get("custom_response_body_key")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def response_header(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader"]]]:
        '''response_header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#response_header Wafv2RuleGroup#response_header}
        '''
        result = self._values.get("response_header")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionBlockCustomResponse(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2RuleGroupRuleActionBlockCustomResponseOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionBlockCustomResponseOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6b5ddc678a4db5a8b6a84245e1554bba171b3a7241bcf932b95c01f0485e0fd5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putResponseHeader")
    def put_response_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c1693548315b5f33a687f24a4f4c5925ccbb4d8976c00035b22b629a5dc76b12)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResponseHeader", [value]))

    @jsii.member(jsii_name="resetCustomResponseBodyKey")
    def reset_custom_response_body_key(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomResponseBodyKey", []))

    @jsii.member(jsii_name="resetResponseHeader")
    def reset_response_header(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResponseHeader", []))

    @builtins.property
    @jsii.member(jsii_name="responseHeader")
    def response_header(
        self,
    ) -> "Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeaderList":
        return typing.cast("Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeaderList", jsii.get(self, "responseHeader"))

    @builtins.property
    @jsii.member(jsii_name="customResponseBodyKeyInput")
    def custom_response_body_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "customResponseBodyKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="responseCodeInput")
    def response_code_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "responseCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="responseHeaderInput")
    def response_header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader"]]], jsii.get(self, "responseHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="customResponseBodyKey")
    def custom_response_body_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "customResponseBodyKey"))

    @custom_response_body_key.setter
    def custom_response_body_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__994d5c680ecddc1a016ec1af5225312d70488ea62930ef99d84a6b2a7d677e0c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "customResponseBodyKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="responseCode")
    def response_code(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "responseCode"))

    @response_code.setter
    def response_code(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56597fcdf14742544a4a38967464de3d8c703e8e2bfc60c51c061106c2b05b92)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "responseCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2RuleGroupRuleActionBlockCustomResponse]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionBlockCustomResponse], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleActionBlockCustomResponse],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bce854418c4972c5d31711ecb9429f442ccb6cb4cfa13b09c4d904e148144f9e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#value Wafv2RuleGroup#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f0eb7cbe8225ec725da2d1bdbd68f66674440c80bf63d7de60601d834a740d34)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#value Wafv2RuleGroup#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__697ac3f4028087d1923b53804d32284152c3c7fb12251b4b9e145ffaa73c7819)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f52dc0f8fc496b91336fd43eb591c2b878a92de87ece49e488b083e60c1d965)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__552a9531819d307c8fc72abe624fae72e2121a729a19e1eb39c5652f4ac9e37d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9a1a15bf646ecb7c2862be422a2843954f70d92149c3b8ddf5ff2ff3fda25c8f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ded56bc188180c6daafa8a1b6c54f096eb535b44a21ee79948093fa4622acb30)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee5864ea2f8ff078c3c72ad0cfd4806aea99d04885db5a0efb0492809d893d2c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__33821f4a392e8b87f9c31c0c73ff75b4904cc0662eb2281e94b98915258f7b5b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d417edb2e5eeeb8081d16aeac0fb2989729c7814be61bce16806a38ec7290dd1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f6140184d38b49a2502d227a865057563d9b4effd1804c6bade112315e35497)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__529e1e6df4c326609cb5009e2965efc054fba1aaf6e6c0c37d582a2a13bb6264)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionBlockOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionBlockOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__803a814052c31fa978dca74a82bddeeb2bf9860432fa4d4310a9a4208f0f1769)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomResponse")
    def put_custom_response(
        self,
        *,
        response_code: jsii.Number,
        custom_response_body_key: typing.Optional[builtins.str] = None,
        response_header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param response_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#response_code Wafv2RuleGroup#response_code}.
        :param custom_response_body_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_response_body_key Wafv2RuleGroup#custom_response_body_key}.
        :param response_header: response_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#response_header Wafv2RuleGroup#response_header}
        '''
        value = Wafv2RuleGroupRuleActionBlockCustomResponse(
            response_code=response_code,
            custom_response_body_key=custom_response_body_key,
            response_header=response_header,
        )

        return typing.cast(None, jsii.invoke(self, "putCustomResponse", [value]))

    @jsii.member(jsii_name="resetCustomResponse")
    def reset_custom_response(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomResponse", []))

    @builtins.property
    @jsii.member(jsii_name="customResponse")
    def custom_response(
        self,
    ) -> Wafv2RuleGroupRuleActionBlockCustomResponseOutputReference:
        return typing.cast(Wafv2RuleGroupRuleActionBlockCustomResponseOutputReference, jsii.get(self, "customResponse"))

    @builtins.property
    @jsii.member(jsii_name="customResponseInput")
    def custom_response_input(
        self,
    ) -> typing.Optional[Wafv2RuleGroupRuleActionBlockCustomResponse]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionBlockCustomResponse], jsii.get(self, "customResponseInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2RuleGroupRuleActionBlock]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionBlock], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleActionBlock],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e279692592a678f0dded36dee9a940d79b5d5dcfbae7e97a10346d2f78d2b122)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCaptcha",
    jsii_struct_bases=[],
    name_mapping={"custom_request_handling": "customRequestHandling"},
)
class Wafv2RuleGroupRuleActionCaptcha:
    def __init__(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union["Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_request_handling Wafv2RuleGroup#custom_request_handling}
        '''
        if isinstance(custom_request_handling, dict):
            custom_request_handling = Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling(**custom_request_handling)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__973b36457935c4395c7ff7011f9fba3587620dd26b1c099c64341f0f23289c66)
            check_type(argname="argument custom_request_handling", value=custom_request_handling, expected_type=type_hints["custom_request_handling"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_request_handling is not None:
            self._values["custom_request_handling"] = custom_request_handling

    @builtins.property
    def custom_request_handling(
        self,
    ) -> typing.Optional["Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling"]:
        '''custom_request_handling block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_request_handling Wafv2RuleGroup#custom_request_handling}
        '''
        result = self._values.get("custom_request_handling")
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionCaptcha(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling",
    jsii_struct_bases=[],
    name_mapping={"insert_header": "insertHeader"},
)
class Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling:
    def __init__(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9045f188b5dd1ee3ef6e6297c84c453803a91b1220dab5173233c31aa3aa1b3f)
            check_type(argname="argument insert_header", value=insert_header, expected_type=type_hints["insert_header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insert_header": insert_header,
        }

    @builtins.property
    def insert_header(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader"]]:
        '''insert_header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
        '''
        result = self._values.get("insert_header")
        assert result is not None, "Required property 'insert_header' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#value Wafv2RuleGroup#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2139cb78597e5e1f05cc636e5c67ad7f245d467133152fc5f07736344b1e1a83)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#value Wafv2RuleGroup#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6bc49890c451422efe5093d9e20e5987e5ab47cc93d1707c905a2ac5aafadd63)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__98cfe94e3821b93feb2ce9767eccecddccc741a55c1187914b3a04e776ed903f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4279c0be29c9e354e3ab8e1c40ac96f29d13efd5ebc0e5d51075050b85246c01)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0ac260bc8f2d1073eda0fb4b171e29f03dfee7c151fc42944f3d6a30bb118bc0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__518e4d42c20d1729df183e8fecef232da8decbc89b36d7d27675912760405574)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e527ef344fa25c9a01bc038c4cd4c944959c453330665bd97ce2c92ef2996f10)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__af8dd9bfc35c57343b4d856e2b6d1d7fb773de5ff25cfa694b13d5cbf21a7d9c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6572ccb5378974c289681d94306e49d4163267550401621fd2a06b4cc1a71f64)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae4cf5e6a651114af630690877d01f238a8950b8644fb2e7e097768e5022a2c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4cf17379a10248ef15b5ddc6e2aac2dae6e306f7b48b18164ee8ebbe438b126c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a825cd44763d6319d61f2b09facbc006ffc8601a1b8436211a5fdbd48756150f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInsertHeader")
    def put_insert_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee57bcf0e5c00545b2c641f0555f390d2d0c66f66326ce9ad249b7a985bae202)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInsertHeader", [value]))

    @builtins.property
    @jsii.member(jsii_name="insertHeader")
    def insert_header(
        self,
    ) -> Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeaderList:
        return typing.cast(Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeaderList, jsii.get(self, "insertHeader"))

    @builtins.property
    @jsii.member(jsii_name="insertHeaderInput")
    def insert_header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader]]], jsii.get(self, "insertHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c99b13f12db285210843cac7fa04914e7e7f166dacf5b021e0561f29b65814a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionCaptchaOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCaptchaOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__88f3cdb2d8cbbd7fcd85345da2702885efd37807067bd6ea98864ac3c45f3c85)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomRequestHandling")
    def put_custom_request_handling(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
        '''
        value = Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling(
            insert_header=insert_header
        )

        return typing.cast(None, jsii.invoke(self, "putCustomRequestHandling", [value]))

    @jsii.member(jsii_name="resetCustomRequestHandling")
    def reset_custom_request_handling(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomRequestHandling", []))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandling")
    def custom_request_handling(
        self,
    ) -> Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingOutputReference:
        return typing.cast(Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingOutputReference, jsii.get(self, "customRequestHandling"))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandlingInput")
    def custom_request_handling_input(
        self,
    ) -> typing.Optional[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling], jsii.get(self, "customRequestHandlingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2RuleGroupRuleActionCaptcha]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionCaptcha], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleActionCaptcha],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1578ec33bdceb456a2ceef16381431b708da2b8d802be514ab6522f21e4098e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionChallenge",
    jsii_struct_bases=[],
    name_mapping={"custom_request_handling": "customRequestHandling"},
)
class Wafv2RuleGroupRuleActionChallenge:
    def __init__(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union["Wafv2RuleGroupRuleActionChallengeCustomRequestHandling", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_request_handling Wafv2RuleGroup#custom_request_handling}
        '''
        if isinstance(custom_request_handling, dict):
            custom_request_handling = Wafv2RuleGroupRuleActionChallengeCustomRequestHandling(**custom_request_handling)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__937170c9c4abcef32232ceebab36a853517cb25d3e641d17046c5ffef7f252e8)
            check_type(argname="argument custom_request_handling", value=custom_request_handling, expected_type=type_hints["custom_request_handling"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_request_handling is not None:
            self._values["custom_request_handling"] = custom_request_handling

    @builtins.property
    def custom_request_handling(
        self,
    ) -> typing.Optional["Wafv2RuleGroupRuleActionChallengeCustomRequestHandling"]:
        '''custom_request_handling block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_request_handling Wafv2RuleGroup#custom_request_handling}
        '''
        result = self._values.get("custom_request_handling")
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleActionChallengeCustomRequestHandling"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionChallenge(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionChallengeCustomRequestHandling",
    jsii_struct_bases=[],
    name_mapping={"insert_header": "insertHeader"},
)
class Wafv2RuleGroupRuleActionChallengeCustomRequestHandling:
    def __init__(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e18336b1168a93879553beeab2195ad755f2af397474c28e44d5924d114c39d)
            check_type(argname="argument insert_header", value=insert_header, expected_type=type_hints["insert_header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insert_header": insert_header,
        }

    @builtins.property
    def insert_header(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader"]]:
        '''insert_header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
        '''
        result = self._values.get("insert_header")
        assert result is not None, "Required property 'insert_header' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionChallengeCustomRequestHandling(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#value Wafv2RuleGroup#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5f1382ac9d49dc22a226dea59b5445a433f03410fedffaee68ff5ebc48c72c1a)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#value Wafv2RuleGroup#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5a1bb17a4deaa53a56bdc7be058d9a98fa188caae3854d6f9fcb1cf5b3948809)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__55cf2f3eeaa7d4a3cd6f1ad389e7f0689c04e0eb8b208613daa5c6f34ef092f7)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed4bf14caf06c392d5ce13718215e4dcb7624a13ceaab6a1a4e0a8f83be52e23)
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
            type_hints = typing.get_type_hints(_typecheckingstub__94ccf342a5ab7e233017c2da084db51043587b98dfa74ce49ca1279578bb6064)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a03a33dc03ada14aa3601c60ae0394506401e19f3f77f22c478cc08689035769)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c69a3da29a4a32de082b12ed1ad4c0a31e6c300251a23d9a68b14f49706e4487)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8e607a222520812b18e84e5b7df42811775f39e45b3138987c74b57f4e3e5c9b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__74748e6b892006d181bacbbc95111a6bdabbe3807bb732969f8f2ede2ef1a8b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bc4216e65c699ad5d2d5e0e40b145463e447804ccf8344027ff7a78a3bba7995)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ef5b4fdfeda6f1eac15d5fc578a1142bd6fdf3701c33c4d8a269a3925395ef10)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a0b8afc66cf13e548e04f5a7ae9894f5bb53b50350a33d3fa6963f5feed9758c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInsertHeader")
    def put_insert_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41c1b4fecb2474a3f348927d8589054de1f9f53d190dda20bc8f5b3ee1629b94)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInsertHeader", [value]))

    @builtins.property
    @jsii.member(jsii_name="insertHeader")
    def insert_header(
        self,
    ) -> Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeaderList:
        return typing.cast(Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeaderList, jsii.get(self, "insertHeader"))

    @builtins.property
    @jsii.member(jsii_name="insertHeaderInput")
    def insert_header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader]]], jsii.get(self, "insertHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2RuleGroupRuleActionChallengeCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionChallengeCustomRequestHandling], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleActionChallengeCustomRequestHandling],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__deac3dc638bbeca013fd6799d3b0b7034c28ff8756642b395696d58b3eb9a5f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionChallengeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionChallengeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8fc756a84edb55b2845d5a7a8d257b656da4b536fa94bc4acc00c16c005fe27f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomRequestHandling")
    def put_custom_request_handling(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
        '''
        value = Wafv2RuleGroupRuleActionChallengeCustomRequestHandling(
            insert_header=insert_header
        )

        return typing.cast(None, jsii.invoke(self, "putCustomRequestHandling", [value]))

    @jsii.member(jsii_name="resetCustomRequestHandling")
    def reset_custom_request_handling(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomRequestHandling", []))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandling")
    def custom_request_handling(
        self,
    ) -> Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingOutputReference:
        return typing.cast(Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingOutputReference, jsii.get(self, "customRequestHandling"))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandlingInput")
    def custom_request_handling_input(
        self,
    ) -> typing.Optional[Wafv2RuleGroupRuleActionChallengeCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionChallengeCustomRequestHandling], jsii.get(self, "customRequestHandlingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2RuleGroupRuleActionChallenge]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionChallenge], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleActionChallenge],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f2b23a3e82e94470a7315a7faf32add515c55d2a22004f176465f0c06f98e823)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCount",
    jsii_struct_bases=[],
    name_mapping={"custom_request_handling": "customRequestHandling"},
)
class Wafv2RuleGroupRuleActionCount:
    def __init__(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union["Wafv2RuleGroupRuleActionCountCustomRequestHandling", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_request_handling Wafv2RuleGroup#custom_request_handling}
        '''
        if isinstance(custom_request_handling, dict):
            custom_request_handling = Wafv2RuleGroupRuleActionCountCustomRequestHandling(**custom_request_handling)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__88aa49a86a03c04a25d3a27416ed138292565e71e96090bbac0fff9ac50b9b67)
            check_type(argname="argument custom_request_handling", value=custom_request_handling, expected_type=type_hints["custom_request_handling"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_request_handling is not None:
            self._values["custom_request_handling"] = custom_request_handling

    @builtins.property
    def custom_request_handling(
        self,
    ) -> typing.Optional["Wafv2RuleGroupRuleActionCountCustomRequestHandling"]:
        '''custom_request_handling block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_request_handling Wafv2RuleGroup#custom_request_handling}
        '''
        result = self._values.get("custom_request_handling")
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleActionCountCustomRequestHandling"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionCount(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCountCustomRequestHandling",
    jsii_struct_bases=[],
    name_mapping={"insert_header": "insertHeader"},
)
class Wafv2RuleGroupRuleActionCountCustomRequestHandling:
    def __init__(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b89a45627027c240ca2a6fc465f7c7d513125e4dca5ca7591dc4ec9e1efdeb6)
            check_type(argname="argument insert_header", value=insert_header, expected_type=type_hints["insert_header"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insert_header": insert_header,
        }

    @builtins.property
    def insert_header(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader"]]:
        '''insert_header block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
        '''
        result = self._values.get("insert_header")
        assert result is not None, "Required property 'insert_header' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionCountCustomRequestHandling(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#value Wafv2RuleGroup#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d07cf8127bb198b21762de9b3f4fdbc650f3570da1079eda34424851e261b7bc)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#value Wafv2RuleGroup#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeaderList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeaderList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1e0a9ca12dd1bf8c00c2807c6a83407252851157ee058903e142c2d9483332eb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeaderOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59b2efe508c5b924ae270630853f62d98a5bfa974e83f2356d248787cf8287b4)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeaderOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed1cc775cc6a623f52e33440395df9891d049dbce74f64f330202fbec72ab401)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ca3167149ee5eafb0056ddad0ae8cfbc887751dbfac4ddf3877a62fff5758edf)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9c9f708fb61073ee74693b79e4c7adc5c95c481dad3529944b6282f774aef94d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ad7e35bca0de677ccb7e2d82cb09bc0f3b1acb977ef34bd3ac7a2725d628654)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeaderOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeaderOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0cdcdc08f4fa01d316a152af61c8c1d8776f777c049a5354b1e94d7ea2a78ee9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e4598b907745574c552e1f3d995e9c325e58b84fbc95085190a763151c6d5c9e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__66c753f0ff5e6fb3c7c1220ad79e70e5dc4f7a6d4a31cc0748fcde38f5dd471c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0903e895738cfc7a64127db52f6bfdcc01e1409ce67b099acb3f2b03371f83c3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionCountCustomRequestHandlingOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCountCustomRequestHandlingOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8ce4867d816e1094f67f3f912ea6d3d5dd24b17dce011471a25010f0e15bec23)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putInsertHeader")
    def put_insert_header(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a4dc62f090429aff13c128eb360c317705708435dcac497a926aeaa3c7468fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInsertHeader", [value]))

    @builtins.property
    @jsii.member(jsii_name="insertHeader")
    def insert_header(
        self,
    ) -> Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeaderList:
        return typing.cast(Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeaderList, jsii.get(self, "insertHeader"))

    @builtins.property
    @jsii.member(jsii_name="insertHeaderInput")
    def insert_header_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader]]], jsii.get(self, "insertHeaderInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2RuleGroupRuleActionCountCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionCountCustomRequestHandling], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleActionCountCustomRequestHandling],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b174a591305349b4d96847f780390b65fef1e116f27be4c00e59754631e9f94)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionCountOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionCountOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7a6e76191d59e4374ce9bf1b1a4e638956825dd5d24dab93bd158dbbb9c8dc3c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomRequestHandling")
    def put_custom_request_handling(
        self,
        *,
        insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param insert_header: insert_header block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#insert_header Wafv2RuleGroup#insert_header}
        '''
        value = Wafv2RuleGroupRuleActionCountCustomRequestHandling(
            insert_header=insert_header
        )

        return typing.cast(None, jsii.invoke(self, "putCustomRequestHandling", [value]))

    @jsii.member(jsii_name="resetCustomRequestHandling")
    def reset_custom_request_handling(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomRequestHandling", []))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandling")
    def custom_request_handling(
        self,
    ) -> Wafv2RuleGroupRuleActionCountCustomRequestHandlingOutputReference:
        return typing.cast(Wafv2RuleGroupRuleActionCountCustomRequestHandlingOutputReference, jsii.get(self, "customRequestHandling"))

    @builtins.property
    @jsii.member(jsii_name="customRequestHandlingInput")
    def custom_request_handling_input(
        self,
    ) -> typing.Optional[Wafv2RuleGroupRuleActionCountCustomRequestHandling]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionCountCustomRequestHandling], jsii.get(self, "customRequestHandlingInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2RuleGroupRuleActionCount]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionCount], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleActionCount],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aeb666056ca37e74d4475561a2a58654a37f01ff8dd31d251712717d193e15cc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleActionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5a883c85d1c207d3db213e52dac9fb07c3e69a797ab300c19895281ff7ab582f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAllow")
    def put_allow(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionAllowCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_request_handling Wafv2RuleGroup#custom_request_handling}
        '''
        value = Wafv2RuleGroupRuleActionAllow(
            custom_request_handling=custom_request_handling
        )

        return typing.cast(None, jsii.invoke(self, "putAllow", [value]))

    @jsii.member(jsii_name="putBlock")
    def put_block(
        self,
        *,
        custom_response: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionBlockCustomResponse, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_response: custom_response block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_response Wafv2RuleGroup#custom_response}
        '''
        value = Wafv2RuleGroupRuleActionBlock(custom_response=custom_response)

        return typing.cast(None, jsii.invoke(self, "putBlock", [value]))

    @jsii.member(jsii_name="putCaptcha")
    def put_captcha(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_request_handling Wafv2RuleGroup#custom_request_handling}
        '''
        value = Wafv2RuleGroupRuleActionCaptcha(
            custom_request_handling=custom_request_handling
        )

        return typing.cast(None, jsii.invoke(self, "putCaptcha", [value]))

    @jsii.member(jsii_name="putChallenge")
    def put_challenge(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionChallengeCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_request_handling Wafv2RuleGroup#custom_request_handling}
        '''
        value = Wafv2RuleGroupRuleActionChallenge(
            custom_request_handling=custom_request_handling
        )

        return typing.cast(None, jsii.invoke(self, "putChallenge", [value]))

    @jsii.member(jsii_name="putCount")
    def put_count(
        self,
        *,
        custom_request_handling: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionCountCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_request_handling: custom_request_handling block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#custom_request_handling Wafv2RuleGroup#custom_request_handling}
        '''
        value = Wafv2RuleGroupRuleActionCount(
            custom_request_handling=custom_request_handling
        )

        return typing.cast(None, jsii.invoke(self, "putCount", [value]))

    @jsii.member(jsii_name="resetAllow")
    def reset_allow(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllow", []))

    @jsii.member(jsii_name="resetBlock")
    def reset_block(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBlock", []))

    @jsii.member(jsii_name="resetCaptcha")
    def reset_captcha(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCaptcha", []))

    @jsii.member(jsii_name="resetChallenge")
    def reset_challenge(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetChallenge", []))

    @jsii.member(jsii_name="resetCount")
    def reset_count(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCount", []))

    @builtins.property
    @jsii.member(jsii_name="allow")
    def allow(self) -> Wafv2RuleGroupRuleActionAllowOutputReference:
        return typing.cast(Wafv2RuleGroupRuleActionAllowOutputReference, jsii.get(self, "allow"))

    @builtins.property
    @jsii.member(jsii_name="block")
    def block(self) -> Wafv2RuleGroupRuleActionBlockOutputReference:
        return typing.cast(Wafv2RuleGroupRuleActionBlockOutputReference, jsii.get(self, "block"))

    @builtins.property
    @jsii.member(jsii_name="captcha")
    def captcha(self) -> Wafv2RuleGroupRuleActionCaptchaOutputReference:
        return typing.cast(Wafv2RuleGroupRuleActionCaptchaOutputReference, jsii.get(self, "captcha"))

    @builtins.property
    @jsii.member(jsii_name="challenge")
    def challenge(self) -> Wafv2RuleGroupRuleActionChallengeOutputReference:
        return typing.cast(Wafv2RuleGroupRuleActionChallengeOutputReference, jsii.get(self, "challenge"))

    @builtins.property
    @jsii.member(jsii_name="count")
    def count(self) -> Wafv2RuleGroupRuleActionCountOutputReference:
        return typing.cast(Wafv2RuleGroupRuleActionCountOutputReference, jsii.get(self, "count"))

    @builtins.property
    @jsii.member(jsii_name="allowInput")
    def allow_input(self) -> typing.Optional[Wafv2RuleGroupRuleActionAllow]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionAllow], jsii.get(self, "allowInput"))

    @builtins.property
    @jsii.member(jsii_name="blockInput")
    def block_input(self) -> typing.Optional[Wafv2RuleGroupRuleActionBlock]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionBlock], jsii.get(self, "blockInput"))

    @builtins.property
    @jsii.member(jsii_name="captchaInput")
    def captcha_input(self) -> typing.Optional[Wafv2RuleGroupRuleActionCaptcha]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionCaptcha], jsii.get(self, "captchaInput"))

    @builtins.property
    @jsii.member(jsii_name="challengeInput")
    def challenge_input(self) -> typing.Optional[Wafv2RuleGroupRuleActionChallenge]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionChallenge], jsii.get(self, "challengeInput"))

    @builtins.property
    @jsii.member(jsii_name="countInput")
    def count_input(self) -> typing.Optional[Wafv2RuleGroupRuleActionCount]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleActionCount], jsii.get(self, "countInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2RuleGroupRuleAction]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleAction], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[Wafv2RuleGroupRuleAction]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5b002fdd73ece79bff9dc851405a976e70fdb18a7fc4643d41d50e24d3f64d5e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleCaptchaConfig",
    jsii_struct_bases=[],
    name_mapping={"immunity_time_property": "immunityTimeProperty"},
)
class Wafv2RuleGroupRuleCaptchaConfig:
    def __init__(
        self,
        *,
        immunity_time_property: typing.Optional[typing.Union["Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param immunity_time_property: immunity_time_property block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#immunity_time_property Wafv2RuleGroup#immunity_time_property}
        '''
        if isinstance(immunity_time_property, dict):
            immunity_time_property = Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty(**immunity_time_property)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84a6e59922893cae98f541d3b45a143abe86dd8a16b82cb38fc5e44b9d5e6128)
            check_type(argname="argument immunity_time_property", value=immunity_time_property, expected_type=type_hints["immunity_time_property"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if immunity_time_property is not None:
            self._values["immunity_time_property"] = immunity_time_property

    @builtins.property
    def immunity_time_property(
        self,
    ) -> typing.Optional["Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty"]:
        '''immunity_time_property block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#immunity_time_property Wafv2RuleGroup#immunity_time_property}
        '''
        result = self._values.get("immunity_time_property")
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleCaptchaConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty",
    jsii_struct_bases=[],
    name_mapping={"immunity_time": "immunityTime"},
)
class Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty:
    def __init__(self, *, immunity_time: typing.Optional[jsii.Number] = None) -> None:
        '''
        :param immunity_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#immunity_time Wafv2RuleGroup#immunity_time}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ecda29caf999eccdae7107bb28944d88dbc48960fab398cfa524f7f56414d74)
            check_type(argname="argument immunity_time", value=immunity_time, expected_type=type_hints["immunity_time"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if immunity_time is not None:
            self._values["immunity_time"] = immunity_time

    @builtins.property
    def immunity_time(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#immunity_time Wafv2RuleGroup#immunity_time}.'''
        result = self._values.get("immunity_time")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2RuleGroupRuleCaptchaConfigImmunityTimePropertyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleCaptchaConfigImmunityTimePropertyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d6759b9897b88bc2e45d3934fae278e52cba429a58fd2bc87e059196d9b9ae9b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetImmunityTime")
    def reset_immunity_time(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImmunityTime", []))

    @builtins.property
    @jsii.member(jsii_name="immunityTimeInput")
    def immunity_time_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "immunityTimeInput"))

    @builtins.property
    @jsii.member(jsii_name="immunityTime")
    def immunity_time(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "immunityTime"))

    @immunity_time.setter
    def immunity_time(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33ff441d6ce2ebf45a0f53b4848a3d0b8f4a74bf8f1bc0c2a4d8a78b3db72301)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "immunityTime", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6183b8329aa4cd800d858bbd0d6c697a382ed0be48bf54d0a13ea127b5204e10)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleCaptchaConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleCaptchaConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2680156a796a9bc0083f4dc1f0137b02f9de7d553f76e657cfd9cb2fefa81a14)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putImmunityTimeProperty")
    def put_immunity_time_property(
        self,
        *,
        immunity_time: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param immunity_time: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#immunity_time Wafv2RuleGroup#immunity_time}.
        '''
        value = Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty(
            immunity_time=immunity_time
        )

        return typing.cast(None, jsii.invoke(self, "putImmunityTimeProperty", [value]))

    @jsii.member(jsii_name="resetImmunityTimeProperty")
    def reset_immunity_time_property(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImmunityTimeProperty", []))

    @builtins.property
    @jsii.member(jsii_name="immunityTimeProperty")
    def immunity_time_property(
        self,
    ) -> Wafv2RuleGroupRuleCaptchaConfigImmunityTimePropertyOutputReference:
        return typing.cast(Wafv2RuleGroupRuleCaptchaConfigImmunityTimePropertyOutputReference, jsii.get(self, "immunityTimeProperty"))

    @builtins.property
    @jsii.member(jsii_name="immunityTimePropertyInput")
    def immunity_time_property_input(
        self,
    ) -> typing.Optional[Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty], jsii.get(self, "immunityTimePropertyInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2RuleGroupRuleCaptchaConfig]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleCaptchaConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleCaptchaConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__73088d6b97d78b893c8abb4ab6b937432261f3db3abf4c9d565657098ec82902)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__81ab7f040e0c48f7a59307445cb7c43bde70937e0bf627aa75d1424c51727d57)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "Wafv2RuleGroupRuleOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56c64289fbd91dbaebd38e0b61479a5a466e621cc32639e57ad68732a86f0ebb)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2RuleGroupRuleOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__95759c04a15a6aaea4eae9f079fa7434933b29f96f6f232ec5f76b7521e47121)
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
            type_hints = typing.get_type_hints(_typecheckingstub__83b7e0d967ffa4fec2222c8a3616c7f8c8e27fe00a4108deed77fb0561db9770)
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
            type_hints = typing.get_type_hints(_typecheckingstub__47e4adf58f02704eaa9ebe8f0d831d3bab683991e4819c137416859112d1f640)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRule]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRule]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRule]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab0c9cd39f6b405f87da6a295d126981608357323e3417150258704ff473b068)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__235bf14d0f969b831533b732f37af7dd0386d2364d09b39a954ee59e8d77695c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putAction")
    def put_action(
        self,
        *,
        allow: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionAllow, typing.Dict[builtins.str, typing.Any]]] = None,
        block: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionBlock, typing.Dict[builtins.str, typing.Any]]] = None,
        captcha: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionCaptcha, typing.Dict[builtins.str, typing.Any]]] = None,
        challenge: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionChallenge, typing.Dict[builtins.str, typing.Any]]] = None,
        count: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionCount, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param allow: allow block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#allow Wafv2RuleGroup#allow}
        :param block: block block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#block Wafv2RuleGroup#block}
        :param captcha: captcha block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#captcha Wafv2RuleGroup#captcha}
        :param challenge: challenge block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#challenge Wafv2RuleGroup#challenge}
        :param count: count block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#count Wafv2RuleGroup#count}
        '''
        value = Wafv2RuleGroupRuleAction(
            allow=allow, block=block, captcha=captcha, challenge=challenge, count=count
        )

        return typing.cast(None, jsii.invoke(self, "putAction", [value]))

    @jsii.member(jsii_name="putCaptchaConfig")
    def put_captcha_config(
        self,
        *,
        immunity_time_property: typing.Optional[typing.Union[Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param immunity_time_property: immunity_time_property block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#immunity_time_property Wafv2RuleGroup#immunity_time_property}
        '''
        value = Wafv2RuleGroupRuleCaptchaConfig(
            immunity_time_property=immunity_time_property
        )

        return typing.cast(None, jsii.invoke(self, "putCaptchaConfig", [value]))

    @jsii.member(jsii_name="putRuleLabel")
    def put_rule_label(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["Wafv2RuleGroupRuleRuleLabel", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22977dc98c04a9eb9477fb44c00939b1bd49a31274fbc8fd4f23dd7c4c5d6b6a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRuleLabel", [value]))

    @jsii.member(jsii_name="putVisibilityConfig")
    def put_visibility_config(
        self,
        *,
        cloudwatch_metrics_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        metric_name: builtins.str,
        sampled_requests_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param cloudwatch_metrics_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#cloudwatch_metrics_enabled Wafv2RuleGroup#cloudwatch_metrics_enabled}.
        :param metric_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#metric_name Wafv2RuleGroup#metric_name}.
        :param sampled_requests_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#sampled_requests_enabled Wafv2RuleGroup#sampled_requests_enabled}.
        '''
        value = Wafv2RuleGroupRuleVisibilityConfig(
            cloudwatch_metrics_enabled=cloudwatch_metrics_enabled,
            metric_name=metric_name,
            sampled_requests_enabled=sampled_requests_enabled,
        )

        return typing.cast(None, jsii.invoke(self, "putVisibilityConfig", [value]))

    @jsii.member(jsii_name="resetCaptchaConfig")
    def reset_captcha_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCaptchaConfig", []))

    @jsii.member(jsii_name="resetRuleLabel")
    def reset_rule_label(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRuleLabel", []))

    @jsii.member(jsii_name="resetStatement")
    def reset_statement(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatement", []))

    @builtins.property
    @jsii.member(jsii_name="action")
    def action(self) -> Wafv2RuleGroupRuleActionOutputReference:
        return typing.cast(Wafv2RuleGroupRuleActionOutputReference, jsii.get(self, "action"))

    @builtins.property
    @jsii.member(jsii_name="captchaConfig")
    def captcha_config(self) -> Wafv2RuleGroupRuleCaptchaConfigOutputReference:
        return typing.cast(Wafv2RuleGroupRuleCaptchaConfigOutputReference, jsii.get(self, "captchaConfig"))

    @builtins.property
    @jsii.member(jsii_name="ruleLabel")
    def rule_label(self) -> "Wafv2RuleGroupRuleRuleLabelList":
        return typing.cast("Wafv2RuleGroupRuleRuleLabelList", jsii.get(self, "ruleLabel"))

    @builtins.property
    @jsii.member(jsii_name="statementInput")
    def statement_input(self) -> typing.Any:
        return typing.cast(typing.Any, jsii.get(self, "statementInput"))

    @builtins.property
    @jsii.member(jsii_name="visibilityConfig")
    def visibility_config(self) -> "Wafv2RuleGroupRuleVisibilityConfigOutputReference":
        return typing.cast("Wafv2RuleGroupRuleVisibilityConfigOutputReference", jsii.get(self, "visibilityConfig"))

    @builtins.property
    @jsii.member(jsii_name="actionInput")
    def action_input(self) -> typing.Optional[Wafv2RuleGroupRuleAction]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleAction], jsii.get(self, "actionInput"))

    @builtins.property
    @jsii.member(jsii_name="captchaConfigInput")
    def captcha_config_input(self) -> typing.Optional[Wafv2RuleGroupRuleCaptchaConfig]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleCaptchaConfig], jsii.get(self, "captchaConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="priorityInput")
    def priority_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "priorityInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleLabelInput")
    def rule_label_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleRuleLabel"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["Wafv2RuleGroupRuleRuleLabel"]]], jsii.get(self, "ruleLabelInput"))

    @builtins.property
    @jsii.member(jsii_name="visibilityConfigInput")
    def visibility_config_input(
        self,
    ) -> typing.Optional["Wafv2RuleGroupRuleVisibilityConfig"]:
        return typing.cast(typing.Optional["Wafv2RuleGroupRuleVisibilityConfig"], jsii.get(self, "visibilityConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9e12cf8d26b104e1699963f151d0c4ec0768791c518fc65102ea14e8d0801532)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="priority")
    def priority(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "priority"))

    @priority.setter
    def priority(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__249b6e68e31d305ab0058bc6a56de83fd3d42162ff42ed7ceef8ffde3da0d694)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "priority", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="statement")
    def statement(self) -> typing.Any:
        return typing.cast(typing.Any, jsii.get(self, "statement"))

    @statement.setter
    def statement(self, value: typing.Any) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12d3ccedc0610c28b6db479dcc876fc40f0be02fd9dd996bb77e0a3acd6b62e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "statement", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRule]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRule]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRule]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0a357b056fa0da34aadb5336c49aa0b877c790fe9d2146c150ed9144e62da3f0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleRuleLabel",
    jsii_struct_bases=[],
    name_mapping={"name": "name"},
)
class Wafv2RuleGroupRuleRuleLabel:
    def __init__(self, *, name: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d7b7696c9b9ffa85098c3bc3faa41e496fbcf4fc5f7a5a708023e885323c3483)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#name Wafv2RuleGroup#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleRuleLabel(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2RuleGroupRuleRuleLabelList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleRuleLabelList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7b89a36ae4ece4331a308d503d7b69cb69ea2b6b60cf85e0f1e6fff48db2c271)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "Wafv2RuleGroupRuleRuleLabelOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec1c7aae320fe8d2c032944690f70ca370f29102c0c5afec0325103e88e667a1)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("Wafv2RuleGroupRuleRuleLabelOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24914c14dedab3335e6e245aa9c7f37d68a44f05558d7528630a267f492ec9d2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4f7206df7450cded668c67b20499db3d30ac40d5d176bf979d21431a25c788dc)
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
            type_hints = typing.get_type_hints(_typecheckingstub__da6274d202bcb81553e136f36e62e70eb9cd51982ae1493cba1677a45fc3c4d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleRuleLabel]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleRuleLabel]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleRuleLabel]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dce22679da86dbfb58b1c6050dbea4ddca9bc82b099cd9bc3ee049878ca0339f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Wafv2RuleGroupRuleRuleLabelOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleRuleLabelOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5ae5288c62940474a4f2fae6f0e1c6e38cf62b3dc347161147990b72c0e98c05)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__71385a46cfc30f1ffad18e9c8aa29ae6b8e2bfe168f8ecb1de48a641bf95e5de)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleRuleLabel]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleRuleLabel]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleRuleLabel]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c71fa3cfe5719ee34fe82211c7cbfa27b086332cae3959d29c0ca1a9fd0b932)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleVisibilityConfig",
    jsii_struct_bases=[],
    name_mapping={
        "cloudwatch_metrics_enabled": "cloudwatchMetricsEnabled",
        "metric_name": "metricName",
        "sampled_requests_enabled": "sampledRequestsEnabled",
    },
)
class Wafv2RuleGroupRuleVisibilityConfig:
    def __init__(
        self,
        *,
        cloudwatch_metrics_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        metric_name: builtins.str,
        sampled_requests_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param cloudwatch_metrics_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#cloudwatch_metrics_enabled Wafv2RuleGroup#cloudwatch_metrics_enabled}.
        :param metric_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#metric_name Wafv2RuleGroup#metric_name}.
        :param sampled_requests_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#sampled_requests_enabled Wafv2RuleGroup#sampled_requests_enabled}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ecda2a51db9621e8acea583415361a13d4fec9ac485f0ab7d4d5d7ecff6c891)
            check_type(argname="argument cloudwatch_metrics_enabled", value=cloudwatch_metrics_enabled, expected_type=type_hints["cloudwatch_metrics_enabled"])
            check_type(argname="argument metric_name", value=metric_name, expected_type=type_hints["metric_name"])
            check_type(argname="argument sampled_requests_enabled", value=sampled_requests_enabled, expected_type=type_hints["sampled_requests_enabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "cloudwatch_metrics_enabled": cloudwatch_metrics_enabled,
            "metric_name": metric_name,
            "sampled_requests_enabled": sampled_requests_enabled,
        }

    @builtins.property
    def cloudwatch_metrics_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#cloudwatch_metrics_enabled Wafv2RuleGroup#cloudwatch_metrics_enabled}.'''
        result = self._values.get("cloudwatch_metrics_enabled")
        assert result is not None, "Required property 'cloudwatch_metrics_enabled' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    @builtins.property
    def metric_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#metric_name Wafv2RuleGroup#metric_name}.'''
        result = self._values.get("metric_name")
        assert result is not None, "Required property 'metric_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def sampled_requests_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#sampled_requests_enabled Wafv2RuleGroup#sampled_requests_enabled}.'''
        result = self._values.get("sampled_requests_enabled")
        assert result is not None, "Required property 'sampled_requests_enabled' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupRuleVisibilityConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2RuleGroupRuleVisibilityConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupRuleVisibilityConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1f677be5b7d702357dbbd2b4caa8456552a003d8bc8205e28d00c90b96293491)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="cloudwatchMetricsEnabledInput")
    def cloudwatch_metrics_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "cloudwatchMetricsEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="metricNameInput")
    def metric_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "metricNameInput"))

    @builtins.property
    @jsii.member(jsii_name="sampledRequestsEnabledInput")
    def sampled_requests_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "sampledRequestsEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchMetricsEnabled")
    def cloudwatch_metrics_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "cloudwatchMetricsEnabled"))

    @cloudwatch_metrics_enabled.setter
    def cloudwatch_metrics_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__251e1ee26a878c67b80a4918d0fb74d0364bc8206d9270ef96bc2217a7cc3ec4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cloudwatchMetricsEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="metricName")
    def metric_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "metricName"))

    @metric_name.setter
    def metric_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5f4b1eac7cf43c89714f540809f42a349279b4c47a02bdf3b072a6d03d4bc887)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "metricName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sampledRequestsEnabled")
    def sampled_requests_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "sampledRequestsEnabled"))

    @sampled_requests_enabled.setter
    def sampled_requests_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4b4782688b1f7271a397e7604fd9c66f76f903180c1049ecc31e473add4d5188)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sampledRequestsEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2RuleGroupRuleVisibilityConfig]:
        return typing.cast(typing.Optional[Wafv2RuleGroupRuleVisibilityConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupRuleVisibilityConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0a8bf88ec8d90bf92b8edc4e726e5867aec8d4ddf3d52c58a2d29638acb3b6d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupVisibilityConfig",
    jsii_struct_bases=[],
    name_mapping={
        "cloudwatch_metrics_enabled": "cloudwatchMetricsEnabled",
        "metric_name": "metricName",
        "sampled_requests_enabled": "sampledRequestsEnabled",
    },
)
class Wafv2RuleGroupVisibilityConfig:
    def __init__(
        self,
        *,
        cloudwatch_metrics_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
        metric_name: builtins.str,
        sampled_requests_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param cloudwatch_metrics_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#cloudwatch_metrics_enabled Wafv2RuleGroup#cloudwatch_metrics_enabled}.
        :param metric_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#metric_name Wafv2RuleGroup#metric_name}.
        :param sampled_requests_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#sampled_requests_enabled Wafv2RuleGroup#sampled_requests_enabled}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bab0024c7fae5cadcd1e2d05ff991ac69df669674122760a4b7eaf74399d3c63)
            check_type(argname="argument cloudwatch_metrics_enabled", value=cloudwatch_metrics_enabled, expected_type=type_hints["cloudwatch_metrics_enabled"])
            check_type(argname="argument metric_name", value=metric_name, expected_type=type_hints["metric_name"])
            check_type(argname="argument sampled_requests_enabled", value=sampled_requests_enabled, expected_type=type_hints["sampled_requests_enabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "cloudwatch_metrics_enabled": cloudwatch_metrics_enabled,
            "metric_name": metric_name,
            "sampled_requests_enabled": sampled_requests_enabled,
        }

    @builtins.property
    def cloudwatch_metrics_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#cloudwatch_metrics_enabled Wafv2RuleGroup#cloudwatch_metrics_enabled}.'''
        result = self._values.get("cloudwatch_metrics_enabled")
        assert result is not None, "Required property 'cloudwatch_metrics_enabled' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    @builtins.property
    def metric_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#metric_name Wafv2RuleGroup#metric_name}.'''
        result = self._values.get("metric_name")
        assert result is not None, "Required property 'metric_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def sampled_requests_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_rule_group#sampled_requests_enabled Wafv2RuleGroup#sampled_requests_enabled}.'''
        result = self._values.get("sampled_requests_enabled")
        assert result is not None, "Required property 'sampled_requests_enabled' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Wafv2RuleGroupVisibilityConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Wafv2RuleGroupVisibilityConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.wafv2RuleGroup.Wafv2RuleGroupVisibilityConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__10dd178e0783ddd089e4f726963901d6a98524e203bb345e1aa5954edd219d83)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="cloudwatchMetricsEnabledInput")
    def cloudwatch_metrics_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "cloudwatchMetricsEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="metricNameInput")
    def metric_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "metricNameInput"))

    @builtins.property
    @jsii.member(jsii_name="sampledRequestsEnabledInput")
    def sampled_requests_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "sampledRequestsEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="cloudwatchMetricsEnabled")
    def cloudwatch_metrics_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "cloudwatchMetricsEnabled"))

    @cloudwatch_metrics_enabled.setter
    def cloudwatch_metrics_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__93b7b64ce8ec04dffa36cb48c4724ed0b2b8c255802e3e9664697d7ad1434c09)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cloudwatchMetricsEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="metricName")
    def metric_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "metricName"))

    @metric_name.setter
    def metric_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9cb44ff4de7834db8a014ace3072d274584e24b9c6322a8a844b06d3d17baf4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "metricName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sampledRequestsEnabled")
    def sampled_requests_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "sampledRequestsEnabled"))

    @sampled_requests_enabled.setter
    def sampled_requests_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec8c614855ada91ca96b1799a5df481b34f1417be87724516604b08107f1bbfe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sampledRequestsEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Wafv2RuleGroupVisibilityConfig]:
        return typing.cast(typing.Optional[Wafv2RuleGroupVisibilityConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Wafv2RuleGroupVisibilityConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c93baaa9735c098d53a3ca25401495fd2bc5557900c026231c722bc80039c5a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Wafv2RuleGroup",
    "Wafv2RuleGroupConfig",
    "Wafv2RuleGroupCustomResponseBody",
    "Wafv2RuleGroupCustomResponseBodyList",
    "Wafv2RuleGroupCustomResponseBodyOutputReference",
    "Wafv2RuleGroupRule",
    "Wafv2RuleGroupRuleAction",
    "Wafv2RuleGroupRuleActionAllow",
    "Wafv2RuleGroupRuleActionAllowCustomRequestHandling",
    "Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader",
    "Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeaderList",
    "Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeaderOutputReference",
    "Wafv2RuleGroupRuleActionAllowCustomRequestHandlingOutputReference",
    "Wafv2RuleGroupRuleActionAllowOutputReference",
    "Wafv2RuleGroupRuleActionBlock",
    "Wafv2RuleGroupRuleActionBlockCustomResponse",
    "Wafv2RuleGroupRuleActionBlockCustomResponseOutputReference",
    "Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader",
    "Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeaderList",
    "Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeaderOutputReference",
    "Wafv2RuleGroupRuleActionBlockOutputReference",
    "Wafv2RuleGroupRuleActionCaptcha",
    "Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling",
    "Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader",
    "Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeaderList",
    "Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeaderOutputReference",
    "Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingOutputReference",
    "Wafv2RuleGroupRuleActionCaptchaOutputReference",
    "Wafv2RuleGroupRuleActionChallenge",
    "Wafv2RuleGroupRuleActionChallengeCustomRequestHandling",
    "Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader",
    "Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeaderList",
    "Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeaderOutputReference",
    "Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingOutputReference",
    "Wafv2RuleGroupRuleActionChallengeOutputReference",
    "Wafv2RuleGroupRuleActionCount",
    "Wafv2RuleGroupRuleActionCountCustomRequestHandling",
    "Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader",
    "Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeaderList",
    "Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeaderOutputReference",
    "Wafv2RuleGroupRuleActionCountCustomRequestHandlingOutputReference",
    "Wafv2RuleGroupRuleActionCountOutputReference",
    "Wafv2RuleGroupRuleActionOutputReference",
    "Wafv2RuleGroupRuleCaptchaConfig",
    "Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty",
    "Wafv2RuleGroupRuleCaptchaConfigImmunityTimePropertyOutputReference",
    "Wafv2RuleGroupRuleCaptchaConfigOutputReference",
    "Wafv2RuleGroupRuleList",
    "Wafv2RuleGroupRuleOutputReference",
    "Wafv2RuleGroupRuleRuleLabel",
    "Wafv2RuleGroupRuleRuleLabelList",
    "Wafv2RuleGroupRuleRuleLabelOutputReference",
    "Wafv2RuleGroupRuleVisibilityConfig",
    "Wafv2RuleGroupRuleVisibilityConfigOutputReference",
    "Wafv2RuleGroupVisibilityConfig",
    "Wafv2RuleGroupVisibilityConfigOutputReference",
]

publication.publish()

def _typecheckingstub__92bd52c213e6a9ed94443edfeeb3d0b3b353c3d95c6ee2ba3b276c69559bb5b0(
    scope_: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    capacity: jsii.Number,
    scope: builtins.str,
    visibility_config: typing.Union[Wafv2RuleGroupVisibilityConfig, typing.Dict[builtins.str, typing.Any]],
    custom_response_body: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupCustomResponseBody, typing.Dict[builtins.str, typing.Any]]]]] = None,
    description: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    rule: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRule, typing.Dict[builtins.str, typing.Any]]]]] = None,
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

def _typecheckingstub__2accc964bcc7d4ca45fb7a2baa76e9005227b87b2bc16d4b5b86f89756fd9c87(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__721ac7b50488b91645e719258bdbcd6e40d9b6590acc70b42e89ec1f90d5ae78(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupCustomResponseBody, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e7b2fdfdff6f48f4e8a7062aef863a1d04a27828ca3d37b7de98920ae2f8383(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRule, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df0113517d1c6f9c9d6f52bde141d719e8601ed0a12390fd5d7b7693d138662d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4bb54fe4248f5f99d3c7a4b5752fc40d1f901cb6ff9c50eaab555fcaf7abb9a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1439db15a999422ede578d4591ead481f45ac859378a4c6463d232cd6a62588f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5042051da3f9f960bb494767773b460e70a1f9d5d25556416857bf425e5be3b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c0a3f6b647a187bd59fe54547f46cb05aa7d2ef74301cda5b3f229e0674c815(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b4bfb6c4175282c1acccd514ed9a47bae0c400383bd6f6be7d96aabc0f96b382(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e0a89b5a1f60c8dc6da21956de735c05c62dddc551d199dbc47616ecc39c3a5(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31a9f98ddc12f190990226ddc957007cc92cddfeb2e946a0b8de611fd6581add(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd74228090b14b07b8e9dcfb502fb30ebb8fd40b797adb701a93d6d090c19ef6(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    capacity: jsii.Number,
    scope: builtins.str,
    visibility_config: typing.Union[Wafv2RuleGroupVisibilityConfig, typing.Dict[builtins.str, typing.Any]],
    custom_response_body: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupCustomResponseBody, typing.Dict[builtins.str, typing.Any]]]]] = None,
    description: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    rule: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRule, typing.Dict[builtins.str, typing.Any]]]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0608be1d354c0f226afacc40b4f533e5d28114fdcf3efea6646935e11b0d3d08(
    *,
    content: builtins.str,
    content_type: builtins.str,
    key: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5e63dbfb3005880b4299de45e4ad33481c995acba52e877ef88771c039ac73e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2d9a77e1828f69e824b210691951f7cf634536c5e771f2af71113c13e1fa867(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4497c73370345cb44ca7acb4a8840212a6247ee4a85ee93c3076321d0047cce3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b977044e3c9846e943d8aefbd399587597492bb8ccf92a7183ee62f169a82ecd(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d17e6705ed30d1638484e91dfd948d02d4000d0e597304edf987b723c065921(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af2614b935359776e211e94c6029418922b4622a9d27fd516e80355f489a360b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupCustomResponseBody]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2379f31e6d4dbceb33275d187e618dbf07aae8a7045dda024f7b919a22b3c869(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__651043ec15425502e9e3108e21e4a91deea8c9a11ac0f16e3890823fe0ab0ba9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3789a28b8984aeba4c5de3e007bf975829fc0ad809037a30cefb17679754a44(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7fb703bd63f7ea8f8e0fb1e04f42f5848e0570a0c4138f6d302e27ea7109fd17(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46e20fc5230bb68d0a3305783e316dce09389bf333089e2a79a594bf8a2240a6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupCustomResponseBody]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1133e715d51bfc51f10289ad592afc6e86fe2e000c71b6b903096cb6f4043ccc(
    *,
    action: typing.Union[Wafv2RuleGroupRuleAction, typing.Dict[builtins.str, typing.Any]],
    name: builtins.str,
    priority: jsii.Number,
    visibility_config: typing.Union[Wafv2RuleGroupRuleVisibilityConfig, typing.Dict[builtins.str, typing.Any]],
    captcha_config: typing.Optional[typing.Union[Wafv2RuleGroupRuleCaptchaConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    rule_label: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleRuleLabel, typing.Dict[builtins.str, typing.Any]]]]] = None,
    statement: typing.Any = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2247c24ee8f520ac75788f5183a2831a8b6b0002d1c0c3e00934dbe760ec4cd9(
    *,
    allow: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionAllow, typing.Dict[builtins.str, typing.Any]]] = None,
    block: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionBlock, typing.Dict[builtins.str, typing.Any]]] = None,
    captcha: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionCaptcha, typing.Dict[builtins.str, typing.Any]]] = None,
    challenge: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionChallenge, typing.Dict[builtins.str, typing.Any]]] = None,
    count: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionCount, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a83bc14b948c0de0de744614d2daeaddbb45d2babe3dc8bbd43d625498d99053(
    *,
    custom_request_handling: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionAllowCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8ef229d2a467fbcc435eac6a80f0bf56b87496dbb64dec417d7e10c9611548f(
    *,
    insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba45847c0e22322fef3bf79778daa41de65c5ed386cf4ebbbb9ce78e9f9c424e(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7813302acc3c5a11637eea5bdd6a832a9e7b340087e475345f7c4a1c0066982b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf3354bf5ed23ad9130708a00f0fd4ee8cef8f4e4d10d690cd899f6518294a17(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40388df13ab70ff6c01e85ea08330afdd781cb0dec1da9fb2c9371bc2543da1e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4dd23da21e0401ca9e2b46783b61f5c27ef12f40bfe107018582291b043d9376(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33371d77292017587c822ac908254a41d0f24f827ca99646e66e7e639bcead51(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__713f69cd593e9a902cb7c610d9e8683b4af6e70680546b2f195e3701bb7e4863(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6a9bb52281f7810038b730b1aa80003a1fc4b76866b3022b3f6fb286947a94d5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a37b54e5148132f227c96fbd58f3e0f344c1ae0ca6fc823185cff10440abb778(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d145becdfe6261848dc2279955f742e91fa42dfc732f1eb8232fd4a5fd7893f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6a704e05f48e95c2fdce7d78db2854b25396476925358ad215db183702de6c57(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e76ea1e1a29bba2656c78f0c85d8c5145d690a3e65eb9d42d3a8832194097c76(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e44063e905745c4ab285b22cb164c7294188800bd65b79beff290937c309b9d2(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__47440c8cc89c9fc293456980b17dedc3bea0d3c43cdad9a1ab1d3638a63aa373(
    value: typing.Optional[Wafv2RuleGroupRuleActionAllowCustomRequestHandling],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ae71cdb454c982fd28fabfe054088ca13f0b195ff1c4ff9ca901c954d18499c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e355d79c7bdacb22ff3ff256111943d9ef042a5e16bd59a4dd10b9888f1e6877(
    value: typing.Optional[Wafv2RuleGroupRuleActionAllow],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6520ae7f171c73ffe6ae6efe6dda136341d24f8742d9cffe17c18516d679aec(
    *,
    custom_response: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionBlockCustomResponse, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b94ec1f6d380a04c0d3a46b78fc67aec5e96ba7def127666213eb50759c86587(
    *,
    response_code: jsii.Number,
    custom_response_body_key: typing.Optional[builtins.str] = None,
    response_header: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b5ddc678a4db5a8b6a84245e1554bba171b3a7241bcf932b95c01f0485e0fd5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1693548315b5f33a687f24a4f4c5925ccbb4d8976c00035b22b629a5dc76b12(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__994d5c680ecddc1a016ec1af5225312d70488ea62930ef99d84a6b2a7d677e0c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56597fcdf14742544a4a38967464de3d8c703e8e2bfc60c51c061106c2b05b92(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bce854418c4972c5d31711ecb9429f442ccb6cb4cfa13b09c4d904e148144f9e(
    value: typing.Optional[Wafv2RuleGroupRuleActionBlockCustomResponse],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0eb7cbe8225ec725da2d1bdbd68f66674440c80bf63d7de60601d834a740d34(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__697ac3f4028087d1923b53804d32284152c3c7fb12251b4b9e145ffaa73c7819(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f52dc0f8fc496b91336fd43eb591c2b878a92de87ece49e488b083e60c1d965(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__552a9531819d307c8fc72abe624fae72e2121a729a19e1eb39c5652f4ac9e37d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a1a15bf646ecb7c2862be422a2843954f70d92149c3b8ddf5ff2ff3fda25c8f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ded56bc188180c6daafa8a1b6c54f096eb535b44a21ee79948093fa4622acb30(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee5864ea2f8ff078c3c72ad0cfd4806aea99d04885db5a0efb0492809d893d2c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33821f4a392e8b87f9c31c0c73ff75b4904cc0662eb2281e94b98915258f7b5b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d417edb2e5eeeb8081d16aeac0fb2989729c7814be61bce16806a38ec7290dd1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f6140184d38b49a2502d227a865057563d9b4effd1804c6bade112315e35497(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__529e1e6df4c326609cb5009e2965efc054fba1aaf6e6c0c37d582a2a13bb6264(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionBlockCustomResponseResponseHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__803a814052c31fa978dca74a82bddeeb2bf9860432fa4d4310a9a4208f0f1769(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e279692592a678f0dded36dee9a940d79b5d5dcfbae7e97a10346d2f78d2b122(
    value: typing.Optional[Wafv2RuleGroupRuleActionBlock],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__973b36457935c4395c7ff7011f9fba3587620dd26b1c099c64341f0f23289c66(
    *,
    custom_request_handling: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9045f188b5dd1ee3ef6e6297c84c453803a91b1220dab5173233c31aa3aa1b3f(
    *,
    insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2139cb78597e5e1f05cc636e5c67ad7f245d467133152fc5f07736344b1e1a83(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6bc49890c451422efe5093d9e20e5987e5ab47cc93d1707c905a2ac5aafadd63(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98cfe94e3821b93feb2ce9767eccecddccc741a55c1187914b3a04e776ed903f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4279c0be29c9e354e3ab8e1c40ac96f29d13efd5ebc0e5d51075050b85246c01(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ac260bc8f2d1073eda0fb4b171e29f03dfee7c151fc42944f3d6a30bb118bc0(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__518e4d42c20d1729df183e8fecef232da8decbc89b36d7d27675912760405574(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e527ef344fa25c9a01bc038c4cd4c944959c453330665bd97ce2c92ef2996f10(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af8dd9bfc35c57343b4d856e2b6d1d7fb773de5ff25cfa694b13d5cbf21a7d9c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6572ccb5378974c289681d94306e49d4163267550401621fd2a06b4cc1a71f64(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae4cf5e6a651114af630690877d01f238a8950b8644fb2e7e097768e5022a2c1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4cf17379a10248ef15b5ddc6e2aac2dae6e306f7b48b18164ee8ebbe438b126c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a825cd44763d6319d61f2b09facbc006ffc8601a1b8436211a5fdbd48756150f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee57bcf0e5c00545b2c641f0555f390d2d0c66f66326ce9ad249b7a985bae202(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c99b13f12db285210843cac7fa04914e7e7f166dacf5b021e0561f29b65814a(
    value: typing.Optional[Wafv2RuleGroupRuleActionCaptchaCustomRequestHandling],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88f3cdb2d8cbbd7fcd85345da2702885efd37807067bd6ea98864ac3c45f3c85(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1578ec33bdceb456a2ceef16381431b708da2b8d802be514ab6522f21e4098e8(
    value: typing.Optional[Wafv2RuleGroupRuleActionCaptcha],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__937170c9c4abcef32232ceebab36a853517cb25d3e641d17046c5ffef7f252e8(
    *,
    custom_request_handling: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionChallengeCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e18336b1168a93879553beeab2195ad755f2af397474c28e44d5924d114c39d(
    *,
    insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f1382ac9d49dc22a226dea59b5445a433f03410fedffaee68ff5ebc48c72c1a(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a1bb17a4deaa53a56bdc7be058d9a98fa188caae3854d6f9fcb1cf5b3948809(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__55cf2f3eeaa7d4a3cd6f1ad389e7f0689c04e0eb8b208613daa5c6f34ef092f7(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed4bf14caf06c392d5ce13718215e4dcb7624a13ceaab6a1a4e0a8f83be52e23(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94ccf342a5ab7e233017c2da084db51043587b98dfa74ce49ca1279578bb6064(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a03a33dc03ada14aa3601c60ae0394506401e19f3f77f22c478cc08689035769(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c69a3da29a4a32de082b12ed1ad4c0a31e6c300251a23d9a68b14f49706e4487(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e607a222520812b18e84e5b7df42811775f39e45b3138987c74b57f4e3e5c9b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__74748e6b892006d181bacbbc95111a6bdabbe3807bb732969f8f2ede2ef1a8b3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc4216e65c699ad5d2d5e0e40b145463e447804ccf8344027ff7a78a3bba7995(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef5b4fdfeda6f1eac15d5fc578a1142bd6fdf3701c33c4d8a269a3925395ef10(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0b8afc66cf13e548e04f5a7ae9894f5bb53b50350a33d3fa6963f5feed9758c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41c1b4fecb2474a3f348927d8589054de1f9f53d190dda20bc8f5b3ee1629b94(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__deac3dc638bbeca013fd6799d3b0b7034c28ff8756642b395696d58b3eb9a5f5(
    value: typing.Optional[Wafv2RuleGroupRuleActionChallengeCustomRequestHandling],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8fc756a84edb55b2845d5a7a8d257b656da4b536fa94bc4acc00c16c005fe27f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f2b23a3e82e94470a7315a7faf32add515c55d2a22004f176465f0c06f98e823(
    value: typing.Optional[Wafv2RuleGroupRuleActionChallenge],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88aa49a86a03c04a25d3a27416ed138292565e71e96090bbac0fff9ac50b9b67(
    *,
    custom_request_handling: typing.Optional[typing.Union[Wafv2RuleGroupRuleActionCountCustomRequestHandling, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b89a45627027c240ca2a6fc465f7c7d513125e4dca5ca7591dc4ec9e1efdeb6(
    *,
    insert_header: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d07cf8127bb198b21762de9b3f4fdbc650f3570da1079eda34424851e261b7bc(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e0a9ca12dd1bf8c00c2807c6a83407252851157ee058903e142c2d9483332eb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59b2efe508c5b924ae270630853f62d98a5bfa974e83f2356d248787cf8287b4(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed1cc775cc6a623f52e33440395df9891d049dbce74f64f330202fbec72ab401(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca3167149ee5eafb0056ddad0ae8cfbc887751dbfac4ddf3877a62fff5758edf(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c9f708fb61073ee74693b79e4c7adc5c95c481dad3529944b6282f774aef94d(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ad7e35bca0de677ccb7e2d82cb09bc0f3b1acb977ef34bd3ac7a2725d628654(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0cdcdc08f4fa01d316a152af61c8c1d8776f777c049a5354b1e94d7ea2a78ee9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e4598b907745574c552e1f3d995e9c325e58b84fbc95085190a763151c6d5c9e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__66c753f0ff5e6fb3c7c1220ad79e70e5dc4f7a6d4a31cc0748fcde38f5dd471c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0903e895738cfc7a64127db52f6bfdcc01e1409ce67b099acb3f2b03371f83c3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ce4867d816e1094f67f3f912ea6d3d5dd24b17dce011471a25010f0e15bec23(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a4dc62f090429aff13c128eb360c317705708435dcac497a926aeaa3c7468fd(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleActionCountCustomRequestHandlingInsertHeader, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b174a591305349b4d96847f780390b65fef1e116f27be4c00e59754631e9f94(
    value: typing.Optional[Wafv2RuleGroupRuleActionCountCustomRequestHandling],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7a6e76191d59e4374ce9bf1b1a4e638956825dd5d24dab93bd158dbbb9c8dc3c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aeb666056ca37e74d4475561a2a58654a37f01ff8dd31d251712717d193e15cc(
    value: typing.Optional[Wafv2RuleGroupRuleActionCount],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a883c85d1c207d3db213e52dac9fb07c3e69a797ab300c19895281ff7ab582f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b002fdd73ece79bff9dc851405a976e70fdb18a7fc4643d41d50e24d3f64d5e(
    value: typing.Optional[Wafv2RuleGroupRuleAction],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84a6e59922893cae98f541d3b45a143abe86dd8a16b82cb38fc5e44b9d5e6128(
    *,
    immunity_time_property: typing.Optional[typing.Union[Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ecda29caf999eccdae7107bb28944d88dbc48960fab398cfa524f7f56414d74(
    *,
    immunity_time: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d6759b9897b88bc2e45d3934fae278e52cba429a58fd2bc87e059196d9b9ae9b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33ff441d6ce2ebf45a0f53b4848a3d0b8f4a74bf8f1bc0c2a4d8a78b3db72301(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6183b8329aa4cd800d858bbd0d6c697a382ed0be48bf54d0a13ea127b5204e10(
    value: typing.Optional[Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2680156a796a9bc0083f4dc1f0137b02f9de7d553f76e657cfd9cb2fefa81a14(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73088d6b97d78b893c8abb4ab6b937432261f3db3abf4c9d565657098ec82902(
    value: typing.Optional[Wafv2RuleGroupRuleCaptchaConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81ab7f040e0c48f7a59307445cb7c43bde70937e0bf627aa75d1424c51727d57(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56c64289fbd91dbaebd38e0b61479a5a466e621cc32639e57ad68732a86f0ebb(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__95759c04a15a6aaea4eae9f079fa7434933b29f96f6f232ec5f76b7521e47121(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83b7e0d967ffa4fec2222c8a3616c7f8c8e27fe00a4108deed77fb0561db9770(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__47e4adf58f02704eaa9ebe8f0d831d3bab683991e4819c137416859112d1f640(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab0c9cd39f6b405f87da6a295d126981608357323e3417150258704ff473b068(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRule]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__235bf14d0f969b831533b732f37af7dd0386d2364d09b39a954ee59e8d77695c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22977dc98c04a9eb9477fb44c00939b1bd49a31274fbc8fd4f23dd7c4c5d6b6a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[Wafv2RuleGroupRuleRuleLabel, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e12cf8d26b104e1699963f151d0c4ec0768791c518fc65102ea14e8d0801532(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__249b6e68e31d305ab0058bc6a56de83fd3d42162ff42ed7ceef8ffde3da0d694(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12d3ccedc0610c28b6db479dcc876fc40f0be02fd9dd996bb77e0a3acd6b62e9(
    value: typing.Any,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a357b056fa0da34aadb5336c49aa0b877c790fe9d2146c150ed9144e62da3f0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRule]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7b7696c9b9ffa85098c3bc3faa41e496fbcf4fc5f7a5a708023e885323c3483(
    *,
    name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b89a36ae4ece4331a308d503d7b69cb69ea2b6b60cf85e0f1e6fff48db2c271(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec1c7aae320fe8d2c032944690f70ca370f29102c0c5afec0325103e88e667a1(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24914c14dedab3335e6e245aa9c7f37d68a44f05558d7528630a267f492ec9d2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f7206df7450cded668c67b20499db3d30ac40d5d176bf979d21431a25c788dc(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da6274d202bcb81553e136f36e62e70eb9cd51982ae1493cba1677a45fc3c4d9(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dce22679da86dbfb58b1c6050dbea4ddca9bc82b099cd9bc3ee049878ca0339f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[Wafv2RuleGroupRuleRuleLabel]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ae5288c62940474a4f2fae6f0e1c6e38cf62b3dc347161147990b72c0e98c05(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__71385a46cfc30f1ffad18e9c8aa29ae6b8e2bfe168f8ecb1de48a641bf95e5de(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c71fa3cfe5719ee34fe82211c7cbfa27b086332cae3959d29c0ca1a9fd0b932(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, Wafv2RuleGroupRuleRuleLabel]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ecda2a51db9621e8acea583415361a13d4fec9ac485f0ab7d4d5d7ecff6c891(
    *,
    cloudwatch_metrics_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    metric_name: builtins.str,
    sampled_requests_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f677be5b7d702357dbbd2b4caa8456552a003d8bc8205e28d00c90b96293491(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__251e1ee26a878c67b80a4918d0fb74d0364bc8206d9270ef96bc2217a7cc3ec4(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f4b1eac7cf43c89714f540809f42a349279b4c47a02bdf3b072a6d03d4bc887(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b4782688b1f7271a397e7604fd9c66f76f903180c1049ecc31e473add4d5188(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0a8bf88ec8d90bf92b8edc4e726e5867aec8d4ddf3d52c58a2d29638acb3b6d(
    value: typing.Optional[Wafv2RuleGroupRuleVisibilityConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bab0024c7fae5cadcd1e2d05ff991ac69df669674122760a4b7eaf74399d3c63(
    *,
    cloudwatch_metrics_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    metric_name: builtins.str,
    sampled_requests_enabled: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10dd178e0783ddd089e4f726963901d6a98524e203bb345e1aa5954edd219d83(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93b7b64ce8ec04dffa36cb48c4724ed0b2b8c255802e3e9664697d7ad1434c09(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9cb44ff4de7834db8a014ace3072d274584e24b9c6322a8a844b06d3d17baf4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec8c614855ada91ca96b1799a5df481b34f1417be87724516604b08107f1bbfe(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c93baaa9735c098d53a3ca25401495fd2bc5557900c026231c722bc80039c5a6(
    value: typing.Optional[Wafv2RuleGroupVisibilityConfig],
) -> None:
    """Type checking stubs"""
    pass
