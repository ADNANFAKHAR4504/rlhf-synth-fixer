r'''
# `aws_transfer_server`

Refer to the Terraform Registry for docs: [`aws_transfer_server`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server).
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


class TransferServer(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.transferServer.TransferServer",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server aws_transfer_server}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        certificate: typing.Optional[builtins.str] = None,
        directory_id: typing.Optional[builtins.str] = None,
        domain: typing.Optional[builtins.str] = None,
        endpoint_details: typing.Optional[typing.Union["TransferServerEndpointDetails", typing.Dict[builtins.str, typing.Any]]] = None,
        endpoint_type: typing.Optional[builtins.str] = None,
        force_destroy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        function: typing.Optional[builtins.str] = None,
        host_key: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        identity_provider_type: typing.Optional[builtins.str] = None,
        invocation_role: typing.Optional[builtins.str] = None,
        logging_role: typing.Optional[builtins.str] = None,
        post_authentication_login_banner: typing.Optional[builtins.str] = None,
        pre_authentication_login_banner: typing.Optional[builtins.str] = None,
        protocol_details: typing.Optional[typing.Union["TransferServerProtocolDetails", typing.Dict[builtins.str, typing.Any]]] = None,
        protocols: typing.Optional[typing.Sequence[builtins.str]] = None,
        s3_storage_options: typing.Optional[typing.Union["TransferServerS3StorageOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        security_policy_name: typing.Optional[builtins.str] = None,
        sftp_authentication_methods: typing.Optional[builtins.str] = None,
        structured_log_destinations: typing.Optional[typing.Sequence[builtins.str]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        url: typing.Optional[builtins.str] = None,
        workflow_details: typing.Optional[typing.Union["TransferServerWorkflowDetails", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server aws_transfer_server} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param certificate: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#certificate TransferServer#certificate}.
        :param directory_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#directory_id TransferServer#directory_id}.
        :param domain: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#domain TransferServer#domain}.
        :param endpoint_details: endpoint_details block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_details TransferServer#endpoint_details}
        :param endpoint_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_type TransferServer#endpoint_type}.
        :param force_destroy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#force_destroy TransferServer#force_destroy}.
        :param function: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#function TransferServer#function}.
        :param host_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#host_key TransferServer#host_key}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#id TransferServer#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param identity_provider_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#identity_provider_type TransferServer#identity_provider_type}.
        :param invocation_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#invocation_role TransferServer#invocation_role}.
        :param logging_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#logging_role TransferServer#logging_role}.
        :param post_authentication_login_banner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#post_authentication_login_banner TransferServer#post_authentication_login_banner}.
        :param pre_authentication_login_banner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#pre_authentication_login_banner TransferServer#pre_authentication_login_banner}.
        :param protocol_details: protocol_details block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocol_details TransferServer#protocol_details}
        :param protocols: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocols TransferServer#protocols}.
        :param s3_storage_options: s3_storage_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#s3_storage_options TransferServer#s3_storage_options}
        :param security_policy_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#security_policy_name TransferServer#security_policy_name}.
        :param sftp_authentication_methods: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#sftp_authentication_methods TransferServer#sftp_authentication_methods}.
        :param structured_log_destinations: This is a set of arns of destinations that will receive structured logs from the transfer server. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#structured_log_destinations TransferServer#structured_log_destinations}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags TransferServer#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags_all TransferServer#tags_all}.
        :param url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#url TransferServer#url}.
        :param workflow_details: workflow_details block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_details TransferServer#workflow_details}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0024520c352801117f2df46409b230c52dd66538593f5afcdae01292d7e1989c)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = TransferServerConfig(
            certificate=certificate,
            directory_id=directory_id,
            domain=domain,
            endpoint_details=endpoint_details,
            endpoint_type=endpoint_type,
            force_destroy=force_destroy,
            function=function,
            host_key=host_key,
            id=id,
            identity_provider_type=identity_provider_type,
            invocation_role=invocation_role,
            logging_role=logging_role,
            post_authentication_login_banner=post_authentication_login_banner,
            pre_authentication_login_banner=pre_authentication_login_banner,
            protocol_details=protocol_details,
            protocols=protocols,
            s3_storage_options=s3_storage_options,
            security_policy_name=security_policy_name,
            sftp_authentication_methods=sftp_authentication_methods,
            structured_log_destinations=structured_log_destinations,
            tags=tags,
            tags_all=tags_all,
            url=url,
            workflow_details=workflow_details,
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
        '''Generates CDKTF code for importing a TransferServer resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the TransferServer to import.
        :param import_from_id: The id of the existing TransferServer that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the TransferServer to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ac7446d0b7099af8e470a9b1a931f73cb2546ef023d2741e012e242cd27ec974)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putEndpointDetails")
    def put_endpoint_details(
        self,
        *,
        address_allocation_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        security_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        subnet_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        vpc_endpoint_id: typing.Optional[builtins.str] = None,
        vpc_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address_allocation_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#address_allocation_ids TransferServer#address_allocation_ids}.
        :param security_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#security_group_ids TransferServer#security_group_ids}.
        :param subnet_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#subnet_ids TransferServer#subnet_ids}.
        :param vpc_endpoint_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#vpc_endpoint_id TransferServer#vpc_endpoint_id}.
        :param vpc_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#vpc_id TransferServer#vpc_id}.
        '''
        value = TransferServerEndpointDetails(
            address_allocation_ids=address_allocation_ids,
            security_group_ids=security_group_ids,
            subnet_ids=subnet_ids,
            vpc_endpoint_id=vpc_endpoint_id,
            vpc_id=vpc_id,
        )

        return typing.cast(None, jsii.invoke(self, "putEndpointDetails", [value]))

    @jsii.member(jsii_name="putProtocolDetails")
    def put_protocol_details(
        self,
        *,
        as2_transports: typing.Optional[typing.Sequence[builtins.str]] = None,
        passive_ip: typing.Optional[builtins.str] = None,
        set_stat_option: typing.Optional[builtins.str] = None,
        tls_session_resumption_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param as2_transports: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#as2_transports TransferServer#as2_transports}.
        :param passive_ip: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#passive_ip TransferServer#passive_ip}.
        :param set_stat_option: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#set_stat_option TransferServer#set_stat_option}.
        :param tls_session_resumption_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tls_session_resumption_mode TransferServer#tls_session_resumption_mode}.
        '''
        value = TransferServerProtocolDetails(
            as2_transports=as2_transports,
            passive_ip=passive_ip,
            set_stat_option=set_stat_option,
            tls_session_resumption_mode=tls_session_resumption_mode,
        )

        return typing.cast(None, jsii.invoke(self, "putProtocolDetails", [value]))

    @jsii.member(jsii_name="putS3StorageOptions")
    def put_s3_storage_options(
        self,
        *,
        directory_listing_optimization: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param directory_listing_optimization: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#directory_listing_optimization TransferServer#directory_listing_optimization}.
        '''
        value = TransferServerS3StorageOptions(
            directory_listing_optimization=directory_listing_optimization
        )

        return typing.cast(None, jsii.invoke(self, "putS3StorageOptions", [value]))

    @jsii.member(jsii_name="putWorkflowDetails")
    def put_workflow_details(
        self,
        *,
        on_partial_upload: typing.Optional[typing.Union["TransferServerWorkflowDetailsOnPartialUpload", typing.Dict[builtins.str, typing.Any]]] = None,
        on_upload: typing.Optional[typing.Union["TransferServerWorkflowDetailsOnUpload", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param on_partial_upload: on_partial_upload block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#on_partial_upload TransferServer#on_partial_upload}
        :param on_upload: on_upload block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#on_upload TransferServer#on_upload}
        '''
        value = TransferServerWorkflowDetails(
            on_partial_upload=on_partial_upload, on_upload=on_upload
        )

        return typing.cast(None, jsii.invoke(self, "putWorkflowDetails", [value]))

    @jsii.member(jsii_name="resetCertificate")
    def reset_certificate(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCertificate", []))

    @jsii.member(jsii_name="resetDirectoryId")
    def reset_directory_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDirectoryId", []))

    @jsii.member(jsii_name="resetDomain")
    def reset_domain(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDomain", []))

    @jsii.member(jsii_name="resetEndpointDetails")
    def reset_endpoint_details(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEndpointDetails", []))

    @jsii.member(jsii_name="resetEndpointType")
    def reset_endpoint_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEndpointType", []))

    @jsii.member(jsii_name="resetForceDestroy")
    def reset_force_destroy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetForceDestroy", []))

    @jsii.member(jsii_name="resetFunction")
    def reset_function(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetFunction", []))

    @jsii.member(jsii_name="resetHostKey")
    def reset_host_key(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHostKey", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetIdentityProviderType")
    def reset_identity_provider_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdentityProviderType", []))

    @jsii.member(jsii_name="resetInvocationRole")
    def reset_invocation_role(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetInvocationRole", []))

    @jsii.member(jsii_name="resetLoggingRole")
    def reset_logging_role(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetLoggingRole", []))

    @jsii.member(jsii_name="resetPostAuthenticationLoginBanner")
    def reset_post_authentication_login_banner(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPostAuthenticationLoginBanner", []))

    @jsii.member(jsii_name="resetPreAuthenticationLoginBanner")
    def reset_pre_authentication_login_banner(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPreAuthenticationLoginBanner", []))

    @jsii.member(jsii_name="resetProtocolDetails")
    def reset_protocol_details(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProtocolDetails", []))

    @jsii.member(jsii_name="resetProtocols")
    def reset_protocols(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetProtocols", []))

    @jsii.member(jsii_name="resetS3StorageOptions")
    def reset_s3_storage_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetS3StorageOptions", []))

    @jsii.member(jsii_name="resetSecurityPolicyName")
    def reset_security_policy_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityPolicyName", []))

    @jsii.member(jsii_name="resetSftpAuthenticationMethods")
    def reset_sftp_authentication_methods(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSftpAuthenticationMethods", []))

    @jsii.member(jsii_name="resetStructuredLogDestinations")
    def reset_structured_log_destinations(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetStructuredLogDestinations", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetUrl")
    def reset_url(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUrl", []))

    @jsii.member(jsii_name="resetWorkflowDetails")
    def reset_workflow_details(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetWorkflowDetails", []))

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
    @jsii.member(jsii_name="endpoint")
    def endpoint(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endpoint"))

    @builtins.property
    @jsii.member(jsii_name="endpointDetails")
    def endpoint_details(self) -> "TransferServerEndpointDetailsOutputReference":
        return typing.cast("TransferServerEndpointDetailsOutputReference", jsii.get(self, "endpointDetails"))

    @builtins.property
    @jsii.member(jsii_name="hostKeyFingerprint")
    def host_key_fingerprint(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "hostKeyFingerprint"))

    @builtins.property
    @jsii.member(jsii_name="protocolDetails")
    def protocol_details(self) -> "TransferServerProtocolDetailsOutputReference":
        return typing.cast("TransferServerProtocolDetailsOutputReference", jsii.get(self, "protocolDetails"))

    @builtins.property
    @jsii.member(jsii_name="s3StorageOptions")
    def s3_storage_options(self) -> "TransferServerS3StorageOptionsOutputReference":
        return typing.cast("TransferServerS3StorageOptionsOutputReference", jsii.get(self, "s3StorageOptions"))

    @builtins.property
    @jsii.member(jsii_name="workflowDetails")
    def workflow_details(self) -> "TransferServerWorkflowDetailsOutputReference":
        return typing.cast("TransferServerWorkflowDetailsOutputReference", jsii.get(self, "workflowDetails"))

    @builtins.property
    @jsii.member(jsii_name="certificateInput")
    def certificate_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "certificateInput"))

    @builtins.property
    @jsii.member(jsii_name="directoryIdInput")
    def directory_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "directoryIdInput"))

    @builtins.property
    @jsii.member(jsii_name="domainInput")
    def domain_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "domainInput"))

    @builtins.property
    @jsii.member(jsii_name="endpointDetailsInput")
    def endpoint_details_input(
        self,
    ) -> typing.Optional["TransferServerEndpointDetails"]:
        return typing.cast(typing.Optional["TransferServerEndpointDetails"], jsii.get(self, "endpointDetailsInput"))

    @builtins.property
    @jsii.member(jsii_name="endpointTypeInput")
    def endpoint_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "endpointTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="forceDestroyInput")
    def force_destroy_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "forceDestroyInput"))

    @builtins.property
    @jsii.member(jsii_name="functionInput")
    def function_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "functionInput"))

    @builtins.property
    @jsii.member(jsii_name="hostKeyInput")
    def host_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "hostKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="identityProviderTypeInput")
    def identity_provider_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "identityProviderTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="invocationRoleInput")
    def invocation_role_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "invocationRoleInput"))

    @builtins.property
    @jsii.member(jsii_name="loggingRoleInput")
    def logging_role_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "loggingRoleInput"))

    @builtins.property
    @jsii.member(jsii_name="postAuthenticationLoginBannerInput")
    def post_authentication_login_banner_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "postAuthenticationLoginBannerInput"))

    @builtins.property
    @jsii.member(jsii_name="preAuthenticationLoginBannerInput")
    def pre_authentication_login_banner_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "preAuthenticationLoginBannerInput"))

    @builtins.property
    @jsii.member(jsii_name="protocolDetailsInput")
    def protocol_details_input(
        self,
    ) -> typing.Optional["TransferServerProtocolDetails"]:
        return typing.cast(typing.Optional["TransferServerProtocolDetails"], jsii.get(self, "protocolDetailsInput"))

    @builtins.property
    @jsii.member(jsii_name="protocolsInput")
    def protocols_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "protocolsInput"))

    @builtins.property
    @jsii.member(jsii_name="s3StorageOptionsInput")
    def s3_storage_options_input(
        self,
    ) -> typing.Optional["TransferServerS3StorageOptions"]:
        return typing.cast(typing.Optional["TransferServerS3StorageOptions"], jsii.get(self, "s3StorageOptionsInput"))

    @builtins.property
    @jsii.member(jsii_name="securityPolicyNameInput")
    def security_policy_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "securityPolicyNameInput"))

    @builtins.property
    @jsii.member(jsii_name="sftpAuthenticationMethodsInput")
    def sftp_authentication_methods_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sftpAuthenticationMethodsInput"))

    @builtins.property
    @jsii.member(jsii_name="structuredLogDestinationsInput")
    def structured_log_destinations_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "structuredLogDestinationsInput"))

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
    @jsii.member(jsii_name="urlInput")
    def url_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "urlInput"))

    @builtins.property
    @jsii.member(jsii_name="workflowDetailsInput")
    def workflow_details_input(
        self,
    ) -> typing.Optional["TransferServerWorkflowDetails"]:
        return typing.cast(typing.Optional["TransferServerWorkflowDetails"], jsii.get(self, "workflowDetailsInput"))

    @builtins.property
    @jsii.member(jsii_name="certificate")
    def certificate(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "certificate"))

    @certificate.setter
    def certificate(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c35fbfc440f9472c92b18ff9e3bbe8e032c5f585affb951ddf87948d1244864d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "certificate", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="directoryId")
    def directory_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "directoryId"))

    @directory_id.setter
    def directory_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ef66fcbb7a68ed64c6fa916a8349130757c8ceb57863f35622ceec7d8171888e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "directoryId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="domain")
    def domain(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "domain"))

    @domain.setter
    def domain(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37ac579952a25a072fa2e13dd6d92ca40bd0471e30f10accda757ec55cf76019)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "domain", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="endpointType")
    def endpoint_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "endpointType"))

    @endpoint_type.setter
    def endpoint_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9a008acf9549d96f05c3ddeb4d1cfff5995f96e0677bafe04550a27d4ab6baa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "endpointType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="forceDestroy")
    def force_destroy(self) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "forceDestroy"))

    @force_destroy.setter
    def force_destroy(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__32e484596c25776d0bde52e64b82441006bccd4558346d14e71552db4a7045a0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "forceDestroy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="function")
    def function(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "function"))

    @function.setter
    def function(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__86823cb9efa3963a47cb10169f16b59f72fb401499332b22901932e613b5fafc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "function", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="hostKey")
    def host_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "hostKey"))

    @host_key.setter
    def host_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a22cef45897dedb16090932ccf582177dad5041c5e8922002015e6901b5d993a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "hostKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__677c1694cda6011f90ddb90e9da44aa8a5f7e608e5baf55db7ae3d40e2f88860)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="identityProviderType")
    def identity_provider_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "identityProviderType"))

    @identity_provider_type.setter
    def identity_provider_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c5a465c96d3034f517f9fe37dab9305d41b9a6f4d7e1084822c19b82aa3f3f2b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "identityProviderType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="invocationRole")
    def invocation_role(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "invocationRole"))

    @invocation_role.setter
    def invocation_role(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2de98821e7bb02567142420ed2f707ba91eb8788570bd40188fa6f30bf641c55)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "invocationRole", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="loggingRole")
    def logging_role(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "loggingRole"))

    @logging_role.setter
    def logging_role(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__46227a4f24aeb714aea7a9c4a22bde9a159ecd5117f7a5a4e7c46e61e1314694)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "loggingRole", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="postAuthenticationLoginBanner")
    def post_authentication_login_banner(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "postAuthenticationLoginBanner"))

    @post_authentication_login_banner.setter
    def post_authentication_login_banner(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f63d09f91a8f890c55f458e7b489aba4e22874159e47d38f5dbed0f85f3d03a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "postAuthenticationLoginBanner", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="preAuthenticationLoginBanner")
    def pre_authentication_login_banner(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "preAuthenticationLoginBanner"))

    @pre_authentication_login_banner.setter
    def pre_authentication_login_banner(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bb46670495dbc2aec5e2fe7ec3f5c5ce70cde86f3fb7217cab2032646c0cd644)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "preAuthenticationLoginBanner", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="protocols")
    def protocols(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "protocols"))

    @protocols.setter
    def protocols(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d3bf96c03ed03be39c362e79a6b3518593af99b24cfc19c2b5ef5efdd78fc402)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "protocols", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="securityPolicyName")
    def security_policy_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "securityPolicyName"))

    @security_policy_name.setter
    def security_policy_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b998c38e8738a443ccc03e9504346cf6cfdb9483cfba4bfdff4c58c013ab6e2f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityPolicyName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sftpAuthenticationMethods")
    def sftp_authentication_methods(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sftpAuthenticationMethods"))

    @sftp_authentication_methods.setter
    def sftp_authentication_methods(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__62d6caf8550778b7defa3a2527f9dfd16033a109efaba243062af3735eaf32f6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sftpAuthenticationMethods", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="structuredLogDestinations")
    def structured_log_destinations(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "structuredLogDestinations"))

    @structured_log_destinations.setter
    def structured_log_destinations(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5944fa4625c6456434762b6e4e120d40c559e45733051228760342efe321616b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "structuredLogDestinations", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__689e15b5cf7dc30688ebb54cc5aa107422728925031f54be261b6c4acf40ade7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8a32bd1244a133b2188163931b7fcafd098a0c3dfbdc6259ab9a5e6054f167d4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="url")
    def url(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "url"))

    @url.setter
    def url(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__390dd44adf73e9bc61fe134cc8430a3648753c3408b9dcd1f7ccb51d1e47e76b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "url", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.transferServer.TransferServerConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "certificate": "certificate",
        "directory_id": "directoryId",
        "domain": "domain",
        "endpoint_details": "endpointDetails",
        "endpoint_type": "endpointType",
        "force_destroy": "forceDestroy",
        "function": "function",
        "host_key": "hostKey",
        "id": "id",
        "identity_provider_type": "identityProviderType",
        "invocation_role": "invocationRole",
        "logging_role": "loggingRole",
        "post_authentication_login_banner": "postAuthenticationLoginBanner",
        "pre_authentication_login_banner": "preAuthenticationLoginBanner",
        "protocol_details": "protocolDetails",
        "protocols": "protocols",
        "s3_storage_options": "s3StorageOptions",
        "security_policy_name": "securityPolicyName",
        "sftp_authentication_methods": "sftpAuthenticationMethods",
        "structured_log_destinations": "structuredLogDestinations",
        "tags": "tags",
        "tags_all": "tagsAll",
        "url": "url",
        "workflow_details": "workflowDetails",
    },
)
class TransferServerConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        certificate: typing.Optional[builtins.str] = None,
        directory_id: typing.Optional[builtins.str] = None,
        domain: typing.Optional[builtins.str] = None,
        endpoint_details: typing.Optional[typing.Union["TransferServerEndpointDetails", typing.Dict[builtins.str, typing.Any]]] = None,
        endpoint_type: typing.Optional[builtins.str] = None,
        force_destroy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
        function: typing.Optional[builtins.str] = None,
        host_key: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        identity_provider_type: typing.Optional[builtins.str] = None,
        invocation_role: typing.Optional[builtins.str] = None,
        logging_role: typing.Optional[builtins.str] = None,
        post_authentication_login_banner: typing.Optional[builtins.str] = None,
        pre_authentication_login_banner: typing.Optional[builtins.str] = None,
        protocol_details: typing.Optional[typing.Union["TransferServerProtocolDetails", typing.Dict[builtins.str, typing.Any]]] = None,
        protocols: typing.Optional[typing.Sequence[builtins.str]] = None,
        s3_storage_options: typing.Optional[typing.Union["TransferServerS3StorageOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        security_policy_name: typing.Optional[builtins.str] = None,
        sftp_authentication_methods: typing.Optional[builtins.str] = None,
        structured_log_destinations: typing.Optional[typing.Sequence[builtins.str]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        url: typing.Optional[builtins.str] = None,
        workflow_details: typing.Optional[typing.Union["TransferServerWorkflowDetails", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param certificate: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#certificate TransferServer#certificate}.
        :param directory_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#directory_id TransferServer#directory_id}.
        :param domain: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#domain TransferServer#domain}.
        :param endpoint_details: endpoint_details block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_details TransferServer#endpoint_details}
        :param endpoint_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_type TransferServer#endpoint_type}.
        :param force_destroy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#force_destroy TransferServer#force_destroy}.
        :param function: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#function TransferServer#function}.
        :param host_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#host_key TransferServer#host_key}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#id TransferServer#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param identity_provider_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#identity_provider_type TransferServer#identity_provider_type}.
        :param invocation_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#invocation_role TransferServer#invocation_role}.
        :param logging_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#logging_role TransferServer#logging_role}.
        :param post_authentication_login_banner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#post_authentication_login_banner TransferServer#post_authentication_login_banner}.
        :param pre_authentication_login_banner: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#pre_authentication_login_banner TransferServer#pre_authentication_login_banner}.
        :param protocol_details: protocol_details block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocol_details TransferServer#protocol_details}
        :param protocols: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocols TransferServer#protocols}.
        :param s3_storage_options: s3_storage_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#s3_storage_options TransferServer#s3_storage_options}
        :param security_policy_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#security_policy_name TransferServer#security_policy_name}.
        :param sftp_authentication_methods: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#sftp_authentication_methods TransferServer#sftp_authentication_methods}.
        :param structured_log_destinations: This is a set of arns of destinations that will receive structured logs from the transfer server. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#structured_log_destinations TransferServer#structured_log_destinations}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags TransferServer#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags_all TransferServer#tags_all}.
        :param url: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#url TransferServer#url}.
        :param workflow_details: workflow_details block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_details TransferServer#workflow_details}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(endpoint_details, dict):
            endpoint_details = TransferServerEndpointDetails(**endpoint_details)
        if isinstance(protocol_details, dict):
            protocol_details = TransferServerProtocolDetails(**protocol_details)
        if isinstance(s3_storage_options, dict):
            s3_storage_options = TransferServerS3StorageOptions(**s3_storage_options)
        if isinstance(workflow_details, dict):
            workflow_details = TransferServerWorkflowDetails(**workflow_details)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__413416edb513f65ad0a5bc2e76ffaa926720209cc0a76e7046d72cc90f76318e)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument certificate", value=certificate, expected_type=type_hints["certificate"])
            check_type(argname="argument directory_id", value=directory_id, expected_type=type_hints["directory_id"])
            check_type(argname="argument domain", value=domain, expected_type=type_hints["domain"])
            check_type(argname="argument endpoint_details", value=endpoint_details, expected_type=type_hints["endpoint_details"])
            check_type(argname="argument endpoint_type", value=endpoint_type, expected_type=type_hints["endpoint_type"])
            check_type(argname="argument force_destroy", value=force_destroy, expected_type=type_hints["force_destroy"])
            check_type(argname="argument function", value=function, expected_type=type_hints["function"])
            check_type(argname="argument host_key", value=host_key, expected_type=type_hints["host_key"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument identity_provider_type", value=identity_provider_type, expected_type=type_hints["identity_provider_type"])
            check_type(argname="argument invocation_role", value=invocation_role, expected_type=type_hints["invocation_role"])
            check_type(argname="argument logging_role", value=logging_role, expected_type=type_hints["logging_role"])
            check_type(argname="argument post_authentication_login_banner", value=post_authentication_login_banner, expected_type=type_hints["post_authentication_login_banner"])
            check_type(argname="argument pre_authentication_login_banner", value=pre_authentication_login_banner, expected_type=type_hints["pre_authentication_login_banner"])
            check_type(argname="argument protocol_details", value=protocol_details, expected_type=type_hints["protocol_details"])
            check_type(argname="argument protocols", value=protocols, expected_type=type_hints["protocols"])
            check_type(argname="argument s3_storage_options", value=s3_storage_options, expected_type=type_hints["s3_storage_options"])
            check_type(argname="argument security_policy_name", value=security_policy_name, expected_type=type_hints["security_policy_name"])
            check_type(argname="argument sftp_authentication_methods", value=sftp_authentication_methods, expected_type=type_hints["sftp_authentication_methods"])
            check_type(argname="argument structured_log_destinations", value=structured_log_destinations, expected_type=type_hints["structured_log_destinations"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument url", value=url, expected_type=type_hints["url"])
            check_type(argname="argument workflow_details", value=workflow_details, expected_type=type_hints["workflow_details"])
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
        if certificate is not None:
            self._values["certificate"] = certificate
        if directory_id is not None:
            self._values["directory_id"] = directory_id
        if domain is not None:
            self._values["domain"] = domain
        if endpoint_details is not None:
            self._values["endpoint_details"] = endpoint_details
        if endpoint_type is not None:
            self._values["endpoint_type"] = endpoint_type
        if force_destroy is not None:
            self._values["force_destroy"] = force_destroy
        if function is not None:
            self._values["function"] = function
        if host_key is not None:
            self._values["host_key"] = host_key
        if id is not None:
            self._values["id"] = id
        if identity_provider_type is not None:
            self._values["identity_provider_type"] = identity_provider_type
        if invocation_role is not None:
            self._values["invocation_role"] = invocation_role
        if logging_role is not None:
            self._values["logging_role"] = logging_role
        if post_authentication_login_banner is not None:
            self._values["post_authentication_login_banner"] = post_authentication_login_banner
        if pre_authentication_login_banner is not None:
            self._values["pre_authentication_login_banner"] = pre_authentication_login_banner
        if protocol_details is not None:
            self._values["protocol_details"] = protocol_details
        if protocols is not None:
            self._values["protocols"] = protocols
        if s3_storage_options is not None:
            self._values["s3_storage_options"] = s3_storage_options
        if security_policy_name is not None:
            self._values["security_policy_name"] = security_policy_name
        if sftp_authentication_methods is not None:
            self._values["sftp_authentication_methods"] = sftp_authentication_methods
        if structured_log_destinations is not None:
            self._values["structured_log_destinations"] = structured_log_destinations
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if url is not None:
            self._values["url"] = url
        if workflow_details is not None:
            self._values["workflow_details"] = workflow_details

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
    def certificate(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#certificate TransferServer#certificate}.'''
        result = self._values.get("certificate")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def directory_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#directory_id TransferServer#directory_id}.'''
        result = self._values.get("directory_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def domain(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#domain TransferServer#domain}.'''
        result = self._values.get("domain")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def endpoint_details(self) -> typing.Optional["TransferServerEndpointDetails"]:
        '''endpoint_details block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_details TransferServer#endpoint_details}
        '''
        result = self._values.get("endpoint_details")
        return typing.cast(typing.Optional["TransferServerEndpointDetails"], result)

    @builtins.property
    def endpoint_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#endpoint_type TransferServer#endpoint_type}.'''
        result = self._values.get("endpoint_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def force_destroy(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#force_destroy TransferServer#force_destroy}.'''
        result = self._values.get("force_destroy")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    @builtins.property
    def function(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#function TransferServer#function}.'''
        result = self._values.get("function")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def host_key(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#host_key TransferServer#host_key}.'''
        result = self._values.get("host_key")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#id TransferServer#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def identity_provider_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#identity_provider_type TransferServer#identity_provider_type}.'''
        result = self._values.get("identity_provider_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def invocation_role(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#invocation_role TransferServer#invocation_role}.'''
        result = self._values.get("invocation_role")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def logging_role(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#logging_role TransferServer#logging_role}.'''
        result = self._values.get("logging_role")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def post_authentication_login_banner(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#post_authentication_login_banner TransferServer#post_authentication_login_banner}.'''
        result = self._values.get("post_authentication_login_banner")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def pre_authentication_login_banner(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#pre_authentication_login_banner TransferServer#pre_authentication_login_banner}.'''
        result = self._values.get("pre_authentication_login_banner")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def protocol_details(self) -> typing.Optional["TransferServerProtocolDetails"]:
        '''protocol_details block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocol_details TransferServer#protocol_details}
        '''
        result = self._values.get("protocol_details")
        return typing.cast(typing.Optional["TransferServerProtocolDetails"], result)

    @builtins.property
    def protocols(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#protocols TransferServer#protocols}.'''
        result = self._values.get("protocols")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def s3_storage_options(self) -> typing.Optional["TransferServerS3StorageOptions"]:
        '''s3_storage_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#s3_storage_options TransferServer#s3_storage_options}
        '''
        result = self._values.get("s3_storage_options")
        return typing.cast(typing.Optional["TransferServerS3StorageOptions"], result)

    @builtins.property
    def security_policy_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#security_policy_name TransferServer#security_policy_name}.'''
        result = self._values.get("security_policy_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def sftp_authentication_methods(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#sftp_authentication_methods TransferServer#sftp_authentication_methods}.'''
        result = self._values.get("sftp_authentication_methods")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def structured_log_destinations(self) -> typing.Optional[typing.List[builtins.str]]:
        '''This is a set of arns of destinations that will receive structured logs from the transfer server.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#structured_log_destinations TransferServer#structured_log_destinations}
        '''
        result = self._values.get("structured_log_destinations")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags TransferServer#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tags_all TransferServer#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def url(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#url TransferServer#url}.'''
        result = self._values.get("url")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def workflow_details(self) -> typing.Optional["TransferServerWorkflowDetails"]:
        '''workflow_details block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_details TransferServer#workflow_details}
        '''
        result = self._values.get("workflow_details")
        return typing.cast(typing.Optional["TransferServerWorkflowDetails"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TransferServerConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.transferServer.TransferServerEndpointDetails",
    jsii_struct_bases=[],
    name_mapping={
        "address_allocation_ids": "addressAllocationIds",
        "security_group_ids": "securityGroupIds",
        "subnet_ids": "subnetIds",
        "vpc_endpoint_id": "vpcEndpointId",
        "vpc_id": "vpcId",
    },
)
class TransferServerEndpointDetails:
    def __init__(
        self,
        *,
        address_allocation_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        security_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        subnet_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        vpc_endpoint_id: typing.Optional[builtins.str] = None,
        vpc_id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param address_allocation_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#address_allocation_ids TransferServer#address_allocation_ids}.
        :param security_group_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#security_group_ids TransferServer#security_group_ids}.
        :param subnet_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#subnet_ids TransferServer#subnet_ids}.
        :param vpc_endpoint_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#vpc_endpoint_id TransferServer#vpc_endpoint_id}.
        :param vpc_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#vpc_id TransferServer#vpc_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8e152cd245b09ddaaeda42511a97c6a8552da1cd366cb028841d29eadb52ca08)
            check_type(argname="argument address_allocation_ids", value=address_allocation_ids, expected_type=type_hints["address_allocation_ids"])
            check_type(argname="argument security_group_ids", value=security_group_ids, expected_type=type_hints["security_group_ids"])
            check_type(argname="argument subnet_ids", value=subnet_ids, expected_type=type_hints["subnet_ids"])
            check_type(argname="argument vpc_endpoint_id", value=vpc_endpoint_id, expected_type=type_hints["vpc_endpoint_id"])
            check_type(argname="argument vpc_id", value=vpc_id, expected_type=type_hints["vpc_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if address_allocation_ids is not None:
            self._values["address_allocation_ids"] = address_allocation_ids
        if security_group_ids is not None:
            self._values["security_group_ids"] = security_group_ids
        if subnet_ids is not None:
            self._values["subnet_ids"] = subnet_ids
        if vpc_endpoint_id is not None:
            self._values["vpc_endpoint_id"] = vpc_endpoint_id
        if vpc_id is not None:
            self._values["vpc_id"] = vpc_id

    @builtins.property
    def address_allocation_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#address_allocation_ids TransferServer#address_allocation_ids}.'''
        result = self._values.get("address_allocation_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def security_group_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#security_group_ids TransferServer#security_group_ids}.'''
        result = self._values.get("security_group_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def subnet_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#subnet_ids TransferServer#subnet_ids}.'''
        result = self._values.get("subnet_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def vpc_endpoint_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#vpc_endpoint_id TransferServer#vpc_endpoint_id}.'''
        result = self._values.get("vpc_endpoint_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def vpc_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#vpc_id TransferServer#vpc_id}.'''
        result = self._values.get("vpc_id")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TransferServerEndpointDetails(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TransferServerEndpointDetailsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.transferServer.TransferServerEndpointDetailsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dea3e9dafdcad8d56fd61145ae854129a33ded09e49ebbf677f7e8feb4412e05)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAddressAllocationIds")
    def reset_address_allocation_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAddressAllocationIds", []))

    @jsii.member(jsii_name="resetSecurityGroupIds")
    def reset_security_group_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSecurityGroupIds", []))

    @jsii.member(jsii_name="resetSubnetIds")
    def reset_subnet_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSubnetIds", []))

    @jsii.member(jsii_name="resetVpcEndpointId")
    def reset_vpc_endpoint_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVpcEndpointId", []))

    @jsii.member(jsii_name="resetVpcId")
    def reset_vpc_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVpcId", []))

    @builtins.property
    @jsii.member(jsii_name="addressAllocationIdsInput")
    def address_allocation_ids_input(
        self,
    ) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "addressAllocationIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="securityGroupIdsInput")
    def security_group_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "securityGroupIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="subnetIdsInput")
    def subnet_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "subnetIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="vpcEndpointIdInput")
    def vpc_endpoint_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "vpcEndpointIdInput"))

    @builtins.property
    @jsii.member(jsii_name="vpcIdInput")
    def vpc_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "vpcIdInput"))

    @builtins.property
    @jsii.member(jsii_name="addressAllocationIds")
    def address_allocation_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "addressAllocationIds"))

    @address_allocation_ids.setter
    def address_allocation_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9c75b6995eef2b769cc2060f517fe551af8ef23cc72db0a505ec52afe6917774)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "addressAllocationIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="securityGroupIds")
    def security_group_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "securityGroupIds"))

    @security_group_ids.setter
    def security_group_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c85cbc350a58fde26ecf5f5230a0d55d42addfb5c33629a45a05a7560164a8cb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "securityGroupIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="subnetIds")
    def subnet_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "subnetIds"))

    @subnet_ids.setter
    def subnet_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__33a97f90dd8b98a97560d4c534f2e35e82afd3595f37f199dfc6b8e0f719a7fd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "subnetIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="vpcEndpointId")
    def vpc_endpoint_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vpcEndpointId"))

    @vpc_endpoint_id.setter
    def vpc_endpoint_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7c4f9d3772bd976a2399e3b0250ec806af4f67528bdf2bdb255b171d4b8ee197)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "vpcEndpointId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="vpcId")
    def vpc_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vpcId"))

    @vpc_id.setter
    def vpc_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__79668289516424f01eade959f15fe51fe0748e571c2bfd1f97e6c2b28aff608d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "vpcId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[TransferServerEndpointDetails]:
        return typing.cast(typing.Optional[TransferServerEndpointDetails], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[TransferServerEndpointDetails],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b8e050a91675a407c9dbc5b66e02b6b25c9970466d4e8361c2f5220002b6b338)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.transferServer.TransferServerProtocolDetails",
    jsii_struct_bases=[],
    name_mapping={
        "as2_transports": "as2Transports",
        "passive_ip": "passiveIp",
        "set_stat_option": "setStatOption",
        "tls_session_resumption_mode": "tlsSessionResumptionMode",
    },
)
class TransferServerProtocolDetails:
    def __init__(
        self,
        *,
        as2_transports: typing.Optional[typing.Sequence[builtins.str]] = None,
        passive_ip: typing.Optional[builtins.str] = None,
        set_stat_option: typing.Optional[builtins.str] = None,
        tls_session_resumption_mode: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param as2_transports: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#as2_transports TransferServer#as2_transports}.
        :param passive_ip: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#passive_ip TransferServer#passive_ip}.
        :param set_stat_option: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#set_stat_option TransferServer#set_stat_option}.
        :param tls_session_resumption_mode: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tls_session_resumption_mode TransferServer#tls_session_resumption_mode}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f74c4fa09094b6fc4eaf171cf45fc7a2bb195d804ad1e3cb2956a11b9dc15973)
            check_type(argname="argument as2_transports", value=as2_transports, expected_type=type_hints["as2_transports"])
            check_type(argname="argument passive_ip", value=passive_ip, expected_type=type_hints["passive_ip"])
            check_type(argname="argument set_stat_option", value=set_stat_option, expected_type=type_hints["set_stat_option"])
            check_type(argname="argument tls_session_resumption_mode", value=tls_session_resumption_mode, expected_type=type_hints["tls_session_resumption_mode"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if as2_transports is not None:
            self._values["as2_transports"] = as2_transports
        if passive_ip is not None:
            self._values["passive_ip"] = passive_ip
        if set_stat_option is not None:
            self._values["set_stat_option"] = set_stat_option
        if tls_session_resumption_mode is not None:
            self._values["tls_session_resumption_mode"] = tls_session_resumption_mode

    @builtins.property
    def as2_transports(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#as2_transports TransferServer#as2_transports}.'''
        result = self._values.get("as2_transports")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def passive_ip(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#passive_ip TransferServer#passive_ip}.'''
        result = self._values.get("passive_ip")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def set_stat_option(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#set_stat_option TransferServer#set_stat_option}.'''
        result = self._values.get("set_stat_option")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tls_session_resumption_mode(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tls_session_resumption_mode TransferServer#tls_session_resumption_mode}.'''
        result = self._values.get("tls_session_resumption_mode")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TransferServerProtocolDetails(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TransferServerProtocolDetailsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.transferServer.TransferServerProtocolDetailsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__908255d8b9aa46ee4b3f5a0909399f3f8c910f22bf04440c946c15f94c52de82)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetAs2Transports")
    def reset_as2_transports(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAs2Transports", []))

    @jsii.member(jsii_name="resetPassiveIp")
    def reset_passive_ip(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPassiveIp", []))

    @jsii.member(jsii_name="resetSetStatOption")
    def reset_set_stat_option(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSetStatOption", []))

    @jsii.member(jsii_name="resetTlsSessionResumptionMode")
    def reset_tls_session_resumption_mode(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTlsSessionResumptionMode", []))

    @builtins.property
    @jsii.member(jsii_name="as2TransportsInput")
    def as2_transports_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "as2TransportsInput"))

    @builtins.property
    @jsii.member(jsii_name="passiveIpInput")
    def passive_ip_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "passiveIpInput"))

    @builtins.property
    @jsii.member(jsii_name="setStatOptionInput")
    def set_stat_option_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "setStatOptionInput"))

    @builtins.property
    @jsii.member(jsii_name="tlsSessionResumptionModeInput")
    def tls_session_resumption_mode_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "tlsSessionResumptionModeInput"))

    @builtins.property
    @jsii.member(jsii_name="as2Transports")
    def as2_transports(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "as2Transports"))

    @as2_transports.setter
    def as2_transports(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__80797cf20619c4850373ca3a71c885cc1a6ada2dc428294b0135ed7853cb79e8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "as2Transports", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="passiveIp")
    def passive_ip(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "passiveIp"))

    @passive_ip.setter
    def passive_ip(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b1807f55252e14ada86017a754b4a226c639fdc98c2f18dce7ac99284eee36a2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "passiveIp", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="setStatOption")
    def set_stat_option(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "setStatOption"))

    @set_stat_option.setter
    def set_stat_option(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__038c8c3893747e04d09adb01c2f0332e831c39617ceecd505c84826491f389fa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "setStatOption", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tlsSessionResumptionMode")
    def tls_session_resumption_mode(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tlsSessionResumptionMode"))

    @tls_session_resumption_mode.setter
    def tls_session_resumption_mode(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__92859bb41972e6ab7ba6232b93d9fd0362927ef75ceeefad93726562d44d5293)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tlsSessionResumptionMode", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[TransferServerProtocolDetails]:
        return typing.cast(typing.Optional[TransferServerProtocolDetails], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[TransferServerProtocolDetails],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd6929aa4ebb9cae9da75f2f4cf1b2d4b1db47087ea1be361e5628bf34dbfe57)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.transferServer.TransferServerS3StorageOptions",
    jsii_struct_bases=[],
    name_mapping={"directory_listing_optimization": "directoryListingOptimization"},
)
class TransferServerS3StorageOptions:
    def __init__(
        self,
        *,
        directory_listing_optimization: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param directory_listing_optimization: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#directory_listing_optimization TransferServer#directory_listing_optimization}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__57e58dbe9bf9e46a5af6527bd814d67b052f881965b38b3e4bb5dc471f97ef03)
            check_type(argname="argument directory_listing_optimization", value=directory_listing_optimization, expected_type=type_hints["directory_listing_optimization"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if directory_listing_optimization is not None:
            self._values["directory_listing_optimization"] = directory_listing_optimization

    @builtins.property
    def directory_listing_optimization(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#directory_listing_optimization TransferServer#directory_listing_optimization}.'''
        result = self._values.get("directory_listing_optimization")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TransferServerS3StorageOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TransferServerS3StorageOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.transferServer.TransferServerS3StorageOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9542614f1d8730fc3efa3db667a8398cd5d302b46a03d14bcfd0211185c6a412)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetDirectoryListingOptimization")
    def reset_directory_listing_optimization(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDirectoryListingOptimization", []))

    @builtins.property
    @jsii.member(jsii_name="directoryListingOptimizationInput")
    def directory_listing_optimization_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "directoryListingOptimizationInput"))

    @builtins.property
    @jsii.member(jsii_name="directoryListingOptimization")
    def directory_listing_optimization(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "directoryListingOptimization"))

    @directory_listing_optimization.setter
    def directory_listing_optimization(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4a4d67fae2e5cc877dc164d8c9d2af5f6b35674aaac9cd66a63a84545e829b43)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "directoryListingOptimization", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[TransferServerS3StorageOptions]:
        return typing.cast(typing.Optional[TransferServerS3StorageOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[TransferServerS3StorageOptions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99a279055e6b5375e8ac956fd3193635688e79c969290f22d35510962e727de0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.transferServer.TransferServerWorkflowDetails",
    jsii_struct_bases=[],
    name_mapping={"on_partial_upload": "onPartialUpload", "on_upload": "onUpload"},
)
class TransferServerWorkflowDetails:
    def __init__(
        self,
        *,
        on_partial_upload: typing.Optional[typing.Union["TransferServerWorkflowDetailsOnPartialUpload", typing.Dict[builtins.str, typing.Any]]] = None,
        on_upload: typing.Optional[typing.Union["TransferServerWorkflowDetailsOnUpload", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param on_partial_upload: on_partial_upload block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#on_partial_upload TransferServer#on_partial_upload}
        :param on_upload: on_upload block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#on_upload TransferServer#on_upload}
        '''
        if isinstance(on_partial_upload, dict):
            on_partial_upload = TransferServerWorkflowDetailsOnPartialUpload(**on_partial_upload)
        if isinstance(on_upload, dict):
            on_upload = TransferServerWorkflowDetailsOnUpload(**on_upload)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__55e5fed43e6faf9edb958f545a5b1a9bba07e3019c1b51a332099e1eac676700)
            check_type(argname="argument on_partial_upload", value=on_partial_upload, expected_type=type_hints["on_partial_upload"])
            check_type(argname="argument on_upload", value=on_upload, expected_type=type_hints["on_upload"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if on_partial_upload is not None:
            self._values["on_partial_upload"] = on_partial_upload
        if on_upload is not None:
            self._values["on_upload"] = on_upload

    @builtins.property
    def on_partial_upload(
        self,
    ) -> typing.Optional["TransferServerWorkflowDetailsOnPartialUpload"]:
        '''on_partial_upload block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#on_partial_upload TransferServer#on_partial_upload}
        '''
        result = self._values.get("on_partial_upload")
        return typing.cast(typing.Optional["TransferServerWorkflowDetailsOnPartialUpload"], result)

    @builtins.property
    def on_upload(self) -> typing.Optional["TransferServerWorkflowDetailsOnUpload"]:
        '''on_upload block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#on_upload TransferServer#on_upload}
        '''
        result = self._values.get("on_upload")
        return typing.cast(typing.Optional["TransferServerWorkflowDetailsOnUpload"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TransferServerWorkflowDetails(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.transferServer.TransferServerWorkflowDetailsOnPartialUpload",
    jsii_struct_bases=[],
    name_mapping={"execution_role": "executionRole", "workflow_id": "workflowId"},
)
class TransferServerWorkflowDetailsOnPartialUpload:
    def __init__(
        self,
        *,
        execution_role: builtins.str,
        workflow_id: builtins.str,
    ) -> None:
        '''
        :param execution_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#execution_role TransferServer#execution_role}.
        :param workflow_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_id TransferServer#workflow_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c5b3af2780d6e4c96ddfe47b13317b884aa383d4325a171ecd23f448a966c355)
            check_type(argname="argument execution_role", value=execution_role, expected_type=type_hints["execution_role"])
            check_type(argname="argument workflow_id", value=workflow_id, expected_type=type_hints["workflow_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "execution_role": execution_role,
            "workflow_id": workflow_id,
        }

    @builtins.property
    def execution_role(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#execution_role TransferServer#execution_role}.'''
        result = self._values.get("execution_role")
        assert result is not None, "Required property 'execution_role' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def workflow_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_id TransferServer#workflow_id}.'''
        result = self._values.get("workflow_id")
        assert result is not None, "Required property 'workflow_id' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TransferServerWorkflowDetailsOnPartialUpload(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TransferServerWorkflowDetailsOnPartialUploadOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.transferServer.TransferServerWorkflowDetailsOnPartialUploadOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__02434edeab6b5910a9be3a9f9c4af372ec39128ababb44381f4bb408c5e05e7c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="executionRoleInput")
    def execution_role_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "executionRoleInput"))

    @builtins.property
    @jsii.member(jsii_name="workflowIdInput")
    def workflow_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "workflowIdInput"))

    @builtins.property
    @jsii.member(jsii_name="executionRole")
    def execution_role(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "executionRole"))

    @execution_role.setter
    def execution_role(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a755c1c63352387e64fac5bee10069108995d2ce48de54569b31874c4be671c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "executionRole", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="workflowId")
    def workflow_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "workflowId"))

    @workflow_id.setter
    def workflow_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__78f4b5eae9aa1d2cb505a7e9cda473401ad091dd6c81106ace95bc4ff80f0830)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "workflowId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[TransferServerWorkflowDetailsOnPartialUpload]:
        return typing.cast(typing.Optional[TransferServerWorkflowDetailsOnPartialUpload], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[TransferServerWorkflowDetailsOnPartialUpload],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__93f52fcca1618c5709befdd3a98bebe9bcf9bcab8c4705f05189d9e916745de4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.transferServer.TransferServerWorkflowDetailsOnUpload",
    jsii_struct_bases=[],
    name_mapping={"execution_role": "executionRole", "workflow_id": "workflowId"},
)
class TransferServerWorkflowDetailsOnUpload:
    def __init__(
        self,
        *,
        execution_role: builtins.str,
        workflow_id: builtins.str,
    ) -> None:
        '''
        :param execution_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#execution_role TransferServer#execution_role}.
        :param workflow_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_id TransferServer#workflow_id}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ef9773763529824c49362ac4be8bc4998c50e0988cdd62560b91d1ac5b54d659)
            check_type(argname="argument execution_role", value=execution_role, expected_type=type_hints["execution_role"])
            check_type(argname="argument workflow_id", value=workflow_id, expected_type=type_hints["workflow_id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "execution_role": execution_role,
            "workflow_id": workflow_id,
        }

    @builtins.property
    def execution_role(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#execution_role TransferServer#execution_role}.'''
        result = self._values.get("execution_role")
        assert result is not None, "Required property 'execution_role' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def workflow_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_id TransferServer#workflow_id}.'''
        result = self._values.get("workflow_id")
        assert result is not None, "Required property 'workflow_id' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "TransferServerWorkflowDetailsOnUpload(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class TransferServerWorkflowDetailsOnUploadOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.transferServer.TransferServerWorkflowDetailsOnUploadOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__6f46a94d9cf170f87fa2ea4b15d940a102d8b6d429bf771084c24b75673743c2)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="executionRoleInput")
    def execution_role_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "executionRoleInput"))

    @builtins.property
    @jsii.member(jsii_name="workflowIdInput")
    def workflow_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "workflowIdInput"))

    @builtins.property
    @jsii.member(jsii_name="executionRole")
    def execution_role(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "executionRole"))

    @execution_role.setter
    def execution_role(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0f547e5df0ea260a9d596d50449cd4d684dd2dbbf39ee122d36596e23b9adc14)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "executionRole", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="workflowId")
    def workflow_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "workflowId"))

    @workflow_id.setter
    def workflow_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__14a34b291317f4582959657002f762290d7bbaef13fa981ac4e1231649c7b499)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "workflowId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[TransferServerWorkflowDetailsOnUpload]:
        return typing.cast(typing.Optional[TransferServerWorkflowDetailsOnUpload], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[TransferServerWorkflowDetailsOnUpload],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__686e158bc9891824a287082124f4091e83f36348dd1ced572c47b15ea223aac3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class TransferServerWorkflowDetailsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.transferServer.TransferServerWorkflowDetailsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__e269d91365c669603160438fe0f4576f5ade40b1ab02a527e9a436485812aea0)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putOnPartialUpload")
    def put_on_partial_upload(
        self,
        *,
        execution_role: builtins.str,
        workflow_id: builtins.str,
    ) -> None:
        '''
        :param execution_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#execution_role TransferServer#execution_role}.
        :param workflow_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_id TransferServer#workflow_id}.
        '''
        value = TransferServerWorkflowDetailsOnPartialUpload(
            execution_role=execution_role, workflow_id=workflow_id
        )

        return typing.cast(None, jsii.invoke(self, "putOnPartialUpload", [value]))

    @jsii.member(jsii_name="putOnUpload")
    def put_on_upload(
        self,
        *,
        execution_role: builtins.str,
        workflow_id: builtins.str,
    ) -> None:
        '''
        :param execution_role: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#execution_role TransferServer#execution_role}.
        :param workflow_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_id TransferServer#workflow_id}.
        '''
        value = TransferServerWorkflowDetailsOnUpload(
            execution_role=execution_role, workflow_id=workflow_id
        )

        return typing.cast(None, jsii.invoke(self, "putOnUpload", [value]))

    @jsii.member(jsii_name="resetOnPartialUpload")
    def reset_on_partial_upload(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnPartialUpload", []))

    @jsii.member(jsii_name="resetOnUpload")
    def reset_on_upload(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOnUpload", []))

    @builtins.property
    @jsii.member(jsii_name="onPartialUpload")
    def on_partial_upload(
        self,
    ) -> TransferServerWorkflowDetailsOnPartialUploadOutputReference:
        return typing.cast(TransferServerWorkflowDetailsOnPartialUploadOutputReference, jsii.get(self, "onPartialUpload"))

    @builtins.property
    @jsii.member(jsii_name="onUpload")
    def on_upload(self) -> TransferServerWorkflowDetailsOnUploadOutputReference:
        return typing.cast(TransferServerWorkflowDetailsOnUploadOutputReference, jsii.get(self, "onUpload"))

    @builtins.property
    @jsii.member(jsii_name="onPartialUploadInput")
    def on_partial_upload_input(
        self,
    ) -> typing.Optional[TransferServerWorkflowDetailsOnPartialUpload]:
        return typing.cast(typing.Optional[TransferServerWorkflowDetailsOnPartialUpload], jsii.get(self, "onPartialUploadInput"))

    @builtins.property
    @jsii.member(jsii_name="onUploadInput")
    def on_upload_input(self) -> typing.Optional[TransferServerWorkflowDetailsOnUpload]:
        return typing.cast(typing.Optional[TransferServerWorkflowDetailsOnUpload], jsii.get(self, "onUploadInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[TransferServerWorkflowDetails]:
        return typing.cast(typing.Optional[TransferServerWorkflowDetails], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[TransferServerWorkflowDetails],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a216c1cb623f88b7c9416020ccc881cfa0522e2e439bf24da5de6f5be3c37c8a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "TransferServer",
    "TransferServerConfig",
    "TransferServerEndpointDetails",
    "TransferServerEndpointDetailsOutputReference",
    "TransferServerProtocolDetails",
    "TransferServerProtocolDetailsOutputReference",
    "TransferServerS3StorageOptions",
    "TransferServerS3StorageOptionsOutputReference",
    "TransferServerWorkflowDetails",
    "TransferServerWorkflowDetailsOnPartialUpload",
    "TransferServerWorkflowDetailsOnPartialUploadOutputReference",
    "TransferServerWorkflowDetailsOnUpload",
    "TransferServerWorkflowDetailsOnUploadOutputReference",
    "TransferServerWorkflowDetailsOutputReference",
]

publication.publish()

def _typecheckingstub__0024520c352801117f2df46409b230c52dd66538593f5afcdae01292d7e1989c(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    certificate: typing.Optional[builtins.str] = None,
    directory_id: typing.Optional[builtins.str] = None,
    domain: typing.Optional[builtins.str] = None,
    endpoint_details: typing.Optional[typing.Union[TransferServerEndpointDetails, typing.Dict[builtins.str, typing.Any]]] = None,
    endpoint_type: typing.Optional[builtins.str] = None,
    force_destroy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    function: typing.Optional[builtins.str] = None,
    host_key: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    identity_provider_type: typing.Optional[builtins.str] = None,
    invocation_role: typing.Optional[builtins.str] = None,
    logging_role: typing.Optional[builtins.str] = None,
    post_authentication_login_banner: typing.Optional[builtins.str] = None,
    pre_authentication_login_banner: typing.Optional[builtins.str] = None,
    protocol_details: typing.Optional[typing.Union[TransferServerProtocolDetails, typing.Dict[builtins.str, typing.Any]]] = None,
    protocols: typing.Optional[typing.Sequence[builtins.str]] = None,
    s3_storage_options: typing.Optional[typing.Union[TransferServerS3StorageOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    security_policy_name: typing.Optional[builtins.str] = None,
    sftp_authentication_methods: typing.Optional[builtins.str] = None,
    structured_log_destinations: typing.Optional[typing.Sequence[builtins.str]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    url: typing.Optional[builtins.str] = None,
    workflow_details: typing.Optional[typing.Union[TransferServerWorkflowDetails, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__ac7446d0b7099af8e470a9b1a931f73cb2546ef023d2741e012e242cd27ec974(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c35fbfc440f9472c92b18ff9e3bbe8e032c5f585affb951ddf87948d1244864d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef66fcbb7a68ed64c6fa916a8349130757c8ceb57863f35622ceec7d8171888e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37ac579952a25a072fa2e13dd6d92ca40bd0471e30f10accda757ec55cf76019(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9a008acf9549d96f05c3ddeb4d1cfff5995f96e0677bafe04550a27d4ab6baa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__32e484596c25776d0bde52e64b82441006bccd4558346d14e71552db4a7045a0(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__86823cb9efa3963a47cb10169f16b59f72fb401499332b22901932e613b5fafc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a22cef45897dedb16090932ccf582177dad5041c5e8922002015e6901b5d993a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__677c1694cda6011f90ddb90e9da44aa8a5f7e608e5baf55db7ae3d40e2f88860(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c5a465c96d3034f517f9fe37dab9305d41b9a6f4d7e1084822c19b82aa3f3f2b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2de98821e7bb02567142420ed2f707ba91eb8788570bd40188fa6f30bf641c55(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__46227a4f24aeb714aea7a9c4a22bde9a159ecd5117f7a5a4e7c46e61e1314694(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f63d09f91a8f890c55f458e7b489aba4e22874159e47d38f5dbed0f85f3d03a(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bb46670495dbc2aec5e2fe7ec3f5c5ce70cde86f3fb7217cab2032646c0cd644(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d3bf96c03ed03be39c362e79a6b3518593af99b24cfc19c2b5ef5efdd78fc402(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b998c38e8738a443ccc03e9504346cf6cfdb9483cfba4bfdff4c58c013ab6e2f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__62d6caf8550778b7defa3a2527f9dfd16033a109efaba243062af3735eaf32f6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5944fa4625c6456434762b6e4e120d40c559e45733051228760342efe321616b(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__689e15b5cf7dc30688ebb54cc5aa107422728925031f54be261b6c4acf40ade7(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8a32bd1244a133b2188163931b7fcafd098a0c3dfbdc6259ab9a5e6054f167d4(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__390dd44adf73e9bc61fe134cc8430a3648753c3408b9dcd1f7ccb51d1e47e76b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__413416edb513f65ad0a5bc2e76ffaa926720209cc0a76e7046d72cc90f76318e(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    certificate: typing.Optional[builtins.str] = None,
    directory_id: typing.Optional[builtins.str] = None,
    domain: typing.Optional[builtins.str] = None,
    endpoint_details: typing.Optional[typing.Union[TransferServerEndpointDetails, typing.Dict[builtins.str, typing.Any]]] = None,
    endpoint_type: typing.Optional[builtins.str] = None,
    force_destroy: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    function: typing.Optional[builtins.str] = None,
    host_key: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    identity_provider_type: typing.Optional[builtins.str] = None,
    invocation_role: typing.Optional[builtins.str] = None,
    logging_role: typing.Optional[builtins.str] = None,
    post_authentication_login_banner: typing.Optional[builtins.str] = None,
    pre_authentication_login_banner: typing.Optional[builtins.str] = None,
    protocol_details: typing.Optional[typing.Union[TransferServerProtocolDetails, typing.Dict[builtins.str, typing.Any]]] = None,
    protocols: typing.Optional[typing.Sequence[builtins.str]] = None,
    s3_storage_options: typing.Optional[typing.Union[TransferServerS3StorageOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    security_policy_name: typing.Optional[builtins.str] = None,
    sftp_authentication_methods: typing.Optional[builtins.str] = None,
    structured_log_destinations: typing.Optional[typing.Sequence[builtins.str]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    url: typing.Optional[builtins.str] = None,
    workflow_details: typing.Optional[typing.Union[TransferServerWorkflowDetails, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8e152cd245b09ddaaeda42511a97c6a8552da1cd366cb028841d29eadb52ca08(
    *,
    address_allocation_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    security_group_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    subnet_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    vpc_endpoint_id: typing.Optional[builtins.str] = None,
    vpc_id: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dea3e9dafdcad8d56fd61145ae854129a33ded09e49ebbf677f7e8feb4412e05(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9c75b6995eef2b769cc2060f517fe551af8ef23cc72db0a505ec52afe6917774(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c85cbc350a58fde26ecf5f5230a0d55d42addfb5c33629a45a05a7560164a8cb(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33a97f90dd8b98a97560d4c534f2e35e82afd3595f37f199dfc6b8e0f719a7fd(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7c4f9d3772bd976a2399e3b0250ec806af4f67528bdf2bdb255b171d4b8ee197(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__79668289516424f01eade959f15fe51fe0748e571c2bfd1f97e6c2b28aff608d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b8e050a91675a407c9dbc5b66e02b6b25c9970466d4e8361c2f5220002b6b338(
    value: typing.Optional[TransferServerEndpointDetails],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f74c4fa09094b6fc4eaf171cf45fc7a2bb195d804ad1e3cb2956a11b9dc15973(
    *,
    as2_transports: typing.Optional[typing.Sequence[builtins.str]] = None,
    passive_ip: typing.Optional[builtins.str] = None,
    set_stat_option: typing.Optional[builtins.str] = None,
    tls_session_resumption_mode: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__908255d8b9aa46ee4b3f5a0909399f3f8c910f22bf04440c946c15f94c52de82(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__80797cf20619c4850373ca3a71c885cc1a6ada2dc428294b0135ed7853cb79e8(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b1807f55252e14ada86017a754b4a226c639fdc98c2f18dce7ac99284eee36a2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__038c8c3893747e04d09adb01c2f0332e831c39617ceecd505c84826491f389fa(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__92859bb41972e6ab7ba6232b93d9fd0362927ef75ceeefad93726562d44d5293(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd6929aa4ebb9cae9da75f2f4cf1b2d4b1db47087ea1be361e5628bf34dbfe57(
    value: typing.Optional[TransferServerProtocolDetails],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__57e58dbe9bf9e46a5af6527bd814d67b052f881965b38b3e4bb5dc471f97ef03(
    *,
    directory_listing_optimization: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9542614f1d8730fc3efa3db667a8398cd5d302b46a03d14bcfd0211185c6a412(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4a4d67fae2e5cc877dc164d8c9d2af5f6b35674aaac9cd66a63a84545e829b43(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99a279055e6b5375e8ac956fd3193635688e79c969290f22d35510962e727de0(
    value: typing.Optional[TransferServerS3StorageOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__55e5fed43e6faf9edb958f545a5b1a9bba07e3019c1b51a332099e1eac676700(
    *,
    on_partial_upload: typing.Optional[typing.Union[TransferServerWorkflowDetailsOnPartialUpload, typing.Dict[builtins.str, typing.Any]]] = None,
    on_upload: typing.Optional[typing.Union[TransferServerWorkflowDetailsOnUpload, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c5b3af2780d6e4c96ddfe47b13317b884aa383d4325a171ecd23f448a966c355(
    *,
    execution_role: builtins.str,
    workflow_id: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02434edeab6b5910a9be3a9f9c4af372ec39128ababb44381f4bb408c5e05e7c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a755c1c63352387e64fac5bee10069108995d2ce48de54569b31874c4be671c(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__78f4b5eae9aa1d2cb505a7e9cda473401ad091dd6c81106ace95bc4ff80f0830(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93f52fcca1618c5709befdd3a98bebe9bcf9bcab8c4705f05189d9e916745de4(
    value: typing.Optional[TransferServerWorkflowDetailsOnPartialUpload],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ef9773763529824c49362ac4be8bc4998c50e0988cdd62560b91d1ac5b54d659(
    *,
    execution_role: builtins.str,
    workflow_id: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6f46a94d9cf170f87fa2ea4b15d940a102d8b6d429bf771084c24b75673743c2(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0f547e5df0ea260a9d596d50449cd4d684dd2dbbf39ee122d36596e23b9adc14(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__14a34b291317f4582959657002f762290d7bbaef13fa981ac4e1231649c7b499(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__686e158bc9891824a287082124f4091e83f36348dd1ced572c47b15ea223aac3(
    value: typing.Optional[TransferServerWorkflowDetailsOnUpload],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e269d91365c669603160438fe0f4576f5ade40b1ab02a527e9a436485812aea0(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a216c1cb623f88b7c9416020ccc881cfa0522e2e439bf24da5de6f5be3c37c8a(
    value: typing.Optional[TransferServerWorkflowDetails],
) -> None:
    """Type checking stubs"""
    pass
