r'''
# `aws_workspaces_directory`

Refer to the Terraform Registry for docs: [`aws_workspaces_directory`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory).
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


class WorkspacesDirectory(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspacesDirectory.WorkspacesDirectory",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory aws_workspaces_directory}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        active_directory_config: typing.Optional[typing.Union["WorkspacesDirectoryActiveDirectoryConfig", typing.Dict[builtins.str, typing.Any]]] = None,
        certificate_based_auth_properties: typing.Optional[typing.Union["WorkspacesDirectoryCertificateBasedAuthProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        directory_id: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        ip_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        saml_properties: typing.Optional[typing.Union["WorkspacesDirectorySamlProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        self_service_permissions: typing.Optional[typing.Union["WorkspacesDirectorySelfServicePermissions", typing.Dict[builtins.str, typing.Any]]] = None,
        subnet_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        user_identity_type: typing.Optional[builtins.str] = None,
        workspace_access_properties: typing.Optional[typing.Union["WorkspacesDirectoryWorkspaceAccessProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        workspace_creation_properties: typing.Optional[typing.Union["WorkspacesDirectoryWorkspaceCreationProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        workspace_directory_description: typing.Optional[builtins.str] = None,
        workspace_directory_name: typing.Optional[builtins.str] = None,
        workspace_type: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory aws_workspaces_directory} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param active_directory_config: active_directory_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#active_directory_config WorkspacesDirectory#active_directory_config}
        :param certificate_based_auth_properties: certificate_based_auth_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#certificate_based_auth_properties WorkspacesDirectory#certificate_based_auth_properties}
        :param directory_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#directory_id WorkspacesDirectory#directory_id}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#id WorkspacesDirectory#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param ip_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#ip_group_ids WorkspacesDirectory#ip_group_ids}.
        :param saml_properties: saml_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#saml_properties WorkspacesDirectory#saml_properties}
        :param self_service_permissions: self_service_permissions block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#self_service_permissions WorkspacesDirectory#self_service_permissions}
        :param subnet_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#subnet_ids WorkspacesDirectory#subnet_ids}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags WorkspacesDirectory#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags_all WorkspacesDirectory#tags_all}.
        :param user_identity_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_identity_type WorkspacesDirectory#user_identity_type}.
        :param workspace_access_properties: workspace_access_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_access_properties WorkspacesDirectory#workspace_access_properties}
        :param workspace_creation_properties: workspace_creation_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_creation_properties WorkspacesDirectory#workspace_creation_properties}
        :param workspace_directory_description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_description WorkspacesDirectory#workspace_directory_description}.
        :param workspace_directory_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_name WorkspacesDirectory#workspace_directory_name}.
        :param workspace_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_type WorkspacesDirectory#workspace_type}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83ce5e93a7a7e1d9e503854f1252d9d9b4755f2f6cdc3bab30bdc6e5111955e2)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = WorkspacesDirectoryConfig(
            active_directory_config=active_directory_config,
            certificate_based_auth_properties=certificate_based_auth_properties,
            directory_id=directory_id,
            id=id,
            ip_group_ids=ip_group_ids,
            saml_properties=saml_properties,
            self_service_permissions=self_service_permissions,
            subnet_ids=subnet_ids,
            tags=tags,
            tags_all=tags_all,
            user_identity_type=user_identity_type,
            workspace_access_properties=workspace_access_properties,
            workspace_creation_properties=workspace_creation_properties,
            workspace_directory_description=workspace_directory_description,
            workspace_directory_name=workspace_directory_name,
            workspace_type=workspace_type,
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
        '''Generates CDKTF code for importing a WorkspacesDirectory resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the WorkspacesDirectory to import.
        :param import_from_id: The id of the existing WorkspacesDirectory that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the WorkspacesDirectory to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e7787b19eb69eba338f18d27c97885fb580913d53fa8c3518d7e49203ced7b79)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putActiveDirectoryConfig")
    def put_active_directory_config(
        self,
        *,
        domain_name: builtins.str,
        service_account_secret_arn: builtins.str,
    ) -> None:
        '''
        :param domain_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#domain_name WorkspacesDirectory#domain_name}.
        :param service_account_secret_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#service_account_secret_arn WorkspacesDirectory#service_account_secret_arn}.
        '''
        value = WorkspacesDirectoryActiveDirectoryConfig(
            domain_name=domain_name,
            service_account_secret_arn=service_account_secret_arn,
        )

        return typing.cast(None, jsii.invoke(self, "putActiveDirectoryConfig", [value]))

    @jsii.member(jsii_name="putCertificateBasedAuthProperties")
    def put_certificate_based_auth_properties(
        self,
        *,
        certificate_authority_arn: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param certificate_authority_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#certificate_authority_arn WorkspacesDirectory#certificate_authority_arn}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#status WorkspacesDirectory#status}.
        '''
        value = WorkspacesDirectoryCertificateBasedAuthProperties(
            certificate_authority_arn=certificate_authority_arn, status=status
        )

        return typing.cast(None, jsii.invoke(self, "putCertificateBasedAuthProperties", [value]))

    @jsii.member(jsii_name="putSamlProperties")
    def put_saml_properties(
        self,
        *,
        relay_state_parameter_name: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
        user_access_url: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param relay_state_parameter_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#relay_state_parameter_name WorkspacesDirectory#relay_state_parameter_name}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#status WorkspacesDirectory#status}.
        :param user_access_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_access_url WorkspacesDirectory#user_access_url}.
        '''
        value = WorkspacesDirectorySamlProperties(
            relay_state_parameter_name=relay_state_parameter_name,
            status=status,
            user_access_url=user_access_url,
        )

        return typing.cast(None, jsii.invoke(self, "putSamlProperties", [value]))

    @jsii.member(jsii_name="putSelfServicePermissions")
    def put_self_service_permissions(
        self,
        *,
        change_compute_type: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        increase_volume_size: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        rebuild_workspace: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        restart_workspace: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        switch_running_mode: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param change_compute_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#change_compute_type WorkspacesDirectory#change_compute_type}.
        :param increase_volume_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#increase_volume_size WorkspacesDirectory#increase_volume_size}.
        :param rebuild_workspace: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#rebuild_workspace WorkspacesDirectory#rebuild_workspace}.
        :param restart_workspace: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#restart_workspace WorkspacesDirectory#restart_workspace}.
        :param switch_running_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#switch_running_mode WorkspacesDirectory#switch_running_mode}.
        '''
        value = WorkspacesDirectorySelfServicePermissions(
            change_compute_type=change_compute_type,
            increase_volume_size=increase_volume_size,
            rebuild_workspace=rebuild_workspace,
            restart_workspace=restart_workspace,
            switch_running_mode=switch_running_mode,
        )

        return typing.cast(None, jsii.invoke(self, "putSelfServicePermissions", [value]))

    @jsii.member(jsii_name="putWorkspaceAccessProperties")
    def put_workspace_access_properties(
        self,
        *,
        device_type_android: typing.Optional[builtins.str] = None,
        device_type_chromeos: typing.Optional[builtins.str] = None,
        device_type_ios: typing.Optional[builtins.str] = None,
        device_type_linux: typing.Optional[builtins.str] = None,
        device_type_osx: typing.Optional[builtins.str] = None,
        device_type_web: typing.Optional[builtins.str] = None,
        device_type_windows: typing.Optional[builtins.str] = None,
        device_type_zeroclient: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param device_type_android: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_android WorkspacesDirectory#device_type_android}.
        :param device_type_chromeos: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_chromeos WorkspacesDirectory#device_type_chromeos}.
        :param device_type_ios: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_ios WorkspacesDirectory#device_type_ios}.
        :param device_type_linux: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_linux WorkspacesDirectory#device_type_linux}.
        :param device_type_osx: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_osx WorkspacesDirectory#device_type_osx}.
        :param device_type_web: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_web WorkspacesDirectory#device_type_web}.
        :param device_type_windows: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_windows WorkspacesDirectory#device_type_windows}.
        :param device_type_zeroclient: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_zeroclient WorkspacesDirectory#device_type_zeroclient}.
        '''
        value = WorkspacesDirectoryWorkspaceAccessProperties(
            device_type_android=device_type_android,
            device_type_chromeos=device_type_chromeos,
            device_type_ios=device_type_ios,
            device_type_linux=device_type_linux,
            device_type_osx=device_type_osx,
            device_type_web=device_type_web,
            device_type_windows=device_type_windows,
            device_type_zeroclient=device_type_zeroclient,
        )

        return typing.cast(None, jsii.invoke(self, "putWorkspaceAccessProperties", [value]))

    @jsii.member(jsii_name="putWorkspaceCreationProperties")
    def put_workspace_creation_properties(
        self,
        *,
        custom_security_group_id: typing.Optional[builtins.str] = None,
        default_ou: typing.Optional[builtins.str] = None,
        enable_internet_access: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_maintenance_mode: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        user_enabled_as_local_administrator: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param custom_security_group_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#custom_security_group_id WorkspacesDirectory#custom_security_group_id}.
        :param default_ou: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#default_ou WorkspacesDirectory#default_ou}.
        :param enable_internet_access: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#enable_internet_access WorkspacesDirectory#enable_internet_access}.
        :param enable_maintenance_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#enable_maintenance_mode WorkspacesDirectory#enable_maintenance_mode}.
        :param user_enabled_as_local_administrator: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_enabled_as_local_administrator WorkspacesDirectory#user_enabled_as_local_administrator}.
        '''
        value = WorkspacesDirectoryWorkspaceCreationProperties(
            custom_security_group_id=custom_security_group_id,
            default_ou=default_ou,
            enable_internet_access=enable_internet_access,
            enable_maintenance_mode=enable_maintenance_mode,
            user_enabled_as_local_administrator=user_enabled_as_local_administrator,
        )

        return typing.cast(None, jsii.invoke(self, "putWorkspaceCreationProperties", [value]))

    @jsii.member(jsii_name="resetActiveDirectoryConfig")
    def reset_active_directory_config(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetActiveDirectoryConfig", []))

    @jsii.member(jsii_name="resetCertificateBasedAuthProperties")
    def reset_certificate_based_auth_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCertificateBasedAuthProperties", []))

    @jsii.member(jsii_name="resetDirectoryId")
    def reset_directory_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDirectoryId", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetIpGroupIds")
    def reset_ip_group_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIpGroupIds", []))

    @jsii.member(jsii_name="resetSamlProperties")
    def reset_saml_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSamlProperties", []))

    @jsii.member(jsii_name="resetSelfServicePermissions")
    def reset_self_service_permissions(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSelfServicePermissions", []))

    @jsii.member(jsii_name="resetSubnetIds")
    def reset_subnet_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSubnetIds", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetUserIdentityType")
    def reset_user_identity_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUserIdentityType", []))

    @jsii.member(jsii_name="resetWorkspaceAccessProperties")
    def reset_workspace_access_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWorkspaceAccessProperties", []))

    @jsii.member(jsii_name="resetWorkspaceCreationProperties")
    def reset_workspace_creation_properties(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWorkspaceCreationProperties", []))

    @jsii.member(jsii_name="resetWorkspaceDirectoryDescription")
    def reset_workspace_directory_description(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWorkspaceDirectoryDescription", []))

    @jsii.member(jsii_name="resetWorkspaceDirectoryName")
    def reset_workspace_directory_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWorkspaceDirectoryName", []))

    @jsii.member(jsii_name="resetWorkspaceType")
    def reset_workspace_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWorkspaceType", []))

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
    @jsii.member(jsii_name="activeDirectoryConfig")
    def active_directory_config(
        self,
    ) -> "WorkspacesDirectoryActiveDirectoryConfigOutputReference":
        return typing.cast("WorkspacesDirectoryActiveDirectoryConfigOutputReference", jsii.get(self, "activeDirectoryConfig"))

    @builtins.property
    @jsii.member(jsii_name="alias")
    def alias(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "alias"))

    @builtins.property
    @jsii.member(jsii_name="certificateBasedAuthProperties")
    def certificate_based_auth_properties(
        self,
    ) -> "WorkspacesDirectoryCertificateBasedAuthPropertiesOutputReference":
        return typing.cast("WorkspacesDirectoryCertificateBasedAuthPropertiesOutputReference", jsii.get(self, "certificateBasedAuthProperties"))

    @builtins.property
    @jsii.member(jsii_name="customerUserName")
    def customer_user_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "customerUserName"))

    @builtins.property
    @jsii.member(jsii_name="directoryName")
    def directory_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "directoryName"))

    @builtins.property
    @jsii.member(jsii_name="directoryType")
    def directory_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "directoryType"))

    @builtins.property
    @jsii.member(jsii_name="dnsIpAddresses")
    def dns_ip_addresses(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "dnsIpAddresses"))

    @builtins.property
    @jsii.member(jsii_name="iamRoleId")
    def iam_role_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "iamRoleId"))

    @builtins.property
    @jsii.member(jsii_name="registrationCode")
    def registration_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "registrationCode"))

    @builtins.property
    @jsii.member(jsii_name="samlProperties")
    def saml_properties(self) -> "WorkspacesDirectorySamlPropertiesOutputReference":
        return typing.cast("WorkspacesDirectorySamlPropertiesOutputReference", jsii.get(self, "samlProperties"))

    @builtins.property
    @jsii.member(jsii_name="selfServicePermissions")
    def self_service_permissions(
        self,
    ) -> "WorkspacesDirectorySelfServicePermissionsOutputReference":
        return typing.cast("WorkspacesDirectorySelfServicePermissionsOutputReference", jsii.get(self, "selfServicePermissions"))

    @builtins.property
    @jsii.member(jsii_name="workspaceAccessProperties")
    def workspace_access_properties(
        self,
    ) -> "WorkspacesDirectoryWorkspaceAccessPropertiesOutputReference":
        return typing.cast("WorkspacesDirectoryWorkspaceAccessPropertiesOutputReference", jsii.get(self, "workspaceAccessProperties"))

    @builtins.property
    @jsii.member(jsii_name="workspaceCreationProperties")
    def workspace_creation_properties(
        self,
    ) -> "WorkspacesDirectoryWorkspaceCreationPropertiesOutputReference":
        return typing.cast("WorkspacesDirectoryWorkspaceCreationPropertiesOutputReference", jsii.get(self, "workspaceCreationProperties"))

    @builtins.property
    @jsii.member(jsii_name="workspaceSecurityGroupId")
    def workspace_security_group_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "workspaceSecurityGroupId"))

    @builtins.property
    @jsii.member(jsii_name="activeDirectoryConfigInput")
    def active_directory_config_input(
        self,
    ) -> typing.Optional["WorkspacesDirectoryActiveDirectoryConfig"]:
        return typing.cast(typing.Optional["WorkspacesDirectoryActiveDirectoryConfig"], jsii.get(self, "activeDirectoryConfigInput"))

    @builtins.property
    @jsii.member(jsii_name="certificateBasedAuthPropertiesInput")
    def certificate_based_auth_properties_input(
        self,
    ) -> typing.Optional["WorkspacesDirectoryCertificateBasedAuthProperties"]:
        return typing.cast(typing.Optional["WorkspacesDirectoryCertificateBasedAuthProperties"], jsii.get(self, "certificateBasedAuthPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="directoryIdInput")
    def directory_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "directoryIdInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="ipGroupIdsInput")
    def ip_group_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "ipGroupIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="samlPropertiesInput")
    def saml_properties_input(
        self,
    ) -> typing.Optional["WorkspacesDirectorySamlProperties"]:
        return typing.cast(typing.Optional["WorkspacesDirectorySamlProperties"], jsii.get(self, "samlPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="selfServicePermissionsInput")
    def self_service_permissions_input(
        self,
    ) -> typing.Optional["WorkspacesDirectorySelfServicePermissions"]:
        return typing.cast(typing.Optional["WorkspacesDirectorySelfServicePermissions"], jsii.get(self, "selfServicePermissionsInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetIdsInput")
    def subnet_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "subnetIdsInput"))

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
    @jsii.member(jsii_name="userIdentityTypeInput")
    def user_identity_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "userIdentityTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="workspaceAccessPropertiesInput")
    def workspace_access_properties_input(
        self,
    ) -> typing.Optional["WorkspacesDirectoryWorkspaceAccessProperties"]:
        return typing.cast(typing.Optional["WorkspacesDirectoryWorkspaceAccessProperties"], jsii.get(self, "workspaceAccessPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="workspaceCreationPropertiesInput")
    def workspace_creation_properties_input(
        self,
    ) -> typing.Optional["WorkspacesDirectoryWorkspaceCreationProperties"]:
        return typing.cast(typing.Optional["WorkspacesDirectoryWorkspaceCreationProperties"], jsii.get(self, "workspaceCreationPropertiesInput"))

    @builtins.property
    @jsii.member(jsii_name="workspaceDirectoryDescriptionInput")
    def workspace_directory_description_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "workspaceDirectoryDescriptionInput"))

    @builtins.property
    @jsii.member(jsii_name="workspaceDirectoryNameInput")
    def workspace_directory_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "workspaceDirectoryNameInput"))

    @builtins.property
    @jsii.member(jsii_name="workspaceTypeInput")
    def workspace_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "workspaceTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="directoryId")
    def directory_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "directoryId"))

    @directory_id.setter
    def directory_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a9afd437bc917db55d4ae8092751020c9a8d01269676067a7b6b03bfe0176207)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "directoryId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1733388eda59d702cf1598bc0865cb39cf74c66074a1d8b59e2dc8baa72b5ad9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ipGroupIds")
    def ip_group_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "ipGroupIds"))

    @ip_group_ids.setter
    def ip_group_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__21757232d25b4bc048e907b37ed5504315601ee1dbb80d1eadf2d78f81eec691)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ipGroupIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnetIds")
    def subnet_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "subnetIds"))

    @subnet_ids.setter
    def subnet_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67f69334cf02501ef7d66a75654901e493da9ed4ea990673a6810ce64110b60d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnetIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__30378235067ccfdd5e0e0bc811f84bdfe397fa569a1f0dfe5b961e386601740d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__585fec125f99e81688dd717a93dc605e5b7f50a7342b5a5728c99a4387e8aa85)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userIdentityType")
    def user_identity_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "userIdentityType"))

    @user_identity_type.setter
    def user_identity_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e4973dad22ce001a0ef009c074153551e55d8fa79eef403e6a103af3538e592e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userIdentityType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="workspaceDirectoryDescription")
    def workspace_directory_description(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "workspaceDirectoryDescription"))

    @workspace_directory_description.setter
    def workspace_directory_description(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f1dc48de3437300e012cccf1cbfe675215a1aaabaf9d135b698fa70130313013)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "workspaceDirectoryDescription", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="workspaceDirectoryName")
    def workspace_directory_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "workspaceDirectoryName"))

    @workspace_directory_name.setter
    def workspace_directory_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1e3f0c51f4c340dc1d4e0386483e660be4c1c09e3a3d2a82be6e9269de75b216)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "workspaceDirectoryName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="workspaceType")
    def workspace_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "workspaceType"))

    @workspace_type.setter
    def workspace_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d1c747d9799286cf38616267c49aa36202d7859519fa46da8d0018d487244a91)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "workspaceType", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.workspacesDirectory.WorkspacesDirectoryActiveDirectoryConfig",
    jsii_struct_bases=[],
    name_mapping={
        "domain_name": "domainName",
        "service_account_secret_arn": "serviceAccountSecretArn",
    },
)
class WorkspacesDirectoryActiveDirectoryConfig:
    def __init__(
        self,
        *,
        domain_name: builtins.str,
        service_account_secret_arn: builtins.str,
    ) -> None:
        '''
        :param domain_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#domain_name WorkspacesDirectory#domain_name}.
        :param service_account_secret_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#service_account_secret_arn WorkspacesDirectory#service_account_secret_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78b8c00d8d2280a4acdfec7777698eb6d18e72a222f88eff52b73f7161f6be90)
            check_type(argname="argument domain_name", value=domain_name, expected_type=type_hints["domain_name"])
            check_type(argname="argument service_account_secret_arn", value=service_account_secret_arn, expected_type=type_hints["service_account_secret_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "domain_name": domain_name,
            "service_account_secret_arn": service_account_secret_arn,
        }

    @builtins.property
    def domain_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#domain_name WorkspacesDirectory#domain_name}.'''
        result = self._values.get("domain_name")
        assert result is not None, "Required property 'domain_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def service_account_secret_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#service_account_secret_arn WorkspacesDirectory#service_account_secret_arn}.'''
        result = self._values.get("service_account_secret_arn")
        assert result is not None, "Required property 'service_account_secret_arn' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "WorkspacesDirectoryActiveDirectoryConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class WorkspacesDirectoryActiveDirectoryConfigOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspacesDirectory.WorkspacesDirectoryActiveDirectoryConfigOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__46e1d836157be3faad729794f674f331b566beaf0679db7257baeb8343633c41)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="domainNameInput")
    def domain_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "domainNameInput"))

    @builtins.property
    @jsii.member(jsii_name="serviceAccountSecretArnInput")
    def service_account_secret_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "serviceAccountSecretArnInput"))

    @builtins.property
    @jsii.member(jsii_name="domainName")
    def domain_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "domainName"))

    @domain_name.setter
    def domain_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aacf0aff6870c5fc944e8c310c5968c566b991876f12522af16ad09ad19984da)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "domainName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="serviceAccountSecretArn")
    def service_account_secret_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "serviceAccountSecretArn"))

    @service_account_secret_arn.setter
    def service_account_secret_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__541c2a7ba98e9a00474d625325b2ea32b51b732fc7d1672d9ebff56df7af091a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "serviceAccountSecretArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[WorkspacesDirectoryActiveDirectoryConfig]:
        return typing.cast(typing.Optional[WorkspacesDirectoryActiveDirectoryConfig], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[WorkspacesDirectoryActiveDirectoryConfig],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c1cff8008f35550a0ae9e4cfaf054e0fc19ba1ebe5eb52493648a28b9919f44e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.workspacesDirectory.WorkspacesDirectoryCertificateBasedAuthProperties",
    jsii_struct_bases=[],
    name_mapping={
        "certificate_authority_arn": "certificateAuthorityArn",
        "status": "status",
    },
)
class WorkspacesDirectoryCertificateBasedAuthProperties:
    def __init__(
        self,
        *,
        certificate_authority_arn: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param certificate_authority_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#certificate_authority_arn WorkspacesDirectory#certificate_authority_arn}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#status WorkspacesDirectory#status}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f5dea4a216f9b568ffe4d74d1dd107959b33263924ab913ce43f4377cd6e6a2a)
            check_type(argname="argument certificate_authority_arn", value=certificate_authority_arn, expected_type=type_hints["certificate_authority_arn"])
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if certificate_authority_arn is not None:
            self._values["certificate_authority_arn"] = certificate_authority_arn
        if status is not None:
            self._values["status"] = status

    @builtins.property
    def certificate_authority_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#certificate_authority_arn WorkspacesDirectory#certificate_authority_arn}.'''
        result = self._values.get("certificate_authority_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#status WorkspacesDirectory#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "WorkspacesDirectoryCertificateBasedAuthProperties(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class WorkspacesDirectoryCertificateBasedAuthPropertiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspacesDirectory.WorkspacesDirectoryCertificateBasedAuthPropertiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ea4817cf952f3b7cacdf415aba3f3834779b8a63e2fdd9ec388156e3a6ef180c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCertificateAuthorityArn")
    def reset_certificate_authority_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCertificateAuthorityArn", []))

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @builtins.property
    @jsii.member(jsii_name="certificateAuthorityArnInput")
    def certificate_authority_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "certificateAuthorityArnInput"))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

    @builtins.property
    @jsii.member(jsii_name="certificateAuthorityArn")
    def certificate_authority_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "certificateAuthorityArn"))

    @certificate_authority_arn.setter
    def certificate_authority_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7949fe53bad158a891ce8471ac74b71515330c0693fdfa45a16d533623267b5e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "certificateAuthorityArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__97d9a17975ea276ac2d2dcecf45b9a2889b721d22cd18883ee4bf17b1f915603)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[WorkspacesDirectoryCertificateBasedAuthProperties]:
        return typing.cast(typing.Optional[WorkspacesDirectoryCertificateBasedAuthProperties], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[WorkspacesDirectoryCertificateBasedAuthProperties],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d5ac175b2d007550ff9c982392e080d1cf46cb040eda7d04b9d1457b97c7841d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.workspacesDirectory.WorkspacesDirectoryConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "active_directory_config": "activeDirectoryConfig",
        "certificate_based_auth_properties": "certificateBasedAuthProperties",
        "directory_id": "directoryId",
        "id": "id",
        "ip_group_ids": "ipGroupIds",
        "saml_properties": "samlProperties",
        "self_service_permissions": "selfServicePermissions",
        "subnet_ids": "subnetIds",
        "tags": "tags",
        "tags_all": "tagsAll",
        "user_identity_type": "userIdentityType",
        "workspace_access_properties": "workspaceAccessProperties",
        "workspace_creation_properties": "workspaceCreationProperties",
        "workspace_directory_description": "workspaceDirectoryDescription",
        "workspace_directory_name": "workspaceDirectoryName",
        "workspace_type": "workspaceType",
    },
)
class WorkspacesDirectoryConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        active_directory_config: typing.Optional[typing.Union[WorkspacesDirectoryActiveDirectoryConfig, typing.Dict[builtins.str, typing.Any]]] = None,
        certificate_based_auth_properties: typing.Optional[typing.Union[WorkspacesDirectoryCertificateBasedAuthProperties, typing.Dict[builtins.str, typing.Any]]] = None,
        directory_id: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        ip_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        saml_properties: typing.Optional[typing.Union["WorkspacesDirectorySamlProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        self_service_permissions: typing.Optional[typing.Union["WorkspacesDirectorySelfServicePermissions", typing.Dict[builtins.str, typing.Any]]] = None,
        subnet_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        user_identity_type: typing.Optional[builtins.str] = None,
        workspace_access_properties: typing.Optional[typing.Union["WorkspacesDirectoryWorkspaceAccessProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        workspace_creation_properties: typing.Optional[typing.Union["WorkspacesDirectoryWorkspaceCreationProperties", typing.Dict[builtins.str, typing.Any]]] = None,
        workspace_directory_description: typing.Optional[builtins.str] = None,
        workspace_directory_name: typing.Optional[builtins.str] = None,
        workspace_type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param active_directory_config: active_directory_config block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#active_directory_config WorkspacesDirectory#active_directory_config}
        :param certificate_based_auth_properties: certificate_based_auth_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#certificate_based_auth_properties WorkspacesDirectory#certificate_based_auth_properties}
        :param directory_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#directory_id WorkspacesDirectory#directory_id}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#id WorkspacesDirectory#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param ip_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#ip_group_ids WorkspacesDirectory#ip_group_ids}.
        :param saml_properties: saml_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#saml_properties WorkspacesDirectory#saml_properties}
        :param self_service_permissions: self_service_permissions block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#self_service_permissions WorkspacesDirectory#self_service_permissions}
        :param subnet_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#subnet_ids WorkspacesDirectory#subnet_ids}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags WorkspacesDirectory#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags_all WorkspacesDirectory#tags_all}.
        :param user_identity_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_identity_type WorkspacesDirectory#user_identity_type}.
        :param workspace_access_properties: workspace_access_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_access_properties WorkspacesDirectory#workspace_access_properties}
        :param workspace_creation_properties: workspace_creation_properties block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_creation_properties WorkspacesDirectory#workspace_creation_properties}
        :param workspace_directory_description: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_description WorkspacesDirectory#workspace_directory_description}.
        :param workspace_directory_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_name WorkspacesDirectory#workspace_directory_name}.
        :param workspace_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_type WorkspacesDirectory#workspace_type}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(active_directory_config, dict):
            active_directory_config = WorkspacesDirectoryActiveDirectoryConfig(**active_directory_config)
        if isinstance(certificate_based_auth_properties, dict):
            certificate_based_auth_properties = WorkspacesDirectoryCertificateBasedAuthProperties(**certificate_based_auth_properties)
        if isinstance(saml_properties, dict):
            saml_properties = WorkspacesDirectorySamlProperties(**saml_properties)
        if isinstance(self_service_permissions, dict):
            self_service_permissions = WorkspacesDirectorySelfServicePermissions(**self_service_permissions)
        if isinstance(workspace_access_properties, dict):
            workspace_access_properties = WorkspacesDirectoryWorkspaceAccessProperties(**workspace_access_properties)
        if isinstance(workspace_creation_properties, dict):
            workspace_creation_properties = WorkspacesDirectoryWorkspaceCreationProperties(**workspace_creation_properties)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f4df1526561254840e4ba53cf75a5855f0e00b3e7c2fd0df26fe260c9715a333)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument active_directory_config", value=active_directory_config, expected_type=type_hints["active_directory_config"])
            check_type(argname="argument certificate_based_auth_properties", value=certificate_based_auth_properties, expected_type=type_hints["certificate_based_auth_properties"])
            check_type(argname="argument directory_id", value=directory_id, expected_type=type_hints["directory_id"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument ip_group_ids", value=ip_group_ids, expected_type=type_hints["ip_group_ids"])
            check_type(argname="argument saml_properties", value=saml_properties, expected_type=type_hints["saml_properties"])
            check_type(argname="argument self_service_permissions", value=self_service_permissions, expected_type=type_hints["self_service_permissions"])
            check_type(argname="argument subnet_ids", value=subnet_ids, expected_type=type_hints["subnet_ids"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument user_identity_type", value=user_identity_type, expected_type=type_hints["user_identity_type"])
            check_type(argname="argument workspace_access_properties", value=workspace_access_properties, expected_type=type_hints["workspace_access_properties"])
            check_type(argname="argument workspace_creation_properties", value=workspace_creation_properties, expected_type=type_hints["workspace_creation_properties"])
            check_type(argname="argument workspace_directory_description", value=workspace_directory_description, expected_type=type_hints["workspace_directory_description"])
            check_type(argname="argument workspace_directory_name", value=workspace_directory_name, expected_type=type_hints["workspace_directory_name"])
            check_type(argname="argument workspace_type", value=workspace_type, expected_type=type_hints["workspace_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
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
        if active_directory_config is not None:
            self._values["active_directory_config"] = active_directory_config
        if certificate_based_auth_properties is not None:
            self._values["certificate_based_auth_properties"] = certificate_based_auth_properties
        if directory_id is not None:
            self._values["directory_id"] = directory_id
        if id is not None:
            self._values["id"] = id
        if ip_group_ids is not None:
            self._values["ip_group_ids"] = ip_group_ids
        if saml_properties is not None:
            self._values["saml_properties"] = saml_properties
        if self_service_permissions is not None:
            self._values["self_service_permissions"] = self_service_permissions
        if subnet_ids is not None:
            self._values["subnet_ids"] = subnet_ids
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if user_identity_type is not None:
            self._values["user_identity_type"] = user_identity_type
        if workspace_access_properties is not None:
            self._values["workspace_access_properties"] = workspace_access_properties
        if workspace_creation_properties is not None:
            self._values["workspace_creation_properties"] = workspace_creation_properties
        if workspace_directory_description is not None:
            self._values["workspace_directory_description"] = workspace_directory_description
        if workspace_directory_name is not None:
            self._values["workspace_directory_name"] = workspace_directory_name
        if workspace_type is not None:
            self._values["workspace_type"] = workspace_type

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
    def active_directory_config(
        self,
    ) -> typing.Optional[WorkspacesDirectoryActiveDirectoryConfig]:
        '''active_directory_config block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#active_directory_config WorkspacesDirectory#active_directory_config}
        '''
        result = self._values.get("active_directory_config")
        return typing.cast(typing.Optional[WorkspacesDirectoryActiveDirectoryConfig], result)

    @builtins.property
    def certificate_based_auth_properties(
        self,
    ) -> typing.Optional[WorkspacesDirectoryCertificateBasedAuthProperties]:
        '''certificate_based_auth_properties block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#certificate_based_auth_properties WorkspacesDirectory#certificate_based_auth_properties}
        '''
        result = self._values.get("certificate_based_auth_properties")
        return typing.cast(typing.Optional[WorkspacesDirectoryCertificateBasedAuthProperties], result)

    @builtins.property
    def directory_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#directory_id WorkspacesDirectory#directory_id}.'''
        result = self._values.get("directory_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#id WorkspacesDirectory#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ip_group_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#ip_group_ids WorkspacesDirectory#ip_group_ids}.'''
        result = self._values.get("ip_group_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def saml_properties(self) -> typing.Optional["WorkspacesDirectorySamlProperties"]:
        '''saml_properties block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#saml_properties WorkspacesDirectory#saml_properties}
        '''
        result = self._values.get("saml_properties")
        return typing.cast(typing.Optional["WorkspacesDirectorySamlProperties"], result)

    @builtins.property
    def self_service_permissions(
        self,
    ) -> typing.Optional["WorkspacesDirectorySelfServicePermissions"]:
        '''self_service_permissions block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#self_service_permissions WorkspacesDirectory#self_service_permissions}
        '''
        result = self._values.get("self_service_permissions")
        return typing.cast(typing.Optional["WorkspacesDirectorySelfServicePermissions"], result)

    @builtins.property
    def subnet_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#subnet_ids WorkspacesDirectory#subnet_ids}.'''
        result = self._values.get("subnet_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags WorkspacesDirectory#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#tags_all WorkspacesDirectory#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def user_identity_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_identity_type WorkspacesDirectory#user_identity_type}.'''
        result = self._values.get("user_identity_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def workspace_access_properties(
        self,
    ) -> typing.Optional["WorkspacesDirectoryWorkspaceAccessProperties"]:
        '''workspace_access_properties block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_access_properties WorkspacesDirectory#workspace_access_properties}
        '''
        result = self._values.get("workspace_access_properties")
        return typing.cast(typing.Optional["WorkspacesDirectoryWorkspaceAccessProperties"], result)

    @builtins.property
    def workspace_creation_properties(
        self,
    ) -> typing.Optional["WorkspacesDirectoryWorkspaceCreationProperties"]:
        '''workspace_creation_properties block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_creation_properties WorkspacesDirectory#workspace_creation_properties}
        '''
        result = self._values.get("workspace_creation_properties")
        return typing.cast(typing.Optional["WorkspacesDirectoryWorkspaceCreationProperties"], result)

    @builtins.property
    def workspace_directory_description(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_description WorkspacesDirectory#workspace_directory_description}.'''
        result = self._values.get("workspace_directory_description")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def workspace_directory_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_directory_name WorkspacesDirectory#workspace_directory_name}.'''
        result = self._values.get("workspace_directory_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def workspace_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#workspace_type WorkspacesDirectory#workspace_type}.'''
        result = self._values.get("workspace_type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "WorkspacesDirectoryConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.workspacesDirectory.WorkspacesDirectorySamlProperties",
    jsii_struct_bases=[],
    name_mapping={
        "relay_state_parameter_name": "relayStateParameterName",
        "status": "status",
        "user_access_url": "userAccessUrl",
    },
)
class WorkspacesDirectorySamlProperties:
    def __init__(
        self,
        *,
        relay_state_parameter_name: typing.Optional[builtins.str] = None,
        status: typing.Optional[builtins.str] = None,
        user_access_url: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param relay_state_parameter_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#relay_state_parameter_name WorkspacesDirectory#relay_state_parameter_name}.
        :param status: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#status WorkspacesDirectory#status}.
        :param user_access_url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_access_url WorkspacesDirectory#user_access_url}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4188c7427c3d9ab6ce1720df676c8a4ed38995f5232bbe4d0403becd373e1c90)
            check_type(argname="argument relay_state_parameter_name", value=relay_state_parameter_name, expected_type=type_hints["relay_state_parameter_name"])
            check_type(argname="argument status", value=status, expected_type=type_hints["status"])
            check_type(argname="argument user_access_url", value=user_access_url, expected_type=type_hints["user_access_url"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if relay_state_parameter_name is not None:
            self._values["relay_state_parameter_name"] = relay_state_parameter_name
        if status is not None:
            self._values["status"] = status
        if user_access_url is not None:
            self._values["user_access_url"] = user_access_url

    @builtins.property
    def relay_state_parameter_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#relay_state_parameter_name WorkspacesDirectory#relay_state_parameter_name}.'''
        result = self._values.get("relay_state_parameter_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def status(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#status WorkspacesDirectory#status}.'''
        result = self._values.get("status")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def user_access_url(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_access_url WorkspacesDirectory#user_access_url}.'''
        result = self._values.get("user_access_url")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "WorkspacesDirectorySamlProperties(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class WorkspacesDirectorySamlPropertiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspacesDirectory.WorkspacesDirectorySamlPropertiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__433913a880e30ad03201ce55e9f31fa05914d86d327f07bb467f5ebd25712a71)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetRelayStateParameterName")
    def reset_relay_state_parameter_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRelayStateParameterName", []))

    @jsii.member(jsii_name="resetStatus")
    def reset_status(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatus", []))

    @jsii.member(jsii_name="resetUserAccessUrl")
    def reset_user_access_url(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUserAccessUrl", []))

    @builtins.property
    @jsii.member(jsii_name="relayStateParameterNameInput")
    def relay_state_parameter_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "relayStateParameterNameInput"))

    @builtins.property
    @jsii.member(jsii_name="statusInput")
    def status_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusInput"))

    @builtins.property
    @jsii.member(jsii_name="userAccessUrlInput")
    def user_access_url_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "userAccessUrlInput"))

    @builtins.property
    @jsii.member(jsii_name="relayStateParameterName")
    def relay_state_parameter_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "relayStateParameterName"))

    @relay_state_parameter_name.setter
    def relay_state_parameter_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a155858e501b9528f546aaef99c083b722db66a9e4d5024c0ff986070095658)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "relayStateParameterName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="status")
    def status(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "status"))

    @status.setter
    def status(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3f81ab1bbb82838471ee29938aabd4e06682e201543a82227ca1fdbeccb8ca2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "status", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userAccessUrl")
    def user_access_url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "userAccessUrl"))

    @user_access_url.setter
    def user_access_url(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d69208ccfb39f43ffe8c4871b606436143f7cfac53bcf1b2874978d5c77618f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userAccessUrl", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[WorkspacesDirectorySamlProperties]:
        return typing.cast(typing.Optional[WorkspacesDirectorySamlProperties], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[WorkspacesDirectorySamlProperties],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4b3b2341bf4911d577af0d78ddcd31ee9806a6f8dda096d7cd94b1294827f40a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.workspacesDirectory.WorkspacesDirectorySelfServicePermissions",
    jsii_struct_bases=[],
    name_mapping={
        "change_compute_type": "changeComputeType",
        "increase_volume_size": "increaseVolumeSize",
        "rebuild_workspace": "rebuildWorkspace",
        "restart_workspace": "restartWorkspace",
        "switch_running_mode": "switchRunningMode",
    },
)
class WorkspacesDirectorySelfServicePermissions:
    def __init__(
        self,
        *,
        change_compute_type: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        increase_volume_size: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        rebuild_workspace: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        restart_workspace: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        switch_running_mode: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param change_compute_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#change_compute_type WorkspacesDirectory#change_compute_type}.
        :param increase_volume_size: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#increase_volume_size WorkspacesDirectory#increase_volume_size}.
        :param rebuild_workspace: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#rebuild_workspace WorkspacesDirectory#rebuild_workspace}.
        :param restart_workspace: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#restart_workspace WorkspacesDirectory#restart_workspace}.
        :param switch_running_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#switch_running_mode WorkspacesDirectory#switch_running_mode}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d6e72baa336d6b7c1a889982ec7b26c8e8ecb729dea955a61d8de5f89f28265d)
            check_type(argname="argument change_compute_type", value=change_compute_type, expected_type=type_hints["change_compute_type"])
            check_type(argname="argument increase_volume_size", value=increase_volume_size, expected_type=type_hints["increase_volume_size"])
            check_type(argname="argument rebuild_workspace", value=rebuild_workspace, expected_type=type_hints["rebuild_workspace"])
            check_type(argname="argument restart_workspace", value=restart_workspace, expected_type=type_hints["restart_workspace"])
            check_type(argname="argument switch_running_mode", value=switch_running_mode, expected_type=type_hints["switch_running_mode"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if change_compute_type is not None:
            self._values["change_compute_type"] = change_compute_type
        if increase_volume_size is not None:
            self._values["increase_volume_size"] = increase_volume_size
        if rebuild_workspace is not None:
            self._values["rebuild_workspace"] = rebuild_workspace
        if restart_workspace is not None:
            self._values["restart_workspace"] = restart_workspace
        if switch_running_mode is not None:
            self._values["switch_running_mode"] = switch_running_mode

    @builtins.property
    def change_compute_type(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#change_compute_type WorkspacesDirectory#change_compute_type}.'''
        result = self._values.get("change_compute_type")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def increase_volume_size(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#increase_volume_size WorkspacesDirectory#increase_volume_size}.'''
        result = self._values.get("increase_volume_size")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def rebuild_workspace(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#rebuild_workspace WorkspacesDirectory#rebuild_workspace}.'''
        result = self._values.get("rebuild_workspace")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def restart_workspace(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#restart_workspace WorkspacesDirectory#restart_workspace}.'''
        result = self._values.get("restart_workspace")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def switch_running_mode(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#switch_running_mode WorkspacesDirectory#switch_running_mode}.'''
        result = self._values.get("switch_running_mode")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "WorkspacesDirectorySelfServicePermissions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class WorkspacesDirectorySelfServicePermissionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspacesDirectory.WorkspacesDirectorySelfServicePermissionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8f87bcf01f28f94ab06f48c0e0e66b69e17956af506076a2e322ffdd293ea782)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetChangeComputeType")
    def reset_change_compute_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetChangeComputeType", []))

    @jsii.member(jsii_name="resetIncreaseVolumeSize")
    def reset_increase_volume_size(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIncreaseVolumeSize", []))

    @jsii.member(jsii_name="resetRebuildWorkspace")
    def reset_rebuild_workspace(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRebuildWorkspace", []))

    @jsii.member(jsii_name="resetRestartWorkspace")
    def reset_restart_workspace(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRestartWorkspace", []))

    @jsii.member(jsii_name="resetSwitchRunningMode")
    def reset_switch_running_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSwitchRunningMode", []))

    @builtins.property
    @jsii.member(jsii_name="changeComputeTypeInput")
    def change_compute_type_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "changeComputeTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="increaseVolumeSizeInput")
    def increase_volume_size_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "increaseVolumeSizeInput"))

    @builtins.property
    @jsii.member(jsii_name="rebuildWorkspaceInput")
    def rebuild_workspace_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "rebuildWorkspaceInput"))

    @builtins.property
    @jsii.member(jsii_name="restartWorkspaceInput")
    def restart_workspace_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "restartWorkspaceInput"))

    @builtins.property
    @jsii.member(jsii_name="switchRunningModeInput")
    def switch_running_mode_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "switchRunningModeInput"))

    @builtins.property
    @jsii.member(jsii_name="changeComputeType")
    def change_compute_type(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "changeComputeType"))

    @change_compute_type.setter
    def change_compute_type(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e40b5fff59cfcea41de15471b655b63a2762a3314a3dffc3fa9c815f1d49b678)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "changeComputeType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="increaseVolumeSize")
    def increase_volume_size(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "increaseVolumeSize"))

    @increase_volume_size.setter
    def increase_volume_size(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__139fa0303176915c2fa0535fcf9d498aea7ed1ee3db6f0c83357c13572be7db6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "increaseVolumeSize", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="rebuildWorkspace")
    def rebuild_workspace(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "rebuildWorkspace"))

    @rebuild_workspace.setter
    def rebuild_workspace(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db76b26c990211da2c45801b90e6ba12d5c1f2ecc8ba991c0100ef8668145db0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rebuildWorkspace", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="restartWorkspace")
    def restart_workspace(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "restartWorkspace"))

    @restart_workspace.setter
    def restart_workspace(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f515f5c6ccc0ead6fa46e4e78fd47fe778bd5dae52aeb45dce934f19e4779d20)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "restartWorkspace", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="switchRunningMode")
    def switch_running_mode(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "switchRunningMode"))

    @switch_running_mode.setter
    def switch_running_mode(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d7c0228c8691912e5e88bdffc66d720e807f08db1d86bdc5f5e02ab569e6fc63)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "switchRunningMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[WorkspacesDirectorySelfServicePermissions]:
        return typing.cast(typing.Optional[WorkspacesDirectorySelfServicePermissions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[WorkspacesDirectorySelfServicePermissions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2aaee8f2c9de884514fe1baf67994e1cf7a9787a9594063662edf23409efdcf5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.workspacesDirectory.WorkspacesDirectoryWorkspaceAccessProperties",
    jsii_struct_bases=[],
    name_mapping={
        "device_type_android": "deviceTypeAndroid",
        "device_type_chromeos": "deviceTypeChromeos",
        "device_type_ios": "deviceTypeIos",
        "device_type_linux": "deviceTypeLinux",
        "device_type_osx": "deviceTypeOsx",
        "device_type_web": "deviceTypeWeb",
        "device_type_windows": "deviceTypeWindows",
        "device_type_zeroclient": "deviceTypeZeroclient",
    },
)
class WorkspacesDirectoryWorkspaceAccessProperties:
    def __init__(
        self,
        *,
        device_type_android: typing.Optional[builtins.str] = None,
        device_type_chromeos: typing.Optional[builtins.str] = None,
        device_type_ios: typing.Optional[builtins.str] = None,
        device_type_linux: typing.Optional[builtins.str] = None,
        device_type_osx: typing.Optional[builtins.str] = None,
        device_type_web: typing.Optional[builtins.str] = None,
        device_type_windows: typing.Optional[builtins.str] = None,
        device_type_zeroclient: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param device_type_android: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_android WorkspacesDirectory#device_type_android}.
        :param device_type_chromeos: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_chromeos WorkspacesDirectory#device_type_chromeos}.
        :param device_type_ios: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_ios WorkspacesDirectory#device_type_ios}.
        :param device_type_linux: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_linux WorkspacesDirectory#device_type_linux}.
        :param device_type_osx: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_osx WorkspacesDirectory#device_type_osx}.
        :param device_type_web: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_web WorkspacesDirectory#device_type_web}.
        :param device_type_windows: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_windows WorkspacesDirectory#device_type_windows}.
        :param device_type_zeroclient: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_zeroclient WorkspacesDirectory#device_type_zeroclient}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9c04fd37055483b5b8eb8d77e6bde365c7b805ddc328472a40e10b3971671f0a)
            check_type(argname="argument device_type_android", value=device_type_android, expected_type=type_hints["device_type_android"])
            check_type(argname="argument device_type_chromeos", value=device_type_chromeos, expected_type=type_hints["device_type_chromeos"])
            check_type(argname="argument device_type_ios", value=device_type_ios, expected_type=type_hints["device_type_ios"])
            check_type(argname="argument device_type_linux", value=device_type_linux, expected_type=type_hints["device_type_linux"])
            check_type(argname="argument device_type_osx", value=device_type_osx, expected_type=type_hints["device_type_osx"])
            check_type(argname="argument device_type_web", value=device_type_web, expected_type=type_hints["device_type_web"])
            check_type(argname="argument device_type_windows", value=device_type_windows, expected_type=type_hints["device_type_windows"])
            check_type(argname="argument device_type_zeroclient", value=device_type_zeroclient, expected_type=type_hints["device_type_zeroclient"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if device_type_android is not None:
            self._values["device_type_android"] = device_type_android
        if device_type_chromeos is not None:
            self._values["device_type_chromeos"] = device_type_chromeos
        if device_type_ios is not None:
            self._values["device_type_ios"] = device_type_ios
        if device_type_linux is not None:
            self._values["device_type_linux"] = device_type_linux
        if device_type_osx is not None:
            self._values["device_type_osx"] = device_type_osx
        if device_type_web is not None:
            self._values["device_type_web"] = device_type_web
        if device_type_windows is not None:
            self._values["device_type_windows"] = device_type_windows
        if device_type_zeroclient is not None:
            self._values["device_type_zeroclient"] = device_type_zeroclient

    @builtins.property
    def device_type_android(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_android WorkspacesDirectory#device_type_android}.'''
        result = self._values.get("device_type_android")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def device_type_chromeos(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_chromeos WorkspacesDirectory#device_type_chromeos}.'''
        result = self._values.get("device_type_chromeos")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def device_type_ios(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_ios WorkspacesDirectory#device_type_ios}.'''
        result = self._values.get("device_type_ios")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def device_type_linux(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_linux WorkspacesDirectory#device_type_linux}.'''
        result = self._values.get("device_type_linux")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def device_type_osx(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_osx WorkspacesDirectory#device_type_osx}.'''
        result = self._values.get("device_type_osx")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def device_type_web(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_web WorkspacesDirectory#device_type_web}.'''
        result = self._values.get("device_type_web")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def device_type_windows(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_windows WorkspacesDirectory#device_type_windows}.'''
        result = self._values.get("device_type_windows")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def device_type_zeroclient(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_zeroclient WorkspacesDirectory#device_type_zeroclient}.'''
        result = self._values.get("device_type_zeroclient")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "WorkspacesDirectoryWorkspaceAccessProperties(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class WorkspacesDirectoryWorkspaceAccessPropertiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspacesDirectory.WorkspacesDirectoryWorkspaceAccessPropertiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__864f939c7cf7d6e1d008c8b2dfebe6ecf63b38ad24e5dc9c684fc2688d3a5ec1)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDeviceTypeAndroid")
    def reset_device_type_android(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeviceTypeAndroid", []))

    @jsii.member(jsii_name="resetDeviceTypeChromeos")
    def reset_device_type_chromeos(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeviceTypeChromeos", []))

    @jsii.member(jsii_name="resetDeviceTypeIos")
    def reset_device_type_ios(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeviceTypeIos", []))

    @jsii.member(jsii_name="resetDeviceTypeLinux")
    def reset_device_type_linux(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeviceTypeLinux", []))

    @jsii.member(jsii_name="resetDeviceTypeOsx")
    def reset_device_type_osx(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeviceTypeOsx", []))

    @jsii.member(jsii_name="resetDeviceTypeWeb")
    def reset_device_type_web(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeviceTypeWeb", []))

    @jsii.member(jsii_name="resetDeviceTypeWindows")
    def reset_device_type_windows(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeviceTypeWindows", []))

    @jsii.member(jsii_name="resetDeviceTypeZeroclient")
    def reset_device_type_zeroclient(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeviceTypeZeroclient", []))

    @builtins.property
    @jsii.member(jsii_name="deviceTypeAndroidInput")
    def device_type_android_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deviceTypeAndroidInput"))

    @builtins.property
    @jsii.member(jsii_name="deviceTypeChromeosInput")
    def device_type_chromeos_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deviceTypeChromeosInput"))

    @builtins.property
    @jsii.member(jsii_name="deviceTypeIosInput")
    def device_type_ios_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deviceTypeIosInput"))

    @builtins.property
    @jsii.member(jsii_name="deviceTypeLinuxInput")
    def device_type_linux_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deviceTypeLinuxInput"))

    @builtins.property
    @jsii.member(jsii_name="deviceTypeOsxInput")
    def device_type_osx_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deviceTypeOsxInput"))

    @builtins.property
    @jsii.member(jsii_name="deviceTypeWebInput")
    def device_type_web_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deviceTypeWebInput"))

    @builtins.property
    @jsii.member(jsii_name="deviceTypeWindowsInput")
    def device_type_windows_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deviceTypeWindowsInput"))

    @builtins.property
    @jsii.member(jsii_name="deviceTypeZeroclientInput")
    def device_type_zeroclient_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deviceTypeZeroclientInput"))

    @builtins.property
    @jsii.member(jsii_name="deviceTypeAndroid")
    def device_type_android(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deviceTypeAndroid"))

    @device_type_android.setter
    def device_type_android(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a2e34bc949c66f88dce53758479af8c800aa85596f96d643aa7d819ce26850aa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deviceTypeAndroid", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deviceTypeChromeos")
    def device_type_chromeos(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deviceTypeChromeos"))

    @device_type_chromeos.setter
    def device_type_chromeos(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5263cfacf2c03f9282701efb047294b1609282f39a20e5f988649f7cb32dcc82)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deviceTypeChromeos", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deviceTypeIos")
    def device_type_ios(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deviceTypeIos"))

    @device_type_ios.setter
    def device_type_ios(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aabcad90432ffef1d9285f6fb7f35cc1750efe02af4de955db71f911ab1e8458)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deviceTypeIos", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deviceTypeLinux")
    def device_type_linux(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deviceTypeLinux"))

    @device_type_linux.setter
    def device_type_linux(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eaf2d7d3418ca60d66414a3d6a3d301660b372844c3219f2cda793d9e813e513)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deviceTypeLinux", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deviceTypeOsx")
    def device_type_osx(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deviceTypeOsx"))

    @device_type_osx.setter
    def device_type_osx(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fca190cb44e2ec8cf177faecfd76e5c68cf7f2a474ce2065570eb68dbe56e19f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deviceTypeOsx", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deviceTypeWeb")
    def device_type_web(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deviceTypeWeb"))

    @device_type_web.setter
    def device_type_web(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__790e64a51ae2c81917d5885e6ff89f0efea1acac3f0364c27b1121d4a789220a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deviceTypeWeb", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deviceTypeWindows")
    def device_type_windows(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deviceTypeWindows"))

    @device_type_windows.setter
    def device_type_windows(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__345fe752089f833cf323e17c746c403fa39cfba268e1296e4c3b418414f22555)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deviceTypeWindows", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deviceTypeZeroclient")
    def device_type_zeroclient(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deviceTypeZeroclient"))

    @device_type_zeroclient.setter
    def device_type_zeroclient(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__87f881fb81c664d92a1bbcae01defbcef60ea8083cc502c6bbaf487f13bbf512)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deviceTypeZeroclient", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[WorkspacesDirectoryWorkspaceAccessProperties]:
        return typing.cast(typing.Optional[WorkspacesDirectoryWorkspaceAccessProperties], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[WorkspacesDirectoryWorkspaceAccessProperties],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2faa4f6a9aecaeac8b8e6c714bba0f38689bda457b69aa1ed6d6fbb21d617ae6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.workspacesDirectory.WorkspacesDirectoryWorkspaceCreationProperties",
    jsii_struct_bases=[],
    name_mapping={
        "custom_security_group_id": "customSecurityGroupId",
        "default_ou": "defaultOu",
        "enable_internet_access": "enableInternetAccess",
        "enable_maintenance_mode": "enableMaintenanceMode",
        "user_enabled_as_local_administrator": "userEnabledAsLocalAdministrator",
    },
)
class WorkspacesDirectoryWorkspaceCreationProperties:
    def __init__(
        self,
        *,
        custom_security_group_id: typing.Optional[builtins.str] = None,
        default_ou: typing.Optional[builtins.str] = None,
        enable_internet_access: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_maintenance_mode: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        user_enabled_as_local_administrator: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param custom_security_group_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#custom_security_group_id WorkspacesDirectory#custom_security_group_id}.
        :param default_ou: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#default_ou WorkspacesDirectory#default_ou}.
        :param enable_internet_access: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#enable_internet_access WorkspacesDirectory#enable_internet_access}.
        :param enable_maintenance_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#enable_maintenance_mode WorkspacesDirectory#enable_maintenance_mode}.
        :param user_enabled_as_local_administrator: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_enabled_as_local_administrator WorkspacesDirectory#user_enabled_as_local_administrator}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f991291c614d0c4efdbcd4d0049a80221c2c14473d58358343b10ee039baefe)
            check_type(argname="argument custom_security_group_id", value=custom_security_group_id, expected_type=type_hints["custom_security_group_id"])
            check_type(argname="argument default_ou", value=default_ou, expected_type=type_hints["default_ou"])
            check_type(argname="argument enable_internet_access", value=enable_internet_access, expected_type=type_hints["enable_internet_access"])
            check_type(argname="argument enable_maintenance_mode", value=enable_maintenance_mode, expected_type=type_hints["enable_maintenance_mode"])
            check_type(argname="argument user_enabled_as_local_administrator", value=user_enabled_as_local_administrator, expected_type=type_hints["user_enabled_as_local_administrator"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if custom_security_group_id is not None:
            self._values["custom_security_group_id"] = custom_security_group_id
        if default_ou is not None:
            self._values["default_ou"] = default_ou
        if enable_internet_access is not None:
            self._values["enable_internet_access"] = enable_internet_access
        if enable_maintenance_mode is not None:
            self._values["enable_maintenance_mode"] = enable_maintenance_mode
        if user_enabled_as_local_administrator is not None:
            self._values["user_enabled_as_local_administrator"] = user_enabled_as_local_administrator

    @builtins.property
    def custom_security_group_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#custom_security_group_id WorkspacesDirectory#custom_security_group_id}.'''
        result = self._values.get("custom_security_group_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def default_ou(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#default_ou WorkspacesDirectory#default_ou}.'''
        result = self._values.get("default_ou")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def enable_internet_access(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#enable_internet_access WorkspacesDirectory#enable_internet_access}.'''
        result = self._values.get("enable_internet_access")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_maintenance_mode(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#enable_maintenance_mode WorkspacesDirectory#enable_maintenance_mode}.'''
        result = self._values.get("enable_maintenance_mode")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def user_enabled_as_local_administrator(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_enabled_as_local_administrator WorkspacesDirectory#user_enabled_as_local_administrator}.'''
        result = self._values.get("user_enabled_as_local_administrator")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "WorkspacesDirectoryWorkspaceCreationProperties(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class WorkspacesDirectoryWorkspaceCreationPropertiesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspacesDirectory.WorkspacesDirectoryWorkspaceCreationPropertiesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ee9f988b8ebc8e227f83c224a149c3e3584d81d1d7957d6dc86c7a9f863eb291)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCustomSecurityGroupId")
    def reset_custom_security_group_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomSecurityGroupId", []))

    @jsii.member(jsii_name="resetDefaultOu")
    def reset_default_ou(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultOu", []))

    @jsii.member(jsii_name="resetEnableInternetAccess")
    def reset_enable_internet_access(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableInternetAccess", []))

    @jsii.member(jsii_name="resetEnableMaintenanceMode")
    def reset_enable_maintenance_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableMaintenanceMode", []))

    @jsii.member(jsii_name="resetUserEnabledAsLocalAdministrator")
    def reset_user_enabled_as_local_administrator(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUserEnabledAsLocalAdministrator", []))

    @builtins.property
    @jsii.member(jsii_name="customSecurityGroupIdInput")
    def custom_security_group_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "customSecurityGroupIdInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultOuInput")
    def default_ou_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultOuInput"))

    @builtins.property
    @jsii.member(jsii_name="enableInternetAccessInput")
    def enable_internet_access_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableInternetAccessInput"))

    @builtins.property
    @jsii.member(jsii_name="enableMaintenanceModeInput")
    def enable_maintenance_mode_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableMaintenanceModeInput"))

    @builtins.property
    @jsii.member(jsii_name="userEnabledAsLocalAdministratorInput")
    def user_enabled_as_local_administrator_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "userEnabledAsLocalAdministratorInput"))

    @builtins.property
    @jsii.member(jsii_name="customSecurityGroupId")
    def custom_security_group_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "customSecurityGroupId"))

    @custom_security_group_id.setter
    def custom_security_group_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d7a3bef76f4215c9240d187d631c99c219ecdc764966105c8aa3ea8530dd7669)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "customSecurityGroupId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="defaultOu")
    def default_ou(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultOu"))

    @default_ou.setter
    def default_ou(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fa581ef48ae6de1d364d36c184b5e34f28ee7f8773aa579f702e3238cc6e84c6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultOu", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enableInternetAccess")
    def enable_internet_access(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableInternetAccess"))

    @enable_internet_access.setter
    def enable_internet_access(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f51b5aa38af79900722a416598b3fc9daa5455ce8e11121fb86d6168f85a31a9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableInternetAccess", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enableMaintenanceMode")
    def enable_maintenance_mode(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableMaintenanceMode"))

    @enable_maintenance_mode.setter
    def enable_maintenance_mode(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__90ce2e61f56605bd288033a0852bc7c102bec4a5fd0c7bad192c3d58b1edaebc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableMaintenanceMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userEnabledAsLocalAdministrator")
    def user_enabled_as_local_administrator(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "userEnabledAsLocalAdministrator"))

    @user_enabled_as_local_administrator.setter
    def user_enabled_as_local_administrator(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__55bb2bc2c9616a216bf0348ae7ac5355191a5deee9a84e3d0c89118a48ab6f16)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userEnabledAsLocalAdministrator", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[WorkspacesDirectoryWorkspaceCreationProperties]:
        return typing.cast(typing.Optional[WorkspacesDirectoryWorkspaceCreationProperties], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[WorkspacesDirectoryWorkspaceCreationProperties],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5471c630e9c55c345fc760afac33c7a89c36df9cf67be02e3895b6309bbbb06f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "WorkspacesDirectory",
    "WorkspacesDirectoryActiveDirectoryConfig",
    "WorkspacesDirectoryActiveDirectoryConfigOutputReference",
    "WorkspacesDirectoryCertificateBasedAuthProperties",
    "WorkspacesDirectoryCertificateBasedAuthPropertiesOutputReference",
    "WorkspacesDirectoryConfig",
    "WorkspacesDirectorySamlProperties",
    "WorkspacesDirectorySamlPropertiesOutputReference",
    "WorkspacesDirectorySelfServicePermissions",
    "WorkspacesDirectorySelfServicePermissionsOutputReference",
    "WorkspacesDirectoryWorkspaceAccessProperties",
    "WorkspacesDirectoryWorkspaceAccessPropertiesOutputReference",
    "WorkspacesDirectoryWorkspaceCreationProperties",
    "WorkspacesDirectoryWorkspaceCreationPropertiesOutputReference",
]

publication.publish()

def _typecheckingstub__83ce5e93a7a7e1d9e503854f1252d9d9b4755f2f6cdc3bab30bdc6e5111955e2(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    active_directory_config: typing.Optional[typing.Union[WorkspacesDirectoryActiveDirectoryConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    certificate_based_auth_properties: typing.Optional[typing.Union[WorkspacesDirectoryCertificateBasedAuthProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    directory_id: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    ip_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    saml_properties: typing.Optional[typing.Union[WorkspacesDirectorySamlProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    self_service_permissions: typing.Optional[typing.Union[WorkspacesDirectorySelfServicePermissions, typing.Dict[builtins.str, typing.Any]]] = None,
    subnet_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    user_identity_type: typing.Optional[builtins.str] = None,
    workspace_access_properties: typing.Optional[typing.Union[WorkspacesDirectoryWorkspaceAccessProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    workspace_creation_properties: typing.Optional[typing.Union[WorkspacesDirectoryWorkspaceCreationProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    workspace_directory_description: typing.Optional[builtins.str] = None,
    workspace_directory_name: typing.Optional[builtins.str] = None,
    workspace_type: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__e7787b19eb69eba338f18d27c97885fb580913d53fa8c3518d7e49203ced7b79(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a9afd437bc917db55d4ae8092751020c9a8d01269676067a7b6b03bfe0176207(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1733388eda59d702cf1598bc0865cb39cf74c66074a1d8b59e2dc8baa72b5ad9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21757232d25b4bc048e907b37ed5504315601ee1dbb80d1eadf2d78f81eec691(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67f69334cf02501ef7d66a75654901e493da9ed4ea990673a6810ce64110b60d(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30378235067ccfdd5e0e0bc811f84bdfe397fa569a1f0dfe5b961e386601740d(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__585fec125f99e81688dd717a93dc605e5b7f50a7342b5a5728c99a4387e8aa85(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e4973dad22ce001a0ef009c074153551e55d8fa79eef403e6a103af3538e592e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1dc48de3437300e012cccf1cbfe675215a1aaabaf9d135b698fa70130313013(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1e3f0c51f4c340dc1d4e0386483e660be4c1c09e3a3d2a82be6e9269de75b216(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1c747d9799286cf38616267c49aa36202d7859519fa46da8d0018d487244a91(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78b8c00d8d2280a4acdfec7777698eb6d18e72a222f88eff52b73f7161f6be90(
    *,
    domain_name: builtins.str,
    service_account_secret_arn: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46e1d836157be3faad729794f674f331b566beaf0679db7257baeb8343633c41(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aacf0aff6870c5fc944e8c310c5968c566b991876f12522af16ad09ad19984da(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__541c2a7ba98e9a00474d625325b2ea32b51b732fc7d1672d9ebff56df7af091a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c1cff8008f35550a0ae9e4cfaf054e0fc19ba1ebe5eb52493648a28b9919f44e(
    value: typing.Optional[WorkspacesDirectoryActiveDirectoryConfig],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5dea4a216f9b568ffe4d74d1dd107959b33263924ab913ce43f4377cd6e6a2a(
    *,
    certificate_authority_arn: typing.Optional[builtins.str] = None,
    status: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea4817cf952f3b7cacdf415aba3f3834779b8a63e2fdd9ec388156e3a6ef180c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7949fe53bad158a891ce8471ac74b71515330c0693fdfa45a16d533623267b5e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__97d9a17975ea276ac2d2dcecf45b9a2889b721d22cd18883ee4bf17b1f915603(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5ac175b2d007550ff9c982392e080d1cf46cb040eda7d04b9d1457b97c7841d(
    value: typing.Optional[WorkspacesDirectoryCertificateBasedAuthProperties],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f4df1526561254840e4ba53cf75a5855f0e00b3e7c2fd0df26fe260c9715a333(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    active_directory_config: typing.Optional[typing.Union[WorkspacesDirectoryActiveDirectoryConfig, typing.Dict[builtins.str, typing.Any]]] = None,
    certificate_based_auth_properties: typing.Optional[typing.Union[WorkspacesDirectoryCertificateBasedAuthProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    directory_id: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    ip_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    saml_properties: typing.Optional[typing.Union[WorkspacesDirectorySamlProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    self_service_permissions: typing.Optional[typing.Union[WorkspacesDirectorySelfServicePermissions, typing.Dict[builtins.str, typing.Any]]] = None,
    subnet_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    user_identity_type: typing.Optional[builtins.str] = None,
    workspace_access_properties: typing.Optional[typing.Union[WorkspacesDirectoryWorkspaceAccessProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    workspace_creation_properties: typing.Optional[typing.Union[WorkspacesDirectoryWorkspaceCreationProperties, typing.Dict[builtins.str, typing.Any]]] = None,
    workspace_directory_description: typing.Optional[builtins.str] = None,
    workspace_directory_name: typing.Optional[builtins.str] = None,
    workspace_type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4188c7427c3d9ab6ce1720df676c8a4ed38995f5232bbe4d0403becd373e1c90(
    *,
    relay_state_parameter_name: typing.Optional[builtins.str] = None,
    status: typing.Optional[builtins.str] = None,
    user_access_url: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__433913a880e30ad03201ce55e9f31fa05914d86d327f07bb467f5ebd25712a71(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a155858e501b9528f546aaef99c083b722db66a9e4d5024c0ff986070095658(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3f81ab1bbb82838471ee29938aabd4e06682e201543a82227ca1fdbeccb8ca2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d69208ccfb39f43ffe8c4871b606436143f7cfac53bcf1b2874978d5c77618f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b3b2341bf4911d577af0d78ddcd31ee9806a6f8dda096d7cd94b1294827f40a(
    value: typing.Optional[WorkspacesDirectorySamlProperties],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d6e72baa336d6b7c1a889982ec7b26c8e8ecb729dea955a61d8de5f89f28265d(
    *,
    change_compute_type: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    increase_volume_size: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    rebuild_workspace: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    restart_workspace: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    switch_running_mode: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8f87bcf01f28f94ab06f48c0e0e66b69e17956af506076a2e322ffdd293ea782(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e40b5fff59cfcea41de15471b655b63a2762a3314a3dffc3fa9c815f1d49b678(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__139fa0303176915c2fa0535fcf9d498aea7ed1ee3db6f0c83357c13572be7db6(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db76b26c990211da2c45801b90e6ba12d5c1f2ecc8ba991c0100ef8668145db0(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f515f5c6ccc0ead6fa46e4e78fd47fe778bd5dae52aeb45dce934f19e4779d20(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7c0228c8691912e5e88bdffc66d720e807f08db1d86bdc5f5e02ab569e6fc63(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2aaee8f2c9de884514fe1baf67994e1cf7a9787a9594063662edf23409efdcf5(
    value: typing.Optional[WorkspacesDirectorySelfServicePermissions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c04fd37055483b5b8eb8d77e6bde365c7b805ddc328472a40e10b3971671f0a(
    *,
    device_type_android: typing.Optional[builtins.str] = None,
    device_type_chromeos: typing.Optional[builtins.str] = None,
    device_type_ios: typing.Optional[builtins.str] = None,
    device_type_linux: typing.Optional[builtins.str] = None,
    device_type_osx: typing.Optional[builtins.str] = None,
    device_type_web: typing.Optional[builtins.str] = None,
    device_type_windows: typing.Optional[builtins.str] = None,
    device_type_zeroclient: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__864f939c7cf7d6e1d008c8b2dfebe6ecf63b38ad24e5dc9c684fc2688d3a5ec1(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a2e34bc949c66f88dce53758479af8c800aa85596f96d643aa7d819ce26850aa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5263cfacf2c03f9282701efb047294b1609282f39a20e5f988649f7cb32dcc82(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aabcad90432ffef1d9285f6fb7f35cc1750efe02af4de955db71f911ab1e8458(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eaf2d7d3418ca60d66414a3d6a3d301660b372844c3219f2cda793d9e813e513(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fca190cb44e2ec8cf177faecfd76e5c68cf7f2a474ce2065570eb68dbe56e19f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__790e64a51ae2c81917d5885e6ff89f0efea1acac3f0364c27b1121d4a789220a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__345fe752089f833cf323e17c746c403fa39cfba268e1296e4c3b418414f22555(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__87f881fb81c664d92a1bbcae01defbcef60ea8083cc502c6bbaf487f13bbf512(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2faa4f6a9aecaeac8b8e6c714bba0f38689bda457b69aa1ed6d6fbb21d617ae6(
    value: typing.Optional[WorkspacesDirectoryWorkspaceAccessProperties],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f991291c614d0c4efdbcd4d0049a80221c2c14473d58358343b10ee039baefe(
    *,
    custom_security_group_id: typing.Optional[builtins.str] = None,
    default_ou: typing.Optional[builtins.str] = None,
    enable_internet_access: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_maintenance_mode: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    user_enabled_as_local_administrator: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee9f988b8ebc8e227f83c224a149c3e3584d81d1d7957d6dc86c7a9f863eb291(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d7a3bef76f4215c9240d187d631c99c219ecdc764966105c8aa3ea8530dd7669(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fa581ef48ae6de1d364d36c184b5e34f28ee7f8773aa579f702e3238cc6e84c6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f51b5aa38af79900722a416598b3fc9daa5455ce8e11121fb86d6168f85a31a9(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__90ce2e61f56605bd288033a0852bc7c102bec4a5fd0c7bad192c3d58b1edaebc(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__55bb2bc2c9616a216bf0348ae7ac5355191a5deee9a84e3d0c89118a48ab6f16(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5471c630e9c55c345fc760afac33c7a89c36df9cf67be02e3895b6309bbbb06f(
    value: typing.Optional[WorkspacesDirectoryWorkspaceCreationProperties],
) -> None:
    """Type checking stubs"""
    pass
