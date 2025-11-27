r'''
# `aws_securityhub_automation_rule`

Refer to the Terraform Registry for docs: [`aws_securityhub_automation_rule`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule).
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


class SecurityhubAutomationRule(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRule",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule aws_securityhub_automation_rule}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        description: builtins.str,
        rule_name: builtins.str,
        rule_order: jsii.Number,
        actions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleActions", typing.Dict[builtins.str, typing.Any]]]]] = None,
        criteria: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteria", typing.Dict[builtins.str, typing.Any]]]]] = None,
        is_terminal: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        rule_status: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule aws_securityhub_automation_rule} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#description SecurityhubAutomationRule#description}.
        :param rule_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#rule_name SecurityhubAutomationRule#rule_name}.
        :param rule_order: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#rule_order SecurityhubAutomationRule#rule_order}.
        :param actions: actions block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#actions SecurityhubAutomationRule#actions}
        :param criteria: criteria block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#criteria SecurityhubAutomationRule#criteria}
        :param is_terminal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#is_terminal SecurityhubAutomationRule#is_terminal}.
        :param rule_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#rule_status SecurityhubAutomationRule#rule_status}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#tags SecurityhubAutomationRule#tags}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4bc727a8ea3b105415349954ac6ea04e0ed935ba8c46eb082e197ed4f227cfd)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = SecurityhubAutomationRuleConfig(
            description=description,
            rule_name=rule_name,
            rule_order=rule_order,
            actions=actions,
            criteria=criteria,
            is_terminal=is_terminal,
            rule_status=rule_status,
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
        '''Generates CDKTF code for importing a SecurityhubAutomationRule resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the SecurityhubAutomationRule to import.
        :param import_from_id: The id of the existing SecurityhubAutomationRule that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the SecurityhubAutomationRule to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff940a62db3738588a6e2913070f4e04240d51a9d274ac1943af6fd06008a655)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putActions")
    def put_actions(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleActions", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__72d2290193b13ff4047164968df301ed184f1f7a1bf7ec911ebd3c69be1724fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putActions", [value]))

    @jsii.member(jsii_name="putCriteria")
    def put_criteria(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteria", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2cda30dd8611dac89d0f576dcbce075b7341da25582fbcae968c4149508f0517)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCriteria", [value]))

    @jsii.member(jsii_name="resetActions")
    def reset_actions(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetActions", []))

    @jsii.member(jsii_name="resetCriteria")
    def reset_criteria(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCriteria", []))

    @jsii.member(jsii_name="resetIsTerminal")
    def reset_is_terminal(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIsTerminal", []))

    @jsii.member(jsii_name="resetRuleStatus")
    def reset_rule_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRuleStatus", []))

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
    @jsii.member(jsii_name="actions")
    def actions(self) -> "SecurityhubAutomationRuleActionsList":
        return typing.cast("SecurityhubAutomationRuleActionsList", jsii.get(self, "actions"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @builtins.property
    @jsii.member(jsii_name="criteria")
    def criteria(self) -> "SecurityhubAutomationRuleCriteriaList":
        return typing.cast("SecurityhubAutomationRuleCriteriaList", jsii.get(self, "criteria"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> _cdktf_9a9027ec.StringMap:
        return typing.cast(_cdktf_9a9027ec.StringMap, jsii.get(self, "tagsAll"))

    @builtins.property
    @jsii.member(jsii_name="actionsInput")
    def actions_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActions"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActions"]]], jsii.get(self, "actionsInput"))

    @builtins.property
    @jsii.member(jsii_name="criteriaInput")
    def criteria_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteria"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteria"]]], jsii.get(self, "criteriaInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="isTerminalInput")
    def is_terminal_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "isTerminalInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleNameInput")
    def rule_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ruleNameInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleOrderInput")
    def rule_order_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "ruleOrderInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleStatusInput")
    def rule_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ruleStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__10a97298dcf1cc6637e09492428d4ebfe90e31070a6938474eed8fd0989893b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="isTerminal")
    def is_terminal(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "isTerminal"))

    @is_terminal.setter
    def is_terminal(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__789ebb7edb3aae3e9bb5dde3211e2d3dfd8a700854de0a65600607787619aaa0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "isTerminal", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ruleName")
    def rule_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ruleName"))

    @rule_name.setter
    def rule_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f5de3350933b7bddeba4e267397514c95ef606e2d7e8dee24b882544492478f2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ruleName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ruleOrder")
    def rule_order(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "ruleOrder"))

    @rule_order.setter
    def rule_order(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6cac391eedc6938ba1fc0ec356f382a3536645a6802f0fee187754e9e374709d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ruleOrder", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ruleStatus")
    def rule_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ruleStatus"))

    @rule_status.setter
    def rule_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bdea70921884b5b5a45dea5c4ca7149dd32d2a30cf38456a5c1804c13bff9e81)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ruleStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5af1aecb2f24681d25ef990885298428f228d2b73c4394d20d21032e241e88c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActions",
    jsii_struct_bases=[],
    name_mapping={"finding_fields_update": "findingFieldsUpdate", "type": "type"},
)
class SecurityhubAutomationRuleActions:
    def __init__(
        self,
        *,
        finding_fields_update: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleActionsFindingFieldsUpdate", typing.Dict[builtins.str, typing.Any]]]]] = None,
        type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param finding_fields_update: finding_fields_update block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#finding_fields_update SecurityhubAutomationRule#finding_fields_update}
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#type SecurityhubAutomationRule#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8f7f1da03c2d5557c941babc8ba57e6afd75e19cf8bd2ce2c67ade92da65f756)
            check_type(argname="argument finding_fields_update", value=finding_fields_update, expected_type=type_hints["finding_fields_update"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if finding_fields_update is not None:
            self._values["finding_fields_update"] = finding_fields_update
        if type is not None:
            self._values["type"] = type

    @builtins.property
    def finding_fields_update(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdate"]]]:
        '''finding_fields_update block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#finding_fields_update SecurityhubAutomationRule#finding_fields_update}
        '''
        result = self._values.get("finding_fields_update")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdate"]]], result)

    @builtins.property
    def type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#type SecurityhubAutomationRule#type}.'''
        result = self._values.get("type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleActions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdate",
    jsii_struct_bases=[],
    name_mapping={
        "confidence": "confidence",
        "criticality": "criticality",
        "note": "note",
        "related_findings": "relatedFindings",
        "severity": "severity",
        "types": "types",
        "user_defined_fields": "userDefinedFields",
        "verification_state": "verificationState",
        "workflow": "workflow",
    },
)
class SecurityhubAutomationRuleActionsFindingFieldsUpdate:
    def __init__(
        self,
        *,
        confidence: typing.Optional[jsii.Number] = None,
        criticality: typing.Optional[jsii.Number] = None,
        note: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleActionsFindingFieldsUpdateNote", typing.Dict[builtins.str, typing.Any]]]]] = None,
        related_findings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings", typing.Dict[builtins.str, typing.Any]]]]] = None,
        severity: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity", typing.Dict[builtins.str, typing.Any]]]]] = None,
        types: typing.Optional[typing.Sequence[builtins.str]] = None,
        user_defined_fields: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        verification_state: typing.Optional[builtins.str] = None,
        workflow: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param confidence: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#confidence SecurityhubAutomationRule#confidence}.
        :param criticality: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#criticality SecurityhubAutomationRule#criticality}.
        :param note: note block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#note SecurityhubAutomationRule#note}
        :param related_findings: related_findings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#related_findings SecurityhubAutomationRule#related_findings}
        :param severity: severity block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#severity SecurityhubAutomationRule#severity}
        :param types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#types SecurityhubAutomationRule#types}.
        :param user_defined_fields: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#user_defined_fields SecurityhubAutomationRule#user_defined_fields}.
        :param verification_state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#verification_state SecurityhubAutomationRule#verification_state}.
        :param workflow: workflow block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#workflow SecurityhubAutomationRule#workflow}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__787c5dda2482b10f5cdfe34b52e9c77ed8d61c03becb51084a2de8c138eb6d04)
            check_type(argname="argument confidence", value=confidence, expected_type=type_hints["confidence"])
            check_type(argname="argument criticality", value=criticality, expected_type=type_hints["criticality"])
            check_type(argname="argument note", value=note, expected_type=type_hints["note"])
            check_type(argname="argument related_findings", value=related_findings, expected_type=type_hints["related_findings"])
            check_type(argname="argument severity", value=severity, expected_type=type_hints["severity"])
            check_type(argname="argument types", value=types, expected_type=type_hints["types"])
            check_type(argname="argument user_defined_fields", value=user_defined_fields, expected_type=type_hints["user_defined_fields"])
            check_type(argname="argument verification_state", value=verification_state, expected_type=type_hints["verification_state"])
            check_type(argname="argument workflow", value=workflow, expected_type=type_hints["workflow"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if confidence is not None:
            self._values["confidence"] = confidence
        if criticality is not None:
            self._values["criticality"] = criticality
        if note is not None:
            self._values["note"] = note
        if related_findings is not None:
            self._values["related_findings"] = related_findings
        if severity is not None:
            self._values["severity"] = severity
        if types is not None:
            self._values["types"] = types
        if user_defined_fields is not None:
            self._values["user_defined_fields"] = user_defined_fields
        if verification_state is not None:
            self._values["verification_state"] = verification_state
        if workflow is not None:
            self._values["workflow"] = workflow

    @builtins.property
    def confidence(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#confidence SecurityhubAutomationRule#confidence}.'''
        result = self._values.get("confidence")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def criticality(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#criticality SecurityhubAutomationRule#criticality}.'''
        result = self._values.get("criticality")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def note(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateNote"]]]:
        '''note block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#note SecurityhubAutomationRule#note}
        '''
        result = self._values.get("note")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateNote"]]], result)

    @builtins.property
    def related_findings(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings"]]]:
        '''related_findings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#related_findings SecurityhubAutomationRule#related_findings}
        '''
        result = self._values.get("related_findings")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings"]]], result)

    @builtins.property
    def severity(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity"]]]:
        '''severity block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#severity SecurityhubAutomationRule#severity}
        '''
        result = self._values.get("severity")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity"]]], result)

    @builtins.property
    def types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#types SecurityhubAutomationRule#types}.'''
        result = self._values.get("types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def user_defined_fields(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#user_defined_fields SecurityhubAutomationRule#user_defined_fields}.'''
        result = self._values.get("user_defined_fields")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def verification_state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#verification_state SecurityhubAutomationRule#verification_state}.'''
        result = self._values.get("verification_state")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def workflow(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow"]]]:
        '''workflow block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#workflow SecurityhubAutomationRule#workflow}
        '''
        result = self._values.get("workflow")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleActionsFindingFieldsUpdate(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleActionsFindingFieldsUpdateList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__34ca2513688abc7e4be47eb543d0ad9863ae6df081d8f719e557475d75cdcfa1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleActionsFindingFieldsUpdateOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e5acb5e9f297afca9387b723d65109225905cc49c4e752df928b38c19c64eab)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleActionsFindingFieldsUpdateOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__faf3e22790c67abbc2b14e774add9b134058926d07a0eac4fa2a7c043bacdce3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8522c6d0b8af03296256c4a4edd490d2a6b19f092a1e3d782b80255233fff253)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6f02e7bc184c223a884b6089b22626915a131e21b4560ff0e33a4b97081c1574)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdate]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdate]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdate]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1548848b1d5723ed45d41ad49889003216a607efa6c590fa37029dc5592763f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateNote",
    jsii_struct_bases=[],
    name_mapping={"text": "text", "updated_by": "updatedBy"},
)
class SecurityhubAutomationRuleActionsFindingFieldsUpdateNote:
    def __init__(self, *, text: builtins.str, updated_by: builtins.str) -> None:
        '''
        :param text: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#text SecurityhubAutomationRule#text}.
        :param updated_by: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#updated_by SecurityhubAutomationRule#updated_by}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5fdd5158b0d6f80456821ebf091b80c90b35d9695a7a924f33a27dbc5bd368d)
            check_type(argname="argument text", value=text, expected_type=type_hints["text"])
            check_type(argname="argument updated_by", value=updated_by, expected_type=type_hints["updated_by"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "text": text,
            "updated_by": updated_by,
        }

    @builtins.property
    def text(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#text SecurityhubAutomationRule#text}.'''
        result = self._values.get("text")
        assert result is not None, "Required property 'text' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def updated_by(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#updated_by SecurityhubAutomationRule#updated_by}.'''
        result = self._values.get("updated_by")
        assert result is not None, "Required property 'updated_by' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleActionsFindingFieldsUpdateNote(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleActionsFindingFieldsUpdateNoteList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateNoteList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6ad1ae1b24477662c18789eccd867a0720fb1a65170752dbc0f99169325697f4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleActionsFindingFieldsUpdateNoteOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9272b3c0daf0b09e23dd31a54681447544e305e2f6bbe71d1e3e7a7ecfdb4f06)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleActionsFindingFieldsUpdateNoteOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e2a076353096d79dbe1dc69119198198e19d55a8f55005b78d682aef07c09a7d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8744f51b4cb59f2b23cb0a6581a19da2689ac6d5dd9a5a05f59754b0cb705bdc)
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
            type_hints = typing.get_type_hints(_typecheckingstub__aa79deb930e905c3b6f66ad18d0801f672cf91a64baf1922893e0835b768b9b8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateNote]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateNote]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateNote]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__882a6e0d053191e58506b43147838403993318e896dee9ec0333329340ecf0fe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleActionsFindingFieldsUpdateNoteOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateNoteOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3c8f111672d2a7ff975608a00844f6cbae02f76f8cd436f9121744044d0cedb2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="textInput")
    def text_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "textInput"))

    @builtins.property
    @jsii.member(jsii_name="updatedByInput")
    def updated_by_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "updatedByInput"))

    @builtins.property
    @jsii.member(jsii_name="text")
    def text(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "text"))

    @text.setter
    def text(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b0bb7f006dbdf36ef307a692e4c1c40ef3fa1c9a7799d06b53bae14febff298)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "text", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="updatedBy")
    def updated_by(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "updatedBy"))

    @updated_by.setter
    def updated_by(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d95711d49e97c5bf8867b892853be01766393426f26df665a3d4d5f93b41137c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "updatedBy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateNote]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateNote]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateNote]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__725cebfccb3c30381e4fc4b6decdbc8d47e271e6986a827c880f67139e6d0dff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleActionsFindingFieldsUpdateOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6b1c5cda814cc956ba6c3b043193df9ccdf69b648c4ed1d653cb748de78dcbfc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putNote")
    def put_note(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActionsFindingFieldsUpdateNote, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a916adfdfe2f549b44bf191d10ddc08eff4c1e7adada41ea03f9f4fb4cca3808)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putNote", [value]))

    @jsii.member(jsii_name="putRelatedFindings")
    def put_related_findings(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__569f13cc974fbcca459dd391b6fcba35328fd5aea1de35dc7524c09c5f493394)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRelatedFindings", [value]))

    @jsii.member(jsii_name="putSeverity")
    def put_severity(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9f6239f46075608f71daed0f734cd3fa19d1832a667c3a0d178e553ffdfcb836)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSeverity", [value]))

    @jsii.member(jsii_name="putWorkflow")
    def put_workflow(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aca3d393636bc4119d374c1be687540eabb504231d461a4799bfb109dec93fa6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putWorkflow", [value]))

    @jsii.member(jsii_name="resetConfidence")
    def reset_confidence(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConfidence", []))

    @jsii.member(jsii_name="resetCriticality")
    def reset_criticality(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCriticality", []))

    @jsii.member(jsii_name="resetNote")
    def reset_note(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNote", []))

    @jsii.member(jsii_name="resetRelatedFindings")
    def reset_related_findings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRelatedFindings", []))

    @jsii.member(jsii_name="resetSeverity")
    def reset_severity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSeverity", []))

    @jsii.member(jsii_name="resetTypes")
    def reset_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTypes", []))

    @jsii.member(jsii_name="resetUserDefinedFields")
    def reset_user_defined_fields(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUserDefinedFields", []))

    @jsii.member(jsii_name="resetVerificationState")
    def reset_verification_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVerificationState", []))

    @jsii.member(jsii_name="resetWorkflow")
    def reset_workflow(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWorkflow", []))

    @builtins.property
    @jsii.member(jsii_name="note")
    def note(self) -> SecurityhubAutomationRuleActionsFindingFieldsUpdateNoteList:
        return typing.cast(SecurityhubAutomationRuleActionsFindingFieldsUpdateNoteList, jsii.get(self, "note"))

    @builtins.property
    @jsii.member(jsii_name="relatedFindings")
    def related_findings(
        self,
    ) -> "SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindingsList":
        return typing.cast("SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindingsList", jsii.get(self, "relatedFindings"))

    @builtins.property
    @jsii.member(jsii_name="severity")
    def severity(
        self,
    ) -> "SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverityList":
        return typing.cast("SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverityList", jsii.get(self, "severity"))

    @builtins.property
    @jsii.member(jsii_name="workflow")
    def workflow(
        self,
    ) -> "SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflowList":
        return typing.cast("SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflowList", jsii.get(self, "workflow"))

    @builtins.property
    @jsii.member(jsii_name="confidenceInput")
    def confidence_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "confidenceInput"))

    @builtins.property
    @jsii.member(jsii_name="criticalityInput")
    def criticality_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "criticalityInput"))

    @builtins.property
    @jsii.member(jsii_name="noteInput")
    def note_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateNote]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateNote]]], jsii.get(self, "noteInput"))

    @builtins.property
    @jsii.member(jsii_name="relatedFindingsInput")
    def related_findings_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings"]]], jsii.get(self, "relatedFindingsInput"))

    @builtins.property
    @jsii.member(jsii_name="severityInput")
    def severity_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity"]]], jsii.get(self, "severityInput"))

    @builtins.property
    @jsii.member(jsii_name="typesInput")
    def types_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "typesInput"))

    @builtins.property
    @jsii.member(jsii_name="userDefinedFieldsInput")
    def user_defined_fields_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "userDefinedFieldsInput"))

    @builtins.property
    @jsii.member(jsii_name="verificationStateInput")
    def verification_state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "verificationStateInput"))

    @builtins.property
    @jsii.member(jsii_name="workflowInput")
    def workflow_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow"]]], jsii.get(self, "workflowInput"))

    @builtins.property
    @jsii.member(jsii_name="confidence")
    def confidence(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "confidence"))

    @confidence.setter
    def confidence(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d4069fe64896d9a2bd9b3d1e4cb045896548bcf5ecf0fc5b99cb3d0613f2fc87)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "confidence", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="criticality")
    def criticality(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "criticality"))

    @criticality.setter
    def criticality(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96e59fc7109c569e2b33865308409d87a2882bfe9e894100299e9d962e966624)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "criticality", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="types")
    def types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "types"))

    @types.setter
    def types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ee379466df59328a7acbae3670e4349f2c9b02ab5dab5c2d59e9ca223223f28)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "types", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userDefinedFields")
    def user_defined_fields(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "userDefinedFields"))

    @user_defined_fields.setter
    def user_defined_fields(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c21ce97463feb85666ff44b2f3319a63a0adb63440823b12bc0784a2835d7838)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userDefinedFields", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="verificationState")
    def verification_state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "verificationState"))

    @verification_state.setter
    def verification_state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32eb5963e94fa903147cc41d79247023ba581b1d2dcaf910c7cc52940b207713)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "verificationState", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdate]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdate]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdate]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02d5d76d3b696594e5e52e1cd02b641d50602d5cd748d8579fbcb26da2a98815)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings",
    jsii_struct_bases=[],
    name_mapping={"id": "id", "product_arn": "productArn"},
)
class SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings:
    def __init__(self, *, id: builtins.str, product_arn: builtins.str) -> None:
        '''
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#id SecurityhubAutomationRule#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param product_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#product_arn SecurityhubAutomationRule#product_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac8f6c24ab87ccddd233ef10e3b4d7a1c0e867c2ce2fdf796b76b153db9cd7b5)
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument product_arn", value=product_arn, expected_type=type_hints["product_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "id": id,
            "product_arn": product_arn,
        }

    @builtins.property
    def id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#id SecurityhubAutomationRule#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        assert result is not None, "Required property 'id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def product_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#product_arn SecurityhubAutomationRule#product_arn}.'''
        result = self._values.get("product_arn")
        assert result is not None, "Required property 'product_arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindingsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindingsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cb6b94512b2b6d6da785195fc3b54515c8e202f3da4a98f9f4675176541f4690)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindingsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0139c0d446b6b31efb8c121baf2c8329abb7255a8246e2dd09f4a7aa4fd95934)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindingsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__571c516561009cde9ee427c83fc48f26fe3fe241c446a5123c92b34e94fa650e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2f3cbf4d607bb02f0603828839c7bb18818f7c52f979a0899241f092f3d93100)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3f6863ef0e49e6bad37a34efcffdafcd2af82d69cc273e5fbe6526048bfcf3fe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__afe97ee6812ac16dcd046d2aed090eb6ebce49f2570f16713c4ef50a34229e32)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__caca2f816927a364809b1e6b78828fcc7200e08c914cd5e3b7571be244ff2ba1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="productArnInput")
    def product_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "productArnInput"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d83649ab840f27b9e07ae69107f8649f06c6a7fd4322b995f3090c42fde402cc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="productArn")
    def product_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "productArn"))

    @product_arn.setter
    def product_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__464b8daa29829e3ecedc41903c9803fc39408b379a4d03505a1703ff8baebffa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "productArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5b142f9b8d1cd3cfe2204066d61f65dd338a37a432b8b88fab7061b7f9ac7086)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity",
    jsii_struct_bases=[],
    name_mapping={"label": "label", "product": "product"},
)
class SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity:
    def __init__(
        self,
        *,
        label: typing.Optional[builtins.str] = None,
        product: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param label: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#label SecurityhubAutomationRule#label}.
        :param product: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#product SecurityhubAutomationRule#product}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a2a0c95825fc4c261d10948dff691d83f75be4c22fcc839e94eaaeda060f90c5)
            check_type(argname="argument label", value=label, expected_type=type_hints["label"])
            check_type(argname="argument product", value=product, expected_type=type_hints["product"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if label is not None:
            self._values["label"] = label
        if product is not None:
            self._values["product"] = product

    @builtins.property
    def label(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#label SecurityhubAutomationRule#label}.'''
        result = self._values.get("label")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def product(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#product SecurityhubAutomationRule#product}.'''
        result = self._values.get("product")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverityList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverityList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cda615e5e9891b3c5e23aaf7e92b2f562fca71fdb860a314db7e9a63e3055b06)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverityOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05e851e165a781bf1c3413eeed5b27f071138b72c2b3a8a365a9d15837ef5b15)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverityOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7027b88cc847086263d5d643898bb9c3891754a0d5a62cad4c9b434744b4846f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__04918abc324a446e4f085cd97d2f32bc98cc32ab2acfc2601a4a2741b4f99ee5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__45370e888b0f2be80ab7eea69cef1ec2b1b4d835cd4c339fbdbb1573aea61e38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__effa39e62e1059a51ac9c6e75659fe4c71837bfa8195909219770aad6ec9f871)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverityOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverityOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3fcfa3a360f6c5577121995966832cb793c3845c13ce93f77173292cd1f24b61)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetLabel")
    def reset_label(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLabel", []))

    @jsii.member(jsii_name="resetProduct")
    def reset_product(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProduct", []))

    @builtins.property
    @jsii.member(jsii_name="labelInput")
    def label_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "labelInput"))

    @builtins.property
    @jsii.member(jsii_name="productInput")
    def product_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "productInput"))

    @builtins.property
    @jsii.member(jsii_name="label")
    def label(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "label"))

    @label.setter
    def label(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3e1af4bfa9cd9622eb28bc100232f124806f4083139758052404bd26d394003)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "label", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="product")
    def product(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "product"))

    @product.setter
    def product(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01da766bde636485779e361abdb67048b5a50c8dd6b61fb17d7cff7c66de40af)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "product", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2959dd59b8abfe7ecfb66b79e4465a65610ede4c72715b039a7913d219ccff6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow",
    jsii_struct_bases=[],
    name_mapping={"status": "status"},
)
class SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow:
    def __init__(self, *, status: typing.Optional[builtins.str] = None) -> None:
        '''
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#status SecurityhubAutomationRule#status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8feda9c5da674c7373a5fcffaa23c4c3f364c089505a997887d4069d6c15a1cb)
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#status SecurityhubAutomationRule#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflowList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflowList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9b62012d76b200fbc1987954077fcb67c6a8cac2fbb8a8f05dd67f6bf94bd842)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflowOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__251c821b37f2e730867ab3d8cac14687970da231c4bb5c2130bc01279500337c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflowOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d7fbb78a640158f10d96bdbd5e6bfb37a513e550e144711a04d5065e8922e78)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e9fefc1f4e7933345becce27f48e355dcfbcb6688b259fa73665f4f5fad0271d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c459d0e362167a7e4a368ae9e7d8bab92bd9e2321c4c82416f615c142c4daef5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__668c6b4025e006df2685fbbdc2f40eb7f9dd888b8dfb3dd30d76fa8f2b84b223)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflowOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflowOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ee15dd4fc187e595d87417373a2d4a2ef34be48705d8a52cee1d66360b3c109a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2b2f1d7232a7d5c81432919c86ada8aa5d5c76751b587b00a10a20bd07ac1982)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__957386929138886cb190d4903a04bf0e2500efd03efb0612bfa3b58272249b52)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleActionsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__584e5ab732dd038a4de741d755d0b1cc620cce07f45ee951c8d622ece8740df8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleActionsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__062e4b2eb9a56a98b8bfcdd858b72ffdf9afa2d7684cb76f25a58d09115a32a3)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleActionsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c94cfdeb741189ff13f178c118600810d361bbd04d1fd9dbf1036b7eecf9d999)
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
            type_hints = typing.get_type_hints(_typecheckingstub__fc5245ef60754c8e275126acbfc3a6b6710ca45bcb7f2cbbe95b0d7f0c893a13)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6febad7602c6453f6a45e566920b4b73911abb6f88a1715d9cf271865a2b7436)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActions]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActions]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActions]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cbaff05f158161cf22993736c6d8d7a6a669ba9ecf8aa013721f25bc694845ee)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleActionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__edefe046e85e83959992dc9ad8c5896d83808c125587f41ae5d1515316dd9062)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putFindingFieldsUpdate")
    def put_finding_fields_update(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActionsFindingFieldsUpdate, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__82adb6ea399f2a913304a9aa4b9274e6d7345ad1eb40339be0d586bf27ee98ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFindingFieldsUpdate", [value]))

    @jsii.member(jsii_name="resetFindingFieldsUpdate")
    def reset_finding_fields_update(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFindingFieldsUpdate", []))

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @builtins.property
    @jsii.member(jsii_name="findingFieldsUpdate")
    def finding_fields_update(
        self,
    ) -> SecurityhubAutomationRuleActionsFindingFieldsUpdateList:
        return typing.cast(SecurityhubAutomationRuleActionsFindingFieldsUpdateList, jsii.get(self, "findingFieldsUpdate"))

    @builtins.property
    @jsii.member(jsii_name="findingFieldsUpdateInput")
    def finding_fields_update_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdate]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdate]]], jsii.get(self, "findingFieldsUpdateInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__17c001280cecd1c8b8403776aa775dce7536ed1a914713b4eecc5f06b3b08684)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActions]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActions]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActions]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__292db5b3b60227a9871b7c3704f9f3f771139d2c1cac65945f3a1130b3a8ddb2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "description": "description",
        "rule_name": "ruleName",
        "rule_order": "ruleOrder",
        "actions": "actions",
        "criteria": "criteria",
        "is_terminal": "isTerminal",
        "rule_status": "ruleStatus",
        "tags": "tags",
    },
)
class SecurityhubAutomationRuleConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        description: builtins.str,
        rule_name: builtins.str,
        rule_order: jsii.Number,
        actions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActions, typing.Dict[builtins.str, typing.Any]]]]] = None,
        criteria: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteria", typing.Dict[builtins.str, typing.Any]]]]] = None,
        is_terminal: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        rule_status: typing.Optional[builtins.str] = None,
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
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#description SecurityhubAutomationRule#description}.
        :param rule_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#rule_name SecurityhubAutomationRule#rule_name}.
        :param rule_order: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#rule_order SecurityhubAutomationRule#rule_order}.
        :param actions: actions block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#actions SecurityhubAutomationRule#actions}
        :param criteria: criteria block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#criteria SecurityhubAutomationRule#criteria}
        :param is_terminal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#is_terminal SecurityhubAutomationRule#is_terminal}.
        :param rule_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#rule_status SecurityhubAutomationRule#rule_status}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#tags SecurityhubAutomationRule#tags}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4acb45c9803b6861763626047e39e4a9a5896de64bbbbca14afa6f3655e7320c)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument rule_name", value=rule_name, expected_type=type_hints["rule_name"])
            check_type(argname="argument rule_order", value=rule_order, expected_type=type_hints["rule_order"])
            check_type(argname="argument actions", value=actions, expected_type=type_hints["actions"])
            check_type(argname="argument criteria", value=criteria, expected_type=type_hints["criteria"])
            check_type(argname="argument is_terminal", value=is_terminal, expected_type=type_hints["is_terminal"])
            check_type(argname="argument rule_status", value=rule_status, expected_type=type_hints["rule_status"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "description": description,
            "rule_name": rule_name,
            "rule_order": rule_order,
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
        if actions is not None:
            self._values["actions"] = actions
        if criteria is not None:
            self._values["criteria"] = criteria
        if is_terminal is not None:
            self._values["is_terminal"] = is_terminal
        if rule_status is not None:
            self._values["rule_status"] = rule_status
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
    def description(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#description SecurityhubAutomationRule#description}.'''
        result = self._values.get("description")
        assert result is not None, "Required property 'description' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def rule_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#rule_name SecurityhubAutomationRule#rule_name}.'''
        result = self._values.get("rule_name")
        assert result is not None, "Required property 'rule_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def rule_order(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#rule_order SecurityhubAutomationRule#rule_order}.'''
        result = self._values.get("rule_order")
        assert result is not None, "Required property 'rule_order' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def actions(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActions]]]:
        '''actions block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#actions SecurityhubAutomationRule#actions}
        '''
        result = self._values.get("actions")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActions]]], result)

    @builtins.property
    def criteria(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteria"]]]:
        '''criteria block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#criteria SecurityhubAutomationRule#criteria}
        '''
        result = self._values.get("criteria")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteria"]]], result)

    @builtins.property
    def is_terminal(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#is_terminal SecurityhubAutomationRule#is_terminal}.'''
        result = self._values.get("is_terminal")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def rule_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#rule_status SecurityhubAutomationRule#rule_status}.'''
        result = self._values.get("rule_status")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#tags SecurityhubAutomationRule#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteria",
    jsii_struct_bases=[],
    name_mapping={
        "aws_account_id": "awsAccountId",
        "aws_account_name": "awsAccountName",
        "company_name": "companyName",
        "compliance_associated_standards_id": "complianceAssociatedStandardsId",
        "compliance_security_control_id": "complianceSecurityControlId",
        "compliance_status": "complianceStatus",
        "confidence": "confidence",
        "created_at": "createdAt",
        "criticality": "criticality",
        "description": "description",
        "first_observed_at": "firstObservedAt",
        "generator_id": "generatorId",
        "id": "id",
        "last_observed_at": "lastObservedAt",
        "note_text": "noteText",
        "note_updated_at": "noteUpdatedAt",
        "note_updated_by": "noteUpdatedBy",
        "product_arn": "productArn",
        "product_name": "productName",
        "record_state": "recordState",
        "related_findings_id": "relatedFindingsId",
        "related_findings_product_arn": "relatedFindingsProductArn",
        "resource_application_arn": "resourceApplicationArn",
        "resource_application_name": "resourceApplicationName",
        "resource_details_other": "resourceDetailsOther",
        "resource_id": "resourceId",
        "resource_partition": "resourcePartition",
        "resource_region": "resourceRegion",
        "resource_tags": "resourceTags",
        "resource_type": "resourceType",
        "severity_label": "severityLabel",
        "source_url": "sourceUrl",
        "title": "title",
        "type": "type",
        "updated_at": "updatedAt",
        "user_defined_fields": "userDefinedFields",
        "verification_state": "verificationState",
        "workflow_status": "workflowStatus",
    },
)
class SecurityhubAutomationRuleCriteria:
    def __init__(
        self,
        *,
        aws_account_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaAwsAccountId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        aws_account_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaAwsAccountName", typing.Dict[builtins.str, typing.Any]]]]] = None,
        company_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaCompanyName", typing.Dict[builtins.str, typing.Any]]]]] = None,
        compliance_associated_standards_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        compliance_security_control_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaComplianceSecurityControlId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        compliance_status: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaComplianceStatus", typing.Dict[builtins.str, typing.Any]]]]] = None,
        confidence: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaConfidence", typing.Dict[builtins.str, typing.Any]]]]] = None,
        created_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaCreatedAt", typing.Dict[builtins.str, typing.Any]]]]] = None,
        criticality: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaCriticality", typing.Dict[builtins.str, typing.Any]]]]] = None,
        description: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaDescription", typing.Dict[builtins.str, typing.Any]]]]] = None,
        first_observed_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaFirstObservedAt", typing.Dict[builtins.str, typing.Any]]]]] = None,
        generator_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaGeneratorId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        last_observed_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaLastObservedAt", typing.Dict[builtins.str, typing.Any]]]]] = None,
        note_text: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaNoteText", typing.Dict[builtins.str, typing.Any]]]]] = None,
        note_updated_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaNoteUpdatedAt", typing.Dict[builtins.str, typing.Any]]]]] = None,
        note_updated_by: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaNoteUpdatedBy", typing.Dict[builtins.str, typing.Any]]]]] = None,
        product_arn: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaProductArn", typing.Dict[builtins.str, typing.Any]]]]] = None,
        product_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaProductName", typing.Dict[builtins.str, typing.Any]]]]] = None,
        record_state: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaRecordState", typing.Dict[builtins.str, typing.Any]]]]] = None,
        related_findings_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaRelatedFindingsId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        related_findings_product_arn: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_application_arn: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceApplicationArn", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_application_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceApplicationName", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_details_other: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceDetailsOther", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceId", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_partition: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourcePartition", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_region: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceRegion", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_tags: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceTags", typing.Dict[builtins.str, typing.Any]]]]] = None,
        resource_type: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceType", typing.Dict[builtins.str, typing.Any]]]]] = None,
        severity_label: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaSeverityLabel", typing.Dict[builtins.str, typing.Any]]]]] = None,
        source_url: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaSourceUrl", typing.Dict[builtins.str, typing.Any]]]]] = None,
        title: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaTitle", typing.Dict[builtins.str, typing.Any]]]]] = None,
        type: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaType", typing.Dict[builtins.str, typing.Any]]]]] = None,
        updated_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaUpdatedAt", typing.Dict[builtins.str, typing.Any]]]]] = None,
        user_defined_fields: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaUserDefinedFields", typing.Dict[builtins.str, typing.Any]]]]] = None,
        verification_state: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaVerificationState", typing.Dict[builtins.str, typing.Any]]]]] = None,
        workflow_status: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaWorkflowStatus", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param aws_account_id: aws_account_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#aws_account_id SecurityhubAutomationRule#aws_account_id}
        :param aws_account_name: aws_account_name block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#aws_account_name SecurityhubAutomationRule#aws_account_name}
        :param company_name: company_name block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#company_name SecurityhubAutomationRule#company_name}
        :param compliance_associated_standards_id: compliance_associated_standards_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#compliance_associated_standards_id SecurityhubAutomationRule#compliance_associated_standards_id}
        :param compliance_security_control_id: compliance_security_control_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#compliance_security_control_id SecurityhubAutomationRule#compliance_security_control_id}
        :param compliance_status: compliance_status block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#compliance_status SecurityhubAutomationRule#compliance_status}
        :param confidence: confidence block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#confidence SecurityhubAutomationRule#confidence}
        :param created_at: created_at block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#created_at SecurityhubAutomationRule#created_at}
        :param criticality: criticality block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#criticality SecurityhubAutomationRule#criticality}
        :param description: description block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#description SecurityhubAutomationRule#description}
        :param first_observed_at: first_observed_at block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#first_observed_at SecurityhubAutomationRule#first_observed_at}
        :param generator_id: generator_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#generator_id SecurityhubAutomationRule#generator_id}
        :param id: id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#id SecurityhubAutomationRule#id} Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param last_observed_at: last_observed_at block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#last_observed_at SecurityhubAutomationRule#last_observed_at}
        :param note_text: note_text block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#note_text SecurityhubAutomationRule#note_text}
        :param note_updated_at: note_updated_at block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#note_updated_at SecurityhubAutomationRule#note_updated_at}
        :param note_updated_by: note_updated_by block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#note_updated_by SecurityhubAutomationRule#note_updated_by}
        :param product_arn: product_arn block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#product_arn SecurityhubAutomationRule#product_arn}
        :param product_name: product_name block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#product_name SecurityhubAutomationRule#product_name}
        :param record_state: record_state block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#record_state SecurityhubAutomationRule#record_state}
        :param related_findings_id: related_findings_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#related_findings_id SecurityhubAutomationRule#related_findings_id}
        :param related_findings_product_arn: related_findings_product_arn block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#related_findings_product_arn SecurityhubAutomationRule#related_findings_product_arn}
        :param resource_application_arn: resource_application_arn block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_application_arn SecurityhubAutomationRule#resource_application_arn}
        :param resource_application_name: resource_application_name block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_application_name SecurityhubAutomationRule#resource_application_name}
        :param resource_details_other: resource_details_other block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_details_other SecurityhubAutomationRule#resource_details_other}
        :param resource_id: resource_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_id SecurityhubAutomationRule#resource_id}
        :param resource_partition: resource_partition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_partition SecurityhubAutomationRule#resource_partition}
        :param resource_region: resource_region block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_region SecurityhubAutomationRule#resource_region}
        :param resource_tags: resource_tags block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_tags SecurityhubAutomationRule#resource_tags}
        :param resource_type: resource_type block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_type SecurityhubAutomationRule#resource_type}
        :param severity_label: severity_label block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#severity_label SecurityhubAutomationRule#severity_label}
        :param source_url: source_url block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#source_url SecurityhubAutomationRule#source_url}
        :param title: title block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#title SecurityhubAutomationRule#title}
        :param type: type block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#type SecurityhubAutomationRule#type}
        :param updated_at: updated_at block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#updated_at SecurityhubAutomationRule#updated_at}
        :param user_defined_fields: user_defined_fields block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#user_defined_fields SecurityhubAutomationRule#user_defined_fields}
        :param verification_state: verification_state block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#verification_state SecurityhubAutomationRule#verification_state}
        :param workflow_status: workflow_status block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#workflow_status SecurityhubAutomationRule#workflow_status}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2fb486dd31f7de48243db23db0805b66641329d12dbd5dbe6bb88545e16a8288)
            check_type(argname="argument aws_account_id", value=aws_account_id, expected_type=type_hints["aws_account_id"])
            check_type(argname="argument aws_account_name", value=aws_account_name, expected_type=type_hints["aws_account_name"])
            check_type(argname="argument company_name", value=company_name, expected_type=type_hints["company_name"])
            check_type(argname="argument compliance_associated_standards_id", value=compliance_associated_standards_id, expected_type=type_hints["compliance_associated_standards_id"])
            check_type(argname="argument compliance_security_control_id", value=compliance_security_control_id, expected_type=type_hints["compliance_security_control_id"])
            check_type(argname="argument compliance_status", value=compliance_status, expected_type=type_hints["compliance_status"])
            check_type(argname="argument confidence", value=confidence, expected_type=type_hints["confidence"])
            check_type(argname="argument created_at", value=created_at, expected_type=type_hints["created_at"])
            check_type(argname="argument criticality", value=criticality, expected_type=type_hints["criticality"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument first_observed_at", value=first_observed_at, expected_type=type_hints["first_observed_at"])
            check_type(argname="argument generator_id", value=generator_id, expected_type=type_hints["generator_id"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument last_observed_at", value=last_observed_at, expected_type=type_hints["last_observed_at"])
            check_type(argname="argument note_text", value=note_text, expected_type=type_hints["note_text"])
            check_type(argname="argument note_updated_at", value=note_updated_at, expected_type=type_hints["note_updated_at"])
            check_type(argname="argument note_updated_by", value=note_updated_by, expected_type=type_hints["note_updated_by"])
            check_type(argname="argument product_arn", value=product_arn, expected_type=type_hints["product_arn"])
            check_type(argname="argument product_name", value=product_name, expected_type=type_hints["product_name"])
            check_type(argname="argument record_state", value=record_state, expected_type=type_hints["record_state"])
            check_type(argname="argument related_findings_id", value=related_findings_id, expected_type=type_hints["related_findings_id"])
            check_type(argname="argument related_findings_product_arn", value=related_findings_product_arn, expected_type=type_hints["related_findings_product_arn"])
            check_type(argname="argument resource_application_arn", value=resource_application_arn, expected_type=type_hints["resource_application_arn"])
            check_type(argname="argument resource_application_name", value=resource_application_name, expected_type=type_hints["resource_application_name"])
            check_type(argname="argument resource_details_other", value=resource_details_other, expected_type=type_hints["resource_details_other"])
            check_type(argname="argument resource_id", value=resource_id, expected_type=type_hints["resource_id"])
            check_type(argname="argument resource_partition", value=resource_partition, expected_type=type_hints["resource_partition"])
            check_type(argname="argument resource_region", value=resource_region, expected_type=type_hints["resource_region"])
            check_type(argname="argument resource_tags", value=resource_tags, expected_type=type_hints["resource_tags"])
            check_type(argname="argument resource_type", value=resource_type, expected_type=type_hints["resource_type"])
            check_type(argname="argument severity_label", value=severity_label, expected_type=type_hints["severity_label"])
            check_type(argname="argument source_url", value=source_url, expected_type=type_hints["source_url"])
            check_type(argname="argument title", value=title, expected_type=type_hints["title"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument updated_at", value=updated_at, expected_type=type_hints["updated_at"])
            check_type(argname="argument user_defined_fields", value=user_defined_fields, expected_type=type_hints["user_defined_fields"])
            check_type(argname="argument verification_state", value=verification_state, expected_type=type_hints["verification_state"])
            check_type(argname="argument workflow_status", value=workflow_status, expected_type=type_hints["workflow_status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if aws_account_id is not None:
            self._values["aws_account_id"] = aws_account_id
        if aws_account_name is not None:
            self._values["aws_account_name"] = aws_account_name
        if company_name is not None:
            self._values["company_name"] = company_name
        if compliance_associated_standards_id is not None:
            self._values["compliance_associated_standards_id"] = compliance_associated_standards_id
        if compliance_security_control_id is not None:
            self._values["compliance_security_control_id"] = compliance_security_control_id
        if compliance_status is not None:
            self._values["compliance_status"] = compliance_status
        if confidence is not None:
            self._values["confidence"] = confidence
        if created_at is not None:
            self._values["created_at"] = created_at
        if criticality is not None:
            self._values["criticality"] = criticality
        if description is not None:
            self._values["description"] = description
        if first_observed_at is not None:
            self._values["first_observed_at"] = first_observed_at
        if generator_id is not None:
            self._values["generator_id"] = generator_id
        if id is not None:
            self._values["id"] = id
        if last_observed_at is not None:
            self._values["last_observed_at"] = last_observed_at
        if note_text is not None:
            self._values["note_text"] = note_text
        if note_updated_at is not None:
            self._values["note_updated_at"] = note_updated_at
        if note_updated_by is not None:
            self._values["note_updated_by"] = note_updated_by
        if product_arn is not None:
            self._values["product_arn"] = product_arn
        if product_name is not None:
            self._values["product_name"] = product_name
        if record_state is not None:
            self._values["record_state"] = record_state
        if related_findings_id is not None:
            self._values["related_findings_id"] = related_findings_id
        if related_findings_product_arn is not None:
            self._values["related_findings_product_arn"] = related_findings_product_arn
        if resource_application_arn is not None:
            self._values["resource_application_arn"] = resource_application_arn
        if resource_application_name is not None:
            self._values["resource_application_name"] = resource_application_name
        if resource_details_other is not None:
            self._values["resource_details_other"] = resource_details_other
        if resource_id is not None:
            self._values["resource_id"] = resource_id
        if resource_partition is not None:
            self._values["resource_partition"] = resource_partition
        if resource_region is not None:
            self._values["resource_region"] = resource_region
        if resource_tags is not None:
            self._values["resource_tags"] = resource_tags
        if resource_type is not None:
            self._values["resource_type"] = resource_type
        if severity_label is not None:
            self._values["severity_label"] = severity_label
        if source_url is not None:
            self._values["source_url"] = source_url
        if title is not None:
            self._values["title"] = title
        if type is not None:
            self._values["type"] = type
        if updated_at is not None:
            self._values["updated_at"] = updated_at
        if user_defined_fields is not None:
            self._values["user_defined_fields"] = user_defined_fields
        if verification_state is not None:
            self._values["verification_state"] = verification_state
        if workflow_status is not None:
            self._values["workflow_status"] = workflow_status

    @builtins.property
    def aws_account_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaAwsAccountId"]]]:
        '''aws_account_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#aws_account_id SecurityhubAutomationRule#aws_account_id}
        '''
        result = self._values.get("aws_account_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaAwsAccountId"]]], result)

    @builtins.property
    def aws_account_name(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaAwsAccountName"]]]:
        '''aws_account_name block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#aws_account_name SecurityhubAutomationRule#aws_account_name}
        '''
        result = self._values.get("aws_account_name")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaAwsAccountName"]]], result)

    @builtins.property
    def company_name(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaCompanyName"]]]:
        '''company_name block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#company_name SecurityhubAutomationRule#company_name}
        '''
        result = self._values.get("company_name")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaCompanyName"]]], result)

    @builtins.property
    def compliance_associated_standards_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId"]]]:
        '''compliance_associated_standards_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#compliance_associated_standards_id SecurityhubAutomationRule#compliance_associated_standards_id}
        '''
        result = self._values.get("compliance_associated_standards_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId"]]], result)

    @builtins.property
    def compliance_security_control_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaComplianceSecurityControlId"]]]:
        '''compliance_security_control_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#compliance_security_control_id SecurityhubAutomationRule#compliance_security_control_id}
        '''
        result = self._values.get("compliance_security_control_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaComplianceSecurityControlId"]]], result)

    @builtins.property
    def compliance_status(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaComplianceStatus"]]]:
        '''compliance_status block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#compliance_status SecurityhubAutomationRule#compliance_status}
        '''
        result = self._values.get("compliance_status")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaComplianceStatus"]]], result)

    @builtins.property
    def confidence(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaConfidence"]]]:
        '''confidence block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#confidence SecurityhubAutomationRule#confidence}
        '''
        result = self._values.get("confidence")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaConfidence"]]], result)

    @builtins.property
    def created_at(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaCreatedAt"]]]:
        '''created_at block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#created_at SecurityhubAutomationRule#created_at}
        '''
        result = self._values.get("created_at")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaCreatedAt"]]], result)

    @builtins.property
    def criticality(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaCriticality"]]]:
        '''criticality block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#criticality SecurityhubAutomationRule#criticality}
        '''
        result = self._values.get("criticality")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaCriticality"]]], result)

    @builtins.property
    def description(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaDescription"]]]:
        '''description block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#description SecurityhubAutomationRule#description}
        '''
        result = self._values.get("description")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaDescription"]]], result)

    @builtins.property
    def first_observed_at(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaFirstObservedAt"]]]:
        '''first_observed_at block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#first_observed_at SecurityhubAutomationRule#first_observed_at}
        '''
        result = self._values.get("first_observed_at")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaFirstObservedAt"]]], result)

    @builtins.property
    def generator_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaGeneratorId"]]]:
        '''generator_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#generator_id SecurityhubAutomationRule#generator_id}
        '''
        result = self._values.get("generator_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaGeneratorId"]]], result)

    @builtins.property
    def id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaId"]]]:
        '''id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#id SecurityhubAutomationRule#id}

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaId"]]], result)

    @builtins.property
    def last_observed_at(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaLastObservedAt"]]]:
        '''last_observed_at block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#last_observed_at SecurityhubAutomationRule#last_observed_at}
        '''
        result = self._values.get("last_observed_at")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaLastObservedAt"]]], result)

    @builtins.property
    def note_text(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaNoteText"]]]:
        '''note_text block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#note_text SecurityhubAutomationRule#note_text}
        '''
        result = self._values.get("note_text")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaNoteText"]]], result)

    @builtins.property
    def note_updated_at(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaNoteUpdatedAt"]]]:
        '''note_updated_at block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#note_updated_at SecurityhubAutomationRule#note_updated_at}
        '''
        result = self._values.get("note_updated_at")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaNoteUpdatedAt"]]], result)

    @builtins.property
    def note_updated_by(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaNoteUpdatedBy"]]]:
        '''note_updated_by block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#note_updated_by SecurityhubAutomationRule#note_updated_by}
        '''
        result = self._values.get("note_updated_by")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaNoteUpdatedBy"]]], result)

    @builtins.property
    def product_arn(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaProductArn"]]]:
        '''product_arn block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#product_arn SecurityhubAutomationRule#product_arn}
        '''
        result = self._values.get("product_arn")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaProductArn"]]], result)

    @builtins.property
    def product_name(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaProductName"]]]:
        '''product_name block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#product_name SecurityhubAutomationRule#product_name}
        '''
        result = self._values.get("product_name")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaProductName"]]], result)

    @builtins.property
    def record_state(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaRecordState"]]]:
        '''record_state block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#record_state SecurityhubAutomationRule#record_state}
        '''
        result = self._values.get("record_state")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaRecordState"]]], result)

    @builtins.property
    def related_findings_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaRelatedFindingsId"]]]:
        '''related_findings_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#related_findings_id SecurityhubAutomationRule#related_findings_id}
        '''
        result = self._values.get("related_findings_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaRelatedFindingsId"]]], result)

    @builtins.property
    def related_findings_product_arn(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn"]]]:
        '''related_findings_product_arn block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#related_findings_product_arn SecurityhubAutomationRule#related_findings_product_arn}
        '''
        result = self._values.get("related_findings_product_arn")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn"]]], result)

    @builtins.property
    def resource_application_arn(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceApplicationArn"]]]:
        '''resource_application_arn block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_application_arn SecurityhubAutomationRule#resource_application_arn}
        '''
        result = self._values.get("resource_application_arn")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceApplicationArn"]]], result)

    @builtins.property
    def resource_application_name(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceApplicationName"]]]:
        '''resource_application_name block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_application_name SecurityhubAutomationRule#resource_application_name}
        '''
        result = self._values.get("resource_application_name")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceApplicationName"]]], result)

    @builtins.property
    def resource_details_other(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceDetailsOther"]]]:
        '''resource_details_other block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_details_other SecurityhubAutomationRule#resource_details_other}
        '''
        result = self._values.get("resource_details_other")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceDetailsOther"]]], result)

    @builtins.property
    def resource_id(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceId"]]]:
        '''resource_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_id SecurityhubAutomationRule#resource_id}
        '''
        result = self._values.get("resource_id")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceId"]]], result)

    @builtins.property
    def resource_partition(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourcePartition"]]]:
        '''resource_partition block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_partition SecurityhubAutomationRule#resource_partition}
        '''
        result = self._values.get("resource_partition")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourcePartition"]]], result)

    @builtins.property
    def resource_region(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceRegion"]]]:
        '''resource_region block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_region SecurityhubAutomationRule#resource_region}
        '''
        result = self._values.get("resource_region")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceRegion"]]], result)

    @builtins.property
    def resource_tags(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceTags"]]]:
        '''resource_tags block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_tags SecurityhubAutomationRule#resource_tags}
        '''
        result = self._values.get("resource_tags")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceTags"]]], result)

    @builtins.property
    def resource_type(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceType"]]]:
        '''resource_type block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#resource_type SecurityhubAutomationRule#resource_type}
        '''
        result = self._values.get("resource_type")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceType"]]], result)

    @builtins.property
    def severity_label(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaSeverityLabel"]]]:
        '''severity_label block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#severity_label SecurityhubAutomationRule#severity_label}
        '''
        result = self._values.get("severity_label")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaSeverityLabel"]]], result)

    @builtins.property
    def source_url(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaSourceUrl"]]]:
        '''source_url block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#source_url SecurityhubAutomationRule#source_url}
        '''
        result = self._values.get("source_url")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaSourceUrl"]]], result)

    @builtins.property
    def title(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaTitle"]]]:
        '''title block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#title SecurityhubAutomationRule#title}
        '''
        result = self._values.get("title")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaTitle"]]], result)

    @builtins.property
    def type(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaType"]]]:
        '''type block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#type SecurityhubAutomationRule#type}
        '''
        result = self._values.get("type")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaType"]]], result)

    @builtins.property
    def updated_at(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaUpdatedAt"]]]:
        '''updated_at block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#updated_at SecurityhubAutomationRule#updated_at}
        '''
        result = self._values.get("updated_at")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaUpdatedAt"]]], result)

    @builtins.property
    def user_defined_fields(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaUserDefinedFields"]]]:
        '''user_defined_fields block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#user_defined_fields SecurityhubAutomationRule#user_defined_fields}
        '''
        result = self._values.get("user_defined_fields")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaUserDefinedFields"]]], result)

    @builtins.property
    def verification_state(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaVerificationState"]]]:
        '''verification_state block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#verification_state SecurityhubAutomationRule#verification_state}
        '''
        result = self._values.get("verification_state")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaVerificationState"]]], result)

    @builtins.property
    def workflow_status(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaWorkflowStatus"]]]:
        '''workflow_status block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#workflow_status SecurityhubAutomationRule#workflow_status}
        '''
        result = self._values.get("workflow_status")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaWorkflowStatus"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteria(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaAwsAccountId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaAwsAccountId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee467bec4e88f944b7322fca904ef40c56cd913b52cfd396e2b9a8b669a00736)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaAwsAccountId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaAwsAccountIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaAwsAccountIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fdd16d7ea59e90de397a9ec19bb80da2a6044d2fa9b2d9ac4a85bbafa06d366c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaAwsAccountIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e0614316d7b8657cbf1dbb5ffc071908de54c3e6c263d73aaaebcccaeb5ec1cd)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaAwsAccountIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c6ba9a92e3432b54f1ab1c8118a34df1c026a9b28a9a9d4f962fee2d9cb55a8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__74b22e1deb8b0b566f2bf0ab8a00aa1fbacc5558dd83a73800584920226831c8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3779dbbe0cc47f59696857d5c85386738bc2bf17eda5e71eded311c02918b3ea)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaAwsAccountId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaAwsAccountId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaAwsAccountId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__796070237ba5649c3d6090aeb902825e34d01f6bee5c6bdb1b03eb8e8882326a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaAwsAccountIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaAwsAccountIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7475a1b028d3fe9d6f9e797cd1c065cf37c672c64a0128fe7ea232702e916399)
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
            type_hints = typing.get_type_hints(_typecheckingstub__67741649b739cb2f2e806c72037a5b9633a66b5951f8f978a8235f89074aa7db)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eaef3b72253f8b0cb2eb03b1566674d6febda7938654ecf770cbeaaa436504a1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaAwsAccountId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaAwsAccountId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaAwsAccountId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__74add1db1e4da40b301ff7406a720dfd6df66d1c0c1d192f43533f5efc889633)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaAwsAccountName",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaAwsAccountName:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa458abad56218d98116a3bf70a3972ebaab738820a95b97d3335481a09fecbb)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaAwsAccountName(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaAwsAccountNameList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaAwsAccountNameList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d5f7bb0f7c3207647927be90151d40a9ba6e5fdb8712a0e7f2d9a98f12a08bec)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaAwsAccountNameOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87dfbefad449f5ead2b173299a833fc562fc97ed7ce78fcb7a2387b54262fafc)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaAwsAccountNameOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__31c2265d4705265c6c5167e5fcafca5152ebb5d3e257c27b5a98e7468d83a772)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b4c1d02c16d34f68946164b5caebfacaad1878b740cdb0f0c442729c9f73b46a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__24e4f33f6a7f5ba3ca633e1c69dc6abd01d40004b6b505b56420b038244be3c2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaAwsAccountName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaAwsAccountName]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaAwsAccountName]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__180d2032b407a42e8c849855e9681f784cb0672b0bf187870a3baff957d4f529)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaAwsAccountNameOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaAwsAccountNameOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0c469866efff9222b0c644cbbc15ba56e2ac48339cb55797d7d8a6cde6af940b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__110b4dbf1289bf4a5a6caea92f49834fcf57b8b71ea3e6d4931ecf35feb90e02)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea9cb0cae60e62108fb4a7051c6b03b6add24fefdbb6637c8204a059a692f19a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaAwsAccountName]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaAwsAccountName]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaAwsAccountName]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05bc70ea4c9d1f09c9a5ad1b5b5a3e4c23a574dcd0ed74218cadfb99ed87401d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCompanyName",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaCompanyName:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d053e129be3085cd80764323050cfc114892f3d272b36b9bdc6c8cad052824da)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaCompanyName(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaCompanyNameList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCompanyNameList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8d043b51e60beb84adcd6f4012544b8d1d8c94280414222d22aa422fe4923c14)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaCompanyNameOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__65091a7e0ea9dfdd8dcf76e6134c237e912d1d94a77a26fffdea2ed35a01187b)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaCompanyNameOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__286e90bea0ab1cf72ed270701b12104edd58292ef230f91ad8b83510c074352f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a674d8fea85b5dcfb3517c337913b17e6f3342afe170e136908cf627cb69c823)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8394d9c88c42a7886c4a5d26767530ad34bb713e175875c7ad001a30571a355e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCompanyName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCompanyName]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCompanyName]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__216205cf78563ddcf02134ea7419ac566051cf9096fe7cc9a69209aaf7f5be13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaCompanyNameOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCompanyNameOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__83e63394b7f9f1816980f00570fea52f43ee24b8073aeb89b7d3d28749cc0cbe)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a0f28c5a6eb77d7c23ce9c021d7cd499cbab63833f9bf0171c83a8edd1a011a5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a92598416607abefef46c13fe944be943037c8ba542c12f38230e63197d63a91)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCompanyName]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCompanyName]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCompanyName]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3ab60399c0c5d7fcb5df594c7d0f5a7567adeb9c7ef8079275bad5ea3836b8e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__218c0c34ff7eb1ce6003273ee81f312e33b322639387b41713c41edbdb77505b)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7dc90a4e336db3e4be3bcb85d17aa7cb2aefd311afa2c478eac3816d5ca85086)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__590973afb3e99808a834b8f756828cb1945e2048d69e9c2e362bfffdef0ae4f3)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33924102ba05d6bdfcada4a16ec8f6c3aaa24b28dd7f236e11c320d91870b171)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7eb18fafccb953eb62f91d68bb31134a56a085ae986a6f70153c59610b2ad21f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__98fb2f7db18ea1240671daf0eeabf8aa8b0746772092f8ade4b0795170c00562)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87b9ae7f9dd9a8ce82f7b92d35f2c5f5d399fef932931d2772b91d5341dee488)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__62643ca6ef50494881bf63b2d6aae0991f3d3d54944d1dc1158ea71ab7070b7d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__919921f5e93de5c7fb771e571bb75cd5a55558917e108e8586af52158542e9dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a497ce01910ad1f0a9447d5788cfcb88d9e3112798507c473e21775feb08914f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3cada4e2451a49bf04be4527012ea0f866cba0bdf74dc08eee49a636e6f6ad20)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaComplianceSecurityControlId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaComplianceSecurityControlId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__437ec4c383e5120424bd9d3e7723d7fd370ef07f4ca632795b8d108eb64ea4b5)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaComplianceSecurityControlId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaComplianceSecurityControlIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaComplianceSecurityControlIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3aa164ee06b93830a69ef0dbc2015f19fc457e6205ea67936a8ed26ee1f0c183)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaComplianceSecurityControlIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__156ddfe338229790cd2de91ce2e8761b6e606457e17010fdb1f2ba0f0dc1f058)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaComplianceSecurityControlIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba5d77b634a8f304b1cb0f8b1aeac469ae1ceb895724d1920033ac55fc9e4424)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6198872d30c7985bbcf3598e9680228d96f833f400b9a4b0ab43ab27e06595e3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a7ce714f6e9e473b5bd94fc044f32589fc1c3579b0d05e18775698acbb4b9ae7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceSecurityControlId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceSecurityControlId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceSecurityControlId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0e4ccb7f903ff1275c3d539c678a63db1a6bdc62afb8a04dace437e62025e8a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaComplianceSecurityControlIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaComplianceSecurityControlIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c0d566478d3ea2706369bd148eab37cc8d37cec0c314d8c3418f6f2dfad92c7b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a33c2de334800b4dbe827ab06a4c94cedd83963ef5e6ec1368b0608abc1e84c3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__205fe4a572ab30e087b1f6bc7ef9f6d4669aef592162d82572a75dfe44386dd0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaComplianceSecurityControlId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaComplianceSecurityControlId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaComplianceSecurityControlId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__110ae8dcd0a8583383d04949312a9bfc9db40aaf6154662dee759845313e9cdc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaComplianceStatus",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaComplianceStatus:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b81f6f86a847d43a26f9a3cb6b89c7f2a460b536fc8216f545cad9acbf3bcf8a)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaComplianceStatus(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaComplianceStatusList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaComplianceStatusList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6da83c502d0f5fdee8ac025c7fb69bec05440a841b441b26186249552ed73cb8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaComplianceStatusOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b63240622310c6be1867f330ad68d839b93e2378ba03255dddb6edfe0b804e83)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaComplianceStatusOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2254482669ef6e4f1ab5367a51d62465bbf49c4c52d12019d767429fa573e6a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7151793c540628bd722e06f1220d81b92f33d4172803c6957f893aea80df9e3c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a3e07c555a546feb46525a2ecebf735c6388b427c4be75ae4a1b3e52f4440913)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceStatus]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceStatus]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceStatus]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1135c66b342d04abcfd8b50b44f88b19e1c351607f5851221bbd5fa0b9573cd6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaComplianceStatusOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaComplianceStatusOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__df7874e967b5d67da42e57455f87c3c53a71844c19d32c1a6af0773866ca0b07)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f05ce6474f9926c20099faf630aa4abee4d909e864e1cd5c2bd8673f603e56a2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21d5288e8df0e8d586594540bebb506ae3126f39fd46957c9b57b88570b3edaf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaComplianceStatus]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaComplianceStatus]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaComplianceStatus]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d4567b026aca47d390ec4ae9ed127854fcec99530ee53fc53c6cc8d2b635d0e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaConfidence",
    jsii_struct_bases=[],
    name_mapping={"eq": "eq", "gt": "gt", "gte": "gte", "lt": "lt", "lte": "lte"},
)
class SecurityhubAutomationRuleCriteriaConfidence:
    def __init__(
        self,
        *,
        eq: typing.Optional[jsii.Number] = None,
        gt: typing.Optional[jsii.Number] = None,
        gte: typing.Optional[jsii.Number] = None,
        lt: typing.Optional[jsii.Number] = None,
        lte: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param eq: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#eq SecurityhubAutomationRule#eq}.
        :param gt: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#gt SecurityhubAutomationRule#gt}.
        :param gte: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#gte SecurityhubAutomationRule#gte}.
        :param lt: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#lt SecurityhubAutomationRule#lt}.
        :param lte: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#lte SecurityhubAutomationRule#lte}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ef1c6a386fc50d5bf1afed1d00c56f47e142ee85f96d79502459535a1b9449a)
            check_type(argname="argument eq", value=eq, expected_type=type_hints["eq"])
            check_type(argname="argument gt", value=gt, expected_type=type_hints["gt"])
            check_type(argname="argument gte", value=gte, expected_type=type_hints["gte"])
            check_type(argname="argument lt", value=lt, expected_type=type_hints["lt"])
            check_type(argname="argument lte", value=lte, expected_type=type_hints["lte"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if eq is not None:
            self._values["eq"] = eq
        if gt is not None:
            self._values["gt"] = gt
        if gte is not None:
            self._values["gte"] = gte
        if lt is not None:
            self._values["lt"] = lt
        if lte is not None:
            self._values["lte"] = lte

    @builtins.property
    def eq(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#eq SecurityhubAutomationRule#eq}.'''
        result = self._values.get("eq")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def gt(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#gt SecurityhubAutomationRule#gt}.'''
        result = self._values.get("gt")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def gte(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#gte SecurityhubAutomationRule#gte}.'''
        result = self._values.get("gte")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def lt(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#lt SecurityhubAutomationRule#lt}.'''
        result = self._values.get("lt")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def lte(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#lte SecurityhubAutomationRule#lte}.'''
        result = self._values.get("lte")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaConfidence(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaConfidenceList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaConfidenceList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__eeb32c4c393eb3a7c84cf877047f4a1143d124243b2cbaa5388bc5c4b38aeaa0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaConfidenceOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12a8180cc0a38debd833d07523fbb7dadf1cbfafaeb97ebdd8574276cfbbee3e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaConfidenceOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__374195fc2a7491ef6efb3b9a6fde2dd0911a7a660fcff40ffa4594aaf4d968e0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4a3621d241b7da12fa48d20a64fa9c5ac66562e112fc7bad906e0f1ffa6038d2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a0c64827800acdefe9b2e41a424a323a48a536a1056451b6f47ce3442d6861a7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaConfidence]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaConfidence]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaConfidence]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cbd38179e4d518c0cdaf2bca4347150e5b7bad8a7a47eb56b3d892eb96605b25)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaConfidenceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaConfidenceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5e2194239918345725279c133c4bd58d8015ee50007ff4d9911c3d50f5d69b41)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetEq")
    def reset_eq(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEq", []))

    @jsii.member(jsii_name="resetGt")
    def reset_gt(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGt", []))

    @jsii.member(jsii_name="resetGte")
    def reset_gte(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGte", []))

    @jsii.member(jsii_name="resetLt")
    def reset_lt(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLt", []))

    @jsii.member(jsii_name="resetLte")
    def reset_lte(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLte", []))

    @builtins.property
    @jsii.member(jsii_name="eqInput")
    def eq_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "eqInput"))

    @builtins.property
    @jsii.member(jsii_name="gteInput")
    def gte_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "gteInput"))

    @builtins.property
    @jsii.member(jsii_name="gtInput")
    def gt_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "gtInput"))

    @builtins.property
    @jsii.member(jsii_name="lteInput")
    def lte_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "lteInput"))

    @builtins.property
    @jsii.member(jsii_name="ltInput")
    def lt_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "ltInput"))

    @builtins.property
    @jsii.member(jsii_name="eq")
    def eq(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "eq"))

    @eq.setter
    def eq(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2af5645f0d2535479f14ac1540349ac0ceb6ecc80c2358ef29190512ad4f0c58)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "eq", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="gt")
    def gt(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "gt"))

    @gt.setter
    def gt(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a80a7a8785450156f6ac356e2ed44473708803de7c4d03e0fa665bd5611b7e21)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "gt", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="gte")
    def gte(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "gte"))

    @gte.setter
    def gte(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c0fe5bfa636678e14406ec2cd8da979d6694e87cab8ef7059df3ca7cb8bffeb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "gte", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lt")
    def lt(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "lt"))

    @lt.setter
    def lt(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c728a1a52d4f4504aa114ecafd7bd145aa1de91eeed1a109eb8b0878e83a4d03)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lt", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lte")
    def lte(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "lte"))

    @lte.setter
    def lte(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb4a08f897603707fe69d26d8edde9c90280af7175b1f1141b6c028ed2e35219)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lte", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaConfidence]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaConfidence]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaConfidence]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bebe24b10a9169379ae9f68e99edad326e240e13f12bad2a619e2f45fdea5fb2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCreatedAt",
    jsii_struct_bases=[],
    name_mapping={"date_range": "dateRange", "end": "end", "start": "start"},
)
class SecurityhubAutomationRuleCriteriaCreatedAt:
    def __init__(
        self,
        *,
        date_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaCreatedAtDateRange", typing.Dict[builtins.str, typing.Any]]]]] = None,
        end: typing.Optional[builtins.str] = None,
        start: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param date_range: date_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#date_range SecurityhubAutomationRule#date_range}
        :param end: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#end SecurityhubAutomationRule#end}.
        :param start: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#start SecurityhubAutomationRule#start}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e507c9c9503ce48e9f8a6258d758185920f3126c536fe525a776e0111501980f)
            check_type(argname="argument date_range", value=date_range, expected_type=type_hints["date_range"])
            check_type(argname="argument end", value=end, expected_type=type_hints["end"])
            check_type(argname="argument start", value=start, expected_type=type_hints["start"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if date_range is not None:
            self._values["date_range"] = date_range
        if end is not None:
            self._values["end"] = end
        if start is not None:
            self._values["start"] = start

    @builtins.property
    def date_range(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaCreatedAtDateRange"]]]:
        '''date_range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#date_range SecurityhubAutomationRule#date_range}
        '''
        result = self._values.get("date_range")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaCreatedAtDateRange"]]], result)

    @builtins.property
    def end(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#end SecurityhubAutomationRule#end}.'''
        result = self._values.get("end")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def start(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#start SecurityhubAutomationRule#start}.'''
        result = self._values.get("start")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaCreatedAt(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCreatedAtDateRange",
    jsii_struct_bases=[],
    name_mapping={"unit": "unit", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaCreatedAtDateRange:
    def __init__(self, *, unit: builtins.str, value: jsii.Number) -> None:
        '''
        :param unit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#unit SecurityhubAutomationRule#unit}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__083c6a7303e3fb3b01209d4914805e74b77709206d48d5e70e15b98c2430db21)
            check_type(argname="argument unit", value=unit, expected_type=type_hints["unit"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "unit": unit,
            "value": value,
        }

    @builtins.property
    def unit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#unit SecurityhubAutomationRule#unit}.'''
        result = self._values.get("unit")
        assert result is not None, "Required property 'unit' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaCreatedAtDateRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaCreatedAtDateRangeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCreatedAtDateRangeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cb0fc5b8251a18dd3f734b84ce93d7aebc1b7e8fc95601cc270d5de2e5415e88)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaCreatedAtDateRangeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f93759e96b1bbf03bdca4169e63299fa2d845f2f084ee2f4c6c492437422801f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaCreatedAtDateRangeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f975ac6c2fa76c02df7c8ea33b72448df137644104a5b14709e1cb28c9cd36f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__95565e45d2d9dac06618f35bccbbcf13a3087215b541ac6fecc738222df98509)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c2def93cfeb526caac22479eed8eabdb6ba7d0f5cf5c2c79bb16b67f1eead56e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCreatedAtDateRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCreatedAtDateRange]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCreatedAtDateRange]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__66e479f67bf94af0d699416d038e58f308749436400682185674d35f9c0f8084)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaCreatedAtDateRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCreatedAtDateRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ed7bdfebd22f21de1acb3ae448e0fd32b6801a60c31f211035ea4158d91e059e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="unitInput")
    def unit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "unitInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="unit")
    def unit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "unit"))

    @unit.setter
    def unit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4eeb8e8aa8f916502bd060750a09cffd9e26c43d10cc65110fff5f0b0400df5a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "unit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @value.setter
    def value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b55f02f43325ed5635c553ff04e7acc7da0dd67dee91b59be4c8255f573e4262)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCreatedAtDateRange]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCreatedAtDateRange]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCreatedAtDateRange]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__104c9db5b52a9b08d8dc7a646eed207025290621faeae9fd6fffff21acddbecd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaCreatedAtList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCreatedAtList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2114b27a251f5a35b9648bbdee7ed559603abd9249e4bc3bf2dc78db7ccb75ff)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaCreatedAtOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__565f52c9cfcc8b1d95207cb057db12303f680b42000bc69b3c39df530034a68a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaCreatedAtOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d8de726fa5291a129bf8275d766a98742b01773fcdb761d9eac30687e754474)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9d97bcedf94004069f50995f97c0d96f1058505af7a8e3821d2bca1ffa1b32fb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e05e92ef0f892e0f71ec07c97d7022a2fe5fcef92f29ab81d1c0793f5c553376)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCreatedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCreatedAt]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCreatedAt]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8c9c9fc9076f463c87b01558dc6f617b00f28e76ce42735c9a8f2d62aaad099)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaCreatedAtOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCreatedAtOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8b3a43ac36d2969647252a1e556d66f4b80f6774107537905bed3ee2710bce3f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putDateRange")
    def put_date_range(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaCreatedAtDateRange, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__95a524ff423f8657a266163783f0bebd349636dbafa482d31aab514be84eb101)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDateRange", [value]))

    @jsii.member(jsii_name="resetDateRange")
    def reset_date_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDateRange", []))

    @jsii.member(jsii_name="resetEnd")
    def reset_end(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnd", []))

    @jsii.member(jsii_name="resetStart")
    def reset_start(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStart", []))

    @builtins.property
    @jsii.member(jsii_name="dateRange")
    def date_range(self) -> SecurityhubAutomationRuleCriteriaCreatedAtDateRangeList:
        return typing.cast(SecurityhubAutomationRuleCriteriaCreatedAtDateRangeList, jsii.get(self, "dateRange"))

    @builtins.property
    @jsii.member(jsii_name="dateRangeInput")
    def date_range_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCreatedAtDateRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCreatedAtDateRange]]], jsii.get(self, "dateRangeInput"))

    @builtins.property
    @jsii.member(jsii_name="endInput")
    def end_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endInput"))

    @builtins.property
    @jsii.member(jsii_name="startInput")
    def start_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startInput"))

    @builtins.property
    @jsii.member(jsii_name="end")
    def end(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "end"))

    @end.setter
    def end(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a60bc1fdc663b6e6562205fd59df757f821b3bbf541e52b00cc83614f5d9e3a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "end", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="start")
    def start(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "start"))

    @start.setter
    def start(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b17ebaf99fe6ea7a91a37a1875e50e0030fa4bcb6bf51a3426aacfa46824f857)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "start", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCreatedAt]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCreatedAt]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCreatedAt]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__879f6e2d0121fef8d9a1b464bb9460428a6ef32d9efad3f2086f1643239a3574)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCriticality",
    jsii_struct_bases=[],
    name_mapping={"eq": "eq", "gt": "gt", "gte": "gte", "lt": "lt", "lte": "lte"},
)
class SecurityhubAutomationRuleCriteriaCriticality:
    def __init__(
        self,
        *,
        eq: typing.Optional[jsii.Number] = None,
        gt: typing.Optional[jsii.Number] = None,
        gte: typing.Optional[jsii.Number] = None,
        lt: typing.Optional[jsii.Number] = None,
        lte: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param eq: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#eq SecurityhubAutomationRule#eq}.
        :param gt: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#gt SecurityhubAutomationRule#gt}.
        :param gte: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#gte SecurityhubAutomationRule#gte}.
        :param lt: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#lt SecurityhubAutomationRule#lt}.
        :param lte: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#lte SecurityhubAutomationRule#lte}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d52819d41a14342a9a17a261b06fd6e0bee9c4e7207accf2ff56fa6e357fb131)
            check_type(argname="argument eq", value=eq, expected_type=type_hints["eq"])
            check_type(argname="argument gt", value=gt, expected_type=type_hints["gt"])
            check_type(argname="argument gte", value=gte, expected_type=type_hints["gte"])
            check_type(argname="argument lt", value=lt, expected_type=type_hints["lt"])
            check_type(argname="argument lte", value=lte, expected_type=type_hints["lte"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if eq is not None:
            self._values["eq"] = eq
        if gt is not None:
            self._values["gt"] = gt
        if gte is not None:
            self._values["gte"] = gte
        if lt is not None:
            self._values["lt"] = lt
        if lte is not None:
            self._values["lte"] = lte

    @builtins.property
    def eq(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#eq SecurityhubAutomationRule#eq}.'''
        result = self._values.get("eq")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def gt(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#gt SecurityhubAutomationRule#gt}.'''
        result = self._values.get("gt")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def gte(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#gte SecurityhubAutomationRule#gte}.'''
        result = self._values.get("gte")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def lt(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#lt SecurityhubAutomationRule#lt}.'''
        result = self._values.get("lt")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def lte(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#lte SecurityhubAutomationRule#lte}.'''
        result = self._values.get("lte")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaCriticality(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaCriticalityList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCriticalityList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__49a47cc2094c4059cd15f0c7e99adc9d7f1167bb789d714301e4a7ff8471c8da)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaCriticalityOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b8a42c159d3c5b059021f4231841d861845983a43abe060bc4bdd53f329436c4)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaCriticalityOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf7e3832146b41aa90a639870d114e0932d08b19524331ea5dc701435c456963)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3ac96b2388c1033b1581a3c6aa4fab642e70331023e6d35d99bffc6269e6a4eb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__01432da8a8ea741dfd3d3d9718233e90c7d9f480b1d128a39476c6540e37babd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCriticality]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCriticality]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCriticality]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b34d8eaabb364feba2d9380b9956e69e0d642137e6a589a63d8ca11375a6aa1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaCriticalityOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaCriticalityOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f0df0ca682c5f29be0bfa36d48cdb35224113b58ad895b8fcdb1a02bd839eec7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetEq")
    def reset_eq(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEq", []))

    @jsii.member(jsii_name="resetGt")
    def reset_gt(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGt", []))

    @jsii.member(jsii_name="resetGte")
    def reset_gte(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGte", []))

    @jsii.member(jsii_name="resetLt")
    def reset_lt(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLt", []))

    @jsii.member(jsii_name="resetLte")
    def reset_lte(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLte", []))

    @builtins.property
    @jsii.member(jsii_name="eqInput")
    def eq_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "eqInput"))

    @builtins.property
    @jsii.member(jsii_name="gteInput")
    def gte_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "gteInput"))

    @builtins.property
    @jsii.member(jsii_name="gtInput")
    def gt_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "gtInput"))

    @builtins.property
    @jsii.member(jsii_name="lteInput")
    def lte_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "lteInput"))

    @builtins.property
    @jsii.member(jsii_name="ltInput")
    def lt_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "ltInput"))

    @builtins.property
    @jsii.member(jsii_name="eq")
    def eq(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "eq"))

    @eq.setter
    def eq(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3dda5d5d758eaa695eb04ca211229bf62b5f69be90ba452a2c1c88357ed88884)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "eq", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="gt")
    def gt(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "gt"))

    @gt.setter
    def gt(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e87a61c6c06224dbe5b543f6be554b8d7b7d1f4c4bfc67a014c9a34277c763c9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "gt", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="gte")
    def gte(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "gte"))

    @gte.setter
    def gte(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ecfae0ca5a8475111e0cd45d0e3f3c85e01ac87be9a2fb825b58ac30c7af5ced)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "gte", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lt")
    def lt(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "lt"))

    @lt.setter
    def lt(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f176a7e1c75796677155d33074215e07b80abccbaeef63263e24d45cc5a8ea6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lt", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lte")
    def lte(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "lte"))

    @lte.setter
    def lte(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3c8941508313c13d8a9b409a0371b360204522cfdbfa82b6d72ddfb84d0cc3e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lte", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCriticality]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCriticality]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCriticality]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2248ad30e307ba5b314445f01983e652430b7debf75dd557f23cc5a49d9d9ac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaDescription",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaDescription:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e4dd77a13b20c89503e30ab32025f7f77315877429b152d9d4f84ea7e374c6bd)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaDescription(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaDescriptionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaDescriptionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__773e190cc356ac8bd4f896da8de1ac41ff0f697bfbe77917f5c499803948adf6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaDescriptionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6238be16076a43cff96efec0aee05cd56fe1e773d266e010fc179a918f3868ee)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaDescriptionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__be80784914db368798dc65716c04d8d504f61191173bf8dbb2c16bd9875ae4c2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__26d9e233131ad7310344752a1b944cd6f0f630f749d9f1130f8f1aed0f78cb4d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cd6ec4b1aab92c7936a27d4e672edb0a6145980f07a31297847722229e98d45a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaDescription]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaDescription]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaDescription]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d668366c81ffe695801294687b87c5c5347165e2d1241142dd20d56810cf3a1d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaDescriptionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaDescriptionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__961eb8bee346d5fc48e233f6ba332b7797f620ae9af52da650489d63342e3300)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ae2f4fc7d26b12bd320402bc5b834e4569e18bb7c88530d31418dc4041a4f779)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__27afa9df3cded8950ad545c64b40da77971fb055f448fc6e33085414c32234a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaDescription]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaDescription]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaDescription]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__084a8ceb5ca0d1edd58198aecb53a341645c1fd815178b81806c082753b624da)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaFirstObservedAt",
    jsii_struct_bases=[],
    name_mapping={"date_range": "dateRange", "end": "end", "start": "start"},
)
class SecurityhubAutomationRuleCriteriaFirstObservedAt:
    def __init__(
        self,
        *,
        date_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange", typing.Dict[builtins.str, typing.Any]]]]] = None,
        end: typing.Optional[builtins.str] = None,
        start: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param date_range: date_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#date_range SecurityhubAutomationRule#date_range}
        :param end: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#end SecurityhubAutomationRule#end}.
        :param start: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#start SecurityhubAutomationRule#start}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eecf3c552c58e6dab9cfa94355f0e6e0c49d54cd3c17b989dda3f1271dbcc485)
            check_type(argname="argument date_range", value=date_range, expected_type=type_hints["date_range"])
            check_type(argname="argument end", value=end, expected_type=type_hints["end"])
            check_type(argname="argument start", value=start, expected_type=type_hints["start"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if date_range is not None:
            self._values["date_range"] = date_range
        if end is not None:
            self._values["end"] = end
        if start is not None:
            self._values["start"] = start

    @builtins.property
    def date_range(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange"]]]:
        '''date_range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#date_range SecurityhubAutomationRule#date_range}
        '''
        result = self._values.get("date_range")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange"]]], result)

    @builtins.property
    def end(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#end SecurityhubAutomationRule#end}.'''
        result = self._values.get("end")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def start(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#start SecurityhubAutomationRule#start}.'''
        result = self._values.get("start")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaFirstObservedAt(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange",
    jsii_struct_bases=[],
    name_mapping={"unit": "unit", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange:
    def __init__(self, *, unit: builtins.str, value: jsii.Number) -> None:
        '''
        :param unit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#unit SecurityhubAutomationRule#unit}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59d861baa5e200b3bbb9209498bb53355aa933a61066e87bacedff50d767727c)
            check_type(argname="argument unit", value=unit, expected_type=type_hints["unit"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "unit": unit,
            "value": value,
        }

    @builtins.property
    def unit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#unit SecurityhubAutomationRule#unit}.'''
        result = self._values.get("unit")
        assert result is not None, "Required property 'unit' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaFirstObservedAtDateRangeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaFirstObservedAtDateRangeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__895bb094c06c6fbc56ad6c2e916f76f272dc2a4213d1ed63f492dbc190e6cba0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaFirstObservedAtDateRangeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8f0e2cefa2088581a1830f06a220cabc5ed40f74b356b123e1e9141337be8973)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaFirstObservedAtDateRangeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce14f58567c26be68c199f96a06e74caf066f269161774ca9fd98f8f51952b6c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2d70e4b0dabf1737f9654669a2afc49d3b3a76f147c4aabfd184dfa70e7b2286)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f5a75854e3a6c4bc16e17066744a11367664c88d8a976411a20e8701404926c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0bb02df158b179f8c2dcb209a38cc083ae4d91ca852d69d860526abf08281b2e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaFirstObservedAtDateRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaFirstObservedAtDateRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7b7510e9e554dd18ce3c23fd66f51ffe320f3ed05ea4d87757ef2428fd868b31)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="unitInput")
    def unit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "unitInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="unit")
    def unit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "unit"))

    @unit.setter
    def unit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d3a7c3894b35398464dbab8409a5f6f258ef5798362658a9b7f9f0389530870)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "unit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @value.setter
    def value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__220a704972cba1f62e7a950c4cdf4884d8db30c71bdf91cf75048257e823f787)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37833d5a9bade6f2dc7b81e7a8a129238614962cf0d1d22eae7aa0fa465ad8d8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaFirstObservedAtList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaFirstObservedAtList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5203dce4d22e934f934790852c8ec02768c3ab6f8c8bb8105b515a76808167b3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaFirstObservedAtOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ddc4e4206cba45acec3327f1b2e245b393d0d0a7b06d78e171c25a5bf9d72fd2)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaFirstObservedAtOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__714a035a58d34130ef00e534dada23b69b8cf9de93031f2d26e066dc956b4e07)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bcaa37d50e90f5a989060f69d5288b407c31427360e8259c6db91d50c2e624dc)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2a775a27d8182d4de5958922a825e79400e8589f4cf3d30bc9d8d608cefb0214)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaFirstObservedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaFirstObservedAt]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaFirstObservedAt]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a8a7e739bb839c1737a9fec7e9abb7fab4be64aef5ff8ac317080139e7fed97a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaFirstObservedAtOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaFirstObservedAtOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a7da9978353672bc690181d45f991fae709117268e42cb1b0aed45caf8e0f2a3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putDateRange")
    def put_date_range(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e48000207db9e747589c97e3d5afb80d8144b8bb787672918294af6fe62f438)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDateRange", [value]))

    @jsii.member(jsii_name="resetDateRange")
    def reset_date_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDateRange", []))

    @jsii.member(jsii_name="resetEnd")
    def reset_end(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnd", []))

    @jsii.member(jsii_name="resetStart")
    def reset_start(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStart", []))

    @builtins.property
    @jsii.member(jsii_name="dateRange")
    def date_range(
        self,
    ) -> SecurityhubAutomationRuleCriteriaFirstObservedAtDateRangeList:
        return typing.cast(SecurityhubAutomationRuleCriteriaFirstObservedAtDateRangeList, jsii.get(self, "dateRange"))

    @builtins.property
    @jsii.member(jsii_name="dateRangeInput")
    def date_range_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange]]], jsii.get(self, "dateRangeInput"))

    @builtins.property
    @jsii.member(jsii_name="endInput")
    def end_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endInput"))

    @builtins.property
    @jsii.member(jsii_name="startInput")
    def start_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startInput"))

    @builtins.property
    @jsii.member(jsii_name="end")
    def end(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "end"))

    @end.setter
    def end(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0e52c7b102d1bff368e0db13e66da1a7a886a4a358ad343af436dd711569af0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "end", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="start")
    def start(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "start"))

    @start.setter
    def start(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18dc7be70be886052c9ae9c02f4f31164eeaf06cdb78116bbd4fc94df6c818b1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "start", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaFirstObservedAt]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaFirstObservedAt]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaFirstObservedAt]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75b1fd59dbcfbc22f66a2e805aa138a418b51399aa3c526ea627a0e44c7e1e17)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaGeneratorId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaGeneratorId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06672acca54e1c449926e779f2d438f05ed17464c99d70e0ecd2d9d22bbc92b4)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaGeneratorId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaGeneratorIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaGeneratorIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2deb123d6a85ce7608f5626c651541a9111fdbecfac50861de90bca3ee75eb7f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaGeneratorIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__72b4b3c53da0bcb1fc7c1edde67b2a051b1ca524eb19d276264c3c5ad5438306)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaGeneratorIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a6abbf6b5c4996b580ecc591892ded934d3714b8ddd729c5fb3117c4b979cd5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a592ec4c0e9a1cfcc119098e0e017057f40adc3bcadb320ae21762be325c1403)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5b8d61702c90ac5a291d2a93de511d99fe2ba15820ff657a202f8da49bdb9a27)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaGeneratorId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaGeneratorId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaGeneratorId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e79fcd0249d6ad976acd9ffe7d4bb067602aef4caee3eb33b1329df784097d31)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaGeneratorIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaGeneratorIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8eabca1cdc516329efe14f89ec624c65de0427743e51128ba0156a30950361d1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4d774af4e3384e7336bef163a3474c14cb79723b9b17b62c5ab6f5e3162cf44f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e442ddaacef4e0a3c7d59e43eea85bcf590f0115ee0fbcaedb954521adea4b4d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaGeneratorId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaGeneratorId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaGeneratorId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f32fd3f8cad638208187b0c4cff2bc2f548e3fa24f8e6bb1e1246bf7508adadf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2d550c87fee9662fe7dfd3d066c0b4f4ea45663933780c7f8e46d271449ab64b)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__232b0de31fd7f9c0d9a451f584f3cd71d7958bc55bc725ddc0bf72fd252790f9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__71a9a86bd51f7474817239d550d8ef0942fbcf19dea2c302fc509bcb82642900)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__496c6ea4d3b1209a667086dd709f939a66c1020dc7582922d8f5b105ba7f08de)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a1aaf256db81a8bcbb326f851b0238bc166e4c3970e4563fc55755993face07d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__62b8c668e15581133cd8459504fc07de8b3166814d9ca3eb5230dbbd32d44fb5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__910be3b8b601df69dd11ee56faabcb4387c09989e02fbfe878ff3d61f8a8116b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__44c5a0605cf1f011c510a4ae2ba8f100fe0c3d4950c60e1375e86f7d91758044)
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
            type_hints = typing.get_type_hints(_typecheckingstub__81d7c4b7c2f2f4e1fcfc69ff9057106888924b0dca1088924a0e2fa29890e157)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__72c18d70012997da93019b1c18a7bd1a272769db2066402d7b11d39e3550b8ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa9f53080d833a893971c8cb230da7c5684ff2e6a1f3e0bcb28ba7f8f936b8ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaLastObservedAt",
    jsii_struct_bases=[],
    name_mapping={"date_range": "dateRange", "end": "end", "start": "start"},
)
class SecurityhubAutomationRuleCriteriaLastObservedAt:
    def __init__(
        self,
        *,
        date_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaLastObservedAtDateRange", typing.Dict[builtins.str, typing.Any]]]]] = None,
        end: typing.Optional[builtins.str] = None,
        start: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param date_range: date_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#date_range SecurityhubAutomationRule#date_range}
        :param end: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#end SecurityhubAutomationRule#end}.
        :param start: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#start SecurityhubAutomationRule#start}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84e9d72f9ba566002d3cc3d9f0fe9d664f118d4e73da76e408f3438b9a7c1af8)
            check_type(argname="argument date_range", value=date_range, expected_type=type_hints["date_range"])
            check_type(argname="argument end", value=end, expected_type=type_hints["end"])
            check_type(argname="argument start", value=start, expected_type=type_hints["start"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if date_range is not None:
            self._values["date_range"] = date_range
        if end is not None:
            self._values["end"] = end
        if start is not None:
            self._values["start"] = start

    @builtins.property
    def date_range(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaLastObservedAtDateRange"]]]:
        '''date_range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#date_range SecurityhubAutomationRule#date_range}
        '''
        result = self._values.get("date_range")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaLastObservedAtDateRange"]]], result)

    @builtins.property
    def end(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#end SecurityhubAutomationRule#end}.'''
        result = self._values.get("end")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def start(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#start SecurityhubAutomationRule#start}.'''
        result = self._values.get("start")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaLastObservedAt(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaLastObservedAtDateRange",
    jsii_struct_bases=[],
    name_mapping={"unit": "unit", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaLastObservedAtDateRange:
    def __init__(self, *, unit: builtins.str, value: jsii.Number) -> None:
        '''
        :param unit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#unit SecurityhubAutomationRule#unit}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba8f158ffd9c33466e6173851a626dcf7b63b341e7f70b63e0d088b22e62aacb)
            check_type(argname="argument unit", value=unit, expected_type=type_hints["unit"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "unit": unit,
            "value": value,
        }

    @builtins.property
    def unit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#unit SecurityhubAutomationRule#unit}.'''
        result = self._values.get("unit")
        assert result is not None, "Required property 'unit' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaLastObservedAtDateRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaLastObservedAtDateRangeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaLastObservedAtDateRangeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ade4a715f9be3873b8810146d4c56e2c0c1a5eee7aabe1d96caf519a948172f1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaLastObservedAtDateRangeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__872271780933039375eb5d01a7abb5d986c2b8e71d45823922755be8120ff04b)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaLastObservedAtDateRangeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d97e45817c61cd637c0be41c70f8c75f22f43b38b2ab482b00f7054dbf734dea)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a5deca6d9b1ed9504c28e58ec995d631028bbd2e6b28c81dd0e10bebf2dbbe2c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__29ffb4af97d6d762bd456d3b999dab76fccebb4b1bf00dbf581c076a5167863e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaLastObservedAtDateRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaLastObservedAtDateRange]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaLastObservedAtDateRange]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__539521a13072f781fc21e632ba345e0e7b77b2d0904fab5acd8ad9cf1421e253)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaLastObservedAtDateRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaLastObservedAtDateRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ffab9e555210dd198e3104741a11e211b2cb0d83a05b0862a95bc2403cdbddfb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="unitInput")
    def unit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "unitInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="unit")
    def unit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "unit"))

    @unit.setter
    def unit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a691b4942b28844a2540d0992372ebbbeae0f9a29d6799146466acc09dc4173)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "unit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @value.setter
    def value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43c045959047510c0cc0c5b138ce82a79449db3d54cb8960314bb331862e8bb8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaLastObservedAtDateRange]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaLastObservedAtDateRange]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaLastObservedAtDateRange]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43571997ab03ba951eeb294959e4f60fb9198af255f29cdc9356d751a8e31f8b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaLastObservedAtList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaLastObservedAtList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bd937489fd953ddef38c04d83800c454803a75550a224e4590143216bf866d11)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaLastObservedAtOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf8cb8abe6cb2137ef36add4384432ccfcc3fe465581d8a58d33650efce45623)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaLastObservedAtOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e2aacbf2ab31aba0fb472d61e7be077135497ec2f26878b94bb500583f08b4fb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__59de6b4c6b66b64ac2534a2341bf28c2dccb85b5c347b3c1c0da8b3f4da6b0b3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8f1e1c9241d3232503f2b60270eb5d133851f6d912d597b52c2263b01263209a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaLastObservedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaLastObservedAt]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaLastObservedAt]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__50372a99a8be9613251543f61f292094d8a0cc74e1c325ab7ae9abd72a4f32f0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaLastObservedAtOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaLastObservedAtOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__865709ffb7f1cffb0d861d5ec3aa55018b405af77c918a1df50814cfdd1db937)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putDateRange")
    def put_date_range(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaLastObservedAtDateRange, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b811b6157f0a8952debbeb23fb51dcd42dfb53ee785676a9043a463318f888b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDateRange", [value]))

    @jsii.member(jsii_name="resetDateRange")
    def reset_date_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDateRange", []))

    @jsii.member(jsii_name="resetEnd")
    def reset_end(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnd", []))

    @jsii.member(jsii_name="resetStart")
    def reset_start(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStart", []))

    @builtins.property
    @jsii.member(jsii_name="dateRange")
    def date_range(
        self,
    ) -> SecurityhubAutomationRuleCriteriaLastObservedAtDateRangeList:
        return typing.cast(SecurityhubAutomationRuleCriteriaLastObservedAtDateRangeList, jsii.get(self, "dateRange"))

    @builtins.property
    @jsii.member(jsii_name="dateRangeInput")
    def date_range_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaLastObservedAtDateRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaLastObservedAtDateRange]]], jsii.get(self, "dateRangeInput"))

    @builtins.property
    @jsii.member(jsii_name="endInput")
    def end_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endInput"))

    @builtins.property
    @jsii.member(jsii_name="startInput")
    def start_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startInput"))

    @builtins.property
    @jsii.member(jsii_name="end")
    def end(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "end"))

    @end.setter
    def end(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40af026fae839f033704ce38eb3503cdaac571bc88eca76798c98893a76891e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "end", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="start")
    def start(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "start"))

    @start.setter
    def start(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__693dc658fee4b3f7f79b99680dcc58c21e9cd8cbaa2b23603c68d40d67cecf3b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "start", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaLastObservedAt]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaLastObservedAt]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaLastObservedAt]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e4d98f3d2e53758bfee52f6933077e3fd7b59a67773498fb0b59b3799084787)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0477c1fb078162f3ade0a4d3948d1e255221b4c01b5b8d428120b7747d692210)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3027cf25d4c6c502896aa88b8fcdf9a32a31ffe508974ca439c46f5b26da4be7)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca3d782c19a1287d84402d1e950a9fc6c739a99feaca341a8925ca04e69c7347)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6f2a7d5bc80f7dc773ab093ac87f42072a5d88607084b5a9937cd67b102a6265)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b359680d5568eaacc62c35725237e2e308c85861ee5b41ebbaf0cf6cc86735e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteria]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteria]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteria]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6661896328db72dd2c1e0f2827eb2b668a6dfb3160526ccd0015e6c7dbb472ad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaNoteText",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaNoteText:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aaa67a7df4487e80581ca5a0eaa7df2a40eef47ef08c3dbb5e8afe436f4317f4)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaNoteText(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaNoteTextList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaNoteTextList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__29a464297d13295e6c8a5e7a3b6321793ebab907aef377e9d00ec3c82cf859c7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaNoteTextOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59dc26298248a69f12c277632ad9bb390acfecea78502936f7c035b2d5153f1e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaNoteTextOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c0f61d536e5a7117ef7cc24c3f215713f0cc6c941ccb96f9c7065f178fa69c7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__37fad9c0e3c27757b70d49add2a1caa81ddaf21dda610efde3f83d893e03f3e7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cec4ffc9096d6af9880d452240349609252ed90888da0b4169fcf33c69bd0921)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteText]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteText]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteText]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce67d116646a5558cc127d0b01c9249acdc387d6aae190c1322f65069bb5b38f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaNoteTextOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaNoteTextOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__333b01b0e257c33fdd38501706d008c91dbb75484152282ce306fdcb50ae966c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2860b7f9471b07916eb57756aea254262e643be704c02431d7c3d71934870133)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2cfd8e9982160cb2530ab5ac9e4d30181493fc6acd40ad5b61c5b614c8d585aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteText]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteText]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteText]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0511b61ffe0e4fd09a58b3ee0f48430c533e316f9756665142fd5862e8959a6d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaNoteUpdatedAt",
    jsii_struct_bases=[],
    name_mapping={"date_range": "dateRange", "end": "end", "start": "start"},
)
class SecurityhubAutomationRuleCriteriaNoteUpdatedAt:
    def __init__(
        self,
        *,
        date_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange", typing.Dict[builtins.str, typing.Any]]]]] = None,
        end: typing.Optional[builtins.str] = None,
        start: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param date_range: date_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#date_range SecurityhubAutomationRule#date_range}
        :param end: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#end SecurityhubAutomationRule#end}.
        :param start: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#start SecurityhubAutomationRule#start}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e10ffcdee2e92e032b604cd4f967903e0332966aac687798f259c6fee998911)
            check_type(argname="argument date_range", value=date_range, expected_type=type_hints["date_range"])
            check_type(argname="argument end", value=end, expected_type=type_hints["end"])
            check_type(argname="argument start", value=start, expected_type=type_hints["start"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if date_range is not None:
            self._values["date_range"] = date_range
        if end is not None:
            self._values["end"] = end
        if start is not None:
            self._values["start"] = start

    @builtins.property
    def date_range(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange"]]]:
        '''date_range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#date_range SecurityhubAutomationRule#date_range}
        '''
        result = self._values.get("date_range")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange"]]], result)

    @builtins.property
    def end(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#end SecurityhubAutomationRule#end}.'''
        result = self._values.get("end")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def start(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#start SecurityhubAutomationRule#start}.'''
        result = self._values.get("start")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaNoteUpdatedAt(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange",
    jsii_struct_bases=[],
    name_mapping={"unit": "unit", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange:
    def __init__(self, *, unit: builtins.str, value: jsii.Number) -> None:
        '''
        :param unit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#unit SecurityhubAutomationRule#unit}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9acfd9b2a242344d77d85454bab76669b8a086456ffd7ee120455d7674cad43f)
            check_type(argname="argument unit", value=unit, expected_type=type_hints["unit"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "unit": unit,
            "value": value,
        }

    @builtins.property
    def unit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#unit SecurityhubAutomationRule#unit}.'''
        result = self._values.get("unit")
        assert result is not None, "Required property 'unit' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRangeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRangeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__925437ac338aa1959724986fcea07856547f9e342226be0ddfa2286f19f9bad4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRangeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__82c6390e87ec30b03bc2b2622392d32e50fc73ffa4d51ae4130288495afef125)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRangeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__766767525e69449574a51c0d82ea9f4c8f0ce60e513cc1ae63eff66480208287)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e0a585e194cf37c6da5b8d4761aec5abc65da8e32e7ee68ba3f3c7aebcf468a9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1408421fdbc6c42078a52e606749c3d702990dc157ccfac9aef6db0800ffa97a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1552b801e74c784f826aad7a5de35dbd4da07c809ec8054fcd6ac1018ffa565b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4d22d2e5465fe8a689f98f0898ffce4018c3339391eb24658d19412a4be2d869)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="unitInput")
    def unit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "unitInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="unit")
    def unit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "unit"))

    @unit.setter
    def unit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f2f2c3a0e9d2c94b8838f3422be3870eb0acdf0714554244978c1e5279d83880)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "unit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @value.setter
    def value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b41b3d383b8ab21d359822c49dedaf40ac56fb5714f561b7fe4a550788b061a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a797665abd62bb54607d8d1378305381f26ca0f9b21c9428bb9fc4712ca6734a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaNoteUpdatedAtList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaNoteUpdatedAtList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__61c700ae5e98e554ab91af38395aadb0d8bb4db3ae72c932a681249d41da9034)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaNoteUpdatedAtOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b5e9d14a3de0b16b41ffacb4a05d27c20015b3faa9350244c6de6a0d74bee99e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaNoteUpdatedAtOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b02f508fba3f793402c9f32fd621beeee15be96eab8e436efefe9f66a11b5320)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8fb2dde096565cd5201377ed5335452b400e652c4cd82d488c9adf0be158063d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4a6250fb7fefc3578776d6826a3f706ad007a5555d73a384edfbca2e26ef6db8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedAt]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedAt]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__661581d055c7b3eb320c68857e5934ab3cce0b653e5523fc9bbf35333cfe0553)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaNoteUpdatedAtOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaNoteUpdatedAtOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__781189d3dbfec16a375971948a74e26ea869831a23b0c16321b645000432c6bd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putDateRange")
    def put_date_range(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e6d2b4dab5220211d023d64c0856fedb39e8b85ab420bbfd072691011458539)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDateRange", [value]))

    @jsii.member(jsii_name="resetDateRange")
    def reset_date_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDateRange", []))

    @jsii.member(jsii_name="resetEnd")
    def reset_end(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnd", []))

    @jsii.member(jsii_name="resetStart")
    def reset_start(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStart", []))

    @builtins.property
    @jsii.member(jsii_name="dateRange")
    def date_range(self) -> SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRangeList:
        return typing.cast(SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRangeList, jsii.get(self, "dateRange"))

    @builtins.property
    @jsii.member(jsii_name="dateRangeInput")
    def date_range_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange]]], jsii.get(self, "dateRangeInput"))

    @builtins.property
    @jsii.member(jsii_name="endInput")
    def end_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endInput"))

    @builtins.property
    @jsii.member(jsii_name="startInput")
    def start_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startInput"))

    @builtins.property
    @jsii.member(jsii_name="end")
    def end(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "end"))

    @end.setter
    def end(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9cd37756065634f23b046b43d57a2ba60e6e91bd3ad1817d4b2cf4a19ea4431f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "end", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="start")
    def start(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "start"))

    @start.setter
    def start(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4277d5e3cb240470801b0ab060860b56a40f8ffe47b670d228918ebff591622)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "start", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteUpdatedAt]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteUpdatedAt]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteUpdatedAt]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f7bfe21102d557969880cb66e41bc7b479c5f453241ebed3bd275a0bcfbfa587)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaNoteUpdatedBy",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaNoteUpdatedBy:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2af252a2958cc15fdb4781524c3daf18c72f0b0269031170a9b3166fe15ee964)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaNoteUpdatedBy(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaNoteUpdatedByList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaNoteUpdatedByList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2bb3d8e3e140c6ea3d9d668b48930b37d82fc57492960ee45ee5fe04488816aa)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaNoteUpdatedByOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7fb94cc1784a46b383db8cc6a97ecb7e5c0d152ae3d6699330de2200f6c99624)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaNoteUpdatedByOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d904922b3b079a5fceccbb444200faa6169ad577f8a1ab3eeab9675d20ae9f15)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5c396907a996f913fba148703b0fc435f73570999b1d743af53923eb639c25f8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2414d08a0279fed2b46c697500f97f81e825854af81ecf1873fc5696a40992ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedBy]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedBy]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedBy]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4eb0e5133ba553b38da6ac6a3d4ad028a0f675eb8f8b9a5e8e9d25959921d4d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaNoteUpdatedByOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaNoteUpdatedByOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f6b006bcc617b39514e6f247382611270063dddc311445f4f1b0384095d843d7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__10cb8b76c81ac369a668c41479eb3a8bd5e4ccd2cff95becc2379f4bac151dc7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1797dbe3985431728c3e0fa0031f60172139385940a5cd783e3f7026def50166)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteUpdatedBy]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteUpdatedBy]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteUpdatedBy]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9bad6b003c828a381916a9ecf7beaab0f0da7705dc865466c7857c56beb2b908)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2345885fd2c620e386dd0cff11c7254907675178d18b89531b8f277a19f9b6fa)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putAwsAccountId")
    def put_aws_account_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaAwsAccountId, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd973ee5ea34f441e6a49ad0571fa33da61cf09f06a22dda1d03257483c8524e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putAwsAccountId", [value]))

    @jsii.member(jsii_name="putAwsAccountName")
    def put_aws_account_name(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaAwsAccountName, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f316308b67e8927882ba1b2b4917faab52afc2a53d9ef2fb08d853dfeb149d39)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putAwsAccountName", [value]))

    @jsii.member(jsii_name="putCompanyName")
    def put_company_name(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaCompanyName, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c0fb497e7672fcbd83b124483e2dcc9c6b73564f01b4612e4d4359247a41cf5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCompanyName", [value]))

    @jsii.member(jsii_name="putComplianceAssociatedStandardsId")
    def put_compliance_associated_standards_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dec26dcdda068aed575a3a4dc4e00b3ad5404108b3ff29c746725d51fcf45ed0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putComplianceAssociatedStandardsId", [value]))

    @jsii.member(jsii_name="putComplianceSecurityControlId")
    def put_compliance_security_control_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaComplianceSecurityControlId, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6599f5a61798474398351ac20f52aa3fa796f36ee06533f192a6b70d24be389f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putComplianceSecurityControlId", [value]))

    @jsii.member(jsii_name="putComplianceStatus")
    def put_compliance_status(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaComplianceStatus, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a00e033d558c9b703f17fc6d0dfe950c31bb1211893ecaca09d64278c9ffff7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putComplianceStatus", [value]))

    @jsii.member(jsii_name="putConfidence")
    def put_confidence(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaConfidence, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21e4380a1a803f37f3b3645a4a857702ca960905145f87bcddd9e7a63cf9aefe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putConfidence", [value]))

    @jsii.member(jsii_name="putCreatedAt")
    def put_created_at(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaCreatedAt, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8bf2f966eacc45ad184c248982905b35e0797bd58f13e60b15d928dcf33ce9d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCreatedAt", [value]))

    @jsii.member(jsii_name="putCriticality")
    def put_criticality(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaCriticality, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__543da7597c14948a04b242028490cb7be5b61dd1b5fd0d6ce666553db0000087)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCriticality", [value]))

    @jsii.member(jsii_name="putDescription")
    def put_description(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaDescription, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e3a6d930d81f62fa93c08b09a24baf19768531dd45c56b4d795af3f893899ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDescription", [value]))

    @jsii.member(jsii_name="putFirstObservedAt")
    def put_first_observed_at(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaFirstObservedAt, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7300902e67b399caa4d3d8f2766f3d653d53197f1f13f2917d44e994294818be)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putFirstObservedAt", [value]))

    @jsii.member(jsii_name="putGeneratorId")
    def put_generator_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaGeneratorId, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a37afe0c736f128d309cd8307c8e5f02632888b37eb052c53c351ae71f7bc255)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putGeneratorId", [value]))

    @jsii.member(jsii_name="putId")
    def put_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaId, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1f8ee04eb80f9d08c31d6548c685c356554f96744ba69207138a01d00173e2d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putId", [value]))

    @jsii.member(jsii_name="putLastObservedAt")
    def put_last_observed_at(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaLastObservedAt, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ceeac2713e13cdb72b9f95d8d0c2629725501ef7eb17ec36fefb9cdd2a87fc39)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putLastObservedAt", [value]))

    @jsii.member(jsii_name="putNoteText")
    def put_note_text(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaNoteText, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b47eb7b3e6fd7f5d836cb5b81ea199f700189642c715effab30842430fe16644)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putNoteText", [value]))

    @jsii.member(jsii_name="putNoteUpdatedAt")
    def put_note_updated_at(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaNoteUpdatedAt, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__35a549721a872c42f2ca568c05d76733bb58400ac40a2f8988640c602ae4a149)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putNoteUpdatedAt", [value]))

    @jsii.member(jsii_name="putNoteUpdatedBy")
    def put_note_updated_by(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaNoteUpdatedBy, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84650c3ff88a4c0f54bdf22bde34cfaf038ad22eb0def39a36fbe0fb2846ca68)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putNoteUpdatedBy", [value]))

    @jsii.member(jsii_name="putProductArn")
    def put_product_arn(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaProductArn", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5927c0f4c085bd1830d1a010a313e7493e7f37e87a07ec8bcd5ad65643e7eaba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putProductArn", [value]))

    @jsii.member(jsii_name="putProductName")
    def put_product_name(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaProductName", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a715834bc9697df613d1387b78523c404a0d3c2ac06ee4152b9f2552c12c6097)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putProductName", [value]))

    @jsii.member(jsii_name="putRecordState")
    def put_record_state(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaRecordState", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cafae63953b22f467561d9553f463829d4d80c2501e60de63ea5e5f3ca40b554)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRecordState", [value]))

    @jsii.member(jsii_name="putRelatedFindingsId")
    def put_related_findings_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaRelatedFindingsId", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__552b5b124f6353bd45903f2eec82de59a98a1da798ec8d046563cfa7d27bc334)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRelatedFindingsId", [value]))

    @jsii.member(jsii_name="putRelatedFindingsProductArn")
    def put_related_findings_product_arn(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae48df8f9a2b11a33425c5172ea814b2b71510ba8307244101792867f4d453cc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRelatedFindingsProductArn", [value]))

    @jsii.member(jsii_name="putResourceApplicationArn")
    def put_resource_application_arn(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceApplicationArn", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b9600229d59aa05c3d5a2b3bfe77aef7cb0d1ae4071779a2f70351759a603014)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceApplicationArn", [value]))

    @jsii.member(jsii_name="putResourceApplicationName")
    def put_resource_application_name(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceApplicationName", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5673d8a1eac0cc86eecaf75e2e643e7900a3fc1cf2b77a76de57379193ab63e0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceApplicationName", [value]))

    @jsii.member(jsii_name="putResourceDetailsOther")
    def put_resource_details_other(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceDetailsOther", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b291397f0b69e36e49276d3f065e2d8ccc7319495a3b242437f91ab08f037d3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceDetailsOther", [value]))

    @jsii.member(jsii_name="putResourceId")
    def put_resource_id(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceId", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__687ec7708e6958d0bed06eecb1256393f57a778f7058dde7465e1601a440d7f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceId", [value]))

    @jsii.member(jsii_name="putResourcePartition")
    def put_resource_partition(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourcePartition", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e7e1e8137a4619d0cfe065c5f360320ff28c46ad6d274216bb4853ba5b0f76ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourcePartition", [value]))

    @jsii.member(jsii_name="putResourceRegion")
    def put_resource_region(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceRegion", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff00e4fc548a99d77ae208e639b893e232d3ec47a351cc8a758cf2f273684c07)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceRegion", [value]))

    @jsii.member(jsii_name="putResourceTags")
    def put_resource_tags(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceTags", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae173d64335b6893d54933676b9afbde44a06226d000b9ed8506de6291f7a22c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceTags", [value]))

    @jsii.member(jsii_name="putResourceType")
    def put_resource_type(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaResourceType", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa289d9c4ab1aa4d42e5c82704f37b04e604aa563354c33328b9bc7e9c977daa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putResourceType", [value]))

    @jsii.member(jsii_name="putSeverityLabel")
    def put_severity_label(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaSeverityLabel", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40365a09d79f42e5fe9033db59a2d07a1d6a224d503d30799d08b7deca515ef1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSeverityLabel", [value]))

    @jsii.member(jsii_name="putSourceUrl")
    def put_source_url(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaSourceUrl", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b44d3de8b1482a3d38d3977c84b6fcdd9c029584f8decc8ac0c2285147e03a1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putSourceUrl", [value]))

    @jsii.member(jsii_name="putTitle")
    def put_title(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaTitle", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__139222cbf4285ef66911202e996f57ef575bb41d6bff06e7545006f7e3ab554c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTitle", [value]))

    @jsii.member(jsii_name="putType")
    def put_type(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaType", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__782d396c9cb6eff1193f9e10d4c960aff53197330d344d7fc1a9be0567730881)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putType", [value]))

    @jsii.member(jsii_name="putUpdatedAt")
    def put_updated_at(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaUpdatedAt", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6b168e10402c64d8eae1382ebdaed6755a97f853725c15bbef50c7c5d245b8c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putUpdatedAt", [value]))

    @jsii.member(jsii_name="putUserDefinedFields")
    def put_user_defined_fields(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaUserDefinedFields", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab28e62254bb74cecddc5c85940ef0b0c5d5876ba566fbcf28dbb21697afbb78)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putUserDefinedFields", [value]))

    @jsii.member(jsii_name="putVerificationState")
    def put_verification_state(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaVerificationState", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37451ad70cf70464f8438bb78b57909111d04fd97d314a6c788a7017513d0931)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putVerificationState", [value]))

    @jsii.member(jsii_name="putWorkflowStatus")
    def put_workflow_status(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaWorkflowStatus", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__de81abf78927dd8ea1f1a8b6b9db2305530ac92861b188de99c362e457e5072d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putWorkflowStatus", [value]))

    @jsii.member(jsii_name="resetAwsAccountId")
    def reset_aws_account_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAwsAccountId", []))

    @jsii.member(jsii_name="resetAwsAccountName")
    def reset_aws_account_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAwsAccountName", []))

    @jsii.member(jsii_name="resetCompanyName")
    def reset_company_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCompanyName", []))

    @jsii.member(jsii_name="resetComplianceAssociatedStandardsId")
    def reset_compliance_associated_standards_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetComplianceAssociatedStandardsId", []))

    @jsii.member(jsii_name="resetComplianceSecurityControlId")
    def reset_compliance_security_control_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetComplianceSecurityControlId", []))

    @jsii.member(jsii_name="resetComplianceStatus")
    def reset_compliance_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetComplianceStatus", []))

    @jsii.member(jsii_name="resetConfidence")
    def reset_confidence(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConfidence", []))

    @jsii.member(jsii_name="resetCreatedAt")
    def reset_created_at(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCreatedAt", []))

    @jsii.member(jsii_name="resetCriticality")
    def reset_criticality(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCriticality", []))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetFirstObservedAt")
    def reset_first_observed_at(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFirstObservedAt", []))

    @jsii.member(jsii_name="resetGeneratorId")
    def reset_generator_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGeneratorId", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetLastObservedAt")
    def reset_last_observed_at(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLastObservedAt", []))

    @jsii.member(jsii_name="resetNoteText")
    def reset_note_text(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNoteText", []))

    @jsii.member(jsii_name="resetNoteUpdatedAt")
    def reset_note_updated_at(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNoteUpdatedAt", []))

    @jsii.member(jsii_name="resetNoteUpdatedBy")
    def reset_note_updated_by(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNoteUpdatedBy", []))

    @jsii.member(jsii_name="resetProductArn")
    def reset_product_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProductArn", []))

    @jsii.member(jsii_name="resetProductName")
    def reset_product_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProductName", []))

    @jsii.member(jsii_name="resetRecordState")
    def reset_record_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRecordState", []))

    @jsii.member(jsii_name="resetRelatedFindingsId")
    def reset_related_findings_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRelatedFindingsId", []))

    @jsii.member(jsii_name="resetRelatedFindingsProductArn")
    def reset_related_findings_product_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRelatedFindingsProductArn", []))

    @jsii.member(jsii_name="resetResourceApplicationArn")
    def reset_resource_application_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceApplicationArn", []))

    @jsii.member(jsii_name="resetResourceApplicationName")
    def reset_resource_application_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceApplicationName", []))

    @jsii.member(jsii_name="resetResourceDetailsOther")
    def reset_resource_details_other(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceDetailsOther", []))

    @jsii.member(jsii_name="resetResourceId")
    def reset_resource_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceId", []))

    @jsii.member(jsii_name="resetResourcePartition")
    def reset_resource_partition(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourcePartition", []))

    @jsii.member(jsii_name="resetResourceRegion")
    def reset_resource_region(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceRegion", []))

    @jsii.member(jsii_name="resetResourceTags")
    def reset_resource_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceTags", []))

    @jsii.member(jsii_name="resetResourceType")
    def reset_resource_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResourceType", []))

    @jsii.member(jsii_name="resetSeverityLabel")
    def reset_severity_label(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSeverityLabel", []))

    @jsii.member(jsii_name="resetSourceUrl")
    def reset_source_url(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSourceUrl", []))

    @jsii.member(jsii_name="resetTitle")
    def reset_title(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTitle", []))

    @jsii.member(jsii_name="resetType")
    def reset_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetType", []))

    @jsii.member(jsii_name="resetUpdatedAt")
    def reset_updated_at(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUpdatedAt", []))

    @jsii.member(jsii_name="resetUserDefinedFields")
    def reset_user_defined_fields(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUserDefinedFields", []))

    @jsii.member(jsii_name="resetVerificationState")
    def reset_verification_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVerificationState", []))

    @jsii.member(jsii_name="resetWorkflowStatus")
    def reset_workflow_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWorkflowStatus", []))

    @builtins.property
    @jsii.member(jsii_name="awsAccountId")
    def aws_account_id(self) -> SecurityhubAutomationRuleCriteriaAwsAccountIdList:
        return typing.cast(SecurityhubAutomationRuleCriteriaAwsAccountIdList, jsii.get(self, "awsAccountId"))

    @builtins.property
    @jsii.member(jsii_name="awsAccountName")
    def aws_account_name(self) -> SecurityhubAutomationRuleCriteriaAwsAccountNameList:
        return typing.cast(SecurityhubAutomationRuleCriteriaAwsAccountNameList, jsii.get(self, "awsAccountName"))

    @builtins.property
    @jsii.member(jsii_name="companyName")
    def company_name(self) -> SecurityhubAutomationRuleCriteriaCompanyNameList:
        return typing.cast(SecurityhubAutomationRuleCriteriaCompanyNameList, jsii.get(self, "companyName"))

    @builtins.property
    @jsii.member(jsii_name="complianceAssociatedStandardsId")
    def compliance_associated_standards_id(
        self,
    ) -> SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsIdList:
        return typing.cast(SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsIdList, jsii.get(self, "complianceAssociatedStandardsId"))

    @builtins.property
    @jsii.member(jsii_name="complianceSecurityControlId")
    def compliance_security_control_id(
        self,
    ) -> SecurityhubAutomationRuleCriteriaComplianceSecurityControlIdList:
        return typing.cast(SecurityhubAutomationRuleCriteriaComplianceSecurityControlIdList, jsii.get(self, "complianceSecurityControlId"))

    @builtins.property
    @jsii.member(jsii_name="complianceStatus")
    def compliance_status(
        self,
    ) -> SecurityhubAutomationRuleCriteriaComplianceStatusList:
        return typing.cast(SecurityhubAutomationRuleCriteriaComplianceStatusList, jsii.get(self, "complianceStatus"))

    @builtins.property
    @jsii.member(jsii_name="confidence")
    def confidence(self) -> SecurityhubAutomationRuleCriteriaConfidenceList:
        return typing.cast(SecurityhubAutomationRuleCriteriaConfidenceList, jsii.get(self, "confidence"))

    @builtins.property
    @jsii.member(jsii_name="createdAt")
    def created_at(self) -> SecurityhubAutomationRuleCriteriaCreatedAtList:
        return typing.cast(SecurityhubAutomationRuleCriteriaCreatedAtList, jsii.get(self, "createdAt"))

    @builtins.property
    @jsii.member(jsii_name="criticality")
    def criticality(self) -> SecurityhubAutomationRuleCriteriaCriticalityList:
        return typing.cast(SecurityhubAutomationRuleCriteriaCriticalityList, jsii.get(self, "criticality"))

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> SecurityhubAutomationRuleCriteriaDescriptionList:
        return typing.cast(SecurityhubAutomationRuleCriteriaDescriptionList, jsii.get(self, "description"))

    @builtins.property
    @jsii.member(jsii_name="firstObservedAt")
    def first_observed_at(self) -> SecurityhubAutomationRuleCriteriaFirstObservedAtList:
        return typing.cast(SecurityhubAutomationRuleCriteriaFirstObservedAtList, jsii.get(self, "firstObservedAt"))

    @builtins.property
    @jsii.member(jsii_name="generatorId")
    def generator_id(self) -> SecurityhubAutomationRuleCriteriaGeneratorIdList:
        return typing.cast(SecurityhubAutomationRuleCriteriaGeneratorIdList, jsii.get(self, "generatorId"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> SecurityhubAutomationRuleCriteriaIdList:
        return typing.cast(SecurityhubAutomationRuleCriteriaIdList, jsii.get(self, "id"))

    @builtins.property
    @jsii.member(jsii_name="lastObservedAt")
    def last_observed_at(self) -> SecurityhubAutomationRuleCriteriaLastObservedAtList:
        return typing.cast(SecurityhubAutomationRuleCriteriaLastObservedAtList, jsii.get(self, "lastObservedAt"))

    @builtins.property
    @jsii.member(jsii_name="noteText")
    def note_text(self) -> SecurityhubAutomationRuleCriteriaNoteTextList:
        return typing.cast(SecurityhubAutomationRuleCriteriaNoteTextList, jsii.get(self, "noteText"))

    @builtins.property
    @jsii.member(jsii_name="noteUpdatedAt")
    def note_updated_at(self) -> SecurityhubAutomationRuleCriteriaNoteUpdatedAtList:
        return typing.cast(SecurityhubAutomationRuleCriteriaNoteUpdatedAtList, jsii.get(self, "noteUpdatedAt"))

    @builtins.property
    @jsii.member(jsii_name="noteUpdatedBy")
    def note_updated_by(self) -> SecurityhubAutomationRuleCriteriaNoteUpdatedByList:
        return typing.cast(SecurityhubAutomationRuleCriteriaNoteUpdatedByList, jsii.get(self, "noteUpdatedBy"))

    @builtins.property
    @jsii.member(jsii_name="productArn")
    def product_arn(self) -> "SecurityhubAutomationRuleCriteriaProductArnList":
        return typing.cast("SecurityhubAutomationRuleCriteriaProductArnList", jsii.get(self, "productArn"))

    @builtins.property
    @jsii.member(jsii_name="productName")
    def product_name(self) -> "SecurityhubAutomationRuleCriteriaProductNameList":
        return typing.cast("SecurityhubAutomationRuleCriteriaProductNameList", jsii.get(self, "productName"))

    @builtins.property
    @jsii.member(jsii_name="recordState")
    def record_state(self) -> "SecurityhubAutomationRuleCriteriaRecordStateList":
        return typing.cast("SecurityhubAutomationRuleCriteriaRecordStateList", jsii.get(self, "recordState"))

    @builtins.property
    @jsii.member(jsii_name="relatedFindingsId")
    def related_findings_id(
        self,
    ) -> "SecurityhubAutomationRuleCriteriaRelatedFindingsIdList":
        return typing.cast("SecurityhubAutomationRuleCriteriaRelatedFindingsIdList", jsii.get(self, "relatedFindingsId"))

    @builtins.property
    @jsii.member(jsii_name="relatedFindingsProductArn")
    def related_findings_product_arn(
        self,
    ) -> "SecurityhubAutomationRuleCriteriaRelatedFindingsProductArnList":
        return typing.cast("SecurityhubAutomationRuleCriteriaRelatedFindingsProductArnList", jsii.get(self, "relatedFindingsProductArn"))

    @builtins.property
    @jsii.member(jsii_name="resourceApplicationArn")
    def resource_application_arn(
        self,
    ) -> "SecurityhubAutomationRuleCriteriaResourceApplicationArnList":
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceApplicationArnList", jsii.get(self, "resourceApplicationArn"))

    @builtins.property
    @jsii.member(jsii_name="resourceApplicationName")
    def resource_application_name(
        self,
    ) -> "SecurityhubAutomationRuleCriteriaResourceApplicationNameList":
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceApplicationNameList", jsii.get(self, "resourceApplicationName"))

    @builtins.property
    @jsii.member(jsii_name="resourceDetailsOther")
    def resource_details_other(
        self,
    ) -> "SecurityhubAutomationRuleCriteriaResourceDetailsOtherList":
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceDetailsOtherList", jsii.get(self, "resourceDetailsOther"))

    @builtins.property
    @jsii.member(jsii_name="resourceId")
    def resource_id(self) -> "SecurityhubAutomationRuleCriteriaResourceIdList":
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceIdList", jsii.get(self, "resourceId"))

    @builtins.property
    @jsii.member(jsii_name="resourcePartition")
    def resource_partition(
        self,
    ) -> "SecurityhubAutomationRuleCriteriaResourcePartitionList":
        return typing.cast("SecurityhubAutomationRuleCriteriaResourcePartitionList", jsii.get(self, "resourcePartition"))

    @builtins.property
    @jsii.member(jsii_name="resourceRegion")
    def resource_region(self) -> "SecurityhubAutomationRuleCriteriaResourceRegionList":
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceRegionList", jsii.get(self, "resourceRegion"))

    @builtins.property
    @jsii.member(jsii_name="resourceTags")
    def resource_tags(self) -> "SecurityhubAutomationRuleCriteriaResourceTagsList":
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceTagsList", jsii.get(self, "resourceTags"))

    @builtins.property
    @jsii.member(jsii_name="resourceType")
    def resource_type(self) -> "SecurityhubAutomationRuleCriteriaResourceTypeList":
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceTypeList", jsii.get(self, "resourceType"))

    @builtins.property
    @jsii.member(jsii_name="severityLabel")
    def severity_label(self) -> "SecurityhubAutomationRuleCriteriaSeverityLabelList":
        return typing.cast("SecurityhubAutomationRuleCriteriaSeverityLabelList", jsii.get(self, "severityLabel"))

    @builtins.property
    @jsii.member(jsii_name="sourceUrl")
    def source_url(self) -> "SecurityhubAutomationRuleCriteriaSourceUrlList":
        return typing.cast("SecurityhubAutomationRuleCriteriaSourceUrlList", jsii.get(self, "sourceUrl"))

    @builtins.property
    @jsii.member(jsii_name="title")
    def title(self) -> "SecurityhubAutomationRuleCriteriaTitleList":
        return typing.cast("SecurityhubAutomationRuleCriteriaTitleList", jsii.get(self, "title"))

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> "SecurityhubAutomationRuleCriteriaTypeList":
        return typing.cast("SecurityhubAutomationRuleCriteriaTypeList", jsii.get(self, "type"))

    @builtins.property
    @jsii.member(jsii_name="updatedAt")
    def updated_at(self) -> "SecurityhubAutomationRuleCriteriaUpdatedAtList":
        return typing.cast("SecurityhubAutomationRuleCriteriaUpdatedAtList", jsii.get(self, "updatedAt"))

    @builtins.property
    @jsii.member(jsii_name="userDefinedFields")
    def user_defined_fields(
        self,
    ) -> "SecurityhubAutomationRuleCriteriaUserDefinedFieldsList":
        return typing.cast("SecurityhubAutomationRuleCriteriaUserDefinedFieldsList", jsii.get(self, "userDefinedFields"))

    @builtins.property
    @jsii.member(jsii_name="verificationState")
    def verification_state(
        self,
    ) -> "SecurityhubAutomationRuleCriteriaVerificationStateList":
        return typing.cast("SecurityhubAutomationRuleCriteriaVerificationStateList", jsii.get(self, "verificationState"))

    @builtins.property
    @jsii.member(jsii_name="workflowStatus")
    def workflow_status(self) -> "SecurityhubAutomationRuleCriteriaWorkflowStatusList":
        return typing.cast("SecurityhubAutomationRuleCriteriaWorkflowStatusList", jsii.get(self, "workflowStatus"))

    @builtins.property
    @jsii.member(jsii_name="awsAccountIdInput")
    def aws_account_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaAwsAccountId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaAwsAccountId]]], jsii.get(self, "awsAccountIdInput"))

    @builtins.property
    @jsii.member(jsii_name="awsAccountNameInput")
    def aws_account_name_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaAwsAccountName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaAwsAccountName]]], jsii.get(self, "awsAccountNameInput"))

    @builtins.property
    @jsii.member(jsii_name="companyNameInput")
    def company_name_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCompanyName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCompanyName]]], jsii.get(self, "companyNameInput"))

    @builtins.property
    @jsii.member(jsii_name="complianceAssociatedStandardsIdInput")
    def compliance_associated_standards_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId]]], jsii.get(self, "complianceAssociatedStandardsIdInput"))

    @builtins.property
    @jsii.member(jsii_name="complianceSecurityControlIdInput")
    def compliance_security_control_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceSecurityControlId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceSecurityControlId]]], jsii.get(self, "complianceSecurityControlIdInput"))

    @builtins.property
    @jsii.member(jsii_name="complianceStatusInput")
    def compliance_status_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceStatus]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceStatus]]], jsii.get(self, "complianceStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="confidenceInput")
    def confidence_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaConfidence]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaConfidence]]], jsii.get(self, "confidenceInput"))

    @builtins.property
    @jsii.member(jsii_name="createdAtInput")
    def created_at_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCreatedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCreatedAt]]], jsii.get(self, "createdAtInput"))

    @builtins.property
    @jsii.member(jsii_name="criticalityInput")
    def criticality_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCriticality]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCriticality]]], jsii.get(self, "criticalityInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaDescription]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaDescription]]], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="firstObservedAtInput")
    def first_observed_at_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaFirstObservedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaFirstObservedAt]]], jsii.get(self, "firstObservedAtInput"))

    @builtins.property
    @jsii.member(jsii_name="generatorIdInput")
    def generator_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaGeneratorId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaGeneratorId]]], jsii.get(self, "generatorIdInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaId]]], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="lastObservedAtInput")
    def last_observed_at_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaLastObservedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaLastObservedAt]]], jsii.get(self, "lastObservedAtInput"))

    @builtins.property
    @jsii.member(jsii_name="noteTextInput")
    def note_text_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteText]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteText]]], jsii.get(self, "noteTextInput"))

    @builtins.property
    @jsii.member(jsii_name="noteUpdatedAtInput")
    def note_updated_at_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedAt]]], jsii.get(self, "noteUpdatedAtInput"))

    @builtins.property
    @jsii.member(jsii_name="noteUpdatedByInput")
    def note_updated_by_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedBy]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedBy]]], jsii.get(self, "noteUpdatedByInput"))

    @builtins.property
    @jsii.member(jsii_name="productArnInput")
    def product_arn_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaProductArn"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaProductArn"]]], jsii.get(self, "productArnInput"))

    @builtins.property
    @jsii.member(jsii_name="productNameInput")
    def product_name_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaProductName"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaProductName"]]], jsii.get(self, "productNameInput"))

    @builtins.property
    @jsii.member(jsii_name="recordStateInput")
    def record_state_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaRecordState"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaRecordState"]]], jsii.get(self, "recordStateInput"))

    @builtins.property
    @jsii.member(jsii_name="relatedFindingsIdInput")
    def related_findings_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaRelatedFindingsId"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaRelatedFindingsId"]]], jsii.get(self, "relatedFindingsIdInput"))

    @builtins.property
    @jsii.member(jsii_name="relatedFindingsProductArnInput")
    def related_findings_product_arn_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn"]]], jsii.get(self, "relatedFindingsProductArnInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceApplicationArnInput")
    def resource_application_arn_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceApplicationArn"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceApplicationArn"]]], jsii.get(self, "resourceApplicationArnInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceApplicationNameInput")
    def resource_application_name_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceApplicationName"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceApplicationName"]]], jsii.get(self, "resourceApplicationNameInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceDetailsOtherInput")
    def resource_details_other_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceDetailsOther"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceDetailsOther"]]], jsii.get(self, "resourceDetailsOtherInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceIdInput")
    def resource_id_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceId"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceId"]]], jsii.get(self, "resourceIdInput"))

    @builtins.property
    @jsii.member(jsii_name="resourcePartitionInput")
    def resource_partition_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourcePartition"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourcePartition"]]], jsii.get(self, "resourcePartitionInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceRegionInput")
    def resource_region_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceRegion"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceRegion"]]], jsii.get(self, "resourceRegionInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTagsInput")
    def resource_tags_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceTags"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceTags"]]], jsii.get(self, "resourceTagsInput"))

    @builtins.property
    @jsii.member(jsii_name="resourceTypeInput")
    def resource_type_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceType"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaResourceType"]]], jsii.get(self, "resourceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="severityLabelInput")
    def severity_label_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaSeverityLabel"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaSeverityLabel"]]], jsii.get(self, "severityLabelInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceUrlInput")
    def source_url_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaSourceUrl"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaSourceUrl"]]], jsii.get(self, "sourceUrlInput"))

    @builtins.property
    @jsii.member(jsii_name="titleInput")
    def title_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaTitle"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaTitle"]]], jsii.get(self, "titleInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaType"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaType"]]], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="updatedAtInput")
    def updated_at_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaUpdatedAt"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaUpdatedAt"]]], jsii.get(self, "updatedAtInput"))

    @builtins.property
    @jsii.member(jsii_name="userDefinedFieldsInput")
    def user_defined_fields_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaUserDefinedFields"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaUserDefinedFields"]]], jsii.get(self, "userDefinedFieldsInput"))

    @builtins.property
    @jsii.member(jsii_name="verificationStateInput")
    def verification_state_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaVerificationState"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaVerificationState"]]], jsii.get(self, "verificationStateInput"))

    @builtins.property
    @jsii.member(jsii_name="workflowStatusInput")
    def workflow_status_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaWorkflowStatus"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaWorkflowStatus"]]], jsii.get(self, "workflowStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteria]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteria]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteria]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3cc9b62c0bfacd2f3729bb67db6be083782b9fba5026ae12d01af28bf9f54c17)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaProductArn",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaProductArn:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6e170eddbd3496959319dbbe8f114ed8c9b4e6c2508060d47b9bb7cf4d5809a5)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaProductArn(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaProductArnList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaProductArnList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e12b7a5e1b37beaa4aa499b3c5262c3ac45b53be6aedf02372b403ba1c45b4af)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaProductArnOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__09c5283e8bf9a79bbbdb8c2f8f2865371126b1be9a0e6fbb51432e796320479a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaProductArnOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__777ee6212a608602cd6c80e9f27dff219860fd485d6512d4fa00fc6aa76e5063)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1d8de0fc940cd063463cf55ccedf3c25fc31c735ecc3f3d8cf8ce728dca89f91)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5df178f0a6d3301fa5e1b9bbee2cb48b4d75eafef48e09464923cb4d27bd80b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaProductArn]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaProductArn]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaProductArn]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4582af8f84f6497b6fabf28a4e720c68a088ebd8dc28f873483ccf428a5d0278)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaProductArnOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaProductArnOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7e31384feacbff6882c7cad9c7ecb0f75efc41b2791eb476c9b2c413fbe237f7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c8825bb5e7947c4003b296fe85e111519840a1002b0cf417ccb1dea1175c7340)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8e4a881435f07d91305a9e8e81add05e2167d1b5b87aa0b32e0d4af8b1e1836)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaProductArn]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaProductArn]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaProductArn]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b9ed8f5b53d60e091a89cac981df1ee7edd646e971b2792e0421e03ac35f776)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaProductName",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaProductName:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__589a9fc0f7984a8b566744c0397057b94e2d5decf7a45ad34ce1ebd479f76a77)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaProductName(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaProductNameList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaProductNameList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0c174f09739d6cef62c0741a52b310121625c11b59534a89778728f36fb77937)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaProductNameOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5b22c0df47dc1d9b9b19b9978e8e4294de4db2c3b9c71848b50f354667bfcde)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaProductNameOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__600bf910b0391523dbca6ca668dc61b49e0492e4d26ebaaf6ffde89e4f1a058e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e6f887b222af9b043436dde620e4c11e0777a7414491621374de90155f0cee25)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f844e0676e67b73ccfca62e4ce75b272c6d6a7694894bb5ace36f7d3c20296d4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaProductName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaProductName]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaProductName]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__834cd35d7c76fccc898b78bca83e00a3f21b866a4f9e4497c3c17807739e357a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaProductNameOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaProductNameOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0ac2d7106a0cf46ec9bcdbc9f86e1e049cf270fb284d4352938f2d0545cf92de)
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
            type_hints = typing.get_type_hints(_typecheckingstub__05151f52304d28416a5a225b10147cec2798bd995ae0935690b8900e3eb1e7f6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2436d0b3c326b7f29d397f48f3e53f6bb4c41f5fd46d376fee5c7edaa4b7ba4a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaProductName]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaProductName]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaProductName]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__af552fde4ec08f0355d312ac0310b5d75dcc074b36ab2655342e6133c5c0bab2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaRecordState",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaRecordState:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f68cbf2cff2ed6de2bf807912ff1c07c84ac2196e2eaf4d1b9c260511da051d)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaRecordState(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaRecordStateList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaRecordStateList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a2733982aaa05263082574ee1c8c3ae87bb38d0a1d0649b89289b806e64ec591)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaRecordStateOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f28f52a70f7dddd506d0a49949a69b04d8ce8b3bcc0ecea3c9a5390bfcaab2e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaRecordStateOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba488fc1b03acfcabcb0643d7a586b0881804f4ab4c904f1822fa53c58d90671)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5ceb443f57008dbc0197d0c949eff1bd6c0f884a399193089db92dc325f36c7f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e521118918dd2fa8079e8c80548575f3915aa16b6418c1fff36364d4d340eb79)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaRecordState]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaRecordState]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaRecordState]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ebf23d75c90ab40c5ae5d56bfd6a278de0b15c352311dd160545dffcffb1775)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaRecordStateOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaRecordStateOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__81b6e73c9a1f2ed90a1b0242f070e893851bbccf38a51673cf5afac0035ecb5d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9c9e8c7c923ff1f31f503fcd98b212445cd7952b62cf2949907418a597f25b65)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4404b30fd2c435fd5424f0c10ee38c790d371a839edc385fa30fe9053224979)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaRecordState]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaRecordState]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaRecordState]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__10c6ce9687e996386b6d9177aa80bdac355f2a119c47e7271272e342ccdc71c7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaRelatedFindingsId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaRelatedFindingsId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__58855d2c3e67e4cb034c8a4bbc29d6aaf1e10257d122ced653d1f4211e421f55)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaRelatedFindingsId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaRelatedFindingsIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaRelatedFindingsIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c7da8d94bf1c1b12bf86630ab2a1776676591195c93301171c301b00af307ec6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaRelatedFindingsIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0fb7e383cbc2815a08e38a35611d5f4b26c8edf285894c8b0a3192478b45cba)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaRelatedFindingsIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__69ec28a28e8bf8505f65273b565604246fcbcb5afc1b32f937ea060ead2bf6da)
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
            type_hints = typing.get_type_hints(_typecheckingstub__90e1f1a0383e03c8bbfebae3e0606f9b5ef113b486021ed39cd8356de18fb855)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7b48143f598b17584283158818350ed0248b0af37b9aa721545b82e2fef1d777)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaRelatedFindingsId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaRelatedFindingsId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaRelatedFindingsId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ebe2fa1248136c7714db8f566ebabed7cf9fe8db0c0ec5c38355761d8e7f10e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaRelatedFindingsIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaRelatedFindingsIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b7d6a2c99762e58d6398e3743fdbdaf57319b2c901396fbfa0efeaa4cb069957)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cf1766e8f98b885c14daa1bc1b641fbd788dea8e93a516a8f26f5c4b58d51598)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6415a0f1492b7781803c1db70ab113d2a040863bcbf5592bb6894df3d386c368)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaRelatedFindingsId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaRelatedFindingsId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaRelatedFindingsId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__847ce1e3c547033b31c3c1cd41194a039cc4fe8adceba594d2a6267d500152c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62f868de08955f44d390a7313d57f81abc145f026b4fbd31601121321bc78455)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaRelatedFindingsProductArnList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaRelatedFindingsProductArnList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__76b940ebb2962bf6b7f6c5321e326462ce3746b792fb78a85ba501a4ceaf72d1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaRelatedFindingsProductArnOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae08da2ca4048da1af3b289ef2809676446393bbd5cbcf1a40c37a66801f50b1)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaRelatedFindingsProductArnOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e52e2df43b3ccd5a559fff4f7297f109e5d209f1c81e30058c54eca60603fe6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__445485cca28f96832e65d5725cca7175c339127af41f1e0017da5257debc15f9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5737f5e065b175b0888bf4e3bd687dff7b9772ac700ba59f162cc2e312d93e00)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c1615b40ed9c0ef3caeb6e3841545cb32b9df0156bc47971e38d5a3914b5151)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaRelatedFindingsProductArnOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaRelatedFindingsProductArnOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dc6fed7fdfa657530379ab7b9642ba30a4ed41adf94c73e43ee05796817f717a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4867f41b7fa1cad2cf39f3ce40d93167c248fb713aa1ac162fc74b3e75a69f1a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c7f79906d388f62d40b5abe940bec82da260869ed715fad91cf0376377830242)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56d7c2d22c031e0f304900bbb36024760ce33e974db0ad58e50339a945038500)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceApplicationArn",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaResourceApplicationArn:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7332bf0ad50385f5b20e5ff3a8c7d47e48fe8a2e22f3b8df44ac3bbf04724acd)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaResourceApplicationArn(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaResourceApplicationArnList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceApplicationArnList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__258daf697a35b1a56436f0d31da360845ccc8eb0d7621a1da07ccf59f25abb17)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaResourceApplicationArnOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e237de5add583b6315f7d3111d88232a40bf013d0110960ffdc5f5743d0e3ee9)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceApplicationArnOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__36b1b32029d4728e8b5f27b769003675c61db2bdf0b878bdc5ec1002ecd0d151)
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
            type_hints = typing.get_type_hints(_typecheckingstub__266ebce64e7b4cdd47ff2ebfca653938c6f0342eca1555029e251343a4bb1595)
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
            type_hints = typing.get_type_hints(_typecheckingstub__efe67d3abbb4ab83b11700bd156e6e6ca1cc001dadd2f1cd8e34e463cc93e0ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceApplicationArn]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceApplicationArn]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceApplicationArn]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a7739118050a473e2766678afea1fb08e29186008773028493f10f58d9bebdfa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaResourceApplicationArnOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceApplicationArnOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__69091b258ed4f3de068ff28550a147ff72f1bb40d142f470084291aeabc8222f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f1a8927cec0286ad7b40d2def0299f53dbc6e1d9f8014aab8ca5891aaf70c290)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__36b0c0857ece99032fe23e49f2927f8ede3b5b2fa5f609c2fd3bdd7f47a69291)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceApplicationArn]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceApplicationArn]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceApplicationArn]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4278c21929e261a01947d516c69a430242693bdb38536ceb1c85f27d2e7c3011)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceApplicationName",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaResourceApplicationName:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18b3919bc9f4dce24c95c1392f691c2d5f4fca215bcd182e4a64b2ba7b7aca32)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaResourceApplicationName(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaResourceApplicationNameList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceApplicationNameList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f35a6cd21609d1e8c2a600b9a229a4558f8f45a533fc6bc9aca7962f24357c93)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaResourceApplicationNameOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f48377f02870b4b03ab7cf87dd5baa2b51c1ffa9349d6e9a0026701639dfdd9f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceApplicationNameOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3580ea4b747afad19ce29cfa565c7f749cbd787f0611ad906e83bb49ae32e45b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__494bc7e8b49caa9bbece36a0bdaeae4e5337fb721dd520870246e413fb005e93)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9e77192942531422af78db4ac4ac92c429aef50fa1f40f963e908393d44cddd7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceApplicationName]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceApplicationName]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceApplicationName]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__958c52e950255e5c75c9f80306123bafa7af73f5be785171bda98e9293833e46)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaResourceApplicationNameOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceApplicationNameOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__377c62941e123cabc1110c52f2faec5bb1375e5ff7d599ddf1f12b66f4892ea4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e8e567ab03839f93d2737fd8a58f838192ed38601a89c67d2b74ec7971e4186e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4a47adf7d23b3cb14f469d9564a1ee30189c7dfb4bc616a3f52ab17542bec6b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceApplicationName]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceApplicationName]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceApplicationName]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ad6a034df2886bf0999a0df3e3b8f0ee19a87c2efcf21d1c2f8f7529bcf21585)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceDetailsOther",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "key": "key", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaResourceDetailsOther:
    def __init__(
        self,
        *,
        comparison: builtins.str,
        key: builtins.str,
        value: builtins.str,
    ) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#key SecurityhubAutomationRule#key}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a53490bd8c0c93f13a9eb8d799e8bf3b2b7c07c9532a815a00de3ffdda4bd01c)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#key SecurityhubAutomationRule#key}.'''
        result = self._values.get("key")
        assert result is not None, "Required property 'key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaResourceDetailsOther(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaResourceDetailsOtherList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceDetailsOtherList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cd4f6e72b8edbf683003f35d7e1ea943e9c2122f2fd91b7cc4fc822a3f610318)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaResourceDetailsOtherOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5cc2a54a22111fb2b59c81b9dd5b03c4068e64c5566c6ebd06f577222719129c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceDetailsOtherOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a7c654d0f46c0aac5d09c781f9cb360abb94b6d05bf7ca184d398723aef15a74)
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
            type_hints = typing.get_type_hints(_typecheckingstub__40bf53c4aa437746b28e3d9cfc93187718008f71357b2a0b0bf4ab22161717d9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4f384e6646e8625458f2478a9d06448218e0b1cc100ed181c178d37c8bfc0d3d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceDetailsOther]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceDetailsOther]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceDetailsOther]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9332884784ec7085756ec1df1bdf3f7cb641d156c049971960d111c72f63b774)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaResourceDetailsOtherOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceDetailsOtherOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__592bd1e200fd36cb3df6074f627987450171c11beb3a693a79cd99b829ab3e20)
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
            type_hints = typing.get_type_hints(_typecheckingstub__281679ed32301de7f13796c7fe1c452b1498363ef15ed86049cfed98ada8f24c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="key")
    def key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "key"))

    @key.setter
    def key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__25ecc4a5a4427f26ddf9ed53eea0aa721f47c5e5136a9181c741370fbdf99abd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "key", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__609ed1c6af9d3e00faa293d18ef8f13ed88f8ff422c46e6b22a7f657a32aacaf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceDetailsOther]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceDetailsOther]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceDetailsOther]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__76b3fbdcbcdb4ca0bff926541980e50ca3972d479360798b438192e53ad3fd7a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceId",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaResourceId:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__39168008003e4026203d2d2340ff5ba247361e38fca186a6a261b7db7f69ca66)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaResourceId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaResourceIdList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceIdList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6c532758ba6b67ef4979e7e65ad39c536b4cfe624ee62a68f7473c76fffa593f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaResourceIdOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fe1407417772199238a7808078e4db30c069922edcd6b73a16e80e6afd43987c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceIdOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a56b3ee25c36a57f80e92952b00019bf4fe42cca120b2bd20e630565b6612db)
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
            type_hints = typing.get_type_hints(_typecheckingstub__32f082ac1281c940d58d037cb64a84a255686d7108e4bcb9f6ed441b7a6c51c1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6cd07b1c18a9457cfd28c11f33b470bb2ecace918b59ec188006294631b81243)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceId]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceId]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceId]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2389c219d0ca16655e3dc8f9997536647558c4d332eb52fd07edb6a267172650)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaResourceIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7e3a205cdb2df53eae3c1be9791e2228f61331f980c2376bfb5a2f27ebdf9835)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f4049e960f82fd0ab642b0a0f2ac55a9101a2d0b39d4f03a14b35a367a4356c9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__26328cbfe7123fe380b5a89e70730472ac275a1dd2fa905f8a3e03ab97b7df23)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceId]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceId]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceId]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__226e0b874b49115180d2ccb385c2374745194567bf879b6f4f4a113b6858ee2e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourcePartition",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaResourcePartition:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__36f8b3909293cedbda5f570f25e41a2aa5cc7898afda599f9f016eba8334ba9c)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaResourcePartition(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaResourcePartitionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourcePartitionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__105b8d1f383924bacf3d1873ae8251bfe61fadc9f2ba11ca36e3c244cc34eb70)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaResourcePartitionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b3f0aadfa5e9e42e5728d329e944c37dc021fc6d86174c86f141f5c98dcf1da)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaResourcePartitionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__13c2a88508034e42f345eadf848998a11ab0685b92b1afa5f931047aa38826d8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c76cd1592e042812199845e40fb620717f0c403e4ce2b6b911703fb12a2c478c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__90d3d97b0e7481195d38aa4de52695b9d2aaa7b34e06278ef80c7dce301535c6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourcePartition]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourcePartition]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourcePartition]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e4fb6420bae7b2af4aa6cfa8e57c016cb5b751be2acfd9366f9980cb387ac626)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaResourcePartitionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourcePartitionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b03e88ab4c784fac61a1ab26090d2c0c21ee52aafa8d7636f6f33222832ae199)
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
            type_hints = typing.get_type_hints(_typecheckingstub__01294db530f026ae26b61c1d1cc31494a5b5a0b135f0fdd8229599f83fcec032)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__062f22f2d4754197ee09b76da71096303a61f6f6b945f0942a7d0ef0e4aee274)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourcePartition]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourcePartition]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourcePartition]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__73fc9c486659a0b289134db6e282be0cdc4227883797901c7d00e1fef14ed9f7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceRegion",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaResourceRegion:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78285c031ffb5409787d356f48fc2c875d7ea3afadb1ae595e921db7c4abb2db)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaResourceRegion(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaResourceRegionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceRegionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7069edcc77d48937e772de757f173b990c825211b2806a5faf82c2553b2acd66)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaResourceRegionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40a77a228c9c1a32720540976459cc0d88e7a50bc81588eb529e05c272a4891c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceRegionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__76c2b63fe73bba867f8fd454df41340288b1eb51df902452466f5b504deefa8b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bbfb749b71da064cd6824e33054ba698a3728490fc6979ca6c826897f346a2bb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__db849c711a236a31a780ae042452f8ea92e81b06ca05705f9a21a6196a64464e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceRegion]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceRegion]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceRegion]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9cda28eaa6bed630710d93ee17b1b250b4cfe2aa1349df8cc8592cad4b885cc3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaResourceRegionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceRegionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2026ac207081b981c3d1ba2bf3187ab9a9027b924c45301f40dc1f6e9399036f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__fc061282d2eb845c033c1a071c6e0f1ad70c2a0e2169ccccd2f6e4cc88d62df3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e74c3f3df4cba8c765b0b9a1687e6decd5a2e41d7d561736fc1db8fed8d0139)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceRegion]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceRegion]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceRegion]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__de2e14703153060eb09ec75e147c2dd94ac47aedcc7dfe00ee736bf5d59d20e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceTags",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "key": "key", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaResourceTags:
    def __init__(
        self,
        *,
        comparison: builtins.str,
        key: builtins.str,
        value: builtins.str,
    ) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#key SecurityhubAutomationRule#key}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__244cc041bb8b8fd9f81691a5e8e1ff22ee007edc067acae2ce27f004d6a957f8)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#key SecurityhubAutomationRule#key}.'''
        result = self._values.get("key")
        assert result is not None, "Required property 'key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaResourceTags(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaResourceTagsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceTagsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__adef45d62c5aec5e9f1966fbe49e37bc53ff45ecc9a871bf43700593b59243d0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaResourceTagsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb693398dc36412287f69b5bf70bc47f0d7d21abab31059f7af9b980640d0197)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceTagsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__895e6fc4b3f79c27c8ca62c3c3ca85aafc1309ec915c2bd56b49869ba0b65e3d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d424367c6a4c4e3e8486c80459ed7c8fb65524b2938c6acf70bafa3fa3a081cd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__477291cfec917e12d05704fd8273a286e608d16a1b3804a0eb5303b7442c12bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceTags]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceTags]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceTags]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d1b821f3d101e885e3e58ee3a30eb1565ba2789eb0d56af8e14924858833e91c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaResourceTagsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceTagsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__52f72ed4035f8699eca68dee33f105d4cf2f496e767b44ef07de34307e3fedf2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__339534c0850a4e40d24dc0e539cddc0913bd4facf5fafca37a36a69b96010c68)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="key")
    def key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "key"))

    @key.setter
    def key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__604dbceaf5b500ba26e1860e1159f42b3e618f81b68040e9e3de7dd971fcdd2b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "key", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a237a8770b3e99b7015f9697bf63c7955ed003470a7a2a199ef981ba85c421e0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceTags]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceTags]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceTags]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__66378caf9cf00bf5f49b134f218f83b0630cf3ca0b36f202fd4e1e6fc58fea77)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceType",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaResourceType:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0598904127b542048a8094994e6b8789d3893e7833c7e48adb175c1de05696de)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaResourceType(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaResourceTypeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceTypeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0d4b1d5f87fc8d31ccbecb3417bf4b1dba8ea191b88fd75345b8718e2190b6ce)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaResourceTypeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8bbadae2bc375f41c2ae3137d582d80376bbc346602ea0c34fb157b004ad2df9)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaResourceTypeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b1724e45aa8078caff58cf63d7b92d02c89fd2f30d5cf8292ace01fcb6cb163)
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
            type_hints = typing.get_type_hints(_typecheckingstub__75fd95d9a71be50a9ea9652d07a380fb015046e132c8497da46d11abc2297e81)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a163de975a83480853639c6eaaaa7dfe80ec04c01981a615ab2c5ba0c5371986)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceType]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceType]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceType]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba4cf50cbbd070d465516d869dad131e7b82bacfd2a30e21f1ae4767748270d1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaResourceTypeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaResourceTypeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0c16d27dc0f81e3bd059ffb14f2b94fc7a4cb929e565f3c76a8ef57cabb93dfa)
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
            type_hints = typing.get_type_hints(_typecheckingstub__117c7788b0ebf1300a505f3fc83c86b6552f44316512f66552f6ec0ec3b4d110)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__662c66e38bf69c7404204dcbfbf06371647b51398cea7a80043a423dedb82da6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceType]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceType]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceType]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__00b5fda3b6c25146e1309ef5e123f09e3ae16da2d0ebb1e5d8cf0061c8ea7448)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaSeverityLabel",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaSeverityLabel:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__90cead25014973f37f1e45019347f34ef131c59a432e449680388d0708459811)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaSeverityLabel(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaSeverityLabelList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaSeverityLabelList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__88c8f787120ced4bfb8e76d55d79d7aded0fe75a8cff1b2a56f5a3ef73de9002)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaSeverityLabelOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fe6f97e3ea9cde6702a4b161ea26330994782c3046aaa44139bc6fe84e6bbb4d)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaSeverityLabelOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8eb1ab168275cab459905afdc7361f9b6e847fba20c0a6bba1f4b028c32becd0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d74e38ba667ca1dc547b1a65c8318fe479c9b8596ba5e3a63002c83a3ff408a2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f4d39f899ee7d1c6c49a34c178634247d4f965a72e34a7d50e327b72e4f1742f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaSeverityLabel]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaSeverityLabel]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaSeverityLabel]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bc23f0104da20e3ee66597493cdf347adb81182c0a7d5a00d5c6bc08aea93db9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaSeverityLabelOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaSeverityLabelOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3b8383d97e37845fd499dfa918abacf5866f47dd615da50cb73648df1288f791)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cb1bd65f883e9b2b2a2d4b53bfc8b0a8eb31efb1d0dc7898f51901ac73290494)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d79db3f83565351fbd2334523b9093a160f921e8182f8646b69c53b40c0ee78)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaSeverityLabel]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaSeverityLabel]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaSeverityLabel]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7a8c91474751e240785c99580680c00a0e91fd4ead60dd815d12ec46aab14f31)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaSourceUrl",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaSourceUrl:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1feba896025ad5db0946be279b74899bf08c5609d74c9057c580d53ffa3de32)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaSourceUrl(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaSourceUrlList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaSourceUrlList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a2ef419810b1a48694222682cb15c63549f66cb230b4270c23bce3a71bcfdc8e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaSourceUrlOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a1cec27e6451fdea4fb2783c476ca2a006ec797f466f40ab8f93700ffa10ea88)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaSourceUrlOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9735cdc4c3fdeb31be148b2cee7736c10ba15a44c954a051d017308b94ab25f6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5fe8c1d5405a6deb7e60abc12d8196914469e2fa99dc406727a47e837aee45ce)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ca79104fead8ac13ea24501cd625d9c5b3c74519635ebbfc7da85f3af4bb54f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaSourceUrl]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaSourceUrl]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaSourceUrl]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e030b04dda3d6c567b73524fa8acaccc3bd250f2f23a507b1fbd2b8bb12e4f2e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaSourceUrlOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaSourceUrlOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a527aff9e51a87afaad26ad7a3aba83554c1af19c93ad4e444d97bcfb8bb2bcb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__828fa8bbc03361a427724c89007762080b8e38271fbe1dbd644a127b04e64d43)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c144c9be39481267eae207dda92444a7835c9e5dcee559a3269a8593724ce50c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaSourceUrl]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaSourceUrl]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaSourceUrl]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__580d9c0b5080b71d8f6d04d3b990f32d568ec8001afd9600d45448232bddedc3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaTitle",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaTitle:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5040ee1d3fb3b8401061cc478e0b05a188dbdd39304363d670fac2260c34738)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaTitle(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaTitleList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaTitleList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__faff9cb1becdbd9d3e66116a424a3b706c5549e1affa6f2a5519182e81186683)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaTitleOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6fac02bffe9ea216f1b9b9beb2e37cdb565bfc51c50db5c200b5292b6362ab52)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaTitleOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__388179905fe3cdea18c4e210ca1da3132297754179d9ee98737e51f58c8f6123)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3e1f61c4031cc1af18a34d0f1f6d34225c27322fbfa11e1452616784ec7ddb6a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c4c0d5064330e89132e7e35167298ca86fe0850bfd6d3c836797fbab9904a87b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaTitle]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaTitle]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaTitle]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a44c02ff3ca09fc15ef8af7161dd1780bf3ed38fd2a42009a01e416f81ef872)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaTitleOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaTitleOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c723106d68950c645207f6ad7564c9dafd434828cf33454ad92219baf490fc3c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__87b1124ba73c52457820c6b9377957e631720c2e7e2254cdd4497f8fd7f47a5d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ff9508409b175e526465abb806687bb581982908de280c3d5750cc7aff316f5c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaTitle]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaTitle]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaTitle]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6aa6f4d5b4dc2ec28acdb93c36586db0ca82a63075adb3e18437fc6d825c6c71)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaType",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaType:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99166cc0c6297a628cf5e4c1eff2c3b1f47cda768080fbcad559abff8ce87206)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaType(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaTypeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaTypeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__777ad190c559e6ed833ea8dc92cca915803c9aec7e469b3472503dc0f7b2f768)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaTypeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__228cb0673c227fc121a8161b610e38e7c9ba6f3490959bd3736cd7b5ae6c855e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaTypeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5f53205813282a8d2c0bbf621676dd9daf3cca4151abb89915eb33ca1ffb9f1d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0ca9247ab54f294b976a430e37b22f4b5733141a829cf102de4f98dbed3a919b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ae27d0f4fea8a63707965ec641b63d38a969350e590c0a58afac443e23b88fb1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaType]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaType]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaType]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e4583077d45439de20bf58165921489a875a4bb89f4356c9409682c03c5f210d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaTypeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaTypeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4c760c23d6c559535a5180574385283706d4a6657def43f0f7837027a2e3e9f1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__22d430ed361b4c9bb790a9ff437101bd1d16978d9006324c9829900c5b94ae2b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d7ca35891af45ac19ae8a1a54c1d7c723a3589017c5bb646e30bcedb257dc4c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaType]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaType]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaType]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2281c10077e60b3b33b0f29483925d7bb8007d8e42088843a6b860f8a875d845)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaUpdatedAt",
    jsii_struct_bases=[],
    name_mapping={"date_range": "dateRange", "end": "end", "start": "start"},
)
class SecurityhubAutomationRuleCriteriaUpdatedAt:
    def __init__(
        self,
        *,
        date_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SecurityhubAutomationRuleCriteriaUpdatedAtDateRange", typing.Dict[builtins.str, typing.Any]]]]] = None,
        end: typing.Optional[builtins.str] = None,
        start: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param date_range: date_range block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#date_range SecurityhubAutomationRule#date_range}
        :param end: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#end SecurityhubAutomationRule#end}.
        :param start: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#start SecurityhubAutomationRule#start}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__676dd4e30a2071b9df2738b987676f9b8a1d683615b569feb78551a00260eff8)
            check_type(argname="argument date_range", value=date_range, expected_type=type_hints["date_range"])
            check_type(argname="argument end", value=end, expected_type=type_hints["end"])
            check_type(argname="argument start", value=start, expected_type=type_hints["start"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if date_range is not None:
            self._values["date_range"] = date_range
        if end is not None:
            self._values["end"] = end
        if start is not None:
            self._values["start"] = start

    @builtins.property
    def date_range(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaUpdatedAtDateRange"]]]:
        '''date_range block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#date_range SecurityhubAutomationRule#date_range}
        '''
        result = self._values.get("date_range")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SecurityhubAutomationRuleCriteriaUpdatedAtDateRange"]]], result)

    @builtins.property
    def end(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#end SecurityhubAutomationRule#end}.'''
        result = self._values.get("end")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def start(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#start SecurityhubAutomationRule#start}.'''
        result = self._values.get("start")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaUpdatedAt(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaUpdatedAtDateRange",
    jsii_struct_bases=[],
    name_mapping={"unit": "unit", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaUpdatedAtDateRange:
    def __init__(self, *, unit: builtins.str, value: jsii.Number) -> None:
        '''
        :param unit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#unit SecurityhubAutomationRule#unit}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a0391a444203bc20fcfc5fa32739578c23cb6c4b503291dcba22b6f0353a0787)
            check_type(argname="argument unit", value=unit, expected_type=type_hints["unit"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "unit": unit,
            "value": value,
        }

    @builtins.property
    def unit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#unit SecurityhubAutomationRule#unit}.'''
        result = self._values.get("unit")
        assert result is not None, "Required property 'unit' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaUpdatedAtDateRange(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaUpdatedAtDateRangeList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaUpdatedAtDateRangeList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__df7a41dd0374bcde1139fa0591388f6b563fdbf036504ade5f2c2bebede3d4ba)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaUpdatedAtDateRangeOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__728c8dcdb634e63a9f925c45a94bc8e600b0115cac7b4779b14b085500a5f2e5)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaUpdatedAtDateRangeOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ffa39a367ed207809bc8d469cf4d047cecbe3ffb531ba9e90f77eccc315227a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3f80e1851b67ecbbabd6d4f382155768c260352114fc931dcb857a5a400c05ec)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a0ef69ca38634e5e061f0b7a6c56eeecdbc4abd61207d72e83b0544e546f456c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUpdatedAtDateRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUpdatedAtDateRange]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUpdatedAtDateRange]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9b45a0e36ece60533f15ea15829ed2a064b2285f6476e1b9d203ca8591943209)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaUpdatedAtDateRangeOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaUpdatedAtDateRangeOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__89080735ea2a0a7f66b90da9fb02276979a18450f4907e97efdd396de100c910)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="unitInput")
    def unit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "unitInput"))

    @builtins.property
    @jsii.member(jsii_name="valueInput")
    def value_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "valueInput"))

    @builtins.property
    @jsii.member(jsii_name="unit")
    def unit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "unit"))

    @unit.setter
    def unit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6756d44ee8ef9d2286c1a8791a9f4f36c3af7ad1939ca91773a8231d3be33d5b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "unit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "value"))

    @value.setter
    def value(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2e460b99e1392bdf41a4e4ca04c0608461a18fe0aaea3d684243419f215dc8e2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaUpdatedAtDateRange]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaUpdatedAtDateRange]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaUpdatedAtDateRange]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46416e43b2b0d15f1590274de9bda7e4c899a280f4edbf6c349d266081e07be7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaUpdatedAtList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaUpdatedAtList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6455ddd4c092b0159f8707f376c1cb9bebc1cb20ea536176564fe2b4da3f41d8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaUpdatedAtOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa8652c570e4655acf850c1a39274d81838b04acb277308a629a1bfbc46a6079)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaUpdatedAtOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__966a401d4a693620a97c939ea883fbe0c5bb59db5485f118ade5409395ce710e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__32c104fad3e5aa902113701e2717620bde001b9ec5c66f5842eee946ae51cc61)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6f28341b80dc63eaabd32fa08bd7f162d8ebe318dce4b10275e08f092e8bc315)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUpdatedAt]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUpdatedAt]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUpdatedAt]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dd7bfe8b01f03a99f75cf419592a3134cdc11a0ae4f64dc9afde51e8a682d80b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaUpdatedAtOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaUpdatedAtOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a4fea8584171a4fa741f6dea45bb2d9b7a3928cb5eec14ac67e3f7e79da7acba)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putDateRange")
    def put_date_range(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaUpdatedAtDateRange, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2029d9a463fb53bba14a82a0ef3f6c60354da6f5298e224fa9eb3304a4d21626)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDateRange", [value]))

    @jsii.member(jsii_name="resetDateRange")
    def reset_date_range(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDateRange", []))

    @jsii.member(jsii_name="resetEnd")
    def reset_end(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnd", []))

    @jsii.member(jsii_name="resetStart")
    def reset_start(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStart", []))

    @builtins.property
    @jsii.member(jsii_name="dateRange")
    def date_range(self) -> SecurityhubAutomationRuleCriteriaUpdatedAtDateRangeList:
        return typing.cast(SecurityhubAutomationRuleCriteriaUpdatedAtDateRangeList, jsii.get(self, "dateRange"))

    @builtins.property
    @jsii.member(jsii_name="dateRangeInput")
    def date_range_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUpdatedAtDateRange]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUpdatedAtDateRange]]], jsii.get(self, "dateRangeInput"))

    @builtins.property
    @jsii.member(jsii_name="endInput")
    def end_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endInput"))

    @builtins.property
    @jsii.member(jsii_name="startInput")
    def start_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "startInput"))

    @builtins.property
    @jsii.member(jsii_name="end")
    def end(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "end"))

    @end.setter
    def end(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7092762b70e8d108a6bc3c6f53e5eaa813cd92adc7b58d081b6bae52b56343ac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "end", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="start")
    def start(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "start"))

    @start.setter
    def start(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__585e41d8ac9cebf3639488672d6071bdbab841a641865212ba317650a4b70bb9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "start", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaUpdatedAt]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaUpdatedAt]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaUpdatedAt]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__af8fc6fd7f314383ceee0b18f1b2dbe921a637a06ba28cc8dc6589bf12299ac0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaUserDefinedFields",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "key": "key", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaUserDefinedFields:
    def __init__(
        self,
        *,
        comparison: builtins.str,
        key: builtins.str,
        value: builtins.str,
    ) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#key SecurityhubAutomationRule#key}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c5fb5302333156f979ef048fcd800f27af30c3ef1cd8a058c3077812c6b02b3c)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#key SecurityhubAutomationRule#key}.'''
        result = self._values.get("key")
        assert result is not None, "Required property 'key' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaUserDefinedFields(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaUserDefinedFieldsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaUserDefinedFieldsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__89e835b5a9f79113d346c835ab7605338b627784bb927e29592adbf6d231ee8c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaUserDefinedFieldsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9d3e03ae236f1108c447331de18f881948eb031cc6bab4f42311a4bbf2fd90e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaUserDefinedFieldsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e86f3251544d193bf98bacdf6b24530137b3e63cf012e87e63e7ad463063b38e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__40f452bba25a191c88c5ac92ee000f65568493d1177930527364290f466737e4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9afe8edc553120c42aa3b71ec1df5e531a684c7d084609808f7d94a3f4f084a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUserDefinedFields]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUserDefinedFields]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUserDefinedFields]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5fe3281ae1f6dc6de60e5e8e9d6719d6b303445d8496e3564578f29b84d041c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaUserDefinedFieldsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaUserDefinedFieldsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bef61edd826e1d830cd223e4c7a233fe620e6bc8f5d8e1abae77db2b5755d0f2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a5aff77e37ca07d2e8a515d114fa6aacb293a5985025fac5022171b8ceaa09fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="key")
    def key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "key"))

    @key.setter
    def key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12d5341d28c10ed26d8d4fb2a3ac48d78563bb99ce434023ee01ac66d782735e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "key", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__068e3a876f398488b12fc4abf69c5b37f07c558cccf86c6a81ffddd573a67438)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaUserDefinedFields]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaUserDefinedFields]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaUserDefinedFields]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__be6e1523c043db1bcc4925f2b8c5a8d3c20282f6d502064afc0287caa3dd073d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaVerificationState",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaVerificationState:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f59013297323580638bde367972e2ad774a5f2e313c254c80fe9885bc4d28c13)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaVerificationState(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaVerificationStateList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaVerificationStateList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__94c54bb3782359873af2c0734e57ad679f370b917e06f0cccf68dac5679c9eae)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaVerificationStateOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd8cf00e5a4d7bb5a8eeb474a1c0879e8c8854ed6c7d64545fb82295bf3163d8)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaVerificationStateOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6f863e07702b6350376791d7b5c10eadaff56b0bdc0908777cf1a6b563c3e98)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b8da4c7d325ebbd72d38a0c9e8e88d7bfaeddfa3bf6107cb1dea81c5dc16711d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__035a3c85cfe76acd47a8c55274adc96cfc39b1f635c1f6cac7bdfbabe3caec49)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaVerificationState]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaVerificationState]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaVerificationState]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba54dc28d5fe209d2a643bade53d23a4c5fbe52ceff73b64e2bf43b6796a9524)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaVerificationStateOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaVerificationStateOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__992df009cd8a29db26d1dcfd47c892b360855da99dc718ffae3f7ea883a9d8be)
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
            type_hints = typing.get_type_hints(_typecheckingstub__31df0088c0e63209fc841566443b63707c450315d3ef2edd2a15678079fbe8a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ef263792b50446211c08cfd5bee360b32a8c95b960e1e5fa40d80e7c55a64749)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaVerificationState]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaVerificationState]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaVerificationState]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18d9511ed80cd109b10e69a7b9fca72683629b1752e10269a25c4add57f838f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaWorkflowStatus",
    jsii_struct_bases=[],
    name_mapping={"comparison": "comparison", "value": "value"},
)
class SecurityhubAutomationRuleCriteriaWorkflowStatus:
    def __init__(self, *, comparison: builtins.str, value: builtins.str) -> None:
        '''
        :param comparison: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6dc4a5a7b39243ec6901e2c408c2686807a45db7be2969a46893fde856e2b26)
            check_type(argname="argument comparison", value=comparison, expected_type=type_hints["comparison"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "comparison": comparison,
            "value": value,
        }

    @builtins.property
    def comparison(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#comparison SecurityhubAutomationRule#comparison}.'''
        result = self._values.get("comparison")
        assert result is not None, "Required property 'comparison' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SecurityhubAutomationRuleCriteriaWorkflowStatus(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SecurityhubAutomationRuleCriteriaWorkflowStatusList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaWorkflowStatusList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__72de6510fef1a1feebc3ef8818f33ef4c70c05da9f3f6a14cac1c88a0db75e9c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SecurityhubAutomationRuleCriteriaWorkflowStatusOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3fd635fa4133cecc83f75ed36d38641029117378e5eba449600ba3811c6786ff)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SecurityhubAutomationRuleCriteriaWorkflowStatusOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9358c384545142bc72a4bb2750f95074f81708fbbb80cefd7a5a7ec3f5c34d1a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a21d3523f98617271aaf8c41afc9c03ebbad3b1db6d5062b4c599bf0f6fd5fbe)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6c528ceb688c0fb27d4c33a24c9ff049f89f9d6c4aa56d351acd4a23a8fa2fd4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaWorkflowStatus]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaWorkflowStatus]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaWorkflowStatus]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__09ac16412f268533dcdee83da7f3f8f5912a8d1d22ae2fd34428d5f7a9dacf4c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SecurityhubAutomationRuleCriteriaWorkflowStatusOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaWorkflowStatusOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c8e513c043b0a4036aa2983200d1a77015d41be3145d8c7128a53941948c3005)
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
            type_hints = typing.get_type_hints(_typecheckingstub__01ddb56e69d03d8a1c6ef1b54d09d3655d999ff6cd72b6dec2afcabb5041219c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "comparison", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ca3925f9343d1a66a59d9dc62ceccbaac3367795b377762d3ad9eca85041f51)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaWorkflowStatus]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaWorkflowStatus]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaWorkflowStatus]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__da434229614143b4356ba4edb3df9ff0cb9f8e5c12724b125834de4dfcd76a97)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "SecurityhubAutomationRule",
    "SecurityhubAutomationRuleActions",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdate",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateList",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateNote",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateNoteList",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateNoteOutputReference",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateOutputReference",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindingsList",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindingsOutputReference",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverityList",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverityOutputReference",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflowList",
    "SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflowOutputReference",
    "SecurityhubAutomationRuleActionsList",
    "SecurityhubAutomationRuleActionsOutputReference",
    "SecurityhubAutomationRuleConfig",
    "SecurityhubAutomationRuleCriteria",
    "SecurityhubAutomationRuleCriteriaAwsAccountId",
    "SecurityhubAutomationRuleCriteriaAwsAccountIdList",
    "SecurityhubAutomationRuleCriteriaAwsAccountIdOutputReference",
    "SecurityhubAutomationRuleCriteriaAwsAccountName",
    "SecurityhubAutomationRuleCriteriaAwsAccountNameList",
    "SecurityhubAutomationRuleCriteriaAwsAccountNameOutputReference",
    "SecurityhubAutomationRuleCriteriaCompanyName",
    "SecurityhubAutomationRuleCriteriaCompanyNameList",
    "SecurityhubAutomationRuleCriteriaCompanyNameOutputReference",
    "SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId",
    "SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsIdList",
    "SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsIdOutputReference",
    "SecurityhubAutomationRuleCriteriaComplianceSecurityControlId",
    "SecurityhubAutomationRuleCriteriaComplianceSecurityControlIdList",
    "SecurityhubAutomationRuleCriteriaComplianceSecurityControlIdOutputReference",
    "SecurityhubAutomationRuleCriteriaComplianceStatus",
    "SecurityhubAutomationRuleCriteriaComplianceStatusList",
    "SecurityhubAutomationRuleCriteriaComplianceStatusOutputReference",
    "SecurityhubAutomationRuleCriteriaConfidence",
    "SecurityhubAutomationRuleCriteriaConfidenceList",
    "SecurityhubAutomationRuleCriteriaConfidenceOutputReference",
    "SecurityhubAutomationRuleCriteriaCreatedAt",
    "SecurityhubAutomationRuleCriteriaCreatedAtDateRange",
    "SecurityhubAutomationRuleCriteriaCreatedAtDateRangeList",
    "SecurityhubAutomationRuleCriteriaCreatedAtDateRangeOutputReference",
    "SecurityhubAutomationRuleCriteriaCreatedAtList",
    "SecurityhubAutomationRuleCriteriaCreatedAtOutputReference",
    "SecurityhubAutomationRuleCriteriaCriticality",
    "SecurityhubAutomationRuleCriteriaCriticalityList",
    "SecurityhubAutomationRuleCriteriaCriticalityOutputReference",
    "SecurityhubAutomationRuleCriteriaDescription",
    "SecurityhubAutomationRuleCriteriaDescriptionList",
    "SecurityhubAutomationRuleCriteriaDescriptionOutputReference",
    "SecurityhubAutomationRuleCriteriaFirstObservedAt",
    "SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange",
    "SecurityhubAutomationRuleCriteriaFirstObservedAtDateRangeList",
    "SecurityhubAutomationRuleCriteriaFirstObservedAtDateRangeOutputReference",
    "SecurityhubAutomationRuleCriteriaFirstObservedAtList",
    "SecurityhubAutomationRuleCriteriaFirstObservedAtOutputReference",
    "SecurityhubAutomationRuleCriteriaGeneratorId",
    "SecurityhubAutomationRuleCriteriaGeneratorIdList",
    "SecurityhubAutomationRuleCriteriaGeneratorIdOutputReference",
    "SecurityhubAutomationRuleCriteriaId",
    "SecurityhubAutomationRuleCriteriaIdList",
    "SecurityhubAutomationRuleCriteriaIdOutputReference",
    "SecurityhubAutomationRuleCriteriaLastObservedAt",
    "SecurityhubAutomationRuleCriteriaLastObservedAtDateRange",
    "SecurityhubAutomationRuleCriteriaLastObservedAtDateRangeList",
    "SecurityhubAutomationRuleCriteriaLastObservedAtDateRangeOutputReference",
    "SecurityhubAutomationRuleCriteriaLastObservedAtList",
    "SecurityhubAutomationRuleCriteriaLastObservedAtOutputReference",
    "SecurityhubAutomationRuleCriteriaList",
    "SecurityhubAutomationRuleCriteriaNoteText",
    "SecurityhubAutomationRuleCriteriaNoteTextList",
    "SecurityhubAutomationRuleCriteriaNoteTextOutputReference",
    "SecurityhubAutomationRuleCriteriaNoteUpdatedAt",
    "SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange",
    "SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRangeList",
    "SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRangeOutputReference",
    "SecurityhubAutomationRuleCriteriaNoteUpdatedAtList",
    "SecurityhubAutomationRuleCriteriaNoteUpdatedAtOutputReference",
    "SecurityhubAutomationRuleCriteriaNoteUpdatedBy",
    "SecurityhubAutomationRuleCriteriaNoteUpdatedByList",
    "SecurityhubAutomationRuleCriteriaNoteUpdatedByOutputReference",
    "SecurityhubAutomationRuleCriteriaOutputReference",
    "SecurityhubAutomationRuleCriteriaProductArn",
    "SecurityhubAutomationRuleCriteriaProductArnList",
    "SecurityhubAutomationRuleCriteriaProductArnOutputReference",
    "SecurityhubAutomationRuleCriteriaProductName",
    "SecurityhubAutomationRuleCriteriaProductNameList",
    "SecurityhubAutomationRuleCriteriaProductNameOutputReference",
    "SecurityhubAutomationRuleCriteriaRecordState",
    "SecurityhubAutomationRuleCriteriaRecordStateList",
    "SecurityhubAutomationRuleCriteriaRecordStateOutputReference",
    "SecurityhubAutomationRuleCriteriaRelatedFindingsId",
    "SecurityhubAutomationRuleCriteriaRelatedFindingsIdList",
    "SecurityhubAutomationRuleCriteriaRelatedFindingsIdOutputReference",
    "SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn",
    "SecurityhubAutomationRuleCriteriaRelatedFindingsProductArnList",
    "SecurityhubAutomationRuleCriteriaRelatedFindingsProductArnOutputReference",
    "SecurityhubAutomationRuleCriteriaResourceApplicationArn",
    "SecurityhubAutomationRuleCriteriaResourceApplicationArnList",
    "SecurityhubAutomationRuleCriteriaResourceApplicationArnOutputReference",
    "SecurityhubAutomationRuleCriteriaResourceApplicationName",
    "SecurityhubAutomationRuleCriteriaResourceApplicationNameList",
    "SecurityhubAutomationRuleCriteriaResourceApplicationNameOutputReference",
    "SecurityhubAutomationRuleCriteriaResourceDetailsOther",
    "SecurityhubAutomationRuleCriteriaResourceDetailsOtherList",
    "SecurityhubAutomationRuleCriteriaResourceDetailsOtherOutputReference",
    "SecurityhubAutomationRuleCriteriaResourceId",
    "SecurityhubAutomationRuleCriteriaResourceIdList",
    "SecurityhubAutomationRuleCriteriaResourceIdOutputReference",
    "SecurityhubAutomationRuleCriteriaResourcePartition",
    "SecurityhubAutomationRuleCriteriaResourcePartitionList",
    "SecurityhubAutomationRuleCriteriaResourcePartitionOutputReference",
    "SecurityhubAutomationRuleCriteriaResourceRegion",
    "SecurityhubAutomationRuleCriteriaResourceRegionList",
    "SecurityhubAutomationRuleCriteriaResourceRegionOutputReference",
    "SecurityhubAutomationRuleCriteriaResourceTags",
    "SecurityhubAutomationRuleCriteriaResourceTagsList",
    "SecurityhubAutomationRuleCriteriaResourceTagsOutputReference",
    "SecurityhubAutomationRuleCriteriaResourceType",
    "SecurityhubAutomationRuleCriteriaResourceTypeList",
    "SecurityhubAutomationRuleCriteriaResourceTypeOutputReference",
    "SecurityhubAutomationRuleCriteriaSeverityLabel",
    "SecurityhubAutomationRuleCriteriaSeverityLabelList",
    "SecurityhubAutomationRuleCriteriaSeverityLabelOutputReference",
    "SecurityhubAutomationRuleCriteriaSourceUrl",
    "SecurityhubAutomationRuleCriteriaSourceUrlList",
    "SecurityhubAutomationRuleCriteriaSourceUrlOutputReference",
    "SecurityhubAutomationRuleCriteriaTitle",
    "SecurityhubAutomationRuleCriteriaTitleList",
    "SecurityhubAutomationRuleCriteriaTitleOutputReference",
    "SecurityhubAutomationRuleCriteriaType",
    "SecurityhubAutomationRuleCriteriaTypeList",
    "SecurityhubAutomationRuleCriteriaTypeOutputReference",
    "SecurityhubAutomationRuleCriteriaUpdatedAt",
    "SecurityhubAutomationRuleCriteriaUpdatedAtDateRange",
    "SecurityhubAutomationRuleCriteriaUpdatedAtDateRangeList",
    "SecurityhubAutomationRuleCriteriaUpdatedAtDateRangeOutputReference",
    "SecurityhubAutomationRuleCriteriaUpdatedAtList",
    "SecurityhubAutomationRuleCriteriaUpdatedAtOutputReference",
    "SecurityhubAutomationRuleCriteriaUserDefinedFields",
    "SecurityhubAutomationRuleCriteriaUserDefinedFieldsList",
    "SecurityhubAutomationRuleCriteriaUserDefinedFieldsOutputReference",
    "SecurityhubAutomationRuleCriteriaVerificationState",
    "SecurityhubAutomationRuleCriteriaVerificationStateList",
    "SecurityhubAutomationRuleCriteriaVerificationStateOutputReference",
    "SecurityhubAutomationRuleCriteriaWorkflowStatus",
    "SecurityhubAutomationRuleCriteriaWorkflowStatusList",
    "SecurityhubAutomationRuleCriteriaWorkflowStatusOutputReference",
]

