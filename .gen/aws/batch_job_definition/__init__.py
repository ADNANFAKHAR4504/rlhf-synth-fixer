r'''
# `aws_batch_job_definition`

Refer to the Terraform Registry for docs: [`aws_batch_job_definition`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition).
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


class BatchJobDefinition(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinition",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition aws_batch_job_definition}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        name: builtins.str,
        type: builtins.str,
        container_properties: typing.Optional[builtins.str] = None,
        deregister_on_new_revision: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        ecs_properties: typing.Optional[builtins.str] = None,
        eks_properties: typing.Optional[typing.Union["BatchJobDefinitionEksProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        node_properties: typing.Optional[builtins.str] = None,
        parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        platform_capabilities: typing.Optional[typing.Sequence[builtins.str]] = None,
        propagate_tags: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        retry_strategy: typing.Optional[typing.Union["BatchJobDefinitionRetryStrategy", typing.Dict[builtins.str, typing.Any]]] = None,
        scheduling_priority: typing.Optional[jsii.Number] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeout: typing.Optional[typing.Union["BatchJobDefinitionTimeout", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition aws_batch_job_definition} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#type BatchJobDefinition#type}.
        :param container_properties: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#container_properties BatchJobDefinition#container_properties}.
        :param deregister_on_new_revision: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#deregister_on_new_revision BatchJobDefinition#deregister_on_new_revision}.
        :param ecs_properties: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#ecs_properties BatchJobDefinition#ecs_properties}.
        :param eks_properties: eks_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#eks_properties BatchJobDefinition#eks_properties}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#id BatchJobDefinition#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param node_properties: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#node_properties BatchJobDefinition#node_properties}.
        :param parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#parameters BatchJobDefinition#parameters}.
        :param platform_capabilities: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#platform_capabilities BatchJobDefinition#platform_capabilities}.
        :param propagate_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#propagate_tags BatchJobDefinition#propagate_tags}.
        :param retry_strategy: retry_strategy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#retry_strategy BatchJobDefinition#retry_strategy}
        :param scheduling_priority: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#scheduling_priority BatchJobDefinition#scheduling_priority}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags BatchJobDefinition#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags_all BatchJobDefinition#tags_all}.
        :param timeout: timeout block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#timeout BatchJobDefinition#timeout}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a281aaa906d202dce4aeb40e65a59abb0b5f676b37fb12a4b80979a46ef6da82)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = BatchJobDefinitionConfig(
            name=name,
            type=type,
            container_properties=container_properties,
            deregister_on_new_revision=deregister_on_new_revision,
            ecs_properties=ecs_properties,
            eks_properties=eks_properties,
            id=id,
            node_properties=node_properties,
            parameters=parameters,
            platform_capabilities=platform_capabilities,
            propagate_tags=propagate_tags,
            retry_strategy=retry_strategy,
            scheduling_priority=scheduling_priority,
            tags=tags,
            tags_all=tags_all,
            timeout=timeout,
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
        '''Generates CDKTF code for importing a BatchJobDefinition resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the BatchJobDefinition to import.
        :param import_from_id: The id of the existing BatchJobDefinition that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the BatchJobDefinition to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__98fc534421db88df6905d5dec9ad46e3f1ab55a0d2c4d724d6356a792407721b)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putEksProperties")
    def put_eks_properties(
        self,
        *,
        pod_properties: typing.Union["BatchJobDefinitionEksPropertiesPodProperties", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param pod_properties: pod_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#pod_properties BatchJobDefinition#pod_properties}
        '''
        value = BatchJobDefinitionEksProperties(pod_properties=pod_properties)

        return typing.cast(None, jsii.invoke(self, "putEksProperties", [value]))

    @jsii.member(jsii_name="putRetryStrategy")
    def put_retry_strategy(
        self,
        *,
        attempts: typing.Optional[jsii.Number] = None,
        evaluate_on_exit: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionRetryStrategyEvaluateOnExit", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param attempts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#attempts BatchJobDefinition#attempts}.
        :param evaluate_on_exit: evaluate_on_exit block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#evaluate_on_exit BatchJobDefinition#evaluate_on_exit}
        '''
        value = BatchJobDefinitionRetryStrategy(
            attempts=attempts, evaluate_on_exit=evaluate_on_exit
        )

        return typing.cast(None, jsii.invoke(self, "putRetryStrategy", [value]))

    @jsii.member(jsii_name="putTimeout")
    def put_timeout(
        self,
        *,
        attempt_duration_seconds: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param attempt_duration_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#attempt_duration_seconds BatchJobDefinition#attempt_duration_seconds}.
        '''
        value = BatchJobDefinitionTimeout(
            attempt_duration_seconds=attempt_duration_seconds
        )

        return typing.cast(None, jsii.invoke(self, "putTimeout", [value]))

    @jsii.member(jsii_name="resetContainerProperties")
    def reset_container_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerProperties", []))

    @jsii.member(jsii_name="resetDeregisterOnNewRevision")
    def reset_deregister_on_new_revision(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeregisterOnNewRevision", []))

    @jsii.member(jsii_name="resetEcsProperties")
    def reset_ecs_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEcsProperties", []))

    @jsii.member(jsii_name="resetEksProperties")
    def reset_eks_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEksProperties", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetNodeProperties")
    def reset_node_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNodeProperties", []))

    @jsii.member(jsii_name="resetParameters")
    def reset_parameters(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetParameters", []))

    @jsii.member(jsii_name="resetPlatformCapabilities")
    def reset_platform_capabilities(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPlatformCapabilities", []))

    @jsii.member(jsii_name="resetPropagateTags")
    def reset_propagate_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPropagateTags", []))

    @jsii.member(jsii_name="resetRetryStrategy")
    def reset_retry_strategy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRetryStrategy", []))

    @jsii.member(jsii_name="resetSchedulingPriority")
    def reset_scheduling_priority(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSchedulingPriority", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTimeout")
    def reset_timeout(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeout", []))

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
    @jsii.member(jsii_name="arnPrefix")
    def arn_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arnPrefix"))

    @builtins.property
    @jsii.member(jsii_name="eksProperties")
    def eks_properties(self) -> "BatchJobDefinitionEksPropertiesOutputReference":
        return typing.cast("BatchJobDefinitionEksPropertiesOutputReference", jsii.get(self, "eksProperties"))

    @builtins.property
    @jsii.member(jsii_name="retryStrategy")
    def retry_strategy(self) -> "BatchJobDefinitionRetryStrategyOutputReference":
        return typing.cast("BatchJobDefinitionRetryStrategyOutputReference", jsii.get(self, "retryStrategy"))

    @builtins.property
    @jsii.member(jsii_name="revision")
    def revision(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "revision"))

    @builtins.property
    @jsii.member(jsii_name="timeout")
    def timeout(self) -> "BatchJobDefinitionTimeoutOutputReference":
        return typing.cast("BatchJobDefinitionTimeoutOutputReference", jsii.get(self, "timeout"))

    @builtins.property
    @jsii.member(jsii_name="containerPropertiesInput")
    def container_properties_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "containerPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="deregisterOnNewRevisionInput")
    def deregister_on_new_revision_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "deregisterOnNewRevisionInput"))

    @builtins.property
    @jsii.member(jsii_name="ecsPropertiesInput")
    def ecs_properties_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ecsPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="eksPropertiesInput")
    def eks_properties_input(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksProperties"]:
        return typing.cast(typing.Optional["BatchJobDefinitionEksProperties"], jsii.get(self, "eksPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="nodePropertiesInput")
    def node_properties_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nodePropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="parametersInput")
    def parameters_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "parametersInput"))

    @builtins.property
    @jsii.member(jsii_name="platformCapabilitiesInput")
    def platform_capabilities_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "platformCapabilitiesInput"))

    @builtins.property
    @jsii.member(jsii_name="propagateTagsInput")
    def propagate_tags_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "propagateTagsInput"))

    @builtins.property
    @jsii.member(jsii_name="retryStrategyInput")
    def retry_strategy_input(
        self,
    ) -> typing.Optional["BatchJobDefinitionRetryStrategy"]:
        return typing.cast(typing.Optional["BatchJobDefinitionRetryStrategy"], jsii.get(self, "retryStrategyInput"))

    @builtins.property
    @jsii.member(jsii_name="schedulingPriorityInput")
    def scheduling_priority_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "schedulingPriorityInput"))

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
    @jsii.member(jsii_name="timeoutInput")
    def timeout_input(self) -> typing.Optional["BatchJobDefinitionTimeout"]:
        return typing.cast(typing.Optional["BatchJobDefinitionTimeout"], jsii.get(self, "timeoutInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="containerProperties")
    def container_properties(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "containerProperties"))

    @container_properties.setter
    def container_properties(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e2cd8436d649c5733ad0706d22f5df65ca10cc406a19f5fed0830f325a577ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "containerProperties", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deregisterOnNewRevision")
    def deregister_on_new_revision(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "deregisterOnNewRevision"))

    @deregister_on_new_revision.setter
    def deregister_on_new_revision(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__942a754541e2ef9a6fc4d9687a524bd63ff59ea81b3f3ba6ed4621897876a464)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deregisterOnNewRevision", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ecsProperties")
    def ecs_properties(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ecsProperties"))

    @ecs_properties.setter
    def ecs_properties(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d3a7cece453560c3f5001d9d78be3f456b4ea48c8877ad459ec66f9d0194221)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ecsProperties", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4fe2be85c13bfd7b7d8d96c74490625dae9eafb6bef6e2e569de50acc87ea6cb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__adbf3cfbbfd1d8cb08a290ece68d967f721d681c8d43e8a64703c6bd3e91809b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="nodeProperties")
    def node_properties(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "nodeProperties"))

    @node_properties.setter
    def node_properties(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__11fb6338fe039f2a3808141006a6ce53a3d5e6d49fcffbf2e358d84fb419e764)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "nodeProperties", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="parameters")
    def parameters(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "parameters"))

    @parameters.setter
    def parameters(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__01918cf70b462a2b8e1bbffe7c161642b4bb6d9afb1dbb4b8a1362d49ac07787)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "parameters", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="platformCapabilities")
    def platform_capabilities(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "platformCapabilities"))

    @platform_capabilities.setter
    def platform_capabilities(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c6887b132e36ba74ec902a265f5eb247fd2d1e406542a53008e1ccd372c8123)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "platformCapabilities", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="propagateTags")
    def propagate_tags(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "propagateTags"))

    @propagate_tags.setter
    def propagate_tags(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__201109206782365ca043188823139b95059ee7e5e5a659f1610ae60e4acd6348)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "propagateTags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="schedulingPriority")
    def scheduling_priority(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "schedulingPriority"))

    @scheduling_priority.setter
    def scheduling_priority(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21d35b0e23ff7b4f876d45d6e2758c807cee70baf7fb39905ad549970f83f3b1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "schedulingPriority", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__be59bcd498300713decc4b3a79784d5a77f88ec9b39ed96af558cffdf37dce75)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21ecb7940e66da36dacef55639d481f2a17be7550768e748fa8b18561d46a9af)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c18472950cffa8dd3e705bb78ab6e852ac9f9c7a944e8280542c7dbcca912f71)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "name": "name",
        "type": "type",
        "container_properties": "containerProperties",
        "deregister_on_new_revision": "deregisterOnNewRevision",
        "ecs_properties": "ecsProperties",
        "eks_properties": "eksProperties",
        "id": "id",
        "node_properties": "nodeProperties",
        "parameters": "parameters",
        "platform_capabilities": "platformCapabilities",
        "propagate_tags": "propagateTags",
        "retry_strategy": "retryStrategy",
        "scheduling_priority": "schedulingPriority",
        "tags": "tags",
        "tags_all": "tagsAll",
        "timeout": "timeout",
    },
)
class BatchJobDefinitionConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        name: builtins.str,
        type: builtins.str,
        container_properties: typing.Optional[builtins.str] = None,
        deregister_on_new_revision: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        ecs_properties: typing.Optional[builtins.str] = None,
        eks_properties: typing.Optional[typing.Union["BatchJobDefinitionEksProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        node_properties: typing.Optional[builtins.str] = None,
        parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        platform_capabilities: typing.Optional[typing.Sequence[builtins.str]] = None,
        propagate_tags: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        retry_strategy: typing.Optional[typing.Union["BatchJobDefinitionRetryStrategy", typing.Dict[builtins.str, typing.Any]]] = None,
        scheduling_priority: typing.Optional[jsii.Number] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        timeout: typing.Optional[typing.Union["BatchJobDefinitionTimeout", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#type BatchJobDefinition#type}.
        :param container_properties: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#container_properties BatchJobDefinition#container_properties}.
        :param deregister_on_new_revision: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#deregister_on_new_revision BatchJobDefinition#deregister_on_new_revision}.
        :param ecs_properties: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#ecs_properties BatchJobDefinition#ecs_properties}.
        :param eks_properties: eks_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#eks_properties BatchJobDefinition#eks_properties}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#id BatchJobDefinition#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param node_properties: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#node_properties BatchJobDefinition#node_properties}.
        :param parameters: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#parameters BatchJobDefinition#parameters}.
        :param platform_capabilities: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#platform_capabilities BatchJobDefinition#platform_capabilities}.
        :param propagate_tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#propagate_tags BatchJobDefinition#propagate_tags}.
        :param retry_strategy: retry_strategy block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#retry_strategy BatchJobDefinition#retry_strategy}
        :param scheduling_priority: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#scheduling_priority BatchJobDefinition#scheduling_priority}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags BatchJobDefinition#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags_all BatchJobDefinition#tags_all}.
        :param timeout: timeout block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#timeout BatchJobDefinition#timeout}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(eks_properties, dict):
            eks_properties = BatchJobDefinitionEksProperties(**eks_properties)
        if isinstance(retry_strategy, dict):
            retry_strategy = BatchJobDefinitionRetryStrategy(**retry_strategy)
        if isinstance(timeout, dict):
            timeout = BatchJobDefinitionTimeout(**timeout)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b0eb83dc9da06f73fd500ec025ca1048eecef9e0b644538dd44f47d6db5d9e8a)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument container_properties", value=container_properties, expected_type=type_hints["container_properties"])
            check_type(argname="argument deregister_on_new_revision", value=deregister_on_new_revision, expected_type=type_hints["deregister_on_new_revision"])
            check_type(argname="argument ecs_properties", value=ecs_properties, expected_type=type_hints["ecs_properties"])
            check_type(argname="argument eks_properties", value=eks_properties, expected_type=type_hints["eks_properties"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument node_properties", value=node_properties, expected_type=type_hints["node_properties"])
            check_type(argname="argument parameters", value=parameters, expected_type=type_hints["parameters"])
            check_type(argname="argument platform_capabilities", value=platform_capabilities, expected_type=type_hints["platform_capabilities"])
            check_type(argname="argument propagate_tags", value=propagate_tags, expected_type=type_hints["propagate_tags"])
            check_type(argname="argument retry_strategy", value=retry_strategy, expected_type=type_hints["retry_strategy"])
            check_type(argname="argument scheduling_priority", value=scheduling_priority, expected_type=type_hints["scheduling_priority"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument timeout", value=timeout, expected_type=type_hints["timeout"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "type": type,
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
        if container_properties is not None:
            self._values["container_properties"] = container_properties
        if deregister_on_new_revision is not None:
            self._values["deregister_on_new_revision"] = deregister_on_new_revision
        if ecs_properties is not None:
            self._values["ecs_properties"] = ecs_properties
        if eks_properties is not None:
            self._values["eks_properties"] = eks_properties
        if id is not None:
            self._values["id"] = id
        if node_properties is not None:
            self._values["node_properties"] = node_properties
        if parameters is not None:
            self._values["parameters"] = parameters
        if platform_capabilities is not None:
            self._values["platform_capabilities"] = platform_capabilities
        if propagate_tags is not None:
            self._values["propagate_tags"] = propagate_tags
        if retry_strategy is not None:
            self._values["retry_strategy"] = retry_strategy
        if scheduling_priority is not None:
            self._values["scheduling_priority"] = scheduling_priority
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if timeout is not None:
            self._values["timeout"] = timeout

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
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#type BatchJobDefinition#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def container_properties(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#container_properties BatchJobDefinition#container_properties}.'''
        result = self._values.get("container_properties")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def deregister_on_new_revision(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#deregister_on_new_revision BatchJobDefinition#deregister_on_new_revision}.'''
        result = self._values.get("deregister_on_new_revision")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def ecs_properties(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#ecs_properties BatchJobDefinition#ecs_properties}.'''
        result = self._values.get("ecs_properties")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def eks_properties(self) -> typing.Optional["BatchJobDefinitionEksProperties"]:
        '''eks_properties block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#eks_properties BatchJobDefinition#eks_properties}
        '''
        result = self._values.get("eks_properties")
        return typing.cast(typing.Optional["BatchJobDefinitionEksProperties"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#id BatchJobDefinition#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def node_properties(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#node_properties BatchJobDefinition#node_properties}.'''
        result = self._values.get("node_properties")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def parameters(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#parameters BatchJobDefinition#parameters}.'''
        result = self._values.get("parameters")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def platform_capabilities(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#platform_capabilities BatchJobDefinition#platform_capabilities}.'''
        result = self._values.get("platform_capabilities")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def propagate_tags(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#propagate_tags BatchJobDefinition#propagate_tags}.'''
        result = self._values.get("propagate_tags")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def retry_strategy(self) -> typing.Optional["BatchJobDefinitionRetryStrategy"]:
        '''retry_strategy block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#retry_strategy BatchJobDefinition#retry_strategy}
        '''
        result = self._values.get("retry_strategy")
        return typing.cast(typing.Optional["BatchJobDefinitionRetryStrategy"], result)

    @builtins.property
    def scheduling_priority(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#scheduling_priority BatchJobDefinition#scheduling_priority}.'''
        result = self._values.get("scheduling_priority")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags BatchJobDefinition#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#tags_all BatchJobDefinition#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def timeout(self) -> typing.Optional["BatchJobDefinitionTimeout"]:
        '''timeout block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#timeout BatchJobDefinition#timeout}
        '''
        result = self._values.get("timeout")
        return typing.cast(typing.Optional["BatchJobDefinitionTimeout"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksProperties",
    jsii_struct_bases=[],
    name_mapping={"pod_properties": "podProperties"},
)
class BatchJobDefinitionEksProperties:
    def __init__(
        self,
        *,
        pod_properties: typing.Union["BatchJobDefinitionEksPropertiesPodProperties", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param pod_properties: pod_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#pod_properties BatchJobDefinition#pod_properties}
        '''
        if isinstance(pod_properties, dict):
            pod_properties = BatchJobDefinitionEksPropertiesPodProperties(**pod_properties)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a2691c10650652abb06ea075005daca6861cba6bc3c0e271acf3bd2bcf71a4f)
            check_type(argname="argument pod_properties", value=pod_properties, expected_type=type_hints["pod_properties"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "pod_properties": pod_properties,
        }

    @builtins.property
    def pod_properties(self) -> "BatchJobDefinitionEksPropertiesPodProperties":
        '''pod_properties block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#pod_properties BatchJobDefinition#pod_properties}
        '''
        result = self._values.get("pod_properties")
        assert result is not None, "Required property 'pod_properties' is missing"
        return typing.cast("BatchJobDefinitionEksPropertiesPodProperties", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksProperties(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b9421c664d66abb7f17a4612bb87b2522d0a5c12f64c752f2b5b95661eb3faef)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putPodProperties")
    def put_pod_properties(
        self,
        *,
        containers: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesContainers", typing.Dict[builtins.str, typing.Any]]]],
        dns_policy: typing.Optional[builtins.str] = None,
        host_network: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        image_pull_secret: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret", typing.Dict[builtins.str, typing.Any]]]]] = None,
        init_containers: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesInitContainers", typing.Dict[builtins.str, typing.Any]]]]] = None,
        metadata: typing.Optional[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesMetadata", typing.Dict[builtins.str, typing.Any]]] = None,
        service_account_name: typing.Optional[builtins.str] = None,
        share_process_namespace: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        volumes: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesVolumes", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param containers: containers block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#containers BatchJobDefinition#containers}
        :param dns_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#dns_policy BatchJobDefinition#dns_policy}.
        :param host_network: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#host_network BatchJobDefinition#host_network}.
        :param image_pull_secret: image_pull_secret block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image_pull_secret BatchJobDefinition#image_pull_secret}
        :param init_containers: init_containers block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#init_containers BatchJobDefinition#init_containers}
        :param metadata: metadata block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#metadata BatchJobDefinition#metadata}
        :param service_account_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#service_account_name BatchJobDefinition#service_account_name}.
        :param share_process_namespace: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#share_process_namespace BatchJobDefinition#share_process_namespace}.
        :param volumes: volumes block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volumes BatchJobDefinition#volumes}
        '''
        value = BatchJobDefinitionEksPropertiesPodProperties(
            containers=containers,
            dns_policy=dns_policy,
            host_network=host_network,
            image_pull_secret=image_pull_secret,
            init_containers=init_containers,
            metadata=metadata,
            service_account_name=service_account_name,
            share_process_namespace=share_process_namespace,
            volumes=volumes,
        )

        return typing.cast(None, jsii.invoke(self, "putPodProperties", [value]))

    @builtins.property
    @jsii.member(jsii_name="podProperties")
    def pod_properties(
        self,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesOutputReference":
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesOutputReference", jsii.get(self, "podProperties"))

    @builtins.property
    @jsii.member(jsii_name="podPropertiesInput")
    def pod_properties_input(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodProperties"]:
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodProperties"], jsii.get(self, "podPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[BatchJobDefinitionEksProperties]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksProperties], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[BatchJobDefinitionEksProperties],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__111c8683f46fadbb2a21a7ae93a4535245ca93582a01c5d43bc9e0a1895bbdf8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodProperties",
    jsii_struct_bases=[],
    name_mapping={
        "containers": "containers",
        "dns_policy": "dnsPolicy",
        "host_network": "hostNetwork",
        "image_pull_secret": "imagePullSecret",
        "init_containers": "initContainers",
        "metadata": "metadata",
        "service_account_name": "serviceAccountName",
        "share_process_namespace": "shareProcessNamespace",
        "volumes": "volumes",
    },
)
class BatchJobDefinitionEksPropertiesPodProperties:
    def __init__(
        self,
        *,
        containers: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesContainers", typing.Dict[builtins.str, typing.Any]]]],
        dns_policy: typing.Optional[builtins.str] = None,
        host_network: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        image_pull_secret: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret", typing.Dict[builtins.str, typing.Any]]]]] = None,
        init_containers: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesInitContainers", typing.Dict[builtins.str, typing.Any]]]]] = None,
        metadata: typing.Optional[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesMetadata", typing.Dict[builtins.str, typing.Any]]] = None,
        service_account_name: typing.Optional[builtins.str] = None,
        share_process_namespace: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        volumes: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesVolumes", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param containers: containers block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#containers BatchJobDefinition#containers}
        :param dns_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#dns_policy BatchJobDefinition#dns_policy}.
        :param host_network: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#host_network BatchJobDefinition#host_network}.
        :param image_pull_secret: image_pull_secret block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image_pull_secret BatchJobDefinition#image_pull_secret}
        :param init_containers: init_containers block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#init_containers BatchJobDefinition#init_containers}
        :param metadata: metadata block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#metadata BatchJobDefinition#metadata}
        :param service_account_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#service_account_name BatchJobDefinition#service_account_name}.
        :param share_process_namespace: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#share_process_namespace BatchJobDefinition#share_process_namespace}.
        :param volumes: volumes block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volumes BatchJobDefinition#volumes}
        '''
        if isinstance(metadata, dict):
            metadata = BatchJobDefinitionEksPropertiesPodPropertiesMetadata(**metadata)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62a0a83fa1d236123d1235e0e140348578db6085510e0fb562b7298f516787a7)
            check_type(argname="argument containers", value=containers, expected_type=type_hints["containers"])
            check_type(argname="argument dns_policy", value=dns_policy, expected_type=type_hints["dns_policy"])
            check_type(argname="argument host_network", value=host_network, expected_type=type_hints["host_network"])
            check_type(argname="argument image_pull_secret", value=image_pull_secret, expected_type=type_hints["image_pull_secret"])
            check_type(argname="argument init_containers", value=init_containers, expected_type=type_hints["init_containers"])
            check_type(argname="argument metadata", value=metadata, expected_type=type_hints["metadata"])
            check_type(argname="argument service_account_name", value=service_account_name, expected_type=type_hints["service_account_name"])
            check_type(argname="argument share_process_namespace", value=share_process_namespace, expected_type=type_hints["share_process_namespace"])
            check_type(argname="argument volumes", value=volumes, expected_type=type_hints["volumes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "containers": containers,
        }
        if dns_policy is not None:
            self._values["dns_policy"] = dns_policy
        if host_network is not None:
            self._values["host_network"] = host_network
        if image_pull_secret is not None:
            self._values["image_pull_secret"] = image_pull_secret
        if init_containers is not None:
            self._values["init_containers"] = init_containers
        if metadata is not None:
            self._values["metadata"] = metadata
        if service_account_name is not None:
            self._values["service_account_name"] = service_account_name
        if share_process_namespace is not None:
            self._values["share_process_namespace"] = share_process_namespace
        if volumes is not None:
            self._values["volumes"] = volumes

    @builtins.property
    def containers(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesContainers"]]:
        '''containers block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#containers BatchJobDefinition#containers}
        '''
        result = self._values.get("containers")
        assert result is not None, "Required property 'containers' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesContainers"]], result)

    @builtins.property
    def dns_policy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#dns_policy BatchJobDefinition#dns_policy}.'''
        result = self._values.get("dns_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def host_network(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#host_network BatchJobDefinition#host_network}.'''
        result = self._values.get("host_network")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def image_pull_secret(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret"]]]:
        '''image_pull_secret block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image_pull_secret BatchJobDefinition#image_pull_secret}
        '''
        result = self._values.get("image_pull_secret")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret"]]], result)

    @builtins.property
    def init_containers(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesInitContainers"]]]:
        '''init_containers block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#init_containers BatchJobDefinition#init_containers}
        '''
        result = self._values.get("init_containers")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesInitContainers"]]], result)

    @builtins.property
    def metadata(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesMetadata"]:
        '''metadata block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#metadata BatchJobDefinition#metadata}
        '''
        result = self._values.get("metadata")
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesMetadata"], result)

    @builtins.property
    def service_account_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#service_account_name BatchJobDefinition#service_account_name}.'''
        result = self._values.get("service_account_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def share_process_namespace(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#share_process_namespace BatchJobDefinition#share_process_namespace}.'''
        result = self._values.get("share_process_namespace")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def volumes(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesVolumes"]]]:
        '''volumes block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volumes BatchJobDefinition#volumes}
        '''
        result = self._values.get("volumes")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesVolumes"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodProperties(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainers",
    jsii_struct_bases=[],
    name_mapping={
        "image": "image",
        "args": "args",
        "command": "command",
        "env": "env",
        "image_pull_policy": "imagePullPolicy",
        "name": "name",
        "resources": "resources",
        "security_context": "securityContext",
        "volume_mounts": "volumeMounts",
    },
)
class BatchJobDefinitionEksPropertiesPodPropertiesContainers:
    def __init__(
        self,
        *,
        image: builtins.str,
        args: typing.Optional[typing.Sequence[builtins.str]] = None,
        command: typing.Optional[typing.Sequence[builtins.str]] = None,
        env: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv", typing.Dict[builtins.str, typing.Any]]]]] = None,
        image_pull_policy: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        resources: typing.Optional[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesContainersResources", typing.Dict[builtins.str, typing.Any]]] = None,
        security_context: typing.Optional[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext", typing.Dict[builtins.str, typing.Any]]] = None,
        volume_mounts: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param image: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image BatchJobDefinition#image}.
        :param args: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#args BatchJobDefinition#args}.
        :param command: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#command BatchJobDefinition#command}.
        :param env: env block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#env BatchJobDefinition#env}
        :param image_pull_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image_pull_policy BatchJobDefinition#image_pull_policy}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
        :param resources: resources block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#resources BatchJobDefinition#resources}
        :param security_context: security_context block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#security_context BatchJobDefinition#security_context}
        :param volume_mounts: volume_mounts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volume_mounts BatchJobDefinition#volume_mounts}
        '''
        if isinstance(resources, dict):
            resources = BatchJobDefinitionEksPropertiesPodPropertiesContainersResources(**resources)
        if isinstance(security_context, dict):
            security_context = BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext(**security_context)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f9b32fee8400237cd5af69ec54f7ca4a792b09bc7c405cc1d591ed24177adb22)
            check_type(argname="argument image", value=image, expected_type=type_hints["image"])
            check_type(argname="argument args", value=args, expected_type=type_hints["args"])
            check_type(argname="argument command", value=command, expected_type=type_hints["command"])
            check_type(argname="argument env", value=env, expected_type=type_hints["env"])
            check_type(argname="argument image_pull_policy", value=image_pull_policy, expected_type=type_hints["image_pull_policy"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument resources", value=resources, expected_type=type_hints["resources"])
            check_type(argname="argument security_context", value=security_context, expected_type=type_hints["security_context"])
            check_type(argname="argument volume_mounts", value=volume_mounts, expected_type=type_hints["volume_mounts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "image": image,
        }
        if args is not None:
            self._values["args"] = args
        if command is not None:
            self._values["command"] = command
        if env is not None:
            self._values["env"] = env
        if image_pull_policy is not None:
            self._values["image_pull_policy"] = image_pull_policy
        if name is not None:
            self._values["name"] = name
        if resources is not None:
            self._values["resources"] = resources
        if security_context is not None:
            self._values["security_context"] = security_context
        if volume_mounts is not None:
            self._values["volume_mounts"] = volume_mounts

    @builtins.property
    def image(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image BatchJobDefinition#image}.'''
        result = self._values.get("image")
        assert result is not None, "Required property 'image' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def args(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#args BatchJobDefinition#args}.'''
        result = self._values.get("args")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def command(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#command BatchJobDefinition#command}.'''
        result = self._values.get("command")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def env(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv"]]]:
        '''env block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#env BatchJobDefinition#env}
        '''
        result = self._values.get("env")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv"]]], result)

    @builtins.property
    def image_pull_policy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image_pull_policy BatchJobDefinition#image_pull_policy}.'''
        result = self._values.get("image_pull_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def resources(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesContainersResources"]:
        '''resources block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#resources BatchJobDefinition#resources}
        '''
        result = self._values.get("resources")
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesContainersResources"], result)

    @builtins.property
    def security_context(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext"]:
        '''security_context block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#security_context BatchJobDefinition#security_context}
        '''
        result = self._values.get("security_context")
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext"], result)

    @builtins.property
    def volume_mounts(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts"]]]:
        '''volume_mounts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volume_mounts BatchJobDefinition#volume_mounts}
        '''
        result = self._values.get("volume_mounts")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesContainers(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#value BatchJobDefinition#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9c611b98d279a051582e665d13278db969f942e355de6e50285849857305df73)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#value BatchJobDefinition#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesContainersEnvList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersEnvList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1850c820259388af5efa8b20ea99cc610a85da7b4a4698bf90c9fc6bb71c5957)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesContainersEnvOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c42873cf2366ca60ad87bf25a4347ca4c98f2bf66a86bc6ae8cb242875e63618)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesContainersEnvOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__77fbd51e320295d72c30310e6520e7dfd622afee152d94ba195359cbe48ff706)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0a3453112f57e158cb4a9dc654b5382b5ca11ab8366254e9c1d889aa9228395c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__97d567ba7680eee93fd2310b31a27ebe3fe78d21888188c1d8c2c0e514113a80)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__63f2ad26548b315809d8e48b1bedde5de9e0f9e2066f003f7ebc17a154240931)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionEksPropertiesPodPropertiesContainersEnvOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersEnvOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8f2e5aef9c88cb52aecf3fe3076a984efa75a9d247d22677652a7ee63cc1f757)
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
            type_hints = typing.get_type_hints(_typecheckingstub__02f1d45359d6043569c81bb1f3bfc0142109c4da572d517e69c769cba541f4e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33948e824d572d83201e3f6719544b6f3a69f7e3dae3da6c26ef31756f6ab258)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__45d6517679631d2e3646892662c654baa30484c398c8e18ece4b69fb1e87ca2f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionEksPropertiesPodPropertiesContainersList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__98e4bb04389c996e531fcd02c9edc5ea51de790577e3b0279468f9dcaf5d91f9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesContainersOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d8d586cd8752cc56447243a6ec9c98a2d4cee08b0353363c00f58fe1c2cb4aed)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesContainersOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2d6ee072b8c6fd556dc220dd33e86dfa89bd36fc7cdbfc457bcec55a24e6013f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__48adfb57b4088a15cd6a5aa784f01cbdd142e181b17e3e83632cac8b472f7793)
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
            type_hints = typing.get_type_hints(_typecheckingstub__44db25640486bbd2a14bc5610cdd62617f0c0e1231d3e418fa93e6ff29d87574)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainers]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainers]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainers]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a80fdc199b581289d8c28d050106118a62ee6b3255115ad5f6cf51386070a2fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionEksPropertiesPodPropertiesContainersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__382a4f0088f991125048ef2553b321ca11431d56363506882ed70cecab6220b0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putEnv")
    def put_env(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7cbb1ac8bf595ea60af8f0f1ce55a124d91efbdd4adbbbbbf753e28c9bd504bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEnv", [value]))

    @jsii.member(jsii_name="putResources")
    def put_resources(
        self,
        *,
        limits: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        requests: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param limits: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#limits BatchJobDefinition#limits}.
        :param requests: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#requests BatchJobDefinition#requests}.
        '''
        value = BatchJobDefinitionEksPropertiesPodPropertiesContainersResources(
            limits=limits, requests=requests
        )

        return typing.cast(None, jsii.invoke(self, "putResources", [value]))

    @jsii.member(jsii_name="putSecurityContext")
    def put_security_context(
        self,
        *,
        privileged: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        read_only_root_file_system: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        run_as_group: typing.Optional[jsii.Number] = None,
        run_as_non_root: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        run_as_user: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param privileged: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#privileged BatchJobDefinition#privileged}.
        :param read_only_root_file_system: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only_root_file_system BatchJobDefinition#read_only_root_file_system}.
        :param run_as_group: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_group BatchJobDefinition#run_as_group}.
        :param run_as_non_root: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_non_root BatchJobDefinition#run_as_non_root}.
        :param run_as_user: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_user BatchJobDefinition#run_as_user}.
        '''
        value = BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext(
            privileged=privileged,
            read_only_root_file_system=read_only_root_file_system,
            run_as_group=run_as_group,
            run_as_non_root=run_as_non_root,
            run_as_user=run_as_user,
        )

        return typing.cast(None, jsii.invoke(self, "putSecurityContext", [value]))

    @jsii.member(jsii_name="putVolumeMounts")
    def put_volume_mounts(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5932fa9ea8db6f132a349d5fb9f6e8b0a3da070aef5623e2922bb4dacebded69)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putVolumeMounts", [value]))

    @jsii.member(jsii_name="resetArgs")
    def reset_args(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetArgs", []))

    @jsii.member(jsii_name="resetCommand")
    def reset_command(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCommand", []))

    @jsii.member(jsii_name="resetEnv")
    def reset_env(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnv", []))

    @jsii.member(jsii_name="resetImagePullPolicy")
    def reset_image_pull_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImagePullPolicy", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetResources")
    def reset_resources(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResources", []))

    @jsii.member(jsii_name="resetSecurityContext")
    def reset_security_context(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityContext", []))

    @jsii.member(jsii_name="resetVolumeMounts")
    def reset_volume_mounts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVolumeMounts", []))

    @builtins.property
    @jsii.member(jsii_name="env")
    def env(self) -> BatchJobDefinitionEksPropertiesPodPropertiesContainersEnvList:
        return typing.cast(BatchJobDefinitionEksPropertiesPodPropertiesContainersEnvList, jsii.get(self, "env"))

    @builtins.property
    @jsii.member(jsii_name="resources")
    def resources(
        self,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesContainersResourcesOutputReference":
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesContainersResourcesOutputReference", jsii.get(self, "resources"))

    @builtins.property
    @jsii.member(jsii_name="securityContext")
    def security_context(
        self,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContextOutputReference":
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContextOutputReference", jsii.get(self, "securityContext"))

    @builtins.property
    @jsii.member(jsii_name="volumeMounts")
    def volume_mounts(
        self,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMountsList":
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMountsList", jsii.get(self, "volumeMounts"))

    @builtins.property
    @jsii.member(jsii_name="argsInput")
    def args_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "argsInput"))

    @builtins.property
    @jsii.member(jsii_name="commandInput")
    def command_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "commandInput"))

    @builtins.property
    @jsii.member(jsii_name="envInput")
    def env_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv]]], jsii.get(self, "envInput"))

    @builtins.property
    @jsii.member(jsii_name="imageInput")
    def image_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "imageInput"))

    @builtins.property
    @jsii.member(jsii_name="imagePullPolicyInput")
    def image_pull_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "imagePullPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="resourcesInput")
    def resources_input(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesContainersResources"]:
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesContainersResources"], jsii.get(self, "resourcesInput"))

    @builtins.property
    @jsii.member(jsii_name="securityContextInput")
    def security_context_input(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext"]:
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext"], jsii.get(self, "securityContextInput"))

    @builtins.property
    @jsii.member(jsii_name="volumeMountsInput")
    def volume_mounts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts"]]], jsii.get(self, "volumeMountsInput"))

    @builtins.property
    @jsii.member(jsii_name="args")
    def args(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "args"))

    @args.setter
    def args(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d7f8ccf26c76ae2f8bb55c78bbedbf9d6ad2249a2ae6329a1fdef5d11105f8a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "args", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="command")
    def command(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "command"))

    @command.setter
    def command(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7bb647cab6e269b0d7f0fabf3897f38910641c032b7c205dc18bf6f4b7ec0673)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "command", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="image")
    def image(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "image"))

    @image.setter
    def image(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__caafc488150bebae513a9ea206d70f153a96356b6a6b1f781ca73731a01e9c03)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "image", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imagePullPolicy")
    def image_pull_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "imagePullPolicy"))

    @image_pull_policy.setter
    def image_pull_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb0d265de7e033fcadd6e4e60f4ca2959d874a19314c7358ad80ca8cd6f4e783)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imagePullPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__488afaaf77dfd7e35adf779474a347cd6d41dab2fe85059ccc74845a5cff84a9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesContainers]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesContainers]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesContainers]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b874ec6a1e59fc5c0fe664d7ba573a8af46e64bf8fc39153490cfe16d2143e63)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersResources",
    jsii_struct_bases=[],
    name_mapping={"limits": "limits", "requests": "requests"},
)
class BatchJobDefinitionEksPropertiesPodPropertiesContainersResources:
    def __init__(
        self,
        *,
        limits: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        requests: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param limits: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#limits BatchJobDefinition#limits}.
        :param requests: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#requests BatchJobDefinition#requests}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd7b08ee7f7bd45eed66b418623671d21875325d669700c9b4f5b397b1c821d5)
            check_type(argname="argument limits", value=limits, expected_type=type_hints["limits"])
            check_type(argname="argument requests", value=requests, expected_type=type_hints["requests"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if limits is not None:
            self._values["limits"] = limits
        if requests is not None:
            self._values["requests"] = requests

    @builtins.property
    def limits(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#limits BatchJobDefinition#limits}.'''
        result = self._values.get("limits")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def requests(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#requests BatchJobDefinition#requests}.'''
        result = self._values.get("requests")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesContainersResources(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesContainersResourcesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersResourcesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__98a9a51b9e5bf92fb9fcb1e67080c76d757533f5f821ff00d8e69e8a2091e600)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetLimits")
    def reset_limits(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLimits", []))

    @jsii.member(jsii_name="resetRequests")
    def reset_requests(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRequests", []))

    @builtins.property
    @jsii.member(jsii_name="limitsInput")
    def limits_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "limitsInput"))

    @builtins.property
    @jsii.member(jsii_name="requestsInput")
    def requests_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "requestsInput"))

    @builtins.property
    @jsii.member(jsii_name="limits")
    def limits(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "limits"))

    @limits.setter
    def limits(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5608fbab44a8c8da136bf9c3c67c9655a8a57a1a73f247de12a9622fba5e44c9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "limits", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="requests")
    def requests(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "requests"))

    @requests.setter
    def requests(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b59d1d3fb9aaa0373c75beb8bfbe3fb4fd98f0c7dc5942ea5029c7d03cfbbe6b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "requests", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesContainersResources]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesContainersResources], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesContainersResources],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6a423643a34657ff0f3dddf10546fbfe490a962b486df3166f725c62236ad26f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext",
    jsii_struct_bases=[],
    name_mapping={
        "privileged": "privileged",
        "read_only_root_file_system": "readOnlyRootFileSystem",
        "run_as_group": "runAsGroup",
        "run_as_non_root": "runAsNonRoot",
        "run_as_user": "runAsUser",
    },
)
class BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext:
    def __init__(
        self,
        *,
        privileged: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        read_only_root_file_system: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        run_as_group: typing.Optional[jsii.Number] = None,
        run_as_non_root: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        run_as_user: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param privileged: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#privileged BatchJobDefinition#privileged}.
        :param read_only_root_file_system: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only_root_file_system BatchJobDefinition#read_only_root_file_system}.
        :param run_as_group: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_group BatchJobDefinition#run_as_group}.
        :param run_as_non_root: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_non_root BatchJobDefinition#run_as_non_root}.
        :param run_as_user: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_user BatchJobDefinition#run_as_user}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7348e2d5e06ac9da82698e995ca72e26b9bd644fb9970a995b6ba0ae7236ecd)
            check_type(argname="argument privileged", value=privileged, expected_type=type_hints["privileged"])
            check_type(argname="argument read_only_root_file_system", value=read_only_root_file_system, expected_type=type_hints["read_only_root_file_system"])
            check_type(argname="argument run_as_group", value=run_as_group, expected_type=type_hints["run_as_group"])
            check_type(argname="argument run_as_non_root", value=run_as_non_root, expected_type=type_hints["run_as_non_root"])
            check_type(argname="argument run_as_user", value=run_as_user, expected_type=type_hints["run_as_user"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if privileged is not None:
            self._values["privileged"] = privileged
        if read_only_root_file_system is not None:
            self._values["read_only_root_file_system"] = read_only_root_file_system
        if run_as_group is not None:
            self._values["run_as_group"] = run_as_group
        if run_as_non_root is not None:
            self._values["run_as_non_root"] = run_as_non_root
        if run_as_user is not None:
            self._values["run_as_user"] = run_as_user

    @builtins.property
    def privileged(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#privileged BatchJobDefinition#privileged}.'''
        result = self._values.get("privileged")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def read_only_root_file_system(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only_root_file_system BatchJobDefinition#read_only_root_file_system}.'''
        result = self._values.get("read_only_root_file_system")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def run_as_group(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_group BatchJobDefinition#run_as_group}.'''
        result = self._values.get("run_as_group")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def run_as_non_root(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_non_root BatchJobDefinition#run_as_non_root}.'''
        result = self._values.get("run_as_non_root")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def run_as_user(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_user BatchJobDefinition#run_as_user}.'''
        result = self._values.get("run_as_user")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContextOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContextOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__60b89a930a0f0f973c55a6b3a6fcdd359cf200bf219086ea2362e1fc6507cbd3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetPrivileged")
    def reset_privileged(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrivileged", []))

    @jsii.member(jsii_name="resetReadOnlyRootFileSystem")
    def reset_read_only_root_file_system(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReadOnlyRootFileSystem", []))

    @jsii.member(jsii_name="resetRunAsGroup")
    def reset_run_as_group(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRunAsGroup", []))

    @jsii.member(jsii_name="resetRunAsNonRoot")
    def reset_run_as_non_root(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRunAsNonRoot", []))

    @jsii.member(jsii_name="resetRunAsUser")
    def reset_run_as_user(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRunAsUser", []))

    @builtins.property
    @jsii.member(jsii_name="privilegedInput")
    def privileged_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "privilegedInput"))

    @builtins.property
    @jsii.member(jsii_name="readOnlyRootFileSystemInput")
    def read_only_root_file_system_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "readOnlyRootFileSystemInput"))

    @builtins.property
    @jsii.member(jsii_name="runAsGroupInput")
    def run_as_group_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "runAsGroupInput"))

    @builtins.property
    @jsii.member(jsii_name="runAsNonRootInput")
    def run_as_non_root_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "runAsNonRootInput"))

    @builtins.property
    @jsii.member(jsii_name="runAsUserInput")
    def run_as_user_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "runAsUserInput"))

    @builtins.property
    @jsii.member(jsii_name="privileged")
    def privileged(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "privileged"))

    @privileged.setter
    def privileged(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b18be215815701df751bfb09fbcbeb28153b447a6fd581a0c553e6bb0f0dcf5c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "privileged", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="readOnlyRootFileSystem")
    def read_only_root_file_system(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "readOnlyRootFileSystem"))

    @read_only_root_file_system.setter
    def read_only_root_file_system(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__77d159e97221335c4f95716534ccfdd27295cbef32a7529e6fba77c9fd3eb7fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "readOnlyRootFileSystem", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="runAsGroup")
    def run_as_group(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "runAsGroup"))

    @run_as_group.setter
    def run_as_group(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b82fcd66312bcd84e6904cfc9e87dddd189f6b8ee730a27f20bcbf51f459949)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "runAsGroup", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="runAsNonRoot")
    def run_as_non_root(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "runAsNonRoot"))

    @run_as_non_root.setter
    def run_as_non_root(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21c227de51b759f309e6036cf720792187363e87a323d9baad98bad896715e05)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "runAsNonRoot", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="runAsUser")
    def run_as_user(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "runAsUser"))

    @run_as_user.setter
    def run_as_user(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1bb3ea9f4a328f2c60ef2952e3fedff1a47001f1a78f7481d13cb975d78e255e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "runAsUser", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59057d3220f9d1db848a6f5c72482247e1dfac11c1159a959772f5399e70c226)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts",
    jsii_struct_bases=[],
    name_mapping={"mount_path": "mountPath", "name": "name", "read_only": "readOnly"},
)
class BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts:
    def __init__(
        self,
        *,
        mount_path: builtins.str,
        name: builtins.str,
        read_only: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param mount_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#mount_path BatchJobDefinition#mount_path}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
        :param read_only: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only BatchJobDefinition#read_only}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d40d61bf94f988a270a13004ca7e9f4b4b7cd09c18f562006c6408d60728122)
            check_type(argname="argument mount_path", value=mount_path, expected_type=type_hints["mount_path"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument read_only", value=read_only, expected_type=type_hints["read_only"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "mount_path": mount_path,
            "name": name,
        }
        if read_only is not None:
            self._values["read_only"] = read_only

    @builtins.property
    def mount_path(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#mount_path BatchJobDefinition#mount_path}.'''
        result = self._values.get("mount_path")
        assert result is not None, "Required property 'mount_path' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def read_only(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only BatchJobDefinition#read_only}.'''
        result = self._values.get("read_only")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMountsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMountsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c6d8d51d1d29f1c1e971ddedc26ad05c8296f2f245989e10c88fbef4f967ed50)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMountsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__629eb2b16d9fb98a69b78a8e5fa5a56d01c03c2cc45c3d0a580828e72a98ccbf)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMountsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__823defbfb502ff39a80a83c9872a8e2ef5db7b7576e69e2dd3dfbd18d9fb4bdc)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f408bc91ad587d7835d3209347d89eede716f15224fb930a14884fc81d969e20)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ac4f3338c698bc7f3e7c253b0c7cbb8fa3766dd241c53f9858b485dd444a7a81)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__55c34e8b7ebbe19be52e88bbdd828cbf8c0595af9b816202246ee21c2b65c22f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMountsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMountsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a9083746d85163b8a706c1fe9e3e25fa39b424441a998f26f248c588a69cd27f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetReadOnly")
    def reset_read_only(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReadOnly", []))

    @builtins.property
    @jsii.member(jsii_name="mountPathInput")
    def mount_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "mountPathInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="readOnlyInput")
    def read_only_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "readOnlyInput"))

    @builtins.property
    @jsii.member(jsii_name="mountPath")
    def mount_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mountPath"))

    @mount_path.setter
    def mount_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed2b507e74d67f59a3f60b888d67410e8a2d2d4ead269abed439095c2a127da0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mountPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6120ae2a0e8345ecc2c78d71cef00dbef13bdf68ff1b07aae692ab09c951a2f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="readOnly")
    def read_only(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "readOnly"))

    @read_only.setter
    def read_only(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ecf72b29d21cd53fb27433679ecf768215442eb78cd88b55237a4200557939ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "readOnly", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12464cb8b7d961d65338731c346b3a7c39d2a2fde3d3d416829a3f084cdd5521)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret",
    jsii_struct_bases=[],
    name_mapping={"name": "name"},
)
class BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret:
    def __init__(self, *, name: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ce31e0469c326b10237cb4472deaf358ca7199a8d16fe2254a048cd7ed32922)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__12cc1d004a1eac2606109fcaa4547b56048800ce109eb10b147a44ee11a4efd1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75cfa1fbfef7c9fc975d3292ad14d04b1f585d8ef6c4a5f40c4151d53db2bcdc)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__da548a8acd49d551bdc0fe02c0651ead9dfe6a9ed61e7962a7a638c90c779ad2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7cef4b752b492c6b3bdbb412a6234babee54d54b8e44def30c09d28b7dc1a1c4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__26078f34ac8bbc66f4989022fb5c487786d7f35ddfa799062c7987142c493e75)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a68da869e27b8c80fdeffb7fb115a2f140b3bb85034fe081956be268aabc9444)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c57ffa87acf91e9617d2bc61bd93b2f501c3374f40efdd073f91759e0526d400)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f0000186e22be794becb14660f187cca42be77f77db52666de013f046fa210ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dcba1157932a2fcb9207df291ad31beec89f25c1295cb2d18e5a0b3bddd1b6ca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainers",
    jsii_struct_bases=[],
    name_mapping={
        "image": "image",
        "args": "args",
        "command": "command",
        "env": "env",
        "image_pull_policy": "imagePullPolicy",
        "name": "name",
        "resources": "resources",
        "security_context": "securityContext",
        "volume_mounts": "volumeMounts",
    },
)
class BatchJobDefinitionEksPropertiesPodPropertiesInitContainers:
    def __init__(
        self,
        *,
        image: builtins.str,
        args: typing.Optional[typing.Sequence[builtins.str]] = None,
        command: typing.Optional[typing.Sequence[builtins.str]] = None,
        env: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv", typing.Dict[builtins.str, typing.Any]]]]] = None,
        image_pull_policy: typing.Optional[builtins.str] = None,
        name: typing.Optional[builtins.str] = None,
        resources: typing.Optional[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources", typing.Dict[builtins.str, typing.Any]]] = None,
        security_context: typing.Optional[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext", typing.Dict[builtins.str, typing.Any]]] = None,
        volume_mounts: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param image: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image BatchJobDefinition#image}.
        :param args: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#args BatchJobDefinition#args}.
        :param command: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#command BatchJobDefinition#command}.
        :param env: env block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#env BatchJobDefinition#env}
        :param image_pull_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image_pull_policy BatchJobDefinition#image_pull_policy}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
        :param resources: resources block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#resources BatchJobDefinition#resources}
        :param security_context: security_context block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#security_context BatchJobDefinition#security_context}
        :param volume_mounts: volume_mounts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volume_mounts BatchJobDefinition#volume_mounts}
        '''
        if isinstance(resources, dict):
            resources = BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources(**resources)
        if isinstance(security_context, dict):
            security_context = BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext(**security_context)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f9a10b3790ebf2e3b29143effb0d446baab70de0722fe2c0ddb775e4fb199281)
            check_type(argname="argument image", value=image, expected_type=type_hints["image"])
            check_type(argname="argument args", value=args, expected_type=type_hints["args"])
            check_type(argname="argument command", value=command, expected_type=type_hints["command"])
            check_type(argname="argument env", value=env, expected_type=type_hints["env"])
            check_type(argname="argument image_pull_policy", value=image_pull_policy, expected_type=type_hints["image_pull_policy"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument resources", value=resources, expected_type=type_hints["resources"])
            check_type(argname="argument security_context", value=security_context, expected_type=type_hints["security_context"])
            check_type(argname="argument volume_mounts", value=volume_mounts, expected_type=type_hints["volume_mounts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "image": image,
        }
        if args is not None:
            self._values["args"] = args
        if command is not None:
            self._values["command"] = command
        if env is not None:
            self._values["env"] = env
        if image_pull_policy is not None:
            self._values["image_pull_policy"] = image_pull_policy
        if name is not None:
            self._values["name"] = name
        if resources is not None:
            self._values["resources"] = resources
        if security_context is not None:
            self._values["security_context"] = security_context
        if volume_mounts is not None:
            self._values["volume_mounts"] = volume_mounts

    @builtins.property
    def image(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image BatchJobDefinition#image}.'''
        result = self._values.get("image")
        assert result is not None, "Required property 'image' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def args(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#args BatchJobDefinition#args}.'''
        result = self._values.get("args")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def command(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#command BatchJobDefinition#command}.'''
        result = self._values.get("command")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def env(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv"]]]:
        '''env block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#env BatchJobDefinition#env}
        '''
        result = self._values.get("env")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv"]]], result)

    @builtins.property
    def image_pull_policy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image_pull_policy BatchJobDefinition#image_pull_policy}.'''
        result = self._values.get("image_pull_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def resources(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources"]:
        '''resources block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#resources BatchJobDefinition#resources}
        '''
        result = self._values.get("resources")
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources"], result)

    @builtins.property
    def security_context(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext"]:
        '''security_context block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#security_context BatchJobDefinition#security_context}
        '''
        result = self._values.get("security_context")
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext"], result)

    @builtins.property
    def volume_mounts(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts"]]]:
        '''volume_mounts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volume_mounts BatchJobDefinition#volume_mounts}
        '''
        result = self._values.get("volume_mounts")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesInitContainers(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "value": "value"},
)
class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv:
    def __init__(self, *, name: builtins.str, value: builtins.str) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
        :param value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#value BatchJobDefinition#value}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d531e1ec962a2d2f998f982f9b11fcb607ed87bd727542f2e9b069d6d08ca0d)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "value": value,
        }

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def value(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#value BatchJobDefinition#value}.'''
        result = self._values.get("value")
        assert result is not None, "Required property 'value' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnvList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnvList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__aef21e7cf4a15e843c9ab32073df04fcda02b1a91d8af90436eddb634c1656b4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnvOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d12cc2d9641ca78c6831ee0c9546bc747177fa66a9cbf7a1f2fc5e0f89c5e08)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnvOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__816c2eadb3e3ab35d705bbf55215a6b4dfb6e74e335c42a7378513cb7c45d29c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cda9d3d0fe936d4df13d73e09d0c35068b4a5799c14dee6b78b4056227d7a365)
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
            type_hints = typing.get_type_hints(_typecheckingstub__028116a436f2667a5bf07bd76b79515ee5202f22ca01085b75bc2bf9d86ff5bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d53b7664b8f0e5a80deab93c15ca7a37d7a123369eac68c8172fdc33640e7584)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnvOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnvOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bb1d585fdcd0184deaf92fa2ca8c4d54753f3de6bb7f3562d14219be3fb3f5dd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__039e110dcb27a4f17ffe1b5b4b76458c36ce52dcf35b93691b295edca32b717c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="value")
    def value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "value"))

    @value.setter
    def value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6494692bc00dad206a38838854f162e4b2bdac5cb62c02537f6310466c864ea5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "value", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18022cdd4064320b344b5af15528126cd4d342e77d5bf06303bdbe4c42e4cd88)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bc4f3715eca552321b35b7afe904da905fc4089aa2beee55ce6c63472b66d762)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04f514d3f38c7c90ee79971db2eef3744215dd78d8691eb83b88d2ce318eee1b)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesInitContainersOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4287aeef212c34ce1f1e7d793fe4f610636712831a9f2a965620529bf0ae9a3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__233c54def38ea739b26bf9a1adde6049d974a20d014c1bb6b29a051d379cdf66)
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
            type_hints = typing.get_type_hints(_typecheckingstub__781456aaeb71e60ec1724b0138adc4bdeb740907dcc627987dcb3809a05c3cab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainers]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainers]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainers]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e16eddeb02a106d06781e59652ee0ae6f6f64a9648169eed1e143ca3ce87085)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0846d7295eabd182a210c2978929a8044d4fea364f1db6c52b55b0a2705f6dfa)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putEnv")
    def put_env(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__538373f08b0016a7ca87bc2f9f288a6071e18812bf71bea37b65433bdf1ee7e5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEnv", [value]))

    @jsii.member(jsii_name="putResources")
    def put_resources(
        self,
        *,
        limits: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        requests: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param limits: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#limits BatchJobDefinition#limits}.
        :param requests: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#requests BatchJobDefinition#requests}.
        '''
        value = BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources(
            limits=limits, requests=requests
        )

        return typing.cast(None, jsii.invoke(self, "putResources", [value]))

    @jsii.member(jsii_name="putSecurityContext")
    def put_security_context(
        self,
        *,
        privileged: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        read_only_root_file_system: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        run_as_group: typing.Optional[jsii.Number] = None,
        run_as_non_root: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        run_as_user: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param privileged: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#privileged BatchJobDefinition#privileged}.
        :param read_only_root_file_system: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only_root_file_system BatchJobDefinition#read_only_root_file_system}.
        :param run_as_group: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_group BatchJobDefinition#run_as_group}.
        :param run_as_non_root: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_non_root BatchJobDefinition#run_as_non_root}.
        :param run_as_user: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_user BatchJobDefinition#run_as_user}.
        '''
        value = BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext(
            privileged=privileged,
            read_only_root_file_system=read_only_root_file_system,
            run_as_group=run_as_group,
            run_as_non_root=run_as_non_root,
            run_as_user=run_as_user,
        )

        return typing.cast(None, jsii.invoke(self, "putSecurityContext", [value]))

    @jsii.member(jsii_name="putVolumeMounts")
    def put_volume_mounts(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__88100cb7658a31a24216ba016abd1803010c2cf76c4c66f7d2e1f25b1aa5ef87)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putVolumeMounts", [value]))

    @jsii.member(jsii_name="resetArgs")
    def reset_args(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetArgs", []))

    @jsii.member(jsii_name="resetCommand")
    def reset_command(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCommand", []))

    @jsii.member(jsii_name="resetEnv")
    def reset_env(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnv", []))

    @jsii.member(jsii_name="resetImagePullPolicy")
    def reset_image_pull_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImagePullPolicy", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetResources")
    def reset_resources(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResources", []))

    @jsii.member(jsii_name="resetSecurityContext")
    def reset_security_context(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityContext", []))

    @jsii.member(jsii_name="resetVolumeMounts")
    def reset_volume_mounts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVolumeMounts", []))

    @builtins.property
    @jsii.member(jsii_name="env")
    def env(self) -> BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnvList:
        return typing.cast(BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnvList, jsii.get(self, "env"))

    @builtins.property
    @jsii.member(jsii_name="resources")
    def resources(
        self,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResourcesOutputReference":
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResourcesOutputReference", jsii.get(self, "resources"))

    @builtins.property
    @jsii.member(jsii_name="securityContext")
    def security_context(
        self,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContextOutputReference":
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContextOutputReference", jsii.get(self, "securityContext"))

    @builtins.property
    @jsii.member(jsii_name="volumeMounts")
    def volume_mounts(
        self,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMountsList":
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMountsList", jsii.get(self, "volumeMounts"))

    @builtins.property
    @jsii.member(jsii_name="argsInput")
    def args_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "argsInput"))

    @builtins.property
    @jsii.member(jsii_name="commandInput")
    def command_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "commandInput"))

    @builtins.property
    @jsii.member(jsii_name="envInput")
    def env_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv]]], jsii.get(self, "envInput"))

    @builtins.property
    @jsii.member(jsii_name="imageInput")
    def image_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "imageInput"))

    @builtins.property
    @jsii.member(jsii_name="imagePullPolicyInput")
    def image_pull_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "imagePullPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="resourcesInput")
    def resources_input(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources"]:
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources"], jsii.get(self, "resourcesInput"))

    @builtins.property
    @jsii.member(jsii_name="securityContextInput")
    def security_context_input(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext"]:
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext"], jsii.get(self, "securityContextInput"))

    @builtins.property
    @jsii.member(jsii_name="volumeMountsInput")
    def volume_mounts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts"]]], jsii.get(self, "volumeMountsInput"))

    @builtins.property
    @jsii.member(jsii_name="args")
    def args(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "args"))

    @args.setter
    def args(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2b4ed33d238ae88fbb7c6a361cf8f06f04c29a40c6e575080a3ac1edf5679ff8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "args", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="command")
    def command(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "command"))

    @command.setter
    def command(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ccbca763fa629fbc10c2cc8268002754155bd8d8fef5df703a3c82032082297c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "command", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="image")
    def image(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "image"))

    @image.setter
    def image(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d61375c673fd00dfe1a075726f64d7247774818276720f70955274e24eed1978)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "image", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imagePullPolicy")
    def image_pull_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "imagePullPolicy"))

    @image_pull_policy.setter
    def image_pull_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b6b5ffc2ed93cf3eee831c0e5219ede37acfc495011a954023ff00e277236ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imagePullPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7797ed53b526c84227945665071e5603c9ee5dfedda3b70250a57dd3305436e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesInitContainers]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesInitContainers]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesInitContainers]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__756d3f3d3ae5c86d3009e47d9b7902e7d6331cb6e21c5f5f41210738207810ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources",
    jsii_struct_bases=[],
    name_mapping={"limits": "limits", "requests": "requests"},
)
class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources:
    def __init__(
        self,
        *,
        limits: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        requests: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param limits: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#limits BatchJobDefinition#limits}.
        :param requests: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#requests BatchJobDefinition#requests}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f8fc5da9a47f5ef46c12622b094a2103f49ff212690f0a13eb38509c4a9d8915)
            check_type(argname="argument limits", value=limits, expected_type=type_hints["limits"])
            check_type(argname="argument requests", value=requests, expected_type=type_hints["requests"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if limits is not None:
            self._values["limits"] = limits
        if requests is not None:
            self._values["requests"] = requests

    @builtins.property
    def limits(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#limits BatchJobDefinition#limits}.'''
        result = self._values.get("limits")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def requests(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#requests BatchJobDefinition#requests}.'''
        result = self._values.get("requests")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResourcesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResourcesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6c74aa01b2a65d11d2e997875bfab257ba02462c3b528ad783962a54c7ec1a9c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetLimits")
    def reset_limits(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLimits", []))

    @jsii.member(jsii_name="resetRequests")
    def reset_requests(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRequests", []))

    @builtins.property
    @jsii.member(jsii_name="limitsInput")
    def limits_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "limitsInput"))

    @builtins.property
    @jsii.member(jsii_name="requestsInput")
    def requests_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "requestsInput"))

    @builtins.property
    @jsii.member(jsii_name="limits")
    def limits(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "limits"))

    @limits.setter
    def limits(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c176116bef771078875f1e11eab9bdefe8da8eeb80d88997cb5cf6a56d50b29)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "limits", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="requests")
    def requests(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "requests"))

    @requests.setter
    def requests(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dce424495f8c43204feef7437776e9085cd4591599b84183fd33addf52285db4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "requests", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e778e5fc74ba9900d4d48dea6fd8a3152cf5f8726d18b2c8e4db23f766d547c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext",
    jsii_struct_bases=[],
    name_mapping={
        "privileged": "privileged",
        "read_only_root_file_system": "readOnlyRootFileSystem",
        "run_as_group": "runAsGroup",
        "run_as_non_root": "runAsNonRoot",
        "run_as_user": "runAsUser",
    },
)
class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext:
    def __init__(
        self,
        *,
        privileged: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        read_only_root_file_system: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        run_as_group: typing.Optional[jsii.Number] = None,
        run_as_non_root: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        run_as_user: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param privileged: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#privileged BatchJobDefinition#privileged}.
        :param read_only_root_file_system: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only_root_file_system BatchJobDefinition#read_only_root_file_system}.
        :param run_as_group: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_group BatchJobDefinition#run_as_group}.
        :param run_as_non_root: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_non_root BatchJobDefinition#run_as_non_root}.
        :param run_as_user: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_user BatchJobDefinition#run_as_user}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__be00936ecfaed0df2e8f089ca8ba780cfd1d0fa4e326b5622a109ae327935a99)
            check_type(argname="argument privileged", value=privileged, expected_type=type_hints["privileged"])
            check_type(argname="argument read_only_root_file_system", value=read_only_root_file_system, expected_type=type_hints["read_only_root_file_system"])
            check_type(argname="argument run_as_group", value=run_as_group, expected_type=type_hints["run_as_group"])
            check_type(argname="argument run_as_non_root", value=run_as_non_root, expected_type=type_hints["run_as_non_root"])
            check_type(argname="argument run_as_user", value=run_as_user, expected_type=type_hints["run_as_user"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if privileged is not None:
            self._values["privileged"] = privileged
        if read_only_root_file_system is not None:
            self._values["read_only_root_file_system"] = read_only_root_file_system
        if run_as_group is not None:
            self._values["run_as_group"] = run_as_group
        if run_as_non_root is not None:
            self._values["run_as_non_root"] = run_as_non_root
        if run_as_user is not None:
            self._values["run_as_user"] = run_as_user

    @builtins.property
    def privileged(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#privileged BatchJobDefinition#privileged}.'''
        result = self._values.get("privileged")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def read_only_root_file_system(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only_root_file_system BatchJobDefinition#read_only_root_file_system}.'''
        result = self._values.get("read_only_root_file_system")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def run_as_group(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_group BatchJobDefinition#run_as_group}.'''
        result = self._values.get("run_as_group")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def run_as_non_root(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_non_root BatchJobDefinition#run_as_non_root}.'''
        result = self._values.get("run_as_non_root")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def run_as_user(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#run_as_user BatchJobDefinition#run_as_user}.'''
        result = self._values.get("run_as_user")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContextOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContextOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d5fab9aafd37f4485f768656c4febab81dc8a1cc46fd5efd10903e0d4ac38b82)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetPrivileged")
    def reset_privileged(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrivileged", []))

    @jsii.member(jsii_name="resetReadOnlyRootFileSystem")
    def reset_read_only_root_file_system(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReadOnlyRootFileSystem", []))

    @jsii.member(jsii_name="resetRunAsGroup")
    def reset_run_as_group(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRunAsGroup", []))

    @jsii.member(jsii_name="resetRunAsNonRoot")
    def reset_run_as_non_root(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRunAsNonRoot", []))

    @jsii.member(jsii_name="resetRunAsUser")
    def reset_run_as_user(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRunAsUser", []))

    @builtins.property
    @jsii.member(jsii_name="privilegedInput")
    def privileged_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "privilegedInput"))

    @builtins.property
    @jsii.member(jsii_name="readOnlyRootFileSystemInput")
    def read_only_root_file_system_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "readOnlyRootFileSystemInput"))

    @builtins.property
    @jsii.member(jsii_name="runAsGroupInput")
    def run_as_group_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "runAsGroupInput"))

    @builtins.property
    @jsii.member(jsii_name="runAsNonRootInput")
    def run_as_non_root_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "runAsNonRootInput"))

    @builtins.property
    @jsii.member(jsii_name="runAsUserInput")
    def run_as_user_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "runAsUserInput"))

    @builtins.property
    @jsii.member(jsii_name="privileged")
    def privileged(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "privileged"))

    @privileged.setter
    def privileged(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb77f1b5552a50fce086787a22ff8197a5b3329979f63cf29658ec12dbe13c43)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "privileged", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="readOnlyRootFileSystem")
    def read_only_root_file_system(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "readOnlyRootFileSystem"))

    @read_only_root_file_system.setter
    def read_only_root_file_system(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6427fefbfdcf2537fb193fca383047c2ed2d623a5ac744475797a00a6b3c5bec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "readOnlyRootFileSystem", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="runAsGroup")
    def run_as_group(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "runAsGroup"))

    @run_as_group.setter
    def run_as_group(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79b56e06616c92f87084f069c1325b3d19928d1b8fa2b8065dee2f1e6c8a25ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "runAsGroup", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="runAsNonRoot")
    def run_as_non_root(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "runAsNonRoot"))

    @run_as_non_root.setter
    def run_as_non_root(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79d61294dc2a8153f9329ef5ab7cdea09e1c15ac174e7bc1fb138cca50f6c326)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "runAsNonRoot", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="runAsUser")
    def run_as_user(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "runAsUser"))

    @run_as_user.setter
    def run_as_user(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22ada655a025d5596904ca5f6c278eed6520ca66e9e0a41c01027a9e02402ca2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "runAsUser", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2145b725f39dd98f46b6b1efd0eefd07ad6ba018376bed9541864d1fd0ad7e31)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts",
    jsii_struct_bases=[],
    name_mapping={"mount_path": "mountPath", "name": "name", "read_only": "readOnly"},
)
class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts:
    def __init__(
        self,
        *,
        mount_path: builtins.str,
        name: builtins.str,
        read_only: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param mount_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#mount_path BatchJobDefinition#mount_path}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
        :param read_only: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only BatchJobDefinition#read_only}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3c2eebe483198f528f6ccced06813c003b406b753a60cc1a33612f45c5bfdd9)
            check_type(argname="argument mount_path", value=mount_path, expected_type=type_hints["mount_path"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument read_only", value=read_only, expected_type=type_hints["read_only"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "mount_path": mount_path,
            "name": name,
        }
        if read_only is not None:
            self._values["read_only"] = read_only

    @builtins.property
    def mount_path(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#mount_path BatchJobDefinition#mount_path}.'''
        result = self._values.get("mount_path")
        assert result is not None, "Required property 'mount_path' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def read_only(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#read_only BatchJobDefinition#read_only}.'''
        result = self._values.get("read_only")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMountsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMountsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__81b025e8b32ada8fc7f2361e2a1d11efae2efcf351708ee8f148dba504a2ea57)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMountsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3fcbe2bf14001834329534246c8ff78750bfae55262349723306f9e9c557918c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMountsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15e83e864518774349497d9241c837dce9ee0dda5c048fb270649e335ae26166)
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
            type_hints = typing.get_type_hints(_typecheckingstub__81ca46f25afdf907871869cd2172c7b850b6c5cbb7cd7ea4deea709d6a01eada)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1142bd424ab25a3e123799a916497517a56649c60a8922fc87181a62b009e9d1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e1f0633a9d96bca4314ccee69f7bf01d62ec178f9ef8c054f6ea914fe4d14e10)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMountsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMountsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c68606b4f4e3a8e53627556231abbbb230663518b87edaee7f7f0da289e87457)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetReadOnly")
    def reset_read_only(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReadOnly", []))

    @builtins.property
    @jsii.member(jsii_name="mountPathInput")
    def mount_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "mountPathInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="readOnlyInput")
    def read_only_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "readOnlyInput"))

    @builtins.property
    @jsii.member(jsii_name="mountPath")
    def mount_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mountPath"))

    @mount_path.setter
    def mount_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1532d35beddb078b671ad4bf1bc3db6b1cb95aec66301f834d19bd4899f6dc51)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mountPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2d493feef46c75509bc140a6218f23fb0b9ff46c5598a1ecd4f8b2ef5c92eb46)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="readOnly")
    def read_only(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "readOnly"))

    @read_only.setter
    def read_only(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9a30aff163c81785226a19f1b9eb6cb7b42daaaa810dc08eab648819f394d10a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "readOnly", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__237c5424627d0313116cb38965ad8bdf483152b087e6cb5e50691e12546a52e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesMetadata",
    jsii_struct_bases=[],
    name_mapping={"labels": "labels"},
)
class BatchJobDefinitionEksPropertiesPodPropertiesMetadata:
    def __init__(
        self,
        *,
        labels: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param labels: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#labels BatchJobDefinition#labels}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7314688d5d113803bbdae9072e8261ecd71c37941581a63ddcbf8b36bdc125e6)
            check_type(argname="argument labels", value=labels, expected_type=type_hints["labels"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if labels is not None:
            self._values["labels"] = labels

    @builtins.property
    def labels(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#labels BatchJobDefinition#labels}.'''
        result = self._values.get("labels")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesMetadata(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesMetadataOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesMetadataOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__05693cb513b00a62320ae9cee5bc424339d80d406b5b9cc79b4a9e99d51935b1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetLabels")
    def reset_labels(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLabels", []))

    @builtins.property
    @jsii.member(jsii_name="labelsInput")
    def labels_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "labelsInput"))

    @builtins.property
    @jsii.member(jsii_name="labels")
    def labels(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "labels"))

    @labels.setter
    def labels(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__689fde19dc3e4525bc83d80540ad897881ebc504f4dae87ef923e7ad93d72d70)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "labels", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesMetadata]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesMetadata], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesMetadata],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d8bf6a25162960abaa75c4699a35a7762362d08d11a5f15b1f86f2051723c201)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionEksPropertiesPodPropertiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3ff08a95ca64686f98f84dfff52f384e9c31a4e1daf575d5fb34793347e31ef8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putContainers")
    def put_containers(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesContainers, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6fa7033ce000fda293267e8f5e76f6fbf24dc1c30bcb7bc8be9a190532ec75e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putContainers", [value]))

    @jsii.member(jsii_name="putImagePullSecret")
    def put_image_pull_secret(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee78c5c2bbddc3b5d25a19489b669906d32d4f2ca2b759f5a774f5ce1bc748c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putImagePullSecret", [value]))

    @jsii.member(jsii_name="putInitContainers")
    def put_init_containers(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesInitContainers, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__93683e7371fe9808d04bfe0c33df2113fcddd134c13d60622dc71f5e48839349)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putInitContainers", [value]))

    @jsii.member(jsii_name="putMetadata")
    def put_metadata(
        self,
        *,
        labels: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param labels: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#labels BatchJobDefinition#labels}.
        '''
        value = BatchJobDefinitionEksPropertiesPodPropertiesMetadata(labels=labels)

        return typing.cast(None, jsii.invoke(self, "putMetadata", [value]))

    @jsii.member(jsii_name="putVolumes")
    def put_volumes(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesVolumes", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b06405787894ef196fb629f4c854726c4d2540a52f864ddd6f5b7c82798dee66)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putVolumes", [value]))

    @jsii.member(jsii_name="resetDnsPolicy")
    def reset_dns_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDnsPolicy", []))

    @jsii.member(jsii_name="resetHostNetwork")
    def reset_host_network(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHostNetwork", []))

    @jsii.member(jsii_name="resetImagePullSecret")
    def reset_image_pull_secret(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImagePullSecret", []))

    @jsii.member(jsii_name="resetInitContainers")
    def reset_init_containers(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInitContainers", []))

    @jsii.member(jsii_name="resetMetadata")
    def reset_metadata(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMetadata", []))

    @jsii.member(jsii_name="resetServiceAccountName")
    def reset_service_account_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetServiceAccountName", []))

    @jsii.member(jsii_name="resetShareProcessNamespace")
    def reset_share_process_namespace(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetShareProcessNamespace", []))

    @jsii.member(jsii_name="resetVolumes")
    def reset_volumes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVolumes", []))

    @builtins.property
    @jsii.member(jsii_name="containers")
    def containers(self) -> BatchJobDefinitionEksPropertiesPodPropertiesContainersList:
        return typing.cast(BatchJobDefinitionEksPropertiesPodPropertiesContainersList, jsii.get(self, "containers"))

    @builtins.property
    @jsii.member(jsii_name="imagePullSecret")
    def image_pull_secret(
        self,
    ) -> BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretList:
        return typing.cast(BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretList, jsii.get(self, "imagePullSecret"))

    @builtins.property
    @jsii.member(jsii_name="initContainers")
    def init_containers(
        self,
    ) -> BatchJobDefinitionEksPropertiesPodPropertiesInitContainersList:
        return typing.cast(BatchJobDefinitionEksPropertiesPodPropertiesInitContainersList, jsii.get(self, "initContainers"))

    @builtins.property
    @jsii.member(jsii_name="metadata")
    def metadata(
        self,
    ) -> BatchJobDefinitionEksPropertiesPodPropertiesMetadataOutputReference:
        return typing.cast(BatchJobDefinitionEksPropertiesPodPropertiesMetadataOutputReference, jsii.get(self, "metadata"))

    @builtins.property
    @jsii.member(jsii_name="volumes")
    def volumes(self) -> "BatchJobDefinitionEksPropertiesPodPropertiesVolumesList":
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesVolumesList", jsii.get(self, "volumes"))

    @builtins.property
    @jsii.member(jsii_name="containersInput")
    def containers_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainers]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainers]]], jsii.get(self, "containersInput"))

    @builtins.property
    @jsii.member(jsii_name="dnsPolicyInput")
    def dns_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dnsPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="hostNetworkInput")
    def host_network_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "hostNetworkInput"))

    @builtins.property
    @jsii.member(jsii_name="imagePullSecretInput")
    def image_pull_secret_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret]]], jsii.get(self, "imagePullSecretInput"))

    @builtins.property
    @jsii.member(jsii_name="initContainersInput")
    def init_containers_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainers]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainers]]], jsii.get(self, "initContainersInput"))

    @builtins.property
    @jsii.member(jsii_name="metadataInput")
    def metadata_input(
        self,
    ) -> typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesMetadata]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesMetadata], jsii.get(self, "metadataInput"))

    @builtins.property
    @jsii.member(jsii_name="serviceAccountNameInput")
    def service_account_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "serviceAccountNameInput"))

    @builtins.property
    @jsii.member(jsii_name="shareProcessNamespaceInput")
    def share_process_namespace_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "shareProcessNamespaceInput"))

    @builtins.property
    @jsii.member(jsii_name="volumesInput")
    def volumes_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesVolumes"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionEksPropertiesPodPropertiesVolumes"]]], jsii.get(self, "volumesInput"))

    @builtins.property
    @jsii.member(jsii_name="dnsPolicy")
    def dns_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dnsPolicy"))

    @dns_policy.setter
    def dns_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd13a36bc6384006700bfa4e083c5fee358544120a51b8dbc941ce52ae92dc56)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dnsPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="hostNetwork")
    def host_network(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "hostNetwork"))

    @host_network.setter
    def host_network(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d874c9e9c673d8be7b3fdd84204873b72cd0e7299ac2e3b509dea13b03d12ab6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "hostNetwork", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="serviceAccountName")
    def service_account_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "serviceAccountName"))

    @service_account_name.setter
    def service_account_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b22f80a3b1c9e2b00f6a2a8fc181ade46520f2bb0f77c50aca05a05c18c4b3ea)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "serviceAccountName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="shareProcessNamespace")
    def share_process_namespace(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "shareProcessNamespace"))

    @share_process_namespace.setter
    def share_process_namespace(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d75fa5094f14178f556a2ae623d8cb3ddb4014560ac95d6bc1cb694a6c3d31cc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "shareProcessNamespace", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[BatchJobDefinitionEksPropertiesPodProperties]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksPropertiesPodProperties], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[BatchJobDefinitionEksPropertiesPodProperties],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9efa9f53a3080ba137090e6795abdfed9f4329be3da56f56e76a2f16a5fcbb7e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumes",
    jsii_struct_bases=[],
    name_mapping={
        "empty_dir": "emptyDir",
        "host_path": "hostPath",
        "name": "name",
        "secret": "secret",
    },
)
class BatchJobDefinitionEksPropertiesPodPropertiesVolumes:
    def __init__(
        self,
        *,
        empty_dir: typing.Optional[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir", typing.Dict[builtins.str, typing.Any]]] = None,
        host_path: typing.Optional[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        secret: typing.Optional[typing.Union["BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param empty_dir: empty_dir block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#empty_dir BatchJobDefinition#empty_dir}
        :param host_path: host_path block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#host_path BatchJobDefinition#host_path}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.
        :param secret: secret block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#secret BatchJobDefinition#secret}
        '''
        if isinstance(empty_dir, dict):
            empty_dir = BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir(**empty_dir)
        if isinstance(host_path, dict):
            host_path = BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath(**host_path)
        if isinstance(secret, dict):
            secret = BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret(**secret)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b96f5453946be71270f0c81fc8d20dcf3801ccbe532a4d488b0eacca6521a913)
            check_type(argname="argument empty_dir", value=empty_dir, expected_type=type_hints["empty_dir"])
            check_type(argname="argument host_path", value=host_path, expected_type=type_hints["host_path"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument secret", value=secret, expected_type=type_hints["secret"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if empty_dir is not None:
            self._values["empty_dir"] = empty_dir
        if host_path is not None:
            self._values["host_path"] = host_path
        if name is not None:
            self._values["name"] = name
        if secret is not None:
            self._values["secret"] = secret

    @builtins.property
    def empty_dir(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir"]:
        '''empty_dir block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#empty_dir BatchJobDefinition#empty_dir}
        '''
        result = self._values.get("empty_dir")
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir"], result)

    @builtins.property
    def host_path(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath"]:
        '''host_path block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#host_path BatchJobDefinition#host_path}
        '''
        result = self._values.get("host_path")
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath"], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#name BatchJobDefinition#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def secret(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret"]:
        '''secret block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#secret BatchJobDefinition#secret}
        '''
        result = self._values.get("secret")
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesVolumes(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir",
    jsii_struct_bases=[],
    name_mapping={"size_limit": "sizeLimit", "medium": "medium"},
)
class BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir:
    def __init__(
        self,
        *,
        size_limit: builtins.str,
        medium: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param size_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#size_limit BatchJobDefinition#size_limit}.
        :param medium: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#medium BatchJobDefinition#medium}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d3a5c40c95c60d882d4fefc50f2a4d3bc253328b39fb1eae0fd9e28f922f5ad)
            check_type(argname="argument size_limit", value=size_limit, expected_type=type_hints["size_limit"])
            check_type(argname="argument medium", value=medium, expected_type=type_hints["medium"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "size_limit": size_limit,
        }
        if medium is not None:
            self._values["medium"] = medium

    @builtins.property
    def size_limit(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#size_limit BatchJobDefinition#size_limit}.'''
        result = self._values.get("size_limit")
        assert result is not None, "Required property 'size_limit' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def medium(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#medium BatchJobDefinition#medium}.'''
        result = self._values.get("medium")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDirOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDirOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f04f1b935dc9202f05314ed1116fc1fa95b16a96910a671b9461cb4bb1a6613d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMedium")
    def reset_medium(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMedium", []))

    @builtins.property
    @jsii.member(jsii_name="mediumInput")
    def medium_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "mediumInput"))

    @builtins.property
    @jsii.member(jsii_name="sizeLimitInput")
    def size_limit_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sizeLimitInput"))

    @builtins.property
    @jsii.member(jsii_name="medium")
    def medium(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "medium"))

    @medium.setter
    def medium(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2a88a26fd24999473a1e327886934994aadb3263e723c880efcb3c852f6dba98)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "medium", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sizeLimit")
    def size_limit(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sizeLimit"))

    @size_limit.setter
    def size_limit(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc36f2fa25e6b4b1bfd669c801b3544c9b54e1411b20b27a9f373c0a13a60b71)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sizeLimit", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3eed05151317b54fb1669938e315d9269952e5bfd026823b77ecf3ef8f950214)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath",
    jsii_struct_bases=[],
    name_mapping={"path": "path"},
)
class BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath:
    def __init__(self, *, path: builtins.str) -> None:
        '''
        :param path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#path BatchJobDefinition#path}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b725e61e65f2a14703ba85f34bd6fc30839cc02cefbcb8278c11d652a80ecefd)
            check_type(argname="argument path", value=path, expected_type=type_hints["path"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "path": path,
        }

    @builtins.property
    def path(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#path BatchJobDefinition#path}.'''
        result = self._values.get("path")
        assert result is not None, "Required property 'path' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPathOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPathOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0d945f6ba854b4e5c0cab203bfae80429bfb54ba00cae7fe7bd324c4dfcfb92e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="pathInput")
    def path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "pathInput"))

    @builtins.property
    @jsii.member(jsii_name="path")
    def path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "path"))

    @path.setter
    def path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a8e2494a1c1eae0053607a96e76709824064f5a2bdad862223492aa26059d6f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "path", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__65fbeae1b6dae9a32b5b1664e48febb945e6a81d120ecaf106b0c1158cda53ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionEksPropertiesPodPropertiesVolumesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__409e7cfe4c25d9e24da39b9dcc97340313489f82cd38df551cb8ef4efc264b47)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesVolumesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7240a6ab97d13ff5c2ef3548d03a0e68a8b4e8badce78281275808855113631e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesVolumesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab2609dd2291221a7c022a0e7ac03ce5a4634455e73fae631222bf8fc02a5ae9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c2182f91d878a26ce84beed408404cfaa3c79c0c3277ddfba26e6ce791ec6404)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6a0b62acca32fc5cc916c0daa99033829fe26b292c722ab3ebb019e79078abb5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesVolumes]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesVolumes]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesVolumes]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__31accd59da2a1cba902ab49dbc77ae37d3e32116f9b84c356ef7135ca65e1142)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionEksPropertiesPodPropertiesVolumesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__047423006e809420a0f5e2c062ec55056b0633c4d02742fc8160a8aa4f149c38)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putEmptyDir")
    def put_empty_dir(
        self,
        *,
        size_limit: builtins.str,
        medium: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param size_limit: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#size_limit BatchJobDefinition#size_limit}.
        :param medium: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#medium BatchJobDefinition#medium}.
        '''
        value = BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir(
            size_limit=size_limit, medium=medium
        )

        return typing.cast(None, jsii.invoke(self, "putEmptyDir", [value]))

    @jsii.member(jsii_name="putHostPath")
    def put_host_path(self, *, path: builtins.str) -> None:
        '''
        :param path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#path BatchJobDefinition#path}.
        '''
        value = BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath(path=path)

        return typing.cast(None, jsii.invoke(self, "putHostPath", [value]))

    @jsii.member(jsii_name="putSecret")
    def put_secret(
        self,
        *,
        secret_name: builtins.str,
        optional: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param secret_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#secret_name BatchJobDefinition#secret_name}.
        :param optional: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#optional BatchJobDefinition#optional}.
        '''
        value = BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret(
            secret_name=secret_name, optional=optional
        )

        return typing.cast(None, jsii.invoke(self, "putSecret", [value]))

    @jsii.member(jsii_name="resetEmptyDir")
    def reset_empty_dir(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEmptyDir", []))

    @jsii.member(jsii_name="resetHostPath")
    def reset_host_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHostPath", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetSecret")
    def reset_secret(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecret", []))

    @builtins.property
    @jsii.member(jsii_name="emptyDir")
    def empty_dir(
        self,
    ) -> BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDirOutputReference:
        return typing.cast(BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDirOutputReference, jsii.get(self, "emptyDir"))

    @builtins.property
    @jsii.member(jsii_name="hostPath")
    def host_path(
        self,
    ) -> BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPathOutputReference:
        return typing.cast(BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPathOutputReference, jsii.get(self, "hostPath"))

    @builtins.property
    @jsii.member(jsii_name="secret")
    def secret(
        self,
    ) -> "BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecretOutputReference":
        return typing.cast("BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecretOutputReference", jsii.get(self, "secret"))

    @builtins.property
    @jsii.member(jsii_name="emptyDirInput")
    def empty_dir_input(
        self,
    ) -> typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir], jsii.get(self, "emptyDirInput"))

    @builtins.property
    @jsii.member(jsii_name="hostPathInput")
    def host_path_input(
        self,
    ) -> typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath], jsii.get(self, "hostPathInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="secretInput")
    def secret_input(
        self,
    ) -> typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret"]:
        return typing.cast(typing.Optional["BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret"], jsii.get(self, "secretInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cfb340cb32e62a0f40636a06815f6e7d00bf35df880815f9216eeecd71c32caa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesVolumes]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesVolumes]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesVolumes]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b0c6750ef236a8f634a1d9b28780342079bd87f9480c3b5082234c9d7816871)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret",
    jsii_struct_bases=[],
    name_mapping={"secret_name": "secretName", "optional": "optional"},
)
class BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret:
    def __init__(
        self,
        *,
        secret_name: builtins.str,
        optional: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param secret_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#secret_name BatchJobDefinition#secret_name}.
        :param optional: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#optional BatchJobDefinition#optional}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__51052943e9053cad99d9c0e0a67281288e17ea26279996a4cd9fb10e4c764425)
            check_type(argname="argument secret_name", value=secret_name, expected_type=type_hints["secret_name"])
            check_type(argname="argument optional", value=optional, expected_type=type_hints["optional"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "secret_name": secret_name,
        }
        if optional is not None:
            self._values["optional"] = optional

    @builtins.property
    def secret_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#secret_name BatchJobDefinition#secret_name}.'''
        result = self._values.get("secret_name")
        assert result is not None, "Required property 'secret_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def optional(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#optional BatchJobDefinition#optional}.'''
        result = self._values.get("optional")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecretOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecretOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2a2b5585b170fbc84388cb805574b3c6847cc3904ef427e1b6f9ac6704fa05ad)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetOptional")
    def reset_optional(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOptional", []))

    @builtins.property
    @jsii.member(jsii_name="optionalInput")
    def optional_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "optionalInput"))

    @builtins.property
    @jsii.member(jsii_name="secretNameInput")
    def secret_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "secretNameInput"))

    @builtins.property
    @jsii.member(jsii_name="optional")
    def optional(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "optional"))

    @optional.setter
    def optional(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1796014cc86cfa28663292dd06a1465fa21ba121d28783e279f1075d0705d316)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "optional", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="secretName")
    def secret_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "secretName"))

    @secret_name.setter
    def secret_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__806a06cb28af5954b81ec5ad904dc687be101bcec576f7876f674d28cc806c4b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "secretName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret]:
        return typing.cast(typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2995f0594a6e47f4182c04b97e8750aab1d7b6eb562dcfa866f1fd56e5cd7d2f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionRetryStrategy",
    jsii_struct_bases=[],
    name_mapping={"attempts": "attempts", "evaluate_on_exit": "evaluateOnExit"},
)
class BatchJobDefinitionRetryStrategy:
    def __init__(
        self,
        *,
        attempts: typing.Optional[jsii.Number] = None,
        evaluate_on_exit: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["BatchJobDefinitionRetryStrategyEvaluateOnExit", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param attempts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#attempts BatchJobDefinition#attempts}.
        :param evaluate_on_exit: evaluate_on_exit block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#evaluate_on_exit BatchJobDefinition#evaluate_on_exit}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__253c8ce0cab6bec03f86af8de1f0fb61afb4ca3c1aabd68c2ab413b029d092ed)
            check_type(argname="argument attempts", value=attempts, expected_type=type_hints["attempts"])
            check_type(argname="argument evaluate_on_exit", value=evaluate_on_exit, expected_type=type_hints["evaluate_on_exit"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if attempts is not None:
            self._values["attempts"] = attempts
        if evaluate_on_exit is not None:
            self._values["evaluate_on_exit"] = evaluate_on_exit

    @builtins.property
    def attempts(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#attempts BatchJobDefinition#attempts}.'''
        result = self._values.get("attempts")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def evaluate_on_exit(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionRetryStrategyEvaluateOnExit"]]]:
        '''evaluate_on_exit block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#evaluate_on_exit BatchJobDefinition#evaluate_on_exit}
        '''
        result = self._values.get("evaluate_on_exit")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["BatchJobDefinitionRetryStrategyEvaluateOnExit"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionRetryStrategy(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionRetryStrategyEvaluateOnExit",
    jsii_struct_bases=[],
    name_mapping={
        "action": "action",
        "on_exit_code": "onExitCode",
        "on_reason": "onReason",
        "on_status_reason": "onStatusReason",
    },
)
class BatchJobDefinitionRetryStrategyEvaluateOnExit:
    def __init__(
        self,
        *,
        action: builtins.str,
        on_exit_code: typing.Optional[builtins.str] = None,
        on_reason: typing.Optional[builtins.str] = None,
        on_status_reason: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param action: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#action BatchJobDefinition#action}.
        :param on_exit_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#on_exit_code BatchJobDefinition#on_exit_code}.
        :param on_reason: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#on_reason BatchJobDefinition#on_reason}.
        :param on_status_reason: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#on_status_reason BatchJobDefinition#on_status_reason}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46f07ad1f5d0f4899bde7ecac297c99387b22e140ed731430212b6deae213292)
            check_type(argname="argument action", value=action, expected_type=type_hints["action"])
            check_type(argname="argument on_exit_code", value=on_exit_code, expected_type=type_hints["on_exit_code"])
            check_type(argname="argument on_reason", value=on_reason, expected_type=type_hints["on_reason"])
            check_type(argname="argument on_status_reason", value=on_status_reason, expected_type=type_hints["on_status_reason"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "action": action,
        }
        if on_exit_code is not None:
            self._values["on_exit_code"] = on_exit_code
        if on_reason is not None:
            self._values["on_reason"] = on_reason
        if on_status_reason is not None:
            self._values["on_status_reason"] = on_status_reason

    @builtins.property
    def action(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#action BatchJobDefinition#action}.'''
        result = self._values.get("action")
        assert result is not None, "Required property 'action' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def on_exit_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#on_exit_code BatchJobDefinition#on_exit_code}.'''
        result = self._values.get("on_exit_code")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def on_reason(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#on_reason BatchJobDefinition#on_reason}.'''
        result = self._values.get("on_reason")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def on_status_reason(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#on_status_reason BatchJobDefinition#on_status_reason}.'''
        result = self._values.get("on_status_reason")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionRetryStrategyEvaluateOnExit(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionRetryStrategyEvaluateOnExitList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionRetryStrategyEvaluateOnExitList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dfcad833550491e394fc55c35977619afb9c2d861270c3cf6d8d0adf7e3f4c3f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "BatchJobDefinitionRetryStrategyEvaluateOnExitOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__52cf5bb2eaa8d2319f02d2b26ea0308e6e4a677f6e6e15743861b76493bab615)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("BatchJobDefinitionRetryStrategyEvaluateOnExitOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ab08e2f8bebc2935a580f343d30e4a0381019c5f987176cd7cc671da60d63ac3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__44e90829543d0cb83ad3de1546cdd853b6bc1c4174c970253ae4c66177f5c553)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7eb0842fa2266fd50129b9fcfdb72f1588e01de50e2b4d17035da48695a3f9f0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionRetryStrategyEvaluateOnExit]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionRetryStrategyEvaluateOnExit]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionRetryStrategyEvaluateOnExit]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ac93305b1f546bd65349b3c49e197cb6579c709eb7099b7ef6f604874da9144)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionRetryStrategyEvaluateOnExitOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionRetryStrategyEvaluateOnExitOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6951942220d096b57d34c03cea55a86405f7e3b7bb526d454335c3de587653a0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetOnExitCode")
    def reset_on_exit_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnExitCode", []))

    @jsii.member(jsii_name="resetOnReason")
    def reset_on_reason(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnReason", []))

    @jsii.member(jsii_name="resetOnStatusReason")
    def reset_on_status_reason(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnStatusReason", []))

    @builtins.property
    @jsii.member(jsii_name="actionInput")
    def action_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "actionInput"))

    @builtins.property
    @jsii.member(jsii_name="onExitCodeInput")
    def on_exit_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "onExitCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="onReasonInput")
    def on_reason_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "onReasonInput"))

    @builtins.property
    @jsii.member(jsii_name="onStatusReasonInput")
    def on_status_reason_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "onStatusReasonInput"))

    @builtins.property
    @jsii.member(jsii_name="action")
    def action(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "action"))

    @action.setter
    def action(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3961b8b791c7edd5eee58402e5b09f73e7ba6994a8419f410c365ffde9ed99eb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "action", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onExitCode")
    def on_exit_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "onExitCode"))

    @on_exit_code.setter
    def on_exit_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb24f05a945c75e86d93e6bcff55ec8decf1f8c629f5b8c166a59d00d3ed3f70)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onExitCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onReason")
    def on_reason(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "onReason"))

    @on_reason.setter
    def on_reason(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec61f7155f8797ea4210dc2df1377c03faca56df94c55ff06416420fd69a7bba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onReason", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onStatusReason")
    def on_status_reason(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "onStatusReason"))

    @on_status_reason.setter
    def on_status_reason(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c582ba81fca22ffb9b05d299fd3695b7fc90dd1fd164dfbb92f44ac6de3365ae)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onStatusReason", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionRetryStrategyEvaluateOnExit]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionRetryStrategyEvaluateOnExit]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionRetryStrategyEvaluateOnExit]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e57fcf261d0b68cac43d752dd7e62857ec9c283cbf30d8454e8007738a941edb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class BatchJobDefinitionRetryStrategyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionRetryStrategyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d25d8b67ca375efa00721389997a860dba26d839b4486e0c78b2b394081efca8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putEvaluateOnExit")
    def put_evaluate_on_exit(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionRetryStrategyEvaluateOnExit, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b717e091529b8cc5910aa3ff73e49b22ebab555ad937c2041e01afcb2c38625a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEvaluateOnExit", [value]))

    @jsii.member(jsii_name="resetAttempts")
    def reset_attempts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAttempts", []))

    @jsii.member(jsii_name="resetEvaluateOnExit")
    def reset_evaluate_on_exit(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEvaluateOnExit", []))

    @builtins.property
    @jsii.member(jsii_name="evaluateOnExit")
    def evaluate_on_exit(self) -> BatchJobDefinitionRetryStrategyEvaluateOnExitList:
        return typing.cast(BatchJobDefinitionRetryStrategyEvaluateOnExitList, jsii.get(self, "evaluateOnExit"))

    @builtins.property
    @jsii.member(jsii_name="attemptsInput")
    def attempts_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "attemptsInput"))

    @builtins.property
    @jsii.member(jsii_name="evaluateOnExitInput")
    def evaluate_on_exit_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionRetryStrategyEvaluateOnExit]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionRetryStrategyEvaluateOnExit]]], jsii.get(self, "evaluateOnExitInput"))

    @builtins.property
    @jsii.member(jsii_name="attempts")
    def attempts(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "attempts"))

    @attempts.setter
    def attempts(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db34aca74e58102795219a7d52ea101742bed169968ce10c2a7e4151bb1afcbe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "attempts", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[BatchJobDefinitionRetryStrategy]:
        return typing.cast(typing.Optional[BatchJobDefinitionRetryStrategy], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[BatchJobDefinitionRetryStrategy],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b9eb4a435a5a19f9801a63178b2650625eac4374d474e921a79d964d80e316c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionTimeout",
    jsii_struct_bases=[],
    name_mapping={"attempt_duration_seconds": "attemptDurationSeconds"},
)
class BatchJobDefinitionTimeout:
    def __init__(
        self,
        *,
        attempt_duration_seconds: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param attempt_duration_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#attempt_duration_seconds BatchJobDefinition#attempt_duration_seconds}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__af42f359216061a43d44c216b89f191cc3fd7e99e82240dd73b26b34ff868535)
            check_type(argname="argument attempt_duration_seconds", value=attempt_duration_seconds, expected_type=type_hints["attempt_duration_seconds"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if attempt_duration_seconds is not None:
            self._values["attempt_duration_seconds"] = attempt_duration_seconds

    @builtins.property
    def attempt_duration_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#attempt_duration_seconds BatchJobDefinition#attempt_duration_seconds}.'''
        result = self._values.get("attempt_duration_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "BatchJobDefinitionTimeout(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class BatchJobDefinitionTimeoutOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.batchJobDefinition.BatchJobDefinitionTimeoutOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7d5dd543e560804b142f3606d25238fb46c5a757f1b1f71227c116a9f9476c86)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAttemptDurationSeconds")
    def reset_attempt_duration_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAttemptDurationSeconds", []))

    @builtins.property
    @jsii.member(jsii_name="attemptDurationSecondsInput")
    def attempt_duration_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "attemptDurationSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="attemptDurationSeconds")
    def attempt_duration_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "attemptDurationSeconds"))

    @attempt_duration_seconds.setter
    def attempt_duration_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__28c7db43caf3ecd42861c4971ea9c714be08105849a9457f23456ca92dc79f90)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "attemptDurationSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[BatchJobDefinitionTimeout]:
        return typing.cast(typing.Optional[BatchJobDefinitionTimeout], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[BatchJobDefinitionTimeout]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__52a953a4e3487e461304e6ef79fe70dba685f12b22d38f03911fc6eaaebc3621)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "BatchJobDefinition",
    "BatchJobDefinitionConfig",
    "BatchJobDefinitionEksProperties",
    "BatchJobDefinitionEksPropertiesOutputReference",
    "BatchJobDefinitionEksPropertiesPodProperties",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainers",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainersEnvList",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainersEnvOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainersList",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainersOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainersResources",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainersResourcesOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContextOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMountsList",
    "BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMountsOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret",
    "BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretList",
    "BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecretOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainers",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnvList",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnvOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersList",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResourcesOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContextOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMountsList",
    "BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMountsOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesMetadata",
    "BatchJobDefinitionEksPropertiesPodPropertiesMetadataOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesVolumes",
    "BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir",
    "BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDirOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath",
    "BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPathOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesVolumesList",
    "BatchJobDefinitionEksPropertiesPodPropertiesVolumesOutputReference",
    "BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret",
    "BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecretOutputReference",
    "BatchJobDefinitionRetryStrategy",
    "BatchJobDefinitionRetryStrategyEvaluateOnExit",
    "BatchJobDefinitionRetryStrategyEvaluateOnExitList",
    "BatchJobDefinitionRetryStrategyEvaluateOnExitOutputReference",
    "BatchJobDefinitionRetryStrategyOutputReference",
    "BatchJobDefinitionTimeout",
    "BatchJobDefinitionTimeoutOutputReference",
]

publication.publish()

def _typecheckingstub__a281aaa906d202dce4aeb40e65a59abb0b5f676b37fb12a4b80979a46ef6da82(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    name: builtins.str,
    type: builtins.str,
    container_properties: typing.Optional[builtins.str] = None,
    deregister_on_new_revision: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ecs_properties: typing.Optional[builtins.str] = None,
    eks_properties: typing.Optional[typing.Union[BatchJobDefinitionEksProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    node_properties: typing.Optional[builtins.str] = None,
    parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    platform_capabilities: typing.Optional[typing.Sequence[builtins.str]] = None,
    propagate_tags: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    retry_strategy: typing.Optional[typing.Union[BatchJobDefinitionRetryStrategy, typing.Dict[builtins.str, typing.Any]]] = None,
    scheduling_priority: typing.Optional[jsii.Number] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeout: typing.Optional[typing.Union[BatchJobDefinitionTimeout, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__98fc534421db88df6905d5dec9ad46e3f1ab55a0d2c4d724d6356a792407721b(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e2cd8436d649c5733ad0706d22f5df65ca10cc406a19f5fed0830f325a577ed(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__942a754541e2ef9a6fc4d9687a524bd63ff59ea81b3f3ba6ed4621897876a464(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d3a7cece453560c3f5001d9d78be3f456b4ea48c8877ad459ec66f9d0194221(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4fe2be85c13bfd7b7d8d96c74490625dae9eafb6bef6e2e569de50acc87ea6cb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__adbf3cfbbfd1d8cb08a290ece68d967f721d681c8d43e8a64703c6bd3e91809b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__11fb6338fe039f2a3808141006a6ce53a3d5e6d49fcffbf2e358d84fb419e764(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01918cf70b462a2b8e1bbffe7c161642b4bb6d9afb1dbb4b8a1362d49ac07787(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c6887b132e36ba74ec902a265f5eb247fd2d1e406542a53008e1ccd372c8123(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__201109206782365ca043188823139b95059ee7e5e5a659f1610ae60e4acd6348(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21d35b0e23ff7b4f876d45d6e2758c807cee70baf7fb39905ad549970f83f3b1(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be59bcd498300713decc4b3a79784d5a77f88ec9b39ed96af558cffdf37dce75(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21ecb7940e66da36dacef55639d481f2a17be7550768e748fa8b18561d46a9af(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c18472950cffa8dd3e705bb78ab6e852ac9f9c7a944e8280542c7dbcca912f71(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0eb83dc9da06f73fd500ec025ca1048eecef9e0b644538dd44f47d6db5d9e8a(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    name: builtins.str,
    type: builtins.str,
    container_properties: typing.Optional[builtins.str] = None,
    deregister_on_new_revision: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ecs_properties: typing.Optional[builtins.str] = None,
    eks_properties: typing.Optional[typing.Union[BatchJobDefinitionEksProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    node_properties: typing.Optional[builtins.str] = None,
    parameters: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    platform_capabilities: typing.Optional[typing.Sequence[builtins.str]] = None,
    propagate_tags: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    retry_strategy: typing.Optional[typing.Union[BatchJobDefinitionRetryStrategy, typing.Dict[builtins.str, typing.Any]]] = None,
    scheduling_priority: typing.Optional[jsii.Number] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    timeout: typing.Optional[typing.Union[BatchJobDefinitionTimeout, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a2691c10650652abb06ea075005daca6861cba6bc3c0e271acf3bd2bcf71a4f(
    *,
    pod_properties: typing.Union[BatchJobDefinitionEksPropertiesPodProperties, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9421c664d66abb7f17a4612bb87b2522d0a5c12f64c752f2b5b95661eb3faef(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__111c8683f46fadbb2a21a7ae93a4535245ca93582a01c5d43bc9e0a1895bbdf8(
    value: typing.Optional[BatchJobDefinitionEksProperties],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62a0a83fa1d236123d1235e0e140348578db6085510e0fb562b7298f516787a7(
    *,
    containers: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesContainers, typing.Dict[builtins.str, typing.Any]]]],
    dns_policy: typing.Optional[builtins.str] = None,
    host_network: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    image_pull_secret: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret, typing.Dict[builtins.str, typing.Any]]]]] = None,
    init_containers: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesInitContainers, typing.Dict[builtins.str, typing.Any]]]]] = None,
    metadata: typing.Optional[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesMetadata, typing.Dict[builtins.str, typing.Any]]] = None,
    service_account_name: typing.Optional[builtins.str] = None,
    share_process_namespace: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    volumes: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesVolumes, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9b32fee8400237cd5af69ec54f7ca4a792b09bc7c405cc1d591ed24177adb22(
    *,
    image: builtins.str,
    args: typing.Optional[typing.Sequence[builtins.str]] = None,
    command: typing.Optional[typing.Sequence[builtins.str]] = None,
    env: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv, typing.Dict[builtins.str, typing.Any]]]]] = None,
    image_pull_policy: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    resources: typing.Optional[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesContainersResources, typing.Dict[builtins.str, typing.Any]]] = None,
    security_context: typing.Optional[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext, typing.Dict[builtins.str, typing.Any]]] = None,
    volume_mounts: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c611b98d279a051582e665d13278db969f942e355de6e50285849857305df73(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1850c820259388af5efa8b20ea99cc610a85da7b4a4698bf90c9fc6bb71c5957(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c42873cf2366ca60ad87bf25a4347ca4c98f2bf66a86bc6ae8cb242875e63618(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77fbd51e320295d72c30310e6520e7dfd622afee152d94ba195359cbe48ff706(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a3453112f57e158cb4a9dc654b5382b5ca11ab8366254e9c1d889aa9228395c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__97d567ba7680eee93fd2310b31a27ebe3fe78d21888188c1d8c2c0e514113a80(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__63f2ad26548b315809d8e48b1bedde5de9e0f9e2066f003f7ebc17a154240931(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f2e5aef9c88cb52aecf3fe3076a984efa75a9d247d22677652a7ee63cc1f757(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02f1d45359d6043569c81bb1f3bfc0142109c4da572d517e69c769cba541f4e7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33948e824d572d83201e3f6719544b6f3a69f7e3dae3da6c26ef31756f6ab258(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__45d6517679631d2e3646892662c654baa30484c398c8e18ece4b69fb1e87ca2f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98e4bb04389c996e531fcd02c9edc5ea51de790577e3b0279468f9dcaf5d91f9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8d586cd8752cc56447243a6ec9c98a2d4cee08b0353363c00f58fe1c2cb4aed(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d6ee072b8c6fd556dc220dd33e86dfa89bd36fc7cdbfc457bcec55a24e6013f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__48adfb57b4088a15cd6a5aa784f01cbdd142e181b17e3e83632cac8b472f7793(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44db25640486bbd2a14bc5610cdd62617f0c0e1231d3e418fa93e6ff29d87574(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a80fdc199b581289d8c28d050106118a62ee6b3255115ad5f6cf51386070a2fb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainers]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__382a4f0088f991125048ef2553b321ca11431d56363506882ed70cecab6220b0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7cbb1ac8bf595ea60af8f0f1ce55a124d91efbdd4adbbbbbf753e28c9bd504bd(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesContainersEnv, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5932fa9ea8db6f132a349d5fb9f6e8b0a3da070aef5623e2922bb4dacebded69(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d7f8ccf26c76ae2f8bb55c78bbedbf9d6ad2249a2ae6329a1fdef5d11105f8a(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7bb647cab6e269b0d7f0fabf3897f38910641c032b7c205dc18bf6f4b7ec0673(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__caafc488150bebae513a9ea206d70f153a96356b6a6b1f781ca73731a01e9c03(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb0d265de7e033fcadd6e4e60f4ca2959d874a19314c7358ad80ca8cd6f4e783(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__488afaaf77dfd7e35adf779474a347cd6d41dab2fe85059ccc74845a5cff84a9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b874ec6a1e59fc5c0fe664d7ba573a8af46e64bf8fc39153490cfe16d2143e63(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesContainers]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd7b08ee7f7bd45eed66b418623671d21875325d669700c9b4f5b397b1c821d5(
    *,
    limits: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    requests: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98a9a51b9e5bf92fb9fcb1e67080c76d757533f5f821ff00d8e69e8a2091e600(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5608fbab44a8c8da136bf9c3c67c9655a8a57a1a73f247de12a9622fba5e44c9(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b59d1d3fb9aaa0373c75beb8bfbe3fb4fd98f0c7dc5942ea5029c7d03cfbbe6b(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6a423643a34657ff0f3dddf10546fbfe490a962b486df3166f725c62236ad26f(
    value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesContainersResources],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7348e2d5e06ac9da82698e995ca72e26b9bd644fb9970a995b6ba0ae7236ecd(
    *,
    privileged: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    read_only_root_file_system: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    run_as_group: typing.Optional[jsii.Number] = None,
    run_as_non_root: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    run_as_user: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60b89a930a0f0f973c55a6b3a6fcdd359cf200bf219086ea2362e1fc6507cbd3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b18be215815701df751bfb09fbcbeb28153b447a6fd581a0c553e6bb0f0dcf5c(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77d159e97221335c4f95716534ccfdd27295cbef32a7529e6fba77c9fd3eb7fd(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b82fcd66312bcd84e6904cfc9e87dddd189f6b8ee730a27f20bcbf51f459949(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21c227de51b759f309e6036cf720792187363e87a323d9baad98bad896715e05(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1bb3ea9f4a328f2c60ef2952e3fedff1a47001f1a78f7481d13cb975d78e255e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59057d3220f9d1db848a6f5c72482247e1dfac11c1159a959772f5399e70c226(
    value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesContainersSecurityContext],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d40d61bf94f988a270a13004ca7e9f4b4b7cd09c18f562006c6408d60728122(
    *,
    mount_path: builtins.str,
    name: builtins.str,
    read_only: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6d8d51d1d29f1c1e971ddedc26ad05c8296f2f245989e10c88fbef4f967ed50(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__629eb2b16d9fb98a69b78a8e5fa5a56d01c03c2cc45c3d0a580828e72a98ccbf(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__823defbfb502ff39a80a83c9872a8e2ef5db7b7576e69e2dd3dfbd18d9fb4bdc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f408bc91ad587d7835d3209347d89eede716f15224fb930a14884fc81d969e20(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac4f3338c698bc7f3e7c253b0c7cbb8fa3766dd241c53f9858b485dd444a7a81(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__55c34e8b7ebbe19be52e88bbdd828cbf8c0595af9b816202246ee21c2b65c22f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9083746d85163b8a706c1fe9e3e25fa39b424441a998f26f248c588a69cd27f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed2b507e74d67f59a3f60b888d67410e8a2d2d4ead269abed439095c2a127da0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6120ae2a0e8345ecc2c78d71cef00dbef13bdf68ff1b07aae692ab09c951a2f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ecf72b29d21cd53fb27433679ecf768215442eb78cd88b55237a4200557939ef(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12464cb8b7d961d65338731c346b3a7c39d2a2fde3d3d416829a3f084cdd5521(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesContainersVolumeMounts]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ce31e0469c326b10237cb4472deaf358ca7199a8d16fe2254a048cd7ed32922(
    *,
    name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12cc1d004a1eac2606109fcaa4547b56048800ce109eb10b147a44ee11a4efd1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75cfa1fbfef7c9fc975d3292ad14d04b1f585d8ef6c4a5f40c4151d53db2bcdc(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da548a8acd49d551bdc0fe02c0651ead9dfe6a9ed61e7962a7a638c90c779ad2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7cef4b752b492c6b3bdbb412a6234babee54d54b8e44def30c09d28b7dc1a1c4(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__26078f34ac8bbc66f4989022fb5c487786d7f35ddfa799062c7987142c493e75(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a68da869e27b8c80fdeffb7fb115a2f140b3bb85034fe081956be268aabc9444(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c57ffa87acf91e9617d2bc61bd93b2f501c3374f40efdd073f91759e0526d400(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0000186e22be794becb14660f187cca42be77f77db52666de013f046fa210ce(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dcba1157932a2fcb9207df291ad31beec89f25c1295cb2d18e5a0b3bddd1b6ca(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9a10b3790ebf2e3b29143effb0d446baab70de0722fe2c0ddb775e4fb199281(
    *,
    image: builtins.str,
    args: typing.Optional[typing.Sequence[builtins.str]] = None,
    command: typing.Optional[typing.Sequence[builtins.str]] = None,
    env: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv, typing.Dict[builtins.str, typing.Any]]]]] = None,
    image_pull_policy: typing.Optional[builtins.str] = None,
    name: typing.Optional[builtins.str] = None,
    resources: typing.Optional[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources, typing.Dict[builtins.str, typing.Any]]] = None,
    security_context: typing.Optional[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext, typing.Dict[builtins.str, typing.Any]]] = None,
    volume_mounts: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d531e1ec962a2d2f998f982f9b11fcb607ed87bd727542f2e9b069d6d08ca0d(
    *,
    name: builtins.str,
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aef21e7cf4a15e843c9ab32073df04fcda02b1a91d8af90436eddb634c1656b4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d12cc2d9641ca78c6831ee0c9546bc747177fa66a9cbf7a1f2fc5e0f89c5e08(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__816c2eadb3e3ab35d705bbf55215a6b4dfb6e74e335c42a7378513cb7c45d29c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cda9d3d0fe936d4df13d73e09d0c35068b4a5799c14dee6b78b4056227d7a365(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__028116a436f2667a5bf07bd76b79515ee5202f22ca01085b75bc2bf9d86ff5bd(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d53b7664b8f0e5a80deab93c15ca7a37d7a123369eac68c8172fdc33640e7584(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb1d585fdcd0184deaf92fa2ca8c4d54753f3de6bb7f3562d14219be3fb3f5dd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__039e110dcb27a4f17ffe1b5b4b76458c36ce52dcf35b93691b295edca32b717c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6494692bc00dad206a38838854f162e4b2bdac5cb62c02537f6310466c864ea5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18022cdd4064320b344b5af15528126cd4d342e77d5bf06303bdbe4c42e4cd88(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc4f3715eca552321b35b7afe904da905fc4089aa2beee55ce6c63472b66d762(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04f514d3f38c7c90ee79971db2eef3744215dd78d8691eb83b88d2ce318eee1b(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4287aeef212c34ce1f1e7d793fe4f610636712831a9f2a965620529bf0ae9a3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__233c54def38ea739b26bf9a1adde6049d974a20d014c1bb6b29a051d379cdf66(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__781456aaeb71e60ec1724b0138adc4bdeb740907dcc627987dcb3809a05c3cab(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e16eddeb02a106d06781e59652ee0ae6f6f64a9648169eed1e143ca3ce87085(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainers]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0846d7295eabd182a210c2978929a8044d4fea364f1db6c52b55b0a2705f6dfa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__538373f08b0016a7ca87bc2f9f288a6071e18812bf71bea37b65433bdf1ee7e5(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersEnv, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88100cb7658a31a24216ba016abd1803010c2cf76c4c66f7d2e1f25b1aa5ef87(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2b4ed33d238ae88fbb7c6a361cf8f06f04c29a40c6e575080a3ac1edf5679ff8(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ccbca763fa629fbc10c2cc8268002754155bd8d8fef5df703a3c82032082297c(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d61375c673fd00dfe1a075726f64d7247774818276720f70955274e24eed1978(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b6b5ffc2ed93cf3eee831c0e5219ede37acfc495011a954023ff00e277236ba(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7797ed53b526c84227945665071e5603c9ee5dfedda3b70250a57dd3305436e9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__756d3f3d3ae5c86d3009e47d9b7902e7d6331cb6e21c5f5f41210738207810ec(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesInitContainers]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f8fc5da9a47f5ef46c12622b094a2103f49ff212690f0a13eb38509c4a9d8915(
    *,
    limits: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    requests: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c74aa01b2a65d11d2e997875bfab257ba02462c3b528ad783962a54c7ec1a9c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c176116bef771078875f1e11eab9bdefe8da8eeb80d88997cb5cf6a56d50b29(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dce424495f8c43204feef7437776e9085cd4591599b84183fd33addf52285db4(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e778e5fc74ba9900d4d48dea6fd8a3152cf5f8726d18b2c8e4db23f766d547c5(
    value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersResources],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be00936ecfaed0df2e8f089ca8ba780cfd1d0fa4e326b5622a109ae327935a99(
    *,
    privileged: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    read_only_root_file_system: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    run_as_group: typing.Optional[jsii.Number] = None,
    run_as_non_root: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    run_as_user: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5fab9aafd37f4485f768656c4febab81dc8a1cc46fd5efd10903e0d4ac38b82(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb77f1b5552a50fce086787a22ff8197a5b3329979f63cf29658ec12dbe13c43(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6427fefbfdcf2537fb193fca383047c2ed2d623a5ac744475797a00a6b3c5bec(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79b56e06616c92f87084f069c1325b3d19928d1b8fa2b8065dee2f1e6c8a25ec(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79d61294dc2a8153f9329ef5ab7cdea09e1c15ac174e7bc1fb138cca50f6c326(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22ada655a025d5596904ca5f6c278eed6520ca66e9e0a41c01027a9e02402ca2(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2145b725f39dd98f46b6b1efd0eefd07ad6ba018376bed9541864d1fd0ad7e31(
    value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3c2eebe483198f528f6ccced06813c003b406b753a60cc1a33612f45c5bfdd9(
    *,
    mount_path: builtins.str,
    name: builtins.str,
    read_only: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81b025e8b32ada8fc7f2361e2a1d11efae2efcf351708ee8f148dba504a2ea57(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3fcbe2bf14001834329534246c8ff78750bfae55262349723306f9e9c557918c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15e83e864518774349497d9241c837dce9ee0dda5c048fb270649e335ae26166(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81ca46f25afdf907871869cd2172c7b850b6c5cbb7cd7ea4deea709d6a01eada(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1142bd424ab25a3e123799a916497517a56649c60a8922fc87181a62b009e9d1(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e1f0633a9d96bca4314ccee69f7bf01d62ec178f9ef8c054f6ea914fe4d14e10(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c68606b4f4e3a8e53627556231abbbb230663518b87edaee7f7f0da289e87457(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1532d35beddb078b671ad4bf1bc3db6b1cb95aec66301f834d19bd4899f6dc51(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d493feef46c75509bc140a6218f23fb0b9ff46c5598a1ecd4f8b2ef5c92eb46(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a30aff163c81785226a19f1b9eb6cb7b42daaaa810dc08eab648819f394d10a(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__237c5424627d0313116cb38965ad8bdf483152b087e6cb5e50691e12546a52e8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesInitContainersVolumeMounts]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7314688d5d113803bbdae9072e8261ecd71c37941581a63ddcbf8b36bdc125e6(
    *,
    labels: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__05693cb513b00a62320ae9cee5bc424339d80d406b5b9cc79b4a9e99d51935b1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__689fde19dc3e4525bc83d80540ad897881ebc504f4dae87ef923e7ad93d72d70(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8bf6a25162960abaa75c4699a35a7762362d08d11a5f15b1f86f2051723c201(
    value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesMetadata],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ff08a95ca64686f98f84dfff52f384e9c31a4e1daf575d5fb34793347e31ef8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6fa7033ce000fda293267e8f5e76f6fbf24dc1c30bcb7bc8be9a190532ec75e6(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesContainers, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee78c5c2bbddc3b5d25a19489b669906d32d4f2ca2b759f5a774f5ce1bc748c1(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93683e7371fe9808d04bfe0c33df2113fcddd134c13d60622dc71f5e48839349(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesInitContainers, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b06405787894ef196fb629f4c854726c4d2540a52f864ddd6f5b7c82798dee66(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesVolumes, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd13a36bc6384006700bfa4e083c5fee358544120a51b8dbc941ce52ae92dc56(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d874c9e9c673d8be7b3fdd84204873b72cd0e7299ac2e3b509dea13b03d12ab6(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b22f80a3b1c9e2b00f6a2a8fc181ade46520f2bb0f77c50aca05a05c18c4b3ea(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d75fa5094f14178f556a2ae623d8cb3ddb4014560ac95d6bc1cb694a6c3d31cc(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9efa9f53a3080ba137090e6795abdfed9f4329be3da56f56e76a2f16a5fcbb7e(
    value: typing.Optional[BatchJobDefinitionEksPropertiesPodProperties],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b96f5453946be71270f0c81fc8d20dcf3801ccbe532a4d488b0eacca6521a913(
    *,
    empty_dir: typing.Optional[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir, typing.Dict[builtins.str, typing.Any]]] = None,
    host_path: typing.Optional[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    secret: typing.Optional[typing.Union[BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d3a5c40c95c60d882d4fefc50f2a4d3bc253328b39fb1eae0fd9e28f922f5ad(
    *,
    size_limit: builtins.str,
    medium: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f04f1b935dc9202f05314ed1116fc1fa95b16a96910a671b9461cb4bb1a6613d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a88a26fd24999473a1e327886934994aadb3263e723c880efcb3c852f6dba98(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc36f2fa25e6b4b1bfd669c801b3544c9b54e1411b20b27a9f373c0a13a60b71(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3eed05151317b54fb1669938e315d9269952e5bfd026823b77ecf3ef8f950214(
    value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesEmptyDir],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b725e61e65f2a14703ba85f34bd6fc30839cc02cefbcb8278c11d652a80ecefd(
    *,
    path: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d945f6ba854b4e5c0cab203bfae80429bfb54ba00cae7fe7bd324c4dfcfb92e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a8e2494a1c1eae0053607a96e76709824064f5a2bdad862223492aa26059d6f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65fbeae1b6dae9a32b5b1664e48febb945e6a81d120ecaf106b0c1158cda53ec(
    value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesHostPath],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__409e7cfe4c25d9e24da39b9dcc97340313489f82cd38df551cb8ef4efc264b47(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7240a6ab97d13ff5c2ef3548d03a0e68a8b4e8badce78281275808855113631e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab2609dd2291221a7c022a0e7ac03ce5a4634455e73fae631222bf8fc02a5ae9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2182f91d878a26ce84beed408404cfaa3c79c0c3277ddfba26e6ce791ec6404(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6a0b62acca32fc5cc916c0daa99033829fe26b292c722ab3ebb019e79078abb5(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31accd59da2a1cba902ab49dbc77ae37d3e32116f9b84c356ef7135ca65e1142(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionEksPropertiesPodPropertiesVolumes]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__047423006e809420a0f5e2c062ec55056b0633c4d02742fc8160a8aa4f149c38(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cfb340cb32e62a0f40636a06815f6e7d00bf35df880815f9216eeecd71c32caa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b0c6750ef236a8f634a1d9b28780342079bd87f9480c3b5082234c9d7816871(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionEksPropertiesPodPropertiesVolumes]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__51052943e9053cad99d9c0e0a67281288e17ea26279996a4cd9fb10e4c764425(
    *,
    secret_name: builtins.str,
    optional: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a2b5585b170fbc84388cb805574b3c6847cc3904ef427e1b6f9ac6704fa05ad(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1796014cc86cfa28663292dd06a1465fa21ba121d28783e279f1075d0705d316(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__806a06cb28af5954b81ec5ad904dc687be101bcec576f7876f674d28cc806c4b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2995f0594a6e47f4182c04b97e8750aab1d7b6eb562dcfa866f1fd56e5cd7d2f(
    value: typing.Optional[BatchJobDefinitionEksPropertiesPodPropertiesVolumesSecret],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__253c8ce0cab6bec03f86af8de1f0fb61afb4ca3c1aabd68c2ab413b029d092ed(
    *,
    attempts: typing.Optional[jsii.Number] = None,
    evaluate_on_exit: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionRetryStrategyEvaluateOnExit, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46f07ad1f5d0f4899bde7ecac297c99387b22e140ed731430212b6deae213292(
    *,
    action: builtins.str,
    on_exit_code: typing.Optional[builtins.str] = None,
    on_reason: typing.Optional[builtins.str] = None,
    on_status_reason: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dfcad833550491e394fc55c35977619afb9c2d861270c3cf6d8d0adf7e3f4c3f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__52cf5bb2eaa8d2319f02d2b26ea0308e6e4a677f6e6e15743861b76493bab615(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ab08e2f8bebc2935a580f343d30e4a0381019c5f987176cd7cc671da60d63ac3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44e90829543d0cb83ad3de1546cdd853b6bc1c4174c970253ae4c66177f5c553(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7eb0842fa2266fd50129b9fcfdb72f1588e01de50e2b4d17035da48695a3f9f0(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ac93305b1f546bd65349b3c49e197cb6579c709eb7099b7ef6f604874da9144(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[BatchJobDefinitionRetryStrategyEvaluateOnExit]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6951942220d096b57d34c03cea55a86405f7e3b7bb526d454335c3de587653a0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3961b8b791c7edd5eee58402e5b09f73e7ba6994a8419f410c365ffde9ed99eb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb24f05a945c75e86d93e6bcff55ec8decf1f8c629f5b8c166a59d00d3ed3f70(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec61f7155f8797ea4210dc2df1377c03faca56df94c55ff06416420fd69a7bba(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c582ba81fca22ffb9b05d299fd3695b7fc90dd1fd164dfbb92f44ac6de3365ae(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e57fcf261d0b68cac43d752dd7e62857ec9c283cbf30d8454e8007738a941edb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, BatchJobDefinitionRetryStrategyEvaluateOnExit]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d25d8b67ca375efa00721389997a860dba26d839b4486e0c78b2b394081efca8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b717e091529b8cc5910aa3ff73e49b22ebab555ad937c2041e01afcb2c38625a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[BatchJobDefinitionRetryStrategyEvaluateOnExit, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db34aca74e58102795219a7d52ea101742bed169968ce10c2a7e4151bb1afcbe(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b9eb4a435a5a19f9801a63178b2650625eac4374d474e921a79d964d80e316c(
    value: typing.Optional[BatchJobDefinitionRetryStrategy],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af42f359216061a43d44c216b89f191cc3fd7e99e82240dd73b26b34ff868535(
    *,
    attempt_duration_seconds: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d5dd543e560804b142f3606d25238fb46c5a757f1b1f71227c116a9f9476c86(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28c7db43caf3ecd42861c4971ea9c714be08105849a9457f23456ca92dc79f90(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__52a953a4e3487e461304e6ef79fe70dba685f12b22d38f03911fc6eaaebc3621(
    value: typing.Optional[BatchJobDefinitionTimeout],
) -> None:
    """Type checking stubs"""
    pass
