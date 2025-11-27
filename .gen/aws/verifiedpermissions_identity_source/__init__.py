r'''
# `aws_verifiedpermissions_identity_source`

Refer to the Terraform Registry for docs: [`aws_verifiedpermissions_identity_source`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source).
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


class VerifiedpermissionsIdentitySource(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySource",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source aws_verifiedpermissions_identity_source}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id: builtins.str,
        *,
        policy_store_id: builtins.str,
        configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VerifiedpermissionsIdentitySourceConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        principal_entity_type: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source aws_verifiedpermissions_identity_source} Resource.

        :param scope: The scope in which to define this construct.
        :param id: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param policy_store_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#policy_store_id VerifiedpermissionsIdentitySource#policy_store_id}.
        :param configuration: configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#configuration VerifiedpermissionsIdentitySource#configuration}
        :param principal_entity_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#principal_entity_type VerifiedpermissionsIdentitySource#principal_entity_type}.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c38d148b271e2a829787902995b66f0d5c97b073a9e866d7275beb3fd6c1ac5e)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        config = VerifiedpermissionsIdentitySourceConfig(
            policy_store_id=policy_store_id,
            configuration=configuration,
            principal_entity_type=principal_entity_type,
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
        '''Generates CDKTF code for importing a VerifiedpermissionsIdentitySource resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the VerifiedpermissionsIdentitySource to import.
        :param import_from_id: The id of the existing VerifiedpermissionsIdentitySource that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the VerifiedpermissionsIdentitySource to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3540669e4c541d2f5286d61cf0864e42b1585f8e5a0b121add8f4b56bd4123a2)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putConfiguration")
    def put_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VerifiedpermissionsIdentitySourceConfiguration", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c91ede8cc8292725eb2eb0401a23b791c679e582c20ff7bbbfdb8653c423ec0d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putConfiguration", [value]))

    @jsii.member(jsii_name="resetConfiguration")
    def reset_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetConfiguration", []))

    @jsii.member(jsii_name="resetPrincipalEntityType")
    def reset_principal_entity_type(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrincipalEntityType", []))

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
    @jsii.member(jsii_name="configuration")
    def configuration(self) -> "VerifiedpermissionsIdentitySourceConfigurationList":
        return typing.cast("VerifiedpermissionsIdentitySourceConfigurationList", jsii.get(self, "configuration"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @builtins.property
    @jsii.member(jsii_name="configurationInput")
    def configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfiguration"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfiguration"]]], jsii.get(self, "configurationInput"))

    @builtins.property
    @jsii.member(jsii_name="policyStoreIdInput")
    def policy_store_id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "policyStoreIdInput"))

    @builtins.property
    @jsii.member(jsii_name="principalEntityTypeInput")
    def principal_entity_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "principalEntityTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="policyStoreId")
    def policy_store_id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "policyStoreId"))

    @policy_store_id.setter
    def policy_store_id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__032357d3abfb85774e6526fdb00c4afb3f3c7f43ba85ca087cc1a7b80dc89b3b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "policyStoreId", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="principalEntityType")
    def principal_entity_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "principalEntityType"))

    @principal_entity_type.setter
    def principal_entity_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e84c200145062d774e1639e02d5967e5939a1824cdd5354880023390aebb98b0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "principalEntityType", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "policy_store_id": "policyStoreId",
        "configuration": "configuration",
        "principal_entity_type": "principalEntityType",
    },
)
class VerifiedpermissionsIdentitySourceConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        policy_store_id: builtins.str,
        configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VerifiedpermissionsIdentitySourceConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        principal_entity_type: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param policy_store_id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#policy_store_id VerifiedpermissionsIdentitySource#policy_store_id}.
        :param configuration: configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#configuration VerifiedpermissionsIdentitySource#configuration}
        :param principal_entity_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#principal_entity_type VerifiedpermissionsIdentitySource#principal_entity_type}.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e2190ae552f97cea6de25da7717914625e73eaea1c79633be215fcc77065202c)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument policy_store_id", value=policy_store_id, expected_type=type_hints["policy_store_id"])
            check_type(argname="argument configuration", value=configuration, expected_type=type_hints["configuration"])
            check_type(argname="argument principal_entity_type", value=principal_entity_type, expected_type=type_hints["principal_entity_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "policy_store_id": policy_store_id,
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
        if configuration is not None:
            self._values["configuration"] = configuration
        if principal_entity_type is not None:
            self._values["principal_entity_type"] = principal_entity_type

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
    def policy_store_id(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#policy_store_id VerifiedpermissionsIdentitySource#policy_store_id}.'''
        result = self._values.get("policy_store_id")
        assert result is not None, "Required property 'policy_store_id' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfiguration"]]]:
        '''configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#configuration VerifiedpermissionsIdentitySource#configuration}
        '''
        result = self._values.get("configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfiguration"]]], result)

    @builtins.property
    def principal_entity_type(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#principal_entity_type VerifiedpermissionsIdentitySource#principal_entity_type}.'''
        result = self._values.get("principal_entity_type")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VerifiedpermissionsIdentitySourceConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "cognito_user_pool_configuration": "cognitoUserPoolConfiguration",
        "open_id_connect_configuration": "openIdConnectConfiguration",
    },
)
class VerifiedpermissionsIdentitySourceConfiguration:
    def __init__(
        self,
        *,
        cognito_user_pool_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        open_id_connect_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param cognito_user_pool_configuration: cognito_user_pool_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#cognito_user_pool_configuration VerifiedpermissionsIdentitySource#cognito_user_pool_configuration}
        :param open_id_connect_configuration: open_id_connect_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#open_id_connect_configuration VerifiedpermissionsIdentitySource#open_id_connect_configuration}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7ea9f2aadb9d67c91e84e896a8b4096267a9ccc7cfccb47b33a39adcd6d3ae81)
            check_type(argname="argument cognito_user_pool_configuration", value=cognito_user_pool_configuration, expected_type=type_hints["cognito_user_pool_configuration"])
            check_type(argname="argument open_id_connect_configuration", value=open_id_connect_configuration, expected_type=type_hints["open_id_connect_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if cognito_user_pool_configuration is not None:
            self._values["cognito_user_pool_configuration"] = cognito_user_pool_configuration
        if open_id_connect_configuration is not None:
            self._values["open_id_connect_configuration"] = open_id_connect_configuration

    @builtins.property
    def cognito_user_pool_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration"]]]:
        '''cognito_user_pool_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#cognito_user_pool_configuration VerifiedpermissionsIdentitySource#cognito_user_pool_configuration}
        '''
        result = self._values.get("cognito_user_pool_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration"]]], result)

    @builtins.property
    def open_id_connect_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration"]]]:
        '''open_id_connect_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#open_id_connect_configuration VerifiedpermissionsIdentitySource#open_id_connect_configuration}
        '''
        result = self._values.get("open_id_connect_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VerifiedpermissionsIdentitySourceConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "user_pool_arn": "userPoolArn",
        "client_ids": "clientIds",
        "group_configuration": "groupConfiguration",
    },
)
class VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration:
    def __init__(
        self,
        *,
        user_pool_arn: builtins.str,
        client_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        group_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param user_pool_arn: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#user_pool_arn VerifiedpermissionsIdentitySource#user_pool_arn}.
        :param client_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#client_ids VerifiedpermissionsIdentitySource#client_ids}.
        :param group_configuration: group_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_configuration VerifiedpermissionsIdentitySource#group_configuration}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3356e3354c0d3181f30b914f472d161843ff79b56ff0ce07d6e790003c25e3f2)
            check_type(argname="argument user_pool_arn", value=user_pool_arn, expected_type=type_hints["user_pool_arn"])
            check_type(argname="argument client_ids", value=client_ids, expected_type=type_hints["client_ids"])
            check_type(argname="argument group_configuration", value=group_configuration, expected_type=type_hints["group_configuration"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "user_pool_arn": user_pool_arn,
        }
        if client_ids is not None:
            self._values["client_ids"] = client_ids
        if group_configuration is not None:
            self._values["group_configuration"] = group_configuration

    @builtins.property
    def user_pool_arn(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#user_pool_arn VerifiedpermissionsIdentitySource#user_pool_arn}.'''
        result = self._values.get("user_pool_arn")
        assert result is not None, "Required property 'user_pool_arn' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def client_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#client_ids VerifiedpermissionsIdentitySource#client_ids}.'''
        result = self._values.get("client_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def group_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration"]]]:
        '''group_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_configuration VerifiedpermissionsIdentitySource#group_configuration}
        '''
        result = self._values.get("group_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration",
    jsii_struct_bases=[],
    name_mapping={"group_entity_type": "groupEntityType"},
)
class VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration:
    def __init__(self, *, group_entity_type: builtins.str) -> None:
        '''
        :param group_entity_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_entity_type VerifiedpermissionsIdentitySource#group_entity_type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__30e83f850319d6224470e0e5bcee69f1c0c973d656e4159390af376a41118fb7)
            check_type(argname="argument group_entity_type", value=group_entity_type, expected_type=type_hints["group_entity_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "group_entity_type": group_entity_type,
        }

    @builtins.property
    def group_entity_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_entity_type VerifiedpermissionsIdentitySource#group_entity_type}.'''
        result = self._values.get("group_entity_type")
        assert result is not None, "Required property 'group_entity_type' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a48aa4480070a25e1156067690f0e77579b650b2c601e88796a98b0667216ddc)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__953bf18f2e39f77a4f85cebfd02efe1565b97b5a09b18b5de1d474fabb66a8c7)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__fd26ae9d2fe5904f51bbf47c6e451d66b3b812f3f2d49620911dfd9170b65f4f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__93064d5424680e06d6e5153ec6419943306f0c58a2fdd9ced09c021039975d57)
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
            type_hints = typing.get_type_hints(_typecheckingstub__51247e2d80b1826257d84bec31975507c26218a721d1debd508af20d0c0e05f5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__139674d9c3a4b580093c6802329e0d31548f86d378e06e3909d51073bb885b38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__08edb53dbd745cbfc1cc7017557cf00cad7b712f745238516e9b12ffccf6844e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="groupEntityTypeInput")
    def group_entity_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "groupEntityTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="groupEntityType")
    def group_entity_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "groupEntityType"))

    @group_entity_type.setter
    def group_entity_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c9baa3b5257ef7a30afc3bffb8f7841853b188c629e3cf23620563cfea861282)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "groupEntityType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3227676cfd80805422633861714bea0db09062f8663fe7bf7145f8205cd375ff)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8ceb5d487a45ef60f710ddb246f48faa18f206cec35f0c69cf20103682cecf0c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b756c6094dc1cf2f6b9935b1b5dc96ad49ff3489dea06be5c7b41d8a725e3720)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f295e4cd8bdfb815faf9f55535dd56b3581cb45cd5ca43bcfca6404a79c195b1)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2a5f859925ae1d5d72159d16b4820455da52ceb89d5b3a0a4c67e0e34ae7f5c8)
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
            type_hints = typing.get_type_hints(_typecheckingstub__fc665b1289978656e0106bc5240deba506e4a466a219f387300f36656489d67a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__746523b64c6ae852885d2c05540b7bc2429a2eec7f9953135d850eb3d8a2e016)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__d282f8c6b2deabe77ceed87e756d58fda598fdb7e5fed0d9ececb9a127d95e73)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putGroupConfiguration")
    def put_group_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c03e91d3cc467df7f3b6cece22da461b0400e820e330797818ba664efc99426b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putGroupConfiguration", [value]))

    @jsii.member(jsii_name="resetClientIds")
    def reset_client_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetClientIds", []))

    @jsii.member(jsii_name="resetGroupConfiguration")
    def reset_group_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGroupConfiguration", []))

    @builtins.property
    @jsii.member(jsii_name="groupConfiguration")
    def group_configuration(
        self,
    ) -> VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfigurationList:
        return typing.cast(VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfigurationList, jsii.get(self, "groupConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="clientIdsInput")
    def client_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "clientIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="groupConfigurationInput")
    def group_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration]]], jsii.get(self, "groupConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="userPoolArnInput")
    def user_pool_arn_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "userPoolArnInput"))

    @builtins.property
    @jsii.member(jsii_name="clientIds")
    def client_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "clientIds"))

    @client_ids.setter
    def client_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__42817ef3617e9e949f6dd97186fba87cf0a63926841d4ee0c68d7b4e599759c1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "clientIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="userPoolArn")
    def user_pool_arn(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "userPoolArn"))

    @user_pool_arn.setter
    def user_pool_arn(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__83fe08ee36426fff0c7d5c5f3a072567cacd3c1263c33a2d6c02b01c51add114)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "userPoolArn", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b06d5e3c2c5e557ca2c1e7b1c2b6987c753ebbb74ef5b2e25116943b2efe503d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VerifiedpermissionsIdentitySourceConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__4dcf4c76c9005a468a0e971b5cd71bf1c0d2afb1e44ea1393fb43e5efc63c1e6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "VerifiedpermissionsIdentitySourceConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d6a6e318de8d92ed87d2a1f85d86191618f8e3e98667d6a247096eb583784fce)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("VerifiedpermissionsIdentitySourceConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0fa18f50333d1e076e98ea65c31756dcc2420e91651917f1ad01ff2cee9e7429)
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
            type_hints = typing.get_type_hints(_typecheckingstub__02a3c50ea0a06e23856d6171d1e99eea52985d255a5cafa1e7c3e4d9f3a732b7)
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
            type_hints = typing.get_type_hints(_typecheckingstub__5d9d6098e9d8cdde85dcbe781633e447d21c446bab709cd3f9ab21eeb579372d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__11288a36d7bb30aac291f9c8b9d40e99c20d041416af724112ce29e26a0739d9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration",
    jsii_struct_bases=[],
    name_mapping={
        "issuer": "issuer",
        "entity_id_prefix": "entityIdPrefix",
        "group_configuration": "groupConfiguration",
        "token_selection": "tokenSelection",
    },
)
class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration:
    def __init__(
        self,
        *,
        issuer: builtins.str,
        entity_id_prefix: typing.Optional[builtins.str] = None,
        group_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration", typing.Dict[builtins.str, typing.Any]]]]] = None,
        token_selection: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param issuer: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#issuer VerifiedpermissionsIdentitySource#issuer}.
        :param entity_id_prefix: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#entity_id_prefix VerifiedpermissionsIdentitySource#entity_id_prefix}.
        :param group_configuration: group_configuration block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_configuration VerifiedpermissionsIdentitySource#group_configuration}
        :param token_selection: token_selection block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#token_selection VerifiedpermissionsIdentitySource#token_selection}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f45a29190120f3f6211b8d148cf29fe9bfe776ba105c55a15eb9f70e2728e578)
            check_type(argname="argument issuer", value=issuer, expected_type=type_hints["issuer"])
            check_type(argname="argument entity_id_prefix", value=entity_id_prefix, expected_type=type_hints["entity_id_prefix"])
            check_type(argname="argument group_configuration", value=group_configuration, expected_type=type_hints["group_configuration"])
            check_type(argname="argument token_selection", value=token_selection, expected_type=type_hints["token_selection"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "issuer": issuer,
        }
        if entity_id_prefix is not None:
            self._values["entity_id_prefix"] = entity_id_prefix
        if group_configuration is not None:
            self._values["group_configuration"] = group_configuration
        if token_selection is not None:
            self._values["token_selection"] = token_selection

    @builtins.property
    def issuer(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#issuer VerifiedpermissionsIdentitySource#issuer}.'''
        result = self._values.get("issuer")
        assert result is not None, "Required property 'issuer' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def entity_id_prefix(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#entity_id_prefix VerifiedpermissionsIdentitySource#entity_id_prefix}.'''
        result = self._values.get("entity_id_prefix")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def group_configuration(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration"]]]:
        '''group_configuration block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_configuration VerifiedpermissionsIdentitySource#group_configuration}
        '''
        result = self._values.get("group_configuration")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration"]]], result)

    @builtins.property
    def token_selection(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection"]]]:
        '''token_selection block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#token_selection VerifiedpermissionsIdentitySource#token_selection}
        '''
        result = self._values.get("token_selection")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration",
    jsii_struct_bases=[],
    name_mapping={"group_claim": "groupClaim", "group_entity_type": "groupEntityType"},
)
class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration:
    def __init__(
        self,
        *,
        group_claim: builtins.str,
        group_entity_type: builtins.str,
    ) -> None:
        '''
        :param group_claim: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_claim VerifiedpermissionsIdentitySource#group_claim}.
        :param group_entity_type: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_entity_type VerifiedpermissionsIdentitySource#group_entity_type}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a58547b84e10a5ad0c5201139be30c759ad7df20b975a50956e0e911b96b1b41)
            check_type(argname="argument group_claim", value=group_claim, expected_type=type_hints["group_claim"])
            check_type(argname="argument group_entity_type", value=group_entity_type, expected_type=type_hints["group_entity_type"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "group_claim": group_claim,
            "group_entity_type": group_entity_type,
        }

    @builtins.property
    def group_claim(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_claim VerifiedpermissionsIdentitySource#group_claim}.'''
        result = self._values.get("group_claim")
        assert result is not None, "Required property 'group_claim' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def group_entity_type(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#group_entity_type VerifiedpermissionsIdentitySource#group_entity_type}.'''
        result = self._values.get("group_entity_type")
        assert result is not None, "Required property 'group_entity_type' is missing"
        return typing.cast(builtins.str, result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ebd0c486d87ad35580bc384d2470562eadd77a009a9a33c9bed84e59197e568d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8d7d2cde31af2a8afb0a18e29a68297a7be9bd13e076561ac3aed7184236551c)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3c3f1022ff46a905b997e9add4e3503e1ee53bf373d99b28b77817e35f4c27f2)
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
            type_hints = typing.get_type_hints(_typecheckingstub__61266a9c21e3ca030f7a26b8dcd9b222fa9ca93c66604c8cc9905bdad58c7b7f)
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
            type_hints = typing.get_type_hints(_typecheckingstub__82f4fa9e23269a28c48a2191772bc3369d44184269794e7b630ac501817a5ee1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bd2cb6e83f00d68cc485e1ed1ee80f09fc8fe7312754f284ab3fc2c0954a5d69)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__8897296782df62a50c75e17d1965ca5342b78ceaa9f1cb7459aa9b9c0d0a6627)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @builtins.property
    @jsii.member(jsii_name="groupClaimInput")
    def group_claim_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "groupClaimInput"))

    @builtins.property
    @jsii.member(jsii_name="groupEntityTypeInput")
    def group_entity_type_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "groupEntityTypeInput"))

    @builtins.property
    @jsii.member(jsii_name="groupClaim")
    def group_claim(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "groupClaim"))

    @group_claim.setter
    def group_claim(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__91b9b4283ec5f47b75e6b7f2bd73cf5633f9e10c038da2ef8241ed597f727716)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "groupClaim", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="groupEntityType")
    def group_entity_type(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "groupEntityType"))

    @group_entity_type.setter
    def group_entity_type(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__308ede83ce1d05153c5d4b18eb0a45e141ec1f3f6e794fe4d9312e070a6578d8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "groupEntityType", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__433deef100ec1a3e97daa5e84e7b008a58f4a5ccba7ac5eba91e5f1918c7d351)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__aefe2a7df9cf9be84f29e3f1910f98a026e1be8f4b2866fcdff167ce40a25017)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4b74b77e7d62f9780e9b67eb5fde31c87e56a122c6f3aa78fb651e6e78fd4ab5)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e7e051adb73918c39377bb4099663d8fc0d7f2a13411e84ece9d590582ec9310)
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
            type_hints = typing.get_type_hints(_typecheckingstub__041d5dec36040fbf089449f6c3bc033a9742911ba545ac137d11707f7e5a6c9b)
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
            type_hints = typing.get_type_hints(_typecheckingstub__35d4da746e63a443495e54afe80362f79ea7f0c71635e6c3ff7720005b4caa2c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cd23d3ad014fff18ae7cb96a50f68cd5f7c33128a7ad6b3fce43c91c0f05e54f)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f5929c65bfb656d1dd351e71f731c988ec57827ec689ef418764c1cbda2469fb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putGroupConfiguration")
    def put_group_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__562d93e32fe02d809b8f70ff2b098739de9fc6f9eff913995d53e2ac0c712382)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putGroupConfiguration", [value]))

    @jsii.member(jsii_name="putTokenSelection")
    def put_token_selection(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection", typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0be2eb2cdbfc836970ee3d81743790c0fc0b160ec4748409f3070f51d71be073)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putTokenSelection", [value]))

    @jsii.member(jsii_name="resetEntityIdPrefix")
    def reset_entity_id_prefix(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEntityIdPrefix", []))

    @jsii.member(jsii_name="resetGroupConfiguration")
    def reset_group_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGroupConfiguration", []))

    @jsii.member(jsii_name="resetTokenSelection")
    def reset_token_selection(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTokenSelection", []))

    @builtins.property
    @jsii.member(jsii_name="groupConfiguration")
    def group_configuration(
        self,
    ) -> VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfigurationList:
        return typing.cast(VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfigurationList, jsii.get(self, "groupConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="tokenSelection")
    def token_selection(
        self,
    ) -> "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionList":
        return typing.cast("VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionList", jsii.get(self, "tokenSelection"))

    @builtins.property
    @jsii.member(jsii_name="entityIdPrefixInput")
    def entity_id_prefix_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "entityIdPrefixInput"))

    @builtins.property
    @jsii.member(jsii_name="groupConfigurationInput")
    def group_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration]]], jsii.get(self, "groupConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="issuerInput")
    def issuer_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "issuerInput"))

    @builtins.property
    @jsii.member(jsii_name="tokenSelectionInput")
    def token_selection_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection"]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection"]]], jsii.get(self, "tokenSelectionInput"))

    @builtins.property
    @jsii.member(jsii_name="entityIdPrefix")
    def entity_id_prefix(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "entityIdPrefix"))

    @entity_id_prefix.setter
    def entity_id_prefix(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__11e547548ef2d204cebd49d022a5a5a5002a0aa4bcd8190d015eb4a0f5958e51)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "entityIdPrefix", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="issuer")
    def issuer(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "issuer"))

    @issuer.setter
    def issuer(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d9f20a6262d41576020ce71b42d8cd66222ab64675ce09cb474e394733c2e865)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "issuer", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e34a83e9e9fb6bbdd22ce6731adcb18443d2bd08b6313724841be4f3f3a6693)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection",
    jsii_struct_bases=[],
    name_mapping={
        "access_token_only": "accessTokenOnly",
        "identity_token_only": "identityTokenOnly",
    },
)
class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection:
    def __init__(
        self,
        *,
        access_token_only: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly", typing.Dict[builtins.str, typing.Any]]]]] = None,
        identity_token_only: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly", typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''
        :param access_token_only: access_token_only block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#access_token_only VerifiedpermissionsIdentitySource#access_token_only}
        :param identity_token_only: identity_token_only block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#identity_token_only VerifiedpermissionsIdentitySource#identity_token_only}
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8cb9194f03def08089cdfe41c11c10d6c2e1ada42cc1087465a396cfa2561781)
            check_type(argname="argument access_token_only", value=access_token_only, expected_type=type_hints["access_token_only"])
            check_type(argname="argument identity_token_only", value=identity_token_only, expected_type=type_hints["identity_token_only"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if access_token_only is not None:
            self._values["access_token_only"] = access_token_only
        if identity_token_only is not None:
            self._values["identity_token_only"] = identity_token_only

    @builtins.property
    def access_token_only(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly"]]]:
        '''access_token_only block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#access_token_only VerifiedpermissionsIdentitySource#access_token_only}
        '''
        result = self._values.get("access_token_only")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly"]]], result)

    @builtins.property
    def identity_token_only(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly"]]]:
        '''identity_token_only block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#identity_token_only VerifiedpermissionsIdentitySource#identity_token_only}
        '''
        result = self._values.get("identity_token_only")
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List["VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly"]]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly",
    jsii_struct_bases=[],
    name_mapping={"audiences": "audiences", "principal_id_claim": "principalIdClaim"},
)
class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly:
    def __init__(
        self,
        *,
        audiences: typing.Optional[typing.Sequence[builtins.str]] = None,
        principal_id_claim: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param audiences: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#audiences VerifiedpermissionsIdentitySource#audiences}.
        :param principal_id_claim: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#principal_id_claim VerifiedpermissionsIdentitySource#principal_id_claim}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f5bb14ab5da90886b6ca4a11fe3c95a58164f55bce48eea576ee40cef0eb303a)
            check_type(argname="argument audiences", value=audiences, expected_type=type_hints["audiences"])
            check_type(argname="argument principal_id_claim", value=principal_id_claim, expected_type=type_hints["principal_id_claim"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if audiences is not None:
            self._values["audiences"] = audiences
        if principal_id_claim is not None:
            self._values["principal_id_claim"] = principal_id_claim

    @builtins.property
    def audiences(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#audiences VerifiedpermissionsIdentitySource#audiences}.'''
        result = self._values.get("audiences")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def principal_id_claim(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#principal_id_claim VerifiedpermissionsIdentitySource#principal_id_claim}.'''
        result = self._values.get("principal_id_claim")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnlyList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnlyList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__24ea93f9480ea07dffacf61eff620a217796249f33d822096fbb246ac5f645f4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnlyOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__37442469a187caa9807f17989d04da5b43f05512285796dda895f5eb4ff129eb)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnlyOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e6954eae28c3ae0ecb35d748b151f4d978b0eacbe283c313d2ec5fd0a0b9a7d0)
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
            type_hints = typing.get_type_hints(_typecheckingstub__3141ef49b99d4bd5dd42cbb5afe2b05fd9cf8aaaedc8ea2191c1c3adc6fac01d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__2ccb33c60d8ddd8abb4830b374ccc016eb880bcbf290e8c81280cfc429bd5918)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__cc74958c41e375680d69ee56d3a3ef29743e363854083996c482741d6bf8c57c)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnlyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnlyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__f0b521e2958daa9502ecf1caffe79601f1de2cfa4cf72fad9f70745e48e50fcb)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetAudiences")
    def reset_audiences(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAudiences", []))

    @jsii.member(jsii_name="resetPrincipalIdClaim")
    def reset_principal_id_claim(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrincipalIdClaim", []))

    @builtins.property
    @jsii.member(jsii_name="audiencesInput")
    def audiences_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "audiencesInput"))

    @builtins.property
    @jsii.member(jsii_name="principalIdClaimInput")
    def principal_id_claim_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "principalIdClaimInput"))

    @builtins.property
    @jsii.member(jsii_name="audiences")
    def audiences(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "audiences"))

    @audiences.setter
    def audiences(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0c01c867017b2cf4de47961f4430ed923040b18db7e97315f10dbabd29becbf7)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "audiences", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="principalIdClaim")
    def principal_id_claim(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "principalIdClaim"))

    @principal_id_claim.setter
    def principal_id_claim(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__63488cf3fb0392511bbf7cce4bcbb529e3b6daaf66824e2a1f21f0335b96a8c0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "principalIdClaim", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2823b47dc52541bcb4934cae69583b1c0ac0873a5cab07e71162e0a73d3cd621)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly",
    jsii_struct_bases=[],
    name_mapping={"client_ids": "clientIds", "principal_id_claim": "principalIdClaim"},
)
class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly:
    def __init__(
        self,
        *,
        client_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
        principal_id_claim: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param client_ids: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#client_ids VerifiedpermissionsIdentitySource#client_ids}.
        :param principal_id_claim: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#principal_id_claim VerifiedpermissionsIdentitySource#principal_id_claim}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__169e954fed2cc1ce0e9b47a7a7d794b28ba900595c130e62f1022ddc04825d1e)
            check_type(argname="argument client_ids", value=client_ids, expected_type=type_hints["client_ids"])
            check_type(argname="argument principal_id_claim", value=principal_id_claim, expected_type=type_hints["principal_id_claim"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if client_ids is not None:
            self._values["client_ids"] = client_ids
        if principal_id_claim is not None:
            self._values["principal_id_claim"] = principal_id_claim

    @builtins.property
    def client_ids(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#client_ids VerifiedpermissionsIdentitySource#client_ids}.'''
        result = self._values.get("client_ids")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    @builtins.property
    def principal_id_claim(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_identity_source#principal_id_claim VerifiedpermissionsIdentitySource#principal_id_claim}.'''
        result = self._values.get("principal_id_claim")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnlyList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnlyList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__29b35f3e0efd2ff19883bef17d23f454ae79f3c06be6bb8b13a60483e9e21b43)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnlyOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3499768389f83acb2270421a36289fa0d7e7836d16dc733a4a335f82403dd274)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnlyOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ddb14e90f5e87bec446b1bbecd0b75685a60b90bd478b511610273912d106414)
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
            type_hints = typing.get_type_hints(_typecheckingstub__d70903440702b29062cb2c56695195c9759e574fd8a5142a7a70a25c7ad2eb36)
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
            type_hints = typing.get_type_hints(_typecheckingstub__0c05659c174628064726c62c398fc8558def5f6066dff42a28ed3a7070047d3a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ccdd962eca69aa209baa0187bbe3710b0eac9190c3d6ec581c68eddc2284ee7a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnlyOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnlyOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__5c047480e68b70d0b420f4f581a7e8353dd179c7ad383806ac06bcad34554cb7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="resetClientIds")
    def reset_client_ids(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetClientIds", []))

    @jsii.member(jsii_name="resetPrincipalIdClaim")
    def reset_principal_id_claim(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetPrincipalIdClaim", []))

    @builtins.property
    @jsii.member(jsii_name="clientIdsInput")
    def client_ids_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "clientIdsInput"))

    @builtins.property
    @jsii.member(jsii_name="principalIdClaimInput")
    def principal_id_claim_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "principalIdClaimInput"))

    @builtins.property
    @jsii.member(jsii_name="clientIds")
    def client_ids(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "clientIds"))

    @client_ids.setter
    def client_ids(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__455518b0406dc669cb7206ab13096ce50063933b95ef6c6b7632bb96c96fd8b2)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "clientIds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="principalIdClaim")
    def principal_id_claim(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "principalIdClaim"))

    @principal_id_claim.setter
    def principal_id_claim(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__8ce1803cb47eb0a03d675935b8561b938d9f48237a015a780df336967d44e9a9)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "principalIdClaim", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a530710b837c327228c5227b5ee4597c4623e4cb8611cc77b76dfd60228afdbd)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionList(
    _cdktf_9a9027ec.ComplexList,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionList",
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
            type_hints = typing.get_type_hints(_typecheckingstub__229d44733226595f96c7b5984fcb15fc880b2e04430750afbe894e5e1031e35a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument wraps_set", value=wraps_set, expected_type=type_hints["wraps_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, wraps_set])

    @jsii.member(jsii_name="get")
    def get(
        self,
        index: jsii.Number,
    ) -> "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionOutputReference":
        '''
        :param index: the index of the item to return.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__99a13ca610d4efb238c944ee91eb48b1d8882628a9ce84f09bbdf5c2fd4e1111)
            check_type(argname="argument index", value=index, expected_type=type_hints["index"])
        return typing.cast("VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionOutputReference", jsii.invoke(self, "get", [index]))

    @builtins.property
    @jsii.member(jsii_name="terraformAttribute")
    def _terraform_attribute(self) -> builtins.str:
        '''The attribute on the parent resource this class is referencing.'''
        return typing.cast(builtins.str, jsii.get(self, "terraformAttribute"))

    @_terraform_attribute.setter
    def _terraform_attribute(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ea77795b3aa861fcbb39c55a22490ff6edddc89362489a1c324d6b92fae63025)
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
            type_hints = typing.get_type_hints(_typecheckingstub__ac0c89c6c904e771f11a2cedf885a722324b3528a445a2ffee2a734be6915430)
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
            type_hints = typing.get_type_hints(_typecheckingstub__c498c6a198ef8260d95d9bf2755abe12dd1de03cbf737ddfd7c6ed247ae374be)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "wrapsSet", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection]]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection]]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b952535140e8158a89d47bc223802409c531be215cf9890b9d175a9f6ddd5b74)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__1bd910683153d8dc9cf3d736d73b7df6ee83fa8340f30e58af8f5e36da1d6657)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putAccessTokenOnly")
    def put_access_token_only(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__36d355826fed3850702981a68a8da1180592735419d70f757a622b9dad1b5cb5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putAccessTokenOnly", [value]))

    @jsii.member(jsii_name="putIdentityTokenOnly")
    def put_identity_token_only(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__aeb2c9a3a83c7eba57a292bb92c7c747d2e0cf57e033a61888bb9118faa44b72)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putIdentityTokenOnly", [value]))

    @jsii.member(jsii_name="resetAccessTokenOnly")
    def reset_access_token_only(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetAccessTokenOnly", []))

    @jsii.member(jsii_name="resetIdentityTokenOnly")
    def reset_identity_token_only(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetIdentityTokenOnly", []))

    @builtins.property
    @jsii.member(jsii_name="accessTokenOnly")
    def access_token_only(
        self,
    ) -> VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnlyList:
        return typing.cast(VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnlyList, jsii.get(self, "accessTokenOnly"))

    @builtins.property
    @jsii.member(jsii_name="identityTokenOnly")
    def identity_token_only(
        self,
    ) -> VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnlyList:
        return typing.cast(VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnlyList, jsii.get(self, "identityTokenOnly"))

    @builtins.property
    @jsii.member(jsii_name="accessTokenOnlyInput")
    def access_token_only_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly]]], jsii.get(self, "accessTokenOnlyInput"))

    @builtins.property
    @jsii.member(jsii_name="identityTokenOnlyInput")
    def identity_token_only_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly]]], jsii.get(self, "identityTokenOnlyInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__dcd1d41083a2afd2fbd2016929673c3de613719b1331d55bc0dcde648190afba)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class VerifiedpermissionsIdentitySourceConfigurationOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.verifiedpermissionsIdentitySource.VerifiedpermissionsIdentitySourceConfigurationOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__dae682ba41db0019c0771a92321b3ca059bde55c3e9547fa3a6d84447af99206)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
            check_type(argname="argument complex_object_index", value=complex_object_index, expected_type=type_hints["complex_object_index"])
            check_type(argname="argument complex_object_is_from_set", value=complex_object_is_from_set, expected_type=type_hints["complex_object_is_from_set"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute, complex_object_index, complex_object_is_from_set])

    @jsii.member(jsii_name="putCognitoUserPoolConfiguration")
    def put_cognito_user_pool_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__e368983625cb57edaf9931e65ea5bc4f91748e5a34a2b22de401e83f5abfe121)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putCognitoUserPoolConfiguration", [value]))

    @jsii.member(jsii_name="putOpenIdConnectConfiguration")
    def put_open_id_connect_configuration(
        self,
        value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration, typing.Dict[builtins.str, typing.Any]]]],
    ) -> None:
        '''
        :param value: -
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__272154a0c64b204f7c68ebaa930914ecbc368123acf7297bef2e7459e86245c0)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        return typing.cast(None, jsii.invoke(self, "putOpenIdConnectConfiguration", [value]))

    @jsii.member(jsii_name="resetCognitoUserPoolConfiguration")
    def reset_cognito_user_pool_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetCognitoUserPoolConfiguration", []))

    @jsii.member(jsii_name="resetOpenIdConnectConfiguration")
    def reset_open_id_connect_configuration(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOpenIdConnectConfiguration", []))

    @builtins.property
    @jsii.member(jsii_name="cognitoUserPoolConfiguration")
    def cognito_user_pool_configuration(
        self,
    ) -> VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationList:
        return typing.cast(VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationList, jsii.get(self, "cognitoUserPoolConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="openIdConnectConfiguration")
    def open_id_connect_configuration(
        self,
    ) -> VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationList:
        return typing.cast(VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationList, jsii.get(self, "openIdConnectConfiguration"))

    @builtins.property
    @jsii.member(jsii_name="cognitoUserPoolConfigurationInput")
    def cognito_user_pool_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration]]], jsii.get(self, "cognitoUserPoolConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="openIdConnectConfigurationInput")
    def open_id_connect_configuration_input(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration]]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration]]], jsii.get(self, "openIdConnectConfigurationInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfiguration]]:
        return typing.cast(typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfiguration]], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfiguration]],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__726068fca257f56bce78ccbdf920ad8e8c51b9f8443606cf28febf7b3d997264)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "VerifiedpermissionsIdentitySource",
    "VerifiedpermissionsIdentitySourceConfig",
    "VerifiedpermissionsIdentitySourceConfiguration",
    "VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration",
    "VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration",
    "VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfigurationList",
    "VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfigurationOutputReference",
    "VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationList",
    "VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationOutputReference",
    "VerifiedpermissionsIdentitySourceConfigurationList",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfigurationList",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfigurationOutputReference",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationList",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationOutputReference",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnlyList",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnlyOutputReference",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnlyList",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnlyOutputReference",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionList",
    "VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionOutputReference",
    "VerifiedpermissionsIdentitySourceConfigurationOutputReference",
]

