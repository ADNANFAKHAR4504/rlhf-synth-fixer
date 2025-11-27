r'''
# `aws_codepipeline`

Refer to the Terraform Registry for docs: [`aws_codepipeline`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline).
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


class Codepipeline(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.Codepipeline",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline aws_codepipeline}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        artifact_store: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineArtifactStore", typing.Dict[builtins.str, typing.Any]]]],
        name: builtins.str,
        role_arn: builtins.str,
        stage: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineStage", typing.Dict[builtins.str, typing.Any]]]],
        execution_mode: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        pipeline_type: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        trigger: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineTrigger", typing.Dict[builtins.str, typing.Any]]]]] = None,
        variable: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineVariable", typing.Dict[builtins.str, typing.Any]]]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline aws_codepipeline} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param artifact_store: artifact_store block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#artifact_store Codepipeline#artifact_store}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.
        :param stage: stage block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#stage Codepipeline#stage}
        :param execution_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#execution_mode Codepipeline#execution_mode}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#id Codepipeline#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param pipeline_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#pipeline_type Codepipeline#pipeline_type}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#tags Codepipeline#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#tags_all Codepipeline#tags_all}.
        :param trigger: trigger block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#trigger Codepipeline#trigger}
        :param variable: variable block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#variable Codepipeline#variable}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ad46fd509624cf0a68c0e356ae0858b1bafd007af00ebb1101a341237a0d822)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = CodepipelineConfig(
            artifact_store=artifact_store,
            name=name,
            role_arn=role_arn,
            stage=stage,
            execution_mode=execution_mode,
            id=id,
            pipeline_type=pipeline_type,
            tags=tags,
            tags_all=tags_all,
            trigger=trigger,
            variable=variable,
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
        '''Generates CDKTF code for importing a Codepipeline resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Codepipeline to import.
        :param import_from_id: The id of the existing Codepipeline that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Codepipeline to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__304e03ea12365865bb80795782fb58dd33400f444e06bc8a67752a4af0dea513)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putArtifactStore")
    def put_artifact_store(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineArtifactStore", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3efb0ddfc16e04bed203330a2084771d00daa206d841fb46a3e456c0f0d67513)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putArtifactStore", [value]))

    @jsii.member(jsii_name="putStage")
    def put_stage(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineStage", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__80f2c777f9e4cc2de83de9e99948a910f19376cf1615a29e7c53dfd8e4d159d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putStage", [value]))

    @jsii.member(jsii_name="putTrigger")
    def put_trigger(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineTrigger", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c7ce5b7c0560422303cca8f7f9756beac3399b37d630fda8a79024677a497d71)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTrigger", [value]))

    @jsii.member(jsii_name="putVariable")
    def put_variable(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineVariable", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__799dc5f49e741bbf32ed9f9b1ee0e5c6a43c2f43b0a47143e5ead7a3d5a4566e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putVariable", [value]))

    @jsii.member(jsii_name="resetExecutionMode")
    def reset_execution_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExecutionMode", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetPipelineType")
    def reset_pipeline_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPipelineType", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTrigger")
    def reset_trigger(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTrigger", []))

    @jsii.member(jsii_name="resetVariable")
    def reset_variable(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVariable", []))

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
    @jsii.member(jsii_name="artifactStore")
    def artifact_store(self) -> "CodepipelineArtifactStoreList":
        return typing.cast("CodepipelineArtifactStoreList", jsii.get(self, "artifactStore"))

    @builtins.property
    @jsii.member(jsii_name="stage")
    def stage(self) -> "CodepipelineStageList":
        return typing.cast("CodepipelineStageList", jsii.get(self, "stage"))

    @builtins.property
    @jsii.member(jsii_name="trigger")
    def trigger(self) -> "CodepipelineTriggerList":
        return typing.cast("CodepipelineTriggerList", jsii.get(self, "trigger"))

    @builtins.property
    @jsii.member(jsii_name="triggerAll")
    def trigger_all(self) -> "CodepipelineTriggerAllList":
        return typing.cast("CodepipelineTriggerAllList", jsii.get(self, "triggerAll"))

    @builtins.property
    @jsii.member(jsii_name="variable")
    def variable(self) -> "CodepipelineVariableList":
        return typing.cast("CodepipelineVariableList", jsii.get(self, "variable"))

    @builtins.property
    @jsii.member(jsii_name="artifactStoreInput")
    def artifact_store_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineArtifactStore"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineArtifactStore"]]], jsii.get(self, "artifactStoreInput"))

    @builtins.property
    @jsii.member(jsii_name="executionModeInput")
    def execution_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "executionModeInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="pipelineTypeInput")
    def pipeline_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "pipelineTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="stageInput")
    def stage_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStage"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStage"]]], jsii.get(self, "stageInput"))

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
    @jsii.member(jsii_name="triggerInput")
    def trigger_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineTrigger"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineTrigger"]]], jsii.get(self, "triggerInput"))

    @builtins.property
    @jsii.member(jsii_name="variableInput")
    def variable_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineVariable"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineVariable"]]], jsii.get(self, "variableInput"))

    @builtins.property
    @jsii.member(jsii_name="executionMode")
    def execution_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "executionMode"))

    @execution_mode.setter
    def execution_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb77d93eaa8a05aad4cd0985c19b0f5c9dd115e53b9c3bf8225405084fa4e8c7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "executionMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f79a1776adff5e33b0ea0eccac34e3df6279007ecf1a70452649291608b7763e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7cd3a6703f95ef4f2c2c397dd953322ba40a9209daf91a1c4c80eef94dc65f19)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="pipelineType")
    def pipeline_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "pipelineType"))

    @pipeline_type.setter
    def pipeline_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__abe8b94fac7af4b83ab597f09e90dfcfd831e9e1bdf9b5f0bd07b8db2e1e9e34)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "pipelineType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8883e8eaa65bcc72ffb6e046c4a12e9be03dc35d3b91e6b1502cbf52b9f37584)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd708da94bc3e564887dc2e5c1c327041ab7fd1fc415dd59048da3a34763fdf7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cfcced71e877177664e95367cb27c7fd6bb372839f10fd3c48a98135866c2a09)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineArtifactStore",
    jsii_struct_bases=[],
    name_mapping={
        "location": "location",
        "type": "type",
        "encryption_key": "encryptionKey",
        "region": "region",
    },
)
class CodepipelineArtifactStore:
    def __init__(
        self,
        *,
        location: builtins.str,
        type: builtins.str,
        encryption_key: typing.Optional[typing.Union["CodepipelineArtifactStoreEncryptionKey", typing.Dict[builtins.str, typing.Any]]] = None,
        region: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param location: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#location Codepipeline#location}.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#type Codepipeline#type}.
        :param encryption_key: encryption_key block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#encryption_key Codepipeline#encryption_key}
        :param region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.
        '''
        if isinstance(encryption_key, dict):
            encryption_key = CodepipelineArtifactStoreEncryptionKey(**encryption_key)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9b0ad9df7c80d1aa751c0fcde44cccc99bb242d0bfb0705187e78be5de70c38)
            check_type(argname="argument location", value=location, expected_type=type_hints["location"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument encryption_key", value=encryption_key, expected_type=type_hints["encryption_key"])
            check_type(argname="argument region", value=region, expected_type=type_hints["region"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "location": location,
            "type": type,
        }
        if encryption_key is not None:
            self._values["encryption_key"] = encryption_key
        if region is not None:
            self._values["region"] = region

    @builtins.property
    def location(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#location Codepipeline#location}.'''
        result = self._values.get("location")
        assert result is not None, "Required property 'location' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#type Codepipeline#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def encryption_key(
        self,
    ) -> typing.Optional["CodepipelineArtifactStoreEncryptionKey"]:
        '''encryption_key block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#encryption_key Codepipeline#encryption_key}
        '''
        result = self._values.get("encryption_key")
        return typing.cast(typing.Optional["CodepipelineArtifactStoreEncryptionKey"], result)

    @builtins.property
    def region(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.'''
        result = self._values.get("region")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineArtifactStore(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineArtifactStoreEncryptionKey",
    jsii_struct_bases=[],
    name_mapping={"id": "id", "type": "type"},
)
class CodepipelineArtifactStoreEncryptionKey:
    def __init__(self, *, id: builtins.str, type: builtins.str) -> None:
        '''
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#id Codepipeline#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#type Codepipeline#type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f83106d0f0a30bae9553827bbe4e928d6a2362b4c349abd2103f0a74bfec897b)
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "id": id,
            "type": type,
        }

    @builtins.property
    def id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#id Codepipeline#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        assert result is not None, "Required property 'id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#type Codepipeline#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineArtifactStoreEncryptionKey(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineArtifactStoreEncryptionKeyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineArtifactStoreEncryptionKeyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1cd2947ad2c0adc4429ed892a957a16732c5bfba3acbb4b1f60ae89b550251d7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3a00d952c30a7ccfe50729b8867c16b7e86a9586461712c8105978724abb8bb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e493c46cf1729b0a5338dbf5d50f6b75853859434154bedd266443e6998ea9f6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CodepipelineArtifactStoreEncryptionKey]:
        return typing.cast(typing.Optional[CodepipelineArtifactStoreEncryptionKey], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineArtifactStoreEncryptionKey],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__48a7b526fddf78d00b8c17b1459963a2f39b736cbc3c5b92100c54d1348740d4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineArtifactStoreList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineArtifactStoreList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__deab46159a28c1fbfd70c130c7694a01372371da66f6462fe337a8a58bd5e7a1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "CodepipelineArtifactStoreOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8bf51ad8ea7ba1bcbabe913dae9c9fafb44306ded2b2de786a167856eaafb016)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineArtifactStoreOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f12206b3b2f66fdddbaea61a69dbeb7a97a67c040eb754efec115b5bf1ded8af)
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
            type_hints = typing.get_type_hints(_typecheckingstub__64cafee013d58d4429673f54ec6ae80a7343029bce02eb73012d6c61d983c45c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d3d92a822c3476ba0b2ff5f1fc18ed9a5cc55dd7b57addf2e58f9f72a10aaa70)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineArtifactStore]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineArtifactStore]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineArtifactStore]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c84952c84ecefed0d9291c6d7280259c1c33d4280c3613c2c9d522f2c92fd2e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineArtifactStoreOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineArtifactStoreOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cffe02d39378b5a7895cb020c4e5aeb6b7f9e853dfe77a8164199b049ece4811)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putEncryptionKey")
    def put_encryption_key(self, *, id: builtins.str, type: builtins.str) -> None:
        '''
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#id Codepipeline#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#type Codepipeline#type}.
        '''
        value = CodepipelineArtifactStoreEncryptionKey(id=id, type=type)

        return typing.cast(None, jsii.invoke(self, "putEncryptionKey", [value]))

    @jsii.member(jsii_name="resetEncryptionKey")
    def reset_encryption_key(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEncryptionKey", []))

    @jsii.member(jsii_name="resetRegion")
    def reset_region(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegion", []))

    @builtins.property
    @jsii.member(jsii_name="encryptionKey")
    def encryption_key(self) -> CodepipelineArtifactStoreEncryptionKeyOutputReference:
        return typing.cast(CodepipelineArtifactStoreEncryptionKeyOutputReference, jsii.get(self, "encryptionKey"))

    @builtins.property
    @jsii.member(jsii_name="encryptionKeyInput")
    def encryption_key_input(
        self,
    ) -> typing.Optional[CodepipelineArtifactStoreEncryptionKey]:
        return typing.cast(typing.Optional[CodepipelineArtifactStoreEncryptionKey], jsii.get(self, "encryptionKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="locationInput")
    def location_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "locationInput"))

    @builtins.property
    @jsii.member(jsii_name="regionInput")
    def region_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regionInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="location")
    def location(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "location"))

    @location.setter
    def location(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f0b225980d3d95d023a31f2525a266a6ee9d2c18377505baa53835ef30589259)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "location", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="region")
    def region(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "region"))

    @region.setter
    def region(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f7389402d4a0a2804dfcd02d5f4c6016562d888d79284a67a6f138974c02678a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "region", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__54dab510aae659fd3b9c46784cbad01123ac94f1e3138c31a124d44452d8766e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineArtifactStore]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineArtifactStore]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineArtifactStore]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0da888bf2b87ec48ab683c09fdc0649699002733c518d612a9899954ff1a7436)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "artifact_store": "artifactStore",
        "name": "name",
        "role_arn": "roleArn",
        "stage": "stage",
        "execution_mode": "executionMode",
        "id": "id",
        "pipeline_type": "pipelineType",
        "tags": "tags",
        "tags_all": "tagsAll",
        "trigger": "trigger",
        "variable": "variable",
    },
)
class CodepipelineConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        artifact_store: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineArtifactStore, typing.Dict[builtins.str, typing.Any]]]],
        name: builtins.str,
        role_arn: builtins.str,
        stage: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineStage", typing.Dict[builtins.str, typing.Any]]]],
        execution_mode: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        pipeline_type: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        trigger: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineTrigger", typing.Dict[builtins.str, typing.Any]]]]] = None,
        variable: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineVariable", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param artifact_store: artifact_store block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#artifact_store Codepipeline#artifact_store}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.
        :param stage: stage block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#stage Codepipeline#stage}
        :param execution_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#execution_mode Codepipeline#execution_mode}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#id Codepipeline#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param pipeline_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#pipeline_type Codepipeline#pipeline_type}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#tags Codepipeline#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#tags_all Codepipeline#tags_all}.
        :param trigger: trigger block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#trigger Codepipeline#trigger}
        :param variable: variable block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#variable Codepipeline#variable}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ac1342b23afce72f94b7b56d06e6fbb231ceacc44011d47e3767a6add1bb3c9)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument artifact_store", value=artifact_store, expected_type=type_hints["artifact_store"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument stage", value=stage, expected_type=type_hints["stage"])
            check_type(argname="argument execution_mode", value=execution_mode, expected_type=type_hints["execution_mode"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument pipeline_type", value=pipeline_type, expected_type=type_hints["pipeline_type"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument trigger", value=trigger, expected_type=type_hints["trigger"])
            check_type(argname="argument variable", value=variable, expected_type=type_hints["variable"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "artifact_store": artifact_store,
            "name": name,
            "role_arn": role_arn,
            "stage": stage,
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
        if execution_mode is not None:
            self._values["execution_mode"] = execution_mode
        if id is not None:
            self._values["id"] = id
        if pipeline_type is not None:
            self._values["pipeline_type"] = pipeline_type
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if trigger is not None:
            self._values["trigger"] = trigger
        if variable is not None:
            self._values["variable"] = variable

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
    def artifact_store(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineArtifactStore]]:
        '''artifact_store block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#artifact_store Codepipeline#artifact_store}
        '''
        result = self._values.get("artifact_store")
        assert result is not None, "Required property 'artifact_store' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineArtifactStore]], result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.'''
        result = self._values.get("role_arn")
        assert result is not None, "Required property 'role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def stage(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStage"]]:
        '''stage block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#stage Codepipeline#stage}
        '''
        result = self._values.get("stage")
        assert result is not None, "Required property 'stage' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStage"]], result)

    @builtins.property
    def execution_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#execution_mode Codepipeline#execution_mode}.'''
        result = self._values.get("execution_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#id Codepipeline#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def pipeline_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#pipeline_type Codepipeline#pipeline_type}.'''
        result = self._values.get("pipeline_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#tags Codepipeline#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#tags_all Codepipeline#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def trigger(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineTrigger"]]]:
        '''trigger block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#trigger Codepipeline#trigger}
        '''
        result = self._values.get("trigger")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineTrigger"]]], result)

    @builtins.property
    def variable(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineVariable"]]]:
        '''variable block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#variable Codepipeline#variable}
        '''
        result = self._values.get("variable")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineVariable"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStage",
    jsii_struct_bases=[],
    name_mapping={
        "action": "action",
        "name": "name",
        "before_entry": "beforeEntry",
        "on_failure": "onFailure",
        "on_success": "onSuccess",
    },
)
class CodepipelineStage:
    def __init__(
        self,
        *,
        action: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineStageAction", typing.Dict[builtins.str, typing.Any]]]],
        name: builtins.str,
        before_entry: typing.Optional[typing.Union["CodepipelineStageBeforeEntry", typing.Dict[builtins.str, typing.Any]]] = None,
        on_failure: typing.Optional[typing.Union["CodepipelineStageOnFailure", typing.Dict[builtins.str, typing.Any]]] = None,
        on_success: typing.Optional[typing.Union["CodepipelineStageOnSuccess", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param action: action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#action Codepipeline#action}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.
        :param before_entry: before_entry block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#before_entry Codepipeline#before_entry}
        :param on_failure: on_failure block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#on_failure Codepipeline#on_failure}
        :param on_success: on_success block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#on_success Codepipeline#on_success}
        '''
        if isinstance(before_entry, dict):
            before_entry = CodepipelineStageBeforeEntry(**before_entry)
        if isinstance(on_failure, dict):
            on_failure = CodepipelineStageOnFailure(**on_failure)
        if isinstance(on_success, dict):
            on_success = CodepipelineStageOnSuccess(**on_success)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d8d38e0b287cc54b0587000888c9c5a7d2e66506c0a18168455544994ff5e6f0)
            check_type(argname="argument action", value=action, expected_type=type_hints["action"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument before_entry", value=before_entry, expected_type=type_hints["before_entry"])
            check_type(argname="argument on_failure", value=on_failure, expected_type=type_hints["on_failure"])
            check_type(argname="argument on_success", value=on_success, expected_type=type_hints["on_success"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "action": action,
            "name": name,
        }
        if before_entry is not None:
            self._values["before_entry"] = before_entry
        if on_failure is not None:
            self._values["on_failure"] = on_failure
        if on_success is not None:
            self._values["on_success"] = on_success

    @builtins.property
    def action(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageAction"]]:
        '''action block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#action Codepipeline#action}
        '''
        result = self._values.get("action")
        assert result is not None, "Required property 'action' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageAction"]], result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def before_entry(self) -> typing.Optional["CodepipelineStageBeforeEntry"]:
        '''before_entry block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#before_entry Codepipeline#before_entry}
        '''
        result = self._values.get("before_entry")
        return typing.cast(typing.Optional["CodepipelineStageBeforeEntry"], result)

    @builtins.property
    def on_failure(self) -> typing.Optional["CodepipelineStageOnFailure"]:
        '''on_failure block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#on_failure Codepipeline#on_failure}
        '''
        result = self._values.get("on_failure")
        return typing.cast(typing.Optional["CodepipelineStageOnFailure"], result)

    @builtins.property
    def on_success(self) -> typing.Optional["CodepipelineStageOnSuccess"]:
        '''on_success block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#on_success Codepipeline#on_success}
        '''
        result = self._values.get("on_success")
        return typing.cast(typing.Optional["CodepipelineStageOnSuccess"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStage(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageAction",
    jsii_struct_bases=[],
    name_mapping={
        "category": "category",
        "name": "name",
        "owner": "owner",
        "provider": "provider",
        "version": "version",
        "configuration": "configuration",
        "input_artifacts": "inputArtifacts",
        "namespace": "namespace",
        "output_artifacts": "outputArtifacts",
        "region": "region",
        "role_arn": "roleArn",
        "run_order": "runOrder",
        "timeout_in_minutes": "timeoutInMinutes",
    },
)
class CodepipelineStageAction:
    def __init__(
        self,
        *,
        category: builtins.str,
        name: builtins.str,
        owner: builtins.str,
        provider: builtins.str,
        version: builtins.str,
        configuration: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        input_artifacts: typing.Optional[typing.Sequence[builtins.str]] = None,
        namespace: typing.Optional[builtins.str] = None,
        output_artifacts: typing.Optional[typing.Sequence[builtins.str]] = None,
        region: typing.Optional[builtins.str] = None,
        role_arn: typing.Optional[builtins.str] = None,
        run_order: typing.Optional[jsii.Number] = None,
        timeout_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param category: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.
        :param owner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.
        :param provider: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.
        :param configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#configuration Codepipeline#configuration}.
        :param input_artifacts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#input_artifacts Codepipeline#input_artifacts}.
        :param namespace: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#namespace Codepipeline#namespace}.
        :param output_artifacts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#output_artifacts Codepipeline#output_artifacts}.
        :param region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.
        :param run_order: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#run_order Codepipeline#run_order}.
        :param timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#timeout_in_minutes Codepipeline#timeout_in_minutes}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__68627bccc6347d38cace0c4c9ff82c69758dbbd3b049be33c87e95a687583976)
            check_type(argname="argument category", value=category, expected_type=type_hints["category"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument owner", value=owner, expected_type=type_hints["owner"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument version", value=version, expected_type=type_hints["version"])
            check_type(argname="argument configuration", value=configuration, expected_type=type_hints["configuration"])
            check_type(argname="argument input_artifacts", value=input_artifacts, expected_type=type_hints["input_artifacts"])
            check_type(argname="argument namespace", value=namespace, expected_type=type_hints["namespace"])
            check_type(argname="argument output_artifacts", value=output_artifacts, expected_type=type_hints["output_artifacts"])
            check_type(argname="argument region", value=region, expected_type=type_hints["region"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument run_order", value=run_order, expected_type=type_hints["run_order"])
            check_type(argname="argument timeout_in_minutes", value=timeout_in_minutes, expected_type=type_hints["timeout_in_minutes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "category": category,
            "name": name,
            "owner": owner,
            "provider": provider,
            "version": version,
        }
        if configuration is not None:
            self._values["configuration"] = configuration
        if input_artifacts is not None:
            self._values["input_artifacts"] = input_artifacts
        if namespace is not None:
            self._values["namespace"] = namespace
        if output_artifacts is not None:
            self._values["output_artifacts"] = output_artifacts
        if region is not None:
            self._values["region"] = region
        if role_arn is not None:
            self._values["role_arn"] = role_arn
        if run_order is not None:
            self._values["run_order"] = run_order
        if timeout_in_minutes is not None:
            self._values["timeout_in_minutes"] = timeout_in_minutes

    @builtins.property
    def category(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.'''
        result = self._values.get("category")
        assert result is not None, "Required property 'category' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def owner(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.'''
        result = self._values.get("owner")
        assert result is not None, "Required property 'owner' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def provider(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.'''
        result = self._values.get("provider")
        assert result is not None, "Required property 'provider' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def version(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.'''
        result = self._values.get("version")
        assert result is not None, "Required property 'version' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def configuration(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#configuration Codepipeline#configuration}.'''
        result = self._values.get("configuration")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def input_artifacts(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#input_artifacts Codepipeline#input_artifacts}.'''
        result = self._values.get("input_artifacts")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def namespace(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#namespace Codepipeline#namespace}.'''
        result = self._values.get("namespace")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def output_artifacts(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#output_artifacts Codepipeline#output_artifacts}.'''
        result = self._values.get("output_artifacts")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def region(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.'''
        result = self._values.get("region")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.'''
        result = self._values.get("role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def run_order(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#run_order Codepipeline#run_order}.'''
        result = self._values.get("run_order")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#timeout_in_minutes Codepipeline#timeout_in_minutes}.'''
        result = self._values.get("timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageAction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineStageActionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageActionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8fc841ce15287e39920df4f564fee9ea9e4eb54c619b717c4c408249e8816a69)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "CodepipelineStageActionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f2a6e2c8664f781c4271628a0c96a05a9716ecf172190bbd892ec2f129969ee0)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineStageActionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84358c52e51d392668ef7d8864fada863d5443fc129fd55af9f9360221876389)
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
            type_hints = typing.get_type_hints(_typecheckingstub__88351940cf178d50480b8d0d3bd24fc12a7f1571c143862f682f55526c3099ff)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ae09995d308ef34ebdb481710967e0e34dcf53a5251a178ef55a4eddec1b2cbc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageAction]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageAction]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageAction]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b356e81d9c5b670692f6f5b136becfceca5665841bc254bb777c2f9b94022fad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineStageActionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageActionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cf1339f41cfa2454d6bf7bfd7fd8c7cd280c73c2d0e700e044b09d3afcf992a6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetConfiguration")
    def reset_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConfiguration", []))

    @jsii.member(jsii_name="resetInputArtifacts")
    def reset_input_artifacts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInputArtifacts", []))

    @jsii.member(jsii_name="resetNamespace")
    def reset_namespace(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNamespace", []))

    @jsii.member(jsii_name="resetOutputArtifacts")
    def reset_output_artifacts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOutputArtifacts", []))

    @jsii.member(jsii_name="resetRegion")
    def reset_region(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegion", []))

    @jsii.member(jsii_name="resetRoleArn")
    def reset_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoleArn", []))

    @jsii.member(jsii_name="resetRunOrder")
    def reset_run_order(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRunOrder", []))

    @jsii.member(jsii_name="resetTimeoutInMinutes")
    def reset_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeoutInMinutes", []))

    @builtins.property
    @jsii.member(jsii_name="categoryInput")
    def category_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "categoryInput"))

    @builtins.property
    @jsii.member(jsii_name="configurationInput")
    def configuration_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "configurationInput"))

    @builtins.property
    @jsii.member(jsii_name="inputArtifactsInput")
    def input_artifacts_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "inputArtifactsInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="namespaceInput")
    def namespace_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "namespaceInput"))

    @builtins.property
    @jsii.member(jsii_name="outputArtifactsInput")
    def output_artifacts_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "outputArtifactsInput"))

    @builtins.property
    @jsii.member(jsii_name="ownerInput")
    def owner_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ownerInput"))

    @builtins.property
    @jsii.member(jsii_name="providerInput")
    def provider_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "providerInput"))

    @builtins.property
    @jsii.member(jsii_name="regionInput")
    def region_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regionInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="runOrderInput")
    def run_order_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "runOrderInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutInMinutesInput")
    def timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "timeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="versionInput")
    def version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "versionInput"))

    @builtins.property
    @jsii.member(jsii_name="category")
    def category(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "category"))

    @category.setter
    def category(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e6ee92de88b7a635f0c792f49172be769b2696b69015e7675d333f9f1135ec0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "category", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="configuration")
    def configuration(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "configuration"))

    @configuration.setter
    def configuration(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c5d7b160041020378365d6707b73a1ba8e4bc5d613f249c26a2078b31aa7e6f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "configuration", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="inputArtifacts")
    def input_artifacts(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "inputArtifacts"))

    @input_artifacts.setter
    def input_artifacts(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f9aa6ece13732d0c6756bafd88bd9c36c578ccdb57f5071740fd00fb0fc8ca8b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "inputArtifacts", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__834bbdf90c8cb059b8e9f9cc5360fa1a8ce584eb81ddd670fdaabe4816ee3a5d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="namespace")
    def namespace(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "namespace"))

    @namespace.setter
    def namespace(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a93f741455c30ac2b1647cbfad9d4c4e7cf6fa53c4de33821c99268250d883c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "namespace", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="outputArtifacts")
    def output_artifacts(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "outputArtifacts"))

    @output_artifacts.setter
    def output_artifacts(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1110893c540fec833d7524ec8d69bce179139bbddc0682cbfc7a0f777f9e5c48)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "outputArtifacts", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="owner")
    def owner(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "owner"))

    @owner.setter
    def owner(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b2877be73f5fbccf1fc953fa9e1977312983f5d486115fe1d52949980e03f91)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "owner", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="provider")
    def provider(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "provider"))

    @provider.setter
    def provider(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__421f495ddd8902bb9edf8c1be1eeeaec55bef70aca35fdec51c03cd72ca6ca22)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "provider", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="region")
    def region(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "region"))

    @region.setter
    def region(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6ba122a1727ae5af428eb1d6525ea89cfc6998fb2b7a151671edfc0429e2e4d5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "region", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21efe62e91fd51c39818e93941d713b44fd5679bdc5cd29ef782251f2479f1d2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="runOrder")
    def run_order(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "runOrder"))

    @run_order.setter
    def run_order(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8f240c171926e6ca32e867f8f75d2d7438c40b2e17b79f588aaa062f8b56f32f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "runOrder", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="timeoutInMinutes")
    def timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "timeoutInMinutes"))

    @timeout_in_minutes.setter
    def timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cf525eaf45e834e81157d7f170f9fa9af65c60df3d70e3b2aeaec1ba6c440704)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "timeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="version")
    def version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "version"))

    @version.setter
    def version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9a423f9e5c2d2606dd0d361d0223c363f768530acd577fc1694f08e232ad6476)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "version", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageAction]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageAction]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageAction]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4315fffd4a893a63bb2a3fef462f2003971a2453486b876ee35aece6e03208bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageBeforeEntry",
    jsii_struct_bases=[],
    name_mapping={"condition": "condition"},
)
class CodepipelineStageBeforeEntry:
    def __init__(
        self,
        *,
        condition: typing.Union["CodepipelineStageBeforeEntryCondition", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param condition: condition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
        '''
        if isinstance(condition, dict):
            condition = CodepipelineStageBeforeEntryCondition(**condition)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__305752f8346504fa9358d381d1fa6868a4942abc1ab1727d53bda2ab6ae98734)
            check_type(argname="argument condition", value=condition, expected_type=type_hints["condition"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "condition": condition,
        }

    @builtins.property
    def condition(self) -> "CodepipelineStageBeforeEntryCondition":
        '''condition block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
        '''
        result = self._values.get("condition")
        assert result is not None, "Required property 'condition' is missing"
        return typing.cast("CodepipelineStageBeforeEntryCondition", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageBeforeEntry(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageBeforeEntryCondition",
    jsii_struct_bases=[],
    name_mapping={"rule": "rule", "result": "result"},
)
class CodepipelineStageBeforeEntryCondition:
    def __init__(
        self,
        *,
        rule: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineStageBeforeEntryConditionRule", typing.Dict[builtins.str, typing.Any]]]],
        result: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param rule: rule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule Codepipeline#rule}
        :param result: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ae3de3529dad86ab16036392b68b5eefd924135361028cf65252c11344597e0)
            check_type(argname="argument rule", value=rule, expected_type=type_hints["rule"])
            check_type(argname="argument result", value=result, expected_type=type_hints["result"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "rule": rule,
        }
        if result is not None:
            self._values["result"] = result

    @builtins.property
    def rule(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageBeforeEntryConditionRule"]]:
        '''rule block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule Codepipeline#rule}
        '''
        result = self._values.get("rule")
        assert result is not None, "Required property 'rule' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageBeforeEntryConditionRule"]], result)

    @builtins.property
    def result(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.'''
        result = self._values.get("result")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageBeforeEntryCondition(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineStageBeforeEntryConditionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageBeforeEntryConditionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__be9ef2ab5325ee380c06abed27d04fe027a7f91cd4caadd57e6fe945dadbf581)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRule")
    def put_rule(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineStageBeforeEntryConditionRule", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c9986e733fa8948931cb481f8abd5757606a3ce3cef012ba62176276fe54c2e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRule", [value]))

    @jsii.member(jsii_name="resetResult")
    def reset_result(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResult", []))

    @builtins.property
    @jsii.member(jsii_name="rule")
    def rule(self) -> "CodepipelineStageBeforeEntryConditionRuleList":
        return typing.cast("CodepipelineStageBeforeEntryConditionRuleList", jsii.get(self, "rule"))

    @builtins.property
    @jsii.member(jsii_name="resultInput")
    def result_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resultInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleInput")
    def rule_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageBeforeEntryConditionRule"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageBeforeEntryConditionRule"]]], jsii.get(self, "ruleInput"))

    @builtins.property
    @jsii.member(jsii_name="result")
    def result(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "result"))

    @result.setter
    def result(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc20db62640a9d0e04f254b20827ebc63bd5a0c911f44ab4ebd6eaaee47f5e01)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "result", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CodepipelineStageBeforeEntryCondition]:
        return typing.cast(typing.Optional[CodepipelineStageBeforeEntryCondition], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineStageBeforeEntryCondition],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7b0cc1bf5191394e90030cd58afbe657a99d8d523f1e5b99e4ae436a659cfba7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageBeforeEntryConditionRule",
    jsii_struct_bases=[],
    name_mapping={
        "name": "name",
        "rule_type_id": "ruleTypeId",
        "commands": "commands",
        "configuration": "configuration",
        "input_artifacts": "inputArtifacts",
        "region": "region",
        "role_arn": "roleArn",
        "timeout_in_minutes": "timeoutInMinutes",
    },
)
class CodepipelineStageBeforeEntryConditionRule:
    def __init__(
        self,
        *,
        name: builtins.str,
        rule_type_id: typing.Union["CodepipelineStageBeforeEntryConditionRuleRuleTypeId", typing.Dict[builtins.str, typing.Any]],
        commands: typing.Optional[typing.Sequence[builtins.str]] = None,
        configuration: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        input_artifacts: typing.Optional[typing.Sequence[builtins.str]] = None,
        region: typing.Optional[builtins.str] = None,
        role_arn: typing.Optional[builtins.str] = None,
        timeout_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.
        :param rule_type_id: rule_type_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule_type_id Codepipeline#rule_type_id}
        :param commands: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#commands Codepipeline#commands}.
        :param configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#configuration Codepipeline#configuration}.
        :param input_artifacts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#input_artifacts Codepipeline#input_artifacts}.
        :param region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.
        :param timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#timeout_in_minutes Codepipeline#timeout_in_minutes}.
        '''
        if isinstance(rule_type_id, dict):
            rule_type_id = CodepipelineStageBeforeEntryConditionRuleRuleTypeId(**rule_type_id)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3144b6322ec605fed9dd93a563e296b7e0373a8faac9be64529084162e4b2993)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument rule_type_id", value=rule_type_id, expected_type=type_hints["rule_type_id"])
            check_type(argname="argument commands", value=commands, expected_type=type_hints["commands"])
            check_type(argname="argument configuration", value=configuration, expected_type=type_hints["configuration"])
            check_type(argname="argument input_artifacts", value=input_artifacts, expected_type=type_hints["input_artifacts"])
            check_type(argname="argument region", value=region, expected_type=type_hints["region"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument timeout_in_minutes", value=timeout_in_minutes, expected_type=type_hints["timeout_in_minutes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "rule_type_id": rule_type_id,
        }
        if commands is not None:
            self._values["commands"] = commands
        if configuration is not None:
            self._values["configuration"] = configuration
        if input_artifacts is not None:
            self._values["input_artifacts"] = input_artifacts
        if region is not None:
            self._values["region"] = region
        if role_arn is not None:
            self._values["role_arn"] = role_arn
        if timeout_in_minutes is not None:
            self._values["timeout_in_minutes"] = timeout_in_minutes

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def rule_type_id(self) -> "CodepipelineStageBeforeEntryConditionRuleRuleTypeId":
        '''rule_type_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule_type_id Codepipeline#rule_type_id}
        '''
        result = self._values.get("rule_type_id")
        assert result is not None, "Required property 'rule_type_id' is missing"
        return typing.cast("CodepipelineStageBeforeEntryConditionRuleRuleTypeId", result)

    @builtins.property
    def commands(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#commands Codepipeline#commands}.'''
        result = self._values.get("commands")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def configuration(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#configuration Codepipeline#configuration}.'''
        result = self._values.get("configuration")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def input_artifacts(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#input_artifacts Codepipeline#input_artifacts}.'''
        result = self._values.get("input_artifacts")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def region(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.'''
        result = self._values.get("region")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.'''
        result = self._values.get("role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#timeout_in_minutes Codepipeline#timeout_in_minutes}.'''
        result = self._values.get("timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageBeforeEntryConditionRule(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineStageBeforeEntryConditionRuleList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageBeforeEntryConditionRuleList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d2d0c11591cc97df34e2148f95c4b76a7b6577c23525d5a1c738203d20fff1f6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineStageBeforeEntryConditionRuleOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__befe523658a8fec21e33f1096fa880df98190cef25e27a9e5207f28284ef5f25)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineStageBeforeEntryConditionRuleOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d354caf02cd75798afc1459427e653cbdf4e7a3b44654b2cd817f4bc5150cea)
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
            type_hints = typing.get_type_hints(_typecheckingstub__15f21acd71c9eeb693f9ce2b61f0e82a4592ecbd18b38d050975b19bbd6f7bbd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0d97adc2fc69a9614c4d83b861cc82728a4d555508bc47d4fb43c715fb358504)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageBeforeEntryConditionRule]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageBeforeEntryConditionRule]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageBeforeEntryConditionRule]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__13c3a32c3b9c1336904399832ffa8f1a56283ebe332327ca4f7fd49d681e155b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineStageBeforeEntryConditionRuleOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageBeforeEntryConditionRuleOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__038e81a4674591e9e6d7fb1758aa3d26d5c337de96b8a5551683ba8e2c58316e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putRuleTypeId")
    def put_rule_type_id(
        self,
        *,
        category: builtins.str,
        provider: builtins.str,
        owner: typing.Optional[builtins.str] = None,
        version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param category: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.
        :param provider: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.
        :param owner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.
        '''
        value = CodepipelineStageBeforeEntryConditionRuleRuleTypeId(
            category=category, provider=provider, owner=owner, version=version
        )

        return typing.cast(None, jsii.invoke(self, "putRuleTypeId", [value]))

    @jsii.member(jsii_name="resetCommands")
    def reset_commands(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCommands", []))

    @jsii.member(jsii_name="resetConfiguration")
    def reset_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConfiguration", []))

    @jsii.member(jsii_name="resetInputArtifacts")
    def reset_input_artifacts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInputArtifacts", []))

    @jsii.member(jsii_name="resetRegion")
    def reset_region(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegion", []))

    @jsii.member(jsii_name="resetRoleArn")
    def reset_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoleArn", []))

    @jsii.member(jsii_name="resetTimeoutInMinutes")
    def reset_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeoutInMinutes", []))

    @builtins.property
    @jsii.member(jsii_name="ruleTypeId")
    def rule_type_id(
        self,
    ) -> "CodepipelineStageBeforeEntryConditionRuleRuleTypeIdOutputReference":
        return typing.cast("CodepipelineStageBeforeEntryConditionRuleRuleTypeIdOutputReference", jsii.get(self, "ruleTypeId"))

    @builtins.property
    @jsii.member(jsii_name="commandsInput")
    def commands_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "commandsInput"))

    @builtins.property
    @jsii.member(jsii_name="configurationInput")
    def configuration_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "configurationInput"))

    @builtins.property
    @jsii.member(jsii_name="inputArtifactsInput")
    def input_artifacts_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "inputArtifactsInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="regionInput")
    def region_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regionInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleTypeIdInput")
    def rule_type_id_input(
        self,
    ) -> typing.Optional["CodepipelineStageBeforeEntryConditionRuleRuleTypeId"]:
        return typing.cast(typing.Optional["CodepipelineStageBeforeEntryConditionRuleRuleTypeId"], jsii.get(self, "ruleTypeIdInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutInMinutesInput")
    def timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "timeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="commands")
    def commands(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "commands"))

    @commands.setter
    def commands(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b30d80f7c669660c67a90f9b7a77a771cf89e3fec6e98db28136e8e8051332f2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "commands", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="configuration")
    def configuration(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "configuration"))

    @configuration.setter
    def configuration(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f91244009afbb4d086062249cc1858f68d3f7e00d435709b78d8a4c9e0dc328f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "configuration", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="inputArtifacts")
    def input_artifacts(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "inputArtifacts"))

    @input_artifacts.setter
    def input_artifacts(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96e7b8df75fb0b9e172c189500a5335595cd856dd7884624ec96f5607d74ad47)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "inputArtifacts", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc58fd5812672bb1620cbe4644e6b2b07a1cb42047617273cf79a968347e1f3a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="region")
    def region(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "region"))

    @region.setter
    def region(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b17411a810105a64d247abc331434c84b7bb44a50f9ec7632da4422a6215a0d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "region", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b420475c99822f7b5caa1e0ff9cdcdc9dc3e6ec6e05e5dc9a7504152d38f1044)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="timeoutInMinutes")
    def timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "timeoutInMinutes"))

    @timeout_in_minutes.setter
    def timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4c5e95ad8631beedcf0493b7cb7b3762f5c6b9c8621f7d8d60c02c719553b704)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "timeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageBeforeEntryConditionRule]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageBeforeEntryConditionRule]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageBeforeEntryConditionRule]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fa92ba2ebc10f62b5d42d54eabfc4c1f3af8c81e497e2eaad0ebcdaaa38fac90)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageBeforeEntryConditionRuleRuleTypeId",
    jsii_struct_bases=[],
    name_mapping={
        "category": "category",
        "provider": "provider",
        "owner": "owner",
        "version": "version",
    },
)
class CodepipelineStageBeforeEntryConditionRuleRuleTypeId:
    def __init__(
        self,
        *,
        category: builtins.str,
        provider: builtins.str,
        owner: typing.Optional[builtins.str] = None,
        version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param category: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.
        :param provider: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.
        :param owner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c90c29d85496eafe5621de31faafc2e47bb7668a5161068dde721f615d6d73f6)
            check_type(argname="argument category", value=category, expected_type=type_hints["category"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument owner", value=owner, expected_type=type_hints["owner"])
            check_type(argname="argument version", value=version, expected_type=type_hints["version"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "category": category,
            "provider": provider,
        }
        if owner is not None:
            self._values["owner"] = owner
        if version is not None:
            self._values["version"] = version

    @builtins.property
    def category(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.'''
        result = self._values.get("category")
        assert result is not None, "Required property 'category' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def provider(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.'''
        result = self._values.get("provider")
        assert result is not None, "Required property 'provider' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def owner(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.'''
        result = self._values.get("owner")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.'''
        result = self._values.get("version")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageBeforeEntryConditionRuleRuleTypeId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineStageBeforeEntryConditionRuleRuleTypeIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageBeforeEntryConditionRuleRuleTypeIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e9a2b047abaef207067ac9b26d76d70f2cd49123731c701b4d6e797a920eaadd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetOwner")
    def reset_owner(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOwner", []))

    @jsii.member(jsii_name="resetVersion")
    def reset_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVersion", []))

    @builtins.property
    @jsii.member(jsii_name="categoryInput")
    def category_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "categoryInput"))

    @builtins.property
    @jsii.member(jsii_name="ownerInput")
    def owner_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ownerInput"))

    @builtins.property
    @jsii.member(jsii_name="providerInput")
    def provider_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "providerInput"))

    @builtins.property
    @jsii.member(jsii_name="versionInput")
    def version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "versionInput"))

    @builtins.property
    @jsii.member(jsii_name="category")
    def category(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "category"))

    @category.setter
    def category(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3027809d8d1f01bcb0d12145cd8fa59b8e3394bbab03794157594dadfb55e1f3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "category", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="owner")
    def owner(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "owner"))

    @owner.setter
    def owner(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e84c4a09df791ff2ae252b4e790e544fbf070d02d37c8e6626c54d19904eb83)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "owner", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="provider")
    def provider(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "provider"))

    @provider.setter
    def provider(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd44dd173e9a32ce6fb9f999a507197f499629caf2a407bb351378b4418698a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "provider", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="version")
    def version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "version"))

    @version.setter
    def version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee41ec4151d805766e684bb22786274d70e74562c981258be48686ad7fa43220)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "version", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineStageBeforeEntryConditionRuleRuleTypeId]:
        return typing.cast(typing.Optional[CodepipelineStageBeforeEntryConditionRuleRuleTypeId], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineStageBeforeEntryConditionRuleRuleTypeId],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b96b83b5926dd815018eb42b6ccd6555f336c714dd8be8950598235c912c7502)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineStageBeforeEntryOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageBeforeEntryOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4b6e69a00cd7fbab8d94d14304f8b1422516618542d1a6df7c907adaf37ae093)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCondition")
    def put_condition(
        self,
        *,
        rule: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStageBeforeEntryConditionRule, typing.Dict[builtins.str, typing.Any]]]],
        result: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param rule: rule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule Codepipeline#rule}
        :param result: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.
        '''
        value = CodepipelineStageBeforeEntryCondition(rule=rule, result=result)

        return typing.cast(None, jsii.invoke(self, "putCondition", [value]))

    @builtins.property
    @jsii.member(jsii_name="condition")
    def condition(self) -> CodepipelineStageBeforeEntryConditionOutputReference:
        return typing.cast(CodepipelineStageBeforeEntryConditionOutputReference, jsii.get(self, "condition"))

    @builtins.property
    @jsii.member(jsii_name="conditionInput")
    def condition_input(self) -> typing.Optional[CodepipelineStageBeforeEntryCondition]:
        return typing.cast(typing.Optional[CodepipelineStageBeforeEntryCondition], jsii.get(self, "conditionInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CodepipelineStageBeforeEntry]:
        return typing.cast(typing.Optional[CodepipelineStageBeforeEntry], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineStageBeforeEntry],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e0a19eaba425d65bc8f4d93a524b0e2329f7ed67325e056ace256aae112e676d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineStageList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__37497c60c10a7e7f6ea65db8aec59def1c9bb7db0f05160f0c6e5766b3ca9251)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "CodepipelineStageOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fa4e849bd7fe7fcbf592ef10bfb378e70b7d741b1e1de2d02147a3aa6a645364)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineStageOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15ac29d91330dff83e6c449b3241651f66ecc5c1dd16bcdc553e31f3bb7b6ef5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4c95ae07c633cbf9974a5277b3b9da98960a2e919044345839d2dd13e882b940)
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
            type_hints = typing.get_type_hints(_typecheckingstub__98fb871841ee1a3955253faa5705e3ca8455a14306b638ff77f9fbdb466c8719)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStage]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStage]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__934f040330682c7908651a2753da6c3a39ee5bc7d0dec2bf8f4ee597265be796)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageOnFailure",
    jsii_struct_bases=[],
    name_mapping={
        "condition": "condition",
        "result": "result",
        "retry_configuration": "retryConfiguration",
    },
)
class CodepipelineStageOnFailure:
    def __init__(
        self,
        *,
        condition: typing.Optional[typing.Union["CodepipelineStageOnFailureCondition", typing.Dict[builtins.str, typing.Any]]] = None,
        result: typing.Optional[builtins.str] = None,
        retry_configuration: typing.Optional[typing.Union["CodepipelineStageOnFailureRetryConfiguration", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param condition: condition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
        :param result: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.
        :param retry_configuration: retry_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#retry_configuration Codepipeline#retry_configuration}
        '''
        if isinstance(condition, dict):
            condition = CodepipelineStageOnFailureCondition(**condition)
        if isinstance(retry_configuration, dict):
            retry_configuration = CodepipelineStageOnFailureRetryConfiguration(**retry_configuration)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__19d83f31ebb1adb4debf34dbc7ca4e5a24db98247ac3f9982d20ea477d68f8de)
            check_type(argname="argument condition", value=condition, expected_type=type_hints["condition"])
            check_type(argname="argument result", value=result, expected_type=type_hints["result"])
            check_type(argname="argument retry_configuration", value=retry_configuration, expected_type=type_hints["retry_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if condition is not None:
            self._values["condition"] = condition
        if result is not None:
            self._values["result"] = result
        if retry_configuration is not None:
            self._values["retry_configuration"] = retry_configuration

    @builtins.property
    def condition(self) -> typing.Optional["CodepipelineStageOnFailureCondition"]:
        '''condition block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
        '''
        result = self._values.get("condition")
        return typing.cast(typing.Optional["CodepipelineStageOnFailureCondition"], result)

    @builtins.property
    def result(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.'''
        result = self._values.get("result")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def retry_configuration(
        self,
    ) -> typing.Optional["CodepipelineStageOnFailureRetryConfiguration"]:
        '''retry_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#retry_configuration Codepipeline#retry_configuration}
        '''
        result = self._values.get("retry_configuration")
        return typing.cast(typing.Optional["CodepipelineStageOnFailureRetryConfiguration"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageOnFailure(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageOnFailureCondition",
    jsii_struct_bases=[],
    name_mapping={"rule": "rule", "result": "result"},
)
class CodepipelineStageOnFailureCondition:
    def __init__(
        self,
        *,
        rule: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineStageOnFailureConditionRule", typing.Dict[builtins.str, typing.Any]]]],
        result: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param rule: rule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule Codepipeline#rule}
        :param result: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2feeeeddadadb569a745aa96ad03a6e49f47a193f480fdbbcea11bcd97faac57)
            check_type(argname="argument rule", value=rule, expected_type=type_hints["rule"])
            check_type(argname="argument result", value=result, expected_type=type_hints["result"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "rule": rule,
        }
        if result is not None:
            self._values["result"] = result

    @builtins.property
    def rule(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageOnFailureConditionRule"]]:
        '''rule block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule Codepipeline#rule}
        '''
        result = self._values.get("rule")
        assert result is not None, "Required property 'rule' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageOnFailureConditionRule"]], result)

    @builtins.property
    def result(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.'''
        result = self._values.get("result")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageOnFailureCondition(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineStageOnFailureConditionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageOnFailureConditionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__df7baf79240fe2ea70ebf8c07a9eabf69181a203bfa565f62471765e4bd628d3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRule")
    def put_rule(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineStageOnFailureConditionRule", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c812f9c9e82ae46807972c5b97d4449d4d35cd0fd201c35fd2a090c0d0dacb4e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRule", [value]))

    @jsii.member(jsii_name="resetResult")
    def reset_result(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResult", []))

    @builtins.property
    @jsii.member(jsii_name="rule")
    def rule(self) -> "CodepipelineStageOnFailureConditionRuleList":
        return typing.cast("CodepipelineStageOnFailureConditionRuleList", jsii.get(self, "rule"))

    @builtins.property
    @jsii.member(jsii_name="resultInput")
    def result_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resultInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleInput")
    def rule_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageOnFailureConditionRule"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageOnFailureConditionRule"]]], jsii.get(self, "ruleInput"))

    @builtins.property
    @jsii.member(jsii_name="result")
    def result(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "result"))

    @result.setter
    def result(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eff81378455c60f2494916d6b5971842f3ceb297f9a8b300fa3130b4b7c5b78f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "result", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CodepipelineStageOnFailureCondition]:
        return typing.cast(typing.Optional[CodepipelineStageOnFailureCondition], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineStageOnFailureCondition],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6710899b6d898987bb9702ecd00174096e9c7b7f49cb42770e2616b2af6ee686)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageOnFailureConditionRule",
    jsii_struct_bases=[],
    name_mapping={
        "name": "name",
        "rule_type_id": "ruleTypeId",
        "commands": "commands",
        "configuration": "configuration",
        "input_artifacts": "inputArtifacts",
        "region": "region",
        "role_arn": "roleArn",
        "timeout_in_minutes": "timeoutInMinutes",
    },
)
class CodepipelineStageOnFailureConditionRule:
    def __init__(
        self,
        *,
        name: builtins.str,
        rule_type_id: typing.Union["CodepipelineStageOnFailureConditionRuleRuleTypeId", typing.Dict[builtins.str, typing.Any]],
        commands: typing.Optional[typing.Sequence[builtins.str]] = None,
        configuration: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        input_artifacts: typing.Optional[typing.Sequence[builtins.str]] = None,
        region: typing.Optional[builtins.str] = None,
        role_arn: typing.Optional[builtins.str] = None,
        timeout_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.
        :param rule_type_id: rule_type_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule_type_id Codepipeline#rule_type_id}
        :param commands: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#commands Codepipeline#commands}.
        :param configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#configuration Codepipeline#configuration}.
        :param input_artifacts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#input_artifacts Codepipeline#input_artifacts}.
        :param region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.
        :param timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#timeout_in_minutes Codepipeline#timeout_in_minutes}.
        '''
        if isinstance(rule_type_id, dict):
            rule_type_id = CodepipelineStageOnFailureConditionRuleRuleTypeId(**rule_type_id)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd9a75d5d126f369c474ae7266e7155e5dfae2867d8f0dd4b1d9157010ac30f4)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument rule_type_id", value=rule_type_id, expected_type=type_hints["rule_type_id"])
            check_type(argname="argument commands", value=commands, expected_type=type_hints["commands"])
            check_type(argname="argument configuration", value=configuration, expected_type=type_hints["configuration"])
            check_type(argname="argument input_artifacts", value=input_artifacts, expected_type=type_hints["input_artifacts"])
            check_type(argname="argument region", value=region, expected_type=type_hints["region"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument timeout_in_minutes", value=timeout_in_minutes, expected_type=type_hints["timeout_in_minutes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "rule_type_id": rule_type_id,
        }
        if commands is not None:
            self._values["commands"] = commands
        if configuration is not None:
            self._values["configuration"] = configuration
        if input_artifacts is not None:
            self._values["input_artifacts"] = input_artifacts
        if region is not None:
            self._values["region"] = region
        if role_arn is not None:
            self._values["role_arn"] = role_arn
        if timeout_in_minutes is not None:
            self._values["timeout_in_minutes"] = timeout_in_minutes

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def rule_type_id(self) -> "CodepipelineStageOnFailureConditionRuleRuleTypeId":
        '''rule_type_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule_type_id Codepipeline#rule_type_id}
        '''
        result = self._values.get("rule_type_id")
        assert result is not None, "Required property 'rule_type_id' is missing"
        return typing.cast("CodepipelineStageOnFailureConditionRuleRuleTypeId", result)

    @builtins.property
    def commands(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#commands Codepipeline#commands}.'''
        result = self._values.get("commands")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def configuration(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#configuration Codepipeline#configuration}.'''
        result = self._values.get("configuration")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def input_artifacts(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#input_artifacts Codepipeline#input_artifacts}.'''
        result = self._values.get("input_artifacts")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def region(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.'''
        result = self._values.get("region")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.'''
        result = self._values.get("role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#timeout_in_minutes Codepipeline#timeout_in_minutes}.'''
        result = self._values.get("timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageOnFailureConditionRule(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineStageOnFailureConditionRuleList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageOnFailureConditionRuleList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d3afd5ee11f5f844b514adbcd103a7cacfb89a8cc407f8b766c79590899f5b59)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineStageOnFailureConditionRuleOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e5f5e975cec58380fb7b7cad5ea6b6b2a0cadd8c99c0dc0329a3dd0142415a7)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineStageOnFailureConditionRuleOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0138b5af463245c32b7d11780b758f06f4ff4c1cb00a0175db4c564f7240aa19)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7c23aa0903f396d7f6f6904524c673b40bb7616400d75ddc7da201d7a658f2b6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__020347509f316733b695d8a9c3757e841094f134263690a0de3d01449f61f720)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageOnFailureConditionRule]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageOnFailureConditionRule]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageOnFailureConditionRule]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__974f61fad474e3e644fb4013af6d1eaac2312d25d247797464a1b9491312684a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineStageOnFailureConditionRuleOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageOnFailureConditionRuleOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__08aaaa7906f4c90eaf29fd4161905aabe5f135038cfeab1692a9c8f12c686f51)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putRuleTypeId")
    def put_rule_type_id(
        self,
        *,
        category: builtins.str,
        provider: builtins.str,
        owner: typing.Optional[builtins.str] = None,
        version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param category: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.
        :param provider: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.
        :param owner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.
        '''
        value = CodepipelineStageOnFailureConditionRuleRuleTypeId(
            category=category, provider=provider, owner=owner, version=version
        )

        return typing.cast(None, jsii.invoke(self, "putRuleTypeId", [value]))

    @jsii.member(jsii_name="resetCommands")
    def reset_commands(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCommands", []))

    @jsii.member(jsii_name="resetConfiguration")
    def reset_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConfiguration", []))

    @jsii.member(jsii_name="resetInputArtifacts")
    def reset_input_artifacts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInputArtifacts", []))

    @jsii.member(jsii_name="resetRegion")
    def reset_region(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegion", []))

    @jsii.member(jsii_name="resetRoleArn")
    def reset_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoleArn", []))

    @jsii.member(jsii_name="resetTimeoutInMinutes")
    def reset_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeoutInMinutes", []))

    @builtins.property
    @jsii.member(jsii_name="ruleTypeId")
    def rule_type_id(
        self,
    ) -> "CodepipelineStageOnFailureConditionRuleRuleTypeIdOutputReference":
        return typing.cast("CodepipelineStageOnFailureConditionRuleRuleTypeIdOutputReference", jsii.get(self, "ruleTypeId"))

    @builtins.property
    @jsii.member(jsii_name="commandsInput")
    def commands_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "commandsInput"))

    @builtins.property
    @jsii.member(jsii_name="configurationInput")
    def configuration_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "configurationInput"))

    @builtins.property
    @jsii.member(jsii_name="inputArtifactsInput")
    def input_artifacts_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "inputArtifactsInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="regionInput")
    def region_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regionInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleTypeIdInput")
    def rule_type_id_input(
        self,
    ) -> typing.Optional["CodepipelineStageOnFailureConditionRuleRuleTypeId"]:
        return typing.cast(typing.Optional["CodepipelineStageOnFailureConditionRuleRuleTypeId"], jsii.get(self, "ruleTypeIdInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutInMinutesInput")
    def timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "timeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="commands")
    def commands(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "commands"))

    @commands.setter
    def commands(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cbb7bd79028b042a526884475ab90735da2341d226ceaddf99082130b31af4b2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "commands", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="configuration")
    def configuration(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "configuration"))

    @configuration.setter
    def configuration(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f74c7163b5c2401e7d92e5066ae629a85b5039d8d4104b23616b6ee739a5b058)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "configuration", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="inputArtifacts")
    def input_artifacts(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "inputArtifacts"))

    @input_artifacts.setter
    def input_artifacts(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e790e517378281ebbb17ff859056c28c29b182e79f020a1a51f6b137f9ce8cda)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "inputArtifacts", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5b8353381066dea80100599b1668dcfacbfa888a34349de964966edd268d5be4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="region")
    def region(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "region"))

    @region.setter
    def region(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__096b6bc3185fe14aa1a9e51ac146f9039f35c7f3c8c3133f1925f98f2e0991d3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "region", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0af25026fb5b293c2b2b26cc643574717444f7bf7afe2a8599d563e5e0e2cbac)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="timeoutInMinutes")
    def timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "timeoutInMinutes"))

    @timeout_in_minutes.setter
    def timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba149f6b790240610056ecba1ad14dc15940ffd1b882f9149d2e19f01d8b1b24)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "timeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageOnFailureConditionRule]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageOnFailureConditionRule]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageOnFailureConditionRule]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d931fe28b79821dcec4868338e24e193223858b3b1967f144c9e12ca57038eb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageOnFailureConditionRuleRuleTypeId",
    jsii_struct_bases=[],
    name_mapping={
        "category": "category",
        "provider": "provider",
        "owner": "owner",
        "version": "version",
    },
)
class CodepipelineStageOnFailureConditionRuleRuleTypeId:
    def __init__(
        self,
        *,
        category: builtins.str,
        provider: builtins.str,
        owner: typing.Optional[builtins.str] = None,
        version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param category: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.
        :param provider: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.
        :param owner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6d3ab5a1308d0557a1e20eec44b325f0e26b75af6ca408ab3f6981b8a53406b)
            check_type(argname="argument category", value=category, expected_type=type_hints["category"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument owner", value=owner, expected_type=type_hints["owner"])
            check_type(argname="argument version", value=version, expected_type=type_hints["version"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "category": category,
            "provider": provider,
        }
        if owner is not None:
            self._values["owner"] = owner
        if version is not None:
            self._values["version"] = version

    @builtins.property
    def category(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.'''
        result = self._values.get("category")
        assert result is not None, "Required property 'category' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def provider(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.'''
        result = self._values.get("provider")
        assert result is not None, "Required property 'provider' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def owner(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.'''
        result = self._values.get("owner")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.'''
        result = self._values.get("version")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageOnFailureConditionRuleRuleTypeId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineStageOnFailureConditionRuleRuleTypeIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageOnFailureConditionRuleRuleTypeIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d296303113e564471faf9205496b17379749500a9f69c641cbf9670018b3d6a4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetOwner")
    def reset_owner(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOwner", []))

    @jsii.member(jsii_name="resetVersion")
    def reset_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVersion", []))

    @builtins.property
    @jsii.member(jsii_name="categoryInput")
    def category_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "categoryInput"))

    @builtins.property
    @jsii.member(jsii_name="ownerInput")
    def owner_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ownerInput"))

    @builtins.property
    @jsii.member(jsii_name="providerInput")
    def provider_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "providerInput"))

    @builtins.property
    @jsii.member(jsii_name="versionInput")
    def version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "versionInput"))

    @builtins.property
    @jsii.member(jsii_name="category")
    def category(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "category"))

    @category.setter
    def category(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a0d76ccdf4a5dc2d16db6ed2827f0ceb7073bde094d267f438ff8eecb75fd5a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "category", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="owner")
    def owner(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "owner"))

    @owner.setter
    def owner(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1866a4d28f3fabd077a8caa0a387cf3aac4ae72f30b99d154b6134baa2f738df)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "owner", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="provider")
    def provider(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "provider"))

    @provider.setter
    def provider(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9e5cdaee4f29784adb7e2fe530429fc9db377ca02a88cf8b9557cd56295c0992)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "provider", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="version")
    def version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "version"))

    @version.setter
    def version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6bbf5cddc08049bad64fa2f9520c403ae787c766c90e3c03b59862d14589224e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "version", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineStageOnFailureConditionRuleRuleTypeId]:
        return typing.cast(typing.Optional[CodepipelineStageOnFailureConditionRuleRuleTypeId], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineStageOnFailureConditionRuleRuleTypeId],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__792974c2a09d9810022d73fa022de62ca4b12310031837a0ec7b40a4e8c62128)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineStageOnFailureOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageOnFailureOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__834d3929ecd4d6e1a1ce0d933de5b4cfbaaf6c99e3d5eddda3931121b73a7e5f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCondition")
    def put_condition(
        self,
        *,
        rule: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStageOnFailureConditionRule, typing.Dict[builtins.str, typing.Any]]]],
        result: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param rule: rule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule Codepipeline#rule}
        :param result: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.
        '''
        value = CodepipelineStageOnFailureCondition(rule=rule, result=result)

        return typing.cast(None, jsii.invoke(self, "putCondition", [value]))

    @jsii.member(jsii_name="putRetryConfiguration")
    def put_retry_configuration(
        self,
        *,
        retry_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param retry_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#retry_mode Codepipeline#retry_mode}.
        '''
        value = CodepipelineStageOnFailureRetryConfiguration(retry_mode=retry_mode)

        return typing.cast(None, jsii.invoke(self, "putRetryConfiguration", [value]))

    @jsii.member(jsii_name="resetCondition")
    def reset_condition(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCondition", []))

    @jsii.member(jsii_name="resetResult")
    def reset_result(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResult", []))

    @jsii.member(jsii_name="resetRetryConfiguration")
    def reset_retry_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRetryConfiguration", []))

    @builtins.property
    @jsii.member(jsii_name="condition")
    def condition(self) -> CodepipelineStageOnFailureConditionOutputReference:
        return typing.cast(CodepipelineStageOnFailureConditionOutputReference, jsii.get(self, "condition"))

    @builtins.property
    @jsii.member(jsii_name="retryConfiguration")
    def retry_configuration(
        self,
    ) -> "CodepipelineStageOnFailureRetryConfigurationOutputReference":
        return typing.cast("CodepipelineStageOnFailureRetryConfigurationOutputReference", jsii.get(self, "retryConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="conditionInput")
    def condition_input(self) -> typing.Optional[CodepipelineStageOnFailureCondition]:
        return typing.cast(typing.Optional[CodepipelineStageOnFailureCondition], jsii.get(self, "conditionInput"))

    @builtins.property
    @jsii.member(jsii_name="resultInput")
    def result_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resultInput"))

    @builtins.property
    @jsii.member(jsii_name="retryConfigurationInput")
    def retry_configuration_input(
        self,
    ) -> typing.Optional["CodepipelineStageOnFailureRetryConfiguration"]:
        return typing.cast(typing.Optional["CodepipelineStageOnFailureRetryConfiguration"], jsii.get(self, "retryConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="result")
    def result(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "result"))

    @result.setter
    def result(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b4eb78c7a93bb575bf5f25c6658c1d06b0fdff6488fc993d340ca88ccfc29103)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "result", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CodepipelineStageOnFailure]:
        return typing.cast(typing.Optional[CodepipelineStageOnFailure], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineStageOnFailure],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5324d4edbeb425bf9977c91a717493d4afca5d8e0fabd61a69ef9f4edbc6d0e3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration",
    jsii_struct_bases=[],
    name_mapping={"retry_mode": "retryMode"},
)
class CodepipelineStageOnFailureRetryConfiguration:
    def __init__(self, *, retry_mode: typing.Optional[builtins.str] = None) -> None:
        '''
        :param retry_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#retry_mode Codepipeline#retry_mode}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c75c99a38b283972b1a610827747283db54a59945626b05843bab5370a85d2df)
            check_type(argname="argument retry_mode", value=retry_mode, expected_type=type_hints["retry_mode"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if retry_mode is not None:
            self._values["retry_mode"] = retry_mode

    @builtins.property
    def retry_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#retry_mode Codepipeline#retry_mode}.'''
        result = self._values.get("retry_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageOnFailureRetryConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineStageOnFailureRetryConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageOnFailureRetryConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8c89c53d7f20876bce4f22b5a89be27b318078bbcb634581c60b058ad8b50fa6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetRetryMode")
    def reset_retry_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRetryMode", []))

    @builtins.property
    @jsii.member(jsii_name="retryModeInput")
    def retry_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "retryModeInput"))

    @builtins.property
    @jsii.member(jsii_name="retryMode")
    def retry_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "retryMode"))

    @retry_mode.setter
    def retry_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fc1deefad5b3d992aebc30ee881d2423d26e745597d211a593b7593d1b179e4b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "retryMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineStageOnFailureRetryConfiguration]:
        return typing.cast(typing.Optional[CodepipelineStageOnFailureRetryConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineStageOnFailureRetryConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__080b01be05f712ea6efadc8b98c262d34744453c23f1741e61755f1892849ed7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageOnSuccess",
    jsii_struct_bases=[],
    name_mapping={"condition": "condition"},
)
class CodepipelineStageOnSuccess:
    def __init__(
        self,
        *,
        condition: typing.Union["CodepipelineStageOnSuccessCondition", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param condition: condition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
        '''
        if isinstance(condition, dict):
            condition = CodepipelineStageOnSuccessCondition(**condition)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75cb3b5e355656a0e1895d9938f7efa91cdb0630a5bcaeac895187d02f939d7c)
            check_type(argname="argument condition", value=condition, expected_type=type_hints["condition"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "condition": condition,
        }

    @builtins.property
    def condition(self) -> "CodepipelineStageOnSuccessCondition":
        '''condition block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
        '''
        result = self._values.get("condition")
        assert result is not None, "Required property 'condition' is missing"
        return typing.cast("CodepipelineStageOnSuccessCondition", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageOnSuccess(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageOnSuccessCondition",
    jsii_struct_bases=[],
    name_mapping={"rule": "rule", "result": "result"},
)
class CodepipelineStageOnSuccessCondition:
    def __init__(
        self,
        *,
        rule: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineStageOnSuccessConditionRule", typing.Dict[builtins.str, typing.Any]]]],
        result: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param rule: rule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule Codepipeline#rule}
        :param result: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee52cddbf6add1f2429b4dec9d38e45fb50d198e7dec949ee5708ce1bbaed4b0)
            check_type(argname="argument rule", value=rule, expected_type=type_hints["rule"])
            check_type(argname="argument result", value=result, expected_type=type_hints["result"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "rule": rule,
        }
        if result is not None:
            self._values["result"] = result

    @builtins.property
    def rule(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageOnSuccessConditionRule"]]:
        '''rule block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule Codepipeline#rule}
        '''
        result = self._values.get("rule")
        assert result is not None, "Required property 'rule' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageOnSuccessConditionRule"]], result)

    @builtins.property
    def result(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.'''
        result = self._values.get("result")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageOnSuccessCondition(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineStageOnSuccessConditionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageOnSuccessConditionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bc3220f4ac2e38b46190e41849c8f89234776f942869339cc6cfd63b827e07be)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRule")
    def put_rule(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineStageOnSuccessConditionRule", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4a0319f30c8d0e8a8b8e6d9c0d7ee60376afcd73e5be8203dcbe41699fc06b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRule", [value]))

    @jsii.member(jsii_name="resetResult")
    def reset_result(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetResult", []))

    @builtins.property
    @jsii.member(jsii_name="rule")
    def rule(self) -> "CodepipelineStageOnSuccessConditionRuleList":
        return typing.cast("CodepipelineStageOnSuccessConditionRuleList", jsii.get(self, "rule"))

    @builtins.property
    @jsii.member(jsii_name="resultInput")
    def result_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "resultInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleInput")
    def rule_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageOnSuccessConditionRule"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineStageOnSuccessConditionRule"]]], jsii.get(self, "ruleInput"))

    @builtins.property
    @jsii.member(jsii_name="result")
    def result(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "result"))

    @result.setter
    def result(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__55c2770ee014fa5ef90c6abfe449d8574f1e739bb34b291bb2c14d530fd0df13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "result", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CodepipelineStageOnSuccessCondition]:
        return typing.cast(typing.Optional[CodepipelineStageOnSuccessCondition], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineStageOnSuccessCondition],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b850b93c246d94a412cae1952857a9a130087cfcdd029d3bdc88de16555f867)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageOnSuccessConditionRule",
    jsii_struct_bases=[],
    name_mapping={
        "name": "name",
        "rule_type_id": "ruleTypeId",
        "commands": "commands",
        "configuration": "configuration",
        "input_artifacts": "inputArtifacts",
        "region": "region",
        "role_arn": "roleArn",
        "timeout_in_minutes": "timeoutInMinutes",
    },
)
class CodepipelineStageOnSuccessConditionRule:
    def __init__(
        self,
        *,
        name: builtins.str,
        rule_type_id: typing.Union["CodepipelineStageOnSuccessConditionRuleRuleTypeId", typing.Dict[builtins.str, typing.Any]],
        commands: typing.Optional[typing.Sequence[builtins.str]] = None,
        configuration: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        input_artifacts: typing.Optional[typing.Sequence[builtins.str]] = None,
        region: typing.Optional[builtins.str] = None,
        role_arn: typing.Optional[builtins.str] = None,
        timeout_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.
        :param rule_type_id: rule_type_id block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule_type_id Codepipeline#rule_type_id}
        :param commands: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#commands Codepipeline#commands}.
        :param configuration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#configuration Codepipeline#configuration}.
        :param input_artifacts: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#input_artifacts Codepipeline#input_artifacts}.
        :param region: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.
        :param timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#timeout_in_minutes Codepipeline#timeout_in_minutes}.
        '''
        if isinstance(rule_type_id, dict):
            rule_type_id = CodepipelineStageOnSuccessConditionRuleRuleTypeId(**rule_type_id)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__38186bf00c8f3cd209088b75d4fc1c7acf1a0ce9808e1cdddaa502a2f9b8ff1b)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument rule_type_id", value=rule_type_id, expected_type=type_hints["rule_type_id"])
            check_type(argname="argument commands", value=commands, expected_type=type_hints["commands"])
            check_type(argname="argument configuration", value=configuration, expected_type=type_hints["configuration"])
            check_type(argname="argument input_artifacts", value=input_artifacts, expected_type=type_hints["input_artifacts"])
            check_type(argname="argument region", value=region, expected_type=type_hints["region"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument timeout_in_minutes", value=timeout_in_minutes, expected_type=type_hints["timeout_in_minutes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
            "rule_type_id": rule_type_id,
        }
        if commands is not None:
            self._values["commands"] = commands
        if configuration is not None:
            self._values["configuration"] = configuration
        if input_artifacts is not None:
            self._values["input_artifacts"] = input_artifacts
        if region is not None:
            self._values["region"] = region
        if role_arn is not None:
            self._values["role_arn"] = role_arn
        if timeout_in_minutes is not None:
            self._values["timeout_in_minutes"] = timeout_in_minutes

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def rule_type_id(self) -> "CodepipelineStageOnSuccessConditionRuleRuleTypeId":
        '''rule_type_id block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule_type_id Codepipeline#rule_type_id}
        '''
        result = self._values.get("rule_type_id")
        assert result is not None, "Required property 'rule_type_id' is missing"
        return typing.cast("CodepipelineStageOnSuccessConditionRuleRuleTypeId", result)

    @builtins.property
    def commands(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#commands Codepipeline#commands}.'''
        result = self._values.get("commands")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def configuration(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#configuration Codepipeline#configuration}.'''
        result = self._values.get("configuration")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def input_artifacts(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#input_artifacts Codepipeline#input_artifacts}.'''
        result = self._values.get("input_artifacts")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def region(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.'''
        result = self._values.get("region")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.'''
        result = self._values.get("role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#timeout_in_minutes Codepipeline#timeout_in_minutes}.'''
        result = self._values.get("timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageOnSuccessConditionRule(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineStageOnSuccessConditionRuleList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageOnSuccessConditionRuleList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8b4d1b4f498470f13655688adcd4951738bbf5be37ecaaf9a721f5c3b6817215)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineStageOnSuccessConditionRuleOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7abb0ca69530a587265a16fc4c57ba23f827efa432e6884bd1d4c77b509c336d)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineStageOnSuccessConditionRuleOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c5a7c3a5c07b5ec58ca9c6d4932c3da06474b9212db882e368fbb729813484ef)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c6b248b35bf54569385f36af18167b87339f285700e3fc1d869e2543f5122757)
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
            type_hints = typing.get_type_hints(_typecheckingstub__be7f74befc8d943a911311fbd29bcee6e6aac3ae55a7a211ef4b6d71811f2572)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageOnSuccessConditionRule]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageOnSuccessConditionRule]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageOnSuccessConditionRule]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bac35d1060182d281dd9365e8f803b20f07b0172348ed682c6168dc68e73cf41)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineStageOnSuccessConditionRuleOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageOnSuccessConditionRuleOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f9a02168484ad3b765addb8a3069a319c03c10434f746db6045bdec6f65268b1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putRuleTypeId")
    def put_rule_type_id(
        self,
        *,
        category: builtins.str,
        provider: builtins.str,
        owner: typing.Optional[builtins.str] = None,
        version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param category: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.
        :param provider: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.
        :param owner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.
        '''
        value = CodepipelineStageOnSuccessConditionRuleRuleTypeId(
            category=category, provider=provider, owner=owner, version=version
        )

        return typing.cast(None, jsii.invoke(self, "putRuleTypeId", [value]))

    @jsii.member(jsii_name="resetCommands")
    def reset_commands(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCommands", []))

    @jsii.member(jsii_name="resetConfiguration")
    def reset_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConfiguration", []))

    @jsii.member(jsii_name="resetInputArtifacts")
    def reset_input_artifacts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInputArtifacts", []))

    @jsii.member(jsii_name="resetRegion")
    def reset_region(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRegion", []))

    @jsii.member(jsii_name="resetRoleArn")
    def reset_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoleArn", []))

    @jsii.member(jsii_name="resetTimeoutInMinutes")
    def reset_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeoutInMinutes", []))

    @builtins.property
    @jsii.member(jsii_name="ruleTypeId")
    def rule_type_id(
        self,
    ) -> "CodepipelineStageOnSuccessConditionRuleRuleTypeIdOutputReference":
        return typing.cast("CodepipelineStageOnSuccessConditionRuleRuleTypeIdOutputReference", jsii.get(self, "ruleTypeId"))

    @builtins.property
    @jsii.member(jsii_name="commandsInput")
    def commands_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "commandsInput"))

    @builtins.property
    @jsii.member(jsii_name="configurationInput")
    def configuration_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "configurationInput"))

    @builtins.property
    @jsii.member(jsii_name="inputArtifactsInput")
    def input_artifacts_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "inputArtifactsInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="regionInput")
    def region_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "regionInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="ruleTypeIdInput")
    def rule_type_id_input(
        self,
    ) -> typing.Optional["CodepipelineStageOnSuccessConditionRuleRuleTypeId"]:
        return typing.cast(typing.Optional["CodepipelineStageOnSuccessConditionRuleRuleTypeId"], jsii.get(self, "ruleTypeIdInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutInMinutesInput")
    def timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "timeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="commands")
    def commands(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "commands"))

    @commands.setter
    def commands(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fad42c9570596781b9d2bbc3109e083f009ff91ba7b60c70fa16d818ffa30999)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "commands", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="configuration")
    def configuration(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "configuration"))

    @configuration.setter
    def configuration(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb815416528c8cb7b55692b262b74b983771b477241759a785106142a5712af3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "configuration", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="inputArtifacts")
    def input_artifacts(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "inputArtifacts"))

    @input_artifacts.setter
    def input_artifacts(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__06cf9f50eb47449c81e6b862342c0557b660fcd4f50a120bfe6ee50c80875996)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "inputArtifacts", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b081b0d4eb3de677dc9efb923ced5f4478c7ebbf9214cd41617ff79276fc76d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="region")
    def region(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "region"))

    @region.setter
    def region(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__00365b4d8afc4e9da53ba47d0c637493c653a61879ba904e44d1ecd958c430cc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "region", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75e1765df28cbbfb49876b8d8fa8dbe2d2c42f23966dbc4059da1e4fec418151)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="timeoutInMinutes")
    def timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "timeoutInMinutes"))

    @timeout_in_minutes.setter
    def timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6be9386e0201704428dc3c5eaaa0f5932d62972ca91d9b887445cf8686f4287d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "timeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageOnSuccessConditionRule]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageOnSuccessConditionRule]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageOnSuccessConditionRule]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__648d888a6b1486ff03c78abdd84ce0cb8c9059db8d196acfcbb1aa6a9168fd7a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineStageOnSuccessConditionRuleRuleTypeId",
    jsii_struct_bases=[],
    name_mapping={
        "category": "category",
        "provider": "provider",
        "owner": "owner",
        "version": "version",
    },
)
class CodepipelineStageOnSuccessConditionRuleRuleTypeId:
    def __init__(
        self,
        *,
        category: builtins.str,
        provider: builtins.str,
        owner: typing.Optional[builtins.str] = None,
        version: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param category: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.
        :param provider: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.
        :param owner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.
        :param version: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e9eaa1b6db69ebd71e3df1763356491ad72034bdcd987d368cd8e60a0e524090)
            check_type(argname="argument category", value=category, expected_type=type_hints["category"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument owner", value=owner, expected_type=type_hints["owner"])
            check_type(argname="argument version", value=version, expected_type=type_hints["version"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "category": category,
            "provider": provider,
        }
        if owner is not None:
            self._values["owner"] = owner
        if version is not None:
            self._values["version"] = version

    @builtins.property
    def category(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.'''
        result = self._values.get("category")
        assert result is not None, "Required property 'category' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def provider(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.'''
        result = self._values.get("provider")
        assert result is not None, "Required property 'provider' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def owner(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.'''
        result = self._values.get("owner")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def version(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.'''
        result = self._values.get("version")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineStageOnSuccessConditionRuleRuleTypeId(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineStageOnSuccessConditionRuleRuleTypeIdOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageOnSuccessConditionRuleRuleTypeIdOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d68da6fe4fceedc67b7807e84d8659fc501ae0237a4bdd8d8489c9d26a96f97c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetOwner")
    def reset_owner(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOwner", []))

    @jsii.member(jsii_name="resetVersion")
    def reset_version(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVersion", []))

    @builtins.property
    @jsii.member(jsii_name="categoryInput")
    def category_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "categoryInput"))

    @builtins.property
    @jsii.member(jsii_name="ownerInput")
    def owner_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ownerInput"))

    @builtins.property
    @jsii.member(jsii_name="providerInput")
    def provider_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "providerInput"))

    @builtins.property
    @jsii.member(jsii_name="versionInput")
    def version_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "versionInput"))

    @builtins.property
    @jsii.member(jsii_name="category")
    def category(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "category"))

    @category.setter
    def category(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62166c244a296218caac1fdffe6385b956cebeb6833702850821c6436cb0d1cc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "category", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="owner")
    def owner(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "owner"))

    @owner.setter
    def owner(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bbd99cc5f34e80426cf04dce7a6ac8cfcdcd977fe68b7ced12e5e12d1a8cd3f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "owner", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="provider")
    def provider(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "provider"))

    @provider.setter
    def provider(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__30c30f80e4f9ecd8301e882e608317013e5fb4e0a3f5f82926cb7e67383191a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "provider", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="version")
    def version(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "version"))

    @version.setter
    def version(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__938a029859614f568abf2cbf5d89f31891d1ed1440c46051ee83e15cab8168f0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "version", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineStageOnSuccessConditionRuleRuleTypeId]:
        return typing.cast(typing.Optional[CodepipelineStageOnSuccessConditionRuleRuleTypeId], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineStageOnSuccessConditionRuleRuleTypeId],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3940b84c6e9bed4b90520fe8b584fcfc202a84705459b8baa6d79d2f905fa259)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineStageOnSuccessOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageOnSuccessOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e301ef08917ca121ab28ace65efe49f8bffef476e929d6cd5cfed81924f055ee)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCondition")
    def put_condition(
        self,
        *,
        rule: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStageOnSuccessConditionRule, typing.Dict[builtins.str, typing.Any]]]],
        result: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param rule: rule block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule Codepipeline#rule}
        :param result: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.
        '''
        value = CodepipelineStageOnSuccessCondition(rule=rule, result=result)

        return typing.cast(None, jsii.invoke(self, "putCondition", [value]))

    @builtins.property
    @jsii.member(jsii_name="condition")
    def condition(self) -> CodepipelineStageOnSuccessConditionOutputReference:
        return typing.cast(CodepipelineStageOnSuccessConditionOutputReference, jsii.get(self, "condition"))

    @builtins.property
    @jsii.member(jsii_name="conditionInput")
    def condition_input(self) -> typing.Optional[CodepipelineStageOnSuccessCondition]:
        return typing.cast(typing.Optional[CodepipelineStageOnSuccessCondition], jsii.get(self, "conditionInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CodepipelineStageOnSuccess]:
        return typing.cast(typing.Optional[CodepipelineStageOnSuccess], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineStageOnSuccess],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea38946de1e827e7eb2825aabc3a308ce9980338474a801b622ec5dfeb108c6a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineStageOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineStageOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3f4fc3bd50b8f77498431457705810f39ea37a25ab394ed92f95ea0f9facf77d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putAction")
    def put_action(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStageAction, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a2b46f78190b72f2463d2c08f455c1f7cd3ab581edb123c37668d22c9f2e025c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putAction", [value]))

    @jsii.member(jsii_name="putBeforeEntry")
    def put_before_entry(
        self,
        *,
        condition: typing.Union[CodepipelineStageBeforeEntryCondition, typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param condition: condition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
        '''
        value = CodepipelineStageBeforeEntry(condition=condition)

        return typing.cast(None, jsii.invoke(self, "putBeforeEntry", [value]))

    @jsii.member(jsii_name="putOnFailure")
    def put_on_failure(
        self,
        *,
        condition: typing.Optional[typing.Union[CodepipelineStageOnFailureCondition, typing.Dict[builtins.str, typing.Any]]] = None,
        result: typing.Optional[builtins.str] = None,
        retry_configuration: typing.Optional[typing.Union[CodepipelineStageOnFailureRetryConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param condition: condition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
        :param result: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.
        :param retry_configuration: retry_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#retry_configuration Codepipeline#retry_configuration}
        '''
        value = CodepipelineStageOnFailure(
            condition=condition, result=result, retry_configuration=retry_configuration
        )

        return typing.cast(None, jsii.invoke(self, "putOnFailure", [value]))

    @jsii.member(jsii_name="putOnSuccess")
    def put_on_success(
        self,
        *,
        condition: typing.Union[CodepipelineStageOnSuccessCondition, typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param condition: condition block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
        '''
        value = CodepipelineStageOnSuccess(condition=condition)

        return typing.cast(None, jsii.invoke(self, "putOnSuccess", [value]))

    @jsii.member(jsii_name="resetBeforeEntry")
    def reset_before_entry(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBeforeEntry", []))

    @jsii.member(jsii_name="resetOnFailure")
    def reset_on_failure(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnFailure", []))

    @jsii.member(jsii_name="resetOnSuccess")
    def reset_on_success(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnSuccess", []))

    @builtins.property
    @jsii.member(jsii_name="action")
    def action(self) -> CodepipelineStageActionList:
        return typing.cast(CodepipelineStageActionList, jsii.get(self, "action"))

    @builtins.property
    @jsii.member(jsii_name="beforeEntry")
    def before_entry(self) -> CodepipelineStageBeforeEntryOutputReference:
        return typing.cast(CodepipelineStageBeforeEntryOutputReference, jsii.get(self, "beforeEntry"))

    @builtins.property
    @jsii.member(jsii_name="onFailure")
    def on_failure(self) -> CodepipelineStageOnFailureOutputReference:
        return typing.cast(CodepipelineStageOnFailureOutputReference, jsii.get(self, "onFailure"))

    @builtins.property
    @jsii.member(jsii_name="onSuccess")
    def on_success(self) -> CodepipelineStageOnSuccessOutputReference:
        return typing.cast(CodepipelineStageOnSuccessOutputReference, jsii.get(self, "onSuccess"))

    @builtins.property
    @jsii.member(jsii_name="actionInput")
    def action_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageAction]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageAction]]], jsii.get(self, "actionInput"))

    @builtins.property
    @jsii.member(jsii_name="beforeEntryInput")
    def before_entry_input(self) -> typing.Optional[CodepipelineStageBeforeEntry]:
        return typing.cast(typing.Optional[CodepipelineStageBeforeEntry], jsii.get(self, "beforeEntryInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="onFailureInput")
    def on_failure_input(self) -> typing.Optional[CodepipelineStageOnFailure]:
        return typing.cast(typing.Optional[CodepipelineStageOnFailure], jsii.get(self, "onFailureInput"))

    @builtins.property
    @jsii.member(jsii_name="onSuccessInput")
    def on_success_input(self) -> typing.Optional[CodepipelineStageOnSuccess]:
        return typing.cast(typing.Optional[CodepipelineStageOnSuccess], jsii.get(self, "onSuccessInput"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37c54a798f9228627d7a761ff254b08bf34cebaed9338a2b695b94ab2470fe8e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStage]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStage]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStage]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__73ad13e302cbac040d55ea9365200ecbbb89488380d671d8148ee175c14e3ef9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTrigger",
    jsii_struct_bases=[],
    name_mapping={
        "git_configuration": "gitConfiguration",
        "provider_type": "providerType",
    },
)
class CodepipelineTrigger:
    def __init__(
        self,
        *,
        git_configuration: typing.Union["CodepipelineTriggerGitConfiguration", typing.Dict[builtins.str, typing.Any]],
        provider_type: builtins.str,
    ) -> None:
        '''
        :param git_configuration: git_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#git_configuration Codepipeline#git_configuration}
        :param provider_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider_type Codepipeline#provider_type}.
        '''
        if isinstance(git_configuration, dict):
            git_configuration = CodepipelineTriggerGitConfiguration(**git_configuration)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4459faa89b8b2aa641374e3f9b12aec18d49ce8b816ebe6f7ec0160afcf06897)
            check_type(argname="argument git_configuration", value=git_configuration, expected_type=type_hints["git_configuration"])
            check_type(argname="argument provider_type", value=provider_type, expected_type=type_hints["provider_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "git_configuration": git_configuration,
            "provider_type": provider_type,
        }

    @builtins.property
    def git_configuration(self) -> "CodepipelineTriggerGitConfiguration":
        '''git_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#git_configuration Codepipeline#git_configuration}
        '''
        result = self._values.get("git_configuration")
        assert result is not None, "Required property 'git_configuration' is missing"
        return typing.cast("CodepipelineTriggerGitConfiguration", result)

    @builtins.property
    def provider_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider_type Codepipeline#provider_type}.'''
        result = self._values.get("provider_type")
        assert result is not None, "Required property 'provider_type' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTrigger(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerAll",
    jsii_struct_bases=[],
    name_mapping={},
)
class CodepipelineTriggerAll:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerAll(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfiguration",
    jsii_struct_bases=[],
    name_mapping={},
)
class CodepipelineTriggerAllGitConfiguration:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerAllGitConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineTriggerAllGitConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4cb1421f3537cb266f5bbd949a0caf5a9217869c5fcd65d605da4f4818126b55)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineTriggerAllGitConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1cf7419a1270e617de37985bc2fd0f21066eb31bd7e1ed6616f61cc53a8d7e7d)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineTriggerAllGitConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e7153a58f36ce3de4b14bacf47b112260253f60dc8965d5dd1f2590ffabc49a7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__80c6eb4dda1fc8cff5a96fef79a9f99b44e9641927dba65750c3eb80034d4fbb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b16e5a306106e1720c0f5f87ca56729de01525b8349d9d5450e42b671a67b5d2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerAllGitConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0e363535880782d4576508ca77267fda4cd8a96aae2373a12f4b85988e4e34a7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="pullRequest")
    def pull_request(self) -> "CodepipelineTriggerAllGitConfigurationPullRequestList":
        return typing.cast("CodepipelineTriggerAllGitConfigurationPullRequestList", jsii.get(self, "pullRequest"))

    @builtins.property
    @jsii.member(jsii_name="push")
    def push(self) -> "CodepipelineTriggerAllGitConfigurationPushList":
        return typing.cast("CodepipelineTriggerAllGitConfigurationPushList", jsii.get(self, "push"))

    @builtins.property
    @jsii.member(jsii_name="sourceActionName")
    def source_action_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceActionName"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CodepipelineTriggerAllGitConfiguration]:
        return typing.cast(typing.Optional[CodepipelineTriggerAllGitConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerAllGitConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__846267f38227ea80e4c16a410dc8c890c9e892668853b3d6cbe86134d10a940e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPullRequest",
    jsii_struct_bases=[],
    name_mapping={},
)
class CodepipelineTriggerAllGitConfigurationPullRequest:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerAllGitConfigurationPullRequest(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPullRequestBranches",
    jsii_struct_bases=[],
    name_mapping={},
)
class CodepipelineTriggerAllGitConfigurationPullRequestBranches:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerAllGitConfigurationPullRequestBranches(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineTriggerAllGitConfigurationPullRequestBranchesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPullRequestBranchesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ca2a2eb9e4befb5b896cb3e439d04df7c408bd6fec88a729e21374fb72ce896b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineTriggerAllGitConfigurationPullRequestBranchesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8eedc84d9d3e971b8d0a685760d9642ae0e62b040bace2568a5cb8666ed05362)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineTriggerAllGitConfigurationPullRequestBranchesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a4074e9f2bf3f6f347be408f14b4b3d3a99cc7ee8fcf63a5901687b88945c6b1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b5fa049e1fab0dd01f75b328e6ac35fd09945729c84fbf7f638d3edbe8c2ffbc)
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
            type_hints = typing.get_type_hints(_typecheckingstub__324cf30e8487598dfcf984839cef5e6402c4824fc934caadcd47758d5c23b0c3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerAllGitConfigurationPullRequestBranchesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPullRequestBranchesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7cd4045eed129c9a531f24cb0459bbf3d5f2db6bba0f8c8db0a09fd728df9736)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="excludes")
    def excludes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "excludes"))

    @builtins.property
    @jsii.member(jsii_name="includes")
    def includes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "includes"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineTriggerAllGitConfigurationPullRequestBranches]:
        return typing.cast(typing.Optional[CodepipelineTriggerAllGitConfigurationPullRequestBranches], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerAllGitConfigurationPullRequestBranches],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d0a95abe637140d763b40c8ccc290b6e1f54f238a650a2ec238fcd63f0aee8ec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPullRequestFilePaths",
    jsii_struct_bases=[],
    name_mapping={},
)
class CodepipelineTriggerAllGitConfigurationPullRequestFilePaths:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerAllGitConfigurationPullRequestFilePaths(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineTriggerAllGitConfigurationPullRequestFilePathsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPullRequestFilePathsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cf9e49c13f5a13d833db76a557b22e3ccd95274fc1de4260d65f2e6f275ff71a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineTriggerAllGitConfigurationPullRequestFilePathsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__90ecc838209c9bfe167ee7a46765ec62e4c9ae512c91a2ca7091c421970a8e97)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineTriggerAllGitConfigurationPullRequestFilePathsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a6bb2d188f8858810c75f9d52bc19c1ea01fb156c2dd78f5e5ee2753dd9f69d8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b09c87bf8e89a29afe38b249e3331f6a476dc0e636367cb3f53bbcc9cf6249bb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e8cc56cf7ba5940559da6727458dc500564cf79d7b92d8255c7a8aa8b52ac3b2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerAllGitConfigurationPullRequestFilePathsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPullRequestFilePathsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d03c0aacc349f8b60a810fc63bfaa458b5d09243cc1d4a5e8d64821d16275630)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="excludes")
    def excludes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "excludes"))

    @builtins.property
    @jsii.member(jsii_name="includes")
    def includes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "includes"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineTriggerAllGitConfigurationPullRequestFilePaths]:
        return typing.cast(typing.Optional[CodepipelineTriggerAllGitConfigurationPullRequestFilePaths], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerAllGitConfigurationPullRequestFilePaths],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79b5ec7b44acc7291d9599f30995e971f366b4c2fff7d6088cddf41d59998b08)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerAllGitConfigurationPullRequestList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPullRequestList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0f5ef46b5aeb233aa91a4133a6696d53ccbd85664b7d0689e45fb97449215432)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineTriggerAllGitConfigurationPullRequestOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a43393bfc7ae8b03e2f73b1d0542a794b97538854e5de5d1c6b294a1486610ff)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineTriggerAllGitConfigurationPullRequestOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3d86a668e1b09ef5ce6de12de032ff7f373ff4232ba01aaf70a8b326d1e54b5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__84fbea9d969cf1c208b61c0877e5cd392e8c71294b0db4c5d8770b1631390794)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1e582d4d8edd39692acaafd3728da13db3714e609ffcabf6f9a247797d1fa185)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerAllGitConfigurationPullRequestOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPullRequestOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e4e4f9cd44cd626e93dbf2371022480782a44bce16c6936d311cba01bae4f2e6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="branches")
    def branches(self) -> CodepipelineTriggerAllGitConfigurationPullRequestBranchesList:
        return typing.cast(CodepipelineTriggerAllGitConfigurationPullRequestBranchesList, jsii.get(self, "branches"))

    @builtins.property
    @jsii.member(jsii_name="events")
    def events(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "events"))

    @builtins.property
    @jsii.member(jsii_name="filePaths")
    def file_paths(
        self,
    ) -> CodepipelineTriggerAllGitConfigurationPullRequestFilePathsList:
        return typing.cast(CodepipelineTriggerAllGitConfigurationPullRequestFilePathsList, jsii.get(self, "filePaths"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineTriggerAllGitConfigurationPullRequest]:
        return typing.cast(typing.Optional[CodepipelineTriggerAllGitConfigurationPullRequest], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerAllGitConfigurationPullRequest],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6de229f550223673189e1e499760c6c88ea232e90f8002212db953760cc84b87)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPush",
    jsii_struct_bases=[],
    name_mapping={},
)
class CodepipelineTriggerAllGitConfigurationPush:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerAllGitConfigurationPush(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPushBranches",
    jsii_struct_bases=[],
    name_mapping={},
)
class CodepipelineTriggerAllGitConfigurationPushBranches:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerAllGitConfigurationPushBranches(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineTriggerAllGitConfigurationPushBranchesList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPushBranchesList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__720110ac6baffe2d7b553036e34cc431d3072c17e8eaba781facf4b19430b487)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineTriggerAllGitConfigurationPushBranchesOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1dbe3267f2e9712133f6f151ae893dada9a83ff2f99198c01c4a523b91312559)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineTriggerAllGitConfigurationPushBranchesOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a49d120686eb00312f89cf9358a09d7e8077899acc15e829cf3ada3524499d54)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d446f83461102c8fe038b28c4ca3b39e0b41030a17a1d2b970c0c5a32b8f6d98)
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
            type_hints = typing.get_type_hints(_typecheckingstub__dd38ea74a505825745afd9f8730d1c0f39623f7a767e47a04ab5a201c810d3f6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerAllGitConfigurationPushBranchesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPushBranchesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f0912903d93999986ae6662d5051d01d391c49a3c22356e17893b6aa8ba83864)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="excludes")
    def excludes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "excludes"))

    @builtins.property
    @jsii.member(jsii_name="includes")
    def includes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "includes"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineTriggerAllGitConfigurationPushBranches]:
        return typing.cast(typing.Optional[CodepipelineTriggerAllGitConfigurationPushBranches], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerAllGitConfigurationPushBranches],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6bc3f9beb7fe05e4e4d5a62e4cb41adbd723394a198e15cc4346eefeeeab8e90)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPushFilePaths",
    jsii_struct_bases=[],
    name_mapping={},
)
class CodepipelineTriggerAllGitConfigurationPushFilePaths:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerAllGitConfigurationPushFilePaths(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineTriggerAllGitConfigurationPushFilePathsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPushFilePathsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8b4ad1471324cf2a9c3802e0243cc34342cd11bd25828fc01bde0f43529bba6c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineTriggerAllGitConfigurationPushFilePathsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__815ba006b22d86dc9ece09c0fe2f0adfbcfc8297335ba7f0c65be32f52a26518)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineTriggerAllGitConfigurationPushFilePathsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e2031a00e929309649bc17c5149cbd718465ccb67b32ecacaf2fd404da639846)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4504caec3440680a74004415171c5008c78c14850645ee599ba032f62af77699)
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
            type_hints = typing.get_type_hints(_typecheckingstub__baaf4daa72d48d059ae018a26c1bf674683b6f506a5872e848a0f751cb315233)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerAllGitConfigurationPushFilePathsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPushFilePathsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__caabe48b412269f5436d368e09c3e70fa3e75e3bb4db20766120a8a2556c6cc3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="excludes")
    def excludes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "excludes"))

    @builtins.property
    @jsii.member(jsii_name="includes")
    def includes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "includes"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineTriggerAllGitConfigurationPushFilePaths]:
        return typing.cast(typing.Optional[CodepipelineTriggerAllGitConfigurationPushFilePaths], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerAllGitConfigurationPushFilePaths],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b9c5dc1ea940d8aa79c7986cef29c8f8e06c3213c036f93491f6d57603c2e6a5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerAllGitConfigurationPushList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPushList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9608da3b15ad2dd3c422b991138fb8792e211c96ae106eae6aa16878adde9679)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineTriggerAllGitConfigurationPushOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e01c95961883a055fc74fff03e3045f87b940600ac3e051020f930e9c8925481)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineTriggerAllGitConfigurationPushOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b226dfbdeb171c092a46d943b668f57efe395cd2e8828752866a97e7590cc96d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0f33dc3eb5117c9953529216f6fc3c383a232b0b7ae33e9ad94e7d221e4882d0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__490a9a3f46e4fb77381fc6a7ba94cedfa57559e6ae48b8df524fcdad9f9f93b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerAllGitConfigurationPushOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPushOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4e5d9ac5df721f376672fa91fc22dadaca9345fd29e72518494c182e1dba94a5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="branches")
    def branches(self) -> CodepipelineTriggerAllGitConfigurationPushBranchesList:
        return typing.cast(CodepipelineTriggerAllGitConfigurationPushBranchesList, jsii.get(self, "branches"))

    @builtins.property
    @jsii.member(jsii_name="filePaths")
    def file_paths(self) -> CodepipelineTriggerAllGitConfigurationPushFilePathsList:
        return typing.cast(CodepipelineTriggerAllGitConfigurationPushFilePathsList, jsii.get(self, "filePaths"))

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> "CodepipelineTriggerAllGitConfigurationPushTagsList":
        return typing.cast("CodepipelineTriggerAllGitConfigurationPushTagsList", jsii.get(self, "tags"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineTriggerAllGitConfigurationPush]:
        return typing.cast(typing.Optional[CodepipelineTriggerAllGitConfigurationPush], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerAllGitConfigurationPush],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2ff6314eb3bbce032dd23e89fe283502a3400012981c97b5037f838e17ab507)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPushTags",
    jsii_struct_bases=[],
    name_mapping={},
)
class CodepipelineTriggerAllGitConfigurationPushTags:
    def __init__(self) -> None:
        self._values: typing.Dict[builtins.str, typing.Any] = {}

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerAllGitConfigurationPushTags(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineTriggerAllGitConfigurationPushTagsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPushTagsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7bbc61d01554c9b069a6caa7b302c90196dfa63ffe0886bf48f313462ca0ea90)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineTriggerAllGitConfigurationPushTagsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__793ac5356a28ee3caff1f35f486c7d7002b76444e3e28be5b2df86f58d6eea7c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineTriggerAllGitConfigurationPushTagsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__909a02012229a7ed2c8d97b27225d850154902114398db809c07112df07aa104)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c01b83ba8b898964813e896f21c0e6359b7b671680349062e780084d0676c176)
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
            type_hints = typing.get_type_hints(_typecheckingstub__dff16d6ba28ef62508c8fe5451a863ace3743509e7bd08bb0a06f87a33d7e8ad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerAllGitConfigurationPushTagsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllGitConfigurationPushTagsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7579ea92e74b5a0e4d0396cdf82db327b05a36df5033857ad28680c02b6d3e18)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="excludes")
    def excludes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "excludes"))

    @builtins.property
    @jsii.member(jsii_name="includes")
    def includes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "includes"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineTriggerAllGitConfigurationPushTags]:
        return typing.cast(typing.Optional[CodepipelineTriggerAllGitConfigurationPushTags], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerAllGitConfigurationPushTags],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3871215bca0e781f812ae633f2deb607d033aaa3b2be28766c37498c3f839fd4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerAllList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1f5e5a1785cb06fe61029526704131f3624736f57e3b8ae417e915bf300f1bbf)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "CodepipelineTriggerAllOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__88b6581fa7720b588605a4692e12e825ce10ae593bb8b996a3588fee0a740404)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineTriggerAllOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7f9db50770424183743ae057636aaad2759810034d90def1402d7cf2bdf455fb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5868b3e1cdc84330798c965c783a57e8dbde1e44c36e65d293ad68100f2c7f79)
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
            type_hints = typing.get_type_hints(_typecheckingstub__bc20afd259fc351c9951b79be7a4152f0581a59aba319dc9230e2ea79036777a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerAllOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerAllOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__00db85d84871965e288e85cdef36b61b5add1a956b89b7530ab956883dc4426a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="gitConfiguration")
    def git_configuration(self) -> CodepipelineTriggerAllGitConfigurationList:
        return typing.cast(CodepipelineTriggerAllGitConfigurationList, jsii.get(self, "gitConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="providerType")
    def provider_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "providerType"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CodepipelineTriggerAll]:
        return typing.cast(typing.Optional[CodepipelineTriggerAll], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[CodepipelineTriggerAll]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bc6bea4c051fb8f86baf0d7a7c965043991390108df85a42d0742685f4bb2d77)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "source_action_name": "sourceActionName",
        "pull_request": "pullRequest",
        "push": "push",
    },
)
class CodepipelineTriggerGitConfiguration:
    def __init__(
        self,
        *,
        source_action_name: builtins.str,
        pull_request: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineTriggerGitConfigurationPullRequest", typing.Dict[builtins.str, typing.Any]]]]] = None,
        push: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineTriggerGitConfigurationPush", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param source_action_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#source_action_name Codepipeline#source_action_name}.
        :param pull_request: pull_request block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#pull_request Codepipeline#pull_request}
        :param push: push block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#push Codepipeline#push}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__97dd1b42f84dc3b27ecec1df1546615f50a09fc542f215a74e1d5ef64558c00b)
            check_type(argname="argument source_action_name", value=source_action_name, expected_type=type_hints["source_action_name"])
            check_type(argname="argument pull_request", value=pull_request, expected_type=type_hints["pull_request"])
            check_type(argname="argument push", value=push, expected_type=type_hints["push"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "source_action_name": source_action_name,
        }
        if pull_request is not None:
            self._values["pull_request"] = pull_request
        if push is not None:
            self._values["push"] = push

    @builtins.property
    def source_action_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#source_action_name Codepipeline#source_action_name}.'''
        result = self._values.get("source_action_name")
        assert result is not None, "Required property 'source_action_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def pull_request(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineTriggerGitConfigurationPullRequest"]]]:
        '''pull_request block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#pull_request Codepipeline#pull_request}
        '''
        result = self._values.get("pull_request")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineTriggerGitConfigurationPullRequest"]]], result)

    @builtins.property
    def push(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineTriggerGitConfigurationPush"]]]:
        '''push block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#push Codepipeline#push}
        '''
        result = self._values.get("push")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineTriggerGitConfigurationPush"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerGitConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineTriggerGitConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__962260fd20bf2527c27fa4f800d5a9e3ff1647b86dae4c6b6557f8370b43efc2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putPullRequest")
    def put_pull_request(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineTriggerGitConfigurationPullRequest", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9ef2f654706dc7ccc5e08a749a93610a573c5742b7173a8ed2d084c332caa2f2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPullRequest", [value]))

    @jsii.member(jsii_name="putPush")
    def put_push(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CodepipelineTriggerGitConfigurationPush", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__688716f2eb523234e1b443fd4a2a62c1a7e6e49e184b77bacff1feeb5bec89aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putPush", [value]))

    @jsii.member(jsii_name="resetPullRequest")
    def reset_pull_request(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPullRequest", []))

    @jsii.member(jsii_name="resetPush")
    def reset_push(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPush", []))

    @builtins.property
    @jsii.member(jsii_name="pullRequest")
    def pull_request(self) -> "CodepipelineTriggerGitConfigurationPullRequestList":
        return typing.cast("CodepipelineTriggerGitConfigurationPullRequestList", jsii.get(self, "pullRequest"))

    @builtins.property
    @jsii.member(jsii_name="push")
    def push(self) -> "CodepipelineTriggerGitConfigurationPushList":
        return typing.cast("CodepipelineTriggerGitConfigurationPushList", jsii.get(self, "push"))

    @builtins.property
    @jsii.member(jsii_name="pullRequestInput")
    def pull_request_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineTriggerGitConfigurationPullRequest"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineTriggerGitConfigurationPullRequest"]]], jsii.get(self, "pullRequestInput"))

    @builtins.property
    @jsii.member(jsii_name="pushInput")
    def push_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineTriggerGitConfigurationPush"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CodepipelineTriggerGitConfigurationPush"]]], jsii.get(self, "pushInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceActionNameInput")
    def source_action_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sourceActionNameInput"))

    @builtins.property
    @jsii.member(jsii_name="sourceActionName")
    def source_action_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sourceActionName"))

    @source_action_name.setter
    def source_action_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37a3816a76526dc9ef192e006972562fea099a03b08f6614d6ebeb90dfcd2d33)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sourceActionName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[CodepipelineTriggerGitConfiguration]:
        return typing.cast(typing.Optional[CodepipelineTriggerGitConfiguration], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerGitConfiguration],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ea080ac7135e58d5d76f3a597bb4c788f44a1fde75bbaa36bdcf6763b3fbf34)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequest",
    jsii_struct_bases=[],
    name_mapping={
        "branches": "branches",
        "events": "events",
        "file_paths": "filePaths",
    },
)
class CodepipelineTriggerGitConfigurationPullRequest:
    def __init__(
        self,
        *,
        branches: typing.Optional[typing.Union["CodepipelineTriggerGitConfigurationPullRequestBranches", typing.Dict[builtins.str, typing.Any]]] = None,
        events: typing.Optional[typing.Sequence[builtins.str]] = None,
        file_paths: typing.Optional[typing.Union["CodepipelineTriggerGitConfigurationPullRequestFilePaths", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param branches: branches block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#branches Codepipeline#branches}
        :param events: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#events Codepipeline#events}.
        :param file_paths: file_paths block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#file_paths Codepipeline#file_paths}
        '''
        if isinstance(branches, dict):
            branches = CodepipelineTriggerGitConfigurationPullRequestBranches(**branches)
        if isinstance(file_paths, dict):
            file_paths = CodepipelineTriggerGitConfigurationPullRequestFilePaths(**file_paths)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__94c9388bf5716593b3cf784c2158bf6a57f23be14b7b777bd5f2826b2499d261)
            check_type(argname="argument branches", value=branches, expected_type=type_hints["branches"])
            check_type(argname="argument events", value=events, expected_type=type_hints["events"])
            check_type(argname="argument file_paths", value=file_paths, expected_type=type_hints["file_paths"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if branches is not None:
            self._values["branches"] = branches
        if events is not None:
            self._values["events"] = events
        if file_paths is not None:
            self._values["file_paths"] = file_paths

    @builtins.property
    def branches(
        self,
    ) -> typing.Optional["CodepipelineTriggerGitConfigurationPullRequestBranches"]:
        '''branches block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#branches Codepipeline#branches}
        '''
        result = self._values.get("branches")
        return typing.cast(typing.Optional["CodepipelineTriggerGitConfigurationPullRequestBranches"], result)

    @builtins.property
    def events(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#events Codepipeline#events}.'''
        result = self._values.get("events")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def file_paths(
        self,
    ) -> typing.Optional["CodepipelineTriggerGitConfigurationPullRequestFilePaths"]:
        '''file_paths block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#file_paths Codepipeline#file_paths}
        '''
        result = self._values.get("file_paths")
        return typing.cast(typing.Optional["CodepipelineTriggerGitConfigurationPullRequestFilePaths"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerGitConfigurationPullRequest(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches",
    jsii_struct_bases=[],
    name_mapping={"excludes": "excludes", "includes": "includes"},
)
class CodepipelineTriggerGitConfigurationPullRequestBranches:
    def __init__(
        self,
        *,
        excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
        includes: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param excludes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.
        :param includes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c2b348a8a3f2a24476616a44539a2243fc0692f9baec4e37c6de696790fcd21)
            check_type(argname="argument excludes", value=excludes, expected_type=type_hints["excludes"])
            check_type(argname="argument includes", value=includes, expected_type=type_hints["includes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if excludes is not None:
            self._values["excludes"] = excludes
        if includes is not None:
            self._values["includes"] = includes

    @builtins.property
    def excludes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.'''
        result = self._values.get("excludes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def includes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.'''
        result = self._values.get("includes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerGitConfigurationPullRequestBranches(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineTriggerGitConfigurationPullRequestBranchesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranchesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__21fedb977d77c3bb74ff825e4457ce6377e27c47b3ada7925c1b834417912277)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExcludes")
    def reset_excludes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExcludes", []))

    @jsii.member(jsii_name="resetIncludes")
    def reset_includes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIncludes", []))

    @builtins.property
    @jsii.member(jsii_name="excludesInput")
    def excludes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "excludesInput"))

    @builtins.property
    @jsii.member(jsii_name="includesInput")
    def includes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "includesInput"))

    @builtins.property
    @jsii.member(jsii_name="excludes")
    def excludes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "excludes"))

    @excludes.setter
    def excludes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8f5f27b7b92b3347458c35601127a833fc89ab9525e5543509bee0952876f10d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "excludes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="includes")
    def includes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "includes"))

    @includes.setter
    def includes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c1e3b5582503cbd8d5590dc260a4488203789ee93ec4196672525d8405f80788)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "includes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineTriggerGitConfigurationPullRequestBranches]:
        return typing.cast(typing.Optional[CodepipelineTriggerGitConfigurationPullRequestBranches], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerGitConfigurationPullRequestBranches],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__16d76cc20132d4630fbc2e7fa06a3faa9021380590951c8e2d95340b194229ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePaths",
    jsii_struct_bases=[],
    name_mapping={"excludes": "excludes", "includes": "includes"},
)
class CodepipelineTriggerGitConfigurationPullRequestFilePaths:
    def __init__(
        self,
        *,
        excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
        includes: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param excludes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.
        :param includes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1514ddc51411aa22ec3430b9b426aaff1e6dca8d2472ef7d3f725dac9810b167)
            check_type(argname="argument excludes", value=excludes, expected_type=type_hints["excludes"])
            check_type(argname="argument includes", value=includes, expected_type=type_hints["includes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if excludes is not None:
            self._values["excludes"] = excludes
        if includes is not None:
            self._values["includes"] = includes

    @builtins.property
    def excludes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.'''
        result = self._values.get("excludes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def includes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.'''
        result = self._values.get("includes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerGitConfigurationPullRequestFilePaths(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineTriggerGitConfigurationPullRequestFilePathsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePathsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ef212aacecbe9587b0af8e1cd3fc6cedb17f3933589dd4a401463103f05a1bf4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExcludes")
    def reset_excludes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExcludes", []))

    @jsii.member(jsii_name="resetIncludes")
    def reset_includes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIncludes", []))

    @builtins.property
    @jsii.member(jsii_name="excludesInput")
    def excludes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "excludesInput"))

    @builtins.property
    @jsii.member(jsii_name="includesInput")
    def includes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "includesInput"))

    @builtins.property
    @jsii.member(jsii_name="excludes")
    def excludes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "excludes"))

    @excludes.setter
    def excludes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3006133d2d5b2347b40b66eb84b121f0267ce807a560945885d7e5ab3568b33f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "excludes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="includes")
    def includes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "includes"))

    @includes.setter
    def includes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__74829f5f61f58d1cf78141976f62945c04f07782c01057c2fbdef8348930bdc3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "includes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineTriggerGitConfigurationPullRequestFilePaths]:
        return typing.cast(typing.Optional[CodepipelineTriggerGitConfigurationPullRequestFilePaths], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerGitConfigurationPullRequestFilePaths],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__247002bc8fab046175d37460a27ba43a11a111c0ffce992476b2541d7ad27cbb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerGitConfigurationPullRequestList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1ea80af04657a82aea2f0e418a5f088ed42852258c05d1db84d424184b2f4c1f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineTriggerGitConfigurationPullRequestOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5a165f6f2699269b3652d41559dfde4f08cd67cfddb5e82ff5d53e37201d560)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineTriggerGitConfigurationPullRequestOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5bb337c49401d352aea554780b814b049b2d80c8d8185270e9fb6f416dd93166)
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
            type_hints = typing.get_type_hints(_typecheckingstub__fdb09a949f2d13a3839be78158d3318d041297d7a1a45122404210124ee02a8f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__92cb1ee75d87998a0134b7ddd78a8dc4feafbefe2b2ff5af11f9f23a51d7b114)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineTriggerGitConfigurationPullRequest]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineTriggerGitConfigurationPullRequest]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineTriggerGitConfigurationPullRequest]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a4bac0f66d9fd6982af91bdb8cb2febac2acaf193ae02194ebf7ff1f0445853)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerGitConfigurationPullRequestOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8d53e31246453b2d6873380cd92bc81aed811657b2b7f3d10722939379d27255)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putBranches")
    def put_branches(
        self,
        *,
        excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
        includes: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param excludes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.
        :param includes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.
        '''
        value = CodepipelineTriggerGitConfigurationPullRequestBranches(
            excludes=excludes, includes=includes
        )

        return typing.cast(None, jsii.invoke(self, "putBranches", [value]))

    @jsii.member(jsii_name="putFilePaths")
    def put_file_paths(
        self,
        *,
        excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
        includes: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param excludes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.
        :param includes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.
        '''
        value = CodepipelineTriggerGitConfigurationPullRequestFilePaths(
            excludes=excludes, includes=includes
        )

        return typing.cast(None, jsii.invoke(self, "putFilePaths", [value]))

    @jsii.member(jsii_name="resetBranches")
    def reset_branches(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBranches", []))

    @jsii.member(jsii_name="resetEvents")
    def reset_events(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEvents", []))

    @jsii.member(jsii_name="resetFilePaths")
    def reset_file_paths(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilePaths", []))

    @builtins.property
    @jsii.member(jsii_name="branches")
    def branches(
        self,
    ) -> CodepipelineTriggerGitConfigurationPullRequestBranchesOutputReference:
        return typing.cast(CodepipelineTriggerGitConfigurationPullRequestBranchesOutputReference, jsii.get(self, "branches"))

    @builtins.property
    @jsii.member(jsii_name="filePaths")
    def file_paths(
        self,
    ) -> CodepipelineTriggerGitConfigurationPullRequestFilePathsOutputReference:
        return typing.cast(CodepipelineTriggerGitConfigurationPullRequestFilePathsOutputReference, jsii.get(self, "filePaths"))

    @builtins.property
    @jsii.member(jsii_name="branchesInput")
    def branches_input(
        self,
    ) -> typing.Optional[CodepipelineTriggerGitConfigurationPullRequestBranches]:
        return typing.cast(typing.Optional[CodepipelineTriggerGitConfigurationPullRequestBranches], jsii.get(self, "branchesInput"))

    @builtins.property
    @jsii.member(jsii_name="eventsInput")
    def events_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "eventsInput"))

    @builtins.property
    @jsii.member(jsii_name="filePathsInput")
    def file_paths_input(
        self,
    ) -> typing.Optional[CodepipelineTriggerGitConfigurationPullRequestFilePaths]:
        return typing.cast(typing.Optional[CodepipelineTriggerGitConfigurationPullRequestFilePaths], jsii.get(self, "filePathsInput"))

    @builtins.property
    @jsii.member(jsii_name="events")
    def events(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "events"))

    @events.setter
    def events(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa7f7cb8313bad98868ea46adf46403e11f5c7bceae414bfb7bd49b9209b1140)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "events", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineTriggerGitConfigurationPullRequest]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineTriggerGitConfigurationPullRequest]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineTriggerGitConfigurationPullRequest]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96f2ba332f275bbb459d6413d60e470a098198f1255a93fd5cdbd3a45219fbcd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPush",
    jsii_struct_bases=[],
    name_mapping={"branches": "branches", "file_paths": "filePaths", "tags": "tags"},
)
class CodepipelineTriggerGitConfigurationPush:
    def __init__(
        self,
        *,
        branches: typing.Optional[typing.Union["CodepipelineTriggerGitConfigurationPushBranches", typing.Dict[builtins.str, typing.Any]]] = None,
        file_paths: typing.Optional[typing.Union["CodepipelineTriggerGitConfigurationPushFilePaths", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Union["CodepipelineTriggerGitConfigurationPushTags", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param branches: branches block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#branches Codepipeline#branches}
        :param file_paths: file_paths block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#file_paths Codepipeline#file_paths}
        :param tags: tags block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#tags Codepipeline#tags}
        '''
        if isinstance(branches, dict):
            branches = CodepipelineTriggerGitConfigurationPushBranches(**branches)
        if isinstance(file_paths, dict):
            file_paths = CodepipelineTriggerGitConfigurationPushFilePaths(**file_paths)
        if isinstance(tags, dict):
            tags = CodepipelineTriggerGitConfigurationPushTags(**tags)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9d2d99267b45bbd62ffec7bb24af75deea82556b2284a50a462e8e06149477bb)
            check_type(argname="argument branches", value=branches, expected_type=type_hints["branches"])
            check_type(argname="argument file_paths", value=file_paths, expected_type=type_hints["file_paths"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if branches is not None:
            self._values["branches"] = branches
        if file_paths is not None:
            self._values["file_paths"] = file_paths
        if tags is not None:
            self._values["tags"] = tags

    @builtins.property
    def branches(
        self,
    ) -> typing.Optional["CodepipelineTriggerGitConfigurationPushBranches"]:
        '''branches block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#branches Codepipeline#branches}
        '''
        result = self._values.get("branches")
        return typing.cast(typing.Optional["CodepipelineTriggerGitConfigurationPushBranches"], result)

    @builtins.property
    def file_paths(
        self,
    ) -> typing.Optional["CodepipelineTriggerGitConfigurationPushFilePaths"]:
        '''file_paths block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#file_paths Codepipeline#file_paths}
        '''
        result = self._values.get("file_paths")
        return typing.cast(typing.Optional["CodepipelineTriggerGitConfigurationPushFilePaths"], result)

    @builtins.property
    def tags(self) -> typing.Optional["CodepipelineTriggerGitConfigurationPushTags"]:
        '''tags block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#tags Codepipeline#tags}
        '''
        result = self._values.get("tags")
        return typing.cast(typing.Optional["CodepipelineTriggerGitConfigurationPushTags"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerGitConfigurationPush(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranches",
    jsii_struct_bases=[],
    name_mapping={"excludes": "excludes", "includes": "includes"},
)
class CodepipelineTriggerGitConfigurationPushBranches:
    def __init__(
        self,
        *,
        excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
        includes: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param excludes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.
        :param includes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79c824492d3f925a59de3ad92ddfe076b8a3c51bd5526028b2d9ad2b262402bf)
            check_type(argname="argument excludes", value=excludes, expected_type=type_hints["excludes"])
            check_type(argname="argument includes", value=includes, expected_type=type_hints["includes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if excludes is not None:
            self._values["excludes"] = excludes
        if includes is not None:
            self._values["includes"] = includes

    @builtins.property
    def excludes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.'''
        result = self._values.get("excludes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def includes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.'''
        result = self._values.get("includes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerGitConfigurationPushBranches(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineTriggerGitConfigurationPushBranchesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranchesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7ab9a3b021cc4d1ab376633fc534240b3748e555c3343d6ac8ca226ee80e9d3f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExcludes")
    def reset_excludes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExcludes", []))

    @jsii.member(jsii_name="resetIncludes")
    def reset_includes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIncludes", []))

    @builtins.property
    @jsii.member(jsii_name="excludesInput")
    def excludes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "excludesInput"))

    @builtins.property
    @jsii.member(jsii_name="includesInput")
    def includes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "includesInput"))

    @builtins.property
    @jsii.member(jsii_name="excludes")
    def excludes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "excludes"))

    @excludes.setter
    def excludes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__afcd4bd124b4821a34a1b72928800153c479758519df011749c6d6cdeae19944)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "excludes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="includes")
    def includes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "includes"))

    @includes.setter
    def includes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dfbe4842f8783210a222c3bc5217ef64d00b94ee68d5d6e5e83d989c9065e0fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "includes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineTriggerGitConfigurationPushBranches]:
        return typing.cast(typing.Optional[CodepipelineTriggerGitConfigurationPushBranches], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerGitConfigurationPushBranches],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f249da8e8a6d88538ddd95c2507bc4d3fdb6301cd3ecf5d8e583ad738a873128)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePaths",
    jsii_struct_bases=[],
    name_mapping={"excludes": "excludes", "includes": "includes"},
)
class CodepipelineTriggerGitConfigurationPushFilePaths:
    def __init__(
        self,
        *,
        excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
        includes: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param excludes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.
        :param includes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1ecaecec214a21479eec3268f3e3344fc16103fd22c881ad80c024b65d816e4)
            check_type(argname="argument excludes", value=excludes, expected_type=type_hints["excludes"])
            check_type(argname="argument includes", value=includes, expected_type=type_hints["includes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if excludes is not None:
            self._values["excludes"] = excludes
        if includes is not None:
            self._values["includes"] = includes

    @builtins.property
    def excludes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.'''
        result = self._values.get("excludes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def includes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.'''
        result = self._values.get("includes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerGitConfigurationPushFilePaths(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineTriggerGitConfigurationPushFilePathsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePathsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__36b8dc1c0a06083b93e9e191ddbe0b0b0610df1ef8db1dfac39dc7f6e8ae9916)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExcludes")
    def reset_excludes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExcludes", []))

    @jsii.member(jsii_name="resetIncludes")
    def reset_includes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIncludes", []))

    @builtins.property
    @jsii.member(jsii_name="excludesInput")
    def excludes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "excludesInput"))

    @builtins.property
    @jsii.member(jsii_name="includesInput")
    def includes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "includesInput"))

    @builtins.property
    @jsii.member(jsii_name="excludes")
    def excludes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "excludes"))

    @excludes.setter
    def excludes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__88fc49ade78f19162344614924f6429f3cb03493e2e4c007a7245249ee90020b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "excludes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="includes")
    def includes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "includes"))

    @includes.setter
    def includes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__23d4868777f455b8169f3c5c9f58aff7c2bdbe459ef19ed8c3252549ff9b1dee)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "includes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineTriggerGitConfigurationPushFilePaths]:
        return typing.cast(typing.Optional[CodepipelineTriggerGitConfigurationPushFilePaths], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerGitConfigurationPushFilePaths],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32ffe761f6de3f887eb3bb5746b5812a24260a569c55dfe9a582e2b35cc3ff7b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerGitConfigurationPushList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPushList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__66fdd0ff4bc2fa5b07448b2ff4fadc20844d28af7243524540ac4f2a91b5c53d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CodepipelineTriggerGitConfigurationPushOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__228ca96ad6ffdb619f33298eaacdf7634c01068dcf493d2e07e290e4ffce98c0)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineTriggerGitConfigurationPushOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7cc93b2824c7c20713d904620354be4e6fff9012a4179551a959bf27a6d7de0b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9fd999aeefac76333e4d7193fec5890069bba33157d6bd367b358da25ea6cd2d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c2c4f913a379cee8b45e0966ba50808080ccfb5e2a8cf34a2b0c3de49f6057a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineTriggerGitConfigurationPush]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineTriggerGitConfigurationPush]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineTriggerGitConfigurationPush]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__378cc166db21b448945281f8afb88a7ff19dc226beefa00d887ee654607deb64)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerGitConfigurationPushOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPushOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__83938f41f4e94e641515c149aafaf3e01719ef2357d088e8b49def478d018d81)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putBranches")
    def put_branches(
        self,
        *,
        excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
        includes: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param excludes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.
        :param includes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.
        '''
        value = CodepipelineTriggerGitConfigurationPushBranches(
            excludes=excludes, includes=includes
        )

        return typing.cast(None, jsii.invoke(self, "putBranches", [value]))

    @jsii.member(jsii_name="putFilePaths")
    def put_file_paths(
        self,
        *,
        excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
        includes: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param excludes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.
        :param includes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.
        '''
        value = CodepipelineTriggerGitConfigurationPushFilePaths(
            excludes=excludes, includes=includes
        )

        return typing.cast(None, jsii.invoke(self, "putFilePaths", [value]))

    @jsii.member(jsii_name="putTags")
    def put_tags(
        self,
        *,
        excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
        includes: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param excludes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.
        :param includes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.
        '''
        value = CodepipelineTriggerGitConfigurationPushTags(
            excludes=excludes, includes=includes
        )

        return typing.cast(None, jsii.invoke(self, "putTags", [value]))

    @jsii.member(jsii_name="resetBranches")
    def reset_branches(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBranches", []))

    @jsii.member(jsii_name="resetFilePaths")
    def reset_file_paths(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFilePaths", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @builtins.property
    @jsii.member(jsii_name="branches")
    def branches(
        self,
    ) -> CodepipelineTriggerGitConfigurationPushBranchesOutputReference:
        return typing.cast(CodepipelineTriggerGitConfigurationPushBranchesOutputReference, jsii.get(self, "branches"))

    @builtins.property
    @jsii.member(jsii_name="filePaths")
    def file_paths(
        self,
    ) -> CodepipelineTriggerGitConfigurationPushFilePathsOutputReference:
        return typing.cast(CodepipelineTriggerGitConfigurationPushFilePathsOutputReference, jsii.get(self, "filePaths"))

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> "CodepipelineTriggerGitConfigurationPushTagsOutputReference":
        return typing.cast("CodepipelineTriggerGitConfigurationPushTagsOutputReference", jsii.get(self, "tags"))

    @builtins.property
    @jsii.member(jsii_name="branchesInput")
    def branches_input(
        self,
    ) -> typing.Optional[CodepipelineTriggerGitConfigurationPushBranches]:
        return typing.cast(typing.Optional[CodepipelineTriggerGitConfigurationPushBranches], jsii.get(self, "branchesInput"))

    @builtins.property
    @jsii.member(jsii_name="filePathsInput")
    def file_paths_input(
        self,
    ) -> typing.Optional[CodepipelineTriggerGitConfigurationPushFilePaths]:
        return typing.cast(typing.Optional[CodepipelineTriggerGitConfigurationPushFilePaths], jsii.get(self, "filePathsInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(
        self,
    ) -> typing.Optional["CodepipelineTriggerGitConfigurationPushTags"]:
        return typing.cast(typing.Optional["CodepipelineTriggerGitConfigurationPushTags"], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineTriggerGitConfigurationPush]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineTriggerGitConfigurationPush]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineTriggerGitConfigurationPush]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6a8192eab8026aad1ea5a7870c332f83638966c63a26a2ac118876358531adc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPushTags",
    jsii_struct_bases=[],
    name_mapping={"excludes": "excludes", "includes": "includes"},
)
class CodepipelineTriggerGitConfigurationPushTags:
    def __init__(
        self,
        *,
        excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
        includes: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param excludes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.
        :param includes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__94878322f6d29430d28ff00aba31b952cdf16d97005f6858992c5401e0cb45be)
            check_type(argname="argument excludes", value=excludes, expected_type=type_hints["excludes"])
            check_type(argname="argument includes", value=includes, expected_type=type_hints["includes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if excludes is not None:
            self._values["excludes"] = excludes
        if includes is not None:
            self._values["includes"] = includes

    @builtins.property
    def excludes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.'''
        result = self._values.get("excludes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def includes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.'''
        result = self._values.get("includes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineTriggerGitConfigurationPushTags(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineTriggerGitConfigurationPushTagsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerGitConfigurationPushTagsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a75c058c519ae07b804f25dccfbb7436479257514196dbd36b9351376bea564c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExcludes")
    def reset_excludes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExcludes", []))

    @jsii.member(jsii_name="resetIncludes")
    def reset_includes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIncludes", []))

    @builtins.property
    @jsii.member(jsii_name="excludesInput")
    def excludes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "excludesInput"))

    @builtins.property
    @jsii.member(jsii_name="includesInput")
    def includes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "includesInput"))

    @builtins.property
    @jsii.member(jsii_name="excludes")
    def excludes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "excludes"))

    @excludes.setter
    def excludes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9364251d1e33d304ae6cb203419f4f2b586ffc7bb61a25969d2aa58855b1974)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "excludes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="includes")
    def includes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "includes"))

    @includes.setter
    def includes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9aa7c4b08d16be8a8c56caa8c01797f45cb2c890136d4945e2c420b31fc402c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "includes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[CodepipelineTriggerGitConfigurationPushTags]:
        return typing.cast(typing.Optional[CodepipelineTriggerGitConfigurationPushTags], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[CodepipelineTriggerGitConfigurationPushTags],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__91ec00f8af9a0acfc6cfa2f41d0724cbcb7ce2816731bdd645ec192c4f68ce1d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d24a8d1f55b401f86ff5a7fa4cf942ffda01138f5e2d86a35f90e43e56ca56ef)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "CodepipelineTriggerOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b1ee71502bd8fd03dcd91b3f5bf61fd360328aec62437b3fc9660db477c72a4)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineTriggerOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0eb2e8813ef08d1376175e624a8e795ef4955ee9bddb835bb2dcd39d7ccc27b4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e4aa819c542db0acc2c4bbace4ebea5f1b59fe76841fb79136e06fab6fa9bb97)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b670c0674cad95720598866640b099cd0a6745fc3f9b0a864b024615abd1313a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineTrigger]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineTrigger]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineTrigger]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d088f8b43b06b9f0070d06f6a3b8a27ba1decdcacf2120d9a21367a1d43d8ab3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineTriggerOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineTriggerOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7be05077349aff93e07007825b713c9a972cea589a317d0b5df6d465290bfcef)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putGitConfiguration")
    def put_git_configuration(
        self,
        *,
        source_action_name: builtins.str,
        pull_request: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineTriggerGitConfigurationPullRequest, typing.Dict[builtins.str, typing.Any]]]]] = None,
        push: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineTriggerGitConfigurationPush, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param source_action_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#source_action_name Codepipeline#source_action_name}.
        :param pull_request: pull_request block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#pull_request Codepipeline#pull_request}
        :param push: push block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#push Codepipeline#push}
        '''
        value = CodepipelineTriggerGitConfiguration(
            source_action_name=source_action_name, pull_request=pull_request, push=push
        )

        return typing.cast(None, jsii.invoke(self, "putGitConfiguration", [value]))

    @builtins.property
    @jsii.member(jsii_name="gitConfiguration")
    def git_configuration(self) -> CodepipelineTriggerGitConfigurationOutputReference:
        return typing.cast(CodepipelineTriggerGitConfigurationOutputReference, jsii.get(self, "gitConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="gitConfigurationInput")
    def git_configuration_input(
        self,
    ) -> typing.Optional[CodepipelineTriggerGitConfiguration]:
        return typing.cast(typing.Optional[CodepipelineTriggerGitConfiguration], jsii.get(self, "gitConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="providerTypeInput")
    def provider_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "providerTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="providerType")
    def provider_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "providerType"))

    @provider_type.setter
    def provider_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__257066e4b18a0f8334d1e1f8e0441c60b8cb262df22231ac47752c9546a66fd2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "providerType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineTrigger]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineTrigger]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineTrigger]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8d86eccf8a62244e41efa9608e82ab3762ca5c07004d0c24b62c45157a5ea2f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.codepipeline.CodepipelineVariable",
    jsii_struct_bases=[],
    name_mapping={
        "name": "name",
        "default_value": "defaultValue",
        "description": "description",
    },
)
class CodepipelineVariable:
    def __init__(
        self,
        *,
        name: builtins.str,
        default_value: typing.Optional[builtins.str] = None,
        description: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.
        :param default_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#default_value Codepipeline#default_value}.
        :param description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#description Codepipeline#description}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b604f00f438fc4b5281f0f873c1eddc385c0c114807d51e0c5b0f59540051871)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument default_value", value=default_value, expected_type=type_hints["default_value"])
            check_type(argname="argument description", value=description, expected_type=type_hints["description"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
        }
        if default_value is not None:
            self._values["default_value"] = default_value
        if description is not None:
            self._values["description"] = description

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def default_value(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#default_value Codepipeline#default_value}.'''
        result = self._values.get("default_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#description Codepipeline#description}.'''
        result = self._values.get("description")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CodepipelineVariable(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CodepipelineVariableList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineVariableList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8c0e2a33a04cf9f480c40f83b6f10159072ddef064921698ffbc0e3dc716edf8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "CodepipelineVariableOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b9d22a8c2438b22a0199780de9e06f70e00597dffd842de9e43d83942e52d6a1)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CodepipelineVariableOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a5cef23eccddc5313f5d0a42305076ee4ec3e318376888c78ebb89133d07ef2a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__f67e666ae531b995374e6f36bdaa79d06f4e315a273d54454eec1807da024efe)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2736572ca3c4bd10607c794f6fe6a09b1fbf18fdca8aaac98053adbfe5e5ad62)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineVariable]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineVariable]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineVariable]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c72b0f7a7b112b29ddb448db74eba8079cde55aacb66d68de0432d1991e09bc8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CodepipelineVariableOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.codepipeline.CodepipelineVariableOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7db1258d33b0d8199cb84b931510478ad79f364645985e3d96e1d64c6b406afa)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetDefaultValue")
    def reset_default_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultValue", []))

    @jsii.member(jsii_name="resetDescription")
    def reset_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDescription", []))

    @builtins.property
    @jsii.member(jsii_name="defaultValueInput")
    def default_value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultValueInput"))

    @builtins.property
    @jsii.member(jsii_name="descriptionInput")
    def description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "descriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultValue")
    def default_value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultValue"))

    @default_value.setter
    def default_value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6a7d0d1e7794f412bb611e4a1434427882b7f1a39ebcaaed48f2c2859786ae83)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="description")
    def description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "description"))

    @description.setter
    def description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__495d8cff2828683181bb348824c98419119449fc1843afb062426442de5acaca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "description", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0eccf4f8b9e57c958bbf266f0f142d811834e4d9e8b6baf3650a5db381c6ed8f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineVariable]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineVariable]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineVariable]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__598b5439925764e05932551017c7c0758db32a324a547c2870d9ee5e2554db78)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Codepipeline",
    "CodepipelineArtifactStore",
    "CodepipelineArtifactStoreEncryptionKey",
    "CodepipelineArtifactStoreEncryptionKeyOutputReference",
    "CodepipelineArtifactStoreList",
    "CodepipelineArtifactStoreOutputReference",
    "CodepipelineConfig",
    "CodepipelineStage",
    "CodepipelineStageAction",
    "CodepipelineStageActionList",
    "CodepipelineStageActionOutputReference",
    "CodepipelineStageBeforeEntry",
    "CodepipelineStageBeforeEntryCondition",
    "CodepipelineStageBeforeEntryConditionOutputReference",
    "CodepipelineStageBeforeEntryConditionRule",
    "CodepipelineStageBeforeEntryConditionRuleList",
    "CodepipelineStageBeforeEntryConditionRuleOutputReference",
    "CodepipelineStageBeforeEntryConditionRuleRuleTypeId",
    "CodepipelineStageBeforeEntryConditionRuleRuleTypeIdOutputReference",
    "CodepipelineStageBeforeEntryOutputReference",
    "CodepipelineStageList",
    "CodepipelineStageOnFailure",
    "CodepipelineStageOnFailureCondition",
    "CodepipelineStageOnFailureConditionOutputReference",
    "CodepipelineStageOnFailureConditionRule",
    "CodepipelineStageOnFailureConditionRuleList",
    "CodepipelineStageOnFailureConditionRuleOutputReference",
    "CodepipelineStageOnFailureConditionRuleRuleTypeId",
    "CodepipelineStageOnFailureConditionRuleRuleTypeIdOutputReference",
    "CodepipelineStageOnFailureOutputReference",
    "CodepipelineStageOnFailureRetryConfiguration",
    "CodepipelineStageOnFailureRetryConfigurationOutputReference",
    "CodepipelineStageOnSuccess",
    "CodepipelineStageOnSuccessCondition",
    "CodepipelineStageOnSuccessConditionOutputReference",
    "CodepipelineStageOnSuccessConditionRule",
    "CodepipelineStageOnSuccessConditionRuleList",
    "CodepipelineStageOnSuccessConditionRuleOutputReference",
    "CodepipelineStageOnSuccessConditionRuleRuleTypeId",
    "CodepipelineStageOnSuccessConditionRuleRuleTypeIdOutputReference",
    "CodepipelineStageOnSuccessOutputReference",
    "CodepipelineStageOutputReference",
    "CodepipelineTrigger",
    "CodepipelineTriggerAll",
    "CodepipelineTriggerAllGitConfiguration",
    "CodepipelineTriggerAllGitConfigurationList",
    "CodepipelineTriggerAllGitConfigurationOutputReference",
    "CodepipelineTriggerAllGitConfigurationPullRequest",
    "CodepipelineTriggerAllGitConfigurationPullRequestBranches",
    "CodepipelineTriggerAllGitConfigurationPullRequestBranchesList",
    "CodepipelineTriggerAllGitConfigurationPullRequestBranchesOutputReference",
    "CodepipelineTriggerAllGitConfigurationPullRequestFilePaths",
    "CodepipelineTriggerAllGitConfigurationPullRequestFilePathsList",
    "CodepipelineTriggerAllGitConfigurationPullRequestFilePathsOutputReference",
    "CodepipelineTriggerAllGitConfigurationPullRequestList",
    "CodepipelineTriggerAllGitConfigurationPullRequestOutputReference",
    "CodepipelineTriggerAllGitConfigurationPush",
    "CodepipelineTriggerAllGitConfigurationPushBranches",
    "CodepipelineTriggerAllGitConfigurationPushBranchesList",
    "CodepipelineTriggerAllGitConfigurationPushBranchesOutputReference",
    "CodepipelineTriggerAllGitConfigurationPushFilePaths",
    "CodepipelineTriggerAllGitConfigurationPushFilePathsList",
    "CodepipelineTriggerAllGitConfigurationPushFilePathsOutputReference",
    "CodepipelineTriggerAllGitConfigurationPushList",
    "CodepipelineTriggerAllGitConfigurationPushOutputReference",
    "CodepipelineTriggerAllGitConfigurationPushTags",
    "CodepipelineTriggerAllGitConfigurationPushTagsList",
    "CodepipelineTriggerAllGitConfigurationPushTagsOutputReference",
    "CodepipelineTriggerAllList",
    "CodepipelineTriggerAllOutputReference",
    "CodepipelineTriggerGitConfiguration",
    "CodepipelineTriggerGitConfigurationOutputReference",
    "CodepipelineTriggerGitConfigurationPullRequest",
    "CodepipelineTriggerGitConfigurationPullRequestBranches",
    "CodepipelineTriggerGitConfigurationPullRequestBranchesOutputReference",
    "CodepipelineTriggerGitConfigurationPullRequestFilePaths",
    "CodepipelineTriggerGitConfigurationPullRequestFilePathsOutputReference",
    "CodepipelineTriggerGitConfigurationPullRequestList",
    "CodepipelineTriggerGitConfigurationPullRequestOutputReference",
    "CodepipelineTriggerGitConfigurationPush",
    "CodepipelineTriggerGitConfigurationPushBranches",
    "CodepipelineTriggerGitConfigurationPushBranchesOutputReference",
    "CodepipelineTriggerGitConfigurationPushFilePaths",
    "CodepipelineTriggerGitConfigurationPushFilePathsOutputReference",
    "CodepipelineTriggerGitConfigurationPushList",
    "CodepipelineTriggerGitConfigurationPushOutputReference",
    "CodepipelineTriggerGitConfigurationPushTags",
    "CodepipelineTriggerGitConfigurationPushTagsOutputReference",
    "CodepipelineTriggerList",
    "CodepipelineTriggerOutputReference",
    "CodepipelineVariable",
    "CodepipelineVariableList",
    "CodepipelineVariableOutputReference",
]

