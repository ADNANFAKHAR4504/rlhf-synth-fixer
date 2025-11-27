r'''
# `aws_rbin_rule`

Refer to the Terraform Registry for docs: [`aws_rbin_rule`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule).
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


class RbinRule(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rbinRule.RbinRule",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule aws_rbin_rule}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        resource_type: builtins.str,
        retention_period: typing.Union["RbinRuleRetentionPeriod", typing.Dict[builtins.str, typing.Any]],
        description: typing.Optional[builtins.str] = None,
        lock_configuration: typing.Optional[typing.Union["RbinRuleLockConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        resource_tags: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RbinRuleResourceTags", typing.Dict[builtins.str, typing.Any]]]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["RbinRuleTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule aws_rbin_rule} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param resource_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_type RbinRule#resource_type}.
        :param retention_period: retention_period block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period RbinRule#retention_period}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#description RbinRule#description}.
        :param lock_configuration: lock_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#lock_configuration RbinRule#lock_configuration}
        :param resource_tags: resource_tags block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_tags RbinRule#resource_tags}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#tags RbinRule#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#tags_all RbinRule#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#timeouts RbinRule#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cefef0bdba595621a3ac2147ab131db0fa563d65ee83109e2255fc03bf936e08)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = RbinRuleConfig(
            resource_type=resource_type,
            retention_period=retention_period,
            description=description,
            lock_configuration=lock_configuration,
            resource_tags=resource_tags,
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
        '''Generates CDKTF code for importing a RbinRule resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the RbinRule to import.
        :param import_from_id: The id of the existing RbinRule that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the RbinRule to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3667eb9f58e8db4bb8432e9b98e009a6d90ecbd6cbc570bd14a0375eda09fa6d)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putLockConfiguration")
    def put_lock_configuration(
        self,
        *,
        unlock_delay: typing.Union["RbinRuleLockConfigurationUnlockDelay", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param unlock_delay: unlock_delay block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay RbinRule#unlock_delay}
        '''
        value = RbinRuleLockConfiguration(unlock_delay=unlock_delay)

        return typing.cast(None, jsii.invoke(self, "putLockConfiguration", [value]))

    @jsii.member(jsii_name="putResourceTags")
    def put_resource_tags(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RbinRuleResourceTags", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b407b035bee2565ef5560521a1043b48a4f145cdd1406309410e08b4da3368d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceTags", [value]))

    @jsii.member(jsii_name="putRetentionPeriod")
    def put_retention_period(
        self,
        *,
        retention_period_unit: builtins.str,
        retention_period_value: jsii.Number,
    ) -> None:
        '''
        :param retention_period_unit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period_unit RbinRule#retention_period_unit}.
        :param retention_period_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period_value RbinRule#retention_period_value}.
        '''
        value = RbinRuleRetentionPeriod(
            retention_period_unit=retention_period_unit,
            retention_period_value=retention_period_value,
        )

        return typing.cast(None, jsii.invoke(self, "putRetentionPeriod", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#create RbinRule#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#delete RbinRule#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#update RbinRule#update}.
        '''
        value = RbinRuleTimeouts(create=create, delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetLockConfiguration")
    def reset_lock_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLockConfiguration", []))

    @jsii.member(jsii_name="resetResourceTags")
    def reset_resource_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceTags", []))

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
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @builtins.property
    @jsii.member(jsii_name="lockConfiguration")
    def lock_configuration(self) -> "RbinRuleLockConfigurationOutputReference":
        return typing.cast("RbinRuleLockConfigurationOutputReference", jsii.get(self, "lockConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="lockEndTime")
    def lock_end_time(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lockEndTime"))

    @builtins.property
    @jsii.member(jsii_name="lockState")
    def lock_state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lockState"))

    @builtins.property
    @jsii.member(jsii_name="resourceTags")
    def resource_tags(self) -> "RbinRuleResourceTagsList":
        return typing.cast("RbinRuleResourceTagsList", jsii.get(self, "resourceTags"))

    @builtins.property
    @jsii.member(jsii_name="retentionPeriod")
    def retention_period(self) -> "RbinRuleRetentionPeriodOutputReference":
        return typing.cast("RbinRuleRetentionPeriodOutputReference", jsii.get(self, "retentionPeriod"))

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "RbinRuleTimeoutsOutputReference":
        return typing.cast("RbinRuleTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="lockConfigurationInput")
    def lock_configuration_input(self) -> typing.Optional["RbinRuleLockConfiguration"]:
        return typing.cast(typing.Optional["RbinRuleLockConfiguration"], jsii.get(self, "lockConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTagsInput")
    def resource_tags_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RbinRuleResourceTags"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RbinRuleResourceTags"]]], jsii.get(self, "resourceTagsInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTypeInput")
    def resource_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resourceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="retentionPeriodInput")
    def retention_period_input(self) -> typing.Optional["RbinRuleRetentionPeriod"]:
        return typing.cast(typing.Optional["RbinRuleRetentionPeriod"], jsii.get(self, "retentionPeriodInput"))

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
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "RbinRuleTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "RbinRuleTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4c8a9fcbec8df1d64faeca0c83db385bef716bdce9fec77c1f3f55093550f2bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resourceType")
    def resource_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resourceType"))

    @resource_type.setter
    def resource_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b6dcf9f1c899c2d04b7c1f79280b7c5993e9ca01b29e87ff957408f1c2caa392)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2e7b966e9e8ce30facf9f988f943d915d3931c97d317f55b4f37cb0219d100c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__52c29e56b737a63f977581d95721e8dbbe2fdbef5152d391cc5cf38b3407575b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rbinRule.RbinRuleConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "resource_type": "resourceType",
        "retention_period": "retentionPeriod",
        "description": "description",
        "lock_configuration": "lockConfiguration",
        "resource_tags": "resourceTags",
        "tags": "tags",
        "tags_all": "tagsAll",
        "timeouts": "timeouts",
    },
)
class RbinRuleConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        resource_type: builtins.str,
        retention_period: typing.Union["RbinRuleRetentionPeriod", typing.Dict[builtins.str, typing.Any]],
        description: typing.Optional[builtins.str] = None,
        lock_configuration: typing.Optional[typing.Union["RbinRuleLockConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        resource_tags: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["RbinRuleResourceTags", typing.Dict[builtins.str, typing.Any]]]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["RbinRuleTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param resource_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_type RbinRule#resource_type}.
        :param retention_period: retention_period block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period RbinRule#retention_period}
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#description RbinRule#description}.
        :param lock_configuration: lock_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#lock_configuration RbinRule#lock_configuration}
        :param resource_tags: resource_tags block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_tags RbinRule#resource_tags}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#tags RbinRule#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#tags_all RbinRule#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#timeouts RbinRule#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(retention_period, dict):
            retention_period = RbinRuleRetentionPeriod(**retention_period)
        if isinstance(lock_configuration, dict):
            lock_configuration = RbinRuleLockConfiguration(**lock_configuration)
        if isinstance(timeouts, dict):
            timeouts = RbinRuleTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42dcc9435fa742d22c6d776dc55fd31d103f4aeb1ec9d86c55fca8015ea3e0d0)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument resource_type", value=resource_type, expected_type=type_hints["resource_type"])
            check_type(argname="argument retention_period", value=retention_period, expected_type=type_hints["retention_period"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument lock_configuration", value=lock_configuration, expected_type=type_hints["lock_configuration"])
            check_type(argname="argument resource_tags", value=resource_tags, expected_type=type_hints["resource_tags"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "resource_type": resource_type,
            "retention_period": retention_period,
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
        if lock_configuration is not None:
            self._values["lock_configuration"] = lock_configuration
        if resource_tags is not None:
            self._values["resource_tags"] = resource_tags
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
    def resource_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_type RbinRule#resource_type}.'''
        result = self._values.get("resource_type")
        assert result is not None, "Required property 'resource_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def retention_period(self) -> "RbinRuleRetentionPeriod":
        '''retention_period block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period RbinRule#retention_period}
        '''
        result = self._values.get("retention_period")
        assert result is not None, "Required property 'retention_period' is missing"
        return typing.cast("RbinRuleRetentionPeriod", result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#description RbinRule#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lock_configuration(self) -> typing.Optional["RbinRuleLockConfiguration"]:
        '''lock_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#lock_configuration RbinRule#lock_configuration}
        '''
        result = self._values.get("lock_configuration")
        return typing.cast(typing.Optional["RbinRuleLockConfiguration"], result)

    @builtins.property
    def resource_tags(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RbinRuleResourceTags"]]]:
        '''resource_tags block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_tags RbinRule#resource_tags}
        '''
        result = self._values.get("resource_tags")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["RbinRuleResourceTags"]]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#tags RbinRule#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#tags_all RbinRule#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["RbinRuleTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#timeouts RbinRule#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["RbinRuleTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RbinRuleConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.rbinRule.RbinRuleLockConfiguration",
    jsii_struct_bases=[],
    name_mapping={"unlock_delay": "unlockDelay"},
)
class RbinRuleLockConfiguration:
    def __init__(
        self,
        *,
        unlock_delay: typing.Union["RbinRuleLockConfigurationUnlockDelay", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param unlock_delay: unlock_delay block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay RbinRule#unlock_delay}
        '''
        if isinstance(unlock_delay, dict):
            unlock_delay = RbinRuleLockConfigurationUnlockDelay(**unlock_delay)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__015db8dddbaa7d824c5a795348eac590a18680f0be8e1dea0ce82bc02e6828cb)
            check_type(argname="argument unlock_delay", value=unlock_delay, expected_type=type_hints["unlock_delay"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "unlock_delay": unlock_delay,
        }

    @builtins.property
    def unlock_delay(self) -> "RbinRuleLockConfigurationUnlockDelay":
        '''unlock_delay block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay RbinRule#unlock_delay}
        '''
        result = self._values.get("unlock_delay")
        assert result is not None, "Required property 'unlock_delay' is missing"
        return typing.cast("RbinRuleLockConfigurationUnlockDelay", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RbinRuleLockConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RbinRuleLockConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rbinRule.RbinRuleLockConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cb86426d77ce79c130f603161c0c003475e80c7e74ed1ad0f35372b66ee6cbe3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putUnlockDelay")
    def put_unlock_delay(
        self,
        *,
        unlock_delay_unit: builtins.str,
        unlock_delay_value: jsii.Number,
    ) -> None:
        '''
        :param unlock_delay_unit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay_unit RbinRule#unlock_delay_unit}.
        :param unlock_delay_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay_value RbinRule#unlock_delay_value}.
        '''
        value = RbinRuleLockConfigurationUnlockDelay(
            unlock_delay_unit=unlock_delay_unit, unlock_delay_value=unlock_delay_value
        )

        return typing.cast(None, jsii.invoke(self, "putUnlockDelay", [value]))

    @builtins.property
    @jsii.member(jsii_name="unlockDelay")
    def unlock_delay(self) -> "RbinRuleLockConfigurationUnlockDelayOutputReference":
        return typing.cast("RbinRuleLockConfigurationUnlockDelayOutputReference", jsii.get(self, "unlockDelay"))

    @builtins.property
    @jsii.member(jsii_name="unlockDelayInput")
    def unlock_delay_input(
        self,
    ) -> typing.Optional["RbinRuleLockConfigurationUnlockDelay"]:
        return typing.cast(typing.Optional["RbinRuleLockConfigurationUnlockDelay"], jsii.get(self, "unlockDelayInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[RbinRuleLockConfiguration]:
        return typing.cast(typing.Optional[RbinRuleLockConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[RbinRuleLockConfiguration]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__92caf652be6a3fc020a122c97fad9ae6b48e9d1b837843b28f981caca5abcf25)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rbinRule.RbinRuleLockConfigurationUnlockDelay",
    jsii_struct_bases=[],
    name_mapping={
        "unlock_delay_unit": "unlockDelayUnit",
        "unlock_delay_value": "unlockDelayValue",
    },
)
class RbinRuleLockConfigurationUnlockDelay:
    def __init__(
        self,
        *,
        unlock_delay_unit: builtins.str,
        unlock_delay_value: jsii.Number,
    ) -> None:
        '''
        :param unlock_delay_unit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay_unit RbinRule#unlock_delay_unit}.
        :param unlock_delay_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay_value RbinRule#unlock_delay_value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86a15dc9af6b12046d52730d2b5ae3bfa0394cd6ea1e86a1e9728da885aceda6)
            check_type(argname="argument unlock_delay_unit", value=unlock_delay_unit, expected_type=type_hints["unlock_delay_unit"])
            check_type(argname="argument unlock_delay_value", value=unlock_delay_value, expected_type=type_hints["unlock_delay_value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "unlock_delay_unit": unlock_delay_unit,
            "unlock_delay_value": unlock_delay_value,
        }

    @builtins.property
    def unlock_delay_unit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay_unit RbinRule#unlock_delay_unit}.'''
        result = self._values.get("unlock_delay_unit")
        assert result is not None, "Required property 'unlock_delay_unit' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def unlock_delay_value(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay_value RbinRule#unlock_delay_value}.'''
        result = self._values.get("unlock_delay_value")
        assert result is not None, "Required property 'unlock_delay_value' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RbinRuleLockConfigurationUnlockDelay(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RbinRuleLockConfigurationUnlockDelayOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rbinRule.RbinRuleLockConfigurationUnlockDelayOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__34884adfcc3da1dc4e36d98a57b6241ebe23c28e065cb633047f805d60226e4f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="unlockDelayUnitInput")
    def unlock_delay_unit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "unlockDelayUnitInput"))

    @builtins.property
    @jsii.member(jsii_name="unlockDelayValueInput")
    def unlock_delay_value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "unlockDelayValueInput"))

    @builtins.property
    @jsii.member(jsii_name="unlockDelayUnit")
    def unlock_delay_unit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "unlockDelayUnit"))

    @unlock_delay_unit.setter
    def unlock_delay_unit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c2344eee950a3d65be92fe96b899e6b562bd192f45d13ec49815a0347355ad7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "unlockDelayUnit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="unlockDelayValue")
    def unlock_delay_value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "unlockDelayValue"))

    @unlock_delay_value.setter
    def unlock_delay_value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83204d66abe5944a3d4ca018ab1600527deff3d5c2cb1697742c14ee90a66eec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "unlockDelayValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[RbinRuleLockConfigurationUnlockDelay]:
        return typing.cast(typing.Optional[RbinRuleLockConfigurationUnlockDelay], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[RbinRuleLockConfigurationUnlockDelay],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f6753fb4c0155f012e695e05795a74df5426eadcd1b1a31b65c94e72602566e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rbinRule.RbinRuleResourceTags",
    jsii_struct_bases=[],
    name_mapping={
        "resource_tag_key": "resourceTagKey",
        "resource_tag_value": "resourceTagValue",
    },
)
class RbinRuleResourceTags:
    def __init__(
        self,
        *,
        resource_tag_key: builtins.str,
        resource_tag_value: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param resource_tag_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_tag_key RbinRule#resource_tag_key}.
        :param resource_tag_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_tag_value RbinRule#resource_tag_value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd81639acac391f4592fd8e5ce85113b682675284c89bf3112e24ee32c9fa39e)
            check_type(argname="argument resource_tag_key", value=resource_tag_key, expected_type=type_hints["resource_tag_key"])
            check_type(argname="argument resource_tag_value", value=resource_tag_value, expected_type=type_hints["resource_tag_value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "resource_tag_key": resource_tag_key,
        }
        if resource_tag_value is not None:
            self._values["resource_tag_value"] = resource_tag_value

    @builtins.property
    def resource_tag_key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_tag_key RbinRule#resource_tag_key}.'''
        result = self._values.get("resource_tag_key")
        assert result is not None, "Required property 'resource_tag_key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def resource_tag_value(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_tag_value RbinRule#resource_tag_value}.'''
        result = self._values.get("resource_tag_value")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RbinRuleResourceTags(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RbinRuleResourceTagsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rbinRule.RbinRuleResourceTagsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a170b4afced5954457662b25b25c680283d614d248cc43f8d06f35ad77e85102)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "RbinRuleResourceTagsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0603f492f1c1e7c501aca8c9c7eb4bdbfcbed3778fbea02e2b24edb0b93cf5a4)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("RbinRuleResourceTagsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a5718081377d2825ef2dc54acce93b533b22b8339a94571936a30b1da62daa1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2d7c28f5a68320299ea3249cda618d8079a30f713cd3d03994e34047bb2e4fe4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__456b5c3bcf48414eb9331ab38473baa675669da55d8f6458e606dba91cc788ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RbinRuleResourceTags]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RbinRuleResourceTags]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RbinRuleResourceTags]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c06d64a53bfd08ee99bda1bb2b1196b2144e75a4e59959027f9812c9e2bb700)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class RbinRuleResourceTagsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rbinRule.RbinRuleResourceTagsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__02a2e5cdedca5e97bc5ceaa940f8269fa8fc4ff0e0aa4e1f696a6ec77599297d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetResourceTagValue")
    def reset_resource_tag_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceTagValue", []))

    @builtins.property
    @jsii.member(jsii_name="resourceTagKeyInput")
    def resource_tag_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resourceTagKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTagValueInput")
    def resource_tag_value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resourceTagValueInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTagKey")
    def resource_tag_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resourceTagKey"))

    @resource_tag_key.setter
    def resource_tag_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49b7cda8b402b743e425e82d1beebd0eb1d8b34220c0598e5938a7cd6938576d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourceTagKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resourceTagValue")
    def resource_tag_value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resourceTagValue"))

    @resource_tag_value.setter
    def resource_tag_value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02ea14accba53aa3bbb6fc39f9bd492d56b27042ce4686c93eb9005e977e108a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourceTagValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RbinRuleResourceTags]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RbinRuleResourceTags]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RbinRuleResourceTags]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e0e4dd58ded8b4ddecd8d5e8cc7d9284d28ca1544d0d66d2e7c56be9a362ab5e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rbinRule.RbinRuleRetentionPeriod",
    jsii_struct_bases=[],
    name_mapping={
        "retention_period_unit": "retentionPeriodUnit",
        "retention_period_value": "retentionPeriodValue",
    },
)
class RbinRuleRetentionPeriod:
    def __init__(
        self,
        *,
        retention_period_unit: builtins.str,
        retention_period_value: jsii.Number,
    ) -> None:
        '''
        :param retention_period_unit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period_unit RbinRule#retention_period_unit}.
        :param retention_period_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period_value RbinRule#retention_period_value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aaeb3493b8a8280f77e274e96a4ecad5781a67eb2af48debbc04476456e34278)
            check_type(argname="argument retention_period_unit", value=retention_period_unit, expected_type=type_hints["retention_period_unit"])
            check_type(argname="argument retention_period_value", value=retention_period_value, expected_type=type_hints["retention_period_value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "retention_period_unit": retention_period_unit,
            "retention_period_value": retention_period_value,
        }

    @builtins.property
    def retention_period_unit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period_unit RbinRule#retention_period_unit}.'''
        result = self._values.get("retention_period_unit")
        assert result is not None, "Required property 'retention_period_unit' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def retention_period_value(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period_value RbinRule#retention_period_value}.'''
        result = self._values.get("retention_period_value")
        assert result is not None, "Required property 'retention_period_value' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RbinRuleRetentionPeriod(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RbinRuleRetentionPeriodOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rbinRule.RbinRuleRetentionPeriodOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__212d33c60830dd77433651596ca9ecdfbc87c495bc7c08ffffd2041da8ef3dc4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="retentionPeriodUnitInput")
    def retention_period_unit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "retentionPeriodUnitInput"))

    @builtins.property
    @jsii.member(jsii_name="retentionPeriodValueInput")
    def retention_period_value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "retentionPeriodValueInput"))

    @builtins.property
    @jsii.member(jsii_name="retentionPeriodUnit")
    def retention_period_unit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "retentionPeriodUnit"))

    @retention_period_unit.setter
    def retention_period_unit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cbea62663d98c138811c013b95b87d541ad445fbe0b56261d92a8a031df8cadf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "retentionPeriodUnit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="retentionPeriodValue")
    def retention_period_value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "retentionPeriodValue"))

    @retention_period_value.setter
    def retention_period_value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__71af503c32a0ed9fb4703b770fb90e344a9d6b5616a2c59d205fe922474b2d85)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "retentionPeriodValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[RbinRuleRetentionPeriod]:
        return typing.cast(typing.Optional[RbinRuleRetentionPeriod], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[RbinRuleRetentionPeriod]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3db59159684b6473536d31cfd90ef7907322c44ebe1d13066a495b04e53636b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.rbinRule.RbinRuleTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class RbinRuleTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#create RbinRule#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#delete RbinRule#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#update RbinRule#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__574f91b8c587923509324bc3adb158b11e8512141f7990f69f57673a728874c1)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#create RbinRule#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#delete RbinRule#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#update RbinRule#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "RbinRuleTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class RbinRuleTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.rbinRule.RbinRuleTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__df42308424e1666d77a77a32f18a15e7c774ecb804c38406b160a19240075019)
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
            type_hints = typing.get_type_hints(_typecheckingstub__282fbe3caacc4bfc8d69b9b8dfb58234e3967d9668a0aff5c28e5533c6c1fa71)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83866b6bb82c31709da258cbb192df0861929204d6aa30de590e014bc749ef45)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b02d8faf723def6ec5a129393c8cb0e113478b3f168f1b0cbe550ff6af1309aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RbinRuleTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RbinRuleTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RbinRuleTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1305a0e3c0b8053f68199f1d6f8c9fa2a831ef98a84738e4b8db306065eab346)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "RbinRule",
    "RbinRuleConfig",
    "RbinRuleLockConfiguration",
    "RbinRuleLockConfigurationOutputReference",
    "RbinRuleLockConfigurationUnlockDelay",
    "RbinRuleLockConfigurationUnlockDelayOutputReference",
    "RbinRuleResourceTags",
    "RbinRuleResourceTagsList",
    "RbinRuleResourceTagsOutputReference",
    "RbinRuleRetentionPeriod",
    "RbinRuleRetentionPeriodOutputReference",
    "RbinRuleTimeouts",
    "RbinRuleTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__cefef0bdba595621a3ac2147ab131db0fa563d65ee83109e2255fc03bf936e08(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    resource_type: builtins.str,
    retention_period: typing.Union[RbinRuleRetentionPeriod, typing.Dict[builtins.str, typing.Any]],
    description: typing.Optional[builtins.str] = None,
    lock_configuration: typing.Optional[typing.Union[RbinRuleLockConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    resource_tags: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RbinRuleResourceTags, typing.Dict[builtins.str, typing.Any]]]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[RbinRuleTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__3667eb9f58e8db4bb8432e9b98e009a6d90ecbd6cbc570bd14a0375eda09fa6d(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b407b035bee2565ef5560521a1043b48a4f145cdd1406309410e08b4da3368d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RbinRuleResourceTags, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c8a9fcbec8df1d64faeca0c83db385bef716bdce9fec77c1f3f55093550f2bf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6dcf9f1c899c2d04b7c1f79280b7c5993e9ca01b29e87ff957408f1c2caa392(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2e7b966e9e8ce30facf9f988f943d915d3931c97d317f55b4f37cb0219d100c5(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__52c29e56b737a63f977581d95721e8dbbe2fdbef5152d391cc5cf38b3407575b(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42dcc9435fa742d22c6d776dc55fd31d103f4aeb1ec9d86c55fca8015ea3e0d0(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_type: builtins.str,
    retention_period: typing.Union[RbinRuleRetentionPeriod, typing.Dict[builtins.str, typing.Any]],
    description: typing.Optional[builtins.str] = None,
    lock_configuration: typing.Optional[typing.Union[RbinRuleLockConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    resource_tags: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[RbinRuleResourceTags, typing.Dict[builtins.str, typing.Any]]]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[RbinRuleTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__015db8dddbaa7d824c5a795348eac590a18680f0be8e1dea0ce82bc02e6828cb(
    *,
    unlock_delay: typing.Union[RbinRuleLockConfigurationUnlockDelay, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb86426d77ce79c130f603161c0c003475e80c7e74ed1ad0f35372b66ee6cbe3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__92caf652be6a3fc020a122c97fad9ae6b48e9d1b837843b28f981caca5abcf25(
    value: typing.Optional[RbinRuleLockConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86a15dc9af6b12046d52730d2b5ae3bfa0394cd6ea1e86a1e9728da885aceda6(
    *,
    unlock_delay_unit: builtins.str,
    unlock_delay_value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__34884adfcc3da1dc4e36d98a57b6241ebe23c28e065cb633047f805d60226e4f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c2344eee950a3d65be92fe96b899e6b562bd192f45d13ec49815a0347355ad7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83204d66abe5944a3d4ca018ab1600527deff3d5c2cb1697742c14ee90a66eec(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f6753fb4c0155f012e695e05795a74df5426eadcd1b1a31b65c94e72602566e(
    value: typing.Optional[RbinRuleLockConfigurationUnlockDelay],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd81639acac391f4592fd8e5ce85113b682675284c89bf3112e24ee32c9fa39e(
    *,
    resource_tag_key: builtins.str,
    resource_tag_value: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a170b4afced5954457662b25b25c680283d614d248cc43f8d06f35ad77e85102(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0603f492f1c1e7c501aca8c9c7eb4bdbfcbed3778fbea02e2b24edb0b93cf5a4(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a5718081377d2825ef2dc54acce93b533b22b8339a94571936a30b1da62daa1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d7c28f5a68320299ea3249cda618d8079a30f713cd3d03994e34047bb2e4fe4(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__456b5c3bcf48414eb9331ab38473baa675669da55d8f6458e606dba91cc788ef(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c06d64a53bfd08ee99bda1bb2b1196b2144e75a4e59959027f9812c9e2bb700(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[RbinRuleResourceTags]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02a2e5cdedca5e97bc5ceaa940f8269fa8fc4ff0e0aa4e1f696a6ec77599297d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49b7cda8b402b743e425e82d1beebd0eb1d8b34220c0598e5938a7cd6938576d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02ea14accba53aa3bbb6fc39f9bd492d56b27042ce4686c93eb9005e977e108a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0e4dd58ded8b4ddecd8d5e8cc7d9284d28ca1544d0d66d2e7c56be9a362ab5e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RbinRuleResourceTags]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aaeb3493b8a8280f77e274e96a4ecad5781a67eb2af48debbc04476456e34278(
    *,
    retention_period_unit: builtins.str,
    retention_period_value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__212d33c60830dd77433651596ca9ecdfbc87c495bc7c08ffffd2041da8ef3dc4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cbea62663d98c138811c013b95b87d541ad445fbe0b56261d92a8a031df8cadf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__71af503c32a0ed9fb4703b770fb90e344a9d6b5616a2c59d205fe922474b2d85(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3db59159684b6473536d31cfd90ef7907322c44ebe1d13066a495b04e53636b4(
    value: typing.Optional[RbinRuleRetentionPeriod],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__574f91b8c587923509324bc3adb158b11e8512141f7990f69f57673a728874c1(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df42308424e1666d77a77a32f18a15e7c774ecb804c38406b160a19240075019(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__282fbe3caacc4bfc8d69b9b8dfb58234e3967d9668a0aff5c28e5533c6c1fa71(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83866b6bb82c31709da258cbb192df0861929204d6aa30de590e014bc749ef45(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b02d8faf723def6ec5a129393c8cb0e113478b3f168f1b0cbe550ff6af1309aa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1305a0e3c0b8053f68199f1d6f8c9fa2a831ef98a84738e4b8db306065eab346(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, RbinRuleTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
