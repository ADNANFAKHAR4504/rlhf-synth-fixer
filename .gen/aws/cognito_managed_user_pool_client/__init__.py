r'''
# `aws_cognito_managed_user_pool_client`

Refer to the Terraform Registry for docs: [`aws_cognito_managed_user_pool_client`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client).
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


class CognitoManagedUserPoolClient(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClient",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client aws_cognito_managed_user_pool_client}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        user_pool_id: builtins.str,
        access_token_validity: typing.Optional[jsii.Number] = None,
        allowed_oauth_flows: typing.Optional[typing.Sequence[builtins.str]] = None,
        allowed_oauth_flows_user_pool_client: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        allowed_oauth_scopes: typing.Optional[typing.Sequence[builtins.str]] = None,
        analytics_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CognitoManagedUserPoolClientAnalyticsConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        auth_session_validity: typing.Optional[jsii.Number] = None,
        callback_urls: typing.Optional[typing.Sequence[builtins.str]] = None,
        default_redirect_uri: typing.Optional[builtins.str] = None,
        enable_propagate_additional_user_context_data: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_token_revocation: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        explicit_auth_flows: typing.Optional[typing.Sequence[builtins.str]] = None,
        id_token_validity: typing.Optional[jsii.Number] = None,
        logout_urls: typing.Optional[typing.Sequence[builtins.str]] = None,
        name_pattern: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        prevent_user_existence_errors: typing.Optional[builtins.str] = None,
        read_attributes: typing.Optional[typing.Sequence[builtins.str]] = None,
        refresh_token_rotation: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CognitoManagedUserPoolClientRefreshTokenRotation", typing.Dict[builtins.str, typing.Any]]]]] = None,
        refresh_token_validity: typing.Optional[jsii.Number] = None,
        supported_identity_providers: typing.Optional[typing.Sequence[builtins.str]] = None,
        token_validity_units: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CognitoManagedUserPoolClientTokenValidityUnits", typing.Dict[builtins.str, typing.Any]]]]] = None,
        write_attributes: typing.Optional[typing.Sequence[builtins.str]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client aws_cognito_managed_user_pool_client} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param user_pool_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#user_pool_id CognitoManagedUserPoolClient#user_pool_id}.
        :param access_token_validity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#access_token_validity CognitoManagedUserPoolClient#access_token_validity}.
        :param allowed_oauth_flows: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_flows CognitoManagedUserPoolClient#allowed_oauth_flows}.
        :param allowed_oauth_flows_user_pool_client: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_flows_user_pool_client CognitoManagedUserPoolClient#allowed_oauth_flows_user_pool_client}.
        :param allowed_oauth_scopes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_scopes CognitoManagedUserPoolClient#allowed_oauth_scopes}.
        :param analytics_configuration: analytics_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#analytics_configuration CognitoManagedUserPoolClient#analytics_configuration}
        :param auth_session_validity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#auth_session_validity CognitoManagedUserPoolClient#auth_session_validity}.
        :param callback_urls: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#callback_urls CognitoManagedUserPoolClient#callback_urls}.
        :param default_redirect_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#default_redirect_uri CognitoManagedUserPoolClient#default_redirect_uri}.
        :param enable_propagate_additional_user_context_data: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#enable_propagate_additional_user_context_data CognitoManagedUserPoolClient#enable_propagate_additional_user_context_data}.
        :param enable_token_revocation: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#enable_token_revocation CognitoManagedUserPoolClient#enable_token_revocation}.
        :param explicit_auth_flows: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#explicit_auth_flows CognitoManagedUserPoolClient#explicit_auth_flows}.
        :param id_token_validity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#id_token_validity CognitoManagedUserPoolClient#id_token_validity}.
        :param logout_urls: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#logout_urls CognitoManagedUserPoolClient#logout_urls}.
        :param name_pattern: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#name_pattern CognitoManagedUserPoolClient#name_pattern}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#name_prefix CognitoManagedUserPoolClient#name_prefix}.
        :param prevent_user_existence_errors: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#prevent_user_existence_errors CognitoManagedUserPoolClient#prevent_user_existence_errors}.
        :param read_attributes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#read_attributes CognitoManagedUserPoolClient#read_attributes}.
        :param refresh_token_rotation: refresh_token_rotation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token_rotation CognitoManagedUserPoolClient#refresh_token_rotation}
        :param refresh_token_validity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token_validity CognitoManagedUserPoolClient#refresh_token_validity}.
        :param supported_identity_providers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#supported_identity_providers CognitoManagedUserPoolClient#supported_identity_providers}.
        :param token_validity_units: token_validity_units block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#token_validity_units CognitoManagedUserPoolClient#token_validity_units}
        :param write_attributes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#write_attributes CognitoManagedUserPoolClient#write_attributes}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__da0950e8b76e7838e7b4989b085e8ad8aa53f7123f90a9dc358d7f640515159b)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = CognitoManagedUserPoolClientConfig(
            user_pool_id=user_pool_id,
            access_token_validity=access_token_validity,
            allowed_oauth_flows=allowed_oauth_flows,
            allowed_oauth_flows_user_pool_client=allowed_oauth_flows_user_pool_client,
            allowed_oauth_scopes=allowed_oauth_scopes,
            analytics_configuration=analytics_configuration,
            auth_session_validity=auth_session_validity,
            callback_urls=callback_urls,
            default_redirect_uri=default_redirect_uri,
            enable_propagate_additional_user_context_data=enable_propagate_additional_user_context_data,
            enable_token_revocation=enable_token_revocation,
            explicit_auth_flows=explicit_auth_flows,
            id_token_validity=id_token_validity,
            logout_urls=logout_urls,
            name_pattern=name_pattern,
            name_prefix=name_prefix,
            prevent_user_existence_errors=prevent_user_existence_errors,
            read_attributes=read_attributes,
            refresh_token_rotation=refresh_token_rotation,
            refresh_token_validity=refresh_token_validity,
            supported_identity_providers=supported_identity_providers,
            token_validity_units=token_validity_units,
            write_attributes=write_attributes,
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
        '''Generates CDKTF code for importing a CognitoManagedUserPoolClient resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the CognitoManagedUserPoolClient to import.
        :param import_from_id: The id of the existing CognitoManagedUserPoolClient that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the CognitoManagedUserPoolClient to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__29ca70b9829f603af6d426fd9cc59f452d2aa119a934c9fd202285a3732b1b03)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putAnalyticsConfiguration")
    def put_analytics_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CognitoManagedUserPoolClientAnalyticsConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e38655eb6780ae575f8a4744e25ad1014c5756bc12153a99b5f9212633aa324c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putAnalyticsConfiguration", [value]))

    @jsii.member(jsii_name="putRefreshTokenRotation")
    def put_refresh_token_rotation(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CognitoManagedUserPoolClientRefreshTokenRotation", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__64beb9261a5e4679efb1bb2a03bb64c86af431cd0837cfa0b47f5582caf862e4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putRefreshTokenRotation", [value]))

    @jsii.member(jsii_name="putTokenValidityUnits")
    def put_token_validity_units(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CognitoManagedUserPoolClientTokenValidityUnits", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6da91114a95c52a64a405d09964a67997e3284b5a3d2c9621273e626906120a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTokenValidityUnits", [value]))

    @jsii.member(jsii_name="resetAccessTokenValidity")
    def reset_access_token_validity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccessTokenValidity", []))

    @jsii.member(jsii_name="resetAllowedOauthFlows")
    def reset_allowed_oauth_flows(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllowedOauthFlows", []))

    @jsii.member(jsii_name="resetAllowedOauthFlowsUserPoolClient")
    def reset_allowed_oauth_flows_user_pool_client(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllowedOauthFlowsUserPoolClient", []))

    @jsii.member(jsii_name="resetAllowedOauthScopes")
    def reset_allowed_oauth_scopes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAllowedOauthScopes", []))

    @jsii.member(jsii_name="resetAnalyticsConfiguration")
    def reset_analytics_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAnalyticsConfiguration", []))

    @jsii.member(jsii_name="resetAuthSessionValidity")
    def reset_auth_session_validity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAuthSessionValidity", []))

    @jsii.member(jsii_name="resetCallbackUrls")
    def reset_callback_urls(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCallbackUrls", []))

    @jsii.member(jsii_name="resetDefaultRedirectUri")
    def reset_default_redirect_uri(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDefaultRedirectUri", []))

    @jsii.member(jsii_name="resetEnablePropagateAdditionalUserContextData")
    def reset_enable_propagate_additional_user_context_data(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnablePropagateAdditionalUserContextData", []))

    @jsii.member(jsii_name="resetEnableTokenRevocation")
    def reset_enable_token_revocation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnableTokenRevocation", []))

    @jsii.member(jsii_name="resetExplicitAuthFlows")
    def reset_explicit_auth_flows(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExplicitAuthFlows", []))

    @jsii.member(jsii_name="resetIdTokenValidity")
    def reset_id_token_validity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdTokenValidity", []))

    @jsii.member(jsii_name="resetLogoutUrls")
    def reset_logout_urls(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLogoutUrls", []))

    @jsii.member(jsii_name="resetNamePattern")
    def reset_name_pattern(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNamePattern", []))

    @jsii.member(jsii_name="resetNamePrefix")
    def reset_name_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetNamePrefix", []))

    @jsii.member(jsii_name="resetPreventUserExistenceErrors")
    def reset_prevent_user_existence_errors(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPreventUserExistenceErrors", []))

    @jsii.member(jsii_name="resetReadAttributes")
    def reset_read_attributes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReadAttributes", []))

    @jsii.member(jsii_name="resetRefreshTokenRotation")
    def reset_refresh_token_rotation(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRefreshTokenRotation", []))

    @jsii.member(jsii_name="resetRefreshTokenValidity")
    def reset_refresh_token_validity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRefreshTokenValidity", []))

    @jsii.member(jsii_name="resetSupportedIdentityProviders")
    def reset_supported_identity_providers(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSupportedIdentityProviders", []))

    @jsii.member(jsii_name="resetTokenValidityUnits")
    def reset_token_validity_units(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTokenValidityUnits", []))

    @jsii.member(jsii_name="resetWriteAttributes")
    def reset_write_attributes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWriteAttributes", []))

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
    @jsii.member(jsii_name="analyticsConfiguration")
    def analytics_configuration(
        self,
    ) -> "CognitoManagedUserPoolClientAnalyticsConfigurationList":
        return typing.cast("CognitoManagedUserPoolClientAnalyticsConfigurationList", jsii.get(self, "analyticsConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="clientSecret")
    def client_secret(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "clientSecret"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @builtins.property
    @jsii.member(jsii_name="name")
    def name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "name"))

    @builtins.property
    @jsii.member(jsii_name="refreshTokenRotation")
    def refresh_token_rotation(
        self,
    ) -> "CognitoManagedUserPoolClientRefreshTokenRotationList":
        return typing.cast("CognitoManagedUserPoolClientRefreshTokenRotationList", jsii.get(self, "refreshTokenRotation"))

    @builtins.property
    @jsii.member(jsii_name="tokenValidityUnits")
    def token_validity_units(
        self,
    ) -> "CognitoManagedUserPoolClientTokenValidityUnitsList":
        return typing.cast("CognitoManagedUserPoolClientTokenValidityUnitsList", jsii.get(self, "tokenValidityUnits"))

    @builtins.property
    @jsii.member(jsii_name="accessTokenValidityInput")
    def access_token_validity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "accessTokenValidityInput"))

    @builtins.property
    @jsii.member(jsii_name="allowedOauthFlowsInput")
    def allowed_oauth_flows_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "allowedOauthFlowsInput"))

    @builtins.property
    @jsii.member(jsii_name="allowedOauthFlowsUserPoolClientInput")
    def allowed_oauth_flows_user_pool_client_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "allowedOauthFlowsUserPoolClientInput"))

    @builtins.property
    @jsii.member(jsii_name="allowedOauthScopesInput")
    def allowed_oauth_scopes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "allowedOauthScopesInput"))

    @builtins.property
    @jsii.member(jsii_name="analyticsConfigurationInput")
    def analytics_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CognitoManagedUserPoolClientAnalyticsConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CognitoManagedUserPoolClientAnalyticsConfiguration"]]], jsii.get(self, "analyticsConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="authSessionValidityInput")
    def auth_session_validity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "authSessionValidityInput"))

    @builtins.property
    @jsii.member(jsii_name="callbackUrlsInput")
    def callback_urls_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "callbackUrlsInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultRedirectUriInput")
    def default_redirect_uri_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "defaultRedirectUriInput"))

    @builtins.property
    @jsii.member(jsii_name="enablePropagateAdditionalUserContextDataInput")
    def enable_propagate_additional_user_context_data_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enablePropagateAdditionalUserContextDataInput"))

    @builtins.property
    @jsii.member(jsii_name="enableTokenRevocationInput")
    def enable_token_revocation_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enableTokenRevocationInput"))

    @builtins.property
    @jsii.member(jsii_name="explicitAuthFlowsInput")
    def explicit_auth_flows_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "explicitAuthFlowsInput"))

    @builtins.property
    @jsii.member(jsii_name="idTokenValidityInput")
    def id_token_validity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "idTokenValidityInput"))

    @builtins.property
    @jsii.member(jsii_name="logoutUrlsInput")
    def logout_urls_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "logoutUrlsInput"))

    @builtins.property
    @jsii.member(jsii_name="namePatternInput")
    def name_pattern_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "namePatternInput"))

    @builtins.property
    @jsii.member(jsii_name="namePrefixInput")
    def name_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "namePrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="preventUserExistenceErrorsInput")
    def prevent_user_existence_errors_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "preventUserExistenceErrorsInput"))

    @builtins.property
    @jsii.member(jsii_name="readAttributesInput")
    def read_attributes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "readAttributesInput"))

    @builtins.property
    @jsii.member(jsii_name="refreshTokenRotationInput")
    def refresh_token_rotation_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CognitoManagedUserPoolClientRefreshTokenRotation"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CognitoManagedUserPoolClientRefreshTokenRotation"]]], jsii.get(self, "refreshTokenRotationInput"))

    @builtins.property
    @jsii.member(jsii_name="refreshTokenValidityInput")
    def refresh_token_validity_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "refreshTokenValidityInput"))

    @builtins.property
    @jsii.member(jsii_name="supportedIdentityProvidersInput")
    def supported_identity_providers_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "supportedIdentityProvidersInput"))

    @builtins.property
    @jsii.member(jsii_name="tokenValidityUnitsInput")
    def token_validity_units_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CognitoManagedUserPoolClientTokenValidityUnits"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CognitoManagedUserPoolClientTokenValidityUnits"]]], jsii.get(self, "tokenValidityUnitsInput"))

    @builtins.property
    @jsii.member(jsii_name="userPoolIdInput")
    def user_pool_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "userPoolIdInput"))

    @builtins.property
    @jsii.member(jsii_name="writeAttributesInput")
    def write_attributes_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "writeAttributesInput"))

    @builtins.property
    @jsii.member(jsii_name="accessTokenValidity")
    def access_token_validity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "accessTokenValidity"))

    @access_token_validity.setter
    def access_token_validity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__57dcc9edd730ca76d916de8fc3716a9b2d89d9acec850b557aa54d141bd549d0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accessTokenValidity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="allowedOauthFlows")
    def allowed_oauth_flows(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "allowedOauthFlows"))

    @allowed_oauth_flows.setter
    def allowed_oauth_flows(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__434da50e7ccf90ecfc4c9537baa35f6f7ea873e86f56cb6b4e746dafa2d9a970)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "allowedOauthFlows", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="allowedOauthFlowsUserPoolClient")
    def allowed_oauth_flows_user_pool_client(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "allowedOauthFlowsUserPoolClient"))

    @allowed_oauth_flows_user_pool_client.setter
    def allowed_oauth_flows_user_pool_client(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__611489608a7559ecc6acf6fd4f4f8ab5c75e788f665bcf901c135769bd993eff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "allowedOauthFlowsUserPoolClient", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="allowedOauthScopes")
    def allowed_oauth_scopes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "allowedOauthScopes"))

    @allowed_oauth_scopes.setter
    def allowed_oauth_scopes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9196872f75199b30b6bb9f18557f5a3db8876df2d01d5f0c7456eb9cd8c2ce25)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "allowedOauthScopes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="authSessionValidity")
    def auth_session_validity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "authSessionValidity"))

    @auth_session_validity.setter
    def auth_session_validity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3831d6f8bacdf8206fdceb4d204b073ac1ade80efeb678961e720fc47ded208)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "authSessionValidity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="callbackUrls")
    def callback_urls(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "callbackUrls"))

    @callback_urls.setter
    def callback_urls(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5b4c9d3aa8420de0a19ed2d120b5534d9b679fed5326e34f30b3c690379d09ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "callbackUrls", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="defaultRedirectUri")
    def default_redirect_uri(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "defaultRedirectUri"))

    @default_redirect_uri.setter
    def default_redirect_uri(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec8dbadf416946ab1cdfe8e9304f790a7c3c52ab95d4a671bedb34a4d6a52487)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "defaultRedirectUri", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enablePropagateAdditionalUserContextData")
    def enable_propagate_additional_user_context_data(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enablePropagateAdditionalUserContextData"))

    @enable_propagate_additional_user_context_data.setter
    def enable_propagate_additional_user_context_data(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c685b777c8cce3ecc842f64c7e2782bd82eb1f9dcf525b88a1c9b79ea3bfdd8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enablePropagateAdditionalUserContextData", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enableTokenRevocation")
    def enable_token_revocation(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enableTokenRevocation"))

    @enable_token_revocation.setter
    def enable_token_revocation(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e0b3d7c63f4b6091386e6aa832aff4eb6522c79fb0d4450d63a6085d0f859c2e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enableTokenRevocation", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="explicitAuthFlows")
    def explicit_auth_flows(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "explicitAuthFlows"))

    @explicit_auth_flows.setter
    def explicit_auth_flows(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec46dfe60a6423240fe0a630fd49e010de875b55da1156e1199dff12e77be231)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "explicitAuthFlows", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="idTokenValidity")
    def id_token_validity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "idTokenValidity"))

    @id_token_validity.setter
    def id_token_validity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f88743025ff65d831aa9e1b8ab45eb8b6e508f90f7a67dd3cc9bc84883dfc3e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "idTokenValidity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="logoutUrls")
    def logout_urls(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "logoutUrls"))

    @logout_urls.setter
    def logout_urls(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__28bec16e343282aa6e3c88eaa4cce40244530dcbccfc4ee0e978923c2f4649f4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "logoutUrls", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="namePattern")
    def name_pattern(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "namePattern"))

    @name_pattern.setter
    def name_pattern(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e617a7640189ec959bebdbe668df6c574f2a3fc73885a17377b48178068d3ac2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "namePattern", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="namePrefix")
    def name_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "namePrefix"))

    @name_prefix.setter
    def name_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d6620387f407c295c1c7fe6a9abfcf836542a4c32b5afd79d7b80f1fe8e69ded)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "namePrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="preventUserExistenceErrors")
    def prevent_user_existence_errors(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "preventUserExistenceErrors"))

    @prevent_user_existence_errors.setter
    def prevent_user_existence_errors(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__13c086a6c229599f9acdd506740c7af7025d7b266fa03949bcf065dd7e0bc759)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "preventUserExistenceErrors", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="readAttributes")
    def read_attributes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "readAttributes"))

    @read_attributes.setter
    def read_attributes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6410daa9a1f7412e178f34163153f7fb792640574e3f7151b39e2f382890361)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "readAttributes", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="refreshTokenValidity")
    def refresh_token_validity(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "refreshTokenValidity"))

    @refresh_token_validity.setter
    def refresh_token_validity(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3cf3b9d8326c847d388179c68b548f73514b12a09fc24970eac092b077df8538)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "refreshTokenValidity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="supportedIdentityProviders")
    def supported_identity_providers(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "supportedIdentityProviders"))

    @supported_identity_providers.setter
    def supported_identity_providers(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__26285cf85dcf6f4b1c9e752b5e4b20e3ceee2cf20794189ab414f699f2c57d95)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "supportedIdentityProviders", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userPoolId")
    def user_pool_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "userPoolId"))

    @user_pool_id.setter
    def user_pool_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c6d5894f1d0e67a8d8fe070587b58a8aca7e4ccc1666789a2c90aacc39c32344)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userPoolId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="writeAttributes")
    def write_attributes(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "writeAttributes"))

    @write_attributes.setter
    def write_attributes(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0fe6f007d4777aed411191c4582bbff6f90c87ad5a323ad9a86042ecfa52d7fa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "writeAttributes", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientAnalyticsConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "application_arn": "applicationArn",
        "application_id": "applicationId",
        "external_id": "externalId",
        "role_arn": "roleArn",
        "user_data_shared": "userDataShared",
    },
)
class CognitoManagedUserPoolClientAnalyticsConfiguration:
    def __init__(
        self,
        *,
        application_arn: typing.Optional[builtins.str] = None,
        application_id: typing.Optional[builtins.str] = None,
        external_id: typing.Optional[builtins.str] = None,
        role_arn: typing.Optional[builtins.str] = None,
        user_data_shared: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param application_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#application_arn CognitoManagedUserPoolClient#application_arn}.
        :param application_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#application_id CognitoManagedUserPoolClient#application_id}.
        :param external_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#external_id CognitoManagedUserPoolClient#external_id}.
        :param role_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#role_arn CognitoManagedUserPoolClient#role_arn}.
        :param user_data_shared: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#user_data_shared CognitoManagedUserPoolClient#user_data_shared}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__599ed9de1a04f2bd9a6b5847ed9b6bb6b40b786678cf66c97d9a8b1a8606fef6)
            check_type(argname="argument application_arn", value=application_arn, expected_type=type_hints["application_arn"])
            check_type(argname="argument application_id", value=application_id, expected_type=type_hints["application_id"])
            check_type(argname="argument external_id", value=external_id, expected_type=type_hints["external_id"])
            check_type(argname="argument role_arn", value=role_arn, expected_type=type_hints["role_arn"])
            check_type(argname="argument user_data_shared", value=user_data_shared, expected_type=type_hints["user_data_shared"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if application_arn is not None:
            self._values["application_arn"] = application_arn
        if application_id is not None:
            self._values["application_id"] = application_id
        if external_id is not None:
            self._values["external_id"] = external_id
        if role_arn is not None:
            self._values["role_arn"] = role_arn
        if user_data_shared is not None:
            self._values["user_data_shared"] = user_data_shared

    @builtins.property
    def application_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#application_arn CognitoManagedUserPoolClient#application_arn}.'''
        result = self._values.get("application_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def application_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#application_id CognitoManagedUserPoolClient#application_id}.'''
        result = self._values.get("application_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def external_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#external_id CognitoManagedUserPoolClient#external_id}.'''
        result = self._values.get("external_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def role_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#role_arn CognitoManagedUserPoolClient#role_arn}.'''
        result = self._values.get("role_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def user_data_shared(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#user_data_shared CognitoManagedUserPoolClient#user_data_shared}.'''
        result = self._values.get("user_data_shared")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CognitoManagedUserPoolClientAnalyticsConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CognitoManagedUserPoolClientAnalyticsConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientAnalyticsConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__afde8ec438702cc146f4044922f6db087598c185af58c0a6875b9426df02fd4c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CognitoManagedUserPoolClientAnalyticsConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__18eb625e18b8a864c325c176f7968b11af0990c38ed275c5062b05823a9ec62e)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CognitoManagedUserPoolClientAnalyticsConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__36c962718c5a8c5e52de8e8b3d4702488ae56c00085bc5a94238dfb719cb12f6)
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
            type_hints = typing.get_type_hints(_typecheckingstub__30a1e872b6437d4f0f6e33b208d4ef5a4203314bfdae30bd9c3bd8446fd1a92d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4e909994fac2bedf16bc63f26aa14bdde12d4d75b2d68e45ca3a9a7cafb4d2cb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientAnalyticsConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientAnalyticsConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientAnalyticsConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d3d1cd3bd31aefbddbda7db3c7103d8d23d03a5208357f55bf57b79a2c799d7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CognitoManagedUserPoolClientAnalyticsConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientAnalyticsConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__0b6f73ccd542f8c1feae074a62a8688fcabf34c4962dfb93fbddf30af07f15fe)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetApplicationArn")
    def reset_application_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetApplicationArn", []))

    @jsii.member(jsii_name="resetApplicationId")
    def reset_application_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetApplicationId", []))

    @jsii.member(jsii_name="resetExternalId")
    def reset_external_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetExternalId", []))

    @jsii.member(jsii_name="resetRoleArn")
    def reset_role_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoleArn", []))

    @jsii.member(jsii_name="resetUserDataShared")
    def reset_user_data_shared(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUserDataShared", []))

    @builtins.property
    @jsii.member(jsii_name="applicationArnInput")
    def application_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "applicationArnInput"))

    @builtins.property
    @jsii.member(jsii_name="applicationIdInput")
    def application_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "applicationIdInput"))

    @builtins.property
    @jsii.member(jsii_name="externalIdInput")
    def external_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "externalIdInput"))

    @builtins.property
    @jsii.member(jsii_name="roleArnInput")
    def role_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "roleArnInput"))

    @builtins.property
    @jsii.member(jsii_name="userDataSharedInput")
    def user_data_shared_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "userDataSharedInput"))

    @builtins.property
    @jsii.member(jsii_name="applicationArn")
    def application_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "applicationArn"))

    @application_arn.setter
    def application_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e377d36fbe0f3d7cb3206e7e7eebe47dfa389be7848f6ad1658f2f6c123c4aec)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "applicationArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="applicationId")
    def application_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "applicationId"))

    @application_id.setter
    def application_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__68f43691ded34136179bfc1956ea1f7fc85495f812a9b2b7bef031c7e6d78f5f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "applicationId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="externalId")
    def external_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "externalId"))

    @external_id.setter
    def external_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__069edb2303ad54410c49eb926c261b8b4fd6be6210cfc80fbae14bc06027838f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "externalId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="roleArn")
    def role_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "roleArn"))

    @role_arn.setter
    def role_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c0307ee078ffa349afe575d8619df8678f36b2f8dc2d047e0822d6ac168d585)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "roleArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userDataShared")
    def user_data_shared(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "userDataShared"))

    @user_data_shared.setter
    def user_data_shared(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__30362ab482f1fda87575b5e6f5865656f77610d947228d585cf2d959df469532)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userDataShared", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CognitoManagedUserPoolClientAnalyticsConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CognitoManagedUserPoolClientAnalyticsConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CognitoManagedUserPoolClientAnalyticsConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7fc8aaa5e96c66054cc63b34e9db268688e41d1064c4aafd503a0de0b3e06f1e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "user_pool_id": "userPoolId",
        "access_token_validity": "accessTokenValidity",
        "allowed_oauth_flows": "allowedOauthFlows",
        "allowed_oauth_flows_user_pool_client": "allowedOauthFlowsUserPoolClient",
        "allowed_oauth_scopes": "allowedOauthScopes",
        "analytics_configuration": "analyticsConfiguration",
        "auth_session_validity": "authSessionValidity",
        "callback_urls": "callbackUrls",
        "default_redirect_uri": "defaultRedirectUri",
        "enable_propagate_additional_user_context_data": "enablePropagateAdditionalUserContextData",
        "enable_token_revocation": "enableTokenRevocation",
        "explicit_auth_flows": "explicitAuthFlows",
        "id_token_validity": "idTokenValidity",
        "logout_urls": "logoutUrls",
        "name_pattern": "namePattern",
        "name_prefix": "namePrefix",
        "prevent_user_existence_errors": "preventUserExistenceErrors",
        "read_attributes": "readAttributes",
        "refresh_token_rotation": "refreshTokenRotation",
        "refresh_token_validity": "refreshTokenValidity",
        "supported_identity_providers": "supportedIdentityProviders",
        "token_validity_units": "tokenValidityUnits",
        "write_attributes": "writeAttributes",
    },
)
class CognitoManagedUserPoolClientConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        user_pool_id: builtins.str,
        access_token_validity: typing.Optional[jsii.Number] = None,
        allowed_oauth_flows: typing.Optional[typing.Sequence[builtins.str]] = None,
        allowed_oauth_flows_user_pool_client: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        allowed_oauth_scopes: typing.Optional[typing.Sequence[builtins.str]] = None,
        analytics_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CognitoManagedUserPoolClientAnalyticsConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
        auth_session_validity: typing.Optional[jsii.Number] = None,
        callback_urls: typing.Optional[typing.Sequence[builtins.str]] = None,
        default_redirect_uri: typing.Optional[builtins.str] = None,
        enable_propagate_additional_user_context_data: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        enable_token_revocation: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        explicit_auth_flows: typing.Optional[typing.Sequence[builtins.str]] = None,
        id_token_validity: typing.Optional[jsii.Number] = None,
        logout_urls: typing.Optional[typing.Sequence[builtins.str]] = None,
        name_pattern: typing.Optional[builtins.str] = None,
        name_prefix: typing.Optional[builtins.str] = None,
        prevent_user_existence_errors: typing.Optional[builtins.str] = None,
        read_attributes: typing.Optional[typing.Sequence[builtins.str]] = None,
        refresh_token_rotation: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CognitoManagedUserPoolClientRefreshTokenRotation", typing.Dict[builtins.str, typing.Any]]]]] = None,
        refresh_token_validity: typing.Optional[jsii.Number] = None,
        supported_identity_providers: typing.Optional[typing.Sequence[builtins.str]] = None,
        token_validity_units: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["CognitoManagedUserPoolClientTokenValidityUnits", typing.Dict[builtins.str, typing.Any]]]]] = None,
        write_attributes: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param user_pool_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#user_pool_id CognitoManagedUserPoolClient#user_pool_id}.
        :param access_token_validity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#access_token_validity CognitoManagedUserPoolClient#access_token_validity}.
        :param allowed_oauth_flows: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_flows CognitoManagedUserPoolClient#allowed_oauth_flows}.
        :param allowed_oauth_flows_user_pool_client: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_flows_user_pool_client CognitoManagedUserPoolClient#allowed_oauth_flows_user_pool_client}.
        :param allowed_oauth_scopes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_scopes CognitoManagedUserPoolClient#allowed_oauth_scopes}.
        :param analytics_configuration: analytics_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#analytics_configuration CognitoManagedUserPoolClient#analytics_configuration}
        :param auth_session_validity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#auth_session_validity CognitoManagedUserPoolClient#auth_session_validity}.
        :param callback_urls: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#callback_urls CognitoManagedUserPoolClient#callback_urls}.
        :param default_redirect_uri: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#default_redirect_uri CognitoManagedUserPoolClient#default_redirect_uri}.
        :param enable_propagate_additional_user_context_data: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#enable_propagate_additional_user_context_data CognitoManagedUserPoolClient#enable_propagate_additional_user_context_data}.
        :param enable_token_revocation: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#enable_token_revocation CognitoManagedUserPoolClient#enable_token_revocation}.
        :param explicit_auth_flows: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#explicit_auth_flows CognitoManagedUserPoolClient#explicit_auth_flows}.
        :param id_token_validity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#id_token_validity CognitoManagedUserPoolClient#id_token_validity}.
        :param logout_urls: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#logout_urls CognitoManagedUserPoolClient#logout_urls}.
        :param name_pattern: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#name_pattern CognitoManagedUserPoolClient#name_pattern}.
        :param name_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#name_prefix CognitoManagedUserPoolClient#name_prefix}.
        :param prevent_user_existence_errors: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#prevent_user_existence_errors CognitoManagedUserPoolClient#prevent_user_existence_errors}.
        :param read_attributes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#read_attributes CognitoManagedUserPoolClient#read_attributes}.
        :param refresh_token_rotation: refresh_token_rotation block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token_rotation CognitoManagedUserPoolClient#refresh_token_rotation}
        :param refresh_token_validity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token_validity CognitoManagedUserPoolClient#refresh_token_validity}.
        :param supported_identity_providers: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#supported_identity_providers CognitoManagedUserPoolClient#supported_identity_providers}.
        :param token_validity_units: token_validity_units block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#token_validity_units CognitoManagedUserPoolClient#token_validity_units}
        :param write_attributes: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#write_attributes CognitoManagedUserPoolClient#write_attributes}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d1b248903930c4ab21b59e441ee2bb2ebf5ee3fcfc2731657dfd53d4b0043377)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument user_pool_id", value=user_pool_id, expected_type=type_hints["user_pool_id"])
            check_type(argname="argument access_token_validity", value=access_token_validity, expected_type=type_hints["access_token_validity"])
            check_type(argname="argument allowed_oauth_flows", value=allowed_oauth_flows, expected_type=type_hints["allowed_oauth_flows"])
            check_type(argname="argument allowed_oauth_flows_user_pool_client", value=allowed_oauth_flows_user_pool_client, expected_type=type_hints["allowed_oauth_flows_user_pool_client"])
            check_type(argname="argument allowed_oauth_scopes", value=allowed_oauth_scopes, expected_type=type_hints["allowed_oauth_scopes"])
            check_type(argname="argument analytics_configuration", value=analytics_configuration, expected_type=type_hints["analytics_configuration"])
            check_type(argname="argument auth_session_validity", value=auth_session_validity, expected_type=type_hints["auth_session_validity"])
            check_type(argname="argument callback_urls", value=callback_urls, expected_type=type_hints["callback_urls"])
            check_type(argname="argument default_redirect_uri", value=default_redirect_uri, expected_type=type_hints["default_redirect_uri"])
            check_type(argname="argument enable_propagate_additional_user_context_data", value=enable_propagate_additional_user_context_data, expected_type=type_hints["enable_propagate_additional_user_context_data"])
            check_type(argname="argument enable_token_revocation", value=enable_token_revocation, expected_type=type_hints["enable_token_revocation"])
            check_type(argname="argument explicit_auth_flows", value=explicit_auth_flows, expected_type=type_hints["explicit_auth_flows"])
            check_type(argname="argument id_token_validity", value=id_token_validity, expected_type=type_hints["id_token_validity"])
            check_type(argname="argument logout_urls", value=logout_urls, expected_type=type_hints["logout_urls"])
            check_type(argname="argument name_pattern", value=name_pattern, expected_type=type_hints["name_pattern"])
            check_type(argname="argument name_prefix", value=name_prefix, expected_type=type_hints["name_prefix"])
            check_type(argname="argument prevent_user_existence_errors", value=prevent_user_existence_errors, expected_type=type_hints["prevent_user_existence_errors"])
            check_type(argname="argument read_attributes", value=read_attributes, expected_type=type_hints["read_attributes"])
            check_type(argname="argument refresh_token_rotation", value=refresh_token_rotation, expected_type=type_hints["refresh_token_rotation"])
            check_type(argname="argument refresh_token_validity", value=refresh_token_validity, expected_type=type_hints["refresh_token_validity"])
            check_type(argname="argument supported_identity_providers", value=supported_identity_providers, expected_type=type_hints["supported_identity_providers"])
            check_type(argname="argument token_validity_units", value=token_validity_units, expected_type=type_hints["token_validity_units"])
            check_type(argname="argument write_attributes", value=write_attributes, expected_type=type_hints["write_attributes"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "user_pool_id": user_pool_id,
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
        if access_token_validity is not None:
            self._values["access_token_validity"] = access_token_validity
        if allowed_oauth_flows is not None:
            self._values["allowed_oauth_flows"] = allowed_oauth_flows
        if allowed_oauth_flows_user_pool_client is not None:
            self._values["allowed_oauth_flows_user_pool_client"] = allowed_oauth_flows_user_pool_client
        if allowed_oauth_scopes is not None:
            self._values["allowed_oauth_scopes"] = allowed_oauth_scopes
        if analytics_configuration is not None:
            self._values["analytics_configuration"] = analytics_configuration
        if auth_session_validity is not None:
            self._values["auth_session_validity"] = auth_session_validity
        if callback_urls is not None:
            self._values["callback_urls"] = callback_urls
        if default_redirect_uri is not None:
            self._values["default_redirect_uri"] = default_redirect_uri
        if enable_propagate_additional_user_context_data is not None:
            self._values["enable_propagate_additional_user_context_data"] = enable_propagate_additional_user_context_data
        if enable_token_revocation is not None:
            self._values["enable_token_revocation"] = enable_token_revocation
        if explicit_auth_flows is not None:
            self._values["explicit_auth_flows"] = explicit_auth_flows
        if id_token_validity is not None:
            self._values["id_token_validity"] = id_token_validity
        if logout_urls is not None:
            self._values["logout_urls"] = logout_urls
        if name_pattern is not None:
            self._values["name_pattern"] = name_pattern
        if name_prefix is not None:
            self._values["name_prefix"] = name_prefix
        if prevent_user_existence_errors is not None:
            self._values["prevent_user_existence_errors"] = prevent_user_existence_errors
        if read_attributes is not None:
            self._values["read_attributes"] = read_attributes
        if refresh_token_rotation is not None:
            self._values["refresh_token_rotation"] = refresh_token_rotation
        if refresh_token_validity is not None:
            self._values["refresh_token_validity"] = refresh_token_validity
        if supported_identity_providers is not None:
            self._values["supported_identity_providers"] = supported_identity_providers
        if token_validity_units is not None:
            self._values["token_validity_units"] = token_validity_units
        if write_attributes is not None:
            self._values["write_attributes"] = write_attributes

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
    def user_pool_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#user_pool_id CognitoManagedUserPoolClient#user_pool_id}.'''
        result = self._values.get("user_pool_id")
        assert result is not None, "Required property 'user_pool_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def access_token_validity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#access_token_validity CognitoManagedUserPoolClient#access_token_validity}.'''
        result = self._values.get("access_token_validity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def allowed_oauth_flows(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_flows CognitoManagedUserPoolClient#allowed_oauth_flows}.'''
        result = self._values.get("allowed_oauth_flows")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def allowed_oauth_flows_user_pool_client(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_flows_user_pool_client CognitoManagedUserPoolClient#allowed_oauth_flows_user_pool_client}.'''
        result = self._values.get("allowed_oauth_flows_user_pool_client")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def allowed_oauth_scopes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#allowed_oauth_scopes CognitoManagedUserPoolClient#allowed_oauth_scopes}.'''
        result = self._values.get("allowed_oauth_scopes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def analytics_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientAnalyticsConfiguration]]]:
        '''analytics_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#analytics_configuration CognitoManagedUserPoolClient#analytics_configuration}
        '''
        result = self._values.get("analytics_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientAnalyticsConfiguration]]], result)

    @builtins.property
    def auth_session_validity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#auth_session_validity CognitoManagedUserPoolClient#auth_session_validity}.'''
        result = self._values.get("auth_session_validity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def callback_urls(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#callback_urls CognitoManagedUserPoolClient#callback_urls}.'''
        result = self._values.get("callback_urls")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def default_redirect_uri(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#default_redirect_uri CognitoManagedUserPoolClient#default_redirect_uri}.'''
        result = self._values.get("default_redirect_uri")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def enable_propagate_additional_user_context_data(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#enable_propagate_additional_user_context_data CognitoManagedUserPoolClient#enable_propagate_additional_user_context_data}.'''
        result = self._values.get("enable_propagate_additional_user_context_data")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def enable_token_revocation(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#enable_token_revocation CognitoManagedUserPoolClient#enable_token_revocation}.'''
        result = self._values.get("enable_token_revocation")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def explicit_auth_flows(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#explicit_auth_flows CognitoManagedUserPoolClient#explicit_auth_flows}.'''
        result = self._values.get("explicit_auth_flows")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def id_token_validity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#id_token_validity CognitoManagedUserPoolClient#id_token_validity}.'''
        result = self._values.get("id_token_validity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def logout_urls(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#logout_urls CognitoManagedUserPoolClient#logout_urls}.'''
        result = self._values.get("logout_urls")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def name_pattern(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#name_pattern CognitoManagedUserPoolClient#name_pattern}.'''
        result = self._values.get("name_pattern")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def name_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#name_prefix CognitoManagedUserPoolClient#name_prefix}.'''
        result = self._values.get("name_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def prevent_user_existence_errors(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#prevent_user_existence_errors CognitoManagedUserPoolClient#prevent_user_existence_errors}.'''
        result = self._values.get("prevent_user_existence_errors")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def read_attributes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#read_attributes CognitoManagedUserPoolClient#read_attributes}.'''
        result = self._values.get("read_attributes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def refresh_token_rotation(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CognitoManagedUserPoolClientRefreshTokenRotation"]]]:
        '''refresh_token_rotation block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token_rotation CognitoManagedUserPoolClient#refresh_token_rotation}
        '''
        result = self._values.get("refresh_token_rotation")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CognitoManagedUserPoolClientRefreshTokenRotation"]]], result)

    @builtins.property
    def refresh_token_validity(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token_validity CognitoManagedUserPoolClient#refresh_token_validity}.'''
        result = self._values.get("refresh_token_validity")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def supported_identity_providers(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#supported_identity_providers CognitoManagedUserPoolClient#supported_identity_providers}.'''
        result = self._values.get("supported_identity_providers")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def token_validity_units(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CognitoManagedUserPoolClientTokenValidityUnits"]]]:
        '''token_validity_units block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#token_validity_units CognitoManagedUserPoolClient#token_validity_units}
        '''
        result = self._values.get("token_validity_units")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["CognitoManagedUserPoolClientTokenValidityUnits"]]], result)

    @builtins.property
    def write_attributes(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#write_attributes CognitoManagedUserPoolClient#write_attributes}.'''
        result = self._values.get("write_attributes")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CognitoManagedUserPoolClientConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientRefreshTokenRotation",
    jsii_struct_bases=[],
    name_mapping={
        "feature": "feature",
        "retry_grace_period_seconds": "retryGracePeriodSeconds",
    },
)
class CognitoManagedUserPoolClientRefreshTokenRotation:
    def __init__(
        self,
        *,
        feature: builtins.str,
        retry_grace_period_seconds: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param feature: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#feature CognitoManagedUserPoolClient#feature}.
        :param retry_grace_period_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#retry_grace_period_seconds CognitoManagedUserPoolClient#retry_grace_period_seconds}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__74aaef5e3a8047c79b31dbe92ef32d1e01d5d2bb02a80d288e03baedf9d93bca)
            check_type(argname="argument feature", value=feature, expected_type=type_hints["feature"])
            check_type(argname="argument retry_grace_period_seconds", value=retry_grace_period_seconds, expected_type=type_hints["retry_grace_period_seconds"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "feature": feature,
        }
        if retry_grace_period_seconds is not None:
            self._values["retry_grace_period_seconds"] = retry_grace_period_seconds

    @builtins.property
    def feature(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#feature CognitoManagedUserPoolClient#feature}.'''
        result = self._values.get("feature")
        assert result is not None, "Required property 'feature' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def retry_grace_period_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#retry_grace_period_seconds CognitoManagedUserPoolClient#retry_grace_period_seconds}.'''
        result = self._values.get("retry_grace_period_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CognitoManagedUserPoolClientRefreshTokenRotation(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CognitoManagedUserPoolClientRefreshTokenRotationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientRefreshTokenRotationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__79cfae655f7cc4bb605e7bd339cec02a18b74a14a8548e72fbfacddbe844cf29)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CognitoManagedUserPoolClientRefreshTokenRotationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6161c5df2092528b7c931035f6849a750d0217a3bafdfbaa977bd6a18cf8ab62)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CognitoManagedUserPoolClientRefreshTokenRotationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6ecdaf72cecb8b6fe3d0734d02416b3c2c54591da978fc6847cee70d6b7f9dd)
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
            type_hints = typing.get_type_hints(_typecheckingstub__24d9ab87ce7394451667eeaf3ef37e5850f5c8e931156411f4b4afc0e3ad4316)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ba8bf669b99dcbfd7704917d9cadb0800c1130756624e145f8041c9d75a17225)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientRefreshTokenRotation]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientRefreshTokenRotation]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientRefreshTokenRotation]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__afb5842e1feb0d0a70e730f80ed523ca65a634287f26c2fc6bfa47378e79a614)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CognitoManagedUserPoolClientRefreshTokenRotationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientRefreshTokenRotationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5c22e247ad019921be31e96d0f675fb2fdbcdfe6a9da52414027defd41ddba41)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetRetryGracePeriodSeconds")
    def reset_retry_grace_period_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRetryGracePeriodSeconds", []))

    @builtins.property
    @jsii.member(jsii_name="featureInput")
    def feature_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "featureInput"))

    @builtins.property
    @jsii.member(jsii_name="retryGracePeriodSecondsInput")
    def retry_grace_period_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "retryGracePeriodSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="feature")
    def feature(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "feature"))

    @feature.setter
    def feature(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f5d3f581984db14132899cc3ac9615ad6f44070e94205f3b9a72a3b3912288e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "feature", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="retryGracePeriodSeconds")
    def retry_grace_period_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "retryGracePeriodSeconds"))

    @retry_grace_period_seconds.setter
    def retry_grace_period_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a491e74741fca2bed1dc36b6f05880e4b2a06220d4460ae4201d8aa86d4d1601)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "retryGracePeriodSeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CognitoManagedUserPoolClientRefreshTokenRotation]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CognitoManagedUserPoolClientRefreshTokenRotation]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CognitoManagedUserPoolClientRefreshTokenRotation]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b677c2929f4b1e9c4b235f757a962adf9fdd1fe47b16d3c7c27f893e6b2395a6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientTokenValidityUnits",
    jsii_struct_bases=[],
    name_mapping={
        "access_token": "accessToken",
        "id_token": "idToken",
        "refresh_token": "refreshToken",
    },
)
class CognitoManagedUserPoolClientTokenValidityUnits:
    def __init__(
        self,
        *,
        access_token: typing.Optional[builtins.str] = None,
        id_token: typing.Optional[builtins.str] = None,
        refresh_token: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param access_token: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#access_token CognitoManagedUserPoolClient#access_token}.
        :param id_token: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#id_token CognitoManagedUserPoolClient#id_token}.
        :param refresh_token: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token CognitoManagedUserPoolClient#refresh_token}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ee42812142e2cb56ddcbb29e108ef5afb8f069cfec5227c597d239d56c904b3)
            check_type(argname="argument access_token", value=access_token, expected_type=type_hints["access_token"])
            check_type(argname="argument id_token", value=id_token, expected_type=type_hints["id_token"])
            check_type(argname="argument refresh_token", value=refresh_token, expected_type=type_hints["refresh_token"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if access_token is not None:
            self._values["access_token"] = access_token
        if id_token is not None:
            self._values["id_token"] = id_token
        if refresh_token is not None:
            self._values["refresh_token"] = refresh_token

    @builtins.property
    def access_token(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#access_token CognitoManagedUserPoolClient#access_token}.'''
        result = self._values.get("access_token")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id_token(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#id_token CognitoManagedUserPoolClient#id_token}.'''
        result = self._values.get("id_token")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def refresh_token(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_managed_user_pool_client#refresh_token CognitoManagedUserPoolClient#refresh_token}.'''
        result = self._values.get("refresh_token")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "CognitoManagedUserPoolClientTokenValidityUnits(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class CognitoManagedUserPoolClientTokenValidityUnitsList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientTokenValidityUnitsList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__79eee9eb07eb6cec1bc0cf9bf03ea8a32a1ca4553237b91e0f0bf3d9464f074e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "CognitoManagedUserPoolClientTokenValidityUnitsOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__26837e2cc6c7b36736d98002c5517ee4f1c547812350e0628d0702ea41112481)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("CognitoManagedUserPoolClientTokenValidityUnitsOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c7544373f390451bbee709d5bc25c8795c4d0bdb8f9e2ddb71c2f902e90dc7be)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1759a19d95f3db7b65b29fb390e56db2f218bddb42d724ce0674fe9ac144a0e9)
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
            type_hints = typing.get_type_hints(_typecheckingstub__57c1bb55f81c82a63e1eb8c596cc29326259f92d161cdce9cd94c57b363d3015)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientTokenValidityUnits]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientTokenValidityUnits]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientTokenValidityUnits]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9813cc3e43457dd9630ac2d6799fb34b0330298ccaf8a83cb337f0171b5bdd04)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class CognitoManagedUserPoolClientTokenValidityUnitsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.cognitoManagedUserPoolClient.CognitoManagedUserPoolClientTokenValidityUnitsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__966a4c45734a3597f1d29bb715e48cf5d2e7f135bce19316e2b883b88fa9cb56)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetAccessToken")
    def reset_access_token(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccessToken", []))

    @jsii.member(jsii_name="resetIdToken")
    def reset_id_token(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdToken", []))

    @jsii.member(jsii_name="resetRefreshToken")
    def reset_refresh_token(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRefreshToken", []))

    @builtins.property
    @jsii.member(jsii_name="accessTokenInput")
    def access_token_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "accessTokenInput"))

    @builtins.property
    @jsii.member(jsii_name="idTokenInput")
    def id_token_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idTokenInput"))

    @builtins.property
    @jsii.member(jsii_name="refreshTokenInput")
    def refresh_token_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "refreshTokenInput"))

    @builtins.property
    @jsii.member(jsii_name="accessToken")
    def access_token(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "accessToken"))

    @access_token.setter
    def access_token(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c3c7f05686777737fec8c3f7d793c3ec57f30dae7749aa90081a6505f90918f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accessToken", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="idToken")
    def id_token(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "idToken"))

    @id_token.setter
    def id_token(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c9e090ed2b7c375382617a7afab6ce1f46c2b50074bb2a7007c9732d0c07d50c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "idToken", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="refreshToken")
    def refresh_token(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "refreshToken"))

    @refresh_token.setter
    def refresh_token(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__52c1b70b7d78ff4fbc47afc687752ffe852a5cae368289a3e2b86eb4eb5ba4fb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "refreshToken", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CognitoManagedUserPoolClientTokenValidityUnits]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CognitoManagedUserPoolClientTokenValidityUnits]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CognitoManagedUserPoolClientTokenValidityUnits]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ec2a6fb8a15376f91199c024ba3fdbd6c1a5cd7a98fed5d3fdea96b9b54b8462)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "CognitoManagedUserPoolClient",
    "CognitoManagedUserPoolClientAnalyticsConfiguration",
    "CognitoManagedUserPoolClientAnalyticsConfigurationList",
    "CognitoManagedUserPoolClientAnalyticsConfigurationOutputReference",
    "CognitoManagedUserPoolClientConfig",
    "CognitoManagedUserPoolClientRefreshTokenRotation",
    "CognitoManagedUserPoolClientRefreshTokenRotationList",
    "CognitoManagedUserPoolClientRefreshTokenRotationOutputReference",
    "CognitoManagedUserPoolClientTokenValidityUnits",
    "CognitoManagedUserPoolClientTokenValidityUnitsList",
    "CognitoManagedUserPoolClientTokenValidityUnitsOutputReference",
]

