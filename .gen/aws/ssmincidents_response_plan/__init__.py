r'''
# `aws_ssmincidents_response_plan`

Refer to the Terraform Registry for docs: [`aws_ssmincidents_response_plan`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan).
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


class SsmincidentsResponsePlan(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlan",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan aws_ssmincidents_response_plan}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        incident_template: typing.Union["SsmincidentsResponsePlanIncidentTemplate", typing.Dict[builtins.str, typing.Any]],
        name: builtins.str,
        action: typing.Optional[typing.Union["SsmincidentsResponsePlanAction", typing.Dict[builtins.str, typing.Any]]] = None,
        chat_channel: typing.Optional[typing.Sequence[builtins.str]] = None,
        display_name: typing.Optional[builtins.str] = None,
        engagements: typing.Optional[typing.Sequence[builtins.str]] = None,
        id: typing.Optional[builtins.str] = None,
        integration: typing.Optional[typing.Union["SsmincidentsResponsePlanIntegration", typing.Dict[builtins.str, typing.Any]]] = None,
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
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan aws_ssmincidents_response_plan} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param incident_template: incident_template block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#incident_template SsmincidentsResponsePlan#incident_template}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#name SsmincidentsResponsePlan#name}.
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#action SsmincidentsResponsePlan#action}
        :param chat_channel: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#chat_channel SsmincidentsResponsePlan#chat_channel}.
        :param display_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#display_name SsmincidentsResponsePlan#display_name}.
        :param engagements: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#engagements SsmincidentsResponsePlan#engagements}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#id SsmincidentsResponsePlan#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param integration: integration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#integration SsmincidentsResponsePlan#integration}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#tags SsmincidentsResponsePlan#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#tags_all SsmincidentsResponsePlan#tags_all}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__285bbf48c4d82b59798c63d2ace89cf16935e59b0f8e323fbbfaacd7760bc58a)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = SsmincidentsResponsePlanConfig(
            incident_template=incident_template,
            name=name,
            action=action,
            chat_channel=chat_channel,
            display_name=display_name,
            engagements=engagements,
            id=id,
            integration=integration,
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
        '''Generates CDKTF code for importing a SsmincidentsResponsePlan resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the SsmincidentsResponsePlan to import.
        :param import_from_id: The id of the existing SsmincidentsResponsePlan that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the SsmincidentsResponsePlan to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ec448c62a189c9b350e091456cbd89b6ec5086c853b257ebd7343de2d30f7ab)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putAction")
    def put_action(
        self,
        *,
        ssm_automation: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmincidentsResponsePlanActionSsmAutomation", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param ssm_automation: ssm_automation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#ssm_automation SsmincidentsResponsePlan#ssm_automation}
        '''
        value = SsmincidentsResponsePlanAction(ssm_automation=ssm_automation)

        return typing.cast(None, jsii.invoke(self, "putAction", [value]))

    @jsii.member(jsii_name="putIncidentTemplate")
    def put_incident_template(
        self,
        *,
        impact: jsii.Number,
        title: builtins.str,
        dedupe_string: typing.Optional[builtins.str] = None,
        incident_tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        notification_target: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmincidentsResponsePlanIncidentTemplateNotificationTarget", typing.Dict[builtins.str, typing.Any]]]]] = None,
        summary: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param impact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#impact SsmincidentsResponsePlan#impact}.
        :param title: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#title SsmincidentsResponsePlan#title}.
        :param dedupe_string: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#dedupe_string SsmincidentsResponsePlan#dedupe_string}.
        :param incident_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#incident_tags SsmincidentsResponsePlan#incident_tags}.
        :param notification_target: notification_target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#notification_target SsmincidentsResponsePlan#notification_target}
        :param summary: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#summary SsmincidentsResponsePlan#summary}.
        '''
        value = SsmincidentsResponsePlanIncidentTemplate(
            impact=impact,
            title=title,
            dedupe_string=dedupe_string,
            incident_tags=incident_tags,
            notification_target=notification_target,
            summary=summary,
        )

        return typing.cast(None, jsii.invoke(self, "putIncidentTemplate", [value]))

    @jsii.member(jsii_name="putIntegration")
    def put_integration(
        self,
        *,
        pagerduty: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmincidentsResponsePlanIntegrationPagerduty", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param pagerduty: pagerduty block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#pagerduty SsmincidentsResponsePlan#pagerduty}
        '''
        value = SsmincidentsResponsePlanIntegration(pagerduty=pagerduty)

        return typing.cast(None, jsii.invoke(self, "putIntegration", [value]))

    @jsii.member(jsii_name="resetAction")
    def reset_action(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAction", []))

    @jsii.member(jsii_name="resetChatChannel")
    def reset_chat_channel(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetChatChannel", []))

    @jsii.member(jsii_name="resetDisplayName")
    def reset_display_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDisplayName", []))

    @jsii.member(jsii_name="resetEngagements")
    def reset_engagements(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEngagements", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetIntegration")
    def reset_integration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIntegration", []))

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
    @jsii.member(jsii_name="action")
    def action(self) -> "SsmincidentsResponsePlanActionOutputReference":
        return typing.cast("SsmincidentsResponsePlanActionOutputReference", jsii.get(self, "action"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @builtins.property
    @jsii.member(jsii_name="incidentTemplate")
    def incident_template(
        self,
    ) -> "SsmincidentsResponsePlanIncidentTemplateOutputReference":
        return typing.cast("SsmincidentsResponsePlanIncidentTemplateOutputReference", jsii.get(self, "incidentTemplate"))

    @builtins.property
    @jsii.member(jsii_name="integration")
    def integration(self) -> "SsmincidentsResponsePlanIntegrationOutputReference":
        return typing.cast("SsmincidentsResponsePlanIntegrationOutputReference", jsii.get(self, "integration"))

    @builtins.property
    @jsii.member(jsii_name="actionInput")
    def action_input(self) -> typing.Optional["SsmincidentsResponsePlanAction"]:
        return typing.cast(typing.Optional["SsmincidentsResponsePlanAction"], jsii.get(self, "actionInput"))

    @builtins.property
    @jsii.member(jsii_name="chatChannelInput")
    def chat_channel_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "chatChannelInput"))

    @builtins.property
    @jsii.member(jsii_name="displayNameInput")
    def display_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "displayNameInput"))

    @builtins.property
    @jsii.member(jsii_name="engagementsInput")
    def engagements_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "engagementsInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="incidentTemplateInput")
    def incident_template_input(
        self,
    ) -> typing.Optional["SsmincidentsResponsePlanIncidentTemplate"]:
        return typing.cast(typing.Optional["SsmincidentsResponsePlanIncidentTemplate"], jsii.get(self, "incidentTemplateInput"))

    @builtins.property
    @jsii.member(jsii_name="integrationInput")
    def integration_input(
        self,
    ) -> typing.Optional["SsmincidentsResponsePlanIntegration"]:
        return typing.cast(typing.Optional["SsmincidentsResponsePlanIntegration"], jsii.get(self, "integrationInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

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
    @jsii.member(jsii_name="chatChannel")
    def chat_channel(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "chatChannel"))

    @chat_channel.setter
    def chat_channel(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__158abc16bb3d3ac431ba1e70eb93066b2c54bc6aabc5cb76130a30150973ddec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "chatChannel", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="displayName")
    def display_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "displayName"))

    @display_name.setter
    def display_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1f55ca8f6ca4f0bf94c8dd4bfa0cd15aa1d1b8712b792fb48115373d49bb8644)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "displayName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="engagements")
    def engagements(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "engagements"))

    @engagements.setter
    def engagements(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3d184309e08df41c7a00d188721512a7fba2b04c002fc5bfd5eecc1d6ea1fca3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "engagements", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__77c27f5653ec120eaeac2abe1803e758d5aabe1240c08a6ff5d1a9402292357b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__227555ce7529c77fd1ae768f3b0a5f6309931e7cf6b672235802ec9940a46621)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d74827137689f7a7efa523a7be730672dda9f9ddf93e9dde8fb16685cdce96e1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5aa1011527847729597c54ee6991ba7f8226ef25419745a883d5574de93c65db)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanAction",
    jsii_struct_bases=[],
    name_mapping={"ssm_automation": "ssmAutomation"},
)
class SsmincidentsResponsePlanAction:
    def __init__(
        self,
        *,
        ssm_automation: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmincidentsResponsePlanActionSsmAutomation", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param ssm_automation: ssm_automation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#ssm_automation SsmincidentsResponsePlan#ssm_automation}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__959b07face21df9c8100185c040798be4f407332d89c0ad22367a544d7b13e20)
            check_type(argname="argument ssm_automation", value=ssm_automation, expected_type=type_hints["ssm_automation"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if ssm_automation is not None:
            self._values["ssm_automation"] = ssm_automation

    @builtins.property
    def ssm_automation(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanActionSsmAutomation"]]]:
        '''ssm_automation block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#ssm_automation SsmincidentsResponsePlan#ssm_automation}
        '''
        result = self._values.get("ssm_automation")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanActionSsmAutomation"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmincidentsResponsePlanAction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmincidentsResponsePlanActionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanActionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__93e5e08c6e2e25f84823544a3f74e21934d99c09e4632f4d7d50893df8590307)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putSsmAutomation")
    def put_ssm_automation(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmincidentsResponsePlanActionSsmAutomation", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea8a3a582260c7bfe14ba955b141fa04ee473ec8205e6dedd2fdb271e4713bf6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSsmAutomation", [value]))

    @jsii.member(jsii_name="resetSsmAutomation")
    def reset_ssm_automation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSsmAutomation", []))

    @builtins.property
    @jsii.member(jsii_name="ssmAutomation")
    def ssm_automation(self) -> "SsmincidentsResponsePlanActionSsmAutomationList":
        return typing.cast("SsmincidentsResponsePlanActionSsmAutomationList", jsii.get(self, "ssmAutomation"))

    @builtins.property
    @jsii.member(jsii_name="ssmAutomationInput")
    def ssm_automation_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanActionSsmAutomation"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanActionSsmAutomation"]]], jsii.get(self, "ssmAutomationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[SsmincidentsResponsePlanAction]:
        return typing.cast(typing.Optional[SsmincidentsResponsePlanAction], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SsmincidentsResponsePlanAction],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d59d80c96e7f489e373a7123a23cfcd9c0488a4894408c7d4aaf6ed229b37770)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanActionSsmAutomation",
    jsii_struct_bases=[],
    name_mapping={
        "document_name": "documentName",
        "role_arn": "roleArn",
        "document_version": "documentVersion",
        "dynamic_parameters": "dynamicParameters",
        "parameter": "parameter",
        "target_account": "targetAccount",
    },
)
class SsmincidentsResponsePlanActionSsmAutomation:
    def __init__(
        self,
        *,
        document_name: builtins.str,
        role_arn: builtins.str,
        document_version: typing.Optional[builtins.str] = None,
        dynamic_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmincidentsResponsePlanActionSsmAutomationParameter", typing.Dict[builtins.str, typing.Any]]]]] = None,
        target_account: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param document_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#document_name SsmincidentsResponsePlan#document_name}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#role_arn SsmincidentsResponsePlan#role_arn}.
        :param document_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#document_version SsmincidentsResponsePlan#document_version}.
        :param dynamic_parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#dynamic_parameters SsmincidentsResponsePlan#dynamic_parameters}.
        :param parameter: parameter block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#parameter SsmincidentsResponsePlan#parameter}
        :param target_account: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#target_account SsmincidentsResponsePlan#target_account}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__687cbeeea3d37d6fafbb0b818085897cf4528bfa39ce31b5ec5486c0b87011eb)
            check_type(argname="argument document_name", value=document_name, expected_type=type_hints["document_name"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument document_version", value=document_version, expected_type=type_hints["document_version"])
            check_type(argname="argument dynamic_parameters", value=dynamic_parameters, expected_type=type_hints["dynamic_parameters"])
            check_type(argname="argument parameter", value=parameter, expected_type=type_hints["parameter"])
            check_type(argname="argument target_account", value=target_account, expected_type=type_hints["target_account"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "document_name": document_name,
            "role_arn": role_arn,
        }
        if document_version is not None:
            self._values["document_version"] = document_version
        if dynamic_parameters is not None:
            self._values["dynamic_parameters"] = dynamic_parameters
        if parameter is not None:
            self._values["parameter"] = parameter
        if target_account is not None:
            self._values["target_account"] = target_account

    @builtins.property
    def document_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#document_name SsmincidentsResponsePlan#document_name}.'''
        result = self._values.get("document_name")
        assert result is not None, "Required property 'document_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#role_arn SsmincidentsResponsePlan#role_arn}.'''
        result = self._values.get("role_arn")
        assert result is not None, "Required property 'role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def document_version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#document_version SsmincidentsResponsePlan#document_version}.'''
        result = self._values.get("document_version")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def dynamic_parameters(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#dynamic_parameters SsmincidentsResponsePlan#dynamic_parameters}.'''
        result = self._values.get("dynamic_parameters")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def parameter(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanActionSsmAutomationParameter"]]]:
        '''parameter block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#parameter SsmincidentsResponsePlan#parameter}
        '''
        result = self._values.get("parameter")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanActionSsmAutomationParameter"]]], result)

    @builtins.property
    def target_account(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#target_account SsmincidentsResponsePlan#target_account}.'''
        result = self._values.get("target_account")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmincidentsResponsePlanActionSsmAutomation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmincidentsResponsePlanActionSsmAutomationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanActionSsmAutomationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1be407b3ad02a103d3d7b497be88c2f944946acef22eefa8b298b1842f264fb6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmincidentsResponsePlanActionSsmAutomationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05035d6121ce0d052c886408c8df8558d7ab8e4ff48a4147ac455006307ee9a1)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmincidentsResponsePlanActionSsmAutomationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e7a2b2df1eb24663dc84335520ab91104e54e9203bcf944cd93809f1a289c16e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6c262c7c96cd9fa02b0298acef6890381b5d91bf8493614e653ab94a15847554)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8eed03281d9d50127742abc0697541bd0a15a0e0d803762831f4c2831d6e1a93)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanActionSsmAutomation]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanActionSsmAutomation]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanActionSsmAutomation]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2deef47298ea6494af0e61c86e2a1f00055979e57fbaaac525fda8d690ef6dfd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmincidentsResponsePlanActionSsmAutomationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanActionSsmAutomationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dba00bd93a0a786fa7d34d8e3bb65b1cb64aaadd6827f226254a4289bc132864)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putParameter")
    def put_parameter(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmincidentsResponsePlanActionSsmAutomationParameter", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__007b2d8deb82b9f6ea79f0f6e4873965fe187246b257f323f88c133dfa7b5810)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putParameter", [value]))

    @jsii.member(jsii_name="resetDocumentVersion")
    def reset_document_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDocumentVersion", []))

    @jsii.member(jsii_name="resetDynamicParameters")
    def reset_dynamic_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDynamicParameters", []))

    @jsii.member(jsii_name="resetParameter")
    def reset_parameter(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetParameter", []))

    @jsii.member(jsii_name="resetTargetAccount")
    def reset_target_account(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetAccount", []))

    @builtins.property
    @jsii.member(jsii_name="parameter")
    def parameter(self) -> "SsmincidentsResponsePlanActionSsmAutomationParameterList":
        return typing.cast("SsmincidentsResponsePlanActionSsmAutomationParameterList", jsii.get(self, "parameter"))

    @builtins.property
    @jsii.member(jsii_name="documentNameInput")
    def document_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "documentNameInput"))

    @builtins.property
    @jsii.member(jsii_name="documentVersionInput")
    def document_version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "documentVersionInput"))

    @builtins.property
    @jsii.member(jsii_name="dynamicParametersInput")
    def dynamic_parameters_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "dynamicParametersInput"))

    @builtins.property
    @jsii.member(jsii_name="parameterInput")
    def parameter_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanActionSsmAutomationParameter"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanActionSsmAutomationParameter"]]], jsii.get(self, "parameterInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="targetAccountInput")
    def target_account_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "targetAccountInput"))

    @builtins.property
    @jsii.member(jsii_name="documentName")
    def document_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "documentName"))

    @document_name.setter
    def document_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5bfa639114849fad8f50f3fe68b7508aafaecef08ce80c2655c2f93a7ef10202)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "documentName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="documentVersion")
    def document_version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "documentVersion"))

    @document_version.setter
    def document_version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cfc8180a91890b8f9cbe4670ed529531137399e351ab288d5effc86dffe791eb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "documentVersion", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="dynamicParameters")
    def dynamic_parameters(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "dynamicParameters"))

    @dynamic_parameters.setter
    def dynamic_parameters(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bb90b5d30607d112113aa26b34f98c9cdc669336d9d791ffa1ad51eb9f411aee)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dynamicParameters", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2741fc779b0723ddb397c8466523b8934579dd041cd709fe990f0b123a5d1814)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="targetAccount")
    def target_account(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "targetAccount"))

    @target_account.setter
    def target_account(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca45c6bb894ecf2b38d5bf3d9338c2122217f2a1b9b5c9ea44bb370f9b163bdb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetAccount", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanActionSsmAutomation]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanActionSsmAutomation]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanActionSsmAutomation]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41e39f8e8e9520786acfaa238c28b7a0e3b97f8472cd6d3fb9acfff11c849832)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanActionSsmAutomationParameter",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "values": "values"},
)
class SsmincidentsResponsePlanActionSsmAutomationParameter:
    def __init__(
        self,
        *,
        name: builtins.str,
        values: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#name SsmincidentsResponsePlan#name}.
        :param values: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#values SsmincidentsResponsePlan#values}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c374584405123b000a8a4d6be821b38814026530d47e59327255d1b1fd187a33)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument values", value=values, expected_type=type_hints["values"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "values": values,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#name SsmincidentsResponsePlan#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def values(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#values SsmincidentsResponsePlan#values}.'''
        result = self._values.get("values")
        assert result is not None, "Required property 'values' is missing"
        return typing.cast(typing.List[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmincidentsResponsePlanActionSsmAutomationParameter(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmincidentsResponsePlanActionSsmAutomationParameterList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanActionSsmAutomationParameterList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d7f106857e563e1181d139bcc6d1188ba371e2210364dbb2548fbd8df21be754)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmincidentsResponsePlanActionSsmAutomationParameterOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b33737480eeb828db02ef3453146cb0958657838becb8acafed1e026b93ea06a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmincidentsResponsePlanActionSsmAutomationParameterOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0c8952e9bfa841f9df9c35fa1cea3df03cc35dfa1449c90e59d4eee4e82482a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bc0fa2a83a800c6df155999fc61f1ea06f9a78d06b1fdd36002fbd96cfb44378)
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
            type_hints = typing.get_type_hints(_typecheckingstub__eaf7f5d58f6d44c922eaa308a3fa9524ce047bdd92231d55a1d8e853c7f7471f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanActionSsmAutomationParameter]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanActionSsmAutomationParameter]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanActionSsmAutomationParameter]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__71b9bfe49b401341953d44eeaa81fdc4e97642bdd683b012d95bbb4c8b7ca832)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmincidentsResponsePlanActionSsmAutomationParameterOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanActionSsmAutomationParameterOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c3b47a24d9b30f65781e58f420e7a3eeb3ac39da66e9a523c40873bf188af85e)
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
    @jsii.member(jsii_name="valuesInput")
    def values_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "valuesInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fbb9a39703b42364b5ebb52365f4e25034855eb3e2823d42f3b1ff7e613a4a1b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="values")
    def values(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "values"))

    @values.setter
    def values(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__153beaf56a5223c0efa7dde9ebe75c74682f78909983c16e44b4952f40892a26)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "values", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanActionSsmAutomationParameter]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanActionSsmAutomationParameter]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanActionSsmAutomationParameter]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e2f541a2fc205de53f3a9d3d78e56ff9d9c29f1b292472da62d1bdf28ee529b8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "incident_template": "incidentTemplate",
        "name": "name",
        "action": "action",
        "chat_channel": "chatChannel",
        "display_name": "displayName",
        "engagements": "engagements",
        "id": "id",
        "integration": "integration",
        "tags": "tags",
        "tags_all": "tagsAll",
    },
)
class SsmincidentsResponsePlanConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        incident_template: typing.Union["SsmincidentsResponsePlanIncidentTemplate", typing.Dict[builtins.str, typing.Any]],
        name: builtins.str,
        action: typing.Optional[typing.Union[SsmincidentsResponsePlanAction, typing.Dict[builtins.str, typing.Any]]] = None,
        chat_channel: typing.Optional[typing.Sequence[builtins.str]] = None,
        display_name: typing.Optional[builtins.str] = None,
        engagements: typing.Optional[typing.Sequence[builtins.str]] = None,
        id: typing.Optional[builtins.str] = None,
        integration: typing.Optional[typing.Union["SsmincidentsResponsePlanIntegration", typing.Dict[builtins.str, typing.Any]]] = None,
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
        :param incident_template: incident_template block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#incident_template SsmincidentsResponsePlan#incident_template}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#name SsmincidentsResponsePlan#name}.
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#action SsmincidentsResponsePlan#action}
        :param chat_channel: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#chat_channel SsmincidentsResponsePlan#chat_channel}.
        :param display_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#display_name SsmincidentsResponsePlan#display_name}.
        :param engagements: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#engagements SsmincidentsResponsePlan#engagements}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#id SsmincidentsResponsePlan#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param integration: integration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#integration SsmincidentsResponsePlan#integration}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#tags SsmincidentsResponsePlan#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#tags_all SsmincidentsResponsePlan#tags_all}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(incident_template, dict):
            incident_template = SsmincidentsResponsePlanIncidentTemplate(**incident_template)
        if isinstance(action, dict):
            action = SsmincidentsResponsePlanAction(**action)
        if isinstance(integration, dict):
            integration = SsmincidentsResponsePlanIntegration(**integration)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e09babf5a7e252a93188edf171afd711c9e00d6f9d89b35520f0a1719e81963)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument incident_template", value=incident_template, expected_type=type_hints["incident_template"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument action", value=action, expected_type=type_hints["action"])
            check_type(argname="argument chat_channel", value=chat_channel, expected_type=type_hints["chat_channel"])
            check_type(argname="argument display_name", value=display_name, expected_type=type_hints["display_name"])
            check_type(argname="argument engagements", value=engagements, expected_type=type_hints["engagements"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument integration", value=integration, expected_type=type_hints["integration"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "incident_template": incident_template,
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
        if action is not None:
            self._values["action"] = action
        if chat_channel is not None:
            self._values["chat_channel"] = chat_channel
        if display_name is not None:
            self._values["display_name"] = display_name
        if engagements is not None:
            self._values["engagements"] = engagements
        if id is not None:
            self._values["id"] = id
        if integration is not None:
            self._values["integration"] = integration
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
    def incident_template(self) -> "SsmincidentsResponsePlanIncidentTemplate":
        '''incident_template block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#incident_template SsmincidentsResponsePlan#incident_template}
        '''
        result = self._values.get("incident_template")
        assert result is not None, "Required property 'incident_template' is missing"
        return typing.cast("SsmincidentsResponsePlanIncidentTemplate", result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#name SsmincidentsResponsePlan#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def action(self) -> typing.Optional[SsmincidentsResponsePlanAction]:
        '''action block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#action SsmincidentsResponsePlan#action}
        '''
        result = self._values.get("action")
        return typing.cast(typing.Optional[SsmincidentsResponsePlanAction], result)

    @builtins.property
    def chat_channel(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#chat_channel SsmincidentsResponsePlan#chat_channel}.'''
        result = self._values.get("chat_channel")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def display_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#display_name SsmincidentsResponsePlan#display_name}.'''
        result = self._values.get("display_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def engagements(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#engagements SsmincidentsResponsePlan#engagements}.'''
        result = self._values.get("engagements")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#id SsmincidentsResponsePlan#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def integration(self) -> typing.Optional["SsmincidentsResponsePlanIntegration"]:
        '''integration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#integration SsmincidentsResponsePlan#integration}
        '''
        result = self._values.get("integration")
        return typing.cast(typing.Optional["SsmincidentsResponsePlanIntegration"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#tags SsmincidentsResponsePlan#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#tags_all SsmincidentsResponsePlan#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmincidentsResponsePlanConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIncidentTemplate",
    jsii_struct_bases=[],
    name_mapping={
        "impact": "impact",
        "title": "title",
        "dedupe_string": "dedupeString",
        "incident_tags": "incidentTags",
        "notification_target": "notificationTarget",
        "summary": "summary",
    },
)
class SsmincidentsResponsePlanIncidentTemplate:
    def __init__(
        self,
        *,
        impact: jsii.Number,
        title: builtins.str,
        dedupe_string: typing.Optional[builtins.str] = None,
        incident_tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        notification_target: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmincidentsResponsePlanIncidentTemplateNotificationTarget", typing.Dict[builtins.str, typing.Any]]]]] = None,
        summary: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param impact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#impact SsmincidentsResponsePlan#impact}.
        :param title: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#title SsmincidentsResponsePlan#title}.
        :param dedupe_string: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#dedupe_string SsmincidentsResponsePlan#dedupe_string}.
        :param incident_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#incident_tags SsmincidentsResponsePlan#incident_tags}.
        :param notification_target: notification_target block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#notification_target SsmincidentsResponsePlan#notification_target}
        :param summary: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#summary SsmincidentsResponsePlan#summary}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8f9e12bc3cf636bff015a2ce6e26512d5d44e54826d4272b1cd56ead4f1c64f4)
            check_type(argname="argument impact", value=impact, expected_type=type_hints["impact"])
            check_type(argname="argument title", value=title, expected_type=type_hints["title"])
            check_type(argname="argument dedupe_string", value=dedupe_string, expected_type=type_hints["dedupe_string"])
            check_type(argname="argument incident_tags", value=incident_tags, expected_type=type_hints["incident_tags"])
            check_type(argname="argument notification_target", value=notification_target, expected_type=type_hints["notification_target"])
            check_type(argname="argument summary", value=summary, expected_type=type_hints["summary"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "impact": impact,
            "title": title,
        }
        if dedupe_string is not None:
            self._values["dedupe_string"] = dedupe_string
        if incident_tags is not None:
            self._values["incident_tags"] = incident_tags
        if notification_target is not None:
            self._values["notification_target"] = notification_target
        if summary is not None:
            self._values["summary"] = summary

    @builtins.property
    def impact(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#impact SsmincidentsResponsePlan#impact}.'''
        result = self._values.get("impact")
        assert result is not None, "Required property 'impact' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def title(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#title SsmincidentsResponsePlan#title}.'''
        result = self._values.get("title")
        assert result is not None, "Required property 'title' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def dedupe_string(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#dedupe_string SsmincidentsResponsePlan#dedupe_string}.'''
        result = self._values.get("dedupe_string")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def incident_tags(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#incident_tags SsmincidentsResponsePlan#incident_tags}.'''
        result = self._values.get("incident_tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def notification_target(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanIncidentTemplateNotificationTarget"]]]:
        '''notification_target block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#notification_target SsmincidentsResponsePlan#notification_target}
        '''
        result = self._values.get("notification_target")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanIncidentTemplateNotificationTarget"]]], result)

    @builtins.property
    def summary(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#summary SsmincidentsResponsePlan#summary}.'''
        result = self._values.get("summary")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmincidentsResponsePlanIncidentTemplate(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIncidentTemplateNotificationTarget",
    jsii_struct_bases=[],
    name_mapping={"sns_topic_arn": "snsTopicArn"},
)
class SsmincidentsResponsePlanIncidentTemplateNotificationTarget:
    def __init__(self, *, sns_topic_arn: builtins.str) -> None:
        '''
        :param sns_topic_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#sns_topic_arn SsmincidentsResponsePlan#sns_topic_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__14ab13c18c277d2aaade102d03cf41ed1dd7331239b9c687e6c5226b10fe9381)
            check_type(argname="argument sns_topic_arn", value=sns_topic_arn, expected_type=type_hints["sns_topic_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "sns_topic_arn": sns_topic_arn,
        }

    @builtins.property
    def sns_topic_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#sns_topic_arn SsmincidentsResponsePlan#sns_topic_arn}.'''
        result = self._values.get("sns_topic_arn")
        assert result is not None, "Required property 'sns_topic_arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmincidentsResponsePlanIncidentTemplateNotificationTarget(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmincidentsResponsePlanIncidentTemplateNotificationTargetList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIncidentTemplateNotificationTargetList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6c7bf2762f764559a1988873f733d4ed9b0059b51256d6e9583afed12a0eaf2e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmincidentsResponsePlanIncidentTemplateNotificationTargetOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bb9a792af9a4054b58f6f33cd7d8b68ef19f80788616628fb657cec9935e9bf6)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmincidentsResponsePlanIncidentTemplateNotificationTargetOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0172b29c341034187d97d2f1476e4247ca04db3acca9da4761be8e1e6e29bb8c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__529b17d906a7489a65f86828726c8154f232a6b44b791ae0db90517023f0e7c1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d3991fe86ad68f14c993e749a5704710cbd99a4e70c642c06f0f7e7b709d50ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanIncidentTemplateNotificationTarget]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanIncidentTemplateNotificationTarget]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanIncidentTemplateNotificationTarget]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e3b3022b62c884dffc7c4f04755431de80e595520aa5326291652e7954cb8503)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmincidentsResponsePlanIncidentTemplateNotificationTargetOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIncidentTemplateNotificationTargetOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__502d2792a5a16d4c9a37621c6aa3e2a4d57d2121089a38bc36202d97503dc3ee)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="snsTopicArnInput")
    def sns_topic_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "snsTopicArnInput"))

    @builtins.property
    @jsii.member(jsii_name="snsTopicArn")
    def sns_topic_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "snsTopicArn"))

    @sns_topic_arn.setter
    def sns_topic_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c5503cd714fa7ec8f018a981b5c48fe88496303cbb9e9be5e15dd2384b801a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "snsTopicArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanIncidentTemplateNotificationTarget]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanIncidentTemplateNotificationTarget]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanIncidentTemplateNotificationTarget]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ffd7c068b804775380423db4654d00d102598fd8c8b9442bdbed81d4f508c9f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmincidentsResponsePlanIncidentTemplateOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIncidentTemplateOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5cef3091b409efc553190cd523d116884c6149d8f114eec7f4d6d994cd02610e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putNotificationTarget")
    def put_notification_target(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmincidentsResponsePlanIncidentTemplateNotificationTarget, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0eb4ba4760012db34e006932eae120569ca2e8d5641006c79f8c02e32bfddec9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putNotificationTarget", [value]))

    @jsii.member(jsii_name="resetDedupeString")
    def reset_dedupe_string(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDedupeString", []))

    @jsii.member(jsii_name="resetIncidentTags")
    def reset_incident_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIncidentTags", []))

    @jsii.member(jsii_name="resetNotificationTarget")
    def reset_notification_target(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNotificationTarget", []))

    @jsii.member(jsii_name="resetSummary")
    def reset_summary(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSummary", []))

    @builtins.property
    @jsii.member(jsii_name="notificationTarget")
    def notification_target(
        self,
    ) -> SsmincidentsResponsePlanIncidentTemplateNotificationTargetList:
        return typing.cast(SsmincidentsResponsePlanIncidentTemplateNotificationTargetList, jsii.get(self, "notificationTarget"))

    @builtins.property
    @jsii.member(jsii_name="dedupeStringInput")
    def dedupe_string_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dedupeStringInput"))

    @builtins.property
    @jsii.member(jsii_name="impactInput")
    def impact_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "impactInput"))

    @builtins.property
    @jsii.member(jsii_name="incidentTagsInput")
    def incident_tags_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "incidentTagsInput"))

    @builtins.property
    @jsii.member(jsii_name="notificationTargetInput")
    def notification_target_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanIncidentTemplateNotificationTarget]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanIncidentTemplateNotificationTarget]]], jsii.get(self, "notificationTargetInput"))

    @builtins.property
    @jsii.member(jsii_name="summaryInput")
    def summary_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "summaryInput"))

    @builtins.property
    @jsii.member(jsii_name="titleInput")
    def title_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "titleInput"))

    @builtins.property
    @jsii.member(jsii_name="dedupeString")
    def dedupe_string(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dedupeString"))

    @dedupe_string.setter
    def dedupe_string(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f9a7f10b3f27655d84af4fe9e7913a68014fe187b6fd4870eaac3d9488e6b871)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dedupeString", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="impact")
    def impact(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "impact"))

    @impact.setter
    def impact(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c5f1168ad36fac25cc80584fb7452af25a5ee46b797f96c7e28a96858c4c499)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "impact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="incidentTags")
    def incident_tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "incidentTags"))

    @incident_tags.setter
    def incident_tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__65385757dcec9f2c5b13138b2009cd4379c4d47f6b92c2aa00d9e521f0be08eb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "incidentTags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="summary")
    def summary(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "summary"))

    @summary.setter
    def summary(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d4c9083d179d51f262ed3d60061cc7f5c61b40a63e04ebe132c2e6aa59308486)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "summary", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="title")
    def title(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "title"))

    @title.setter
    def title(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9fbea01827c315593843245364cb712a2141e40bbb05f09da99bd00b0fff1f2e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "title", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SsmincidentsResponsePlanIncidentTemplate]:
        return typing.cast(typing.Optional[SsmincidentsResponsePlanIncidentTemplate], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SsmincidentsResponsePlanIncidentTemplate],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__26a3df94236188313b2533346eec1fbb5a7c5591c7a1270495f04d74881f7b86)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIntegration",
    jsii_struct_bases=[],
    name_mapping={"pagerduty": "pagerduty"},
)
class SsmincidentsResponsePlanIntegration:
    def __init__(
        self,
        *,
        pagerduty: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmincidentsResponsePlanIntegrationPagerduty", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param pagerduty: pagerduty block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#pagerduty SsmincidentsResponsePlan#pagerduty}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a3e6d12ed243bca990ae11c35ede9ad1b6464373f2e3181fe2cc4859ca087ee)
            check_type(argname="argument pagerduty", value=pagerduty, expected_type=type_hints["pagerduty"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if pagerduty is not None:
            self._values["pagerduty"] = pagerduty

    @builtins.property
    def pagerduty(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanIntegrationPagerduty"]]]:
        '''pagerduty block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#pagerduty SsmincidentsResponsePlan#pagerduty}
        '''
        result = self._values.get("pagerduty")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanIntegrationPagerduty"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmincidentsResponsePlanIntegration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmincidentsResponsePlanIntegrationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIntegrationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__acf9c613934227e76bd8b15cc725fbb459b17999af5f06981e93634aaeee768b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putPagerduty")
    def put_pagerduty(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SsmincidentsResponsePlanIntegrationPagerduty", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0fe751f7d5e4b9fa84cf9920239e924c2c3d421b49d9e57a2b9c5a458446c5f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPagerduty", [value]))

    @jsii.member(jsii_name="resetPagerduty")
    def reset_pagerduty(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPagerduty", []))

    @builtins.property
    @jsii.member(jsii_name="pagerduty")
    def pagerduty(self) -> "SsmincidentsResponsePlanIntegrationPagerdutyList":
        return typing.cast("SsmincidentsResponsePlanIntegrationPagerdutyList", jsii.get(self, "pagerduty"))

    @builtins.property
    @jsii.member(jsii_name="pagerdutyInput")
    def pagerduty_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanIntegrationPagerduty"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SsmincidentsResponsePlanIntegrationPagerduty"]]], jsii.get(self, "pagerdutyInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[SsmincidentsResponsePlanIntegration]:
        return typing.cast(typing.Optional[SsmincidentsResponsePlanIntegration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SsmincidentsResponsePlanIntegration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67c87c78dc8ace7058b5b44b01fcdb0df6d5ca9f4b8cd019061dc3d3fbb9af8a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIntegrationPagerduty",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "secret_id": "secretId", "service_id": "serviceId"},
)
class SsmincidentsResponsePlanIntegrationPagerduty:
    def __init__(
        self,
        *,
        name: builtins.str,
        secret_id: builtins.str,
        service_id: builtins.str,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#name SsmincidentsResponsePlan#name}.
        :param secret_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#secret_id SsmincidentsResponsePlan#secret_id}.
        :param service_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#service_id SsmincidentsResponsePlan#service_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b22cfede0d3900a1c3af64890815ac5b72a5af52f7f1539920c7db3cae713d7f)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument secret_id", value=secret_id, expected_type=type_hints["secret_id"])
            check_type(argname="argument service_id", value=service_id, expected_type=type_hints["service_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "secret_id": secret_id,
            "service_id": service_id,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#name SsmincidentsResponsePlan#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def secret_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#secret_id SsmincidentsResponsePlan#secret_id}.'''
        result = self._values.get("secret_id")
        assert result is not None, "Required property 'secret_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def service_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#service_id SsmincidentsResponsePlan#service_id}.'''
        result = self._values.get("service_id")
        assert result is not None, "Required property 'service_id' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SsmincidentsResponsePlanIntegrationPagerduty(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SsmincidentsResponsePlanIntegrationPagerdutyList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIntegrationPagerdutyList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f7bf1771ea08930670eab6ccc3c203c2578eeefc4f52edec74f46a69641e6c5e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SsmincidentsResponsePlanIntegrationPagerdutyOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__023274e9b89141a0a7708ac6923aefa724cc6982c01d1d35f3658e073dcdda29)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SsmincidentsResponsePlanIntegrationPagerdutyOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__11fbfa8545d7ed699f669341d4ff72fe787e4c804a7010f550ad9210073ea156)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a75ff7fc776677c783be1139d5d965fe99fce93adc8c89d96642d9d3d347f1ef)
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
            type_hints = typing.get_type_hints(_typecheckingstub__093b58f8a23bc1f8f6b6c218ad276afd8f38b46edde29aecf038133765997744)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanIntegrationPagerduty]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanIntegrationPagerduty]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanIntegrationPagerduty]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dfaf2051d5e1d9311cdffa07ba90c032df8beafbbfec9627ae171800e843388a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SsmincidentsResponsePlanIntegrationPagerdutyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIntegrationPagerdutyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__12a4736deae459fcc17abddeed9635be630198920770918e089521fc276a8281)
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
    @jsii.member(jsii_name="secretIdInput")
    def secret_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "secretIdInput"))

    @builtins.property
    @jsii.member(jsii_name="serviceIdInput")
    def service_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "serviceIdInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1b07aa9eff3e079fd6af934b1ca83fbd8fbad966238be03b8ffd56a57069128)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="secretId")
    def secret_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "secretId"))

    @secret_id.setter
    def secret_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5850eee841aa25e439f2479155f1fee036deef9111f9a0129e69a35885021b14)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "secretId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="serviceId")
    def service_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "serviceId"))

    @service_id.setter
    def service_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba6f047d51ab6a713f0d046ddd659bb03f69aff39b65074d2bbabaf929864218)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "serviceId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanIntegrationPagerduty]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanIntegrationPagerduty]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanIntegrationPagerduty]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9361d7db6c719b12e7da20a70df35f4ae9beea33e9930dc3a05593d02fb2e685)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "SsmincidentsResponsePlan",
    "SsmincidentsResponsePlanAction",
    "SsmincidentsResponsePlanActionOutputReference",
    "SsmincidentsResponsePlanActionSsmAutomation",
    "SsmincidentsResponsePlanActionSsmAutomationList",
    "SsmincidentsResponsePlanActionSsmAutomationOutputReference",
    "SsmincidentsResponsePlanActionSsmAutomationParameter",
    "SsmincidentsResponsePlanActionSsmAutomationParameterList",
    "SsmincidentsResponsePlanActionSsmAutomationParameterOutputReference",
    "SsmincidentsResponsePlanConfig",
    "SsmincidentsResponsePlanIncidentTemplate",
    "SsmincidentsResponsePlanIncidentTemplateNotificationTarget",
    "SsmincidentsResponsePlanIncidentTemplateNotificationTargetList",
    "SsmincidentsResponsePlanIncidentTemplateNotificationTargetOutputReference",
    "SsmincidentsResponsePlanIncidentTemplateOutputReference",
    "SsmincidentsResponsePlanIntegration",
    "SsmincidentsResponsePlanIntegrationOutputReference",
    "SsmincidentsResponsePlanIntegrationPagerduty",
    "SsmincidentsResponsePlanIntegrationPagerdutyList",
    "SsmincidentsResponsePlanIntegrationPagerdutyOutputReference",
]

