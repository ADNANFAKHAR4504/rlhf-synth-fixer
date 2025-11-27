r'''
# `aws_sagemaker_app_image_config`

Refer to the Terraform Registry for docs: [`aws_sagemaker_app_image_config`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config).
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


class SagemakerAppImageConfig(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfig",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config aws_sagemaker_app_image_config}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        app_image_config_name: builtins.str,
        code_editor_app_image_config: typing.Optional[typing.Union["SagemakerAppImageConfigCodeEditorAppImageConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        jupyter_lab_image_config: typing.Optional[typing.Union["SagemakerAppImageConfigJupyterLabImageConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        kernel_gateway_image_config: typing.Optional[typing.Union["SagemakerAppImageConfigKernelGatewayImageConfig", typing.Dict[builtins.str, typing.Any]]] = None,
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
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config aws_sagemaker_app_image_config} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param app_image_config_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#app_image_config_name SagemakerAppImageConfig#app_image_config_name}.
        :param code_editor_app_image_config: code_editor_app_image_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#code_editor_app_image_config SagemakerAppImageConfig#code_editor_app_image_config}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#id SagemakerAppImageConfig#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param jupyter_lab_image_config: jupyter_lab_image_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#jupyter_lab_image_config SagemakerAppImageConfig#jupyter_lab_image_config}
        :param kernel_gateway_image_config: kernel_gateway_image_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#kernel_gateway_image_config SagemakerAppImageConfig#kernel_gateway_image_config}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#tags SagemakerAppImageConfig#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#tags_all SagemakerAppImageConfig#tags_all}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e1a97d92f257725988aaabbbf9f97181ca04eeb5628816082114212b8b65fc38)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = SagemakerAppImageConfigConfig(
            app_image_config_name=app_image_config_name,
            code_editor_app_image_config=code_editor_app_image_config,
            id=id,
            jupyter_lab_image_config=jupyter_lab_image_config,
            kernel_gateway_image_config=kernel_gateway_image_config,
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
        '''Generates CDKTF code for importing a SagemakerAppImageConfig resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the SagemakerAppImageConfig to import.
        :param import_from_id: The id of the existing SagemakerAppImageConfig that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the SagemakerAppImageConfig to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f77fe4dffc09571ed2ec8b356ecc6434732c5e77089c98b15077d2a2ef185a9d)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putCodeEditorAppImageConfig")
    def put_code_editor_app_image_config(
        self,
        *,
        container_config: typing.Optional[typing.Union["SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        file_system_config: typing.Optional[typing.Union["SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param container_config: container_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_config SagemakerAppImageConfig#container_config}
        :param file_system_config: file_system_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
        '''
        value = SagemakerAppImageConfigCodeEditorAppImageConfig(
            container_config=container_config, file_system_config=file_system_config
        )

        return typing.cast(None, jsii.invoke(self, "putCodeEditorAppImageConfig", [value]))

    @jsii.member(jsii_name="putJupyterLabImageConfig")
    def put_jupyter_lab_image_config(
        self,
        *,
        container_config: typing.Optional[typing.Union["SagemakerAppImageConfigJupyterLabImageConfigContainerConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        file_system_config: typing.Optional[typing.Union["SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param container_config: container_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_config SagemakerAppImageConfig#container_config}
        :param file_system_config: file_system_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
        '''
        value = SagemakerAppImageConfigJupyterLabImageConfig(
            container_config=container_config, file_system_config=file_system_config
        )

        return typing.cast(None, jsii.invoke(self, "putJupyterLabImageConfig", [value]))

    @jsii.member(jsii_name="putKernelGatewayImageConfig")
    def put_kernel_gateway_image_config(
        self,
        *,
        kernel_spec: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec", typing.Dict[builtins.str, typing.Any]]]],
        file_system_config: typing.Optional[typing.Union["SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param kernel_spec: kernel_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#kernel_spec SagemakerAppImageConfig#kernel_spec}
        :param file_system_config: file_system_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
        '''
        value = SagemakerAppImageConfigKernelGatewayImageConfig(
            kernel_spec=kernel_spec, file_system_config=file_system_config
        )

        return typing.cast(None, jsii.invoke(self, "putKernelGatewayImageConfig", [value]))

    @jsii.member(jsii_name="resetCodeEditorAppImageConfig")
    def reset_code_editor_app_image_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCodeEditorAppImageConfig", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetJupyterLabImageConfig")
    def reset_jupyter_lab_image_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetJupyterLabImageConfig", []))

    @jsii.member(jsii_name="resetKernelGatewayImageConfig")
    def reset_kernel_gateway_image_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKernelGatewayImageConfig", []))

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
    @jsii.member(jsii_name="codeEditorAppImageConfig")
    def code_editor_app_image_config(
        self,
    ) -> "SagemakerAppImageConfigCodeEditorAppImageConfigOutputReference":
        return typing.cast("SagemakerAppImageConfigCodeEditorAppImageConfigOutputReference", jsii.get(self, "codeEditorAppImageConfig"))

    @builtins.property
    @jsii.member(jsii_name="jupyterLabImageConfig")
    def jupyter_lab_image_config(
        self,
    ) -> "SagemakerAppImageConfigJupyterLabImageConfigOutputReference":
        return typing.cast("SagemakerAppImageConfigJupyterLabImageConfigOutputReference", jsii.get(self, "jupyterLabImageConfig"))

    @builtins.property
    @jsii.member(jsii_name="kernelGatewayImageConfig")
    def kernel_gateway_image_config(
        self,
    ) -> "SagemakerAppImageConfigKernelGatewayImageConfigOutputReference":
        return typing.cast("SagemakerAppImageConfigKernelGatewayImageConfigOutputReference", jsii.get(self, "kernelGatewayImageConfig"))

    @builtins.property
    @jsii.member(jsii_name="appImageConfigNameInput")
    def app_image_config_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "appImageConfigNameInput"))

    @builtins.property
    @jsii.member(jsii_name="codeEditorAppImageConfigInput")
    def code_editor_app_image_config_input(
        self,
    ) -> typing.Optional["SagemakerAppImageConfigCodeEditorAppImageConfig"]:
        return typing.cast(typing.Optional["SagemakerAppImageConfigCodeEditorAppImageConfig"], jsii.get(self, "codeEditorAppImageConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="jupyterLabImageConfigInput")
    def jupyter_lab_image_config_input(
        self,
    ) -> typing.Optional["SagemakerAppImageConfigJupyterLabImageConfig"]:
        return typing.cast(typing.Optional["SagemakerAppImageConfigJupyterLabImageConfig"], jsii.get(self, "jupyterLabImageConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="kernelGatewayImageConfigInput")
    def kernel_gateway_image_config_input(
        self,
    ) -> typing.Optional["SagemakerAppImageConfigKernelGatewayImageConfig"]:
        return typing.cast(typing.Optional["SagemakerAppImageConfigKernelGatewayImageConfig"], jsii.get(self, "kernelGatewayImageConfigInput"))

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
    @jsii.member(jsii_name="appImageConfigName")
    def app_image_config_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "appImageConfigName"))

    @app_image_config_name.setter
    def app_image_config_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__58751a83cecfff149c3b868d8267f081c42d93c013d0292cd4c6d6384a9c75ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "appImageConfigName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc2627c529e3c5408a376c57c3fcd5bc26921bb6ecd8851b9fc58a743c40949d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b90f417f54a79c04942f2f1354edb51fe669f6a3a3a2d0f89391f6123899d04)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__296814731994ca96e7cab5294ab4f3c543bd92a14ec966eb4a1298ed7da700b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigCodeEditorAppImageConfig",
    jsii_struct_bases=[],
    name_mapping={
        "container_config": "containerConfig",
        "file_system_config": "fileSystemConfig",
    },
)
class SagemakerAppImageConfigCodeEditorAppImageConfig:
    def __init__(
        self,
        *,
        container_config: typing.Optional[typing.Union["SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        file_system_config: typing.Optional[typing.Union["SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param container_config: container_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_config SagemakerAppImageConfig#container_config}
        :param file_system_config: file_system_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
        '''
        if isinstance(container_config, dict):
            container_config = SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig(**container_config)
        if isinstance(file_system_config, dict):
            file_system_config = SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig(**file_system_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__52979b5c88bb622d2931651586f7c48d4f3dbd53d4acb110770ffafe0a062a20)
            check_type(argname="argument container_config", value=container_config, expected_type=type_hints["container_config"])
            check_type(argname="argument file_system_config", value=file_system_config, expected_type=type_hints["file_system_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if container_config is not None:
            self._values["container_config"] = container_config
        if file_system_config is not None:
            self._values["file_system_config"] = file_system_config

    @builtins.property
    def container_config(
        self,
    ) -> typing.Optional["SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig"]:
        '''container_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_config SagemakerAppImageConfig#container_config}
        '''
        result = self._values.get("container_config")
        return typing.cast(typing.Optional["SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig"], result)

    @builtins.property
    def file_system_config(
        self,
    ) -> typing.Optional["SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig"]:
        '''file_system_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
        '''
        result = self._values.get("file_system_config")
        return typing.cast(typing.Optional["SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerAppImageConfigCodeEditorAppImageConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig",
    jsii_struct_bases=[],
    name_mapping={
        "container_arguments": "containerArguments",
        "container_entrypoint": "containerEntrypoint",
        "container_environment_variables": "containerEnvironmentVariables",
    },
)
class SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig:
    def __init__(
        self,
        *,
        container_arguments: typing.Optional[typing.Sequence[builtins.str]] = None,
        container_entrypoint: typing.Optional[typing.Sequence[builtins.str]] = None,
        container_environment_variables: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param container_arguments: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_arguments SagemakerAppImageConfig#container_arguments}.
        :param container_entrypoint: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_entrypoint SagemakerAppImageConfig#container_entrypoint}.
        :param container_environment_variables: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_environment_variables SagemakerAppImageConfig#container_environment_variables}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d86a935cea3961343eb334288567638f63a2d7cb8fd6df2a7a3117348173007a)
            check_type(argname="argument container_arguments", value=container_arguments, expected_type=type_hints["container_arguments"])
            check_type(argname="argument container_entrypoint", value=container_entrypoint, expected_type=type_hints["container_entrypoint"])
            check_type(argname="argument container_environment_variables", value=container_environment_variables, expected_type=type_hints["container_environment_variables"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if container_arguments is not None:
            self._values["container_arguments"] = container_arguments
        if container_entrypoint is not None:
            self._values["container_entrypoint"] = container_entrypoint
        if container_environment_variables is not None:
            self._values["container_environment_variables"] = container_environment_variables

    @builtins.property
    def container_arguments(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_arguments SagemakerAppImageConfig#container_arguments}.'''
        result = self._values.get("container_arguments")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def container_entrypoint(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_entrypoint SagemakerAppImageConfig#container_entrypoint}.'''
        result = self._values.get("container_entrypoint")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def container_environment_variables(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_environment_variables SagemakerAppImageConfig#container_environment_variables}.'''
        result = self._values.get("container_environment_variables")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2674ad98178c8d51c2f0cd94be0d5c05894b294eb2ebf756b5454f60ff4009d6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetContainerArguments")
    def reset_container_arguments(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerArguments", []))

    @jsii.member(jsii_name="resetContainerEntrypoint")
    def reset_container_entrypoint(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerEntrypoint", []))

    @jsii.member(jsii_name="resetContainerEnvironmentVariables")
    def reset_container_environment_variables(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerEnvironmentVariables", []))

    @builtins.property
    @jsii.member(jsii_name="containerArgumentsInput")
    def container_arguments_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "containerArgumentsInput"))

    @builtins.property
    @jsii.member(jsii_name="containerEntrypointInput")
    def container_entrypoint_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "containerEntrypointInput"))

    @builtins.property
    @jsii.member(jsii_name="containerEnvironmentVariablesInput")
    def container_environment_variables_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "containerEnvironmentVariablesInput"))

    @builtins.property
    @jsii.member(jsii_name="containerArguments")
    def container_arguments(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "containerArguments"))

    @container_arguments.setter
    def container_arguments(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__955e354d6da68f59e735a27895a68a35836917f93af0b25fb0c1ef65fe3089b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "containerArguments", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="containerEntrypoint")
    def container_entrypoint(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "containerEntrypoint"))

    @container_entrypoint.setter
    def container_entrypoint(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__defd366427f7012ad3c0ecefcd54072bba25b06198ae6f6ef1af40c3357778bd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "containerEntrypoint", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="containerEnvironmentVariables")
    def container_environment_variables(
        self,
    ) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "containerEnvironmentVariables"))

    @container_environment_variables.setter
    def container_environment_variables(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__22e6428ad1cfb2da7f909d3b301fab28e8fe265c3be191ef0a5d894e6ad04c93)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "containerEnvironmentVariables", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96cfd5284942eebb99387abb713eb5425ee2c588ceb94528e859963ece9f3e4f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig",
    jsii_struct_bases=[],
    name_mapping={
        "default_gid": "defaultGid",
        "default_uid": "defaultUid",
        "mount_path": "mountPath",
    },
)
class SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig:
    def __init__(
        self,
        *,
        default_gid: typing.Optional[jsii.Number] = None,
        default_uid: typing.Optional[jsii.Number] = None,
        mount_path: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param default_gid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_gid SagemakerAppImageConfig#default_gid}.
        :param default_uid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_uid SagemakerAppImageConfig#default_uid}.
        :param mount_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#mount_path SagemakerAppImageConfig#mount_path}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b8600d716d0cabe68e3cf8859d820de968241bfc1d67ee9e346d354d16ed846d)
            check_type(argname="argument default_gid", value=default_gid, expected_type=type_hints["default_gid"])
            check_type(argname="argument default_uid", value=default_uid, expected_type=type_hints["default_uid"])
            check_type(argname="argument mount_path", value=mount_path, expected_type=type_hints["mount_path"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if default_gid is not None:
            self._values["default_gid"] = default_gid
        if default_uid is not None:
            self._values["default_uid"] = default_uid
        if mount_path is not None:
            self._values["mount_path"] = mount_path

    @builtins.property
    def default_gid(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_gid SagemakerAppImageConfig#default_gid}.'''
        result = self._values.get("default_gid")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def default_uid(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_uid SagemakerAppImageConfig#default_uid}.'''
        result = self._values.get("default_uid")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def mount_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#mount_path SagemakerAppImageConfig#mount_path}.'''
        result = self._values.get("mount_path")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__27ed33fbf34d7bbe6cfd41feb02428144f543324ec0a24c2d4791f693a338d9e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDefaultGid")
    def reset_default_gid(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultGid", []))

    @jsii.member(jsii_name="resetDefaultUid")
    def reset_default_uid(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultUid", []))

    @jsii.member(jsii_name="resetMountPath")
    def reset_mount_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMountPath", []))

    @builtins.property
    @jsii.member(jsii_name="defaultGidInput")
    def default_gid_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "defaultGidInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultUidInput")
    def default_uid_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "defaultUidInput"))

    @builtins.property
    @jsii.member(jsii_name="mountPathInput")
    def mount_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "mountPathInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultGid")
    def default_gid(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "defaultGid"))

    @default_gid.setter
    def default_gid(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4469bf02e1290ecb15efeac756ceeaa3a28d1e723e019ecc305aa9f5d50828ce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultGid", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="defaultUid")
    def default_uid(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "defaultUid"))

    @default_uid.setter
    def default_uid(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2214489174c73f412dc209b0d1ea84a8b1b0ca8eed887a4bcfc74a0ec719fda2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultUid", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="mountPath")
    def mount_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mountPath"))

    @mount_path.setter
    def mount_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec5a37ab24dafe5194c3de879112ee82c42ad67c035158336ada864177e74fbb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mountPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d763207d28ca0439e1a4ca577d2c7db440a2e1be6dec862e8b2628e7d3f6e717)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerAppImageConfigCodeEditorAppImageConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigCodeEditorAppImageConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ecaff8f3b4faacf15577f51235871192ac51e44cf58b488877d764f286f85ab9)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putContainerConfig")
    def put_container_config(
        self,
        *,
        container_arguments: typing.Optional[typing.Sequence[builtins.str]] = None,
        container_entrypoint: typing.Optional[typing.Sequence[builtins.str]] = None,
        container_environment_variables: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param container_arguments: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_arguments SagemakerAppImageConfig#container_arguments}.
        :param container_entrypoint: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_entrypoint SagemakerAppImageConfig#container_entrypoint}.
        :param container_environment_variables: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_environment_variables SagemakerAppImageConfig#container_environment_variables}.
        '''
        value = SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig(
            container_arguments=container_arguments,
            container_entrypoint=container_entrypoint,
            container_environment_variables=container_environment_variables,
        )

        return typing.cast(None, jsii.invoke(self, "putContainerConfig", [value]))

    @jsii.member(jsii_name="putFileSystemConfig")
    def put_file_system_config(
        self,
        *,
        default_gid: typing.Optional[jsii.Number] = None,
        default_uid: typing.Optional[jsii.Number] = None,
        mount_path: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param default_gid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_gid SagemakerAppImageConfig#default_gid}.
        :param default_uid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_uid SagemakerAppImageConfig#default_uid}.
        :param mount_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#mount_path SagemakerAppImageConfig#mount_path}.
        '''
        value = SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig(
            default_gid=default_gid, default_uid=default_uid, mount_path=mount_path
        )

        return typing.cast(None, jsii.invoke(self, "putFileSystemConfig", [value]))

    @jsii.member(jsii_name="resetContainerConfig")
    def reset_container_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerConfig", []))

    @jsii.member(jsii_name="resetFileSystemConfig")
    def reset_file_system_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFileSystemConfig", []))

    @builtins.property
    @jsii.member(jsii_name="containerConfig")
    def container_config(
        self,
    ) -> SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfigOutputReference:
        return typing.cast(SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfigOutputReference, jsii.get(self, "containerConfig"))

    @builtins.property
    @jsii.member(jsii_name="fileSystemConfig")
    def file_system_config(
        self,
    ) -> SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfigOutputReference:
        return typing.cast(SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfigOutputReference, jsii.get(self, "fileSystemConfig"))

    @builtins.property
    @jsii.member(jsii_name="containerConfigInput")
    def container_config_input(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig], jsii.get(self, "containerConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="fileSystemConfigInput")
    def file_system_config_input(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig], jsii.get(self, "fileSystemConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9bd3a250971186c90470d3bd003ca130decd34fe97476571697d940566d21dbe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "app_image_config_name": "appImageConfigName",
        "code_editor_app_image_config": "codeEditorAppImageConfig",
        "id": "id",
        "jupyter_lab_image_config": "jupyterLabImageConfig",
        "kernel_gateway_image_config": "kernelGatewayImageConfig",
        "tags": "tags",
        "tags_all": "tagsAll",
    },
)
class SagemakerAppImageConfigConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        app_image_config_name: builtins.str,
        code_editor_app_image_config: typing.Optional[typing.Union[SagemakerAppImageConfigCodeEditorAppImageConfig, typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        jupyter_lab_image_config: typing.Optional[typing.Union["SagemakerAppImageConfigJupyterLabImageConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        kernel_gateway_image_config: typing.Optional[typing.Union["SagemakerAppImageConfigKernelGatewayImageConfig", typing.Dict[builtins.str, typing.Any]]] = None,
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
        :param app_image_config_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#app_image_config_name SagemakerAppImageConfig#app_image_config_name}.
        :param code_editor_app_image_config: code_editor_app_image_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#code_editor_app_image_config SagemakerAppImageConfig#code_editor_app_image_config}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#id SagemakerAppImageConfig#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param jupyter_lab_image_config: jupyter_lab_image_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#jupyter_lab_image_config SagemakerAppImageConfig#jupyter_lab_image_config}
        :param kernel_gateway_image_config: kernel_gateway_image_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#kernel_gateway_image_config SagemakerAppImageConfig#kernel_gateway_image_config}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#tags SagemakerAppImageConfig#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#tags_all SagemakerAppImageConfig#tags_all}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(code_editor_app_image_config, dict):
            code_editor_app_image_config = SagemakerAppImageConfigCodeEditorAppImageConfig(**code_editor_app_image_config)
        if isinstance(jupyter_lab_image_config, dict):
            jupyter_lab_image_config = SagemakerAppImageConfigJupyterLabImageConfig(**jupyter_lab_image_config)
        if isinstance(kernel_gateway_image_config, dict):
            kernel_gateway_image_config = SagemakerAppImageConfigKernelGatewayImageConfig(**kernel_gateway_image_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9c31092c5cd5379fa6fa7827cd230ca909537b300ad667000e7eb9859f00e4ec)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument app_image_config_name", value=app_image_config_name, expected_type=type_hints["app_image_config_name"])
            check_type(argname="argument code_editor_app_image_config", value=code_editor_app_image_config, expected_type=type_hints["code_editor_app_image_config"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument jupyter_lab_image_config", value=jupyter_lab_image_config, expected_type=type_hints["jupyter_lab_image_config"])
            check_type(argname="argument kernel_gateway_image_config", value=kernel_gateway_image_config, expected_type=type_hints["kernel_gateway_image_config"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "app_image_config_name": app_image_config_name,
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
        if code_editor_app_image_config is not None:
            self._values["code_editor_app_image_config"] = code_editor_app_image_config
        if id is not None:
            self._values["id"] = id
        if jupyter_lab_image_config is not None:
            self._values["jupyter_lab_image_config"] = jupyter_lab_image_config
        if kernel_gateway_image_config is not None:
            self._values["kernel_gateway_image_config"] = kernel_gateway_image_config
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
    def app_image_config_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#app_image_config_name SagemakerAppImageConfig#app_image_config_name}.'''
        result = self._values.get("app_image_config_name")
        assert result is not None, "Required property 'app_image_config_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def code_editor_app_image_config(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfig]:
        '''code_editor_app_image_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#code_editor_app_image_config SagemakerAppImageConfig#code_editor_app_image_config}
        '''
        result = self._values.get("code_editor_app_image_config")
        return typing.cast(typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfig], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#id SagemakerAppImageConfig#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def jupyter_lab_image_config(
        self,
    ) -> typing.Optional["SagemakerAppImageConfigJupyterLabImageConfig"]:
        '''jupyter_lab_image_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#jupyter_lab_image_config SagemakerAppImageConfig#jupyter_lab_image_config}
        '''
        result = self._values.get("jupyter_lab_image_config")
        return typing.cast(typing.Optional["SagemakerAppImageConfigJupyterLabImageConfig"], result)

    @builtins.property
    def kernel_gateway_image_config(
        self,
    ) -> typing.Optional["SagemakerAppImageConfigKernelGatewayImageConfig"]:
        '''kernel_gateway_image_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#kernel_gateway_image_config SagemakerAppImageConfig#kernel_gateway_image_config}
        '''
        result = self._values.get("kernel_gateway_image_config")
        return typing.cast(typing.Optional["SagemakerAppImageConfigKernelGatewayImageConfig"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#tags SagemakerAppImageConfig#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#tags_all SagemakerAppImageConfig#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerAppImageConfigConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigJupyterLabImageConfig",
    jsii_struct_bases=[],
    name_mapping={
        "container_config": "containerConfig",
        "file_system_config": "fileSystemConfig",
    },
)
class SagemakerAppImageConfigJupyterLabImageConfig:
    def __init__(
        self,
        *,
        container_config: typing.Optional[typing.Union["SagemakerAppImageConfigJupyterLabImageConfigContainerConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        file_system_config: typing.Optional[typing.Union["SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param container_config: container_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_config SagemakerAppImageConfig#container_config}
        :param file_system_config: file_system_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
        '''
        if isinstance(container_config, dict):
            container_config = SagemakerAppImageConfigJupyterLabImageConfigContainerConfig(**container_config)
        if isinstance(file_system_config, dict):
            file_system_config = SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig(**file_system_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__41ee5f0c0ad95778f5f17d621e6ecb4a27058edcc4d3ed7c6545d323d445a0c0)
            check_type(argname="argument container_config", value=container_config, expected_type=type_hints["container_config"])
            check_type(argname="argument file_system_config", value=file_system_config, expected_type=type_hints["file_system_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if container_config is not None:
            self._values["container_config"] = container_config
        if file_system_config is not None:
            self._values["file_system_config"] = file_system_config

    @builtins.property
    def container_config(
        self,
    ) -> typing.Optional["SagemakerAppImageConfigJupyterLabImageConfigContainerConfig"]:
        '''container_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_config SagemakerAppImageConfig#container_config}
        '''
        result = self._values.get("container_config")
        return typing.cast(typing.Optional["SagemakerAppImageConfigJupyterLabImageConfigContainerConfig"], result)

    @builtins.property
    def file_system_config(
        self,
    ) -> typing.Optional["SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig"]:
        '''file_system_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
        '''
        result = self._values.get("file_system_config")
        return typing.cast(typing.Optional["SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerAppImageConfigJupyterLabImageConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigJupyterLabImageConfigContainerConfig",
    jsii_struct_bases=[],
    name_mapping={
        "container_arguments": "containerArguments",
        "container_entrypoint": "containerEntrypoint",
        "container_environment_variables": "containerEnvironmentVariables",
    },
)
class SagemakerAppImageConfigJupyterLabImageConfigContainerConfig:
    def __init__(
        self,
        *,
        container_arguments: typing.Optional[typing.Sequence[builtins.str]] = None,
        container_entrypoint: typing.Optional[typing.Sequence[builtins.str]] = None,
        container_environment_variables: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param container_arguments: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_arguments SagemakerAppImageConfig#container_arguments}.
        :param container_entrypoint: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_entrypoint SagemakerAppImageConfig#container_entrypoint}.
        :param container_environment_variables: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_environment_variables SagemakerAppImageConfig#container_environment_variables}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ef4e3077a74085cde0a98064780668774680f7ec54860138210becb030aac7e7)
            check_type(argname="argument container_arguments", value=container_arguments, expected_type=type_hints["container_arguments"])
            check_type(argname="argument container_entrypoint", value=container_entrypoint, expected_type=type_hints["container_entrypoint"])
            check_type(argname="argument container_environment_variables", value=container_environment_variables, expected_type=type_hints["container_environment_variables"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if container_arguments is not None:
            self._values["container_arguments"] = container_arguments
        if container_entrypoint is not None:
            self._values["container_entrypoint"] = container_entrypoint
        if container_environment_variables is not None:
            self._values["container_environment_variables"] = container_environment_variables

    @builtins.property
    def container_arguments(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_arguments SagemakerAppImageConfig#container_arguments}.'''
        result = self._values.get("container_arguments")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def container_entrypoint(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_entrypoint SagemakerAppImageConfig#container_entrypoint}.'''
        result = self._values.get("container_entrypoint")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def container_environment_variables(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_environment_variables SagemakerAppImageConfig#container_environment_variables}.'''
        result = self._values.get("container_environment_variables")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerAppImageConfigJupyterLabImageConfigContainerConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerAppImageConfigJupyterLabImageConfigContainerConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigJupyterLabImageConfigContainerConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5f90748af66945787f4ad92f1e97ba9e5e013ec851e370025215874ef51e2b5a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetContainerArguments")
    def reset_container_arguments(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerArguments", []))

    @jsii.member(jsii_name="resetContainerEntrypoint")
    def reset_container_entrypoint(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerEntrypoint", []))

    @jsii.member(jsii_name="resetContainerEnvironmentVariables")
    def reset_container_environment_variables(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerEnvironmentVariables", []))

    @builtins.property
    @jsii.member(jsii_name="containerArgumentsInput")
    def container_arguments_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "containerArgumentsInput"))

    @builtins.property
    @jsii.member(jsii_name="containerEntrypointInput")
    def container_entrypoint_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "containerEntrypointInput"))

    @builtins.property
    @jsii.member(jsii_name="containerEnvironmentVariablesInput")
    def container_environment_variables_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "containerEnvironmentVariablesInput"))

    @builtins.property
    @jsii.member(jsii_name="containerArguments")
    def container_arguments(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "containerArguments"))

    @container_arguments.setter
    def container_arguments(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea447e52ced834c9a9ca2654dd444c63f86cfb9f46e2b792d189682c4c79a5c7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "containerArguments", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="containerEntrypoint")
    def container_entrypoint(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "containerEntrypoint"))

    @container_entrypoint.setter
    def container_entrypoint(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9a2e3c5fd4369ada103d331cc633e242670570e2821113df7e50f88ef301fbf8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "containerEntrypoint", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="containerEnvironmentVariables")
    def container_environment_variables(
        self,
    ) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "containerEnvironmentVariables"))

    @container_environment_variables.setter
    def container_environment_variables(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5f9c67f2fe8d7aa095b12a05e63da32de913f3569338148e1f7ce951257cbd17)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "containerEnvironmentVariables", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigJupyterLabImageConfigContainerConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigJupyterLabImageConfigContainerConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerAppImageConfigJupyterLabImageConfigContainerConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2dc0db45e42b7b8cfb82045699ffffa142c6d93d4bbe7ea317a08bd77bb26364)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig",
    jsii_struct_bases=[],
    name_mapping={
        "default_gid": "defaultGid",
        "default_uid": "defaultUid",
        "mount_path": "mountPath",
    },
)
class SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig:
    def __init__(
        self,
        *,
        default_gid: typing.Optional[jsii.Number] = None,
        default_uid: typing.Optional[jsii.Number] = None,
        mount_path: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param default_gid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_gid SagemakerAppImageConfig#default_gid}.
        :param default_uid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_uid SagemakerAppImageConfig#default_uid}.
        :param mount_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#mount_path SagemakerAppImageConfig#mount_path}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__792ae2d4eff8951de85ebac92dda634d39c1edc440117c56cba663956b2b7750)
            check_type(argname="argument default_gid", value=default_gid, expected_type=type_hints["default_gid"])
            check_type(argname="argument default_uid", value=default_uid, expected_type=type_hints["default_uid"])
            check_type(argname="argument mount_path", value=mount_path, expected_type=type_hints["mount_path"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if default_gid is not None:
            self._values["default_gid"] = default_gid
        if default_uid is not None:
            self._values["default_uid"] = default_uid
        if mount_path is not None:
            self._values["mount_path"] = mount_path

    @builtins.property
    def default_gid(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_gid SagemakerAppImageConfig#default_gid}.'''
        result = self._values.get("default_gid")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def default_uid(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_uid SagemakerAppImageConfig#default_uid}.'''
        result = self._values.get("default_uid")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def mount_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#mount_path SagemakerAppImageConfig#mount_path}.'''
        result = self._values.get("mount_path")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__76bfb70038dfe2e1cb2b30bb97c95e34f7d705a91da63964b24d03542a7981fd)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDefaultGid")
    def reset_default_gid(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultGid", []))

    @jsii.member(jsii_name="resetDefaultUid")
    def reset_default_uid(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultUid", []))

    @jsii.member(jsii_name="resetMountPath")
    def reset_mount_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMountPath", []))

    @builtins.property
    @jsii.member(jsii_name="defaultGidInput")
    def default_gid_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "defaultGidInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultUidInput")
    def default_uid_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "defaultUidInput"))

    @builtins.property
    @jsii.member(jsii_name="mountPathInput")
    def mount_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "mountPathInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultGid")
    def default_gid(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "defaultGid"))

    @default_gid.setter
    def default_gid(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ce56ce7e34c38b6b973d998915a262eda9e44b53abd2a876126e3d944e32f351)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultGid", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="defaultUid")
    def default_uid(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "defaultUid"))

    @default_uid.setter
    def default_uid(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__569df23895d9c748dbb19325b3b078ce7247aa859d01aa3cd55fad9e0ae7fbd2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultUid", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="mountPath")
    def mount_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mountPath"))

    @mount_path.setter
    def mount_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b39f4bf321bf13005b5fc8166d995d925de80f9cd71089baf12c26bbc5e560c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mountPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bcff2913acc64fbc8f0bd77e2e4e48b89ccc80a606b63e973392c076fc8ca379)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerAppImageConfigJupyterLabImageConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigJupyterLabImageConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dfa942dc93c6655be20a1aaf9ba3bfaf2e2addcf861ca4e23c0f162adeec95f6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putContainerConfig")
    def put_container_config(
        self,
        *,
        container_arguments: typing.Optional[typing.Sequence[builtins.str]] = None,
        container_entrypoint: typing.Optional[typing.Sequence[builtins.str]] = None,
        container_environment_variables: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    ) -> None:
        '''
        :param container_arguments: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_arguments SagemakerAppImageConfig#container_arguments}.
        :param container_entrypoint: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_entrypoint SagemakerAppImageConfig#container_entrypoint}.
        :param container_environment_variables: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_environment_variables SagemakerAppImageConfig#container_environment_variables}.
        '''
        value = SagemakerAppImageConfigJupyterLabImageConfigContainerConfig(
            container_arguments=container_arguments,
            container_entrypoint=container_entrypoint,
            container_environment_variables=container_environment_variables,
        )

        return typing.cast(None, jsii.invoke(self, "putContainerConfig", [value]))

    @jsii.member(jsii_name="putFileSystemConfig")
    def put_file_system_config(
        self,
        *,
        default_gid: typing.Optional[jsii.Number] = None,
        default_uid: typing.Optional[jsii.Number] = None,
        mount_path: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param default_gid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_gid SagemakerAppImageConfig#default_gid}.
        :param default_uid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_uid SagemakerAppImageConfig#default_uid}.
        :param mount_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#mount_path SagemakerAppImageConfig#mount_path}.
        '''
        value = SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig(
            default_gid=default_gid, default_uid=default_uid, mount_path=mount_path
        )

        return typing.cast(None, jsii.invoke(self, "putFileSystemConfig", [value]))

    @jsii.member(jsii_name="resetContainerConfig")
    def reset_container_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetContainerConfig", []))

    @jsii.member(jsii_name="resetFileSystemConfig")
    def reset_file_system_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFileSystemConfig", []))

    @builtins.property
    @jsii.member(jsii_name="containerConfig")
    def container_config(
        self,
    ) -> SagemakerAppImageConfigJupyterLabImageConfigContainerConfigOutputReference:
        return typing.cast(SagemakerAppImageConfigJupyterLabImageConfigContainerConfigOutputReference, jsii.get(self, "containerConfig"))

    @builtins.property
    @jsii.member(jsii_name="fileSystemConfig")
    def file_system_config(
        self,
    ) -> SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfigOutputReference:
        return typing.cast(SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfigOutputReference, jsii.get(self, "fileSystemConfig"))

    @builtins.property
    @jsii.member(jsii_name="containerConfigInput")
    def container_config_input(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigJupyterLabImageConfigContainerConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigJupyterLabImageConfigContainerConfig], jsii.get(self, "containerConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="fileSystemConfigInput")
    def file_system_config_input(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig], jsii.get(self, "fileSystemConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigJupyterLabImageConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigJupyterLabImageConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerAppImageConfigJupyterLabImageConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32317bc1474859d7605d72f46d34080c138885393a90aad3a033619b9eb5111e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigKernelGatewayImageConfig",
    jsii_struct_bases=[],
    name_mapping={
        "kernel_spec": "kernelSpec",
        "file_system_config": "fileSystemConfig",
    },
)
class SagemakerAppImageConfigKernelGatewayImageConfig:
    def __init__(
        self,
        *,
        kernel_spec: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec", typing.Dict[builtins.str, typing.Any]]]],
        file_system_config: typing.Optional[typing.Union["SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param kernel_spec: kernel_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#kernel_spec SagemakerAppImageConfig#kernel_spec}
        :param file_system_config: file_system_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
        '''
        if isinstance(file_system_config, dict):
            file_system_config = SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig(**file_system_config)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e954d3e2d807d128410802e66b1764d4231466005e063f09bd3117305614b28)
            check_type(argname="argument kernel_spec", value=kernel_spec, expected_type=type_hints["kernel_spec"])
            check_type(argname="argument file_system_config", value=file_system_config, expected_type=type_hints["file_system_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "kernel_spec": kernel_spec,
        }
        if file_system_config is not None:
            self._values["file_system_config"] = file_system_config

    @builtins.property
    def kernel_spec(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec"]]:
        '''kernel_spec block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#kernel_spec SagemakerAppImageConfig#kernel_spec}
        '''
        result = self._values.get("kernel_spec")
        assert result is not None, "Required property 'kernel_spec' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec"]], result)

    @builtins.property
    def file_system_config(
        self,
    ) -> typing.Optional["SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig"]:
        '''file_system_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
        '''
        result = self._values.get("file_system_config")
        return typing.cast(typing.Optional["SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerAppImageConfigKernelGatewayImageConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig",
    jsii_struct_bases=[],
    name_mapping={
        "default_gid": "defaultGid",
        "default_uid": "defaultUid",
        "mount_path": "mountPath",
    },
)
class SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig:
    def __init__(
        self,
        *,
        default_gid: typing.Optional[jsii.Number] = None,
        default_uid: typing.Optional[jsii.Number] = None,
        mount_path: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param default_gid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_gid SagemakerAppImageConfig#default_gid}.
        :param default_uid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_uid SagemakerAppImageConfig#default_uid}.
        :param mount_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#mount_path SagemakerAppImageConfig#mount_path}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c076f3c521ee649b7739a6cc68c44ebfd6f7b54b646440af833f7cdb18c5e4e2)
            check_type(argname="argument default_gid", value=default_gid, expected_type=type_hints["default_gid"])
            check_type(argname="argument default_uid", value=default_uid, expected_type=type_hints["default_uid"])
            check_type(argname="argument mount_path", value=mount_path, expected_type=type_hints["mount_path"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if default_gid is not None:
            self._values["default_gid"] = default_gid
        if default_uid is not None:
            self._values["default_uid"] = default_uid
        if mount_path is not None:
            self._values["mount_path"] = mount_path

    @builtins.property
    def default_gid(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_gid SagemakerAppImageConfig#default_gid}.'''
        result = self._values.get("default_gid")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def default_uid(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_uid SagemakerAppImageConfig#default_uid}.'''
        result = self._values.get("default_uid")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def mount_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#mount_path SagemakerAppImageConfig#mount_path}.'''
        result = self._values.get("mount_path")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e69a32b34facc7199f537c461244fafa65d91517aa3a35c07b60df5ecde638d4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDefaultGid")
    def reset_default_gid(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultGid", []))

    @jsii.member(jsii_name="resetDefaultUid")
    def reset_default_uid(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultUid", []))

    @jsii.member(jsii_name="resetMountPath")
    def reset_mount_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMountPath", []))

    @builtins.property
    @jsii.member(jsii_name="defaultGidInput")
    def default_gid_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "defaultGidInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultUidInput")
    def default_uid_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "defaultUidInput"))

    @builtins.property
    @jsii.member(jsii_name="mountPathInput")
    def mount_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "mountPathInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultGid")
    def default_gid(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "defaultGid"))

    @default_gid.setter
    def default_gid(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b74c14a198194360e1e9c0a931682b0f958c3c778f61d443c5ea591eca8a84a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultGid", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="defaultUid")
    def default_uid(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "defaultUid"))

    @default_uid.setter
    def default_uid(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__13aff41772ad2b4bd20a4020ff88957868cd884b2c3a16ef0b183cd500393d5c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultUid", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="mountPath")
    def mount_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mountPath"))

    @mount_path.setter
    def mount_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7494e687f94024a424a4757065d1247f782fd08bfeb21317770d00e4f66ec6cf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mountPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5514b14768993be58edf547ebcc2cd15a5ef3933acd5bae4fc16ed083d644ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec",
    jsii_struct_bases=[],
    name_mapping={"name": "name", "display_name": "displayName"},
)
class SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec:
    def __init__(
        self,
        *,
        name: builtins.str,
        display_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#name SagemakerAppImageConfig#name}.
        :param display_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#display_name SagemakerAppImageConfig#display_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac837070cfe994a7d28506ad101c06f01e7ad1658d5c1af4ed458a2538350ff0)
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument display_name", value=display_name, expected_type=type_hints["display_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "name": name,
        }
        if display_name is not None:
            self._values["display_name"] = display_name

    @builtins.property
    def name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#name SagemakerAppImageConfig#name}.'''
        result = self._values.get("name")
        assert result is not None, "Required property 'name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def display_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#display_name SagemakerAppImageConfig#display_name}.'''
        result = self._values.get("display_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerAppImageConfigKernelGatewayImageConfigKernelSpecList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigKernelGatewayImageConfigKernelSpecList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ca15a67b4147961cb1ae68ae3d04c1029673094c956d82fcaf69436cae2555c1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerAppImageConfigKernelGatewayImageConfigKernelSpecOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9f077cbd9021657640399b2d17b57547dea3303778bb03df0086333c616581b8)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerAppImageConfigKernelGatewayImageConfigKernelSpecOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a211fe877fdf4d859147eeecf40d69415a7c4b2759db16eea7b54d950917d30)
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
            type_hints = typing.get_type_hints(_typecheckingstub__715b71f71c362fd145faaca927c4ffb3d6e482792124b598d04fc43be4c2b90f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3e0192ebc1fdef9cf84cb7a641f7009ad1e3a6f6f90ace75406529614ffb76f3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c499ee83a55683654747c46338f0b1437ee62e2cd43b7139357eb4fccd379a80)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerAppImageConfigKernelGatewayImageConfigKernelSpecOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigKernelGatewayImageConfigKernelSpecOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__82cd1ce64d059f12fb9ed10692ccf01eef4bf3ee8879de44e05648de89e140b0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetDisplayName")
    def reset_display_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDisplayName", []))

    @builtins.property
    @jsii.member(jsii_name="displayNameInput")
    def display_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "displayNameInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="displayName")
    def display_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "displayName"))

    @display_name.setter
    def display_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a4cfdaf5ecf83bf5f66ebf26b9898fff868fc687b32244d541cfb6948ce72220)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "displayName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__781459185de94e86d5269b1c986b1bae1393161a755fc84073b18d5284272296)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__379b94515e0fa83fc37ee350b6f067adf8b499d901f7beff06a619404a4e65fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerAppImageConfigKernelGatewayImageConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerAppImageConfig.SagemakerAppImageConfigKernelGatewayImageConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__42fc284057b8958551ec1f4536c94a2e316e553f7ddaa5e9cc4e090916e625f3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putFileSystemConfig")
    def put_file_system_config(
        self,
        *,
        default_gid: typing.Optional[jsii.Number] = None,
        default_uid: typing.Optional[jsii.Number] = None,
        mount_path: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param default_gid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_gid SagemakerAppImageConfig#default_gid}.
        :param default_uid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#default_uid SagemakerAppImageConfig#default_uid}.
        :param mount_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#mount_path SagemakerAppImageConfig#mount_path}.
        '''
        value = SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig(
            default_gid=default_gid, default_uid=default_uid, mount_path=mount_path
        )

        return typing.cast(None, jsii.invoke(self, "putFileSystemConfig", [value]))

    @jsii.member(jsii_name="putKernelSpec")
    def put_kernel_spec(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b542ebe0f50480636af130712eab55d4d6a1f68f7c8bc192899149a8e8b76f8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putKernelSpec", [value]))

    @jsii.member(jsii_name="resetFileSystemConfig")
    def reset_file_system_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFileSystemConfig", []))

    @builtins.property
    @jsii.member(jsii_name="fileSystemConfig")
    def file_system_config(
        self,
    ) -> SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfigOutputReference:
        return typing.cast(SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfigOutputReference, jsii.get(self, "fileSystemConfig"))

    @builtins.property
    @jsii.member(jsii_name="kernelSpec")
    def kernel_spec(
        self,
    ) -> SagemakerAppImageConfigKernelGatewayImageConfigKernelSpecList:
        return typing.cast(SagemakerAppImageConfigKernelGatewayImageConfigKernelSpecList, jsii.get(self, "kernelSpec"))

    @builtins.property
    @jsii.member(jsii_name="fileSystemConfigInput")
    def file_system_config_input(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig], jsii.get(self, "fileSystemConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="kernelSpecInput")
    def kernel_spec_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec]]], jsii.get(self, "kernelSpecInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerAppImageConfigKernelGatewayImageConfig]:
        return typing.cast(typing.Optional[SagemakerAppImageConfigKernelGatewayImageConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerAppImageConfigKernelGatewayImageConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79cd0f3d79d555c91b0cc892495477f0479b1ee4834621ac123c8b95ccb2c019)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "SagemakerAppImageConfig",
    "SagemakerAppImageConfigCodeEditorAppImageConfig",
    "SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig",
    "SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfigOutputReference",
    "SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig",
    "SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfigOutputReference",
    "SagemakerAppImageConfigCodeEditorAppImageConfigOutputReference",
    "SagemakerAppImageConfigConfig",
    "SagemakerAppImageConfigJupyterLabImageConfig",
    "SagemakerAppImageConfigJupyterLabImageConfigContainerConfig",
    "SagemakerAppImageConfigJupyterLabImageConfigContainerConfigOutputReference",
    "SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig",
    "SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfigOutputReference",
    "SagemakerAppImageConfigJupyterLabImageConfigOutputReference",
    "SagemakerAppImageConfigKernelGatewayImageConfig",
    "SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig",
    "SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfigOutputReference",
    "SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec",
    "SagemakerAppImageConfigKernelGatewayImageConfigKernelSpecList",
    "SagemakerAppImageConfigKernelGatewayImageConfigKernelSpecOutputReference",
    "SagemakerAppImageConfigKernelGatewayImageConfigOutputReference",
]

publication.publish()

def _typecheckingstub__e1a97d92f257725988aaabbbf9f97181ca04eeb5628816082114212b8b65fc38(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    app_image_config_name: builtins.str,
    code_editor_app_image_config: typing.Optional[typing.Union[SagemakerAppImageConfigCodeEditorAppImageConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    jupyter_lab_image_config: typing.Optional[typing.Union[SagemakerAppImageConfigJupyterLabImageConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    kernel_gateway_image_config: typing.Optional[typing.Union[SagemakerAppImageConfigKernelGatewayImageConfig, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__f77fe4dffc09571ed2ec8b356ecc6434732c5e77089c98b15077d2a2ef185a9d(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__58751a83cecfff149c3b868d8267f081c42d93c013d0292cd4c6d6384a9c75ef(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc2627c529e3c5408a376c57c3fcd5bc26921bb6ecd8851b9fc58a743c40949d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b90f417f54a79c04942f2f1354edb51fe669f6a3a3a2d0f89391f6123899d04(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__296814731994ca96e7cab5294ab4f3c543bd92a14ec966eb4a1298ed7da700b0(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__52979b5c88bb622d2931651586f7c48d4f3dbd53d4acb110770ffafe0a062a20(
    *,
    container_config: typing.Optional[typing.Union[SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    file_system_config: typing.Optional[typing.Union[SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d86a935cea3961343eb334288567638f63a2d7cb8fd6df2a7a3117348173007a(
    *,
    container_arguments: typing.Optional[typing.Sequence[builtins.str]] = None,
    container_entrypoint: typing.Optional[typing.Sequence[builtins.str]] = None,
    container_environment_variables: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2674ad98178c8d51c2f0cd94be0d5c05894b294eb2ebf756b5454f60ff4009d6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__955e354d6da68f59e735a27895a68a35836917f93af0b25fb0c1ef65fe3089b3(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__defd366427f7012ad3c0ecefcd54072bba25b06198ae6f6ef1af40c3357778bd(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__22e6428ad1cfb2da7f909d3b301fab28e8fe265c3be191ef0a5d894e6ad04c93(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96cfd5284942eebb99387abb713eb5425ee2c588ceb94528e859963ece9f3e4f(
    value: typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8600d716d0cabe68e3cf8859d820de968241bfc1d67ee9e346d354d16ed846d(
    *,
    default_gid: typing.Optional[jsii.Number] = None,
    default_uid: typing.Optional[jsii.Number] = None,
    mount_path: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27ed33fbf34d7bbe6cfd41feb02428144f543324ec0a24c2d4791f693a338d9e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4469bf02e1290ecb15efeac756ceeaa3a28d1e723e019ecc305aa9f5d50828ce(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2214489174c73f412dc209b0d1ea84a8b1b0ca8eed887a4bcfc74a0ec719fda2(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec5a37ab24dafe5194c3de879112ee82c42ad67c035158336ada864177e74fbb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d763207d28ca0439e1a4ca577d2c7db440a2e1be6dec862e8b2628e7d3f6e717(
    value: typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ecaff8f3b4faacf15577f51235871192ac51e44cf58b488877d764f286f85ab9(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9bd3a250971186c90470d3bd003ca130decd34fe97476571697d940566d21dbe(
    value: typing.Optional[SagemakerAppImageConfigCodeEditorAppImageConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c31092c5cd5379fa6fa7827cd230ca909537b300ad667000e7eb9859f00e4ec(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    app_image_config_name: builtins.str,
    code_editor_app_image_config: typing.Optional[typing.Union[SagemakerAppImageConfigCodeEditorAppImageConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    jupyter_lab_image_config: typing.Optional[typing.Union[SagemakerAppImageConfigJupyterLabImageConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    kernel_gateway_image_config: typing.Optional[typing.Union[SagemakerAppImageConfigKernelGatewayImageConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__41ee5f0c0ad95778f5f17d621e6ecb4a27058edcc4d3ed7c6545d323d445a0c0(
    *,
    container_config: typing.Optional[typing.Union[SagemakerAppImageConfigJupyterLabImageConfigContainerConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    file_system_config: typing.Optional[typing.Union[SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef4e3077a74085cde0a98064780668774680f7ec54860138210becb030aac7e7(
    *,
    container_arguments: typing.Optional[typing.Sequence[builtins.str]] = None,
    container_entrypoint: typing.Optional[typing.Sequence[builtins.str]] = None,
    container_environment_variables: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f90748af66945787f4ad92f1e97ba9e5e013ec851e370025215874ef51e2b5a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea447e52ced834c9a9ca2654dd444c63f86cfb9f46e2b792d189682c4c79a5c7(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a2e3c5fd4369ada103d331cc633e242670570e2821113df7e50f88ef301fbf8(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f9c67f2fe8d7aa095b12a05e63da32de913f3569338148e1f7ce951257cbd17(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2dc0db45e42b7b8cfb82045699ffffa142c6d93d4bbe7ea317a08bd77bb26364(
    value: typing.Optional[SagemakerAppImageConfigJupyterLabImageConfigContainerConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__792ae2d4eff8951de85ebac92dda634d39c1edc440117c56cba663956b2b7750(
    *,
    default_gid: typing.Optional[jsii.Number] = None,
    default_uid: typing.Optional[jsii.Number] = None,
    mount_path: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76bfb70038dfe2e1cb2b30bb97c95e34f7d705a91da63964b24d03542a7981fd(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ce56ce7e34c38b6b973d998915a262eda9e44b53abd2a876126e3d944e32f351(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__569df23895d9c748dbb19325b3b078ce7247aa859d01aa3cd55fad9e0ae7fbd2(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b39f4bf321bf13005b5fc8166d995d925de80f9cd71089baf12c26bbc5e560c5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bcff2913acc64fbc8f0bd77e2e4e48b89ccc80a606b63e973392c076fc8ca379(
    value: typing.Optional[SagemakerAppImageConfigJupyterLabImageConfigFileSystemConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dfa942dc93c6655be20a1aaf9ba3bfaf2e2addcf861ca4e23c0f162adeec95f6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32317bc1474859d7605d72f46d34080c138885393a90aad3a033619b9eb5111e(
    value: typing.Optional[SagemakerAppImageConfigJupyterLabImageConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e954d3e2d807d128410802e66b1764d4231466005e063f09bd3117305614b28(
    *,
    kernel_spec: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec, typing.Dict[builtins.str, typing.Any]]]],
    file_system_config: typing.Optional[typing.Union[SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c076f3c521ee649b7739a6cc68c44ebfd6f7b54b646440af833f7cdb18c5e4e2(
    *,
    default_gid: typing.Optional[jsii.Number] = None,
    default_uid: typing.Optional[jsii.Number] = None,
    mount_path: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e69a32b34facc7199f537c461244fafa65d91517aa3a35c07b60df5ecde638d4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b74c14a198194360e1e9c0a931682b0f958c3c778f61d443c5ea591eca8a84a4(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__13aff41772ad2b4bd20a4020ff88957868cd884b2c3a16ef0b183cd500393d5c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7494e687f94024a424a4757065d1247f782fd08bfeb21317770d00e4f66ec6cf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5514b14768993be58edf547ebcc2cd15a5ef3933acd5bae4fc16ed083d644ab(
    value: typing.Optional[SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac837070cfe994a7d28506ad101c06f01e7ad1658d5c1af4ed458a2538350ff0(
    *,
    name: builtins.str,
    display_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca15a67b4147961cb1ae68ae3d04c1029673094c956d82fcaf69436cae2555c1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f077cbd9021657640399b2d17b57547dea3303778bb03df0086333c616581b8(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a211fe877fdf4d859147eeecf40d69415a7c4b2759db16eea7b54d950917d30(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__715b71f71c362fd145faaca927c4ffb3d6e482792124b598d04fc43be4c2b90f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e0192ebc1fdef9cf84cb7a641f7009ad1e3a6f6f90ace75406529614ffb76f3(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c499ee83a55683654747c46338f0b1437ee62e2cd43b7139357eb4fccd379a80(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82cd1ce64d059f12fb9ed10692ccf01eef4bf3ee8879de44e05648de89e140b0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a4cfdaf5ecf83bf5f66ebf26b9898fff868fc687b32244d541cfb6948ce72220(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__781459185de94e86d5269b1c986b1bae1393161a755fc84073b18d5284272296(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__379b94515e0fa83fc37ee350b6f067adf8b499d901f7beff06a619404a4e65fb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42fc284057b8958551ec1f4536c94a2e316e553f7ddaa5e9cc4e090916e625f3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b542ebe0f50480636af130712eab55d4d6a1f68f7c8bc192899149a8e8b76f8(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79cd0f3d79d555c91b0cc892495477f0479b1ee4834621ac123c8b95ccb2c019(
    value: typing.Optional[SagemakerAppImageConfigKernelGatewayImageConfig],
) -> None:
    """Type checking stubs"""
    pass
