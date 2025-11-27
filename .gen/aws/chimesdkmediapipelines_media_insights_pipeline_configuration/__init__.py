r'''
# `aws_chimesdkmediapipelines_media_insights_pipeline_configuration`

Refer to the Terraform Registry for docs: [`aws_chimesdkmediapipelines_media_insights_pipeline_configuration`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration).
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


class ChimesdkmediapipelinesMediaInsightsPipelineConfiguration(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfiguration",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration aws_chimesdkmediapipelines_media_insights_pipeline_configuration}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        elements: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements", typing.Dict[builtins.str, typing.Any]]]],
        name: builtins.str,
        resource_access_role_arn: builtins.str,
        real_time_alert_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration aws_chimesdkmediapipelines_media_insights_pipeline_configuration} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param elements: elements block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#elements ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#elements}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#name}.
        :param resource_access_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#resource_access_role_arn ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#resource_access_role_arn}.
        :param real_time_alert_configuration: real_time_alert_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#real_time_alert_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#real_time_alert_configuration}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#tags ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#tags_all ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#timeouts ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc4f0b848ad95628b1b00caa89f676f6897779fcb5d4fbb21a89a441d4aa4c95)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationConfig(
            elements=elements,
            name=name,
            resource_access_role_arn=resource_access_role_arn,
            real_time_alert_configuration=real_time_alert_configuration,
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
        '''Generates CDKTF code for importing a ChimesdkmediapipelinesMediaInsightsPipelineConfiguration resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the ChimesdkmediapipelinesMediaInsightsPipelineConfiguration to import.
        :param import_from_id: The id of the existing ChimesdkmediapipelinesMediaInsightsPipelineConfiguration that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the ChimesdkmediapipelinesMediaInsightsPipelineConfiguration to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7377b499ee39cff7988a5add30a555e8e306dbe549d80aeedb8087c1811627ae)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putElements")
    def put_elements(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__653a86e576baa24ece9763af2808cdf30abfc0298ef641ffd12a26a517ee2747)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putElements", [value]))

    @jsii.member(jsii_name="putRealTimeAlertConfiguration")
    def put_real_time_alert_configuration(
        self,
        *,
        rules: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules", typing.Dict[builtins.str, typing.Any]]]],
        disabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param rules: rules block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rules ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rules}
        :param disabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#disabled ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#disabled}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration(
            rules=rules, disabled=disabled
        )

        return typing.cast(None, jsii.invoke(self, "putRealTimeAlertConfiguration", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#create ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#delete ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#update ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#update}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts(
            create=create, delete=delete, update=update
        )

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetRealTimeAlertConfiguration")
    def reset_real_time_alert_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRealTimeAlertConfiguration", []))

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
    @jsii.member(jsii_name="elements")
    def elements(
        self,
    ) -> "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsList":
        return typing.cast("ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsList", jsii.get(self, "elements"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @builtins.property
    @jsii.member(jsii_name="realTimeAlertConfiguration")
    def real_time_alert_configuration(
        self,
    ) -> "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationOutputReference":
        return typing.cast("ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationOutputReference", jsii.get(self, "realTimeAlertConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(
        self,
    ) -> "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeoutsOutputReference":
        return typing.cast("ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="elementsInput")
    def elements_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements"]]], jsii.get(self, "elementsInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="realTimeAlertConfigurationInput")
    def real_time_alert_configuration_input(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration"]:
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration"], jsii.get(self, "realTimeAlertConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceAccessRoleArnInput")
    def resource_access_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resourceAccessRoleArnInput"))

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
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c38fb7a09e2a87db0b5fabab5b6b5ff3878edd9ac5dd0cd272b2a68427c3b48)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="resourceAccessRoleArn")
    def resource_access_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "resourceAccessRoleArn"))

    @resource_access_role_arn.setter
    def resource_access_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7b54dd188eff55e156ef2f5e20638b1dc901a24e2fd03aaae6e578a67035b5a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "resourceAccessRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a83fd45a831ff71cbe8027dbee22397dbddff5a7a2941c4747628a22b98fa08)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca3324cb8f46b6391960b8b96d746d0b0f3a6f26e2b1fba853a5b889097467ea)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "elements": "elements",
        "name": "name",
        "resource_access_role_arn": "resourceAccessRoleArn",
        "real_time_alert_configuration": "realTimeAlertConfiguration",
        "tags": "tags",
        "tags_all": "tagsAll",
        "timeouts": "timeouts",
    },
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationConfig(
    _cdktf_9a9027ec.TerraformMetaArguments,
):
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
        elements: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements", typing.Dict[builtins.str, typing.Any]]]],
        name: builtins.str,
        resource_access_role_arn: builtins.str,
        real_time_alert_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param elements: elements block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#elements ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#elements}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#name}.
        :param resource_access_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#resource_access_role_arn ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#resource_access_role_arn}.
        :param real_time_alert_configuration: real_time_alert_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#real_time_alert_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#real_time_alert_configuration}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#tags ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#tags_all ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#timeouts ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(real_time_alert_configuration, dict):
            real_time_alert_configuration = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration(**real_time_alert_configuration)
        if isinstance(timeouts, dict):
            timeouts = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__908048bb844acdfdef44911833483878f1eba256dc74c8e32d7d1fd4690d1ffd)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument elements", value=elements, expected_type=type_hints["elements"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument resource_access_role_arn", value=resource_access_role_arn, expected_type=type_hints["resource_access_role_arn"])
            check_type(argname="argument real_time_alert_configuration", value=real_time_alert_configuration, expected_type=type_hints["real_time_alert_configuration"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "elements": elements,
            "name": name,
            "resource_access_role_arn": resource_access_role_arn,
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
        if real_time_alert_configuration is not None:
            self._values["real_time_alert_configuration"] = real_time_alert_configuration
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
    def elements(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements"]]:
        '''elements block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#elements ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#elements}
        '''
        result = self._values.get("elements")
        assert result is not None, "Required property 'elements' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements"]], result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def resource_access_role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#resource_access_role_arn ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#resource_access_role_arn}.'''
        result = self._values.get("resource_access_role_arn")
        assert result is not None, "Required property 'resource_access_role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def real_time_alert_configuration(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration"]:
        '''real_time_alert_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#real_time_alert_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#real_time_alert_configuration}
        '''
        result = self._values.get("real_time_alert_configuration")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#tags ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#tags_all ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#timeouts ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements",
    jsii_struct_bases=[],
    name_mapping={
        "type": "type",
        "amazon_transcribe_call_analytics_processor_configuration": "amazonTranscribeCallAnalyticsProcessorConfiguration",
        "amazon_transcribe_processor_configuration": "amazonTranscribeProcessorConfiguration",
        "kinesis_data_stream_sink_configuration": "kinesisDataStreamSinkConfiguration",
        "lambda_function_sink_configuration": "lambdaFunctionSinkConfiguration",
        "s3_recording_sink_configuration": "s3RecordingSinkConfiguration",
        "sns_topic_sink_configuration": "snsTopicSinkConfiguration",
        "sqs_queue_sink_configuration": "sqsQueueSinkConfiguration",
        "voice_analytics_processor_configuration": "voiceAnalyticsProcessorConfiguration",
    },
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements:
    def __init__(
        self,
        *,
        type: builtins.str,
        amazon_transcribe_call_analytics_processor_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        amazon_transcribe_processor_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        kinesis_data_stream_sink_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        lambda_function_sink_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        s3_recording_sink_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        sns_topic_sink_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        sqs_queue_sink_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        voice_analytics_processor_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#type}.
        :param amazon_transcribe_call_analytics_processor_configuration: amazon_transcribe_call_analytics_processor_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#amazon_transcribe_call_analytics_processor_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#amazon_transcribe_call_analytics_processor_configuration}
        :param amazon_transcribe_processor_configuration: amazon_transcribe_processor_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#amazon_transcribe_processor_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#amazon_transcribe_processor_configuration}
        :param kinesis_data_stream_sink_configuration: kinesis_data_stream_sink_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#kinesis_data_stream_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#kinesis_data_stream_sink_configuration}
        :param lambda_function_sink_configuration: lambda_function_sink_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#lambda_function_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#lambda_function_sink_configuration}
        :param s3_recording_sink_configuration: s3_recording_sink_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#s3_recording_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#s3_recording_sink_configuration}
        :param sns_topic_sink_configuration: sns_topic_sink_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sns_topic_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sns_topic_sink_configuration}
        :param sqs_queue_sink_configuration: sqs_queue_sink_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sqs_queue_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sqs_queue_sink_configuration}
        :param voice_analytics_processor_configuration: voice_analytics_processor_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#voice_analytics_processor_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#voice_analytics_processor_configuration}
        '''
        if isinstance(amazon_transcribe_call_analytics_processor_configuration, dict):
            amazon_transcribe_call_analytics_processor_configuration = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration(**amazon_transcribe_call_analytics_processor_configuration)
        if isinstance(amazon_transcribe_processor_configuration, dict):
            amazon_transcribe_processor_configuration = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration(**amazon_transcribe_processor_configuration)
        if isinstance(kinesis_data_stream_sink_configuration, dict):
            kinesis_data_stream_sink_configuration = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration(**kinesis_data_stream_sink_configuration)
        if isinstance(lambda_function_sink_configuration, dict):
            lambda_function_sink_configuration = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration(**lambda_function_sink_configuration)
        if isinstance(s3_recording_sink_configuration, dict):
            s3_recording_sink_configuration = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration(**s3_recording_sink_configuration)
        if isinstance(sns_topic_sink_configuration, dict):
            sns_topic_sink_configuration = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration(**sns_topic_sink_configuration)
        if isinstance(sqs_queue_sink_configuration, dict):
            sqs_queue_sink_configuration = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration(**sqs_queue_sink_configuration)
        if isinstance(voice_analytics_processor_configuration, dict):
            voice_analytics_processor_configuration = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration(**voice_analytics_processor_configuration)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d23c07a20d0947138070d791fc9c0e34157393c1dc61404ba67da6e49336df52)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument amazon_transcribe_call_analytics_processor_configuration", value=amazon_transcribe_call_analytics_processor_configuration, expected_type=type_hints["amazon_transcribe_call_analytics_processor_configuration"])
            check_type(argname="argument amazon_transcribe_processor_configuration", value=amazon_transcribe_processor_configuration, expected_type=type_hints["amazon_transcribe_processor_configuration"])
            check_type(argname="argument kinesis_data_stream_sink_configuration", value=kinesis_data_stream_sink_configuration, expected_type=type_hints["kinesis_data_stream_sink_configuration"])
            check_type(argname="argument lambda_function_sink_configuration", value=lambda_function_sink_configuration, expected_type=type_hints["lambda_function_sink_configuration"])
            check_type(argname="argument s3_recording_sink_configuration", value=s3_recording_sink_configuration, expected_type=type_hints["s3_recording_sink_configuration"])
            check_type(argname="argument sns_topic_sink_configuration", value=sns_topic_sink_configuration, expected_type=type_hints["sns_topic_sink_configuration"])
            check_type(argname="argument sqs_queue_sink_configuration", value=sqs_queue_sink_configuration, expected_type=type_hints["sqs_queue_sink_configuration"])
            check_type(argname="argument voice_analytics_processor_configuration", value=voice_analytics_processor_configuration, expected_type=type_hints["voice_analytics_processor_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "type": type,
        }
        if amazon_transcribe_call_analytics_processor_configuration is not None:
            self._values["amazon_transcribe_call_analytics_processor_configuration"] = amazon_transcribe_call_analytics_processor_configuration
        if amazon_transcribe_processor_configuration is not None:
            self._values["amazon_transcribe_processor_configuration"] = amazon_transcribe_processor_configuration
        if kinesis_data_stream_sink_configuration is not None:
            self._values["kinesis_data_stream_sink_configuration"] = kinesis_data_stream_sink_configuration
        if lambda_function_sink_configuration is not None:
            self._values["lambda_function_sink_configuration"] = lambda_function_sink_configuration
        if s3_recording_sink_configuration is not None:
            self._values["s3_recording_sink_configuration"] = s3_recording_sink_configuration
        if sns_topic_sink_configuration is not None:
            self._values["sns_topic_sink_configuration"] = sns_topic_sink_configuration
        if sqs_queue_sink_configuration is not None:
            self._values["sqs_queue_sink_configuration"] = sqs_queue_sink_configuration
        if voice_analytics_processor_configuration is not None:
            self._values["voice_analytics_processor_configuration"] = voice_analytics_processor_configuration

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def amazon_transcribe_call_analytics_processor_configuration(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration"]:
        '''amazon_transcribe_call_analytics_processor_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#amazon_transcribe_call_analytics_processor_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#amazon_transcribe_call_analytics_processor_configuration}
        '''
        result = self._values.get("amazon_transcribe_call_analytics_processor_configuration")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration"], result)

    @builtins.property
    def amazon_transcribe_processor_configuration(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration"]:
        '''amazon_transcribe_processor_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#amazon_transcribe_processor_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#amazon_transcribe_processor_configuration}
        '''
        result = self._values.get("amazon_transcribe_processor_configuration")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration"], result)

    @builtins.property
    def kinesis_data_stream_sink_configuration(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration"]:
        '''kinesis_data_stream_sink_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#kinesis_data_stream_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#kinesis_data_stream_sink_configuration}
        '''
        result = self._values.get("kinesis_data_stream_sink_configuration")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration"], result)

    @builtins.property
    def lambda_function_sink_configuration(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration"]:
        '''lambda_function_sink_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#lambda_function_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#lambda_function_sink_configuration}
        '''
        result = self._values.get("lambda_function_sink_configuration")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration"], result)

    @builtins.property
    def s3_recording_sink_configuration(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration"]:
        '''s3_recording_sink_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#s3_recording_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#s3_recording_sink_configuration}
        '''
        result = self._values.get("s3_recording_sink_configuration")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration"], result)

    @builtins.property
    def sns_topic_sink_configuration(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration"]:
        '''sns_topic_sink_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sns_topic_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sns_topic_sink_configuration}
        '''
        result = self._values.get("sns_topic_sink_configuration")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration"], result)

    @builtins.property
    def sqs_queue_sink_configuration(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration"]:
        '''sqs_queue_sink_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sqs_queue_sink_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sqs_queue_sink_configuration}
        '''
        result = self._values.get("sqs_queue_sink_configuration")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration"], result)

    @builtins.property
    def voice_analytics_processor_configuration(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration"]:
        '''voice_analytics_processor_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#voice_analytics_processor_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#voice_analytics_processor_configuration}
        '''
        result = self._values.get("voice_analytics_processor_configuration")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "language_code": "languageCode",
        "call_analytics_stream_categories": "callAnalyticsStreamCategories",
        "content_identification_type": "contentIdentificationType",
        "content_redaction_type": "contentRedactionType",
        "enable_partial_results_stabilization": "enablePartialResultsStabilization",
        "filter_partial_results": "filterPartialResults",
        "language_model_name": "languageModelName",
        "partial_results_stability": "partialResultsStability",
        "pii_entity_types": "piiEntityTypes",
        "post_call_analytics_settings": "postCallAnalyticsSettings",
        "vocabulary_filter_method": "vocabularyFilterMethod",
        "vocabulary_filter_name": "vocabularyFilterName",
        "vocabulary_name": "vocabularyName",
    },
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration:
    def __init__(
        self,
        *,
        language_code: builtins.str,
        call_analytics_stream_categories: typing.Optional[typing.Sequence[builtins.str]] = None,
        content_identification_type: typing.Optional[builtins.str] = None,
        content_redaction_type: typing.Optional[builtins.str] = None,
        enable_partial_results_stabilization: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        filter_partial_results: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        language_model_name: typing.Optional[builtins.str] = None,
        partial_results_stability: typing.Optional[builtins.str] = None,
        pii_entity_types: typing.Optional[builtins.str] = None,
        post_call_analytics_settings: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        vocabulary_filter_method: typing.Optional[builtins.str] = None,
        vocabulary_filter_name: typing.Optional[builtins.str] = None,
        vocabulary_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param language_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_code ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_code}.
        :param call_analytics_stream_categories: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#call_analytics_stream_categories ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#call_analytics_stream_categories}.
        :param content_identification_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_identification_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_identification_type}.
        :param content_redaction_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_type}.
        :param enable_partial_results_stabilization: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#enable_partial_results_stabilization ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#enable_partial_results_stabilization}.
        :param filter_partial_results: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#filter_partial_results ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#filter_partial_results}.
        :param language_model_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_model_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_model_name}.
        :param partial_results_stability: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#partial_results_stability ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#partial_results_stability}.
        :param pii_entity_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#pii_entity_types ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#pii_entity_types}.
        :param post_call_analytics_settings: post_call_analytics_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#post_call_analytics_settings ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#post_call_analytics_settings}
        :param vocabulary_filter_method: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_method ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_method}.
        :param vocabulary_filter_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_name}.
        :param vocabulary_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_name}.
        '''
        if isinstance(post_call_analytics_settings, dict):
            post_call_analytics_settings = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings(**post_call_analytics_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d071126fc0034f8ff0adae85418b82636cd0c910fc660d5c3f40cef54ae0f4e)
            check_type(argname="argument language_code", value=language_code, expected_type=type_hints["language_code"])
            check_type(argname="argument call_analytics_stream_categories", value=call_analytics_stream_categories, expected_type=type_hints["call_analytics_stream_categories"])
            check_type(argname="argument content_identification_type", value=content_identification_type, expected_type=type_hints["content_identification_type"])
            check_type(argname="argument content_redaction_type", value=content_redaction_type, expected_type=type_hints["content_redaction_type"])
            check_type(argname="argument enable_partial_results_stabilization", value=enable_partial_results_stabilization, expected_type=type_hints["enable_partial_results_stabilization"])
            check_type(argname="argument filter_partial_results", value=filter_partial_results, expected_type=type_hints["filter_partial_results"])
            check_type(argname="argument language_model_name", value=language_model_name, expected_type=type_hints["language_model_name"])
            check_type(argname="argument partial_results_stability", value=partial_results_stability, expected_type=type_hints["partial_results_stability"])
            check_type(argname="argument pii_entity_types", value=pii_entity_types, expected_type=type_hints["pii_entity_types"])
            check_type(argname="argument post_call_analytics_settings", value=post_call_analytics_settings, expected_type=type_hints["post_call_analytics_settings"])
            check_type(argname="argument vocabulary_filter_method", value=vocabulary_filter_method, expected_type=type_hints["vocabulary_filter_method"])
            check_type(argname="argument vocabulary_filter_name", value=vocabulary_filter_name, expected_type=type_hints["vocabulary_filter_name"])
            check_type(argname="argument vocabulary_name", value=vocabulary_name, expected_type=type_hints["vocabulary_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "language_code": language_code,
        }
        if call_analytics_stream_categories is not None:
            self._values["call_analytics_stream_categories"] = call_analytics_stream_categories
        if content_identification_type is not None:
            self._values["content_identification_type"] = content_identification_type
        if content_redaction_type is not None:
            self._values["content_redaction_type"] = content_redaction_type
        if enable_partial_results_stabilization is not None:
            self._values["enable_partial_results_stabilization"] = enable_partial_results_stabilization
        if filter_partial_results is not None:
            self._values["filter_partial_results"] = filter_partial_results
        if language_model_name is not None:
            self._values["language_model_name"] = language_model_name
        if partial_results_stability is not None:
            self._values["partial_results_stability"] = partial_results_stability
        if pii_entity_types is not None:
            self._values["pii_entity_types"] = pii_entity_types
        if post_call_analytics_settings is not None:
            self._values["post_call_analytics_settings"] = post_call_analytics_settings
        if vocabulary_filter_method is not None:
            self._values["vocabulary_filter_method"] = vocabulary_filter_method
        if vocabulary_filter_name is not None:
            self._values["vocabulary_filter_name"] = vocabulary_filter_name
        if vocabulary_name is not None:
            self._values["vocabulary_name"] = vocabulary_name

    @builtins.property
    def language_code(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_code ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_code}.'''
        result = self._values.get("language_code")
        assert result is not None, "Required property 'language_code' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def call_analytics_stream_categories(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#call_analytics_stream_categories ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#call_analytics_stream_categories}.'''
        result = self._values.get("call_analytics_stream_categories")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def content_identification_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_identification_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_identification_type}.'''
        result = self._values.get("content_identification_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def content_redaction_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_type}.'''
        result = self._values.get("content_redaction_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def enable_partial_results_stabilization(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#enable_partial_results_stabilization ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#enable_partial_results_stabilization}.'''
        result = self._values.get("enable_partial_results_stabilization")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def filter_partial_results(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#filter_partial_results ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#filter_partial_results}.'''
        result = self._values.get("filter_partial_results")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def language_model_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_model_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_model_name}.'''
        result = self._values.get("language_model_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def partial_results_stability(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#partial_results_stability ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#partial_results_stability}.'''
        result = self._values.get("partial_results_stability")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def pii_entity_types(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#pii_entity_types ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#pii_entity_types}.'''
        result = self._values.get("pii_entity_types")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def post_call_analytics_settings(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings"]:
        '''post_call_analytics_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#post_call_analytics_settings ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#post_call_analytics_settings}
        '''
        result = self._values.get("post_call_analytics_settings")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings"], result)

    @builtins.property
    def vocabulary_filter_method(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_method ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_method}.'''
        result = self._values.get("vocabulary_filter_method")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def vocabulary_filter_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_name}.'''
        result = self._values.get("vocabulary_filter_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def vocabulary_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_name}.'''
        result = self._values.get("vocabulary_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ed3733ad33a4a6d050a6218845f3db9a8e84839eff83fed9e00fa9826cb72335)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putPostCallAnalyticsSettings")
    def put_post_call_analytics_settings(
        self,
        *,
        data_access_role_arn: builtins.str,
        output_location: builtins.str,
        content_redaction_output: typing.Optional[builtins.str] = None,
        output_encryption_kms_key_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param data_access_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#data_access_role_arn ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#data_access_role_arn}.
        :param output_location: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#output_location ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#output_location}.
        :param content_redaction_output: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_output ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_output}.
        :param output_encryption_kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#output_encryption_kms_key_id ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#output_encryption_kms_key_id}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings(
            data_access_role_arn=data_access_role_arn,
            output_location=output_location,
            content_redaction_output=content_redaction_output,
            output_encryption_kms_key_id=output_encryption_kms_key_id,
        )

        return typing.cast(None, jsii.invoke(self, "putPostCallAnalyticsSettings", [value]))

    @jsii.member(jsii_name="resetCallAnalyticsStreamCategories")
    def reset_call_analytics_stream_categories(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCallAnalyticsStreamCategories", []))

    @jsii.member(jsii_name="resetContentIdentificationType")
    def reset_content_identification_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContentIdentificationType", []))

    @jsii.member(jsii_name="resetContentRedactionType")
    def reset_content_redaction_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContentRedactionType", []))

    @jsii.member(jsii_name="resetEnablePartialResultsStabilization")
    def reset_enable_partial_results_stabilization(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnablePartialResultsStabilization", []))

    @jsii.member(jsii_name="resetFilterPartialResults")
    def reset_filter_partial_results(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilterPartialResults", []))

    @jsii.member(jsii_name="resetLanguageModelName")
    def reset_language_model_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLanguageModelName", []))

    @jsii.member(jsii_name="resetPartialResultsStability")
    def reset_partial_results_stability(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPartialResultsStability", []))

    @jsii.member(jsii_name="resetPiiEntityTypes")
    def reset_pii_entity_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPiiEntityTypes", []))

    @jsii.member(jsii_name="resetPostCallAnalyticsSettings")
    def reset_post_call_analytics_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPostCallAnalyticsSettings", []))

    @jsii.member(jsii_name="resetVocabularyFilterMethod")
    def reset_vocabulary_filter_method(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVocabularyFilterMethod", []))

    @jsii.member(jsii_name="resetVocabularyFilterName")
    def reset_vocabulary_filter_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVocabularyFilterName", []))

    @jsii.member(jsii_name="resetVocabularyName")
    def reset_vocabulary_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVocabularyName", []))

    @builtins.property
    @jsii.member(jsii_name="postCallAnalyticsSettings")
    def post_call_analytics_settings(
        self,
    ) -> "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettingsOutputReference":
        return typing.cast("ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettingsOutputReference", jsii.get(self, "postCallAnalyticsSettings"))

    @builtins.property
    @jsii.member(jsii_name="callAnalyticsStreamCategoriesInput")
    def call_analytics_stream_categories_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "callAnalyticsStreamCategoriesInput"))

    @builtins.property
    @jsii.member(jsii_name="contentIdentificationTypeInput")
    def content_identification_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contentIdentificationTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="contentRedactionTypeInput")
    def content_redaction_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contentRedactionTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="enablePartialResultsStabilizationInput")
    def enable_partial_results_stabilization_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enablePartialResultsStabilizationInput"))

    @builtins.property
    @jsii.member(jsii_name="filterPartialResultsInput")
    def filter_partial_results_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "filterPartialResultsInput"))

    @builtins.property
    @jsii.member(jsii_name="languageCodeInput")
    def language_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "languageCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="languageModelNameInput")
    def language_model_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "languageModelNameInput"))

    @builtins.property
    @jsii.member(jsii_name="partialResultsStabilityInput")
    def partial_results_stability_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "partialResultsStabilityInput"))

    @builtins.property
    @jsii.member(jsii_name="piiEntityTypesInput")
    def pii_entity_types_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "piiEntityTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="postCallAnalyticsSettingsInput")
    def post_call_analytics_settings_input(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings"]:
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings"], jsii.get(self, "postCallAnalyticsSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="vocabularyFilterMethodInput")
    def vocabulary_filter_method_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "vocabularyFilterMethodInput"))

    @builtins.property
    @jsii.member(jsii_name="vocabularyFilterNameInput")
    def vocabulary_filter_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "vocabularyFilterNameInput"))

    @builtins.property
    @jsii.member(jsii_name="vocabularyNameInput")
    def vocabulary_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "vocabularyNameInput"))

    @builtins.property
    @jsii.member(jsii_name="callAnalyticsStreamCategories")
    def call_analytics_stream_categories(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "callAnalyticsStreamCategories"))

    @call_analytics_stream_categories.setter
    def call_analytics_stream_categories(
        self,
        value: typing.List[builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b5cb9f5a50a3f500cbcdaaef195dfbe975b84ce74a9501d6e0992892d1e51e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "callAnalyticsStreamCategories", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="contentIdentificationType")
    def content_identification_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contentIdentificationType"))

    @content_identification_type.setter
    def content_identification_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fdbbf03fff3a5dddaec806f12cbd5644aa13859c4476ae88b888a131e87862e3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contentIdentificationType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="contentRedactionType")
    def content_redaction_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contentRedactionType"))

    @content_redaction_type.setter
    def content_redaction_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a7b0e50458d1a202f659f37769ca8e107725b15089f6f86ea743868a2dad93b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contentRedactionType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enablePartialResultsStabilization")
    def enable_partial_results_stabilization(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enablePartialResultsStabilization"))

    @enable_partial_results_stabilization.setter
    def enable_partial_results_stabilization(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__883cc9d4261920c0f1670395cc6bdc103ea8d298be7a9ff835deddf0b334de44)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enablePartialResultsStabilization", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="filterPartialResults")
    def filter_partial_results(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "filterPartialResults"))

    @filter_partial_results.setter
    def filter_partial_results(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce69554d34bdc6b6f419ac6667e755bf05cd671e5bdc2f3b87c67a57eec63304)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "filterPartialResults", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="languageCode")
    def language_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "languageCode"))

    @language_code.setter
    def language_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f456c8294e05456bdd07b0dc666a66a6dd03d74739945615e1b96ecfbfc49ef6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "languageCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="languageModelName")
    def language_model_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "languageModelName"))

    @language_model_name.setter
    def language_model_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__561b94b38730c496c57e9321c4f270189689b666ca9d0ba469f4194984cb0cef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "languageModelName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="partialResultsStability")
    def partial_results_stability(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "partialResultsStability"))

    @partial_results_stability.setter
    def partial_results_stability(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c9823223439027be82d3fe5e15bc498c8676e1adc8b990e183f695341dd2773)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "partialResultsStability", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="piiEntityTypes")
    def pii_entity_types(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "piiEntityTypes"))

    @pii_entity_types.setter
    def pii_entity_types(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bad9e1bca611742c5dde7bf379a86d60b8bd18e724e6922e77a0329d0da48856)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "piiEntityTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="vocabularyFilterMethod")
    def vocabulary_filter_method(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vocabularyFilterMethod"))

    @vocabulary_filter_method.setter
    def vocabulary_filter_method(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a47b7475991597ec0d4d50f17473c293f0f693b184bbf9cdae5357c7d5bf210)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "vocabularyFilterMethod", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="vocabularyFilterName")
    def vocabulary_filter_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vocabularyFilterName"))

    @vocabulary_filter_name.setter
    def vocabulary_filter_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__16599b6b8aefbb70eb9a10293ab74852fbc45334df25718ac5888249d0a2d0af)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "vocabularyFilterName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="vocabularyName")
    def vocabulary_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vocabularyName"))

    @vocabulary_name.setter
    def vocabulary_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46028da21fe2afdbc0ae49134c93d51b7851c59c87451808b585d9fbdac660e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "vocabularyName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__965fb7d6b0f400bc1a13d6017b11cb1f7b86903d0ece5b3625268fabf6f5eb4a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings",
    jsii_struct_bases=[],
    name_mapping={
        "data_access_role_arn": "dataAccessRoleArn",
        "output_location": "outputLocation",
        "content_redaction_output": "contentRedactionOutput",
        "output_encryption_kms_key_id": "outputEncryptionKmsKeyId",
    },
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings:
    def __init__(
        self,
        *,
        data_access_role_arn: builtins.str,
        output_location: builtins.str,
        content_redaction_output: typing.Optional[builtins.str] = None,
        output_encryption_kms_key_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param data_access_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#data_access_role_arn ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#data_access_role_arn}.
        :param output_location: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#output_location ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#output_location}.
        :param content_redaction_output: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_output ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_output}.
        :param output_encryption_kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#output_encryption_kms_key_id ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#output_encryption_kms_key_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24e80cf29d5d3c4210747524858ec4766ee34d346cbe159f970f2269b03f4f6f)
            check_type(argname="argument data_access_role_arn", value=data_access_role_arn, expected_type=type_hints["data_access_role_arn"])
            check_type(argname="argument output_location", value=output_location, expected_type=type_hints["output_location"])
            check_type(argname="argument content_redaction_output", value=content_redaction_output, expected_type=type_hints["content_redaction_output"])
            check_type(argname="argument output_encryption_kms_key_id", value=output_encryption_kms_key_id, expected_type=type_hints["output_encryption_kms_key_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "data_access_role_arn": data_access_role_arn,
            "output_location": output_location,
        }
        if content_redaction_output is not None:
            self._values["content_redaction_output"] = content_redaction_output
        if output_encryption_kms_key_id is not None:
            self._values["output_encryption_kms_key_id"] = output_encryption_kms_key_id

    @builtins.property
    def data_access_role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#data_access_role_arn ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#data_access_role_arn}.'''
        result = self._values.get("data_access_role_arn")
        assert result is not None, "Required property 'data_access_role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def output_location(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#output_location ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#output_location}.'''
        result = self._values.get("output_location")
        assert result is not None, "Required property 'output_location' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def content_redaction_output(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_output ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_output}.'''
        result = self._values.get("content_redaction_output")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def output_encryption_kms_key_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#output_encryption_kms_key_id ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#output_encryption_kms_key_id}.'''
        result = self._values.get("output_encryption_kms_key_id")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__29df0e930b2e1041ca23678b0fed9845d9be8ce46f8d6600eef270f02bbd206c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetContentRedactionOutput")
    def reset_content_redaction_output(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContentRedactionOutput", []))

    @jsii.member(jsii_name="resetOutputEncryptionKmsKeyId")
    def reset_output_encryption_kms_key_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOutputEncryptionKmsKeyId", []))

    @builtins.property
    @jsii.member(jsii_name="contentRedactionOutputInput")
    def content_redaction_output_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contentRedactionOutputInput"))

    @builtins.property
    @jsii.member(jsii_name="dataAccessRoleArnInput")
    def data_access_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataAccessRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="outputEncryptionKmsKeyIdInput")
    def output_encryption_kms_key_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "outputEncryptionKmsKeyIdInput"))

    @builtins.property
    @jsii.member(jsii_name="outputLocationInput")
    def output_location_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "outputLocationInput"))

    @builtins.property
    @jsii.member(jsii_name="contentRedactionOutput")
    def content_redaction_output(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contentRedactionOutput"))

    @content_redaction_output.setter
    def content_redaction_output(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06b9cdf2579e2fe73096c464b2706d992a805a6d2907ba5b6900c7e853106018)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contentRedactionOutput", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dataAccessRoleArn")
    def data_access_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataAccessRoleArn"))

    @data_access_role_arn.setter
    def data_access_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01b95dc34141304b23d108631a95bf9eca38e437ba256381ba30eb05bd01a5d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataAccessRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="outputEncryptionKmsKeyId")
    def output_encryption_kms_key_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "outputEncryptionKmsKeyId"))

    @output_encryption_kms_key_id.setter
    def output_encryption_kms_key_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e771bcf9276aafcba11433cf35132fd79cc3f5aef7c976f51318f6775fb0057f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "outputEncryptionKmsKeyId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="outputLocation")
    def output_location(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "outputLocation"))

    @output_location.setter
    def output_location(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79847a79364fa53251cefb23b967b0a72416463f64eeafd8e597094cc0cb9b07)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "outputLocation", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f80ee97053c6541019ad4f80775b52c9d6fb243e9b2b2d68c9be44eb828ab179)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "language_code": "languageCode",
        "content_identification_type": "contentIdentificationType",
        "content_redaction_type": "contentRedactionType",
        "enable_partial_results_stabilization": "enablePartialResultsStabilization",
        "filter_partial_results": "filterPartialResults",
        "language_model_name": "languageModelName",
        "partial_results_stability": "partialResultsStability",
        "pii_entity_types": "piiEntityTypes",
        "show_speaker_label": "showSpeakerLabel",
        "vocabulary_filter_method": "vocabularyFilterMethod",
        "vocabulary_filter_name": "vocabularyFilterName",
        "vocabulary_name": "vocabularyName",
    },
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration:
    def __init__(
        self,
        *,
        language_code: builtins.str,
        content_identification_type: typing.Optional[builtins.str] = None,
        content_redaction_type: typing.Optional[builtins.str] = None,
        enable_partial_results_stabilization: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        filter_partial_results: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        language_model_name: typing.Optional[builtins.str] = None,
        partial_results_stability: typing.Optional[builtins.str] = None,
        pii_entity_types: typing.Optional[builtins.str] = None,
        show_speaker_label: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        vocabulary_filter_method: typing.Optional[builtins.str] = None,
        vocabulary_filter_name: typing.Optional[builtins.str] = None,
        vocabulary_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param language_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_code ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_code}.
        :param content_identification_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_identification_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_identification_type}.
        :param content_redaction_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_type}.
        :param enable_partial_results_stabilization: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#enable_partial_results_stabilization ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#enable_partial_results_stabilization}.
        :param filter_partial_results: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#filter_partial_results ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#filter_partial_results}.
        :param language_model_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_model_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_model_name}.
        :param partial_results_stability: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#partial_results_stability ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#partial_results_stability}.
        :param pii_entity_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#pii_entity_types ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#pii_entity_types}.
        :param show_speaker_label: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#show_speaker_label ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#show_speaker_label}.
        :param vocabulary_filter_method: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_method ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_method}.
        :param vocabulary_filter_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_name}.
        :param vocabulary_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f7e85204da250bf6dcb2057f07e37c8fa8d290aca50b5c2164230833022c239)
            check_type(argname="argument language_code", value=language_code, expected_type=type_hints["language_code"])
            check_type(argname="argument content_identification_type", value=content_identification_type, expected_type=type_hints["content_identification_type"])
            check_type(argname="argument content_redaction_type", value=content_redaction_type, expected_type=type_hints["content_redaction_type"])
            check_type(argname="argument enable_partial_results_stabilization", value=enable_partial_results_stabilization, expected_type=type_hints["enable_partial_results_stabilization"])
            check_type(argname="argument filter_partial_results", value=filter_partial_results, expected_type=type_hints["filter_partial_results"])
            check_type(argname="argument language_model_name", value=language_model_name, expected_type=type_hints["language_model_name"])
            check_type(argname="argument partial_results_stability", value=partial_results_stability, expected_type=type_hints["partial_results_stability"])
            check_type(argname="argument pii_entity_types", value=pii_entity_types, expected_type=type_hints["pii_entity_types"])
            check_type(argname="argument show_speaker_label", value=show_speaker_label, expected_type=type_hints["show_speaker_label"])
            check_type(argname="argument vocabulary_filter_method", value=vocabulary_filter_method, expected_type=type_hints["vocabulary_filter_method"])
            check_type(argname="argument vocabulary_filter_name", value=vocabulary_filter_name, expected_type=type_hints["vocabulary_filter_name"])
            check_type(argname="argument vocabulary_name", value=vocabulary_name, expected_type=type_hints["vocabulary_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "language_code": language_code,
        }
        if content_identification_type is not None:
            self._values["content_identification_type"] = content_identification_type
        if content_redaction_type is not None:
            self._values["content_redaction_type"] = content_redaction_type
        if enable_partial_results_stabilization is not None:
            self._values["enable_partial_results_stabilization"] = enable_partial_results_stabilization
        if filter_partial_results is not None:
            self._values["filter_partial_results"] = filter_partial_results
        if language_model_name is not None:
            self._values["language_model_name"] = language_model_name
        if partial_results_stability is not None:
            self._values["partial_results_stability"] = partial_results_stability
        if pii_entity_types is not None:
            self._values["pii_entity_types"] = pii_entity_types
        if show_speaker_label is not None:
            self._values["show_speaker_label"] = show_speaker_label
        if vocabulary_filter_method is not None:
            self._values["vocabulary_filter_method"] = vocabulary_filter_method
        if vocabulary_filter_name is not None:
            self._values["vocabulary_filter_name"] = vocabulary_filter_name
        if vocabulary_name is not None:
            self._values["vocabulary_name"] = vocabulary_name

    @builtins.property
    def language_code(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_code ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_code}.'''
        result = self._values.get("language_code")
        assert result is not None, "Required property 'language_code' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def content_identification_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_identification_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_identification_type}.'''
        result = self._values.get("content_identification_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def content_redaction_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_type}.'''
        result = self._values.get("content_redaction_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def enable_partial_results_stabilization(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#enable_partial_results_stabilization ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#enable_partial_results_stabilization}.'''
        result = self._values.get("enable_partial_results_stabilization")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def filter_partial_results(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#filter_partial_results ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#filter_partial_results}.'''
        result = self._values.get("filter_partial_results")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def language_model_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_model_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_model_name}.'''
        result = self._values.get("language_model_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def partial_results_stability(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#partial_results_stability ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#partial_results_stability}.'''
        result = self._values.get("partial_results_stability")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def pii_entity_types(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#pii_entity_types ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#pii_entity_types}.'''
        result = self._values.get("pii_entity_types")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def show_speaker_label(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#show_speaker_label ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#show_speaker_label}.'''
        result = self._values.get("show_speaker_label")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def vocabulary_filter_method(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_method ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_method}.'''
        result = self._values.get("vocabulary_filter_method")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def vocabulary_filter_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_name}.'''
        result = self._values.get("vocabulary_filter_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def vocabulary_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_name}.'''
        result = self._values.get("vocabulary_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__77b739e0ac943282a6c885acc4d2551c289881666e2215403de54388510c7a42)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetContentIdentificationType")
    def reset_content_identification_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContentIdentificationType", []))

    @jsii.member(jsii_name="resetContentRedactionType")
    def reset_content_redaction_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContentRedactionType", []))

    @jsii.member(jsii_name="resetEnablePartialResultsStabilization")
    def reset_enable_partial_results_stabilization(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnablePartialResultsStabilization", []))

    @jsii.member(jsii_name="resetFilterPartialResults")
    def reset_filter_partial_results(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilterPartialResults", []))

    @jsii.member(jsii_name="resetLanguageModelName")
    def reset_language_model_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLanguageModelName", []))

    @jsii.member(jsii_name="resetPartialResultsStability")
    def reset_partial_results_stability(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPartialResultsStability", []))

    @jsii.member(jsii_name="resetPiiEntityTypes")
    def reset_pii_entity_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPiiEntityTypes", []))

    @jsii.member(jsii_name="resetShowSpeakerLabel")
    def reset_show_speaker_label(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetShowSpeakerLabel", []))

    @jsii.member(jsii_name="resetVocabularyFilterMethod")
    def reset_vocabulary_filter_method(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVocabularyFilterMethod", []))

    @jsii.member(jsii_name="resetVocabularyFilterName")
    def reset_vocabulary_filter_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVocabularyFilterName", []))

    @jsii.member(jsii_name="resetVocabularyName")
    def reset_vocabulary_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVocabularyName", []))

    @builtins.property
    @jsii.member(jsii_name="contentIdentificationTypeInput")
    def content_identification_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contentIdentificationTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="contentRedactionTypeInput")
    def content_redaction_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contentRedactionTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="enablePartialResultsStabilizationInput")
    def enable_partial_results_stabilization_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enablePartialResultsStabilizationInput"))

    @builtins.property
    @jsii.member(jsii_name="filterPartialResultsInput")
    def filter_partial_results_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "filterPartialResultsInput"))

    @builtins.property
    @jsii.member(jsii_name="languageCodeInput")
    def language_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "languageCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="languageModelNameInput")
    def language_model_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "languageModelNameInput"))

    @builtins.property
    @jsii.member(jsii_name="partialResultsStabilityInput")
    def partial_results_stability_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "partialResultsStabilityInput"))

    @builtins.property
    @jsii.member(jsii_name="piiEntityTypesInput")
    def pii_entity_types_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "piiEntityTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="showSpeakerLabelInput")
    def show_speaker_label_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "showSpeakerLabelInput"))

    @builtins.property
    @jsii.member(jsii_name="vocabularyFilterMethodInput")
    def vocabulary_filter_method_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "vocabularyFilterMethodInput"))

    @builtins.property
    @jsii.member(jsii_name="vocabularyFilterNameInput")
    def vocabulary_filter_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "vocabularyFilterNameInput"))

    @builtins.property
    @jsii.member(jsii_name="vocabularyNameInput")
    def vocabulary_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "vocabularyNameInput"))

    @builtins.property
    @jsii.member(jsii_name="contentIdentificationType")
    def content_identification_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contentIdentificationType"))

    @content_identification_type.setter
    def content_identification_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d38101bc13639ba1eb0ec177ad36f012ae5909e9f9c504592142577fff5cb5a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contentIdentificationType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="contentRedactionType")
    def content_redaction_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contentRedactionType"))

    @content_redaction_type.setter
    def content_redaction_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9ec084f45861967196cfe25bb4e365fbe5ba095913457e95ea1fe2dfbe5926d3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contentRedactionType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enablePartialResultsStabilization")
    def enable_partial_results_stabilization(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enablePartialResultsStabilization"))

    @enable_partial_results_stabilization.setter
    def enable_partial_results_stabilization(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e45f23c83198bc4c18355231efa51bb8422476373abd5826608112ad1ca28d07)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enablePartialResultsStabilization", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="filterPartialResults")
    def filter_partial_results(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "filterPartialResults"))

    @filter_partial_results.setter
    def filter_partial_results(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e9124b863e11a684467e78631c3a21e416c03798356c6941eb5b0747b96ca43)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "filterPartialResults", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="languageCode")
    def language_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "languageCode"))

    @language_code.setter
    def language_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2e6602b0fcf26e250f73c5ea9a603cd6e551b6d3c4702511db004ff293ceb955)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "languageCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="languageModelName")
    def language_model_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "languageModelName"))

    @language_model_name.setter
    def language_model_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86a960dee167f21f03cd8503bfc43fca8af2f4d953fad7c7cea5978f53525131)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "languageModelName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="partialResultsStability")
    def partial_results_stability(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "partialResultsStability"))

    @partial_results_stability.setter
    def partial_results_stability(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__70a45e824d66531a2e07248dacac674b7610faefcaec273f27a2b924c1d7e5fe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "partialResultsStability", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="piiEntityTypes")
    def pii_entity_types(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "piiEntityTypes"))

    @pii_entity_types.setter
    def pii_entity_types(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f3b846b0a096fe741e6283ba706dc33785a42dbd5387ede0f397a99b1c76b25)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "piiEntityTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="showSpeakerLabel")
    def show_speaker_label(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "showSpeakerLabel"))

    @show_speaker_label.setter
    def show_speaker_label(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61e79975ba9c8f814785e7d52e2440bb71051e33d2615af11873964dbec128d1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "showSpeakerLabel", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="vocabularyFilterMethod")
    def vocabulary_filter_method(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vocabularyFilterMethod"))

    @vocabulary_filter_method.setter
    def vocabulary_filter_method(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02e1546bb242c97e0918d2debcd98607f4ba5c11ee05132c9697758737ee9269)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "vocabularyFilterMethod", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="vocabularyFilterName")
    def vocabulary_filter_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vocabularyFilterName"))

    @vocabulary_filter_name.setter
    def vocabulary_filter_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e59242996fc7a595b6b79b48eb65038e89586ed57cfd61ec423960958374e323)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "vocabularyFilterName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="vocabularyName")
    def vocabulary_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vocabularyName"))

    @vocabulary_name.setter
    def vocabulary_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__721d2644469e38a0f7b134797acd8dbb7d2b38b91a7756ac5911520f955fb19a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "vocabularyName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84ddab2ca5a597dfbbda9804f80fad5516694f957b376567b3c3c1f971551e84)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration",
    jsii_struct_bases=[],
    name_mapping={"insights_target": "insightsTarget"},
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration:
    def __init__(self, *, insights_target: builtins.str) -> None:
        '''
        :param insights_target: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__598353c4e0ce2844d31f49e78ea37149a5280d302443386568727349c428872b)
            check_type(argname="argument insights_target", value=insights_target, expected_type=type_hints["insights_target"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insights_target": insights_target,
        }

    @builtins.property
    def insights_target(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.'''
        result = self._values.get("insights_target")
        assert result is not None, "Required property 'insights_target' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a7d41624a297e6dcf11f4cb45b5ddc62516ad6afb42b2579c9c0451d34025007)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="insightsTargetInput")
    def insights_target_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "insightsTargetInput"))

    @builtins.property
    @jsii.member(jsii_name="insightsTarget")
    def insights_target(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "insightsTarget"))

    @insights_target.setter
    def insights_target(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05e37711887d6b0a951b5ac7b2bac3dc3c606830f3213b356bf72a6beff4c2e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "insightsTarget", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__64270dc8f6c8226ac67ae11946991334d7412d016a7e477f07d6e72d51ad974d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration",
    jsii_struct_bases=[],
    name_mapping={"insights_target": "insightsTarget"},
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration:
    def __init__(self, *, insights_target: builtins.str) -> None:
        '''
        :param insights_target: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bb5185057051796b1e8628ece957dabbe30563d6f044bdcbc23b2e58bc67b4f3)
            check_type(argname="argument insights_target", value=insights_target, expected_type=type_hints["insights_target"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insights_target": insights_target,
        }

    @builtins.property
    def insights_target(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.'''
        result = self._values.get("insights_target")
        assert result is not None, "Required property 'insights_target' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f4b8e83a4abbdea35490c6da0f00c948768463c2274e92c3fa4ce0011877ddbb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="insightsTargetInput")
    def insights_target_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "insightsTargetInput"))

    @builtins.property
    @jsii.member(jsii_name="insightsTarget")
    def insights_target(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "insightsTarget"))

    @insights_target.setter
    def insights_target(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d25f6d51cb73dc5e95d9b832392f24dc42438e055b25305c9c6baf0e4a58eed1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "insightsTarget", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b9fe77293ab58dc1354babd2bca6b502aa588f49aab1269ba670007682a850b2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__851116ba58666d6955a6d0ce8822e5b68a39d52fbfa3ccea286975ab61554205)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dda735ab4c783576cb4e9e29a97cc98ede98246c97aa3209b1b0750e35f7cf86)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ce7fa7f075268c737cf65b3f4e52a18466765e0b753763e010e901eb151f9a5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e91d9597f3030960d8db58ffa2c70080a70f30d8de467b412ed6052107d33860)
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
            type_hints = typing.get_type_hints(_typecheckingstub__132ed894decabba9dbe7cae80b421cee43d444d1fdf5105e661d93c5518b4d04)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f94a4bbf39edd203d528928e6f154e9fcb0738d490acac724f78f55d83122121)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2ee01bc847cadedfaea6f98762940c27b8d6ed76fa1151858e7f0abb1975276a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putAmazonTranscribeCallAnalyticsProcessorConfiguration")
    def put_amazon_transcribe_call_analytics_processor_configuration(
        self,
        *,
        language_code: builtins.str,
        call_analytics_stream_categories: typing.Optional[typing.Sequence[builtins.str]] = None,
        content_identification_type: typing.Optional[builtins.str] = None,
        content_redaction_type: typing.Optional[builtins.str] = None,
        enable_partial_results_stabilization: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        filter_partial_results: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        language_model_name: typing.Optional[builtins.str] = None,
        partial_results_stability: typing.Optional[builtins.str] = None,
        pii_entity_types: typing.Optional[builtins.str] = None,
        post_call_analytics_settings: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings, typing.Dict[builtins.str, typing.Any]]] = None,
        vocabulary_filter_method: typing.Optional[builtins.str] = None,
        vocabulary_filter_name: typing.Optional[builtins.str] = None,
        vocabulary_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param language_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_code ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_code}.
        :param call_analytics_stream_categories: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#call_analytics_stream_categories ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#call_analytics_stream_categories}.
        :param content_identification_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_identification_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_identification_type}.
        :param content_redaction_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_type}.
        :param enable_partial_results_stabilization: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#enable_partial_results_stabilization ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#enable_partial_results_stabilization}.
        :param filter_partial_results: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#filter_partial_results ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#filter_partial_results}.
        :param language_model_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_model_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_model_name}.
        :param partial_results_stability: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#partial_results_stability ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#partial_results_stability}.
        :param pii_entity_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#pii_entity_types ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#pii_entity_types}.
        :param post_call_analytics_settings: post_call_analytics_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#post_call_analytics_settings ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#post_call_analytics_settings}
        :param vocabulary_filter_method: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_method ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_method}.
        :param vocabulary_filter_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_name}.
        :param vocabulary_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_name}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration(
            language_code=language_code,
            call_analytics_stream_categories=call_analytics_stream_categories,
            content_identification_type=content_identification_type,
            content_redaction_type=content_redaction_type,
            enable_partial_results_stabilization=enable_partial_results_stabilization,
            filter_partial_results=filter_partial_results,
            language_model_name=language_model_name,
            partial_results_stability=partial_results_stability,
            pii_entity_types=pii_entity_types,
            post_call_analytics_settings=post_call_analytics_settings,
            vocabulary_filter_method=vocabulary_filter_method,
            vocabulary_filter_name=vocabulary_filter_name,
            vocabulary_name=vocabulary_name,
        )

        return typing.cast(None, jsii.invoke(self, "putAmazonTranscribeCallAnalyticsProcessorConfiguration", [value]))

    @jsii.member(jsii_name="putAmazonTranscribeProcessorConfiguration")
    def put_amazon_transcribe_processor_configuration(
        self,
        *,
        language_code: builtins.str,
        content_identification_type: typing.Optional[builtins.str] = None,
        content_redaction_type: typing.Optional[builtins.str] = None,
        enable_partial_results_stabilization: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        filter_partial_results: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        language_model_name: typing.Optional[builtins.str] = None,
        partial_results_stability: typing.Optional[builtins.str] = None,
        pii_entity_types: typing.Optional[builtins.str] = None,
        show_speaker_label: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        vocabulary_filter_method: typing.Optional[builtins.str] = None,
        vocabulary_filter_name: typing.Optional[builtins.str] = None,
        vocabulary_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param language_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_code ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_code}.
        :param content_identification_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_identification_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_identification_type}.
        :param content_redaction_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_type}.
        :param enable_partial_results_stabilization: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#enable_partial_results_stabilization ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#enable_partial_results_stabilization}.
        :param filter_partial_results: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#filter_partial_results ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#filter_partial_results}.
        :param language_model_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#language_model_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#language_model_name}.
        :param partial_results_stability: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#partial_results_stability ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#partial_results_stability}.
        :param pii_entity_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#pii_entity_types ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#pii_entity_types}.
        :param show_speaker_label: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#show_speaker_label ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#show_speaker_label}.
        :param vocabulary_filter_method: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_method ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_method}.
        :param vocabulary_filter_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_filter_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_filter_name}.
        :param vocabulary_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#vocabulary_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#vocabulary_name}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration(
            language_code=language_code,
            content_identification_type=content_identification_type,
            content_redaction_type=content_redaction_type,
            enable_partial_results_stabilization=enable_partial_results_stabilization,
            filter_partial_results=filter_partial_results,
            language_model_name=language_model_name,
            partial_results_stability=partial_results_stability,
            pii_entity_types=pii_entity_types,
            show_speaker_label=show_speaker_label,
            vocabulary_filter_method=vocabulary_filter_method,
            vocabulary_filter_name=vocabulary_filter_name,
            vocabulary_name=vocabulary_name,
        )

        return typing.cast(None, jsii.invoke(self, "putAmazonTranscribeProcessorConfiguration", [value]))

    @jsii.member(jsii_name="putKinesisDataStreamSinkConfiguration")
    def put_kinesis_data_stream_sink_configuration(
        self,
        *,
        insights_target: builtins.str,
    ) -> None:
        '''
        :param insights_target: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration(
            insights_target=insights_target
        )

        return typing.cast(None, jsii.invoke(self, "putKinesisDataStreamSinkConfiguration", [value]))

    @jsii.member(jsii_name="putLambdaFunctionSinkConfiguration")
    def put_lambda_function_sink_configuration(
        self,
        *,
        insights_target: builtins.str,
    ) -> None:
        '''
        :param insights_target: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration(
            insights_target=insights_target
        )

        return typing.cast(None, jsii.invoke(self, "putLambdaFunctionSinkConfiguration", [value]))

    @jsii.member(jsii_name="putS3RecordingSinkConfiguration")
    def put_s3_recording_sink_configuration(
        self,
        *,
        destination: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param destination: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#destination ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#destination}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration(
            destination=destination
        )

        return typing.cast(None, jsii.invoke(self, "putS3RecordingSinkConfiguration", [value]))

    @jsii.member(jsii_name="putSnsTopicSinkConfiguration")
    def put_sns_topic_sink_configuration(
        self,
        *,
        insights_target: builtins.str,
    ) -> None:
        '''
        :param insights_target: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration(
            insights_target=insights_target
        )

        return typing.cast(None, jsii.invoke(self, "putSnsTopicSinkConfiguration", [value]))

    @jsii.member(jsii_name="putSqsQueueSinkConfiguration")
    def put_sqs_queue_sink_configuration(
        self,
        *,
        insights_target: builtins.str,
    ) -> None:
        '''
        :param insights_target: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration(
            insights_target=insights_target
        )

        return typing.cast(None, jsii.invoke(self, "putSqsQueueSinkConfiguration", [value]))

    @jsii.member(jsii_name="putVoiceAnalyticsProcessorConfiguration")
    def put_voice_analytics_processor_configuration(
        self,
        *,
        speaker_search_status: builtins.str,
        voice_tone_analysis_status: builtins.str,
    ) -> None:
        '''
        :param speaker_search_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#speaker_search_status ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#speaker_search_status}.
        :param voice_tone_analysis_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#voice_tone_analysis_status ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#voice_tone_analysis_status}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration(
            speaker_search_status=speaker_search_status,
            voice_tone_analysis_status=voice_tone_analysis_status,
        )

        return typing.cast(None, jsii.invoke(self, "putVoiceAnalyticsProcessorConfiguration", [value]))

    @jsii.member(jsii_name="resetAmazonTranscribeCallAnalyticsProcessorConfiguration")
    def reset_amazon_transcribe_call_analytics_processor_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAmazonTranscribeCallAnalyticsProcessorConfiguration", []))

    @jsii.member(jsii_name="resetAmazonTranscribeProcessorConfiguration")
    def reset_amazon_transcribe_processor_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAmazonTranscribeProcessorConfiguration", []))

    @jsii.member(jsii_name="resetKinesisDataStreamSinkConfiguration")
    def reset_kinesis_data_stream_sink_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKinesisDataStreamSinkConfiguration", []))

    @jsii.member(jsii_name="resetLambdaFunctionSinkConfiguration")
    def reset_lambda_function_sink_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLambdaFunctionSinkConfiguration", []))

    @jsii.member(jsii_name="resetS3RecordingSinkConfiguration")
    def reset_s3_recording_sink_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3RecordingSinkConfiguration", []))

    @jsii.member(jsii_name="resetSnsTopicSinkConfiguration")
    def reset_sns_topic_sink_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSnsTopicSinkConfiguration", []))

    @jsii.member(jsii_name="resetSqsQueueSinkConfiguration")
    def reset_sqs_queue_sink_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSqsQueueSinkConfiguration", []))

    @jsii.member(jsii_name="resetVoiceAnalyticsProcessorConfiguration")
    def reset_voice_analytics_processor_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVoiceAnalyticsProcessorConfiguration", []))

    @builtins.property
    @jsii.member(jsii_name="amazonTranscribeCallAnalyticsProcessorConfiguration")
    def amazon_transcribe_call_analytics_processor_configuration(
        self,
    ) -> ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationOutputReference:
        return typing.cast(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationOutputReference, jsii.get(self, "amazonTranscribeCallAnalyticsProcessorConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="amazonTranscribeProcessorConfiguration")
    def amazon_transcribe_processor_configuration(
        self,
    ) -> ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfigurationOutputReference:
        return typing.cast(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfigurationOutputReference, jsii.get(self, "amazonTranscribeProcessorConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="kinesisDataStreamSinkConfiguration")
    def kinesis_data_stream_sink_configuration(
        self,
    ) -> ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfigurationOutputReference:
        return typing.cast(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfigurationOutputReference, jsii.get(self, "kinesisDataStreamSinkConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionSinkConfiguration")
    def lambda_function_sink_configuration(
        self,
    ) -> ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfigurationOutputReference:
        return typing.cast(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfigurationOutputReference, jsii.get(self, "lambdaFunctionSinkConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="s3RecordingSinkConfiguration")
    def s3_recording_sink_configuration(
        self,
    ) -> "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfigurationOutputReference":
        return typing.cast("ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfigurationOutputReference", jsii.get(self, "s3RecordingSinkConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="snsTopicSinkConfiguration")
    def sns_topic_sink_configuration(
        self,
    ) -> "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfigurationOutputReference":
        return typing.cast("ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfigurationOutputReference", jsii.get(self, "snsTopicSinkConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="sqsQueueSinkConfiguration")
    def sqs_queue_sink_configuration(
        self,
    ) -> "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfigurationOutputReference":
        return typing.cast("ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfigurationOutputReference", jsii.get(self, "sqsQueueSinkConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="voiceAnalyticsProcessorConfiguration")
    def voice_analytics_processor_configuration(
        self,
    ) -> "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfigurationOutputReference":
        return typing.cast("ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfigurationOutputReference", jsii.get(self, "voiceAnalyticsProcessorConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="amazonTranscribeCallAnalyticsProcessorConfigurationInput")
    def amazon_transcribe_call_analytics_processor_configuration_input(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration], jsii.get(self, "amazonTranscribeCallAnalyticsProcessorConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="amazonTranscribeProcessorConfigurationInput")
    def amazon_transcribe_processor_configuration_input(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration], jsii.get(self, "amazonTranscribeProcessorConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="kinesisDataStreamSinkConfigurationInput")
    def kinesis_data_stream_sink_configuration_input(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration], jsii.get(self, "kinesisDataStreamSinkConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="lambdaFunctionSinkConfigurationInput")
    def lambda_function_sink_configuration_input(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration], jsii.get(self, "lambdaFunctionSinkConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="s3RecordingSinkConfigurationInput")
    def s3_recording_sink_configuration_input(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration"]:
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration"], jsii.get(self, "s3RecordingSinkConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="snsTopicSinkConfigurationInput")
    def sns_topic_sink_configuration_input(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration"]:
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration"], jsii.get(self, "snsTopicSinkConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="sqsQueueSinkConfigurationInput")
    def sqs_queue_sink_configuration_input(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration"]:
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration"], jsii.get(self, "sqsQueueSinkConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="voiceAnalyticsProcessorConfigurationInput")
    def voice_analytics_processor_configuration_input(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration"]:
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration"], jsii.get(self, "voiceAnalyticsProcessorConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3cf2c909ff1553071d61eab84122869c7921d1c2fa9c9ea7db52a734f7bb89d1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f024f28f9d3eaac3c5b2463007f7fc77a6526efc6450c453d556da6a4e8f864)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration",
    jsii_struct_bases=[],
    name_mapping={"destination": "destination"},
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration:
    def __init__(self, *, destination: typing.Optional[builtins.str] = None) -> None:
        '''
        :param destination: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#destination ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#destination}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__315e17a13eb010633a41d496f04cb014e1dbdde6dc7e135b137b9098bca0c2cb)
            check_type(argname="argument destination", value=destination, expected_type=type_hints["destination"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if destination is not None:
            self._values["destination"] = destination

    @builtins.property
    def destination(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#destination ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#destination}.'''
        result = self._values.get("destination")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fc1532129c8d43d0dcadda97cd950fdb411c755dfc4430eb777b82eddee07685)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDestination")
    def reset_destination(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDestination", []))

    @builtins.property
    @jsii.member(jsii_name="destinationInput")
    def destination_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "destinationInput"))

    @builtins.property
    @jsii.member(jsii_name="destination")
    def destination(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "destination"))

    @destination.setter
    def destination(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4271f2e7686ae3e830e724494a40d7012196e504feedc7be72f1ba75c87e558d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "destination", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e91657e6ce3950cddc762577375223360a5c07664e8f8355efd977a9aac28fb1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration",
    jsii_struct_bases=[],
    name_mapping={"insights_target": "insightsTarget"},
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration:
    def __init__(self, *, insights_target: builtins.str) -> None:
        '''
        :param insights_target: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__74d3d3d4dd8af36c980ace3411fe2671207e9805b0d4fd1060641bdab47e32ca)
            check_type(argname="argument insights_target", value=insights_target, expected_type=type_hints["insights_target"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insights_target": insights_target,
        }

    @builtins.property
    def insights_target(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.'''
        result = self._values.get("insights_target")
        assert result is not None, "Required property 'insights_target' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fd56633e860d5c4891ac41b1e0ad638c2cec8a10309ce64584abe9a74b3f70aa)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="insightsTargetInput")
    def insights_target_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "insightsTargetInput"))

    @builtins.property
    @jsii.member(jsii_name="insightsTarget")
    def insights_target(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "insightsTarget"))

    @insights_target.setter
    def insights_target(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fae9d614c42e1dab7b5159792c93ed9e9ab4deddb5ef6b2b7ea411545b495e96)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "insightsTarget", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f7efcd87ba72b9a582033e16f4284ac082a5bf136bb8d792b8ce7c33226ddf7c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration",
    jsii_struct_bases=[],
    name_mapping={"insights_target": "insightsTarget"},
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration:
    def __init__(self, *, insights_target: builtins.str) -> None:
        '''
        :param insights_target: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9f0c621df3449d7af91e76293f303783dff21b4b894f1528e558c0e1d8d052b5)
            check_type(argname="argument insights_target", value=insights_target, expected_type=type_hints["insights_target"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "insights_target": insights_target,
        }

    @builtins.property
    def insights_target(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#insights_target ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#insights_target}.'''
        result = self._values.get("insights_target")
        assert result is not None, "Required property 'insights_target' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4922368a81422d5945449b000d970e0fb093d854ef5ea3fd14b8453a1e5a1381)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="insightsTargetInput")
    def insights_target_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "insightsTargetInput"))

    @builtins.property
    @jsii.member(jsii_name="insightsTarget")
    def insights_target(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "insightsTarget"))

    @insights_target.setter
    def insights_target(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a6b185e64e29c67834be77e0bff16f533639d55c4bc9e3f03a4cdbb09798cbd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "insightsTarget", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__559f642f79b11910be2eace1f4cc1e35116296464e772dcb87111d0a00f10fdc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "speaker_search_status": "speakerSearchStatus",
        "voice_tone_analysis_status": "voiceToneAnalysisStatus",
    },
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration:
    def __init__(
        self,
        *,
        speaker_search_status: builtins.str,
        voice_tone_analysis_status: builtins.str,
    ) -> None:
        '''
        :param speaker_search_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#speaker_search_status ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#speaker_search_status}.
        :param voice_tone_analysis_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#voice_tone_analysis_status ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#voice_tone_analysis_status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6f3eea05d23aa0eb3f090957e6b79a3053c3d53a74923486c4ae2f47dc83f79)
            check_type(argname="argument speaker_search_status", value=speaker_search_status, expected_type=type_hints["speaker_search_status"])
            check_type(argname="argument voice_tone_analysis_status", value=voice_tone_analysis_status, expected_type=type_hints["voice_tone_analysis_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "speaker_search_status": speaker_search_status,
            "voice_tone_analysis_status": voice_tone_analysis_status,
        }

    @builtins.property
    def speaker_search_status(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#speaker_search_status ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#speaker_search_status}.'''
        result = self._values.get("speaker_search_status")
        assert result is not None, "Required property 'speaker_search_status' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def voice_tone_analysis_status(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#voice_tone_analysis_status ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#voice_tone_analysis_status}.'''
        result = self._values.get("voice_tone_analysis_status")
        assert result is not None, "Required property 'voice_tone_analysis_status' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8a1b6bcc2db5bd2d30d9107bde57bef2d9d81e7fc92231f01726371aae34a737)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="speakerSearchStatusInput")
    def speaker_search_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "speakerSearchStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="voiceToneAnalysisStatusInput")
    def voice_tone_analysis_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "voiceToneAnalysisStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="speakerSearchStatus")
    def speaker_search_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "speakerSearchStatus"))

    @speaker_search_status.setter
    def speaker_search_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9a3be461b551c139636f31cde5525cf7f89413eba001dc32d58c9dadc43171f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "speakerSearchStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="voiceToneAnalysisStatus")
    def voice_tone_analysis_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "voiceToneAnalysisStatus"))

    @voice_tone_analysis_status.setter
    def voice_tone_analysis_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a016c5ca5a2ae3739fde9becee4eb781509785d1be1f16c53fe1f96782157f6e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "voiceToneAnalysisStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cdf12e85e9ad106dfc16009cab360a8ff7fd6959e70529ba7465f2d72b58d620)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration",
    jsii_struct_bases=[],
    name_mapping={"rules": "rules", "disabled": "disabled"},
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration:
    def __init__(
        self,
        *,
        rules: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules", typing.Dict[builtins.str, typing.Any]]]],
        disabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param rules: rules block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rules ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rules}
        :param disabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#disabled ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#disabled}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2286759ccd445f1578c78cac247ebd2f985938663151cc7834a2124613ac8630)
            check_type(argname="argument rules", value=rules, expected_type=type_hints["rules"])
            check_type(argname="argument disabled", value=disabled, expected_type=type_hints["disabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "rules": rules,
        }
        if disabled is not None:
            self._values["disabled"] = disabled

    @builtins.property
    def rules(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules"]]:
        '''rules block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rules ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rules}
        '''
        result = self._values.get("rules")
        assert result is not None, "Required property 'rules' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules"]], result)

    @builtins.property
    def disabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#disabled ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#disabled}.'''
        result = self._values.get("disabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f30347f6499e898bdad633dc6ecc143bbf3ef2a52c9ea496293d74ef94691db8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRules")
    def put_rules(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b493b7f73b3c2614cd852d3f97674e53856b8a17447871a8c9ca3efc7907a29)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRules", [value]))

    @jsii.member(jsii_name="resetDisabled")
    def reset_disabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDisabled", []))

    @builtins.property
    @jsii.member(jsii_name="rules")
    def rules(
        self,
    ) -> "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesList":
        return typing.cast("ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesList", jsii.get(self, "rules"))

    @builtins.property
    @jsii.member(jsii_name="disabledInput")
    def disabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "disabledInput"))

    @builtins.property
    @jsii.member(jsii_name="rulesInput")
    def rules_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules"]]], jsii.get(self, "rulesInput"))

    @builtins.property
    @jsii.member(jsii_name="disabled")
    def disabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "disabled"))

    @disabled.setter
    def disabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb15469c695035180b4a607fdcdb8c179fbf4922c09eed3cd5e8e1aa0e608f6d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "disabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62608c6e62d595480a2fa5a3d4f5cc35bd7b36a9dac301faf5d8f5ffb79a15ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules",
    jsii_struct_bases=[],
    name_mapping={
        "type": "type",
        "issue_detection_configuration": "issueDetectionConfiguration",
        "keyword_match_configuration": "keywordMatchConfiguration",
        "sentiment_configuration": "sentimentConfiguration",
    },
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules:
    def __init__(
        self,
        *,
        type: builtins.str,
        issue_detection_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        keyword_match_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
        sentiment_configuration: typing.Optional[typing.Union["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#type}.
        :param issue_detection_configuration: issue_detection_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#issue_detection_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#issue_detection_configuration}
        :param keyword_match_configuration: keyword_match_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#keyword_match_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#keyword_match_configuration}
        :param sentiment_configuration: sentiment_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sentiment_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sentiment_configuration}
        '''
        if isinstance(issue_detection_configuration, dict):
            issue_detection_configuration = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration(**issue_detection_configuration)
        if isinstance(keyword_match_configuration, dict):
            keyword_match_configuration = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration(**keyword_match_configuration)
        if isinstance(sentiment_configuration, dict):
            sentiment_configuration = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration(**sentiment_configuration)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d1aaa6993a0d5b3a5d8afde3b4685fef4e88ca95260f0acbf9ef55b81bb3dda)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument issue_detection_configuration", value=issue_detection_configuration, expected_type=type_hints["issue_detection_configuration"])
            check_type(argname="argument keyword_match_configuration", value=keyword_match_configuration, expected_type=type_hints["keyword_match_configuration"])
            check_type(argname="argument sentiment_configuration", value=sentiment_configuration, expected_type=type_hints["sentiment_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "type": type,
        }
        if issue_detection_configuration is not None:
            self._values["issue_detection_configuration"] = issue_detection_configuration
        if keyword_match_configuration is not None:
            self._values["keyword_match_configuration"] = keyword_match_configuration
        if sentiment_configuration is not None:
            self._values["sentiment_configuration"] = sentiment_configuration

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def issue_detection_configuration(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration"]:
        '''issue_detection_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#issue_detection_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#issue_detection_configuration}
        '''
        result = self._values.get("issue_detection_configuration")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration"], result)

    @builtins.property
    def keyword_match_configuration(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration"]:
        '''keyword_match_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#keyword_match_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#keyword_match_configuration}
        '''
        result = self._values.get("keyword_match_configuration")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration"], result)

    @builtins.property
    def sentiment_configuration(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration"]:
        '''sentiment_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sentiment_configuration ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sentiment_configuration}
        '''
        result = self._values.get("sentiment_configuration")
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration",
    jsii_struct_bases=[],
    name_mapping={"rule_name": "ruleName"},
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration:
    def __init__(self, *, rule_name: builtins.str) -> None:
        '''
        :param rule_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e417e89453031a2dd3669f31c2dc221b5d9d3d02531d3043825ffb22aba3b02)
            check_type(argname="argument rule_name", value=rule_name, expected_type=type_hints["rule_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "rule_name": rule_name,
        }

    @builtins.property
    def rule_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}.'''
        result = self._values.get("rule_name")
        assert result is not None, "Required property 'rule_name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ad8abe72ff55b1d1fdbadbb1462865a7f99dee53970113b3158cc8d144aa08bb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="ruleNameInput")
    def rule_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ruleNameInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleName")
    def rule_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ruleName"))

    @rule_name.setter
    def rule_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dafc41153b895f6da54d39458eaa37722b34aad82dd597c09f5a37365153b104)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ruleName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8edecdb87801a63e88e937cf9d3208f2c6b3b110fd7b0e5367b3f1191975a0ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration",
    jsii_struct_bases=[],
    name_mapping={"keywords": "keywords", "rule_name": "ruleName", "negate": "negate"},
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration:
    def __init__(
        self,
        *,
        keywords: typing.Sequence[builtins.str],
        rule_name: builtins.str,
        negate: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param keywords: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#keywords ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#keywords}.
        :param rule_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}.
        :param negate: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#negate ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#negate}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__76bcaa320f960f40a7e3411ec4c957a910b5e9f7f37554392a8d06807da47b35)
            check_type(argname="argument keywords", value=keywords, expected_type=type_hints["keywords"])
            check_type(argname="argument rule_name", value=rule_name, expected_type=type_hints["rule_name"])
            check_type(argname="argument negate", value=negate, expected_type=type_hints["negate"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "keywords": keywords,
            "rule_name": rule_name,
        }
        if negate is not None:
            self._values["negate"] = negate

    @builtins.property
    def keywords(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#keywords ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#keywords}.'''
        result = self._values.get("keywords")
        assert result is not None, "Required property 'keywords' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def rule_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}.'''
        result = self._values.get("rule_name")
        assert result is not None, "Required property 'rule_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def negate(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#negate ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#negate}.'''
        result = self._values.get("negate")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fd7ddc7794d2dfdf46a46361926af0d1cc3e64ec16f1abebdca9c6f7641e383b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetNegate")
    def reset_negate(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNegate", []))

    @builtins.property
    @jsii.member(jsii_name="keywordsInput")
    def keywords_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "keywordsInput"))

    @builtins.property
    @jsii.member(jsii_name="negateInput")
    def negate_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "negateInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleNameInput")
    def rule_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ruleNameInput"))

    @builtins.property
    @jsii.member(jsii_name="keywords")
    def keywords(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "keywords"))

    @keywords.setter
    def keywords(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ddaf55ec01d41a2c51da65e0c66d1b81dbb627b95dcfce67424f8ccdd85339d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "keywords", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="negate")
    def negate(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "negate"))

    @negate.setter
    def negate(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ad339b9d8e5bf695c506f65d9c6ab44e43dbf6eeeae561e9af6db19ccb4b40a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "negate", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ruleName")
    def rule_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ruleName"))

    @rule_name.setter
    def rule_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb8084477e6dc614144287bee47f820d55fafb1c257055201f92fc38af778d7b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ruleName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ebb635695e5503073f242d05c0b95eab19eb4a0c5037c6fc3a50fb87ac03d881)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e1a626fa8744dd25b303f544e3f09a3792b22b4ca4d2b0875d5105a4c559f9a7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__30c676f129304854215148221faa4e4310373d74e6c1ed08aa14b5d6b49ec8b7)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a5cf400c7f063102eb6aa47d5f89fca8f7058f9be7e0ffbc395d55b9a362471e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7aa25ccaa3578bb480f79eac96cbd854a33d4b4275d1f55053435b45d335d9f0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__abb63c883ac06716e7e6fc8e09aff3532f9fc8d450a225d17ce152448aa74fcf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__332327f360d558ad3d12e4a0ebc4916a639eb123d4a9df1e1c7ad1afe8955299)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8700cd0f5ab9e0701641eeaa60754a6fa08ee30d7dae257a4a5e2160422d6cb5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putIssueDetectionConfiguration")
    def put_issue_detection_configuration(self, *, rule_name: builtins.str) -> None:
        '''
        :param rule_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration(
            rule_name=rule_name
        )

        return typing.cast(None, jsii.invoke(self, "putIssueDetectionConfiguration", [value]))

    @jsii.member(jsii_name="putKeywordMatchConfiguration")
    def put_keyword_match_configuration(
        self,
        *,
        keywords: typing.Sequence[builtins.str],
        rule_name: builtins.str,
        negate: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param keywords: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#keywords ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#keywords}.
        :param rule_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}.
        :param negate: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#negate ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#negate}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration(
            keywords=keywords, rule_name=rule_name, negate=negate
        )

        return typing.cast(None, jsii.invoke(self, "putKeywordMatchConfiguration", [value]))

    @jsii.member(jsii_name="putSentimentConfiguration")
    def put_sentiment_configuration(
        self,
        *,
        rule_name: builtins.str,
        sentiment_type: builtins.str,
        time_period: jsii.Number,
    ) -> None:
        '''
        :param rule_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}.
        :param sentiment_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sentiment_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sentiment_type}.
        :param time_period: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#time_period ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#time_period}.
        '''
        value = ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration(
            rule_name=rule_name, sentiment_type=sentiment_type, time_period=time_period
        )

        return typing.cast(None, jsii.invoke(self, "putSentimentConfiguration", [value]))

    @jsii.member(jsii_name="resetIssueDetectionConfiguration")
    def reset_issue_detection_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIssueDetectionConfiguration", []))

    @jsii.member(jsii_name="resetKeywordMatchConfiguration")
    def reset_keyword_match_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKeywordMatchConfiguration", []))

    @jsii.member(jsii_name="resetSentimentConfiguration")
    def reset_sentiment_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSentimentConfiguration", []))

    @builtins.property
    @jsii.member(jsii_name="issueDetectionConfiguration")
    def issue_detection_configuration(
        self,
    ) -> ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfigurationOutputReference:
        return typing.cast(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfigurationOutputReference, jsii.get(self, "issueDetectionConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="keywordMatchConfiguration")
    def keyword_match_configuration(
        self,
    ) -> ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfigurationOutputReference:
        return typing.cast(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfigurationOutputReference, jsii.get(self, "keywordMatchConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="sentimentConfiguration")
    def sentiment_configuration(
        self,
    ) -> "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfigurationOutputReference":
        return typing.cast("ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfigurationOutputReference", jsii.get(self, "sentimentConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="issueDetectionConfigurationInput")
    def issue_detection_configuration_input(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration], jsii.get(self, "issueDetectionConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="keywordMatchConfigurationInput")
    def keyword_match_configuration_input(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration], jsii.get(self, "keywordMatchConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="sentimentConfigurationInput")
    def sentiment_configuration_input(
        self,
    ) -> typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration"]:
        return typing.cast(typing.Optional["ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration"], jsii.get(self, "sentimentConfigurationInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__99e3a9601b3863a697aaa11ad6a202dd763b01b24113e0745d9ab6ec0f676440)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4a08467e3bebb361a569f705fef38b2050df922436d5e25637855c541e724bb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "rule_name": "ruleName",
        "sentiment_type": "sentimentType",
        "time_period": "timePeriod",
    },
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration:
    def __init__(
        self,
        *,
        rule_name: builtins.str,
        sentiment_type: builtins.str,
        time_period: jsii.Number,
    ) -> None:
        '''
        :param rule_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}.
        :param sentiment_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sentiment_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sentiment_type}.
        :param time_period: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#time_period ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#time_period}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ad557ccfdf92da06e72e367ab822cc2072dd3e5f3af34b6809dae4b5425f5f6)
            check_type(argname="argument rule_name", value=rule_name, expected_type=type_hints["rule_name"])
            check_type(argname="argument sentiment_type", value=sentiment_type, expected_type=type_hints["sentiment_type"])
            check_type(argname="argument time_period", value=time_period, expected_type=type_hints["time_period"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "rule_name": rule_name,
            "sentiment_type": sentiment_type,
            "time_period": time_period,
        }

    @builtins.property
    def rule_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rule_name ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rule_name}.'''
        result = self._values.get("rule_name")
        assert result is not None, "Required property 'rule_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def sentiment_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#sentiment_type ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#sentiment_type}.'''
        result = self._values.get("sentiment_type")
        assert result is not None, "Required property 'sentiment_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def time_period(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#time_period ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#time_period}.'''
        result = self._values.get("time_period")
        assert result is not None, "Required property 'time_period' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5f02f853d23e6429ddc2e29c38fe5c1ef3eb3ac1f40bf73b0025ccde5c700a57)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="ruleNameInput")
    def rule_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ruleNameInput"))

    @builtins.property
    @jsii.member(jsii_name="sentimentTypeInput")
    def sentiment_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sentimentTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="timePeriodInput")
    def time_period_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "timePeriodInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleName")
    def rule_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ruleName"))

    @rule_name.setter
    def rule_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4214feaf60edc7a1f3e3ff19189e766da0c36c01f9005c2cbc6378abedb5513c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ruleName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sentimentType")
    def sentiment_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sentimentType"))

    @sentiment_type.setter
    def sentiment_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1eced116bf3eb6b8f777244de67e7fcc91e7af92b14aabf2874a105f8ba86abf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sentimentType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="timePeriod")
    def time_period(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "timePeriod"))

    @time_period.setter
    def time_period(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__024fee98f61bb6f218bd4863ad544325a9ab0349b9629c1a159cccb765235254)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "timePeriod", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration]:
        return typing.cast(typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9086f0ec85b69f1fa23e7a3e26bac7aff954c5a2831b9174798a161335211315)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#create ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#delete ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#update ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f7d88a2d7185b451b38633d9fd4e3e066fce43bc3b38affb09a484207d36464b)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#create ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#delete ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#update ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5de3941e8df907e2240481d3882faee22a88892ef17446f76c8c8f0068121159)
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
            type_hints = typing.get_type_hints(_typecheckingstub__210406e88d420fef8640640482c83c08c42ab848950c374a9463e75b80690b49)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7db7ba6574954b1ce9b5633a0f24f09b276f0ca7a9887debde7f80ac680321d3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f774b48aea660a569f58db6245377cd6dfa35d08b5cb13a8fa57c5637e4b7e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__461e5fc5ccafab48074401aa22c882fd672052c0f00975461094a7fca3d37997)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "ChimesdkmediapipelinesMediaInsightsPipelineConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationConfig",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettingsOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfigurationOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfigurationOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfigurationOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsList",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfigurationOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfigurationOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfigurationOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfigurationOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfigurationOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfigurationOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesList",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfigurationOutputReference",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts",
    "ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__cc4f0b848ad95628b1b00caa89f676f6897779fcb5d4fbb21a89a441d4aa4c95(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    elements: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements, typing.Dict[builtins.str, typing.Any]]]],
    name: builtins.str,
    resource_access_role_arn: builtins.str,
    real_time_alert_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__7377b499ee39cff7988a5add30a555e8e306dbe549d80aeedb8087c1811627ae(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__653a86e576baa24ece9763af2808cdf30abfc0298ef641ffd12a26a517ee2747(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c38fb7a09e2a87db0b5fabab5b6b5ff3878edd9ac5dd0cd272b2a68427c3b48(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7b54dd188eff55e156ef2f5e20638b1dc901a24e2fd03aaae6e578a67035b5a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a83fd45a831ff71cbe8027dbee22397dbddff5a7a2941c4747628a22b98fa08(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca3324cb8f46b6391960b8b96d746d0b0f3a6f26e2b1fba853a5b889097467ea(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__908048bb844acdfdef44911833483878f1eba256dc74c8e32d7d1fd4690d1ffd(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    elements: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements, typing.Dict[builtins.str, typing.Any]]]],
    name: builtins.str,
    resource_access_role_arn: builtins.str,
    real_time_alert_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d23c07a20d0947138070d791fc9c0e34157393c1dc61404ba67da6e49336df52(
    *,
    type: builtins.str,
    amazon_transcribe_call_analytics_processor_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    amazon_transcribe_processor_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    kinesis_data_stream_sink_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    lambda_function_sink_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    s3_recording_sink_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    sns_topic_sink_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    sqs_queue_sink_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    voice_analytics_processor_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d071126fc0034f8ff0adae85418b82636cd0c910fc660d5c3f40cef54ae0f4e(
    *,
    language_code: builtins.str,
    call_analytics_stream_categories: typing.Optional[typing.Sequence[builtins.str]] = None,
    content_identification_type: typing.Optional[builtins.str] = None,
    content_redaction_type: typing.Optional[builtins.str] = None,
    enable_partial_results_stabilization: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    filter_partial_results: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    language_model_name: typing.Optional[builtins.str] = None,
    partial_results_stability: typing.Optional[builtins.str] = None,
    pii_entity_types: typing.Optional[builtins.str] = None,
    post_call_analytics_settings: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    vocabulary_filter_method: typing.Optional[builtins.str] = None,
    vocabulary_filter_name: typing.Optional[builtins.str] = None,
    vocabulary_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed3733ad33a4a6d050a6218845f3db9a8e84839eff83fed9e00fa9826cb72335(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b5cb9f5a50a3f500cbcdaaef195dfbe975b84ce74a9501d6e0992892d1e51e6(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdbbf03fff3a5dddaec806f12cbd5644aa13859c4476ae88b888a131e87862e3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7b0e50458d1a202f659f37769ca8e107725b15089f6f86ea743868a2dad93b6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__883cc9d4261920c0f1670395cc6bdc103ea8d298be7a9ff835deddf0b334de44(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce69554d34bdc6b6f419ac6667e755bf05cd671e5bdc2f3b87c67a57eec63304(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f456c8294e05456bdd07b0dc666a66a6dd03d74739945615e1b96ecfbfc49ef6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__561b94b38730c496c57e9321c4f270189689b666ca9d0ba469f4194984cb0cef(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c9823223439027be82d3fe5e15bc498c8676e1adc8b990e183f695341dd2773(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bad9e1bca611742c5dde7bf379a86d60b8bd18e724e6922e77a0329d0da48856(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a47b7475991597ec0d4d50f17473c293f0f693b184bbf9cdae5357c7d5bf210(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__16599b6b8aefbb70eb9a10293ab74852fbc45334df25718ac5888249d0a2d0af(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46028da21fe2afdbc0ae49134c93d51b7851c59c87451808b585d9fbdac660e4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__965fb7d6b0f400bc1a13d6017b11cb1f7b86903d0ece5b3625268fabf6f5eb4a(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24e80cf29d5d3c4210747524858ec4766ee34d346cbe159f970f2269b03f4f6f(
    *,
    data_access_role_arn: builtins.str,
    output_location: builtins.str,
    content_redaction_output: typing.Optional[builtins.str] = None,
    output_encryption_kms_key_id: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29df0e930b2e1041ca23678b0fed9845d9be8ce46f8d6600eef270f02bbd206c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06b9cdf2579e2fe73096c464b2706d992a805a6d2907ba5b6900c7e853106018(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01b95dc34141304b23d108631a95bf9eca38e437ba256381ba30eb05bd01a5d0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e771bcf9276aafcba11433cf35132fd79cc3f5aef7c976f51318f6775fb0057f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79847a79364fa53251cefb23b967b0a72416463f64eeafd8e597094cc0cb9b07(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f80ee97053c6541019ad4f80775b52c9d6fb243e9b2b2d68c9be44eb828ab179(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f7e85204da250bf6dcb2057f07e37c8fa8d290aca50b5c2164230833022c239(
    *,
    language_code: builtins.str,
    content_identification_type: typing.Optional[builtins.str] = None,
    content_redaction_type: typing.Optional[builtins.str] = None,
    enable_partial_results_stabilization: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    filter_partial_results: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    language_model_name: typing.Optional[builtins.str] = None,
    partial_results_stability: typing.Optional[builtins.str] = None,
    pii_entity_types: typing.Optional[builtins.str] = None,
    show_speaker_label: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    vocabulary_filter_method: typing.Optional[builtins.str] = None,
    vocabulary_filter_name: typing.Optional[builtins.str] = None,
    vocabulary_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77b739e0ac943282a6c885acc4d2551c289881666e2215403de54388510c7a42(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d38101bc13639ba1eb0ec177ad36f012ae5909e9f9c504592142577fff5cb5a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ec084f45861967196cfe25bb4e365fbe5ba095913457e95ea1fe2dfbe5926d3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e45f23c83198bc4c18355231efa51bb8422476373abd5826608112ad1ca28d07(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e9124b863e11a684467e78631c3a21e416c03798356c6941eb5b0747b96ca43(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2e6602b0fcf26e250f73c5ea9a603cd6e551b6d3c4702511db004ff293ceb955(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86a960dee167f21f03cd8503bfc43fca8af2f4d953fad7c7cea5978f53525131(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__70a45e824d66531a2e07248dacac674b7610faefcaec273f27a2b924c1d7e5fe(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f3b846b0a096fe741e6283ba706dc33785a42dbd5387ede0f397a99b1c76b25(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61e79975ba9c8f814785e7d52e2440bb71051e33d2615af11873964dbec128d1(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02e1546bb242c97e0918d2debcd98607f4ba5c11ee05132c9697758737ee9269(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e59242996fc7a595b6b79b48eb65038e89586ed57cfd61ec423960958374e323(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__721d2644469e38a0f7b134797acd8dbb7d2b38b91a7756ac5911520f955fb19a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84ddab2ca5a597dfbbda9804f80fad5516694f957b376567b3c3c1f971551e84(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeProcessorConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__598353c4e0ce2844d31f49e78ea37149a5280d302443386568727349c428872b(
    *,
    insights_target: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7d41624a297e6dcf11f4cb45b5ddc62516ad6afb42b2579c9c0451d34025007(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05e37711887d6b0a951b5ac7b2bac3dc3c606830f3213b356bf72a6beff4c2e9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64270dc8f6c8226ac67ae11946991334d7412d016a7e477f07d6e72d51ad974d(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsKinesisDataStreamSinkConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb5185057051796b1e8628ece957dabbe30563d6f044bdcbc23b2e58bc67b4f3(
    *,
    insights_target: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4b8e83a4abbdea35490c6da0f00c948768463c2274e92c3fa4ce0011877ddbb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d25f6d51cb73dc5e95d9b832392f24dc42438e055b25305c9c6baf0e4a58eed1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9fe77293ab58dc1354babd2bca6b502aa588f49aab1269ba670007682a850b2(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsLambdaFunctionSinkConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__851116ba58666d6955a6d0ce8822e5b68a39d52fbfa3ccea286975ab61554205(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dda735ab4c783576cb4e9e29a97cc98ede98246c97aa3209b1b0750e35f7cf86(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ce7fa7f075268c737cf65b3f4e52a18466765e0b753763e010e901eb151f9a5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e91d9597f3030960d8db58ffa2c70080a70f30d8de467b412ed6052107d33860(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__132ed894decabba9dbe7cae80b421cee43d444d1fdf5105e661d93c5518b4d04(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f94a4bbf39edd203d528928e6f154e9fcb0738d490acac724f78f55d83122121(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ee01bc847cadedfaea6f98762940c27b8d6ed76fa1151858e7f0abb1975276a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3cf2c909ff1553071d61eab84122869c7921d1c2fa9c9ea7db52a734f7bb89d1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f024f28f9d3eaac3c5b2463007f7fc77a6526efc6450c453d556da6a4e8f864(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElements]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__315e17a13eb010633a41d496f04cb014e1dbdde6dc7e135b137b9098bca0c2cb(
    *,
    destination: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc1532129c8d43d0dcadda97cd950fdb411c755dfc4430eb777b82eddee07685(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4271f2e7686ae3e830e724494a40d7012196e504feedc7be72f1ba75c87e558d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e91657e6ce3950cddc762577375223360a5c07664e8f8355efd977a9aac28fb1(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsS3RecordingSinkConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__74d3d3d4dd8af36c980ace3411fe2671207e9805b0d4fd1060641bdab47e32ca(
    *,
    insights_target: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd56633e860d5c4891ac41b1e0ad638c2cec8a10309ce64584abe9a74b3f70aa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fae9d614c42e1dab7b5159792c93ed9e9ab4deddb5ef6b2b7ea411545b495e96(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7efcd87ba72b9a582033e16f4284ac082a5bf136bb8d792b8ce7c33226ddf7c(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSnsTopicSinkConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f0c621df3449d7af91e76293f303783dff21b4b894f1528e558c0e1d8d052b5(
    *,
    insights_target: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4922368a81422d5945449b000d970e0fb093d854ef5ea3fd14b8453a1e5a1381(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a6b185e64e29c67834be77e0bff16f533639d55c4bc9e3f03a4cdbb09798cbd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__559f642f79b11910be2eace1f4cc1e35116296464e772dcb87111d0a00f10fdc(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsSqsQueueSinkConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6f3eea05d23aa0eb3f090957e6b79a3053c3d53a74923486c4ae2f47dc83f79(
    *,
    speaker_search_status: builtins.str,
    voice_tone_analysis_status: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a1b6bcc2db5bd2d30d9107bde57bef2d9d81e7fc92231f01726371aae34a737(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a3be461b551c139636f31cde5525cf7f89413eba001dc32d58c9dadc43171f4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a016c5ca5a2ae3739fde9becee4eb781509785d1be1f16c53fe1f96782157f6e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cdf12e85e9ad106dfc16009cab360a8ff7fd6959e70529ba7465f2d72b58d620(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsVoiceAnalyticsProcessorConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2286759ccd445f1578c78cac247ebd2f985938663151cc7834a2124613ac8630(
    *,
    rules: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules, typing.Dict[builtins.str, typing.Any]]]],
    disabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f30347f6499e898bdad633dc6ecc143bbf3ef2a52c9ea496293d74ef94691db8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b493b7f73b3c2614cd852d3f97674e53856b8a17447871a8c9ca3efc7907a29(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb15469c695035180b4a607fdcdb8c179fbf4922c09eed3cd5e8e1aa0e608f6d(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62608c6e62d595480a2fa5a3d4f5cc35bd7b36a9dac301faf5d8f5ffb79a15ec(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d1aaa6993a0d5b3a5d8afde3b4685fef4e88ca95260f0acbf9ef55b81bb3dda(
    *,
    type: builtins.str,
    issue_detection_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    keyword_match_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    sentiment_configuration: typing.Optional[typing.Union[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e417e89453031a2dd3669f31c2dc221b5d9d3d02531d3043825ffb22aba3b02(
    *,
    rule_name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ad8abe72ff55b1d1fdbadbb1462865a7f99dee53970113b3158cc8d144aa08bb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dafc41153b895f6da54d39458eaa37722b34aad82dd597c09f5a37365153b104(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8edecdb87801a63e88e937cf9d3208f2c6b3b110fd7b0e5367b3f1191975a0ce(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesIssueDetectionConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76bcaa320f960f40a7e3411ec4c957a910b5e9f7f37554392a8d06807da47b35(
    *,
    keywords: typing.Sequence[builtins.str],
    rule_name: builtins.str,
    negate: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd7ddc7794d2dfdf46a46361926af0d1cc3e64ec16f1abebdca9c6f7641e383b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ddaf55ec01d41a2c51da65e0c66d1b81dbb627b95dcfce67424f8ccdd85339d(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ad339b9d8e5bf695c506f65d9c6ab44e43dbf6eeeae561e9af6db19ccb4b40a(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb8084477e6dc614144287bee47f820d55fafb1c257055201f92fc38af778d7b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebb635695e5503073f242d05c0b95eab19eb4a0c5037c6fc3a50fb87ac03d881(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesKeywordMatchConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1a626fa8744dd25b303f544e3f09a3792b22b4ca4d2b0875d5105a4c559f9a7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30c676f129304854215148221faa4e4310373d74e6c1ed08aa14b5d6b49ec8b7(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5cf400c7f063102eb6aa47d5f89fca8f7058f9be7e0ffbc395d55b9a362471e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7aa25ccaa3578bb480f79eac96cbd854a33d4b4275d1f55053435b45d335d9f0(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__abb63c883ac06716e7e6fc8e09aff3532f9fc8d450a225d17ce152448aa74fcf(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__332327f360d558ad3d12e4a0ebc4916a639eb123d4a9df1e1c7ad1afe8955299(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8700cd0f5ab9e0701641eeaa60754a6fa08ee30d7dae257a4a5e2160422d6cb5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99e3a9601b3863a697aaa11ad6a202dd763b01b24113e0745d9ab6ec0f676440(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4a08467e3bebb361a569f705fef38b2050df922436d5e25637855c541e724bb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ad557ccfdf92da06e72e367ab822cc2072dd3e5f3af34b6809dae4b5425f5f6(
    *,
    rule_name: builtins.str,
    sentiment_type: builtins.str,
    time_period: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f02f853d23e6429ddc2e29c38fe5c1ef3eb3ac1f40bf73b0025ccde5c700a57(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4214feaf60edc7a1f3e3ff19189e766da0c36c01f9005c2cbc6378abedb5513c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1eced116bf3eb6b8f777244de67e7fcc91e7af92b14aabf2874a105f8ba86abf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__024fee98f61bb6f218bd4863ad544325a9ab0349b9629c1a159cccb765235254(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9086f0ec85b69f1fa23e7a3e26bac7aff954c5a2831b9174798a161335211315(
    value: typing.Optional[ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRulesSentimentConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7d88a2d7185b451b38633d9fd4e3e066fce43bc3b38affb09a484207d36464b(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5de3941e8df907e2240481d3882faee22a88892ef17446f76c8c8f0068121159(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__210406e88d420fef8640640482c83c08c42ab848950c374a9463e75b80690b49(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7db7ba6574954b1ce9b5633a0f24f09b276f0ca7a9887debde7f80ac680321d3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f774b48aea660a569f58db6245377cd6dfa35d08b5cb13a8fa57c5637e4b7e7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__461e5fc5ccafab48074401aa22c882fd672052c0f00975461094a7fca3d37997(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, ChimesdkmediapipelinesMediaInsightsPipelineConfigurationTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
