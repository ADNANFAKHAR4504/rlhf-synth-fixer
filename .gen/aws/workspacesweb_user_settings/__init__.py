r'''
# `aws_workspacesweb_user_settings`

Refer to the Terraform Registry for docs: [`aws_workspacesweb_user_settings`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings).
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


class WorkspaceswebUserSettings(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettings",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings aws_workspacesweb_user_settings}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        copy_allowed: builtins.str,
        download_allowed: builtins.str,
        paste_allowed: builtins.str,
        print_allowed: builtins.str,
        upload_allowed: builtins.str,
        additional_encryption_context: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        cookie_synchronization_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["WorkspaceswebUserSettingsCookieSynchronizationConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        customer_managed_key: typing.Optional[builtins.str] = None,
        deep_link_allowed: typing.Optional[builtins.str] = None,
        disconnect_timeout_in_minutes: typing.Optional[jsii.Number] = None,
        idle_disconnect_timeout_in_minutes: typing.Optional[jsii.Number] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        toolbar_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["WorkspaceswebUserSettingsToolbarConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings aws_workspacesweb_user_settings} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param copy_allowed: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#copy_allowed WorkspaceswebUserSettings#copy_allowed}.
        :param download_allowed: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#download_allowed WorkspaceswebUserSettings#download_allowed}.
        :param paste_allowed: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#paste_allowed WorkspaceswebUserSettings#paste_allowed}.
        :param print_allowed: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#print_allowed WorkspaceswebUserSettings#print_allowed}.
        :param upload_allowed: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#upload_allowed WorkspaceswebUserSettings#upload_allowed}.
        :param additional_encryption_context: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#additional_encryption_context WorkspaceswebUserSettings#additional_encryption_context}.
        :param cookie_synchronization_configuration: cookie_synchronization_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#cookie_synchronization_configuration WorkspaceswebUserSettings#cookie_synchronization_configuration}
        :param customer_managed_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#customer_managed_key WorkspaceswebUserSettings#customer_managed_key}.
        :param deep_link_allowed: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#deep_link_allowed WorkspaceswebUserSettings#deep_link_allowed}.
        :param disconnect_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#disconnect_timeout_in_minutes WorkspaceswebUserSettings#disconnect_timeout_in_minutes}.
        :param idle_disconnect_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#idle_disconnect_timeout_in_minutes WorkspaceswebUserSettings#idle_disconnect_timeout_in_minutes}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#tags WorkspaceswebUserSettings#tags}.
        :param toolbar_configuration: toolbar_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#toolbar_configuration WorkspaceswebUserSettings#toolbar_configuration}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6d9ca78d4b79d4c65ad4889e815e7057442c7e8da790dda63ae051cf468e2215)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = WorkspaceswebUserSettingsConfig(
            copy_allowed=copy_allowed,
            download_allowed=download_allowed,
            paste_allowed=paste_allowed,
            print_allowed=print_allowed,
            upload_allowed=upload_allowed,
            additional_encryption_context=additional_encryption_context,
            cookie_synchronization_configuration=cookie_synchronization_configuration,
            customer_managed_key=customer_managed_key,
            deep_link_allowed=deep_link_allowed,
            disconnect_timeout_in_minutes=disconnect_timeout_in_minutes,
            idle_disconnect_timeout_in_minutes=idle_disconnect_timeout_in_minutes,
            tags=tags,
            toolbar_configuration=toolbar_configuration,
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
        '''Generates CDKTF code for importing a WorkspaceswebUserSettings resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the WorkspaceswebUserSettings to import.
        :param import_from_id: The id of the existing WorkspaceswebUserSettings that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the WorkspaceswebUserSettings to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c48ade516705e56be0f2a337b8f97cae0eb9d360a5e5994eb2d5eed7fa0c9430)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putCookieSynchronizationConfiguration")
    def put_cookie_synchronization_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["WorkspaceswebUserSettingsCookieSynchronizationConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1d306a9c8f7d4f5865342b7191032bef463e1d86af03c30c157fcedeea305fef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCookieSynchronizationConfiguration", [value]))

    @jsii.member(jsii_name="putToolbarConfiguration")
    def put_toolbar_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["WorkspaceswebUserSettingsToolbarConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ef02db3d2a385e9e900d3630c7e7f04fce05cc7a675ca36bcce41dcd64f78da)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putToolbarConfiguration", [value]))

    @jsii.member(jsii_name="resetAdditionalEncryptionContext")
    def reset_additional_encryption_context(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAdditionalEncryptionContext", []))

    @jsii.member(jsii_name="resetCookieSynchronizationConfiguration")
    def reset_cookie_synchronization_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCookieSynchronizationConfiguration", []))

    @jsii.member(jsii_name="resetCustomerManagedKey")
    def reset_customer_managed_key(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomerManagedKey", []))

    @jsii.member(jsii_name="resetDeepLinkAllowed")
    def reset_deep_link_allowed(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeepLinkAllowed", []))

    @jsii.member(jsii_name="resetDisconnectTimeoutInMinutes")
    def reset_disconnect_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDisconnectTimeoutInMinutes", []))

    @jsii.member(jsii_name="resetIdleDisconnectTimeoutInMinutes")
    def reset_idle_disconnect_timeout_in_minutes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdleDisconnectTimeoutInMinutes", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetToolbarConfiguration")
    def reset_toolbar_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetToolbarConfiguration", []))

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
    @jsii.member(jsii_name="associatedPortalArns")
    def associated_portal_arns(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "associatedPortalArns"))

    @builtins.property
    @jsii.member(jsii_name="cookieSynchronizationConfiguration")
    def cookie_synchronization_configuration(
        self,
    ) -> "WorkspaceswebUserSettingsCookieSynchronizationConfigurationList":
        return typing.cast("WorkspaceswebUserSettingsCookieSynchronizationConfigurationList", jsii.get(self, "cookieSynchronizationConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> _cdktf_9a9027ec.StringMap:
        return typing.cast(_cdktf_9a9027ec.StringMap, jsii.get(self, "tagsAll"))

    @builtins.property
    @jsii.member(jsii_name="toolbarConfiguration")
    def toolbar_configuration(
        self,
    ) -> "WorkspaceswebUserSettingsToolbarConfigurationList":
        return typing.cast("WorkspaceswebUserSettingsToolbarConfigurationList", jsii.get(self, "toolbarConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="userSettingsArn")
    def user_settings_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "userSettingsArn"))

    @builtins.property
    @jsii.member(jsii_name="additionalEncryptionContextInput")
    def additional_encryption_context_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "additionalEncryptionContextInput"))

    @builtins.property
    @jsii.member(jsii_name="cookieSynchronizationConfigurationInput")
    def cookie_synchronization_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["WorkspaceswebUserSettingsCookieSynchronizationConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["WorkspaceswebUserSettingsCookieSynchronizationConfiguration"]]], jsii.get(self, "cookieSynchronizationConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="copyAllowedInput")
    def copy_allowed_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "copyAllowedInput"))

    @builtins.property
    @jsii.member(jsii_name="customerManagedKeyInput")
    def customer_managed_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "customerManagedKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="deepLinkAllowedInput")
    def deep_link_allowed_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deepLinkAllowedInput"))

    @builtins.property
    @jsii.member(jsii_name="disconnectTimeoutInMinutesInput")
    def disconnect_timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "disconnectTimeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="downloadAllowedInput")
    def download_allowed_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "downloadAllowedInput"))

    @builtins.property
    @jsii.member(jsii_name="idleDisconnectTimeoutInMinutesInput")
    def idle_disconnect_timeout_in_minutes_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "idleDisconnectTimeoutInMinutesInput"))

    @builtins.property
    @jsii.member(jsii_name="pasteAllowedInput")
    def paste_allowed_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "pasteAllowedInput"))

    @builtins.property
    @jsii.member(jsii_name="printAllowedInput")
    def print_allowed_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "printAllowedInput"))

    @builtins.property
    @jsii.member(jsii_name="tagsInput")
    def tags_input(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "tagsInput"))

    @builtins.property
    @jsii.member(jsii_name="toolbarConfigurationInput")
    def toolbar_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["WorkspaceswebUserSettingsToolbarConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["WorkspaceswebUserSettingsToolbarConfiguration"]]], jsii.get(self, "toolbarConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="uploadAllowedInput")
    def upload_allowed_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "uploadAllowedInput"))

    @builtins.property
    @jsii.member(jsii_name="additionalEncryptionContext")
    def additional_encryption_context(
        self,
    ) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "additionalEncryptionContext"))

    @additional_encryption_context.setter
    def additional_encryption_context(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6119c7c894a10c792b243bf8677f7cd6a065ac98db1fdf0961ff6a7349e6b2f8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "additionalEncryptionContext", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="copyAllowed")
    def copy_allowed(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "copyAllowed"))

    @copy_allowed.setter
    def copy_allowed(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86053d46b199fd8d02168569bfbc05ce6b41c76cfb60c819362de3da5c7aeefe)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "copyAllowed", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="customerManagedKey")
    def customer_managed_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "customerManagedKey"))

    @customer_managed_key.setter
    def customer_managed_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f3347e649f963c654ffff314abaf8bc778fbf855d1b276b8cebb0cbf60574c4e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "customerManagedKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="deepLinkAllowed")
    def deep_link_allowed(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "deepLinkAllowed"))

    @deep_link_allowed.setter
    def deep_link_allowed(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86397781adc0cc76c881dcb38038a7d6d726e4de11b4a4088041824d4c3e02a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "deepLinkAllowed", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="disconnectTimeoutInMinutes")
    def disconnect_timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "disconnectTimeoutInMinutes"))

    @disconnect_timeout_in_minutes.setter
    def disconnect_timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d0e06c5865c0cbd16254c9e141402fe180fe44ec27084ad29120f1fa6579e4d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "disconnectTimeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="downloadAllowed")
    def download_allowed(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "downloadAllowed"))

    @download_allowed.setter
    def download_allowed(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__54d51f76f68cc6fde8f153936bbb249ca3bdd05b24b15c9c0a2f6fc44ca3836f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "downloadAllowed", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="idleDisconnectTimeoutInMinutes")
    def idle_disconnect_timeout_in_minutes(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "idleDisconnectTimeoutInMinutes"))

    @idle_disconnect_timeout_in_minutes.setter
    def idle_disconnect_timeout_in_minutes(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c9fee713ade42a0ba066b3a0c2f8ea2c4fb4744ac0e30c01ac89de94778eec4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "idleDisconnectTimeoutInMinutes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="pasteAllowed")
    def paste_allowed(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "pasteAllowed"))

    @paste_allowed.setter
    def paste_allowed(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f58b68c9d08dac16c925f5fe448bab1fe57b4fd572dbe6302187f3b740ad9c89)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "pasteAllowed", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="printAllowed")
    def print_allowed(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "printAllowed"))

    @print_allowed.setter
    def print_allowed(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f0b51ad5ae9c81d2998888eb49182aac080718d137b63b75eceee871f37e7d54)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "printAllowed", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24221b9adb12811093406367ef0cb829b51fd2d60b1384d823749c0ecf55be6c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="uploadAllowed")
    def upload_allowed(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "uploadAllowed"))

    @upload_allowed.setter
    def upload_allowed(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fdc6495e26f5c465b78a6a93091a2498b7596a9891146d41bf2f574f57d2adbf)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "uploadAllowed", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "copy_allowed": "copyAllowed",
        "download_allowed": "downloadAllowed",
        "paste_allowed": "pasteAllowed",
        "print_allowed": "printAllowed",
        "upload_allowed": "uploadAllowed",
        "additional_encryption_context": "additionalEncryptionContext",
        "cookie_synchronization_configuration": "cookieSynchronizationConfiguration",
        "customer_managed_key": "customerManagedKey",
        "deep_link_allowed": "deepLinkAllowed",
        "disconnect_timeout_in_minutes": "disconnectTimeoutInMinutes",
        "idle_disconnect_timeout_in_minutes": "idleDisconnectTimeoutInMinutes",
        "tags": "tags",
        "toolbar_configuration": "toolbarConfiguration",
    },
)
class WorkspaceswebUserSettingsConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        copy_allowed: builtins.str,
        download_allowed: builtins.str,
        paste_allowed: builtins.str,
        print_allowed: builtins.str,
        upload_allowed: builtins.str,
        additional_encryption_context: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        cookie_synchronization_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["WorkspaceswebUserSettingsCookieSynchronizationConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        customer_managed_key: typing.Optional[builtins.str] = None,
        deep_link_allowed: typing.Optional[builtins.str] = None,
        disconnect_timeout_in_minutes: typing.Optional[jsii.Number] = None,
        idle_disconnect_timeout_in_minutes: typing.Optional[jsii.Number] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        toolbar_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["WorkspaceswebUserSettingsToolbarConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param copy_allowed: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#copy_allowed WorkspaceswebUserSettings#copy_allowed}.
        :param download_allowed: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#download_allowed WorkspaceswebUserSettings#download_allowed}.
        :param paste_allowed: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#paste_allowed WorkspaceswebUserSettings#paste_allowed}.
        :param print_allowed: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#print_allowed WorkspaceswebUserSettings#print_allowed}.
        :param upload_allowed: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#upload_allowed WorkspaceswebUserSettings#upload_allowed}.
        :param additional_encryption_context: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#additional_encryption_context WorkspaceswebUserSettings#additional_encryption_context}.
        :param cookie_synchronization_configuration: cookie_synchronization_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#cookie_synchronization_configuration WorkspaceswebUserSettings#cookie_synchronization_configuration}
        :param customer_managed_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#customer_managed_key WorkspaceswebUserSettings#customer_managed_key}.
        :param deep_link_allowed: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#deep_link_allowed WorkspaceswebUserSettings#deep_link_allowed}.
        :param disconnect_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#disconnect_timeout_in_minutes WorkspaceswebUserSettings#disconnect_timeout_in_minutes}.
        :param idle_disconnect_timeout_in_minutes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#idle_disconnect_timeout_in_minutes WorkspaceswebUserSettings#idle_disconnect_timeout_in_minutes}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#tags WorkspaceswebUserSettings#tags}.
        :param toolbar_configuration: toolbar_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#toolbar_configuration WorkspaceswebUserSettings#toolbar_configuration}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__85324c9dbfb778a33f61573a6e35ddb680760c6095104949b2e51b9951967823)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument copy_allowed", value=copy_allowed, expected_type=type_hints["copy_allowed"])
            check_type(argname="argument download_allowed", value=download_allowed, expected_type=type_hints["download_allowed"])
            check_type(argname="argument paste_allowed", value=paste_allowed, expected_type=type_hints["paste_allowed"])
            check_type(argname="argument print_allowed", value=print_allowed, expected_type=type_hints["print_allowed"])
            check_type(argname="argument upload_allowed", value=upload_allowed, expected_type=type_hints["upload_allowed"])
            check_type(argname="argument additional_encryption_context", value=additional_encryption_context, expected_type=type_hints["additional_encryption_context"])
            check_type(argname="argument cookie_synchronization_configuration", value=cookie_synchronization_configuration, expected_type=type_hints["cookie_synchronization_configuration"])
            check_type(argname="argument customer_managed_key", value=customer_managed_key, expected_type=type_hints["customer_managed_key"])
            check_type(argname="argument deep_link_allowed", value=deep_link_allowed, expected_type=type_hints["deep_link_allowed"])
            check_type(argname="argument disconnect_timeout_in_minutes", value=disconnect_timeout_in_minutes, expected_type=type_hints["disconnect_timeout_in_minutes"])
            check_type(argname="argument idle_disconnect_timeout_in_minutes", value=idle_disconnect_timeout_in_minutes, expected_type=type_hints["idle_disconnect_timeout_in_minutes"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument toolbar_configuration", value=toolbar_configuration, expected_type=type_hints["toolbar_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "copy_allowed": copy_allowed,
            "download_allowed": download_allowed,
            "paste_allowed": paste_allowed,
            "print_allowed": print_allowed,
            "upload_allowed": upload_allowed,
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
        if additional_encryption_context is not None:
            self._values["additional_encryption_context"] = additional_encryption_context
        if cookie_synchronization_configuration is not None:
            self._values["cookie_synchronization_configuration"] = cookie_synchronization_configuration
        if customer_managed_key is not None:
            self._values["customer_managed_key"] = customer_managed_key
        if deep_link_allowed is not None:
            self._values["deep_link_allowed"] = deep_link_allowed
        if disconnect_timeout_in_minutes is not None:
            self._values["disconnect_timeout_in_minutes"] = disconnect_timeout_in_minutes
        if idle_disconnect_timeout_in_minutes is not None:
            self._values["idle_disconnect_timeout_in_minutes"] = idle_disconnect_timeout_in_minutes
        if tags is not None:
            self._values["tags"] = tags
        if toolbar_configuration is not None:
            self._values["toolbar_configuration"] = toolbar_configuration

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
    def copy_allowed(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#copy_allowed WorkspaceswebUserSettings#copy_allowed}.'''
        result = self._values.get("copy_allowed")
        assert result is not None, "Required property 'copy_allowed' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def download_allowed(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#download_allowed WorkspaceswebUserSettings#download_allowed}.'''
        result = self._values.get("download_allowed")
        assert result is not None, "Required property 'download_allowed' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def paste_allowed(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#paste_allowed WorkspaceswebUserSettings#paste_allowed}.'''
        result = self._values.get("paste_allowed")
        assert result is not None, "Required property 'paste_allowed' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def print_allowed(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#print_allowed WorkspaceswebUserSettings#print_allowed}.'''
        result = self._values.get("print_allowed")
        assert result is not None, "Required property 'print_allowed' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def upload_allowed(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#upload_allowed WorkspaceswebUserSettings#upload_allowed}.'''
        result = self._values.get("upload_allowed")
        assert result is not None, "Required property 'upload_allowed' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def additional_encryption_context(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#additional_encryption_context WorkspaceswebUserSettings#additional_encryption_context}.'''
        result = self._values.get("additional_encryption_context")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def cookie_synchronization_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["WorkspaceswebUserSettingsCookieSynchronizationConfiguration"]]]:
        '''cookie_synchronization_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#cookie_synchronization_configuration WorkspaceswebUserSettings#cookie_synchronization_configuration}
        '''
        result = self._values.get("cookie_synchronization_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["WorkspaceswebUserSettingsCookieSynchronizationConfiguration"]]], result)

    @builtins.property
    def customer_managed_key(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#customer_managed_key WorkspaceswebUserSettings#customer_managed_key}.'''
        result = self._values.get("customer_managed_key")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def deep_link_allowed(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#deep_link_allowed WorkspaceswebUserSettings#deep_link_allowed}.'''
        result = self._values.get("deep_link_allowed")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def disconnect_timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#disconnect_timeout_in_minutes WorkspaceswebUserSettings#disconnect_timeout_in_minutes}.'''
        result = self._values.get("disconnect_timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def idle_disconnect_timeout_in_minutes(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#idle_disconnect_timeout_in_minutes WorkspaceswebUserSettings#idle_disconnect_timeout_in_minutes}.'''
        result = self._values.get("idle_disconnect_timeout_in_minutes")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#tags WorkspaceswebUserSettings#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def toolbar_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["WorkspaceswebUserSettingsToolbarConfiguration"]]]:
        '''toolbar_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#toolbar_configuration WorkspaceswebUserSettings#toolbar_configuration}
        '''
        result = self._values.get("toolbar_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["WorkspaceswebUserSettingsToolbarConfiguration"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "WorkspaceswebUserSettingsConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfiguration",
    jsii_struct_bases=[],
    name_mapping={"allowlist": "allowlist", "blocklist": "blocklist"},
)
class WorkspaceswebUserSettingsCookieSynchronizationConfiguration:
    def __init__(
        self,
        *,
        allowlist: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct", typing.Dict[builtins.str, typing.Any]]]]] = None,
        blocklist: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param allowlist: allowlist block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#allowlist WorkspaceswebUserSettings#allowlist}
        :param blocklist: blocklist block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#blocklist WorkspaceswebUserSettings#blocklist}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9f8c37e08e6deae931d184f73052691666395a67391888b3ea504e03209dd6a1)
            check_type(argname="argument allowlist", value=allowlist, expected_type=type_hints["allowlist"])
            check_type(argname="argument blocklist", value=blocklist, expected_type=type_hints["blocklist"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if allowlist is not None:
            self._values["allowlist"] = allowlist
        if blocklist is not None:
            self._values["blocklist"] = blocklist

    @builtins.property
    def allowlist(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct"]]]:
        '''allowlist block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#allowlist WorkspaceswebUserSettings#allowlist}
        '''
        result = self._values.get("allowlist")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct"]]], result)

    @builtins.property
    def blocklist(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct"]]]:
        '''blocklist block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#blocklist WorkspaceswebUserSettings#blocklist}
        '''
        result = self._values.get("blocklist")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "WorkspaceswebUserSettingsCookieSynchronizationConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct",
    jsii_struct_bases=[],
    name_mapping={"domain": "domain", "name": "name", "path": "path"},
)
class WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct:
    def __init__(
        self,
        *,
        domain: builtins.str,
        name: typing.Optional[builtins.str] = None,
        path: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param domain: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#domain WorkspaceswebUserSettings#domain}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#name WorkspaceswebUserSettings#name}.
        :param path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#path WorkspaceswebUserSettings#path}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__24ac674fb12dc46389c259a476f4120552692d1bc0bd43c8c7bf773dd3afcf36)
            check_type(argname="argument domain", value=domain, expected_type=type_hints["domain"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument path", value=path, expected_type=type_hints["path"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "domain": domain,
        }
        if name is not None:
            self._values["name"] = name
        if path is not None:
            self._values["path"] = path

    @builtins.property
    def domain(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#domain WorkspaceswebUserSettings#domain}.'''
        result = self._values.get("domain")
        assert result is not None, "Required property 'domain' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#name WorkspaceswebUserSettings#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#path WorkspaceswebUserSettings#path}.'''
        result = self._values.get("path")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStructList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStructList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__03dff6a314d2b28d3c0722bfd49a516d424f9e10ebcbfa428fe58b381a5679e0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStructOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__beb0d8bdb327171919ca121bd8a1dca7c8f6a7c78b9abe21e6ca99229a00c810)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStructOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0d165a51ffaa24cec43ebb1dec3d7251f084264703776f623578a05fc2ec684c)
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
            type_hints = typing.get_type_hints(_typecheckingstub__99a35b9587ea9c61f44c9ea27221d85ae487c829af60d759a6d88d22345353bb)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a20c044ae647a159a00ea63c03856e4c702e7d14504d03dbd51a50d6e43227ed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e95a2e6ca2d42a2eeaf9810079de4671e0c45ca22f739501b469f432c032312f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStructOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStructOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ee2d32f1094d6a0ec37f65df6d49319c87c7fe52a320984d910a1be2bf8e453a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetPath")
    def reset_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPath", []))

    @builtins.property
    @jsii.member(jsii_name="domainInput")
    def domain_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "domainInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="pathInput")
    def path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "pathInput"))

    @builtins.property
    @jsii.member(jsii_name="domain")
    def domain(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "domain"))

    @domain.setter
    def domain(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__56946c93351efb82ceb50476c59f6f6ac3be6dd7bda4355cc63bb46aafd7c8b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "domain", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fee4d5a11a6062447faaa5c2ec2e7200e475670b2c7004219485bfb37602b46a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="path")
    def path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "path"))

    @path.setter
    def path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e176f2d3161571c99ff9e7f408d89d78458dadeeb4374b0e02b6203fd95b75e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "path", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8572f14e4ce3cfcf91fb77b10600c645153432f43b84d23e42c48cc58b030e97)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct",
    jsii_struct_bases=[],
    name_mapping={"domain": "domain", "name": "name", "path": "path"},
)
class WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct:
    def __init__(
        self,
        *,
        domain: builtins.str,
        name: typing.Optional[builtins.str] = None,
        path: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param domain: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#domain WorkspaceswebUserSettings#domain}.
        :param name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#name WorkspaceswebUserSettings#name}.
        :param path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#path WorkspaceswebUserSettings#path}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f90f0f756e92ba004500cd7ab95d5a4e859a52ef0d18218d8779e6273c39ffd4)
            check_type(argname="argument domain", value=domain, expected_type=type_hints["domain"])
            check_type(argname="argument name", value=name, expected_type=type_hints["name"])
            check_type(argname="argument path", value=path, expected_type=type_hints["path"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "domain": domain,
        }
        if name is not None:
            self._values["name"] = name
        if path is not None:
            self._values["path"] = path

    @builtins.property
    def domain(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#domain WorkspaceswebUserSettings#domain}.'''
        result = self._values.get("domain")
        assert result is not None, "Required property 'domain' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#name WorkspaceswebUserSettings#name}.'''
        result = self._values.get("name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#path WorkspaceswebUserSettings#path}.'''
        result = self._values.get("path")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStructList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStructList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a6050be5757260c54ca417455b327830332fc15f38ab84c79e425e125a236748)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStructOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d8570517e81484d804c9318c76a53c3f25d02f3ca877b95a0637ed30d5432378)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStructOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__47cea5f758332f8b0347deed2a0c4b938264e733caa30a003786055c4dedd53b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__85f726937f1acf3227fcfd7271b59c7c6107d88a75f5bcaf00b7a286f75db348)
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
            type_hints = typing.get_type_hints(_typecheckingstub__a0164028651160da34ea6449b1a11737845228618d9e941784d2f1858776cd38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e2761e61499e281787bb7ceec965ec5049056ed14c14d756ebf6b68d644327e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStructOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStructOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4f9720cc9a31877d1829a4b8a5db488b9e6e4d82c63bc5c535cc70d8d5e46488)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetName")
    def reset_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetName", []))

    @jsii.member(jsii_name="resetPath")
    def reset_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPath", []))

    @builtins.property
    @jsii.member(jsii_name="domainInput")
    def domain_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "domainInput"))

    @builtins.property
    @jsii.member(jsii_name="nameInput")
    def name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "nameInput"))

    @builtins.property
    @jsii.member(jsii_name="pathInput")
    def path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "pathInput"))

    @builtins.property
    @jsii.member(jsii_name="domain")
    def domain(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "domain"))

    @domain.setter
    def domain(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0b9a28e0c859427b11b113b4caeea3ea2be6d69e4911483b9acb98ba3277ff82)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "domain", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @name.setter
    def name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__67f0676369dfe2e63727a9e04d2d0325e5578f2f44cc3ad78b42e2b6264ab7a3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "name", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="path")
    def path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "path"))

    @path.setter
    def path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7505ef7e01c0094a71b1f1cdc3aeb1440523e7f9fd1f038119ee0d5821726506)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "path", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6bd2b33899cca432fddb9d5e337466fea107fcadc301063711b75cedc7d5776)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class WorkspaceswebUserSettingsCookieSynchronizationConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e9ebab46adb22bf48118b81921fbe5264f9d025374a04e91c5f855cb4baba92c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "WorkspaceswebUserSettingsCookieSynchronizationConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__719d763a14c504d8e31ebf9e8ba41d40235c33a02185880988ddf98a5963f1c8)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("WorkspaceswebUserSettingsCookieSynchronizationConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0707a6c310202f1ad6d3afc62d7760dc667ec53d865038e7c49d5c4841a772fe)
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
            type_hints = typing.get_type_hints(_typecheckingstub__440486c2d86dc9d59960f5cbf7ab240a59e225f472567f469f96923bcb898474)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c3b9e86eb278b0bd8c23017a7fcdd807d0ce02298d7fda5ffcf9d6dad3c23826)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__45b89e050d448ddd1ccea154d585edea5f1897d9de205b07e9678c1087dddae0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class WorkspaceswebUserSettingsCookieSynchronizationConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2c2145203d61551c46682c5d8a71da69d140761ebccef3c4aabe5d681be13aca)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putAllowlist")
    def put_allowlist(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3bb427b5c18b83ca2d6652e513d610d0419950f2a29d082f8126e1cf2880c99b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putAllowlist", [value]))

    @jsii.member(jsii_name="putBlocklist")
    def put_blocklist(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__19e08a98aac19d994a2d07307737df13d6a310ceafb2221c354be8eb16297f13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putBlocklist", [value]))

    @jsii.member(jsii_name="resetAllowlist")
    def reset_allowlist(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllowlist", []))

    @jsii.member(jsii_name="resetBlocklist")
    def reset_blocklist(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetBlocklist", []))

    @builtins.property
    @jsii.member(jsii_name="allowlist")
    def allowlist(
        self,
    ) -> WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStructList:
        return typing.cast(WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStructList, jsii.get(self, "allowlist"))

    @builtins.property
    @jsii.member(jsii_name="blocklist")
    def blocklist(
        self,
    ) -> WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStructList:
        return typing.cast(WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStructList, jsii.get(self, "blocklist"))

    @builtins.property
    @jsii.member(jsii_name="allowlistInput")
    def allowlist_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct]]], jsii.get(self, "allowlistInput"))

    @builtins.property
    @jsii.member(jsii_name="blocklistInput")
    def blocklist_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct]]], jsii.get(self, "blocklistInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsCookieSynchronizationConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsCookieSynchronizationConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsCookieSynchronizationConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__412804844d680f295fc5ab870908b382536daf8019673c18d9a6051a5b0a6a45)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsToolbarConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "hidden_toolbar_items": "hiddenToolbarItems",
        "max_display_resolution": "maxDisplayResolution",
        "toolbar_type": "toolbarType",
        "visual_mode": "visualMode",
    },
)
class WorkspaceswebUserSettingsToolbarConfiguration:
    def __init__(
        self,
        *,
        hidden_toolbar_items: typing.Optional[typing.Sequence[builtins.str]] = None,
        max_display_resolution: typing.Optional[builtins.str] = None,
        toolbar_type: typing.Optional[builtins.str] = None,
        visual_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param hidden_toolbar_items: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#hidden_toolbar_items WorkspaceswebUserSettings#hidden_toolbar_items}.
        :param max_display_resolution: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#max_display_resolution WorkspaceswebUserSettings#max_display_resolution}.
        :param toolbar_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#toolbar_type WorkspaceswebUserSettings#toolbar_type}.
        :param visual_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#visual_mode WorkspaceswebUserSettings#visual_mode}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__96b9445fbd2f80e7d22ab925574b28293eccfdd746d0cd53e5a528b1bf257e46)
            check_type(argname="argument hidden_toolbar_items", value=hidden_toolbar_items, expected_type=type_hints["hidden_toolbar_items"])
            check_type(argname="argument max_display_resolution", value=max_display_resolution, expected_type=type_hints["max_display_resolution"])
            check_type(argname="argument toolbar_type", value=toolbar_type, expected_type=type_hints["toolbar_type"])
            check_type(argname="argument visual_mode", value=visual_mode, expected_type=type_hints["visual_mode"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if hidden_toolbar_items is not None:
            self._values["hidden_toolbar_items"] = hidden_toolbar_items
        if max_display_resolution is not None:
            self._values["max_display_resolution"] = max_display_resolution
        if toolbar_type is not None:
            self._values["toolbar_type"] = toolbar_type
        if visual_mode is not None:
            self._values["visual_mode"] = visual_mode

    @builtins.property
    def hidden_toolbar_items(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#hidden_toolbar_items WorkspaceswebUserSettings#hidden_toolbar_items}.'''
        result = self._values.get("hidden_toolbar_items")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def max_display_resolution(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#max_display_resolution WorkspaceswebUserSettings#max_display_resolution}.'''
        result = self._values.get("max_display_resolution")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def toolbar_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#toolbar_type WorkspaceswebUserSettings#toolbar_type}.'''
        result = self._values.get("toolbar_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def visual_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#visual_mode WorkspaceswebUserSettings#visual_mode}.'''
        result = self._values.get("visual_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "WorkspaceswebUserSettingsToolbarConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class WorkspaceswebUserSettingsToolbarConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsToolbarConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f7b9470986a1d557c82ea8f1dbebafc68b74e7c04fb015136fe122af32eaef93)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "WorkspaceswebUserSettingsToolbarConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4b6c31ae4e4e776348ce2250d99ae72ec3bfe0e0064301aa285b5442b5c91fe2)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("WorkspaceswebUserSettingsToolbarConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__65412bb6c5ca309ea426b4eb451cb0bdd4666d7be99a6e48d93dad539d389a6b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__9f4b7dc12378ca2968e9fda2df6459b45001c308673383800c59dc74c44a3dd3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__46c2800482a6a51e41f8164b30ac9f9201a4f9744c57183d47c3dbad40b32f2f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsToolbarConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsToolbarConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsToolbarConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__264cd96d81a67c221c30ba4402b87a148e8e067856b82c7e7cdbdd8430fff319)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class WorkspaceswebUserSettingsToolbarConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.workspaceswebUserSettings.WorkspaceswebUserSettingsToolbarConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__bfea3cf7e65f6db2eb9d9b3e581a9f981c810b378c34e4f2b59d1ec63c137dd2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetHiddenToolbarItems")
    def reset_hidden_toolbar_items(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHiddenToolbarItems", []))

    @jsii.member(jsii_name="resetMaxDisplayResolution")
    def reset_max_display_resolution(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxDisplayResolution", []))

    @jsii.member(jsii_name="resetToolbarType")
    def reset_toolbar_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetToolbarType", []))

    @jsii.member(jsii_name="resetVisualMode")
    def reset_visual_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVisualMode", []))

    @builtins.property
    @jsii.member(jsii_name="hiddenToolbarItemsInput")
    def hidden_toolbar_items_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "hiddenToolbarItemsInput"))

    @builtins.property
    @jsii.member(jsii_name="maxDisplayResolutionInput")
    def max_display_resolution_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "maxDisplayResolutionInput"))

    @builtins.property
    @jsii.member(jsii_name="toolbarTypeInput")
    def toolbar_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "toolbarTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="visualModeInput")
    def visual_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "visualModeInput"))

    @builtins.property
    @jsii.member(jsii_name="hiddenToolbarItems")
    def hidden_toolbar_items(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "hiddenToolbarItems"))

    @hidden_toolbar_items.setter
    def hidden_toolbar_items(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eee642d692ce702c1f60fbaf94dfd777024776cf3432c9fccea06c89355a87a4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "hiddenToolbarItems", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="maxDisplayResolution")
    def max_display_resolution(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "maxDisplayResolution"))

    @max_display_resolution.setter
    def max_display_resolution(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd4e747a9b7a9f6472245b6e3aac29319d423216761972f7a547f85b2c2ac887)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxDisplayResolution", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="toolbarType")
    def toolbar_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "toolbarType"))

    @toolbar_type.setter
    def toolbar_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__511105256380cf4b18a5d18e7449fb110645589700ae098faf022864cb3612bb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "toolbarType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="visualMode")
    def visual_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "visualMode"))

    @visual_mode.setter
    def visual_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3b1885d98967a3817f8581e4ba0171d3abd7eaea8990637b2f48c3019dd3409a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "visualMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsToolbarConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsToolbarConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsToolbarConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__716bee87da9932f55a47d00b32e4143d348395df302df284b8bde89751f1eabb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "WorkspaceswebUserSettings",
    "WorkspaceswebUserSettingsConfig",
    "WorkspaceswebUserSettingsCookieSynchronizationConfiguration",
    "WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct",
    "WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStructList",
    "WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStructOutputReference",
    "WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct",
    "WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStructList",
    "WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStructOutputReference",
    "WorkspaceswebUserSettingsCookieSynchronizationConfigurationList",
    "WorkspaceswebUserSettingsCookieSynchronizationConfigurationOutputReference",
    "WorkspaceswebUserSettingsToolbarConfiguration",
    "WorkspaceswebUserSettingsToolbarConfigurationList",
    "WorkspaceswebUserSettingsToolbarConfigurationOutputReference",
]

