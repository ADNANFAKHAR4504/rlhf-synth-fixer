r'''
# `aws_bedrockagent_agent`

Refer to the Terraform Registry for docs: [`aws_bedrockagent_agent`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent).
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


class BedrockagentAgent(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.bedrockagentAgent.BedrockagentAgent",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent aws_bedrockagent_agent}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        agent_name: builtins.str,
        agent_resource_role_arn: builtins.str,
        foundation_model: builtins.str,
        agent_collaboration: typing.Optional[builtins.str] = None,
        customer_encryption_key_arn: typing.Optional[builtins.str] = None,
        description: typing.Optional[builtins.str] = None,
        guardrail_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BedrockagentAgentGuardrailConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        idle_session_ttl_in_seconds: typing.Optional[jsii.Number] = None,
        instruction: typing.Optional[builtins.str] = None,
        memory_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BedrockagentAgentMemoryConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        prepare_agent: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        prompt_override_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BedrockagentAgentPromptOverrideConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        skip_resource_in_use_check: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["BedrockagentAgentTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent aws_bedrockagent_agent} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param agent_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_name BedrockagentAgent#agent_name}.
        :param agent_resource_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_resource_role_arn BedrockagentAgent#agent_resource_role_arn}.
        :param foundation_model: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#foundation_model BedrockagentAgent#foundation_model}.
        :param agent_collaboration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_collaboration BedrockagentAgent#agent_collaboration}.
        :param customer_encryption_key_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#customer_encryption_key_arn BedrockagentAgent#customer_encryption_key_arn}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#description BedrockagentAgent#description}.
        :param guardrail_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_configuration BedrockagentAgent#guardrail_configuration}.
        :param idle_session_ttl_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#idle_session_ttl_in_seconds BedrockagentAgent#idle_session_ttl_in_seconds}.
        :param instruction: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#instruction BedrockagentAgent#instruction}.
        :param memory_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#memory_configuration BedrockagentAgent#memory_configuration}.
        :param prepare_agent: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prepare_agent BedrockagentAgent#prepare_agent}.
        :param prompt_override_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_override_configuration BedrockagentAgent#prompt_override_configuration}.
        :param skip_resource_in_use_check: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#skip_resource_in_use_check BedrockagentAgent#skip_resource_in_use_check}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#tags BedrockagentAgent#tags}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#timeouts BedrockagentAgent#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__635c3142f9ceec313cdc14bf3f8d3cb4dee85d9e225de1d87e25b79302d9f6aa)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = BedrockagentAgentConfig(
            agent_name=agent_name,
            agent_resource_role_arn=agent_resource_role_arn,
            foundation_model=foundation_model,
            agent_collaboration=agent_collaboration,
            customer_encryption_key_arn=customer_encryption_key_arn,
            description=description,
            guardrail_configuration=guardrail_configuration,
            idle_session_ttl_in_seconds=idle_session_ttl_in_seconds,
            instruction=instruction,
            memory_configuration=memory_configuration,
            prepare_agent=prepare_agent,
            prompt_override_configuration=prompt_override_configuration,
            skip_resource_in_use_check=skip_resource_in_use_check,
            tags=tags,
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
        '''Generates CDKTF code for importing a BedrockagentAgent resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the BedrockagentAgent to import.
        :param import_from_id: The id of the existing BedrockagentAgent that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the BedrockagentAgent to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__51ef9b63a3ab90e8d653917d46247bedbe669ba83b62abf40f86dbc7373425e0)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putGuardrailConfiguration")
    def put_guardrail_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BedrockagentAgentGuardrailConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8bee035729064eee1c51875edd2e8acd5ff63eca48402a7f09f50c3088ace075)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putGuardrailConfiguration", [value]))

    @jsii.member(jsii_name="putMemoryConfiguration")
    def put_memory_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BedrockagentAgentMemoryConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2253b5f674b8c24fa3988a7dd303d9bc30c89502f63907fa4ab100bfe35bd8fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putMemoryConfiguration", [value]))

    @jsii.member(jsii_name="putPromptOverrideConfiguration")
    def put_prompt_override_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BedrockagentAgentPromptOverrideConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c369c17c62a2732a724ed1f59cdea0e59cff00dc28f3c103b3d5a00d6e0cd729)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPromptOverrideConfiguration", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#create BedrockagentAgent#create}
        :param delete: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#delete BedrockagentAgent#delete}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#update BedrockagentAgent#update}
        '''
        value = BedrockagentAgentTimeouts(create=create, delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetAgentCollaboration")
    def reset_agent_collaboration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAgentCollaboration", []))

    @jsii.member(jsii_name="resetCustomerEncryptionKeyArn")
    def reset_customer_encryption_key_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomerEncryptionKeyArn", []))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @jsii.member(jsii_name="resetGuardrailConfiguration")
    def reset_guardrail_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGuardrailConfiguration", []))

    @jsii.member(jsii_name="resetIdleSessionTtlInSeconds")
    def reset_idle_session_ttl_in_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdleSessionTtlInSeconds", []))

    @jsii.member(jsii_name="resetInstruction")
    def reset_instruction(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstruction", []))

    @jsii.member(jsii_name="resetMemoryConfiguration")
    def reset_memory_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMemoryConfiguration", []))

    @jsii.member(jsii_name="resetPrepareAgent")
    def reset_prepare_agent(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrepareAgent", []))

    @jsii.member(jsii_name="resetPromptOverrideConfiguration")
    def reset_prompt_override_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPromptOverrideConfiguration", []))

    @jsii.member(jsii_name="resetSkipResourceInUseCheck")
    def reset_skip_resource_in_use_check(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSkipResourceInUseCheck", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

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
    @jsii.member(jsii_name="agentArn")
    def agent_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "agentArn"))

    @builtins.property
    @jsii.member(jsii_name="agentId")
    def agent_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "agentId"))

    @builtins.property
    @jsii.member(jsii_name="agentVersion")
    def agent_version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "agentVersion"))

    @builtins.property
    @jsii.member(jsii_name="guardrailConfiguration")
    def guardrail_configuration(self) -> "BedrockagentAgentGuardrailConfigurationList":
        return typing.cast("BedrockagentAgentGuardrailConfigurationList", jsii.get(self, "guardrailConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @builtins.property
    @jsii.member(jsii_name="memoryConfiguration")
    def memory_configuration(self) -> "BedrockagentAgentMemoryConfigurationList":
        return typing.cast("BedrockagentAgentMemoryConfigurationList", jsii.get(self, "memoryConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="preparedAt")
    def prepared_at(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "preparedAt"))

    @builtins.property
    @jsii.member(jsii_name="promptOverrideConfiguration")
    def prompt_override_configuration(
        self,
    ) -> "BedrockagentAgentPromptOverrideConfigurationList":
        return typing.cast("BedrockagentAgentPromptOverrideConfigurationList", jsii.get(self, "promptOverrideConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> _cdktf_9a9027ec.StringMap:
        return typing.cast(_cdktf_9a9027ec.StringMap, jsii.get(self, "tagsAll"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "BedrockagentAgentTimeoutsOutputReference":
        return typing.cast("BedrockagentAgentTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="agentCollaborationInput")
    def agent_collaboration_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "agentCollaborationInput"))

    @builtins.property
    @jsii.member(jsii_name="agentNameInput")
    def agent_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "agentNameInput"))

    @builtins.property
    @jsii.member(jsii_name="agentResourceRoleArnInput")
    def agent_resource_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "agentResourceRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="customerEncryptionKeyArnInput")
    def customer_encryption_key_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "customerEncryptionKeyArnInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="foundationModelInput")
    def foundation_model_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "foundationModelInput"))

    @builtins.property
    @jsii.member(jsii_name="guardrailConfigurationInput")
    def guardrail_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentGuardrailConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentGuardrailConfiguration"]]], jsii.get(self, "guardrailConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="idleSessionTtlInSecondsInput")
    def idle_session_ttl_in_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "idleSessionTtlInSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="instructionInput")
    def instruction_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "instructionInput"))

    @builtins.property
    @jsii.member(jsii_name="memoryConfigurationInput")
    def memory_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentMemoryConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentMemoryConfiguration"]]], jsii.get(self, "memoryConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="prepareAgentInput")
    def prepare_agent_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "prepareAgentInput"))

    @builtins.property
    @jsii.member(jsii_name="promptOverrideConfigurationInput")
    def prompt_override_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentPromptOverrideConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentPromptOverrideConfiguration"]]], jsii.get(self, "promptOverrideConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="skipResourceInUseCheckInput")
    def skip_resource_in_use_check_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "skipResourceInUseCheckInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "BedrockagentAgentTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "BedrockagentAgentTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="agentCollaboration")
    def agent_collaboration(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "agentCollaboration"))

    @agent_collaboration.setter
    def agent_collaboration(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0bbfe35a0ddf75bbd234e93c5eb8ec71b1f7dc4b885ed622b03b4c4706eac4b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "agentCollaboration", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="agentName")
    def agent_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "agentName"))

    @agent_name.setter
    def agent_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2179b999344b2cda25663258863239568400a180a3c46912d43d776ed128d91f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "agentName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="agentResourceRoleArn")
    def agent_resource_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "agentResourceRoleArn"))

    @agent_resource_role_arn.setter
    def agent_resource_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__00046ab410ca77d068bae2862ed3683a8b3bcf8039ee0de59b7bb8a3de554ae2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "agentResourceRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="customerEncryptionKeyArn")
    def customer_encryption_key_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "customerEncryptionKeyArn"))

    @customer_encryption_key_arn.setter
    def customer_encryption_key_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4478dac692b8a03a662f53f601c58a0d4750fcc61bd27d680a8a8b7bcfda221d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "customerEncryptionKeyArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae4f891a84920a53114e25727347b146d5dcc49ce9f09169ca765ec51b959f51)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="foundationModel")
    def foundation_model(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "foundationModel"))

    @foundation_model.setter
    def foundation_model(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d47113fdfac1cb92c9f5e4cdd2604815bf30bfdf2ed8ed7dffcfdae182c569f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "foundationModel", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="idleSessionTtlInSeconds")
    def idle_session_ttl_in_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "idleSessionTtlInSeconds"))

    @idle_session_ttl_in_seconds.setter
    def idle_session_ttl_in_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__38580c01fcb87161a2e9e510c12d3455e89c496fb6d961e719c065a7ce53326a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "idleSessionTtlInSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="instruction")
    def instruction(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "instruction"))

    @instruction.setter
    def instruction(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12ff4ea11ee12b89c74d881484409ddf1e7182450b8ecf0dd8d745012df3cac5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instruction", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="prepareAgent")
    def prepare_agent(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "prepareAgent"))

    @prepare_agent.setter
    def prepare_agent(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b0d7b1dc802e669d1728a2b1efad649737a92de932bd4c74482f06fa2055d3ea)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "prepareAgent", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="skipResourceInUseCheck")
    def skip_resource_in_use_check(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "skipResourceInUseCheck"))

    @skip_resource_in_use_check.setter
    def skip_resource_in_use_check(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3574a6a5d37238df654e466524bc8766fd7c43b68b004791b1e6c9d75bfd140b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "skipResourceInUseCheck", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a35e94ee140d275480906ca0072cf6d827f5455ddb1678907551184762338c8c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "agent_name": "agentName",
        "agent_resource_role_arn": "agentResourceRoleArn",
        "foundation_model": "foundationModel",
        "agent_collaboration": "agentCollaboration",
        "customer_encryption_key_arn": "customerEncryptionKeyArn",
        "description": "description",
        "guardrail_configuration": "guardrailConfiguration",
        "idle_session_ttl_in_seconds": "idleSessionTtlInSeconds",
        "instruction": "instruction",
        "memory_configuration": "memoryConfiguration",
        "prepare_agent": "prepareAgent",
        "prompt_override_configuration": "promptOverrideConfiguration",
        "skip_resource_in_use_check": "skipResourceInUseCheck",
        "tags": "tags",
        "timeouts": "timeouts",
    },
)
class BedrockagentAgentConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        agent_name: builtins.str,
        agent_resource_role_arn: builtins.str,
        foundation_model: builtins.str,
        agent_collaboration: typing.Optional[builtins.str] = None,
        customer_encryption_key_arn: typing.Optional[builtins.str] = None,
        description: typing.Optional[builtins.str] = None,
        guardrail_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BedrockagentAgentGuardrailConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        idle_session_ttl_in_seconds: typing.Optional[jsii.Number] = None,
        instruction: typing.Optional[builtins.str] = None,
        memory_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BedrockagentAgentMemoryConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        prepare_agent: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        prompt_override_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BedrockagentAgentPromptOverrideConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        skip_resource_in_use_check: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeouts: typing.Optional[typing.Union["BedrockagentAgentTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param agent_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_name BedrockagentAgent#agent_name}.
        :param agent_resource_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_resource_role_arn BedrockagentAgent#agent_resource_role_arn}.
        :param foundation_model: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#foundation_model BedrockagentAgent#foundation_model}.
        :param agent_collaboration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_collaboration BedrockagentAgent#agent_collaboration}.
        :param customer_encryption_key_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#customer_encryption_key_arn BedrockagentAgent#customer_encryption_key_arn}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#description BedrockagentAgent#description}.
        :param guardrail_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_configuration BedrockagentAgent#guardrail_configuration}.
        :param idle_session_ttl_in_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#idle_session_ttl_in_seconds BedrockagentAgent#idle_session_ttl_in_seconds}.
        :param instruction: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#instruction BedrockagentAgent#instruction}.
        :param memory_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#memory_configuration BedrockagentAgent#memory_configuration}.
        :param prepare_agent: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prepare_agent BedrockagentAgent#prepare_agent}.
        :param prompt_override_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_override_configuration BedrockagentAgent#prompt_override_configuration}.
        :param skip_resource_in_use_check: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#skip_resource_in_use_check BedrockagentAgent#skip_resource_in_use_check}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#tags BedrockagentAgent#tags}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#timeouts BedrockagentAgent#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(timeouts, dict):
            timeouts = BedrockagentAgentTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c939ae2dc5bab9e0bd8a0b9aa7f1e1c7961cf19c38aceb817632a6551fe060f)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument agent_name", value=agent_name, expected_type=type_hints["agent_name"])
            check_type(argname="argument agent_resource_role_arn", value=agent_resource_role_arn, expected_type=type_hints["agent_resource_role_arn"])
            check_type(argname="argument foundation_model", value=foundation_model, expected_type=type_hints["foundation_model"])
            check_type(argname="argument agent_collaboration", value=agent_collaboration, expected_type=type_hints["agent_collaboration"])
            check_type(argname="argument customer_encryption_key_arn", value=customer_encryption_key_arn, expected_type=type_hints["customer_encryption_key_arn"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
            check_type(argname="argument guardrail_configuration", value=guardrail_configuration, expected_type=type_hints["guardrail_configuration"])
            check_type(argname="argument idle_session_ttl_in_seconds", value=idle_session_ttl_in_seconds, expected_type=type_hints["idle_session_ttl_in_seconds"])
            check_type(argname="argument instruction", value=instruction, expected_type=type_hints["instruction"])
            check_type(argname="argument memory_configuration", value=memory_configuration, expected_type=type_hints["memory_configuration"])
            check_type(argname="argument prepare_agent", value=prepare_agent, expected_type=type_hints["prepare_agent"])
            check_type(argname="argument prompt_override_configuration", value=prompt_override_configuration, expected_type=type_hints["prompt_override_configuration"])
            check_type(argname="argument skip_resource_in_use_check", value=skip_resource_in_use_check, expected_type=type_hints["skip_resource_in_use_check"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "agent_name": agent_name,
            "agent_resource_role_arn": agent_resource_role_arn,
            "foundation_model": foundation_model,
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
        if agent_collaboration is not None:
            self._values["agent_collaboration"] = agent_collaboration
        if customer_encryption_key_arn is not None:
            self._values["customer_encryption_key_arn"] = customer_encryption_key_arn
        if description is not None:
            self._values["description"] = description
        if guardrail_configuration is not None:
            self._values["guardrail_configuration"] = guardrail_configuration
        if idle_session_ttl_in_seconds is not None:
            self._values["idle_session_ttl_in_seconds"] = idle_session_ttl_in_seconds
        if instruction is not None:
            self._values["instruction"] = instruction
        if memory_configuration is not None:
            self._values["memory_configuration"] = memory_configuration
        if prepare_agent is not None:
            self._values["prepare_agent"] = prepare_agent
        if prompt_override_configuration is not None:
            self._values["prompt_override_configuration"] = prompt_override_configuration
        if skip_resource_in_use_check is not None:
            self._values["skip_resource_in_use_check"] = skip_resource_in_use_check
        if tags is not None:
            self._values["tags"] = tags
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
    def agent_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_name BedrockagentAgent#agent_name}.'''
        result = self._values.get("agent_name")
        assert result is not None, "Required property 'agent_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def agent_resource_role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_resource_role_arn BedrockagentAgent#agent_resource_role_arn}.'''
        result = self._values.get("agent_resource_role_arn")
        assert result is not None, "Required property 'agent_resource_role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def foundation_model(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#foundation_model BedrockagentAgent#foundation_model}.'''
        result = self._values.get("foundation_model")
        assert result is not None, "Required property 'foundation_model' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def agent_collaboration(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#agent_collaboration BedrockagentAgent#agent_collaboration}.'''
        result = self._values.get("agent_collaboration")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def customer_encryption_key_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#customer_encryption_key_arn BedrockagentAgent#customer_encryption_key_arn}.'''
        result = self._values.get("customer_encryption_key_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#description BedrockagentAgent#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def guardrail_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentGuardrailConfiguration"]]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_configuration BedrockagentAgent#guardrail_configuration}.'''
        result = self._values.get("guardrail_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentGuardrailConfiguration"]]], result)

    @builtins.property
    def idle_session_ttl_in_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#idle_session_ttl_in_seconds BedrockagentAgent#idle_session_ttl_in_seconds}.'''
        result = self._values.get("idle_session_ttl_in_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def instruction(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#instruction BedrockagentAgent#instruction}.'''
        result = self._values.get("instruction")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def memory_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentMemoryConfiguration"]]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#memory_configuration BedrockagentAgent#memory_configuration}.'''
        result = self._values.get("memory_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentMemoryConfiguration"]]], result)

    @builtins.property
    def prepare_agent(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prepare_agent BedrockagentAgent#prepare_agent}.'''
        result = self._values.get("prepare_agent")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def prompt_override_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentPromptOverrideConfiguration"]]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_override_configuration BedrockagentAgent#prompt_override_configuration}.'''
        result = self._values.get("prompt_override_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentPromptOverrideConfiguration"]]], result)

    @builtins.property
    def skip_resource_in_use_check(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#skip_resource_in_use_check BedrockagentAgent#skip_resource_in_use_check}.'''
        result = self._values.get("skip_resource_in_use_check")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#tags BedrockagentAgent#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["BedrockagentAgentTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#timeouts BedrockagentAgent#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["BedrockagentAgentTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BedrockagentAgentConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentGuardrailConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "guardrail_identifier": "guardrailIdentifier",
        "guardrail_version": "guardrailVersion",
    },
)
class BedrockagentAgentGuardrailConfiguration:
    def __init__(
        self,
        *,
        guardrail_identifier: typing.Optional[builtins.str] = None,
        guardrail_version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param guardrail_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_identifier BedrockagentAgent#guardrail_identifier}.
        :param guardrail_version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_version BedrockagentAgent#guardrail_version}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9a71d08b63b60b701790990b894cb7198fb35a3ff962d5aebb83c1f388331ff9)
            check_type(argname="argument guardrail_identifier", value=guardrail_identifier, expected_type=type_hints["guardrail_identifier"])
            check_type(argname="argument guardrail_version", value=guardrail_version, expected_type=type_hints["guardrail_version"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if guardrail_identifier is not None:
            self._values["guardrail_identifier"] = guardrail_identifier
        if guardrail_version is not None:
            self._values["guardrail_version"] = guardrail_version

    @builtins.property
    def guardrail_identifier(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_identifier BedrockagentAgent#guardrail_identifier}.'''
        result = self._values.get("guardrail_identifier")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def guardrail_version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_version BedrockagentAgent#guardrail_version}.'''
        result = self._values.get("guardrail_version")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BedrockagentAgentGuardrailConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BedrockagentAgentGuardrailConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentGuardrailConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1975d3b7bfc76c343b78dc77b82f19ad9942341d7c686d3bf8e2da7675562bfd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BedrockagentAgentGuardrailConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21376a207f3804ad7d534ac9f7cd8612e8ff0ecbe761812590477c52ed58ff43)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BedrockagentAgentGuardrailConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0347757f95076d625eaaa5358f9dfb99a37ae0a3235bf1c675f35b6311d31b59)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2fbc357058f38e024c537ffb63ba7118ae524934726ae06298cfc34ab57f13a4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0bdf911b52122910a6afd6dc4c6788acc9d6a140736af941b813095c8319976c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentGuardrailConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentGuardrailConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentGuardrailConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fa1159999db5d4fb80fbcc9be992e2bc7b25d763fc4d36b95b6e9eb0604ace72)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BedrockagentAgentGuardrailConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentGuardrailConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__27c11fa0460146329679396d3296c052ef62e61c8300b21fdf763d891da21165)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetGuardrailIdentifier")
    def reset_guardrail_identifier(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGuardrailIdentifier", []))

    @jsii.member(jsii_name="resetGuardrailVersion")
    def reset_guardrail_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGuardrailVersion", []))

    @builtins.property
    @jsii.member(jsii_name="guardrailIdentifierInput")
    def guardrail_identifier_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "guardrailIdentifierInput"))

    @builtins.property
    @jsii.member(jsii_name="guardrailVersionInput")
    def guardrail_version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "guardrailVersionInput"))

    @builtins.property
    @jsii.member(jsii_name="guardrailIdentifier")
    def guardrail_identifier(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "guardrailIdentifier"))

    @guardrail_identifier.setter
    def guardrail_identifier(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__677a140bdd208c3165c8fedabc5c9c5c010d6a4613126d0683ac82935244ac38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "guardrailIdentifier", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="guardrailVersion")
    def guardrail_version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "guardrailVersion"))

    @guardrail_version.setter
    def guardrail_version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__71f944daebf51ff74f6cda1ee417b8f6a8ba80cf41ccd64790bf591d3b43513a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "guardrailVersion", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentGuardrailConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentGuardrailConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentGuardrailConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b833ade4c3bfad75a73e25cfe1d39d361d636a9a003d29e18cb012fec28f0b78)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentMemoryConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "enabled_memory_types": "enabledMemoryTypes",
        "storage_days": "storageDays",
    },
)
class BedrockagentAgentMemoryConfiguration:
    def __init__(
        self,
        *,
        enabled_memory_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        storage_days: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param enabled_memory_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#enabled_memory_types BedrockagentAgent#enabled_memory_types}.
        :param storage_days: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#storage_days BedrockagentAgent#storage_days}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d7cd4f620b99ca0adf8511e414f56209659ce26275c7a23105ea4ff358cce8c9)
            check_type(argname="argument enabled_memory_types", value=enabled_memory_types, expected_type=type_hints["enabled_memory_types"])
            check_type(argname="argument storage_days", value=storage_days, expected_type=type_hints["storage_days"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if enabled_memory_types is not None:
            self._values["enabled_memory_types"] = enabled_memory_types
        if storage_days is not None:
            self._values["storage_days"] = storage_days

    @builtins.property
    def enabled_memory_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#enabled_memory_types BedrockagentAgent#enabled_memory_types}.'''
        result = self._values.get("enabled_memory_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def storage_days(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#storage_days BedrockagentAgent#storage_days}.'''
        result = self._values.get("storage_days")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BedrockagentAgentMemoryConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BedrockagentAgentMemoryConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentMemoryConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2756ece677d220f92c90749d6e8a32209beab45c8e2e813c94188be3c982486e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BedrockagentAgentMemoryConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1708cd0ff2471805f202b9e69625d6cf541e7bfa5f8d815b6f0ee452fba95016)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BedrockagentAgentMemoryConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61cf1c3b7c9140a6ed27c34e9e334974994746f28f7169a4c0e4ef8267f78bde)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4544c20fbf879542b18e06b8d443d03f51f51521219ec307e9701b772fb793bc)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ad7932a1f613e676087e80c1b49600b389a763932cbad424ad2d5bf606f7a710)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentMemoryConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentMemoryConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentMemoryConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__413d2bb9e8a256a8a118b3ebbab555bdde7a21c880d05f59d06f27af81800b1a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BedrockagentAgentMemoryConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentMemoryConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ea50220135035ba082b2e2edb6fa8e38212125e0c22bd0a4a586932832e02803)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetEnabledMemoryTypes")
    def reset_enabled_memory_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnabledMemoryTypes", []))

    @jsii.member(jsii_name="resetStorageDays")
    def reset_storage_days(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStorageDays", []))

    @builtins.property
    @jsii.member(jsii_name="enabledMemoryTypesInput")
    def enabled_memory_types_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "enabledMemoryTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="storageDaysInput")
    def storage_days_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "storageDaysInput"))

    @builtins.property
    @jsii.member(jsii_name="enabledMemoryTypes")
    def enabled_memory_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "enabledMemoryTypes"))

    @enabled_memory_types.setter
    def enabled_memory_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6b79108892874adc9f24beffebba96e0e5236e32bfe860ad19860e334d034a3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabledMemoryTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="storageDays")
    def storage_days(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "storageDays"))

    @storage_days.setter
    def storage_days(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6c47e672206aa7904d71f80de4cabc3f895205343086a3cf2e941b1887afffa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "storageDays", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentMemoryConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentMemoryConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentMemoryConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a21c0f308cb814f8d90ecf092c5a899692c660621bd849a1f97953b451e9c0e0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "override_lambda": "overrideLambda",
        "prompt_configurations": "promptConfigurations",
    },
)
class BedrockagentAgentPromptOverrideConfiguration:
    def __init__(
        self,
        *,
        override_lambda: typing.Optional[builtins.str] = None,
        prompt_configurations: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BedrockagentAgentPromptOverrideConfigurationPromptConfigurations", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param override_lambda: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#override_lambda BedrockagentAgent#override_lambda}.
        :param prompt_configurations: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_configurations BedrockagentAgent#prompt_configurations}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8db2f51794d755b64fd7ab1035660a9e2802d2d80bebcf2519c195a0ecf911da)
            check_type(argname="argument override_lambda", value=override_lambda, expected_type=type_hints["override_lambda"])
            check_type(argname="argument prompt_configurations", value=prompt_configurations, expected_type=type_hints["prompt_configurations"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if override_lambda is not None:
            self._values["override_lambda"] = override_lambda
        if prompt_configurations is not None:
            self._values["prompt_configurations"] = prompt_configurations

    @builtins.property
    def override_lambda(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#override_lambda BedrockagentAgent#override_lambda}.'''
        result = self._values.get("override_lambda")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def prompt_configurations(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentPromptOverrideConfigurationPromptConfigurations"]]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_configurations BedrockagentAgent#prompt_configurations}.'''
        result = self._values.get("prompt_configurations")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentPromptOverrideConfigurationPromptConfigurations"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BedrockagentAgentPromptOverrideConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BedrockagentAgentPromptOverrideConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__27a99ea6a769a265b156e33f65b5cbe5b06e4b03ca8c26a561ca7ae735e435a9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BedrockagentAgentPromptOverrideConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f9da706850d647457f8dc9feae7d1be5a1f9df5ddc031865002045b3076b38e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BedrockagentAgentPromptOverrideConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ca864d287e5aa005259dc8718a8ebb02398d909eeee200992d2eb6f7d662c6a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d0dd446eb10f3ea7e3bb167494d5d64c5c80d5990abec931bcb14b35b2ee2f79)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6ce3cf9ddb390f71312c1d538135b105b6573f6d4cffd09fd3612c93df927e79)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e6c64d7aaa15d899031b7de6c9cea3f14b3c3cc2ebb25f31c4f2ec200b19469)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BedrockagentAgentPromptOverrideConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6fe1c17d180be69c01caa64c68c702f6daf223477ee6a7311ba419fd474968bd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putPromptConfigurations")
    def put_prompt_configurations(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BedrockagentAgentPromptOverrideConfigurationPromptConfigurations", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__491a01656e958d31b60d24d3d20ed7fcb906fca8bcc5763540aef69ec2f556ad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPromptConfigurations", [value]))

    @jsii.member(jsii_name="resetOverrideLambda")
    def reset_override_lambda(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOverrideLambda", []))

    @jsii.member(jsii_name="resetPromptConfigurations")
    def reset_prompt_configurations(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPromptConfigurations", []))

    @builtins.property
    @jsii.member(jsii_name="promptConfigurations")
    def prompt_configurations(
        self,
    ) -> "BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsList":
        return typing.cast("BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsList", jsii.get(self, "promptConfigurations"))

    @builtins.property
    @jsii.member(jsii_name="overrideLambdaInput")
    def override_lambda_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "overrideLambdaInput"))

    @builtins.property
    @jsii.member(jsii_name="promptConfigurationsInput")
    def prompt_configurations_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentPromptOverrideConfigurationPromptConfigurations"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentPromptOverrideConfigurationPromptConfigurations"]]], jsii.get(self, "promptConfigurationsInput"))

    @builtins.property
    @jsii.member(jsii_name="overrideLambda")
    def override_lambda(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "overrideLambda"))

    @override_lambda.setter
    def override_lambda(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0dce573c293f1d4ea7096ceb0ee2801159230359bfa6901124644bb4969e8e0d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "overrideLambda", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentPromptOverrideConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentPromptOverrideConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentPromptOverrideConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__895f69430658509a87cefca8e9c8429d7d77844e41901aa8596960cdcded7e6c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurations",
    jsii_struct_bases=[],
    name_mapping={
        "base_prompt_template": "basePromptTemplate",
        "inference_configuration": "inferenceConfiguration",
        "parser_mode": "parserMode",
        "prompt_creation_mode": "promptCreationMode",
        "prompt_state": "promptState",
        "prompt_type": "promptType",
    },
)
class BedrockagentAgentPromptOverrideConfigurationPromptConfigurations:
    def __init__(
        self,
        *,
        base_prompt_template: typing.Optional[builtins.str] = None,
        inference_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        parser_mode: typing.Optional[builtins.str] = None,
        prompt_creation_mode: typing.Optional[builtins.str] = None,
        prompt_state: typing.Optional[builtins.str] = None,
        prompt_type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param base_prompt_template: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#base_prompt_template BedrockagentAgent#base_prompt_template}.
        :param inference_configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#inference_configuration BedrockagentAgent#inference_configuration}.
        :param parser_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#parser_mode BedrockagentAgent#parser_mode}.
        :param prompt_creation_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_creation_mode BedrockagentAgent#prompt_creation_mode}.
        :param prompt_state: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_state BedrockagentAgent#prompt_state}.
        :param prompt_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_type BedrockagentAgent#prompt_type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2c51db3b775bdbe2f32e97db069603d51dd835d299ee55ec25de3931b609c382)
            check_type(argname="argument base_prompt_template", value=base_prompt_template, expected_type=type_hints["base_prompt_template"])
            check_type(argname="argument inference_configuration", value=inference_configuration, expected_type=type_hints["inference_configuration"])
            check_type(argname="argument parser_mode", value=parser_mode, expected_type=type_hints["parser_mode"])
            check_type(argname="argument prompt_creation_mode", value=prompt_creation_mode, expected_type=type_hints["prompt_creation_mode"])
            check_type(argname="argument prompt_state", value=prompt_state, expected_type=type_hints["prompt_state"])
            check_type(argname="argument prompt_type", value=prompt_type, expected_type=type_hints["prompt_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if base_prompt_template is not None:
            self._values["base_prompt_template"] = base_prompt_template
        if inference_configuration is not None:
            self._values["inference_configuration"] = inference_configuration
        if parser_mode is not None:
            self._values["parser_mode"] = parser_mode
        if prompt_creation_mode is not None:
            self._values["prompt_creation_mode"] = prompt_creation_mode
        if prompt_state is not None:
            self._values["prompt_state"] = prompt_state
        if prompt_type is not None:
            self._values["prompt_type"] = prompt_type

    @builtins.property
    def base_prompt_template(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#base_prompt_template BedrockagentAgent#base_prompt_template}.'''
        result = self._values.get("base_prompt_template")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def inference_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration"]]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#inference_configuration BedrockagentAgent#inference_configuration}.'''
        result = self._values.get("inference_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration"]]], result)

    @builtins.property
    def parser_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#parser_mode BedrockagentAgent#parser_mode}.'''
        result = self._values.get("parser_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def prompt_creation_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_creation_mode BedrockagentAgent#prompt_creation_mode}.'''
        result = self._values.get("prompt_creation_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def prompt_state(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_state BedrockagentAgent#prompt_state}.'''
        result = self._values.get("prompt_state")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def prompt_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_type BedrockagentAgent#prompt_type}.'''
        result = self._values.get("prompt_type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BedrockagentAgentPromptOverrideConfigurationPromptConfigurations(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "max_length": "maxLength",
        "stop_sequences": "stopSequences",
        "temperature": "temperature",
        "top_k": "topK",
        "top_p": "topP",
    },
)
class BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration:
    def __init__(
        self,
        *,
        max_length: typing.Optional[jsii.Number] = None,
        stop_sequences: typing.Optional[typing.Sequence[builtins.str]] = None,
        temperature: typing.Optional[jsii.Number] = None,
        top_k: typing.Optional[jsii.Number] = None,
        top_p: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param max_length: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#max_length BedrockagentAgent#max_length}.
        :param stop_sequences: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#stop_sequences BedrockagentAgent#stop_sequences}.
        :param temperature: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#temperature BedrockagentAgent#temperature}.
        :param top_k: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#top_k BedrockagentAgent#top_k}.
        :param top_p: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#top_p BedrockagentAgent#top_p}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2093562da9cb8079ce30d08b3c605dfec04aa8ad6ed89d8ca9195077e0ed6178)
            check_type(argname="argument max_length", value=max_length, expected_type=type_hints["max_length"])
            check_type(argname="argument stop_sequences", value=stop_sequences, expected_type=type_hints["stop_sequences"])
            check_type(argname="argument temperature", value=temperature, expected_type=type_hints["temperature"])
            check_type(argname="argument top_k", value=top_k, expected_type=type_hints["top_k"])
            check_type(argname="argument top_p", value=top_p, expected_type=type_hints["top_p"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max_length is not None:
            self._values["max_length"] = max_length
        if stop_sequences is not None:
            self._values["stop_sequences"] = stop_sequences
        if temperature is not None:
            self._values["temperature"] = temperature
        if top_k is not None:
            self._values["top_k"] = top_k
        if top_p is not None:
            self._values["top_p"] = top_p

    @builtins.property
    def max_length(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#max_length BedrockagentAgent#max_length}.'''
        result = self._values.get("max_length")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def stop_sequences(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#stop_sequences BedrockagentAgent#stop_sequences}.'''
        result = self._values.get("stop_sequences")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def temperature(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#temperature BedrockagentAgent#temperature}.'''
        result = self._values.get("temperature")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def top_k(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#top_k BedrockagentAgent#top_k}.'''
        result = self._values.get("top_k")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def top_p(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#top_p BedrockagentAgent#top_p}.'''
        result = self._values.get("top_p")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3b829cbf9e06a7536f7daaeab1435729ba45485f537c5c76423a510086dbba40)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5fbdcfc65d2e87c09e9c76ddeb95921b5a8f80548a668b333ba6a58d2a26cfc1)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3740f7e8b42fd08a373226e6cee94c755644c34a7e5e836e0b870460a8adb80)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d6e95ae14a97704154f2c744c837b6577cf730c75f5cfd27ed8e8961edfd1f88)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f556d96a1ddaa9d4b4044332cd30412e3135cbb9ed7ec7eaf8e68784bc1d98b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__584216e7bc0018599014e3f4e0a9a9b0a2fe0560c8e35dd1845d87ee4c35fe78)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c9f9ba28da1b72b790d517cf694276f4ba68fafbf7e89a99b9a95fcd95ba2635)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetMaxLength")
    def reset_max_length(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxLength", []))

    @jsii.member(jsii_name="resetStopSequences")
    def reset_stop_sequences(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStopSequences", []))

    @jsii.member(jsii_name="resetTemperature")
    def reset_temperature(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTemperature", []))

    @jsii.member(jsii_name="resetTopK")
    def reset_top_k(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTopK", []))

    @jsii.member(jsii_name="resetTopP")
    def reset_top_p(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTopP", []))

    @builtins.property
    @jsii.member(jsii_name="maxLengthInput")
    def max_length_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxLengthInput"))

    @builtins.property
    @jsii.member(jsii_name="stopSequencesInput")
    def stop_sequences_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "stopSequencesInput"))

    @builtins.property
    @jsii.member(jsii_name="temperatureInput")
    def temperature_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "temperatureInput"))

    @builtins.property
    @jsii.member(jsii_name="topKInput")
    def top_k_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "topKInput"))

    @builtins.property
    @jsii.member(jsii_name="topPInput")
    def top_p_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "topPInput"))

    @builtins.property
    @jsii.member(jsii_name="maxLength")
    def max_length(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxLength"))

    @max_length.setter
    def max_length(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__babfa56c85cd99c1fe1d917f705bc2e77dc02c6df659b1e053898bc8b2638e55)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxLength", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="stopSequences")
    def stop_sequences(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "stopSequences"))

    @stop_sequences.setter
    def stop_sequences(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c2b9f7ab298edebff0437a4ef72fffff0ec84658cb419b563395ab0175743c44)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "stopSequences", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="temperature")
    def temperature(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "temperature"))

    @temperature.setter
    def temperature(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1f762dc3fe3d69c253d56de9fc1e7dbdc71c7f0042ec4c74799d559ac6fe8173)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "temperature", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="topK")
    def top_k(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "topK"))

    @top_k.setter
    def top_k(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3572abdd82088aa6c38b1233f345a5fdbc84f111de5b6abb625fd3ff9ed1613)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "topK", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="topP")
    def top_p(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "topP"))

    @top_p.setter
    def top_p(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4f44061b68789389d16c09ac26ab55fe3bf02399ece14c026f64312663b64eb6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "topP", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07aa4c8366bb1f2050e8348fa6d7c8fd3977adc9a56404dda1746754b1385923)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3100421e47995d439fd080fc4b4fa7466f85075024745e38d99b0cee266aba8e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__121516abf11901eaae1606ab0bb8e8f522da30105f984124125e1cdf7f943fa2)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0c7d5886c45cee44278a1363e7e8ba528fe26aecd1a77ea92e7ccbc400a3716)
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
            type_hints = typing.get_type_hints(_typecheckingstub__774d7c7959b3d68a356f88a8b78e5c3509b8691afebe630849bd5fafff314992)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cadd7c36fa5fdd0d20d3abb408539937841c64e3dc9e9ae80648122dedca1691)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfigurationPromptConfigurations]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfigurationPromptConfigurations]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfigurationPromptConfigurations]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3715b11a3a008936f4de042c5697b27609dd7a47bfee49223de4ee93cc675616)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3144b91be3651b75450d0279a9b9352f70450465bef23f6a9b87269c3c7de0ca)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putInferenceConfiguration")
    def put_inference_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__751d151213a702905b71e8709fbfc195084cd4783c25b3f8b362035f4fec8e74)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInferenceConfiguration", [value]))

    @jsii.member(jsii_name="resetBasePromptTemplate")
    def reset_base_prompt_template(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBasePromptTemplate", []))

    @jsii.member(jsii_name="resetInferenceConfiguration")
    def reset_inference_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInferenceConfiguration", []))

    @jsii.member(jsii_name="resetParserMode")
    def reset_parser_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetParserMode", []))

    @jsii.member(jsii_name="resetPromptCreationMode")
    def reset_prompt_creation_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPromptCreationMode", []))

    @jsii.member(jsii_name="resetPromptState")
    def reset_prompt_state(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPromptState", []))

    @jsii.member(jsii_name="resetPromptType")
    def reset_prompt_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPromptType", []))

    @builtins.property
    @jsii.member(jsii_name="inferenceConfiguration")
    def inference_configuration(
        self,
    ) -> BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfigurationList:
        return typing.cast(BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfigurationList, jsii.get(self, "inferenceConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="basePromptTemplateInput")
    def base_prompt_template_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "basePromptTemplateInput"))

    @builtins.property
    @jsii.member(jsii_name="inferenceConfigurationInput")
    def inference_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration]]], jsii.get(self, "inferenceConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="parserModeInput")
    def parser_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "parserModeInput"))

    @builtins.property
    @jsii.member(jsii_name="promptCreationModeInput")
    def prompt_creation_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "promptCreationModeInput"))

    @builtins.property
    @jsii.member(jsii_name="promptStateInput")
    def prompt_state_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "promptStateInput"))

    @builtins.property
    @jsii.member(jsii_name="promptTypeInput")
    def prompt_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "promptTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="basePromptTemplate")
    def base_prompt_template(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "basePromptTemplate"))

    @base_prompt_template.setter
    def base_prompt_template(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8319b33580571763b0ccbabba0dd4265331e0f985b12bcf514cd974ce695a06e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "basePromptTemplate", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="parserMode")
    def parser_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "parserMode"))

    @parser_mode.setter
    def parser_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b5ea726c75d882971bf5f455e9f4d7196747d243e5555ea93a4ff1ac4f421f00)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "parserMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="promptCreationMode")
    def prompt_creation_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "promptCreationMode"))

    @prompt_creation_mode.setter
    def prompt_creation_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a366502484ca9ee109454be5d1ab55c8a7c68b4b867d0fcaa4f2ea1a6d65a5df)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "promptCreationMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="promptState")
    def prompt_state(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "promptState"))

    @prompt_state.setter
    def prompt_state(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e39bd23f048a9328294c1d600c6561eaeeb659a908c5fb6aa6b16922a83408a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "promptState", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="promptType")
    def prompt_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "promptType"))

    @prompt_type.setter
    def prompt_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc74ff04aa845798d7da694e3bd1d16181983450cee908d49eb0e4b88f3cae07)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "promptType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentPromptOverrideConfigurationPromptConfigurations]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentPromptOverrideConfigurationPromptConfigurations]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentPromptOverrideConfigurationPromptConfigurations]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__05b588037e9cd33570b941c87db2a88cc466a4ae51c5f832d5e513e04bb3980c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class BedrockagentAgentTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#create BedrockagentAgent#create}
        :param delete: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#delete BedrockagentAgent#delete}
        :param update: A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#update BedrockagentAgent#update}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8828a23108397ae8d4cad7ef86d433db2a13d34339649fd14f3c78e909616e79)
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
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#create BedrockagentAgent#create}
        '''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours). Setting a timeout for a Delete operation is only applicable if changes are saved into state before the destroy operation occurs.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#delete BedrockagentAgent#delete}
        '''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''A string that can be `parsed as a duration <https://pkg.go.dev/time#ParseDuration>`_ consisting of numbers and unit suffixes, such as "30s" or "2h45m". Valid time units are "s" (seconds), "m" (minutes), "h" (hours).

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#update BedrockagentAgent#update}
        '''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BedrockagentAgentTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BedrockagentAgentTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.bedrockagentAgent.BedrockagentAgentTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6522b4bb9dcff1164bc96d64fd67b2f0c62c8536086c1689fbf78545c3f4fa70)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3efae6a0aae4ed718b92251d73149f00f827edc3cc8b7524bcef6e90c29c88a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d0f95c81d8c805695a28e165c9b6e9c7fc38d56b8413ad08a7272c3eeb516b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c11e6da5ec28994b99ca9ec575dcb31fbf29931225ef533307c5b67548698264)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f47f559cbe75b7c3550a69a627a633b5197b276ab156b24065ca03a99dd24e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "BedrockagentAgent",
    "BedrockagentAgentConfig",
    "BedrockagentAgentGuardrailConfiguration",
    "BedrockagentAgentGuardrailConfigurationList",
    "BedrockagentAgentGuardrailConfigurationOutputReference",
    "BedrockagentAgentMemoryConfiguration",
    "BedrockagentAgentMemoryConfigurationList",
    "BedrockagentAgentMemoryConfigurationOutputReference",
    "BedrockagentAgentPromptOverrideConfiguration",
    "BedrockagentAgentPromptOverrideConfigurationList",
    "BedrockagentAgentPromptOverrideConfigurationOutputReference",
    "BedrockagentAgentPromptOverrideConfigurationPromptConfigurations",
    "BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration",
    "BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfigurationList",
    "BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfigurationOutputReference",
    "BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsList",
    "BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsOutputReference",
    "BedrockagentAgentTimeouts",
    "BedrockagentAgentTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__635c3142f9ceec313cdc14bf3f8d3cb4dee85d9e225de1d87e25b79302d9f6aa(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    agent_name: builtins.str,
    agent_resource_role_arn: builtins.str,
    foundation_model: builtins.str,
    agent_collaboration: typing.Optional[builtins.str] = None,
    customer_encryption_key_arn: typing.Optional[builtins.str] = None,
    description: typing.Optional[builtins.str] = None,
    guardrail_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentGuardrailConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    idle_session_ttl_in_seconds: typing.Optional[jsii.Number] = None,
    instruction: typing.Optional[builtins.str] = None,
    memory_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentMemoryConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    prepare_agent: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    prompt_override_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentPromptOverrideConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    skip_resource_in_use_check: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[BedrockagentAgentTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__51ef9b63a3ab90e8d653917d46247bedbe669ba83b62abf40f86dbc7373425e0(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8bee035729064eee1c51875edd2e8acd5ff63eca48402a7f09f50c3088ace075(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentGuardrailConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2253b5f674b8c24fa3988a7dd303d9bc30c89502f63907fa4ab100bfe35bd8fd(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentMemoryConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c369c17c62a2732a724ed1f59cdea0e59cff00dc28f3c103b3d5a00d6e0cd729(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentPromptOverrideConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0bbfe35a0ddf75bbd234e93c5eb8ec71b1f7dc4b885ed622b03b4c4706eac4b0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2179b999344b2cda25663258863239568400a180a3c46912d43d776ed128d91f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00046ab410ca77d068bae2862ed3683a8b3bcf8039ee0de59b7bb8a3de554ae2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4478dac692b8a03a662f53f601c58a0d4750fcc61bd27d680a8a8b7bcfda221d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae4f891a84920a53114e25727347b146d5dcc49ce9f09169ca765ec51b959f51(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d47113fdfac1cb92c9f5e4cdd2604815bf30bfdf2ed8ed7dffcfdae182c569f9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__38580c01fcb87161a2e9e510c12d3455e89c496fb6d961e719c065a7ce53326a(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12ff4ea11ee12b89c74d881484409ddf1e7182450b8ecf0dd8d745012df3cac5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0d7b1dc802e669d1728a2b1efad649737a92de932bd4c74482f06fa2055d3ea(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3574a6a5d37238df654e466524bc8766fd7c43b68b004791b1e6c9d75bfd140b(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a35e94ee140d275480906ca0072cf6d827f5455ddb1678907551184762338c8c(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c939ae2dc5bab9e0bd8a0b9aa7f1e1c7961cf19c38aceb817632a6551fe060f(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    agent_name: builtins.str,
    agent_resource_role_arn: builtins.str,
    foundation_model: builtins.str,
    agent_collaboration: typing.Optional[builtins.str] = None,
    customer_encryption_key_arn: typing.Optional[builtins.str] = None,
    description: typing.Optional[builtins.str] = None,
    guardrail_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentGuardrailConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    idle_session_ttl_in_seconds: typing.Optional[jsii.Number] = None,
    instruction: typing.Optional[builtins.str] = None,
    memory_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentMemoryConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    prepare_agent: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    prompt_override_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentPromptOverrideConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    skip_resource_in_use_check: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeouts: typing.Optional[typing.Union[BedrockagentAgentTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a71d08b63b60b701790990b894cb7198fb35a3ff962d5aebb83c1f388331ff9(
    *,
    guardrail_identifier: typing.Optional[builtins.str] = None,
    guardrail_version: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1975d3b7bfc76c343b78dc77b82f19ad9942341d7c686d3bf8e2da7675562bfd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21376a207f3804ad7d534ac9f7cd8612e8ff0ecbe761812590477c52ed58ff43(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0347757f95076d625eaaa5358f9dfb99a37ae0a3235bf1c675f35b6311d31b59(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2fbc357058f38e024c537ffb63ba7118ae524934726ae06298cfc34ab57f13a4(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0bdf911b52122910a6afd6dc4c6788acc9d6a140736af941b813095c8319976c(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fa1159999db5d4fb80fbcc9be992e2bc7b25d763fc4d36b95b6e9eb0604ace72(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentGuardrailConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27c11fa0460146329679396d3296c052ef62e61c8300b21fdf763d891da21165(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__677a140bdd208c3165c8fedabc5c9c5c010d6a4613126d0683ac82935244ac38(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__71f944daebf51ff74f6cda1ee417b8f6a8ba80cf41ccd64790bf591d3b43513a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b833ade4c3bfad75a73e25cfe1d39d361d636a9a003d29e18cb012fec28f0b78(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentGuardrailConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7cd4f620b99ca0adf8511e414f56209659ce26275c7a23105ea4ff358cce8c9(
    *,
    enabled_memory_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    storage_days: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2756ece677d220f92c90749d6e8a32209beab45c8e2e813c94188be3c982486e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1708cd0ff2471805f202b9e69625d6cf541e7bfa5f8d815b6f0ee452fba95016(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61cf1c3b7c9140a6ed27c34e9e334974994746f28f7169a4c0e4ef8267f78bde(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4544c20fbf879542b18e06b8d443d03f51f51521219ec307e9701b772fb793bc(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ad7932a1f613e676087e80c1b49600b389a763932cbad424ad2d5bf606f7a710(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__413d2bb9e8a256a8a118b3ebbab555bdde7a21c880d05f59d06f27af81800b1a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentMemoryConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea50220135035ba082b2e2edb6fa8e38212125e0c22bd0a4a586932832e02803(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6b79108892874adc9f24beffebba96e0e5236e32bfe860ad19860e334d034a3(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6c47e672206aa7904d71f80de4cabc3f895205343086a3cf2e941b1887afffa(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a21c0f308cb814f8d90ecf092c5a899692c660621bd849a1f97953b451e9c0e0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentMemoryConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8db2f51794d755b64fd7ab1035660a9e2802d2d80bebcf2519c195a0ecf911da(
    *,
    override_lambda: typing.Optional[builtins.str] = None,
    prompt_configurations: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentPromptOverrideConfigurationPromptConfigurations, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27a99ea6a769a265b156e33f65b5cbe5b06e4b03ca8c26a561ca7ae735e435a9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f9da706850d647457f8dc9feae7d1be5a1f9df5ddc031865002045b3076b38e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ca864d287e5aa005259dc8718a8ebb02398d909eeee200992d2eb6f7d662c6a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0dd446eb10f3ea7e3bb167494d5d64c5c80d5990abec931bcb14b35b2ee2f79(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ce3cf9ddb390f71312c1d538135b105b6573f6d4cffd09fd3612c93df927e79(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e6c64d7aaa15d899031b7de6c9cea3f14b3c3cc2ebb25f31c4f2ec200b19469(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6fe1c17d180be69c01caa64c68c702f6daf223477ee6a7311ba419fd474968bd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__491a01656e958d31b60d24d3d20ed7fcb906fca8bcc5763540aef69ec2f556ad(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentPromptOverrideConfigurationPromptConfigurations, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0dce573c293f1d4ea7096ceb0ee2801159230359bfa6901124644bb4969e8e0d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__895f69430658509a87cefca8e9c8429d7d77844e41901aa8596960cdcded7e6c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentPromptOverrideConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c51db3b775bdbe2f32e97db069603d51dd835d299ee55ec25de3931b609c382(
    *,
    base_prompt_template: typing.Optional[builtins.str] = None,
    inference_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    parser_mode: typing.Optional[builtins.str] = None,
    prompt_creation_mode: typing.Optional[builtins.str] = None,
    prompt_state: typing.Optional[builtins.str] = None,
    prompt_type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2093562da9cb8079ce30d08b3c605dfec04aa8ad6ed89d8ca9195077e0ed6178(
    *,
    max_length: typing.Optional[jsii.Number] = None,
    stop_sequences: typing.Optional[typing.Sequence[builtins.str]] = None,
    temperature: typing.Optional[jsii.Number] = None,
    top_k: typing.Optional[jsii.Number] = None,
    top_p: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b829cbf9e06a7536f7daaeab1435729ba45485f537c5c76423a510086dbba40(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5fbdcfc65d2e87c09e9c76ddeb95921b5a8f80548a668b333ba6a58d2a26cfc1(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3740f7e8b42fd08a373226e6cee94c755644c34a7e5e836e0b870460a8adb80(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d6e95ae14a97704154f2c744c837b6577cf730c75f5cfd27ed8e8961edfd1f88(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f556d96a1ddaa9d4b4044332cd30412e3135cbb9ed7ec7eaf8e68784bc1d98b0(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__584216e7bc0018599014e3f4e0a9a9b0a2fe0560c8e35dd1845d87ee4c35fe78(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c9f9ba28da1b72b790d517cf694276f4ba68fafbf7e89a99b9a95fcd95ba2635(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__babfa56c85cd99c1fe1d917f705bc2e77dc02c6df659b1e053898bc8b2638e55(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2b9f7ab298edebff0437a4ef72fffff0ec84658cb419b563395ab0175743c44(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f762dc3fe3d69c253d56de9fc1e7dbdc71c7f0042ec4c74799d559ac6fe8173(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3572abdd82088aa6c38b1233f345a5fdbc84f111de5b6abb625fd3ff9ed1613(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f44061b68789389d16c09ac26ab55fe3bf02399ece14c026f64312663b64eb6(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07aa4c8366bb1f2050e8348fa6d7c8fd3977adc9a56404dda1746754b1385923(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3100421e47995d439fd080fc4b4fa7466f85075024745e38d99b0cee266aba8e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__121516abf11901eaae1606ab0bb8e8f522da30105f984124125e1cdf7f943fa2(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0c7d5886c45cee44278a1363e7e8ba528fe26aecd1a77ea92e7ccbc400a3716(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__774d7c7959b3d68a356f88a8b78e5c3509b8691afebe630849bd5fafff314992(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cadd7c36fa5fdd0d20d3abb408539937841c64e3dc9e9ae80648122dedca1691(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3715b11a3a008936f4de042c5697b27609dd7a47bfee49223de4ee93cc675616(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BedrockagentAgentPromptOverrideConfigurationPromptConfigurations]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3144b91be3651b75450d0279a9b9352f70450465bef23f6a9b87269c3c7de0ca(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__751d151213a702905b71e8709fbfc195084cd4783c25b3f8b362035f4fec8e74(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BedrockagentAgentPromptOverrideConfigurationPromptConfigurationsInferenceConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8319b33580571763b0ccbabba0dd4265331e0f985b12bcf514cd974ce695a06e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5ea726c75d882971bf5f455e9f4d7196747d243e5555ea93a4ff1ac4f421f00(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a366502484ca9ee109454be5d1ab55c8a7c68b4b867d0fcaa4f2ea1a6d65a5df(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e39bd23f048a9328294c1d600c6561eaeeb659a908c5fb6aa6b16922a83408a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc74ff04aa845798d7da694e3bd1d16181983450cee908d49eb0e4b88f3cae07(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05b588037e9cd33570b941c87db2a88cc466a4ae51c5f832d5e513e04bb3980c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentPromptOverrideConfigurationPromptConfigurations]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8828a23108397ae8d4cad7ef86d433db2a13d34339649fd14f3c78e909616e79(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6522b4bb9dcff1164bc96d64fd67b2f0c62c8536086c1689fbf78545c3f4fa70(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3efae6a0aae4ed718b92251d73149f00f827edc3cc8b7524bcef6e90c29c88a4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d0f95c81d8c805695a28e165c9b6e9c7fc38d56b8413ad08a7272c3eeb516b0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c11e6da5ec28994b99ca9ec575dcb31fbf29931225ef533307c5b67548698264(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f47f559cbe75b7c3550a69a627a633b5197b276ab156b24065ca03a99dd24e6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BedrockagentAgentTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
