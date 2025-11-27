r'''
# `aws_sagemaker_user_profile`

Refer to the Terraform Registry for docs: [`aws_sagemaker_user_profile`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile).
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


class SagemakerUserProfile(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfile",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile aws_sagemaker_user_profile}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        domain_id: builtins.str,
        user_profile_name: builtins.str,
        id: typing.Optional[builtins.str] = None,
        single_sign_on_user_identifier: typing.Optional[builtins.str] = None,
        single_sign_on_user_value: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        user_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile aws_sagemaker_user_profile} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param domain_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#domain_id SagemakerUserProfile#domain_id}.
        :param user_profile_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#user_profile_name SagemakerUserProfile#user_profile_name}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#id SagemakerUserProfile#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param single_sign_on_user_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#single_sign_on_user_identifier SagemakerUserProfile#single_sign_on_user_identifier}.
        :param single_sign_on_user_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#single_sign_on_user_value SagemakerUserProfile#single_sign_on_user_value}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#tags SagemakerUserProfile#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#tags_all SagemakerUserProfile#tags_all}.
        :param user_settings: user_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#user_settings SagemakerUserProfile#user_settings}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dd3ea87bdcd92be1b32a569209e58887a4b8cf0a1129184e09781056af0e21c7)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = SagemakerUserProfileConfig(
            domain_id=domain_id,
            user_profile_name=user_profile_name,
            id=id,
            single_sign_on_user_identifier=single_sign_on_user_identifier,
            single_sign_on_user_value=single_sign_on_user_value,
            tags=tags,
            tags_all=tags_all,
            user_settings=user_settings,
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
        '''Generates CDKTF code for importing a SagemakerUserProfile resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the SagemakerUserProfile to import.
        :param import_from_id: The id of the existing SagemakerUserProfile that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the SagemakerUserProfile to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ad6125bb134bc462868df10f904eecda8fa4c63bb7423947b7f1bd3c331f7e5a)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putUserSettings")
    def put_user_settings(
        self,
        *,
        execution_role: builtins.str,
        auto_mount_home_efs: typing.Optional[builtins.str] = None,
        canvas_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCanvasAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        code_editor_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCodeEditorAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        custom_file_system_config: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerUserProfileUserSettingsCustomFileSystemConfig", typing.Dict[builtins.str, typing.Any]]]]] = None,
        custom_posix_user_config: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCustomPosixUserConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        default_landing_uri: typing.Optional[builtins.str] = None,
        jupyter_lab_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsJupyterLabAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        jupyter_server_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsJupyterServerAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        kernel_gateway_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsKernelGatewayAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        r_session_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsRSessionAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        r_studio_server_pro_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsRStudioServerProAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
        sharing_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsSharingSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        space_storage_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsSpaceStorageSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        studio_web_portal: typing.Optional[builtins.str] = None,
        studio_web_portal_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsStudioWebPortalSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        tensor_board_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsTensorBoardAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param execution_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#execution_role SagemakerUserProfile#execution_role}.
        :param auto_mount_home_efs: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#auto_mount_home_efs SagemakerUserProfile#auto_mount_home_efs}.
        :param canvas_app_settings: canvas_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#canvas_app_settings SagemakerUserProfile#canvas_app_settings}
        :param code_editor_app_settings: code_editor_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#code_editor_app_settings SagemakerUserProfile#code_editor_app_settings}
        :param custom_file_system_config: custom_file_system_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_file_system_config SagemakerUserProfile#custom_file_system_config}
        :param custom_posix_user_config: custom_posix_user_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_posix_user_config SagemakerUserProfile#custom_posix_user_config}
        :param default_landing_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_landing_uri SagemakerUserProfile#default_landing_uri}.
        :param jupyter_lab_app_settings: jupyter_lab_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#jupyter_lab_app_settings SagemakerUserProfile#jupyter_lab_app_settings}
        :param jupyter_server_app_settings: jupyter_server_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#jupyter_server_app_settings SagemakerUserProfile#jupyter_server_app_settings}
        :param kernel_gateway_app_settings: kernel_gateway_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#kernel_gateway_app_settings SagemakerUserProfile#kernel_gateway_app_settings}
        :param r_session_app_settings: r_session_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#r_session_app_settings SagemakerUserProfile#r_session_app_settings}
        :param r_studio_server_pro_app_settings: r_studio_server_pro_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#r_studio_server_pro_app_settings SagemakerUserProfile#r_studio_server_pro_app_settings}
        :param security_groups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#security_groups SagemakerUserProfile#security_groups}.
        :param sharing_settings: sharing_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sharing_settings SagemakerUserProfile#sharing_settings}
        :param space_storage_settings: space_storage_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#space_storage_settings SagemakerUserProfile#space_storage_settings}
        :param studio_web_portal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#studio_web_portal SagemakerUserProfile#studio_web_portal}.
        :param studio_web_portal_settings: studio_web_portal_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#studio_web_portal_settings SagemakerUserProfile#studio_web_portal_settings}
        :param tensor_board_app_settings: tensor_board_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#tensor_board_app_settings SagemakerUserProfile#tensor_board_app_settings}
        '''
        value = SagemakerUserProfileUserSettings(
            execution_role=execution_role,
            auto_mount_home_efs=auto_mount_home_efs,
            canvas_app_settings=canvas_app_settings,
            code_editor_app_settings=code_editor_app_settings,
            custom_file_system_config=custom_file_system_config,
            custom_posix_user_config=custom_posix_user_config,
            default_landing_uri=default_landing_uri,
            jupyter_lab_app_settings=jupyter_lab_app_settings,
            jupyter_server_app_settings=jupyter_server_app_settings,
            kernel_gateway_app_settings=kernel_gateway_app_settings,
            r_session_app_settings=r_session_app_settings,
            r_studio_server_pro_app_settings=r_studio_server_pro_app_settings,
            security_groups=security_groups,
            sharing_settings=sharing_settings,
            space_storage_settings=space_storage_settings,
            studio_web_portal=studio_web_portal,
            studio_web_portal_settings=studio_web_portal_settings,
            tensor_board_app_settings=tensor_board_app_settings,
        )

        return typing.cast(None, jsii.invoke(self, "putUserSettings", [value]))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetSingleSignOnUserIdentifier")
    def reset_single_sign_on_user_identifier(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSingleSignOnUserIdentifier", []))

    @jsii.member(jsii_name="resetSingleSignOnUserValue")
    def reset_single_sign_on_user_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSingleSignOnUserValue", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetUserSettings")
    def reset_user_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUserSettings", []))

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
    @jsii.member(jsii_name="userSettings")
    def user_settings(self) -> "SagemakerUserProfileUserSettingsOutputReference":
        return typing.cast("SagemakerUserProfileUserSettingsOutputReference", jsii.get(self, "userSettings"))

    @builtins.property
    @jsii.member(jsii_name="domainIdInput")
    def domain_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "domainIdInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="singleSignOnUserIdentifierInput")
    def single_sign_on_user_identifier_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "singleSignOnUserIdentifierInput"))

    @builtins.property
    @jsii.member(jsii_name="singleSignOnUserValueInput")
    def single_sign_on_user_value_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "singleSignOnUserValueInput"))

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
    @jsii.member(jsii_name="userProfileNameInput")
    def user_profile_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "userProfileNameInput"))

    @builtins.property
    @jsii.member(jsii_name="userSettingsInput")
    def user_settings_input(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettings"]:
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettings"], jsii.get(self, "userSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="domainId")
    def domain_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "domainId"))

    @domain_id.setter
    def domain_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f191d7eca73a9f60a900618beb667ee009bebe2670ccecfe43d60e6d438cfd88)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "domainId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__808b16b8d7c4ea3f2731d5af691fce921dd7435185f039b66b4b260c24a1dabe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="singleSignOnUserIdentifier")
    def single_sign_on_user_identifier(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "singleSignOnUserIdentifier"))

    @single_sign_on_user_identifier.setter
    def single_sign_on_user_identifier(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd3cb9bd75b15bf6e99b0beb2380934cb7b45f235ad47337fc9e5b263441ce87)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "singleSignOnUserIdentifier", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="singleSignOnUserValue")
    def single_sign_on_user_value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "singleSignOnUserValue"))

    @single_sign_on_user_value.setter
    def single_sign_on_user_value(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__35363910df4c7179a01ce3816eed74e3adfc522587c04b7e7968b5a243bd8c71)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "singleSignOnUserValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24516786d954c54762fef986c2eede5291c4f6a14a7776c9dfb4afedc49dec8a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7ff0dd72283a8b4a3a327bd40b9ff2042f99605d1c166fb80bc960211d0b3ecb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userProfileName")
    def user_profile_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "userProfileName"))

    @user_profile_name.setter
    def user_profile_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2fc6398015cf63d1543035ffbb9dd11c4d0e50146d3796b1de861f58c034e4cf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userProfileName", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileConfig",
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
        "user_profile_name": "userProfileName",
        "id": "id",
        "single_sign_on_user_identifier": "singleSignOnUserIdentifier",
        "single_sign_on_user_value": "singleSignOnUserValue",
        "tags": "tags",
        "tags_all": "tagsAll",
        "user_settings": "userSettings",
    },
)
class SagemakerUserProfileConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        user_profile_name: builtins.str,
        id: typing.Optional[builtins.str] = None,
        single_sign_on_user_identifier: typing.Optional[builtins.str] = None,
        single_sign_on_user_value: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        user_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettings", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param domain_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#domain_id SagemakerUserProfile#domain_id}.
        :param user_profile_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#user_profile_name SagemakerUserProfile#user_profile_name}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#id SagemakerUserProfile#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param single_sign_on_user_identifier: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#single_sign_on_user_identifier SagemakerUserProfile#single_sign_on_user_identifier}.
        :param single_sign_on_user_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#single_sign_on_user_value SagemakerUserProfile#single_sign_on_user_value}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#tags SagemakerUserProfile#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#tags_all SagemakerUserProfile#tags_all}.
        :param user_settings: user_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#user_settings SagemakerUserProfile#user_settings}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(user_settings, dict):
            user_settings = SagemakerUserProfileUserSettings(**user_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__73cd0fc9769617e44b2bd2cdd0bc0b572bb10551fe90a1cc4970a84d40792226)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument domain_id", value=domain_id, expected_type=type_hints["domain_id"])
            check_type(argname="argument user_profile_name", value=user_profile_name, expected_type=type_hints["user_profile_name"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument single_sign_on_user_identifier", value=single_sign_on_user_identifier, expected_type=type_hints["single_sign_on_user_identifier"])
            check_type(argname="argument single_sign_on_user_value", value=single_sign_on_user_value, expected_type=type_hints["single_sign_on_user_value"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument user_settings", value=user_settings, expected_type=type_hints["user_settings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "domain_id": domain_id,
            "user_profile_name": user_profile_name,
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
        if single_sign_on_user_identifier is not None:
            self._values["single_sign_on_user_identifier"] = single_sign_on_user_identifier
        if single_sign_on_user_value is not None:
            self._values["single_sign_on_user_value"] = single_sign_on_user_value
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if user_settings is not None:
            self._values["user_settings"] = user_settings

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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#domain_id SagemakerUserProfile#domain_id}.'''
        result = self._values.get("domain_id")
        assert result is not None, "Required property 'domain_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def user_profile_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#user_profile_name SagemakerUserProfile#user_profile_name}.'''
        result = self._values.get("user_profile_name")
        assert result is not None, "Required property 'user_profile_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#id SagemakerUserProfile#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def single_sign_on_user_identifier(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#single_sign_on_user_identifier SagemakerUserProfile#single_sign_on_user_identifier}.'''
        result = self._values.get("single_sign_on_user_identifier")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def single_sign_on_user_value(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#single_sign_on_user_value SagemakerUserProfile#single_sign_on_user_value}.'''
        result = self._values.get("single_sign_on_user_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#tags SagemakerUserProfile#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#tags_all SagemakerUserProfile#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def user_settings(self) -> typing.Optional["SagemakerUserProfileUserSettings"]:
        '''user_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#user_settings SagemakerUserProfile#user_settings}
        '''
        result = self._values.get("user_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettings"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettings",
    jsii_struct_bases=[],
    name_mapping={
        "execution_role": "executionRole",
        "auto_mount_home_efs": "autoMountHomeEfs",
        "canvas_app_settings": "canvasAppSettings",
        "code_editor_app_settings": "codeEditorAppSettings",
        "custom_file_system_config": "customFileSystemConfig",
        "custom_posix_user_config": "customPosixUserConfig",
        "default_landing_uri": "defaultLandingUri",
        "jupyter_lab_app_settings": "jupyterLabAppSettings",
        "jupyter_server_app_settings": "jupyterServerAppSettings",
        "kernel_gateway_app_settings": "kernelGatewayAppSettings",
        "r_session_app_settings": "rSessionAppSettings",
        "r_studio_server_pro_app_settings": "rStudioServerProAppSettings",
        "security_groups": "securityGroups",
        "sharing_settings": "sharingSettings",
        "space_storage_settings": "spaceStorageSettings",
        "studio_web_portal": "studioWebPortal",
        "studio_web_portal_settings": "studioWebPortalSettings",
        "tensor_board_app_settings": "tensorBoardAppSettings",
    },
)
class SagemakerUserProfileUserSettings:
    def __init__(
        self,
        *,
        execution_role: builtins.str,
        auto_mount_home_efs: typing.Optional[builtins.str] = None,
        canvas_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCanvasAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        code_editor_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCodeEditorAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        custom_file_system_config: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerUserProfileUserSettingsCustomFileSystemConfig", typing.Dict[builtins.str, typing.Any]]]]] = None,
        custom_posix_user_config: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCustomPosixUserConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        default_landing_uri: typing.Optional[builtins.str] = None,
        jupyter_lab_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsJupyterLabAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        jupyter_server_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsJupyterServerAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        kernel_gateway_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsKernelGatewayAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        r_session_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsRSessionAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        r_studio_server_pro_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsRStudioServerProAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
        sharing_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsSharingSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        space_storage_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsSpaceStorageSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        studio_web_portal: typing.Optional[builtins.str] = None,
        studio_web_portal_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsStudioWebPortalSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        tensor_board_app_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsTensorBoardAppSettings", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param execution_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#execution_role SagemakerUserProfile#execution_role}.
        :param auto_mount_home_efs: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#auto_mount_home_efs SagemakerUserProfile#auto_mount_home_efs}.
        :param canvas_app_settings: canvas_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#canvas_app_settings SagemakerUserProfile#canvas_app_settings}
        :param code_editor_app_settings: code_editor_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#code_editor_app_settings SagemakerUserProfile#code_editor_app_settings}
        :param custom_file_system_config: custom_file_system_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_file_system_config SagemakerUserProfile#custom_file_system_config}
        :param custom_posix_user_config: custom_posix_user_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_posix_user_config SagemakerUserProfile#custom_posix_user_config}
        :param default_landing_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_landing_uri SagemakerUserProfile#default_landing_uri}.
        :param jupyter_lab_app_settings: jupyter_lab_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#jupyter_lab_app_settings SagemakerUserProfile#jupyter_lab_app_settings}
        :param jupyter_server_app_settings: jupyter_server_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#jupyter_server_app_settings SagemakerUserProfile#jupyter_server_app_settings}
        :param kernel_gateway_app_settings: kernel_gateway_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#kernel_gateway_app_settings SagemakerUserProfile#kernel_gateway_app_settings}
        :param r_session_app_settings: r_session_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#r_session_app_settings SagemakerUserProfile#r_session_app_settings}
        :param r_studio_server_pro_app_settings: r_studio_server_pro_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#r_studio_server_pro_app_settings SagemakerUserProfile#r_studio_server_pro_app_settings}
        :param security_groups: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#security_groups SagemakerUserProfile#security_groups}.
        :param sharing_settings: sharing_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sharing_settings SagemakerUserProfile#sharing_settings}
        :param space_storage_settings: space_storage_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#space_storage_settings SagemakerUserProfile#space_storage_settings}
        :param studio_web_portal: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#studio_web_portal SagemakerUserProfile#studio_web_portal}.
        :param studio_web_portal_settings: studio_web_portal_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#studio_web_portal_settings SagemakerUserProfile#studio_web_portal_settings}
        :param tensor_board_app_settings: tensor_board_app_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#tensor_board_app_settings SagemakerUserProfile#tensor_board_app_settings}
        '''
        if isinstance(canvas_app_settings, dict):
            canvas_app_settings = SagemakerUserProfileUserSettingsCanvasAppSettings(**canvas_app_settings)
        if isinstance(code_editor_app_settings, dict):
            code_editor_app_settings = SagemakerUserProfileUserSettingsCodeEditorAppSettings(**code_editor_app_settings)
        if isinstance(custom_posix_user_config, dict):
            custom_posix_user_config = SagemakerUserProfileUserSettingsCustomPosixUserConfig(**custom_posix_user_config)
        if isinstance(jupyter_lab_app_settings, dict):
            jupyter_lab_app_settings = SagemakerUserProfileUserSettingsJupyterLabAppSettings(**jupyter_lab_app_settings)
        if isinstance(jupyter_server_app_settings, dict):
            jupyter_server_app_settings = SagemakerUserProfileUserSettingsJupyterServerAppSettings(**jupyter_server_app_settings)
        if isinstance(kernel_gateway_app_settings, dict):
            kernel_gateway_app_settings = SagemakerUserProfileUserSettingsKernelGatewayAppSettings(**kernel_gateway_app_settings)
        if isinstance(r_session_app_settings, dict):
            r_session_app_settings = SagemakerUserProfileUserSettingsRSessionAppSettings(**r_session_app_settings)
        if isinstance(r_studio_server_pro_app_settings, dict):
            r_studio_server_pro_app_settings = SagemakerUserProfileUserSettingsRStudioServerProAppSettings(**r_studio_server_pro_app_settings)
        if isinstance(sharing_settings, dict):
            sharing_settings = SagemakerUserProfileUserSettingsSharingSettings(**sharing_settings)
        if isinstance(space_storage_settings, dict):
            space_storage_settings = SagemakerUserProfileUserSettingsSpaceStorageSettings(**space_storage_settings)
        if isinstance(studio_web_portal_settings, dict):
            studio_web_portal_settings = SagemakerUserProfileUserSettingsStudioWebPortalSettings(**studio_web_portal_settings)
        if isinstance(tensor_board_app_settings, dict):
            tensor_board_app_settings = SagemakerUserProfileUserSettingsTensorBoardAppSettings(**tensor_board_app_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__306f063596160d1b52135ff7326478b4dcbf6bbe28cf5f64751f4aa83fe1d572)
            check_type(argname="argument execution_role", value=execution_role, expected_type=type_hints["execution_role"])
            check_type(argname="argument auto_mount_home_efs", value=auto_mount_home_efs, expected_type=type_hints["auto_mount_home_efs"])
            check_type(argname="argument canvas_app_settings", value=canvas_app_settings, expected_type=type_hints["canvas_app_settings"])
            check_type(argname="argument code_editor_app_settings", value=code_editor_app_settings, expected_type=type_hints["code_editor_app_settings"])
            check_type(argname="argument custom_file_system_config", value=custom_file_system_config, expected_type=type_hints["custom_file_system_config"])
            check_type(argname="argument custom_posix_user_config", value=custom_posix_user_config, expected_type=type_hints["custom_posix_user_config"])
            check_type(argname="argument default_landing_uri", value=default_landing_uri, expected_type=type_hints["default_landing_uri"])
            check_type(argname="argument jupyter_lab_app_settings", value=jupyter_lab_app_settings, expected_type=type_hints["jupyter_lab_app_settings"])
            check_type(argname="argument jupyter_server_app_settings", value=jupyter_server_app_settings, expected_type=type_hints["jupyter_server_app_settings"])
            check_type(argname="argument kernel_gateway_app_settings", value=kernel_gateway_app_settings, expected_type=type_hints["kernel_gateway_app_settings"])
            check_type(argname="argument r_session_app_settings", value=r_session_app_settings, expected_type=type_hints["r_session_app_settings"])
            check_type(argname="argument r_studio_server_pro_app_settings", value=r_studio_server_pro_app_settings, expected_type=type_hints["r_studio_server_pro_app_settings"])
            check_type(argname="argument security_groups", value=security_groups, expected_type=type_hints["security_groups"])
            check_type(argname="argument sharing_settings", value=sharing_settings, expected_type=type_hints["sharing_settings"])
            check_type(argname="argument space_storage_settings", value=space_storage_settings, expected_type=type_hints["space_storage_settings"])
            check_type(argname="argument studio_web_portal", value=studio_web_portal, expected_type=type_hints["studio_web_portal"])
            check_type(argname="argument studio_web_portal_settings", value=studio_web_portal_settings, expected_type=type_hints["studio_web_portal_settings"])
            check_type(argname="argument tensor_board_app_settings", value=tensor_board_app_settings, expected_type=type_hints["tensor_board_app_settings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "execution_role": execution_role,
        }
        if auto_mount_home_efs is not None:
            self._values["auto_mount_home_efs"] = auto_mount_home_efs
        if canvas_app_settings is not None:
            self._values["canvas_app_settings"] = canvas_app_settings
        if code_editor_app_settings is not None:
            self._values["code_editor_app_settings"] = code_editor_app_settings
        if custom_file_system_config is not None:
            self._values["custom_file_system_config"] = custom_file_system_config
        if custom_posix_user_config is not None:
            self._values["custom_posix_user_config"] = custom_posix_user_config
        if default_landing_uri is not None:
            self._values["default_landing_uri"] = default_landing_uri
        if jupyter_lab_app_settings is not None:
            self._values["jupyter_lab_app_settings"] = jupyter_lab_app_settings
        if jupyter_server_app_settings is not None:
            self._values["jupyter_server_app_settings"] = jupyter_server_app_settings
        if kernel_gateway_app_settings is not None:
            self._values["kernel_gateway_app_settings"] = kernel_gateway_app_settings
        if r_session_app_settings is not None:
            self._values["r_session_app_settings"] = r_session_app_settings
        if r_studio_server_pro_app_settings is not None:
            self._values["r_studio_server_pro_app_settings"] = r_studio_server_pro_app_settings
        if security_groups is not None:
            self._values["security_groups"] = security_groups
        if sharing_settings is not None:
            self._values["sharing_settings"] = sharing_settings
        if space_storage_settings is not None:
            self._values["space_storage_settings"] = space_storage_settings
        if studio_web_portal is not None:
            self._values["studio_web_portal"] = studio_web_portal
        if studio_web_portal_settings is not None:
            self._values["studio_web_portal_settings"] = studio_web_portal_settings
        if tensor_board_app_settings is not None:
            self._values["tensor_board_app_settings"] = tensor_board_app_settings

    @builtins.property
    def execution_role(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#execution_role SagemakerUserProfile#execution_role}.'''
        result = self._values.get("execution_role")
        assert result is not None, "Required property 'execution_role' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def auto_mount_home_efs(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#auto_mount_home_efs SagemakerUserProfile#auto_mount_home_efs}.'''
        result = self._values.get("auto_mount_home_efs")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def canvas_app_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettings"]:
        '''canvas_app_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#canvas_app_settings SagemakerUserProfile#canvas_app_settings}
        '''
        result = self._values.get("canvas_app_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettings"], result)

    @builtins.property
    def code_editor_app_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCodeEditorAppSettings"]:
        '''code_editor_app_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#code_editor_app_settings SagemakerUserProfile#code_editor_app_settings}
        '''
        result = self._values.get("code_editor_app_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCodeEditorAppSettings"], result)

    @builtins.property
    def custom_file_system_config(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsCustomFileSystemConfig"]]]:
        '''custom_file_system_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_file_system_config SagemakerUserProfile#custom_file_system_config}
        '''
        result = self._values.get("custom_file_system_config")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsCustomFileSystemConfig"]]], result)

    @builtins.property
    def custom_posix_user_config(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCustomPosixUserConfig"]:
        '''custom_posix_user_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_posix_user_config SagemakerUserProfile#custom_posix_user_config}
        '''
        result = self._values.get("custom_posix_user_config")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCustomPosixUserConfig"], result)

    @builtins.property
    def default_landing_uri(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_landing_uri SagemakerUserProfile#default_landing_uri}.'''
        result = self._values.get("default_landing_uri")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def jupyter_lab_app_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsJupyterLabAppSettings"]:
        '''jupyter_lab_app_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#jupyter_lab_app_settings SagemakerUserProfile#jupyter_lab_app_settings}
        '''
        result = self._values.get("jupyter_lab_app_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsJupyterLabAppSettings"], result)

    @builtins.property
    def jupyter_server_app_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsJupyterServerAppSettings"]:
        '''jupyter_server_app_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#jupyter_server_app_settings SagemakerUserProfile#jupyter_server_app_settings}
        '''
        result = self._values.get("jupyter_server_app_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsJupyterServerAppSettings"], result)

    @builtins.property
    def kernel_gateway_app_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsKernelGatewayAppSettings"]:
        '''kernel_gateway_app_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#kernel_gateway_app_settings SagemakerUserProfile#kernel_gateway_app_settings}
        '''
        result = self._values.get("kernel_gateway_app_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsKernelGatewayAppSettings"], result)

    @builtins.property
    def r_session_app_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsRSessionAppSettings"]:
        '''r_session_app_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#r_session_app_settings SagemakerUserProfile#r_session_app_settings}
        '''
        result = self._values.get("r_session_app_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsRSessionAppSettings"], result)

    @builtins.property
    def r_studio_server_pro_app_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsRStudioServerProAppSettings"]:
        '''r_studio_server_pro_app_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#r_studio_server_pro_app_settings SagemakerUserProfile#r_studio_server_pro_app_settings}
        '''
        result = self._values.get("r_studio_server_pro_app_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsRStudioServerProAppSettings"], result)

    @builtins.property
    def security_groups(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#security_groups SagemakerUserProfile#security_groups}.'''
        result = self._values.get("security_groups")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def sharing_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsSharingSettings"]:
        '''sharing_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sharing_settings SagemakerUserProfile#sharing_settings}
        '''
        result = self._values.get("sharing_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsSharingSettings"], result)

    @builtins.property
    def space_storage_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsSpaceStorageSettings"]:
        '''space_storage_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#space_storage_settings SagemakerUserProfile#space_storage_settings}
        '''
        result = self._values.get("space_storage_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsSpaceStorageSettings"], result)

    @builtins.property
    def studio_web_portal(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#studio_web_portal SagemakerUserProfile#studio_web_portal}.'''
        result = self._values.get("studio_web_portal")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def studio_web_portal_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsStudioWebPortalSettings"]:
        '''studio_web_portal_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#studio_web_portal_settings SagemakerUserProfile#studio_web_portal_settings}
        '''
        result = self._values.get("studio_web_portal_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsStudioWebPortalSettings"], result)

    @builtins.property
    def tensor_board_app_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsTensorBoardAppSettings"]:
        '''tensor_board_app_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#tensor_board_app_settings SagemakerUserProfile#tensor_board_app_settings}
        '''
        result = self._values.get("tensor_board_app_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsTensorBoardAppSettings"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettings",
    jsii_struct_bases=[],
    name_mapping={
        "direct_deploy_settings": "directDeploySettings",
        "emr_serverless_settings": "emrServerlessSettings",
        "generative_ai_settings": "generativeAiSettings",
        "identity_provider_oauth_settings": "identityProviderOauthSettings",
        "kendra_settings": "kendraSettings",
        "model_register_settings": "modelRegisterSettings",
        "time_series_forecasting_settings": "timeSeriesForecastingSettings",
        "workspace_settings": "workspaceSettings",
    },
)
class SagemakerUserProfileUserSettingsCanvasAppSettings:
    def __init__(
        self,
        *,
        direct_deploy_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings", typing.Dict[builtins.str, typing.Any]]] = None,
        emr_serverless_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        generative_ai_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        identity_provider_oauth_settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings", typing.Dict[builtins.str, typing.Any]]]]] = None,
        kendra_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        model_register_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        time_series_forecasting_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        workspace_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param direct_deploy_settings: direct_deploy_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#direct_deploy_settings SagemakerUserProfile#direct_deploy_settings}
        :param emr_serverless_settings: emr_serverless_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#emr_serverless_settings SagemakerUserProfile#emr_serverless_settings}
        :param generative_ai_settings: generative_ai_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#generative_ai_settings SagemakerUserProfile#generative_ai_settings}
        :param identity_provider_oauth_settings: identity_provider_oauth_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#identity_provider_oauth_settings SagemakerUserProfile#identity_provider_oauth_settings}
        :param kendra_settings: kendra_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#kendra_settings SagemakerUserProfile#kendra_settings}
        :param model_register_settings: model_register_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#model_register_settings SagemakerUserProfile#model_register_settings}
        :param time_series_forecasting_settings: time_series_forecasting_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#time_series_forecasting_settings SagemakerUserProfile#time_series_forecasting_settings}
        :param workspace_settings: workspace_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#workspace_settings SagemakerUserProfile#workspace_settings}
        '''
        if isinstance(direct_deploy_settings, dict):
            direct_deploy_settings = SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings(**direct_deploy_settings)
        if isinstance(emr_serverless_settings, dict):
            emr_serverless_settings = SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings(**emr_serverless_settings)
        if isinstance(generative_ai_settings, dict):
            generative_ai_settings = SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings(**generative_ai_settings)
        if isinstance(kendra_settings, dict):
            kendra_settings = SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings(**kendra_settings)
        if isinstance(model_register_settings, dict):
            model_register_settings = SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings(**model_register_settings)
        if isinstance(time_series_forecasting_settings, dict):
            time_series_forecasting_settings = SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings(**time_series_forecasting_settings)
        if isinstance(workspace_settings, dict):
            workspace_settings = SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings(**workspace_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__16d09b2bc3f03a9bad901b1527d6ad9c7de8c5f2c8308c536adb5d4fa855deea)
            check_type(argname="argument direct_deploy_settings", value=direct_deploy_settings, expected_type=type_hints["direct_deploy_settings"])
            check_type(argname="argument emr_serverless_settings", value=emr_serverless_settings, expected_type=type_hints["emr_serverless_settings"])
            check_type(argname="argument generative_ai_settings", value=generative_ai_settings, expected_type=type_hints["generative_ai_settings"])
            check_type(argname="argument identity_provider_oauth_settings", value=identity_provider_oauth_settings, expected_type=type_hints["identity_provider_oauth_settings"])
            check_type(argname="argument kendra_settings", value=kendra_settings, expected_type=type_hints["kendra_settings"])
            check_type(argname="argument model_register_settings", value=model_register_settings, expected_type=type_hints["model_register_settings"])
            check_type(argname="argument time_series_forecasting_settings", value=time_series_forecasting_settings, expected_type=type_hints["time_series_forecasting_settings"])
            check_type(argname="argument workspace_settings", value=workspace_settings, expected_type=type_hints["workspace_settings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if direct_deploy_settings is not None:
            self._values["direct_deploy_settings"] = direct_deploy_settings
        if emr_serverless_settings is not None:
            self._values["emr_serverless_settings"] = emr_serverless_settings
        if generative_ai_settings is not None:
            self._values["generative_ai_settings"] = generative_ai_settings
        if identity_provider_oauth_settings is not None:
            self._values["identity_provider_oauth_settings"] = identity_provider_oauth_settings
        if kendra_settings is not None:
            self._values["kendra_settings"] = kendra_settings
        if model_register_settings is not None:
            self._values["model_register_settings"] = model_register_settings
        if time_series_forecasting_settings is not None:
            self._values["time_series_forecasting_settings"] = time_series_forecasting_settings
        if workspace_settings is not None:
            self._values["workspace_settings"] = workspace_settings

    @builtins.property
    def direct_deploy_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings"]:
        '''direct_deploy_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#direct_deploy_settings SagemakerUserProfile#direct_deploy_settings}
        '''
        result = self._values.get("direct_deploy_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings"], result)

    @builtins.property
    def emr_serverless_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings"]:
        '''emr_serverless_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#emr_serverless_settings SagemakerUserProfile#emr_serverless_settings}
        '''
        result = self._values.get("emr_serverless_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings"], result)

    @builtins.property
    def generative_ai_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings"]:
        '''generative_ai_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#generative_ai_settings SagemakerUserProfile#generative_ai_settings}
        '''
        result = self._values.get("generative_ai_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings"], result)

    @builtins.property
    def identity_provider_oauth_settings(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings"]]]:
        '''identity_provider_oauth_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#identity_provider_oauth_settings SagemakerUserProfile#identity_provider_oauth_settings}
        '''
        result = self._values.get("identity_provider_oauth_settings")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings"]]], result)

    @builtins.property
    def kendra_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings"]:
        '''kendra_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#kendra_settings SagemakerUserProfile#kendra_settings}
        '''
        result = self._values.get("kendra_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings"], result)

    @builtins.property
    def model_register_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings"]:
        '''model_register_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#model_register_settings SagemakerUserProfile#model_register_settings}
        '''
        result = self._values.get("model_register_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings"], result)

    @builtins.property
    def time_series_forecasting_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings"]:
        '''time_series_forecasting_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#time_series_forecasting_settings SagemakerUserProfile#time_series_forecasting_settings}
        '''
        result = self._values.get("time_series_forecasting_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings"], result)

    @builtins.property
    def workspace_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings"]:
        '''workspace_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#workspace_settings SagemakerUserProfile#workspace_settings}
        '''
        result = self._values.get("workspace_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCanvasAppSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings",
    jsii_struct_bases=[],
    name_mapping={"status": "status"},
)
class SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings:
    def __init__(self, *, status: typing.Optional[builtins.str] = None) -> None:
        '''
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e0ad3246fdb22bcb7233aa9d92e918963f1ec149840591d9cf98563aa97f565)
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ca822f8a5f36d545e63dcf1e6be43b89776f62bb144b6adee5d4ebf529655076)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

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
            type_hints = typing.get_type_hints(_typecheckingstub__2d779037358f09262e3f0476108e257dba770155afbf2145d11f146d2d319fa2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ace52c833344ce182bd7d1baec28cd1979345bd2d4253e7b39c21fd619c989e2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings",
    jsii_struct_bases=[],
    name_mapping={"execution_role_arn": "executionRoleArn", "status": "status"},
)
class SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings:
    def __init__(
        self,
        *,
        execution_role_arn: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param execution_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#execution_role_arn SagemakerUserProfile#execution_role_arn}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d25f41be3546ecb57dde572916247aa3c879301ed6e6aa71ae6b6e92c665d52)
            check_type(argname="argument execution_role_arn", value=execution_role_arn, expected_type=type_hints["execution_role_arn"])
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if execution_role_arn is not None:
            self._values["execution_role_arn"] = execution_role_arn
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def execution_role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#execution_role_arn SagemakerUserProfile#execution_role_arn}.'''
        result = self._values.get("execution_role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__afba317834a1caaefc8a7cf07b4de39e20b02d4f6b6e62f2640adc4387acc84e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetExecutionRoleArn")
    def reset_execution_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExecutionRoleArn", []))

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @builtins.property
    @jsii.member(jsii_name="executionRoleArnInput")
    def execution_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "executionRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

    @builtins.property
    @jsii.member(jsii_name="executionRoleArn")
    def execution_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "executionRoleArn"))

    @execution_role_arn.setter
    def execution_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8973f63650b89e5158586a3bbc5d24e3200b830a6ea3837d379eb3ae77cf56e3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "executionRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__50b43b1ca5dc293a35def9cd4e3998e438114e0a99b5654103c9f44eac73a0ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a5d083eb0469396d00f4a9ef02cde7204602f01e17ac84d47917005898e3d0c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings",
    jsii_struct_bases=[],
    name_mapping={"amazon_bedrock_role_arn": "amazonBedrockRoleArn"},
)
class SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings:
    def __init__(
        self,
        *,
        amazon_bedrock_role_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param amazon_bedrock_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#amazon_bedrock_role_arn SagemakerUserProfile#amazon_bedrock_role_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7cd85eab22ab44b85aedb55a8a93634717597b9cf3de2c8e5de0584d2f013141)
            check_type(argname="argument amazon_bedrock_role_arn", value=amazon_bedrock_role_arn, expected_type=type_hints["amazon_bedrock_role_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if amazon_bedrock_role_arn is not None:
            self._values["amazon_bedrock_role_arn"] = amazon_bedrock_role_arn

    @builtins.property
    def amazon_bedrock_role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#amazon_bedrock_role_arn SagemakerUserProfile#amazon_bedrock_role_arn}.'''
        result = self._values.get("amazon_bedrock_role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b947d36afced12618fc5038e1235282b0fad6762b7ebac12695826c12682d8fe)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAmazonBedrockRoleArn")
    def reset_amazon_bedrock_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAmazonBedrockRoleArn", []))

    @builtins.property
    @jsii.member(jsii_name="amazonBedrockRoleArnInput")
    def amazon_bedrock_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "amazonBedrockRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="amazonBedrockRoleArn")
    def amazon_bedrock_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "amazonBedrockRoleArn"))

    @amazon_bedrock_role_arn.setter
    def amazon_bedrock_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ee27a247500b3a944156438c0ce7c0c18e8ea691f9bfe4dc5ef3f59f4ad4121)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "amazonBedrockRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b032589492973fe49d5c7da92679b5633d67f79d9e6fce35698cdd9f93efe011)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings",
    jsii_struct_bases=[],
    name_mapping={
        "secret_arn": "secretArn",
        "data_source_name": "dataSourceName",
        "status": "status",
    },
)
class SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings:
    def __init__(
        self,
        *,
        secret_arn: builtins.str,
        data_source_name: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param secret_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#secret_arn SagemakerUserProfile#secret_arn}.
        :param data_source_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#data_source_name SagemakerUserProfile#data_source_name}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__54d058dfdf02b83ab8e060b053d4221d79cf04823d9e4c943d38781f6e413c44)
            check_type(argname="argument secret_arn", value=secret_arn, expected_type=type_hints["secret_arn"])
            check_type(argname="argument data_source_name", value=data_source_name, expected_type=type_hints["data_source_name"])
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "secret_arn": secret_arn,
        }
        if data_source_name is not None:
            self._values["data_source_name"] = data_source_name
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def secret_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#secret_arn SagemakerUserProfile#secret_arn}.'''
        result = self._values.get("secret_arn")
        assert result is not None, "Required property 'secret_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def data_source_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#data_source_name SagemakerUserProfile#data_source_name}.'''
        result = self._values.get("data_source_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f27fdd5618cd381f2ee6c6a7071f1df701269a68b6225c3326e4175a32efc90d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02fcef93e54ebc08f0864a9c4997b3c39554f180fc13b85cd6406841dd71d9bb)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d669ab2efec1e4384394fa37eed1e5170b9327386252888cdecc25493840dc72)
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
            type_hints = typing.get_type_hints(_typecheckingstub__252422a8dc2d627da724fc3db377315308ed8047715889350fb541c8b089b019)
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
            type_hints = typing.get_type_hints(_typecheckingstub__535ff0b41506e5054ac38419965d4f58d45db3bae1a8dd2fa5e5242f070478f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78860f87530145a7f52ed09144351e7e4f7ae842ed483c212a01f3bf58271bd6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1920965ca0486a3332e5f4f0e3fbe9f3eb9cd6f5070d283d791d19ca78a8256e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetDataSourceName")
    def reset_data_source_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDataSourceName", []))

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @builtins.property
    @jsii.member(jsii_name="dataSourceNameInput")
    def data_source_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "dataSourceNameInput"))

    @builtins.property
    @jsii.member(jsii_name="secretArnInput")
    def secret_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "secretArnInput"))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

    @builtins.property
    @jsii.member(jsii_name="dataSourceName")
    def data_source_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "dataSourceName"))

    @data_source_name.setter
    def data_source_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4251cd9319e06e2ce7e48156d6763b98100faa169d5724c6aa74328a5e11dc96)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "dataSourceName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="secretArn")
    def secret_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "secretArn"))

    @secret_arn.setter
    def secret_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c855cd455cd1d8564e78b45233b2441f78bf07be342c07fd0b4f6d453f4fb2b9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "secretArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ead6300903e508ae4972ffa6b51dfc14d3e425b6a388580cdf62ad723e5f20b8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__caaccc23dcd8a9475f4e62ecfa155a514e1d0375f49486fd57169bc3d8c6f4f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings",
    jsii_struct_bases=[],
    name_mapping={"status": "status"},
)
class SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings:
    def __init__(self, *, status: typing.Optional[builtins.str] = None) -> None:
        '''
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0dfe48433cf817613db002a8f9c34a53d433e2ad2f3a8a078b07c4b9ea79c6b4)
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__890e0110a13e9119afaf648817fd3cb3db3f8108f2a6ce694267f275e7dae53a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

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
            type_hints = typing.get_type_hints(_typecheckingstub__07d8d288e8f79720411993a11af1e4ea15a2935708f6d8e5c5637a8f9ee5bb13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c7bd8ceb2db018c8b57b5f4cbadcdc9e385b253f84a3392aa5de21c05eed8c7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings",
    jsii_struct_bases=[],
    name_mapping={
        "cross_account_model_register_role_arn": "crossAccountModelRegisterRoleArn",
        "status": "status",
    },
)
class SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings:
    def __init__(
        self,
        *,
        cross_account_model_register_role_arn: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param cross_account_model_register_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#cross_account_model_register_role_arn SagemakerUserProfile#cross_account_model_register_role_arn}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a0e3948e5841e1b16a225771ad8bdaa5b74e907a97816ce3db62922d8ec12cb)
            check_type(argname="argument cross_account_model_register_role_arn", value=cross_account_model_register_role_arn, expected_type=type_hints["cross_account_model_register_role_arn"])
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if cross_account_model_register_role_arn is not None:
            self._values["cross_account_model_register_role_arn"] = cross_account_model_register_role_arn
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def cross_account_model_register_role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#cross_account_model_register_role_arn SagemakerUserProfile#cross_account_model_register_role_arn}.'''
        result = self._values.get("cross_account_model_register_role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8d1e721ae38233ac31471607ecf4d4e5b02726223276ad81cb37f69e3953955a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCrossAccountModelRegisterRoleArn")
    def reset_cross_account_model_register_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCrossAccountModelRegisterRoleArn", []))

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @builtins.property
    @jsii.member(jsii_name="crossAccountModelRegisterRoleArnInput")
    def cross_account_model_register_role_arn_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "crossAccountModelRegisterRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

    @builtins.property
    @jsii.member(jsii_name="crossAccountModelRegisterRoleArn")
    def cross_account_model_register_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "crossAccountModelRegisterRoleArn"))

    @cross_account_model_register_role_arn.setter
    def cross_account_model_register_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__580f1864b1319edf6df503fe9f55a943d85db7deb98e3e37cba369c936a62c18)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "crossAccountModelRegisterRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4ac29e4f03e17ca62f20fb694572c08fb40d42e00529a41cf663a80ee42dbce)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__047ac3278d0fa26760beceb3f2350f77f267c7aa4060ac99dde8f039b234ce2d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsCanvasAppSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__69a4b6ffa730b8ca119734580eae653bc5bcd3d9d1b1ec694fdbef1c25069405)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDirectDeploySettings")
    def put_direct_deploy_settings(
        self,
        *,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
        '''
        value = SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings(
            status=status
        )

        return typing.cast(None, jsii.invoke(self, "putDirectDeploySettings", [value]))

    @jsii.member(jsii_name="putEmrServerlessSettings")
    def put_emr_serverless_settings(
        self,
        *,
        execution_role_arn: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param execution_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#execution_role_arn SagemakerUserProfile#execution_role_arn}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
        '''
        value = SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings(
            execution_role_arn=execution_role_arn, status=status
        )

        return typing.cast(None, jsii.invoke(self, "putEmrServerlessSettings", [value]))

    @jsii.member(jsii_name="putGenerativeAiSettings")
    def put_generative_ai_settings(
        self,
        *,
        amazon_bedrock_role_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param amazon_bedrock_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#amazon_bedrock_role_arn SagemakerUserProfile#amazon_bedrock_role_arn}.
        '''
        value = SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings(
            amazon_bedrock_role_arn=amazon_bedrock_role_arn
        )

        return typing.cast(None, jsii.invoke(self, "putGenerativeAiSettings", [value]))

    @jsii.member(jsii_name="putIdentityProviderOauthSettings")
    def put_identity_provider_oauth_settings(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b23c75e3c59f96d7f63ba891a2027f96c8dc3e8dc40d82e4c31ef7861aa25902)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putIdentityProviderOauthSettings", [value]))

    @jsii.member(jsii_name="putKendraSettings")
    def put_kendra_settings(
        self,
        *,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
        '''
        value = SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings(
            status=status
        )

        return typing.cast(None, jsii.invoke(self, "putKendraSettings", [value]))

    @jsii.member(jsii_name="putModelRegisterSettings")
    def put_model_register_settings(
        self,
        *,
        cross_account_model_register_role_arn: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param cross_account_model_register_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#cross_account_model_register_role_arn SagemakerUserProfile#cross_account_model_register_role_arn}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
        '''
        value = SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings(
            cross_account_model_register_role_arn=cross_account_model_register_role_arn,
            status=status,
        )

        return typing.cast(None, jsii.invoke(self, "putModelRegisterSettings", [value]))

    @jsii.member(jsii_name="putTimeSeriesForecastingSettings")
    def put_time_series_forecasting_settings(
        self,
        *,
        amazon_forecast_role_arn: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param amazon_forecast_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#amazon_forecast_role_arn SagemakerUserProfile#amazon_forecast_role_arn}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
        '''
        value = SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings(
            amazon_forecast_role_arn=amazon_forecast_role_arn, status=status
        )

        return typing.cast(None, jsii.invoke(self, "putTimeSeriesForecastingSettings", [value]))

    @jsii.member(jsii_name="putWorkspaceSettings")
    def put_workspace_settings(
        self,
        *,
        s3_artifact_path: typing.Optional[builtins.str] = None,
        s3_kms_key_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_artifact_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_artifact_path SagemakerUserProfile#s3_artifact_path}.
        :param s3_kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_kms_key_id SagemakerUserProfile#s3_kms_key_id}.
        '''
        value = SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings(
            s3_artifact_path=s3_artifact_path, s3_kms_key_id=s3_kms_key_id
        )

        return typing.cast(None, jsii.invoke(self, "putWorkspaceSettings", [value]))

    @jsii.member(jsii_name="resetDirectDeploySettings")
    def reset_direct_deploy_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDirectDeploySettings", []))

    @jsii.member(jsii_name="resetEmrServerlessSettings")
    def reset_emr_serverless_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEmrServerlessSettings", []))

    @jsii.member(jsii_name="resetGenerativeAiSettings")
    def reset_generative_ai_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGenerativeAiSettings", []))

    @jsii.member(jsii_name="resetIdentityProviderOauthSettings")
    def reset_identity_provider_oauth_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdentityProviderOauthSettings", []))

    @jsii.member(jsii_name="resetKendraSettings")
    def reset_kendra_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKendraSettings", []))

    @jsii.member(jsii_name="resetModelRegisterSettings")
    def reset_model_register_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetModelRegisterSettings", []))

    @jsii.member(jsii_name="resetTimeSeriesForecastingSettings")
    def reset_time_series_forecasting_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeSeriesForecastingSettings", []))

    @jsii.member(jsii_name="resetWorkspaceSettings")
    def reset_workspace_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWorkspaceSettings", []))

    @builtins.property
    @jsii.member(jsii_name="directDeploySettings")
    def direct_deploy_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettingsOutputReference, jsii.get(self, "directDeploySettings"))

    @builtins.property
    @jsii.member(jsii_name="emrServerlessSettings")
    def emr_serverless_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettingsOutputReference, jsii.get(self, "emrServerlessSettings"))

    @builtins.property
    @jsii.member(jsii_name="generativeAiSettings")
    def generative_ai_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettingsOutputReference, jsii.get(self, "generativeAiSettings"))

    @builtins.property
    @jsii.member(jsii_name="identityProviderOauthSettings")
    def identity_provider_oauth_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsList:
        return typing.cast(SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsList, jsii.get(self, "identityProviderOauthSettings"))

    @builtins.property
    @jsii.member(jsii_name="kendraSettings")
    def kendra_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettingsOutputReference, jsii.get(self, "kendraSettings"))

    @builtins.property
    @jsii.member(jsii_name="modelRegisterSettings")
    def model_register_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettingsOutputReference, jsii.get(self, "modelRegisterSettings"))

    @builtins.property
    @jsii.member(jsii_name="timeSeriesForecastingSettings")
    def time_series_forecasting_settings(
        self,
    ) -> "SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference":
        return typing.cast("SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference", jsii.get(self, "timeSeriesForecastingSettings"))

    @builtins.property
    @jsii.member(jsii_name="workspaceSettings")
    def workspace_settings(
        self,
    ) -> "SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettingsOutputReference":
        return typing.cast("SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettingsOutputReference", jsii.get(self, "workspaceSettings"))

    @builtins.property
    @jsii.member(jsii_name="directDeploySettingsInput")
    def direct_deploy_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings], jsii.get(self, "directDeploySettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="emrServerlessSettingsInput")
    def emr_serverless_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings], jsii.get(self, "emrServerlessSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="generativeAiSettingsInput")
    def generative_ai_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings], jsii.get(self, "generativeAiSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="identityProviderOauthSettingsInput")
    def identity_provider_oauth_settings_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings]]], jsii.get(self, "identityProviderOauthSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="kendraSettingsInput")
    def kendra_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings], jsii.get(self, "kendraSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="modelRegisterSettingsInput")
    def model_register_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings], jsii.get(self, "modelRegisterSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="timeSeriesForecastingSettingsInput")
    def time_series_forecasting_settings_input(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings"]:
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings"], jsii.get(self, "timeSeriesForecastingSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="workspaceSettingsInput")
    def workspace_settings_input(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings"]:
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings"], jsii.get(self, "workspaceSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61c5a6523896991c5be0a0e4b84781da8513bc369ac8fe9c47e0beed006d6544)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings",
    jsii_struct_bases=[],
    name_mapping={
        "amazon_forecast_role_arn": "amazonForecastRoleArn",
        "status": "status",
    },
)
class SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings:
    def __init__(
        self,
        *,
        amazon_forecast_role_arn: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param amazon_forecast_role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#amazon_forecast_role_arn SagemakerUserProfile#amazon_forecast_role_arn}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__112770e3f4de92edb14572763999d4b0fa2adef5718365d58c265d3c39763f13)
            check_type(argname="argument amazon_forecast_role_arn", value=amazon_forecast_role_arn, expected_type=type_hints["amazon_forecast_role_arn"])
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if amazon_forecast_role_arn is not None:
            self._values["amazon_forecast_role_arn"] = amazon_forecast_role_arn
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def amazon_forecast_role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#amazon_forecast_role_arn SagemakerUserProfile#amazon_forecast_role_arn}.'''
        result = self._values.get("amazon_forecast_role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2c2afc809c01888df468e9803ecd1497355c28776f2bc7d23470f32758588804)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAmazonForecastRoleArn")
    def reset_amazon_forecast_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAmazonForecastRoleArn", []))

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @builtins.property
    @jsii.member(jsii_name="amazonForecastRoleArnInput")
    def amazon_forecast_role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "amazonForecastRoleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

    @builtins.property
    @jsii.member(jsii_name="amazonForecastRoleArn")
    def amazon_forecast_role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "amazonForecastRoleArn"))

    @amazon_forecast_role_arn.setter
    def amazon_forecast_role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__40598666bdd057a11549bf592d1408ed5b297533b83a58ba9ae3cb2ae4ef0499)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "amazonForecastRoleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__204389a718c4f7ac1e7e645058c4802816deb176e3d667ba5a4256ac40c4b6fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__27b47a6cf1716cdeea9d008b4eff25700650bb104504cafdb46c90886ae93321)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings",
    jsii_struct_bases=[],
    name_mapping={"s3_artifact_path": "s3ArtifactPath", "s3_kms_key_id": "s3KmsKeyId"},
)
class SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings:
    def __init__(
        self,
        *,
        s3_artifact_path: typing.Optional[builtins.str] = None,
        s3_kms_key_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param s3_artifact_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_artifact_path SagemakerUserProfile#s3_artifact_path}.
        :param s3_kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_kms_key_id SagemakerUserProfile#s3_kms_key_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__400b9bb04452b47f148e01c7c760be34208f967ddc7678d1920c4b44422d6f01)
            check_type(argname="argument s3_artifact_path", value=s3_artifact_path, expected_type=type_hints["s3_artifact_path"])
            check_type(argname="argument s3_kms_key_id", value=s3_kms_key_id, expected_type=type_hints["s3_kms_key_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if s3_artifact_path is not None:
            self._values["s3_artifact_path"] = s3_artifact_path
        if s3_kms_key_id is not None:
            self._values["s3_kms_key_id"] = s3_kms_key_id

    @builtins.property
    def s3_artifact_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_artifact_path SagemakerUserProfile#s3_artifact_path}.'''
        result = self._values.get("s3_artifact_path")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def s3_kms_key_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_kms_key_id SagemakerUserProfile#s3_kms_key_id}.'''
        result = self._values.get("s3_kms_key_id")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__643d52c71773c6000530c59dde69fad16f8ee24e239aab2bb48ed68438aeb335)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetS3ArtifactPath")
    def reset_s3_artifact_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3ArtifactPath", []))

    @jsii.member(jsii_name="resetS3KmsKeyId")
    def reset_s3_kms_key_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3KmsKeyId", []))

    @builtins.property
    @jsii.member(jsii_name="s3ArtifactPathInput")
    def s3_artifact_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3ArtifactPathInput"))

    @builtins.property
    @jsii.member(jsii_name="s3KmsKeyIdInput")
    def s3_kms_key_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3KmsKeyIdInput"))

    @builtins.property
    @jsii.member(jsii_name="s3ArtifactPath")
    def s3_artifact_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3ArtifactPath"))

    @s3_artifact_path.setter
    def s3_artifact_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3937a05658a120ca37437176efefa6af8216b065361d7e21983047405ffa1b44)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3ArtifactPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3KmsKeyId")
    def s3_kms_key_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3KmsKeyId"))

    @s3_kms_key_id.setter
    def s3_kms_key_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__662421ac5d7adc31e7fe2a4b5af9a344ceb0b7f061788d7aee0755ed68f34731)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3KmsKeyId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d8c03944bf9f98bcd61d33630d3d99d9db4006e3d12ef11cb1044b11454a47d8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCodeEditorAppSettings",
    jsii_struct_bases=[],
    name_mapping={
        "app_lifecycle_management": "appLifecycleManagement",
        "built_in_lifecycle_config_arn": "builtInLifecycleConfigArn",
        "custom_image": "customImage",
        "default_resource_spec": "defaultResourceSpec",
        "lifecycle_config_arns": "lifecycleConfigArns",
    },
)
class SagemakerUserProfileUserSettingsCodeEditorAppSettings:
    def __init__(
        self,
        *,
        app_lifecycle_management: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement", typing.Dict[builtins.str, typing.Any]]] = None,
        built_in_lifecycle_config_arn: typing.Optional[builtins.str] = None,
        custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage", typing.Dict[builtins.str, typing.Any]]]]] = None,
        default_resource_spec: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec", typing.Dict[builtins.str, typing.Any]]] = None,
        lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param app_lifecycle_management: app_lifecycle_management block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_lifecycle_management SagemakerUserProfile#app_lifecycle_management}
        :param built_in_lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#built_in_lifecycle_config_arn SagemakerUserProfile#built_in_lifecycle_config_arn}.
        :param custom_image: custom_image block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        :param lifecycle_config_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.
        '''
        if isinstance(app_lifecycle_management, dict):
            app_lifecycle_management = SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement(**app_lifecycle_management)
        if isinstance(default_resource_spec, dict):
            default_resource_spec = SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec(**default_resource_spec)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ad3329cedc284aceeaffba972c2587876658a3de61d253db88df654c506f2f8c)
            check_type(argname="argument app_lifecycle_management", value=app_lifecycle_management, expected_type=type_hints["app_lifecycle_management"])
            check_type(argname="argument built_in_lifecycle_config_arn", value=built_in_lifecycle_config_arn, expected_type=type_hints["built_in_lifecycle_config_arn"])
            check_type(argname="argument custom_image", value=custom_image, expected_type=type_hints["custom_image"])
            check_type(argname="argument default_resource_spec", value=default_resource_spec, expected_type=type_hints["default_resource_spec"])
            check_type(argname="argument lifecycle_config_arns", value=lifecycle_config_arns, expected_type=type_hints["lifecycle_config_arns"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if app_lifecycle_management is not None:
            self._values["app_lifecycle_management"] = app_lifecycle_management
        if built_in_lifecycle_config_arn is not None:
            self._values["built_in_lifecycle_config_arn"] = built_in_lifecycle_config_arn
        if custom_image is not None:
            self._values["custom_image"] = custom_image
        if default_resource_spec is not None:
            self._values["default_resource_spec"] = default_resource_spec
        if lifecycle_config_arns is not None:
            self._values["lifecycle_config_arns"] = lifecycle_config_arns

    @builtins.property
    def app_lifecycle_management(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement"]:
        '''app_lifecycle_management block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_lifecycle_management SagemakerUserProfile#app_lifecycle_management}
        '''
        result = self._values.get("app_lifecycle_management")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement"], result)

    @builtins.property
    def built_in_lifecycle_config_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#built_in_lifecycle_config_arn SagemakerUserProfile#built_in_lifecycle_config_arn}.'''
        result = self._values.get("built_in_lifecycle_config_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def custom_image(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage"]]]:
        '''custom_image block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
        '''
        result = self._values.get("custom_image")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage"]]], result)

    @builtins.property
    def default_resource_spec(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec"]:
        '''default_resource_spec block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        '''
        result = self._values.get("default_resource_spec")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec"], result)

    @builtins.property
    def lifecycle_config_arns(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.'''
        result = self._values.get("lifecycle_config_arns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCodeEditorAppSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement",
    jsii_struct_bases=[],
    name_mapping={"idle_settings": "idleSettings"},
)
class SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement:
    def __init__(
        self,
        *,
        idle_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param idle_settings: idle_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_settings SagemakerUserProfile#idle_settings}
        '''
        if isinstance(idle_settings, dict):
            idle_settings = SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings(**idle_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a8c3f2b6569e0e87aebde15858a4d5f0e5aa7227d0ecc7b1ea300e17e25554e)
            check_type(argname="argument idle_settings", value=idle_settings, expected_type=type_hints["idle_settings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if idle_settings is not None:
            self._values["idle_settings"] = idle_settings

    @builtins.property
    def idle_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings"]:
        '''idle_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_settings SagemakerUserProfile#idle_settings}
        '''
        result = self._values.get("idle_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings",
    jsii_struct_bases=[],
    name_mapping={
        "idle_timeout_in_minutes": "idleTimeoutInMinutes",
        "lifecycle_management": "lifecycleManagement",
        "max_idle_timeout_in_minutes": "maxIdleTimeoutInMinutes",
        "min_idle_timeout_in_minutes": "minIdleTimeoutInMinutes",
    },
)
class SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings:
    def __init__(
        self,
        *,
        idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
        lifecycle_management: typing.Optional[builtins.str] = None,
        max_idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
        min_idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_timeout_in_minutes SagemakerUserProfile#idle_timeout_in_minutes}.
        :param lifecycle_management: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_management SagemakerUserProfile#lifecycle_management}.
        :param max_idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#max_idle_timeout_in_minutes SagemakerUserProfile#max_idle_timeout_in_minutes}.
        :param min_idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#min_idle_timeout_in_minutes SagemakerUserProfile#min_idle_timeout_in_minutes}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__269b32ea85f4b2770be150cc18b7e56ebee1deca58c017d10a5cd4194230ab5e)
            check_type(argname="argument idle_timeout_in_minutes", value=idle_timeout_in_minutes, expected_type=type_hints["idle_timeout_in_minutes"])
            check_type(argname="argument lifecycle_management", value=lifecycle_management, expected_type=type_hints["lifecycle_management"])
            check_type(argname="argument max_idle_timeout_in_minutes", value=max_idle_timeout_in_minutes, expected_type=type_hints["max_idle_timeout_in_minutes"])
            check_type(argname="argument min_idle_timeout_in_minutes", value=min_idle_timeout_in_minutes, expected_type=type_hints["min_idle_timeout_in_minutes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if idle_timeout_in_minutes is not None:
            self._values["idle_timeout_in_minutes"] = idle_timeout_in_minutes
        if lifecycle_management is not None:
            self._values["lifecycle_management"] = lifecycle_management
        if max_idle_timeout_in_minutes is not None:
            self._values["max_idle_timeout_in_minutes"] = max_idle_timeout_in_minutes
        if min_idle_timeout_in_minutes is not None:
            self._values["min_idle_timeout_in_minutes"] = min_idle_timeout_in_minutes

    @builtins.property
    def idle_timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_timeout_in_minutes SagemakerUserProfile#idle_timeout_in_minutes}.'''
        result = self._values.get("idle_timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def lifecycle_management(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_management SagemakerUserProfile#lifecycle_management}.'''
        result = self._values.get("lifecycle_management")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def max_idle_timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#max_idle_timeout_in_minutes SagemakerUserProfile#max_idle_timeout_in_minutes}.'''
        result = self._values.get("max_idle_timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min_idle_timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#min_idle_timeout_in_minutes SagemakerUserProfile#min_idle_timeout_in_minutes}.'''
        result = self._values.get("min_idle_timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c645bcce3defc9a9bf269c437c4e00e66e3bbfdc1eeb7b8729702a03309060df)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetIdleTimeoutInMinutes")
    def reset_idle_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdleTimeoutInMinutes", []))

    @jsii.member(jsii_name="resetLifecycleManagement")
    def reset_lifecycle_management(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycleManagement", []))

    @jsii.member(jsii_name="resetMaxIdleTimeoutInMinutes")
    def reset_max_idle_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxIdleTimeoutInMinutes", []))

    @jsii.member(jsii_name="resetMinIdleTimeoutInMinutes")
    def reset_min_idle_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinIdleTimeoutInMinutes", []))

    @builtins.property
    @jsii.member(jsii_name="idleTimeoutInMinutesInput")
    def idle_timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "idleTimeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleManagementInput")
    def lifecycle_management_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lifecycleManagementInput"))

    @builtins.property
    @jsii.member(jsii_name="maxIdleTimeoutInMinutesInput")
    def max_idle_timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxIdleTimeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="minIdleTimeoutInMinutesInput")
    def min_idle_timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minIdleTimeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="idleTimeoutInMinutes")
    def idle_timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "idleTimeoutInMinutes"))

    @idle_timeout_in_minutes.setter
    def idle_timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fdaba26e4cc9da947d4931bbb6c065dd7c70eb2b018a1af674b5ec2a2daeb482)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "idleTimeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleManagement")
    def lifecycle_management(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleManagement"))

    @lifecycle_management.setter
    def lifecycle_management(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7eb9505adb90643ac4215caa78c7548a8ee1d33ece8d300c9d5b5af3d1f47774)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleManagement", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxIdleTimeoutInMinutes")
    def max_idle_timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxIdleTimeoutInMinutes"))

    @max_idle_timeout_in_minutes.setter
    def max_idle_timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bdc0acb02c333134aa39abc3bf8e0efefe9f75b7e7ac5913d7e745e23509fbc4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxIdleTimeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minIdleTimeoutInMinutes")
    def min_idle_timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minIdleTimeoutInMinutes"))

    @min_idle_timeout_in_minutes.setter
    def min_idle_timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__030dc896959202ac962ed8b00de9df3abc7e69eb8747a255f27ba5027e24f342)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minIdleTimeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9529a6630a4a815932c64b4468783df3242b17d9ef9c19ba91f2a6456175cb85)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e466961ea4593fbd37ecc09df78a828d41c002039021dbc05020982ce6d2844f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putIdleSettings")
    def put_idle_settings(
        self,
        *,
        idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
        lifecycle_management: typing.Optional[builtins.str] = None,
        max_idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
        min_idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_timeout_in_minutes SagemakerUserProfile#idle_timeout_in_minutes}.
        :param lifecycle_management: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_management SagemakerUserProfile#lifecycle_management}.
        :param max_idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#max_idle_timeout_in_minutes SagemakerUserProfile#max_idle_timeout_in_minutes}.
        :param min_idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#min_idle_timeout_in_minutes SagemakerUserProfile#min_idle_timeout_in_minutes}.
        '''
        value = SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings(
            idle_timeout_in_minutes=idle_timeout_in_minutes,
            lifecycle_management=lifecycle_management,
            max_idle_timeout_in_minutes=max_idle_timeout_in_minutes,
            min_idle_timeout_in_minutes=min_idle_timeout_in_minutes,
        )

        return typing.cast(None, jsii.invoke(self, "putIdleSettings", [value]))

    @jsii.member(jsii_name="resetIdleSettings")
    def reset_idle_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdleSettings", []))

    @builtins.property
    @jsii.member(jsii_name="idleSettings")
    def idle_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference, jsii.get(self, "idleSettings"))

    @builtins.property
    @jsii.member(jsii_name="idleSettingsInput")
    def idle_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings], jsii.get(self, "idleSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__58fd8b4f8a439c600ce83a4159dd97295faec8ca7eb9450d7db2586f80fdd994)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage",
    jsii_struct_bases=[],
    name_mapping={
        "app_image_config_name": "appImageConfigName",
        "image_name": "imageName",
        "image_version_number": "imageVersionNumber",
    },
)
class SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage:
    def __init__(
        self,
        *,
        app_image_config_name: builtins.str,
        image_name: builtins.str,
        image_version_number: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param app_image_config_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_image_config_name SagemakerUserProfile#app_image_config_name}.
        :param image_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_name SagemakerUserProfile#image_name}.
        :param image_version_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_version_number SagemakerUserProfile#image_version_number}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__31685d399a5a2f5d157a4061e990a5336420fbf2670fe850fcd13a250a4245fb)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_image_config_name SagemakerUserProfile#app_image_config_name}.'''
        result = self._values.get("app_image_config_name")
        assert result is not None, "Required property 'app_image_config_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def image_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_name SagemakerUserProfile#image_name}.'''
        result = self._values.get("image_name")
        assert result is not None, "Required property 'image_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def image_version_number(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_version_number SagemakerUserProfile#image_version_number}.'''
        result = self._values.get("image_version_number")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImageList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImageList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e2c0af4c298a2b6d04a1f44a01f2b206ce430d5d6a89e6210966c80f80e224f2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImageOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9312a860fecadb8fce6a7b897680ca48df14314e47f0614c2b0b986870898d35)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImageOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b29c78f87709bfb12918f1aab4088755a4036c368cb2f31c3380504f52cea1b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b6f26e1360444f3a945ae16b2022c653ed7c659e45ed1eb53778564114d12a30)
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
            type_hints = typing.get_type_hints(_typecheckingstub__e611d29463a9847a4b8198e73af7d5407fbc93f7c9d30c7a105163bb7927e70d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c3882cb0a353b6513380844b7705abec2e5bccbb030af882ba42221f076d7b76)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImageOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImageOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__b782474111f309a67d2f888f6697ec6b0aad7fa4942c9088f8f3e470d1d73030)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c0f28b5e65383c5194e00203f8f3a8e34e6d6d0eb0f99ea482e9f9c7c4547e0c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "appImageConfigName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imageName")
    def image_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "imageName"))

    @image_name.setter
    def image_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b2480c6eb601ae956b181734b3c129d2353d3f3436e03c5422acfdc47a71dd4d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imageName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imageVersionNumber")
    def image_version_number(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "imageVersionNumber"))

    @image_version_number.setter
    def image_version_number(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e3f599cfb86d8be32c90383683bb3041dcc0123b9364f12a5dbc79f826775774)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imageVersionNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fb0bdd7da81113c7522c4ea01d222955ef89fa0ebdec2b92f19041f9086c03eb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec",
    jsii_struct_bases=[],
    name_mapping={
        "instance_type": "instanceType",
        "lifecycle_config_arn": "lifecycleConfigArn",
        "sagemaker_image_arn": "sagemakerImageArn",
        "sagemaker_image_version_alias": "sagemakerImageVersionAlias",
        "sagemaker_image_version_arn": "sagemakerImageVersionArn",
    },
)
class SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec:
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
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__212c17736212b6e994c35614906571fec28487b3e89d84513914a623eba61bd1)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lifecycle_config_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.'''
        result = self._values.get("lifecycle_config_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.'''
        result = self._values.get("sagemaker_image_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_alias(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.'''
        result = self._values.get("sagemaker_image_version_alias")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.'''
        result = self._values.get("sagemaker_image_version_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4443f427b796bc6ee8166ad7ed7c2c4bf0ffd911b1c3847bfb8cd2a44963fa61)
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
            type_hints = typing.get_type_hints(_typecheckingstub__40cab206d19cb5cbd6796cbf74a4c9799f791d6dd450904375bde60efe659c13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArn")
    def lifecycle_config_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleConfigArn"))

    @lifecycle_config_arn.setter
    def lifecycle_config_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__869647f40f998c4fda14ea599d8eb361c3cbded53a832edde1fc550e46535073)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArn")
    def sagemaker_image_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageArn"))

    @sagemaker_image_arn.setter
    def sagemaker_image_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__90f8b73ccb31b23d136e9ada4cb0eed300a48e7d2ce1441b4fc38b8b3fd4c58c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAlias")
    def sagemaker_image_version_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionAlias"))

    @sagemaker_image_version_alias.setter
    def sagemaker_image_version_alias(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__11380be6410955b51f62bd9fa242e449088d6afb7707f5fbb5c929205103b1a3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionAlias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArn")
    def sagemaker_image_version_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionArn"))

    @sagemaker_image_version_arn.setter
    def sagemaker_image_version_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a62823d255cedc9d1b796f1d37e4b0cca023d9942d647bf99c310da806af7788)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ebd07853f67330e910f41b3b854358cb08b73489d522db16b43a4580f33bd18)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsCodeEditorAppSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCodeEditorAppSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__976db0297bf5a71acc56521a1165f66a75d52ca96f07f372b9126a92d85b1549)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAppLifecycleManagement")
    def put_app_lifecycle_management(
        self,
        *,
        idle_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param idle_settings: idle_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_settings SagemakerUserProfile#idle_settings}
        '''
        value = SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement(
            idle_settings=idle_settings
        )

        return typing.cast(None, jsii.invoke(self, "putAppLifecycleManagement", [value]))

    @jsii.member(jsii_name="putCustomImage")
    def put_custom_image(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7cc81c6501ed4bbf79c64a8286ea92ff00893f89c1968360467e25b059515ca2)
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
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.
        '''
        value = SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec(
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

    @jsii.member(jsii_name="resetBuiltInLifecycleConfigArn")
    def reset_built_in_lifecycle_config_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBuiltInLifecycleConfigArn", []))

    @jsii.member(jsii_name="resetCustomImage")
    def reset_custom_image(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomImage", []))

    @jsii.member(jsii_name="resetDefaultResourceSpec")
    def reset_default_resource_spec(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultResourceSpec", []))

    @jsii.member(jsii_name="resetLifecycleConfigArns")
    def reset_lifecycle_config_arns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycleConfigArns", []))

    @builtins.property
    @jsii.member(jsii_name="appLifecycleManagement")
    def app_lifecycle_management(
        self,
    ) -> SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference, jsii.get(self, "appLifecycleManagement"))

    @builtins.property
    @jsii.member(jsii_name="customImage")
    def custom_image(
        self,
    ) -> SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImageList:
        return typing.cast(SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImageList, jsii.get(self, "customImage"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpec")
    def default_resource_spec(
        self,
    ) -> SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference, jsii.get(self, "defaultResourceSpec"))

    @builtins.property
    @jsii.member(jsii_name="appLifecycleManagementInput")
    def app_lifecycle_management_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement], jsii.get(self, "appLifecycleManagementInput"))

    @builtins.property
    @jsii.member(jsii_name="builtInLifecycleConfigArnInput")
    def built_in_lifecycle_config_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "builtInLifecycleConfigArnInput"))

    @builtins.property
    @jsii.member(jsii_name="customImageInput")
    def custom_image_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage]]], jsii.get(self, "customImageInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpecInput")
    def default_resource_spec_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec], jsii.get(self, "defaultResourceSpecInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArnsInput")
    def lifecycle_config_arns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "lifecycleConfigArnsInput"))

    @builtins.property
    @jsii.member(jsii_name="builtInLifecycleConfigArn")
    def built_in_lifecycle_config_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "builtInLifecycleConfigArn"))

    @built_in_lifecycle_config_arn.setter
    def built_in_lifecycle_config_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__019185b8566710fe9c11f541f0c5a4064b09a8e2767d22a50985b0f0205d3f5a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "builtInLifecycleConfigArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArns")
    def lifecycle_config_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "lifecycleConfigArns"))

    @lifecycle_config_arns.setter
    def lifecycle_config_arns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__af10686d3e00b991af1959328b4e19c674cfef5a9546d5eb5c984feb2aaf2a03)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7e40ddc62cdd9589b708caf13743c193450bd8c0d46b2d340dabe3696b8b9bcb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCustomFileSystemConfig",
    jsii_struct_bases=[],
    name_mapping={"efs_file_system_config": "efsFileSystemConfig"},
)
class SagemakerUserProfileUserSettingsCustomFileSystemConfig:
    def __init__(
        self,
        *,
        efs_file_system_config: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param efs_file_system_config: efs_file_system_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#efs_file_system_config SagemakerUserProfile#efs_file_system_config}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__da2df07d8dadc95d8ae4bd9b9c50a29bab0abc4a49b4b646c987524387dda87a)
            check_type(argname="argument efs_file_system_config", value=efs_file_system_config, expected_type=type_hints["efs_file_system_config"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if efs_file_system_config is not None:
            self._values["efs_file_system_config"] = efs_file_system_config

    @builtins.property
    def efs_file_system_config(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig"]]]:
        '''efs_file_system_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#efs_file_system_config SagemakerUserProfile#efs_file_system_config}
        '''
        result = self._values.get("efs_file_system_config")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCustomFileSystemConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig",
    jsii_struct_bases=[],
    name_mapping={
        "file_system_id": "fileSystemId",
        "file_system_path": "fileSystemPath",
    },
)
class SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig:
    def __init__(
        self,
        *,
        file_system_id: builtins.str,
        file_system_path: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param file_system_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#file_system_id SagemakerUserProfile#file_system_id}.
        :param file_system_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#file_system_path SagemakerUserProfile#file_system_path}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b49c7c7f3588551a85d7b745c1dcdaea04b4eb8a466fa795b00784e4db68d132)
            check_type(argname="argument file_system_id", value=file_system_id, expected_type=type_hints["file_system_id"])
            check_type(argname="argument file_system_path", value=file_system_path, expected_type=type_hints["file_system_path"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "file_system_id": file_system_id,
        }
        if file_system_path is not None:
            self._values["file_system_path"] = file_system_path

    @builtins.property
    def file_system_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#file_system_id SagemakerUserProfile#file_system_id}.'''
        result = self._values.get("file_system_id")
        assert result is not None, "Required property 'file_system_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def file_system_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#file_system_path SagemakerUserProfile#file_system_path}.'''
        result = self._values.get("file_system_path")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__edba72f2e06aeffc080b76db35cbcfe5c3b6d2c08b8b2ece060749b09f91aa3d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4d7e1a3243a616d9056ac62ec62c91dc36bdef8f501547d770c665deac922909)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c656d646f8feaf3ec4ffa965e1f0887781dfadd12440165da8153b15e71bb0f2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__25192b4365f6267728261e5b1dc5db8fc0772a76cd34fe8a704aaf1574aac7fa)
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
            type_hints = typing.get_type_hints(_typecheckingstub__69d224ff23b6efdc61c198525d77242e6401590ce356e3063c65b35d509194d3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb23059bf8c254fe090e3afa64c234f30691275571b4784a6293aac6fb63cf3a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2242268e83245261734d05031f3c745a600f3e3d0711278801a461d30db805f6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetFileSystemPath")
    def reset_file_system_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFileSystemPath", []))

    @builtins.property
    @jsii.member(jsii_name="fileSystemIdInput")
    def file_system_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "fileSystemIdInput"))

    @builtins.property
    @jsii.member(jsii_name="fileSystemPathInput")
    def file_system_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "fileSystemPathInput"))

    @builtins.property
    @jsii.member(jsii_name="fileSystemId")
    def file_system_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fileSystemId"))

    @file_system_id.setter
    def file_system_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e87765227b1430976c4533466a70c24393286178f7d1b056f0d9766826833c0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fileSystemId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="fileSystemPath")
    def file_system_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "fileSystemPath"))

    @file_system_path.setter
    def file_system_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6883adb2e2644895e3f97530fd18bb84c821f286b49eeff0094260657a8179f7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "fileSystemPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc197c474f956970375b6d1e94b09b61e64163399db91ec1e60baa34029ffd90)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsCustomFileSystemConfigList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCustomFileSystemConfigList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__29e0b0f957e3159bdd0f809071f178199022d6cd85927a201f30d47931d78d13)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerUserProfileUserSettingsCustomFileSystemConfigOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f249283578c2d10c9ec57efb990d2bfcc0b9144a84bb50047290348512d899c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerUserProfileUserSettingsCustomFileSystemConfigOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c12f5d9dbb8b2a91a3116b409aa31297f3910e8e4b9ef0093857d1fd31539fa4)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ac5e4a172133f685462e38048a86a39b2531bbf14cbc842fd036841fbf818dc8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__cbcec1b4121c5c72c0cffac1aa6038498331c14fe104be00eab0b6f5a9e6fe88)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCustomFileSystemConfig]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCustomFileSystemConfig]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCustomFileSystemConfig]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d65c2dcc66eec3d6d17ceda39e34a3c99313da50eb47b91a648eac59773ffaa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsCustomFileSystemConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCustomFileSystemConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8260ae2c93b6839498a3bba7311751d2fb809374f3f10bef917925227f3836e0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putEfsFileSystemConfig")
    def put_efs_file_system_config(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__63061bafb8c5d3174e75baaee09d4626c9c4671baec9402b4f5e2d7660187396)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putEfsFileSystemConfig", [value]))

    @jsii.member(jsii_name="resetEfsFileSystemConfig")
    def reset_efs_file_system_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEfsFileSystemConfig", []))

    @builtins.property
    @jsii.member(jsii_name="efsFileSystemConfig")
    def efs_file_system_config(
        self,
    ) -> SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigList:
        return typing.cast(SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigList, jsii.get(self, "efsFileSystemConfig"))

    @builtins.property
    @jsii.member(jsii_name="efsFileSystemConfigInput")
    def efs_file_system_config_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig]]], jsii.get(self, "efsFileSystemConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCustomFileSystemConfig]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCustomFileSystemConfig]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCustomFileSystemConfig]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f575e7b648f7e311ae341ffeea133ac42ce0b01e9b9d741d996f6861791546f1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCustomPosixUserConfig",
    jsii_struct_bases=[],
    name_mapping={"gid": "gid", "uid": "uid"},
)
class SagemakerUserProfileUserSettingsCustomPosixUserConfig:
    def __init__(self, *, gid: jsii.Number, uid: jsii.Number) -> None:
        '''
        :param gid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#gid SagemakerUserProfile#gid}.
        :param uid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#uid SagemakerUserProfile#uid}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__07eda42e0b2e8ae839fb5682fd3ee20da510147caa0927d4820753cc74603e78)
            check_type(argname="argument gid", value=gid, expected_type=type_hints["gid"])
            check_type(argname="argument uid", value=uid, expected_type=type_hints["uid"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "gid": gid,
            "uid": uid,
        }

    @builtins.property
    def gid(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#gid SagemakerUserProfile#gid}.'''
        result = self._values.get("gid")
        assert result is not None, "Required property 'gid' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def uid(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#uid SagemakerUserProfile#uid}.'''
        result = self._values.get("uid")
        assert result is not None, "Required property 'uid' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsCustomPosixUserConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsCustomPosixUserConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCustomPosixUserConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__88c26e1b72fdd541fa9dfe3aef7a8fa79eeb9fbfdace23f42a65a3eb88b9c335)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="gidInput")
    def gid_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "gidInput"))

    @builtins.property
    @jsii.member(jsii_name="uidInput")
    def uid_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "uidInput"))

    @builtins.property
    @jsii.member(jsii_name="gid")
    def gid(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "gid"))

    @gid.setter
    def gid(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5a6a2270bcb263c51b435ecb5a8d5a66404765b85f19f44ffd3224699e712447)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "gid", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="uid")
    def uid(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "uid"))

    @uid.setter
    def uid(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7acddb6169b775c5347ff10e318f7c849f3f91d0432edc016796fdcec40b0d6d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "uid", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCustomPosixUserConfig]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCustomPosixUserConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsCustomPosixUserConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99c608fa6a823f261d7944813c2fc5bc004a638d7c3fc1d744dcd54c427662cd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettings",
    jsii_struct_bases=[],
    name_mapping={
        "app_lifecycle_management": "appLifecycleManagement",
        "built_in_lifecycle_config_arn": "builtInLifecycleConfigArn",
        "code_repository": "codeRepository",
        "custom_image": "customImage",
        "default_resource_spec": "defaultResourceSpec",
        "emr_settings": "emrSettings",
        "lifecycle_config_arns": "lifecycleConfigArns",
    },
)
class SagemakerUserProfileUserSettingsJupyterLabAppSettings:
    def __init__(
        self,
        *,
        app_lifecycle_management: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement", typing.Dict[builtins.str, typing.Any]]] = None,
        built_in_lifecycle_config_arn: typing.Optional[builtins.str] = None,
        code_repository: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository", typing.Dict[builtins.str, typing.Any]]]]] = None,
        custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage", typing.Dict[builtins.str, typing.Any]]]]] = None,
        default_resource_spec: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec", typing.Dict[builtins.str, typing.Any]]] = None,
        emr_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings", typing.Dict[builtins.str, typing.Any]]] = None,
        lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param app_lifecycle_management: app_lifecycle_management block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_lifecycle_management SagemakerUserProfile#app_lifecycle_management}
        :param built_in_lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#built_in_lifecycle_config_arn SagemakerUserProfile#built_in_lifecycle_config_arn}.
        :param code_repository: code_repository block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#code_repository SagemakerUserProfile#code_repository}
        :param custom_image: custom_image block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        :param emr_settings: emr_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#emr_settings SagemakerUserProfile#emr_settings}
        :param lifecycle_config_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.
        '''
        if isinstance(app_lifecycle_management, dict):
            app_lifecycle_management = SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement(**app_lifecycle_management)
        if isinstance(default_resource_spec, dict):
            default_resource_spec = SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec(**default_resource_spec)
        if isinstance(emr_settings, dict):
            emr_settings = SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings(**emr_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8297e636f159ca637453a72e6a00620b4d70c0118debb3a01909dc2796b34506)
            check_type(argname="argument app_lifecycle_management", value=app_lifecycle_management, expected_type=type_hints["app_lifecycle_management"])
            check_type(argname="argument built_in_lifecycle_config_arn", value=built_in_lifecycle_config_arn, expected_type=type_hints["built_in_lifecycle_config_arn"])
            check_type(argname="argument code_repository", value=code_repository, expected_type=type_hints["code_repository"])
            check_type(argname="argument custom_image", value=custom_image, expected_type=type_hints["custom_image"])
            check_type(argname="argument default_resource_spec", value=default_resource_spec, expected_type=type_hints["default_resource_spec"])
            check_type(argname="argument emr_settings", value=emr_settings, expected_type=type_hints["emr_settings"])
            check_type(argname="argument lifecycle_config_arns", value=lifecycle_config_arns, expected_type=type_hints["lifecycle_config_arns"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if app_lifecycle_management is not None:
            self._values["app_lifecycle_management"] = app_lifecycle_management
        if built_in_lifecycle_config_arn is not None:
            self._values["built_in_lifecycle_config_arn"] = built_in_lifecycle_config_arn
        if code_repository is not None:
            self._values["code_repository"] = code_repository
        if custom_image is not None:
            self._values["custom_image"] = custom_image
        if default_resource_spec is not None:
            self._values["default_resource_spec"] = default_resource_spec
        if emr_settings is not None:
            self._values["emr_settings"] = emr_settings
        if lifecycle_config_arns is not None:
            self._values["lifecycle_config_arns"] = lifecycle_config_arns

    @builtins.property
    def app_lifecycle_management(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement"]:
        '''app_lifecycle_management block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_lifecycle_management SagemakerUserProfile#app_lifecycle_management}
        '''
        result = self._values.get("app_lifecycle_management")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement"], result)

    @builtins.property
    def built_in_lifecycle_config_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#built_in_lifecycle_config_arn SagemakerUserProfile#built_in_lifecycle_config_arn}.'''
        result = self._values.get("built_in_lifecycle_config_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def code_repository(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository"]]]:
        '''code_repository block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#code_repository SagemakerUserProfile#code_repository}
        '''
        result = self._values.get("code_repository")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository"]]], result)

    @builtins.property
    def custom_image(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage"]]]:
        '''custom_image block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
        '''
        result = self._values.get("custom_image")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage"]]], result)

    @builtins.property
    def default_resource_spec(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec"]:
        '''default_resource_spec block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        '''
        result = self._values.get("default_resource_spec")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec"], result)

    @builtins.property
    def emr_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings"]:
        '''emr_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#emr_settings SagemakerUserProfile#emr_settings}
        '''
        result = self._values.get("emr_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings"], result)

    @builtins.property
    def lifecycle_config_arns(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.'''
        result = self._values.get("lifecycle_config_arns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsJupyterLabAppSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement",
    jsii_struct_bases=[],
    name_mapping={"idle_settings": "idleSettings"},
)
class SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement:
    def __init__(
        self,
        *,
        idle_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param idle_settings: idle_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_settings SagemakerUserProfile#idle_settings}
        '''
        if isinstance(idle_settings, dict):
            idle_settings = SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings(**idle_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__931ac60ec5eea47c94b953921f6f012c071ff4fea1d7130a5be8a29d943ee885)
            check_type(argname="argument idle_settings", value=idle_settings, expected_type=type_hints["idle_settings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if idle_settings is not None:
            self._values["idle_settings"] = idle_settings

    @builtins.property
    def idle_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings"]:
        '''idle_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_settings SagemakerUserProfile#idle_settings}
        '''
        result = self._values.get("idle_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings",
    jsii_struct_bases=[],
    name_mapping={
        "idle_timeout_in_minutes": "idleTimeoutInMinutes",
        "lifecycle_management": "lifecycleManagement",
        "max_idle_timeout_in_minutes": "maxIdleTimeoutInMinutes",
        "min_idle_timeout_in_minutes": "minIdleTimeoutInMinutes",
    },
)
class SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings:
    def __init__(
        self,
        *,
        idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
        lifecycle_management: typing.Optional[builtins.str] = None,
        max_idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
        min_idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_timeout_in_minutes SagemakerUserProfile#idle_timeout_in_minutes}.
        :param lifecycle_management: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_management SagemakerUserProfile#lifecycle_management}.
        :param max_idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#max_idle_timeout_in_minutes SagemakerUserProfile#max_idle_timeout_in_minutes}.
        :param min_idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#min_idle_timeout_in_minutes SagemakerUserProfile#min_idle_timeout_in_minutes}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c776a15c84912fff7e8da536487ddfa4487205a0fe965c1132661df9a9853eee)
            check_type(argname="argument idle_timeout_in_minutes", value=idle_timeout_in_minutes, expected_type=type_hints["idle_timeout_in_minutes"])
            check_type(argname="argument lifecycle_management", value=lifecycle_management, expected_type=type_hints["lifecycle_management"])
            check_type(argname="argument max_idle_timeout_in_minutes", value=max_idle_timeout_in_minutes, expected_type=type_hints["max_idle_timeout_in_minutes"])
            check_type(argname="argument min_idle_timeout_in_minutes", value=min_idle_timeout_in_minutes, expected_type=type_hints["min_idle_timeout_in_minutes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if idle_timeout_in_minutes is not None:
            self._values["idle_timeout_in_minutes"] = idle_timeout_in_minutes
        if lifecycle_management is not None:
            self._values["lifecycle_management"] = lifecycle_management
        if max_idle_timeout_in_minutes is not None:
            self._values["max_idle_timeout_in_minutes"] = max_idle_timeout_in_minutes
        if min_idle_timeout_in_minutes is not None:
            self._values["min_idle_timeout_in_minutes"] = min_idle_timeout_in_minutes

    @builtins.property
    def idle_timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_timeout_in_minutes SagemakerUserProfile#idle_timeout_in_minutes}.'''
        result = self._values.get("idle_timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def lifecycle_management(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_management SagemakerUserProfile#lifecycle_management}.'''
        result = self._values.get("lifecycle_management")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def max_idle_timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#max_idle_timeout_in_minutes SagemakerUserProfile#max_idle_timeout_in_minutes}.'''
        result = self._values.get("max_idle_timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def min_idle_timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#min_idle_timeout_in_minutes SagemakerUserProfile#min_idle_timeout_in_minutes}.'''
        result = self._values.get("min_idle_timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7ac63b0a6f6ef20f00402c0294bb4e90867d4a7c659e5429d18d986fbedccdea)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetIdleTimeoutInMinutes")
    def reset_idle_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdleTimeoutInMinutes", []))

    @jsii.member(jsii_name="resetLifecycleManagement")
    def reset_lifecycle_management(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycleManagement", []))

    @jsii.member(jsii_name="resetMaxIdleTimeoutInMinutes")
    def reset_max_idle_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxIdleTimeoutInMinutes", []))

    @jsii.member(jsii_name="resetMinIdleTimeoutInMinutes")
    def reset_min_idle_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMinIdleTimeoutInMinutes", []))

    @builtins.property
    @jsii.member(jsii_name="idleTimeoutInMinutesInput")
    def idle_timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "idleTimeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleManagementInput")
    def lifecycle_management_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "lifecycleManagementInput"))

    @builtins.property
    @jsii.member(jsii_name="maxIdleTimeoutInMinutesInput")
    def max_idle_timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxIdleTimeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="minIdleTimeoutInMinutesInput")
    def min_idle_timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "minIdleTimeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="idleTimeoutInMinutes")
    def idle_timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "idleTimeoutInMinutes"))

    @idle_timeout_in_minutes.setter
    def idle_timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__60ca4ab247a286372377dbd78764d43689a9b8561237f3cd24f086266596b79c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "idleTimeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleManagement")
    def lifecycle_management(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleManagement"))

    @lifecycle_management.setter
    def lifecycle_management(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1ad7a500f02ba58921790ac3a0cfb640ab51f97b78263e90008446e3d9e4487b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleManagement", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxIdleTimeoutInMinutes")
    def max_idle_timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxIdleTimeoutInMinutes"))

    @max_idle_timeout_in_minutes.setter
    def max_idle_timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__88f482a26622b3901b1cc0379319734cefa6101ef21e145e302bcece57f1a5b1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxIdleTimeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="minIdleTimeoutInMinutes")
    def min_idle_timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "minIdleTimeoutInMinutes"))

    @min_idle_timeout_in_minutes.setter
    def min_idle_timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e56331f0fe1f31f73422f9fd3935acdbbacd97e0b2e75605d505a89a3ef0897d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "minIdleTimeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__682a77978f515a64b1116b31508226275d0d3f65bed88a7e55224dc903f402e7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3cb284d4e36e42c28d5e1e4c9a12dee5749362d996e6876e4f0d21c447c1fe09)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putIdleSettings")
    def put_idle_settings(
        self,
        *,
        idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
        lifecycle_management: typing.Optional[builtins.str] = None,
        max_idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
        min_idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_timeout_in_minutes SagemakerUserProfile#idle_timeout_in_minutes}.
        :param lifecycle_management: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_management SagemakerUserProfile#lifecycle_management}.
        :param max_idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#max_idle_timeout_in_minutes SagemakerUserProfile#max_idle_timeout_in_minutes}.
        :param min_idle_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#min_idle_timeout_in_minutes SagemakerUserProfile#min_idle_timeout_in_minutes}.
        '''
        value = SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings(
            idle_timeout_in_minutes=idle_timeout_in_minutes,
            lifecycle_management=lifecycle_management,
            max_idle_timeout_in_minutes=max_idle_timeout_in_minutes,
            min_idle_timeout_in_minutes=min_idle_timeout_in_minutes,
        )

        return typing.cast(None, jsii.invoke(self, "putIdleSettings", [value]))

    @jsii.member(jsii_name="resetIdleSettings")
    def reset_idle_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdleSettings", []))

    @builtins.property
    @jsii.member(jsii_name="idleSettings")
    def idle_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference, jsii.get(self, "idleSettings"))

    @builtins.property
    @jsii.member(jsii_name="idleSettingsInput")
    def idle_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings], jsii.get(self, "idleSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba04e92c11cd739c6eaed29ebbe2603dc89fab7b1c97d2247052063fafe61454)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository",
    jsii_struct_bases=[],
    name_mapping={"repository_url": "repositoryUrl"},
)
class SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository:
    def __init__(self, *, repository_url: builtins.str) -> None:
        '''
        :param repository_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#repository_url SagemakerUserProfile#repository_url}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f3b6d02c74b868efefba3899b90e3d5e07df58a6707bfe4d4272e244b0e959b)
            check_type(argname="argument repository_url", value=repository_url, expected_type=type_hints["repository_url"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "repository_url": repository_url,
        }

    @builtins.property
    def repository_url(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#repository_url SagemakerUserProfile#repository_url}.'''
        result = self._values.get("repository_url")
        assert result is not None, "Required property 'repository_url' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepositoryList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepositoryList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1928fbb2cb620976f86e2be38a893b71d0fbda8f4fd3034ec3ce17cc5409e107)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepositoryOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2b234ed4ca56493e7fae3a91aad082fc08f93541ce9b80bc852be0d77c1bf1b5)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepositoryOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4c150f065cd7707b99bf4b422587ee31b68162f25dda745730b0bf472efb58d5)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d167f3ea9e06337fc64d4448053069e130460697d9962c39d5d9b234ce22bb22)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b893394ad42a71cb6274dce8f4c38807e1d5a692f04816e23d292a29fd017aca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67b69f20666b57b85a1d19f41c315d7378d4c2b8bd3355b8ae68eae9518e320c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepositoryOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepositoryOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8897c9df9c6569eb63d4c2e22156daf693d58b468e33870843790dbf772be2b2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6c05e20e708b91701deeabd357ea4f752a1f19e2e1a722293eb3675f3f18f2c9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "repositoryUrl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0edbd5c7071d95f96f3332c677bf16f8438a5c94745aa883c29eea0a0685822)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage",
    jsii_struct_bases=[],
    name_mapping={
        "app_image_config_name": "appImageConfigName",
        "image_name": "imageName",
        "image_version_number": "imageVersionNumber",
    },
)
class SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage:
    def __init__(
        self,
        *,
        app_image_config_name: builtins.str,
        image_name: builtins.str,
        image_version_number: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param app_image_config_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_image_config_name SagemakerUserProfile#app_image_config_name}.
        :param image_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_name SagemakerUserProfile#image_name}.
        :param image_version_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_version_number SagemakerUserProfile#image_version_number}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b9c971c2c789fd1a890731df71978ebfd58777fb90aa6fedc47eef842847afbb)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_image_config_name SagemakerUserProfile#app_image_config_name}.'''
        result = self._values.get("app_image_config_name")
        assert result is not None, "Required property 'app_image_config_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def image_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_name SagemakerUserProfile#image_name}.'''
        result = self._values.get("image_name")
        assert result is not None, "Required property 'image_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def image_version_number(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_version_number SagemakerUserProfile#image_version_number}.'''
        result = self._values.get("image_version_number")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImageList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImageList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8b003a7ead68c10872f12cf73dc9f0e66b1d169b9689006caf27cb4bd157e7cb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImageOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5474a59eca791b8f3f58bc3aa7218598f865f8083b8f0da0d6b82e239283a7f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImageOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a0d16e4cab580914c76f8b3a7d84aa7f222f66d086701a511d8444434f051b60)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7c0deb8147f65958cc96a9e6655a365d644accc32f917bd1555d33f8698f7d3e)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4126537c4d8bc60b0845e467ffeb16607651eb8626514eefb4f05039fa736b1d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__165afb24a8731774c62f6f9d4d54bac0962922955bde716164d7d2f675852d1d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImageOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImageOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e10d091cbfbf47ab8da583502018bbf3991c41074b60434eea9e94871b89ad65)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3dca9ab0e38d5b6d940ff7af1aa287602a44195dc777319aa2ecf3d12c191dd6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "appImageConfigName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imageName")
    def image_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "imageName"))

    @image_name.setter
    def image_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5f34ab52f09b2a57bb3d791471fd00d24d926e67fb297bf09331129dad7e36d1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imageName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imageVersionNumber")
    def image_version_number(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "imageVersionNumber"))

    @image_version_number.setter
    def image_version_number(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__093ce623244b605c46352814d34423d50c3429f5196d48995c8b56ec5c79d50f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imageVersionNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f7812e0f9594df05b219fe402239f896ee767b625960621403d26555130dbb47)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec",
    jsii_struct_bases=[],
    name_mapping={
        "instance_type": "instanceType",
        "lifecycle_config_arn": "lifecycleConfigArn",
        "sagemaker_image_arn": "sagemakerImageArn",
        "sagemaker_image_version_alias": "sagemakerImageVersionAlias",
        "sagemaker_image_version_arn": "sagemakerImageVersionArn",
    },
)
class SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec:
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
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bf3b74b481c901fdf6e54cf5e074148f8a337e01393180ab9a3d1590e45310e0)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lifecycle_config_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.'''
        result = self._values.get("lifecycle_config_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.'''
        result = self._values.get("sagemaker_image_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_alias(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.'''
        result = self._values.get("sagemaker_image_version_alias")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.'''
        result = self._values.get("sagemaker_image_version_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpecOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpecOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__96951f8ba1078f0c58eed056dd4e5dbb3ddc0536ed2e6375ac08a950cb71d410)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0597fd409144d5509abef505f52d3b8cd34238bbe91c7a433a2dc7955f357ac1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArn")
    def lifecycle_config_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleConfigArn"))

    @lifecycle_config_arn.setter
    def lifecycle_config_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__30a7fb805a4946d207ecfbe92222c0d85233988b14c88dccdd562f748a9e989d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArn")
    def sagemaker_image_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageArn"))

    @sagemaker_image_arn.setter
    def sagemaker_image_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b90bb9a09a4545e26780ca1da9a7043c29235919980e1fef8f4cb4fd7e1e3c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAlias")
    def sagemaker_image_version_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionAlias"))

    @sagemaker_image_version_alias.setter
    def sagemaker_image_version_alias(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ecbc1ea3fbc72dbf0db6748cd3e159eefd34831c35234c9440443cf300d87b92)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionAlias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArn")
    def sagemaker_image_version_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionArn"))

    @sagemaker_image_version_arn.setter
    def sagemaker_image_version_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7bd2a6f7734608ad75ed27604354378023b08252da455bf97a4428e5b871c469)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__119e420702f29b31ffc29d0effc7557cb7d72cf672be5428548c4f8200cba1b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings",
    jsii_struct_bases=[],
    name_mapping={
        "assumable_role_arns": "assumableRoleArns",
        "execution_role_arns": "executionRoleArns",
    },
)
class SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings:
    def __init__(
        self,
        *,
        assumable_role_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
        execution_role_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param assumable_role_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#assumable_role_arns SagemakerUserProfile#assumable_role_arns}.
        :param execution_role_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#execution_role_arns SagemakerUserProfile#execution_role_arns}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__73c4e569a434e9dda586ab0338de22e36730e97c9c836e463900f427928a4f71)
            check_type(argname="argument assumable_role_arns", value=assumable_role_arns, expected_type=type_hints["assumable_role_arns"])
            check_type(argname="argument execution_role_arns", value=execution_role_arns, expected_type=type_hints["execution_role_arns"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if assumable_role_arns is not None:
            self._values["assumable_role_arns"] = assumable_role_arns
        if execution_role_arns is not None:
            self._values["execution_role_arns"] = execution_role_arns

    @builtins.property
    def assumable_role_arns(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#assumable_role_arns SagemakerUserProfile#assumable_role_arns}.'''
        result = self._values.get("assumable_role_arns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def execution_role_arns(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#execution_role_arns SagemakerUserProfile#execution_role_arns}.'''
        result = self._values.get("execution_role_arns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4c16bcd4aa5e8a8ced2f559b108e600b5f7ac779d86b8acaf5d264074dc49def)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAssumableRoleArns")
    def reset_assumable_role_arns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAssumableRoleArns", []))

    @jsii.member(jsii_name="resetExecutionRoleArns")
    def reset_execution_role_arns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExecutionRoleArns", []))

    @builtins.property
    @jsii.member(jsii_name="assumableRoleArnsInput")
    def assumable_role_arns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "assumableRoleArnsInput"))

    @builtins.property
    @jsii.member(jsii_name="executionRoleArnsInput")
    def execution_role_arns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "executionRoleArnsInput"))

    @builtins.property
    @jsii.member(jsii_name="assumableRoleArns")
    def assumable_role_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "assumableRoleArns"))

    @assumable_role_arns.setter
    def assumable_role_arns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d5bd6178fff00da65fa44da96565be1b89c9f61955571be36317b97b58500ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "assumableRoleArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="executionRoleArns")
    def execution_role_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "executionRoleArns"))

    @execution_role_arns.setter
    def execution_role_arns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ae85365aae23aebfc7e5360236105f340e3f7d9391e55e77837b5c3289bdfc01)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "executionRoleArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b4c9a05d2f795e021d2c718ebb3245dd127c2a17a4def75e166e94cd2a5d26dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsJupyterLabAppSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__975f2c9559ddca53c487f24480526b786698430fc801fb3fc906f154c3ced97f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putAppLifecycleManagement")
    def put_app_lifecycle_management(
        self,
        *,
        idle_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param idle_settings: idle_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_settings SagemakerUserProfile#idle_settings}
        '''
        value = SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement(
            idle_settings=idle_settings
        )

        return typing.cast(None, jsii.invoke(self, "putAppLifecycleManagement", [value]))

    @jsii.member(jsii_name="putCodeRepository")
    def put_code_repository(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a7475f7b80ec5584135bbe3d27ea74af3800320ee13eca1924d622860a1fc6d2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCodeRepository", [value]))

    @jsii.member(jsii_name="putCustomImage")
    def put_custom_image(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9329a9ff3435f3575189ab5ba2244b6dc528446af75f3240bd4b25e2658fed11)
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
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.
        '''
        value = SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec(
            instance_type=instance_type,
            lifecycle_config_arn=lifecycle_config_arn,
            sagemaker_image_arn=sagemaker_image_arn,
            sagemaker_image_version_alias=sagemaker_image_version_alias,
            sagemaker_image_version_arn=sagemaker_image_version_arn,
        )

        return typing.cast(None, jsii.invoke(self, "putDefaultResourceSpec", [value]))

    @jsii.member(jsii_name="putEmrSettings")
    def put_emr_settings(
        self,
        *,
        assumable_role_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
        execution_role_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param assumable_role_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#assumable_role_arns SagemakerUserProfile#assumable_role_arns}.
        :param execution_role_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#execution_role_arns SagemakerUserProfile#execution_role_arns}.
        '''
        value = SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings(
            assumable_role_arns=assumable_role_arns,
            execution_role_arns=execution_role_arns,
        )

        return typing.cast(None, jsii.invoke(self, "putEmrSettings", [value]))

    @jsii.member(jsii_name="resetAppLifecycleManagement")
    def reset_app_lifecycle_management(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAppLifecycleManagement", []))

    @jsii.member(jsii_name="resetBuiltInLifecycleConfigArn")
    def reset_built_in_lifecycle_config_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBuiltInLifecycleConfigArn", []))

    @jsii.member(jsii_name="resetCodeRepository")
    def reset_code_repository(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCodeRepository", []))

    @jsii.member(jsii_name="resetCustomImage")
    def reset_custom_image(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomImage", []))

    @jsii.member(jsii_name="resetDefaultResourceSpec")
    def reset_default_resource_spec(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultResourceSpec", []))

    @jsii.member(jsii_name="resetEmrSettings")
    def reset_emr_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEmrSettings", []))

    @jsii.member(jsii_name="resetLifecycleConfigArns")
    def reset_lifecycle_config_arns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycleConfigArns", []))

    @builtins.property
    @jsii.member(jsii_name="appLifecycleManagement")
    def app_lifecycle_management(
        self,
    ) -> SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference, jsii.get(self, "appLifecycleManagement"))

    @builtins.property
    @jsii.member(jsii_name="codeRepository")
    def code_repository(
        self,
    ) -> SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepositoryList:
        return typing.cast(SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepositoryList, jsii.get(self, "codeRepository"))

    @builtins.property
    @jsii.member(jsii_name="customImage")
    def custom_image(
        self,
    ) -> SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImageList:
        return typing.cast(SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImageList, jsii.get(self, "customImage"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpec")
    def default_resource_spec(
        self,
    ) -> SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpecOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpecOutputReference, jsii.get(self, "defaultResourceSpec"))

    @builtins.property
    @jsii.member(jsii_name="emrSettings")
    def emr_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettingsOutputReference, jsii.get(self, "emrSettings"))

    @builtins.property
    @jsii.member(jsii_name="appLifecycleManagementInput")
    def app_lifecycle_management_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement], jsii.get(self, "appLifecycleManagementInput"))

    @builtins.property
    @jsii.member(jsii_name="builtInLifecycleConfigArnInput")
    def built_in_lifecycle_config_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "builtInLifecycleConfigArnInput"))

    @builtins.property
    @jsii.member(jsii_name="codeRepositoryInput")
    def code_repository_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository]]], jsii.get(self, "codeRepositoryInput"))

    @builtins.property
    @jsii.member(jsii_name="customImageInput")
    def custom_image_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage]]], jsii.get(self, "customImageInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpecInput")
    def default_resource_spec_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec], jsii.get(self, "defaultResourceSpecInput"))

    @builtins.property
    @jsii.member(jsii_name="emrSettingsInput")
    def emr_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings], jsii.get(self, "emrSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArnsInput")
    def lifecycle_config_arns_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "lifecycleConfigArnsInput"))

    @builtins.property
    @jsii.member(jsii_name="builtInLifecycleConfigArn")
    def built_in_lifecycle_config_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "builtInLifecycleConfigArn"))

    @built_in_lifecycle_config_arn.setter
    def built_in_lifecycle_config_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__90dc16205e3c5f1b8cc126acaa896a8a66fcac242909b9a41378e3a16ba3664d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "builtInLifecycleConfigArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArns")
    def lifecycle_config_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "lifecycleConfigArns"))

    @lifecycle_config_arns.setter
    def lifecycle_config_arns(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a9f85556da372af98f8709dc28ca4da6342a0d9433db8c75e1e4f7ba44fa398)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ccc1eb5832d0fa1074fb819f4ac37ff008dc6e65ebd1db85f4d164b510db814a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterServerAppSettings",
    jsii_struct_bases=[],
    name_mapping={
        "code_repository": "codeRepository",
        "default_resource_spec": "defaultResourceSpec",
        "lifecycle_config_arns": "lifecycleConfigArns",
    },
)
class SagemakerUserProfileUserSettingsJupyterServerAppSettings:
    def __init__(
        self,
        *,
        code_repository: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository", typing.Dict[builtins.str, typing.Any]]]]] = None,
        default_resource_spec: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec", typing.Dict[builtins.str, typing.Any]]] = None,
        lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param code_repository: code_repository block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#code_repository SagemakerUserProfile#code_repository}
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        :param lifecycle_config_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.
        '''
        if isinstance(default_resource_spec, dict):
            default_resource_spec = SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec(**default_resource_spec)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04fcf7b5687bdfe532a8a064fca0e6906d3e302cfed15dee44db46ff212fa6f4)
            check_type(argname="argument code_repository", value=code_repository, expected_type=type_hints["code_repository"])
            check_type(argname="argument default_resource_spec", value=default_resource_spec, expected_type=type_hints["default_resource_spec"])
            check_type(argname="argument lifecycle_config_arns", value=lifecycle_config_arns, expected_type=type_hints["lifecycle_config_arns"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if code_repository is not None:
            self._values["code_repository"] = code_repository
        if default_resource_spec is not None:
            self._values["default_resource_spec"] = default_resource_spec
        if lifecycle_config_arns is not None:
            self._values["lifecycle_config_arns"] = lifecycle_config_arns

    @builtins.property
    def code_repository(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository"]]]:
        '''code_repository block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#code_repository SagemakerUserProfile#code_repository}
        '''
        result = self._values.get("code_repository")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository"]]], result)

    @builtins.property
    def default_resource_spec(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec"]:
        '''default_resource_spec block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        '''
        result = self._values.get("default_resource_spec")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec"], result)

    @builtins.property
    def lifecycle_config_arns(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.'''
        result = self._values.get("lifecycle_config_arns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsJupyterServerAppSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository",
    jsii_struct_bases=[],
    name_mapping={"repository_url": "repositoryUrl"},
)
class SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository:
    def __init__(self, *, repository_url: builtins.str) -> None:
        '''
        :param repository_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#repository_url SagemakerUserProfile#repository_url}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15aec08afdb643490a5d3adc86ab690923bd8dc5d0de509a0b506f908b28fb89)
            check_type(argname="argument repository_url", value=repository_url, expected_type=type_hints["repository_url"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "repository_url": repository_url,
        }

    @builtins.property
    def repository_url(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#repository_url SagemakerUserProfile#repository_url}.'''
        result = self._values.get("repository_url")
        assert result is not None, "Required property 'repository_url' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepositoryList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepositoryList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4e563758f5d09b0484f056aa2aff747b21211ce1a200cc5bcdbdd2c98ad8be65)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepositoryOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__50572d71de37e8c322cffc1d33aab92b6122442738db0cf94971f4248b0395f4)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepositoryOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d5db4b5512e74fabf118e17f8622cad42ec8a8868a1c1fade0700e565379894)
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
            type_hints = typing.get_type_hints(_typecheckingstub__8abeeb7863c8daa380a0cbc92b08d561a2bfe6a71a1ae42e758871fea10dae87)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a3762feedcb5e283dcdf784ebdf5ea19ea35c6ea3f36dba40edd7e1d9ae35f79)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3765f96c603f6488b0d4db0431f4f97daef18f61995843bdd7b2763a4264df18)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepositoryOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepositoryOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a0ed1b206c66fad8eb894d47c58536113e883392cf6b0668926577b3cce06037)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4868df7444601ccf15262cb7e4d14ac3099e912ce6bc8e71727c06960de7650f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "repositoryUrl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd287730ad069041a0dd48aac409169763267bcb4f57f4bae41adf69a1a8ab3e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec",
    jsii_struct_bases=[],
    name_mapping={
        "instance_type": "instanceType",
        "lifecycle_config_arn": "lifecycleConfigArn",
        "sagemaker_image_arn": "sagemakerImageArn",
        "sagemaker_image_version_alias": "sagemakerImageVersionAlias",
        "sagemaker_image_version_arn": "sagemakerImageVersionArn",
    },
)
class SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec:
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
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac8c7168539cae31994e1528bc892d22833a459587905ec742bab1c1e5fc310f)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lifecycle_config_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.'''
        result = self._values.get("lifecycle_config_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.'''
        result = self._values.get("sagemaker_image_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_alias(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.'''
        result = self._values.get("sagemaker_image_version_alias")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.'''
        result = self._values.get("sagemaker_image_version_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__68dac719f8098a672cc6b80891627ef3dff4548679a64a83218934fc3a70fba7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__73cd5601cc3bfa904b5eb21412967989f8df794170a6c0825ec32e1ffa93803d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArn")
    def lifecycle_config_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleConfigArn"))

    @lifecycle_config_arn.setter
    def lifecycle_config_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5ecf9d2adf8f81491458127074fdde5edb2ba300f4f9cbc22a95af3bd6e9a140)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArn")
    def sagemaker_image_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageArn"))

    @sagemaker_image_arn.setter
    def sagemaker_image_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f51d1563515d70f94344fee03b301fd5f312efbacedf4f76a340a86296e19ee8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAlias")
    def sagemaker_image_version_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionAlias"))

    @sagemaker_image_version_alias.setter
    def sagemaker_image_version_alias(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__abc49c5a743382cff815ceb12a3075a63f3acd2b8792434c8bb0ef6ee98ef421)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionAlias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArn")
    def sagemaker_image_version_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionArn"))

    @sagemaker_image_version_arn.setter
    def sagemaker_image_version_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e8af36d100fa85c26642e6a743b2b0359b9490bf451b1310ee7c615e8e0153d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d586dc6ebbc9f8d5ccd4e59a54ca60d2f90fedfc1d934f0f97d868cdf0af5c7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsJupyterServerAppSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterServerAppSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__937ac3e1ba3ddb39ec99f6d4e92effa287defcb0f00b92153c64f9ac3dd4a61f)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCodeRepository")
    def put_code_repository(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd69df47f582fc37a000b8188395c7f18b35d88eb0b60c7522ef9c2b9e02e406)
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
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.
        '''
        value = SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec(
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

    @jsii.member(jsii_name="resetDefaultResourceSpec")
    def reset_default_resource_spec(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultResourceSpec", []))

    @jsii.member(jsii_name="resetLifecycleConfigArns")
    def reset_lifecycle_config_arns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycleConfigArns", []))

    @builtins.property
    @jsii.member(jsii_name="codeRepository")
    def code_repository(
        self,
    ) -> SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepositoryList:
        return typing.cast(SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepositoryList, jsii.get(self, "codeRepository"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpec")
    def default_resource_spec(
        self,
    ) -> SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference, jsii.get(self, "defaultResourceSpec"))

    @builtins.property
    @jsii.member(jsii_name="codeRepositoryInput")
    def code_repository_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository]]], jsii.get(self, "codeRepositoryInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpecInput")
    def default_resource_spec_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec], jsii.get(self, "defaultResourceSpecInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__c25c999871628efd294de82ea81ccea9abecce9d907f6b5369abbe21b97dae4e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterServerAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterServerAppSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsJupyterServerAppSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__97a3aa76918f1ed3df7a15dc17d04538f5bbbcfb2acbce0e0253eac72158ff3b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsKernelGatewayAppSettings",
    jsii_struct_bases=[],
    name_mapping={
        "custom_image": "customImage",
        "default_resource_spec": "defaultResourceSpec",
        "lifecycle_config_arns": "lifecycleConfigArns",
    },
)
class SagemakerUserProfileUserSettingsKernelGatewayAppSettings:
    def __init__(
        self,
        *,
        custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage", typing.Dict[builtins.str, typing.Any]]]]] = None,
        default_resource_spec: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec", typing.Dict[builtins.str, typing.Any]]] = None,
        lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param custom_image: custom_image block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        :param lifecycle_config_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.
        '''
        if isinstance(default_resource_spec, dict):
            default_resource_spec = SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec(**default_resource_spec)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__346ca577f5fb3b958a7dab690897b6d3acb033cf8d0048b0827f793fa8bcb47d)
            check_type(argname="argument custom_image", value=custom_image, expected_type=type_hints["custom_image"])
            check_type(argname="argument default_resource_spec", value=default_resource_spec, expected_type=type_hints["default_resource_spec"])
            check_type(argname="argument lifecycle_config_arns", value=lifecycle_config_arns, expected_type=type_hints["lifecycle_config_arns"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_image is not None:
            self._values["custom_image"] = custom_image
        if default_resource_spec is not None:
            self._values["default_resource_spec"] = default_resource_spec
        if lifecycle_config_arns is not None:
            self._values["lifecycle_config_arns"] = lifecycle_config_arns

    @builtins.property
    def custom_image(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage"]]]:
        '''custom_image block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
        '''
        result = self._values.get("custom_image")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage"]]], result)

    @builtins.property
    def default_resource_spec(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec"]:
        '''default_resource_spec block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        '''
        result = self._values.get("default_resource_spec")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec"], result)

    @builtins.property
    def lifecycle_config_arns(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.'''
        result = self._values.get("lifecycle_config_arns")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsKernelGatewayAppSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage",
    jsii_struct_bases=[],
    name_mapping={
        "app_image_config_name": "appImageConfigName",
        "image_name": "imageName",
        "image_version_number": "imageVersionNumber",
    },
)
class SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage:
    def __init__(
        self,
        *,
        app_image_config_name: builtins.str,
        image_name: builtins.str,
        image_version_number: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param app_image_config_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_image_config_name SagemakerUserProfile#app_image_config_name}.
        :param image_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_name SagemakerUserProfile#image_name}.
        :param image_version_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_version_number SagemakerUserProfile#image_version_number}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ba94295c8afeace5e45e4c2d3d849316f40dca1c9eb2d77492b8867bda645ffe)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_image_config_name SagemakerUserProfile#app_image_config_name}.'''
        result = self._values.get("app_image_config_name")
        assert result is not None, "Required property 'app_image_config_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def image_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_name SagemakerUserProfile#image_name}.'''
        result = self._values.get("image_name")
        assert result is not None, "Required property 'image_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def image_version_number(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_version_number SagemakerUserProfile#image_version_number}.'''
        result = self._values.get("image_version_number")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImageList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImageList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__228bd0b6b9395c15ebef4731ef962febf92fd3b733e56ddbe5f5635cda9f01a6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImageOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a7e9b85453f6a196c20084557ee9df6c7cee619be469a28e5b306673af411b4f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImageOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b679d9e84d10515c04235088890fcebec58300182b1a8ca1a4f2db34568cfe4d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__7ba1f5730df4755f3cc699d03670b2229818fdf82874dc35dd8370a6722c609a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__b31a07c3e335505cea00bcd36ae163b07e4a93a5920c3c2dad072ca6cddd92bf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bbdee080a48812a455fa0a2e374026b7e3a3a2e7234ff71069d372c1038a6fc1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImageOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImageOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__76c1bdf133aeeeb394b3d611947334076b4f0a513468d39c52904d8b8ad7c206)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c61cb794f464815dc32f5a220de2fa3639d240bcf995e32a7ec2974b94eac099)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "appImageConfigName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imageName")
    def image_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "imageName"))

    @image_name.setter
    def image_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__122c997d837e6d10228c7c702850da9aa90adfff33ea464b9329f85098961865)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imageName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imageVersionNumber")
    def image_version_number(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "imageVersionNumber"))

    @image_version_number.setter
    def image_version_number(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dc83a303d6e65c230c693e4d000970fff4420d960a9d3e6ef429237f85dc6bcb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imageVersionNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__efd715ac7ef21d63421454edd6ef3a4bb811badf05d5889a7406433485bbd4c4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec",
    jsii_struct_bases=[],
    name_mapping={
        "instance_type": "instanceType",
        "lifecycle_config_arn": "lifecycleConfigArn",
        "sagemaker_image_arn": "sagemakerImageArn",
        "sagemaker_image_version_alias": "sagemakerImageVersionAlias",
        "sagemaker_image_version_arn": "sagemakerImageVersionArn",
    },
)
class SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec:
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
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5cf658faaa3c5ae2b7c61a5944ea284c77b49a322ae658dfe40d2803e93a0fc1)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lifecycle_config_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.'''
        result = self._values.get("lifecycle_config_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.'''
        result = self._values.get("sagemaker_image_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_alias(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.'''
        result = self._values.get("sagemaker_image_version_alias")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.'''
        result = self._values.get("sagemaker_image_version_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpecOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpecOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4362b8fa84107e5028acee923367b89350434eefebdbfb972ffdc27ee3068a96)
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
            type_hints = typing.get_type_hints(_typecheckingstub__dff61fd52136fda177c5e3b437998c1ff3b2451051c2d6fe3ca578e89cb85795)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArn")
    def lifecycle_config_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleConfigArn"))

    @lifecycle_config_arn.setter
    def lifecycle_config_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c18c6ec3ca84fe6a03a764a2335b7be0ad27faf5dd2496b2d6523bf81346379)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArn")
    def sagemaker_image_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageArn"))

    @sagemaker_image_arn.setter
    def sagemaker_image_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__19c4eb45e2d2e3844a5052861ff096742055e8020dddcee3a224096a232eefc4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAlias")
    def sagemaker_image_version_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionAlias"))

    @sagemaker_image_version_alias.setter
    def sagemaker_image_version_alias(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4e33a3ab81da18efe27901e8897423f2088c4ef88a415d9935df7d2f84426c39)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionAlias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArn")
    def sagemaker_image_version_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionArn"))

    @sagemaker_image_version_arn.setter
    def sagemaker_image_version_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ed53ac962a92899eb98184a2e1c24b979089a6bd461d40d06f1f8d5436d83610)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__606e80f16417061c02469c300bfe306250da2d412f246b4c2533feb03c3ca421)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsKernelGatewayAppSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsKernelGatewayAppSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f94329f77f18be7b5602e4ac1fc47e1edb2f29b208ef663f8c0d88ff0ad231f0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomImage")
    def put_custom_image(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e765526e93b6120844d2b24b0c782b5788bea2ee156fae755cfd809f4606f339)
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
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.
        '''
        value = SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec(
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

    @jsii.member(jsii_name="resetDefaultResourceSpec")
    def reset_default_resource_spec(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultResourceSpec", []))

    @jsii.member(jsii_name="resetLifecycleConfigArns")
    def reset_lifecycle_config_arns(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLifecycleConfigArns", []))

    @builtins.property
    @jsii.member(jsii_name="customImage")
    def custom_image(
        self,
    ) -> SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImageList:
        return typing.cast(SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImageList, jsii.get(self, "customImage"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpec")
    def default_resource_spec(
        self,
    ) -> SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpecOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpecOutputReference, jsii.get(self, "defaultResourceSpec"))

    @builtins.property
    @jsii.member(jsii_name="customImageInput")
    def custom_image_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage]]], jsii.get(self, "customImageInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpecInput")
    def default_resource_spec_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec], jsii.get(self, "defaultResourceSpecInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__5540576825666600376d746abb42b3f3e6088e86508b43b3539690f536c92aa4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArns", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsKernelGatewayAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsKernelGatewayAppSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsKernelGatewayAppSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4eb0a8fefc73ed9d1684d5a617788f610149e0cf1aa69338ec9b3a9474c84919)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e0fdf84024a2e8f6fcc9a18f2c7a3ed1612d95ee2d9ae078de089cff8fd72176)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCanvasAppSettings")
    def put_canvas_app_settings(
        self,
        *,
        direct_deploy_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings, typing.Dict[builtins.str, typing.Any]]] = None,
        emr_serverless_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings, typing.Dict[builtins.str, typing.Any]]] = None,
        generative_ai_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings, typing.Dict[builtins.str, typing.Any]]] = None,
        identity_provider_oauth_settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings, typing.Dict[builtins.str, typing.Any]]]]] = None,
        kendra_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings, typing.Dict[builtins.str, typing.Any]]] = None,
        model_register_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings, typing.Dict[builtins.str, typing.Any]]] = None,
        time_series_forecasting_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings, typing.Dict[builtins.str, typing.Any]]] = None,
        workspace_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param direct_deploy_settings: direct_deploy_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#direct_deploy_settings SagemakerUserProfile#direct_deploy_settings}
        :param emr_serverless_settings: emr_serverless_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#emr_serverless_settings SagemakerUserProfile#emr_serverless_settings}
        :param generative_ai_settings: generative_ai_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#generative_ai_settings SagemakerUserProfile#generative_ai_settings}
        :param identity_provider_oauth_settings: identity_provider_oauth_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#identity_provider_oauth_settings SagemakerUserProfile#identity_provider_oauth_settings}
        :param kendra_settings: kendra_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#kendra_settings SagemakerUserProfile#kendra_settings}
        :param model_register_settings: model_register_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#model_register_settings SagemakerUserProfile#model_register_settings}
        :param time_series_forecasting_settings: time_series_forecasting_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#time_series_forecasting_settings SagemakerUserProfile#time_series_forecasting_settings}
        :param workspace_settings: workspace_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#workspace_settings SagemakerUserProfile#workspace_settings}
        '''
        value = SagemakerUserProfileUserSettingsCanvasAppSettings(
            direct_deploy_settings=direct_deploy_settings,
            emr_serverless_settings=emr_serverless_settings,
            generative_ai_settings=generative_ai_settings,
            identity_provider_oauth_settings=identity_provider_oauth_settings,
            kendra_settings=kendra_settings,
            model_register_settings=model_register_settings,
            time_series_forecasting_settings=time_series_forecasting_settings,
            workspace_settings=workspace_settings,
        )

        return typing.cast(None, jsii.invoke(self, "putCanvasAppSettings", [value]))

    @jsii.member(jsii_name="putCodeEditorAppSettings")
    def put_code_editor_app_settings(
        self,
        *,
        app_lifecycle_management: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement, typing.Dict[builtins.str, typing.Any]]] = None,
        built_in_lifecycle_config_arn: typing.Optional[builtins.str] = None,
        custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]]] = None,
        default_resource_spec: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]]] = None,
        lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param app_lifecycle_management: app_lifecycle_management block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_lifecycle_management SagemakerUserProfile#app_lifecycle_management}
        :param built_in_lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#built_in_lifecycle_config_arn SagemakerUserProfile#built_in_lifecycle_config_arn}.
        :param custom_image: custom_image block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        :param lifecycle_config_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.
        '''
        value = SagemakerUserProfileUserSettingsCodeEditorAppSettings(
            app_lifecycle_management=app_lifecycle_management,
            built_in_lifecycle_config_arn=built_in_lifecycle_config_arn,
            custom_image=custom_image,
            default_resource_spec=default_resource_spec,
            lifecycle_config_arns=lifecycle_config_arns,
        )

        return typing.cast(None, jsii.invoke(self, "putCodeEditorAppSettings", [value]))

    @jsii.member(jsii_name="putCustomFileSystemConfig")
    def put_custom_file_system_config(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCustomFileSystemConfig, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59f352c6c01c99db54557ce98222230e4c30e12baf1fdbd57057aac917fffdda)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCustomFileSystemConfig", [value]))

    @jsii.member(jsii_name="putCustomPosixUserConfig")
    def put_custom_posix_user_config(
        self,
        *,
        gid: jsii.Number,
        uid: jsii.Number,
    ) -> None:
        '''
        :param gid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#gid SagemakerUserProfile#gid}.
        :param uid: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#uid SagemakerUserProfile#uid}.
        '''
        value = SagemakerUserProfileUserSettingsCustomPosixUserConfig(gid=gid, uid=uid)

        return typing.cast(None, jsii.invoke(self, "putCustomPosixUserConfig", [value]))

    @jsii.member(jsii_name="putJupyterLabAppSettings")
    def put_jupyter_lab_app_settings(
        self,
        *,
        app_lifecycle_management: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement, typing.Dict[builtins.str, typing.Any]]] = None,
        built_in_lifecycle_config_arn: typing.Optional[builtins.str] = None,
        code_repository: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]]] = None,
        custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]]] = None,
        default_resource_spec: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]]] = None,
        emr_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings, typing.Dict[builtins.str, typing.Any]]] = None,
        lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param app_lifecycle_management: app_lifecycle_management block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_lifecycle_management SagemakerUserProfile#app_lifecycle_management}
        :param built_in_lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#built_in_lifecycle_config_arn SagemakerUserProfile#built_in_lifecycle_config_arn}.
        :param code_repository: code_repository block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#code_repository SagemakerUserProfile#code_repository}
        :param custom_image: custom_image block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        :param emr_settings: emr_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#emr_settings SagemakerUserProfile#emr_settings}
        :param lifecycle_config_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.
        '''
        value = SagemakerUserProfileUserSettingsJupyterLabAppSettings(
            app_lifecycle_management=app_lifecycle_management,
            built_in_lifecycle_config_arn=built_in_lifecycle_config_arn,
            code_repository=code_repository,
            custom_image=custom_image,
            default_resource_spec=default_resource_spec,
            emr_settings=emr_settings,
            lifecycle_config_arns=lifecycle_config_arns,
        )

        return typing.cast(None, jsii.invoke(self, "putJupyterLabAppSettings", [value]))

    @jsii.member(jsii_name="putJupyterServerAppSettings")
    def put_jupyter_server_app_settings(
        self,
        *,
        code_repository: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]]] = None,
        default_resource_spec: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]]] = None,
        lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param code_repository: code_repository block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#code_repository SagemakerUserProfile#code_repository}
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        :param lifecycle_config_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.
        '''
        value = SagemakerUserProfileUserSettingsJupyterServerAppSettings(
            code_repository=code_repository,
            default_resource_spec=default_resource_spec,
            lifecycle_config_arns=lifecycle_config_arns,
        )

        return typing.cast(None, jsii.invoke(self, "putJupyterServerAppSettings", [value]))

    @jsii.member(jsii_name="putKernelGatewayAppSettings")
    def put_kernel_gateway_app_settings(
        self,
        *,
        custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]]] = None,
        default_resource_spec: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]]] = None,
        lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param custom_image: custom_image block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        :param lifecycle_config_arns: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arns SagemakerUserProfile#lifecycle_config_arns}.
        '''
        value = SagemakerUserProfileUserSettingsKernelGatewayAppSettings(
            custom_image=custom_image,
            default_resource_spec=default_resource_spec,
            lifecycle_config_arns=lifecycle_config_arns,
        )

        return typing.cast(None, jsii.invoke(self, "putKernelGatewayAppSettings", [value]))

    @jsii.member(jsii_name="putRSessionAppSettings")
    def put_r_session_app_settings(
        self,
        *,
        custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage", typing.Dict[builtins.str, typing.Any]]]]] = None,
        default_resource_spec: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_image: custom_image block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        '''
        value = SagemakerUserProfileUserSettingsRSessionAppSettings(
            custom_image=custom_image, default_resource_spec=default_resource_spec
        )

        return typing.cast(None, jsii.invoke(self, "putRSessionAppSettings", [value]))

    @jsii.member(jsii_name="putRStudioServerProAppSettings")
    def put_r_studio_server_pro_app_settings(
        self,
        *,
        access_status: typing.Optional[builtins.str] = None,
        user_group: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param access_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#access_status SagemakerUserProfile#access_status}.
        :param user_group: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#user_group SagemakerUserProfile#user_group}.
        '''
        value = SagemakerUserProfileUserSettingsRStudioServerProAppSettings(
            access_status=access_status, user_group=user_group
        )

        return typing.cast(None, jsii.invoke(self, "putRStudioServerProAppSettings", [value]))

    @jsii.member(jsii_name="putSharingSettings")
    def put_sharing_settings(
        self,
        *,
        notebook_output_option: typing.Optional[builtins.str] = None,
        s3_kms_key_id: typing.Optional[builtins.str] = None,
        s3_output_path: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param notebook_output_option: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#notebook_output_option SagemakerUserProfile#notebook_output_option}.
        :param s3_kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_kms_key_id SagemakerUserProfile#s3_kms_key_id}.
        :param s3_output_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_output_path SagemakerUserProfile#s3_output_path}.
        '''
        value = SagemakerUserProfileUserSettingsSharingSettings(
            notebook_output_option=notebook_output_option,
            s3_kms_key_id=s3_kms_key_id,
            s3_output_path=s3_output_path,
        )

        return typing.cast(None, jsii.invoke(self, "putSharingSettings", [value]))

    @jsii.member(jsii_name="putSpaceStorageSettings")
    def put_space_storage_settings(
        self,
        *,
        default_ebs_storage_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param default_ebs_storage_settings: default_ebs_storage_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_ebs_storage_settings SagemakerUserProfile#default_ebs_storage_settings}
        '''
        value = SagemakerUserProfileUserSettingsSpaceStorageSettings(
            default_ebs_storage_settings=default_ebs_storage_settings
        )

        return typing.cast(None, jsii.invoke(self, "putSpaceStorageSettings", [value]))

    @jsii.member(jsii_name="putStudioWebPortalSettings")
    def put_studio_web_portal_settings(
        self,
        *,
        hidden_app_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        hidden_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        hidden_ml_tools: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param hidden_app_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_app_types SagemakerUserProfile#hidden_app_types}.
        :param hidden_instance_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_instance_types SagemakerUserProfile#hidden_instance_types}.
        :param hidden_ml_tools: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_ml_tools SagemakerUserProfile#hidden_ml_tools}.
        '''
        value = SagemakerUserProfileUserSettingsStudioWebPortalSettings(
            hidden_app_types=hidden_app_types,
            hidden_instance_types=hidden_instance_types,
            hidden_ml_tools=hidden_ml_tools,
        )

        return typing.cast(None, jsii.invoke(self, "putStudioWebPortalSettings", [value]))

    @jsii.member(jsii_name="putTensorBoardAppSettings")
    def put_tensor_board_app_settings(
        self,
        *,
        default_resource_spec: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        '''
        value = SagemakerUserProfileUserSettingsTensorBoardAppSettings(
            default_resource_spec=default_resource_spec
        )

        return typing.cast(None, jsii.invoke(self, "putTensorBoardAppSettings", [value]))

    @jsii.member(jsii_name="resetAutoMountHomeEfs")
    def reset_auto_mount_home_efs(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAutoMountHomeEfs", []))

    @jsii.member(jsii_name="resetCanvasAppSettings")
    def reset_canvas_app_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCanvasAppSettings", []))

    @jsii.member(jsii_name="resetCodeEditorAppSettings")
    def reset_code_editor_app_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCodeEditorAppSettings", []))

    @jsii.member(jsii_name="resetCustomFileSystemConfig")
    def reset_custom_file_system_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomFileSystemConfig", []))

    @jsii.member(jsii_name="resetCustomPosixUserConfig")
    def reset_custom_posix_user_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomPosixUserConfig", []))

    @jsii.member(jsii_name="resetDefaultLandingUri")
    def reset_default_landing_uri(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultLandingUri", []))

    @jsii.member(jsii_name="resetJupyterLabAppSettings")
    def reset_jupyter_lab_app_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetJupyterLabAppSettings", []))

    @jsii.member(jsii_name="resetJupyterServerAppSettings")
    def reset_jupyter_server_app_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetJupyterServerAppSettings", []))

    @jsii.member(jsii_name="resetKernelGatewayAppSettings")
    def reset_kernel_gateway_app_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKernelGatewayAppSettings", []))

    @jsii.member(jsii_name="resetRSessionAppSettings")
    def reset_r_session_app_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRSessionAppSettings", []))

    @jsii.member(jsii_name="resetRStudioServerProAppSettings")
    def reset_r_studio_server_pro_app_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRStudioServerProAppSettings", []))

    @jsii.member(jsii_name="resetSecurityGroups")
    def reset_security_groups(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityGroups", []))

    @jsii.member(jsii_name="resetSharingSettings")
    def reset_sharing_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSharingSettings", []))

    @jsii.member(jsii_name="resetSpaceStorageSettings")
    def reset_space_storage_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSpaceStorageSettings", []))

    @jsii.member(jsii_name="resetStudioWebPortal")
    def reset_studio_web_portal(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStudioWebPortal", []))

    @jsii.member(jsii_name="resetStudioWebPortalSettings")
    def reset_studio_web_portal_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStudioWebPortalSettings", []))

    @jsii.member(jsii_name="resetTensorBoardAppSettings")
    def reset_tensor_board_app_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTensorBoardAppSettings", []))

    @builtins.property
    @jsii.member(jsii_name="canvasAppSettings")
    def canvas_app_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsCanvasAppSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsCanvasAppSettingsOutputReference, jsii.get(self, "canvasAppSettings"))

    @builtins.property
    @jsii.member(jsii_name="codeEditorAppSettings")
    def code_editor_app_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsCodeEditorAppSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsCodeEditorAppSettingsOutputReference, jsii.get(self, "codeEditorAppSettings"))

    @builtins.property
    @jsii.member(jsii_name="customFileSystemConfig")
    def custom_file_system_config(
        self,
    ) -> SagemakerUserProfileUserSettingsCustomFileSystemConfigList:
        return typing.cast(SagemakerUserProfileUserSettingsCustomFileSystemConfigList, jsii.get(self, "customFileSystemConfig"))

    @builtins.property
    @jsii.member(jsii_name="customPosixUserConfig")
    def custom_posix_user_config(
        self,
    ) -> SagemakerUserProfileUserSettingsCustomPosixUserConfigOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsCustomPosixUserConfigOutputReference, jsii.get(self, "customPosixUserConfig"))

    @builtins.property
    @jsii.member(jsii_name="jupyterLabAppSettings")
    def jupyter_lab_app_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsJupyterLabAppSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsJupyterLabAppSettingsOutputReference, jsii.get(self, "jupyterLabAppSettings"))

    @builtins.property
    @jsii.member(jsii_name="jupyterServerAppSettings")
    def jupyter_server_app_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsJupyterServerAppSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsJupyterServerAppSettingsOutputReference, jsii.get(self, "jupyterServerAppSettings"))

    @builtins.property
    @jsii.member(jsii_name="kernelGatewayAppSettings")
    def kernel_gateway_app_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsKernelGatewayAppSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsKernelGatewayAppSettingsOutputReference, jsii.get(self, "kernelGatewayAppSettings"))

    @builtins.property
    @jsii.member(jsii_name="rSessionAppSettings")
    def r_session_app_settings(
        self,
    ) -> "SagemakerUserProfileUserSettingsRSessionAppSettingsOutputReference":
        return typing.cast("SagemakerUserProfileUserSettingsRSessionAppSettingsOutputReference", jsii.get(self, "rSessionAppSettings"))

    @builtins.property
    @jsii.member(jsii_name="rStudioServerProAppSettings")
    def r_studio_server_pro_app_settings(
        self,
    ) -> "SagemakerUserProfileUserSettingsRStudioServerProAppSettingsOutputReference":
        return typing.cast("SagemakerUserProfileUserSettingsRStudioServerProAppSettingsOutputReference", jsii.get(self, "rStudioServerProAppSettings"))

    @builtins.property
    @jsii.member(jsii_name="sharingSettings")
    def sharing_settings(
        self,
    ) -> "SagemakerUserProfileUserSettingsSharingSettingsOutputReference":
        return typing.cast("SagemakerUserProfileUserSettingsSharingSettingsOutputReference", jsii.get(self, "sharingSettings"))

    @builtins.property
    @jsii.member(jsii_name="spaceStorageSettings")
    def space_storage_settings(
        self,
    ) -> "SagemakerUserProfileUserSettingsSpaceStorageSettingsOutputReference":
        return typing.cast("SagemakerUserProfileUserSettingsSpaceStorageSettingsOutputReference", jsii.get(self, "spaceStorageSettings"))

    @builtins.property
    @jsii.member(jsii_name="studioWebPortalSettings")
    def studio_web_portal_settings(
        self,
    ) -> "SagemakerUserProfileUserSettingsStudioWebPortalSettingsOutputReference":
        return typing.cast("SagemakerUserProfileUserSettingsStudioWebPortalSettingsOutputReference", jsii.get(self, "studioWebPortalSettings"))

    @builtins.property
    @jsii.member(jsii_name="tensorBoardAppSettings")
    def tensor_board_app_settings(
        self,
    ) -> "SagemakerUserProfileUserSettingsTensorBoardAppSettingsOutputReference":
        return typing.cast("SagemakerUserProfileUserSettingsTensorBoardAppSettingsOutputReference", jsii.get(self, "tensorBoardAppSettings"))

    @builtins.property
    @jsii.member(jsii_name="autoMountHomeEfsInput")
    def auto_mount_home_efs_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "autoMountHomeEfsInput"))

    @builtins.property
    @jsii.member(jsii_name="canvasAppSettingsInput")
    def canvas_app_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettings], jsii.get(self, "canvasAppSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="codeEditorAppSettingsInput")
    def code_editor_app_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettings], jsii.get(self, "codeEditorAppSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="customFileSystemConfigInput")
    def custom_file_system_config_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCustomFileSystemConfig]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCustomFileSystemConfig]]], jsii.get(self, "customFileSystemConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="customPosixUserConfigInput")
    def custom_posix_user_config_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsCustomPosixUserConfig]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsCustomPosixUserConfig], jsii.get(self, "customPosixUserConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultLandingUriInput")
    def default_landing_uri_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultLandingUriInput"))

    @builtins.property
    @jsii.member(jsii_name="executionRoleInput")
    def execution_role_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "executionRoleInput"))

    @builtins.property
    @jsii.member(jsii_name="jupyterLabAppSettingsInput")
    def jupyter_lab_app_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettings], jsii.get(self, "jupyterLabAppSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="jupyterServerAppSettingsInput")
    def jupyter_server_app_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsJupyterServerAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsJupyterServerAppSettings], jsii.get(self, "jupyterServerAppSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="kernelGatewayAppSettingsInput")
    def kernel_gateway_app_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsKernelGatewayAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsKernelGatewayAppSettings], jsii.get(self, "kernelGatewayAppSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="rSessionAppSettingsInput")
    def r_session_app_settings_input(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsRSessionAppSettings"]:
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsRSessionAppSettings"], jsii.get(self, "rSessionAppSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="rStudioServerProAppSettingsInput")
    def r_studio_server_pro_app_settings_input(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsRStudioServerProAppSettings"]:
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsRStudioServerProAppSettings"], jsii.get(self, "rStudioServerProAppSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="securityGroupsInput")
    def security_groups_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "securityGroupsInput"))

    @builtins.property
    @jsii.member(jsii_name="sharingSettingsInput")
    def sharing_settings_input(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsSharingSettings"]:
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsSharingSettings"], jsii.get(self, "sharingSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="spaceStorageSettingsInput")
    def space_storage_settings_input(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsSpaceStorageSettings"]:
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsSpaceStorageSettings"], jsii.get(self, "spaceStorageSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="studioWebPortalInput")
    def studio_web_portal_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "studioWebPortalInput"))

    @builtins.property
    @jsii.member(jsii_name="studioWebPortalSettingsInput")
    def studio_web_portal_settings_input(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsStudioWebPortalSettings"]:
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsStudioWebPortalSettings"], jsii.get(self, "studioWebPortalSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="tensorBoardAppSettingsInput")
    def tensor_board_app_settings_input(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsTensorBoardAppSettings"]:
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsTensorBoardAppSettings"], jsii.get(self, "tensorBoardAppSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="autoMountHomeEfs")
    def auto_mount_home_efs(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "autoMountHomeEfs"))

    @auto_mount_home_efs.setter
    def auto_mount_home_efs(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8b2252cdebf7607dbddc08ba9a6fdd4bfb5d4198420bb8263781bab8b68b6378)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "autoMountHomeEfs", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="defaultLandingUri")
    def default_landing_uri(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultLandingUri"))

    @default_landing_uri.setter
    def default_landing_uri(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1262fb67fe2c45132be985b3adf5538ff48f9b72c8edcae9b1d4b1a018c096cb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultLandingUri", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="executionRole")
    def execution_role(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "executionRole"))

    @execution_role.setter
    def execution_role(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__52b2305cb5c73a2c8925fe08e8d2795109fa915d63d798e22c8ff7aab4a8635c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "executionRole", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="securityGroups")
    def security_groups(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "securityGroups"))

    @security_groups.setter
    def security_groups(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4c71b3abb19c91dd873ef075a2142b11e8d8c6b5245b6f8ae991ae1661c01ba3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityGroups", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="studioWebPortal")
    def studio_web_portal(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "studioWebPortal"))

    @studio_web_portal.setter
    def studio_web_portal(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__77098efe989685b0e8ff5c488786bfcca6d1d62776e42262d4204a5cef1a2d06)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "studioWebPortal", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[SagemakerUserProfileUserSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d2e8ea95865b6cbc30e615f8d8068596ea23f4ff82ce957508d8b4bfba1fd3c0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsRSessionAppSettings",
    jsii_struct_bases=[],
    name_mapping={
        "custom_image": "customImage",
        "default_resource_spec": "defaultResourceSpec",
    },
)
class SagemakerUserProfileUserSettingsRSessionAppSettings:
    def __init__(
        self,
        *,
        custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage", typing.Dict[builtins.str, typing.Any]]]]] = None,
        default_resource_spec: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param custom_image: custom_image block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        '''
        if isinstance(default_resource_spec, dict):
            default_resource_spec = SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec(**default_resource_spec)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bdbe038d0bed961b1fb376f45204b64817ab1f61535428affa5715505a74b1ff)
            check_type(argname="argument custom_image", value=custom_image, expected_type=type_hints["custom_image"])
            check_type(argname="argument default_resource_spec", value=default_resource_spec, expected_type=type_hints["default_resource_spec"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_image is not None:
            self._values["custom_image"] = custom_image
        if default_resource_spec is not None:
            self._values["default_resource_spec"] = default_resource_spec

    @builtins.property
    def custom_image(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage"]]]:
        '''custom_image block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#custom_image SagemakerUserProfile#custom_image}
        '''
        result = self._values.get("custom_image")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage"]]], result)

    @builtins.property
    def default_resource_spec(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec"]:
        '''default_resource_spec block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        '''
        result = self._values.get("default_resource_spec")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsRSessionAppSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage",
    jsii_struct_bases=[],
    name_mapping={
        "app_image_config_name": "appImageConfigName",
        "image_name": "imageName",
        "image_version_number": "imageVersionNumber",
    },
)
class SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage:
    def __init__(
        self,
        *,
        app_image_config_name: builtins.str,
        image_name: builtins.str,
        image_version_number: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param app_image_config_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_image_config_name SagemakerUserProfile#app_image_config_name}.
        :param image_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_name SagemakerUserProfile#image_name}.
        :param image_version_number: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_version_number SagemakerUserProfile#image_version_number}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3e6c1abc16529a431be2db568a6f454f7a2189b3d22f7ca90b0e4ba04547054f)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#app_image_config_name SagemakerUserProfile#app_image_config_name}.'''
        result = self._values.get("app_image_config_name")
        assert result is not None, "Required property 'app_image_config_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def image_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_name SagemakerUserProfile#image_name}.'''
        result = self._values.get("image_name")
        assert result is not None, "Required property 'image_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def image_version_number(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#image_version_number SagemakerUserProfile#image_version_number}.'''
        result = self._values.get("image_version_number")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImageList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImageList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__79e8f7d2124d98a472e2d7ed43d893cb03612e5b485d5ba6cc5b8f3b6df64b29)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImageOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__39dde61ab1d0b2c22580ab951e88de2d0b68717834d5515e24f5f5cf289c7a2f)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImageOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__49c7678b26d40300064092996443fce86a609707b0da62a8b5b29d8058a367e8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__461399be1f0fe04633dc50dad9516e2d9c7a057f15d910f52b18d73f098c98fc)
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
            type_hints = typing.get_type_hints(_typecheckingstub__6d7c33965955e711ac5d83d41c4c6846f9c990d197ba39fae8e77a5aaac4e09b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2ba328e76c57024d4c7aaba9e71e1a140e29953e796b4222d0d5cb4b1925212e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImageOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImageOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8f3a1f6a6704046b278b67a5bd95960cf6bd11f88e6b53bbc2bf586f80436be2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1e4cda8886f78838067eebf975aef0adb5e5fcc8b93819db6c46aba600c647e1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "appImageConfigName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imageName")
    def image_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "imageName"))

    @image_name.setter
    def image_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__763f0bf2d169d8f2b1e98521a3901f6d0ecbb72615db6199e01819eb5db62e00)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imageName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="imageVersionNumber")
    def image_version_number(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "imageVersionNumber"))

    @image_version_number.setter
    def image_version_number(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5c763070e4c4ca574d519593dc8467be681ae66f6ebe0545c0ee58d7f1a187c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "imageVersionNumber", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6deca565b3083d1b1f0788108ec0678b6fde06f6ae05317482521bff131a58a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec",
    jsii_struct_bases=[],
    name_mapping={
        "instance_type": "instanceType",
        "lifecycle_config_arn": "lifecycleConfigArn",
        "sagemaker_image_arn": "sagemakerImageArn",
        "sagemaker_image_version_alias": "sagemakerImageVersionAlias",
        "sagemaker_image_version_arn": "sagemakerImageVersionArn",
    },
)
class SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec:
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
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec7b40e124ec3583b199b405a75b1f3f0310d906a14156be1f0d538bf9f6f401)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lifecycle_config_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.'''
        result = self._values.get("lifecycle_config_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.'''
        result = self._values.get("sagemaker_image_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_alias(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.'''
        result = self._values.get("sagemaker_image_version_alias")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.'''
        result = self._values.get("sagemaker_image_version_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpecOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpecOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4f0575430b5b2e83594ea329c61aa8e90b0451dc6d1b287bfa5bb6872a5e6b60)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2bcc96e38a6b57d9e61b3723be5ed532e1973bf6012c41ee959eb931463934ab)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArn")
    def lifecycle_config_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleConfigArn"))

    @lifecycle_config_arn.setter
    def lifecycle_config_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b8a3fa47e8c338146451d9f1fd6983a0caf1d7957824a64827ce27ac91fdaaa7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArn")
    def sagemaker_image_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageArn"))

    @sagemaker_image_arn.setter
    def sagemaker_image_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d64ef0730db40bad386ff2eb499e7469cc30c3e1caa3a7213b601f87ad8b5807)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAlias")
    def sagemaker_image_version_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionAlias"))

    @sagemaker_image_version_alias.setter
    def sagemaker_image_version_alias(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__59e0cb374d77dd6b361d902e9baf1ddddec9412e9ffad9bda1b08f78269cb3e3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionAlias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArn")
    def sagemaker_image_version_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionArn"))

    @sagemaker_image_version_arn.setter
    def sagemaker_image_version_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e2415d512337376730038d66c0e369a1c6f54617c6d2b90d07233ed78cf58d74)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__890000032619ec7cd7f5c6be20d91a59e48cf8cb309a9b508de3a1ee81e639c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsRSessionAppSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsRSessionAppSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__44a643204443c0d1a0654f9762ed40a68efef186a8a31b31976a12a03e506120)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putCustomImage")
    def put_custom_image(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__54fc407bd22fb507e5b6d027f2ca1cc2395b7b11fae8c8f7de0282ee357eb4da)
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
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.
        '''
        value = SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec(
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

    @jsii.member(jsii_name="resetDefaultResourceSpec")
    def reset_default_resource_spec(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultResourceSpec", []))

    @builtins.property
    @jsii.member(jsii_name="customImage")
    def custom_image(
        self,
    ) -> SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImageList:
        return typing.cast(SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImageList, jsii.get(self, "customImage"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpec")
    def default_resource_spec(
        self,
    ) -> SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpecOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpecOutputReference, jsii.get(self, "defaultResourceSpec"))

    @builtins.property
    @jsii.member(jsii_name="customImageInput")
    def custom_image_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage]]], jsii.get(self, "customImageInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpecInput")
    def default_resource_spec_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec], jsii.get(self, "defaultResourceSpecInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsRSessionAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsRSessionAppSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsRSessionAppSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f033f31c1d9d63a298ca056292d7deb98489b0baf2f5832bbd6065f57359a69a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsRStudioServerProAppSettings",
    jsii_struct_bases=[],
    name_mapping={"access_status": "accessStatus", "user_group": "userGroup"},
)
class SagemakerUserProfileUserSettingsRStudioServerProAppSettings:
    def __init__(
        self,
        *,
        access_status: typing.Optional[builtins.str] = None,
        user_group: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param access_status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#access_status SagemakerUserProfile#access_status}.
        :param user_group: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#user_group SagemakerUserProfile#user_group}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2900c433165a62e489dad3012df723ef09719374506f803f87f9f2b0a1a3908a)
            check_type(argname="argument access_status", value=access_status, expected_type=type_hints["access_status"])
            check_type(argname="argument user_group", value=user_group, expected_type=type_hints["user_group"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if access_status is not None:
            self._values["access_status"] = access_status
        if user_group is not None:
            self._values["user_group"] = user_group

    @builtins.property
    def access_status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#access_status SagemakerUserProfile#access_status}.'''
        result = self._values.get("access_status")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def user_group(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#user_group SagemakerUserProfile#user_group}.'''
        result = self._values.get("user_group")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsRStudioServerProAppSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsRStudioServerProAppSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsRStudioServerProAppSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__77940afa4bacac0c0af24c3c2d3d6e0570703c96c4b58d7935bfdd4bd0412b8e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAccessStatus")
    def reset_access_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccessStatus", []))

    @jsii.member(jsii_name="resetUserGroup")
    def reset_user_group(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUserGroup", []))

    @builtins.property
    @jsii.member(jsii_name="accessStatusInput")
    def access_status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "accessStatusInput"))

    @builtins.property
    @jsii.member(jsii_name="userGroupInput")
    def user_group_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "userGroupInput"))

    @builtins.property
    @jsii.member(jsii_name="accessStatus")
    def access_status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "accessStatus"))

    @access_status.setter
    def access_status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cbc35e24211679f64507bc4eeac06a94a80eadc16931b253572afbfa600de96d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accessStatus", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userGroup")
    def user_group(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "userGroup"))

    @user_group.setter
    def user_group(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8050810ba3eba1b06407fb1d6c65729dafe2efc8f6a8c08b6a6f2da0fb1f0ae9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userGroup", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsRStudioServerProAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsRStudioServerProAppSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsRStudioServerProAppSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d0ead5aa80d53e9db5030aa8aae986a00aff17de515a253fe24d998ad57f86a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsSharingSettings",
    jsii_struct_bases=[],
    name_mapping={
        "notebook_output_option": "notebookOutputOption",
        "s3_kms_key_id": "s3KmsKeyId",
        "s3_output_path": "s3OutputPath",
    },
)
class SagemakerUserProfileUserSettingsSharingSettings:
    def __init__(
        self,
        *,
        notebook_output_option: typing.Optional[builtins.str] = None,
        s3_kms_key_id: typing.Optional[builtins.str] = None,
        s3_output_path: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param notebook_output_option: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#notebook_output_option SagemakerUserProfile#notebook_output_option}.
        :param s3_kms_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_kms_key_id SagemakerUserProfile#s3_kms_key_id}.
        :param s3_output_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_output_path SagemakerUserProfile#s3_output_path}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c670df9fb49d4ba8edabed0a2391809bddb6ecf89563b4369669b5da1786b7f0)
            check_type(argname="argument notebook_output_option", value=notebook_output_option, expected_type=type_hints["notebook_output_option"])
            check_type(argname="argument s3_kms_key_id", value=s3_kms_key_id, expected_type=type_hints["s3_kms_key_id"])
            check_type(argname="argument s3_output_path", value=s3_output_path, expected_type=type_hints["s3_output_path"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if notebook_output_option is not None:
            self._values["notebook_output_option"] = notebook_output_option
        if s3_kms_key_id is not None:
            self._values["s3_kms_key_id"] = s3_kms_key_id
        if s3_output_path is not None:
            self._values["s3_output_path"] = s3_output_path

    @builtins.property
    def notebook_output_option(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#notebook_output_option SagemakerUserProfile#notebook_output_option}.'''
        result = self._values.get("notebook_output_option")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def s3_kms_key_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_kms_key_id SagemakerUserProfile#s3_kms_key_id}.'''
        result = self._values.get("s3_kms_key_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def s3_output_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#s3_output_path SagemakerUserProfile#s3_output_path}.'''
        result = self._values.get("s3_output_path")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsSharingSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsSharingSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsSharingSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2f8916c8ea93b66bb13bf9cbb94796572806c7b7fa6a71f097bbab44d983b95a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetNotebookOutputOption")
    def reset_notebook_output_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNotebookOutputOption", []))

    @jsii.member(jsii_name="resetS3KmsKeyId")
    def reset_s3_kms_key_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3KmsKeyId", []))

    @jsii.member(jsii_name="resetS3OutputPath")
    def reset_s3_output_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3OutputPath", []))

    @builtins.property
    @jsii.member(jsii_name="notebookOutputOptionInput")
    def notebook_output_option_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "notebookOutputOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="s3KmsKeyIdInput")
    def s3_kms_key_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3KmsKeyIdInput"))

    @builtins.property
    @jsii.member(jsii_name="s3OutputPathInput")
    def s3_output_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "s3OutputPathInput"))

    @builtins.property
    @jsii.member(jsii_name="notebookOutputOption")
    def notebook_output_option(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "notebookOutputOption"))

    @notebook_output_option.setter
    def notebook_output_option(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aeb803a1eb0537e178312aec98bf49d3799e25776f64bc51f84da5d057767f58)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "notebookOutputOption", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3KmsKeyId")
    def s3_kms_key_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3KmsKeyId"))

    @s3_kms_key_id.setter
    def s3_kms_key_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__944fb1d453419777b5ed7be9ef6276e4a101f6980b0940c8f4e17fbe3d74769b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3KmsKeyId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="s3OutputPath")
    def s3_output_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "s3OutputPath"))

    @s3_output_path.setter
    def s3_output_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec1446063e71b73984ae53acdec6127e2f46da2afa81736e41d87e770106a72b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "s3OutputPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsSharingSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsSharingSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsSharingSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c79b09548a50aaf1b617ed5d402dec09fd56f767671f5dcb35fac86db522b5a9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsSpaceStorageSettings",
    jsii_struct_bases=[],
    name_mapping={"default_ebs_storage_settings": "defaultEbsStorageSettings"},
)
class SagemakerUserProfileUserSettingsSpaceStorageSettings:
    def __init__(
        self,
        *,
        default_ebs_storage_settings: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param default_ebs_storage_settings: default_ebs_storage_settings block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_ebs_storage_settings SagemakerUserProfile#default_ebs_storage_settings}
        '''
        if isinstance(default_ebs_storage_settings, dict):
            default_ebs_storage_settings = SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings(**default_ebs_storage_settings)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dd694e14c596e0414b5fd8a7b55087154f0368c2fce0b622c6ef632c4e58878e)
            check_type(argname="argument default_ebs_storage_settings", value=default_ebs_storage_settings, expected_type=type_hints["default_ebs_storage_settings"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if default_ebs_storage_settings is not None:
            self._values["default_ebs_storage_settings"] = default_ebs_storage_settings

    @builtins.property
    def default_ebs_storage_settings(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings"]:
        '''default_ebs_storage_settings block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_ebs_storage_settings SagemakerUserProfile#default_ebs_storage_settings}
        '''
        result = self._values.get("default_ebs_storage_settings")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsSpaceStorageSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings",
    jsii_struct_bases=[],
    name_mapping={
        "default_ebs_volume_size_in_gb": "defaultEbsVolumeSizeInGb",
        "maximum_ebs_volume_size_in_gb": "maximumEbsVolumeSizeInGb",
    },
)
class SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings:
    def __init__(
        self,
        *,
        default_ebs_volume_size_in_gb: jsii.Number,
        maximum_ebs_volume_size_in_gb: jsii.Number,
    ) -> None:
        '''
        :param default_ebs_volume_size_in_gb: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_ebs_volume_size_in_gb SagemakerUserProfile#default_ebs_volume_size_in_gb}.
        :param maximum_ebs_volume_size_in_gb: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#maximum_ebs_volume_size_in_gb SagemakerUserProfile#maximum_ebs_volume_size_in_gb}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__224ac42ef9aa495afc6a672a8e2bba9e9a4b4caca34e62fbfb8341510116da4e)
            check_type(argname="argument default_ebs_volume_size_in_gb", value=default_ebs_volume_size_in_gb, expected_type=type_hints["default_ebs_volume_size_in_gb"])
            check_type(argname="argument maximum_ebs_volume_size_in_gb", value=maximum_ebs_volume_size_in_gb, expected_type=type_hints["maximum_ebs_volume_size_in_gb"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_ebs_volume_size_in_gb": default_ebs_volume_size_in_gb,
            "maximum_ebs_volume_size_in_gb": maximum_ebs_volume_size_in_gb,
        }

    @builtins.property
    def default_ebs_volume_size_in_gb(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_ebs_volume_size_in_gb SagemakerUserProfile#default_ebs_volume_size_in_gb}.'''
        result = self._values.get("default_ebs_volume_size_in_gb")
        assert result is not None, "Required property 'default_ebs_volume_size_in_gb' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def maximum_ebs_volume_size_in_gb(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#maximum_ebs_volume_size_in_gb SagemakerUserProfile#maximum_ebs_volume_size_in_gb}.'''
        result = self._values.get("maximum_ebs_volume_size_in_gb")
        assert result is not None, "Required property 'maximum_ebs_volume_size_in_gb' is missing"
        return typing.cast(jsii.Number, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3c1b20aa33a11a2b5158fa113615d072be9e50066dd1365876403cf96a3315bc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="defaultEbsVolumeSizeInGbInput")
    def default_ebs_volume_size_in_gb_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "defaultEbsVolumeSizeInGbInput"))

    @builtins.property
    @jsii.member(jsii_name="maximumEbsVolumeSizeInGbInput")
    def maximum_ebs_volume_size_in_gb_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maximumEbsVolumeSizeInGbInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultEbsVolumeSizeInGb")
    def default_ebs_volume_size_in_gb(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "defaultEbsVolumeSizeInGb"))

    @default_ebs_volume_size_in_gb.setter
    def default_ebs_volume_size_in_gb(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46f9d3dbc4f025baf9a5478d2f6fcb591288b69ca25157dc25ef664d58ad6095)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultEbsVolumeSizeInGb", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maximumEbsVolumeSizeInGb")
    def maximum_ebs_volume_size_in_gb(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maximumEbsVolumeSizeInGb"))

    @maximum_ebs_volume_size_in_gb.setter
    def maximum_ebs_volume_size_in_gb(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec24a9450455e00762f62e02abd309579636626006d58581860a58f9e050e619)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maximumEbsVolumeSizeInGb", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1fd57124b741958db6c6f17e6d153fa417f71fb0ba3b73f4a305177495f0e853)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsSpaceStorageSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsSpaceStorageSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ba57f1dda3b479b42ae759878a0b6cf46773de44850f0daf9644a9664a8051e8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDefaultEbsStorageSettings")
    def put_default_ebs_storage_settings(
        self,
        *,
        default_ebs_volume_size_in_gb: jsii.Number,
        maximum_ebs_volume_size_in_gb: jsii.Number,
    ) -> None:
        '''
        :param default_ebs_volume_size_in_gb: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_ebs_volume_size_in_gb SagemakerUserProfile#default_ebs_volume_size_in_gb}.
        :param maximum_ebs_volume_size_in_gb: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#maximum_ebs_volume_size_in_gb SagemakerUserProfile#maximum_ebs_volume_size_in_gb}.
        '''
        value = SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings(
            default_ebs_volume_size_in_gb=default_ebs_volume_size_in_gb,
            maximum_ebs_volume_size_in_gb=maximum_ebs_volume_size_in_gb,
        )

        return typing.cast(None, jsii.invoke(self, "putDefaultEbsStorageSettings", [value]))

    @jsii.member(jsii_name="resetDefaultEbsStorageSettings")
    def reset_default_ebs_storage_settings(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultEbsStorageSettings", []))

    @builtins.property
    @jsii.member(jsii_name="defaultEbsStorageSettings")
    def default_ebs_storage_settings(
        self,
    ) -> SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettingsOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettingsOutputReference, jsii.get(self, "defaultEbsStorageSettings"))

    @builtins.property
    @jsii.member(jsii_name="defaultEbsStorageSettingsInput")
    def default_ebs_storage_settings_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings], jsii.get(self, "defaultEbsStorageSettingsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsSpaceStorageSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsSpaceStorageSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsSpaceStorageSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b47dfeb952554a129a49f6871e359acf2ce3bf5e12a348f00b2773c181c80179)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsStudioWebPortalSettings",
    jsii_struct_bases=[],
    name_mapping={
        "hidden_app_types": "hiddenAppTypes",
        "hidden_instance_types": "hiddenInstanceTypes",
        "hidden_ml_tools": "hiddenMlTools",
    },
)
class SagemakerUserProfileUserSettingsStudioWebPortalSettings:
    def __init__(
        self,
        *,
        hidden_app_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        hidden_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
        hidden_ml_tools: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param hidden_app_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_app_types SagemakerUserProfile#hidden_app_types}.
        :param hidden_instance_types: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_instance_types SagemakerUserProfile#hidden_instance_types}.
        :param hidden_ml_tools: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_ml_tools SagemakerUserProfile#hidden_ml_tools}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b6e4942525efc60b4b39f42720e61737c887cb31b0f3586100771f42f13cf744)
            check_type(argname="argument hidden_app_types", value=hidden_app_types, expected_type=type_hints["hidden_app_types"])
            check_type(argname="argument hidden_instance_types", value=hidden_instance_types, expected_type=type_hints["hidden_instance_types"])
            check_type(argname="argument hidden_ml_tools", value=hidden_ml_tools, expected_type=type_hints["hidden_ml_tools"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if hidden_app_types is not None:
            self._values["hidden_app_types"] = hidden_app_types
        if hidden_instance_types is not None:
            self._values["hidden_instance_types"] = hidden_instance_types
        if hidden_ml_tools is not None:
            self._values["hidden_ml_tools"] = hidden_ml_tools

    @builtins.property
    def hidden_app_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_app_types SagemakerUserProfile#hidden_app_types}.'''
        result = self._values.get("hidden_app_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def hidden_instance_types(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_instance_types SagemakerUserProfile#hidden_instance_types}.'''
        result = self._values.get("hidden_instance_types")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def hidden_ml_tools(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#hidden_ml_tools SagemakerUserProfile#hidden_ml_tools}.'''
        result = self._values.get("hidden_ml_tools")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsStudioWebPortalSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsStudioWebPortalSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsStudioWebPortalSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__20774bcfc4edf17fc4a3c077c609d4a6196fcc877387900b1f1bde147ee8de87)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetHiddenAppTypes")
    def reset_hidden_app_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHiddenAppTypes", []))

    @jsii.member(jsii_name="resetHiddenInstanceTypes")
    def reset_hidden_instance_types(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHiddenInstanceTypes", []))

    @jsii.member(jsii_name="resetHiddenMlTools")
    def reset_hidden_ml_tools(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHiddenMlTools", []))

    @builtins.property
    @jsii.member(jsii_name="hiddenAppTypesInput")
    def hidden_app_types_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "hiddenAppTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="hiddenInstanceTypesInput")
    def hidden_instance_types_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "hiddenInstanceTypesInput"))

    @builtins.property
    @jsii.member(jsii_name="hiddenMlToolsInput")
    def hidden_ml_tools_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "hiddenMlToolsInput"))

    @builtins.property
    @jsii.member(jsii_name="hiddenAppTypes")
    def hidden_app_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "hiddenAppTypes"))

    @hidden_app_types.setter
    def hidden_app_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18701a6ba2445525074a5ca02300754eb02162e025ba83bca88c66008ef86a73)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "hiddenAppTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="hiddenInstanceTypes")
    def hidden_instance_types(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "hiddenInstanceTypes"))

    @hidden_instance_types.setter
    def hidden_instance_types(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e2f89e8ceff37699eda8d82c0d81d6c5f19b951a695fa039d03bd7b115ceb38b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "hiddenInstanceTypes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="hiddenMlTools")
    def hidden_ml_tools(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "hiddenMlTools"))

    @hidden_ml_tools.setter
    def hidden_ml_tools(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e101e0d1c0a634cfd2a54dccafef0dc6fe032d38d3c8a7bc29bd0cdd3b5c5bb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "hiddenMlTools", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsStudioWebPortalSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsStudioWebPortalSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsStudioWebPortalSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f74fee48f711e5a5e43679820a8f4a844c0d51dd36bb29f9f8a00d5a566f655)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsTensorBoardAppSettings",
    jsii_struct_bases=[],
    name_mapping={"default_resource_spec": "defaultResourceSpec"},
)
class SagemakerUserProfileUserSettingsTensorBoardAppSettings:
    def __init__(
        self,
        *,
        default_resource_spec: typing.Optional[typing.Union["SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param default_resource_spec: default_resource_spec block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        '''
        if isinstance(default_resource_spec, dict):
            default_resource_spec = SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec(**default_resource_spec)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d042887c89681349a407a7c56d1db06bb1a37a1e347c5f6e020b260a0d6f460e)
            check_type(argname="argument default_resource_spec", value=default_resource_spec, expected_type=type_hints["default_resource_spec"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if default_resource_spec is not None:
            self._values["default_resource_spec"] = default_resource_spec

    @builtins.property
    def default_resource_spec(
        self,
    ) -> typing.Optional["SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec"]:
        '''default_resource_spec block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_resource_spec SagemakerUserProfile#default_resource_spec}
        '''
        result = self._values.get("default_resource_spec")
        return typing.cast(typing.Optional["SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsTensorBoardAppSettings(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec",
    jsii_struct_bases=[],
    name_mapping={
        "instance_type": "instanceType",
        "lifecycle_config_arn": "lifecycleConfigArn",
        "sagemaker_image_arn": "sagemakerImageArn",
        "sagemaker_image_version_alias": "sagemakerImageVersionAlias",
        "sagemaker_image_version_arn": "sagemakerImageVersionArn",
    },
)
class SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec:
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
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6471adfa33d4489ed7646aac01752ebb8cc3f799856a34e0aa52457e9ebf52d6)
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
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.'''
        result = self._values.get("instance_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def lifecycle_config_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.'''
        result = self._values.get("lifecycle_config_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.'''
        result = self._values.get("sagemaker_image_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_alias(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.'''
        result = self._values.get("sagemaker_image_version_alias")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sagemaker_image_version_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.'''
        result = self._values.get("sagemaker_image_version_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpecOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpecOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f93023bf4003d35b381687c59a1f710e25179b87779c7f481d7e5fb1882167bc)
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
            type_hints = typing.get_type_hints(_typecheckingstub__860e56164b3d739f9f84926f783975e03fa0625e55a96b1bebe17427088b41a2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "instanceType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="lifecycleConfigArn")
    def lifecycle_config_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lifecycleConfigArn"))

    @lifecycle_config_arn.setter
    def lifecycle_config_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__350c1495f1a9dc24b35421322ecdaedcff933926ae0b7579b45961e57994e5fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "lifecycleConfigArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageArn")
    def sagemaker_image_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageArn"))

    @sagemaker_image_arn.setter
    def sagemaker_image_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__781d70e60663336d831ba58d813d1ac8aac4357c80f0a034bad531421a980486)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionAlias")
    def sagemaker_image_version_alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionAlias"))

    @sagemaker_image_version_alias.setter
    def sagemaker_image_version_alias(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c0e64c9d884d6a951c0012a7468d8c51e8e113e2191a60d55872b8ffe9f164c6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionAlias", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sagemakerImageVersionArn")
    def sagemaker_image_version_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sagemakerImageVersionArn"))

    @sagemaker_image_version_arn.setter
    def sagemaker_image_version_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__52159f5de86ad154189be3ee5d977cf170e28c040f96af1234cce753be73e272)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sagemakerImageVersionArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7305a30990c4a1c5ed404f4ed89ceca1cf4ef0527a0e04cdd3f5a8e5b9c4db7c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class SagemakerUserProfileUserSettingsTensorBoardAppSettingsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsTensorBoardAppSettingsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__14957314c3a4d6ee856cad43fed4aaecd93c1b94983432431fc92fce420bb548)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

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
        :param instance_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#instance_type SagemakerUserProfile#instance_type}.
        :param lifecycle_config_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_config_arn SagemakerUserProfile#lifecycle_config_arn}.
        :param sagemaker_image_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_arn SagemakerUserProfile#sagemaker_image_arn}.
        :param sagemaker_image_version_alias: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_alias SagemakerUserProfile#sagemaker_image_version_alias}.
        :param sagemaker_image_version_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#sagemaker_image_version_arn SagemakerUserProfile#sagemaker_image_version_arn}.
        '''
        value = SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec(
            instance_type=instance_type,
            lifecycle_config_arn=lifecycle_config_arn,
            sagemaker_image_arn=sagemaker_image_arn,
            sagemaker_image_version_alias=sagemaker_image_version_alias,
            sagemaker_image_version_arn=sagemaker_image_version_arn,
        )

        return typing.cast(None, jsii.invoke(self, "putDefaultResourceSpec", [value]))

    @jsii.member(jsii_name="resetDefaultResourceSpec")
    def reset_default_resource_spec(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultResourceSpec", []))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpec")
    def default_resource_spec(
        self,
    ) -> SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpecOutputReference:
        return typing.cast(SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpecOutputReference, jsii.get(self, "defaultResourceSpec"))

    @builtins.property
    @jsii.member(jsii_name="defaultResourceSpecInput")
    def default_resource_spec_input(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec], jsii.get(self, "defaultResourceSpecInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[SagemakerUserProfileUserSettingsTensorBoardAppSettings]:
        return typing.cast(typing.Optional[SagemakerUserProfileUserSettingsTensorBoardAppSettings], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[SagemakerUserProfileUserSettingsTensorBoardAppSettings],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cb9ce70cdb7515db33d8a364317adaac407c4887a717f70e88fbf5bf179c3288)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "SagemakerUserProfile",
    "SagemakerUserProfileConfig",
    "SagemakerUserProfileUserSettings",
    "SagemakerUserProfileUserSettingsCanvasAppSettings",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettingsOutputReference",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettingsOutputReference",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettingsOutputReference",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsList",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettingsOutputReference",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettingsOutputReference",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettingsOutputReference",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsOutputReference",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettingsOutputReference",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings",
    "SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettingsOutputReference",
    "SagemakerUserProfileUserSettingsCodeEditorAppSettings",
    "SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement",
    "SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings",
    "SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettingsOutputReference",
    "SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementOutputReference",
    "SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage",
    "SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImageList",
    "SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImageOutputReference",
    "SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec",
    "SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpecOutputReference",
    "SagemakerUserProfileUserSettingsCodeEditorAppSettingsOutputReference",
    "SagemakerUserProfileUserSettingsCustomFileSystemConfig",
    "SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig",
    "SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigList",
    "SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfigOutputReference",
    "SagemakerUserProfileUserSettingsCustomFileSystemConfigList",
    "SagemakerUserProfileUserSettingsCustomFileSystemConfigOutputReference",
    "SagemakerUserProfileUserSettingsCustomPosixUserConfig",
    "SagemakerUserProfileUserSettingsCustomPosixUserConfigOutputReference",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettings",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepositoryList",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepositoryOutputReference",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImageList",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImageOutputReference",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpecOutputReference",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettingsOutputReference",
    "SagemakerUserProfileUserSettingsJupyterLabAppSettingsOutputReference",
    "SagemakerUserProfileUserSettingsJupyterServerAppSettings",
    "SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository",
    "SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepositoryList",
    "SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepositoryOutputReference",
    "SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec",
    "SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpecOutputReference",
    "SagemakerUserProfileUserSettingsJupyterServerAppSettingsOutputReference",
    "SagemakerUserProfileUserSettingsKernelGatewayAppSettings",
    "SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage",
    "SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImageList",
    "SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImageOutputReference",
    "SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec",
    "SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpecOutputReference",
    "SagemakerUserProfileUserSettingsKernelGatewayAppSettingsOutputReference",
    "SagemakerUserProfileUserSettingsOutputReference",
    "SagemakerUserProfileUserSettingsRSessionAppSettings",
    "SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage",
    "SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImageList",
    "SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImageOutputReference",
    "SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec",
    "SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpecOutputReference",
    "SagemakerUserProfileUserSettingsRSessionAppSettingsOutputReference",
    "SagemakerUserProfileUserSettingsRStudioServerProAppSettings",
    "SagemakerUserProfileUserSettingsRStudioServerProAppSettingsOutputReference",
    "SagemakerUserProfileUserSettingsSharingSettings",
    "SagemakerUserProfileUserSettingsSharingSettingsOutputReference",
    "SagemakerUserProfileUserSettingsSpaceStorageSettings",
    "SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings",
    "SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettingsOutputReference",
    "SagemakerUserProfileUserSettingsSpaceStorageSettingsOutputReference",
    "SagemakerUserProfileUserSettingsStudioWebPortalSettings",
    "SagemakerUserProfileUserSettingsStudioWebPortalSettingsOutputReference",
    "SagemakerUserProfileUserSettingsTensorBoardAppSettings",
    "SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec",
    "SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpecOutputReference",
    "SagemakerUserProfileUserSettingsTensorBoardAppSettingsOutputReference",
]

publication.publish()

def _typecheckingstub__dd3ea87bdcd92be1b32a569209e58887a4b8cf0a1129184e09781056af0e21c7(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    domain_id: builtins.str,
    user_profile_name: builtins.str,
    id: typing.Optional[builtins.str] = None,
    single_sign_on_user_identifier: typing.Optional[builtins.str] = None,
    single_sign_on_user_value: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    user_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettings, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__ad6125bb134bc462868df10f904eecda8fa4c63bb7423947b7f1bd3c331f7e5a(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f191d7eca73a9f60a900618beb667ee009bebe2670ccecfe43d60e6d438cfd88(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__808b16b8d7c4ea3f2731d5af691fce921dd7435185f039b66b4b260c24a1dabe(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd3cb9bd75b15bf6e99b0beb2380934cb7b45f235ad47337fc9e5b263441ce87(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35363910df4c7179a01ce3816eed74e3adfc522587c04b7e7968b5a243bd8c71(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24516786d954c54762fef986c2eede5291c4f6a14a7776c9dfb4afedc49dec8a(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ff0dd72283a8b4a3a327bd40b9ff2042f99605d1c166fb80bc960211d0b3ecb(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2fc6398015cf63d1543035ffbb9dd11c4d0e50146d3796b1de861f58c034e4cf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73cd0fc9769617e44b2bd2cdd0bc0b572bb10551fe90a1cc4970a84d40792226(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    domain_id: builtins.str,
    user_profile_name: builtins.str,
    id: typing.Optional[builtins.str] = None,
    single_sign_on_user_identifier: typing.Optional[builtins.str] = None,
    single_sign_on_user_value: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    user_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettings, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__306f063596160d1b52135ff7326478b4dcbf6bbe28cf5f64751f4aa83fe1d572(
    *,
    execution_role: builtins.str,
    auto_mount_home_efs: typing.Optional[builtins.str] = None,
    canvas_app_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    code_editor_app_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCodeEditorAppSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    custom_file_system_config: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCustomFileSystemConfig, typing.Dict[builtins.str, typing.Any]]]]] = None,
    custom_posix_user_config: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCustomPosixUserConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    default_landing_uri: typing.Optional[builtins.str] = None,
    jupyter_lab_app_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    jupyter_server_app_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsJupyterServerAppSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    kernel_gateway_app_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsKernelGatewayAppSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    r_session_app_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsRSessionAppSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    r_studio_server_pro_app_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsRStudioServerProAppSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    security_groups: typing.Optional[typing.Sequence[builtins.str]] = None,
    sharing_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsSharingSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    space_storage_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsSpaceStorageSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    studio_web_portal: typing.Optional[builtins.str] = None,
    studio_web_portal_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsStudioWebPortalSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    tensor_board_app_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsTensorBoardAppSettings, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__16d09b2bc3f03a9bad901b1527d6ad9c7de8c5f2c8308c536adb5d4fa855deea(
    *,
    direct_deploy_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings, typing.Dict[builtins.str, typing.Any]]] = None,
    emr_serverless_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    generative_ai_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    identity_provider_oauth_settings: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings, typing.Dict[builtins.str, typing.Any]]]]] = None,
    kendra_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    model_register_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    time_series_forecasting_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    workspace_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e0ad3246fdb22bcb7233aa9d92e918963f1ec149840591d9cf98563aa97f565(
    *,
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ca822f8a5f36d545e63dcf1e6be43b89776f62bb144b6adee5d4ebf529655076(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d779037358f09262e3f0476108e257dba770155afbf2145d11f146d2d319fa2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ace52c833344ce182bd7d1baec28cd1979345bd2d4253e7b39c21fd619c989e2(
    value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsDirectDeploySettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d25f41be3546ecb57dde572916247aa3c879301ed6e6aa71ae6b6e92c665d52(
    *,
    execution_role_arn: typing.Optional[builtins.str] = None,
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afba317834a1caaefc8a7cf07b4de39e20b02d4f6b6e62f2640adc4387acc84e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8973f63650b89e5158586a3bbc5d24e3200b830a6ea3837d379eb3ae77cf56e3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__50b43b1ca5dc293a35def9cd4e3998e438114e0a99b5654103c9f44eac73a0ed(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a5d083eb0469396d00f4a9ef02cde7204602f01e17ac84d47917005898e3d0c(
    value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsEmrServerlessSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7cd85eab22ab44b85aedb55a8a93634717597b9cf3de2c8e5de0584d2f013141(
    *,
    amazon_bedrock_role_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b947d36afced12618fc5038e1235282b0fad6762b7ebac12695826c12682d8fe(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ee27a247500b3a944156438c0ce7c0c18e8ea691f9bfe4dc5ef3f59f4ad4121(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b032589492973fe49d5c7da92679b5633d67f79d9e6fce35698cdd9f93efe011(
    value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsGenerativeAiSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54d058dfdf02b83ab8e060b053d4221d79cf04823d9e4c943d38781f6e413c44(
    *,
    secret_arn: builtins.str,
    data_source_name: typing.Optional[builtins.str] = None,
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f27fdd5618cd381f2ee6c6a7071f1df701269a68b6225c3326e4175a32efc90d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02fcef93e54ebc08f0864a9c4997b3c39554f180fc13b85cd6406841dd71d9bb(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d669ab2efec1e4384394fa37eed1e5170b9327386252888cdecc25493840dc72(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__252422a8dc2d627da724fc3db377315308ed8047715889350fb541c8b089b019(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__535ff0b41506e5054ac38419965d4f58d45db3bae1a8dd2fa5e5242f070478f4(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78860f87530145a7f52ed09144351e7e4f7ae842ed483c212a01f3bf58271bd6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1920965ca0486a3332e5f4f0e3fbe9f3eb9cd6f5070d283d791d19ca78a8256e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4251cd9319e06e2ce7e48156d6763b98100faa169d5724c6aa74328a5e11dc96(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c855cd455cd1d8564e78b45233b2441f78bf07be342c07fd0b4f6d453f4fb2b9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ead6300903e508ae4972ffa6b51dfc14d3e425b6a388580cdf62ad723e5f20b8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__caaccc23dcd8a9475f4e62ecfa155a514e1d0375f49486fd57169bc3d8c6f4f1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0dfe48433cf817613db002a8f9c34a53d433e2ad2f3a8a078b07c4b9ea79c6b4(
    *,
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__890e0110a13e9119afaf648817fd3cb3db3f8108f2a6ce694267f275e7dae53a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07d8d288e8f79720411993a11af1e4ea15a2935708f6d8e5c5637a8f9ee5bb13(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c7bd8ceb2db018c8b57b5f4cbadcdc9e385b253f84a3392aa5de21c05eed8c7(
    value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsKendraSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a0e3948e5841e1b16a225771ad8bdaa5b74e907a97816ce3db62922d8ec12cb(
    *,
    cross_account_model_register_role_arn: typing.Optional[builtins.str] = None,
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d1e721ae38233ac31471607ecf4d4e5b02726223276ad81cb37f69e3953955a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__580f1864b1319edf6df503fe9f55a943d85db7deb98e3e37cba369c936a62c18(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4ac29e4f03e17ca62f20fb694572c08fb40d42e00529a41cf663a80ee42dbce(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__047ac3278d0fa26760beceb3f2350f77f267c7aa4060ac99dde8f039b234ce2d(
    value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsModelRegisterSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__69a4b6ffa730b8ca119734580eae653bc5bcd3d9d1b1ec694fdbef1c25069405(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b23c75e3c59f96d7f63ba891a2027f96c8dc3e8dc40d82e4c31ef7861aa25902(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCanvasAppSettingsIdentityProviderOauthSettings, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61c5a6523896991c5be0a0e4b84781da8513bc369ac8fe9c47e0beed006d6544(
    value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__112770e3f4de92edb14572763999d4b0fa2adef5718365d58c265d3c39763f13(
    *,
    amazon_forecast_role_arn: typing.Optional[builtins.str] = None,
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c2afc809c01888df468e9803ecd1497355c28776f2bc7d23470f32758588804(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40598666bdd057a11549bf592d1408ed5b297533b83a58ba9ae3cb2ae4ef0499(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__204389a718c4f7ac1e7e645058c4802816deb176e3d667ba5a4256ac40c4b6fb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__27b47a6cf1716cdeea9d008b4eff25700650bb104504cafdb46c90886ae93321(
    value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__400b9bb04452b47f148e01c7c760be34208f967ddc7678d1920c4b44422d6f01(
    *,
    s3_artifact_path: typing.Optional[builtins.str] = None,
    s3_kms_key_id: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__643d52c71773c6000530c59dde69fad16f8ee24e239aab2bb48ed68438aeb335(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3937a05658a120ca37437176efefa6af8216b065361d7e21983047405ffa1b44(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__662421ac5d7adc31e7fe2a4b5af9a344ceb0b7f061788d7aee0755ed68f34731(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8c03944bf9f98bcd61d33630d3d99d9db4006e3d12ef11cb1044b11454a47d8(
    value: typing.Optional[SagemakerUserProfileUserSettingsCanvasAppSettingsWorkspaceSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ad3329cedc284aceeaffba972c2587876658a3de61d253db88df654c506f2f8c(
    *,
    app_lifecycle_management: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement, typing.Dict[builtins.str, typing.Any]]] = None,
    built_in_lifecycle_config_arn: typing.Optional[builtins.str] = None,
    custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]]] = None,
    default_resource_spec: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]]] = None,
    lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a8c3f2b6569e0e87aebde15858a4d5f0e5aa7227d0ecc7b1ea300e17e25554e(
    *,
    idle_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__269b32ea85f4b2770be150cc18b7e56ebee1deca58c017d10a5cd4194230ab5e(
    *,
    idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    lifecycle_management: typing.Optional[builtins.str] = None,
    max_idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    min_idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c645bcce3defc9a9bf269c437c4e00e66e3bbfdc1eeb7b8729702a03309060df(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdaba26e4cc9da947d4931bbb6c065dd7c70eb2b018a1af674b5ec2a2daeb482(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7eb9505adb90643ac4215caa78c7548a8ee1d33ece8d300c9d5b5af3d1f47774(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdc0acb02c333134aa39abc3bf8e0efefe9f75b7e7ac5913d7e745e23509fbc4(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__030dc896959202ac962ed8b00de9df3abc7e69eb8747a255f27ba5027e24f342(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9529a6630a4a815932c64b4468783df3242b17d9ef9c19ba91f2a6456175cb85(
    value: typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagementIdleSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e466961ea4593fbd37ecc09df78a828d41c002039021dbc05020982ce6d2844f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__58fd8b4f8a439c600ce83a4159dd97295faec8ca7eb9450d7db2586f80fdd994(
    value: typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsAppLifecycleManagement],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31685d399a5a2f5d157a4061e990a5336420fbf2670fe850fcd13a250a4245fb(
    *,
    app_image_config_name: builtins.str,
    image_name: builtins.str,
    image_version_number: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2c0af4c298a2b6d04a1f44a01f2b206ce430d5d6a89e6210966c80f80e224f2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9312a860fecadb8fce6a7b897680ca48df14314e47f0614c2b0b986870898d35(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b29c78f87709bfb12918f1aab4088755a4036c368cb2f31c3380504f52cea1b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6f26e1360444f3a945ae16b2022c653ed7c659e45ed1eb53778564114d12a30(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e611d29463a9847a4b8198e73af7d5407fbc93f7c9d30c7a105163bb7927e70d(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3882cb0a353b6513380844b7705abec2e5bccbb030af882ba42221f076d7b76(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b782474111f309a67d2f888f6697ec6b0aad7fa4942c9088f8f3e470d1d73030(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0f28b5e65383c5194e00203f8f3a8e34e6d6d0eb0f99ea482e9f9c7c4547e0c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b2480c6eb601ae956b181734b3c129d2353d3f3436e03c5422acfdc47a71dd4d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e3f599cfb86d8be32c90383683bb3041dcc0123b9364f12a5dbc79f826775774(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fb0bdd7da81113c7522c4ea01d222955ef89fa0ebdec2b92f19041f9086c03eb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__212c17736212b6e994c35614906571fec28487b3e89d84513914a623eba61bd1(
    *,
    instance_type: typing.Optional[builtins.str] = None,
    lifecycle_config_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
    sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4443f427b796bc6ee8166ad7ed7c2c4bf0ffd911b1c3847bfb8cd2a44963fa61(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__40cab206d19cb5cbd6796cbf74a4c9799f791d6dd450904375bde60efe659c13(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__869647f40f998c4fda14ea599d8eb361c3cbded53a832edde1fc550e46535073(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90f8b73ccb31b23d136e9ada4cb0eed300a48e7d2ce1441b4fc38b8b3fd4c58c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__11380be6410955b51f62bd9fa242e449088d6afb7707f5fbb5c929205103b1a3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a62823d255cedc9d1b796f1d37e4b0cca023d9942d647bf99c310da806af7788(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ebd07853f67330e910f41b3b854358cb08b73489d522db16b43a4580f33bd18(
    value: typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettingsDefaultResourceSpec],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__976db0297bf5a71acc56521a1165f66a75d52ca96f07f372b9126a92d85b1549(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7cc81c6501ed4bbf79c64a8286ea92ff00893f89c1968360467e25b059515ca2(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCodeEditorAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__019185b8566710fe9c11f541f0c5a4064b09a8e2767d22a50985b0f0205d3f5a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__af10686d3e00b991af1959328b4e19c674cfef5a9546d5eb5c984feb2aaf2a03(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7e40ddc62cdd9589b708caf13743c193450bd8c0d46b2d340dabe3696b8b9bcb(
    value: typing.Optional[SagemakerUserProfileUserSettingsCodeEditorAppSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da2df07d8dadc95d8ae4bd9b9c50a29bab0abc4a49b4b646c987524387dda87a(
    *,
    efs_file_system_config: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b49c7c7f3588551a85d7b745c1dcdaea04b4eb8a466fa795b00784e4db68d132(
    *,
    file_system_id: builtins.str,
    file_system_path: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__edba72f2e06aeffc080b76db35cbcfe5c3b6d2c08b8b2ece060749b09f91aa3d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4d7e1a3243a616d9056ac62ec62c91dc36bdef8f501547d770c665deac922909(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c656d646f8feaf3ec4ffa965e1f0887781dfadd12440165da8153b15e71bb0f2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__25192b4365f6267728261e5b1dc5db8fc0772a76cd34fe8a704aaf1574aac7fa(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__69d224ff23b6efdc61c198525d77242e6401590ce356e3063c65b35d509194d3(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb23059bf8c254fe090e3afa64c234f30691275571b4784a6293aac6fb63cf3a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2242268e83245261734d05031f3c745a600f3e3d0711278801a461d30db805f6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e87765227b1430976c4533466a70c24393286178f7d1b056f0d9766826833c0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6883adb2e2644895e3f97530fd18bb84c821f286b49eeff0094260657a8179f7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc197c474f956970375b6d1e94b09b61e64163399db91ec1e60baa34029ffd90(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29e0b0f957e3159bdd0f809071f178199022d6cd85927a201f30d47931d78d13(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f249283578c2d10c9ec57efb990d2bfcc0b9144a84bb50047290348512d899c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c12f5d9dbb8b2a91a3116b409aa31297f3910e8e4b9ef0093857d1fd31539fa4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac5e4a172133f685462e38048a86a39b2531bbf14cbc842fd036841fbf818dc8(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cbcec1b4121c5c72c0cffac1aa6038498331c14fe104be00eab0b6f5a9e6fe88(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d65c2dcc66eec3d6d17ceda39e34a3c99313da50eb47b91a648eac59773ffaa(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsCustomFileSystemConfig]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8260ae2c93b6839498a3bba7311751d2fb809374f3f10bef917925227f3836e0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__63061bafb8c5d3174e75baaee09d4626c9c4671baec9402b4f5e2d7660187396(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCustomFileSystemConfigEfsFileSystemConfig, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f575e7b648f7e311ae341ffeea133ac42ce0b01e9b9d741d996f6861791546f1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsCustomFileSystemConfig]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__07eda42e0b2e8ae839fb5682fd3ee20da510147caa0927d4820753cc74603e78(
    *,
    gid: jsii.Number,
    uid: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88c26e1b72fdd541fa9dfe3aef7a8fa79eeb9fbfdace23f42a65a3eb88b9c335(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a6a2270bcb263c51b435ecb5a8d5a66404765b85f19f44ffd3224699e712447(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7acddb6169b775c5347ff10e318f7c849f3f91d0432edc016796fdcec40b0d6d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99c608fa6a823f261d7944813c2fc5bc004a638d7c3fc1d744dcd54c427662cd(
    value: typing.Optional[SagemakerUserProfileUserSettingsCustomPosixUserConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8297e636f159ca637453a72e6a00620b4d70c0118debb3a01909dc2796b34506(
    *,
    app_lifecycle_management: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement, typing.Dict[builtins.str, typing.Any]]] = None,
    built_in_lifecycle_config_arn: typing.Optional[builtins.str] = None,
    code_repository: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]]] = None,
    custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]]] = None,
    default_resource_spec: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]]] = None,
    emr_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings, typing.Dict[builtins.str, typing.Any]]] = None,
    lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__931ac60ec5eea47c94b953921f6f012c071ff4fea1d7130a5be8a29d943ee885(
    *,
    idle_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c776a15c84912fff7e8da536487ddfa4487205a0fe965c1132661df9a9853eee(
    *,
    idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    lifecycle_management: typing.Optional[builtins.str] = None,
    max_idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    min_idle_timeout_in_minutes: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ac63b0a6f6ef20f00402c0294bb4e90867d4a7c659e5429d18d986fbedccdea(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60ca4ab247a286372377dbd78764d43689a9b8561237f3cd24f086266596b79c(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1ad7a500f02ba58921790ac3a0cfb640ab51f97b78263e90008446e3d9e4487b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88f482a26622b3901b1cc0379319734cefa6101ef21e145e302bcece57f1a5b1(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e56331f0fe1f31f73422f9fd3935acdbbacd97e0b2e75605d505a89a3ef0897d(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__682a77978f515a64b1116b31508226275d0d3f65bed88a7e55224dc903f402e7(
    value: typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3cb284d4e36e42c28d5e1e4c9a12dee5749362d996e6876e4f0d21c447c1fe09(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba04e92c11cd739c6eaed29ebbe2603dc89fab7b1c97d2247052063fafe61454(
    value: typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagement],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f3b6d02c74b868efefba3899b90e3d5e07df58a6707bfe4d4272e244b0e959b(
    *,
    repository_url: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1928fbb2cb620976f86e2be38a893b71d0fbda8f4fd3034ec3ce17cc5409e107(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2b234ed4ca56493e7fae3a91aad082fc08f93541ce9b80bc852be0d77c1bf1b5(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c150f065cd7707b99bf4b422587ee31b68162f25dda745730b0bf472efb58d5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d167f3ea9e06337fc64d4448053069e130460697d9962c39d5d9b234ce22bb22(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b893394ad42a71cb6274dce8f4c38807e1d5a692f04816e23d292a29fd017aca(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67b69f20666b57b85a1d19f41c315d7378d4c2b8bd3355b8ae68eae9518e320c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8897c9df9c6569eb63d4c2e22156daf693d58b468e33870843790dbf772be2b2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c05e20e708b91701deeabd357ea4f752a1f19e2e1a722293eb3675f3f18f2c9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0edbd5c7071d95f96f3332c677bf16f8438a5c94745aa883c29eea0a0685822(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b9c971c2c789fd1a890731df71978ebfd58777fb90aa6fedc47eef842847afbb(
    *,
    app_image_config_name: builtins.str,
    image_name: builtins.str,
    image_version_number: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b003a7ead68c10872f12cf73dc9f0e66b1d169b9689006caf27cb4bd157e7cb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5474a59eca791b8f3f58bc3aa7218598f865f8083b8f0da0d6b82e239283a7f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0d16e4cab580914c76f8b3a7d84aa7f222f66d086701a511d8444434f051b60(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c0deb8147f65958cc96a9e6655a365d644accc32f917bd1555d33f8698f7d3e(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4126537c4d8bc60b0845e467ffeb16607651eb8626514eefb4f05039fa736b1d(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__165afb24a8731774c62f6f9d4d54bac0962922955bde716164d7d2f675852d1d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e10d091cbfbf47ab8da583502018bbf3991c41074b60434eea9e94871b89ad65(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3dca9ab0e38d5b6d940ff7af1aa287602a44195dc777319aa2ecf3d12c191dd6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5f34ab52f09b2a57bb3d791471fd00d24d926e67fb297bf09331129dad7e36d1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__093ce623244b605c46352814d34423d50c3429f5196d48995c8b56ec5c79d50f(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7812e0f9594df05b219fe402239f896ee767b625960621403d26555130dbb47(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bf3b74b481c901fdf6e54cf5e074148f8a337e01393180ab9a3d1590e45310e0(
    *,
    instance_type: typing.Optional[builtins.str] = None,
    lifecycle_config_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
    sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96951f8ba1078f0c58eed056dd4e5dbb3ddc0536ed2e6375ac08a950cb71d410(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0597fd409144d5509abef505f52d3b8cd34238bbe91c7a433a2dc7955f357ac1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30a7fb805a4946d207ecfbe92222c0d85233988b14c88dccdd562f748a9e989d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b90bb9a09a4545e26780ca1da9a7043c29235919980e1fef8f4cb4fd7e1e3c5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ecbc1ea3fbc72dbf0db6748cd3e159eefd34831c35234c9440443cf300d87b92(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7bd2a6f7734608ad75ed27604354378023b08252da455bf97a4428e5b871c469(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__119e420702f29b31ffc29d0effc7557cb7d72cf672be5428548c4f8200cba1b5(
    value: typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsDefaultResourceSpec],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73c4e569a434e9dda586ab0338de22e36730e97c9c836e463900f427928a4f71(
    *,
    assumable_role_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
    execution_role_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c16bcd4aa5e8a8ced2f559b108e600b5f7ac779d86b8acaf5d264074dc49def(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d5bd6178fff00da65fa44da96565be1b89c9f61955571be36317b97b58500ba(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ae85365aae23aebfc7e5360236105f340e3f7d9391e55e77837b5c3289bdfc01(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b4c9a05d2f795e021d2c718ebb3245dd127c2a17a4def75e166e94cd2a5d26dd(
    value: typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettingsEmrSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__975f2c9559ddca53c487f24480526b786698430fc801fb3fc906f154c3ced97f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7475f7b80ec5584135bbe3d27ea74af3800320ee13eca1924d622860a1fc6d2(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9329a9ff3435f3575189ab5ba2244b6dc528446af75f3240bd4b25e2658fed11(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsJupyterLabAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90dc16205e3c5f1b8cc126acaa896a8a66fcac242909b9a41378e3a16ba3664d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a9f85556da372af98f8709dc28ca4da6342a0d9433db8c75e1e4f7ba44fa398(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ccc1eb5832d0fa1074fb819f4ac37ff008dc6e65ebd1db85f4d164b510db814a(
    value: typing.Optional[SagemakerUserProfileUserSettingsJupyterLabAppSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04fcf7b5687bdfe532a8a064fca0e6906d3e302cfed15dee44db46ff212fa6f4(
    *,
    code_repository: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]]] = None,
    default_resource_spec: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]]] = None,
    lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15aec08afdb643490a5d3adc86ab690923bd8dc5d0de509a0b506f908b28fb89(
    *,
    repository_url: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e563758f5d09b0484f056aa2aff747b21211ce1a200cc5bcdbdd2c98ad8be65(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__50572d71de37e8c322cffc1d33aab92b6122442738db0cf94971f4248b0395f4(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d5db4b5512e74fabf118e17f8622cad42ec8a8868a1c1fade0700e565379894(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8abeeb7863c8daa380a0cbc92b08d561a2bfe6a71a1ae42e758871fea10dae87(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a3762feedcb5e283dcdf784ebdf5ea19ea35c6ea3f36dba40edd7e1d9ae35f79(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3765f96c603f6488b0d4db0431f4f97daef18f61995843bdd7b2763a4264df18(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0ed1b206c66fad8eb894d47c58536113e883392cf6b0668926577b3cce06037(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4868df7444601ccf15262cb7e4d14ac3099e912ce6bc8e71727c06960de7650f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd287730ad069041a0dd48aac409169763267bcb4f57f4bae41adf69a1a8ab3e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac8c7168539cae31994e1528bc892d22833a459587905ec742bab1c1e5fc310f(
    *,
    instance_type: typing.Optional[builtins.str] = None,
    lifecycle_config_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
    sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68dac719f8098a672cc6b80891627ef3dff4548679a64a83218934fc3a70fba7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__73cd5601cc3bfa904b5eb21412967989f8df794170a6c0825ec32e1ffa93803d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5ecf9d2adf8f81491458127074fdde5edb2ba300f4f9cbc22a95af3bd6e9a140(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f51d1563515d70f94344fee03b301fd5f312efbacedf4f76a340a86296e19ee8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__abc49c5a743382cff815ceb12a3075a63f3acd2b8792434c8bb0ef6ee98ef421(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e8af36d100fa85c26642e6a743b2b0359b9490bf451b1310ee7c615e8e0153d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d586dc6ebbc9f8d5ccd4e59a54ca60d2f90fedfc1d934f0f97d868cdf0af5c7(
    value: typing.Optional[SagemakerUserProfileUserSettingsJupyterServerAppSettingsDefaultResourceSpec],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__937ac3e1ba3ddb39ec99f6d4e92effa287defcb0f00b92153c64f9ac3dd4a61f(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd69df47f582fc37a000b8188395c7f18b35d88eb0b60c7522ef9c2b9e02e406(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsJupyterServerAppSettingsCodeRepository, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c25c999871628efd294de82ea81ccea9abecce9d907f6b5369abbe21b97dae4e(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__97a3aa76918f1ed3df7a15dc17d04538f5bbbcfb2acbce0e0253eac72158ff3b(
    value: typing.Optional[SagemakerUserProfileUserSettingsJupyterServerAppSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__346ca577f5fb3b958a7dab690897b6d3acb033cf8d0048b0827f793fa8bcb47d(
    *,
    custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]]] = None,
    default_resource_spec: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]]] = None,
    lifecycle_config_arns: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba94295c8afeace5e45e4c2d3d849316f40dca1c9eb2d77492b8867bda645ffe(
    *,
    app_image_config_name: builtins.str,
    image_name: builtins.str,
    image_version_number: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__228bd0b6b9395c15ebef4731ef962febf92fd3b733e56ddbe5f5635cda9f01a6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a7e9b85453f6a196c20084557ee9df6c7cee619be469a28e5b306673af411b4f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b679d9e84d10515c04235088890fcebec58300182b1a8ca1a4f2db34568cfe4d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ba1f5730df4755f3cc699d03670b2229818fdf82874dc35dd8370a6722c609a(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b31a07c3e335505cea00bcd36ae163b07e4a93a5920c3c2dad072ca6cddd92bf(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bbdee080a48812a455fa0a2e374026b7e3a3a2e7234ff71069d372c1038a6fc1(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__76c1bdf133aeeeb394b3d611947334076b4f0a513468d39c52904d8b8ad7c206(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c61cb794f464815dc32f5a220de2fa3639d240bcf995e32a7ec2974b94eac099(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__122c997d837e6d10228c7c702850da9aa90adfff33ea464b9329f85098961865(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dc83a303d6e65c230c693e4d000970fff4420d960a9d3e6ef429237f85dc6bcb(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__efd715ac7ef21d63421454edd6ef3a4bb811badf05d5889a7406433485bbd4c4(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5cf658faaa3c5ae2b7c61a5944ea284c77b49a322ae658dfe40d2803e93a0fc1(
    *,
    instance_type: typing.Optional[builtins.str] = None,
    lifecycle_config_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
    sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4362b8fa84107e5028acee923367b89350434eefebdbfb972ffdc27ee3068a96(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dff61fd52136fda177c5e3b437998c1ff3b2451051c2d6fe3ca578e89cb85795(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c18c6ec3ca84fe6a03a764a2335b7be0ad27faf5dd2496b2d6523bf81346379(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__19c4eb45e2d2e3844a5052861ff096742055e8020dddcee3a224096a232eefc4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e33a3ab81da18efe27901e8897423f2088c4ef88a415d9935df7d2f84426c39(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ed53ac962a92899eb98184a2e1c24b979089a6bd461d40d06f1f8d5436d83610(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__606e80f16417061c02469c300bfe306250da2d412f246b4c2533feb03c3ca421(
    value: typing.Optional[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsDefaultResourceSpec],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f94329f77f18be7b5602e4ac1fc47e1edb2f29b208ef663f8c0d88ff0ad231f0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e765526e93b6120844d2b24b0c782b5788bea2ee156fae755cfd809f4606f339(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsKernelGatewayAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5540576825666600376d746abb42b3f3e6088e86508b43b3539690f536c92aa4(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4eb0a8fefc73ed9d1684d5a617788f610149e0cf1aa69338ec9b3a9474c84919(
    value: typing.Optional[SagemakerUserProfileUserSettingsKernelGatewayAppSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0fdf84024a2e8f6fcc9a18f2c7a3ed1612d95ee2d9ae078de089cff8fd72176(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59f352c6c01c99db54557ce98222230e4c30e12baf1fdbd57057aac917fffdda(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsCustomFileSystemConfig, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8b2252cdebf7607dbddc08ba9a6fdd4bfb5d4198420bb8263781bab8b68b6378(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1262fb67fe2c45132be985b3adf5538ff48f9b72c8edcae9b1d4b1a018c096cb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__52b2305cb5c73a2c8925fe08e8d2795109fa915d63d798e22c8ff7aab4a8635c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4c71b3abb19c91dd873ef075a2142b11e8d8c6b5245b6f8ae991ae1661c01ba3(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77098efe989685b0e8ff5c488786bfcca6d1d62776e42262d4204a5cef1a2d06(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d2e8ea95865b6cbc30e615f8d8068596ea23f4ff82ce957508d8b4bfba1fd3c0(
    value: typing.Optional[SagemakerUserProfileUserSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdbe038d0bed961b1fb376f45204b64817ab1f61535428affa5715505a74b1ff(
    *,
    custom_image: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]]] = None,
    default_resource_spec: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3e6c1abc16529a431be2db568a6f454f7a2189b3d22f7ca90b0e4ba04547054f(
    *,
    app_image_config_name: builtins.str,
    image_name: builtins.str,
    image_version_number: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79e8f7d2124d98a472e2d7ed43d893cb03612e5b485d5ba6cc5b8f3b6df64b29(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__39dde61ab1d0b2c22580ab951e88de2d0b68717834d5515e24f5f5cf289c7a2f(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__49c7678b26d40300064092996443fce86a609707b0da62a8b5b29d8058a367e8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__461399be1f0fe04633dc50dad9516e2d9c7a057f15d910f52b18d73f098c98fc(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d7c33965955e711ac5d83d41c4c6846f9c990d197ba39fae8e77a5aaac4e09b(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ba328e76c57024d4c7aaba9e71e1a140e29953e796b4222d0d5cb4b1925212e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f3a1f6a6704046b278b67a5bd95960cf6bd11f88e6b53bbc2bf586f80436be2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e4cda8886f78838067eebf975aef0adb5e5fcc8b93819db6c46aba600c647e1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__763f0bf2d169d8f2b1e98521a3901f6d0ecbb72615db6199e01819eb5db62e00(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c763070e4c4ca574d519593dc8467be681ae66f6ebe0545c0ee58d7f1a187c1(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6deca565b3083d1b1f0788108ec0678b6fde06f6ae05317482521bff131a58a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec7b40e124ec3583b199b405a75b1f3f0310d906a14156be1f0d538bf9f6f401(
    *,
    instance_type: typing.Optional[builtins.str] = None,
    lifecycle_config_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
    sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f0575430b5b2e83594ea329c61aa8e90b0451dc6d1b287bfa5bb6872a5e6b60(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2bcc96e38a6b57d9e61b3723be5ed532e1973bf6012c41ee959eb931463934ab(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8a3fa47e8c338146451d9f1fd6983a0caf1d7957824a64827ce27ac91fdaaa7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d64ef0730db40bad386ff2eb499e7469cc30c3e1caa3a7213b601f87ad8b5807(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__59e0cb374d77dd6b361d902e9baf1ddddec9412e9ffad9bda1b08f78269cb3e3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2415d512337376730038d66c0e369a1c6f54617c6d2b90d07233ed78cf58d74(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__890000032619ec7cd7f5c6be20d91a59e48cf8cb309a9b508de3a1ee81e639c1(
    value: typing.Optional[SagemakerUserProfileUserSettingsRSessionAppSettingsDefaultResourceSpec],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44a643204443c0d1a0654f9762ed40a68efef186a8a31b31976a12a03e506120(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54fc407bd22fb507e5b6d027f2ca1cc2395b7b11fae8c8f7de0282ee357eb4da(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[SagemakerUserProfileUserSettingsRSessionAppSettingsCustomImage, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f033f31c1d9d63a298ca056292d7deb98489b0baf2f5832bbd6065f57359a69a(
    value: typing.Optional[SagemakerUserProfileUserSettingsRSessionAppSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2900c433165a62e489dad3012df723ef09719374506f803f87f9f2b0a1a3908a(
    *,
    access_status: typing.Optional[builtins.str] = None,
    user_group: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__77940afa4bacac0c0af24c3c2d3d6e0570703c96c4b58d7935bfdd4bd0412b8e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cbc35e24211679f64507bc4eeac06a94a80eadc16931b253572afbfa600de96d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8050810ba3eba1b06407fb1d6c65729dafe2efc8f6a8c08b6a6f2da0fb1f0ae9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6d0ead5aa80d53e9db5030aa8aae986a00aff17de515a253fe24d998ad57f86a(
    value: typing.Optional[SagemakerUserProfileUserSettingsRStudioServerProAppSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c670df9fb49d4ba8edabed0a2391809bddb6ecf89563b4369669b5da1786b7f0(
    *,
    notebook_output_option: typing.Optional[builtins.str] = None,
    s3_kms_key_id: typing.Optional[builtins.str] = None,
    s3_output_path: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f8916c8ea93b66bb13bf9cbb94796572806c7b7fa6a71f097bbab44d983b95a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aeb803a1eb0537e178312aec98bf49d3799e25776f64bc51f84da5d057767f58(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__944fb1d453419777b5ed7be9ef6276e4a101f6980b0940c8f4e17fbe3d74769b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec1446063e71b73984ae53acdec6127e2f46da2afa81736e41d87e770106a72b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c79b09548a50aaf1b617ed5d402dec09fd56f767671f5dcb35fac86db522b5a9(
    value: typing.Optional[SagemakerUserProfileUserSettingsSharingSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd694e14c596e0414b5fd8a7b55087154f0368c2fce0b622c6ef632c4e58878e(
    *,
    default_ebs_storage_settings: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__224ac42ef9aa495afc6a672a8e2bba9e9a4b4caca34e62fbfb8341510116da4e(
    *,
    default_ebs_volume_size_in_gb: jsii.Number,
    maximum_ebs_volume_size_in_gb: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3c1b20aa33a11a2b5158fa113615d072be9e50066dd1365876403cf96a3315bc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46f9d3dbc4f025baf9a5478d2f6fcb591288b69ca25157dc25ef664d58ad6095(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec24a9450455e00762f62e02abd309579636626006d58581860a58f9e050e619(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1fd57124b741958db6c6f17e6d153fa417f71fb0ba3b73f4a305177495f0e853(
    value: typing.Optional[SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba57f1dda3b479b42ae759878a0b6cf46773de44850f0daf9644a9664a8051e8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b47dfeb952554a129a49f6871e359acf2ce3bf5e12a348f00b2773c181c80179(
    value: typing.Optional[SagemakerUserProfileUserSettingsSpaceStorageSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6e4942525efc60b4b39f42720e61737c887cb31b0f3586100771f42f13cf744(
    *,
    hidden_app_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    hidden_instance_types: typing.Optional[typing.Sequence[builtins.str]] = None,
    hidden_ml_tools: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__20774bcfc4edf17fc4a3c077c609d4a6196fcc877387900b1f1bde147ee8de87(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18701a6ba2445525074a5ca02300754eb02162e025ba83bca88c66008ef86a73(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2f89e8ceff37699eda8d82c0d81d6c5f19b951a695fa039d03bd7b115ceb38b(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e101e0d1c0a634cfd2a54dccafef0dc6fe032d38d3c8a7bc29bd0cdd3b5c5bb(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f74fee48f711e5a5e43679820a8f4a844c0d51dd36bb29f9f8a00d5a566f655(
    value: typing.Optional[SagemakerUserProfileUserSettingsStudioWebPortalSettings],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d042887c89681349a407a7c56d1db06bb1a37a1e347c5f6e020b260a0d6f460e(
    *,
    default_resource_spec: typing.Optional[typing.Union[SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6471adfa33d4489ed7646aac01752ebb8cc3f799856a34e0aa52457e9ebf52d6(
    *,
    instance_type: typing.Optional[builtins.str] = None,
    lifecycle_config_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_arn: typing.Optional[builtins.str] = None,
    sagemaker_image_version_alias: typing.Optional[builtins.str] = None,
    sagemaker_image_version_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f93023bf4003d35b381687c59a1f710e25179b87779c7f481d7e5fb1882167bc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__860e56164b3d739f9f84926f783975e03fa0625e55a96b1bebe17427088b41a2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__350c1495f1a9dc24b35421322ecdaedcff933926ae0b7579b45961e57994e5fb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__781d70e60663336d831ba58d813d1ac8aac4357c80f0a034bad531421a980486(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c0e64c9d884d6a951c0012a7468d8c51e8e113e2191a60d55872b8ffe9f164c6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__52159f5de86ad154189be3ee5d977cf170e28c040f96af1234cce753be73e272(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7305a30990c4a1c5ed404f4ed89ceca1cf4ef0527a0e04cdd3f5a8e5b9c4db7c(
    value: typing.Optional[SagemakerUserProfileUserSettingsTensorBoardAppSettingsDefaultResourceSpec],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14957314c3a4d6ee856cad43fed4aaecd93c1b94983432431fc92fce420bb548(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cb9ce70cdb7515db33d8a364317adaac407c4887a717f70e88fbf5bf179c3288(
    value: typing.Optional[SagemakerUserProfileUserSettingsTensorBoardAppSettings],
) -> None:
    """Type checking stubs"""
    pass
