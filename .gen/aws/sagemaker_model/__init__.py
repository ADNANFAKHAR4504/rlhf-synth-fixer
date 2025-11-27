r'''
# `aws_sagemaker_model`

Refer to the Terraform Registry for docs: [`aws_sagemaker_model`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model).
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


class SagemakerModel(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModel",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model aws_sagemaker_model}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        execution_role_arn: builtins.str,
        container: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerModelContainer", typing.Dict[builtins.str, typing.Any]]]]] = None,
        enable_network_isolation: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        id: typing.Optional[builtins.str] = None,
        inference_execution_config: typing.Optional[typing.Union["SagemakerModelInferenceExecutionConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        primary_container: typing.Optional[typing.Union["SagemakerModelPrimaryContainer", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        vpc_config: typing.Optional[typing.Union["SagemakerModelVpcConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model aws_sagemaker_model} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param execution_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#execution_role_arn SagemakerModel#execution_role_arn}.
        :param container: container block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#container SagemakerModel#container}
        :param enable_network_isolation: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#enable_network_isolation SagemakerModel#enable_network_isolation}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#id SagemakerModel#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param inference_execution_config: inference_execution_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#inference_execution_config SagemakerModel#inference_execution_config}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#name SagemakerModel#name}.
        :param primary_container: primary_container block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#primary_container SagemakerModel#primary_container}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#tags SagemakerModel#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#tags_all SagemakerModel#tags_all}.
        :param vpc_config: vpc_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#vpc_config SagemakerModel#vpc_config}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b926ca41157f2c97323550521a18e84e99ce549d391c9a46d7e596d2b83ab75)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = SagemakerModelConfig(
            execution_role_arn=execution_role_arn,
            container=container,
            enable_network_isolation=enable_network_isolation,
            id=id,
            inference_execution_config=inference_execution_config,
            name=name,
            primary_container=primary_container,
            tags=tags,
            tags_all=tags_all,
            vpc_config=vpc_config,
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
        '''Generates CDKTF code for importing a SagemakerModel resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the SagemakerModel to import.
        :param import_from_id: The id of the existing SagemakerModel that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the SagemakerModel to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ef4c72949a39c43dd43da653444d35851d9b6f326bbc4a39547ebe18f33d61a0)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putContainer")
    def put_container(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerModelContainer", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e8319b1984f7e32a782c1011e55eee9d571a1008f787d8e7ce5c5c8cdc49d1e9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putContainer", [value]))

    @jsii.member(jsii_name="putInferenceExecutionConfig")
    def put_inference_execution_config(self, *, mode: builtins.str) -> None:
        '''
        :param mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#mode SagemakerModel#mode}.
        '''
        value = SagemakerModelInferenceExecutionConfig(mode=mode)

        return typing.cast(None, jsii.invoke(self, "putInferenceExecutionConfig", [value]))

    @jsii.member(jsii_name="putPrimaryContainer")
    def put_primary_container(
        self,
        *,
        container_hostname: typing.Optional[builtins.str] = None,
        environment: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        image: typing.Optional[builtins.str] = None,
        image_config: typing.Optional[typing.Union["SagemakerModelPrimaryContainerImageConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        inference_specification_name: typing.Optional[builtins.str] = None,
        mode: typing.Optional[builtins.str] = None,
        model_data_source: typing.Optional[typing.Union["SagemakerModelPrimaryContainerModelDataSource", typing.Dict[builtins.str, typing.Any]]] = None,
        model_data_url: typing.Optional[builtins.str] = None,
        model_package_name: typing.Optional[builtins.str] = None,
        multi_model_config: typing.Optional[typing.Union["SagemakerModelPrimaryContainerMultiModelConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param container_hostname: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#container_hostname SagemakerModel#container_hostname}.
        :param environment: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#environment SagemakerModel#environment}.
        :param image: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image SagemakerModel#image}.
        :param image_config: image_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image_config SagemakerModel#image_config}
        :param inference_specification_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#inference_specification_name SagemakerModel#inference_specification_name}.
        :param mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#mode SagemakerModel#mode}.
        :param model_data_source: model_data_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_source SagemakerModel#model_data_source}
        :param model_data_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_url SagemakerModel#model_data_url}.
        :param model_package_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_package_name SagemakerModel#model_package_name}.
        :param multi_model_config: multi_model_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#multi_model_config SagemakerModel#multi_model_config}
        '''
        value = SagemakerModelPrimaryContainer(
            container_hostname=container_hostname,
            environment=environment,
            image=image,
            image_config=image_config,
            inference_specification_name=inference_specification_name,
            mode=mode,
            model_data_source=model_data_source,
            model_data_url=model_data_url,
            model_package_name=model_package_name,
            multi_model_config=multi_model_config,
        )

        return typing.cast(None, jsii.invoke(self, "putPrimaryContainer", [value]))

    @jsii.member(jsii_name="putVpcConfig")
    def put_vpc_config(
        self,
        *,
        security_group_ids: typing.Sequence[builtins.str],
        subnets: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param security_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#security_group_ids SagemakerModel#security_group_ids}.
        :param subnets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#subnets SagemakerModel#subnets}.
        '''
        value = SagemakerModelVpcConfig(
            security_group_ids=security_group_ids, subnets=subnets
        )

        return typing.cast(None, jsii.invoke(self, "putVpcConfig", [value]))

    @jsii.member(jsii_name="resetContainer")
    def reset_container(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainer", []))

    @jsii.member(jsii_name="resetEnableNetworkIsolation")
    def reset_enable_network_isolation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableNetworkIsolation", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetInferenceExecutionConfig")
    def reset_inference_execution_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInferenceExecutionConfig", []))

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetPrimaryContainer")
    def reset_primary_container(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrimaryContainer", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetVpcConfig")
    def reset_vpc_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVpcConfig", []))

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
    @jsii.member(jsii_name="container")
    def container(self) -> "SagemakerModelContainerList":
        return typing.cast("SagemakerModelContainerList", jsii.get(self, "container"))

    @builtins.property
    @jsii.member(jsii_name="inferenceExecutionConfig")
    def inference_execution_config(
        self,
    ) -> "SagemakerModelInferenceExecutionConfigOutputReference":
        return typing.cast("SagemakerModelInferenceExecutionConfigOutputReference", jsii.get(self, "inferenceExecutionConfig"))

    @builtins.property
    @jsii.member(jsii_name="primaryContainer")
    def primary_container(self) -> "SagemakerModelPrimaryContainerOutputReference":
        return typing.cast("SagemakerModelPrimaryContainerOutputReference", jsii.get(self, "primaryContainer"))

    @builtins.property
    @jsii.member(jsii_name="vpcConfig")
    def vpc_config(self) -> "SagemakerModelVpcConfigOutputReference":
        return typing.cast("SagemakerModelVpcConfigOutputReference", jsii.get(self, "vpcConfig"))

    @builtins.property
    @jsii.member(jsii_name="containerInput")
    def container_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerModelContainer"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerModelContainer"]]], jsii.get(self, "containerInput"))

    @builtins.property
    @jsii.member(jsii_name="enableNetworkIsolationInput")
    def enable_network_isolation_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableNetworkIsolationInput"))

    @builtins.property
    @jsii.member(jsii_name="executionRoleArnInput")
    def execution_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "executionRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="inferenceExecutionConfigInput")
    def inference_execution_config_input(
        self,
    ) -> typing.Optional["SagemakerModelInferenceExecutionConfig"]:
        return typing.cast(typing.Optional["SagemakerModelInferenceExecutionConfig"], jsii.get(self, "inferenceExecutionConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="primaryContainerInput")
    def primary_container_input(
        self,
    ) -> typing.Optional["SagemakerModelPrimaryContainer"]:
        return typing.cast(typing.Optional["SagemakerModelPrimaryContainer"], jsii.get(self, "primaryContainerInput"))

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
    @jsii.member(jsii_name="vpcConfigInput")
    def vpc_config_input(self) -> typing.Optional["SagemakerModelVpcConfig"]:
        return typing.cast(typing.Optional["SagemakerModelVpcConfig"], jsii.get(self, "vpcConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="enableNetworkIsolation")
    def enable_network_isolation(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableNetworkIsolation"))

    @enable_network_isolation.setter
    def enable_network_isolation(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__98cba6678093db4c84f91442fdb972f496bef43edf4d1e718a0409e6b17991b2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableNetworkIsolation", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="executionRoleArn")
    def execution_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "executionRoleArn"))

    @execution_role_arn.setter
    def execution_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf24f858ca60fefb3062a10f10b4808d2d5d53f4611e5ecff5a3ab271daedbe0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "executionRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__450f2848f2b4970d619549d5e5836b3027ba59c251e5b3bfdd60815a180bb52b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b4ebfa771daaabb75f245ce5735c33b56640819668a55383b9ffac17c2ed70d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ad02ab42255bd6ef9e871159c580fd2ed842e404e8215eee21cf261336ca91c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__13cf3de26fdff32ebae45ce25d435f350ac2f77024297c36f6ea8e73aae036ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "execution_role_arn": "executionRoleArn",
        "container": "container",
        "enable_network_isolation": "enableNetworkIsolation",
        "id": "id",
        "inference_execution_config": "inferenceExecutionConfig",
        "name": "name",
        "primary_container": "primaryContainer",
        "tags": "tags",
        "tags_all": "tagsAll",
        "vpc_config": "vpcConfig",
    },
)
class SagemakerModelConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        execution_role_arn: builtins.str,
        container: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerModelContainer", typing.Dict[builtins.str, typing.Any]]]]] = None,
        enable_network_isolation: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        id: typing.Optional[builtins.str] = None,
        inference_execution_config: typing.Optional[typing.Union["SagemakerModelInferenceExecutionConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        name: typing.Optional[builtins.str] = None,
        primary_container: typing.Optional[typing.Union["SagemakerModelPrimaryContainer", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        vpc_config: typing.Optional[typing.Union["SagemakerModelVpcConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param execution_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#execution_role_arn SagemakerModel#execution_role_arn}.
        :param container: container block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#container SagemakerModel#container}
        :param enable_network_isolation: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#enable_network_isolation SagemakerModel#enable_network_isolation}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#id SagemakerModel#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param inference_execution_config: inference_execution_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#inference_execution_config SagemakerModel#inference_execution_config}
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#name SagemakerModel#name}.
        :param primary_container: primary_container block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#primary_container SagemakerModel#primary_container}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#tags SagemakerModel#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#tags_all SagemakerModel#tags_all}.
        :param vpc_config: vpc_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#vpc_config SagemakerModel#vpc_config}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(inference_execution_config, dict):
            inference_execution_config = SagemakerModelInferenceExecutionConfig(**inference_execution_config)
        if isinstance(primary_container, dict):
            primary_container = SagemakerModelPrimaryContainer(**primary_container)
        if isinstance(vpc_config, dict):
            vpc_config = SagemakerModelVpcConfig(**vpc_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ce7b4e1aa510494063e70ae7cba231f5ff48e0152c5b7e1cb4d53827e19911d)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument execution_role_arn", value=execution_role_arn, expected_type=type_hints["execution_role_arn"])
            check_type(argname="argument container", value=container, expected_type=type_hints["container"])
            check_type(argname="argument enable_network_isolation", value=enable_network_isolation, expected_type=type_hints["enable_network_isolation"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument inference_execution_config", value=inference_execution_config, expected_type=type_hints["inference_execution_config"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument primary_container", value=primary_container, expected_type=type_hints["primary_container"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument vpc_config", value=vpc_config, expected_type=type_hints["vpc_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "execution_role_arn": execution_role_arn,
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
        if container is not None:
            self._values["container"] = container
        if enable_network_isolation is not None:
            self._values["enable_network_isolation"] = enable_network_isolation
        if id is not None:
            self._values["id"] = id
        if inference_execution_config is not None:
            self._values["inference_execution_config"] = inference_execution_config
        if name is not None:
            self._values["name"] = name
        if primary_container is not None:
            self._values["primary_container"] = primary_container
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if vpc_config is not None:
            self._values["vpc_config"] = vpc_config

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
    def execution_role_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#execution_role_arn SagemakerModel#execution_role_arn}.'''
        result = self._values.get("execution_role_arn")
        assert result is not None, "Required property 'execution_role_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def container(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerModelContainer"]]]:
        '''container block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#container SagemakerModel#container}
        '''
        result = self._values.get("container")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerModelContainer"]]], result)

    @builtins.property
    def enable_network_isolation(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#enable_network_isolation SagemakerModel#enable_network_isolation}.'''
        result = self._values.get("enable_network_isolation")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#id SagemakerModel#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def inference_execution_config(
        self,
    ) -> typing.Optional["SagemakerModelInferenceExecutionConfig"]:
        '''inference_execution_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#inference_execution_config SagemakerModel#inference_execution_config}
        '''
        result = self._values.get("inference_execution_config")
        return typing.cast(typing.Optional["SagemakerModelInferenceExecutionConfig"], result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#name SagemakerModel#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def primary_container(self) -> typing.Optional["SagemakerModelPrimaryContainer"]:
        '''primary_container block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#primary_container SagemakerModel#primary_container}
        '''
        result = self._values.get("primary_container")
        return typing.cast(typing.Optional["SagemakerModelPrimaryContainer"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#tags SagemakerModel#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#tags_all SagemakerModel#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def vpc_config(self) -> typing.Optional["SagemakerModelVpcConfig"]:
        '''vpc_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#vpc_config SagemakerModel#vpc_config}
        '''
        result = self._values.get("vpc_config")
        return typing.cast(typing.Optional["SagemakerModelVpcConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelContainer",
    jsii_struct_bases=[],
    name_mapping={
        "container_hostname": "containerHostname",
        "environment": "environment",
        "image": "image",
        "image_config": "imageConfig",
        "inference_specification_name": "inferenceSpecificationName",
        "mode": "mode",
        "model_data_source": "modelDataSource",
        "model_data_url": "modelDataUrl",
        "model_package_name": "modelPackageName",
        "multi_model_config": "multiModelConfig",
    },
)
class SagemakerModelContainer:
    def __init__(
        self,
        *,
        container_hostname: typing.Optional[builtins.str] = None,
        environment: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        image: typing.Optional[builtins.str] = None,
        image_config: typing.Optional[typing.Union["SagemakerModelContainerImageConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        inference_specification_name: typing.Optional[builtins.str] = None,
        mode: typing.Optional[builtins.str] = None,
        model_data_source: typing.Optional[typing.Union["SagemakerModelContainerModelDataSource", typing.Dict[builtins.str, typing.Any]]] = None,
        model_data_url: typing.Optional[builtins.str] = None,
        model_package_name: typing.Optional[builtins.str] = None,
        multi_model_config: typing.Optional[typing.Union["SagemakerModelContainerMultiModelConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param container_hostname: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#container_hostname SagemakerModel#container_hostname}.
        :param environment: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#environment SagemakerModel#environment}.
        :param image: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image SagemakerModel#image}.
        :param image_config: image_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image_config SagemakerModel#image_config}
        :param inference_specification_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#inference_specification_name SagemakerModel#inference_specification_name}.
        :param mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#mode SagemakerModel#mode}.
        :param model_data_source: model_data_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_source SagemakerModel#model_data_source}
        :param model_data_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_url SagemakerModel#model_data_url}.
        :param model_package_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_package_name SagemakerModel#model_package_name}.
        :param multi_model_config: multi_model_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#multi_model_config SagemakerModel#multi_model_config}
        '''
        if isinstance(image_config, dict):
            image_config = SagemakerModelContainerImageConfig(**image_config)
        if isinstance(model_data_source, dict):
            model_data_source = SagemakerModelContainerModelDataSource(**model_data_source)
        if isinstance(multi_model_config, dict):
            multi_model_config = SagemakerModelContainerMultiModelConfig(**multi_model_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__abf47ed3218d093b3ea3a44755607151e4585fb9b364aba53e6e3d2ad0c880a9)
            check_type(argname="argument container_hostname", value=container_hostname, expected_type=type_hints["container_hostname"])
            check_type(argname="argument environment", value=environment, expected_type=type_hints["environment"])
            check_type(argname="argument image", value=image, expected_type=type_hints["image"])
            check_type(argname="argument image_config", value=image_config, expected_type=type_hints["image_config"])
            check_type(argname="argument inference_specification_name", value=inference_specification_name, expected_type=type_hints["inference_specification_name"])
            check_type(argname="argument mode", value=mode, expected_type=type_hints["mode"])
            check_type(argname="argument model_data_source", value=model_data_source, expected_type=type_hints["model_data_source"])
            check_type(argname="argument model_data_url", value=model_data_url, expected_type=type_hints["model_data_url"])
            check_type(argname="argument model_package_name", value=model_package_name, expected_type=type_hints["model_package_name"])
            check_type(argname="argument multi_model_config", value=multi_model_config, expected_type=type_hints["multi_model_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if container_hostname is not None:
            self._values["container_hostname"] = container_hostname
        if environment is not None:
            self._values["environment"] = environment
        if image is not None:
            self._values["image"] = image
        if image_config is not None:
            self._values["image_config"] = image_config
        if inference_specification_name is not None:
            self._values["inference_specification_name"] = inference_specification_name
        if mode is not None:
            self._values["mode"] = mode
        if model_data_source is not None:
            self._values["model_data_source"] = model_data_source
        if model_data_url is not None:
            self._values["model_data_url"] = model_data_url
        if model_package_name is not None:
            self._values["model_package_name"] = model_package_name
        if multi_model_config is not None:
            self._values["multi_model_config"] = multi_model_config

    @builtins.property
    def container_hostname(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#container_hostname SagemakerModel#container_hostname}.'''
        result = self._values.get("container_hostname")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def environment(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#environment SagemakerModel#environment}.'''
        result = self._values.get("environment")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def image(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image SagemakerModel#image}.'''
        result = self._values.get("image")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def image_config(self) -> typing.Optional["SagemakerModelContainerImageConfig"]:
        '''image_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image_config SagemakerModel#image_config}
        '''
        result = self._values.get("image_config")
        return typing.cast(typing.Optional["SagemakerModelContainerImageConfig"], result)

    @builtins.property
    def inference_specification_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#inference_specification_name SagemakerModel#inference_specification_name}.'''
        result = self._values.get("inference_specification_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#mode SagemakerModel#mode}.'''
        result = self._values.get("mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def model_data_source(
        self,
    ) -> typing.Optional["SagemakerModelContainerModelDataSource"]:
        '''model_data_source block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_source SagemakerModel#model_data_source}
        '''
        result = self._values.get("model_data_source")
        return typing.cast(typing.Optional["SagemakerModelContainerModelDataSource"], result)

    @builtins.property
    def model_data_url(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_url SagemakerModel#model_data_url}.'''
        result = self._values.get("model_data_url")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def model_package_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_package_name SagemakerModel#model_package_name}.'''
        result = self._values.get("model_package_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def multi_model_config(
        self,
    ) -> typing.Optional["SagemakerModelContainerMultiModelConfig"]:
        '''multi_model_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#multi_model_config SagemakerModel#multi_model_config}
        '''
        result = self._values.get("multi_model_config")
        return typing.cast(typing.Optional["SagemakerModelContainerMultiModelConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelContainer(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelContainerImageConfig",
    jsii_struct_bases=[],
    name_mapping={
        "repository_access_mode": "repositoryAccessMode",
        "repository_auth_config": "repositoryAuthConfig",
    },
)
class SagemakerModelContainerImageConfig:
    def __init__(
        self,
        *,
        repository_access_mode: builtins.str,
        repository_auth_config: typing.Optional[typing.Union["SagemakerModelContainerImageConfigRepositoryAuthConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param repository_access_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_access_mode SagemakerModel#repository_access_mode}.
        :param repository_auth_config: repository_auth_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_auth_config SagemakerModel#repository_auth_config}
        '''
        if isinstance(repository_auth_config, dict):
            repository_auth_config = SagemakerModelContainerImageConfigRepositoryAuthConfig(**repository_auth_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__601ff3abb00d8f8d3adb9049cbabf84e19d71213bf2ca1be350ec66c63e60dc5)
            check_type(argname="argument repository_access_mode", value=repository_access_mode, expected_type=type_hints["repository_access_mode"])
            check_type(argname="argument repository_auth_config", value=repository_auth_config, expected_type=type_hints["repository_auth_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "repository_access_mode": repository_access_mode,
        }
        if repository_auth_config is not None:
            self._values["repository_auth_config"] = repository_auth_config

    @builtins.property
    def repository_access_mode(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_access_mode SagemakerModel#repository_access_mode}.'''
        result = self._values.get("repository_access_mode")
        assert result is not None, "Required property 'repository_access_mode' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def repository_auth_config(
        self,
    ) -> typing.Optional["SagemakerModelContainerImageConfigRepositoryAuthConfig"]:
        '''repository_auth_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_auth_config SagemakerModel#repository_auth_config}
        '''
        result = self._values.get("repository_auth_config")
        return typing.cast(typing.Optional["SagemakerModelContainerImageConfigRepositoryAuthConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelContainerImageConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelContainerImageConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelContainerImageConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e090595dff892245f430d59490ca26276a4ffa65d94d0ac6f4ad5cd071e77719)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRepositoryAuthConfig")
    def put_repository_auth_config(
        self,
        *,
        repository_credentials_provider_arn: builtins.str,
    ) -> None:
        '''
        :param repository_credentials_provider_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_credentials_provider_arn SagemakerModel#repository_credentials_provider_arn}.
        '''
        value = SagemakerModelContainerImageConfigRepositoryAuthConfig(
            repository_credentials_provider_arn=repository_credentials_provider_arn
        )

        return typing.cast(None, jsii.invoke(self, "putRepositoryAuthConfig", [value]))

    @jsii.member(jsii_name="resetRepositoryAuthConfig")
    def reset_repository_auth_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRepositoryAuthConfig", []))

    @builtins.property
    @jsii.member(jsii_name="repositoryAuthConfig")
    def repository_auth_config(
        self,
    ) -> "SagemakerModelContainerImageConfigRepositoryAuthConfigOutputReference":
        return typing.cast("SagemakerModelContainerImageConfigRepositoryAuthConfigOutputReference", jsii.get(self, "repositoryAuthConfig"))

    @builtins.property
    @jsii.member(jsii_name="repositoryAccessModeInput")
    def repository_access_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "repositoryAccessModeInput"))

    @builtins.property
    @jsii.member(jsii_name="repositoryAuthConfigInput")
    def repository_auth_config_input(
        self,
    ) -> typing.Optional["SagemakerModelContainerImageConfigRepositoryAuthConfig"]:
        return typing.cast(typing.Optional["SagemakerModelContainerImageConfigRepositoryAuthConfig"], jsii.get(self, "repositoryAuthConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="repositoryAccessMode")
    def repository_access_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "repositoryAccessMode"))

    @repository_access_mode.setter
    def repository_access_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__877e63eb32273e6c7a7cb9e13eff1c4a842c962b46da26f828e8f5846ec82493)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "repositoryAccessMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[SagemakerModelContainerImageConfig]:
        return typing.cast(typing.Optional[SagemakerModelContainerImageConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerModelContainerImageConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__317e690a7479bf551048aef56cd667edfdcf3fe735779a3f616a959cf871ad32)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelContainerImageConfigRepositoryAuthConfig",
    jsii_struct_bases=[],
    name_mapping={
        "repository_credentials_provider_arn": "repositoryCredentialsProviderArn",
    },
)
class SagemakerModelContainerImageConfigRepositoryAuthConfig:
    def __init__(self, *, repository_credentials_provider_arn: builtins.str) -> None:
        '''
        :param repository_credentials_provider_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_credentials_provider_arn SagemakerModel#repository_credentials_provider_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__970bc6dce10a2d7cecfcb3c6fe7a981ead4d8d653f6d198bdfd03c53af01cbca)
            check_type(argname="argument repository_credentials_provider_arn", value=repository_credentials_provider_arn, expected_type=type_hints["repository_credentials_provider_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "repository_credentials_provider_arn": repository_credentials_provider_arn,
        }

    @builtins.property
    def repository_credentials_provider_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_credentials_provider_arn SagemakerModel#repository_credentials_provider_arn}.'''
        result = self._values.get("repository_credentials_provider_arn")
        assert result is not None, "Required property 'repository_credentials_provider_arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelContainerImageConfigRepositoryAuthConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelContainerImageConfigRepositoryAuthConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelContainerImageConfigRepositoryAuthConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ec810c0b9fe499d0896081b99807d886ceab4d808b3c0626ee1298990a48c896)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="repositoryCredentialsProviderArnInput")
    def repository_credentials_provider_arn_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "repositoryCredentialsProviderArnInput"))

    @builtins.property
    @jsii.member(jsii_name="repositoryCredentialsProviderArn")
    def repository_credentials_provider_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "repositoryCredentialsProviderArn"))

    @repository_credentials_provider_arn.setter
    def repository_credentials_provider_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b09c485adfe2a44e30e1b6f2e3c6d0674fe1745e32b2f9c7b244d2f0115e80d5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "repositoryCredentialsProviderArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerModelContainerImageConfigRepositoryAuthConfig]:
        return typing.cast(typing.Optional[SagemakerModelContainerImageConfigRepositoryAuthConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerModelContainerImageConfigRepositoryAuthConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6460770d2c98e2a824fc8e5e9155da5c2353d59e7c900deb9a611762eb580f3b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerModelContainerList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelContainerList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__54e70120c4ab321bdff0d55d85c0def63394bb200473b8e47a750f4edd48dc73)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "SagemakerModelContainerOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0305faf3c3f1a67e8ee3e7718ec855c8d9552e5d4b384488ec853adb747ef213)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerModelContainerOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea2109a46fba8089797db69ed098fdf9c88af4e5e5f4e29d7cc2facae7a2233a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__70e502139ee72d0b3147524335fa1a086d9b67497f28200de89bc8e2d8446c53)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ccc826beb9dce839ca01471cf795a2fda05015ddbf46fa2fa499ef1d5c91d1d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerModelContainer]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerModelContainer]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerModelContainer]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ae0287258236d48597998e98ef8873af9d7699f3e5e0639617fad4c00cd006f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelContainerModelDataSource",
    jsii_struct_bases=[],
    name_mapping={"s3_data_source": "s3DataSource"},
)
class SagemakerModelContainerModelDataSource:
    def __init__(
        self,
        *,
        s3_data_source: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerModelContainerModelDataSourceS3DataSource", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param s3_data_source: s3_data_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_source SagemakerModel#s3_data_source}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c49d83c50b579dff5c7fb23fa5a82056acc2863059800adc54a9fc5e1165fee5)
            check_type(argname="argument s3_data_source", value=s3_data_source, expected_type=type_hints["s3_data_source"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "s3_data_source": s3_data_source,
        }

    @builtins.property
    def s3_data_source(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerModelContainerModelDataSourceS3DataSource"]]:
        '''s3_data_source block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_source SagemakerModel#s3_data_source}
        '''
        result = self._values.get("s3_data_source")
        assert result is not None, "Required property 's3_data_source' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerModelContainerModelDataSourceS3DataSource"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelContainerModelDataSource(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelContainerModelDataSourceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelContainerModelDataSourceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bfd929ab43cc25279b53d798ed493dd4396ef4427494e5e03cd85a4526344835)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putS3DataSource")
    def put_s3_data_source(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerModelContainerModelDataSourceS3DataSource", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efd85d527d2af1316802867bb6ff6890ac9b750aff1fcba7fd7f5ec34a5ba3f9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putS3DataSource", [value]))

    @builtins.property
    @jsii.member(jsii_name="s3DataSource")
    def s3_data_source(
        self,
    ) -> "SagemakerModelContainerModelDataSourceS3DataSourceList":
        return typing.cast("SagemakerModelContainerModelDataSourceS3DataSourceList", jsii.get(self, "s3DataSource"))

    @builtins.property
    @jsii.member(jsii_name="s3DataSourceInput")
    def s3_data_source_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerModelContainerModelDataSourceS3DataSource"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerModelContainerModelDataSourceS3DataSource"]]], jsii.get(self, "s3DataSourceInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[SagemakerModelContainerModelDataSource]:
        return typing.cast(typing.Optional[SagemakerModelContainerModelDataSource], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerModelContainerModelDataSource],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9bbf597dafe0c13dc8565045ab0858eb6fcb65ddfa4c9bdbbcfb7adf391877c6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelContainerModelDataSourceS3DataSource",
    jsii_struct_bases=[],
    name_mapping={
        "compression_type": "compressionType",
        "s3_data_type": "s3DataType",
        "s3_uri": "s3Uri",
        "model_access_config": "modelAccessConfig",
    },
)
class SagemakerModelContainerModelDataSourceS3DataSource:
    def __init__(
        self,
        *,
        compression_type: builtins.str,
        s3_data_type: builtins.str,
        s3_uri: builtins.str,
        model_access_config: typing.Optional[typing.Union["SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param compression_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#compression_type SagemakerModel#compression_type}.
        :param s3_data_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_type SagemakerModel#s3_data_type}.
        :param s3_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_uri SagemakerModel#s3_uri}.
        :param model_access_config: model_access_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_access_config SagemakerModel#model_access_config}
        '''
        if isinstance(model_access_config, dict):
            model_access_config = SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig(**model_access_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3338fcc4f5560706cfa96d3c59b867ca1cfa43d844247d443b0f30a0ac5e187c)
            check_type(argname="argument compression_type", value=compression_type, expected_type=type_hints["compression_type"])
            check_type(argname="argument s3_data_type", value=s3_data_type, expected_type=type_hints["s3_data_type"])
            check_type(argname="argument s3_uri", value=s3_uri, expected_type=type_hints["s3_uri"])
            check_type(argname="argument model_access_config", value=model_access_config, expected_type=type_hints["model_access_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "compression_type": compression_type,
            "s3_data_type": s3_data_type,
            "s3_uri": s3_uri,
        }
        if model_access_config is not None:
            self._values["model_access_config"] = model_access_config

    @builtins.property
    def compression_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#compression_type SagemakerModel#compression_type}.'''
        result = self._values.get("compression_type")
        assert result is not None, "Required property 'compression_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def s3_data_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_type SagemakerModel#s3_data_type}.'''
        result = self._values.get("s3_data_type")
        assert result is not None, "Required property 's3_data_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def s3_uri(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_uri SagemakerModel#s3_uri}.'''
        result = self._values.get("s3_uri")
        assert result is not None, "Required property 's3_uri' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def model_access_config(
        self,
    ) -> typing.Optional["SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig"]:
        '''model_access_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_access_config SagemakerModel#model_access_config}
        '''
        result = self._values.get("model_access_config")
        return typing.cast(typing.Optional["SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelContainerModelDataSourceS3DataSource(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelContainerModelDataSourceS3DataSourceList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelContainerModelDataSourceS3DataSourceList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__36e19d0908ddae22245aed5df07782e5d158f67c7d22c6991ca20f9b834e248a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerModelContainerModelDataSourceS3DataSourceOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8f3877a5fbce27ceaa2d92f656b009a469130bfade7a24373dcaac3ce5ada06f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerModelContainerModelDataSourceS3DataSourceOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__66cd60eedd2814d891aef461a45a3eac7f69cebc8fe0021835f644e7a86fb207)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a2eb612f7174232bfea91afe1df871a05c6da44a499231c3ec5c1f02c8528b39)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cb644096ec1f4ad2d6a7fd032fd7de42bde765ab27cc67f72c8167b105b2781d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerModelContainerModelDataSourceS3DataSource]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerModelContainerModelDataSourceS3DataSource]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerModelContainerModelDataSourceS3DataSource]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee0b679c735c3345446395a268f1376c1df276f79646ca896db435b0c56178dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig",
    jsii_struct_bases=[],
    name_mapping={"accept_eula": "acceptEula"},
)
class SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig:
    def __init__(
        self,
        *,
        accept_eula: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param accept_eula: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#accept_eula SagemakerModel#accept_eula}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa1dad06c3c1de00c8457cd6d1e123a4f283c44187cc5af4c004cca9ed075a30)
            check_type(argname="argument accept_eula", value=accept_eula, expected_type=type_hints["accept_eula"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "accept_eula": accept_eula,
        }

    @builtins.property
    def accept_eula(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#accept_eula SagemakerModel#accept_eula}.'''
        result = self._values.get("accept_eula")
        assert result is not None, "Required property 'accept_eula' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8636a2509c503bfa286d6c00a7ba9a3fc1e4b3bac7faf72e5f117eb5e5e86ff6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="acceptEulaInput")
    def accept_eula_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "acceptEulaInput"))

    @builtins.property
    @jsii.member(jsii_name="acceptEula")
    def accept_eula(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "acceptEula"))

    @accept_eula.setter
    def accept_eula(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9e49ec4d53fffd6cbc8945a15cdd99cf8c7208cffbe7e3a4e22cf7c5474ab812)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "acceptEula", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig]:
        return typing.cast(typing.Optional[SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18799896734ddb28081e0dfe544be927526eb73ce80050c7e99271047ab91a89)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerModelContainerModelDataSourceS3DataSourceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelContainerModelDataSourceS3DataSourceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fd2cbea3b1fbf7ddb3692b961ac413cd356cd5b7e5d48ab74ce58f679edd1e20)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putModelAccessConfig")
    def put_model_access_config(
        self,
        *,
        accept_eula: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param accept_eula: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#accept_eula SagemakerModel#accept_eula}.
        '''
        value = SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig(
            accept_eula=accept_eula
        )

        return typing.cast(None, jsii.invoke(self, "putModelAccessConfig", [value]))

    @jsii.member(jsii_name="resetModelAccessConfig")
    def reset_model_access_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetModelAccessConfig", []))

    @builtins.property
    @jsii.member(jsii_name="modelAccessConfig")
    def model_access_config(
        self,
    ) -> SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference:
        return typing.cast(SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference, jsii.get(self, "modelAccessConfig"))

    @builtins.property
    @jsii.member(jsii_name="compressionTypeInput")
    def compression_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "compressionTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="modelAccessConfigInput")
    def model_access_config_input(
        self,
    ) -> typing.Optional[SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig]:
        return typing.cast(typing.Optional[SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig], jsii.get(self, "modelAccessConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="s3DataTypeInput")
    def s3_data_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3DataTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="s3UriInput")
    def s3_uri_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3UriInput"))

    @builtins.property
    @jsii.member(jsii_name="compressionType")
    def compression_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "compressionType"))

    @compression_type.setter
    def compression_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc4dbf115cc4987e12e6cb73fc9696fe92ea302c4a288f9558cdbcf3deef4ee8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "compressionType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3DataType")
    def s3_data_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3DataType"))

    @s3_data_type.setter
    def s3_data_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__60f7367e2e261a46a44db6b8f640e72f8ed8b76af64612ca2bbc53bfcd9fed7c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3DataType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3Uri")
    def s3_uri(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3Uri"))

    @s3_uri.setter
    def s3_uri(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b240dd86f7d02b6575291b396b408e5c2be70ee488e3a03c27a6b26f74b2deba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3Uri", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerModelContainerModelDataSourceS3DataSource]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerModelContainerModelDataSourceS3DataSource]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerModelContainerModelDataSourceS3DataSource]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5abae06d619624c6fff71e6478ffffbd88ac7c2ebc0a8ec495adcb781ad0b8d1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelContainerMultiModelConfig",
    jsii_struct_bases=[],
    name_mapping={"model_cache_setting": "modelCacheSetting"},
)
class SagemakerModelContainerMultiModelConfig:
    def __init__(
        self,
        *,
        model_cache_setting: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param model_cache_setting: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_cache_setting SagemakerModel#model_cache_setting}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a6e7d7d431745e6fd23d66f3e425145563808c6271dd3fff6cd3e2344513406a)
            check_type(argname="argument model_cache_setting", value=model_cache_setting, expected_type=type_hints["model_cache_setting"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if model_cache_setting is not None:
            self._values["model_cache_setting"] = model_cache_setting

    @builtins.property
    def model_cache_setting(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_cache_setting SagemakerModel#model_cache_setting}.'''
        result = self._values.get("model_cache_setting")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelContainerMultiModelConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelContainerMultiModelConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelContainerMultiModelConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__792c7514eab9ce6019f3f2c1fb7d6e10650b4accb4c200fbcea0e638424bcbe2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetModelCacheSetting")
    def reset_model_cache_setting(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetModelCacheSetting", []))

    @builtins.property
    @jsii.member(jsii_name="modelCacheSettingInput")
    def model_cache_setting_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "modelCacheSettingInput"))

    @builtins.property
    @jsii.member(jsii_name="modelCacheSetting")
    def model_cache_setting(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "modelCacheSetting"))

    @model_cache_setting.setter
    def model_cache_setting(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae75a9851b4ca9d77a1e1d852dd1f2baac9331362ba6ea8ea7dfab8e75cdaea5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "modelCacheSetting", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerModelContainerMultiModelConfig]:
        return typing.cast(typing.Optional[SagemakerModelContainerMultiModelConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerModelContainerMultiModelConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__017de9eab2237bf540272dd8805aeac774557e483d962746a0d4761082813f6c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerModelContainerOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelContainerOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2c6937470a7712f0938aabb7d06cd98c4be5b9b5064c3d1e0543531c54c41d1d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putImageConfig")
    def put_image_config(
        self,
        *,
        repository_access_mode: builtins.str,
        repository_auth_config: typing.Optional[typing.Union[SagemakerModelContainerImageConfigRepositoryAuthConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param repository_access_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_access_mode SagemakerModel#repository_access_mode}.
        :param repository_auth_config: repository_auth_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_auth_config SagemakerModel#repository_auth_config}
        '''
        value = SagemakerModelContainerImageConfig(
            repository_access_mode=repository_access_mode,
            repository_auth_config=repository_auth_config,
        )

        return typing.cast(None, jsii.invoke(self, "putImageConfig", [value]))

    @jsii.member(jsii_name="putModelDataSource")
    def put_model_data_source(
        self,
        *,
        s3_data_source: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerModelContainerModelDataSourceS3DataSource, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param s3_data_source: s3_data_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_source SagemakerModel#s3_data_source}
        '''
        value = SagemakerModelContainerModelDataSource(s3_data_source=s3_data_source)

        return typing.cast(None, jsii.invoke(self, "putModelDataSource", [value]))

    @jsii.member(jsii_name="putMultiModelConfig")
    def put_multi_model_config(
        self,
        *,
        model_cache_setting: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param model_cache_setting: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_cache_setting SagemakerModel#model_cache_setting}.
        '''
        value = SagemakerModelContainerMultiModelConfig(
            model_cache_setting=model_cache_setting
        )

        return typing.cast(None, jsii.invoke(self, "putMultiModelConfig", [value]))

    @jsii.member(jsii_name="resetContainerHostname")
    def reset_container_hostname(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerHostname", []))

    @jsii.member(jsii_name="resetEnvironment")
    def reset_environment(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnvironment", []))

    @jsii.member(jsii_name="resetImage")
    def reset_image(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImage", []))

    @jsii.member(jsii_name="resetImageConfig")
    def reset_image_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImageConfig", []))

    @jsii.member(jsii_name="resetInferenceSpecificationName")
    def reset_inference_specification_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInferenceSpecificationName", []))

    @jsii.member(jsii_name="resetMode")
    def reset_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMode", []))

    @jsii.member(jsii_name="resetModelDataSource")
    def reset_model_data_source(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetModelDataSource", []))

    @jsii.member(jsii_name="resetModelDataUrl")
    def reset_model_data_url(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetModelDataUrl", []))

    @jsii.member(jsii_name="resetModelPackageName")
    def reset_model_package_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetModelPackageName", []))

    @jsii.member(jsii_name="resetMultiModelConfig")
    def reset_multi_model_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMultiModelConfig", []))

    @builtins.property
    @jsii.member(jsii_name="imageConfig")
    def image_config(self) -> SagemakerModelContainerImageConfigOutputReference:
        return typing.cast(SagemakerModelContainerImageConfigOutputReference, jsii.get(self, "imageConfig"))

    @builtins.property
    @jsii.member(jsii_name="modelDataSource")
    def model_data_source(
        self,
    ) -> SagemakerModelContainerModelDataSourceOutputReference:
        return typing.cast(SagemakerModelContainerModelDataSourceOutputReference, jsii.get(self, "modelDataSource"))

    @builtins.property
    @jsii.member(jsii_name="multiModelConfig")
    def multi_model_config(
        self,
    ) -> SagemakerModelContainerMultiModelConfigOutputReference:
        return typing.cast(SagemakerModelContainerMultiModelConfigOutputReference, jsii.get(self, "multiModelConfig"))

    @builtins.property
    @jsii.member(jsii_name="containerHostnameInput")
    def container_hostname_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "containerHostnameInput"))

    @builtins.property
    @jsii.member(jsii_name="environmentInput")
    def environment_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "environmentInput"))

    @builtins.property
    @jsii.member(jsii_name="imageConfigInput")
    def image_config_input(self) -> typing.Optional[SagemakerModelContainerImageConfig]:
        return typing.cast(typing.Optional[SagemakerModelContainerImageConfig], jsii.get(self, "imageConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="imageInput")
    def image_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "imageInput"))

    @builtins.property
    @jsii.member(jsii_name="inferenceSpecificationNameInput")
    def inference_specification_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "inferenceSpecificationNameInput"))

    @builtins.property
    @jsii.member(jsii_name="modeInput")
    def mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "modeInput"))

    @builtins.property
    @jsii.member(jsii_name="modelDataSourceInput")
    def model_data_source_input(
        self,
    ) -> typing.Optional[SagemakerModelContainerModelDataSource]:
        return typing.cast(typing.Optional[SagemakerModelContainerModelDataSource], jsii.get(self, "modelDataSourceInput"))

    @builtins.property
    @jsii.member(jsii_name="modelDataUrlInput")
    def model_data_url_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "modelDataUrlInput"))

    @builtins.property
    @jsii.member(jsii_name="modelPackageNameInput")
    def model_package_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "modelPackageNameInput"))

    @builtins.property
    @jsii.member(jsii_name="multiModelConfigInput")
    def multi_model_config_input(
        self,
    ) -> typing.Optional[SagemakerModelContainerMultiModelConfig]:
        return typing.cast(typing.Optional[SagemakerModelContainerMultiModelConfig], jsii.get(self, "multiModelConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="containerHostname")
    def container_hostname(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "containerHostname"))

    @container_hostname.setter
    def container_hostname(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2174b79aea18859d9bc92844ee8f91dd6fc9ca502eb536330a1333c2d7fb58a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "containerHostname", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="environment")
    def environment(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "environment"))

    @environment.setter
    def environment(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3f8e0d3497d31afedffe0b70b7778bc6ada87c1417a724c09b1bc2896cc1ee9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "environment", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="image")
    def image(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "image"))

    @image.setter
    def image(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__54f026ba32fe3669b06fcf992fc409767528d911ffe81d0ffa5a39e189de5a7b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "image", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="inferenceSpecificationName")
    def inference_specification_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "inferenceSpecificationName"))

    @inference_specification_name.setter
    def inference_specification_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed4744a5abbe368ec43a4bba681b6a16be7499db3fd8175c44401fe3db8aafe2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "inferenceSpecificationName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="mode")
    def mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mode"))

    @mode.setter
    def mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cdaf3de0f7881fdfa6e185d23a01c022073f8c093fc9147704b2b731aa0c61af)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="modelDataUrl")
    def model_data_url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "modelDataUrl"))

    @model_data_url.setter
    def model_data_url(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5af14c995d6fc8b2346955d7eb67416bdf15115eb63e5e3beec40df332167c51)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "modelDataUrl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="modelPackageName")
    def model_package_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "modelPackageName"))

    @model_package_name.setter
    def model_package_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c8459296509031769ece9a2d698ef199b6b7dd2cca8913c3654fdf93a408888)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "modelPackageName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerModelContainer]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerModelContainer]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerModelContainer]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87093dac45f29e0ea1810ac12e8e3bf096fd4fc5e418710814caee1456a55d19)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelInferenceExecutionConfig",
    jsii_struct_bases=[],
    name_mapping={"mode": "mode"},
)
class SagemakerModelInferenceExecutionConfig:
    def __init__(self, *, mode: builtins.str) -> None:
        '''
        :param mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#mode SagemakerModel#mode}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c44050cae8e3e5c739f6dda03903fd3d648d734dd522a770f43757a8bb254a05)
            check_type(argname="argument mode", value=mode, expected_type=type_hints["mode"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "mode": mode,
        }

    @builtins.property
    def mode(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#mode SagemakerModel#mode}.'''
        result = self._values.get("mode")
        assert result is not None, "Required property 'mode' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelInferenceExecutionConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelInferenceExecutionConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelInferenceExecutionConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6c158a4b787fcb58c4d388830097d668dab52419028512c5001de3f9740c46b3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="modeInput")
    def mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "modeInput"))

    @builtins.property
    @jsii.member(jsii_name="mode")
    def mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mode"))

    @mode.setter
    def mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2fcdab0d449af795c6eef41446c549db122f72e5c8b198ff83ff37c7f27e070d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[SagemakerModelInferenceExecutionConfig]:
        return typing.cast(typing.Optional[SagemakerModelInferenceExecutionConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerModelInferenceExecutionConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__829a0ad8711b036676f14b48d3e8ba2cef36dc7789579e4358298e0902c475f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainer",
    jsii_struct_bases=[],
    name_mapping={
        "container_hostname": "containerHostname",
        "environment": "environment",
        "image": "image",
        "image_config": "imageConfig",
        "inference_specification_name": "inferenceSpecificationName",
        "mode": "mode",
        "model_data_source": "modelDataSource",
        "model_data_url": "modelDataUrl",
        "model_package_name": "modelPackageName",
        "multi_model_config": "multiModelConfig",
    },
)
class SagemakerModelPrimaryContainer:
    def __init__(
        self,
        *,
        container_hostname: typing.Optional[builtins.str] = None,
        environment: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        image: typing.Optional[builtins.str] = None,
        image_config: typing.Optional[typing.Union["SagemakerModelPrimaryContainerImageConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        inference_specification_name: typing.Optional[builtins.str] = None,
        mode: typing.Optional[builtins.str] = None,
        model_data_source: typing.Optional[typing.Union["SagemakerModelPrimaryContainerModelDataSource", typing.Dict[builtins.str, typing.Any]]] = None,
        model_data_url: typing.Optional[builtins.str] = None,
        model_package_name: typing.Optional[builtins.str] = None,
        multi_model_config: typing.Optional[typing.Union["SagemakerModelPrimaryContainerMultiModelConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param container_hostname: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#container_hostname SagemakerModel#container_hostname}.
        :param environment: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#environment SagemakerModel#environment}.
        :param image: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image SagemakerModel#image}.
        :param image_config: image_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image_config SagemakerModel#image_config}
        :param inference_specification_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#inference_specification_name SagemakerModel#inference_specification_name}.
        :param mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#mode SagemakerModel#mode}.
        :param model_data_source: model_data_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_source SagemakerModel#model_data_source}
        :param model_data_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_url SagemakerModel#model_data_url}.
        :param model_package_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_package_name SagemakerModel#model_package_name}.
        :param multi_model_config: multi_model_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#multi_model_config SagemakerModel#multi_model_config}
        '''
        if isinstance(image_config, dict):
            image_config = SagemakerModelPrimaryContainerImageConfig(**image_config)
        if isinstance(model_data_source, dict):
            model_data_source = SagemakerModelPrimaryContainerModelDataSource(**model_data_source)
        if isinstance(multi_model_config, dict):
            multi_model_config = SagemakerModelPrimaryContainerMultiModelConfig(**multi_model_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__09677e8b8ed8a792bb296efd920b0f1fc124512af892887eb8f05fe76fca795b)
            check_type(argname="argument container_hostname", value=container_hostname, expected_type=type_hints["container_hostname"])
            check_type(argname="argument environment", value=environment, expected_type=type_hints["environment"])
            check_type(argname="argument image", value=image, expected_type=type_hints["image"])
            check_type(argname="argument image_config", value=image_config, expected_type=type_hints["image_config"])
            check_type(argname="argument inference_specification_name", value=inference_specification_name, expected_type=type_hints["inference_specification_name"])
            check_type(argname="argument mode", value=mode, expected_type=type_hints["mode"])
            check_type(argname="argument model_data_source", value=model_data_source, expected_type=type_hints["model_data_source"])
            check_type(argname="argument model_data_url", value=model_data_url, expected_type=type_hints["model_data_url"])
            check_type(argname="argument model_package_name", value=model_package_name, expected_type=type_hints["model_package_name"])
            check_type(argname="argument multi_model_config", value=multi_model_config, expected_type=type_hints["multi_model_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if container_hostname is not None:
            self._values["container_hostname"] = container_hostname
        if environment is not None:
            self._values["environment"] = environment
        if image is not None:
            self._values["image"] = image
        if image_config is not None:
            self._values["image_config"] = image_config
        if inference_specification_name is not None:
            self._values["inference_specification_name"] = inference_specification_name
        if mode is not None:
            self._values["mode"] = mode
        if model_data_source is not None:
            self._values["model_data_source"] = model_data_source
        if model_data_url is not None:
            self._values["model_data_url"] = model_data_url
        if model_package_name is not None:
            self._values["model_package_name"] = model_package_name
        if multi_model_config is not None:
            self._values["multi_model_config"] = multi_model_config

    @builtins.property
    def container_hostname(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#container_hostname SagemakerModel#container_hostname}.'''
        result = self._values.get("container_hostname")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def environment(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#environment SagemakerModel#environment}.'''
        result = self._values.get("environment")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def image(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image SagemakerModel#image}.'''
        result = self._values.get("image")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def image_config(
        self,
    ) -> typing.Optional["SagemakerModelPrimaryContainerImageConfig"]:
        '''image_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#image_config SagemakerModel#image_config}
        '''
        result = self._values.get("image_config")
        return typing.cast(typing.Optional["SagemakerModelPrimaryContainerImageConfig"], result)

    @builtins.property
    def inference_specification_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#inference_specification_name SagemakerModel#inference_specification_name}.'''
        result = self._values.get("inference_specification_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#mode SagemakerModel#mode}.'''
        result = self._values.get("mode")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def model_data_source(
        self,
    ) -> typing.Optional["SagemakerModelPrimaryContainerModelDataSource"]:
        '''model_data_source block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_source SagemakerModel#model_data_source}
        '''
        result = self._values.get("model_data_source")
        return typing.cast(typing.Optional["SagemakerModelPrimaryContainerModelDataSource"], result)

    @builtins.property
    def model_data_url(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_data_url SagemakerModel#model_data_url}.'''
        result = self._values.get("model_data_url")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def model_package_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_package_name SagemakerModel#model_package_name}.'''
        result = self._values.get("model_package_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def multi_model_config(
        self,
    ) -> typing.Optional["SagemakerModelPrimaryContainerMultiModelConfig"]:
        '''multi_model_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#multi_model_config SagemakerModel#multi_model_config}
        '''
        result = self._values.get("multi_model_config")
        return typing.cast(typing.Optional["SagemakerModelPrimaryContainerMultiModelConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelPrimaryContainer(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerImageConfig",
    jsii_struct_bases=[],
    name_mapping={
        "repository_access_mode": "repositoryAccessMode",
        "repository_auth_config": "repositoryAuthConfig",
    },
)
class SagemakerModelPrimaryContainerImageConfig:
    def __init__(
        self,
        *,
        repository_access_mode: builtins.str,
        repository_auth_config: typing.Optional[typing.Union["SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param repository_access_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_access_mode SagemakerModel#repository_access_mode}.
        :param repository_auth_config: repository_auth_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_auth_config SagemakerModel#repository_auth_config}
        '''
        if isinstance(repository_auth_config, dict):
            repository_auth_config = SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig(**repository_auth_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7d98e1bcabfe62305d445f719d17f7f9f92ad610f64551d8820e41b2aa14fa1)
            check_type(argname="argument repository_access_mode", value=repository_access_mode, expected_type=type_hints["repository_access_mode"])
            check_type(argname="argument repository_auth_config", value=repository_auth_config, expected_type=type_hints["repository_auth_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "repository_access_mode": repository_access_mode,
        }
        if repository_auth_config is not None:
            self._values["repository_auth_config"] = repository_auth_config

    @builtins.property
    def repository_access_mode(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_access_mode SagemakerModel#repository_access_mode}.'''
        result = self._values.get("repository_access_mode")
        assert result is not None, "Required property 'repository_access_mode' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def repository_auth_config(
        self,
    ) -> typing.Optional["SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig"]:
        '''repository_auth_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_auth_config SagemakerModel#repository_auth_config}
        '''
        result = self._values.get("repository_auth_config")
        return typing.cast(typing.Optional["SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelPrimaryContainerImageConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelPrimaryContainerImageConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerImageConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bcfa9c94510113650d908daed47edb8ac7f192e2131a3ed45320b69c9775f1f2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putRepositoryAuthConfig")
    def put_repository_auth_config(
        self,
        *,
        repository_credentials_provider_arn: builtins.str,
    ) -> None:
        '''
        :param repository_credentials_provider_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_credentials_provider_arn SagemakerModel#repository_credentials_provider_arn}.
        '''
        value = SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig(
            repository_credentials_provider_arn=repository_credentials_provider_arn
        )

        return typing.cast(None, jsii.invoke(self, "putRepositoryAuthConfig", [value]))

    @jsii.member(jsii_name="resetRepositoryAuthConfig")
    def reset_repository_auth_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRepositoryAuthConfig", []))

    @builtins.property
    @jsii.member(jsii_name="repositoryAuthConfig")
    def repository_auth_config(
        self,
    ) -> "SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfigOutputReference":
        return typing.cast("SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfigOutputReference", jsii.get(self, "repositoryAuthConfig"))

    @builtins.property
    @jsii.member(jsii_name="repositoryAccessModeInput")
    def repository_access_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "repositoryAccessModeInput"))

    @builtins.property
    @jsii.member(jsii_name="repositoryAuthConfigInput")
    def repository_auth_config_input(
        self,
    ) -> typing.Optional["SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig"]:
        return typing.cast(typing.Optional["SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig"], jsii.get(self, "repositoryAuthConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="repositoryAccessMode")
    def repository_access_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "repositoryAccessMode"))

    @repository_access_mode.setter
    def repository_access_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2065808d4c3035309076dea026b062a69aaa7e40ee9cb2996e00d159e7b23c8d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "repositoryAccessMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerModelPrimaryContainerImageConfig]:
        return typing.cast(typing.Optional[SagemakerModelPrimaryContainerImageConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerModelPrimaryContainerImageConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a02acb964fa4798a549e23d9c4768d9fe93ff27bded7efe68c10c50730a6f8ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig",
    jsii_struct_bases=[],
    name_mapping={
        "repository_credentials_provider_arn": "repositoryCredentialsProviderArn",
    },
)
class SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig:
    def __init__(self, *, repository_credentials_provider_arn: builtins.str) -> None:
        '''
        :param repository_credentials_provider_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_credentials_provider_arn SagemakerModel#repository_credentials_provider_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9a8a2ad5f058dbda59c9b6add4799abf2ce659e117fd708deb8dc22ebd189991)
            check_type(argname="argument repository_credentials_provider_arn", value=repository_credentials_provider_arn, expected_type=type_hints["repository_credentials_provider_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "repository_credentials_provider_arn": repository_credentials_provider_arn,
        }

    @builtins.property
    def repository_credentials_provider_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_credentials_provider_arn SagemakerModel#repository_credentials_provider_arn}.'''
        result = self._values.get("repository_credentials_provider_arn")
        assert result is not None, "Required property 'repository_credentials_provider_arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8ee36ff029eb3744cfd4752b5efda94f6d95fa89466cd85754279ae722035813)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="repositoryCredentialsProviderArnInput")
    def repository_credentials_provider_arn_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "repositoryCredentialsProviderArnInput"))

    @builtins.property
    @jsii.member(jsii_name="repositoryCredentialsProviderArn")
    def repository_credentials_provider_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "repositoryCredentialsProviderArn"))

    @repository_credentials_provider_arn.setter
    def repository_credentials_provider_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4402976bb81d65d4afa052ece34f27a015266ecfa1e34de18154ff95dc8dacad)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "repositoryCredentialsProviderArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig]:
        return typing.cast(typing.Optional[SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6bcb15a7c39402dc1a6913361672cab18b1a266ebe1bab85c08cd8e664fd6e95)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerModelDataSource",
    jsii_struct_bases=[],
    name_mapping={"s3_data_source": "s3DataSource"},
)
class SagemakerModelPrimaryContainerModelDataSource:
    def __init__(
        self,
        *,
        s3_data_source: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerModelPrimaryContainerModelDataSourceS3DataSource", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param s3_data_source: s3_data_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_source SagemakerModel#s3_data_source}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6184d8b0721243e388c8a5ea0469143eea87b56fff17a079c8dfa4cdab31663e)
            check_type(argname="argument s3_data_source", value=s3_data_source, expected_type=type_hints["s3_data_source"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "s3_data_source": s3_data_source,
        }

    @builtins.property
    def s3_data_source(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerModelPrimaryContainerModelDataSourceS3DataSource"]]:
        '''s3_data_source block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_source SagemakerModel#s3_data_source}
        '''
        result = self._values.get("s3_data_source")
        assert result is not None, "Required property 's3_data_source' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerModelPrimaryContainerModelDataSourceS3DataSource"]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelPrimaryContainerModelDataSource(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelPrimaryContainerModelDataSourceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerModelDataSourceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a23ba12485f678915c3bad29fa670060fc2f0fb81bea424b99c5ca00134dc167)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putS3DataSource")
    def put_s3_data_source(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerModelPrimaryContainerModelDataSourceS3DataSource", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c36c7b7282ec44c5c99914c42db89cdda7bdb0f6b524ff69a260272f7fb2f55a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putS3DataSource", [value]))

    @builtins.property
    @jsii.member(jsii_name="s3DataSource")
    def s3_data_source(
        self,
    ) -> "SagemakerModelPrimaryContainerModelDataSourceS3DataSourceList":
        return typing.cast("SagemakerModelPrimaryContainerModelDataSourceS3DataSourceList", jsii.get(self, "s3DataSource"))

    @builtins.property
    @jsii.member(jsii_name="s3DataSourceInput")
    def s3_data_source_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerModelPrimaryContainerModelDataSourceS3DataSource"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerModelPrimaryContainerModelDataSourceS3DataSource"]]], jsii.get(self, "s3DataSourceInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerModelPrimaryContainerModelDataSource]:
        return typing.cast(typing.Optional[SagemakerModelPrimaryContainerModelDataSource], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerModelPrimaryContainerModelDataSource],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a488bd5d69d2edd33076d22d5b9da49fa7777126c7db5ecaa84c413356958138)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerModelDataSourceS3DataSource",
    jsii_struct_bases=[],
    name_mapping={
        "compression_type": "compressionType",
        "s3_data_type": "s3DataType",
        "s3_uri": "s3Uri",
        "model_access_config": "modelAccessConfig",
    },
)
class SagemakerModelPrimaryContainerModelDataSourceS3DataSource:
    def __init__(
        self,
        *,
        compression_type: builtins.str,
        s3_data_type: builtins.str,
        s3_uri: builtins.str,
        model_access_config: typing.Optional[typing.Union["SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param compression_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#compression_type SagemakerModel#compression_type}.
        :param s3_data_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_type SagemakerModel#s3_data_type}.
        :param s3_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_uri SagemakerModel#s3_uri}.
        :param model_access_config: model_access_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_access_config SagemakerModel#model_access_config}
        '''
        if isinstance(model_access_config, dict):
            model_access_config = SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig(**model_access_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf60f6708a79f75818704eeb7fcdcca7e178a598c741ca2be441ce1d0770d5ea)
            check_type(argname="argument compression_type", value=compression_type, expected_type=type_hints["compression_type"])
            check_type(argname="argument s3_data_type", value=s3_data_type, expected_type=type_hints["s3_data_type"])
            check_type(argname="argument s3_uri", value=s3_uri, expected_type=type_hints["s3_uri"])
            check_type(argname="argument model_access_config", value=model_access_config, expected_type=type_hints["model_access_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "compression_type": compression_type,
            "s3_data_type": s3_data_type,
            "s3_uri": s3_uri,
        }
        if model_access_config is not None:
            self._values["model_access_config"] = model_access_config

    @builtins.property
    def compression_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#compression_type SagemakerModel#compression_type}.'''
        result = self._values.get("compression_type")
        assert result is not None, "Required property 'compression_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def s3_data_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_type SagemakerModel#s3_data_type}.'''
        result = self._values.get("s3_data_type")
        assert result is not None, "Required property 's3_data_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def s3_uri(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_uri SagemakerModel#s3_uri}.'''
        result = self._values.get("s3_uri")
        assert result is not None, "Required property 's3_uri' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def model_access_config(
        self,
    ) -> typing.Optional["SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig"]:
        '''model_access_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_access_config SagemakerModel#model_access_config}
        '''
        result = self._values.get("model_access_config")
        return typing.cast(typing.Optional["SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelPrimaryContainerModelDataSourceS3DataSource(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelPrimaryContainerModelDataSourceS3DataSourceList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerModelDataSourceS3DataSourceList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__cfe179fde506b893e1b16aab29bb58de48619b3a7177738bf1ce7311fa76976c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerModelPrimaryContainerModelDataSourceS3DataSourceOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__76e573dc0708d794846fadc275d9af94646d1221428aa3e94fdc8aeab575003a)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerModelPrimaryContainerModelDataSourceS3DataSourceOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d37cfa47faeeb7924500b5afc882a795304005141e322e6b58b672a3dfa770db)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c253dcab45006eeb7297770b0dbd036d45a3c8c362c9734a24de810a8f371a88)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6d03037e1e3f2539259cb4ea956786e8b110daebb4e6b371c433b6ed15f5b03f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerModelPrimaryContainerModelDataSourceS3DataSource]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerModelPrimaryContainerModelDataSourceS3DataSource]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerModelPrimaryContainerModelDataSourceS3DataSource]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__93fd7dd81914d7dc56639ee23a6a01950bac57153c0c7b0897ce69cf6a86ddc2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig",
    jsii_struct_bases=[],
    name_mapping={"accept_eula": "acceptEula"},
)
class SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig:
    def __init__(
        self,
        *,
        accept_eula: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param accept_eula: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#accept_eula SagemakerModel#accept_eula}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3082b2e4a83d65b210f45375b92e4c0c8fbb83a50dd54aa4952df02f6d8a9b9c)
            check_type(argname="argument accept_eula", value=accept_eula, expected_type=type_hints["accept_eula"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "accept_eula": accept_eula,
        }

    @builtins.property
    def accept_eula(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#accept_eula SagemakerModel#accept_eula}.'''
        result = self._values.get("accept_eula")
        assert result is not None, "Required property 'accept_eula' is missing"
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0f5566620b49611cb004118b69d37aa74d1540ef48464547c6d42d5bec303e3f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="acceptEulaInput")
    def accept_eula_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "acceptEulaInput"))

    @builtins.property
    @jsii.member(jsii_name="acceptEula")
    def accept_eula(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "acceptEula"))

    @accept_eula.setter
    def accept_eula(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f0431efc86de26b4634bb53f319ea5f6e530091dd99f9794da1b71434c432e3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "acceptEula", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig]:
        return typing.cast(typing.Optional[SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15012d5e0605712a78316802ddecd2f07e8c86bf15be00759d5c20865660e68e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerModelPrimaryContainerModelDataSourceS3DataSourceOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerModelDataSourceS3DataSourceOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__221d18391f3749a4af10006cdc5d62eab6adf409398e0080eb1b123e60449237)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putModelAccessConfig")
    def put_model_access_config(
        self,
        *,
        accept_eula: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        '''
        :param accept_eula: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#accept_eula SagemakerModel#accept_eula}.
        '''
        value = SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig(
            accept_eula=accept_eula
        )

        return typing.cast(None, jsii.invoke(self, "putModelAccessConfig", [value]))

    @jsii.member(jsii_name="resetModelAccessConfig")
    def reset_model_access_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetModelAccessConfig", []))

    @builtins.property
    @jsii.member(jsii_name="modelAccessConfig")
    def model_access_config(
        self,
    ) -> SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference:
        return typing.cast(SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference, jsii.get(self, "modelAccessConfig"))

    @builtins.property
    @jsii.member(jsii_name="compressionTypeInput")
    def compression_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "compressionTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="modelAccessConfigInput")
    def model_access_config_input(
        self,
    ) -> typing.Optional[SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig]:
        return typing.cast(typing.Optional[SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig], jsii.get(self, "modelAccessConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="s3DataTypeInput")
    def s3_data_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3DataTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="s3UriInput")
    def s3_uri_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3UriInput"))

    @builtins.property
    @jsii.member(jsii_name="compressionType")
    def compression_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "compressionType"))

    @compression_type.setter
    def compression_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__69618e75016ac84ee1cd676d238b6b2869de48918c7c221d949bfc58fc65dd64)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "compressionType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3DataType")
    def s3_data_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3DataType"))

    @s3_data_type.setter
    def s3_data_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__23c6d005acd6b2bca6914b07bc5762cd75792a2c0f683ddb00f63f514c6697b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3DataType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3Uri")
    def s3_uri(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3Uri"))

    @s3_uri.setter
    def s3_uri(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ef43d5b216cb4a9c2ec7570c386316f3c77e3c7949f1ffac7ccfff71f21b29b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3Uri", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerModelPrimaryContainerModelDataSourceS3DataSource]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerModelPrimaryContainerModelDataSourceS3DataSource]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerModelPrimaryContainerModelDataSourceS3DataSource]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__594fa6109121f2df6bfb5c3b60457ce3c547e6767cf875fd85fae93b0915eb2e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerMultiModelConfig",
    jsii_struct_bases=[],
    name_mapping={"model_cache_setting": "modelCacheSetting"},
)
class SagemakerModelPrimaryContainerMultiModelConfig:
    def __init__(
        self,
        *,
        model_cache_setting: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param model_cache_setting: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_cache_setting SagemakerModel#model_cache_setting}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d42125a59646f01ad3a25ef2f3c968eb1653354217ebd94df0fb18f5e67af15)
            check_type(argname="argument model_cache_setting", value=model_cache_setting, expected_type=type_hints["model_cache_setting"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if model_cache_setting is not None:
            self._values["model_cache_setting"] = model_cache_setting

    @builtins.property
    def model_cache_setting(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_cache_setting SagemakerModel#model_cache_setting}.'''
        result = self._values.get("model_cache_setting")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelPrimaryContainerMultiModelConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelPrimaryContainerMultiModelConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerMultiModelConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e81b9d8f3d99d3be5eddd1842b1f4b66a8904e5f5bd9e4bee83274400ff76154)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetModelCacheSetting")
    def reset_model_cache_setting(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetModelCacheSetting", []))

    @builtins.property
    @jsii.member(jsii_name="modelCacheSettingInput")
    def model_cache_setting_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "modelCacheSettingInput"))

    @builtins.property
    @jsii.member(jsii_name="modelCacheSetting")
    def model_cache_setting(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "modelCacheSetting"))

    @model_cache_setting.setter
    def model_cache_setting(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8642043d5722448a8b7ad6706285fe5758bbcf5de4b3b378de8c0273433ea9fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "modelCacheSetting", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerModelPrimaryContainerMultiModelConfig]:
        return typing.cast(typing.Optional[SagemakerModelPrimaryContainerMultiModelConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerModelPrimaryContainerMultiModelConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c582febbecb3209cc191080fc3c067187567968310f2e46e62051b3c7c1488d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerModelPrimaryContainerOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelPrimaryContainerOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__41c8c3993434d68a0056a6d764970c928f62cf6c91c76254feb8ef2c7527c706)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putImageConfig")
    def put_image_config(
        self,
        *,
        repository_access_mode: builtins.str,
        repository_auth_config: typing.Optional[typing.Union[SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param repository_access_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_access_mode SagemakerModel#repository_access_mode}.
        :param repository_auth_config: repository_auth_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_auth_config SagemakerModel#repository_auth_config}
        '''
        value = SagemakerModelPrimaryContainerImageConfig(
            repository_access_mode=repository_access_mode,
            repository_auth_config=repository_auth_config,
        )

        return typing.cast(None, jsii.invoke(self, "putImageConfig", [value]))

    @jsii.member(jsii_name="putModelDataSource")
    def put_model_data_source(
        self,
        *,
        s3_data_source: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerModelPrimaryContainerModelDataSourceS3DataSource, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param s3_data_source: s3_data_source block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_source SagemakerModel#s3_data_source}
        '''
        value = SagemakerModelPrimaryContainerModelDataSource(
            s3_data_source=s3_data_source
        )

        return typing.cast(None, jsii.invoke(self, "putModelDataSource", [value]))

    @jsii.member(jsii_name="putMultiModelConfig")
    def put_multi_model_config(
        self,
        *,
        model_cache_setting: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param model_cache_setting: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_cache_setting SagemakerModel#model_cache_setting}.
        '''
        value = SagemakerModelPrimaryContainerMultiModelConfig(
            model_cache_setting=model_cache_setting
        )

        return typing.cast(None, jsii.invoke(self, "putMultiModelConfig", [value]))

    @jsii.member(jsii_name="resetContainerHostname")
    def reset_container_hostname(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerHostname", []))

    @jsii.member(jsii_name="resetEnvironment")
    def reset_environment(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnvironment", []))

    @jsii.member(jsii_name="resetImage")
    def reset_image(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImage", []))

    @jsii.member(jsii_name="resetImageConfig")
    def reset_image_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImageConfig", []))

    @jsii.member(jsii_name="resetInferenceSpecificationName")
    def reset_inference_specification_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInferenceSpecificationName", []))

    @jsii.member(jsii_name="resetMode")
    def reset_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMode", []))

    @jsii.member(jsii_name="resetModelDataSource")
    def reset_model_data_source(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetModelDataSource", []))

    @jsii.member(jsii_name="resetModelDataUrl")
    def reset_model_data_url(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetModelDataUrl", []))

    @jsii.member(jsii_name="resetModelPackageName")
    def reset_model_package_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetModelPackageName", []))

    @jsii.member(jsii_name="resetMultiModelConfig")
    def reset_multi_model_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMultiModelConfig", []))

    @builtins.property
    @jsii.member(jsii_name="imageConfig")
    def image_config(self) -> SagemakerModelPrimaryContainerImageConfigOutputReference:
        return typing.cast(SagemakerModelPrimaryContainerImageConfigOutputReference, jsii.get(self, "imageConfig"))

    @builtins.property
    @jsii.member(jsii_name="modelDataSource")
    def model_data_source(
        self,
    ) -> SagemakerModelPrimaryContainerModelDataSourceOutputReference:
        return typing.cast(SagemakerModelPrimaryContainerModelDataSourceOutputReference, jsii.get(self, "modelDataSource"))

    @builtins.property
    @jsii.member(jsii_name="multiModelConfig")
    def multi_model_config(
        self,
    ) -> SagemakerModelPrimaryContainerMultiModelConfigOutputReference:
        return typing.cast(SagemakerModelPrimaryContainerMultiModelConfigOutputReference, jsii.get(self, "multiModelConfig"))

    @builtins.property
    @jsii.member(jsii_name="containerHostnameInput")
    def container_hostname_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "containerHostnameInput"))

    @builtins.property
    @jsii.member(jsii_name="environmentInput")
    def environment_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "environmentInput"))

    @builtins.property
    @jsii.member(jsii_name="imageConfigInput")
    def image_config_input(
        self,
    ) -> typing.Optional[SagemakerModelPrimaryContainerImageConfig]:
        return typing.cast(typing.Optional[SagemakerModelPrimaryContainerImageConfig], jsii.get(self, "imageConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="imageInput")
    def image_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "imageInput"))

    @builtins.property
    @jsii.member(jsii_name="inferenceSpecificationNameInput")
    def inference_specification_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "inferenceSpecificationNameInput"))

    @builtins.property
    @jsii.member(jsii_name="modeInput")
    def mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "modeInput"))

    @builtins.property
    @jsii.member(jsii_name="modelDataSourceInput")
    def model_data_source_input(
        self,
    ) -> typing.Optional[SagemakerModelPrimaryContainerModelDataSource]:
        return typing.cast(typing.Optional[SagemakerModelPrimaryContainerModelDataSource], jsii.get(self, "modelDataSourceInput"))

    @builtins.property
    @jsii.member(jsii_name="modelDataUrlInput")
    def model_data_url_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "modelDataUrlInput"))

    @builtins.property
    @jsii.member(jsii_name="modelPackageNameInput")
    def model_package_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "modelPackageNameInput"))

    @builtins.property
    @jsii.member(jsii_name="multiModelConfigInput")
    def multi_model_config_input(
        self,
    ) -> typing.Optional[SagemakerModelPrimaryContainerMultiModelConfig]:
        return typing.cast(typing.Optional[SagemakerModelPrimaryContainerMultiModelConfig], jsii.get(self, "multiModelConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="containerHostname")
    def container_hostname(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "containerHostname"))

    @container_hostname.setter
    def container_hostname(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c09c7d71b96b8498570c2e5f46ed2f2473a3b90aba721be0322fe55b7a72763)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "containerHostname", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="environment")
    def environment(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "environment"))

    @environment.setter
    def environment(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea872be9ea5bade65ace6f70852397329a8497160c642d2341268c513cbf4222)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "environment", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="image")
    def image(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "image"))

    @image.setter
    def image(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__92f7bf8675b10779b72b73324ccb2b77a81ba21051e24bc866b9b2a9a26ef6d6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "image", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="inferenceSpecificationName")
    def inference_specification_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "inferenceSpecificationName"))

    @inference_specification_name.setter
    def inference_specification_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d394c70e5ef742be4b0c65774c9f47f40c8901ea202bbde7b0743786d3d0ef23)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "inferenceSpecificationName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="mode")
    def mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mode"))

    @mode.setter
    def mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1fb9193af8efcf6713363710dc8dff484c86f89d0efd4060cb1baca46b3571c7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="modelDataUrl")
    def model_data_url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "modelDataUrl"))

    @model_data_url.setter
    def model_data_url(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e3dcd5dc71ed52a73dfc9151af7414652e91fb7d7480c82e1cbf7d67aa0a4759)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "modelDataUrl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="modelPackageName")
    def model_package_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "modelPackageName"))

    @model_package_name.setter
    def model_package_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a925a0fb1f478adff8f123ae86534405baf508904a57f702125d232e21bb3e38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "modelPackageName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[SagemakerModelPrimaryContainer]:
        return typing.cast(typing.Optional[SagemakerModelPrimaryContainer], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerModelPrimaryContainer],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f81493d7a56028c365af6279ad4873c18d130aea97745dfa4fad5720f9c8418a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerModel.SagemakerModelVpcConfig",
    jsii_struct_bases=[],
    name_mapping={"security_group_ids": "securityGroupIds", "subnets": "subnets"},
)
class SagemakerModelVpcConfig:
    def __init__(
        self,
        *,
        security_group_ids: typing.Sequence[builtins.str],
        subnets: typing.Sequence[builtins.str],
    ) -> None:
        '''
        :param security_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#security_group_ids SagemakerModel#security_group_ids}.
        :param subnets: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#subnets SagemakerModel#subnets}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__506f6246b4ed7a99fa8366dd1d81e202b2cbfcb0bf7ab735e431c3ff92736c24)
            check_type(argname="argument security_group_ids", value=security_group_ids, expected_type=type_hints["security_group_ids"])
            check_type(argname="argument subnets", value=subnets, expected_type=type_hints["subnets"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "security_group_ids": security_group_ids,
            "subnets": subnets,
        }

    @builtins.property
    def security_group_ids(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#security_group_ids SagemakerModel#security_group_ids}.'''
        result = self._values.get("security_group_ids")
        assert result is not None, "Required property 'security_group_ids' is missing"
        return typing.cast(typing.List[builtins.str], result)

    @builtins.property
    def subnets(self) -> typing.List[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#subnets SagemakerModel#subnets}.'''
        result = self._values.get("subnets")
        assert result is not None, "Required property 'subnets' is missing"
        return typing.cast(typing.List[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerModelVpcConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerModelVpcConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerModel.SagemakerModelVpcConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c80103e7e751b6329ff63ec4a0186155f398020b0e9d24ae53dd86e1db7c9ca2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="securityGroupIdsInput")
    def security_group_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "securityGroupIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetsInput")
    def subnets_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "subnetsInput"))

    @builtins.property
    @jsii.member(jsii_name="securityGroupIds")
    def security_group_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "securityGroupIds"))

    @security_group_ids.setter
    def security_group_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0031bbac5b3a5d38ba9cfff701672c7043ef02d791ff6d3598ed80f3aa0323fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityGroupIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnets")
    def subnets(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "subnets"))

    @subnets.setter
    def subnets(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9663b342bf03f5bd08754c9d13b362acf21a01c5fed103f10feb224592c343d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnets", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[SagemakerModelVpcConfig]:
        return typing.cast(typing.Optional[SagemakerModelVpcConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(self, value: typing.Optional[SagemakerModelVpcConfig]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__980d2e5e2fb15656be3e58d1b37856a454b6b2a00471e95e40802d06b532c35e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "SagemakerModel",
    "SagemakerModelConfig",
    "SagemakerModelContainer",
    "SagemakerModelContainerImageConfig",
    "SagemakerModelContainerImageConfigOutputReference",
    "SagemakerModelContainerImageConfigRepositoryAuthConfig",
    "SagemakerModelContainerImageConfigRepositoryAuthConfigOutputReference",
    "SagemakerModelContainerList",
    "SagemakerModelContainerModelDataSource",
    "SagemakerModelContainerModelDataSourceOutputReference",
    "SagemakerModelContainerModelDataSourceS3DataSource",
    "SagemakerModelContainerModelDataSourceS3DataSourceList",
    "SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig",
    "SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference",
    "SagemakerModelContainerModelDataSourceS3DataSourceOutputReference",
    "SagemakerModelContainerMultiModelConfig",
    "SagemakerModelContainerMultiModelConfigOutputReference",
    "SagemakerModelContainerOutputReference",
    "SagemakerModelInferenceExecutionConfig",
    "SagemakerModelInferenceExecutionConfigOutputReference",
    "SagemakerModelPrimaryContainer",
    "SagemakerModelPrimaryContainerImageConfig",
    "SagemakerModelPrimaryContainerImageConfigOutputReference",
    "SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig",
    "SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfigOutputReference",
    "SagemakerModelPrimaryContainerModelDataSource",
    "SagemakerModelPrimaryContainerModelDataSourceOutputReference",
    "SagemakerModelPrimaryContainerModelDataSourceS3DataSource",
    "SagemakerModelPrimaryContainerModelDataSourceS3DataSourceList",
    "SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig",
    "SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfigOutputReference",
    "SagemakerModelPrimaryContainerModelDataSourceS3DataSourceOutputReference",
    "SagemakerModelPrimaryContainerMultiModelConfig",
    "SagemakerModelPrimaryContainerMultiModelConfigOutputReference",
    "SagemakerModelPrimaryContainerOutputReference",
    "SagemakerModelVpcConfig",
    "SagemakerModelVpcConfigOutputReference",
]

publication.publish()

def _typecheckingstub__3b926ca41157f2c97323550521a18e84e99ce549d391c9a46d7e596d2b83ab75(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    execution_role_arn: builtins.str,
    container: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerModelContainer, typing.Dict[builtins.str, typing.Any]]]]] = None,
    enable_network_isolation: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    id: typing.Optional[builtins.str] = None,
    inference_execution_config: typing.Optional[typing.Union[SagemakerModelInferenceExecutionConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    primary_container: typing.Optional[typing.Union[SagemakerModelPrimaryContainer, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    vpc_config: typing.Optional[typing.Union[SagemakerModelVpcConfig, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__ef4c72949a39c43dd43da653444d35851d9b6f326bbc4a39547ebe18f33d61a0(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e8319b1984f7e32a782c1011e55eee9d571a1008f787d8e7ce5c5c8cdc49d1e9(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerModelContainer, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__98cba6678093db4c84f91442fdb972f496bef43edf4d1e718a0409e6b17991b2(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf24f858ca60fefb3062a10f10b4808d2d5d53f4611e5ecff5a3ab271daedbe0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__450f2848f2b4970d619549d5e5836b3027ba59c251e5b3bfdd60815a180bb52b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b4ebfa771daaabb75f245ce5735c33b56640819668a55383b9ffac17c2ed70d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ad02ab42255bd6ef9e871159c580fd2ed842e404e8215eee21cf261336ca91c(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__13cf3de26fdff32ebae45ce25d435f350ac2f77024297c36f6ea8e73aae036ab(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ce7b4e1aa510494063e70ae7cba231f5ff48e0152c5b7e1cb4d53827e19911d(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    execution_role_arn: builtins.str,
    container: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerModelContainer, typing.Dict[builtins.str, typing.Any]]]]] = None,
    enable_network_isolation: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    id: typing.Optional[builtins.str] = None,
    inference_execution_config: typing.Optional[typing.Union[SagemakerModelInferenceExecutionConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    name: typing.Optional[builtins.str] = None,
    primary_container: typing.Optional[typing.Union[SagemakerModelPrimaryContainer, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    vpc_config: typing.Optional[typing.Union[SagemakerModelVpcConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__abf47ed3218d093b3ea3a44755607151e4585fb9b364aba53e6e3d2ad0c880a9(
    *,
    container_hostname: typing.Optional[builtins.str] = None,
    environment: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    image: typing.Optional[builtins.str] = None,
    image_config: typing.Optional[typing.Union[SagemakerModelContainerImageConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    inference_specification_name: typing.Optional[builtins.str] = None,
    mode: typing.Optional[builtins.str] = None,
    model_data_source: typing.Optional[typing.Union[SagemakerModelContainerModelDataSource, typing.Dict[builtins.str, typing.Any]]] = None,
    model_data_url: typing.Optional[builtins.str] = None,
    model_package_name: typing.Optional[builtins.str] = None,
    multi_model_config: typing.Optional[typing.Union[SagemakerModelContainerMultiModelConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__601ff3abb00d8f8d3adb9049cbabf84e19d71213bf2ca1be350ec66c63e60dc5(
    *,
    repository_access_mode: builtins.str,
    repository_auth_config: typing.Optional[typing.Union[SagemakerModelContainerImageConfigRepositoryAuthConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e090595dff892245f430d59490ca26276a4ffa65d94d0ac6f4ad5cd071e77719(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__877e63eb32273e6c7a7cb9e13eff1c4a842c962b46da26f828e8f5846ec82493(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__317e690a7479bf551048aef56cd667edfdcf3fe735779a3f616a959cf871ad32(
    value: typing.Optional[SagemakerModelContainerImageConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__970bc6dce10a2d7cecfcb3c6fe7a981ead4d8d653f6d198bdfd03c53af01cbca(
    *,
    repository_credentials_provider_arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec810c0b9fe499d0896081b99807d886ceab4d808b3c0626ee1298990a48c896(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b09c485adfe2a44e30e1b6f2e3c6d0674fe1745e32b2f9c7b244d2f0115e80d5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6460770d2c98e2a824fc8e5e9155da5c2353d59e7c900deb9a611762eb580f3b(
    value: typing.Optional[SagemakerModelContainerImageConfigRepositoryAuthConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54e70120c4ab321bdff0d55d85c0def63394bb200473b8e47a750f4edd48dc73(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0305faf3c3f1a67e8ee3e7718ec855c8d9552e5d4b384488ec853adb747ef213(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea2109a46fba8089797db69ed098fdf9c88af4e5e5f4e29d7cc2facae7a2233a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__70e502139ee72d0b3147524335fa1a086d9b67497f28200de89bc8e2d8446c53(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ccc826beb9dce839ca01471cf795a2fda05015ddbf46fa2fa499ef1d5c91d1d9(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ae0287258236d48597998e98ef8873af9d7699f3e5e0639617fad4c00cd006f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerModelContainer]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c49d83c50b579dff5c7fb23fa5a82056acc2863059800adc54a9fc5e1165fee5(
    *,
    s3_data_source: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerModelContainerModelDataSourceS3DataSource, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bfd929ab43cc25279b53d798ed493dd4396ef4427494e5e03cd85a4526344835(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efd85d527d2af1316802867bb6ff6890ac9b750aff1fcba7fd7f5ec34a5ba3f9(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerModelContainerModelDataSourceS3DataSource, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9bbf597dafe0c13dc8565045ab0858eb6fcb65ddfa4c9bdbbcfb7adf391877c6(
    value: typing.Optional[SagemakerModelContainerModelDataSource],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3338fcc4f5560706cfa96d3c59b867ca1cfa43d844247d443b0f30a0ac5e187c(
    *,
    compression_type: builtins.str,
    s3_data_type: builtins.str,
    s3_uri: builtins.str,
    model_access_config: typing.Optional[typing.Union[SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__36e19d0908ddae22245aed5df07782e5d158f67c7d22c6991ca20f9b834e248a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f3877a5fbce27ceaa2d92f656b009a469130bfade7a24373dcaac3ce5ada06f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__66cd60eedd2814d891aef461a45a3eac7f69cebc8fe0021835f644e7a86fb207(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2eb612f7174232bfea91afe1df871a05c6da44a499231c3ec5c1f02c8528b39(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb644096ec1f4ad2d6a7fd032fd7de42bde765ab27cc67f72c8167b105b2781d(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee0b679c735c3345446395a268f1376c1df276f79646ca896db435b0c56178dd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerModelContainerModelDataSourceS3DataSource]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa1dad06c3c1de00c8457cd6d1e123a4f283c44187cc5af4c004cca9ed075a30(
    *,
    accept_eula: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8636a2509c503bfa286d6c00a7ba9a3fc1e4b3bac7faf72e5f117eb5e5e86ff6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e49ec4d53fffd6cbc8945a15cdd99cf8c7208cffbe7e3a4e22cf7c5474ab812(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18799896734ddb28081e0dfe544be927526eb73ce80050c7e99271047ab91a89(
    value: typing.Optional[SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd2cbea3b1fbf7ddb3692b961ac413cd356cd5b7e5d48ab74ce58f679edd1e20(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc4dbf115cc4987e12e6cb73fc9696fe92ea302c4a288f9558cdbcf3deef4ee8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60f7367e2e261a46a44db6b8f640e72f8ed8b76af64612ca2bbc53bfcd9fed7c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b240dd86f7d02b6575291b396b408e5c2be70ee488e3a03c27a6b26f74b2deba(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5abae06d619624c6fff71e6478ffffbd88ac7c2ebc0a8ec495adcb781ad0b8d1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerModelContainerModelDataSourceS3DataSource]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6e7d7d431745e6fd23d66f3e425145563808c6271dd3fff6cd3e2344513406a(
    *,
    model_cache_setting: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__792c7514eab9ce6019f3f2c1fb7d6e10650b4accb4c200fbcea0e638424bcbe2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae75a9851b4ca9d77a1e1d852dd1f2baac9331362ba6ea8ea7dfab8e75cdaea5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__017de9eab2237bf540272dd8805aeac774557e483d962746a0d4761082813f6c(
    value: typing.Optional[SagemakerModelContainerMultiModelConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c6937470a7712f0938aabb7d06cd98c4be5b9b5064c3d1e0543531c54c41d1d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2174b79aea18859d9bc92844ee8f91dd6fc9ca502eb536330a1333c2d7fb58a0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3f8e0d3497d31afedffe0b70b7778bc6ada87c1417a724c09b1bc2896cc1ee9(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54f026ba32fe3669b06fcf992fc409767528d911ffe81d0ffa5a39e189de5a7b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed4744a5abbe368ec43a4bba681b6a16be7499db3fd8175c44401fe3db8aafe2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cdaf3de0f7881fdfa6e185d23a01c022073f8c093fc9147704b2b731aa0c61af(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5af14c995d6fc8b2346955d7eb67416bdf15115eb63e5e3beec40df332167c51(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c8459296509031769ece9a2d698ef199b6b7dd2cca8913c3654fdf93a408888(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87093dac45f29e0ea1810ac12e8e3bf096fd4fc5e418710814caee1456a55d19(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerModelContainer]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c44050cae8e3e5c739f6dda03903fd3d648d734dd522a770f43757a8bb254a05(
    *,
    mode: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c158a4b787fcb58c4d388830097d668dab52419028512c5001de3f9740c46b3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2fcdab0d449af795c6eef41446c549db122f72e5c8b198ff83ff37c7f27e070d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__829a0ad8711b036676f14b48d3e8ba2cef36dc7789579e4358298e0902c475f4(
    value: typing.Optional[SagemakerModelInferenceExecutionConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__09677e8b8ed8a792bb296efd920b0f1fc124512af892887eb8f05fe76fca795b(
    *,
    container_hostname: typing.Optional[builtins.str] = None,
    environment: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    image: typing.Optional[builtins.str] = None,
    image_config: typing.Optional[typing.Union[SagemakerModelPrimaryContainerImageConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    inference_specification_name: typing.Optional[builtins.str] = None,
    mode: typing.Optional[builtins.str] = None,
    model_data_source: typing.Optional[typing.Union[SagemakerModelPrimaryContainerModelDataSource, typing.Dict[builtins.str, typing.Any]]] = None,
    model_data_url: typing.Optional[builtins.str] = None,
    model_package_name: typing.Optional[builtins.str] = None,
    multi_model_config: typing.Optional[typing.Union[SagemakerModelPrimaryContainerMultiModelConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7d98e1bcabfe62305d445f719d17f7f9f92ad610f64551d8820e41b2aa14fa1(
    *,
    repository_access_mode: builtins.str,
    repository_auth_config: typing.Optional[typing.Union[SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bcfa9c94510113650d908daed47edb8ac7f192e2131a3ed45320b69c9775f1f2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2065808d4c3035309076dea026b062a69aaa7e40ee9cb2996e00d159e7b23c8d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a02acb964fa4798a549e23d9c4768d9fe93ff27bded7efe68c10c50730a6f8ef(
    value: typing.Optional[SagemakerModelPrimaryContainerImageConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a8a2ad5f058dbda59c9b6add4799abf2ce659e117fd708deb8dc22ebd189991(
    *,
    repository_credentials_provider_arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ee36ff029eb3744cfd4752b5efda94f6d95fa89466cd85754279ae722035813(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4402976bb81d65d4afa052ece34f27a015266ecfa1e34de18154ff95dc8dacad(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6bcb15a7c39402dc1a6913361672cab18b1a266ebe1bab85c08cd8e664fd6e95(
    value: typing.Optional[SagemakerModelPrimaryContainerImageConfigRepositoryAuthConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6184d8b0721243e388c8a5ea0469143eea87b56fff17a079c8dfa4cdab31663e(
    *,
    s3_data_source: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerModelPrimaryContainerModelDataSourceS3DataSource, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a23ba12485f678915c3bad29fa670060fc2f0fb81bea424b99c5ca00134dc167(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c36c7b7282ec44c5c99914c42db89cdda7bdb0f6b524ff69a260272f7fb2f55a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerModelPrimaryContainerModelDataSourceS3DataSource, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a488bd5d69d2edd33076d22d5b9da49fa7777126c7db5ecaa84c413356958138(
    value: typing.Optional[SagemakerModelPrimaryContainerModelDataSource],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf60f6708a79f75818704eeb7fcdcca7e178a598c741ca2be441ce1d0770d5ea(
    *,
    compression_type: builtins.str,
    s3_data_type: builtins.str,
    s3_uri: builtins.str,
    model_access_config: typing.Optional[typing.Union[SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cfe179fde506b893e1b16aab29bb58de48619b3a7177738bf1ce7311fa76976c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76e573dc0708d794846fadc275d9af94646d1221428aa3e94fdc8aeab575003a(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d37cfa47faeeb7924500b5afc882a795304005141e322e6b58b672a3dfa770db(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c253dcab45006eeb7297770b0dbd036d45a3c8c362c9734a24de810a8f371a88(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d03037e1e3f2539259cb4ea956786e8b110daebb4e6b371c433b6ed15f5b03f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93fd7dd81914d7dc56639ee23a6a01950bac57153c0c7b0897ce69cf6a86ddc2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerModelPrimaryContainerModelDataSourceS3DataSource]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3082b2e4a83d65b210f45375b92e4c0c8fbb83a50dd54aa4952df02f6d8a9b9c(
    *,
    accept_eula: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f5566620b49611cb004118b69d37aa74d1540ef48464547c6d42d5bec303e3f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f0431efc86de26b4634bb53f319ea5f6e530091dd99f9794da1b71434c432e3(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15012d5e0605712a78316802ddecd2f07e8c86bf15be00759d5c20865660e68e(
    value: typing.Optional[SagemakerModelPrimaryContainerModelDataSourceS3DataSourceModelAccessConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__221d18391f3749a4af10006cdc5d62eab6adf409398e0080eb1b123e60449237(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__69618e75016ac84ee1cd676d238b6b2869de48918c7c221d949bfc58fc65dd64(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__23c6d005acd6b2bca6914b07bc5762cd75792a2c0f683ddb00f63f514c6697b0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ef43d5b216cb4a9c2ec7570c386316f3c77e3c7949f1ffac7ccfff71f21b29b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__594fa6109121f2df6bfb5c3b60457ce3c547e6767cf875fd85fae93b0915eb2e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerModelPrimaryContainerModelDataSourceS3DataSource]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d42125a59646f01ad3a25ef2f3c968eb1653354217ebd94df0fb18f5e67af15(
    *,
    model_cache_setting: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e81b9d8f3d99d3be5eddd1842b1f4b66a8904e5f5bd9e4bee83274400ff76154(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8642043d5722448a8b7ad6706285fe5758bbcf5de4b3b378de8c0273433ea9fb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c582febbecb3209cc191080fc3c067187567968310f2e46e62051b3c7c1488d(
    value: typing.Optional[SagemakerModelPrimaryContainerMultiModelConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41c8c3993434d68a0056a6d764970c928f62cf6c91c76254feb8ef2c7527c706(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c09c7d71b96b8498570c2e5f46ed2f2473a3b90aba721be0322fe55b7a72763(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea872be9ea5bade65ace6f70852397329a8497160c642d2341268c513cbf4222(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__92f7bf8675b10779b72b73324ccb2b77a81ba21051e24bc866b9b2a9a26ef6d6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d394c70e5ef742be4b0c65774c9f47f40c8901ea202bbde7b0743786d3d0ef23(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1fb9193af8efcf6713363710dc8dff484c86f89d0efd4060cb1baca46b3571c7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3dcd5dc71ed52a73dfc9151af7414652e91fb7d7480c82e1cbf7d67aa0a4759(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a925a0fb1f478adff8f123ae86534405baf508904a57f702125d232e21bb3e38(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f81493d7a56028c365af6279ad4873c18d130aea97745dfa4fad5720f9c8418a(
    value: typing.Optional[SagemakerModelPrimaryContainer],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__506f6246b4ed7a99fa8366dd1d81e202b2cbfcb0bf7ab735e431c3ff92736c24(
    *,
    security_group_ids: typing.Sequence[builtins.str],
    subnets: typing.Sequence[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c80103e7e751b6329ff63ec4a0186155f398020b0e9d24ae53dd86e1db7c9ca2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0031bbac5b3a5d38ba9cfff701672c7043ef02d791ff6d3598ed80f3aa0323fb(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9663b342bf03f5bd08754c9d13b362acf21a01c5fed103f10feb224592c343d(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__980d2e5e2fb15656be3e58d1b37856a454b6b2a00471e95e40802d06b532c35e(
    value: typing.Optional[SagemakerModelVpcConfig],
) -> None:
    """Type checking stubs"""
    pass