publication.publish()

def _typecheckingstub__da0950e8b76e7838e7b4989b085e8ad8aa53f7123f90a9dc358d7f640515159b(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    user_pool_id: builtins.str,
    access_token_validity: typing.Optional[jsii.Number] = None,
    allowed_oauth_flows: typing.Optional[typing.Sequence[builtins.str]] = None,
    allowed_oauth_flows_user_pool_client: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    allowed_oauth_scopes: typing.Optional[typing.Sequence[builtins.str]] = None,
    analytics_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CognitoManagedUserPoolClientAnalyticsConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    auth_session_validity: typing.Optional[jsii.Number] = None,
    callback_urls: typing.Optional[typing.Sequence[builtins.str]] = None,
    default_redirect_uri: typing.Optional[builtins.str] = None,
    enable_propagate_additional_user_context_data: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_token_revocation: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    explicit_auth_flows: typing.Optional[typing.Sequence[builtins.str]] = None,
    id_token_validity: typing.Optional[jsii.Number] = None,
    logout_urls: typing.Optional[typing.Sequence[builtins.str]] = None,
    name_pattern: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    prevent_user_existence_errors: typing.Optional[builtins.str] = None,
    read_attributes: typing.Optional[typing.Sequence[builtins.str]] = None,
    refresh_token_rotation: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CognitoManagedUserPoolClientRefreshTokenRotation, typing.Dict[builtins.str, typing.Any]]]]] = None,
    refresh_token_validity: typing.Optional[jsii.Number] = None,
    supported_identity_providers: typing.Optional[typing.Sequence[builtins.str]] = None,
    token_validity_units: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CognitoManagedUserPoolClientTokenValidityUnits, typing.Dict[builtins.str, typing.Any]]]]] = None,
    write_attributes: typing.Optional[typing.Sequence[builtins.str]] = None,
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