publication.publish()

def _typecheckingstub__c38d148b271e2a829787902995b66f0d5c97b073a9e866d7275beb3fd6c1ac5e(
    scope: _constructs_77d1e7e8.Construct,
    id: builtins.str,
    *,
    policy_store_id: builtins.str,
    configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    principal_entity_type: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__3540669e4c541d2f5286d61cf0864e42b1585f8e5a0b121add8f4b56bd4123a2(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c91ede8cc8292725eb2eb0401a23b791c679e582c20ff7bbbfdb8653c423ec0d(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__032357d3abfb85774e6526fdb00c4afb3f3c7f43ba85ca087cc1a7b80dc89b3b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e84c200145062d774e1639e02d5967e5939a1824cdd5354880023390aebb98b0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e2190ae552f97cea6de25da7717914625e73eaea1c79633be215fcc77065202c(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    policy_store_id: builtins.str,
    configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    principal_entity_type: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7ea9f2aadb9d67c91e84e896a8b4096267a9ccc7cfccb47b33a39adcd6d3ae81(
    *,
    cognito_user_pool_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    open_id_connect_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3356e3354c0d3181f30b914f472d161843ff79b56ff0ce07d6e790003c25e3f2(
    *,
    user_pool_arn: builtins.str,
    client_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    group_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__30e83f850319d6224470e0e5bcee69f1c0c973d656e4159390af376a41118fb7(
    *,
    group_entity_type: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a48aa4480070a25e1156067690f0e77579b650b2c601e88796a98b0667216ddc(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__953bf18f2e39f77a4f85cebfd02efe1565b97b5a09b18b5de1d474fabb66a8c7(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fd26ae9d2fe5904f51bbf47c6e451d66b3b812f3f2d49620911dfd9170b65f4f(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__93064d5424680e06d6e5153ec6419943306f0c58a2fdd9ced09c021039975d57(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__51247e2d80b1826257d84bec31975507c26218a721d1debd508af20d0c0e05f5(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__139674d9c3a4b580093c6802329e0d31548f86d378e06e3909d51073bb885b38(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__08edb53dbd745cbfc1cc7017557cf00cad7b712f745238516e9b12ffccf6844e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c9baa3b5257ef7a30afc3bffb8f7841853b188c629e3cf23620563cfea861282(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3227676cfd80805422633861714bea0db09062f8663fe7bf7145f8205cd375ff(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ceb5d487a45ef60f710ddb246f48faa18f206cec35f0c69cf20103682cecf0c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b756c6094dc1cf2f6b9935b1b5dc96ad49ff3489dea06be5c7b41d8a725e3720(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f295e4cd8bdfb815faf9f55535dd56b3581cb45cd5ca43bcfca6404a79c195b1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2a5f859925ae1d5d72159d16b4820455da52ceb89d5b3a0a4c67e0e34ae7f5c8(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__fc665b1289978656e0106bc5240deba506e4a466a219f387300f36656489d67a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__746523b64c6ae852885d2c05540b7bc2429a2eec7f9953135d850eb3d8a2e016(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d282f8c6b2deabe77ceed87e756d58fda598fdb7e5fed0d9ececb9a127d95e73(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c03e91d3cc467df7f3b6cece22da461b0400e820e330797818ba664efc99426b(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfigurationGroupConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__42817ef3617e9e949f6dd97186fba87cf0a63926841d4ee0c68d7b4e599759c1(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__83fe08ee36426fff0c7d5c5f3a072567cacd3c1263c33a2d6c02b01c51add114(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b06d5e3c2c5e557ca2c1e7b1c2b6987c753ebbb74ef5b2e25116943b2efe503d(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4dcf4c76c9005a468a0e971b5cd71bf1c0d2afb1e44ea1393fb43e5efc63c1e6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d6a6e318de8d92ed87d2a1f85d86191618f8e3e98667d6a247096eb583784fce(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0fa18f50333d1e076e98ea65c31756dcc2420e91651917f1ad01ff2cee9e7429(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__02a3c50ea0a06e23856d6171d1e99eea52985d255a5cafa1e7c3e4d9f3a732b7(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5d9d6098e9d8cdde85dcbe781633e447d21c446bab709cd3f9ab21eeb579372d(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__11288a36d7bb30aac291f9c8b9d40e99c20d041416af724112ce29e26a0739d9(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f45a29190120f3f6211b8d148cf29fe9bfe776ba105c55a15eb9f70e2728e578(
    *,
    issuer: builtins.str,
    entity_id_prefix: typing.Optional[builtins.str] = None,
    group_configuration: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration, typing.Dict[builtins.str, typing.Any]]]]] = None,
    token_selection: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a58547b84e10a5ad0c5201139be30c759ad7df20b975a50956e0e911b96b1b41(
    *,
    group_claim: builtins.str,
    group_entity_type: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ebd0c486d87ad35580bc384d2470562eadd77a009a9a33c9bed84e59197e568d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8d7d2cde31af2a8afb0a18e29a68297a7be9bd13e076561ac3aed7184236551c(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3c3f1022ff46a905b997e9add4e3503e1ee53bf373d99b28b77817e35f4c27f2(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__61266a9c21e3ca030f7a26b8dcd9b222fa9ca93c66604c8cc9905bdad58c7b7f(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__82f4fa9e23269a28c48a2191772bc3369d44184269794e7b630ac501817a5ee1(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bd2cb6e83f00d68cc485e1ed1ee80f09fc8fe7312754f284ab3fc2c0954a5d69(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8897296782df62a50c75e17d1965ca5342b78ceaa9f1cb7459aa9b9c0d0a6627(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__91b9b4283ec5f47b75e6b7f2bd73cf5633f9e10c038da2ef8241ed597f727716(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__308ede83ce1d05153c5d4b18eb0a45e141ec1f3f6e794fe4d9312e070a6578d8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__433deef100ec1a3e97daa5e84e7b008a58f4a5ccba7ac5eba91e5f1918c7d351(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aefe2a7df9cf9be84f29e3f1910f98a026e1be8f4b2866fcdff167ce40a25017(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4b74b77e7d62f9780e9b67eb5fde31c87e56a122c6f3aa78fb651e6e78fd4ab5(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e7e051adb73918c39377bb4099663d8fc0d7f2a13411e84ece9d590582ec9310(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__041d5dec36040fbf089449f6c3bc033a9742911ba545ac137d11707f7e5a6c9b(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35d4da746e63a443495e54afe80362f79ea7f0c71635e6c3ff7720005b4caa2c(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cd23d3ad014fff18ae7cb96a50f68cd5f7c33128a7ad6b3fce43c91c0f05e54f(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5929c65bfb656d1dd351e71f731c988ec57827ec689ef418764c1cbda2469fb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__562d93e32fe02d809b8f70ff2b098739de9fc6f9eff913995d53e2ac0c712382(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationGroupConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0be2eb2cdbfc836970ee3d81743790c0fc0b160ec4748409f3070f51d71be073(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__11e547548ef2d204cebd49d022a5a5a5002a0aa4bcd8190d015eb4a0f5958e51(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d9f20a6262d41576020ce71b42d8cd66222ab64675ce09cb474e394733c2e865(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e34a83e9e9fb6bbdd22ce6731adcb18443d2bd08b6313724841be4f3f3a6693(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8cb9194f03def08089cdfe41c11c10d6c2e1ada42cc1087465a396cfa2561781(
    *,
    access_token_only: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly, typing.Dict[builtins.str, typing.Any]]]]] = None,
    identity_token_only: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly, typing.Dict[builtins.str, typing.Any]]]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f5bb14ab5da90886b6ca4a11fe3c95a58164f55bce48eea576ee40cef0eb303a(
    *,
    audiences: typing.Optional[typing.Sequence[builtins.str]] = None,
    principal_id_claim: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__24ea93f9480ea07dffacf61eff620a217796249f33d822096fbb246ac5f645f4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__37442469a187caa9807f17989d04da5b43f05512285796dda895f5eb4ff129eb(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e6954eae28c3ae0ecb35d748b151f4d978b0eacbe283c313d2ec5fd0a0b9a7d0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3141ef49b99d4bd5dd42cbb5afe2b05fd9cf8aaaedc8ea2191c1c3adc6fac01d(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2ccb33c60d8ddd8abb4830b374ccc016eb880bcbf290e8c81280cfc429bd5918(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__cc74958c41e375680d69ee56d3a3ef29743e363854083996c482741d6bf8c57c(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f0b521e2958daa9502ecf1caffe79601f1de2cfa4cf72fad9f70745e48e50fcb(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c01c867017b2cf4de47961f4430ed923040b18db7e97315f10dbabd29becbf7(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__63488cf3fb0392511bbf7cce4bcbb529e3b6daaf66824e2a1f21f0335b96a8c0(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2823b47dc52541bcb4934cae69583b1c0ac0873a5cab07e71162e0a73d3cd621(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__169e954fed2cc1ce0e9b47a7a7d794b28ba900595c130e62f1022ddc04825d1e(
    *,
    client_ids: typing.Optional[typing.Sequence[builtins.str]] = None,
    principal_id_claim: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__29b35f3e0efd2ff19883bef17d23f454ae79f3c06be6bb8b13a60483e9e21b43(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3499768389f83acb2270421a36289fa0d7e7836d16dc733a4a335f82403dd274(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ddb14e90f5e87bec446b1bbecd0b75685a60b90bd478b511610273912d106414(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d70903440702b29062cb2c56695195c9759e574fd8a5142a7a70a25c7ad2eb36(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0c05659c174628064726c62c398fc8558def5f6066dff42a28ed3a7070047d3a(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ccdd962eca69aa209baa0187bbe3710b0eac9190c3d6ec581c68eddc2284ee7a(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__5c047480e68b70d0b420f4f581a7e8353dd179c7ad383806ac06bcad34554cb7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__455518b0406dc669cb7206ab13096ce50063933b95ef6c6b7632bb96c96fd8b2(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__8ce1803cb47eb0a03d675935b8561b938d9f48237a015a780df336967d44e9a9(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a530710b837c327228c5227b5ee4597c4623e4cb8611cc77b76dfd60228afdbd(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__229d44733226595f96c7b5984fcb15fc880b2e04430750afbe894e5e1031e35a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    wraps_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__99a13ca610d4efb238c944ee91eb48b1d8882628a9ce84f09bbdf5c2fd4e1111(
    index: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ea77795b3aa861fcbb39c55a22490ff6edddc89362489a1c324d6b92fae63025(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac0c89c6c904e771f11a2cedf885a722324b3528a445a2ffee2a734be6915430(
    value: _cdktf_9a9027ec.IInterpolatingParent,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c498c6a198ef8260d95d9bf2755abe12dd1de03cbf737ddfd7c6ed247ae374be(
    value: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b952535140e8158a89d47bc223802409c531be215cf9890b9d175a9f6ddd5b74(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, typing.List[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1bd910683153d8dc9cf3d736d73b7df6ee83fa8340f30e58af8f5e36da1d6657(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__36d355826fed3850702981a68a8da1180592735419d70f757a622b9dad1b5cb5(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionAccessTokenOnly, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__aeb2c9a3a83c7eba57a292bb92c7c747d2e0cf57e033a61888bb9118faa44b72(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelectionIdentityTokenOnly, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dcd1d41083a2afd2fbd2016929673c3de613719b1331d55bc0dcde648190afba(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfigurationTokenSelection]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__dae682ba41db0019c0771a92321b3ca059bde55c3e9547fa3a6d84447af99206(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
    complex_object_index: jsii.Number,
    complex_object_is_from_set: builtins.bool,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__e368983625cb57edaf9931e65ea5bc4f91748e5a34a2b22de401e83f5abfe121(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationCognitoUserPoolConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__272154a0c64b204f7c68ebaa930914ecbc368123acf7297bef2e7459e86245c0(
    value: typing.Union[_cdktf_9a9027ec.IResolvable, typing.Sequence[typing.Union[VerifiedpermissionsIdentitySourceConfigurationOpenIdConnectConfiguration, typing.Dict[builtins.str, typing.Any]]]],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__726068fca257f56bce78ccbdf920ad8e8c51b9f8443606cf28febf7b3d997264(
    value: typing.Optional[typing.Union[_cdktf_9a9027ec.IResolvable, VerifiedpermissionsIdentitySourceConfiguration]],
) -> None:
    """Type checking stubs"""
    pass
