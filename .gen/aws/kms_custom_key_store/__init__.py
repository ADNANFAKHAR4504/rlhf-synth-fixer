r'''
# `aws_kms_custom_key_store`

Refer to the Terraform Registry for docs: [`aws_kms_custom_key_store`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store).
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


class KmsCustomKeyStore(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.kmsCustomKeyStore.KmsCustomKeyStore",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store aws_kms_custom_key_store}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        custom_key_store_name: builtins.str,
        cloud_hsm_cluster_id: typing.Optional[builtins.str] = None,
        custom_key_store_type: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        key_store_password: typing.Optional[builtins.str] = None,
        timeouts: typing.Optional[typing.Union["KmsCustomKeyStoreTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        trust_anchor_certificate: typing.Optional[builtins.str] = None,
        xks_proxy_authentication_credential: typing.Optional[typing.Union["KmsCustomKeyStoreXksProxyAuthenticationCredential", typing.Dict[builtins.str, typing.Any]]] = None,
        xks_proxy_connectivity: typing.Optional[builtins.str] = None,
        xks_proxy_uri_endpoint: typing.Optional[builtins.str] = None,
        xks_proxy_uri_path: typing.Optional[builtins.str] = None,
        xks_proxy_vpc_endpoint_service_name: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store aws_kms_custom_key_store} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param custom_key_store_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_name KmsCustomKeyStore#custom_key_store_name}.
        :param cloud_hsm_cluster_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#cloud_hsm_cluster_id KmsCustomKeyStore#cloud_hsm_cluster_id}.
        :param custom_key_store_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_type KmsCustomKeyStore#custom_key_store_type}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#id KmsCustomKeyStore#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param key_store_password: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#key_store_password KmsCustomKeyStore#key_store_password}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#timeouts KmsCustomKeyStore#timeouts}
        :param trust_anchor_certificate: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#trust_anchor_certificate KmsCustomKeyStore#trust_anchor_certificate}.
        :param xks_proxy_authentication_credential: xks_proxy_authentication_credential block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_authentication_credential KmsCustomKeyStore#xks_proxy_authentication_credential}
        :param xks_proxy_connectivity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_connectivity KmsCustomKeyStore#xks_proxy_connectivity}.
        :param xks_proxy_uri_endpoint: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_endpoint KmsCustomKeyStore#xks_proxy_uri_endpoint}.
        :param xks_proxy_uri_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_path KmsCustomKeyStore#xks_proxy_uri_path}.
        :param xks_proxy_vpc_endpoint_service_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_vpc_endpoint_service_name KmsCustomKeyStore#xks_proxy_vpc_endpoint_service_name}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ca443ab7cfddc2fb8d615b26d827a179bf126fe8c2ae054e6259628c529fc2a6)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = KmsCustomKeyStoreConfig(
            custom_key_store_name=custom_key_store_name,
            cloud_hsm_cluster_id=cloud_hsm_cluster_id,
            custom_key_store_type=custom_key_store_type,
            id=id,
            key_store_password=key_store_password,
            timeouts=timeouts,
            trust_anchor_certificate=trust_anchor_certificate,
            xks_proxy_authentication_credential=xks_proxy_authentication_credential,
            xks_proxy_connectivity=xks_proxy_connectivity,
            xks_proxy_uri_endpoint=xks_proxy_uri_endpoint,
            xks_proxy_uri_path=xks_proxy_uri_path,
            xks_proxy_vpc_endpoint_service_name=xks_proxy_vpc_endpoint_service_name,
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
        '''Generates CDKTF code for importing a KmsCustomKeyStore resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the KmsCustomKeyStore to import.
        :param import_from_id: The id of the existing KmsCustomKeyStore that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the KmsCustomKeyStore to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6443a78913fa83d9e6758092640c06a999cb782d2e574825a1376b66d522de4f)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putTimeouts")
    def put_timeouts(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#create KmsCustomKeyStore#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#delete KmsCustomKeyStore#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#update KmsCustomKeyStore#update}.
        '''
        value = KmsCustomKeyStoreTimeouts(create=create, delete=delete, update=update)

        return typing.cast(None, jsii.invoke(self, "putTimeouts", [value]))

    @jsii.member(jsii_name="putXksProxyAuthenticationCredential")
    def put_xks_proxy_authentication_credential(
        self,
        *,
        access_key_id: builtins.str,
        raw_secret_access_key: builtins.str,
    ) -> None:
        '''
        :param access_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#access_key_id KmsCustomKeyStore#access_key_id}.
        :param raw_secret_access_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#raw_secret_access_key KmsCustomKeyStore#raw_secret_access_key}.
        '''
        value = KmsCustomKeyStoreXksProxyAuthenticationCredential(
            access_key_id=access_key_id, raw_secret_access_key=raw_secret_access_key
        )

        return typing.cast(None, jsii.invoke(self, "putXksProxyAuthenticationCredential", [value]))

    @jsii.member(jsii_name="resetCloudHsmClusterId")
    def reset_cloud_hsm_cluster_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCloudHsmClusterId", []))

    @jsii.member(jsii_name="resetCustomKeyStoreType")
    def reset_custom_key_store_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCustomKeyStoreType", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetKeyStorePassword")
    def reset_key_store_password(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetKeyStorePassword", []))

    @jsii.member(jsii_name="resetTimeouts")
    def reset_timeouts(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTimeouts", []))

    @jsii.member(jsii_name="resetTrustAnchorCertificate")
    def reset_trust_anchor_certificate(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTrustAnchorCertificate", []))

    @jsii.member(jsii_name="resetXksProxyAuthenticationCredential")
    def reset_xks_proxy_authentication_credential(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetXksProxyAuthenticationCredential", []))

    @jsii.member(jsii_name="resetXksProxyConnectivity")
    def reset_xks_proxy_connectivity(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetXksProxyConnectivity", []))

    @jsii.member(jsii_name="resetXksProxyUriEndpoint")
    def reset_xks_proxy_uri_endpoint(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetXksProxyUriEndpoint", []))

    @jsii.member(jsii_name="resetXksProxyUriPath")
    def reset_xks_proxy_uri_path(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetXksProxyUriPath", []))

    @jsii.member(jsii_name="resetXksProxyVpcEndpointServiceName")
    def reset_xks_proxy_vpc_endpoint_service_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetXksProxyVpcEndpointServiceName", []))

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
    @jsii.member(jsii_name="timeouts")
    def timeouts(self) -> "KmsCustomKeyStoreTimeoutsOutputReference":
        return typing.cast("KmsCustomKeyStoreTimeoutsOutputReference", jsii.get(self, "timeouts"))

    @builtins.property
    @jsii.member(jsii_name="xksProxyAuthenticationCredential")
    def xks_proxy_authentication_credential(
        self,
    ) -> "KmsCustomKeyStoreXksProxyAuthenticationCredentialOutputReference":
        return typing.cast("KmsCustomKeyStoreXksProxyAuthenticationCredentialOutputReference", jsii.get(self, "xksProxyAuthenticationCredential"))

    @builtins.property
    @jsii.member(jsii_name="cloudHsmClusterIdInput")
    def cloud_hsm_cluster_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "cloudHsmClusterIdInput"))

    @builtins.property
    @jsii.member(jsii_name="customKeyStoreNameInput")
    def custom_key_store_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "customKeyStoreNameInput"))

    @builtins.property
    @jsii.member(jsii_name="customKeyStoreTypeInput")
    def custom_key_store_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "customKeyStoreTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="keyStorePasswordInput")
    def key_store_password_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "keyStorePasswordInput"))

    @builtins.property
    @jsii.member(jsii_name="timeoutsInput")
    def timeouts_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "KmsCustomKeyStoreTimeouts"]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, "KmsCustomKeyStoreTimeouts"]], jsii.get(self, "timeoutsInput"))

    @builtins.property
    @jsii.member(jsii_name="trustAnchorCertificateInput")
    def trust_anchor_certificate_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "trustAnchorCertificateInput"))

    @builtins.property
    @jsii.member(jsii_name="xksProxyAuthenticationCredentialInput")
    def xks_proxy_authentication_credential_input(
        self,
    ) -> typing.Optional["KmsCustomKeyStoreXksProxyAuthenticationCredential"]:
        return typing.cast(typing.Optional["KmsCustomKeyStoreXksProxyAuthenticationCredential"], jsii.get(self, "xksProxyAuthenticationCredentialInput"))

    @builtins.property
    @jsii.member(jsii_name="xksProxyConnectivityInput")
    def xks_proxy_connectivity_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "xksProxyConnectivityInput"))

    @builtins.property
    @jsii.member(jsii_name="xksProxyUriEndpointInput")
    def xks_proxy_uri_endpoint_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "xksProxyUriEndpointInput"))

    @builtins.property
    @jsii.member(jsii_name="xksProxyUriPathInput")
    def xks_proxy_uri_path_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "xksProxyUriPathInput"))

    @builtins.property
    @jsii.member(jsii_name="xksProxyVpcEndpointServiceNameInput")
    def xks_proxy_vpc_endpoint_service_name_input(
        self,
    ) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "xksProxyVpcEndpointServiceNameInput"))

    @builtins.property
    @jsii.member(jsii_name="cloudHsmClusterId")
    def cloud_hsm_cluster_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "cloudHsmClusterId"))

    @cloud_hsm_cluster_id.setter
    def cloud_hsm_cluster_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__88f26f19b76430de82b59e8a21da9da0a21e87f08a87aefd092e4eaf2d972d7d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "cloudHsmClusterId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="customKeyStoreName")
    def custom_key_store_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "customKeyStoreName"))

    @custom_key_store_name.setter
    def custom_key_store_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__61e9e4981c263c88002d0b2b4d95efb98b4d87126904fee96793343515b608e3)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "customKeyStoreName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="customKeyStoreType")
    def custom_key_store_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "customKeyStoreType"))

    @custom_key_store_type.setter
    def custom_key_store_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fcceb165d621d7c4982f60f6418da4085377d891b94d599e7cb46d9580f06be6)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "customKeyStoreType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__53bc61e5a59d46cadef11354f727aada734ddf50d8eab07f7d897efebe56fe1d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="keyStorePassword")
    def key_store_password(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "keyStorePassword"))

    @key_store_password.setter
    def key_store_password(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0ae179274251c847a8e078b15355ea19f6aebae178bfab56c5083299ec516a24)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "keyStorePassword", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="trustAnchorCertificate")
    def trust_anchor_certificate(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "trustAnchorCertificate"))

    @trust_anchor_certificate.setter
    def trust_anchor_certificate(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aaffa1362bff99542931642ae7f078c2d5f0e83f7f4e50bb9ff2f8ae435a0c2d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "trustAnchorCertificate", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="xksProxyConnectivity")
    def xks_proxy_connectivity(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "xksProxyConnectivity"))

    @xks_proxy_connectivity.setter
    def xks_proxy_connectivity(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__056e0c95cc266f8b518496845579f67f66645eebc5f60cedd56fc52f54e3dd49)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "xksProxyConnectivity", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="xksProxyUriEndpoint")
    def xks_proxy_uri_endpoint(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "xksProxyUriEndpoint"))

    @xks_proxy_uri_endpoint.setter
    def xks_proxy_uri_endpoint(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5227cfc40cf767acb48ef0e7c5f79a78315a632fb78d42a82521574ce0a1812e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "xksProxyUriEndpoint", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="xksProxyUriPath")
    def xks_proxy_uri_path(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "xksProxyUriPath"))

    @xks_proxy_uri_path.setter
    def xks_proxy_uri_path(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__55f8c86f816f9344e464e91ade57269645f9e2283c33210e538f9101cff3e134)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "xksProxyUriPath", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="xksProxyVpcEndpointServiceName")
    def xks_proxy_vpc_endpoint_service_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "xksProxyVpcEndpointServiceName"))

    @xks_proxy_vpc_endpoint_service_name.setter
    def xks_proxy_vpc_endpoint_service_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3ef61ada6253fd396bd319da1f1e3b94d1551059304410963af789a9e8b9cba0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "xksProxyVpcEndpointServiceName", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.kmsCustomKeyStore.KmsCustomKeyStoreConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "custom_key_store_name": "customKeyStoreName",
        "cloud_hsm_cluster_id": "cloudHsmClusterId",
        "custom_key_store_type": "customKeyStoreType",
        "id": "id",
        "key_store_password": "keyStorePassword",
        "timeouts": "timeouts",
        "trust_anchor_certificate": "trustAnchorCertificate",
        "xks_proxy_authentication_credential": "xksProxyAuthenticationCredential",
        "xks_proxy_connectivity": "xksProxyConnectivity",
        "xks_proxy_uri_endpoint": "xksProxyUriEndpoint",
        "xks_proxy_uri_path": "xksProxyUriPath",
        "xks_proxy_vpc_endpoint_service_name": "xksProxyVpcEndpointServiceName",
    },
)
class KmsCustomKeyStoreConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        custom_key_store_name: builtins.str,
        cloud_hsm_cluster_id: typing.Optional[builtins.str] = None,
        custom_key_store_type: typing.Optional[builtins.str] = None,
        id: typing.Optional[builtins.str] = None,
        key_store_password: typing.Optional[builtins.str] = None,
        timeouts: typing.Optional[typing.Union["KmsCustomKeyStoreTimeouts", typing.Dict[builtins.str, typing.Any]]] = None,
        trust_anchor_certificate: typing.Optional[builtins.str] = None,
        xks_proxy_authentication_credential: typing.Optional[typing.Union["KmsCustomKeyStoreXksProxyAuthenticationCredential", typing.Dict[builtins.str, typing.Any]]] = None,
        xks_proxy_connectivity: typing.Optional[builtins.str] = None,
        xks_proxy_uri_endpoint: typing.Optional[builtins.str] = None,
        xks_proxy_uri_path: typing.Optional[builtins.str] = None,
        xks_proxy_vpc_endpoint_service_name: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param custom_key_store_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_name KmsCustomKeyStore#custom_key_store_name}.
        :param cloud_hsm_cluster_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#cloud_hsm_cluster_id KmsCustomKeyStore#cloud_hsm_cluster_id}.
        :param custom_key_store_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_type KmsCustomKeyStore#custom_key_store_type}.
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#id KmsCustomKeyStore#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param key_store_password: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#key_store_password KmsCustomKeyStore#key_store_password}.
        :param timeouts: timeouts block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#timeouts KmsCustomKeyStore#timeouts}
        :param trust_anchor_certificate: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#trust_anchor_certificate KmsCustomKeyStore#trust_anchor_certificate}.
        :param xks_proxy_authentication_credential: xks_proxy_authentication_credential block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_authentication_credential KmsCustomKeyStore#xks_proxy_authentication_credential}
        :param xks_proxy_connectivity: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_connectivity KmsCustomKeyStore#xks_proxy_connectivity}.
        :param xks_proxy_uri_endpoint: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_endpoint KmsCustomKeyStore#xks_proxy_uri_endpoint}.
        :param xks_proxy_uri_path: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_path KmsCustomKeyStore#xks_proxy_uri_path}.
        :param xks_proxy_vpc_endpoint_service_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_vpc_endpoint_service_name KmsCustomKeyStore#xks_proxy_vpc_endpoint_service_name}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(timeouts, dict):
            timeouts = KmsCustomKeyStoreTimeouts(**timeouts)
        if isinstance(xks_proxy_authentication_credential, dict):
            xks_proxy_authentication_credential = KmsCustomKeyStoreXksProxyAuthenticationCredential(**xks_proxy_authentication_credential)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__683336a392ed53c936cc126788a51f7bd67b5c12274b5ee4464c12d8ee583637)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument custom_key_store_name", value=custom_key_store_name, expected_type=type_hints["custom_key_store_name"])
            check_type(argname="argument cloud_hsm_cluster_id", value=cloud_hsm_cluster_id, expected_type=type_hints["cloud_hsm_cluster_id"])
            check_type(argname="argument custom_key_store_type", value=custom_key_store_type, expected_type=type_hints["custom_key_store_type"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument key_store_password", value=key_store_password, expected_type=type_hints["key_store_password"])
            check_type(argname="argument timeouts", value=timeouts, expected_type=type_hints["timeouts"])
            check_type(argname="argument trust_anchor_certificate", value=trust_anchor_certificate, expected_type=type_hints["trust_anchor_certificate"])
            check_type(argname="argument xks_proxy_authentication_credential", value=xks_proxy_authentication_credential, expected_type=type_hints["xks_proxy_authentication_credential"])
            check_type(argname="argument xks_proxy_connectivity", value=xks_proxy_connectivity, expected_type=type_hints["xks_proxy_connectivity"])
            check_type(argname="argument xks_proxy_uri_endpoint", value=xks_proxy_uri_endpoint, expected_type=type_hints["xks_proxy_uri_endpoint"])
            check_type(argname="argument xks_proxy_uri_path", value=xks_proxy_uri_path, expected_type=type_hints["xks_proxy_uri_path"])
            check_type(argname="argument xks_proxy_vpc_endpoint_service_name", value=xks_proxy_vpc_endpoint_service_name, expected_type=type_hints["xks_proxy_vpc_endpoint_service_name"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "custom_key_store_name": custom_key_store_name,
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
        if cloud_hsm_cluster_id is not None:
            self._values["cloud_hsm_cluster_id"] = cloud_hsm_cluster_id
        if custom_key_store_type is not None:
            self._values["custom_key_store_type"] = custom_key_store_type
        if id is not None:
            self._values["id"] = id
        if key_store_password is not None:
            self._values["key_store_password"] = key_store_password
        if timeouts is not None:
            self._values["timeouts"] = timeouts
        if trust_anchor_certificate is not None:
            self._values["trust_anchor_certificate"] = trust_anchor_certificate
        if xks_proxy_authentication_credential is not None:
            self._values["xks_proxy_authentication_credential"] = xks_proxy_authentication_credential
        if xks_proxy_connectivity is not None:
            self._values["xks_proxy_connectivity"] = xks_proxy_connectivity
        if xks_proxy_uri_endpoint is not None:
            self._values["xks_proxy_uri_endpoint"] = xks_proxy_uri_endpoint
        if xks_proxy_uri_path is not None:
            self._values["xks_proxy_uri_path"] = xks_proxy_uri_path
        if xks_proxy_vpc_endpoint_service_name is not None:
            self._values["xks_proxy_vpc_endpoint_service_name"] = xks_proxy_vpc_endpoint_service_name

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
    def custom_key_store_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_name KmsCustomKeyStore#custom_key_store_name}.'''
        result = self._values.get("custom_key_store_name")
        assert result is not None, "Required property 'custom_key_store_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def cloud_hsm_cluster_id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#cloud_hsm_cluster_id KmsCustomKeyStore#cloud_hsm_cluster_id}.'''
        result = self._values.get("cloud_hsm_cluster_id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def custom_key_store_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#custom_key_store_type KmsCustomKeyStore#custom_key_store_type}.'''
        result = self._values.get("custom_key_store_type")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#id KmsCustomKeyStore#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def key_store_password(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#key_store_password KmsCustomKeyStore#key_store_password}.'''
        result = self._values.get("key_store_password")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def timeouts(self) -> typing.Optional["KmsCustomKeyStoreTimeouts"]:
        '''timeouts block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#timeouts KmsCustomKeyStore#timeouts}
        '''
        result = self._values.get("timeouts")
        return typing.cast(typing.Optional["KmsCustomKeyStoreTimeouts"], result)

    @builtins.property
    def trust_anchor_certificate(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#trust_anchor_certificate KmsCustomKeyStore#trust_anchor_certificate}.'''
        result = self._values.get("trust_anchor_certificate")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def xks_proxy_authentication_credential(
        self,
    ) -> typing.Optional["KmsCustomKeyStoreXksProxyAuthenticationCredential"]:
        '''xks_proxy_authentication_credential block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_authentication_credential KmsCustomKeyStore#xks_proxy_authentication_credential}
        '''
        result = self._values.get("xks_proxy_authentication_credential")
        return typing.cast(typing.Optional["KmsCustomKeyStoreXksProxyAuthenticationCredential"], result)

    @builtins.property
    def xks_proxy_connectivity(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_connectivity KmsCustomKeyStore#xks_proxy_connectivity}.'''
        result = self._values.get("xks_proxy_connectivity")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def xks_proxy_uri_endpoint(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_endpoint KmsCustomKeyStore#xks_proxy_uri_endpoint}.'''
        result = self._values.get("xks_proxy_uri_endpoint")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def xks_proxy_uri_path(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_uri_path KmsCustomKeyStore#xks_proxy_uri_path}.'''
        result = self._values.get("xks_proxy_uri_path")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def xks_proxy_vpc_endpoint_service_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#xks_proxy_vpc_endpoint_service_name KmsCustomKeyStore#xks_proxy_vpc_endpoint_service_name}.'''
        result = self._values.get("xks_proxy_vpc_endpoint_service_name")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "KmsCustomKeyStoreConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.kmsCustomKeyStore.KmsCustomKeyStoreTimeouts",
    jsii_struct_bases=[],
    name_mapping={"create": "create", "delete": "delete", "update": "update"},
)
class KmsCustomKeyStoreTimeouts:
    def __init__(
        self,
        *,
        create: typing.Optional[builtins.str] = None,
        delete: typing.Optional[builtins.str] = None,
        update: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param create: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#create KmsCustomKeyStore#create}.
        :param delete: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#delete KmsCustomKeyStore#delete}.
        :param update: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#update KmsCustomKeyStore#update}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7258734763c6ef527cb8719c05bc0cc7a0b1e1b7c49c2a76f07719c88d796446)
            check_type(argname="argument create", value=create, expected_type=type_hints["create"])
            check_type(argname="argument delete", value=delete, expected_type=type_hints["delete"])
            check_type(argname="argument update", value=update, expected_type=type_hints["update"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if create is not None:
            self._values["create"] = create
        if delete is not None:
            self._values["delete"] = delete
        if update is not None:
            self._values["update"] = update

    @builtins.property
    def create(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#create KmsCustomKeyStore#create}.'''
        result = self._values.get("create")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def delete(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#delete KmsCustomKeyStore#delete}.'''
        result = self._values.get("delete")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def update(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#update KmsCustomKeyStore#update}.'''
        result = self._values.get("update")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "KmsCustomKeyStoreTimeouts(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class KmsCustomKeyStoreTimeoutsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.kmsCustomKeyStore.KmsCustomKeyStoreTimeoutsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__7b00b2e66cde4c0b902f56c25da3aea2e3bc741b79aacd257c53f53b5e8f600c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetCreate")
    def reset_create(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCreate", []))

    @jsii.member(jsii_name="resetDelete")
    def reset_delete(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDelete", []))

    @jsii.member(jsii_name="resetUpdate")
    def reset_update(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetUpdate", []))

    @builtins.property
    @jsii.member(jsii_name="createInput")
    def create_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "createInput"))

    @builtins.property
    @jsii.member(jsii_name="deleteInput")
    def delete_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "deleteInput"))

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
            type_hints = typing.get_type_hints(_typecheckingstub__3220e8620519c21b18492ec0430981b93d266f4f9f8680e29474969be968d3c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "create", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="delete")
    def delete(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "delete"))

    @delete.setter
    def delete(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b31838eab65ea722287fa99a7bf75680c5d8876e748eb744b8d82908c0c56fc0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "delete", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="update")
    def update(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "update"))

    @update.setter
    def update(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__278ff33f51a54bc292fed628d5cb39ae8743c8d490d89070672094cad8af1ecc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "update", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, KmsCustomKeyStoreTimeouts]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, KmsCustomKeyStoreTimeouts]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, KmsCustomKeyStoreTimeouts]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7d69faab03ddde089a56a34953f8d459aba81b55187b67e1c74d27b7e46d8e01)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.kmsCustomKeyStore.KmsCustomKeyStoreXksProxyAuthenticationCredential",
    jsii_struct_bases=[],
    name_mapping={
        "access_key_id": "accessKeyId",
        "raw_secret_access_key": "rawSecretAccessKey",
    },
)
class KmsCustomKeyStoreXksProxyAuthenticationCredential:
    def __init__(
        self,
        *,
        access_key_id: builtins.str,
        raw_secret_access_key: builtins.str,
    ) -> None:
        '''
        :param access_key_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#access_key_id KmsCustomKeyStore#access_key_id}.
        :param raw_secret_access_key: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#raw_secret_access_key KmsCustomKeyStore#raw_secret_access_key}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e5b764d91b9d447174ea898151de18c3486117c73b71d4a74ed233f8fab152f1)
            check_type(argname="argument access_key_id", value=access_key_id, expected_type=type_hints["access_key_id"])
            check_type(argname="argument raw_secret_access_key", value=raw_secret_access_key, expected_type=type_hints["raw_secret_access_key"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "access_key_id": access_key_id,
            "raw_secret_access_key": raw_secret_access_key,
        }

    @builtins.property
    def access_key_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#access_key_id KmsCustomKeyStore#access_key_id}.'''
        result = self._values.get("access_key_id")
        assert result is not None, "Required property 'access_key_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def raw_secret_access_key(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_custom_key_store#raw_secret_access_key KmsCustomKeyStore#raw_secret_access_key}.'''
        result = self._values.get("raw_secret_access_key")
        assert result is not None, "Required property 'raw_secret_access_key' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "KmsCustomKeyStoreXksProxyAuthenticationCredential(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class KmsCustomKeyStoreXksProxyAuthenticationCredentialOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.kmsCustomKeyStore.KmsCustomKeyStoreXksProxyAuthenticationCredentialOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__33b36bb4af7197d30bb19b06afe46a8dc8ac114d206346d72db90e1e9afced10)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @builtins.property
    @jsii.member(jsii_name="accessKeyIdInput")
    def access_key_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "accessKeyIdInput"))

    @builtins.property
    @jsii.member(jsii_name="rawSecretAccessKeyInput")
    def raw_secret_access_key_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "rawSecretAccessKeyInput"))

    @builtins.property
    @jsii.member(jsii_name="accessKeyId")
    def access_key_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "accessKeyId"))

    @access_key_id.setter
    def access_key_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__493c9be65dab0ce1acdb3fb759c80788bb697ee6d211506be1ad559c23b44d53)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "accessKeyId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="rawSecretAccessKey")
    def raw_secret_access_key(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "rawSecretAccessKey"))

    @raw_secret_access_key.setter
    def raw_secret_access_key(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7a375a8e81cec1b2599de57802254c133c889a611a5e660f8c899187ae450534)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "rawSecretAccessKey", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[KmsCustomKeyStoreXksProxyAuthenticationCredential]:
        return typing.cast(typing.Optional[KmsCustomKeyStoreXksProxyAuthenticationCredential], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[KmsCustomKeyStoreXksProxyAuthenticationCredential],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e969450403f27fd445ba5575499777bcb0a713db31b886e0b120312e9b51d3bb)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "KmsCustomKeyStore",
    "KmsCustomKeyStoreConfig",
    "KmsCustomKeyStoreTimeouts",
    "KmsCustomKeyStoreTimeoutsOutputReference",
    "KmsCustomKeyStoreXksProxyAuthenticationCredential",
    "KmsCustomKeyStoreXksProxyAuthenticationCredentialOutputReference",
]