publication.publish()

def _typecheckingstub__2ad46fd509624cf0a68c0e356ae0858b1bafd007af00ebb1101a341237a0d822(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    artifact_store: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineArtifactStore, typing.Dict[builtins.str, typing.Any]]]],
    name: builtins.str,
    role_arn: builtins.str,
    stage: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStage, typing.Dict[builtins.str, typing.Any]]]],
    execution_mode: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    pipeline_type: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    trigger: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineTrigger, typing.Dict[builtins.str, typing.Any]]]]] = None,
    variable: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineVariable, typing.Dict[builtins.str, typing.Any]]]]] = None,
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

def _typecheckingstub__304e03ea12365865bb80795782fb58dd33400f444e06bc8a67752a4af0dea513(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3efb0ddfc16e04bed203330a2084771d00daa206d841fb46a3e456c0f0d67513(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineArtifactStore, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__80f2c777f9e4cc2de83de9e99948a910f19376cf1615a29e7c53dfd8e4d159d9(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStage, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7ce5b7c0560422303cca8f7f9756beac3399b37d630fda8a79024677a497d71(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineTrigger, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__799dc5f49e741bbf32ed9f9b1ee0e5c6a43c2f43b0a47143e5ead7a3d5a4566e(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineVariable, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb77d93eaa8a05aad4cd0985c19b0f5c9dd115e53b9c3bf8225405084fa4e8c7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f79a1776adff5e33b0ea0eccac34e3df6279007ecf1a70452649291608b7763e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7cd3a6703f95ef4f2c2c397dd953322ba40a9209daf91a1c4c80eef94dc65f19(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__abe8b94fac7af4b83ab597f09e90dfcfd831e9e1bdf9b5f0bd07b8db2e1e9e34(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8883e8eaa65bcc72ffb6e046c4a12e9be03dc35d3b91e6b1502cbf52b9f37584(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd708da94bc3e564887dc2e5c1c327041ab7fd1fc415dd59048da3a34763fdf7(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cfcced71e877177664e95367cb27c7fd6bb372839f10fd3c48a98135866c2a09(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9b0ad9df7c80d1aa751c0fcde44cccc99bb242d0bfb0705187e78be5de70c38(
    *,
    location: builtins.str,
    type: builtins.str,
    encryption_key: typing.Optional[typing.Union[CodepipelineArtifactStoreEncryptionKey, typing.Dict[builtins.str, typing.Any]]] = None,
    region: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f83106d0f0a30bae9553827bbe4e928d6a2362b4c349abd2103f0a74bfec897b(
    *,
    id: builtins.str,
    type: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1cd2947ad2c0adc4429ed892a957a16732c5bfba3acbb4b1f60ae89b550251d7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3a00d952c30a7ccfe50729b8867c16b7e86a9586461712c8105978724abb8bb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e493c46cf1729b0a5338dbf5d50f6b75853859434154bedd266443e6998ea9f6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__48a7b526fddf78d00b8c17b1459963a2f39b736cbc3c5b92100c54d1348740d4(
    value: typing.Optional[CodepipelineArtifactStoreEncryptionKey],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__deab46159a28c1fbfd70c130c7694a01372371da66f6462fe337a8a58bd5e7a1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8bf51ad8ea7ba1bcbabe913dae9c9fafb44306ded2b2de786a167856eaafb016(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f12206b3b2f66fdddbaea61a69dbeb7a97a67c040eb754efec115b5bf1ded8af(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64cafee013d58d4429673f54ec6ae80a7343029bce02eb73012d6c61d983c45c(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3d92a822c3476ba0b2ff5f1fc18ed9a5cc55dd7b57addf2e58f9f72a10aaa70(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c84952c84ecefed0d9291c6d7280259c1c33d4280c3613c2c9d522f2c92fd2e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineArtifactStore]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cffe02d39378b5a7895cb020c4e5aeb6b7f9e853dfe77a8164199b049ece4811(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0b225980d3d95d023a31f2525a266a6ee9d2c18377505baa53835ef30589259(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7389402d4a0a2804dfcd02d5f4c6016562d888d79284a67a6f138974c02678a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54dab510aae659fd3b9c46784cbad01123ac94f1e3138c31a124d44452d8766e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0da888bf2b87ec48ab683c09fdc0649699002733c518d612a9899954ff1a7436(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineArtifactStore]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ac1342b23afce72f94b7b56d06e6fbb231ceacc44011d47e3767a6add1bb3c9(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    artifact_store: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineArtifactStore, typing.Dict[builtins.str, typing.Any]]]],
    name: builtins.str,
    role_arn: builtins.str,
    stage: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStage, typing.Dict[builtins.str, typing.Any]]]],
    execution_mode: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    pipeline_type: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    trigger: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineTrigger, typing.Dict[builtins.str, typing.Any]]]]] = None,
    variable: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineVariable, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8d38e0b287cc54b0587000888c9c5a7d2e66506c0a18168455544994ff5e6f0(
    *,
    action: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStageAction, typing.Dict[builtins.str, typing.Any]]]],
    name: builtins.str,
    before_entry: typing.Optional[typing.Union[CodepipelineStageBeforeEntry, typing.Dict[builtins.str, typing.Any]]] = None,
    on_failure: typing.Optional[typing.Union[CodepipelineStageOnFailure, typing.Dict[builtins.str, typing.Any]]] = None,
    on_success: typing.Optional[typing.Union[CodepipelineStageOnSuccess, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68627bccc6347d38cace0c4c9ff82c69758dbbd3b049be33c87e95a687583976(
    *,
    category: builtins.str,
    name: builtins.str,
    owner: builtins.str,
    provider: builtins.str,
    version: builtins.str,
    configuration: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    input_artifacts: typing.Optional[typing.Sequence[builtins.str]] = None,
    namespace: typing.Optional[builtins.str] = None,
    output_artifacts: typing.Optional[typing.Sequence[builtins.str]] = None,
    region: typing.Optional[builtins.str] = None,
    role_arn: typing.Optional[builtins.str] = None,
    run_order: typing.Optional[jsii.Number] = None,
    timeout_in_minutes: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8fc841ce15287e39920df4f564fee9ea9e4eb54c619b717c4c408249e8816a69(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f2a6e2c8664f781c4271628a0c96a05a9716ecf172190bbd892ec2f129969ee0(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84358c52e51d392668ef7d8864fada863d5443fc129fd55af9f9360221876389(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88351940cf178d50480b8d0d3bd24fc12a7f1571c143862f682f55526c3099ff(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae09995d308ef34ebdb481710967e0e34dcf53a5251a178ef55a4eddec1b2cbc(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b356e81d9c5b670692f6f5b136becfceca5665841bc254bb777c2f9b94022fad(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageAction]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf1339f41cfa2454d6bf7bfd7fd8c7cd280c73c2d0e700e044b09d3afcf992a6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e6ee92de88b7a635f0c792f49172be769b2696b69015e7675d333f9f1135ec0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c5d7b160041020378365d6707b73a1ba8e4bc5d613f249c26a2078b31aa7e6f9(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9aa6ece13732d0c6756bafd88bd9c36c578ccdb57f5071740fd00fb0fc8ca8b(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__834bbdf90c8cb059b8e9f9cc5360fa1a8ce584eb81ddd670fdaabe4816ee3a5d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a93f741455c30ac2b1647cbfad9d4c4e7cf6fa53c4de33821c99268250d883c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1110893c540fec833d7524ec8d69bce179139bbddc0682cbfc7a0f777f9e5c48(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b2877be73f5fbccf1fc953fa9e1977312983f5d486115fe1d52949980e03f91(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__421f495ddd8902bb9edf8c1be1eeeaec55bef70aca35fdec51c03cd72ca6ca22(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6ba122a1727ae5af428eb1d6525ea89cfc6998fb2b7a151671edfc0429e2e4d5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21efe62e91fd51c39818e93941d713b44fd5679bdc5cd29ef782251f2479f1d2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f240c171926e6ca32e867f8f75d2d7438c40b2e17b79f588aaa062f8b56f32f(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf525eaf45e834e81157d7f170f9fa9af65c60df3d70e3b2aeaec1ba6c440704(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a423f9e5c2d2606dd0d361d0223c363f768530acd577fc1694f08e232ad6476(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4315fffd4a893a63bb2a3fef462f2003971a2453486b876ee35aece6e03208bd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageAction]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__305752f8346504fa9358d381d1fa6868a4942abc1ab1727d53bda2ab6ae98734(
    *,
    condition: typing.Union[CodepipelineStageBeforeEntryCondition, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ae3de3529dad86ab16036392b68b5eefd924135361028cf65252c11344597e0(
    *,
    rule: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStageBeforeEntryConditionRule, typing.Dict[builtins.str, typing.Any]]]],
    result: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be9ef2ab5325ee380c06abed27d04fe027a7f91cd4caadd57e6fe945dadbf581(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c9986e733fa8948931cb481f8abd5757606a3ce3cef012ba62176276fe54c2e(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStageBeforeEntryConditionRule, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc20db62640a9d0e04f254b20827ebc63bd5a0c911f44ab4ebd6eaaee47f5e01(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b0cc1bf5191394e90030cd58afbe657a99d8d523f1e5b99e4ae436a659cfba7(
    value: typing.Optional[CodepipelineStageBeforeEntryCondition],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3144b6322ec605fed9dd93a563e296b7e0373a8faac9be64529084162e4b2993(
    *,
    name: builtins.str,
    rule_type_id: typing.Union[CodepipelineStageBeforeEntryConditionRuleRuleTypeId, typing.Dict[builtins.str, typing.Any]],
    commands: typing.Optional[typing.Sequence[builtins.str]] = None,
    configuration: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    input_artifacts: typing.Optional[typing.Sequence[builtins.str]] = None,
    region: typing.Optional[builtins.str] = None,
    role_arn: typing.Optional[builtins.str] = None,
    timeout_in_minutes: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2d0c11591cc97df34e2148f95c4b76a7b6577c23525d5a1c738203d20fff1f6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__befe523658a8fec21e33f1096fa880df98190cef25e27a9e5207f28284ef5f25(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d354caf02cd75798afc1459427e653cbdf4e7a3b44654b2cd817f4bc5150cea(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15f21acd71c9eeb693f9ce2b61f0e82a4592ecbd18b38d050975b19bbd6f7bbd(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d97adc2fc69a9614c4d83b861cc82728a4d555508bc47d4fb43c715fb358504(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__13c3a32c3b9c1336904399832ffa8f1a56283ebe332327ca4f7fd49d681e155b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageBeforeEntryConditionRule]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__038e81a4674591e9e6d7fb1758aa3d26d5c337de96b8a5551683ba8e2c58316e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b30d80f7c669660c67a90f9b7a77a771cf89e3fec6e98db28136e8e8051332f2(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f91244009afbb4d086062249cc1858f68d3f7e00d435709b78d8a4c9e0dc328f(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96e7b8df75fb0b9e172c189500a5335595cd856dd7884624ec96f5607d74ad47(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc58fd5812672bb1620cbe4644e6b2b07a1cb42047617273cf79a968347e1f3a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b17411a810105a64d247abc331434c84b7bb44a50f9ec7632da4422a6215a0d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b420475c99822f7b5caa1e0ff9cdcdc9dc3e6ec6e05e5dc9a7504152d38f1044(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c5e95ad8631beedcf0493b7cb7b3762f5c6b9c8621f7d8d60c02c719553b704(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fa92ba2ebc10f62b5d42d54eabfc4c1f3af8c81e497e2eaad0ebcdaaa38fac90(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageBeforeEntryConditionRule]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c90c29d85496eafe5621de31faafc2e47bb7668a5161068dde721f615d6d73f6(
    *,
    category: builtins.str,
    provider: builtins.str,
    owner: typing.Optional[builtins.str] = None,
    version: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e9a2b047abaef207067ac9b26d76d70f2cd49123731c701b4d6e797a920eaadd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3027809d8d1f01bcb0d12145cd8fa59b8e3394bbab03794157594dadfb55e1f3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e84c4a09df791ff2ae252b4e790e544fbf070d02d37c8e6626c54d19904eb83(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd44dd173e9a32ce6fb9f999a507197f499629caf2a407bb351378b4418698a4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee41ec4151d805766e684bb22786274d70e74562c981258be48686ad7fa43220(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b96b83b5926dd815018eb42b6ccd6555f336c714dd8be8950598235c912c7502(
    value: typing.Optional[CodepipelineStageBeforeEntryConditionRuleRuleTypeId],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b6e69a00cd7fbab8d94d14304f8b1422516618542d1a6df7c907adaf37ae093(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0a19eaba425d65bc8f4d93a524b0e2329f7ed67325e056ace256aae112e676d(
    value: typing.Optional[CodepipelineStageBeforeEntry],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37497c60c10a7e7f6ea65db8aec59def1c9bb7db0f05160f0c6e5766b3ca9251(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fa4e849bd7fe7fcbf592ef10bfb378e70b7d741b1e1de2d02147a3aa6a645364(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15ac29d91330dff83e6c449b3241651f66ecc5c1dd16bcdc553e31f3bb7b6ef5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c95ae07c633cbf9974a5277b3b9da98960a2e919044345839d2dd13e882b940(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98fb871841ee1a3955253faa5705e3ca8455a14306b638ff77f9fbdb466c8719(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__934f040330682c7908651a2753da6c3a39ee5bc7d0dec2bf8f4ee597265be796(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStage]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__19d83f31ebb1adb4debf34dbc7ca4e5a24db98247ac3f9982d20ea477d68f8de(
    *,
    condition: typing.Optional[typing.Union[CodepipelineStageOnFailureCondition, typing.Dict[builtins.str, typing.Any]]] = None,
    result: typing.Optional[builtins.str] = None,
    retry_configuration: typing.Optional[typing.Union[CodepipelineStageOnFailureRetryConfiguration, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2feeeeddadadb569a745aa96ad03a6e49f47a193f480fdbbcea11bcd97faac57(
    *,
    rule: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStageOnFailureConditionRule, typing.Dict[builtins.str, typing.Any]]]],
    result: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__df7baf79240fe2ea70ebf8c07a9eabf69181a203bfa565f62471765e4bd628d3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c812f9c9e82ae46807972c5b97d4449d4d35cd0fd201c35fd2a090c0d0dacb4e(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStageOnFailureConditionRule, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eff81378455c60f2494916d6b5971842f3ceb297f9a8b300fa3130b4b7c5b78f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6710899b6d898987bb9702ecd00174096e9c7b7f49cb42770e2616b2af6ee686(
    value: typing.Optional[CodepipelineStageOnFailureCondition],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd9a75d5d126f369c474ae7266e7155e5dfae2867d8f0dd4b1d9157010ac30f4(
    *,
    name: builtins.str,
    rule_type_id: typing.Union[CodepipelineStageOnFailureConditionRuleRuleTypeId, typing.Dict[builtins.str, typing.Any]],
    commands: typing.Optional[typing.Sequence[builtins.str]] = None,
    configuration: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    input_artifacts: typing.Optional[typing.Sequence[builtins.str]] = None,
    region: typing.Optional[builtins.str] = None,
    role_arn: typing.Optional[builtins.str] = None,
    timeout_in_minutes: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3afd5ee11f5f844b514adbcd103a7cacfb89a8cc407f8b766c79590899f5b59(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e5f5e975cec58380fb7b7cad5ea6b6b2a0cadd8c99c0dc0329a3dd0142415a7(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0138b5af463245c32b7d11780b758f06f4ff4c1cb00a0175db4c564f7240aa19(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c23aa0903f396d7f6f6904524c673b40bb7616400d75ddc7da201d7a658f2b6(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__020347509f316733b695d8a9c3757e841094f134263690a0de3d01449f61f720(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__974f61fad474e3e644fb4013af6d1eaac2312d25d247797464a1b9491312684a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageOnFailureConditionRule]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08aaaa7906f4c90eaf29fd4161905aabe5f135038cfeab1692a9c8f12c686f51(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cbb7bd79028b042a526884475ab90735da2341d226ceaddf99082130b31af4b2(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f74c7163b5c2401e7d92e5066ae629a85b5039d8d4104b23616b6ee739a5b058(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e790e517378281ebbb17ff859056c28c29b182e79f020a1a51f6b137f9ce8cda(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b8353381066dea80100599b1668dcfacbfa888a34349de964966edd268d5be4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__096b6bc3185fe14aa1a9e51ac146f9039f35c7f3c8c3133f1925f98f2e0991d3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0af25026fb5b293c2b2b26cc643574717444f7bf7afe2a8599d563e5e0e2cbac(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba149f6b790240610056ecba1ad14dc15940ffd1b882f9149d2e19f01d8b1b24(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d931fe28b79821dcec4868338e24e193223858b3b1967f144c9e12ca57038eb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageOnFailureConditionRule]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6d3ab5a1308d0557a1e20eec44b325f0e26b75af6ca408ab3f6981b8a53406b(
    *,
    category: builtins.str,
    provider: builtins.str,
    owner: typing.Optional[builtins.str] = None,
    version: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d296303113e564471faf9205496b17379749500a9f69c641cbf9670018b3d6a4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a0d76ccdf4a5dc2d16db6ed2827f0ceb7073bde094d267f438ff8eecb75fd5a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1866a4d28f3fabd077a8caa0a387cf3aac4ae72f30b99d154b6134baa2f738df(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e5cdaee4f29784adb7e2fe530429fc9db377ca02a88cf8b9557cd56295c0992(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6bbf5cddc08049bad64fa2f9520c403ae787c766c90e3c03b59862d14589224e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__792974c2a09d9810022d73fa022de62ca4b12310031837a0ec7b40a4e8c62128(
    value: typing.Optional[CodepipelineStageOnFailureConditionRuleRuleTypeId],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__834d3929ecd4d6e1a1ce0d933de5b4cfbaaf6c99e3d5eddda3931121b73a7e5f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b4eb78c7a93bb575bf5f25c6658c1d06b0fdff6488fc993d340ca88ccfc29103(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5324d4edbeb425bf9977c91a717493d4afca5d8e0fabd61a69ef9f4edbc6d0e3(
    value: typing.Optional[CodepipelineStageOnFailure],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c75c99a38b283972b1a610827747283db54a59945626b05843bab5370a85d2df(
    *,
    retry_mode: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c89c53d7f20876bce4f22b5a89be27b318078bbcb634581c60b058ad8b50fa6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc1deefad5b3d992aebc30ee881d2423d26e745597d211a593b7593d1b179e4b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__080b01be05f712ea6efadc8b98c262d34744453c23f1741e61755f1892849ed7(
    value: typing.Optional[CodepipelineStageOnFailureRetryConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75cb3b5e355656a0e1895d9938f7efa91cdb0630a5bcaeac895187d02f939d7c(
    *,
    condition: typing.Union[CodepipelineStageOnSuccessCondition, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee52cddbf6add1f2429b4dec9d38e45fb50d198e7dec949ee5708ce1bbaed4b0(
    *,
    rule: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStageOnSuccessConditionRule, typing.Dict[builtins.str, typing.Any]]]],
    result: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc3220f4ac2e38b46190e41849c8f89234776f942869339cc6cfd63b827e07be(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4a0319f30c8d0e8a8b8e6d9c0d7ee60376afcd73e5be8203dcbe41699fc06b5(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStageOnSuccessConditionRule, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__55c2770ee014fa5ef90c6abfe449d8574f1e739bb34b291bb2c14d530fd0df13(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b850b93c246d94a412cae1952857a9a130087cfcdd029d3bdc88de16555f867(
    value: typing.Optional[CodepipelineStageOnSuccessCondition],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__38186bf00c8f3cd209088b75d4fc1c7acf1a0ce9808e1cdddaa502a2f9b8ff1b(
    *,
    name: builtins.str,
    rule_type_id: typing.Union[CodepipelineStageOnSuccessConditionRuleRuleTypeId, typing.Dict[builtins.str, typing.Any]],
    commands: typing.Optional[typing.Sequence[builtins.str]] = None,
    configuration: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    input_artifacts: typing.Optional[typing.Sequence[builtins.str]] = None,
    region: typing.Optional[builtins.str] = None,
    role_arn: typing.Optional[builtins.str] = None,
    timeout_in_minutes: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b4d1b4f498470f13655688adcd4951738bbf5be37ecaaf9a721f5c3b6817215(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7abb0ca69530a587265a16fc4c57ba23f827efa432e6884bd1d4c77b509c336d(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c5a7c3a5c07b5ec58ca9c6d4932c3da06474b9212db882e368fbb729813484ef(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6b248b35bf54569385f36af18167b87339f285700e3fc1d869e2543f5122757(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be7f74befc8d943a911311fbd29bcee6e6aac3ae55a7a211ef4b6d71811f2572(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bac35d1060182d281dd9365e8f803b20f07b0172348ed682c6168dc68e73cf41(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineStageOnSuccessConditionRule]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f9a02168484ad3b765addb8a3069a319c03c10434f746db6045bdec6f65268b1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fad42c9570596781b9d2bbc3109e083f009ff91ba7b60c70fa16d818ffa30999(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb815416528c8cb7b55692b262b74b983771b477241759a785106142a5712af3(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__06cf9f50eb47449c81e6b862342c0557b660fcd4f50a120bfe6ee50c80875996(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b081b0d4eb3de677dc9efb923ced5f4478c7ebbf9214cd41617ff79276fc76d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00365b4d8afc4e9da53ba47d0c637493c653a61879ba904e44d1ecd958c430cc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75e1765df28cbbfb49876b8d8fa8dbe2d2c42f23966dbc4059da1e4fec418151(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6be9386e0201704428dc3c5eaaa0f5932d62972ca91d9b887445cf8686f4287d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__648d888a6b1486ff03c78abdd84ce0cb8c9059db8d196acfcbb1aa6a9168fd7a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStageOnSuccessConditionRule]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e9eaa1b6db69ebd71e3df1763356491ad72034bdcd987d368cd8e60a0e524090(
    *,
    category: builtins.str,
    provider: builtins.str,
    owner: typing.Optional[builtins.str] = None,
    version: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d68da6fe4fceedc67b7807e84d8659fc501ae0237a4bdd8d8489c9d26a96f97c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62166c244a296218caac1fdffe6385b956cebeb6833702850821c6436cb0d1cc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bbd99cc5f34e80426cf04dce7a6ac8cfcdcd977fe68b7ced12e5e12d1a8cd3f1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30c30f80e4f9ecd8301e882e608317013e5fb4e0a3f5f82926cb7e67383191a6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__938a029859614f568abf2cbf5d89f31891d1ed1440c46051ee83e15cab8168f0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3940b84c6e9bed4b90520fe8b584fcfc202a84705459b8baa6d79d2f905fa259(
    value: typing.Optional[CodepipelineStageOnSuccessConditionRuleRuleTypeId],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e301ef08917ca121ab28ace65efe49f8bffef476e929d6cd5cfed81924f055ee(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea38946de1e827e7eb2825aabc3a308ce9980338474a801b622ec5dfeb108c6a(
    value: typing.Optional[CodepipelineStageOnSuccess],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f4fc3bd50b8f77498431457705810f39ea37a25ab394ed92f95ea0f9facf77d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2b46f78190b72f2463d2c08f455c1f7cd3ab581edb123c37668d22c9f2e025c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineStageAction, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37c54a798f9228627d7a761ff254b08bf34cebaed9338a2b695b94ab2470fe8e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73ad13e302cbac040d55ea9365200ecbbb89488380d671d8148ee175c14e3ef9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineStage]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4459faa89b8b2aa641374e3f9b12aec18d49ce8b816ebe6f7ec0160afcf06897(
    *,
    git_configuration: typing.Union[CodepipelineTriggerGitConfiguration, typing.Dict[builtins.str, typing.Any]],
    provider_type: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4cb1421f3537cb266f5bbd949a0caf5a9217869c5fcd65d605da4f4818126b55(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1cf7419a1270e617de37985bc2fd0f21066eb31bd7e1ed6616f61cc53a8d7e7d(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7153a58f36ce3de4b14bacf47b112260253f60dc8965d5dd1f2590ffabc49a7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__80c6eb4dda1fc8cff5a96fef79a9f99b44e9641927dba65750c3eb80034d4fbb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b16e5a306106e1720c0f5f87ca56729de01525b8349d9d5450e42b671a67b5d2(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e363535880782d4576508ca77267fda4cd8a96aae2373a12f4b85988e4e34a7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__846267f38227ea80e4c16a410dc8c890c9e892668853b3d6cbe86134d10a940e(
    value: typing.Optional[CodepipelineTriggerAllGitConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca2a2eb9e4befb5b896cb3e439d04df7c408bd6fec88a729e21374fb72ce896b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8eedc84d9d3e971b8d0a685760d9642ae0e62b040bace2568a5cb8666ed05362(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a4074e9f2bf3f6f347be408f14b4b3d3a99cc7ee8fcf63a5901687b88945c6b1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b5fa049e1fab0dd01f75b328e6ac35fd09945729c84fbf7f638d3edbe8c2ffbc(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__324cf30e8487598dfcf984839cef5e6402c4824fc934caadcd47758d5c23b0c3(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7cd4045eed129c9a531f24cb0459bbf3d5f2db6bba0f8c8db0a09fd728df9736(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0a95abe637140d763b40c8ccc290b6e1f54f238a650a2ec238fcd63f0aee8ec(
    value: typing.Optional[CodepipelineTriggerAllGitConfigurationPullRequestBranches],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cf9e49c13f5a13d833db76a557b22e3ccd95274fc1de4260d65f2e6f275ff71a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90ecc838209c9bfe167ee7a46765ec62e4c9ae512c91a2ca7091c421970a8e97(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6bb2d188f8858810c75f9d52bc19c1ea01fb156c2dd78f5e5ee2753dd9f69d8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b09c87bf8e89a29afe38b249e3331f6a476dc0e636367cb3f53bbcc9cf6249bb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8cc56cf7ba5940559da6727458dc500564cf79d7b92d8255c7a8aa8b52ac3b2(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d03c0aacc349f8b60a810fc63bfaa458b5d09243cc1d4a5e8d64821d16275630(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79b5ec7b44acc7291d9599f30995e971f366b4c2fff7d6088cddf41d59998b08(
    value: typing.Optional[CodepipelineTriggerAllGitConfigurationPullRequestFilePaths],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f5ef46b5aeb233aa91a4133a6696d53ccbd85664b7d0689e45fb97449215432(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a43393bfc7ae8b03e2f73b1d0542a794b97538854e5de5d1c6b294a1486610ff(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3d86a668e1b09ef5ce6de12de032ff7f373ff4232ba01aaf70a8b326d1e54b5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84fbea9d969cf1c208b61c0877e5cd392e8c71294b0db4c5d8770b1631390794(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e582d4d8edd39692acaafd3728da13db3714e609ffcabf6f9a247797d1fa185(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e4e4f9cd44cd626e93dbf2371022480782a44bce16c6936d311cba01bae4f2e6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6de229f550223673189e1e499760c6c88ea232e90f8002212db953760cc84b87(
    value: typing.Optional[CodepipelineTriggerAllGitConfigurationPullRequest],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__720110ac6baffe2d7b553036e34cc431d3072c17e8eaba781facf4b19430b487(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1dbe3267f2e9712133f6f151ae893dada9a83ff2f99198c01c4a523b91312559(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a49d120686eb00312f89cf9358a09d7e8077899acc15e829cf3ada3524499d54(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d446f83461102c8fe038b28c4ca3b39e0b41030a17a1d2b970c0c5a32b8f6d98(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd38ea74a505825745afd9f8730d1c0f39623f7a767e47a04ab5a201c810d3f6(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0912903d93999986ae6662d5051d01d391c49a3c22356e17893b6aa8ba83864(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6bc3f9beb7fe05e4e4d5a62e4cb41adbd723394a198e15cc4346eefeeeab8e90(
    value: typing.Optional[CodepipelineTriggerAllGitConfigurationPushBranches],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b4ad1471324cf2a9c3802e0243cc34342cd11bd25828fc01bde0f43529bba6c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__815ba006b22d86dc9ece09c0fe2f0adfbcfc8297335ba7f0c65be32f52a26518(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2031a00e929309649bc17c5149cbd718465ccb67b32ecacaf2fd404da639846(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4504caec3440680a74004415171c5008c78c14850645ee599ba032f62af77699(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__baaf4daa72d48d059ae018a26c1bf674683b6f506a5872e848a0f751cb315233(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__caabe48b412269f5436d368e09c3e70fa3e75e3bb4db20766120a8a2556c6cc3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9c5dc1ea940d8aa79c7986cef29c8f8e06c3213c036f93491f6d57603c2e6a5(
    value: typing.Optional[CodepipelineTriggerAllGitConfigurationPushFilePaths],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9608da3b15ad2dd3c422b991138fb8792e211c96ae106eae6aa16878adde9679(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e01c95961883a055fc74fff03e3045f87b940600ac3e051020f930e9c8925481(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b226dfbdeb171c092a46d943b668f57efe395cd2e8828752866a97e7590cc96d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f33dc3eb5117c9953529216f6fc3c383a232b0b7ae33e9ad94e7d221e4882d0(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__490a9a3f46e4fb77381fc6a7ba94cedfa57559e6ae48b8df524fcdad9f9f93b4(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e5d9ac5df721f376672fa91fc22dadaca9345fd29e72518494c182e1dba94a5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2ff6314eb3bbce032dd23e89fe283502a3400012981c97b5037f838e17ab507(
    value: typing.Optional[CodepipelineTriggerAllGitConfigurationPush],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7bbc61d01554c9b069a6caa7b302c90196dfa63ffe0886bf48f313462ca0ea90(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__793ac5356a28ee3caff1f35f486c7d7002b76444e3e28be5b2df86f58d6eea7c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__909a02012229a7ed2c8d97b27225d850154902114398db809c07112df07aa104(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c01b83ba8b898964813e896f21c0e6359b7b671680349062e780084d0676c176(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dff16d6ba28ef62508c8fe5451a863ace3743509e7bd08bb0a06f87a33d7e8ad(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7579ea92e74b5a0e4d0396cdf82db327b05a36df5033857ad28680c02b6d3e18(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3871215bca0e781f812ae633f2deb607d033aaa3b2be28766c37498c3f839fd4(
    value: typing.Optional[CodepipelineTriggerAllGitConfigurationPushTags],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f5e5a1785cb06fe61029526704131f3624736f57e3b8ae417e915bf300f1bbf(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88b6581fa7720b588605a4692e12e825ce10ae593bb8b996a3588fee0a740404(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7f9db50770424183743ae057636aaad2759810034d90def1402d7cf2bdf455fb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5868b3e1cdc84330798c965c783a57e8dbde1e44c36e65d293ad68100f2c7f79(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc20afd259fc351c9951b79be7a4152f0581a59aba319dc9230e2ea79036777a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00db85d84871965e288e85cdef36b61b5add1a956b89b7530ab956883dc4426a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc6bea4c051fb8f86baf0d7a7c965043991390108df85a42d0742685f4bb2d77(
    value: typing.Optional[CodepipelineTriggerAll],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__97dd1b42f84dc3b27ecec1df1546615f50a09fc542f215a74e1d5ef64558c00b(
    *,
    source_action_name: builtins.str,
    pull_request: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineTriggerGitConfigurationPullRequest, typing.Dict[builtins.str, typing.Any]]]]] = None,
    push: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineTriggerGitConfigurationPush, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__962260fd20bf2527c27fa4f800d5a9e3ff1647b86dae4c6b6557f8370b43efc2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9ef2f654706dc7ccc5e08a749a93610a573c5742b7173a8ed2d084c332caa2f2(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineTriggerGitConfigurationPullRequest, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__688716f2eb523234e1b443fd4a2a62c1a7e6e49e184b77bacff1feeb5bec89aa(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CodepipelineTriggerGitConfigurationPush, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37a3816a76526dc9ef192e006972562fea099a03b08f6614d6ebeb90dfcd2d33(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ea080ac7135e58d5d76f3a597bb4c788f44a1fde75bbaa36bdcf6763b3fbf34(
    value: typing.Optional[CodepipelineTriggerGitConfiguration],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94c9388bf5716593b3cf784c2158bf6a57f23be14b7b777bd5f2826b2499d261(
    *,
    branches: typing.Optional[typing.Union[CodepipelineTriggerGitConfigurationPullRequestBranches, typing.Dict[builtins.str, typing.Any]]] = None,
    events: typing.Optional[typing.Sequence[builtins.str]] = None,
    file_paths: typing.Optional[typing.Union[CodepipelineTriggerGitConfigurationPullRequestFilePaths, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c2b348a8a3f2a24476616a44539a2243fc0692f9baec4e37c6de696790fcd21(
    *,
    excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
    includes: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21fedb977d77c3bb74ff825e4457ce6377e27c47b3ada7925c1b834417912277(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f5f27b7b92b3347458c35601127a833fc89ab9525e5543509bee0952876f10d(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1e3b5582503cbd8d5590dc260a4488203789ee93ec4196672525d8405f80788(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__16d76cc20132d4630fbc2e7fa06a3faa9021380590951c8e2d95340b194229ff(
    value: typing.Optional[CodepipelineTriggerGitConfigurationPullRequestBranches],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1514ddc51411aa22ec3430b9b426aaff1e6dca8d2472ef7d3f725dac9810b167(
    *,
    excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
    includes: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef212aacecbe9587b0af8e1cd3fc6cedb17f3933589dd4a401463103f05a1bf4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3006133d2d5b2347b40b66eb84b121f0267ce807a560945885d7e5ab3568b33f(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__74829f5f61f58d1cf78141976f62945c04f07782c01057c2fbdef8348930bdc3(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__247002bc8fab046175d37460a27ba43a11a111c0ffce992476b2541d7ad27cbb(
    value: typing.Optional[CodepipelineTriggerGitConfigurationPullRequestFilePaths],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ea80af04657a82aea2f0e418a5f088ed42852258c05d1db84d424184b2f4c1f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5a165f6f2699269b3652d41559dfde4f08cd67cfddb5e82ff5d53e37201d560(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5bb337c49401d352aea554780b814b049b2d80c8d8185270e9fb6f416dd93166(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdb09a949f2d13a3839be78158d3318d041297d7a1a45122404210124ee02a8f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__92cb1ee75d87998a0134b7ddd78a8dc4feafbefe2b2ff5af11f9f23a51d7b114(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a4bac0f66d9fd6982af91bdb8cb2febac2acaf193ae02194ebf7ff1f0445853(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineTriggerGitConfigurationPullRequest]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d53e31246453b2d6873380cd92bc81aed811657b2b7f3d10722939379d27255(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa7f7cb8313bad98868ea46adf46403e11f5c7bceae414bfb7bd49b9209b1140(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96f2ba332f275bbb459d6413d60e470a098198f1255a93fd5cdbd3a45219fbcd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineTriggerGitConfigurationPullRequest]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9d2d99267b45bbd62ffec7bb24af75deea82556b2284a50a462e8e06149477bb(
    *,
    branches: typing.Optional[typing.Union[CodepipelineTriggerGitConfigurationPushBranches, typing.Dict[builtins.str, typing.Any]]] = None,
    file_paths: typing.Optional[typing.Union[CodepipelineTriggerGitConfigurationPushFilePaths, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Union[CodepipelineTriggerGitConfigurationPushTags, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79c824492d3f925a59de3ad92ddfe076b8a3c51bd5526028b2d9ad2b262402bf(
    *,
    excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
    includes: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ab9a3b021cc4d1ab376633fc534240b3748e555c3343d6ac8ca226ee80e9d3f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afcd4bd124b4821a34a1b72928800153c479758519df011749c6d6cdeae19944(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dfbe4842f8783210a222c3bc5217ef64d00b94ee68d5d6e5e83d989c9065e0fb(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f249da8e8a6d88538ddd95c2507bc4d3fdb6301cd3ecf5d8e583ad738a873128(
    value: typing.Optional[CodepipelineTriggerGitConfigurationPushBranches],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1ecaecec214a21479eec3268f3e3344fc16103fd22c881ad80c024b65d816e4(
    *,
    excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
    includes: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__36b8dc1c0a06083b93e9e191ddbe0b0b0610df1ef8db1dfac39dc7f6e8ae9916(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88fc49ade78f19162344614924f6429f3cb03493e2e4c007a7245249ee90020b(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23d4868777f455b8169f3c5c9f58aff7c2bdbe459ef19ed8c3252549ff9b1dee(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32ffe761f6de3f887eb3bb5746b5812a24260a569c55dfe9a582e2b35cc3ff7b(
    value: typing.Optional[CodepipelineTriggerGitConfigurationPushFilePaths],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__66fdd0ff4bc2fa5b07448b2ff4fadc20844d28af7243524540ac4f2a91b5c53d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__228ca96ad6ffdb619f33298eaacdf7634c01068dcf493d2e07e290e4ffce98c0(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7cc93b2824c7c20713d904620354be4e6fff9012a4179551a959bf27a6d7de0b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9fd999aeefac76333e4d7193fec5890069bba33157d6bd367b358da25ea6cd2d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c2c4f913a379cee8b45e0966ba50808080ccfb5e2a8cf34a2b0c3de49f6057a6(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__378cc166db21b448945281f8afb88a7ff19dc226beefa00d887ee654607deb64(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineTriggerGitConfigurationPush]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83938f41f4e94e641515c149aafaf3e01719ef2357d088e8b49def478d018d81(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6a8192eab8026aad1ea5a7870c332f83638966c63a26a2ac118876358531adc(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineTriggerGitConfigurationPush]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__94878322f6d29430d28ff00aba31b952cdf16d97005f6858992c5401e0cb45be(
    *,
    excludes: typing.Optional[typing.Sequence[builtins.str]] = None,
    includes: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a75c058c519ae07b804f25dccfbb7436479257514196dbd36b9351376bea564c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9364251d1e33d304ae6cb203419f4f2b586ffc7bb61a25969d2aa58855b1974(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9aa7c4b08d16be8a8c56caa8c01797f45cb2c890136d4945e2c420b31fc402c8(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__91ec00f8af9a0acfc6cfa2f41d0724cbcb7ce2816731bdd645ec192c4f68ce1d(
    value: typing.Optional[CodepipelineTriggerGitConfigurationPushTags],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d24a8d1f55b401f86ff5a7fa4cf942ffda01138f5e2d86a35f90e43e56ca56ef(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b1ee71502bd8fd03dcd91b3f5bf61fd360328aec62437b3fc9660db477c72a4(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0eb2e8813ef08d1376175e624a8e795ef4955ee9bddb835bb2dcd39d7ccc27b4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e4aa819c542db0acc2c4bbace4ebea5f1b59fe76841fb79136e06fab6fa9bb97(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b670c0674cad95720598866640b099cd0a6745fc3f9b0a864b024615abd1313a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d088f8b43b06b9f0070d06f6a3b8a27ba1decdcacf2120d9a21367a1d43d8ab3(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineTrigger]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7be05077349aff93e07007825b713c9a972cea589a317d0b5df6d465290bfcef(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__257066e4b18a0f8334d1e1f8e0441c60b8cb262df22231ac47752c9546a66fd2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8d86eccf8a62244e41efa9608e82ab3762ca5c07004d0c24b62c45157a5ea2f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineTrigger]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b604f00f438fc4b5281f0f873c1eddc385c0c114807d51e0c5b0f59540051871(
    *,
    name: builtins.str,
    default_value: typing.Optional[builtins.str] = None,
    description: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c0e2a33a04cf9f480c40f83b6f10159072ddef064921698ffbc0e3dc716edf8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9d22a8c2438b22a0199780de9e06f70e00597dffd842de9e43d83942e52d6a1(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5cef23eccddc5313f5d0a42305076ee4ec3e318376888c78ebb89133d07ef2a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f67e666ae531b995374e6f36bdaa79d06f4e315a273d54454eec1807da024efe(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2736572ca3c4bd10607c794f6fe6a09b1fbf18fdca8aaac98053adbfe5e5ad62(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c72b0f7a7b112b29ddb448db74eba8079cde55aacb66d68de0432d1991e09bc8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CodepipelineVariable]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7db1258d33b0d8199cb84b931510478ad79f364645985e3d96e1d64c6b406afa(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6a7d0d1e7794f412bb611e4a1434427882b7f1a39ebcaaed48f2c2859786ae83(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__495d8cff2828683181bb348824c98419119449fc1843afb062426442de5acaca(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0eccf4f8b9e57c958bbf266f0f142d811834e4d9e8b6baf3650a5db381c6ed8f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__598b5439925764e05932551017c7c0758db32a324a547c2870d9ee5e2554db78(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CodepipelineVariable]],
) -> None:
    """Type checking stubs"""
    pass