publication.publish()

def _typecheckingstub__6d9ca78d4b79d4c65ad4889e815e7057442c7e8da790dda63ae051cf468e2215(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    copy_allowed: builtins.str,
    download_allowed: builtins.str,
    paste_allowed: builtins.str,
    print_allowed: builtins.str,
    upload_allowed: builtins.str,
    additional_encryption_context: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    cookie_synchronization_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[WorkspaceswebUserSettingsCookieSynchronizationConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    customer_managed_key: typing.Optional[builtins.str] = None,
    deep_link_allowed: typing.Optional[builtins.str] = None,
    disconnect_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    idle_disconnect_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    toolbar_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[WorkspaceswebUserSettingsToolbarConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
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

def _typecheckingstub__c48ade516705e56be0f2a337b8f97cae0eb9d360a5e5994eb2d5eed7fa0c9430(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1d306a9c8f7d4f5865342b7191032bef463e1d86af03c30c157fcedeea305fef(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[WorkspaceswebUserSettingsCookieSynchronizationConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ef02db3d2a385e9e900d3630c7e7f04fce05cc7a675ca36bcce41dcd64f78da(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[WorkspaceswebUserSettingsToolbarConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6119c7c894a10c792b243bf8677f7cd6a065ac98db1fdf0961ff6a7349e6b2f8(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86053d46b199fd8d02168569bfbc05ce6b41c76cfb60c819362de3da5c7aeefe(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f3347e649f963c654ffff314abaf8bc778fbf855d1b276b8cebb0cbf60574c4e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86397781adc0cc76c881dcb38038a7d6d726e4de11b4a4088041824d4c3e02a0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d0e06c5865c0cbd16254c9e141402fe180fe44ec27084ad29120f1fa6579e4d9(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54d51f76f68cc6fde8f153936bbb249ca3bdd05b24b15c9c0a2f6fc44ca3836f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c9fee713ade42a0ba066b3a0c2f8ea2c4fb4744ac0e30c01ac89de94778eec4(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f58b68c9d08dac16c925f5fe448bab1fe57b4fd572dbe6302187f3b740ad9c89(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0b51ad5ae9c81d2998888eb49182aac080718d137b63b75eceee871f37e7d54(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24221b9adb12811093406367ef0cb829b51fd2d60b1384d823749c0ecf55be6c(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fdc6495e26f5c465b78a6a93091a2498b7596a9891146d41bf2f574f57d2adbf(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85324c9dbfb778a33f61573a6e35ddb680760c6095104949b2e51b9951967823(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    copy_allowed: builtins.str,
    download_allowed: builtins.str,
    paste_allowed: builtins.str,
    print_allowed: builtins.str,
    upload_allowed: builtins.str,
    additional_encryption_context: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    cookie_synchronization_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[WorkspaceswebUserSettingsCookieSynchronizationConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    customer_managed_key: typing.Optional[builtins.str] = None,
    deep_link_allowed: typing.Optional[builtins.str] = None,
    disconnect_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    idle_disconnect_timeout_in_minutes: typing.Optional[jsii.Number] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    toolbar_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[WorkspaceswebUserSettingsToolbarConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f8c37e08e6deae931d184f73052691666395a67391888b3ea504e03209dd6a1(
    *,
    allowlist: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct, typing.Dict[builtins.str, typing.Any]]]]] = None,
    blocklist: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24ac674fb12dc46389c259a476f4120552692d1bc0bd43c8c7bf773dd3afcf36(
    *,
    domain: builtins.str,
    name: typing.Optional[builtins.str] = None,
    path: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__03dff6a314d2b28d3c0722bfd49a516d424f9e10ebcbfa428fe58b381a5679e0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__beb0d8bdb327171919ca121bd8a1dca7c8f6a7c78b9abe21e6ca99229a00c810(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0d165a51ffaa24cec43ebb1dec3d7251f084264703776f623578a05fc2ec684c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99a35b9587ea9c61f44c9ea27221d85ae487c829af60d759a6d88d22345353bb(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a20c044ae647a159a00ea63c03856e4c702e7d14504d03dbd51a50d6e43227ed(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e95a2e6ca2d42a2eeaf9810079de4671e0c45ca22f739501b469f432c032312f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee2d32f1094d6a0ec37f65df6d49319c87c7fe52a320984d910a1be2bf8e453a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__56946c93351efb82ceb50476c59f6f6ac3be6dd7bda4355cc63bb46aafd7c8b4(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fee4d5a11a6062447faaa5c2ec2e7200e475670b2c7004219485bfb37602b46a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e176f2d3161571c99ff9e7f408d89d78458dadeeb4374b0e02b6203fd95b75e6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8572f14e4ce3cfcf91fb77b10600c645153432f43b84d23e42c48cc58b030e97(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f90f0f756e92ba004500cd7ab95d5a4e859a52ef0d18218d8779e6273c39ffd4(
    *,
    domain: builtins.str,
    name: typing.Optional[builtins.str] = None,
    path: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6050be5757260c54ca417455b327830332fc15f38ab84c79e425e125a236748(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d8570517e81484d804c9318c76a53c3f25d02f3ca877b95a0637ed30d5432378(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__47cea5f758332f8b0347deed2a0c4b938264e733caa30a003786055c4dedd53b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__85f726937f1acf3227fcfd7271b59c7c6107d88a75f5bcaf00b7a286f75db348(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a0164028651160da34ea6449b1a11737845228618d9e941784d2f1858776cd38(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2761e61499e281787bb7ceec965ec5049056ed14c14d756ebf6b68d644327e8(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4f9720cc9a31877d1829a4b8a5db488b9e6e4d82c63bc5c535cc70d8d5e46488(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b9a28e0c859427b11b113b4caeea3ea2be6d69e4911483b9acb98ba3277ff82(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__67f0676369dfe2e63727a9e04d2d0325e5578f2f44cc3ad78b42e2b6264ab7a3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7505ef7e01c0094a71b1f1cdc3aeb1440523e7f9fd1f038119ee0d5821726506(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6bd2b33899cca432fddb9d5e337466fea107fcadc301063711b75cedc7d5776(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e9ebab46adb22bf48118b81921fbe5264f9d025374a04e91c5f855cb4baba92c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__719d763a14c504d8e31ebf9e8ba41d40235c33a02185880988ddf98a5963f1c8(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0707a6c310202f1ad6d3afc62d7760dc667ec53d865038e7c49d5c4841a772fe(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__440486c2d86dc9d59960f5cbf7ab240a59e225f472567f469f96923bcb898474(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c3b9e86eb278b0bd8c23017a7fcdd807d0ce02298d7fda5ffcf9d6dad3c23826(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__45b89e050d448ddd1ccea154d585edea5f1897d9de205b07e9678c1087dddae0(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsCookieSynchronizationConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2c2145203d61551c46682c5d8a71da69d140761ebccef3c4aabe5d681be13aca(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3bb427b5c18b83ca2d6652e513d610d0419950f2a29d082f8126e1cf2880c99b(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__19e08a98aac19d994a2d07307737df13d6a310ceafb2221c354be8eb16297f13(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__412804844d680f295fc5ab870908b382536daf8019673c18d9a6051a5b0a6a45(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsCookieSynchronizationConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__96b9445fbd2f80e7d22ab925574b28293eccfdd746d0cd53e5a528b1bf257e46(
    *,
    hidden_toolbar_items: typing.Optional[typing.Sequence[builtins.str]] = None,
    max_display_resolution: typing.Optional[builtins.str] = None,
    toolbar_type: typing.Optional[builtins.str] = None,
    visual_mode: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f7b9470986a1d557c82ea8f1dbebafc68b74e7c04fb015136fe122af32eaef93(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b6c31ae4e4e776348ce2250d99ae72ec3bfe0e0064301aa285b5442b5c91fe2(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__65412bb6c5ca309ea426b4eb451cb0bdd4666d7be99a6e48d93dad539d389a6b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f4b7dc12378ca2968e9fda2df6459b45001c308673383800c59dc74c44a3dd3(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46c2800482a6a51e41f8164b30ac9f9201a4f9744c57183d47c3dbad40b32f2f(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__264cd96d81a67c221c30ba4402b87a148e8e067856b82c7e7cdbdd8430fff319(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[WorkspaceswebUserSettingsToolbarConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bfea3cf7e65f6db2eb9d9b3e581a9f981c810b378c34e4f2b59d1ec63c137dd2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eee642d692ce702c1f60fbaf94dfd777024776cf3432c9fccea06c89355a87a4(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd4e747a9b7a9f6472245b6e3aac29319d423216761972f7a547f85b2c2ac887(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__511105256380cf4b18a5d18e7449fb110645589700ae098faf022864cb3612bb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3b1885d98967a3817f8581e4ba0171d3abd7eaea8990637b2f48c3019dd3409a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__716bee87da9932f55a47d00b32e4143d348395df302df284b8bde89751f1eabb(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, WorkspaceswebUserSettingsToolbarConfiguration]],
) -> None:
    """Type checking stubs"""
    pass