def _typecheckingstub__29ca70b9829f603af6d426fd9cc59f452d2aa119a934c9fd202285a3732b1b03(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e38655eb6780ae575f8a4744e25ad1014c5756bc12153a99b5f9212633aa324c(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CognitoManagedUserPoolClientAnalyticsConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64beb9261a5e4679efb1bb2a03bb64c86af431cd0837cfa0b47f5582caf862e4(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CognitoManagedUserPoolClientRefreshTokenRotation, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6da91114a95c52a64a405d09964a67997e3284b5a3d2c9621273e626906120a(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CognitoManagedUserPoolClientTokenValidityUnits, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__57dcc9edd730ca76d916de8fc3716a9b2d89d9acec850b557aa54d141bd549d0(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__434da50e7ccf90ecfc4c9537baa35f6f7ea873e86f56cb6b4e746dafa2d9a970(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__611489608a7559ecc6acf6fd4f4f8ab5c75e788f665bcf901c135769bd993eff(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9196872f75199b30b6bb9f18557f5a3db8876df2d01d5f0c7456eb9cd8c2ce25(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3831d6f8bacdf8206fdceb4d204b073ac1ade80efeb678961e720fc47ded208(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5b4c9d3aa8420de0a19ed2d120b5534d9b679fed5326e34f30b3c690379d09ba(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec8dbadf416946ab1cdfe8e9304f790a7c3c52ab95d4a671bedb34a4d6a52487(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c685b777c8cce3ecc842f64c7e2782bd82eb1f9dcf525b88a1c9b79ea3bfdd8(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0b3d7c63f4b6091386e6aa832aff4eb6522c79fb0d4450d63a6085d0f859c2e(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec46dfe60a6423240fe0a630fd49e010de875b55da1156e1199dff12e77be231(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f88743025ff65d831aa9e1b8ab45eb8b6e508f90f7a67dd3cc9bc84883dfc3e8(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__28bec16e343282aa6e3c88eaa4cce40244530dcbccfc4ee0e978923c2f4649f4(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e617a7640189ec959bebdbe668df6c574f2a3fc73885a17377b48178068d3ac2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d6620387f407c295c1c7fe6a9abfcf836542a4c32b5afd79d7b80f1fe8e69ded(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__13c086a6c229599f9acdd506740c7af7025d7b266fa03949bcf065dd7e0bc759(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6410daa9a1f7412e178f34163153f7fb792640574e3f7151b39e2f382890361(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3cf3b9d8326c847d388179c68b548f73514b12a09fc24970eac092b077df8538(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__26285cf85dcf6f4b1c9e752b5e4b20e3ceee2cf20794189ab414f699f2c57d95(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c6d5894f1d0e67a8d8fe070587b58a8aca7e4ccc1666789a2c90aacc39c32344(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0fe6f007d4777aed411191c4582bbff6f90c87ad5a323ad9a86042ecfa52d7fa(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__599ed9de1a04f2bd9a6b5847ed9b6bb6b40b786678cf66c97d9a8b1a8606fef6(
    *,
    application_arn: typing.Optional[builtins.str] = None,
    application_id: typing.Optional[builtins.str] = None,
    external_id: typing.Optional[builtins.str] = None,
    role_arn: typing.Optional[builtins.str] = None,
    user_data_shared: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afde8ec438702cc146f4044922f6db087598c185af58c0a6875b9426df02fd4c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__18eb625e18b8a864c325c176f7968b11af0990c38ed275c5062b05823a9ec62e(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__36c962718c5a8c5e52de8e8b3d4702488ae56c00085bc5a94238dfb719cb12f6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30a1e872b6437d4f0f6e33b208d4ef5a4203314bfdae30bd9c3bd8446fd1a92d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4e909994fac2bedf16bc63f26aa14bdde12d4d75b2d68e45ca3a9a7cafb4d2cb(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d3d1cd3bd31aefbddbda7db3c7103d8d23d03a5208357f55bf57b79a2c799d7(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientAnalyticsConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0b6f73ccd542f8c1feae074a62a8688fcabf34c4962dfb93fbddf30af07f15fe(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e377d36fbe0f3d7cb3206e7e7eebe47dfa389be7848f6ad1658f2f6c123c4aec(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__68f43691ded34136179bfc1956ea1f7fc85495f812a9b2b7bef031c7e6d78f5f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__069edb2303ad54410c49eb926c261b8b4fd6be6210cfc80fbae14bc06027838f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c0307ee078ffa349afe575d8619df8678f36b2f8dc2d047e0822d6ac168d585(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30362ab482f1fda87575b5e6f5865656f77610d947228d585cf2d959df469532(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7fc8aaa5e96c66054cc63b34e9db268688e41d1064c4aafd503a0de0b3e06f1e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CognitoManagedUserPoolClientAnalyticsConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d1b248903930c4ab21b59e441ee2bb2ebf5ee3fcfc2731657dfd53d4b0043377(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    user_pool_id: builtins.str,
    access_token_validity: typing.Optional[jsii.Number] = None,
    allowed_oauth_flows: typing.Optional[typing.Sequence[builtins.str]] = None,
    allowed_oauth_flows_user_pool_client: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    allowed_oauth_scopes: typing.Optional[typing.Sequence[builtins.str]] = None,
    analytics_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CognitoManagedUserPoolClientAnalyticsConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    auth_session_validity: typing.Optional[jsii.Number] = None,
    callback_urls: typing.Optional[typing.Sequence[builtins.str]] = None,
    default_redirect_uri: typing.Optional[builtins.str] = None,
    enable_propagate_additional_user_context_data: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    enable_token_revocation: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    explicit_auth_flows: typing.Optional[typing.Sequence[builtins.str]] = None,
    id_token_validity: typing.Optional[jsii.Number] = None,
    logout_urls: typing.Optional[typing.Sequence[builtins.str]] = None,
    name_pattern: typing.Optional[builtins.str] = None,
    name_prefix: typing.Optional[builtins.str] = None,
    prevent_user_existence_errors: typing.Optional[builtins.str] = None,
    read_attributes: typing.Optional[typing.Sequence[builtins.str]] = None,
    refresh_token_rotation: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CognitoManagedUserPoolClientRefreshTokenRotation, typing.Dict[builtins.str, typing.Any]]]]] = None,
    refresh_token_validity: typing.Optional[jsii.Number] = None,
    supported_identity_providers: typing.Optional[typing.Sequence[builtins.str]] = None,
    token_validity_units: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[CognitoManagedUserPoolClientTokenValidityUnits, typing.Dict[builtins.str, typing.Any]]]]] = None,
    write_attributes: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__74aaef5e3a8047c79b31dbe92ef32d1e01d5d2bb02a80d288e03baedf9d93bca(
    *,
    feature: builtins.str,
    retry_grace_period_seconds: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79cfae655f7cc4bb605e7bd339cec02a18b74a14a8548e72fbfacddbe844cf29(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6161c5df2092528b7c931035f6849a750d0217a3bafdfbaa977bd6a18cf8ab62(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6ecdaf72cecb8b6fe3d0734d02416b3c2c54591da978fc6847cee70d6b7f9dd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24d9ab87ce7394451667eeaf3ef37e5850f5c8e931156411f4b4afc0e3ad4316(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ba8bf669b99dcbfd7704917d9cadb0800c1130756624e145f8041c9d75a17225(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__afb5842e1feb0d0a70e730f80ed523ca65a634287f26c2fc6bfa47378e79a614(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientRefreshTokenRotation]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c22e247ad019921be31e96d0f675fb2fdbcdfe6a9da52414027defd41ddba41(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5d3f581984db14132899cc3ac9615ad6f44070e94205f3b9a72a3b3912288e8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a491e74741fca2bed1dc36b6f05880e4b2a06220d4460ae4201d8aa86d4d1601(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b677c2929f4b1e9c4b235f757a962adf9fdd1fe47b16d3c7c27f893e6b2395a6(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CognitoManagedUserPoolClientRefreshTokenRotation]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ee42812142e2cb56ddcbb29e108ef5afb8f069cfec5227c597d239d56c904b3(
    *,
    access_token: typing.Optional[builtins.str] = None,
    id_token: typing.Optional[builtins.str] = None,
    refresh_token: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79eee9eb07eb6cec1bc0cf9bf03ea8a32a1ca4553237b91e0f0bf3d9464f074e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__26837e2cc6c7b36736d98002c5517ee4f1c547812350e0628d0702ea41112481(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7544373f390451bbee709d5bc25c8795c4d0bdb8f9e2ddb71c2f902e90dc7be(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1759a19d95f3db7b65b29fb390e56db2f218bddb42d724ce0674fe9ac144a0e9(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__57c1bb55f81c82a63e1eb8c596cc29326259f92d161cdce9cd94c57b363d3015(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9813cc3e43457dd9630ac2d6799fb34b0330298ccaf8a83cb337f0171b5bdd04(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[CognitoManagedUserPoolClientTokenValidityUnits]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__966a4c45734a3597f1d29bb715e48cf5d2e7f135bce19316e2b883b88fa9cb56(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c3c7f05686777737fec8c3f7d793c3ec57f30dae7749aa90081a6505f90918f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c9e090ed2b7c375382617a7afab6ce1f46c2b50074bb2a7007c9732d0c07d50c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__52c1b70b7d78ff4fbc47afc687752ffe852a5cae368289a3e2b86eb4eb5ba4fb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ec2a6fb8a15376f91199c024ba3fdbd6c1a5cd7a98fed5d3fdea96b9b54b8462(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, CognitoManagedUserPoolClientTokenValidityUnits]],
) -> None:
    """Type checking stubs"""
    pass