publication.publish()

def _typecheckingstub__285bbf48c4d82b59798c63d2ace89cf16935e59b0f8e323fbbfaacd7760bc58a(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    incident_template: typing.Union[SsmincidentsResponsePlanIncidentTemplate, typing.Dict[builtins.str, typing.Any]],
    name: builtins.str,
    action: typing.Optional[typing.Union[SsmincidentsResponsePlanAction, typing.Dict[builtins.str, typing.Any]]] = None,
    chat_channel: typing.Optional[typing.Sequence[builtins.str]] = None,
    display_name: typing.Optional[builtins.str] = None,
    engagements: typing.Optional[typing.Sequence[builtins.str]] = None,
    id: typing.Optional[builtins.str] = None,
    integration: typing.Optional[typing.Union[SsmincidentsResponsePlanIntegration, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__4ec448c62a189c9b350e091456cbd89b6ec5086c853b257ebd7343de2d30f7ab(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__158abc16bb3d3ac431ba1e70eb93066b2c54bc6aabc5cb76130a30150973ddec(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f55ca8f6ca4f0bf94c8dd4bfa0cd15aa1d1b8712b792fb48115373d49bb8644(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3d184309e08df41c7a00d188721512a7fba2b04c002fc5bfd5eecc1d6ea1fca3(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77c27f5653ec120eaeac2abe1803e758d5aabe1240c08a6ff5d1a9402292357b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__227555ce7529c77fd1ae768f3b0a5f6309931e7cf6b672235802ec9940a46621(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d74827137689f7a7efa523a7be730672dda9f9ddf93e9dde8fb16685cdce96e1(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5aa1011527847729597c54ee6991ba7f8226ef25419745a883d5574de93c65db(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__959b07face21df9c8100185c040798be4f407332d89c0ad22367a544d7b13e20(
    *,
    ssm_automation: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmincidentsResponsePlanActionSsmAutomation, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93e5e08c6e2e25f84823544a3f74e21934d99c09e4632f4d7d50893df8590307(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea8a3a582260c7bfe14ba955b141fa04ee473ec8205e6dedd2fdb271e4713bf6(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmincidentsResponsePlanActionSsmAutomation, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d59d80c96e7f489e373a7123a23cfcd9c0488a4894408c7d4aaf6ed229b37770(
    value: typing.Optional[SsmincidentsResponsePlanAction],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__687cbeeea3d37d6fafbb0b818085897cf4528bfa39ce31b5ec5486c0b87011eb(
    *,
    document_name: builtins.str,
    role_arn: builtins.str,
    document_version: typing.Optional[builtins.str] = None,
    dynamic_parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    parameter: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmincidentsResponsePlanActionSsmAutomationParameter, typing.Dict[builtins.str, typing.Any]]]]] = None,
    target_account: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1be407b3ad02a103d3d7b497be88c2f944946acef22eefa8b298b1842f264fb6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05035d6121ce0d052c886408c8df8558d7ab8e4ff48a4147ac455006307ee9a1(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7a2b2df1eb24663dc84335520ab91104e54e9203bcf944cd93809f1a289c16e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c262c7c96cd9fa02b0298acef6890381b5d91bf8493614e653ab94a15847554(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8eed03281d9d50127742abc0697541bd0a15a0e0d803762831f4c2831d6e1a93(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2deef47298ea6494af0e61c86e2a1f00055979e57fbaaac525fda8d690ef6dfd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanActionSsmAutomation]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dba00bd93a0a786fa7d34d8e3bb65b1cb64aaadd6827f226254a4289bc132864(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__007b2d8deb82b9f6ea79f0f6e4873965fe187246b257f323f88c133dfa7b5810(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmincidentsResponsePlanActionSsmAutomationParameter, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5bfa639114849fad8f50f3fe68b7508aafaecef08ce80c2655c2f93a7ef10202(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cfc8180a91890b8f9cbe4670ed529531137399e351ab288d5effc86dffe791eb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb90b5d30607d112113aa26b34f98c9cdc669336d9d791ffa1ad51eb9f411aee(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2741fc779b0723ddb397c8466523b8934579dd041cd709fe990f0b123a5d1814(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca45c6bb894ecf2b38d5bf3d9338c2122217f2a1b9b5c9ea44bb370f9b163bdb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41e39f8e8e9520786acfaa238c28b7a0e3b97f8472cd6d3fb9acfff11c849832(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanActionSsmAutomation]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c374584405123b000a8a4d6be821b38814026530d47e59327255d1b1fd187a33(
    *,
    name: builtins.str,
    values: typing.Sequence[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7f106857e563e1181d139bcc6d1188ba371e2210364dbb2548fbd8df21be754(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b33737480eeb828db02ef3453146cb0958657838becb8acafed1e026b93ea06a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0c8952e9bfa841f9df9c35fa1cea3df03cc35dfa1449c90e59d4eee4e82482a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc0fa2a83a800c6df155999fc61f1ea06f9a78d06b1fdd36002fbd96cfb44378(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eaf7f5d58f6d44c922eaa308a3fa9524ce047bdd92231d55a1d8e853c7f7471f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__71b9bfe49b401341953d44eeaa81fdc4e97642bdd683b012d95bbb4c8b7ca832(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanActionSsmAutomationParameter]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3b47a24d9b30f65781e58f420e7a3eeb3ac39da66e9a523c40873bf188af85e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fbb9a39703b42364b5ebb52365f4e25034855eb3e2823d42f3b1ff7e613a4a1b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__153beaf56a5223c0efa7dde9ebe75c74682f78909983c16e44b4952f40892a26(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2f541a2fc205de53f3a9d3d78e56ff9d9c29f1b292472da62d1bdf28ee529b8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanActionSsmAutomationParameter]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e09babf5a7e252a93188edf171afd711c9e00d6f9d89b35520f0a1719e81963(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    incident_template: typing.Union[SsmincidentsResponsePlanIncidentTemplate, typing.Dict[builtins.str, typing.Any]],
    name: builtins.str,
    action: typing.Optional[typing.Union[SsmincidentsResponsePlanAction, typing.Dict[builtins.str, typing.Any]]] = None,
    chat_channel: typing.Optional[typing.Sequence[builtins.str]] = None,
    display_name: typing.Optional[builtins.str] = None,
    engagements: typing.Optional[typing.Sequence[builtins.str]] = None,
    id: typing.Optional[builtins.str] = None,
    integration: typing.Optional[typing.Union[SsmincidentsResponsePlanIntegration, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f9e12bc3cf636bff015a2ce6e26512d5d44e54826d4272b1cd56ead4f1c64f4(
    *,
    impact: jsii.Number,
    title: builtins.str,
    dedupe_string: typing.Optional[builtins.str] = None,
    incident_tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    notification_target: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmincidentsResponsePlanIncidentTemplateNotificationTarget, typing.Dict[builtins.str, typing.Any]]]]] = None,
    summary: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14ab13c18c277d2aaade102d03cf41ed1dd7331239b9c687e6c5226b10fe9381(
    *,
    sns_topic_arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c7bf2762f764559a1988873f733d4ed9b0059b51256d6e9583afed12a0eaf2e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb9a792af9a4054b58f6f33cd7d8b68ef19f80788616628fb657cec9935e9bf6(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0172b29c341034187d97d2f1476e4247ca04db3acca9da4761be8e1e6e29bb8c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__529b17d906a7489a65f86828726c8154f232a6b44b791ae0db90517023f0e7c1(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3991fe86ad68f14c993e749a5704710cbd99a4e70c642c06f0f7e7b709d50ff(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3b3022b62c884dffc7c4f04755431de80e595520aa5326291652e7954cb8503(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanIncidentTemplateNotificationTarget]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__502d2792a5a16d4c9a37621c6aa3e2a4d57d2121089a38bc36202d97503dc3ee(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c5503cd714fa7ec8f018a981b5c48fe88496303cbb9e9be5e15dd2384b801a4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ffd7c068b804775380423db4654d00d102598fd8c8b9442bdbed81d4f508c9f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanIncidentTemplateNotificationTarget]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5cef3091b409efc553190cd523d116884c6149d8f114eec7f4d6d994cd02610e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0eb4ba4760012db34e006932eae120569ca2e8d5641006c79f8c02e32bfddec9(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmincidentsResponsePlanIncidentTemplateNotificationTarget, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9a7f10b3f27655d84af4fe9e7913a68014fe187b6fd4870eaac3d9488e6b871(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c5f1168ad36fac25cc80584fb7452af25a5ee46b797f96c7e28a96858c4c499(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65385757dcec9f2c5b13138b2009cd4379c4d47f6b92c2aa00d9e521f0be08eb(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4c9083d179d51f262ed3d60061cc7f5c61b40a63e04ebe132c2e6aa59308486(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9fbea01827c315593843245364cb712a2141e40bbb05f09da99bd00b0fff1f2e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__26a3df94236188313b2533346eec1fbb5a7c5591c7a1270495f04d74881f7b86(
    value: typing.Optional[SsmincidentsResponsePlanIncidentTemplate],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a3e6d12ed243bca990ae11c35ede9ad1b6464373f2e3181fe2cc4859ca087ee(
    *,
    pagerduty: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmincidentsResponsePlanIntegrationPagerduty, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__acf9c613934227e76bd8b15cc725fbb459b17999af5f06981e93634aaeee768b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0fe751f7d5e4b9fa84cf9920239e924c2c3d421b49d9e57a2b9c5a458446c5f4(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SsmincidentsResponsePlanIntegrationPagerduty, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67c87c78dc8ace7058b5b44b01fcdb0df6d5ca9f4b8cd019061dc3d3fbb9af8a(
    value: typing.Optional[SsmincidentsResponsePlanIntegration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b22cfede0d3900a1c3af64890815ac5b72a5af52f7f1539920c7db3cae713d7f(
    *,
    name: builtins.str,
    secret_id: builtins.str,
    service_id: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7bf1771ea08930670eab6ccc3c203c2578eeefc4f52edec74f46a69641e6c5e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__023274e9b89141a0a7708ac6923aefa724cc6982c01d1d35f3658e073dcdda29(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__11fbfa8545d7ed699f669341d4ff72fe787e4c804a7010f550ad9210073ea156(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a75ff7fc776677c783be1139d5d965fe99fce93adc8c89d96642d9d3d347f1ef(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__093b58f8a23bc1f8f6b6c218ad276afd8f38b46edde29aecf038133765997744(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dfaf2051d5e1d9311cdffa07ba90c032df8beafbbfec9627ae171800e843388a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SsmincidentsResponsePlanIntegrationPagerduty]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12a4736deae459fcc17abddeed9635be630198920770918e089521fc276a8281(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1b07aa9eff3e079fd6af934b1ca83fbd8fbad966238be03b8ffd56a57069128(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5850eee841aa25e439f2479155f1fee036deef9111f9a0129e69a35885021b14(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba6f047d51ab6a713f0d046ddd659bb03f69aff39b65074d2bbabaf929864218(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9361d7db6c719b12e7da20a70df35f4ae9beea33e9930dc3a05593d02fb2e685(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SsmincidentsResponsePlanIntegrationPagerduty]],
) -> None:
    """Type checking stubs"""
    pass