publication.publish()

def _typecheckingstub__ca443ab7cfddc2fb8d615b26d827a179bf126fe8c2ae054e6259628c529fc2a6(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    custom_key_store_name: builtins.str,
    cloud_hsm_cluster_id: typing.Optional[builtins.str] = None,
    custom_key_store_type: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    key_store_password: typing.Optional[builtins.str] = None,
    timeouts: typing.Optional[typing.Union[KmsCustomKeyStoreTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    trust_anchor_certificate: typing.Optional[builtins.str] = None,
    xks_proxy_authentication_credential: typing.Optional[typing.Union[KmsCustomKeyStoreXksProxyAuthenticationCredential, typing.Dict[builtins.str, typing.Any]]] = None,
    xks_proxy_connectivity: typing.Optional[builtins.str] = None,
    xks_proxy_uri_endpoint: typing.Optional[builtins.str] = None,
    xks_proxy_uri_path: typing.Optional[builtins.str] = None,
    xks_proxy_vpc_endpoint_service_name: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__6443a78913fa83d9e6758092640c06a999cb782d2e574825a1376b66d522de4f(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88f26f19b76430de82b59e8a21da9da0a21e87f08a87aefd092e4eaf2d972d7d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61e9e4981c263c88002d0b2b4d95efb98b4d87126904fee96793343515b608e3(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fcceb165d621d7c4982f60f6418da4085377d891b94d599e7cb46d9580f06be6(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53bc61e5a59d46cadef11354f727aada734ddf50d8eab07f7d897efebe56fe1d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0ae179274251c847a8e078b15355ea19f6aebae178bfab56c5083299ec516a24(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aaffa1362bff99542931642ae7f078c2d5f0e83f7f4e50bb9ff2f8ae435a0c2d(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__056e0c95cc266f8b518496845579f67f66645eebc5f60cedd56fc52f54e3dd49(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5227cfc40cf767acb48ef0e7c5f79a78315a632fb78d42a82521574ce0a1812e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__55f8c86f816f9344e464e91ade57269645f9e2283c33210e538f9101cff3e134(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3ef61ada6253fd396bd319da1f1e3b94d1551059304410963af789a9e8b9cba0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__683336a392ed53c936cc126788a51f7bd67b5c12274b5ee4464c12d8ee583637(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    custom_key_store_name: builtins.str,
    cloud_hsm_cluster_id: typing.Optional[builtins.str] = None,
    custom_key_store_type: typing.Optional[builtins.str] = None,
    id: typing.Optional[builtins.str] = None,
    key_store_password: typing.Optional[builtins.str] = None,
    timeouts: typing.Optional[typing.Union[KmsCustomKeyStoreTimeouts, typing.Dict[builtins.str, typing.Any]]] = None,
    trust_anchor_certificate: typing.Optional[builtins.str] = None,
    xks_proxy_authentication_credential: typing.Optional[typing.Union[KmsCustomKeyStoreXksProxyAuthenticationCredential, typing.Dict[builtins.str, typing.Any]]] = None,
    xks_proxy_connectivity: typing.Optional[builtins.str] = None,
    xks_proxy_uri_endpoint: typing.Optional[builtins.str] = None,
    xks_proxy_uri_path: typing.Optional[builtins.str] = None,
    xks_proxy_vpc_endpoint_service_name: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7258734763c6ef527cb8719c05bc0cc7a0b1e1b7c49c2a76f07719c88d796446(
    *,
    create: typing.Optional[builtins.str] = None,
    delete: typing.Optional[builtins.str] = None,
    update: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7b00b2e66cde4c0b902f56c25da3aea2e3bc741b79aacd257c53f53b5e8f600c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3220e8620519c21b18492ec0430981b93d266f4f9f8680e29474969be968d3c1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b31838eab65ea722287fa99a7bf75680c5d8876e748eb744b8d82908c0c56fc0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__278ff33f51a54bc292fed628d5cb39ae8743c8d490d89070672094cad8af1ecc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7d69faab03ddde089a56a34953f8d459aba81b55187b67e1c74d27b7e46d8e01(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, KmsCustomKeyStoreTimeouts]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e5b764d91b9d447174ea898151de18c3486117c73b71d4a74ed233f8fab152f1(
    *,
    access_key_id: builtins.str,
    raw_secret_access_key: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__33b36bb4af7197d30bb19b06afe46a8dc8ac114d206346d72db90e1e9afced10(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__493c9be65dab0ce1acdb3fb759c80788bb697ee6d211506be1ad559c23b44d53(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7a375a8e81cec1b2599de57802254c133c889a611a5e660f8c899187ae450534(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e969450403f27fd445ba5575499777bcb0a713db31b886e0b120312e9b51d3bb(
    value: typing.Optional[KmsCustomKeyStoreXksProxyAuthenticationCredential],
) -> None:
    """Type checking stubs"""
    pass
