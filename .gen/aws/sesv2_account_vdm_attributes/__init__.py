r'''
# `aws_sesv2_account_vdm_attributes`

Refer to the Terraform Registry for docs: [`aws_sesv2_account_vdm_attributes`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes).
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


class Sesv2AccountVdmAttributes(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sesv2AccountVdmAttributes.Sesv2AccountVdmAttributes",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes aws_sesv2_account_vdm_attributes}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        vdm_enabled: builtins.str,
        dashboard_attributes: typing.Optional[typing.Union["Sesv2AccountVdmAttributesDashboardAttributes", typing.Dict[builtins.str, typing.Any]]] = None,
        guardian_attributes: typing.Optional[typing.Union["Sesv2AccountVdmAttributesGuardianAttributes", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes aws_sesv2_account_vdm_attributes} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param vdm_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#vdm_enabled Sesv2AccountVdmAttributes#vdm_enabled}.
        :param dashboard_attributes: dashboard_attributes block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#dashboard_attributes Sesv2AccountVdmAttributes#dashboard_attributes}
        :param guardian_attributes: guardian_attributes block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#guardian_attributes Sesv2AccountVdmAttributes#guardian_attributes}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#id Sesv2AccountVdmAttributes#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c65a48da5b6243a47fee2d05f342303e2ea6494c0ad5192385499c0c38864cb0)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = Sesv2AccountVdmAttributesConfig(
            vdm_enabled=vdm_enabled,
            dashboard_attributes=dashboard_attributes,
            guardian_attributes=guardian_attributes,
            id=id,
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
        '''Generates CDKTF code for importing a Sesv2AccountVdmAttributes resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Sesv2AccountVdmAttributes to import.
        :param import_from_id: The id of the existing Sesv2AccountVdmAttributes that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Sesv2AccountVdmAttributes to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__5b72d980014cece574c148463a94a242676017a9c0c0805846bb5e6056584115)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putDashboardAttributes")
    def put_dashboard_attributes(
        self,
        *,
        engagement_metrics: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param engagement_metrics: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#engagement_metrics Sesv2AccountVdmAttributes#engagement_metrics}.
        '''
        value = Sesv2AccountVdmAttributesDashboardAttributes(
            engagement_metrics=engagement_metrics
        )

        return typing.cast(None, jsii.invoke(self, "putDashboardAttributes", [value]))

    @jsii.member(jsii_name="putGuardianAttributes")
    def put_guardian_attributes(
        self,
        *,
        optimized_shared_delivery: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param optimized_shared_delivery: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#optimized_shared_delivery Sesv2AccountVdmAttributes#optimized_shared_delivery}.
        '''
        value = Sesv2AccountVdmAttributesGuardianAttributes(
            optimized_shared_delivery=optimized_shared_delivery
        )

        return typing.cast(None, jsii.invoke(self, "putGuardianAttributes", [value]))

    @jsii.member(jsii_name="resetDashboardAttributes")
    def reset_dashboard_attributes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDashboardAttributes", []))

    @jsii.member(jsii_name="resetGuardianAttributes")
    def reset_guardian_attributes(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGuardianAttributes", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

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
    @jsii.member(jsii_name="dashboardAttributes")
    def dashboard_attributes(
        self,
    ) -> "Sesv2AccountVdmAttributesDashboardAttributesOutputReference":
        return typing.cast("Sesv2AccountVdmAttributesDashboardAttributesOutputReference", jsii.get(self, "dashboardAttributes"))

    @builtins.property
    @jsii.member(jsii_name="guardianAttributes")
    def guardian_attributes(
        self,
    ) -> "Sesv2AccountVdmAttributesGuardianAttributesOutputReference":
        return typing.cast("Sesv2AccountVdmAttributesGuardianAttributesOutputReference", jsii.get(self, "guardianAttributes"))

    @builtins.property
    @jsii.member(jsii_name="dashboardAttributesInput")
    def dashboard_attributes_input(
        self,
    ) -> typing.Optional["Sesv2AccountVdmAttributesDashboardAttributes"]:
        return typing.cast(typing.Optional["Sesv2AccountVdmAttributesDashboardAttributes"], jsii.get(self, "dashboardAttributesInput"))

    @builtins.property
    @jsii.member(jsii_name="guardianAttributesInput")
    def guardian_attributes_input(
        self,
    ) -> typing.Optional["Sesv2AccountVdmAttributesGuardianAttributes"]:
        return typing.cast(typing.Optional["Sesv2AccountVdmAttributesGuardianAttributes"], jsii.get(self, "guardianAttributesInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="vdmEnabledInput")
    def vdm_enabled_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "vdmEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__35c59bd4a879f6b8fc2863f435420d61261bef808becef1269a6d698952ee919)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="vdmEnabled")
    def vdm_enabled(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "vdmEnabled"))

    @vdm_enabled.setter
    def vdm_enabled(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a61e04a3adda096d4d8ce92e4404345a890f3c960e45b000bd8de4a62392b281)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "vdmEnabled", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sesv2AccountVdmAttributes.Sesv2AccountVdmAttributesConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "vdm_enabled": "vdmEnabled",
        "dashboard_attributes": "dashboardAttributes",
        "guardian_attributes": "guardianAttributes",
        "id": "id",
    },
)
class Sesv2AccountVdmAttributesConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        vdm_enabled: builtins.str,
        dashboard_attributes: typing.Optional[typing.Union["Sesv2AccountVdmAttributesDashboardAttributes", typing.Dict[builtins.str, typing.Any]]] = None,
        guardian_attributes: typing.Optional[typing.Union["Sesv2AccountVdmAttributesGuardianAttributes", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param vdm_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#vdm_enabled Sesv2AccountVdmAttributes#vdm_enabled}.
        :param dashboard_attributes: dashboard_attributes block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#dashboard_attributes Sesv2AccountVdmAttributes#dashboard_attributes}
        :param guardian_attributes: guardian_attributes block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#guardian_attributes Sesv2AccountVdmAttributes#guardian_attributes}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#id Sesv2AccountVdmAttributes#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(dashboard_attributes, dict):
            dashboard_attributes = Sesv2AccountVdmAttributesDashboardAttributes(**dashboard_attributes)
        if isinstance(guardian_attributes, dict):
            guardian_attributes = Sesv2AccountVdmAttributesGuardianAttributes(**guardian_attributes)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f1f4ff0b3f1c5f736868ae660360c61fc14eb570fe60e9fb95ce69d253260db1)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument vdm_enabled", value=vdm_enabled, expected_type=type_hints["vdm_enabled"])
            check_type(argname="argument dashboard_attributes", value=dashboard_attributes, expected_type=type_hints["dashboard_attributes"])
            check_type(argname="argument guardian_attributes", value=guardian_attributes, expected_type=type_hints["guardian_attributes"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "vdm_enabled": vdm_enabled,
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
        if dashboard_attributes is not None:
            self._values["dashboard_attributes"] = dashboard_attributes
        if guardian_attributes is not None:
            self._values["guardian_attributes"] = guardian_attributes
        if id is not None:
            self._values["id"] = id

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
    def vdm_enabled(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#vdm_enabled Sesv2AccountVdmAttributes#vdm_enabled}.'''
        result = self._values.get("vdm_enabled")
        assert result is not None, "Required property 'vdm_enabled' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def dashboard_attributes(
        self,
    ) -> typing.Optional["Sesv2AccountVdmAttributesDashboardAttributes"]:
        '''dashboard_attributes block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#dashboard_attributes Sesv2AccountVdmAttributes#dashboard_attributes}
        '''
        result = self._values.get("dashboard_attributes")
        return typing.cast(typing.Optional["Sesv2AccountVdmAttributesDashboardAttributes"], result)

    @builtins.property
    def guardian_attributes(
        self,
    ) -> typing.Optional["Sesv2AccountVdmAttributesGuardianAttributes"]:
        '''guardian_attributes block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#guardian_attributes Sesv2AccountVdmAttributes#guardian_attributes}
        '''
        result = self._values.get("guardian_attributes")
        return typing.cast(typing.Optional["Sesv2AccountVdmAttributesGuardianAttributes"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#id Sesv2AccountVdmAttributes#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Sesv2AccountVdmAttributesConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sesv2AccountVdmAttributes.Sesv2AccountVdmAttributesDashboardAttributes",
    jsii_struct_bases=[],
    name_mapping={"engagement_metrics": "engagementMetrics"},
)
class Sesv2AccountVdmAttributesDashboardAttributes:
    def __init__(
        self,
        *,
        engagement_metrics: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param engagement_metrics: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#engagement_metrics Sesv2AccountVdmAttributes#engagement_metrics}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__7584d4867a7e196ed905a38c471917a3b3beac0463176d521de19869aabed6de)
            check_type(argname="argument engagement_metrics", value=engagement_metrics, expected_type=type_hints["engagement_metrics"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if engagement_metrics is not None:
            self._values["engagement_metrics"] = engagement_metrics

    @builtins.property
    def engagement_metrics(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#engagement_metrics Sesv2AccountVdmAttributes#engagement_metrics}.'''
        result = self._values.get("engagement_metrics")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Sesv2AccountVdmAttributesDashboardAttributes(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Sesv2AccountVdmAttributesDashboardAttributesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sesv2AccountVdmAttributes.Sesv2AccountVdmAttributesDashboardAttributesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__2d8c94187fe8485308e733123409c5a309d5c4c6ba63f114e0a27c78e9331125)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetEngagementMetrics")
    def reset_engagement_metrics(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetEngagementMetrics", []))

    @builtins.property
    @jsii.member(jsii_name="engagementMetricsInput")
    def engagement_metrics_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "engagementMetricsInput"))

    @builtins.property
    @jsii.member(jsii_name="engagementMetrics")
    def engagement_metrics(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "engagementMetrics"))

    @engagement_metrics.setter
    def engagement_metrics(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__75da2c19da54cd423e929eab2edc35663f7a640e406e56b90f5fc50d3576da15)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "engagementMetrics", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Sesv2AccountVdmAttributesDashboardAttributes]:
        return typing.cast(typing.Optional[Sesv2AccountVdmAttributesDashboardAttributes], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Sesv2AccountVdmAttributesDashboardAttributes],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db3c5fca8c3930554a13591b2e20c643a65d0a5fb6ffa7ef2baf6e7234af5bde)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sesv2AccountVdmAttributes.Sesv2AccountVdmAttributesGuardianAttributes",
    jsii_struct_bases=[],
    name_mapping={"optimized_shared_delivery": "optimizedSharedDelivery"},
)
class Sesv2AccountVdmAttributesGuardianAttributes:
    def __init__(
        self,
        *,
        optimized_shared_delivery: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param optimized_shared_delivery: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#optimized_shared_delivery Sesv2AccountVdmAttributes#optimized_shared_delivery}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1baedc24a88604310892db2351987ae43977a6b429f279cf6ed6a530d6eb41e4)
            check_type(argname="argument optimized_shared_delivery", value=optimized_shared_delivery, expected_type=type_hints["optimized_shared_delivery"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if optimized_shared_delivery is not None:
            self._values["optimized_shared_delivery"] = optimized_shared_delivery

    @builtins.property
    def optimized_shared_delivery(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_account_vdm_attributes#optimized_shared_delivery Sesv2AccountVdmAttributes#optimized_shared_delivery}.'''
        result = self._values.get("optimized_shared_delivery")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Sesv2AccountVdmAttributesGuardianAttributes(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Sesv2AccountVdmAttributesGuardianAttributesOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sesv2AccountVdmAttributes.Sesv2AccountVdmAttributesGuardianAttributesOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__9a670c6d46ae4779d49c4e0fe2eb89942b73f0d02af6259c660ebce3fcfc198c)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetOptimizedSharedDelivery")
    def reset_optimized_shared_delivery(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetOptimizedSharedDelivery", []))

    @builtins.property
    @jsii.member(jsii_name="optimizedSharedDeliveryInput")
    def optimized_shared_delivery_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "optimizedSharedDeliveryInput"))

    @builtins.property
    @jsii.member(jsii_name="optimizedSharedDelivery")
    def optimized_shared_delivery(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "optimizedSharedDelivery"))

    @optimized_shared_delivery.setter
    def optimized_shared_delivery(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1fa52198c60a47df3b2371655264096db38cdb1b914f48ded0809923084ebccc)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "optimizedSharedDelivery", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Sesv2AccountVdmAttributesGuardianAttributes]:
        return typing.cast(typing.Optional[Sesv2AccountVdmAttributesGuardianAttributes], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Sesv2AccountVdmAttributesGuardianAttributes],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0846706bda5d6f07e653b20543a1d1967c418711767823e4ce95f2206ca7c34d)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Sesv2AccountVdmAttributes",
    "Sesv2AccountVdmAttributesConfig",
    "Sesv2AccountVdmAttributesDashboardAttributes",
    "Sesv2AccountVdmAttributesDashboardAttributesOutputReference",
    "Sesv2AccountVdmAttributesGuardianAttributes",
    "Sesv2AccountVdmAttributesGuardianAttributesOutputReference",
]

publication.publish()

def _typecheckingstub__c65a48da5b6243a47fee2d05f342303e2ea6494c0ad5192385499c0c38864cb0(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    vdm_enabled: builtins.str,
    dashboard_attributes: typing.Optional[typing.Union[Sesv2AccountVdmAttributesDashboardAttributes, typing.Dict[builtins.str, typing.Any]]] = None,
    guardian_attributes: typing.Optional[typing.Union[Sesv2AccountVdmAttributesGuardianAttributes, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
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

def _typecheckingstub__5b72d980014cece574c148463a94a242676017a9c0c0805846bb5e6056584115(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__35c59bd4a879f6b8fc2863f435420d61261bef808becef1269a6d698952ee919(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a61e04a3adda096d4d8ce92e4404345a890f3c960e45b000bd8de4a62392b281(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f1f4ff0b3f1c5f736868ae660360c61fc14eb570fe60e9fb95ce69d253260db1(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    vdm_enabled: builtins.str,
    dashboard_attributes: typing.Optional[typing.Union[Sesv2AccountVdmAttributesDashboardAttributes, typing.Dict[builtins.str, typing.Any]]] = None,
    guardian_attributes: typing.Optional[typing.Union[Sesv2AccountVdmAttributesGuardianAttributes, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__7584d4867a7e196ed905a38c471917a3b3beac0463176d521de19869aabed6de(
    *,
    engagement_metrics: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__2d8c94187fe8485308e733123409c5a309d5c4c6ba63f114e0a27c78e9331125(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__75da2c19da54cd423e929eab2edc35663f7a640e406e56b90f5fc50d3576da15(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db3c5fca8c3930554a13591b2e20c643a65d0a5fb6ffa7ef2baf6e7234af5bde(
    value: typing.Optional[Sesv2AccountVdmAttributesDashboardAttributes],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1baedc24a88604310892db2351987ae43977a6b429f279cf6ed6a530d6eb41e4(
    *,
    optimized_shared_delivery: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9a670c6d46ae4779d49c4e0fe2eb89942b73f0d02af6259c660ebce3fcfc198c(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1fa52198c60a47df3b2371655264096db38cdb1b914f48ded0809923084ebccc(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0846706bda5d6f07e653b20543a1d1967c418711767823e4ce95f2206ca7c34d(
    value: typing.Optional[Sesv2AccountVdmAttributesGuardianAttributes],
) -> None:
    """Type checking stubs"""
    pass
