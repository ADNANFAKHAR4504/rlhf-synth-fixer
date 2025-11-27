r'''
# `aws_sagemaker_space`

Refer to the Terraform Registry for docs: [`aws_sagemaker_space`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space).
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


class SagemakerSpace(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpace",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space aws_sagemaker_space}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        domain_id: builtins.str,
        space_name: builtins.str,
        id: typing.Optional[builtins.str] = None,
        ownership_settings: typing.Optional[typing.Union["SagemakerSpaceOwnershipSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        space_display_name: typing.Optional[builtins.str] = None,
        space_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        space_sharing_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSharingSettings", typing.Dict[builtins.str, typing.Any]]] = None,
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
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space aws_sagemaker_space} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param domain_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#domain_id SagemakerSpace#domain_id}.
        :param space_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_name SagemakerSpace#space_name}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#id SagemakerSpace#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param ownership_settings: ownership_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#ownership_settings SagemakerSpace#ownership_settings}
        :param space_display_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_display_name SagemakerSpace#space_display_name}.
        :param space_settings: space_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_settings SagemakerSpace#space_settings}
        :param space_sharing_settings: space_sharing_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_sharing_settings SagemakerSpace#space_sharing_settings}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#tags SagemakerSpace#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#tags_all SagemakerSpace#tags_all}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__483e5034f1ef836803f788a73b3b74f3f39847f056f55ee1f275a6280c9af650)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = SagemakerSpaceConfig(
            domain_id=domain_id,
            space_name=space_name,
            id=id,
            ownership_settings=ownership_settings,
            space_display_name=space_display_name,
            space_settings=space_settings,
            space_sharing_settings=space_sharing_settings,
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
        '''Generates CDKTF code for importing a SagemakerSpace resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the SagemakerSpace to import.
        :param import_from_id: The id of the existing SagemakerSpace that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the SagemakerSpace to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__441f0b02b95537af6189844f59cf56fdc2c86363c9f80b7b9c2efe98e09404e5)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putOwnershipSettings")
    def put_ownership_settings(self, *, owner_user_profile_name: builtins.str) -> None:
        '''
        :param owner_user_profile_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#owner_user_profile_name SagemakerSpace#owner_user_profile_name}.
        '''
        value = SagemakerSpaceOwnershipSettings(
            owner_user_profile_name=owner_user_profile_name
        )

        return typing.cast(None, jsii.invoke(self, "putOwnershipSettings", [value]))

    @jsii.member(jsii_name="putSpaceSettings")
    def put_space_settings(
        self,
        *,
        app_type: typing.Optional[builtins.str] = None,
        code_editor_app_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsCodeEditorAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        custom_file_system: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerSpaceSpaceSettingsCustomFileSystem", typing.Dict[builtins.str, typing.Any]]]]] = None,
        jupyter_lab_app_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsJupyterLabAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        jupyter_server_app_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsJupyterServerAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        kernel_gateway_app_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsKernelGatewayAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        space_storage_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsSpaceStorageSettings", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param app_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_type SagemakerSpace#app_type}.
        :param code_editor_app_settings: code_editor_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_editor_app_settings SagemakerSpace#code_editor_app_settings}
        :param custom_file_system: custom_file_system block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#custom_file_system SagemakerSpace#custom_file_system}
        :param jupyter_lab_app_settings: jupyter_lab_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#jupyter_lab_app_settings SagemakerSpace#jupyter_lab_app_settings}
        :param jupyter_server_app_settings: jupyter_server_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#jupyter_server_app_settings SagemakerSpace#jupyter_server_app_settings}
        :param kernel_gateway_app_settings: kernel_gateway_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#kernel_gateway_app_settings SagemakerSpace#kernel_gateway_app_settings}
        :param space_storage_settings: space_storage_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_storage_settings SagemakerSpace#space_storage_settings}
        '''
        value = SagemakerSpaceSpaceSettings(
            app_type=app_type,
            code_editor_app_settings=code_editor_app_settings,
            custom_file_system=custom_file_system,
            jupyter_lab_app_settings=jupyter_lab_app_settings,
            jupyter_server_app_settings=jupyter_server_app_settings,
            kernel_gateway_app_settings=kernel_gateway_app_settings,
            space_storage_settings=space_storage_settings,
        )

        return typing.cast(None, jsii.invoke(self, "putSpaceSettings", [value]))

    @jsii.member(jsii_name="putSpaceSharingSettings")
    def put_space_sharing_settings(self, *, sharing_type: builtins.str) -> None:
        '''
        :param sharing_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sharing_type SagemakerSpace#sharing_type}.
        '''
        value = SagemakerSpaceSpaceSharingSettings(sharing_type=sharing_type)

        return typing.cast(None, jsii.invoke(self, "putSpaceSharingSettings", [value]))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetOwnershipSettings")
    def reset_ownership_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOwnershipSettings", []))

    @jsii.member(jsii_name="resetSpaceDisplayName")
    def reset_space_display_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSpaceDisplayName", []))

    @jsii.member(jsii_name="resetSpaceSettings")
    def reset_space_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSpaceSettings", []))

    @jsii.member(jsii_name="resetSpaceSharingSettings")
    def reset_space_sharing_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSpaceSharingSettings", []))

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
    @jsii.member(jsii_name="homeEfsFileSystemUid")
    def home_efs_file_system_uid(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "homeEfsFileSystemUid"))

    @builtins.property
    @jsii.member(jsii_name="ownershipSettings")
    def ownership_settings(self) -> "SagemakerSpaceOwnershipSettingsOutputReference":
        return typing.cast("SagemakerSpaceOwnershipSettingsOutputReference", jsii.get(self, "ownershipSettings"))

    @builtins.property
    @jsii.member(jsii_name="spaceSettings")
    def space_settings(self) -> "SagemakerSpaceSpaceSettingsOutputReference":
        return typing.cast("SagemakerSpaceSpaceSettingsOutputReference", jsii.get(self, "spaceSettings"))

    @builtins.property
    @jsii.member(jsii_name="spaceSharingSettings")
    def space_sharing_settings(
        self,
    ) -> "SagemakerSpaceSpaceSharingSettingsOutputReference":
        return typing.cast("SagemakerSpaceSpaceSharingSettingsOutputReference", jsii.get(self, "spaceSharingSettings"))

    @builtins.property
    @jsii.member(jsii_name="url")
    def url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "url"))

    @builtins.property
    @jsii.member(jsii_name="domainIdInput")
    def domain_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "domainIdInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="ownershipSettingsInput")
    def ownership_settings_input(
        self,
    ) -> typing.Optional["SagemakerSpaceOwnershipSettings"]:
        return typing.cast(typing.Optional["SagemakerSpaceOwnershipSettings"], jsii.get(self, "ownershipSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="spaceDisplayNameInput")
    def space_display_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "spaceDisplayNameInput"))

    @builtins.property
    @jsii.member(jsii_name="spaceNameInput")
    def space_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "spaceNameInput"))

    @builtins.property
    @jsii.member(jsii_name="spaceSettingsInput")
    def space_settings_input(self) -> typing.Optional["SagemakerSpaceSpaceSettings"]:
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSettings"], jsii.get(self, "spaceSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="spaceSharingSettingsInput")
    def space_sharing_settings_input(
        self,
    ) -> typing.Optional["SagemakerSpaceSpaceSharingSettings"]:
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSharingSettings"], jsii.get(self, "spaceSharingSettingsInput"))

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
    @jsii.member(jsii_name="domainId")
    def domain_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "domainId"))

    @domain_id.setter
    def domain_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83bbd6d0232155ac6c730bf1828ddcc2bf86a2989ae4d706c50841438659c5d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "domainId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d941e67aaf624140900c57b999f05c5c554b8d093c21bcfa10893dfa142eb15)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="spaceDisplayName")
    def space_display_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "spaceDisplayName"))

    @space_display_name.setter
    def space_display_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae331cb58f213d7b334d56f60868d2ad24573d50a664bcb7328d44022121292e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "spaceDisplayName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="spaceName")
    def space_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "spaceName"))

    @space_name.setter
    def space_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea7d6d9763bd57794bd1f4b33ce3fe6747c80c0a4783b6cce821991d173ec9e1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "spaceName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2e500bf3108c671c090b732ebab37e5a3c65fa3e465850a8e544a76981ff63b9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__880d5f327669e0f6c7d12733f48036e69d1fe733410a5053ec3ce536ece2fee7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "domain_id": "domainId",
        "space_name": "spaceName",
        "id": "id",
        "ownership_settings": "ownershipSettings",
        "space_display_name": "spaceDisplayName",
        "space_settings": "spaceSettings",
        "space_sharing_settings": "spaceSharingSettings",
        "tags": "tags",
        "tags_all": "tagsAll",
    },
)
class SagemakerSpaceConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        domain_id: builtins.str,
        space_name: builtins.str,
        id: typing.Optional[builtins.str] = None,
        ownership_settings: typing.Optional[typing.Union["SagemakerSpaceOwnershipSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        space_display_name: typing.Optional[builtins.str] = None,
        space_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        space_sharing_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSharingSettings", typing.Dict[builtins.str, typing.Any]]] = None,
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
        :param domain_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#domain_id SagemakerSpace#domain_id}.
        :param space_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_name SagemakerSpace#space_name}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#id SagemakerSpace#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param ownership_settings: ownership_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#ownership_settings SagemakerSpace#ownership_settings}
        :param space_display_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_display_name SagemakerSpace#space_display_name}.
        :param space_settings: space_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_settings SagemakerSpace#space_settings}
        :param space_sharing_settings: space_sharing_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_sharing_settings SagemakerSpace#space_sharing_settings}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#tags SagemakerSpace#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#tags_all SagemakerSpace#tags_all}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(ownership_settings, dict):
            ownership_settings = SagemakerSpaceOwnershipSettings(**ownership_settings)
        if isinstance(space_settings, dict):
            space_settings = SagemakerSpaceSpaceSettings(**space_settings)
        if isinstance(space_sharing_settings, dict):
            space_sharing_settings = SagemakerSpaceSpaceSharingSettings(**space_sharing_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3c0b52f294002890e8c84f48579a94c6878bac1d2fcd31db2c0f16642cfaf7e6)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument domain_id", value=domain_id, expected_type=type_hints["domain_id"])
            check_type(argname="argument space_name", value=space_name, expected_type=type_hints["space_name"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument ownership_settings", value=ownership_settings, expected_type=type_hints["ownership_settings"])
            check_type(argname="argument space_display_name", value=space_display_name, expected_type=type_hints["space_display_name"])
            check_type(argname="argument space_settings", value=space_settings, expected_type=type_hints["space_settings"])
            check_type(argname="argument space_sharing_settings", value=space_sharing_settings, expected_type=type_hints["space_sharing_settings"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "domain_id": domain_id,
            "space_name": space_name,
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
        if ownership_settings is not None:
            self._values["ownership_settings"] = ownership_settings
        if space_display_name is not None:
            self._values["space_display_name"] = space_display_name
        if space_settings is not None:
            self._values["space_settings"] = space_settings
        if space_sharing_settings is not None:
            self._values["space_sharing_settings"] = space_sharing_settings
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
    def domain_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#domain_id SagemakerSpace#domain_id}.'''
        result = self._values.get("domain_id")
        assert result is not None, "Required property 'domain_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def space_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_name SagemakerSpace#space_name}.'''
        result = self._values.get("space_name")
        assert result is not None, "Required property 'space_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#id SagemakerSpace#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ownership_settings(self) -> typing.Optional["SagemakerSpaceOwnershipSettings"]:
        '''ownership_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#ownership_settings SagemakerSpace#ownership_settings}
        '''
        result = self._values.get("ownership_settings")
        return typing.cast(typing.Optional["SagemakerSpaceOwnershipSettings"], result)

    @builtins.property
    def space_display_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_display_name SagemakerSpace#space_display_name}.'''
        result = self._values.get("space_display_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def space_settings(self) -> typing.Optional["SagemakerSpaceSpaceSettings"]:
        '''space_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_settings SagemakerSpace#space_settings}
        '''
        result = self._values.get("space_settings")
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSettings"], result)

    @builtins.property
    def space_sharing_settings(
        self,
    ) -> typing.Optional["SagemakerSpaceSpaceSharingSettings"]:
        '''space_sharing_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_sharing_settings SagemakerSpace#space_sharing_settings}
        '''
        result = self._values.get("space_sharing_settings")
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSharingSettings"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#tags SagemakerSpace#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#tags_all SagemakerSpace#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceOwnershipSettings",
    jsii_struct_bases=[],
    name_mapping={"owner_user_profile_name": "ownerUserProfileName"},
)
class SagemakerSpaceOwnershipSettings:
    def __init__(self, *, owner_user_profile_name: builtins.str) -> None:
        '''
        :param owner_user_profile_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#owner_user_profile_name SagemakerSpace#owner_user_profile_name}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__19acd632cc0c3912588c22be94f60bdd04c40ae886e073998ec7d3488b6384b7)
            check_type(argname="argument owner_user_profile_name", value=owner_user_profile_name, expected_type=type_hints["owner_user_profile_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "owner_user_profile_name": owner_user_profile_name,
        }

    @builtins.property
    def owner_user_profile_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#owner_user_profile_name SagemakerSpace#owner_user_profile_name}.'''
        result = self._values.get("owner_user_profile_name")
        assert result is not None, "Required property 'owner_user_profile_name' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceOwnershipSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceOwnershipSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceOwnershipSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7e0bc8bb1d22f437734cfef441ed8bb580092c8f4228f6c6adb6217af9630170)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="ownerUserProfileNameInput")
    def owner_user_profile_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "ownerUserProfileNameInput"))

    @builtins.property
    @jsii.member(jsii_name="ownerUserProfileName")
    def owner_user_profile_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "ownerUserProfileName"))

    @owner_user_profile_name.setter
    def owner_user_profile_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c1ffe916aad59a7934fbeef22de5c1cdf5cfb022e4cfaa881b289c671f37b629)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ownerUserProfileName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[SagemakerSpaceOwnershipSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceOwnershipSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceOwnershipSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d65987836f0aea8576849d09471178cc5948b2b91b3f3f45f6fa227536e0d52)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettings",
    jsii_struct_bases=[],
    name_mapping={
        "app_type": "appType",
        "code_editor_app_settings": "codeEditorAppSettings",
        "custom_file_system": "customFileSystem",
        "jupyter_lab_app_settings": "jupyterLabAppSettings",
        "jupyter_server_app_settings": "jupyterServerAppSettings",
        "kernel_gateway_app_settings": "kernelGatewayAppSettings",
        "space_storage_settings": "spaceStorageSettings",
    },
)
class SagemakerSpaceSpaceSettings:
    def __init__(
        self,
        *,
        app_type: typing.Optional[builtins.str] = None,
        code_editor_app_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsCodeEditorAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        custom_file_system: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerSpaceSpaceSettingsCustomFileSystem", typing.Dict[builtins.str, typing.Any]]]]] = None,
        jupyter_lab_app_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsJupyterLabAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        jupyter_server_app_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsJupyterServerAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        kernel_gateway_app_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsKernelGatewayAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        space_storage_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsSpaceStorageSettings", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param app_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_type SagemakerSpace#app_type}.
        :param code_editor_app_settings: code_editor_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_editor_app_settings SagemakerSpace#code_editor_app_settings}
        :param custom_file_system: custom_file_system block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#custom_file_system SagemakerSpace#custom_file_system}
        :param jupyter_lab_app_settings: jupyter_lab_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#jupyter_lab_app_settings SagemakerSpace#jupyter_lab_app_settings}
        :param jupyter_server_app_settings: jupyter_server_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#jupyter_server_app_settings SagemakerSpace#jupyter_server_app_settings}
        :param kernel_gateway_app_settings: kernel_gateway_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#kernel_gateway_app_settings SagemakerSpace#kernel_gateway_app_settings}
        :param space_storage_settings: space_storage_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_storage_settings SagemakerSpace#space_storage_settings}
        '''
        if isinstance(code_editor_app_settings, dict):
            code_editor_app_settings = SagemakerSpaceSpaceSettingsCodeEditorAppSettings(**code_editor_app_settings)
        if isinstance(jupyter_lab_app_settings, dict):
            jupyter_lab_app_settings = SagemakerSpaceSpaceSettingsJupyterLabAppSettings(**jupyter_lab_app_settings)
        if isinstance(jupyter_server_app_settings, dict):
            jupyter_server_app_settings = SagemakerSpaceSpaceSettingsJupyterServerAppSettings(**jupyter_server_app_settings)
        if isinstance(kernel_gateway_app_settings, dict):
            kernel_gateway_app_settings = SagemakerSpaceSpaceSettingsKernelGatewayAppSettings(**kernel_gateway_app_settings)
        if isinstance(space_storage_settings, dict):
            space_storage_settings = SagemakerSpaceSpaceSettingsSpaceStorageSettings(**space_storage_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c632b19c7c5925278f9fd005421bce8f44de74218f425084b26359419b99f588)
            check_type(argname="argument app_type", value=app_type, expected_type=type_hints["app_type"])
            check_type(argname="argument code_editor_app_settings", value=code_editor_app_settings, expected_type=type_hints["code_editor_app_settings"])
            check_type(argname="argument custom_file_system", value=custom_file_system, expected_type=type_hints["custom_file_system"])
            check_type(argname="argument jupyter_lab_app_settings", value=jupyter_lab_app_settings, expected_type=type_hints["jupyter_lab_app_settings"])
            check_type(argname="argument jupyter_server_app_settings", value=jupyter_server_app_settings, expected_type=type_hints["jupyter_server_app_settings"])
            check_type(argname="argument kernel_gateway_app_settings", value=kernel_gateway_app_settings, expected_type=type_hints["kernel_gateway_app_settings"])
            check_type(argname="argument space_storage_settings", value=space_storage_settings, expected_type=type_hints["space_storage_settings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if app_type is not None:
            self._values["app_type"] = app_type
        if code_editor_app_settings is not None:
            self._values["code_editor_app_settings"] = code_editor_app_settings
        if custom_file_system is not None:
            self._values["custom_file_system"] = custom_file_system
        if jupyter_lab_app_settings is not None:
            self._values["jupyter_lab_app_settings"] = jupyter_lab_app_settings
        if jupyter_server_app_settings is not None:
            self._values["jupyter_server_app_settings"] = jupyter_server_app_settings
        if kernel_gateway_app_settings is not None:
            self._values["kernel_gateway_app_settings"] = kernel_gateway_app_settings
        if space_storage_settings is not None:
            self._values["space_storage_settings"] = space_storage_settings

    @builtins.property
    def app_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_type SagemakerSpace#app_type}.'''
        result = self._values.get("app_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def code_editor_app_settings(
        self,
    ) -> typing.Optional["SagemakerSpaceSpaceSettingsCodeEditorAppSettings"]:
        '''code_editor_app_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_editor_app_settings SagemakerSpace#code_editor_app_settings}
        '''
        result = self._values.get("code_editor_app_settings")
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSettingsCodeEditorAppSettings"], result)

    @builtins.property
    def custom_file_system(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerSpaceSpaceSettingsCustomFileSystem"]]]:
        '''custom_file_system block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#custom_file_system SagemakerSpace#custom_file_system}
        '''
        result = self._values.get("custom_file_system")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerSpaceSpaceSettingsCustomFileSystem"]]], result)

    @builtins.property
    def jupyter_lab_app_settings(
        self,
    ) -> typing.Optional["SagemakerSpaceSpaceSettingsJupyterLabAppSettings"]:
        '''jupyter_lab_app_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#jupyter_lab_app_settings SagemakerSpace#jupyter_lab_app_settings}
        '''
        result = self._values.get("jupyter_lab_app_settings")
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSettingsJupyterLabAppSettings"], result)

    @builtins.property
    def jupyter_server_app_settings(
        self,
    ) -> typing.Optional["SagemakerSpaceSpaceSettingsJupyterServerAppSettings"]:
        '''jupyter_server_app_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#jupyter_server_app_settings SagemakerSpace#jupyter_server_app_settings}
        '''
        result = self._values.get("jupyter_server_app_settings")
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSettingsJupyterServerAppSettings"], result)

    @builtins.property
    def kernel_gateway_app_settings(
        self,
    ) -> typing.Optional["SagemakerSpaceSpaceSettingsKernelGatewayAppSettings"]:
        '''kernel_gateway_app_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#kernel_gateway_app_settings SagemakerSpace#kernel_gateway_app_settings}
        '''
        result = self._values.get("kernel_gateway_app_settings")
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSettingsKernelGatewayAppSettings"], result)

    @builtins.property
    def space_storage_settings(
        self,
    ) -> typing.Optional["SagemakerSpaceSpaceSettingsSpaceStorageSettings"]:
        '''space_storage_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#space_storage_settings SagemakerSpace#space_storage_settings}
        '''
        result = self._values.get("space_storage_settings")
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSettingsSpaceStorageSettings"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCodeEditorAppSettings",
    jsii_struct_bases=[],
    name_mapping={
        "default_resource_spec": "defaultResourceSpec",
        "app_lifecycle_management": "appLifecycleManagement",
    },
)
class SagemakerSpaceSpaceSettingsCodeEditorAppSettings:
    def __init__(
        self,
        *,
        default_resource_spec: typing.Union["SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec", typing.Dict[builtins.str, typing.Any]],
        app_lifecycle_management: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
        :param app_lifecycle_management: app_lifecycle_management block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_lifecycle_management SagemakerSpace#app_lifecycle_management}
        '''
        if isinstance(default_resource_spec, dict):
            default_resource_spec = SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec(**default_resource_spec)
        if isinstance(app_lifecycle_management, dict):
            app_lifecycle_management = SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement(**app_lifecycle_management)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6dd3d110069c186996a1a8188d944e9c5f58b27c65970d2cb171329604c824a9)
            check_type(argname="argument default_resource_spec", value=default_resource_spec, expected_type=type_hints["default_resource_spec"])
            check_type(argname="argument app_lifecycle_management", value=app_lifecycle_management, expected_type=type_hints["app_lifecycle_management"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_resource_spec": default_resource_spec,
        }
        if app_lifecycle_management is not None:
            self._values["app_lifecycle_management"] = app_lifecycle_management

    @builtins.property
    def default_resource_spec(
        self,
    ) -> "SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec":
        '''default_resource_spec block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
        '''
        result = self._values.get("default_resource_spec")
        assert result is not None, "Required property 'default_resource_spec' is missing"
        return typing.cast("SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec", result)

    @builtins.property
    def app_lifecycle_management(
        self,
    ) -> typing.Optional["SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement"]:
        '''app_lifecycle_management block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_lifecycle_management SagemakerSpace#app_lifecycle_management}
        '''
        result = self._values.get("app_lifecycle_management")
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsCodeEditorAppSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement",
    jsii_struct_bases=[],
    name_mapping={"idle_settings": "idleSettings"},
)
class SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement:
    def __init__(
        self,
        *,
        idle_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param idle_settings: idle_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#idle_settings SagemakerSpace#idle_settings}
        '''
        if isinstance(idle_settings, dict):
            idle_settings = SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings(**idle_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b88caa9297d46092423d7053a048d88561e5803de8fe4fd66406ea79d7f0c796)
            check_type(argname="argument idle_settings", value=idle_settings, expected_type=type_hints["idle_settings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if idle_settings is not None:
            self._values["idle_settings"] = idle_settings

    @builtins.property
    def idle_settings(
        self,
    ) -> typing.Optional["SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings"]:
        '''idle_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#idle_settings SagemakerSpace#idle_settings}
        '''
        result = self._values.get("idle_settings")
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings",
    jsii_struct_bases=[],
    name_mapping={"idle_timeout_in_minutes": "idleTimeoutInMinutes"},
)
class SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings:
    def __init__(
        self,
        *,
        idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#idle_timeout_in_minutes SagemakerSpace#idle_timeout_in_minutes}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a5bcb29c2f711cfe5546ff3742bbffdc825e0f7976ee2087aa0ca713e80ce0ea)
            check_type(argname="argument idle_timeout_in_minutes", value=idle_timeout_in_minutes, expected_type=type_hints["idle_timeout_in_minutes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if idle_timeout_in_minutes is not None:
            self._values["idle_timeout_in_minutes"] = idle_timeout_in_minutes

    @builtins.property
    def idle_timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#idle_timeout_in_minutes SagemakerSpace#idle_timeout_in_minutes}.'''
        result = self._values.get("idle_timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__86302438242167c2e03a7fc78c9ef3dfdb506194772484be841382bcb7274f17)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetIdleTimeoutInMinutes")
    def reset_idle_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdleTimeoutInMinutes", []))

    @builtins.property
    @jsii.member(jsii_name="idleTimeoutInMinutesInput")
    def idle_timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "idleTimeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="idleTimeoutInMinutes")
    def idle_timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "idleTimeoutInMinutes"))

    @idle_timeout_in_minutes.setter
    def idle_timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__238362fe06d87cd1b1414958357a9e4e20e54c8d6db13d6bd5ba363eecc1f77e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "idleTimeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fe56c9b3c09e84cb9489f08ff2f95460208c6b257234f3c35ef6acb0085a9f81)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__29fced5b9f229412ff73c6eb206443d6749bf5a22f18f346af864c0e27e18394)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putIdleSettings")
    def put_idle_settings(
        self,
        *,
        idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#idle_timeout_in_minutes SagemakerSpace#idle_timeout_in_minutes}.
        '''
        value = SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings(
            idle_timeout_in_minutes=idle_timeout_in_minutes
        )

        return typing.cast(None, jsii.invoke(self, "putIdleSettings", [value]))

    @jsii.member(jsii_name="resetIdleSettings")
    def reset_idle_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdleSettings", []))

    @builtins.property
    @jsii.member(jsii_name="idleSettings")
    def idle_settings(
        self,
    ) -> SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference, jsii.get(self, "idleSettings"))

    @builtins.property
    @jsii.member(jsii_name="idleSettingsInput")
    def idle_settings_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings], jsii.get(self, "idleSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e77d96882ab7b464728618167524fe3b6bfb4731737594f6dfcede88979950b2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec",
    jsii_struct_bases=[],
    name_mapping={
        "instance_type": "instanceType",
        "lifecycle_config_arn": "lifecycleConfigArn",
        "sagemaker_image_arn": "sagemakerImageArn",
        "sagemaker_image_version_alias": "sagemakerImageVersionAlias",
        "sagemaker_image_version_arn": "sagemakerImageVersionArn",
    },
)
class SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec:
    def __init__(
        self,
        *,
        instance_type: typing.Optional[builtins.str] = None,
        lifecycle_config_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
        sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#instance_type SagemakerSpace#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arn SagemakerSpace#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_arn SagemakerSpace#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_alias SagemakerSpace#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_arn SagemakerSpace#sagemaker_image_version_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6107c608c5258f9bf04cabe4e94c0907e9deecef9fe26db1ea978a47a4c0c0c7)
            check_type(argname="argument instance_type", value=instance_type, expected_type=type_hints["instance_type"])
            check_type(argname="argument lifecycle_config_arn", value=lifecycle_config_arn, expected_type=type_hints["lifecycle_config_arn"])
            check_type(argname="argument sagemaker_image_arn", value=sagemaker_image_arn, expected_type=type_hints["sagemaker_image_arn"])
            check_type(argname="argument sagemaker_image_version_alias", value=sagemaker_image_version_alias, expected_type=type_hints["sagemaker_image_version_alias"])
            check_type(argname="argument sagemaker_image_version_arn", value=sagemaker_image_version_arn, expected_type=type_hints["sagemaker_image_version_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if instance_type is not None:
            self._values["instance_type"] = instance_type
        if lifecycle_config_arn is not None:
            self._values["lifecycle_config_arn"] = lifecycle_config_arn
        if sagemaker_image_arn is not None:
            self._values["sagemaker_image_arn"] = sagemaker_image_arn
        if sagemaker_image_version_alias is not None:
            self._values["sagemaker_image_version_alias"] = sagemaker_image_version_alias
        if sagemaker_image_version_arn is not None:
            self._values["sagemaker_image_version_arn"] = sagemaker_image_version_arn

    @builtins.property
    def instance_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#instance_type SagemakerSpace#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lifecycle_config_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arn SagemakerSpace#lifecycle_config_arn}.'''
        result = self._values.get("lifecycle_config_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_arn SagemakerSpace#sagemaker_image_arn}.'''
        result = self._values.get("sagemaker_image_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_alias(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_alias SagemakerSpace#sagemaker_image_version_alias}.'''
        result = self._values.get("sagemaker_image_version_alias")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_arn SagemakerSpace#sagemaker_image_version_arn}.'''
        result = self._values.get("sagemaker_image_version_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3a1f8b5960091c077684a1461331efb03875e602a96f07e4295965d03ebc265a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetInstanceType")
    def reset_instance_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceType", []))

    @jsii.member(jsii_name="resetLifecycleConfigArn")
    def reset_lifecycle_config_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycleConfigArn", []))

    @jsii.member(jsii_name="resetSagemakerImageArn")
    def reset_sagemaker_image_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerImageArn", []))

    @jsii.member(jsii_name="resetSagemakerImageVersionAlias")
    def reset_sagemaker_image_version_alias(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerImageVersionAlias", []))

    @jsii.member(jsii_name="resetSagemakerImageVersionArn")
    def reset_sagemaker_image_version_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerImageVersionArn", []))

    @builtins.property
    @jsii.member(jsii_name="instanceTypeInput")
    def instance_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "instanceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArnInput")
    def lifecycle_config_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lifecycleConfigArnInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArnInput")
    def sagemaker_image_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sagemakerImageArnInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAliasInput")
    def sagemaker_image_version_alias_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sagemakerImageVersionAliasInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArnInput")
    def sagemaker_image_version_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sagemakerImageVersionArnInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceType")
    def instance_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "instanceType"))

    @instance_type.setter
    def instance_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__375660d50f3ff1bdab0242550ea4f24a56cc1c14fd33c0590caa83b1db95af2c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArn")
    def lifecycle_config_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleConfigArn"))

    @lifecycle_config_arn.setter
    def lifecycle_config_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__093a9b141a87fd64cee1b72a20abc74153f0306e8a923e707eea36f3411df905)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArn")
    def sagemaker_image_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageArn"))

    @sagemaker_image_arn.setter
    def sagemaker_image_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d14f128114d677489d0eb0cbcfc5a29517afcf3bf91a0a9b3b36f1d52fb91226)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAlias")
    def sagemaker_image_version_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionAlias"))

    @sagemaker_image_version_alias.setter
    def sagemaker_image_version_alias(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4551293761b71366612b7ba33319699047c0e93f3a255c948b2715ca154b956a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionAlias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArn")
    def sagemaker_image_version_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionArn"))

    @sagemaker_image_version_arn.setter
    def sagemaker_image_version_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0941d3a8e269262668c79424888caf811590ccaa3e01dd58362d352415fea298)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e751eecb82ba7c26832561627b77184827df05bc300571a52b1c2b098d4997b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsCodeEditorAppSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__317d6be62f6111a9635947636a018612156a991e2c30d274dd60a465d28b69e4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAppLifecycleManagement")
    def put_app_lifecycle_management(
        self,
        *,
        idle_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param idle_settings: idle_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#idle_settings SagemakerSpace#idle_settings}
        '''
        value = SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement(
            idle_settings=idle_settings
        )

        return typing.cast(None, jsii.invoke(self, "putAppLifecycleManagement", [value]))

    @jsii.member(jsii_name="putDefaultResourceSpec")
    def put_default_resource_spec(
        self,
        *,
        instance_type: typing.Optional[builtins.str] = None,
        lifecycle_config_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
        sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#instance_type SagemakerSpace#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arn SagemakerSpace#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_arn SagemakerSpace#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_alias SagemakerSpace#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_arn SagemakerSpace#sagemaker_image_version_arn}.
        '''
        value = SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec(
            instance_type=instance_type,
            lifecycle_config_arn=lifecycle_config_arn,
            sagemaker_image_arn=sagemaker_image_arn,
            sagemaker_image_version_alias=sagemaker_image_version_alias,
            sagemaker_image_version_arn=sagemaker_image_version_arn,
        )

        return typing.cast(None, jsii.invoke(self, "putDefaultResourceSpec", [value]))

    @jsii.member(jsii_name="resetAppLifecycleManagement")
    def reset_app_lifecycle_management(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAppLifecycleManagement", []))

    @builtins.property
    @jsii.member(jsii_name="appLifecycleManagement")
    def app_lifecycle_management(
        self,
    ) -> SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference, jsii.get(self, "appLifecycleManagement"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpec")
    def default_resource_spec(
        self,
    ) -> SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference, jsii.get(self, "defaultResourceSpec"))

    @builtins.property
    @jsii.member(jsii_name="appLifecycleManagementInput")
    def app_lifecycle_management_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement], jsii.get(self, "appLifecycleManagementInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpecInput")
    def default_resource_spec_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec], jsii.get(self, "defaultResourceSpecInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24502a64dce99d071639e24d8ce912e35cac6bf98d74a45c0307b593f8ca7a55)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCustomFileSystem",
    jsii_struct_bases=[],
    name_mapping={"efs_file_system": "efsFileSystem"},
)
class SagemakerSpaceSpaceSettingsCustomFileSystem:
    def __init__(
        self,
        *,
        efs_file_system: typing.Union["SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param efs_file_system: efs_file_system block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#efs_file_system SagemakerSpace#efs_file_system}
        '''
        if isinstance(efs_file_system, dict):
            efs_file_system = SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem(**efs_file_system)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__112ca8a187e778b3e5f002236b0b98832762999abc477a6d24346e69705fd054)
            check_type(argname="argument efs_file_system", value=efs_file_system, expected_type=type_hints["efs_file_system"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "efs_file_system": efs_file_system,
        }

    @builtins.property
    def efs_file_system(
        self,
    ) -> "SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem":
        '''efs_file_system block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#efs_file_system SagemakerSpace#efs_file_system}
        '''
        result = self._values.get("efs_file_system")
        assert result is not None, "Required property 'efs_file_system' is missing"
        return typing.cast("SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsCustomFileSystem(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem",
    jsii_struct_bases=[],
    name_mapping={"file_system_id": "fileSystemId"},
)
class SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem:
    def __init__(self, *, file_system_id: builtins.str) -> None:
        '''
        :param file_system_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#file_system_id SagemakerSpace#file_system_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9942b6dad5d662c6e47d841ad90628be151876ccb43aab9cfb1184734650e3b4)
            check_type(argname="argument file_system_id", value=file_system_id, expected_type=type_hints["file_system_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "file_system_id": file_system_id,
        }

    @builtins.property
    def file_system_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#file_system_id SagemakerSpace#file_system_id}.'''
        result = self._values.get("file_system_id")
        assert result is not None, "Required property 'file_system_id' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystemOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystemOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4b80f607e0fa99c9f6947e456ec598b3aa31b9edb4fbbea5dbbe4d5b24dfa752)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="fileSystemIdInput")
    def file_system_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "fileSystemIdInput"))

    @builtins.property
    @jsii.member(jsii_name="fileSystemId")
    def file_system_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fileSystemId"))

    @file_system_id.setter
    def file_system_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46fd42ed06140a72ce7f01913d14716413e6d87fd5af63623d58d8db87125d10)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fileSystemId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46ee77719a80b28959fc7d6cb1d57f6ccfa78b8eee02434c0f86fe22713515cf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsCustomFileSystemList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCustomFileSystemList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a27823798de283d8c850528f62c7d140fa1fe60b8516ba71b551889f93a1b715)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerSpaceSpaceSettingsCustomFileSystemOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__385ae9315300f44f63542a86cc1c697fc07df4f1cedfbbd2a596a13077e6eb9b)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerSpaceSpaceSettingsCustomFileSystemOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5cd00eb5b4a57bf6645c3e37abfc5f2863addc3855f9f87cd87f41b13e4f47c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__140036885c08a978fd2efaba519e22d6e2006b800dac585d59ac08398386a1e0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8739abc5d35d3e89e814d2ec89ebf43c55d8e9d14fcb66b92a8aa05313b88e00)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsCustomFileSystem]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsCustomFileSystem]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsCustomFileSystem]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__560e75e2a74a7d59dfcb3e2d6c9475678e24da172ed578037ecd63af1754a18d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsCustomFileSystemOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCustomFileSystemOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6e5f2894f7d4af0a24eade15ae1fef072957c4596fb4dff9bc507dd65ec476ac)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putEfsFileSystem")
    def put_efs_file_system(self, *, file_system_id: builtins.str) -> None:
        '''
        :param file_system_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#file_system_id SagemakerSpace#file_system_id}.
        '''
        value = SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem(
            file_system_id=file_system_id
        )

        return typing.cast(None, jsii.invoke(self, "putEfsFileSystem", [value]))

    @builtins.property
    @jsii.member(jsii_name="efsFileSystem")
    def efs_file_system(
        self,
    ) -> SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystemOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystemOutputReference, jsii.get(self, "efsFileSystem"))

    @builtins.property
    @jsii.member(jsii_name="efsFileSystemInput")
    def efs_file_system_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem], jsii.get(self, "efsFileSystemInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsCustomFileSystem]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsCustomFileSystem]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsCustomFileSystem]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__47a7db42fc6b1569dcc71b66447f835ab0ca1a9c3636f33a2e2fcd10d75ff4ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettings",
    jsii_struct_bases=[],
    name_mapping={
        "default_resource_spec": "defaultResourceSpec",
        "app_lifecycle_management": "appLifecycleManagement",
        "code_repository": "codeRepository",
    },
)
class SagemakerSpaceSpaceSettingsJupyterLabAppSettings:
    def __init__(
        self,
        *,
        default_resource_spec: typing.Union["SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec", typing.Dict[builtins.str, typing.Any]],
        app_lifecycle_management: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement", typing.Dict[builtins.str, typing.Any]]] = None,
        code_repository: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
        :param app_lifecycle_management: app_lifecycle_management block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_lifecycle_management SagemakerSpace#app_lifecycle_management}
        :param code_repository: code_repository block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_repository SagemakerSpace#code_repository}
        '''
        if isinstance(default_resource_spec, dict):
            default_resource_spec = SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec(**default_resource_spec)
        if isinstance(app_lifecycle_management, dict):
            app_lifecycle_management = SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement(**app_lifecycle_management)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9e0761236c1b0559f7825b35beeda07aaebb0d4cd457556589eb00bd1837ea47)
            check_type(argname="argument default_resource_spec", value=default_resource_spec, expected_type=type_hints["default_resource_spec"])
            check_type(argname="argument app_lifecycle_management", value=app_lifecycle_management, expected_type=type_hints["app_lifecycle_management"])
            check_type(argname="argument code_repository", value=code_repository, expected_type=type_hints["code_repository"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_resource_spec": default_resource_spec,
        }
        if app_lifecycle_management is not None:
            self._values["app_lifecycle_management"] = app_lifecycle_management
        if code_repository is not None:
            self._values["code_repository"] = code_repository

    @builtins.property
    def default_resource_spec(
        self,
    ) -> "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec":
        '''default_resource_spec block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
        '''
        result = self._values.get("default_resource_spec")
        assert result is not None, "Required property 'default_resource_spec' is missing"
        return typing.cast("SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec", result)

    @builtins.property
    def app_lifecycle_management(
        self,
    ) -> typing.Optional["SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement"]:
        '''app_lifecycle_management block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_lifecycle_management SagemakerSpace#app_lifecycle_management}
        '''
        result = self._values.get("app_lifecycle_management")
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement"], result)

    @builtins.property
    def code_repository(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository"]]]:
        '''code_repository block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_repository SagemakerSpace#code_repository}
        '''
        result = self._values.get("code_repository")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsJupyterLabAppSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement",
    jsii_struct_bases=[],
    name_mapping={"idle_settings": "idleSettings"},
)
class SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement:
    def __init__(
        self,
        *,
        idle_settings: typing.Optional[typing.Union["SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param idle_settings: idle_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#idle_settings SagemakerSpace#idle_settings}
        '''
        if isinstance(idle_settings, dict):
            idle_settings = SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings(**idle_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8912e73b7546478efe7c543eb7b237ae9ad8f5cca9f8410ccc7fcbe0151f6c55)
            check_type(argname="argument idle_settings", value=idle_settings, expected_type=type_hints["idle_settings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if idle_settings is not None:
            self._values["idle_settings"] = idle_settings

    @builtins.property
    def idle_settings(
        self,
    ) -> typing.Optional["SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings"]:
        '''idle_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#idle_settings SagemakerSpace#idle_settings}
        '''
        result = self._values.get("idle_settings")
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings",
    jsii_struct_bases=[],
    name_mapping={"idle_timeout_in_minutes": "idleTimeoutInMinutes"},
)
class SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings:
    def __init__(
        self,
        *,
        idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#idle_timeout_in_minutes SagemakerSpace#idle_timeout_in_minutes}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bee71df81866d5d610125d52ef746714573b22918b353d9ecf0143b1e3932e24)
            check_type(argname="argument idle_timeout_in_minutes", value=idle_timeout_in_minutes, expected_type=type_hints["idle_timeout_in_minutes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if idle_timeout_in_minutes is not None:
            self._values["idle_timeout_in_minutes"] = idle_timeout_in_minutes

    @builtins.property
    def idle_timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#idle_timeout_in_minutes SagemakerSpace#idle_timeout_in_minutes}.'''
        result = self._values.get("idle_timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__565caa980cf6a6e6cb9bc880128d8dcb29bf826be53256e2cfcee158aaeca438)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetIdleTimeoutInMinutes")
    def reset_idle_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdleTimeoutInMinutes", []))

    @builtins.property
    @jsii.member(jsii_name="idleTimeoutInMinutesInput")
    def idle_timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "idleTimeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="idleTimeoutInMinutes")
    def idle_timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "idleTimeoutInMinutes"))

    @idle_timeout_in_minutes.setter
    def idle_timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd0c9f3165be3b2f12197d7011703b64511560d6ddc5ab4d66f0744582b6f285)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "idleTimeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__25491df99a4f4af2737727c19ed55ce0d27380074d6b2f5d549d499e752773c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7769d61be2c81a0c29ff83b6956fe6b29ed741d6e3bc6007198a597be3fde052)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putIdleSettings")
    def put_idle_settings(
        self,
        *,
        idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#idle_timeout_in_minutes SagemakerSpace#idle_timeout_in_minutes}.
        '''
        value = SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings(
            idle_timeout_in_minutes=idle_timeout_in_minutes
        )

        return typing.cast(None, jsii.invoke(self, "putIdleSettings", [value]))

    @jsii.member(jsii_name="resetIdleSettings")
    def reset_idle_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdleSettings", []))

    @builtins.property
    @jsii.member(jsii_name="idleSettings")
    def idle_settings(
        self,
    ) -> SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference, jsii.get(self, "idleSettings"))

    @builtins.property
    @jsii.member(jsii_name="idleSettingsInput")
    def idle_settings_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings], jsii.get(self, "idleSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83f68fb89cb261a6af1c5d4614d76c06f4c7a5511e6f4049dd40dfd69e75625e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository",
    jsii_struct_bases=[],
    name_mapping={"repository_url": "repositoryUrl"},
)
class SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository:
    def __init__(self, *, repository_url: builtins.str) -> None:
        '''
        :param repository_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#repository_url SagemakerSpace#repository_url}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__873fa12998dbb1eaa72b0e546f99608d96faeb2ac60425c6ad7521f6c49ff0e3)
            check_type(argname="argument repository_url", value=repository_url, expected_type=type_hints["repository_url"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "repository_url": repository_url,
        }

    @builtins.property
    def repository_url(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#repository_url SagemakerSpace#repository_url}.'''
        result = self._values.get("repository_url")
        assert result is not None, "Required property 'repository_url' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepositoryList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepositoryList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b3157d2d8d2ab7590b9c4ed34a93a8938dbaebbbfdfad1b40754dc8d954f4212)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepositoryOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b73cf3a40dd00eb1ede63ddf8bc259863e3bd4c03df9b7cdaa8de941275dfa6f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepositoryOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12b4abd6d865a0c865ec3225c5ac7a77a47d35d452c6b5b69ddc44e3160c7b1d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a1703fdf997ee4f317458b027fbf4dc3f9034e0e69c88c0a8529b3244d9719a6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__581737c2378fe5809af73194fda57db2ec4536419e74e0680e57371deac7e293)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dfc5fdaf05265ed267e3b4eecbf279e153e238d0f2f466794bbbc2b4dcd3f4b8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepositoryOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepositoryOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c8748620df85e6c88d66ab2dd9577de60471137aaff0aeee3200516710277082)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="repositoryUrlInput")
    def repository_url_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "repositoryUrlInput"))

    @builtins.property
    @jsii.member(jsii_name="repositoryUrl")
    def repository_url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "repositoryUrl"))

    @repository_url.setter
    def repository_url(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6b55afb8bc7cc777a81bb38b36b8834b1ed54b65124de762aab03d2ba254da2a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "repositoryUrl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aa5f50383f8b027bbacc2168c2bbf85b427e07cf8aff2bc236dd611241b617a2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec",
    jsii_struct_bases=[],
    name_mapping={
        "instance_type": "instanceType",
        "lifecycle_config_arn": "lifecycleConfigArn",
        "sagemaker_image_arn": "sagemakerImageArn",
        "sagemaker_image_version_alias": "sagemakerImageVersionAlias",
        "sagemaker_image_version_arn": "sagemakerImageVersionArn",
    },
)
class SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec:
    def __init__(
        self,
        *,
        instance_type: typing.Optional[builtins.str] = None,
        lifecycle_config_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
        sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#instance_type SagemakerSpace#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arn SagemakerSpace#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_arn SagemakerSpace#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_alias SagemakerSpace#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_arn SagemakerSpace#sagemaker_image_version_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__84aa16d9ab5f23f4783f94f9f38bc6976e0576ec8e223fd15a32e186cf4a12f3)
            check_type(argname="argument instance_type", value=instance_type, expected_type=type_hints["instance_type"])
            check_type(argname="argument lifecycle_config_arn", value=lifecycle_config_arn, expected_type=type_hints["lifecycle_config_arn"])
            check_type(argname="argument sagemaker_image_arn", value=sagemaker_image_arn, expected_type=type_hints["sagemaker_image_arn"])
            check_type(argname="argument sagemaker_image_version_alias", value=sagemaker_image_version_alias, expected_type=type_hints["sagemaker_image_version_alias"])
            check_type(argname="argument sagemaker_image_version_arn", value=sagemaker_image_version_arn, expected_type=type_hints["sagemaker_image_version_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if instance_type is not None:
            self._values["instance_type"] = instance_type
        if lifecycle_config_arn is not None:
            self._values["lifecycle_config_arn"] = lifecycle_config_arn
        if sagemaker_image_arn is not None:
            self._values["sagemaker_image_arn"] = sagemaker_image_arn
        if sagemaker_image_version_alias is not None:
            self._values["sagemaker_image_version_alias"] = sagemaker_image_version_alias
        if sagemaker_image_version_arn is not None:
            self._values["sagemaker_image_version_arn"] = sagemaker_image_version_arn

    @builtins.property
    def instance_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#instance_type SagemakerSpace#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lifecycle_config_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arn SagemakerSpace#lifecycle_config_arn}.'''
        result = self._values.get("lifecycle_config_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_arn SagemakerSpace#sagemaker_image_arn}.'''
        result = self._values.get("sagemaker_image_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_alias(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_alias SagemakerSpace#sagemaker_image_version_alias}.'''
        result = self._values.get("sagemaker_image_version_alias")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_arn SagemakerSpace#sagemaker_image_version_arn}.'''
        result = self._values.get("sagemaker_image_version_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpecOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpecOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bc3d0a368a8c743c41a0fe490764fa653db3c99dcf76c09c2ad17545933cac4c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetInstanceType")
    def reset_instance_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceType", []))

    @jsii.member(jsii_name="resetLifecycleConfigArn")
    def reset_lifecycle_config_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycleConfigArn", []))

    @jsii.member(jsii_name="resetSagemakerImageArn")
    def reset_sagemaker_image_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerImageArn", []))

    @jsii.member(jsii_name="resetSagemakerImageVersionAlias")
    def reset_sagemaker_image_version_alias(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerImageVersionAlias", []))

    @jsii.member(jsii_name="resetSagemakerImageVersionArn")
    def reset_sagemaker_image_version_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerImageVersionArn", []))

    @builtins.property
    @jsii.member(jsii_name="instanceTypeInput")
    def instance_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "instanceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArnInput")
    def lifecycle_config_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lifecycleConfigArnInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArnInput")
    def sagemaker_image_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sagemakerImageArnInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAliasInput")
    def sagemaker_image_version_alias_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sagemakerImageVersionAliasInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArnInput")
    def sagemaker_image_version_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sagemakerImageVersionArnInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceType")
    def instance_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "instanceType"))

    @instance_type.setter
    def instance_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__998d23e1103c7930e87e1bc51a327869e3995fd3cb39ecd0bd8a02710491d95b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArn")
    def lifecycle_config_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleConfigArn"))

    @lifecycle_config_arn.setter
    def lifecycle_config_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3cb792e351bd0bf0f64c2e006327f24fc95084eca179c99e39b01d408e1ee4a7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArn")
    def sagemaker_image_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageArn"))

    @sagemaker_image_arn.setter
    def sagemaker_image_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e5b3973a3d646faa2bb7fdfd95852535a0f5f1f72568d5b08cafb29085ce085)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAlias")
    def sagemaker_image_version_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionAlias"))

    @sagemaker_image_version_alias.setter
    def sagemaker_image_version_alias(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2182a73da9d46eb8f9cbeae736120665b25c3b2a2e9e81c3e5106bbc7b3cc602)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionAlias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArn")
    def sagemaker_image_version_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionArn"))

    @sagemaker_image_version_arn.setter
    def sagemaker_image_version_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07dfe0dcbf7a64c113cadf7f3434181b1c895ebbb46697cb5d853da5c2f79979)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ffe98ef836c12eea7425cf4899e62da6c06d44c41b3ccb6cc7889d196e35245)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsJupyterLabAppSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterLabAppSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2703105421a9ff9d1a0e79522bb57a1c482d459de751541ede631cfd02deaad6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAppLifecycleManagement")
    def put_app_lifecycle_management(
        self,
        *,
        idle_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param idle_settings: idle_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#idle_settings SagemakerSpace#idle_settings}
        '''
        value = SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement(
            idle_settings=idle_settings
        )

        return typing.cast(None, jsii.invoke(self, "putAppLifecycleManagement", [value]))

    @jsii.member(jsii_name="putCodeRepository")
    def put_code_repository(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3f5d11ae47a91e0c85788b399c7a050480823b51d7fd236cbb41e1068f9d266d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCodeRepository", [value]))

    @jsii.member(jsii_name="putDefaultResourceSpec")
    def put_default_resource_spec(
        self,
        *,
        instance_type: typing.Optional[builtins.str] = None,
        lifecycle_config_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
        sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#instance_type SagemakerSpace#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arn SagemakerSpace#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_arn SagemakerSpace#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_alias SagemakerSpace#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_arn SagemakerSpace#sagemaker_image_version_arn}.
        '''
        value = SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec(
            instance_type=instance_type,
            lifecycle_config_arn=lifecycle_config_arn,
            sagemaker_image_arn=sagemaker_image_arn,
            sagemaker_image_version_alias=sagemaker_image_version_alias,
            sagemaker_image_version_arn=sagemaker_image_version_arn,
        )

        return typing.cast(None, jsii.invoke(self, "putDefaultResourceSpec", [value]))

    @jsii.member(jsii_name="resetAppLifecycleManagement")
    def reset_app_lifecycle_management(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAppLifecycleManagement", []))

    @jsii.member(jsii_name="resetCodeRepository")
    def reset_code_repository(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCodeRepository", []))

    @builtins.property
    @jsii.member(jsii_name="appLifecycleManagement")
    def app_lifecycle_management(
        self,
    ) -> SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference, jsii.get(self, "appLifecycleManagement"))

    @builtins.property
    @jsii.member(jsii_name="codeRepository")
    def code_repository(
        self,
    ) -> SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepositoryList:
        return typing.cast(SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepositoryList, jsii.get(self, "codeRepository"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpec")
    def default_resource_spec(
        self,
    ) -> SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpecOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpecOutputReference, jsii.get(self, "defaultResourceSpec"))

    @builtins.property
    @jsii.member(jsii_name="appLifecycleManagementInput")
    def app_lifecycle_management_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement], jsii.get(self, "appLifecycleManagementInput"))

    @builtins.property
    @jsii.member(jsii_name="codeRepositoryInput")
    def code_repository_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository]]], jsii.get(self, "codeRepositoryInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpecInput")
    def default_resource_spec_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec], jsii.get(self, "defaultResourceSpecInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__be4a46166d26914512c5096f678035971632155fb1a9a5dd751402a49b4700cd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterServerAppSettings",
    jsii_struct_bases=[],
    name_mapping={
        "default_resource_spec": "defaultResourceSpec",
        "code_repository": "codeRepository",
        "lifecycle_config_arns": "lifecycleConfigArns",
    },
)
class SagemakerSpaceSpaceSettingsJupyterServerAppSettings:
    def __init__(
        self,
        *,
        default_resource_spec: typing.Union["SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec", typing.Dict[builtins.str, typing.Any]],
        code_repository: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository", typing.Dict[builtins.str, typing.Any]]]]] = None,
        lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
        :param code_repository: code_repository block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_repository SagemakerSpace#code_repository}
        :param lifecycle_config_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arns SagemakerSpace#lifecycle_config_arns}.
        '''
        if isinstance(default_resource_spec, dict):
            default_resource_spec = SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec(**default_resource_spec)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__992473c80dd4e3376e69d441f351b8286acc8adf973d4ddcfd1fdbd42dbad503)
            check_type(argname="argument default_resource_spec", value=default_resource_spec, expected_type=type_hints["default_resource_spec"])
            check_type(argname="argument code_repository", value=code_repository, expected_type=type_hints["code_repository"])
            check_type(argname="argument lifecycle_config_arns", value=lifecycle_config_arns, expected_type=type_hints["lifecycle_config_arns"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_resource_spec": default_resource_spec,
        }
        if code_repository is not None:
            self._values["code_repository"] = code_repository
        if lifecycle_config_arns is not None:
            self._values["lifecycle_config_arns"] = lifecycle_config_arns

    @builtins.property
    def default_resource_spec(
        self,
    ) -> "SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec":
        '''default_resource_spec block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
        '''
        result = self._values.get("default_resource_spec")
        assert result is not None, "Required property 'default_resource_spec' is missing"
        return typing.cast("SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec", result)

    @builtins.property
    def code_repository(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository"]]]:
        '''code_repository block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_repository SagemakerSpace#code_repository}
        '''
        result = self._values.get("code_repository")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository"]]], result)

    @builtins.property
    def lifecycle_config_arns(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arns SagemakerSpace#lifecycle_config_arns}.'''
        result = self._values.get("lifecycle_config_arns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsJupyterServerAppSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository",
    jsii_struct_bases=[],
    name_mapping={"repository_url": "repositoryUrl"},
)
class SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository:
    def __init__(self, *, repository_url: builtins.str) -> None:
        '''
        :param repository_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#repository_url SagemakerSpace#repository_url}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e3839c1f5c8dcaaff813458fcb2cac8973649077d4569566e11b828b8e26c3f)
            check_type(argname="argument repository_url", value=repository_url, expected_type=type_hints["repository_url"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "repository_url": repository_url,
        }

    @builtins.property
    def repository_url(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#repository_url SagemakerSpace#repository_url}.'''
        result = self._values.get("repository_url")
        assert result is not None, "Required property 'repository_url' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepositoryList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepositoryList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f61690ee98697f42e9e1f8dc90ee0ec1de58556de79b189d660238662e5473b6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepositoryOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9723791ffd6366142b554427c13dc67b11ad85aa94739b84c16aebde1e2ad221)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepositoryOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__895987d35510b654d06bbe4ca3497d74198f48269f9ab72602c36d0805670358)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cdaaa5c9c6f390d9fe5d6a04183293ad89918a404dee971a86f4947e175419a9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5f8d7ed827a0a046297424ab21f4759d8f6d75d713c1635605485c0c42025738)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a6d7692daf0d85c1fd458cb24b60a38849c52396b9618c5bd627b35900743c97)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepositoryOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepositoryOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__96908912912433b69a5469532bf6280c6ef9de9c45a9268cc34061e800807096)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="repositoryUrlInput")
    def repository_url_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "repositoryUrlInput"))

    @builtins.property
    @jsii.member(jsii_name="repositoryUrl")
    def repository_url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "repositoryUrl"))

    @repository_url.setter
    def repository_url(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__47d61dfabbdf56fe52140b4300afd216066296bab687955ef1557f6d1bcbfe77)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "repositoryUrl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__629ca6885f0d5a7fdf71f5efa4cc96d6c6494a1c35428047cbc92500af563dfb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec",
    jsii_struct_bases=[],
    name_mapping={
        "instance_type": "instanceType",
        "lifecycle_config_arn": "lifecycleConfigArn",
        "sagemaker_image_arn": "sagemakerImageArn",
        "sagemaker_image_version_alias": "sagemakerImageVersionAlias",
        "sagemaker_image_version_arn": "sagemakerImageVersionArn",
    },
)
class SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec:
    def __init__(
        self,
        *,
        instance_type: typing.Optional[builtins.str] = None,
        lifecycle_config_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
        sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#instance_type SagemakerSpace#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arn SagemakerSpace#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_arn SagemakerSpace#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_alias SagemakerSpace#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_arn SagemakerSpace#sagemaker_image_version_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e041734bb626b0f4094ed3d6bf576ee6c1353946fb8db4f050f131c72ccbd9c6)
            check_type(argname="argument instance_type", value=instance_type, expected_type=type_hints["instance_type"])
            check_type(argname="argument lifecycle_config_arn", value=lifecycle_config_arn, expected_type=type_hints["lifecycle_config_arn"])
            check_type(argname="argument sagemaker_image_arn", value=sagemaker_image_arn, expected_type=type_hints["sagemaker_image_arn"])
            check_type(argname="argument sagemaker_image_version_alias", value=sagemaker_image_version_alias, expected_type=type_hints["sagemaker_image_version_alias"])
            check_type(argname="argument sagemaker_image_version_arn", value=sagemaker_image_version_arn, expected_type=type_hints["sagemaker_image_version_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if instance_type is not None:
            self._values["instance_type"] = instance_type
        if lifecycle_config_arn is not None:
            self._values["lifecycle_config_arn"] = lifecycle_config_arn
        if sagemaker_image_arn is not None:
            self._values["sagemaker_image_arn"] = sagemaker_image_arn
        if sagemaker_image_version_alias is not None:
            self._values["sagemaker_image_version_alias"] = sagemaker_image_version_alias
        if sagemaker_image_version_arn is not None:
            self._values["sagemaker_image_version_arn"] = sagemaker_image_version_arn

    @builtins.property
    def instance_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#instance_type SagemakerSpace#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lifecycle_config_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arn SagemakerSpace#lifecycle_config_arn}.'''
        result = self._values.get("lifecycle_config_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_arn SagemakerSpace#sagemaker_image_arn}.'''
        result = self._values.get("sagemaker_image_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_alias(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_alias SagemakerSpace#sagemaker_image_version_alias}.'''
        result = self._values.get("sagemaker_image_version_alias")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_arn SagemakerSpace#sagemaker_image_version_arn}.'''
        result = self._values.get("sagemaker_image_version_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1439246356035c5645f0248add59a13346d3078b07dcc910c03d0a8f76985dbb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetInstanceType")
    def reset_instance_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceType", []))

    @jsii.member(jsii_name="resetLifecycleConfigArn")
    def reset_lifecycle_config_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycleConfigArn", []))

    @jsii.member(jsii_name="resetSagemakerImageArn")
    def reset_sagemaker_image_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerImageArn", []))

    @jsii.member(jsii_name="resetSagemakerImageVersionAlias")
    def reset_sagemaker_image_version_alias(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerImageVersionAlias", []))

    @jsii.member(jsii_name="resetSagemakerImageVersionArn")
    def reset_sagemaker_image_version_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerImageVersionArn", []))

    @builtins.property
    @jsii.member(jsii_name="instanceTypeInput")
    def instance_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "instanceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArnInput")
    def lifecycle_config_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lifecycleConfigArnInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArnInput")
    def sagemaker_image_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sagemakerImageArnInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAliasInput")
    def sagemaker_image_version_alias_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sagemakerImageVersionAliasInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArnInput")
    def sagemaker_image_version_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sagemakerImageVersionArnInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceType")
    def instance_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "instanceType"))

    @instance_type.setter
    def instance_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__65a8d6bcd70aadb6661570e87ccd94ec1e7254f24ff7bb181726f2891bd515f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArn")
    def lifecycle_config_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleConfigArn"))

    @lifecycle_config_arn.setter
    def lifecycle_config_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ebf39b95eca9c1a519c9a886063d1bfb5778d6b916d7fda238000d6c3202a64)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArn")
    def sagemaker_image_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageArn"))

    @sagemaker_image_arn.setter
    def sagemaker_image_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee5182a4c96d663d39d5aec07946c88cbc97424f6d56f75f6a1044cf2f52474a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAlias")
    def sagemaker_image_version_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionAlias"))

    @sagemaker_image_version_alias.setter
    def sagemaker_image_version_alias(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__138ff88751d6c867f9642a0bdd86a254946febffc16712954a6013f6149ea858)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionAlias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArn")
    def sagemaker_image_version_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionArn"))

    @sagemaker_image_version_arn.setter
    def sagemaker_image_version_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2d45484ed796c20953945835556c4f80fb85e102dfb799af9252628781d3404)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b4e662b00c0fc7e3dfe6e99878294d65647423c59fb65157a440746803c53eb4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsJupyterServerAppSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsJupyterServerAppSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__aa8ecb4bd5c701bb10e29a4f1f60da29ae5c0cce2449f389e95571b5571ed110)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCodeRepository")
    def put_code_repository(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6271fad303235476884db494efd94db9000a0e2bc58938fb575cb6748065fe94)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCodeRepository", [value]))

    @jsii.member(jsii_name="putDefaultResourceSpec")
    def put_default_resource_spec(
        self,
        *,
        instance_type: typing.Optional[builtins.str] = None,
        lifecycle_config_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
        sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#instance_type SagemakerSpace#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arn SagemakerSpace#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_arn SagemakerSpace#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_alias SagemakerSpace#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_arn SagemakerSpace#sagemaker_image_version_arn}.
        '''
        value = SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec(
            instance_type=instance_type,
            lifecycle_config_arn=lifecycle_config_arn,
            sagemaker_image_arn=sagemaker_image_arn,
            sagemaker_image_version_alias=sagemaker_image_version_alias,
            sagemaker_image_version_arn=sagemaker_image_version_arn,
        )

        return typing.cast(None, jsii.invoke(self, "putDefaultResourceSpec", [value]))

    @jsii.member(jsii_name="resetCodeRepository")
    def reset_code_repository(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCodeRepository", []))

    @jsii.member(jsii_name="resetLifecycleConfigArns")
    def reset_lifecycle_config_arns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycleConfigArns", []))

    @builtins.property
    @jsii.member(jsii_name="codeRepository")
    def code_repository(
        self,
    ) -> SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepositoryList:
        return typing.cast(SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepositoryList, jsii.get(self, "codeRepository"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpec")
    def default_resource_spec(
        self,
    ) -> SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference, jsii.get(self, "defaultResourceSpec"))

    @builtins.property
    @jsii.member(jsii_name="codeRepositoryInput")
    def code_repository_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository]]], jsii.get(self, "codeRepositoryInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpecInput")
    def default_resource_spec_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec], jsii.get(self, "defaultResourceSpecInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArnsInput")
    def lifecycle_config_arns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "lifecycleConfigArnsInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArns")
    def lifecycle_config_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "lifecycleConfigArns"))

    @lifecycle_config_arns.setter
    def lifecycle_config_arns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8f394e81be4a1adfdd9ca39914b64c5ced4a1eceaa218464477225f00bce1c3b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsJupyterServerAppSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsJupyterServerAppSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsJupyterServerAppSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8adcc9db1e59ead752b6231b0e5fd484553e2fe6795c9d735259527f64d7d7d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsKernelGatewayAppSettings",
    jsii_struct_bases=[],
    name_mapping={
        "default_resource_spec": "defaultResourceSpec",
        "custom_image": "customImage",
        "lifecycle_config_arns": "lifecycleConfigArns",
    },
)
class SagemakerSpaceSpaceSettingsKernelGatewayAppSettings:
    def __init__(
        self,
        *,
        default_resource_spec: typing.Union["SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec", typing.Dict[builtins.str, typing.Any]],
        custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage", typing.Dict[builtins.str, typing.Any]]]]] = None,
        lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
        :param custom_image: custom_image block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#custom_image SagemakerSpace#custom_image}
        :param lifecycle_config_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arns SagemakerSpace#lifecycle_config_arns}.
        '''
        if isinstance(default_resource_spec, dict):
            default_resource_spec = SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec(**default_resource_spec)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e9854e94f83a8f3c14a009a64a859d283ec32abd17ddc36ddd4d0bd9bf990bf)
            check_type(argname="argument default_resource_spec", value=default_resource_spec, expected_type=type_hints["default_resource_spec"])
            check_type(argname="argument custom_image", value=custom_image, expected_type=type_hints["custom_image"])
            check_type(argname="argument lifecycle_config_arns", value=lifecycle_config_arns, expected_type=type_hints["lifecycle_config_arns"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_resource_spec": default_resource_spec,
        }
        if custom_image is not None:
            self._values["custom_image"] = custom_image
        if lifecycle_config_arns is not None:
            self._values["lifecycle_config_arns"] = lifecycle_config_arns

    @builtins.property
    def default_resource_spec(
        self,
    ) -> "SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec":
        '''default_resource_spec block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
        '''
        result = self._values.get("default_resource_spec")
        assert result is not None, "Required property 'default_resource_spec' is missing"
        return typing.cast("SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec", result)

    @builtins.property
    def custom_image(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage"]]]:
        '''custom_image block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#custom_image SagemakerSpace#custom_image}
        '''
        result = self._values.get("custom_image")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage"]]], result)

    @builtins.property
    def lifecycle_config_arns(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arns SagemakerSpace#lifecycle_config_arns}.'''
        result = self._values.get("lifecycle_config_arns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsKernelGatewayAppSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage",
    jsii_struct_bases=[],
    name_mapping={
        "app_image_config_name": "appImageConfigName",
        "image_name": "imageName",
        "image_version_number": "imageVersionNumber",
    },
)
class SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage:
    def __init__(
        self,
        *,
        app_image_config_name: builtins.str,
        image_name: builtins.str,
        image_version_number: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param app_image_config_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_image_config_name SagemakerSpace#app_image_config_name}.
        :param image_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#image_name SagemakerSpace#image_name}.
        :param image_version_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#image_version_number SagemakerSpace#image_version_number}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd8586840246b65c76422099af1417fa73e8bb43c17d85306372a3b137d69b4a)
            check_type(argname="argument app_image_config_name", value=app_image_config_name, expected_type=type_hints["app_image_config_name"])
            check_type(argname="argument image_name", value=image_name, expected_type=type_hints["image_name"])
            check_type(argname="argument image_version_number", value=image_version_number, expected_type=type_hints["image_version_number"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "app_image_config_name": app_image_config_name,
            "image_name": image_name,
        }
        if image_version_number is not None:
            self._values["image_version_number"] = image_version_number

    @builtins.property
    def app_image_config_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_image_config_name SagemakerSpace#app_image_config_name}.'''
        result = self._values.get("app_image_config_name")
        assert result is not None, "Required property 'app_image_config_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def image_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#image_name SagemakerSpace#image_name}.'''
        result = self._values.get("image_name")
        assert result is not None, "Required property 'image_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def image_version_number(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#image_version_number SagemakerSpace#image_version_number}.'''
        result = self._values.get("image_version_number")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImageList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImageList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0a44cacdb2e18c145872bb97dcb4826f0417bebbb6f63b7ee91dbec36a6946d1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImageOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e047e6aa09de8afc60885c279627efe68b57a76281ebfa1656fd1c56dbf1ce8f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImageOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c774f62d330aee1c30eeca783f8e4093705b2f4fd859bd004bde4ad5d1ec107)
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
            type_hints = typing.get_type_hints(_typecheckingstub__201f55438c1763c755c6de7f08e72437255d28076aa8451f8614351b29b77b12)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d9eeffe0da19f1d2f2ac7bfd4b2e9d63ae3494fb15e9d5a7e394df99f922c07f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87d9b7ed19bb98fab295d0bc75e7ef04dc6bcc52d2da4f41cf9a8d008ff12d57)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImageOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImageOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8b64ad672feb33146ba118c357a72188b825c65554972e30d00c199cf608ed34)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetImageVersionNumber")
    def reset_image_version_number(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetImageVersionNumber", []))

    @builtins.property
    @jsii.member(jsii_name="appImageConfigNameInput")
    def app_image_config_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "appImageConfigNameInput"))

    @builtins.property
    @jsii.member(jsii_name="imageNameInput")
    def image_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "imageNameInput"))

    @builtins.property
    @jsii.member(jsii_name="imageVersionNumberInput")
    def image_version_number_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "imageVersionNumberInput"))

    @builtins.property
    @jsii.member(jsii_name="appImageConfigName")
    def app_image_config_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "appImageConfigName"))

    @app_image_config_name.setter
    def app_image_config_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8c0423bca26b590882205f681f9c70f005b0684c109d3bf6d2ef5b7794252139)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "appImageConfigName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imageName")
    def image_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "imageName"))

    @image_name.setter
    def image_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6517ca627e5a59eeea3b252c331ce0d7037a24ec9f30aceb87800553a2affc8c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imageName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imageVersionNumber")
    def image_version_number(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "imageVersionNumber"))

    @image_version_number.setter
    def image_version_number(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2cb064e2c0fb8febdc753a1703053223d3b08fd57322184b6689643643e78238)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imageVersionNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c0da85dedb4ceab7bed940dd90829471f71ebe0ccf72cf78faafdb644cb373e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec",
    jsii_struct_bases=[],
    name_mapping={
        "instance_type": "instanceType",
        "lifecycle_config_arn": "lifecycleConfigArn",
        "sagemaker_image_arn": "sagemakerImageArn",
        "sagemaker_image_version_alias": "sagemakerImageVersionAlias",
        "sagemaker_image_version_arn": "sagemakerImageVersionArn",
    },
)
class SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec:
    def __init__(
        self,
        *,
        instance_type: typing.Optional[builtins.str] = None,
        lifecycle_config_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
        sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#instance_type SagemakerSpace#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arn SagemakerSpace#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_arn SagemakerSpace#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_alias SagemakerSpace#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_arn SagemakerSpace#sagemaker_image_version_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ff5767b78f355ce4af906ad13fac31f8e1ea27e88257de30de0254762da2fd2)
            check_type(argname="argument instance_type", value=instance_type, expected_type=type_hints["instance_type"])
            check_type(argname="argument lifecycle_config_arn", value=lifecycle_config_arn, expected_type=type_hints["lifecycle_config_arn"])
            check_type(argname="argument sagemaker_image_arn", value=sagemaker_image_arn, expected_type=type_hints["sagemaker_image_arn"])
            check_type(argname="argument sagemaker_image_version_alias", value=sagemaker_image_version_alias, expected_type=type_hints["sagemaker_image_version_alias"])
            check_type(argname="argument sagemaker_image_version_arn", value=sagemaker_image_version_arn, expected_type=type_hints["sagemaker_image_version_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if instance_type is not None:
            self._values["instance_type"] = instance_type
        if lifecycle_config_arn is not None:
            self._values["lifecycle_config_arn"] = lifecycle_config_arn
        if sagemaker_image_arn is not None:
            self._values["sagemaker_image_arn"] = sagemaker_image_arn
        if sagemaker_image_version_alias is not None:
            self._values["sagemaker_image_version_alias"] = sagemaker_image_version_alias
        if sagemaker_image_version_arn is not None:
            self._values["sagemaker_image_version_arn"] = sagemaker_image_version_arn

    @builtins.property
    def instance_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#instance_type SagemakerSpace#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lifecycle_config_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arn SagemakerSpace#lifecycle_config_arn}.'''
        result = self._values.get("lifecycle_config_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_arn SagemakerSpace#sagemaker_image_arn}.'''
        result = self._values.get("sagemaker_image_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_alias(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_alias SagemakerSpace#sagemaker_image_version_alias}.'''
        result = self._values.get("sagemaker_image_version_alias")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_arn SagemakerSpace#sagemaker_image_version_arn}.'''
        result = self._values.get("sagemaker_image_version_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpecOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpecOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a4e1b85b2fc8be6175241012e79a86bbb8b72b866f08a07bf588eb2f0128cb91)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetInstanceType")
    def reset_instance_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInstanceType", []))

    @jsii.member(jsii_name="resetLifecycleConfigArn")
    def reset_lifecycle_config_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycleConfigArn", []))

    @jsii.member(jsii_name="resetSagemakerImageArn")
    def reset_sagemaker_image_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerImageArn", []))

    @jsii.member(jsii_name="resetSagemakerImageVersionAlias")
    def reset_sagemaker_image_version_alias(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerImageVersionAlias", []))

    @jsii.member(jsii_name="resetSagemakerImageVersionArn")
    def reset_sagemaker_image_version_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSagemakerImageVersionArn", []))

    @builtins.property
    @jsii.member(jsii_name="instanceTypeInput")
    def instance_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "instanceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArnInput")
    def lifecycle_config_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lifecycleConfigArnInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArnInput")
    def sagemaker_image_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sagemakerImageArnInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAliasInput")
    def sagemaker_image_version_alias_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sagemakerImageVersionAliasInput"))

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArnInput")
    def sagemaker_image_version_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sagemakerImageVersionArnInput"))

    @builtins.property
    @jsii.member(jsii_name="instanceType")
    def instance_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "instanceType"))

    @instance_type.setter
    def instance_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__645dfd4025663e347b47026656cb14dca69907f5d246d2a7f31a1b37b9557178)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArn")
    def lifecycle_config_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleConfigArn"))

    @lifecycle_config_arn.setter
    def lifecycle_config_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aff47115340c49679415af92368ba1e57771983311537345d279ee56eabdd0b1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArn")
    def sagemaker_image_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageArn"))

    @sagemaker_image_arn.setter
    def sagemaker_image_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e5275a8531f8c3cc2246fe00b7525e8d91bf555c372fcd7094fcaa48e1d8757)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAlias")
    def sagemaker_image_version_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionAlias"))

    @sagemaker_image_version_alias.setter
    def sagemaker_image_version_alias(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6c77a1ff161691ba103b503ae3eccfaf1d58ba4383c2febfc273178ed5b4f5a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionAlias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArn")
    def sagemaker_image_version_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionArn"))

    @sagemaker_image_version_arn.setter
    def sagemaker_image_version_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ddeef098aa673d2cff7bea1a88b8a47d933fd056cc72d722a54c369136c30c08)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d287396945add9aaa35b73626d7d24e4ce7877d8567d34e1a0d3ed8525be3bc9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__68f69d16560c5f235bd76ac7802e903b7b1ffecd5b23ede96ffee14e3fecd0f0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomImage")
    def put_custom_image(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__47dd0ded8f2323a89c7672b1c83e9c4fadb16648d285b972f52d464b1ac61b34)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCustomImage", [value]))

    @jsii.member(jsii_name="putDefaultResourceSpec")
    def put_default_resource_spec(
        self,
        *,
        instance_type: typing.Optional[builtins.str] = None,
        lifecycle_config_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_arn: typing.Optional[builtins.str] = None,
        sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
        sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#instance_type SagemakerSpace#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arn SagemakerSpace#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_arn SagemakerSpace#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_alias SagemakerSpace#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sagemaker_image_version_arn SagemakerSpace#sagemaker_image_version_arn}.
        '''
        value = SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec(
            instance_type=instance_type,
            lifecycle_config_arn=lifecycle_config_arn,
            sagemaker_image_arn=sagemaker_image_arn,
            sagemaker_image_version_alias=sagemaker_image_version_alias,
            sagemaker_image_version_arn=sagemaker_image_version_arn,
        )

        return typing.cast(None, jsii.invoke(self, "putDefaultResourceSpec", [value]))

    @jsii.member(jsii_name="resetCustomImage")
    def reset_custom_image(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomImage", []))

    @jsii.member(jsii_name="resetLifecycleConfigArns")
    def reset_lifecycle_config_arns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycleConfigArns", []))

    @builtins.property
    @jsii.member(jsii_name="customImage")
    def custom_image(
        self,
    ) -> SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImageList:
        return typing.cast(SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImageList, jsii.get(self, "customImage"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpec")
    def default_resource_spec(
        self,
    ) -> SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpecOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpecOutputReference, jsii.get(self, "defaultResourceSpec"))

    @builtins.property
    @jsii.member(jsii_name="customImageInput")
    def custom_image_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage]]], jsii.get(self, "customImageInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpecInput")
    def default_resource_spec_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec], jsii.get(self, "defaultResourceSpecInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArnsInput")
    def lifecycle_config_arns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "lifecycleConfigArnsInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArns")
    def lifecycle_config_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "lifecycleConfigArns"))

    @lifecycle_config_arns.setter
    def lifecycle_config_arns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c13ec130fdfcf6bd69a4973b19b315e661b359992a7b99a7b935a3b35c728b18)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsKernelGatewayAppSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsKernelGatewayAppSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsKernelGatewayAppSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2d881b2bf8a75568731f80fc2987155dc04503424c7c82d47f62ce6f441c36b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7178ff6584dff1fc2a340e3e503e7a6c47431121c5b32107e4b783816ca51bdb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCodeEditorAppSettings")
    def put_code_editor_app_settings(
        self,
        *,
        default_resource_spec: typing.Union[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]],
        app_lifecycle_management: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
        :param app_lifecycle_management: app_lifecycle_management block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_lifecycle_management SagemakerSpace#app_lifecycle_management}
        '''
        value = SagemakerSpaceSpaceSettingsCodeEditorAppSettings(
            default_resource_spec=default_resource_spec,
            app_lifecycle_management=app_lifecycle_management,
        )

        return typing.cast(None, jsii.invoke(self, "putCodeEditorAppSettings", [value]))

    @jsii.member(jsii_name="putCustomFileSystem")
    def put_custom_file_system(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsCustomFileSystem, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__caf04a510bc79740b0cf90155f8ef4faf561b1e35276ac06befc24c3a5c8ec05)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCustomFileSystem", [value]))

    @jsii.member(jsii_name="putJupyterLabAppSettings")
    def put_jupyter_lab_app_settings(
        self,
        *,
        default_resource_spec: typing.Union[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]],
        app_lifecycle_management: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement, typing.Dict[builtins.str, typing.Any]]] = None,
        code_repository: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
        :param app_lifecycle_management: app_lifecycle_management block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_lifecycle_management SagemakerSpace#app_lifecycle_management}
        :param code_repository: code_repository block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_repository SagemakerSpace#code_repository}
        '''
        value = SagemakerSpaceSpaceSettingsJupyterLabAppSettings(
            default_resource_spec=default_resource_spec,
            app_lifecycle_management=app_lifecycle_management,
            code_repository=code_repository,
        )

        return typing.cast(None, jsii.invoke(self, "putJupyterLabAppSettings", [value]))

    @jsii.member(jsii_name="putJupyterServerAppSettings")
    def put_jupyter_server_app_settings(
        self,
        *,
        default_resource_spec: typing.Union[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]],
        code_repository: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]]] = None,
        lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
        :param code_repository: code_repository block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#code_repository SagemakerSpace#code_repository}
        :param lifecycle_config_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arns SagemakerSpace#lifecycle_config_arns}.
        '''
        value = SagemakerSpaceSpaceSettingsJupyterServerAppSettings(
            default_resource_spec=default_resource_spec,
            code_repository=code_repository,
            lifecycle_config_arns=lifecycle_config_arns,
        )

        return typing.cast(None, jsii.invoke(self, "putJupyterServerAppSettings", [value]))

    @jsii.member(jsii_name="putKernelGatewayAppSettings")
    def put_kernel_gateway_app_settings(
        self,
        *,
        default_resource_spec: typing.Union[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]],
        custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]]] = None,
        lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
        :param custom_image: custom_image block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#custom_image SagemakerSpace#custom_image}
        :param lifecycle_config_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#lifecycle_config_arns SagemakerSpace#lifecycle_config_arns}.
        '''
        value = SagemakerSpaceSpaceSettingsKernelGatewayAppSettings(
            default_resource_spec=default_resource_spec,
            custom_image=custom_image,
            lifecycle_config_arns=lifecycle_config_arns,
        )

        return typing.cast(None, jsii.invoke(self, "putKernelGatewayAppSettings", [value]))

    @jsii.member(jsii_name="putSpaceStorageSettings")
    def put_space_storage_settings(
        self,
        *,
        ebs_storage_settings: typing.Union["SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param ebs_storage_settings: ebs_storage_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#ebs_storage_settings SagemakerSpace#ebs_storage_settings}
        '''
        value = SagemakerSpaceSpaceSettingsSpaceStorageSettings(
            ebs_storage_settings=ebs_storage_settings
        )

        return typing.cast(None, jsii.invoke(self, "putSpaceStorageSettings", [value]))

    @jsii.member(jsii_name="resetAppType")
    def reset_app_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAppType", []))

    @jsii.member(jsii_name="resetCodeEditorAppSettings")
    def reset_code_editor_app_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCodeEditorAppSettings", []))

    @jsii.member(jsii_name="resetCustomFileSystem")
    def reset_custom_file_system(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomFileSystem", []))

    @jsii.member(jsii_name="resetJupyterLabAppSettings")
    def reset_jupyter_lab_app_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetJupyterLabAppSettings", []))

    @jsii.member(jsii_name="resetJupyterServerAppSettings")
    def reset_jupyter_server_app_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetJupyterServerAppSettings", []))

    @jsii.member(jsii_name="resetKernelGatewayAppSettings")
    def reset_kernel_gateway_app_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKernelGatewayAppSettings", []))

    @jsii.member(jsii_name="resetSpaceStorageSettings")
    def reset_space_storage_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSpaceStorageSettings", []))

    @builtins.property
    @jsii.member(jsii_name="codeEditorAppSettings")
    def code_editor_app_settings(
        self,
    ) -> SagemakerSpaceSpaceSettingsCodeEditorAppSettingsOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsCodeEditorAppSettingsOutputReference, jsii.get(self, "codeEditorAppSettings"))

    @builtins.property
    @jsii.member(jsii_name="customFileSystem")
    def custom_file_system(self) -> SagemakerSpaceSpaceSettingsCustomFileSystemList:
        return typing.cast(SagemakerSpaceSpaceSettingsCustomFileSystemList, jsii.get(self, "customFileSystem"))

    @builtins.property
    @jsii.member(jsii_name="jupyterLabAppSettings")
    def jupyter_lab_app_settings(
        self,
    ) -> SagemakerSpaceSpaceSettingsJupyterLabAppSettingsOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsJupyterLabAppSettingsOutputReference, jsii.get(self, "jupyterLabAppSettings"))

    @builtins.property
    @jsii.member(jsii_name="jupyterServerAppSettings")
    def jupyter_server_app_settings(
        self,
    ) -> SagemakerSpaceSpaceSettingsJupyterServerAppSettingsOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsJupyterServerAppSettingsOutputReference, jsii.get(self, "jupyterServerAppSettings"))

    @builtins.property
    @jsii.member(jsii_name="kernelGatewayAppSettings")
    def kernel_gateway_app_settings(
        self,
    ) -> SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsOutputReference, jsii.get(self, "kernelGatewayAppSettings"))

    @builtins.property
    @jsii.member(jsii_name="spaceStorageSettings")
    def space_storage_settings(
        self,
    ) -> "SagemakerSpaceSpaceSettingsSpaceStorageSettingsOutputReference":
        return typing.cast("SagemakerSpaceSpaceSettingsSpaceStorageSettingsOutputReference", jsii.get(self, "spaceStorageSettings"))

    @builtins.property
    @jsii.member(jsii_name="appTypeInput")
    def app_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "appTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="codeEditorAppSettingsInput")
    def code_editor_app_settings_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettings], jsii.get(self, "codeEditorAppSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="customFileSystemInput")
    def custom_file_system_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsCustomFileSystem]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsCustomFileSystem]]], jsii.get(self, "customFileSystemInput"))

    @builtins.property
    @jsii.member(jsii_name="jupyterLabAppSettingsInput")
    def jupyter_lab_app_settings_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettings], jsii.get(self, "jupyterLabAppSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="jupyterServerAppSettingsInput")
    def jupyter_server_app_settings_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsJupyterServerAppSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsJupyterServerAppSettings], jsii.get(self, "jupyterServerAppSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="kernelGatewayAppSettingsInput")
    def kernel_gateway_app_settings_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsKernelGatewayAppSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsKernelGatewayAppSettings], jsii.get(self, "kernelGatewayAppSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="spaceStorageSettingsInput")
    def space_storage_settings_input(
        self,
    ) -> typing.Optional["SagemakerSpaceSpaceSettingsSpaceStorageSettings"]:
        return typing.cast(typing.Optional["SagemakerSpaceSpaceSettingsSpaceStorageSettings"], jsii.get(self, "spaceStorageSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="appType")
    def app_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "appType"))

    @app_type.setter
    def app_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6b2e4f7b76039d56ca610a2fcebf2448881adbe18a90d0dbaf10e8a21bfa8f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "appType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[SagemakerSpaceSpaceSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d56d537b17052102fee3e58c4403924bb5fb45bf7f948dcbf81049402752b620)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsSpaceStorageSettings",
    jsii_struct_bases=[],
    name_mapping={"ebs_storage_settings": "ebsStorageSettings"},
)
class SagemakerSpaceSpaceSettingsSpaceStorageSettings:
    def __init__(
        self,
        *,
        ebs_storage_settings: typing.Union["SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings", typing.Dict[builtins.str, typing.Any]],
    ) -> None:
        '''
        :param ebs_storage_settings: ebs_storage_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#ebs_storage_settings SagemakerSpace#ebs_storage_settings}
        '''
        if isinstance(ebs_storage_settings, dict):
            ebs_storage_settings = SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings(**ebs_storage_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__03003172f20e4275efec43d7ac88f9d7b70318b7ea2bb33f42a1fd831a51524f)
            check_type(argname="argument ebs_storage_settings", value=ebs_storage_settings, expected_type=type_hints["ebs_storage_settings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "ebs_storage_settings": ebs_storage_settings,
        }

    @builtins.property
    def ebs_storage_settings(
        self,
    ) -> "SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings":
        '''ebs_storage_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#ebs_storage_settings SagemakerSpace#ebs_storage_settings}
        '''
        result = self._values.get("ebs_storage_settings")
        assert result is not None, "Required property 'ebs_storage_settings' is missing"
        return typing.cast("SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings", result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsSpaceStorageSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings",
    jsii_struct_bases=[],
    name_mapping={"ebs_volume_size_in_gb": "ebsVolumeSizeInGb"},
)
class SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings:
    def __init__(self, *, ebs_volume_size_in_gb: jsii.Number) -> None:
        '''
        :param ebs_volume_size_in_gb: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#ebs_volume_size_in_gb SagemakerSpace#ebs_volume_size_in_gb}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9f10ac53e365c4cd9cf1eb7b03971aa6b41af2c5a6e5bcd44059a3d795da664c)
            check_type(argname="argument ebs_volume_size_in_gb", value=ebs_volume_size_in_gb, expected_type=type_hints["ebs_volume_size_in_gb"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "ebs_volume_size_in_gb": ebs_volume_size_in_gb,
        }

    @builtins.property
    def ebs_volume_size_in_gb(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#ebs_volume_size_in_gb SagemakerSpace#ebs_volume_size_in_gb}.'''
        result = self._values.get("ebs_volume_size_in_gb")
        assert result is not None, "Required property 'ebs_volume_size_in_gb' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__03c5388ca1cf57819b663ee79acc69f57e185d86ab76a5c8b7e2479c0164b532)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="ebsVolumeSizeInGbInput")
    def ebs_volume_size_in_gb_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "ebsVolumeSizeInGbInput"))

    @builtins.property
    @jsii.member(jsii_name="ebsVolumeSizeInGb")
    def ebs_volume_size_in_gb(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "ebsVolumeSizeInGb"))

    @ebs_volume_size_in_gb.setter
    def ebs_volume_size_in_gb(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c9cd816570d92b5fbc1a095fec0f3f8c4dca9033b0da8c0f06c027d9923696ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ebsVolumeSizeInGb", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4fad3cdc33f7a0bdc82ba80515b549e5fd29be5f5f0ea12573183ab87dda509)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerSpaceSpaceSettingsSpaceStorageSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSettingsSpaceStorageSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__fe73ed715d2f4302cb3a2598a25ba9aa1419960965f925da5157be33134cc27b)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putEbsStorageSettings")
    def put_ebs_storage_settings(self, *, ebs_volume_size_in_gb: jsii.Number) -> None:
        '''
        :param ebs_volume_size_in_gb: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#ebs_volume_size_in_gb SagemakerSpace#ebs_volume_size_in_gb}.
        '''
        value = SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings(
            ebs_volume_size_in_gb=ebs_volume_size_in_gb
        )

        return typing.cast(None, jsii.invoke(self, "putEbsStorageSettings", [value]))

    @builtins.property
    @jsii.member(jsii_name="ebsStorageSettings")
    def ebs_storage_settings(
        self,
    ) -> SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettingsOutputReference:
        return typing.cast(SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettingsOutputReference, jsii.get(self, "ebsStorageSettings"))

    @builtins.property
    @jsii.member(jsii_name="ebsStorageSettingsInput")
    def ebs_storage_settings_input(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings], jsii.get(self, "ebsStorageSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerSpaceSpaceSettingsSpaceStorageSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSettingsSpaceStorageSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSettingsSpaceStorageSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__55c9cd1bee4500296c256b9556f840b46ae4af5ae5872ac68f56c9f3bef7d25f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSharingSettings",
    jsii_struct_bases=[],
    name_mapping={"sharing_type": "sharingType"},
)
class SagemakerSpaceSpaceSharingSettings:
    def __init__(self, *, sharing_type: builtins.str) -> None:
        '''
        :param sharing_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sharing_type SagemakerSpace#sharing_type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2395e831ef2c28344f0c2a84e20d40bfc9fea6c3c3cd0c471c20d5d66156e66c)
            check_type(argname="argument sharing_type", value=sharing_type, expected_type=type_hints["sharing_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "sharing_type": sharing_type,
        }

    @builtins.property
    def sharing_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sharing_type SagemakerSpace#sharing_type}.'''
        result = self._values.get("sharing_type")
        assert result is not None, "Required property 'sharing_type' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerSpaceSpaceSharingSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerSpaceSpaceSharingSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerSpace.SagemakerSpaceSpaceSharingSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3e8eb0695001db73b46b353b4e78767eb06236d72af3f5674e10bbd648a3a1db)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="sharingTypeInput")
    def sharing_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sharingTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="sharingType")
    def sharing_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sharingType"))

    @sharing_type.setter
    def sharing_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__82f0e75956f388f7ae0d6175e63c6574069b0f917c6bf180132b1ef7c263a0f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sharingType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[SagemakerSpaceSpaceSharingSettings]:
        return typing.cast(typing.Optional[SagemakerSpaceSpaceSharingSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerSpaceSpaceSharingSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a7e5c843cd4e12af1579dc4574b540c252a87c099b5e17e1e4b6cf0a64777c2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "SagemakerSpace",
    "SagemakerSpaceConfig",
    "SagemakerSpaceOwnershipSettings",
    "SagemakerSpaceOwnershipSettingsOutputReference",
    "SagemakerSpaceSpaceSettings",
    "SagemakerSpaceSpaceSettingsCodeEditorAppSettings",
    "SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement",
    "SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings",
    "SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference",
    "SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference",
    "SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec",
    "SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference",
    "SagemakerSpaceSpaceSettingsCodeEditorAppSettingsOutputReference",
    "SagemakerSpaceSpaceSettingsCustomFileSystem",
    "SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem",
    "SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystemOutputReference",
    "SagemakerSpaceSpaceSettingsCustomFileSystemList",
    "SagemakerSpaceSpaceSettingsCustomFileSystemOutputReference",
    "SagemakerSpaceSpaceSettingsJupyterLabAppSettings",
    "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement",
    "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings",
    "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference",
    "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference",
    "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository",
    "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepositoryList",
    "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepositoryOutputReference",
    "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec",
    "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpecOutputReference",
    "SagemakerSpaceSpaceSettingsJupyterLabAppSettingsOutputReference",
    "SagemakerSpaceSpaceSettingsJupyterServerAppSettings",
    "SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository",
    "SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepositoryList",
    "SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepositoryOutputReference",
    "SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec",
    "SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference",
    "SagemakerSpaceSpaceSettingsJupyterServerAppSettingsOutputReference",
    "SagemakerSpaceSpaceSettingsKernelGatewayAppSettings",
    "SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage",
    "SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImageList",
    "SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImageOutputReference",
    "SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec",
    "SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpecOutputReference",
    "SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsOutputReference",
    "SagemakerSpaceSpaceSettingsOutputReference",
    "SagemakerSpaceSpaceSettingsSpaceStorageSettings",
    "SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings",
    "SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettingsOutputReference",
    "SagemakerSpaceSpaceSettingsSpaceStorageSettingsOutputReference",
    "SagemakerSpaceSpaceSharingSettings",
    "SagemakerSpaceSpaceSharingSettingsOutputReference",
]

publication.publish()

def _typecheckingstub__483e5034f1ef836803f788a73b3b74f3f39847f056f55ee1f275a6280c9af650(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    domain_id: builtins.str,
    space_name: builtins.str,
    id: typing.Optional[builtins.str] = None,
    ownership_settings: typing.Optional[typing.Union[SagemakerSpaceOwnershipSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    space_display_name: typing.Optional[builtins.str] = None,
    space_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    space_sharing_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSharingSettings, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__441f0b02b95537af6189844f59cf56fdc2c86363c9f80b7b9c2efe98e09404e5(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83bbd6d0232155ac6c730bf1828ddcc2bf86a2989ae4d706c50841438659c5d0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d941e67aaf624140900c57b999f05c5c554b8d093c21bcfa10893dfa142eb15(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae331cb58f213d7b334d56f60868d2ad24573d50a664bcb7328d44022121292e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea7d6d9763bd57794bd1f4b33ce3fe6747c80c0a4783b6cce821991d173ec9e1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2e500bf3108c671c090b732ebab37e5a3c65fa3e465850a8e544a76981ff63b9(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__880d5f327669e0f6c7d12733f48036e69d1fe733410a5053ec3ce536ece2fee7(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3c0b52f294002890e8c84f48579a94c6878bac1d2fcd31db2c0f16642cfaf7e6(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    domain_id: builtins.str,
    space_name: builtins.str,
    id: typing.Optional[builtins.str] = None,
    ownership_settings: typing.Optional[typing.Union[SagemakerSpaceOwnershipSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    space_display_name: typing.Optional[builtins.str] = None,
    space_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    space_sharing_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSharingSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__19acd632cc0c3912588c22be94f60bdd04c40ae886e073998ec7d3488b6384b7(
    *,
    owner_user_profile_name: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e0bc8bb1d22f437734cfef441ed8bb580092c8f4228f6c6adb6217af9630170(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1ffe916aad59a7934fbeef22de5c1cdf5cfb022e4cfaa881b289c671f37b629(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d65987836f0aea8576849d09471178cc5948b2b91b3f3f45f6fa227536e0d52(
    value: typing.Optional[SagemakerSpaceOwnershipSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c632b19c7c5925278f9fd005421bce8f44de74218f425084b26359419b99f588(
    *,
    app_type: typing.Optional[builtins.str] = None,
    code_editor_app_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsCodeEditorAppSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    custom_file_system: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsCustomFileSystem, typing.Dict[builtins.str, typing.Any]]]]] = None,
    jupyter_lab_app_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsJupyterLabAppSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    jupyter_server_app_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsJupyterServerAppSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    kernel_gateway_app_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsKernelGatewayAppSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    space_storage_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsSpaceStorageSettings, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6dd3d110069c186996a1a8188d944e9c5f58b27c65970d2cb171329604c824a9(
    *,
    default_resource_spec: typing.Union[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]],
    app_lifecycle_management: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b88caa9297d46092423d7053a048d88561e5803de8fe4fd66406ea79d7f0c796(
    *,
    idle_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a5bcb29c2f711cfe5546ff3742bbffdc825e0f7976ee2087aa0ca713e80ce0ea(
    *,
    idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86302438242167c2e03a7fc78c9ef3dfdb506194772484be841382bcb7274f17(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__238362fe06d87cd1b1414958357a9e4e20e54c8d6db13d6bd5ba363eecc1f77e(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe56c9b3c09e84cb9489f08ff2f95460208c6b257234f3c35ef6acb0085a9f81(
    value: typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29fced5b9f229412ff73c6eb206443d6749bf5a22f18f346af864c0e27e18394(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e77d96882ab7b464728618167524fe3b6bfb4731737594f6dfcede88979950b2(
    value: typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6107c608c5258f9bf04cabe4e94c0907e9deecef9fe26db1ea978a47a4c0c0c7(
    *,
    instance_type: typing.Optional[builtins.str] = None,
    lifecycle_config_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
    sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a1f8b5960091c077684a1461331efb03875e602a96f07e4295965d03ebc265a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__375660d50f3ff1bdab0242550ea4f24a56cc1c14fd33c0590caa83b1db95af2c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__093a9b141a87fd64cee1b72a20abc74153f0306e8a923e707eea36f3411df905(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d14f128114d677489d0eb0cbcfc5a29517afcf3bf91a0a9b3b36f1d52fb91226(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4551293761b71366612b7ba33319699047c0e93f3a255c948b2715ca154b956a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0941d3a8e269262668c79424888caf811590ccaa3e01dd58362d352415fea298(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e751eecb82ba7c26832561627b77184827df05bc300571a52b1c2b098d4997b(
    value: typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__317d6be62f6111a9635947636a018612156a991e2c30d274dd60a465d28b69e4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24502a64dce99d071639e24d8ce912e35cac6bf98d74a45c0307b593f8ca7a55(
    value: typing.Optional[SagemakerSpaceSpaceSettingsCodeEditorAppSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__112ca8a187e778b3e5f002236b0b98832762999abc477a6d24346e69705fd054(
    *,
    efs_file_system: typing.Union[SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9942b6dad5d662c6e47d841ad90628be151876ccb43aab9cfb1184734650e3b4(
    *,
    file_system_id: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b80f607e0fa99c9f6947e456ec598b3aa31b9edb4fbbea5dbbe4d5b24dfa752(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46fd42ed06140a72ce7f01913d14716413e6d87fd5af63623d58d8db87125d10(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46ee77719a80b28959fc7d6cb1d57f6ccfa78b8eee02434c0f86fe22713515cf(
    value: typing.Optional[SagemakerSpaceSpaceSettingsCustomFileSystemEfsFileSystem],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a27823798de283d8c850528f62c7d140fa1fe60b8516ba71b551889f93a1b715(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__385ae9315300f44f63542a86cc1c697fc07df4f1cedfbbd2a596a13077e6eb9b(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5cd00eb5b4a57bf6645c3e37abfc5f2863addc3855f9f87cd87f41b13e4f47c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__140036885c08a978fd2efaba519e22d6e2006b800dac585d59ac08398386a1e0(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8739abc5d35d3e89e814d2ec89ebf43c55d8e9d14fcb66b92a8aa05313b88e00(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__560e75e2a74a7d59dfcb3e2d6c9475678e24da172ed578037ecd63af1754a18d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsCustomFileSystem]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6e5f2894f7d4af0a24eade15ae1fef072957c4596fb4dff9bc507dd65ec476ac(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__47a7db42fc6b1569dcc71b66447f835ab0ca1a9c3636f33a2e2fcd10d75ff4ff(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsCustomFileSystem]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9e0761236c1b0559f7825b35beeda07aaebb0d4cd457556589eb00bd1837ea47(
    *,
    default_resource_spec: typing.Union[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]],
    app_lifecycle_management: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement, typing.Dict[builtins.str, typing.Any]]] = None,
    code_repository: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8912e73b7546478efe7c543eb7b237ae9ad8f5cca9f8410ccc7fcbe0151f6c55(
    *,
    idle_settings: typing.Optional[typing.Union[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bee71df81866d5d610125d52ef746714573b22918b353d9ecf0143b1e3932e24(
    *,
    idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__565caa980cf6a6e6cb9bc880128d8dcb29bf826be53256e2cfcee158aaeca438(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd0c9f3165be3b2f12197d7011703b64511560d6ddc5ab4d66f0744582b6f285(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__25491df99a4f4af2737727c19ed55ce0d27380074d6b2f5d549d499e752773c8(
    value: typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7769d61be2c81a0c29ff83b6956fe6b29ed741d6e3bc6007198a597be3fde052(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83f68fb89cb261a6af1c5d4614d76c06f4c7a5511e6f4049dd40dfd69e75625e(
    value: typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__873fa12998dbb1eaa72b0e546f99608d96faeb2ac60425c6ad7521f6c49ff0e3(
    *,
    repository_url: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3157d2d8d2ab7590b9c4ed34a93a8938dbaebbbfdfad1b40754dc8d954f4212(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b73cf3a40dd00eb1ede63ddf8bc259863e3bd4c03df9b7cdaa8de941275dfa6f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12b4abd6d865a0c865ec3225c5ac7a77a47d35d452c6b5b69ddc44e3160c7b1d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a1703fdf997ee4f317458b027fbf4dc3f9034e0e69c88c0a8529b3244d9719a6(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__581737c2378fe5809af73194fda57db2ec4536419e74e0680e57371deac7e293(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dfc5fdaf05265ed267e3b4eecbf279e153e238d0f2f466794bbbc2b4dcd3f4b8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c8748620df85e6c88d66ab2dd9577de60471137aaff0aeee3200516710277082(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6b55afb8bc7cc777a81bb38b36b8834b1ed54b65124de762aab03d2ba254da2a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa5f50383f8b027bbacc2168c2bbf85b427e07cf8aff2bc236dd611241b617a2(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__84aa16d9ab5f23f4783f94f9f38bc6976e0576ec8e223fd15a32e186cf4a12f3(
    *,
    instance_type: typing.Optional[builtins.str] = None,
    lifecycle_config_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
    sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bc3d0a368a8c743c41a0fe490764fa653db3c99dcf76c09c2ad17545933cac4c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__998d23e1103c7930e87e1bc51a327869e3995fd3cb39ecd0bd8a02710491d95b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3cb792e351bd0bf0f64c2e006327f24fc95084eca179c99e39b01d408e1ee4a7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e5b3973a3d646faa2bb7fdfd95852535a0f5f1f72568d5b08cafb29085ce085(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2182a73da9d46eb8f9cbeae736120665b25c3b2a2e9e81c3e5106bbc7b3cc602(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07dfe0dcbf7a64c113cadf7f3434181b1c895ebbb46697cb5d853da5c2f79979(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ffe98ef836c12eea7425cf4899e62da6c06d44c41b3ccb6cc7889d196e35245(
    value: typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsDefaultResourceSpec],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2703105421a9ff9d1a0e79522bb57a1c482d459de751541ede631cfd02deaad6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3f5d11ae47a91e0c85788b399c7a050480823b51d7fd236cbb41e1068f9d266d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsJupyterLabAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__be4a46166d26914512c5096f678035971632155fb1a9a5dd751402a49b4700cd(
    value: typing.Optional[SagemakerSpaceSpaceSettingsJupyterLabAppSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__992473c80dd4e3376e69d441f351b8286acc8adf973d4ddcfd1fdbd42dbad503(
    *,
    default_resource_spec: typing.Union[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]],
    code_repository: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]]] = None,
    lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e3839c1f5c8dcaaff813458fcb2cac8973649077d4569566e11b828b8e26c3f(
    *,
    repository_url: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f61690ee98697f42e9e1f8dc90ee0ec1de58556de79b189d660238662e5473b6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9723791ffd6366142b554427c13dc67b11ad85aa94739b84c16aebde1e2ad221(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__895987d35510b654d06bbe4ca3497d74198f48269f9ab72602c36d0805670358(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cdaaa5c9c6f390d9fe5d6a04183293ad89918a404dee971a86f4947e175419a9(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f8d7ed827a0a046297424ab21f4759d8f6d75d713c1635605485c0c42025738(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6d7692daf0d85c1fd458cb24b60a38849c52396b9618c5bd627b35900743c97(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96908912912433b69a5469532bf6280c6ef9de9c45a9268cc34061e800807096(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__47d61dfabbdf56fe52140b4300afd216066296bab687955ef1557f6d1bcbfe77(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__629ca6885f0d5a7fdf71f5efa4cc96d6c6494a1c35428047cbc92500af563dfb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e041734bb626b0f4094ed3d6bf576ee6c1353946fb8db4f050f131c72ccbd9c6(
    *,
    instance_type: typing.Optional[builtins.str] = None,
    lifecycle_config_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
    sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1439246356035c5645f0248add59a13346d3078b07dcc910c03d0a8f76985dbb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65a8d6bcd70aadb6661570e87ccd94ec1e7254f24ff7bb181726f2891bd515f4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ebf39b95eca9c1a519c9a886063d1bfb5778d6b916d7fda238000d6c3202a64(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee5182a4c96d663d39d5aec07946c88cbc97424f6d56f75f6a1044cf2f52474a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__138ff88751d6c867f9642a0bdd86a254946febffc16712954a6013f6149ea858(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2d45484ed796c20953945835556c4f80fb85e102dfb799af9252628781d3404(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b4e662b00c0fc7e3dfe6e99878294d65647423c59fb65157a440746803c53eb4(
    value: typing.Optional[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsDefaultResourceSpec],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aa8ecb4bd5c701bb10e29a4f1f60da29ae5c0cce2449f389e95571b5571ed110(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6271fad303235476884db494efd94db9000a0e2bc58938fb575cb6748065fe94(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsJupyterServerAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f394e81be4a1adfdd9ca39914b64c5ced4a1eceaa218464477225f00bce1c3b(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8adcc9db1e59ead752b6231b0e5fd484553e2fe6795c9d735259527f64d7d7d0(
    value: typing.Optional[SagemakerSpaceSpaceSettingsJupyterServerAppSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e9854e94f83a8f3c14a009a64a859d283ec32abd17ddc36ddd4d0bd9bf990bf(
    *,
    default_resource_spec: typing.Union[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]],
    custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]]] = None,
    lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd8586840246b65c76422099af1417fa73e8bb43c17d85306372a3b137d69b4a(
    *,
    app_image_config_name: builtins.str,
    image_name: builtins.str,
    image_version_number: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0a44cacdb2e18c145872bb97dcb4826f0417bebbb6f63b7ee91dbec36a6946d1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e047e6aa09de8afc60885c279627efe68b57a76281ebfa1656fd1c56dbf1ce8f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c774f62d330aee1c30eeca783f8e4093705b2f4fd859bd004bde4ad5d1ec107(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__201f55438c1763c755c6de7f08e72437255d28076aa8451f8614351b29b77b12(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9eeffe0da19f1d2f2ac7bfd4b2e9d63ae3494fb15e9d5a7e394df99f922c07f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87d9b7ed19bb98fab295d0bc75e7ef04dc6bcc52d2da4f41cf9a8d008ff12d57(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b64ad672feb33146ba118c357a72188b825c65554972e30d00c199cf608ed34(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8c0423bca26b590882205f681f9c70f005b0684c109d3bf6d2ef5b7794252139(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6517ca627e5a59eeea3b252c331ce0d7037a24ec9f30aceb87800553a2affc8c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2cb064e2c0fb8febdc753a1703053223d3b08fd57322184b6689643643e78238(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c0da85dedb4ceab7bed940dd90829471f71ebe0ccf72cf78faafdb644cb373e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ff5767b78f355ce4af906ad13fac31f8e1ea27e88257de30de0254762da2fd2(
    *,
    instance_type: typing.Optional[builtins.str] = None,
    lifecycle_config_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
    sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a4e1b85b2fc8be6175241012e79a86bbb8b72b866f08a07bf588eb2f0128cb91(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__645dfd4025663e347b47026656cb14dca69907f5d246d2a7f31a1b37b9557178(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aff47115340c49679415af92368ba1e57771983311537345d279ee56eabdd0b1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e5275a8531f8c3cc2246fe00b7525e8d91bf555c372fcd7094fcaa48e1d8757(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6c77a1ff161691ba103b503ae3eccfaf1d58ba4383c2febfc273178ed5b4f5a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ddeef098aa673d2cff7bea1a88b8a47d933fd056cc72d722a54c369136c30c08(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d287396945add9aaa35b73626d7d24e4ce7877d8567d34e1a0d3ed8525be3bc9(
    value: typing.Optional[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsDefaultResourceSpec],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68f69d16560c5f235bd76ac7802e903b7b1ffecd5b23ede96ffee14e3fecd0f0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__47dd0ded8f2323a89c7672b1c83e9c4fadb16648d285b972f52d464b1ac61b34(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsKernelGatewayAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c13ec130fdfcf6bd69a4973b19b315e661b359992a7b99a7b935a3b35c728b18(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d881b2bf8a75568731f80fc2987155dc04503424c7c82d47f62ce6f441c36b4(
    value: typing.Optional[SagemakerSpaceSpaceSettingsKernelGatewayAppSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7178ff6584dff1fc2a340e3e503e7a6c47431121c5b32107e4b783816ca51bdb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__caf04a510bc79740b0cf90155f8ef4faf561b1e35276ac06befc24c3a5c8ec05(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerSpaceSpaceSettingsCustomFileSystem, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6b2e4f7b76039d56ca610a2fcebf2448881adbe18a90d0dbaf10e8a21bfa8f4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d56d537b17052102fee3e58c4403924bb5fb45bf7f948dcbf81049402752b620(
    value: typing.Optional[SagemakerSpaceSpaceSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__03003172f20e4275efec43d7ac88f9d7b70318b7ea2bb33f42a1fd831a51524f(
    *,
    ebs_storage_settings: typing.Union[SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings, typing.Dict[builtins.str, typing.Any]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f10ac53e365c4cd9cf1eb7b03971aa6b41af2c5a6e5bcd44059a3d795da664c(
    *,
    ebs_volume_size_in_gb: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__03c5388ca1cf57819b663ee79acc69f57e185d86ab76a5c8b7e2479c0164b532(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c9cd816570d92b5fbc1a095fec0f3f8c4dca9033b0da8c0f06c027d9923696ba(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4fad3cdc33f7a0bdc82ba80515b549e5fd29be5f5f0ea12573183ab87dda509(
    value: typing.Optional[SagemakerSpaceSpaceSettingsSpaceStorageSettingsEbsStorageSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fe73ed715d2f4302cb3a2598a25ba9aa1419960965f925da5157be33134cc27b(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__55c9cd1bee4500296c256b9556f840b46ae4af5ae5872ac68f56c9f3bef7d25f(
    value: typing.Optional[SagemakerSpaceSpaceSettingsSpaceStorageSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2395e831ef2c28344f0c2a84e20d40bfc9fea6c3c3cd0c471c20d5d66156e66c(
    *,
    sharing_type: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e8eb0695001db73b46b353b4e78767eb06236d72af3f5674e10bbd648a3a1db(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82f0e75956f388f7ae0d6175e63c6574069b0f917c6bf180132b1ef7c263a0f4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a7e5c843cd4e12af1579dc4574b540c252a87c099b5e17e1e4b6cf0a64777c2(
    value: typing.Optional[SagemakerSpaceSpaceSharingSettings],
) -> None:
    """Type checking stubs"""
    pass
