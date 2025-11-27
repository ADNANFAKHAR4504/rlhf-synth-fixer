r'''
# `aws_sesv2_configuration_set`

Refer to the Terraform Registry for docs: [`aws_sesv2_configuration_set`](https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set).
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


class Sesv2ConfigurationSet(
    _cdktf_9a9027ec.TerraformResource,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSet",
):
    '''Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set aws_sesv2_configuration_set}.'''

    def __init__(
        self,
        scope: _constructs_77d1e7e8.Construct,
        id_: builtins.str,
        *,
        configuration_set_name: builtins.str,
        delivery_options: typing.Optional[typing.Union["Sesv2ConfigurationSetDeliveryOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        reputation_options: typing.Optional[typing.Union["Sesv2ConfigurationSetReputationOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        sending_options: typing.Optional[typing.Union["Sesv2ConfigurationSetSendingOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        suppression_options: typing.Optional[typing.Union["Sesv2ConfigurationSetSuppressionOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tracking_options: typing.Optional[typing.Union["Sesv2ConfigurationSetTrackingOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        vdm_options: typing.Optional[typing.Union["Sesv2ConfigurationSetVdmOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
        count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
        depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
        for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
        lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
        provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
        provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    ) -> None:
        '''Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set aws_sesv2_configuration_set} Resource.

        :param scope: The scope in which to define this construct.
        :param id_: The scoped construct ID. Must be unique amongst siblings in the same scope
        :param configuration_set_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#configuration_set_name Sesv2ConfigurationSet#configuration_set_name}.
        :param delivery_options: delivery_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#delivery_options Sesv2ConfigurationSet#delivery_options}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#id Sesv2ConfigurationSet#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param reputation_options: reputation_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#reputation_options Sesv2ConfigurationSet#reputation_options}
        :param sending_options: sending_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_options Sesv2ConfigurationSet#sending_options}
        :param suppression_options: suppression_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#suppression_options Sesv2ConfigurationSet#suppression_options}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags Sesv2ConfigurationSet#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags_all Sesv2ConfigurationSet#tags_all}.
        :param tracking_options: tracking_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tracking_options Sesv2ConfigurationSet#tracking_options}
        :param vdm_options: vdm_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#vdm_options Sesv2ConfigurationSet#vdm_options}
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__baf948822864700d7fc6debdb12e02e040f6844baedea13ddcb55b210f668f66)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument id_", value=id_, expected_type=type_hints["id_"])
        config = Sesv2ConfigurationSetConfig(
            configuration_set_name=configuration_set_name,
            delivery_options=delivery_options,
            id=id,
            reputation_options=reputation_options,
            sending_options=sending_options,
            suppression_options=suppression_options,
            tags=tags,
            tags_all=tags_all,
            tracking_options=tracking_options,
            vdm_options=vdm_options,
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
        '''Generates CDKTF code for importing a Sesv2ConfigurationSet resource upon running "cdktf plan ".

        :param scope: The scope in which to define this construct.
        :param import_to_id: The construct id used in the generated config for the Sesv2ConfigurationSet to import.
        :param import_from_id: The id of the existing Sesv2ConfigurationSet that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#import import section} in the documentation of this resource for the id to use
        :param provider: ? Optional instance of the provider where the Sesv2ConfigurationSet to import is found.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__2cec79268711dffee81eaf8b14e501e00640dc9b873ebc0ee0fed25e48d45ae0)
            check_type(argname="argument scope", value=scope, expected_type=type_hints["scope"])
            check_type(argname="argument import_to_id", value=import_to_id, expected_type=type_hints["import_to_id"])
            check_type(argname="argument import_from_id", value=import_from_id, expected_type=type_hints["import_from_id"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
        return typing.cast(_cdktf_9a9027ec.ImportableResource, jsii.sinvoke(cls, "generateConfigForImport", [scope, import_to_id, import_from_id, provider]))

    @jsii.member(jsii_name="putDeliveryOptions")
    def put_delivery_options(
        self,
        *,
        max_delivery_seconds: typing.Optional[jsii.Number] = None,
        sending_pool_name: typing.Optional[builtins.str] = None,
        tls_policy: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param max_delivery_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#max_delivery_seconds Sesv2ConfigurationSet#max_delivery_seconds}.
        :param sending_pool_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_pool_name Sesv2ConfigurationSet#sending_pool_name}.
        :param tls_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tls_policy Sesv2ConfigurationSet#tls_policy}.
        '''
        value = Sesv2ConfigurationSetDeliveryOptions(
            max_delivery_seconds=max_delivery_seconds,
            sending_pool_name=sending_pool_name,
            tls_policy=tls_policy,
        )

        return typing.cast(None, jsii.invoke(self, "putDeliveryOptions", [value]))

    @jsii.member(jsii_name="putReputationOptions")
    def put_reputation_options(
        self,
        *,
        reputation_metrics_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param reputation_metrics_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#reputation_metrics_enabled Sesv2ConfigurationSet#reputation_metrics_enabled}.
        '''
        value = Sesv2ConfigurationSetReputationOptions(
            reputation_metrics_enabled=reputation_metrics_enabled
        )

        return typing.cast(None, jsii.invoke(self, "putReputationOptions", [value]))

    @jsii.member(jsii_name="putSendingOptions")
    def put_sending_options(
        self,
        *,
        sending_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param sending_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_enabled Sesv2ConfigurationSet#sending_enabled}.
        '''
        value = Sesv2ConfigurationSetSendingOptions(sending_enabled=sending_enabled)

        return typing.cast(None, jsii.invoke(self, "putSendingOptions", [value]))

    @jsii.member(jsii_name="putSuppressionOptions")
    def put_suppression_options(
        self,
        *,
        suppressed_reasons: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param suppressed_reasons: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#suppressed_reasons Sesv2ConfigurationSet#suppressed_reasons}.
        '''
        value = Sesv2ConfigurationSetSuppressionOptions(
            suppressed_reasons=suppressed_reasons
        )

        return typing.cast(None, jsii.invoke(self, "putSuppressionOptions", [value]))

    @jsii.member(jsii_name="putTrackingOptions")
    def put_tracking_options(
        self,
        *,
        custom_redirect_domain: builtins.str,
        https_policy: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param custom_redirect_domain: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#custom_redirect_domain Sesv2ConfigurationSet#custom_redirect_domain}.
        :param https_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#https_policy Sesv2ConfigurationSet#https_policy}.
        '''
        value = Sesv2ConfigurationSetTrackingOptions(
            custom_redirect_domain=custom_redirect_domain, https_policy=https_policy
        )

        return typing.cast(None, jsii.invoke(self, "putTrackingOptions", [value]))

    @jsii.member(jsii_name="putVdmOptions")
    def put_vdm_options(
        self,
        *,
        dashboard_options: typing.Optional[typing.Union["Sesv2ConfigurationSetVdmOptionsDashboardOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        guardian_options: typing.Optional[typing.Union["Sesv2ConfigurationSetVdmOptionsGuardianOptions", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param dashboard_options: dashboard_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#dashboard_options Sesv2ConfigurationSet#dashboard_options}
        :param guardian_options: guardian_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#guardian_options Sesv2ConfigurationSet#guardian_options}
        '''
        value = Sesv2ConfigurationSetVdmOptions(
            dashboard_options=dashboard_options, guardian_options=guardian_options
        )

        return typing.cast(None, jsii.invoke(self, "putVdmOptions", [value]))

    @jsii.member(jsii_name="resetDeliveryOptions")
    def reset_delivery_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDeliveryOptions", []))

    @jsii.member(jsii_name="resetId")
    def reset_id(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetId", []))

    @jsii.member(jsii_name="resetReputationOptions")
    def reset_reputation_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReputationOptions", []))

    @jsii.member(jsii_name="resetSendingOptions")
    def reset_sending_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSendingOptions", []))

    @jsii.member(jsii_name="resetSuppressionOptions")
    def reset_suppression_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSuppressionOptions", []))

    @jsii.member(jsii_name="resetTags")
    def reset_tags(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTags", []))

    @jsii.member(jsii_name="resetTagsAll")
    def reset_tags_all(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTagsAll", []))

    @jsii.member(jsii_name="resetTrackingOptions")
    def reset_tracking_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTrackingOptions", []))

    @jsii.member(jsii_name="resetVdmOptions")
    def reset_vdm_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetVdmOptions", []))

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
    @jsii.member(jsii_name="deliveryOptions")
    def delivery_options(self) -> "Sesv2ConfigurationSetDeliveryOptionsOutputReference":
        return typing.cast("Sesv2ConfigurationSetDeliveryOptionsOutputReference", jsii.get(self, "deliveryOptions"))

    @builtins.property
    @jsii.member(jsii_name="reputationOptions")
    def reputation_options(
        self,
    ) -> "Sesv2ConfigurationSetReputationOptionsOutputReference":
        return typing.cast("Sesv2ConfigurationSetReputationOptionsOutputReference", jsii.get(self, "reputationOptions"))

    @builtins.property
    @jsii.member(jsii_name="sendingOptions")
    def sending_options(self) -> "Sesv2ConfigurationSetSendingOptionsOutputReference":
        return typing.cast("Sesv2ConfigurationSetSendingOptionsOutputReference", jsii.get(self, "sendingOptions"))

    @builtins.property
    @jsii.member(jsii_name="suppressionOptions")
    def suppression_options(
        self,
    ) -> "Sesv2ConfigurationSetSuppressionOptionsOutputReference":
        return typing.cast("Sesv2ConfigurationSetSuppressionOptionsOutputReference", jsii.get(self, "suppressionOptions"))

    @builtins.property
    @jsii.member(jsii_name="trackingOptions")
    def tracking_options(self) -> "Sesv2ConfigurationSetTrackingOptionsOutputReference":
        return typing.cast("Sesv2ConfigurationSetTrackingOptionsOutputReference", jsii.get(self, "trackingOptions"))

    @builtins.property
    @jsii.member(jsii_name="vdmOptions")
    def vdm_options(self) -> "Sesv2ConfigurationSetVdmOptionsOutputReference":
        return typing.cast("Sesv2ConfigurationSetVdmOptionsOutputReference", jsii.get(self, "vdmOptions"))

    @builtins.property
    @jsii.member(jsii_name="configurationSetNameInput")
    def configuration_set_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "configurationSetNameInput"))

    @builtins.property
    @jsii.member(jsii_name="deliveryOptionsInput")
    def delivery_options_input(
        self,
    ) -> typing.Optional["Sesv2ConfigurationSetDeliveryOptions"]:
        return typing.cast(typing.Optional["Sesv2ConfigurationSetDeliveryOptions"], jsii.get(self, "deliveryOptionsInput"))

    @builtins.property
    @jsii.member(jsii_name="idInput")
    def id_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "idInput"))

    @builtins.property
    @jsii.member(jsii_name="reputationOptionsInput")
    def reputation_options_input(
        self,
    ) -> typing.Optional["Sesv2ConfigurationSetReputationOptions"]:
        return typing.cast(typing.Optional["Sesv2ConfigurationSetReputationOptions"], jsii.get(self, "reputationOptionsInput"))

    @builtins.property
    @jsii.member(jsii_name="sendingOptionsInput")
    def sending_options_input(
        self,
    ) -> typing.Optional["Sesv2ConfigurationSetSendingOptions"]:
        return typing.cast(typing.Optional["Sesv2ConfigurationSetSendingOptions"], jsii.get(self, "sendingOptionsInput"))

    @builtins.property
    @jsii.member(jsii_name="suppressionOptionsInput")
    def suppression_options_input(
        self,
    ) -> typing.Optional["Sesv2ConfigurationSetSuppressionOptions"]:
        return typing.cast(typing.Optional["Sesv2ConfigurationSetSuppressionOptions"], jsii.get(self, "suppressionOptionsInput"))

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
    @jsii.member(jsii_name="trackingOptionsInput")
    def tracking_options_input(
        self,
    ) -> typing.Optional["Sesv2ConfigurationSetTrackingOptions"]:
        return typing.cast(typing.Optional["Sesv2ConfigurationSetTrackingOptions"], jsii.get(self, "trackingOptionsInput"))

    @builtins.property
    @jsii.member(jsii_name="vdmOptionsInput")
    def vdm_options_input(self) -> typing.Optional["Sesv2ConfigurationSetVdmOptions"]:
        return typing.cast(typing.Optional["Sesv2ConfigurationSetVdmOptions"], jsii.get(self, "vdmOptionsInput"))

    @builtins.property
    @jsii.member(jsii_name="configurationSetName")
    def configuration_set_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "configurationSetName"))

    @configuration_set_name.setter
    def configuration_set_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__b0c465117762dcb23713e840c41e22660b5d0854e3fecff45eb9efffc9e254f8)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "configurationSetName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="id")
    def id(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "id"))

    @id.setter
    def id(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__bdbc8ccaa649045fcf0b76a20cf2d23c0b9dda52e2bef0828cb86fbd400d21df)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "id", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tags")
    def tags(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tags"))

    @tags.setter
    def tags(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__102ddc0ff86c32b9d96a84fd0f4ddbf950c5aea3438ab911a1c016069ca4b877)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tags", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tagsAll")
    def tags_all(self) -> typing.Mapping[builtins.str, builtins.str]:
        return typing.cast(typing.Mapping[builtins.str, builtins.str], jsii.get(self, "tagsAll"))

    @tags_all.setter
    def tags_all(self, value: typing.Mapping[builtins.str, builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__60b74045d7c2064361dfe76e05ee505a1c37ee145289d2d5e5c2402f993e3aaa)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tagsAll", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetConfig",
    jsii_struct_bases=[_cdktf_9a9027ec.TerraformMetaArguments],
    name_mapping={
        "connection": "connection",
        "count": "count",
        "depends_on": "dependsOn",
        "for_each": "forEach",
        "lifecycle": "lifecycle",
        "provider": "provider",
        "provisioners": "provisioners",
        "configuration_set_name": "configurationSetName",
        "delivery_options": "deliveryOptions",
        "id": "id",
        "reputation_options": "reputationOptions",
        "sending_options": "sendingOptions",
        "suppression_options": "suppressionOptions",
        "tags": "tags",
        "tags_all": "tagsAll",
        "tracking_options": "trackingOptions",
        "vdm_options": "vdmOptions",
    },
)
class Sesv2ConfigurationSetConfig(_cdktf_9a9027ec.TerraformMetaArguments):
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
        configuration_set_name: builtins.str,
        delivery_options: typing.Optional[typing.Union["Sesv2ConfigurationSetDeliveryOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        id: typing.Optional[builtins.str] = None,
        reputation_options: typing.Optional[typing.Union["Sesv2ConfigurationSetReputationOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        sending_options: typing.Optional[typing.Union["Sesv2ConfigurationSetSendingOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        suppression_options: typing.Optional[typing.Union["Sesv2ConfigurationSetSuppressionOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
        tracking_options: typing.Optional[typing.Union["Sesv2ConfigurationSetTrackingOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        vdm_options: typing.Optional[typing.Union["Sesv2ConfigurationSetVdmOptions", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param connection: 
        :param count: 
        :param depends_on: 
        :param for_each: 
        :param lifecycle: 
        :param provider: 
        :param provisioners: 
        :param configuration_set_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#configuration_set_name Sesv2ConfigurationSet#configuration_set_name}.
        :param delivery_options: delivery_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#delivery_options Sesv2ConfigurationSet#delivery_options}
        :param id: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#id Sesv2ConfigurationSet#id}. Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2. If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        :param reputation_options: reputation_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#reputation_options Sesv2ConfigurationSet#reputation_options}
        :param sending_options: sending_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_options Sesv2ConfigurationSet#sending_options}
        :param suppression_options: suppression_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#suppression_options Sesv2ConfigurationSet#suppression_options}
        :param tags: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags Sesv2ConfigurationSet#tags}.
        :param tags_all: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags_all Sesv2ConfigurationSet#tags_all}.
        :param tracking_options: tracking_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tracking_options Sesv2ConfigurationSet#tracking_options}
        :param vdm_options: vdm_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#vdm_options Sesv2ConfigurationSet#vdm_options}
        '''
        if isinstance(lifecycle, dict):
            lifecycle = _cdktf_9a9027ec.TerraformResourceLifecycle(**lifecycle)
        if isinstance(delivery_options, dict):
            delivery_options = Sesv2ConfigurationSetDeliveryOptions(**delivery_options)
        if isinstance(reputation_options, dict):
            reputation_options = Sesv2ConfigurationSetReputationOptions(**reputation_options)
        if isinstance(sending_options, dict):
            sending_options = Sesv2ConfigurationSetSendingOptions(**sending_options)
        if isinstance(suppression_options, dict):
            suppression_options = Sesv2ConfigurationSetSuppressionOptions(**suppression_options)
        if isinstance(tracking_options, dict):
            tracking_options = Sesv2ConfigurationSetTrackingOptions(**tracking_options)
        if isinstance(vdm_options, dict):
            vdm_options = Sesv2ConfigurationSetVdmOptions(**vdm_options)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__91e943e622be3d7f9bc30909466601ec84283ee3aa28f87003b28b5e4360724a)
            check_type(argname="argument connection", value=connection, expected_type=type_hints["connection"])
            check_type(argname="argument count", value=count, expected_type=type_hints["count"])
            check_type(argname="argument depends_on", value=depends_on, expected_type=type_hints["depends_on"])
            check_type(argname="argument for_each", value=for_each, expected_type=type_hints["for_each"])
            check_type(argname="argument lifecycle", value=lifecycle, expected_type=type_hints["lifecycle"])
            check_type(argname="argument provider", value=provider, expected_type=type_hints["provider"])
            check_type(argname="argument provisioners", value=provisioners, expected_type=type_hints["provisioners"])
            check_type(argname="argument configuration_set_name", value=configuration_set_name, expected_type=type_hints["configuration_set_name"])
            check_type(argname="argument delivery_options", value=delivery_options, expected_type=type_hints["delivery_options"])
            check_type(argname="argument id", value=id, expected_type=type_hints["id"])
            check_type(argname="argument reputation_options", value=reputation_options, expected_type=type_hints["reputation_options"])
            check_type(argname="argument sending_options", value=sending_options, expected_type=type_hints["sending_options"])
            check_type(argname="argument suppression_options", value=suppression_options, expected_type=type_hints["suppression_options"])
            check_type(argname="argument tags", value=tags, expected_type=type_hints["tags"])
            check_type(argname="argument tags_all", value=tags_all, expected_type=type_hints["tags_all"])
            check_type(argname="argument tracking_options", value=tracking_options, expected_type=type_hints["tracking_options"])
            check_type(argname="argument vdm_options", value=vdm_options, expected_type=type_hints["vdm_options"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "configuration_set_name": configuration_set_name,
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
        if delivery_options is not None:
            self._values["delivery_options"] = delivery_options
        if id is not None:
            self._values["id"] = id
        if reputation_options is not None:
            self._values["reputation_options"] = reputation_options
        if sending_options is not None:
            self._values["sending_options"] = sending_options
        if suppression_options is not None:
            self._values["suppression_options"] = suppression_options
        if tags is not None:
            self._values["tags"] = tags
        if tags_all is not None:
            self._values["tags_all"] = tags_all
        if tracking_options is not None:
            self._values["tracking_options"] = tracking_options
        if vdm_options is not None:
            self._values["vdm_options"] = vdm_options

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
    def configuration_set_name(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#configuration_set_name Sesv2ConfigurationSet#configuration_set_name}.'''
        result = self._values.get("configuration_set_name")
        assert result is not None, "Required property 'configuration_set_name' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def delivery_options(
        self,
    ) -> typing.Optional["Sesv2ConfigurationSetDeliveryOptions"]:
        '''delivery_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#delivery_options Sesv2ConfigurationSet#delivery_options}
        '''
        result = self._values.get("delivery_options")
        return typing.cast(typing.Optional["Sesv2ConfigurationSetDeliveryOptions"], result)

    @builtins.property
    def id(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#id Sesv2ConfigurationSet#id}.

        Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
        If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
        '''
        result = self._values.get("id")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def reputation_options(
        self,
    ) -> typing.Optional["Sesv2ConfigurationSetReputationOptions"]:
        '''reputation_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#reputation_options Sesv2ConfigurationSet#reputation_options}
        '''
        result = self._values.get("reputation_options")
        return typing.cast(typing.Optional["Sesv2ConfigurationSetReputationOptions"], result)

    @builtins.property
    def sending_options(self) -> typing.Optional["Sesv2ConfigurationSetSendingOptions"]:
        '''sending_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_options Sesv2ConfigurationSet#sending_options}
        '''
        result = self._values.get("sending_options")
        return typing.cast(typing.Optional["Sesv2ConfigurationSetSendingOptions"], result)

    @builtins.property
    def suppression_options(
        self,
    ) -> typing.Optional["Sesv2ConfigurationSetSuppressionOptions"]:
        '''suppression_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#suppression_options Sesv2ConfigurationSet#suppression_options}
        '''
        result = self._values.get("suppression_options")
        return typing.cast(typing.Optional["Sesv2ConfigurationSetSuppressionOptions"], result)

    @builtins.property
    def tags(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags Sesv2ConfigurationSet#tags}.'''
        result = self._values.get("tags")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tags_all(self) -> typing.Optional[typing.Mapping[builtins.str, builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tags_all Sesv2ConfigurationSet#tags_all}.'''
        result = self._values.get("tags_all")
        return typing.cast(typing.Optional[typing.Mapping[builtins.str, builtins.str]], result)

    @builtins.property
    def tracking_options(
        self,
    ) -> typing.Optional["Sesv2ConfigurationSetTrackingOptions"]:
        '''tracking_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tracking_options Sesv2ConfigurationSet#tracking_options}
        '''
        result = self._values.get("tracking_options")
        return typing.cast(typing.Optional["Sesv2ConfigurationSetTrackingOptions"], result)

    @builtins.property
    def vdm_options(self) -> typing.Optional["Sesv2ConfigurationSetVdmOptions"]:
        '''vdm_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#vdm_options Sesv2ConfigurationSet#vdm_options}
        '''
        result = self._values.get("vdm_options")
        return typing.cast(typing.Optional["Sesv2ConfigurationSetVdmOptions"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Sesv2ConfigurationSetConfig(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetDeliveryOptions",
    jsii_struct_bases=[],
    name_mapping={
        "max_delivery_seconds": "maxDeliverySeconds",
        "sending_pool_name": "sendingPoolName",
        "tls_policy": "tlsPolicy",
    },
)
class Sesv2ConfigurationSetDeliveryOptions:
    def __init__(
        self,
        *,
        max_delivery_seconds: typing.Optional[jsii.Number] = None,
        sending_pool_name: typing.Optional[builtins.str] = None,
        tls_policy: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param max_delivery_seconds: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#max_delivery_seconds Sesv2ConfigurationSet#max_delivery_seconds}.
        :param sending_pool_name: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_pool_name Sesv2ConfigurationSet#sending_pool_name}.
        :param tls_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tls_policy Sesv2ConfigurationSet#tls_policy}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4915200ac6ef4e999bf0cd7cf4a0333095b123a1f40fc9d43e3783294a5c29da)
            check_type(argname="argument max_delivery_seconds", value=max_delivery_seconds, expected_type=type_hints["max_delivery_seconds"])
            check_type(argname="argument sending_pool_name", value=sending_pool_name, expected_type=type_hints["sending_pool_name"])
            check_type(argname="argument tls_policy", value=tls_policy, expected_type=type_hints["tls_policy"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if max_delivery_seconds is not None:
            self._values["max_delivery_seconds"] = max_delivery_seconds
        if sending_pool_name is not None:
            self._values["sending_pool_name"] = sending_pool_name
        if tls_policy is not None:
            self._values["tls_policy"] = tls_policy

    @builtins.property
    def max_delivery_seconds(self) -> typing.Optional[jsii.Number]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#max_delivery_seconds Sesv2ConfigurationSet#max_delivery_seconds}.'''
        result = self._values.get("max_delivery_seconds")
        return typing.cast(typing.Optional[jsii.Number], result)

    @builtins.property
    def sending_pool_name(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_pool_name Sesv2ConfigurationSet#sending_pool_name}.'''
        result = self._values.get("sending_pool_name")
        return typing.cast(typing.Optional[builtins.str], result)

    @builtins.property
    def tls_policy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#tls_policy Sesv2ConfigurationSet#tls_policy}.'''
        result = self._values.get("tls_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Sesv2ConfigurationSetDeliveryOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Sesv2ConfigurationSetDeliveryOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetDeliveryOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__a6589c491f8ebf1aaeae2a79ae9b9b357670001972d3a1bf3d428eca8961c58a)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetMaxDeliverySeconds")
    def reset_max_delivery_seconds(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetMaxDeliverySeconds", []))

    @jsii.member(jsii_name="resetSendingPoolName")
    def reset_sending_pool_name(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSendingPoolName", []))

    @jsii.member(jsii_name="resetTlsPolicy")
    def reset_tls_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetTlsPolicy", []))

    @builtins.property
    @jsii.member(jsii_name="maxDeliverySecondsInput")
    def max_delivery_seconds_input(self) -> typing.Optional[jsii.Number]:
        return typing.cast(typing.Optional[jsii.Number], jsii.get(self, "maxDeliverySecondsInput"))

    @builtins.property
    @jsii.member(jsii_name="sendingPoolNameInput")
    def sending_pool_name_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "sendingPoolNameInput"))

    @builtins.property
    @jsii.member(jsii_name="tlsPolicyInput")
    def tls_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "tlsPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="maxDeliverySeconds")
    def max_delivery_seconds(self) -> jsii.Number:
        return typing.cast(jsii.Number, jsii.get(self, "maxDeliverySeconds"))

    @max_delivery_seconds.setter
    def max_delivery_seconds(self, value: jsii.Number) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__329281dca6b3ce56dc3378a1983502f7680419f2f6e1b2ad56b04c77624fbc38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "maxDeliverySeconds", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="sendingPoolName")
    def sending_pool_name(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "sendingPoolName"))

    @sending_pool_name.setter
    def sending_pool_name(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__133c3245917520ceb404467bdb2fbe04c3818e5fa6a089c4e351b70e0b1be03b)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sendingPoolName", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="tlsPolicy")
    def tls_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "tlsPolicy"))

    @tls_policy.setter
    def tls_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0e2ea856b42caee1acc3b2bb6a6c60cfb55e476ea6ef2ee091a516901ea7dc29)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "tlsPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Sesv2ConfigurationSetDeliveryOptions]:
        return typing.cast(typing.Optional[Sesv2ConfigurationSetDeliveryOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Sesv2ConfigurationSetDeliveryOptions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__db686633f9a769a3751e9896ae427d1682280a167a146551adad2a05403d5d87)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetReputationOptions",
    jsii_struct_bases=[],
    name_mapping={"reputation_metrics_enabled": "reputationMetricsEnabled"},
)
class Sesv2ConfigurationSetReputationOptions:
    def __init__(
        self,
        *,
        reputation_metrics_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param reputation_metrics_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#reputation_metrics_enabled Sesv2ConfigurationSet#reputation_metrics_enabled}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__d36e1e8654a8a5ee47f01f43becb0cf7c87ba3461259cb29cb584c32ad123e41)
            check_type(argname="argument reputation_metrics_enabled", value=reputation_metrics_enabled, expected_type=type_hints["reputation_metrics_enabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if reputation_metrics_enabled is not None:
            self._values["reputation_metrics_enabled"] = reputation_metrics_enabled

    @builtins.property
    def reputation_metrics_enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#reputation_metrics_enabled Sesv2ConfigurationSet#reputation_metrics_enabled}.'''
        result = self._values.get("reputation_metrics_enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Sesv2ConfigurationSetReputationOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Sesv2ConfigurationSetReputationOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetReputationOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__547c09ac00314e3821bb4693e5d09b262a4e3711e923edefd7fda23503031b7e)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetReputationMetricsEnabled")
    def reset_reputation_metrics_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetReputationMetricsEnabled", []))

    @builtins.property
    @jsii.member(jsii_name="lastFreshStart")
    def last_fresh_start(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "lastFreshStart"))

    @builtins.property
    @jsii.member(jsii_name="reputationMetricsEnabledInput")
    def reputation_metrics_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "reputationMetricsEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="reputationMetricsEnabled")
    def reputation_metrics_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "reputationMetricsEnabled"))

    @reputation_metrics_enabled.setter
    def reputation_metrics_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6c3914a11f4da3c1ecd4f41944e2066d28c1e07f9c24a5c18c62199eaee6ad42)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "reputationMetricsEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Sesv2ConfigurationSetReputationOptions]:
        return typing.cast(typing.Optional[Sesv2ConfigurationSetReputationOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Sesv2ConfigurationSetReputationOptions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c4422d56c3ad507893deb8961bfb8d8baad9ecb2dccbd0ab0c9ea0242cd28d6a)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetSendingOptions",
    jsii_struct_bases=[],
    name_mapping={"sending_enabled": "sendingEnabled"},
)
class Sesv2ConfigurationSetSendingOptions:
    def __init__(
        self,
        *,
        sending_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
    ) -> None:
        '''
        :param sending_enabled: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_enabled Sesv2ConfigurationSet#sending_enabled}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__53afc795a7ef4c58aab652b2e4f931719c11bd3df6b2e8395e6772c8d8638caa)
            check_type(argname="argument sending_enabled", value=sending_enabled, expected_type=type_hints["sending_enabled"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if sending_enabled is not None:
            self._values["sending_enabled"] = sending_enabled

    @builtins.property
    def sending_enabled(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#sending_enabled Sesv2ConfigurationSet#sending_enabled}.'''
        result = self._values.get("sending_enabled")
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Sesv2ConfigurationSetSendingOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Sesv2ConfigurationSetSendingOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetSendingOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__294f24408ebb2de7e3147ee415231afc1d2d6ac70591a8d10734a6eda6e8abd6)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetSendingEnabled")
    def reset_sending_enabled(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSendingEnabled", []))

    @builtins.property
    @jsii.member(jsii_name="sendingEnabledInput")
    def sending_enabled_input(
        self,
    ) -> typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]]:
        return typing.cast(typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]], jsii.get(self, "sendingEnabledInput"))

    @builtins.property
    @jsii.member(jsii_name="sendingEnabled")
    def sending_enabled(
        self,
    ) -> typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]:
        return typing.cast(typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable], jsii.get(self, "sendingEnabled"))

    @sending_enabled.setter
    def sending_enabled(
        self,
        value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__3a9a57291175efb36edde213d7a2186e6006001da2baad42ca5114de1fcfb2a5)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "sendingEnabled", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Sesv2ConfigurationSetSendingOptions]:
        return typing.cast(typing.Optional[Sesv2ConfigurationSetSendingOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Sesv2ConfigurationSetSendingOptions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__88fe6e5ed3113075c1843d5fa4f229433ebfd0e7c8c0a26d5f031761d37c7a38)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetSuppressionOptions",
    jsii_struct_bases=[],
    name_mapping={"suppressed_reasons": "suppressedReasons"},
)
class Sesv2ConfigurationSetSuppressionOptions:
    def __init__(
        self,
        *,
        suppressed_reasons: typing.Optional[typing.Sequence[builtins.str]] = None,
    ) -> None:
        '''
        :param suppressed_reasons: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#suppressed_reasons Sesv2ConfigurationSet#suppressed_reasons}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__532e70133860c64a47f755db89b2932c0d2e4edcbfc604ba5e55c72a3fb37377)
            check_type(argname="argument suppressed_reasons", value=suppressed_reasons, expected_type=type_hints["suppressed_reasons"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if suppressed_reasons is not None:
            self._values["suppressed_reasons"] = suppressed_reasons

    @builtins.property
    def suppressed_reasons(self) -> typing.Optional[typing.List[builtins.str]]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#suppressed_reasons Sesv2ConfigurationSet#suppressed_reasons}.'''
        result = self._values.get("suppressed_reasons")
        return typing.cast(typing.Optional[typing.List[builtins.str]], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Sesv2ConfigurationSetSuppressionOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Sesv2ConfigurationSetSuppressionOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetSuppressionOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__3a9f429ddd3babaf2b1e265fca01362bac2d4291f54da1fefa8132d96ed3a7a7)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetSuppressedReasons")
    def reset_suppressed_reasons(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetSuppressedReasons", []))

    @builtins.property
    @jsii.member(jsii_name="suppressedReasonsInput")
    def suppressed_reasons_input(self) -> typing.Optional[typing.List[builtins.str]]:
        return typing.cast(typing.Optional[typing.List[builtins.str]], jsii.get(self, "suppressedReasonsInput"))

    @builtins.property
    @jsii.member(jsii_name="suppressedReasons")
    def suppressed_reasons(self) -> typing.List[builtins.str]:
        return typing.cast(typing.List[builtins.str], jsii.get(self, "suppressedReasons"))

    @suppressed_reasons.setter
    def suppressed_reasons(self, value: typing.List[builtins.str]) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__c21c33ab28426a6abed348ae942a7fc94a95efa16da45777fc86850c793f1100)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "suppressedReasons", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Sesv2ConfigurationSetSuppressionOptions]:
        return typing.cast(typing.Optional[Sesv2ConfigurationSetSuppressionOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Sesv2ConfigurationSetSuppressionOptions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__1a21f826376b4a3683aa89f95879b640337afe8fe304db0b4dfd45155cb21909)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetTrackingOptions",
    jsii_struct_bases=[],
    name_mapping={
        "custom_redirect_domain": "customRedirectDomain",
        "https_policy": "httpsPolicy",
    },
)
class Sesv2ConfigurationSetTrackingOptions:
    def __init__(
        self,
        *,
        custom_redirect_domain: builtins.str,
        https_policy: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param custom_redirect_domain: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#custom_redirect_domain Sesv2ConfigurationSet#custom_redirect_domain}.
        :param https_policy: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#https_policy Sesv2ConfigurationSet#https_policy}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__ecb932e4114a8ac77da41c87cb3b676a69a95976305f5ca41c3c36fe90f41d55)
            check_type(argname="argument custom_redirect_domain", value=custom_redirect_domain, expected_type=type_hints["custom_redirect_domain"])
            check_type(argname="argument https_policy", value=https_policy, expected_type=type_hints["https_policy"])
        self._values: typing.Dict[builtins.str, typing.Any] = {
            "custom_redirect_domain": custom_redirect_domain,
        }
        if https_policy is not None:
            self._values["https_policy"] = https_policy

    @builtins.property
    def custom_redirect_domain(self) -> builtins.str:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#custom_redirect_domain Sesv2ConfigurationSet#custom_redirect_domain}.'''
        result = self._values.get("custom_redirect_domain")
        assert result is not None, "Required property 'custom_redirect_domain' is missing"
        return typing.cast(builtins.str, result)

    @builtins.property
    def https_policy(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#https_policy Sesv2ConfigurationSet#https_policy}.'''
        result = self._values.get("https_policy")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Sesv2ConfigurationSetTrackingOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Sesv2ConfigurationSetTrackingOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetTrackingOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__21fb801d51a0141ac5915c71fd687e0f5d34edef29bff275f7b38fabf3bb0d3d)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="resetHttpsPolicy")
    def reset_https_policy(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetHttpsPolicy", []))

    @builtins.property
    @jsii.member(jsii_name="customRedirectDomainInput")
    def custom_redirect_domain_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "customRedirectDomainInput"))

    @builtins.property
    @jsii.member(jsii_name="httpsPolicyInput")
    def https_policy_input(self) -> typing.Optional[builtins.str]:
        return typing.cast(typing.Optional[builtins.str], jsii.get(self, "httpsPolicyInput"))

    @builtins.property
    @jsii.member(jsii_name="customRedirectDomain")
    def custom_redirect_domain(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "customRedirectDomain"))

    @custom_redirect_domain.setter
    def custom_redirect_domain(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__533f30ae97d1308735df8e7ff5f44e14adbd40cde47c138a1da7d5e0d673cf70)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "customRedirectDomain", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="httpsPolicy")
    def https_policy(self) -> builtins.str:
        return typing.cast(builtins.str, jsii.get(self, "httpsPolicy"))

    @https_policy.setter
    def https_policy(self, value: builtins.str) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__291f367c116e04f618733f3f24af4ded0db810b7aac450df841660a82e6c775e)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "httpsPolicy", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Sesv2ConfigurationSetTrackingOptions]:
        return typing.cast(typing.Optional[Sesv2ConfigurationSetTrackingOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Sesv2ConfigurationSetTrackingOptions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__6cc3f810de6b6fe3aae522b53453bca7a22c5ce90aa1779fdd0ac2db25fec783)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetVdmOptions",
    jsii_struct_bases=[],
    name_mapping={
        "dashboard_options": "dashboardOptions",
        "guardian_options": "guardianOptions",
    },
)
class Sesv2ConfigurationSetVdmOptions:
    def __init__(
        self,
        *,
        dashboard_options: typing.Optional[typing.Union["Sesv2ConfigurationSetVdmOptionsDashboardOptions", typing.Dict[builtins.str, typing.Any]]] = None,
        guardian_options: typing.Optional[typing.Union["Sesv2ConfigurationSetVdmOptionsGuardianOptions", typing.Dict[builtins.str, typing.Any]]] = None,
    ) -> None:
        '''
        :param dashboard_options: dashboard_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#dashboard_options Sesv2ConfigurationSet#dashboard_options}
        :param guardian_options: guardian_options block. Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#guardian_options Sesv2ConfigurationSet#guardian_options}
        '''
        if isinstance(dashboard_options, dict):
            dashboard_options = Sesv2ConfigurationSetVdmOptionsDashboardOptions(**dashboard_options)
        if isinstance(guardian_options, dict):
            guardian_options = Sesv2ConfigurationSetVdmOptionsGuardianOptions(**guardian_options)
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4ea98f6cc785ddae53b9014c04cd1e075786a93cb31ac19654cb924599f4e9b6)
            check_type(argname="argument dashboard_options", value=dashboard_options, expected_type=type_hints["dashboard_options"])
            check_type(argname="argument guardian_options", value=guardian_options, expected_type=type_hints["guardian_options"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if dashboard_options is not None:
            self._values["dashboard_options"] = dashboard_options
        if guardian_options is not None:
            self._values["guardian_options"] = guardian_options

    @builtins.property
    def dashboard_options(
        self,
    ) -> typing.Optional["Sesv2ConfigurationSetVdmOptionsDashboardOptions"]:
        '''dashboard_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#dashboard_options Sesv2ConfigurationSet#dashboard_options}
        '''
        result = self._values.get("dashboard_options")
        return typing.cast(typing.Optional["Sesv2ConfigurationSetVdmOptionsDashboardOptions"], result)

    @builtins.property
    def guardian_options(
        self,
    ) -> typing.Optional["Sesv2ConfigurationSetVdmOptionsGuardianOptions"]:
        '''guardian_options block.

        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#guardian_options Sesv2ConfigurationSet#guardian_options}
        '''
        result = self._values.get("guardian_options")
        return typing.cast(typing.Optional["Sesv2ConfigurationSetVdmOptionsGuardianOptions"], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Sesv2ConfigurationSetVdmOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


@jsii.data_type(
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetVdmOptionsDashboardOptions",
    jsii_struct_bases=[],
    name_mapping={"engagement_metrics": "engagementMetrics"},
)
class Sesv2ConfigurationSetVdmOptionsDashboardOptions:
    def __init__(
        self,
        *,
        engagement_metrics: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param engagement_metrics: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#engagement_metrics Sesv2ConfigurationSet#engagement_metrics}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__4737c283b3e1c602d84c0528f26bccadb616e76bb652552c2a5cba41beff1e59)
            check_type(argname="argument engagement_metrics", value=engagement_metrics, expected_type=type_hints["engagement_metrics"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if engagement_metrics is not None:
            self._values["engagement_metrics"] = engagement_metrics

    @builtins.property
    def engagement_metrics(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#engagement_metrics Sesv2ConfigurationSet#engagement_metrics}.'''
        result = self._values.get("engagement_metrics")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Sesv2ConfigurationSetVdmOptionsDashboardOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Sesv2ConfigurationSetVdmOptionsDashboardOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetVdmOptionsDashboardOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__00085aabe5692fd7381bc06c7f2ecbeb7694c49eb55a5cbad14d827f693a574d)
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
            type_hints = typing.get_type_hints(_typecheckingstub__601247a3958ab2e7a978bdaf978dad9da901a8efdbb2b2abc621a8ad4a49e2e1)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "engagementMetrics", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Sesv2ConfigurationSetVdmOptionsDashboardOptions]:
        return typing.cast(typing.Optional[Sesv2ConfigurationSetVdmOptionsDashboardOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Sesv2ConfigurationSetVdmOptionsDashboardOptions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__9fd013125ec1d854f54dd054192a35d9a0170ad641a4b856f13f0149f7889a63)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


@jsii.data_type(
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetVdmOptionsGuardianOptions",
    jsii_struct_bases=[],
    name_mapping={"optimized_shared_delivery": "optimizedSharedDelivery"},
)
class Sesv2ConfigurationSetVdmOptionsGuardianOptions:
    def __init__(
        self,
        *,
        optimized_shared_delivery: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param optimized_shared_delivery: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#optimized_shared_delivery Sesv2ConfigurationSet#optimized_shared_delivery}.
        '''
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__a51776e95444d0f55c73858c3849c72865b3b92222f6606456a79b5b3bef5951)
            check_type(argname="argument optimized_shared_delivery", value=optimized_shared_delivery, expected_type=type_hints["optimized_shared_delivery"])
        self._values: typing.Dict[builtins.str, typing.Any] = {}
        if optimized_shared_delivery is not None:
            self._values["optimized_shared_delivery"] = optimized_shared_delivery

    @builtins.property
    def optimized_shared_delivery(self) -> typing.Optional[builtins.str]:
        '''Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#optimized_shared_delivery Sesv2ConfigurationSet#optimized_shared_delivery}.'''
        result = self._values.get("optimized_shared_delivery")
        return typing.cast(typing.Optional[builtins.str], result)

    def __eq__(self, rhs: typing.Any) -> builtins.bool:
        return isinstance(rhs, self.__class__) and rhs._values == self._values

    def __ne__(self, rhs: typing.Any) -> builtins.bool:
        return not (rhs == self)

    def __repr__(self) -> str:
        return "Sesv2ConfigurationSetVdmOptionsGuardianOptions(%s)" % ", ".join(
            k + "=" + repr(v) for k, v in self._values.items()
        )


class Sesv2ConfigurationSetVdmOptionsGuardianOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetVdmOptionsGuardianOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__ac6421a6f68fefc35709f151865f8630d526ec3c24fff5371205acbaaac80269)
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
            type_hints = typing.get_type_hints(_typecheckingstub__39814f7e165f21d99235ccd3911fb84533a67e11d4cfb567c8b33a651a1d3769)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "optimizedSharedDelivery", value) # pyright: ignore[reportArgumentType]

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(
        self,
    ) -> typing.Optional[Sesv2ConfigurationSetVdmOptionsGuardianOptions]:
        return typing.cast(typing.Optional[Sesv2ConfigurationSetVdmOptionsGuardianOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Sesv2ConfigurationSetVdmOptionsGuardianOptions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__0127bf86b5986ad1086aa18d4b8b771daefb28e5630c8c691db0a0796fd7c9b4)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


class Sesv2ConfigurationSetVdmOptionsOutputReference(
    _cdktf_9a9027ec.ComplexObject,
    metaclass=jsii.JSIIMeta,
    jsii_type="aws.sesv2ConfigurationSet.Sesv2ConfigurationSetVdmOptionsOutputReference",
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
            type_hints = typing.get_type_hints(_typecheckingstub__485463f199772f2b2d7054bc4ae40d9f4d5d6e4afc7238f4a205282145bb5cf4)
            check_type(argname="argument terraform_resource", value=terraform_resource, expected_type=type_hints["terraform_resource"])
            check_type(argname="argument terraform_attribute", value=terraform_attribute, expected_type=type_hints["terraform_attribute"])
        jsii.create(self.__class__, self, [terraform_resource, terraform_attribute])

    @jsii.member(jsii_name="putDashboardOptions")
    def put_dashboard_options(
        self,
        *,
        engagement_metrics: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param engagement_metrics: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#engagement_metrics Sesv2ConfigurationSet#engagement_metrics}.
        '''
        value = Sesv2ConfigurationSetVdmOptionsDashboardOptions(
            engagement_metrics=engagement_metrics
        )

        return typing.cast(None, jsii.invoke(self, "putDashboardOptions", [value]))

    @jsii.member(jsii_name="putGuardianOptions")
    def put_guardian_options(
        self,
        *,
        optimized_shared_delivery: typing.Optional[builtins.str] = None,
    ) -> None:
        '''
        :param optimized_shared_delivery: Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#optimized_shared_delivery Sesv2ConfigurationSet#optimized_shared_delivery}.
        '''
        value = Sesv2ConfigurationSetVdmOptionsGuardianOptions(
            optimized_shared_delivery=optimized_shared_delivery
        )

        return typing.cast(None, jsii.invoke(self, "putGuardianOptions", [value]))

    @jsii.member(jsii_name="resetDashboardOptions")
    def reset_dashboard_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetDashboardOptions", []))

    @jsii.member(jsii_name="resetGuardianOptions")
    def reset_guardian_options(self) -> None:
        return typing.cast(None, jsii.invoke(self, "resetGuardianOptions", []))

    @builtins.property
    @jsii.member(jsii_name="dashboardOptions")
    def dashboard_options(
        self,
    ) -> Sesv2ConfigurationSetVdmOptionsDashboardOptionsOutputReference:
        return typing.cast(Sesv2ConfigurationSetVdmOptionsDashboardOptionsOutputReference, jsii.get(self, "dashboardOptions"))

    @builtins.property
    @jsii.member(jsii_name="guardianOptions")
    def guardian_options(
        self,
    ) -> Sesv2ConfigurationSetVdmOptionsGuardianOptionsOutputReference:
        return typing.cast(Sesv2ConfigurationSetVdmOptionsGuardianOptionsOutputReference, jsii.get(self, "guardianOptions"))

    @builtins.property
    @jsii.member(jsii_name="dashboardOptionsInput")
    def dashboard_options_input(
        self,
    ) -> typing.Optional[Sesv2ConfigurationSetVdmOptionsDashboardOptions]:
        return typing.cast(typing.Optional[Sesv2ConfigurationSetVdmOptionsDashboardOptions], jsii.get(self, "dashboardOptionsInput"))

    @builtins.property
    @jsii.member(jsii_name="guardianOptionsInput")
    def guardian_options_input(
        self,
    ) -> typing.Optional[Sesv2ConfigurationSetVdmOptionsGuardianOptions]:
        return typing.cast(typing.Optional[Sesv2ConfigurationSetVdmOptionsGuardianOptions], jsii.get(self, "guardianOptionsInput"))

    @builtins.property
    @jsii.member(jsii_name="internalValue")
    def internal_value(self) -> typing.Optional[Sesv2ConfigurationSetVdmOptions]:
        return typing.cast(typing.Optional[Sesv2ConfigurationSetVdmOptions], jsii.get(self, "internalValue"))

    @internal_value.setter
    def internal_value(
        self,
        value: typing.Optional[Sesv2ConfigurationSetVdmOptions],
    ) -> None:
        if __debug__:
            type_hints = typing.get_type_hints(_typecheckingstub__f6117cc2087e41d60a12431d4417084e452c2948e8338973697596f0084cd798)
            check_type(argname="argument value", value=value, expected_type=type_hints["value"])
        jsii.set(self, "internalValue", value) # pyright: ignore[reportArgumentType]


__all__ = [
    "Sesv2ConfigurationSet",
    "Sesv2ConfigurationSetConfig",
    "Sesv2ConfigurationSetDeliveryOptions",
    "Sesv2ConfigurationSetDeliveryOptionsOutputReference",
    "Sesv2ConfigurationSetReputationOptions",
    "Sesv2ConfigurationSetReputationOptionsOutputReference",
    "Sesv2ConfigurationSetSendingOptions",
    "Sesv2ConfigurationSetSendingOptionsOutputReference",
    "Sesv2ConfigurationSetSuppressionOptions",
    "Sesv2ConfigurationSetSuppressionOptionsOutputReference",
    "Sesv2ConfigurationSetTrackingOptions",
    "Sesv2ConfigurationSetTrackingOptionsOutputReference",
    "Sesv2ConfigurationSetVdmOptions",
    "Sesv2ConfigurationSetVdmOptionsDashboardOptions",
    "Sesv2ConfigurationSetVdmOptionsDashboardOptionsOutputReference",
    "Sesv2ConfigurationSetVdmOptionsGuardianOptions",
    "Sesv2ConfigurationSetVdmOptionsGuardianOptionsOutputReference",
    "Sesv2ConfigurationSetVdmOptionsOutputReference",
]

publication.publish()

def _typecheckingstub__baf948822864700d7fc6debdb12e02e040f6844baedea13ddcb55b210f668f66(
    scope: _constructs_77d1e7e8.Construct,
    id_: builtins.str,
    *,
    configuration_set_name: builtins.str,
    delivery_options: typing.Optional[typing.Union[Sesv2ConfigurationSetDeliveryOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    reputation_options: typing.Optional[typing.Union[Sesv2ConfigurationSetReputationOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    sending_options: typing.Optional[typing.Union[Sesv2ConfigurationSetSendingOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    suppression_options: typing.Optional[typing.Union[Sesv2ConfigurationSetSuppressionOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tracking_options: typing.Optional[typing.Union[Sesv2ConfigurationSetTrackingOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    vdm_options: typing.Optional[typing.Union[Sesv2ConfigurationSetVdmOptions, typing.Dict[builtins.str, typing.Any]]] = None,
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

def _typecheckingstub__2cec79268711dffee81eaf8b14e501e00640dc9b873ebc0ee0fed25e48d45ae0(
    scope: _constructs_77d1e7e8.Construct,
    import_to_id: builtins.str,
    import_from_id: builtins.str,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__b0c465117762dcb23713e840c41e22660b5d0854e3fecff45eb9efffc9e254f8(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__bdbc8ccaa649045fcf0b76a20cf2d23c0b9dda52e2bef0828cb86fbd400d21df(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__102ddc0ff86c32b9d96a84fd0f4ddbf950c5aea3438ab911a1c016069ca4b877(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__60b74045d7c2064361dfe76e05ee505a1c37ee145289d2d5e5c2402f993e3aaa(
    value: typing.Mapping[builtins.str, builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__91e943e622be3d7f9bc30909466601ec84283ee3aa28f87003b28b5e4360724a(
    *,
    connection: typing.Optional[typing.Union[typing.Union[_cdktf_9a9027ec.SSHProvisionerConnection, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.WinrmProvisionerConnection, typing.Dict[builtins.str, typing.Any]]]] = None,
    count: typing.Optional[typing.Union[jsii.Number, _cdktf_9a9027ec.TerraformCount]] = None,
    depends_on: typing.Optional[typing.Sequence[_cdktf_9a9027ec.ITerraformDependable]] = None,
    for_each: typing.Optional[_cdktf_9a9027ec.ITerraformIterator] = None,
    lifecycle: typing.Optional[typing.Union[_cdktf_9a9027ec.TerraformResourceLifecycle, typing.Dict[builtins.str, typing.Any]]] = None,
    provider: typing.Optional[_cdktf_9a9027ec.TerraformProvider] = None,
    provisioners: typing.Optional[typing.Sequence[typing.Union[typing.Union[_cdktf_9a9027ec.FileProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.LocalExecProvisioner, typing.Dict[builtins.str, typing.Any]], typing.Union[_cdktf_9a9027ec.RemoteExecProvisioner, typing.Dict[builtins.str, typing.Any]]]]] = None,
    configuration_set_name: builtins.str,
    delivery_options: typing.Optional[typing.Union[Sesv2ConfigurationSetDeliveryOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    id: typing.Optional[builtins.str] = None,
    reputation_options: typing.Optional[typing.Union[Sesv2ConfigurationSetReputationOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    sending_options: typing.Optional[typing.Union[Sesv2ConfigurationSetSendingOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    suppression_options: typing.Optional[typing.Union[Sesv2ConfigurationSetSuppressionOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    tags: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tags_all: typing.Optional[typing.Mapping[builtins.str, builtins.str]] = None,
    tracking_options: typing.Optional[typing.Union[Sesv2ConfigurationSetTrackingOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    vdm_options: typing.Optional[typing.Union[Sesv2ConfigurationSetVdmOptions, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4915200ac6ef4e999bf0cd7cf4a0333095b123a1f40fc9d43e3783294a5c29da(
    *,
    max_delivery_seconds: typing.Optional[jsii.Number] = None,
    sending_pool_name: typing.Optional[builtins.str] = None,
    tls_policy: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a6589c491f8ebf1aaeae2a79ae9b9b357670001972d3a1bf3d428eca8961c58a(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__329281dca6b3ce56dc3378a1983502f7680419f2f6e1b2ad56b04c77624fbc38(
    value: jsii.Number,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__133c3245917520ceb404467bdb2fbe04c3818e5fa6a089c4e351b70e0b1be03b(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0e2ea856b42caee1acc3b2bb6a6c60cfb55e476ea6ef2ee091a516901ea7dc29(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__db686633f9a769a3751e9896ae427d1682280a167a146551adad2a05403d5d87(
    value: typing.Optional[Sesv2ConfigurationSetDeliveryOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__d36e1e8654a8a5ee47f01f43becb0cf7c87ba3461259cb29cb584c32ad123e41(
    *,
    reputation_metrics_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__547c09ac00314e3821bb4693e5d09b262a4e3711e923edefd7fda23503031b7e(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6c3914a11f4da3c1ecd4f41944e2066d28c1e07f9c24a5c18c62199eaee6ad42(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c4422d56c3ad507893deb8961bfb8d8baad9ecb2dccbd0ab0c9ea0242cd28d6a(
    value: typing.Optional[Sesv2ConfigurationSetReputationOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__53afc795a7ef4c58aab652b2e4f931719c11bd3df6b2e8395e6772c8d8638caa(
    *,
    sending_enabled: typing.Optional[typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__294f24408ebb2de7e3147ee415231afc1d2d6ac70591a8d10734a6eda6e8abd6(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a9a57291175efb36edde213d7a2186e6006001da2baad42ca5114de1fcfb2a5(
    value: typing.Union[builtins.bool, _cdktf_9a9027ec.IResolvable],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__88fe6e5ed3113075c1843d5fa4f229433ebfd0e7c8c0a26d5f031761d37c7a38(
    value: typing.Optional[Sesv2ConfigurationSetSendingOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__532e70133860c64a47f755db89b2932c0d2e4edcbfc604ba5e55c72a3fb37377(
    *,
    suppressed_reasons: typing.Optional[typing.Sequence[builtins.str]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__3a9f429ddd3babaf2b1e265fca01362bac2d4291f54da1fefa8132d96ed3a7a7(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__c21c33ab28426a6abed348ae942a7fc94a95efa16da45777fc86850c793f1100(
    value: typing.List[builtins.str],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__1a21f826376b4a3683aa89f95879b640337afe8fe304db0b4dfd45155cb21909(
    value: typing.Optional[Sesv2ConfigurationSetSuppressionOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ecb932e4114a8ac77da41c87cb3b676a69a95976305f5ca41c3c36fe90f41d55(
    *,
    custom_redirect_domain: builtins.str,
    https_policy: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__21fb801d51a0141ac5915c71fd687e0f5d34edef29bff275f7b38fabf3bb0d3d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__533f30ae97d1308735df8e7ff5f44e14adbd40cde47c138a1da7d5e0d673cf70(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__291f367c116e04f618733f3f24af4ded0db810b7aac450df841660a82e6c775e(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__6cc3f810de6b6fe3aae522b53453bca7a22c5ce90aa1779fdd0ac2db25fec783(
    value: typing.Optional[Sesv2ConfigurationSetTrackingOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4ea98f6cc785ddae53b9014c04cd1e075786a93cb31ac19654cb924599f4e9b6(
    *,
    dashboard_options: typing.Optional[typing.Union[Sesv2ConfigurationSetVdmOptionsDashboardOptions, typing.Dict[builtins.str, typing.Any]]] = None,
    guardian_options: typing.Optional[typing.Union[Sesv2ConfigurationSetVdmOptionsGuardianOptions, typing.Dict[builtins.str, typing.Any]]] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__4737c283b3e1c602d84c0528f26bccadb616e76bb652552c2a5cba41beff1e59(
    *,
    engagement_metrics: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__00085aabe5692fd7381bc06c7f2ecbeb7694c49eb55a5cbad14d827f693a574d(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__601247a3958ab2e7a978bdaf978dad9da901a8efdbb2b2abc621a8ad4a49e2e1(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__9fd013125ec1d854f54dd054192a35d9a0170ad641a4b856f13f0149f7889a63(
    value: typing.Optional[Sesv2ConfigurationSetVdmOptionsDashboardOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__a51776e95444d0f55c73858c3849c72865b3b92222f6606456a79b5b3bef5951(
    *,
    optimized_shared_delivery: typing.Optional[builtins.str] = None,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__ac6421a6f68fefc35709f151865f8630d526ec3c24fff5371205acbaaac80269(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__39814f7e165f21d99235ccd3911fb84533a67e11d4cfb567c8b33a651a1d3769(
    value: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__0127bf86b5986ad1086aa18d4b8b771daefb28e5630c8c691db0a0796fd7c9b4(
    value: typing.Optional[Sesv2ConfigurationSetVdmOptionsGuardianOptions],
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__485463f199772f2b2d7054bc4ae40d9f4d5d6e4afc7238f4a205282145bb5cf4(
    terraform_resource: _cdktf_9a9027ec.IInterpolatingParent,
    terraform_attribute: builtins.str,
) -> None:
    """Type checking stubs"""
    pass

def _typecheckingstub__f6117cc2087e41d60a12431d4417084e452c2948e8338973697596f0084cd798(
    value: typing.Optional[Sesv2ConfigurationSetVdmOptions],
) -> None:
    """Type checking stubs"""
    pass