publication.publish()

def _typecheckingstub__c4bc727a8ea3b105415349954ac6ea04e0ed935ba8c46eb082e197ed4f227cfd(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    description: builtins.str,
    rule_name: builtins.str,
    rule_order: jsii.Number,
    actions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActions, typing.Dict[builtins.str, typing.Any]]]]] = None,
    criteria: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteria, typing.Dict[builtins.str, typing.Any]]]]] = None,
    is_terminal: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    rule_status: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__ff940a62db3738588a6e2913070f4e04240d51a9d274ac1943af6fd06008a655(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72d2290193b13ff4047164968df301ed184f1f7a1bf7ec911ebd3c69be1724fd(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActions, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2cda30dd8611dac89d0f576dcbce075b7341da25582fbcae968c4149508f0517(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteria, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10a97298dcf1cc6637e09492428d4ebfe90e31070a6938474eed8fd0989893b3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__789ebb7edb3aae3e9bb5dde3211e2d3dfd8a700854de0a65600607787619aaa0(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5de3350933b7bddeba4e267397514c95ef606e2d7e8dee24b882544492478f2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6cac391eedc6938ba1fc0ec356f382a3536645a6802f0fee187754e9e374709d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdea70921884b5b5a45dea5c4ca7149dd32d2a30cf38456a5c1804c13bff9e81(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5af1aecb2f24681d25ef990885298428f228d2b73c4394d20d21032e241e88c4(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f7f1da03c2d5557c941babc8ba57e6afd75e19cf8bd2ce2c67ade92da65f756(
    *,
    finding_fields_update: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActionsFindingFieldsUpdate, typing.Dict[builtins.str, typing.Any]]]]] = None,
    type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__787c5dda2482b10f5cdfe34b52e9c77ed8d61c03becb51084a2de8c138eb6d04(
    *,
    confidence: typing.Optional[jsii.Number] = None,
    criticality: typing.Optional[jsii.Number] = None,
    note: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActionsFindingFieldsUpdateNote, typing.Dict[builtins.str, typing.Any]]]]] = None,
    related_findings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings, typing.Dict[builtins.str, typing.Any]]]]] = None,
    severity: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity, typing.Dict[builtins.str, typing.Any]]]]] = None,
    types: typing.Optional[typing.Sequence[builtins.str]] = None,
    user_defined_fields: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    verification_state: typing.Optional[builtins.str] = None,
    workflow: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__34ca2513688abc7e4be47eb543d0ad9863ae6df081d8f719e557475d75cdcfa1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e5acb5e9f297afca9387b723d65109225905cc49c4e752df928b38c19c64eab(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__faf3e22790c67abbc2b14e774add9b134058926d07a0eac4fa2a7c043bacdce3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8522c6d0b8af03296256c4a4edd490d2a6b19f092a1e3d782b80255233fff253(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f02e7bc184c223a884b6089b22626915a131e21b4560ff0e33a4b97081c1574(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1548848b1d5723ed45d41ad49889003216a607efa6c590fa37029dc5592763f5(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdate]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5fdd5158b0d6f80456821ebf091b80c90b35d9695a7a924f33a27dbc5bd368d(
    *,
    text: builtins.str,
    updated_by: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ad1ae1b24477662c18789eccd867a0720fb1a65170752dbc0f99169325697f4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9272b3c0daf0b09e23dd31a54681447544e305e2f6bbe71d1e3e7a7ecfdb4f06(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2a076353096d79dbe1dc69119198198e19d55a8f55005b78d682aef07c09a7d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8744f51b4cb59f2b23cb0a6581a19da2689ac6d5dd9a5a05f59754b0cb705bdc(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa79deb930e905c3b6f66ad18d0801f672cf91a64baf1922893e0835b768b9b8(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__882a6e0d053191e58506b43147838403993318e896dee9ec0333329340ecf0fe(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateNote]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3c8f111672d2a7ff975608a00844f6cbae02f76f8cd436f9121744044d0cedb2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b0bb7f006dbdf36ef307a692e4c1c40ef3fa1c9a7799d06b53bae14febff298(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d95711d49e97c5bf8867b892853be01766393426f26df665a3d4d5f93b41137c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__725cebfccb3c30381e4fc4b6decdbc8d47e271e6986a827c880f67139e6d0dff(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateNote]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b1c5cda814cc956ba6c3b043193df9ccdf69b648c4ed1d653cb748de78dcbfc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a916adfdfe2f549b44bf191d10ddc08eff4c1e7adada41ea03f9f4fb4cca3808(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActionsFindingFieldsUpdateNote, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__569f13cc974fbcca459dd391b6fcba35328fd5aea1de35dc7524c09c5f493394(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f6239f46075608f71daed0f734cd3fa19d1832a667c3a0d178e553ffdfcb836(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aca3d393636bc4119d374c1be687540eabb504231d461a4799bfb109dec93fa6(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d4069fe64896d9a2bd9b3d1e4cb045896548bcf5ecf0fc5b99cb3d0613f2fc87(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96e59fc7109c569e2b33865308409d87a2882bfe9e894100299e9d962e966624(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ee379466df59328a7acbae3670e4349f2c9b02ab5dab5c2d59e9ca223223f28(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c21ce97463feb85666ff44b2f3319a63a0adb63440823b12bc0784a2835d7838(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32eb5963e94fa903147cc41d79247023ba581b1d2dcaf910c7cc52940b207713(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02d5d76d3b696594e5e52e1cd02b641d50602d5cd748d8579fbcb26da2a98815(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdate]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac8f6c24ab87ccddd233ef10e3b4d7a1c0e867c2ce2fdf796b76b153db9cd7b5(
    *,
    id: builtins.str,
    product_arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb6b94512b2b6d6da785195fc3b54515c8e202f3da4a98f9f4675176541f4690(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0139c0d446b6b31efb8c121baf2c8329abb7255a8246e2dd09f4a7aa4fd95934(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__571c516561009cde9ee427c83fc48f26fe3fe241c446a5123c92b34e94fa650e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f3cbf4d607bb02f0603828839c7bb18818f7c52f979a0899241f092f3d93100(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f6863ef0e49e6bad37a34efcffdafcd2af82d69cc273e5fbe6526048bfcf3fe(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afe97ee6812ac16dcd046d2aed090eb6ebce49f2570f16713c4ef50a34229e32(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__caca2f816927a364809b1e6b78828fcc7200e08c914cd5e3b7571be244ff2ba1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d83649ab840f27b9e07ae69107f8649f06c6a7fd4322b995f3090c42fde402cc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__464b8daa29829e3ecedc41903c9803fc39408b379a4d03505a1703ff8baebffa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b142f9b8d1cd3cfe2204066d61f65dd338a37a432b8b88fab7061b7f9ac7086(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2a0c95825fc4c261d10948dff691d83f75be4c22fcc839e94eaaeda060f90c5(
    *,
    label: typing.Optional[builtins.str] = None,
    product: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cda615e5e9891b3c5e23aaf7e92b2f562fca71fdb860a314db7e9a63e3055b06(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05e851e165a781bf1c3413eeed5b27f071138b72c2b3a8a365a9d15837ef5b15(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7027b88cc847086263d5d643898bb9c3891754a0d5a62cad4c9b434744b4846f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04918abc324a446e4f085cd97d2f32bc98cc32ab2acfc2601a4a2741b4f99ee5(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__45370e888b0f2be80ab7eea69cef1ec2b1b4d835cd4c339fbdbb1573aea61e38(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__effa39e62e1059a51ac9c6e75659fe4c71837bfa8195909219770aad6ec9f871(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3fcfa3a360f6c5577121995966832cb793c3845c13ce93f77173292cd1f24b61(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3e1af4bfa9cd9622eb28bc100232f124806f4083139758052404bd26d394003(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01da766bde636485779e361abdb67048b5a50c8dd6b61fb17d7cff7c66de40af(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2959dd59b8abfe7ecfb66b79e4465a65610ede4c72715b039a7913d219ccff6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8feda9c5da674c7373a5fcffaa23c4c3f364c089505a997887d4069d6c15a1cb(
    *,
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b62012d76b200fbc1987954077fcb67c6a8cac2fbb8a8f05dd67f6bf94bd842(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__251c821b37f2e730867ab3d8cac14687970da231c4bb5c2130bc01279500337c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d7fbb78a640158f10d96bdbd5e6bfb37a513e550e144711a04d5065e8922e78(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e9fefc1f4e7933345becce27f48e355dcfbcb6688b259fa73665f4f5fad0271d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c459d0e362167a7e4a368ae9e7d8bab92bd9e2321c4c82416f615c142c4daef5(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__668c6b4025e006df2685fbbdc2f40eb7f9dd888b8dfb3dd30d76fa8f2b84b223(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee15dd4fc187e595d87417373a2d4a2ef34be48705d8a52cee1d66360b3c109a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2b2f1d7232a7d5c81432919c86ada8aa5d5c76751b587b00a10a20bd07ac1982(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__957386929138886cb190d4903a04bf0e2500efd03efb0612bfa3b58272249b52(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__584e5ab732dd038a4de741d755d0b1cc620cce07f45ee951c8d622ece8740df8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__062e4b2eb9a56a98b8bfcdd858b72ffdf9afa2d7684cb76f25a58d09115a32a3(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c94cfdeb741189ff13f178c118600810d361bbd04d1fd9dbf1036b7eecf9d999(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc5245ef60754c8e275126acbfc3a6b6710ca45bcb7f2cbbe95b0d7f0c893a13(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6febad7602c6453f6a45e566920b4b73911abb6f88a1715d9cf271865a2b7436(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cbaff05f158161cf22993736c6d8d7a6a669ba9ecf8aa013721f25bc694845ee(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleActions]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__edefe046e85e83959992dc9ad8c5896d83808c125587f41ae5d1515316dd9062(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82adb6ea399f2a913304a9aa4b9274e6d7345ad1eb40339be0d586bf27ee98ff(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActionsFindingFieldsUpdate, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__17c001280cecd1c8b8403776aa775dce7536ed1a914713b4eecc5f06b3b08684(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__292db5b3b60227a9871b7c3704f9f3f771139d2c1cac65945f3a1130b3a8ddb2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleActions]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4acb45c9803b6861763626047e39e4a9a5896de64bbbbca14afa6f3655e7320c(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    description: builtins.str,
    rule_name: builtins.str,
    rule_order: jsii.Number,
    actions: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleActions, typing.Dict[builtins.str, typing.Any]]]]] = None,
    criteria: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteria, typing.Dict[builtins.str, typing.Any]]]]] = None,
    is_terminal: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    rule_status: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2fb486dd31f7de48243db23db0805b66641329d12dbd5dbe6bb88545e16a8288(
    *,
    aws_account_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaAwsAccountId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    aws_account_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaAwsAccountName, typing.Dict[builtins.str, typing.Any]]]]] = None,
    company_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaCompanyName, typing.Dict[builtins.str, typing.Any]]]]] = None,
    compliance_associated_standards_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    compliance_security_control_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaComplianceSecurityControlId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    compliance_status: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaComplianceStatus, typing.Dict[builtins.str, typing.Any]]]]] = None,
    confidence: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaConfidence, typing.Dict[builtins.str, typing.Any]]]]] = None,
    created_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaCreatedAt, typing.Dict[builtins.str, typing.Any]]]]] = None,
    criticality: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaCriticality, typing.Dict[builtins.str, typing.Any]]]]] = None,
    description: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaDescription, typing.Dict[builtins.str, typing.Any]]]]] = None,
    first_observed_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaFirstObservedAt, typing.Dict[builtins.str, typing.Any]]]]] = None,
    generator_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaGeneratorId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    last_observed_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaLastObservedAt, typing.Dict[builtins.str, typing.Any]]]]] = None,
    note_text: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaNoteText, typing.Dict[builtins.str, typing.Any]]]]] = None,
    note_updated_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaNoteUpdatedAt, typing.Dict[builtins.str, typing.Any]]]]] = None,
    note_updated_by: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaNoteUpdatedBy, typing.Dict[builtins.str, typing.Any]]]]] = None,
    product_arn: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaProductArn, typing.Dict[builtins.str, typing.Any]]]]] = None,
    product_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaProductName, typing.Dict[builtins.str, typing.Any]]]]] = None,
    record_state: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaRecordState, typing.Dict[builtins.str, typing.Any]]]]] = None,
    related_findings_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaRelatedFindingsId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    related_findings_product_arn: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_application_arn: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceApplicationArn, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_application_name: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceApplicationName, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_details_other: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceDetailsOther, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_id: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceId, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_partition: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourcePartition, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_region: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceRegion, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_tags: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceTags, typing.Dict[builtins.str, typing.Any]]]]] = None,
    resource_type: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceType, typing.Dict[builtins.str, typing.Any]]]]] = None,
    severity_label: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaSeverityLabel, typing.Dict[builtins.str, typing.Any]]]]] = None,
    source_url: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaSourceUrl, typing.Dict[builtins.str, typing.Any]]]]] = None,
    title: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaTitle, typing.Dict[builtins.str, typing.Any]]]]] = None,
    type: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaType, typing.Dict[builtins.str, typing.Any]]]]] = None,
    updated_at: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaUpdatedAt, typing.Dict[builtins.str, typing.Any]]]]] = None,
    user_defined_fields: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaUserDefinedFields, typing.Dict[builtins.str, typing.Any]]]]] = None,
    verification_state: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaVerificationState, typing.Dict[builtins.str, typing.Any]]]]] = None,
    workflow_status: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaWorkflowStatus, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee467bec4e88f944b7322fca904ef40c56cd913b52cfd396e2b9a8b669a00736(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdd16d7ea59e90de397a9ec19bb80da2a6044d2fa9b2d9ac4a85bbafa06d366c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0614316d7b8657cbf1dbb5ffc071908de54c3e6c263d73aaaebcccaeb5ec1cd(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c6ba9a92e3432b54f1ab1c8118a34df1c026a9b28a9a9d4f962fee2d9cb55a8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__74b22e1deb8b0b566f2bf0ab8a00aa1fbacc5558dd83a73800584920226831c8(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3779dbbe0cc47f59696857d5c85386738bc2bf17eda5e71eded311c02918b3ea(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__796070237ba5649c3d6090aeb902825e34d01f6bee5c6bdb1b03eb8e8882326a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaAwsAccountId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7475a1b028d3fe9d6f9e797cd1c065cf37c672c64a0128fe7ea232702e916399(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67741649b739cb2f2e806c72037a5b9633a66b5951f8f978a8235f89074aa7db(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eaef3b72253f8b0cb2eb03b1566674d6febda7938654ecf770cbeaaa436504a1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__74add1db1e4da40b301ff7406a720dfd6df66d1c0c1d192f43533f5efc889633(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaAwsAccountId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa458abad56218d98116a3bf70a3972ebaab738820a95b97d3335481a09fecbb(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5f7bb0f7c3207647927be90151d40a9ba6e5fdb8712a0e7f2d9a98f12a08bec(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87dfbefad449f5ead2b173299a833fc562fc97ed7ce78fcb7a2387b54262fafc(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31c2265d4705265c6c5167e5fcafca5152ebb5d3e257c27b5a98e7468d83a772(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b4c1d02c16d34f68946164b5caebfacaad1878b740cdb0f0c442729c9f73b46a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24e4f33f6a7f5ba3ca633e1c69dc6abd01d40004b6b505b56420b038244be3c2(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__180d2032b407a42e8c849855e9681f784cb0672b0bf187870a3baff957d4f529(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaAwsAccountName]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c469866efff9222b0c644cbbc15ba56e2ac48339cb55797d7d8a6cde6af940b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__110b4dbf1289bf4a5a6caea92f49834fcf57b8b71ea3e6d4931ecf35feb90e02(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea9cb0cae60e62108fb4a7051c6b03b6add24fefdbb6637c8204a059a692f19a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05bc70ea4c9d1f09c9a5ad1b5b5a3e4c23a574dcd0ed74218cadfb99ed87401d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaAwsAccountName]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d053e129be3085cd80764323050cfc114892f3d272b36b9bdc6c8cad052824da(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d043b51e60beb84adcd6f4012544b8d1d8c94280414222d22aa422fe4923c14(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65091a7e0ea9dfdd8dcf76e6134c237e912d1d94a77a26fffdea2ed35a01187b(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__286e90bea0ab1cf72ed270701b12104edd58292ef230f91ad8b83510c074352f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a674d8fea85b5dcfb3517c337913b17e6f3342afe170e136908cf627cb69c823(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8394d9c88c42a7886c4a5d26767530ad34bb713e175875c7ad001a30571a355e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__216205cf78563ddcf02134ea7419ac566051cf9096fe7cc9a69209aaf7f5be13(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCompanyName]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83e63394b7f9f1816980f00570fea52f43ee24b8073aeb89b7d3d28749cc0cbe(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0f28c5a6eb77d7c23ce9c021d7cd499cbab63833f9bf0171c83a8edd1a011a5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a92598416607abefef46c13fe944be943037c8ba542c12f38230e63197d63a91(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3ab60399c0c5d7fcb5df594c7d0f5a7567adeb9c7ef8079275bad5ea3836b8e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCompanyName]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__218c0c34ff7eb1ce6003273ee81f312e33b322639387b41713c41edbdb77505b(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7dc90a4e336db3e4be3bcb85d17aa7cb2aefd311afa2c478eac3816d5ca85086(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__590973afb3e99808a834b8f756828cb1945e2048d69e9c2e362bfffdef0ae4f3(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33924102ba05d6bdfcada4a16ec8f6c3aaa24b28dd7f236e11c320d91870b171(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7eb18fafccb953eb62f91d68bb31134a56a085ae986a6f70153c59610b2ad21f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98fb2f7db18ea1240671daf0eeabf8aa8b0746772092f8ade4b0795170c00562(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87b9ae7f9dd9a8ce82f7b92d35f2c5f5d399fef932931d2772b91d5341dee488(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62643ca6ef50494881bf63b2d6aae0991f3d3d54944d1dc1158ea71ab7070b7d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__919921f5e93de5c7fb771e571bb75cd5a55558917e108e8586af52158542e9dd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a497ce01910ad1f0a9447d5788cfcb88d9e3112798507c473e21775feb08914f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3cada4e2451a49bf04be4527012ea0f866cba0bdf74dc08eee49a636e6f6ad20(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__437ec4c383e5120424bd9d3e7723d7fd370ef07f4ca632795b8d108eb64ea4b5(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3aa164ee06b93830a69ef0dbc2015f19fc457e6205ea67936a8ed26ee1f0c183(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__156ddfe338229790cd2de91ce2e8761b6e606457e17010fdb1f2ba0f0dc1f058(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba5d77b634a8f304b1cb0f8b1aeac469ae1ceb895724d1920033ac55fc9e4424(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6198872d30c7985bbcf3598e9680228d96f833f400b9a4b0ab43ab27e06595e3(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7ce714f6e9e473b5bd94fc044f32589fc1c3579b0d05e18775698acbb4b9ae7(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0e4ccb7f903ff1275c3d539c678a63db1a6bdc62afb8a04dace437e62025e8a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceSecurityControlId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0d566478d3ea2706369bd148eab37cc8d37cec0c314d8c3418f6f2dfad92c7b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a33c2de334800b4dbe827ab06a4c94cedd83963ef5e6ec1368b0608abc1e84c3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__205fe4a572ab30e087b1f6bc7ef9f6d4669aef592162d82572a75dfe44386dd0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__110ae8dcd0a8583383d04949312a9bfc9db40aaf6154662dee759845313e9cdc(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaComplianceSecurityControlId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b81f6f86a847d43a26f9a3cb6b89c7f2a460b536fc8216f545cad9acbf3bcf8a(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6da83c502d0f5fdee8ac025c7fb69bec05440a841b441b26186249552ed73cb8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b63240622310c6be1867f330ad68d839b93e2378ba03255dddb6edfe0b804e83(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2254482669ef6e4f1ab5367a51d62465bbf49c4c52d12019d767429fa573e6a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7151793c540628bd722e06f1220d81b92f33d4172803c6957f893aea80df9e3c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a3e07c555a546feb46525a2ecebf735c6388b427c4be75ae4a1b3e52f4440913(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1135c66b342d04abcfd8b50b44f88b19e1c351607f5851221bbd5fa0b9573cd6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaComplianceStatus]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df7874e967b5d67da42e57455f87c3c53a71844c19d32c1a6af0773866ca0b07(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f05ce6474f9926c20099faf630aa4abee4d909e864e1cd5c2bd8673f603e56a2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21d5288e8df0e8d586594540bebb506ae3126f39fd46957c9b57b88570b3edaf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d4567b026aca47d390ec4ae9ed127854fcec99530ee53fc53c6cc8d2b635d0e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaComplianceStatus]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ef1c6a386fc50d5bf1afed1d00c56f47e142ee85f96d79502459535a1b9449a(
    *,
    eq: typing.Optional[jsii.Number] = None,
    gt: typing.Optional[jsii.Number] = None,
    gte: typing.Optional[jsii.Number] = None,
    lt: typing.Optional[jsii.Number] = None,
    lte: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eeb32c4c393eb3a7c84cf877047f4a1143d124243b2cbaa5388bc5c4b38aeaa0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12a8180cc0a38debd833d07523fbb7dadf1cbfafaeb97ebdd8574276cfbbee3e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__374195fc2a7491ef6efb3b9a6fde2dd0911a7a660fcff40ffa4594aaf4d968e0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a3621d241b7da12fa48d20a64fa9c5ac66562e112fc7bad906e0f1ffa6038d2(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0c64827800acdefe9b2e41a424a323a48a536a1056451b6f47ce3442d6861a7(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cbd38179e4d518c0cdaf2bca4347150e5b7bad8a7a47eb56b3d892eb96605b25(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaConfidence]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e2194239918345725279c133c4bd58d8015ee50007ff4d9911c3d50f5d69b41(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2af5645f0d2535479f14ac1540349ac0ceb6ecc80c2358ef29190512ad4f0c58(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a80a7a8785450156f6ac356e2ed44473708803de7c4d03e0fa665bd5611b7e21(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c0fe5bfa636678e14406ec2cd8da979d6694e87cab8ef7059df3ca7cb8bffeb(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c728a1a52d4f4504aa114ecafd7bd145aa1de91eeed1a109eb8b0878e83a4d03(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb4a08f897603707fe69d26d8edde9c90280af7175b1f1141b6c028ed2e35219(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bebe24b10a9169379ae9f68e99edad326e240e13f12bad2a619e2f45fdea5fb2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaConfidence]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e507c9c9503ce48e9f8a6258d758185920f3126c536fe525a776e0111501980f(
    *,
    date_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaCreatedAtDateRange, typing.Dict[builtins.str, typing.Any]]]]] = None,
    end: typing.Optional[builtins.str] = None,
    start: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__083c6a7303e3fb3b01209d4914805e74b77709206d48d5e70e15b98c2430db21(
    *,
    unit: builtins.str,
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb0fc5b8251a18dd3f734b84ce93d7aebc1b7e8fc95601cc270d5de2e5415e88(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f93759e96b1bbf03bdca4169e63299fa2d845f2f084ee2f4c6c492437422801f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f975ac6c2fa76c02df7c8ea33b72448df137644104a5b14709e1cb28c9cd36f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__95565e45d2d9dac06618f35bccbbcf13a3087215b541ac6fecc738222df98509(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2def93cfeb526caac22479eed8eabdb6ba7d0f5cf5c2c79bb16b67f1eead56e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__66e479f67bf94af0d699416d038e58f308749436400682185674d35f9c0f8084(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCreatedAtDateRange]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed7bdfebd22f21de1acb3ae448e0fd32b6801a60c31f211035ea4158d91e059e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4eeb8e8aa8f916502bd060750a09cffd9e26c43d10cc65110fff5f0b0400df5a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b55f02f43325ed5635c553ff04e7acc7da0dd67dee91b59be4c8255f573e4262(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__104c9db5b52a9b08d8dc7a646eed207025290621faeae9fd6fffff21acddbecd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCreatedAtDateRange]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2114b27a251f5a35b9648bbdee7ed559603abd9249e4bc3bf2dc78db7ccb75ff(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__565f52c9cfcc8b1d95207cb057db12303f680b42000bc69b3c39df530034a68a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d8de726fa5291a129bf8275d766a98742b01773fcdb761d9eac30687e754474(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d97bcedf94004069f50995f97c0d96f1058505af7a8e3821d2bca1ffa1b32fb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e05e92ef0f892e0f71ec07c97d7022a2fe5fcef92f29ab81d1c0793f5c553376(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8c9c9fc9076f463c87b01558dc6f617b00f28e76ce42735c9a8f2d62aaad099(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCreatedAt]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b3a43ac36d2969647252a1e556d66f4b80f6774107537905bed3ee2710bce3f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__95a524ff423f8657a266163783f0bebd349636dbafa482d31aab514be84eb101(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaCreatedAtDateRange, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a60bc1fdc663b6e6562205fd59df757f821b3bbf541e52b00cc83614f5d9e3a6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b17ebaf99fe6ea7a91a37a1875e50e0030fa4bcb6bf51a3426aacfa46824f857(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__879f6e2d0121fef8d9a1b464bb9460428a6ef32d9efad3f2086f1643239a3574(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCreatedAt]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d52819d41a14342a9a17a261b06fd6e0bee9c4e7207accf2ff56fa6e357fb131(
    *,
    eq: typing.Optional[jsii.Number] = None,
    gt: typing.Optional[jsii.Number] = None,
    gte: typing.Optional[jsii.Number] = None,
    lt: typing.Optional[jsii.Number] = None,
    lte: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49a47cc2094c4059cd15f0c7e99adc9d7f1167bb789d714301e4a7ff8471c8da(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8a42c159d3c5b059021f4231841d861845983a43abe060bc4bdd53f329436c4(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf7e3832146b41aa90a639870d114e0932d08b19524331ea5dc701435c456963(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ac96b2388c1033b1581a3c6aa4fab642e70331023e6d35d99bffc6269e6a4eb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01432da8a8ea741dfd3d3d9718233e90c7d9f480b1d128a39476c6540e37babd(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b34d8eaabb364feba2d9380b9956e69e0d642137e6a589a63d8ca11375a6aa1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaCriticality]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0df0ca682c5f29be0bfa36d48cdb35224113b58ad895b8fcdb1a02bd839eec7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3dda5d5d758eaa695eb04ca211229bf62b5f69be90ba452a2c1c88357ed88884(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e87a61c6c06224dbe5b543f6be554b8d7b7d1f4c4bfc67a014c9a34277c763c9(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ecfae0ca5a8475111e0cd45d0e3f3c85e01ac87be9a2fb825b58ac30c7af5ced(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f176a7e1c75796677155d33074215e07b80abccbaeef63263e24d45cc5a8ea6(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3c8941508313c13d8a9b409a0371b360204522cfdbfa82b6d72ddfb84d0cc3e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2248ad30e307ba5b314445f01983e652430b7debf75dd557f23cc5a49d9d9ac(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaCriticality]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e4dd77a13b20c89503e30ab32025f7f77315877429b152d9d4f84ea7e374c6bd(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__773e190cc356ac8bd4f896da8de1ac41ff0f697bfbe77917f5c499803948adf6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6238be16076a43cff96efec0aee05cd56fe1e773d266e010fc179a918f3868ee(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be80784914db368798dc65716c04d8d504f61191173bf8dbb2c16bd9875ae4c2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__26d9e233131ad7310344752a1b944cd6f0f630f749d9f1130f8f1aed0f78cb4d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd6ec4b1aab92c7936a27d4e672edb0a6145980f07a31297847722229e98d45a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d668366c81ffe695801294687b87c5c5347165e2d1241142dd20d56810cf3a1d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaDescription]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__961eb8bee346d5fc48e233f6ba332b7797f620ae9af52da650489d63342e3300(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae2f4fc7d26b12bd320402bc5b834e4569e18bb7c88530d31418dc4041a4f779(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27afa9df3cded8950ad545c64b40da77971fb055f448fc6e33085414c32234a0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__084a8ceb5ca0d1edd58198aecb53a341645c1fd815178b81806c082753b624da(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaDescription]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eecf3c552c58e6dab9cfa94355f0e6e0c49d54cd3c17b989dda3f1271dbcc485(
    *,
    date_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange, typing.Dict[builtins.str, typing.Any]]]]] = None,
    end: typing.Optional[builtins.str] = None,
    start: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59d861baa5e200b3bbb9209498bb53355aa933a61066e87bacedff50d767727c(
    *,
    unit: builtins.str,
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__895bb094c06c6fbc56ad6c2e916f76f272dc2a4213d1ed63f492dbc190e6cba0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f0e2cefa2088581a1830f06a220cabc5ed40f74b356b123e1e9141337be8973(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce14f58567c26be68c199f96a06e74caf066f269161774ca9fd98f8f51952b6c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d70e4b0dabf1737f9654669a2afc49d3b3a76f147c4aabfd184dfa70e7b2286(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5a75854e3a6c4bc16e17066744a11367664c88d8a976411a20e8701404926c8(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0bb02df158b179f8c2dcb209a38cc083ae4d91ca852d69d860526abf08281b2e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b7510e9e554dd18ce3c23fd66f51ffe320f3ed05ea4d87757ef2428fd868b31(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d3a7c3894b35398464dbab8409a5f6f258ef5798362658a9b7f9f0389530870(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__220a704972cba1f62e7a950c4cdf4884d8db30c71bdf91cf75048257e823f787(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37833d5a9bade6f2dc7b81e7a8a129238614962cf0d1d22eae7aa0fa465ad8d8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5203dce4d22e934f934790852c8ec02768c3ab6f8c8bb8105b515a76808167b3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ddc4e4206cba45acec3327f1b2e245b393d0d0a7b06d78e171c25a5bf9d72fd2(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__714a035a58d34130ef00e534dada23b69b8cf9de93031f2d26e066dc956b4e07(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bcaa37d50e90f5a989060f69d5288b407c31427360e8259c6db91d50c2e624dc(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a775a27d8182d4de5958922a825e79400e8589f4cf3d30bc9d8d608cefb0214(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a8a7e739bb839c1737a9fec7e9abb7fab4be64aef5ff8ac317080139e7fed97a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaFirstObservedAt]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7da9978353672bc690181d45f991fae709117268e42cb1b0aed45caf8e0f2a3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e48000207db9e747589c97e3d5afb80d8144b8bb787672918294af6fe62f438(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaFirstObservedAtDateRange, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0e52c7b102d1bff368e0db13e66da1a7a886a4a358ad343af436dd711569af0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18dc7be70be886052c9ae9c02f4f31164eeaf06cdb78116bbd4fc94df6c818b1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75b1fd59dbcfbc22f66a2e805aa138a418b51399aa3c526ea627a0e44c7e1e17(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaFirstObservedAt]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06672acca54e1c449926e779f2d438f05ed17464c99d70e0ecd2d9d22bbc92b4(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2deb123d6a85ce7608f5626c651541a9111fdbecfac50861de90bca3ee75eb7f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72b4b3c53da0bcb1fc7c1edde67b2a051b1ca524eb19d276264c3c5ad5438306(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a6abbf6b5c4996b580ecc591892ded934d3714b8ddd729c5fb3117c4b979cd5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a592ec4c0e9a1cfcc119098e0e017057f40adc3bcadb320ae21762be325c1403(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b8d61702c90ac5a291d2a93de511d99fe2ba15820ff657a202f8da49bdb9a27(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e79fcd0249d6ad976acd9ffe7d4bb067602aef4caee3eb33b1329df784097d31(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaGeneratorId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8eabca1cdc516329efe14f89ec624c65de0427743e51128ba0156a30950361d1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d774af4e3384e7336bef163a3474c14cb79723b9b17b62c5ab6f5e3162cf44f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e442ddaacef4e0a3c7d59e43eea85bcf590f0115ee0fbcaedb954521adea4b4d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f32fd3f8cad638208187b0c4cff2bc2f548e3fa24f8e6bb1e1246bf7508adadf(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaGeneratorId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d550c87fee9662fe7dfd3d066c0b4f4ea45663933780c7f8e46d271449ab64b(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__232b0de31fd7f9c0d9a451f584f3cd71d7958bc55bc725ddc0bf72fd252790f9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__71a9a86bd51f7474817239d550d8ef0942fbcf19dea2c302fc509bcb82642900(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__496c6ea4d3b1209a667086dd709f939a66c1020dc7582922d8f5b105ba7f08de(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1aaf256db81a8bcbb326f851b0238bc166e4c3970e4563fc55755993face07d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62b8c668e15581133cd8459504fc07de8b3166814d9ca3eb5230dbbd32d44fb5(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__910be3b8b601df69dd11ee56faabcb4387c09989e02fbfe878ff3d61f8a8116b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44c5a0605cf1f011c510a4ae2ba8f100fe0c3d4950c60e1375e86f7d91758044(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81d7c4b7c2f2f4e1fcfc69ff9057106888924b0dca1088924a0e2fa29890e157(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72c18d70012997da93019b1c18a7bd1a272769db2066402d7b11d39e3550b8ab(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa9f53080d833a893971c8cb230da7c5684ff2e6a1f3e0bcb28ba7f8f936b8ed(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84e9d72f9ba566002d3cc3d9f0fe9d664f118d4e73da76e408f3438b9a7c1af8(
    *,
    date_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaLastObservedAtDateRange, typing.Dict[builtins.str, typing.Any]]]]] = None,
    end: typing.Optional[builtins.str] = None,
    start: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba8f158ffd9c33466e6173851a626dcf7b63b341e7f70b63e0d088b22e62aacb(
    *,
    unit: builtins.str,
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ade4a715f9be3873b8810146d4c56e2c0c1a5eee7aabe1d96caf519a948172f1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__872271780933039375eb5d01a7abb5d986c2b8e71d45823922755be8120ff04b(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d97e45817c61cd637c0be41c70f8c75f22f43b38b2ab482b00f7054dbf734dea(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5deca6d9b1ed9504c28e58ec995d631028bbd2e6b28c81dd0e10bebf2dbbe2c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29ffb4af97d6d762bd456d3b999dab76fccebb4b1bf00dbf581c076a5167863e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__539521a13072f781fc21e632ba345e0e7b77b2d0904fab5acd8ad9cf1421e253(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaLastObservedAtDateRange]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ffab9e555210dd198e3104741a11e211b2cb0d83a05b0862a95bc2403cdbddfb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a691b4942b28844a2540d0992372ebbbeae0f9a29d6799146466acc09dc4173(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43c045959047510c0cc0c5b138ce82a79449db3d54cb8960314bb331862e8bb8(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43571997ab03ba951eeb294959e4f60fb9198af255f29cdc9356d751a8e31f8b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaLastObservedAtDateRange]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd937489fd953ddef38c04d83800c454803a75550a224e4590143216bf866d11(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf8cb8abe6cb2137ef36add4384432ccfcc3fe465581d8a58d33650efce45623(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2aacbf2ab31aba0fb472d61e7be077135497ec2f26878b94bb500583f08b4fb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59de6b4c6b66b64ac2534a2341bf28c2dccb85b5c347b3c1c0da8b3f4da6b0b3(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f1e1c9241d3232503f2b60270eb5d133851f6d912d597b52c2263b01263209a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__50372a99a8be9613251543f61f292094d8a0cc74e1c325ab7ae9abd72a4f32f0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaLastObservedAt]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__865709ffb7f1cffb0d861d5ec3aa55018b405af77c918a1df50814cfdd1db937(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b811b6157f0a8952debbeb23fb51dcd42dfb53ee785676a9043a463318f888b(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaLastObservedAtDateRange, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40af026fae839f033704ce38eb3503cdaac571bc88eca76798c98893a76891e4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__693dc658fee4b3f7f79b99680dcc58c21e9cd8cbaa2b23603c68d40d67cecf3b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e4d98f3d2e53758bfee52f6933077e3fd7b59a67773498fb0b59b3799084787(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaLastObservedAt]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0477c1fb078162f3ade0a4d3948d1e255221b4c01b5b8d428120b7747d692210(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3027cf25d4c6c502896aa88b8fcdf9a32a31ffe508974ca439c46f5b26da4be7(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca3d782c19a1287d84402d1e950a9fc6c739a99feaca341a8925ca04e69c7347(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f2a7d5bc80f7dc773ab093ac87f42072a5d88607084b5a9937cd67b102a6265(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b359680d5568eaacc62c35725237e2e308c85861ee5b41ebbaf0cf6cc86735e8(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6661896328db72dd2c1e0f2827eb2b668a6dfb3160526ccd0015e6c7dbb472ad(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteria]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aaa67a7df4487e80581ca5a0eaa7df2a40eef47ef08c3dbb5e8afe436f4317f4(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29a464297d13295e6c8a5e7a3b6321793ebab907aef377e9d00ec3c82cf859c7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59dc26298248a69f12c277632ad9bb390acfecea78502936f7c035b2d5153f1e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c0f61d536e5a7117ef7cc24c3f215713f0cc6c941ccb96f9c7065f178fa69c7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37fad9c0e3c27757b70d49add2a1caa81ddaf21dda610efde3f83d893e03f3e7(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cec4ffc9096d6af9880d452240349609252ed90888da0b4169fcf33c69bd0921(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce67d116646a5558cc127d0b01c9249acdc387d6aae190c1322f65069bb5b38f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteText]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__333b01b0e257c33fdd38501706d008c91dbb75484152282ce306fdcb50ae966c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2860b7f9471b07916eb57756aea254262e643be704c02431d7c3d71934870133(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2cfd8e9982160cb2530ab5ac9e4d30181493fc6acd40ad5b61c5b614c8d585aa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0511b61ffe0e4fd09a58b3ee0f48430c533e316f9756665142fd5862e8959a6d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteText]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e10ffcdee2e92e032b604cd4f967903e0332966aac687798f259c6fee998911(
    *,
    date_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange, typing.Dict[builtins.str, typing.Any]]]]] = None,
    end: typing.Optional[builtins.str] = None,
    start: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9acfd9b2a242344d77d85454bab76669b8a086456ffd7ee120455d7674cad43f(
    *,
    unit: builtins.str,
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__925437ac338aa1959724986fcea07856547f9e342226be0ddfa2286f19f9bad4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82c6390e87ec30b03bc2b2622392d32e50fc73ffa4d51ae4130288495afef125(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__766767525e69449574a51c0d82ea9f4c8f0ce60e513cc1ae63eff66480208287(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0a585e194cf37c6da5b8d4761aec5abc65da8e32e7ee68ba3f3c7aebcf468a9(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1408421fdbc6c42078a52e606749c3d702990dc157ccfac9aef6db0800ffa97a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1552b801e74c784f826aad7a5de35dbd4da07c809ec8054fcd6ac1018ffa565b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d22d2e5465fe8a689f98f0898ffce4018c3339391eb24658d19412a4be2d869(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f2f2c3a0e9d2c94b8838f3422be3870eb0acdf0714554244978c1e5279d83880(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b41b3d383b8ab21d359822c49dedaf40ac56fb5714f561b7fe4a550788b061a4(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a797665abd62bb54607d8d1378305381f26ca0f9b21c9428bb9fc4712ca6734a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61c700ae5e98e554ab91af38395aadb0d8bb4db3ae72c932a681249d41da9034(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5e9d14a3de0b16b41ffacb4a05d27c20015b3faa9350244c6de6a0d74bee99e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b02f508fba3f793402c9f32fd621beeee15be96eab8e436efefe9f66a11b5320(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8fb2dde096565cd5201377ed5335452b400e652c4cd82d488c9adf0be158063d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a6250fb7fefc3578776d6826a3f706ad007a5555d73a384edfbca2e26ef6db8(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__661581d055c7b3eb320c68857e5934ab3cce0b653e5523fc9bbf35333cfe0553(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedAt]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__781189d3dbfec16a375971948a74e26ea869831a23b0c16321b645000432c6bd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e6d2b4dab5220211d023d64c0856fedb39e8b85ab420bbfd072691011458539(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaNoteUpdatedAtDateRange, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9cd37756065634f23b046b43d57a2ba60e6e91bd3ad1817d4b2cf4a19ea4431f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4277d5e3cb240470801b0ab060860b56a40f8ffe47b670d228918ebff591622(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7bfe21102d557969880cb66e41bc7b479c5f453241ebed3bd275a0bcfbfa587(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteUpdatedAt]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2af252a2958cc15fdb4781524c3daf18c72f0b0269031170a9b3166fe15ee964(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2bb3d8e3e140c6ea3d9d668b48930b37d82fc57492960ee45ee5fe04488816aa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7fb94cc1784a46b383db8cc6a97ecb7e5c0d152ae3d6699330de2200f6c99624(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d904922b3b079a5fceccbb444200faa6169ad577f8a1ab3eeab9675d20ae9f15(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c396907a996f913fba148703b0fc435f73570999b1d743af53923eb639c25f8(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2414d08a0279fed2b46c697500f97f81e825854af81ecf1873fc5696a40992ef(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4eb0e5133ba553b38da6ac6a3d4ad028a0f675eb8f8b9a5e8e9d25959921d4d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaNoteUpdatedBy]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6b006bcc617b39514e6f247382611270063dddc311445f4f1b0384095d843d7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10cb8b76c81ac369a668c41479eb3a8bd5e4ccd2cff95becc2379f4bac151dc7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1797dbe3985431728c3e0fa0031f60172139385940a5cd783e3f7026def50166(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9bad6b003c828a381916a9ecf7beaab0f0da7705dc865466c7857c56beb2b908(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaNoteUpdatedBy]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2345885fd2c620e386dd0cff11c7254907675178d18b89531b8f277a19f9b6fa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd973ee5ea34f441e6a49ad0571fa33da61cf09f06a22dda1d03257483c8524e(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaAwsAccountId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f316308b67e8927882ba1b2b4917faab52afc2a53d9ef2fb08d853dfeb149d39(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaAwsAccountName, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c0fb497e7672fcbd83b124483e2dcc9c6b73564f01b4612e4d4359247a41cf5(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaCompanyName, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dec26dcdda068aed575a3a4dc4e00b3ad5404108b3ff29c746725d51fcf45ed0(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6599f5a61798474398351ac20f52aa3fa796f36ee06533f192a6b70d24be389f(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaComplianceSecurityControlId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a00e033d558c9b703f17fc6d0dfe950c31bb1211893ecaca09d64278c9ffff7(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaComplianceStatus, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21e4380a1a803f37f3b3645a4a857702ca960905145f87bcddd9e7a63cf9aefe(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaConfidence, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8bf2f966eacc45ad184c248982905b35e0797bd58f13e60b15d928dcf33ce9d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaCreatedAt, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__543da7597c14948a04b242028490cb7be5b61dd1b5fd0d6ce666553db0000087(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaCriticality, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e3a6d930d81f62fa93c08b09a24baf19768531dd45c56b4d795af3f893899ce(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaDescription, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7300902e67b399caa4d3d8f2766f3d653d53197f1f13f2917d44e994294818be(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaFirstObservedAt, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a37afe0c736f128d309cd8307c8e5f02632888b37eb052c53c351ae71f7bc255(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaGeneratorId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1f8ee04eb80f9d08c31d6548c685c356554f96744ba69207138a01d00173e2d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ceeac2713e13cdb72b9f95d8d0c2629725501ef7eb17ec36fefb9cdd2a87fc39(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaLastObservedAt, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b47eb7b3e6fd7f5d836cb5b81ea199f700189642c715effab30842430fe16644(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaNoteText, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35a549721a872c42f2ca568c05d76733bb58400ac40a2f8988640c602ae4a149(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaNoteUpdatedAt, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84650c3ff88a4c0f54bdf22bde34cfaf038ad22eb0def39a36fbe0fb2846ca68(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaNoteUpdatedBy, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5927c0f4c085bd1830d1a010a313e7493e7f37e87a07ec8bcd5ad65643e7eaba(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaProductArn, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a715834bc9697df613d1387b78523c404a0d3c2ac06ee4152b9f2552c12c6097(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaProductName, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cafae63953b22f467561d9553f463829d4d80c2501e60de63ea5e5f3ca40b554(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaRecordState, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__552b5b124f6353bd45903f2eec82de59a98a1da798ec8d046563cfa7d27bc334(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaRelatedFindingsId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae48df8f9a2b11a33425c5172ea814b2b71510ba8307244101792867f4d453cc(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9600229d59aa05c3d5a2b3bfe77aef7cb0d1ae4071779a2f70351759a603014(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceApplicationArn, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5673d8a1eac0cc86eecaf75e2e643e7900a3fc1cf2b77a76de57379193ab63e0(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceApplicationName, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b291397f0b69e36e49276d3f065e2d8ccc7319495a3b242437f91ab08f037d3(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceDetailsOther, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__687ec7708e6958d0bed06eecb1256393f57a778f7058dde7465e1601a440d7f5(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceId, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7e1e8137a4619d0cfe065c5f360320ff28c46ad6d274216bb4853ba5b0f76ed(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourcePartition, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff00e4fc548a99d77ae208e639b893e232d3ec47a351cc8a758cf2f273684c07(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceRegion, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae173d64335b6893d54933676b9afbde44a06226d000b9ed8506de6291f7a22c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceTags, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa289d9c4ab1aa4d42e5c82704f37b04e604aa563354c33328b9bc7e9c977daa(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaResourceType, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40365a09d79f42e5fe9033db59a2d07a1d6a224d503d30799d08b7deca515ef1(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaSeverityLabel, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b44d3de8b1482a3d38d3977c84b6fcdd9c029584f8decc8ac0c2285147e03a1(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaSourceUrl, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__139222cbf4285ef66911202e996f57ef575bb41d6bff06e7545006f7e3ab554c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaTitle, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__782d396c9cb6eff1193f9e10d4c960aff53197330d344d7fc1a9be0567730881(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaType, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6b168e10402c64d8eae1382ebdaed6755a97f853725c15bbef50c7c5d245b8c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaUpdatedAt, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab28e62254bb74cecddc5c85940ef0b0c5d5876ba566fbcf28dbb21697afbb78(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaUserDefinedFields, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37451ad70cf70464f8438bb78b57909111d04fd97d314a6c788a7017513d0931(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaVerificationState, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__de81abf78927dd8ea1f1a8b6b9db2305530ac92861b188de99c362e457e5072d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaWorkflowStatus, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3cc9b62c0bfacd2f3729bb67db6be083782b9fba5026ae12d01af28bf9f54c17(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteria]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e170eddbd3496959319dbbe8f114ed8c9b4e6c2508060d47b9bb7cf4d5809a5(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e12b7a5e1b37beaa4aa499b3c5262c3ac45b53be6aedf02372b403ba1c45b4af(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09c5283e8bf9a79bbbdb8c2f8f2865371126b1be9a0e6fbb51432e796320479a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__777ee6212a608602cd6c80e9f27dff219860fd485d6512d4fa00fc6aa76e5063(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d8de0fc940cd063463cf55ccedf3c25fc31c735ecc3f3d8cf8ce728dca89f91(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5df178f0a6d3301fa5e1b9bbee2cb48b4d75eafef48e09464923cb4d27bd80b0(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4582af8f84f6497b6fabf28a4e720c68a088ebd8dc28f873483ccf428a5d0278(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaProductArn]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e31384feacbff6882c7cad9c7ecb0f75efc41b2791eb476c9b2c413fbe237f7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c8825bb5e7947c4003b296fe85e111519840a1002b0cf417ccb1dea1175c7340(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8e4a881435f07d91305a9e8e81add05e2167d1b5b87aa0b32e0d4af8b1e1836(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b9ed8f5b53d60e091a89cac981df1ee7edd646e971b2792e0421e03ac35f776(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaProductArn]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__589a9fc0f7984a8b566744c0397057b94e2d5decf7a45ad34ce1ebd479f76a77(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c174f09739d6cef62c0741a52b310121625c11b59534a89778728f36fb77937(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5b22c0df47dc1d9b9b19b9978e8e4294de4db2c3b9c71848b50f354667bfcde(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__600bf910b0391523dbca6ca668dc61b49e0492e4d26ebaaf6ffde89e4f1a058e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6f887b222af9b043436dde620e4c11e0777a7414491621374de90155f0cee25(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f844e0676e67b73ccfca62e4ce75b272c6d6a7694894bb5ace36f7d3c20296d4(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__834cd35d7c76fccc898b78bca83e00a3f21b866a4f9e4497c3c17807739e357a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaProductName]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ac2d7106a0cf46ec9bcdbc9f86e1e049cf270fb284d4352938f2d0545cf92de(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05151f52304d28416a5a225b10147cec2798bd995ae0935690b8900e3eb1e7f6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2436d0b3c326b7f29d397f48f3e53f6bb4c41f5fd46d376fee5c7edaa4b7ba4a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af552fde4ec08f0355d312ac0310b5d75dcc074b36ab2655342e6133c5c0bab2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaProductName]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f68cbf2cff2ed6de2bf807912ff1c07c84ac2196e2eaf4d1b9c260511da051d(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2733982aaa05263082574ee1c8c3ae87bb38d0a1d0649b89289b806e64ec591(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f28f52a70f7dddd506d0a49949a69b04d8ce8b3bcc0ecea3c9a5390bfcaab2e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba488fc1b03acfcabcb0643d7a586b0881804f4ab4c904f1822fa53c58d90671(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ceb443f57008dbc0197d0c949eff1bd6c0f884a399193089db92dc325f36c7f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e521118918dd2fa8079e8c80548575f3915aa16b6418c1fff36364d4d340eb79(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ebf23d75c90ab40c5ae5d56bfd6a278de0b15c352311dd160545dffcffb1775(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaRecordState]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81b6e73c9a1f2ed90a1b0242f070e893851bbccf38a51673cf5afac0035ecb5d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c9e8c7c923ff1f31f503fcd98b212445cd7952b62cf2949907418a597f25b65(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4404b30fd2c435fd5424f0c10ee38c790d371a839edc385fa30fe9053224979(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__10c6ce9687e996386b6d9177aa80bdac355f2a119c47e7271272e342ccdc71c7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaRecordState]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__58855d2c3e67e4cb034c8a4bbc29d6aaf1e10257d122ced653d1f4211e421f55(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7da8d94bf1c1b12bf86630ab2a1776676591195c93301171c301b00af307ec6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0fb7e383cbc2815a08e38a35611d5f4b26c8edf285894c8b0a3192478b45cba(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__69ec28a28e8bf8505f65273b565604246fcbcb5afc1b32f937ea060ead2bf6da(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90e1f1a0383e03c8bbfebae3e0606f9b5ef113b486021ed39cd8356de18fb855(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b48143f598b17584283158818350ed0248b0af37b9aa721545b82e2fef1d777(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebe2fa1248136c7714db8f566ebabed7cf9fe8db0c0ec5c38355761d8e7f10e7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaRelatedFindingsId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7d6a2c99762e58d6398e3743fdbdaf57319b2c901396fbfa0efeaa4cb069957(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf1766e8f98b885c14daa1bc1b641fbd788dea8e93a516a8f26f5c4b58d51598(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6415a0f1492b7781803c1db70ab113d2a040863bcbf5592bb6894df3d386c368(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__847ce1e3c547033b31c3c1cd41194a039cc4fe8adceba594d2a6267d500152c4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaRelatedFindingsId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62f868de08955f44d390a7313d57f81abc145f026b4fbd31601121321bc78455(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76b940ebb2962bf6b7f6c5321e326462ce3746b792fb78a85ba501a4ceaf72d1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae08da2ca4048da1af3b289ef2809676446393bbd5cbcf1a40c37a66801f50b1(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e52e2df43b3ccd5a559fff4f7297f109e5d209f1c81e30058c54eca60603fe6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__445485cca28f96832e65d5725cca7175c339127af41f1e0017da5257debc15f9(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5737f5e065b175b0888bf4e3bd687dff7b9772ac700ba59f162cc2e312d93e00(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c1615b40ed9c0ef3caeb6e3841545cb32b9df0156bc47971e38d5a3914b5151(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc6fed7fdfa657530379ab7b9642ba30a4ed41adf94c73e43ee05796817f717a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4867f41b7fa1cad2cf39f3ce40d93167c248fb713aa1ac162fc74b3e75a69f1a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7f79906d388f62d40b5abe940bec82da260869ed715fad91cf0376377830242(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56d7c2d22c031e0f304900bbb36024760ce33e974db0ad58e50339a945038500(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7332bf0ad50385f5b20e5ff3a8c7d47e48fe8a2e22f3b8df44ac3bbf04724acd(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__258daf697a35b1a56436f0d31da360845ccc8eb0d7621a1da07ccf59f25abb17(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e237de5add583b6315f7d3111d88232a40bf013d0110960ffdc5f5743d0e3ee9(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__36b1b32029d4728e8b5f27b769003675c61db2bdf0b878bdc5ec1002ecd0d151(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__266ebce64e7b4cdd47ff2ebfca653938c6f0342eca1555029e251343a4bb1595(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efe67d3abbb4ab83b11700bd156e6e6ca1cc001dadd2f1cd8e34e463cc93e0ab(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7739118050a473e2766678afea1fb08e29186008773028493f10f58d9bebdfa(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceApplicationArn]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__69091b258ed4f3de068ff28550a147ff72f1bb40d142f470084291aeabc8222f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1a8927cec0286ad7b40d2def0299f53dbc6e1d9f8014aab8ca5891aaf70c290(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__36b0c0857ece99032fe23e49f2927f8ede3b5b2fa5f609c2fd3bdd7f47a69291(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4278c21929e261a01947d516c69a430242693bdb38536ceb1c85f27d2e7c3011(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceApplicationArn]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18b3919bc9f4dce24c95c1392f691c2d5f4fca215bcd182e4a64b2ba7b7aca32(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f35a6cd21609d1e8c2a600b9a229a4558f8f45a533fc6bc9aca7962f24357c93(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f48377f02870b4b03ab7cf87dd5baa2b51c1ffa9349d6e9a0026701639dfdd9f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3580ea4b747afad19ce29cfa565c7f749cbd787f0611ad906e83bb49ae32e45b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__494bc7e8b49caa9bbece36a0bdaeae4e5337fb721dd520870246e413fb005e93(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e77192942531422af78db4ac4ac92c429aef50fa1f40f963e908393d44cddd7(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__958c52e950255e5c75c9f80306123bafa7af73f5be785171bda98e9293833e46(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceApplicationName]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__377c62941e123cabc1110c52f2faec5bb1375e5ff7d599ddf1f12b66f4892ea4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8e567ab03839f93d2737fd8a58f838192ed38601a89c67d2b74ec7971e4186e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4a47adf7d23b3cb14f469d9564a1ee30189c7dfb4bc616a3f52ab17542bec6b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ad6a034df2886bf0999a0df3e3b8f0ee19a87c2efcf21d1c2f8f7529bcf21585(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceApplicationName]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a53490bd8c0c93f13a9eb8d799e8bf3b2b7c07c9532a815a00de3ffdda4bd01c(
    *,
    comparison: builtins.str,
    key: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd4f6e72b8edbf683003f35d7e1ea943e9c2122f2fd91b7cc4fc822a3f610318(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5cc2a54a22111fb2b59c81b9dd5b03c4068e64c5566c6ebd06f577222719129c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7c654d0f46c0aac5d09c781f9cb360abb94b6d05bf7ca184d398723aef15a74(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40bf53c4aa437746b28e3d9cfc93187718008f71357b2a0b0bf4ab22161717d9(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f384e6646e8625458f2478a9d06448218e0b1cc100ed181c178d37c8bfc0d3d(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9332884784ec7085756ec1df1bdf3f7cb641d156c049971960d111c72f63b774(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceDetailsOther]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__592bd1e200fd36cb3df6074f627987450171c11beb3a693a79cd99b829ab3e20(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__281679ed32301de7f13796c7fe1c452b1498363ef15ed86049cfed98ada8f24c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__25ecc4a5a4427f26ddf9ed53eea0aa721f47c5e5136a9181c741370fbdf99abd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__609ed1c6af9d3e00faa293d18ef8f13ed88f8ff422c46e6b22a7f657a32aacaf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76b3fbdcbcdb4ca0bff926541980e50ca3972d479360798b438192e53ad3fd7a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceDetailsOther]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__39168008003e4026203d2d2340ff5ba247361e38fca186a6a261b7db7f69ca66(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c532758ba6b67ef4979e7e65ad39c536b4cfe624ee62a68f7473c76fffa593f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe1407417772199238a7808078e4db30c069922edcd6b73a16e80e6afd43987c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a56b3ee25c36a57f80e92952b00019bf4fe42cca120b2bd20e630565b6612db(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32f082ac1281c940d58d037cb64a84a255686d7108e4bcb9f6ed441b7a6c51c1(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6cd07b1c18a9457cfd28c11f33b470bb2ecace918b59ec188006294631b81243(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2389c219d0ca16655e3dc8f9997536647558c4d332eb52fd07edb6a267172650(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceId]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e3a205cdb2df53eae3c1be9791e2228f61331f980c2376bfb5a2f27ebdf9835(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4049e960f82fd0ab642b0a0f2ac55a9101a2d0b39d4f03a14b35a367a4356c9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__26328cbfe7123fe380b5a89e70730472ac275a1dd2fa905f8a3e03ab97b7df23(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__226e0b874b49115180d2ccb385c2374745194567bf879b6f4f4a113b6858ee2e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceId]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__36f8b3909293cedbda5f570f25e41a2aa5cc7898afda599f9f016eba8334ba9c(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__105b8d1f383924bacf3d1873ae8251bfe61fadc9f2ba11ca36e3c244cc34eb70(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b3f0aadfa5e9e42e5728d329e944c37dc021fc6d86174c86f141f5c98dcf1da(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__13c2a88508034e42f345eadf848998a11ab0685b92b1afa5f931047aa38826d8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c76cd1592e042812199845e40fb620717f0c403e4ce2b6b911703fb12a2c478c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90d3d97b0e7481195d38aa4de52695b9d2aaa7b34e06278ef80c7dce301535c6(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e4fb6420bae7b2af4aa6cfa8e57c016cb5b751be2acfd9366f9980cb387ac626(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourcePartition]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b03e88ab4c784fac61a1ab26090d2c0c21ee52aafa8d7636f6f33222832ae199(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01294db530f026ae26b61c1d1cc31494a5b5a0b135f0fdd8229599f83fcec032(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__062f22f2d4754197ee09b76da71096303a61f6f6b945f0942a7d0ef0e4aee274(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73fc9c486659a0b289134db6e282be0cdc4227883797901c7d00e1fef14ed9f7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourcePartition]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78285c031ffb5409787d356f48fc2c875d7ea3afadb1ae595e921db7c4abb2db(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7069edcc77d48937e772de757f173b990c825211b2806a5faf82c2553b2acd66(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40a77a228c9c1a32720540976459cc0d88e7a50bc81588eb529e05c272a4891c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76c2b63fe73bba867f8fd454df41340288b1eb51df902452466f5b504deefa8b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bbfb749b71da064cd6824e33054ba698a3728490fc6979ca6c826897f346a2bb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db849c711a236a31a780ae042452f8ea92e81b06ca05705f9a21a6196a64464e(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9cda28eaa6bed630710d93ee17b1b250b4cfe2aa1349df8cc8592cad4b885cc3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceRegion]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2026ac207081b981c3d1ba2bf3187ab9a9027b924c45301f40dc1f6e9399036f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc061282d2eb845c033c1a071c6e0f1ad70c2a0e2169ccccd2f6e4cc88d62df3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e74c3f3df4cba8c765b0b9a1687e6decd5a2e41d7d561736fc1db8fed8d0139(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__de2e14703153060eb09ec75e147c2dd94ac47aedcc7dfe00ee736bf5d59d20e6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceRegion]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__244cc041bb8b8fd9f81691a5e8e1ff22ee007edc067acae2ce27f004d6a957f8(
    *,
    comparison: builtins.str,
    key: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__adef45d62c5aec5e9f1966fbe49e37bc53ff45ecc9a871bf43700593b59243d0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb693398dc36412287f69b5bf70bc47f0d7d21abab31059f7af9b980640d0197(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__895e6fc4b3f79c27c8ca62c3c3ca85aafc1309ec915c2bd56b49869ba0b65e3d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d424367c6a4c4e3e8486c80459ed7c8fb65524b2938c6acf70bafa3fa3a081cd(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__477291cfec917e12d05704fd8273a286e608d16a1b3804a0eb5303b7442c12bd(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1b821f3d101e885e3e58ee3a30eb1565ba2789eb0d56af8e14924858833e91c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceTags]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__52f72ed4035f8699eca68dee33f105d4cf2f496e767b44ef07de34307e3fedf2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__339534c0850a4e40d24dc0e539cddc0913bd4facf5fafca37a36a69b96010c68(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__604dbceaf5b500ba26e1860e1159f42b3e618f81b68040e9e3de7dd971fcdd2b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a237a8770b3e99b7015f9697bf63c7955ed003470a7a2a199ef981ba85c421e0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__66378caf9cf00bf5f49b134f218f83b0630cf3ca0b36f202fd4e1e6fc58fea77(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceTags]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0598904127b542048a8094994e6b8789d3893e7833c7e48adb175c1de05696de(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d4b1d5f87fc8d31ccbecb3417bf4b1dba8ea191b88fd75345b8718e2190b6ce(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8bbadae2bc375f41c2ae3137d582d80376bbc346602ea0c34fb157b004ad2df9(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b1724e45aa8078caff58cf63d7b92d02c89fd2f30d5cf8292ace01fcb6cb163(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75fd95d9a71be50a9ea9652d07a380fb015046e132c8497da46d11abc2297e81(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a163de975a83480853639c6eaaaa7dfe80ec04c01981a615ab2c5ba0c5371986(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba4cf50cbbd070d465516d869dad131e7b82bacfd2a30e21f1ae4767748270d1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaResourceType]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c16d27dc0f81e3bd059ffb14f2b94fc7a4cb929e565f3c76a8ef57cabb93dfa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__117c7788b0ebf1300a505f3fc83c86b6552f44316512f66552f6ec0ec3b4d110(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__662c66e38bf69c7404204dcbfbf06371647b51398cea7a80043a423dedb82da6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00b5fda3b6c25146e1309ef5e123f09e3ae16da2d0ebb1e5d8cf0061c8ea7448(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaResourceType]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90cead25014973f37f1e45019347f34ef131c59a432e449680388d0708459811(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88c8f787120ced4bfb8e76d55d79d7aded0fe75a8cff1b2a56f5a3ef73de9002(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe6f97e3ea9cde6702a4b161ea26330994782c3046aaa44139bc6fe84e6bbb4d(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8eb1ab168275cab459905afdc7361f9b6e847fba20c0a6bba1f4b028c32becd0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d74e38ba667ca1dc547b1a65c8318fe479c9b8596ba5e3a63002c83a3ff408a2(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4d39f899ee7d1c6c49a34c178634247d4f965a72e34a7d50e327b72e4f1742f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc23f0104da20e3ee66597493cdf347adb81182c0a7d5a00d5c6bc08aea93db9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaSeverityLabel]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b8383d97e37845fd499dfa918abacf5866f47dd615da50cb73648df1288f791(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb1bd65f883e9b2b2a2d4b53bfc8b0a8eb31efb1d0dc7898f51901ac73290494(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d79db3f83565351fbd2334523b9093a160f921e8182f8646b69c53b40c0ee78(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7a8c91474751e240785c99580680c00a0e91fd4ead60dd815d12ec46aab14f31(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaSeverityLabel]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1feba896025ad5db0946be279b74899bf08c5609d74c9057c580d53ffa3de32(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2ef419810b1a48694222682cb15c63549f66cb230b4270c23bce3a71bcfdc8e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1cec27e6451fdea4fb2783c476ca2a006ec797f466f40ab8f93700ffa10ea88(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9735cdc4c3fdeb31be148b2cee7736c10ba15a44c954a051d017308b94ab25f6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5fe8c1d5405a6deb7e60abc12d8196914469e2fa99dc406727a47e837aee45ce(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca79104fead8ac13ea24501cd625d9c5b3c74519635ebbfc7da85f3af4bb54f5(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e030b04dda3d6c567b73524fa8acaccc3bd250f2f23a507b1fbd2b8bb12e4f2e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaSourceUrl]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a527aff9e51a87afaad26ad7a3aba83554c1af19c93ad4e444d97bcfb8bb2bcb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__828fa8bbc03361a427724c89007762080b8e38271fbe1dbd644a127b04e64d43(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c144c9be39481267eae207dda92444a7835c9e5dcee559a3269a8593724ce50c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__580d9c0b5080b71d8f6d04d3b990f32d568ec8001afd9600d45448232bddedc3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaSourceUrl]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5040ee1d3fb3b8401061cc478e0b05a188dbdd39304363d670fac2260c34738(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__faff9cb1becdbd9d3e66116a424a3b706c5549e1affa6f2a5519182e81186683(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6fac02bffe9ea216f1b9b9beb2e37cdb565bfc51c50db5c200b5292b6362ab52(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__388179905fe3cdea18c4e210ca1da3132297754179d9ee98737e51f58c8f6123(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e1f61c4031cc1af18a34d0f1f6d34225c27322fbfa11e1452616784ec7ddb6a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4c0d5064330e89132e7e35167298ca86fe0850bfd6d3c836797fbab9904a87b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a44c02ff3ca09fc15ef8af7161dd1780bf3ed38fd2a42009a01e416f81ef872(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaTitle]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c723106d68950c645207f6ad7564c9dafd434828cf33454ad92219baf490fc3c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87b1124ba73c52457820c6b9377957e631720c2e7e2254cdd4497f8fd7f47a5d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ff9508409b175e526465abb806687bb581982908de280c3d5750cc7aff316f5c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6aa6f4d5b4dc2ec28acdb93c36586db0ca82a63075adb3e18437fc6d825c6c71(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaTitle]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99166cc0c6297a628cf5e4c1eff2c3b1f47cda768080fbcad559abff8ce87206(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__777ad190c559e6ed833ea8dc92cca915803c9aec7e469b3472503dc0f7b2f768(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__228cb0673c227fc121a8161b610e38e7c9ba6f3490959bd3736cd7b5ae6c855e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f53205813282a8d2c0bbf621676dd9daf3cca4151abb89915eb33ca1ffb9f1d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ca9247ab54f294b976a430e37b22f4b5733141a829cf102de4f98dbed3a919b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae27d0f4fea8a63707965ec641b63d38a969350e590c0a58afac443e23b88fb1(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e4583077d45439de20bf58165921489a875a4bb89f4356c9409682c03c5f210d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaType]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c760c23d6c559535a5180574385283706d4a6657def43f0f7837027a2e3e9f1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22d430ed361b4c9bb790a9ff437101bd1d16978d9006324c9829900c5b94ae2b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7ca35891af45ac19ae8a1a54c1d7c723a3589017c5bb646e30bcedb257dc4c8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2281c10077e60b3b33b0f29483925d7bb8007d8e42088843a6b860f8a875d845(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaType]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__676dd4e30a2071b9df2738b987676f9b8a1d683615b569feb78551a00260eff8(
    *,
    date_range: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaUpdatedAtDateRange, typing.Dict[builtins.str, typing.Any]]]]] = None,
    end: typing.Optional[builtins.str] = None,
    start: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0391a444203bc20fcfc5fa32739578c23cb6c4b503291dcba22b6f0353a0787(
    *,
    unit: builtins.str,
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df7a41dd0374bcde1139fa0591388f6b563fdbf036504ade5f2c2bebede3d4ba(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__728c8dcdb634e63a9f925c45a94bc8e600b0115cac7b4779b14b085500a5f2e5(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ffa39a367ed207809bc8d469cf4d047cecbe3ffb531ba9e90f77eccc315227a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f80e1851b67ecbbabd6d4f382155768c260352114fc931dcb857a5a400c05ec(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0ef69ca38634e5e061f0b7a6c56eeecdbc4abd61207d72e83b0544e546f456c(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9b45a0e36ece60533f15ea15829ed2a064b2285f6476e1b9d203ca8591943209(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUpdatedAtDateRange]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__89080735ea2a0a7f66b90da9fb02276979a18450f4907e97efdd396de100c910(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6756d44ee8ef9d2286c1a8791a9f4f36c3af7ad1939ca91773a8231d3be33d5b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2e460b99e1392bdf41a4e4ca04c0608461a18fe0aaea3d684243419f215dc8e2(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46416e43b2b0d15f1590274de9bda7e4c899a280f4edbf6c349d266081e07be7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaUpdatedAtDateRange]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6455ddd4c092b0159f8707f376c1cb9bebc1cb20ea536176564fe2b4da3f41d8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa8652c570e4655acf850c1a39274d81838b04acb277308a629a1bfbc46a6079(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__966a401d4a693620a97c939ea883fbe0c5bb59db5485f118ade5409395ce710e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32c104fad3e5aa902113701e2717620bde001b9ec5c66f5842eee946ae51cc61(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f28341b80dc63eaabd32fa08bd7f162d8ebe318dce4b10275e08f092e8bc315(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd7bfe8b01f03a99f75cf419592a3134cdc11a0ae4f64dc9afde51e8a682d80b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUpdatedAt]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a4fea8584171a4fa741f6dea45bb2d9b7a3928cb5eec14ac67e3f7e79da7acba(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2029d9a463fb53bba14a82a0ef3f6c60354da6f5298e224fa9eb3304a4d21626(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SecurityhubAutomationRuleCriteriaUpdatedAtDateRange, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7092762b70e8d108a6bc3c6f53e5eaa813cd92adc7b58d081b6bae52b56343ac(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__585e41d8ac9cebf3639488672d6071bdbab841a641865212ba317650a4b70bb9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af8fc6fd7f314383ceee0b18f1b2dbe921a637a06ba28cc8dc6589bf12299ac0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaUpdatedAt]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c5fb5302333156f979ef048fcd800f27af30c3ef1cd8a058c3077812c6b02b3c(
    *,
    comparison: builtins.str,
    key: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__89e835b5a9f79113d346c835ab7605338b627784bb927e29592adbf6d231ee8c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9d3e03ae236f1108c447331de18f881948eb031cc6bab4f42311a4bbf2fd90e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e86f3251544d193bf98bacdf6b24530137b3e63cf012e87e63e7ad463063b38e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40f452bba25a191c88c5ac92ee000f65568493d1177930527364290f466737e4(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9afe8edc553120c42aa3b71ec1df5e531a684c7d084609808f7d94a3f4f084a0(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5fe3281ae1f6dc6de60e5e8e9d6719d6b303445d8496e3564578f29b84d041c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaUserDefinedFields]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bef61edd826e1d830cd223e4c7a233fe620e6bc8f5d8e1abae77db2b5755d0f2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5aff77e37ca07d2e8a515d114fa6aacb293a5985025fac5022171b8ceaa09fd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12d5341d28c10ed26d8d4fb2a3ac48d78563bb99ce434023ee01ac66d782735e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__068e3a876f398488b12fc4abf69c5b37f07c558cccf86c6a81ffddd573a67438(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be6e1523c043db1bcc4925f2b8c5a8d3c20282f6d502064afc0287caa3dd073d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaUserDefinedFields]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f59013297323580638bde367972e2ad774a5f2e313c254c80fe9885bc4d28c13(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94c54bb3782359873af2c0734e57ad679f370b917e06f0cccf68dac5679c9eae(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd8cf00e5a4d7bb5a8eeb474a1c0879e8c8854ed6c7d64545fb82295bf3163d8(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6f863e07702b6350376791d7b5c10eadaff56b0bdc0908777cf1a6b563c3e98(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8da4c7d325ebbd72d38a0c9e8e88d7bfaeddfa3bf6107cb1dea81c5dc16711d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__035a3c85cfe76acd47a8c55274adc96cfc39b1f635c1f6cac7bdfbabe3caec49(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba54dc28d5fe209d2a643bade53d23a4c5fbe52ceff73b64e2bf43b6796a9524(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaVerificationState]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__992df009cd8a29db26d1dcfd47c892b360855da99dc718ffae3f7ea883a9d8be(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31df0088c0e63209fc841566443b63707c450315d3ef2edd2a15678079fbe8a6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef263792b50446211c08cfd5bee360b32a8c95b960e1e5fa40d80e7c55a64749(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18d9511ed80cd109b10e69a7b9fca72683629b1752e10269a25c4add57f838f1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaVerificationState]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6dc4a5a7b39243ec6901e2c408c2686807a45db7be2969a46893fde856e2b26(
    *,
    comparison: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__72de6510fef1a1feebc3ef8818f33ef4c70c05da9f3f6a14cac1c88a0db75e9c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3fd635fa4133cecc83f75ed36d38641029117378e5eba449600ba3811c6786ff(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9358c384545142bc72a4bb2750f95074f81708fbbb80cefd7a5a7ec3f5c34d1a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a21d3523f98617271aaf8c41afc9c03ebbad3b1db6d5062b4c599bf0f6fd5fbe(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c528ceb688c0fb27d4c33a24c9ff049f89f9d6c4aa56d351acd4a23a8fa2fd4(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09ac16412f268533dcdee83da7f3f8f5912a8d1d22ae2fd34428d5f7a9dacf4c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SecurityhubAutomationRuleCriteriaWorkflowStatus]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c8e513c043b0a4036aa2983200d1a77015d41be3145d8c7128a53941948c3005(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01ddb56e69d03d8a1c6ef1b54d09d3655d999ff6cd72b6dec2afcabb5041219c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ca3925f9343d1a66a59d9dc62ceccbaac3367795b377762d3ad9eca85041f51(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da434229614143b4356ba4edb3df9ff0cb9f8e5c12724b125834de4dfcd76a97(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SecurityhubAutomationRuleCriteriaWorkflowStatus]],
) -> None:
    """Type checking stubs"""
    pass
