r'''
# `aws_vpclattice_listener_rule`

Refer to the Terraform Registry for docs: [`aws_vpclattice_listener_rule`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule).
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


class VpclatticeListenerRule(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRule",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule aws_vpclattice_listener_rule}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        action: typing.Union["VpclatticeListenerRuleAction", typing.Dict[builtins.str, typing.Any]],
        listener_identifier: builtins.str,
        match: typing.Union["VpclatticeListenerRuleMatch", typing.Dict[builtins.str, typing.Any]],
        name: builtins.str,
        priority: jsii.Number,
        service_identifier: builtins.str,
        id: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["VpclatticeListenerRuleTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule aws_vpclattice_listener_rule} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#action VpclatticeListenerRule#action}
        :param listener_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#listener_identifier VpclatticeListenerRule#listener_identifier}.
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#match VpclatticeListenerRule#match}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#name VpclatticeListenerRule#name}.
        :param priority: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#priority VpclatticeListenerRule#priority}.
        :param service_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#service_identifier VpclatticeListenerRule#service_identifier}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#id VpclatticeListenerRule#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#tags VpclatticeListenerRule#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#tags_all VpclatticeListenerRule#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#timeouts VpclatticeListenerRule#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40f3afd82927407ccce3d3383bf1908ec648daf79620725a2523ddeee6197d6d)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = VpclatticeListenerRuleConfig(
            action=action,
            listener_identifier=listener_identifier,
            match=match,
            name=name,
            priority=priority,
            service_identifier=service_identifier,
            id=id,
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
        '''Generates CDKTF code for importing a VpclatticeListenerRule resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the VpclatticeListenerRule to import.
        :param import_from_id: The id of the existing VpclatticeListenerRule that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the VpclatticeListenerRule to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a2a92d4f6de5cb61289da0908d1042c50a540f61fc5f3b23ee60e93dca3e18d9)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putAction")
    def put_action(
        self,
        *,
        fixed_response: typing.Optional[typing.Union["VpclatticeListenerRuleActionFixedResponse", typing.Dict[builtins.str, typing.Any]]] = None,
        forward: typing.Optional[typing.Union["VpclatticeListenerRuleActionForward", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param fixed_response: fixed_response block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#fixed_response VpclatticeListenerRule#fixed_response}
        :param forward: forward block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#forward VpclatticeListenerRule#forward}
        '''
        value = VpclatticeListenerRuleAction(
            fixed_response=fixed_response, forward=forward
        )

        return typing.cast(None, jsii.invoke(self, "putAction", [value]))

    @jsii.member(jsii_name="putMatch")
    def put_match(
        self,
        *,
        http_match: typing.Union["VpclatticeListenerRuleMatchHttpMatch", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param http_match: http_match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#http_match VpclatticeListenerRule#http_match}
        '''
        value = VpclatticeListenerRuleMatch(http_match=http_match)

        return typing.cast(None, jsii.invoke(self, "putMatch", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#create VpclatticeListenerRule#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#delete VpclatticeListenerRule#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#update VpclatticeListenerRule#update}.
        '''
        value = VpclatticeListenerRuleTimeouts(
            create=create, delete=delete, update=update
        )

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

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
    @jsii.member(jsii_name="action")
    def action(self) -> "VpclatticeListenerRuleActionOutputReference":
        return typing.cast("VpclatticeListenerRuleActionOutputReference", jsii.get(self, "action"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @builtins.property
    @jsii.member(jsii_name="match")
    def match(self) -> "VpclatticeListenerRuleMatchOutputReference":
        return typing.cast("VpclatticeListenerRuleMatchOutputReference", jsii.get(self, "match"))

    @builtins.property
    @jsii.member(jsii_name="ruleId")
    def rule_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ruleId"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "VpclatticeListenerRuleTimeoutsOutputReference":
        return typing.cast("VpclatticeListenerRuleTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="actionInput")
    def action_input(self) -> typing.Optional["VpclatticeListenerRuleAction"]:
        return typing.cast(typing.Optional["VpclatticeListenerRuleAction"], jsii.get(self, "actionInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="listenerIdentifierInput")
    def listener_identifier_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "listenerIdentifierInput"))

    @builtins.property
    @jsii.member(jsii_name="matchInput")
    def match_input(self) -> typing.Optional["VpclatticeListenerRuleMatch"]:
        return typing.cast(typing.Optional["VpclatticeListenerRuleMatch"], jsii.get(self, "matchInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="priorityInput")
    def priority_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "priorityInput"))

    @builtins.property
    @jsii.member(jsii_name="serviceIdentifierInput")
    def service_identifier_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "serviceIdentifierInput"))

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
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "VpclatticeListenerRuleTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "VpclatticeListenerRuleTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eea2a830c722bc64188cdb50c2a12cf68df7e1bbd0fdc97b98d41ca6d05cb283)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="listenerIdentifier")
    def listener_identifier(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "listenerIdentifier"))

    @listener_identifier.setter
    def listener_identifier(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__de7bb458075b8bbf7374a982dc2b900d88f5a3b4c15fb45096c89a0ef1823e07)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "listenerIdentifier", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__043f019d96e7937cd3c34d01860cec10165355c8afa90c8f5aa1170d5564961a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="priority")
    def priority(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "priority"))

    @priority.setter
    def priority(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e290a21398611146b146cc659278846721ff775f72b3001c128e3b0f6b917e06)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "priority", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="serviceIdentifier")
    def service_identifier(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "serviceIdentifier"))

    @service_identifier.setter
    def service_identifier(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07d75b1ef2fc863623f421715ae9b04dfc54bcf859b74c7f5b22bb9881b97930)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "serviceIdentifier", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9cf3f5f4282b9bb9b6962c54de3cf47f65a5de98e734798749f3f10b17b63b7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0fa221ba5621d77b15228e5df9740e82686443269dd1a9b8c1c9595850162026)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleAction",
    jsii_struct_bases=[],
    name_mapping={"fixed_response": "fixedResponse", "forward": "forward"},
)
class VpclatticeListenerRuleAction:
    def __init__(
        self,
        *,
        fixed_response: typing.Optional[typing.Union["VpclatticeListenerRuleActionFixedResponse", typing.Dict[builtins.str, typing.Any]]] = None,
        forward: typing.Optional[typing.Union["VpclatticeListenerRuleActionForward", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param fixed_response: fixed_response block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#fixed_response VpclatticeListenerRule#fixed_response}
        :param forward: forward block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#forward VpclatticeListenerRule#forward}
        '''
        if isinstance(fixed_response, dict):
            fixed_response = VpclatticeListenerRuleActionFixedResponse(**fixed_response)
        if isinstance(forward, dict):
            forward = VpclatticeListenerRuleActionForward(**forward)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b57d898a6d243f2aedade053450851f5068b8190f6b89887902b91530290c13a)
            check_type(argname="argument fixed_response", value=fixed_response, expected_type=type_hints["fixed_response"])
            check_type(argname="argument forward", value=forward, expected_type=type_hints["forward"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if fixed_response is not None:
            self._values["fixed_response"] = fixed_response
        if forward is not None:
            self._values["forward"] = forward

    @builtins.property
    def fixed_response(
        self,
    ) -> typing.Optional["VpclatticeListenerRuleActionFixedResponse"]:
        '''fixed_response block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#fixed_response VpclatticeListenerRule#fixed_response}
        '''
        result = self._values.get("fixed_response")
        return typing.cast(typing.Optional["VpclatticeListenerRuleActionFixedResponse"], result)

    @builtins.property
    def forward(self) -> typing.Optional["VpclatticeListenerRuleActionForward"]:
        '''forward block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#forward VpclatticeListenerRule#forward}
        '''
        result = self._values.get("forward")
        return typing.cast(typing.Optional["VpclatticeListenerRuleActionForward"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VpclatticeListenerRuleAction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleActionFixedResponse",
    jsii_struct_bases=[],
    name_mapping={"status_code": "statusCode"},
)
class VpclatticeListenerRuleActionFixedResponse:
    def __init__(self, *, status_code: jsii.Number) -> None:
        '''
        :param status_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#status_code VpclatticeListenerRule#status_code}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37c722159845f20d5c5f337c4584ab2a65414004b871e330bec1cac1dc6e8b0b)
            check_type(argname="argument status_code", value=status_code, expected_type=type_hints["status_code"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "status_code": status_code,
        }

    @builtins.property
    def status_code(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#status_code VpclatticeListenerRule#status_code}.'''
        result = self._values.get("status_code")
        assert result is not None, "Required property 'status_code' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VpclatticeListenerRuleActionFixedResponse(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class VpclatticeListenerRuleActionFixedResponseOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleActionFixedResponseOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__20261475c34c2edd297f2f1bec879ff164faefab0fcb47c6224b8068dfd49335)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="statusCodeInput")
    def status_code_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "statusCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="statusCode")
    def status_code(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "statusCode"))

    @status_code.setter
    def status_code(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d74cca8c25a2c5ccdcb7cb321e359b12788d7aa4759df9c735a85e00b4095d23)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "statusCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[VpclatticeListenerRuleActionFixedResponse]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleActionFixedResponse], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[VpclatticeListenerRuleActionFixedResponse],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3b06816bfd070e2a468add0daa5855a55be43cdea9bd45a07bba2922040550f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleActionForward",
    jsii_struct_bases=[],
    name_mapping={"target_groups": "targetGroups"},
)
class VpclatticeListenerRuleActionForward:
    def __init__(
        self,
        *,
        target_groups: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VpclatticeListenerRuleActionForwardTargetGroups", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param target_groups: target_groups block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#target_groups VpclatticeListenerRule#target_groups}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4839db5e2a5ea67e6c211a045599404484e0a09728851e2bf14e9c8368356ea)
            check_type(argname="argument target_groups", value=target_groups, expected_type=type_hints["target_groups"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "target_groups": target_groups,
        }

    @builtins.property
    def target_groups(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VpclatticeListenerRuleActionForwardTargetGroups"]]:
        '''target_groups block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#target_groups VpclatticeListenerRule#target_groups}
        '''
        result = self._values.get("target_groups")
        assert result is not None, "Required property 'target_groups' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VpclatticeListenerRuleActionForwardTargetGroups"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VpclatticeListenerRuleActionForward(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class VpclatticeListenerRuleActionForwardOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleActionForwardOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__709f9f7410a0c51ae5c95e53976bfe9f0bee58b5e783b2a9d48a8a41729380c5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putTargetGroups")
    def put_target_groups(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VpclatticeListenerRuleActionForwardTargetGroups", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__424ee7c0c74b6f932e2df298cda0b7c8439d2749736dd525fb863a717becade3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTargetGroups", [value]))

    @builtins.property
    @jsii.member(jsii_name="targetGroups")
    def target_groups(self) -> "VpclatticeListenerRuleActionForwardTargetGroupsList":
        return typing.cast("VpclatticeListenerRuleActionForwardTargetGroupsList", jsii.get(self, "targetGroups"))

    @builtins.property
    @jsii.member(jsii_name="targetGroupsInput")
    def target_groups_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VpclatticeListenerRuleActionForwardTargetGroups"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VpclatticeListenerRuleActionForwardTargetGroups"]]], jsii.get(self, "targetGroupsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[VpclatticeListenerRuleActionForward]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleActionForward], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[VpclatticeListenerRuleActionForward],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0a20f394f7e48001cbe4d4c66ce73af031ba7801f68875d863b9c1a404f2f734)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleActionForwardTargetGroups",
    jsii_struct_bases=[],
    name_mapping={
        "target_group_identifier": "targetGroupIdentifier",
        "weight": "weight",
    },
)
class VpclatticeListenerRuleActionForwardTargetGroups:
    def __init__(
        self,
        *,
        target_group_identifier: builtins.str,
        weight: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param target_group_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#target_group_identifier VpclatticeListenerRule#target_group_identifier}.
        :param weight: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#weight VpclatticeListenerRule#weight}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__998df8d70d71ee87e0f3c514b2712b5bed8e49a12f5c42cc8fa0982c75c304f7)
            check_type(argname="argument target_group_identifier", value=target_group_identifier, expected_type=type_hints["target_group_identifier"])
            check_type(argname="argument weight", value=weight, expected_type=type_hints["weight"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "target_group_identifier": target_group_identifier,
        }
        if weight is not None:
            self._values["weight"] = weight

    @builtins.property
    def target_group_identifier(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#target_group_identifier VpclatticeListenerRule#target_group_identifier}.'''
        result = self._values.get("target_group_identifier")
        assert result is not None, "Required property 'target_group_identifier' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def weight(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#weight VpclatticeListenerRule#weight}.'''
        result = self._values.get("weight")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VpclatticeListenerRuleActionForwardTargetGroups(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class VpclatticeListenerRuleActionForwardTargetGroupsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleActionForwardTargetGroupsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d1961f36bb6fa4118cac3db772e8c3bb2a1bc25bda9c2d96d6d4ac27cc79dfd1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "VpclatticeListenerRuleActionForwardTargetGroupsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__28aa933c9484022584cc468098e8ab4b93c7814584c73803ad26d65eacff6c1f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("VpclatticeListenerRuleActionForwardTargetGroupsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d1d8beb5154a689536e7333d41044a67f15f189067a271850b613f635f49c36)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3030e67112f0acba7ebb25287ae8bbd65977639651945d324ed08a835410ec5d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__32be374af6cbb419baecb8816990df0a03681fb1a5643c9e69a81603049c9549)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VpclatticeListenerRuleActionForwardTargetGroups]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VpclatticeListenerRuleActionForwardTargetGroups]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VpclatticeListenerRuleActionForwardTargetGroups]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__409960e298bbcf6a8d110c414c5662fe62fa294fda820bc144c474bd750100a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VpclatticeListenerRuleActionForwardTargetGroupsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleActionForwardTargetGroupsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__06f77c3536d83adbe29b6a3cff6ac7d2094103ce1ca163bfacc7135b7aec7ea4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetWeight")
    def reset_weight(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWeight", []))

    @builtins.property
    @jsii.member(jsii_name="targetGroupIdentifierInput")
    def target_group_identifier_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "targetGroupIdentifierInput"))

    @builtins.property
    @jsii.member(jsii_name="weightInput")
    def weight_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "weightInput"))

    @builtins.property
    @jsii.member(jsii_name="targetGroupIdentifier")
    def target_group_identifier(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "targetGroupIdentifier"))

    @target_group_identifier.setter
    def target_group_identifier(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4596a0202cfea86089bb73bf157c427e3d8f5baea043edbe8da44eb9cbebb9c3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetGroupIdentifier", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="weight")
    def weight(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "weight"))

    @weight.setter
    def weight(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__25c8fadd00636af3c8eaf26f12ed71bccdfd83776357729e10f49abd07b63be8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "weight", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VpclatticeListenerRuleActionForwardTargetGroups]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VpclatticeListenerRuleActionForwardTargetGroups]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VpclatticeListenerRuleActionForwardTargetGroups]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d128059db321a99284c829329f7497b9ede5d6eb1c384e2c9b5c426ed519c816)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VpclatticeListenerRuleActionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleActionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2640701f067676143cb390e2e6aaf33c32711ca5825d090fbd0b8aeabc83c3e5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putFixedResponse")
    def put_fixed_response(self, *, status_code: jsii.Number) -> None:
        '''
        :param status_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#status_code VpclatticeListenerRule#status_code}.
        '''
        value = VpclatticeListenerRuleActionFixedResponse(status_code=status_code)

        return typing.cast(None, jsii.invoke(self, "putFixedResponse", [value]))

    @jsii.member(jsii_name="putForward")
    def put_forward(
        self,
        *,
        target_groups: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VpclatticeListenerRuleActionForwardTargetGroups, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param target_groups: target_groups block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#target_groups VpclatticeListenerRule#target_groups}
        '''
        value = VpclatticeListenerRuleActionForward(target_groups=target_groups)

        return typing.cast(None, jsii.invoke(self, "putForward", [value]))

    @jsii.member(jsii_name="resetFixedResponse")
    def reset_fixed_response(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFixedResponse", []))

    @jsii.member(jsii_name="resetForward")
    def reset_forward(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetForward", []))

    @builtins.property
    @jsii.member(jsii_name="fixedResponse")
    def fixed_response(
        self,
    ) -> VpclatticeListenerRuleActionFixedResponseOutputReference:
        return typing.cast(VpclatticeListenerRuleActionFixedResponseOutputReference, jsii.get(self, "fixedResponse"))

    @builtins.property
    @jsii.member(jsii_name="forward")
    def forward(self) -> VpclatticeListenerRuleActionForwardOutputReference:
        return typing.cast(VpclatticeListenerRuleActionForwardOutputReference, jsii.get(self, "forward"))

    @builtins.property
    @jsii.member(jsii_name="fixedResponseInput")
    def fixed_response_input(
        self,
    ) -> typing.Optional[VpclatticeListenerRuleActionFixedResponse]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleActionFixedResponse], jsii.get(self, "fixedResponseInput"))

    @builtins.property
    @jsii.member(jsii_name="forwardInput")
    def forward_input(self) -> typing.Optional[VpclatticeListenerRuleActionForward]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleActionForward], jsii.get(self, "forwardInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[VpclatticeListenerRuleAction]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleAction], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[VpclatticeListenerRuleAction],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d18a8c60ca950e0143e9e0453fc99bb733b1d1e885c9bfaf0f3ea43bfa781f1a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleConfig",
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
        "listener_identifier": "listenerIdentifier",
        "match": "match",
        "name": "name",
        "priority": "priority",
        "service_identifier": "serviceIdentifier",
        "id": "id",
        "tags": "tags",
        "tags_all": "tagsAll",
        "timeouts": "timeouts",
    },
)
class VpclatticeListenerRuleConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        action: typing.Union[VpclatticeListenerRuleAction, typing.Dict[builtins.str, typing.Any]],
        listener_identifier: builtins.str,
        match: typing.Union["VpclatticeListenerRuleMatch", typing.Dict[builtins.str, typing.Any]],
        name: builtins.str,
        priority: jsii.Number,
        service_identifier: builtins.str,
        id: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["VpclatticeListenerRuleTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#action VpclatticeListenerRule#action}
        :param listener_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#listener_identifier VpclatticeListenerRule#listener_identifier}.
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#match VpclatticeListenerRule#match}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#name VpclatticeListenerRule#name}.
        :param priority: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#priority VpclatticeListenerRule#priority}.
        :param service_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#service_identifier VpclatticeListenerRule#service_identifier}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#id VpclatticeListenerRule#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#tags VpclatticeListenerRule#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#tags_all VpclatticeListenerRule#tags_all}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#timeouts VpclatticeListenerRule#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(action, dict):
            action = VpclatticeListenerRuleAction(**action)
        if isinstance(match, dict):
            match = VpclatticeListenerRuleMatch(**match)
        if isinstance(timeouts, dict):
            timeouts = VpclatticeListenerRuleTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__91e0ceefdddb1ce7ea233fc2e38a679e3d1b7a9decbb10cfb5f13ce75625e74c)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument action", value=action, expected_type=type_hints["action"])
            check_type(argname="argument listener_identifier", value=listener_identifier, expected_type=type_hints["listener_identifier"])
            check_type(argname="argument match", value=match, expected_type=type_hints["match"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument priority", value=priority, expected_type=type_hints["priority"])
            check_type(argname="argument service_identifier", value=service_identifier, expected_type=type_hints["service_identifier"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "action": action,
            "listener_identifier": listener_identifier,
            "match": match,
            "name": name,
            "priority": priority,
            "service_identifier": service_identifier,
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
    def action(self) -> VpclatticeListenerRuleAction:
        '''action block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#action VpclatticeListenerRule#action}
        '''
        result = self._values.get("action")
        assert result is not None, "Required property 'action' is missing"
        return typing.cast(VpclatticeListenerRuleAction, result)

    @builtins.property
    def listener_identifier(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#listener_identifier VpclatticeListenerRule#listener_identifier}.'''
        result = self._values.get("listener_identifier")
        assert result is not None, "Required property 'listener_identifier' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def match(self) -> "VpclatticeListenerRuleMatch":
        '''match block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#match VpclatticeListenerRule#match}
        '''
        result = self._values.get("match")
        assert result is not None, "Required property 'match' is missing"
        return typing.cast("VpclatticeListenerRuleMatch", result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#name VpclatticeListenerRule#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def priority(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#priority VpclatticeListenerRule#priority}.'''
        result = self._values.get("priority")
        assert result is not None, "Required property 'priority' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def service_identifier(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#service_identifier VpclatticeListenerRule#service_identifier}.'''
        result = self._values.get("service_identifier")
        assert result is not None, "Required property 'service_identifier' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#id VpclatticeListenerRule#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#tags VpclatticeListenerRule#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#tags_all VpclatticeListenerRule#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["VpclatticeListenerRuleTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#timeouts VpclatticeListenerRule#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["VpclatticeListenerRuleTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VpclatticeListenerRuleConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatch",
    jsii_struct_bases=[],
    name_mapping={"http_match": "httpMatch"},
)
class VpclatticeListenerRuleMatch:
    def __init__(
        self,
        *,
        http_match: typing.Union["VpclatticeListenerRuleMatchHttpMatch", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param http_match: http_match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#http_match VpclatticeListenerRule#http_match}
        '''
        if isinstance(http_match, dict):
            http_match = VpclatticeListenerRuleMatchHttpMatch(**http_match)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8834710e6cb1cfbebe1a22a94440f79e291069b803f29eadeb6178a0103c254f)
            check_type(argname="argument http_match", value=http_match, expected_type=type_hints["http_match"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "http_match": http_match,
        }

    @builtins.property
    def http_match(self) -> "VpclatticeListenerRuleMatchHttpMatch":
        '''http_match block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#http_match VpclatticeListenerRule#http_match}
        '''
        result = self._values.get("http_match")
        assert result is not None, "Required property 'http_match' is missing"
        return typing.cast("VpclatticeListenerRuleMatchHttpMatch", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VpclatticeListenerRuleMatch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatch",
    jsii_struct_bases=[],
    name_mapping={
        "header_matches": "headerMatches",
        "method": "method",
        "path_match": "pathMatch",
    },
)
class VpclatticeListenerRuleMatchHttpMatch:
    def __init__(
        self,
        *,
        header_matches: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VpclatticeListenerRuleMatchHttpMatchHeaderMatches", typing.Dict[builtins.str, typing.Any]]]]] = None,
        method: typing.Optional[builtins.str] = None,
        path_match: typing.Optional[typing.Union["VpclatticeListenerRuleMatchHttpMatchPathMatch", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param header_matches: header_matches block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#header_matches VpclatticeListenerRule#header_matches}
        :param method: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#method VpclatticeListenerRule#method}.
        :param path_match: path_match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#path_match VpclatticeListenerRule#path_match}
        '''
        if isinstance(path_match, dict):
            path_match = VpclatticeListenerRuleMatchHttpMatchPathMatch(**path_match)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__200cf929459f47fbc7c7d29be0e85d46d36d3779147ccce034e64ac284845e59)
            check_type(argname="argument header_matches", value=header_matches, expected_type=type_hints["header_matches"])
            check_type(argname="argument method", value=method, expected_type=type_hints["method"])
            check_type(argname="argument path_match", value=path_match, expected_type=type_hints["path_match"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if header_matches is not None:
            self._values["header_matches"] = header_matches
        if method is not None:
            self._values["method"] = method
        if path_match is not None:
            self._values["path_match"] = path_match

    @builtins.property
    def header_matches(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VpclatticeListenerRuleMatchHttpMatchHeaderMatches"]]]:
        '''header_matches block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#header_matches VpclatticeListenerRule#header_matches}
        '''
        result = self._values.get("header_matches")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VpclatticeListenerRuleMatchHttpMatchHeaderMatches"]]], result)

    @builtins.property
    def method(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#method VpclatticeListenerRule#method}.'''
        result = self._values.get("method")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def path_match(
        self,
    ) -> typing.Optional["VpclatticeListenerRuleMatchHttpMatchPathMatch"]:
        '''path_match block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#path_match VpclatticeListenerRule#path_match}
        '''
        result = self._values.get("path_match")
        return typing.cast(typing.Optional["VpclatticeListenerRuleMatchHttpMatchPathMatch"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VpclatticeListenerRuleMatchHttpMatch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchHeaderMatches",
    jsii_struct_bases=[],
    name_mapping={"match": "match", "name": "name", "case_sensitive": "caseSensitive"},
)
class VpclatticeListenerRuleMatchHttpMatchHeaderMatches:
    def __init__(
        self,
        *,
        match: typing.Union["VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch", typing.Dict[builtins.str, typing.Any]],
        name: builtins.str,
        case_sensitive: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#match VpclatticeListenerRule#match}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#name VpclatticeListenerRule#name}.
        :param case_sensitive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#case_sensitive VpclatticeListenerRule#case_sensitive}.
        '''
        if isinstance(match, dict):
            match = VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch(**match)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__046bc092fb18839e5095139bc1fe8b4ccb74064319a96e14c35f588dded95e00)
            check_type(argname="argument match", value=match, expected_type=type_hints["match"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument case_sensitive", value=case_sensitive, expected_type=type_hints["case_sensitive"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "match": match,
            "name": name,
        }
        if case_sensitive is not None:
            self._values["case_sensitive"] = case_sensitive

    @builtins.property
    def match(self) -> "VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch":
        '''match block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#match VpclatticeListenerRule#match}
        '''
        result = self._values.get("match")
        assert result is not None, "Required property 'match' is missing"
        return typing.cast("VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch", result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#name VpclatticeListenerRule#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def case_sensitive(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#case_sensitive VpclatticeListenerRule#case_sensitive}.'''
        result = self._values.get("case_sensitive")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VpclatticeListenerRuleMatchHttpMatchHeaderMatches(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class VpclatticeListenerRuleMatchHttpMatchHeaderMatchesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c6dfb90647dda34a755806de57407ec29cbd162e30bfce520a25faaf90f6fe0a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "VpclatticeListenerRuleMatchHttpMatchHeaderMatchesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__650a709f79f433dcbb30fb2194f193a9232872c515f466a1f4682fafd2aa0279)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("VpclatticeListenerRuleMatchHttpMatchHeaderMatchesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e17f8ad67a27cab7bbef7ed8f9902beb90336fa2d23ba1bf2c94435402e61993)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1dab79d36bc2bb8474313b1e291c5b2d3e75dfa03a38a8f2e0cfe796bad1a135)
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
            type_hints = typing.get_type_hints(_typecheckingstub__14ad644db881e80bb1c321ebc5a6140c014c3d5d99a993e684f57278d403af1b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VpclatticeListenerRuleMatchHttpMatchHeaderMatches]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VpclatticeListenerRuleMatchHttpMatchHeaderMatches]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VpclatticeListenerRuleMatchHttpMatchHeaderMatches]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b205dcf9fddfff9d0416be552c1f22e7034ff0a7483ad7f22e48dd384c355b19)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch",
    jsii_struct_bases=[],
    name_mapping={"contains": "contains", "exact": "exact", "prefix": "prefix"},
)
class VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch:
    def __init__(
        self,
        *,
        contains: typing.Optional[builtins.str] = None,
        exact: typing.Optional[builtins.str] = None,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param contains: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#contains VpclatticeListenerRule#contains}.
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#exact VpclatticeListenerRule#exact}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#prefix VpclatticeListenerRule#prefix}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__240143d924c0779b5615edbb3bcb993146177fe676c0f815991f96309ec1fb67)
            check_type(argname="argument contains", value=contains, expected_type=type_hints["contains"])
            check_type(argname="argument exact", value=exact, expected_type=type_hints["exact"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if contains is not None:
            self._values["contains"] = contains
        if exact is not None:
            self._values["exact"] = exact
        if prefix is not None:
            self._values["prefix"] = prefix

    @builtins.property
    def contains(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#contains VpclatticeListenerRule#contains}.'''
        result = self._values.get("contains")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def exact(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#exact VpclatticeListenerRule#exact}.'''
        result = self._values.get("exact")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#prefix VpclatticeListenerRule#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c7671c35d9b898002dfec713dbd5c438af8d858c87e11ed6275a36905c924782)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetContains")
    def reset_contains(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContains", []))

    @jsii.member(jsii_name="resetExact")
    def reset_exact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExact", []))

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @builtins.property
    @jsii.member(jsii_name="containsInput")
    def contains_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "containsInput"))

    @builtins.property
    @jsii.member(jsii_name="exactInput")
    def exact_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exactInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="contains")
    def contains(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contains"))

    @contains.setter
    def contains(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c27ee095692315eb094ebdc0cdda83427363b259a4bba5831146951476a72a7a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contains", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="exact")
    def exact(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exact"))

    @exact.setter
    def exact(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a8969eb8118cc51efde926c5e24ab1885bd945e9e1e79333b947414be24ccca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca85fdcc1d395951feda2ed39d8c56e400a5d42e159a286c7b55aad46ee3a1b6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b26e0c983054fa219cbd191abef98e98053d5935a31f9ddcba6fc0afa7b1263)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VpclatticeListenerRuleMatchHttpMatchHeaderMatchesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cc7b6079aec0e0d079a9e5a1a46231992f58a69f10f8feb61789d764edfdd742)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putMatch")
    def put_match(
        self,
        *,
        contains: typing.Optional[builtins.str] = None,
        exact: typing.Optional[builtins.str] = None,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param contains: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#contains VpclatticeListenerRule#contains}.
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#exact VpclatticeListenerRule#exact}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#prefix VpclatticeListenerRule#prefix}.
        '''
        value = VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch(
            contains=contains, exact=exact, prefix=prefix
        )

        return typing.cast(None, jsii.invoke(self, "putMatch", [value]))

    @jsii.member(jsii_name="resetCaseSensitive")
    def reset_case_sensitive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCaseSensitive", []))

    @builtins.property
    @jsii.member(jsii_name="match")
    def match(
        self,
    ) -> VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatchOutputReference:
        return typing.cast(VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatchOutputReference, jsii.get(self, "match"))

    @builtins.property
    @jsii.member(jsii_name="caseSensitiveInput")
    def case_sensitive_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "caseSensitiveInput"))

    @builtins.property
    @jsii.member(jsii_name="matchInput")
    def match_input(
        self,
    ) -> typing.Optional[VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch], jsii.get(self, "matchInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="caseSensitive")
    def case_sensitive(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "caseSensitive"))

    @case_sensitive.setter
    def case_sensitive(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a535df1dfe69761d32041c46a1224dcd0c3f55216669ee7749d341f847ff3ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "caseSensitive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5aafef8108ba2543d004dc57b0e0e57f90e3e29c9616b95dcd2a255584730fb0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VpclatticeListenerRuleMatchHttpMatchHeaderMatches]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VpclatticeListenerRuleMatchHttpMatchHeaderMatches]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VpclatticeListenerRuleMatchHttpMatchHeaderMatches]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__daf0d617f2d05cbfe240d6744af177fec13003bcf7767c387663c3456e065f89)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VpclatticeListenerRuleMatchHttpMatchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7ec3150525eab5e3d8ee918d4f03449922af5370b40071d2d8c248281fcb9dfd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putHeaderMatches")
    def put_header_matches(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VpclatticeListenerRuleMatchHttpMatchHeaderMatches, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f69032c2fe1ea33c4d942a4916753853b25c321ea292cc57b90e10ea55dc4bd9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putHeaderMatches", [value]))

    @jsii.member(jsii_name="putPathMatch")
    def put_path_match(
        self,
        *,
        match: typing.Union["VpclatticeListenerRuleMatchHttpMatchPathMatchMatch", typing.Dict[builtins.str, typing.Any]],
        case_sensitive: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#match VpclatticeListenerRule#match}
        :param case_sensitive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#case_sensitive VpclatticeListenerRule#case_sensitive}.
        '''
        value = VpclatticeListenerRuleMatchHttpMatchPathMatch(
            match=match, case_sensitive=case_sensitive
        )

        return typing.cast(None, jsii.invoke(self, "putPathMatch", [value]))

    @jsii.member(jsii_name="resetHeaderMatches")
    def reset_header_matches(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHeaderMatches", []))

    @jsii.member(jsii_name="resetMethod")
    def reset_method(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMethod", []))

    @jsii.member(jsii_name="resetPathMatch")
    def reset_path_match(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPathMatch", []))

    @builtins.property
    @jsii.member(jsii_name="headerMatches")
    def header_matches(self) -> VpclatticeListenerRuleMatchHttpMatchHeaderMatchesList:
        return typing.cast(VpclatticeListenerRuleMatchHttpMatchHeaderMatchesList, jsii.get(self, "headerMatches"))

    @builtins.property
    @jsii.member(jsii_name="pathMatch")
    def path_match(
        self,
    ) -> "VpclatticeListenerRuleMatchHttpMatchPathMatchOutputReference":
        return typing.cast("VpclatticeListenerRuleMatchHttpMatchPathMatchOutputReference", jsii.get(self, "pathMatch"))

    @builtins.property
    @jsii.member(jsii_name="headerMatchesInput")
    def header_matches_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VpclatticeListenerRuleMatchHttpMatchHeaderMatches]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VpclatticeListenerRuleMatchHttpMatchHeaderMatches]]], jsii.get(self, "headerMatchesInput"))

    @builtins.property
    @jsii.member(jsii_name="methodInput")
    def method_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "methodInput"))

    @builtins.property
    @jsii.member(jsii_name="pathMatchInput")
    def path_match_input(
        self,
    ) -> typing.Optional["VpclatticeListenerRuleMatchHttpMatchPathMatch"]:
        return typing.cast(typing.Optional["VpclatticeListenerRuleMatchHttpMatchPathMatch"], jsii.get(self, "pathMatchInput"))

    @builtins.property
    @jsii.member(jsii_name="method")
    def method(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "method"))

    @method.setter
    def method(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f1036db299ef13f733f8b11cb50397ead89058e735bd882162009e7fab5154d5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "method", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[VpclatticeListenerRuleMatchHttpMatch]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleMatchHttpMatch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[VpclatticeListenerRuleMatchHttpMatch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ff86704d615d6aa980015d9bad24593f5dffd49b0af8ec4ab09a35cb707ec49)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchPathMatch",
    jsii_struct_bases=[],
    name_mapping={"match": "match", "case_sensitive": "caseSensitive"},
)
class VpclatticeListenerRuleMatchHttpMatchPathMatch:
    def __init__(
        self,
        *,
        match: typing.Union["VpclatticeListenerRuleMatchHttpMatchPathMatchMatch", typing.Dict[builtins.str, typing.Any]],
        case_sensitive: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param match: match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#match VpclatticeListenerRule#match}
        :param case_sensitive: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#case_sensitive VpclatticeListenerRule#case_sensitive}.
        '''
        if isinstance(match, dict):
            match = VpclatticeListenerRuleMatchHttpMatchPathMatchMatch(**match)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0a5a5baf7b2b17e1e48180deee2afe1309e5d0fbff86e1d49a3b1847c091eff7)
            check_type(argname="argument match", value=match, expected_type=type_hints["match"])
            check_type(argname="argument case_sensitive", value=case_sensitive, expected_type=type_hints["case_sensitive"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "match": match,
        }
        if case_sensitive is not None:
            self._values["case_sensitive"] = case_sensitive

    @builtins.property
    def match(self) -> "VpclatticeListenerRuleMatchHttpMatchPathMatchMatch":
        '''match block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#match VpclatticeListenerRule#match}
        '''
        result = self._values.get("match")
        assert result is not None, "Required property 'match' is missing"
        return typing.cast("VpclatticeListenerRuleMatchHttpMatchPathMatchMatch", result)

    @builtins.property
    def case_sensitive(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#case_sensitive VpclatticeListenerRule#case_sensitive}.'''
        result = self._values.get("case_sensitive")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VpclatticeListenerRuleMatchHttpMatchPathMatch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatch",
    jsii_struct_bases=[],
    name_mapping={"exact": "exact", "prefix": "prefix"},
)
class VpclatticeListenerRuleMatchHttpMatchPathMatchMatch:
    def __init__(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#exact VpclatticeListenerRule#exact}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#prefix VpclatticeListenerRule#prefix}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b217a4202af0e365782dd49238fdbf5e4ffe9a35a8094aba8c1f34f29ae5d89)
            check_type(argname="argument exact", value=exact, expected_type=type_hints["exact"])
            check_type(argname="argument prefix", value=prefix, expected_type=type_hints["prefix"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if exact is not None:
            self._values["exact"] = exact
        if prefix is not None:
            self._values["prefix"] = prefix

    @builtins.property
    def exact(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#exact VpclatticeListenerRule#exact}.'''
        result = self._values.get("exact")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#prefix VpclatticeListenerRule#prefix}.'''
        result = self._values.get("prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VpclatticeListenerRuleMatchHttpMatchPathMatchMatch(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class VpclatticeListenerRuleMatchHttpMatchPathMatchMatchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3cb9c950b7c6dbe82c7ca0846df0f9117b692f1370ae0acd94415fabc9693b5d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExact")
    def reset_exact(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExact", []))

    @jsii.member(jsii_name="resetPrefix")
    def reset_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrefix", []))

    @builtins.property
    @jsii.member(jsii_name="exactInput")
    def exact_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "exactInput"))

    @builtins.property
    @jsii.member(jsii_name="prefixInput")
    def prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "prefixInput"))

    @builtins.property
    @jsii.member(jsii_name="exact")
    def exact(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "exact"))

    @exact.setter
    def exact(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5514efb191696e3d1b42c63991f48d9d0c5cf48f849fa7097b5a9d56396d0a8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "exact", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prefix")
    def prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "prefix"))

    @prefix.setter
    def prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a313abd15c99133f43652fae39132223092f4b9e36fb006a7fcf84f6a9e8fd4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[VpclatticeListenerRuleMatchHttpMatchPathMatchMatch]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleMatchHttpMatchPathMatchMatch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[VpclatticeListenerRuleMatchHttpMatchPathMatchMatch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4c0f81a9efb8a410b803f9d3f35f3a5555baccad6c3ad695bb1bf06aa69ab4b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VpclatticeListenerRuleMatchHttpMatchPathMatchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchPathMatchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8522748de0db8253fa6f42588a6e44d50aec439b99fb63be3c44cb1f3f361ce3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putMatch")
    def put_match(
        self,
        *,
        exact: typing.Optional[builtins.str] = None,
        prefix: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param exact: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#exact VpclatticeListenerRule#exact}.
        :param prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#prefix VpclatticeListenerRule#prefix}.
        '''
        value = VpclatticeListenerRuleMatchHttpMatchPathMatchMatch(
            exact=exact, prefix=prefix
        )

        return typing.cast(None, jsii.invoke(self, "putMatch", [value]))

    @jsii.member(jsii_name="resetCaseSensitive")
    def reset_case_sensitive(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCaseSensitive", []))

    @builtins.property
    @jsii.member(jsii_name="match")
    def match(
        self,
    ) -> VpclatticeListenerRuleMatchHttpMatchPathMatchMatchOutputReference:
        return typing.cast(VpclatticeListenerRuleMatchHttpMatchPathMatchMatchOutputReference, jsii.get(self, "match"))

    @builtins.property
    @jsii.member(jsii_name="caseSensitiveInput")
    def case_sensitive_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "caseSensitiveInput"))

    @builtins.property
    @jsii.member(jsii_name="matchInput")
    def match_input(
        self,
    ) -> typing.Optional[VpclatticeListenerRuleMatchHttpMatchPathMatchMatch]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleMatchHttpMatchPathMatchMatch], jsii.get(self, "matchInput"))

    @builtins.property
    @jsii.member(jsii_name="caseSensitive")
    def case_sensitive(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "caseSensitive"))

    @case_sensitive.setter
    def case_sensitive(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e62f3a194b4211f817a841e4aeab3ab23f366dddf8b384a4de3828f253cd1ef9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "caseSensitive", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[VpclatticeListenerRuleMatchHttpMatchPathMatch]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleMatchHttpMatchPathMatch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[VpclatticeListenerRuleMatchHttpMatchPathMatch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__60d1ee837d8f26480d69b0df8872dd13cfdde0be465b683b5c689c2d699acbc5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VpclatticeListenerRuleMatchOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2442a25851daa11731d50053d52b83f08962dc1af80863fde7d8900034cd7a5a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putHttpMatch")
    def put_http_match(
        self,
        *,
        header_matches: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VpclatticeListenerRuleMatchHttpMatchHeaderMatches, typing.Dict[builtins.str, typing.Any]]]]] = None,
        method: typing.Optional[builtins.str] = None,
        path_match: typing.Optional[typing.Union[VpclatticeListenerRuleMatchHttpMatchPathMatch, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param header_matches: header_matches block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#header_matches VpclatticeListenerRule#header_matches}
        :param method: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#method VpclatticeListenerRule#method}.
        :param path_match: path_match block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#path_match VpclatticeListenerRule#path_match}
        '''
        value = VpclatticeListenerRuleMatchHttpMatch(
            header_matches=header_matches, method=method, path_match=path_match
        )

        return typing.cast(None, jsii.invoke(self, "putHttpMatch", [value]))

    @builtins.property
    @jsii.member(jsii_name="httpMatch")
    def http_match(self) -> VpclatticeListenerRuleMatchHttpMatchOutputReference:
        return typing.cast(VpclatticeListenerRuleMatchHttpMatchOutputReference, jsii.get(self, "httpMatch"))

    @builtins.property
    @jsii.member(jsii_name="httpMatchInput")
    def http_match_input(self) -> typing.Optional[VpclatticeListenerRuleMatchHttpMatch]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleMatchHttpMatch], jsii.get(self, "httpMatchInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[VpclatticeListenerRuleMatch]:
        return typing.cast(typing.Optional[VpclatticeListenerRuleMatch], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[VpclatticeListenerRuleMatch],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e3bc89fcc4cc12096926a41c939fd276658124c3a5adc48f41487f808792d7bc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class VpclatticeListenerRuleTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#create VpclatticeListenerRule#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#delete VpclatticeListenerRule#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#update VpclatticeListenerRule#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6949415e6297c197747d844f1013c675b677cc4466ea5b6d480c46ea0668de7c)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#create VpclatticeListenerRule#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#delete VpclatticeListenerRule#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#update VpclatticeListenerRule#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VpclatticeListenerRuleTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class VpclatticeListenerRuleTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.vpclatticeListenerRule.VpclatticeListenerRuleTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f1fdda5bf10cb90457557f041c11762d61301ece4487fe63bda546ab5fd7b491)
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
            type_hints = typing.get_type_hints(_typecheckingstub__589f7935a27acac0276e282f1127916fd75e847fa025aba573fa149ace62f470)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4014fd1946e1b2d264188842c42b7c6e439d300e7b250a39d2b2e3d00c872427)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__129457977d2de3bd54581bafda8c2b717fae2907240cdf602d8fd7a82826cb96)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VpclatticeListenerRuleTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VpclatticeListenerRuleTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VpclatticeListenerRuleTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d8b735206e12328a34891eea5ee6764370e1f3e7e0bf6a02173f5f8b5cabb754)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "VpclatticeListenerRule",
    "VpclatticeListenerRuleAction",
    "VpclatticeListenerRuleActionFixedResponse",
    "VpclatticeListenerRuleActionFixedResponseOutputReference",
    "VpclatticeListenerRuleActionForward",
    "VpclatticeListenerRuleActionForwardOutputReference",
    "VpclatticeListenerRuleActionForwardTargetGroups",
    "VpclatticeListenerRuleActionForwardTargetGroupsList",
    "VpclatticeListenerRuleActionForwardTargetGroupsOutputReference",
    "VpclatticeListenerRuleActionOutputReference",
    "VpclatticeListenerRuleConfig",
    "VpclatticeListenerRuleMatch",
    "VpclatticeListenerRuleMatchHttpMatch",
    "VpclatticeListenerRuleMatchHttpMatchHeaderMatches",
    "VpclatticeListenerRuleMatchHttpMatchHeaderMatchesList",
    "VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch",
    "VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatchOutputReference",
    "VpclatticeListenerRuleMatchHttpMatchHeaderMatchesOutputReference",
    "VpclatticeListenerRuleMatchHttpMatchOutputReference",
    "VpclatticeListenerRuleMatchHttpMatchPathMatch",
    "VpclatticeListenerRuleMatchHttpMatchPathMatchMatch",
    "VpclatticeListenerRuleMatchHttpMatchPathMatchMatchOutputReference",
    "VpclatticeListenerRuleMatchHttpMatchPathMatchOutputReference",
    "VpclatticeListenerRuleMatchOutputReference",
    "VpclatticeListenerRuleTimeouts",
    "VpclatticeListenerRuleTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__40f3afd82927407ccce3d3383bf1908ec648daf79620725a2523ddeee6197d6d(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    action: typing.Union[VpclatticeListenerRuleAction, typing.Dict[builtins.str, typing.Any]],
    listener_identifier: builtins.str,
    match: typing.Union[VpclatticeListenerRuleMatch, typing.Dict[builtins.str, typing.Any]],
    name: builtins.str,
    priority: jsii.Number,
    service_identifier: builtins.str,
    id: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[VpclatticeListenerRuleTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__a2a92d4f6de5cb61289da0908d1042c50a540f61fc5f3b23ee60e93dca3e18d9(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eea2a830c722bc64188cdb50c2a12cf68df7e1bbd0fdc97b98d41ca6d05cb283(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__de7bb458075b8bbf7374a982dc2b900d88f5a3b4c15fb45096c89a0ef1823e07(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__043f019d96e7937cd3c34d01860cec10165355c8afa90c8f5aa1170d5564961a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e290a21398611146b146cc659278846721ff775f72b3001c128e3b0f6b917e06(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07d75b1ef2fc863623f421715ae9b04dfc54bcf859b74c7f5b22bb9881b97930(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9cf3f5f4282b9bb9b6962c54de3cf47f65a5de98e734798749f3f10b17b63b7(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0fa221ba5621d77b15228e5df9740e82686443269dd1a9b8c1c9595850162026(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b57d898a6d243f2aedade053450851f5068b8190f6b89887902b91530290c13a(
    *,
    fixed_response: typing.Optional[typing.Union[VpclatticeListenerRuleActionFixedResponse, typing.Dict[builtins.str, typing.Any]]] = None,
    forward: typing.Optional[typing.Union[VpclatticeListenerRuleActionForward, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37c722159845f20d5c5f337c4584ab2a65414004b871e330bec1cac1dc6e8b0b(
    *,
    status_code: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__20261475c34c2edd297f2f1bec879ff164faefab0fcb47c6224b8068dfd49335(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d74cca8c25a2c5ccdcb7cb321e359b12788d7aa4759df9c735a85e00b4095d23(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3b06816bfd070e2a468add0daa5855a55be43cdea9bd45a07bba2922040550f(
    value: typing.Optional[VpclatticeListenerRuleActionFixedResponse],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4839db5e2a5ea67e6c211a045599404484e0a09728851e2bf14e9c8368356ea(
    *,
    target_groups: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VpclatticeListenerRuleActionForwardTargetGroups, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__709f9f7410a0c51ae5c95e53976bfe9f0bee58b5e783b2a9d48a8a41729380c5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__424ee7c0c74b6f932e2df298cda0b7c8439d2749736dd525fb863a717becade3(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VpclatticeListenerRuleActionForwardTargetGroups, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a20f394f7e48001cbe4d4c66ce73af031ba7801f68875d863b9c1a404f2f734(
    value: typing.Optional[VpclatticeListenerRuleActionForward],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__998df8d70d71ee87e0f3c514b2712b5bed8e49a12f5c42cc8fa0982c75c304f7(
    *,
    target_group_identifier: builtins.str,
    weight: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1961f36bb6fa4118cac3db772e8c3bb2a1bc25bda9c2d96d6d4ac27cc79dfd1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28aa933c9484022584cc468098e8ab4b93c7814584c73803ad26d65eacff6c1f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d1d8beb5154a689536e7333d41044a67f15f189067a271850b613f635f49c36(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3030e67112f0acba7ebb25287ae8bbd65977639651945d324ed08a835410ec5d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32be374af6cbb419baecb8816990df0a03681fb1a5643c9e69a81603049c9549(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__409960e298bbcf6a8d110c414c5662fe62fa294fda820bc144c474bd750100a6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VpclatticeListenerRuleActionForwardTargetGroups]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06f77c3536d83adbe29b6a3cff6ac7d2094103ce1ca163bfacc7135b7aec7ea4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4596a0202cfea86089bb73bf157c427e3d8f5baea043edbe8da44eb9cbebb9c3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__25c8fadd00636af3c8eaf26f12ed71bccdfd83776357729e10f49abd07b63be8(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d128059db321a99284c829329f7497b9ede5d6eb1c384e2c9b5c426ed519c816(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VpclatticeListenerRuleActionForwardTargetGroups]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2640701f067676143cb390e2e6aaf33c32711ca5825d090fbd0b8aeabc83c3e5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d18a8c60ca950e0143e9e0453fc99bb733b1d1e885c9bfaf0f3ea43bfa781f1a(
    value: typing.Optional[VpclatticeListenerRuleAction],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__91e0ceefdddb1ce7ea233fc2e38a679e3d1b7a9decbb10cfb5f13ce75625e74c(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    action: typing.Union[VpclatticeListenerRuleAction, typing.Dict[builtins.str, typing.Any]],
    listener_identifier: builtins.str,
    match: typing.Union[VpclatticeListenerRuleMatch, typing.Dict[builtins.str, typing.Any]],
    name: builtins.str,
    priority: jsii.Number,
    service_identifier: builtins.str,
    id: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[VpclatticeListenerRuleTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8834710e6cb1cfbebe1a22a94440f79e291069b803f29eadeb6178a0103c254f(
    *,
    http_match: typing.Union[VpclatticeListenerRuleMatchHttpMatch, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__200cf929459f47fbc7c7d29be0e85d46d36d3779147ccce034e64ac284845e59(
    *,
    header_matches: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VpclatticeListenerRuleMatchHttpMatchHeaderMatches, typing.Dict[builtins.str, typing.Any]]]]] = None,
    method: typing.Optional[builtins.str] = None,
    path_match: typing.Optional[typing.Union[VpclatticeListenerRuleMatchHttpMatchPathMatch, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__046bc092fb18839e5095139bc1fe8b4ccb74064319a96e14c35f588dded95e00(
    *,
    match: typing.Union[VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch, typing.Dict[builtins.str, typing.Any]],
    name: builtins.str,
    case_sensitive: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6dfb90647dda34a755806de57407ec29cbd162e30bfce520a25faaf90f6fe0a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__650a709f79f433dcbb30fb2194f193a9232872c515f466a1f4682fafd2aa0279(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e17f8ad67a27cab7bbef7ed8f9902beb90336fa2d23ba1bf2c94435402e61993(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1dab79d36bc2bb8474313b1e291c5b2d3e75dfa03a38a8f2e0cfe796bad1a135(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14ad644db881e80bb1c321ebc5a6140c014c3d5d99a993e684f57278d403af1b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b205dcf9fddfff9d0416be552c1f22e7034ff0a7483ad7f22e48dd384c355b19(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VpclatticeListenerRuleMatchHttpMatchHeaderMatches]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__240143d924c0779b5615edbb3bcb993146177fe676c0f815991f96309ec1fb67(
    *,
    contains: typing.Optional[builtins.str] = None,
    exact: typing.Optional[builtins.str] = None,
    prefix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7671c35d9b898002dfec713dbd5c438af8d858c87e11ed6275a36905c924782(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c27ee095692315eb094ebdc0cdda83427363b259a4bba5831146951476a72a7a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a8969eb8118cc51efde926c5e24ab1885bd945e9e1e79333b947414be24ccca(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca85fdcc1d395951feda2ed39d8c56e400a5d42e159a286c7b55aad46ee3a1b6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b26e0c983054fa219cbd191abef98e98053d5935a31f9ddcba6fc0afa7b1263(
    value: typing.Optional[VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc7b6079aec0e0d079a9e5a1a46231992f58a69f10f8feb61789d764edfdd742(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a535df1dfe69761d32041c46a1224dcd0c3f55216669ee7749d341f847ff3ef(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5aafef8108ba2543d004dc57b0e0e57f90e3e29c9616b95dcd2a255584730fb0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__daf0d617f2d05cbfe240d6744af177fec13003bcf7767c387663c3456e065f89(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VpclatticeListenerRuleMatchHttpMatchHeaderMatches]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ec3150525eab5e3d8ee918d4f03449922af5370b40071d2d8c248281fcb9dfd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f69032c2fe1ea33c4d942a4916753853b25c321ea292cc57b90e10ea55dc4bd9(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VpclatticeListenerRuleMatchHttpMatchHeaderMatches, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1036db299ef13f733f8b11cb50397ead89058e735bd882162009e7fab5154d5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ff86704d615d6aa980015d9bad24593f5dffd49b0af8ec4ab09a35cb707ec49(
    value: typing.Optional[VpclatticeListenerRuleMatchHttpMatch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a5a5baf7b2b17e1e48180deee2afe1309e5d0fbff86e1d49a3b1847c091eff7(
    *,
    match: typing.Union[VpclatticeListenerRuleMatchHttpMatchPathMatchMatch, typing.Dict[builtins.str, typing.Any]],
    case_sensitive: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b217a4202af0e365782dd49238fdbf5e4ffe9a35a8094aba8c1f34f29ae5d89(
    *,
    exact: typing.Optional[builtins.str] = None,
    prefix: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3cb9c950b7c6dbe82c7ca0846df0f9117b692f1370ae0acd94415fabc9693b5d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5514efb191696e3d1b42c63991f48d9d0c5cf48f849fa7097b5a9d56396d0a8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a313abd15c99133f43652fae39132223092f4b9e36fb006a7fcf84f6a9e8fd4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c0f81a9efb8a410b803f9d3f35f3a5555baccad6c3ad695bb1bf06aa69ab4b3(
    value: typing.Optional[VpclatticeListenerRuleMatchHttpMatchPathMatchMatch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8522748de0db8253fa6f42588a6e44d50aec439b99fb63be3c44cb1f3f361ce3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e62f3a194b4211f817a841e4aeab3ab23f366dddf8b384a4de3828f253cd1ef9(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60d1ee837d8f26480d69b0df8872dd13cfdde0be465b683b5c689c2d699acbc5(
    value: typing.Optional[VpclatticeListenerRuleMatchHttpMatchPathMatch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2442a25851daa11731d50053d52b83f08962dc1af80863fde7d8900034cd7a5a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3bc89fcc4cc12096926a41c939fd276658124c3a5adc48f41487f808792d7bc(
    value: typing.Optional[VpclatticeListenerRuleMatch],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6949415e6297c197747d844f1013c675b677cc4466ea5b6d480c46ea0668de7c(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1fdda5bf10cb90457557f041c11762d61301ece4487fe63bda546ab5fd7b491(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__589f7935a27acac0276e282f1127916fd75e847fa025aba573fa149ace62f470(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4014fd1946e1b2d264188842c42b7c6e439d300e7b250a39d2b2e3d00c872427(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__129457977d2de3bd54581bafda8c2b717fae2907240cdf602d8fd7a82826cb96(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8b735206e12328a34891eea5ee6764370e1f3e7e0bf6a02173f5f8b5cabb754(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VpclatticeListenerRuleTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
