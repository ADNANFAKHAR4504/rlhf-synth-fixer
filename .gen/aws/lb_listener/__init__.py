r'''
# `aws_lb_listener`

Refer to the Terraform Registry for docs: [`aws_lb_listener`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener).
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


class LbListener(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListener",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener aws_lb_listener}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        default_action: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["LbListenerDefaultAction", typing.Dict[builtins.str, typing.Any]]]],
        load_balancer_arn: builtins.str,
        alpn_policy: typing.Optional[builtins.str] = None,
        certificate_arn: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        mutual_authentication: typing.Optional[typing.Union["LbListenerMutualAuthentication", typing.Dict[builtins.str, typing.Any]]] = None,
        port: typing.Optional[jsii.Number] = None,
        protocol: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_mtls_clientcert_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_mtls_clientcert_issuer_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_mtls_clientcert_leaf_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_mtls_clientcert_subject_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_mtls_clientcert_validity_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_tls_cipher_suite_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_tls_version_header_name: typing.Optional[builtins.str] = None,
        routing_http_response_access_control_allow_credentials_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_access_control_allow_headers_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_access_control_allow_methods_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_access_control_allow_origin_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_access_control_expose_headers_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_access_control_max_age_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_content_security_policy_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_server_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        routing_http_response_strict_transport_security_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_x_content_type_options_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_x_frame_options_header_value: typing.Optional[builtins.str] = None,
        ssl_policy: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tcp_idle_timeout_seconds: typing.Optional[jsii.Number] = None,
        timeouts: typing.Optional[typing.Union["LbListenerTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener aws_lb_listener} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param default_action: default_action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#default_action LbListener#default_action}
        :param load_balancer_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#load_balancer_arn LbListener#load_balancer_arn}.
        :param alpn_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#alpn_policy LbListener#alpn_policy}.
        :param certificate_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#certificate_arn LbListener#certificate_arn}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#id LbListener#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param mutual_authentication: mutual_authentication block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#mutual_authentication LbListener#mutual_authentication}
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#port LbListener#port}.
        :param protocol: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#protocol LbListener#protocol}.
        :param routing_http_request_x_amzn_mtls_clientcert_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_header_name}.
        :param routing_http_request_x_amzn_mtls_clientcert_issuer_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name}.
        :param routing_http_request_x_amzn_mtls_clientcert_leaf_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name}.
        :param routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name}.
        :param routing_http_request_x_amzn_mtls_clientcert_subject_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name}.
        :param routing_http_request_x_amzn_mtls_clientcert_validity_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name}.
        :param routing_http_request_x_amzn_tls_cipher_suite_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_cipher_suite_header_name LbListener#routing_http_request_x_amzn_tls_cipher_suite_header_name}.
        :param routing_http_request_x_amzn_tls_version_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_version_header_name LbListener#routing_http_request_x_amzn_tls_version_header_name}.
        :param routing_http_response_access_control_allow_credentials_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_credentials_header_value LbListener#routing_http_response_access_control_allow_credentials_header_value}.
        :param routing_http_response_access_control_allow_headers_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_headers_header_value LbListener#routing_http_response_access_control_allow_headers_header_value}.
        :param routing_http_response_access_control_allow_methods_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_methods_header_value LbListener#routing_http_response_access_control_allow_methods_header_value}.
        :param routing_http_response_access_control_allow_origin_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_origin_header_value LbListener#routing_http_response_access_control_allow_origin_header_value}.
        :param routing_http_response_access_control_expose_headers_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_expose_headers_header_value LbListener#routing_http_response_access_control_expose_headers_header_value}.
        :param routing_http_response_access_control_max_age_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_max_age_header_value LbListener#routing_http_response_access_control_max_age_header_value}.
        :param routing_http_response_content_security_policy_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_content_security_policy_header_value LbListener#routing_http_response_content_security_policy_header_value}.
        :param routing_http_response_server_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_server_enabled LbListener#routing_http_response_server_enabled}.
        :param routing_http_response_strict_transport_security_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_strict_transport_security_header_value LbListener#routing_http_response_strict_transport_security_header_value}.
        :param routing_http_response_x_content_type_options_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_content_type_options_header_value LbListener#routing_http_response_x_content_type_options_header_value}.
        :param routing_http_response_x_frame_options_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_frame_options_header_value LbListener#routing_http_response_x_frame_options_header_value}.
        :param ssl_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#ssl_policy LbListener#ssl_policy}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags LbListener#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags_all LbListener#tags_all}.
        :param tcp_idle_timeout_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tcp_idle_timeout_seconds LbListener#tcp_idle_timeout_seconds}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#timeouts LbListener#timeouts}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__11aa6e832a39dc0b2f4564b1efbe1a1c5c3bd2e9402f2d9a581a4afb7824ea60)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = LbListenerConfig(
            default_action=default_action,
            load_balancer_arn=load_balancer_arn,
            alpn_policy=alpn_policy,
            certificate_arn=certificate_arn,
            id=id,
            mutual_authentication=mutual_authentication,
            port=port,
            protocol=protocol,
            routing_http_request_x_amzn_mtls_clientcert_header_name=routing_http_request_x_amzn_mtls_clientcert_header_name,
            routing_http_request_x_amzn_mtls_clientcert_issuer_header_name=routing_http_request_x_amzn_mtls_clientcert_issuer_header_name,
            routing_http_request_x_amzn_mtls_clientcert_leaf_header_name=routing_http_request_x_amzn_mtls_clientcert_leaf_header_name,
            routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name=routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name,
            routing_http_request_x_amzn_mtls_clientcert_subject_header_name=routing_http_request_x_amzn_mtls_clientcert_subject_header_name,
            routing_http_request_x_amzn_mtls_clientcert_validity_header_name=routing_http_request_x_amzn_mtls_clientcert_validity_header_name,
            routing_http_request_x_amzn_tls_cipher_suite_header_name=routing_http_request_x_amzn_tls_cipher_suite_header_name,
            routing_http_request_x_amzn_tls_version_header_name=routing_http_request_x_amzn_tls_version_header_name,
            routing_http_response_access_control_allow_credentials_header_value=routing_http_response_access_control_allow_credentials_header_value,
            routing_http_response_access_control_allow_headers_header_value=routing_http_response_access_control_allow_headers_header_value,
            routing_http_response_access_control_allow_methods_header_value=routing_http_response_access_control_allow_methods_header_value,
            routing_http_response_access_control_allow_origin_header_value=routing_http_response_access_control_allow_origin_header_value,
            routing_http_response_access_control_expose_headers_header_value=routing_http_response_access_control_expose_headers_header_value,
            routing_http_response_access_control_max_age_header_value=routing_http_response_access_control_max_age_header_value,
            routing_http_response_content_security_policy_header_value=routing_http_response_content_security_policy_header_value,
            routing_http_response_server_enabled=routing_http_response_server_enabled,
            routing_http_response_strict_transport_security_header_value=routing_http_response_strict_transport_security_header_value,
            routing_http_response_x_content_type_options_header_value=routing_http_response_x_content_type_options_header_value,
            routing_http_response_x_frame_options_header_value=routing_http_response_x_frame_options_header_value,
            ssl_policy=ssl_policy,
            tags=tags,
            tags_all=tags_all,
            tcp_idle_timeout_seconds=tcp_idle_timeout_seconds,
            timeouts=timeouts,
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
        '''Generates CDKTF code for importing a LbListener resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the LbListener to import.
        :param import_from_id: The id of the existing LbListener that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the LbListener to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2193f235a70363b8fc122c47eb68be56446b1185c8aa48908d7f51530b890094)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putDefaultAction")
    def put_default_action(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["LbListenerDefaultAction", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c49101c37135b81706898fc278bbc24edaeda8432e55c19f593e9c7e5990686)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putDefaultAction", [value]))

    @jsii.member(jsii_name="putMutualAuthentication")
    def put_mutual_authentication(
        self,
        *,
        mode: builtins.str,
        advertise_trust_store_ca_names: typing.Optional[builtins.str] = None,
        ignore_client_certificate_expiry: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        trust_store_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#mode LbListener#mode}.
        :param advertise_trust_store_ca_names: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#advertise_trust_store_ca_names LbListener#advertise_trust_store_ca_names}.
        :param ignore_client_certificate_expiry: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#ignore_client_certificate_expiry LbListener#ignore_client_certificate_expiry}.
        :param trust_store_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#trust_store_arn LbListener#trust_store_arn}.
        '''
        value = LbListenerMutualAuthentication(
            mode=mode,
            advertise_trust_store_ca_names=advertise_trust_store_ca_names,
            ignore_client_certificate_expiry=ignore_client_certificate_expiry,
            trust_store_arn=trust_store_arn,
        )

        return typing.cast(None, jsii.invoke(self, "putMutualAuthentication", [value]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#create LbListener#create}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#update LbListener#update}.
        '''
        value = LbListenerTimeouts(create=create, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="resetAlpnPolicy")
    def reset_alpn_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAlpnPolicy", []))

    @jsii.member(jsii_name="resetCertificateArn")
    def reset_certificate_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCertificateArn", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetMutualAuthentication")
    def reset_mutual_authentication(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMutualAuthentication", []))

    @jsii.member(jsii_name="resetPort")
    def reset_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPort", []))

    @jsii.member(jsii_name="resetProtocol")
    def reset_protocol(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProtocol", []))

    @jsii.member(jsii_name="resetRoutingHttpRequestXAmznMtlsClientcertHeaderName")
    def reset_routing_http_request_x_amzn_mtls_clientcert_header_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpRequestXAmznMtlsClientcertHeaderName", []))

    @jsii.member(jsii_name="resetRoutingHttpRequestXAmznMtlsClientcertIssuerHeaderName")
    def reset_routing_http_request_x_amzn_mtls_clientcert_issuer_header_name(
        self,
    ) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpRequestXAmznMtlsClientcertIssuerHeaderName", []))

    @jsii.member(jsii_name="resetRoutingHttpRequestXAmznMtlsClientcertLeafHeaderName")
    def reset_routing_http_request_x_amzn_mtls_clientcert_leaf_header_name(
        self,
    ) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpRequestXAmznMtlsClientcertLeafHeaderName", []))

    @jsii.member(jsii_name="resetRoutingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName")
    def reset_routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name(
        self,
    ) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName", []))

    @jsii.member(jsii_name="resetRoutingHttpRequestXAmznMtlsClientcertSubjectHeaderName")
    def reset_routing_http_request_x_amzn_mtls_clientcert_subject_header_name(
        self,
    ) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpRequestXAmznMtlsClientcertSubjectHeaderName", []))

    @jsii.member(jsii_name="resetRoutingHttpRequestXAmznMtlsClientcertValidityHeaderName")
    def reset_routing_http_request_x_amzn_mtls_clientcert_validity_header_name(
        self,
    ) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpRequestXAmznMtlsClientcertValidityHeaderName", []))

    @jsii.member(jsii_name="resetRoutingHttpRequestXAmznTlsCipherSuiteHeaderName")
    def reset_routing_http_request_x_amzn_tls_cipher_suite_header_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpRequestXAmznTlsCipherSuiteHeaderName", []))

    @jsii.member(jsii_name="resetRoutingHttpRequestXAmznTlsVersionHeaderName")
    def reset_routing_http_request_x_amzn_tls_version_header_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpRequestXAmznTlsVersionHeaderName", []))

    @jsii.member(jsii_name="resetRoutingHttpResponseAccessControlAllowCredentialsHeaderValue")
    def reset_routing_http_response_access_control_allow_credentials_header_value(
        self,
    ) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpResponseAccessControlAllowCredentialsHeaderValue", []))

    @jsii.member(jsii_name="resetRoutingHttpResponseAccessControlAllowHeadersHeaderValue")
    def reset_routing_http_response_access_control_allow_headers_header_value(
        self,
    ) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpResponseAccessControlAllowHeadersHeaderValue", []))

    @jsii.member(jsii_name="resetRoutingHttpResponseAccessControlAllowMethodsHeaderValue")
    def reset_routing_http_response_access_control_allow_methods_header_value(
        self,
    ) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpResponseAccessControlAllowMethodsHeaderValue", []))

    @jsii.member(jsii_name="resetRoutingHttpResponseAccessControlAllowOriginHeaderValue")
    def reset_routing_http_response_access_control_allow_origin_header_value(
        self,
    ) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpResponseAccessControlAllowOriginHeaderValue", []))

    @jsii.member(jsii_name="resetRoutingHttpResponseAccessControlExposeHeadersHeaderValue")
    def reset_routing_http_response_access_control_expose_headers_header_value(
        self,
    ) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpResponseAccessControlExposeHeadersHeaderValue", []))

    @jsii.member(jsii_name="resetRoutingHttpResponseAccessControlMaxAgeHeaderValue")
    def reset_routing_http_response_access_control_max_age_header_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpResponseAccessControlMaxAgeHeaderValue", []))

    @jsii.member(jsii_name="resetRoutingHttpResponseContentSecurityPolicyHeaderValue")
    def reset_routing_http_response_content_security_policy_header_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpResponseContentSecurityPolicyHeaderValue", []))

    @jsii.member(jsii_name="resetRoutingHttpResponseServerEnabled")
    def reset_routing_http_response_server_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpResponseServerEnabled", []))

    @jsii.member(jsii_name="resetRoutingHttpResponseStrictTransportSecurityHeaderValue")
    def reset_routing_http_response_strict_transport_security_header_value(
        self,
    ) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpResponseStrictTransportSecurityHeaderValue", []))

    @jsii.member(jsii_name="resetRoutingHttpResponseXContentTypeOptionsHeaderValue")
    def reset_routing_http_response_x_content_type_options_header_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpResponseXContentTypeOptionsHeaderValue", []))

    @jsii.member(jsii_name="resetRoutingHttpResponseXFrameOptionsHeaderValue")
    def reset_routing_http_response_x_frame_options_header_value(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRoutingHttpResponseXFrameOptionsHeaderValue", []))

    @jsii.member(jsii_name="resetSslPolicy")
    def reset_ssl_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSslPolicy", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTcpIdleTimeoutSeconds")
    def reset_tcp_idle_timeout_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTcpIdleTimeoutSeconds", []))

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
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @builtins.property
    @jsii.member(jsii_name="defaultAction")
    def default_action(self) -> "LbListenerDefaultActionList":
        return typing.cast("LbListenerDefaultActionList", jsii.get(self, "defaultAction"))

    @builtins.property
    @jsii.member(jsii_name="mutualAuthentication")
    def mutual_authentication(self) -> "LbListenerMutualAuthenticationOutputReference":
        return typing.cast("LbListenerMutualAuthenticationOutputReference", jsii.get(self, "mutualAuthentication"))

    @builtins.property
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "LbListenerTimeoutsOutputReference":
        return typing.cast("LbListenerTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="alpnPolicyInput")
    def alpn_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "alpnPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="certificateArnInput")
    def certificate_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "certificateArnInput"))

    @builtins.property
    @jsii.member(jsii_name="defaultActionInput")
    def default_action_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LbListenerDefaultAction"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LbListenerDefaultAction"]]], jsii.get(self, "defaultActionInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="loadBalancerArnInput")
    def load_balancer_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "loadBalancerArnInput"))

    @builtins.property
    @jsii.member(jsii_name="mutualAuthenticationInput")
    def mutual_authentication_input(
        self,
    ) -> typing.Optional["LbListenerMutualAuthentication"]:
        return typing.cast(typing.Optional["LbListenerMutualAuthentication"], jsii.get(self, "mutualAuthenticationInput"))

    @builtins.property
    @jsii.member(jsii_name="portInput")
    def port_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "portInput"))

    @builtins.property
    @jsii.member(jsii_name="protocolInput")
    def protocol_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "protocolInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznMtlsClientcertHeaderNameInput")
    def routing_http_request_x_amzn_mtls_clientcert_header_name_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpRequestXAmznMtlsClientcertHeaderNameInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznMtlsClientcertIssuerHeaderNameInput")
    def routing_http_request_x_amzn_mtls_clientcert_issuer_header_name_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpRequestXAmznMtlsClientcertIssuerHeaderNameInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznMtlsClientcertLeafHeaderNameInput")
    def routing_http_request_x_amzn_mtls_clientcert_leaf_header_name_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpRequestXAmznMtlsClientcertLeafHeaderNameInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderNameInput")
    def routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderNameInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznMtlsClientcertSubjectHeaderNameInput")
    def routing_http_request_x_amzn_mtls_clientcert_subject_header_name_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpRequestXAmznMtlsClientcertSubjectHeaderNameInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznMtlsClientcertValidityHeaderNameInput")
    def routing_http_request_x_amzn_mtls_clientcert_validity_header_name_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpRequestXAmznMtlsClientcertValidityHeaderNameInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznTlsCipherSuiteHeaderNameInput")
    def routing_http_request_x_amzn_tls_cipher_suite_header_name_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpRequestXAmznTlsCipherSuiteHeaderNameInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznTlsVersionHeaderNameInput")
    def routing_http_request_x_amzn_tls_version_header_name_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpRequestXAmznTlsVersionHeaderNameInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseAccessControlAllowCredentialsHeaderValueInput")
    def routing_http_response_access_control_allow_credentials_header_value_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpResponseAccessControlAllowCredentialsHeaderValueInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseAccessControlAllowHeadersHeaderValueInput")
    def routing_http_response_access_control_allow_headers_header_value_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpResponseAccessControlAllowHeadersHeaderValueInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseAccessControlAllowMethodsHeaderValueInput")
    def routing_http_response_access_control_allow_methods_header_value_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpResponseAccessControlAllowMethodsHeaderValueInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseAccessControlAllowOriginHeaderValueInput")
    def routing_http_response_access_control_allow_origin_header_value_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpResponseAccessControlAllowOriginHeaderValueInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseAccessControlExposeHeadersHeaderValueInput")
    def routing_http_response_access_control_expose_headers_header_value_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpResponseAccessControlExposeHeadersHeaderValueInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseAccessControlMaxAgeHeaderValueInput")
    def routing_http_response_access_control_max_age_header_value_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpResponseAccessControlMaxAgeHeaderValueInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseContentSecurityPolicyHeaderValueInput")
    def routing_http_response_content_security_policy_header_value_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpResponseContentSecurityPolicyHeaderValueInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseServerEnabledInput")
    def routing_http_response_server_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "routingHttpResponseServerEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseStrictTransportSecurityHeaderValueInput")
    def routing_http_response_strict_transport_security_header_value_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpResponseStrictTransportSecurityHeaderValueInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseXContentTypeOptionsHeaderValueInput")
    def routing_http_response_x_content_type_options_header_value_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpResponseXContentTypeOptionsHeaderValueInput"))

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseXFrameOptionsHeaderValueInput")
    def routing_http_response_x_frame_options_header_value_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "routingHttpResponseXFrameOptionsHeaderValueInput"))

    @builtins.property
    @jsii.member(jsii_name="sslPolicyInput")
    def ssl_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sslPolicyInput"))

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
    @jsii.member(jsii_name="tcpIdleTimeoutSecondsInput")
    def tcp_idle_timeout_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "tcpIdleTimeoutSecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "LbListenerTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "LbListenerTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="alpnPolicy")
    def alpn_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "alpnPolicy"))

    @alpn_policy.setter
    def alpn_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ee2968fa8ba7b59de57945123103afc3ee2c1d3d078a5a00c2e5b872c83d9578)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "alpnPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="certificateArn")
    def certificate_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "certificateArn"))

    @certificate_arn.setter
    def certificate_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8491a4a562c5b81526c5593aa82b5799390391254a85c04ee21d3d29cf98e412)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "certificateArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1545cdd9a634337ee2ec771c655871b0e5587346b59771f8906acdeff4e1eaa2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="loadBalancerArn")
    def load_balancer_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "loadBalancerArn"))

    @load_balancer_arn.setter
    def load_balancer_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e581534118d4a1a42ad09d146cb6d1f7a06c64ce5ebdaff2437db9c7be8af10c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "loadBalancerArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="port")
    def port(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "port"))

    @port.setter
    def port(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7350f3c3d775138076108964bb3e9fd82cdbfd008c33f814d673048250ed20c2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "port", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="protocol")
    def protocol(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "protocol"))

    @protocol.setter
    def protocol(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e03147310ace0f554a1e071cf58741a7945cbcdb65a20ebaa6e77869b4a02e85)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "protocol", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznMtlsClientcertHeaderName")
    def routing_http_request_x_amzn_mtls_clientcert_header_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpRequestXAmznMtlsClientcertHeaderName"))

    @routing_http_request_x_amzn_mtls_clientcert_header_name.setter
    def routing_http_request_x_amzn_mtls_clientcert_header_name(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e16acbe8e3482222d791c1826448d9a69d5900d657497d03b91c8667b4a3d29b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpRequestXAmznMtlsClientcertHeaderName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznMtlsClientcertIssuerHeaderName")
    def routing_http_request_x_amzn_mtls_clientcert_issuer_header_name(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpRequestXAmznMtlsClientcertIssuerHeaderName"))

    @routing_http_request_x_amzn_mtls_clientcert_issuer_header_name.setter
    def routing_http_request_x_amzn_mtls_clientcert_issuer_header_name(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2901bfd777f5a885ab080aa069d5609d68b89e8fd7957e3fd80f1d372a0e89a8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpRequestXAmznMtlsClientcertIssuerHeaderName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznMtlsClientcertLeafHeaderName")
    def routing_http_request_x_amzn_mtls_clientcert_leaf_header_name(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpRequestXAmznMtlsClientcertLeafHeaderName"))

    @routing_http_request_x_amzn_mtls_clientcert_leaf_header_name.setter
    def routing_http_request_x_amzn_mtls_clientcert_leaf_header_name(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__64d64dea7ae250e00b5ed9c26ccfc2673e7b272be70e48b1d77ec6790c7fd403)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpRequestXAmznMtlsClientcertLeafHeaderName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName")
    def routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName"))

    @routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name.setter
    def routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__57642b02f52101cb362928cf93fd60162fb2b828e9dcb6738fd3e09b51fdb852)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznMtlsClientcertSubjectHeaderName")
    def routing_http_request_x_amzn_mtls_clientcert_subject_header_name(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpRequestXAmznMtlsClientcertSubjectHeaderName"))

    @routing_http_request_x_amzn_mtls_clientcert_subject_header_name.setter
    def routing_http_request_x_amzn_mtls_clientcert_subject_header_name(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__805a817b3318b46543579eec57edf42fc81d8dae9b4d18f88e3fabc3cd6e7ccc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpRequestXAmznMtlsClientcertSubjectHeaderName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznMtlsClientcertValidityHeaderName")
    def routing_http_request_x_amzn_mtls_clientcert_validity_header_name(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpRequestXAmznMtlsClientcertValidityHeaderName"))

    @routing_http_request_x_amzn_mtls_clientcert_validity_header_name.setter
    def routing_http_request_x_amzn_mtls_clientcert_validity_header_name(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3360e701f221fbd085241a555cba23ac446c8a368f734f74b2367baf0e330eed)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpRequestXAmznMtlsClientcertValidityHeaderName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznTlsCipherSuiteHeaderName")
    def routing_http_request_x_amzn_tls_cipher_suite_header_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpRequestXAmznTlsCipherSuiteHeaderName"))

    @routing_http_request_x_amzn_tls_cipher_suite_header_name.setter
    def routing_http_request_x_amzn_tls_cipher_suite_header_name(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__38a3f5c5c74059be7e42ead2ceae6db7aaf01964fa63f71596b30f4bf93afc89)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpRequestXAmznTlsCipherSuiteHeaderName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpRequestXAmznTlsVersionHeaderName")
    def routing_http_request_x_amzn_tls_version_header_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpRequestXAmznTlsVersionHeaderName"))

    @routing_http_request_x_amzn_tls_version_header_name.setter
    def routing_http_request_x_amzn_tls_version_header_name(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__936f6df0870bcea57f24898c341264eaa4f1394ee1e81468a2a675510ee9d2b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpRequestXAmznTlsVersionHeaderName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseAccessControlAllowCredentialsHeaderValue")
    def routing_http_response_access_control_allow_credentials_header_value(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpResponseAccessControlAllowCredentialsHeaderValue"))

    @routing_http_response_access_control_allow_credentials_header_value.setter
    def routing_http_response_access_control_allow_credentials_header_value(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c5a1a065d94bad7801110452716a3cd7c1f21807465dc06b2336586d2435c41e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpResponseAccessControlAllowCredentialsHeaderValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseAccessControlAllowHeadersHeaderValue")
    def routing_http_response_access_control_allow_headers_header_value(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpResponseAccessControlAllowHeadersHeaderValue"))

    @routing_http_response_access_control_allow_headers_header_value.setter
    def routing_http_response_access_control_allow_headers_header_value(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62e186e5c99839606eeb972d69193a17c31aad8dd4b7c2e72277ac154fc748c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpResponseAccessControlAllowHeadersHeaderValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseAccessControlAllowMethodsHeaderValue")
    def routing_http_response_access_control_allow_methods_header_value(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpResponseAccessControlAllowMethodsHeaderValue"))

    @routing_http_response_access_control_allow_methods_header_value.setter
    def routing_http_response_access_control_allow_methods_header_value(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f1a45237ec240a81f9f29f206846f85c807fd4b7f375a2697adb7095d09cf0b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpResponseAccessControlAllowMethodsHeaderValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseAccessControlAllowOriginHeaderValue")
    def routing_http_response_access_control_allow_origin_header_value(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpResponseAccessControlAllowOriginHeaderValue"))

    @routing_http_response_access_control_allow_origin_header_value.setter
    def routing_http_response_access_control_allow_origin_header_value(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8efff94c456239bad6765d014864f6c0ea768ef3bce00536978a3af8b649d4ea)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpResponseAccessControlAllowOriginHeaderValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseAccessControlExposeHeadersHeaderValue")
    def routing_http_response_access_control_expose_headers_header_value(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpResponseAccessControlExposeHeadersHeaderValue"))

    @routing_http_response_access_control_expose_headers_header_value.setter
    def routing_http_response_access_control_expose_headers_header_value(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b7675ba733ad8c1072adec3c62055b0114ec705d61efa54ec5daff050aa19ff3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpResponseAccessControlExposeHeadersHeaderValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseAccessControlMaxAgeHeaderValue")
    def routing_http_response_access_control_max_age_header_value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpResponseAccessControlMaxAgeHeaderValue"))

    @routing_http_response_access_control_max_age_header_value.setter
    def routing_http_response_access_control_max_age_header_value(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c8a65947f6995b4f96ba3867f29bdd7cca8f818603a77c7090e1180f9c526299)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpResponseAccessControlMaxAgeHeaderValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseContentSecurityPolicyHeaderValue")
    def routing_http_response_content_security_policy_header_value(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpResponseContentSecurityPolicyHeaderValue"))

    @routing_http_response_content_security_policy_header_value.setter
    def routing_http_response_content_security_policy_header_value(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__55f195e77ca87fedb5c9cd241ed740a61a6bd149d4b286099940a52f38095d6b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpResponseContentSecurityPolicyHeaderValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseServerEnabled")
    def routing_http_response_server_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "routingHttpResponseServerEnabled"))

    @routing_http_response_server_enabled.setter
    def routing_http_response_server_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d408d24d53b9897f6fba3189ec83b23812a613ac066a4a00ed2cce043cafde1f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpResponseServerEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseStrictTransportSecurityHeaderValue")
    def routing_http_response_strict_transport_security_header_value(
        self,
    ) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpResponseStrictTransportSecurityHeaderValue"))

    @routing_http_response_strict_transport_security_header_value.setter
    def routing_http_response_strict_transport_security_header_value(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1b4da4bad144bb46e87dc26ff94fa2fddfc324cd2a142bb9afa4b32ebc4645ca)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpResponseStrictTransportSecurityHeaderValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseXContentTypeOptionsHeaderValue")
    def routing_http_response_x_content_type_options_header_value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpResponseXContentTypeOptionsHeaderValue"))

    @routing_http_response_x_content_type_options_header_value.setter
    def routing_http_response_x_content_type_options_header_value(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__acaa39d944b304fc3a8faf8fbc970191b26f330b7797f2d282cbb83198a3ded2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpResponseXContentTypeOptionsHeaderValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="routingHttpResponseXFrameOptionsHeaderValue")
    def routing_http_response_x_frame_options_header_value(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "routingHttpResponseXFrameOptionsHeaderValue"))

    @routing_http_response_x_frame_options_header_value.setter
    def routing_http_response_x_frame_options_header_value(
        self,
        value: builtins.str,
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8bad2a1fdf10d218c35b28f40f8616e1d9b2067cd4f27c9f5ac93974660e90b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "routingHttpResponseXFrameOptionsHeaderValue", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sslPolicy")
    def ssl_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sslPolicy"))

    @ssl_policy.setter
    def ssl_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37790746f993017043b2198dad2e5b4d143a6ac379a3b4f82e925c015c174630)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sslPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__293b10742a5cce4b806c7829e2ce1ab2dcefb45b66c86f3f6a57ef80e5b0d8e6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__81d68e7b6a80b50f2a1a522dba84aac44637a53f1b2b042f41b2ff067d872581)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tcpIdleTimeoutSeconds")
    def tcp_idle_timeout_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "tcpIdleTimeoutSeconds"))

    @tcp_idle_timeout_seconds.setter
    def tcp_idle_timeout_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83a9b5b1fa32b986fa6cce4145bda2a31adac839ae27bb799b277123ac88c7ef)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tcpIdleTimeoutSeconds", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lbListener.LbListenerConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "default_action": "defaultAction",
        "load_balancer_arn": "loadBalancerArn",
        "alpn_policy": "alpnPolicy",
        "certificate_arn": "certificateArn",
        "id": "id",
        "mutual_authentication": "mutualAuthentication",
        "port": "port",
        "protocol": "protocol",
        "routing_http_request_x_amzn_mtls_clientcert_header_name": "routingHttpRequestXAmznMtlsClientcertHeaderName",
        "routing_http_request_x_amzn_mtls_clientcert_issuer_header_name": "routingHttpRequestXAmznMtlsClientcertIssuerHeaderName",
        "routing_http_request_x_amzn_mtls_clientcert_leaf_header_name": "routingHttpRequestXAmznMtlsClientcertLeafHeaderName",
        "routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name": "routingHttpRequestXAmznMtlsClientcertSerialNumberHeaderName",
        "routing_http_request_x_amzn_mtls_clientcert_subject_header_name": "routingHttpRequestXAmznMtlsClientcertSubjectHeaderName",
        "routing_http_request_x_amzn_mtls_clientcert_validity_header_name": "routingHttpRequestXAmznMtlsClientcertValidityHeaderName",
        "routing_http_request_x_amzn_tls_cipher_suite_header_name": "routingHttpRequestXAmznTlsCipherSuiteHeaderName",
        "routing_http_request_x_amzn_tls_version_header_name": "routingHttpRequestXAmznTlsVersionHeaderName",
        "routing_http_response_access_control_allow_credentials_header_value": "routingHttpResponseAccessControlAllowCredentialsHeaderValue",
        "routing_http_response_access_control_allow_headers_header_value": "routingHttpResponseAccessControlAllowHeadersHeaderValue",
        "routing_http_response_access_control_allow_methods_header_value": "routingHttpResponseAccessControlAllowMethodsHeaderValue",
        "routing_http_response_access_control_allow_origin_header_value": "routingHttpResponseAccessControlAllowOriginHeaderValue",
        "routing_http_response_access_control_expose_headers_header_value": "routingHttpResponseAccessControlExposeHeadersHeaderValue",
        "routing_http_response_access_control_max_age_header_value": "routingHttpResponseAccessControlMaxAgeHeaderValue",
        "routing_http_response_content_security_policy_header_value": "routingHttpResponseContentSecurityPolicyHeaderValue",
        "routing_http_response_server_enabled": "routingHttpResponseServerEnabled",
        "routing_http_response_strict_transport_security_header_value": "routingHttpResponseStrictTransportSecurityHeaderValue",
        "routing_http_response_x_content_type_options_header_value": "routingHttpResponseXContentTypeOptionsHeaderValue",
        "routing_http_response_x_frame_options_header_value": "routingHttpResponseXFrameOptionsHeaderValue",
        "ssl_policy": "sslPolicy",
        "tags": "tags",
        "tags_all": "tagsAll",
        "tcp_idle_timeout_seconds": "tcpIdleTimeoutSeconds",
        "timeouts": "timeouts",
    },
)
class LbListenerConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        default_action: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["LbListenerDefaultAction", typing.Dict[builtins.str, typing.Any]]]],
        load_balancer_arn: builtins.str,
        alpn_policy: typing.Optional[builtins.str] = None,
        certificate_arn: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        mutual_authentication: typing.Optional[typing.Union["LbListenerMutualAuthentication", typing.Dict[builtins.str, typing.Any]]] = None,
        port: typing.Optional[jsii.Number] = None,
        protocol: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_mtls_clientcert_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_mtls_clientcert_issuer_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_mtls_clientcert_leaf_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_mtls_clientcert_subject_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_mtls_clientcert_validity_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_tls_cipher_suite_header_name: typing.Optional[builtins.str] = None,
        routing_http_request_x_amzn_tls_version_header_name: typing.Optional[builtins.str] = None,
        routing_http_response_access_control_allow_credentials_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_access_control_allow_headers_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_access_control_allow_methods_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_access_control_allow_origin_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_access_control_expose_headers_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_access_control_max_age_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_content_security_policy_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_server_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        routing_http_response_strict_transport_security_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_x_content_type_options_header_value: typing.Optional[builtins.str] = None,
        routing_http_response_x_frame_options_header_value: typing.Optional[builtins.str] = None,
        ssl_policy: typing.Optional[builtins.str] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tcp_idle_timeout_seconds: typing.Optional[jsii.Number] = None,
        timeouts: typing.Optional[typing.Union["LbListenerTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param default_action: default_action block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#default_action LbListener#default_action}
        :param load_balancer_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#load_balancer_arn LbListener#load_balancer_arn}.
        :param alpn_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#alpn_policy LbListener#alpn_policy}.
        :param certificate_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#certificate_arn LbListener#certificate_arn}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#id LbListener#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param mutual_authentication: mutual_authentication block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#mutual_authentication LbListener#mutual_authentication}
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#port LbListener#port}.
        :param protocol: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#protocol LbListener#protocol}.
        :param routing_http_request_x_amzn_mtls_clientcert_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_header_name}.
        :param routing_http_request_x_amzn_mtls_clientcert_issuer_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name}.
        :param routing_http_request_x_amzn_mtls_clientcert_leaf_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name}.
        :param routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name}.
        :param routing_http_request_x_amzn_mtls_clientcert_subject_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name}.
        :param routing_http_request_x_amzn_mtls_clientcert_validity_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name}.
        :param routing_http_request_x_amzn_tls_cipher_suite_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_cipher_suite_header_name LbListener#routing_http_request_x_amzn_tls_cipher_suite_header_name}.
        :param routing_http_request_x_amzn_tls_version_header_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_version_header_name LbListener#routing_http_request_x_amzn_tls_version_header_name}.
        :param routing_http_response_access_control_allow_credentials_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_credentials_header_value LbListener#routing_http_response_access_control_allow_credentials_header_value}.
        :param routing_http_response_access_control_allow_headers_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_headers_header_value LbListener#routing_http_response_access_control_allow_headers_header_value}.
        :param routing_http_response_access_control_allow_methods_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_methods_header_value LbListener#routing_http_response_access_control_allow_methods_header_value}.
        :param routing_http_response_access_control_allow_origin_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_origin_header_value LbListener#routing_http_response_access_control_allow_origin_header_value}.
        :param routing_http_response_access_control_expose_headers_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_expose_headers_header_value LbListener#routing_http_response_access_control_expose_headers_header_value}.
        :param routing_http_response_access_control_max_age_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_max_age_header_value LbListener#routing_http_response_access_control_max_age_header_value}.
        :param routing_http_response_content_security_policy_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_content_security_policy_header_value LbListener#routing_http_response_content_security_policy_header_value}.
        :param routing_http_response_server_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_server_enabled LbListener#routing_http_response_server_enabled}.
        :param routing_http_response_strict_transport_security_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_strict_transport_security_header_value LbListener#routing_http_response_strict_transport_security_header_value}.
        :param routing_http_response_x_content_type_options_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_content_type_options_header_value LbListener#routing_http_response_x_content_type_options_header_value}.
        :param routing_http_response_x_frame_options_header_value: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_frame_options_header_value LbListener#routing_http_response_x_frame_options_header_value}.
        :param ssl_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#ssl_policy LbListener#ssl_policy}.
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags LbListener#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags_all LbListener#tags_all}.
        :param tcp_idle_timeout_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tcp_idle_timeout_seconds LbListener#tcp_idle_timeout_seconds}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#timeouts LbListener#timeouts}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(mutual_authentication, dict):
            mutual_authentication = LbListenerMutualAuthentication(**mutual_authentication)
        if isinstance(timeouts, dict):
            timeouts = LbListenerTimeouts(**timeouts)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5d092b4eec92f81adf91222be262046c3e8e0c5ad4bfcadbb794c5041ced2ca0)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument default_action", value=default_action, expected_type=type_hints["default_action"])
            check_type(argname="argument load_balancer_arn", value=load_balancer_arn, expected_type=type_hints["load_balancer_arn"])
            check_type(argname="argument alpn_policy", value=alpn_policy, expected_type=type_hints["alpn_policy"])
            check_type(argname="argument certificate_arn", value=certificate_arn, expected_type=type_hints["certificate_arn"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument mutual_authentication", value=mutual_authentication, expected_type=type_hints["mutual_authentication"])
            check_type(argname="argument port", value=port, expected_type=type_hints["port"])
            check_type(argname="argument protocol", value=protocol, expected_type=type_hints["protocol"])
            check_type(argname="argument routing_http_request_x_amzn_mtls_clientcert_header_name", value=routing_http_request_x_amzn_mtls_clientcert_header_name, expected_type=type_hints["routing_http_request_x_amzn_mtls_clientcert_header_name"])
            check_type(argname="argument routing_http_request_x_amzn_mtls_clientcert_issuer_header_name", value=routing_http_request_x_amzn_mtls_clientcert_issuer_header_name, expected_type=type_hints["routing_http_request_x_amzn_mtls_clientcert_issuer_header_name"])
            check_type(argname="argument routing_http_request_x_amzn_mtls_clientcert_leaf_header_name", value=routing_http_request_x_amzn_mtls_clientcert_leaf_header_name, expected_type=type_hints["routing_http_request_x_amzn_mtls_clientcert_leaf_header_name"])
            check_type(argname="argument routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name", value=routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name, expected_type=type_hints["routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name"])
            check_type(argname="argument routing_http_request_x_amzn_mtls_clientcert_subject_header_name", value=routing_http_request_x_amzn_mtls_clientcert_subject_header_name, expected_type=type_hints["routing_http_request_x_amzn_mtls_clientcert_subject_header_name"])
            check_type(argname="argument routing_http_request_x_amzn_mtls_clientcert_validity_header_name", value=routing_http_request_x_amzn_mtls_clientcert_validity_header_name, expected_type=type_hints["routing_http_request_x_amzn_mtls_clientcert_validity_header_name"])
            check_type(argname="argument routing_http_request_x_amzn_tls_cipher_suite_header_name", value=routing_http_request_x_amzn_tls_cipher_suite_header_name, expected_type=type_hints["routing_http_request_x_amzn_tls_cipher_suite_header_name"])
            check_type(argname="argument routing_http_request_x_amzn_tls_version_header_name", value=routing_http_request_x_amzn_tls_version_header_name, expected_type=type_hints["routing_http_request_x_amzn_tls_version_header_name"])
            check_type(argname="argument routing_http_response_access_control_allow_credentials_header_value", value=routing_http_response_access_control_allow_credentials_header_value, expected_type=type_hints["routing_http_response_access_control_allow_credentials_header_value"])
            check_type(argname="argument routing_http_response_access_control_allow_headers_header_value", value=routing_http_response_access_control_allow_headers_header_value, expected_type=type_hints["routing_http_response_access_control_allow_headers_header_value"])
            check_type(argname="argument routing_http_response_access_control_allow_methods_header_value", value=routing_http_response_access_control_allow_methods_header_value, expected_type=type_hints["routing_http_response_access_control_allow_methods_header_value"])
            check_type(argname="argument routing_http_response_access_control_allow_origin_header_value", value=routing_http_response_access_control_allow_origin_header_value, expected_type=type_hints["routing_http_response_access_control_allow_origin_header_value"])
            check_type(argname="argument routing_http_response_access_control_expose_headers_header_value", value=routing_http_response_access_control_expose_headers_header_value, expected_type=type_hints["routing_http_response_access_control_expose_headers_header_value"])
            check_type(argname="argument routing_http_response_access_control_max_age_header_value", value=routing_http_response_access_control_max_age_header_value, expected_type=type_hints["routing_http_response_access_control_max_age_header_value"])
            check_type(argname="argument routing_http_response_content_security_policy_header_value", value=routing_http_response_content_security_policy_header_value, expected_type=type_hints["routing_http_response_content_security_policy_header_value"])
            check_type(argname="argument routing_http_response_server_enabled", value=routing_http_response_server_enabled, expected_type=type_hints["routing_http_response_server_enabled"])
            check_type(argname="argument routing_http_response_strict_transport_security_header_value", value=routing_http_response_strict_transport_security_header_value, expected_type=type_hints["routing_http_response_strict_transport_security_header_value"])
            check_type(argname="argument routing_http_response_x_content_type_options_header_value", value=routing_http_response_x_content_type_options_header_value, expected_type=type_hints["routing_http_response_x_content_type_options_header_value"])
            check_type(argname="argument routing_http_response_x_frame_options_header_value", value=routing_http_response_x_frame_options_header_value, expected_type=type_hints["routing_http_response_x_frame_options_header_value"])
            check_type(argname="argument ssl_policy", value=ssl_policy, expected_type=type_hints["ssl_policy"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument tcp_idle_timeout_seconds", value=tcp_idle_timeout_seconds, expected_type=type_hints["tcp_idle_timeout_seconds"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "default_action": default_action,
            "load_balancer_arn": load_balancer_arn,
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
        if alpn_policy is not None:
            self._values["alpn_policy"] = alpn_policy
        if certificate_arn is not None:
            self._values["certificate_arn"] = certificate_arn
        if id is not None:
            self._values["id"] = id
        if mutual_authentication is not None:
            self._values["mutual_authentication"] = mutual_authentication
        if port is not None:
            self._values["port"] = port
        if protocol is not None:
            self._values["protocol"] = protocol
        if routing_http_request_x_amzn_mtls_clientcert_header_name is not None:
            self._values["routing_http_request_x_amzn_mtls_clientcert_header_name"] = routing_http_request_x_amzn_mtls_clientcert_header_name
        if routing_http_request_x_amzn_mtls_clientcert_issuer_header_name is not None:
            self._values["routing_http_request_x_amzn_mtls_clientcert_issuer_header_name"] = routing_http_request_x_amzn_mtls_clientcert_issuer_header_name
        if routing_http_request_x_amzn_mtls_clientcert_leaf_header_name is not None:
            self._values["routing_http_request_x_amzn_mtls_clientcert_leaf_header_name"] = routing_http_request_x_amzn_mtls_clientcert_leaf_header_name
        if routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name is not None:
            self._values["routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name"] = routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name
        if routing_http_request_x_amzn_mtls_clientcert_subject_header_name is not None:
            self._values["routing_http_request_x_amzn_mtls_clientcert_subject_header_name"] = routing_http_request_x_amzn_mtls_clientcert_subject_header_name
        if routing_http_request_x_amzn_mtls_clientcert_validity_header_name is not None:
            self._values["routing_http_request_x_amzn_mtls_clientcert_validity_header_name"] = routing_http_request_x_amzn_mtls_clientcert_validity_header_name
        if routing_http_request_x_amzn_tls_cipher_suite_header_name is not None:
            self._values["routing_http_request_x_amzn_tls_cipher_suite_header_name"] = routing_http_request_x_amzn_tls_cipher_suite_header_name
        if routing_http_request_x_amzn_tls_version_header_name is not None:
            self._values["routing_http_request_x_amzn_tls_version_header_name"] = routing_http_request_x_amzn_tls_version_header_name
        if routing_http_response_access_control_allow_credentials_header_value is not None:
            self._values["routing_http_response_access_control_allow_credentials_header_value"] = routing_http_response_access_control_allow_credentials_header_value
        if routing_http_response_access_control_allow_headers_header_value is not None:
            self._values["routing_http_response_access_control_allow_headers_header_value"] = routing_http_response_access_control_allow_headers_header_value
        if routing_http_response_access_control_allow_methods_header_value is not None:
            self._values["routing_http_response_access_control_allow_methods_header_value"] = routing_http_response_access_control_allow_methods_header_value
        if routing_http_response_access_control_allow_origin_header_value is not None:
            self._values["routing_http_response_access_control_allow_origin_header_value"] = routing_http_response_access_control_allow_origin_header_value
        if routing_http_response_access_control_expose_headers_header_value is not None:
            self._values["routing_http_response_access_control_expose_headers_header_value"] = routing_http_response_access_control_expose_headers_header_value
        if routing_http_response_access_control_max_age_header_value is not None:
            self._values["routing_http_response_access_control_max_age_header_value"] = routing_http_response_access_control_max_age_header_value
        if routing_http_response_content_security_policy_header_value is not None:
            self._values["routing_http_response_content_security_policy_header_value"] = routing_http_response_content_security_policy_header_value
        if routing_http_response_server_enabled is not None:
            self._values["routing_http_response_server_enabled"] = routing_http_response_server_enabled
        if routing_http_response_strict_transport_security_header_value is not None:
            self._values["routing_http_response_strict_transport_security_header_value"] = routing_http_response_strict_transport_security_header_value
        if routing_http_response_x_content_type_options_header_value is not None:
            self._values["routing_http_response_x_content_type_options_header_value"] = routing_http_response_x_content_type_options_header_value
        if routing_http_response_x_frame_options_header_value is not None:
            self._values["routing_http_response_x_frame_options_header_value"] = routing_http_response_x_frame_options_header_value
        if ssl_policy is not None:
            self._values["ssl_policy"] = ssl_policy
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if tcp_idle_timeout_seconds is not None:
            self._values["tcp_idle_timeout_seconds"] = tcp_idle_timeout_seconds
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
    def default_action(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LbListenerDefaultAction"]]:
        '''default_action block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#default_action LbListener#default_action}
        '''
        result = self._values.get("default_action")
        assert result is not None, "Required property 'default_action' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LbListenerDefaultAction"]], result)

    @builtins.property
    def load_balancer_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#load_balancer_arn LbListener#load_balancer_arn}.'''
        result = self._values.get("load_balancer_arn")
        assert result is not None, "Required property 'load_balancer_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def alpn_policy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#alpn_policy LbListener#alpn_policy}.'''
        result = self._values.get("alpn_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def certificate_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#certificate_arn LbListener#certificate_arn}.'''
        result = self._values.get("certificate_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#id LbListener#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def mutual_authentication(
        self,
    ) -> typing.Optional["LbListenerMutualAuthentication"]:
        '''mutual_authentication block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#mutual_authentication LbListener#mutual_authentication}
        '''
        result = self._values.get("mutual_authentication")
        return typing.cast(typing.Optional["LbListenerMutualAuthentication"], result)

    @builtins.property
    def port(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#port LbListener#port}.'''
        result = self._values.get("port")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def protocol(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#protocol LbListener#protocol}.'''
        result = self._values.get("protocol")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_request_x_amzn_mtls_clientcert_header_name(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_header_name}.'''
        result = self._values.get("routing_http_request_x_amzn_mtls_clientcert_header_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_request_x_amzn_mtls_clientcert_issuer_header_name(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_issuer_header_name}.'''
        result = self._values.get("routing_http_request_x_amzn_mtls_clientcert_issuer_header_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_request_x_amzn_mtls_clientcert_leaf_header_name(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_leaf_header_name}.'''
        result = self._values.get("routing_http_request_x_amzn_mtls_clientcert_leaf_header_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name}.'''
        result = self._values.get("routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_request_x_amzn_mtls_clientcert_subject_header_name(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_subject_header_name}.'''
        result = self._values.get("routing_http_request_x_amzn_mtls_clientcert_subject_header_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_request_x_amzn_mtls_clientcert_validity_header_name(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name LbListener#routing_http_request_x_amzn_mtls_clientcert_validity_header_name}.'''
        result = self._values.get("routing_http_request_x_amzn_mtls_clientcert_validity_header_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_request_x_amzn_tls_cipher_suite_header_name(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_cipher_suite_header_name LbListener#routing_http_request_x_amzn_tls_cipher_suite_header_name}.'''
        result = self._values.get("routing_http_request_x_amzn_tls_cipher_suite_header_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_request_x_amzn_tls_version_header_name(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_request_x_amzn_tls_version_header_name LbListener#routing_http_request_x_amzn_tls_version_header_name}.'''
        result = self._values.get("routing_http_request_x_amzn_tls_version_header_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_response_access_control_allow_credentials_header_value(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_credentials_header_value LbListener#routing_http_response_access_control_allow_credentials_header_value}.'''
        result = self._values.get("routing_http_response_access_control_allow_credentials_header_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_response_access_control_allow_headers_header_value(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_headers_header_value LbListener#routing_http_response_access_control_allow_headers_header_value}.'''
        result = self._values.get("routing_http_response_access_control_allow_headers_header_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_response_access_control_allow_methods_header_value(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_methods_header_value LbListener#routing_http_response_access_control_allow_methods_header_value}.'''
        result = self._values.get("routing_http_response_access_control_allow_methods_header_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_response_access_control_allow_origin_header_value(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_allow_origin_header_value LbListener#routing_http_response_access_control_allow_origin_header_value}.'''
        result = self._values.get("routing_http_response_access_control_allow_origin_header_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_response_access_control_expose_headers_header_value(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_expose_headers_header_value LbListener#routing_http_response_access_control_expose_headers_header_value}.'''
        result = self._values.get("routing_http_response_access_control_expose_headers_header_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_response_access_control_max_age_header_value(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_access_control_max_age_header_value LbListener#routing_http_response_access_control_max_age_header_value}.'''
        result = self._values.get("routing_http_response_access_control_max_age_header_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_response_content_security_policy_header_value(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_content_security_policy_header_value LbListener#routing_http_response_content_security_policy_header_value}.'''
        result = self._values.get("routing_http_response_content_security_policy_header_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_response_server_enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_server_enabled LbListener#routing_http_response_server_enabled}.'''
        result = self._values.get("routing_http_response_server_enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def routing_http_response_strict_transport_security_header_value(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_strict_transport_security_header_value LbListener#routing_http_response_strict_transport_security_header_value}.'''
        result = self._values.get("routing_http_response_strict_transport_security_header_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_response_x_content_type_options_header_value(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_content_type_options_header_value LbListener#routing_http_response_x_content_type_options_header_value}.'''
        result = self._values.get("routing_http_response_x_content_type_options_header_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def routing_http_response_x_frame_options_header_value(
        self,
    ) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#routing_http_response_x_frame_options_header_value LbListener#routing_http_response_x_frame_options_header_value}.'''
        result = self._values.get("routing_http_response_x_frame_options_header_value")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ssl_policy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#ssl_policy LbListener#ssl_policy}.'''
        result = self._values.get("ssl_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags LbListener#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tags_all LbListener#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tcp_idle_timeout_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#tcp_idle_timeout_seconds LbListener#tcp_idle_timeout_seconds}.'''
        result = self._values.get("tcp_idle_timeout_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["LbListenerTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#timeouts LbListener#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["LbListenerTimeouts"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbListenerConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.lbListener.LbListenerDefaultAction",
    jsii_struct_bases=[],
    name_mapping={
        "type": "type",
        "authenticate_cognito": "authenticateCognito",
        "authenticate_oidc": "authenticateOidc",
        "fixed_response": "fixedResponse",
        "forward": "forward",
        "order": "order",
        "redirect": "redirect",
        "target_group_arn": "targetGroupArn",
    },
)
class LbListenerDefaultAction:
    def __init__(
        self,
        *,
        type: builtins.str,
        authenticate_cognito: typing.Optional[typing.Union["LbListenerDefaultActionAuthenticateCognito", typing.Dict[builtins.str, typing.Any]]] = None,
        authenticate_oidc: typing.Optional[typing.Union["LbListenerDefaultActionAuthenticateOidc", typing.Dict[builtins.str, typing.Any]]] = None,
        fixed_response: typing.Optional[typing.Union["LbListenerDefaultActionFixedResponse", typing.Dict[builtins.str, typing.Any]]] = None,
        forward: typing.Optional[typing.Union["LbListenerDefaultActionForward", typing.Dict[builtins.str, typing.Any]]] = None,
        order: typing.Optional[jsii.Number] = None,
        redirect: typing.Optional[typing.Union["LbListenerDefaultActionRedirect", typing.Dict[builtins.str, typing.Any]]] = None,
        target_group_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#type LbListener#type}.
        :param authenticate_cognito: authenticate_cognito block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authenticate_cognito LbListener#authenticate_cognito}
        :param authenticate_oidc: authenticate_oidc block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authenticate_oidc LbListener#authenticate_oidc}
        :param fixed_response: fixed_response block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#fixed_response LbListener#fixed_response}
        :param forward: forward block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#forward LbListener#forward}
        :param order: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#order LbListener#order}.
        :param redirect: redirect block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#redirect LbListener#redirect}
        :param target_group_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#target_group_arn LbListener#target_group_arn}.
        '''
        if isinstance(authenticate_cognito, dict):
            authenticate_cognito = LbListenerDefaultActionAuthenticateCognito(**authenticate_cognito)
        if isinstance(authenticate_oidc, dict):
            authenticate_oidc = LbListenerDefaultActionAuthenticateOidc(**authenticate_oidc)
        if isinstance(fixed_response, dict):
            fixed_response = LbListenerDefaultActionFixedResponse(**fixed_response)
        if isinstance(forward, dict):
            forward = LbListenerDefaultActionForward(**forward)
        if isinstance(redirect, dict):
            redirect = LbListenerDefaultActionRedirect(**redirect)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__eb50835fa3167ef30af6453751d8b76aa10bed4c9dabbada3d2f2e45e62cc5a9)
            check_type(argname="argument type", value=type, expected_type=type_hints["type"])
            check_type(argname="argument authenticate_cognito", value=authenticate_cognito, expected_type=type_hints["authenticate_cognito"])
            check_type(argname="argument authenticate_oidc", value=authenticate_oidc, expected_type=type_hints["authenticate_oidc"])
            check_type(argname="argument fixed_response", value=fixed_response, expected_type=type_hints["fixed_response"])
            check_type(argname="argument forward", value=forward, expected_type=type_hints["forward"])
            check_type(argname="argument order", value=order, expected_type=type_hints["order"])
            check_type(argname="argument redirect", value=redirect, expected_type=type_hints["redirect"])
            check_type(argname="argument target_group_arn", value=target_group_arn, expected_type=type_hints["target_group_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "type": type,
        }
        if authenticate_cognito is not None:
            self._values["authenticate_cognito"] = authenticate_cognito
        if authenticate_oidc is not None:
            self._values["authenticate_oidc"] = authenticate_oidc
        if fixed_response is not None:
            self._values["fixed_response"] = fixed_response
        if forward is not None:
            self._values["forward"] = forward
        if order is not None:
            self._values["order"] = order
        if redirect is not None:
            self._values["redirect"] = redirect
        if target_group_arn is not None:
            self._values["target_group_arn"] = target_group_arn

    @builtins.property
    def type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#type LbListener#type}.'''
        result = self._values.get("type")
        assert result is not None, "Required property 'type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def authenticate_cognito(
        self,
    ) -> typing.Optional["LbListenerDefaultActionAuthenticateCognito"]:
        '''authenticate_cognito block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authenticate_cognito LbListener#authenticate_cognito}
        '''
        result = self._values.get("authenticate_cognito")
        return typing.cast(typing.Optional["LbListenerDefaultActionAuthenticateCognito"], result)

    @builtins.property
    def authenticate_oidc(
        self,
    ) -> typing.Optional["LbListenerDefaultActionAuthenticateOidc"]:
        '''authenticate_oidc block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authenticate_oidc LbListener#authenticate_oidc}
        '''
        result = self._values.get("authenticate_oidc")
        return typing.cast(typing.Optional["LbListenerDefaultActionAuthenticateOidc"], result)

    @builtins.property
    def fixed_response(self) -> typing.Optional["LbListenerDefaultActionFixedResponse"]:
        '''fixed_response block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#fixed_response LbListener#fixed_response}
        '''
        result = self._values.get("fixed_response")
        return typing.cast(typing.Optional["LbListenerDefaultActionFixedResponse"], result)

    @builtins.property
    def forward(self) -> typing.Optional["LbListenerDefaultActionForward"]:
        '''forward block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#forward LbListener#forward}
        '''
        result = self._values.get("forward")
        return typing.cast(typing.Optional["LbListenerDefaultActionForward"], result)

    @builtins.property
    def order(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#order LbListener#order}.'''
        result = self._values.get("order")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def redirect(self) -> typing.Optional["LbListenerDefaultActionRedirect"]:
        '''redirect block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#redirect LbListener#redirect}
        '''
        result = self._values.get("redirect")
        return typing.cast(typing.Optional["LbListenerDefaultActionRedirect"], result)

    @builtins.property
    def target_group_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#target_group_arn LbListener#target_group_arn}.'''
        result = self._values.get("target_group_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbListenerDefaultAction(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.lbListener.LbListenerDefaultActionAuthenticateCognito",
    jsii_struct_bases=[],
    name_mapping={
        "user_pool_arn": "userPoolArn",
        "user_pool_client_id": "userPoolClientId",
        "user_pool_domain": "userPoolDomain",
        "authentication_request_extra_params": "authenticationRequestExtraParams",
        "on_unauthenticated_request": "onUnauthenticatedRequest",
        "scope": "scope",
        "session_cookie_name": "sessionCookieName",
        "session_timeout": "sessionTimeout",
    },
)
class LbListenerDefaultActionAuthenticateCognito:
    def __init__(
        self,
        *,
        user_pool_arn: builtins.str,
        user_pool_client_id: builtins.str,
        user_pool_domain: builtins.str,
        authentication_request_extra_params: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        on_unauthenticated_request: typing.Optional[builtins.str] = None,
        scope: typing.Optional[builtins.str] = None,
        session_cookie_name: typing.Optional[builtins.str] = None,
        session_timeout: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param user_pool_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#user_pool_arn LbListener#user_pool_arn}.
        :param user_pool_client_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#user_pool_client_id LbListener#user_pool_client_id}.
        :param user_pool_domain: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#user_pool_domain LbListener#user_pool_domain}.
        :param authentication_request_extra_params: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authentication_request_extra_params LbListener#authentication_request_extra_params}.
        :param on_unauthenticated_request: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#on_unauthenticated_request LbListener#on_unauthenticated_request}.
        :param scope: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#scope LbListener#scope}.
        :param session_cookie_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#session_cookie_name LbListener#session_cookie_name}.
        :param session_timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#session_timeout LbListener#session_timeout}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__04bffc3502aa2f61b7fd721007826fe2dfa52e51f58801fe3af20e67508b238c)
            check_type(argname="argument user_pool_arn", value=user_pool_arn, expected_type=type_hints["user_pool_arn"])
            check_type(argname="argument user_pool_client_id", value=user_pool_client_id, expected_type=type_hints["user_pool_client_id"])
            check_type(argname="argument user_pool_domain", value=user_pool_domain, expected_type=type_hints["user_pool_domain"])
            check_type(argname="argument authentication_request_extra_params", value=authentication_request_extra_params, expected_type=type_hints["authentication_request_extra_params"])
            check_type(argname="argument on_unauthenticated_request", value=on_unauthenticated_request, expected_type=type_hints["on_unauthenticated_request"])
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument session_cookie_name", value=session_cookie_name, expected_type=type_hints["session_cookie_name"])
            check_type(argname="argument session_timeout", value=session_timeout, expected_type=type_hints["session_timeout"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "user_pool_arn": user_pool_arn,
            "user_pool_client_id": user_pool_client_id,
            "user_pool_domain": user_pool_domain,
        }
        if authentication_request_extra_params is not None:
            self._values["authentication_request_extra_params"] = authentication_request_extra_params
        if on_unauthenticated_request is not None:
            self._values["on_unauthenticated_request"] = on_unauthenticated_request
        if scope is not None:
            self._values["scope"] = scope
        if session_cookie_name is not None:
            self._values["session_cookie_name"] = session_cookie_name
        if session_timeout is not None:
            self._values["session_timeout"] = session_timeout

    @builtins.property
    def user_pool_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#user_pool_arn LbListener#user_pool_arn}.'''
        result = self._values.get("user_pool_arn")
        assert result is not None, "Required property 'user_pool_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def user_pool_client_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#user_pool_client_id LbListener#user_pool_client_id}.'''
        result = self._values.get("user_pool_client_id")
        assert result is not None, "Required property 'user_pool_client_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def user_pool_domain(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#user_pool_domain LbListener#user_pool_domain}.'''
        result = self._values.get("user_pool_domain")
        assert result is not None, "Required property 'user_pool_domain' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def authentication_request_extra_params(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authentication_request_extra_params LbListener#authentication_request_extra_params}.'''
        result = self._values.get("authentication_request_extra_params")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def on_unauthenticated_request(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#on_unauthenticated_request LbListener#on_unauthenticated_request}.'''
        result = self._values.get("on_unauthenticated_request")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def scope(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#scope LbListener#scope}.'''
        result = self._values.get("scope")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def session_cookie_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#session_cookie_name LbListener#session_cookie_name}.'''
        result = self._values.get("session_cookie_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def session_timeout(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#session_timeout LbListener#session_timeout}.'''
        result = self._values.get("session_timeout")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbListenerDefaultActionAuthenticateCognito(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbListenerDefaultActionAuthenticateCognitoOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListenerDefaultActionAuthenticateCognitoOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4110251f4a40efa37258e6ebe3049bd7aee54c5d39c5286feb3795c70e5682e5)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAuthenticationRequestExtraParams")
    def reset_authentication_request_extra_params(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAuthenticationRequestExtraParams", []))

    @jsii.member(jsii_name="resetOnUnauthenticatedRequest")
    def reset_on_unauthenticated_request(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnUnauthenticatedRequest", []))

    @jsii.member(jsii_name="resetScope")
    def reset_scope(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetScope", []))

    @jsii.member(jsii_name="resetSessionCookieName")
    def reset_session_cookie_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSessionCookieName", []))

    @jsii.member(jsii_name="resetSessionTimeout")
    def reset_session_timeout(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSessionTimeout", []))

    @builtins.property
    @jsii.member(jsii_name="authenticationRequestExtraParamsInput")
    def authentication_request_extra_params_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "authenticationRequestExtraParamsInput"))

    @builtins.property
    @jsii.member(jsii_name="onUnauthenticatedRequestInput")
    def on_unauthenticated_request_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "onUnauthenticatedRequestInput"))

    @builtins.property
    @jsii.member(jsii_name="scopeInput")
    def scope_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "scopeInput"))

    @builtins.property
    @jsii.member(jsii_name="sessionCookieNameInput")
    def session_cookie_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sessionCookieNameInput"))

    @builtins.property
    @jsii.member(jsii_name="sessionTimeoutInput")
    def session_timeout_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "sessionTimeoutInput"))

    @builtins.property
    @jsii.member(jsii_name="userPoolArnInput")
    def user_pool_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "userPoolArnInput"))

    @builtins.property
    @jsii.member(jsii_name="userPoolClientIdInput")
    def user_pool_client_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "userPoolClientIdInput"))

    @builtins.property
    @jsii.member(jsii_name="userPoolDomainInput")
    def user_pool_domain_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "userPoolDomainInput"))

    @builtins.property
    @jsii.member(jsii_name="authenticationRequestExtraParams")
    def authentication_request_extra_params(
        self,
    ) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "authenticationRequestExtraParams"))

    @authentication_request_extra_params.setter
    def authentication_request_extra_params(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3584d5a1cebb8c22fdd40ee7fc59c97119cf429ba97def9fc9e12cbe6738d331)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "authenticationRequestExtraParams", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onUnauthenticatedRequest")
    def on_unauthenticated_request(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "onUnauthenticatedRequest"))

    @on_unauthenticated_request.setter
    def on_unauthenticated_request(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__642c4cd5aef516903d5c1ba4c84c52bbd4aa7ef5478af88d36fa33dca68ae67c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onUnauthenticatedRequest", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="scope")
    def scope(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "scope"))

    @scope.setter
    def scope(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db53da48a5d384b537d60fa5e9efff258e06edf11edb9ff5b1258994a0d7a443)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "scope", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sessionCookieName")
    def session_cookie_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sessionCookieName"))

    @session_cookie_name.setter
    def session_cookie_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__14d6e1a56725f40996fff1bf17ba73fe5d0c51e82791236c1dc191bbc0952d54)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sessionCookieName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sessionTimeout")
    def session_timeout(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "sessionTimeout"))

    @session_timeout.setter
    def session_timeout(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75d33a5c62d65ddebc1fc1baa0060636b67f0d89fe49f67a0fe12c70039d7b92)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sessionTimeout", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userPoolArn")
    def user_pool_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "userPoolArn"))

    @user_pool_arn.setter
    def user_pool_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2d8f4cba1eab647d96e8ab736a7697248838c630cb24e20d163ed8a04beb1f39)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userPoolArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userPoolClientId")
    def user_pool_client_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "userPoolClientId"))

    @user_pool_client_id.setter
    def user_pool_client_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3a45f5b5792cec6a6237b1d313f36a5fbf8541deb544e473a65100e64f420c5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userPoolClientId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userPoolDomain")
    def user_pool_domain(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "userPoolDomain"))

    @user_pool_domain.setter
    def user_pool_domain(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__31aacf4ab3e91481e738fe592a830a9bed990d6f4f227450e260b1d876c25089)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userPoolDomain", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[LbListenerDefaultActionAuthenticateCognito]:
        return typing.cast(typing.Optional[LbListenerDefaultActionAuthenticateCognito], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LbListenerDefaultActionAuthenticateCognito],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__64ee19c98c2a2b6b0e5af6c0b572f5f29bb920a93cf3ebfc3c7a4d1fbcf7e65d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lbListener.LbListenerDefaultActionAuthenticateOidc",
    jsii_struct_bases=[],
    name_mapping={
        "authorization_endpoint": "authorizationEndpoint",
        "client_id": "clientId",
        "client_secret": "clientSecret",
        "issuer": "issuer",
        "token_endpoint": "tokenEndpoint",
        "user_info_endpoint": "userInfoEndpoint",
        "authentication_request_extra_params": "authenticationRequestExtraParams",
        "on_unauthenticated_request": "onUnauthenticatedRequest",
        "scope": "scope",
        "session_cookie_name": "sessionCookieName",
        "session_timeout": "sessionTimeout",
    },
)
class LbListenerDefaultActionAuthenticateOidc:
    def __init__(
        self,
        *,
        authorization_endpoint: builtins.str,
        client_id: builtins.str,
        client_secret: builtins.str,
        issuer: builtins.str,
        token_endpoint: builtins.str,
        user_info_endpoint: builtins.str,
        authentication_request_extra_params: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        on_unauthenticated_request: typing.Optional[builtins.str] = None,
        scope: typing.Optional[builtins.str] = None,
        session_cookie_name: typing.Optional[builtins.str] = None,
        session_timeout: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param authorization_endpoint: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authorization_endpoint LbListener#authorization_endpoint}.
        :param client_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#client_id LbListener#client_id}.
        :param client_secret: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#client_secret LbListener#client_secret}.
        :param issuer: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#issuer LbListener#issuer}.
        :param token_endpoint: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#token_endpoint LbListener#token_endpoint}.
        :param user_info_endpoint: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#user_info_endpoint LbListener#user_info_endpoint}.
        :param authentication_request_extra_params: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authentication_request_extra_params LbListener#authentication_request_extra_params}.
        :param on_unauthenticated_request: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#on_unauthenticated_request LbListener#on_unauthenticated_request}.
        :param scope: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#scope LbListener#scope}.
        :param session_cookie_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#session_cookie_name LbListener#session_cookie_name}.
        :param session_timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#session_timeout LbListener#session_timeout}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1aa583f387df776d2e39a1ddf90bd41e3dae810f68907230794ff10a5ecbe265)
            check_type(argname="argument authorization_endpoint", value=authorization_endpoint, expected_type=type_hints["authorization_endpoint"])
            check_type(argname="argument client_id", value=client_id, expected_type=type_hints["client_id"])
            check_type(argname="argument client_secret", value=client_secret, expected_type=type_hints["client_secret"])
            check_type(argname="argument issuer", value=issuer, expected_type=type_hints["issuer"])
            check_type(argname="argument token_endpoint", value=token_endpoint, expected_type=type_hints["token_endpoint"])
            check_type(argname="argument user_info_endpoint", value=user_info_endpoint, expected_type=type_hints["user_info_endpoint"])
            check_type(argname="argument authentication_request_extra_params", value=authentication_request_extra_params, expected_type=type_hints["authentication_request_extra_params"])
            check_type(argname="argument on_unauthenticated_request", value=on_unauthenticated_request, expected_type=type_hints["on_unauthenticated_request"])
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument session_cookie_name", value=session_cookie_name, expected_type=type_hints["session_cookie_name"])
            check_type(argname="argument session_timeout", value=session_timeout, expected_type=type_hints["session_timeout"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "authorization_endpoint": authorization_endpoint,
            "client_id": client_id,
            "client_secret": client_secret,
            "issuer": issuer,
            "token_endpoint": token_endpoint,
            "user_info_endpoint": user_info_endpoint,
        }
        if authentication_request_extra_params is not None:
            self._values["authentication_request_extra_params"] = authentication_request_extra_params
        if on_unauthenticated_request is not None:
            self._values["on_unauthenticated_request"] = on_unauthenticated_request
        if scope is not None:
            self._values["scope"] = scope
        if session_cookie_name is not None:
            self._values["session_cookie_name"] = session_cookie_name
        if session_timeout is not None:
            self._values["session_timeout"] = session_timeout

    @builtins.property
    def authorization_endpoint(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authorization_endpoint LbListener#authorization_endpoint}.'''
        result = self._values.get("authorization_endpoint")
        assert result is not None, "Required property 'authorization_endpoint' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def client_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#client_id LbListener#client_id}.'''
        result = self._values.get("client_id")
        assert result is not None, "Required property 'client_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def client_secret(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#client_secret LbListener#client_secret}.'''
        result = self._values.get("client_secret")
        assert result is not None, "Required property 'client_secret' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def issuer(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#issuer LbListener#issuer}.'''
        result = self._values.get("issuer")
        assert result is not None, "Required property 'issuer' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def token_endpoint(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#token_endpoint LbListener#token_endpoint}.'''
        result = self._values.get("token_endpoint")
        assert result is not None, "Required property 'token_endpoint' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def user_info_endpoint(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#user_info_endpoint LbListener#user_info_endpoint}.'''
        result = self._values.get("user_info_endpoint")
        assert result is not None, "Required property 'user_info_endpoint' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def authentication_request_extra_params(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authentication_request_extra_params LbListener#authentication_request_extra_params}.'''
        result = self._values.get("authentication_request_extra_params")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def on_unauthenticated_request(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#on_unauthenticated_request LbListener#on_unauthenticated_request}.'''
        result = self._values.get("on_unauthenticated_request")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def scope(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#scope LbListener#scope}.'''
        result = self._values.get("scope")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def session_cookie_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#session_cookie_name LbListener#session_cookie_name}.'''
        result = self._values.get("session_cookie_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def session_timeout(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#session_timeout LbListener#session_timeout}.'''
        result = self._values.get("session_timeout")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbListenerDefaultActionAuthenticateOidc(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbListenerDefaultActionAuthenticateOidcOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListenerDefaultActionAuthenticateOidcOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d5ca85f7755ad823a1b898756e72e83776e0193e25ccb56f8dd1e0ee64e9c91e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAuthenticationRequestExtraParams")
    def reset_authentication_request_extra_params(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAuthenticationRequestExtraParams", []))

    @jsii.member(jsii_name="resetOnUnauthenticatedRequest")
    def reset_on_unauthenticated_request(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnUnauthenticatedRequest", []))

    @jsii.member(jsii_name="resetScope")
    def reset_scope(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetScope", []))

    @jsii.member(jsii_name="resetSessionCookieName")
    def reset_session_cookie_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSessionCookieName", []))

    @jsii.member(jsii_name="resetSessionTimeout")
    def reset_session_timeout(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSessionTimeout", []))

    @builtins.property
    @jsii.member(jsii_name="authenticationRequestExtraParamsInput")
    def authentication_request_extra_params_input(
        self,
    ) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], jsii.get(self, "authenticationRequestExtraParamsInput"))

    @builtins.property
    @jsii.member(jsii_name="authorizationEndpointInput")
    def authorization_endpoint_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "authorizationEndpointInput"))

    @builtins.property
    @jsii.member(jsii_name="clientIdInput")
    def client_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "clientIdInput"))

    @builtins.property
    @jsii.member(jsii_name="clientSecretInput")
    def client_secret_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "clientSecretInput"))

    @builtins.property
    @jsii.member(jsii_name="issuerInput")
    def issuer_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "issuerInput"))

    @builtins.property
    @jsii.member(jsii_name="onUnauthenticatedRequestInput")
    def on_unauthenticated_request_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "onUnauthenticatedRequestInput"))

    @builtins.property
    @jsii.member(jsii_name="scopeInput")
    def scope_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "scopeInput"))

    @builtins.property
    @jsii.member(jsii_name="sessionCookieNameInput")
    def session_cookie_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sessionCookieNameInput"))

    @builtins.property
    @jsii.member(jsii_name="sessionTimeoutInput")
    def session_timeout_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "sessionTimeoutInput"))

    @builtins.property
    @jsii.member(jsii_name="tokenEndpointInput")
    def token_endpoint_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "tokenEndpointInput"))

    @builtins.property
    @jsii.member(jsii_name="userInfoEndpointInput")
    def user_info_endpoint_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "userInfoEndpointInput"))

    @builtins.property
    @jsii.member(jsii_name="authenticationRequestExtraParams")
    def authentication_request_extra_params(
        self,
    ) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "authenticationRequestExtraParams"))

    @authentication_request_extra_params.setter
    def authentication_request_extra_params(
        self,
        value: typing.Mapping[builtins.str, builtins.str],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__798570c8b2d18b25bda6d06c6106fefed004a57bec3885de8b49062ae54c5a1a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "authenticationRequestExtraParams", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="authorizationEndpoint")
    def authorization_endpoint(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "authorizationEndpoint"))

    @authorization_endpoint.setter
    def authorization_endpoint(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b4923a8decb1e0850dbeb70e90695f962e163bed3dc7f360e828b35871dbdbd7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "authorizationEndpoint", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="clientId")
    def client_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "clientId"))

    @client_id.setter
    def client_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78f515741b07c776dcc942f37e97c18aedc7683c7cee5f7979b255309decfbae)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "clientId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="clientSecret")
    def client_secret(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "clientSecret"))

    @client_secret.setter
    def client_secret(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dd9244357f8ae2ef2d3b050b005540903b76822bf372f974c7a15cb517fda19a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "clientSecret", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="issuer")
    def issuer(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "issuer"))

    @issuer.setter
    def issuer(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea523bd534c70aced98bf1bf71d01a7d092e1cc921dab0083f8bc98d7edd8fb0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "issuer", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="onUnauthenticatedRequest")
    def on_unauthenticated_request(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "onUnauthenticatedRequest"))

    @on_unauthenticated_request.setter
    def on_unauthenticated_request(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f98881f10c0f86e5349a62c105ebc75fc9e06667b60d0a8a996a7c1d7e2e53dc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "onUnauthenticatedRequest", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="scope")
    def scope(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "scope"))

    @scope.setter
    def scope(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f85c311a31dc7ac0b6c00f062aebbe1ac097ad84791d95475b35177c02ed2ecb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "scope", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sessionCookieName")
    def session_cookie_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sessionCookieName"))

    @session_cookie_name.setter
    def session_cookie_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fec62e9d73b842c6f356951895b47e55c43371d991142459f92bdaae886e44cc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sessionCookieName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sessionTimeout")
    def session_timeout(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "sessionTimeout"))

    @session_timeout.setter
    def session_timeout(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b6d572696be35cff2412aba65f1212928980c4fdfd36d18ac6592ad92a2ce7dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sessionTimeout", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tokenEndpoint")
    def token_endpoint(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tokenEndpoint"))

    @token_endpoint.setter
    def token_endpoint(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__00e41183b438b300b685967de8c487f8be7d888ebd3a013c7b59fa687a35890f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tokenEndpoint", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userInfoEndpoint")
    def user_info_endpoint(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "userInfoEndpoint"))

    @user_info_endpoint.setter
    def user_info_endpoint(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1424226eeb23bd9ad6ab1571be21a3918b754295601246c1e83d8d32b5f2a460)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userInfoEndpoint", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[LbListenerDefaultActionAuthenticateOidc]:
        return typing.cast(typing.Optional[LbListenerDefaultActionAuthenticateOidc], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LbListenerDefaultActionAuthenticateOidc],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ede65cdbd2f74a949c9ef588b254b9862b08a987b0761ac9243dde9cdbee40b5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lbListener.LbListenerDefaultActionFixedResponse",
    jsii_struct_bases=[],
    name_mapping={
        "content_type": "contentType",
        "message_body": "messageBody",
        "status_code": "statusCode",
    },
)
class LbListenerDefaultActionFixedResponse:
    def __init__(
        self,
        *,
        content_type: builtins.str,
        message_body: typing.Optional[builtins.str] = None,
        status_code: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param content_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#content_type LbListener#content_type}.
        :param message_body: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#message_body LbListener#message_body}.
        :param status_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#status_code LbListener#status_code}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5fad33554f64308cd13812263a60f79274ff4d528098fb3e4ac9893647b5096a)
            check_type(argname="argument content_type", value=content_type, expected_type=type_hints["content_type"])
            check_type(argname="argument message_body", value=message_body, expected_type=type_hints["message_body"])
            check_type(argname="argument status_code", value=status_code, expected_type=type_hints["status_code"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "content_type": content_type,
        }
        if message_body is not None:
            self._values["message_body"] = message_body
        if status_code is not None:
            self._values["status_code"] = status_code

    @builtins.property
    def content_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#content_type LbListener#content_type}.'''
        result = self._values.get("content_type")
        assert result is not None, "Required property 'content_type' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def message_body(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#message_body LbListener#message_body}.'''
        result = self._values.get("message_body")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def status_code(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#status_code LbListener#status_code}.'''
        result = self._values.get("status_code")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbListenerDefaultActionFixedResponse(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbListenerDefaultActionFixedResponseOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListenerDefaultActionFixedResponseOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7436df75d5bf73ac4d297a70c12a439ea4e1a618b9543beeae4585b2e31e887d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMessageBody")
    def reset_message_body(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMessageBody", []))

    @jsii.member(jsii_name="resetStatusCode")
    def reset_status_code(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStatusCode", []))

    @builtins.property
    @jsii.member(jsii_name="contentTypeInput")
    def content_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "contentTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="messageBodyInput")
    def message_body_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "messageBodyInput"))

    @builtins.property
    @jsii.member(jsii_name="statusCodeInput")
    def status_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="contentType")
    def content_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "contentType"))

    @content_type.setter
    def content_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1374bd9ed521d79ba7325e559ce4ffb4f0b373fcd5b3702a10d2e0fa3f0472dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "contentType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="messageBody")
    def message_body(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "messageBody"))

    @message_body.setter
    def message_body(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__91609da610a37450cf1714e2594e3997ca485aefad132053328a258f7dc0e627)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "messageBody", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="statusCode")
    def status_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "statusCode"))

    @status_code.setter
    def status_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__60df080f5fd11b0ef3ab21a77671fd6d76934036897b3b5ac4af6468f4ec26b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "statusCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[LbListenerDefaultActionFixedResponse]:
        return typing.cast(typing.Optional[LbListenerDefaultActionFixedResponse], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LbListenerDefaultActionFixedResponse],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__02bcbbf541acbb24d2e0e3a5c27fd9d0e83cd77023bf9361a6892647e76a77ba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lbListener.LbListenerDefaultActionForward",
    jsii_struct_bases=[],
    name_mapping={"target_group": "targetGroup", "stickiness": "stickiness"},
)
class LbListenerDefaultActionForward:
    def __init__(
        self,
        *,
        target_group: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["LbListenerDefaultActionForwardTargetGroup", typing.Dict[builtins.str, typing.Any]]]],
        stickiness: typing.Optional[typing.Union["LbListenerDefaultActionForwardStickiness", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param target_group: target_group block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#target_group LbListener#target_group}
        :param stickiness: stickiness block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#stickiness LbListener#stickiness}
        '''
        if isinstance(stickiness, dict):
            stickiness = LbListenerDefaultActionForwardStickiness(**stickiness)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2b388be049cbfce4d5288f0c5939fcab2f7e2ae087aebcd84de2552476c113c7)
            check_type(argname="argument target_group", value=target_group, expected_type=type_hints["target_group"])
            check_type(argname="argument stickiness", value=stickiness, expected_type=type_hints["stickiness"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "target_group": target_group,
        }
        if stickiness is not None:
            self._values["stickiness"] = stickiness

    @builtins.property
    def target_group(
        self,
    ) -> typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LbListenerDefaultActionForwardTargetGroup"]]:
        '''target_group block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#target_group LbListener#target_group}
        '''
        result = self._values.get("target_group")
        assert result is not None, "Required property 'target_group' is missing"
        return typing.cast(typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LbListenerDefaultActionForwardTargetGroup"]], result)

    @builtins.property
    def stickiness(self) -> typing.Optional["LbListenerDefaultActionForwardStickiness"]:
        '''stickiness block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#stickiness LbListener#stickiness}
        '''
        result = self._values.get("stickiness")
        return typing.cast(typing.Optional["LbListenerDefaultActionForwardStickiness"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbListenerDefaultActionForward(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbListenerDefaultActionForwardOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListenerDefaultActionForwardOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a3ce9bab06a159991b42d0f012b81e2ed4884f89f04f7a8ec56ff1ffd9706988)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putStickiness")
    def put_stickiness(
        self,
        *,
        duration: jsii.Number,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param duration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#duration LbListener#duration}.
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#enabled LbListener#enabled}.
        '''
        value = LbListenerDefaultActionForwardStickiness(
            duration=duration, enabled=enabled
        )

        return typing.cast(None, jsii.invoke(self, "putStickiness", [value]))

    @jsii.member(jsii_name="putTargetGroup")
    def put_target_group(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["LbListenerDefaultActionForwardTargetGroup", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f825b7bff39e6f8b4cca0ef6f7d2d0a5c8bc98fa690704bdfc62079bf62d441)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTargetGroup", [value]))

    @jsii.member(jsii_name="resetStickiness")
    def reset_stickiness(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStickiness", []))

    @builtins.property
    @jsii.member(jsii_name="stickiness")
    def stickiness(self) -> "LbListenerDefaultActionForwardStickinessOutputReference":
        return typing.cast("LbListenerDefaultActionForwardStickinessOutputReference", jsii.get(self, "stickiness"))

    @builtins.property
    @jsii.member(jsii_name="targetGroup")
    def target_group(self) -> "LbListenerDefaultActionForwardTargetGroupList":
        return typing.cast("LbListenerDefaultActionForwardTargetGroupList", jsii.get(self, "targetGroup"))

    @builtins.property
    @jsii.member(jsii_name="stickinessInput")
    def stickiness_input(
        self,
    ) -> typing.Optional["LbListenerDefaultActionForwardStickiness"]:
        return typing.cast(typing.Optional["LbListenerDefaultActionForwardStickiness"], jsii.get(self, "stickinessInput"))

    @builtins.property
    @jsii.member(jsii_name="targetGroupInput")
    def target_group_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LbListenerDefaultActionForwardTargetGroup"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["LbListenerDefaultActionForwardTargetGroup"]]], jsii.get(self, "targetGroupInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[LbListenerDefaultActionForward]:
        return typing.cast(typing.Optional[LbListenerDefaultActionForward], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LbListenerDefaultActionForward],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6194709a736e964e9f4665b77e9f16171351e3bbbdb41355cfe26d5dba4c3c5a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lbListener.LbListenerDefaultActionForwardStickiness",
    jsii_struct_bases=[],
    name_mapping={"duration": "duration", "enabled": "enabled"},
)
class LbListenerDefaultActionForwardStickiness:
    def __init__(
        self,
        *,
        duration: jsii.Number,
        enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param duration: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#duration LbListener#duration}.
        :param enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#enabled LbListener#enabled}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f039bae4df1868f4904ae47466bd9086fa46f372cb5fa6e4aaae5d7ec15a6d0e)
            check_type(argname="argument duration", value=duration, expected_type=type_hints["duration"])
            check_type(argname="argument enabled", value=enabled, expected_type=type_hints["enabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "duration": duration,
        }
        if enabled is not None:
            self._values["enabled"] = enabled

    @builtins.property
    def duration(self) -> jsii.Number:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#duration LbListener#duration}.'''
        result = self._values.get("duration")
        assert result is not None, "Required property 'duration' is missing"
        return typing.cast(jsii.Number, result)

    @builtins.property
    def enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#enabled LbListener#enabled}.'''
        result = self._values.get("enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbListenerDefaultActionForwardStickiness(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbListenerDefaultActionForwardStickinessOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListenerDefaultActionForwardStickinessOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ac6199120810921ce8170074ef3bfed704bf84b081044142530296f51eb76dc3)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetEnabled")
    def reset_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEnabled", []))

    @builtins.property
    @jsii.member(jsii_name="durationInput")
    def duration_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "durationInput"))

    @builtins.property
    @jsii.member(jsii_name="enabledInput")
    def enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "enabledInput"))

    @builtins.property
    @jsii.member(jsii_name="duration")
    def duration(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "duration"))

    @duration.setter
    def duration(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2f0344dd0c0f83ce21fb6a41aa7a58a85e76270d097e6fc5f4325e238d2846b3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "duration", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="enabled")
    def enabled(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "enabled"))

    @enabled.setter
    def enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__15d4d451ca5a9ea65f7fdfa22c5a7f88de91f59cbe62e0f7f71aac7e58c90497)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "enabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[LbListenerDefaultActionForwardStickiness]:
        return typing.cast(typing.Optional[LbListenerDefaultActionForwardStickiness], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LbListenerDefaultActionForwardStickiness],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__34b14601aaa8fe536bf860cd9f88d2bd783db22efda10c89ca4759d3136c83c9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lbListener.LbListenerDefaultActionForwardTargetGroup",
    jsii_struct_bases=[],
    name_mapping={"arn": "arn", "weight": "weight"},
)
class LbListenerDefaultActionForwardTargetGroup:
    def __init__(
        self,
        *,
        arn: builtins.str,
        weight: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#arn LbListener#arn}.
        :param weight: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#weight LbListener#weight}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7aef89bad49f4e4310072c0d05ebb2b0bb991bf75dffdd162c08f22e6811f306)
            check_type(argname="argument arn", value=arn, expected_type=type_hints["arn"])
            check_type(argname="argument weight", value=weight, expected_type=type_hints["weight"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "arn": arn,
        }
        if weight is not None:
            self._values["weight"] = weight

    @builtins.property
    def arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#arn LbListener#arn}.'''
        result = self._values.get("arn")
        assert result is not None, "Required property 'arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def weight(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#weight LbListener#weight}.'''
        result = self._values.get("weight")
        return typing.cast(typing.Optional[jsii.Number], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbListenerDefaultActionForwardTargetGroup(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbListenerDefaultActionForwardTargetGroupList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListenerDefaultActionForwardTargetGroupList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5a2b325dd6b0fc08136578c6de76d692f0229b5d94c7518a7d0e4e50f3561c1e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "LbListenerDefaultActionForwardTargetGroupOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3161634279f9c6b367ed646b1879c9dbfa38e444e5c716a3def903e5ef7fa3a2)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("LbListenerDefaultActionForwardTargetGroupOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__12a53ed01673b0e1ac95307949137ce2b55f56d1d00e923f13c7072236f3865a)
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
            type_hints = typing.get_type_hints(_typecheckingstub__1a84e089db61914f7fbd101137d9d73c8dacdf81d7bfbc3e083bf84eb81dc497)
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
            type_hints = typing.get_type_hints(_typecheckingstub__4664327416db081bdf902e96bbcab1677fff786d04b7898dd57da11c117e3767)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LbListenerDefaultActionForwardTargetGroup]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LbListenerDefaultActionForwardTargetGroup]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LbListenerDefaultActionForwardTargetGroup]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ffabcff36d5ff80a1cb730107edcc407fc614b9a5da5fc0012d0e247fb0f878e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class LbListenerDefaultActionForwardTargetGroupOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListenerDefaultActionForwardTargetGroupOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9f3980b920d7db5d06a7dcb975c349e0625a2e79e024fd16e99fb7ca31baf1ee)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetWeight")
    def reset_weight(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWeight", []))

    @builtins.property
    @jsii.member(jsii_name="arnInput")
    def arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "arnInput"))

    @builtins.property
    @jsii.member(jsii_name="weightInput")
    def weight_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "weightInput"))

    @builtins.property
    @jsii.member(jsii_name="arn")
    def arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "arn"))

    @arn.setter
    def arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a46e4791025ada57f4e79feeaaeda3abd531b4878326bb545a84de5d0eb3f883)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "arn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="weight")
    def weight(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "weight"))

    @weight.setter
    def weight(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__44020072f0276e6d74ccf80d98079f54cd7db744f7694721a64577ad847d7ec0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "weight", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbListenerDefaultActionForwardTargetGroup]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbListenerDefaultActionForwardTargetGroup]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbListenerDefaultActionForwardTargetGroup]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1c62272f61351dc77a976ef9cf33eab74634638f9223a9a8b33015fa5468170b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class LbListenerDefaultActionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListenerDefaultActionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__c7f58def599770e240bb5bcc61e5294d2978fa60f8ddfcbf46006fa396dd76b8)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(self, index: jsii.Number) -> "LbListenerDefaultActionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0753a342e47de92ca301cffcd5fadfc3d3a76c57d4e1e645e1c17c9296a53118)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("LbListenerDefaultActionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5e27b7c7391e78d325c03462180f829f8832beb3fc9dacd9abd6f6129cb391c3)
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
            type_hints = typing.get_type_hints(_typecheckingstub__de2cb12eaf50aa1f094093d218ece10cc38500976bf9a6f6f846da53125b7835)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2956af5505e3b5f32d355117e6b2dd0a447dec093a944045977eb1151b228b13)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LbListenerDefaultAction]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LbListenerDefaultAction]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LbListenerDefaultAction]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__299c3d140d8535b37b0c7085292f3db0ad757a0e39706f9647801662169697dd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class LbListenerDefaultActionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListenerDefaultActionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1f28dcd752cfa50dbe4d75af88a008ffd0e71b19c6e5e899283dd3002e4db81d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putAuthenticateCognito")
    def put_authenticate_cognito(
        self,
        *,
        user_pool_arn: builtins.str,
        user_pool_client_id: builtins.str,
        user_pool_domain: builtins.str,
        authentication_request_extra_params: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        on_unauthenticated_request: typing.Optional[builtins.str] = None,
        scope: typing.Optional[builtins.str] = None,
        session_cookie_name: typing.Optional[builtins.str] = None,
        session_timeout: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param user_pool_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#user_pool_arn LbListener#user_pool_arn}.
        :param user_pool_client_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#user_pool_client_id LbListener#user_pool_client_id}.
        :param user_pool_domain: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#user_pool_domain LbListener#user_pool_domain}.
        :param authentication_request_extra_params: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authentication_request_extra_params LbListener#authentication_request_extra_params}.
        :param on_unauthenticated_request: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#on_unauthenticated_request LbListener#on_unauthenticated_request}.
        :param scope: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#scope LbListener#scope}.
        :param session_cookie_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#session_cookie_name LbListener#session_cookie_name}.
        :param session_timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#session_timeout LbListener#session_timeout}.
        '''
        value = LbListenerDefaultActionAuthenticateCognito(
            user_pool_arn=user_pool_arn,
            user_pool_client_id=user_pool_client_id,
            user_pool_domain=user_pool_domain,
            authentication_request_extra_params=authentication_request_extra_params,
            on_unauthenticated_request=on_unauthenticated_request,
            scope=scope,
            session_cookie_name=session_cookie_name,
            session_timeout=session_timeout,
        )

        return typing.cast(None, jsii.invoke(self, "putAuthenticateCognito", [value]))

    @jsii.member(jsii_name="putAuthenticateOidc")
    def put_authenticate_oidc(
        self,
        *,
        authorization_endpoint: builtins.str,
        client_id: builtins.str,
        client_secret: builtins.str,
        issuer: builtins.str,
        token_endpoint: builtins.str,
        user_info_endpoint: builtins.str,
        authentication_request_extra_params: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        on_unauthenticated_request: typing.Optional[builtins.str] = None,
        scope: typing.Optional[builtins.str] = None,
        session_cookie_name: typing.Optional[builtins.str] = None,
        session_timeout: typing.Optional[jsii.Number] = None,
    ) -> None:
        '''
        :param authorization_endpoint: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authorization_endpoint LbListener#authorization_endpoint}.
        :param client_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#client_id LbListener#client_id}.
        :param client_secret: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#client_secret LbListener#client_secret}.
        :param issuer: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#issuer LbListener#issuer}.
        :param token_endpoint: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#token_endpoint LbListener#token_endpoint}.
        :param user_info_endpoint: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#user_info_endpoint LbListener#user_info_endpoint}.
        :param authentication_request_extra_params: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authentication_request_extra_params LbListener#authentication_request_extra_params}.
        :param on_unauthenticated_request: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#on_unauthenticated_request LbListener#on_unauthenticated_request}.
        :param scope: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#scope LbListener#scope}.
        :param session_cookie_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#session_cookie_name LbListener#session_cookie_name}.
        :param session_timeout: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#session_timeout LbListener#session_timeout}.
        '''
        value = LbListenerDefaultActionAuthenticateOidc(
            authorization_endpoint=authorization_endpoint,
            client_id=client_id,
            client_secret=client_secret,
            issuer=issuer,
            token_endpoint=token_endpoint,
            user_info_endpoint=user_info_endpoint,
            authentication_request_extra_params=authentication_request_extra_params,
            on_unauthenticated_request=on_unauthenticated_request,
            scope=scope,
            session_cookie_name=session_cookie_name,
            session_timeout=session_timeout,
        )

        return typing.cast(None, jsii.invoke(self, "putAuthenticateOidc", [value]))

    @jsii.member(jsii_name="putFixedResponse")
    def put_fixed_response(
        self,
        *,
        content_type: builtins.str,
        message_body: typing.Optional[builtins.str] = None,
        status_code: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param content_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#content_type LbListener#content_type}.
        :param message_body: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#message_body LbListener#message_body}.
        :param status_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#status_code LbListener#status_code}.
        '''
        value = LbListenerDefaultActionFixedResponse(
            content_type=content_type,
            message_body=message_body,
            status_code=status_code,
        )

        return typing.cast(None, jsii.invoke(self, "putFixedResponse", [value]))

    @jsii.member(jsii_name="putForward")
    def put_forward(
        self,
        *,
        target_group: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LbListenerDefaultActionForwardTargetGroup, typing.Dict[builtins.str, typing.Any]]]],
        stickiness: typing.Optional[typing.Union[LbListenerDefaultActionForwardStickiness, typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param target_group: target_group block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#target_group LbListener#target_group}
        :param stickiness: stickiness block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#stickiness LbListener#stickiness}
        '''
        value = LbListenerDefaultActionForward(
            target_group=target_group, stickiness=stickiness
        )

        return typing.cast(None, jsii.invoke(self, "putForward", [value]))

    @jsii.member(jsii_name="putRedirect")
    def put_redirect(
        self,
        *,
        status_code: builtins.str,
        host: typing.Optional[builtins.str] = None,
        path: typing.Optional[builtins.str] = None,
        port: typing.Optional[builtins.str] = None,
        protocol: typing.Optional[builtins.str] = None,
        query: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param status_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#status_code LbListener#status_code}.
        :param host: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#host LbListener#host}.
        :param path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#path LbListener#path}.
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#port LbListener#port}.
        :param protocol: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#protocol LbListener#protocol}.
        :param query: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#query LbListener#query}.
        '''
        value = LbListenerDefaultActionRedirect(
            status_code=status_code,
            host=host,
            path=path,
            port=port,
            protocol=protocol,
            query=query,
        )

        return typing.cast(None, jsii.invoke(self, "putRedirect", [value]))

    @jsii.member(jsii_name="resetAuthenticateCognito")
    def reset_authenticate_cognito(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAuthenticateCognito", []))

    @jsii.member(jsii_name="resetAuthenticateOidc")
    def reset_authenticate_oidc(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAuthenticateOidc", []))

    @jsii.member(jsii_name="resetFixedResponse")
    def reset_fixed_response(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFixedResponse", []))

    @jsii.member(jsii_name="resetForward")
    def reset_forward(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetForward", []))

    @jsii.member(jsii_name="resetOrder")
    def reset_order(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOrder", []))

    @jsii.member(jsii_name="resetRedirect")
    def reset_redirect(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetRedirect", []))

    @jsii.member(jsii_name="resetTargetGroupArn")
    def reset_target_group_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTargetGroupArn", []))

    @builtins.property
    @jsii.member(jsii_name="authenticateCognito")
    def authenticate_cognito(
        self,
    ) -> LbListenerDefaultActionAuthenticateCognitoOutputReference:
        return typing.cast(LbListenerDefaultActionAuthenticateCognitoOutputReference, jsii.get(self, "authenticateCognito"))

    @builtins.property
    @jsii.member(jsii_name="authenticateOidc")
    def authenticate_oidc(
        self,
    ) -> LbListenerDefaultActionAuthenticateOidcOutputReference:
        return typing.cast(LbListenerDefaultActionAuthenticateOidcOutputReference, jsii.get(self, "authenticateOidc"))

    @builtins.property
    @jsii.member(jsii_name="fixedResponse")
    def fixed_response(self) -> LbListenerDefaultActionFixedResponseOutputReference:
        return typing.cast(LbListenerDefaultActionFixedResponseOutputReference, jsii.get(self, "fixedResponse"))

    @builtins.property
    @jsii.member(jsii_name="forward")
    def forward(self) -> LbListenerDefaultActionForwardOutputReference:
        return typing.cast(LbListenerDefaultActionForwardOutputReference, jsii.get(self, "forward"))

    @builtins.property
    @jsii.member(jsii_name="redirect")
    def redirect(self) -> "LbListenerDefaultActionRedirectOutputReference":
        return typing.cast("LbListenerDefaultActionRedirectOutputReference", jsii.get(self, "redirect"))

    @builtins.property
    @jsii.member(jsii_name="authenticateCognitoInput")
    def authenticate_cognito_input(
        self,
    ) -> typing.Optional[LbListenerDefaultActionAuthenticateCognito]:
        return typing.cast(typing.Optional[LbListenerDefaultActionAuthenticateCognito], jsii.get(self, "authenticateCognitoInput"))

    @builtins.property
    @jsii.member(jsii_name="authenticateOidcInput")
    def authenticate_oidc_input(
        self,
    ) -> typing.Optional[LbListenerDefaultActionAuthenticateOidc]:
        return typing.cast(typing.Optional[LbListenerDefaultActionAuthenticateOidc], jsii.get(self, "authenticateOidcInput"))

    @builtins.property
    @jsii.member(jsii_name="fixedResponseInput")
    def fixed_response_input(
        self,
    ) -> typing.Optional[LbListenerDefaultActionFixedResponse]:
        return typing.cast(typing.Optional[LbListenerDefaultActionFixedResponse], jsii.get(self, "fixedResponseInput"))

    @builtins.property
    @jsii.member(jsii_name="forwardInput")
    def forward_input(self) -> typing.Optional[LbListenerDefaultActionForward]:
        return typing.cast(typing.Optional[LbListenerDefaultActionForward], jsii.get(self, "forwardInput"))

    @builtins.property
    @jsii.member(jsii_name="orderInput")
    def order_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "orderInput"))

    @builtins.property
    @jsii.member(jsii_name="redirectInput")
    def redirect_input(self) -> typing.Optional["LbListenerDefaultActionRedirect"]:
        return typing.cast(typing.Optional["LbListenerDefaultActionRedirect"], jsii.get(self, "redirectInput"))

    @builtins.property
    @jsii.member(jsii_name="targetGroupArnInput")
    def target_group_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "targetGroupArnInput"))

    @builtins.property
    @jsii.member(jsii_name="typeInput")
    def type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "typeInput"))

    @builtins.property
    @jsii.member(jsii_name="order")
    def order(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "order"))

    @order.setter
    def order(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3cd495ab11b5cc5803da36b07da1c7ced88a0d0a8c4dd67831e1eea002f3d66a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "order", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="targetGroupArn")
    def target_group_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "targetGroupArn"))

    @target_group_arn.setter
    def target_group_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7292b38f31076e80e11b78c8874a5abd6c68a366faf926b90575299194892780)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "targetGroupArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="type")
    def type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "type"))

    @type.setter
    def type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__43a4a7d10114a63823f46c9ee0c14d7fa146b81543fcd2f849583766895ae652)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "type", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbListenerDefaultAction]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbListenerDefaultAction]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbListenerDefaultAction]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__da45b64bca7915a6729dca354f1ef63068498db5f8c5bce25543b3630eab007e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lbListener.LbListenerDefaultActionRedirect",
    jsii_struct_bases=[],
    name_mapping={
        "status_code": "statusCode",
        "host": "host",
        "path": "path",
        "port": "port",
        "protocol": "protocol",
        "query": "query",
    },
)
class LbListenerDefaultActionRedirect:
    def __init__(
        self,
        *,
        status_code: builtins.str,
        host: typing.Optional[builtins.str] = None,
        path: typing.Optional[builtins.str] = None,
        port: typing.Optional[builtins.str] = None,
        protocol: typing.Optional[builtins.str] = None,
        query: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param status_code: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#status_code LbListener#status_code}.
        :param host: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#host LbListener#host}.
        :param path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#path LbListener#path}.
        :param port: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#port LbListener#port}.
        :param protocol: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#protocol LbListener#protocol}.
        :param query: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#query LbListener#query}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b6d6812b29fe37d1031547ab666ed72b33f75a0e3c2548aaae780f93a449144c)
            check_type(argname="argument status_code", value=status_code, expected_type=type_hints["status_code"])
            check_type(argname="argument host", value=host, expected_type=type_hints["host"])
            check_type(argname="argument path", value=path, expected_type=type_hints["path"])
            check_type(argname="argument port", value=port, expected_type=type_hints["port"])
            check_type(argname="argument protocol", value=protocol, expected_type=type_hints["protocol"])
            check_type(argname="argument query", value=query, expected_type=type_hints["query"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "status_code": status_code,
        }
        if host is not None:
            self._values["host"] = host
        if path is not None:
            self._values["path"] = path
        if port is not None:
            self._values["port"] = port
        if protocol is not None:
            self._values["protocol"] = protocol
        if query is not None:
            self._values["query"] = query

    @builtins.property
    def status_code(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#status_code LbListener#status_code}.'''
        result = self._values.get("status_code")
        assert result is not None, "Required property 'status_code' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def host(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#host LbListener#host}.'''
        result = self._values.get("host")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#path LbListener#path}.'''
        result = self._values.get("path")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def port(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#port LbListener#port}.'''
        result = self._values.get("port")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def protocol(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#protocol LbListener#protocol}.'''
        result = self._values.get("protocol")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def query(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#query LbListener#query}.'''
        result = self._values.get("query")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbListenerDefaultActionRedirect(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbListenerDefaultActionRedirectOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListenerDefaultActionRedirectOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__773a9a4c1418f5781ec63379c68bffb9869ba72dab3d0bf2b15ed198a3591d98)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetHost")
    def reset_host(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHost", []))

    @jsii.member(jsii_name="resetPath")
    def reset_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPath", []))

    @jsii.member(jsii_name="resetPort")
    def reset_port(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPort", []))

    @jsii.member(jsii_name="resetProtocol")
    def reset_protocol(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProtocol", []))

    @jsii.member(jsii_name="resetQuery")
    def reset_query(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetQuery", []))

    @builtins.property
    @jsii.member(jsii_name="hostInput")
    def host_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "hostInput"))

    @builtins.property
    @jsii.member(jsii_name="pathInput")
    def path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "pathInput"))

    @builtins.property
    @jsii.member(jsii_name="portInput")
    def port_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "portInput"))

    @builtins.property
    @jsii.member(jsii_name="protocolInput")
    def protocol_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "protocolInput"))

    @builtins.property
    @jsii.member(jsii_name="queryInput")
    def query_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "queryInput"))

    @builtins.property
    @jsii.member(jsii_name="statusCodeInput")
    def status_code_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "statusCodeInput"))

    @builtins.property
    @jsii.member(jsii_name="host")
    def host(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "host"))

    @host.setter
    def host(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__baaa1ade077eb7e2cebcaa997d175fb08b36aeea0ca6350865aa442576533334)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "host", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="path")
    def path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "path"))

    @path.setter
    def path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__47ffce38816b9a8d3492513b728c265f16e5ba3fd2ba226a9320aa5020d0f1a2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "path", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="port")
    def port(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "port"))

    @port.setter
    def port(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c8437e1c8b4945823884cc957048e50e95c8310638a7198c260ab119a294ed22)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "port", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="protocol")
    def protocol(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "protocol"))

    @protocol.setter
    def protocol(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3dc46feb26462f7443b51ce307635bfa88d3e0b6983017ae81950136444a8f9b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "protocol", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="query")
    def query(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "query"))

    @query.setter
    def query(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4b208bc1ab7faba11d8feef7ca84bf07268f2055deb508ed1801e1001cf453b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "query", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="statusCode")
    def status_code(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "statusCode"))

    @status_code.setter
    def status_code(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ab02cedb6e1423f1b8c53e4e3e07cb1cf849f57ca2afc4e83fee9f9f8afbc14)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "statusCode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[LbListenerDefaultActionRedirect]:
        return typing.cast(typing.Optional[LbListenerDefaultActionRedirect], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LbListenerDefaultActionRedirect],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__598e11f94d6331700be6206156eb33c1d157515351513093c65d68b6ed9178c8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lbListener.LbListenerMutualAuthentication",
    jsii_struct_bases=[],
    name_mapping={
        "mode": "mode",
        "advertise_trust_store_ca_names": "advertiseTrustStoreCaNames",
        "ignore_client_certificate_expiry": "ignoreClientCertificateExpiry",
        "trust_store_arn": "trustStoreArn",
    },
)
class LbListenerMutualAuthentication:
    def __init__(
        self,
        *,
        mode: builtins.str,
        advertise_trust_store_ca_names: typing.Optional[builtins.str] = None,
        ignore_client_certificate_expiry: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        trust_store_arn: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#mode LbListener#mode}.
        :param advertise_trust_store_ca_names: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#advertise_trust_store_ca_names LbListener#advertise_trust_store_ca_names}.
        :param ignore_client_certificate_expiry: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#ignore_client_certificate_expiry LbListener#ignore_client_certificate_expiry}.
        :param trust_store_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#trust_store_arn LbListener#trust_store_arn}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83dc7764235d0069cad88b5c6e09a20a4fc0ad84a36b23b80e86f01175f4892e)
            check_type(argname="argument mode", value=mode, expected_type=type_hints["mode"])
            check_type(argname="argument advertise_trust_store_ca_names", value=advertise_trust_store_ca_names, expected_type=type_hints["advertise_trust_store_ca_names"])
            check_type(argname="argument ignore_client_certificate_expiry", value=ignore_client_certificate_expiry, expected_type=type_hints["ignore_client_certificate_expiry"])
            check_type(argname="argument trust_store_arn", value=trust_store_arn, expected_type=type_hints["trust_store_arn"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "mode": mode,
        }
        if advertise_trust_store_ca_names is not None:
            self._values["advertise_trust_store_ca_names"] = advertise_trust_store_ca_names
        if ignore_client_certificate_expiry is not None:
            self._values["ignore_client_certificate_expiry"] = ignore_client_certificate_expiry
        if trust_store_arn is not None:
            self._values["trust_store_arn"] = trust_store_arn

    @builtins.property
    def mode(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#mode LbListener#mode}.'''
        result = self._values.get("mode")
        assert result is not None, "Required property 'mode' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def advertise_trust_store_ca_names(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#advertise_trust_store_ca_names LbListener#advertise_trust_store_ca_names}.'''
        result = self._values.get("advertise_trust_store_ca_names")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def ignore_client_certificate_expiry(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#ignore_client_certificate_expiry LbListener#ignore_client_certificate_expiry}.'''
        result = self._values.get("ignore_client_certificate_expiry")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def trust_store_arn(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#trust_store_arn LbListener#trust_store_arn}.'''
        result = self._values.get("trust_store_arn")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbListenerMutualAuthentication(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbListenerMutualAuthenticationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListenerMutualAuthenticationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__01387322bf90d533ff8b33b93c7213e44afdf79b6f54cfe1270aa5342a31cd70)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAdvertiseTrustStoreCaNames")
    def reset_advertise_trust_store_ca_names(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAdvertiseTrustStoreCaNames", []))

    @jsii.member(jsii_name="resetIgnoreClientCertificateExpiry")
    def reset_ignore_client_certificate_expiry(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIgnoreClientCertificateExpiry", []))

    @jsii.member(jsii_name="resetTrustStoreArn")
    def reset_trust_store_arn(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTrustStoreArn", []))

    @builtins.property
    @jsii.member(jsii_name="advertiseTrustStoreCaNamesInput")
    def advertise_trust_store_ca_names_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "advertiseTrustStoreCaNamesInput"))

    @builtins.property
    @jsii.member(jsii_name="ignoreClientCertificateExpiryInput")
    def ignore_client_certificate_expiry_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "ignoreClientCertificateExpiryInput"))

    @builtins.property
    @jsii.member(jsii_name="modeInput")
    def mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "modeInput"))

    @builtins.property
    @jsii.member(jsii_name="trustStoreArnInput")
    def trust_store_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "trustStoreArnInput"))

    @builtins.property
    @jsii.member(jsii_name="advertiseTrustStoreCaNames")
    def advertise_trust_store_ca_names(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "advertiseTrustStoreCaNames"))

    @advertise_trust_store_ca_names.setter
    def advertise_trust_store_ca_names(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__11680dbdb15d6b1ed6395958d1babb9b7cc26919c6ed8bb110e2577a380c2c09)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "advertiseTrustStoreCaNames", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="ignoreClientCertificateExpiry")
    def ignore_client_certificate_expiry(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "ignoreClientCertificateExpiry"))

    @ignore_client_certificate_expiry.setter
    def ignore_client_certificate_expiry(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a285dce3c410d96597a3254de119080742bfe571d12d93b3afbe288422e9464)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "ignoreClientCertificateExpiry", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="mode")
    def mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "mode"))

    @mode.setter
    def mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bbc3b9a15131fc5f692c65954a19cfa66eed634d3e0c7b5d7dfc620c2b76256c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "mode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="trustStoreArn")
    def trust_store_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "trustStoreArn"))

    @trust_store_arn.setter
    def trust_store_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__496f595076464dd80fc89060d2821d870b87632285f36737e8b64289575ee145)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "trustStoreArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[LbListenerMutualAuthentication]:
        return typing.cast(typing.Optional[LbListenerMutualAuthentication], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[LbListenerMutualAuthentication],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__54edb560e2e978790ccd7692d92828b67559dc9c43a79323f75384930a7fb7fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.lbListener.LbListenerTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "update": "update"},
)
class LbListenerTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#create LbListener#create}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#update LbListener#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b3d8cb6ce23dd41f051e484dcd4f1f9296c504275bf6e45333eaab8391602974)
            check_type(argname="argument create", value=create, expected_type=type_hints["create"])
            check_type(argname="argument update", value=update, expected_type=type_hints["update"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if create is not None:
            self._values["create"] = create
        if update is not None:
            self._values["update"] = update

    @builtins.property
    def create(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#create LbListener#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#update LbListener#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "LbListenerTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class LbListenerTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.lbListener.LbListenerTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e99aeac1579bdeccfe328f0fb1c822a6b1f32a1842508eeef3c1779fbf41ea71)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCreate")
    def reset_create(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCreate", []))

    @jsii.member(jsii_name="resetUpdate")
    def reset_update(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUpdate", []))

    @builtins.property
    @jsii.member(jsii_name="createInput")
    def create_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "createInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__e0d01d883888df03e0a4b7e8462d383fc2744099a149987e426170e79f5ef86c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a5e95391685fbba4c9b4c8a0e88ec37c99078e539072326d300f05ade948e27)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbListenerTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbListenerTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbListenerTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bfe24b47e78e603ec4c0d87a09b5a27414887d2aef5c93e6dc27155ef4c2931a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "LbListener",
    "LbListenerConfig",
    "LbListenerDefaultAction",
    "LbListenerDefaultActionAuthenticateCognito",
    "LbListenerDefaultActionAuthenticateCognitoOutputReference",
    "LbListenerDefaultActionAuthenticateOidc",
    "LbListenerDefaultActionAuthenticateOidcOutputReference",
    "LbListenerDefaultActionFixedResponse",
    "LbListenerDefaultActionFixedResponseOutputReference",
    "LbListenerDefaultActionForward",
    "LbListenerDefaultActionForwardOutputReference",
    "LbListenerDefaultActionForwardStickiness",
    "LbListenerDefaultActionForwardStickinessOutputReference",
    "LbListenerDefaultActionForwardTargetGroup",
    "LbListenerDefaultActionForwardTargetGroupList",
    "LbListenerDefaultActionForwardTargetGroupOutputReference",
    "LbListenerDefaultActionList",
    "LbListenerDefaultActionOutputReference",
    "LbListenerDefaultActionRedirect",
    "LbListenerDefaultActionRedirectOutputReference",
    "LbListenerMutualAuthentication",
    "LbListenerMutualAuthenticationOutputReference",
    "LbListenerTimeouts",
    "LbListenerTimeoutsOutputReference",
]

publication.publish()

def _typecheckingstub__11aa6e832a39dc0b2f4564b1efbe1a1c5c3bd2e9402f2d9a581a4afb7824ea60(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    default_action: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LbListenerDefaultAction, typing.Dict[builtins.str, typing.Any]]]],
    load_balancer_arn: builtins.str,
    alpn_policy: typing.Optional[builtins.str] = None,
    certificate_arn: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    mutual_authentication: typing.Optional[typing.Union[LbListenerMutualAuthentication, typing.Dict[builtins.str, typing.Any]]] = None,
    port: typing.Optional[jsii.Number] = None,
    protocol: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_mtls_clientcert_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_mtls_clientcert_issuer_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_mtls_clientcert_leaf_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_mtls_clientcert_subject_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_mtls_clientcert_validity_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_tls_cipher_suite_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_tls_version_header_name: typing.Optional[builtins.str] = None,
    routing_http_response_access_control_allow_credentials_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_access_control_allow_headers_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_access_control_allow_methods_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_access_control_allow_origin_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_access_control_expose_headers_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_access_control_max_age_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_content_security_policy_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_server_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    routing_http_response_strict_transport_security_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_x_content_type_options_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_x_frame_options_header_value: typing.Optional[builtins.str] = None,
    ssl_policy: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tcp_idle_timeout_seconds: typing.Optional[jsii.Number] = None,
    timeouts: typing.Optional[typing.Union[LbListenerTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__2193f235a70363b8fc122c47eb68be56446b1185c8aa48908d7f51530b890094(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c49101c37135b81706898fc278bbc24edaeda8432e55c19f593e9c7e5990686(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LbListenerDefaultAction, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ee2968fa8ba7b59de57945123103afc3ee2c1d3d078a5a00c2e5b872c83d9578(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8491a4a562c5b81526c5593aa82b5799390391254a85c04ee21d3d29cf98e412(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1545cdd9a634337ee2ec771c655871b0e5587346b59771f8906acdeff4e1eaa2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e581534118d4a1a42ad09d146cb6d1f7a06c64ce5ebdaff2437db9c7be8af10c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7350f3c3d775138076108964bb3e9fd82cdbfd008c33f814d673048250ed20c2(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e03147310ace0f554a1e071cf58741a7945cbcdb65a20ebaa6e77869b4a02e85(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e16acbe8e3482222d791c1826448d9a69d5900d657497d03b91c8667b4a3d29b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2901bfd777f5a885ab080aa069d5609d68b89e8fd7957e3fd80f1d372a0e89a8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64d64dea7ae250e00b5ed9c26ccfc2673e7b272be70e48b1d77ec6790c7fd403(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__57642b02f52101cb362928cf93fd60162fb2b828e9dcb6738fd3e09b51fdb852(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__805a817b3318b46543579eec57edf42fc81d8dae9b4d18f88e3fabc3cd6e7ccc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3360e701f221fbd085241a555cba23ac446c8a368f734f74b2367baf0e330eed(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__38a3f5c5c74059be7e42ead2ceae6db7aaf01964fa63f71596b30f4bf93afc89(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__936f6df0870bcea57f24898c341264eaa4f1394ee1e81468a2a675510ee9d2b3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c5a1a065d94bad7801110452716a3cd7c1f21807465dc06b2336586d2435c41e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62e186e5c99839606eeb972d69193a17c31aad8dd4b7c2e72277ac154fc748c5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f1a45237ec240a81f9f29f206846f85c807fd4b7f375a2697adb7095d09cf0b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8efff94c456239bad6765d014864f6c0ea768ef3bce00536978a3af8b649d4ea(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b7675ba733ad8c1072adec3c62055b0114ec705d61efa54ec5daff050aa19ff3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c8a65947f6995b4f96ba3867f29bdd7cca8f818603a77c7090e1180f9c526299(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__55f195e77ca87fedb5c9cd241ed740a61a6bd149d4b286099940a52f38095d6b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d408d24d53b9897f6fba3189ec83b23812a613ac066a4a00ed2cce043cafde1f(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1b4da4bad144bb46e87dc26ff94fa2fddfc324cd2a142bb9afa4b32ebc4645ca(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__acaa39d944b304fc3a8faf8fbc970191b26f330b7797f2d282cbb83198a3ded2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8bad2a1fdf10d218c35b28f40f8616e1d9b2067cd4f27c9f5ac93974660e90b5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37790746f993017043b2198dad2e5b4d143a6ac379a3b4f82e925c015c174630(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__293b10742a5cce4b806c7829e2ce1ab2dcefb45b66c86f3f6a57ef80e5b0d8e6(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__81d68e7b6a80b50f2a1a522dba84aac44637a53f1b2b042f41b2ff067d872581(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83a9b5b1fa32b986fa6cce4145bda2a31adac839ae27bb799b277123ac88c7ef(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d092b4eec92f81adf91222be262046c3e8e0c5ad4bfcadbb794c5041ced2ca0(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    default_action: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LbListenerDefaultAction, typing.Dict[builtins.str, typing.Any]]]],
    load_balancer_arn: builtins.str,
    alpn_policy: typing.Optional[builtins.str] = None,
    certificate_arn: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    mutual_authentication: typing.Optional[typing.Union[LbListenerMutualAuthentication, typing.Dict[builtins.str, typing.Any]]] = None,
    port: typing.Optional[jsii.Number] = None,
    protocol: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_mtls_clientcert_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_mtls_clientcert_issuer_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_mtls_clientcert_leaf_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_mtls_clientcert_subject_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_mtls_clientcert_validity_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_tls_cipher_suite_header_name: typing.Optional[builtins.str] = None,
    routing_http_request_x_amzn_tls_version_header_name: typing.Optional[builtins.str] = None,
    routing_http_response_access_control_allow_credentials_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_access_control_allow_headers_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_access_control_allow_methods_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_access_control_allow_origin_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_access_control_expose_headers_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_access_control_max_age_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_content_security_policy_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_server_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    routing_http_response_strict_transport_security_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_x_content_type_options_header_value: typing.Optional[builtins.str] = None,
    routing_http_response_x_frame_options_header_value: typing.Optional[builtins.str] = None,
    ssl_policy: typing.Optional[builtins.str] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tcp_idle_timeout_seconds: typing.Optional[jsii.Number] = None,
    timeouts: typing.Optional[typing.Union[LbListenerTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__eb50835fa3167ef30af6453751d8b76aa10bed4c9dabbada3d2f2e45e62cc5a9(
    *,
    type: builtins.str,
    authenticate_cognito: typing.Optional[typing.Union[LbListenerDefaultActionAuthenticateCognito, typing.Dict[builtins.str, typing.Any]]] = None,
    authenticate_oidc: typing.Optional[typing.Union[LbListenerDefaultActionAuthenticateOidc, typing.Dict[builtins.str, typing.Any]]] = None,
    fixed_response: typing.Optional[typing.Union[LbListenerDefaultActionFixedResponse, typing.Dict[builtins.str, typing.Any]]] = None,
    forward: typing.Optional[typing.Union[LbListenerDefaultActionForward, typing.Dict[builtins.str, typing.Any]]] = None,
    order: typing.Optional[jsii.Number] = None,
    redirect: typing.Optional[typing.Union[LbListenerDefaultActionRedirect, typing.Dict[builtins.str, typing.Any]]] = None,
    target_group_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__04bffc3502aa2f61b7fd721007826fe2dfa52e51f58801fe3af20e67508b238c(
    *,
    user_pool_arn: builtins.str,
    user_pool_client_id: builtins.str,
    user_pool_domain: builtins.str,
    authentication_request_extra_params: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    on_unauthenticated_request: typing.Optional[builtins.str] = None,
    scope: typing.Optional[builtins.str] = None,
    session_cookie_name: typing.Optional[builtins.str] = None,
    session_timeout: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4110251f4a40efa37258e6ebe3049bd7aee54c5d39c5286feb3795c70e5682e5(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3584d5a1cebb8c22fdd40ee7fc59c97119cf429ba97def9fc9e12cbe6738d331(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__642c4cd5aef516903d5c1ba4c84c52bbd4aa7ef5478af88d36fa33dca68ae67c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db53da48a5d384b537d60fa5e9efff258e06edf11edb9ff5b1258994a0d7a443(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14d6e1a56725f40996fff1bf17ba73fe5d0c51e82791236c1dc191bbc0952d54(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75d33a5c62d65ddebc1fc1baa0060636b67f0d89fe49f67a0fe12c70039d7b92(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d8f4cba1eab647d96e8ab736a7697248838c630cb24e20d163ed8a04beb1f39(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3a45f5b5792cec6a6237b1d313f36a5fbf8541deb544e473a65100e64f420c5(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__31aacf4ab3e91481e738fe592a830a9bed990d6f4f227450e260b1d876c25089(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__64ee19c98c2a2b6b0e5af6c0b572f5f29bb920a93cf3ebfc3c7a4d1fbcf7e65d(
    value: typing.Optional[LbListenerDefaultActionAuthenticateCognito],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1aa583f387df776d2e39a1ddf90bd41e3dae810f68907230794ff10a5ecbe265(
    *,
    authorization_endpoint: builtins.str,
    client_id: builtins.str,
    client_secret: builtins.str,
    issuer: builtins.str,
    token_endpoint: builtins.str,
    user_info_endpoint: builtins.str,
    authentication_request_extra_params: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    on_unauthenticated_request: typing.Optional[builtins.str] = None,
    scope: typing.Optional[builtins.str] = None,
    session_cookie_name: typing.Optional[builtins.str] = None,
    session_timeout: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d5ca85f7755ad823a1b898756e72e83776e0193e25ccb56f8dd1e0ee64e9c91e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__798570c8b2d18b25bda6d06c6106fefed004a57bec3885de8b49062ae54c5a1a(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b4923a8decb1e0850dbeb70e90695f962e163bed3dc7f360e828b35871dbdbd7(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78f515741b07c776dcc942f37e97c18aedc7683c7cee5f7979b255309decfbae(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dd9244357f8ae2ef2d3b050b005540903b76822bf372f974c7a15cb517fda19a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea523bd534c70aced98bf1bf71d01a7d092e1cc921dab0083f8bc98d7edd8fb0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f98881f10c0f86e5349a62c105ebc75fc9e06667b60d0a8a996a7c1d7e2e53dc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f85c311a31dc7ac0b6c00f062aebbe1ac097ad84791d95475b35177c02ed2ecb(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fec62e9d73b842c6f356951895b47e55c43371d991142459f92bdaae886e44cc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6d572696be35cff2412aba65f1212928980c4fdfd36d18ac6592ad92a2ce7dd(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00e41183b438b300b685967de8c487f8be7d888ebd3a013c7b59fa687a35890f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1424226eeb23bd9ad6ab1571be21a3918b754295601246c1e83d8d32b5f2a460(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ede65cdbd2f74a949c9ef588b254b9862b08a987b0761ac9243dde9cdbee40b5(
    value: typing.Optional[LbListenerDefaultActionAuthenticateOidc],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5fad33554f64308cd13812263a60f79274ff4d528098fb3e4ac9893647b5096a(
    *,
    content_type: builtins.str,
    message_body: typing.Optional[builtins.str] = None,
    status_code: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7436df75d5bf73ac4d297a70c12a439ea4e1a618b9543beeae4585b2e31e887d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1374bd9ed521d79ba7325e559ce4ffb4f0b373fcd5b3702a10d2e0fa3f0472dd(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__91609da610a37450cf1714e2594e3997ca485aefad132053328a258f7dc0e627(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60df080f5fd11b0ef3ab21a77671fd6d76934036897b3b5ac4af6468f4ec26b0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02bcbbf541acbb24d2e0e3a5c27fd9d0e83cd77023bf9361a6892647e76a77ba(
    value: typing.Optional[LbListenerDefaultActionFixedResponse],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2b388be049cbfce4d5288f0c5939fcab2f7e2ae087aebcd84de2552476c113c7(
    *,
    target_group: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LbListenerDefaultActionForwardTargetGroup, typing.Dict[builtins.str, typing.Any]]]],
    stickiness: typing.Optional[typing.Union[LbListenerDefaultActionForwardStickiness, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a3ce9bab06a159991b42d0f012b81e2ed4884f89f04f7a8ec56ff1ffd9706988(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f825b7bff39e6f8b4cca0ef6f7d2d0a5c8bc98fa690704bdfc62079bf62d441(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[LbListenerDefaultActionForwardTargetGroup, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6194709a736e964e9f4665b77e9f16171351e3bbbdb41355cfe26d5dba4c3c5a(
    value: typing.Optional[LbListenerDefaultActionForward],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f039bae4df1868f4904ae47466bd9086fa46f372cb5fa6e4aaae5d7ec15a6d0e(
    *,
    duration: jsii.Number,
    enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac6199120810921ce8170074ef3bfed704bf84b081044142530296f51eb76dc3(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2f0344dd0c0f83ce21fb6a41aa7a58a85e76270d097e6fc5f4325e238d2846b3(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__15d4d451ca5a9ea65f7fdfa22c5a7f88de91f59cbe62e0f7f71aac7e58c90497(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__34b14601aaa8fe536bf860cd9f88d2bd783db22efda10c89ca4759d3136c83c9(
    value: typing.Optional[LbListenerDefaultActionForwardStickiness],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7aef89bad49f4e4310072c0d05ebb2b0bb991bf75dffdd162c08f22e6811f306(
    *,
    arn: builtins.str,
    weight: typing.Optional[jsii.Number] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5a2b325dd6b0fc08136578c6de76d692f0229b5d94c7518a7d0e4e50f3561c1e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3161634279f9c6b367ed646b1879c9dbfa38e444e5c716a3def903e5ef7fa3a2(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__12a53ed01673b0e1ac95307949137ce2b55f56d1d00e923f13c7072236f3865a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a84e089db61914f7fbd101137d9d73c8dacdf81d7bfbc3e083bf84eb81dc497(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4664327416db081bdf902e96bbcab1677fff786d04b7898dd57da11c117e3767(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ffabcff36d5ff80a1cb730107edcc407fc614b9a5da5fc0012d0e247fb0f878e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LbListenerDefaultActionForwardTargetGroup]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9f3980b920d7db5d06a7dcb975c349e0625a2e79e024fd16e99fb7ca31baf1ee(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a46e4791025ada57f4e79feeaaeda3abd531b4878326bb545a84de5d0eb3f883(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__44020072f0276e6d74ccf80d98079f54cd7db744f7694721a64577ad847d7ec0(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1c62272f61351dc77a976ef9cf33eab74634638f9223a9a8b33015fa5468170b(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbListenerDefaultActionForwardTargetGroup]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c7f58def599770e240bb5bcc61e5294d2978fa60f8ddfcbf46006fa396dd76b8(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0753a342e47de92ca301cffcd5fadfc3d3a76c57d4e1e645e1c17c9296a53118(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5e27b7c7391e78d325c03462180f829f8832beb3fc9dacd9abd6f6129cb391c3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__de2cb12eaf50aa1f094093d218ece10cc38500976bf9a6f6f846da53125b7835(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2956af5505e3b5f32d355117e6b2dd0a447dec093a944045977eb1151b228b13(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__299c3d140d8535b37b0c7085292f3db0ad757a0e39706f9647801662169697dd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[LbListenerDefaultAction]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1f28dcd752cfa50dbe4d75af88a008ffd0e71b19c6e5e899283dd3002e4db81d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3cd495ab11b5cc5803da36b07da1c7ced88a0d0a8c4dd67831e1eea002f3d66a(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7292b38f31076e80e11b78c8874a5abd6c68a366faf926b90575299194892780(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__43a4a7d10114a63823f46c9ee0c14d7fa146b81543fcd2f849583766895ae652(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__da45b64bca7915a6729dca354f1ef63068498db5f8c5bce25543b3630eab007e(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbListenerDefaultAction]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b6d6812b29fe37d1031547ab666ed72b33f75a0e3c2548aaae780f93a449144c(
    *,
    status_code: builtins.str,
    host: typing.Optional[builtins.str] = None,
    path: typing.Optional[builtins.str] = None,
    port: typing.Optional[builtins.str] = None,
    protocol: typing.Optional[builtins.str] = None,
    query: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__773a9a4c1418f5781ec63379c68bffb9869ba72dab3d0bf2b15ed198a3591d98(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__baaa1ade077eb7e2cebcaa997d175fb08b36aeea0ca6350865aa442576533334(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__47ffce38816b9a8d3492513b728c265f16e5ba3fd2ba226a9320aa5020d0f1a2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c8437e1c8b4945823884cc957048e50e95c8310638a7198c260ab119a294ed22(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3dc46feb26462f7443b51ce307635bfa88d3e0b6983017ae81950136444a8f9b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b208bc1ab7faba11d8feef7ca84bf07268f2055deb508ed1801e1001cf453b0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ab02cedb6e1423f1b8c53e4e3e07cb1cf849f57ca2afc4e83fee9f9f8afbc14(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__598e11f94d6331700be6206156eb33c1d157515351513093c65d68b6ed9178c8(
    value: typing.Optional[LbListenerDefaultActionRedirect],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83dc7764235d0069cad88b5c6e09a20a4fc0ad84a36b23b80e86f01175f4892e(
    *,
    mode: builtins.str,
    advertise_trust_store_ca_names: typing.Optional[builtins.str] = None,
    ignore_client_certificate_expiry: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    trust_store_arn: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__01387322bf90d533ff8b33b93c7213e44afdf79b6f54cfe1270aa5342a31cd70(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__11680dbdb15d6b1ed6395958d1babb9b7cc26919c6ed8bb110e2577a380c2c09(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a285dce3c410d96597a3254de119080742bfe571d12d93b3afbe288422e9464(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bbc3b9a15131fc5f692c65954a19cfa66eed634d3e0c7b5d7dfc620c2b76256c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__496f595076464dd80fc89060d2821d870b87632285f36737e8b64289575ee145(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__54edb560e2e978790ccd7692d92828b67559dc9c43a79323f75384930a7fb7fd(
    value: typing.Optional[LbListenerMutualAuthentication],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b3d8cb6ce23dd41f051e484dcd4f1f9296c504275bf6e45333eaab8391602974(
    *,
    create: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e99aeac1579bdeccfe328f0fb1c822a6b1f32a1842508eeef3c1779fbf41ea71(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e0d01d883888df03e0a4b7e8462d383fc2744099a149987e426170e79f5ef86c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a5e95391685fbba4c9b4c8a0e88ec37c99078e539072326d300f05ade948e27(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bfe24b47e78e603ec4c0d87a09b5a27414887d2aef5c93e6dc27155ef4c2931a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, LbListenerTimeouts]],
) -> None:
    """Type checking stubs"""
    pass
